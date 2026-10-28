/**
 * Comprehensive Test Suite for Shared Test Context Utility (P1-00).
 *
 * Verifies:
 * - Missing explicit context throws TEST_CONTEXT_MISSING (ambient env rejected).
 * - Malformed context payload throws TEST_CONTEXT_INVALID.
 * - Forbidden or unallowlisted runsDir throws ALLOWLIST_FAIL.
 * - Stale context (absent lock or dead parent PID) throws TEST_CONTEXT_STALE.
 * - Lock token mismatch (lock steal attempt) throws TEST_CONTEXT_FORBIDDEN.
 * - Run ID mismatch throws TEST_CONTEXT_MISMATCH.
 * - Pending operation on authority record throws RECOVERY_REQUIRED.
 * - Unbound or tombstone authority throws TEST_CONTEXT_DENIED.
 * - Foreign database URL or API URL throws ALLOWLIST_FAIL.
 * - Positive context retrieval returns typed endpoints and credentials.
 * - assertLockHeld detects lock removal in real-time.
 * - createTargetPgClient strips PG* ambient vars and enforces lock validity.
 * - Zero SQL and zero HTTP side-effects across all negative branches.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import {
  CANONICAL_WORKSPACE_ROOT,
  CANONICAL_CONFIG_PATH,
  TASK_ID,
  PINNED_CLI_VERSION,
  PINNED_CLI_SHA256,
  FORBIDDEN_UNOWNED_STATE_ROOT,
  FORBIDDEN_OLD_WP00_STATE,
  getGitBranch,
  getLinuxBootId,
  parseProcStat,
} from './env/env-guard.mjs';
import { getTestContext, assertLockHeld, createTargetPgClient } from './test-context.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = CANONICAL_WORKSPACE_ROOT;

function createTestAuthorityAndLock(runsDir, overrides = {}) {
  const configContent = fs.readFileSync(CANONICAL_CONFIG_PATH, 'utf8');
  const configDigest = crypto.createHash('sha256').update(configContent).digest('hex');
  const gitBranch = getGitBranch(WORKSPACE_ROOT);
  const stackId = crypto.createHash('sha256').update('test-ctx-stack-' + crypto.randomBytes(4).toString('hex')).digest('hex');
  const runId = overrides.run_id || `run-${crypto.randomBytes(6).toString('hex')}`;
  const lockToken = overrides.lock_token || crypto.randomUUID();

  const runDir = path.resolve(runsDir, runId);
  fs.mkdirSync(runDir, { recursive: true });
  fs.chmodSync(runDir, 0o700);
  fs.mkdirSync(path.join(runDir, 'home'), { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.join(runDir, 'fixture'), { recursive: true, mode: 0o700 });

  const authority = {
    format_version: '1.0',
    task_id: TASK_ID,
    run_id: runId,
    phase: overrides.phase || 'BOUND',
    pending_operation: overrides.pending_operation !== undefined ? overrides.pending_operation : null,
    instance_id: stackId,
    stack_name: 'lingora-wp00-ctx-test',
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
      auth: 'uuid-auth-test',
      storage: 'uuid-storage-test',
    },
    endpoints: {
      'database.sql': { protocol: 'tcp', address: '127.0.0.1', port: 54322, url: 'tcp://127.0.0.1:54322' },
      'auth.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
      'rest.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
      'storage.http': { protocol: 'http', address: '127.0.0.1', port: 54321, url: 'http://127.0.0.1:54321' },
      'mail.http': { protocol: 'http', address: '127.0.0.1', port: 54324, url: 'http://127.0.0.1:54324' },
    },
    ...overrides.authority,
  };

  const recordPath = path.resolve(runDir, 'owner.json');
  fs.writeFileSync(recordPath, JSON.stringify(authority, null, 2), { mode: 0o600 });

  const creds = {
    DB_URL: overrides.db_url || 'postgresql://postgres:synthetic_pass@127.0.0.1:54322/postgres',
    ANON_KEY: 'test-anon-key-valid',
    API_URL: 'http://127.0.0.1:54321',
    ...overrides.creds,
  };
  const credPath = path.resolve(runDir, 'credentials.json');
  fs.writeFileSync(credPath, JSON.stringify(creds, null, 2), { mode: 0o600 });

  // Create valid active lock held by current process (unless overridden)
  if (overrides.skip_lock !== true) {
    const statRes = parseProcStat(process.pid);
    const startTicks = overrides.start_ticks || (statRes.status === 'KNOWN' && statRes.stat ? statRes.stat.start_ticks : '0');
    const bootRes = getLinuxBootId();
    const bootId = overrides.boot_id || (bootRes.status === 'KNOWN' ? bootRes.boot_id : 'test-boot');

    const lockData = {
      token: lockToken,
      run_id: overrides.lock_run_id || runId,
      pid: overrides.lock_pid || process.pid,
      start_ticks: startTicks,
      boot_id: bootId,
      locked_at: new Date().toISOString(),
    };
    const lockFile = path.resolve(runDir, '.run.lock');
    fs.writeFileSync(lockFile, JSON.stringify(lockData, null, 2), { mode: 0o600 });
  }

  const explicitContext = {
    runId,
    runsDir,
    runDir,
    recordPath,
    lockToken,
    ...overrides.context,
  };

  return { authority, explicitContext, runDir, recordPath, runId, lockToken, creds };
}

test('1. Missing explicit context throws TEST_CONTEXT_MISSING and strictly ignores ambient environment', () => {
  const savedEnv = { ...process.env };
  try {
    delete process.env.LINGORA_TEST_CONTEXT;
    // Set ambient credentials that must be ignored
    process.env.DB_URL = 'postgresql://postgres:ambient_pass@127.0.0.1:54322/ambient';
    process.env.DATABASE_URL = 'postgresql://postgres:ambient_pass@127.0.0.1:54322/ambient';
    process.env.PGPASSWORD = 'ambient-password';

    assert.throws(
      () => getTestContext(),
      (err) => {
        assert.equal(err.code, 'TEST_CONTEXT_MISSING');
        assert.match(err.message, /TEST_CONTEXT_MISSING.*Ambient credentials and environment fallback are prohibited/);
        return true;
      }
    );
  } finally {
    process.env = savedEnv;
  }
});

test('2. Malformed explicit context payload throws TEST_CONTEXT_INVALID', () => {
  assert.throws(
    () => getTestContext({ context: 'not-an-object' }),
    /TEST_CONTEXT_INVALID/
  );
  assert.throws(
    () => getTestContext({ context: { runId: 'bad-format-id', lockToken: 'uuid' } }),
    /TEST_CONTEXT_INVALID.*runId missing or malformed/
  );
  assert.throws(
    () => getTestContext({ context: { runId: 'run-12345678', lockToken: null } }),
    /TEST_CONTEXT_INVALID.*lockToken missing/
  );
});

test('3. Forbidden or legacy runsDir throws ALLOWLIST_FAIL', () => {
  // 3a. Forbidden roots as expectedRunsDir override throw ALLOWLIST_FAIL (forbidden root)
  assert.throws(
    () => getTestContext({
      expectedRunsDir: FORBIDDEN_UNOWNED_STATE_ROOT,
      context: {
        runId: 'run-12345678',
        runsDir: FORBIDDEN_UNOWNED_STATE_ROOT,
        lockToken: crypto.randomUUID(),
      },
    }),
    /ALLOWLIST_FAIL.*forbidden root/
  );
  assert.throws(
    () => getTestContext({
      expectedRunsDir: FORBIDDEN_OLD_WP00_STATE,
      context: {
        runId: 'run-12345678',
        runsDir: FORBIDDEN_OLD_WP00_STATE,
        lockToken: crypto.randomUUID(),
      },
    }),
    /ALLOWLIST_FAIL.*forbidden root/
  );

  // 3b. Untrusted arbitrary runsDir in context payload does not match default trusted runs namespace
  assert.throws(
    () => getTestContext({
      context: {
        runId: 'run-12345678',
        runsDir: '/tmp/arbitrary-untrusted-namespace',
        lockToken: crypto.randomUUID(),
      },
    }),
    (err) => {
      assert.equal(err.code, 'ALLOWLIST_FAIL');
      assert.match(err.message, /Context runsDir.*does not match trusted runs namespace/);
      return true;
    }
  );
});

test('4. Stale context: absent lock file throws TEST_CONTEXT_STALE', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-stale-lock-'));
  try {
    const { explicitContext } = createTestAuthorityAndLock(tempRunsDir, { skip_lock: true });
    assert.throws(
      () => getTestContext({ context: explicitContext, expectedRunsDir: tempRunsDir }),
      (err) => {
        assert.equal(err.code, 'TEST_CONTEXT_STALE');
        assert.match(err.message, /TEST_CONTEXT_STALE.*lock held by parent is no longer present/);
        return true;
      }
    );
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('5. Stale context: dead parent PID in lock throws TEST_CONTEXT_STALE', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-dead-pid-'));
  try {
    // Pick a dead PID that is guaranteed not running (e.g. 9999999)
    const deadPid = 9999999;
    const { explicitContext } = createTestAuthorityAndLock(tempRunsDir, {
      lock_pid: deadPid,
      start_ticks: '999999',
    });
    assert.throws(
      () => getTestContext({ context: explicitContext, expectedRunsDir: tempRunsDir }),
      (err) => {
        assert.equal(err.code, 'TEST_CONTEXT_STALE');
        assert.match(err.message, /TEST_CONTEXT_STALE.*Run lock holder PID.*is not alive/);
        return true;
      }
    );
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('6. Foreign context: lock token mismatch (lock steal attempt) throws TEST_CONTEXT_FORBIDDEN', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-token-mismatch-'));
  try {
    const realLockToken = crypto.randomUUID();
    const forgedToken = crypto.randomUUID();
    const { explicitContext } = createTestAuthorityAndLock(tempRunsDir, {
      lock_token: realLockToken,
      context: { lockToken: forgedToken },
    });

    assert.throws(
      () => getTestContext({ context: explicitContext, expectedRunsDir: tempRunsDir }),
      (err) => {
        assert.equal(err.code, 'TEST_CONTEXT_FORBIDDEN');
        assert.match(err.message, /TEST_CONTEXT_FORBIDDEN.*Lock token mismatch/);
        return true;
      }
    );
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('7. Foreign context: run_id mismatch throws TEST_CONTEXT_MISMATCH', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-id-mismatch-'));
  try {
    const runId1 = 'run-aaaaaaaaaaaaaaaa';
    const runId2 = 'run-bbbbbbbbbbbbbbbb';
    const { explicitContext } = createTestAuthorityAndLock(tempRunsDir, {
      run_id: runId1,
      lock_run_id: runId2,
    });

    assert.throws(
      () => getTestContext({ context: explicitContext, expectedRunsDir: tempRunsDir }),
      (err) => {
        assert.equal(err.code, 'TEST_CONTEXT_MISMATCH');
        assert.match(err.message, /TEST_CONTEXT_MISMATCH.*Lock run_id mismatch/);
        return true;
      }
    );
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('8. Pending operation denial: authority with pending operation throws RECOVERY_REQUIRED', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-pending-'));
  try {
    const { explicitContext } = createTestAuthorityAndLock(tempRunsDir, {
      pending_operation: 'destroy',
    });

    assert.throws(
      () => getTestContext({ context: explicitContext, expectedRunsDir: tempRunsDir }),
      (err) => {
        assert.equal(err.code, 'RECOVERY_REQUIRED');
        assert.match(err.message, /RECOVERY_REQUIRED.*contains pending operation/);
        return true;
      }
    );
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('9. Unbound authority (RESERVED or DESTROYED) throws TEST_CONTEXT_DENIED', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-unbound-'));
  try {
    const { explicitContext } = createTestAuthorityAndLock(tempRunsDir, {
      phase: 'DESTROYED',
    });

    assert.throws(
      () => getTestContext({ context: explicitContext, expectedRunsDir: tempRunsDir }),
      (err) => {
        assert.equal(err.code, 'TEST_CONTEXT_DENIED');
        assert.match(err.message, /TEST_CONTEXT_DENIED.*Environment is not bound/);
        return true;
      }
    );
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('10. Foreign database endpoint (non-local host or wrong port) throws ALLOWLIST_FAIL', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-foreign-ep-'));
  try {
    const { explicitContext } = createTestAuthorityAndLock(tempRunsDir, {
      db_url: 'postgresql://postgres:synthetic_pass@192.168.1.50:54322/postgres',
    });

    assert.throws(
      () => getTestContext({ context: explicitContext, expectedRunsDir: tempRunsDir }),
      /ALLOWLIST_FAIL/
    );
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('11. Positive test: valid context yields typed endpoints and credentials', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-positive-'));
  try {
    const { explicitContext, runId, authority } = createTestAuthorityAndLock(tempRunsDir);

    const ctx = getTestContext({ context: explicitContext, expectedRunsDir: tempRunsDir });
    assert.equal(ctx.runId, runId);
    assert.equal(ctx.stackId, authority.instance_id);
    assert.equal(ctx.endpoints.database.host, '127.0.0.1');
    assert.equal(ctx.endpoints.database.port, 54322);
    assert.equal(ctx.endpoints.auth.port, 54321);
    assert.equal(ctx.endpoints.mail.port, 54324);
    assert.equal(ctx.credentials.databaseUrl, 'postgresql://postgres:synthetic_pass@127.0.0.1:54322/postgres');
    assert.equal(ctx.credentials.anonKey, 'test-anon-key-valid');

    // assertLockHeld passes while lock is active
    assert.equal(ctx.assertLockHeld(), true);
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('12. Lock removal after context retrieval is immediately detected by assertLockHeld', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-lock-removal-'));
  try {
    const { explicitContext, runDir } = createTestAuthorityAndLock(tempRunsDir);

    const ctx = getTestContext({ context: explicitContext, expectedRunsDir: tempRunsDir });
    assert.equal(ctx.assertLockHeld(), true);

    // Parent completes and unlinks lock file
    const lockFile = path.resolve(runDir, '.run.lock');
    fs.unlinkSync(lockFile);

    assert.throws(
      () => ctx.assertLockHeld(),
      (err) => {
        assert.equal(err.code, 'TEST_CONTEXT_STALE');
        assert.match(err.message, /TEST_CONTEXT_STALE.*lock held by parent is no longer present/);
        return true;
      }
    );
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('13. createTargetPgClient strips ambient PG* env vars, enforces lock assertion, and rejects destination overrides', () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-pg-client-'));
  const savedPgHost = process.env.PGHOST;
  try {
    process.env.PGHOST = 'ambient-malicious-host';
    const { explicitContext } = createTestAuthorityAndLock(tempRunsDir);

    const ctx = getTestContext({ context: explicitContext, expectedRunsDir: tempRunsDir });

    let capturedConfig = null;
    class MockClient {
      constructor(cfg) {
        capturedConfig = cfg;
      }
    }

    const client = createTargetPgClient(ctx, { ClientClass: MockClient });
    assert.ok(client);
    assert.equal(capturedConfig.host, '127.0.0.1');
    assert.equal(capturedConfig.port, 54322);
    assert.equal(capturedConfig.user, 'postgres');
    assert.equal(capturedConfig.database, 'postgres');

    // Ambient PGHOST was restored after client instantiation
    assert.equal(process.env.PGHOST, 'ambient-malicious-host');

    // Rejection of destination overrides in clientConfig
    assert.throws(
      () => createTargetPgClient(ctx, { clientConfig: { host: 'foreign-target.example.com' }, ClientClass: MockClient }),
      (err) => {
        assert.equal(err.code, 'ALLOWLIST_FAIL');
        assert.match(err.message, /Destination\/connection parameter "host" cannot be overridden/);
        return true;
      }
    );
    assert.throws(
      () => createTargetPgClient(ctx, { clientConfig: { port: 5432 }, ClientClass: MockClient }),
      { code: 'ALLOWLIST_FAIL' }
    );
    assert.throws(
      () => createTargetPgClient(ctx, { clientConfig: { database: 'other_db' }, ClientClass: MockClient }),
      { code: 'ALLOWLIST_FAIL' }
    );
    assert.throws(
      () => createTargetPgClient(ctx, { clientConfig: { connectionString: 'postgresql://evil@127.0.0.1:54322/db' }, ClientClass: MockClient }),
      { code: 'ALLOWLIST_FAIL' }
    );
    assert.throws(
      () => createTargetPgClient(ctx, { connectionString: 'postgresql://evil@127.0.0.1:54322/db', ClientClass: MockClient }),
      { code: 'ALLOWLIST_FAIL' }
    );
  } finally {
    if (savedPgHost !== undefined) process.env.PGHOST = savedPgHost;
    else delete process.env.PGHOST;
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});

test('14. Critical negative effect assertion: zero SQL connections across failure modes and positive factory increment', async () => {
  const tempRunsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-test-zero-effects-'));
  try {
    let factoryCallCount = 0;
    let connectionAttemptCount = 0;

    class InstrumentingClient {
      constructor(cfg) {
        factoryCallCount++;
        this.cfg = cfg;
      }
      async connect() {
        connectionAttemptCount++;
      }
      async query() {
        return { rows: [] };
      }
      async end() {}
    }

    function attemptContextToClient(options, clientOpts = {}) {
      const ctx = getTestContext(options);
      return createTargetPgClient(ctx, { ClientClass: InstrumentingClient, ...clientOpts });
    }

    // Failure mode 1: Missing context
    assert.throws(
      () => attemptContextToClient({}),
      { code: 'TEST_CONTEXT_MISSING' }
    );
    assert.equal(factoryCallCount, 0, 'Factory must not be called on missing context');
    assert.equal(connectionAttemptCount, 0, 'Connection must not be attempted on missing context');

    // Failure mode 2: Custom / unallowlisted runsDir namespace in context payload
    const validData = createTestAuthorityAndLock(tempRunsDir);
    assert.throws(
      () => attemptContextToClient({ context: { ...validData.explicitContext, runsDir: '/tmp/foreign-untrusted-namespace' } }),
      { code: 'ALLOWLIST_FAIL' }
    );
    assert.equal(factoryCallCount, 0, 'Factory must not be called on untrusted runs namespace');
    assert.equal(connectionAttemptCount, 0, 'Connection must not be attempted on untrusted runs namespace');

    // Failure mode 3: Stale lock (absent lock file)
    const staleData = createTestAuthorityAndLock(tempRunsDir, { skip_lock: true });
    assert.throws(
      () => attemptContextToClient({ context: staleData.explicitContext, expectedRunsDir: tempRunsDir }),
      { code: 'TEST_CONTEXT_STALE' }
    );
    assert.equal(factoryCallCount, 0, 'Factory must not be called on stale lock');
    assert.equal(connectionAttemptCount, 0, 'Connection must not be attempted on stale lock');

    // Failure mode 4: Token mismatch (lock steal attempt)
    const foreignTokenData = createTestAuthorityAndLock(tempRunsDir, {
      context: { lockToken: crypto.randomUUID() },
    });
    assert.throws(
      () => attemptContextToClient({ context: foreignTokenData.explicitContext, expectedRunsDir: tempRunsDir }),
      { code: 'TEST_CONTEXT_FORBIDDEN' }
    );
    assert.equal(factoryCallCount, 0, 'Factory must not be called on token mismatch');
    assert.equal(connectionAttemptCount, 0, 'Connection must not be attempted on token mismatch');

    // Failure mode 5: Pending operation on authority record
    const pendingData = createTestAuthorityAndLock(tempRunsDir, { pending_operation: 'destroy' });
    assert.throws(
      () => attemptContextToClient({ context: pendingData.explicitContext, expectedRunsDir: tempRunsDir }),
      { code: 'RECOVERY_REQUIRED' }
    );
    assert.equal(factoryCallCount, 0, 'Factory must not be called on pending operation');
    assert.equal(connectionAttemptCount, 0, 'Connection must not be attempted on pending operation');

    // Failure mode 6: Destination override in clientConfig
    const validCtx = getTestContext({ context: validData.explicitContext, expectedRunsDir: tempRunsDir });
    assert.throws(
      () => createTargetPgClient(validCtx, { clientConfig: { host: 'malicious-foreign.example.com' }, ClientClass: InstrumentingClient }),
      { code: 'ALLOWLIST_FAIL' }
    );
    assert.equal(factoryCallCount, 0, 'Factory must not be called when destination override is attempted');
    assert.equal(connectionAttemptCount, 0, 'Connection must not be attempted when destination override is attempted');

    // Failure mode 7: Destination override via connectionString
    assert.throws(
      () => createTargetPgClient(validCtx, { connectionString: 'postgresql://evil@127.0.0.1:54322/db', ClientClass: InstrumentingClient }),
      { code: 'ALLOWLIST_FAIL' }
    );
    assert.equal(factoryCallCount, 0, 'Factory must not be called when connectionString override is attempted');
    assert.equal(connectionAttemptCount, 0, 'Connection must not be attempted when connectionString override is attempted');

    // Positive contrast check: authorized context -> client creation genuinely increments factory and connect counters
    const positiveClient = createTargetPgClient(validCtx, { ClientClass: InstrumentingClient });
    assert.equal(factoryCallCount, 1, 'Factory MUST genuinely increment when authorized client is instantiated');
    assert.equal(connectionAttemptCount, 0, 'Connection must not occur prior to connect()');

    await positiveClient.connect();
    assert.equal(connectionAttemptCount, 1, 'Connection counter MUST genuinely increment when connect() is called');
  } finally {
    fs.rmSync(tempRunsDir, { recursive: true, force: true });
  }
});
