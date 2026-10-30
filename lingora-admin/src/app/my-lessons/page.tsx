import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyStaffIdentity } from '@/server/auth';
import { listTeacherAssignedLessons } from '@/server/lessons';
import { AppShell } from '@/components/AppShell';
import { TeacherLessonsCatalog } from '@/components/TeacherLessonsCatalog';
import { AccessDeniedView } from '@/components/AccessDeniedView';
import { ServiceUnavailableView } from '@/components/ServiceUnavailableView';

export const dynamic = 'force-dynamic';

export default async function TeacherLessonsPage() {
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
          onRetryHref="/my-lessons"
        />
      );
    }
    return (
      <AccessDeniedView
        message={authResult.error.message}
      />
    );
  }

  // Exact Teacher check: Admin is forbidden on Teacher pages
  if (authResult.account.role !== 'TEACHER') {
    return (
      <AccessDeniedView
        message="Chỉ giáo viên mới có quyền truy cập danh sách bài học này."
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

  const result = await listTeacherAssignedLessons(authResult.account.id);
  const initialLessons = result.data?.data;
  const initialError = result.error ? result.error.message : null;

  return (
    <AppShell account={authResult.account}>
      <TeacherLessonsCatalog
        initialLessons={initialLessons}
        initialError={initialError}
        account={authResult.account}
      />
    </AppShell>
  );
}
