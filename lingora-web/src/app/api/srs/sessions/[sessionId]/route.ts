import { cookies } from 'next/headers.js';
import {
  buildAuthResponseHeaders,
  verifyLearnerIdentity,
  validateSameOrigin,
} from '../../../../../server/auth/index.ts';
import {
  getReviewSession,
  SrsServiceError,
} from '../../../../../server/srs/index.ts';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> | { sessionId: string } }
) {
  const defaultHeaders = { 'Cache-Control': 'no-store, private' };

  if (request.headers.get('origin') && !validateSameOrigin(request)) {
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

  const { sessionId } = await context.params;

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
    const result = await getReviewSession(verified.user.id, sessionId);
    return Response.json(
      { data: result },
      { status: 200, headers: responseHeaders }
    );
  } catch (err: any) {
    if (err instanceof SrsServiceError) {
      return Response.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status, headers: responseHeaders }
      );
    }
    return Response.json(
      {
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Dịch vụ ôn tập tạm thời không khả dụng.',
        },
      },
      { status: 503, headers: responseHeaders }
    );
  }
}
