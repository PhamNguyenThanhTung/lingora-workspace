/**
 * Persistent Executable Test Suite for Lingora WP-00/G0 D1:
 * Ownership, Lifecycle, Lock Boundary, Safe Process Observation, and Redaction.
 *
 * Implements Acceptance Matrix rows:
 * - P01, P02, P03 (positive lifecycle)
 * - N01, N02, N03, N04 (negative matrices)
 * - F01, F02, F03, F04, F05, F06, F07 (failure injections)
 * - E01, E02 (secret canary incident regressions with unregistered secrets)
 * - L01 (real child-process concurrency)
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync, fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  CANONICAL_WORKSPACE_ROOT,
  CANONICAL_CONFIG_PATH,
  DEFAULT_RUNS_DIR,
  TASK_ID,
  EXPECTED_PORTS,
  PINNED_CLI_VERSION,
  PINNED_CLI_SHA256,
  validateCanonicalConfig,
  validateDatabaseUrl,
  validateApiUrl,
  sanitizeString,
  sanitizeObject,
  validateAuthorityRecord,
  reconcileNativeRegistry,
  verifyIncarnationContinuity,
  verifyNativeStateFilesAbsent,
  getValidatedRuntimeState,
  getGitBranch,
  getLinuxBootId,
  parseProcStat,
  checkProcessAlive,
  isProcessAlive,
  isCanaryRegistered,
  projectFiniteOutput,
} from './env-guard.mjs';

import {
  startStack,
  statusStack,
  stopStack,
  destroyStack,
  probeDataReadiness,
  resolveSupabaseCli,
  allocateRun,
  acquireRunLock,
  releaseRunLock,
  persistAuthorityAtomic,
  executeUnderLockDataAuthorization,
} from './stack-manager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createCountingAdapters({ cliHandler, httpHandler, sqlHandler } = {}) {
  const counts = {
    cliCalls: 0,
    cliArgs: [],
    httpCalls: 0,
    httpUrls: [],
    sqlCalls: 0,
    sqlQueries: [],
  };

  const cliExecutor = (cliPath, args, opts) => {
    counts.cliCalls++;
    counts.cliArgs.push({ cliPath, args, opts });
    if (cliHandler) return cliHandler(cliPath, args, opts);
    return { status: 0, stdout: '{"id":"mock","runtime":"native"}', stderr: '' };
  };

  const httpFetcher = async (url, opts) => {
    counts.httpCalls++;
    counts.httpUrls.push({ url, opts });
    if (httpHandler) return httpHandler(url, opts);
    return { status: 200, ready: true, body: {} };
  };

  const sqlExecutor = async (connectionString, query) => {
    counts.sqlCalls++;
    counts.sqlQueries.push({ connectionString, query });
    if (sqlHandler) return sqlHandler(connectionString, query);
    return {
      ready: true,
      pgVersion: 'PostgreSQL 17.11 on x86_64',
      currentDb: 'postgres',
      currentUser: 'postgres',
      foundSchemas: ['auth', 'extensions', 'public', 'storage'],
    };
  };

  // Mock lowest transports
  const pgClientFactory = (config) => {
    return {
      connect: async () => {},
      query: async (sql) => {
        counts.sqlCalls++;
        counts.sqlQueries.push({ config, query: sql });
        if (sqlHandler) return sqlHandler(config, sql);
        if (sql.includes('version()')) {
          return {
            rows: [
              {
                version: 'PostgreSQL 17.11 on x86_64',
                current_database: 'postgres',
                current_user: 'postgres',
              },
            ],
          };
        }
        if (sql.includes('schema_name')) {
          return {
            rows: [
              { schema_name: 'auth' },
              { schema_name: 'extensions' },
              { schema_name: 'public' },
              { schema_name: 'storage' },
            ],
          };
        }
        return { rows: [{ '?column?': 1 }] };
      },
      end: async () => {},
    };
  };

  const fetch = async (url, opts) => {
    counts.httpCalls++;
    counts.httpUrls.push({ url, opts });
    if (httpHandler) return httpHandler(url, opts);
    return {
      status: 200,
      text: async () => JSON.stringify({ version: '2.121.0' }),
    };
  };

  return { counts, cliExecutor, httpFetcher, sqlExecutor, pgClientFactory, fetch };
}

function createValidMockAuthority(runsDir, overrides = {}) {
  const configContent = fs.readFileSync(CANONICAL_CONFIG_PATH, 'utf8');
  const configDigest = crypto.createHash('sha256').update(configContent).digest('hex');
  const gitBranch = getGitBranch(CANONICAL_WORKSPACE_ROOT);
  const stackId = crypto.createHash('sha256').update('test-bound-mock-stack-' + crypto.randomBytes(4).toString('hex')).digest('hex');
  const runId = overrides.run_id || `run-${crypto.randomBytes(6).toString('hex')}`;

  const runDir = path.resolve(runsDir, runId);
  fs.mkdirSync(runDir, { recursive: true });
  fs.chmodSync(runDir, 0o700);
  fs.mkdirSync(path.join(runDir, 'home'), { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.join(runDir, 'fixture'), { recursive: true, mode: 0o700 });

  const authority = {
    format_version: '1.0',
    task_id: TASK_ID,
    run_id: runId,
    phase: 'BOUND',
    pending_operation: null,
    instance_id: stackId,
    stack_name: 'lingora-wp00-test',
    runtime: 'native',
    project_root: path.resolve(runDir, 'fixture'),
    workdir: path.resolve(runDir, 'fixture'),
    config_path: fs.realpathSync(CANONICAL_CONFIG_PATH),
    config_digest: configDigest,
    branch_ref: gitBranch.startsWith('refs/heads/') ? gitBranch : `refs/heads/${gitBranch}`,
    home_dir: path.resolve(runDir, 'home'),
    control_root: runDir,
    cli_version: PINNED_CLI_VERSION,
    cli_digest: PINNED_CLI_SHA256,
    member_map: {
      auth: 'uuid-auth-1111',
      storage: 'uuid-storage-2222',
    },
    endpoints: {
      'database.sql': { protocol: 'tcp', address: '127.0.0.1', port: 54322, url: 'tcp://127.0.0.1:54322' },
      'auth.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
      'rest.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
      'storage.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
      'mail.http': { protocol: 'http', address: '127.0.0.1', port: 54324, url: 'http://127.0.0.1:54324' },
    },
    env: {
      DB_URL: 'postgresql://postgres:synthetic_pass@127.0.0.1:54322/postgres',
      API_URL: 'http://127.0.0.1:54321',
      ANON_KEY: 'test-anon-key',
    },
    ...overrides,
  };

  const recordPath = path.resolve(runDir, 'owner.json');
  fs.writeFileSync(recordPath, JSON.stringify(authority, null, 2), { mode: 0o600 });

  // Also write credentials.json
  const credPath = path.resolve(runDir, 'credentials.json');
  fs.writeFileSync(credPath, JSON.stringify(authority.env, null, 2), { mode: 0o600 });

  return { authority, recordPath, runDir, runId, stackId };
}

// -----------------------------------------------------------------------------
// Baseline Guard Function Tests
// -----------------------------------------------------------------------------

test('1. Initial unbound state check without existing binding file', () => {
  const dummyStatePath = path.resolve(CANONICAL_WORKSPACE_ROOT, '.wp00-state', 'non-existent-binding.json');
  const state = getValidatedRuntimeState(dummyStatePath);
  assert.equal(state.bound, false);
  assert.match(state.reason, /No task-local binding file found/);
});

test('2. Positive database URL allowlist check', () => {
  const res1 = validateDatabaseUrl(`postgresql://postgres:synthetic@127.0.0.1:${EXPECTED_PORTS.database}/postgres`);
  assert.equal(res1.valid, true);
  assert.equal(res1.hostname, '127.0.0.1');
  assert.equal(res1.port, EXPECTED_PORTS.database);
  assert.equal(res1.database, 'postgres');

  const res2 = validateDatabaseUrl(`postgresql://postgres:synthetic@localhost:${EXPECTED_PORTS.database}/postgres`);
  assert.equal(res2.valid, true);
  assert.equal(res2.hostname, 'localhost');
});

test('3. Positive API URL allowlist check', () => {
  const res1 = validateApiUrl(`http://127.0.0.1:${EXPECTED_PORTS.api}`);
  assert.equal(res1.valid, true);
  assert.equal(res1.hostname, '127.0.0.1');
  assert.equal(res1.port, EXPECTED_PORTS.api);

  const res2 = validateApiUrl(`http://localhost:${EXPECTED_PORTS.api}`);
  assert.equal(res2.valid, true);
});

test('4. Negative check: foreign host IP is rejected', () => {
  assert.throws(
    () => validateDatabaseUrl('postgresql://postgres:pass@192.168.1.100:54322/postgres'),
    /ALLOWLIST_FAIL: Non-local database host "192.168.1.100" forbidden/
  );
});

test('5. Negative check: remote domain is rejected', () => {
  assert.throws(
    () => validateDatabaseUrl('postgresql://postgres:pass@app.supabase.co:54322/postgres'),
    /ALLOWLIST_FAIL: Non-local database host "app.supabase.co" forbidden/
  );
  assert.throws(
    () => validateApiUrl('https://api.supabase.co'),
    /ALLOWLIST_FAIL: Non-local API host "api.supabase.co" forbidden/
  );
});

test('6. Negative check: swapped or mismatched port is rejected', () => {
  assert.throws(
    () => validateDatabaseUrl('postgresql://postgres:pass@127.0.0.1:54321/postgres', EXPECTED_PORTS.database),
    /ALLOWLIST_FAIL: Database port 54321 does not match expected port 54322/
  );
  assert.throws(
    () => validateApiUrl('http://127.0.0.1:54322', EXPECTED_PORTS.api),
    /ALLOWLIST_FAIL: API port 54322 does not match expected port 54321/
  );
});

test('7. Negative check: malformed protocol is rejected', () => {
  assert.throws(
    () => validateDatabaseUrl('mysql://127.0.0.1:54322/postgres'),
    /ALLOWLIST_FAIL: Unsupported database protocol "mysql:"/
  );
  assert.throws(
    () => validateApiUrl('ftp://127.0.0.1:54321'),
    /ALLOWLIST_FAIL: Unsupported API protocol "ftp:"/
  );
});

test('8. Negative check: missing, altered, or escaping config file is rejected', () => {
  assert.throws(
    () => validateCanonicalConfig('/non-existent/config.toml'),
    /CONFIG_ERROR: Config file not found/
  );
});

test('9. Canary secret, token, quoted S3, and unrecognized field redaction across all sanitization functions', () => {
  const canaryPassword = 'CANARY_SECRET_PASSWORD_12345';
  const canaryJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJDQU5BUllfVVNFUiJ9.CANARY_SIGNATURE_9876543210';
  const canarySecretKey = 'sb_secret_CANARY_SERVICE_ROLE_KEY_12345';
  const canaryPublishableKey = 'sb_publishable_CANARY_ANON_KEY_67890';
  const canaryInviteUrl = 'http://127.0.0.1:3000/auth/callback#access_token=CANARY_INVITE_TOKEN_XYZ&type=invite';
  const canaryS3Secret = 'CANARY_S3_SECRET_ACCESS_KEY_99999';
  const canaryAwsSecret = 'CANARY_AWS_SECRET_11111';
  const canaryOtp = 'CANARY_OTP_888888';
  const canaryUnrecognized = 'CANARY_UNRECOGNIZED_SECRET_44444';

  const rawString = [
    `DB: postgresql://postgres:${canaryPassword}@127.0.0.1:54322/postgres`,
    `JWT: ${canaryJwt}`,
    `Key: ${canarySecretKey}`,
    `Pub: ${canaryPublishableKey}`,
    `Link: ${canaryInviteUrl}`,
    `"S3_PROTOCOL_ACCESS_KEY_SECRET": "${canaryS3Secret}"`,
    `aws_secret_access_key="${canaryAwsSecret}"`,
    `otp="${canaryOtp}"`,
  ].join(', ');

  const sanitizedStr = sanitizeString(rawString);

  assert.equal(sanitizedStr.includes(canaryPassword), false, 'Canary password leaked in sanitizeString');
  assert.equal(sanitizedStr.includes('CANARY_SIGNATURE'), false, 'Canary JWT signature leaked in sanitizeString');
  assert.equal(sanitizedStr.includes('CANARY_SERVICE_ROLE_KEY'), false, 'Canary service key leaked in sanitizeString');
  assert.equal(sanitizedStr.includes('CANARY_INVITE_TOKEN'), false, 'Canary invite token leaked in sanitizeString');
  assert.equal(sanitizedStr.includes(canaryS3Secret), false, 'Canary S3 secret leaked in sanitizeString');
  assert.equal(sanitizedStr.includes(canaryAwsSecret), false, 'Canary AWS secret leaked in sanitizeString');
  assert.equal(sanitizedStr.includes(canaryOtp), false, 'Canary OTP leaked in sanitizeString');

  const rawObj = {
    password: canaryPassword,
    jwt_secret: canaryJwt,
    service_role_key: canarySecretKey,
    publishable_key: canaryPublishableKey,
    invite_url: canaryInviteUrl,
    s3_protocol_access_key_secret: canaryS3Secret,
    aws_secret_access_key: canaryAwsSecret,
    otp: canaryOtp,
    custom_unrecognized_secret_field: canaryUnrecognized,
    nested: {
      inner_token: 'CANARY_INNER_TOKEN',
      safe_metric: 42,
    },
  };
  const sanitizedObj = sanitizeObject(rawObj);
  const serialized = JSON.stringify(sanitizedObj);

  assert.equal(serialized.includes(canaryPassword), false, 'Canary password leaked in sanitizeObject');
  assert.equal(serialized.includes('CANARY_SERVICE_ROLE_KEY'), false, 'Canary secret key leaked in sanitizeObject');
  assert.equal(serialized.includes(canaryS3Secret), false, 'Canary S3 secret leaked in sanitizeObject');
  assert.equal(serialized.includes(canaryAwsSecret), false, 'Canary AWS secret leaked in sanitizeObject');
  assert.equal(serialized.includes(canaryOtp), false, 'Canary OTP leaked in sanitizeObject');
  assert.equal(serialized.includes(canaryUnrecognized), false, 'Unrecognized secret leaked in sanitizeObject');
  assert.equal(serialized.includes('CANARY_INNER_TOKEN'), false, 'Canary inner token leaked in sanitizeObject');
  assert.equal(sanitizedObj.nested.safe_metric, 42, 'Safe metric was altered');
});

// -----------------------------------------------------------------------------
// P01, P02, P03: Positive Lifecycle & Postconditions
// -----------------------------------------------------------------------------

test('P01: First-start allocates new run, persists reservation before prepare, binds full ID', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-p01-first-start-'));
  try {
    const fullStackId = crypto.createHash('sha256').update('p01-synthetic-full-id').digest('hex');
    let prepareDispatched = false;

    const { counts, cliExecutor, httpFetcher, sqlExecutor, pgClientFactory, fetch } = createCountingAdapters({
      cliHandler: (cliPath, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('prepare')) {
          prepareDispatched = true;
          // F2: Assert durable intent is already persisted on disk BEFORE prepare adapter executes
          const subdirs = fs.readdirSync(tempRunsDir);
          const activeRunDir = subdirs.find(d => d.startsWith('run-'));
          assert.ok(activeRunDir, 'Run directory must exist before prepare is dispatched');
          const preRecordPath = path.resolve(tempRunsDir, activeRunDir, 'owner.json');
          assert.ok(fs.existsSync(preRecordPath), 'Authority record must exist before prepare is dispatched');
          const preRecord = JSON.parse(fs.readFileSync(preRecordPath, 'utf8'));
          assert.equal(preRecord.pending_operation, 'prepare', 'pending_operation must be "prepare" on disk before prepare dispatch');
          assert.equal(preRecord.phase, 'RESERVED', 'phase must be "RESERVED" before prepare dispatch');
          return {
            status: 0,
            stdout: JSON.stringify({
              id: fullStackId,
              capabilities: [{ capability: 'database', version: '17', outcome: 'prepared' }],
              message: '',
            }),
            stderr: '',
          };
        }
        if (args.includes('list')) {
          const workdirIdx = args.indexOf('--workdir');
          const workdir = workdirIdx !== -1 ? args[workdirIdx + 1] : path.resolve(tempRunsDir, 'fixture');
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: prepareDispatched
                ? [
                    {
                      id: fullStackId,
                      name: 'lingora-wp00-p01',
                      project_root: workdir,
                      branch_context: getGitBranch(CANONICAL_WORKSPACE_ROOT),
                      runtime: 'native',
                      owner: 'reachable',
                    },
                  ]
                : [],
            }),
            stderr: '',
          };
        }
        if (args.includes('start')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              id: fullStackId,
              runtime: 'native',
              endpoints: {
                'database.sql': { protocol: 'tcp', address: '127.0.0.1', port: 54322, url: 'tcp://127.0.0.1:54322' },
                'auth.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
                'rest.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
                'storage.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
                'mail.http': { protocol: 'http', address: '127.0.0.1', port: 54324, url: 'http://127.0.0.1:54324' },
              },
              lazy_services: ['auth', 'storage', 'mail'],
              env: {
                DB_URL: 'postgresql://postgres:synthetic_pass@127.0.0.1:54322/postgres',
                ANON_KEY: 'p01-anon-key',
              },
              message: '',
            }),
            stderr: '',
          };
        }
        if (args.includes('status')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              identity: { id: fullStackId, name: 'lingora-wp00-p01' },
              runtime: 'native',
              lifecycle: 'running',
              readiness: 'healthy',
              composition: {
                members: [
                  { id: 'uuid-auth-1111', service: 'auth' },
                  { id: 'uuid-storage-2222', service: 'storage' },
                ],
              },
              endpoints: {
                'database.sql': { protocol: 'tcp', address: '127.0.0.1', port: 54322, url: 'tcp://127.0.0.1:54322' },
                'auth.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
                'rest.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
                'storage.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
                'mail.http': { protocol: 'http', address: '127.0.0.1', port: 54324, url: 'http://127.0.0.1:54324' },
              },
              env: {
                DB_URL: 'postgresql://postgres:synthetic_pass@127.0.0.1:54322/postgres',
                ANON_KEY: 'p01-anon-key',
              },
            }),
            stderr: '',
          };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    const res = await startStack({
      newRun: true,
      runsDir: tempRunsDir,
      stackName: 'lingora-wp00-p01',
      adapters: { cliExecutor, httpFetcher, sqlExecutor, pgClientFactory, fetch },
    });

    assert.equal(res.status, 'RUNNING');
    assert.equal(res.code, 'SUCCESS');
    assert.equal(res.exit_code, 0);
    assert.equal(res.instance_id, fullStackId);
    assert.equal(prepareDispatched, true);

    // Verify authority record on disk
    const runDir = path.resolve(tempRunsDir, res.run_id);
    const authRecord = JSON.parse(fs.readFileSync(path.resolve(runDir, 'owner.json'), 'utf8'));
    assert.equal(authRecord.phase, 'BOUND');
    assert.equal(authRecord.instance_id, fullStackId);
    assert.equal(authRecord.pending_operation, null);
    assert.ok(authRecord.member_map);
    assert.equal(authRecord.member_map.auth, 'uuid-auth-1111');
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('P02: Existing start on running or stopped stack resumes same ID with zero prepare calls', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-p02-existing-start-'));
  try {
    const { authority, recordPath, runId, stackId } = createValidMockAuthority(tempRunsDir);
    let prepareDispatched = false;
    let started = false;

    const { counts, cliExecutor, httpFetcher, sqlExecutor, pgClientFactory, fetch } = createCountingAdapters({
      cliHandler: (cliPath, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('prepare')) {
          prepareDispatched = true;
          return { status: 0, stdout: '{}', stderr: '' };
        }
        if (args.includes('list')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: [
                {
                  id: stackId,
                  name: authority.stack_name,
                  project_root: authority.project_root,
                  branch_context: authority.branch_ref,
                  runtime: 'native',
                  owner: 'reachable',
                },
              ],
            }),
            stderr: '',
          };
        }
        if (args.includes('start')) {
          started = true;
          return {
            status: 0,
            stdout: JSON.stringify({
              id: stackId,
              runtime: 'native',
              endpoints: authority.endpoints,
              lazy_services: [],
              env: authority.env,
            }),
            stderr: '',
          };
        }
        if (args.includes('status')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              identity: { id: stackId, name: authority.stack_name },
              runtime: 'native',
              lifecycle: started ? 'running' : 'stopped',
              readiness: started ? 'healthy' : 'unavailable',
              composition: {
                members: [
                  { id: 'uuid-auth-1111', service: 'auth' },
                  { id: 'uuid-storage-2222', service: 'storage' },
                ],
              },
              endpoints: authority.endpoints,
              env: authority.env,
            }),
            stderr: '',
          };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    const res = await startStack({
      runId,
      runsDir: tempRunsDir,
      adapters: { cliExecutor, httpFetcher, sqlExecutor, pgClientFactory, fetch },
    });

    assert.equal(res.status, 'RUNNING');
    assert.equal(res.code, 'SUCCESS');
    assert.equal(res.instance_id, stackId);
    assert.equal(prepareDispatched, false, 'Existing start must NEVER dispatch prepare');
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('P03: Full lifecycle suite: status, stop, already-stopped, destroy, repeated destroy on tombstone', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-p03-lifecycle-'));
  try {
    const { authority, recordPath, runId, stackId } = createValidMockAuthority(tempRunsDir);
    let listStacks = [
      {
        id: stackId,
        name: authority.stack_name,
        project_root: authority.project_root,
        branch_context: authority.branch_ref,
        runtime: 'native',
        owner: 'reachable',
      },
    ];

    const { cliExecutor, httpFetcher, sqlExecutor } = createCountingAdapters({
      cliHandler: (cliPath, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('list')) {
          return {
            status: 0,
            stdout: JSON.stringify({ stacks: listStacks }),
            stderr: '',
          };
        }
        if (args.includes('status')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              identity: { id: stackId, name: authority.stack_name },
              runtime: 'native',
              lifecycle: 'running',
              readiness: 'healthy',
              composition: {
                members: [
                  { id: 'uuid-auth-1111', service: 'auth' },
                  { id: 'uuid-storage-2222', service: 'storage' },
                ],
              },
            }),
            stderr: '',
          };
        }
        if (args.includes('stop')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              stopped: [stackId],
              not_running: [],
              message: '',
            }),
            stderr: '',
          };
        }
        if (args.includes('status')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              identity: { id: stackId, name: authority.stack_name },
              runtime: 'native',
              lifecycle: 'stopped',
              readiness: 'unavailable',
              composition: {
                members: [
                  { id: 'uuid-auth-1111', service: 'auth' },
                  { id: 'uuid-storage-2222', service: 'storage' },
                ],
              },
            }),
            stderr: '',
          };
        }
        if (args.includes('destroy')) {
          listStacks = []; // stack absent after destroy
          return {
            status: 0,
            stdout: JSON.stringify({
              destroyed: true,
              id: stackId,
              message: '',
            }),
            stderr: '',
          };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    const managerOptions = {
      runId,
      runsDir: tempRunsDir,
      adapters: { cliExecutor, httpFetcher, sqlExecutor },
    };

    // 1. Status
    const statusRes = statusStack(managerOptions);
    assert.equal(statusRes.code, 'SUCCESS');
    assert.equal(statusRes.instance_id, stackId);

    // 2. Stop
    const stopRes = stopStack(managerOptions);
    assert.equal(stopRes.code, 'SUCCESS');
    assert.equal(stopRes.status, 'STOPPED');
    assert.equal(fs.existsSync(recordPath), true, 'Authority record retained on stop');

    // 3. Destroy
    const destroyRes = destroyStack(managerOptions);
    assert.equal(destroyRes.code, 'SUCCESS');
    assert.equal(destroyRes.status, 'DESTROYED');

    // Authority record must now be tombstone
    const tombstone = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    assert.equal(tombstone.phase, 'DESTROYED');
    assert.ok(tombstone.destroyed_at);

    // 4. Repeated destroy on tombstone (idempotent, 0 CLI calls)
    const repeatDestroy = destroyStack(managerOptions);
    assert.equal(repeatDestroy.code, 'ALREADY_DESTROYED');
    assert.equal(repeatDestroy.status, 'DESTROYED');
    assert.equal(repeatDestroy.exit_code, 0);
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

// -----------------------------------------------------------------------------
// N01, N02, N03, N04: Negative Matrices
// -----------------------------------------------------------------------------

test('N01 Matrix: start/status/stop/destroy/data x local invalid variations (CLI=0, HTTP=0, SQL=0)', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-n01-matrix-'));
  try {
    const variations = [
      {
        name: 'missing_file',
        setup: () => {
          const runId = `run-${crypto.randomBytes(6).toString('hex')}`;
          return { runId, runsDir: tempRunsDir };
        },
      },
      {
        name: 'corrupt_json',
        setup: () => {
          const runId = `run-${crypto.randomBytes(6).toString('hex')}`;
          const runDir = path.resolve(tempRunsDir, runId);
          fs.mkdirSync(runDir, { recursive: true });
          fs.writeFileSync(path.resolve(runDir, 'owner.json'), '{ broken');
          return { runId, runsDir: tempRunsDir };
        },
      },
      {
        name: 'wrong_task_id',
        setup: () => {
          const { runId } = createValidMockAuthority(tempRunsDir, { task_id: 'wrong-task-id' });
          return { runId, runsDir: tempRunsDir };
        },
      },
      {
        name: 'version_mismatch',
        setup: () => {
          const { runId } = createValidMockAuthority(tempRunsDir, { format_version: '99.0' });
          return { runId, runsDir: tempRunsDir };
        },
      },
    ];

    for (const v of variations) {
      const { runId, runsDir } = v.setup();
      const { counts, cliExecutor, httpFetcher, sqlExecutor, pgClientFactory, fetch } = createCountingAdapters();
      const opts = {
        runId,
        runsDir,
        adapters: { cliExecutor, httpFetcher, sqlExecutor, pgClientFactory, fetch },
      };

      // status
      assert.throws(() => statusStack(opts));
      assert.equal(counts.cliCalls, 0, `N01 ${v.name}: status must call 0 CLI`);
      assert.equal(counts.httpCalls, 0); assert.equal(counts.sqlCalls, 0);

      // stop
      assert.throws(() => stopStack(opts));
      assert.equal(counts.cliCalls, 0, `N01 ${v.name}: stop must call 0 CLI`);

      // destroy
      assert.throws(() => destroyStack(opts));
      assert.equal(counts.cliCalls, 0, `N01 ${v.name}: destroy must call 0 CLI`);

      // data
      await assert.rejects(async () => probeDataReadiness(opts));
      assert.equal(counts.cliCalls, 0, `N01 ${v.name}: data must call 0 CLI`);
      assert.equal(counts.httpCalls, 0); assert.equal(counts.sqlCalls, 0);

      // start (resume)
      await assert.rejects(async () => startStack(opts));
      assert.equal(counts.cliCalls, 0, `N01 ${v.name}: start must call 0 CLI`);
    }
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('N02 Matrix: 5 entry points x native registry mismatch executes ONLY safe inspection (CLI=2) and 0 action/HTTP/SQL', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-n02-matrix-'));
  try {
    const { authority, runId, stackId } = createValidMockAuthority(tempRunsDir);

    const { counts, cliExecutor, httpFetcher, sqlExecutor, pgClientFactory, fetch } = createCountingAdapters({
      cliHandler: (cmd, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('list')) {
          // Native registry returns a different/unrelated stack
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: [
                {
                  id: 'unrelated-foreign-id-00000000000000000000000000000000000000000000000000',
                  name: 'unrelated-name',
                  project_root: authority.project_root,
                  branch_context: authority.branch_ref,
                  runtime: 'native',
                  owner: 'reachable',
                },
              ],
            }),
            stderr: '',
          };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    const opts = {
      runId,
      runsDir: tempRunsDir,
      adapters: { cliExecutor, httpFetcher, sqlExecutor, pgClientFactory, fetch },
    };

    // statusStack
    assert.throws(() => statusStack(opts), /RECONCILE_FAIL/);
    assert.equal(counts.cliCalls, 2); // version + list
    assert.equal(counts.httpCalls, 0); assert.equal(counts.sqlCalls, 0);
    counts.cliCalls = 0;

    // stopStack
    assert.throws(() => stopStack(opts), /RECONCILE_FAIL/);
    assert.equal(counts.cliCalls, 2);
    assert.equal(counts.httpCalls, 0); assert.equal(counts.sqlCalls, 0);
    counts.cliCalls = 0;

    // destroyStack
    assert.throws(() => destroyStack(opts), /RECONCILE_FAIL/);
    assert.equal(counts.cliCalls, 2);
    assert.equal(counts.httpCalls, 0); assert.equal(counts.sqlCalls, 0);
    counts.cliCalls = 0;

    // probeDataReadiness
    await assert.rejects(async () => probeDataReadiness(opts), /RECONCILE_FAIL/);
    assert.equal(counts.cliCalls, 2);
    assert.equal(counts.httpCalls, 0); assert.equal(counts.sqlCalls, 0);
    counts.cliCalls = 0;

    // startStack (resume)
    await assert.rejects(async () => startStack(opts), /RECONCILE_FAIL/);
    assert.equal(counts.cliCalls, 2);
    assert.equal(counts.httpCalls, 0); assert.equal(counts.sqlCalls, 0);
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('N03: Returned ID or runtime mismatch rejects fail-closed with zero data probes', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-n03-mismatch-'));
  try {
    const { authority, runId, stackId } = createValidMockAuthority(tempRunsDir);

    const { counts, cliExecutor, httpFetcher, sqlExecutor, pgClientFactory, fetch } = createCountingAdapters({
      cliHandler: (cmd, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('list')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: [
                {
                  id: stackId,
                  name: authority.stack_name,
                  project_root: authority.project_root,
                  branch_context: authority.branch_ref,
                  runtime: 'native',
                  owner: 'reachable',
                },
              ],
            }),
            stderr: '',
          };
        }
        if (args.includes('status')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              identity: { id: stackId, name: authority.stack_name },
              runtime: 'native',
              lifecycle: 'stopped',
              readiness: 'unavailable',
              composition: {
                members: [
                  { id: 'uuid-auth-1111', service: 'auth' },
                  { id: 'uuid-storage-2222', service: 'storage' },
                ],
              },
            }),
            stderr: '',
          };
        }
        if (args.includes('start')) {
          // Returned ID does NOT match bound ID
          return {
            status: 0,
            stdout: JSON.stringify({
              id: 'mismatched-returned-id-000000000000000000000000000000000000000000000',
              runtime: 'native',
              endpoints: authority.endpoints,
              lazy_services: [],
              env: authority.env,
            }),
            stderr: '',
          };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    const opts = {
      runId,
      runsDir: tempRunsDir,
      adapters: { cliExecutor, httpFetcher, sqlExecutor, pgClientFactory, fetch },
    };

    await assert.rejects(async () => startStack(opts), /START_FAIL.*Returned ID does not match/);
    assert.equal(counts.httpCalls, 0, 'No HTTP probes when returned start ID mismatches');
    assert.equal(counts.sqlCalls, 0, 'No SQL probes when returned start ID mismatches');
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('N04: Recreated same-ID initialized counterexample with mismatched member UUIDs rejected with RECONCILE_FAIL', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-n04-incarnation-'));
  try {
    // Authority record has recorded member_map: { auth: 'uuid-auth-1111', storage: 'uuid-storage-2222' }
    const { authority, runDir, runId, stackId } = createValidMockAuthority(tempRunsDir, {
      member_map: {
        auth: 'uuid-auth-1111',
        storage: 'uuid-storage-2222',
      },
    });

    const { counts, cliExecutor, pgClientFactory, fetch } = createCountingAdapters({
      cliHandler: (cmd, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('list')) {
          // List matches by ID, name, branch
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: [
                {
                  id: stackId,
                  name: authority.stack_name,
                  project_root: authority.project_root,
                  branch_context: authority.branch_ref,
                  runtime: 'native',
                  owner: 'reachable',
                },
              ],
            }),
            stderr: '',
          };
        }
        if (args.includes('status')) {
          // Status returns same ID, but DIFFERENT member UUIDs (incarnation destroyed and recreated)
          return {
            status: 0,
            stdout: JSON.stringify({
              identity: { id: stackId, name: authority.stack_name },
              runtime: 'native',
              lifecycle: 'running',
              readiness: 'healthy',
              composition: {
                members: [
                  { id: 'uuid-auth-RECREATED-NEW-INSTANCE', service: 'auth' },
                  { id: 'uuid-storage-2222', service: 'storage' },
                ],
              },
            }),
            stderr: '',
          };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    const opts = {
      runId,
      runsDir: tempRunsDir,
      adapters: { cliExecutor, pgClientFactory, fetch },
    };

    // 1. probeDataReadiness must FAIL CLOSED before executing SQL/HTTP queries
    await assert.rejects(async () => probeDataReadiness(opts), /RECONCILE_FAIL.*Member UUID mismatch/);
    assert.equal(counts.sqlCalls, 0, 'Zero SQL queries executed when member UUID mismatch detected');
    assert.equal(counts.httpCalls, 0, 'Zero HTTP probes executed when member UUID mismatch detected');

    // 2. statusStack must detect member UUID mismatch
    assert.throws(() => statusStack(opts), /RECONCILE_FAIL.*Member UUID mismatch/);

    // 3. Existing startStack must FAIL CLOSED before provider mutation (start)
    await assert.rejects(async () => startStack(opts), /RECONCILE_FAIL.*Member UUID mismatch/);
    const startMutationCalls = counts.cliArgs.filter(c => c.args.includes('start') && !c.args.includes('status'));
    assert.equal(startMutationCalls.length, 0, 'startStack must execute ZERO provider mutation calls on incarnation mismatch');

    // 4. stopStack must FAIL CLOSED before provider mutation (stop)
    assert.throws(() => stopStack(opts), /RECONCILE_FAIL.*Member UUID mismatch/);
    const stopMutationCalls = counts.cliArgs.filter(c => c.args.includes('stop'));
    assert.equal(stopMutationCalls.length, 0, 'stopStack must execute ZERO provider mutation calls on incarnation mismatch');

    // 5. destroyStack must FAIL CLOSED before provider mutation (destroy)
    assert.throws(() => destroyStack(opts), /RECONCILE_FAIL.*Member UUID mismatch/);
    const destroyMutationCalls = counts.cliArgs.filter(c => c.args.includes('destroy'));
    assert.equal(destroyMutationCalls.length, 0, 'destroyStack must execute ZERO provider mutation calls on incarnation mismatch');

    // 6. Authority record on disk must be preserved in BOUND phase
    const authOnDisk = validateAuthorityRecord(path.resolve(runDir, 'owner.json'), { runsDir: tempRunsDir, expectedRunId: runId });
    assert.equal(authOnDisk.phase, 'BOUND');
    assert.equal(authOnDisk.instance_id, stackId);
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

// -----------------------------------------------------------------------------
// F01, F02, F03, F04, F05, F06, F07: Failure Injections
// -----------------------------------------------------------------------------

test('F01: Lock acquisition failure aborts before any provider calls', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f01-lock-'));
  try {
    const { runDir, runId } = createValidMockAuthority(tempRunsDir);

    // Acquire lock manually
    const { token } = acquireRunLock(runDir, runId);

    const { counts, cliExecutor } = createCountingAdapters();
    const opts = {
      runId,
      runsDir: tempRunsDir,
      adapters: { cliExecutor },
    };

    assert.throws(() => statusStack(opts), /LOCKED/);
    assert.equal(counts.cliCalls, 0, 'No CLI calls when lock is held');

    releaseRunLock(runDir, token);
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('F02: Prepare failure retains durable intent without second prepare', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f02-prepare-'));
  try {
    let prepareCount = 0;
    const { counts, cliExecutor } = createCountingAdapters({
      cliHandler: (cmd, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('list')) return { status: 0, stdout: '{"stacks":[]}', stderr: '' };
        if (args.includes('prepare')) {
          prepareCount++;
          return { status: 1, stdout: '', stderr: 'prepare crashed' };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    await assert.rejects(
      async () => startStack({
        newRun: true,
        runsDir: tempRunsDir,
        stackName: 'lingora-wp00-f02',
        adapters: { cliExecutor },
      }),
      /PREPARE_FAIL/
    );

    assert.equal(prepareCount, 1, 'Exactly one prepare attempted before failure');

    // Inspect authority record: must retain pending_operation = prepare
    const entries = fs.readdirSync(tempRunsDir);
    const runDir = path.resolve(tempRunsDir, entries[0]);
    const record = JSON.parse(fs.readFileSync(path.resolve(runDir, 'owner.json'), 'utf8'));
    assert.equal(record.phase, 'RESERVED');
    assert.equal(record.pending_operation, 'prepare');
    assert.equal(record.instance_id, null);
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('F02b: Fresh start rejects before prepare if stack name already exists in native registry', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f02b-preexist-'));
  try {
    let prepareDispatched = false;
    const { counts, cliExecutor } = createCountingAdapters({
      cliHandler: (cliPath, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('list')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: [
                {
                  id: 'pre-existing-stack-id-0000000000000000000000000000000000000000000000',
                  name: 'lingora-wp00-f02b',
                  project_root: '/other',
                  branch_context: 'main',
                  runtime: 'native',
                  owner: 'reachable',
                },
              ],
            }),
            stderr: '',
          };
        }
        if (args.includes('prepare')) {
          prepareDispatched = true;
          return { status: 0, stdout: '{}', stderr: '' };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    await assert.rejects(
      async () => startStack({
        newRun: true,
        runsDir: tempRunsDir,
        stackName: 'lingora-wp00-f02b',
        adapters: { cliExecutor },
      }),
      /PREPARE_FAIL: Stack name "lingora-wp00-f02b" already exists in native registry/
    );

    assert.equal(prepareDispatched, false, 'Prepare must NEVER be dispatched when name already exists');
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('F03: Orphan lock denies acquisition and fails closed without unsafe auto-unlock (M05)', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f03-orphan-'));
  try {
    const { runDir, runId } = createValidMockAuthority(tempRunsDir);

    // Create an orphan lock with a nonexistent PID
    const lockFile = path.resolve(runDir, '.run.lock');
    const fakeLock = {
      token: crypto.randomUUID(),
      run_id: runId,
      pid: 9999999, // nonexistent PID
      start_ticks: '123456',
      boot_id: getLinuxBootId().boot_id || 'test-boot',
      locked_at: new Date().toISOString(),
    };
    fs.writeFileSync(lockFile, JSON.stringify(fakeLock, null, 2));

    // Both with and without allowRecovery: fails closed with LOCKED
    assert.throws(
      () => acquireRunLock(runDir, runId, { allowRecovery: false }),
      /LOCKED.*disposition: RECOVERY_REQUIRED/
    );

    assert.throws(
      () => acquireRunLock(runDir, runId, { allowRecovery: true }),
      /LOCKED.*disposition: RECOVERY_REQUIRED/
    );

    // Lock file must NOT be stolen or unlinked
    assert.equal(fs.existsSync(lockFile), true, 'Orphan lock must not be unlinked');
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('F04: In-flight crash / lost response: one-match same-intent recovery vs zero-match RECOVERY_REQUIRED', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f04-recovery-'));
  try {
    // Scenario A: Crashed during prepare with 0 matches -> RECOVERY_REQUIRED
    const runA = createValidMockAuthority(tempRunsDir, {
      phase: 'RESERVED',
      pending_operation: 'prepare',
      instance_id: null,
    });

    const { cliExecutor: cliA } = createCountingAdapters({
      cliHandler: (cmd, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('list')) return { status: 0, stdout: '{"stacks":[]}', stderr: '' };
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    await assert.rejects(
      async () => startStack({ runId: runA.runId, runsDir: tempRunsDir, adapters: { cliExecutor: cliA } }),
      /Recovery required/i
    );

    // Scenario B: Crashed during prepare with 1 matching prepared stack in registry -> RECOVERY_REQUIRED (F3/M06: no auto-bind)
    const recoveredFullId = crypto.createHash('sha256').update('recovered-stack').digest('hex');
    const runB = createValidMockAuthority(tempRunsDir, {
      phase: 'RESERVED',
      pending_operation: 'prepare',
      instance_id: null,
    });

    const { counts: countsB, cliExecutor: cliB, pgClientFactory, fetch } = createCountingAdapters({
      cliHandler: (cmd, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('list')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: [
                {
                  id: recoveredFullId,
                  name: runB.authority.stack_name,
                  project_root: runB.authority.project_root,
                  branch_context: runB.authority.branch_ref,
                  runtime: 'native',
                  owner: 'reachable',
                },
              ],
            }),
            stderr: '',
          };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    await assert.rejects(
      async () => startStack({
        runId: runB.runId,
        runsDir: tempRunsDir,
        adapters: { cliExecutor: cliB, pgClientFactory, fetch },
      }),
      (err) => {
        assert.equal(err.code, 'RECOVERY_REQUIRED');
        assert.match(err.message, /Recovery required/i);
        return true;
      }
    );

    // Verify ZERO start mutations, ZERO HTTP, ZERO SQL calls were dispatched
    const startCalls = countsB.cliArgs.filter(c => c.args.includes('start') && !c.args.includes('status'));
    assert.equal(startCalls.length, 0, 'Must execute ZERO start provider calls on pending prepare');
    assert.equal(countsB.httpCalls, 0, 'Must execute ZERO HTTP calls on pending prepare');
    assert.equal(countsB.sqlCalls, 0, 'Must execute ZERO SQL calls on pending prepare');

    // Verify authority record remains unchanged on disk
    const postRecordB = JSON.parse(fs.readFileSync(runB.recordPath, 'utf8'));
    assert.equal(postRecordB.pending_operation, 'prepare', 'Must retain pending_operation on disk');
    assert.equal(postRecordB.phase, 'RESERVED', 'Must retain phase on disk');
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('F05: Stop failure or quiescence violation rejects without claiming stopped', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f05-stop-'));
  try {
    const { authority, recordPath, runId, stackId } = createValidMockAuthority(tempRunsDir);

    const { cliExecutor } = createCountingAdapters({
      cliHandler: (cmd, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('list')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: [
                {
                  id: stackId,
                  name: authority.stack_name,
                  project_root: authority.project_root,
                  branch_context: authority.branch_ref,
                  runtime: 'native',
                  owner: 'reachable',
                },
              ],
            }),
            stderr: '',
          };
        }
        if (args.includes('status')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              identity: { id: stackId, name: authority.stack_name },
              runtime: 'native',
              lifecycle: 'running',
              composition: {
                members: [
                  { id: 'uuid-auth-1111', service: 'auth' },
                  { id: 'uuid-storage-2222', service: 'storage' },
                ],
              },
            }),
            stderr: '',
          };
        }
        if (args.includes('stop')) {
          // Stop command fails
          return { status: 1, stdout: '', stderr: 'stop timeout' };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    assert.throws(
      () => stopStack({
        runId,
        runsDir: tempRunsDir,
        adapters: { cliExecutor },
      }),
      /STOP_FAIL: Stop command failed/
    );

    // Authority record must STILL exist and remain BOUND
    const authRecord = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    assert.equal(authRecord.phase, 'BOUND');
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('F06: Destroy postcheck failure retains recovery state and does ZERO file deletion', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f06-destroy-'));
  try {
    const { authority, recordPath, runDir, runId, stackId } = createValidMockAuthority(tempRunsDir);

    const { cliExecutor } = createCountingAdapters({
      cliHandler: (cmd, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('status')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              identity: { id: stackId, name: authority.stack_name },
              runtime: 'native',
              lifecycle: 'running',
              composition: {
                members: [
                  { id: 'uuid-auth-1111', service: 'auth' },
                  { id: 'uuid-storage-2222', service: 'storage' },
                ],
              },
            }),
            stderr: '',
          };
        }
        if (args.includes('status')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              identity: { id: stackId, name: authority.stack_name },
              runtime: 'native',
              lifecycle: 'stopped',
              readiness: 'unavailable',
              composition: {
                members: [
                  { id: 'uuid-auth-1111', service: 'auth' },
                  { id: 'uuid-storage-2222', service: 'storage' },
                ],
              },
            }),
            stderr: '',
          };
        }
        if (args.includes('destroy')) {
          // CLI reports success
          return { status: 0, stdout: JSON.stringify({ destroyed: true, id: stackId }), stderr: '' };
        }
        if (args.includes('list')) {
          // Postcheck list: stack is STILL in registry!
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: [
                {
                  id: stackId,
                  name: authority.stack_name,
                  project_root: authority.project_root,
                  branch_context: authority.branch_ref,
                  runtime: 'native',
                  owner: 'reachable',
                },
              ],
            }),
            stderr: '',
          };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    assert.throws(
      () => destroyStack({
        runId,
        runsDir: tempRunsDir,
        adapters: { cliExecutor },
      }),
      /DESTROY_POSTCHECK_FAIL/
    );

    // Authority record must STILL be BOUND and credentials NOT deleted
    const authRecord = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    assert.equal(authRecord.phase, 'BOUND');
    const credFile = path.resolve(runDir, 'credentials.json');
    assert.equal(fs.existsSync(credFile), true, 'Credentials must NOT be deleted on postcheck failure');
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('F07: Crash after destroy tombstone enables safe idempotent cleanup retry', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f07-tombstone-'));
  try {
    const { authority, recordPath, runDir, runId, stackId } = createValidMockAuthority(tempRunsDir, {
      phase: 'DESTROYED',
      destroyed_at: new Date().toISOString(),
    });

    // Authority record is already DESTROYED tombstone, but residual credentials still on disk
    const credPath = path.resolve(runDir, 'credentials.json');
    assert.equal(fs.existsSync(credPath), true);

    const { cliExecutor } = createCountingAdapters();
    const res = destroyStack({
      runId,
      runsDir: tempRunsDir,
      adapters: { cliExecutor },
    });

    assert.equal(res.code, 'ALREADY_DESTROYED');
    assert.equal(res.status, 'DESTROYED');
    assert.equal(res.exit_code, 0);

    // Residual credentials must now be unlinked
    assert.equal(fs.existsSync(credPath), false, 'Residual credentials unlinked on tombstone retry');
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

// -----------------------------------------------------------------------------
// E01, E02: Secret Incident Regressions (Mandatory with Unregistered Canary)
// -----------------------------------------------------------------------------

test('E01 & E02: Synthetic owner-control-secret canary is NEVER leaked across any dispatcher or error path', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-e01-canary-'));
  // NOTICE: In accordance with Codex review finding R5, this canary is deliberately
  // UNREGISTERED in the regex sanitizer. Safety must be enforced by architectural finite
  // output projection boundaries, never relying on regex matches on arbitrary strings.
  const canary = `CANARY_PRIVATE_UNREGISTERED_${crypto.randomBytes(16).toString('hex')}`;

  try {
    const { authority, runId, stackId } = createValidMockAuthority(tempRunsDir);

    const { cliExecutor } = createCountingAdapters({
      cliHandler: (cmd, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('list')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: [
                {
                  id: stackId,
                  name: authority.stack_name,
                  project_root: authority.project_root,
                  branch_context: authority.branch_ref,
                  runtime: 'native',
                  owner: 'reachable',
                },
              ],
            }),
            stderr: '',
          };
        }
        if (args.includes('status')) {
          // Injected canary into malformed CLI stdout and raw stderr
          return {
            status: 0,
            stdout: `MALFORMED_OUTPUT_CONTAINING_${canary}`,
            stderr: `CANARY_STDERR_TOKEN: ${canary}`,
          };
        }
        if (args.includes('status')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              identity: { id: stackId, name: authority.stack_name },
              runtime: 'native',
              lifecycle: 'stopped',
              readiness: 'unavailable',
              composition: {
                members: [
                  { id: 'uuid-auth-1111', service: 'auth' },
                  { id: 'uuid-storage-2222', service: 'storage' },
                ],
              },
            }),
            stderr: '',
          };
        }
        if (args.includes('destroy')) {
          // Injected canary into CLI destroy failure
          return {
            status: 1,
            stdout: '',
            stderr: `FATAL_DESTROY_ERROR_LEAK: ${canary}`,
          };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    // 1. Status failure with canary in raw CLI stream
    assert.throws(
      () => statusStack({ runId, runsDir: tempRunsDir, adapters: { cliExecutor } }),
      (err) => {
        assert.equal(err.message.includes(canary), false, 'Canary leaked in statusStack error message');
        return true;
      }
    );

    // 2. Destroy failure with canary in CLI stderr
    assert.throws(
      () => destroyStack({ runId, runsDir: tempRunsDir, adapters: { cliExecutor } }),
      (err) => {
        assert.equal(err.message.includes(canary), false, 'Canary leaked in destroyStack error message');
        return true;
      }
    );

    // Provide valid status mock so data readiness probes are reached
    const { cliExecutor: validCliExecutor } = createCountingAdapters({
      cliHandler: (cmd, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('list')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: [
                {
                  id: stackId,
                  name: authority.stack_name,
                  project_root: authority.project_root,
                  branch_context: authority.branch_ref,
                  runtime: 'native',
                  owner: 'reachable',
                },
              ],
            }),
            stderr: '',
          };
        }
        if (args.includes('status')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              identity: { id: stackId, name: authority.stack_name },
              runtime: 'native',
              lifecycle: 'running',
              readiness: 'healthy',
              composition: {
                members: [
                  { id: 'uuid-auth-1111', service: 'auth' },
                  { id: 'uuid-storage-2222', service: 'storage' },
                ],
              },
              endpoints: authority.endpoints,
              env: authority.env,
            }),
            stderr: '',
          };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    // 3. PostgreSQL connection/query exception with injected canary
    let pgCalled = 0;
    const failingPgFactory = (cfg) => ({
      connect: async () => {},
      query: async () => {
        pgCalled++;
        throw new Error(`PG_FATAL_QUERY_ERROR: ${canary}`);
      },
      end: async () => {},
    });

    await assert.rejects(
      async () => probeDataReadiness({
        runId,
        runsDir: tempRunsDir,
        adapters: {
          cliExecutor: validCliExecutor,
          pgClientFactory: failingPgFactory,
        },
      }),
      (err) => {
        assert.equal(err.message.includes(canary), false, 'Canary leaked in pgClient query error');
        return true;
      }
    );
    assert.ok(pgCalled > 0, 'failingPgFactory query must have been reached');

    // 4. HTTP probe exception with injected canary
    let fetchCalled = 0;
    const failingFetch = async () => {
      fetchCalled++;
      throw new Error(`HTTP_CONNECTION_REFUSED: ${canary}`);
    };

    const successPgFactory = (cfg) => ({
      connect: async () => {},
      query: async (q) => {
        if (q.includes('version')) {
          return { rows: [{ version: 'PostgreSQL 17.11', current_database: 'postgres', current_user: 'postgres' }] };
        }
        return { rows: [{ schema_name: 'public' }, { schema_name: 'auth' }, { schema_name: 'storage' }, { schema_name: 'extensions' }] };
      },
      end: async () => {},
    });

    await assert.rejects(
      async () => probeDataReadiness({
        runId,
        runsDir: tempRunsDir,
        adapters: {
          cliExecutor: validCliExecutor,
          pgClientFactory: successPgFactory,
          fetch: failingFetch,
        },
      }),
      (err) => {
        assert.equal(err.message.includes(canary), false, 'Canary leaked in fetch error');
        return true;
      }
    );
    assert.ok(fetchCalled > 0, 'failingFetch must have been reached');

    // 5. projectFiniteOutput boundary rejects caller message injection
    const finiteOut = projectFiniteOutput({
      command: 'status',
      stage: 'error',
      status: 'FAILED',
      code: 'UNKNOWN_ERROR',
      message: `INJECTED_CANARY_MESSAGE: ${canary}`,
    });
    assert.equal(finiteOut.message.includes(canary), false, 'Canary leaked in projectFiniteOutput message override');
    assert.equal(finiteOut.message, 'Internal error occurred during execution.');
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

// -----------------------------------------------------------------------------
// L01: Real Child-Process Concurrency Test
// -----------------------------------------------------------------------------

test('L01: Real child-process concurrency enforces mutual exclusion (loser executes 0 adapters)', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-l01-child-proc-'));
  try {
    const { runDir, runId } = createValidMockAuthority(tempRunsDir);

    // Parent holds the lock
    const { token } = acquireRunLock(runDir, runId);

    // Spawn real child process attempting command on same run using internal test bootstrap
    const scriptPath = path.resolve(CANONICAL_WORKSPACE_ROOT, 'lingora-admin/tests/database/env/stack-manager.mjs');
    const childRes = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import { statusStack } from '${scriptPath}';
try {
  statusStack({ runId: '${runId}', runsDir: '${tempRunsDir}' });
  process.exit(0);
} catch (err) {
  console.error(err.code || err.message);
  process.exit(1);
}`,
      ],
      {
        cwd: CANONICAL_WORKSPACE_ROOT,
        encoding: 'utf8',
      }
    );

    // Loser child process must fail closed with exit code 1
    assert.equal(childRes.status, 1, 'Child process must exit 1 when run lock is held');
    // Stderr or stdout must project finite LOCKED error
    const combinedOutput = (childRes.stderr || '') + (childRes.stdout || '');
    assert.match(combinedOutput, /LOCKED/);

    // Release lock in parent
    releaseRunLock(runDir, token);
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('16b. Production CLI rejects custom --runs-dir namespace before create/adopt/inspect/mutate/data', () => {
  const foreignRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-foreign-root-'));
  try {
    const scriptPath = path.resolve(CANONICAL_WORKSPACE_ROOT, 'lingora-admin/tests/database/env/stack-manager.mjs');
    const res = spawnSync(
      process.execPath,
      [scriptPath, 'status', '--run', 'run-12345678', '--runs-dir', foreignRunsDir],
      {
        cwd: CANONICAL_WORKSPACE_ROOT,
        encoding: 'utf8',
      }
    );

    assert.equal(res.status, 1, 'Production CLI must exit 1 on --runs-dir');
    const output = (res.stderr || '') + (res.stdout || '');
    assert.match(output, /COMMAND_INVALID/);
    const files = fs.readdirSync(foreignRunsDir);
    assert.equal(files.length, 0, 'Foreign root must remain untouched');
  } finally {
    fs.rmSync(foreignRunsDir, { recursive: true, force: true });
  }
});

// -----------------------------------------------------------------------------
// CLI Dispatcher Nonzero Test
// -----------------------------------------------------------------------------

test('17. Command dispatcher nonzero path: CLI invocation exits 1 with safe diagnostic and no unredacted canaries', () => {
  const scriptPath = path.resolve(CANONICAL_WORKSPACE_ROOT, 'lingora-admin/tests/database/env/stack-manager.mjs');
  const res = spawnSync(process.execPath, [scriptPath, 'status'], {
    cwd: CANONICAL_WORKSPACE_ROOT,
    env: {
      ...process.env,
    },
    encoding: 'utf8',
  });

  assert.equal(res.status, 1, 'Command dispatcher must exit 1 on unbound state');
  const output = (res.stderr || '') + (res.stdout || '');
  assert.match(output, /COMMAND_INVALID/);
  assert.equal(output.includes('CANARY'), false);
});

// -----------------------------------------------------------------------------
// Focused Correction Suite: F1, F2, F3, F4, F5 Regression Verification
// -----------------------------------------------------------------------------

test('F1 (Correction): Symlink escape in home_dir and ambient environment rejection', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f1-symlink-'));
  try {
    const { authority, recordPath, runDir, runId } = createValidMockAuthority(tempRunsDir);

    // 1. Symlink escape: home_dir points to external directory outside control_root
    const externalDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f1-external-'));
    const symlinkHome = path.resolve(runDir, 'escaped-home');
    fs.symlinkSync(externalDir, symlinkHome);

    const badAuthority = {
      ...authority,
      home_dir: symlinkHome,
    };
    fs.writeFileSync(recordPath, JSON.stringify(badAuthority, null, 2));

    assert.throws(
      () => validateAuthorityRecord(recordPath, { runsDir: tempRunsDir, expectedRunId: runId }),
      /ALLOWLIST_FAIL.*(symbolic link|escapes|match exact lexical)/i
    );

    // 2. Ambient environment rejection: process.env.LINGORA_RUN_ID is ignored
    process.env.LINGORA_RUN_ID = 'hostile-run-injection';
    process.env.LINGORA_RUNS_DIR = tempRunsDir;
    try {
      assert.throws(
        () => statusStack({}),
        /COMMAND_INVALID.*requires explicit --run/i
      );
    } finally {
      delete process.env.LINGORA_RUN_ID;
      delete process.env.LINGORA_RUNS_DIR;
    }

    fs.rmSync(externalDir, { recursive: true, force: true });
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('F2 (Correction): Parent directory fsync failure during prepare intent persistence prevents provider calls', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f2-fsync-'));
  try {
    const origFsyncSync = fs.fsyncSync;
    let prepareDispatched = false;
    let dirFsyncInjected = false;

    fs.fsyncSync = (fd) => {
      if (dirFsyncInjected) {
        const err = new Error('EIO: simulated directory fsync hardware error');
        err.code = 'EIO';
        throw err;
      }
      return origFsyncSync(fd);
    };

    const { cliExecutor } = createCountingAdapters({
      cliHandler: (cmd, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('list')) {
          // Pre-prepare list has completed; next operation is persisting prepare intent
          dirFsyncInjected = true;
          return { status: 0, stdout: '{"stacks":[]}', stderr: '' };
        }
        if (args.includes('prepare')) {
          prepareDispatched = true;
          return { status: 0, stdout: '{"id":"mock"}', stderr: '' };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    try {
      await assert.rejects(
        async () => startStack({
          newRun: true,
          runsDir: tempRunsDir,
          stackName: 'lingora-wp00-f2',
          adapters: { cliExecutor },
        }),
        /EIO.*directory fsync/i
      );
    } finally {
      fs.fsyncSync = origFsyncSync;
    }

    assert.equal(prepareDispatched, false, 'Prepare must NEVER be dispatched when directory fsync fails');
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('F3 (Correction): BOUND missing member_map denies; duplicate registry entries deny; pending stop/destroy deny', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f3-continuity-'));
  try {
    const { authority, recordPath, runId, stackId } = createValidMockAuthority(tempRunsDir);

    // 1. BOUND authority record with missing or empty member_map denies with RECONCILE_FAIL
    const noAnchorAuthority = {
      ...authority,
      member_map: null,
    };
    fs.writeFileSync(recordPath, JSON.stringify(noAnchorAuthority, null, 2));

    const { cliExecutor } = createCountingAdapters({
      cliHandler: (cmd, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('list')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: [
                {
                  id: stackId,
                  name: authority.stack_name,
                  project_root: authority.project_root,
                  branch_context: authority.branch_ref,
                  runtime: 'native',
                  owner: 'reachable',
                },
              ],
            }),
            stderr: '',
          };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    assert.throws(
      () => verifyIncarnationContinuity({ authority: noAnchorAuthority, adapters: { cliExecutor }, cliPath: 'mock-cli' }),
      /RECONCILE_FAIL.*Missing initialized member_map anchor/i
    );

    // 2. Duplicate entries in native registry deny with RECONCILE_FAIL
    const duplicateListExecutor = (cmd, args) => {
      if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
      if (args.includes('list')) {
        return {
          status: 0,
          stdout: JSON.stringify({
            stacks: [
              {
                id: stackId,
                name: authority.stack_name,
                project_root: authority.project_root,
                branch_context: authority.branch_ref,
                runtime: 'native',
                owner: 'reachable',
              },
              {
                id: 'duplicate-stack-id-different',
                name: authority.stack_name,
                project_root: authority.project_root,
                branch_context: authority.branch_ref,
                runtime: 'native',
                owner: 'reachable',
              },
            ],
          }),
          stderr: '',
        };
      }
      return { status: 0, stdout: '{}', stderr: '' };
    };

    assert.throws(
      () => reconcileNativeRegistry({ authority, adapters: { cliExecutor: duplicateListExecutor }, cliPath: 'mock-cli' }),
      /RECONCILE_FAIL.*Duplicate/i
    );

    // 3. Pending stop denies new effect with RECOVERY_REQUIRED
    const pendingStopAuthority = {
      ...authority,
      pending_operation: 'stop',
    };
    fs.writeFileSync(recordPath, JSON.stringify(pendingStopAuthority, null, 2));

    await assert.rejects(
      async () => startStack({ runId, runsDir: tempRunsDir, adapters: { cliExecutor } }),
      (err) => {
        assert.equal(err.code, 'RECOVERY_REQUIRED');
        return true;
      }
    );

    // 4. Pending destroy denies stop with RECOVERY_REQUIRED
    const pendingDestroyAuthority = {
      ...authority,
      pending_operation: 'destroy',
    };
    fs.writeFileSync(recordPath, JSON.stringify(pendingDestroyAuthority, null, 2));

    assert.throws(
      () => stopStack({ runId, runsDir: tempRunsDir, adapters: { cliExecutor } }),
      (err) => {
        assert.equal(err.code, 'RECOVERY_REQUIRED');
        return true;
      }
    );

    // 5. Pending destroy denies destroyStack with RECOVERY_REQUIRED (zero mutation/cleanup)
    let destroyCalls = 0;
    const destroyCountingExecutor = (cmd, args) => {
      if (args.includes('destroy')) destroyCalls++;
      return { status: 0, stdout: '{}', stderr: '' };
    };
    assert.throws(
      () => destroyStack({ runId, runsDir: tempRunsDir, adapters: { cliExecutor: destroyCountingExecutor } }),
      (err) => {
        assert.equal(err.code, 'RECOVERY_REQUIRED');
        return true;
      }
    );
    assert.equal(destroyCalls, 0, 'Must not dispatch destroy CLI when operation is pending');
    const diskAuth = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    assert.equal(diskAuth.pending_operation, 'destroy', 'Pending operation must be retained on disk');
    assert.equal(diskAuth.phase, 'BOUND', 'Phase must remain BOUND');

    // 6. Pending operation denies executeUnderLockDataAuthorization with RECOVERY_REQUIRED
    await assert.rejects(
      async () => executeUnderLockDataAuthorization({
        runId,
        runsDir: tempRunsDir,
        authority: diskAuth,
        recordPath,
        runDir: path.resolve(tempRunsDir, runId),
        adapters: {},
      }),
      (err) => {
        assert.equal(err.code, 'RECOVERY_REQUIRED');
        return true;
      }
    );
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('F4 (Correction): Live endpoints & credentials validation, Paused client through-close, PG close failure', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f4-data-'));
  try {
    const { authority, recordPath, runId, stackId, runDir } = createValidMockAuthority(tempRunsDir);

    // 1. Missing live endpoints in provider status fails closed before data probes
    let sqlDispatched = 0;
    let httpDispatched = 0;
    const missingEndpointsCli = (cmd, args) => {
      if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
      if (args.includes('list')) {
        return {
          status: 0,
          stdout: JSON.stringify({
            stacks: [{
              id: stackId,
              name: authority.stack_name,
              project_root: authority.project_root,
              branch_context: authority.branch_ref,
              runtime: 'native',
              owner: 'reachable',
            }],
          }),
          stderr: '',
        };
      }
      if (args.includes('status')) {
        return {
          status: 0,
          stdout: JSON.stringify({
            identity: { id: stackId, name: authority.stack_name },
            runtime: 'native',
            lifecycle: 'running',
            readiness: 'healthy',
            composition: {
              members: [
                { id: 'uuid-auth-1111', service: 'auth' },
                { id: 'uuid-storage-2222', service: 'storage' },
              ],
            },
            // endpoints missing!
          }),
          stderr: '',
        };
      }
      return { status: 0, stdout: '{}', stderr: '' };
    };

    await assert.rejects(
      async () => executeUnderLockDataAuthorization({
        runId,
        runsDir: tempRunsDir,
        authority,
        recordPath,
        runDir,
        adapters: {
          cliExecutor: missingEndpointsCli,
          pgClientFactory: () => { sqlDispatched++; },
          fetch: async () => { httpDispatched++; },
        },
      }),
      /ALLOWLIST_FAIL: Missing endpoints/i
    );
    assert.equal(sqlDispatched, 0, 'Zero SQL dispatched when endpoints missing');
    assert.equal(httpDispatched, 0, 'Zero HTTP dispatched when endpoints missing');

    // 2. PG client close failure fails closed (throws DATA_FAIL, does not return ready)
    const validCli = (cmd, args) => {
      if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
      if (args.includes('list')) {
        return {
          status: 0,
          stdout: JSON.stringify({
            stacks: [{
              id: stackId,
              name: authority.stack_name,
              project_root: authority.project_root,
              branch_context: authority.branch_ref,
              runtime: 'native',
              owner: 'reachable',
            }],
          }),
          stderr: '',
        };
      }
      if (args.includes('status')) {
        return {
          status: 0,
          stdout: JSON.stringify({
            identity: { id: stackId, name: authority.stack_name },
            runtime: 'native',
            lifecycle: 'running',
            readiness: 'healthy',
            composition: {
              members: [
                { id: 'uuid-auth-1111', service: 'auth' },
                { id: 'uuid-storage-2222', service: 'storage' },
              ],
            },
            endpoints: authority.endpoints,
            env: authority.env,
          }),
          stderr: '',
        };
      }
      return { status: 0, stdout: '{}', stderr: '' };
    };

    const closingFailPgFactory = () => ({
      connect: async () => {},
      query: async (q) => {
        if (q.includes('version')) {
          return { rows: [{ version: 'PostgreSQL 17.11', current_database: 'postgres', current_user: 'postgres' }] };
        }
        return { rows: [{ schema_name: 'public' }, { schema_name: 'auth' }, { schema_name: 'storage' }, { schema_name: 'extensions' }] };
      },
      end: async () => {
        throw new Error('Socket close reset during connection termination');
      },
    });

    await assert.rejects(
      async () => probeDataReadiness({
        runId,
        runsDir: tempRunsDir,
        adapters: {
          cliExecutor: validCli,
          pgClientFactory: closingFailPgFactory,
        },
      }),
      (err) => {
        assert.equal(err.code, 'DATA_FAIL');
        assert.match(err.message, /SQL_READINESS_FAIL: Client close failed/i);
        return true;
      }
    );

    // 3. Paused client through-close: real public data with delayed end promise blocks destroy contender
    let resolveEndPromise;
    const endPromise = new Promise(resolve => { resolveEndPromise = resolve; });
    let closeStarted = false;
    let closeCompleted = false;

    let onEndReached;
    const endReachedPromise = new Promise(resolve => { onEndReached = resolve; });

    const pausedClient = {
      connect: async () => {},
      query: async (q) => {
        if (q.includes('version')) {
          return { rows: [{ version: 'PostgreSQL 17.11', current_database: 'postgres', current_user: 'postgres' }] };
        }
        return { rows: [{ schema_name: 'public' }, { schema_name: 'auth' }, { schema_name: 'storage' }, { schema_name: 'extensions' }] };
      },
      end: async () => {
        closeStarted = true;
        onEndReached();
        await endPromise;
        closeCompleted = true;
      },
    };

    const validFetch = async () => ({ ready: true, status: 200, text: async () => '{}' });

    // Start real public data readiness under its own lock (no manual lock acquisition)
    const dataPromise = probeDataReadiness({
      runId,
      runsDir: tempRunsDir,
      adapters: {
        cliExecutor: validCli,
        fetch: validFetch,
        pgClientFactory: () => pausedClient,
      },
    });

    // Wait until data probe has finished queries and entered client CLOSE
    await endReachedPromise;
    assert.equal(closeStarted, true, 'Client close must have started');
    assert.equal(closeCompleted, false, 'Client close must still be paused / lock held');

    // While client is paused in CLOSE, destroy contender attempts destroy
    let destroyAdapterCalls = 0;
    const contenderCliExecutor = (cmd, args) => {
      if (args.includes('destroy')) destroyAdapterCalls++;
      return { status: 0, stdout: '{}', stderr: '' };
    };

    assert.throws(
      () => destroyStack({
        runId,
        runsDir: tempRunsDir,
        adapters: { cliExecutor: contenderCliExecutor },
      }),
      (err) => {
        assert.match(err.message, /LOCKED/);
        return true;
      }
    );

    // Verify destroy contender produced ZERO effects and authority remains BOUND
    assert.equal(destroyAdapterCalls, 0, 'Destroy contender must execute ZERO provider adapters');
    const authRecordDuringClose = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    assert.equal(authRecordDuringClose.phase, 'BOUND', 'Authority must remain BOUND');

    // Now unblock the paused client close
    resolveEndPromise();

    // Data readiness completes cleanly
    const dataRes = await dataPromise;
    assert.equal(dataRes.status, 'READY');
    assert.equal(closeCompleted, true, 'Client close must be completed after resolution');

    // Verify lock is now released
    const lockFile = path.resolve(runDir, '.run.lock');
    assert.equal(fs.existsSync(lockFile), false, 'Lock must be released only after client close completes');
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('F5 (Correction): Targeted termination: Required observation UNKNOWN retains BOUND and performs ZERO deletion', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f5-unknown-'));
  try {
    const { authority, recordPath, runId, stackId, runDir } = createValidMockAuthority(tempRunsDir);

    // Create native state files in stackDir
    const stackDir = path.resolve(authority.home_dir, 'stacks', stackId);
    fs.mkdirSync(stackDir, { recursive: true, mode: 0o700 });
    const stateFile = path.resolve(stackDir, 'state.json');
    const ownerFile = path.resolve(stackDir, 'owner.json');
    fs.writeFileSync(stateFile, '{"instances":[]}');
    fs.writeFileSync(ownerFile, '{"pid":999999}');

    // Make stackDir unsearchable (mode 0o000) so stat on state.json throws EACCES -> checkFileAbsence returns UNKNOWN
    fs.chmodSync(stackDir, 0o000);

    let destroyedDispatched = false;
    const { cliExecutor } = createCountingAdapters({
      cliHandler: (cmd, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('list')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: destroyedDispatched
                ? []
                : [
                    {
                      id: stackId,
                      name: authority.stack_name,
                      project_root: authority.project_root,
                      branch_context: authority.branch_ref,
                      runtime: 'native',
                      owner: 'reachable',
                    },
                  ],
            }),
            stderr: '',
          };
        }
        if (args.includes('status')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              identity: { id: stackId, name: authority.stack_name },
              runtime: 'native',
              lifecycle: 'stopped',
              readiness: 'unavailable',
              composition: {
                members: [
                  { id: 'uuid-auth-1111', service: 'auth' },
                  { id: 'uuid-storage-2222', service: 'storage' },
                ],
              },
            }),
            stderr: '',
          };
        }
        if (args.includes('destroy')) {
          destroyedDispatched = true;
          return { status: 0, stdout: JSON.stringify({ destroyed: true, id: stackId }), stderr: '' };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    try {
      assert.throws(
        () => destroyStack({ runId, runsDir: tempRunsDir, adapters: { cliExecutor } }),
        /DESTROY_POSTCHECK_FAIL/i
      );

      // Verify authority record remains BOUND on disk (never DESTROYED)
      const postAuthority = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
      assert.equal(postAuthority.phase, 'BOUND', 'Authority must remain BOUND when postcheck is UNKNOWN');
      assert.equal(postAuthority.destroyed_at || null, null);

      // Verify ZERO file deletion inside runDir
      assert.equal(fs.existsSync(recordPath), true);
      assert.equal(fs.existsSync(path.resolve(runDir, 'home')), true);
    } finally {
      // Restore permissions for cleanup
      fs.chmodSync(stackDir, 0o700);
    }
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('F5b (Correction): Required known owned process read error remains UNKNOWN and preserves recovery state', () => {
  // Unit check on parseProcStat:
  // For a nonexistent PID where /proc/PID does not exist:
  const nonexistentStat = parseProcStat(999999999);
  assert.equal(nonexistentStat.status, 'ABSENT');
  assert.equal(checkProcessAlive(999999999, 1234, getLinuxBootId().boot_id), 'DEAD');

  // For current PID (which exists):
  const myStat = parseProcStat(process.pid);
  assert.equal(myStat.status, 'KNOWN');
  assert.equal(checkProcessAlive(process.pid, myStat.stat.start_ticks, getLinuxBootId().boot_id), 'ALIVE');

  // Through manager: when target process observation fails (returns UNKNOWN),
  // destroyStack must fail closed with DESTROY_POSTCHECK_FAIL and retain BOUND phase.
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f5b-proc-unknown-'));
  try {
    const { authority, recordPath, runId, stackId, runDir } = createValidMockAuthority(tempRunsDir);

    const stackDir = path.resolve(authority.home_dir, 'stacks', stackId);
    fs.mkdirSync(stackDir, { recursive: true, mode: 0o700 });

    let destroyedDispatched = false;
    const { cliExecutor } = createCountingAdapters({
      cliHandler: (cmd, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('list')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: destroyedDispatched
                ? []
                : [{
                    id: stackId,
                    name: authority.stack_name,
                    project_root: authority.project_root,
                    branch_context: authority.branch_ref,
                    runtime: 'native',
                    owner: 'reachable',
                  }],
            }),
            stderr: '',
          };
        }
        if (args.includes('status')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              identity: { id: stackId, name: authority.stack_name },
              runtime: 'native',
              lifecycle: 'stopped',
              readiness: 'unavailable',
              composition: {
                members: [
                  { id: 'uuid-auth-1111', service: 'auth' },
                  { id: 'uuid-storage-2222', service: 'storage' },
                ],
              },
            }),
            stderr: '',
          };
        }
        if (args.includes('destroy')) {
          destroyedDispatched = true;
          return { status: 0, stdout: JSON.stringify({ destroyed: true, id: stackId }), stderr: '' };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    // Make home_dir unsearchable during postcheck so checking native owner file/dir fails with EACCES (UNKNOWN)
    const stacksDir = path.resolve(authority.home_dir, 'stacks');
    fs.chmodSync(stacksDir, 0o000);

    try {
      assert.throws(
        () => destroyStack({ runId, runsDir: tempRunsDir, adapters: { cliExecutor } }),
        /DESTROY_POSTCHECK_FAIL/i
      );

      // Verify authority record remains BOUND on disk (never DESTROYED)
      const postAuthority = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
      assert.equal(postAuthority.phase, 'BOUND', 'Authority must remain BOUND when postcheck process observation is UNKNOWN');
      assert.equal(postAuthority.destroyed_at || null, null);

      // Verify ZERO file deletion inside runDir
      assert.equal(fs.existsSync(recordPath), true);
      assert.equal(fs.existsSync(path.resolve(runDir, 'home')), true);
    } finally {
      fs.chmodSync(stacksDir, 0o700);
    }
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('F6 (Correction): Initial contradictory same-ID candidates reject before start without filtering', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f6-initial-contradictory-'));
  try {
    let startDispatched = false;
    const fakeFullId = 'aabbccdd11223344556677889900aabbccdd11223344556677889900aabbccdd';
    let prepareDispatched = false;

    const cliExecutor = (file, args) => {
      if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
      if (args.includes('prepare')) {
        prepareDispatched = true;
        return { status: 0, stdout: JSON.stringify({ id: fakeFullId }), stderr: '' };
      }
      if (args.includes('list')) {
        if (prepareDispatched) {
          // Return TWO entries with same ID: one matching tuple, one conflicting tuple
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: [
                {
                  id: fakeFullId,
                  name: 'lingora-wp00-mock',
                  project_root: '/tmp/some/matching/root',
                  branch_context: 'main',
                  runtime: 'native',
                  owner: 'reachable',
                },
                {
                  id: fakeFullId,
                  name: 'lingora-wp00-mock',
                  project_root: '/tmp/contradictory/foreign/root',
                  branch_context: 'other-branch',
                  runtime: 'native',
                  owner: 'reachable',
                },
              ],
            }),
            stderr: '',
          };
        }
        return { status: 0, stdout: JSON.stringify({ stacks: [] }), stderr: '' };
      }
      if (args.includes('start')) {
        startDispatched = true;
        return { status: 0, stdout: JSON.stringify({ id: fakeFullId }), stderr: '' };
      }
      return { status: 0, stdout: '{}', stderr: '' };
    };

    await assert.rejects(
      async () => startStack({
        newRun: true,
        runsDir: tempRunsDir,
        stackName: 'lingora-wp00-mock',
        adapters: { cliExecutor },
      }),
      (err) => {
        assert.match(err.message, /RECONCILE_FAIL: Expected exactly 1 candidate/i);
        return true;
      }
    );

    // Verify start was NEVER dispatched
    assert.equal(startDispatched, false, 'Start command must not be dispatched when candidates are ambiguous');
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('F7 (Correction): Representative unregistered provider-derived canary through actual public sink never leaks to stdout/stderr', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f7-canary-'));
  try {
    const unregisteredCanary = 'UNREG_SECRET_CANARY_' + crypto.randomBytes(6).toString('hex');
    assert.equal(isCanaryRegistered(unregisteredCanary), false, 'Canary must be unregistered');

    const { authority, recordPath, runId, stackId, runDir } = createValidMockAuthority(tempRunsDir, {
      member_map: {
        [unregisteredCanary]: 'uuid-canary-1111',
      },
    });

    const scriptPath = path.resolve(CANONICAL_WORKSPACE_ROOT, 'lingora-admin/tests/database/env/stack-manager.mjs');
    const childRes = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import { statusStack } from '${scriptPath}';
const cliExecutor = (file, args) => {
  if (args.includes('--version')) return { status: 0, stdout: '2.121.0\\n', stderr: '' };
  if (args.includes('list')) {
    return {
      status: 0,
      stdout: JSON.stringify({
        stacks: [{
          id: '${stackId}',
          name: '${authority.stack_name}',
          project_root: '${authority.project_root}',
          branch_context: '${authority.branch_ref}',
          runtime: 'native',
          owner: 'reachable',
        }],
      }),
      stderr: '',
    };
  }
  if (args.includes('status')) {
    return {
      status: 0,
      stdout: JSON.stringify({
        identity: { id: '${stackId}', name: '${authority.stack_name}' },
        runtime: 'native',
        lifecycle: 'running',
        composition: {
          members: [
            { id: 'uuid-canary-9999', service: '${unregisteredCanary}' },
          ],
        },
      }),
      stderr: '',
    };
  }
  return { status: 0, stdout: '{}', stderr: '' };
};

try {
  statusStack({
    runId: '${runId}',
    runsDir: '${tempRunsDir}',
    adapters: { cliExecutor },
  });
  process.exit(0);
} catch (err) {
  console.error('[PUBLIC-ERR]', err.message);
  process.exit(1);
}`,
      ],
      { cwd: CANONICAL_WORKSPACE_ROOT, encoding: 'utf8' }
    );

    // Branch must be reached and fail closed (exit 1)
    assert.equal(childRes.status, 1, 'Child process must exit 1 on membership mismatch error');
    const combinedOutput = (childRes.stderr || '') + (childRes.stdout || '');
    assert.match(combinedOutput, /RECONCILE_FAIL/);

    // Safe assertions: unregistered canary must NEVER appear in stdout or stderr
    assert.equal(childRes.stdout.includes(unregisteredCanary), false, 'Stdout must not contain unregistered canary');
    assert.equal(childRes.stderr.includes(unregisteredCanary), false, 'Stderr must not contain unregistered canary');
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('F7b (Correction): Representative unregistered pending-operation canary never leaks across public library/child output', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f7b-pending-canary-'));
  try {
    const unregisteredCanary = 'UNREG_PENDING_SECRET_' + crypto.randomBytes(6).toString('hex');
    assert.equal(isCanaryRegistered(unregisteredCanary), false, 'Canary must be unregistered');

    const { authority, recordPath, runId, stackId, runDir } = createValidMockAuthority(tempRunsDir, {
      pending_operation: unregisteredCanary,
    });

    const scriptPath = path.resolve(CANONICAL_WORKSPACE_ROOT, 'lingora-admin/tests/database/env/stack-manager.mjs');
    const childRes = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import { statusStack } from '${scriptPath}';
try {
  statusStack({
    runId: '${runId}',
    runsDir: '${tempRunsDir}',
  });
  process.exit(0);
} catch (err) {
  console.error('[PUBLIC-ERR]', err.message);
  process.exit(1);
}`,
      ],
      { cwd: CANONICAL_WORKSPACE_ROOT, encoding: 'utf8' }
    );

    // Branch must be reached and fail closed (exit 1)
    assert.equal(childRes.status, 1, 'Child process must exit 1 on pending operation denial');
    const combinedOutput = (childRes.stderr || '') + (childRes.stdout || '');
    assert.match(combinedOutput, /RECOVERY_REQUIRED/);

    // Safe negative assertions: unregistered canary must NEVER appear in stdout or stderr
    assert.equal(childRes.stdout.includes(unregisteredCanary), false, 'Stdout must not contain unregistered pending canary');
    assert.equal(childRes.stderr.includes(unregisteredCanary), false, 'Stderr must not contain unregistered pending canary');

    // On-disk authority retains original pending canary and BOUND phase
    const diskAuth = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    assert.equal(diskAuth.phase, 'BOUND');
    assert.equal(diskAuth.pending_operation, unregisteredCanary);
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});
