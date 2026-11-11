'use client';

import React from 'react';
import type { LessonBlock } from '@lingora/lesson-content';
import styles from './studio-styles';

export interface StudioOutlineProps {
  blocks: LessonBlock[];
  activeBlockKey: string | null;
  onSelectBlock: (blockKey: string) => void;
  vocabularyCount: number;
  exerciseCount: number;
  coreExerciseCount: number;
}

export function StudioOutline({
  blocks,
  activeBlockKey,
  onSelectBlock,
  vocabularyCount,
  exerciseCount,
  coreExerciseCount,
}: StudioOutlineProps) {
  const headings = blocks.filter((b) => b.type === 'HEADING');

  const handleHeadingClick = (blockKey: string) => {
    onSelectBlock(blockKey);
    const element = document.getElementById(`studio-block-${blockKey}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getHeadingIndentClass = (level: number) => {
    switch (level) {
      case 2:
        return styles.outlineItemLevel2;
      case 3:
        return styles.outlineItemLevel3;
      case 4:
        return styles.outlineItemLevel4;
      default:
        return styles.outlineItemLevel2;
    }
  };

  return (
    <aside className={styles.outlineColumn} aria-label="Mục lục bài học">
      <div className={styles.outlineTitle}>
        <span>Mục lục & Thống kê</span>
      </div>

      {/* Overview Badges */}
      <div className={styles.outlineBadgeGroup}>
        <div className={styles.outlineBadge} id="badgeOutlineBlocks">
          <span>Tổng số khối:</span>
          <span className={styles.outlineBadgeValue}>{blocks.length}</span>
        </div>
        <div className={styles.outlineBadge} id="badgeOutlineVocab">
          <span>Từ vựng liên kết:</span>
          <span className={styles.outlineBadgeValue}>{vocabularyCount}</span>
        </div>
        <div className={styles.outlineBadge} id="badgeOutlineExercises">
          <span>Bài tập:</span>
          <span className={styles.outlineBadgeValue}>
            {exerciseCount} ({coreExerciseCount} cốt lõi)
          </span>
        </div>
      </div>

      {/* Heading Structure */}
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
        Cấu trúc tiêu đề bài
      </div>

      {headings.length === 0 ? (
        <div className={styles.outlineEmpty} id="outlineEmptyNotice">
          Chưa có tiêu đề mục nào (H2, H3, H4). Hãy thêm khối Tiêu đề để tạo mục lục tự động.
        </div>
      ) : (
        <ul className={styles.outlineList} role="tree">
          {headings.map((hBlock) => {
            const headingContent = hBlock.content as { level: 2 | 3 | 4; text: string };
            const isActive = activeBlockKey === hBlock.blockKey;
            const level = headingContent.level || 2;
            const text = headingContent.text || `Tiêu đề H${level}`;

            return (
              <li key={hBlock.blockKey} role="none">
                <button
                  type="button"
                  role="treeitem"
                  aria-selected={isActive}
                  className={`${styles.outlineItem} ${getHeadingIndentClass(level)} ${
                    isActive ? styles.outlineItemActive : ''
                  }`}
                  onClick={() => handleHeadingClick(hBlock.blockKey)}
                  title={`H${level}: ${text}`}
                  id={`outlineHeading-${hBlock.blockKey}`}
                >
                  <span style={{ opacity: 0.6, marginRight: '4px' }}>H{level}</span> {text}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
