import { cookies } from 'next/headers.js';
import { z } from 'zod';
import {
  buildAuthResponseHeaders,
  verifyLearnerIdentity,
  validateSameOrigin,
} from '../../../../server/auth/index.ts';
import {
  startWritingSession,
} from '../../../../server/writing/session-service.ts';
import { LessonServiceError } from '../../../../server/lessons/dto.ts';

export const dynamic = 'force-dynamic';

const MAX_REQUEST_BYTES = 16 * 1024;

const startSessionSchema = z
  .object({
    contextId: z.string().uuid(),
    lessonId: z.string().uuid(),
    characterId: z.string().uuid().optional(),
    blockKey: z.string().trim().min(1).max(128).optional(),
    lessonVocabularyLinkId: z.string().uuid().optional(),
    expectedPublishedRevisionId: z.string().uuid(),
    requestId: z.string().uuid().optional(),
    operationKey: z.string().uuid().optional(),
  })
  .strict()
  .refine((data) => Boolean(data.blockKey) !== Boolean(data.lessonVocabularyLinkId), {
    message: 'Cần chọn đúng một trong blockKey hoặc lessonVocabularyLinkId.',
  })
  .refine(
    (data) => Boolean(data.requestId || data.operationKey) &&
      !(data.requestId && data.operationKey && data.requestId !== data.operationKey),
    { message: 'Yêu cầu một requestId ổn định.' }
  );

export async function POST(request: Request) {
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

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return Response.json(
      {
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Yêu cầu yêu cầu Content-Type application/json.',
        },
      },
      { status: 415, headers: defaultHeaders }
    );
  }

  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return Response.json(
      { error: { code: 'PAYLOAD_TOO_LARGE', message: 'Dung lượng yêu cầu vượt quá 16 KiB.' } },
      { status: 413, headers: defaultHeaders }
    );
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
          return Response.json(
            { error: { code: 'PAYLOAD_TOO_LARGE', message: 'Dung lượng yêu cầu vượt quá 16 KiB.' } },
            { status: 413, headers: defaultHeaders }
          );
        }
        chunks.push(value);
      }
    } catch {
      return Response.json(
        { error: { code: 'MALFORMED_BODY', message: 'Không thể đọc dữ liệu yêu cầu.' } },
        { status: 400, headers: defaultHeaders }
      );
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

  let body: unknown = {};
  if (text.trim().length > 0) {
    try {
      body = JSON.parse(text);
    } catch {
      return Response.json(
        {
          error: {
            code: 'MALFORMED_JSON',
            message: 'Định dạng JSON của yêu cầu không hợp lệ.',
          },
        },
        { status: 400, headers: defaultHeaders }
      );
    }
  }

  const parsed = startSessionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dữ liệu đầu vào không hợp lệ.',
          details: parsed.error.issues,
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
    const { requestId, operationKey, ...sessionInput } = parsed.data;
    const session = await startWritingSession({
      ...sessionInput,
      operationKey: requestId || operationKey,
      verifiedUserId: verified.user.id,
    });

    const status = session.isReplay ? 200 : 201;
    return Response.json({ data: session }, { status, headers: responseHeaders });
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
