'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { clearAllDrafts } from './draftStorage';

export interface ServiceUnavailableViewProps {
  message?: string;
  onRetryHref?: string;
  accountId?: string;
}

export function ServiceUnavailableView({
  message,
  onRetryHref,
  accountId,
}: ServiceUnavailableViewProps) {
  const router = useRouter();

  const handleRetry = () => {
    if (onRetryHref) {
      router.push(onRetryHref);
      router.refresh();
    } else {
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    clearAllDrafts();
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Origin': window.location.origin,
        },
      });
    } catch {
      // Safe fallback
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <main className="holding-view-wrapper">
      <div className="holding-card">
        <div className="holding-brand">Lingora</div>
        <h1 className="holding-title" style={{ color: 'var(--amber-warn, #D97706)' }}>
          Dịch vụ tạm thời không khả dụng
        </h1>
        <p className="holding-desc">
          {message || 'Hệ thống máy chủ hoặc cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau ít phút.'}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
          <button
            type="button"
            onClick={handleRetry}
            className="btn btn-primary"
            id="retryServiceBtn"
          >
            Thử lại
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-secondary"
            id="logoutServiceBtn"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </main>
  );
}
