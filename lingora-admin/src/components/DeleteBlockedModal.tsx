'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LanguageDto } from '@/server/languages';

export interface DeleteBlockedModalProps {
  isOpen: boolean;
  blockedLanguage: LanguageDto | null;
  triggerElement?: HTMLElement | null;
  onClose: () => void;
}

export function DeleteBlockedModal({
  isOpen,
  blockedLanguage,
  triggerElement,
  onClose,
}: DeleteBlockedModalProps) {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => closeBtnRef.current?.focus(), 50);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
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
  }, [isOpen, triggerElement]);

  const handleDismiss = () => {
    onClose();
    setTimeout(() => {
      if (triggerElement && typeof triggerElement.focus === 'function') {
        triggerElement.focus();
      }
    }, 50);
  };

  if (!isOpen || (!mounted && typeof document === 'undefined') || !blockedLanguage) return null;

  const displayName = blockedLanguage.names.vi || blockedLanguage.code;

  const modalContent = (
    <div
      id="deleteBlockedModal"
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="blockedModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleDismiss();
        }
      }}
    >
      <div className="modal-dialog" style={{ maxWidth: '480px' }} ref={modalRef}>
        <div className="modal-header">
          <h2 id="blockedModalTitle" className="modal-title">
            Không thể xóa ngôn ngữ
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleDismiss}
            aria-label="Đóng cửa sổ"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p id="deleteBlockedMessage" style={{ fontSize: 'var(--font-size-body)', lineHeight: 1.5 }}>
            Ngôn ngữ <strong>{displayName} ({blockedLanguage.code})</strong> đang được sử dụng trong các khóa học hoặc tài khoản người dùng.
          </p>
          <p style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-muted)', marginTop: '8px' }}>
            Hệ thống áp dụng ràng buộc toàn vẹn dữ liệu: không thể xóa ngôn ngữ đã phát sinh dữ liệu liên kết. Bạn có thể vô hiệu hóa trạng thái &ldquo;Có thể học&rdquo; hoặc &ldquo;Dùng làm ngôn ngữ giao diện&rdquo; thay thế.
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            ref={closeBtnRef}
            id="closeBlockedModalBtn"
            className="btn btn-secondary"
            onClick={handleDismiss}
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );

  const modalRoot = document.getElementById('modalRoot') || document.body;
  return createPortal(modalContent, modalRoot);
}
