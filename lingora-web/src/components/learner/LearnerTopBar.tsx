import React from 'react';
import styles from './shell.module.css';
import { LanguageSwitcher } from './LanguageSwitcher.tsx';
import type { ShellData } from './types.ts';

export function LearnerTopBar({ shell }: { shell: ShellData }) {
  const { streak, totalXp, contexts, selectedContextId, learner } = shell;
  const totalGems = shell.totalGems ?? 0;
  return (
    <header className={styles.topbar} id="learnerTopBar">
      <a href="/home" className={`${styles.brand} ${styles.brandInTop}`}>Lingora</a>
      <LanguageSwitcher
        contexts={contexts}
        selectedContextId={selectedContextId}
        uiLocale={learner.uiLocale || 'vi'}
        selectedProgress={shell.selectedProgress}
      />
      {shell.gamificationStatus !== 'UNAVAILABLE' && (
        <div className={styles.stats}>
          <a href="/profile" id="currentStreakDisplay" className={`${styles.pill} ${styles.pillStreak}`}>
            <span aria-hidden="true">🔥</span>
            <strong id="streakBadge">{streak.currentStreak} ngày</strong>
            <span className="sr-only">Chuỗi ngày</span>
          </a>
          <a href="/profile" id="totalXpDisplay" className={`${styles.pill} ${styles.pillXp}`}>
            <span aria-hidden="true">⚡</span>
            <strong id="totalXpBadge">{totalXp} XP</strong>
            <span className="sr-only">Điểm kinh nghiệm</span>
          </a>
          <a href="/profile" id="totalGemsDisplay" className={`${styles.pill} ${styles.pillGems}`}>
            <span aria-hidden="true">💎</span>
            <strong id="totalGemsBadge">{totalGems}</strong>
            <span className="sr-only">Kim cương</span>
          </a>
        </div>
      )}
    </header>
  );
}
