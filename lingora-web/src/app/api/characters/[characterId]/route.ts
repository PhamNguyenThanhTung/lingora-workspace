import { cookies } from 'next/headers.js';
import { verifyLearnerIdentity, buildAuthResponseHeaders } from '../../../../server/auth/index.ts';
import { loadLearnerCharacterDetail } from '../../../../server/lessons/character-service.ts';
import { LessonServiceError } from '../../../../server/lessons/dto.ts';

export const dynamic = 'force-dynamic';

const ALLOWED_QUERY_PARAMS = new Set([
  'contextId',
  'lessonId',
  'blockKey',
  'lessonVocabularyLinkId',
  'expectedPublishedRevisionId',
]);

export async function GET(
  request: Request,
  context: { params: Promise<{ characterId: string }> | { characterId: string } }
) {
  const defaultHeaders = { 'Cache-Control': 'no-store, private' };

  const url = new URL(request.url);

  // Validate allowed query parameters
  for (const paramKey of url.searchParams.keys()) {
    if (!ALLOWED_QUERY_PARAMS.has(paramKey)) {
      return Response.json(
        {
          error: {
            code: 'INVALID_QUERY_PARAMETERS',
            message: `Tham số truy vấn '${paramKey}' không được hỗ trợ.`,
          },
        },
        { status: 400, headers: defaultHeaders }
      );
    }
  }

  const { characterId } = await context.params;

  const contextId = url.searchParams.get('contextId') || '';
  const lessonId = url.searchParams.get('lessonId') || '';
  const blockKey = url.searchParams.get('blockKey');
  const lessonVocabularyLinkId = url.searchParams.get('lessonVocabularyLinkId');
  const expectedPublishedRevisionId = url.searchParams.get('expectedPublishedRevisionId');

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
    const data = await loadLearnerCharacterDetail({
      characterId,
      contextId,
      lessonId,
      blockKey,
      lessonVocabularyLinkId,
      expectedPublishedRevisionId,
      verifiedUserId: verified.user.id,
    });

    return Response.json({ data }, { status: 200, headers: responseHeaders });
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
