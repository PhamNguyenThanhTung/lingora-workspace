import React from 'react';
import styles from './shell.module.css';
import type { ShellSection } from './types.ts';

interface LearnerNavProps {
  variant: 'sidebar' | 'tabs';
  active: ShellSection;
  /** Code of the selected path's target language; "Luyện viết" only exists for ja / zh paths. */
  targetLanguage?: string | null;
}

const ITEMS: Array<{ key: ShellSection; label: string; icon: string; href: string; writingOnly?: boolean }> = [
  { key: 'home', label: 'Học', icon: '🏠', href: '/home' },
  // Placeholder link: the /write page is built in a later workstream.
  { key: 'write', label: 'Luyện viết', icon: '✍️', href: '/write', writingOnly: true },
  { key: 'quests', label: 'Nhiệm vụ', icon: '🎯', href: '/quests' },
  { key: 'profile', label: 'Hồ sơ', icon: '👤', href: '/profile' },
];

const WRITING_LANGUAGES = new Set(['ja', 'zh']);

/** One list of destinations shared by the desktop sidebar and the mobile tab bar. */
export function LearnerNav({ variant, active, targetLanguage }: LearnerNavProps) {
  const showWriting = !!targetLanguage && WRITING_LANGUAGES.has(targetLanguage.toLowerCase().split('-')[0]);
  return (
    <nav aria-label={variant === 'sidebar' ? 'Điều hướng chính' : 'Điều hướng chính (thanh tab)'} id={variant === 'sidebar' ? 'learnerSidebarNav' : 'learnerTabBar'}>
      <ul className={styles.navList}>
        {ITEMS.filter((item) => !item.writingOnly || showWriting).map((item) => {
          const isActive = item.key === active;
          return (
            <li key={item.key}>
              <a
                href={item.href}
                className={`${styles.navLink}${isActive ? ` ${styles.navActive}` : ''}`}
                aria-current={isActive ? 'page' : undefined}
                data-nav={item.key}
              >
                <span className={styles.navIcon} aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
