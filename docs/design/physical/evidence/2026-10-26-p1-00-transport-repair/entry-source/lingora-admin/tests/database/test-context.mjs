/**
 * Shared Test Context Utility for Lingora Database Test Slices (P1-00).
 *
 * Implements bounded trusted run-context handoff:
 * - Fails closed if explicit context is missing, malformed, or foreign.
 * - Rejects ambient credentials and environment fallback (no DB_URL, PG*, SUPABASE_* fallback).
 * - Enforces exclusive parent run lock validity (lock file present, UID match, 0600 mode, parent PID alive, token match).
 * - Rejects stale locks, dead parents, unallowlisted runs-dir paths, and pending operations (RECOVERY_REQUIRED).
 * - Exposes validated typed endpoints and private credentials only while the run lock remains valid.
 * - Emits zero SQL/HTTP side-effects on missing, stale, or denied context.
 */

import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
const { Client } = pg;

import {
  TASK_ID,
  DEFAULT_RUNS_DIR,
  FORBIDDEN_UNOWNED_STATE_ROOT,
  FORBIDDEN_UNOWNED_HOME_ROOT,
  FORBIDDEN_OLD_WP00_STATE,
  FORBIDDEN_OLD_WP00_HOME,
  FORBIDDEN_OLDER_RUN_ROOTS,
  EXPECTED_PORTS,
  validateAuthorityRecord,
  validateDatabaseUrl,
  validateApiUrl,
  checkProcessAlive,
  parseStrictJson,
  sanitizeString,
} from './env/env-guard.mjs';

/**
 * Validate that runsDir is allowlisted and does not touch forbidden or legacy roots.
 */
function assertAllowlistedRunsDir(runsDir) {
  if (!runsDir || typeof runsDir !== 'string') {
    const err = new Error('ALLOWLIST_FAIL: runsDir is required.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }
  const normRunsDir = path.resolve(runsDir);
  const forbiddenDirs = [
    FORBIDDEN_UNOWNED_STATE_ROOT,
    FORBIDDEN_UNOWNED_HOME_ROOT,
    FORBIDDEN_OLD_WP00_STATE,
    FORBIDDEN_OLD_WP00_HOME,
    ...FORBIDDEN_OLDER_RUN_ROOTS,
  ];

  for (const fDir of forbiddenDirs) {
    if (normRunsDir === fDir || normRunsDir.startsWith(fDir + path.sep)) {
      const err = new Error(`ALLOWLIST_FAIL: Auto-adoption or access of forbidden root "${runsDir}" is prohibited.`);
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
  }

  return normRunsDir;
}

/**
 * Verify that the parent exclusive run lock (.run.lock) is active, valid, and owned by an alive parent.
 */
export function assertLockHeld(ctx, expectedToken = null) {
  if (!ctx || !ctx.runDir) {
    const err = new Error('TEST_CONTEXT_INVALID: Cannot assert lock on invalid context.');
    err.code = 'TEST_CONTEXT_INVALID';
    throw err;
  }
  const lockFile = path.resolve(ctx.runDir, '.run.lock');
  if (!fs.existsSync(lockFile)) {
    const err = new Error(`TEST_CONTEXT_STALE: Run lock held by parent is no longer present at "${lockFile}".`);
    err.code = 'TEST_CONTEXT_STALE';
    throw err;
  }

  if (fs.lstatSync(lockFile).isSymbolicLink()) {
    const err = new Error('ALLOWLIST_FAIL: Run lock is a forbidden symbolic link.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  const stat = fs.statSync(lockFile);
  if (process.getuid && stat.uid !== process.getuid()) {
    const err = new Error(`ALLOWLIST_FAIL: Run lock UID mismatch (${stat.uid} != ${process.getuid()}).`);
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }
  if ((stat.mode & 0o777) !== 0o600) {
    const err = new Error(`ALLOWLIST_FAIL: Insecure run lock permissions ${(stat.mode & 0o777).toString(8)} (must be 0600).`);
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  let lockData;
  try {
    lockData = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
  } catch {
    const err = new Error('TEST_CONTEXT_STALE: Corrupted run lock file.');
    err.code = 'TEST_CONTEXT_STALE';
    throw err;
  }

  if (lockData.run_id !== ctx.runId) {
    const err = new Error(`TEST_CONTEXT_MISMATCH: Lock run_id mismatch ("${lockData.run_id}" != "${ctx.runId}").`);
    err.code = 'TEST_CONTEXT_MISMATCH';
    throw err;
  }

  const tokenToCheck = expectedToken || ctx._lockToken;
  if (tokenToCheck && lockData.token !== tokenToCheck) {
    const err = new Error('TEST_CONTEXT_FORBIDDEN: Lock token mismatch. Caller does not own the active lock.');
    err.code = 'TEST_CONTEXT_FORBIDDEN';
    throw err;
  }

  const liveness = checkProcessAlive(lockData.pid, lockData.start_ticks, lockData.boot_id);
  if (liveness !== 'ALIVE') {
    const err = new Error(`TEST_CONTEXT_STALE: Run lock holder PID ${lockData.pid} is not alive (${liveness}).`);
    err.code = 'TEST_CONTEXT_STALE';
    throw err;
  }

  return true;
}

/**
 * Retrieve and validate the explicit trusted test context.
 *
 * Strict fail-closed rules:
 * - Requires explicit runner-supplied context (options.context or process.env.LINGORA_TEST_CONTEXT).
 * - Rejects any ambient environment credential fallback (DB_URL, PG*, etc.).
 * - Validates exclusive parent lock, authority record, and credentials file.
 * - Rejects pending operations (RECOVERY_REQUIRED).
 */
export function getTestContext(options = {}) {
  // 1. Resolve explicit context payload (no ambient fallback)
  let rawContext = null;
  if (options.context) {
    rawContext = options.context;
  } else if (process.env.LINGORA_TEST_CONTEXT) {
    try {
      rawContext = JSON.parse(process.env.LINGORA_TEST_CONTEXT);
    } catch {
      const err = new Error('TEST_CONTEXT_INVALID: Malformed LINGORA_TEST_CONTEXT JSON.');
      err.code = 'TEST_CONTEXT_INVALID';
      throw err;
    }
  }

  if (!rawContext) {
    const err = new Error(
      'TEST_CONTEXT_MISSING: Test requires explicit trusted test context from runner. ' +
      'Ambient credentials and environment fallback are prohibited.'
    );
    err.code = 'TEST_CONTEXT_MISSING';
    throw err;
  }

  // 2. Validate payload structure
  const { runId, runsDir: untrustedRunsDir, runDir: explicitRunDir, recordPath: explicitRecordPath, lockToken } = rawContext;

  if (!runId || typeof runId !== 'string' || !/^run-[a-f0-9]{8,32}$/i.test(runId)) {
    const err = new Error('TEST_CONTEXT_INVALID: runId missing or malformed in test context.');
    err.code = 'TEST_CONTEXT_INVALID';
    throw err;
  }

  if (!lockToken || typeof lockToken !== 'string') {
    const err = new Error('TEST_CONTEXT_INVALID: lockToken missing in test context.');
    err.code = 'TEST_CONTEXT_INVALID';
    throw err;
  }

  // 3. Resolve independently trusted runs namespace (default DEFAULT_RUNS_DIR; code override only for test fixtures)
  const trustedRunsDir = options.expectedRunsDir ? path.resolve(options.expectedRunsDir) : DEFAULT_RUNS_DIR;
  assertAllowlistedRunsDir(trustedRunsDir);

  if (untrustedRunsDir) {
    const normUntrusted = path.resolve(untrustedRunsDir);
    if (normUntrusted !== trustedRunsDir) {
      const err = new Error(`ALLOWLIST_FAIL: Context runsDir "${untrustedRunsDir}" does not match trusted runs namespace "${trustedRunsDir}".`);
      err.code = 'ALLOWLIST_FAIL';
      throw err;
    }
  }

  const expectedRunDir = path.resolve(trustedRunsDir, runId);
  const runDir = explicitRunDir ? path.resolve(explicitRunDir) : expectedRunDir;

  if (runDir !== expectedRunDir) {
    const err = new Error(`ALLOWLIST_FAIL: runDir does not match exact lexical runsDir/runId path.`);
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  const expectedRecordPath = path.resolve(runDir, 'owner.json');
  const recordPath = explicitRecordPath ? path.resolve(explicitRecordPath) : expectedRecordPath;
  if (recordPath !== expectedRecordPath) {
    const err = new Error('ALLOWLIST_FAIL: recordPath does not match exact lexical runDir/owner.json path.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  if (!fs.existsSync(runDir)) {
    const err = new Error(`TEST_CONTEXT_STALE: Run directory does not exist at "${runDir}".`);
    err.code = 'TEST_CONTEXT_STALE';
    throw err;
  }

  if (fs.lstatSync(runDir).isSymbolicLink()) {
    const err = new Error('ALLOWLIST_FAIL: runDir is a forbidden symbolic link.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  const dirStat = fs.statSync(runDir);
  if (process.getuid && dirStat.uid !== process.getuid()) {
    const err = new Error(`ALLOWLIST_FAIL: runDir UID mismatch (${dirStat.uid} != ${process.getuid()}).`);
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }
  if ((dirStat.mode & 0o777) !== 0o700) {
    const err = new Error(`ALLOWLIST_FAIL: Insecure runDir permissions ${(dirStat.mode & 0o777).toString(8)} (must be 0700).`);
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  // 4. Validate exclusive parent lock before reading authority or credentials
  const lockCtx = { runId, runDir, _lockToken: lockToken };
  assertLockHeld(lockCtx, lockToken);

  // 5. Validate authority record under parent lock against trusted namespace
  const authority = validateAuthorityRecord(recordPath, {
    runsDir: trustedRunsDir,
    expectedRunId: runId,
  });

  if (!authority.bound || authority.phase !== 'BOUND') {
    const err = new Error(`TEST_CONTEXT_DENIED: Environment is not bound (phase: ${authority.phase || 'unknown'}).`);
    err.code = 'TEST_CONTEXT_DENIED';
    throw err;
  }

  if (authority.pending_operation !== null && authority.pending_operation !== undefined) {
    const err = new Error('RECOVERY_REQUIRED: Authority record contains pending operation. Recovery required.');
    err.code = 'RECOVERY_REQUIRED';
    throw err;
  }

  // 6. Validate live credentials under lock
  const credPath = path.resolve(runDir, 'credentials.json');
  if (!fs.existsSync(credPath)) {
    const err = new Error(`DATA_FAIL: Credentials file not found at "${credPath}".`);
    err.code = 'DATA_FAIL';
    throw err;
  }

  if (fs.lstatSync(credPath).isSymbolicLink()) {
    const err = new Error('ALLOWLIST_FAIL: Credentials file is a forbidden symbolic link.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  const credStat = fs.statSync(credPath);
  if (process.getuid && credStat.uid !== process.getuid()) {
    const err = new Error(`ALLOWLIST_FAIL: Credentials file UID mismatch.`);
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }
  if ((credStat.mode & 0o777) !== 0o600) {
    const err = new Error(`ALLOWLIST_FAIL: Insecure credentials file permissions ${(credStat.mode & 0o777).toString(8)} (must be 0600).`);
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  let creds;
  try {
    creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
  } catch {
    const err = new Error('DATA_FAIL: Failed to parse credentials JSON.');
    err.code = 'DATA_FAIL';
    throw err;
  }

  if (!creds || typeof creds !== 'object' || !creds.DB_URL || !creds.ANON_KEY) {
    const err = new Error('DATA_FAIL: Missing DB_URL or ANON_KEY in credentials file.');
    err.code = 'DATA_FAIL';
    throw err;
  }

  // Validate database URL against expected port (54322) and local IP
  validateDatabaseUrl(creds.DB_URL, EXPECTED_PORTS.database);
  if (creds.API_URL) {
    validateApiUrl(creds.API_URL, EXPECTED_PORTS.api);
  }

  // 7. Construct and return typed test context
  const testContext = {
    runId,
    runsDir: trustedRunsDir,
    runDir,
    stackId: authority.instance_id,
    stackName: authority.stack_name,
    _lockToken: lockToken,
    endpoints: {
      database: { host: '127.0.0.1', port: EXPECTED_PORTS.database, protocol: 'tcp' },
      auth: { url: `http://127.0.0.1:${EXPECTED_PORTS.api}`, port: EXPECTED_PORTS.api },
      rest: { url: `http://127.0.0.1:${EXPECTED_PORTS.api}`, port: EXPECTED_PORTS.api },
      storage: { url: `http://127.0.0.1:${EXPECTED_PORTS.api}`, port: EXPECTED_PORTS.api },
      mail: { url: `http://127.0.0.1:${EXPECTED_PORTS.mail}`, port: EXPECTED_PORTS.mail },
    },
    credentials: {
      databaseUrl: creds.DB_URL,
      anonKey: creds.ANON_KEY,
      apiUrl: creds.API_URL || `http://127.0.0.1:${EXPECTED_PORTS.api}`,
    },
    assertLockHeld: () => assertLockHeld(testContext, lockToken),
    createPgClient: (clientOptions = {}) => createTargetPgClient(testContext, clientOptions),
  };

  return testContext;
}

/**
 * Create a PostgreSQL client wired to the validated test target.
 *
 * Enforces lock validity before connection, strips any ambient PG* env variables,
 * and passes explicit connection parameters.
 */
export function createTargetPgClient(ctx, options = {}) {
  if (!ctx || !ctx.credentials || !ctx.endpoints) {
    const err = new Error('TEST_CONTEXT_INVALID: Valid test context required to create database client.');
    err.code = 'TEST_CONTEXT_INVALID';
    throw err;
  }

  // Reject destination or connection parameter overrides before transport factory
  if (options.connectionString) {
    const err = new Error('ALLOWLIST_FAIL: Destination override via options.connectionString is prohibited.');
    err.code = 'ALLOWLIST_FAIL';
    throw err;
  }

  if (options.clientConfig) {
    const forbiddenOverrides = [
      'host',
      'port',
      'database',
      'user',
      'password',
      'connectionString',
      'ssl',
      'client_encoding',
    ];
    for (const key of forbiddenOverrides) {
      if (key in options.clientConfig) {
        const err = new Error(`ALLOWLIST_FAIL: Destination/connection parameter "${key}" cannot be overridden in clientConfig.`);
        err.code = 'ALLOWLIST_FAIL';
        throw err;
      }
    }
  }

  // Assert lock is actively held before instantiating or connecting
  ctx.assertLockHeld();

  const parsed = validateDatabaseUrl(ctx.credentials.databaseUrl, ctx.endpoints.database.port);

  // Strip inherited ambient PG env overrides at transport level
  const savedPgEnv = {};
  for (const k of Object.keys(process.env)) {
    if (k.startsWith('PG')) {
      savedPgEnv[k] = process.env[k];
      delete process.env[k];
    }
  }

  const clientConfig = {
    host: parsed.hostname,
    port: parsed.port,
    database: parsed.database,
    user: parsed.username,
    password: parsed.password,
    connectionTimeoutMillis: options.connectionTimeoutMillis || 5000,
    ssl: false,
    ...(options.clientConfig || {}),
  };

  let client;
  try {
    const Factory = options.ClientClass || Client;
    client = new Factory(clientConfig);
  } finally {
    for (const [k, v] of Object.entries(savedPgEnv)) {
      process.env[k] = v;
    }
  }

  return client;
}
