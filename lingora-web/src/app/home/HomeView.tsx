'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type {
  LearnerContextEnvelope,
  LearningContextSummaryDto,
  ContextOptionsData,
} from '../../server/context/dto.ts';
import type { LoadLearnerContextResult } from '../../server/context/loader.ts';
import type { HomeDto } from '../../server/context/home-dto.ts';
import type { LoadLearnerHomeResult } from '../../server/context/home-loader.ts';
import { numberedTitle } from '../../shared/lesson-title.ts';

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
  const totalGems = homeData?.totalGems ?? 0;
  const streak = homeData?.streak ?? { currentStreak: 0, longestStreak: 0, activeDays: [], todayCompleted: false };
  const reviewDueForQuests = homeData?.reviewDue ?? 0;
  // A brand-new learner has nothing due for review before their first lesson, so the review quest
  // cannot be progressed yet. Hide it until it is reachable (or already progressed/claimed).
  const quests = (homeData?.quests ?? []).filter(
    (q) => !(q.id === 'REVIEW_10' && reviewDueForQuests === 0 && q.progress === 0 && !q.isClaimed),
  );
  const dailyProgress = homeData?.dailyProgress ?? { dailyGoalMinutes: 10, completedLessonsToday: 0, reviewsCompletedToday: 0 };
  const recentAchievement = homeData?.recentAchievement ?? null;
  const reviewDue = homeData?.reviewDue ?? 0;
  // G11: review sessions are per language, so carry the selected context to /review.
  const reviewHref = homeData?.selectedContextId ? `/review?contextId=${homeData.selectedContextId}` : '/review';

  // Authoritative contexts state
  const [contexts, setContexts] = useState<LearningContextSummaryDto[]>(data?.contexts || []);

  const selectedContext = contexts.find(context => context.id === homeData?.selectedContextId);
  const pathUsable = selectedContext?.status === 'ACTIVE' && selectedContext.course.isActive;
  const continueLearning = pathUsable ? homeData?.continueLearning ?? null : null;
  const pathNodes = pathUsable ? homeData?.path ?? [] : [];
  // Only the first CURRENT node gets the call-to-action bubble, so the map has a single focal point.
  const firstCurrentIndex = pathNodes.findIndex((node) => node.state === 'CURRENT');
  const pathBubbleText = homeData?.continueLearning?.status === 'IN_PROGRESS' ? 'TIẾP TỤC' : 'BẮT ĐẦU';

  useEffect(() => {
    if (data?.contexts) {
      setContexts(data.contexts);
    }
  }, [data]);

  // Options are loaded only for recovery of existing contexts without a starting level.
  const [options, setOptions] = useState<ContextOptionsData | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

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

  // Fetch options only when an existing context needs level recovery.
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
        <div className="user-nav">
          <a href={reviewHref} id="reviewNavBtn" className="btn btn-secondary btn-sm">
            Ôn từ vựng{reviewDue > 0 ? ` (${reviewDue})` : ''}
          </a>
          {identityNode}
          <button
            type="button"
            id="logoutBtn"
            className="btn btn-secondary btn-sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
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
    const isNotFound = errorState.status === 404;
    const isBadRequest = errorState.status === 400;
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
                : isNotFound
                ? 'Không tìm thấy nội dung'
                : isBadRequest
                ? 'Yêu cầu không hợp lệ'
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
              {(isNotFound || isBadRequest) && (
                <a
                  href="/home"
                  id="backToHomeBtn"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  Về trang chủ
                </a>
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
  const displayName = learner.displayName?.trim() || 'bạn';
  const selectedLanguage = selectedContext
    ? getLocalizedText(selectedContext.targetLanguage.names, uiLocale) || selectedContext.targetLanguage.code
    : '';
  const selectedWorkingLevel = selectedContext?.workingLevel
    ? `${selectedContext.workingLevel.code} - ${getLocalizedText(selectedContext.workingLevel.label, uiLocale)}`
    : 'Chưa chọn trình độ bắt đầu';
  // SCR-L-06: progress is eligible required-lesson progress; optional lessons stay out of it.
  const requiredPathNodes = pathNodes.filter((node) => node.isRequired && node.state !== 'COMING_SOON');
  const publishedPathCount = requiredPathNodes.length;
  const completedPathCount = requiredPathNodes.filter((node) => node.state === 'COMPLETED').length;
  const pathStatus = selectedContext && !selectedContext.course.isActive
    ? 'COURSE_INACTIVE'
    : selectedContext?.status === 'PAUSED'
    ? 'PAUSED'
    : selectedContext && !selectedContext.workingLevel
    ? 'NO_WORKING_LEVEL'
    : selectedContext?.status === 'ACTIVE' && homeData?.pathStatus === 'PAUSED'
    ? 'READY'
    : homeData?.pathStatus;
  const allPublishedDone = pathStatus === 'READY' && publishedPathCount > 0 && completedPathCount === publishedPathCount;

  const activeCount = contexts.filter((c) => c.status === 'ACTIVE').length;

  return (
    <div id="homeView" className="app-container">
      {renderHeader(
        <div id="learnerIdentity" className="user-identity" style={{ maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName === 'bạn' ? 'Học viên' : displayName}
          </span>
        </div>
      )}

      <main className="content-area">
        <h1 className="home-greeting">Chào {displayName}! 👋</h1>

        {/* Empty Context State */}
        {contexts.length === 0 ? (
          <div id="emptyContextState" className="empty-state-box">
            <p className="empty-state-text">Bạn chưa có lộ trình học.</p>
            <div style={{ marginTop: '16px' }}>
              <a
                href="/onboarding"
                id="startOnboardingBtn"
                className="btn btn-primary"
                style={{ textDecoration: 'none', display: 'inline-block' }}
              >
                Bắt đầu học
              </a>
            </div>
          </div>
        ) : (
          <div>
            {selectedContext && (
              <p className="home-subline">
                {selectedLanguage} · {selectedWorkingLevel}
              </p>
            )}

            {/* Stat bar: streak / XP / gems, the first thing a learner sees */}
            {homeData?.gamificationStatus !== 'UNAVAILABLE' && (
              <div className="stat-bar">
                <div id="currentStreakDisplay" className="stat-pill stat-pill--streak">
                  <span className="stat-pill__icon home-stats__icon" aria-hidden="true">🔥</span>
                  <strong id="streakBadge" className="stat-pill__value">{streak.currentStreak} ngày</strong>
                  <span className="stat-pill__label">Chuỗi ngày</span>
                </div>
                <div id="totalXpDisplay" className="stat-pill stat-pill--xp">
                  <span className="stat-pill__icon home-stats__icon" aria-hidden="true">⚡</span>
                  <strong id="totalXpBadge" className="stat-pill__value">{totalXp} XP</strong>
                  <span className="stat-pill__label">Điểm KN</span>
                </div>
                <div id="totalGemsDisplay" className="stat-pill stat-pill--gems">
                  <span className="stat-pill__icon home-stats__icon" aria-hidden="true">💎</span>
                  <strong id="totalGemsBadge" className="stat-pill__value">{totalGems}</strong>
                  <span className="stat-pill__label">Kim cương</span>
                </div>
              </div>
            )}

            {continueLearning ? (
              <div id="continueLearningBanner" className="hero-card">
                <span className="hero-card__kicker">
                  {continueLearning.status === 'IN_PROGRESS' ? 'Đang làm bài' : 'Bài học tiếp theo'}
                </span>
                <h2 className="hero-card__title">{continueLearning.title}</h2>
                <span className="hero-card__meta">{continueLearning.unitTitle}</span>
                <a
                  href={continueLearning.href}
                  id="continueLearningBtn"
                  className="btn hero-card__cta"
                >
                  {continueLearning.status === 'IN_PROGRESS' ? 'Tiếp tục học' : 'Bắt đầu học'}
                </a>
              </div>
            ) : (
              <section id="continueLearningFallback" role="status" className="hero-card hero-card--muted">
                <div>
                  <h2 className="hero-card__title" style={{ marginTop: 0 }}>
                    {allPublishedDone ? '🎉 Bạn đã học hết các bài hiện có'
                      : pathStatus === 'PAUSED' ? 'Lộ trình đang tạm dừng'
                      : pathStatus === 'NO_WORKING_LEVEL' ? 'Chọn trình độ để bắt đầu'
                      : pathStatus === 'COURSE_INACTIVE' ? 'Khóa học hiện chưa mở'
                      : 'Chưa có bài học tiếp theo'}
                  </h2>
                  <span className="hero-card__meta">
                    {allPublishedDone ? 'Chúc mừng! Hãy ôn lại từ vựng hoặc làm lại bài để củng cố; bài mới sẽ xuất hiện ở đây khi được phát hành.' : homeData?.pathMessage || (pathStatus === 'PAUSED'
                      ? 'Tiếp tục lộ trình khi bạn sẵn sàng.'
                      : pathStatus === 'NO_WORKING_LEVEL'
                      ? 'Chọn trình độ bắt đầu để xem bài học phù hợp.'
                      : pathStatus === 'COURSE_INACTIVE'
                      ? 'Bạn có thể xem lại thông tin lộ trình bên dưới.'
                      : pathStatus === 'EMPTY_CURRICULUM'
                      ? 'Chương trình này chưa có bài học được phát hành.'
                      : 'Chọn một lộ trình để xem nội dung học.')}
                  </span>
                </div>
                {selectedContext && pathStatus === 'PAUSED' ? (
                  <button
                    type="button"
                    className="btn hero-card__cta"
                    onClick={() => handleResume(selectedContext)}
                    disabled={!!pendingContexts[selectedContext.id]}
                  >
                    {pendingContexts[selectedContext.id] ? 'Đang tiếp tục...' : 'Tiếp tục học'}
                  </button>
                ) : selectedContext && pathStatus === 'NO_WORKING_LEVEL' ? (
                  <button
                    type="button"
                    className="btn hero-card__cta"
                    onClick={() => handleOpenStartLevel(selectedContext)}
                    disabled={!!pendingContexts[selectedContext.id] || isRecovering}
                  >
                    Chọn trình độ bắt đầu
                  </button>
                ) : reviewDue > 0 ? (
                  <a href={reviewHref} className="btn hero-card__cta">
                    Ôn tập {reviewDue} nội dung đến hạn
                  </a>
                ) : pathStatus === 'EMPTY_CURRICULUM' && selectedContext ? (
                  <a href={`/learn/${selectedContext.id}`} className="btn hero-card__cta">
                    Xem danh sách bài học
                  </a>
                ) : (
                  <a href="#contextList" className="btn btn-secondary btn-block">
                    Xem lộ trình
                  </a>
                )}
              </section>
            )}

            {homeData && contexts.length > 1 && (
              <label style={{ display: 'block', margin: '16px 0', fontWeight: 700 }}>
                Lộ trình đang xem
                <select
                  aria-label="Lộ trình đang xem"
                  className="form-control"
                  value={homeData.selectedContextId ?? ''}
                  onChange={event => router.push('/home?contextId=' + encodeURIComponent(event.target.value))}
                >
                  {contexts.map(ctx => <option key={ctx.id} value={ctx.id}>{getLocalizedText(ctx.course.names, uiLocale)}</option>)}
                </select>
              </label>
            )}
            {publishedPathCount > 0 && (
              <p id="pathProgressSummary" className="home-goal-line home-goal-line--target" style={{ margin: '0 0 16px' }}>
                {completedPathCount}/{publishedPathCount} bài đã hoàn thành
              </p>
            )}

            {/* Gamification & Quests Overview */}
            {homeData?.gamificationStatus === 'UNAVAILABLE' ? (
              <div
                id="gamificationUnavailableAlert"
                role="status"
                className="alert-box is-warning"
                style={{ marginTop: 0, marginBottom: '20px', fontSize: 'var(--font-size-sub)', color: 'var(--accent-ink)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                  <span>
                    <strong>Tiến độ học tập: </strong>
                    {homeData.gamificationMessage || 'Dữ liệu chuỗi ngày học và nhiệm vụ tạm thời không khả dụng do múi giờ tài khoản không hợp lệ.'}
                  </span>
                </div>
              </div>
            ) : (totalXp > 0 || streak.currentStreak > 0 || quests.length > 0 || dailyProgress.dailyGoalMinutes > 0) ? (
              <div
                id="gamificationOverview"
                className="home-stats"
              >
                <div id="dailyGoalDisplay" className="home-goal-line" style={{ marginBottom: '12px' }}>
                  <span aria-hidden="true">⏱️</span>
                  <span>Mục tiêu: {dailyProgress.dailyGoalMinutes} phút • {dailyProgress.completedLessonsToday} bài học • {dailyProgress.reviewsCompletedToday} từ đã ôn</span>
                </div>
                {streak.longestStreak > 0 && (
                  <p style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '10px' }}>
                    Kỷ lục chuỗi ngày: {streak.longestStreak} ngày
                  </p>
                )}

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
                  <div style={{ borderTop: '2px solid var(--border-subtle)', paddingTop: '14px', marginTop: '4px' }}>
                    <h3 className="section-title" style={{ fontSize: 'var(--font-size-body)' }}>Nhiệm vụ hôm nay</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                      {quests.map((q) => (
                        <div
                          key={q.id}
                          id={`quest-${q.id}`}
                          className={`quest-item home-quest${q.isCompleted ? ' is-done' : ''}`}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: 'var(--font-size-sub)', fontWeight: 800 }}>
                              {q.isCompleted ? '✅ ' : '🎯 '}{q.title}
                            </span>
                            <span className={`badge ${q.isCompleted ? 'badge-success' : 'badge-paused'}`}>
                              +{q.xpReward} XP
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="home-quest__bar">
                              <div
                                className="home-quest__fill"
                                style={{ width: `${Math.round((q.progress / q.target) * 100)}%` }}
                              />
                            </div>
                            <span style={{ fontSize: 'var(--font-size-ref)', fontWeight: 800, color: 'var(--text-muted)' }}>
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
                      marginTop: '14px',
                      padding: '12px 14px',
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent-ink)',
                      border: '2px solid #FBD5AE',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: 'var(--font-size-sub)',
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ fontSize: '22px' }} aria-hidden="true">🏆</span>
                    <span>
                      <strong>Thành tựu mới:</strong> {recentAchievement.title} - {recentAchievement.description}
                    </span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Learning Path (zig-zag map) */}
            {pathNodes.length > 0 && (
              <section id="learningPathSection" className="path-map">
                <h2 className="section-title path-map__title">Lộ trình bài học</h2>
                <div id="learningPathList" className="path-map__list">
                  {pathNodes.map((node, index) => {
                    const isNavigable = node.state === 'COMPLETED' || node.state === 'CURRENT' || node.state === 'AVAILABLE';
                    const isLocked = node.state === 'LOCKED' || node.state === 'COMING_SOON';
                    const showBanner = index === 0 || pathNodes[index - 1].unitTitle !== node.unitTitle;
                    // SCR-L-06: the unit counter tracks eligible required-lesson progress, so
                    // optional lessons (always open, never gating) are not part of "x/y".
                    const unitNodes = pathNodes.filter((n) => n.unitTitle === node.unitTitle && n.isRequired);
                    const unitDone = unitNodes.filter((n) => n.state === 'COMPLETED').length;
                    const unitOptional = pathNodes.filter((n) => n.unitTitle === node.unitTitle && !n.isRequired).length;
                    const offset = [0, 24, 40, 24, 0, -24, -40, -24][index % 8];
                    // G15: teacher titles already carry "Bài N:" most of the time; only number the rest.
                    const nodeTitle = node.state === 'COMING_SOON'
                      ? node.title
                      : numberedTitle('Bài', node.position, node.title);
                    const stateLabel =
                      node.state === 'COMPLETED' ? 'Đã hoàn thành'
                      : node.state === 'CURRENT' ? 'Đang học'
                      : node.state === 'AVAILABLE' ? 'Chưa bắt đầu'
                      : node.state === 'LOCKED' ? 'Đang khóa'
                      : 'Sắp ra mắt';
                    const medallion = (
                      <span className="path-node__medal">
                        {index === firstCurrentIndex && (
                          <span className="path-bubble" aria-hidden="true">{pathBubbleText}</span>
                        )}
                        <span className={`path-medallion path-medallion--${node.state.toLowerCase()}`} aria-hidden="true">
                          {node.state === 'COMPLETED' ? '✓' : isLocked ? '🔒' : node.state === 'CURRENT' ? '★' : index + 1}
                        </span>
                      </span>
                    );
                    return (
                      <React.Fragment key={node.lessonId || index}>
                        {showBanner && (
                          <div className="path-chapter">
                            <span className="path-chapter__name">{numberedTitle('Chương', node.unitPosition, node.unitTitle)}</span>
                            <span className="path-chapter__progress">
                              {unitDone}/{unitNodes.length}
                              {unitOptional > 0 && <span style={{ color: 'var(--text-muted)' }}> (+{unitOptional} tùy chọn)</span>}
                            </span>
                          </div>
                        )}
                        <div
                          id={`pathNode-${node.lessonId}`}
                          data-state={node.state}
                          className={`path-node path-node--${node.state.toLowerCase()}`}
                          style={{ transform: `translateX(${offset}px)` }}
                        >
                          {isNavigable ? (
                            <a href={node.href} id={`pathLink-${node.lessonId}`} className="path-node-link path-node__link">
                              {medallion}
                              <span className="path-node__text">
                                <span className="path-node__title">{nodeTitle}</span>
                              </span>
                            </a>
                          ) : (
                            <span id={`pathDisabled-${node.lessonId}`} className="path-node__link path-node__link--disabled">
                              {medallion}
                              <span className="path-node__text">
                                <span className="path-node__title">{nodeTitle}</span>
                              </span>
                            </span>
                          )}
                          <span className="path-node__meta">
                            {node.score != null && <span className="path-node__score">{node.score}%</span>}
                            {!node.isRequired && node.state !== 'COMING_SOON' && (
                              <span className="path-node__optional">Tùy chọn</span>
                            )}
                            {/* The state wording stays in the DOM for assistive tech (and tests);
                                the medallion carries it visually. */}
                            <span className="sr-only">{stateLabel}</span>
                          </span>
                        </div>
                      </React.Fragment>
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
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              {activeCount < 2 ? (
                  <a
                    href="/onboarding"
                    id="addOnboardingLanguageBtn"
                    className="btn btn-primary"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                  >
                    Thêm ngôn ngữ
                  </a>
              ) : (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Bạn đang học tối đa hai ngôn ngữ.
                </span>
              )}
            </div>

            <div id="contextList" className="context-grid">
              {contexts.map((ctx: LearningContextSummaryDto) => {
                const courseTitle = getLocalizedText(ctx.course.names, uiLocale);
                const langTitle = getLocalizedText(ctx.targetLanguage.names, uiLocale);
                const workingLvl = ctx.workingLevel
                  ? `${ctx.workingLevel.code} - ${getLocalizedText(
                      ctx.workingLevel.label,
                      uiLocale
                    )}`
                  : 'Chưa chọn trình độ';

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
                        <span className="context-detail-label">Trình độ hiện tại</span>
                        <span className="context-detail-value">{workingLvl}</span>
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
                        {optionsError && (
                          <div id="optionsErrorAlert" role="alert" className="login-alert" style={{ marginBottom: '10px' }}>
                            <span>{optionsError}</span>
                            <button id="retryOptionsBtn" type="button" className="btn btn-outline" onClick={handleRetryOptions}>
                              Thử tải lại
                            </button>
                          </div>
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
