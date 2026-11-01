'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PracticeSection } from './PracticeSection';
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
  const [audioErrors, setAudioErrors] = useState<Record<string, boolean>>({});

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
            {/* Paragraph Content Blocks */}
            <section id="contentBlocksSection" className="lesson-section">
              <h2
                style={{
                  fontSize: 'var(--font-size-heading)',
                  fontWeight: 700,
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                Bài đọc
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', lineHeight: 1.7 }}>
                {revision.contentBlocks.map((block, idx) => (
                  <p key={idx} className="lesson-paragraph">
                    {block.text}
                  </p>
                ))}
              </div>
            </section>

            {/* Vocabulary Section */}
            {vocabulary.length > 0 && (
              <section id="vocabularySection" className="lesson-section">
                <h2
                  style={{
                    fontSize: 'var(--font-size-heading)',
                    fontWeight: 700,
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  Từ vựng bài học ({vocabulary.length})
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                  {vocabulary.map((v: LearnerVocabularyDto) => {
                    const snap = v.displaySnapshot;
                    const meaningVi = snap.meaningLabels?.vi || '';
                    const meaningEn = snap.meaningLabels?.en || '';

                    return (
                      <div
                        key={v.id}
                        className="vocab-card"
                        data-vocab-id={v.id}
                        style={{
                          padding: '14px 16px',
                          backgroundColor: 'var(--surface-bg)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-green)' }}>
                            {snap.canonicalForm}
                          </span>
                          {snap.phonetic && (
                            <span style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-muted)' }}>
                              /{snap.phonetic}/
                            </span>
                          )}
                        </div>

                        {snap.partOfSpeech && (
                          <div style={{ marginBottom: '6px' }}>
                            <span
                              style={{
                                fontSize: 'var(--font-size-ref)',
                                fontStyle: 'italic',
                                color: 'var(--text-muted)',
                              }}
                            >
                              ({snap.partOfSpeech})
                            </span>
                          </div>
                        )}

                        <div style={{ fontSize: 'var(--font-size-body)', marginBottom: '4px' }}>
                          {meaningVi && <div>{meaningVi}</div>}
                          {meaningEn && (
                            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sub)' }}>
                              {meaningEn}
                            </div>
                          )}
                        </div>

                        {snap.example && (
                          <div
                            style={{
                              marginTop: '8px',
                              paddingTop: '6px',
                              borderTop: '1px dashed var(--border-subtle)',
                              fontSize: 'var(--font-size-sub)',
                              color: 'var(--text-muted)',
                              fontStyle: 'italic',
                            }}
                          >
                            &ldquo;{snap.example}&rdquo;
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Read-Only Exercises Section */}
            {exercises.length > 0 && (
              <section id="exercisesSection" className="lesson-section">
                <h2
                  style={{
                    fontSize: 'var(--font-size-heading)',
                    fontWeight: 700,
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  Bài tập đọc hiểu ({exercises.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {exercises.map((ex: LearnerExerciseDto) => {
                    const prompt = (ex.promptData as any)?.prompt || '';
                    const hasAudioError = audioErrors[ex.id];

                    return (
                      <div
                        key={ex.id}
                        className="exercise-card"
                        data-exercise-id={ex.id}
                        data-exercise-type={ex.type}
                        style={{
                          padding: '18px 20px',
                          backgroundColor: 'var(--surface-bg)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '10px',
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>
                            Bài tập {ex.position}: {ex.type}
                          </span>
                          <span className="badge badge-default" style={{ fontSize: 'var(--font-size-ref)' }}>
                            Chỉ đọc
                          </span>
                        </div>

                        <p style={{ marginBottom: '14px', fontSize: 'var(--font-size-body)' }}>{prompt}</p>

                        {/* MCQ Type */}
                        {ex.type === 'MCQ' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {((ex.promptData as any)?.options || []).map((opt: any) => (
                              <div
                                key={opt.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '10px 14px',
                                  border: '1px solid var(--border-subtle)',
                                  borderRadius: 'var(--radius-sm)',
                                  backgroundColor: 'var(--canvas-bg)',
                                }}
                              >
                                <input type="radio" disabled name={`mcq-${ex.id}`} id={`opt-${ex.id}-${opt.id}`} />
                                <label htmlFor={`opt-${ex.id}-${opt.id}`} style={{ cursor: 'default' }}>
                                  {opt.text}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* FILL_BLANK Type */}
                        {ex.type === 'FILL_BLANK' && (
                          <div
                            style={{
                              padding: '12px 16px',
                              backgroundColor: 'var(--canvas-bg)',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-subtle)',
                              fontSize: 'var(--font-size-body)',
                            }}
                          >
                            {((ex.promptData as any)?.sentence || '').replace(
                              '____',
                              '[ ____________ ]'
                            )}
                          </div>
                        )}

                        {/* REORDER Type */}
                        {ex.type === 'REORDER' && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {((ex.promptData as any)?.tokens || []).map((t: any) => (
                              <span
                                key={t.id}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: 'var(--canvas-bg)',
                                  border: '1px solid var(--border-control)',
                                  borderRadius: 'var(--radius-sm)',
                                  fontWeight: 500,
                                }}
                              >
                                {t.text}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* LISTENING Type */}
                        {ex.type === 'LISTENING' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {(ex.promptData as any)?.audioUrl && (
                              <div>
                                <audio
                                  controls
                                  src={(ex.promptData as any).audioUrl}
                                  onError={() =>
                                    setAudioErrors((prev) => ({ ...prev, [ex.id]: true }))
                                  }
                                  style={{ width: '100%', maxWidth: '400px' }}
                                />
                                {hasAudioError && (
                                  <div
                                    id={`audioError-${ex.id}`}
                                    className="audio-error-box"
                                    role="alert"
                                    style={{
                                      marginTop: '6px',
                                      fontSize: 'var(--font-size-sub)',
                                      color: 'var(--danger-red)',
                                    }}
                                  >
                                    Không thể tải âm thanh. Vui lòng thử lại.
                                  </div>
                                )}
                              </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {((ex.promptData as any)?.options || []).map((opt: any) => (
                                <div
                                  key={opt.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 14px',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: 'var(--canvas-bg)',
                                  }}
                                >
                                  <input type="radio" disabled name={`listening-${ex.id}`} id={`opt-${ex.id}-${opt.id}`} />
                                  <label htmlFor={`opt-${ex.id}-${opt.id}`} style={{ cursor: 'default' }}>
                                    {opt.text}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* GRAMMAR Type */}
                        {ex.type === 'GRAMMAR' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div
                              style={{
                                padding: '10px 14px',
                                backgroundColor: 'var(--canvas-bg)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-subtle)',
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>Câu gốc: </span>
                              {(ex.promptData as any)?.sourceSentence}
                            </div>
                            <div
                              style={{
                                padding: '10px 14px',
                                backgroundColor: 'var(--canvas-bg)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-subtle)',
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>Cấu trúc mẫu: </span>
                              {(ex.promptData as any)?.targetPattern}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
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
