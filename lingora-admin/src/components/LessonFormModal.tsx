'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LessonDetailDto, LessonSummaryDto } from '@/server/lessons';

export interface LessonFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  courseId: string;
  unitId: string;
  initialData?: LessonSummaryDto | LessonDetailDto | null;
  triggerElement?: HTMLElement | null;
  onClose: () => void;
  onSuccess: (saved: LessonDetailDto | LessonSummaryDto, mode: 'create' | 'edit') => void;
  onForbidden?: (message?: string) => void;
  onSessionExpired: () => void;
}

export function LessonFormModal({
  isOpen,
  mode,
  courseId,
  unitId,
  initialData,
  triggerElement,
  onClose,
  onSuccess,
  onForbidden,
  onSessionExpired,
}: LessonFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState('1');
  const [isRequired, setIsRequired] = useState(true);

  const [positionError, setPositionError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const positionInputRef = useRef<HTMLInputElement>(null);
  const isPendingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    isPendingRef.current = isPending;
  }, [isPending]);

  useEffect(() => {
    if (!isOpen) {
      setIsPending(false);
      isPendingRef.current = false;
      setPositionError(null);
      setGeneralError(null);
      setPosition('1');
      setIsRequired(true);
      return;
    }

    setPositionError(null);
    setGeneralError(null);
    setIsPending(false);
    isPendingRef.current = false;

    if (mode === 'edit' && initialData) {
      setPosition(String(initialData.position));
      setIsRequired(initialData.isRequired);
    } else {
      setPosition('1');
      setIsRequired(true);
    }

    const timer = setTimeout(() => {
      positionInputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, mode, initialData]);

  // Trap focus & Escape
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

  if (!mounted || !isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPendingRef.current) return;

    setPositionError(null);
    setGeneralError(null);

    const posNum = Number(position);
    if (!Number.isInteger(posNum) || posNum <= 0 || posNum > 2147483647) {
      setPositionError('Vị trí bài học phải là số nguyên dương lớn hơn 0.');
      positionInputRef.current?.focus();
      return;
    }

    setIsPending(true);
    isPendingRef.current = true;

    try {
      const url =
        mode === 'create'
          ? `/api/courses/${courseId}/units/${unitId}/lessons`
          : `/api/courses/${courseId}/units/${unitId}/lessons/${initialData?.id}`;

      const method = mode === 'create' ? 'POST' : 'PATCH';
      const payload: any = {
        position: posNum,
        isRequired,
      };

      if (mode === 'edit' && initialData) {
        payload.expectedRowVersion = initialData.rowVersion;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify(payload),
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
        const errMsg = data?.error?.message || 'Có lỗi xảy ra khi lưu bài học.';

        if (errCode === 'DUPLICATE_LESSON_POSITION') {
          setPositionError(errMsg);
          setTimeout(() => positionInputRef.current?.focus(), 50);
        } else if (errCode === 'STALE_LESSON') {
          setGeneralError('Dữ liệu bài học đã bị thay đổi bởi tác vụ khác. Vui lòng đóng hộp thoại và tải lại danh sách bằng nút Làm mới danh sách.');
        } else {
          setGeneralError(errMsg);
        }
        return;
      }

      setIsPending(false);
      isPendingRef.current = false;
      onSuccess(data.data, mode);
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
      id="lessonFormModalBackdrop"
    >
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lessonFormModalTitle"
        ref={modalRef}
        id="lessonFormModal"
      >
        <div className="modal-header">
          <h2 id="lessonFormModalTitle" className="modal-title">
            {mode === 'create' ? 'Thêm bài học mới' : 'Chỉnh sửa bài học'}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isPending}
            aria-label="Đóng"
            id="btnCloseLessonModal"
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
                id="lessonFormGeneralError"
                style={{ marginBottom: '16px' }}
              >
                {generalError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="inputLessonPosition" className="form-label">
                Vị trí bài học <span className="required-star">*</span>
              </label>
              <input
                type="number"
                id="inputLessonPosition"
                className={`form-input ${positionError ? 'input-error' : ''}`}
                value={position}
                onChange={(e) => {
                  setPosition(e.target.value);
                  setPositionError(null);
                }}
                min="1"
                step="1"
                disabled={isPending}
                ref={positionInputRef}
                required
              />
              {positionError && (
                <div
                  className="field-error-message"
                  role="alert"
                  id="errorLessonPosition"
                >
                  {positionError}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label
                htmlFor="inputLessonIsRequired"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  id="inputLessonIsRequired"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  disabled={isPending}
                  style={{ width: '18px', height: '18px' }}
                />
                <span className="form-label" style={{ marginBottom: 0 }}>
                  Bài học bắt buộc (hoàn thành để qua bài tiếp theo)
                </span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isPending}
              id="btnCancelLessonModal"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending}
              id="btnSubmitLessonModal"
            >
              {isPending
                ? mode === 'create'
                  ? 'Đang tạo...'
                  : 'Đang lưu...'
                : mode === 'create'
                ? 'Tạo bài học'
                : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
