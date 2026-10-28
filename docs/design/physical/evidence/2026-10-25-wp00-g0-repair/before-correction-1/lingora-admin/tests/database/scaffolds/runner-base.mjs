/**
 * Base Scaffold Runner for Lingora Database Test Commands.
 *
 * Implements G0-R5:
 * - Fails closed if environment is unbound, malformed, or unallowlisted.
 * - Fails/returns NOT EXECUTED with exit code 1 when actual tests/prerequisites are absent.
 * - Never returns PASS on skip.
 * - If test files are present, ACTUALLY executes them (e.g. via node --test) and propagates exit codes.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_WORKSPACE_ROOT,
  getValidatedRuntimeState,
  sanitizeString,
} from '../env/env-guard.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ADMIN_ROOT = path.resolve(__dirname, '../../..');

export async function runScaffold({ testSuiteName, testDir, gateRequirement, description }) {
  console.log('================================================================================');
  console.log(`[TEST-SCAFFOLD] Invocating: ${testSuiteName}`);
  console.log(`[TEST-SCAFFOLD] Description: ${description}`);
  console.log(`[TEST-SCAFFOLD] Gate: ${gateRequirement}`);
  console.log('================================================================================');

  // 1. Check canonical environment allowlist
  let runtimeState;
  try {
    runtimeState = getValidatedRuntimeState(process.env.LINGORA_TEST_STATE_FILE || undefined);
  } catch (err) {
    console.error(`[TEST-SCAFFOLD] ENV_ALLOWLIST_FAIL: ${sanitizeString(err.message)}`);
    process.exit(1);
  }

  if (!runtimeState.bound) {
    console.error(`[TEST-SCAFFOLD] FAIL_CLOSED: Environment is not bound (${runtimeState.reason}).`);
    console.error('[TEST-SCAFFOLD] Refusing execution on unbound target.');
    process.exit(1);
  }

  console.log(`[TEST-SCAFFOLD] Environment: BOUND (Stack: ${runtimeState.stackId}, Runtime: ${runtimeState.runtime})`);

  // 2. Check for actual test files
  const targetDir = path.resolve(ADMIN_ROOT, testDir);
  const exists = fs.existsSync(targetDir);
  let testFiles = [];
  if (exists) {
    testFiles = fs.readdirSync(targetDir)
      .filter(f => f.endsWith('.test.mjs') || f.endsWith('.test.js') || f.endsWith('.test.ts'))
      .map(f => path.join(targetDir, f));
  }

  if (!exists || testFiles.length === 0) {
    console.error('--------------------------------------------------------------------------------');
    console.error('[TEST-SCAFFOLD] STATUS: NOT EXECUTED');
    console.error(`[TEST-SCAFFOLD] REASON: Test files in "${testDir}" are absent.`);
    console.error(`[TEST-SCAFFOLD] PREREQUISITE: Requires ${gateRequirement}.`);
    console.error('[TEST-SCAFFOLD] RESULT: Hard failure (exit 1). Never report PASS on missing tests.');
    console.error('--------------------------------------------------------------------------------');
    process.exit(1);
  }

  // 3. If test files exist, ACTUALLY execute them and propagate exit code
  console.log(`[TEST-SCAFFOLD] Found ${testFiles.length} test files. Executing via Node test runner...`);
  const cleanEnv = { ...process.env, NODE_ENV: 'test' };
  delete cleanEnv.NODE_TEST_CONTEXT;

  const res = spawnSync(process.execPath, ['--test', ...testFiles], {
    cwd: CANONICAL_WORKSPACE_ROOT,
    env: cleanEnv,
    stdio: 'inherit',
  });

  if (res.status !== 0) {
    console.error(`[TEST-SCAFFOLD] Test suite "${testSuiteName}" FAILED with exit code ${res.status}.`);
    process.exit(res.status || 1);
  }

  console.log(`[TEST-SCAFFOLD] Test suite "${testSuiteName}" PASSED.`);
  process.exit(0);
}
