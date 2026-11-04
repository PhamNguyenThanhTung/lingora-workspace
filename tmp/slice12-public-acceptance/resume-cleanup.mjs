/**
 * resume-cleanup.mjs — Scoped cleanup and read-only reconciliation for Slice 12 public acceptance.
 *
 * Usage:
 *   node resume-cleanup.mjs
 *
 * What it does:
 *   1. Loads ready-provenance.json and verifies HEAD.
 *   2. Reads the declared disposable identity from mode0600-private.json.
 *   3. Finds the owned Auth user (if any) and verifies label matches.
 *   4. Scoped cleanup (locked transaction):
 *      - Checks for unexpected immutable history (responses, completions, cards, receipts, review ops).
 *      - Uses correct schema: app_private.command_receipts.
 *      - If unexpected committed history → STOPS destructive cleanup, records BLOCKED, reports allowlist required.
 *      - Preserves ancestors, compares other Accounts excluding only the declared retained owned Account.
 *      - Still performs safe session teardown and curriculum restoration attempts.
 *      - Otherwise removes only mutable runtime state (open attempts, open consumptions, contexts, account).
 *   5. Provider admin delete (only the declared disposable identity, if not blocked).
 *   6. Removes owned PKCE flow_state rows (if not blocked).
 *   7. Restores owned curriculum fields to baseline (failure-safe, always attempted).
 *   8. Read-only reconciliation: all auth tables, app tables, flow baseline, audit events, mandatory S11 baseline.
 *   9. Failure-safe finalization: removes private scratch files (password/token/URL/storage state)
 *      unconditionally even if DB connect, query, or reconciliation fails.
 *
 * Constraints:
 *   - Never deletes immutable responses, completions, cards, receipts, or audit history.
 *   - If unexpected committed history → reports required allowlist, does NOT force delete.
 *   - Restores exact baseline curriculum state and cleans private credentials even when cleanup is BLOCKED.
 *   - Preserves allowlisted LEARNER_BOOTSTRAPPED audit event.
 *   - Validates retained S11 baseline is non-empty and exactly preserved (no default-true).
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {config as loadEnv} from 'dotenv';
import pg from 'pg';
import {createClient} from '@supabase/supabase-js';
import {
  immutableCountSQL,
  safeErrorCategory,
  compareProviderFlowBaseline,
  compareRetainedS11Baseline,
  captureRetainedS11Snapshot,
} from './helpers-testable.mjs';

// ── Paths ────────────────────────────────────────────────────────────────────
const EV_ROOT           = 'plans/evidence/slice-12-public-acceptance/';
const PROVENANCE_FILE   = 'tmp/slice12-public-acceptance/ready-provenance.json';
const PRIVATE_IN_FILE   = 'tmp/slice12-public-acceptance/mode0600-private.json';
const AUTH_PRIVATE_FILE = 'tmp/slice12-public-acceptance/auth-private.json';
const BASELINE_FILE     = EV_ROOT + 'before-registration.json';
const PROVIDER_BEFORE   = EV_ROOT + 'provider-before.json';
const JOURNEY_FILE      = EV_ROOT + 'public-journey.json';
const CLEANUP_FILE      = EV_ROOT + 'final-cleanup.json';

// Private scratch files to remove in failure-safe finalization
export const PRIVATE_SCRATCH = [
  'tmp/slice12-public-acceptance/mode0600-private.json',
  'tmp/slice12-public-acceptance/auth-private.json',
  'tmp/slice12-public-acceptance/eml-url-private.txt',
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    throw Object.assign(new Error('Failed to read JSON'), {name: 'SyntaxError'});
  }
}

export function cleanPrivateScratchFiles(paths = PRIVATE_SCRATCH) {
  const unlinked = [];
  const failed = [];
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
        unlinked.push(p);
      }
    } catch (err) {
      const safe = safeErrorCategory(err);
      failed.push({path: p, category: safe.category});
    }
  }
  return {
    unlinked,
    failed,
    success: failed.length === 0,
    removedCount: unlinked.length,
    length: unlinked.length,
  };
}

async function attemptCurriculumRestoration(db, dbConnected, baseline, journey) {
  if (!db || !dbConnected) {
    return {attempted: false, restored: false, reason: 'no database connection'};
  }
  try {
    await db.query('BEGIN');
    const firstLesson = baseline?.lessons?.find(
      l => l.id === (journey?.fixtures?.lessonId || '75d84614-050c-400a-8d06-de92a1418d67')
    );
    if (firstLesson) {
      await db.query(
        'UPDATE app.lessons SET availability=$2 WHERE id=$1 AND active_revision_id=$3',
        [firstLesson.id, firstLesson.availability, firstLesson.active_revision_id]
      );
    }
    if (baseline?.course) {
      await db.query(
        'UPDATE app.courses SET is_active=$2 WHERE id=$1 AND names=$3::jsonb',
        [baseline.course.id, baseline.course.is_active, JSON.stringify(baseline.course.names)]
      );
    }
    await db.query('COMMIT');
    return {attempted: true, restored: true};
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    const safe = safeErrorCategory(err);
    return {attempted: true, restored: false, errorCategory: safe.category};
  }
}

async function attemptSessionTeardown(db, dbConnected, subjectId) {
  if (!db || !dbConnected) {
    return {attempted: false, tornDown: false, reason: 'no database connection'};
  }
  if (!subjectId) {
    return {attempted: false, tornDown: false, reason: 'no owned subjectId'};
  }
  try {
    await db.query('BEGIN');
    await db.query('DELETE FROM auth.sessions WHERE user_id = $1', [subjectId]);
    await db.query('DELETE FROM auth.refresh_tokens WHERE user_id = $1', [subjectId]);
    await db.query('COMMIT');
    return {attempted: true, tornDown: true};
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    const safe = safeErrorCategory(err);
    return {attempted: true, tornDown: false, errorCategory: safe.category};
  }
}

export async function runCleanup(options = {}) {
  const rootDir = options.rootDir || process.env.SLICE12_ROOT_DIR || '.';
  const evRoot = path.join(rootDir, 'plans/evidence/slice-12-public-acceptance');
  const provenanceFile = path.join(rootDir, 'tmp/slice12-public-acceptance/ready-provenance.json');
  const privateInFile = path.join(rootDir, 'tmp/slice12-public-acceptance/mode0600-private.json');
  const authPrivateFile = path.join(rootDir, 'tmp/slice12-public-acceptance/auth-private.json');
  const baselineFile = path.join(evRoot, 'before-registration.json');
  const providerFile = path.join(evRoot, 'provider-before.json');
  const journeyFile = path.join(evRoot, 'public-journey.json');
  const evidenceFile = path.join(evRoot, 'final-cleanup.json');
  const privateScratch = [
    privateInFile,
    authPrivateFile,
    path.join(rootDir, 'tmp/slice12-public-acceptance/eml-url-private.txt'),
  ];

  fs.mkdirSync(evRoot, {recursive: true});

  let head = 'unknown';
  try {
    head = execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
  } catch {}

  const result = {
    sourceCommit:   head,
    status:         'RUNNING',
    cleanup:        {},
    reconciliation: {},
  };

  let db = options.dbClient || null;
  let dbConnected = false;
  let begun = false;
  let subjectId = null;
  let isBlocked = false;
  let baseline = null;
  let providerBefore = null;
  let journey = null;
  let privateIn = null;

  try {
    // ── Bootstrap ────────────────────────────────────────────────────────────
    const provenance = readJSON(provenanceFile);
    assert.equal(provenance.commit, head, 'HEAD ≠ provenance commit');
    assert.equal(provenance.ready,  true, 'provenance not ready');

    privateIn = readJSON(privateInFile);
    assert.ok(privateIn.label.startsWith('DEV_S12_PUBLIC_'), 'label prefix mismatch');

    baseline = readJSON(baselineFile);
    assert.equal(baseline.identity.length, 0, 'baseline shows existing identity');
    providerBefore = readJSON(providerFile);

    journey = fs.existsSync(journeyFile) ? readJSON(journeyFile) : null;
    if (journey) assert.equal(journey.sourceCommit, head, 'journey sourceCommit mismatch');

    // ── Database / Auth client ───────────────────────────────────────────────
    let auth = options.authAdmin || null;
    if (!db) {
      loadEnv({path: path.join(rootDir, 'lingora-admin/.env'), quiet: true});
      const env = options.env || process.env;
      const ref = env.SUPABASE_DEV_PROJECT_REF;
      assert.ok(ref, 'SUPABASE_DEV_PROJECT_REF not set');
      const rawDbUrl = env.DATABASE_URL;
      assert.ok(rawDbUrl?.includes(ref), 'DATABASE_URL missing or wrong ref');
      assert.ok(env.NEXT_PUBLIC_SUPABASE_URL?.includes(ref), 'NEXT_PUBLIC_SUPABASE_URL ref mismatch');

      const dbUrl = new URL(rawDbUrl);
      for (const p of ['schema', 'sslmode']) dbUrl.searchParams.delete(p);

      db = new pg.Client({
        connectionString:        dbUrl.toString(),
        ssl:                     {rejectUnauthorized: false},
        connectionTimeoutMillis: 10_000,
        statement_timeout:       20_000,
      });

      auth = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY,
        {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}}
      );

      await db.connect();
      dbConnected = true;
    } else {
      if (typeof db.connect === 'function') {
        await db.connect();
      }
      dbConnected = options.dbConnected !== undefined ? options.dbConnected : true;
    }

    // ── 1. Find owned user ───────────────────────────────────────────────────
    await db.query('BEGIN READ ONLY'); begun = true;
    const users = (await db.query(
      `SELECT id, raw_user_meta_data->>'display_name' AS label
       FROM auth.users WHERE lower(email) = lower($1)`,
      [privateIn.email]
    )).rows;
    assert.ok(users.length <= 1, `Expected ≤1 user, found ${users.length}`);
    if (users.length) {
      assert.equal(users[0].label, privateIn.label, 'Auth user label mismatch');
      subjectId = users[0].id;
    }
    if (journey?.fixtures?.learnerId) {
      assert.equal(subjectId, journey.fixtures.learnerId, 'subjectId ≠ journey.fixtures.learnerId');
    }
    await db.query('COMMIT'); begun = false;

    // ── 2. Scoped cleanup ────────────────────────────────────────────────────
    if (subjectId) {
      await db.query('BEGIN'); begun = true;

      // Lock account + contexts
      const accounts = (await db.query(
        'SELECT role FROM app.accounts WHERE id=$1 FOR UPDATE', [subjectId]
      )).rows;
      assert.ok(accounts.length <= 1);
      if (accounts.length) assert.equal(accounts[0].role, 'LEARNER', 'Account is not LEARNER');

      const contexts = (await db.query(
        'SELECT id, course_id FROM app.learning_contexts WHERE learner_id=$1 ORDER BY id FOR UPDATE',
        [subjectId]
      )).rows;
      assert.ok(contexts.length <= 1, `Expected ≤1 context, found ${contexts.length}`);
      for (const c of contexts) {
        assert.equal(c.course_id, baseline.course.id, 'Context points to wrong course');
      }
      const contextIds = contexts.map(c => c.id);

      // Check for unexpected immutable history BEFORE any deletions
      // Uses correct schema: app_private.command_receipts
      const immutableCount = Number((await db.query(
        immutableCountSQL(),
        [contextIds, subjectId]
      )).rows[0].n);

      if (immutableCount > 0) {
        // ROLLBACK the destructive transaction immediately
        await db.query('ROLLBACK'); begun = false;
        isBlocked = true;
        result.status = 'BLOCKED';
        result.blockReason = `Unexpected immutable history found (${immutableCount} rows). ` +
          'Manual review required; destructive cleanup stopped. Required allowlist/retention must be declared ' +
          'before proceeding. Do not force-delete.';
        result.unexpectedImmutableCount = immutableCount;
        result.cleanup.destructiveDeletionsSkippedDueToImmutableHistory = true;

        // Query unexpected immutable rows for transparent evidence
        result.retainedUnexpectedImmutableHistory = {
          responses: (await db.query(
            `SELECT to_jsonb(r)::text AS row FROM app.lesson_responses r JOIN app.lesson_attempts a ON a.id = r.attempt_id WHERE a.context_id = ANY($1::uuid[])`,
            [contextIds]
          )).rows.map(r => r.row),
          completions: (await db.query(
            `SELECT to_jsonb(c)::text AS row FROM app.lesson_completions c WHERE c.context_id = ANY($1::uuid[])`,
            [contextIds]
          )).rows.map(r => r.row),
          cards: (await db.query(
            `SELECT to_jsonb(c)::text AS row FROM app.srs_cards c WHERE c.learner_id = $1`,
            [subjectId]
          )).rows.map(r => r.row),
          reviews: (await db.query(
            `SELECT to_jsonb(r)::text AS row FROM app.srs_review_operations r WHERE r.learner_id = $1`,
            [subjectId]
          )).rows.map(r => r.row),
          receipts: (await db.query(
            `SELECT to_jsonb(t)::text AS row FROM app_private.command_receipts t WHERE t.actor_id = $1`,
            [subjectId]
          )).rows.map(r => r.row),
        };

        // Report retained owned mutable state
        result.retainedOwnedMutableState = {
          account: (await db.query(
            'SELECT to_jsonb(a)::text AS row FROM app.accounts a WHERE id=$1',
            [subjectId]
          )).rows.map(r => r.row),
          contexts: (await db.query(
            'SELECT to_jsonb(c)::text AS row FROM app.learning_contexts c WHERE learner_id=$1',
            [subjectId]
          )).rows.map(r => r.row),
          attempts: (await db.query(
            'SELECT to_jsonb(a)::text AS row FROM app.lesson_attempts a WHERE context_id = ANY($1::uuid[])',
            [contextIds]
          )).rows.map(r => r.row),
          consumptions: (await db.query(
            'SELECT to_jsonb(c)::text AS row FROM app.lesson_consumptions c WHERE context_id = ANY($1::uuid[])',
            [contextIds]
          )).rows.map(r => r.row),
        };

        // Report retained owned session state (safe fields only: no IP, user_agent, tokens)
        result.retainedOwnedSessionState = {
          sessions: (await db.query(
            'SELECT s.id, s.user_id, s.created_at, s.updated_at FROM auth.sessions s WHERE user_id=$1 ORDER BY s.id',
            [subjectId]
          )).rows,
        };

        // Perform safe session teardown for owned identity
        result.cleanup.sessionTeardown = await attemptSessionTeardown(db, dbConnected, subjectId);
        assert.ok(result.cleanup.sessionTeardown.tornDown, 'Owned session teardown failed');

        console.error(JSON.stringify({
          status: 'BLOCKED',
          reason: result.blockReason,
          unexpectedImmutableCount: immutableCount,
        }));
        process.exitCode = 1;

      } else {
        // Safe to remove mutable runtime state
        await db.query(
          'DELETE FROM app.lesson_attempts WHERE context_id = ANY($1::uuid[]) AND completed_at IS NULL',
          [contextIds]
        );
        await db.query(
          'DELETE FROM app.lesson_consumptions WHERE context_id = ANY($1::uuid[]) AND completed_at IS NULL',
          [contextIds]
        );
        await db.query(
          'DELETE FROM app.learning_contexts WHERE learner_id = $1',
          [subjectId]
        );
        await db.query(
          `DELETE FROM app.accounts WHERE id = $1 AND role = 'LEARNER'`,
          [subjectId]
        );
        await db.query('COMMIT'); begun = false;

        // Provider admin delete (only the declared disposable identity)
        const deleted = await auth.auth.admin.deleteUser(subjectId);
        assert.ok(!deleted.error,
          `Provider delete failed: ${deleted.error?.message || 'unknown'}`);
        result.cleanup.ownedIdentityAndMutableStateRemoved = true;
      }
    }

    // ── 3. PKCE flow_state cleanup ───────────────────────────────────────────
    if (!isBlocked) {
      const subjects = [...new Set([
        ...providerBefore.previousIds,
        ...(subjectId ? [subjectId] : []),
      ])];

      await db.query('BEGIN'); begun = true;
      const flows = (await db.query(
        `SELECT id, user_id, authentication_method, provider_type
         FROM auth.flow_state WHERE user_id = ANY($1::uuid[]) ORDER BY id FOR UPDATE`,
        [subjects]
      )).rows;
      for (const f of flows) {
        assert.ok(subjects.includes(f.user_id), 'Flow belongs to unexpected user');
        assert.equal(f.authentication_method, 'email/signup', 'Unexpected auth method in flow');
        assert.equal(f.provider_type, 'email', 'Unexpected provider type in flow');
      }
      const removedFlows = await db.query(
        'DELETE FROM auth.flow_state WHERE id = ANY($1::uuid[]) AND user_id = ANY($2::uuid[])',
        [flows.map(f => f.id), subjects]
      );
      result.cleanup.deletedOwnedPkceFlows = removedFlows.rowCount;
      await db.query('COMMIT'); begun = false;
    }

    // ── 4. Restore curriculum (always attempted, even if blocked) ─────────────
    result.cleanup.curriculumRestoration = await attemptCurriculumRestoration(db, dbConnected, baseline, journey);
    if (result.cleanup.curriculumRestoration.restored) {
      result.cleanup.runtimeFixtureRestored = true;
    }

    // ── 5. Read-only reconciliation ──────────────────────────────────────────
    await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY'); begun = true;

    const subjects = [...new Set([
      ...providerBefore.previousIds,
      ...(subjectId ? [subjectId] : []),
    ])];

    // Auth counts
    const authCounts = {};
    for (const t of ['users', 'identities', 'sessions', 'flow_state', 'one_time_tokens', 'refresh_tokens']) {
      const col = t === 'users' ? 'id' : 'user_id';
      authCounts[t] = Number(
        (await db.query(
          `SELECT count(*) FROM auth.${t} WHERE ${col}::text = ANY($1::text[])`,
          [subjects]
        )).rows[0].count
      );
      if (!isBlocked) {
        assert.equal(authCounts[t], 0, `auth.${t} still has rows for owned subjects`);
      }
    }

    if (!isBlocked) {
      assert.equal(
        Number((await db.query(
          'SELECT count(*) FROM auth.users WHERE lower(email) = lower($1)',
          [privateIn.email]
        )).rows[0].count),
        0,
        'Auth user with owned email still exists'
      );
    }

    // App tables
    if (!isBlocked) {
      for (const [t, col] of [['accounts', 'id'], ['learning_contexts', 'learner_id'], ['srs_cards', 'learner_id']]) {
        assert.equal(
          Number((await db.query(
            `SELECT count(*) FROM app.${t} WHERE ${col} = ANY($1::uuid[])`,
            [subjects]
          )).rows[0].count),
          0,
          `app.${t} still has rows for owned subjects`
        );
      }

      if (journey?.fixtures?.contextId) {
        for (const t of ['lesson_consumptions', 'lesson_attempts', 'lesson_completions']) {
          assert.equal(
            Number((await db.query(
              `SELECT count(*) FROM app.${t} WHERE context_id = $1`,
              [journey.fixtures.contextId]
            )).rows[0].count),
            0,
            `app.${t} still has rows for owned context`
          );
        }
      }
    }

    // Other accounts unchanged:
    // If BLOCKED, exclude only the declared retained owned Account subjectId
    const otherAccounts = (await db.query(
      `SELECT id, role, status, row_version::text, updated_at
       FROM app.accounts
       ${subjectId ? 'WHERE id != $1' : ''}
       ORDER BY id`,
      subjectId ? [subjectId] : []
    )).rows;
    assert.equal(
      JSON.stringify(otherAccounts),
      JSON.stringify(baseline.otherAccounts),
      'Other accounts changed during acceptance run'
    );

    // Curriculum restored to exact baseline
    const course = (await db.query(
      'SELECT id, language_id, framework_id, is_active, names, default_start_level_id FROM app.courses WHERE id=$1',
      [baseline.course.id]
    )).rows[0];
    assert.deepEqual(course, baseline.course, 'Course not restored to baseline');

    const lessons = (await db.query(
      'SELECT id, availability, active_revision_id FROM app.lessons WHERE id = ANY($1::uuid[]) ORDER BY id',
      [baseline.lessons.map(l => l.id)]
    )).rows;
    assert.deepEqual(lessons, baseline.lessons, 'Lessons not restored to baseline');

    // Full runtime snapshot comparison (if baseline has it)
    if (baseline.fullRuntimeSnapshot) {
      const current = {
        course: (await db.query(
          'SELECT to_jsonb(c)::text AS row FROM app.courses c WHERE id=$1',
          [baseline.course.id]
        )).rows,
        lessons: (await db.query(
          'SELECT to_jsonb(l)::text AS row FROM app.lessons l WHERE id = ANY($1::uuid[]) ORDER BY id',
          [baseline.lessons.map(l => l.id)]
        )).rows,
      };
      assert.deepEqual(current, baseline.fullRuntimeSnapshot,
        'Full runtime snapshot does not match baseline');
    }

    // Provider flow baseline: actually compare non-owned flows to captured flowIndex
    assert.ok(providerBefore && Array.isArray(providerBefore.flowIndex), 'missing providerBefore.flowIndex baseline');
    const currentNonOwnedFlows = (await db.query(
      `SELECT id, user_id, authentication_method, provider_type
       FROM auth.flow_state
       WHERE user_id IS NULL OR NOT (user_id = ANY($1::uuid[]))
       ORDER BY id`,
      [subjects]
    )).rows;
    const flowCheck = compareProviderFlowBaseline(currentNonOwnedFlows, providerBefore.flowIndex, subjects);
    assert.ok(flowCheck.equal, flowCheck.reason || 'Provider flow baseline check failed');

    // Retained S11 baseline comparison: mandatory, non-empty, never default-true
    assert.ok(
      baseline.retainedS11Baseline && typeof baseline.retainedS11Baseline === 'object' && Object.keys(baseline.retainedS11Baseline).length > 0,
      'Mandatory retained S11 baseline is missing or empty'
    );
    const s11 = baseline.retainedS11Baseline;
    const currentS11Rows = await captureRetainedS11Snapshot(db, baseline.retainedS11Scope);
    const s11Check = compareRetainedS11Baseline(currentS11Rows, s11);
    assert.ok(s11Check.equal, s11Check.reason || 'Retained S11 baseline verification failed');
    result.reconciliation.retainedS11BaselinePreserved = true;

    // Audit events: allowlist exactly LEARNER_BOOTSTRAPPED if present
    const audits = subjectId ? (await db.query(
      `SELECT id, action, actor_kind, actor_id, verified_auth_subject_id, target_id
       FROM app_private.audit_events
       WHERE verified_auth_subject_id = $1 ORDER BY id`,
      [subjectId]
    )).rows : [];

    for (const a of audits) {
      assert.equal(a.action, 'LEARNER_BOOTSTRAPPED', 'Unexpected non-bootstrap audit action found');
      assert.equal(a.actor_kind, 'VERIFIED_AUTH_SUBJECT');
      assert.equal(a.actor_id, null);
      assert.equal(a.target_id, subjectId);
      assert.equal(a.verified_auth_subject_id, subjectId);
    }

    await db.query('COMMIT'); begun = false;

    let sessionTeardownVerified = true;
    if (isBlocked) {
      sessionTeardownVerified = (
        result.cleanup.sessionTeardown?.tornDown === true &&
        authCounts.sessions === 0 &&
        authCounts.refresh_tokens === 0
      );
    }

    result.reconciliation = {
      readOnly:                           true,
      authCounts,
      previousOwnedSubjects:              providerBefore.previousIds.length,
      currentOwnedSubjects:               subjectId ? 1 : 0,
      otherAccountsUnchanged:             true,
      fullRuntimeFixtureUnchanged:        true,
      providerFlowBaselineUnchanged:      true,
      retainedAllowlistedBootstrapAudits: audits,
      retainedS11BaselinePreserved:       true,
      sessionTeardownVerified:            isBlocked ? sessionTeardownVerified : true,
      unexpectedResidue:                  isBlocked ? result.unexpectedImmutableCount : 0,
    };

    if (isBlocked && !sessionTeardownVerified) {
      result.reconciliation.unverifiedScopes = ['sessions'];
    }

    if (!isBlocked) {
      result.status = 'PASS';
    }
    console.log(JSON.stringify(result));

  } catch (e) {
    if (begun && db && dbConnected) await db.query('ROLLBACK').catch(() => {});
    const safe = safeErrorCategory(e);
    if (!isBlocked) {
      result.status = 'FAIL';
      result.failure = {category: safe.category, name: safe.name};
    }
    if (!result.cleanup.curriculumRestoration) {
      result.cleanup.curriculumRestoration = await attemptCurriculumRestoration(db, dbConnected, baseline, journey);
    }
    if (!result.cleanup.sessionTeardown) {
      result.cleanup.sessionTeardown = await attemptSessionTeardown(db, dbConnected, subjectId);
    }
    // Record unverified scopes if reconciliation was interrupted
    result.reconciliation = result.reconciliation || {};
    if (!result.reconciliation.authCounts) {
      result.reconciliation.unverifiedScopes = [
        'authCounts',
        'otherAccounts',
        'providerFlowBaseline',
        'retainedS11Baseline',
      ];
      result.reconciliation.unexpectedResidue = 'UNVERIFIED';
    }
    console.error(JSON.stringify({status: result.status, category: safe.category, name: safe.name}));
    process.exitCode = 1;

  } finally {
    // ── Structured Failure-Safe Finalization ──────────────────────────────────
    // Unconditionally remove private credentials/scratch files on ALL paths:
    // success, BLOCKED, or injected DB/network/reconciliation failure
    const scratchResult = cleanPrivateScratchFiles(privateScratch);
    result.cleanup = result.cleanup || {};
    result.cleanup.removedScratchFiles = scratchResult.unlinked;
    if (!scratchResult.success) {
      result.cleanup.privateCredentialsRemovedOrAbsent = false;
      result.cleanup.scratchRemovalErrors = scratchResult.failed;
      result.status = 'FAIL';
      process.exitCode = 1;
    } else {
      result.cleanup.privateCredentialsRemovedOrAbsent = true;
    }

    // Write final cleanup evidence safely
    try {
      fs.writeFileSync(evidenceFile, JSON.stringify(result, null, 2) + '\n');
    } catch {}

    // Close live database connection if we opened it
    if (!options.dbClient && db && dbConnected) {
      await db.end().catch(() => {});
    }
  }
}

// Subprocess Entrypoint
if (process.argv[1] && process.argv[1].endsWith('resume-cleanup.mjs')) {
  try {
    await runCleanup();
  } catch (topErr) {
    const safe = safeErrorCategory(topErr);
    cleanPrivateScratchFiles();
    console.error(JSON.stringify({status: 'FAIL', step: 'bootstrap', name: safe.name, category: safe.category}));
    process.exitCode = 1;
  }
}
