'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { LearnerContextEnvelope } from '../../server/context/dto.ts';
import type { LoadLearnerContextResult } from '../../server/context/loader.ts';
import type { HomeDto } from '../../server/context/home-dto.ts';
import type { LoadLearnerHomeResult } from '../../server/context/home-loader.ts';
import { PathMap } from '../../components/learner/path/PathMap.tsx';
import { LangText } from '../../components/learner/LangText.tsx';
import { getSections, setContextCookie } from '../../components/learner/helpers.ts';
import type { HomeWithSections } from '../../components/learner/types.ts';
import { ContextManager } from './ContextManager';
import { useContextActions } from './useContextActions';
import styles from './home.module.css';

interface HomeViewProps {
  data?: (LearnerContextEnvelope['data'] & Partial<HomeDto>) | HomeDto;
  errorState?: Extract<LoadLearnerHomeResult | LoadLearnerContextResult, { ok: false }>;
}

export function HomeView({ data, errorState }: HomeViewProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRetrying, startRetry] = useTransition();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const homeData = data as Partial<HomeWithSections> | undefined;
  const actions = useContextActions(data?.contexts ?? []);
  const { contexts, pendingContexts, isRecovering, handleResume, handleOpenStartLevel } = actions;

  const selectedContextId = homeData?.selectedContextId ?? null;
  useEffect(() => {
    // Q-U6: the next visit to /home opens the path used last.
    if (selectedContextId) setContextCookie(selectedContextId);
  }, [selectedContextId]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Origin: window.location.origin },
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

  // Error / denial states (403, 409, 503...) have no learner data, so no shell: just a safe way out.
  if (errorState) {
    const isForbidden = errorState.status === 403;
    const isNotFound = errorState.status === 404;
    const isBadRequest = errorState.status === 400;
    const isServiceUnavailable = errorState.status === 503;
    const isInconsistent = errorState.status === 409;

    return (
      <div id="homeView" className="app-container">
        <header className="app-header">
          <div className="brand-section">
            <span className="brand-title">Lingora</span>
            <span className="badge badge-active">Học viên</span>
          </div>
          <div className="user-nav">
            <button type="button" id="logoutBtn" className="btn btn-secondary btn-sm" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </button>
          </div>
        </header>
        {logoutError && (
          <p id="logoutAlert" role="alert" className="login-alert">
            {logoutError}
          </p>
        )}
        <main className="content-area">
          <div id="errorBox" className={`alert-box ${isForbidden ? 'is-danger' : 'is-warning'}`} role="alert">
            <h1 className={`alert-title ${isForbidden ? 'danger' : 'warning'}`}>
              {isForbidden
                ? 'Truy cập bị từ chối'
                : isNotFound
                ? 'Không tìm thấy nội dung'
                : isBadRequest
                ? 'Yêu cầu không hợp lệ'
                : isInconsistent
                ? 'Dữ liệu không nhất quán'
                : 'Dịch vụ tạm thời không khả dụng'}
            </h1>
            <p className="alert-message">{errorState.error.message}</p>
            <div className="alert-actions">
              {(isServiceUnavailable || isInconsistent) && (
                <button type="button" id="retryBtn" className="btn btn-primary" onClick={handleRetry} disabled={isRetrying}>
                  {isRetrying ? 'Đang thử lại...' : 'Thử lại'}
                </button>
              )}
              {(isNotFound || isBadRequest) && (
                <a href="/home" id="backToHomeBtn" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                  Về trang chủ
                </a>
              )}
              <button type="button" className="btn btn-secondary" onClick={handleLogout} disabled={isLoggingOut}>
                Đăng xuất
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  const uiLocale = data.learner.uiLocale || 'vi';
  const selectedContext = contexts.find((context) => context.id === selectedContextId);
  const pathUsable = selectedContext?.status === 'ACTIVE' && selectedContext.course.isActive;
  const continueLearning = pathUsable ? homeData?.continueLearning ?? null : null;
  const sections = pathUsable ? getSections({ ...homeData, contexts }, uiLocale) : [];

  // SCR-L-06: progress counts eligible required lessons; optional lessons stay out of it.
  const requiredNodes = sections
    .flatMap((s) => s.units.flatMap((u) => u.nodes))
    .filter((node) => node.isRequired && node.state !== 'COMING_SOON');
  const publishedPathCount = requiredNodes.length;
  const completedPathCount = requiredNodes.filter((node) => node.state === 'COMPLETED').length;
  const pathStatus =
    selectedContext && !selectedContext.course.isActive
      ? 'COURSE_INACTIVE'
      : selectedContext?.status === 'PAUSED'
      ? 'PAUSED'
      : selectedContext && !selectedContext.workingLevel
      ? 'NO_WORKING_LEVEL'
      : selectedContext?.status === 'ACTIVE' && homeData?.pathStatus === 'PAUSED'
      ? 'READY'
      : homeData?.pathStatus;
  const allPublishedDone = pathStatus === 'READY' && publishedPathCount > 0 && completedPathCount === publishedPathCount;

  return (
    <div id="homeView" className={styles.root}>
      {contexts.length === 0 ? (
        <div id="emptyContextState" className="empty-state-box">
          <p className="empty-state-text">Bạn chưa có lộ trình học.</p>
          <div style={{ marginTop: '16px' }}>
            <a href="/onboarding" id="startOnboardingBtn" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Bắt đầu học
            </a>
          </div>
        </div>
      ) : (
        <>
          <h1 className="sr-only">Lộ trình học</h1>
          {continueLearning ? (
            <div id="continueLearningBanner" className={styles.continue}>
              <div className={styles.continueText}>
                <span className={styles.continueKicker}>
                  {continueLearning.status === 'IN_PROGRESS' ? 'Đang làm bài' : 'Bài học tiếp theo'}
                </span>
                <span className={styles.continueTitle}>
                  <span aria-hidden="true">Tiếp tục: </span>
                  <LangText text={continueLearning.title} targetLanguage={selectedContext?.targetLanguage.code} />
                </span>
              </div>
              <a href={continueLearning.href} id="continueLearningBtn" className={styles.continueBtn}>
                {continueLearning.status === 'IN_PROGRESS' ? 'Tiếp tục học' : 'Bắt đầu học'}
              </a>
            </div>
          ) : (
            <section id="continueLearningFallback" role="status" className="hero-card hero-card--muted">
              <div>
                <h2 className="hero-card__title" style={{ marginTop: 0 }}>
                  {allPublishedDone
                    ? '🎉 Bạn đã học hết các bài hiện có'
                    : pathStatus === 'PAUSED'
                    ? 'Lộ trình đang tạm dừng'
                    : pathStatus === 'NO_WORKING_LEVEL'
                    ? 'Chọn trình độ để bắt đầu'
                    : pathStatus === 'COURSE_INACTIVE'
                    ? 'Khóa học hiện chưa mở'
                    : 'Chưa có bài học tiếp theo'}
                </h2>
                <span className="hero-card__meta">
                  {allPublishedDone
                    ? 'Chúc mừng! Hãy ôn lại từ vựng hoặc làm lại bài để củng cố; bài mới sẽ xuất hiện ở đây khi được phát hành.'
                    : homeData?.pathMessage ||
                      (pathStatus === 'PAUSED'
                        ? 'Tiếp tục lộ trình khi bạn sẵn sàng.'
                        : pathStatus === 'NO_WORKING_LEVEL'
                        ? 'Chọn trình độ bắt đầu để xem bài học phù hợp.'
                        : pathStatus === 'COURSE_INACTIVE'
                        ? 'Bạn có thể xem lại thông tin lộ trình bên dưới.'
                        : pathStatus === 'EMPTY_CURRICULUM'
                        ? 'Chương trình này chưa có bài học được phát hành.'
                        : 'Chọn một lộ trình để xem nội dung học.')}
                </span>
              </div>
              {selectedContext && pathStatus === 'PAUSED' ? (
                <button
                  type="button"
                  className="btn hero-card__cta"
                  onClick={() => handleResume(selectedContext)}
                  disabled={!!pendingContexts[selectedContext.id]}
                >
                  {pendingContexts[selectedContext.id] ? 'Đang tiếp tục...' : 'Tiếp tục học'}
                </button>
              ) : selectedContext && pathStatus === 'NO_WORKING_LEVEL' ? (
                <button
                  type="button"
                  className="btn hero-card__cta"
                  onClick={() => handleOpenStartLevel(selectedContext)}
                  disabled={!!pendingContexts[selectedContext.id] || isRecovering}
                >
                  Chọn trình độ bắt đầu
                </button>
              ) : pathStatus === 'EMPTY_CURRICULUM' && selectedContext ? (
                <a href={`/learn/${selectedContext.id}`} className="btn hero-card__cta">
                  Xem danh sách bài học
                </a>
              ) : selectedContext ? (
                <a href={`/learn/${selectedContext.id}/sections`} className="btn btn-secondary btn-block">
                  Xem lộ trình
                </a>
              ) : null}
            </section>
          )}

          {sections.length > 0 && (
            <>
              <div className={styles.toolbar}>
                {publishedPathCount > 0 && (
                  <p id="pathProgressSummary" className={styles.progress}>
                    {completedPathCount}/{publishedPathCount} bài đã hoàn thành
                  </p>
                )}
                {selectedContext && (
                  <a href={`/learn/${selectedContext.id}/sections`} id="viewSectionsLink" className={styles.sectionsLink}>
                    Xem tất cả phần
                  </a>
                )}
              </div>
              <PathMap
                sections={sections}
                continueStatus={continueLearning?.status ?? null}
                targetLanguage={selectedContext?.targetLanguage.code}
              />
            </>
          )}

          <ContextManager actions={actions} uiLocale={uiLocale} />
        </>
      )}
    </div>
  );
}
