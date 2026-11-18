import { cookies } from 'next/headers.js';
import {
  buildAuthResponseHeaders,
  verifyLearnerIdentity,
  validateSameOrigin,
} from '../../../../../../server/auth/index.ts';
import { completeWritingSession } from '../../../../../../server/writing/session-service.ts';
import { LessonServiceError } from '../../../../../../server/lessons/dto.ts';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> | { sessionId: string } }
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
    const session = await completeWritingSession(sessionId, verifiedUserId(verified));
    return Response.json({ data: session }, { status: 200, headers: responseHeaders });
  } catch (err: unknown) {
    if (err instanceof LessonServiceError) {
      const serviceErr = err as LessonServiceError;
      return Response.json(
        { error: serviceErr.error },
        { status: serviceErr.status, headers: responseHeaders }
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

function verifiedUserId(verified: any): string {
  return verified.user.id;
}
