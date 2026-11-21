import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  bootstrapLearnerAccount,
  hasStaffAppMetadata,
  registerSchema,
  getLearnerCookieName,
} from '../../src/server/auth/index.ts';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '../..');

const cookieMap = new Map();
let cookieStoreRetrievalCount = 0;
let cookieAccessCount = 0;

let currentCookieStore = {
  getAll: () => {
    cookieAccessCount++;
    return [...cookieMap.entries()].map(([name, value]) => ({ name, value }));
  },
  get: (name) => {
    cookieAccessCount++;
    return cookieMap.get(name) ? { name, value: cookieMap.get(name) } : undefined;
  },
  has: (name) => {
    cookieAccessCount++;
    return cookieMap.has(name);
  },
  set: (name, val, opts) => {
    if (opts?.maxAge === 0) cookieMap.delete(name);
    else cookieMap.set(name, val);
  },
  setAll: (cookiesToSet) => {
    for (const { name, value, options } of cookiesToSet) {
      if (options?.maxAge === 0) cookieMap.delete(name);
      else cookieMap.set(name, value);
    }
  },
  delete: (name) => cookieMap.delete(name),
};

mock.module('next/headers.js', {
  exports: {
    cookies: async () => {
      cookieStoreRetrievalCount++;
      return currentCookieStore;
    },
  },
});

const { POST: registerRoute } = await import('../../src/app/api/auth/register/route.ts');
const { GET: confirmRoute, POST: confirmPostRoute } = await import('../../src/app/auth/confirm/route.ts');
const { POST: loginRoute } = await import('../../src/app/api/auth/login/route.ts');

const DUMMY_LEARNER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const DUMMY_STAFF_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const originalFetch = globalThis.fetch;

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-placeholder';
  cookieMap.clear();
  cookieStoreRetrievalCount = 0;
  cookieAccessCount = 0;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  setLearnerPrismaForTest(null);
});

describe('Package A: Registration (POST /api/auth/register)', () => {
  test('rejects foreign origin with 403 FORBIDDEN_ORIGIN', async () => {
    const req = new Request('https://lingora.edu.vn/api/auth/register', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://attacker.com',
      },
      body: JSON.stringify({ email: 'new@lingora.edu.vn', password: 'password123' }),
    });

    const res = await registerRoute(req);
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error?.code, 'FORBIDDEN_ORIGIN');
  });

  test('rejects non-json content-type with 415 UNSUPPORTED_MEDIA_TYPE', async () => {
    const req = new Request('https://lingora.edu.vn/api/auth/register', {
      method: 'POST',
      headers: {
        'content-type': 'text/plain',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: 'email=new@lingora.edu.vn',
    });

    const res = await registerRoute(req);
    assert.equal(res.status, 415);
  });

  test('rejects malformed JSON with 400 MALFORMED_JSON', async () => {
    const req = new Request('https://lingora.edu.vn/api/auth/register', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: '{invalid-json',
    });

    const res = await registerRoute(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error?.code, 'MALFORMED_JSON');
  });

  test('rejects invalid email or short password (< 8 chars) with 400 VALIDATION_ERROR', async () => {
    const reqShort = new Request('https://lingora.edu.vn/api/auth/register', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: JSON.stringify({ email: 'valid@lingora.edu.vn', password: 'short' }),
    });

    const resShort = await registerRoute(reqShort);
    assert.equal(resShort.status, 400);
    const bodyShort = await resShort.json();
    assert.equal(bodyShort.error?.code, 'VALIDATION_ERROR');
    assert.match(bodyShort.error?.message, /ít nhất 8 ký tự/i);

    const reqBadEmail = new Request('https://lingora.edu.vn/api/auth/register', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: JSON.stringify({ email: 'not-an-email', password: 'password123' }),
    });

    const resBadEmail = await registerRoute(reqBadEmail);
    assert.equal(resBadEmail.status, 400);
  });

  test('rejects extra fields with 400 VALIDATION_ERROR (strict schema)', async () => {
    const req = new Request('https://lingora.edu.vn/api/auth/register', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: JSON.stringify({
        email: 'user@lingora.edu.vn',
        password: 'password123',
        role: 'ADMIN', // injection attempt
      }),
    });

    const res = await registerRoute(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error?.code, 'VALIDATION_ERROR');
  });

  test('successful registration dispatches provider signUp and returns safe instructions without credentials/session', async () => {
    let capturedSignUpBody = null;
    let capturedSignUpUrl = null;

    globalThis.fetch = async (url, opts) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/v1/signup')) {
        capturedSignUpUrl = urlStr;
        capturedSignUpBody = JSON.parse(opts.body);
        return new Response(
          JSON.stringify({
            id: DUMMY_LEARNER_ID,
            email: 'newlearner@lingora.edu.vn',
            confirmed_at: null,
            identities: [{ id: 'id-1' }],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    };

    const req = new Request('https://lingora.edu.vn/api/auth/register', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: JSON.stringify({
        email: 'NewLearner@lingora.edu.vn',
        password: 'securePassword123',
        displayName: 'Nguyễn Văn Mới',
      }),
    });

    const res = await registerRoute(req);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.match(body.message, /kiểm tra hộp thư/i);
    // Asserts no credentials, tokens, or sessions in response
    assert.equal(body.session, undefined);
    assert.equal(body.password, undefined);
    assert.equal(body.access_token, undefined);

    // Verify provider received sanitized data
    assert.equal(capturedSignUpBody.email, 'newlearner@lingora.edu.vn');
    assert.equal(capturedSignUpBody.data?.display_name, 'Nguyễn Văn Mới');
    assert.match(capturedSignUpUrl, /redirect_to=.*auth%2Fconfirm/);
  });

  test('duplicate email signup returns safe generic confirmation response without leaking identity', async () => {
    globalThis.fetch = async (url, opts) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/v1/signup')) {
        return new Response(
          JSON.stringify({
            code: 'user_already_exists',
            msg: 'User already registered',
          }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    };

    const req = new Request('https://lingora.edu.vn/api/auth/register', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: JSON.stringify({
        email: 'existing@lingora.edu.vn',
        password: 'securePassword123',
      }),
    });

    const res = await registerRoute(req);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.match(body.message, /kiểm tra hộp thư/i);
  });

  test('Review finding 8: signup new vs duplicate safe success returns strictly IDENTICAL status and body envelope', async () => {
    // 1. New user registration
    globalThis.fetch = async (url) => {
      if (String(url).includes('/auth/v1/signup')) {
        return new Response(
          JSON.stringify({
            id: DUMMY_LEARNER_ID,
            email: 'newuser@lingora.edu.vn',
            confirmed_at: null,
            identities: [{ id: 'id-1' }],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    };

    const newReq = new Request('https://lingora.edu.vn/api/auth/register', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: JSON.stringify({ email: 'newuser@lingora.edu.vn', password: 'securePassword123' }),
    });
    const newRes = await registerRoute(newReq);
    assert.equal(newRes.status, 200);
    const newBody = await newRes.json();

    // 2. Duplicate registration with injected private diagnostic
    const INJECTED_DIAGNOSTIC = 'INTERNAL_DB_CLUSTER_NODE_PRIMARY_SECRET: postgresql://10.0.0.12:5432/db';
    globalThis.fetch = async (url) => {
      if (String(url).includes('/auth/v1/signup')) {
        return new Response(
          JSON.stringify({
            code: 'user_already_exists',
            msg: `User already registered. Diagnostic: ${INJECTED_DIAGNOSTIC}`,
          }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    };

    const dupReq = new Request('https://lingora.edu.vn/api/auth/register', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: JSON.stringify({ email: 'newuser@lingora.edu.vn', password: 'securePassword123' }),
    });
    const dupRes = await registerRoute(dupReq);
    assert.equal(dupRes.status, 200);
    const dupBody = await dupRes.json();

    // Envelopes and HTTP status must be strictly identical
    assert.equal(newRes.status, dupRes.status);
    assert.deepStrictEqual(newBody, dupBody);

    // Injected provider diagnostic must NEVER appear in duplicate response
    assert.doesNotMatch(JSON.stringify(dupBody), new RegExp('INTERNAL_DB_CLUSTER_NODE_PRIMARY_SECRET'));
    assert.doesNotMatch(JSON.stringify(dupBody), new RegExp('10\\.0\\.0\\.12'));
  });

  test('Review finding 8: provider errors use fixed safe messages and never forward injected private diagnostic error text', async () => {
    const PRIVATE_DIAGNOSTIC = 'FATAL_INTERNAL_SERVER_ERROR_SECRET_KEY_123456';

    globalThis.fetch = async (url) => {
      if (String(url).includes('/auth/v1/signup')) {
        return new Response(
          JSON.stringify({
            code: 'unhandled_provider_exception',
            msg: `Fatal exception in database adapter: ${PRIVATE_DIAGNOSTIC}`,
          }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    };

    const req = new Request('https://lingora.edu.vn/api/auth/register', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: JSON.stringify({ email: 'probe@lingora.edu.vn', password: 'securePassword123' }),
    });

    const res = await registerRoute(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    const rawJson = JSON.stringify(body);

    // Raw diagnostic text must never be forwarded
    assert.doesNotMatch(rawJson, new RegExp(PRIVATE_DIAGNOSTIC));
    assert.equal(body.error?.code, 'REGISTRATION_FAILED');
    assert.equal(body.error?.message, 'Đăng ký tài khoản không thành công. Vui lòng thử lại.');
  });

  test('Review finding 8: allowlisted provider error codes return fixed safe messages and omit raw provider message text', async () => {
    const RAW_DIAGNOSTIC = 'PwnedPasswordCheckAPI returned compromised hash: 12345';

    globalThis.fetch = async (url) => {
      if (String(url).includes('/auth/v1/signup')) {
        return new Response(
          JSON.stringify({
            code: 'weak_password',
            error_code: 'weak_password',
            msg: RAW_DIAGNOSTIC,
          }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    };

    const req = new Request('https://lingora.edu.vn/api/auth/register', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: JSON.stringify({ email: 'user@lingora.edu.vn', password: 'weakPassword123' }),
    });

    const res = await registerRoute(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error?.code, 'WEAK_PASSWORD');
    assert.equal(body.error?.message, 'Mật khẩu không đáp ứng yêu cầu bảo mật của hệ thống.');
    assert.doesNotMatch(JSON.stringify(body), new RegExp(RAW_DIAGNOSTIC));
  });

  test('provider 503 / network error returns 503 SERVICE_UNAVAILABLE', async () => {
    globalThis.fetch = async (url) => {
      if (String(url).includes('/auth/v1/signup')) {
        return new Response('Service Unavailable', { status: 503 });
      }
      return new Response('Not Found', { status: 404 });
    };

    const req = new Request('https://lingora.edu.vn/api/auth/register', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: JSON.stringify({
        email: 'offline@lingora.edu.vn',
        password: 'securePassword123',
      }),
    });

    const res = await registerRoute(req);
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.error?.code, 'SERVICE_UNAVAILABLE');
  });
});

describe('Package A: Confirmation (GET /auth/confirm)', () => {
  test('missing code and token_hash redirects to /login?error=missing_confirmation_token', async () => {
    const req = new Request('https://lingora.edu.vn/auth/confirm', {
      method: 'GET',
    });

    const res = await confirmRoute(req);
    assert.equal(res.status, 303);
    const location = res.headers.get('location');
    assert.ok(location);
    const locUrl = new URL(location);
    assert.equal(locUrl.pathname, '/login');
    assert.equal(locUrl.searchParams.get('error'), 'missing_confirmation_token');
  });

  test('valid PKCE code exchanges code for session and redirects to /login?confirmed=1', async () => {
    // Populate PKCE code verifier in cookie map
    const cookieName = getLearnerCookieName('https://sncfyvpzwedqgwfpffkh.supabase.co');
    const verifier = 'test-code-verifier-string-1234567890';
    const encodedVerifier = 'base64-' + Buffer.from(JSON.stringify(verifier)).toString('base64');
    cookieMap.set(`${cookieName}-code-verifier`, encodedVerifier);

    let codeExchanged = false;
    globalThis.fetch = async (url, opts) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/v1/token') && urlStr.includes('grant_type=pkce')) {
        codeExchanged = true;
        return new Response(
          JSON.stringify({
            access_token: 'valid-access-token',
            refresh_token: 'valid-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
            user: { id: DUMMY_LEARNER_ID, email: 'learner@lingora.edu.vn' },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    };

    const req = new Request('https://lingora.edu.vn/auth/confirm?code=valid-pkce-code', {
      method: 'GET',
    });

    const res = await confirmRoute(req);
    assert.equal(res.status, 303);
    const location = res.headers.get('location');
    const locUrl = new URL(location);
    assert.equal(locUrl.pathname, '/login');
    assert.equal(locUrl.searchParams.get('confirmed'), '1');
    assert.equal(codeExchanged, true);
    assert.ok(cookieStoreRetrievalCount > 0, 'Cookie store must be retrieved for normal code exchange');
    assert.ok(cookieAccessCount > 0, 'Cookies must be read for normal code exchange');
  });

  test('expired / invalid PKCE code redirects to /login?error=confirmation_failed', async () => {
    const cookieName = getLearnerCookieName('https://sncfyvpzwedqgwfpffkh.supabase.co');
    const verifier = 'test-code-verifier-string-1234567890';
    cookieMap.set(`${cookieName}-code-verifier`, 'base64-' + Buffer.from(JSON.stringify(verifier)).toString('base64'));

    globalThis.fetch = async (url, opts) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/v1/token')) {
        return new Response(
          JSON.stringify({ error: 'invalid_grant', error_description: 'PKCE code expired' }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    };

    const req = new Request('https://lingora.edu.vn/auth/confirm?code=expired-code', {
      method: 'GET',
    });

    const res = await confirmRoute(req);
    assert.equal(res.status, 303);
    const locUrl = new URL(res.headers.get('location'));
    assert.equal(locUrl.pathname, '/login');
    assert.equal(locUrl.searchParams.get('error'), 'confirmation_failed');
  });

  test('PKCE code callback with flow_state_expired (HTTP 422) redirects to /login?error=confirmation_failed and logs diagnostic', async () => {
    const cookieName = getLearnerCookieName('https://sncfyvpzwedqgwfpffkh.supabase.co');
    const verifier = 'test-code-verifier-string-1234567890';
    cookieMap.set(`${cookieName}-code-verifier`, 'base64-' + Buffer.from(JSON.stringify(verifier)).toString('base64'));

    let capturedWarning = null;
    const origWarn = console.warn;
    console.warn = (...args) => {
      if (args[0] === 'learner_confirmation_failed') {
        capturedWarning = args[1];
      }
      origWarn(...args);
    };

    try {
      globalThis.fetch = async (url, opts) => {
        const urlStr = String(url);
        if (urlStr.includes('/auth/v1/token')) {
          return new Response(
            JSON.stringify({ code: 422, error_code: 'flow_state_expired', msg: 'flow_state has expired' }),
            { status: 422, headers: { 'content-type': 'application/json' } }
          );
        }
        return new Response('Not Found', { status: 404 });
      };

      const req = new Request('https://lingora.edu.vn/auth/confirm?code=flow-expired-code', {
        method: 'GET',
      });

      const res = await confirmRoute(req);
      assert.equal(res.status, 303);
      const locUrl = new URL(res.headers.get('location'));
      assert.equal(locUrl.pathname, '/login');
      assert.equal(locUrl.searchParams.get('error'), 'confirmation_failed');
      assert.deepEqual(capturedWarning, {
        phase: 'pkce_exchange',
        code: 'flow_state_expired',
        status: 422,
        verifierCookiePresent: true,
      });
    } finally {
      console.warn = origWarn;
    }
  });

  test('missing verifier cookie on PKCE code callback redirects to /login?error=confirmation_failed and logs diagnostic', async () => {
    // Cookie store has no code-verifier cookie
    cookieMap.clear();

    const req = new Request('https://lingora.edu.vn/auth/confirm?code=some-code', {
      method: 'GET',
    });

    const res = await confirmRoute(req);
    assert.equal(res.status, 303);
    const locUrl = new URL(res.headers.get('location'));
    assert.equal(locUrl.pathname, '/login');
    assert.equal(locUrl.searchParams.get('error'), 'confirmation_failed');
  });

  test('already confirmed identity re-navigating callback with spent/already-confirmed code redirects to /login?error=confirmation_failed', async () => {
    const cookieName = getLearnerCookieName('https://sncfyvpzwedqgwfpffkh.supabase.co');
    const verifier = 'test-code-verifier-string-1234567890';
    cookieMap.set(`${cookieName}-code-verifier`, 'base64-' + Buffer.from(JSON.stringify(verifier)).toString('base64'));

    globalThis.fetch = async (url, opts) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/v1/token')) {
        return new Response(
          JSON.stringify({ error: 'invalid_grant', error_description: 'authorization code already redeemed' }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    };

    const req = new Request('https://lingora.edu.vn/auth/confirm?code=already-spent-code', {
      method: 'GET',
    });

    const res = await confirmRoute(req);
    assert.equal(res.status, 303);
    const locUrl = new URL(res.headers.get('location'));
    assert.equal(locUrl.pathname, '/login');
    assert.equal(locUrl.searchParams.get('error'), 'confirmation_failed');
  });

  test('token_hash without type param is rejected with invalid_confirmation_type', async () => {
    const req = new Request('https://lingora.edu.vn/auth/confirm?token_hash=somehash', {
      method: 'GET',
    });

    const res = await confirmRoute(req);
    assert.equal(res.status, 303);
    const locUrl = new URL(res.headers.get('location'));
    assert.equal(locUrl.pathname, '/login');
    assert.equal(locUrl.searchParams.get('error'), 'invalid_confirmation_type');
  });

  test('token_hash with type=signup in GET redirects 303 to /auth/verify with zero provider calls', async () => {
    let providerCalls = 0;
    globalThis.fetch = async () => {
      providerCalls++;
      throw new Error('Provider must not be called on GET');
    };

    const req = new Request('https://lingora.edu.vn/auth/confirm?token_hash=validhash&type=signup', {
      method: 'GET',
    });

    const res = await confirmRoute(req);
    assert.equal(res.status, 303);
    const locUrl = new URL(res.headers.get('location'));
    assert.equal(locUrl.pathname, '/auth/verify');
    assert.equal(locUrl.searchParams.get('token_hash'), 'validhash');
    assert.equal(locUrl.searchParams.get('type'), 'signup');
    assert.equal(providerCalls, 0);
    assert.equal(res.headers.get('cache-control'), 'no-store, private');
    assert.equal(res.headers.get('referrer-policy'), 'no-referrer');
  });

  test('POST form urlencoded with token_hash and type=signup verifies OTP, signs out and redirects to /login?confirmed=1', async () => {
    let otpVerified = false;
    let localSignOut = false;
    globalThis.fetch = async (url, opts) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/v1/verify')) {
        otpVerified = true;
        return new Response(
          JSON.stringify({
            access_token: 'valid-token',
            user: { id: DUMMY_LEARNER_ID, email: 'learner@lingora.edu.vn' },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      if (urlStr.includes('/auth/v1/logout')) {
        localSignOut = true;
        return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response('Not Found', { status: 404 });
    };

    const formData = new URLSearchParams({
      token_hash: 'validhash',
      type: 'signup',
    });

    const req = new Request('https://lingora.edu.vn/auth/confirm', {
      method: 'POST',
      headers: {
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const res = await confirmPostRoute(req);
    assert.equal(res.status, 303);
    const locUrl = new URL(res.headers.get('location'));
    assert.equal(locUrl.pathname, '/login');
    assert.equal(locUrl.searchParams.get('confirmed'), '1');
    assert.equal(otpVerified, true);
  });

  test('POST form urlencoded replayed after use fails with 400 otp_expired and redirects to /login?error=confirmation_failed', async () => {
    let capturedWarning = null;
    const origWarn = console.warn;
    console.warn = (...args) => {
      if (args[0] === 'learner_confirmation_failed') {
        capturedWarning = args[1];
      }
      origWarn(...args);
    };

    try {
      globalThis.fetch = async (url, opts) => {
        const urlStr = String(url);
        if (urlStr.includes('/auth/v1/verify')) {
          return new Response(
            JSON.stringify({ code: 400, error_code: 'otp_expired', msg: 'Token has expired or is invalid' }),
            { status: 400, headers: { 'content-type': 'application/json' } }
          );
        }
        return new Response('Not Found', { status: 404 });
      };

      const formData = new URLSearchParams({
        token_hash: 'already-spent-hash',
        type: 'signup',
      });

      const req = new Request('https://lingora.edu.vn/auth/confirm', {
        method: 'POST',
        headers: {
          'host': 'lingora.edu.vn',
          'origin': 'https://lingora.edu.vn',
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const res = await confirmPostRoute(req);
      assert.equal(res.status, 303);
      const locUrl = new URL(res.headers.get('location'));
      assert.equal(locUrl.pathname, '/login');
      assert.equal(locUrl.searchParams.get('error'), 'confirmation_failed');
      assert.deepEqual(capturedWarning, {
        phase: 'otp_verify',
        code: 'otp_expired',
        status: 400,
        verifierCookiePresent: null,
      });
    } finally {
      console.warn = origWarn;
    }
  });

  test('token_hash with type=recovery or invite is strictly rejected as invalid_confirmation_type', async () => {
    const req = new Request('https://lingora.edu.vn/auth/confirm?token_hash=validhash&type=recovery', {
      method: 'GET',
    });

    const res = await confirmRoute(req);
    assert.equal(res.status, 303);
    const locUrl = new URL(res.headers.get('location'));
    assert.equal(locUrl.pathname, '/login');
    assert.equal(locUrl.searchParams.get('error'), 'invalid_confirmation_type');
  });

  test('open redirect attempts via ?next=... on GET token_hash are strictly ignored (destinations fixed /auth/verify with exactly two params)', async () => {
    let providerCalls = 0;
    globalThis.fetch = async () => {
      providerCalls++;
      throw new Error('Provider must not be called on GET');
    };

    const req = new Request('https://lingora.edu.vn/auth/confirm?token_hash=testtoken&type=email&next=https://malicious.org', {
      method: 'GET',
    });

    const res = await confirmRoute(req);
    assert.equal(res.status, 303);
    const locUrl = new URL(res.headers.get('location'));
    assert.equal(locUrl.origin, 'https://lingora.edu.vn');
    assert.equal(locUrl.pathname, '/auth/verify');
    assert.equal(locUrl.searchParams.get('next'), null);
    assert.equal(locUrl.searchParams.get('token_hash'), 'testtoken');
    assert.equal(locUrl.searchParams.get('type'), 'email');
    assert.equal(providerCalls, 0);
  });

  test('provider error without credentials redirects to /login?error=confirmation_failed with no-store headers and zero provider calls', async () => {
    let providerCalls = 0;
    globalThis.fetch = async () => {
      providerCalls++;
      throw new Error('Provider must not be called');
    };

    const req = new Request('https://lingora.edu.vn/auth/confirm?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired', {
      method: 'GET',
    });

    const res = await confirmRoute(req);
    assert.equal(res.status, 303);
    const locUrl = new URL(res.headers.get('location'));
    assert.equal(locUrl.origin, 'https://lingora.edu.vn');
    assert.equal(locUrl.pathname, '/login');
    assert.equal(locUrl.search, '?error=confirmation_failed');
    const cc = res.headers.get('cache-control') || '';
    assert.ok(cc.includes('no-store') && cc.includes('private'), 'Cache-Control must contain no-store and private');
    assert.equal(providerCalls, 0, 'Zero provider calls must be made on rejection');
    assert.equal(cookieStoreRetrievalCount, 0, 'Mocked cookie-store must not be retrieved on provider error');
    assert.equal(cookieAccessCount, 0, 'No cookies must be read on provider error');
  });

  test('conflicting error plus PKCE code rejects before code consumption with zero provider calls', async () => {
    const cookieName = getLearnerCookieName('https://sncfyvpzwedqgwfpffkh.supabase.co');
    const verifier = 'test-code-verifier-string-1234567890';
    const encodedVerifier = 'base64-' + Buffer.from(JSON.stringify(verifier)).toString('base64');
    cookieMap.set(`${cookieName}-code-verifier`, encodedVerifier);

    let providerCalls = 0;
    globalThis.fetch = async () => {
      providerCalls++;
      throw new Error('Provider must not be called');
    };

    const req = new Request('https://lingora.edu.vn/auth/confirm?error=access_denied&code=conflicting-pkce-code', {
      method: 'GET',
    });

    const res = await confirmRoute(req);
    assert.equal(res.status, 303);
    const locUrl = new URL(res.headers.get('location'));
    assert.equal(locUrl.pathname, '/login');
    assert.equal(locUrl.search, '?error=confirmation_failed');
    assert.equal(providerCalls, 0, 'Zero provider calls must be made when error is present');
    assert.equal(cookieStoreRetrievalCount, 0, 'Mocked cookie-store must not be retrieved when error is present');
    assert.equal(cookieAccessCount, 0, 'No cookies must be read when error is present');
    assert.equal(
      cookieMap.get(`${cookieName}-code-verifier`),
      encodedVerifier,
      'PKCE verifier cookie must be preserved exactly without SDK consumption or cleanup'
    );
  });

  test('conflicting error_code plus token hash rejects before token consumption with zero provider calls', async () => {
    let providerCalls = 0;
    globalThis.fetch = async () => {
      providerCalls++;
      throw new Error('Provider must not be called');
    };

    const req = new Request('https://lingora.edu.vn/auth/confirm?error_code=otp_expired&token_hash=somehash&type=signup', {
      method: 'GET',
    });

    const res = await confirmRoute(req);
    assert.equal(res.status, 303);
    const locUrl = new URL(res.headers.get('location'));
    assert.equal(locUrl.pathname, '/login');
    assert.equal(locUrl.search, '?error=confirmation_failed');
    assert.equal(providerCalls, 0, 'Zero provider calls must be made when error_code is present');
    assert.equal(cookieStoreRetrievalCount, 0, 'Mocked cookie-store must not be retrieved when error_code is present');
    assert.equal(cookieAccessCount, 0, 'No cookies must be read when error_code is present');
  });

  test('unknown error and error_code values redirect to fixed /login?error=confirmation_failed without leaking codes', async () => {
    let providerCalls = 0;
    globalThis.fetch = async () => {
      providerCalls++;
      throw new Error('Provider must not be called');
    };

    for (const qs of [
      '?error=unrecognized_provider_failure',
      '?error_code=custom_err_42',
      '?error=some_error&error_code=some_code',
    ]) {
      const req = new Request(`https://lingora.edu.vn/auth/confirm${qs}`, {
        method: 'GET',
      });

      const res = await confirmRoute(req);
      assert.equal(res.status, 303);
      const locUrl = new URL(res.headers.get('location'));
      assert.equal(locUrl.pathname, '/login');
      assert.equal(locUrl.search, '?error=confirmation_failed');
      assert.equal(locUrl.searchParams.get('error'), 'confirmation_failed');
      assert.equal(locUrl.searchParams.get('error_code'), null);
      assert.equal(cookieStoreRetrievalCount, 0, 'Mocked cookie-store must not be retrieved for unknown error values');
      assert.equal(cookieAccessCount, 0, 'No cookies must be read for unknown error values');
    }
    assert.equal(providerCalls, 0);
  });

  test('empty error and error_code values redirect to fixed /login?error=confirmation_failed', async () => {
    let providerCalls = 0;
    globalThis.fetch = async () => {
      providerCalls++;
      throw new Error('Provider must not be called');
    };

    for (const qs of ['?error=', '?error_code=', '?error=&error_code=', '?error']) {
      const req = new Request(`https://lingora.edu.vn/auth/confirm${qs}`, {
        method: 'GET',
      });

      const res = await confirmRoute(req);
      assert.equal(res.status, 303);
      const locUrl = new URL(res.headers.get('location'));
      assert.equal(locUrl.pathname, '/login');
      assert.equal(locUrl.search, '?error=confirmation_failed');
      assert.equal(cookieStoreRetrievalCount, 0, 'Mocked cookie-store must not be retrieved for empty error values');
      assert.equal(cookieAccessCount, 0, 'No cookies must be read for empty error values');
    }
    assert.equal(providerCalls, 0);
  });

  test('safe fixed destination and no-store headers despite hostile description and open-redirect next', async () => {
    let providerCalls = 0;
    globalThis.fetch = async () => {
      providerCalls++;
      throw new Error('Provider must not be called');
    };

    const hostileUrl = 'https://lingora.edu.vn/auth/confirm?error=access_denied' +
      '&error_description=%3Cscript%3Ealert(%22xss%22)%3C%2Fscript%3E' +
      '&next=https%3A%2F%2Fmalicious.attacker.com%2Fphish' +
      '&error_code=hostile_code';

    const req = new Request(hostileUrl, {
      method: 'GET',
    });

    const res = await confirmRoute(req);
    assert.equal(res.status, 303);
    const location = res.headers.get('location');
    assert.equal(location, 'https://lingora.edu.vn/login?error=confirmation_failed');

    const locUrl = new URL(location);
    assert.equal(locUrl.origin, 'https://lingora.edu.vn');
    assert.equal(locUrl.pathname, '/login');
    assert.equal(locUrl.search, '?error=confirmation_failed');
    assert.equal(locUrl.searchParams.get('error_description'), null);
    assert.equal(locUrl.searchParams.get('next'), null);
    assert.equal(locUrl.searchParams.get('error_code'), null);

    const cc = res.headers.get('cache-control') || '';
    assert.ok(cc.includes('no-store') && cc.includes('private'), 'Cache-Control must contain no-store and private');
    assert.equal(providerCalls, 0);
    assert.equal(cookieStoreRetrievalCount, 0, 'Mocked cookie-store must not be retrieved on hostile error payload');
    assert.equal(cookieAccessCount, 0, 'No cookies must be read on hostile error payload');
  });
});

describe('Package A: Confirmed Password Login & Bootstrap (POST /api/auth/login)', () => {
  test('unconfirmed user is rejected on password login with 403 FORBIDDEN', async () => {
    globalThis.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/v1/token')) {
        return new Response(
          JSON.stringify({
            code: 'email_not_confirmed',
            message: 'Email not confirmed',
          }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    };

    const req = new Request('https://lingora.edu.vn/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: JSON.stringify({ email: 'unconfirmed@lingora.edu.vn', password: 'password123' }),
    });

    const res = await loginRoute(req);
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error?.code, 'FORBIDDEN');
    assert.match(body.error?.message, /chưa xác thực email/i);
  });

  test('fresh confirmed user with missing account triggers bootstrap and succeeds with 200 and LEARNER ACTIVE DTO', async () => {
    let mockAccount = null;
    let mockAuditEvents = [];

    const mockDb = {
      account: {
        findUnique: async ({ where }) => {
          if (where.id === DUMMY_LEARNER_ID) return mockAccount;
          return null;
        },
      },
      provisioningRequest: {
        findFirst: async () => null,
      },
      $transaction: async (cb) => {
        const tx = {
          account: {
            findUnique: async ({ where }) => {
              if (where.id === DUMMY_LEARNER_ID) return mockAccount;
              return null;
            },
          },
          provisioningRequest: {
            findFirst: async () => null,
          },
          $executeRaw: async (strings, ...values) => {
            const sql = strings.join('?');
            if (sql.includes('INSERT INTO app.accounts')) {
              mockAccount = {
                id: DUMMY_LEARNER_ID,
                role: 'LEARNER',
                status: 'ACTIVE',
                displayName: 'Nguyễn Văn Học',
                uiLocale: 'en',
              };
              return 1;
            }
            if (sql.includes('INSERT INTO app_private.audit_events')) {
              mockAuditEvents.push({ action: 'LEARNER_BOOTSTRAPPED' });
              return 1;
            }
            return 0;
          },
        };
        return cb(tx);
      },
    };

    setLearnerPrismaForTest(mockDb);

    globalThis.fetch = async (url, opts) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/v1/token')) {
        return new Response(
          JSON.stringify({
            access_token: 'valid-token',
            refresh_token: 'valid-refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: {
              id: DUMMY_LEARNER_ID,
              email: 'fresh.confirmed@lingora.edu.vn',
              email_confirmed_at: '2026-11-01T12:00:00Z',
              user_metadata: { display_name: 'Nguyễn Văn Học' },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      if (urlStr.includes('/auth/v1/user')) {
        return new Response(
          JSON.stringify({
            id: DUMMY_LEARNER_ID,
            email: 'fresh.confirmed@lingora.edu.vn',
            email_confirmed_at: '2026-11-01T12:00:00Z',
            user_metadata: { display_name: 'Nguyễn Văn Học' },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    };

    const req = new Request('https://lingora.edu.vn/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: JSON.stringify({ email: 'fresh.confirmed@lingora.edu.vn', password: 'password123' }),
    });

    const res = await loginRoute(req);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data?.account?.role, 'LEARNER');
    assert.equal(body.data?.account?.status, 'ACTIVE');
    assert.equal(mockAuditEvents.length, 1);
  });

  test('no duplicate Account bootstrap: second login for already-bootstrapped confirmed learner returns existing account (created: false) and zero additional audit events', async () => {
    let mockAccount = {
      id: DUMMY_LEARNER_ID,
      role: 'LEARNER',
      status: 'ACTIVE',
      displayName: 'Nguyễn Văn Học',
      uiLocale: 'en',
    };
    let mockAuditEvents = [{ action: 'LEARNER_BOOTSTRAPPED' }];
    let executeRawCalls = 0;

    const mockDb = {
      account: {
        findUnique: async ({ where }) => {
          if (where.id === DUMMY_LEARNER_ID) return mockAccount;
          return null;
        },
      },
      provisioningRequest: {
        findFirst: async () => null,
      },
      $executeRaw: async () => {
        executeRawCalls++;
        return 0;
      },
      $transaction: async (cb) => cb(mockDb),
    };

    setLearnerPrismaForTest(mockDb);

    globalThis.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/v1/token') || urlStr.includes('/auth/v1/user')) {
        return new Response(
          JSON.stringify({
            access_token: 'valid-token',
            refresh_token: 'valid-refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: {
              id: DUMMY_LEARNER_ID,
              email: 'fresh.confirmed@lingora.edu.vn',
              email_confirmed_at: '2026-11-01T12:00:00Z',
              user_metadata: { display_name: 'Nguyễn Văn Học' },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    };

    const req = new Request('https://lingora.edu.vn/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: JSON.stringify({ email: 'fresh.confirmed@lingora.edu.vn', password: 'password123' }),
    });

    const res = await loginRoute(req);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data?.account?.id, DUMMY_LEARNER_ID);
    assert.equal(body.data?.account?.role, 'LEARNER');
    assert.equal(body.data?.account?.status, 'ACTIVE');
    assert.equal(mockAuditEvents.length, 1, 'AuditEvent must not be duplicated');
    assert.equal(executeRawCalls, 0, 'No INSERT operations must be performed for existing account');
  });

  test('Recovery Case 2: Provider confirmed identity but PKCE callback failed (flow_state_expired); user recovers via password login with the SAME identity, bootstrapping exactly one LEARNER/ACTIVE Account', async () => {
    const RECOVERY_USER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const RECOVERY_EMAIL = 'recovery.learner@lingora.edu.vn';
    const RECOVERY_PASSWORD = 'RecoverPassword123!';
    let mockAccount = null;
    let mockAuditEvents = [];
    let executeRawCalls = 0;

    const mockDb = {
      account: {
        findUnique: async ({ where }) => {
          if (where.id === RECOVERY_USER_ID) return mockAccount;
          return null;
        },
      },
      provisioningRequest: {
        findFirst: async () => null,
      },
      $executeRaw: async () => {
        executeRawCalls++;
        if (executeRawCalls === 1) {
          mockAccount = {
            id: RECOVERY_USER_ID,
            role: 'LEARNER',
            status: 'ACTIVE',
            displayName: 'Phục Hồi Học Viên',
            uiLocale: 'en',
          };
          return 1;
        }
        if (executeRawCalls === 2) {
          mockAuditEvents.push({ action: 'LEARNER_BOOTSTRAPPED', actor_id: RECOVERY_USER_ID });
          return 1;
        }
        return 0;
      },
      $transaction: async (cb) => cb(mockDb),
    };

    setLearnerPrismaForTest(mockDb);

    // Step 1: Simulate PKCE callback failure (flow_state_expired after 25 minutes)
    const cookieName = getLearnerCookieName('https://sncfyvpzwedqgwfpffkh.supabase.co');
    cookieMap.set(`${cookieName}-code-verifier`, 'base64-' + Buffer.from(JSON.stringify('verifier-123')).toString('base64'));

    globalThis.fetch = async (url, opts) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/v1/token')) {
        const bodyStr = opts?.body ? String(opts.body) : '';
        // If it's a PKCE exchange:
        if (bodyStr.includes('grant_type=pkce') || urlStr.includes('grant_type=pkce') || bodyStr.includes('auth_code')) {
          return new Response(
            JSON.stringify({ code: 422, error_code: 'flow_state_expired', msg: 'flow_state has expired' }),
            { status: 422, headers: { 'content-type': 'application/json' } }
          );
        }
        // If it's password login:
        return new Response(
          JSON.stringify({
            access_token: 'recovery-token',
            refresh_token: 'recovery-refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: {
              id: RECOVERY_USER_ID,
              email: RECOVERY_EMAIL,
              email_confirmed_at: '2026-11-04T14:39:20.000Z', // Provider confirmed!
              user_metadata: { display_name: 'Phục Hồi Học Viên' },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      if (urlStr.includes('/auth/v1/user')) {
        return new Response(
          JSON.stringify({
            id: RECOVERY_USER_ID,
            email: RECOVERY_EMAIL,
            email_confirmed_at: '2026-11-04T14:39:20.000Z',
            user_metadata: { display_name: 'Phục Hồi Học Viên' },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    };

    // Callback fails with flow_state_expired -> redirects to /login?error=confirmation_failed
    const confirmReq = new Request('https://lingora.edu.vn/auth/confirm?code=flow-expired-code', { method: 'GET' });
    const confirmRes = await confirmRoute(confirmReq);
    assert.equal(confirmRes.status, 303);
    const confirmLoc = new URL(confirmRes.headers.get('location'));
    assert.equal(confirmLoc.pathname, '/login');
    assert.equal(confirmLoc.searchParams.get('error'), 'confirmation_failed');
    assert.equal(mockAccount, null, 'Account must NOT exist yet after failed callback');

    // Step 2: User recovers by performing password login with the SAME identity
    const loginReq = new Request('https://lingora.edu.vn/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: JSON.stringify({ email: RECOVERY_EMAIL, password: RECOVERY_PASSWORD }),
    });

    const loginRes = await loginRoute(loginReq);
    assert.equal(loginRes.status, 200);
    const loginBody = await loginRes.json();
    assert.equal(loginBody.data?.account?.id, RECOVERY_USER_ID);
    assert.equal(loginBody.data?.account?.role, 'LEARNER');
    assert.equal(loginBody.data?.account?.status, 'ACTIVE');
    assert.equal(mockAuditEvents.length, 1);
    assert.equal(mockAuditEvents[0].action, 'LEARNER_BOOTSTRAPPED');
  });

  test('Recovery Case 2 (Cross-Device): Provider confirmed identity on mobile without PKCE verifier cookie; user recovers via password login with SAME identity', async () => {
    const CROSS_USER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const CROSS_EMAIL = 'cross.device@lingora.edu.vn';
    const CROSS_PASSWORD = 'CrossPassword123!';
    let mockAccount = null;
    let mockAuditEvents = [];
    let executeRawCalls = 0;

    const mockDb = {
      account: {
        findUnique: async ({ where }) => {
          if (where.id === CROSS_USER_ID) return mockAccount;
          return null;
        },
      },
      provisioningRequest: {
        findFirst: async () => null,
      },
      $executeRaw: async () => {
        executeRawCalls++;
        if (executeRawCalls === 1) {
          mockAccount = {
            id: CROSS_USER_ID,
            role: 'LEARNER',
            status: 'ACTIVE',
            displayName: 'Cross Device Học Viên',
            uiLocale: 'en',
          };
          return 1;
        }
        if (executeRawCalls === 2) {
          mockAuditEvents.push({ action: 'LEARNER_BOOTSTRAPPED', actor_id: CROSS_USER_ID });
          return 1;
        }
        return 0;
      },
      $transaction: async (cb) => cb(mockDb),
    };

    setLearnerPrismaForTest(mockDb);

    // Cookie store has NO code-verifier cookie (opened on phone or different browser)
    cookieMap.clear();

    globalThis.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/v1/token') || urlStr.includes('/auth/v1/user')) {
        return new Response(
          JSON.stringify({
            access_token: 'cross-token',
            refresh_token: 'cross-refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: {
              id: CROSS_USER_ID,
              email: CROSS_EMAIL,
              email_confirmed_at: '2026-11-04T15:00:00.000Z',
              user_metadata: { display_name: 'Cross Device Học Viên' },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    };

    // Callback on device without verifier -> 303 to /login?error=confirmation_failed
    const confirmReq = new Request('https://lingora.edu.vn/auth/confirm?code=cross-device-code', { method: 'GET' });
    const confirmRes = await confirmRoute(confirmReq);
    assert.equal(confirmRes.status, 303);
    const confirmLoc = new URL(confirmRes.headers.get('location'));
    assert.equal(confirmLoc.pathname, '/login');
    assert.equal(confirmLoc.searchParams.get('error'), 'confirmation_failed');
    assert.equal(mockAccount, null);

    // Password login recovers and bootstraps Account
    const loginReq = new Request('https://lingora.edu.vn/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: JSON.stringify({ email: CROSS_EMAIL, password: CROSS_PASSWORD }),
    });

    const loginRes = await loginRoute(loginReq);
    assert.equal(loginRes.status, 200);
    const loginBody = await loginRes.json();
    assert.equal(loginBody.data?.account?.id, CROSS_USER_ID);
    assert.equal(loginBody.data?.account?.role, 'LEARNER');
    assert.equal(loginBody.data?.account?.status, 'ACTIVE');
    assert.equal(mockAuditEvents.length, 1);
  });

  test('staff app_metadata marker rejects bootstrap and signs out local session with 403', async () => {
    let mockAccount = null;
    let localSignOutCalled = false;

    const mockDb = {
      account: {
        findUnique: async () => mockAccount,
      },
      provisioningRequest: {
        findFirst: async () => null,
      },
      $executeRaw: async () => 0,
      $transaction: async (cb) => cb(mockDb),
    };

    setLearnerPrismaForTest(mockDb);

    globalThis.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/v1/token')) {
        return new Response(
          JSON.stringify({
            access_token: 'valid-token',
            refresh_token: 'valid-refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: {
              id: DUMMY_STAFF_ID,
              email: 'staff@lingora.edu.vn',
              email_confirmed_at: '2026-11-01T12:00:00Z',
              app_metadata: { ownedBy: 'lingora-provisioning', role: 'TEACHER' },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      if (urlStr.includes('/auth/v1/user')) {
        return new Response(
          JSON.stringify({
            id: DUMMY_STAFF_ID,
            email: 'staff@lingora.edu.vn',
            email_confirmed_at: '2026-11-01T12:00:00Z',
            app_metadata: { ownedBy: 'lingora-provisioning', role: 'TEACHER' },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      if (urlStr.includes('/auth/v1/logout')) {
        localSignOutCalled = true;
        return new Response('', { status: 204 });
      }
      return new Response('Not Found', { status: 404 });
    };

    const req = new Request('https://lingora.edu.vn/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: JSON.stringify({ email: 'staff@lingora.edu.vn', password: 'password123' }),
    });

    const res = await loginRoute(req);
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error?.code, 'FORBIDDEN');
    assert.match(body.error?.message, /nhân sự/i);
    assert.equal(localSignOutCalled, true);
    assert.equal(mockAccount, null);
  });

  test('matching private ProvisioningRequest rejects bootstrap and signs out local session with 403', async () => {
    let mockAccount = null;
    let localSignOutCalled = false;

    const mockDb = {
      account: {
        findUnique: async () => mockAccount,
      },
      provisioningRequest: {
        findFirst: async () => ({ id: 'prov-1', normalizedEmail: 'reserved@lingora.edu.vn' }),
      },
      $executeRaw: async () => 0,
      $transaction: async (cb) => cb(mockDb),
    };

    setLearnerPrismaForTest(mockDb);

    globalThis.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/v1/token') || urlStr.includes('/auth/v1/user')) {
        return new Response(
          JSON.stringify({
            access_token: 'valid-token',
            refresh_token: 'valid-refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: {
              id: DUMMY_LEARNER_ID,
              email: 'reserved@lingora.edu.vn',
              email_confirmed_at: '2026-11-01T12:00:00Z',
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      if (urlStr.includes('/auth/v1/logout')) {
        localSignOutCalled = true;
        return new Response('', { status: 204 });
      }
      return new Response('Not Found', { status: 404 });
    };

    const req = new Request('https://lingora.edu.vn/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: JSON.stringify({ email: 'reserved@lingora.edu.vn', password: 'password123' }),
    });

    const res = await loginRoute(req);
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error?.code, 'FORBIDDEN');
    assert.match(body.error?.message, /nhân sự/i);
    assert.equal(localSignOutCalled, true);
    assert.equal(mockAccount, null);
  });

  test('existing DISABLED account is unchanged by bootstrap and denied as ACCOUNT_INACTIVE', async () => {
    const existingDisabled = {
      id: DUMMY_LEARNER_ID,
      role: 'LEARNER',
      status: 'DISABLED',
      displayName: 'Học viên bị khóa',
      uiLocale: 'en',
    };

    const mockDb = {
      account: {
        findUnique: async () => existingDisabled,
      },
      provisioningRequest: { findFirst: async () => null },
      $executeRaw: async () => 0,
      $transaction: async (cb) => cb(mockDb),
    };

    setLearnerPrismaForTest(mockDb);

    globalThis.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/v1/token') || urlStr.includes('/auth/v1/user')) {
        return new Response(
          JSON.stringify({
            access_token: 'valid-token',
            refresh_token: 'valid-refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: {
              id: DUMMY_LEARNER_ID,
              email: 'disabled@lingora.edu.vn',
              email_confirmed_at: '2026-11-01T12:00:00Z',
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      if (urlStr.includes('/auth/v1/logout')) {
        return new Response('', { status: 204 });
      }
      return new Response('Not Found', { status: 404 });
    };

    const req = new Request('https://lingora.edu.vn/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: JSON.stringify({ email: 'disabled@lingora.edu.vn', password: 'password123' }),
    });

    const res = await loginRoute(req);
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error?.code, 'ACCOUNT_INACTIVE');
    assert.equal(existingDisabled.status, 'DISABLED');
  });

  test('database failure during bootstrap rolls back, signs out session, and returns 503 SERVICE_UNAVAILABLE', async () => {
    let localSignOutCalled = false;
    const mockDb = {
      account: {
        findUnique: async () => {
          throw new Error('Connection refused');
        },
      },
    };

    setLearnerPrismaForTest(mockDb);

    globalThis.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/v1/token') || urlStr.includes('/auth/v1/user')) {
        return new Response(
          JSON.stringify({
            access_token: 'valid-token',
            refresh_token: 'valid-refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: {
              id: DUMMY_LEARNER_ID,
              email: 'dbfail@lingora.edu.vn',
              email_confirmed_at: '2026-11-01T12:00:00Z',
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      if (urlStr.includes('/auth/v1/logout')) {
        localSignOutCalled = true;
        return new Response('', { status: 204 });
      }
      return new Response('Not Found', { status: 404 });
    };

    const req = new Request('https://lingora.edu.vn/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
      },
      body: JSON.stringify({ email: 'dbfail@lingora.edu.vn', password: 'password123' }),
    });

    const res = await loginRoute(req);
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.error?.code, 'SERVICE_UNAVAILABLE');
    assert.equal(localSignOutCalled, true);
  });

  test('bootstrap fails closed with 503 when Prisma lacks $transaction capability', async () => {
    const nonTransactionalDb = {
      account: { findUnique: async () => null },
      // $transaction is omitted
    };

    const authClient = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: DUMMY_LEARNER_ID,
              email: 'test@lingora.edu.vn',
              email_confirmed_at: '2026-11-01T12:00:00Z',
            },
          },
          error: null,
        }),
      },
    };

    const result = await bootstrapLearnerAccount({ authClient, prisma: nonTransactionalDb });
    assert.equal(result.ok, false);
    assert.equal(result.status, 503);
    assert.equal(result.error?.code, 'SERVICE_UNAVAILABLE');
  });

  test('bootstrap fails closed with 503 when transaction context lacks required methods', async () => {
    const invalidTxDb = {
      account: { findUnique: async () => null },
      $transaction: async (cb) => {
        // tx lacks provisioningRequest and $executeRaw
        const badTx = {
          account: { findUnique: async () => null },
        };
        return cb(badTx);
      },
    };

    const authClient = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: DUMMY_LEARNER_ID,
              email: 'test@lingora.edu.vn',
              email_confirmed_at: '2026-11-01T12:00:00Z',
            },
          },
          error: null,
        }),
      },
    };

    const result = await bootstrapLearnerAccount({ authClient, prisma: invalidTxDb });
    assert.equal(result.ok, false);
    assert.equal(result.status, 503);
    assert.equal(result.error?.code, 'SERVICE_UNAVAILABLE');
  });
});

describe('Package A: Subprocess Negative Tests for PostgreSQL Safety Guards', () => {
  test('auth-bootstrap-postgres.test.mjs fails before client connect if SLICE11_TEST_DATABASE_URL is missing', () => {
    const cleanEnv = { ...process.env };
    delete cleanEnv.SLICE11_TEST_DATABASE_URL;
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

  test('auth-bootstrap-postgres.test.mjs fails before client connect if only DATABASE_URL is set (NEVER fallback)', () => {
    const cleanEnv = { ...process.env };
    delete cleanEnv.SLICE11_TEST_DATABASE_URL;
    cleanEnv.DATABASE_URL = 'postgresql://postgres:pass@127.0.0.1:5432/slice11_test';
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

  test('auth-bootstrap-postgres.test.mjs fails before client connect if SLICE11_TEST_DATABASE_OWNED !== 1', () => {
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
          SLICE11_TEST_DATABASE_URL: 'postgresql://postgres:pass@127.0.0.1:5432/slice11_test',
          SLICE11_TEST_DATABASE_OWNED: '0',
        },
        encoding: 'utf8',
      }
    );

    assert.notEqual(res.status, 0);
    assert.match(res.stderr + res.stdout, /SLICE11_TEST_DATABASE_OWNED=1 is required/);
  });

  test('auth-bootstrap-postgres.test.mjs fails before client connect if host is non-loopback', () => {
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
          SLICE11_TEST_DATABASE_URL: 'postgresql://postgres:secret@external.db.remote.com:5432/slice11_test',
          SLICE11_TEST_DATABASE_OWNED: '1',
        },
        encoding: 'utf8',
      }
    );

    assert.notEqual(res.status, 0);
    assert.match(res.stderr + res.stdout, /must target a loopback host/);
  });
});
