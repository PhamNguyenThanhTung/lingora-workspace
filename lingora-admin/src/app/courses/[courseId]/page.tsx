import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { verifyStaffIdentity } from '@/server/auth';
import { getCourse, isValidUuid } from '@/server/courses';
import { listUnits } from '@/server/units';
import { listLevels } from '@/server/levels';
import { AppShell } from '@/components/AppShell';
import { UnitsCatalog } from '@/components/UnitsCatalog';
import { AccessDeniedView } from '@/components/AccessDeniedView';
import { ServiceUnavailableView } from '@/components/ServiceUnavailableView';

export const dynamic = 'force-dynamic';

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  if (!isValidUuid(courseId)) {
    notFound();
  }

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
          onRetryHref={`/courses/${courseId}`}
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

  // Fetch parent course
  const courseRes = await getCourse(courseId);
  if (
    courseRes.status === 503 ||
    (courseRes.error && courseRes.status !== 404 && courseRes.status !== 400)
  ) {
    return (
      <ServiceUnavailableView
        message={courseRes.error?.message || 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.'}
        onRetryHref={`/courses/${courseId}`}
      />
    );
  }

  if (courseRes.status === 404 || courseRes.status === 400 || !courseRes.data?.data) {
    notFound();
  }

  const course = courseRes.data.data;

  // Fetch child units and framework levels in parallel
  const [unitsRes, levelsRes] = await Promise.all([
    listUnits(courseId),
    listLevels(course.frameworkId),
  ]);

  const initialUnits = unitsRes.data?.data;
  const initialError = unitsRes.error ? unitsRes.error.message : null;
  const frameworkLevels = levelsRes.data?.data || [];
  const initialLevelsError = levelsRes.error ? levelsRes.error.message : null;

  return (
    <AppShell account={authResult.account}>
      <UnitsCatalog
        course={course}
        frameworkLevels={frameworkLevels}
        initialUnits={initialUnits}
        initialError={initialError}
        initialLevelsError={initialLevelsError}
        account={authResult.account}
      />
    </AppShell>
  );
}
