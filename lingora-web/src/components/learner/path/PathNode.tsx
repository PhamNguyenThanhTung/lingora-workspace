'use client';

import React from 'react';
import type { PathNodeDto } from '../../../server/context/home-dto.ts';
import { NodePopover } from './NodePopover.tsx';
import styles from './path.module.css';

export const STATE_LABEL: Record<PathNodeDto['state'], string> = {
  COMPLETED: 'Đã hoàn thành',
  CURRENT: 'Đang học',
  AVAILABLE: 'Chưa bắt đầu',
  LOCKED: 'Đang khóa',
  COMING_SOON: 'Sắp ra mắt',
};

const STATE_CLASS: Record<PathNodeDto['state'], string> = {
  COMPLETED: styles.stateCompleted,
  CURRENT: styles.stateCurrent,
  AVAILABLE: styles.stateAvailable,
  LOCKED: styles.stateLocked,
  COMING_SOON: styles.stateComingSoon,
};

interface PathNodeProps {
  node: PathNodeDto;
  index: number;
  offset: number;
  open: boolean;
  /** The single node that carries the call-to-action bubble. */
  showBubble: boolean;
  bubbleText: string;
  inProgress: boolean;
  targetLanguage?: string;
  onToggle: (lessonId: string | null) => void;
}

export function PathNode({ node, index, offset, open, showBubble, bubbleText, inProgress, targetLanguage, onToggle }: PathNodeProps) {
  const locked = node.state === 'LOCKED' || node.state === 'COMING_SOON';
  const icon = node.state === 'COMPLETED' ? '✓' : locked ? '🔒' : node.state === 'CURRENT' ? '★' : String(index + 1);
  return (
    <li
      id={`pathNode-${node.lessonId}`}
      data-state={node.state}
      data-required={node.isRequired ? 'true' : 'false'}
      className={`${styles.node}${open ? ` ${styles.nodeOpen}` : ''}${node.isRequired ? '' : ` ${styles.optional}`}`}
    >
      <div className={styles.nodeInner} style={{ ['--dx' as string]: `${offset}px` }}>
        {showBubble && (
          <span className={styles.bubble} aria-hidden="true">{bubbleText}</span>
        )}
        <button
          type="button"
          id={`pathBtn-${node.lessonId}`}
          className={`${styles.medalBtn} ${STATE_CLASS[node.state]}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => onToggle(open ? null : node.lessonId)}
        >
          <span aria-hidden="true">{icon}</span>
          <span className="sr-only">
            {node.title}. {STATE_LABEL[node.state]}
            {!node.isRequired && node.state !== 'COMING_SOON' ? '. Tùy chọn' : ''}
          </span>
        </button>
        {(node.score != null || (!node.isRequired && node.state !== 'COMING_SOON')) && (
          <span className={styles.nodeMeta}>
            {node.score != null && <span className={styles.score}>{node.score}%</span>}
            {!node.isRequired && node.state !== 'COMING_SOON' && <span className={styles.optionalTag}>Tùy chọn</span>}
          </span>
        )}
      </div>
      {open && (
        <NodePopover node={node} inProgress={inProgress} targetLanguage={targetLanguage} onClose={() => onToggle(null)} />
      )}
    </li>
  );
}
