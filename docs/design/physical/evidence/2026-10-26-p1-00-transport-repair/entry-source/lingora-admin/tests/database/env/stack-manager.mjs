/**
 * Task-Local Supabase Stack Manager for Lingora WP-00 Harness.
 *
 * Implements WP-00/G0 D1 + D2 (Corrected for Codex Review Round 1):
 * - Run selection: start --new-run allocates a unique task-owned run with isolated config-only Git fixture;
 *   start/status/stop/destroy/data require explicit --run <run-id>. No default current-run adoption.
 * - Atomic authority record (owner.json, mode 0600) with phases: RESERVED -> BOUND -> DESTROYED.
 * - Durable operation intents persisted before side effects (temp file + fsync + atomic rename).
 * - Exclusive per-run locking (.run.lock) with process/start-tick/boot identity.
 *   Orphan lock clearance requires verified harness PID death AND provider process quiescence AND socket quiescence.
 * - Pinned local Supabase CLI 2.121.0 resolution and binary hash verification.
 * - Explicit clean child environment (no inherited PG*, NODE_OPTIONS, or provider env).
 * - Safe native inspection and registry reconciliation (exact full 64-char ID and identity tuple).
 * - Member UUID map continuity verification: fresh status composition validated before mutation/data.
 * - Linux /proc process and socket observation: verified postcondition quiescence on stop and destroy.
 * - Exact typed PostgreSQL configuration (lowest transport adapter pgClientFactory, connection/query/close lifecycle).
 * - Guarded HTTP health probes (lowest transport adapter fetch, strict 200 OK, redirect: 'error', timeouts cleared in finally).
 * - Strict full JSON parsing (parseStrictJson) without substring extraction or message interpolation.
 * - Finite diagnostic projections only (strictly defined enums and static messages; never raw provider/error strings).
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
  CANONICAL_CONFIG_DIGEST,
  TASK_ID,
  DEFAULT_RUNS_DIR,
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
  isProcessAlive,
  checkProcessAlive,
  snapshotRunProcesses,
  snapshotRunSockets,
  verifyProcessesQuiescent,
  verifySocketsQuiescent,
  verifyNativeStateFilesAbsent,
  verifyIncarnationContinuity,
  assertNoPendingOperation,
  sanitizeString,
  projectFiniteOutput,
  parseStrictJson,
} from './env-guard.mjs';

/**
 * Resolve local Supabase CLI platform binary and verify pinned hash.
 */
export function resolveSupabaseCli({ adapters = {} } = {}) {
  const cliPath = adapters.cliPath || PINNED_CLI_PATH;
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
  const cleanEnv = buildCleanChildEnv(DEFAULT_RUNS_DIR);
  const res = cliExecutor(cliPath, ['--version'], {
    cwd: CANONICAL_WORKSPACE_ROOT,
    env: cleanEnv,
    encoding: 'utf8',
    timeout: 10000,
  });

  if (res.status !== 0) {
    throw new Error(`PINNED_CLI_FAIL: Local Supabase CLI execution failed with exit code ${res.status}.`);
  }

  const outputVersion = (res.stdout || '').trim();
  if (outputVersion !== PINNED_CLI_VERSION) {
    throw new Error(
      `PINNED_CLI_FAIL: CLI version mismatch. Expected exact ${PINNED_CLI_VERSION}, found "${outputVersion}".`
    );
  }

  return { cliPath, version: PINNED_CLI_VERSION, binaryHash };
}

/**
 * Persist authority record atomically with mode 0600 and fsync.
 */
export function persistAuthorityAtomic(recordPath, authority) {
  const dir = path.dirname(recordPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  const tempFile = path.resolve(dir, `.tmp-owner-${crypto.randomBytes(6).toString('hex')}.json`);
  const content = JSON.stringify(authority, null, 2);

  const fd = fs.openSync(tempFile, 'wx', 0o600);
  try {
    fs.writeSync(fd, content, 0, 'utf8');
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }

  fs.renameSync(tempFile, recordPath);

  // fsync parent directory on Linux (failures must propagate before provider mutation)
  const dirFd = fs.openSync(dir, 'r');
  try {
    fs.fsyncSync(dirFd);
  } finally {
    fs.closeSync(dirFd);
  }
}

/**
 * Allocate a new task-owned run directory, config-only Git fixture, and initial RESERVED authority record.
 */
export function allocateRun({
  runsDir = DEFAULT_RUNS_DIR,
  workdir = null,
  configPath = null,
  stackName = null,
  useFixture = true,
} = {}) {
  if (!fs.existsSync(runsDir)) {
    fs.mkdirSync(runsDir, { recursive: true, mode: 0o700 });
  }

  const runId = `run-${crypto.randomBytes(8).toString('hex')}`;
  const runDir = path.resolve(runsDir, runId);
  fs.mkdirSync(runDir, { mode: 0o700 });

  const homeDir = path.resolve(runDir, 'home');
  fs.mkdirSync(homeDir, { mode: 0o700 });

  let effectiveWorkdir;
  let effectiveConfigPath;

  if (useFixture && !workdir) {
    // Create isolated config-only Git fixture
    const fixtureDir = path.resolve(runDir, 'fixture');
    fs.mkdirSync(fixtureDir, { mode: 0o700 });
    const fixtureSupabaseDir = path.resolve(fixtureDir, 'supabase');
    fs.mkdirSync(fixtureSupabaseDir, { mode: 0o700 });
    const targetConfig = path.resolve(fixtureSupabaseDir, 'config.toml');
    fs.copyFileSync(CANONICAL_CONFIG_PATH, targetConfig);
    fs.chmodSync(targetConfig, 0o600);

    // Initialize Git repo with refs/heads/main
    spawnSync('git', ['init', '-b', 'main'], { cwd: fixtureDir });
    spawnSync('git', ['config', 'user.email', 'wp00-runner@lingora.local'], { cwd: fixtureDir });
    spawnSync('git', ['config', 'user.name', 'WP00 Runner'], { cwd: fixtureDir });
    spawnSync('git', ['add', 'supabase/config.toml'], { cwd: fixtureDir });
    spawnSync('git', ['commit', '-m', 'initial config fixture'], { cwd: fixtureDir });

    effectiveWorkdir = fs.realpathSync(fixtureDir);
    effectiveConfigPath = fs.realpathSync(targetConfig);
  } else {
    effectiveWorkdir = fs.realpathSync(workdir || CANONICAL_WORKSPACE_ROOT);
    effectiveConfigPath = fs.realpathSync(configPath || CANONICAL_CONFIG_PATH);
  }

  const uniqueStackName = stackName || `lingora-wp00-${crypto.randomBytes(4).toString('hex')}`;
  const configInfo = validateCanonicalConfig(effectiveConfigPath);
  const gitBranch = getGitBranch(effectiveWorkdir);

  const authority = {
    format_version: '1.0',
    task_id: TASK_ID,
    run_id: runId,
    phase: 'RESERVED',
    pending_operation: null,
    instance_id: null,
    stack_name: uniqueStackName,
    project_root: effectiveWorkdir,
    repo_root: effectiveWorkdir,
    control_root: fs.realpathSync(runDir),
    home_dir: fs.realpathSync(homeDir),
    workdir: effectiveWorkdir,
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

  return { runId, runDir, homeDir, authority, recordPath, fixtureDir: effectiveWorkdir };
}

/**
 * Acquire exclusive per-run lock.
 * Strict orphan lock check: requires BOTH harness process death AND provider process quiescence AND socket quiescence.
 */
export function acquireRunLock(runDir, runId, options = {}) {
  const lockFile = path.resolve(runDir, '.run.lock');
  const token = crypto.randomUUID();
  const pid = process.pid;
  const statRes = parseProcStat(pid);
  const startTicks = statRes.status === 'KNOWN' && statRes.stat ? statRes.stat.start_ticks : '0';
  const bootRes = getLinuxBootId();
  const bootId = bootRes.status === 'KNOWN' ? bootRes.boot_id : 'unknown-boot';

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
    // fsync parent dir
    const dirFd = fs.openSync(runDir, 'r');
    try {
      fs.fsyncSync(dirFd);
    } finally {
      fs.closeSync(dirFd);
    }
    return { lockFile, token };
  } catch (err) {
    if (err.code === 'EEXIST') {
      let existingLock = null;
      try {
        existingLock = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
      } catch {}

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
 * Release run lock safely verifying token ownership.
 */
export function releaseRunLock(runDir, token) {
  const lockFile = path.resolve(runDir, '.run.lock');
  try {
    if (fs.existsSync(lockFile)) {
      const content = fs.readFileSync(lockFile, 'utf8');
      const data = JSON.parse(content);
      if (data.token === token) {
        fs.unlinkSync(lockFile);
        try {
          const dirFd = fs.openSync(runDir, 'r');
          try {
            fs.fsyncSync(dirFd);
          } finally {
            fs.closeSync(dirFd);
          }
        } catch {}
      }
    }
  } catch {}
}

/**
 * Resolve run directory and authority record path from options.
 * Requires explicit run ID. No derivation from arbitrary bindingFile.
 */
export function resolveRunContext(options = {}, commandName = 'command') {
  const runsDir = options.runsDir || DEFAULT_RUNS_DIR;
  let runId = options.runId;

  // Support explicit command line flag: --run <run-id>
  if (!runId && process.argv) {
    for (let i = 2; i < process.argv.length; i++) {
      if (process.argv[i] === '--run' && process.argv[i + 1]) {
        runId = process.argv[i + 1];
        break;
      }
    }
  }

  if (!runId || typeof runId !== 'string' || !/^run-[a-f0-9]{8,32}$/i.test(runId)) {
    const err = new Error(`COMMAND_INVALID: ${commandName} requires explicit --run <run-id>.`);
    err.code = 'COMMAND_INVALID';
    throw err;
  }

  const runDir = path.resolve(runsDir, runId);
  const recordPath = path.resolve(runDir, 'owner.json');

  return { runId, runDir, recordPath, runsDir };
}

/**
 * Parse CLI JSON stdout safely with strict JSON parser.
 */
export function parseCliJson(stdout, contextName) {
  return parseStrictJson(stdout, contextName);
}

/**
 * Execute real SQL queries against PostgreSQL using lowest client transport (pgClientFactory).
 * Strips PG* env overrides and closes client in finally block.
 */
async function probeSqlReadiness(dbUrl, adapters = {}, timeoutMs = 10000) {
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
  const clientConfig = {
    host: parsed.hostname,
    port: parsed.port,
    database: parsed.database,
    user: parsed.username,
    password: parsed.password,
    connectionTimeoutMillis: timeoutMs,
    ssl: false,
  };

  let client = null;
  try {
    const factory = adapters.pgClientFactory || (cfg => new Client(cfg));
    client = factory(clientConfig);
    await client.connect();

    const resVersion = await client.query('SELECT version(), current_database(), current_user;');
    const row = resVersion.rows[0];
    const pgVersionStr = row.version;
    const currentDb = row.current_database;
    const currentUser = row.current_user;

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
    const safeErr = new Error('SQL_READINESS_FAIL: Query execution failed.');
    safeErr.code = 'DATA_FAIL';
    throw safeErr;
  } finally {
    let closeErr = null;
    if (client && typeof client.end === 'function') {
      try {
        await client.end();
      } catch (e) {
        closeErr = e;
      }
    }
    for (const [k, v] of Object.entries(savedPgEnv)) {
      process.env[k] = v;
    }
    if (closeErr) {
      const safeErr = new Error('SQL_READINESS_FAIL: Client close failed.');
      safeErr.code = 'DATA_FAIL';
      throw safeErr;
    }
  }
}

/**
 * Probe HTTP endpoint using lowest transport (fetch adapter).
 * Requires status 200, redirect: 'error', timeouts cleared in finally.
 */
async function probeHttpEndpoint(url, headers = {}, adapters = {}, retries = 5, delayMs = 500) {
  validateApiUrl(url, null);

  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const fetchFn = adapters.fetch || fetch;
      const res = await fetchFn(url, {
        headers,
        signal: controller.signal,
        redirect: 'error',
      });
      if (res && res.status === 200) {
        return { ready: true, status: 200 };
      }
    } catch {
      // Retry
    } finally {
      clearTimeout(timer);
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  return { ready: false, status: 0 };
}

/**
 * Unified under-lock live validator and data readiness authorization.
 * Used identically across initial start, existing start, public probeDataReadiness, and scaffolds.
 */
export async function executeUnderLockDataAuthorization({
  runId,
  runsDir,
  authority,
  recordPath,
  runDir,
  adapters = {},
}) {
  if (!authority || (!authority.bound && authority.phase !== 'BOUND')) {
    throw new Error('ALLOWLIST_FAIL: Authority must be BOUND to authorize data readiness.');
  }

  assertNoPendingOperation(authority, 'data_readiness');

  const { cliPath } = resolveSupabaseCli({ adapters });
  const cliExecutor = adapters.cliExecutor || spawnSync;

  // 1. Reconcile exact 4-tuple and uniqueness against native registry
  reconcileNativeRegistry({ authority, adapters, cliPath });

  // 2. Query fresh live status
  const cleanEnv = buildCleanChildEnv(authority.home_dir);
  const statusRes = cliExecutor(
    cliPath,
    ['stack', 'status', '--stack-id', authority.instance_id, '--workdir', authority.workdir, '--output-format', 'json'],
    { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8', timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
  );

  if (statusRes.status !== 0) {
    throw new Error(`STATUS_FAIL: Pre-effect status check failed with exit code ${statusRes.status}`);
  }

  const statusParsed = parseStrictJson(statusRes.stdout, 'stack status (live data authorization)');

  // 3. Exact live identity, runtime, lifecycle validation
  if (statusParsed.identity?.id !== authority.instance_id) {
    throw new Error('RECONCILE_FAIL: Live status ID mismatch during data authorization.');
  }
  if (statusParsed.identity?.name !== authority.stack_name) {
    throw new Error('RECONCILE_FAIL: Live status name mismatch during data authorization.');
  }
  if (statusParsed.runtime !== 'native') {
    throw new Error('RECONCILE_FAIL: Live status runtime mismatch (expected native).');
  }
  if (statusParsed.lifecycle !== 'running') {
    throw new Error('STATUS_FAIL: Stack is not in running lifecycle.');
  }

  // 4. Exact composition member UUID continuity
  if (!statusParsed.composition || !Array.isArray(statusParsed.composition.members) || statusParsed.composition.members.length === 0) {
    throw new Error('RECONCILE_FAIL: Active composition missing or empty during data authorization.');
  }
  const currentMembers = {};
  for (const m of statusParsed.composition.members) {
    currentMembers[m.service] = m.id;
  }
  for (const [srv, expId] of Object.entries(authority.member_map)) {
    if (!currentMembers[srv]) {
      throw new Error('RECONCILE_FAIL: Required service missing from active composition.');
    }
    if (currentMembers[srv] !== expId) {
      throw new Error('RECONCILE_FAIL: Member UUID mismatch. Incarnation continuity broken.');
    }
  }

  // 5. Exact live endpoints validation (no synthesized defaults or fallbacks)
  const eps = statusParsed.endpoints;
  if (!eps || typeof eps !== 'object') {
    throw new Error('ALLOWLIST_FAIL: Missing endpoints in live provider status.');
  }

  const dbEp = eps['database.sql'];
  const authEp = eps['auth.http'];
  const storageEp = eps['storage.http'];
  const mailEp = eps['mail.http'];

  if (!dbEp || dbEp.address !== '127.0.0.1' || dbEp.port !== EXPECTED_PORTS.database) {
    throw new Error('ALLOWLIST_FAIL: Invalid or foreign database endpoint in live status.');
  }
  if (!authEp || authEp.address !== '127.0.0.1' || authEp.port !== EXPECTED_PORTS.api) {
    throw new Error('ALLOWLIST_FAIL: Invalid or foreign auth endpoint in live status.');
  }
  if (!storageEp || storageEp.address !== '127.0.0.1' || storageEp.port !== EXPECTED_PORTS.api) {
    throw new Error('ALLOWLIST_FAIL: Invalid or foreign storage endpoint in live status.');
  }
  if (!mailEp || mailEp.address !== '127.0.0.1' || mailEp.port !== EXPECTED_PORTS.mail) {
    throw new Error('ALLOWLIST_FAIL: Invalid or foreign mail endpoint in live status.');
  }

  // 6. Live credentials validation
  const liveEnv = statusParsed.env;
  if (!liveEnv || typeof liveEnv !== 'object' || !liveEnv.DB_URL || !liveEnv.ANON_KEY) {
    throw new Error('DATA_READINESS_FAIL: Provider status missing live DB_URL or ANON_KEY.');
  }

  validateDatabaseUrl(liveEnv.DB_URL, dbEp.port);

  // Persist verified live credentials securely
  const credPath = path.resolve(runDir, 'credentials.json');
  fs.writeFileSync(credPath, JSON.stringify(liveEnv, null, 2), { mode: 0o600 });

  // 7. Execute lowest-transport readiness probes
  const sqlEvidence = await probeSqlReadiness(liveEnv.DB_URL, adapters);

  const authUrl = `http://${authEp.address}:${authEp.port}/auth/v1/health`;
  const authEvidence = await probeHttpEndpoint(authUrl, { apikey: liveEnv.ANON_KEY }, adapters, 8, 500);
  if (!authEvidence.ready) {
    throw new Error('AUTH_READINESS_FAIL: Auth health probe failed.');
  }

  const storageUrl = `http://${storageEp.address}:${storageEp.port}/storage/v1/status`;
  const storageEvidence = await probeHttpEndpoint(storageUrl, { apikey: liveEnv.ANON_KEY }, adapters, 8, 500);
  if (!storageEvidence.ready) {
    throw new Error('STORAGE_READINESS_FAIL: Storage status probe failed.');
  }

  const mailUrl = `http://${mailEp.address}:${mailEp.port}/api/v1/messages`;
  const mailEvidence = await probeHttpEndpoint(mailUrl, {}, adapters, 8, 500);
  if (!mailEvidence.ready) {
    throw new Error('MAIL_READINESS_FAIL: Mail sink probe failed.');
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
    sql: sqlEvidence,
    auth: authEvidence,
    storage: storageEvidence,
    mail: mailEvidence,
  };

  authority.last_observation = {
    lifecycle: 'running',
    readiness,
    verified_at: new Date().toISOString(),
  };
  authority.updated_at = new Date().toISOString();
  persistAuthorityAtomic(recordPath, authority);

  return readiness;
}

/**
 * Start disposable stack (handles new-run allocation and existing start under lock).
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
      workdir: options.workdir,
      configPath: options.configPath,
      stackName: options.stackName,
      useFixture: options.useFixture !== false,
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
    authority = validateAuthorityRecord(recordPath, { ...options, expectedRunId: runId });
    if (!authority.bound && authority.phase !== 'BOUND' && authority.phase !== 'RESERVED') {
      throw new Error(`ALLOWLIST_FAIL: Existing binding is invalid (${authority.reason || 'not bound'})`);
    }
    homeDir = authority.home_dir;
  }

  const { lockFile, token } = acquireRunLock(runDir, runId, options);
  try {
    // Reread authority under lock
    authority = validateAuthorityRecord(recordPath, { ...options, expectedRunId: runId });
    const { cliPath } = resolveSupabaseCli({ adapters });
    const cleanEnv = buildCleanChildEnv(homeDir);

    let fullStackId = authority.instance_id;

    if (authority.phase === 'RESERVED') {
      // F3: Uncertain pending operations deny rather than speculative auto-recovery
      assertNoPendingOperation(authority, 'prepare');

      // Pre-prepare check: List native registry. Strict check: must NOT already exist.
      const preListRes = cliExecutor(
        cliPath,
        ['stack', 'list', '--workdir', authority.workdir, '--output-format', 'json'],
        { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8', timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
      );
      if (preListRes.status !== 0) {
        throw new Error(`PREPARE_FAIL: Pre-prepare stack list failed with exit code ${preListRes.status}`);
      }
      const preListParsed = parseStrictJson(preListRes.stdout, 'stack list');
      if (!Array.isArray(preListParsed.stacks)) {
        throw new Error('PREPARE_FAIL: Invalid stacks array in pre-prepare list output.');
      }
      if (preListParsed.stacks.some(s => s.name === authority.stack_name)) {
        throw new Error(`PREPARE_FAIL: Stack name "${authority.stack_name}" already exists in native registry.`);
      }

      // Persist prepare intent (directory fsync must succeed before dispatch)
      authority.pending_operation = 'prepare';
      authority.updated_at = new Date().toISOString();
      persistAuthorityAtomic(recordPath, authority);

      // Dispatch stack prepare
      const prepRes = cliExecutor(
        cliPath,
        ['stack', 'prepare', '--stack', authority.stack_name, '--runtime', 'native', '--workdir', authority.workdir, '--output-format', 'json'],
        { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8', timeout: 240000, maxBuffer: 10 * 1024 * 1024 }
      );
      if (prepRes.status !== 0) {
        throw new Error(`PREPARE_FAIL: stack prepare failed with exit code ${prepRes.status}.`);
      }

      const prepParsed = parseStrictJson(prepRes.stdout, 'stack prepare');
      if (!prepParsed.id || !/^[a-f0-9]{64}$/i.test(prepParsed.id)) {
        throw new Error('PREPARE_FAIL: prepare output missing full 64-character hex ID.');
      }
      fullStackId = prepParsed.id;

      // Reconcile exactly ONE matching full tuple after prepare
      const postPrepListRes = cliExecutor(
        cliPath,
        ['stack', 'list', '--workdir', authority.workdir, '--output-format', 'json'],
        { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8', timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
      );
      if (postPrepListRes.status !== 0) {
        throw new Error(`RECONCILE_FAIL: stack list failed with exit code ${postPrepListRes.status}.`);
      }
      const listParsed = parseStrictJson(postPrepListRes.stdout, 'stack list');
      const sameIdCandidates = (listParsed.stacks || []).filter(s => s.id === fullStackId);
      if (sameIdCandidates.length !== 1) {
        throw new Error(`RECONCILE_FAIL: Expected exactly 1 candidate for ID ${fullStackId}, found ${sameIdCandidates.length}.`);
      }
      const sameNameOtherId = (listParsed.stacks || []).find(s => s.name === authority.stack_name && s.id !== fullStackId);
      if (sameNameOtherId) {
        throw new Error(`RECONCILE_FAIL: Stack name "${authority.stack_name}" is duplicated under a different ID.`);
      }
      const matching = sameIdCandidates[0];
      const realMatchRoot = fs.existsSync(matching.project_root) ? fs.realpathSync(matching.project_root) : matching.project_root;
      const realAuthRoot = fs.existsSync(authority.project_root) ? fs.realpathSync(authority.project_root) : authority.project_root;
      if (
        matching.name !== authority.stack_name ||
        matching.runtime !== 'native' ||
        realMatchRoot !== realAuthRoot ||
        (matching.branch_context || '').replace(/^refs\/heads\//, '') !== (authority.branch_ref || '').replace(/^refs\/heads\//, '')
      ) {
        throw new Error(`RECONCILE_FAIL: Initial candidate tuple mismatch for ${fullStackId}.`);
      }

      // Dispatch start
      const startRes = cliExecutor(
        cliPath,
        ['stack', 'start', '--stack-id', fullStackId, '--workdir', authority.workdir, '--output-format', 'json'],
        { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8', timeout: 120000, maxBuffer: 10 * 1024 * 1024 }
      );
      if (startRes.status !== 0) {
        throw new Error(`START_FAIL: stack start failed with exit code ${startRes.status}.`);
      }

      const startParsed = parseStrictJson(startRes.stdout, 'stack start');
      if (startParsed.id !== fullStackId) {
        throw new Error('START_FAIL: Returned ID does not match bound stack.');
      }

      // Query status to verify initial running composition
      const statusRes = cliExecutor(
        cliPath,
        ['stack', 'status', '--stack-id', fullStackId, '--workdir', authority.workdir, '--output-format', 'json'],
        { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8', timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
      );
      if (statusRes.status !== 0) {
        throw new Error(`STATUS_FAIL: stack status failed with exit code ${statusRes.status}.`);
      }
      const statusParsed = parseStrictJson(statusRes.stdout, 'stack status (initial-start)');

      const currentMemberMap = {};
      if (statusParsed.composition && Array.isArray(statusParsed.composition.members)) {
        for (const m of statusParsed.composition.members) {
          currentMemberMap[m.service] = m.id;
        }
      }
      if (Object.keys(currentMemberMap).length === 0) {
        throw new Error('START_FAIL: Initial status missing composition members.');
      }

      // First initialization: bind ID and establish member_map anchor
      authority.instance_id = fullStackId;
      authority.member_map = currentMemberMap;
      authority.phase = 'BOUND';
      authority.pending_operation = null;
      authority.updated_at = new Date().toISOString();
      persistAuthorityAtomic(recordPath, authority);

      const memberMapFile = path.resolve(runDir, 'member-map.json');
      fs.writeFileSync(memberMapFile, JSON.stringify(currentMemberMap, null, 2), { mode: 0o600 });
    } else if (authority.phase === 'BOUND') {
      // F3: Uncertain pending operations deny rather than speculative auto-recovery
      assertNoPendingOperation(authority, 'start');

      // Reconcile existing bound stack
      reconcileNativeRegistry({ authority, adapters, cliPath });
      verifyIncarnationContinuity({ authority, adapters, cliPath });

      // Persist start intent
      authority.pending_operation = 'start';
      authority.updated_at = new Date().toISOString();
      persistAuthorityAtomic(recordPath, authority);

      // Dispatch start
      const startRes = cliExecutor(
        cliPath,
        ['stack', 'start', '--stack-id', fullStackId, '--workdir', authority.workdir, '--output-format', 'json'],
        { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8', timeout: 120000, maxBuffer: 10 * 1024 * 1024 }
      );
      if (startRes.status !== 0) {
        throw new Error(`START_FAIL: stack start failed with exit code ${startRes.status}.`);
      }

      const startParsed = parseStrictJson(startRes.stdout, 'stack start');
      if (startParsed.id !== fullStackId) {
        throw new Error('START_FAIL: Returned ID does not match bound stack.');
      }

      authority.pending_operation = null;
      authority.updated_at = new Date().toISOString();
      persistAuthorityAtomic(recordPath, authority);
    } else {
      throw new Error(`START_FAIL: Refusing to start stack in phase "${authority.phase}".`);
    }

    // Execute unified guarded data authorization under lock
    const probeResults = await executeUnderLockDataAuthorization({
      runId,
      runsDir: options.runsDir || DEFAULT_RUNS_DIR,
      authority,
      recordPath,
      runDir,
      adapters,
    });

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
      runtime: 'native',
      readiness: probeResults,
      runId,
    };
  } finally {
    releaseRunLock(runDir, token);
  }
}

/**
 * Status of disposable stack under lock.
 */
export function statusStack(options = {}) {
  const { runId, runDir, recordPath, runsDir } = resolveRunContext(options, 'status');
  const adapters = options.adapters || {};
  const cliExecutor = adapters.cliExecutor || spawnSync;

  let authority = validateAuthorityRecord(recordPath, { ...options, expectedRunId: runId, runsDir });

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
    authority = validateAuthorityRecord(recordPath, { ...options, expectedRunId: runId, runsDir });

    assertNoPendingOperation(authority, 'status');

    const { cliPath } = resolveSupabaseCli({ adapters });
    reconcileNativeRegistry({ authority, adapters, cliPath });

    const cleanEnv = buildCleanChildEnv(authority.home_dir);
    const res = cliExecutor(
      cliPath,
      ['stack', 'status', '--stack-id', authority.instance_id, '--workdir', authority.workdir, '--output-format', 'json'],
      { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8', timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
    );
    if (res.status !== 0) {
      throw new Error(`STATUS_FAIL: CLI status failed with exit code ${res.status}.`);
    }

    const parsed = parseStrictJson(res.stdout, 'stack status');
    if (parsed.identity?.id !== authority.instance_id) {
      throw new Error('STATUS_FAIL: ID returned by status does not match bound ID.');
    }

    // Verify member UUID continuity if recorded
    if (authority.member_map && parsed.composition && Array.isArray(parsed.composition.members)) {
      const currentMembers = {};
      for (const m of parsed.composition.members) {
        currentMembers[m.service] = m.id;
      }
      for (const [srv, expId] of Object.entries(authority.member_map)) {
        if (currentMembers[srv] !== expId) {
          throw new Error('RECONCILE_FAIL: Member UUID mismatch. Incarnation continuity broken.');
        }
      }
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
 * Stop disposable stack with postcheck process and socket quiescence.
 */
export function stopStack(options = {}) {
  const { runId, runDir, recordPath, runsDir } = resolveRunContext(options, 'stop');
  const adapters = options.adapters || {};
  const cliExecutor = adapters.cliExecutor || spawnSync;

  let authority = validateAuthorityRecord(recordPath, { ...options, expectedRunId: runId, runsDir });

  if (authority.phase === 'DESTROYED') {
    throw new Error('STOP_FAIL: Stack is already destroyed.');
  }

  const { lockFile, token } = acquireRunLock(runDir, runId, options);
  try {
    authority = validateAuthorityRecord(recordPath, { ...options, expectedRunId: runId, runsDir });

    assertNoPendingOperation(authority, 'stop');

    const { cliPath } = resolveSupabaseCli({ adapters });
    reconcileNativeRegistry({ authority, adapters, cliPath });
    verifyIncarnationContinuity({ authority, adapters, cliPath });

    const homeDir = authority.home_dir;
    const knownProcSnapshot = snapshotRunProcesses(homeDir, authority.workdir, authority.instance_id);

    authority.pending_operation = 'stop';
    authority.updated_at = new Date().toISOString();
    persistAuthorityAtomic(recordPath, authority);

    const cleanEnv = buildCleanChildEnv(homeDir);
    const res = cliExecutor(
      cliPath,
      ['stack', 'stop', '--stack-id', authority.instance_id, '--workdir', authority.workdir, '--output-format', 'json'],
      { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8', timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
    );
    if (res.status !== 0) {
      throw new Error(`STOP_FAIL: Stop command failed with exit code ${res.status}.`);
    }

    const parsed = parseStrictJson(res.stdout, 'stack stop');
    const inStopped = Array.isArray(parsed.stopped) && parsed.stopped.includes(authority.instance_id);
    const inNotRunning = Array.isArray(parsed.not_running) && parsed.not_running.includes(authority.instance_id);
    if (!inStopped && !inNotRunning) {
      throw new Error('STOP_FAIL: Target stack ID was not confirmed stopped or not_running.');
    }

    // Postcheck 1: Exact tuple still registered
    reconcileNativeRegistry({ authority, adapters, cliPath });

    // Postcheck 2: Processes quiescent
    const processesQuiescent = verifyProcessesQuiescent(knownProcSnapshot, homeDir, authority.workdir, authority.instance_id);
    if (!processesQuiescent) {
      throw new Error('STOP_POSTCHECK_FAIL: Known provider processes are still active after stop.');
    }

    // Postcheck 3: Sockets quiescent
    const socketsQuiescent = verifySocketsQuiescent([54321, 54322, 54324]);
    if (!socketsQuiescent) {
      throw new Error('STOP_POSTCHECK_FAIL: Provider sockets still listening after stop.');
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
 * Destroy disposable stack with strict acknowledgment, registry absence, and quiescence.
 */
export function destroyStack(options = {}) {
  const { runId, runDir, recordPath, runsDir } = resolveRunContext(options, 'destroy');
  const adapters = options.adapters || {};
  const cliExecutor = adapters.cliExecutor || spawnSync;

  const { lockFile, token } = acquireRunLock(runDir, runId, options);
  try {
    let authority = validateAuthorityRecord(recordPath, { ...options, expectedRunId: runId, runsDir });

    // Safe idempotence on already destroyed tombstone under lock
    if (authority.phase === 'DESTROYED') {
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
    }

    assertNoPendingOperation(authority, 'destroy');

    const { cliPath } = resolveSupabaseCli({ adapters });
    const homeDir = authority.home_dir;

    // Regular pre-destroy check: full tuple reconciliation & incarnation continuity
    reconcileNativeRegistry({ authority, adapters, cliPath });
    verifyIncarnationContinuity({ authority, adapters, cliPath });

    const knownProcSnapshot = snapshotRunProcesses(homeDir, authority.workdir, authority.instance_id);

    authority.pending_operation = 'destroy';
    authority.updated_at = new Date().toISOString();
    persistAuthorityAtomic(recordPath, authority);

    const cleanEnv = buildCleanChildEnv(homeDir);
    const res = cliExecutor(
      cliPath,
      ['stack', 'destroy', '--stack-id', authority.instance_id, '--workdir', authority.workdir, '--yes', '--output-format', 'json'],
      { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8', timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
    );
    if (res.status !== 0) {
      throw new Error(`DESTROY_FAIL: Destroy command failed with exit code ${res.status}. Retaining recovery state.`);
    }

    const parsed = parseStrictJson(res.stdout, 'stack destroy');
    if (parsed.destroyed !== true || parsed.id !== authority.instance_id) {
      throw new Error('DESTROY_FAIL: CLI destroy did not report destroyed=true for target ID. Retaining recovery state.');
    }

    // Postcheck 1: Target stack ID strictly absent from native registry
    const listRes = cliExecutor(
      cliPath,
      ['stack', 'list', '--workdir', authority.workdir, '--output-format', 'json'],
      { cwd: authority.workdir, env: cleanEnv, encoding: 'utf8', timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
    );
    if (listRes.status !== 0) {
      throw new Error(`DESTROY_POSTCHECK_FAIL: Registry check failed after destroy with code ${listRes.status}.`);
    }
    const listParsed = parseStrictJson(listRes.stdout, 'stack list (post-destroy)');
    if (!Array.isArray(listParsed.stacks)) {
      throw new Error('DESTROY_POSTCHECK_FAIL: Malformed stack list returned during destroy postcheck.');
    }
    const stillPresent = listParsed.stacks.find(s => s.id === authority.instance_id);
    if (stillPresent) {
      throw new Error(`DESTROY_POSTCHECK_FAIL: Stack ID ${authority.instance_id} still present in native registry.`);
    }

    // Postcheck 2: Native state & owner files strictly absent
    const filesAbsent = verifyNativeStateFilesAbsent(homeDir, authority.instance_id);
    if (filesAbsent !== 'ABSENT') {
      throw new Error(`DESTROY_POSTCHECK_FAIL: Native stack state or owner files check returned "${filesAbsent}".`);
    }

    // Postcheck 3: Processes quiescent
    const processesQuiescent = verifyProcessesQuiescent(knownProcSnapshot, homeDir, authority.workdir, authority.instance_id);
    if (!processesQuiescent) {
      throw new Error('DESTROY_POSTCHECK_FAIL: Native processes still active after destroy.');
    }

    // Postcheck 4: Sockets quiescent
    const socketsQuiescent = verifySocketsQuiescent([54321, 54322, 54324]);
    if (!socketsQuiescent) {
      throw new Error('DESTROY_POSTCHECK_FAIL: Native sockets still open after destroy.');
    }

    // Atomically persist DESTROYED tombstone receipt
    const tombstoneReceipt = {
      format_version: '1.0',
      task_id: TASK_ID,
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
      runtime: 'native',
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

/**
 * Dedicated public entry point for guarded data readiness probe.
 */
export async function probeDataReadiness(options = {}) {
  const { runId, runDir, recordPath, runsDir } = resolveRunContext(options, 'probeDataReadiness');
  const adapters = options.adapters || {};

  let authority = validateAuthorityRecord(recordPath, { ...options, expectedRunId: runId, runsDir });
  if (!authority.bound && authority.phase !== 'BOUND') {
    throw new Error(`DATA_READINESS_FAIL: Local binding is invalid (${authority.reason || 'not bound'})`);
  }

  const { lockFile, token } = acquireRunLock(runDir, runId, options);
  try {
    authority = validateAuthorityRecord(recordPath, { ...options, expectedRunId: runId, runsDir });

    assertNoPendingOperation(authority, 'data_readiness');

    const probeResults = await executeUnderLockDataAuthorization({
      runId,
      runsDir,
      authority,
      recordPath,
      runDir,
      adapters,
    });

    const out = projectFiniteOutput({
      command: 'data',
      stage: 'completed',
      status: 'READY',
      code: 'SUCCESS',
      run_id: runId,
      instance_id: authority.instance_id,
      phase: authority.phase,
      exit_code: 0,
    });
    return {
      ...out,
      readiness: probeResults,
      sql: probeResults.sql,
      auth: probeResults.auth,
      storage: probeResults.storage,
      mail: probeResults.mail,
    };
  } finally {
    releaseRunLock(runDir, token);
  }
}

// -----------------------------------------------------------------------------
// Production CLI Dispatcher Wrapper
// -----------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'status';

  let runId = null;
  let newRun = false;

  try {
    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--run' && args[i + 1]) {
        runId = args[i + 1];
      } else if (args[i] === '--runs-dir' || args[i].startsWith('--runs-dir=')) {
        const err = new Error('COMMAND_INVALID: Production CLI rejects custom --runs-dir namespace override.');
        err.code = 'COMMAND_INVALID';
        throw err;
      } else if (args[i] === '--new-run') {
        newRun = true;
      }
    }
    let result;
    if (cmd === 'start') {
      result = await startStack({ newRun, runId });
    } else if (cmd === 'status') {
      result = statusStack({ runId });
    } else if (cmd === 'stop') {
      result = stopStack({ runId });
    } else if (cmd === 'destroy') {
      result = destroyStack({ runId });
    } else if (cmd === 'data') {
      result = await probeDataReadiness({ runId });
    } else {
      throw new Error(`COMMAND_UNKNOWN: Unsupported command "${cmd}".`);
    }

    const projected = projectFiniteOutput(result);
    console.log(JSON.stringify(projected, null, 2));
    if (projected.exit_code !== 0) {
      process.exit(projected.exit_code);
    }
  } catch (err) {
    let code = err.code;
    if (!code) {
      if (err.message && err.message.startsWith('COMMAND_INVALID:')) code = 'COMMAND_INVALID';
      else if (err.message && err.message.startsWith('LOCKED:')) code = 'LOCKED';
      else if (err.message && err.message.startsWith('RECONCILE_FAIL:')) code = 'RECONCILE_FAIL';
      else if (err.message && err.message.startsWith('ALLOWLIST_FAIL:')) code = 'ALLOWLIST_FAIL';
      else if (err.message && err.message.includes('Recovery required')) code = 'RECOVERY_REQUIRED';
      else code = 'UNKNOWN_ERROR';
    }
    const errOut = projectFiniteOutput({
      command: cmd,
      stage: 'error',
      status: 'FAILED',
      code: code || 'UNKNOWN_ERROR',
      run_id: runId,
      exit_code: 1,
    });
    console.error(JSON.stringify(errOut, null, 2));
    process.exit(1);
  }
}

if (process.argv[1] && path.basename(process.argv[1]) === 'stack-manager.mjs') {
  main();
}
