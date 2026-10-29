import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyStaffIdentity } from '@/server/auth';
import { listLanguages } from '@/server/languages';
import { AppShell } from '@/components/AppShell';
import { LanguagesCatalog } from '@/components/LanguagesCatalog';
import { AccessDeniedView } from '@/components/AccessDeniedView';
import { ServiceUnavailableView } from '@/components/ServiceUnavailableView';

export const dynamic = 'force-dynamic';

export default async function LanguagesPage() {
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
          onRetryHref="/languages"
        />
      );
    }
    return (
      <AccessDeniedView
        message={authResult.error.message}
      />
    );
  }

  // Teacher safe boundary: redirect to holding view, never 403 or redirect loop
  if (authResult.account.role === 'TEACHER') {
    redirect('/holding');
  }

  // Ensure active admin
  if (authResult.account.role !== 'ADMIN' || authResult.account.status !== 'ACTIVE') {
    return (
      <AccessDeniedView
        message="Bạn không có quyền quản trị danh mục ngôn ngữ."
        accountId={authResult.account.id}
      />
    );
  }

  // Initial catalogue fetch
  const langResult = await listLanguages();
  const initialLanguages = langResult.data?.data;
  const initialError = langResult.error ? langResult.error.message : null;

  return (
    <AppShell account={authResult.account}>
      <LanguagesCatalog
        initialLanguages={initialLanguages}
        initialError={initialError}
        account={authResult.account}
      />
    </AppShell>
  );
}
