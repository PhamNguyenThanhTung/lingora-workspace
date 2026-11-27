import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LearnerShell } from '../../components/learner/LearnerShell.tsx';
import { loadLearnerHomeRemembering } from '../../components/learner/load-shell.ts';
import { toShellData } from '../../components/learner/helpers.ts';
import { listFreePracticeCharacters } from '../../server/writing/free-practice-service.ts';
import { WriteHub } from './WriteHub.tsx';

export const dynamic = 'force-dynamic';

/**
 * "Luyện viết": standalone stroke practice over the kana / kanji / hanzi of the selected path's language,
 * independent of lessons (free-practice sessions, see server/writing/free-practice-service.ts).
 */
export default async function WritePage(props?: { searchParams?: Promise<{ contextId?: string }> }) {
  const cookieStore = await cookies();
  const searchParams = props?.searchParams ? await props.searchParams : undefined;
  const result = await loadLearnerHomeRemembering(cookieStore, searchParams?.contextId);

  if (!result.ok) {
    if (result.status === 401) redirect('/login');
    return (
      <main className="content-area">
        <div id="errorBox" className="alert-box is-warning" role="alert">
          <h1 className="alert-title warning">Không thể tải trang luyện viết</h1>
          <p className="alert-message">{result.error.message}</p>
          <div className="alert-actions">
            <a href="/home" className="btn btn-primary" style={{ textDecoration: 'none' }}>Về trang chủ</a>
          </div>
        </div>
      </main>
    );
  }

  const shell = toShellData(result.data);
  const contextId = shell.selectedContextId;
  let characters: Awaited<ReturnType<typeof listFreePracticeCharacters>> = [];
  let loadError: string | null = null;
  if (contextId) {
    try {
      characters = await listFreePracticeCharacters(contextId, result.data.learner.id);
    } catch (err: any) {
      loadError = err?.error?.message || err?.message || 'Không thể tải danh sách chữ.';
    }
  }

  return (
    <LearnerShell shell={shell} active="write" quests={false}>
      {loadError ? (
        <div className="alert-box is-warning" role="alert">
          <p className="alert-message">{loadError}</p>
        </div>
      ) : contextId && characters.length > 0 ? (
        <WriteHub contextId={contextId} characters={characters} />
      ) : (
        <div id="writeView">
          <h1 style={{ fontSize: 'var(--font-size-title)', fontWeight: 800, marginBottom: 14 }}>Luyện viết</h1>
          <p style={{ marginBottom: 14 }}>Lộ trình này chưa có chữ để luyện viết (Luyện viết hiện dành cho tiếng Nhật và tiếng Trung).</p>
          <a href="/home" className="btn btn-primary" style={{ textDecoration: 'none' }}>Về lộ trình học</a>
        </div>
      )}
    </LearnerShell>
  );
}
