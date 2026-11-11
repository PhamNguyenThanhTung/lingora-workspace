import React from 'react';
import { NavigationIcon, type NavigationIconName } from './NavigationIcon';

export interface AdminDashboardProps {
  displayName: string | null;
  counts: { languages: number | null; courses: number | null; teachers: number | null; reviews: number | null };
  queue: { id: string; title: string; submitter: string; submittedAt: string }[] | null;
}

const shortcuts: { href: string; label: string; description: string; icon: NavigationIconName }[] = [
  { href: '/courses', label: 'Khóa học', description: 'Tổ chức khóa học, đơn vị và bài học', icon: 'courses' },
  { href: '/teachers', label: 'Giáo viên', description: 'Quản lý tài khoản và quyền giảng dạy', icon: 'teachers' },
  { href: '/frameworks', label: 'Khung năng lực', description: 'Thiết lập lộ trình và các cấp độ', icon: 'frameworks' },
  { href: '/assessments', label: 'Đánh giá', description: 'Quản lý cấu hình và bộ đề đánh giá', icon: 'assessments' },
];

export function AdminDashboard({ displayName, counts, queue }: AdminDashboardProps) {
  const metrics: { key: keyof typeof counts; label: string; href: string; icon: NavigationIconName; description: string }[] = [
    { key: 'languages', label: 'Ngôn ngữ', href: '/languages', icon: 'languages', description: 'Trong danh mục hệ thống' },
    { key: 'courses', label: 'Khóa học', href: '/courses', icon: 'courses', description: 'Trong chương trình đào tạo' },
    { key: 'teachers', label: 'Tài khoản giáo viên', href: '/teachers', icon: 'teachers', description: 'Tất cả trạng thái tài khoản' },
    { key: 'reviews', label: 'Bài nộp chờ duyệt', href: '/review', icon: 'review', description: 'Đang chờ bạn kiểm duyệt' },
  ];
  return <main className="page-content dashboard-content">
    <div className="page-header dashboard-heading"><div><p className="dashboard-eyebrow">KHÔNG GIAN QUẢN TRỊ</p><h1 className="page-title">Tổng quan hệ thống</h1><p className="page-description">Chào {displayName?.trim() || 'bạn'}, cùng theo dõi nội dung và công việc của Lingora.</p></div><a className="btn btn-primary" href="/courses"><NavigationIcon name="courses" />Quản lý khóa học</a></div>
    <section className="dashboard-metrics" aria-label="Thống kê hiện tại">{metrics.map(metric => <a className={`metric-card metric-${metric.key}`} href={metric.href} key={metric.key}>
      <div className="metric-label">{metric.label}<span className="metric-icon"><NavigationIcon name={metric.icon} /></span></div>
      <strong className="metric-value">{counts[metric.key]?.toLocaleString('vi-VN') ?? '—'}</strong>
      <span className="metric-description">{counts[metric.key] === null ? 'Chưa tải được dữ liệu. Mở danh mục để thử lại.' : metric.description}</span>
    </a>)}</section>
    <div className="dashboard-columns">
      <section className="dashboard-panel review-panel" aria-labelledby="dashboardReviewTitle">
        <div className="dashboard-panel-header"><div><span className="section-kicker">CÔNG VIỆC</span><h2 id="dashboardReviewTitle">Cần kiểm duyệt{counts.reviews !== null && <span className="queue-count">{counts.reviews}</span>}</h2></div><a className="dashboard-text-link" href="/review">Xem tất cả<NavigationIcon name="arrow" /></a></div>
        <p className="dashboard-panel-description">Những bài học đã được giáo viên gửi lên để xét duyệt.</p>
        {queue === null ? <div className="dashboard-empty"><NavigationIcon name="review" /><h3>Chưa tải được hàng đợi</h3><p>Vui lòng mở trang kiểm duyệt để tải lại dữ liệu.</p><a className="dashboard-text-link" href="/review">Mở hàng đợi<NavigationIcon name="arrow" /></a></div>
          : queue.length === 0 ? <div className="dashboard-empty"><span className="dashboard-empty-icon"><NavigationIcon name="review" /></span><h3>Không có bài học chờ duyệt</h3><p>Các bài nộp mới của giáo viên sẽ xuất hiện tại đây.</p></div>
            : <ul className="dashboard-review-list">{queue.map(item => <li key={item.id}><span className="review-item-icon"><NavigationIcon name="audit" /></span><div><a href={`/review/${item.id}`}>{item.title}</a><p>{item.submitter}<span>·</span><time dateTime={item.submittedAt}>{new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(item.submittedAt))}</time></p></div><a className="review-item-action" href={`/review/${item.id}`} aria-label={`Kiểm duyệt ${item.title}`}><NavigationIcon name="arrow" /></a></li>)}</ul>}
        <div className="dashboard-panel-footer"><NavigationIcon name="review" /><span>Kiểm tra nội dung trước khi xuất bản đến người học.</span></div>
      </section>
      <section className="dashboard-panel" aria-labelledby="dashboardShortcutsTitle"><div className="dashboard-panel-header"><div><span className="section-kicker">ĐIỀU HƯỚNG</span><h2 id="dashboardShortcutsTitle">Truy cập nhanh</h2></div><NavigationIcon name="overview" /></div><div className="dashboard-shortcuts">{shortcuts.map(item => <a href={item.href} key={item.href}><span className="shortcut-icon"><NavigationIcon name={item.icon} /></span><span><strong>{item.label}</strong><span>{item.description}</span></span><NavigationIcon name="chevron" /></a>)}</div></section>
    </div>
    <a className="dashboard-audit-link" href="/audit-events"><span className="shortcut-icon"><NavigationIcon name="audit" /></span><span><strong>Nắm rõ mọi thay đổi</strong><span>Xem lịch sử thao tác quản trị trong nhật ký hoạt động.</span></span><span className="dashboard-text-link">Mở nhật ký<NavigationIcon name="arrow" /></span></a>
    <p className="dashboard-footnote">Lingora · Không gian quản lý nội dung học tập</p>
  </main>;
}
