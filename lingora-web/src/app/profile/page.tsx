import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LearnerShell } from '../../components/learner/LearnerShell.tsx';
import { loadLearnerHomeRemembering } from '../../components/learner/load-shell.ts';
import { toShellData } from '../../components/learner/helpers.ts';
import { loadLearnerProfile } from '../../server/profile/service.ts';
import { ContextServiceError } from '../../server/context/dto.ts';
import type { LearnerProfileDto } from '../../server/profile/dto.ts';
import { ProfileView } from './ProfileView';

export const dynamic = 'force-dynamic';

export default async function ProfilePage(props?: {
  searchParams?: Promise<{ contextId?: string }>;
}) {
  const cookieStore = await cookies();
  const searchParams = props?.searchParams ? await props.searchParams : undefined;
  const home = await loadLearnerHomeRemembering(cookieStore, searchParams?.contextId);

  if (!home.ok) {
    if (home.status === 401) redirect('/login');
    return <ProfileView errorMessage={home.error.message} />;
  }

  let profile: LearnerProfileDto | null = null;
  let errorMessage = 'Không thể tải hồ sơ. Vui lòng thử lại sau.';
  try {
    const result = await loadLearnerProfile(cookieStore);
    if (result.ok) profile = result.data;
    else if (result.status === 401) redirect('/login');
    else errorMessage = result.error.message;
  } catch (error) {
    if (error instanceof ContextServiceError) errorMessage = error.message;
  }

  const shell = toShellData(home.data);
  return (
    <LearnerShell shell={shell} active="profile" quests={false}>
      {profile ? (
        <ProfileView profile={profile} today={home.data.streak.today ?? null} />
      ) : (
        <ProfileView errorMessage={errorMessage} />
      )}
    </LearnerShell>
  );
}
