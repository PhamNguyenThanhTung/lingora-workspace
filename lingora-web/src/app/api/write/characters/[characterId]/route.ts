import { loadFreePracticeCharacter } from '../../../../../server/writing/free-practice-service.ts';
import { withLearner } from '../../_http.ts';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ characterId: string }> | { characterId: string } }
) {
  const url = new URL(request.url);
  for (const key of url.searchParams.keys()) {
    if (key !== 'contextId') {
      return Response.json(
        { error: { code: 'INVALID_QUERY_PARAMETERS', message: `Tham số truy vấn '${key}' không được hỗ trợ.` } },
        { status: 400, headers: { 'Cache-Control': 'no-store, private' } }
      );
    }
  }
  const { characterId } = await context.params;
  const contextId = url.searchParams.get('contextId') || '';
  return withLearner(async (userId) => ({ status: 200, data: await loadFreePracticeCharacter(contextId, characterId, userId) }));
}
