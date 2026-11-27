import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyLearnerIdentity } from '../../../server/auth/index.ts';
import { loadLearnerCatalogue } from '../../../server/lessons/service.ts';
import { LessonServiceError } from '../../../server/lessons/dto.ts';
import { LearnerShell } from '../../../components/learner/LearnerShell.tsx';
import { loadShellData } from '../../../components/learner/load-shell.ts';
import { CatalogueView } from './CatalogueView';

export const dynamic = 'force-dynamic';

export default async function CataloguePage(props: {
  params: Promise<{ contextId: string }> | { contextId: string };
}) {
  const { contextId } = await props.params;
  const cookieStore = await cookies();

  const verified = await verifyLearnerIdentity({ cookieStore });
  if (!verified.ok) {
    if (verified.status === 401) {
      redirect('/login');
    }
    return <CatalogueView errorState={{ status: verified.status, error: verified.error }} />;
  }

  try {
    const data = await loadLearnerCatalogue(contextId, verified.user.id);
    const shell = await loadShellData(cookieStore, contextId);
    const view = <CatalogueView data={data} />;
    return shell ? (
      <LearnerShell shell={shell} active="home">
        {view}
      </LearnerShell>
    ) : (
      view
    );
  } catch (err: unknown) {
    if (err instanceof LessonServiceError) {
      return <CatalogueView errorState={{ status: err.status, error: err.error }} />;
    }
    return (
      <CatalogueView
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
