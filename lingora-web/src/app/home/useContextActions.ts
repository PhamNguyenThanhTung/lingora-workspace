'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LearningContextSummaryDto, ContextOptionsData } from '../../server/context/dto.ts';

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

/**
 * Context lifecycle actions kept from the old home page: pause/resume, start-level recovery and the
 * per-context goal editor. They moved out of HomeView so the path map stays the focus of /home.
 */
export function useContextActions(initialContexts: LearningContextSummaryDto[]) {
  const router = useRouter();
  const [contexts, setContexts] = useState<LearningContextSummaryDto[]>(initialContexts);

  useEffect(() => {
    setContexts(initialContexts);
  }, [initialContexts]);

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

  return {
    contexts, setContexts, options, isLoadingOptions, optionsError,
    pendingContexts, contextErrors,
    recoveringContextId, recoveringSource, setRecoveringSource, recoveringLevelId, setRecoveringLevelId, isRecovering,
    editingGoalContextId, setEditingGoalContextId, goalMinutesState, setGoalMinutesState,
    purposeDraft, setPurposeDraft, interestsDraft, setInterestsDraft, serverPreferences,
    pendingGoalPayloads, isLoadingPlan, isUpdatingGoal, goalErrors,
    handleOpenGoalEditor, handleSaveGoal, handleOpenStartLevel, handleCancelStartLevel,
    handleConfirmStartLevel, handleRetryOptions, handlePause, handleResume,
    refresh: () => router.refresh(),
  };
}

export type ContextActions = ReturnType<typeof useContextActions>;
