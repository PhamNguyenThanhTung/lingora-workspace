/**
 * Base Scaffold Runner for Lingora Database Test Commands.
 *
 * Implements WP-00/G0 D2:
 * - Fails closed if environment is unbound, malformed, or unallowlisted.
 * - Requires explicit --run <run-id>. Zero environment bypasses, no arbitrary binding files.
 * - Always runs under exclusive run lock.
 * - Always reconciles native registry and live status/member continuity under lock.
 * - Fails and outputs NOT EXECUTED with exit code 1 when actual tests/prerequisites are absent.
 * - Never returns PASS on skipped or missing tests.
 * - If test files are present, executes them in clean child env and propagates the exit code.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_WORKSPACE_ROOT,
  DEFAULT_RUNS_DIR,
  validateAuthorityRecord,
  reconcileNativeRegistry,
  verifyIncarnationContinuity,
  buildCleanChildEnv,
  parseStrictJson,
  sanitizeString,
} from '../env/env-guard.mjs';
import {
  resolveSupabaseCli,
  resolveRunContext,
  acquireRunLock,
  releaseRunLock,
  executeUnderLockDataAuthorization,
} from '../env/stack-manager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ADMIN_ROOT = path.resolve(__dirname, '../../..');

/**
 * Safely parse child Node test runner output into a finite summary.
 * Uses sanitizeString so secrets and unredacted canaries never leak.
 */
export function parseTestOutputSummary(stdout = '') {
  let passCount = 0;
  let failCount = 0;
  let totalCount = 0;
  const failedTests = [];
  const passedTests = [];

  const clean = sanitizeString(stdout);
  const lines = clean.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (/^(?:#|ℹ)\s+pass\s+(\d+)/.test(line)) {
      passCount = parseInt(line.match(/pass\s+(\d+)/)[1], 10);
    } else if (/^(?:#|ℹ)\s+fail\s+(\d+)/.test(line)) {
      failCount = parseInt(line.match(/fail\s+(\d+)/)[1], 10);
    } else if (/^(?:#|ℹ)\s+tests\s+(\d+)/.test(line)) {
      totalCount = parseInt(line.match(/tests\s+(\d+)/)[1], 10);
    } else if (/^(?:not ok\s+\d+\s+-\s+|✖\s+)(.+)/.test(line)) {
      const match = line.match(/^(?:not ok\s+\d+\s+-\s+|✖\s+)(.+)/);
      if (match && match[1]) {
        const name = match[1].replace(/\s+\(\d+(?:\.\d+)?m?s\)$/, '').trim();
        failedTests.push(name);
      }
    } else if (/^(?:ok\s+\d+\s+-\s+|✔\s+)(.+)/.test(line)) {
      const match = line.match(/^(?:ok\s+\d+\s+-\s+|✔\s+)(.+)/);
      if (match && match[1]) {
        const name = match[1].replace(/\s+\(\d+(?:\.\d+)?m?s\)$/, '').trim();
        passedTests.push(name);
      }
    }
  }

  return {
    total: totalCount || (passCount + failCount),
    pass: passCount,
    fail: failCount,
    failedTests,
    passedTests,
  };
}

export async function runScaffold({
  testSuiteName,
  testDir,
  gateRequirement,
  description,
  adapters = {},
  runId: explicitRunId = null,
  runsDir: explicitRunsDir = null,
  logFn = console.log,
  errFn = console.error,
  setProcessExitCode = true,
}) {
  logFn('================================================================================');
  logFn(`[TEST-SCAFFOLD] Invocating: ${testSuiteName}`);
  logFn(`[TEST-SCAFFOLD] Description: ${description}`);
  logFn(`[TEST-SCAFFOLD] Gate: ${gateRequirement}`);
  logFn('================================================================================');

  let runCtx;
  try {
    runCtx = resolveRunContext({ runId: explicitRunId, runsDir: explicitRunsDir }, 'test-scaffold');
  } catch (err) {
    errFn(`[TEST-SCAFFOLD] FAIL_CLOSED: COMMAND_INVALID: test-scaffold requires explicit --run <run-id>.`);
    if (setProcessExitCode) process.exitCode = 1;
    return { status: 'FAILED', exitCode: 1, code: 'COMMAND_INVALID' };
  }

  const { runId, runDir, recordPath } = runCtx;

  // Validate authority record first
  let authority;
  try {
    authority = validateAuthorityRecord(recordPath, { runsDir: explicitRunsDir, expectedRunId: runId });
  } catch (err) {
    errFn(`[TEST-SCAFFOLD] FAIL_CLOSED: Environment is not bound (${err.code || 'VALIDATION_ERROR'}).`);
    if (setProcessExitCode) process.exitCode = 1;
    return { status: 'FAILED', exitCode: 1, code: 'ALLOWLIST_FAIL' };
  }

  if (!authority.bound || authority.phase !== 'BOUND') {
    errFn(`[TEST-SCAFFOLD] FAIL_CLOSED: Environment is not bound.`);
    if (setProcessExitCode) process.exitCode = 1;
    return { status: 'FAILED', exitCode: 1, code: 'NOT_BOUND' };
  }

  // Acquire run lock
  let lock;
  try {
    lock = acquireRunLock(runDir, runId);
  } catch (err) {
    errFn('[TEST-SCAFFOLD] LOCK_FAIL: Could not acquire run lock.');
    if (setProcessExitCode) process.exitCode = 1;
    return { status: 'FAILED', exitCode: 1, code: 'LOCK_FAIL' };
  }

  try {
    // Under lock: re-validate authority
    authority = validateAuthorityRecord(recordPath, { runsDir: explicitRunsDir, expectedRunId: runId });
    if (!authority.bound || authority.phase !== 'BOUND') {
      throw new Error(`Environment phase is ${authority.phase}, not BOUND.`);
    }

    if (authority.pending_operation !== null && authority.pending_operation !== undefined) {
      errFn('[TEST-SCAFFOLD] RECOVERY_REQUIRED: Existing pending operation. Recovery required.');
      if (setProcessExitCode) process.exitCode = 1;
      return { status: 'FAILED', exitCode: 1, code: 'RECOVERY_REQUIRED' };
    }

    // Under lock: execute unified live data authorization
    await executeUnderLockDataAuthorization({
      runId,
      runsDir: explicitRunsDir,
      authority,
      recordPath,
      runDir,
      adapters,
    });

    logFn(`[TEST-SCAFFOLD] Environment: BOUND (Stack: ${authority.instance_id}, Runtime: ${authority.runtime})`);

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
      return { status: 'NOT EXECUTED', exitCode: 1, code: 'PREREQUISITE_ABSENT' };
    }

    // Execute test files and propagate exit code
    logFn(`[TEST-SCAFFOLD] Found ${testFiles.length} test files. Executing via Node test runner...`);
    const cleanEnv = buildCleanChildEnv(authority.home_dir);
    const testRunnerEnv = { ...cleanEnv, NODE_ENV: 'test' };
    delete testRunnerEnv.NODE_TEST_CONTEXT;

    // Explicit trusted owned-run context handoff for child tests (P1-00)
    const testContext = {
      runId,
      runsDir: explicitRunsDir || DEFAULT_RUNS_DIR,
      runDir,
      recordPath,
      lockToken: lock.token,
    };
    testRunnerEnv.LINGORA_TEST_CONTEXT = JSON.stringify(testContext);

    const testExecutor = adapters.testExecutor || spawnSync;
    const nodeRes = testExecutor(process.execPath, ['--test', ...testFiles], {
      cwd: CANONICAL_WORKSPACE_ROOT,
      env: testRunnerEnv,
      encoding: 'utf8',
    });

    const stdoutStr = (nodeRes && typeof nodeRes.stdout === 'string') ? nodeRes.stdout : '';
    const cleanStdout = sanitizeString(stdoutStr);
    const summary = parseTestOutputSummary(cleanStdout);

    if (nodeRes.status !== 0) {
      errFn(`[TEST-SCAFFOLD] Test suite "${testSuiteName}" FAILED with exit code ${nodeRes.status}.`);
      if (summary.failedTests.length > 0) {
        errFn(`[TEST-SCAFFOLD] Failed tests: ${summary.failedTests.join(', ')}`);
      }
      if (setProcessExitCode) process.exitCode = nodeRes.status || 1;
      return { status: 'FAILED', exitCode: nodeRes.status || 1, code: 'SCAFFOLD_TEST_FAILED', summary };
    }

    if (summary.total > 0) {
      logFn(`[TEST-SCAFFOLD] Test execution summary: ${summary.pass}/${summary.total} tests passed.`);
    }
    logFn(`[TEST-SCAFFOLD] Test suite "${testSuiteName}" PASSED.`);
    if (setProcessExitCode) process.exitCode = 0;
    return { status: 'PASSED', exitCode: 0, code: 'SUCCESS', summary };
  } catch (err) {
    errFn('[TEST-SCAFFOLD] FAIL_CLOSED: Scaffold execution failed.');
    if (setProcessExitCode) process.exitCode = 1;
    return { status: 'FAILED', exitCode: 1, code: 'SCAFFOLD_ERROR' };
  } finally {
    if (lock && lock.token) {
      releaseRunLock(runDir, lock.token);
    }
  }
}
