import { cookies } from 'next/headers.js';
import { z } from 'zod';
import {
  buildAuthResponseHeaders,
  verifyLearnerIdentity,
  validateSameOrigin,
} from '../../../../../../server/auth/index.ts';
import { submitWritingAttempt } from '../../../../../../server/writing/session-service.ts';
import { LessonServiceError } from '../../../../../../server/lessons/dto.ts';

export const dynamic = 'force-dynamic';

const MAX_REQUEST_BYTES = 256 * 1024;

const pointSchema = z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]);
const submitAttemptSchema = z
  .object({
    operationKey: z.string().uuid().optional(),
    requestId: z.string().uuid().optional(),
    characterId: z.string().uuid().optional(),
    candidateStrokes: z
      .array(
        z.object({
          points: z.array(pointSchema).min(2).max(256),
        })
      )
      .min(1)
      .max(128)
      .optional(),
    strokePoints: z
      .array(z.array(pointSchema).min(2).max(256))
      .min(1)
      .max(128)
      .optional(),
  })
  .strict()
  .refine((data) => Boolean(data.candidateStrokes) !== Boolean(data.strokePoints), {
    message: 'Yêu cầu đúng một trong candidateStrokes hoặc strokePoints.',
  })
  .refine(
    (data) => Boolean(data.operationKey) !== Boolean(data.requestId),
    { message: 'Yêu cầu chính xác một trong operationKey hoặc requestId.' }
  )
  .refine(
    (data) => Boolean(data.candidateStrokes || data.strokePoints),
    { message: 'Yêu cầu candidateStrokes hoặc strokePoints' }
  )
  .refine(
    (data) => {
      const totalPoints = data.candidateStrokes
        ? data.candidateStrokes.reduce((sum, stroke) => sum + stroke.points.length, 0)
        : data.strokePoints?.reduce((sum, points) => sum + points.length, 0) || 0;
      return totalPoints <= 4096;
    },
    { message: 'Tổng số điểm vượt quá giới hạn 4096.' }
  );

function tooLargeResponse(headers: Record<string, string>) {
  return Response.json(
    { error: { code: 'PAYLOAD_TOO_LARGE', message: 'Dung lượng yêu cầu vượt quá 256 KiB.' } },
    { status: 413, headers }
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string; characterId?: string }> | { sessionId: string; characterId?: string } }
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

  const { sessionId, characterId: routeCharacterId } = await context.params;

  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return tooLargeResponse(defaultHeaders);
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
          return tooLargeResponse(defaultHeaders);
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

  const parsed = submitAttemptSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dữ liệu nét vẽ không hợp lệ.',
          details: parsed.error.issues,
        },
      },
      { status: 400, headers: defaultHeaders }
    );
  }

  if (routeCharacterId && !parsed.data.characterId) {
    return Response.json(
      { error: { code: 'CHARACTER_REQUIRED', message: 'characterId trong body là bắt buộc cho route ký tự.' } },
      { status: 400, headers: defaultHeaders }
    );
  }

  if (routeCharacterId && routeCharacterId.toLowerCase() !== parsed.data.characterId?.toLowerCase()) {
    return Response.json(
      { error: { code: 'CHARACTER_MISMATCH', message: 'characterId không khớp với route.' } },
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
    const operationKey = (parsed.data.operationKey || parsed.data.requestId)!;
    const candidateStrokes = parsed.data.candidateStrokes || (parsed.data.strokePoints?.map((points) => ({ points })) as any);

    const attempt = await submitWritingAttempt({
      sessionId,
      operationKey,
      candidateStrokes,
      expectedCharacterId: routeCharacterId || parsed.data.characterId,
      verifiedUserId: verified.user.id,
    });

    const status = attempt.isReplay ? 200 : 201;
    return Response.json({ data: attempt }, { status, headers: responseHeaders });
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
