import { cookies } from 'next/headers.js';
import { buildAuthResponseHeaders, verifyLearnerIdentity, validateSameOrigin } from '../../../../../../server/auth/index.ts';
import { startLearningContext } from '../../../../../../server/context/service.ts';
import { ContextServiceError, isValidUuid } from '../../../../../../server/context/dto.ts';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ contextId: string }> | { contextId: string } }
) {
  const defaultHeaders = { 'Cache-Control': 'no-store, private' };

  // Same-origin check BEFORE identity / DB work
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

  // Content-Type check BEFORE identity / DB work
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

  const { contextId } = await context.params;
  if (!isValidUuid(contextId)) {
    return Response.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Mã định danh lộ trình không hợp lệ.',
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
    const result = await startLearningContext(verified.user.id, contextId, body);
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
