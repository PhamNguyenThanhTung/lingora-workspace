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
  validateAuthorityRecord,
  reconcileNativeRegistry,
  buildCleanChildEnv,
  parseStrictJson,
} from '../env/env-guard.mjs';
import {
  resolveSupabaseCli,
  resolveRunContext,
  acquireRunLock,
  releaseRunLock,
} from '../env/stack-manager.mjs';

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
    errFn(`[TEST-SCAFFOLD] FAIL_CLOSED: ${err.message}`);
    if (setProcessExitCode) process.exitCode = 1;
    return { status: 'FAILED', exitCode: 1, error: err.message };
  }

  const { runId, runDir, recordPath } = runCtx;

  // Validate authority record first
  let authority;
  try {
    authority = validateAuthorityRecord(recordPath, { runsDir: explicitRunsDir, expectedRunId: runId });
  } catch (err) {
    errFn(`[TEST-SCAFFOLD] ENV_ALLOWLIST_FAIL: Authority validation failed (${err.code || 'VALIDATION_ERROR'}).`);
    if (setProcessExitCode) process.exitCode = 1;
    return { status: 'FAILED', exitCode: 1, error: err.message };
  }

  if (!authority.bound || authority.phase !== 'BOUND') {
    errFn(`[TEST-SCAFFOLD] FAIL_CLOSED: Environment is not bound (phase: ${authority.phase || 'unbound'}).`);
    if (setProcessExitCode) process.exitCode = 1;
    return { status: 'FAILED', exitCode: 1, error: 'Environment is not bound' };
  }

  // Acquire run lock
  let lock;
  try {
    lock = acquireRunLock(runDir, runId);
  } catch (err) {
    errFn(`[TEST-SCAFFOLD] LOCK_FAIL: Could not acquire run lock.`);
    if (setProcessExitCode) process.exitCode = 1;
    return { status: 'FAILED', exitCode: 1, error: err.message };
  }

  try {
    // Under lock: re-validate authority
    authority = validateAuthorityRecord(recordPath, { runsDir: explicitRunsDir, expectedRunId: runId });
    if (!authority.bound || authority.phase !== 'BOUND') {
      throw new Error(`Environment phase is ${authority.phase}, not BOUND.`);
    }

    // Under lock: reconcile native registry
    const { cliPath } = resolveSupabaseCli({ adapters });
    reconcileNativeRegistry({ authority, adapters, cliPath });

    // Under lock: check live stack status and verify member continuity
    const cliExecutor = adapters.cliExecutor || spawnSync;
    const cleanEnv = buildCleanChildEnv(authority.home_dir);
    const res = cliExecutor(
      cliPath,
      ['stack', 'status', '--stack-id', authority.instance_id, '--workdir', authority.workdir, '--output-format', 'json'],
      { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8', timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
    );
    if (res.status !== 0) {
      throw new Error(`CLI status failed with exit code ${res.status}`);
    }
    const parsed = parseStrictJson(res.stdout, 'scaffold runner status');
    if (parsed.identity?.id !== authority.instance_id) {
      throw new Error('Status ID does not match bound ID.');
    }
    if (authority.member_map && parsed.composition && Array.isArray(parsed.composition.members)) {
      const currentMembers = {};
      for (const m of parsed.composition.members) {
        currentMembers[m.service] = m.id;
      }
      for (const [srv, expId] of Object.entries(authority.member_map)) {
        if (currentMembers[srv] !== expId) {
          throw new Error(`Member UUID mismatch for service "${srv}". Incarnation continuity broken.`);
        }
      }
    }

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
      return { status: 'NOT EXECUTED', exitCode: 1, reason: `Test files in "${testDir}" are absent.` };
    }

    // Execute test files and propagate exit code
    logFn(`[TEST-SCAFFOLD] Found ${testFiles.length} test files. Executing via Node test runner...`);
    const testRunnerEnv = { ...cleanEnv, NODE_ENV: 'test' };
    delete testRunnerEnv.NODE_TEST_CONTEXT;

    const testExecutor = adapters.testExecutor || spawnSync;
    const nodeRes = testExecutor(process.execPath, ['--test', ...testFiles], {
      cwd: CANONICAL_WORKSPACE_ROOT,
      env: testRunnerEnv,
      encoding: 'utf8',
    });

    if (nodeRes.stdout) logFn(nodeRes.stdout);
    if (nodeRes.stderr) errFn(nodeRes.stderr);

    if (nodeRes.status !== 0) {
      errFn(`[TEST-SCAFFOLD] Test suite "${testSuiteName}" FAILED with exit code ${nodeRes.status}.`);
      if (setProcessExitCode) process.exitCode = nodeRes.status || 1;
      return { status: 'FAILED', exitCode: nodeRes.status || 1, childOutput: nodeRes.stderr || nodeRes.stdout };
    }

    logFn(`[TEST-SCAFFOLD] Test suite "${testSuiteName}" PASSED.`);
    if (setProcessExitCode) process.exitCode = 0;
    return { status: 'PASSED', exitCode: 0 };
  } catch (err) {
    errFn(`[TEST-SCAFFOLD] FAIL_CLOSED: ${err.message}`);
    if (setProcessExitCode) process.exitCode = 1;
    return { status: 'FAILED', exitCode: 1, error: err.message };
  } finally {
    releaseRunLock(runDir, lock.token);
  }
}
