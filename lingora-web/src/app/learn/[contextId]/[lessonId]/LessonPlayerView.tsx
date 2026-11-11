'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PracticeSection } from './PracticeSection';
import { LessonContent } from '@lingora/lesson-content/LessonContent';
import {
  toLessonPresentationDto,
  adaptLegacyParagraphs,
} from '@lingora/lesson-content';
import type {
  LearnerLessonDetailDto,
  LearnerExerciseDto,
  LearnerVocabularyDto,
  ReadingState,
} from '../../../../server/lessons/dto.ts';

interface LessonPlayerViewProps {
  data?: LearnerLessonDetailDto;
  errorState?: {
    status: number;
    error: {
      code: string;
      message: string;
    };
  };
}

function getLocalizedText(obj: unknown, locale = 'vi'): string {
  if (!obj || typeof obj !== 'object') return '';
  const record = obj as Record<string, string>;
  return record[locale] || record['vi'] || record['en'] || Object.values(record)[0] || '';
}

export function LessonPlayerView(props: LessonPlayerViewProps) {
  const data = props.data;
  const identity = data ? `${data.contextId}:${data.lessonId}:${data.revision.id}:${data.consumption.rowVersion ?? '0'}` : `error:${props.errorState?.status}`;
  return <LessonPlayer key={identity} {...props} />;
}

function LessonPlayer({ data, errorState }: LessonPlayerViewProps) {
  const router = useRouter();
  const [isRetrying, startRetry] = useTransition();

  // Local state for consumption reconciliation
  const [readingState, setReadingState] = useState<ReadingState>(
    data?.consumption?.state || 'NOT_STARTED'
  );
  const [isActionPending, setIsActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  const handleRetry = () => {
    startRetry(() => router.refresh());
  };

  const handleAction = async (action: 'start' | 'complete') => {
    if (!data || isActionPending) return;

    setIsActionPending(true);
    setActionError(null);
    setIsStale(false);

    try {
      const response = await fetch(
        `/api/learner/contexts/${data.contextId}/lessons/${data.lessonId}/consumption`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin,
          },
          body: JSON.stringify({
            action,
            expectedPublishedRevisionId: data.revision.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409 && result.error?.code === 'PUBLICATION_CHANGED') {
          setIsStale(true);
          setActionError('Nội dung bài học đã được cập nhật. Vui lòng tải lại trang.');
          return;
        }
        throw new Error(result.error?.message || 'Thao tác không thành công.');
      }

      // Reconcile reading state strictly from returned DTO
      if (result.data?.contextId === data.contextId && result.data?.lessonId === data.lessonId && result.data?.lessonRevisionId === data.revision.id && ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(result.data?.state)) {
        setReadingState(result.data.state);
      } else { throw new Error('Phản hồi chưa hợp lệ. Vui lòng thử lại.'); }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Chưa thể thực hiện thao tác. Vui lòng thử lại.';
      setActionError(message);
    } finally {
      setIsActionPending(false);
    }
  };

  const renderHeader = () => (
    <header className="app-header">
      <div className="brand-section">
        <a href="/home" className="brand-title" style={{ textDecoration: 'none', color: 'inherit' }}>
          Lingora
        </a>
        <span className="badge badge-active">Học viên</span>
      </div>
      <div className="user-nav">
        {data && (
          <a
            href={`/learn/${data.contextId}`}
            id="backToCatalogueBtn"
            className="btn btn-outline"
            style={{ textDecoration: 'none' }}
          >
            ← Danh mục bài học
          </a>
        )}
      </div>
    </header>
  );

  if (errorState) {
    const isForbidden = errorState.status === 403;
    const isNotFound = errorState.status === 404;
    const isLocked = errorState.status === 409;

    return (
      <div id="lessonPlayerView" className="app-container">
        {renderHeader()}
        <main className="content-area">
          <div
            id="playerErrorBox"
            className={`alert-box ${isForbidden || isNotFound ? 'is-danger' : 'is-warning'}`}
            role="alert"
          >
            <h1 className={`alert-title ${isForbidden || isNotFound ? 'danger' : 'warning'}`}>
              {isForbidden
                ? 'Truy cập bị từ chối'
                : isNotFound
                ? 'Không tìm thấy bài học'
                : isLocked
                ? 'Bài học chưa mở khóa'
                : 'Dịch vụ tạm thời không khả dụng'}
            </h1>
            <p className="alert-message">{errorState.error.message}</p>
            <div className="alert-actions">
              {(errorState.status === 503 || isLocked) && (
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
              {data ? (
                <a
                  href={`/learn/${data.contextId}`}
                  className="btn btn-secondary"
                  style={{ textDecoration: 'none' }}
                >
                  Về danh mục bài học
                </a>
              ) : (
                <a href="/home" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                  Về trang chủ
                </a>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  const { unit, revision, exercises, vocabulary } = data;
  const lessonTitle = getLocalizedText(revision.title, 'vi');
  const unitTitle = getLocalizedText(unit.names, 'vi');

  const readingStateLabel =
    readingState === 'COMPLETED'
      ? 'Đã đọc'
      : readingState === 'IN_PROGRESS'
      ? 'Đang đọc'
      : 'Chưa đọc';

  const readingBadgeClass =
    readingState === 'COMPLETED'
      ? 'badge-active'
      : readingState === 'IN_PROGRESS'
      ? 'badge-paused'
      : 'badge-default';

  return (
    <div id="lessonPlayerView" className="app-container">
      {renderHeader()}
      <main className="content-area" style={{ maxWidth: '840px', margin: '0 auto', width: '100%' }}>
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-muted)' }}>
            <a href={`/learn/${data.contextId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              Chương {unit.position}: {unitTitle}
            </a>{' '}
            / {lessonTitle}
          </span>
        </nav>

        {/* Lesson Title & Reading State Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            marginBottom: '24px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              id="lessonHeading"
              style={{ fontSize: 'var(--font-size-title)', fontWeight: 700, marginBottom: '6px' }}
            >
              {lessonTitle || 'Nội dung bài học'}
            </h1>
            <span style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-muted)' }}>
              Phiên bản nội dung: #{revision.revisionNo}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span id="readingStateBadge" className={`badge ${readingBadgeClass}`}>
              {readingStateLabel}
            </span>
          </div>
        </div>

        {/* Action Error / Stale Notification */}
        {actionError && (
          <div
            id="actionAlert"
            className={`alert-box ${isStale ? 'is-warning' : 'is-danger'}`}
            role="alert"
            style={{ marginBottom: '20px' }}
          >
            <p className="alert-message">{actionError}</p>
            {isStale && (
              <button
                type="button"
                id="reloadBtn"
                className="btn btn-primary"
                style={{ marginTop: '8px' }}
                onClick={() => router.refresh()}
              >
                Tải lại trang
              </button>
            )}
          </div>
        )}

        {/* Reading Player Gate & Actions */}
        <section
          className="reading-player-controls"
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--surface-bg)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <span style={{ fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                Tiến độ đọc nội dung
              </span>
              <p
                id="readingExplanation"
                style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-muted)' }}
              >
                Ghi nhận việc đọc nội dung, không hoàn thành bài tập hoặc mở khóa bài học tiếp theo.
              </p>
            </div>

            <div>
              {readingState === 'NOT_STARTED' && (
                <button
                  type="button"
                  id="startReadingBtn"
                  className="btn btn-primary"
                  onClick={() => handleAction('start')}
                  disabled={isActionPending || isStale}
                >
                  {isActionPending ? 'Đang mở nội dung...' : 'Mở nội dung'}
                </button>
              )}

              {readingState === 'IN_PROGRESS' && (
                <button
                  type="button"
                  id="completeReadingBtn"
                  className="btn btn-primary"
                  onClick={() => handleAction('complete')}
                  disabled={isActionPending || isStale}
                >
                  {isActionPending ? 'Đang ghi nhận...' : 'Hoàn thành đọc nội dung'}
                </button>
              )}

              {readingState === 'COMPLETED' && (
                <button
                  type="button"
                  id="completedStateBtn"
                  className="btn btn-outline"
                  disabled
                  style={{ opacity: 0.8, cursor: 'default' }}
                >
                  Đã đọc xong nội dung
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Content Body: Only rendered after acknowledged start or if already started/completed */}
        {readingState === 'NOT_STARTED' ? (
          <div id="unstartedNotice" className="empty-state-box" style={{ padding: '32px 20px' }}>
            <p className="empty-state-text" style={{ marginBottom: '12px' }}>
              Nội dung bài học chưa được mở.
            </p>
            <p style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-muted)' }}>
              Vui lòng nhấn nút <strong>Mở nội dung</strong> ở trên để bắt đầu đọc bài học.
            </p>
          </div>
        ) : (
          <div id="lessonContentContainer" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <LessonContent
              presentation={
                revision.presentation ??
                toLessonPresentationDto(
                  revision.blocks && revision.blocks.length > 0
                    ? revision.blocks
                    : adaptLegacyParagraphs(revision.id, revision.contentBlocks),
                  vocabulary,
                  exercises
                )
              }
            />
          </div>
        )}

        {/* Interactive Practice Section */}
        {exercises.length > 0 && (
          <PracticeSection
            key={`${revision.id}:${data.latestAttempt?.id ?? "none"}:${data.latestAttempt?.responses.length ?? 0}:${data.latestAttempt?.completedAt ?? "open"}`}
            contextId={data.contextId}
            lessonId={data.lessonId}
            revisionId={revision.id}
            exercises={exercises}
            initialAttempt={data.latestAttempt}
          />
        )}
      </main>
    </div>
  );
}
