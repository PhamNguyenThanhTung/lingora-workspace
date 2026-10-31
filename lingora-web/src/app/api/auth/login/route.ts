import { cookies } from 'next/headers.js';
import { z } from 'zod';
import {
  createSupabaseServerClient,
  verifyLearnerIdentity,
  validateSameOrigin,
  buildAuthResponseHeaders,
  getLearnerCookieName,
} from '../../../../server/auth/index.ts';

const loginInputSchema = z.object({
  email: z.string().trim().email('Email không đúng định dạng'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

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

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return Response.json(
      {
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Định dạng yêu cầu phải là application/json.',
        },
      },
      { status: 415, headers: defaultHeaders }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        error: {
          code: 'MALFORMED_JSON',
          message: 'Dữ liệu JSON trong yêu cầu không hợp lệ.',
        },
      },
      { status: 400, headers: defaultHeaders }
    );
  }

  const parseResult = loginInputSchema.safeParse(body);
  if (!parseResult.success) {
    return Response.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.issues[0]?.message || 'Dữ liệu đăng nhập không hợp lệ.',
        },
      },
      { status: 400, headers: defaultHeaders }
    );
  }

  const { email, password } = parseResult.data;
  const cookieStore = await cookies();
  const refreshedHeaders = new Headers();

  let supabase;
  try {
    supabase = createSupabaseServerClient(cookieStore, refreshedHeaders);
  } catch {
    return Response.json(
      {
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Cấu hình hệ thống xác thực chưa khả dụng.',
        },
      },
      { status: 503, headers: defaultHeaders }
    );
  }

  let signInResult;
  try {
    signInResult = await supabase.auth.signInWithPassword({ email, password });
  } catch {
    const responseHeaders = buildAuthResponseHeaders(defaultHeaders);
    refreshedHeaders.forEach((val, key) => {
      responseHeaders.set(key, val);
    });
    return Response.json(
      {
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Dịch vụ xác thực tạm thời không phản hồi. Vui lòng thử lại sau.',
        },
      },
      { status: 503, headers: responseHeaders }
    );
  }

  if (signInResult.error) {
    const err = signInResult.error as { status?: number; name?: string; message?: string; code?: string };
    const isNetworkOrProviderOutage =
      err.status === 500 ||
      err.status === 502 ||
      err.status === 503 ||
      err.status === 504 ||
      err.name === 'AuthRetryableFetchError' ||
      err.message?.toLowerCase().includes('fetch') ||
      err.message?.toLowerCase().includes('network') ||
      err.message?.toLowerCase().includes('timeout') ||
      err.message?.toLowerCase().includes('failed to fetch');

    const responseHeaders = buildAuthResponseHeaders(defaultHeaders);
    refreshedHeaders.forEach((val, key) => {
      responseHeaders.set(key, val);
    });

    if (err.code === 'email_not_confirmed') {
      return Response.json(
        { error: { code: 'FORBIDDEN', message: 'Tài khoản chưa xác thực email. Vui lòng xác thực email trước khi đăng nhập.' } },
        { status: 403, headers: responseHeaders }
      );
    }

    if (isNetworkOrProviderOutage) {
      return Response.json(
        {
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Dịch vụ xác thực tạm thời không phản hồi. Vui lòng thử lại sau.',
          },
        },
        { status: 503, headers: responseHeaders }
      );
    }

    return Response.json(
      {
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.',
        },
      },
      { status: 401, headers: responseHeaders }
    );
  }

  // Verify learner identity and status freshly against database
  const verified = await verifyLearnerIdentity({
    authClient: supabase,
    responseHeaders: refreshedHeaders,
  });

  if (!verified.ok) {
    // Failed role/status login signs out the learner-origin session
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Safe isolation
    }

    // Explicitly clear learner auth cookies
    try {
      const learnerCookieName = getLearnerCookieName();
      const allCookies = await cookieStore.getAll();
      for (const cookie of allCookies) {
        if (
          cookie.name === learnerCookieName ||
          cookie.name.startsWith(learnerCookieName + '.')
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

    const responseHeaders = buildAuthResponseHeaders(defaultHeaders);
    refreshedHeaders.forEach((val, key) => {
      responseHeaders.set(key, val);
    });

    return Response.json(
      {
        error: verified.error,
      },
      { status: verified.status, headers: responseHeaders }
    );
  }

  const responseHeaders = buildAuthResponseHeaders(defaultHeaders);
  refreshedHeaders.forEach((val, key) => {
    responseHeaders.set(key, val);
  });

  return Response.json(
    {
      data: {
        user: verified.user,
        account: verified.account,
      },
    },
    {
      status: 200,
      headers: responseHeaders,
    }
  );
}
