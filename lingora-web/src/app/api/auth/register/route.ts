import { cookies } from 'next/headers.js';
import {
  createSupabaseServerClient,
  validateSameOrigin,
  buildAuthResponseHeaders,
  isProviderAvailabilityError,
  registerSchema,
} from '../../../../server/auth/index.ts';

export const dynamic = 'force-dynamic';

export const SAFE_REGISTRATION_SUCCESS_RESPONSE = {
  ok: true,
  message: 'Vui lòng kiểm tra hộp thư email của bạn để xác thực tài khoản trước khi đăng nhập.',
} as const;

const ALLOWLISTED_SAFE_ERROR_MESSAGES: Record<string, { code: string; message: string; status: number }> = {
  weak_password: {
    code: 'WEAK_PASSWORD',
    message: 'Mật khẩu không đáp ứng yêu cầu bảo mật của hệ thống.',
    status: 400,
  },
  over_request_rate_limit: {
    code: 'RATE_LIMITED',
    message: 'Yêu cầu gửi quá nhanh. Vui lòng thử lại sau giây lát.',
    status: 429,
  },
  over_email_send_rate_limit: {
    code: 'RATE_LIMITED',
    message: 'Yêu cầu gửi quá nhanh. Vui lòng thử lại sau giây lát.',
    status: 429,
  },
  signup_disabled: {
    code: 'REGISTRATION_DISABLED',
    message: 'Hệ thống tạm thời ngừng nhận đăng ký mới.',
    status: 403,
  },
  email_address_invalid: {
    code: 'VALIDATION_ERROR',
    message: 'Địa chỉ email không hợp lệ.',
    status: 400,
  },
};

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

  const parseResult = registerSchema.safeParse(body);
  if (!parseResult.success) {
    return Response.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.issues[0]?.message || 'Dữ liệu đăng ký không hợp lệ.',
        },
      },
      { status: 400, headers: defaultHeaders }
    );
  }

  const { email, password, displayName } = parseResult.data;
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

  let signUpResult;
  try {
    signUpResult = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: displayName ? { display_name: displayName } : undefined,
        emailRedirectTo,
      },
    });
  } catch (err: unknown) {
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

  if (signUpResult.error) {
    const err = signUpResult.error as { status?: number; name?: string; message?: string; code?: string };
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

    const code = (
      err.code ||
      (err.name === 'AuthWeakPasswordError' ? 'weak_password' : '') ||
      ''
    ).toLowerCase();
    const msg = (err.message || '').toLowerCase();
    const isDuplicate =
      code === 'user_already_exists' ||
      code === 'email_exists' ||
      msg.includes('already registered') ||
      msg.includes('already exists');

    if (isDuplicate) {
      // Safe identical success response: identical status (200) AND identical body to new registration
      return Response.json(SAFE_REGISTRATION_SUCCESS_RESPONSE, {
        status: 200,
        headers: responseHeaders,
      });
    }

    const mapped = code ? ALLOWLISTED_SAFE_ERROR_MESSAGES[code] : undefined;
    const errorPayload = mapped
      ? { code: mapped.code, message: mapped.message }
      : {
          code: 'REGISTRATION_FAILED',
          message: 'Đăng ký tài khoản không thành công. Vui lòng thử lại.',
        };
    const statusCode = mapped ? mapped.status : 400;

    return Response.json(
      { error: errorPayload },
      { status: statusCode, headers: responseHeaders }
    );
  }

  // Registration never promises logged-in success on unconfirmed signup.
  // Revoke any returned session immediately and ensure clean cookie namespace.
  if (signUpResult.data?.session) {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {}
  }

  const responseHeaders = buildAuthResponseHeaders(defaultHeaders);
  refreshedHeaders.forEach((val, key) => {
    responseHeaders.set(key, val);
  });

  return Response.json(SAFE_REGISTRATION_SUCCESS_RESPONSE, {
    status: 200,
    headers: responseHeaders,
  });
}
