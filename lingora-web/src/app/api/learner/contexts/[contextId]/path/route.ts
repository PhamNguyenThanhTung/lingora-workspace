import { cookies } from 'next/headers.js';
import { buildAuthResponseHeaders, verifyLearnerIdentity } from '../../../../../../server/auth/index.ts';
import { buildLearningPath } from '../../../../../../server/context/path-service.ts';
import { getLearnerPrisma } from '../../../../../../server/db/index.ts';
import { isValidUuid } from '../../../../../../server/context/dto.ts';
import { LessonServiceError } from '../../../../../../server/lessons/dto.ts';

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
    const data = await buildLearningPath(getLearnerPrisma(), contextId, verified.user.id);
    return Response.json({ data }, { status: 200, headers: responseHeaders });
  } catch (err: any) {
    if (err instanceof LessonServiceError) {
      return Response.json(
        { error: err.error },
        { status: err.status, headers: responseHeaders }
      );
    }
    if (err?.code === 'NOT_FOUND' || err?.message?.includes('không tồn tại')) {
      return Response.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Lộ trình học không tồn tại hoặc không thuộc sở hữu của bạn.',
          },
        },
        { status: 404, headers: responseHeaders }
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
