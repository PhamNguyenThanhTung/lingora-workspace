'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LearnerExerciseDto, PracticeAttemptDto } from '../../../../server/lessons/dto.ts';

interface PracticeSectionProps {
  contextId: string;
  lessonId: string;
  revisionId: string;
  exercises: LearnerExerciseDto[];
  initialAttempt?: PracticeAttemptDto | null;
}
type PracticePrompt = { prompt: string; options?: Array<{id: string; text: string}>; tokens?: Array<{id: string; text: string}>; sentence?: string; sourceSentence?: string; targetPattern?: string; audioUrl?: string };
type Command = { kind: 'start' | 'response' | 'finalize'; path: string; body: Record<string, unknown> };

/**
 * Deterministic shuffle (seeded by attempt + exercise id) so options/tokens are not
 * shown in answer order, yet stay stable across re-renders and reloads. Grading is
 * by id on the server, so display order never affects correctness.
 */
function seededShuffle<T>(items: T[], seed: string): T[] {
  if (items.length < 2) return items;
  const original = items.slice();
  for (let salt = 0; salt < 8; salt++) {
    let h = 2166136261;
    const key = `${seed}:${salt}`;
    for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
    const next = () => { h += 0x6d2b79f5; let t = Math.imul(h ^ (h >>> 15), 1 | h); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    if (out.some((x, i) => x !== original[i])) return out;
  }
  return original.reverse();
}

export function PracticeSection({ contextId, lessonId, revisionId, exercises, initialAttempt = null }: PracticeSectionProps) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<PracticeAttemptDto | null>(initialAttempt);
  const [isActionPending, setIsActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(!!initialAttempt?.isStale && !initialAttempt?.isCompleted);
  const [accessError, setAccessError] = useState<number | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [audioErrors, setAudioErrors] = useState<Record<string, boolean>>({});
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [textInput, setTextInput] = useState('');
  const [reorderTokens, setReorderTokens] = useState<string[]>([]);
  const [lastFeedback, setLastFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [feedbackSeq, setFeedbackSeq] = useState(0);
  const [dismissedSeq, setDismissedSeq] = useState(-1);
  const [sessionOpen, setSessionOpen] = useState(true);
  const [confirmExit, setConfirmExit] = useState(false);
  const [finalizeReward, setFinalizeReward] = useState<{
    lessonXp: number;
    questXp: number;
    earnedAchievements: Array<{ code: string; title: string; description: string }>;
    newlyEnrolledCount: number;
    firstTryAccuracy: number;
    streak: number;
  } | null>(initialAttempt?.rewards ?? null);
  const busy = useRef(false);
  // A lost response may follow commit. Keep its identity/payload until resolved.
  const pending = useRef<Command | null>(null);
  const blocked = isActionPending || isStale || accessError != null;
  const inputBlocked = blocked || uncertain;
  const prefix = `/api/learner/contexts/${contextId}/lessons/${lessonId}/attempts`;
  const coreExercises = exercises.filter(ex => ex.isCore);
  const prompt = attempt?.nextExercise?.promptData as PracticePrompt | undefined;
  const shuffleSeed = `${attempt?.id ?? ''}:${attempt?.nextExercise?.id ?? ''}`;
  const shuffledOptions = seededShuffle(prompt?.options ?? [], shuffleSeed);
  const shuffledTokens = seededShuffle(prompt?.tokens ?? [], shuffleSeed);
  const answered = attempt?.responses.length ?? 0;
  const retriesQueued = attempt?.responses.filter((r) => !r.isCorrect && r.responseOrdinal === 1).length ?? 0;
  const totalSteps = coreExercises.length + retriesQueued;
  const progressPct = attempt?.isCompleted ? 100 : Math.round(Math.min(1, answered / Math.max(totalSteps, 1)) * 100);
  // Consecutive correct answers ending at the most recent response.
  let combo = 0;
  for (let i = (attempt?.responses.length ?? 0) - 1; i >= 0; i--) {
    if (attempt!.responses[i].isCorrect) combo++; else break;
  }
  const sessionActive = !!attempt && !attempt.isCompleted && sessionOpen;

  async function execute(candidate: Command) {
    if (busy.current || isStale || accessError != null) return;
    const command = pending.current ?? candidate;
    busy.current = true;
    pending.current = command;
    setIsActionPending(true);
    setActionError(null);
    try {
      const response = await fetch(command.path, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Origin: window.location.origin },
        body: JSON.stringify(command.body),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status < 500) { pending.current = null; setUncertain(false); }
        else setUncertain(true);
        if (response.status === 401 || response.status === 403) setAccessError(response.status);
        if (response.status === 409 && result.error?.code === 'PUBLICATION_CHANGED') setIsStale(true);
        setActionError(result.error?.message || 'Chưa thể thực hiện thao tác. Vui lòng thử lại.');
        return;
      }
      const dto = command.kind === 'start' ? result.data : result.data?.attempt;
      const expectedId = command.kind === 'start' ? command.body.attemptId : attempt?.id;
      const expectedRevision = command.kind === 'start' ? command.body.expectedPublishedRevisionId : attempt?.lessonRevisionId;
      if (!dto || dto.id !== expectedId || dto.contextId !== contextId || dto.lessonId !== lessonId ||
          dto.lessonRevisionId !== expectedRevision || typeof dto.isCompleted !== 'boolean' ||
          typeof dto.isStale !== 'boolean' || !Array.isArray(dto.responses) || !Array.isArray(dto.exercises) ||
          (dto.isCompleted && (!dto.completedAt || !dto.score)) ||
          (dto.nextExercise && !dto.exercises.some((ex: LearnerExerciseDto) => ex.id === dto.nextExercise.id && ex.itemRevisionId === dto.nextExercise.itemRevisionId))) {
        throw new Error('Phản hồi chưa hợp lệ. Vui lòng thử lại hoặc tải lại phiên học.');
      }
      if (command.kind === 'response') {
        const feedback = result.data?.response;
        if (!feedback || feedback.lessonExerciseId !== command.body.lessonExerciseId ||
            typeof feedback.isCorrect !== 'boolean' || typeof feedback.formativeFeedback !== 'string') {
          throw new Error('Phản hồi câu trả lời chưa hợp lệ. Vui lòng thử lại.');
        }
        setLastFeedback({ isCorrect: feedback.isCorrect, message: feedback.formativeFeedback });
        setFeedbackSeq((n) => n + 1);
      } else setLastFeedback(null);
      if (command.kind === 'finalize' && !dto.isCompleted) throw new Error('Chưa ghi nhận kết quả hoàn thành. Vui lòng thử lại.');
      if (command.kind === 'start') { setFinalizeReward(null); setSessionOpen(true); }
      if (command.kind === 'finalize' && result.data) {
        setFinalizeReward({
          lessonXp: Number(result.data.lessonXp || 0),
          questXp: Number(result.data.questXp || 0),
          earnedAchievements: Array.isArray(result.data.earnedAchievements) ? result.data.earnedAchievements : [],
          newlyEnrolledCount: Number(result.data.newlyEnrolledCount || 0),
          firstTryAccuracy: Number(result.data.firstTryAccuracy || 0),
          streak: Number(result.data.streak || 0),
        });
      }
      pending.current = null;
      setUncertain(false);
      setAttempt(dto);
      setSelectedOptionId(''); setTextInput(''); setReorderTokens([]);
      if (dto.isStale && !dto.isCompleted) {
        setIsStale(true);
        setActionError('Nội dung đã được cập nhật. Tải lại để bắt đầu bài làm theo nội dung mới.');
      }
    } catch (err: unknown) {
      setUncertain(true);
      setActionError(err instanceof Error ? err.message : 'Chưa nhận được kết quả. Vui lòng thử lại.');
    } finally {
      busy.current = false;
      setIsActionPending(false);
    }
  }

  const handleStartAttempt = () => execute({ kind: 'start', path: prefix,
    body: { attemptId: crypto.randomUUID(), expectedPublishedRevisionId: revisionId } });

  const handleSubmitResponse = () => {
    if (!attempt?.nextExercise || blocked) return;
    if (pending.current) { void execute(pending.current); return; }
    const ex = attempt.nextExercise;
    let input: { optionId: string } | { text: string } | { tokenIds: string[] };
    if (ex.type === 'MCQ' || ex.type === 'LISTENING') {
      if (!selectedOptionId) { setActionError('Vui lòng chọn một đáp án.'); return; }
      input = { optionId: selectedOptionId };
    } else if (ex.type === 'FILL_BLANK' || ex.type === 'GRAMMAR') {
      if (!textInput.trim()) { setActionError('Vui lòng nhập câu trả lời.'); return; }
      input = { text: textInput };
    } else {
      const tokens = (ex.promptData as { tokens: Array<{id: string}> }).tokens;
      if (reorderTokens.length !== tokens.length) { setActionError('Vui lòng sắp xếp đầy đủ tất cả các từ.'); return; }
      input = { tokenIds: reorderTokens };
    }
    void execute({ kind: 'response', path: `${prefix}/${attempt.id}/responses`,
      body: { operationKey: crypto.randomUUID(), lessonExerciseId: ex.id, input } });
  };

  const handleFinalizeAttempt = () => {
    if (!attempt || blocked) return;
    void execute({ kind: 'finalize', path: `${prefix}/${attempt.id}/finalize`, body: { operationKey: crypto.randomUUID() } });
  };

  // Keyboard: 1-9 pick an option, Enter submits (unless focus is on a button/link).
  const kb = useRef({ active: false, type: '', optionIds: [] as string[], inputBlocked: false, blocked: false, hasNext: false });
  kb.current = {
    active: sessionActive && !confirmExit,
    type: attempt?.nextExercise?.type ?? '',
    optionIds: shuffledOptions.map((o) => o.id),
    inputBlocked,
    blocked,
    hasNext: !!attempt?.nextExercise,
  };
  const submitRef = useRef<() => void>(() => {});
  submitRef.current = () => (kb.current.hasNext ? handleSubmitResponse() : handleFinalizeAttempt());
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = kb.current;
      if (!k.active || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (/^[1-9]$/.test(e.key) && (k.type === 'MCQ' || k.type === 'LISTENING') && !k.inputBlocked && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        const id = k.optionIds[Number(e.key) - 1];
        if (id) setSelectedOptionId(id);
      } else if (e.key === 'Enter' && !k.blocked && tag !== 'BUTTON' && tag !== 'A') {
        e.preventDefault();
        submitRef.current();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const alertNode = (actionError || isStale) ? (
    <div
      id="practiceActionAlert"
      className={`alert-box ${isStale ? 'is-warning' : 'is-danger'}`}
      role="alert"
      style={{ marginBottom: '20px' }}
    >
      <p className="alert-message">{actionError || "Nội dung đã được cập nhật. Vui lòng tải lại."}</p>
      {accessError === 401 && <a href="/login" className="btn btn-primary">Đăng nhập lại</a>}
      {(isStale || accessError === 403 || uncertain) && (
        <button
          type="button"
          id="reloadPracticeBtn"
          className="btn btn-primary"
          style={{ marginTop: '8px' }}
          onClick={() => (accessError != null ? window.location.reload() : router.refresh())}
        >
          Tải lại trang
        </button>
      )}
    </div>
  ) : null;

  if (!coreExercises.length) return <section><h2>Luyện tập</h2><p>Bài học chưa có bài tập cốt lõi để luyện tập.</p></section>;

  return (
    <section
      id="practiceSection"
      className="lesson-section"
      style={{
        marginTop: '36px',
        padding: '24px 20px',
        backgroundColor: 'var(--surface-bg)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: 'var(--font-size-heading)', fontWeight: 700, marginBottom: '4px' }}>
            Luyện tập bài học
          </h2>
          <p style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-muted)' }}>
            {coreExercises.length} bài tập cốt lõi &bull; Mỗi câu sai được làm lại một lần
          </p>
        </div>

        {attempt?.isCompleted && (
          <span id="practiceStatusBadge" className="badge badge-active">
            Đã hoàn thành
          </span>
        )}
        {attempt && !attempt.isCompleted && (
          <span id="practiceStatusBadge" className="badge badge-paused">
            Đang làm bài
          </span>
        )}
      </div>

      {/* Stale / Action Alert (inline only while the full-screen session is closed) */}
      {!sessionActive && alertNode}

      {/* State 1: No attempt started yet */}
      {!attempt && (
        <div id="unstartedPracticeBox" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
            Bắt đầu luyện tập để củng cố kiến thức và hoàn thành bài học.
          </p>
          <button
            type="button"
            id="startPracticeBtn"
            className="btn btn-primary"
            onClick={handleStartAttempt}
            disabled={blocked}
          >
            {isActionPending ? 'Đang khởi tạo...' : 'Bắt đầu luyện tập'}
          </button>
        </div>
      )}

      {/* Paused session: attempt in progress but the full-screen session was closed */}
      {attempt && !attempt.isCompleted && !sessionOpen && (
        <div id="resumePracticeBox" className="practice-resume-bar">
          <p style={{ margin: 0, fontWeight: 600 }}>
            Bạn đang làm dở bài luyện tập ({answered}/{totalSteps} câu).
          </p>
          <button type="button" id="resumePracticeBtn" className="btn btn-primary" onClick={() => setSessionOpen(true)}>
            Tiếp tục luyện tập
          </button>
        </div>
      )}

      {/* State 2: Active Attempt in Progress — full-screen session */}
      {sessionActive && attempt && (
        <div className="practice-session" role="dialog" aria-modal="true" aria-label="Phiên luyện tập">
          <div className="practice-session__header">
            <button
              type="button"
              id="exitPracticeBtn"
              className="practice-session__close"
              aria-label="Thoát luyện tập"
              onClick={() => setConfirmExit(true)}
            >
              ✕
            </button>
            <div
              className="practice-progress"
              role="progressbar"
              aria-label="Tiến độ luyện tập"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPct}
            >
              <div className="practice-progress__fill" style={{ width: `${progressPct}%` }} />
            </div>
            {combo >= 3 && (
              <span key={combo} id="comboChip" className="practice-combo" aria-label={`Chuỗi ${combo} câu đúng liên tiếp`}>
                🔥 x{combo}
              </span>
            )}
          </div>

          <div id="activePracticeBox" className="practice-session__body">
            {(actionError || isStale) && alertNode}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span id="queueProgressLabel" style={{ fontWeight: 700 }}>
                {attempt.nextExercise ? (
                  <>
                    Câu hỏi {attempt.queuePosition}
                    {attempt.nextOrdinal === 2 ? ' (Làm lại câu sai)' : ''}
                  </>
                ) : (
                  'Đã trả lời tất cả các câu hỏi'
                )}
              </span>
              <span style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-muted)' }}>
                Đã trả lời: {attempt.responses.length}
              </span>
            </div>

            {attempt.nextExercise && (
              <div
                id="activeExerciseCard"
                className="exercise-card"
                data-exercise-id={attempt.nextExercise.id}
                data-exercise-type={attempt.nextExercise.type}
              >
                <div className="practice-type-label">Bài tập: {attempt.nextExercise.type}</div>
                <p className="practice-question">{prompt?.prompt}</p>

                {(attempt.nextExercise.type === 'MCQ' || attempt.nextExercise.type === 'LISTENING') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {attempt.nextExercise.type === 'LISTENING' && prompt?.audioUrl && (
                      <div>
                        <audio
                          controls
                          aria-label="Âm thanh bài luyện nghe"
                          src={prompt?.audioUrl}
                          onError={() =>
                            setAudioErrors((prev) => ({ ...prev, [attempt.nextExercise!.id]: true }))
                          }
                          style={{ width: '100%', maxWidth: '400px' }}
                        />
                        {audioErrors[attempt.nextExercise.id] && (
                          <div
                            className="audio-error-box"
                            role="alert"
                            style={{ marginTop: '6px', fontSize: 'var(--font-size-sub)', color: 'var(--danger-red)' }}
                          >
                            Không thể tải âm thanh. Vui lòng kiểm tra lại.
                          </div>
                        )}
                      </div>
                    )}
                    {shuffledOptions.map((opt, index) => (
                      <label
                        key={opt.id}
                        className="practice-option"
                        data-selected={selectedOptionId === opt.id}
                        htmlFor={`practice-${attempt.id}-${attempt.nextExercise?.id}-${opt.id}`}
                      >
                        <span className="practice-option__key" aria-hidden="true">{index + 1}</span>
                        <input
                          type="radio"
                          id={`practice-${attempt.id}-${attempt.nextExercise?.id}-${opt.id}`}
                          name={attempt.nextExercise?.type === 'LISTENING' ? 'listening-option' : 'mcq-option'}
                          value={opt.id}
                          checked={selectedOptionId === opt.id}
                          onChange={() => setSelectedOptionId(opt.id)}
                          disabled={inputBlocked}
                        />
                        <span>{opt.text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {attempt.nextExercise.type === 'FILL_BLANK' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="practice-question" style={{ margin: 0 }}>
                      {(prompt?.sentence || '').replace('____', '[ ____________ ]')}
                    </div>
                    <div>
                      <label htmlFor="fillBlankInput" style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--font-size-sub)', fontWeight: 700 }}>
                        Nhập từ cần điền:
                      </label>
                      <input
                        type="text"
                        id="fillBlankInput"
                        className="practice-text-input"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Nhập từ chính xác..."
                        disabled={inputBlocked}
                        maxLength={4000}
                        autoFocus
                        autoComplete="off"
                        autoCapitalize="off"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                )}

                {attempt.nextExercise.type === 'GRAMMAR' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '14px 16px', background: '#fff', border: '2px solid #e5e9f1', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>
                        <span style={{ fontWeight: 700 }}>Câu gốc: </span>
                        <span>{prompt?.sourceSentence}</span>
                      </div>
                      <div>
                        <span style={{ fontWeight: 700 }}>Cấu trúc: </span>
                        <span>{prompt?.targetPattern}</span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="grammarInput" style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--font-size-sub)', fontWeight: 700 }}>
                        Nhập câu trả lời:
                      </label>
                      <input
                        type="text"
                        id="grammarInput"
                        className="practice-text-input"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Nhập câu trả lời..."
                        disabled={inputBlocked}
                        maxLength={4000}
                        autoFocus
                        autoComplete="off"
                        autoCapitalize="off"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                )}

                {attempt.nextExercise.type === 'REORDER' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="practice-answer-line">
                      {reorderTokens.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sub)' }}>
                          Nhấp vào các từ bên dưới theo thứ tự đúng để sắp xếp câu.
                        </span>
                      ) : (
                        reorderTokens.map((tokenId, idx) => {
                          const tokenObj = (prompt?.tokens || []).find((t) => t.id === tokenId);
                          return (
                            <button
                              type="button"
                              key={tokenId}
                              id={`selectedToken-${idx}`}
                              className="practice-chip practice-chip--placed"
                              onClick={() => setReorderTokens(reorderTokens.filter((id) => id !== tokenId))}
                              disabled={inputBlocked}
                            >
                              {tokenObj?.text || tokenId} ✕
                            </button>
                          );
                        })
                      )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                      {shuffledTokens.map((t) => {
                        const isSelected = reorderTokens.includes(t.id);
                        return (
                          <button
                            type="button"
                            key={t.id}
                            id={`tokenBtn-${t.id}`}
                            className={`practice-chip${isSelected ? ' practice-chip--ghost' : ''}`}
                            onClick={() => {
                              if (!isSelected) setReorderTokens([...reorderTokens, t.id]);
                            }}
                            disabled={isSelected || inputBlocked}
                          >
                            {t.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!attempt.nextExercise && (
              <div
                id="finalizePromptBox"
                style={{ textAlign: 'center', padding: '32px 16px' }}
              >
                <p style={{ fontSize: '22px', fontWeight: 800 }}>
                  Bạn đã trả lời tất cả các câu hỏi trong phiên luyện tập.
                </p>
              </div>
            )}
          </div>

          <div className="practice-session__footer">
            <div className="practice-session__footer-inner">
              {confirmExit && (
                <div className="practice-sheet is-warning" role="alertdialog" aria-label="Xác nhận thoát">
                  <span className="practice-sheet__msg">Thoát luyện tập? Tiến độ vẫn được lưu, bạn có thể tiếp tục sau.</span>
                  <button type="button" id="confirmExitBtn" className="practice-sheet__close" onClick={() => { setConfirmExit(false); setSessionOpen(false); }}>
                    Thoát
                  </button>
                  <button type="button" id="cancelExitBtn" className="practice-sheet__close" onClick={() => setConfirmExit(false)}>
                    Ở lại
                  </button>
                </div>
              )}
              {lastFeedback && dismissedSeq !== feedbackSeq && (
                <div
                  id="formativeFeedback"
                  className={`alert-box practice-sheet ${lastFeedback.isCorrect ? 'is-success' : 'is-warning'}`}
                  role="alert"
                  style={{ marginTop: 0 }}
                >
                  <span className="practice-sheet__icon" aria-hidden="true">{lastFeedback.isCorrect ? '✓' : '✗'}</span>
                  <span className="practice-sheet__msg">{lastFeedback.message}</span>
                  <button type="button" className="practice-sheet__close" onClick={() => setDismissedSeq(feedbackSeq)}>
                    Ẩn
                  </button>
                </div>
              )}
              {attempt.nextExercise ? (
                <button
                  type="button"
                  id="submitResponseBtn"
                  className="practice-cta"
                  onClick={handleSubmitResponse}
                  disabled={blocked}
                >
                  {isActionPending ? 'Đang kiểm tra...' : 'Gửi câu trả lời'}
                </button>
              ) : (
                <button
                  type="button"
                  id="finalizePracticeBtn"
                  className="practice-cta"
                  onClick={handleFinalizeAttempt}
                  disabled={blocked}
                >
                  {isActionPending ? 'Đang hoàn tất...' : 'Hoàn tất bài luyện tập'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* State 3: Finalized Attempt / Results */}
      {attempt?.isCompleted && (
        <div id="practiceCompletionSummary" className="celebrate" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div className="celebrate__confetti" aria-hidden="true">
            {Array.from({ length: 28 }, (_, i) => (
              <span
                key={i}
                style={{
                  left: `${(i * 37) % 100}%`,
                  background: ['#4f46e5', '#3b82f6', '#f59e0b', '#f97316', '#93c5fd', '#c7d2fe'][i % 6],
                  animationDelay: `${(i % 7) * 90}ms`,
                  animationDuration: `${1400 + (i % 5) * 220}ms`,
                }}
              />
            ))}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <span className="celebrate__badge">
              ✓
            </span>
            <h3 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '6px' }}>
              Hoàn thành bài luyện tập!
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Kết quả làm bài đã được ghi nhận trên hệ thống.
            </p>
          </div>

          {attempt.lessonRevisionId !== revisionId && <p>Bài làm này thuộc nội dung trước. Luyện tập lại sẽ dùng nội dung hiện tại.</p>}
          {finalizeReward && (
            <div
              id="practiceCelebrationBox"
              className="celebrate__card"
              style={{
                maxWidth: '520px',
                margin: '0 auto 24px auto',
                padding: '20px',
                backgroundColor: 'var(--surface-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '8px' }}>
                🎉 Phần thưởng & Thành tích
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px', marginTop: '12px', marginBottom: '16px' }}>
                <div className="celebrate__tile" style={{ animationDelay: '250ms' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>XP nhận được</div>
                  <div id="celebrationTotalXp" style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                    +{finalizeReward.lessonXp + finalizeReward.questXp} XP
                  </div>
                  {finalizeReward.questXp > 0 && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      (+{finalizeReward.lessonXp} bài, +{finalizeReward.questXp} nhiệm vụ)
                    </div>
                  )}
                </div>
                <div className="celebrate__tile" style={{ animationDelay: '390ms' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Chính xác lần 1</div>
                  <div id="celebrationAccuracy" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                    {Math.round(finalizeReward.firstTryAccuracy)}%
                  </div>
                </div>
                <div className="celebrate__tile" style={{ animationDelay: '530ms' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Chuỗi ngày</div>
                  <div id="celebrationStreak" style={{ fontSize: '20px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                    🔥 {finalizeReward.streak} ngày
                  </div>
                </div>
                {finalizeReward.newlyEnrolledCount > 0 && (
                  <div className="celebrate__tile" style={{ animationDelay: '670ms' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Từ nạp SRS</div>
                    <div id="celebrationWordsEnrolled" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-color)', marginTop: '4px' }}>
                      +{finalizeReward.newlyEnrolledCount} từ
                    </div>
                  </div>
                )}
              </div>

              {finalizeReward.earnedAchievements && finalizeReward.earnedAchievements.length > 0 && (
                <div id="celebrationAchievements" className="celebrate__achievement" style={{ marginTop: '16px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: 'var(--radius-sm)', border: '1px solid #2563eb' }}>
                  <div style={{ fontWeight: 700, color: '#1D4ED8', marginBottom: '8px', fontSize: '14px' }}>
                    🏆 Huy hiệu mới mở khóa!
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {finalizeReward.earnedAchievements.map(ach => (
                      <div key={ach.code} className="earned-achievement-badge" style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '6px' }}>
                        <span style={{ fontSize: '22px' }}>🎖️</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px' }}>{ach.title}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ach.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {attempt.score && (
            <div
              id="practiceScoreBox"
              style={{
                display: 'inline-block',
                padding: '16px 24px',
                backgroundColor: 'var(--canvas-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Điểm số đạt được
              </div>
              <div id="practiceCompletionScore" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary-color)' }}>
                {attempt.score.contributionUnits} / {attempt.score.maxUnits} ({attempt.score.percentage}%)
              </div>
            </div>
          )}

          {attempt.reviewEntries && attempt.reviewEntries.length > 0 && (
            <div
              id="practiceFeedbackReview"
              style={{
                marginTop: '24px',
                marginBottom: '20px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <h4 style={{ fontSize: 'var(--font-size-heading)', fontWeight: 600, marginBottom: '8px' }}>
                Chi tiết câu trả lời và giải thích
              </h4>
              {attempt.reviewEntries.map((entry, index) => (
                <div
                  key={entry.lessonExerciseId || index}
                  className="review-entry-card"
                  data-exercise-id={entry.lessonExerciseId}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${entry.isCorrect ? 'var(--primary-color, #2563eb)' : 'var(--danger-red, #ef4444)'}`,
                    backgroundColor: 'var(--canvas-bg)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sub)' }}>
                      Câu {index + 1} ({entry.type})
                    </span>
                    <span
                      className={`badge review-correctness ${entry.isCorrect ? 'badge-active' : 'badge-paused'}`}
                      style={{
                        color: entry.isCorrect ? 'var(--primary-color)' : 'var(--danger-red)',
                        fontWeight: 600,
                      }}
                    >
                      {entry.isCorrect ? 'Đúng' : 'Sai'}
                    </span>
                  </div>

                  <p className="review-prompt" style={{ marginBottom: '10px', fontWeight: 500 }}>
                    {entry.prompt}
                  </p>

                  <div style={{ fontSize: 'var(--font-size-sub)', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Câu trả lời của bạn: </span>
                    <span className="review-user-answer" style={{ fontWeight: 600 }}>
                      {entry.userResponse || '(Chưa có câu trả lời)'}
                    </span>
                  </div>

                  <div style={{ fontSize: 'var(--font-size-sub)', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Đáp án đúng: </span>
                    <span className="review-correct-answer" style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                      {entry.correctAnswer}
                    </span>
                  </div>

                  {entry.explanation && (
                    <div
                      className="review-explanation"
                      style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        backgroundColor: 'var(--surface-bg)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-size-sub)',
                        color: 'var(--text-body)',
                        borderLeft: '3px solid var(--primary-color)',
                      }}
                    >
                      <strong>Giải thích:</strong> {entry.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href={'/home?contextId=' + encodeURIComponent(contextId)}
              id="celebrationHomeBtn"
              className="btn btn-primary practice-cta-link"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '10px 20px',
                fontWeight: 600,
              }}
            >
              Về lộ trình học tập
            </a>
            <button
              type="button"
              id="redoPracticeBtn"
              className="btn btn-secondary"
              onClick={handleStartAttempt}
              disabled={blocked}
            >
              {isActionPending ? 'Đang khởi tạo...' : 'Luyện tập lại'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
