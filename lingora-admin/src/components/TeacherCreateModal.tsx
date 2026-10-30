'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TeacherDto } from '@/server/teachers';

export interface TeacherCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (teacher: TeacherDto, message?: string) => void;
  onSessionLost?: () => void;
  onForbidden?: (message?: string) => void;
}

export function TeacherCreateModal({
  isOpen,
  onClose,
  onSuccess,
  onSessionLost,
  onForbidden,
}: TeacherCreateModalProps) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const displayNameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const isSubmittingRef = useRef(false);

  // Focus first input on open & reset state
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setDisplayName('');
      setFieldErrors({});
      setGeneralError(null);
      setIsPending(false);
      isSubmittingRef.current = false;
      const timer = setTimeout(() => {
        emailInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard focus trapping & Escape dismissal
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
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmittingRef.current) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending || isSubmittingRef.current) return;

    setFieldErrors({});
    setGeneralError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFieldErrors({ email: 'Vui lòng nhập địa chỉ email.' });
      emailInputRef.current?.focus();
      return;
    }

    setIsPending(true);
    isSubmittingRef.current = true;

    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        body: JSON.stringify({
          email: trimmedEmail,
          displayName: displayName.trim() || undefined,
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
        if (errObj?.fields) {
          setFieldErrors(errObj.fields);
          setTimeout(() => {
            if (errObj.fields.email) {
              emailInputRef.current?.focus();
            } else if (errObj.fields.displayName) {
              displayNameInputRef.current?.focus();
            }
          }, 50);
        } else if (errObj?.code === 'DUPLICATE_EMAIL') {
          setFieldErrors({ email: errObj.message || 'Email này đã tồn tại trong hệ thống.' });
          setTimeout(() => {
            emailInputRef.current?.focus();
          }, 50);
        } else {
          setGeneralError(errObj?.message || 'Có lỗi xảy ra khi tạo giáo viên. Vui lòng thử lại.');
          setTimeout(() => {
            emailInputRef.current?.focus();
          }, 50);
        }
        return;
      }

      if (resJson?.data?.role !== 'TEACHER' || !resJson.data.id || resJson.data.status !== 'PENDING') throw new Error('INVALID_SERVER_RESPONSE');

      setIsPending(false);
      isSubmittingRef.current = false;
      onSuccess(resJson.data, resJson.message);
      onClose();
    } catch {
      setIsPending(false);
      isSubmittingRef.current = false;
      setGeneralError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 50);
    }
  };

  const modalContent = (
    <div
      className="modal-backdrop"
      id="teacherCreateModalBackdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacherCreateModalTitle"
    >
      <div className="modal-container" ref={modalRef} id="teacherCreateModal">
        <div className="modal-header">
          <h2 className="modal-title" id="teacherCreateModalTitle">
            Thêm giáo viên mới
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            id="btnCloseTeacherCreateModal"
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

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="teacherEmail" className="form-label">
                Địa chỉ email <span style={{ color: 'var(--danger-red, #dc2626)' }}>*</span>
              </label>
              <input
                ref={emailInputRef}
                type="email"
                id="teacherEmail"
                className={`form-input ${fieldErrors.email ? 'is-error' : ''}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }
                }}
                disabled={isPending}
                placeholder="teacher@lingora.edu.vn"
                autoComplete="off"
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'teacherEmailError' : undefined}
              />
              {fieldErrors.email && (
                <div className="form-error-msg" id="teacherEmailError" role="alert">
                  {fieldErrors.email}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="teacherDisplayName" className="form-label">
                Họ và tên (tùy chọn)
              </label>
              <input
                ref={displayNameInputRef}
                type="text"
                id="teacherDisplayName"
                className={`form-input ${fieldErrors.displayName ? 'is-error' : ''}`}
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (fieldErrors.displayName) {
                    setFieldErrors((prev) => ({ ...prev, displayName: '' }));
                  }
                }}
                disabled={isPending}
                placeholder="Nguyễn Văn A"
                autoComplete="off"
                aria-invalid={Boolean(fieldErrors.displayName)}
                aria-describedby={fieldErrors.displayName ? 'teacherDisplayNameError' : undefined}
              />
              {fieldErrors.displayName && (
                <div className="form-error-msg" id="teacherDisplayNameError" role="alert">
                  {fieldErrors.displayName}
                </div>
              )}
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted, #666)', margin: '8px 0 0' }}>
              Sau khi tạo, hệ thống sẽ gửi thư mời chứa liên kết kích hoạt đến địa chỉ email này.
            </p>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              id="btnCancelCreateTeacher"
              onClick={() => { if (!isSubmittingRef.current) onClose(); }}
              disabled={isPending}
            >
              Hủy
            </button>
            <button
              ref={submitBtnRef}
              type="submit"
              className="btn btn-primary"
              id="btnSubmitCreateTeacher"
              disabled={isPending}
            >
              {isPending ? 'Đang gửi lời mời...' : 'Gửi lời mời'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const modalRoot = typeof document !== 'undefined' ? (document.getElementById('modalRoot') || document.body) : null;
  return modalRoot ? createPortal(modalContent, modalRoot) : modalContent;
}
