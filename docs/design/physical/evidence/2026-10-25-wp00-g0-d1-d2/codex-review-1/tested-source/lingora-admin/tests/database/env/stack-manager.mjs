/**
 * Task-Local Supabase Stack Manager for Lingora WP-00 Harness.
 *
 * Implements WP-00/G0 D1 + D2:
 * - Run selection: start --new-run allocates a unique task-owned run; start/status/stop/destroy/data
 *   require explicit --run <run-id>. No default current-run adoption.
 * - Atomic authority record (owner.json, mode 0600) with phases: RESERVED -> BOUND -> DESTROYED.
 * - Durable operation intents persisted before side effects (temp file + fsync + atomic rename).
 * - Exclusive per-run locking (.run.lock) with process/start-tick/boot identity. Guaranteed release in finally.
 * - Pinned local Supabase CLI 2.121.0 resolution and binary hash verification.
 * - Explicit clean child environment (no inherited PG*, NODE_OPTIONS, or provider env).
 * - Safe native inspection and registry reconciliation (exact full 64-char ID and identity tuple).
 * - Linux /proc process and socket observation: verified postcondition quiescence on stop and destroy.
 * - Exact typed PostgreSQL configuration (no connectionString, strict URL parser, PG* env stripped, closed in finally).
 * - Guarded HTTP health probes (strict 200 OK, redirect: 'error', no logged headers/bodies).
 * - Finite diagnostic projections only (never forward raw provider streams or parser error snippets).
 * - Complete incident regression prevention: synthetic canary redaction across all output and error paths.
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
  TASK_ID,
  DEFAULT_RUNS_DIR,
  TASK_STATE_ROOT,
  TASK_HOME_ROOT,
  TASK_BINDING_FILE,
  ALLOWED_HOSTS,
  EXPECTED_PORTS,
  PINNED_CLI_VERSION,
  PINNED_CLI_SHA256,
  PINNED_CLI_PATH,
  validateCanonicalConfig,
  validateDatabaseUrl,
  validateApiUrl,
  validateAuthorityRecord,
  reconcileNativeRegistry,
  buildCleanChildEnv,
  getGitBranch,
  getLinuxBootId,
  parseProcStat,
  getProcessIdentity,
  isProcessAlive,
  snapshotRunProcesses,
  snapshotProcessSockets,
  verifyProcessesQuiescent,
  verifySocketsQuiescent,
  sanitizeString,
  sanitizeObject,
  projectFiniteOutput,
  registerRedactionCanary,
  clearRedactionCanaries,
  isCanaryRegistered,
} from './env-guard.mjs';

export {
  registerRedactionCanary,
  clearRedactionCanaries,
  isCanaryRegistered,
};

/**
 * Resolve pinned local Supabase CLI executable.
 * Strictly enforces local binary, exact version 2.121.0 and SHA-256 digest.
 */
export function resolveSupabaseCli({ adapters = {} } = {}) {
  const cliPath = PINNED_CLI_PATH;
  if (!fs.existsSync(cliPath)) {
    throw new Error(
      `PINNED_CLI_FAIL: Local Supabase CLI not found at "${cliPath}". Global CLI fallback is prohibited.`
    );
  }

  // Verify binary hash
  const binaryHash = crypto.createHash('sha256').update(fs.readFileSync(cliPath)).digest('hex');
  if (binaryHash !== PINNED_CLI_SHA256) {
    throw new Error(
      `PINNED_CLI_FAIL: Binary SHA-256 digest mismatch. Expected ${PINNED_CLI_SHA256}, got ${binaryHash}.`
    );
  }

  const cliExecutor = adapters.cliExecutor || spawnSync;
  const cleanEnv = buildCleanChildEnv(TASK_HOME_ROOT);
  const res = cliExecutor(cliPath, ['--version'], {
    cwd: CANONICAL_WORKSPACE_ROOT,
    env: cleanEnv,
    encoding: 'utf8',
  });

  if (res.status !== 0) {
    throw new Error(`PINNED_CLI_FAIL: Local Supabase CLI execution failed with exit code ${res.status}.`);
  }

  const lines = (res.stdout || '').trim().split('\n');
  const versionLine = lines[0].trim();
  const match = versionLine.match(/^(\d+\.\d+\.\d+)/);
  const version = match ? match[1] : versionLine;

  if (version !== PINNED_CLI_VERSION) {
    throw new Error(`PINNED_CLI_FAIL: CLI version mismatch. Expected exact ${PINNED_CLI_VERSION}, found "${version}".`);
  }

  return { cliPath, version, sha256: binaryHash };
}

/**
 * Atomically write authority record with fsync and safe temp-file rename.
 */
export function persistAuthorityAtomic(recordPath, authorityData) {
  const dir = path.dirname(recordPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  const tempPath = path.resolve(dir, `.authority.tmp.${crypto.randomBytes(4).toString('hex')}`);
  const payload = JSON.stringify(authorityData, null, 2);

  const fd = fs.openSync(tempPath, 'w', 0o600);
  try {
    fs.writeSync(fd, payload, 0, 'utf8');
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }

  fs.renameSync(tempPath, recordPath);

  // Sync parent directory if supported
  try {
    const dirFd = fs.openSync(dir, 'r');
    try {
      fs.fsyncSync(dirFd);
    } finally {
      fs.closeSync(dirFd);
    }
  } catch {}
}

/**
 * Allocate a new task-owned run directory and initial RESERVED authority record.
 */
export function allocateRun({
  runsDir = DEFAULT_RUNS_DIR,
  workdir = CANONICAL_WORKSPACE_ROOT,
  configPath = CANONICAL_CONFIG_PATH,
  stackName = null,
} = {}) {
  if (!fs.existsSync(runsDir)) {
    fs.mkdirSync(runsDir, { recursive: true, mode: 0o700 });
  }

  const runId = `run-${crypto.randomBytes(8).toString('hex')}`;
  const runDir = path.resolve(runsDir, runId);
  fs.mkdirSync(runDir, { mode: 0o700 });

  const homeDir = path.resolve(runDir, 'home');
  fs.mkdirSync(homeDir, { mode: 0o700 });

  const globalCache = path.resolve(CANONICAL_WORKSPACE_ROOT, '.supabase-home/cache');
  if (fs.existsSync(globalCache)) {
    try {
      spawnSync('cp', ['-al', globalCache, path.resolve(homeDir, 'cache')]);
    } catch {}
  }

  const uniqueStackName = stackName || `lingora-wp00-${crypto.randomBytes(4).toString('hex')}`;
  const configInfo = validateCanonicalConfig(configPath);
  const gitBranch = getGitBranch(workdir);

  const authority = {
    format_version: '1.0',
    task_id: TASK_ID,
    run_id: runId,
    phase: 'RESERVED',
    pending_operation: null,
    instance_id: null,
    stack_name: uniqueStackName,
    project_root: fs.realpathSync(CANONICAL_WORKSPACE_ROOT),
    repo_root: fs.realpathSync(CANONICAL_WORKSPACE_ROOT),
    control_root: fs.realpathSync(runDir),
    home_dir: fs.realpathSync(homeDir),
    workdir: fs.realpathSync(workdir),
    config_path: configInfo.configPath,
    config_digest: configInfo.configDigest,
    branch_ref: gitBranch.startsWith('refs/heads/') ? gitBranch : `refs/heads/${gitBranch}`,
    runtime: 'native',
    cli_version: PINNED_CLI_VERSION,
    cli_digest: PINNED_CLI_SHA256,
    endpoint_policy: {
      allowedHosts: Array.from(ALLOWED_HOSTS),
      expectedPorts: EXPECTED_PORTS,
    },
    validatedEndpoints: {
      database: { host: '127.0.0.1', port: EXPECTED_PORTS.database, protocol: 'tcp' },
      auth: { url: 'http://127.0.0.1:54321', port: EXPECTED_PORTS.api },
      rest: { url: 'http://127.0.0.1:54321', port: EXPECTED_PORTS.api },
      storage: { url: 'http://127.0.0.1:54321', port: EXPECTED_PORTS.api },
      mail: { url: 'http://127.0.0.1:54324', port: EXPECTED_PORTS.mail },
    },
    allocated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    member_map: null,
    last_observation: null,
    recovery_disposition: null,
  };

  const recordPath = path.resolve(runDir, 'owner.json');
  persistAuthorityAtomic(recordPath, authority);

  return { runId, runDir, homeDir, authority, recordPath };
}

/**
 * Acquire exclusive per-run lock.
 */
export function acquireRunLock(runDir, runId, options = {}) {
  const lockFile = path.resolve(runDir, '.run.lock');
  const token = crypto.randomUUID();
  const pid = process.pid;
  const stat = parseProcStat(pid);
  const startTicks = stat ? stat.start_ticks : '0';
  const bootId = getLinuxBootId();

  const lockData = {
    token,
    run_id: runId,
    pid,
    start_ticks: startTicks,
    boot_id: bootId,
    locked_at: new Date().toISOString(),
  };

  try {
    const fd = fs.openSync(lockFile, 'wx', 0o600);
    try {
      fs.writeSync(fd, JSON.stringify(lockData, null, 2), 0, 'utf8');
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    return { lockFile, token };
  } catch (err) {
    if (err.code === 'EEXIST') {
      let existingLock = null;
      try {
        existingLock = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
      } catch {}

      if (options.allowRecovery && existingLock) {
        const isAlive = isProcessAlive(existingLock.pid, existingLock.start_ticks, existingLock.boot_id);
        if (!isAlive) {
          // Orphan lock verified quiescent
          try {
            fs.unlinkSync(lockFile);
            return acquireRunLock(runDir, runId, { ...options, allowRecovery: false });
          } catch {}
        }
      }

      const lockErr = new Error(
        `LOCKED: Run lock held in "${runDir}" by PID ${existingLock?.pid || 'unknown'} (disposition: RECOVERY_REQUIRED).`
      );
      lockErr.code = 'LOCKED';
      lockErr.disposition = 'recovery-required';
      throw lockErr;
    }
    throw err;
  }
}

/**
 * Release exclusive per-run lock only if token matches.
 */
export function releaseRunLock(runDir, token) {
  const lockFile = path.resolve(runDir, '.run.lock');
  try {
    if (fs.existsSync(lockFile)) {
      const content = fs.readFileSync(lockFile, 'utf8');
      const data = JSON.parse(content);
      if (data && data.token === token) {
        fs.unlinkSync(lockFile);
      }
    }
  } catch {}
}

/**
 * Resolve run directory and authority record path from options.
 */
function resolveRunContext(options = {}, commandName = 'command') {
  const runsDir = options.runsDir || DEFAULT_RUNS_DIR;
  let runId = options.runId;
  let runDir;
  let recordPath;

  if (options.bindingFile) {
    recordPath = options.bindingFile;
    runDir = options.stateRoot || path.dirname(recordPath);
    runId = options.runId || (fs.existsSync(recordPath) ? (() => {
      try {
        const d = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
        return d.run_id || d.runId || path.basename(runDir);
      } catch {
        return path.basename(runDir);
      }
    })() : path.basename(runDir));
  } else if (runId) {
    runDir = path.resolve(runsDir, runId);
    recordPath = path.resolve(runDir, 'owner.json');
  } else {
    throw new Error(`COMMAND_INVALID: ${commandName} requires explicit --run <run-id>.`);
  }

  return { runId, runDir, recordPath, runsDir };
}

/**
 * Parse CLI JSON stdout safely without dumping raw strings or parser error snippets.
 */
export function parseCliJson(stdout, contextName) {
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
    // Intentionally NEVER interpolate error message or raw string
    throw new Error(`CLI_OUTPUT_ERROR: Failed to parse JSON from ${contextName} (syntax error).`);
  }
}

/**
 * Execute real SQL queries against PostgreSQL using explicit pg Client config.
 * Strips PG* env overrides and closes client in finally block.
 */
async function probeSqlReadiness(dbUrl, sqlAdapter = null, timeoutMs = 10000) {
  if (sqlAdapter) {
    return sqlAdapter(dbUrl);
  }

  const parsed = validateDatabaseUrl(dbUrl, EXPECTED_PORTS.database);

  // Strip inherited PG env variables at transport level
  const savedPgEnv = {};
  for (const k of Object.keys(process.env)) {
    if (k.startsWith('PG')) {
      savedPgEnv[k] = process.env[k];
      delete process.env[k];
    }
  }

  // Explicit config without connectionString
  const client = new Client({
    host: parsed.hostname,
    port: parsed.port,
    database: parsed.database,
    user: parsed.username,
    password: parsed.password,
    connectionTimeoutMillis: timeoutMs,
    ssl: false,
  });

  try {
    await client.connect();

    const resVersion = await client.query('SELECT version(), current_database(), current_user;');
    const pgVersionStr = resVersion.rows[0].version;
    const currentDb = resVersion.rows[0].current_database;
    const currentUser = resVersion.rows[0].current_user;

    const resSchemas = await client.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('public', 'auth', 'storage', 'extensions') ORDER BY schema_name;"
    );
    const foundSchemas = resSchemas.rows.map(r => r.schema_name);

    return {
      ready: true,
      pgVersion: pgVersionStr,
      currentDb,
      currentUser,
      foundSchemas,
    };
  } catch (err) {
    throw new Error(`SQL_READINESS_FAIL: ${sanitizeString(err.message)}`);
  } finally {
    try {
      await client.end();
    } catch {}
    for (const [k, v] of Object.entries(savedPgEnv)) {
      process.env[k] = v;
    }
  }
}

/**
 * Probe HTTP endpoint with redirect: 'error' and strict 200 requirement.
 * Never logs bodies or headers.
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
        redirect: 'error',
      });
      clearTimeout(timer);
      if (res.status === 200) {
        return {
          status: res.status,
          ready: true,
        };
      }
    } catch {}
    await new Promise(r => setTimeout(r, delayMs));
  }
  return { ready: false, status: 0 };
}

/**
 * Private guarded data readiness probe executed under lock.
 */
async function probeGuardedDataReadinessUnderLock({ authority, credentials, adapters = {} }) {
  const rawDbUrl = credentials.DB_URL;
  if (!rawDbUrl) {
    throw new Error('DATA_READINESS_FAIL: Provider failed to return database URL (DB_URL missing).');
  }

  const sqlEvidence = await probeSqlReadiness(rawDbUrl, adapters.sqlExecutor);

  const authBase = authority.validatedEndpoints?.auth?.url || 'http://127.0.0.1:54321';
  const authUrl = `${authBase}/auth/v1/health`;
  const authEvidence = await probeHttpEndpoint(
    authUrl,
    { apikey: credentials.ANON_KEY || '' },
    adapters.httpFetcher,
    8,
    500
  );
  if (!authEvidence.ready) {
    throw new Error(`AUTH_READINESS_FAIL: Auth health probe failed at ${authUrl}`);
  }

  const storageBase = authority.validatedEndpoints?.storage?.url || 'http://127.0.0.1:54321';
  const storageUrl = `${storageBase}/storage/v1/status`;
  const storageEvidence = await probeHttpEndpoint(
    storageUrl,
    { apikey: credentials.ANON_KEY || '' },
    adapters.httpFetcher,
    8,
    500
  );
  if (!storageEvidence.ready) {
    throw new Error(`STORAGE_READINESS_FAIL: Storage status probe failed at ${storageUrl}`);
  }

  const mailBase = authority.validatedEndpoints?.mail?.url || 'http://127.0.0.1:54324';
  const mailUrl = `${mailBase}/api/v1/messages`;
  const mailEvidence = await probeHttpEndpoint(mailUrl, {}, adapters.httpFetcher, 8, 500);
  if (!mailEvidence.ready) {
    throw new Error(`MAIL_READINESS_FAIL: Mail sink probe failed at ${mailUrl}`);
  }

  const readiness = {
    sql_ready: Boolean(sqlEvidence?.ready),
    pg_version: sqlEvidence?.pgVersion || '',
    current_database: sqlEvidence?.currentDb || '',
    current_user: sqlEvidence?.currentUser || '',
    schemas: sqlEvidence?.foundSchemas || [],
    auth_ready: Boolean(authEvidence?.ready),
    auth_status: authEvidence?.status || 0,
    storage_ready: Boolean(storageEvidence?.ready),
    storage_status: storageEvidence?.status || 0,
    mail_ready: Boolean(mailEvidence?.ready),
    mail_status: mailEvidence?.status || 0,
    session_pooler: 'DISABLED_IN_NATIVE_STACK (A2 requires external session pooler for Prisma 6.19.3)',
  };

  return {
    ...readiness,
    sql: sqlEvidence,
    auth: authEvidence,
    storage: storageEvidence,
    mail: mailEvidence,
  };
}

/**
 * Dedicated public entry point for guarded data readiness probe.
 */
export async function probeDataReadiness(options = {}) {
  const { runId, runDir, recordPath } = resolveRunContext(options, 'probeDataReadiness');
  const adapters = options.adapters || {};

  const authority = validateAuthorityRecord(recordPath, options);
  if (!authority.bound && authority.phase !== 'BOUND') {
    throw new Error(`DATA_READINESS_FAIL: Local binding is invalid (${authority.reason || 'not bound'})`);
  }

  const { lockFile, token } = acquireRunLock(runDir, runId, options);
  try {
    const { cliPath } = resolveSupabaseCli({ adapters });
    reconcileNativeRegistry({ authority, adapters, cliPath });

    const credFile = path.resolve(runDir, 'credentials.json');
    let credentials = {};
    if (fs.existsSync(credFile)) {
      credentials = JSON.parse(fs.readFileSync(credFile, 'utf8'));
    } else if (authority.rawBinding?.env) {
      credentials = authority.rawBinding.env;
    } else {
      throw new Error('DATA_READINESS_FAIL: Private credentials file missing for bound run.');
    }

    const probeResults = await probeGuardedDataReadinessUnderLock({ authority, credentials, adapters });

    const out = projectFiniteOutput({
      command: 'data',
      stage: 'completed',
      status: 'READY',
      code: 'SUCCESS',
      run_id: runId,
      instance_id: authority.instance_id,
      phase: authority.phase,
      exit_code: 0,
      readiness: probeResults,
    });
    return {
      ...out,
      sql: probeResults.sql,
      auth: probeResults.auth,
      storage: probeResults.storage,
      mail: probeResults.mail,
    };
  } finally {
    releaseRunLock(runDir, token);
  }
}

/**
 * Start task-local native Supabase stack.
 */
export async function startStack(options = {}) {
  const adapters = options.adapters || {};
  const cliExecutor = adapters.cliExecutor || spawnSync;

  let runId;
  let runDir;
  let homeDir;
  let recordPath;
  let authority;

  if (options.newRun) {
    const alloc = allocateRun({
      runsDir: options.runsDir || DEFAULT_RUNS_DIR,
      workdir: options.workdir || CANONICAL_WORKSPACE_ROOT,
      configPath: options.configPath || CANONICAL_CONFIG_PATH,
      stackName: options.stackName,
    });
    runId = alloc.runId;
    runDir = alloc.runDir;
    homeDir = alloc.homeDir;
    recordPath = alloc.recordPath;
    authority = alloc.authority;
  } else {
    const resolved = resolveRunContext(options, 'start');
    runId = resolved.runId;
    runDir = resolved.runDir;
    recordPath = resolved.recordPath;
    authority = validateAuthorityRecord(recordPath, options);
    if (!authority.bound && authority.phase !== 'BOUND' && authority.phase !== 'RESERVED') {
      throw new Error(`ALLOWLIST_FAIL: Existing binding is invalid (${authority.reason || 'not bound'})`);
    }
    homeDir = authority.home_dir || path.resolve(runDir, 'home');
  }

  const { lockFile, token } = acquireRunLock(runDir, runId, options);

  try {
    const { cliPath } = resolveSupabaseCli({ adapters });
    const cleanEnv = buildCleanChildEnv(homeDir);

    // If RESERVED: prepare stopped stack
    if (authority.phase === 'RESERVED') {
      // 1. Verify no matching tuple in registry prior to dispatch
      const preListRes = cliExecutor(
        cliPath,
        ['stack', 'list', '--workdir', authority.workdir, '--output-format', 'json'],
        { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8' }
      );
      if (preListRes.status === 0) {
        try {
          const preList = parseCliJson(preListRes.stdout, 'stack list (pre-allocation)');
          const existing = (preList.stacks || []).find(s => s.name === authority.stack_name);
          if (existing) {
            throw new Error(`ALLOCATION_FAIL: Stack name "${authority.stack_name}" already exists in native registry.`);
          }
        } catch (err) {
          if (err.message.includes('ALLOCATION_FAIL')) throw err;
        }
      }

      // 2. Persist operation intent
      authority.pending_operation = 'prepare';
      authority.updated_at = new Date().toISOString();
      persistAuthorityAtomic(recordPath, authority);

      // 3. Dispatch prepare
      const prepRes = cliExecutor(
        cliPath,
        ['stack', 'prepare', '--runtime', 'native', '--stack', authority.stack_name, '--workdir', authority.workdir, '--output-format', 'json'],
        { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8' }
      );

      if (prepRes.status !== 0) {
        throw new Error(`STACK_PREPARE_FAIL: prepare command failed with exit code ${prepRes.status}.`);
      }

      const prepParsed = parseCliJson(prepRes.stdout, 'stack prepare');
      if (!prepParsed.id || !/^[a-f0-9]{64}$/i.test(prepParsed.id)) {
        throw new Error('STACK_PREPARE_FAIL: prepare output missing full 64-character hex ID.');
      }
      const fullStackId = prepParsed.id;

      // 4. Reconcile tuple in native registry after prepare
      const postPrepListRes = cliExecutor(
        cliPath,
        ['stack', 'list', '--workdir', authority.workdir, '--output-format', 'json'],
        { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8' }
      );
      if (postPrepListRes.status !== 0) {
        throw new Error(`STACK_REGISTRY_FAIL: stack list failed with exit code ${postPrepListRes.status}.`);
      }
      const listParsed = parseCliJson(postPrepListRes.stdout, 'stack list');
      const matched = (listParsed.stacks || []).find(s => s.id === fullStackId);
      if (!matched) {
        throw new Error(`STACK_REGISTRY_FAIL: Stack ID ${fullStackId} was not found in native registry after prepare.`);
      }

      // 5. Bind ID atomically
      authority.instance_id = fullStackId;
      authority.phase = 'BOUND';
      authority.pending_operation = null;
      authority.updated_at = new Date().toISOString();
      persistAuthorityAtomic(recordPath, authority);
    } else if (authority.phase === 'BOUND') {
      // Reconcile existing bound stack
      reconcileNativeRegistry({ authority, adapters, cliPath });
    } else {
      throw new Error(`STACK_START_FAIL: Refusing to start stack in phase "${authority.phase}".`);
    }

    const fullStackId = authority.instance_id;

    // Persist start intent
    authority.pending_operation = 'start';
    authority.updated_at = new Date().toISOString();
    persistAuthorityAtomic(recordPath, authority);

    // Dispatch start
    const startRes = cliExecutor(
      cliPath,
      ['stack', 'start', '--stack-id', fullStackId, '--workdir', authority.workdir, '--output-format', 'json'],
      { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8' }
    );

    if (startRes.status !== 0) {
      throw new Error(`STACK_START_FAIL: stack start failed with exit code ${startRes.status}.`);
    }

    const startParsed = parseCliJson(startRes.stdout, 'stack start');
    if (startParsed.id !== fullStackId) {
      throw new Error(`STACK_START_FAIL: Returned ID ${startParsed.id} does not match bound stack ${fullStackId}`);
    }

    // Query status to verify running state and composition
    const statusRes = cliExecutor(
      cliPath,
      ['stack', 'status', '--stack-id', fullStackId, '--workdir', authority.workdir, '--output-format', 'json'],
      { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8' }
    );
    if (statusRes.status !== 0) {
      throw new Error(`STACK_STATUS_FAIL: stack status failed with exit code ${statusRes.status}.`);
    }
    const statusParsed = parseCliJson(statusRes.stdout, 'stack status (post-start)');

    // Save member UUID map
    const memberMap = {};
    if (statusParsed.composition && Array.isArray(statusParsed.composition.members)) {
      for (const m of statusParsed.composition.members) {
        memberMap[m.service] = m.id;
      }
    }
    const memberMapFile = path.resolve(runDir, 'member-map.json');
    fs.writeFileSync(memberMapFile, JSON.stringify(memberMap, null, 2), { mode: 0o600 });
    authority.member_map = memberMap;

    // Save private credentials mode 0600
    const rawEnv = startParsed.env || statusParsed.env || {};
    const credFile = path.resolve(runDir, 'credentials.json');
    fs.writeFileSync(credFile, JSON.stringify(rawEnv, null, 2), { mode: 0o600 });

    // Execute guarded data readiness probe under lock
    const probeResults = await probeGuardedDataReadinessUnderLock({
      authority,
      credentials: rawEnv,
      adapters,
    });

    authority.pending_operation = null;
    authority.last_observation = {
      lifecycle: statusParsed.lifecycle || 'running',
      readiness: probeResults,
      verified_at: new Date().toISOString(),
    };
    authority.updated_at = new Date().toISOString();
    persistAuthorityAtomic(recordPath, authority);

    const out = projectFiniteOutput({
      command: 'start',
      stage: 'completed',
      status: 'RUNNING',
      code: 'SUCCESS',
      run_id: runId,
      instance_id: fullStackId,
      phase: authority.phase,
      exit_code: 0,
    });

    return {
      ...out,
      id: fullStackId,
      stackId: fullStackId,
      runtime: authority.runtime || 'native',
      readiness: probeResults,
      runId,
    };
  } finally {
    releaseRunLock(runDir, token);
  }
}

/**
 * Status of disposable stack.
 */
export function statusStack(options = {}) {
  const { runId, runDir, recordPath } = resolveRunContext(options, 'status');
  const adapters = options.adapters || {};
  const cliExecutor = adapters.cliExecutor || spawnSync;

  const authority = validateAuthorityRecord(recordPath, options);

  if (!authority.bound && authority.phase !== 'BOUND' && authority.phase !== 'DESTROYED') {
    throw new Error(`STATUS_FAIL: Stack is not bound (${authority.reason || 'not bound'})`);
  }

  if (authority.phase === 'DESTROYED') {
    return projectFiniteOutput({
      command: 'status',
      stage: 'completed',
      status: 'DESTROYED',
      code: 'TOMBSTONE',
      run_id: runId,
      instance_id: authority.instance_id,
      phase: 'DESTROYED',
      exit_code: 0,
    });
  }

  const { lockFile, token } = acquireRunLock(runDir, runId, options);
  try {
    const { cliPath } = resolveSupabaseCli({ adapters });
    reconcileNativeRegistry({ authority, adapters, cliPath });

    const cleanEnv = buildCleanChildEnv(authority.home_dir || path.resolve(runDir, 'home'));
    const res = cliExecutor(
      cliPath,
      ['stack', 'status', '--stack-id', authority.instance_id, '--workdir', authority.workdir, '--output-format', 'json'],
      { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8' }
    );

    if (res.status !== 0) {
      throw new Error(`STATUS_FAIL: CLI status failed with exit code ${res.status}.`);
    }

    const parsed = parseCliJson(res.stdout, 'stack status');
    if (parsed.identity?.id !== authority.instance_id) {
      throw new Error(`STATUS_FAIL: ID returned by status (${parsed.identity?.id}) does not match bound ID.`);
    }

    return projectFiniteOutput({
      command: 'status',
      stage: 'completed',
      status: (parsed.lifecycle || 'unknown').toUpperCase(),
      code: 'SUCCESS',
      run_id: runId,
      instance_id: authority.instance_id,
      phase: authority.phase,
      exit_code: 0,
      readiness: parsed.readiness,
    });
  } finally {
    releaseRunLock(runDir, token);
  }
}

/**
 * Stop disposable stack.
 */
export function stopStack(options = {}) {
  const { runId, runDir, recordPath } = resolveRunContext(options, 'stop');
  const adapters = options.adapters || {};
  const cliExecutor = adapters.cliExecutor || spawnSync;

  const authority = validateAuthorityRecord(recordPath, options);

  if (!authority.bound && authority.phase !== 'BOUND') {
    throw new Error(`STOP_FAIL: Refusing to stop unbound stack (${authority.reason || 'not bound'})`);
  }

  const { lockFile, token } = acquireRunLock(runDir, runId, options);

  try {
    const { cliPath } = resolveSupabaseCli({ adapters });
    reconcileNativeRegistry({ authority, adapters, cliPath });

    // Snapshot known active processes before stop
    const homeDir = authority.home_dir || path.resolve(runDir, 'home');
    const knownProcesses = snapshotRunProcesses(homeDir, authority.workdir, authority.instance_id);

    authority.pending_operation = 'stop';
    authority.updated_at = new Date().toISOString();
    persistAuthorityAtomic(recordPath, authority);

    const cleanEnv = buildCleanChildEnv(homeDir);
    const res = cliExecutor(
      cliPath,
      ['stack', 'stop', '--stack-id', authority.instance_id, '--workdir', authority.workdir, '--output-format', 'json'],
      { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8' }
    );

    if (res.status !== 0) {
      throw new Error(`STOP_FAIL: CLI stop command failed with exit code ${res.status}.`);
    }

    const parsed = parseCliJson(res.stdout, 'stack stop');
    const stoppedList = parsed.stopped || [];
    const notRunningList = parsed.not_running || [];

    if (!stoppedList.includes(authority.instance_id) && !notRunningList.includes(authority.instance_id)) {
      throw new Error(`STOP_FAIL: Stop response did not acknowledge target stack ${authority.instance_id}`);
    }

    // Postcheck: verify known processes are quiescent
    const quiescent = verifyProcessesQuiescent(knownProcesses);
    if (!quiescent) {
      throw new Error('STOP_POSTCHECK_FAIL: Known provider processes are still active after stop.');
    }

    // Postcheck: verify stack remains registered in native registry
    const listRes = cliExecutor(
      cliPath,
      ['stack', 'list', '--workdir', authority.workdir, '--output-format', 'json'],
      { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8' }
    );
    if (listRes.status !== 0) {
      throw new Error(`STOP_POSTCHECK_FAIL: Registry list failed after stop with code ${listRes.status}.`);
    }
    const listParsed = parseCliJson(listRes.stdout, 'stack list (post-stop)');
    const stillRegistered = (listParsed.stacks || []).find(s => s.id === authority.instance_id);
    if (!stillRegistered) {
      throw new Error('STOP_POSTCHECK_FAIL: Stack disappeared from native registry after stop.');
    }

    authority.pending_operation = null;
    authority.updated_at = new Date().toISOString();
    persistAuthorityAtomic(recordPath, authority);

    return projectFiniteOutput({
      command: 'stop',
      stage: 'completed',
      status: 'STOPPED',
      code: 'SUCCESS',
      run_id: runId,
      instance_id: authority.instance_id,
      phase: authority.phase,
      exit_code: 0,
    });
  } finally {
    releaseRunLock(runDir, token);
  }
}

/**
 * Permanently destroy disposable stack.
 */
export function destroyStack(options = {}) {
  const { runId, runDir, recordPath } = resolveRunContext(options, 'destroy');
  const adapters = options.adapters || {};
  const cliExecutor = adapters.cliExecutor || spawnSync;

  const authority = validateAuthorityRecord(recordPath, options);

  if (authority.phase === 'DESTROYED') {
    const { lockFile, token } = acquireRunLock(runDir, runId, options);
    try {
      const credFile = path.resolve(runDir, 'credentials.json');
      const memberMapFile = path.resolve(runDir, 'member-map.json');
      if (fs.existsSync(credFile)) fs.unlinkSync(credFile);
      if (fs.existsSync(memberMapFile)) fs.unlinkSync(memberMapFile);

      return projectFiniteOutput({
        command: 'destroy',
        stage: 'completed',
        status: 'DESTROYED',
        code: 'ALREADY_DESTROYED',
        run_id: runId,
        instance_id: authority.instance_id,
        phase: 'DESTROYED',
        exit_code: 0,
      });
    } finally {
      releaseRunLock(runDir, token);
    }
  }

  if (!authority.bound && authority.phase !== 'BOUND') {
    throw new Error(`DESTROY_FAIL: Refusing to destroy unbound stack (${authority.reason || 'not bound'})`);
  }

  const { lockFile, token } = acquireRunLock(runDir, runId, options);

  try {
    const { cliPath } = resolveSupabaseCli({ adapters });
    reconcileNativeRegistry({ authority, adapters, cliPath });

    const homeDir = authority.home_dir || path.resolve(runDir, 'home');
    // Snapshot known processes and sockets before destroy
    const knownProcesses = snapshotRunProcesses(homeDir, authority.workdir, authority.instance_id);
    const pids = knownProcesses.map(p => p.pid);
    const knownSockets = snapshotProcessSockets(pids);

    authority.pending_operation = 'destroy';
    authority.updated_at = new Date().toISOString();
    persistAuthorityAtomic(recordPath, authority);

    const cleanEnv = buildCleanChildEnv(homeDir);
    const res = cliExecutor(
      cliPath,
      ['stack', 'destroy', '--stack-id', authority.instance_id, '--workdir', authority.workdir, '--yes', '--output-format', 'json'],
      { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8' }
    );

    if (res.status !== 0) {
      throw new Error(`DESTROY_FAIL: Destroy command failed with exit code ${res.status}. Retaining recovery state.`);
    }

    if (res.stdout && res.stdout.includes('{')) {
      const parsed = parseCliJson(res.stdout, 'stack destroy');
      if (parsed.destroyed !== true) {
        throw new Error('DESTROY_FAIL: CLI destroy did not report destroyed=true. Retaining recovery state.');
      }
    }

    // Postcheck 1: fresh stack list in correct home must not contain stack ID
    const listRes = cliExecutor(
      cliPath,
      ['stack', 'list', '--workdir', authority.workdir, '--output-format', 'json'],
      { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8' }
    );
    if (listRes.status !== 0) {
      throw new Error(`DESTROY_POSTCHECK_FAIL: Registry check failed after destroy with code ${listRes.status}.`);
    }
    const listParsed = parseCliJson(listRes.stdout, 'stack list (post-destroy)');
    if (!Array.isArray(listParsed.stacks)) {
      throw new Error('DESTROY_POSTCHECK_FAIL: Malformed stack list returned during destroy postcheck.');
    }
    const stillPresent = listParsed.stacks.find(s => s.id === authority.instance_id);
    if (stillPresent) {
      throw new Error(`DESTROY_POSTCHECK_FAIL: Stack ID ${authority.instance_id} still present in native registry.`);
    }

    // Postcheck 2: processes quiescent
    const processesQuiescent = verifyProcessesQuiescent(knownProcesses);
    if (!processesQuiescent) {
      throw new Error('DESTROY_POSTCHECK_FAIL: Native processes still active after destroy.');
    }

    // Postcheck 3: sockets quiescent
    const socketsQuiescent = verifySocketsQuiescent(knownSockets);
    if (!socketsQuiescent) {
      throw new Error('DESTROY_POSTCHECK_FAIL: Native sockets still open after destroy.');
    }

    // Atomically persist DESTROYED tombstone receipt
    const tombstoneReceipt = {
      ...(authority.rawAuthority || authority.rawBinding || {}),
      format_version: '1.0',
      task_id: authority.task_id || TASK_ID,
      run_id: authority.run_id,
      phase: 'DESTROYED',
      tombstone: true,
      pending_operation: null,
      instance_id: authority.instance_id,
      stack_name: authority.stack_name,
      project_root: authority.project_root,
      repo_root: authority.project_root,
      control_root: authority.control_root,
      home_dir: authority.home_dir,
      workdir: authority.workdir,
      config_path: authority.config_path,
      config_digest: authority.config_digest,
      branch_ref: authority.branch_ref,
      runtime: authority.runtime,
      cli_version: PINNED_CLI_VERSION,
      cli_digest: PINNED_CLI_SHA256,
      destroyed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    persistAuthorityAtomic(recordPath, tombstoneReceipt);

    // Unlink private credentials and derived state
    let cleanupError = false;
    try {
      const credFile = path.resolve(runDir, 'credentials.json');
      const memberMapFile = path.resolve(runDir, 'member-map.json');
      if (fs.existsSync(credFile)) fs.unlinkSync(credFile);
      if (fs.existsSync(memberMapFile)) fs.unlinkSync(memberMapFile);
    } catch {
      cleanupError = true;
    }

    if (cleanupError) {
      return projectFiniteOutput({
        command: 'destroy',
        stage: 'cleanup',
        status: 'CLEANUP_INCOMPLETE',
        code: 'CLEANUP_INCOMPLETE',
        run_id: runId,
        instance_id: authority.instance_id,
        phase: 'DESTROYED',
        exit_code: 1,
      });
    }

    return projectFiniteOutput({
      command: 'destroy',
      stage: 'completed',
      status: 'DESTROYED',
      code: 'SUCCESS',
      run_id: runId,
      instance_id: authority.instance_id,
      phase: 'DESTROYED',
      exit_code: 0,
    });
  } finally {
    releaseRunLock(runDir, token);
  }
}

// CLI entry point wrapper
if (process.argv[1] && path.basename(process.argv[1]) === 'stack-manager.mjs') {
  const cmd = process.argv[2] || 'status';
  const args = process.argv.slice(3);

  let newRun = false;
  let runId = null;
  let runsDir = DEFAULT_RUNS_DIR;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--new-run') {
      newRun = true;
    } else if (args[i] === '--run' && args[i + 1]) {
      runId = args[i + 1];
      i++;
    } else if (args[i] === '--runs-dir' && args[i + 1]) {
      runsDir = path.resolve(args[i + 1]);
      i++;
    }
  }

  (async () => {
    try {
      let result;
      if (cmd === 'start') {
        result = await startStack({ newRun, runId, runsDir });
      } else if (cmd === 'status') {
        result = statusStack({ runId, runsDir });
      } else if (cmd === 'stop') {
        result = stopStack({ runId, runsDir });
      } else if (cmd === 'destroy') {
        result = destroyStack({ runId, runsDir });
      } else if (cmd === 'data') {
        result = await probeDataReadiness({ runId, runsDir });
      } else {
        console.error(`[STACK-MGR] Unknown command: ${sanitizeString(cmd)}`);
        process.exit(1);
      }
      console.log(JSON.stringify(result, null, 2));
      if (result.exit_code !== 0) {
        process.exit(result.exit_code);
      }
    } catch (err) {
      const errOut = projectFiniteOutput({
        command: cmd,
        stage: 'error',
        status: 'FAILED',
        code: err.code || 'UNKNOWN_ERROR',
        message: err.message,
        exit_code: 1,
      });
      console.error('[STACK-MGR] ERROR:', sanitizeString(errOut.message));
      process.exit(1);
    }
  })();
}
