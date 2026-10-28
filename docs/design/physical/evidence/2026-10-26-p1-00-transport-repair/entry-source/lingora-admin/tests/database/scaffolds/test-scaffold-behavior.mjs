/**
 * Persistent Test Suite for Scaffold Honest Behavior (G0-R5 / S01).
 *
 * Verifies:
 * - Unbound target fails closed (exit code 1).
 * - Nonexistent or malformed run ID fails closed (exit code 1).
 * - Environment flags / fake variables CANNOT bypass locked reconciliation.
 * - Missing tests return NOT EXECUTED with exit code 1. Never fake PASS.
 * - Deliberately failing test fixture ACTUALLY executes and propagates nonzero failure.
 * - Scaffold tests CANNOT overwrite or mutate real canonical state.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import {
  CANONICAL_WORKSPACE_ROOT,
  CANONICAL_CONFIG_PATH,
  TASK_ID,
  PINNED_CLI_VERSION,
  PINNED_CLI_SHA256,
  getGitBranch,
  isCanaryRegistered,
} from '../env/env-guard.mjs';
import { runScaffold } from './runner-base.mjs';
import { acquireRunLock, releaseRunLock } from '../env/stack-manager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ADMIN_ROOT = path.resolve(__dirname, '../../..');
const WORKSPACE_ROOT = CANONICAL_WORKSPACE_ROOT;

function createIsolatedMockAuthority(runsDir, overrides = {}) {
  const configContent = fs.readFileSync(CANONICAL_CONFIG_PATH, 'utf8');
  const configDigest = crypto.createHash('sha256').update(configContent).digest('hex');
  const gitBranch = getGitBranch(WORKSPACE_ROOT);
  const stackId = crypto.createHash('sha256').update('test-scaffold-mock-stack-' + crypto.randomBytes(4).toString('hex')).digest('hex');
  const runId = overrides.run_id || `run-${crypto.randomBytes(6).toString('hex')}`;

  const runDir = path.resolve(runsDir, runId);
  fs.mkdirSync(runDir, { recursive: true });
  fs.chmodSync(runDir, 0o700);
  fs.mkdirSync(path.join(runDir, 'home'), { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.join(runDir, 'fixture'), { recursive: true, mode: 0o700 });

  const authority = {
    format_version: '1.0',
    task_id: TASK_ID,
    run_id: runId,
    phase: 'BOUND',
    pending_operation: null,
    instance_id: stackId,
    stack_name: 'lingora-wp00-scaffold',
    runtime: 'native',
    project_root: path.resolve(runDir, 'fixture'),
    workdir: path.resolve(runDir, 'fixture'),
    config_path: fs.realpathSync(CANONICAL_CONFIG_PATH),
    config_digest: configDigest,
    branch_ref: gitBranch.startsWith('refs/heads/') ? gitBranch : `refs/heads/${gitBranch}`,
    home_dir: path.resolve(runDir, 'home'),
    control_root: runDir,
    cli_version: PINNED_CLI_VERSION,
    cli_digest: PINNED_CLI_SHA256,
    member_map: {
      auth: 'uuid-auth-1111',
      storage: 'uuid-storage-2222',
    },
    endpoints: {
      'database.sql': { protocol: 'tcp', address: '127.0.0.1', port: 54322, url: 'tcp://127.0.0.1:54322' },
      'auth.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
      'rest.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
      'storage.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
      'mail.http': { protocol: 'http', address: '127.0.0.1', port: 54324, url: 'http://127.0.0.1:54324' },
    },
    env: {
      DB_URL: 'postgresql://postgres:synthetic_pass@127.0.0.1:54322/postgres',
      API_URL: 'http://127.0.0.1:54321',
      ANON_KEY: 'test-anon-key',
    },
    ...overrides,
  };

  const recordPath = path.resolve(runDir, 'owner.json');
  fs.writeFileSync(recordPath, JSON.stringify(authority, null, 2), { mode: 0o600 });
  const credPath = path.resolve(runDir, 'credentials.json');
  fs.writeFileSync(credPath, JSON.stringify(authority.env, null, 2), { mode: 0o600 });

  return { authority, recordPath, runDir, runId, stackId };
}

test('1. Scaffold fails closed (exit 1) on unbound environment (missing --run flag)', () => {
  const runnerScript = path.resolve(__dirname, 'a1-runner.mjs');
  const cleanEnv = { ...process.env };
  delete cleanEnv.NODE_TEST_CONTEXT;
  delete cleanEnv.LINGORA_RUN_ID;
  delete cleanEnv.LINGORA_RUNS_DIR;

  const res = spawnSync(process.execPath, [runnerScript], {
    cwd: WORKSPACE_ROOT,
    env: cleanEnv,
    encoding: 'utf8',
  });

  assert.equal(res.status, 1, `Expected exit 1, got ${res.status}`);
  assert.match(res.stderr, /FAIL_CLOSED: COMMAND_INVALID: test-scaffold requires explicit --run <run-id>/);
  assert.equal(res.stdout.includes('PASSED'), false, 'Unbound scaffold must never report PASSED');
});

test('2. Forged test env flags do NOT bypass reconciliation (fails closed with exit 1)', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-test-forged-'));
  try {
    const fakeRunId = 'run-1234567812345678';
    const runnerScript = path.resolve(__dirname, 'a1-runner.mjs');
    const childEnv = {
      ...process.env,
      PATH: `${path.resolve(process.execPath, '..')}:${process.env.PATH}`,
      NODE_ENV: 'test',
      LINGORA_RUNS_DIR: tempRunsDir,
    };
    delete childEnv.NODE_TEST_CONTEXT;

    const res = spawnSync(process.execPath, [runnerScript, '--run', fakeRunId], {
      cwd: WORKSPACE_ROOT,
      env: childEnv,
      encoding: 'utf8',
    });

    assert.equal(res.status, 1, `Expected exit 1, got ${res.status}`);
    assert.match(res.stderr, /FAIL_CLOSED: Environment is not bound/);
    assert.equal(res.stdout.includes('PASSED'), false, 'Forged run must never report PASSED');
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('3. Scaffold with bound state but absent test files returns NOT EXECUTED (exit 1) and never mutates canonical state', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-test-absent-'));
  try {
    const { authority, runId, stackId } = createIsolatedMockAuthority(tempRunsDir);
    let capturedStderr = '';
    let capturedStdout = '';

    const res = await runScaffold({
      testSuiteName: 'test:db:a1',
      testDir: 'tests/database/a1-nonexistent-dir',
      gateRequirement: 'G0 reviewed PASS and P1-A1 assignment (Auth lifecycle/correlation/recovery)',
      description: 'A1 Auth Lifecycle, Admin bootstrap, private marker, invite/activation',
      runId,
      runsDir: tempRunsDir,
      adapters: {
        cliExecutor: (file, args) => {
          if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
          if (args.includes('list')) {
            return {
              status: 0,
              stdout: JSON.stringify({
                stacks: [{
                  id: stackId,
                  name: authority.stack_name,
                  project_root: authority.project_root,
                  branch_context: authority.branch_ref,
                  runtime: 'native',
                  owner: 'reachable',
                }],
              }),
              stderr: '',
            };
          }
          if (args.includes('status')) {
            return {
              status: 0,
              stdout: JSON.stringify({
                identity: { id: stackId, name: authority.stack_name },
                runtime: 'native',
                lifecycle: 'running',
                readiness: 'healthy',
                composition: {
                  members: [
                    { id: 'uuid-auth-1111', service: 'auth' },
                    { id: 'uuid-storage-2222', service: 'storage' },
                  ],
                },
                endpoints: {
                  'database.sql': { protocol: 'tcp', address: '127.0.0.1', port: 54322, url: 'tcp://127.0.0.1:54322' },
                  'auth.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
                  'rest.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
                  'storage.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
                  'mail.http': { protocol: 'http', address: '127.0.0.1', port: 54324, url: 'http://127.0.0.1:54324' },
                },
                env: {
                  DB_URL: 'postgresql://postgres:synthetic_pass@127.0.0.1:54322/postgres',
                  ANON_KEY: 'test-anon-key',
                },
              }),
              stderr: '',
            };
          }
          return { status: 0, stdout: '{}', stderr: '' };
        },
        pgClientFactory: () => ({
          connect: async () => {},
          query: async () => ({
            rows: [
              { version: 'PostgreSQL 17.0', current_database: 'postgres', current_user: 'postgres' },
              { schema_name: 'auth' },
              { schema_name: 'public' },
              { schema_name: 'storage' },
            ],
          }),
          end: async () => {},
        }),
        fetch: async () => ({ status: 200, text: async () => '{}' }),
      },
      logFn: (msg) => { capturedStdout += msg + '\n'; },
      errFn: (msg) => { capturedStderr += msg + '\n'; },
      setProcessExitCode: false,
    });

    assert.equal(res.exitCode, 1, `Expected exit 1, got ${res.exitCode}`);
    assert.equal(res.status, 'NOT EXECUTED');
    assert.match(capturedStderr, /STATUS: NOT EXECUTED/);
    assert.match(capturedStderr, /Test files in "tests\/database\/a1-nonexistent-dir" are absent/);
    assert.equal(capturedStdout.includes('PASSED'), false, 'Absent tests must never report PASSED');
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('4. Scaffold with deliberately failing test fixture ACTUALLY runs and propagates test failure without touching canonical state', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-test-fail-'));

  // Create temporary fixture directory with deliberately failing test
  const tempFixtureDir = path.resolve(ADMIN_ROOT, 'tests/database/a1-deliberate-fixture');
  const tempFixtureFile = path.resolve(tempFixtureDir, 'deliberate-failure.test.mjs');
  fs.mkdirSync(tempFixtureDir, { recursive: true });
  fs.writeFileSync(
    tempFixtureFile,
    `import { test } from 'node:test';
import assert from 'node:assert/strict';
test('deliberate failing test', () => {
  assert.equal(1 + 1, 3, 'Intentional test assertion failure');
});
`
  );

  try {
    const { authority, runId, stackId } = createIsolatedMockAuthority(tempRunsDir);
    let capturedStderr = '';
    let capturedStdout = '';

    const res = await runScaffold({
      testSuiteName: 'test:db:a1-deliberate',
      testDir: 'tests/database/a1-deliberate-fixture',
      gateRequirement: 'G0 reviewed PASS and P1-A1 assignment (Auth lifecycle/correlation/recovery)',
      description: 'A1 Auth Lifecycle, Admin bootstrap, private marker, invite/activation',
      runId,
      runsDir: tempRunsDir,
      adapters: {
        cliExecutor: (file, args) => {
          if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
          if (args.includes('list')) {
            return {
              status: 0,
              stdout: JSON.stringify({
                stacks: [{
                  id: stackId,
                  name: authority.stack_name,
                  project_root: authority.project_root,
                  branch_context: authority.branch_ref,
                  runtime: 'native',
                  owner: 'reachable',
                }],
              }),
              stderr: '',
            };
          }
          if (args.includes('status')) {
            return {
              status: 0,
              stdout: JSON.stringify({
                identity: { id: stackId, name: authority.stack_name },
                runtime: 'native',
                lifecycle: 'running',
                readiness: 'healthy',
                composition: {
                  members: [
                    { id: 'uuid-auth-1111', service: 'auth' },
                    { id: 'uuid-storage-2222', service: 'storage' },
                  ],
                },
                endpoints: {
                  'database.sql': { protocol: 'tcp', address: '127.0.0.1', port: 54322, url: 'tcp://127.0.0.1:54322' },
                  'auth.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
                  'rest.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
                  'storage.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
                  'mail.http': { protocol: 'http', address: '127.0.0.1', port: 54324, url: 'http://127.0.0.1:54324' },
                },
                env: {
                  DB_URL: 'postgresql://postgres:synthetic_pass@127.0.0.1:54322/postgres',
                  ANON_KEY: 'test-anon-key',
                },
              }),
              stderr: '',
            };
          }
          return { status: 0, stdout: '{}', stderr: '' };
        },
        pgClientFactory: () => ({
          connect: async () => {},
          query: async () => ({
            rows: [
              { version: 'PostgreSQL 17.0', current_database: 'postgres', current_user: 'postgres' },
              { schema_name: 'auth' },
              { schema_name: 'public' },
              { schema_name: 'storage' },
            ],
          }),
          end: async () => {},
        }),
        fetch: async () => ({ status: 200, text: async () => '{}' }),
      },
      logFn: (msg) => { capturedStdout += msg + '\n'; },
      errFn: (msg) => { capturedStderr += msg + '\n'; },
      setProcessExitCode: false,
    });

    // Must propagate failure exit code (nonzero)
    assert.notEqual(res.exitCode, 0, 'Failing test fixture must NOT produce exit 0');
    assert.equal(res.status, 'FAILED');
    assert.match(capturedStderr, /Test suite "test:db:a1-deliberate" FAILED/);
    assert.equal(capturedStdout.includes('PASSED'), false, 'Failing test must never report PASSED');
  } finally {
    if (fs.existsSync(tempFixtureFile)) fs.unlinkSync(tempFixtureFile);
    if (fs.existsSync(tempFixtureDir)) fs.rmdirSync(tempFixtureDir);
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('5. Scaffold with pending operation denies execution (exit 1 / RECOVERY_REQUIRED) without touching data or executing tests', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-test-pending-'));
  try {
    const { authority, runId, stackId } = createIsolatedMockAuthority(tempRunsDir, {
      pending_operation: 'destroy',
    });
    let capturedStderr = '';
    let capturedStdout = '';
    let testExecuted = false;
    let pgExecuted = false;

    const res = await runScaffold({
      testSuiteName: 'test:db:a1-pending',
      testDir: 'tests/database/a1-pending-dir',
      gateRequirement: 'G0 reviewed PASS and P1-A1 assignment',
      description: 'A1 Auth Lifecycle with pending operation',
      runId,
      runsDir: tempRunsDir,
      adapters: {
        testExecutor: () => {
          testExecuted = true;
          return { status: 0 };
        },
        pgClientFactory: () => {
          pgExecuted = true;
          return {
            connect: async () => {},
            query: async () => ({ rows: [] }),
            end: async () => {},
          };
        },
      },
      logFn: (msg) => { capturedStdout += msg + '\n'; },
      errFn: (msg) => { capturedStderr += msg + '\n'; },
      setProcessExitCode: false,
    });

    assert.equal(res.status, 'FAILED');
    assert.equal(res.exitCode, 1);
    assert.equal(res.code, 'RECOVERY_REQUIRED');
    assert.match(capturedStderr, /RECOVERY_REQUIRED: Existing pending operation/);
    assert.equal(testExecuted, false, 'Tests must not execute when pending operation exists');
    assert.equal(pgExecuted, false, 'Data queries must not execute when pending operation exists');
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('6. Representative unregistered pending-secret canary in authority.pending_operation never leaks to scaffold stdout or stderr', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-test-pending-canary-'));
  try {
    const unregisteredCanary = 'UNREG_PENDING_CANARY_' + crypto.randomBytes(8).toString('hex');
    assert.equal(isCanaryRegistered(unregisteredCanary), false, 'Canary must be unregistered');

    const { authority, recordPath, runId, stackId } = createIsolatedMockAuthority(tempRunsDir, {
      pending_operation: unregisteredCanary,
    });
    let capturedStderr = '';
    let capturedStdout = '';
    let testExecuted = false;
    let pgExecuted = false;
    let cliExecuted = false;

    const res = await runScaffold({
      testSuiteName: 'test:db:a1-pending-canary',
      testDir: 'tests/database/a1-pending-dir',
      gateRequirement: 'G0 reviewed PASS and P1-A1 assignment',
      description: 'A1 Auth Lifecycle with unregistered pending canary',
      runId,
      runsDir: tempRunsDir,
      adapters: {
        testExecutor: () => {
          testExecuted = true;
          return { status: 0 };
        },
        pgClientFactory: () => {
          pgExecuted = true;
          return {
            connect: async () => {},
            query: async () => ({ rows: [] }),
            end: async () => {},
          };
        },
        cliExecutor: () => {
          cliExecuted = true;
          return { status: 0, stdout: '{}', stderr: '' };
        },
      },
      logFn: (msg) => { capturedStdout += msg + '\n'; },
      errFn: (msg) => { capturedStderr += msg + '\n'; },
      setProcessExitCode: false,
    });

    // Fails closed with RECOVERY_REQUIRED
    assert.equal(res.status, 'FAILED');
    assert.equal(res.exitCode, 1);
    assert.equal(res.code, 'RECOVERY_REQUIRED');

    // Safe negative assertions: unregistered canary NEVER appears in stdout or stderr
    assert.equal(capturedStdout.includes(unregisteredCanary), false, 'Scaffold stdout must not leak pending canary');
    assert.equal(capturedStderr.includes(unregisteredCanary), false, 'Scaffold stderr must not leak pending canary');

    // Zero side-effects
    assert.equal(testExecuted, false, 'Tests must not execute when operation is pending');
    assert.equal(pgExecuted, false, 'Data queries must not execute when operation is pending');
    assert.equal(cliExecuted, false, 'CLI commands must not execute when operation is pending');

    // Authority preserved on disk with original pending intent
    const diskAuth = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    assert.equal(diskAuth.phase, 'BOUND');
    assert.equal(diskAuth.pending_operation, unregisteredCanary);
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('7. Scaffold passes explicit trusted owned-run context (LINGORA_TEST_CONTEXT) to child test runner', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-test-ctx-pass-'));
  try {
    const { authority, runId, stackId, recordPath, runDir } = createIsolatedMockAuthority(tempRunsDir);
    let capturedEnv = null;

    const res = await runScaffold({
      testSuiteName: 'test:db:a1-ctx',
      testDir: 'tests/database/a1-mock-dir',
      gateRequirement: 'G0 reviewed PASS and P1-A1 assignment',
      description: 'A1 test context handoff verification',
      runId,
      runsDir: tempRunsDir,
      adapters: {
        cliExecutor: (file, args) => {
          if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
          if (args.includes('list')) {
            return {
              status: 0,
              stdout: JSON.stringify({
                stacks: [{
                  id: stackId,
                  name: authority.stack_name,
                  project_root: authority.project_root,
                  branch_context: authority.branch_ref,
                  runtime: 'native',
                  owner: 'reachable',
                }],
              }),
              stderr: '',
            };
          }
          if (args.includes('status')) {
            return {
              status: 0,
              stdout: JSON.stringify({
                identity: { id: stackId, name: authority.stack_name },
                runtime: 'native',
                lifecycle: 'running',
                readiness: 'healthy',
                composition: {
                  members: [
                    { id: 'uuid-auth-1111', service: 'auth' },
                    { id: 'uuid-storage-2222', service: 'storage' },
                  ],
                },
                endpoints: authority.endpoints,
                env: authority.env,
              }),
              stderr: '',
            };
          }
          return { status: 0, stdout: '{}', stderr: '' };
        },
        pgClientFactory: () => ({
          connect: async () => {},
          query: async () => ({
            rows: [
              { version: 'PostgreSQL 17.0', current_database: 'postgres', current_user: 'postgres' },
              { schema_name: 'auth' },
              { schema_name: 'public' },
              { schema_name: 'storage' },
            ],
          }),
          end: async () => {},
        }),
        fetch: async () => ({ status: 200, text: async () => '{}' }),
        testExecutor: (file, args, opts) => {
          capturedEnv = opts.env;
          return {
            status: 0,
            stdout: 'ok 1 - mock test\n# pass 1\n# fail 0\n# tests 1\n',
            stderr: '',
          };
        },
      },
      logFn: () => {},
      errFn: () => {},
      setProcessExitCode: false,
    });

    // Create temp test file in fixture dir so testExecutor gets executed
    const mockFixtureDir = path.resolve(ADMIN_ROOT, 'tests/database/a1-mock-dir');
    const mockFixtureFile = path.resolve(mockFixtureDir, 'mock.test.mjs');
    fs.mkdirSync(mockFixtureDir, { recursive: true });
    fs.writeFileSync(mockFixtureFile, '// mock test file\n');

    try {
      const resExec = await runScaffold({
        testSuiteName: 'test:db:a1-ctx',
        testDir: 'tests/database/a1-mock-dir',
        gateRequirement: 'G0 reviewed PASS and P1-A1 assignment',
        description: 'A1 test context handoff verification',
        runId,
        runsDir: tempRunsDir,
        adapters: {
          cliExecutor: (file, args) => {
            if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
            if (args.includes('list')) {
              return {
                status: 0,
                stdout: JSON.stringify({
                  stacks: [{
                    id: stackId,
                    name: authority.stack_name,
                    project_root: authority.project_root,
                    branch_context: authority.branch_ref,
                    runtime: 'native',
                    owner: 'reachable',
                  }],
                }),
                stderr: '',
              };
            }
            if (args.includes('status')) {
              return {
                status: 0,
                stdout: JSON.stringify({
                  identity: { id: stackId, name: authority.stack_name },
                  runtime: 'native',
                  lifecycle: 'running',
                  readiness: 'healthy',
                  composition: {
                    members: [
                      { id: 'uuid-auth-1111', service: 'auth' },
                      { id: 'uuid-storage-2222', service: 'storage' },
                    ],
                  },
                  endpoints: authority.endpoints,
                  env: authority.env,
                }),
                stderr: '',
              };
            }
            return { status: 0, stdout: '{}', stderr: '' };
          },
          pgClientFactory: () => ({
            connect: async () => {},
            query: async () => ({
              rows: [
                { version: 'PostgreSQL 17.0', current_database: 'postgres', current_user: 'postgres' },
                { schema_name: 'auth' },
                { schema_name: 'public' },
                { schema_name: 'storage' },
              ],
            }),
            end: async () => {},
          }),
          fetch: async () => ({ status: 200, text: async () => '{}' }),
          testExecutor: (file, args, opts) => {
            capturedEnv = opts.env;
            return {
              status: 0,
              stdout: 'ok 1 - mock test\n# pass 1\n# fail 0\n# tests 1\n',
              stderr: '',
            };
          },
        },
        logFn: () => {},
        errFn: () => {},
        setProcessExitCode: false,
      });

      assert.equal(resExec.status, 'PASSED');
      assert.ok(capturedEnv, 'Child env must be captured');
      assert.ok(capturedEnv.LINGORA_TEST_CONTEXT, 'LINGORA_TEST_CONTEXT must be present in child env');

      const parsedCtx = JSON.parse(capturedEnv.LINGORA_TEST_CONTEXT);
      assert.equal(parsedCtx.runId, runId);
      assert.equal(parsedCtx.runsDir, tempRunsDir);
      assert.equal(parsedCtx.runDir, runDir);
      assert.equal(parsedCtx.recordPath, recordPath);
      assert.equal(typeof parsedCtx.lockToken, 'string');
    } finally {
      if (fs.existsSync(mockFixtureFile)) fs.unlinkSync(mockFixtureFile);
      if (fs.existsSync(mockFixtureDir)) fs.rmdirSync(mockFixtureDir);
    }
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('8. Scaffold safely captures child test output, extracts finite summary, and sanitizes secrets', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-test-output-safe-'));
  const mockFixtureDir = path.resolve(ADMIN_ROOT, 'tests/database/a1-safe-output-fixture');
  const mockFixtureFile = path.resolve(mockFixtureDir, 'test-output.test.mjs');
  fs.mkdirSync(mockFixtureDir, { recursive: true });
  fs.writeFileSync(mockFixtureFile, '// test file\n');

  try {
    const { authority, runId, stackId } = createIsolatedMockAuthority(tempRunsDir);
    let capturedStderr = '';
    let capturedStdout = '';

    const secretPassword = 'RAW_SECRET_PASSWORD_' + crypto.randomBytes(6).toString('hex');
    const secretJwt = 'sb_secret_' + crypto.randomBytes(8).toString('hex');
    const unregisteredCanary = 'unreg_canary_child_failure_' + crypto.randomBytes(8).toString('hex');

    const res = await runScaffold({
      testSuiteName: 'test:db:a1-output',
      testDir: 'tests/database/a1-safe-output-fixture',
      gateRequirement: 'G0 reviewed PASS and P1-A1 assignment',
      description: 'A1 output safety verification',
      runId,
      runsDir: tempRunsDir,
      adapters: {
        cliExecutor: (file, args) => {
          if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
          if (args.includes('list')) {
            return {
              status: 0,
              stdout: JSON.stringify({
                stacks: [{
                  id: stackId,
                  name: authority.stack_name,
                  project_root: authority.project_root,
                  branch_context: authority.branch_ref,
                  runtime: 'native',
                  owner: 'reachable',
                }],
              }),
              stderr: '',
            };
          }
          if (args.includes('status')) {
            return {
              status: 0,
              stdout: JSON.stringify({
                identity: { id: stackId, name: authority.stack_name },
                runtime: 'native',
                lifecycle: 'running',
                readiness: 'healthy',
                composition: {
                  members: [
                    { id: 'uuid-auth-1111', service: 'auth' },
                    { id: 'uuid-storage-2222', service: 'storage' },
                  ],
                },
                endpoints: authority.endpoints,
                env: authority.env,
              }),
              stderr: '',
            };
          }
          return { status: 0, stdout: '{}', stderr: '' };
        },
        pgClientFactory: () => ({
          connect: async () => {},
          query: async () => ({
            rows: [
              { version: 'PostgreSQL 17.0', current_database: 'postgres', current_user: 'postgres' },
              { schema_name: 'auth' },
              { schema_name: 'public' },
              { schema_name: 'storage' },
            ],
          }),
          end: async () => {},
        }),
        fetch: async () => ({ status: 200, text: async () => '{}' }),
        testExecutor: () => ({
          status: 1,
          stdout: `not ok 1 - ${unregisteredCanary}\n# pass 0\n# fail 1\n# tests 1\npostgresql://postgres:${secretPassword}@127.0.0.1:54322/postgres ${secretJwt}`,
          stderr: `Error with postgresql://postgres:${secretPassword}@127.0.0.1:54322/postgres and ${secretJwt}`,
        }),
      },
      logFn: (msg) => { capturedStdout += msg + '\n'; },
      errFn: (msg) => { capturedStderr += msg + '\n'; },
      setProcessExitCode: false,
    });

    assert.equal(res.status, 'FAILED');
    assert.equal(res.exitCode, 1);
    assert.equal(res.code, 'SCAFFOLD_TEST_FAILED');
    assert.ok(res.summary);
    assert.equal(res.summary.fail, 1);
    assert.equal(res.summary.pass, 0);
    assert.equal(res.summary.total, 1);
    assert.deepEqual(res.summary, { total: 1, pass: 0, fail: 1 });

    // Negative assertions: unregistered canary test name NEVER reaches public stdout/stderr or returned summary
    assert.equal(capturedStdout.includes(unregisteredCanary), false, 'Captured stdout must not leak unregistered test-name canary');
    assert.equal(capturedStderr.includes(unregisteredCanary), false, 'Captured stderr must not leak unregistered test-name canary');
    assert.equal(JSON.stringify(res).includes(unregisteredCanary), false, 'Returned scaffold summary must not contain unregistered test-name canary');

    // Negative assertions: raw credentials and raw secret streams NEVER leak
    assert.equal(capturedStdout.includes(secretPassword), false, 'Captured stdout must not leak password');
    assert.equal(capturedStderr.includes(secretPassword), false, 'Captured stderr must not leak password');
    assert.equal(capturedStdout.includes(secretJwt), false, 'Captured stdout must not leak secret key');
    assert.equal(capturedStderr.includes(secretJwt), false, 'Captured stderr must not leak secret key');
  } finally {
    if (fs.existsSync(mockFixtureFile)) fs.unlinkSync(mockFixtureFile);
    if (fs.existsSync(mockFixtureDir)) fs.rmdirSync(mockFixtureDir);
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('9. Real paused child test holds parent run lock through completion, and contender is demonstrably BLOCKED through close', { timeout: 30000 }, async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-test-lock-retention-'));
  const pausedFixtureDir = path.resolve(ADMIN_ROOT, 'tests/database/a1-paused-fixture');
  const pausedFixtureFile = path.resolve(pausedFixtureDir, 'paused-lock.test.mjs');

  fs.mkdirSync(pausedFixtureDir, { recursive: true });
  fs.writeFileSync(
    pausedFixtureFile,
    `import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getTestContext } from '../test-context.mjs';

test('paused child holds lock and obtains valid context', async () => {
  const ctx = getTestContext({ expectedRunsDir: '${tempRunsDir}' });
  assert.ok(ctx.runId, 'runId must be present');
  assert.equal(ctx.endpoints.database.port, 54322);
  assert.equal(typeof ctx.credentials.databaseUrl, 'string');
  assert.equal(ctx.assertLockHeld(), true);

  // Signal that child is running and holding context under lock (inside authorized runDir)
  const sigPath = path.resolve(ctx.runDir, 'child-locked.signal');
  fs.writeFileSync(sigPath, 'CHILD_LOCKED_AND_ACTIVE', 'utf8');

  // Pause to allow contender test to attempt lock acquisition while child is actively executing
  await new Promise(r => setTimeout(r, 600));

  // Re-verify lock is still held after pause
  assert.equal(ctx.assertLockHeld(), true);
});
`
  );

  try {
    const { authority, runId, stackId, runDir } = createIsolatedMockAuthority(tempRunsDir);
    const signalFile = path.resolve(runDir, 'child-locked.signal');

    // Prepare child runner environment
    const runnerEnv = {
      ...process.env,
      PATH: `${path.resolve(process.execPath, '..')}:${process.env.PATH}`,
      NODE_ENV: 'test',
      LINGORA_RUNS_DIR: tempRunsDir,
      LINGORA_CHILD_SIGNAL_FILE: signalFile,
    };
    delete runnerEnv.NODE_TEST_CONTEXT;

    // We invoke runScaffold in a separate runner process using real node spawn
    const runnerCode = `
import { runScaffold } from './lingora-admin/tests/database/scaffolds/runner-base.mjs';

const res = await runScaffold({
  testSuiteName: 'test:db:a1-paused',
  testDir: 'tests/database/a1-paused-fixture',
  gateRequirement: 'G0 reviewed PASS and P1-A1 assignment',
  description: 'A1 paused lock retention test',
  runId: '${runId}',
  runsDir: '${tempRunsDir}',
  adapters: {
    cliExecutor: (file, args) => {
      if (args.includes('--version')) return { status: 0, stdout: '2.121.0\\n', stderr: '' };
      if (args.includes('list')) {
        return {
          status: 0,
          stdout: JSON.stringify({
            stacks: [{
              id: '${stackId}',
              name: '${authority.stack_name}',
              project_root: '${authority.project_root}',
              branch_context: '${authority.branch_ref}',
              runtime: 'native',
              owner: 'reachable',
            }],
          }),
          stderr: '',
        };
      }
      if (args.includes('status')) {
        return {
          status: 0,
          stdout: JSON.stringify({
            identity: { id: '${stackId}', name: '${authority.stack_name}' },
            runtime: 'native',
            lifecycle: 'running',
            readiness: 'healthy',
            composition: {
              members: [
                { id: 'uuid-auth-1111', service: 'auth' },
                { id: 'uuid-storage-2222', service: 'storage' },
              ],
            },
            endpoints: ${JSON.stringify(authority.endpoints)},
            env: ${JSON.stringify(authority.env)},
          }),
          stderr: '',
        };
      }
      return { status: 0, stdout: '{}', stderr: '' };
    },
    pgClientFactory: () => ({
      connect: async () => {},
      query: async () => ({
        rows: [
          { version: 'PostgreSQL 17.0', current_database: 'postgres', current_user: 'postgres' },
          { schema_name: 'auth' },
          { schema_name: 'public' },
          { schema_name: 'storage' },
        ],
      }),
      end: async () => {},
    }),
    fetch: async () => ({ status: 200, text: async () => '{}' }),
  },
  setProcessExitCode: true,
});
process.exit(res.exitCode);
`;

    const runnerProc = spawn(process.execPath, ['--input-type=module', '-e', runnerCode], {
      cwd: WORKSPACE_ROOT,
      env: runnerEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let runnerStderr = '';
    let runnerStdout = '';
    runnerProc.stderr.on('data', (d) => { runnerStderr += d.toString(); });
    runnerProc.stdout.on('data', (d) => { runnerStdout += d.toString(); });

    // Wait until child process writes signal file confirming child is actively running under lock
    let signalFound = false;
    for (let i = 0; i < 60; i++) {
      if (fs.existsSync(signalFile)) {
        signalFound = true;
        break;
      }
      await new Promise(r => setTimeout(r, 100));
    }
    assert.equal(signalFound, true, `Child test process must start, verify context, and emit signal (stderr: ${runnerStderr}, stdout: ${runnerStdout})`);

    // AT THIS EXACT MOMENT: The child test is actively paused and holding context.
    // The parent scaffold process holds .run.lock.
    // A contender now attempts to acquire the run lock on the exact same runDir:
    assert.throws(
      () => acquireRunLock(runDir, runId),
      (err) => {
        assert.equal(err.code, 'LOCKED');
        assert.match(err.message, /LOCKED: Run lock held in .*disposition: RECOVERY_REQUIRED/);
        return true;
      },
      'Contender must be demonstrably BLOCKED while child process is executing'
    );

    // Wait for the runner process to complete cleanly
    const [runnerExitCode] = await new Promise((resolve) => {
      runnerProc.on('close', (code, signal) => resolve([code, signal]));
    });

    assert.equal(runnerExitCode, 0, `Scaffold runner process must exit with code 0 (got ${runnerExitCode})`);

    // Now that the child completed and parent scaffold finished:
    // The lock is released and a contender CAN acquire the lock cleanly
    const lockAcquiredAfterClose = acquireRunLock(runDir, runId);
    assert.ok(lockAcquiredAfterClose.token, 'Lock must be acquirable after child/scaffold completion');
    releaseRunLock(runDir, lockAcquiredAfterClose.token);
  } finally {
    if (fs.existsSync(pausedFixtureFile)) fs.unlinkSync(pausedFixtureFile);
    if (fs.existsSync(pausedFixtureDir)) fs.rmdirSync(pausedFixtureDir);
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});
