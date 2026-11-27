import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyStaffIdentity } from '@/server/auth';
import { listLanguages } from '@/server/languages';
import { listCharacterCatalogue } from '@/server/characters';
import { AppShell } from '@/components/AppShell';
import { CharacterCatalogue } from '@/components/CharacterCatalogue';
import { AccessDeniedView } from '@/components/AccessDeniedView';
import { ServiceUnavailableView } from '@/components/ServiceUnavailableView';

export const dynamic = 'force-dynamic';

export default async function CharactersPage() {
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
          onRetryHref="/characters"
        />
      );
    }
    return <AccessDeniedView message={authResult.error.message} />;
  }

  // Teacher safe boundary: redirect to holding view
  if (authResult.account.role === 'TEACHER') {
    redirect('/holding');
  }

  // Ensure active admin
  if (authResult.account.role !== 'ADMIN' || authResult.account.status !== 'ACTIVE') {
    return (
      <AccessDeniedView
        message="Bạn không có quyền quản trị danh mục ký tự."
        accountId={authResult.account.id}
      />
    );
  }

  const [langResult, charResult] = await Promise.all([
    listLanguages(),
    listCharacterCatalogue({ limit: 20, offset: 0 }),
  ]);

  if (
    langResult.status === 503 ||
    charResult.status === 503
  ) {
    return (
      <ServiceUnavailableView
        message={
          charResult.error?.message ||
          langResult.error?.message ||
          'Cơ sở dữ liệu tạm thời không phản hồi.'
        }
        onRetryHref="/characters"
        accountId={authResult.account.id}
      />
    );
  }

  const initialLanguages = langResult.data?.data ?? [];
  const initialCharacters = charResult.data?.data ?? [];
  const initialTotal = charResult.data?.total ?? 0;
  const initialLimit = charResult.data?.limit ?? 20;
  const initialOffset = charResult.data?.offset ?? 0;
  const initialError = charResult.error?.message || langResult.error?.message || null;

  return (
    <AppShell account={authResult.account}>
      <CharacterCatalogue
        initialCharacters={initialCharacters}
        initialTotal={initialTotal}
        initialLimit={initialLimit}
        initialOffset={initialOffset}
        initialLanguages={initialLanguages}
        initialError={initialError}
        account={authResult.account}
      />
    </AppShell>
  );
}
