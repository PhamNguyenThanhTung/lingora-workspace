'use client';

import React from 'react';
import type { LessonBlockType } from '@lingora/lesson-content';
import styles from './studio-styles';

export interface BlockToolbarProps {
  onAddBlock: (type: LessonBlockType, targetIndex?: number) => void;
  targetIndex?: number;
  disabled?: boolean;
}

export const AVAILABLE_BLOCK_TYPES: Array<{
  type: LessonBlockType;
  label: string;
  badgeClass: string;
  icon: string;
}> = [
  { type: 'HEADING', label: 'Tiêu đề (Heading)', badgeClass: styles.blockTypeBadgeHeading, icon: 'H' },
  { type: 'TEXT', label: 'Văn bản (Text)', badgeClass: styles.blockTypeBadgeText, icon: '¶' },
  { type: 'EXAMPLE', label: 'Ví dụ (Example)', badgeClass: styles.blockTypeBadgeExample, icon: '💬' },
  { type: 'DIALOGUE', label: 'Hội thoại (Dialogue)', badgeClass: styles.blockTypeBadgeDialogue, icon: '👥' },
  { type: 'CALLOUT', label: 'Ghi chú (Callout)', badgeClass: styles.blockTypeBadgeCallout, icon: '💡' },
  { type: 'MEDIA', label: 'Âm thanh (Audio)', badgeClass: styles.blockTypeBadgeMedia, icon: '🔊' },
  { type: 'GRAMMAR', label: 'Ngữ pháp (Grammar)', badgeClass: styles.blockTypeBadgeGrammar, icon: '📖' },
  { type: 'VOCABULARY', label: 'Từ vựng (Vocabulary)', badgeClass: styles.blockTypeBadgeVocabulary, icon: '🔤' },
  { type: 'DIVIDER', label: 'Phân cách (Divider)', badgeClass: styles.blockTypeBadgeDivider, icon: '—' },
];

/**
 * Thanh công cụ chèn khối nội dung vào bài học.
 */
export function BlockToolbar({ onAddBlock, targetIndex, disabled = false }: BlockToolbarProps) {
  return (
    <div className={styles.toolbarCard} role="toolbar" aria-label="Thanh công cụ thêm khối nội dung">
      <div className={styles.toolbarHeader}>
        <span className={styles.toolbarTitle}>+ Thêm khối nội dung</span>
      </div>
      <div className={styles.toolbarButtons}>
        {AVAILABLE_BLOCK_TYPES.map(({ type, label, icon }) => (
          <button
            key={type}
            type="button"
            className={styles.addBlockBtn}
            onClick={() => onAddBlock(type, targetIndex)}
            disabled={disabled}
            aria-label={`Thêm khối ${label}`}
            id={`btnAddBlock-${type.toLowerCase()}${targetIndex !== undefined ? `-${targetIndex}` : ''}`}
          >
            <span aria-hidden="true" style={{ fontWeight: 'bold' }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export interface BlockActionToolbarProps {
  blockKey: string;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddBefore: () => void;
  onAddAfter: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

/**
 * Thanh nút thao tác trên từng khối: Di chuyển lên, Di chuyển xuống, Sao chép, Xóa.
 */
export function BlockActionToolbar({
  blockKey,
  position,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onAddBefore,
  onAddAfter,
  onDuplicate,
  onDelete,
  disabled = false,
}: BlockActionToolbarProps) {
  return (
    <div
      className={styles.blockActions}
      role="group"
      aria-label={`Thao tác cho khối số ${position}`}
    >
      <button
        type="button"
        className={styles.blockActionButton}
        onClick={onAddBefore}
        disabled={disabled}
        aria-label={`Thêm khối trước khối ${position}`}
        title="Thêm khối trước"
        id={`btnAddBlockBefore-${blockKey}`}
      >
        +↑
      </button>
      <button
        type="button"
        className={styles.blockActionButton}
        onClick={onAddAfter}
        disabled={disabled}
        aria-label={`Thêm khối sau khối ${position}`}
        title="Thêm khối sau"
        id={`btnAddBlockAfter-${blockKey}`}
      >
        +↓
      </button>
      <button
        type="button"
        className={styles.blockActionButton}
        onClick={onMoveUp}
        disabled={disabled || isFirst}
        aria-label={`Di chuyển khối ${position} lên`}
        title="Di chuyển lên"
        id={`btnMoveUp-${blockKey}`}
      >
        ▲
      </button>
      <button
        type="button"
        className={styles.blockActionButton}
        onClick={onMoveDown}
        disabled={disabled || isLast}
        aria-label={`Di chuyển khối ${position} xuống`}
        title="Di chuyển xuống"
        id={`btnMoveDown-${blockKey}`}
      >
        ▼
      </button>
      <button
        type="button"
        className={styles.blockActionButton}
        onClick={onDuplicate}
        disabled={disabled}
        aria-label={`Sao chép khối ${position}`}
        title="Nhân bản khối"
        id={`btnDuplicate-${blockKey}`}
      >
        ⧉
      </button>
      <button
        type="button"
        className={`${styles.blockActionButton} ${styles.blockActionDelete}`}
        onClick={onDelete}
        disabled={disabled}
        aria-label={`Xóa khối ${position}`}
        title="Xóa khối"
        id={`btnDelete-${blockKey}`}
      >
        ✕
      </button>
    </div>
  );
}
