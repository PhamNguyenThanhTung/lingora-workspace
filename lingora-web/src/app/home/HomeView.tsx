'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type {
  LearnerContextEnvelope,
  LearningContextSummaryDto,
  ContextOptionsData,
  CourseOptionDto,
} from '../../server/context/dto.ts';
import type { LoadLearnerContextResult } from '../../server/context/loader.ts';
import type { HomeDto } from '../../server/context/home-dto.ts';
import type { LoadLearnerHomeResult } from '../../server/context/home-loader.ts';

interface HomeViewProps {
  data?: (LearnerContextEnvelope['data'] & Partial<HomeDto>) | HomeDto;
  errorState?: Extract<LoadLearnerHomeResult | LoadLearnerContextResult, { ok: false }>;
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

const PURPOSE_LABELS: Record<string, string> = {
  TRAVEL: 'Du lịch & Khám phá',
  WORK: 'Công việc & Sự nghiệp',
  SCHOOL: 'Học tập & Nhà trường',
  EXAM: 'Luyện thi & Chứng chỉ',
  CONVERSATION: 'Giao tiếp hàng ngày',
  CULTURE: 'Văn hóa & Đời sống',
  ENTERTAINMENT: 'Giải trí & Phim ảnh',
  OTHER: 'Mục đích khác',
};

const INTEREST_LABELS: Record<string, string> = {
  TRAVEL: 'Du lịch',
  BUSINESS: 'Kinh doanh & Khởi nghiệp',
  ACADEMICS: 'Học thuật & Nghiên cứu',
  DAILY_LIFE: 'Đời sống & Thường nhật',
  CULTURE: 'Văn hóa & Lịch sử',
  ENTERTAINMENT: 'Giải trí & Nghệ thuật',
  TECHNOLOGY: 'Công nghệ & Đổi mới',
  FOOD: 'Ẩm thực & Nấu ăn',
  NEWS: 'Tin tức & Xã hội',
  SCIENCE: 'Khoa học & Tự nhiên',
};

export function HomeView({ data, errorState }: HomeViewProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRetrying, startRetry] = useTransition();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const homeData = data as Partial<HomeDto> | undefined;
  const totalXp = homeData?.totalXp ?? 0;
  const streak = homeData?.streak ?? { currentStreak: 0, longestStreak: 0, activeDays: [], todayCompleted: false };
  const quests = homeData?.quests ?? [];
  const dailyProgress = homeData?.dailyProgress ?? { dailyGoalMinutes: 10, completedLessonsToday: 0, reviewsCompletedToday: 0 };
  const recentAchievement = homeData?.recentAchievement ?? null;
  const reviewDue = homeData?.reviewDue ?? 0;

  // Authoritative contexts state
  const [contexts, setContexts] = useState<LearningContextSummaryDto[]>(data?.contexts || []);

  const selectedContext = contexts.find(context => context.id === homeData?.selectedContextId);
  const pathUsable = selectedContext?.status === 'ACTIVE' && selectedContext.course.isActive;
  const continueLearning = pathUsable ? homeData?.continueLearning ?? null : null;
  const pathNodes = pathUsable ? homeData?.path ?? [] : [];

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

  // Context goal editing state
  const [editingGoalContextId, setEditingGoalContextId] = useState<string | null>(null);
  const [goalMinutesState, setGoalMinutesState] = useState<Record<string, number>>({});
  const [purposeDraft, setPurposeDraft] = useState<Record<string, string | null>>({});
  const [interestsDraft, setInterestsDraft] = useState<Record<string, string[]>>({});
  const [serverPreferences, setServerPreferences] = useState<Record<string, any>>({});
  const pendingGoalPayloads = useRef(new Map<string, string>());
  const savingGoals = useRef(new Set<string>());
  const [isLoadingPlan, setIsLoadingPlan] = useState<Record<string, boolean>>({});
  const [isUpdatingGoal, setIsUpdatingGoal] = useState<Record<string, boolean>>({});
  const [goalErrors, setGoalErrors] = useState<Record<string, { code: string; message: string; status: number } | null>>({});

  const handleOpenGoalEditor = async (ctx: LearningContextSummaryDto) => {
    const isClosing = editingGoalContextId === ctx.id;
    if (isClosing) {
      setEditingGoalContextId(null);
      return;
    }

    setEditingGoalContextId(ctx.id);
    if (pendingGoalPayloads.current.has(ctx.id)) return;
    setGoalErrors((prev) => ({ ...prev, [ctx.id]: null }));

    // Fetch plan & preferences via GET
    setIsLoadingPlan((prev) => ({ ...prev, [ctx.id]: true }));
    try {
      const res = await fetch(`/api/learner/contexts/${ctx.id}/plan`);
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) throw new Error();
      {
        const json = await res.json();
        const data = json.data;
        if (data?.rowVersion) {
          setContexts((prev) =>
            prev.map((c) => (c.id === ctx.id ? { ...c, rowVersion: data.rowVersion } : c))
          );
        }
        const prefs = data?.preferences || {};
        setServerPreferences((prev) => ({ ...prev, [ctx.id]: prefs }));
        setGoalMinutesState((prev) => ({ ...prev, [ctx.id]: prefs.dailyGoalMinutes ?? 10 }));
        setPurposeDraft((prev) => ({ ...prev, [ctx.id]: prefs.purpose ?? null }));
        setInterestsDraft((prev) => ({
          ...prev,
          [ctx.id]: Array.isArray(prefs.interests) ? [...prefs.interests] : [],
        }));
      }
    } catch {
      setServerPreferences(prev => ({ ...prev, [ctx.id]: undefined }));
      setGoalErrors(prev => ({
        ...prev,
        [ctx.id]: { code: 'PLAN_LOAD_FAILED', message: 'Không thể tải mục tiêu đã lưu. Hãy thử tải lại.', status: 0 },
      }));
    } finally {
      setIsLoadingPlan((prev) => ({ ...prev, [ctx.id]: false }));
    }
  };

  const handleSaveGoal = async (ctx: LearningContextSummaryDto) => {
    if (savingGoals.current.has(ctx.id) || !serverPreferences[ctx.id]) return;
    savingGoals.current.add(ctx.id);
    setIsUpdatingGoal((prev) => ({ ...prev, [ctx.id]: true }));
    setGoalErrors((prev) => ({ ...prev, [ctx.id]: null }));

    const opId = generateContextId();
    const serverPref = serverPreferences[ctx.id] || {};
    const minutes = goalMinutesState[ctx.id] ?? 10;
    const purpose = purposeDraft[ctx.id] ?? null;
    const currentInterests = interestsDraft[ctx.id] ?? [];

    const payload: Record<string, any> = {
      operationId: opId,
      expectedRowVersion: ctx.rowVersion,
    };

    if (minutes !== serverPref.dailyGoalMinutes) {
      payload.dailyGoalMinutes = minutes;
    }
    if (purpose !== (serverPref.purpose ?? null)) {
      payload.purpose = purpose;
    }
    const oldInterests = serverPref.interests || [];
    const interestsChanged =
      currentInterests.length !== oldInterests.length ||
      currentInterests.some((int: string) => !oldInterests.includes(int));
    if (interestsChanged) {
      payload.interests = currentInterests;
    }

    const requestBody = pendingGoalPayloads.current.get(ctx.id) ?? JSON.stringify(payload);
    pendingGoalPayloads.current.set(ctx.id, requestBody);

    try {
      const response = await fetch(`/api/learner/contexts/${ctx.id}/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const json = await response.json();
      if (!response.ok) {
        if (response.status < 500) pendingGoalPayloads.current.delete(ctx.id);
        if (response.status === 409) {
          // Stale rowVersion: re-fetch fresh rowVersion and serverPreferences while keeping learner's draft intact
          const attempted = JSON.parse(requestBody);
          try {
            const freshRes = await fetch(`/api/learner/contexts/${ctx.id}/plan`);
            if (!freshRes.ok) throw new Error();
            {
              const freshJson = await freshRes.json();
              if (freshJson.data?.rowVersion) {
                setContexts((prev) =>
                  prev.map((c) => (c.id === ctx.id ? { ...c, rowVersion: freshJson.data.rowVersion } : c))
                );
              }
              if (freshJson.data?.preferences) {
                const fresh = freshJson.data.preferences;
                setServerPreferences((prev) => ({ ...prev, [ctx.id]: fresh }));
                setGoalMinutesState(prev => ({ ...prev, [ctx.id]: attempted.dailyGoalMinutes ?? fresh.dailyGoalMinutes }));
                setPurposeDraft(prev => ({ ...prev, [ctx.id]: 'purpose' in attempted ? attempted.purpose : fresh.purpose }));
                setInterestsDraft(prev => ({ ...prev, [ctx.id]: attempted.interests ?? fresh.interests }));
              }
            }
          } catch {
            setServerPreferences(prev => ({ ...prev, [ctx.id]: undefined }));
          }

          setGoalErrors((prev) => ({
            ...prev,
            [ctx.id]: {
              code: 'STALE_VERSION',
              message: 'Lộ trình đã được cập nhật từ phiên khác. Lựa chọn của bạn đã được giữ lại, vui lòng kiểm tra và nhấn Lưu lại.',
              status: 409,
            },
          }));
          return;
        }

        setGoalErrors((prev) => ({
          ...prev,
          [ctx.id]: {
            code: json.error?.code || 'UPDATE_ERROR',
            message: json.error?.message || 'Không thể cập nhật mục tiêu học.',
            status: response.status,
          },
        }));
        return;
      }

      pendingGoalPayloads.current.delete(ctx.id);
      // Synchronize authoritative state using response
      if (json.data?.rowVersion) {
        setContexts((prev) =>
          prev.map((c) => (c.id === ctx.id ? { ...c, rowVersion: json.data.rowVersion } : c))
        );
      }
      setServerPreferences((prev) => ({
        ...prev,
        [ctx.id]: {
          dailyGoalMinutes: minutes,
          purpose,
          interests: currentInterests,
        },
      }));
      setEditingGoalContextId(null);
      router.refresh();
    } catch {
      setGoalErrors((prev) => ({
        ...prev,
        [ctx.id]: {
          code: 'NETWORK_ERROR',
          message: 'Lỗi mạng khi cập nhật mục tiêu. Vui lòng thử lại.',
          status: 0,
        },
      }));
    } finally {
      savingGoals.current.delete(ctx.id);
      setIsUpdatingGoal((prev) => ({ ...prev, [ctx.id]: false }));
    }
  };

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
      router.refresh();
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

      router.refresh();
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
      router.refresh();
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
      router.refresh();
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
            Ôn từ vựng{reviewDue > 0 ? ` (${reviewDue})` : ''}
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
              <div style={{ marginTop: '16px' }}>
                <a
                  href="/onboarding"
                  id="startOnboardingBtn"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', display: 'inline-block' }}
                >
                  Bắt đầu lộ trình học cá nhân
                </a>
              </div>
            </div>
            {renderCreateForm()}
          </div>
        ) : (
          <div>
            {/* Gamification & Quests Overview */}
            {(totalXp > 0 || streak.currentStreak > 0 || quests.length > 0 || dailyProgress.dailyGoalMinutes > 0) && (
              <div
                id="gamificationOverview"
                style={{
                  marginBottom: '20px',
                  padding: '16px',
                  backgroundColor: 'var(--surface-bg, #ffffff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div id="currentStreakDisplay" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1.4rem' }}>🔥</span>
                      <div>
                        <strong id="streakBadge" style={{ fontSize: '1rem', display: 'block' }}>{streak.currentStreak} ngày</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kỷ lục: {streak.longestStreak} ngày</span>
                      </div>
                    </div>
                    <div id="totalXpDisplay" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1.4rem' }}>⚡</span>
                      <div>
                        <strong id="totalXpBadge" style={{ fontSize: '1rem', display: 'block' }}>{totalXp} XP</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tổng điểm</span>
                      </div>
                    </div>
                  </div>

                  <div id="dailyGoalDisplay" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>Mục tiêu: {dailyProgress.dailyGoalMinutes} phút • {dailyProgress.completedLessonsToday} bài học • {dailyProgress.reviewsCompletedToday} từ đã ôn</span>
                  </div>
                </div>

                {streak.today && (
                  <details style={{ margin: '0 0 12px' }}>
                    <summary>Lịch học 28 ngày</summary>
                    <ul id="streakCalendar" aria-label="Lịch học 28 ngày" style={{
                      listStyle: 'none', padding: 0, display: 'grid',
                      gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '4px', maxWidth: '350px',
                    }}>
                      {Array.from({ length: 28 }, (_, index) => {
                        const date = new Date(streak.today + 'T00:00:00.000Z');
                        date.setUTCDate(date.getUTCDate() - 27 + index);
                        const key = date.toISOString().slice(0, 10);
                        const active = streak.activeDays.includes(key);
                        return <li key={key} title={key} aria-label={key + (active ? ' đã học' : ' chưa học')}
                          style={{ textAlign: 'center', border: '1px solid var(--border-subtle, #e2e8f0)', borderRadius: '4px' }}>
                          {key.slice(-2)} {active ? '✓' : '·'}
                        </li>;
                      })}
                    </ul>
                  </details>
                )}

                {/* Daily Quests */}
                {quests.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-subtle, #f1f5f9)', paddingTop: '12px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>Nhiệm vụ hàng ngày</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                      {quests.map((q) => (
                        <div
                          key={q.id}
                          id={`quest-${q.id}`}
                          className="quest-item"
                          style={{
                            padding: '10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle, #e2e8f0)',
                            backgroundColor: q.isCompleted ? 'var(--subtle-bg, #f8fafc)' : 'var(--surface-bg, #fff)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{q.title}</span>
                            <span className={`badge ${q.isCompleted ? 'badge-active' : 'badge-paused'}`} style={{ fontSize: '0.75rem' }}>
                              +{q.xpReward} XP
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${Math.round((q.progress / q.target) * 100)}%`,
                                  height: '100%',
                                  backgroundColor: q.isCompleted ? 'var(--primary-green, #10b981)' : '#3b82f6',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {q.progress}/{q.target}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Achievement if any */}
                {recentAchievement && (
                  <div
                    id="recentAchievementBanner"
                    style={{
                      marginTop: '12px',
                      padding: '8px 12px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span>🏆</span>
                    <span>
                      <strong>Thành tựu mới:</strong> {recentAchievement.title} - {recentAchievement.description}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Continue Learning CTA Banner */}
            {continueLearning && (
              <div
                id="continueLearningBanner"
                style={{
                  marginBottom: '20px',
                  padding: '16px 20px',
                  backgroundColor: 'var(--primary-bg-subtle, #ecfdf5)',
                  border: '1px solid var(--primary-green, #10b981)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <span className="badge badge-active" style={{ marginBottom: '4px', fontSize: '0.75rem' }}>
                    {continueLearning.status === 'IN_PROGRESS' ? 'Đang làm bài' : 'Bài học tiếp theo'}
                  </span>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '2px 0' }}>
                    {continueLearning.title}
                  </h2>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {continueLearning.unitTitle}
                  </span>
                </div>
                <a
                  href={continueLearning.href}
                  id="continueLearningBtn"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', padding: '8px 20px', fontSize: '0.95rem' }}
                >
                  {continueLearning.status === 'IN_PROGRESS' ? 'Tiếp tục bài làm' : 'Bắt đầu học'}
                </a>
              </div>
            )}

            {homeData && contexts.length > 1 && (
              <label style={{ display: 'block', marginBottom: '14px' }}>
                Lộ trình đang xem
                <select
                  aria-label="Lộ trình đang xem"
                  className="form-control"
                  value={homeData.selectedContextId ?? ''}
                  onChange={event => router.push('/home?contextId=' + encodeURIComponent(event.target.value))}
                >
                  {contexts.map(ctx => <option key={ctx.id} value={ctx.id}>{getLocalizedText(ctx.course.names)}</option>)}
                </select>
              </label>
            )}
            {homeData?.pathMessage && <p role="status">{homeData.pathMessage}</p>}

            {/* Learning Path (Vertical) */}
            {pathNodes.length > 0 && (
              <section
                id="learningPathSection"
                style={{
                  marginBottom: '28px',
                  padding: '18px',
                  backgroundColor: 'var(--surface-bg, #ffffff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '8px',
                }}
              >
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>
                  Lộ trình bài học
                </h2>
                <div id="learningPathList" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pathNodes.map((node, index) => {
                    const isNavigable = node.state === 'COMPLETED' || node.state === 'CURRENT' || node.state === 'AVAILABLE';
                    return (
                      <div
                        key={node.lessonId || index}
                        id={`pathNode-${node.lessonId}`}
                        data-state={node.state}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: '6px',
                          border: node.state === 'CURRENT'
                            ? '2px solid var(--primary-green, #10b981)'
                            : '1px solid var(--border-subtle, #e2e8f0)',
                          backgroundColor: node.state === 'CURRENT'
                            ? 'var(--primary-bg-subtle, #f0fdf4)'
                            : node.state === 'LOCKED' || node.state === 'COMING_SOON'
                            ? 'var(--subtle-bg, #f8fafc)'
                            : 'var(--surface-bg, #ffffff)',
                          opacity: node.state === 'LOCKED' || node.state === 'COMING_SOON' ? 0.75 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              backgroundColor: node.state === 'COMPLETED'
                                ? 'var(--primary-green, #10b981)'
                                : node.state === 'CURRENT'
                                ? '#3b82f6'
                                : '#94a3b8',
                              color: '#ffffff',
                            }}
                          >
                            {node.state === 'COMPLETED' ? '✓' : index + 1}
                          </span>
                          <div>
                            {isNavigable ? (
                              <a
                                href={node.href}
                                id={`pathLink-${node.lessonId}`}
                                className="path-node-link"
                                style={{
                                  textDecoration: 'none',
                                  color: 'inherit',
                                  fontWeight: 600,
                                  fontSize: '0.95rem',
                                  display: 'block',
                                }}
                              >
                                {node.title}
                              </a>
                            ) : (
                              <span
                                id={`pathDisabled-${node.lessonId}`}
                                style={{
                                  fontWeight: 600,
                                  fontSize: '0.95rem',
                                  color: 'var(--text-muted, #64748b)',
                                  display: 'block',
                                  cursor: 'not-allowed',
                                }}
                              >
                                {node.title}
                              </span>
                            )}
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {node.unitTitle}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {node.score != null && (
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-green, #10b981)' }}>
                              {node.score}%
                            </span>
                          )}
                          <span
                            className={`badge ${
                              node.state === 'COMPLETED'
                                ? 'badge-active'
                                : node.state === 'CURRENT'
                                ? 'badge-active'
                                : 'badge-paused'
                            }`}
                            style={{ fontSize: '0.75rem' }}
                          >
                            {node.state === 'COMPLETED'
                              ? 'Đã hoàn thành'
                              : node.state === 'CURRENT'
                              ? 'Đang học'
                              : node.state === 'AVAILABLE'
                              ? 'Chưa bắt đầu'
                              : node.state === 'LOCKED'
                              ? 'Đang khóa'
                              : 'Sắp ra mắt'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

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
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href="/onboarding"
                    id="addOnboardingLanguageBtn"
                    className="btn btn-primary"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                  >
                    Thêm ngôn ngữ
                  </a>
                  <button
                    type="button"
                    id="openCreateContextBtn"
                    className="btn btn-outline"
                    onClick={() => setShowCreateForm(true)}
                  >
                    Thêm lộ trình mới
                  </button>
                </div>
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

                    {/* Goal update section for context */}
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mục tiêu học:</span>
                        <button
                          type="button"
                          id={`editGoalBtn-${ctx.id}`}
                          className="btn btn-outline"
                          style={{ fontSize: '0.8rem', padding: '2px 8px' }}
                          onClick={() => handleOpenGoalEditor(ctx)}
                          disabled={ctx.status !== 'ACTIVE' || !ctx.workingLevel || isUpdatingGoal[ctx.id]}
                        >
                          {editingGoalContextId === ctx.id ? 'Đóng' : 'Cập nhật mục tiêu'}
                        </button>
                      </div>

                      {editingGoalContextId === ctx.id && (
                        <div id={`goalEditor-${ctx.id}`} style={{ marginTop: '8px', padding: '12px', background: 'var(--subtle-bg, #f8fafc)', borderRadius: '6px' }}>
                          {isLoadingPlan[ctx.id] ? (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                              Đang tải thông tin mục tiêu...
                            </p>
                          ) : (
                            <>
                              <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                                  Số phút học mỗi ngày:
                                </label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  {[5, 10, 15, 20].map((mins) => {
                                    const currentSelected = (goalMinutesState[ctx.id] || 10) === mins;
                                    return (
                                      <button
                                        key={mins}
                                        type="button"
                                        id={`selectGoal-${ctx.id}-${mins}`}
                                        className={`btn ${currentSelected ? 'btn-primary' : 'btn-outline'}`}
                                        style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                                        onClick={() => setGoalMinutesState((prev) => ({ ...prev, [ctx.id]: mins }))}
                                        disabled={isUpdatingGoal[ctx.id] || pendingGoalPayloads.current.has(ctx.id)}
                                      >
                                        {mins}p
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div style={{ marginBottom: '10px' }}>
                                <label htmlFor={`purposeSelect-${ctx.id}`} style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                                  Mục đích học tập:
                                </label>
                                <select
                                  id={`purposeSelect-${ctx.id}`}
                                  className="form-control"
                                  value={purposeDraft[ctx.id] || ''}
                                  onChange={(e) => setPurposeDraft((prev) => ({ ...prev, [ctx.id]: e.target.value ? e.target.value : null }))}
                                  disabled={isUpdatingGoal[ctx.id] || pendingGoalPayloads.current.has(ctx.id)}
                                  style={{ width: '100%', fontSize: '0.85rem', padding: '6px 8px' }}
                                >
                                  <option value="">-- Chưa thiết lập --</option>
                                  {Object.entries(PURPOSE_LABELS).map(([k, label]) => (
                                    <option key={k} value={k}>{label}</option>
                                  ))}
                                </select>
                              </div>

                              <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                                  Chủ đề quan tâm (tối đa 5):
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {Object.entries(INTEREST_LABELS).map(([k, label]) => {
                                    const isChecked = (interestsDraft[ctx.id] || []).includes(k);
                                    return (
                                      <button
                                        key={k}
                                        type="button"
                                        id={`interestPill-${ctx.id}-${k}`}
                                        className={`btn ${isChecked ? 'btn-primary' : 'btn-outline'}`}
                                        style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px' }}
                                        disabled={isUpdatingGoal[ctx.id] || pendingGoalPayloads.current.has(ctx.id)}
                                        onClick={() => {
                                          setInterestsDraft((prev) => {
                                            const current = prev[ctx.id] || [];
                                            if (current.includes(k)) {
                                              return { ...prev, [ctx.id]: current.filter((x) => x !== k) };
                                            }
                                            if (current.length >= 5) return prev;
                                            return { ...prev, [ctx.id]: [...current, k] };
                                          });
                                        }}
                                      >
                                        {label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {goalErrors[ctx.id] && (
                                <div id={`goalAlert-${ctx.id}`} role="alert" className="login-alert" style={{ marginBottom: '8px', fontSize: '0.8rem', padding: '6px 8px' }}>
                                  <span>{goalErrors[ctx.id]?.message}</span>
                                </div>
                              )}

                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  id={`saveGoalBtn-${ctx.id}`}
                                  className="btn btn-primary"
                                  style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                                  disabled={isUpdatingGoal[ctx.id] || !serverPreferences[ctx.id] || ctx.status !== 'ACTIVE'}
                                  onClick={() => handleSaveGoal(ctx)}
                                >
                                  {isUpdatingGoal[ctx.id] ? 'Đang lưu...' : pendingGoalPayloads.current.has(ctx.id) ? 'Thử lưu lại' : 'Lưu mục tiêu'}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                                  disabled={isUpdatingGoal[ctx.id] || pendingGoalPayloads.current.has(ctx.id)}
                                  onClick={() => setEditingGoalContextId(null)}
                                >
                                  Hủy
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
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
