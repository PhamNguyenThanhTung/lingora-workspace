import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { verifyStaffIdentity } from '@/server/auth';
import { getCourse, isValidUuid } from '@/server/courses';
import { getUnit } from '@/server/units';
import { listLessons, getTeacherOptions } from '@/server/lessons';
import { AppShell } from '@/components/AppShell';
import { LessonsCatalog } from '@/components/LessonsCatalog';
import { AccessDeniedView } from '@/components/AccessDeniedView';
import { ServiceUnavailableView } from '@/components/ServiceUnavailableView';

export const dynamic = 'force-dynamic';

export default async function UnitLessonsPage({
  params,
}: {
  params: Promise<{ courseId: string; unitId: string }>;
}) {
  const { courseId, unitId } = await params;
  if (!isValidUuid(courseId) || !isValidUuid(unitId)) {
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
          onRetryHref={`/courses/${courseId}/units/${unitId}`}
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
        message="Bạn không có quyền quản trị danh mục bài học."
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
        onRetryHref={`/courses/${courseId}/units/${unitId}`}
      />
    );
  }

  if (courseRes.status === 404 || courseRes.status === 400 || !courseRes.data?.data) {
    notFound();
  }

  const course = courseRes.data.data;

  // Fetch parent unit
  const unitRes = await getUnit(courseId, unitId);
  if (
    unitRes.status === 503 ||
    (unitRes.error && unitRes.status !== 404 && unitRes.status !== 400)
  ) {
    return (
      <ServiceUnavailableView
        message={unitRes.error?.message || 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.'}
        onRetryHref={`/courses/${courseId}/units/${unitId}`}
      />
    );
  }

  if (unitRes.status === 404 || unitRes.status === 400 || !unitRes.data?.data) {
    notFound();
  }

  const unit = unitRes.data.data;

  // Fetch lessons and teacher options in parallel
  const [lessonsRes, teachersRes] = await Promise.all([
    listLessons(courseId, unitId),
    getTeacherOptions(courseId, unitId),
  ]);

  const initialLessons = lessonsRes.data?.data;
  const initialError = lessonsRes.error ? lessonsRes.error.message : null;
  const teacherOptions = teachersRes.data?.data || [];

  return (
    <AppShell account={authResult.account}>
      <LessonsCatalog
        course={course}
        unit={unit}
        initialLessons={initialLessons}
        teacherOptions={teacherOptions}
        initialTeacherOptionsError={teachersRes.error?.message || null}
        initialError={initialError}
        account={authResult.account}
      />
    </AppShell>
  );
}
