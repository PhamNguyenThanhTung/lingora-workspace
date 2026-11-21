import { cookies } from 'next/headers.js';
import { z } from 'zod';
import {
  createSupabaseServerClient,
  validateSameOrigin,
  buildAuthResponseHeaders,
  isProviderAvailabilityError,
} from '../../../../server/auth/index.ts';

export const dynamic = 'force-dynamic';

export const RESEND_CONFIRMATION_SUCCESS_RESPONSE = {
  ok: true,
  message: 'Nếu email đã đăng ký và chưa xác thực, chúng tôi đã gửi lại liên kết xác nhận. Vui lòng kiểm tra hộp thư.',
} as const;

const resendSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Email không đúng định dạng')
      .max(255, 'Email quá dài'),
  })
  .strict();

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

  const parseResult = resendSchema.safeParse(body);
  if (!parseResult.success) {
    return Response.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.issues[0]?.message || 'Dữ liệu không hợp lệ.',
        },
      },
      { status: 400, headers: defaultHeaders }
    );
  }

  const { email } = parseResult.data;
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

  const requestUrl = new URL(request.url);
  const emailRedirectTo = `${requestUrl.origin}/auth/confirm`;

  let resendResult;
  try {
    resendResult = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo,
      },
    });
  } catch (err: unknown) {
    const responseHeaders = buildAuthResponseHeaders(defaultHeaders);
    refreshedHeaders.forEach((val, key) => {
      responseHeaders.set(key, val);
    });

    if (isProviderAvailabilityError(err)) {
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

    return Response.json(RESEND_CONFIRMATION_SUCCESS_RESPONSE, {
      status: 200,
      headers: responseHeaders,
    });
  }

  const responseHeaders = buildAuthResponseHeaders(defaultHeaders);
  refreshedHeaders.forEach((val, key) => {
    responseHeaders.set(key, val);
  });

  if (resendResult.error) {
    const err = resendResult.error as { status?: number; code?: string; message?: string };
    if (isProviderAvailabilityError(err)) {
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

    const code = (err.code || '').toLowerCase();
    if (
      code === 'over_email_send_rate_limit' ||
      code === 'over_request_rate_limit' ||
      err.status === 429
    ) {
      return Response.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Yêu cầu gửi quá nhanh. Vui lòng thử lại sau giây lát.',
          },
        },
        { status: 429, headers: responseHeaders }
      );
    }

    // Generic safe logging: do not log email
    console.warn('learner_resend_confirmation_failed', {
      code: /^[a-z0-9_]{1,64}$/.test(code) ? code : 'unknown',
      status: typeof err.status === 'number' ? err.status : null,
    });

    return Response.json(RESEND_CONFIRMATION_SUCCESS_RESPONSE, {
      status: 200,
      headers: responseHeaders,
    });
  }

  return Response.json(RESEND_CONFIRMATION_SUCCESS_RESPONSE, {
    status: 200,
    headers: responseHeaders,
  });
}
