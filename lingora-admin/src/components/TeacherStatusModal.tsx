'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TeacherDto } from '@/server/teachers';

export interface TeacherStatusModalProps {
  isOpen: boolean;
  teacher: TeacherDto | null;
  action: 'enable' | 'disable';
  onClose: () => void;
  onSuccess: (updatedTeacher: TeacherDto) => void;
  onSessionLost?: () => void;
  onForbidden?: (message?: string) => void;
}

export function TeacherStatusModal({
  isOpen,
  teacher,
  action,
  onClose,
  onSuccess,
  onSessionLost,
  onForbidden,
}: TeacherStatusModalProps) {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const reasonInputRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const isSubmittingRef = useRef(false);

  const isDisable = action === 'disable';

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setReasonError(null);
      setGeneralError(null);
      setIsPending(false);
      isSubmittingRef.current = false;
      const timer = setTimeout(() => {
        reasonInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Focus trapping & Escape dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isSubmittingRef.current) {
          e.preventDefault();
          onClose();
        }
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen || !teacher) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmittingRef.current) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending || isSubmittingRef.current) return;

    setReasonError(null);
    setGeneralError(null);

    const trimmedReason = reason.trim();
    if (isDisable && !trimmedReason) {
      setReasonError('Vui lòng nhập lý do vô hiệu hóa.');
      reasonInputRef.current?.focus();
      return;
    }

    setIsPending(true);
    isSubmittingRef.current = true;

    try {
      const res = await fetch(`/api/teachers/${encodeURIComponent(teacher.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        body: JSON.stringify({
          action,
          reason: trimmedReason || undefined,
        }),
      });

      if (res.status === 401) {
        setIsPending(false);
        isSubmittingRef.current = false;
        onClose();
        onSessionLost?.();
        return;
      }

      if (res.status === 403) {
        const data = await res.json().catch(() => null);
        setIsPending(false);
        isSubmittingRef.current = false;
        onClose();
        onForbidden?.(data?.error?.message || 'Bạn không có quyền thực hiện thao tác này.');
        return;
      }

      const resJson = await res.json().catch(() => null);

      if (!res.ok) {
        setIsPending(false);
        isSubmittingRef.current = false;

        const errObj = resJson?.error;
        if (errObj?.fields?.reason) {
          setReasonError(errObj.fields.reason);
          reasonInputRef.current?.focus();
        } else {
          setGeneralError(errObj?.message || 'Có lỗi xảy ra khi cập nhật trạng thái. Vui lòng thử lại.');
          reasonInputRef.current?.focus();
        }
        return;
      }

      if (resJson?.data?.role !== 'TEACHER' || resJson.data.id !== teacher.id || !['ACTIVE', 'DISABLED'].includes(resJson.data.status)) throw new Error('INVALID_SERVER_RESPONSE');

      setIsPending(false);
      isSubmittingRef.current = false;
      onSuccess(resJson.data);
      onClose();
    } catch {
      setIsPending(false);
      isSubmittingRef.current = false;
      setGeneralError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
      reasonInputRef.current?.focus();
    }
  };

  const modalContent = (
    <div
      className="modal-backdrop"
      id="teacherStatusModalBackdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacherStatusModalTitle"
    >
      <div className="modal-container" ref={modalRef} id="teacherStatusModal">
        <div className="modal-header">
          <h2 className="modal-title" id="teacherStatusModalTitle">
            {isDisable ? 'Vô hiệu hóa tài khoản giáo viên' : 'Kích hoạt lại tài khoản giáo viên'}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            id="btnCloseTeacherStatusModal"
            onClick={() => { if (!isSubmittingRef.current) onClose(); }}
            disabled={isPending}
            aria-label="Đóng"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {generalError && (
              <div className="alert alert-danger" role="alert" style={{ marginBottom: '16px' }}>
                {generalError}
              </div>
            )}

            <p style={{ margin: '0 0 16px', lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn {isDisable ? 'vô hiệu hóa' : 'kích hoạt lại'} tài khoản giáo viên{' '}
              <strong>{teacher.displayName || teacher.email || teacher.id}</strong>
              {teacher.email && teacher.displayName && ` (${teacher.email})`}?
            </p>

            {isDisable && (
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-muted, #666)' }}>
                Sau khi vô hiệu hóa, tài khoản này sẽ bị từ chối truy cập ngay lập tức vào tất cả các phân hệ giảng dạy.
              </p>
            )}

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="statusReason" className="form-label">
                {isDisable ? (
                  <>
                    Lý do vô hiệu hóa <span style={{ color: 'var(--danger-red, #dc2626)' }}>*</span>
                  </>
                ) : (
                  'Lý do kích hoạt lại (tùy chọn)'
                )}
              </label>
              <textarea
                ref={reasonInputRef}
                id="statusReason"
                className={`form-input ${reasonError ? 'is-error' : ''}`}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (reasonError) setReasonError(null);
                }}
                disabled={isPending}
                rows={3}
                placeholder={isDisable ? 'Nhập lý do vô hiệu hóa...' : 'Nhập ghi chú kích hoạt lại nếu có...'}
                aria-required={isDisable}
                aria-invalid={Boolean(reasonError)}
                aria-describedby={reasonError ? 'statusReasonError' : undefined}
                style={{ resize: 'vertical' }}
              />
              {reasonError && (
                <div className="form-error-msg" id="statusReasonError" role="alert">
                  {reasonError}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              id="btnCancelStatusTeacher"
              onClick={() => { if (!isSubmittingRef.current) onClose(); }}
              disabled={isPending}
            >
              Hủy
            </button>
            <button
              ref={submitBtnRef}
              type="submit"
              className={`btn ${isDisable ? 'btn-danger' : 'btn-primary'}`}
              id="btnSubmitStatusTeacher"
              disabled={isPending}
            >
              {isPending
                ? 'Đang xử lý...'
                : isDisable
                ? 'Xác nhận vô hiệu hóa'
                : 'Xác nhận kích hoạt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const modalRoot = typeof document !== 'undefined' ? (document.getElementById('modalRoot') || document.body) : null;
  return modalRoot ? createPortal(modalContent, modalRoot) : modalContent;
}
