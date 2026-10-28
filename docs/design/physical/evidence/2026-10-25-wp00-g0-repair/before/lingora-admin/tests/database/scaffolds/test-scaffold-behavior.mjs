/**
 * Persistent Test Suite for Scaffold Honest Behavior (G0-R5).
 *
 * Verifies:
 * - Unbound target fails closed (exit code 1).
 * - Missing tests return NOT EXECUTED with exit code 1. Never fake PASS.
 * - Deliberately failing test fixture ACTUALLY executes and propagates nonzero failure.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ADMIN_ROOT = path.resolve(__dirname, '../../..');
const WORKSPACE_ROOT = path.resolve(ADMIN_ROOT, '..');

test('1. Scaffold fails closed (exit 1) on unbound environment', () => {
  const runnerScript = path.resolve(__dirname, 'a1-runner.mjs');
  const res = spawnSync('node', [runnerScript], {
    cwd: WORKSPACE_ROOT,
    encoding: 'utf8',
  });

  assert.equal(res.status, 1, `Expected exit 1, got ${res.status}`);
  assert.match(res.stderr, /FAIL_CLOSED: Environment is not bound/);
  assert.equal(res.stdout.includes('PASSED'), false, 'Unbound scaffold must never report PASSED');
});

test('2. Scaffold with mock bound state but absent test files returns NOT EXECUTED (exit 1)', () => {
  const localStackDir = path.resolve(WORKSPACE_ROOT, '.local-stack');
  const stateFile = path.resolve(localStackDir, 'runtime-state.json');
  fs.mkdirSync(localStackDir, { recursive: true });

  const mockBoundState = {
    id: 'test-stack-id-12345',
    runtime: 'native',
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

  fs.writeFileSync(stateFile, JSON.stringify(mockBoundState, null, 2));

  try {
    const runnerScript = path.resolve(__dirname, 'a1-runner.mjs');
    const res = spawnSync('node', [runnerScript], {
      cwd: WORKSPACE_ROOT,
      encoding: 'utf8',
    });

    assert.equal(res.status, 1, `Expected exit 1, got ${res.status}`);
    assert.match(res.stderr, /STATUS: NOT EXECUTED/);
    assert.match(res.stderr, /Test files in "tests\/database\/a1" are absent/);
    assert.equal(res.stdout.includes('PASSED'), false, 'Absent tests must never report PASSED');
  } finally {
    if (fs.existsSync(stateFile)) fs.unlinkSync(stateFile);
  }
});

test('3. Scaffold with deliberately failing test fixture ACTUALLY runs and propagates test failure', () => {
  const localStackDir = path.resolve(WORKSPACE_ROOT, '.local-stack');
  const stateFile = path.resolve(localStackDir, 'runtime-state.json');
  fs.mkdirSync(localStackDir, { recursive: true });

  const mockBoundState = {
    id: 'test-stack-id-12345',
    runtime: 'native',
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
  fs.writeFileSync(stateFile, JSON.stringify(mockBoundState, null, 2));

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
    const runnerScript = path.resolve(__dirname, 'a1-runner.mjs');
    const childEnv = { ...process.env };
    delete childEnv.NODE_TEST_CONTEXT;
    const res = spawnSync('node', [runnerScript], {
      cwd: WORKSPACE_ROOT,
      env: childEnv,
      encoding: 'utf8',
    });

    // Must propagate failure exit code (nonzero)
    assert.notEqual(res.status, 0, 'Failing test fixture must NOT produce exit 0');
    assert.match(res.stderr, /Test suite "test:db:a1" FAILED/);
    assert.equal(res.stdout.includes('PASSED'), false, 'Failing test must never report PASSED');
  } finally {
    // Clean up temporary fixture
    if (fs.existsSync(tempFixtureFile)) fs.unlinkSync(tempFixtureFile);
    if (fs.existsSync(tempFixtureDir)) fs.rmdirSync(tempFixtureDir);
    if (fs.existsSync(stateFile)) fs.unlinkSync(stateFile);
  }
});
