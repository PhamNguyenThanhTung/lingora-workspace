import { runAssessmentApi } from '../../../../../server/assessments/http.ts';
import { assembleAssessmentVersion, listAssessmentVersions } from '../../../../../server/assessments/assembly.ts';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ blueprintId: string }> };

export async function GET(request: Request, { params }: Context) {
  const { blueprintId } = await params;
  return runAssessmentApi(request, { role: 'ADMIN', action: (accountId) => listAssessmentVersions(accountId, blueprintId) });
}

export async function POST(request: Request, { params }: Context) {
  const { blueprintId } = await params;
  return runAssessmentApi(request, {
    role: 'ADMIN', mutating: true, readsJson: true,
    action: (accountId, body) => assembleAssessmentVersion(accountId, blueprintId, body),
  });
}
