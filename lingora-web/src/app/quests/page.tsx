import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LearnerShell } from '../../components/learner/LearnerShell.tsx';
import { loadLearnerHomeRemembering } from '../../components/learner/load-shell.ts';
import { toShellData } from '../../components/learner/helpers.ts';
import { QuestsView } from './QuestsView';

export const dynamic = 'force-dynamic';

export default async function QuestsPage(props?: {
  searchParams?: Promise<{ contextId?: string }>;
}) {
  const cookieStore = await cookies();
  const searchParams = props?.searchParams ? await props.searchParams : undefined;
  const result = await loadLearnerHomeRemembering(cookieStore, searchParams?.contextId);

  if (!result.ok) {
    if (result.status === 401) redirect('/login');
    return <QuestsView errorMessage={result.error.message} />;
  }

  const shell = toShellData(result.data);
  return (
    <LearnerShell shell={shell} active="quests" quests={false}>
      <QuestsView shell={shell} />
    </LearnerShell>
  );
}
