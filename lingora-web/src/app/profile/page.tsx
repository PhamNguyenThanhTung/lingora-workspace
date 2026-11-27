import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LearnerShell } from '../../components/learner/LearnerShell.tsx';
import { loadLearnerHomeRemembering } from '../../components/learner/load-shell.ts';
import { toShellData } from '../../components/learner/helpers.ts';
import { ProfileView } from './ProfileView';

export const dynamic = 'force-dynamic';

export default async function ProfilePage(props?: {
  searchParams?: Promise<{ contextId?: string }>;
}) {
  const cookieStore = await cookies();
  const searchParams = props?.searchParams ? await props.searchParams : undefined;
  const result = await loadLearnerHomeRemembering(cookieStore, searchParams?.contextId);

  if (!result.ok) {
    if (result.status === 401) redirect('/login');
    return <ProfileView errorMessage={result.error.message} />;
  }

  return (
    <LearnerShell shell={toShellData(result.data)} active="profile" quests={false}>
      <ProfileView data={result.data} />
    </LearnerShell>
  );
}
