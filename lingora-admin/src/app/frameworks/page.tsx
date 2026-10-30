import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyStaffIdentity } from '@/server/auth';
import { listFrameworks } from '@/server/frameworks';
import { AppShell } from '@/components/AppShell';
import { FrameworksCatalog } from '@/components/FrameworksCatalog';
import { AccessDeniedView } from '@/components/AccessDeniedView';
import { ServiceUnavailableView } from '@/components/ServiceUnavailableView';

export const dynamic = 'force-dynamic';

export default async function FrameworksPage() {
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
          onRetryHref="/frameworks"
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

  // Initial catalogue fetch
  const result = await listFrameworks();
  const initialFrameworks = result.data?.data;
  const initialError = result.error ? result.error.message : null;

  return (
    <AppShell account={authResult.account}>
      <FrameworksCatalog
        initialFrameworks={initialFrameworks}
        initialError={initialError}
        account={authResult.account}
      />
    </AppShell>
  );
}
