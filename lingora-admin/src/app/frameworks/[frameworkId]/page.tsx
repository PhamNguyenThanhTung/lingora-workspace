import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { verifyStaffIdentity } from '@/server/auth';
import { getFramework, isValidUuid } from '@/server/frameworks';
import { listLevels } from '@/server/levels';
import { AppShell } from '@/components/AppShell';
import { LevelsCatalog } from '@/components/LevelsCatalog';
import { AccessDeniedView } from '@/components/AccessDeniedView';
import { ServiceUnavailableView } from '@/components/ServiceUnavailableView';

export const dynamic = 'force-dynamic';

export default async function FrameworkDetailPage({
  params,
}: {
  params: Promise<{ frameworkId: string }>;
}) {
  const { frameworkId } = await params;
  if (!isValidUuid(frameworkId)) {
    notFound();
  }

  const cookieStore = await cookies();
  const authResult = await verifyStaffIdentity({
    cookieStore,
    requiredRole: 'ANY',
  });

  if (!authResult.ok) {
    if (authResult.status === 401) {
      redirect('/login');
    }
    if (authResult.status === 503) {
      return (
        <ServiceUnavailableView
          message={authResult.error.message}
          onRetryHref={`/frameworks/${frameworkId}`}
        />
      );
    }
    return (
      <AccessDeniedView
        message={authResult.error.message}
      />
    );
  }

  // Teacher safe boundary: redirect to holding view
  if (authResult.account.role === 'TEACHER') {
    redirect('/holding');
  }

  // Ensure active admin
  if (authResult.account.role !== 'ADMIN' || authResult.account.status !== 'ACTIVE') {
    return (
      <AccessDeniedView
        message="Bạn không có quyền quản trị danh mục khung năng lực."
        accountId={authResult.account.id}
      />
    );
  }

  // Fetch parent framework
  const fwResult = await getFramework(frameworkId);
  if (fwResult.status === 503 || (fwResult.error && fwResult.status !== 404 && fwResult.status !== 400)) {
    return (
      <ServiceUnavailableView
        message={fwResult.error?.message || 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.'}
        onRetryHref={`/frameworks/${frameworkId}`}
      />
    );
  }

  if (fwResult.status === 404 || fwResult.status === 400 || !fwResult.data?.data) {
    notFound();
  }

  const framework = fwResult.data.data;

  // Fetch child levels
  const lvlResult = await listLevels(frameworkId);
  const initialLevels = lvlResult.data?.data;
  const initialError = lvlResult.error ? lvlResult.error.message : null;

  return (
    <AppShell account={authResult.account}>
      <LevelsCatalog
        framework={framework}
        initialLevels={initialLevels}
        initialError={initialError}
        account={authResult.account}
      />
    </AppShell>
  );
}
