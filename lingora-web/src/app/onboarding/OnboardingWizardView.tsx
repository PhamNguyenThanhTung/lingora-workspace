'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { LearnerDto, LearningContextSummaryDto, ContextOptionsData } from '../../server/context/dto.ts';
import {
  ALLOWED_PURPOSES,
  ALLOWED_DAILY_GOALS,
  ALLOWED_INTERESTS,
  type OnboardingPurpose,
  type DailyGoalMinutes,
  type OnboardingPreviewData,
  type OnboardingCompleteData,
  type OnboardingCompleteInput,
} from '../../server/context/onboarding-dto.ts';

const PURPOSE_LABELS: Record<OnboardingPurpose, string> = {
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

const REASON_LABELS: Record<string, string> = {
  LOWEST_AVAILABLE_LEVEL: 'Trình độ cơ bản nhất có bài học phát hành',
  SELF_REPORTED_LEVEL: 'Theo trình độ bạn tự lựa chọn',
  PLACEMENT_RECOMMENDED_LEVEL: 'Theo kết quả bài kiểm tra đầu vào',
  PURPOSE_MATCH: 'Phù hợp với mục đích học tập của bạn',
};

interface Props {
  learner: LearnerDto;
  existingContexts?: LearningContextSummaryDto[];
}

export function OnboardingWizardView({ learner, existingContexts = [] }: Props) {
  const router = useRouter();
  const draftKey = `lingora_onboarding_draft_${learner.id}`;

  const [step, setStep] = useState<number>(1);
  const [options, setOptions] = useState<ContextOptionsData | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // Form state
  const [contextId, setContextId] = useState<string>('');
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');
  const [purpose, setPurpose] = useState<OnboardingPurpose | null>(null);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<DailyGoalMinutes>(10);
  const [interests, setInterests] = useState<string[]>([]);
  const [startSource, setStartSource] = useState<'DEFAULT' | 'SELF_REPORT'>('DEFAULT');
  const [defaultCourseId, setDefaultCourseId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLevelId, setSelectedLevelId] = useState<string>('');

  // Preview & complete state
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<OnboardingPreviewData | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const inFlight = useRef(false);
  const [pendingComplete, setPendingComplete] = useState<OnboardingCompleteInput | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [completeResult, setCompleteResult] = useState<OnboardingCompleteData | null>(null);

  const optionsRequestCount = useRef(0);
  const isMounted = useRef(true);

  const fetchOptions = async () => {
    const requestId = ++optionsRequestCount.current;
    setIsLoadingOptions(true);
    setOptionsError(null);
    try {
      const res = await fetch('/api/learner/context/options');
      if (!res.ok) {
        let errorMsg = 'Không thể tải danh sách khóa học. Vui lòng thử lại.';
        try {
          const json = await res.json();
          if (json?.error?.message) errorMsg = json.error.message;
        } catch {}
        throw new Error(errorMsg);
      }
      const json = await res.json();
      if (isMounted.current && requestId === optionsRequestCount.current) {
        setOptions(json.data);
        setIsLoadingOptions(false);
      }
    } catch (err: any) {
      if (isMounted.current && requestId === optionsRequestCount.current) {
        setOptionsError(err.message || 'Lỗi kết nối khi tải danh mục.');
        setIsLoadingOptions(false);
      }
    }
  };

  // Load options on mount
  useEffect(() => {
    isMounted.current = true;
    fetchOptions();
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Restore draft from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft && typeof draft === 'object') {
          if (draft.pendingComplete?.contextId === draft.contextId && draft.pendingComplete?.entryChoice) {
            setPendingComplete(draft.pendingComplete);
          }
          if (typeof draft.contextId === 'string') setContextId(draft.contextId);
          if (typeof draft.languageId === 'string') setSelectedLanguageId(draft.languageId);
          if (draft.purpose) setPurpose(draft.purpose);
          if ([5, 10, 15, 20].includes(draft.dailyGoalMinutes)) setDailyGoalMinutes(draft.dailyGoalMinutes);
          if (Array.isArray(draft.interests)) setInterests(draft.interests);
          if (draft.startSource === 'DEFAULT' || draft.startSource === 'SELF_REPORT') setStartSource(draft.startSource);
          if (typeof draft.defaultCourseId === 'string') setDefaultCourseId(draft.defaultCourseId);
          if (typeof draft.courseId === 'string') setSelectedCourseId(draft.courseId);
          if (typeof draft.levelId === 'string') setSelectedLevelId(draft.levelId);
          if (typeof draft.step === 'number' && draft.step >= 1 && draft.step <= 6) setStep(draft.step);
        }
      }
    } catch {
      // Ignore corrupted sessionStorage
    }
  }, [draftKey]);

  // Ensure stable contextId exists
  useEffect(() => {
    if (!contextId) {
      setContextId(crypto.randomUUID());
    }
  }, [contextId]);

  // Save draft to sessionStorage
  useEffect(() => {
    if (completeResult) return; // Do not save draft once completed
    try {
      const draft = {
        contextId,
        pendingComplete,
        languageId: selectedLanguageId,
        purpose,
        dailyGoalMinutes,
        interests,
        startSource,
        ...(defaultCourseId ? { defaultCourseId } : {}),
        courseId: selectedCourseId,
        levelId: selectedLevelId,
        step,
      };
      sessionStorage.setItem(draftKey, JSON.stringify(draft));
    } catch {
      // Ignore sessionStorage quota errors
    }
  }, [draftKey, contextId, selectedLanguageId, purpose, dailyGoalMinutes, interests, startSource, defaultCourseId, selectedCourseId, selectedLevelId, step, completeResult, pendingComplete]);

  // Clear draft on successful complete
  const handleClearDraft = () => {
    try {
      sessionStorage.removeItem(draftKey);
    } catch {}
  };

  // Helper for localized text
  const getLocalized = (val: any) => {
    if (!val || typeof val !== 'object') return '';
    return val[learner.uiLocale] || val.vi || val.en || Object.values(val)[0] || '';
  };

  // When language changes, clear dependent course/level/preview
  const handleSelectLanguage = (langId: string) => {
    if (langId !== selectedLanguageId) {
      setSelectedLanguageId(langId);
      setDefaultCourseId('');
      setSelectedCourseId('');
      setSelectedLevelId('');
      setPreviewData(null);
      setPreviewError(null);
    }
  };

  // Toggle interest
  const toggleInterest = (interest: string) => {
    setInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      }
      if (prev.length >= 5) return prev; // max 5
      return [...prev, interest];
    });
  };

  // Current selected language & eligible courses
  const selectedLang = options?.languages.find((l) => l.id === selectedLanguageId);
  const candidateCourses = (selectedLang?.courses || []).filter((c) => c.levels.length > 0);
  const selectedCourse = candidateCourses.find((c) => c.id === selectedCourseId) || candidateCourses[0];
  const eligibleLevels = selectedCourse?.levels || [];

  // Request preview
  const fetchPreview = async () => {
    if (!selectedLanguageId) return;
    setIsLoadingPreview(true);
    setPreviewError(null);
    try {
      const entryChoice = startSource === 'DEFAULT'
        ? {
            startSource: 'DEFAULT' as const,
            ...(defaultCourseId ? { courseId: defaultCourseId } : {}),
          }
        : {
            startSource: 'SELF_REPORT' as const,
            courseId: selectedCourse?.id || selectedCourseId,
            levelId: selectedLevelId || eligibleLevels[0]?.id || '',
          };

      const res = await fetch('/api/learner/onboarding/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          languageId: selectedLanguageId,
          purpose,
          dailyGoalMinutes,
          interests,
          entryChoice,
        }),
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || 'Không thể tạo bản xem trước lộ trình.');
      }

      const json = await res.json();
      setPreviewData(json.data);
      setStep(6);
    } catch (err: any) {
      setPreviewError(err.message || 'Lỗi kết nối khi xem trước lộ trình.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Auto-fetch preview if restored at Step 6 without previewData
  useEffect(() => {
    if (
      !isLoadingOptions &&
      options &&
      step === 6 &&
      !previewData &&
      !pendingComplete &&
      !isLoadingPreview &&
      selectedLanguageId &&
      !completeResult &&
      !previewError
    ) {
      fetchPreview();
    }
  }, [
    isLoadingOptions,
    options,
    step,
    previewData,
    isLoadingPreview,
    selectedLanguageId,
    defaultCourseId,
    completeResult,
    previewError,
    pendingComplete,
  ]);

  // Complete onboarding
  const handleComplete = async () => {
    if (inFlight.current || (!pendingComplete && (!contextId || previewData?.status !== 'READY'))) return;
    const payload: OnboardingCompleteInput = pendingComplete ?? {
      contextId,
      languageId: selectedLanguageId,
      purpose,
      dailyGoalMinutes,
      interests,
      entryChoice: startSource === 'DEFAULT'
        ? {
            startSource: 'DEFAULT',
            ...(defaultCourseId ? { courseId: defaultCourseId } : {}),
          }
        : { startSource: 'SELF_REPORT', courseId: previewData!.course!.id, levelId: previewData!.startLevel!.id },
      expectedCourseId: previewData!.course!.id,
      expectedStartLevelId: previewData!.startLevel!.id,
    };

    inFlight.current = true;
    setIsSubmitting(true);
    setPendingComplete(payload);
    setCompleteError(null);

    try {
      sessionStorage.setItem(draftKey, JSON.stringify({
        contextId, pendingComplete: payload, languageId: selectedLanguageId, purpose, dailyGoalMinutes,
        interests, startSource, courseId: selectedCourseId, levelId: selectedLevelId, step: 6,
        ...(defaultCourseId ? { defaultCourseId } : {}),
      }));
    } catch {}

    try {
      const res = await fetch('/api/learner/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const json = await res.json();
        if (res.status < 500) setPendingComplete(null);
        if (res.status === 409 && json.error?.code === 'RECOMMENDATION_CHANGED') {
          setCompleteError('Lộ trình đề xuất đã thay đổi do nội dung khóa học được cập nhật. Vui lòng xem lại thông tin mới trước khi lưu.');
          // Re-fetch preview to update with fresh data
          setPreviewData(null);
          await fetchPreview();
          return;
        }
        throw new Error(json.error?.message || 'Không thể lưu lộ trình học tập.');
      }

      const json = await res.json();
      setCompleteResult(json.data);
      setPendingComplete(null);
      handleClearDraft();
      setStep(7);
    } catch (err: any) {
      setCompleteError(err.message || 'Lỗi khi lưu lộ trình học tập. Vui lòng thử lại.');
    } finally {
      inFlight.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div id="onboardingWizardView" className="app-container" style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <header style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
            {step === 7 ? 'Lộ trình học tập của bạn' : 'Thiết lập lộ trình học cá nhân'}
          </h1>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: '0.85rem' }}
            onClick={() => router.push('/home')}
          >
            Về trang chủ
          </button>
        </div>
        {step < 7 && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '14px' }}>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  background: s <= step ? 'var(--primary, #2563eb)' : 'var(--border-color, #e2e8f0)',
                  transition: 'background 0.2s',
                }}
              />
            ))}
          </div>
        )}
      </header>

      {/* Global Alerts */}
      {completeError && (
        <div id="onboardingAlert" role="alert" className="login-alert" style={{ marginBottom: '16px' }}>
          <span>{completeError}</span>
        </div>
      )}

      {/* STEP 1: Chọn ngôn ngữ */}
      {step === 1 && (
        <section id="stepLanguage">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>
            Bước 1: Bạn muốn học ngôn ngữ nào?
          </h2>
          <p style={{ color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
            Chọn ngôn ngữ mục tiêu để bắt đầu hành trình.
          </p>

          {isLoadingOptions && (
            <p id="optionsLoading" style={{ color: 'var(--text-muted)' }}>
              Đang tải danh sách ngôn ngữ...
            </p>
          )}

          {optionsError && (
            <div
              id="optionsAlert"
              role="alert"
              className="login-alert"
              style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <span>{optionsError}</span>
              <div>
                <button
                  type="button"
                  id="btnRetryOptions"
                  className="btn btn-secondary"
                  disabled={isLoadingOptions}
                  onClick={fetchOptions}
                >
                  {isLoadingOptions ? 'Đang thử lại...' : 'Thử lại'}
                </button>
              </div>
            </div>
          )}

          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend
              style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
              }}
            >
              Danh sách ngôn ngữ có sẵn
            </legend>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              {(options?.languages || []).map((lang) => {
                const hasCourses = lang.courses.some((c) => c.levels.length > 0);
                const alreadyActive = existingContexts.some((c: any) => c.targetLanguage.id === lang.id);
                const isSelected = selectedLanguageId === lang.id;
                const langName = getLocalized(lang.names);
                const isAvailable = hasCourses && !alreadyActive;

                const descriptionId = !hasCourses
                  ? `langStatusUnavailable-${lang.code}`
                  : alreadyActive
                  ? `langStatusOwned-${lang.code}`
                  : undefined;

                return (
                  <label
                    key={lang.id}
                    id={`langOption-${lang.code}`}
                    htmlFor={`langRadio-${lang.code}`}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '16px',
                      borderRadius: '8px',
                      border: isSelected
                        ? '2px solid var(--primary, #2563eb)'
                        : '1px solid var(--border-color, #e2e8f0)',
                      background: isSelected ? 'var(--subtle-bg, #eff6ff)' : '#fff',
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      opacity: isAvailable ? 1 : 0.6,
                      position: 'relative',
                    }}
                    onKeyDown={(e) => {
                      if ((e.key === ' ' || e.key === 'Enter') && isAvailable) {
                        e.preventDefault();
                        handleSelectLanguage(lang.id);
                      }
                    }}
                  >
                    <input
                      type="radio"
                      id={`langRadio-${lang.code}`}
                      name="targetLanguage"
                      value={lang.id}
                      checked={isSelected}
                      disabled={!isAvailable}
                      onChange={() => {
                        if (isAvailable) handleSelectLanguage(lang.id);
                      }}
                      aria-describedby={descriptionId}
                      aria-label={langName}
                      style={{ marginTop: '3px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '4px' }}>
                        {langName}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Mã: {lang.code.toUpperCase()}
                      </div>
                      {!hasCourses && (
                        <span
                          id={`langStatusUnavailable-${lang.code}`}
                          style={{
                            fontSize: '0.75rem',
                            color: '#b45309',
                            background: '#fef3c7',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginTop: '6px',
                            display: 'inline-block',
                          }}
                        >
                          {langName}: Sắp có nội dung
                        </span>
                      )}
                      {alreadyActive && (
                        <span
                          id={`langStatusOwned-${lang.code}`}
                          style={{
                            fontSize: '0.75rem',
                            color: '#1d4ed8',
                            background: '#dbeafe',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginTop: '6px',
                            display: 'inline-block',
                          }}
                        >
                          {langName}: Đã có lộ trình
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              id="btnStep1Next"
              className="btn btn-primary"
              disabled={!selectedLanguageId}
              onClick={() => setStep(2)}
            >
              Tiếp tục
            </button>
          </div>
        </section>
      )}

      {/* STEP 2: Mục đích học tập */}
      {step === 2 && (
        <section id="stepPurpose">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>
            Bước 2: Mục đích học tập chính của bạn là gì?
          </h2>
          <p style={{ color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
            Chúng tôi sẽ gợi ý bài học phù hợp với nhu cầu thực tế của bạn (không bắt buộc).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', marginBottom: '24px' }}>
            {ALLOWED_PURPOSES.map((p) => {
              const isSelected = purpose === p;
              return (
                <label
                  key={p}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--primary, #2563eb)' : '1px solid var(--border-color, #e2e8f0)',
                    background: isSelected ? 'var(--subtle-bg, #eff6ff)' : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="onboardingPurpose"
                    value={p}
                    checked={isSelected}
                    onChange={() => setPurpose(p)}
                  />
                  <span style={{ fontSize: '0.95rem', fontWeight: isSelected ? 600 : 400 }}>
                    {PURPOSE_LABELS[p]}
                  </span>
                </label>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
              Quay lại
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setPurpose(null);
                  setStep(3);
                }}
              >
                Bỏ qua
              </button>
              <button
                type="button"
                id="btnStep2Next"
                className="btn btn-primary"
                onClick={() => setStep(3)}
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </section>
      )}

      {/* STEP 3: Thời gian học mỗi ngày */}
      {step === 3 && (
        <section id="stepDailyGoal">
          <h2 id="dailyGoalHeading" style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>
            Bước 3: Bạn muốn dành bao nhiêu thời gian mỗi ngày?
          </h2>
          <p style={{ color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
            Chọn mục tiêu phù hợp để duy trì thói quen học tập đều đặn.
          </p>

          <div role="radiogroup" aria-labelledby="dailyGoalHeading" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {ALLOWED_DAILY_GOALS.map((mins) => {
              const isSelected = dailyGoalMinutes === mins;
              return (
                <label
                  key={mins}
                  id={`goalOption-${mins}`}
                  style={{
                    padding: '20px 12px',
                    textAlign: 'center',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid var(--primary, #2563eb)' : '1px solid var(--border-color, #e2e8f0)',
                    background: isSelected ? 'var(--subtle-bg, #eff6ff)' : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <input type="radio" name="dailyGoalMinutes" value={mins} checked={isSelected} onChange={() => setDailyGoalMinutes(mins)} />
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: isSelected ? 'var(--primary, #2563eb)' : 'inherit' }}>
                    {mins}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>phút / ngày</div>
                </label>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
              Quay lại
            </button>
            <button
              type="button"
              id="btnStep3Next"
              className="btn btn-primary"
              onClick={() => setStep(4)}
            >
              Tiếp tục
            </button>
          </div>
        </section>
      )}

      {/* STEP 4: Sở thích */}
      {step === 4 && (
        <section id="stepInterests">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>
            Bước 4: Chủ đề bạn quan tâm (Tối đa 5 chủ đề)
          </h2>
          <p style={{ color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
            Đã chọn: {interests.length}/5 chủ đề.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '24px' }}>
            {ALLOWED_INTERESTS.map((interest) => {
              const isSelected = interests.includes(interest);
              const isDisabled = !isSelected && interests.length >= 5;

              return (
                <label
                  key={interest}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--primary, #2563eb)' : '1px solid var(--border-color, #e2e8f0)',
                    background: isSelected ? 'var(--subtle-bg, #eff6ff)' : '#fff',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.6 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => toggleInterest(interest)}
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: isSelected ? 600 : 400 }}>
                    {INTEREST_LABELS[interest] || interest}
                  </span>
                </label>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(3)}>
              Quay lại
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setInterests([]);
                  setStep(5);
                }}
              >
                Bỏ qua
              </button>
              <button
                type="button"
                id="btnStep4Next"
                className="btn btn-primary"
                onClick={() => setStep(5)}
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </section>
      )}

      {/* STEP 5: Điểm bắt đầu */}
      {step === 5 && (
        <section id="stepStartingPoint">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>
            Bước 5: Bạn muốn bắt đầu từ đâu?
          </h2>
          <p style={{ color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
            Chọn phương án bắt đầu phù hợp với trình độ hiện tại của bạn.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            <label
              id="optStartDefault"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px',
                borderRadius: '8px',
                border: startSource === 'DEFAULT' ? '2px solid var(--primary, #2563eb)' : '1px solid var(--border-color, #e2e8f0)',
                background: startSource === 'DEFAULT' ? 'var(--subtle-bg, #eff6ff)' : '#fff',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="startingSource"
                value="DEFAULT"
                checked={startSource === 'DEFAULT'}
                onChange={() => setStartSource('DEFAULT')}
                style={{ marginTop: '3px' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '4px' }}>
                  Mới bắt đầu
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Học từ bài học đầu tiên trong trình độ cơ bản nhất. Dành cho người mới bắt đầu.
                </div>
              </div>
            </label>

            <label
              id="optStartSelfReport"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px',
                borderRadius: '8px',
                border: startSource === 'SELF_REPORT' ? '2px solid var(--primary, #2563eb)' : '1px solid var(--border-color, #e2e8f0)',
                background: startSource === 'SELF_REPORT' ? 'var(--subtle-bg, #eff6ff)' : '#fff',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="startingSource"
                value="SELF_REPORT"
                checked={startSource === 'SELF_REPORT'}
                onChange={() => {
                  setStartSource('SELF_REPORT');
                  if (!selectedCourseId && candidateCourses.length > 0) {
                    setSelectedCourseId(candidateCourses[0].id);
                  }
                  if (!selectedLevelId && eligibleLevels.length > 0) {
                    setSelectedLevelId(eligibleLevels[0].id);
                  }
                }}
                style={{ marginTop: '3px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '4px' }}>
                  Tôi biết trình độ của mình
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Bạn đã có kiến thức nền tảng và muốn bắt đầu từ trình độ phù hợp.
                </div>

                {startSource === 'SELF_REPORT' && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border-color, #e2e8f0)' }}>
                    {candidateCourses.length > 1 && (
                      <div style={{ marginBottom: '12px' }}>
                        <label htmlFor="courseSelect" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 600 }}>
                          Khóa học:
                        </label>
                        <select
                          id="courseSelect"
                          className="form-control"
                          value={selectedCourse?.id || ''}
                          onChange={(e) => {
                            setSelectedCourseId(e.target.value);
                            setSelectedLevelId('');
                          }}
                        >
                          {candidateCourses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {getLocalized(c.names)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label htmlFor="levelSelect" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 600 }}>
                        Trình độ:
                      </label>
                      <select
                        id="levelSelect"
                        className="form-control"
                        value={selectedLevelId || eligibleLevels[0]?.id || ''}
                        onChange={(e) => setSelectedLevelId(e.target.value)}
                      >
                        {eligibleLevels.map((lvl) => (
                          <option key={lvl.id} value={lvl.id}>
                            {lvl.code} - {getLocalized(lvl.label)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>

          {startSource === 'DEFAULT' && candidateCourses.length > 1 && (
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="defaultCourseSelect" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 600 }}>
                Khóa học (tùy chọn)
              </label>
              <select
                id="defaultCourseSelect"
                className="form-control"
                value={defaultCourseId}
                onChange={(event) => {
                  setDefaultCourseId(event.target.value);
                  setPreviewData(null);
                  setPreviewError(null);
                }}
              >
                <option value="">Tự chọn theo đề xuất</option>
                {candidateCourses.map((course) => (
                  <option key={course.id} value={course.id}>{getLocalized(course.names)}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(4)}>
              Quay lại
            </button>
            <button
              type="button"
              id="btnStep5Preview"
              className="btn btn-primary"
              disabled={isLoadingPreview || (startSource === 'SELF_REPORT' && eligibleLevels.length === 0)}
              onClick={fetchPreview}
            >
              {isLoadingPreview ? 'Đang phân tích...' : 'Xem lộ trình đề xuất'}
            </button>
          </div>
        </section>
      )}

      {/* STEP 6: Xem trước lộ trình */}
      {step === 6 && (
        <section id="stepPreview">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>
            Bước 6: Lộ trình học tập đề xuất cho bạn
          </h2>
          <p style={{ color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
            Xem lại thông tin lộ trình trước khi lưu vào tài khoản.
          </p>

          {previewError && <div className="login-alert" style={{ marginBottom: '16px' }}>{previewError}</div>}

          {isLoadingPreview && (
            <div id="previewLoading" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Đang phân tích và tải bản xem trước lộ trình...
            </div>
          )}

          {previewData?.status === 'NO_ELIGIBLE_CURRICULUM' ? (
            <div style={{ padding: '24px', background: '#fef3c7', borderRadius: '8px', color: '#92400e', marginBottom: '24px' }}>
              <div style={{ fontWeight: 600, marginBottom: '6px' }}>Sắp có nội dung</div>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                {previewData.message || 'Khóa học này hiện chưa có bài học nào được phát hành. Vui lòng chọn ngôn ngữ khác.'}
              </p>
            </div>
          ) : previewData?.status === 'READY' ? (
            <div id="previewCard" style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)', background: '#fff', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Khóa học</div>
                  <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{getLocalized(previewData.course?.names)}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Điểm bắt đầu đề xuất</div>
                  <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--primary, #2563eb)' }}>
                    {previewData.startLevel?.code} - {getLocalized(previewData.startLevel?.label)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nguồn đề xuất</div>
                  <div style={{ fontWeight: 500 }}>
                    {previewData.source === 'DEFAULT' ? 'Mới bắt đầu' : 'Tôi biết trình độ của mình'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mục tiêu học tập</div>
                  <div style={{ fontWeight: 600 }}>{dailyGoalMinutes} phút / ngày</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Mục tiêu do bạn chọn)</div>
                </div>
              </div>

              {/* Reasons */}
              {previewData.reasonCodes && previewData.reasonCodes.length > 0 && (
                <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--subtle-bg, #f8fafc)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Lý do đề xuất:</div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {previewData.reasonCodes.map((code) => (
                      <li key={code}>{REASON_LABELS[code] || code}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next lesson */}
              {previewData.nextLesson ? (
                <div style={{ padding: '12px', border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: 600 }}>Bài học sẵn sàng để mở:</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>
                    {getLocalized(previewData.nextLesson.title) || previewData.nextLesson.id}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Bạn có thể duyệt toàn bộ bài học sau khi lưu lộ trình.
                </p>
              )}
            </div>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(5)} disabled={isSubmitting || !!pendingComplete}>
              Quay lại
            </button>
            {(pendingComplete || previewData?.status === 'READY') && (
              <button
                type="button"
                id="btnCompleteOnboarding"
                className="btn btn-primary"
                disabled={isSubmitting}
                onClick={handleComplete}
              >
                {isSubmitting ? 'Đang lưu lộ trình...' : pendingComplete ? 'Thử lưu lại' : 'Lưu và bắt đầu học'}
              </button>
            )}
          </div>
        </section>
      )}

      {/* STEP 7: Màn hình kết quả */}
      {step === 7 && completeResult && (
        <section id="stepResult">
          <div style={{ textAlign: 'center', padding: '32px 16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', marginBottom: '24px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎉</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1E40AF', marginBottom: '6px' }}>
              Chào mừng bạn đến với lộ trình học!
            </h2>
            <p style={{ color: '#1d4ed8', fontSize: '0.95rem', margin: '0 0 16px' }}>
              Lộ trình cá nhân hóa đã được kích hoạt thành công.
            </p>

            <div style={{ display: 'inline-block', textAlign: 'left', background: '#fff', padding: '16px 20px', borderRadius: '8px', border: '1px solid #dbeafe', marginBottom: '20px', minWidth: '280px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Điểm bắt đầu:</div>
              <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--primary, #2563eb)', marginBottom: '8px' }}>
                {completeResult.plan.startLevel.code} - {getLocalized(completeResult.plan.startLevel.label)}
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mục tiêu học mỗi ngày:</div>
              <div style={{ fontWeight: 600 }}>{completeResult.plan.dailyGoalMinutes} phút / ngày</div>
            </div>

            <div>
              {completeResult.nextLesson ? (
                <a
                  href={completeResult.nextLesson.href}
                  id="btnStartFirstLesson"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', display: 'inline-block', padding: '10px 24px', fontSize: '1rem' }}
                >
                  Bắt đầu bài học đầu tiên
                </a>
              ) : (
                <a
                  href={`/learn/${completeResult.context.id}`}
                  id="btnEnterCatalogue"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', display: 'inline-block', padding: '10px 24px', fontSize: '1rem' }}
                >
                  Mở danh mục bài học
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
