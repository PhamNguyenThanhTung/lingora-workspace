import { cookies } from 'next/headers.js';
import { verifyLearnerIdentity, buildAuthResponseHeaders } from '../../../../../../server/auth/index.ts';
import { loadLearnerCatalogue } from '../../../../../../server/lessons/service.ts';
import { LessonServiceError } from '../../../../../../server/lessons/dto.ts';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ contextId: string }> | { contextId: string } }
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

  const { contextId } = await context.params;

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
    const data = await loadLearnerCatalogue(contextId, verified.user.id);
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
