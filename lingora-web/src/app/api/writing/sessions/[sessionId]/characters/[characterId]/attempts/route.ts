import { POST as postWritingAttempt } from '../../../attempts/route.ts';

export const dynamic = 'force-dynamic';

export function POST(
  request: Request,
  context: {
    params:
      | Promise<{ sessionId: string; characterId: string }>
      | { sessionId: string; characterId: string };
  }
) {
  return postWritingAttempt(request, context);
}
