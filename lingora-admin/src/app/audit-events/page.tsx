import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyStaffIdentity } from '@/server/auth';
import { listAuditEvents, computeDefaultAuditBounds } from '@/server/audit';
import { AppShell } from '@/components/AppShell';
import { AuditEventsCatalog } from '@/components/AuditEventsCatalog';
import { AccessDeniedView } from '@/components/AccessDeniedView';
import { ServiceUnavailableView } from '@/components/ServiceUnavailableView';

export const dynamic = 'force-dynamic';

export default async function AuditEventsPage() {
  const cookieStore = await cookies();
  const authResult = await verifyStaffIdentity({
    cookieStore,
    requiredRole: 'ADMIN',
  });

  if (!authResult.ok) {
    if (authResult.status === 401) {
      redirect('/login');
    }
    if (authResult.status === 503) {
      return (
        <ServiceUnavailableView
          message={authResult.error.message}
          onRetryHref="/audit-events"
        />
      );
    }
    return <AccessDeniedView message={authResult.error.message} />;
  }

  if (authResult.account.role !== 'ADMIN' || authResult.account.status !== 'ACTIVE') {
    return (
      <AccessDeniedView
        message="Bạn không có quyền xem nhật ký hoạt động."
        accountId={authResult.account.id}
      />
    );
  }

  const auditResult = await listAuditEvents();
  if (!auditResult.ok && auditResult.status === 503) {
    return (
      <ServiceUnavailableView
        message={auditResult.error?.message || 'Cơ sở dữ liệu tạm thời không phản hồi.'}
        onRetryHref="/audit-events"
        accountId={authResult.account.id}
      />
    );
  }

  const defaultBounds = computeDefaultAuditBounds();
  const initialData = auditResult.ok ? auditResult.data : [];
  const initialFilters = auditResult.ok
    ? auditResult.filters
    : {
        from: defaultBounds.from,
        to: defaultBounds.to,
        action: null,
        outcome: null,
      };
  const initialNextCursor = auditResult.ok ? auditResult.nextCursor : null;
  const initialError = auditResult.ok ? null : (auditResult.error?.message || 'Không thể tải nhật ký hoạt động.');

  return (
    <AppShell account={authResult.account}>
      <AuditEventsCatalog
        initialData={initialData}
        initialFilters={initialFilters}
        initialNextCursor={initialNextCursor}
        initialError={initialError}
        account={authResult.account}
      />
    </AppShell>
  );
}
