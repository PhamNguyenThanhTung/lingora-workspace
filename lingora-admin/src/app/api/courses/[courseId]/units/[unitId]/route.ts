import { cookies } from 'next/headers.js';
import {
  verifyStaffIdentity,
  validateSameOrigin,
  buildAuthResponseHeaders,
} from '../../../../../../server/auth/index.ts';
import {
  isValidUuid,
  updateUnit,
  deleteUnit,
} from '../../../../../../server/units/index.ts';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string; unitId: string }> }
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

  const { courseId, unitId } = await params;
  if (!isValidUuid(courseId) || !isValidUuid(unitId)) {
    return Response.json(
      {
        error: {
          code: 'INVALID_ID',
          message: 'Mã định danh UUID không đúng định dạng.',
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
    requiredRole: 'ADMIN',
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

  let body: unknown;
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

  const result = await updateUnit(courseId, unitId, body);
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
    status: 200,
    headers: responseHeaders,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ courseId: string; unitId: string }> }
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

  const { courseId, unitId } = await params;
  if (!isValidUuid(courseId) || !isValidUuid(unitId)) {
    return Response.json(
      {
        error: {
          code: 'INVALID_ID',
          message: 'Mã định danh UUID không đúng định dạng.',
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
    requiredRole: 'ADMIN',
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

  const result = await deleteUnit(courseId, unitId);
  if (result.error) {
    return Response.json(
      { error: result.error },
      {
        status: result.status,
        headers: responseHeaders,
      }
    );
  }

  return new Response(null, {
    status: 204,
    headers: responseHeaders,
  });
}
