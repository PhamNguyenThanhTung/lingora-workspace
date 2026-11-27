import { cookies } from 'next/headers.js';
import { buildAuthResponseHeaders, verifyLearnerIdentity } from '../../../server/auth/index.ts';
import { LessonServiceError } from '../../../server/lessons/dto.ts';

/** Shared wrapper for the standalone writing-practice routes: learner auth, no-store headers, uniform error mapping. */
export async function withLearner(handler: (userId: string) => Promise<{ status: number; data: unknown }>): Promise<Response> {
  const cookieStore = await cookies();
  const refreshed = new Headers();
  const verified = await verifyLearnerIdentity({ cookieStore, responseHeaders: refreshed });
  const headers = buildAuthResponseHeaders({ 'Cache-Control': 'no-store, private' });
  refreshed.forEach((val, key) => headers.set(key, val));
  if (!verified.ok) return Response.json({ error: verified.error }, { status: verified.status, headers });
  try {
    const { status, data } = await handler(verified.user.id);
    return Response.json({ data }, { status, headers });
  } catch (err: unknown) {
    if (err instanceof LessonServiceError) return Response.json({ error: err.error }, { status: err.status, headers });
    return Response.json(
      { error: { code: 'SERVICE_UNAVAILABLE', message: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.' } },
      { status: 503, headers }
    );
  }
}
