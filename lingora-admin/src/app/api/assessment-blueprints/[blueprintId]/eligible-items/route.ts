import { runAssessmentApi } from '../../../../../server/assessments/http.ts';
import { listEligibleItems } from '../../../../../server/assessments/assembly.ts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ blueprintId: string }> }) {
  const { blueprintId } = await params;
  return runAssessmentApi(request, { role: 'ADMIN', action: (accountId) => listEligibleItems(accountId, blueprintId) });
}
