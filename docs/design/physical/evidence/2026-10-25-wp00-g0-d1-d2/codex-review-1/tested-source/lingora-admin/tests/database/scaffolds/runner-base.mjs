/**
 * Base Scaffold Runner for Lingora Database Test Commands.
 *
 * Implements WP-00/G0 D2:
 * - Fails closed if environment is unbound, malformed, or unallowlisted.
 * - Always reconciles native registry whenever state claims to be bound (ZERO environment bypasses).
 * - Fails and outputs NOT EXECUTED with exit code 1 when actual tests/prerequisites are absent.
 * - Never returns PASS on skipped or missing tests.
 * - If test files are present, ACTUALLY executes them and propagates the exit code.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_WORKSPACE_ROOT,
  DEFAULT_RUNS_DIR,
  validateAuthorityRecord,
  getValidatedRuntimeState,
  reconcileNativeRegistry,
  sanitizeString,
} from '../env/env-guard.mjs';
import { resolveSupabaseCli } from '../env/stack-manager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ADMIN_ROOT = path.resolve(__dirname, '../../..');

export async function runScaffold({
  testSuiteName,
  testDir,
  gateRequirement,
  description,
  adapters = {},
  runId: explicitRunId = null,
  bindingFile: explicitBindingFile = null,
  logFn = console.log,
  errFn = console.error,
  setProcessExitCode = true,
}) {
  logFn('================================================================================');
  logFn(`[TEST-SCAFFOLD] Invocating: ${testSuiteName}`);
  logFn(`[TEST-SCAFFOLD] Description: ${description}`);
  logFn(`[TEST-SCAFFOLD] Gate: ${gateRequirement}`);
  logFn('================================================================================');

  // Parse command line flags or options for run
  let runId = explicitRunId;
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--run' && process.argv[i + 1]) {
      runId = process.argv[i + 1];
      break;
    }
  }
  if (!runId && process.env.LINGORA_RUN_ID) {
    runId = process.env.LINGORA_RUN_ID;
  }

  const targetBindingFile = explicitBindingFile || process.env.LINGORA_TEST_STATE_FILE || null;

  let runtimeState;
  try {
    if (targetBindingFile) {
      runtimeState = getValidatedRuntimeState(targetBindingFile, { allowTempRoots: true });
    } else if (runId) {
      const runDir = path.resolve(DEFAULT_RUNS_DIR, runId);
      runtimeState = validateAuthorityRecord(path.resolve(runDir, 'owner.json'));
    } else {
      runtimeState = getValidatedRuntimeState();
    }

    // STRICT INVARIANT: Always reconcile native registry whenever state claims to be bound.
    // There are NO environment variable bypass paths.
    if (runtimeState && runtimeState.bound) {
      const { cliPath } = resolveSupabaseCli({ adapters });
      reconcileNativeRegistry({ authority: runtimeState, adapters, cliPath });
    }
  } catch (err) {
    errFn(`[TEST-SCAFFOLD] ENV_ALLOWLIST_FAIL: ${sanitizeString(err.message)}`);
    if (setProcessExitCode) process.exitCode = 1;
    return { status: 'FAILED', exitCode: 1, error: err.message };
  }

  if (!runtimeState || !runtimeState.bound) {
    errFn(`[TEST-SCAFFOLD] FAIL_CLOSED: Environment is not bound (${runtimeState ? runtimeState.reason : 'unallocated'}).`);
    errFn('[TEST-SCAFFOLD] Refusing execution on unbound target.');
    if (setProcessExitCode) process.exitCode = 1;
    return { status: 'FAILED', exitCode: 1, error: 'Environment is not bound' };
  }

  logFn(`[TEST-SCAFFOLD] Environment: BOUND (Stack: ${runtimeState.instance_id || runtimeState.stackId}, Runtime: ${runtimeState.runtime})`);

  // Check for test files
  const targetDir = path.resolve(ADMIN_ROOT, testDir);
  const exists = fs.existsSync(targetDir);
  let testFiles = [];
  if (exists) {
    testFiles = fs.readdirSync(targetDir)
      .filter(f => f.endsWith('.test.mjs') || f.endsWith('.test.js') || f.endsWith('.test.ts'))
      .map(f => path.join(targetDir, f));
  }

  if (!exists || testFiles.length === 0) {
    errFn('--------------------------------------------------------------------------------');
    errFn('[TEST-SCAFFOLD] STATUS: NOT EXECUTED');
    errFn(`[TEST-SCAFFOLD] REASON: Test files in "${testDir}" are absent.`);
    errFn(`[TEST-SCAFFOLD] PREREQUISITE: Requires ${gateRequirement}.`);
    errFn('[TEST-SCAFFOLD] RESULT: Hard failure (exit 1). Never report PASS on missing tests.');
    errFn('--------------------------------------------------------------------------------');
    if (setProcessExitCode) process.exitCode = 1;
    return { status: 'NOT EXECUTED', exitCode: 1, reason: `Test files in "${testDir}" are absent.` };
  }

  // Execute test files and propagate exit code
  logFn(`[TEST-SCAFFOLD] Found ${testFiles.length} test files. Executing via Node test runner...`);
  const cleanEnv = { ...process.env, NODE_ENV: 'test' };
  delete cleanEnv.NODE_TEST_CONTEXT;

  const testExecutor = adapters.testExecutor || spawnSync;
  const nodeRes = testExecutor(process.execPath, ['--test', ...testFiles], {
    cwd: CANONICAL_WORKSPACE_ROOT,
    env: cleanEnv,
    encoding: 'utf8',
  });

  if (logFn === console.log && nodeRes.stdout) process.stdout.write(nodeRes.stdout);
  if (errFn === console.error && nodeRes.stderr) process.stderr.write(nodeRes.stderr);

  if (nodeRes.status !== 0) {
    errFn(`[TEST-SCAFFOLD] Test suite "${testSuiteName}" FAILED with exit code ${nodeRes.status}.`);
    if (setProcessExitCode) process.exitCode = nodeRes.status || 1;
    return { status: 'FAILED', exitCode: nodeRes.status || 1, childOutput: nodeRes.stderr || nodeRes.stdout };
  }

  logFn(`[TEST-SCAFFOLD] Test suite "${testSuiteName}" PASSED.`);
  if (setProcessExitCode) process.exitCode = 0;
  return { status: 'PASSED', exitCode: 0 };
}
