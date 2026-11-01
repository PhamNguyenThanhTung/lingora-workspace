import { cookies } from 'next/headers.js';
import {
  verifyLearnerIdentity,
  validateSameOrigin,
  buildAuthResponseHeaders,
} from '../../../../../../../../server/auth/index.ts';
import {
  getLessonReading,
  mutateLessonConsumption,
} from '../../../../../../../../server/lessons/service.ts';
import {
  consumptionPostSchema,
  LessonServiceError,
} from '../../../../../../../../server/lessons/dto.ts';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ contextId: string; lessonId: string }> | { contextId: string; lessonId: string } }
) {
  const defaultHeaders = { 'Cache-Control': 'no-store, private' };

  // Reject unsupported query/selector parameters with 400
  const url = new URL(request.url);
  if (url.search && url.search !== '?') {
    return Response.json(
      {
        error: {
          code: 'INVALID_QUERY_PARAMETERS',
          message: 'Yêu cầu không hỗ trợ tham số truy vấn hoặc bộ lọc.',
        },
      },
      { status: 400, headers: defaultHeaders }
    );
  }

  const { contextId, lessonId } = await context.params;

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
    const data = await getLessonReading(contextId, lessonId, verified.user.id);
    return Response.json({ data }, { status: 200, headers: responseHeaders });
  } catch (err: unknown) {
    if (err instanceof LessonServiceError) {
      return Response.json(
        { error: err.error },
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
  context: { params: Promise<{ contextId: string; lessonId: string }> | { contextId: string; lessonId: string } }
) {
  const defaultHeaders = { 'Cache-Control': 'no-store, private' };

  // Reject unsupported query/selector parameters with 400
  const url = new URL(request.url);
  if (url.search && url.search !== '?') {
    return Response.json(
      {
        error: {
          code: 'INVALID_QUERY_PARAMETERS',
          message: 'Yêu cầu không hỗ trợ tham số truy vấn hoặc bộ lọc.',
        },
      },
      { status: 400, headers: defaultHeaders }
    );
  }

  // Same-origin check
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

  // Content-Type check
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return Response.json(
      {
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Định dạng dữ liệu không được hỗ trợ. Vui lòng gửi application/json.',
        },
      },
      { status: 415, headers: defaultHeaders }
    );
  }

  // Parse JSON body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json(
      {
        error: {
          code: 'MALFORMED_JSON',
          message: 'Dữ liệu gửi lên không đúng định dạng JSON.',
        },
      },
      { status: 400, headers: defaultHeaders }
    );
  }

  const parsed = consumptionPostSchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Dữ liệu yêu cầu không hợp lệ.',
        },
      },
      { status: 400, headers: defaultHeaders }
    );
  }

  const { contextId, lessonId } = await context.params;

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
    const data = await mutateLessonConsumption(
      contextId,
      lessonId,
      parsed.data,
      verified.user.id
    );
    return Response.json({ data }, { status: 200, headers: responseHeaders });
  } catch (err: unknown) {
    if (err instanceof LessonServiceError) {
      return Response.json(
        { error: err.error },
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
