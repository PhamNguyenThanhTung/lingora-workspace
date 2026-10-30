import { cookies } from 'next/headers.js';
import {
  verifyStaffIdentity,
  validateSameOrigin,
  buildAuthResponseHeaders,
} from '../../../../server/auth/index.ts';
import {
  isValidUuid,
  updateTeacherStatus,
  updateTeacherStatusSchema,
} from '../../../../server/teachers/index.ts';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
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

  const { accountId } = await params;
  if (!isValidUuid(accountId)) {
    return Response.json(
      {
        error: {
          code: 'INVALID_ID',
          message: 'Mã định danh tài khoản không hợp lệ.',
        },
      },
      { status: 400, headers: defaultHeaders }
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

  const parseResult = updateTeacherStatusSchema.safeParse(body);
  if (!parseResult.success) {
    const issue = parseResult.error.issues[0];
    return Response.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: issue?.message || 'Dữ liệu thay đổi trạng thái không hợp lệ.',
          fields: parseResult.error.issues.reduce((acc, curr) => {
            const field = curr.path.join('.') || 'payload';
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

  const authResult = await verifyStaffIdentity({
    cookieStore,
    requiredRole: 'ADMIN',
    responseHeaders: sdkHeaders,
  });

  if (!authResult.ok) {
    return Response.json(
      { error: authResult.error },
      {
        status: authResult.status,
        headers: buildAuthResponseHeaders(undefined, Object.fromEntries(sdkHeaders.entries())),
      }
    );
  }

  const result = await updateTeacherStatus(
    authResult.account.id,
    accountId,
    parseResult.data
  );

  return Response.json(
    result.ok ? { data: result.data } : { error: result.error },
    {
      status: result.status,
      headers: buildAuthResponseHeaders(undefined, Object.fromEntries(sdkHeaders.entries())),
    }
  );
}
