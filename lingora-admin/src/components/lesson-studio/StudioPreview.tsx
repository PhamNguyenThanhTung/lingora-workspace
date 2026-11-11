'use client';

import React, { useState, useMemo } from 'react';
import type {
  LessonBlock,
  LessonPresentationDto,
  PublicVocabularyDto,
  PublicExerciseDto,
  PublicExerciseType,
} from '@lingora/lesson-content';
import { LessonContent } from '@lingora/lesson-content/LessonContent';
import styles from './studio-styles';

export interface StudioPreviewProps {
  blocks: LessonBlock[];
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
}

export function StudioPreview({
  blocks,
  vocabulary = [],
  exercises = [],
  title,
}: StudioPreviewProps) {
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');

  // Xây dựng LessonPresentationDto trực tiếp theo thời gian thực (live preview)
  const presentation: LessonPresentationDto = useMemo(() => {
    const publicVocab: PublicVocabularyDto[] = vocabulary.map((v) => ({
      id: v.localId,
      position: v.position,
      isCore: v.isCore,
      displaySnapshot: {
        canonicalForm: v.displayInfo.canonicalForm,
        senseKey: v.displayInfo.senseKey || undefined,
        meaningLabels: {
          vi: v.displayInfo.meaningVi || '',
          en: v.displayInfo.meaningEn || '',
        },
        phonetic: v.displayInfo.phonetic || null,
        partOfSpeech: v.displayInfo.partOfSpeech || null,
        example: v.displayInfo.example || null,
      },
    }));

    const publicExercises: PublicExerciseDto[] = exercises.map((ex) => ({
      id: ex.localId,
      itemId: ex.localId,
      itemRevisionId: ex.localId,
      position: ex.position,
      isCore: ex.isCore,
      type: ex.type as PublicExerciseType,
      schemaVersion: 1,
      promptData: ex.promptData || {},
    }));

    return {
      contentSchemaVersion: 1,
      blocks,
      vocabulary: publicVocab,
      exercises: publicExercises,
    };
  }, [blocks, vocabulary, exercises]);

  const hasContent = blocks.length > 0 || vocabulary.length > 0 || exercises.length > 0;

  return (
    <section className={styles.previewColumn} aria-label="Xem trước nội dung học viên">
      {/* Header with Live Indicator & Device Toggle */}
      <div className={styles.previewHeader}>
        <div className={styles.previewHeaderTitle}>
          <span className={styles.previewLiveIndicator} title="Cập nhật thời gian thực" />
          <span>Xem trước trực tiếp</span>
        </div>

        <div className={styles.previewDeviceToggle} role="group" aria-label="Chế độ hiển thị">
          <button
            type="button"
            className={`${styles.previewDeviceBtn} ${
              deviceView === 'desktop' ? styles.previewDeviceBtnActive : ''
            }`}
            onClick={() => setDeviceView('desktop')}
            title="Giao diện máy tính"
            id="btnPreviewDeviceDesktop"
          >
            🖥 Máy tính
          </button>
          <button
            type="button"
            className={`${styles.previewDeviceBtn} ${
              deviceView === 'mobile' ? styles.previewDeviceBtnActive : ''
            }`}
            onClick={() => setDeviceView('mobile')}
            title="Giao diện điện thoại"
            id="btnPreviewDeviceMobile"
          >
            📱 Điện thoại
          </button>
        </div>
      </div>

      {/* Viewport Wrapper */}
      <div className={styles.previewViewportWrapper} id="studioLivePreviewContainer">
        <div
          className={deviceView === 'mobile' ? styles.previewViewportMobile : undefined}
          style={{ width: '100%' }}
        >
          {/* Lesson Title Banner */}
          {(title?.vi || title?.en) && (
            <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              {title.vi && (
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
                  {title.vi}
                </h2>
              )}
              {title.en && (
                <div style={{ fontSize: '14px', color: '#64748b', fontStyle: 'italic' }}>
                  {title.en}
                </div>
              )}
            </div>
          )}

          {!hasContent ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8', fontStyle: 'italic' }}>
              Bản xem trước bài học sẽ hiển thị tại đây khi bạn thêm nội dung ở bảng bên trái.
            </div>
          ) : (
            <LessonContent presentation={presentation} />
          )}
        </div>
      </div>
    </section>
  );
}
