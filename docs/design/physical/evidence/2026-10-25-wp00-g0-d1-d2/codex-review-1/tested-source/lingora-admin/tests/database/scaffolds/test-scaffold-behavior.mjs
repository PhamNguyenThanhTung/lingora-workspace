/**
 * Persistent Test Suite for Scaffold Honest Behavior (G0-R5).
 *
 * Verifies:
 * - Unbound target fails closed (exit code 1).
 * - Missing tests return NOT EXECUTED with exit code 1. Never fake PASS.
 * - Deliberately failing test fixture ACTUALLY executes and propagates nonzero failure.
 * - Scaffold tests CANNOT overwrite or mutate real canonical state.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import {
  CANONICAL_WORKSPACE_ROOT,
  CANONICAL_CONFIG_PATH,
  TASK_STATE_ROOT,
  TASK_BINDING_FILE,
  getGitBranch,
} from '../env/env-guard.mjs';
import { runScaffold } from './runner-base.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ADMIN_ROOT = path.resolve(__dirname, '../../..');
const WORKSPACE_ROOT = CANONICAL_WORKSPACE_ROOT;

function createIsolatedMockBinding(tempDir) {
  const configContent = fs.readFileSync(CANONICAL_CONFIG_PATH, 'utf8');
  const configDigest = crypto.createHash('sha256').update(configContent).digest('hex');
  const gitBranch = getGitBranch(WORKSPACE_ROOT);
  const stackId = crypto.createHash('sha256').update('test-scaffold-mock-stack').digest('hex');

  const mockBinding = {
    version: '1.0',
    taskId: 'test-scaffold-isolation',
    stackName: 'lingora-wp00-mock',
    stackId,
    id: stackId,
    runtime: 'native',
    projectRoot: fs.realpathSync(WORKSPACE_ROOT),
    workdir: fs.realpathSync(WORKSPACE_ROOT),
    configPath: fs.realpathSync(CANONICAL_CONFIG_PATH),
    configDigest,
    gitBranch: gitBranch.startsWith('refs/heads/') ? gitBranch : `refs/heads/${gitBranch}`,
    homeDir: fs.realpathSync(tempDir),
    stateRoot: fs.realpathSync(tempDir),
    endpoints: {
      'database.sql': { protocol: 'tcp', address: '127.0.0.1', port: 54322, url: 'tcp://127.0.0.1:54322' },
      'auth.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
      'rest.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
      'storage.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
      'mail.http': { protocol: 'http', address: '127.0.0.1', port: 54324, url: 'http://127.0.0.1:54324' },
    },
    env: {
      DB_URL: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
      API_URL: 'http://127.0.0.1:54321',
    },
  };

  const bindingFile = path.resolve(tempDir, 'runtime-binding.json');
  fs.writeFileSync(bindingFile, JSON.stringify(mockBinding, null, 2));
  return { bindingFile, mockBinding };
}

test('1. Scaffold fails closed (exit 1) on unbound environment', () => {
  const runnerScript = path.resolve(__dirname, 'a1-runner.mjs');
  const cleanEnv = { ...process.env };
  delete cleanEnv.NODE_TEST_CONTEXT;
  delete cleanEnv.LINGORA_TEST_STATE_FILE;
  delete cleanEnv.LINGORA_SCAFFOLD_TEST_ISOLATION;

  const res = spawnSync(process.execPath, [runnerScript], {
    cwd: WORKSPACE_ROOT,
    env: cleanEnv,
    encoding: 'utf8',
  });

  assert.equal(res.status, 1, `Expected exit 1, got ${res.status}`);
  assert.match(res.stderr, /FAIL_CLOSED: Environment is not bound/);
  assert.equal(res.stdout.includes('PASSED'), false, 'Unbound scaffold must never report PASSED');
});

test('2. Forged test env flags (NODE_ENV=test, LINGORA_SCAFFOLD_TEST_ISOLATION=1) do NOT bypass native reconciliation (fails closed with exit 1)', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-test-forged-'));
  const canonicalBeforeExists = fs.existsSync(TASK_BINDING_FILE);
  const canonicalBeforeContent = canonicalBeforeExists ? fs.readFileSync(TASK_BINDING_FILE, 'utf8') : null;

  try {
    const { bindingFile: testBindingFile } = createIsolatedMockBinding(tempDir);
    const runnerScript = path.resolve(__dirname, 'a1-runner.mjs');
    const childEnv = {
      ...process.env,
      PATH: `${path.resolve(process.execPath, '..')}:${process.env.PATH}`,
      NODE_ENV: 'test',
      LINGORA_SCAFFOLD_TEST_ISOLATION: '1',
      LINGORA_TEST_STATE_FILE: testBindingFile,
    };
    delete childEnv.NODE_TEST_CONTEXT;

    const res = spawnSync(process.execPath, [runnerScript], {
      cwd: WORKSPACE_ROOT,
      env: childEnv,
      encoding: 'utf8',
    });

    assert.equal(res.status, 1, `Expected exit 1, got ${res.status}`);
    assert.match(res.stderr, /RECONCILE_FAIL/);
    assert.equal(res.stderr.includes('STATUS: NOT EXECUTED'), false, 'Reconciliation failure must block reaching test suite execution');
    assert.equal(res.stdout.includes('PASSED'), false, 'Forged run must never report PASSED');

    // Assert canonical state was NOT overwritten or created
    const canonicalAfterExists = fs.existsSync(TASK_BINDING_FILE);
    assert.equal(canonicalAfterExists, canonicalBeforeExists, 'Canonical state file presence must be unchanged');
    if (canonicalBeforeExists) {
      assert.equal(
        fs.readFileSync(TASK_BINDING_FILE, 'utf8'),
        canonicalBeforeContent,
        'Canonical state content must be unchanged'
      );
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('3. Scaffold with isolated bound state but absent test files returns NOT EXECUTED (exit 1) and never mutates canonical state', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-test-absent-'));
  const canonicalBeforeExists = fs.existsSync(TASK_BINDING_FILE);
  const canonicalBeforeContent = canonicalBeforeExists ? fs.readFileSync(TASK_BINDING_FILE, 'utf8') : null;

  try {
    const { bindingFile: testBindingFile, mockBinding } = createIsolatedMockBinding(tempDir);
    let capturedStderr = '';
    let capturedStdout = '';

    const res = await runScaffold({
      testSuiteName: 'test:db:a1',
      testDir: 'tests/database/a1',
      gateRequirement: 'G0 reviewed PASS and P1-A1 assignment (Auth lifecycle/correlation/recovery)',
      description: 'A1 Auth Lifecycle, Admin bootstrap, private marker, invite/activation',
      bindingFile: testBindingFile,
      adapters: {
        cliExecutor: (file, args) => {
          if (args.includes('list')) {
            return {
              status: 0,
              stdout: JSON.stringify({
                stacks: [{
                  id: mockBinding.stackId,
                  name: mockBinding.stackName,
                  project_root: mockBinding.projectRoot,
                  branch_context: mockBinding.gitBranch,
                  runtime: 'native',
                }],
              }),
            };
          }
          return { status: 0, stdout: '2.121.0\n' };
        },
      },
      logFn: (msg) => { capturedStdout += msg + '\n'; },
      errFn: (msg) => { capturedStderr += msg + '\n'; },
      setProcessExitCode: false,
    });

    assert.equal(res.exitCode, 1, `Expected exit 1, got ${res.exitCode}`);
    assert.equal(res.status, 'NOT EXECUTED');
    assert.match(capturedStderr, /STATUS: NOT EXECUTED/);
    assert.match(capturedStderr, /Test files in "tests\/database\/a1" are absent/);
    assert.equal(capturedStdout.includes('PASSED'), false, 'Absent tests must never report PASSED');

    // Assert canonical state was NOT overwritten or created
    const canonicalAfterExists = fs.existsSync(TASK_BINDING_FILE);
    assert.equal(canonicalAfterExists, canonicalBeforeExists, 'Canonical state file presence must be unchanged');
    if (canonicalBeforeExists) {
      assert.equal(
        fs.readFileSync(TASK_BINDING_FILE, 'utf8'),
        canonicalBeforeContent,
        'Canonical state content must be unchanged'
      );
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('4. Scaffold with deliberately failing test fixture ACTUALLY runs and propagates test failure without touching canonical state', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-test-fail-'));
  const canonicalBeforeExists = fs.existsSync(TASK_BINDING_FILE);
  const canonicalBeforeContent = canonicalBeforeExists ? fs.readFileSync(TASK_BINDING_FILE, 'utf8') : null;

  // Create temporary fixture directory with deliberately failing test
  const tempFixtureDir = path.resolve(ADMIN_ROOT, 'tests/database/a1');
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
    const { bindingFile: testBindingFile, mockBinding } = createIsolatedMockBinding(tempDir);
    let capturedStderr = '';
    let capturedStdout = '';

    const res = await runScaffold({
      testSuiteName: 'test:db:a1',
      testDir: 'tests/database/a1',
      gateRequirement: 'G0 reviewed PASS and P1-A1 assignment (Auth lifecycle/correlation/recovery)',
      description: 'A1 Auth Lifecycle, Admin bootstrap, private marker, invite/activation',
      bindingFile: testBindingFile,
      adapters: {
        cliExecutor: (file, args) => {
          if (args.includes('list')) {
            return {
              status: 0,
              stdout: JSON.stringify({
                stacks: [{
                  id: mockBinding.stackId,
                  name: mockBinding.stackName,
                  project_root: mockBinding.projectRoot,
                  branch_context: mockBinding.gitBranch,
                  runtime: 'native',
                }],
              }),
            };
          }
          return { status: 0, stdout: '2.121.0\n' };
        },
      },
      logFn: (msg) => { capturedStdout += msg + '\n'; },
      errFn: (msg) => { capturedStderr += msg + '\n'; },
      setProcessExitCode: false,
    });

    // Must propagate failure exit code (nonzero)
    assert.notEqual(res.exitCode, 0, 'Failing test fixture must NOT produce exit 0');
    assert.equal(res.status, 'FAILED');
    assert.match(capturedStderr, /Test suite "test:db:a1" FAILED/);
    assert.equal(capturedStdout.includes('PASSED'), false, 'Failing test must never report PASSED');

    // Assert canonical state was NOT overwritten or created
    const canonicalAfterExists = fs.existsSync(TASK_BINDING_FILE);
    assert.equal(canonicalAfterExists, canonicalBeforeExists, 'Canonical state file presence must be unchanged');
    if (canonicalBeforeExists) {
      assert.equal(
        fs.readFileSync(TASK_BINDING_FILE, 'utf8'),
        canonicalBeforeContent,
        'Canonical state content must be unchanged'
      );
    }
  } finally {
    if (fs.existsSync(tempFixtureFile)) fs.unlinkSync(tempFixtureFile);
    if (fs.existsSync(tempFixtureDir)) fs.rmdirSync(tempFixtureDir);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
