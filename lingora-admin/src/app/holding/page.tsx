import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyStaffIdentity } from '@/server/auth';
import { TeacherHoldingView } from './TeacherHoldingView';
import { ServiceUnavailableView } from '@/components/ServiceUnavailableView';
import { AccessDeniedView } from '@/components/AccessDeniedView';

export const dynamic = 'force-dynamic';

export default async function HoldingPage() {
  const cookieStore = await cookies();
  const authResult = await verifyStaffIdentity({
    cookieStore,
    requiredRole: 'TEACHER',
  });

  if (!authResult.ok) {
    if (authResult.status === 401) {
      redirect('/login');
    }
    if (authResult.status === 503) {
      return (
        <ServiceUnavailableView
          message={authResult.error.message}
          onRetryHref="/holding"
        />
      );
    }
    return (
      <AccessDeniedView
        message={authResult.error.message}
      />
    );
  }

  // Active Admin visiting /holding navigates straight to /languages
  if (authResult.account.role === 'ADMIN') {
    redirect('/languages');
  }

  return (
    <TeacherHoldingView
      displayName={authResult.account.displayName}
      accountId={authResult.account.id}
    />
  );
}
