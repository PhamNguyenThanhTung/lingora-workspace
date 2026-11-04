/**
 * public-journey.mjs — Learner journey helper for Slice 12 public acceptance.
 *
 * Usage:
 *   node public-journey.mjs
 *
 * Reads:
 *   tmp/slice12-public-acceptance/ready-provenance.json
 *   tmp/slice12-public-acceptance/mode0600-private.json  (0600)
 *   tmp/slice12-public-acceptance/auth-private.json      (0600, registered+confirmed required)
 *   plans/evidence/slice-12-public-acceptance/before-registration.json  (root-supplied baseline)
 *
 * Writes:
 *   plans/evidence/slice-12-public-acceptance/public-journey.json
 *
 * What it proves:
 *   1. Confirmed provider identity exists, no Account yet.
 *   2. Temporarily enables owned curriculum (restores on failure too).
 *   3. Normal password login → ACTIVE LEARNER Account bootstrapped + exactly 1 bootstrap audit.
 *   4. Product UI creates DEFAULT learning context.
 *   5. Idempotent context creation replay.
 *   6. First lesson reading start (POST + response + persisted consumption check).
 *   7. Practice start (exact attempt.lessonRevisionId + active exercise usable).
 *   8. Deterministic 7-group history snapshot before Pause.
 *   9. Pause → paused context rejects new learning start (403).
 *  10. Deterministic 7-group history snapshot while Paused (verified equal to before Pause).
 *  11. Resume → deterministic 7-group snapshot after Resume (verified equal to before Pause).
 *  12. Retained S11 baseline unchanged.
 *  13. Product logout.
 *
 * Database access: read-only snapshots in repeatable-read transactions.
 * Curriculum write (enable/restore) uses a guarded transaction; rolls back on error.
 * Credentials loaded from lingora-admin/.env (never echoed).
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {config as loadEnv} from 'dotenv';
import pg from 'pg';
import {chromium} from 'playwright';
import {
  FULL_HISTORY_TABLES,
  historyQueryFor,
  safeErrorCategory,
  isReadingConsumptionRequest,
  validateReadingConsumptionDto,
  compareHistorySnapshots,
  compareRetainedS11Baseline,
  captureRetainedS11Snapshot,
} from './helpers-testable.mjs';

// ── Constants ────────────────────────────────────────────────────────────────
const CANONICAL_LEARNER_ORIGIN = 'https://lingora-learner-dev.vercel.app';

// ── Helpers ──────────────────────────────────────────────────────────────────
function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    throw Object.assign(new Error('Failed to read JSON'), {name: 'SyntaxError'});
  }
}

export async function runJourney(options = {}) {
  const rootDir = options.rootDir || process.env.SLICE12_ROOT_DIR || '.';
  const evRoot = path.join(rootDir, 'plans/evidence/slice-12-public-acceptance');
  const provenanceFile = path.join(rootDir, 'tmp/slice12-public-acceptance/ready-provenance.json');
  const privateInFile = path.join(rootDir, 'tmp/slice12-public-acceptance/mode0600-private.json');
  const authPrivateFile = path.join(rootDir, 'tmp/slice12-public-acceptance/auth-private.json');
  const baselineFile = path.join(evRoot, 'before-registration.json');
  const evidenceFile = path.join(evRoot, 'public-journey.json');

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  let head;
  try {
    head = execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
  } catch {
    head = 'unknown';
  }
  const provenance = readJSON(provenanceFile);
  assert.equal(provenance.commit,      head,                      'HEAD ≠ provenance commit');
  assert.equal(provenance.ready,       true,                      'provenance not ready');
  assert.equal(provenance.learnerBase, CANONICAL_LEARNER_ORIGIN,  'learnerBase mismatch');

  const privateIn  = readJSON(privateInFile);
  assert.ok(privateIn.label.startsWith('DEV_S12_PUBLIC_'), 'label prefix mismatch');

  const authPrivate = readJSON(authPrivateFile);
  assert.ok(authPrivate.registered,  'Not registered');
  assert.ok(authPrivate.confirmed,   'Not confirmed');

  const baseline = readJSON(baselineFile);
assert.equal(baseline.identity.length, 0, 'baseline shows existing identity — preflight required');
assert.equal(baseline.course.is_active, false, 'baseline course already active');

const courseId = baseline.course.id;
// First lesson is Lesson 1 at position 1
const lessonId = '75d84614-050c-400a-8d06-de92a1418d67';
const originalLesson = baseline.lessons.find(l => l.id === lessonId);
assert.ok(originalLesson, 'lesson not found in baseline');
assert.equal(originalLesson.availability, 'PLANNED', 'lesson not PLANNED in baseline');

const base = CANONICAL_LEARNER_ORIGIN;

// ── Database ─────────────────────────────────────────────────────────────────
loadEnv({path: 'lingora-admin/.env', quiet: true});
const ref = process.env.SUPABASE_DEV_PROJECT_REF;
assert.ok(ref, 'SUPABASE_DEV_PROJECT_REF not set');
const rawDbUrl = process.env.DATABASE_URL;
assert.ok(rawDbUrl && rawDbUrl.includes(ref), 'DATABASE_URL missing or wrong ref');
assert.ok(process.env.NEXT_PUBLIC_SUPABASE_URL?.includes(ref), 'NEXT_PUBLIC_SUPABASE_URL ref mismatch');

const dbUrl = new URL(rawDbUrl);
for (const p of ['schema', 'sslmode']) dbUrl.searchParams.delete(p);

const db = new pg.Client({
  connectionString:        dbUrl.toString(),
  ssl:                     {rejectUnauthorized: false},
  connectionTimeoutMillis: 10_000,
  statement_timeout:       20_000,
});

// ── Evidence ─────────────────────────────────────────────────────────────────
fs.mkdirSync('plans/evidence/slice-12-public-acceptance', {recursive: true});
const evidence = {
  sourceCommit:  head,
  status:        'RUNNING',
  checks:        {},
  http:          [],
  cleanup:       {},
  fixtures:      {courseId, lessonId},
};
const checkpoint = () =>
  fs.writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2) + '\n');
const check = key => { evidence.checks[key] = true; checkpoint(); console.log('PASS ' + key); };

// ── RO transaction wrapper ───────────────────────────────────────────────────
async function ro(fn) {
  await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try {
    const v = await fn();
    await db.query('COMMIT');
    return v;
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  }
}

// ── Full 7-group history snapshot for this context/learner ──────────────────
async function fullHistory(ctxId, lrnId) {
  return ro(async () => {
    const result = {};
    for (const table of FULL_HISTORY_TABLES) {
      const q = historyQueryFor(table, {contextId: ctxId, learnerId: lrnId});
      const rows = (await db.query(q.sql, q.params)).rows.map(r => r.row);
      result[table] = rows;
    }
    return result;
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
let browser, page;
let learnerId, contextId;
let contentChanged = false;
let step = 'connect';

try {
  await db.connect();

  // 1. Confirm provider identity exists and is confirmed; no Account yet
  step = 'identity check';
  const identity = (
    await ro(() => db.query(
      `SELECT u.id, u.email_confirmed_at,
              u.raw_user_meta_data->>'display_name' AS owned_label,
              a.id AS account_id
       FROM auth.users u
       LEFT JOIN app.accounts a ON a.id = u.id
       WHERE lower(u.email) = lower($1)`,
      [privateIn.email]
    ))
  ).rows;

  assert.equal(identity.length, 1, 'Expected exactly one confirmed identity');
  assert.ok(identity[0].email_confirmed_at, 'Identity not confirmed');
  assert.equal(identity[0].account_id, null, 'Account already exists before journey');
  assert.equal(identity[0].owned_label, privateIn.label, 'Label mismatch');
  learnerId = identity[0].id;
  evidence.fixtures.learnerId = learnerId;
  check('confirmed_provider_identity_without_operator_account');

  // 2. Temporarily enable owned curriculum
  step = 'owned curriculum setup';
  await db.query('BEGIN');
  try {
    const c = await db.query(
      'UPDATE app.courses SET is_active=true WHERE id=$1 AND is_active=false AND names=$2::jsonb RETURNING id',
      [courseId, JSON.stringify(baseline.course.names)]
    );
    assert.equal(c.rowCount, 1, 'Course enable failed or already active');

    const l = await db.query(
      `UPDATE app.lessons SET availability='AVAILABLE'
       WHERE id=$1 AND availability='PLANNED' AND active_revision_id=$2 RETURNING id`,
      [lessonId, originalLesson.active_revision_id]
    );
    assert.equal(l.rowCount, 1, 'Lesson enable failed or unexpected state');

    await db.query('COMMIT');
    contentChanged = true;
    evidence.fixturePrepared = true;
    checkpoint();
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  }

  // 3. Launch browser with existing signup storage state (confirmed session)
  browser = await chromium.launch({headless: true, args: ['--no-sandbox']});
  assert.ok(authPrivate.storageState, 'storageState required for confirmed session');
  const ctx = await browser.newContext({storageState: authPrivate.storageState});
  page = await ctx.newPage();
  page.setDefaultTimeout(30_000);

  // Track product API responses (safe path/status only)
  page.on('response', r => {
    const u = new URL(r.url());
    if (u.origin === base && u.pathname.startsWith('/api/') && u.pathname !== '/api/auth/register') {
      evidence.http.push({path: u.pathname, method: r.request().method(), status: r.status()});
      checkpoint();
    }
  });

  // 4. Normal password login → ACTIVE LEARNER Account bootstrapped
  step = 'normal password login';
  await page.goto(base + '/login');
  await page.locator('#loginEmail').fill(privateIn.email);
  await page.locator('#loginPassword').fill(privateIn.password);

  const loginResponsePromise = page.waitForResponse(
    r => new URL(r.url()).pathname === '/api/auth/login' && r.request().method() === 'POST'
  );
  await page.locator('#loginPassword').press('Enter');
  const loginResponse = await loginResponsePromise;
  assert.equal(loginResponse.status(), 200, 'Login returned non-200');
  await page.waitForURL('**/home');

  const account = (
    await ro(() => db.query(
      'SELECT role, status FROM app.accounts WHERE id=$1',
      [learnerId]
    ))
  ).rows[0];
  assert.deepEqual(account, {role: 'LEARNER', status: 'ACTIVE'},
    'Account not bootstrapped as ACTIVE LEARNER');

  // Verify exactly one correct bootstrap audit after normal login
  const bootstrapAudits = (
    await ro(() => db.query(
      `SELECT id, action, actor_kind, actor_id, verified_auth_subject_id, target_id
       FROM app_private.audit_events
       WHERE verified_auth_subject_id = $1 ORDER BY id`,
      [learnerId]
    ))
  ).rows;
  assert.equal(bootstrapAudits.length, 1, 'Expected exactly one bootstrap audit event after normal login');
  assert.equal(bootstrapAudits[0].action, 'LEARNER_BOOTSTRAPPED');
  assert.equal(bootstrapAudits[0].actor_kind, 'VERIFIED_AUTH_SUBJECT');
  assert.equal(bootstrapAudits[0].target_id, learnerId);
  assert.equal(bootstrapAudits[0].verified_auth_subject_id, learnerId);
  check('normal_login_bootstraps_fixed_learner_account_and_audit');

  // 5. Product UI creates DEFAULT learning context
  step = 'product context create';
  await page.locator('#createContextForm').waitFor();
  await page.locator('#createLanguageSelect').selectOption(baseline.course.language_id);
  await page.locator('#createCourseSelect').selectOption(courseId);
  await page.locator('#startSourceDefault').check();

  const createdResponsePromise = page.waitForResponse(
    r => new URL(r.url()).pathname === '/api/learner/context' && r.request().method() === 'POST'
  );
  await page.locator('#submitCreateContextBtn').click();
  const createResponse = await createdResponsePromise;
  assert.equal(createResponse.status(), 201, 'Context creation returned non-201');

  const payload = createResponse.request().postDataJSON();
  contextId = payload.contextId;
  evidence.fixtures.contextId = contextId;

  const contextRow = (
    await ro(() => db.query(
      `SELECT learner_id, language_id, course_id, status,
              selected_start_level_id, working_level_id, start_source
       FROM app.learning_contexts WHERE id=$1`,
      [contextId]
    ))
  ).rows[0];
  assert.equal(contextRow.learner_id,              learnerId,  'learner_id mismatch');
  assert.equal(contextRow.course_id,               courseId,   'course_id mismatch');
  assert.equal(contextRow.status,                  'ACTIVE',   'context not ACTIVE');
  assert.equal(contextRow.start_source,            'DEFAULT',  'start_source not DEFAULT');
  assert.equal(contextRow.selected_start_level_id, contextRow.working_level_id,
    'selected_start_level_id ≠ working_level_id');
  assert.ok(contextRow.working_level_id, 'working_level_id not set');
  evidence.initialContext = contextRow;
  check('product_ui_creates_owned_active_level_context');

  // 6. Idempotent replay (same contextId → 201, different contextId with invalid source → 400)
  const api = async (path, method = 'GET', data, expected = 200) => {
    const r = await page.request.fetch(base + path, {
      method,
      ...(method === 'GET' ? {} : {
        headers: {Origin: base, 'Content-Type': 'application/json'},
        data,
      }),
    });
    assert.equal(r.status(), expected, `${method} ${path} expected ${expected}, got ${r.status()}`);
    return r.json();
  };

  await api('/api/learner/context', 'POST', payload, 201);
  const contextCount = Number(
    (await ro(() => db.query(
      'SELECT count(*) FROM app.learning_contexts WHERE learner_id=$1',
      [learnerId]
    ))).rows[0].count
  );
  assert.equal(contextCount, 1, 'Idempotent replay created a second context');
  check('exact_create_replay_has_one_context');

  await api('/api/learner/context', 'POST', {
    ...payload, contextId: randomUUID(), startSource: 'PLACEMENT',
  }, 400);
  check('invalid_start_source_rejected');

  // 7. First lesson reading start + persisted consumption check
  step = 'first lesson reading start';
  await page.locator(`#enterContextBtn-${contextId}`).click();
  await page.locator('#catalogueView').waitFor();
  await page.locator(`#lessonLink-${lessonId}`).click();
  await page.locator('#lessonPlayerView').waitFor();

  const readingResponsePromise = page.waitForResponse(
    r => isReadingConsumptionRequest(r.url(), r.request().method(), contextId, lessonId)
  );
  await page.locator('#startReadingBtn').click();
  const readingResponse = await readingResponsePromise;
  assert.ok(readingResponse.ok(), 'Reading start POST failed');

  const readingBody = await readingResponse.json();
  const validDto = validateReadingConsumptionDto(readingBody?.data, {
    contextId,
    lessonId,
    lessonRevisionId: originalLesson.active_revision_id,
  });
  assert.ok(validDto.valid, validDto.reason || 'Reading DTO validation failed');

  // Verify persisted consumption in DB
  const consumptionInDb = (
    await ro(() => db.query(
      `SELECT id, context_id, lesson_id, lesson_revision_id, completed_at
       FROM app.lesson_consumptions
       WHERE context_id = $1 AND lesson_id = $2`,
      [contextId, lessonId]
    ))
  ).rows;
  assert.equal(consumptionInDb.length, 1, 'Persisted consumption not found in DB');
  assert.equal(consumptionInDb[0].context_id, contextId, 'Persisted consumption context_id mismatch');
  assert.equal(consumptionInDb[0].lesson_id, lessonId, 'Persisted consumption lesson_id mismatch');
  assert.equal(consumptionInDb[0].lesson_revision_id, originalLesson.active_revision_id,
    'Persisted consumption lesson_revision_id mismatch');
  assert.equal(consumptionInDb[0].completed_at, null, 'Active reading consumption completed_at must be null');
  check('actual_first_lesson_reading_result_and_persisted_consumption');

  // 8. Practice start + exact revision + usable exercise
  step = 'practice start';
  const startedResponsePromise = page.waitForResponse(
    r => new URL(r.url()).pathname.endsWith('/attempts') && r.request().method() === 'POST'
  );
  await page.locator('#startPracticeBtn').click();
  const attemptResponse = await startedResponsePromise;
  assert.ok(attemptResponse.ok(), 'Attempt creation failed');

  const attemptBody = await attemptResponse.json();
  const attempt = attemptBody.data;
  assert.equal(attempt.contextId, contextId, 'Attempt contextId mismatch');
  assert.equal(attempt.lessonId,  lessonId,  'Attempt lessonId mismatch');
  assert.equal(attempt.lessonRevisionId, originalLesson.active_revision_id,
    'Attempt lessonRevisionId does not match originalLesson.active_revision_id');

  await page.locator('#activePracticeBox').waitFor({state: 'visible'});
  assert.ok(await page.locator('#queueProgressLabel').isVisible(), 'active exercise queueProgressLabel not visible');
  evidence.fixtures.attemptId = attempt.id;
  check('actual_practice_start_with_exact_revision_and_usable_exercise');

  // 9. Full deterministic 7-group history snapshot before Pause
  evidence.historyBeforePause = await fullHistory(contextId, learnerId);
  checkpoint();

  // 10. Pause
  step = 'pause';
  await page.goto(base + '/home');
  await page.locator(`#pauseBtn-${contextId}`).click();
  await page.locator(`#resumeBtn-${contextId}`).waitFor();

  // Snapshot while paused & compare against before Pause
  evidence.historyWhilePaused = await fullHistory(contextId, learnerId);
  const pauseCmp = compareHistorySnapshots(evidence.historyBeforePause, evidence.historyWhilePaused);
  assert.ok(pauseCmp.equal, pauseCmp.reason || 'History unexpectedly changed while paused');
  checkpoint();

  // Paused context rejects new learning start (403)
  await api(
    `/api/learner/contexts/${contextId}/lessons/${lessonId}/attempts`,
    'POST',
    {attemptId: randomUUID(), expectedPublishedRevisionId: originalLesson.active_revision_id},
    403
  );
  check('paused_context_rejects_learning_start');

  // 11. Resume → 7-group snapshot unchanged → active practice still navigable
  step = 'resume';
  await page.locator(`#resumeBtn-${contextId}`).click();
  await page.locator(`#pauseBtn-${contextId}`).waitFor();

  evidence.historyAfterResume = await fullHistory(contextId, learnerId);
  const resumeCmp = compareHistorySnapshots(evidence.historyBeforePause, evidence.historyAfterResume);
  assert.ok(resumeCmp.equal, resumeCmp.reason || 'History changed between Pause and Resume');
  checkpoint();

  await page.locator(`#enterContextBtn-${contextId}`).click();
  await page.locator(`#lessonLink-${lessonId}`).click();
  await page.locator('#activePracticeBox').waitFor();
  check('resume_preserves_reading_and_existing_attempt');

  // 12. Query the complete retained scope, including initially empty groups.
  const retainedS11Rows = await captureRetainedS11Snapshot(db, baseline.retainedS11Scope);
  const s11Check = compareRetainedS11Baseline(retainedS11Rows, baseline.retainedS11Baseline);
  assert.ok(s11Check.equal, s11Check.reason || 'Retained S11 baseline changed during journey');
  evidence.retainedS11BaselinePreserved = true;

  evidence.status = 'PASS';

} catch (e) {
  const safe = safeErrorCategory(e);
  evidence.status  = 'FAIL';
  evidence.failure = {step, name: safe.name, category: safe.category};
  console.error(JSON.stringify(evidence.failure));
  process.exitCode = 1;

} finally {
  const errors = [];

  // Product logout
  if (page) {
    try {
      const r = await page.request.post(base + '/api/auth/logout', {headers: {Origin: base}});
      assert.equal(r.status(), 200, 'Logout non-200');
      evidence.cleanup.productLogout = true;
    } catch { errors.push('product logout'); }
  }

  try { await browser?.close(); evidence.cleanup.browserClosed = true; } catch { errors.push('browser close'); }

  // Restore curriculum if it was changed (even on failure)
  if (contentChanged) {
    try {
      await db.query('BEGIN');
      await db.query(
        `UPDATE app.lessons SET availability=$2 WHERE id=$1 AND active_revision_id=$3`,
        [lessonId, originalLesson.availability, originalLesson.active_revision_id]
      );
      await db.query(
        `UPDATE app.courses SET is_active=$2 WHERE id=$1 AND names=$3::jsonb`,
        [courseId, baseline.course.is_active, JSON.stringify(baseline.course.names)]
      );
      await db.query('COMMIT');
      evidence.cleanup.runtimeFixtureRestored = true;
    } catch (e) {
      await db.query('ROLLBACK').catch(() => {});
      const safe = safeErrorCategory(e);
      errors.push(`curriculum restore: ${safe.category}`);
    }
  }

  evidence.cleanup.pendingIndependentReadOnlyReviewAndScopedCleanup = true;
  evidence.cleanup.errors = errors;
  if (errors.length) { evidence.status = 'FAIL'; process.exitCode = 1; }
  checkpoint();
  await db.end().catch(() => {});

    console.log(JSON.stringify({
      status:  evidence.status,
      checks:  evidence.checks,
      http:    evidence.http,
      cleanup: evidence.cleanup,
    }));
  }
}

if (process.argv[1] && process.argv[1].endsWith('public-journey.mjs')) {
  try {
    await runJourney();
  } catch (topErr) {
    const safe = safeErrorCategory(topErr);
    console.error(JSON.stringify({status: 'FAIL', step: 'bootstrap', name: safe.name, category: safe.category}));
    process.exitCode = 1;
  }
}
