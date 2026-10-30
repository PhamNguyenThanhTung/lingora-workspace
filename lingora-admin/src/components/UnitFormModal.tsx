'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { UnitDto } from '@/server/units';
import type { LevelDto } from '@/server/levels';

export interface UnitFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  courseId: string;
  frameworkLevels: LevelDto[];
  levelsError?: string | null;
  onRetryLevels?: () => void;
  isLoadingLevels?: boolean;
  initialData?: UnitDto | null;
  triggerElement?: HTMLElement | null;
  onClose: () => void;
  onSuccess: (saved: UnitDto, mode: 'create' | 'edit') => void;
  onForbidden?: (message?: string) => void;
  onSessionExpired: () => void;
}

export function UnitFormModal({
  isOpen,
  mode,
  courseId,
  frameworkLevels,
  levelsError,
  onRetryLevels,
  isLoadingLevels,
  initialData,
  triggerElement,
  onClose,
  onSuccess,
  onForbidden,
  onSessionExpired,
}: UnitFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Form inputs
  const [levelId, setLevelId] = useState('');
  const [code, setCode] = useState('');
  const [position, setPosition] = useState('1');
  const [vi, setVi] = useState('');
  const [en, setEn] = useState('');

  // Field errors
  const [levelError, setLevelError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [positionError, setPositionError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const levelSelectRef = useRef<HTMLSelectElement>(null);
  const positionInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const viInputRef = useRef<HTMLInputElement>(null);
  const enInputRef = useRef<HTMLInputElement>(null);

  const isPendingRef = useRef(false);
  const frameworkLevelsRef = useRef(frameworkLevels);
  frameworkLevelsRef.current = frameworkLevels;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    isPendingRef.current = isPending;
  }, [isPending]);

  // Main form initialization / reset effect
  // Owned solely by open/close, mode, and initialData identity - NEVER by frameworkLevels array updates
  useEffect(() => {
    if (!isOpen) {
      setInitialized(false);
      isPendingRef.current = false;
      setIsPending(false);
      setLevelError(null);
      setCodeError(null);
      setPositionError(null);
      setGeneralError(null);
      setLevelId('');
      setCode('');
      setPosition('1');
      setVi('');
      setEn('');
      return;
    }

    setLevelError(null);
    setCodeError(null);
    setPositionError(null);
    setGeneralError(null);
    setIsPending(false);
    isPendingRef.current = false;

    if (mode === 'edit' && initialData) {
      setLevelId(initialData.levelId);
      setCode(initialData.code);
      setPosition(String(initialData.position));
      setVi(initialData.names.vi || '');
      setEn(initialData.names.en || '');
    } else {
      const currentLevels = frameworkLevelsRef.current;
      setLevelId(currentLevels.length > 0 ? currentLevels[0].id : '');
      setCode('');
      setPosition('1');
      setVi('');
      setEn('');
    }

    setInitialized(true);

    const timer = setTimeout(() => {
      levelSelectRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, mode, initialData]);

  // Reconcile selected levelId with authoritative frameworkLevels
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Retain selection and user inputs during loading or error states
    if (isLoadingLevels || levelsError) {
      return;
    }

    // Authoritative options are available:
    // If a levelId is selected but absent from authoritative options (including empty options), clear only the selection
    if (levelId) {
      const stillPresent = frameworkLevels.some((l) => l.id === levelId);
      if (!stillPresent) {
        setLevelId('');
      }
    }
  }, [isOpen, isLoadingLevels, levelsError, frameworkLevels, levelId]);

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
          'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
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

    setLevelError(null);
    setCodeError(null);
    setPositionError(null);
    setGeneralError(null);

    const trimmedCode = code.trim();
    const trimmedVi = vi.trim();
    const trimmedEn = en.trim();
    const numPosition = parseInt(position, 10);

    if (!levelId) {
      setLevelError('Vui lòng chọn cấp độ');
      levelSelectRef.current?.focus();
      return;
    }

    if (!trimmedCode) {
      setCodeError('Mã đơn vị không được để trống');
      codeInputRef.current?.focus();
      return;
    }

    if (isNaN(numPosition) || numPosition < 1 || String(numPosition) !== position.trim()) {
      setPositionError('Thứ tự vị trí phải là số nguyên dương (lớn hơn 0)');
      positionInputRef.current?.focus();
      return;
    }

    isPendingRef.current = true;
    setIsPending(true);

    try {
      const payload = {
        levelId,
        code: trimmedCode,
        position: numPosition,
        names: {
          vi: trimmedVi,
          en: trimmedEn,
        },
      };

      const url =
        mode === 'create'
          ? `/api/courses/${courseId}/units`
          : `/api/courses/${courseId}/units/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
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

      // Handle failure (400, 409, 503, etc.) - retain exact inputs for retry
      const data = await response.json().catch(() => ({}));
      isPendingRef.current = false;
      setIsPending(false);

      if (data?.error?.fields) {
        if (data.error.fields.levelId) {
          setLevelError(data.error.fields.levelId);
        }
        if (data.error.fields.code) {
          setCodeError(data.error.fields.code);
        }
        if (data.error.fields.position) {
          setPositionError(data.error.fields.position);
        }

        // Focus first field with error
        setTimeout(() => {
          if (data.error.fields.position) {
            positionInputRef.current?.focus();
          } else if (data.error.fields.levelId) {
            levelSelectRef.current?.focus();
          } else if (data.error.fields.code) {
            codeInputRef.current?.focus();
          } else {
            positionInputRef.current?.focus();
          }
        }, 50);
      }

      setGeneralError(data?.error?.message || 'Không thể lưu đơn vị bài học. Vui lòng thử lại.');
    } catch {
      isPendingRef.current = false;
      setIsPending(false);
      setGeneralError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.');
    }
  };

  if (!isOpen || (!mounted && typeof document === 'undefined')) return null;

  const selectedLevel = frameworkLevels.find((l) => l.id === levelId);

  const modalContent = (
    <div
      id="unitFormModal"
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unitModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          handleDismiss();
        }
      }}
    >
      <div className="modal-dialog" style={{ maxWidth: '520px' }} ref={modalRef}>
        <div className="modal-header">
          <h2 id="unitModalTitle" className="modal-title">
            {mode === 'create' ? 'Thêm đơn vị bài học' : 'Chỉnh sửa đơn vị bài học'}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            id="btnCloseUnitModal"
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
              <div className="login-alert" role="alert" id="unitFormGeneralError">
                {generalError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="selectUnitLevel" className="form-label">
                Cấp độ trong khung năng lực <span className="required-star">*</span>
              </label>
              <select
                id="selectUnitLevel"
                ref={levelSelectRef}
                className={`form-input ${levelError ? 'is-error' : ''}`}
                value={levelId}
                onChange={(e) => {
                  setLevelId(e.target.value);
                  setLevelError(null);
                }}
                disabled={isPending || isLoadingLevels}
                aria-required="true"
                aria-invalid={levelError ? 'true' : 'false'}
                aria-describedby={levelError ? 'unitLevelError' : undefined}
              >
                <option value="">
                  {isLoadingLevels
                    ? 'Đang tải danh sách cấp độ...'
                    : frameworkLevels.length === 0
                    ? '-- Không có cấp độ khả dụng --'
                    : '-- Chọn cấp độ --'}
                </option>
                {frameworkLevels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.code} (Vị trí {lvl.position}) - {lvl.label.vi || lvl.label.en || lvl.code}
                  </option>
                ))}
              </select>
              {levelError && (
                <div className="form-error-msg" id="unitLevelError" role="alert">
                  {levelError}
                </div>
              )}
              {levelsError && (
                <div className="login-alert" role="alert" style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{levelsError}</span>
                  {onRetryLevels && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      id="btnRetryUnitLevels"
                      style={{ padding: '2px 8px', height: 'auto', fontSize: '12px' }}
                      onClick={onRetryLevels}
                      disabled={isPending || isLoadingLevels}
                    >
                      {isLoadingLevels ? 'Đang thử lại...' : 'Thử lại'}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="inputUnitPosition" className="form-label">
                Thứ tự vị trí {selectedLevel ? `(trong cấp độ ${selectedLevel.code})` : ''} <span className="required-star">*</span>
              </label>
              <input
                type="number"
                id="inputUnitPosition"
                ref={positionInputRef}
                className={`form-input ${positionError ? 'is-error' : ''}`}
                value={position}
                onChange={(e) => {
                  setPosition(e.target.value);
                  setPositionError(null);
                }}
                disabled={isPending}
                min="1"
                step="1"
                placeholder="1, 2, 3..."
                aria-required="true"
                aria-invalid={positionError ? 'true' : 'false'}
                aria-describedby={positionError ? 'unitPositionError' : undefined}
              />
              {positionError && (
                <div className="form-error-msg" id="unitPositionError" role="alert">
                  {positionError}
                </div>
              )}
              <div style={{ fontSize: 'var(--font-size-ref)', color: 'var(--text-muted)', marginTop: '4px' }}>
                Thứ tự duy nhất trong phạm vi cấp độ đã chọn. Các cấp độ khác nhau có thể trùng thứ tự vị trí 1, 2, 3...
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="inputUnitCode" className="form-label">
                Mã đơn vị bài học <span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="inputUnitCode"
                ref={codeInputRef}
                className={`form-input ${codeError ? 'is-error' : ''}`}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setCodeError(null);
                }}
                disabled={isPending}
                placeholder="VD: UNIT-01, FOUNDATIONS..."
                aria-required="true"
                aria-invalid={codeError ? 'true' : 'false'}
                aria-describedby={codeError ? 'unitCodeError' : undefined}
              />
              {codeError && (
                <div className="form-error-msg" id="unitCodeError" role="alert">
                  {codeError}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="inputUnitNameVi" className="form-label">
                Tên đơn vị (Tiếng Việt)
              </label>
              <input
                type="text"
                id="inputUnitNameVi"
                ref={viInputRef}
                className="form-input"
                value={vi}
                onChange={(e) => setVi(e.target.value)}
                disabled={isPending}
                placeholder="VD: Bài 1: Làm quen và chào hỏi"
              />
            </div>

            <div className="form-group">
              <label htmlFor="inputUnitNameEn" className="form-label">
                Tên đơn vị (Tiếng Anh)
              </label>
              <input
                type="text"
                id="inputUnitNameEn"
                ref={enInputRef}
                className="form-input"
                value={en}
                onChange={(e) => setEn(e.target.value)}
                disabled={isPending}
                placeholder="VD: Unit 1: Greetings & Introductions"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              id="btnCancelUnitModal"
              onClick={handleDismiss}
              disabled={isPending}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              id="btnSubmitUnitModal"
              disabled={isPending}
            >
              {isPending
                ? mode === 'create'
                  ? 'Đang tạo...'
                  : 'Đang lưu...'
                : mode === 'create'
                ? 'Tạo đơn vị bài học'
                : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const modalRoot = document.getElementById('modalRoot') || document.body;
  return createPortal(modalContent, modalRoot);
}
