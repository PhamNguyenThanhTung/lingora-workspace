'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

export interface SessionLostModalProps {
  isOpen: boolean;
  hasSavedDraft?: boolean;
}

export function SessionLostModal({ isOpen, hasSavedDraft = false }: SessionLostModalProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const loginBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Focus strictly onto the primary login-return action button
    setTimeout(() => {
      loginBtnRef.current?.focus();
    }, 50);

    // Escape key guard: must NOT dismiss modal back to expired catalogue
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length <= 1) {
          e.preventDefault();
          focusables[0]?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleReturnToLogin = () => {
    router.push('/login?expired=1');
  };

  if (!isOpen) return null;
  if (!mounted && typeof document === 'undefined') return null;

  const modalContent = (
    <div
      id="sessionLostModal"
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sessionLostTitle"
      onClick={(e) => {
        // Prevent dismissal on backdrop click
        e.stopPropagation();
      }}
    >
      <div className="modal-dialog" style={{ maxWidth: '460px' }} ref={modalRef}>
        <div className="modal-header">
          <h2 id="sessionLostTitle" className="modal-title">
            Phiên làm việc đã hết hạn
          </h2>
        </div>
        <div className="modal-body">
          <p id="sessionLostDesc" style={{ fontSize: 'var(--font-size-body)', lineHeight: 1.5 }}>
            {hasSavedDraft
              ? 'Phiên đăng nhập đã kết thúc. Dữ liệu đang nhập đã được lưu tạm. Vui lòng đăng nhập lại để tiếp tục.'
              : 'Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại để tiếp tục.'}
          </p>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            id="sessionLoginBtn"
            ref={loginBtnRef}
            className="btn btn-primary"
            onClick={handleReturnToLogin}
            style={{ outline: '2px solid var(--border-focus)', outlineOffset: '2px' }}
          >
            Đăng nhập lại
          </button>
        </div>
      </div>
    </div>
  );

  const modalRoot = document.getElementById('modalRoot') || document.body;
  return createPortal(modalContent, modalRoot);
}
