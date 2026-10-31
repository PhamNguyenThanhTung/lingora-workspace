import { runAssessmentApi } from '../../../server/assessments/http.ts';
import { createBlueprint, listBlueprints } from '../../../server/assessments/blueprint.ts';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  return runAssessmentApi(request, { role: 'ADMIN', action: (accountId) => listBlueprints(accountId) });
}

export function POST(request: Request) {
  return runAssessmentApi(request, {
    role: 'ADMIN', mutating: true, readsJson: true,
    action: (accountId, body) => createBlueprint(accountId, body),
  });
}
