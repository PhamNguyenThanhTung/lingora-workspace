import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const WORKSPACE_ROOT = '/home/tung/workspace/school/project1/lingora-workspace';
const NODE_BIN = '/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node';

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

const envGuardPath = path.resolve(WORKSPACE_ROOT, 'lingora-admin/tests/database/env/env-guard.mjs');
const stackMgrPath = path.resolve(WORKSPACE_ROOT, 'lingora-admin/tests/database/env/stack-manager.mjs');

const initialHashes = {
  envGuard: sha256(envGuardPath),
  stackMgr: sha256(stackMgrPath),
};

const results = [];
let fullLog = '';

function log(msg) {
  console.log(msg);
  fullLog += msg + '\n';
}

function runTest(testNamePattern = '') {
  const args = ['--test'];
  if (testNamePattern) args.push(`--test-name-pattern=${testNamePattern}`);
  args.push('lingora-admin/tests/database/env/test-env-guard.mjs');

  const res = spawnSync(NODE_BIN, args, {
    cwd: WORKSPACE_ROOT,
    env: {
      ...process.env,
      PATH: `/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:${process.env.PATH || ''}`,
    },
    encoding: 'utf8',
  });

  return {
    status: res.status,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
  };
}

// -----------------------------------------------------------------------------
// Mutation 1: Bypass pre-prepare registry existence check in stack-manager.mjs
// -----------------------------------------------------------------------------
log('=== Mutation 1: Pre-prepare registry check bypass ===');
const origStackMgr = fs.readFileSync(stackMgrPath, 'utf8');
try {
  const target1 = 'throw new Error(`PREPARE_FAIL: Stack name "${authority.stack_name}" already exists in native registry.`);';
  const mutated1 = origStackMgr.replace(target1, '/* mutated bypass */');
  if (mutated1 === origStackMgr) throw new Error('Target string for Mutation 1 not found');
  fs.writeFileSync(stackMgrPath, mutated1, 'utf8');

  const res1 = runTest('F02b');
  log(`Mutation 1 test exit code: ${res1.status}`);
  results.push({
    id: 'MUT-01',
    description: 'Bypass pre-prepare registry existence check in stack-manager.mjs',
    targetFile: 'lingora-admin/tests/database/env/stack-manager.mjs',
    testExitCode: res1.status,
    caughtByTests: res1.status !== 0,
    expectedExit: 1,
  });
} finally {
  fs.writeFileSync(stackMgrPath, origStackMgr, 'utf8');
  const restoredHash = sha256(stackMgrPath);
  if (restoredHash !== initialHashes.stackMgr) {
    throw new Error(`Failed to restore stack-manager.mjs! Hash mismatch: ${restoredHash} vs ${initialHashes.stackMgr}`);
  }
  log(`Mutation 1 restored successfully. Hash: ${restoredHash}`);
}

// -----------------------------------------------------------------------------
// Mutation 2: Invert post-destroy registry absence check in stack-manager.mjs
// -----------------------------------------------------------------------------
log('\n=== Mutation 2: Invert post-destroy registry absence check ===');
try {
  const target2 = 'if (stillPresent) {';
  const mutated2 = origStackMgr.replace(target2, 'if (!stillPresent) {');
  if (mutated2 === origStackMgr) throw new Error('Target string for Mutation 2 not found');
  fs.writeFileSync(stackMgrPath, mutated2, 'utf8');

  const res2 = runTest('P03: Full lifecycle');
  log(`Mutation 2 test exit code: ${res2.status}`);
  results.push({
    id: 'MUT-02',
    description: 'Invert post-destroy registry absence check in stack-manager.mjs',
    targetFile: 'lingora-admin/tests/database/env/stack-manager.mjs',
    testExitCode: res2.status,
    caughtByTests: res2.status !== 0,
    expectedExit: 1,
  });
} finally {
  fs.writeFileSync(stackMgrPath, origStackMgr, 'utf8');
  const restoredHash = sha256(stackMgrPath);
  if (restoredHash !== initialHashes.stackMgr) {
    throw new Error(`Failed to restore stack-manager.mjs! Hash mismatch: ${restoredHash} vs ${initialHashes.stackMgr}`);
  }
  log(`Mutation 2 restored successfully. Hash: ${restoredHash}`);
}

// -----------------------------------------------------------------------------
// Mutation 3: Echo raw exception text in projectFiniteOutput (leak canaries)
// -----------------------------------------------------------------------------
log('\n=== Mutation 3: Echo raw exception text in projectFiniteOutput ===');
const origEnvGuard = fs.readFileSync(envGuardPath, 'utf8');
try {
  const target3 = 'const message = STATIC_SAFE_MESSAGES[code] || STATIC_SAFE_MESSAGES.UNKNOWN_ERROR;';
  const mutated3 = origEnvGuard.replace(
    target3,
    'const message = record.message || STATIC_SAFE_MESSAGES[code] || STATIC_SAFE_MESSAGES.UNKNOWN_ERROR;'
  );
  if (mutated3 === origEnvGuard) throw new Error('Target string for Mutation 3 not found');
  fs.writeFileSync(envGuardPath, mutated3, 'utf8');

  const res3 = runTest('E01 & E02');
  log(`Mutation 3 test exit code: ${res3.status}`);
  results.push({
    id: 'MUT-03',
    description: 'Echo arbitrary message in projectFiniteOutput in env-guard.mjs',
    targetFile: 'lingora-admin/tests/database/env/env-guard.mjs',
    testExitCode: res3.status,
    caughtByTests: res3.status !== 0,
    expectedExit: 1,
  });
} finally {
  fs.writeFileSync(envGuardPath, origEnvGuard, 'utf8');
  const restoredHash = sha256(envGuardPath);
  if (restoredHash !== initialHashes.envGuard) {
    throw new Error(`Failed to restore env-guard.mjs! Hash mismatch: ${restoredHash} vs ${initialHashes.envGuard}`);
  }
  log(`Mutation 3 restored successfully. Hash: ${restoredHash}`);
}

// Write results
const outJsonPath = path.resolve(WORKSPACE_ROOT, 'docs/design/physical/evidence/2026-10-25-wp00-g0-d1-d2/worker/correction-1/mutation-results.json');
fs.writeFileSync(outJsonPath, JSON.stringify(results, null, 2), 'utf8');

const outLogPath = path.resolve(WORKSPACE_ROOT, 'docs/design/physical/evidence/2026-10-25-wp00-g0-d1-d2/worker/correction-1/logs/mutation-checks.log');
fs.writeFileSync(outLogPath, fullLog, 'utf8');

log('\nAll mutation checks completed and verified. Final results:');
log(JSON.stringify(results, null, 2));
