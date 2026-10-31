import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import {
  verifyLearnerIdentity,
  validateSameOrigin,
  createSupabaseServerClient,
  buildAuthResponseHeaders,
  getLearnerCookieName,
} from '../../src/server/auth/index.ts';
import { proxy, applyProxyAuthToResponse } from '../../src/proxy.ts';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import { verifyStaffIdentity } from '../../../lingora-admin/src/server/auth/index.ts';

// Setup module mock for next/headers.js before importing route handlers
let currentCookieStore = {
  getAll: () => [],
  get: (name) => undefined,
  set: (name, val, opts) => {},
  delete: (name) => {},
};

mock.module('next/headers.js', {
  exports: {
    cookies: async () => currentCookieStore,
  },
});

// Import route handlers after mock.module is registered
const { POST: loginRoute } = await import('../../src/app/api/auth/login/route.ts');
const { POST: logoutRoute } = await import('../../src/app/api/auth/logout/route.ts');

const DUMMY_LEARNER_ID = '11111111-1111-4111-8111-111111111111';
const DUMMY_ADMIN_ID = '5650336e-550c-413d-b2a8-4afa2e4d9160';
const DUMMY_TEACHER_ID = '00000000-0000-4000-8000-000000000002';

export function createSyntheticJwt(userId = DUMMY_LEARNER_ID, email = 'learner@lingora.edu.vn', exp = Math.floor(Date.now() / 1000) + 3600) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: userId, email, exp })).toString('base64url');
  return `${header}.${payload}.synthetic_jwt_signature`;
}

export function createMockSessionCookie(userId = DUMMY_LEARNER_ID, email = 'learner@lingora.edu.vn') {
  const cookieName = getLearnerCookieName('https://sncfyvpzwedqgwfpffkh.supabase.co');
  const payload = {
    sub: userId,
    email,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const access_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + Buffer.from(JSON.stringify(payload)).toString('base64url') + '.signature';
  const sessionData = {
    access_token,
    refresh_token: 'valid-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: userId, email, email_confirmed_at: '2026-10-31T00:00:00Z' },
  };
  const cookieValue = 'base64-' + Buffer.from(JSON.stringify(sessionData)).toString('base64');
  return {
    name: cookieName,
    value: cookieValue,
  };
}

export function createExpiredSyntheticSessionCookie(userId = DUMMY_LEARNER_ID, email = 'learner@lingora.edu.vn') {
  const cookieName = getLearnerCookieName('https://sncfyvpzwedqgwfpffkh.supabase.co');
  const exp = Math.floor(Date.now() / 1000) - 120;
  const access_token = createSyntheticJwt(userId, email, exp);
  const sessionData = {
    access_token,
    refresh_token: 'synthetic-initial-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: exp,
    user: { id: userId, email, email_confirmed_at: '2026-10-31T00:00:00Z' },
  };
  const cookieValue = 'base64-' + Buffer.from(JSON.stringify(sessionData)).toString('base64');
  return {
    name: cookieName,
    value: cookieValue,
    access_token,
    refresh_token: 'synthetic-initial-refresh-token',
  };
}

const originalFetch = globalThis.fetch;

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-placeholder';
  currentCookieStore = {
    getAll: () => [],
    get: (name) => undefined,
    set: (name, val, opts) => {},
    delete: (name) => {},
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  setLearnerPrismaForTest(null);
});

describe('Slice 9: Learner Authentication Matrix & Guard Verification', () => {
  test('missing identity: no cookies or session returns 401 UNAUTHENTICATED', async () => {
    const result = await verifyLearnerIdentity({
      cookieStore: {
        getAll: () => [],
      },
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 401);
    assert.equal(result.error.code, 'UNAUTHENTICATED');
  });

  test('invalid auth token returns 401 UNAUTHENTICATED', async () => {
    const mockAuthClient = {
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: { message: 'Invalid token', status: 401 },
        }),
      },
    };

    const result = await verifyLearnerIdentity({
      authClient: mockAuthClient,
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 401);
    assert.equal(result.error.code, 'UNAUTHENTICATED');
  });

  test('expired auth token returns 401 UNAUTHENTICATED', async () => {
    const mockAuthClient = {
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: { message: 'JWT expired', status: 401 },
        }),
      },
    };

    const result = await verifyLearnerIdentity({
      authClient: mockAuthClient,
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 401);
    assert.equal(result.error.code, 'UNAUTHENTICATED');
  });

  test('verified identity with missing Account in DB returns 403 FORBIDDEN', async () => {
    const mockAuthClient = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: DUMMY_LEARNER_ID,
              email: 'learner@lingora.edu.vn',
              email_confirmed_at: '2026-10-31T00:00:00Z',
            },
          },
          error: null,
        }),
      },
    };

    const mockPrisma = {
      account: {
        findUnique: async () => null,
      },
    };

    const result = await verifyLearnerIdentity({
      authClient: mockAuthClient,
      prisma: mockPrisma,
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 403);
    assert.equal(result.error.code, 'FORBIDDEN');
  });

  test('Account status PENDING returns 403 ACCOUNT_INACTIVE', async () => {
    const mockAuthClient = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: DUMMY_LEARNER_ID,
              email: 'learner@lingora.edu.vn',
              email_confirmed_at: '2026-10-31T00:00:00Z',
            },
          },
          error: null,
        }),
      },
    };

    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: DUMMY_LEARNER_ID,
          role: 'LEARNER',
          status: 'PENDING',
          displayName: 'Học Viên',
          uiLocale: 'vi',
        }),
      },
    };

    const result = await verifyLearnerIdentity({
      authClient: mockAuthClient,
      prisma: mockPrisma,
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 403);
    assert.equal(result.error.code, 'ACCOUNT_INACTIVE');
  });

  test('Mutation B Control: Account status DISABLED returns 403 ACCOUNT_INACTIVE', async () => {
    const mockAuthClient = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: DUMMY_LEARNER_ID,
              email: 'learner@lingora.edu.vn',
              email_confirmed_at: '2026-10-31T00:00:00Z',
            },
          },
          error: null,
        }),
      },
    };

    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: DUMMY_LEARNER_ID,
          role: 'LEARNER',
          status: 'DISABLED',
          displayName: 'Học Viên Bị Khóa',
          uiLocale: 'vi',
        }),
      },
    };

    const result = await verifyLearnerIdentity({
      authClient: mockAuthClient,
      prisma: mockPrisma,
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 403);
    assert.equal(result.error.code, 'ACCOUNT_INACTIVE');
  });

  test('Mutation A Control: Admin account is strictly forbidden on learner route', async () => {
    const mockAuthClient = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: DUMMY_ADMIN_ID,
              email: 'admin@lingora.edu.vn',
              email_confirmed_at: '2026-10-31T00:00:00Z',
            },
          },
          error: null,
        }),
      },
    };

    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: DUMMY_ADMIN_ID,
          role: 'ADMIN',
          status: 'ACTIVE',
          displayName: 'Quản Trị Viên',
          uiLocale: 'vi',
        }),
      },
    };

    const result = await verifyLearnerIdentity({
      authClient: mockAuthClient,
      prisma: mockPrisma,
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 403);
    assert.equal(result.error.code, 'FORBIDDEN');
  });

  test('Mutation A Control: Teacher account is strictly forbidden on learner route', async () => {
    const mockAuthClient = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: DUMMY_TEACHER_ID,
              email: 'teacher@lingora.edu.vn',
              email_confirmed_at: '2026-10-31T00:00:00Z',
            },
          },
          error: null,
        }),
      },
    };

    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: DUMMY_TEACHER_ID,
          role: 'TEACHER',
          status: 'ACTIVE',
          displayName: 'Giáo Viên',
          uiLocale: 'vi',
        }),
      },
    };

    const result = await verifyLearnerIdentity({
      authClient: mockAuthClient,
      prisma: mockPrisma,
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 403);
    assert.equal(result.error.code, 'FORBIDDEN');
  });

  test('Unconfirmed email identity returns 403 FORBIDDEN with safe confirmation message', async () => {
    const mockAuthClient = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: DUMMY_LEARNER_ID,
              email: 'unconfirmed@lingora.edu.vn',
              // No confirmed_at or email_confirmed_at
            },
          },
          error: null,
        }),
      },
    };

    const result = await verifyLearnerIdentity({
      authClient: mockAuthClient,
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 403);
    assert.equal(result.error.code, 'FORBIDDEN');
    assert.match(result.error.message, /xác thực email/i);
  });

  test('ACTIVE confirmed Learner succeeds with user and account DTO', async () => {
    const mockAuthClient = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: DUMMY_LEARNER_ID,
              email: 'learner@lingora.edu.vn',
              email_confirmed_at: '2026-10-31T00:00:00Z',
            },
          },
          error: null,
        }),
      },
    };

    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: DUMMY_LEARNER_ID,
          role: 'LEARNER',
          status: 'ACTIVE',
          displayName: 'Nguyễn Văn Học',
          uiLocale: 'vi',
        }),
      },
    };

    const result = await verifyLearnerIdentity({
      authClient: mockAuthClient,
      prisma: mockPrisma,
    });

    assert.equal(result.ok, true);
    assert.equal(result.user.id, DUMMY_LEARNER_ID);
    assert.equal(result.user.email, 'learner@lingora.edu.vn');
    assert.equal(result.account.id, DUMMY_LEARNER_ID);
    assert.equal(result.account.role, 'LEARNER');
    assert.equal(result.account.status, 'ACTIVE');
    assert.equal(result.account.displayName, 'Nguyễn Văn Học');
    assert.equal(result.account.uiLocale, 'vi');
  });

  test('provider network failure or 503 returns 503 SERVICE_UNAVAILABLE', async () => {
    const mockAuthClient = {
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: { message: 'fetch failed', status: 503 },
        }),
      },
    };

    const result = await verifyLearnerIdentity({
      authClient: mockAuthClient,
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 503);
    assert.equal(result.error.code, 'SERVICE_UNAVAILABLE');
  });

  test('database connection failure returns 503 SERVICE_UNAVAILABLE', async () => {
    const mockAuthClient = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: DUMMY_LEARNER_ID,
              email: 'learner@lingora.edu.vn',
              email_confirmed_at: '2026-10-31T00:00:00Z',
            },
          },
          error: null,
        }),
      },
    };

    const mockPrisma = {
      account: {
        findUnique: async () => {
          throw new Error('Connection terminated unexpectedly');
        },
      },
    };

    const result = await verifyLearnerIdentity({
      authClient: mockAuthClient,
      prisma: mockPrisma,
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 503);
    assert.equal(result.error.code, 'SERVICE_UNAVAILABLE');
  });

  test('Mutation F Control: Learner is strictly rejected by actual staff guard verifyStaffIdentity', async () => {
    const mockAuthClient = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: DUMMY_LEARNER_ID,
              email: 'learner@lingora.edu.vn',
            },
          },
          error: null,
        }),
      },
    };

    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: DUMMY_LEARNER_ID,
          role: 'LEARNER',
          status: 'ACTIVE',
          displayName: 'Học Viên',
          uiLocale: 'vi',
        }),
      },
    };

    const staffResult = await verifyStaffIdentity({
      authClient: mockAuthClient,
      prisma: mockPrisma,
      requiredRole: 'ANY',
    });

    assert.equal(staffResult.ok, false);
    assert.equal(staffResult.status, 403);
    assert.equal(staffResult.error.code, 'FORBIDDEN');
  });
});

describe('Slice 9: SDK Cookie Adapter & Proxy Refresh', () => {
  test('Dedicated cookie namespace uses learner-specific cookie name', () => {
    const cookieName = getLearnerCookieName('https://sncfyvpzwedqgwfpffkh.supabase.co');
    assert.equal(cookieName, 'sb-sncfyvpzwedqgwfpffkh-learner-token');

    const defaultCookieName = getLearnerCookieName();
    assert.ok(defaultCookieName.includes('learner'));
  });

});

describe('Slice 9: Actual Route Handlers (/api/auth/login and logout)', () => {
  test('POST /api/auth/login rejects foreign Origin with 403 FORBIDDEN_ORIGIN', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://malicious.com',
        host: 'localhost:3000',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: 'learner@lingora.edu.vn', password: 'secretpassword' }),
    });

    const res = await loginRoute(request);
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.error.code, 'FORBIDDEN_ORIGIN');
    const cc = res.headers.get('cache-control') || '';
    assert.ok(cc.includes('no-store') && cc.includes('private'));
  });

  test('POST /api/auth/login rejects non-json Content-Type with 415', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'content-type': 'text/plain',
      },
      body: 'email=test',
    });

    const res = await loginRoute(request);
    assert.equal(res.status, 415);
    const json = await res.json();
    assert.equal(json.error.code, 'UNSUPPORTED_MEDIA_TYPE');
  });

  test('POST /api/auth/login rejects malformed JSON with 400 MALFORMED_JSON', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'content-type': 'application/json',
      },
      body: '{ not valid json',
    });

    const res = await loginRoute(request);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.error.code, 'MALFORMED_JSON');
  });

  test('POST /api/auth/login rejects invalid email/password format with 400 VALIDATION_ERROR', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: 'not-an-email', password: '' }),
    });

    const res = await loginRoute(request);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });

  test('POST /api/auth/login invalid credentials returns 401 with no-store headers', async () => {
    globalThis.fetch = async (url) => {
      if (url.toString().includes('/auth/v1/token')) {
        return new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('Not Found', { status: 404 });
    };

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: 'learner@lingora.edu.vn', password: 'wrongpassword' }),
    });

    const res = await loginRoute(request);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.error.code, 'INVALID_CREDENTIALS');
    const cc = res.headers.get('cache-control') || '';
    assert.ok(cc.includes('no-store') && cc.includes('private'));
  });

  test('POST /api/auth/login account denial (Admin, Teacher, Disabled, Unconfirmed) signs out session', async () => {
    // Simulate Supabase login succeeding for an Admin user
    globalThis.fetch = async (url) => {
      if (url.toString().includes('/auth/v1/token')) {
        return new Response(JSON.stringify({
          access_token: createSyntheticJwt(DUMMY_ADMIN_ID, 'admin@lingora.edu.vn'),
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'dummy-refresh',
          user: { id: DUMMY_ADMIN_ID, email: 'admin@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' },
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.toString().includes('/auth/v1/user')) {
        return new Response(JSON.stringify({
          id: DUMMY_ADMIN_ID,
          email: 'admin@lingora.edu.vn',
          email_confirmed_at: '2026-10-31T00:00:00Z',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.toString().includes('/auth/v1/logout')) {
        return new Response('', { status: 204 });
      }
      return new Response('Not Found', { status: 404 });
    };

    setLearnerPrismaForTest({
      account: {
        findUnique: async () => ({
          id: DUMMY_ADMIN_ID,
          role: 'ADMIN',
          status: 'ACTIVE',
          displayName: 'Admin User',
          uiLocale: 'vi',
        }),
      },
    });

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: 'admin@lingora.edu.vn', password: 'correctpassword' }),
    });

    const res = await loginRoute(request);
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.error.code, 'FORBIDDEN');
  });

  test('POST /api/auth/login valid credentials returns 200 with learner DTO', async () => {
    globalThis.fetch = async (url) => {
      if (url.toString().includes('/auth/v1/token')) {
        return new Response(JSON.stringify({
          access_token: createSyntheticJwt(DUMMY_LEARNER_ID, 'learner@lingora.edu.vn'),
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'dummy-refresh',
          user: { id: DUMMY_LEARNER_ID, email: 'learner@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' },
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.toString().includes('/auth/v1/user')) {
        return new Response(JSON.stringify({
          id: DUMMY_LEARNER_ID,
          email: 'learner@lingora.edu.vn',
          email_confirmed_at: '2026-10-31T00:00:00Z',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('Not Found', { status: 404 });
    };

    setLearnerPrismaForTest({
      account: {
        findUnique: async () => ({
          id: DUMMY_LEARNER_ID,
          role: 'LEARNER',
          status: 'ACTIVE',
          displayName: 'Nguyễn Văn Học',
          uiLocale: 'vi',
        }),
      },
    });

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: 'learner@lingora.edu.vn', password: 'correctpassword' }),
    });

    const res = await loginRoute(request);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.user.id, DUMMY_LEARNER_ID);
    assert.equal(json.data.account.role, 'LEARNER');
    assert.equal(json.data.account.status, 'ACTIVE');
    assert.equal(json.data.account.displayName, 'Nguyễn Văn Học');
    const cc = res.headers.get('cache-control') || '';
    assert.ok(cc.includes('no-store') && cc.includes('private'));
  });

  test('POST /api/auth/logout rejects foreign Origin with 403', async () => {
    const request = new Request('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: {
        origin: 'http://evil.com',
        host: 'localhost:3000',
      },
    });

    const res = await logoutRoute(request);
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.error.code, 'FORBIDDEN_ORIGIN');
  });

  test('POST /api/auth/logout with active session deletes learner cookies and returns 200', async () => {
    const deletedCookies = [];
    currentCookieStore = {
      getAll: () => [
        { name: 'sb-sncfyvpzwedqgwfpffkh-learner-token', value: 'val' },
        { name: 'sb-staff-token', value: 'staff-val' }, // Staff cookie must remain untouched!
      ],
      delete: (name) => {
        deletedCookies.push(name);
      },
      set: () => {},
      get: () => undefined,
    };

    globalThis.fetch = async (url) => {
      if (url.toString().includes('/auth/v1/logout')) {
        return new Response('', { status: 204 });
      }
      return new Response('Not Found', { status: 404 });
    };

    const request = new Request('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
      },
    });

    const res = await logoutRoute(request);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.success, true);
    const cc = res.headers.get('cache-control') || '';
    assert.ok(cc.includes('no-store') && cc.includes('private'));

    // Only learner cookie deleted
    assert.ok(deletedCookies.some(name => name.includes('learner')));
    assert.ok(!deletedCookies.includes('sb-staff-token'));
  });
});

describe('Slice 9: Same-Origin Enforcement', () => {
  test('accepts matching scheme, hostname, and port', () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
      },
    });
    assert.equal(validateSameOrigin(req), true);
  });

  test('accepts matching HTTPS production domain', () => {
    const req = new Request('https://lingora-web.vercel.app/api/auth/login', {
      headers: {
        origin: 'https://lingora-web.vercel.app',
        host: 'lingora-web.vercel.app',
        'x-forwarded-proto': 'https',
      },
    });
    assert.equal(validateSameOrigin(req), true);
  });

  test('rejects mismatched port', () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      headers: {
        origin: 'http://localhost:3001',
        host: 'localhost:3000',
      },
    });
    assert.equal(validateSameOrigin(req), false);
  });

  test('rejects null origin', () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      headers: {
        origin: 'null',
        host: 'localhost:3000',
      },
    });
    assert.equal(validateSameOrigin(req), false);
  });

  test('rejects missing origin on mutation endpoint', () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      headers: {
        host: 'localhost:3000',
      },
    });
    assert.equal(validateSameOrigin(req), false);
  });
});
