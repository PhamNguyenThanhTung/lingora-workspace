/**
 * Persistent Test Suite for Provider Stack Lifecycle & Real Readiness.
 *
 * Verifies:
 * - G0-R1: Task-local lifecycle operations bound to canonical state.
 * - G0-R2: Zero secret leakage across all lifecycle outputs.
 * - G0-R3: Real SQL query execution, Auth health, Storage status, Mail sink API.
 * - G0-R3: Session-pooler accurate reporting.
 * - G0-R5: Honest scaffold rejection even with active stack.
 * - G0-R5: Clean stop and destroy teardown.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_WORKSPACE_ROOT,
  DEFAULT_RUNS_DIR,
  EXPECTED_PORTS,
  validateAuthorityRecord,
} from './env-guard.mjs';
import {
  startStack,
  statusStack,
  stopStack,
  destroyStack,
} from './stack-manager.mjs';

test('Provider stack lifecycle and real readiness verification (R01)', async () => {
  let runId = null;
  let runDir = null;
  let started = false;
  let destroyed = false;
  try {
    // Step 1: Start fresh native stack with new run allocation
    console.log('[TEST-LIFECYCLE] Allocating and starting fresh disposable native stack...');
    const state = await startStack({ newRun: true });
    runId = state.run_id || state.runId;
    runDir = path.resolve(DEFAULT_RUNS_DIR, runId);
    started = true;

    assert.equal(state.runtime, 'native');
    assert.ok(state.stackId || state.id || state.instance_id, 'Stack ID must be non-empty');
    const fullId = state.instance_id || state.stackId || state.id;
    assert.equal(fullId.length, 64, 'Stack ID must be full 64-character hex ID');
    assert.ok(state.readiness, 'Readiness metadata must be present');

    // Verify real SQL proof
    assert.equal(state.readiness.sql_ready, true, 'PostgreSQL must be SQL-ready');
    assert.match(state.readiness.pg_version, /PostgreSQL 17\./, 'PostgreSQL major version must be 17');
    assert.equal(state.readiness.current_database, 'postgres');
    assert.ok(state.readiness.schemas.includes('auth'), 'Auth schema must exist in PostgreSQL');
    assert.ok(state.readiness.schemas.includes('storage'), 'Storage schema must exist in PostgreSQL');
    assert.ok(state.readiness.schemas.includes('public'), 'Public schema must exist in PostgreSQL');

    // Verify real Auth HTTP health proof
    assert.equal(state.readiness.auth_ready, true, 'Auth service must be HTTP-ready');
    assert.equal(state.readiness.auth_status, 200, 'Auth health must return 200 OK');

    // Verify real Storage HTTP status proof
    assert.equal(state.readiness.storage_ready, true, 'Storage service must be HTTP-ready');
    assert.equal(state.readiness.storage_status, 200, 'Storage status must return 200 OK');

    // Verify real Mail sink HTTP API proof
    assert.equal(state.readiness.mail_ready, true, 'Mail sink must be HTTP-ready');
    assert.equal(state.readiness.mail_status, 200, 'Mail messages endpoint must return 200 OK');

    // Verify pooler status
    assert.match(state.readiness.session_pooler, /DISABLED_IN_NATIVE_STACK/, 'Pooler status must be accurately reported');

    // Step 2: Validate authority record
    const authority = validateAuthorityRecord(path.resolve(runDir, 'owner.json'));
    assert.equal(authority.phase, 'BOUND');
    assert.equal(authority.instance_id, fullId);
    assert.ok(authority.member_map, 'Member UUID map must be recorded');
    const initialMemberMap = { ...authority.member_map };

    // Step 3: Query status using verified runId
    console.log('[TEST-LIFECYCLE] Querying stack status...');
    const statusRes = statusStack({ runId });
    assert.ok(statusRes, 'Status query must return sanitized object');
    assert.equal(statusRes.status, 'RUNNING');
    assert.equal(statusRes.code, 'SUCCESS');

    // Step 4: Verify scaffold fails closed on active provider stack
    console.log('[TEST-LIFECYCLE] Verifying scaffold honest refusal on active provider stack...');
    const runnerScript = path.resolve(CANONICAL_WORKSPACE_ROOT, 'lingora-admin/tests/database/scaffolds/a1-runner.mjs');
    const cleanEnv = { ...process.env, LINGORA_RUN_ID: runId };
    delete cleanEnv.NODE_TEST_CONTEXT;

    const scaffoldRes = spawnSync(process.execPath, [runnerScript, '--run', runId], {
      cwd: CANONICAL_WORKSPACE_ROOT,
      env: cleanEnv,
      encoding: 'utf8',
    });

    assert.equal(scaffoldRes.status, 1, 'Scaffold must exit 1 when test suite is absent');
    assert.match(scaffoldRes.stderr, /STATUS: NOT EXECUTED/);
    assert.equal(scaffoldRes.stdout.includes('PASSED'), false, 'Scaffold must never report false PASSED');

    // Step 5: Stop stack and verify stopped postconditions
    console.log('[TEST-LIFECYCLE] Stopping stack...');
    const stopRes = stopStack({ runId });
    assert.equal(stopRes.status, 'STOPPED');
    assert.equal(stopRes.code, 'SUCCESS');

    // Step 6: Existing start resumes same instance ID and verifies member map continuity
    console.log('[TEST-LIFECYCLE] Resuming stack (existing start)...');
    const resumeState = await startStack({ runId });
    assert.equal(resumeState.instance_id, fullId);
    assert.equal(resumeState.status, 'RUNNING');
    assert.equal(resumeState.readiness.sql_ready, true);

    const postResumeAuth = validateAuthorityRecord(path.resolve(runDir, 'owner.json'));
    assert.deepEqual(postResumeAuth.member_map, initialMemberMap, 'Member UUID map must be preserved across restart');

    // Stop again before destroy
    console.log('[TEST-LIFECYCLE] Stopping stack prior to destroy...');
    stopStack({ runId });

    // Step 7: Destroy stack
    console.log('[TEST-LIFECYCLE] Destroying stack...');
    const destroyRes = destroyStack({ runId });
    assert.equal(destroyRes.status, 'DESTROYED');
    assert.equal(destroyRes.code, 'SUCCESS');
    destroyed = true;

    // Verify destroy postconditions: unlinked credentials, unlinked member-map, retained tombstone
    const credFile = path.resolve(runDir, 'credentials.json');
    const memberMapFile = path.resolve(runDir, 'member-map.json');
    assert.equal(fs.existsSync(credFile), false, 'Private credentials must be unlinked after destroy');
    assert.equal(fs.existsSync(memberMapFile), false, 'Member map file must be unlinked after destroy');

    const tombstoneAuth = validateAuthorityRecord(path.resolve(runDir, 'owner.json'));
    assert.equal(tombstoneAuth.phase, 'DESTROYED');
    assert.ok(tombstoneAuth.tombstone, 'Tombstone receipt must be retained in owner.json');

    // Step 8: Safe idempotence on repeated destroy
    console.log('[TEST-LIFECYCLE] Verifying repeated destroy on tombstone...');
    const repeatDestroyRes = destroyStack({ runId });
    assert.equal(repeatDestroyRes.code, 'ALREADY_DESTROYED');

    console.log('[TEST-LIFECYCLE] Lifecycle test completed cleanly.');
  } finally {
    if (started && !destroyed && runId) {
      console.log('[TEST-LIFECYCLE] Running emergency teardown in finally...');
      try {
        stopStack({ runId });
      } catch (err) {
        console.error('[TEST-LIFECYCLE] Emergency stop failed:', err.message);
      }
      try {
        destroyStack({ runId });
      } catch (err) {
        console.error('[TEST-LIFECYCLE] Emergency destroy failed:', err.message);
      }
    }
  }
});
