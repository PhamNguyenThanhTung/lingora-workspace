/**
 * preflight-readonly.mjs — Read-only preflight snapshot for Slice 12 public acceptance.
 *
 * Usage:
 *   node preflight-readonly.mjs
 *
 * Reads:
 *   tmp/slice12-public-acceptance/ready-provenance.json  (root-supplied)
 *   lingora-admin/.env  (Supabase credentials — never echoed)
 *   plans/evidence/slice-11/public/final-cleanup-readonly.json (if available, for S11 baseline)
 *
 * Writes:
 *   plans/evidence/slice-12-public-acceptance/before-registration.json
 *   plans/evidence/slice-12-public-acceptance/provider-before.json
 *
 * What it checks (all read-only, repeatable-read):
 *   - Identity absence for the declared email (from ready-provenance.json).
 *     FAILS immediately if identity already exists.
 *   - Other accounts snapshot (for unchanged baseline later).
 *   - Owned curriculum course + lessons + fullRuntimeSnapshot.
 *   - Retained S11 baseline (attempts, responses, completions, cards, reviews, receipts).
 *   - Auth sessions count for subject.
 *   - provider-before: existing Auth flow_state index (for diff after cleanup).
 *   - Previous owned subject IDs from provenance (for cleanup scoping).
 *
 * This file must be run by Root before registration.
 * Email is loaded from provenance (which Root controls), not from mode0600-private.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {config as loadEnv} from 'dotenv';
import pg from 'pg';
import {
  checkIdentityPreflight,
  safeErrorCategory,
  captureRetainedS11Snapshot,
} from './helpers-testable.mjs';

// ── Constants ────────────────────────────────────────────────────────────────
const COURSE_ID  = '62f30613-6bf7-48cb-bc94-448a9736a178';
const LESSON_IDS = [
  '4ad4b82e-5398-4505-b335-5aef7185cd03',
  '75d84614-050c-400a-8d06-de92a1418d67',
];
const S11_CLEANUP_FILE = 'plans/evidence/slice-11/public/final-cleanup-readonly.json';

function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    throw Object.assign(new Error('Failed to read JSON'), {name: 'SyntaxError'});
  }
}

export async function runPreflight(options = {}) {
  const rootDir = options.rootDir || process.env.SLICE12_ROOT_DIR || '.';
  const evRoot = path.join(rootDir, 'plans/evidence/slice-12-public-acceptance');
  const provenanceFile = path.join(rootDir, 'tmp/slice12-public-acceptance/ready-provenance.json');
  const baselineFile = path.join(evRoot, 'before-registration.json');
  const providerFile = path.join(evRoot, 'provider-before.json');
  const s11CleanupFile = path.join(rootDir, S11_CLEANUP_FILE);

  let head;
  try {
    head = execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
  } catch {
    head = 'unknown';
  }

  const provenance = readJSON(provenanceFile);
  assert.equal(provenance.commit, head, 'HEAD ≠ provenance commit');
  assert.equal(provenance.ready,  true, 'provenance not ready');
  assert.ok(typeof provenance.runLabel === 'string' && provenance.runLabel.startsWith('DEV_S12_PUBLIC_'),
    'ready-provenance.json must include runLabel starting with DEV_S12_PUBLIC_');

  const registrationEmail = provenance.registrationEmail;
  assert.ok(typeof registrationEmail === 'string' && registrationEmail.includes('@'),
    'ready-provenance.json must include registrationEmail field');

  // Database Client Setup
  let db = options.dbClient;
  let ownsDb = false;

  if (!db) {
    loadEnv({path: path.join(rootDir, 'lingora-admin/.env'), quiet: true});
    const ref = options.env?.SUPABASE_DEV_PROJECT_REF || process.env.SUPABASE_DEV_PROJECT_REF;
    assert.ok(ref, 'SUPABASE_DEV_PROJECT_REF not set');
    const rawDbUrl = options.env?.DATABASE_URL || process.env.DATABASE_URL;
    assert.ok(rawDbUrl?.includes(ref), 'DATABASE_URL missing or wrong ref');

    const dbUrl = new URL(rawDbUrl);
    for (const p of ['schema', 'sslmode']) dbUrl.searchParams.delete(p);

    db = new pg.Client({
      connectionString:        dbUrl.toString(),
      ssl:                     {rejectUnauthorized: false},
      connectionTimeoutMillis: 10_000,
      statement_timeout:       20_000,
    });
    ownsDb = true;
  }

  fs.mkdirSync(evRoot, {recursive: true});

  try {
    if (ownsDb) await db.connect();
    await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');

    // Identity absence — MUST FAIL if identity already exists
    const identity = (await db.query(
      `SELECT u.id, u.email_confirmed_at, u.raw_user_meta_data->>'display_name' AS label
       FROM auth.users u WHERE lower(u.email) = lower($1)`,
      [registrationEmail]
    )).rows;

    const identityCheck = checkIdentityPreflight(identity);
    assert.ok(identityCheck.allowed, identityCheck.reason || 'identity check failed');

    // Learning contexts / counts for existing subjects with this email (should be none)
    const existingSubjectIds = identity.map(r => r.id);
    const counts = {
      lesson_consumptions: 0,
      lesson_attempts:     0,
      lesson_completions:  0,
      srs_cards:           0,
    };

    // Other accounts
    const otherAccounts = (await db.query(
      'SELECT id, role, status, row_version::text, updated_at FROM app.accounts ORDER BY id'
    )).rows;

    // Sessions
    const sessions = 0;

    // Owned curriculum
    const course = (await db.query(
      'SELECT id, language_id, framework_id, is_active, names, default_start_level_id FROM app.courses WHERE id=$1',
      [COURSE_ID]
    )).rows[0];
    assert.ok(course, 'Owned course not found');

    const lessons = (await db.query(
      'SELECT id, availability, active_revision_id FROM app.lessons WHERE id = ANY($1::uuid[]) ORDER BY id',
      [LESSON_IDS]
    )).rows;
    assert.equal(lessons.length, LESSON_IDS.length, 'Not all expected lessons found');

    // Full runtime snapshot
    const fullRuntimeSnapshot = {
      course: (await db.query(
        'SELECT to_jsonb(c)::text AS row FROM app.courses c WHERE id=$1', [COURSE_ID]
      )).rows,
      lessons: (await db.query(
        'SELECT to_jsonb(l)::text AS row FROM app.lessons l WHERE id = ANY($1::uuid[]) ORDER BY id',
        [LESSON_IDS]
      )).rows,
    };

    // Retained S11 baseline snapshot (all 7 actual groups)
    assert.ok(fs.existsSync(s11CleanupFile), 'S11 cleanup baseline file not found');
    const s11 = JSON.parse(fs.readFileSync(s11CleanupFile, 'utf8'));
    const extractIds = list => (list || []).map(r => (typeof r === 'string' ? r : r.id)).filter(Boolean);

    const retainedS11Scope = {
      contextIds: extractIds(s11.contexts),
      learnerIds: extractIds(s11.accounts?.filter(a => a.role === 'LEARNER')),
    };
    const retainedS11Baseline = await captureRetainedS11Snapshot(db, retainedS11Scope);

    // Assert expected counts from S11
    assert.equal(retainedS11Baseline.attempts.length, 4, 'expected 4 retained attempts');
    assert.equal(retainedS11Baseline.responses.length, 19, 'expected 19 retained responses');
    assert.equal(retainedS11Baseline.completions.length, 1, 'expected 1 retained completion');
    assert.equal(retainedS11Baseline.cards.length, 1, 'expected 1 retained card');
    assert.equal(retainedS11Baseline.receipts.length, 2, 'expected 2 retained receipts');
    assert.equal(retainedS11Baseline.consumptions.length, 0, 'expected 0 retained consumptions');
    assert.equal(retainedS11Baseline.srs_review_operations.length, 0, 'expected 0 retained srs_review_operations');

    // Provider flow_state index (for cleanup diff)
    const flowIndex = (await db.query(
      'SELECT id, user_id, authentication_method, provider_type FROM auth.flow_state ORDER BY id'
    )).rows;

    const previousIds = provenance.previousOwnedSubjectIds || [];

    await db.query('COMMIT');

    // Write baseline with strict recipient, runLabel, and commit binding
    const baseline = {
      at:                  new Date().toISOString(),
      readOnly:            true,
      sourceCommit:        head,
      registrationEmail,
      runLabel:            provenance.runLabel,
      identity,
      contexts:            [],
      counts,
      audits:              [],
      course,
      lessons,
      sessions,
      otherAccounts,
      fullRuntimeSnapshot,
      retainedS11Scope,
      retainedS11Baseline,
    };
    fs.writeFileSync(baselineFile, JSON.stringify(baseline, null, 2) + '\n', {mode: 0o600});
    fs.chmodSync(baselineFile, 0o600);

    // Write provider-before
    const providerBefore = {
      at:          new Date().toISOString(),
      readOnly:    true,
      flowIndex,
      previousIds,
    };
    fs.writeFileSync(providerFile, JSON.stringify(providerBefore, null, 2) + '\n');

    const out = {
      status:         'PASS',
      sourceCommit:   head,
      recipientBound: true,
      runLabel:       provenance.runLabel,
      identityCount:  identity.length,
      flowStateCount: flowIndex.length,
      courseIsActive: course.is_active,
      lessonsFound:   lessons.length,
      retainedS11Count: Object.values(retainedS11Baseline).reduce((sum, arr) => sum + (arr?.length || 0), 0),
    };
    console.log(JSON.stringify(out));
    return out;

  } catch (e) {
    await db?.query('ROLLBACK').catch(() => {});
    const safe = safeErrorCategory(e);
    console.error(JSON.stringify({status: 'FAIL', name: safe.name, category: safe.category}));
    process.exitCode = 1;
    throw e;
  } finally {
    if (ownsDb) await db?.end().catch(() => {});
  }
}

if (process.argv[1] && process.argv[1].endsWith('preflight-readonly.mjs')) {
  try {
    await runPreflight();
  } catch (topErr) {
    const safe = safeErrorCategory(topErr);
    console.error(JSON.stringify({status: 'FAIL', step: 'bootstrap', name: safe.name, category: safe.category}));
    process.exitCode = 1;
  }
}
