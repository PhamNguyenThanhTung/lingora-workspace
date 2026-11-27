import { z } from 'zod';
import { validateSameOrigin } from '../../../../server/auth/index.ts';
import { startFreePracticeSession } from '../../../../server/writing/free-practice-service.ts';
import { withLearner } from '../_http.ts';

export const dynamic = 'force-dynamic';

const bodySchema = z
  .object({ contextId: z.string().uuid(), characterId: z.string().uuid(), requestId: z.string().uuid() })
  .strict();

export async function POST(request: Request) {
  const base = { 'Cache-Control': 'no-store, private' };
  if (!validateSameOrigin(request)) {
    return Response.json({ error: { code: 'FORBIDDEN_ORIGIN', message: 'Yêu cầu bị từ chối do không cùng nguồn gốc.' } }, { status: 403, headers: base });
  }
  if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
    return Response.json({ error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Yêu cầu cần Content-Type application/json.' } }, { status: 415, headers: base });
  }
  const text = await request.text().catch(() => '');
  if (text.length > 4096) {
    return Response.json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Dung lượng yêu cầu quá lớn.' } }, { status: 413, headers: base });
  }
  let json: unknown;
  try { json = JSON.parse(text); } catch {
    return Response.json({ error: { code: 'MALFORMED_JSON', message: 'Định dạng JSON không hợp lệ.' } }, { status: 400, headers: base });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu đầu vào không hợp lệ.', details: parsed.error.issues } }, { status: 400, headers: base });
  }
  return withLearner(async (userId) => {
    const session = await startFreePracticeSession({
      contextId: parsed.data.contextId,
      characterId: parsed.data.characterId,
      operationKey: parsed.data.requestId,
      verifiedUserId: userId,
    });
    return { status: session.isReplay ? 200 : 201, data: session };
  });
}
