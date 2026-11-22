'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { CandidateStrokeInput } from '@lingora/lesson-content';
import type { SrsFrontPromptCardDto, SrsRevealedCardDto } from '../../server/srs/session-service.ts';
import { WritingSrsAttempt } from './WritingSrsAttempt.tsx';

interface ReviewViewProps {
  learner?: {
    id: string;
    email?: string;
  };
  authError?: string;
}

type ReviewState = 'initial' | 'prompt' | 'done';

interface PendingOperation {
  sessionId: string;
  cardId: string;
  operationKey: string;
  rating: 'REMEMBERED' | 'FORGOTTEN' | 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';
}

interface PendingWritingAttempt {
  sessionId: string;
  cardId: string;
  operationKey: string;
  characterNumber: number;
  candidateStrokes: CandidateStrokeInput[];
}

interface SessionProgress {
  currentIndex: number;
  completedCount: number;
  total: number;
}

interface SessionSnapshot {
  sessionId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  progress: SessionProgress;
  currentItem?: SrsFrontPromptCardDto | null;
}

class ReviewRequestError extends Error {}

const SESSION_STORAGE_KEY = 'lingora_srs_session_id';

export function ReviewView({ learner, authError }: ReviewViewProps) {
  const [state, setState] = useState<ReviewState>('initial');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [card, setCard] = useState<SrsFrontPromptCardDto | null>(null);
  const [revealedCard, setRevealedCard] = useState<SrsRevealedCardDto | null>(null);
  const [progress, setProgress] = useState<SessionProgress>({ currentIndex: 0, completedCount: 0, total: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [needsSync, setNeedsSync] = useState(false);
  const [pendingOp, setPendingOp] = useState<PendingOperation | null>(null);
  const [pendingWritingAttempt, setPendingWritingAttempt] = useState<PendingWritingAttempt | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(authError || null);

  const busyRef = useRef(false);
  const retryRef = useRef<(() => void) | null>(null);
  const rateRememberedBtnRef = useRef<HTMLButtonElement | null>(null);
  const answerSectionRef = useRef<HTMLDivElement | null>(null);
  const isWritingCard = Boolean(card && 'skill' in card && card.skill === 'WRITING');
  const writingCard = card && 'skill' in card ? card : null;
  const isRevealed = revealedCard !== null || Boolean(writingCard?.writing.revealedCharacters);
  const cardActionDisabled = isSubmitting || !!pendingOp || !!pendingWritingAttempt || isSessionExpired || needsSync || !!authErrorMessage;

  function expire() {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setIsSessionExpired(true);
    setNeedsSync(false);
    setPendingOp(null);
    setErrorMessage('Phiên ôn tập đã hết hạn. Vui lòng bắt đầu phiên mới.');
  }

  function applySession(data: SessionSnapshot) {
    setPendingOp(null);
    setPendingWritingAttempt(null);
    setNeedsSync(false);
    setRevealedCard(null);
    setProgress(data.progress);
    if (data.status === 'EXPIRED') {
      expire();
    } else if (data.status === 'COMPLETED') {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setState('done');
      setCard(null);
      setSessionId(null);
    } else if (data.currentItem) {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, data.sessionId);
      setSessionId(data.sessionId);
      setCard(data.currentItem);
      setState('prompt');
    }
  }

  async function runAction(action: () => Promise<void>, error: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);
    setCanRetry(true);
    retryRef.current = () => { void runAction(action, error); };
    try {
      await action();
      retryRef.current = null;
      setCanRetry(false);
    } catch (e) {
      setErrorMessage(e instanceof ReviewRequestError ? e.message : error);
    } finally {
      busyRef.current = false;
      setIsSubmitting(false);
    }
  }

  function handleAuthError(status: number, message: string | undefined) {
    if (status !== 401 && status !== 403) return false;
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setPendingOp(null);
    setAuthErrorMessage(message || 'Bạn không thể tiếp tục phiên ôn tập. Vui lòng đăng nhập lại.');
    return true;
  }

  async function refreshSession(id: string) {
    setNeedsSync(true);
    setPendingOp(null);
    setRevealedCard(null);
    retryRef.current = () => { void runAction(() => refreshSession(id), 'Không thể tải lại phiên ôn tập.'); };
    const response = await fetch(`/api/srs/sessions/${id}`);
    const result = await response.json();
    if (!response.ok) {
      if (handleAuthError(response.status, result.error?.message)) return;
      if (response.status === 404) {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
        setNeedsSync(false);
        setState('initial');
        setCard(null);
        setSessionId(null);
        return;
      }
      throw new ReviewRequestError(result.error?.message || 'Không thể tải lại phiên ôn tập.');
    }
    applySession(result.data);
  }

  useEffect(() => {
    if (!learner || authError) return;
    const savedSessionId = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSessionId) {
      void runAction(() => refreshSession(savedSessionId), 'Không thể tải lại phiên ôn tập.');
    }
  }, [learner?.id, authError]);

  function handleStartReview() {
    void runAction(async () => {
      setIsSessionExpired(false);
      const response = await fetch('/api/srs/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 20 }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (handleAuthError(response.status, result.error?.message)) return;
        throw new ReviewRequestError(result.error?.message || 'Không thể bắt đầu phiên ôn tập.');
      }
      applySession(result.data);
    }, 'Lỗi kết nối khi khởi tạo phiên ôn tập. Vui lòng thử lại.');
  }

  async function handleSessionError(response: Response, error: { code?: string; message?: string } | undefined, id: string) {
    if (handleAuthError(response.status, error?.message)) return;
    if (response.status === 400) {
      setPendingWritingAttempt(null);
      setPendingOp(null);
      retryRef.current = null;
      setCanRetry(false);
      setErrorMessage(error?.message || 'Dữ liệu không hợp lệ. Vui lòng thử lại.');
      return;
    }
    if (response.status === 404 || response.status === 409) {
      if (error?.code === 'SESSION_EXPIRED') {
        expire();
        return;
      }
      if (
        response.status === 404 ||
        error?.code === 'STALE_OPERATION' ||
        error?.code === 'SESSION_COMPLETED' ||
        error?.code === 'OPERATION_CONFLICT'
      ) {
        await refreshSession(id);
        return;
      }
    }
    throw new ReviewRequestError(error?.message || 'Không thể cập nhật phiên ôn tập.');
  }

  function handleReveal() {
    if (!sessionId || !card || isWritingCard || cardActionDisabled || isRevealed) return;
    void runAction(async () => {
      const response = await fetch(`/api/srs/sessions/${sessionId}/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.cardId }),
      });
      const result = await response.json();
      if (!response.ok) return handleSessionError(response, result.error, sessionId);
      setRevealedCard(result.data);
    }, 'Lỗi kết nối khi lật thẻ. Vui lòng thử lại.');
  }

  useEffect(() => {
    if (isRevealed && !isSubmitting) {
      (rateRememberedBtnRef.current ?? answerSectionRef.current)?.focus();
    }
  }, [isRevealed, isSubmitting]);

  function handleRate(rating: PendingOperation['rating']) {
    if (!sessionId || !card || cardActionDisabled || !isRevealed || busyRef.current) return;
    if (isWritingCard ? !['AGAIN', 'HARD', 'GOOD', 'EASY'].includes(rating) : !['REMEMBERED', 'FORGOTTEN'].includes(rating)) return;
    const id = sessionId;
    const op = { cardId: card.cardId, operationKey: crypto.randomUUID(), rating };
    setPendingOp({ ...op, sessionId: id });

    void runAction(async () => {
      const response = await fetch(`/api/srs/sessions/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(op),
      });
      const result = await response.json();
      if (!response.ok) return handleSessionError(response, result.error, id);
      if (isWritingCard) await refreshSession(id);
      else applySession(result.data);
    }, 'Lỗi kết nối mạng khi gửi đánh giá. Vui lòng nhấn "Thử lại gửi kết quả".');
  }

  function handleWritingAttempt(candidateStrokes: CandidateStrokeInput[]) {
    if (!sessionId || !writingCard || cardActionDisabled || isRevealed || busyRef.current) return;
    const id = sessionId;
    const op = pendingWritingAttempt ?? {
      sessionId: id,
      cardId: writingCard.cardId,
      operationKey: crypto.randomUUID(),
      characterNumber: writingCard.writing.characterNumber,
      candidateStrokes,
    };
    setPendingWritingAttempt(op);
    void runAction(async () => {
      const response = await fetch(`/api/srs/sessions/${id}/writing-attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: op.cardId,
          operationKey: op.operationKey,
          characterNumber: op.characterNumber,
          candidateStrokes: op.candidateStrokes,
        }),
      });
      const result = await response.json();
      if (!response.ok) return handleSessionError(response, result.error, id);
      await refreshSession(id);
    }, 'Lỗi kết nối mạng khi gửi bài viết. Vui lòng nhấn "Thử lại".');
  }

  function handleComplete() {
    if (!sessionId || cardActionDisabled) return;
    const id = sessionId;
    void runAction(async () => {
      const response = await fetch(`/api/srs/sessions/${id}/complete`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) return handleSessionError(response, result.error, id);
      applySession(result.data);
    }, 'Không thể kết thúc phiên ôn tập. Vui lòng thử lại.');
  }

  function handleRestart() {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setState('initial');
    setSessionId(null);
    setCard(null);
    setRevealedCard(null);
    setPendingOp(null);
    setPendingWritingAttempt(null);
    handleStartReview();
  }

  // S5-04 / Finding 5: Accessible keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Do not intercept input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // When focus is on a button or link, let native Enter or Space activate THAT element!
      const isFocusedOnActionable =
        e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement;

      if (state === 'prompt' && !cardActionDisabled && !isWritingCard) {
        if (!isRevealed) {
          // If not focused on an actionable element, Space or Enter triggers reveal
          if (!isFocusedOnActionable && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            void handleReveal();
          }
        } else {
          // Rating shortcuts:
          // '1' or 'f' / 'F' triggers FORGOTTEN
          // '2' or 'r' / 'R' triggers REMEMBERED
          // Note: Enter does NOT trigger REMEMBERED globally to avoid hijacking focused buttons!
          if (e.key === '1' || e.key === 'f' || e.key === 'F') {
            e.preventDefault();
            handleRate('FORGOTTEN');
          } else if (e.key === '2' || e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            handleRate('REMEMBERED');
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--canvas-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (prefers-reduced-motion: reduce) {
              * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
              }
            }
          `,
        }}
      />

      {/* Header */}
      <header
        className="app-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          backgroundColor: 'var(--surface-bg)',
          borderBottom: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '8px 12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href="/home"
            id="backHomeHeaderBtn"
            style={{
              textDecoration: 'none',
              color: 'var(--primary-color)',
              fontWeight: 700,
              fontSize: '20px',
              whiteSpace: 'nowrap',
            }}
          >
            Lingora
          </a>
          <span className="badge badge-active" style={{ whiteSpace: 'nowrap' }}>
            Ôn từ vựng
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href="/home"
            id="navHomeBtn"
            className="btn btn-outline"
            style={{
              textDecoration: 'none',
              fontSize: '14px',
              padding: '6px 14px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Về trang chủ
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          maxWidth: '560px',
          width: '100%',
          margin: '0 auto',
          padding: '32px 16px',
        }}
      >
        {/* Auth Error */}
        {(authErrorMessage || authError) && (
          <div className="alert-box is-danger" role="alert" style={{ marginBottom: '20px' }}>
            <p>{authErrorMessage || authError}</p>
            <a href="/login" className="btn btn-primary" style={{ marginTop: '12px', display: 'inline-block' }}>
              Đăng nhập lại
            </a>
          </div>
        )}

        {/* Action Error / Network Alert */}
        {errorMessage && (
          <div
            id="srsActionAlert"
            className={`alert-box ${isSessionExpired ? 'is-warning' : 'is-danger'}`}
            role="alert"
            style={{ marginBottom: '20px' }}
          >
            <p className="alert-message">{errorMessage}</p>
            {isSessionExpired ? (
              <button
                type="button"
                id="restartReviewBtn"
                className="btn btn-primary"
                onClick={handleRestart}
                disabled={isSubmitting}
                style={{ marginTop: '10px' }}
              >
                {isSubmitting ? 'Đang khởi động lại...' : 'Bắt đầu phiên ôn tập mới'}
              </button>
            ) : canRetry ? (
              <button
                type="button"
                id="retryReviewBtn"
                className="btn btn-primary"
                onClick={() => retryRef.current?.()}
                disabled={isSubmitting}
                style={{ marginTop: '10px' }}
              >
                {isSubmitting ? 'Đang thử lại...' : pendingOp || pendingWritingAttempt ? 'Thử lại gửi kết quả' : 'Thử lại'}
              </button>
            ) : null}
          </div>
        )}

        {/* State 1: Initial */}
        {state === 'initial' && !authErrorMessage && !authError && !needsSync && !isSessionExpired && (
          <div
            id="srsInitialBox"
            style={{
              backgroundColor: 'var(--surface-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '32px 24px',
              textAlign: 'center',
            }}
          >
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
              Ôn tập từ vựng
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
              Hệ thống sẽ chọn các từ vựng đã đến hạn ôn tập theo phương pháp lặp lại ngắt quãng (SRS) để giúp bạn ghi nhớ bền vững.
            </p>
            <button
              type="button"
              id="startReviewBtn"
              className="btn btn-primary"
              onClick={handleStartReview}
              disabled={isSubmitting}
              style={{ padding: '12px 28px', fontSize: '16px', fontWeight: 600 }}
            >
              {isSubmitting ? 'Đang tải...' : 'Bắt đầu ôn tập'}
            </button>
          </div>
        )}

        {/* State 2: Active Prompt Flashcard */}
        {state === 'prompt' && card && (
          <div
            id="srsReviewCard"
            style={{
              backgroundColor: 'var(--surface-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Session Progress Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '12px',
                fontSize: '14px',
                color: 'var(--text-muted)',
              }}
            >
              <span id="sessionCounter">
                Đã ôn: {progress.completedCount} / {progress.total} từ
              </span>
              <button
                type="button"
                id="completeReviewBtn"
                className="btn btn-outline"
                onClick={handleComplete}
                disabled={cardActionDisabled}
              >
                Kết thúc phiên
              </button>
            </div>

            {/* Prompt Word / Front of Flashcard */}
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                className="srs-canonical-form"
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '8px',
                }}
              >
                {'skill' in card
                  ? card.meaningLabels.vi || Object.values(card.meaningLabels)[0] || '(Không có nghĩa)'
                  : card.canonicalForm}
              </div>
              {writingCard && <span className="badge badge-active">WRITING · viết theo nghĩa</span>}

            </div>

            {/* Reveal Answer / Flip Card Section */}
            {writingCard ? (
              writingCard.writing.revealedCharacters ? (
                <div
                  id="srsAnswerSection"
                  ref={answerSectionRef}
                  tabIndex={-1}
                  style={{ backgroundColor: 'var(--canvas-bg)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm, 6px)', padding: '20px', outline: 'none' }}
                >
                  <h2 style={{ marginTop: 0 }}>Kết quả luyện viết</h2>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {writingCard.writing.revealedCharacters.map((character, index) => (
                      <div key={`${character.glyph}-${index}`} style={{ display: 'flex', gap: '16px', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                        <span lang="ja" style={{ fontSize: '36px', minWidth: '48px', textAlign: 'center' }}>{character.glyph}</span>
                        <div>
                          <strong>Điểm {character.score}/100 · {character.passed ? 'Đạt' : 'Cần luyện thêm'}</strong>
                          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                            Số nét: {character.details.strokeCount.actual}/{character.details.strokeCount.expected} · {character.band}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p style={{ marginBottom: '12px' }}>Tự chọn mức độ nhớ để lên lịch lần ôn tiếp theo.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                    {([
                      ['AGAIN', 'Lại · AGAIN'],
                      ['HARD', 'Khó · HARD'],
                      ['GOOD', 'Tốt · GOOD'],
                      ['EASY', 'Dễ · EASY'],
                    ] as const).map(([rating, label]) => (
                      <button
                        key={rating}
                        type="button"
                        id={`rateWriting${rating}Btn`}
                        ref={rating === 'GOOD' ? rateRememberedBtnRef : undefined}
                        className={rating === 'GOOD' ? 'btn btn-primary' : 'btn btn-outline'}
                        onClick={() => handleRate(rating)}
                        disabled={cardActionDisabled}
                        style={{ minHeight: '48px', fontWeight: 600 }}
                      >
                        {isSubmitting ? 'Đang lưu...' : label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <WritingSrsAttempt
                  key={`${writingCard.cardId}-${writingCard.writing.characterNumber}`}
                  characterNumber={writingCard.writing.characterNumber}
                  characterCount={writingCard.writing.characterCount}
                  strokeCount={writingCard.writing.strokeCount}
                  disabled={cardActionDisabled}
                  isSubmitting={isSubmitting}
                  onSubmit={handleWritingAttempt}
                />
              )
            ) : !revealedCard ? (
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <button
                  type="button"
                  id="revealAnswerBtn"
                  className="btn btn-outline"
                  onClick={handleReveal}
                  disabled={cardActionDisabled}
                  style={{ width: '100%', padding: '12px', fontWeight: 600 }}
                  aria-expanded="false"
                  aria-controls="srsAnswerSection"
                >
                  Lật thẻ (Xem nghĩa)
                </button>
              </div>
            ) : (
              <div
                id="srsAnswerSection"
                ref={answerSectionRef}
                tabIndex={-1}
                style={{
                  backgroundColor: 'var(--canvas-bg)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm, 6px)',
                  padding: '20px',
                  marginTop: '10px',
                  outline: 'none',
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Ý NGHĨA
                  </div>
                  <div className="srs-meaning" style={{ fontSize: '18px', fontWeight: 600 }}>
                    {revealedCard.meaningLabels.vi || Object.values(revealedCard.meaningLabels)[0] || '(Không có nghĩa)'}
                  </div>
                </div>

                {revealedCard.phonetic && (
                  <div
                    className="srs-phonetic"
                    style={{
                      fontSize: '18px',
                      color: 'var(--text-muted)',
                      fontFamily: 'monospace',
                      marginBottom: '6px',
                    }}
                  >
                    /{revealedCard.phonetic}/
                  </div>
                )}

                {revealedCard.partOfSpeech && (
                  <span className="srs-part-of-speech badge badge-active" style={{ fontSize: '13px' }}>
                    {revealedCard.partOfSpeech}
                  </span>
                )}

                {revealedCard.example && (
                  <div
                    className="srs-example"
                    style={{
                      marginTop: '16px',
                      fontStyle: 'italic',
                      color: 'var(--text-muted)',
                      fontSize: '15px',
                    }}
                  >
                    &ldquo;{revealedCard.example}&rdquo;
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                  <button
                    type="button"
                    id="rateForgottenBtn"
                    className="btn btn-secondary"
                    onClick={() => handleRate('FORGOTTEN')}
                    disabled={cardActionDisabled}
                    style={{
                      padding: '12px',
                      minHeight: '44px',
                      fontWeight: 600,
                      color: 'var(--danger-red, #dc2626)',
                      border: '1px solid var(--danger-red, #dc2626)',
                    }}
                  >
                    {isSubmitting ? 'Đang lưu...' : 'Chưa nhớ'}
                  </button>

                  <button
                    type="button"
                    id="rateRememberedBtn"
                    ref={rateRememberedBtnRef}
                    className="btn btn-primary"
                    onClick={() => handleRate('REMEMBERED')}
                    disabled={cardActionDisabled}
                    style={{ padding: '12px', minHeight: '44px', fontWeight: 600 }}
                  >
                    {isSubmitting ? 'Đang lưu...' : 'Đã nhớ'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* State 3: Done / Empty */}
        {state === 'done' && (
          <div
            id="srsDoneBox"
            style={{
              backgroundColor: 'var(--surface-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '36px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-subtle, #eff6ff)',
                color: 'var(--primary-color, #2563eb)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 700,
                marginBottom: '16px',
              }}
            >
              ✓
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
              Hoàn thành ôn tập!
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
              {progress.total > 0
                ? `Bạn đã hoàn tất ôn tập ${progress.completedCount} từ vựng trong phiên này.`
                : 'Hiện tại bạn không có từ vựng nào đến hạn ôn tập.'}
            </p>
            <a
              href="/home"
              id="doneBackHomeBtn"
              className="btn btn-primary"
              style={{
                display: 'inline-block',
                textDecoration: 'none',
                padding: '10px 24px',
                fontWeight: 600,
              }}
            >
              Về trang chủ
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
