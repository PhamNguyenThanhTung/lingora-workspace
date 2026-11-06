import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

mock.module('server-only', { exports: {} });

let currentCookieStore = {
  getAll: () => [],
  get: () => undefined,
  set: () => {},
  delete: () => {},
};

let redirectTarget = null;

mock.module('next/headers.js', {
  exports: {
    cookies: async () => currentCookieStore,
  },
});

mock.module('next/navigation.js', {
  exports: {
    redirect: (target) => {
      redirectTarget = target;
      throw new Error(`REDIRECT:${target}`);
    },
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
    usePathname: () => '/audit-events',
  },
});

const { setProductPrismaForTest } = await import('../../src/server/db/index.js');
const { compileAndLoadPage } = await import('./harness/load-production-pages.mjs');

const ADMIN_ID = '00000000-0000-4000-8000-000000000001';
const TEACHER_ID = '00000000-0000-4000-8000-000000000002';
const LEARNER_ID = '00000000-0000-4000-8000-000000000003';
const DISABLED_ADMIN_ID = '00000000-0000-4000-8000-000000000004';

function createMockSessionCookie(userId, email = `${userId}@lingora.test`) {
  const payload = { sub: userId, email, exp: Math.floor(Date.now() / 1000) + 3600 };
  const session = {
    access_token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`,
    refresh_token: 'test-refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: payload.exp,
    user: { id: userId, email },
  };
  return {
    name: 'sb-test-project-ref-auth-token',
    value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`,
  };
}

describe('Audit Events Page Wiring: /audit-events/page.tsx', () => {
  let AuditEventsPage;
  let auditReadCount = 0;
  const originalFetch = globalThis.fetch;

  beforeEach(async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project-ref.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    redirectTarget = null;
    auditReadCount = 0;

    AuditEventsPage = await compileAndLoadPage('src/app/audit-events/page.tsx');
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    setProductPrismaForTest(null);
    currentCookieStore = { getAll: () => [], get: () => undefined, set: () => {}, delete: () => {} };
  });

  test('anonymous visitor is redirected to /login before any audit read', async () => {
    currentCookieStore = { getAll: () => [] };

    setProductPrismaForTest({
      $queryRaw: async () => {
        auditReadCount++;
        return [];
      },
    });

    try {
      await AuditEventsPage();
    } catch {}

    assert.equal(redirectTarget, '/login');
    assert.equal(auditReadCount, 0, 'Must make zero audit queries for anonymous visitors');
  });

  test('Teacher role renders AccessDeniedView with zero audit reads', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: TEACHER_ID, email: 'teacher@lingora.test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    currentCookieStore = {
      getAll: () => [createMockSessionCookie(TEACHER_ID)],
    };

    setProductPrismaForTest({
      account: {
        findUnique: async () => ({
          id: TEACHER_ID,
          role: 'TEACHER',
          status: 'ACTIVE',
          displayName: 'Teacher User',
          uiLocale: 'vi',
        }),
      },
      $queryRaw: async () => {
        auditReadCount++;
        return [];
      },
    });

    const jsx = await AuditEventsPage();
    assert.equal(auditReadCount, 0, 'Must make zero audit queries for Teacher');
    assert.ok(jsx, 'Must render a component');
    // AccessDeniedView is rendered
    assert.equal(jsx.type?.name, 'AccessDeniedView');
  });

  test('Learner role renders AccessDeniedView with zero audit reads', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_ID, email: 'learner@lingora.test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    currentCookieStore = {
      getAll: () => [createMockSessionCookie(LEARNER_ID)],
    };

    setProductPrismaForTest({
      account: {
        findUnique: async () => ({
          id: LEARNER_ID,
          role: 'LEARNER',
          status: 'ACTIVE',
          displayName: 'Learner User',
          uiLocale: 'vi',
        }),
      },
      $queryRaw: async () => {
        auditReadCount++;
        return [];
      },
    });

    const jsx = await AuditEventsPage();
    assert.equal(auditReadCount, 0, 'Must make zero audit queries for Learner');
    assert.equal(jsx.type?.name, 'AccessDeniedView');
  });

  test('Disabled Admin renders AccessDeniedView with zero audit reads', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: DISABLED_ADMIN_ID, email: 'disabled@lingora.test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    currentCookieStore = {
      getAll: () => [createMockSessionCookie(DISABLED_ADMIN_ID)],
    };

    setProductPrismaForTest({
      account: {
        findUnique: async () => ({
          id: DISABLED_ADMIN_ID,
          role: 'ADMIN',
          status: 'DISABLED',
          displayName: 'Disabled Admin',
          uiLocale: 'vi',
        }),
      },
      $queryRaw: async () => {
        auditReadCount++;
        return [];
      },
    });

    const jsx = await AuditEventsPage();
    assert.equal(auditReadCount, 0, 'Must make zero audit queries for disabled admin');
    assert.equal(jsx.type?.name, 'AccessDeniedView');
  });

  test('Active Admin renders AppShell and AuditEventsCatalog with initial DTO and effective bounds', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: ADMIN_ID, email: 'admin@lingora.test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    currentCookieStore = {
      getAll: () => [createMockSessionCookie(ADMIN_ID)],
    };

    const mockEvent = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      occurredAt: '2026-11-04T10:00:00.123456Z',
      actorKind: 'ACCOUNT',
      actorId: ADMIN_ID,
      action: 'TEACHER_PROVISIONED',
      targetType: 'ACCOUNT',
      targetId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      outcome: 'SUCCESS',
    };

    setProductPrismaForTest({
      account: {
        findUnique: async () => ({
          id: ADMIN_ID,
          role: 'ADMIN',
          status: 'ACTIVE',
          displayName: 'Quản trị viên',
          uiLocale: 'vi',
        }),
      },
      $queryRaw: async () => {
        auditReadCount++;
        return [mockEvent];
      },
    });

    const jsx = await AuditEventsPage();
    assert.equal(auditReadCount, 1, 'Active Admin must perform initial audit fetch');
    assert.equal(jsx.type?.name, 'AppShell');
    assert.equal(jsx.props?.account?.role, 'ADMIN');

    // Child is AuditEventsCatalog
    const catalog = jsx.props?.children;
    assert.equal(catalog.type?.name, 'AuditEventsCatalog');
    assert.equal(catalog.props?.initialData?.length, 1);
    assert.equal(catalog.props?.initialData?.[0]?.action, 'TEACHER_PROVISIONED');
    assert.ok(catalog.props?.initialFilters?.from);
    assert.ok(catalog.props?.initialFilters?.to);
  });

  test('Active Admin: when initial audit query fails with 500, supplies valid default bounds and initialError to catalog', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: ADMIN_ID, email: 'admin@lingora.test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    currentCookieStore = {
      getAll: () => [createMockSessionCookie(ADMIN_ID)],
    };

    setProductPrismaForTest({
      account: {
        findUnique: async () => ({
          id: ADMIN_ID,
          role: 'ADMIN',
          status: 'ACTIVE',
          displayName: 'Quản trị viên',
          uiLocale: 'vi',
        }),
      },
      $queryRaw: async () => {
        throw new Error('Unexpected internal query error');
      },
    });

    const jsx = await AuditEventsPage();
    assert.equal(jsx.type?.name, 'AppShell');

    const catalog = jsx.props?.children;
    assert.equal(catalog.type?.name, 'AuditEventsCatalog');
    assert.equal(catalog.props?.initialData?.length, 0);
    assert.ok(catalog.props?.initialError);
    // Crucial check for Finding 2: bounds must NOT be empty strings!
    assert.ok(catalog.props?.initialFilters?.from, 'from must not be empty');
    assert.ok(catalog.props?.initialFilters?.to, 'to must not be empty');
    const fromMs = new Date(catalog.props.initialFilters.from).getTime();
    const toMs = new Date(catalog.props.initialFilters.to).getTime();
    assert.ok(!Number.isNaN(fromMs) && !Number.isNaN(toMs));
    assert.ok(fromMs < toMs);
  });
});
