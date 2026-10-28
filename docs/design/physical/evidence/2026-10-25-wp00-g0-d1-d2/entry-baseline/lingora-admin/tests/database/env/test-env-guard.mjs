/**
 * Persistent Executable Test Suite for Environment Allowlist, Identity Binding,
 * Counting Adapter Boundaries, Data Destination Verification, and Secret Redaction (G0-R1, G0-R2, G0-R4).
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
  EXPECTED_PORTS,
  ALLOWED_PROJECT_ID,
  FORBIDDEN_UNOWNED_STATE_ROOT,
  FORBIDDEN_UNOWNED_HOME_ROOT,
  validateCanonicalConfig,
  validateDatabaseUrl,
  validateApiUrl,
  sanitizeString,
  sanitizeObject,
  validateTaskBinding,
  reconcileNativeRegistry,
  getValidatedRuntimeState,
  getGitBranch,
  computeSha256,
} from './env-guard.mjs';

import {
  startStack,
  statusStack,
  stopStack,
  destroyStack,
  probeDataReadiness,
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

function createValidMockBinding(tempDir, overrides = {}) {
  const configContent = fs.readFileSync(CANONICAL_CONFIG_PATH, 'utf8');
  const configDigest = crypto.createHash('sha256').update(configContent).digest('hex');
  const gitBranch = getGitBranch(CANONICAL_WORKSPACE_ROOT);
  const stackId = crypto.createHash('sha256').update('test-bound-mock-stack').digest('hex');

  const binding = {
    version: '1.0',
    taskId: 'wp00-g0-repair',
    stackName: 'lingora-wp00-test',
    stackId,
    id: stackId,
    runtime: 'native',
    projectRoot: fs.realpathSync(CANONICAL_WORKSPACE_ROOT),
    workdir: fs.realpathSync(CANONICAL_WORKSPACE_ROOT),
    configPath: fs.realpathSync(CANONICAL_CONFIG_PATH),
    configDigest,
    gitBranch: gitBranch.startsWith('refs/heads/') ? gitBranch : `refs/heads/${gitBranch}`,
    homeDir: fs.realpathSync(tempDir),
    stateRoot: fs.realpathSync(tempDir),
    endpoints: {
      'database.sql': { protocol: 'tcp', address: '127.0.0.1', port: 54322, url: 'tcp://127.0.0.1:54322' },
      'auth.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
      'rest.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
      'storage.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
      'mail.http': { protocol: 'http', address: '127.0.0.1', port: 54324, url: 'http://127.0.0.1:54324' },
    },
    env: {
      DB_URL: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
      API_URL: 'http://127.0.0.1:54321',
      ANON_KEY: 'test-anon-key',
    },
    ...overrides,
  };

  const bindingFile = path.resolve(tempDir, 'runtime-binding.json');
  fs.writeFileSync(bindingFile, JSON.stringify(binding, null, 2));
  return { binding, bindingFile };
}

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

test('10. Task binding validation negative checks: malformed, corrupt, unowned roots, or escaped bindings reject fail-closed', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-negative-checks-'));

  try {
    // 10a: Corrupted JSON binding
    const corruptFile = path.resolve(tempDir, 'corrupt-binding.json');
    fs.writeFileSync(corruptFile, '{ malformed json: true, ');
    assert.throws(() => validateTaskBinding(corruptFile), /ALLOWLIST_FAIL: Corrupted or unparseable task binding/);

    // 10b: Missing or invalid stackId
    const { bindingFile: shortIdFile } = createValidMockBinding(tempDir, { stackId: 'short-id-123' });
    assert.throws(() => validateTaskBinding(shortIdFile, { allowTempRoots: true }), /ALLOWLIST_FAIL: stackId "short-id-123" is not a valid 64-character hex ID/);

    // 10c: Non-hex stackId
    const { bindingFile: nonHexFile } = createValidMockBinding(tempDir, { stackId: 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' });
    assert.throws(() => validateTaskBinding(nonHexFile, { allowTempRoots: true }), /is not a valid 64-character hex ID/);

    // 10d: Configuration digest mismatch
    const { bindingFile: badDigestFile } = createValidMockBinding(tempDir, { configDigest: 'deadbeef00000000000000000000000000000000000000000000000000000000' });
    assert.throws(() => validateTaskBinding(badDigestFile, { allowTempRoots: true }), /ALLOWLIST_FAIL: Config digest mismatch/);

    // 10e: Git branch mismatch
    const { bindingFile: badBranchFile } = createValidMockBinding(tempDir, { gitBranch: 'refs/heads/non-existent-feature-branch' });
    assert.throws(() => validateTaskBinding(badBranchFile, { allowTempRoots: true }), /ALLOWLIST_FAIL: Git branch mismatch/);

    // 10f: Unowned .local-stack root adoption is rejected
    if (fs.existsSync(FORBIDDEN_UNOWNED_STATE_ROOT)) {
      const { bindingFile: unownedStateFile } = createValidMockBinding(tempDir, { stateRoot: FORBIDDEN_UNOWNED_STATE_ROOT });
      assert.throws(() => validateTaskBinding(unownedStateFile, { allowTempRoots: true }), /Auto-adoption of unowned .local-stack/);
    }

    // 10g: Unowned .supabase-home adoption is rejected
    if (fs.existsSync(FORBIDDEN_UNOWNED_HOME_ROOT)) {
      const { bindingFile: unownedHomeFile } = createValidMockBinding(tempDir, { homeDir: FORBIDDEN_UNOWNED_HOME_ROOT });
      assert.throws(() => validateTaskBinding(unownedHomeFile, { allowTempRoots: true }), /Auto-adoption of unowned .supabase-home/);
    }

    // 10h: Binding file location mismatch (not in stateRoot)
    const outsideBindingFile = path.resolve(tempDir, 'outside.json');
    const dummyStateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dummy-state-'));
    fs.writeFileSync(outsideBindingFile, JSON.stringify({
      version: '1.0',
      taskId: 'wp00-g0-repair',
      stackName: 'lingora-wp00-test',
      stackId: crypto.createHash('sha256').update('id').digest('hex'),
      runtime: 'native',
      projectRoot: CANONICAL_WORKSPACE_ROOT,
      workdir: CANONICAL_WORKSPACE_ROOT,
      configPath: CANONICAL_CONFIG_PATH,
      configDigest: computeSha256(CANONICAL_CONFIG_PATH),
      gitBranch: getGitBranch(CANONICAL_WORKSPACE_ROOT),
      homeDir: dummyStateDir,
      stateRoot: dummyStateDir,
      endpoints: {
        'database.sql': { protocol: 'tcp', address: '127.0.0.1', port: 54322, url: 'tcp://127.0.0.1:54322' },
        'auth.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
        'rest.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
        'storage.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
        'mail.http': { protocol: 'http', address: '127.0.0.1', port: 54324, url: 'http://127.0.0.1:54324' },
      }
    }));
    assert.throws(() => validateTaskBinding(outsideBindingFile, { allowTempRoots: true }), /Binding file does not reside directly inside binding.stateRoot/);
    fs.rmSync(dummyStateDir, { recursive: true, force: true });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('11. Boundary negative: Invalid local binding causes ZERO adapter invocations (CLI=0, HTTP=0, SQL=0) across ALL 5 manager lifecycle and data paths', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-zero-adapter-checks-'));
  const nonExistentBindingFile = path.resolve(tempDir, 'missing-binding.json');

  try {
    const { counts, cliExecutor, httpFetcher, sqlExecutor } = createCountingAdapters();
    const managerOptions = {
      bindingFile: nonExistentBindingFile,
      stateRoot: tempDir,
      homeDir: tempDir,
      adapters: { cliExecutor, httpFetcher, sqlExecutor },
      allowTempRoots: true,
    };

    // 11a: statusStack on invalid binding
    assert.throws(() => statusStack(managerOptions), /STATUS_FAIL: Stack is not bound/);
    assert.equal(counts.cliCalls, 0, 'statusStack must invoke ZERO CLI calls on invalid binding');
    assert.equal(counts.httpCalls, 0, 'statusStack must invoke ZERO HTTP calls on invalid binding');
    assert.equal(counts.sqlCalls, 0, 'statusStack must invoke ZERO SQL calls on invalid binding');

    // 11b: stopStack on invalid binding
    assert.throws(() => stopStack(managerOptions), /STOP_FAIL: Refusing to stop unbound stack/);
    assert.equal(counts.cliCalls, 0, 'stopStack must invoke ZERO CLI calls on invalid binding');
    assert.equal(counts.httpCalls, 0, 'stopStack must invoke ZERO HTTP calls on invalid binding');
    assert.equal(counts.sqlCalls, 0, 'stopStack must invoke ZERO SQL calls on invalid binding');

    // 11c: destroyStack on invalid binding
    assert.throws(() => destroyStack(managerOptions), /DESTROY_FAIL: Refusing to destroy unbound stack/);
    assert.equal(counts.cliCalls, 0, 'destroyStack must invoke ZERO CLI calls on invalid binding');
    assert.equal(counts.httpCalls, 0, 'destroyStack must invoke ZERO HTTP calls on invalid binding');
    assert.equal(counts.sqlCalls, 0, 'destroyStack must invoke ZERO SQL calls on invalid binding');

    // 11d: probeDataReadiness on invalid binding
    await assert.rejects(async () => probeDataReadiness(managerOptions), /DATA_READINESS_FAIL: Local binding is invalid/);
    assert.equal(counts.cliCalls, 0, 'probeDataReadiness must invoke ZERO CLI calls on invalid binding');
    assert.equal(counts.httpCalls, 0, 'probeDataReadiness must invoke ZERO HTTP calls on invalid binding');
    assert.equal(counts.sqlCalls, 0, 'probeDataReadiness must invoke ZERO SQL calls on invalid binding');

    // 11e: startStack on invalid preexisting binding
    const corruptBindingFile = path.resolve(tempDir, 'corrupt.json');
    fs.writeFileSync(corruptBindingFile, '{ invalid json');
    assert.rejects(async () => startStack({ ...managerOptions, bindingFile: corruptBindingFile }), /ALLOWLIST_FAIL/);
    assert.equal(counts.cliCalls, 0, 'startStack must invoke ZERO CLI calls on corrupt preexisting binding');
    assert.equal(counts.httpCalls, 0, 'startStack must invoke ZERO HTTP calls on corrupt preexisting binding');
    assert.equal(counts.sqlCalls, 0, 'startStack must invoke ZERO SQL calls on corrupt preexisting binding');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('12. Boundary negative: Native registry mismatch executes ONLY safe inspection (CLI=1) and ZERO action/HTTP/SQL calls across all entry paths', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-reconcile-mismatch-'));

  try {
    const { binding, bindingFile } = createValidMockBinding(tempDir);

    // Mock CLI that returns a native stack list with a DIFFERENT/STALE stack ID
    const staleStackId = crypto.createHash('sha256').update('different-stale-stack').digest('hex');
    const { counts, cliExecutor, httpFetcher, sqlExecutor } = createCountingAdapters({
      cliHandler: (cmd, args) => {
        if (args.includes('--version')) {
          return { status: 0, stdout: '2.121.0\n', stderr: '' };
        }
        if (args.includes('list')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: [
                {
                  id: staleStackId,
                  name: binding.stackName,
                  project_root: binding.projectRoot,
                  branch_context: binding.gitBranch,
                  runtime: 'native',
                  owner: 'reachable',
                },
              ],
              message: '',
            }),
            stderr: '',
          };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    const managerOptions = {
      bindingFile,
      stateRoot: tempDir,
      homeDir: tempDir,
      adapters: { cliExecutor, httpFetcher, sqlExecutor },
      allowTempRoots: true,
    };

    // 12a: statusStack
    assert.throws(
      () => statusStack(managerOptions),
      /RECONCILE_FAIL: Task stack ID .* was not found in native registry/
    );
    assert.equal(counts.cliCalls, 2, 'Version + safe inspection (stack list) executed');
    assert.equal(counts.cliArgs[1].args[0], 'stack');
    assert.equal(counts.cliArgs[1].args[1], 'list');
    assert.equal(counts.httpCalls, 0, 'Zero HTTP on reconcile mismatch');
    assert.equal(counts.sqlCalls, 0, 'Zero SQL on reconcile mismatch');

    // Reset
    counts.cliCalls = 0; counts.cliArgs = [];

    // 12b: stopStack
    assert.throws(
      () => stopStack(managerOptions),
      /RECONCILE_FAIL: Task stack ID .* was not found in native registry/
    );
    assert.equal(counts.cliCalls, 2);
    assert.equal(counts.cliArgs[1].args[1], 'list');
    assert.equal(counts.httpCalls, 0);
    assert.equal(counts.sqlCalls, 0);

    // Reset
    counts.cliCalls = 0; counts.cliArgs = [];

    // 12c: destroyStack
    assert.throws(
      () => destroyStack(managerOptions),
      /RECONCILE_FAIL: Task stack ID .* was not found in native registry/
    );
    assert.equal(counts.cliCalls, 2);
    assert.equal(counts.cliArgs[1].args[1], 'list');
    assert.equal(counts.httpCalls, 0);
    assert.equal(counts.sqlCalls, 0);

    // Reset
    counts.cliCalls = 0; counts.cliArgs = [];

    // 12d: probeDataReadiness
    await assert.rejects(
      async () => probeDataReadiness(managerOptions),
      /RECONCILE_FAIL: Task stack ID .* was not found in native registry/
    );
    assert.equal(counts.cliCalls, 2);
    assert.equal(counts.cliArgs[1].args[1], 'list');
    assert.equal(counts.httpCalls, 0);
    assert.equal(counts.sqlCalls, 0);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('13. Positive data readiness executes real counting HTTP and SQL adapters', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-positive-data-probe-'));

  try {
    const { binding, bindingFile } = createValidMockBinding(tempDir);

    const { counts, cliExecutor, httpFetcher, sqlExecutor } = createCountingAdapters({
      cliHandler: (cmd, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('list')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: [
                {
                  id: binding.stackId,
                  name: binding.stackName,
                  project_root: binding.projectRoot,
                  branch_context: binding.gitBranch,
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

    const managerOptions = {
      bindingFile,
      stateRoot: tempDir,
      homeDir: tempDir,
      adapters: { cliExecutor, httpFetcher, sqlExecutor },
      allowTempRoots: true,
    };

    const readinessResult = await probeDataReadiness(managerOptions);
    assert.equal(readinessResult.sql.ready, true);
    assert.equal(readinessResult.auth.ready, true);
    assert.equal(readinessResult.storage.ready, true);
    assert.equal(readinessResult.mail.ready, true);

    // Assert that adapters were ACTUALLY called
    assert.equal(counts.sqlCalls, 1, 'SQL adapter was called');
    assert.equal(counts.httpCalls, 3, 'HTTP adapter was called for Auth, Storage, and Mail');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('14. Failure containment: malformed status output produces structured error without leaking raw payloads or parser error snippets', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-malformed-status-'));

  try {
    const { binding, bindingFile } = createValidMockBinding(tempDir);
    const canaryInMalformed = 'CANARY_S3_KEY_SECRET_SHOULD_NEVER_BE_DUMPED_999';

    const { cliExecutor } = createCountingAdapters({
      cliHandler: (cmd, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('list')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: [
                {
                  id: binding.stackId,
                  name: binding.stackName,
                  project_root: binding.projectRoot,
                  branch_context: binding.gitBranch,
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
            stdout: `MALFORMED_OUTPUT_WITHOUT_JSON: secret_val=${canaryInMalformed}`,
            stderr: `STDERR_CANARY: ${canaryInMalformed}`,
          };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    const managerOptions = {
      bindingFile,
      stateRoot: tempDir,
      homeDir: tempDir,
      adapters: { cliExecutor },
      allowTempRoots: true,
    };

    assert.throws(
      () => statusStack(managerOptions),
      (err) => {
        assert.equal(err.message.includes(canaryInMalformed), false, 'Canary must not be leaked in error message');
        assert.match(err.message, /CLI_OUTPUT_ERROR: No JSON payload found/);
        return true;
      }
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('15. Failure containment on failed teardown: retains recovery binding, releases lock, and enables retry', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-failed-teardown-'));

  try {
    const { binding, bindingFile } = createValidMockBinding(tempDir);
    const canaryInStderr = 'CANARY_DESTROY_ERROR_SECRET_777';

    // Mock CLI where destroy fails with exit code 1
    const { cliExecutor } = createCountingAdapters({
      cliHandler: (cmd, args) => {
        if (args.includes('--version')) return { status: 0, stdout: '2.121.0\n', stderr: '' };
        if (args.includes('list')) {
          return {
            status: 0,
            stdout: JSON.stringify({
              stacks: [
                {
                  id: binding.stackId,
                  name: binding.stackName,
                  project_root: binding.projectRoot,
                  branch_context: binding.gitBranch,
                  runtime: 'native',
                  owner: 'reachable',
                },
              ],
            }),
            stderr: '',
          };
        }
        if (args.includes('destroy')) {
          return {
            status: 1,
            stdout: '',
            stderr: `Fatal internal error: key=${canaryInStderr}`,
          };
        }
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    const managerOptions = {
      bindingFile,
      stateRoot: tempDir,
      homeDir: tempDir,
      adapters: { cliExecutor },
      allowTempRoots: true,
    };

    assert.throws(
      () => destroyStack(managerOptions),
      (err) => {
        assert.match(err.message, /DESTROY_FAIL: Destroy command failed with exit code 1/);
        assert.equal(err.message.includes(canaryInStderr), false, 'Canary in destroy stderr must not leak');
        return true;
      }
    );

    // CRITICAL: verify that the recovery binding file was RETAINED on disk
    assert.equal(fs.existsSync(bindingFile), true, 'Recovery binding file MUST be retained after failed teardown');

    // CRITICAL: verify that exclusion lock was RELEASED and does not block retry
    const lockFile = path.resolve(tempDir, '.lifecycle.lock');
    assert.equal(fs.existsSync(lockFile), false, 'Lifecycle lock MUST be released on failure in finally block');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('16. Command dispatcher nonzero path: CLI invocation exits 1 with safe diagnostic and no unredacted canaries', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-dispatcher-checks-'));
  const missingBinding = path.resolve(tempDir, 'missing.json');

  try {
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
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
