import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LearnerShell } from '../../components/learner/LearnerShell.tsx';
import { loadLearnerHomeRemembering } from '../../components/learner/load-shell.ts';
import { toShellData } from '../../components/learner/helpers.ts';

export const dynamic = 'force-dynamic';

/**
 * "Luyện viết" hub. Stroke practice itself is launched from a lesson's character blocks
 * (WritingPracticeModal), so this page explains that and routes the learner to their path
 * instead of 404-ing from the sidebar link.
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
  return (
    <LearnerShell shell={shell} active="write" quests={false}>
      <div id="writeView">
        <h1 style={{ fontSize: 'var(--font-size-title)', fontWeight: 800, marginBottom: 14 }}>Luyện viết</h1>
        <p style={{ marginBottom: 14 }}>
          Luyện viết chữ (kana, Hán tự) được mở ngay trong bài học: khi bài có chữ cần tập, bấm vào chữ để xem nét và tập viết theo.
          Chưa có bài nào trong lộ trình hiện tại có chữ để luyện viết.
        </p>
        <a href="/home" className="btn btn-primary" style={{ textDecoration: 'none' }}>Về lộ trình học</a>
      </div>
    </LearnerShell>
  );
}
