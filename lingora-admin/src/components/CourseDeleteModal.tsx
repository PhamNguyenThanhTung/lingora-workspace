'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CourseDto } from '@/server/courses';

export interface CourseDeleteModalProps {
  isOpen: boolean;
  targetCourse: CourseDto | null;
  triggerElement?: HTMLElement | null;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
  onForbidden?: (message?: string) => void;
  onSessionExpired: () => void;
}

export function CourseDeleteModal({
  isOpen,
  targetCourse,
  triggerElement,
  onClose,
  onSuccess,
  onForbidden,
  onSessionExpired,
}: CourseDeleteModalProps) {
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

    const focusTimer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    return () => clearTimeout(focusTimer);
  }, [isOpen, mounted, targetCourse]);

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
    if (isPendingRef.current || !targetCourse) return;

    isPendingRef.current = true;
    setIsPending(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`/api/courses/${targetCourse.id}`, {
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
        onSuccess(targetCourse.id);
        return;
      }

      const data = await response.json().catch(() => ({}));
      isPendingRef.current = false;
      setIsPending(false);

      if (data?.error?.message) {
        setErrorMsg(data.error.message);
      } else {
        setErrorMsg('Không thể xóa khóa học này. Vui lòng thử lại sau.');
      }
    } catch {
      isPendingRef.current = false;
      setIsPending(false);
      setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.');
    }
  };

  if (!isOpen || (!mounted && typeof document === 'undefined') || !targetCourse) return null;

  const displayName = targetCourse.names.vi || targetCourse.names.en || 'Khóa học';

  const modalContent = (
    <div
      id="courseDeleteModal"
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="courseDeleteModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          handleDismiss();
        }
      }}
    >
      <div className="modal-dialog" style={{ maxWidth: '480px' }} ref={modalRef}>
        <div className="modal-header">
          <h2 id="courseDeleteModalTitle" className="modal-title">
            Xác nhận xóa khóa học
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            id="btnCloseCourseDeleteModal"
            onClick={handleDismiss}
            disabled={isPending}
            aria-label="Đóng cửa sổ"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {errorMsg && (
            <div className="login-alert" role="alert" id="courseDeleteError">
              {errorMsg}
            </div>
          )}

          <p style={{ fontSize: 'var(--font-size-body)', lineHeight: 1.5 }}>
            Bạn có chắc chắn muốn xóa khóa học <strong>{displayName}</strong> khỏi hệ thống?
          </p>
          <p style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-muted)' }}>
            Hành động này sẽ xóa hoàn toàn khóa học nếu khóa học chưa có đơn vị bài học trực thuộc hoặc dữ liệu liên kết.
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            ref={cancelBtnRef}
            id="btnCancelCourseDelete"
            className="btn btn-secondary"
            onClick={handleDismiss}
            disabled={isPending}
          >
            Hủy
          </button>
          <button
            type="button"
            id="confirmDeleteCourseBtn"
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
