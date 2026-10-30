'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { FrameworkDto } from '@/server/frameworks';

export interface FrameworkFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: FrameworkDto | null;
  triggerElement?: HTMLElement | null;
  onClose: () => void;
  onSuccess: (saved: FrameworkDto, mode: 'create' | 'edit') => void;
  onForbidden?: (message?: string) => void;
  onSessionExpired: () => void;
}

export function FrameworkFormModal({
  isOpen,
  mode,
  initialData,
  triggerElement,
  onClose,
  onSuccess,
  onForbidden,
  onSessionExpired,
}: FrameworkFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const [code, setCode] = useState('');
  const [version, setVersion] = useState('');
  const [vi, setVi] = useState('');
  const [en, setEn] = useState('');

  const [codeError, setCodeError] = useState<string | null>(null);
  const [versionError, setVersionError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const versionInputRef = useRef<HTMLInputElement>(null);
  const viInputRef = useRef<HTMLInputElement>(null);

  const isPendingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    isPendingRef.current = isPending;
  }, [isPending]);

  useEffect(() => {
    if (!isOpen) {
      setInitialized(false);
      isPendingRef.current = false;
      setIsPending(false);
      setCodeError(null);
      setVersionError(null);
      setGeneralError(null);
      setCode('');
      setVersion('');
      setVi('');
      setEn('');
      return;
    }

    setCodeError(null);
    setVersionError(null);
    setGeneralError(null);
    setIsPending(false);
    isPendingRef.current = false;

    if (mode === 'edit' && initialData) {
      setCode(initialData.code);
      setVersion(initialData.version);
      setVi(initialData.names.vi || '');
      setEn(initialData.names.en || '');
    } else {
      setCode('');
      setVersion('');
      setVi('');
      setEn('');
    }

    setInitialized(true);

    const timer = setTimeout(() => {
      codeInputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, mode, initialData]);

  // Focus trap and Escape handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPendingRef.current) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        handleDismiss();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleDismiss = () => {
    if (isPendingRef.current) return;
    onClose();
    setTimeout(() => {
      if (triggerElement && typeof triggerElement.focus === 'function') {
        triggerElement.focus();
      }
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPendingRef.current) return;

    setCodeError(null);
    setVersionError(null);
    setGeneralError(null);

    const trimmedCode = code.trim();
    const trimmedVersion = version.trim();
    const trimmedVi = vi.trim();
    const trimmedEn = en.trim();

    if (!trimmedCode) {
      setCodeError('Mã khung không được để trống');
      codeInputRef.current?.focus();
      return;
    }

    if (!trimmedVersion) {
      setVersionError('Phiên bản không được để trống');
      versionInputRef.current?.focus();
      return;
    }

    isPendingRef.current = true;
    setIsPending(true);

    try {
      const payload = {
        code: trimmedCode,
        version: trimmedVersion,
        names: {
          vi: trimmedVi,
          en: trimmedEn,
        },
      };

      const url = mode === 'create' ? '/api/frameworks' : `/api/frameworks/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        isPendingRef.current = false;
        setIsPending(false);
        onSessionExpired();
        return;
      }

      if (response.status === 403) {
        isPendingRef.current = false;
        setIsPending(false);
        const data = await response.json().catch(() => ({}));
        onClose();
        if (onForbidden) {
          onForbidden(data?.error?.message || 'Bạn không có quyền thực hiện thao tác này.');
        }
        return;
      }

      if (response.ok) {
        const json = await response.json();
        isPendingRef.current = false;
        setIsPending(false);
        onClose();
        onSuccess(json.data, mode);
        setTimeout(() => {
          if (triggerElement && typeof triggerElement.focus === 'function') {
            triggerElement.focus();
          }
        }, 50);
        return;
      }

      // Handle failure (400, 409, 503, etc.) - retain exact user inputs for retry
      const errData = await response.json().catch(() => ({}));
      isPendingRef.current = false;
      setIsPending(false);

      if (errData?.error?.fields) {
        if (errData.error.fields.code) {
          setCodeError(errData.error.fields.code);
        }
        if (errData.error.fields.version) {
          setVersionError(errData.error.fields.version);
        }
        if (errData.error.fields.code) {
          setTimeout(() => codeInputRef.current?.focus(), 50);
        } else if (errData.error.fields.version) {
          setTimeout(() => versionInputRef.current?.focus(), 50);
        }
      } else {
        setGeneralError(errData?.error?.message || 'Đã có lỗi xảy ra. Vui lòng kiểm tra lại thông tin.');
      }
    } catch {
      isPendingRef.current = false;
      setIsPending(false);
      setGeneralError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.');
    }
  };

  if (!isOpen || (!mounted && typeof document === 'undefined')) return null;

  const modalContent = (
    <div
      id="frameworkFormModal"
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="frameworkModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          handleDismiss();
        }
      }}
    >
      <div className="modal-dialog" ref={modalRef}>
        <div className="modal-header">
          <h2 id="frameworkModalTitle" className="modal-title">
            {mode === 'create' ? 'Thêm khung năng lực mới' : 'Chỉnh sửa khung năng lực'}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleDismiss}
            disabled={isPending}
            aria-label="Đóng cửa sổ"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {generalError && (
              <div className="login-alert" role="alert" id="frameworkFormGeneralError">
                {generalError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="frameworkCode" className="form-label">
                Mã khung năng lực <span className="required-star">*</span>
              </label>
              <input
                ref={codeInputRef}
                id="frameworkCode"
                name="code"
                type="text"
                className={`form-input ${codeError ? 'is-error' : ''}`}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (codeError) setCodeError(null);
                }}
                disabled={isPending}
                placeholder="VD: CEFR, ACTFL, HSK"
                autoComplete="off"
                aria-required="true"
                aria-invalid={Boolean(codeError)}
                aria-describedby={codeError ? 'frameworkCodeError' : undefined}
              />
              {codeError && (
                <div id="frameworkCodeError" className="form-error-msg" role="alert">
                  {codeError}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="frameworkVersion" className="form-label">
                Phiên bản <span className="required-star">*</span>
              </label>
              <input
                ref={versionInputRef}
                id="frameworkVersion"
                name="version"
                type="text"
                className={`form-input ${versionError ? 'is-error' : ''}`}
                value={version}
                onChange={(e) => {
                  setVersion(e.target.value);
                  if (versionError) setVersionError(null);
                }}
                disabled={isPending}
                placeholder="VD: 2020, 3.0, v1"
                autoComplete="off"
                aria-required="true"
                aria-invalid={Boolean(versionError)}
                aria-describedby={versionError ? 'frameworkVersionError' : undefined}
              />
              {versionError && (
                <div id="frameworkVersionError" className="form-error-msg" role="alert">
                  {versionError}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="frameworkNameVi" className="form-label">
                Tên tiếng Việt <span className="optional-tag">(không bắt buộc)</span>
              </label>
              <input
                ref={viInputRef}
                id="frameworkNameVi"
                name="vi"
                type="text"
                className="form-input"
                value={vi}
                onChange={(e) => setVi(e.target.value)}
                disabled={isPending}
                placeholder="VD: Khung tham chiếu Châu Âu"
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="frameworkNameEn" className="form-label">
                Tên tiếng Anh <span className="optional-tag">(không bắt buộc)</span>
              </label>
              <input
                id="frameworkNameEn"
                name="en"
                type="text"
                className="form-input"
                value={en}
                onChange={(e) => setEn(e.target.value)}
                disabled={isPending}
                placeholder="VD: Common European Framework"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDismiss}
              disabled={isPending}
            >
              Hủy
            </button>
            <button
              type="submit"
              id="btnSubmitFramework"
              className="btn btn-primary"
              disabled={isPending}
            >
              {isPending ? 'Đang lưu...' : mode === 'create' ? 'Thêm mới' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const modalRoot = document.getElementById('modalRoot') || document.body;
  return createPortal(modalContent, modalRoot);
}
