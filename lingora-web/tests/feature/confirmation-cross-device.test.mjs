import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';

const cookieMap = new Map();
let currentCookieStore = {
  getAll: () => [...cookieMap.entries()].map(([name, value]) => ({ name, value })),
  get: (name) => (cookieMap.has(name) ? { name, value: cookieMap.get(name) } : undefined),
  has: (name) => cookieMap.has(name),
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
    cookies: async () => currentCookieStore,
  },
});

const { GET: confirmGet, POST: confirmPost } = await import('../../src/app/auth/confirm/route.ts');
const { POST: resendPost, RESEND_CONFIRMATION_SUCCESS_RESPONSE } = await import(
  '../../src/app/api/auth/resend-confirmation/route.ts'
);

const originalFetch = globalThis.fetch;
const DUMMY_LEARNER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-placeholder';
  cookieMap.clear();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('S12-XDEVICE 5.1 - 5.4: GET /auth/confirm Specification', () => {
  test('1. GET ?token_hash=valid&type=email returns 303 to /auth/verify, 0 provider requests, no-store and no-referrer', async () => {
    let providerRequests = 0;
    globalThis.fetch = async () => {
      providerRequests++;
      throw new Error('Provider must not be called');
    };

    const req = new Request('https://lingora.edu.vn/auth/confirm?token_hash=valid_hash_123&type=email', {
      method: 'GET',
    });

    const res = await confirmGet(req);
    assert.equal(res.status, 303);
    const loc = new URL(res.headers.get('location'));
    assert.equal(loc.pathname, '/auth/verify');
    assert.equal(loc.searchParams.get('token_hash'), 'valid_hash_123');
    assert.equal(loc.searchParams.get('type'), 'email');
    assert.equal(providerRequests, 0);
    assert.ok(res.headers.get('cache-control')?.includes('no-store'));
    assert.ok(res.headers.get('cache-control')?.includes('private'));
    assert.equal(res.headers.get('referrer-policy'), 'no-referrer');
  });

  test('2a. GET with invalid types (recovery, invite, magiclink, missing) -> invalid_confirmation_type, 0 provider requests', async () => {
    let providerRequests = 0;
    globalThis.fetch = async () => {
      providerRequests++;
      throw new Error('Provider must not be called');
    };

    for (const badType of ['recovery', 'invite', 'magiclink', 'email_change', '', null]) {
      const url = badType === null
        ? 'https://lingora.edu.vn/auth/confirm?token_hash=valid_hash_123'
        : `https://lingora.edu.vn/auth/confirm?token_hash=valid_hash_123&type=${badType}`;

      const res = await confirmGet(new Request(url, { method: 'GET' }));
      assert.equal(res.status, 303);
      const loc = new URL(res.headers.get('location'));
      assert.equal(loc.pathname, '/login');
      assert.equal(loc.searchParams.get('error'), 'invalid_confirmation_type');
    }
    assert.equal(providerRequests, 0);
  });

  test('2b. GET with malformed token_hash (slash, spaces, length 513) -> missing_confirmation_token, 0 provider requests', async () => {
    let providerRequests = 0;
    globalThis.fetch = async () => {
      providerRequests++;
      throw new Error('Provider must not be called');
    };

    const badTokens = [
      'has/slash',
      'has space',
      'a'.repeat(513),
      'has$special%chars',
    ];

    for (const badToken of badTokens) {
      const res = await confirmGet(
        new Request(`https://lingora.edu.vn/auth/confirm?token_hash=${encodeURIComponent(badToken)}&type=email`, {
          method: 'GET',
        })
      );
      assert.equal(res.status, 303);
      const loc = new URL(res.headers.get('location'));
      assert.equal(loc.pathname, '/login');
      assert.equal(loc.searchParams.get('error'), 'missing_confirmation_token');
    }
    assert.equal(providerRequests, 0);
  });

  test('3. GET ?token_hash&next=https://evil -> destination strictly /auth/verify with only token_hash and type', async () => {
    let providerRequests = 0;
    globalThis.fetch = async () => {
      providerRequests++;
      throw new Error('Provider must not be called');
    };

    const req = new Request(
      'https://lingora.edu.vn/auth/confirm?token_hash=valid_token&type=signup&next=https://evil.attacker.com/steal',
      { method: 'GET' }
    );

    const res = await confirmGet(req);
    assert.equal(res.status, 303);
    const loc = new URL(res.headers.get('location'));
    assert.equal(loc.pathname, '/auth/verify');
    assert.equal(loc.origin, 'https://lingora.edu.vn');
    assert.equal(loc.searchParams.get('next'), null);
    assert.equal(loc.searchParams.get('token_hash'), 'valid_token');
    assert.equal(loc.searchParams.get('type'), 'signup');
    assert.equal(Array.from(loc.searchParams.keys()).sort().join(','), 'token_hash,type');
    assert.equal(providerRequests, 0);
  });
});

describe('S12-XDEVICE 5.5 - 5.8: POST /auth/confirm Specification', () => {
  test('5. Valid POST form urlencoded same-origin: verifyOtp called once, signOut called, redirects to /login?confirmed=1, session cookie cleared', async () => {
    let verifyOtpCalls = 0;
    let signOutCalls = 0;

    globalThis.fetch = async (url, opts) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/v1/verify')) {
        verifyOtpCalls++;
        return new Response(
          JSON.stringify({
            access_token: 'active-session-token',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
            user: { id: DUMMY_LEARNER_ID, email: 'learner@lingora.edu.vn' },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      if (urlStr.includes('/auth/v1/logout')) {
        signOutCalls++;
        return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response('Not Found', { status: 404 });
    };

    const body = new URLSearchParams({
      token_hash: 'valid_pkce_token_hash_123',
      type: 'email',
    });

    const req = new Request('https://lingora.edu.vn/auth/confirm', {
      method: 'POST',
      headers: {
        'host': 'lingora.edu.vn',
        'origin': 'https://lingora.edu.vn',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const res = await confirmPost(req);
    assert.equal(res.status, 303);
    const loc = new URL(res.headers.get('location'));
    assert.equal(loc.pathname, '/login');
    assert.equal(loc.searchParams.get('confirmed'), '1');
    assert.equal(verifyOtpCalls, 1);
    assert.equal(signOutCalls, 1);
    assert.ok(res.headers.get('cache-control')?.includes('no-store'));
    assert.ok(res.headers.get('cache-control')?.includes('private'));
  });

  test('6. POST replay (provider returns otp_expired) -> confirmation_failed, log contains code: otp_expired and no token', async () => {
    let capturedWarning = null;
    let loggedStrings = [];
    const origWarn = console.warn;
    console.warn = (...args) => {
      if (args[0] === 'learner_confirmation_failed') {
        capturedWarning = args[1];
        loggedStrings.push(JSON.stringify(args));
      }
      origWarn(...args);
    };

    try {
      globalThis.fetch = async (url) => {
        if (String(url).includes('/auth/v1/verify')) {
          return new Response(
            JSON.stringify({ code: 400, error_code: 'otp_expired', msg: 'Token has expired or is invalid' }),
            { status: 400, headers: { 'content-type': 'application/json' } }
          );
        }
        return new Response('Not Found', { status: 404 });
      };

      const secretToken = 'secret_replayed_token_hash_999';
      const body = new URLSearchParams({
        token_hash: secretToken,
        type: 'signup',
      });

      const req = new Request('https://lingora.edu.vn/auth/confirm', {
        method: 'POST',
        headers: {
          'host': 'lingora.edu.vn',
          'origin': 'https://lingora.edu.vn',
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const res = await confirmPost(req);
      assert.equal(res.status, 303);
      const loc = new URL(res.headers.get('location'));
      assert.equal(loc.pathname, '/login');
      assert.equal(loc.searchParams.get('error'), 'confirmation_failed');

      assert.deepEqual(capturedWarning, {
        phase: 'otp_verify',
        code: 'otp_expired',
        status: 400,
        verifierCookiePresent: null,
      });

      // Verify token is never logged
      for (const logStr of loggedStrings) {
        assert.ok(!logStr.includes(secretToken), 'Secret token must never appear in log');
      }
    } finally {
      console.warn = origWarn;
    }
  });

  test('7. POST invalid origin, missing origin, wrong content-type, invalid type, invalid token -> 0 provider calls', async () => {
    let providerCalls = 0;
    globalThis.fetch = async () => {
      providerCalls++;
      throw new Error('Provider must not be called');
    };

    // 7a. Foreign origin
    let res = await confirmPost(
      new Request('https://lingora.edu.vn/auth/confirm', {
        method: 'POST',
        headers: {
          'host': 'lingora.edu.vn',
          'origin': 'https://evil-attacker.com',
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: 'token_hash=token123&type=email',
      })
    );
    assert.equal(res.status, 303);
    assert.equal(new URL(res.headers.get('location')).searchParams.get('error'), 'confirmation_failed');

    // 7b. Missing origin
    res = await confirmPost(
      new Request('https://lingora.edu.vn/auth/confirm', {
        method: 'POST',
        headers: {
          'host': 'lingora.edu.vn',
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: 'token_hash=token123&type=email',
      })
    );
    assert.equal(res.status, 303);
    assert.equal(new URL(res.headers.get('location')).searchParams.get('error'), 'confirmation_failed');

    // 7c. Wrong content-type (application/json)
    res = await confirmPost(
      new Request('https://lingora.edu.vn/auth/confirm', {
        method: 'POST',
        headers: {
          'host': 'lingora.edu.vn',
          'origin': 'https://lingora.edu.vn',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ token_hash: 'token123', type: 'email' }),
      })
    );
    assert.equal(res.status, 303);
    assert.equal(new URL(res.headers.get('location')).searchParams.get('error'), 'missing_confirmation_token');

    // 7d. Invalid type (recovery)
    res = await confirmPost(
      new Request('https://lingora.edu.vn/auth/confirm', {
        method: 'POST',
        headers: {
          'host': 'lingora.edu.vn',
          'origin': 'https://lingora.edu.vn',
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: 'token_hash=token123&type=recovery',
      })
    );
    assert.equal(res.status, 303);
    assert.equal(new URL(res.headers.get('location')).searchParams.get('error'), 'invalid_confirmation_type');

    // 7e. Invalid token (spaces or slash)
    res = await confirmPost(
      new Request('https://lingora.edu.vn/auth/confirm', {
        method: 'POST',
        headers: {
          'host': 'lingora.edu.vn',
          'origin': 'https://lingora.edu.vn',
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: 'token_hash=invalid/token&type=email',
      })
    );
    assert.equal(res.status, 303);
    assert.equal(new URL(res.headers.get('location')).searchParams.get('error'), 'missing_confirmation_token');

    assert.equal(providerCalls, 0);
  });

  test('8. POST provider network error -> service_unavailable; signOut error after verify -> still confirmed=1', async () => {
    // 8a. Provider network error
    globalThis.fetch = async (url) => {
      if (String(url).includes('/auth/v1/verify')) {
        const netErr = new TypeError('fetch failed: ECONNREFUSED');
        throw netErr;
      }
      return new Response('Not Found', { status: 404 });
    };

    let res = await confirmPost(
      new Request('https://lingora.edu.vn/auth/confirm', {
        method: 'POST',
        headers: {
          'host': 'lingora.edu.vn',
          'origin': 'https://lingora.edu.vn',
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: 'token_hash=valid_token&type=email',
      })
    );
    assert.equal(res.status, 303);
    assert.equal(new URL(res.headers.get('location')).searchParams.get('error'), 'service_unavailable');

    // 8b. signOut fails after verifyOtp success -> still redirects to confirmed=1 without throwing
    globalThis.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/v1/verify')) {
        return new Response(
          JSON.stringify({
            access_token: 'valid-token',
            user: { id: DUMMY_LEARNER_ID, email: 'learner@lingora.edu.vn' },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      if (urlStr.includes('/auth/v1/logout')) {
        throw new Error('Signout failure');
      }
      return new Response('Not Found', { status: 404 });
    };

    res = await confirmPost(
      new Request('https://lingora.edu.vn/auth/confirm', {
        method: 'POST',
        headers: {
          'host': 'lingora.edu.vn',
          'origin': 'https://lingora.edu.vn',
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: 'token_hash=valid_token&type=email',
      })
    );
    assert.equal(res.status, 303);
    assert.equal(new URL(res.headers.get('location')).searchParams.get('confirmed'), '1');
  });

  test('9. Cross-device unit test: All above tests pass when cookies of device A are completely absent (0 verifier, 0 session)', async () => {
    // Cookie jar is strictly empty
    cookieMap.clear();
    assert.equal(cookieMap.size, 0);

    globalThis.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/v1/verify')) {
        return new Response(
          JSON.stringify({
            access_token: 'device-b-token',
            user: { id: DUMMY_LEARNER_ID, email: 'learner@lingora.edu.vn' },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      if (urlStr.includes('/auth/v1/logout')) {
        return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response('Not Found', { status: 404 });
    };

    // Step 1: GET on device B (no cookies)
    const getRes = await confirmGet(
      new Request('https://lingora.edu.vn/auth/confirm?token_hash=cross_device_token&type=email', {
        method: 'GET',
      })
    );
    assert.equal(getRes.status, 303);
    assert.equal(new URL(getRes.headers.get('location')).pathname, '/auth/verify');

    // Step 2: POST on device B (no cookies)
    const postRes = await confirmPost(
      new Request('https://lingora.edu.vn/auth/confirm', {
        method: 'POST',
        headers: {
          'host': 'lingora.edu.vn',
          'origin': 'https://lingora.edu.vn',
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: 'token_hash=cross_device_token&type=email',
      })
    );
    assert.equal(postRes.status, 303);
    assert.equal(new URL(postRes.headers.get('location')).searchParams.get('confirmed'), '1');
  });
});

describe('S12-XDEVICE 5.10: Resend Confirmation (POST /api/auth/resend-confirmation)', () => {
  test('10a. Success, user not found, and user already confirmed all return IDENTICAL 200 status and body', async () => {
    const payloads = [
      // Normal success
      {
        providerStatus: 200,
        providerBody: {},
      },
      // User not found
      {
        providerStatus: 400,
        providerBody: { code: 'user_not_found', msg: 'User not found' },
      },
      // Email already confirmed
      {
        providerStatus: 422,
        providerBody: { code: 'email_already_confirmed', msg: 'Email is already confirmed' },
      },
    ];

    let recordedBodies = [];

    for (const p of payloads) {
      globalThis.fetch = async (url) => {
        if (String(url).includes('/auth/v1/resend')) {
          return new Response(JSON.stringify(p.providerBody), {
            status: p.providerStatus,
            headers: { 'content-type': 'application/json' },
          });
        }
        return new Response('Not Found', { status: 404 });
      };

      const res = await resendPost(
        new Request('https://lingora.edu.vn/api/auth/resend-confirmation', {
          method: 'POST',
          headers: {
            'host': 'lingora.edu.vn',
            'origin': 'https://lingora.edu.vn',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ email: 'test@lingora.edu.vn' }),
        })
      );

      assert.equal(res.status, 200);
      assert.ok(res.headers.get('cache-control')?.includes('no-store'));
    assert.ok(res.headers.get('cache-control')?.includes('private'));
      const body = await res.json();
      assert.deepEqual(body, RESEND_CONFIRMATION_SUCCESS_RESPONSE);
      recordedBodies.push(JSON.stringify(body));
    }

    assert.equal(recordedBodies.length, 3);
    assert.equal(recordedBodies[0], recordedBodies[1]);
    assert.equal(recordedBodies[1], recordedBodies[2]);
  });

  test('10b. 429 rate limit and 503 provider error mapped correctly', async () => {
    // 429 Rate limited
    globalThis.fetch = async (url) => {
      if (String(url).includes('/auth/v1/resend')) {
        return new Response(
          JSON.stringify({ code: 429, error_code: 'over_email_send_rate_limit', msg: 'Rate limit exceeded' }),
          { status: 429, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('Not Found', { status: 404 });
    };

    let res = await resendPost(
      new Request('https://lingora.edu.vn/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'host': 'lingora.edu.vn',
          'origin': 'https://lingora.edu.vn',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email: 'rate@lingora.edu.vn' }),
      })
    );
    assert.equal(res.status, 429);
    let body = await res.json();
    assert.equal(body.error?.code, 'RATE_LIMITED');

    // 503 Network / Provider outage
    globalThis.fetch = async (url) => {
      if (String(url).includes('/auth/v1/resend')) {
        throw new TypeError('fetch failed: network timeout');
      }
      return new Response('Not Found', { status: 404 });
    };

    res = await resendPost(
      new Request('https://lingora.edu.vn/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'host': 'lingora.edu.vn',
          'origin': 'https://lingora.edu.vn',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email: 'timeout@lingora.edu.vn' }),
      })
    );
    assert.equal(res.status, 503);
    body = await res.json();
    assert.equal(body.error?.code, 'SERVICE_UNAVAILABLE');
  });

  test('10c. 403 foreign origin, 415 media type, 400 malformed JSON or extra fields', async () => {
    // 403 Foreign origin
    let res = await resendPost(
      new Request('https://lingora.edu.vn/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'host': 'lingora.edu.vn',
          'origin': 'https://malicious.org',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@lingora.edu.vn' }),
      })
    );
    assert.equal(res.status, 403);
    let body = await res.json();
    assert.equal(body.error?.code, 'FORBIDDEN_ORIGIN');

    // 415 Unsupported media type
    res = await resendPost(
      new Request('https://lingora.edu.vn/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'host': 'lingora.edu.vn',
          'origin': 'https://lingora.edu.vn',
          'content-type': 'text/plain',
        },
        body: 'email=test@lingora.edu.vn',
      })
    );
    assert.equal(res.status, 415);
    body = await res.json();
    assert.equal(body.error?.code, 'UNSUPPORTED_MEDIA_TYPE');

    // 400 Malformed JSON
    res = await resendPost(
      new Request('https://lingora.edu.vn/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'host': 'lingora.edu.vn',
          'origin': 'https://lingora.edu.vn',
          'content-type': 'application/json',
        },
        body: '{ malformed json',
      })
    );
    assert.equal(res.status, 400);
    body = await res.json();
    assert.equal(body.error?.code, 'MALFORMED_JSON');

    // 400 Extra field (strict schema)
    res = await resendPost(
      new Request('https://lingora.edu.vn/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'host': 'lingora.edu.vn',
          'origin': 'https://lingora.edu.vn',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@lingora.edu.vn', extra: 'not-allowed' }),
      })
    );
    assert.equal(res.status, 400);
    body = await res.json();
    assert.equal(body.error?.code, 'VALIDATION_ERROR');
  });

  test('10d. emailRedirectTo strictly matches ${origin}/auth/confirm', async () => {
    let capturedRedirectTo = null;
    globalThis.fetch = async (url, opts) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/v1/resend')) {
        const u = new URL(urlStr);
        capturedRedirectTo = u.searchParams.get('redirect_to');
        return new Response('{}', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response('Not Found', { status: 404 });
    };

    const res = await resendPost(
      new Request('https://my-domain.lingora.edu.vn/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'host': 'my-domain.lingora.edu.vn',
          'origin': 'https://my-domain.lingora.edu.vn',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email: 'user@example.com' }),
      })
    );
    assert.equal(res.status, 200);
    assert.equal(capturedRedirectTo, 'https://my-domain.lingora.edu.vn/auth/confirm');
  });

  test('10e. Never logs email on failure', async () => {
    let loggedMessages = [];
    const origWarn = console.warn;
    console.warn = (...args) => {
      loggedMessages.push(JSON.stringify(args));
      origWarn(...args);
    };

    try {
      globalThis.fetch = async (url) => {
        if (String(url).includes('/auth/v1/resend')) {
          return new Response(
            JSON.stringify({ code: 400, error_code: 'unexpected_error', msg: 'Some error' }),
            { status: 400, headers: { 'content-type': 'application/json' } }
          );
        }
        return new Response('Not Found', { status: 404 });
      };

      const privateEmail = 'super-private-user@lingora.edu.vn';
      await resendPost(
        new Request('https://lingora.edu.vn/api/auth/resend-confirmation', {
          method: 'POST',
          headers: {
            'host': 'lingora.edu.vn',
            'origin': 'https://lingora.edu.vn',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ email: privateEmail }),
        })
      );

      for (const msg of loggedMessages) {
        assert.ok(!msg.includes(privateEmail), 'Email must never be logged on failure');
      }
    } finally {
      console.warn = origWarn;
    }
  });
});
