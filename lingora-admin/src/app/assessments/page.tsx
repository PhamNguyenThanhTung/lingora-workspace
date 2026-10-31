import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyStaffIdentity } from '@/server/auth';
import { AppShell } from '@/components/AppShell';
import { AssessmentCatalog } from '@/components/AssessmentCatalog';
import { AccessDeniedView } from '@/components/AccessDeniedView';

export const dynamic = 'force-dynamic';

export default async function AssessmentsPage() {
  const authResult = await verifyStaffIdentity({ cookieStore: await cookies(), requiredRole: 'ANY' });
  if (!authResult.ok) {
    if (authResult.status === 401) redirect('/login');
    return <AccessDeniedView message={authResult.error.message} />;
  }
  if (authResult.account.role === 'TEACHER') redirect('/holding');
  if (authResult.account.role !== 'ADMIN' || authResult.account.status !== 'ACTIVE') {
    return <AccessDeniedView message="Chỉ quản trị viên đang hoạt động mới có quyền quản lý đánh giá." accountId={authResult.account.id} />;
  }
  return <AppShell account={authResult.account}><AssessmentCatalog /></AppShell>;
}
