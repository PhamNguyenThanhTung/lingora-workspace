'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { LearnerContextEnvelope, LearningContextSummaryDto } from '../../server/context/dto.ts';
import type { LoadLearnerContextResult } from '../../server/context/loader.ts';

interface HomeViewProps {
  data?: LearnerContextEnvelope['data'];
  errorState?: Extract<LoadLearnerContextResult, { ok: false }>;
}

function getLocalizedText(obj: unknown, locale = 'vi'): string {
  if (!obj || typeof obj !== 'object') return '';
  const record = obj as Record<string, string>;
  return record[locale] || record['vi'] || record['en'] || Object.values(record)[0] || '';
}

export function HomeView({ data, errorState }: HomeViewProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRetrying, startRetry] = useTransition();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Origin': window.location.origin,
        },
      });
      if (!response.ok) throw new Error('Logout failed');
      router.push('/login');
      router.refresh();
    } catch {
      setLogoutError('Chưa thể đăng xuất. Vui lòng thử lại.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleRetry = () => {
    startRetry(() => router.refresh());
  };

  // Header shared across states
  const renderHeader = (identityNode?: React.ReactNode) => (
    <>
    <header className="app-header">
      <div className="brand-section">
        <span className="brand-title">Lingora</span>
        <span className="badge badge-active">Học viên</span>
      </div>
      <div className="user-nav">
        {identityNode}
        <button
          type="button"
          id="logoutBtn"
          className="btn btn-outline"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
        </button>
      </div>
    </header>
    {logoutError && <p id="logoutAlert" role="alert" className="login-alert">{logoutError}</p>}
    </>
  );

  // Error / Denial States (403, 409, 503)
  if (errorState) {
    const isForbidden = errorState.status === 403;
    const isServiceUnavailable = errorState.status === 503;
    const isInconsistent = errorState.status === 409;

    return (
      <div id="homeView" className="app-container">
        {renderHeader()}
        <main className="content-area">
          <div
            id="errorBox"
            className={`alert-box ${isForbidden ? 'is-danger' : isInconsistent ? 'is-warning' : 'is-warning'}`}
            role="alert"
          >
            <h1 className={`alert-title ${isForbidden ? 'danger' : 'warning'}`}>
              {isForbidden
                ? 'Truy cập bị từ chối'
                : isInconsistent
                ? 'Dữ liệu không nhất quán'
                : 'Dịch vụ tạm thời không khả dụng'}
            </h1>
            <p className="alert-message">{errorState.error.message}</p>
            <div className="alert-actions">
              {(isServiceUnavailable || isInconsistent) && (
                <button
                  type="button"
                  id="retryBtn"
                  className="btn btn-primary"
                  onClick={handleRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? 'Đang thử lại...' : 'Thử lại'}
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { learner, contexts } = data;
  const uiLocale = learner.uiLocale || 'vi';

  return (
    <div id="homeView" className="app-container">
      {renderHeader(
        <div id="learnerIdentity" className="user-identity">
          <span className="user-name">
            {learner.displayName || `Học viên (${learner.id.slice(0, 8)})`}
          </span>
        </div>
      )}

      <main className="content-area">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <h1 style={{ fontSize: 'var(--font-size-heading)', fontWeight: 700 }}>
            Lộ trình học tập của tôi
          </h1>
          <span style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-muted)' }}>
            Ngôn ngữ giao diện: {uiLocale}
          </span>
        </div>

        {contexts.length === 0 ? (
          <div id="emptyContextState" className="empty-state-box">
            <p className="empty-state-text">Bạn chưa có lộ trình học.</p>
          </div>
        ) : (
          <div id="contextList" className="context-grid">
            {contexts.map((ctx: LearningContextSummaryDto) => {
              const courseTitle = getLocalizedText(ctx.course.names, uiLocale);
              const langTitle = getLocalizedText(ctx.targetLanguage.names, uiLocale);
              const fwTitle = `${ctx.framework.code} (${ctx.framework.version})`;
              const startLvl = ctx.selectedStartLevel
                ? `${ctx.selectedStartLevel.code} - ${getLocalizedText(ctx.selectedStartLevel.label, uiLocale)}`
                : 'Chưa xếp lớp';
              const workingLvl = ctx.workingLevel
                ? `${ctx.workingLevel.code} - ${getLocalizedText(ctx.workingLevel.label, uiLocale)}`
                : 'Chưa xếp lớp';

              return (
                <article key={ctx.id} className="context-card" data-context-id={ctx.id}>
                  <div className="context-card-header">
                    <div>
                      <h2 className="context-course-name">{courseTitle || 'Khóa học'}</h2>
                      <span className="context-target-lang">{langTitle || ctx.targetLanguage.code}</span>
                    </div>
                    <span className={`badge ${ctx.status === 'ACTIVE' ? 'badge-active' : 'badge-paused'}`}>
                      {ctx.status === 'ACTIVE' ? 'Đang học' : 'Tạm dừng'}
                    </span>
                  </div>

                  <div className="context-details">
                    <div className="context-detail-row">
                      <span className="context-detail-label">Khung năng lực</span>
                      <span className="context-detail-value">{fwTitle}</span>
                    </div>
                    <div className="context-detail-row">
                      <span className="context-detail-label">Trạng thái khóa học</span>
                      <span className="context-detail-value">
                        {ctx.course.isActive ? 'Đang mở' : 'Tạm khóa'}
                      </span>
                    </div>
                    <div className="context-detail-row">
                      <span className="context-detail-label">Trình độ khởi điểm</span>
                      <span className="context-detail-value">{startLvl}</span>
                    </div>
                    <div className="context-detail-row">
                      <span className="context-detail-label">Trình độ hiện tại</span>
                      <span className="context-detail-value">{workingLvl}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
