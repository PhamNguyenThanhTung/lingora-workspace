'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { clearAllDrafts, removeDraft } from './draftStorage';

export interface AccessDeniedViewProps {
  message?: string;
  accountId?: string;
}

export function AccessDeniedView({ message, accountId }: AccessDeniedViewProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      if (accountId) {
        removeDraft(accountId);
      } else {
        clearAllDrafts();
      }
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
    } catch {}
    router.push('/login');
    router.refresh();
  };

  return (
    <main className="holding-view-wrapper">
      <div className="holding-card">
        <div className="holding-brand">Lingora</div>
        <h1 className="holding-title" style={{ color: 'var(--danger-red)' }}>
          Truy cập bị từ chối
        </h1>
        <p className="holding-desc">
          {message || 'Tài khoản của bạn không có quyền truy cập vào phân hệ Quản lý ngôn ngữ.'}
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-secondary"
        >
          Đăng xuất
        </button>
      </div>
    </main>
  );
}
