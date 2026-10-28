/**
 * Guarded Prisma & Client Test Context Helper (P1-03a AC-04).
 *
 * Implements strict security & execution boundaries (Corrected for Finding A3-R2 & A3-R6):
 * - Revalidates target/lock before every external launch or client construction.
 * - Enforces exact local Prisma binary pin (6.19.3) via binary path & package version checks.
 * - Exposes only explicit reviewed Prisma operations allowlist (validate, generate, migrate deploy, migrate status).
 * - Forces canonical schema.prisma and working directory (lingora-admin); denies caller overrides.
 * - Prohibits arbitrary destination/URL/config/shadow CLI flags and options before subprocess launch.
 * - Builds clean child environment with only validated operation-specific target URL.
 * - Never inherits ambient DATABASE_URL or PG* environment variables.
 * - Validates credential file safety via anchored descriptor reads (symlink rejection, mode 0600, UID match).
 * - Enforces separation of setup/migration credentials and runtime/assembly/adapter logins.
 * - Denial occurs strictly before process launch or client construction.
 * - Safely captures stdout/stderr with full secret redaction.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { buildCleanChildEnv, sanitizeString, validateDatabaseUrl, EXPECTED_PORTS } from '../env/env-guard.mjs';
import {
  validateCredentialStorage,
  parseStrictRuntimeCredentials,
} from '../../../prisma/bootstrap/bootstrap-cluster.mjs';
import {
  openAnchoredRunDir,
  validateRunContextAuthority,
} from '../../../prisma/bootstrap/private-run-storage.mjs';

export {
  reconcileClusterRoles,
  disposeRuntimeCredentials,
} from '../../../prisma/bootstrap/bootstrap-cluster.mjs';

export {
  setupA3Baseline,
  cleanupA3Baseline,
} from './fixture-lifecycle.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CANONICAL_WORKSPACE_ROOT = path.resolve(__dirname, '../../../..');
export const ADMIN_ROOT = path.resolve(CANONICAL_WORKSPACE_ROOT, 'lingora-admin');
export const SCHEMA_PATH = path.resolve(ADMIN_ROOT, 'prisma/schema.prisma');
export const PINNED_PRISMA_PATH = path.resolve(CANONICAL_WORKSPACE_ROOT, 'node_modules/prisma/build/index.js');
export const PINNED_PRISMA_PACKAGE_JSON = path.resolve(CANONICAL_WORKSPACE_ROOT, 'node_modules/prisma/package.json');
export const PINNED_PRISMA_VERSION = '6.19.3';

/**
 * Supported option keys for runGuardedPrismaCommand and createGuardedPrismaClient.
 */
export const SUPPORTED_COMMAND_OPTION_KEYS = new Set(['executor', 'timeoutMs', 'role']);
export const SUPPORTED_CLIENT_OPTION_KEYS = new Set(['role', 'log', 'clientConstructor']);

export const SUPPORTED_COMMAND_ROLES = new Set(['migration', 'admin', 'runtime']);
export const SUPPORTED_CLIENT_ROLES = new Set(['runtime', 'assembly', 'auth_adapter', 'migration', 'admin']);

/**
 * Explicit reviewed allowlist of permitted Prisma subcommands (Finding A3-R2).
 * Only these four exact tuples are permitted; no caller CLI suffix or extra args.
 */
const PERMITTED_OPERATION_TUPLES = [
  ['validate'],
  ['generate'],
  ['migrate', 'deploy'],
  ['migrate', 'status'],
];

/**
 * Verify exact local Prisma binary pin and package version.
 */
export function verifyPinnedPrisma() {
  if (!fs.existsSync(PINNED_PRISMA_PATH)) {
    const err = new Error(`PRISMA_BINARY_MISSING: Pinned Prisma binary not found at "${PINNED_PRISMA_PATH}".`);
    err.code = 'PRISMA_BINARY_MISSING';
    throw err;
  }

  if (!fs.existsSync(PINNED_PRISMA_PACKAGE_JSON)) {
    const err = new Error('PRISMA_PIN_MISMATCH: Prisma package.json not found in node_modules.');
    err.code = 'PRISMA_PIN_MISMATCH';
    throw err;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(PINNED_PRISMA_PACKAGE_JSON, 'utf8'));
    if (pkg.version !== PINNED_PRISMA_VERSION) {
      const err = new Error(`PRISMA_PIN_MISMATCH: Expected Prisma version ${PINNED_PRISMA_VERSION}, found ${pkg.version}.`);
      err.code = 'PRISMA_PIN_MISMATCH';
      throw err;
    }
  } catch (err) {
    if (err.code === 'PRISMA_PIN_MISMATCH') throw err;
    const parseErr = new Error('PRISMA_PIN_MISMATCH: Failed to parse Prisma package.json.');
    parseErr.code = 'PRISMA_PIN_MISMATCH';
    throw parseErr;
  }

  return true;
}

/**
 * Validate that the test context and run lock are active and valid.
 * Fails closed before any subprocess launch or PrismaClient construction.
 */
export function validatePrismaContext(ctx, options = {}, allowedOptionKeys = null) {
  if (!ctx || typeof ctx !== 'object') {
    const err = new Error('TEST_CONTEXT_MISSING: Guarded Prisma helper requires explicit test context.');
    err.code = 'TEST_CONTEXT_MISSING';
    throw err;
  }

  if (typeof ctx.assertLockHeld !== 'function') {
    const err = new Error('TEST_CONTEXT_INVALID: testContext missing assertLockHeld method.');
    err.code = 'TEST_CONTEXT_INVALID';
    throw err;
  }

  // Enforce parent run lock validity before any external action
  ctx.assertLockHeld();

  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    const err = new Error('ALLOWLIST_FAIL: Options must be an object.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  // Prohibit arbitrary destination URL/schema overrides in options
  if (
    options.url || options.databaseUrl || options.connectionString ||
    options.schema || options.schemaPath || options.cwd || options.config
  ) {
    const err = new Error('ALLOWLIST_FAIL: Arbitrary database URL, schema, or directory overrides are prohibited.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  // Prohibit shadow database operations when ownership is not proved
  if (options.shadow || options.shadowUrl || options.requireShadow) {
    const err = new Error(
      'SHADOW_TARGET_UNPROVED: Shadow/generation target requires separately proved disposable ownership and lock coverage; ' +
      'configured port/name alone is insufficient; reset against main target is prohibited.'
    );
    err.code = 'SHADOW_TARGET_UNPROVED';
    throw err;
  }

  // Reject unsupported option keys positively
  if (allowedOptionKeys) {
    for (const key of Object.keys(options)) {
      if (!allowedOptionKeys.has(key)) {
        const err = new Error(`ALLOWLIST_FAIL: Unsupported helper option key "${key}".`);
        err.code = 'ALLOWLIST_FAIL';
        throw err;
      }
    }
  }

  return true;
}

/**
 * Redact database credentials and sensitive parameters from strings.
 */
export function redactSecrets(input = '') {
  if (typeof input !== 'string') return '';
  return input
    .replace(/(postgres(?:ql)?:\/\/[^:]+:)[^@]+(@)/gi, '$1[REDACTED]$2')
    .replace(/password=['"][^'"]+['"]/gi, "password='[REDACTED]'")
    .replace(/PASSWORD\s+'[^']+'/gi, "PASSWORD '[REDACTED]'");
}

/**
 * Validate that CLI arguments match the exact operation allowlist tuple with no caller suffix.
 */
function validateCliArgs(args) {
  if (!Array.isArray(args) || args.length === 0) {
    const err = new Error('COMMAND_INVALID: Prisma command arguments must be a non-empty array.');
    err.code = 'COMMAND_INVALID';
    throw err;
  }

  // Check for prohibited override flags first
  for (const arg of args) {
    if (typeof arg !== 'string') {
      const err = new Error('COMMAND_INVALID: All command arguments must be strings.');
      err.code = 'COMMAND_INVALID';
      throw err;
    }

    if (
      arg === '--url' || arg.startsWith('--url=') ||
      arg === '--database-url' || arg.startsWith('--database-url=') ||
      arg === '--shadow-database-url' || arg.startsWith('--shadow-database-url=') ||
      arg === '-u' ||
      arg === '--config' || arg.startsWith('--config=')
    ) {
      const err = new Error(`ALLOWLIST_FAIL: CLI destination or config override flag "${arg}" is prohibited.`);
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }

    if (arg === '--schema' || arg.startsWith('--schema=')) {
      const err = new Error('ALLOWLIST_FAIL: Caller cannot specify --schema; canonical schema.prisma is forced.');
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
  }

  // Exact match to one of the four reviewed tuples - NO caller CLI suffix, NO extra arguments!
  const isExactMatch = PERMITTED_OPERATION_TUPLES.some(
    (tuple) => tuple.length === args.length && tuple.every((part, idx) => args[idx] === part)
  );

  if (!isExactMatch) {
    const err = new Error(
      `COMMAND_FORBIDDEN: Prisma command "${args.join(' ')}" is not one of the four exact reviewed operation tuples ` +
      `([${PERMITTED_OPERATION_TUPLES.map(t => t.join(' ')).join(', ')}]). CLI suffixes and extra arguments are denied.`
    );
    err.code = 'COMMAND_FORBIDDEN';
    throw err;
  }

  return true;
}

/**
 * Execute a guarded Prisma CLI command using the pinned local binary and clean environment.
 */
export function runGuardedPrismaCommand(ctx, args = [], options = {}) {
  // 1. Denial check BEFORE subprocess construction or executor invocation
  validatePrismaContext(ctx, options, SUPPORTED_COMMAND_OPTION_KEYS);

  // Validate option types
  if (options.executor !== undefined && typeof options.executor !== 'function') {
    const err = new Error('ALLOWLIST_FAIL: options.executor must be a function.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  if (options.timeoutMs !== undefined && (typeof options.timeoutMs !== 'number' || !Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0)) {
    const err = new Error('ALLOWLIST_FAIL: options.timeoutMs must be a finite positive number.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  if (options.role !== undefined && (typeof options.role !== 'string' || !SUPPORTED_COMMAND_ROLES.has(options.role))) {
    const err = new Error(`ALLOWLIST_FAIL: Unsupported command role "${options.role}". Permitted roles: [${[...SUPPORTED_COMMAND_ROLES].join(', ')}].`);
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  // 2. Validate CLI args against reviewed allowlist and reject override flags
  validateCliArgs(args);

  // Enforce operation-to-credential boundary: migration operations require admin/setup credentials
  if (args[0] === 'migrate' && options.role === 'runtime') {
    const err = new Error('ALLOWLIST_FAIL: Migration operations require administrative setup credentials, not runtime role.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  // 3. Verify local Prisma pin
  verifyPinnedPrisma();

  // 4. Resolve operation-specific database URL
  let targetUrl;
  if (options.role === 'runtime') {
    const runtimeCreds = getRuntimeCredentials(ctx);
    targetUrl = `postgresql://${runtimeCreds.lingora_runtime.role}:${runtimeCreds.lingora_runtime.password}@127.0.0.1:${EXPECTED_PORTS.database}/postgres`;
  } else {
    // Default setup/migration commands use direct administrative credentials
    targetUrl = ctx.credentials.databaseUrl;
  }

  validateDatabaseUrl(targetUrl, EXPECTED_PORTS.database);

  // Revalidate context and parent run lock immediately before executor construction
  ctx.assertLockHeld();

  // 5. Build clean child environment: NO ambient DATABASE_URL or PG*
  const cleanEnv = buildCleanChildEnv(ctx.runDir);
  cleanEnv.NODE_ENV = 'test';
  cleanEnv.DATABASE_URL = targetUrl;
  cleanEnv.PRISMA_HIDE_UPDATE_MESSAGE = 'true';

  // 6. Force canonical schema path and working directory
  const cliArgs = [...args, '--schema', SCHEMA_PATH];

  const startTime = new Date().toISOString();
  const executor = options.executor || spawnSync;
  const res = executor(process.execPath, [PINNED_PRISMA_PATH, ...cliArgs], {
    cwd: ADMIN_ROOT,
    env: cleanEnv,
    encoding: 'utf8',
    timeout: options.timeoutMs || 60000,
  });
  const endTime = new Date().toISOString();

  const rawStdout = (res && typeof res.stdout === 'string') ? res.stdout : '';
  const rawStderr = (res && typeof res.stderr === 'string') ? res.stderr : '';

  const cleanStdout = redactSecrets(sanitizeString(rawStdout));
  const cleanStderr = redactSecrets(sanitizeString(rawStderr));

  return {
    status: res.status === 0 ? 'SUCCESS' : 'FAILED',
    exitCode: res.status ?? 1,
    stdout: cleanStdout,
    stderr: cleanStderr,
    command: `prisma ${cliArgs.join(' ')}`,
    cwd: ADMIN_ROOT,
    startedAt: startTime,
    finishedAt: endTime,
  };
}

/**
 * Retrieve verified runtime credentials from private run storage (mode 0600) via anchored descriptor.
 */
export function getRuntimeCredentials(ctx) {
  validatePrismaContext(ctx);

  const credPath = path.resolve(ctx.runDir, 'runtime-credentials.json');
  validateCredentialStorage(credPath, ctx.runDir);

  const anchored = openAnchoredRunDir(ctx.runDir);
  try {
    validateRunContextAuthority(ctx, { anchoredDir: anchored });
    const content = anchored.readPrivateRecord('runtime-credentials.json', { allowAbsent: false });
    return parseStrictRuntimeCredentials(content);
  } finally {
    anchored.close();
  }
}

/**
 * Create a guarded PrismaClient bound to the validated test target and role.
 * Denial happens strictly before client construction.
 */
export function createGuardedPrismaClient(ctx, options = {}) {
  // 1. Denial check BEFORE client construction
  validatePrismaContext(ctx, options, SUPPORTED_CLIENT_OPTION_KEYS);

  if (options.role !== undefined && (typeof options.role !== 'string' || !SUPPORTED_CLIENT_ROLES.has(options.role))) {
    const err = new Error(`ALLOWLIST_FAIL: Unsupported client role "${options.role}". Permitted roles: [${[...SUPPORTED_CLIENT_ROLES].join(', ')}].`);
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }
  const role = options.role !== undefined ? options.role : 'runtime';

  if (options.clientConstructor !== undefined && typeof options.clientConstructor !== 'function') {
    const err = new Error('ALLOWLIST_FAIL: options.clientConstructor must be a constructor function.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  if (options.log !== undefined) {
    if (!Array.isArray(options.log)) {
      const err = new Error('ALLOWLIST_FAIL: options.log must be an array.');
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
    const validLevels = new Set(['query', 'info', 'warn', 'error']);
    const validEmits = new Set(['stdout', 'event']);
    for (const item of options.log) {
      if (typeof item === 'string') {
        if (!validLevels.has(item)) {
          const err = new Error(`ALLOWLIST_FAIL: Invalid log level "${item}". Permitted levels: [${[...validLevels].join(', ')}].`);
          err.code = 'ALLOWLIST_FAIL';
          throw err;
        }
      } else if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        if (!validLevels.has(item.level) || (item.emit !== undefined && !validEmits.has(item.emit))) {
          const err = new Error('ALLOWLIST_FAIL: Invalid log definition object.');
          err.code = 'ALLOWLIST_FAIL';
          throw err;
        }
      } else {
        const err = new Error('ALLOWLIST_FAIL: Invalid log option entry.');
        err.code = 'ALLOWLIST_FAIL';
        throw err;
      }
    }
  }

  let targetUrl;

  if (role === 'migration' || role === 'admin') {
    // Only allowed if explicitly requested for setup verification
    targetUrl = ctx.credentials.databaseUrl;
  } else {
    // Default to non-owner runtime credentials
    const runtimeCreds = getRuntimeCredentials(ctx);
    const roleKey = role === 'assembly' ? 'lingora_assembly' : (role === 'auth_adapter' ? 'lingora_auth_adapter' : 'lingora_runtime');
    if (!runtimeCreds[roleKey]) {
      const err = new Error(`PREREQUISITE_ABSENT: Role credentials for "${roleKey}" not found in runtime credentials.`);
      err.code = 'PREREQUISITE_ABSENT';
      throw err;
    }
    targetUrl = `postgresql://${runtimeCreds[roleKey].role}:${runtimeCreds[roleKey].password}@127.0.0.1:${EXPECTED_PORTS.database}/postgres`;
  }

  validateDatabaseUrl(targetUrl, EXPECTED_PORTS.database);

  // Assert lock again immediately before client instantiation
  ctx.assertLockHeld();

  const ClientConstructor = options.clientConstructor || PrismaClient;
  const client = new ClientConstructor({
    datasources: {
      db: {
        url: targetUrl,
      },
    },
    log: options.log || [],
  });

  return client;
}
