import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyLearnerIdentity } from '../../../../server/auth/index.ts';
import { loadLearnerLessonDetail } from '../../../../server/lessons/service.ts';
import { LessonServiceError } from '../../../../server/lessons/dto.ts';
import { LessonPlayerView } from './LessonPlayerView';

export const dynamic = 'force-dynamic';

export default async function LessonPlayerPage(props: {
  params: Promise<{ contextId: string; lessonId: string }> | { contextId: string; lessonId: string };
}) {
  const { contextId, lessonId } = await props.params;
  const cookieStore = await cookies();

  const verified = await verifyLearnerIdentity({ cookieStore });
  if (!verified.ok) {
    if (verified.status === 401) {
      redirect('/login');
    }
    return <LessonPlayerView errorState={{ status: verified.status, error: verified.error }} />;
  }

  try {
    const data = await loadLearnerLessonDetail(contextId, lessonId, verified.user.id);
    return <LessonPlayerView data={data} />;
  } catch (err: unknown) {
    if (err instanceof LessonServiceError) {
      return <LessonPlayerView errorState={{ status: err.status, error: err.error }} />;
    }
    return (
      <LessonPlayerView
        errorState={{
          status: 503,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
          },
        }}
      />
    );
  }
}
