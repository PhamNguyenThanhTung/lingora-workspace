import { cookies } from 'next/headers.js';
import {
  createSupabaseServerClient,
  validateSameOrigin,
  buildAuthResponseHeaders,
} from '../../../../server/auth/index.ts';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const defaultHeaders = { 'Cache-Control': 'no-store, private' };

  if (!validateSameOrigin(request)) {
    return Response.json(
      {
        error: {
          code: 'FORBIDDEN_ORIGIN',
          message: 'Yêu cầu bị từ chối do nguồn gốc (Origin) không hợp lệ.',
        },
      },
      { status: 403, headers: defaultHeaders }
    );
  }

  const cookieStore = await cookies();
  const refreshedHeaders = new Headers();

  try {
    const supabase = createSupabaseServerClient(cookieStore, refreshedHeaders);
    await supabase.auth.signOut();
  } catch {
    // Provider outage fallback
  } finally {
    // Explicitly clear local auth cookies per R1 even on provider failure
    try {
      const allCookies = await cookieStore.getAll();
      for (const cookie of allCookies) {
        if (
          cookie.name.startsWith('sb-') ||
          cookie.name.includes('auth') ||
          cookie.name.includes('token')
        ) {
          if (typeof cookieStore.delete === 'function') {
            cookieStore.delete(cookie.name);
          } else if (typeof cookieStore.set === 'function') {
            cookieStore.set(cookie.name, '', { maxAge: 0, path: '/' });
          }
        }
      }
    } catch {
      // Safe fallback
    }
  }

  const responseHeaders = buildAuthResponseHeaders(defaultHeaders);
  refreshedHeaders.forEach((val, key) => {
    responseHeaders.set(key, val);
  });

  return Response.json(
    {
      data: {
        success: true,
      },
    },
    {
      status: 200,
      headers: responseHeaders,
    }
  );
}
