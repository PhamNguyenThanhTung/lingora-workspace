import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loadLearnerContext } from '../../server/context/loader.ts';
import { OnboardingWizardView } from './OnboardingWizardView';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const result = await loadLearnerContext(cookieStore);

  if (!result.ok) {
    if (result.status === 401) {
      redirect('/login');
    }
    redirect('/home');
  }

  return (
    <OnboardingWizardView
      key={result.data.learner.id}
      learner={result.data.learner}
      existingContexts={result.data.contexts}
    />
  );
}
