'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LearningContextSummaryDto } from '../../server/context/dto.ts';
import styles from './switcher.module.css';
import { contextLevelCode, getLocalizedText, languageBadgeStyle, languageName, setContextCookie } from './helpers.ts';
import { useDialogFocus } from './useDialogFocus.ts';

export const MAX_ACTIVE_CONTEXTS = 2;

interface LanguageSwitcherProps {
  contexts: LearningContextSummaryDto[];
  selectedContextId: string | null;
  uiLocale?: string;
}

function Badge({ code }: { code: string }) {
  return (
    <span className={styles.badge} style={languageBadgeStyle(code)} aria-hidden="true">
      {code.toUpperCase()}
    </span>
  );
}

export function LanguageSwitcher({ contexts, selectedContextId, uiLocale = 'vi' }: LanguageSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);
  useDialogFocus(open, panelRef, close);

  const selected = contexts.find((c) => c.id === selectedContextId) ?? null;
  const activeCount = contexts.filter((c) => c.status === 'ACTIVE').length;
  const canAdd = activeCount < MAX_ACTIVE_CONTEXTS;
  const chipCode = selected?.targetLanguage.code ?? contexts[0]?.targetLanguage.code ?? '';
  const chipLevel = selected ? contextLevelCode(selected) : null;

  if (contexts.length === 0) return null;

  const choose = (ctx: LearningContextSummaryDto) => {
    setContextCookie(ctx.id);
    setOpen(false);
    router.push('/home?contextId=' + encodeURIComponent(ctx.id));
  };

  useEffect(() => {
    // Coming back from the lesson screen (finalize with levelUp bumps the context rowVersion):
    // a page restored from the back/forward cache must not act on stale row versions.
    const onShow = (event: PageTransitionEvent) => {
      if (event.persisted) router.refresh();
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, [router]);

  const resume = async (ctx: LearningContextSummaryDto) => {
    if (pendingId) return;
    setPendingId(ctx.id);
    setError(null);
    try {
      const response = await fetch(`/api/learner/contexts/${ctx.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE', expectedRowVersion: ctx.rowVersion }),
      });
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (!response.ok) {
        const json = await response.json().catch(() => null);
        // A lesson that levelled the path up bumps rowVersion server-side; reload so the next try is fresh.
        if (response.status === 409) router.refresh();
        setError(json?.error?.message || 'Không thể tiếp tục lộ trình học.');
        return;
      }
      choose(ctx);
    } catch {
      setError('Lỗi kết nối mạng khi tiếp tục. Vui lòng thử lại.');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className={styles.root}>
      <button
        type="button"
        id="languageSwitcherBtn"
        className={styles.chip}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Đổi lộ trình, đang học ${selected ? languageName(selected, uiLocale) : ''}${chipLevel ? ' ' + chipLevel : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Badge code={chipCode} />
        <span className={styles.chipText}>
          {chipCode.toUpperCase()}
          {chipLevel ? ` · ${chipLevel}` : ''}
        </span>
        <span className={styles.caret} aria-hidden="true">▾</span>
      </button>

      {open && (
        <>
          <div className={styles.backdrop} aria-hidden="true" />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="languageSwitcherTitle"
            tabIndex={-1}
            id="languageSwitcherPanel"
            className={styles.panel}
          >
            <h2 id="languageSwitcherTitle" className={styles.panelTitle}>Lộ trình của bạn</h2>
            <ul className={styles.list}>
              {contexts.map((ctx) => {
                const isCurrent = ctx.id === selectedContextId;
                const isPaused = ctx.status !== 'ACTIVE';
                const level = contextLevelCode(ctx);
                const levelLabel = ctx.workingLevel ? getLocalizedText(ctx.workingLevel.label, uiLocale) : 'Chưa chọn trình độ';
                const rp = ctx.requiredProgress;
                const progress = rp ? { done: rp.requiredDone, total: rp.requiredTotal } : null;
                const percent = progress && progress.total > 0 ? Math.round((progress.done * 100) / progress.total) : 0;
                const inner = (
                  <>
                    <Badge code={ctx.targetLanguage.code} />
                    <span style={{ minWidth: 0 }}>
                     <span>{languageName(ctx, uiLocale)}</span>
                      <span className={styles.itemMeta}>
                        {level ? `${level} · ` : ''}
                        {levelLabel}
                      </span>
                      {progress && progress.total > 0 && (
                        <span className={styles.bar} role="progressbar" aria-label="Tiến độ trình độ hiện tại" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}>
                          <span className={styles.barFill} style={{ width: `${percent}%`, display: 'block' }} />
                        </span>
                      )}
                    </span>
                  </>
                );
                return (
                  <li key={ctx.id} className={`${styles.item}${isCurrent ? ` ${styles.itemCurrent}` : ''}`} data-context-id={ctx.id}>
                    {isPaused ? (
                      <span className={styles.itemLink}>{inner}</span>
                    ) : (
                      <a
                        href={'/home?contextId=' + encodeURIComponent(ctx.id)}
                        className={styles.itemLink}
                        aria-current={isCurrent ? 'true' : undefined}
                        onClick={(event) => {
                          event.preventDefault();
                          choose(ctx);
                        }}
                      >
                        {inner}
                      </a>
                    )}
                    {isPaused && (
                      <>
                        <span className={styles.paused}>Tạm dừng</span>
                        <button
                          type="button"
                          className={styles.resume}
                          onClick={() => resume(ctx)}
                          disabled={!!pendingId || !canAdd}
                          aria-describedby={!canAdd ? 'languageSwitcherLimit' : undefined}
                        >
                          {pendingId === ctx.id ? 'Đang tiếp tục...' : 'Tiếp tục'}
                        </button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
            {error && (
              <p role="alert" className={styles.error}>{error}</p>
            )}
            {canAdd ? (
              <a href="/onboarding" id="addOnboardingLanguageBtn" className={styles.add}>
                + Thêm ngôn ngữ
              </a>
            ) : (
              <>
                <button
                  type="button"
                  id="addOnboardingLanguageBtn"
                  className={styles.add}
                  aria-disabled="true"
                  aria-describedby="languageSwitcherLimit"
                  title="Bạn đang học tối đa hai ngôn ngữ"
                  onClick={(event) => event.preventDefault()}
                >
                  + Thêm ngôn ngữ
                </button>
                <p id="languageSwitcherLimit" className={styles.hint}>
                  Bạn đang học tối đa hai ngôn ngữ. Tạm dừng một lộ trình để thêm ngôn ngữ mới.
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
