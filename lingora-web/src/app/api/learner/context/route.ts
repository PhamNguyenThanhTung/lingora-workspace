import { cookies } from 'next/headers.js';
import { loadLearnerContext } from '../../../../server/context/loader.ts';
import { buildAuthResponseHeaders } from '../../../../server/auth/index.ts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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

  const cookieStore = await cookies();
  const refreshedHeaders = new Headers();

  const result = await loadLearnerContext(cookieStore, {
    responseHeaders: refreshedHeaders,
  });

  const responseHeaders = buildAuthResponseHeaders(defaultHeaders);
  refreshedHeaders.forEach((val, key) => {
    responseHeaders.set(key, val);
  });

  if (!result.ok) {
    return Response.json(
      {
        error: result.error,
      },
      {
        status: result.status,
        headers: responseHeaders,
      }
    );
  }

  return Response.json(
    {
      data: result.data,
    },
    {
      status: 200,
      headers: responseHeaders,
    }
  );
}
