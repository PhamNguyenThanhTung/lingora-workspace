import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loadLearnerHome } from '../../server/context/home-loader.ts';
import { HomeView } from './HomeView';

export const dynamic = 'force-dynamic';

export default async function HomePage(props?: {
  searchParams?: Promise<{ contextId?: string }>;
}) {
  const cookieStore = await cookies();
  const searchParams = props?.searchParams ? await props.searchParams : undefined;
  const result = await loadLearnerHome(cookieStore, {
    contextId: searchParams?.contextId,
  });

  if (!result.ok) {
    if (result.status === 401) {
      redirect('/login');
    }
    return <HomeView errorState={result} />;
  }

  return <HomeView data={result.data} />;
}
