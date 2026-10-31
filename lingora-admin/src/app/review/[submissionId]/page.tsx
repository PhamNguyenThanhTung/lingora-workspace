import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyStaffIdentity } from '@/server/auth';
import { getReviewDetail } from '@/server/lessons/workflow';
import { AppShell } from '@/components/AppShell';
import { ReviewDetailView } from '@/components/ReviewDetailView';
import { AccessDeniedView } from '@/components/AccessDeniedView';
import { ServiceUnavailableView } from '@/components/ServiceUnavailableView';

export const dynamic = 'force-dynamic';

interface ReviewDetailPageProps {
  params: Promise<{ submissionId: string }>;
}

export default async function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  const { submissionId } = await params;
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
          onRetryHref={`/review/${submissionId}`}
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
        message="Chỉ quản trị viên đang hoạt động mới có quyền xem chi tiết kiểm duyệt."
        accountId={authResult.account.id}
      />
    );
  }

  const result = await getReviewDetail(authResult.account.id, submissionId);

  if (result.error) {
    if (result.status === 404) {
      return (
        <AppShell account={authResult.account}>
          <div className="page-content" style={{ maxWidth: '960px', margin: '40px auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: '20px', color: '#0f172a' }}>Không tìm thấy bản nộp kiểm duyệt</h1>
            <p style={{ color: '#64748b', marginTop: '8px' }}>
              Mã bản nộp &quot;{submissionId}&quot; không tồn tại hoặc đã bị xóa.
            </p>
            <a href="/review" className="btn btn-secondary" style={{ marginTop: '16px', display: 'inline-block' }}>
              Quay lại hàng đợi kiểm duyệt
            </a>
          </div>
        </AppShell>
      );
    }

    return (
      <AppShell account={authResult.account}>
        <div className="page-content" style={{ maxWidth: '960px', margin: '40px auto' }}>
          <div className="form-error-banner" role="alert" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '16px', borderRadius: '8px' }}>
            {result.error.message}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell account={authResult.account}>
      <ReviewDetailView
        initialDetail={result.data!.data}
        account={authResult.account}
      />
    </AppShell>
  );
}
