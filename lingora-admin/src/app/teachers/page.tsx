import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyStaffIdentity } from '@/server/auth';
import { listTeachers } from '@/server/teachers';
import { AppShell } from '@/components/AppShell';
import { TeachersCatalog } from '@/components/TeachersCatalog';
import { AccessDeniedView } from '@/components/AccessDeniedView';
import { ServiceUnavailableView } from '@/components/ServiceUnavailableView';

export const dynamic = 'force-dynamic';

export default async function TeachersPage() {
  const cookieStore = await cookies();
  const authResult = await verifyStaffIdentity({
    cookieStore,
    requiredRole: 'ANY',
  });

  if (!authResult.ok) {
    if (authResult.status === 401) {
      redirect('/login');
    }
    if (authResult.status === 503) {
      return (
        <ServiceUnavailableView
          message={authResult.error.message}
          onRetryHref="/teachers"
        />
      );
    }
    return (
      <AccessDeniedView
        message={authResult.error.message}
      />
    );
  }

  // Teacher safe boundary: redirect to holding view, never 403 or redirect loop
  if (authResult.account.role === 'TEACHER') {
    redirect('/holding');
  }

  // Ensure active admin
  if (authResult.account.role !== 'ADMIN' || authResult.account.status !== 'ACTIVE') {
    return (
      <AccessDeniedView
        message="Bạn không có quyền quản trị danh sách giáo viên."
        accountId={authResult.account.id}
      />
    );
  }

  // Initial catalogue fetch
  const teacherResult = await listTeachers();
  if (!teacherResult.ok && teacherResult.status === 503) {
    return (
      <ServiceUnavailableView
        message={teacherResult.error?.message || 'Cơ sở dữ liệu tạm thời không phản hồi.'}
        onRetryHref="/teachers"
        accountId={authResult.account.id}
      />
    );
  }

  const initialTeachers = teacherResult.data || [];
  const initialError = teacherResult.error ? teacherResult.error.message : null;

  return (
    <AppShell account={authResult.account}>
      <TeachersCatalog
        initialTeachers={initialTeachers}
        initialError={initialError}
        account={authResult.account}
      />
    </AppShell>
  );
}
