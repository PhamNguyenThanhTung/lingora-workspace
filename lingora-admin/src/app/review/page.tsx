import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyStaffIdentity } from '@/server/auth';
import { getReviewQueue } from '@/server/lessons/workflow';
import { AppShell } from '@/components/AppShell';
import { ReviewQueueCatalog } from '@/components/ReviewQueueCatalog';
import { AccessDeniedView } from '@/components/AccessDeniedView';
import { ServiceUnavailableView } from '@/components/ServiceUnavailableView';

export const dynamic = 'force-dynamic';

export default async function ReviewQueuePage() {
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
          onRetryHref="/review"
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
        message="Chỉ quản trị viên đang hoạt động mới có quyền truy cập hàng đợi kiểm duyệt."
        accountId={authResult.account.id}
      />
    );
  }

  const result = await getReviewQueue(authResult.account.id);
  const initialQueue = result.data?.data || [];
  const initialError = result.error ? result.error.message : null;

  return (
    <AppShell account={authResult.account}>
      <ReviewQueueCatalog
        initialQueue={initialQueue}
        initialError={initialError}
        account={authResult.account}
      />
    </AppShell>
  );
}
