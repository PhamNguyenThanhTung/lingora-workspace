import { cookies } from 'next/headers.js';
import {
  verifyStaffIdentity,
  validateSameOrigin,
  buildAuthResponseHeaders,
} from '../../../../../../../server/auth/index.ts';
import {
  isValidUuid,
  resolveReviewComment,
} from '../../../../../../../server/lessons/comments.ts';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ lessonId: string; commentId: string }> }
) {
  const defaultHeaders = { 'Cache-Control': 'no-store, private' };
  const refreshedHeaders = new Headers();

  if (!validateSameOrigin(request)) {
    return Response.json(
      {
        error: {
          code: 'FORBIDDEN_ORIGIN',
          message: 'Yêu cầu bị từ chối do nguồn gốc (Origin) không hợp lệ.',
        },
      },
      {
        status: 403,
        headers: defaultHeaders,
      }
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
      {
        status: 415,
        headers: defaultHeaders,
      }
    );
  }

  const { lessonId, commentId } = await params;
  if (!isValidUuid(lessonId) || !isValidUuid(commentId)) {
    return Response.json(
      {
        error: {
          code: 'INVALID_ID',
          message: 'Mã định danh không đúng định dạng UUID.',
        },
      },
      {
        status: 400,
        headers: defaultHeaders,
      }
    );
  }

  const cookieStore = await cookies();
  const authResult = await verifyStaffIdentity({
    cookieStore,
    requiredRole: 'TEACHER',
    responseHeaders: refreshedHeaders,
  });

  const responseHeaders = buildAuthResponseHeaders(defaultHeaders);
  refreshedHeaders.forEach((val, key) => {
    responseHeaders.set(key, val);
  });

  if (!authResult.ok) {
    return Response.json(
      { error: authResult.error },
      {
        status: authResult.status,
        headers: responseHeaders,
      }
    );
  }

  if (authResult.account.status !== 'ACTIVE') {
    return Response.json(
      {
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Tài khoản đang chờ duyệt hoặc đã bị vô hiệu hóa.',
        },
      },
      {
        status: 403,
        headers: responseHeaders,
      }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        error: {
          code: 'MALFORMED_JSON',
          message: 'Dữ liệu JSON không hợp lệ.',
        },
      },
      {
        status: 400,
        headers: responseHeaders,
      }
    );
  }

  const expectedRowVersion =
    body && typeof body === 'object' && ('expectedRowVersion' in body)
      ? String(body.expectedRowVersion)
      : '';

  const result = await resolveReviewComment(
    authResult.account.id,
    commentId,
    expectedRowVersion,
    undefined,
    lessonId
  );

  if (result.error) {
    return Response.json(
      { error: result.error },
      {
        status: result.status,
        headers: responseHeaders,
      }
    );
  }

  return Response.json(result.data, {
    status: result.status,
    headers: responseHeaders,
  });
}
