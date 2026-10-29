'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LanguageDto } from '@/server/languages';
import { saveDraft, removeDraft, type LanguageDraftData } from './draftStorage';

export interface LanguageFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: LanguageDto | null;
  initialDraft?: LanguageDraftData | null;
  accountId: string;
  triggerElement?: HTMLElement | null;
  onClose: () => void;
  onSuccess: (saved: LanguageDto, mode: 'create' | 'edit') => void;
  onForbidden?: (message?: string) => void;
  onSessionExpired: (savedSuccess: boolean) => void;
}

export function LanguageFormModal({
  isOpen,
  mode,
  initialData,
  initialDraft,
  accountId,
  triggerElement,
  onClose,
  onSuccess,
  onForbidden,
  onSessionExpired,
}: LanguageFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const [code, setCode] = useState('');
  const [vi, setVi] = useState('');
  const [en, setEn] = useState('');
  const [isLearnable, setIsLearnable] = useState(false);
  const [isUiLocale, setIsUiLocale] = useState(false);

  const [codeError, setCodeError] = useState<string | null>(null);
  const [viError, setViError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const viInputRef = useRef<HTMLInputElement>(null);

  const isPendingRef = useRef(false);
  const isSavedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    isPendingRef.current = isPending;
  }, [isPending]);

  // Reset or initialize modal state when open changes or data changes
  useEffect(() => {
    if (!isOpen) {
      setInitialized(false);
      isSavedRef.current = false;
      isPendingRef.current = false;
      setIsPending(false);
      setCodeError(null);
      setViError(null);
      setGeneralError(null);
      return;
    }

    setCodeError(null);
    setViError(null);
    setGeneralError(null);
    setIsPending(false);
    isPendingRef.current = false;
    isSavedRef.current = false;

    if (initialDraft) {
      // Explicit draft recovery for create or edit mode
      setCode(initialDraft.code || '');
      setVi(initialDraft.vi || '');
      setEn(initialDraft.en || '');
      setIsLearnable(Boolean(initialDraft.isLearnable));
      setIsUiLocale(Boolean(initialDraft.isUiLocale));
      setInitialized(true);
      const timer = setTimeout(() => {
        if (mode === 'create' && !initialDraft.code) {
          codeInputRef.current?.focus();
        } else {
          viInputRef.current?.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (mode === 'edit' && initialData) {
      setCode(initialData.code);
      setVi(initialData.names.vi || '');
      setEn(initialData.names.en || '');
      setIsLearnable(initialData.isLearnable);
      setIsUiLocale(initialData.isUiLocale);
      setInitialized(true);
      const timer = setTimeout(() => viInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    } else {
      // Clean create mode
      setCode('');
      setVi('');
      setEn('');
      setIsLearnable(false);
      setIsUiLocale(false);
      setInitialized(true);
      const timer = setTimeout(() => codeInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mounted, mode, initialData, initialDraft]);

  // Save draft on dirty changes: strictly gated until initialization completes per R7
  useEffect(() => {
    if (!isOpen || !initialized || isPending || isSavedRef.current) return;

    if (mode === 'create') {
      const isDirty = Boolean(code.trim() || vi.trim() || en.trim() || isLearnable || isUiLocale);
      if (isDirty) {
        saveDraft(accountId, {
          mode: 'create',
          code: code.trim(),
          vi: vi.trim(),
          en: en.trim(),
          isLearnable,
          isUiLocale,
        });
      }
    } else if (mode === 'edit' && initialData) {
      const isDirty =
        vi !== (initialData.names.vi || '') ||
        en !== (initialData.names.en || '') ||
        isLearnable !== initialData.isLearnable ||
        isUiLocale !== initialData.isUiLocale;
      if (isDirty) {
        saveDraft(accountId, {
          mode: 'edit',
          id: initialData.id,
          code: initialData.code,
          vi,
          en,
          isLearnable,
          isUiLocale,
        });
      }
    }
  }, [
    isOpen,
    initialized,
    mode,
    code,
    vi,
    en,
    isLearnable,
    isUiLocale,
    initialData,
    accountId,
    isPending,
  ]);

  // Keyboard navigation & focus trap
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
    isSavedRef.current = true;
    removeDraft(accountId);
    onClose();
    // Restore focus to trigger element after inert is removed from appContainer
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
    setViError(null);
    setGeneralError(null);

    const trimmedCode = code.trim().toLowerCase();
    const trimmedVi = vi.trim();
    const trimmedEn = en.trim();

    // Client-side quick check
    if (mode === 'create') {
      if (!trimmedCode) {
        setCodeError('Mã ngôn ngữ là bắt buộc');
        codeInputRef.current?.focus();
        return;
      }
      if (!/^[a-z0-9]{2,10}(-[a-z0-9]+)?$/.test(trimmedCode) || trimmedCode.length < 2 || trimmedCode.length > 10) {
        setCodeError('Mã ngôn ngữ phải là chữ thường và số (2–10 ký tự, có thể có gạch ngang)');
        codeInputRef.current?.focus();
        return;
      }
    }

    if (!trimmedVi) {
      setViError('Tên tiếng Việt không được để trống');
      viInputRef.current?.focus();
      return;
    }

    isPendingRef.current = true;
    setIsPending(true);

    try {
      const namesPayload: { vi: string; en?: string } = {
        vi: trimmedVi,
      };
      if (trimmedEn) {
        namesPayload.en = trimmedEn;
      }

      const payload =
        mode === 'create'
          ? {
              code: trimmedCode,
              names: namesPayload,
              isLearnable,
              isUiLocale,
            }
          : {
              names: namesPayload,
              isLearnable,
              isUiLocale,
            };

      const url = mode === 'create' ? '/api/languages' : `/api/languages/${initialData?.id}`;
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
        // Persist draft on 401 session expiry and report saving status
        const saved = saveDraft(accountId, {
          mode,
          id: initialData?.id,
          code: mode === 'create' ? trimmedCode : initialData?.code,
          vi: trimmedVi,
          en: trimmedEn,
          isLearnable,
          isUiLocale,
        });
        onSessionExpired(saved);
        return;
      }

      const resJson = await response.json().catch(() => null);

      if (response.status === 403) {
        isPendingRef.current = false;
        setIsPending(false);
        if (onForbidden) {
          onForbidden(resJson?.error?.message);
        } else {
          setGeneralError(resJson?.error?.message || 'Bạn không có quyền thực hiện thao tác này.');
        }
        return;
      }

      if (response.status === 503) {
        isPendingRef.current = false;
        setIsPending(false);
        setGeneralError(resJson?.error?.message || 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau ít phút.');
        return;
      }

      if (!response.ok) {
        isPendingRef.current = false;
        setIsPending(false);
        const errObj = resJson?.error;

        if (response.status === 409 && errObj?.code === 'DUPLICATE_CODE') {
          setCodeError(errObj.fields?.code || errObj.message || 'Mã ngôn ngữ này đã tồn tại trong hệ thống.');
          // R2: Focus server field error after disabled controls become enabled
          setTimeout(() => {
            codeInputRef.current?.focus();
          }, 50);
          return;
        }

        if (errObj?.fields?.code) {
          setCodeError(errObj.fields.code);
          setTimeout(() => {
            codeInputRef.current?.focus();
          }, 50);
          return;
        }

        if (errObj?.fields?.['names.vi']) {
          setViError(errObj.fields['names.vi']);
          setTimeout(() => {
            viInputRef.current?.focus();
          }, 50);
          return;
        }

        setGeneralError(errObj?.message || 'Không thể lưu thông tin ngôn ngữ. Vui lòng thử lại.');
        return;
      }

      // Success: disable further draft writes before close per R7
      isSavedRef.current = true;
      removeDraft(accountId);
      isPendingRef.current = false;
      setIsPending(false);
      onSuccess(resJson.data, mode);
    } catch {
      isPendingRef.current = false;
      setIsPending(false);
      setGeneralError('Lỗi kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.');
    }
  };

  if (!isOpen || (!mounted && typeof document === 'undefined')) return null;

  const title = mode === 'create' ? 'Thêm ngôn ngữ' : 'Sửa thông tin ngôn ngữ';
  const subtitle =
    mode === 'create'
      ? 'Định nghĩa mã chuẩn IETF BCP 47 và tên gọi hiển thị hệ thống.'
      : 'Cập nhật tên gọi hiển thị và trạng thái sử dụng của ngôn ngữ.';

  const modalContent = (
    <div
      id="languageFormModal"
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="languageModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          handleDismiss();
        }
      }}
    >
      <div className="modal-dialog" ref={modalRef}>
        <div className="modal-header">
          <div>
            <h2 id="languageModalTitle" className="modal-title">
              {title}
            </h2>
            <p className="modal-subtitle">{subtitle}</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleDismiss}
            disabled={isPending}
            aria-label="Đóng"
            tabIndex={-1}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {generalError && (
              <div id="formGeneralError" className="login-alert form-general-error" role="alert" style={{ marginBottom: '16px' }}>
                {generalError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="langCodeInput" className="form-label">
                Mã ngôn ngữ (IETF BCP 47) <span style={{ color: 'var(--danger-color)' }}>*</span>
              </label>
              <input
                id="langCodeInput"
                ref={codeInputRef}
                type="text"
                className={`form-input ${codeError ? 'is-error' : ''}`}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (codeError) setCodeError(null);
                }}
                disabled={mode === 'edit' || isPending}
                placeholder="Ví dụ: vi, en, ja, fr, zh-cn"
                autoComplete="off"
                aria-required="true"
                aria-invalid={Boolean(codeError)}
                aria-describedby={codeError ? 'codeError' : 'codeHelp'}
              />
              {codeError ? (
                <div id="codeError" className="form-error-msg" role="alert">
                  {codeError}
                </div>
              ) : (
                <span id="codeHelp" className="form-help-text">
                  Chữ cái thường (a-z), chữ số (0-9) và dấu gạch ngang (-). Tổng độ dài 2–10 ký tự. Không thể đổi sau khi tạo.
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="langViInput" className="form-label">
                Tên hiển thị tiếng Việt <span style={{ color: 'var(--danger-color)' }}>*</span>
              </label>
              <input
                id="langViInput"
                ref={viInputRef}
                type="text"
                className={`form-input ${viError ? 'is-error' : ''}`}
                value={vi}
                onChange={(e) => {
                  setVi(e.target.value);
                  if (viError) setViError(null);
                }}
                disabled={isPending}
                placeholder="Ví dụ: Tiếng Việt"
                autoComplete="off"
                aria-required="true"
                aria-invalid={Boolean(viError)}
                aria-describedby={viError ? 'viError' : undefined}
              />
              {viError && (
                <div id="viError" className="form-error-msg" role="alert">
                  {viError}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="langEnInput" className="form-label">
                Tên hiển thị tiếng Anh <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(Tùy chọn)</span>
              </label>
              <input
                id="langEnInput"
                type="text"
                className="form-input"
                value={en}
                onChange={(e) => setEn(e.target.value)}
                disabled={isPending}
                placeholder="Ví dụ: Vietnamese"
                autoComplete="off"
              />
              <span className="form-help-text">Để trống sẽ tự động xóa tên tiếng Anh trong hệ thống.</span>
            </div>

            <div className="form-group">
              <label className="checkbox-label" htmlFor="checkLearnable">
                <input
                  id="checkLearnable"
                  type="checkbox"
                  className="checkbox-input"
                  checked={isLearnable}
                  onChange={(e) => setIsLearnable(e.target.checked)}
                  disabled={isPending}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-body)' }}>Cho phép học (Learnable)</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sub)' }}>
                    Cho phép tạo khóa học, bài học và xuất hiện trong danh mục ngôn ngữ có thể học.
                  </div>
                </div>
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label" htmlFor="checkUiLocale">
                <input
                  id="checkUiLocale"
                  type="checkbox"
                  className="checkbox-input"
                  checked={isUiLocale}
                  onChange={(e) => setIsUiLocale(e.target.checked)}
                  disabled={isPending}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-body)' }}>Hỗ trợ giao diện (UI Locale)</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sub)' }}>
                    Bật ngôn ngữ này trong bộ chọn ngôn ngữ giao diện của hệ thống Lingora.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="submit"
              id="submitLanguageFormBtn"
              className="btn btn-primary"
              disabled={isPending}
            >
              {isPending ? 'Đang lưu...' : mode === 'create' ? 'Tạo ngôn ngữ' : 'Lưu thay đổi'}
            </button>
            <button
              type="button"
              id="btnCancelForm"
              className="btn btn-secondary"
              onClick={handleDismiss}
              disabled={isPending}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const modalRoot = document.getElementById('modalRoot') || document.body;
  return createPortal(modalContent, modalRoot);
}
