import { cookies } from 'next/headers.js';
import { redirect } from 'next/navigation';
import { verifyLearnerIdentity } from '../../server/auth/index.ts';
import { isValidUuid } from '../../server/context/dto.ts';
import { listReviewContextOptions } from '../../server/srs/review-options.ts';
import { ReviewView } from './ReviewView';

export const dynamic = 'force-dynamic';

export default async function ReviewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const cookieStore = await cookies();
  const verified = await verifyLearnerIdentity({ cookieStore });

  if (!verified.ok) {
    if (verified.status === 401) {
      redirect('/login');
    }
    return <ReviewView authError={verified.error.message} />;
  }

  // G11: a review session covers exactly one language, so the page needs the learner's
  // active contexts (one per language) and their due counts before starting.
  const contexts = await listReviewContextOptions(verified.user.id);

  const params = searchParams ? await searchParams : undefined;
  const requested = Array.isArray(params?.contextId) ? params?.contextId[0] : params?.contextId;
  const preselectedContextId =
    requested && isValidUuid(requested) && contexts.some(option => option.contextId === requested.toLowerCase())
      ? requested.toLowerCase()
      : null;

  return (
    <ReviewView
      learner={verified.user}
      contexts={contexts}
      preselectedContextId={preselectedContextId}
    />
  );
}
