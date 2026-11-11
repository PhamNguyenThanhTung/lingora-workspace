'use client';

import React, { useState } from 'react';
import type { LessonBlock, LessonBlockType } from '@lingora/lesson-content';
import { BlockToolbar, BlockActionToolbar, AVAILABLE_BLOCK_TYPES } from './BlockToolbar';
import { BlockEditor } from './BlockEditor';
import styles from './studio-styles';

export interface BlockCanvasProps {
  blocks: LessonBlock[];
  activeBlockKey: string | null;
  onSelectBlock: (blockKey: string) => void;
  onUpdateBlock: (blockKey: string, patch: Partial<LessonBlock>) => void;
  onDeleteBlock: (blockKey: string) => void;
  onDuplicateBlock: (blockKey: string) => void;
  onMoveBlock: (blockKey: string, direction: 'up' | 'down') => void;
  onReorderBlocks: (fromIndex: number, toIndex: number) => void;
  onAddBlock: (type: LessonBlockType, targetIndex?: number) => void;
  readOnly?: boolean;
  isPending?: boolean;
}

export function BlockCanvas({
  blocks,
  activeBlockKey,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onReorderBlocks,
  onAddBlock,
  readOnly = false,
  isPending = false,
}: BlockCanvasProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [insertionTarget, setInsertionTarget] = useState<{ blockKey: string; index: number } | null>(null);

  const disabled = readOnly || isPending;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (disabled || draggedIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTargetIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (disabled || draggedIndex === null) return;
    e.preventDefault();
    if (draggedIndex !== targetIndex) {
      onReorderBlocks(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const getBadgeClass = (type: LessonBlockType) => {
    const item = AVAILABLE_BLOCK_TYPES.find((b) => b.type === type);
    return item ? item.badgeClass : styles.blockTypeBadge;
  };

  return (
    <div className={styles.canvasColumn} id="studioCanvas">
      {/* Top Insertion Toolbar */}
      <BlockToolbar onAddBlock={(type) => onAddBlock(type)} disabled={disabled} />

      {/* Block List */}
      <div className={styles.canvasList}>
        {blocks.length === 0 ? (
          <div className={styles.emptyCanvas} id="emptyStudioNotice">
            <div className={styles.emptyCanvasIcon}>📋</div>
            <div className={styles.emptyCanvasText}>
              Chưa có khối nội dung nào trong bài học.
            </div>
            <p style={{ margin: 0, fontSize: '13px' }}>
              Hãy chọn một loại khối ở thanh công cụ phía trên (Tiêu đề, Văn bản, Ví dụ, Hội thoại...) để bắt đầu soạn bài.
            </p>
          </div>
        ) : (
          blocks.map((block, index) => {
            const isActive = activeBlockKey === block.blockKey;
            const isDragging = draggedIndex === index;
            const isDropTarget = dropTargetIndex === index;

            return (
              <div
                key={block.blockKey}
                id={`studio-block-${block.blockKey}`}
                className={`${styles.blockCard} ${isActive ? styles.blockCardActive : ''} ${
                  isDragging ? styles.blockCardDragging : ''
                } ${isDropTarget ? styles.blockCardDropTarget : ''}`}
                onClick={() => onSelectBlock(block.blockKey)}
              >
                {/* Block Header */}
                <div className={styles.blockHeader}>
                  <div className={styles.blockHeaderLeft}>
                    {/* Drag Handle */}
                    <div
                      className={styles.dragHandle}
                      draggable={!disabled}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      title={disabled ? 'Kéo thả bị khóa' : 'Kéo để sắp xếp lại vị trí khối'}
                      aria-label={`Kéo thả khối số ${block.position}`}
                      id={`dragHandle-${block.blockKey}`}
                    >
                      ⋮⋮
                    </div>

                    <span className={styles.blockPositionBadge}>#{block.position}</span>
                    <span className={`${styles.blockTypeBadge} ${getBadgeClass(block.type)}`}>
                      {block.type}
                    </span>
                  </div>

                  {/* Actions Toolbar */}
                  <BlockActionToolbar
                    blockKey={block.blockKey}
                    position={block.position}
                    isFirst={index === 0}
                    isLast={index === blocks.length - 1}
                    onMoveUp={() => onMoveBlock(block.blockKey, 'up')}
                    onMoveDown={() => onMoveBlock(block.blockKey, 'down')}
                    onAddBefore={() => setInsertionTarget({ blockKey: block.blockKey, index })}
                    onAddAfter={() => setInsertionTarget({ blockKey: block.blockKey, index: index + 1 })}
                    onDuplicate={() => onDuplicateBlock(block.blockKey)}
                    onDelete={() => onDeleteBlock(block.blockKey)}
                    disabled={disabled}
                  />
                </div>

                {insertionTarget?.blockKey === block.blockKey && (
                  <div className={styles.blockBody} onClick={(e) => e.stopPropagation()}>
                    <p className={styles.formLabel}>
                      Chọn loại khối để chèn {insertionTarget.index === index ? 'trước' : 'sau'} khối này
                    </p>
                    <BlockToolbar
                      targetIndex={insertionTarget.index}
                      onAddBlock={(type, targetIndex) => {
                        onAddBlock(type, targetIndex);
                        setInsertionTarget(null);
                      }}
                      disabled={disabled}
                    />
                    <button type="button" className={styles.blockActionButton} onClick={() => setInsertionTarget(null)}>
                      Hủy chèn
                    </button>
                  </div>
                )}

                {/* Block Form Editor */}
                <BlockEditor
                  block={block}
                  onChange={(patch) => onUpdateBlock(block.blockKey, patch)}
                  disabled={disabled}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
