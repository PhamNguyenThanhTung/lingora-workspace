'use client';

import React, { useEffect, useState } from 'react';
import type { LessonBlock, LessonBlockType } from '@lingora/lesson-content';
import {
  addBlock,
  duplicateBlock,
  deleteBlock,
  moveBlock,
  reorderBlocks,
  updateBlock,
} from './block-operations';
import { StudioOutline } from './StudioOutline';
import { BlockCanvas } from './BlockCanvas';
import { StudioPreview } from './StudioPreview';
import styles, { studioCss } from './studio-styles';

export interface StudioLayoutProps {
  blocks: LessonBlock[];
  onBlocksChange: (blocks: LessonBlock[]) => void;
  vocabulary?: Array<{
    localId: string;
    position: number;
    isCore: boolean;
    displayInfo: {
      canonicalForm: string;
      senseKey?: string | null;
      meaningVi?: string | null;
      meaningEn?: string | null;
      phonetic?: string | null;
      partOfSpeech?: string | null;
      example?: string | null;
    };
  }>;
  exercises?: Array<{
    localId: string;
    position: number;
    isCore: boolean;
    type: string;
    promptData: any;
  }>;
  title?: {
    vi?: string;
    en?: string;
  };
  readOnly?: boolean;
  isPending?: boolean;
}

export function StudioLayout({
  blocks,
  onBlocksChange,
  vocabulary = [],
  exercises = [],
  title,
  readOnly = false,
  isPending = false,
}: StudioLayoutProps) {
  const [activeBlockKey, setActiveBlockKey] = useState<string | null>(
    blocks.length > 0 ? blocks[0].blockKey : null
  );
  const [mobileTab, setMobileTab] = useState<'canvas' | 'outline' | 'preview'>('canvas');

  const coreExercisesCount = exercises.filter((ex) => ex.isCore).length;

  const handleAddBlock = (type: LessonBlockType, targetIndex?: number) => {
    const nextBlocks = addBlock(blocks, type, targetIndex);
    onBlocksChange(nextBlocks);
    // Focus vào block mới chèn
    const insertedIdx =
      targetIndex === undefined || targetIndex < 0 || targetIndex > blocks.length
        ? blocks.length
        : targetIndex;
    if (nextBlocks[insertedIdx]) {
      setActiveBlockKey(nextBlocks[insertedIdx].blockKey);
    }
  };

  const handleDuplicateBlock = (blockKey: string) => {
    const nextBlocks = duplicateBlock(blocks, blockKey);
    onBlocksChange(nextBlocks);
  };

  const handleDeleteBlock = (blockKey: string) => {
    const nextBlocks = deleteBlock(blocks, blockKey);
    onBlocksChange(nextBlocks);
    if (activeBlockKey === blockKey) {
      setActiveBlockKey(nextBlocks.length > 0 ? nextBlocks[0].blockKey : null);
    }
  };

  const handleMoveBlock = (blockKey: string, direction: 'up' | 'down') => {
    const nextBlocks = moveBlock(blocks, blockKey, direction);
    onBlocksChange(nextBlocks);
  };

  const handleReorderBlocks = (fromIndex: number, toIndex: number) => {
    const nextBlocks = reorderBlocks(blocks, fromIndex, toIndex);
    onBlocksChange(nextBlocks);
  };

  const handleUpdateBlock = (blockKey: string, patch: Partial<LessonBlock>) => {
    const nextBlocks = updateBlock(blocks, blockKey, patch);
    onBlocksChange(nextBlocks);
  };

  return (
    <div className={styles.studioLayout} id="lessonStudioLayout" data-mobile-tab={mobileTab}>
      <style dangerouslySetInnerHTML={{ __html: studioCss }} />
      {/* Studio Header Bar */}
      <div className={styles.studioHeaderBar}>
        <div className={styles.studioHeaderLeft}>
          <span className={styles.studioFormatBadge}>
            ✦ Lesson Studio V1 (Định dạng khối chuyên sâu)
          </span>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Hỗ trợ kéo thả, phím tắt và xem trước trực tiếp theo thời gian thực.
          </span>
        </div>

        {/* Mobile View Switcher */}
        <div className={styles.studioViewTabs} role="tablist" aria-label="Chuyển chế độ xem">
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'outline'}
            className={`${styles.viewTabBtn} ${mobileTab === 'outline' ? styles.viewTabBtnActive : ''}`}
            onClick={() => setMobileTab('outline')}
          >
            Mục lục
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'canvas'}
            className={`${styles.viewTabBtn} ${mobileTab === 'canvas' ? styles.viewTabBtnActive : ''}`}
            onClick={() => setMobileTab('canvas')}
          >
            Soạn thảo ({blocks.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'preview'}
            className={`${styles.viewTabBtn} ${mobileTab === 'preview' ? styles.viewTabBtnActive : ''}`}
            onClick={() => setMobileTab('preview')}
          >
            Xem trước
          </button>
        </div>
      </div>

      {/* 3-Column Responsive Grid */}
      <div className={styles.studioColumns}>
        {/* Column 1: Outline */}
        <div className="studio-col-outline">
          <StudioOutline
            blocks={blocks}
            activeBlockKey={activeBlockKey}
            onSelectBlock={(key) => {
              setActiveBlockKey(key);
              if (mobileTab === 'outline') {
                setMobileTab('canvas');
              }
            }}
            vocabularyCount={vocabulary.length}
            exerciseCount={exercises.length}
            coreExerciseCount={coreExercisesCount}
          />
        </div>

        {/* Column 2: Canvas */}
        <div className="studio-col-canvas">
          <BlockCanvas
            blocks={blocks}
            activeBlockKey={activeBlockKey}
            onSelectBlock={setActiveBlockKey}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            onDuplicateBlock={handleDuplicateBlock}
            onMoveBlock={handleMoveBlock}
            onReorderBlocks={handleReorderBlocks}
            onAddBlock={handleAddBlock}
            readOnly={readOnly}
            isPending={isPending}
          />
        </div>

        {/* Column 3: Live Preview */}
        <div className="studio-col-preview">
          <StudioPreview
            blocks={blocks}
            vocabulary={vocabulary}
            exercises={exercises}
            title={title}
          />
        </div>
      </div>
    </div>
  );
}
