import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyStaffIdentity } from '@/server/auth';
import { listLanguages } from '@/server/languages';
import { listCourses } from '@/server/courses';
import { listTeachers } from '@/server/teachers';
import { getReviewQueue, type ReviewQueueItemDto } from '@/server/lessons/workflow';
import { AppShell } from '@/components/AppShell';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AccessDeniedView } from '@/components/AccessDeniedView';
import { ServiceUnavailableView } from '@/components/ServiceUnavailableView';

export const dynamic = 'force-dynamic';

function availableData<T>(result: PromiseSettledResult<{ status: number; data?: T }>): T | undefined {
  return result.status === 'fulfilled' && result.value.status === 200 ? result.value.data : undefined;
}

export default async function DashboardPage() {
  const auth = await verifyStaffIdentity({ cookieStore: await cookies(), requiredRole: 'ANY' });
  if (!auth.ok) {
    if (auth.status === 401) redirect('/login');
    if (auth.status === 503) return <ServiceUnavailableView message={auth.error.message} onRetryHref="/dashboard" />;
    return <AccessDeniedView message={auth.error.message} />;
  }
  if (auth.account.role === 'TEACHER') redirect('/holding');
  if (auth.account.role !== 'ADMIN' || auth.account.status !== 'ACTIVE') {
    return <AccessDeniedView message="Chỉ quản trị viên đang hoạt động mới có quyền truy cập tổng quan." accountId={auth.account.id} />;
  }
  const [languagesResult, coursesResult, teachersResult, reviewsResult] = await Promise.allSettled([
    listLanguages(), listCourses(), listTeachers(), getReviewQueue(auth.account.id),
  ]);
  const languages = availableData(languagesResult)?.data;
  const courses = availableData(coursesResult)?.data;
  const teachers = availableData(teachersResult);
  const reviews = availableData(reviewsResult)?.data as ReviewQueueItemDto[] | undefined;
  return <AppShell account={auth.account}><AdminDashboard displayName={auth.account.displayName} counts={{
    languages: languages?.length ?? null,
    courses: courses?.length ?? null,
    teachers: teachers?.length ?? null,
    reviews: reviews?.length ?? null,
  }} queue={reviews ? reviews.slice(0, 5).map(item => ({
    id: item.submissionId,
    title: item.title.vi || item.title.en || Object.values(item.title)[0] || 'Bài học chưa có tiêu đề',
    submitter: item.submitter.displayName || 'Giáo viên',
    submittedAt: item.submittedAt,
  })) : null} /></AppShell>;
}
