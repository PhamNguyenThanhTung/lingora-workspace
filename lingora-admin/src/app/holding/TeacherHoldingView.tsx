'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { removeDraft, clearAllDrafts, enforceIdentityAndPrune } from '@/components/draftStorage';

export interface TeacherHoldingViewProps {
  displayName: string | null;
  accountId: string;
}

export function TeacherHoldingView({ displayName, accountId }: TeacherHoldingViewProps) {
  const router = useRouter();

  // Prune any lingering drafts from previous accounts upon entering holding view per R7
  useEffect(() => {
    enforceIdentityAndPrune(accountId);
  }, [accountId]);

  const handleLogout = async () => {
    try {
      removeDraft(accountId);
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
        <h1 className="holding-title">
          Xin chào Giáo viên {displayName || ''}.
        </h1>
        <p className="holding-desc">
          Phân hệ giảng dạy đang được phát triển. Vui lòng quay lại sau.
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
