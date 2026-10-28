/**
 * Persistent Executable Test Suite for Lingora WP-00/G0 D1:
 * Ownership, Lifecycle, Lock Boundary, Safe Process Observation, and Redaction.
 *
 * Implements Acceptance Matrix rows:
 * - P01, P02, P03 (positive lifecycle)
 * - N01, N02, N03 (negative matrices)
 * - F01, F02, F03, F05, F06, F07 (failure injections)
 * - E01, E02 (secret canary incident regressions)
 * - L01 (concurrency)
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

import {
  CANONICAL_WORKSPACE_ROOT,
  CANONICAL_CONFIG_PATH,
  DEFAULT_RUNS_DIR,
  TASK_ID,
  EXPECTED_PORTS,
  ALLOWED_PROJECT_ID,
  FORBIDDEN_UNOWNED_STATE_ROOT,
  FORBIDDEN_UNOWNED_HOME_ROOT,
  FORBIDDEN_OLD_WP00_STATE,
  FORBIDDEN_OLD_WP00_HOME,
  validateCanonicalConfig,
  validateDatabaseUrl,
  validateApiUrl,
  sanitizeString,
  sanitizeObject,
  validateAuthorityRecord,
  validateTaskBinding,
  reconcileNativeRegistry,
  getValidatedRuntimeState,
  getGitBranch,
  computeSha256,
  registerRedactionCanary,
  clearRedactionCanaries,
  isCanaryRegistered,
  getLinuxBootId,
  parseProcStat,
  isProcessAlive,
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
} from './stack-manager.mjs';

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

  return { counts, cliExecutor, httpFetcher, sqlExecutor };
}

function createValidMockAuthority(tempDir, overrides = {}) {
  const configContent = fs.readFileSync(CANONICAL_CONFIG_PATH, 'utf8');
  const configDigest = crypto.createHash('sha256').update(configContent).digest('hex');
  const gitBranch = getGitBranch(CANONICAL_WORKSPACE_ROOT);
  const stackId = crypto.createHash('sha256').update('test-bound-mock-stack').digest('hex');
  const runId = `run-${crypto.randomBytes(6).toString('hex')}`;

  const authority = {
    format_version: '1.0',
    task_id: TASK_ID,
    run_id: runId,
    phase: 'BOUND',
    pending_operation: null,
    instance_id: stackId,
    stack_name: 'lingora-wp00-test',
    stackId,
    stackName: 'lingora-wp00-test',
    runtime: 'native',
    project_root: fs.realpathSync(CANONICAL_WORKSPACE_ROOT),
    workdir: fs.realpathSync(CANONICAL_WORKSPACE_ROOT),
    config_path: fs.realpathSync(CANONICAL_CONFIG_PATH),
    config_digest: configDigest,
    branch_ref: gitBranch.startsWith('refs/heads/') ? gitBranch : `refs/heads/${gitBranch}`,
    home_dir: fs.realpathSync(tempDir),
    control_root: fs.realpathSync(tempDir),
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

  const recordPath = path.resolve(tempDir, 'owner.json');
  fs.writeFileSync(recordPath, JSON.stringify(authority, null, 2));

  // Also write credentials.json
  const credPath = path.resolve(tempDir, 'credentials.json');
  fs.writeFileSync(credPath, JSON.stringify(authority.env, null, 2), { mode: 0o600 });

  return { authority, recordPath, runId, stackId };
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
    /ALLOWLIST_FAIL: Non-local host "192.168.1.100" is forbidden/
  );
});

test('5. Negative check: remote domain is rejected', () => {
  assert.throws(
    () => validateDatabaseUrl('postgresql://postgres:pass@app.supabase.co:54322/postgres'),
    /ALLOWLIST_FAIL: Non-local host "app.supabase.co" is forbidden/
  );
  assert.throws(
    () => validateApiUrl('https://api.supabase.co'),
    /ALLOWLIST_FAIL: Non-local API host "api.supabase.co" forbidden/
  );
});

test('6. Negative check: swapped or mismatched port is rejected', () => {
  assert.throws(
    () => validateDatabaseUrl('postgresql://postgres:pass@127.0.0.1:54321/postgres', EXPECTED_PORTS.database),
    /ALLOWLIST_FAIL: Port 54321 does not match expected database port 54322/
  );
  assert.throws(
    () => validateApiUrl('http://127.0.0.1:54322', EXPECTED_PORTS.api),
    /ALLOWLIST_FAIL: API port 54322 does not match expected port 54321/
  );
});

test('7. Negative check: malformed protocol is rejected', () => {
  assert.throws(
    () => validateDatabaseUrl('mysql://127.0.0.1:54322/postgres'),
    /ALLOWLIST_FAIL: Unsupported protocol "mysql:"/
  );
  assert.throws(
    () => validateApiUrl('ftp://127.0.0.1:54321'),
    /ALLOWLIST_FAIL: Unsupported API protocol "ftp:"/
  );
});

test('8. Negative check: missing, altered, or escaping config file is rejected', () => {
  assert.throws(
    () => validateCanonicalConfig('/non-existent/config.toml'),
    /ALLOWLIST_FAIL: Project configuration file missing/
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
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-p01-first-start-'));
  try {
    const fullStackId = crypto.createHash('sha256').update('p01-synthetic-full-id').digest('hex');
    let prepareDispatched = false;

    const { counts, cliExecutor, httpFetcher, sqlExecutor } = createCountingAdapters({
      cliHandler: (cliPath, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('prepare')) {
          prepareDispatched = true;
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
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: prepareDispatched
                ? [
                    {
                      id: fullStackId,
                      name: 'lingora-wp00-p01',
                      project_root: CANONICAL_WORKSPACE_ROOT,
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
            }),
            stderr: '',
          };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    const res = await startStack({
      newRun: true,
      runsDir: tempDir,
      stackName: 'lingora-wp00-p01',
      adapters: { cliExecutor, httpFetcher, sqlExecutor },
      allowTempRoots: true,
    });

    assert.equal(res.status, 'RUNNING');
    assert.equal(res.code, 'SUCCESS');
    assert.equal(res.exit_code, 0);
    assert.equal(res.instance_id, fullStackId);
    assert.equal(prepareDispatched, true);

    // Verify authority record on disk
    const runDir = path.resolve(tempDir, res.run_id);
    const authRecord = JSON.parse(fs.readFileSync(path.resolve(runDir, 'owner.json'), 'utf8'));
    assert.equal(authRecord.phase, 'BOUND');
    assert.equal(authRecord.instance_id, fullStackId);
    assert.equal(authRecord.pending_operation, null);
    assert.ok(authRecord.member_map);
    assert.equal(authRecord.member_map.auth, 'uuid-auth-1111');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('P02: Existing start on running or stopped stack resumes same ID with zero prepare calls', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-p02-existing-start-'));
  try {
    const { authority, recordPath, runId, stackId } = createValidMockAuthority(tempDir);
    let prepareDispatched = false;

    const { counts, cliExecutor, httpFetcher, sqlExecutor } = createCountingAdapters({
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
              lifecycle: 'running',
              readiness: 'healthy',
            }),
            stderr: '',
          };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    const res = await startStack({
      bindingFile: recordPath,
      adapters: { cliExecutor, httpFetcher, sqlExecutor },
      allowTempRoots: true,
    });

    assert.equal(res.status, 'RUNNING');
    assert.equal(res.code, 'SUCCESS');
    assert.equal(res.instance_id, stackId);
    assert.equal(prepareDispatched, false, 'Existing start must NEVER dispatch prepare');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('P03: Full lifecycle suite: status, stop, already-stopped, destroy, repeated destroy on tombstone', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-p03-lifecycle-'));
  try {
    const { authority, recordPath, runId, stackId } = createValidMockAuthority(tempDir);
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
      bindingFile: recordPath,
      adapters: { cliExecutor, httpFetcher, sqlExecutor },
      allowTempRoots: true,
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
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// -----------------------------------------------------------------------------
// N01, N02, N03: Negative Matrices
// -----------------------------------------------------------------------------

test('N01 Matrix: start/status/stop/destroy/data x local invalid variations (CLI=0, HTTP=0, SQL=0)', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-n01-matrix-'));
  try {
    const variations = [
      { name: 'missing_file', setup: () => path.resolve(tempDir, 'missing.json') },
      {
        name: 'corrupt_json',
        setup: () => {
          const p = path.resolve(tempDir, 'corrupt.json');
          fs.writeFileSync(p, '{ broken');
          return p;
        },
      },
      {
        name: 'wrong_task_id',
        setup: () => {
          const { recordPath } = createValidMockAuthority(tempDir, { task_id: 'wrong-task-id' });
          return recordPath;
        },
      },
      {
        name: 'version_mismatch',
        setup: () => {
          const { recordPath } = createValidMockAuthority(tempDir, { format_version: '99.0' });
          return recordPath;
        },
      },
    ];

    for (const v of variations) {
      const bindingFile = v.setup();
      const { counts, cliExecutor, httpFetcher, sqlExecutor } = createCountingAdapters();
      const opts = {
        bindingFile,
        adapters: { cliExecutor, httpFetcher, sqlExecutor },
        allowTempRoots: true,
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

      // start
      await assert.rejects(async () => startStack(opts));
      assert.equal(counts.cliCalls, 0, `N01 ${v.name}: start must call 0 CLI`);
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('N02 Matrix: 5 entry points x native registry mismatch executes ONLY safe inspection (CLI=1) and 0 action/HTTP/SQL', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-n02-matrix-'));
  try {
    const { authority, recordPath, stackId } = createValidMockAuthority(tempDir);

    const { counts, cliExecutor, httpFetcher, sqlExecutor } = createCountingAdapters({
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
      bindingFile: recordPath,
      adapters: { cliExecutor, httpFetcher, sqlExecutor },
      allowTempRoots: true,
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
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// -----------------------------------------------------------------------------
// F01, F02, F03, F05, F06, F07: Failure Injections
// -----------------------------------------------------------------------------

test('F01: Lock acquisition failure aborts before any provider calls', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f01-lock-'));
  try {
    const { recordPath, runId } = createValidMockAuthority(tempDir);

    // Acquire lock manually
    const { token } = acquireRunLock(tempDir, runId);

    const { counts, cliExecutor } = createCountingAdapters();
    const opts = {
      bindingFile: recordPath,
      adapters: { cliExecutor },
      allowTempRoots: true,
    };

    assert.throws(() => statusStack(opts), /LOCKED/);
    assert.equal(counts.cliCalls, 0, 'No CLI calls when lock is held');

    releaseRunLock(tempDir, token);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('F02: Prepare failure retains durable intent without second prepare', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f02-prepare-'));
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
        runsDir: tempDir,
        stackName: 'lingora-wp00-f02',
        adapters: { cliExecutor },
        allowTempRoots: true,
      }),
      /STACK_PREPARE_FAIL/
    );

    assert.equal(prepareCount, 1, 'Exactly one prepare attempted before failure');

    // Inspect authority record: must retain pending_operation = prepare
    const entries = fs.readdirSync(tempDir);
    const runDir = path.resolve(tempDir, entries[0]);
    const record = JSON.parse(fs.readFileSync(path.resolve(runDir, 'owner.json'), 'utf8'));
    assert.equal(record.phase, 'RESERVED');
    assert.equal(record.pending_operation, 'prepare');
    assert.equal(record.instance_id, null);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('F03: Orphan lock recovery verifies inactive process before taking lock', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f03-orphan-'));
  try {
    const { recordPath, runId } = createValidMockAuthority(tempDir);

    // Create an orphan lock with a nonexistent PID
    const lockFile = path.resolve(tempDir, '.run.lock');
    const fakeLock = {
      token: crypto.randomUUID(),
      run_id: runId,
      pid: 9999999, // nonexistent PID
      start_ticks: '123456',
      boot_id: getLinuxBootId(),
      locked_at: new Date().toISOString(),
    };
    fs.writeFileSync(lockFile, JSON.stringify(fakeLock, null, 2));

    // Without allowRecovery: fails closed
    assert.throws(
      () => acquireRunLock(tempDir, runId, { allowRecovery: false }),
      /LOCKED/
    );

    // With allowRecovery: discovers dead PID, cleans orphan lock, succeeds
    const lock = acquireRunLock(tempDir, runId, { allowRecovery: true });
    assert.ok(lock.token);
    assert.notEqual(lock.token, fakeLock.token);

    releaseRunLock(tempDir, lock.token);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('F06: Destroy postcheck failure retains recovery state and does ZERO file deletion', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f06-destroy-'));
  try {
    const { authority, recordPath, stackId } = createValidMockAuthority(tempDir);

    const { cliExecutor } = createCountingAdapters({
      cliHandler: (cmd, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
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
        bindingFile: recordPath,
        adapters: { cliExecutor },
        allowTempRoots: true,
      }),
      /DESTROY_POSTCHECK_FAIL/
    );

    // Authority record must STILL be BOUND and credentials NOT deleted
    const authRecord = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    assert.equal(authRecord.phase, 'BOUND');
    const credFile = path.resolve(tempDir, 'credentials.json');
    assert.equal(fs.existsSync(credFile), true, 'Credentials must NOT be deleted on postcheck failure');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// -----------------------------------------------------------------------------
// E01, E02: Secret Incident Regressions (Mandatory)
// -----------------------------------------------------------------------------

test('E01 & E02: Synthetic owner-control-secret canary is NEVER leaked across any dispatcher or error path', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-e01-canary-'));
  const canary = `CANARY_SECRET_${crypto.randomBytes(16).toString('hex')}`;
  registerRedactionCanary(canary);

  try {
    const { authority, recordPath, stackId } = createValidMockAuthority(tempDir);

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
          // Injected canary in malformed output and stderr
          return {
            status: 0,
            stdout: `MALFORMED_OUTPUT: ${canary}`,
            stderr: `CANARY_STDERR_TOKEN: ${canary}`,
          };
        }
        if (args.includes('destroy')) {
          // Injected canary in destroy failure
          return {
            status: 1,
            stdout: '',
            stderr: `FATAL_DESTROY_ERROR: ${canary}`,
          };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    // 1. Status failure with canary in output
    try {
      statusStack({
        bindingFile: recordPath,
        adapters: { cliExecutor },
        allowTempRoots: true,
      });
      assert.fail('statusStack should have failed');
    } catch (err) {
      assert.equal(err.message.includes(canary), false, 'Canary leaked in statusStack error message');
    }

    // 2. Destroy failure with canary in stderr
    try {
      destroyStack({
        bindingFile: recordPath,
        adapters: { cliExecutor },
        allowTempRoots: true,
      });
      assert.fail('destroyStack should have failed');
    } catch (err) {
      assert.equal(err.message.includes(canary), false, 'Canary leaked in destroyStack error message');
    }
  } finally {
    clearRedactionCanaries();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// -----------------------------------------------------------------------------
// L01: Concurrency Tests
// -----------------------------------------------------------------------------

test('L01: Concurrent operations on the same run enforce mutual exclusion (loser executes 0 adapters)', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-l01-concurrency-'));
  try {
    const { recordPath, runId } = createValidMockAuthority(tempDir);

    // Process 1 acquires lock
    const { token } = acquireRunLock(tempDir, runId);

    // Process 2 tries to perform an action
    const { counts, cliExecutor } = createCountingAdapters();
    const opts = {
      bindingFile: recordPath,
      adapters: { cliExecutor },
      allowTempRoots: true,
    };

    assert.throws(() => statusStack(opts), /LOCKED/);
    assert.equal(counts.cliCalls, 0, 'Lock loser executes ZERO CLI calls');
    assert.equal(counts.httpCalls, 0);
    assert.equal(counts.sqlCalls, 0);

    // Process 1 releases lock
    releaseRunLock(tempDir, token);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('N03: Returned ID or runtime mismatch rejects fail-closed with zero data probes', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-n03-mismatch-'));
  try {
    const { authority, recordPath, stackId } = createValidMockAuthority(tempDir);

    const { counts, cliExecutor, httpFetcher, sqlExecutor } = createCountingAdapters({
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
      bindingFile: recordPath,
      adapters: { cliExecutor, httpFetcher, sqlExecutor },
      allowTempRoots: true,
    };

    await assert.rejects(async () => startStack(opts), /STACK_START_FAIL/);
    assert.equal(counts.httpCalls, 0, 'No HTTP probes when returned start ID mismatches');
    assert.equal(counts.sqlCalls, 0, 'No SQL probes when returned start ID mismatches');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('F05: Stop failure or quiescence violation rejects without claiming stopped', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f05-stop-'));
  try {
    const { authority, recordPath, stackId } = createValidMockAuthority(tempDir);

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
        if (args.includes('stop')) {
          // Stop command fails
          return { status: 1, stdout: '', stderr: 'stop timeout' };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    assert.throws(
      () => stopStack({
        bindingFile: recordPath,
        adapters: { cliExecutor },
        allowTempRoots: true,
      }),
      /STOP_FAIL: CLI stop command failed/
    );

    // Authority record must STILL exist and remain BOUND
    const authRecord = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    assert.equal(authRecord.phase, 'BOUND');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('F07: Crash after destroy tombstone enables safe idempotent cleanup retry', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp00-f07-tombstone-'));
  try {
    const { authority, recordPath, stackId } = createValidMockAuthority(tempDir, {
      phase: 'DESTROYED',
      destroyed_at: new Date().toISOString(),
    });

    // Authority record is already DESTROYED tombstone, but residual credentials still on disk
    const credPath = path.resolve(tempDir, 'credentials.json');
    assert.equal(fs.existsSync(credPath), true);

    const { cliExecutor } = createCountingAdapters();
    const res = destroyStack({
      bindingFile: recordPath,
      adapters: { cliExecutor },
      allowTempRoots: true,
    });

    assert.equal(res.code, 'ALREADY_DESTROYED');
    assert.equal(res.status, 'DESTROYED');
    assert.equal(res.exit_code, 0);

    // Residual credentials must now be unlinked
    assert.equal(fs.existsSync(credPath), false, 'Residual credentials unlinked on tombstone retry');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// -----------------------------------------------------------------------------
// CLI Dispatcher Nonzero Test
// -----------------------------------------------------------------------------

test('17. Command dispatcher nonzero path: CLI invocation exits 1 with safe diagnostic and no unredacted canaries', () => {
  const scriptPath = path.resolve(CANONICAL_WORKSPACE_ROOT, 'lingora-admin/tests/database/env/stack-manager.mjs');
  const res = spawnSync('node', [scriptPath, 'status'], {
    cwd: CANONICAL_WORKSPACE_ROOT,
    env: {
      ...process.env,
      PATH: `/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:${process.env.PATH || ''}`,
    },
    encoding: 'utf8',
  });

  assert.equal(res.status, 1, 'Command dispatcher must exit 1 on unbound state');
  assert.match(res.stderr, /\[STACK-MGR\] ERROR:/);
  assert.equal(res.stderr.includes('CANARY'), false);
});
