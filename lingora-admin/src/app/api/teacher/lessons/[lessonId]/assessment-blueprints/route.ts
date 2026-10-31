import { runAssessmentApi } from '../../../../../../server/assessments/http.ts';
import { listTeacherAssessmentBlueprints } from '../../../../../../server/assessments/teacher-items.ts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return runAssessmentApi(request, { role: 'TEACHER', action: (accountId) => listTeacherAssessmentBlueprints(accountId, lessonId) });
}
