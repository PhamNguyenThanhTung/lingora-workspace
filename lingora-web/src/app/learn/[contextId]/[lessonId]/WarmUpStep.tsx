'use client';

import React, { useEffect, useRef, useState } from 'react';
import { formatPhonetic, resolveContentLang } from '@lingora/lesson-content';

/** "Ôn nhanh": at most 3 due SRS cards shown before the lesson exercises start. */
export const WARM_UP_LIMIT = 3;

export interface WarmUpCardDto {
  cardId: string;
  canonicalForm: string;
}

export interface WarmUpSessionDto {
  sessionId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  progress: { currentIndex: number; completedCount: number; total: number };
  currentItem: WarmUpCardDto | null;
}

interface WarmUpRevealedDto {
  cardId: string;
  meaningLabels: Record<string, string>;
  phonetic: string | null;
  partOfSpeech: string | null;
  example: string | null;
}

interface WarmUpStepProps {
  languageCode?: string | null;
  session: WarmUpSessionDto;
  /** Called when the warm-up is finished, skipped, or cannot continue; the lesson then starts. */
  onFinish: () => void;
}

function isMeaningCard(item: unknown): item is WarmUpCardDto {
  return !!item && typeof item === 'object' && !('skill' in (item as Record<string, unknown>));
}

/**
 * Short warm-up on top of the existing SRS session endpoints. It reviews real due cards
 * (reveal + REMEMBERED/FORGOTTEN) and is completely separate from the lesson attempt, so it
 * never changes the lesson score, XP or accuracy. Any failure just continues to the lesson.
 */
export function WarmUpStep({ session, onFinish, languageCode = null }: WarmUpStepProps) {
  const contentLang = resolveContentLang({ languageCode });
  const [current, setCurrent] = useState<WarmUpSessionDto>(session);
  const [revealed, setRevealed] = useState<WarmUpRevealedDto | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const card = isMeaningCard(current.currentItem) ? current.currentItem : null;
  const total = Math.min(current.progress.total, WARM_UP_LIMIT);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  // Defensive: never leave the learner stuck on a warm-up without a reviewable card.
  useEffect(() => {
    if (!card) finishRef.current();
  }, [card]);

  async function post(path: string, body?: Record<string, unknown>): Promise<any | null> {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result?.data ?? null;
  }

  function finishQuietly() {
    void fetch(`/api/srs/sessions/${current.sessionId}/complete`, { method: 'POST' }).catch(() => {});
    onFinish();
  }

  function handleReveal() {
    if (!card || isBusy || revealed) return;
    setIsBusy(true);
    void (async () => {
      try {
        const data = await post(`/api/srs/sessions/${current.sessionId}/reveal`, { cardId: card.cardId });
        if (!data) {
          onFinish();
          return;
        }
        setRevealed(data as WarmUpRevealedDto);
      } catch {
        onFinish();
      } finally {
        setIsBusy(false);
      }
    })();
  }

  function handleRate(rating: 'REMEMBERED' | 'FORGOTTEN') {
    if (!card || isBusy || !revealed) return;
    setIsBusy(true);
    void (async () => {
      try {
        const data = await post(`/api/srs/sessions/${current.sessionId}/reviews`, {
          operationKey: crypto.randomUUID(),
          cardId: card.cardId,
          rating,
        });
        if (!data || data.status !== 'ACTIVE' || !isMeaningCard(data.currentItem)) {
          onFinish();
          return;
        }
        setRevealed(null);
        setCurrent(data as WarmUpSessionDto);
      } catch {
        onFinish();
      } finally {
        setIsBusy(false);
      }
    })();
  }

  if (!card) {
    // Nothing reviewable (e.g. a writing card reached the front of the queue): go to the lesson.
    return null;
  }

  return (
    <div className="practice-session" role="dialog" aria-modal="true" aria-label="Ôn nhanh trước bài học">
      <div className="practice-session__header">
        <span className="badge badge-active">Ôn nhanh</span>
        <span id="warmUpCounter" style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-muted)' }}>
          Từ {Math.min(current.progress.completedCount + 1, total)} / {total}
        </span>
        <button
          type="button"
          id="warmUpSkipBtn"
          className="btn btn-outline"
          onClick={finishQuietly}
          disabled={isBusy}
          style={{ marginLeft: 'auto' }}
        >
          Bỏ qua
        </button>
      </div>

      <div id="warmUpBox" className="practice-session__body">
        <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
          Ôn nhanh {total} từ đã đến hạn trước khi vào bài học. Phần này không tính vào điểm bài học.
        </p>

        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div
            className="srs-canonical-form"
            lang={contentLang}
            style={{ fontSize: '30px', fontWeight: 700, color: 'var(--text-main)' }}
          >
            {card.canonicalForm}
          </div>
        </div>

        {!revealed ? (
          <button
            type="button"
            id="warmUpRevealBtn"
            className="btn btn-outline"
            onClick={handleReveal}
            disabled={isBusy}
            style={{ width: '100%', padding: '12px', fontWeight: 600 }}
          >
            {isBusy ? 'Đang tải...' : 'Lật thẻ (Xem nghĩa)'}
          </button>
        ) : (
          <div
            id="warmUpAnswer"
            style={{
              backgroundColor: 'var(--canvas-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm, 6px)',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Ý NGHĨA</div>
            <div className="srs-meaning" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              {revealed.meaningLabels?.vi ||
                Object.values(revealed.meaningLabels ?? {})[0] ||
                '(Không có nghĩa)'}
            </div>
            {formatPhonetic(revealed.phonetic, languageCode) && (
              <div className="srs-phonetic" lang={contentLang} style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {formatPhonetic(revealed.phonetic, languageCode)}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
              <button
                type="button"
                id="warmUpForgottenBtn"
                className="btn btn-secondary"
                onClick={() => handleRate('FORGOTTEN')}
                disabled={isBusy}
                style={{ minHeight: '44px', fontWeight: 600 }}
              >
                Chưa nhớ
              </button>
              <button
                type="button"
                id="warmUpRememberedBtn"
                className="btn btn-primary"
                onClick={() => handleRate('REMEMBERED')}
                disabled={isBusy}
                style={{ minHeight: '44px', fontWeight: 600 }}
              >
                Đã nhớ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
