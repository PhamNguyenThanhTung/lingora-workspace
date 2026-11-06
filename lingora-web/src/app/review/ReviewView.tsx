'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { SrsPromptCardDto } from '../../server/srs/dto.ts';

interface ReviewViewProps {
  learner?: {
    id: string;
    email?: string;
  };
  authError?: string;
}

type ReviewState = 'initial' | 'prompt' | 'done';

interface PendingOperation {
  token: string;
  operationKey: string;
  rating: 'REMEMBERED' | 'FORGOTTEN';
}

export function ReviewView({ learner, authError }: ReviewViewProps) {
  const [state, setState] = useState<ReviewState>('initial');
  const [card, setCard] = useState<SrsPromptCardDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [pendingOp, setPendingOp] = useState<PendingOperation | null>(null);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(authError || null);

  // Double submit guard & retry idempotency
  const busyRef = useRef(false);
  const pendingOpRef = useRef<PendingOperation | null>(null);

  // Clear pending operation on mount/unmount
  useEffect(() => {
    return () => {
      busyRef.current = false;
      pendingOpRef.current = null;
    };
  }, []);

  async function handleStartReview() {
    if (busyRef.current) return;
    busyRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);
    setIsSessionExpired(false);
    setPendingOp(null);
    pendingOpRef.current = null;
    setSessionCount(0);

    try {
      const response = await fetch('/api/learner/review/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setAuthErrorMessage(result.error?.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          return;
        }
        setErrorMessage(result.error?.message || 'Không thể bắt đầu phiên ôn tập. Vui lòng thử lại.');
        return;
      }

      if (result.data?.done || !result.data?.card) {
        setState('done');
        setCard(null);
        setToken(null);
      } else {
        setState('prompt');
        setCard(result.data.card);
        setToken(result.data.token);
        setIsRevealed(false);
      }
    } catch {
      setErrorMessage('Lỗi kết nối khi khởi tạo phiên ôn tập. Vui lòng thử lại.');
    } finally {
      busyRef.current = false;
      setIsSubmitting(false);
    }
  }

  async function submitRating(op: PendingOperation) {
    if (busyRef.current) return;
    busyRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);
    setPendingOp(op);
    pendingOpRef.current = op;

    try {
      const response = await fetch('/api/learner/review/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify(op),
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setAuthErrorMessage(result.error?.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          setPendingOp(null);
          pendingOpRef.current = null;
          return;
        }
        if (
          (response.status === 409 && (result.error?.code === 'SESSION_EXPIRED' || result.error?.code === 'STALE_OPERATION')) ||
          (response.status === 400 && (result.error?.code === 'INVALID_TOKEN' || result.error?.code === 'CARD_NOT_DUE'))
        ) {
          setIsSessionExpired(true);
          setPendingOp(null);
          pendingOpRef.current = null;
        }
        setErrorMessage(result.error?.message || 'Không thể ghi nhận đánh giá. Vui lòng thử lại.');
        return;
      }

      // Success: clear pending operation
      setPendingOp(null);
      pendingOpRef.current = null;
      setSessionCount((prev) => prev + 1);

      if (result.data?.done || !result.data?.card) {
        setState('done');
        setCard(null);
        setToken(null);
      } else {
        setState('prompt');
        setCard(result.data.card);
        setToken(result.data.token);
        setIsRevealed(false);
      }
    } catch {
      setErrorMessage('Lỗi kết nối mạng khi gửi đánh giá. Vui lòng nhấn "Thử lại gửi kết quả".');
    } finally {
      busyRef.current = false;
      setIsSubmitting(false);
    }
  }

  function handleRate(rating: 'REMEMBERED' | 'FORGOTTEN') {
    if (!token || isSubmitting || pendingOp !== null || isSessionExpired) return;
    const op: PendingOperation = {
      token,
      operationKey: crypto.randomUUID(),
      rating,
    };
    void submitRating(op);
  }

  function handleRetry() {
    if (pendingOpRef.current) {
      void submitRating(pendingOpRef.current);
    } else {
      void handleStartReview();
    }
  }

  function handleRestart() {
    setState('initial');
    setCard(null);
    setToken(null);
    setIsRevealed(false);
    setErrorMessage(null);
    setIsSessionExpired(false);
    setPendingOp(null);
    pendingOpRef.current = null;
    setSessionCount(0);
    void handleStartReview();
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--canvas-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
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
              color: 'var(--primary-green)',
              fontWeight: 700,
              fontSize: '20px',
              whiteSpace: 'nowrap',
            }}
          >
            Lingora
          </a>
          <span className="badge badge-active" style={{ whiteSpace: 'nowrap' }}>Ôn từ vựng</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href="/home"
            id="navHomeBtn"
            className="btn btn-outline"
            style={{ textDecoration: 'none', fontSize: '14px', padding: '6px 14px', whiteSpace: 'nowrap', flexShrink: 0 }}
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
            ) : (
              <button
                type="button"
                id="retryReviewBtn"
                className="btn btn-primary"
                onClick={handleRetry}
                disabled={isSubmitting}
                style={{ marginTop: '10px' }}
              >
                {isSubmitting ? 'Đang thử lại...' : (pendingOp ? 'Thử lại gửi kết quả' : 'Thử lại')}
              </button>
            )}
          </div>
        )}

        {/* State 1: Initial */}
        {state === 'initial' && !authErrorMessage && !authError && (
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

        {/* State 2: Active Prompt Card */}
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
              <span id="sessionCounter">Đã ôn: {sessionCount} từ</span>
              <span>Phiên học đang diễn ra</span>
            </div>

            {/* Prompt Word */}
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
                {card.canonicalForm}
              </div>

              {card.phonetic && (
                <div
                  className="srs-phonetic"
                  style={{
                    fontSize: '18px',
                    color: 'var(--text-muted)',
                    fontFamily: 'monospace',
                    marginBottom: '6px',
                  }}
                >
                  /{card.phonetic}/
                </div>
              )}

              {card.partOfSpeech && (
                <span
                  className="srs-part-of-speech badge badge-active"
                  style={{ fontSize: '13px' }}
                >
                  {card.partOfSpeech}
                </span>
              )}

              {card.example && (
                <div
                  className="srs-example"
                  style={{
                    marginTop: '16px',
                    fontStyle: 'italic',
                    color: 'var(--text-muted)',
                    fontSize: '15px',
                  }}
                >
                  &ldquo;{card.example}&rdquo;
                </div>
              )}
            </div>

            {/* Reveal Answer Section */}
            {!isRevealed ? (
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <button
                  type="button"
                  id="revealAnswerBtn"
                  className="btn btn-outline"
                  onClick={() => setIsRevealed(true)}
                  disabled={isSubmitting || !!pendingOp || isSessionExpired}
                  style={{ width: '100%', padding: '12px', fontWeight: 600 }}
                >
                  Xem nghĩa
                </button>
              </div>
            ) : (
              <div
                id="srsAnswerSection"
                style={{
                  backgroundColor: 'var(--canvas-bg)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm, 6px)',
                  padding: '20px',
                  marginTop: '10px',
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Ý NGHĨA
                  </div>
                  <div className="srs-meaning" style={{ fontSize: '18px', fontWeight: 600 }}>
                    {card.meaningLabels.vi || Object.values(card.meaningLabels)[0] || '(Không có nghĩa)'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                  <button
                    type="button"
                    id="rateForgottenBtn"
                    className="btn btn-secondary"
                    onClick={() => handleRate('FORGOTTEN')}
                    disabled={isSubmitting || !!pendingOp || isSessionExpired}
                    style={{
                      padding: '12px',
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
                    className="btn btn-primary"
                    onClick={() => handleRate('REMEMBERED')}
                    disabled={isSubmitting || !!pendingOp || isSessionExpired}
                    style={{ padding: '12px', fontWeight: 600 }}
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
                backgroundColor: 'var(--primary-subtle, #ecfdf5)',
                color: 'var(--primary-green, #10b981)',
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
              {sessionCount > 0
                ? `Bạn đã hoàn tất ôn tập ${sessionCount} từ vựng trong phiên này. Không còn từ nào cần ôn tập lúc này.`
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
