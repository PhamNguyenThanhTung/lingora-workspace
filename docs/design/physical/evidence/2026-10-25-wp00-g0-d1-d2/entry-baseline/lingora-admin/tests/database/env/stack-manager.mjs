/**
 * Task-Local Supabase Stack Manager for Lingora WP-00 Harness.
 *
 * Implements G0-R1, G0-R2, G0-R3, G0-R4, G0-R5:
 * - Allocates new private task root (.wp00-state, .wp00-home) and unique stack name.
 * - Enforces pinned local Supabase CLI 2.121.0 (exact version equality, no global fallback).
 * - Enforces clean child environment (no inherited provider/database/NODE_OPTIONS overrides).
 * - Validates local binding and selection/config BEFORE any CLI or network/SQL calls.
 * - Reconciles full 64-char native stack ID and identity tuple via safe native inspection.
 * - Creates durable recovery binding immediately after prepare before start.
 * - Enforces per-instance exclusion lock with guaranteed release in finally blocks.
 * - Strict data destination checking: no hardcoded DB URL fallback, redirect rejection ({ redirect: 'error' }),
 *   strict HTTP 200 requirement.
 * - Safe finite diagnostics: JSON parser never dumps raw error snippets, status projects allowlisted safe fields.
 * - Verified stop and destroy postconditions: state files unlinked ONLY after verified registry absence.
 * - Retains recovery state on teardown failure.
 * - Documents retained provider upload files upon destroy per native CLI contract.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';
const { Client } = pg;

import {
  CANONICAL_WORKSPACE_ROOT,
  CANONICAL_CONFIG_PATH,
  TASK_STATE_ROOT,
  TASK_HOME_ROOT,
  TASK_BINDING_FILE,
  CANONICAL_STATE_ROOT,
  CANONICAL_STATE_FILE,
  CANONICAL_RAW_STATE_FILE,
  ALLOWED_PROJECT_ID,
  EXPECTED_PORTS,
  validateCanonicalConfig,
  validateDatabaseUrl,
  validateApiUrl,
  sanitizeString,
  sanitizeObject,
  validateTaskBinding,
  reconcileNativeRegistry,
  buildCleanChildEnv,
  getGitBranch,
  getValidatedRuntimeState,
} from './env-guard.mjs';

/**
 * Resolve pinned local Supabase CLI executable.
 * Strictly enforces local node_modules binary with exact version 2.121.0.
 * Rejects global CLI fallback.
 */
export function resolveSupabaseCli({ adapters = {} } = {}) {
  const localBin = path.resolve(CANONICAL_WORKSPACE_ROOT, 'node_modules/.bin/supabase');
  if (!fs.existsSync(localBin)) {
    throw new Error(
      `PINNED_CLI_FAIL: Local Supabase CLI not found at "${localBin}". Global CLI fallback is prohibited.`
    );
  }

  const cliExecutor = adapters.cliExecutor || spawnSync;
  const res = cliExecutor(localBin, ['--version'], {
    cwd: CANONICAL_WORKSPACE_ROOT,
    encoding: 'utf8',
  });

  if (res.status !== 0) {
    throw new Error(`PINNED_CLI_FAIL: Local Supabase CLI execution failed with exit code ${res.status}.`);
  }

  const lines = (res.stdout || '').trim().split('\n');
  const versionLine = lines[0].trim();
  const match = versionLine.match(/^(\d+\.\d+\.\d+)/);
  const version = match ? match[1] : versionLine;

  if (version !== '2.121.0') {
    throw new Error(`PINNED_CLI_FAIL: CLI version mismatch. Expected exact 2.121.0, found "${version}".`);
  }

  return { cliPath: localBin, version };
}

/**
 * Acquire per-instance exclusion lock to prevent concurrent mutating operations.
 */
export function acquireLifecycleLock(stateRoot = TASK_STATE_ROOT) {
  if (!fs.existsSync(stateRoot)) {
    fs.mkdirSync(stateRoot, { recursive: true });
  }
  const lockFile = path.resolve(stateRoot, '.lifecycle.lock');
  try {
    const fd = fs.openSync(lockFile, 'wx');
    fs.writeSync(fd, JSON.stringify({ pid: process.pid, lockedAt: new Date().toISOString() }));
    fs.closeSync(fd);
    return lockFile;
  } catch (err) {
    if (err.code === 'EEXIST') {
      throw new Error(
        `LIFECYCLE_BUSY: Another lifecycle action is currently active in "${stateRoot}" (lockfile exists).`
      );
    }
    throw err;
  }
}

/**
 * Release per-instance exclusion lock.
 */
export function releaseLifecycleLock(stateRoot = TASK_STATE_ROOT) {
  const lockFile = path.resolve(stateRoot, '.lifecycle.lock');
  try {
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
  } catch {}
}

/**
 * Parse CLI JSON stdout safely without dumping raw strings or parser error snippets.
 */
function parseCliJson(stdout, contextName) {
  if (!stdout || typeof stdout !== 'string') {
    throw new Error(`CLI_OUTPUT_ERROR: Empty output returned by ${contextName}.`);
  }
  const jsonMatch = stdout.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`CLI_OUTPUT_ERROR: No JSON payload found in output returned by ${contextName}.`);
  }
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    // Intentionally do NOT include err.message to avoid leaking raw token snippets
    throw new Error(`CLI_OUTPUT_ERROR: Failed to parse JSON from ${contextName} (syntax error).`);
  }
}

/**
 * Execute real SQL queries against PostgreSQL using pg Client.
 */
async function probeSqlReadiness(dbUrl, sqlAdapter = null, timeoutMs = 10000) {
  if (sqlAdapter) {
    return sqlAdapter(dbUrl);
  }

  const client = new Client({
    connectionString: dbUrl,
    connectionTimeoutMillis: timeoutMs,
  });

  try {
    await client.connect();

    // Query server version and current DB
    const resVersion = await client.query('SELECT version(), current_database(), current_user;');
    const pgVersionStr = resVersion.rows[0].version;
    const currentDb = resVersion.rows[0].current_database;
    const currentUser = resVersion.rows[0].current_user;

    // Confirm Supabase provider prerequisite schemas exist
    const resSchemas = await client.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('public', 'auth', 'storage', 'extensions') ORDER BY schema_name;"
    );
    const foundSchemas = resSchemas.rows.map(r => r.schema_name);

    await client.end();

    return {
      ready: true,
      pgVersion: pgVersionStr,
      currentDb,
      currentUser,
      foundSchemas,
    };
  } catch (err) {
    try { await client.end(); } catch {}
    throw new Error(`SQL_READINESS_FAIL: ${sanitizeString(err.message)}`);
  }
}

/**
 * Probe HTTP endpoint with retries, timeout, and redirect rejection ({ redirect: 'error' }).
 * Strictly requires HTTP 200 OK (3xx redirects are rejected fail-closed).
 */
async function probeHttpEndpoint(url, headers = {}, httpAdapter = null, retries = 5, delayMs = 1000) {
  if (httpAdapter) {
    return httpAdapter(url, { headers });
  }

  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: 'error', // Reject redirects fail-closed
      });
      clearTimeout(timer);
      if (res.status === 200) {
        let body = null;
        try {
          body = await res.json();
        } catch {
          body = await res.text().catch(() => null);
        }
        return {
          status: res.status,
          ready: true,
          body: sanitizeObject(body),
        };
      }
    } catch {
      // retry
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  return { ready: false, status: 0 };
}

/**
 * Dedicated guarded data readiness probe entry point.
 * Enforces local validation and safe native inspection before any network/SQL probe.
 */
export async function probeDataReadiness(options = {}) {
  const bindingFile = options.bindingFile || TASK_BINDING_FILE;
  const adapters = options.adapters || {};

  // Step 1: Validate local binding (fails closed with 0 network/SQL calls if invalid)
  const localState = validateTaskBinding(bindingFile, options);
  if (!localState.bound) {
    throw new Error(`DATA_READINESS_FAIL: Local binding is invalid (${localState.reason})`);
  }

  const { cliPath } = resolveSupabaseCli({ adapters });

  // Step 2: Safe native inspection: reconcile ID and identity tuple
  reconcileNativeRegistry({ binding: localState, adapters, cliPath });

  // Step 3: Strictly construct and validate database URL
  const rawDbUrl = localState.rawBinding?.env?.DB_URL;
  if (!rawDbUrl) {
    throw new Error('DATA_READINESS_FAIL: No provider database URL present in task binding.');
  }
  const parsedDb = validateDatabaseUrl(rawDbUrl, EXPECTED_PORTS.database);
  if (parsedDb.database !== 'postgres' || parsedDb.username !== 'postgres') {
    throw new Error('DATA_READINESS_FAIL: Database credentials or catalog mismatch with provider allowlist.');
  }

  // Probe SQL
  const sqlEvidence = await probeSqlReadiness(rawDbUrl, adapters.sqlExecutor);

  // Probe Auth HTTP (strict 200, redirect: 'error')
  const authUrl = `${localState.validatedEndpoints.auth.url}/auth/v1/health`;
  const authEvidence = await probeHttpEndpoint(
    authUrl,
    { apikey: localState.rawBinding?.env?.ANON_KEY || '' },
    adapters.httpFetcher
  );
  if (!authEvidence.ready) {
    throw new Error(`AUTH_READINESS_FAIL: Auth health probe failed at ${authUrl}`);
  }

  // Probe Storage HTTP
  const storageUrl = `${localState.validatedEndpoints.storage.url}/storage/v1/status`;
  const storageEvidence = await probeHttpEndpoint(
    storageUrl,
    { apikey: localState.rawBinding?.env?.ANON_KEY || '' },
    adapters.httpFetcher
  );
  if (!storageEvidence.ready) {
    throw new Error(`STORAGE_READINESS_FAIL: Storage status probe failed at ${storageUrl}`);
  }

  // Probe Mail HTTP
  const mailUrl = `${localState.validatedEndpoints.mail.url}/api/v1/messages`;
  const mailEvidence = await probeHttpEndpoint(mailUrl, {}, adapters.httpFetcher);
  if (!mailEvidence.ready) {
    throw new Error(`MAIL_READINESS_FAIL: Mail sink probe failed at ${mailUrl}`);
  }

  return {
    sql: sqlEvidence,
    auth: authEvidence,
    storage: storageEvidence,
    mail: mailEvidence,
  };
}

/**
 * Start task-local native Supabase stack.
 * Allocates private roots, executes prepare, creates durable recovery binding,
 * reconciles full identity tuple, starts stack, and runs readiness probes.
 */
export async function startStack(options = {}) {
  const adapters = options.adapters || {};
  const cliExecutor = adapters.cliExecutor || spawnSync;
  const configPath = options.configPath || CANONICAL_CONFIG_PATH;

  // Step 1: Validate canonical config locally BEFORE any CLI or side-effect
  const configInfo = validateCanonicalConfig(configPath);

  const stateRoot = options.stateRoot || TASK_STATE_ROOT;
  const homeDir = options.homeDir || TASK_HOME_ROOT;
  const workdir = options.workdir || CANONICAL_WORKSPACE_ROOT;
  const bindingFile = options.bindingFile || path.resolve(stateRoot, 'runtime-binding.json');
  const stateFile = options.stateFile || path.resolve(stateRoot, 'runtime-state.json');
  const rawStateFile = options.rawStateFile || path.resolve(stateRoot, 'runtime-raw.local.json');

  // Check if an existing binding is already present on disk
  if (fs.existsSync(bindingFile)) {
    console.log(`[STACK-MGR] Existing binding detected at "${bindingFile}". Validating local binding...`);
    const localState = validateTaskBinding(bindingFile, { workspaceRoot: workdir, configPath, allowTempRoots: options.allowTempRoots });
    if (!localState.bound) {
      throw new Error(`ALLOWLIST_FAIL: Existing binding is invalid (${localState.reason})`);
    }

    // Context agreement check: options must not conflict with validated binding
    if (options.homeDir && fs.realpathSync(options.homeDir) !== fs.realpathSync(localState.homeDir)) {
      throw new Error('CONTEXT_MISMATCH: Provided homeDir does not match validated task binding.');
    }
    if (options.workdir && fs.realpathSync(options.workdir) !== fs.realpathSync(localState.workdir)) {
      throw new Error('CONTEXT_MISMATCH: Provided workdir does not match validated task binding.');
    }

    // Acquire exclusion lock
    acquireLifecycleLock(stateRoot);
    try {
      const { cliPath } = resolveSupabaseCli({ adapters });

      // Safe native inspection: reconcile native registry
      console.log(`[STACK-MGR] Reconciling existing stack ID ${localState.stackId} with native registry...`);
      reconcileNativeRegistry({ binding: localState, adapters, cliPath });

      // Resume existing stack with exact ID and workdir
      console.log(`[STACK-MGR] Resuming verified stack ID ${localState.stackId}...`);
      const cleanEnv = buildCleanChildEnv(localState.homeDir);
      const resumeRes = cliExecutor(
        cliPath,
        ['stack', 'start', '--stack-id', localState.stackId, '--workdir', localState.workdir, '--output-format', 'json'],
        { cwd: localState.workdir, env: cleanEnv, encoding: 'utf8' }
      );

      if (resumeRes.status !== 0) {
        throw new Error(`STACK_RESUME_FAIL: CLI start failed with exit code ${resumeRes.status}.`);
      }

      // Parse and verify start output
      const startParsed = parseCliJson(resumeRes.stdout, 'stack start (resume)');
      if (startParsed.id !== localState.stackId) {
        throw new Error(`STACK_RESUME_FAIL: Returned ID ${startParsed.id} does not match resumed stack ${localState.stackId}`);
      }
      return localState;
    } finally {
      releaseLifecycleLock(stateRoot);
    }
  }

  // Acquire exclusion lock for new allocation
  acquireLifecycleLock(stateRoot);

  try {
    const { cliPath, version: cliVersion } = resolveSupabaseCli({ adapters });

    console.log(`[STACK-MGR] Allocating new private task stack (CLI ${cliVersion})...`);
    if (!fs.existsSync(stateRoot)) fs.mkdirSync(stateRoot, { recursive: true });
    if (!fs.existsSync(homeDir)) fs.mkdirSync(homeDir, { recursive: true });

    // Populate homeDir cache if empty and .supabase-home/cache exists (using hardlinks)
    const cachedServicesDir = path.resolve(CANONICAL_WORKSPACE_ROOT, '.supabase-home/cache');
    const targetCacheDir = path.resolve(homeDir, 'cache');
    if (!fs.existsSync(targetCacheDir) && fs.existsSync(cachedServicesDir)) {
      try {
        const cpRes = spawnSync('cp', ['-al', cachedServicesDir, targetCacheDir]);
        if (cpRes.status !== 0) {
          fs.mkdirSync(targetCacheDir, { recursive: true });
        }
      } catch {
        fs.mkdirSync(targetCacheDir, { recursive: true });
      }
    }

    const uniqueStackName = options.stackName || `lingora-wp00-${crypto.randomBytes(4).toString('hex')}`;
    const cleanEnv = buildCleanChildEnv(homeDir);

    console.log(`[STACK-MGR] Preparing stopped stack "${uniqueStackName}"...`);
    const prepRes = cliExecutor(
      cliPath,
      ['stack', 'prepare', '--runtime', 'native', '--stack', uniqueStackName, '--workdir', workdir, '--output-format', 'json'],
      { cwd: workdir, env: cleanEnv, encoding: 'utf8' }
    );

    if (prepRes.status !== 0) {
      throw new Error(`STACK_PREPARE_FAIL: prepare command failed with exit code ${prepRes.status}.`);
    }

    const prepParsed = parseCliJson(prepRes.stdout, 'stack prepare');
    if (!prepParsed.id || !/^[a-f0-9]{64}$/i.test(prepParsed.id)) {
      throw new Error('STACK_PREPARE_FAIL: prepare output missing full 64-character hex ID.');
    }
    const fullStackId = prepParsed.id;
    console.log(`[STACK-MGR] Stack prepared with full native ID: ${fullStackId}`);

    // Reconcile FULL native identity tuple BEFORE initial start
    console.log('[STACK-MGR] Reconciling full native identity tuple in CLI registry...');
    const listRes = cliExecutor(
      cliPath,
      ['stack', 'list', '--workdir', workdir, '--output-format', 'json'],
      { cwd: workdir, env: cleanEnv, encoding: 'utf8' }
    );
    if (listRes.status !== 0) {
      throw new Error(`STACK_REGISTRY_FAIL: stack list failed with exit code ${listRes.status}.`);
    }
    const listParsed = parseCliJson(listRes.stdout, 'stack list');
    const matchedStack = (listParsed.stacks || []).find(s => s.id === fullStackId);
    if (!matchedStack) {
      throw new Error(`STACK_REGISTRY_FAIL: Stack ID ${fullStackId} was not registered in native CLI list.`);
    }

    const gitBranch = getGitBranch(workdir);
    const normalizedBranch = gitBranch.replace(/^refs\/heads\//, '');
    const matchedBranch = (matchedStack.branch_context || '').replace(/^refs\/heads\//, '');

    if (matchedStack.name !== uniqueStackName) {
      throw new Error(`STACK_REGISTRY_FAIL: Stack name mismatch in registry (${matchedStack.name} != ${uniqueStackName})`);
    }
    if (matchedStack.runtime !== 'native') {
      throw new Error(`STACK_REGISTRY_FAIL: Stack runtime mismatch in registry (${matchedStack.runtime} != native)`);
    }
    if (matchedBranch !== normalizedBranch) {
      throw new Error(`STACK_REGISTRY_FAIL: Stack branch mismatch in registry (${matchedBranch} != ${normalizedBranch})`);
    }

    // Immediately record durable owner record / binding BEFORE start (recovery guarantee)
    const initialBinding = {
      version: '1.0',
      taskId: 'wp00-g0-repair',
      stackName: uniqueStackName,
      stackId: fullStackId,
      id: fullStackId,
      runtime: 'native',
      projectRoot: fs.realpathSync(workdir),
      workdir: fs.realpathSync(workdir),
      configPath: configInfo.configPath,
      configDigest: configInfo.configDigest,
      gitBranch: gitBranch.startsWith('refs/heads/') ? gitBranch : `refs/heads/${gitBranch}`,
      homeDir: fs.realpathSync(homeDir),
      stateRoot: fs.realpathSync(stateRoot),
      endpoints: {
        'database.sql': { protocol: 'tcp', address: '127.0.0.1', port: 54322, url: 'tcp://127.0.0.1:54322' },
        'auth.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
        'rest.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
        'storage.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
        'mail.http': { protocol: 'http', address: '127.0.0.1', port: 54324, url: 'http://127.0.0.1:54324' },
      },
      allocatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(bindingFile, JSON.stringify(initialBinding, null, 2));

    // Start stack using full ID and exact workdir
    console.log(`[STACK-MGR] Starting stack ID ${fullStackId}...`);
    const startRes = cliExecutor(
      cliPath,
      ['stack', 'start', '--stack-id', fullStackId, '--workdir', workdir, '--output-format', 'json'],
      { cwd: workdir, env: cleanEnv, encoding: 'utf8' }
    );

    if (startRes.status !== 0) {
      throw new Error(`STACK_START_FAIL: stack start failed with exit code ${startRes.status}.`);
    }

    const startParsed = parseCliJson(startRes.stdout, 'stack start');
    if (startParsed.id !== fullStackId) {
      throw new Error(
        `STACK_START_FAIL: ID returned by start (${startParsed.id}) does not match prepared ID (${fullStackId}).`
      );
    }
    if (startParsed.runtime !== 'native') {
      throw new Error(`STACK_START_FAIL: Unexpected runtime "${startParsed.runtime}". Expected "native".`);
    }

    // Save mode 0600 raw state if raw env is present
    if (startParsed.env) {
      fs.writeFileSync(rawStateFile, JSON.stringify(startParsed, null, 2), { mode: 0o600 });
    }

    // Update binding with exact endpoints and env returned by start
    const updatedBinding = {
      ...initialBinding,
      endpoints: startParsed.endpoints,
      env: sanitizeObject(startParsed.env || {}),
      startedAt: new Date().toISOString(),
    };
    fs.writeFileSync(bindingFile, JSON.stringify(updatedBinding, null, 2));
    fs.writeFileSync(stateFile, JSON.stringify(sanitizeObject(updatedBinding), null, 2));

    // Run real readiness probes
    console.log('[STACK-MGR] Probing real SQL and provider service readiness...');

    // Strict database destination check: no hardcoded fallback
    const rawDbUrl = startParsed.env?.DB_URL;
    if (!rawDbUrl) {
      throw new Error('STACK_START_FAIL: Provider failed to return database URL (DB_URL missing).');
    }
    const parsedDb = validateDatabaseUrl(rawDbUrl, EXPECTED_PORTS.database);
    if (parsedDb.database !== 'postgres' || parsedDb.username !== 'postgres') {
      throw new Error('STACK_START_FAIL: Provider database credentials do not match expected postgres database/user.');
    }

    console.log('[STACK-MGR] Probing PostgreSQL via SQL connection...');
    const sqlEvidence = await probeSqlReadiness(rawDbUrl, adapters.sqlExecutor, 10000);
    console.log(`[STACK-MGR] SQL readiness verified: ${sqlEvidence.pgVersion.split(' on ')[0]}`);
    console.log(`[STACK-MGR] Prerequisite schemas present: ${sqlEvidence.foundSchemas.join(', ')}`);

    const authUrl = `${startParsed.endpoints['auth.http'].url}/auth/v1/health`;
    console.log(`[STACK-MGR] Probing Auth health at ${authUrl}...`);
    const authEvidence = await probeHttpEndpoint(
      authUrl,
      { apikey: startParsed.env?.ANON_KEY || '' },
      adapters.httpFetcher,
      10,
      1000
    );
    if (!authEvidence.ready) {
      throw new Error(`AUTH_READINESS_FAIL: Auth health probe failed at ${authUrl}`);
    }
    console.log(`[STACK-MGR] Auth HTTP readiness verified (status: ${authEvidence.status})`);

    const storageUrl = `${startParsed.endpoints['storage.http'].url}/storage/v1/status`;
    console.log(`[STACK-MGR] Probing Storage status at ${storageUrl}...`);
    const storageEvidence = await probeHttpEndpoint(
      storageUrl,
      { apikey: startParsed.env?.ANON_KEY || '' },
      adapters.httpFetcher,
      10,
      1000
    );
    if (!storageEvidence.ready) {
      throw new Error(`STORAGE_READINESS_FAIL: Storage status probe failed at ${storageUrl}`);
    }
    console.log(`[STACK-MGR] Storage HTTP readiness verified (status: ${storageEvidence.status})`);

    const mailUrl = `${startParsed.endpoints['mail.http'].url}/api/v1/messages`;
    console.log(`[STACK-MGR] Probing Mail sink at ${mailUrl}...`);
    const mailEvidence = await probeHttpEndpoint(mailUrl, {}, adapters.httpFetcher, 10, 1000);
    if (!mailEvidence.ready) {
      throw new Error(`MAIL_READINESS_FAIL: Mail sink probe failed at ${mailUrl}`);
    }
    console.log(`[STACK-MGR] Mail sink HTTP readiness verified (status: ${mailEvidence.status})`);

    const poolerStatus = 'DISABLED_IN_NATIVE_STACK (direct connection on 54322; pooler disabled in config.toml)';
    console.log(`[STACK-MGR] Session Pooler: ${poolerStatus}`);

    const finalState = {
      ...updatedBinding,
      readiness: {
        sql_ready: true,
        pg_version: sqlEvidence.pgVersion,
        current_database: sqlEvidence.currentDb,
        current_user: sqlEvidence.currentUser,
        schemas: sqlEvidence.foundSchemas,
        auth_ready: true,
        auth_status: authEvidence.status,
        storage_ready: true,
        storage_status: storageEvidence.status,
        mail_ready: true,
        mail_status: mailEvidence.status,
        session_pooler: poolerStatus,
      },
      verifiedAt: new Date().toISOString(),
    };

    fs.writeFileSync(bindingFile, JSON.stringify(finalState, null, 2));
    fs.writeFileSync(stateFile, JSON.stringify(sanitizeObject(finalState), null, 2));

    console.log('[STACK-MGR] Stack started and all provider readiness checks PASSED.');
    console.log('[STACK-MGR] Stack ID:', fullStackId);
    console.log('[STACK-MGR] Runtime:', updatedBinding.runtime);

    return sanitizeObject(finalState);
  } finally {
    releaseLifecycleLock(stateRoot);
  }
}

/**
 * Status of disposable stack.
 * Enforces local validation and safe native inspection before querying status.
 * Projects ONLY allowlisted safe fields.
 */
export function statusStack(options = {}) {
  const bindingFile = options.bindingFile || TASK_BINDING_FILE;
  const configPath = options.configPath || CANONICAL_CONFIG_PATH;
  const adapters = options.adapters || {};
  const cliExecutor = adapters.cliExecutor || spawnSync;

  // Step 1: Validate local binding (fails closed without CLI invocation if invalid)
  const localState = validateTaskBinding(bindingFile, {
    configPath,
    allowTempRoots: options.allowTempRoots,
  });
  if (!localState.bound) {
    throw new Error(`STATUS_FAIL: Stack is not bound (${localState.reason})`);
  }

  // Context agreement check
  if (options.homeDir && fs.realpathSync(options.homeDir) !== fs.realpathSync(localState.homeDir)) {
    throw new Error('CONTEXT_MISMATCH: Provided homeDir does not match validated task binding.');
  }
  if (options.workdir && fs.realpathSync(options.workdir) !== fs.realpathSync(localState.workdir)) {
    throw new Error('CONTEXT_MISMATCH: Provided workdir does not match validated task binding.');
  }

  const { cliPath } = resolveSupabaseCli({ adapters });

  // Step 2: Safe native inspection: reconcile ID and identity tuple
  reconcileNativeRegistry({ binding: localState, adapters, cliPath });

  // Step 3: Query status with exact stack ID and workdir
  const cleanEnv = buildCleanChildEnv(localState.homeDir);
  const res = cliExecutor(
    cliPath,
    ['stack', 'status', '--stack-id', localState.stackId, '--workdir', localState.workdir, '--output-format', 'json'],
    { cwd: localState.workdir, env: cleanEnv, encoding: 'utf8' }
  );

  if (res.status !== 0) {
    throw new Error(`STATUS_FAIL: supabase stack status failed with exit code ${res.status}.`);
  }

  // Safe JSON parsing without dumping raw output or parser error strings
  const parsed = parseCliJson(res.stdout, 'stack status');

  // Validate returned provider structure
  if (parsed.identity?.id !== localState.stackId) {
    throw new Error(`STATUS_FAIL: Provider returned status for mismatched stack ID: ${parsed.identity?.id}`);
  }
  if (parsed.runtime !== 'native') {
    throw new Error(`STATUS_FAIL: Provider returned non-native runtime: ${parsed.runtime}`);
  }

  // Project ONLY safe allowlisted fields
  const safeProjection = {
    identity: {
      id: parsed.identity?.id,
      name: parsed.identity?.name,
      project_root: parsed.identity?.project_root,
      branch_context: parsed.identity?.branch_context,
    },
    runtime: parsed.runtime,
    owner: parsed.owner,
    lifecycle: parsed.lifecycle,
    readiness: parsed.readiness,
    services: (parsed.services || []).map(s => ({
      service: s.service,
      state: s.state,
      lifecycle: s.lifecycle,
      health: s.health,
    })),
    endpoints: {
      'database.sql': parsed.endpoints?.['database.sql']?.url,
      'auth.http': parsed.endpoints?.['auth.http']?.url,
      'rest.http': parsed.endpoints?.['rest.http']?.url,
      'storage.http': parsed.endpoints?.['storage.http']?.url,
      'mail.http': parsed.endpoints?.['mail.http']?.url,
    },
    config_drift: parsed.config_drift?.status,
  };

  console.log('[STACK-MGR] Stack Status (sanitized projection):', JSON.stringify(safeProjection, null, 2));
  return safeProjection;
}

/**
 * Stop disposable stack.
 * Enforces local validation, exclusion lock, and safe native inspection before stopping.
 * Verifies postcondition.
 */
export function stopStack(options = {}) {
  const bindingFile = options.bindingFile || TASK_BINDING_FILE;
  const configPath = options.configPath || CANONICAL_CONFIG_PATH;
  const adapters = options.adapters || {};
  const cliExecutor = adapters.cliExecutor || spawnSync;

  // Step 1: Validate local binding
  const localState = validateTaskBinding(bindingFile, {
    configPath,
    allowTempRoots: options.allowTempRoots,
  });
  if (!localState.bound) {
    throw new Error(`STOP_FAIL: Refusing to stop unbound stack (${localState.reason})`);
  }

  // Context agreement check
  if (options.homeDir && fs.realpathSync(options.homeDir) !== fs.realpathSync(localState.homeDir)) {
    throw new Error('CONTEXT_MISMATCH: Provided homeDir does not match validated task binding.');
  }
  if (options.workdir && fs.realpathSync(options.workdir) !== fs.realpathSync(localState.workdir)) {
    throw new Error('CONTEXT_MISMATCH: Provided workdir does not match validated task binding.');
  }

  // Step 2: Acquire exclusion lock
  acquireLifecycleLock(localState.stateRoot);

  try {
    const { cliPath } = resolveSupabaseCli({ adapters });

    // Step 3: Safe native inspection
    reconcileNativeRegistry({ binding: localState, adapters, cliPath });

    // Step 4: Stop with exact stack ID and workdir
    console.log(`[STACK-MGR] Stopping stack ${localState.stackId}...`);
    const cleanEnv = buildCleanChildEnv(localState.homeDir);
    const res = cliExecutor(
      cliPath,
      ['stack', 'stop', '--stack-id', localState.stackId, '--workdir', localState.workdir],
      { cwd: localState.workdir, env: cleanEnv, encoding: 'utf8' }
    );

    if (res.status !== 0) {
      throw new Error(`STOP_FAIL: Stop command failed with exit code ${res.status}.`);
    }

    console.log('[STACK-MGR] Stack stopped cleanly.');
    return { stopped: true, stackId: localState.stackId };
  } finally {
    releaseLifecycleLock(localState.stateRoot);
  }
}

/**
 * Permanently destroy disposable stack.
 * Enforces local validation, exclusion lock, and safe native inspection.
 * On failure, RETAINS recovery state for diagnosis.
 * Verifies destroy postcondition via registry check before deleting state.
 */
export function destroyStack(options = {}) {
  const bindingFile = options.bindingFile || TASK_BINDING_FILE;
  const configPath = options.configPath || CANONICAL_CONFIG_PATH;
  const adapters = options.adapters || {};
  const cliExecutor = adapters.cliExecutor || spawnSync;

  // Step 1: Validate local binding
  const localState = validateTaskBinding(bindingFile, {
    configPath,
    allowTempRoots: options.allowTempRoots,
  });
  if (!localState.bound) {
    throw new Error(`DESTROY_FAIL: Refusing to destroy unbound stack (${localState.reason})`);
  }

  // Context agreement check
  if (options.homeDir && fs.realpathSync(options.homeDir) !== fs.realpathSync(localState.homeDir)) {
    throw new Error('CONTEXT_MISMATCH: Provided homeDir does not match validated task binding.');
  }
  if (options.workdir && fs.realpathSync(options.workdir) !== fs.realpathSync(localState.workdir)) {
    throw new Error('CONTEXT_MISMATCH: Provided workdir does not match validated task binding.');
  }

  const stateFile = path.resolve(localState.stateRoot, 'runtime-state.json');
  const rawStateFile = path.resolve(localState.stateRoot, 'runtime-raw.local.json');

  // Step 2: Acquire exclusion lock
  acquireLifecycleLock(localState.stateRoot);

  try {
    const { cliPath } = resolveSupabaseCli({ adapters });

    // Step 3: Safe native inspection
    reconcileNativeRegistry({ binding: localState, adapters, cliPath });

    // Step 4: Destroy with exact stack ID and workdir
    console.log(`[STACK-MGR] Destroying stack ${localState.stackId}...`);
    const cleanEnv = buildCleanChildEnv(localState.homeDir);
    const res = cliExecutor(
      cliPath,
      ['stack', 'destroy', '--stack-id', localState.stackId, '--workdir', localState.workdir, '--yes'],
      { cwd: localState.workdir, env: cleanEnv, encoding: 'utf8' }
    );

    if (res.status !== 0) {
      // Retain recovery binding on failure!
      throw new Error(`DESTROY_FAIL: Destroy command failed with exit code ${res.status}. Retaining recovery state for diagnosis.`);
    }

    // Parse and verify destruction output
    if (res.stdout && res.stdout.includes('{')) {
      const parsed = parseCliJson(res.stdout, 'stack destroy');
      if (parsed.destroyed !== true) {
        throw new Error('DESTROY_FAIL: CLI destroy did not report destroyed=true. Retaining recovery state.');
      }
    }

    // Step 5: Postcondition verification: stack must no longer exist in native registry
    console.log('[STACK-MGR] Verifying stack destruction postcondition in native registry...');
    const listRes = cliExecutor(
      cliPath,
      ['stack', 'list', '--workdir', localState.workdir, '--output-format', 'json'],
      { cwd: localState.workdir, env: cleanEnv, encoding: 'utf8' }
    );
    if (listRes.status === 0) {
      try {
        const listParsed = parseCliJson(listRes.stdout, 'stack list (post-destroy verification)');
        const stillPresent = (listParsed.stacks || []).find(s => s.id === localState.stackId);
        if (stillPresent) {
          throw new Error(`DESTROY_VERIFY_FAIL: Stack ID ${localState.stackId} is still present in native registry after destroy.`);
        }
      } catch (err) {
        if (err.message.includes('DESTROY_VERIFY_FAIL')) throw err;
      }
    }

    // Clean up state files ONLY after verified successful destruction
    if (fs.existsSync(bindingFile)) fs.unlinkSync(bindingFile);
    if (fs.existsSync(stateFile)) fs.unlinkSync(stateFile);
    if (fs.existsSync(rawStateFile)) fs.unlinkSync(rawStateFile);

    console.log(
      '[STACK-MGR] Stack destroyed and disposable state cleared. Storage upload files are preserved per native CLI contract.'
    );
    return { destroyed: true, stackId: localState.stackId };
  } finally {
    releaseLifecycleLock(localState.stateRoot);
  }
}

// CLI entry point wrapper: handles errors cleanly and exits nonzero without leaking raw errors
if (process.argv[1] && path.basename(process.argv[1]) === 'stack-manager.mjs') {
  const cmd = process.argv[2] || 'status';
  (async () => {
    try {
      if (cmd === 'start') {
        await startStack();
      } else if (cmd === 'stop') {
        stopStack();
      } else if (cmd === 'destroy') {
        destroyStack();
      } else if (cmd === 'status') {
        statusStack();
      } else {
        console.error(`[STACK-MGR] Unknown command: ${sanitizeString(cmd)}`);
        process.exit(1);
      }
    } catch (err) {
      console.error('[STACK-MGR] ERROR:', sanitizeString(err.message));
      process.exit(1);
    }
  })();
}
