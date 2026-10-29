import { NextResponse, type NextRequest } from 'next/server.js';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseEnv } from './server/auth/env.ts';

/**
 * Copies refreshed cookies and SDK headers (Cache-Control, Expires, Pragma)
 * from the proxy response to an alternate response (e.g. redirects or errors).
 */
export function applyProxyAuthToResponse(
  source: NextResponse,
  target: NextResponse
): NextResponse {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
  for (const headerName of ['cache-control', 'expires', 'pragma']) {
    const val = source.headers.get(headerName);
    if (val) {
      target.headers.set(headerName, val);
    }
  }
  return target;
}

/**
 * Next 16 Proxy / Session Refresh
 * Updates auth session cookies before rendering and forwards them to downstream and response.
 * Preserves SDK cache/Expires/Pragma and cookie flags through refresh, downstream request and alternate responses.
 * Note: Proxy refresh is not authorization; protected routes verify identity explicitly.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const env = getSupabaseEnv();
  if (!env) {
    if (!response.headers.has('Cache-Control')) {
      response.headers.set('Cache-Control', 'no-store, private');
    }
    return response;
  }

  const accumulatedCookies = new Map<string, { value: string; options?: any }>();
  const accumulatedSdkHeaders: Record<string, string> = {};

  try {
    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // 1. Forward refreshed cookies to downstream Server Components request
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            accumulatedCookies.set(name, { value, options });
          });

          // 2. Snapshot previous headers before recreating NextResponse
          const previousHeaders = new Headers(response.headers);

          // 3. Refresh response object with updated request headers
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          // 4. Restore custom/SDK headers without overwriting Next internal request override headers
          // (CRITICAL: preserve x-middleware-request-cookie and x-middleware-override-headers from NextResponse.next)
          previousHeaders.forEach((val, key) => {
            const lowerKey = key.toLowerCase();
            if (!lowerKey.startsWith('x-middleware-') && lowerKey !== 'set-cookie') {
              response.headers.set(key, val);
            }
          });

          // 5. Forward all accumulated cookies with flags (httpOnly, secure, sameSite, path, etc.) to response
          accumulatedCookies.forEach(({ value, options }, name) => {
            response.cookies.set(name, value, options);
          });

          // 6. Preserve SDK headers (Cache-Control, Expires, Pragma)
          if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
              accumulatedSdkHeaders[key] = value;
              response.headers.set(key, value);
            });
          }
        },
      },
    });

    // Triggers session refresh if token is nearing expiration
    await supabase.auth.getUser();
  } catch {
    // If Supabase is unreachable, pass request through so route handlers can return clean 503
  }

  // Preserve SDK cache/Expires/Pragma headers; default to private, no-store if not set
  if (!response.headers.has('Cache-Control')) {
    response.headers.set('Cache-Control', 'no-store, private');
  }

  return response;
}

export default proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
