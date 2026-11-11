'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar, adminNavGroups } from './Sidebar';
import { NavigationIcon } from './NavigationIcon';
import { removeDraft, clearAllDrafts } from './draftStorage';

export interface AppShellProps {
  account: { id: string; role: string; status: string; displayName: string | null };
  children: React.ReactNode;
}

export function AppShell({ account, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const isTeacher = account.role === 'TEACHER';
  const displayName = account.displayName?.trim() || (isTeacher ? 'Giáo viên' : 'Quản trị viên');
  const parts = displayName.split(/\s+/);
  const initials = `${parts[0][0]}${parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] || ''}`.toUpperCase();
  const group = adminNavGroups.find(group => group.items.some(item => pathname === item.href || pathname.startsWith(`${item.href}/`)));
  const current = group?.items.find(item => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const crumbs: { label: string; href?: string }[] = [{ label: isTeacher ? 'Giảng dạy' : 'Quản trị', href: isTeacher ? '/my-lessons' : '/dashboard' }];
  if (current) {
    crumbs.push({ label: current.label, href: pathname === current.href ? undefined : current.href });
    const depth = pathname.split('/').filter(Boolean).length;
    if (depth > 1) crumbs.push({ label: current.href === '/frameworks' ? 'Cấp độ' : current.href === '/review' ? 'Chi tiết bài nộp' : current.href === '/courses' ? 'Chi tiết khóa học' : 'Chi tiết' });
    if (current.href === '/courses' && depth > 3) {
      crumbs[crumbs.length - 1].href = pathname.split('/').slice(0, 3).join('/');
      crumbs.push({ label: 'Bài học trong đơn vị' });
    }
  } else if (isTeacher) crumbs.push({ label: pathname.split('/').filter(Boolean).length > 1 ? 'Chi tiết bài học' : 'Bài học được phân công' });

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => { setMobile(media.matches); setMenuOpen(false); };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (!mobile || !menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const drawer = sidebarRef.current;
    drawer?.querySelector<HTMLElement>('button')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setMenuOpen(false); }
      if (event.key !== 'Tab') return;
      const elements = Array.from(drawer?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)') || []).filter(element => element.getClientRects().length > 0);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      menuRef.current?.focus();
    };
  }, [mobile, menuOpen]);

  const handleLogout = async () => {
    try { removeDraft(account.id); clearAllDrafts(); } catch { /* Storage failure must not block logout. */ }
    try { await fetch('/api/auth/logout', { method: 'POST', headers: { Origin: window.location.origin } }); }
    catch { /* The login page remains reachable during a network failure. */ }
    finally { router.push('/login'); router.refresh(); }
  };

  return <>
    <div id="appContainer" className={`app-container${collapsed ? ' sidebar-collapsed' : ''}${menuOpen ? ' sidebar-open' : ''}`}>
      {mobile && menuOpen && <div className="sidebar-backdrop" aria-hidden="true" onClick={() => setMenuOpen(false)} />}
      <div id="appSidebar" ref={sidebarRef} className="sidebar-region" role={mobile && menuOpen ? 'dialog' : undefined} aria-modal={mobile && menuOpen ? true : undefined} aria-label={mobile && menuOpen ? 'Menu điều hướng' : undefined}>
        <Sidebar account={account} collapsed={collapsed} mobile={mobile} onToggle={() => mobile ? setMenuOpen(false) : setCollapsed(value => !value)} onNavigate={() => setMenuOpen(false)} />
      </div>
      <div className="app-main" inert={mobile && menuOpen}>
        <header className="app-topbar">
          <button ref={menuRef} type="button" className="shell-icon-button mobile-menu-button" aria-label="Mở menu" aria-expanded={menuOpen} aria-controls="appSidebar" onClick={() => setMenuOpen(true)}><NavigationIcon name="menu" /></button>
          <nav className="shell-breadcrumbs" aria-label="Đường dẫn trang"><ol>{crumbs.map((crumb, index) => <li key={`${crumb.label}-${index}`}>
            {index > 0 && <NavigationIcon name="chevron" />}{crumb.href ? <a href={crumb.href}>{crumb.label}</a> : <span aria-current="page">{crumb.label}</span>}
          </li>)}</ol></nav>
          <div className="topbar-account"><div className="account-avatar" aria-hidden="true">{initials}</div><div className="topbar-account-copy"><div className="account-name" title={displayName}>{displayName}</div><span className="account-role">{isTeacher ? 'Giáo viên' : 'Quản trị viên'}</span></div>
            <button type="button" id="btnLogout" onClick={handleLogout} className="shell-icon-button logout-btn" title="Đăng xuất" aria-label="Đăng xuất"><NavigationIcon name="logout" /></button>
          </div>
        </header>
        <a className="skip-link" href="#workspaceContent">Đến nội dung chính</a>
        <div id="workspaceContent" className="workspace-content" tabIndex={-1}>{children}</div>
      </div>
    </div>
    <div id="modalRoot" />
  </>;
}
