import { cookies } from 'next/headers.js';
import { redirect } from 'next/navigation';
import { verifyLearnerIdentity } from '../../server/auth/index.ts';
import { ReviewView } from './ReviewView';

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  const cookieStore = await cookies();
  const verified = await verifyLearnerIdentity({ cookieStore });

  if (!verified.ok) {
    if (verified.status === 401) {
      redirect('/login');
    }
    return <ReviewView authError={verified.error.message} />;
  }

  return <ReviewView learner={verified.user} />;
}
