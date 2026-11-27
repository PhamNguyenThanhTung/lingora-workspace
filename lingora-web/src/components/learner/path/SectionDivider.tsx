import React from 'react';
import type { PathSectionDto } from '../../../server/context/home-dto.ts';
import styles from './path.module.css';

/** Separates two levels on the map. The "jump ahead" button arrives in phase 2; until then it only explains. */
export function SectionDivider({ section, previous }: { section: PathSectionDto; previous?: PathSectionDto }) {
  const note =
    section.state === 'COMING_SOON'
      ? 'Sắp ra mắt'
      : section.state === 'COMPLETED'
      ? 'Đã hoàn thành'
      : section.state === 'CURRENT'
      ? 'Đang học'
      : previous
      ? `Hoàn thành ${previous.levelCode} để mở`
      : 'Đang khóa';
  return (
    <div className={styles.divider} role="separator" aria-label={`Phần ${section.levelCode}`} data-section-state={section.state}>
      <p className={styles.dividerTitle}>
        {section.levelCode}
        {section.levelLabel ? ` · ${section.levelLabel}` : ''}
      </p>
      <p className={styles.dividerNote}>{note}</p>
    </div>
  );
}
