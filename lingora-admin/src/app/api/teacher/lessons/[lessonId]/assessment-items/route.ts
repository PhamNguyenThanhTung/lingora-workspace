import { runAssessmentApi } from '../../../../../../server/assessments/http.ts';
import { listTeacherAssessmentItems, saveTeacherAssessmentItem } from '../../../../../../server/assessments/teacher-items.ts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return runAssessmentApi(request, { role: 'TEACHER', action: (accountId) => listTeacherAssessmentItems(accountId, lessonId) });
}

export async function POST(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return runAssessmentApi(request, {
    role: 'TEACHER', mutating: true, readsJson: true,
    action: (accountId, body) => saveTeacherAssessmentItem(accountId, lessonId, body),
  });
}
