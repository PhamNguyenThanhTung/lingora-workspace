import { cookies } from 'next/headers.js';
import { NextResponse } from 'next/server.js';
import {
  createSupabaseServerClient,
  buildAuthResponseHeaders,
} from '../../../server/auth/index.ts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');

  // Strictly fixed destination: /login only. Never accept next/open redirects.
  const loginUrl = new URL('/login', requestUrl.origin);

  const cookieStore = await cookies();
  const refreshedHeaders = new Headers();

  let supabase;
  try {
    supabase = createSupabaseServerClient(cookieStore, refreshedHeaders);
  } catch {
    loginUrl.searchParams.set('error', 'service_unavailable');
    return NextResponse.redirect(loginUrl.toString(), { status: 303 });
  }

  let errorResult: any = null;

  if (code) {
    // SSR PKCE code exchange
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
