import { cookies } from 'next/headers.js';
import { buildAuthResponseHeaders, verifyLearnerIdentity } from '../../../../../server/auth/index.ts';
import { loadContextOptions } from '../../../../../server/context/service.ts';
import { ContextServiceError } from '../../../../../server/context/dto.ts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const defaultHeaders = { 'Cache-Control': 'no-store, private' };
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
    const optionsData = await loadContextOptions(verified.user.id);
    return Response.json(
      { data: optionsData },
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
