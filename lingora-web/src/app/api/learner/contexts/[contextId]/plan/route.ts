import { cookies } from 'next/headers.js';
import { buildAuthResponseHeaders, verifyLearnerIdentity, validateSameOrigin } from '../../../../../../server/auth/index.ts';
import { getContextPlan, updateContextPlan } from '../../../../../../server/context/onboarding-service.ts';
import { ContextServiceError, isValidUuid } from '../../../../../../server/context/dto.ts';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ contextId: string }> }
) {
  const defaultHeaders = { 'Cache-Control': 'no-store, private' };

  const url = new URL(request.url);
  if (url.search && url.search !== '?') {
    return Response.json(
      {
        error: {
          code: 'INVALID_QUERY_PARAMETERS',
          message: 'Yêu cầu không hỗ trợ tham số truy vấn.',
        },
      },
      { status: 400, headers: defaultHeaders }
    );
  }

  const { contextId } = await params;
  if (!isValidUuid(contextId)) {
    return Response.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Mã lộ trình không hợp lệ.',
        },
      },
      { status: 400, headers: defaultHeaders }
    );
  }

  const cookieStore = await cookies();
  const refreshedHeaders = new Headers();

  const verified = await verifyLearnerIdentity({
    cookieStore,
    responseHeaders: refreshedHeaders,
  });

  const responseHeaders = buildAuthResponseHeaders(defaultHeaders);
  refreshedHeaders.forEach((val, key) => {
    responseHeaders.set(key, val);
  });

  if (!verified.ok) {
    return Response.json(
      { error: verified.error },
      { status: verified.status, headers: responseHeaders }
    );
  }

  try {
    const result = await getContextPlan(contextId, verified.user.id);
    return Response.json(
      { data: result },
      { status: 200, headers: responseHeaders }
    );
  } catch (err: any) {
    if (err instanceof ContextServiceError) {
      return Response.json(
        {
          error: {
            code: err.code,
            message: err.message,
          },
        },
        { status: err.status, headers: responseHeaders }
      );
    }
    return Response.json(
      {
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
        },
      },
      { status: 503, headers: responseHeaders }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ contextId: string }> }
) {
  const defaultHeaders = { 'Cache-Control': 'no-store, private' };

  if (!validateSameOrigin(request)) {
    return Response.json(
      {
        error: {
          code: 'FORBIDDEN_ORIGIN',
          message: 'Yêu cầu bị từ chối do không cùng nguồn gốc.',
        },
      },
      { status: 403, headers: defaultHeaders }
    );
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return Response.json(
      {
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Yêu cầu yêu cầu Content-Type application/json.',
        },
      },
      { status: 415, headers: defaultHeaders }
    );
  }

  const { contextId } = await params;
  if (!isValidUuid(contextId)) {
    return Response.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Mã lộ trình không hợp lệ.',
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
          code: 'VALIDATION_ERROR',
          message: 'Dữ liệu JSON không hợp lệ.',
        },
      },
      { status: 400, headers: defaultHeaders }
    );
  }

  const cookieStore = await cookies();
  const refreshedHeaders = new Headers();

  const verified = await verifyLearnerIdentity({
    cookieStore,
    responseHeaders: refreshedHeaders,
  });

  const responseHeaders = buildAuthResponseHeaders(defaultHeaders);
  refreshedHeaders.forEach((val, key) => {
    responseHeaders.set(key, val);
  });

  if (!verified.ok) {
    return Response.json(
      { error: verified.error },
      { status: verified.status, headers: responseHeaders }
    );
  }

  try {
    const result = await updateContextPlan(contextId, verified.user.id, body);
    return Response.json(
      { data: result },
      { status: 200, headers: responseHeaders }
    );
  } catch (err: any) {
    if (err instanceof ContextServiceError) {
      return Response.json(
        {
          error: {
            code: err.code,
            message: err.message,
          },
        },
        { status: err.status, headers: responseHeaders }
      );
    }
    return Response.json(
      {
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
        },
      },
      { status: 503, headers: responseHeaders }
    );
  }
}
