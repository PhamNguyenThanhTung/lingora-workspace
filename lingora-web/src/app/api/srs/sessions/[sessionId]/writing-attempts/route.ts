import { cookies } from 'next/headers.js';
import {
  buildAuthResponseHeaders,
  verifyLearnerIdentity,
  validateSameOrigin,
} from '../../../../../../server/auth/index.ts';
import {
  SrsServiceError,
  submitSessionWritingAttempt,
  writingSessionAttemptSchema,
} from '../../../../../../server/srs/index.ts';

export const dynamic = 'force-dynamic';

const MAX_REQUEST_BYTES = 256 * 1024;

function errorResponse(status: number, code: string, message: string, headers: HeadersInit = {}) {
  return Response.json({ error: { code, message } }, { status, headers });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> | { sessionId: string } },
) {
  const defaultHeaders = { 'Cache-Control': 'no-store, private' };
  if (!validateSameOrigin(request)) return errorResponse(403, 'FORBIDDEN_ORIGIN', 'Yêu cầu bị từ chối do không cùng nguồn gốc.', defaultHeaders);
  if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
    return errorResponse(415, 'UNSUPPORTED_MEDIA_TYPE', 'Yêu cầu cần Content-Type application/json.', defaultHeaders);
  }
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return errorResponse(413, 'PAYLOAD_TOO_LARGE', 'Dung lượng yêu cầu vượt quá 256 KiB.', defaultHeaders);
  }

  let text = '';
  const reader = request.body?.getReader();
  if (reader) {
    const chunks: Uint8Array[] = [];
    let byteLength = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        byteLength += value.byteLength;
        if (byteLength > MAX_REQUEST_BYTES) {
          await reader.cancel();
          return errorResponse(413, 'PAYLOAD_TOO_LARGE', 'Dung lượng yêu cầu vượt quá 256 KiB.', defaultHeaders);
        }
        chunks.push(value);
      }
    } catch {
      return errorResponse(400, 'MALFORMED_BODY', 'Không thể đọc dữ liệu yêu cầu.', defaultHeaders);
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    text = new TextDecoder().decode(bytes);
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return errorResponse(400, 'MALFORMED_JSON', 'Định dạng JSON của yêu cầu không hợp lệ.', defaultHeaders);
  }
  const parsed = writingSessionAttemptSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, 'VALIDATION_ERROR', 'Dữ liệu nét vẽ không hợp lệ.', defaultHeaders);

  const { sessionId } = await context.params;
  const refreshedHeaders = new Headers();
  const verified = await verifyLearnerIdentity({ cookieStore: await cookies(), responseHeaders: refreshedHeaders });
  const responseHeaders = buildAuthResponseHeaders(defaultHeaders);
  refreshedHeaders.forEach((value, key) => responseHeaders.set(key, value));
  if (!verified.ok) return Response.json({ error: verified.error }, { status: verified.status, headers: responseHeaders });

  try {
    const result = await submitSessionWritingAttempt(verified.user.id, sessionId, parsed.data);
    return Response.json({ data: result }, { status: 200, headers: responseHeaders });
  } catch (error) {
    if (error instanceof SrsServiceError) {
      return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status, headers: responseHeaders });
    }
    return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Dịch vụ ôn tập tạm thời không khả dụng.', responseHeaders);
  }
}
