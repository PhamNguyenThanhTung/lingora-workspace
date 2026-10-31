import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import { getLearnerCookieName } from '../../src/server/auth/env.ts';

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

const { POST: loginRoute } = await import('../../src/app/api/auth/login/route.ts');
const { POST: logoutRoute } = await import('../../src/app/api/auth/logout/route.ts');
const { GET: contextRoute } = await import('../../src/app/api/learner/context/route.ts');

const PROD_LEARNER_ID = '99999999-9999-4999-8999-999999999999';
const PROD_LANG_ID = '11111111-1111-4111-8111-111111111111';
const PROD_COURSE_ID = '55555555-5555-4555-8555-555555555555';
const PROD_FW_ID = '33333333-3333-4333-8333-333333333333';
const PROD_LEVEL_ID = '77777777-7777-4777-8777-777777777777';

function createSyntheticJwt(userId = PROD_LEARNER_ID, email = 'learner.prod@lingora.edu.vn', exp = Math.floor(Date.now() / 1000) + 3600) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: userId, email, exp })).toString('base64url');
  return `${header}.${payload}.synthetic_jwt_signature`;
}

function parseCookiesFromHeaders(headers) {
  const cookies = [];
  const setCookieHeaders = typeof headers.getSetCookie === 'function'
    ? headers.getSetCookie()
    : [headers.get('set-cookie')].filter(Boolean);

  for (const str of setCookieHeaders) {
    if (!str) continue;
    const parts = str.split(';');
    const [name, ...valParts] = parts[0].trim().split('=');
    cookies.push({ name, value: valParts.join('=') });
  }
  return cookies;
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

describe('Slice 9: Production Login → Session → Context Flow', () => {
  test('Complete flow: Production login establishes SSR cookies → context route returns identity & owned context → logout invalidates session', async () => {
    // 1. Setup mock database records for product learner and learning context
    setLearnerPrismaForTest({
      account: {
        findUnique: async ({ where }) => {
          if (where.id === PROD_LEARNER_ID) {
            return {
              id: PROD_LEARNER_ID,
              role: 'LEARNER',
              status: 'ACTIVE',
              displayName: 'Lê Văn Học',
              uiLocale: 'vi',
            };
          }
          return null;
        },
      },
      learningContext: {
        findMany: async ({ where }) => {
          if (where.learnerId === PROD_LEARNER_ID) {
            return [
              {
                id: 'ctx-prod-1',
                learnerId: PROD_LEARNER_ID,
                languageId: PROD_LANG_ID,
                courseId: PROD_COURSE_ID,
                status: 'ACTIVE',
                createdAt: new Date('2026-10-31T10:00:00Z'),
                language: {
                  id: PROD_LANG_ID,
                  code: 'en',
                  names: { vi: 'Tiếng Anh', en: 'English' },
                },
                course: {
                  id: PROD_COURSE_ID,
                  languageId: PROD_LANG_ID,
                  frameworkId: PROD_FW_ID,
                  names: { vi: 'Tiếng Anh Căn Bản', en: 'Basic English' },
                  isActive: true,
                  framework: {
                    id: PROD_FW_ID,
                    code: 'CEFR',
                    version: '2020',
                    names: { vi: 'CEFR', en: 'CEFR' },
                  },
                },
                selectedStartLevel: {
                  id: PROD_LEVEL_ID,
                  frameworkId: PROD_FW_ID,
                  code: 'A1',
                  label: { vi: 'A1 Khởi đầu' },
                  position: 1,
                },
                workingLevel: null,
              },
            ];
          }
          return [];
        },
      },
    });

    // 2. Setup mock provider responses for Supabase Auth
    globalThis.fetch = async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes('/auth/v1/token')) {
        return new Response(JSON.stringify({
          access_token: createSyntheticJwt(PROD_LEARNER_ID, 'learner.prod@lingora.edu.vn'),
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'prod-refresh-token',
          user: {
            id: PROD_LEARNER_ID,
            email: 'learner.prod@lingora.edu.vn',
            email_confirmed_at: '2026-10-31T00:00:00Z',
          },
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (urlStr.includes('/auth/v1/user')) {
        return new Response(JSON.stringify({
          id: PROD_LEARNER_ID,
          email: 'learner.prod@lingora.edu.vn',
          email_confirmed_at: '2026-10-31T00:00:00Z',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (urlStr.includes('/auth/v1/logout')) {
        return new Response(null, { status: 204 });
      }
      return new Response('Not Found', { status: 404 });
    };

    // 3. Step 1: Login via POST /api/auth/login
    const inMemoryCookies = new Map();
    currentCookieStore = {
      getAll: () => Array.from(inMemoryCookies.values()),
      get: (name) => inMemoryCookies.get(name),
      set: (name, value, options) => inMemoryCookies.set(name, { name, value, options }),
      delete: (name) => inMemoryCookies.delete(name),
    };

    const loginReq = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: 'learner.prod@lingora.edu.vn',
        password: 'valid-password-123',
      }),
    });

    const loginRes = await loginRoute(loginReq);
    assert.equal(loginRes.status, 200, 'Login must succeed with 200');
    const loginJson = await loginRes.json();
    assert.equal(loginJson.data.account.role, 'LEARNER');
    assert.equal(loginJson.data.account.status, 'ACTIVE');

    // Verify session cookies were established in response
    const establishedCookies = parseCookiesFromHeaders(loginRes.headers);
    assert.ok(
      establishedCookies.length > 0 || inMemoryCookies.size > 0,
      'Login must establish auth session cookie'
    );

    // Merge established cookies into inMemoryCookies
    for (const c of establishedCookies) {
      inMemoryCookies.set(c.name, c);
    }

    // 4. Step 2: Access GET /api/learner/context using established cookies
    const contextReq = new Request('http://localhost:3000/api/learner/context', {
      method: 'GET',
      headers: {
        host: 'localhost:3000',
      },
    });

    const contextRes = await contextRoute(contextReq);
    assert.equal(contextRes.status, 200, 'Context route must return 200 for authenticated learner');
    const contextJson = await contextRes.json();

    assert.equal(contextJson.data.learner.id, PROD_LEARNER_ID);
    assert.equal(contextJson.data.learner.displayName, 'Lê Văn Học');
    assert.equal(contextJson.data.contexts.length, 1);
    assert.equal(contextJson.data.contexts[0].id, 'ctx-prod-1');
    assert.equal(contextJson.data.contexts[0].targetLanguage.code, 'en');
    assert.equal(contextJson.data.contexts[0].course.names.vi, 'Tiếng Anh Căn Bản');
    assert.equal(contextJson.data.contexts[0].selectedStartLevel.code, 'A1');

    // 5. Step 3: Logout via POST /api/auth/logout
    const logoutReq = new Request('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
      },
    });

    const logoutRes = await logoutRoute(logoutReq);
    assert.equal(logoutRes.status, 200, 'Logout must succeed with 200');

    // Process deleted cookies from response set-cookie headers
    const logoutCookies = parseCookiesFromHeaders(logoutRes.headers);
    for (const c of logoutCookies) {
      if (c.value === '' || (logoutRes.headers.get('set-cookie') || '').includes('Max-Age=0')) {
        inMemoryCookies.delete(c.name);
      }
    }
    // 6. Step 4: Next request to GET /api/learner/context must return 401 UNAUTHENTICATED
    const postLogoutContextReq = new Request('http://localhost:3000/api/learner/context', {
      method: 'GET',
      headers: {
        host: 'localhost:3000',
      },
    });

    const postLogoutRes = await contextRoute(postLogoutContextReq);
    assert.equal(
      postLogoutRes.status,
      401,
      'Subsequent protected context request must be 401 after logout'
    );
    const postLogoutJson = await postLogoutRes.json();
    assert.equal(postLogoutJson.error.code, 'UNAUTHENTICATED');
  });
});
