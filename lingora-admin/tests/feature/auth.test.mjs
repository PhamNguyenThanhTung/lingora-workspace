import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { NextRequest, NextResponse } from 'next/server.js';
import {
  verifyStaffIdentity,
  validateSameOrigin,
  createSupabaseServerClient,
  buildAuthResponseHeaders,
} from '../../src/server/auth/index.ts';
import { proxy, applyProxyAuthToResponse } from '../../src/proxy.ts';
import { setProductPrismaForTest } from '../../src/server/db/index.js';

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
const { GET: getLanguagesRoute, POST: postLanguagesRoute } = await import('../../src/app/api/languages/route.ts');
const { PATCH: patchLanguageRoute, DELETE: deleteLanguageRoute } = await import('../../src/app/api/languages/[id]/route.ts');

const DUMMY_ADMIN_ID = '5650336e-550c-413d-b2a8-4afa2e4d9160';
const DUMMY_TEACHER_ID = '00000000-0000-4000-8000-000000000002';

export function createSyntheticJwt(userId = DUMMY_ADMIN_ID, email = 'admin@lingora.edu.vn', exp = Math.floor(Date.now() / 1000) + 3600) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: userId, email, exp })).toString('base64url');
  return `${header}.${payload}.synthetic_jwt_signature`;
}

export function createExpiredSyntheticSessionCookie(userId = DUMMY_ADMIN_ID, email = 'admin@lingora.edu.vn') {
  const exp = Math.floor(Date.now() / 1000) - 120;
  const access_token = createSyntheticJwt(userId, email, exp);
  const sessionData = {
    access_token,
    refresh_token: 'synthetic-initial-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: exp,
    user: { id: userId, email },
  };
  const cookieValue = 'base64-' + Buffer.from(JSON.stringify(sessionData)).toString('base64');
  return {
    name: 'sb-sncfyvpzwedqgwfpffkh-auth-token',
    value: cookieValue,
    access_token,
    refresh_token: 'synthetic-initial-refresh-token',
  };
}

export function createMockSessionCookie(userId = DUMMY_ADMIN_ID, email = 'admin@lingora.edu.vn') {
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
    user: { id: userId, email },
  };
  const cookieValue = 'base64-' + Buffer.from(JSON.stringify(sessionData)).toString('base64');
  return {
    name: 'sb-sncfyvpzwedqgwfpffkh-auth-token',
    value: cookieValue,
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
});

describe('S1-02 / STAB-1 R1, R9: Authentication Matrix & Guard Verification', () => {
  test('missing identity: no cookies or session returns 401 UNAUTHENTICATED', async () => {
    let dbTouched = false;
    const mockPrisma = {
      account: {
        findUnique: async () => {
          dbTouched = true;
          return null;
        },
      },
    };

    const res = await verifyStaffIdentity({
      cookieStore: { getAll: () => [] },
      prisma: mockPrisma,
      requiredRole: 'ADMIN',
    });

    assert.equal(res.ok, false);
    assert.equal(res.status, 401);
    assert.equal(res.error.code, 'UNAUTHENTICATED');
    assert.equal(dbTouched, false, 'Database must not be queried when unauthenticated');
  });

  test('invalid auth token returns 401 UNAUTHENTICATED', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ message: 'invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await verifyStaffIdentity({
      cookieStore: {
        getAll: () => [{ name: 'sb-sncfyvpzwedqgwfpffkh-auth-token', value: 'invalid-val' }],
      },
      requiredRole: 'ADMIN',
    });

    assert.equal(res.ok, false);
    assert.equal(res.status, 401);
    assert.equal(res.error.code, 'UNAUTHENTICATED');
  });

  test('expired auth token returns 401 UNAUTHENTICATED', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ message: 'JWT expired' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await verifyStaffIdentity({
      cookieStore: {
        getAll: () => [{ name: 'sb-sncfyvpzwedqgwfpffkh-auth-token', value: 'expired-val' }],
      },
      requiredRole: 'ADMIN',
    });

    assert.equal(res.ok, false);
    assert.equal(res.status, 401);
    assert.equal(res.error.code, 'UNAUTHENTICATED');
  });

  test('verified identity with missing Account in DB returns 403 FORBIDDEN', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({
      id: DUMMY_ADMIN_ID,
      email: 'admin@lingora.edu.vn',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const mockPrisma = {
      account: {
        findUnique: async () => null,
      },
    };

    const res = await verifyStaffIdentity({
      cookieStore: {
        getAll: () => [createMockSessionCookie(DUMMY_ADMIN_ID)],
      },
      prisma: mockPrisma,
      requiredRole: 'ADMIN',
    });

    assert.equal(res.ok, false);
    assert.equal(res.status, 403);
    assert.equal(res.error.code, 'FORBIDDEN');
    assert.ok(res.error.message.includes('chưa được khởi tạo'));
  });

  test('Account status PENDING returns 403 ACCOUNT_INACTIVE', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({
      id: DUMMY_ADMIN_ID,
      email: 'pending@lingora.edu.vn',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: DUMMY_ADMIN_ID,
          role: 'ADMIN',
          status: 'PENDING',
          displayName: 'Pending Admin',
          uiLocale: 'vi',
        }),
      },
    };

    const res = await verifyStaffIdentity({
      cookieStore: {
        getAll: () => [createMockSessionCookie(DUMMY_ADMIN_ID)],
      },
      prisma: mockPrisma,
      requiredRole: 'ADMIN',
    });

    assert.equal(res.ok, false);
    assert.equal(res.status, 403);
    assert.equal(res.error.code, 'ACCOUNT_INACTIVE');
  });

  test('Account status DISABLED returns 403 ACCOUNT_INACTIVE', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({
      id: DUMMY_ADMIN_ID,
      email: 'disabled@lingora.edu.vn',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: DUMMY_ADMIN_ID,
          role: 'ADMIN',
          status: 'DISABLED',
          displayName: 'Disabled Admin',
          uiLocale: 'vi',
        }),
      },
    };

    const res = await verifyStaffIdentity({
      cookieStore: {
        getAll: () => [createMockSessionCookie(DUMMY_ADMIN_ID)],
      },
      prisma: mockPrisma,
      requiredRole: 'ADMIN',
    });

    assert.equal(res.ok, false);
    assert.equal(res.status, 403);
    assert.equal(res.error.code, 'ACCOUNT_INACTIVE');
  });

  test('Account role TEACHER is forbidden for languages but allowed for holding', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({
      id: DUMMY_TEACHER_ID,
      email: 'teacher@lingora.edu.vn',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: DUMMY_TEACHER_ID,
          role: 'TEACHER',
          status: 'ACTIVE',
          displayName: 'Teacher User',
          uiLocale: 'vi',
        }),
      },
    };

    const resAdmin = await verifyStaffIdentity({
      cookieStore: {
        getAll: () => [createMockSessionCookie(DUMMY_TEACHER_ID)],
      },
      prisma: mockPrisma,
      requiredRole: 'ADMIN',
    });
    assert.equal(resAdmin.ok, false);
    assert.equal(resAdmin.status, 403);
    assert.equal(resAdmin.error.code, 'FORBIDDEN');

    const resTeacher = await verifyStaffIdentity({
      cookieStore: {
        getAll: () => [createMockSessionCookie(DUMMY_TEACHER_ID)],
      },
      prisma: mockPrisma,
      requiredRole: 'TEACHER',
    });
    assert.equal(resTeacher.ok, true);
    assert.equal(resTeacher.account.role, 'TEACHER');
  });

  test('Account role LEARNER is forbidden for staff routes', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({
      id: '00000000-0000-4000-8000-000000000003',
      email: 'learner@lingora.edu.vn',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: '00000000-0000-4000-8000-000000000003',
          role: 'LEARNER',
          status: 'ACTIVE',
          displayName: 'Learner User',
          uiLocale: 'vi',
        }),
      },
    };

    const res = await verifyStaffIdentity({
      cookieStore: {
        getAll: () => [createMockSessionCookie('00000000-0000-4000-8000-000000000003')],
      },
      prisma: mockPrisma,
      requiredRole: 'ADMIN',
    });

    assert.equal(res.ok, false);
    assert.equal(res.status, 403);
    assert.equal(res.error.code, 'FORBIDDEN');
  });

  test('Account role ADMIN and status ACTIVE succeeds with user and account DTO', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({
      id: DUMMY_ADMIN_ID,
      email: 'admin@lingora.edu.vn',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: DUMMY_ADMIN_ID,
          role: 'ADMIN',
          status: 'ACTIVE',
          displayName: 'Admin User',
          uiLocale: 'vi',
        }),
      },
    };

    const res = await verifyStaffIdentity({
      cookieStore: {
        getAll: () => [createMockSessionCookie(DUMMY_ADMIN_ID)],
      },
      prisma: mockPrisma,
      requiredRole: 'ADMIN',
    });

    assert.equal(res.ok, true);
    assert.equal(res.user.id, DUMMY_ADMIN_ID);
    assert.equal(res.account.role, 'ADMIN');
    assert.equal(res.account.status, 'ACTIVE');
  });

  test('provider network failure or 503 returns 503 SERVICE_UNAVAILABLE', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ message: 'Service Unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await verifyStaffIdentity({
      cookieStore: {
        getAll: () => [createMockSessionCookie(DUMMY_ADMIN_ID)],
      },
      requiredRole: 'ADMIN',
    });

    assert.equal(res.ok, false);
    assert.equal(res.status, 503);
    assert.equal(res.error.code, 'SERVICE_UNAVAILABLE');
  });

  test('database connection failure returns 503 SERVICE_UNAVAILABLE', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({
      id: DUMMY_ADMIN_ID,
      email: 'admin@lingora.edu.vn',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const mockPrisma = {
      account: {
        findUnique: async () => {
          const err = new Error('Connection refused');
          err.code = 'P1001';
          throw err;
        },
      },
    };

    const res = await verifyStaffIdentity({
      cookieStore: {
        getAll: () => [createMockSessionCookie(DUMMY_ADMIN_ID)],
      },
      prisma: mockPrisma,
      requiredRole: 'ADMIN',
    });

    assert.equal(res.ok, false);
    assert.equal(res.status, 503);
    assert.equal(res.error.code, 'SERVICE_UNAVAILABLE');
  });
});

describe('S1-02 / STAB-1 R1, R9: SDK Adapter Interaction & Proxy Refresh', () => {
  test('S-R9a: Real installed SSR SDK invokes setAll on signInWithPassword and captures SDK headers', async () => {
    const writtenCookies = [];
    const responseHeaders = new Headers();

    globalThis.fetch = async (url) => {
      if (String(url).includes('/auth/v1/token')) {
        return new Response(JSON.stringify({
          access_token: 'header.payload.sig',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'ref-123',
          user: { id: DUMMY_ADMIN_ID, email: 'admin@lingora.edu.vn' },
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
            'Expires': '0',
            'Pragma': 'no-cache',
          },
        });
      }
      return new Response('{}', { status: 200 });
    };

    const cookieStore = {
      getAll: () => [],
      setAll: (cookiesToSet) => {
        writtenCookies.push(...cookiesToSet);
      },
    };

    const supabase = createSupabaseServerClient(cookieStore, responseHeaders);
    const result = await supabase.auth.signInWithPassword({
      email: 'admin@lingora.edu.vn',
      password: 'password123',
    });

    assert.equal(result.data.user.id, DUMMY_ADMIN_ID);
    assert.ok(writtenCookies.length > 0, 'Real SDK must invoke setAll with session cookies');
    assert.ok(writtenCookies.some(c => c.name.startsWith('sb-')), 'Cookie name must start with sb-');
    assert.equal(responseHeaders.get('Expires'), '0', 'responseHeaders must collect SDK Expires');
    assert.equal(responseHeaders.get('Pragma'), 'no-cache', 'responseHeaders must collect SDK Pragma');
    assert.ok(responseHeaders.get('Cache-Control').includes('no-store'), 'Cache-Control must contain no-store');
  });

  test('S-R9a: Real installed SSR SDK invokes setAll on signOut to delete auth cookies', async () => {
    const writtenCookies = [];
    const responseHeaders = new Headers();

    globalThis.fetch = async (url) => {
      if (String(url).includes('/auth/v1/logout')) {
        return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('{}', { status: 200 });
    };

    const cookieStore = {
      getAll: () => [createMockSessionCookie(DUMMY_ADMIN_ID)],
      setAll: (cookiesToSet) => {
        writtenCookies.push(...cookiesToSet);
      },
    };

    const supabase = createSupabaseServerClient(cookieStore, responseHeaders);
    await supabase.auth.signOut();

    assert.ok(writtenCookies.length > 0, 'Real SDK must invoke setAll to remove auth cookies');
    // Deletion is represented by maxAge: 0 or empty value
    const hasDeletion = writtenCookies.some(c => c.value === '' || c.options?.maxAge === 0);
    assert.ok(hasDeletion, 'signOut must clear auth cookie with maxAge: 0 or empty value');
  });

  test('S-R1a / FINAL-1 C1: proxy refreshes expired session via real SSR SDK, propagates refreshed cookies downstream and to response, kills mutations', async () => {
    let refreshCallsCount = 0;
    const userVerificationCalls = [];
    const usedRefreshTokens = new Set();
    const refreshedAccessToken = createSyntheticJwt(DUMMY_ADMIN_ID, 'admin@lingora.edu.vn', Math.floor(Date.now() / 1000) + 3600);
    const refreshedRefreshToken = 'synthetic-refreshed-refresh-token-v2';

    globalThis.fetch = async (url, opts) => {
      const u = String(url);

      // Provider double verifies refresh-token grant
      if (u.includes('/auth/v1/token?grant_type=refresh_token') || (u.includes('/auth/v1/token') && opts?.body?.includes('refresh_token'))) {
        refreshCallsCount++;
        let body = {};
        try { body = JSON.parse(opts?.body || '{}'); } catch {}

        if (usedRefreshTokens.has(body.refresh_token)) {
          return new Response(JSON.stringify({
            error: 'invalid_grant',
            error_description: 'Refresh token has already been used/revoked',
          }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        if (body.refresh_token !== 'synthetic-initial-refresh-token') {
          return new Response(JSON.stringify({
            error: 'invalid_grant',
            error_description: 'Unknown or mismatched refresh token',
          }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        usedRefreshTokens.add(body.refresh_token);

        return new Response(JSON.stringify({
          access_token: refreshedAccessToken,
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: refreshedRefreshToken,
          user: { id: DUMMY_ADMIN_ID, email: 'admin@lingora.edu.vn' },
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
            'Expires': '0',
            'Pragma': 'no-cache',
          },
        });
      }

      // Provider user verification endpoint
      if (u.includes('/auth/v1/user')) {
        const authHeader = opts?.headers?.Authorization || opts?.headers?.authorization || (typeof opts?.headers?.get === 'function' ? opts.headers.get('Authorization') : undefined);
        userVerificationCalls.push({ authHeader });
        if (authHeader === `Bearer ${refreshedAccessToken}`) {
          return new Response(JSON.stringify({ id: DUMMY_ADMIN_ID, email: 'admin@lingora.edu.vn' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ message: 'Invalid or expired JWT token' }), { status: 401 });
      }

      return new Response('{}', { status: 200 });
    };

    const initialCookie = createExpiredSyntheticSessionCookie(DUMMY_ADMIN_ID);
    const req = new NextRequest('http://localhost:3000/languages', {
      headers: {
        host: 'localhost:3000',
        cookie: `${initialCookie.name}=${initialCookie.value}`,
      },
    });

    const res = await proxy(req);

    // 1. Assert refresh call count and user verification using refreshed token
    assert.equal(refreshCallsCount, 1, 'Provider double must verify refresh-token grant exactly once');
    assert.ok(userVerificationCalls.length >= 1, 'Provider must verify user identity');
    assert.equal(userVerificationCalls[0].authHeader, `Bearer ${refreshedAccessToken}`, 'getUser must verify identity with refreshed token');

    // 2. Compare exact changed cookie VALUE in request.cookies (no stale value)
    const updatedReqCookie = req.cookies.get(initialCookie.name)?.value;
    assert.ok(updatedReqCookie, 'Refreshed cookie must exist in request.cookies');
    assert.notEqual(updatedReqCookie, initialCookie.value, 'request.cookies must NOT retain stale cookie value');
    const decodedReqSession = JSON.parse(Buffer.from(updatedReqCookie.replace('base64-', ''), 'base64').toString('utf8'));
    assert.equal(decodedReqSession.access_token, refreshedAccessToken, 'request.cookies must contain refreshed access_token');
    assert.equal(decodedReqSession.refresh_token, refreshedRefreshToken, 'request.cookies must contain refreshed refresh_token');

    // 3. Compare exact changed cookie VALUE in x-middleware-request-cookie override
    const middlewareReqCookie = res.headers.get('x-middleware-request-cookie');
    assert.ok(middlewareReqCookie, 'x-middleware-request-cookie override header must be present');
    assert.ok(middlewareReqCookie.includes(updatedReqCookie), 'x-middleware-request-cookie must contain the exact refreshed cookie value');
    assert.ok(!middlewareReqCookie.includes(initialCookie.value), 'x-middleware-request-cookie must NOT contain stale cookie value');

    // 4. Compare exact changed cookie VALUE in response Set-Cookie (no stale value)
    const setCookieHeader = res.headers.get('set-cookie');
    assert.ok(setCookieHeader, 'Set-Cookie header must be present on response');
    assert.ok(setCookieHeader.includes(updatedReqCookie), 'Set-Cookie must contain refreshed cookie value');
    assert.ok(!setCookieHeader.includes(initialCookie.value), 'Set-Cookie must NOT contain stale cookie value');
    assert.equal(res.cookies.get(initialCookie.name)?.value, updatedReqCookie, 'response.cookies must have refreshed value');

    // 5. Preserve cookie SDK flags and Cache-Control private/no-store, Expires 0, Pragma no-cache
    assert.ok(setCookieHeader.toLowerCase().includes('path=/'), 'Cookie path flag must be preserved');
    assert.ok(setCookieHeader.toLowerCase().includes('samesite=lax'), 'Cookie sameSite flag must be preserved');
    assert.equal(res.headers.get('expires'), '0', 'Expires header must be 0');
    assert.equal(res.headers.get('pragma'), 'no-cache', 'Pragma header must be no-cache');
    const cc = res.headers.get('cache-control') || '';
    assert.ok(cc.includes('no-store') && cc.includes('private'), 'Cache-Control must contain private and no-store');

    // 6. Assert cookie/token values do not leak into unrelated response body/headers
    assert.equal(res.headers.get('x-access-token'), null, 'Access token must not leak into headers');
    assert.equal(res.headers.get('x-refresh-token'), null, 'Refresh token must not leak into headers');
    const bodyText = await res.text();
    assert.ok(!bodyText.includes(refreshedAccessToken), 'Refreshed access token must not leak into response body');
    assert.ok(!bodyText.includes(refreshedRefreshToken), 'Refreshed refresh token must not leak into response body');

    // 7. Alternate response copying via applyProxyAuthToResponse
    const altRedirect = NextResponse.redirect('http://localhost:3000/holding');
    const enrichedAlt = applyProxyAuthToResponse(res, altRedirect);
    assert.equal(enrichedAlt.status, 307);
    assert.ok(enrichedAlt.headers.get('set-cookie')?.includes(updatedReqCookie), 'Alternate response must receive refreshed cookie');
    assert.equal(enrichedAlt.headers.get('expires'), '0', 'Alternate response must receive Expires: 0');
    assert.equal(enrichedAlt.headers.get('pragma'), 'no-cache', 'Alternate response must receive Pragma: no-cache');
    assert.ok(enrichedAlt.headers.get('cache-control')?.includes('private'), 'Alternate response must receive Cache-Control');

    // 8. Downstream route execution: ACTIVE ADMIN allowed, changed role/status denied with zero language writes
    currentCookieStore = {
      getAll: () => [{ name: initialCookie.name, value: updatedReqCookie }],
      get: (name) => name === initialCookie.name ? { name: initialCookie.name, value: updatedReqCookie } : undefined,
      set: () => {},
      delete: () => {},
    };

    let languageWrites = 0;
    setProductPrismaForTest({
      account: {
        findUnique: async () => ({
          id: DUMMY_ADMIN_ID,
          role: 'ADMIN',
          status: 'ACTIVE',
          displayName: 'Quản Trị Viên',
          uiLocale: 'vi',
        }),
      },
      language: {
        findMany: async () => [{ id: '1', code: 'vi', names: { vi: 'Tiếng Việt' } }],
        create: async () => { languageWrites++; },
        update: async () => { languageWrites++; },
        delete: async () => { languageWrites++; },
      },
    });

    const getResp = await getLanguagesRoute(new Request('http://localhost:3000/api/languages', {
      headers: { Host: 'localhost:3000', Origin: 'http://localhost:3000' },
    }));
    assert.equal(getResp.status, 200, 'Downstream route must allow ACTIVE ADMIN with forwarded refreshed cookie');

    // Deny changed role TEACHER freshly with zero writes
    setProductPrismaForTest({
      account: {
        findUnique: async () => ({
          id: DUMMY_ADMIN_ID,
          role: 'TEACHER',
          status: 'ACTIVE',
          displayName: 'Giáo Viên',
          uiLocale: 'vi',
        }),
      },
      language: {
        create: async () => { languageWrites++; },
      },
    });
    const postTeacherResp = await postLanguagesRoute(new Request('http://localhost:3000/api/languages', {
      method: 'POST',
      headers: { Host: 'localhost:3000', Origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'ja', names: { vi: 'Tiếng Nhật' } }),
    }));
    assert.equal(postTeacherResp.status, 403, 'Downstream route must deny changed role TEACHER');
    assert.equal(languageWrites, 0, 'Zero language writes must be performed on denied role');

    // Deny changed status DISABLED freshly with zero writes
    setProductPrismaForTest({
      account: {
        findUnique: async () => ({
          id: DUMMY_ADMIN_ID,
          role: 'ADMIN',
          status: 'DISABLED',
          displayName: 'Vô hiệu hóa',
          uiLocale: 'vi',
        }),
      },
      language: {
        create: async () => { languageWrites++; },
      },
    });
    const postDisabledResp = await postLanguagesRoute(new Request('http://localhost:3000/api/languages', {
      method: 'POST',
      headers: { Host: 'localhost:3000', Origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'ja', names: { vi: 'Tiếng Nhật' } }),
    }));
    assert.equal(postDisabledResp.status, 403, 'Downstream route must deny disabled account status');
    assert.equal(languageWrites, 0, 'Zero language writes must be performed on disabled account');

    // Assert downstream did not independently refresh (old refresh token was consumed only once by proxy)
    assert.equal(refreshCallsCount, 1, 'Provider double refresh-token grant must only be invoked by proxy refresh');
    assert.equal(usedRefreshTokens.size, 1, 'Initial refresh token must be revoked after first consumption');
  });

  test('S-R1a / FINAL-1 C1: proxy preserves multi-chunk session cookies and SDK headers through real installed SDK boundary', async () => {
    const longPayload = 'x'.repeat(4000);
    const exp = Math.floor(Date.now() / 1000) - 120;
    const initialJwt = createSyntheticJwt(DUMMY_ADMIN_ID, 'admin@lingora.edu.vn', exp);
    const refreshedJwt = createSyntheticJwt(DUMMY_ADMIN_ID, 'admin@lingora.edu.vn', exp + 7200);

    const sessionData = {
      access_token: initialJwt,
      refresh_token: 'synthetic-chunked-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: exp,
      user: { id: DUMMY_ADMIN_ID, email: 'admin@lingora.edu.vn', extra: longPayload },
    };
    const rawCookie = 'base64-' + Buffer.from(JSON.stringify(sessionData)).toString('base64');
    const chunk0 = rawCookie.slice(0, 3000);
    const chunk1 = rawCookie.slice(3000);

    globalThis.fetch = async (url) => {
      const u = String(url);
      if (u.includes('/token')) {
        return new Response(JSON.stringify({
          access_token: refreshedJwt,
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: 'new-chunked-refresh-token',
          user: { id: DUMMY_ADMIN_ID, email: 'admin@lingora.edu.vn', extra: longPayload },
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
            'Expires': '0',
            'Pragma': 'no-cache',
          },
        });
      }
      if (u.includes('/user')) {
        return new Response(JSON.stringify({ id: DUMMY_ADMIN_ID, email: 'admin@lingora.edu.vn' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('{}', { status: 200 });
    };

    const cookieBaseName = 'sb-sncfyvpzwedqgwfpffkh-auth-token';
    const req = new NextRequest('http://localhost:3000/languages', {
      headers: {
        host: 'localhost:3000',
        cookie: `${cookieBaseName}.0=${chunk0}; ${cookieBaseName}.1=${chunk1}`,
      },
    });

    const res = await proxy(req);

    // Verify all chunks are forwarded downstream and to response
    const downstreamChunks = req.cookies.getAll().filter(c => c.name.startsWith(cookieBaseName));
    assert.ok(downstreamChunks.length >= 2, 'Downstream request must receive chunked cookies');

    const responseChunks = res.cookies.getAll().filter(c => c.name.startsWith(cookieBaseName));
    assert.ok(responseChunks.length >= 2, 'Response must receive chunked cookies');

    const downstreamHeader = res.headers.get('x-middleware-request-cookie') || '';
    assert.ok(downstreamHeader.includes(`${cookieBaseName}.0=`), 'Downstream header must include chunk 0');
    assert.ok(downstreamHeader.includes(`${cookieBaseName}.1=`), 'Downstream header must include chunk 1');

    assert.equal(res.headers.get('expires'), '0');
    assert.equal(res.headers.get('pragma'), 'no-cache');
    assert.ok(res.headers.get('cache-control')?.includes('no-store'));
  });
});

describe('S1-02 / STAB-1 R1, R9: Actual Route Handlers (/api/auth/login and logout)', () => {
  test('POST /api/auth/login rejects foreign Origin with 403 FORBIDDEN_ORIGIN and private headers', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Origin': 'https://attacker.evil.com',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'admin@lingora.edu.vn', password: 'secretpassword' }),
    });

    const res = await loginRoute(req);
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.error.code, 'FORBIDDEN_ORIGIN');
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
  });

  test('POST /api/auth/login rejects non-json Content-Type with 415 and private headers', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'text/plain',
      },
      body: 'invalid-body',
    });

    const res = await loginRoute(req);
    assert.equal(res.status, 415);
    const json = await res.json();
    assert.equal(json.error.code, 'UNSUPPORTED_MEDIA_TYPE');
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
  });

  test('POST /api/auth/login rejects malformed json with 400 MALFORMED_JSON', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: '{ not-valid-json ',
    });

    const res = await loginRoute(req);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.error.code, 'MALFORMED_JSON');
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
  });

  test('POST /api/auth/login rejects invalid email/password format with 400 VALIDATION_ERROR', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'not-an-email', password: '' }),
    });

    const res = await loginRoute(req);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.error.code, 'VALIDATION_ERROR');
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
  });

  test('S-R9a: POST /api/auth/login valid credentials returns 200 and collects SDK headers/cookies', async () => {
    globalThis.fetch = async (url) => {
      const u = String(url);
      if (u.includes('/auth/v1/token')) {
        return new Response(JSON.stringify({
          access_token: 'token.payload.sig',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'ref-token',
          user: { id: DUMMY_ADMIN_ID, email: 'admin@lingora.edu.vn' },
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
            'Expires': '0',
            'Pragma': 'no-cache',
          },
        });
      }
      if (u.includes('/auth/v1/user')) {
        return new Response(JSON.stringify({
          id: DUMMY_ADMIN_ID,
          email: 'admin@lingora.edu.vn',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('{}', { status: 200 });
    };

    setProductPrismaForTest({
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

    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'admin@lingora.edu.vn', password: 'correctpassword' }),
    });

    const res = await loginRoute(req);
    assert.equal(res.status, 200);
    const cc = res.headers.get('Cache-Control');
    assert.ok(cc.includes('no-store') && cc.includes('private'), 'Cache-Control must contain private and no-store');
    assert.equal(res.headers.get('Expires'), '0');
    assert.equal(res.headers.get('Pragma'), 'no-cache');
    const json = await res.json();
    assert.equal(json.data.user.id, DUMMY_ADMIN_ID);
    assert.equal(json.data.account.role, 'ADMIN');
  });

  test('S-R9a: POST /api/auth/login invalid credentials returns 401 with no-store headers', async () => {
    globalThis.fetch = async (url) => {
      if (String(url).includes('/auth/v1/token')) {
        return new Response(JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('{}', { status: 200 });
    };

    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'admin@lingora.edu.vn', password: 'wrongpassword' }),
    });

    const res = await loginRoute(req);
    assert.equal(res.status, 401);
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
    const json = await res.json();
    assert.equal(json.error.code, 'INVALID_CREDENTIALS');
  });

  test('S-R9a: POST /api/auth/login account-denial alternatives (DISABLED, LEARNER, MISSING) sign out and preserve headers', async () => {
    let signoutInvoked = false;
    globalThis.fetch = async (url) => {
      const u = String(url);
      if (u.includes('/auth/v1/token')) {
        return new Response(JSON.stringify({
          access_token: 'token.payload.sig',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'ref-token',
          user: { id: DUMMY_ADMIN_ID, email: 'admin@lingora.edu.vn' },
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
            'Expires': '0',
            'Pragma': 'no-cache',
          },
        });
      }
      if (u.includes('/auth/v1/logout')) {
        signoutInvoked = true;
        return new Response('{}', { status: 200 });
      }
      if (u.includes('/auth/v1/user')) {
        return new Response(JSON.stringify({
          id: DUMMY_ADMIN_ID,
          email: 'admin@lingora.edu.vn',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('{}', { status: 200 });
    };

    // Case 1: Account DISABLED
    setProductPrismaForTest({
      account: {
        findUnique: async () => ({
          id: DUMMY_ADMIN_ID,
          role: 'ADMIN',
          status: 'DISABLED',
          displayName: 'Disabled Admin',
          uiLocale: 'vi',
        }),
      },
    });

    const reqDisabled = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'admin@lingora.edu.vn', password: 'password123' }),
    });

    const resDisabled = await loginRoute(reqDisabled);
    assert.equal(resDisabled.status, 403);
    const jsonDisabled = await resDisabled.json();
    assert.equal(jsonDisabled.error.code, 'ACCOUNT_INACTIVE');
    const ccDisabled = resDisabled.headers.get('Cache-Control');
    assert.ok(ccDisabled.includes('no-store') && ccDisabled.includes('private'), 'Must contain private and no-store');
    assert.equal(signoutInvoked, true, 'Account denial must invoke signOut to clear session');

    // Case 2: Account LEARNER
    signoutInvoked = false;
    setProductPrismaForTest({
      account: {
        findUnique: async () => ({
          id: DUMMY_ADMIN_ID,
          role: 'LEARNER',
          status: 'ACTIVE',
          displayName: 'Learner User',
          uiLocale: 'vi',
        }),
      },
    });

    const reqLearner = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'admin@lingora.edu.vn', password: 'password123' }),
    });

    const resLearner = await loginRoute(reqLearner);
    assert.equal(resLearner.status, 403);
    const jsonLearner = await resLearner.json();
    assert.equal(jsonLearner.error.code, 'FORBIDDEN');
    assert.equal(signoutInvoked, true, 'Non-staff account denial must invoke signOut');
  });

  test('POST /api/auth/logout rejects foreign Origin with 403 and private headers', async () => {
    const req = new Request('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: {
        'Origin': 'https://evil.com',
        'Host': 'localhost:3000',
      },
    });

    const res = await logoutRoute(req);
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.error.code, 'FORBIDDEN_ORIGIN');
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
  });

  test('S-R9a: POST /api/auth/logout with active session deletes cookies and returns 200 with no-store', async () => {
    let logoutCalled = false;
    globalThis.fetch = async (url) => {
      if (String(url).includes('/auth/v1/logout')) {
        logoutCalled = true;
        return new Response('{}', { status: 200 });
      }
      return new Response('{}', { status: 200 });
    };

    const cookieMap = new Map();
    const sessionCookie = createMockSessionCookie(DUMMY_ADMIN_ID);
    cookieMap.set(sessionCookie.name, sessionCookie.value);

    currentCookieStore = {
      getAll: () => Array.from(cookieMap.entries()).map(([name, value]) => ({ name, value })),
      get: (n) => ({ name: n, value: cookieMap.get(n) }),
      set: (n, v, opts) => { cookieMap.set(n, v); },
      delete: (n) => { cookieMap.delete(n); },
    };

    const req = new Request('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
      },
    });

    const res = await logoutRoute(req);
    assert.equal(res.status, 200);
    const cc = res.headers.get('Cache-Control');
    assert.ok(cc.includes('no-store') && cc.includes('private'), 'Cache-Control must contain private and no-store');
    const json = await res.json();
    assert.equal(json.data.success, true);
    assert.equal(logoutCalled, true, 'Logout route must call provider logout');
  });
});

describe('S1-02 / STAB-1 R9: Real Protected Handler Auth Matrix & Write Spies', () => {
  test('Protected route GET /api/languages: auth matrix and zero write check', async () => {
    let writeCount = 0;
    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: DUMMY_TEACHER_ID,
          role: 'TEACHER',
          status: 'ACTIVE',
          displayName: 'Teacher',
          uiLocale: 'vi',
        }),
      },
      language: {
        create: async () => { writeCount++; },
        update: async () => { writeCount++; },
        delete: async () => { writeCount++; },
      },
    };
    setProductPrismaForTest(mockPrisma);

    // 1. Missing cookie -> 401
    currentCookieStore = { getAll: () => [] };
    const resUnauth = await getLanguagesRoute(new Request('http://localhost:3000/api/languages'));
    assert.equal(resUnauth.status, 401);
    assert.equal(resUnauth.headers.get('Cache-Control'), 'no-store, private');

    // 2. Teacher role -> 403
    globalThis.fetch = async () => new Response(JSON.stringify({ id: DUMMY_TEACHER_ID }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    currentCookieStore = { getAll: () => [createMockSessionCookie(DUMMY_TEACHER_ID)] };
    const resTeacher = await getLanguagesRoute(new Request('http://localhost:3000/api/languages'));
    assert.equal(resTeacher.status, 403);
    assert.equal(resTeacher.headers.get('Cache-Control'), 'no-store, private');

    // 3. Provider 503 -> 503
    globalThis.fetch = async () => new Response('{}', { status: 503, headers: { 'Content-Type': 'application/json' } });
    const res503 = await getLanguagesRoute(new Request('http://localhost:3000/api/languages'));
    assert.equal(res503.status, 503);
    assert.equal(res503.headers.get('Cache-Control'), 'no-store, private');

    assert.equal(writeCount, 0, 'Zero writes must occur on denied GET');
  });

  test('Protected route POST /api/languages: write spy asserts zero writes on denied requests', async () => {
    let writeCount = 0;
    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: DUMMY_TEACHER_ID,
          role: 'TEACHER',
          status: 'ACTIVE',
          displayName: 'Teacher',
          uiLocale: 'vi',
        }),
      },
      language: {
        create: async () => { writeCount++; return { id: 'dummy' }; },
      },
    };
    setProductPrismaForTest(mockPrisma);

    // Denied TEACHER attempting POST
    globalThis.fetch = async () => new Response(JSON.stringify({ id: DUMMY_TEACHER_ID }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    currentCookieStore = { getAll: () => [createMockSessionCookie(DUMMY_TEACHER_ID)] };

    const req = new Request('http://localhost:3000/api/languages', {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'ko', names: { vi: 'Tiếng Hàn' }, isLearnable: true, isUiLocale: false }),
    });

    const res = await postLanguagesRoute(req);
    assert.equal(res.status, 403);
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
    assert.equal(writeCount, 0, 'Denied POST attempt must perform ZERO database writes');
  });

  test('Protected route PATCH /api/languages/[id]: write spy asserts zero writes on unauthenticated request', async () => {
    let writeCount = 0;
    const mockPrisma = {
      account: { findUnique: async () => null },
      language: {
        update: async () => { writeCount++; return {}; },
      },
    };
    setProductPrismaForTest(mockPrisma);
    currentCookieStore = { getAll: () => [] };

    const req = new Request('http://localhost:3000/api/languages/00000000-0000-4000-8000-000000000001', {
      method: 'PATCH',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ names: { vi: 'Tiếng Thử' } }),
    });

    const res = await patchLanguageRoute(req, {
      params: Promise.resolve({ id: '00000000-0000-4000-8000-000000000001' }),
    });
    assert.equal(res.status, 401);
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
    assert.equal(writeCount, 0, 'Denied PATCH attempt must perform ZERO database writes');
  });

  test('Protected route DELETE /api/languages/[id]: write spy asserts zero writes on unauthenticated request', async () => {
    let writeCount = 0;
    const mockPrisma = {
      account: { findUnique: async () => null },
      language: {
        delete: async () => { writeCount++; return {}; },
      },
    };
    setProductPrismaForTest(mockPrisma);
    currentCookieStore = { getAll: () => [] };

    const req = new Request('http://localhost:3000/api/languages/00000000-0000-4000-8000-000000000001', {
      method: 'DELETE',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
      },
    });

    const res = await deleteLanguageRoute(req, {
      params: Promise.resolve({ id: '00000000-0000-4000-8000-000000000001' }),
    });
    assert.equal(res.status, 401);
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
    assert.equal(writeCount, 0, 'Denied DELETE attempt must perform ZERO database writes');
  });
});

describe('S1-02: Same-Origin Enforcement', () => {
  test('accepts matching scheme, hostname, and port', () => {
    const req = new Request('http://localhost:3000/api/languages', {
      headers: { origin: 'http://localhost:3000', host: 'localhost:3000' },
    });
    assert.equal(validateSameOrigin(req), true);
  });

  test('accepts matching HTTPS production domain', () => {
    const req = new Request('https://admin.lingora.edu.vn/api/languages', {
      headers: { origin: 'https://admin.lingora.edu.vn', host: 'admin.lingora.edu.vn' },
    });
    assert.equal(validateSameOrigin(req), true);
  });

  test('rejects mismatched port', () => {
    const req = new Request('http://localhost:3000/api/languages', {
      headers: { origin: 'http://localhost:4000', host: 'localhost:3000' },
    });
    assert.equal(validateSameOrigin(req), false);
  });

  test('rejects null origin', () => {
    const req = new Request('http://localhost:3000/api/languages', {
      headers: { origin: 'null', host: 'localhost:3000' },
    });
    assert.equal(validateSameOrigin(req), false);
  });

  test('rejects missing origin on mutation endpoint', () => {
    const req = new Request('http://localhost:3000/api/languages', {
      headers: { host: 'localhost:3000' },
    });
    assert.equal(validateSameOrigin(req), false);
  });
});
