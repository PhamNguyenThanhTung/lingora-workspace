import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loadLearnerHome } from '../../../../server/context/home-loader.ts';
import { LearnerShell } from '../../../../components/learner/LearnerShell.tsx';
import { toShellData } from '../../../../components/learner/helpers.ts';
import { SectionsView } from './SectionsView';

export const dynamic = 'force-dynamic';

export default async function SectionsPage(props: {
  params: Promise<{ contextId: string }> | { contextId: string };
}) {
  const { contextId } = await props.params;
  const cookieStore = await cookies();
  const result = await loadLearnerHome(cookieStore, { contextId });

  if (!result.ok) {
    if (result.status === 401) redirect('/login');
    return <SectionsView errorMessage={result.error.message} />;
  }

  return (
    <LearnerShell shell={toShellData(result.data)} active="home" quests={false}>
      <SectionsView data={result.data} />
    </LearnerShell>
  );
}
