/**
 * Focused Fresh Disposable Child-Path Integration Test (P1-00).
 *
 * Exercises the end-to-end child context contract on a real fresh disposable provider run:
 * 1. Allocates and starts a fresh disposable local native stack via startStack({ newRun: true }).
 * 2. Executes a real child test via runScaffold({ runId: freshRun.runId }).
 * 3. The child test receives explicit LINGORA_TEST_CONTEXT, verifies exclusive parent lock,
 *    and connects to the live synthetic target using createTargetPgClient to query database identity.
 * 4. The child test verifies Auth and Mail endpoints using validated credentials.
 * 5. Destroys the stack cleanly via destroyStack({ runId: freshRun.runId }).
 * 6. Asserts complete process and socket quiescence postconditions.
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import {
  CANONICAL_WORKSPACE_ROOT,
  DEFAULT_RUNS_DIR,
  EXPECTED_PORTS,
  snapshotRunSockets,
  verifySocketsQuiescent,
  validateAuthorityRecord,
} from './env/env-guard.mjs';
import { startStack, destroyStack } from './env/stack-manager.mjs';
import { runScaffold } from './scaffolds/runner-base.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ADMIN_ROOT = path.resolve(__dirname, '../..');
const WORKSPACE_ROOT = CANONICAL_WORKSPACE_ROOT;

async function runChildIntegration() {
  console.log('================================================================================');
  console.log('[P1-00-INTEGRATION] Starting Focused Fresh Disposable Child-Path Integration');
  console.log('================================================================================');

  // Pre-check: sockets must be quiescent
  const initialSockets = snapshotRunSockets();
  if (initialSockets.activePorts && initialSockets.activePorts.length > 0) {
    throw new Error(`PRECHECK_FAIL: Ports already in use: ${initialSockets.activePorts.map(p => p.port).join(', ')}`);
  }
  console.log('[P1-00-INTEGRATION] Pre-check socket quiescence: PASS (all ports free)');

  // 1. Allocate and start fresh disposable native stack
  console.log('[P1-00-INTEGRATION] Allocating and starting fresh disposable native stack...');
  const startResult = await startStack({ newRun: true });
  const runId = startResult.runId;
  const runDir = startResult.runDir;
  console.log(`[P1-00-INTEGRATION] Fresh stack started: runId=${runId}, stackId=${startResult.stackId}`);

  // Create temporary fixture directory and child test file
  const fixtureDir = path.resolve(ADMIN_ROOT, 'tests/database/p1-00-child-fixture');
  const fixtureFile = path.resolve(fixtureDir, 'live-child.test.mjs');
  fs.mkdirSync(fixtureDir, { recursive: true });

  fs.writeFileSync(
    fixtureFile,
    `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTestContext } from '../test-context.mjs';

test('real child obtains fresh validated context, asserts lock, and queries live synthetic db', async () => {
  // 1. Retrieve trusted context handed off by runner
  const ctx = getTestContext();
  assert.ok(ctx.runId, 'runId must be present');
  assert.equal(ctx.endpoints.database.host, '127.0.0.1');
  assert.equal(ctx.endpoints.database.port, 54322);
  assert.equal(ctx.endpoints.auth.port, 54321);
  assert.equal(ctx.endpoints.mail.port, 54324);
  assert.equal(typeof ctx.credentials.databaseUrl, 'string');
  assert.equal(typeof ctx.credentials.anonKey, 'string');

  // 2. Assert parent lock is actively held
  assert.equal(ctx.assertLockHeld(), true, 'Parent lock must be held during test execution');

  // 3. Connect to live synthetic PostgreSQL via createPgClient
  const client = ctx.createPgClient();
  await client.connect();
  try {
    const res = await client.query('SELECT version(), current_database(), current_user;');
    assert.equal(res.rows.length, 1);
    assert.equal(res.rows[0].current_database, 'postgres');
    assert.equal(res.rows[0].current_user, 'postgres');
    assert.match(res.rows[0].version, /PostgreSQL 17/i);
  } finally {
    await client.end();
  }

  // 4. Probe live Auth and Mail endpoints
  const authRes = await fetch(ctx.endpoints.auth.url + '/auth/v1/health', {
    headers: { apikey: ctx.credentials.anonKey },
    redirect: 'error',
  });
  assert.equal(authRes.status, 200, 'Auth health probe must return 200');

  const mailRes = await fetch(ctx.endpoints.mail.url + '/api/v1/messages', {
    redirect: 'error',
  });
  assert.equal(mailRes.status, 200, 'Mail health probe must return 200');

  // 5. Re-assert lock held at test completion
  assert.equal(ctx.assertLockHeld(), true, 'Parent lock must remain held through completion');
});
`
  );

  let scaffoldResult;
  try {
    // 2. Execute scaffold runner against the fresh disposable run
    console.log('[P1-00-INTEGRATION] Invoking runScaffold with child test fixture...');
    scaffoldResult = await runScaffold({
      testSuiteName: 'test:db:p1-00-child-path',
      testDir: 'tests/database/p1-00-child-fixture',
      gateRequirement: 'P1-00 runner-context integration',
      description: 'Focused child-path integration with live synthetic stack',
      runId,
      runsDir: DEFAULT_RUNS_DIR,
      setProcessExitCode: false,
    });

    console.log(`[P1-00-INTEGRATION] Scaffold execution result: status=${scaffoldResult.status}, exitCode=${scaffoldResult.exitCode}`);
    assert.equal(scaffoldResult.status, 'PASSED', 'Child integration scaffold must PASS');
    assert.equal(scaffoldResult.exitCode, 0, 'Child integration scaffold must exit 0');
    assert.ok(scaffoldResult.summary, 'Summary must be present');
    assert.equal(scaffoldResult.summary.pass, 1, 'Child test must pass');
    assert.equal(scaffoldResult.summary.fail, 0, 'Child test must have 0 failures');
  } finally {
    // Clean up temporary fixture directory
    if (fs.existsSync(fixtureFile)) fs.unlinkSync(fixtureFile);
    if (fs.existsSync(fixtureDir)) fs.rmdirSync(fixtureDir);

    // 3. Destroy fresh disposable stack cleanly
    console.log('[P1-00-INTEGRATION] Destroying fresh disposable stack...');
    const destroyRes = await destroyStack({ runId });
    console.log(`[P1-00-INTEGRATION] Stack destroyed: status=${destroyRes.status}, tombstone=${destroyRes.tombstone}`);

    // Verify postconditions
    assert.equal(destroyRes.status, 'DESTROYED', 'Destroy result status must be DESTROYED');
    assert.equal(destroyRes.phase, 'DESTROYED', 'Destroy result phase must be DESTROYED');
    assert.equal(destroyRes.exit_code, 0, 'Destroy exit code must be 0');

    const postSockets = verifySocketsQuiescent();
    assert.equal(postSockets.quiescent, true, 'All ports must be verified quiescent after destroy');
    console.log('[P1-00-INTEGRATION] Post-destroy socket quiescence: PASS (all ports free)');

    // Verify tombstone on disk via validateAuthorityRecord
    const authRecord = validateAuthorityRecord(path.resolve(runDir, 'owner.json'), { expectedRunId: runId });
    assert.equal(authRecord.phase, 'DESTROYED');
    assert.equal(authRecord.tombstone, true);
    console.log('[P1-00-INTEGRATION] Tombstone record verified on disk: PASS');
  }

  console.log('================================================================================');
  console.log('[P1-00-INTEGRATION] Focused Child-Path Integration: COMPLETE (PASS)');
  console.log('================================================================================');
}

runChildIntegration().catch((err) => {
  console.error('[P1-00-INTEGRATION] FATAL:', err);
  process.exit(1);
});
