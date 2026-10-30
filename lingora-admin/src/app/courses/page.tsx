import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyStaffIdentity } from '@/server/auth';
import { listCourses } from '@/server/courses';
import { listLanguages } from '@/server/languages';
import { listFrameworks } from '@/server/frameworks';
import { AppShell } from '@/components/AppShell';
import { CoursesCatalog } from '@/components/CoursesCatalog';
import { AccessDeniedView } from '@/components/AccessDeniedView';
import { ServiceUnavailableView } from '@/components/ServiceUnavailableView';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
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
          onRetryHref="/courses"
        />
      );
    }
    return (
      <AccessDeniedView
        message={authResult.error.message}
      />
    );
  }

  // Teacher safe boundary: redirect to holding view
  if (authResult.account.role === 'TEACHER') {
    redirect('/holding');
  }

  // Ensure active admin
  if (authResult.account.role !== 'ADMIN' || authResult.account.status !== 'ACTIVE') {
    return (
      <AccessDeniedView
        message="Bạn không có quyền quản trị danh mục khóa học."
        accountId={authResult.account.id}
      />
    );
  }

  // Initial data fetches
  const [coursesRes, langsRes, fwsRes] = await Promise.all([
    listCourses(),
    listLanguages(),
    listFrameworks(),
  ]);

  if (coursesRes.status === 503 && !coursesRes.data) {
    return (
      <ServiceUnavailableView
        message={coursesRes.error?.message || 'Cơ sở dữ liệu tạm thời không phản hồi.'}
        onRetryHref="/courses"
      />
    );
  }

  const initialCourses = coursesRes.data?.data;
  const initialError = coursesRes.error ? coursesRes.error.message : null;
  const languages = langsRes.data?.data || [];
  const frameworks = fwsRes.data?.data || [];

  return (
    <AppShell account={authResult.account}>
      <CoursesCatalog
        initialCourses={initialCourses}
        initialError={initialError}
        languages={languages}
        frameworks={frameworks}
        account={authResult.account}
      />
    </AppShell>
  );
}
