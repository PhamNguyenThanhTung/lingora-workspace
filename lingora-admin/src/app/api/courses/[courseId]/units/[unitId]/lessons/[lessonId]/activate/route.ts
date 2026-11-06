import { cookies } from 'next/headers.js';
import {
  verifyStaffIdentity,
  validateSameOrigin,
  buildAuthResponseHeaders,
} from '../../../../../../../../../server/auth/index.ts';
import {
  isValidUuid,
  activateLesson,
} from '../../../../../../../../../server/lessons/index.ts';

export const dynamic = 'force-dynamic';

class BodyTooLarge extends Error {}
async function readJsonBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing body');
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 1024 * 1024) {
        await reader.cancel();
        throw new BodyTooLarge();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(body));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string; unitId: string; lessonId: string }> }
) {
  const defaultHeaders = { 'Cache-Control': 'no-store, private' };
  const refreshedHeaders = new Headers();

  if (!validateSameOrigin(request)) {
    return Response.json(
      {
        error: {
          code: 'FORBIDDEN_ORIGIN',
          message: 'Yêu cầu bị từ chối do nguồn gốc (Origin) không hợp lệ.',
        },
      },
      {
        status: 403,
        headers: defaultHeaders,
      }
    );
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return Response.json(
      {
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Yêu cầu phải có tiêu đề Content-Type là application/json.',
        },
      },
      {
        status: 415,
        headers: defaultHeaders,
      }
    );
  }

  const { courseId, unitId, lessonId } = await params;
  if (!isValidUuid(courseId) || !isValidUuid(unitId) || !isValidUuid(lessonId)) {
    return Response.json(
      {
        error: {
          code: 'INVALID_ID',
          message: 'Mã định danh không đúng định dạng UUID.',
        },
      },
      {
        status: 400,
        headers: defaultHeaders,
      }
    );
  }

  const cookieStore = await cookies();
  const authResult = await verifyStaffIdentity({
    cookieStore,
    requiredRole: 'ADMIN',
    responseHeaders: refreshedHeaders,
  });

  const responseHeaders = buildAuthResponseHeaders(defaultHeaders);
  refreshedHeaders.forEach((val, key) => {
    responseHeaders.set(key, val);
  });

  if (!authResult.ok) {
    return Response.json(
      { error: authResult.error },
      {
        status: authResult.status,
        headers: responseHeaders,
      }
    );
  }

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (err) {
    if (err instanceof BodyTooLarge) {
      return Response.json(
        {
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message: 'Dung lượng yêu cầu vượt quá giới hạn 1 MiB.',
          },
        },
        {
          status: 400,
          headers: responseHeaders,
        }
      );
    }
    return Response.json(
      {
        error: {
          code: 'MALFORMED_JSON',
          message: 'Dữ liệu yêu cầu không phải là JSON hợp lệ.',
        },
      },
      {
        status: 400,
        headers: responseHeaders,
      }
    );
  }

  const result = await activateLesson(authResult.account.id, courseId, unitId, lessonId, body);
  if (result.error) {
    return Response.json(
      { error: result.error },
      {
        status: result.status,
        headers: responseHeaders,
      }
    );
  }

  return Response.json(result.data, {
    status: 200,
    headers: responseHeaders,
  });
}
