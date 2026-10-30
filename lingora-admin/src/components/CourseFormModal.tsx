'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CourseDto } from '@/server/courses';
import type { LanguageDto } from '@/server/languages';
import type { FrameworkDto } from '@/server/frameworks';
import type { LevelDto } from '@/server/levels';

export interface CourseFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: CourseDto | null;
  triggerElement?: HTMLElement | null;
  languages?: LanguageDto[];
  frameworks?: FrameworkDto[];
  onClose: () => void;
  onSuccess: (saved: CourseDto, mode: 'create' | 'edit') => void;
  onForbidden?: (message?: string) => void;
  onSessionExpired: () => void;
}

export function CourseFormModal({
  isOpen,
  mode,
  initialData,
  triggerElement,
  languages: propLanguages,
  frameworks: propFrameworks,
  onClose,
  onSuccess,
  onForbidden,
  onSessionExpired,
}: CourseFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Form inputs
  const [languageId, setLanguageId] = useState('');
  const [frameworkId, setFrameworkId] = useState('');
  const [defaultStartLevelId, setDefaultStartLevelId] = useState('');
  const [vi, setVi] = useState('');
  const [en, setEn] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Options
  const [languagesList, setLanguagesList] = useState<LanguageDto[]>(propLanguages || []);
  const [frameworksList, setFrameworksList] = useState<FrameworkDto[]>(propFrameworks || []);
  const [levelsList, setLevelsList] = useState<LevelDto[]>([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);
  const [languagesError, setLanguagesError] = useState<string | null>(null);
  const [isLoadingFrameworks, setIsLoadingFrameworks] = useState(false);
  const [frameworksError, setFrameworksError] = useState<string | null>(null);
  const [isLoadingLevels, setIsLoadingLevels] = useState(false);
  const [levelsError, setLevelsError] = useState<string | null>(null);

  // Errors & Pending
  const [languageError, setLanguageError] = useState<string | null>(null);
  const [frameworkError, setFrameworkError] = useState<string | null>(null);
  const [levelError, setLevelError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Refs for focus and pending lock
  const modalRef = useRef<HTMLDivElement>(null);
  const languageSelectRef = useRef<HTMLSelectElement>(null);
  const frameworkSelectRef = useRef<HTMLSelectElement>(null);
  const levelSelectRef = useRef<HTMLSelectElement>(null);
  const viInputRef = useRef<HTMLInputElement>(null);
  const enInputRef = useRef<HTMLInputElement>(null);

  const isPendingRef = useRef(false);
  const levelFetchSeqRef = useRef(0);
  const currentFrameworkRef = useRef('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    isPendingRef.current = isPending;
  }, [isPending]);

  const fetchLanguages = async () => {
    setIsLoadingLanguages(true);
    setLanguagesError(null);
    try {
      const res = await fetch('/api/languages', { headers: { Origin: window.location.origin } });
      if (res.status === 401) {
        setIsLoadingLanguages(false);
        onSessionExpired();
        return;
      }
      if (res.status === 403) {
        setIsLoadingLanguages(false);
        const data = await res.json().catch(() => ({}));
        onClose();
        if (onForbidden) onForbidden(data?.error?.message || 'Bạn không có quyền truy cập danh sách ngôn ngữ.');
        return;
      }
      if (!res.ok) {
        setIsLoadingLanguages(false);
        setLanguagesError('Không thể tải danh sách ngôn ngữ.');
        return;
      }
      const data = await res.json();
      setLanguagesList(data?.data || []);
      setIsLoadingLanguages(false);
    } catch {
      setIsLoadingLanguages(false);
      setLanguagesError('Lỗi kết nối khi tải danh sách ngôn ngữ.');
    }
  };

  const fetchFrameworks = async () => {
    setIsLoadingFrameworks(true);
    setFrameworksError(null);
    try {
      const res = await fetch('/api/frameworks', { headers: { Origin: window.location.origin } });
      if (res.status === 401) {
        setIsLoadingFrameworks(false);
        onSessionExpired();
        return;
      }
      if (res.status === 403) {
        setIsLoadingFrameworks(false);
        const data = await res.json().catch(() => ({}));
        onClose();
        if (onForbidden) onForbidden(data?.error?.message || 'Bạn không có quyền truy cập danh sách khung năng lực.');
        return;
      }
      if (!res.ok) {
        setIsLoadingFrameworks(false);
        setFrameworksError('Không thể tải danh sách khung năng lực.');
        return;
      }
      const data = await res.json();
      setFrameworksList(data?.data || []);
      setIsLoadingFrameworks(false);
    } catch {
      setIsLoadingFrameworks(false);
      setFrameworksError('Lỗi kết nối khi tải danh sách khung năng lực.');
    }
  };

  // Fetch languages & frameworks options if not provided
  useEffect(() => {
    if (!isOpen) return;

    if (!propLanguages || propLanguages.length === 0) {
      fetchLanguages();
    } else {
      setLanguagesList(propLanguages);
    }

    if (!propFrameworks || propFrameworks.length === 0) {
      fetchFrameworks();
    } else {
      setFrameworksList(propFrameworks);
    }
  }, [isOpen, propLanguages, propFrameworks]);

  // Reset or initialize form on open/close
  useEffect(() => {
    if (!isOpen) {
      levelFetchSeqRef.current++;
      currentFrameworkRef.current = '';
      setInitialized(false);
      isPendingRef.current = false;
      setIsPending(false);
      setLanguageError(null);
      setFrameworkError(null);
      setLevelError(null);
      setGeneralError(null);
      setLevelsList([]);
      setLanguagesError(null);
      setFrameworksError(null);
      setLevelsError(null);
      setIsLoadingLanguages(false);
      setIsLoadingFrameworks(false);
      setIsLoadingLevels(false);
      setLanguageId('');
      setFrameworkId('');
      setDefaultStartLevelId('');
      setVi('');
      setEn('');
      setIsActive(true);
      return;
    }

    setLanguageError(null);
    setFrameworkError(null);
    setLevelError(null);
    setGeneralError(null);
    setIsPending(false);
    isPendingRef.current = false;

    if (mode === 'edit' && initialData) {
      setLanguageId(initialData.languageId);
      setFrameworkId(initialData.frameworkId);
      currentFrameworkRef.current = initialData.frameworkId;
      setDefaultStartLevelId(initialData.defaultStartLevelId);
      setVi(initialData.names.vi || '');
      setEn(initialData.names.en || '');
      setIsActive(initialData.isActive);

      // Load levels for the framework
      fetchLevelsForFramework(initialData.frameworkId, initialData.defaultStartLevelId);
    } else {
      currentFrameworkRef.current = '';
      setLanguageId('');
      setFrameworkId('');
      setDefaultStartLevelId('');
      setVi('');
      setEn('');
      setIsActive(true);
      setLevelsList([]);
    }

    setInitialized(true);

    const timer = setTimeout(() => {
      viInputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, mode, initialData]);

  const fetchLevelsForFramework = async (fId: string, preselectedLevelId?: string) => {
    if (!fId) {
      levelFetchSeqRef.current++;
      setLevelsList([]);
      setIsLoadingLevels(false);
      setLevelsError(null);
      return;
    }

    const currentSeq = ++levelFetchSeqRef.current;
    setIsLoadingLevels(true);
    setLevelsError(null);

    try {
      const res = await fetch(`/api/frameworks/${fId}/levels`, {
        headers: { Origin: window.location.origin },
      });

      if (currentSeq !== levelFetchSeqRef.current || currentFrameworkRef.current !== fId) {
        return; // Stale response ignored
      }

      if (res.status === 401) {
        setIsLoadingLevels(false);
        onSessionExpired();
        return;
      }

      if (res.status === 403) {
        setIsLoadingLevels(false);
        const data = await res.json().catch(() => ({}));
        onClose();
        if (onForbidden) onForbidden(data?.error?.message || 'Bạn không có quyền xem danh sách cấp độ.');
        return;
      }

      if (!res.ok) {
        setLevelsError('Không thể tải danh sách cấp độ của khung này.');
        setIsLoadingLevels(false);
        return;
      }

      const json = await res.json();
      if (currentSeq !== levelFetchSeqRef.current || currentFrameworkRef.current !== fId) return;

      const levels: LevelDto[] = json.data || [];
      setLevelsList(levels);
      setIsLoadingLevels(false);

      if (preselectedLevelId && levels.some((l) => l.id === preselectedLevelId)) {
        setDefaultStartLevelId(preselectedLevelId);
      }
    } catch {
      if (currentSeq !== levelFetchSeqRef.current || currentFrameworkRef.current !== fId) return;
      setLevelsError('Lỗi kết nối khi tải cấp độ.');
      setIsLoadingLevels(false);
    }
  };

  const handleFrameworkChange = (newFrameworkId: string) => {
    currentFrameworkRef.current = newFrameworkId;
    levelFetchSeqRef.current++; // Invalidate pending level fetch!
    setFrameworkId(newFrameworkId);
    setFrameworkError(null);
    setLevelError(null);
    setLevelsError(null);
    setDefaultStartLevelId(''); // Immediately clear stale level selection!

    if (newFrameworkId) {
      fetchLevelsForFramework(newFrameworkId);
    } else {
      setLevelsList([]);
      setIsLoadingLevels(false);
    }
  };

  // Focus trap & Escape handling
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

    setLanguageError(null);
    setFrameworkError(null);
    setLevelError(null);
    setGeneralError(null);

    const trimmedVi = vi.trim();
    const trimmedEn = en.trim();

    if (!languageId) {
      setLanguageError('Vui lòng chọn ngôn ngữ học');
      languageSelectRef.current?.focus();
      return;
    }

    if (!frameworkId) {
      setFrameworkError('Vui lòng chọn khung năng lực');
      frameworkSelectRef.current?.focus();
      return;
    }

    if (!defaultStartLevelId) {
      setLevelError('Vui lòng chọn cấp độ bắt đầu mặc định');
      levelSelectRef.current?.focus();
      return;
    }

    isPendingRef.current = true;
    setIsPending(true);

    try {
      const payload = {
        languageId,
        frameworkId,
        defaultStartLevelId,
        names: {
          vi: trimmedVi,
          en: trimmedEn,
        },
        isActive,
      };

      const url = mode === 'create' ? '/api/courses' : `/api/courses/${initialData?.id}`;
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

      // Failure handling (400, 409, 503, etc.) - retain exact inputs for retry
      const data = await response.json().catch(() => ({}));
      isPendingRef.current = false;
      setIsPending(false);

      if (data?.error?.fields) {
        if (data.error.fields.languageId) {
          setLanguageError(data.error.fields.languageId);
        }
        if (data.error.fields.frameworkId) {
          setFrameworkError(data.error.fields.frameworkId);
        }
        if (data.error.fields.defaultStartLevelId) {
          setLevelError(data.error.fields.defaultStartLevelId);
        }
        // Focus first field with error
        setTimeout(() => {
          if (data.error.fields.languageId) {
            languageSelectRef.current?.focus();
          } else if (data.error.fields.frameworkId) {
            frameworkSelectRef.current?.focus();
          } else if (data.error.fields.defaultStartLevelId) {
            levelSelectRef.current?.focus();
          } else {
            viInputRef.current?.focus();
          }
        }, 50);
      }

      setGeneralError(data?.error?.message || 'Không thể lưu khóa học. Vui lòng thử lại.');
    } catch {
      isPendingRef.current = false;
      setIsPending(false);
      setGeneralError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.');
    }
  };

  if (!isOpen || (!mounted && typeof document === 'undefined')) return null;

  const modalContent = (
    <div
      id="courseFormModal"
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="courseModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          handleDismiss();
        }
      }}
    >
      <div className="modal-dialog" style={{ maxWidth: '520px' }} ref={modalRef}>
        <div className="modal-header">
          <h2 id="courseModalTitle" className="modal-title">
            {mode === 'create' ? 'Thêm khóa học mới' : 'Chỉnh sửa khóa học'}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            id="btnCloseCourseModal"
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
              <div className="login-alert" role="alert" id="courseFormGeneralError">
                {generalError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="inputCourseNameVi" className="form-label">
                Tên khóa học (Tiếng Việt)
              </label>
              <input
                type="text"
                id="inputCourseNameVi"
                ref={viInputRef}
                className="form-input"
                value={vi}
                onChange={(e) => setVi(e.target.value)}
                disabled={isPending}
                placeholder="VD: Tiếng Anh cơ bản"
              />
            </div>

            <div className="form-group">
              <label htmlFor="inputCourseNameEn" className="form-label">
                Tên khóa học (Tiếng Anh)
              </label>
              <input
                type="text"
                id="inputCourseNameEn"
                ref={enInputRef}
                className="form-input"
                value={en}
                onChange={(e) => setEn(e.target.value)}
                disabled={isPending}
                placeholder="VD: Basic English"
              />
            </div>

            <div className="form-group">
              <label htmlFor="selectCourseLanguage" className="form-label">
                Ngôn ngữ học <span className="required-star">*</span>
              </label>
              <select
                id="selectCourseLanguage"
                ref={languageSelectRef}
                className={`form-input ${languageError ? 'is-error' : ''}`}
                value={languageId}
                onChange={(e) => {
                  setLanguageId(e.target.value);
                  setLanguageError(null);
                }}
                disabled={isPending || isLoadingLanguages}
                aria-required="true"
                aria-invalid={languageError ? 'true' : 'false'}
                aria-describedby={languageError ? 'courseLanguageError' : undefined}
              >
                <option value="">
                  {isLoadingLanguages
                    ? 'Đang tải danh sách ngôn ngữ...'
                    : languagesList.length === 0
                    ? '-- Không có ngôn ngữ khả dụng --'
                    : '-- Chọn ngôn ngữ học --'}
                </option>
                {languagesList.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.names.vi || lang.names.en || lang.code} ({lang.code})
                  </option>
                ))}
              </select>
              {languageError && (
                <div className="form-error-msg" id="courseLanguageError" role="alert">
                  {languageError}
                </div>
              )}
              {languagesError && (
                <div className="login-alert" role="alert" style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{languagesError}</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    id="btnRetryCourseLanguages"
                    style={{ padding: '2px 8px', height: 'auto', fontSize: '12px' }}
                    onClick={fetchLanguages}
                  >
                    Thử lại
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="selectCourseFramework" className="form-label">
                Khung năng lực <span className="required-star">*</span>
              </label>
              <select
                id="selectCourseFramework"
                ref={frameworkSelectRef}
                className={`form-input ${frameworkError ? 'is-error' : ''}`}
                value={frameworkId}
                onChange={(e) => handleFrameworkChange(e.target.value)}
                disabled={isPending || isLoadingFrameworks}
                aria-required="true"
                aria-invalid={frameworkError ? 'true' : 'false'}
                aria-describedby={frameworkError ? 'courseFrameworkError' : undefined}
              >
                <option value="">
                  {isLoadingFrameworks
                    ? 'Đang tải danh sách khung năng lực...'
                    : frameworksList.length === 0
                    ? '-- Không có khung năng lực khả dụng --'
                    : '-- Chọn khung năng lực --'}
                </option>
                {frameworksList.map((fw) => (
                  <option key={fw.id} value={fw.id}>
                    {fw.code} (v{fw.version}) - {fw.names.vi || fw.names.en || fw.code}
                  </option>
                ))}
              </select>
              {frameworkError && (
                <div className="form-error-msg" id="courseFrameworkError" role="alert">
                  {frameworkError}
                </div>
              )}
              {frameworksError && (
                <div className="login-alert" role="alert" style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{frameworksError}</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    id="btnRetryCourseFrameworks"
                    style={{ padding: '2px 8px', height: 'auto', fontSize: '12px' }}
                    onClick={fetchFrameworks}
                  >
                    Thử lại
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="selectCourseDefaultStartLevel" className="form-label">
                Cấp độ bắt đầu mặc định <span className="required-star">*</span>
              </label>
              <select
                id="selectCourseDefaultStartLevel"
                ref={levelSelectRef}
                className={`form-input ${levelError ? 'is-error' : ''}`}
                value={defaultStartLevelId}
                onChange={(e) => {
                  setDefaultStartLevelId(e.target.value);
                  setLevelError(null);
                }}
                disabled={isPending || !frameworkId || isLoadingLevels}
                aria-required="true"
                aria-invalid={levelError ? 'true' : 'false'}
                aria-describedby={levelError ? 'courseLevelError' : undefined}
              >
                <option value="">
                  {isLoadingLevels
                    ? 'Đang tải danh sách cấp độ...'
                    : !frameworkId
                    ? '-- Vui lòng chọn khung năng lực trước --'
                    : levelsList.length === 0
                    ? '-- Khung không có cấp độ khả dụng --'
                    : '-- Chọn cấp độ bắt đầu --'}
                </option>
                {levelsList.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.code} (Vị trí {lvl.position}) - {lvl.label.vi || lvl.label.en || lvl.code}
                  </option>
                ))}
              </select>
              {levelError && (
                <div className="form-error-msg" id="courseLevelError" role="alert">
                  {levelError}
                </div>
              )}
              {levelsError && (
                <div className="login-alert" role="alert" style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{levelsError}</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    id="btnRetryCourseLevels"
                    style={{ padding: '2px 8px', height: 'auto', fontSize: '12px' }}
                    onClick={() => fetchLevelsForFramework(frameworkId, defaultStartLevelId)}
                  >
                    Thử lại
                  </button>
                </div>
              )}
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="checkboxCourseIsActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isPending}
                style={{ width: '18px', height: '18px', cursor: isPending ? 'not-allowed' : 'pointer' }}
              />
              <label htmlFor="checkboxCourseIsActive" style={{ cursor: isPending ? 'not-allowed' : 'pointer', fontSize: 'var(--font-size-sub)' }}>
                Kích hoạt khóa học (cho phép học viên truy cập)
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              id="btnCancelCourseModal"
              onClick={handleDismiss}
              disabled={isPending}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              id="btnSubmitCourseModal"
              disabled={isPending}
            >
              {isPending
                ? mode === 'create'
                  ? 'Đang tạo...'
                  : 'Đang lưu...'
                : mode === 'create'
                ? 'Tạo khóa học'
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
