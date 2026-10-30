'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { removeDraft, clearAllDrafts } from './draftStorage';

export interface SidebarProps {
  account: {
    id: string;
    role: string;
    status: string;
    displayName: string | null;
  };
}

export function Sidebar({ account }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isLanguagesActive = pathname === '/languages' || pathname.startsWith('/languages/');
  const isFrameworksActive = pathname === '/frameworks' || pathname.startsWith('/frameworks/');
  const isCoursesActive = pathname === '/courses' || pathname.startsWith('/courses/');

  const handleLogout = async () => {
    // Clear draft in isolated try/catch so storage errors never abort logout
    try {
      removeDraft(account.id);
      clearAllDrafts();
    } catch {
      // Safe isolation
    }

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Origin': window.location.origin,
        },
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'CB';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <aside className="app-sidebar" aria-label="Điều hướng chính">
      <div className="brand-section">
        <div className="brand-name">Lingora</div>
        <div className="brand-tagline">Quản trị & Giảng dạy</div>
      </div>

      <nav className="nav-section">
        <a
          href="/languages"
          className={`nav-item ${isLanguagesActive ? 'active' : ''}`}
          id="navLanguages"
        >
          <svg className="nav-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span>Quản lý ngôn ngữ</span>
        </a>
        <a
          href="/frameworks"
          className={`nav-item ${isFrameworksActive ? 'active' : ''}`}
          id="navFrameworks"
        >
          <svg className="nav-icon" viewBox="0 0 24 24">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
          <span>Khung năng lực</span>
        </a>
        <a
          href="/courses"
          className={`nav-item ${isCoursesActive ? 'active' : ''}`}
          id="navCourses"
        >
          <svg className="nav-icon" viewBox="0 0 24 24">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          <span>Khóa học</span>
        </a>
      </nav>

      <div className="account-section">
        <div className="account-info-group">
          <div className="account-avatar" aria-hidden="true">
            {getInitials(account.displayName)}
          </div>
          <div className="account-name" title={account.displayName || 'Cán bộ quản trị'}>
            {account.displayName || 'Quản trị viên'}
          </div>
        </div>
        <button
          type="button"
          id="btnLogout"
          onClick={handleLogout}
          className="logout-btn"
          title="Đăng xuất"
          aria-label="Đăng xuất"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </aside>
  );
}
