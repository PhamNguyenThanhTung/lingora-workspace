'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type {
  LearnerContextEnvelope,
  LearningContextSummaryDto,
  ContextOptionsData,
  CourseOptionDto,
} from '../../server/context/dto.ts';
import type { LoadLearnerContextResult } from '../../server/context/loader.ts';

interface HomeViewProps {
  data?: LearnerContextEnvelope['data'];
  errorState?: Extract<LoadLearnerContextResult, { ok: false }>;
}

function getLocalizedText(obj: unknown, locale = 'vi'): string {
  if (!obj || typeof obj !== 'object') return '';
  const record = obj as Record<string, string>;
  return record[locale] || record['vi'] || record['en'] || Object.values(record)[0] || '';
}

function generateContextId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function HomeView({ data, errorState }: HomeViewProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRetrying, startRetry] = useTransition();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  // Authoritative contexts state
  const [contexts, setContexts] = useState<LearningContextSummaryDto[]>(data?.contexts || []);

  useEffect(() => {
    if (data?.contexts) {
      setContexts(data.contexts);
    }
  }, [data]);

  // Context creation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createOperationId, setCreateOperationId] = useState(() => generateContextId());
  const [selectedLanguageId, setSelectedLanguageId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [startSource, setStartSource] = useState<'DEFAULT' | 'SELF_REPORT'>('DEFAULT');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [options, setOptions] = useState<ContextOptionsData | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<{ code: string; message: string; status: number } | null>(null);

  // Context lifecycle actions state (pause/resume)
  const [pendingContexts, setPendingContexts] = useState<Record<string, boolean>>({});
  const [contextErrors, setContextErrors] = useState<
    Record<string, { code: string; message: string; status: number }>
  >({});

  // Context recovery state (start level selection for existing null contexts)
  const [recoveringContextId, setRecoveringContextId] = useState<string | null>(null);
  const [recoveringSource, setRecoveringSource] = useState<'DEFAULT' | 'SELF_REPORT'>('DEFAULT');
  const [recoveringLevelId, setRecoveringLevelId] = useState<string>('');
  const [isRecovering, setIsRecovering] = useState<boolean>(false);

  const handleOpenStartLevel = (ctx: LearningContextSummaryDto) => {
    setRecoveringContextId(ctx.id);
    setRecoveringSource('DEFAULT');
    setRecoveringLevelId('');
    if (!options && !isLoadingOptions) {
      fetchOptions();
    }
  };

  const handleCancelStartLevel = () => {
    setRecoveringContextId(null);
    setRecoveringSource('DEFAULT');
    setRecoveringLevelId('');
  };

  const handleConfirmStartLevel = async (ctx: LearningContextSummaryDto) => {
    if (isRecovering) return;
    if (recoveringSource === 'SELF_REPORT' && !recoveringLevelId) {
      setContextErrors((prev) => ({
        ...prev,
        [ctx.id]: {
          code: 'VALIDATION_ERROR',
          message: 'Vui lòng chọn trình độ khởi điểm.',
          status: 400,
        },
      }));
      return;
    }

    setIsRecovering(true);
    setContextErrors((prev) => {
      const next = { ...prev };
      delete next[ctx.id];
      return next;
    });

    const payload =
      recoveringSource === 'DEFAULT'
        ? {
            startSource: 'DEFAULT',
            expectedRowVersion: ctx.rowVersion,
          }
        : {
            startSource: 'SELF_REPORT',
            levelId: recoveringLevelId,
            expectedRowVersion: ctx.rowVersion,
          };

    try {
      const response = await fetch(`/api/learner/contexts/${ctx.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const json = await response.json();

      if (!response.ok) {
        setContextErrors((prev) => ({
          ...prev,
          [ctx.id]: {
            code: json.error?.code || 'ERROR',
            message: json.error?.message || 'Không thể chọn trình độ bắt đầu.',
            status: response.status,
          },
        }));
        return;
      }

      const updated: LearningContextSummaryDto = json.data;
      setContexts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setRecoveringContextId(null);
    } catch {
      setContextErrors((prev) => ({
        ...prev,
        [ctx.id]: {
          code: 'NETWORK_ERROR',
          message: 'Lỗi kết nối mạng khi chọn trình độ. Vui lòng thử lại.',
          status: 0,
        },
      }));
    } finally {
      setIsRecovering(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Origin: window.location.origin,
        },
      });
      if (!response.ok) throw new Error('Logout failed');
      router.push('/login');
      router.refresh();
    } catch {
      setLogoutError('Chưa thể đăng xuất. Vui lòng thử lại.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleRetry = () => {
    startRetry(() => router.refresh());
  };

  const [optionsFetchAttempted, setOptionsFetchAttempted] = useState(false);

  // Fetch options for creation form
  const fetchOptions = async () => {
    setIsLoadingOptions(true);
    setOptionsError(null);
    try {
      const response = await fetch('/api/learner/context/options');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (!response.ok) {
        let msg = 'Không thể tải danh sách khóa học.';
        try {
          const errJson = await response.json();
          if (errJson?.error?.message) {
            msg = errJson.error.message;
          }
        } catch {
          // ignore json parse error
        }
        throw new Error(msg);
      }
      const json = await response.json();
      const optionsData: ContextOptionsData = json.data;
      setOptions(optionsData);
      setOptionsError(null);

      // Auto-select first available unowned language and course if not yet selected
      if (optionsData.languages.length > 0 && !selectedLanguageId) {
        const unownedLang = optionsData.languages.find(
          (l) => !contexts.some((c) => c.targetLanguage.id.toLowerCase() === l.id.toLowerCase())
        );
        const firstLang = unownedLang || optionsData.languages[0];
        setSelectedLanguageId(firstLang.id);
        if (firstLang.courses.length > 0) {
          const firstCourse = firstLang.courses[0];
          setSelectedCourseId(firstCourse.id);
          if (firstCourse.defaultLevelId) {
            setSelectedLevelId(firstCourse.defaultLevelId);
          } else if (firstCourse.levels.length > 0) {
            setSelectedLevelId(firstCourse.levels[0].id);
          }
        }
      }
    } catch (err: any) {
      setOptionsError(err.message || 'Lỗi khi tải tùy chọn khóa học.');
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleRetryOptions = () => {
    setOptionsError(null);
    fetchOptions();
  };

  useEffect(() => {
    // 1. Never fetch options on error/denied states or when no data is loaded
    if (errorState || !data) return;

    // 2. Active count check: at most two active contexts
    const currentActiveCount = contexts.filter((c) => c.status === 'ACTIVE').length;
    const canCreate = currentActiveCount < 2;
    const isVisibleCreateFlow = (contexts.length === 0 || showCreateForm) && canCreate;

    // 3. Stable options error after a single failed automatic fetch, explicit user retry
    if (isVisibleCreateFlow && !options && !isLoadingOptions && !optionsError && !optionsFetchAttempted) {
      setOptionsFetchAttempted(true);
      fetchOptions();
    }
  }, [errorState, data, contexts, showCreateForm, options, isLoadingOptions, optionsError, optionsFetchAttempted]);

  // Handle language change in form
  const handleLanguageChange = (langId: string) => {
    setSelectedLanguageId(langId);
    setCreateError(null);
    const lang = options?.languages.find((l) => l.id === langId);
    if (lang && lang.courses.length > 0) {
      const firstCourse = lang.courses[0];
      setSelectedCourseId(firstCourse.id);
      setStartSource('DEFAULT');
      if (firstCourse.defaultLevelId) {
        setSelectedLevelId(firstCourse.defaultLevelId);
      } else if (firstCourse.levels.length > 0) {
        setSelectedLevelId(firstCourse.levels[0].id);
      } else {
        setSelectedLevelId('');
      }
    } else {
      setSelectedCourseId('');
      setSelectedLevelId('');
    }
  };

  // Handle course change in form
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCreateError(null);
    const selectedCourse = currentCourses.find((c) => c.id === courseId);
    setStartSource('DEFAULT');
    if (selectedCourse?.defaultLevelId) {
      setSelectedLevelId(selectedCourse.defaultLevelId);
    } else if (selectedCourse && selectedCourse.levels.length > 0) {
      setSelectedLevelId(selectedCourse.levels[0].id);
    } else {
      setSelectedLevelId('');
    }
  };

  // Handle form submission
  const handleCreateContext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating || !selectedLanguageId || !selectedCourseId) return;

    if (startSource === 'SELF_REPORT' && !selectedLevelId) {
      setCreateError({
        code: 'VALIDATION_ERROR',
        message: 'Vui lòng chọn trình độ khởi điểm.',
        status: 400,
      });
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    const payload =
      startSource === 'DEFAULT'
        ? {
            contextId: createOperationId,
            languageId: selectedLanguageId,
            courseId: selectedCourseId,
            startSource: 'DEFAULT',
          }
        : {
            contextId: createOperationId,
            languageId: selectedLanguageId,
            courseId: selectedCourseId,
            startSource: 'SELF_REPORT',
            levelId: selectedLevelId,
          };

    try {
      const response = await fetch('/api/learner/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const json = await response.json();

      if (!response.ok) {
        setCreateError({
          code: json.error?.code || 'ERROR',
          message: json.error?.message || 'Không thể tạo lộ trình học.',
          status: response.status,
        });
        return;
      }

      // Authoritative reconciliation: add/replace created context
      const created: LearningContextSummaryDto = json.data;
      setContexts((prev) => {
        const index = prev.findIndex((c) => c.id === created.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = created;
          return next;
        }
        return [...prev, created];
      });

      // Generate a new operation ID for future operations only after success
      setCreateOperationId(generateContextId());
      setShowCreateForm(false);
      setCreateError(null);
    } catch {
      setCreateError({
        code: 'NETWORK_ERROR',
        message: 'Lỗi kết nối mạng. Vui lòng thử lại.',
        status: 0,
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Pause
  const handlePause = async (ctx: LearningContextSummaryDto) => {
    if (pendingContexts[ctx.id]) return;
    setPendingContexts((prev) => ({ ...prev, [ctx.id]: true }));
    setContextErrors((prev) => {
      const next = { ...prev };
      delete next[ctx.id];
      return next;
    });

    try {
      const response = await fetch(`/api/learner/contexts/${ctx.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'PAUSED',
          expectedRowVersion: ctx.rowVersion,
        }),
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const json = await response.json();

      if (!response.ok) {
        setContextErrors((prev) => ({
          ...prev,
          [ctx.id]: {
            code: json.error?.code || 'ERROR',
            message: json.error?.message || 'Không thể tạm dừng lộ trình học.',
            status: response.status,
          },
        }));
        return;
      }

      // Authoritative reconciliation
      const updated: LearningContextSummaryDto = json.data;
      setContexts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch {
      setContextErrors((prev) => ({
        ...prev,
        [ctx.id]: {
          code: 'NETWORK_ERROR',
          message: 'Lỗi kết nối mạng khi tạm dừng. Vui lòng thử lại.',
          status: 0,
        },
      }));
    } finally {
      setPendingContexts((prev) => ({ ...prev, [ctx.id]: false }));
    }
  };

  // Handle Resume
  const handleResume = async (ctx: LearningContextSummaryDto) => {
    if (pendingContexts[ctx.id]) return;
    setPendingContexts((prev) => ({ ...prev, [ctx.id]: true }));
    setContextErrors((prev) => {
      const next = { ...prev };
      delete next[ctx.id];
      return next;
    });

    try {
      const response = await fetch(`/api/learner/contexts/${ctx.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ACTIVE',
          expectedRowVersion: ctx.rowVersion,
        }),
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const json = await response.json();

      if (!response.ok) {
        setContextErrors((prev) => ({
          ...prev,
          [ctx.id]: {
            code: json.error?.code || 'ERROR',
            message: json.error?.message || 'Không thể tiếp tục lộ trình học.',
            status: response.status,
          },
        }));
        return;
      }

      // Authoritative reconciliation
      const updated: LearningContextSummaryDto = json.data;
      setContexts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch {
      setContextErrors((prev) => ({
        ...prev,
        [ctx.id]: {
          code: 'NETWORK_ERROR',
          message: 'Lỗi kết nối mạng khi tiếp tục. Vui lòng thử lại.',
          status: 0,
        },
      }));
    } finally {
      setPendingContexts((prev) => ({ ...prev, [ctx.id]: false }));
    }
  };

  // Header shared across states
  const renderHeader = (identityNode?: React.ReactNode) => (
    <>
      <header className="app-header">
        <div className="brand-section">
          <span className="brand-title">Lingora</span>
          <span className="badge badge-active">Học viên</span>
        </div>
        <div className="user-nav" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <a
            href="/review"
            id="reviewNavBtn"
            className="btn btn-outline"
            style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '14px', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            Ôn từ vựng
          </a>
          {identityNode}
          <button
            type="button"
            id="logoutBtn"
            className="btn btn-outline"
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
          </button>
        </div>
      </header>
      {logoutError && (
        <p id="logoutAlert" role="alert" className="login-alert">
          {logoutError}
        </p>
      )}
    </>
  );

  // Error / Denial States (403, 409, 503)
  if (errorState) {
    const isForbidden = errorState.status === 403;
    const isServiceUnavailable = errorState.status === 503;
    const isInconsistent = errorState.status === 409;

    return (
      <div id="homeView" className="app-container">
        {renderHeader()}
        <main className="content-area">
          <div
            id="errorBox"
            className={`alert-box ${
              isForbidden ? 'is-danger' : isInconsistent ? 'is-warning' : 'is-warning'
            }`}
            role="alert"
          >
            <h1 className={`alert-title ${isForbidden ? 'danger' : 'warning'}`}>
              {isForbidden
                ? 'Truy cập bị từ chối'
                : isInconsistent
                ? 'Dữ liệu không nhất quán'
                : 'Dịch vụ tạm thời không khả dụng'}
            </h1>
            <p className="alert-message">{errorState.error.message}</p>
            <div className="alert-actions">
              {(isServiceUnavailable || isInconsistent) && (
                <button
                  type="button"
                  id="retryBtn"
                  className="btn btn-primary"
                  onClick={handleRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? 'Đang thử lại...' : 'Thử lại'}
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { learner } = data;
  const uiLocale = learner.uiLocale || 'vi';

  // Derived options for current selection
  const currentLanguage = options?.languages.find((l) => l.id === selectedLanguageId);
  const currentCourses: CourseOptionDto[] = currentLanguage?.courses || [];
  const currentCourse = currentCourses.find((c) => c.id === selectedCourseId);
  const eligibleLevels = currentCourse?.levels || [];
  const defaultLevel = eligibleLevels.find((l) => l.id === currentCourse?.defaultLevelId);

  // Active contexts count
  const activeCount = contexts.filter((c) => c.status === 'ACTIVE').length;

  const renderCreateForm = () => (
    <div
      id="createContextSection"
      style={{
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '8px',
        padding: '20px',
        marginTop: '16px',
        backgroundColor: 'var(--card-bg, #ffffff)',
      }}
    >
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>
        Tạo lộ trình học mới
      </h2>

      {isLoadingOptions && (
        <p style={{ color: 'var(--text-muted)' }}>Đang tải danh sách ngôn ngữ và khóa học...</p>
      )}

      {optionsError && (
        <div id="optionsErrorAlert" role="alert" className="login-alert" style={{ marginBottom: '12px' }}>
          <span>{optionsError}</span>
          <button
            type="button"
            id="retryOptionsBtn"
            className="btn btn-outline"
            style={{ marginLeft: '12px' }}
            onClick={handleRetryOptions}
          >
            Thử lại tải tùy chọn
          </button>
        </div>
      )}

      {options && (
        <form id="createContextForm" onSubmit={handleCreateContext}>
          {/* Language selector */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="createLanguageSelect"
              style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}
            >
              Ngôn ngữ mục tiêu
            </label>
            <select
              id="createLanguageSelect"
              className="form-control"
              value={selectedLanguageId}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={isCreating}
              style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
            >
              {options.languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {getLocalizedText(l.names, uiLocale) || l.code} ({l.code})
                </option>
              ))}
            </select>
          </div>

          {/* Course selector */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="createCourseSelect"
              style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}
            >
              Khóa học
            </label>
            {currentCourses.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Chưa có khóa học nào cho ngôn ngữ này.</p>
            ) : (
              <select
                id="createCourseSelect"
                className="form-control"
                value={selectedCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                disabled={isCreating}
                style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
              >
                {currentCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getLocalizedText(c.names, uiLocale)} - Khung {c.framework.code}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Starting point controls */}
          {currentCourse && (
            <div style={{ marginBottom: '16px' }}>
              <span style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
                Điểm khởi đầu học tập
              </span>

              {/* DEFAULT radio */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    id="startSourceDefault"
                    name="startSource"
                    value="DEFAULT"
                    checked={startSource === 'DEFAULT'}
                    onChange={() => setStartSource('DEFAULT')}
                    disabled={isCreating}
                    style={{ marginRight: '8px', marginTop: '4px' }}
                  />
                  <div>
                    <span style={{ fontWeight: 500 }}>
                      Bắt đầu mặc định (Dự kiến:{' '}
                      {defaultLevel
                        ? `${defaultLevel.code} - ${getLocalizedText(defaultLevel.label, uiLocale)}`
                        : 'Chưa có nội dung - Đang cập nhật'}
                      )
                    </span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      Bắt đầu từ trình độ có bài học đầu tiên trong chương trình học.
                    </p>
                  </div>
                </label>
              </div>

              {/* SELF_REPORT radio */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    id="startSourceSelfReport"
                    name="startSource"
                    value="SELF_REPORT"
                    checked={startSource === 'SELF_REPORT'}
                    onChange={() => setStartSource('SELF_REPORT')}
                    disabled={isCreating || eligibleLevels.length === 0}
                    style={{ marginRight: '8px', marginTop: '4px' }}
                  />
                  <div>
                    <span style={{ fontWeight: 500 }}>
                      Tự đánh giá trình độ (Chưa kiểm chứng)
                    </span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      Chọn trực tiếp trình độ năng lực bạn tự tin để bắt đầu học.
                    </p>
                  </div>
                </label>
              </div>

              {/* Level selector if SELF_REPORT */}
              {startSource === 'SELF_REPORT' && (
                <div style={{ marginLeft: '24px', marginTop: '8px' }}>
                  {eligibleLevels.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Khóa học này hiện chưa có trình độ nào có bài học phát hành để tự chọn.
                    </p>
                  ) : (
                    <select
                      id="createLevelSelect"
                      className="form-control"
                      value={selectedLevelId}
                      onChange={(e) => setSelectedLevelId(e.target.value)}
                      disabled={isCreating}
                      style={{ padding: '6px 12px', borderRadius: '4px' }}
                    >
                      {eligibleLevels.map((lvl) => (
                        <option key={lvl.id} value={lvl.id}>
                          {lvl.code} - {getLocalizedText(lvl.label, uiLocale)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error and Alert */}
          {createError && (
            <div
              id="createContextAlert"
              role="alert"
              className="login-alert"
              style={{ marginBottom: '16px' }}
            >
              <span>{createError.message}</span>
              {createError.status === 409 && (
                <button
                  type="button"
                  id="createReloadBtn"
                  className="btn btn-outline"
                  style={{ marginLeft: '12px' }}
                  onClick={() => router.refresh()}
                >
                  Tải lại dữ liệu
                </button>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button
              type="submit"
              id="submitCreateContextBtn"
              className="btn btn-primary"
              disabled={isCreating || !selectedCourseId || (startSource === 'SELF_REPORT' && !selectedLevelId)}
            >
              {isCreating ? 'Đang tạo lộ trình...' : 'Bắt đầu học'}
            </button>
            {contexts.length > 0 && (
              <button
                type="button"
                id="cancelCreateBtn"
                className="btn btn-secondary"
                onClick={() => setShowCreateForm(false)}
                disabled={isCreating}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );

  return (
    <div id="homeView" className="app-container">
      {renderHeader(
        <div id="learnerIdentity" className="user-identity" style={{ maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {learner.displayName || `Học viên (${learner.id.slice(0, 8)})`}
          </span>
        </div>
      )}

      <main className="content-area">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '8px',
          }}
        >
          <h1 style={{ fontSize: 'var(--font-size-heading)', fontWeight: 700 }}>
            Lộ trình học tập của tôi
          </h1>
          <span style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-muted)' }}>
            Ngôn ngữ giao diện: {uiLocale}
          </span>
        </div>

        {/* Empty Context State */}
        {contexts.length === 0 ? (
          <div>
            <div id="emptyContextState" className="empty-state-box">
              <p className="empty-state-text">Bạn chưa có lộ trình học.</p>
            </div>
            {renderCreateForm()}
          </div>
        ) : (
          <div>
            {/* Header controls for existing contexts */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Đang có {activeCount}/2 lộ trình hoạt động
              </span>
              {!showCreateForm && activeCount < 2 && (
                <button
                  type="button"
                  id="openCreateContextBtn"
                  className="btn btn-outline"
                  onClick={() => setShowCreateForm(true)}
                >
                  Thêm lộ trình mới
                </button>
              )}
            </div>

            {showCreateForm && activeCount < 2 && renderCreateForm()}

            <div id="contextList" className="context-grid">
              {contexts.map((ctx: LearningContextSummaryDto) => {
                const courseTitle = getLocalizedText(ctx.course.names, uiLocale);
                const langTitle = getLocalizedText(ctx.targetLanguage.names, uiLocale);
                const fwTitle = `${ctx.framework.code} (${ctx.framework.version})`;
                const startLvl = ctx.selectedStartLevel
                  ? `${ctx.selectedStartLevel.code} - ${getLocalizedText(
                      ctx.selectedStartLevel.label,
                      uiLocale
                    )}`
                  : 'Chưa xếp lớp';
                const workingLvl = ctx.workingLevel
                  ? `${ctx.workingLevel.code} - ${getLocalizedText(
                      ctx.workingLevel.label,
                      uiLocale
                    )}`
                  : 'Chưa xếp lớp';

                const isPending = !!pendingContexts[ctx.id];
                const cardError = contextErrors[ctx.id];

                return (
                  <article key={ctx.id} className="context-card" data-context-id={ctx.id}>
                    <div className="context-card-header">
                      <div>
                        <h2 className="context-course-name">{courseTitle || 'Khóa học'}</h2>
                        <span className="context-target-lang">
                          {langTitle || ctx.targetLanguage.code}
                        </span>
                      </div>
                      <span
                        className={`badge ${
                          ctx.status === 'ACTIVE' ? 'badge-active' : 'badge-paused'
                        }`}
                      >
                        {ctx.status === 'ACTIVE' ? 'Đang học' : 'Tạm dừng'}
                      </span>
                    </div>

                    <div className="context-details">
                      <div className="context-detail-row">
                        <span className="context-detail-label">Khung năng lực</span>
                        <span className="context-detail-value">{fwTitle}</span>
                      </div>
                      <div className="context-detail-row">
                        <span className="context-detail-label">Trạng thái khóa học</span>
                        <span className="context-detail-value">
                          {ctx.course.isActive ? 'Đang mở' : 'Tạm khóa'}
                        </span>
                      </div>
                      <div className="context-detail-row">
                        <span className="context-detail-label">Trình độ khởi điểm</span>
                        <span className="context-detail-value">{startLvl}</span>
                      </div>
                      <div className="context-detail-row">
                        <span className="context-detail-label">Trình độ hiện tại</span>
                        <span className="context-detail-value">{workingLvl}</span>
                      </div>
                      <div className="context-detail-row">
                        <span className="context-detail-label">Phiên bản lộ trình</span>
                        <span
                          className="context-detail-value"
                          id={`rowVersion-${ctx.id}`}
                          data-row-version={ctx.rowVersion}
                        >
                          v{ctx.rowVersion}
                        </span>
                      </div>
                    </div>

                    {/* Context error alert if any */}
                    {cardError && (
                      <div
                        id={`contextAlert-${ctx.id}`}
                        role="alert"
                        className="login-alert"
                        style={{ marginTop: '12px' }}
                      >
                        <span>{cardError.message}</span>
                        {cardError.status === 409 && (
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ marginLeft: '8px' }}
                            onClick={() => router.refresh()}
                          >
                            Tải lại
                          </button>
                        )}
                      </div>
                    )}

                    {/* Inline recovery form for null contexts */}
                    {recoveringContextId === ctx.id && (
                      <div
                        id={`startLevelSection-${ctx.id}`}
                        style={{
                          marginTop: '14px',
                          padding: '14px',
                          border: '1px solid var(--border-color, #e2e8f0)',
                          borderRadius: '6px',
                          background: 'var(--subtle-bg, #f8fafc)',
                        }}
                      >
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>
                          Chọn trình độ bắt đầu
                        </h3>
                        {isLoadingOptions && (
                          <p style={{ color: 'var(--text-muted)' }}>Đang tải danh sách trình độ...</p>
                        )}
                        <div style={{ marginBottom: '10px' }}>
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              marginBottom: '6px',
                            }}
                          >
                            <input
                              type="radio"
                              name={`startSource-${ctx.id}`}
                              value="DEFAULT"
                              checked={recoveringSource === 'DEFAULT'}
                              onChange={() => setRecoveringSource('DEFAULT')}
                              disabled={isRecovering}
                            />
                            <span>Trình độ mặc định (bài học đầu tiên)</span>
                          </label>
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="radio"
                              name={`startSource-${ctx.id}`}
                              value="SELF_REPORT"
                              checked={recoveringSource === 'SELF_REPORT'}
                              onChange={() => setRecoveringSource('SELF_REPORT')}
                              disabled={isRecovering}
                            />
                            <span>Tự chọn trình độ</span>
                          </label>
                        </div>
                        {recoveringSource === 'SELF_REPORT' && (
                          <div style={{ marginBottom: '10px' }}>
                            <label
                              htmlFor={`startLevelSelect-${ctx.id}`}
                              style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}
                            >
                              Trình độ
                            </label>
                            <select
                              id={`startLevelSelect-${ctx.id}`}
                              className="form-control"
                              value={recoveringLevelId}
                              onChange={(e) => setRecoveringLevelId(e.target.value)}
                              disabled={isRecovering}
                            >
                              <option value="">-- Chọn trình độ --</option>
                              {(() => {
                                const lOpt = options?.languages.find(
                                  (l) => l.id === ctx.targetLanguage.id
                                );
                                const cOpt = lOpt?.courses.find((c) => c.id === ctx.course.id);
                                return (cOpt?.levels || []).map((lvl) => (
                                  <option key={lvl.id} value={lvl.id}>
                                    {lvl.code} - {getLocalizedText(lvl.label, uiLocale)}
                                  </option>
                                ));
                              })()}
                            </select>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            id={`confirmStartLevelBtn-${ctx.id}`}
                            className="btn btn-primary"
                            onClick={() => handleConfirmStartLevel(ctx)}
                            disabled={isRecovering}
                          >
                            {isRecovering ? 'Đang lưu...' : 'Xác nhận trình độ'}
                          </button>
                          <button
                            type="button"
                            id={`cancelStartLevelBtn-${ctx.id}`}
                            className="btn btn-outline"
                            onClick={handleCancelStartLevel}
                            disabled={isRecovering}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions: Pause / Resume + Enter course / Start level */}
                    <div
                      style={{
                        marginTop: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        {ctx.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            id={`pauseBtn-${ctx.id}`}
                            className="btn btn-outline"
                            onClick={() => handlePause(ctx)}
                            disabled={isPending || isRecovering}
                          >
                            {isPending ? 'Đang tạm dừng...' : 'Tạm dừng'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            id={`resumeBtn-${ctx.id}`}
                            className="btn btn-outline"
                            onClick={() => handleResume(ctx)}
                            disabled={isPending || isRecovering}
                          >
                            {isPending ? 'Đang tiếp tục...' : 'Tiếp tục học'}
                          </button>
                        )}
                      </div>

                      {ctx.status === 'ACTIVE' && ctx.course.isActive && (
                        ctx.workingLevel ? (
                          <a
                            href={`/learn/${ctx.id}`}
                            id={`enterContextBtn-${ctx.id}`}
                            className="btn btn-primary"
                            style={{
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            Vào học
                          </a>
                        ) : recoveringContextId !== ctx.id ? (
                          <button
                            type="button"
                            id={`startLevelBtn-${ctx.id}`}
                            className="btn btn-primary"
                            onClick={() => handleOpenStartLevel(ctx)}
                            disabled={isPending || isRecovering}
                          >
                            Chọn trình độ bắt đầu
                          </button>
                        ) : null
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
