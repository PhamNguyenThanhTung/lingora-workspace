'use client';

import React, { useRef } from 'react';
import type { PathNodeDto } from '../../../server/context/home-dto.ts';
import { LangText } from '../LangText.tsx';
import { useDialogFocus } from '../useDialogFocus.ts';
import styles from './path.module.css';

export const LESSON_XP = 10;

interface NodePopoverProps {
  node: PathNodeDto;
  inProgress: boolean;
  targetLanguage?: string;
  onClose: () => void;
}

/** Lesson details: a popover on wide screens, a bottom sheet on phones. Locked nodes explain why they are locked. */
export function NodePopover({ node, inProgress, targetLanguage, onClose }: NodePopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(true, ref, onClose);
  const titleId = `pathPopoverTitle-${node.lessonId}`;
  const navigable = node.state === 'COMPLETED' || node.state === 'CURRENT' || node.state === 'AVAILABLE';
  const cta =
    node.state === 'COMPLETED'
      ? 'Học lại'
      : node.state === 'CURRENT' && inProgress
      ? 'Tiếp tục học'
      : `Bắt đầu · +${LESSON_XP} XP`;
  return (
    <>
      <div className={styles.backdrop} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={styles.popover}
        id={`pathPopover-${node.lessonId}`}
      >
        <h3 id={titleId} className={styles.popTitle}>
          <LangText text={node.title} targetLanguage={targetLanguage} />
        </h3>
        {node.score != null && <p className={styles.popMeta}>Điểm lần gần nhất: {node.score}%</p>}
        {!node.isRequired && node.state !== 'COMING_SOON' && <p className={styles.popMeta}>Bài tùy chọn — luôn mở, không bắt buộc.</p>}
        {node.state === 'LOCKED' && <p className={styles.popLock}>Hoàn thành bài trước để mở khóa.</p>}
        {node.state === 'COMING_SOON' && <p className={styles.popLock}>Bài học sắp ra mắt.</p>}
        <div className={styles.popActions}>
          {navigable && (
            <a href={node.href} id={`pathLink-${node.lessonId}`} className={styles.popCta}>
              {cta}
            </a>
          )}
          <button type="button" className={styles.popClose} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </>
  );
}
