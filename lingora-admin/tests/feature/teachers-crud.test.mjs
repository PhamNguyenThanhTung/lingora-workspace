import { teachersFixture } from './harness/teachers-fixture.mjs';
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';

let currentCookieStore = {
  getAll: () => [],
  get: () => undefined,
  set: () => {},
  delete: () => {},
};

mock.module('next/headers.js', {
  exports: {
    cookies: async () => currentCookieStore,
  },
});

let redirectHookTarget = null;
mock.module('next/navigation.js', {
  exports: {
    redirect: (url) => {
      redirectHookTarget = url;
      const err = new Error(`NEXT_REDIRECT:${url}`);
      err.digest = `NEXT_REDIRECT;${url}`;
      throw err;
    },
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
    usePathname: () => '/teachers',
  },
});

mock.module('server-only', {
  exports: {},
});

const {
  isValidUuid,
  normalizeUuid,
  getAppOrigin,
  createTeacherSchema,
  updateTeacherStatusSchema,
  activateTeacherSchema,
  listTeachers,
  updateTeacherStatus,
  provisionTeacher,
  verifyTeacherActivationEligibility,
  activateTeacherAccount,
} = await import('../../src/server/teachers/index.ts');

const {
  getPrivilegedSupabaseClient,
  setPrivilegedSupabaseForTest,
} = await import('../../src/server/auth/privileged.ts');

const { GET: getTeachersRoute, POST: postTeachersRoute } = await import('../../src/app/api/teachers/route.ts');
const { PATCH: patchTeacherRoute } = await import('../../src/app/api/teachers/[accountId]/route.ts');
const {
  GET: getActivationRoute,
  POST: postActivationRoute,
} = await import('../../src/app/api/auth/teacher-activation/route.ts');

const { setProductPrismaForTest } = await import('../../src/server/db/index.js');

function createMockSessionCookie(userId = '00000000-0000-4000-8000-000000000001', email = 'admin@lingora.edu.vn') {
  const payload = {
    sub: userId,
    email,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const access_token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    Buffer.from(JSON.stringify(payload)).toString('base64url') +
    '.signature';
  const sessionData = {
    access_token,
    refresh_token: 'valid-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: userId, email },
  };
  const cookieValue = 'base64-' + Buffer.from(JSON.stringify(sessionData)).toString('base64');
  return {
    name: 'sb-sncfyvpzwedqgwfpffkh-auth-token',
    value: cookieValue,
  };
}

describe('S4-TEACHERS: Validation & Canonical UUID Rules', () => {
  test('isValidUuid accepts standard UUIDs regardless of version/variant, and rejects invalid strings', () => {
    assert.equal(isValidUuid('00000000-0000-4000-8000-000000000001'), true);
    assert.equal(isValidUuid('11111111-2222-3333-4444-555555555555'), true);
    assert.equal(isValidUuid('AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE'), true);
    assert.equal(isValidUuid('invalid-uuid'), false);
    assert.equal(isValidUuid(''), false);
    assert.equal(isValidUuid('11111111-2222-3333-4444'), false);
  });

  test('normalizeUuid lowercases hex characters', () => {
    assert.equal(normalizeUuid('AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE'), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
  });

  test('createTeacherSchema trims email and rejects extra/override fields (Mutant B kill)', () => {
    const valid = createTeacherSchema.safeParse({
      email: '  teacher@lingora.edu.vn  ',
      displayName: 'Nguyễn Văn A',
    });
    assert.equal(valid.success, true);
    if (valid.success) {
      assert.equal(valid.data.email, 'teacher@lingora.edu.vn');
      assert.equal(valid.data.displayName, 'Nguyễn Văn A');
    }

    // Mutant B: payload attempting to override role or status
    const overrideAttempt = createTeacherSchema.safeParse({
      email: 'teacher@lingora.edu.vn',
      role: 'ADMIN',
      status: 'ACTIVE',
    });
    assert.equal(overrideAttempt.success, false, 'Mutant B: Extra fields (role/status) must reject validation');

    // Invalid email
    const invalidEmail = createTeacherSchema.safeParse({
      email: 'not-an-email',
    });
    assert.equal(invalidEmail.success, false);
  });

  test('updateTeacherStatusSchema enforces non-blank reason when disabling and rejects extra fields', () => {
    // Disable requires non-blank reason
    const disableValid = updateTeacherStatusSchema.safeParse({
      action: 'disable',
      reason: 'Vi phạm quy chế giảng dạy',
    });
    assert.equal(disableValid.success, true);

    const disableBlankReason = updateTeacherStatusSchema.safeParse({
      action: 'disable',
      reason: '   ',
    });
    assert.equal(disableBlankReason.success, false, 'Disable with blank reason must reject');

    const disableNoReason = updateTeacherStatusSchema.safeParse({
      action: 'disable',
    });
    assert.equal(disableNoReason.success, false, 'Disable with missing reason must reject');

    // Enable allows optional reason
    const enableWithoutReason = updateTeacherStatusSchema.safeParse({
      action: 'enable',
    });
    assert.equal(enableWithoutReason.success, true);

    // Reject extra payload fields
    const extraFields = updateTeacherStatusSchema.safeParse({
      action: 'enable',
      role: 'ADMIN',
    });
    assert.equal(extraFields.success, false, 'Extra fields must reject');
  });

  test('activation respects provider 72-byte UTF-8 password boundary before external effects', () => {
    assert.equal(activateTeacherSchema.safeParse({ password: 'a'.repeat(72) }).success, true);
    assert.equal(activateTeacherSchema.safeParse({ password: 'a'.repeat(73) }).success, false);
    assert.equal(activateTeacherSchema.safeParse({ password: 'é'.repeat(36) }).success, true);
    assert.equal(activateTeacherSchema.safeParse({ password: 'é'.repeat(37) }).success, false);
  });

  test('activateTeacherSchema validates password length >= 8 and rejects extra fields', () => {
    const valid = activateTeacherSchema.safeParse({ password: 'validPassword123' });
    assert.equal(valid.success, true);

    const tooShort = activateTeacherSchema.safeParse({ password: 'short' });
    assert.equal(tooShort.success, false);

    const extraFields = activateTeacherSchema.safeParse({
      password: 'validPassword123',
      role: 'ADMIN',
    });
    assert.equal(extraFields.success, false);
  });
});

describe('S4-TEACHERS: Environment Configuration & Origin Verification', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('getAppOrigin strictly enforces HTTPS except on localhost/127.0.0.1 HTTP', () => {
    process.env.LINGORA_APP_ORIGIN = 'http://localhost:3012';
    assert.equal(getAppOrigin(), 'http://localhost:3012');

    process.env.LINGORA_APP_ORIGIN = 'http://127.0.0.1:3000';
    assert.equal(getAppOrigin(), 'http://127.0.0.1:3000');

    process.env.LINGORA_APP_ORIGIN = 'https://admin.lingora.edu.vn';
    assert.equal(getAppOrigin(), 'https://admin.lingora.edu.vn');

    // Insecure HTTP on non-localhost domain rejected
    process.env.LINGORA_APP_ORIGIN = 'http://insecure-domain.com';
    assert.equal(getAppOrigin(), null);

    // Invalid format rejected
    process.env.LINGORA_APP_ORIGIN = 'not-a-url';
    assert.equal(getAppOrigin(), null);
  });
});

describe('S4-TEACHERS: Admin Auth Guard & Zero Writes Matrix (Mutant A kill)', () => {
  const ADMIN_ID = '00000000-0000-4000-8000-000000000001';
  const TEACHER_ID = '00000000-0000-4000-8000-000000000002';
  const INACTIVE_ADMIN_ID = '00000000-0000-4000-8000-000000000003';
  const TARGET_TEACHER_ID = '11111111-1111-4111-8111-111111111111';

  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.LINGORA_APP_ORIGIN = 'http://localhost:3012';
    globalThis.fetch = async (url) => {
      return new Response(
        JSON.stringify({
          id: ADMIN_ID,
          email: 'admin@lingora.edu.vn',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };
    setPrivilegedSupabaseForTest({
      auth: {
        admin: {
          createUser: async () => ({ data: { user: { id: 'mock' } }, error: null }),
          inviteUserByEmail: async () => ({ data: { user: { id: 'mock' } }, error: null }),
          deleteUser: async () => ({ error: null }),
        },
      },
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    setPrivilegedSupabaseForTest(null);
    setProductPrismaForTest(null);
    currentCookieStore = { getAll: () => [], get: () => undefined, set: () => {}, delete: () => {} };
  });

  test('GET /api/teachers rejects unauthenticated, teacher, and inactive accounts with zero writes (Mutant A kill)', async () => {
    let writeCount = 0;
    const mockPrisma = {
      account: {
        findUnique: async ({ where }) => {
          if (where.id === TEACHER_ID) {
            return { id: TEACHER_ID, role: 'TEACHER', status: 'ACTIVE', displayName: 'Giáo viên', uiLocale: 'vi' };
          }
          if (where.id === INACTIVE_ADMIN_ID) {
            return { id: INACTIVE_ADMIN_ID, role: 'ADMIN', status: 'DISABLED', displayName: 'Admin cũ', uiLocale: 'vi' };
          }
          return null;
        },
      },
      $queryRaw: async () => {
        writeCount++;
        return [];
      },
      $executeRaw: async () => {
        writeCount++;
        return 0;
      },
    };
    setProductPrismaForTest(mockPrisma);

    // 1. Unauthenticated
    currentCookieStore = { getAll: () => [] };
    const unauthReq = new Request('http://localhost:3012/api/teachers');
    const unauthRes = await getTeachersRoute(unauthReq);
    assert.equal(unauthRes.status, 401);
    assert.equal(writeCount, 0, 'Mutant A: Unauthenticated request must perform zero operations');

    // 2. Teacher (Forbidden)
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: TEACHER_ID, email: 'teacher@lingora.edu.vn' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    currentCookieStore = { getAll: () => [createMockSessionCookie(TEACHER_ID, 'teacher@lingora.edu.vn')] };
    const teacherReq = new Request('http://localhost:3012/api/teachers');
    const teacherRes = await getTeachersRoute(teacherReq);
    assert.equal(teacherRes.status, 403);
    assert.equal(writeCount, 0, 'Mutant A: Teacher request must perform zero operations');

    // 3. Inactive Admin (Forbidden)
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: INACTIVE_ADMIN_ID, email: 'inactive@lingora.edu.vn' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    currentCookieStore = { getAll: () => [createMockSessionCookie(INACTIVE_ADMIN_ID, 'inactive@lingora.edu.vn')] };
    const inactiveReq = new Request('http://localhost:3012/api/teachers');
    const inactiveRes = await getTeachersRoute(inactiveReq);
    assert.equal(inactiveRes.status, 403);
    assert.equal(writeCount, 0, 'Mutant A: Inactive account must perform zero operations');
  });

  test('POST /api/teachers and PATCH /api/teachers/[id] reject foreign origin and non-admins with zero writes', async () => {
    let writeCount = 0;
    const mockPrisma = {
      account: {
        findUnique: async ({ where }) => {
          if (where.id === TEACHER_ID) {
            return { id: TEACHER_ID, role: 'TEACHER', status: 'ACTIVE', displayName: 'Giáo viên', uiLocale: 'vi' };
          }
          return null;
        },
      },
      $executeRaw: async () => {
        writeCount++;
        return 0;
      },
    };
    setProductPrismaForTest(mockPrisma);

    // Foreign origin check on POST
    const foreignPostReq = new Request('http://localhost:3012/api/teachers', {
      method: 'POST',
      headers: {
        'Origin': 'https://attacker.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'new@lingora.edu.vn' }),
    });
    const foreignPostRes = await postTeachersRoute(foreignPostReq);
    assert.equal(foreignPostRes.status, 403);
    assert.equal(writeCount, 0);

    // Foreign origin check on PATCH
    const foreignPatchReq = new Request(`http://localhost:3012/api/teachers/${TARGET_TEACHER_ID}`, {
      method: 'PATCH',
      headers: {
        'Origin': 'https://attacker.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'disable', reason: 'violation' }),
    });
    const foreignPatchRes = await patchTeacherRoute(foreignPatchReq, { params: Promise.resolve({ accountId: TARGET_TEACHER_ID }) });
    assert.equal(foreignPatchRes.status, 403);
    assert.equal(writeCount, 0);

    // Teacher attempting POST mutation
    currentCookieStore = { getAll: () => [createMockSessionCookie(TEACHER_ID, 'teacher@lingora.edu.vn')] };
    const teacherPostReq = new Request('http://localhost:3012/api/teachers', {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3012',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'new@lingora.edu.vn' }),
    });
    const teacherPostRes = await postTeachersRoute(teacherPostReq);
    assert.equal(teacherPostRes.status, 403);
    assert.equal(writeCount, 0);
  });
});

describe('S4-TEACHERS: Teacher List & DTO Serialization', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    setProductPrismaForTest(null);
  });

  test('listTeachers uses parameterized LEFT JOIN selecting only TEACHER accounts and maps null emails explicitly', async () => {
    const mockTeachers = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        email: 'teacher1@lingora.edu.vn',
        displayName: 'Nguyễn Giáo Viên',
        role: 'TEACHER',
        status: 'ACTIVE',
        createdAt: new Date('2026-10-29T10:00:00Z'),
        activatedAt: new Date('2026-10-29T11:00:00Z'),
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        email: null, // Broken Auth identity (orphan)
        displayName: 'Giáo viên Không Định Danh',
        role: 'TEACHER',
        status: 'DISABLED',
        createdAt: new Date('2026-10-28T09:00:00Z'),
        activatedAt: null,
      },
    ];

    let executedQuery = false;
    const mockPrisma = {
      $queryRaw: async (query) => {
        executedQuery = true;
        return mockTeachers;
      },
    };

    const res = await listTeachers(mockPrisma);
    assert.equal(res.ok, true);
    assert.equal(executedQuery, true);
    assert.equal(res.data?.length, 2);
    assert.equal(res.data?.[0].email, 'teacher1@lingora.edu.vn');
    assert.equal(res.data?.[1].email, null);
    assert.equal(typeof res.data?.[0].createdAt, 'string');
    assert.equal(res.data?.[0].activatedAt, '2026-10-29T11:00:00.000Z');
    assert.equal(res.data?.[1].activatedAt, null);
  });
});

describe('S4-TEACHERS: Stateful provisioning, ownership and recovery', () => {
  const actor = '00000000-0000-4000-8000-000000000001';
  let f;
  beforeEach(() => { f = teachersFixture(); setPrivilegedSupabaseForTest(f.provider); process.env.LINGORA_APP_ORIGIN = 'http://localhost:3012'; });
  afterEach(() => { setPrivilegedSupabaseForTest(null); setProductPrismaForTest(null); });
  const provision = () => provisionTeacher(actor, { email: '  New.Teacher@example.test ', displayName: ' Test Teacher ' }, f.db);
  test('provisions one real matching PENDING identity, normalized email, immutable role and READY audit', async () => {
    const result = await provision();
    assert.equal(result.status, 201);
    assert.equal(result.data.createdAt, '2026-10-30T02:00:00.000Z');
    assert.equal(result.data.email, 'new.teacher@example.test');
    assert.equal(result.data.role, 'TEACHER'); assert.equal(result.data.status, 'PENDING');
    const request = [...f.state.requests.values()][0]; const user = f.state.users.get(result.data.id);
    assert.equal(request.authUserId, user.id); assert.equal(request.providerCorrelationId, user.id);
    assert.equal(user.app_metadata.operationKey, request.operationKey);
    assert.equal(request.state, 'READY'); assert.equal(f.calls.redirect, 'http://localhost:3012/activate-teacher');
    assert.equal(f.state.audits[0].actorKind, 'ACCOUNT'); assert.equal(f.state.audits[0].actorId, actor);
    assert.equal(JSON.stringify(result).includes('operationKey'), false);
    assert.equal((await provision()).status, 409); assert.equal(f.calls.create, 1); assert.equal(f.calls.invite, 1);
  });
  test('existing unconfirmed Auth-only user is never adopted, invited or deleted', async () => {
    const id = crypto.randomUUID(); f.state.users.set(id, { id, email: 'new.teacher@example.test', app_metadata: {} });
    const r = await provision(); assert.equal(r.status, 409); assert.equal(f.calls.create, 0); assert.equal(f.calls.invite, 0);
    assert.deepEqual(f.calls.delete, []); assert.equal(f.state.accounts.size, 0); assert.equal(f.state.requests.size, 0);
  });
  for (const fault of ['create', 'createTimeout', 'track', 'accountCreate', 'invite', 'inviteMismatch', 'ready', 'zeroReady', 'audit']) {
    test(`${fault} failure cannot report success; owned Auth/Account cleaned and ledger retries deterministically`, async () => {
      f.fail[fault] = true;
      const failed = await provision(); assert.equal(failed.ok, false); assert.notEqual(failed.status, 201);
      assert.equal(JSON.stringify(failed).includes('private-provider-canary'), false);
      assert.equal(f.state.accounts.size, 0); assert.equal(f.state.users.size, 0); assert.equal(f.state.audits.length, 0);
      const first = [...f.state.requests.values()][0]; assert.equal(first.state, 'FAILED_RETRYABLE');
      assert.equal(first.authUserId, null); f.fail[fault] = false;
      const retried = await provision(); assert.equal(retried.status, 201); assert.equal(retried.data.id, first.providerCorrelationId);
      assert.equal(f.state.requests.size, 1); assert.equal(f.state.users.size, 1); assert.equal(f.state.accounts.size, 1);
    });
  }
  for (const fault of ['deleteAuth', 'accountDelete', 'ledgerFailureWrite', 'inspect']) {
    test(`${fault} cleanup failure reports recovery required and preserves ownership evidence`, async () => {
      if (fault === 'inspect') { f.fail.invite = true; const original = f.provider.auth.admin.inviteUserByEmail; f.provider.auth.admin.inviteUserByEmail = async (...args) => { f.fail.inspect = true; return original(...args); }; }
      else { f.fail.invite = true; f.fail[fault] = true; }
      const r = await provision(); assert.equal(r.ok, false); assert.equal(r.error.code, 'RECOVERY_REQUIRED');
      assert.ok([...f.state.requests.values()][0].providerCorrelationId);
      assert.equal(f.state.users.size, fault === 'ledgerFailureWrite' ? 0 : 1);
      if (fault === 'accountDelete') { assert.equal(f.state.accounts.size, 1); assert.deepEqual(f.calls.delete, []); }
      if (fault === 'accountDelete') {
        f.fail.invite = false; f.fail[fault] = false;
        assert.equal((await provision()).status, 201, 'proven owned leftovers can recover without adopting unrelated users');
      }
    });
  }
  test('in-flight request is not taken over; failed CAS is a conflict with zero external mutation', async () => {
    f.fail.accountCreate = true; await provision(); f.fail.accountCreate = false;
    const request = [...f.state.requests.values()][0]; request.state = 'REQUESTED';
    const before = f.calls.create; assert.equal((await provision()).status, 409); assert.equal(f.calls.create, before);
    request.state = 'FAILED_RETRYABLE'; f.fail.claim = true;
    assert.equal((await provision()).status, 409); assert.equal(f.calls.create, before);
  });
  test('ownership mismatch never changes or deletes an unrelated identity', async () => {
    f.fail.accountDelete = true; f.fail.invite = true; await provision();
    const user = [...f.state.users.values()][0]; user.app_metadata.operationKey = crypto.randomUUID();
    f.fail.accountDelete = false; f.fail.invite = false; const before = f.calls.delete.length;
    const r = await provision(); assert.equal(r.error.code, 'RECOVERY_REQUIRED');
    assert.equal(f.calls.delete.length, before); assert.equal(f.state.users.has(user.id), true);
  });
  test('activated or non-Teacher leftovers cannot be compensated or converted', async () => {
    f.fail.accountDelete = true; f.fail.invite = true; await provision();
    const account = [...f.state.accounts.values()][0]; account.role = 'ADMIN'; account.status = 'ACTIVE'; account.activatedAt = new Date();
    f.fail.accountDelete = false; f.fail.invite = false; const before = f.calls.delete.length;
    const r = await provision(); assert.equal(r.error.code, 'RECOVERY_REQUIRED'); assert.equal(f.calls.delete.length, before);
    assert.equal(f.state.accounts.get(account.id).role, 'ADMIN');
  });
  test('app-only owned plan is rejected rather than silently recreating Auth', async () => {
    f.fail.accountDelete = true; f.fail.invite = true; await provision(); f.state.users.clear();
    f.fail.accountDelete = false; f.fail.invite = false; const before = f.calls.create;
    const r = await provision(); assert.equal(r.ok, false); assert.equal(f.calls.create, before); assert.equal(f.state.accounts.size, 1);
  });
  test('concurrent normalized-email creates produce one owned identity and one conflict', async () => {
    const results = await Promise.all([provision(), provision()]);
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
    assert.equal(f.state.users.size, 1); assert.equal(f.state.accounts.size, 1); assert.equal(f.calls.create, 1);
  });
  test('retry cannot race an in-flight compensation deleting the planned identity', { timeout: 2000 }, async () => {
    f.fail.invite = true;
    let release, started;
    const held = new Promise(resolve => { release = resolve; });
    const deleting = new Promise(resolve => { started = resolve; });
    const original = f.provider.auth.admin.deleteUser;
    f.provider.auth.admin.deleteUser = async (...args) => { started(); await held; return original(...args); };
    const first = provision(); await deleting;
    try {
      assert.equal((await provision()).status, 409); assert.equal(f.calls.create, 1);
    } finally { release(); }
    assert.equal((await first).ok, false); assert.equal(f.state.users.size, 0);
    f.fail.invite = false; assert.equal((await provision()).status, 201);
  });
  test('missing configuration is unavailable before any business/provider write', async () => {
    delete process.env.LINGORA_APP_ORIGIN; assert.equal((await provision()).status, 503);
    assert.equal(f.state.requests.size, 0); assert.equal(f.calls.create, 0);
  });
});

describe('S4-TEACHERS: Status Transition & Row Version / Audit Mechanics (Mutant C kill)', () => {
  const ADMIN_ID = '00000000-0000-4000-8000-000000000001';
  const TEACHER_ID = '11111111-1111-4111-8111-111111111111';

  afterEach(() => {
    setProductPrismaForTest(null);
  });

  test('updateTeacherStatus rejects transition from PENDING with 409 INVALID_TRANSITION', async () => {
    const mockPrisma = {
      $transaction: async (fn) => {
        const tx = {
          $queryRaw: async () => [
            {
              id: TEACHER_ID,
              role: 'TEACHER',
              status: 'PENDING',
              authId: TEACHER_ID,
              email: 'teacher@lingora.edu.vn',
              rowVersion: 1n,
              createdAt: new Date(),
              activatedAt: null,
            },
          ],
        };
        return fn(tx);
      },
    };

    const res = await updateTeacherStatus(ADMIN_ID, TEACHER_ID, { action: 'enable' }, mockPrisma);
    assert.equal(res.ok, false);
    assert.equal(res.status, 409);
    assert.equal(res.error?.code, 'INVALID_TRANSITION');
  });

  test('updateTeacherStatus is idempotent: requesting same active/disabled status returns 200 without version bump or audit', async () => {
    let executeRawCalled = false;
    const mockPrisma = {
      $transaction: async (fn) => {
        const tx = {
          $queryRaw: async () => [
            {
              id: TEACHER_ID,
              role: 'TEACHER',
              status: 'ACTIVE',
              authId: TEACHER_ID,
              email: 'teacher@lingora.edu.vn',
              rowVersion: 1n,
              createdAt: new Date(),
              activatedAt: new Date(),
            },
          ],
          $executeRaw: async () => {
            executeRawCalled = true;
            return 1;
          },
        };
        return fn(tx);
      },
    };

    const res = await updateTeacherStatus(ADMIN_ID, TEACHER_ID, { action: 'enable' }, mockPrisma);
    assert.equal(res.ok, true);
    assert.equal(res.status, 200);
    assert.equal(res.data?.status, 'ACTIVE');
    assert.equal(executeRawCalled, false, 'Idempotent call must not trigger updates or audit writes');
  });

  test('updateTeacherStatus ACTIVE -> DISABLED updates status, increments row_version, and inserts AuditEvent (Mutant C kill)', async () => {
    let updateQueryExecuted = false;
    let auditEventInserted = false;

    const mockPrisma = {
      $transaction: async (fn) => {
        const tx = {
          $queryRaw: async () => [
            {
              id: TEACHER_ID,
              role: 'TEACHER',
              status: 'ACTIVE',
              authId: TEACHER_ID,
              email: 'teacher@lingora.edu.vn',
              rowVersion: 1n,
              createdAt: new Date(),
              activatedAt: new Date(),
            },
          ],
          $executeRaw: async (query) => {
            const text =
              typeof query === 'string'
                ? query
                : query?.text || (query?.strings ? query.strings.join('?') : String(query));
            if (text.includes('UPDATE app.accounts')) {
              updateQueryExecuted = true;
            }
            if (text.includes('INSERT INTO app_private.audit_events')) {
              auditEventInserted = true;
            }
            return 1;
          },
        };
        return fn(tx);
      },
    };

    const res = await updateTeacherStatus(
      ADMIN_ID,
      TEACHER_ID,
      { action: 'disable', reason: 'Tạm ngưng công tác' },
      mockPrisma
    );

    assert.equal(res.ok, true);
    assert.equal(res.status, 200);
    assert.equal(res.data?.status, 'DISABLED');
    assert.equal(updateQueryExecuted, true, 'Mutant C: Account status must be updated in database');
    assert.equal(auditEventInserted, true, 'Mutant C: Audit event must be recorded');
  });

  test('updateTeacherStatus DISABLED -> ACTIVE preserves activatedAt timestamp', async () => {
    const originalActivatedAt = new Date('2026-10-01T12:00:00Z');
    const mockPrisma = {
      $transaction: async (fn) => {
        const tx = {
          $queryRaw: async () => [
            {
              id: TEACHER_ID,
              role: 'TEACHER',
              status: 'DISABLED',
              authId: TEACHER_ID,
              email: 'teacher@lingora.edu.vn',
              rowVersion: 2n,
              createdAt: new Date('2026-09-01T12:00:00Z'),
              activatedAt: originalActivatedAt,
            },
          ],
          $executeRaw: async () => 1,
        };
        return fn(tx);
      },
    };

    const res = await updateTeacherStatus(ADMIN_ID, TEACHER_ID, { action: 'enable' }, mockPrisma);
    assert.equal(res.ok, true);
    assert.equal(res.data?.status, 'ACTIVE');
    assert.equal(res.data?.activatedAt, originalActivatedAt.toISOString(), 'activatedAt must be preserved on re-enable');
  });

  test('updateTeacherStatus rejects orphan account without Auth identity', async () => {
    const mockPrisma = {
      $transaction: async (fn) => {
        const tx = {
          $queryRaw: async () => [
            {
              id: TEACHER_ID,
              role: 'TEACHER',
              status: 'ACTIVE',
              authId: null, // Missing Auth identity
              email: null,
            },
          ],
        };
        return fn(tx);
      },
    };

    const res = await updateTeacherStatus(ADMIN_ID, TEACHER_ID, { action: 'disable', reason: 'orphan' }, mockPrisma);
    assert.equal(res.ok, false);
    assert.equal(res.status, 409);
    assert.equal(res.error?.code, 'ORPHAN_ACCOUNT');
  });
});

describe('S4-TEACHERS: Staff Identity Enforcement Across Disable/Enable Lifecycle', () => {
  const TEACHER_USER_ID = '44444444-4444-4444-8444-444444444444';
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: TEACHER_USER_ID, email: 'teacher.active@lingora.edu.vn' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    setProductPrismaForTest(null);
  });

  test('real verifyStaffIdentity rejects same valid Teacher session after disable and allows after enable', async () => {
    const { verifyStaffIdentity } = await import('../../src/server/auth/index.ts');

    let currentStatus = 'ACTIVE';

    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: TEACHER_USER_ID,
          role: 'TEACHER',
          status: currentStatus,
          displayName: 'Giáo Viên A',
          uiLocale: 'vi',
        }),
      },
    };

    const cookieStore = {
      getAll: () => [createMockSessionCookie(TEACHER_USER_ID, 'teacher.active@lingora.edu.vn')],
    };

    // 1. Initial ACTIVE status: verifyStaffIdentity allows holding access
    const res1 = await verifyStaffIdentity({
      cookieStore,
      prisma: mockPrisma,
      requiredRole: 'TEACHER',
    });
    assert.equal(res1.ok, true);
    if (res1.ok) {
      assert.equal(res1.account.status, 'ACTIVE');
    }

    // 2. Transition ACTIVE -> DISABLED: same valid session now rejected with 403 ACCOUNT_INACTIVE
    currentStatus = 'DISABLED';
    const res2 = await verifyStaffIdentity({
      cookieStore,
      prisma: mockPrisma,
      requiredRole: 'TEACHER',
    });
    assert.equal(res2.ok, false);
    if (!res2.ok) {
      assert.equal(res2.status, 403);
      assert.equal(res2.error.code, 'ACCOUNT_INACTIVE');
    }

    // 3. Transition DISABLED -> ACTIVE: same session immediately restored to eligible
    currentStatus = 'ACTIVE';
    const res3 = await verifyStaffIdentity({
      cookieStore,
      prisma: mockPrisma,
      requiredRole: 'TEACHER',
    });
    assert.equal(res3.ok, true);
    if (res3.ok) {
      assert.equal(res3.account.status, 'ACTIVE');
    }
  });
});

describe('S4-TEACHERS: First-Use Teacher Password Activation', () => {
  const TEACHER_AUTH_ID = '33333333-3333-4333-8333-333333333333';

  afterEach(() => {
    setProductPrismaForTest(null);
  });

  test('verifyTeacherActivationEligibility approves eligible PENDING Teacher with READY request', async () => {
    const mockPrisma = {
      $queryRaw: async () => [
        {
          id: TEACHER_AUTH_ID,
          role: 'TEACHER',
          status: 'PENDING',
          displayName: 'Thầy Hùng',
          email: 'teacher.hung@lingora.edu.vn',
          provisioningState: 'READY', requestedRole: 'TEACHER', emailConfirmedAt: new Date(),
        },
      ],
    };

    const res = await verifyTeacherActivationEligibility(TEACHER_AUTH_ID, mockPrisma);
    assert.equal(res.ok, true);
    assert.equal(res.data?.email, 'teacher.hung@lingora.edu.vn');
    assert.equal(res.data?.displayName, 'Thầy Hùng');
  });

  test('verifyTeacherActivationEligibility rejects already ACTIVE account with 409 ALREADY_ACTIVE', async () => {
    const mockPrisma = {
      $queryRaw: async () => [
        {
          id: TEACHER_AUTH_ID,
          role: 'TEACHER',
          status: 'ACTIVE',
          email: 'teacher.hung@lingora.edu.vn',
          provisioningState: 'READY', requestedRole: 'TEACHER', emailConfirmedAt: new Date(),
        },
      ],
    };

    const res = await verifyTeacherActivationEligibility(TEACHER_AUTH_ID, mockPrisma);
    assert.equal(res.ok, false);
    assert.equal(res.status, 409);
    assert.equal(res.error?.code, 'ALREADY_ACTIVE');
  });

  test('activateTeacherAccount sets password via user client and transitions Account to ACTIVE with audit', async () => {
    let passwordUpdatedByAuth = false;
    let accountStatusUpdated = false;
    let auditEventActorSubject = null;

    const mockAuthClient = {
      auth: {
        updateUser: async ({ password }) => {
          passwordUpdatedByAuth = true;
          return { error: null };
        },
      },
    };

    const mockPrisma = {
      $queryRaw: async () => [
        {
          id: TEACHER_AUTH_ID,
          role: 'TEACHER',
          status: 'PENDING',
          displayName: 'Thầy Hùng',
          email: 'teacher.hung@lingora.edu.vn',
          provisioningState: 'READY', requestedRole: 'TEACHER', emailConfirmedAt: new Date(),
        },
      ],
      $transaction: async (fn) => {
        const tx = {
          $queryRaw: async () => [
            {
              id: TEACHER_AUTH_ID,
              role: 'TEACHER',
              status: 'PENDING',
              provisioningState: 'READY', requestedRole: 'TEACHER', emailConfirmedAt: new Date(),
              rowVersion: 1n,
            },
          ],
          $executeRaw: async (query) => {
            const q = String(query);
            if (q.includes('UPDATE app.accounts') && q.includes('status = \'ACTIVE\'')) {
              accountStatusUpdated = true;
            }
            if (q.includes('INSERT INTO app_private.audit_events') && q.includes('VERIFIED_AUTH_SUBJECT')) {
              auditEventActorSubject = true;
            }
            return 1;
          },
        };
        return fn(tx);
      },
    };

    const res = await activateTeacherAccount(TEACHER_AUTH_ID, 'mySecretPassword123!', mockAuthClient, mockPrisma);
    assert.equal(res.ok, true);
    assert.equal(res.status, 200);
    assert.equal(res.redirect, '/holding');
    assert.equal(passwordUpdatedByAuth, true, 'Password must be set via user auth client');
    assert.equal(accountStatusUpdated, true, 'Account status must be committed as ACTIVE');
    assert.equal(auditEventActorSubject, true, 'Audit event must record VERIFIED_AUTH_SUBJECT');
  });
});

describe('S4-TEACHERS: Production Page Wiring & Redirection Rules', () => {
  const ADMIN_ID = '00000000-0000-4000-8000-000000000001';
  const TEACHER_ID = '00000000-0000-4000-8000-000000000002';
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    setProductPrismaForTest(null);
    currentCookieStore = { getAll: () => [], get: () => undefined, set: () => {}, delete: () => {} };
  });

  test('TeachersPage redirects unauthenticated to /login and Teacher to /holding', async () => {
    const { compileAndLoadPage } = await import('./harness/load-production-pages.mjs');
    const TeachersPage = await compileAndLoadPage('src/app/teachers/page.tsx');

    // Unauthenticated: redirects to /login
    currentCookieStore = { getAll: () => [] };
    redirectHookTarget = null;
    try {
      await TeachersPage();
    } catch {}
    assert.equal(redirectHookTarget, '/login');

    // Teacher: redirects to /holding
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: TEACHER_ID, email: 'teacher@lingora.edu.vn' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    currentCookieStore = { getAll: () => [createMockSessionCookie(TEACHER_ID, 'teacher@lingora.edu.vn')] };
    setProductPrismaForTest({
      account: {
        findUnique: async () => ({ id: TEACHER_ID, role: 'TEACHER', status: 'ACTIVE', displayName: 'Cô Lan', uiLocale: 'vi' }),
      },
    });

    redirectHookTarget = null;
    try {
      await TeachersPage();
    } catch {}
    assert.equal(redirectHookTarget, '/holding');
  });

  test('TeachersPage active Admin renders AppShell with TeachersCatalog', async () => {
    const { compileAndLoadPage } = await import('./harness/load-production-pages.mjs');
    const TeachersPage = await compileAndLoadPage('src/app/teachers/page.tsx');

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: ADMIN_ID, email: 'admin@lingora.edu.vn' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    currentCookieStore = { getAll: () => [createMockSessionCookie(ADMIN_ID, 'admin@lingora.edu.vn')] };

    setProductPrismaForTest({
      account: {
        findUnique: async () => ({ id: ADMIN_ID, role: 'ADMIN', status: 'ACTIVE', displayName: 'Quản trị viên', uiLocale: 'vi' }),
      },
      $queryRaw: async () => [
        {
          id: '11111111-1111-4111-8111-111111111111',
          email: 'teacher1@lingora.edu.vn',
          displayName: 'Giáo Viên 1',
          role: 'TEACHER',
          status: 'ACTIVE',
          createdAt: new Date(),
          activatedAt: new Date(),
        },
      ],
    });

    const jsx = await TeachersPage();
    assert.ok(jsx, 'Page must return JSX');
    assert.equal(jsx.props?.account?.role, 'ADMIN');
    assert.equal(jsx.props?.children?.props?.initialTeachers?.length, 1);
  });
});

describe('S4-TEACHERS: Independent lifecycle, activation races and route contracts', () => {
  const actor = '00000000-0000-4000-8000-000000000001';
  let f, id;
  const originalFetch = globalThis.fetch;
  beforeEach(async () => {
    f = teachersFixture(); setPrivilegedSupabaseForTest(f.provider);
    process.env.LINGORA_APP_ORIGIN = 'http://localhost:3012';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    const created = await provisionTeacher(actor, { email: 'owned@example.test' }, f.db);
    assert.equal(created.status, 201); id = created.data.id;
    f.state.users.get(id).email_confirmed_at = new Date().toISOString();
    f.state.audits = []; f.calls.business = 0;
  });
  afterEach(() => { globalThis.fetch = originalFetch; setProductPrismaForTest(null); setPrivilegedSupabaseForTest(null); currentCookieStore = { getAll: () => [] }; });
  test('two simultaneous first-use requests change password once, never after ACTIVE', async () => {
    const results = await Promise.all([activateTeacherAccount(id, 'new-password1', f.session(id), f.db), activateTeacherAccount(id, 'new-password2', f.session(id), f.db)]);
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]); assert.equal(f.calls.password, 1);
    assert.equal(f.state.accounts.get(id).status, 'ACTIVE'); assert.equal(f.state.audits.length, 1);
    assert.equal(f.state.audits[0].actorKind, 'VERIFIED_AUTH_SUBJECT');
    assert.equal((await activateTeacherAccount(id, 'third-password', f.session(id), f.db)).status, 409);
    assert.equal(f.calls.password, 1);
  });
  for (const state of ['ADMIN', 'LEARNER', 'DISABLED', 'ACTIVE', 'UNCONFIRMED', 'UNREADY', 'WRONG_LEDGER_ROLE', 'MISSING']) {
    test(`activation ${state} rejects before user-scoped password call`, async () => {
      const account = f.state.accounts.get(id); const request = [...f.state.requests.values()][0];
      if (state === 'ADMIN' || state === 'LEARNER') account.role = state;
      else if (state === 'DISABLED' || state === 'ACTIVE') account.status = state;
      else if (state === 'UNCONFIRMED') f.state.users.get(id).email_confirmed_at = null;
      else if (state === 'UNREADY') request.state = 'IDENTITY_CREATED';
      else if (state === 'WRONG_LEDGER_ROLE') request.requestedRole = 'ADMIN';
      else f.state.accounts.delete(id);
      const r = await activateTeacherAccount(id, 'new-password', f.session(id), f.db);
      assert.equal(r.ok, false); assert.equal(f.calls.password, 0); assert.equal(f.state.audits.length, 0);
    });
  }
  for (const fault of ['password', 'passwordThrow', 'audit', 'zeroActivation']) {
    test(`activation ${fault} failure leaves PENDING, no successful audit or raw provider leak`, async () => {
      f.fail[fault] = true;
      const r = await activateTeacherAccount(id, 'new-password', f.session(id), f.db);
      assert.equal(r.ok, false); assert.equal(f.state.accounts.get(id).status, 'PENDING');
      assert.equal(f.state.audits.length, 0); assert.equal(JSON.stringify(r).includes('private-provider-canary'), false);
      if (fault === 'audit' || fault === 'zeroActivation') assert.equal(r.error.code, 'ACTIVATION_RETRY_REQUIRED');
    });
  }
  test('persisted disable/re-enable gates the same valid session through real staff verification', async () => {
    const { verifyStaffIdentity } = await import('../../src/server/auth/index.ts');
    await activateTeacherAccount(id, 'new-password', f.session(id), f.db);
    const activatedAt = f.state.accounts.get(id).activatedAt.toISOString();
    const session = f.session(id); const verify = () => verifyStaffIdentity({ authClient: session, prisma: f.db, requiredRole: 'TEACHER' });
    assert.equal((await verify()).ok, true);
    const disabled = await updateTeacherStatus(actor, id.toUpperCase(), { action: 'disable', reason: 'Test suspension' }, f.db);
    assert.equal(disabled.status, 200); assert.equal(f.state.accounts.get(id).status, 'DISABLED');
    assert.equal((await verify()).error.code, 'ACCOUNT_INACTIVE');
    const version = f.state.accounts.get(id).rowVersion, audits = f.state.audits.length;
    assert.equal((await updateTeacherStatus(actor, id, { action: 'disable', reason: 'Repeated' }, f.db)).status, 200);
    assert.equal(f.state.accounts.get(id).rowVersion, version); assert.equal(f.state.audits.length, audits);
    assert.equal((await updateTeacherStatus(actor, id, { action: 'enable' }, f.db)).status, 200);
    assert.equal((await verify()).ok, true); assert.equal(f.state.accounts.get(id).activatedAt.toISOString(), activatedAt);
  });
  for (const fault of ['audit', 'zeroStatus']) {
    test(`status ${fault} rejects and rolls back the persisted transition`, async () => {
      f.state.accounts.get(id).status = 'ACTIVE'; f.fail[fault] = true;
      const r = await updateTeacherStatus(actor, id, { action: 'disable', reason: 'test' }, f.db);
      assert.equal(r.ok, false); assert.equal(f.state.accounts.get(id).status, 'ACTIVE'); assert.equal(f.state.audits.length, 0);
    });
  }
  test('arbitrary IDs cannot mutate Admin, Learner, self, missing or pending targets', async () => {
    for (const role of ['ADMIN', 'LEARNER']) {
      f.state.accounts.get(id).role = role;
      assert.equal((await updateTeacherStatus(actor, id, { action: 'disable', reason: 'test' }, f.db)).status, 409);
      assert.equal(f.state.accounts.get(id).role, role);
    }
    assert.equal((await updateTeacherStatus(actor, actor, { action: 'enable' }, f.db)).status, 409);
    assert.equal((await updateTeacherStatus(actor, crypto.randomUUID(), { action: 'enable' }, f.db)).status, 404);
    assert.equal((await updateTeacherStatus(actor, 'bad-id', { action: 'enable' }, f.db)).status, 400);
    f.state.accounts.get(id).role = 'TEACHER';
    assert.equal((await updateTeacherStatus(actor, id, { action: 'disable', reason: 'test' }, f.db)).status, 409);
  });
  test('list query excludes non-Teachers and exposes only allowed DTO fields', async () => {
    f.state.accounts.set(actor, { id: actor, role: 'ADMIN', status: 'ACTIVE', createdAt: new Date(), password: 'never-return' });
    const r = await listTeachers(f.db); assert.equal(r.status, 200); assert.equal(r.data.length, 1);
    assert.deepEqual(Object.keys(r.data[0]).sort(), ['activatedAt', 'createdAt', 'displayName', 'email', 'id', 'role', 'status']);
  });
  test('all management methods reject unauthenticated/Teacher/inactive Admin before business or provider effects', async () => {
    setProductPrismaForTest(f.db);
    for (const kind of ['UNAUTHENTICATED', 'TEACHER', 'DISABLED_ADMIN']) {
      const account = f.state.accounts.get(id); account.role = kind === 'DISABLED_ADMIN' ? 'ADMIN' : 'TEACHER'; account.status = kind === 'DISABLED_ADMIN' ? 'DISABLED' : 'ACTIVE';
      globalThis.fetch = async () => Response.json(f.state.users.get(id));
      currentCookieStore = { getAll: () => kind === 'UNAUTHENTICATED' ? [] : [createMockSessionCookie(id, 'owned@example.test')] };
      const business = f.calls.business, creates = f.calls.create, invites = f.calls.invite;
      const headers = { origin: 'http://localhost:3012', host: 'localhost:3012', 'content-type': 'application/json' };
      const req = (path, method, body) => new Request('http://localhost:3012' + path, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
      const results = [await getTeachersRoute(req('/api/teachers', 'GET')), await postTeachersRoute(req('/api/teachers', 'POST', { email: 'other@example.test' })),
        await patchTeacherRoute(req('/api/teachers/' + id, 'PATCH', { action: 'disable', reason: 'attack' }), { params: Promise.resolve({ accountId: id }) })];
      assert.deepEqual(results.map(r => r.status), Array(3).fill(kind === 'UNAUTHENTICATED' ? 401 : 403));
      assert.equal(f.calls.business, business); assert.equal(f.calls.create, creates); assert.equal(f.calls.invite, invites);
    }
  });
  test('valid Admin API creates pending Teacher and strictly rejects all identity/role/status overrides', async () => {
    f.state.accounts.set(actor, { id: actor, role: 'ADMIN', status: 'ACTIVE', uiLocale: 'en' });
    setProductPrismaForTest(f.db); globalThis.fetch = async () => Response.json({ id: actor });
    currentCookieStore = { getAll: () => [createMockSessionCookie(actor)] };
    const request = body => new Request('http://localhost:3012/api/teachers', { method: 'POST', headers: { origin: 'http://localhost:3012', host: 'localhost:3012', 'content-type': 'application/json' }, body: JSON.stringify(body) });
    for (const extra of [{ role: 'ADMIN' }, { status: 'ACTIVE' }, { id: actor }, { password: 'illegal' }, { metadata: {} }]) {
      const before = f.calls.create; const r = await postTeachersRoute(request({ email: 'strict@example.test', ...extra })); assert.equal(r.status, 400); assert.equal(f.calls.create, before);
    }
    const created = await postTeachersRoute(request({ email: '  Fresh.Teacher@example.test ', displayName: ' ' }));
    assert.equal(created.status, 201); assert.ok(created.headers.get('cache-control').includes('no-store'));
    const dto = (await created.json()).data; assert.equal(dto.email, 'fresh.teacher@example.test'); assert.equal(dto.displayName, null); assert.equal(dto.role, 'TEACHER'); assert.equal(dto.status, 'PENDING');
    assert.equal((await postTeachersRoute(request({ email: 'fresh.teacher@example.test' }))).status, 409);
  });
  test('activation API verifies fresh Auth identity and never accepts target/role overrides', async () => {
    setProductPrismaForTest(f.db); currentCookieStore = { getAll: () => [createMockSessionCookie(id, 'owned@example.test')] };
    globalThis.fetch = async () => Response.json(f.state.users.get(id));
    const get = await getActivationRoute(new Request('http://localhost:3012/api/auth/teacher-activation'));
    assert.equal(get.status, 200); assert.deepEqual(Object.keys(await get.json()).sort(), ['displayName', 'email', 'ok']);
    const post = body => new Request('http://localhost:3012/api/auth/teacher-activation', { method: 'POST', headers: { origin: 'http://localhost:3012', host: 'localhost:3012', 'content-type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal((await postActivationRoute(post({ password: 'new-password', accountId: actor }))).status, 400);
    f.state.users.get(id).email_confirmed_at = null; assert.equal((await getActivationRoute(new Request('http://localhost:3012/api/auth/teacher-activation'))).status, 403);
    currentCookieStore = { getAll: () => [] }; assert.equal((await postActivationRoute(post({ password: 'new-password' }))).status, 401);
  });
});
