import { cookies } from 'next/headers.js';
import { NextResponse } from 'next/server.js';
import {
  createSupabaseServerClient,
  buildAuthResponseHeaders,
  getLearnerCookieName,
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
]);

function logConfirmationFailure(
  phase: 'client_init' | 'pkce_exchange' | 'otp_verify',
  error: unknown,
  verifierCookiePresent: boolean | null
) {
  const detail = error && typeof error === 'object'
    ? error as { code?: unknown; status?: unknown } : {};
  console.warn('learner_confirmation_failed', {
    phase,
    code: typeof detail.code === 'string' && SAFE_CONFIRMATION_ERROR_CODES.has(detail.code)
      ? detail.code : 'unknown',
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

  const cookieStore = await cookies();
  const refreshedHeaders = new Headers();

  let supabase;
  try {
    supabase = createSupabaseServerClient(cookieStore, refreshedHeaders);
  } catch (error) {
    logConfirmationFailure('client_init', error, null);
    loginUrl.searchParams.set('error', 'service_unavailable');
    return NextResponse.redirect(loginUrl.toString(), {
      status: 303, headers: buildAuthResponseHeaders(),
    });
  }

  let errorResult: unknown = null;
  let verifierCookiePresent: boolean | null = null;

  if (code) {
    // Presence only: never log cookie values, auth code, URL or SDK error messages.
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
  } else if (tokenHash) {
    // Only fixed signup / email confirmation types allowed (never invite or recovery)
    if (type !== 'signup' && type !== 'email') {
      loginUrl.searchParams.set('error', 'invalid_confirmation_type');
      const responseHeaders = buildAuthResponseHeaders(undefined);
      refreshedHeaders.forEach((val, key) => {
        responseHeaders.set(key, val);
      });
      return NextResponse.redirect(loginUrl.toString(), {
        status: 303,
        headers: responseHeaders,
      });
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as 'signup' | 'email',
      });
      if (error) {
        errorResult = error;
      }
    } catch (err) {
      errorResult = err;
    }
  } else {
    loginUrl.searchParams.set('error', 'missing_confirmation_token');
    const responseHeaders = buildAuthResponseHeaders(undefined);
    refreshedHeaders.forEach((val, key) => {
      responseHeaders.set(key, val);
    });
    return NextResponse.redirect(loginUrl.toString(), {
      status: 303,
      headers: responseHeaders,
    });
  }

  if (errorResult) {
    logConfirmationFailure(code ? 'pkce_exchange' : 'otp_verify', errorResult, verifierCookiePresent);
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
