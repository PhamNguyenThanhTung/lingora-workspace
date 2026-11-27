import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loadLearnerHomeRemembering } from '../../components/learner/load-shell.ts';
import { LearnerShell } from '../../components/learner/LearnerShell.tsx';
import { toShellData } from '../../components/learner/helpers.ts';
import { HomeView } from './HomeView';

export const dynamic = 'force-dynamic';

export default async function HomePage(props?: {
  searchParams?: Promise<{ contextId?: string }>;
}) {
  const cookieStore = await cookies();
  const searchParams = props?.searchParams ? await props.searchParams : undefined;
  const result = await loadLearnerHomeRemembering(cookieStore, searchParams?.contextId);

  if (!result.ok) {
    if (result.status === 401) {
      redirect('/login');
    }
    return <HomeView errorState={result} />;
  }

  return (
    <LearnerShell shell={toShellData(result.data)} active="home">
      <HomeView data={result.data} />
    </LearnerShell>
  );
}
