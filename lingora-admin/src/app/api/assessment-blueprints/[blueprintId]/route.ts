import { runAssessmentApi } from '../../../../server/assessments/http.ts';
import { deleteBlueprint, getBlueprint, updateBlueprint } from '../../../../server/assessments/blueprint.ts';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ blueprintId: string }> };

export async function GET(request: Request, { params }: Context) {
  const { blueprintId } = await params;
  return runAssessmentApi(request, { role: 'ADMIN', action: (accountId) => getBlueprint(accountId, blueprintId) });
}

export async function PATCH(request: Request, { params }: Context) {
  const { blueprintId } = await params;
  return runAssessmentApi(request, {
    role: 'ADMIN', mutating: true, readsJson: true,
    action: (accountId, body) => updateBlueprint(accountId, blueprintId, body),
  });
}

export async function DELETE(request: Request, { params }: Context) {
  const { blueprintId } = await params;
  return runAssessmentApi(request, {
    role: 'ADMIN', mutating: true,
    action: (accountId) => deleteBlueprint(accountId, blueprintId),
  });
}
