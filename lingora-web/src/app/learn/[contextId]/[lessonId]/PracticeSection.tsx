'use client';

import React, { useRef, useState } from 'react';
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
  const busy = useRef(false);
  // A lost response may follow commit. Keep its identity/payload until resolved.
  const pending = useRef<Command | null>(null);
  const blocked = isActionPending || isStale || accessError != null;
  const inputBlocked = blocked || uncertain;
  const prefix = `/api/learner/contexts/${contextId}/lessons/${lessonId}/attempts`;
  const coreExercises = exercises.filter(ex => ex.isCore);
  const prompt = attempt?.nextExercise?.promptData as PracticePrompt | undefined;

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
      } else setLastFeedback(null);
      if (command.kind === 'finalize' && !dto.isCompleted) throw new Error('Chưa ghi nhận kết quả hoàn thành. Vui lòng thử lại.');
      pending.current = null;
      setUncertain(false);
      setAttempt(dto);
      setSelectedOptionId(''); setTextInput(''); setReorderTokens([]);
      if (dto.isStale && !dto.isCompleted) {
        setIsStale(true);
        setActionError('Nội dung đã được cập nhật. Tải lại để bắt đầu bài làm theo nội dung mới.');
      }
      if (command.kind === 'finalize') router.refresh();
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

      {/* Stale / Action Alert */}
      {(actionError || isStale) && (
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
      )}

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

      {/* State 2: Active Attempt in Progress */}
      {attempt && !attempt.isCompleted && (
        <div id="activePracticeBox">
          {/* Progress Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <span id="queueProgressLabel" style={{ fontWeight: 600 }}>
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

          {/* Formative Feedback from previous response */}
          {lastFeedback && (
            <div
              id="formativeFeedback"
              className={`alert-box ${lastFeedback.isCorrect ? 'is-success' : 'is-warning'}`}
              role="alert"
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontWeight: 700 }}>
                {lastFeedback.isCorrect ? '✓' : '✗'}
              </span>
              <span>{lastFeedback.message}</span>
            </div>
          )}

          {/* Active Question Input */}
          {attempt.nextExercise && (
            <div
              id="activeExerciseCard"
              className="exercise-card"
              data-exercise-id={attempt.nextExercise.id}
              data-exercise-type={attempt.nextExercise.type}
              style={{
                padding: '18px 20px',
                backgroundColor: 'var(--canvas-bg)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '20px',
              }}
            >
              <div style={{ marginBottom: '12px', fontWeight: 600 }}>
                Bài tập: {attempt.nextExercise.type}
              </div>

              <p style={{ marginBottom: '16px', fontSize: 'var(--font-size-body)' }}>
                {prompt?.prompt}
              </p>

              {/* MCQ */}
              {attempt.nextExercise.type === 'MCQ' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(prompt?.options || []).map((opt) => (
                    <label
                      key={opt.id}
                      htmlFor={`practice-${attempt.id}-${attempt.nextExercise?.id}-${opt.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 14px',
                        border: selectedOptionId === opt.id ? '2px solid var(--primary-green)' : '1px solid var(--border-control)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--surface-bg)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        id={`practice-${attempt.id}-${attempt.nextExercise?.id}-${opt.id}`}
                        name="mcq-option"
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

              {/* LISTENING */}
              {attempt.nextExercise.type === 'LISTENING' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {prompt?.audioUrl && (
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
                          style={{
                            marginTop: '6px',
                            fontSize: 'var(--font-size-sub)',
                            color: 'var(--danger-red)',
                          }}
                        >
                          Không thể tải âm thanh. Vui lòng kiểm tra lại.
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(prompt?.options || []).map((opt) => (
                      <label
                        key={opt.id}
                        htmlFor={`practice-${attempt.id}-${attempt.nextExercise?.id}-${opt.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 14px',
                          border: selectedOptionId === opt.id ? '2px solid var(--primary-green)' : '1px solid var(--border-control)',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--surface-bg)',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          id={`practice-${attempt.id}-${attempt.nextExercise?.id}-${opt.id}`}
                          name="listening-option"
                          value={opt.id}
                          checked={selectedOptionId === opt.id}
                          onChange={() => setSelectedOptionId(opt.id)}
                          disabled={inputBlocked}
                        />
                        <span>{opt.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* FILL_BLANK */}
              {attempt.nextExercise.type === 'FILL_BLANK' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div
                    style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--surface-bg)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 'var(--font-size-body)',
                    }}
                  >
                    {(prompt?.sentence || '').replace(
                      '____',
                      '[ ____________ ]'
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="fillBlankInput"
                      style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--font-size-sub)', fontWeight: 600 }}
                    >
                      Nhập từ cần điền:
                    </label>
                    <input
                      type="text"
                      id="fillBlankInput"
                      className="input-control"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Nhập từ chính xác..."
                      disabled={inputBlocked}
                      maxLength={4000}
                      style={{ width: '100%', maxWidth: '400px' }}
                    />
                  </div>
                </div>
              )}

              {/* GRAMMAR */}
              {attempt.nextExercise.type === 'GRAMMAR' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div
                    style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--surface-bg)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>Câu gốc: </span>
                      <span>{prompt?.sourceSentence}</span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 600 }}>Cấu trúc: </span>
                      <span>{prompt?.targetPattern}</span>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="grammarInput"
                      style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--font-size-sub)', fontWeight: 600 }}
                    >
                      Nhập câu trả lời:
                    </label>
                    <input
                      type="text"
                      id="grammarInput"
                      className="input-control"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Nhập câu trả lời..."
                      disabled={inputBlocked}
                      maxLength={4000}
                      style={{ width: '100%', maxWidth: '400px' }}
                    />
                  </div>
                </div>
              )}

              {/* REORDER */}
              {attempt.nextExercise.type === 'REORDER' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Slots for ordered tokens */}
                  <div
                    style={{
                      minHeight: '48px',
                      padding: '10px 14px',
                      backgroundColor: 'var(--surface-bg)',
                      border: '2px dashed var(--border-control)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      alignItems: 'center',
                    }}
                  >
                    {reorderTokens.length === 0 ? (
                      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sub)' }}>
                        Nhấp vào các từ bên dưới theo thứ tự đúng để sắp xếp câu.
                      </span>
                    ) : (
                      reorderTokens.map((tokenId, idx) => {
                        const tokenObj = (prompt?.tokens || []).find(
                          (t) => t.id === tokenId
                        );
                        return (
                          <button
                            type="button"
                            key={tokenId}
                            id={`selectedToken-${idx}`}
                            className="btn btn-secondary"
                            onClick={() => {
                              setReorderTokens(reorderTokens.filter((id) => id !== tokenId));
                            }}
                            disabled={inputBlocked}
                            style={{ padding: '6px 12px' }}
                          >
                            {tokenObj?.text || tokenId} ✕
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Available Tokens to click */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(prompt?.tokens || []).map((t) => {
                      const isSelected = reorderTokens.includes(t.id);
                      return (
                        <button
                          type="button"
                          key={t.id}
                          id={`tokenBtn-${t.id}`}
                          className="btn btn-outline"
                          onClick={() => {
                            if (!isSelected) {
                              setReorderTokens([...reorderTokens, t.id]);
                            }
                          }}
                          disabled={isSelected || inputBlocked}
                          style={{
                            opacity: isSelected ? 0.4 : 1,
                            cursor: isSelected ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {t.text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Submit Response Button */}
              <div style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  id="submitResponseBtn"
                  className="btn btn-primary"
                  onClick={handleSubmitResponse}
                  disabled={blocked}
                >
                  {isActionPending ? 'Đang kiểm tra...' : 'Gửi câu trả lời'}
                </button>
              </div>
            </div>
          )}

          {/* If all questions answered, show Finalize button */}
          {!attempt.nextExercise && (
            <div
              id="finalizePromptBox"
              style={{
                textAlign: 'center',
                padding: '24px 16px',
                backgroundColor: 'var(--canvas-bg)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <p style={{ marginBottom: '16px', fontWeight: 600 }}>
                Bạn đã trả lời tất cả các câu hỏi trong phiên luyện tập.
              </p>
              <button
                type="button"
                id="finalizePracticeBtn"
                className="btn btn-primary"
                onClick={handleFinalizeAttempt}
                disabled={blocked}
              >
                {isActionPending ? 'Đang hoàn tất...' : 'Hoàn tất bài luyện tập'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* State 3: Finalized Attempt / Results */}
      {attempt?.isCompleted && (
        <div id="practiceCompletionSummary" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface-badge-green)',
                color: 'var(--primary-green)',
                fontSize: '24px',
                fontWeight: 700,
                marginBottom: '12px',
              }}
            >
              ✓
            </span>
            <h3 style={{ fontSize: 'var(--font-size-title)', fontWeight: 700, marginBottom: '6px' }}>
              Hoàn thành bài luyện tập!
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Kết quả làm bài đã được ghi nhận trên hệ thống.
            </p>
          </div>

          {attempt.lessonRevisionId !== revisionId && <p>Bài làm này thuộc nội dung trước. Luyện tập lại sẽ dùng nội dung hiện tại.</p>}
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
              <div id="practiceCompletionScore" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary-green)' }}>
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
                    border: `1px solid ${entry.isCorrect ? 'var(--primary-green, #10b981)' : 'var(--danger-red, #ef4444)'}`,
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
                        color: entry.isCorrect ? 'var(--primary-green)' : 'var(--danger-red)',
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
                    <span className="review-correct-answer" style={{ fontWeight: 600, color: 'var(--primary-green)' }}>
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
                        borderLeft: '3px solid var(--primary-green)',
                      }}
                    >
                      <strong>Giải thích:</strong> {entry.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div>
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
