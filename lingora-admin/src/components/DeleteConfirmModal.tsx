'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LanguageDto } from '@/server/languages';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  targetLanguage: LanguageDto | null;
  triggerElement?: HTMLElement | null;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
  onBlocked: (lang: LanguageDto) => void;
  onForbidden?: (message?: string) => void;
  onSessionExpired: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  targetLanguage,
  triggerElement,
  onClose,
  onSuccess,
  onBlocked,
  onForbidden,
  onSessionExpired,
}: DeleteConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const isPendingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync ref with state
  useEffect(() => {
    isPendingRef.current = isPending;
  }, [isPending]);

  // Open initialization: separate from keyboard observation and pending state per R2
  useEffect(() => {
    if (!isOpen || (!mounted && typeof document === 'undefined')) {
      isPendingRef.current = false;
      setIsPending(false);
      setErrorMsg(null);
      return;
    }

    isPendingRef.current = false;
    setIsPending(false);
    setErrorMsg(null);

    // Initial focus strictly to cancel button per SCR-A-LANG-04
    const focusTimer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    return () => clearTimeout(focusTimer);
  }, [isOpen, mounted, targetLanguage]);

  // Keyboard observation and focus trap
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
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

  const handleConfirmDelete = async () => {
    if (!targetLanguage || isPendingRef.current) return;

    isPendingRef.current = true;
    setIsPending(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`/api/languages/${targetLanguage.id}`, {
        method: 'DELETE',
        headers: {
          'Origin': window.location.origin,
        },
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
        const json = await response.json().catch(() => null);
        if (onForbidden) {
          onForbidden(json?.error?.message);
        } else {
          setErrorMsg(json?.error?.message || 'Bạn không có quyền thực hiện thao tác này.');
        }
        return;
      }

      if (response.status === 409) {
        // Foreign key constraint restriction => transition to blocked dialog
        isPendingRef.current = false;
        setIsPending(false);
        onBlocked(targetLanguage);
        return;
      }

      if (response.status === 503) {
        isPendingRef.current = false;
        setIsPending(false);
        const json = await response.json().catch(() => null);
        setErrorMsg(json?.error?.message || 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau ít phút.');
        return;
      }

      if (!response.ok && response.status !== 204) {
        isPendingRef.current = false;
        setIsPending(false);
        const json = await response.json().catch(() => null);
        setErrorMsg(json?.error?.message || 'Không thể xóa ngôn ngữ. Vui lòng thử lại sau.');
        return;
      }

      // Keep loading indicator visible until success handler finishes closing dialog
      onSuccess(targetLanguage.id);
      isPendingRef.current = false;
      setIsPending(false);
    } catch {
      isPendingRef.current = false;
      setIsPending(false);
      setErrorMsg('Lỗi kết nối máy chủ khi xóa ngôn ngữ. Vui lòng thử lại.');
    }
  };

  if (!isOpen || (!mounted && typeof document === 'undefined') || !targetLanguage) return null;

  const displayName = targetLanguage.names.vi || targetLanguage.code;

  const modalContent = (
    <div
      id="deleteConfirmModal"
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deleteModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          handleDismiss();
        }
      }}
    >
      <div className="modal-dialog" style={{ maxWidth: '460px' }} ref={modalRef}>
        <div className="modal-header">
          <h2 id="deleteModalTitle" className="modal-title">
            Xóa ngôn ngữ
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleDismiss}
            disabled={isPending}
            aria-label="Đóng"
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          {errorMsg && (
            <div id="deleteErrorMsg" className="login-alert" role="alert" style={{ marginBottom: '16px' }}>
              {errorMsg}
            </div>
          )}
          <p style={{ fontSize: 'var(--font-size-body)', lineHeight: 1.5 }}>
            Bạn có chắc chắn muốn xóa ngôn ngữ <strong>{displayName}</strong> (<code>{targetLanguage.code}</code>) khỏi danh mục quản trị không?
          </p>
          <p style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-muted)', marginTop: '8px' }}>
            Hành động này không thể hoàn tác nếu ngôn ngữ chưa liên kết dữ liệu bài học nào.
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            ref={cancelBtnRef}
            className="btn btn-secondary"
            onClick={handleDismiss}
            disabled={isPending}
          >
            Hủy
          </button>
          <button
            type="button"
            id="confirmDeleteBtn"
            className="btn btn-danger"
            onClick={handleConfirmDelete}
            disabled={isPending}
          >
            {isPending ? 'Đang xóa...' : 'Xóa ngôn ngữ'}
          </button>
        </div>
      </div>
    </div>
  );

  const modalRoot = document.getElementById('modalRoot') || document.body;
  return createPortal(modalContent, modalRoot);
}
