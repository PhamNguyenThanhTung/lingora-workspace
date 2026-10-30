'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LessonDetailDto, LessonSummaryDto, TeacherOptionDto } from '@/server/lessons';

export interface LessonAssignModalProps {
  isOpen: boolean;
  courseId: string;
  unitId: string;
  lesson: LessonSummaryDto | LessonDetailDto | null;
  teacherOptions: TeacherOptionDto[];
  teacherOptionsError?: string | null;
  loadingOptions?: boolean;
  onRetryOptions: () => void;
  triggerElement?: HTMLElement | null;
  onClose: () => void;
  onSuccess: (updated: LessonDetailDto | LessonSummaryDto) => void;
  onForbidden?: (message?: string) => void;
  onSessionExpired: () => void;
}

export function LessonAssignModal({
  isOpen,
  courseId,
  unitId,
  lesson,
  teacherOptions,
  teacherOptionsError,
  loadingOptions = false,
  onRetryOptions,
  triggerElement,
  onClose,
  onSuccess,
  onForbidden,
  onSessionExpired,
}: LessonAssignModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const isPendingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    isPendingRef.current = isPending;
  }, [isPending]);

  useEffect(() => {
    if (!isOpen || !lesson) {
      setIsPending(false);
      isPendingRef.current = false;
      setTeacherError(null);
      setGeneralError(null);
      setSelectedTeacherId('');
      return;
    }

    setTeacherError(null);
    setGeneralError(null);
    setIsPending(false);
    isPendingRef.current = false;

    const currentAssignedId = lesson.assignment?.currentTeacher?.id || '';
    setSelectedTeacherId(previous => teacherOptions.some(t => t.id === previous) ? previous : teacherOptions.some(t => t.id === currentAssignedId) ? currentAssignedId : '');

    const timer = setTimeout(() => {
      selectRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, lesson, teacherOptions]);

  // Focus trap and Escape handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isPendingRef.current) {
          onClose();
        }
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (triggerElement && typeof triggerElement.focus === 'function') {
        triggerElement.focus();
      }
    };
  }, [isOpen, onClose, triggerElement]);

  if (!mounted || !isOpen || !lesson) return null;

  const currentTeacher = lesson.assignment?.currentTeacher;
  const currentGeneration = lesson.assignment?.generation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPendingRef.current || loadingOptions || teacherOptionsError) return;

    setTeacherError(null);
    setGeneralError(null);

    if (!selectedTeacherId) {
      setTeacherError('Vui lòng chọn giáo viên để phân công.');
      selectRef.current?.focus();
      return;
    }

    setIsPending(true);
    isPendingRef.current = true;

    try {
      const url = `/api/courses/${courseId}/units/${unitId}/lessons/${lesson.id}/assignment`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          teacherId: selectedTeacherId,
          expectedRowVersion: lesson.rowVersion,
        }),
      });

      if (res.status === 401) {
        setIsPending(false);
        isPendingRef.current = false;
        onSessionExpired();
        return;
      }

      if (res.status === 403) {
        setIsPending(false);
        isPendingRef.current = false;
        onClose();
        if (onForbidden) onForbidden();
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setIsPending(false);
        isPendingRef.current = false;
        const errCode = data?.error?.code;
        const errMsg = data?.error?.message || 'Có lỗi xảy ra khi phân công giáo viên.';

        if (errCode === 'STALE_LESSON') {
          setGeneralError('Dữ liệu bài học đã bị thay đổi bởi tác vụ khác. Vui lòng đóng hộp thoại và tải lại danh sách bằng nút Làm mới danh sách.');
        } else if (errCode === 'INVALID_TEACHER_TARGET') {
          setTeacherError(errMsg);
          setTimeout(() => selectRef.current?.focus(), 50);
        } else {
          setGeneralError(errMsg);
        }
        return;
      }

      setIsPending(false);
      isPendingRef.current = false;
      onSuccess(data.data);
    } catch {
      setIsPending(false);
      isPendingRef.current = false;
      setGeneralError('Lỗi kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isPending) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={handleBackdropClick}
      id="lessonAssignModalBackdrop"
    >
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lessonAssignModalTitle"
        ref={modalRef}
        id="lessonAssignModal"
      >
        <div className="modal-header">
          <h2 id="lessonAssignModalTitle" className="modal-title">
            Phân công giáo viên — Bài học #{lesson.position}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isPending}
            aria-label="Đóng"
            id="btnCloseAssignModal"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {generalError && (
              <div
                className="form-error-banner"
                role="alert"
                id="assignGeneralError"
                style={{ marginBottom: '16px' }}
              >
                {generalError}
              </div>
            )}

            {/* Current assignment information */}
            <div
              className="assignment-current-info"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            >
              <div style={{ color: '#64748b', marginBottom: '4px' }}>
                Giáo viên phụ trách hiện tại:
              </div>
              {currentTeacher ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ color: '#0f172a' }}>
                    {currentTeacher.displayName || currentTeacher.id}
                  </strong>
                  {currentTeacher.status === 'DISABLED' && (
                    <span
                      className="status-badge status-disabled"
                      id="badgeCurrentTeacherDisabled"
                      style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      Đã vô hiệu hóa
                    </span>
                  )}
                  {currentTeacher.status === 'ACTIVE' && (
                    <span
                      className="status-badge status-active"
                      style={{
                        background: '#dcfce7',
                        color: '#166534',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      Đang hoạt động
                    </span>
                  )}
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                    (Thế hệ #{currentGeneration})
                  </span>
                </div>
              ) : (
                <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                  Chưa phân công giáo viên phụ trách
                </div>
              )}
            </div>

            <div className="form-group">
              {teacherOptionsError && <div role="alert" id="teacherOptionsError">
                <p>{teacherOptionsError}</p>
                <button type="button" className="btn btn-secondary" id="btnRetryLessonTeachers" disabled={loadingOptions} onClick={onRetryOptions}>
                  {loadingOptions ? 'Đang tải...' : 'Thử lại danh sách giáo viên'}
                </button>
              </div>}
              <label htmlFor="selectAssignTeacher" className="form-label">
                Chọn giáo viên phụ trách <span className="required-star">*</span>
              </label>
              <select
                id="selectAssignTeacher"
                className={`form-input ${teacherError ? 'input-error' : ''}`}
                value={selectedTeacherId}
                onChange={(e) => {
                  setSelectedTeacherId(e.target.value);
                  setTeacherError(null);
                }}
                disabled={isPending || loadingOptions || !!teacherOptionsError || teacherOptions.length === 0}
                ref={selectRef}
                required
              >
                {teacherOptions.length === 0 ? (
                  <option value="">{teacherOptionsError ? 'Chưa tải được danh sách giáo viên' : 'Không có giáo viên hoạt động nào'}</option>
                ) : (
                  <>
                    <option value="">-- Chọn giáo viên --</option>
                    {teacherOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.displayName || t.id}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {teacherError && (
                <div
                  className="field-error-message"
                  role="alert"
                  id="errorAssignTeacher"
                >
                  {teacherError}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isPending}
              id="btnCancelAssignModal"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending || loadingOptions || !!teacherOptionsError || teacherOptions.length === 0}
              id="btnSubmitAssignModal"
            >
              {isPending ? 'Đang phân công...' : 'Xác nhận phân công'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
