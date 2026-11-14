import { cookies } from 'next/headers.js';
import { buildAuthResponseHeaders } from '../../../../server/auth/index.ts';
import { loadLearnerHome } from '../../../../server/context/home-loader.ts';
import { isValidUuid } from '../../../../server/context/dto.ts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const defaultHeaders = { 'Cache-Control': 'no-store, private' };

  const url = new URL(request.url);
  const contextId = url.searchParams.get('contextId');

  // Verify only contextId is allowed as search parameter
  for (const key of url.searchParams.keys()) {
    if (key !== 'contextId') {
      return Response.json(
        {
          error: {
            code: 'INVALID_QUERY_PARAMETERS',
            message: 'Yêu cầu không hỗ trợ tham số truy vấn ngoài contextId.',
          },
        },
        { status: 400, headers: defaultHeaders }
      );
    }
  }

  if (url.searchParams.getAll('contextId').length > 1 || (contextId !== null && !isValidUuid(contextId))) {
    return Response.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Mã lộ trình contextId không hợp lệ.',
        },
      },
      { status: 400, headers: defaultHeaders }
    );
  }

  const cookieStore = await cookies();
  const refreshedHeaders = new Headers();

  const result = await loadLearnerHome(cookieStore, {
    contextId,
    responseHeaders: refreshedHeaders,
  });

  const responseHeaders = buildAuthResponseHeaders(defaultHeaders);
  refreshedHeaders.forEach((val, key) => {
    responseHeaders.set(key, val);
  });

  if (!result.ok) {
    return Response.json(
      { error: result.error },
      { status: result.status, headers: responseHeaders }
    );
  }

  return Response.json({ data: result.data }, { status: 200, headers: responseHeaders });
}
