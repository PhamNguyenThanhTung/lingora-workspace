import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loadLearnerContext } from '../../server/context/loader.ts';
import { HomeView } from './HomeView';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const cookieStore = await cookies();
  const result = await loadLearnerContext(cookieStore);

  if (!result.ok) {
    if (result.status === 401) {
      redirect('/login');
    }
    return <HomeView errorState={result} />;
  }

  return <HomeView data={result.data} />;
}
