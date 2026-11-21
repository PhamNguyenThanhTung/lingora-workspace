import { cookies } from 'next/headers.js';
import { NextResponse } from 'next/server.js';
import {
  createSupabaseServerClient,
  buildAuthResponseHeaders,
  getLearnerCookieName,
  validateSameOrigin,
  isProviderAvailabilityError,
} from '../../../server/auth/index.ts';

export const dynamic = 'force-dynamic';

const SAFE_CONFIRMATION_ERROR_CODES = new Set([
  'pkce_code_verifier_not_found',
  'bad_code_verifier',
  'flow_state_not_found',
  'flow_state_expired',
  'invalid_credentials',
  'over_request_rate_limit',
  'unexpected_failure',
  'otp_expired',
]);

const TOKEN_HASH_REGEX = /^[A-Za-z0-9_-]{1,512}$/;

function isValidTokenHash(token: unknown): token is string {
  return typeof token === 'string' && TOKEN_HASH_REGEX.test(token);
}

function isValidConfirmationType(type: unknown): type is 'email' | 'signup' {
  return type === 'email' || type === 'signup';
}

function logConfirmationFailure(
  phase: 'client_init' | 'pkce_exchange' | 'otp_verify',
  error: unknown,
  verifierCookiePresent: boolean | null
) {
  const detail = error && typeof error === 'object'
    ? error as { code?: unknown; error_code?: unknown; status?: unknown } : {};
  const rawCode = typeof detail.code === 'string'
    ? detail.code
    : typeof detail.error_code === 'string'
    ? detail.error_code
    : '';
  console.warn('learner_confirmation_failed', {
    phase,
    code: SAFE_CONFIRMATION_ERROR_CODES.has(rawCode) ? rawCode : 'unknown',
    status: typeof detail.status === 'number' && Number.isInteger(detail.status) &&
      detail.status >= 400 && detail.status <= 599 ? detail.status : null,
    verifierCookiePresent,
  });
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  // Strictly fixed destination: /login only. Never accept next/open redirects.
  const loginUrl = new URL('/login', requestUrl.origin);

  // Explicit provider error or error_code check before cookie/client construction
  // or any code/token consumption. Fixed same-origin destination with no-store/private headers.
  if (requestUrl.searchParams.has('error') || requestUrl.searchParams.has('error_code')) {
    loginUrl.searchParams.set('error', 'confirmation_failed');
    return NextResponse.redirect(loginUrl.toString(), {
      status: 303,
      headers: buildAuthResponseHeaders(),
    });
  }

  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');

  // Branch 1: PKCE code (preserves existing behavior per D3)
  if (code) {
    const cookieStore = await cookies();
    const refreshedHeaders = new Headers();

    let supabase;
    try {
      supabase = createSupabaseServerClient(cookieStore, refreshedHeaders);
    } catch (error) {
      logConfirmationFailure('client_init', error, null);
      loginUrl.searchParams.set('error', 'service_unavailable');
      return NextResponse.redirect(loginUrl.toString(), {
        status: 303,
        headers: buildAuthResponseHeaders(),
      });
    }

    let errorResult: unknown = null;
    let verifierCookiePresent: boolean | null = null;

    try {
      const name = `${getLearnerCookieName()}-code-verifier`;
      verifierCookiePresent = cookieStore.getAll().some(cookie =>
        cookie.value.length > 0 && (cookie.name === name ||
          (cookie.name.startsWith(`${name}.`) && /^\d+$/.test(cookie.name.slice(name.length + 1)))));
    } catch {
      // SDK exchange remains authoritative if cookie inspection is unavailable.
    }

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        errorResult = error;
      }
    } catch (err) {
      errorResult = err;
    }

    if (errorResult) {
      logConfirmationFailure('pkce_exchange', errorResult, verifierCookiePresent);
      loginUrl.searchParams.set('error', 'confirmation_failed');
    } else {
      loginUrl.searchParams.set('confirmed', '1');
    }

    const responseHeaders = buildAuthResponseHeaders(undefined);
    refreshedHeaders.forEach((val, key) => {
      responseHeaders.set(key, val);
    });

    return NextResponse.redirect(loginUrl.toString(), {
      status: 303,
      headers: responseHeaders,
    });
  }

  // Branch 2: token_hash (D2: GET does NOT consume token; redirects 303 to /auth/verify)
  if (tokenHash !== null) {
    if (!isValidConfirmationType(type)) {
      loginUrl.searchParams.set('error', 'invalid_confirmation_type');
      return NextResponse.redirect(loginUrl.toString(), {
        status: 303,
        headers: buildAuthResponseHeaders(),
      });
    }

    if (!isValidTokenHash(tokenHash)) {
      loginUrl.searchParams.set('error', 'missing_confirmation_token');
      return NextResponse.redirect(loginUrl.toString(), {
        status: 303,
        headers: buildAuthResponseHeaders(),
      });
    }

    const verifyUrl = new URL('/auth/verify', requestUrl.origin);
    verifyUrl.searchParams.set('token_hash', tokenHash);
    verifyUrl.searchParams.set('type', type);

    return NextResponse.redirect(verifyUrl.toString(), {
      status: 303,
      headers: buildAuthResponseHeaders({
        'Referrer-Policy': 'no-referrer',
      }),
    });
  }

  // Branch 3: Missing token
  loginUrl.searchParams.set('error', 'missing_confirmation_token');
  return NextResponse.redirect(loginUrl.toString(), {
    status: 303,
    headers: buildAuthResponseHeaders(),
  });
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const loginUrl = new URL('/login', requestUrl.origin);

  // 1. Same-origin validation
  if (!validateSameOrigin(request)) {
    loginUrl.searchParams.set('error', 'confirmation_failed');
    return NextResponse.redirect(loginUrl.toString(), {
      status: 303,
      headers: buildAuthResponseHeaders(),
    });
  }

  // 2. Content-Type check: application/x-www-form-urlencoded only
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/x-www-form-urlencoded')) {
    loginUrl.searchParams.set('error', 'missing_confirmation_token');
    return NextResponse.redirect(loginUrl.toString(), {
      status: 303,
      headers: buildAuthResponseHeaders(),
    });
  }

  // 3. Parse form data
  let tokenHash: string | null = null;
  let type: string | null = null;
  try {
    const formData = await request.formData();
    tokenHash = formData.get('token_hash')?.toString() || null;
    type = formData.get('type')?.toString() || null;
  } catch {
    loginUrl.searchParams.set('error', 'missing_confirmation_token');
    return NextResponse.redirect(loginUrl.toString(), {
      status: 303,
      headers: buildAuthResponseHeaders(),
    });
  }

  // 4. Validate type and token_hash
  if (!isValidConfirmationType(type)) {
    loginUrl.searchParams.set('error', 'invalid_confirmation_type');
    return NextResponse.redirect(loginUrl.toString(), {
      status: 303,
      headers: buildAuthResponseHeaders(),
    });
  }

  if (!isValidTokenHash(tokenHash)) {
    loginUrl.searchParams.set('error', 'missing_confirmation_token');
    return NextResponse.redirect(loginUrl.toString(), {
      status: 303,
      headers: buildAuthResponseHeaders(),
    });
  }

  // 5. Create Supabase client
  const cookieStore = await cookies();
  const refreshedHeaders = new Headers();

  let supabase;
  try {
    supabase = createSupabaseServerClient(cookieStore, refreshedHeaders);
  } catch (error) {
    logConfirmationFailure('client_init', error, null);
    loginUrl.searchParams.set('error', 'service_unavailable');
    return NextResponse.redirect(loginUrl.toString(), {
      status: 303,
      headers: buildAuthResponseHeaders(),
    });
  }

  // 6. Verify OTP
  let verifyError: unknown = null;
  try {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) {
      verifyError = error;
    }
  } catch (err) {
    verifyError = err;
  }

  if (verifyError) {
    logConfirmationFailure('otp_verify', verifyError, null);
    if (isProviderAvailabilityError(verifyError)) {
      loginUrl.searchParams.set('error', 'service_unavailable');
    } else {
      loginUrl.searchParams.set('error', 'confirmation_failed');
    }
  } else {
    // 7. Verify success: D4 signOut({ scope: 'local' }) and redirect /login?confirmed=1
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // D4: If signOut fails, still redirect to confirmed=1 without throwing
    }
    loginUrl.searchParams.set('confirmed', '1');
  }

  const responseHeaders = buildAuthResponseHeaders(undefined);
  refreshedHeaders.forEach((val, key) => {
    responseHeaders.set(key, val);
  });

  return NextResponse.redirect(loginUrl.toString(), {
    status: 303,
    headers: responseHeaders,
  });
}
