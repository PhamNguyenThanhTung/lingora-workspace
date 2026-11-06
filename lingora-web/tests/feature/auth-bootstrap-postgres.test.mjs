import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '../../../lingora-admin/generated/product-client/index.js';
import { bootstrapLearnerAccount } from '../../src/server/auth/registration.ts';
import { getLearnerPrisma, disconnect, setLearnerPrismaForTest } from '../../src/server/db/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '../..');

/**
 * Strict pre-connection environment assertion:
 * MUST fail before client creation/connect unless explicit SLICE11_TEST_DATABASE_URL,
 * loopback host, slice11_test database identity and SLICE11_TEST_DATABASE_OWNED=1.
 * NEVER fallback to DATABASE_URL.
 */
export function validateAuthTestDatabaseUrl(env = process.env) {
  const url = env.SLICE11_TEST_DATABASE_URL;
  if (!url) {
    throw new Error('Explicit owned loopback DB required: SLICE11_TEST_DATABASE_URL is missing');
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('SLICE11_TEST_DATABASE_URL is not a valid URL');
  }
  if (!['127.0.0.1', 'localhost'].includes(parsed.hostname)) {
    throw new Error(`SLICE11_TEST_DATABASE_URL must target a loopback host (127.0.0.1 or localhost), got: ${parsed.hostname}`);
  }
  if (!/^\/slice11_test/.test(parsed.pathname)) {
    throw new Error(`SLICE11_TEST_DATABASE_URL must target database /slice11_test, got: ${parsed.pathname}`);
  }
  if (env.SLICE11_TEST_DATABASE_OWNED !== '1') {
    throw new Error('SLICE11_TEST_DATABASE_OWNED=1 is required for safety');
  }
  return url;
}

const validatedTestUrl = validateAuthTestDatabaseUrl(process.env);

describe('Package A: Real PostgreSQL Production Bootstrap', () => {
  let prisma;
  let prisma2;

  async function createAuthUser(id, email) {
    await prisma.$executeRaw`
      INSERT INTO auth.users (id, email)
      VALUES (${id}::uuid, ${email})
      ON CONFLICT (id) DO NOTHING;
    `;
  }

  before(async () => {
    prisma = getLearnerPrisma(validatedTestUrl);
    setLearnerPrismaForTest(prisma);
    prisma2 = new PrismaClient({ datasources: { db: { url: validatedTestUrl } }, log: [] });
    await prisma2.$connect();

    // DB-native concurrent-safe insert for 'en' language
    await prisma.$executeRaw`
      INSERT INTO app.languages (id, code, names, is_learnable, is_ui_locale, created_at, updated_at)
      VALUES (gen_random_uuid(), 'en', '{"en": "English"}'::jsonb, true, true, NOW(), NOW())
      ON CONFLICT (code) DO NOTHING
    `;
  });

  after(async () => {
    if (prisma2) await prisma2.$disconnect();
    setLearnerPrismaForTest(null);
    await disconnect();
  });

  describe('PostgreSQL Safety Guard Verification (Subprocess Negative Tests)', () => {
    test('fails before client creation if SLICE11_TEST_DATABASE_OWNED is missing or not 1', () => {
      const res = spawnSync(
        process.execPath,
        [
          '--experimental-strip-types',
          '--experimental-test-module-mocks',
          '--import', './tests/feature/harness/server-only.mjs',
          'tests/feature/auth-bootstrap-postgres.test.mjs',
        ],
        {
          cwd: webRoot,
          env: {
            ...process.env,
            SLICE11_TEST_DATABASE_URL: validatedTestUrl,
            SLICE11_TEST_DATABASE_OWNED: '0',
          },
          encoding: 'utf8',
        }
      );
      assert.notEqual(res.status, 0);
      assert.match(res.stderr + res.stdout, /SLICE11_TEST_DATABASE_OWNED=1 is required/);
    });

    test('fails before client creation if SLICE11_TEST_DATABASE_URL is non-loopback', () => {
      const res = spawnSync(
        process.execPath,
        [
          '--experimental-strip-types',
          '--experimental-test-module-mocks',
          '--import', './tests/feature/harness/server-only.mjs',
          'tests/feature/auth-bootstrap-postgres.test.mjs',
        ],
        {
          cwd: webRoot,
          env: {
            ...process.env,
            SLICE11_TEST_DATABASE_URL: 'postgresql://postgres:secret@remote.example:5432/slice11_test',
            SLICE11_TEST_DATABASE_OWNED: '1',
          },
          encoding: 'utf8',
        }
      );
      assert.notEqual(res.status, 0);
      assert.match(res.stderr + res.stdout, /must target a loopback host/);
    });

    test('fails before client creation if only DATABASE_URL is set (NEVER fallback)', () => {
      const cleanEnv = { ...process.env };
      delete cleanEnv.SLICE11_TEST_DATABASE_URL;
      cleanEnv.DATABASE_URL = validatedTestUrl;
      cleanEnv.SLICE11_TEST_DATABASE_OWNED = '1';

      const res = spawnSync(
        process.execPath,
        [
          '--experimental-strip-types',
          '--experimental-test-module-mocks',
          '--import', './tests/feature/harness/server-only.mjs',
          'tests/feature/auth-bootstrap-postgres.test.mjs',
        ],
        {
          cwd: webRoot,
          env: cleanEnv,
          encoding: 'utf8',
        }
      );
      assert.notEqual(res.status, 0);
      assert.match(res.stderr + res.stdout, /SLICE11_TEST_DATABASE_URL is missing/);
    });
  });

  test('bootstrap creates fixed LEARNER ACTIVE Account and AuditEvent in real PostgreSQL', async () => {
    const userId = randomUUID();
    const email = `learner.${Date.now()}.${Math.random().toString(36).slice(2, 6)}@lingora.test`;

    await createAuthUser(userId, email);

    const authClient = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: userId,
              email,
              email_confirmed_at: new Date().toISOString(),
              user_metadata: { display_name: 'Học Viên Mới' },
            },
          },
          error: null,
        }),
      },
    };

    const result = await bootstrapLearnerAccount({ authClient, prisma });
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.created, true);
    assert.equal(result.account.id, userId);
    assert.equal(result.account.role, 'LEARNER');
    assert.equal(result.account.status, 'ACTIVE');
    assert.equal(result.account.displayName, 'Học Viên Mới');
    assert.equal(result.account.uiLocale, 'en');

    // Query real PostgreSQL app.accounts
    const dbAccount = await prisma.account.findUnique({
      where: { id: userId },
    });
    assert.ok(dbAccount);
    assert.equal(dbAccount.id, userId);
    assert.equal(dbAccount.role, 'LEARNER');
    assert.equal(dbAccount.status, 'ACTIVE');
    assert.equal(dbAccount.displayName, 'Học Viên Mới');
    assert.equal(dbAccount.uiLocale, 'en');
    assert.equal(dbAccount.timezone, 'UTC');
    assert.ok(dbAccount.activatedAt instanceof Date);
    assert.equal(dbAccount.rowVersion, 1n);

    // Query real PostgreSQL app_private.audit_events
    const auditEvent = await prisma.auditEvent.findFirst({
      where: { verifiedAuthSubjectId: userId },
    });
    assert.ok(auditEvent);
    assert.equal(auditEvent.actorKind, 'VERIFIED_AUTH_SUBJECT');
    assert.equal(auditEvent.actorId, null);
    assert.equal(auditEvent.action, 'LEARNER_BOOTSTRAPPED');
    assert.equal(auditEvent.targetType, 'ACCOUNT');
    assert.equal(auditEvent.targetId, userId);
    assert.equal(auditEvent.outcome, 'SUCCESS');
  });

  test('real concurrent bootstrap convergence: same identity, two clients -> exactly one Account + one audit', async () => {
    const userId = randomUUID();
    const email = `concurrent.${Date.now()}.${Math.random().toString(36).slice(2, 6)}@lingora.test`;

    await createAuthUser(userId, email);

    const authClient = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: userId,
              email,
              email_confirmed_at: new Date().toISOString(),
              user_metadata: { display_name: 'Concurrent User' },
            },
          },
          error: null,
        }),
      },
    };

    // Launch both clients concurrently with the same identity
    const [result1, result2] = await Promise.all([
      bootstrapLearnerAccount({ authClient, prisma }),
      bootstrapLearnerAccount({ authClient, prisma: prisma2 }),
    ]);

    assert.equal(result1.ok, true);
    assert.equal(result2.ok, true);

    const createdCount = (result1.created ? 1 : 0) + (result2.created ? 1 : 0);
    assert.equal(createdCount, 1, 'Exactly one concurrent call must report created: true');

    // Confirm real PostgreSQL state: exactly 1 account
    const accounts = await prisma.account.findMany({
      where: { id: userId },
    });
    assert.equal(accounts.length, 1);
    assert.equal(accounts[0].id, userId);
    assert.equal(accounts[0].role, 'LEARNER');
    assert.equal(accounts[0].status, 'ACTIVE');

    // Confirm real PostgreSQL state: exactly 1 audit event
    const auditEvents = await prisma.auditEvent.findMany({
      where: { verifiedAuthSubjectId: userId, action: 'LEARNER_BOOTSTRAPPED' },
    });
    assert.equal(auditEvents.length, 1, 'Must have exactly one audit event created');
    assert.equal(auditEvents[0].outcome, 'SUCCESS');
  });

  test('injected failure at audit write AFTER real account insert rolls back entire transaction (no Account, no audit)', async () => {
    const userId = randomUUID();
    const email = `rollback.${Date.now()}.${Math.random().toString(36).slice(2, 6)}@lingora.test`;

    await createAuthUser(userId, email);

    const authClient = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: userId,
              email,
              email_confirmed_at: new Date().toISOString(),
              user_metadata: { display_name: 'Rollback User' },
            },
          },
          error: null,
        }),
      },
    };

    let accountInsertAttempted = false;
    let auditWriteAttempted = false;

    // Create an intercepting wrapper around prisma that intercepts tx.$executeRaw
    const interceptingPrisma = {
      account: prisma.account,
      $transaction: async (callback) => {
        return prisma.$transaction(async (tx) => {
          const proxiedTx = new Proxy(tx, {
            get(target, prop, receiver) {
              if (prop === '$executeRaw') {
                return async (strings, ...values) => {
                  const sql = Array.isArray(strings) ? strings.join('?') : String(strings);
                  if (sql.includes('INSERT INTO app.accounts')) {
                    // Let the real account insert proceed in this real PostgreSQL transaction
                    const res = await target.$executeRaw(strings, ...values);
                    accountInsertAttempted = true;
                    return res;
                  }
                  if (sql.includes('INSERT INTO app_private.audit_events')) {
                    auditWriteAttempted = true;
                    // Fail AFTER real account insert inside transaction
                    throw new Error('INJECTED_AUDIT_WRITE_FAILURE_AFTER_ACCOUNT_INSERT');
                  }
                  return target.$executeRaw(strings, ...values);
                };
              }
              return Reflect.get(target, prop, receiver);
            },
          });
          return callback(proxiedTx);
        });
      },
    };

    const result = await bootstrapLearnerAccount({ authClient, prisma: interceptingPrisma });

    // Assert that bootstrap failed closed with 503
    assert.equal(result.ok, false);
    assert.equal(result.status, 503);
    assert.equal(result.error?.code, 'SERVICE_UNAVAILABLE');

    // Assert that the account insert was executed before the failure was injected
    assert.equal(accountInsertAttempted, true, 'Real account insert must have run prior to audit error');
    assert.equal(auditWriteAttempted, true, 'Audit write must have been reached');

    // Confirm whole transaction rolled back in real PostgreSQL: NO Account
    const dbAccount = await prisma.account.findUnique({
      where: { id: userId },
    });
    assert.equal(dbAccount, null, 'Account must not exist in database after rollback');

    // Confirm whole transaction rolled back in real PostgreSQL: NO AuditEvent
    const auditEvents = await prisma.auditEvent.findMany({
      where: { verifiedAuthSubjectId: userId },
    });
    assert.equal(auditEvents.length, 0, 'No audit events must exist in database after rollback');
  });

  test('bootstrap is idempotent and converges via ON CONFLICT DO NOTHING without duplicating audit', async () => {
    const userId = randomUUID();
    const email = `idempotent.${Date.now()}@lingora.test`;

    await createAuthUser(userId, email);

    const authClient = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: userId,
              email,
              email_confirmed_at: new Date().toISOString(),
              user_metadata: { display_name: 'Lần 1' },
            },
          },
          error: null,
        }),
      },
    };

    const firstRun = await bootstrapLearnerAccount({ authClient, prisma });
    assert.equal(firstRun.ok, true);
    if (!firstRun.ok) return;
    assert.equal(firstRun.created, true);

    // Second call with different metadata attempt
    const authClientRetry = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: userId,
              email,
              email_confirmed_at: new Date().toISOString(),
              user_metadata: { display_name: 'Lần 2 - Đổi tên injection' },
            },
          },
          error: null,
        }),
      },
    };

    const secondRun = await bootstrapLearnerAccount({ authClient: authClientRetry, prisma });
    assert.equal(secondRun.ok, true);
    if (!secondRun.ok) return;
    assert.equal(secondRun.created, false);

    // Row in DB must be unchanged from first run
    const dbAccount = await prisma.account.findUnique({
      where: { id: userId },
    });
    assert.equal(dbAccount.displayName, 'Lần 1');
    assert.equal(dbAccount.rowVersion, 1n);

    // Audit events must contain exactly 1 event
    const auditEvents = await prisma.auditEvent.findMany({
      where: { verifiedAuthSubjectId: userId },
    });
    assert.equal(auditEvents.length, 1);
  });

  test('staff reservation in app_private.provisioning_requests blocks bootstrap by normalized email', async () => {
    const userId = randomUUID();
    const baseEmail = `reserved.teacher.${Date.now()}@lingora.test`;

    await createAuthUser(userId, baseEmail);

    // Create a staff reservation in app_private
    await prisma.provisioningRequest.create({
      data: {
        operationKey: randomUUID(),
        normalizedEmail: baseEmail.toLowerCase(),
        requestedRole: 'TEACHER',
        state: 'REQUESTED',
      },
    });

    const authClient = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: userId,
              email: baseEmail.toUpperCase(), // Mixed case to test normalization
              email_confirmed_at: new Date().toISOString(),
            },
          },
          error: null,
        }),
      },
    };

    const result = await bootstrapLearnerAccount({ authClient, prisma });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.status, 403);
    assert.equal(result.error?.code, 'FORBIDDEN');

    // Confirm no account was created
    const dbAccount = await prisma.account.findUnique({
      where: { id: userId },
    });
    assert.equal(dbAccount, null);
  });

  test('staff reservation blocks bootstrap by authUserId or providerCorrelationId', async () => {
    const userA = randomUUID();
    const userB = randomUUID();

    await createAuthUser(userA, `userA.${Date.now()}@lingora.test`);
    await createAuthUser(userB, `userB.${Date.now()}@lingora.test`);

    await prisma.provisioningRequest.create({
      data: {
        operationKey: randomUUID(),
        normalizedEmail: `other1.${Date.now()}@lingora.test`,
        requestedRole: 'TEACHER',
        authUserId: userA,
        state: 'REQUESTED',
      },
    });

    await prisma.provisioningRequest.create({
      data: {
        operationKey: randomUUID(),
        normalizedEmail: `other2.${Date.now()}@lingora.test`,
        requestedRole: 'ADMIN',
        providerCorrelationId: userB,
        state: 'REQUESTED',
      },
    });

    const clientA = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: userA,
              email: `userA.${Date.now()}@lingora.test`,
              email_confirmed_at: new Date().toISOString(),
            },
          },
          error: null,
        }),
      },
    };

    const clientB = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: userB,
              email: `userB.${Date.now()}@lingora.test`,
              email_confirmed_at: new Date().toISOString(),
            },
          },
          error: null,
        }),
      },
    };

    const resA = await bootstrapLearnerAccount({ authClient: clientA, prisma });
    assert.equal(resA.ok, false);
    assert.equal(resA.status, 403);

    const resB = await bootstrapLearnerAccount({ authClient: clientB, prisma });
    assert.equal(resB.ok, false);
    assert.equal(resB.status, 403);

    const accA = await prisma.account.findUnique({ where: { id: userA } });
    const accB = await prisma.account.findUnique({ where: { id: userB } });
    assert.equal(accA, null);
    assert.equal(accB, null);
  });

  test('staff private app_metadata marker rejects bootstrap and creates no account', async () => {
    const userId = randomUUID();
    const email = `staff.meta.${Date.now()}@lingora.test`;
    await createAuthUser(userId, email);

    const authClient = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: userId,
              email,
              email_confirmed_at: new Date().toISOString(),
              app_metadata: {
                ownedBy: 'lingora-provisioning',
                role: 'TEACHER',
              },
            },
          },
          error: null,
        }),
      },
    };

    const result = await bootstrapLearnerAccount({ authClient, prisma });
    assert.equal(result.ok, false);
    assert.equal(result.status, 403);
    assert.equal(result.error?.code, 'FORBIDDEN');

    const dbAccount = await prisma.account.findUnique({ where: { id: userId } });
    assert.equal(dbAccount, null);
  });

  test('existing DISABLED account is strictly not reactivated or altered by bootstrap', async () => {
    const userId = randomUUID();
    const email = `disabled.${Date.now()}@lingora.test`;
    await createAuthUser(userId, email);

    await prisma.account.create({
      data: {
        id: userId,
        role: 'LEARNER',
        status: 'DISABLED',
        displayName: 'Đã bị khóa',
        uiLocale: 'en',
      },
    });

    const authClient = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: userId,
              email,
              email_confirmed_at: new Date().toISOString(),
              user_metadata: { display_name: 'Hack Name' },
            },
          },
          error: null,
        }),
      },
    };

    const result = await bootstrapLearnerAccount({ authClient, prisma });
    assert.equal(result.ok, true);
    assert.equal(result.created, false);
    assert.equal(result.account.status, 'DISABLED');

    const dbAccount = await prisma.account.findUnique({ where: { id: userId } });
    assert.equal(dbAccount.status, 'DISABLED');
    assert.equal(dbAccount.displayName, 'Đã bị khóa');
  });

  test('existing TEACHER account is strictly not converted or altered by bootstrap', async () => {
    const userId = randomUUID();
    const email = `teacher.${Date.now()}@lingora.test`;
    await createAuthUser(userId, email);

    await prisma.account.create({
      data: {
        id: userId,
        role: 'TEACHER',
        status: 'ACTIVE',
        displayName: 'Thầy Giáo',
        uiLocale: 'en',
      },
    });

    const authClient = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: userId,
              email,
              email_confirmed_at: new Date().toISOString(),
            },
          },
          error: null,
        }),
      },
    };

    const result = await bootstrapLearnerAccount({ authClient, prisma });
    assert.equal(result.ok, true);
    assert.equal(result.created, false);
    assert.equal(result.account.role, 'TEACHER');

    const dbAccount = await prisma.account.findUnique({ where: { id: userId } });
    assert.equal(dbAccount.role, 'TEACHER');
  });
});
