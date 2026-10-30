import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { verifyStaffIdentity } from '@/server/auth';
import { getTeacherLessonDetail, isValidUuid } from '@/server/lessons';
import { AppShell } from '@/components/AppShell';
import { LessonDraftEditor } from '@/components/LessonDraftEditor';
import { AccessDeniedView } from '@/components/AccessDeniedView';
import { ServiceUnavailableView } from '@/components/ServiceUnavailableView';

export const dynamic = 'force-dynamic';

export default async function TeacherLessonDetailPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  if (!isValidUuid(lessonId)) {
    notFound();
  }

  const cookieStore = await cookies();
  const authResult = await verifyStaffIdentity({
    cookieStore,
    requiredRole: 'TEACHER',
  });

  if (!authResult.ok) {
    if (authResult.status === 401) {
      redirect('/login');
    }
    if (authResult.status === 503) {
      return (
        <ServiceUnavailableView
          message={authResult.error.message}
          onRetryHref={`/my-lessons/${lessonId}`}
        />
      );
    }
    return (
      <AccessDeniedView
        message={authResult.error.message}
      />
    );
  }

  if (authResult.account.role !== 'TEACHER') {
    return (
      <AccessDeniedView
        message="Chỉ giáo viên mới có quyền truy cập bài học này."
        accountId={authResult.account.id}
      />
    );
  }

  if (authResult.account.status !== 'ACTIVE') {
    return (
      <AccessDeniedView
        message="Tài khoản giáo viên đang chờ duyệt hoặc đã bị vô hiệu hóa."
        accountId={authResult.account.id}
      />
    );
  }

  const result = await getTeacherLessonDetail(authResult.account.id, lessonId);
  if (result.status === 503) {
    return (
      <ServiceUnavailableView
        message={result.error?.message || 'Không thể tải thông tin bài học.'}
        onRetryHref={`/my-lessons/${lessonId}`}
      />
    );
  }

  if (result.status === 404 || !result.data?.data) {
    notFound();
  }

  return (
    <AppShell account={authResult.account}>
      <LessonDraftEditor
        initialLesson={result.data.data}
        account={authResult.account}
      />
    </AppShell>
  );
}
