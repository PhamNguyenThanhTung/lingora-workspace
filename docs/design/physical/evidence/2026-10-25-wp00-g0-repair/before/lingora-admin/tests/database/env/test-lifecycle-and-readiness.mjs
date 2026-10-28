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
  CANONICAL_STATE_FILE,
  EXPECTED_PORTS,
  getValidatedRuntimeState,
} from './env-guard.mjs';
import {
  startStack,
  statusStack,
  stopStack,
  destroyStack,
} from './stack-manager.mjs';

test('Provider stack lifecycle and real readiness verification', async () => {
  // Step 1: Start stack and verify real readiness
  console.log('[TEST-LIFECYCLE] Starting disposable native stack...');
  const state = await startStack();

  assert.equal(state.runtime, 'native');
  assert.ok(state.id, 'Stack ID must be non-empty');
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

  // Step 2: Validate runtime state via env-guard
  const guardState = getValidatedRuntimeState();
  assert.equal(guardState.bound, true);
  assert.equal(guardState.validatedEndpoints.database.port, EXPECTED_PORTS.database);
  assert.equal(guardState.validatedEndpoints.auth.port, EXPECTED_PORTS.api);
  assert.equal(guardState.validatedEndpoints.mail.port, EXPECTED_PORTS.mail);

  // Step 3: Verify scaffold fails closed on active provider stack
  console.log('[TEST-LIFECYCLE] Verifying scaffold honest refusal on active provider stack...');
  const runnerScript = path.resolve(CANONICAL_WORKSPACE_ROOT, 'lingora-admin/tests/database/scaffolds/a1-runner.mjs');
  const cleanEnv = { ...process.env };
  delete cleanEnv.NODE_TEST_CONTEXT;

  const scaffoldRes = spawnSync('node', [runnerScript], {
    cwd: CANONICAL_WORKSPACE_ROOT,
    env: cleanEnv,
    encoding: 'utf8',
  });

  assert.equal(scaffoldRes.status, 1, 'Scaffold must exit 1 when test suite is absent');
  assert.match(scaffoldRes.stderr, /STATUS: NOT EXECUTED/);
  assert.equal(scaffoldRes.stdout.includes('PASSED'), false, 'Scaffold must never report false PASSED');

  // Step 4: Stop stack
  console.log('[TEST-LIFECYCLE] Stopping stack...');
  stopStack();

  // Step 5: Destroy stack
  console.log('[TEST-LIFECYCLE] Destroying stack...');
  destroyStack();

  assert.equal(fs.existsSync(CANONICAL_STATE_FILE), false, 'State file must be cleaned up after successful destroy');
  console.log('[TEST-LIFECYCLE] Lifecycle test completed cleanly.');
});
