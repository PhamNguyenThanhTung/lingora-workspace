import React from 'react';
import styles from './shell.module.css';
import { LearnerNav } from './LearnerNav.tsx';
import { LearnerTopBar } from './LearnerTopBar.tsx';
import { QuestPanel } from './QuestPanel.tsx';
import type { ShellData, ShellSection } from './types.ts';

interface LearnerShellProps {
  shell: ShellData;
  active: ShellSection;
  /** Show the quest column on desktop (≥1024px). Off for pages that already are the quest view. */
  quests?: boolean;
  children: React.ReactNode;
}

/**
 * Shared frame for learner pages. Each page.tsx wraps itself in this component (no route group):
 * desktop = sidebar | content | quest column, mobile = single column + bottom tab bar.
 */
export function LearnerShell({ shell, active, quests = true, children }: LearnerShellProps) {
  const targetCode = shell.contexts.find((c) => c.id === shell.selectedContextId)?.targetLanguage.code;
  return (
    <div className={`${styles.shell}${quests ? '' : ` ${styles.shellNoAside}`}`} id="learnerShell">
      <a href="#learnerMain" className={styles.skip}>Bỏ qua tới nội dung</a>
      <aside className={styles.sidebar} aria-label="Thanh bên">
        <a href="/home" className={styles.brand}>Lingora</a>
        <LearnerNav variant="sidebar" active={active} targetLanguage={targetCode} />
      </aside>
      <LearnerTopBar shell={shell} />
      <main id="learnerMain" className={styles.main} tabIndex={-1}>
        {children}
      </main>
      {quests && (
        <aside className={styles.right} aria-label="Nhiệm vụ hôm nay" id="questColumn">
          <QuestPanel shell={shell} />
        </aside>
      )}
      <div className={styles.tabs}>
        <LearnerNav variant="tabs" active={active} targetLanguage={targetCode} />
      </div>
    </div>
  );
}
