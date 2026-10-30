import { cookies } from 'next/headers.js';
import {
  createSupabaseServerClient,
  validateSameOrigin,
  buildAuthResponseHeaders,
} from '../../../../server/auth/index.ts';
import {
  verifyTeacherActivationEligibility,
  activateTeacherAccount,
  activateTeacherSchema,
} from '../../../../server/teachers/index.ts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const sdkHeaders = new Headers();

  let authClient;
  try {
    authClient = createSupabaseServerClient(cookieStore, sdkHeaders);
  } catch {
    return Response.json(
      {
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Cấu hình môi trường dịch vụ chưa hoàn tất.',
        },
      },
      {
        status: 503,
        headers: buildAuthResponseHeaders(undefined, Object.fromEntries(sdkHeaders.entries())),
      }
    );
  }

  let authUserResult;
  try {
    authUserResult = await authClient.auth.getUser();
  } catch {
    return Response.json(
      {
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại sau.',
        },
      },
      {
        status: 503,
        headers: buildAuthResponseHeaders(undefined, Object.fromEntries(sdkHeaders.entries())),
      }
    );
  }

  if (authUserResult.error || !authUserResult.data?.user) {
    return Response.json(
      {
        error: {
          code: (authUserResult.error?.status || 0) >= 500 ? 'SERVICE_UNAVAILABLE' : 'UNAUTHENTICATED',
          message: 'Chưa xác nhận được phiên kích hoạt. Vui lòng thử lại.',
        },
      },
      {
        status: (authUserResult.error?.status || 0) >= 500 ? 503 : 401,
        headers: buildAuthResponseHeaders(undefined, Object.fromEntries(sdkHeaders.entries())),
      }
    );
  }

  const user = authUserResult.data.user;
  const result = await verifyTeacherActivationEligibility(user.id);

  if (!result.ok) {
    return Response.json(
      { error: result.error },
      {
        status: result.status,
        headers: buildAuthResponseHeaders(undefined, Object.fromEntries(sdkHeaders.entries())),
      }
    );
  }

  return Response.json(
    {
      ok: true,
      email: result.data?.email || user.email,
      displayName: result.data?.displayName || null,
    },
    {
      status: 200,
      headers: buildAuthResponseHeaders(undefined, Object.fromEntries(sdkHeaders.entries())),
    }
  );
}

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

  const parseResult = activateTeacherSchema.safeParse(body);
  if (!parseResult.success) {
    const issue = parseResult.error.issues[0];
    return Response.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: issue?.message || 'Mật khẩu không hợp lệ.',
          fields: parseResult.error.issues.reduce((acc, curr) => {
            const field = curr.path.join('.') || 'password';
            acc[field] = curr.message;
            return acc;
          }, {} as Record<string, string>),
        },
      },
      { status: 400, headers: defaultHeaders }
    );
  }

  const cookieStore = await cookies();
  const sdkHeaders = new Headers();

  let authClient;
  try {
    authClient = createSupabaseServerClient(cookieStore, sdkHeaders);
  } catch {
    return Response.json(
      {
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Cấu hình môi trường dịch vụ chưa hoàn tất.',
        },
      },
      {
        status: 503,
        headers: buildAuthResponseHeaders(undefined, Object.fromEntries(sdkHeaders.entries())),
      }
    );
  }

  let authUserResult;
  try {
    authUserResult = await authClient.auth.getUser();
  } catch {
    return Response.json(
      {
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại sau.',
        },
      },
      {
        status: 503,
        headers: buildAuthResponseHeaders(undefined, Object.fromEntries(sdkHeaders.entries())),
      }
    );
  }

  if (authUserResult.error || !authUserResult.data?.user) {
    return Response.json(
      {
        error: {
          code: (authUserResult.error?.status || 0) >= 500 ? 'SERVICE_UNAVAILABLE' : 'UNAUTHENTICATED',
          message: 'Chưa xác nhận được phiên kích hoạt. Vui lòng thử lại.',
        },
      },
      {
        status: (authUserResult.error?.status || 0) >= 500 ? 503 : 401,
        headers: buildAuthResponseHeaders(undefined, Object.fromEntries(sdkHeaders.entries())),
      }
    );
  }

  const user = authUserResult.data.user;

  const result = await activateTeacherAccount(
    user.id,
    parseResult.data.password,
    authClient
  );

  return Response.json(
    result.ok ? { ok: true, redirect: result.redirect || '/holding' } : { error: result.error },
    {
      status: result.status,
      headers: buildAuthResponseHeaders(undefined, Object.fromEntries(sdkHeaders.entries())),
    }
  );
}
