import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

mock.module('server-only', { exports: {} });

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

const { setProductPrismaForTest } = await import('../../src/server/db/index.js');
const { GET } = await import('../../src/app/api/audit-events/route.ts');
const { teachersFixture } = await import('./harness/teachers-fixture.mjs');

const adminId = '00000000-0000-4000-8000-000000000001';
const teacherId = '11111111-1111-4111-8111-111111111111';
const learnerId = '22222222-2222-4222-8222-222222222222';
const disabledAdminId = '33333333-3333-4333-8333-333333333333';

function mockSessionCookie(userId, expiresIn = 3600) {
  const payload = {
    sub: userId,
    email: `${userId}@lingora.test`,
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  };
  const session = {
    access_token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(
      JSON.stringify(payload)
    ).toString('base64url')}.signature`,
    refresh_token: 'test-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    user: { id: userId, email: payload.email },
  };
  return {
    name: 'sb-test-project-ref-auth-token',
    value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`,
  };
}

describe('Audit Route Integration: GET /api/audit-events', () => {
  let fixture;
  let auditReadCount = 0;
  let currentAuthUserId = adminId;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project-ref.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    fixture = teachersFixture();
    auditReadCount = 0;
    currentAuthUserId = adminId;

    globalThis.fetch = async (url) => {
      const u = String(url);
      if (u.includes('/auth/v1/user')) {
        return new Response(
          JSON.stringify({
            id: currentAuthUserId,
            email: `${currentAuthUserId}@lingora.test`,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, private',
              'X-Supabase-Refresh': 'token-refreshed',
            },
          }
        );
      }
      return new Response('{}', { status: 200 });
    };

    // Spy on $queryRaw to count audit queries
    const origQueryRaw = fixture.db.$queryRaw;
    fixture.db.$queryRaw = async (query, ...args) => {
      const q = typeof query === 'string'
        ? query
        : (query.strings ? query.strings.join('?') : String(query));

      if (q.includes('app_private.audit_events')) {
        auditReadCount++;
        return [
          {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            occurredAt: '2026-11-03T12:00:00.000000Z',
            actorKind: 'ACCOUNT',
            actorId: adminId,
            action: 'TEACHER_PROVISIONED',
            targetType: 'ACCOUNT',
            targetId: teacherId,
            outcome: 'SUCCESS',
          },
        ];
      }
      return origQueryRaw(query, ...args);
    };

    setProductPrismaForTest(fixture.db);

    fixture.state.accounts.set(adminId, {
      id: adminId,
      role: 'ADMIN',
      status: 'ACTIVE',
      displayName: 'Admin User',
      uiLocale: 'vi',
    });

    fixture.state.accounts.set(teacherId, {
      id: teacherId,
      role: 'TEACHER',
      status: 'ACTIVE',
      displayName: 'Teacher User',
      uiLocale: 'vi',
    });

    fixture.state.accounts.set(learnerId, {
      id: learnerId,
      role: 'LEARNER',
      status: 'ACTIVE',
      displayName: 'Learner User',
      uiLocale: 'vi',
    });

    fixture.state.accounts.set(disabledAdminId, {
      id: disabledAdminId,
      role: 'ADMIN',
      status: 'DISABLED',
      displayName: 'Disabled Admin',
      uiLocale: 'vi',
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('anonymous request is denied 401 with no-store and ZERO audit reads', async () => {
    currentCookieStore = {
      getAll: () => [],
      get: () => undefined,
      set: () => {},
      delete: () => {},
    };

    const req = new Request('http://localhost/api/audit-events');
    const res = await GET(req);

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error.code, 'UNAUTHENTICATED');
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
    assert.equal(auditReadCount, 0, 'Zero audit queries on denied request');
  });

  test('Teacher session is denied 403 with no-store and ZERO audit reads', async () => {
    currentAuthUserId = teacherId;
    const cookie = mockSessionCookie(teacherId);
    currentCookieStore = {
      getAll: () => [cookie],
      get: (name) => (name === cookie.name ? cookie : undefined),
      set: () => {},
      delete: () => {},
    };

    const req = new Request('http://localhost/api/audit-events');
    const res = await GET(req);

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error.code, 'FORBIDDEN');
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
    assert.equal(auditReadCount, 0, 'Zero audit queries on denied request');
  });

  test('Learner session is denied 403 with no-store and ZERO audit reads', async () => {
    currentAuthUserId = learnerId;
    const cookie = mockSessionCookie(learnerId);
    currentCookieStore = {
      getAll: () => [cookie],
      get: (name) => (name === cookie.name ? cookie : undefined),
      set: () => {},
      delete: () => {},
    };

    const req = new Request('http://localhost/api/audit-events');
    const res = await GET(req);

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error.code, 'FORBIDDEN');
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
    assert.equal(auditReadCount, 0, 'Zero audit queries on denied request');
  });

  test('Disabled Admin session is denied 403 with no-store and ZERO audit reads', async () => {
    currentAuthUserId = disabledAdminId;
    const cookie = mockSessionCookie(disabledAdminId);
    currentCookieStore = {
      getAll: () => [cookie],
      get: (name) => (name === cookie.name ? cookie : undefined),
      set: () => {},
      delete: () => {},
    };

    const req = new Request('http://localhost/api/audit-events');
    const res = await GET(req);

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error.code, 'ACCOUNT_INACTIVE');
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
    assert.equal(auditReadCount, 0, 'Zero audit queries on denied request');
  });

  test('Active Admin: rejects unknown query parameter with 400 VALIDATION_ERROR and zero audit reads', async () => {
    currentAuthUserId = adminId;
    const cookie = mockSessionCookie(adminId);
    currentCookieStore = {
      getAll: () => [cookie],
      get: (name) => (name === cookie.name ? cookie : undefined),
      set: () => {},
      delete: () => {},
    };

    const req = new Request('http://localhost/api/audit-events?foo=bar');
    const res = await GET(req);

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
    assert.equal(auditReadCount, 0, 'Zero audit queries on validation error');
  });

  test('Active Admin: rejects duplicate query parameter with 400 VALIDATION_ERROR and zero audit reads', async () => {
    currentAuthUserId = adminId;
    const cookie = mockSessionCookie(adminId);
    currentCookieStore = {
      getAll: () => [cookie],
      get: (name) => (name === cookie.name ? cookie : undefined),
      set: () => {},
      delete: () => {},
    };

    const req = new Request(
      'http://localhost/api/audit-events?from=2026-11-01T00:00:00.000Z&from=2026-11-02T00:00:00.000Z'
    );
    const res = await GET(req);

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
    assert.equal(auditReadCount, 0, 'Zero audit queries on validation error');
  });

  test('Active Admin: rejects malformed date parameters with 400 VALIDATION_ERROR', async () => {
    currentAuthUserId = adminId;
    const cookie = mockSessionCookie(adminId);
    currentCookieStore = {
      getAll: () => [cookie],
      get: (name) => (name === cookie.name ? cookie : undefined),
      set: () => {},
      delete: () => {},
    };

    const req = new Request(
      'http://localhost/api/audit-events?from=invalid&to=2026-11-04T00:00:00.000Z'
    );
    const res = await GET(req);

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
  });

  test('Active Admin: valid query succeeds with 200, DTO response and private no-store headers', async () => {
    currentAuthUserId = adminId;
    const cookie = mockSessionCookie(adminId);
    currentCookieStore = {
      getAll: () => [cookie],
      get: (name) => (name === cookie.name ? cookie : undefined),
      set: () => {},
      delete: () => {},
    };

    const from = '2026-11-01T00:00:00.000Z';
    const to = '2026-11-04T00:00:00.000Z';
    const req = new Request(
      `http://localhost/api/audit-events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&action=TEACHER_PROVISIONED`
    );
    const res = await GET(req);

    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
    assert.equal(auditReadCount, 1);

    const body = await res.json();
    assert.ok(Array.isArray(body.data));
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].action, 'TEACHER_PROVISIONED');
    assert.equal(body.data[0].actorKind, 'ACCOUNT');
    assert.equal(body.filters.from, from);
    assert.equal(body.filters.to, to);
    assert.equal(body.filters.action, 'TEACHER_PROVISIONED');
    assert.equal(body.nextCursor, null);
  });

  test('Active Admin: returns 503 when audit database read fails with connectivity error', async () => {
    currentAuthUserId = adminId;
    const cookie = mockSessionCookie(adminId);
    currentCookieStore = {
      getAll: () => [cookie],
      get: (name) => (name === cookie.name ? cookie : undefined),
      set: () => {},
      delete: () => {},
    };

    fixture.db.$queryRaw = async (query) => {
      const q = typeof query === 'string'
        ? query
        : (query.strings ? query.strings.join('?') : String(query));

      if (q.includes('app_private.audit_events')) {
        throw new Error('Connection terminated unexpectedly');
      }
      return [];
    };

    const req = new Request('http://localhost/api/audit-events');
    const res = await GET(req);

    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.error.code, 'SERVICE_UNAVAILABLE');
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
  });

  test('Active Admin: rejects supplied empty parameters (?from=&to=, ?action=, ?outcome=, ?cursor=) with 400 VALIDATION_ERROR and zero audit reads', async () => {
    currentAuthUserId = adminId;
    const cookie = mockSessionCookie(adminId);
    currentCookieStore = {
      getAll: () => [cookie],
      get: (name) => (name === cookie.name ? cookie : undefined),
      set: () => {},
      delete: () => {},
    };

    const emptyParamUrls = [
      'http://localhost/api/audit-events?from=&to=',
      'http://localhost/api/audit-events?from=&to=2026-11-04T00:00:00.000Z',
      'http://localhost/api/audit-events?from=2026-11-01T00:00:00.000Z&to=',
      'http://localhost/api/audit-events?action=',
      'http://localhost/api/audit-events?outcome=',
      'http://localhost/api/audit-events?cursor=',
    ];

    for (const testUrl of emptyParamUrls) {
      auditReadCount = 0;
      const req = new Request(testUrl);
      const res = await GET(req);

      assert.equal(res.status, 400, `Expected 400 for ${testUrl}`);
      const body = await res.json();
      assert.equal(body.error.code, 'VALIDATION_ERROR');
      assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
      assert.equal(auditReadCount, 0, `Zero audit reads expected for ${testUrl}`);
    }
  });

  test('Active Admin: overrides conflicting SDK cache header with no-store private and preserves SDK refresh cookies', async () => {
    currentAuthUserId = adminId;
    const cookie = mockSessionCookie(adminId, -60);
    const jar = new Map([[cookie.name, cookie.value]]);
    const writtenCookies = [];
    const sdkHeaders = [];
    let refreshCalls = 0;
    let userCalls = 0;
    currentCookieStore = {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookiesToSet, headers) => {
        writtenCookies.push(...cookiesToSet);
        sdkHeaders.push({ ...headers });
        for (const { name, value } of cookiesToSet) jar.set(name, value);
        // Inject a conflict at the actual SDK adapter boundary, after recording its real headers.
        headers['Cache-Control'] = 'public, max-age=3600';
      },
    };

    const freshSession = JSON.parse(Buffer.from(mockSessionCookie(adminId).value.slice(7), 'base64').toString());
    globalThis.fetch = async (url) => {
      const u = String(url);
      if (u.includes('/auth/v1/token?grant_type=refresh_token')) {
        refreshCalls++;
        return Response.json({ ...freshSession, refresh_token: 'synthetic-refreshed-token' });
      }
      if (u.includes('/auth/v1/user')) {
        userCalls++;
        return Response.json({ id: adminId, email: `${adminId}@lingora.test` });
      }
      throw new Error('Unexpected synthetic provider endpoint');
    };

    const req = new Request('http://localhost/api/audit-events');
    const res = await GET(req);

    assert.equal(res.status, 200);
    assert.equal(refreshCalls, 1, 'Expired session must trigger real SDK refresh');
    assert.equal(userCalls, 1, 'Fresh provider identity must still be checked');
    assert.ok(writtenCookies.length > 0, 'Real SDK must write refreshed session cookies');
    assert.ok(writtenCookies.some(({ name, value }) => name.startsWith('sb-') && value && value !== cookie.value));
    assert.ok(sdkHeaders.some((headers) => headers['Cache-Control']?.includes('no-store')),
      'Actual installed SDK must invoke the response-header adapter');
    assert.equal(res.headers.get('Expires'), '0');
    assert.equal(res.headers.get('Pragma'), 'no-cache');
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
    const refreshed = writtenCookies.find(({ name, value }) => name === cookie.name && value);
    assert.ok(refreshed, 'Refreshed cookie must retain the SDK storage key');
    const stored = JSON.parse(Buffer.from(jar.get(cookie.name).slice(7), 'base64').toString());
    assert.equal(stored.refresh_token, 'synthetic-refreshed-token');
    assert.equal(auditReadCount, 1);
  });

  test('Auth provider outage returns 503 SERVICE_UNAVAILABLE with no-store headers and zero audit reads', async () => {
    currentAuthUserId = adminId;
    const cookie = mockSessionCookie(adminId);
    currentCookieStore = {
      getAll: () => [cookie],
      get: (name) => (name === cookie.name ? cookie : undefined),
      set: () => {},
      delete: () => {},
    };

    // Simulate provider 503 failure
    globalThis.fetch = async (url) => {
      const u = String(url);
      if (u.includes('/auth/v1/user')) {
        return new Response('{"error":"Service unavailable"}', {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('{}', { status: 200 });
    };

    auditReadCount = 0;
    const req = new Request('http://localhost/api/audit-events');
    const res = await GET(req);

    assert.equal(res.status, 503);
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
    assert.equal(auditReadCount, 0, 'Zero audit queries on provider outage');
  });

  test('Account database outage during auth verification returns 503 with no-store and zero audit reads', async () => {
    currentAuthUserId = adminId;
    const cookie = mockSessionCookie(adminId);
    currentCookieStore = {
      getAll: () => [cookie],
      get: (name) => (name === cookie.name ? cookie : undefined),
      set: () => {},
      delete: () => {},
    };

    fixture.db.account.findUnique = async () => {
      throw new Error("Can't reach database server at 127.0.0.1:54322");
    };

    auditReadCount = 0;
    const req = new Request('http://localhost/api/audit-events');
    const res = await GET(req);

    assert.equal(res.status, 503);
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
    assert.equal(auditReadCount, 0, 'Zero audit queries on account database outage');
  });

  test('Route is strictly read-only and exports only GET and dynamic', async () => {
    const routeModule = await import('../../src/app/api/audit-events/route.ts');
    const exports = Object.keys(routeModule);
    assert.ok(exports.includes('GET'), 'Must export GET handler');
    assert.ok(exports.includes('dynamic'), 'Must export dynamic config');
    assert.ok(!exports.includes('POST'), 'Must not export POST');
    assert.ok(!exports.includes('PUT'), 'Must not export PUT');
    assert.ok(!exports.includes('PATCH'), 'Must not export PATCH');
    assert.ok(!exports.includes('DELETE'), 'Must not export DELETE');
  });
});
