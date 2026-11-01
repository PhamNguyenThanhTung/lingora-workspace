'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { LearnerCatalogueDto } from '../../../server/lessons/dto.ts';

interface CatalogueViewProps {
  data?: LearnerCatalogueDto;
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

export function CatalogueView({ data, errorState }: CatalogueViewProps) {
  const router = useRouter();
  const [isRetrying, startRetry] = useTransition();

  const handleRetry = () => {
    startRetry(() => router.refresh());
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
        <a href="/home" id="backToHomeBtn" className="btn btn-outline" style={{ textDecoration: 'none' }}>
          ← Lộ trình học
        </a>
      </div>
    </header>
  );

  if (errorState) {
    const isForbidden = errorState.status === 403;
    const isNotFound = errorState.status === 404;
    const isInconsistent = errorState.status === 409;

    return (
      <div id="catalogueView" className="app-container">
        {renderHeader()}
        <main className="content-area">
          <div
            id="catalogueErrorBox"
            className={`alert-box ${isForbidden || isNotFound ? 'is-danger' : 'is-warning'}`}
            role="alert"
          >
            <h1 className={`alert-title ${isForbidden || isNotFound ? 'danger' : 'warning'}`}>
              {isForbidden
                ? 'Truy cập bị từ chối'
                : isNotFound
                ? 'Không tìm thấy nội dung'
                : isInconsistent
                ? 'Dữ liệu không nhất quán'
                : 'Dịch vụ tạm thời không khả dụng'}
            </h1>
            <p className="alert-message">{errorState.error.message}</p>
            <div className="alert-actions">
              {(errorState.status === 503 || isInconsistent) && (
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
              <a href="/home" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                Về trang chủ
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  const { context, units, message } = data;
  const courseTitle = getLocalizedText(context.courseTitle, 'vi');
  const targetLang = getLocalizedText(context.targetLanguage.names, 'vi');
  const workingLvl = context.workingLevel
    ? `${context.workingLevel.code} - ${getLocalizedText(context.workingLevel.label, 'vi')}`
    : 'Chưa xếp lớp';

  return (
    <div id="catalogueView" className="app-container">
      {renderHeader()}
      <main className="content-area">
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-muted)' }}>
              Khóa học / {targetLang}
            </span>
          </div>
          <h1 id="courseHeading" style={{ fontSize: 'var(--font-size-title)', fontWeight: 700, marginBottom: '8px' }}>
            {courseTitle || 'Danh mục bài học'}
          </h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-active">Trình độ: {workingLvl}</span>
            <span style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-muted)' }}>
              Khung: {context.framework.code} ({context.framework.version})
            </span>
          </div>
        </div>

        {units.length === 0 ? (
          <div id="emptyCatalogueState" className="empty-state-box">
            <p className="empty-state-text">
              {message || 'Chưa có trình độ học hiện tại.'}
            </p>
          </div>
        ) : (
          <div id="unitList" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {units.map((unit) => {
              const unitTitle = getLocalizedText(unit.names, 'vi');
              return (
                <section key={unit.id} className="unit-section" data-unit-id={unit.id}>
                  <h2
                    className="unit-heading"
                    style={{
                      fontSize: 'var(--font-size-heading)',
                      fontWeight: 700,
                      marginBottom: '12px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    Chương {unit.position}: {unitTitle || 'Nội dung'}
                  </h2>

                  <div className="lesson-grid" style={{ display: 'grid', gap: '12px' }}>
                    {unit.lessons.map((lesson) => {
                      const lessonTitle = getLocalizedText(lesson.title, 'vi');
                      const readingLabel =
                        lesson.readingState === 'COMPLETED'
                          ? 'Đã đọc'
                          : lesson.readingState === 'IN_PROGRESS'
                          ? 'Đang đọc'
                          : 'Chưa đọc';

                      const readingBadgeClass =
                        lesson.readingState === 'COMPLETED'
                          ? 'badge-active'
                          : lesson.readingState === 'IN_PROGRESS'
                          ? 'badge-paused'
                          : 'badge-default';

                      return (
                        <div
                          key={lesson.id}
                          className="lesson-card"
                          data-lesson-id={lesson.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '14px 18px',
                            backgroundColor: 'var(--surface-bg)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            opacity: lesson.isLocked ? 0.75 : 1,
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 600 }}>
                                Bài {lesson.position}: {lessonTitle || 'Bài học'}
                              </span>
                              {lesson.isRequired ? (
                                <span style={{ fontSize: 'var(--font-size-ref)', color: 'var(--text-muted)' }}>
                                  (Bắt buộc)
                                </span>
                              ) : (
                                <span style={{ fontSize: 'var(--font-size-ref)', color: 'var(--text-muted)' }}>
                                  (Tùy chọn)
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span className={`badge ${readingBadgeClass}`}>
                                {readingLabel}
                              </span>
                              {lesson.isLocked && (
                                <span className="badge badge-paused" style={{ color: 'var(--danger-red)' }}>
                                  Khóa: {lesson.lockReason || 'Cần hoàn thành bài học trước'}
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            {lesson.isLocked ? (
                              <button
                                type="button"
                                className="btn btn-outline"
                                disabled
                                style={{ cursor: 'not-allowed', opacity: 0.6 }}
                              >
                                Đã khóa
                              </button>
                            ) : (
                              <a
                                href={`/learn/${context.id}/${lesson.id}`}
                                id={`lessonLink-${lesson.id}`}
                                className="btn btn-primary"
                                style={{ textDecoration: 'none' }}
                              >
                                Mở bài học
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
