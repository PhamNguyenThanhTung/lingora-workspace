'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { NavigationIcon, type NavigationIconName } from './NavigationIcon';

export const adminNavGroups: { label: string; items: { href: string; label: string; id: string; icon: NavigationIconName }[] }[] = [
  { label: 'Không gian làm việc', items: [
    { href: '/dashboard', label: 'Tổng quan', id: 'navDashboard', icon: 'overview' },
  ] },
  { label: 'Quản lý nội dung', items: [
    { href: '/languages', label: 'Quản lý ngôn ngữ', id: 'navLanguages', icon: 'languages' },
    { href: '/frameworks', label: 'Khung năng lực', id: 'navFrameworks', icon: 'frameworks' },
    { href: '/courses', label: 'Khóa học', id: 'navCourses', icon: 'courses' },
    { href: '/assessments', label: 'Đánh giá', id: 'navAssessments', icon: 'assessments' },
    { href: '/review', label: 'Kiểm duyệt', id: 'navReview', icon: 'review' },
  ] },
  { label: 'Quản trị hệ thống', items: [
    { href: '/teachers', label: 'Giáo viên', id: 'navTeachers', icon: 'teachers' },
    { href: '/audit-events', label: 'Nhật ký hoạt động', id: 'navAuditEvents', icon: 'audit' },
  ] },
];

export interface SidebarProps {
  account: { id: string; role: string; status: string; displayName: string | null };
  collapsed?: boolean;
  mobile?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ account, collapsed = false, mobile = false, onToggle, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const isTeacher = account.role === 'TEACHER';
  const groups = isTeacher ? [{ label: 'Không gian giảng dạy', items: [
    { href: '/my-lessons', label: 'Bài học được phân công', id: 'navTeacherLessons', icon: 'courses' as const },
  ] }] : adminNavGroups;

  return (
    <aside className="app-sidebar" aria-label="Điều hướng chính">
      <div className="brand-section">
        <a className="brand-link" href={isTeacher ? '/my-lessons' : '/dashboard'} aria-label="Lingora" onClick={onNavigate}>
          <span className="brand-mark" aria-hidden="true">L<span /></span>
          <span className="brand-copy"><span className="brand-name">Lingora<span className="brand-admin">{isTeacher ? 'TEACHER' : 'ADMIN'}</span></span><span className="brand-tagline">{isTeacher ? 'Không gian giảng dạy' : 'Trung tâm quản trị'}</span></span>
        </a>
        <button type="button" className="shell-icon-button sidebar-toggle" onClick={onToggle} aria-label={mobile ? 'Đóng menu' : collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'} aria-expanded={mobile || !collapsed} aria-controls="sidebarNavigation" title={mobile ? 'Đóng menu' : collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}>
          <NavigationIcon name={mobile ? 'close' : 'panel'} />
        </button>
      </div>
      <nav className="nav-section" id="sidebarNavigation">
        {groups.map(group => <div className="nav-group" key={group.label}>
          <div className="nav-group-label">{group.label}</div>
          {group.items.map(item => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return <a key={item.href} href={item.href} id={item.id} className={`nav-item${active ? ' active' : ''}`} aria-label={item.label} aria-current={active ? 'page' : undefined} title={collapsed && !mobile ? item.label : undefined} onClick={onNavigate}>
              <NavigationIcon name={item.icon} /><span className="nav-label">{item.label}</span>
            </a>;
          })}
        </div>)}
      </nav>
      <div className="sidebar-footer"><NavigationIcon name={isTeacher ? 'courses' : 'overview'} /><span>Lingora Workspace<span>Nền tảng học ngoại ngữ</span></span></div>
    </aside>
  );
}
