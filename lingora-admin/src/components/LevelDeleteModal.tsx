'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LevelDto } from '@/server/levels';

export interface LevelDeleteModalProps {
  isOpen: boolean;
  frameworkId: string;
  targetLevel: LevelDto | null;
  triggerElement?: HTMLElement | null;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
  onForbidden?: (message?: string) => void;
  onSessionExpired: () => void;
}

export function LevelDeleteModal({
  isOpen,
  frameworkId,
  targetLevel,
  triggerElement,
  onClose,
  onSuccess,
  onForbidden,
  onSessionExpired,
}: LevelDeleteModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const isPendingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    isPendingRef.current = isPending;
  }, [isPending]);

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

    // Initial focus strictly to cancel button
    const focusTimer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    return () => clearTimeout(focusTimer);
  }, [isOpen, mounted, targetLevel]);

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
    if (isPendingRef.current || !targetLevel) return;

    isPendingRef.current = true;
    setIsPending(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`/api/frameworks/${frameworkId}/levels/${targetLevel.id}`, {
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
        const data = await response.json().catch(() => ({}));
        onClose();
        if (onForbidden) {
          onForbidden(data?.error?.message || 'Bạn không có quyền thực hiện thao tác xóa.');
        }
        return;
      }

      if (response.status === 204) {
        isPendingRef.current = false;
        setIsPending(false);
        onClose();
        onSuccess(targetLevel.id);
        return;
      }

      // Handle 409 (LEVEL_IN_USE), 404, 503, etc.
      const data = await response.json().catch(() => ({}));
      isPendingRef.current = false;
      setIsPending(false);

      if (data?.error?.message) {
        setErrorMsg(data.error.message);
      } else {
        setErrorMsg('Không thể xóa cấp độ này. Vui lòng thử lại sau.');
      }
    } catch {
      isPendingRef.current = false;
      setIsPending(false);
      setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.');
    }
  };

  if (!isOpen || (!mounted && typeof document === 'undefined') || !targetLevel) return null;

  const displayName = targetLevel.label.vi || targetLevel.label.en || targetLevel.code;

  const modalContent = (
    <div
      id="levelDeleteModal"
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deleteLevelModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          handleDismiss();
        }
      }}
    >
      <div className="modal-dialog" style={{ maxWidth: '480px' }} ref={modalRef}>
        <div className="modal-header">
          <h2 id="deleteLevelModalTitle" className="modal-title">
            Xác nhận xóa cấp độ
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

        <div className="modal-body">
          {errorMsg && (
            <div className="login-alert" role="alert" id="levelDeleteError">
              {errorMsg}
            </div>
          )}

          <p style={{ fontSize: 'var(--font-size-body)', lineHeight: 1.5 }}>
            Bạn có chắc chắn muốn xóa cấp độ <strong>{displayName}</strong> (Mã: {targetLevel.code}, Vị trí: {targetLevel.position}) khỏi khung năng lực?
          </p>
          <p style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-muted)' }}>
            Hệ thống áp dụng ràng buộc toàn vẹn: cấp độ không thể xóa nếu đang được sử dụng trong các bài học, học phần hoặc tiến trình đánh giá.
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
            id="confirmDeleteLevelBtn"
            className="btn btn-danger"
            onClick={handleConfirmDelete}
            disabled={isPending}
          >
            {isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
          </button>
        </div>
      </div>
    </div>
  );

  const modalRoot = document.getElementById('modalRoot') || document.body;
  return createPortal(modalContent, modalRoot);
}
