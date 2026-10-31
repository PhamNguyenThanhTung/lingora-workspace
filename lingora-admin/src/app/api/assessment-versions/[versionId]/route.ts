import { runAssessmentApi } from '../../../../server/assessments/http.ts';
import { getAssessmentVersion } from '../../../../server/assessments/assembly.ts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params;
  return runAssessmentApi(request, { role: 'ADMIN', action: (accountId) => getAssessmentVersion(accountId, versionId) });
}
