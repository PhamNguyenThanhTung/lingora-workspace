'use client';

import React, { useState } from 'react';
import type {
  LessonPresentationDto,
  PresentationBlock,
  PublicVocabularyDto,
  PublicExerciseDto,
  UnsupportedBlockDto,
} from './dto.ts';
import type {
  HeadingContent,
  TextContent,
  GrammarContent,
  ExampleContent,
  DialogueContent,
  CalloutContent,
  MediaContent,
  TextDocumentNode,
  TextRun,
} from './schema.ts';
import { isSafeRichTextUrl } from './schema.ts';

const h = React.createElement;

export interface LessonContentProps {
  presentation?:
    | LessonPresentationDto
    | {
        contentSchemaVersion?: number;
        blocks?: PresentationBlock[];
        vocabulary?: PublicVocabularyDto[];
        exercises?: PublicExerciseDto[];
      }
    | null;
  className?: string;
  locale?: string;
}

function renderTextRun(run: TextRun, key: number | string): React.ReactNode {
  let element: React.ReactNode = run.text;

  if (run.bold) {
    element = h('strong', { key: 'b' }, element);
  }
  if (run.italic) {
    element = h('em', { key: 'i' }, element);
  }
  if ((run as any).underline) {
    element = h('u', { key: 'u' }, element);
  }

  if (run.link && isSafeRichTextUrl(run.link.url)) {
    element = h(
      'a',
      {
        key: 'a',
        href: run.link.url,
        title: run.link.title,
        target: '_blank',
        rel: 'noopener noreferrer',
        style: { color: 'var(--primary-color, #2563eb)', textDecoration: 'underline' },
      },
      element
    );
  }

  return h(React.Fragment, { key }, element);
}

function renderDocumentNodes(nodes: TextDocumentNode[]): React.ReactNode[] {
  return nodes.map((node, nodeIdx) => {
    if (node.type === 'paragraph') {
      return h(
        'p',
        {
          key: `p-${nodeIdx}`,
          className: 'lingora-block-paragraph lesson-paragraph',
          style: { margin: '0 0 14px', lineHeight: 1.7, fontSize: 'var(--font-size-body, 16px)' },
        },
        node.runs.map((run, runIdx) => renderTextRun(run, runIdx))
      );
    }
    if (node.type === 'list') {
      const listTag = node.style === 'ordered' ? 'ol' : 'ul';
      return h(
        listTag,
        {
          key: `list-${nodeIdx}`,
          className: 'lingora-block-list',
          style: { margin: '0 0 14px', paddingLeft: '24px', lineHeight: 1.7 },
        },
        node.items.map((item, itemIdx) =>
          h(
            'li',
            { key: `item-${itemIdx}`, style: { marginBottom: '4px' } },
            item.runs.map((run, runIdx) => renderTextRun(run, runIdx))
          )
        )
      );
    }
    return null;
  });
}

function renderHeadingBlock(block: { content: HeadingContent }, key: string): React.ReactNode {
  const level = block.content?.level === 3 ? 3 : block.content?.level === 4 ? 4 : 2;
  const tag = `h${level}`;
  const style: React.CSSProperties = {
    fontWeight: level === 2 ? 700 : 600,
    fontSize:
      level === 2
        ? 'var(--font-size-heading, 22px)'
        : level === 3
          ? 'var(--font-size-title, 18px)'
          : 'var(--font-size-body, 16px)',
    marginBottom: level === 2 ? '14px' : '10px',
    paddingBottom: level === 2 ? '8px' : undefined,
    borderBottom: level === 2 ? '1px solid var(--border-subtle, #e2e8f0)' : undefined,
  };
  return h(
    tag,
    {
      key,
      className: `lingora-block lingora-block-heading lingora-block-heading-h${level}`,
      style,
    },
    block.content?.text || ''
  );
}

function renderTextBlock(block: { content: TextContent }, key: string): React.ReactNode {
  return h(
    'div',
    {
      key,
      className: 'lingora-block lingora-block-text',
      style: { display: 'flex', flexDirection: 'column' },
    },
    renderDocumentNodes(block.content?.nodes || [])
  );
}

function renderExampleBlock(block: { content: ExampleContent }, key: string): React.ReactNode {
  return h(
    'div',
    {
      key,
      className: 'lingora-block lingora-block-example',
      style: {
        padding: '14px 18px',
        margin: '12px 0',
        backgroundColor: 'var(--surface-bg, #ffffff)',
        borderLeft: '4px solid var(--primary-green, #10b981)',
        borderTop: '1px solid var(--border-subtle, #e2e8f0)',
        borderRight: '1px solid var(--border-subtle, #e2e8f0)',
        borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
        borderRadius: 'var(--radius-md, 8px)',
      },
    },
    h(
      'div',
      {
        className: 'lingora-example-text',
        style: {
          fontWeight: 600,
          fontSize: 'var(--font-size-body, 16px)',
          marginBottom: block.content?.translation ? '6px' : '0',
          color: 'var(--text-main, #1a241e)',
        },
      },
      block.content?.text || ''
    ),
    block.content?.translation
      ? h(
          'div',
          {
            className: 'lingora-example-translation',
            style: {
              color: 'var(--text-muted, #4a5b50)',
              fontSize: 'var(--font-size-sub, 14px)',
              fontStyle: 'italic',
            },
          },
          block.content.translation
        )
      : null
  );
}

function renderDialogueBlock(block: { content: DialogueContent }, key: string): React.ReactNode {
  return h(
    'div',
    {
      key,
      className: 'lingora-block lingora-block-dialogue',
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px 20px',
        backgroundColor: 'var(--surface-bg, #ffffff)',
        border: '1px solid var(--border-subtle, #e2e8f0)',
        borderRadius: 'var(--radius-md, 8px)',
        margin: '12px 0',
      },
    },
    (block.content?.lines || []).map((line, idx) =>
      h(
        'div',
        {
          key: `line-${idx}`,
          className: 'lingora-dialogue-turn',
          style: { display: 'flex', flexDirection: 'column', gap: '3px' },
        },
        h(
          'div',
          { style: { display: 'flex', gap: '10px', alignItems: 'baseline' } },
          h(
            'span',
            {
              className: 'lingora-dialogue-speaker',
              style: {
                fontWeight: 700,
                color: 'var(--primary-color, #2563eb)',
                minWidth: '80px',
              },
            },
            `${line.speaker}:`
          ),
          h(
            'span',
            {
              className: 'lingora-dialogue-text',
              style: { fontSize: 'var(--font-size-body, 16px)', color: 'var(--text-main, #1a241e)' },
            },
            line.text
          )
        ),
        line.translation
          ? h(
              'div',
              {
                className: 'lingora-dialogue-translation',
                style: {
                  marginLeft: '90px',
                  color: 'var(--text-muted, #4a5b50)',
                  fontSize: 'var(--font-size-sub, 14px)',
                  fontStyle: 'italic',
                },
              },
              `(${line.translation})`
            )
          : null
      )
    )
  );
}

function renderCalloutBlock(block: { content: CalloutContent }, key: string): React.ReactNode {
  const rawTone = (block.content?.tone || 'info').toLowerCase();
  let borderColor = '#3b82f6';
  let bgColor = '#eff6ff';
  let icon = 'ℹ️';

  if (rawTone === 'tip') {
    borderColor = '#10b981';
    bgColor = '#ecfdf5';
    icon = '💡';
  } else if (rawTone === 'warning' || rawTone === 'caution') {
    borderColor = '#f59e0b';
    bgColor = '#fffbeb';
    icon = '⚠️';
  } else if (rawTone === 'important') {
    borderColor = '#ef4444';
    bgColor = '#fef2f2';
    icon = '❗';
  }

  return h(
    'div',
    {
      key,
      className: `lingora-block lingora-block-callout lingora-callout-${rawTone}`,
      style: {
        padding: '16px 20px',
        margin: '14px 0',
        backgroundColor: bgColor,
        borderLeft: `4px solid ${borderColor}`,
        borderTop: '1px solid var(--border-subtle, #e2e8f0)',
        borderRight: '1px solid var(--border-subtle, #e2e8f0)',
        borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
        borderRadius: 'var(--radius-md, 8px)',
      },
    },
    block.content?.title
      ? h(
          'div',
          {
            className: 'lingora-callout-title',
            style: {
              fontWeight: 700,
              fontSize: '16px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            },
          },
          h('span', null, icon),
          h('span', null, block.content.title)
        )
      : null,
    h('div', { className: 'lingora-callout-body' }, renderDocumentNodes(block.content?.document?.nodes || []))
  );
}

function renderMediaBlock(
  block: { blockKey: string; content: MediaContent },
  key: string,
  audioErrors: Record<string, boolean>,
  onAudioError: (id: string) => void
): React.ReactNode {
  const errorKey = `media-${block.blockKey}`;
  const hasError = !!audioErrors[errorKey];

  return h(
    'div',
    {
      key,
      className: 'lingora-block lingora-block-media',
      style: {
        padding: '16px 20px',
        margin: '14px 0',
        backgroundColor: 'var(--surface-bg, #ffffff)',
        border: '1px solid var(--border-subtle, #e2e8f0)',
        borderRadius: 'var(--radius-md, 8px)',
      },
    },
    h('audio', {
      controls: true,
      src: block.content?.url,
      onError: () => onAudioError(errorKey),
      style: { width: '100%', maxWidth: '420px', display: 'block' },
    }),
    hasError
      ? h(
          'div',
          {
            id: `audioError-${block.blockKey}`,
            className: 'audio-error-box',
            role: 'alert',
            style: {
              marginTop: '8px',
              fontSize: 'var(--font-size-sub, 14px)',
              color: 'var(--danger-red, #ef4444)',
            },
          },
          'Không thể tải âm thanh. Vui lòng thử lại.'
        )
      : null,
    block.content?.caption
      ? h(
          'figcaption',
          {
            className: 'lingora-media-caption',
            style: {
              marginTop: '8px',
              fontSize: 'var(--font-size-sub, 14px)',
              color: 'var(--text-muted, #4a5b50)',
              fontStyle: 'italic',
            },
          },
          block.content.caption
        )
      : null
  );
}

function renderDividerBlock(key: string): React.ReactNode {
  return h('hr', {
    key,
    className: 'lingora-block lingora-block-divider',
    style: {
      border: 'none',
      borderTop: '1px solid var(--border-subtle, #e2e8f0)',
      margin: '24px 0',
    },
  });
}

function renderGrammarBlock(block: { content: GrammarContent }, key: string): React.ReactNode {
  return h(
    'div',
    {
      key,
      className: 'lingora-block lingora-block-grammar',
      style: {
        padding: '18px 20px',
        margin: '14px 0',
        backgroundColor: 'var(--surface-bg, #ffffff)',
        border: '1px solid var(--border-subtle, #e2e8f0)',
        borderRadius: 'var(--radius-md, 8px)',
      },
    },
    block.content?.title
      ? h(
          'h4',
          {
            className: 'lingora-grammar-title',
            style: {
              fontSize: '18px',
              fontWeight: 700,
              marginBottom: '10px',
              color: 'var(--primary-color, #2563eb)',
            },
          },
          block.content.title
        )
      : null,
    h(
      'p',
      {
        className: 'lingora-grammar-explanation',
        style: {
          fontSize: 'var(--font-size-body, 16px)',
          lineHeight: 1.6,
          marginBottom: '14px',
          color: 'var(--text-main, #1a241e)',
        },
      },
      block.content?.explanation || ''
    ),
    (block.content?.examples || []).length > 0
      ? h(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              borderTop: '1px dashed var(--border-subtle, #e2e8f0)',
              paddingTop: '12px',
            },
          },
          block.content.examples.map((ex, exIdx) =>
            h(
              'div',
              { key: `ex-${exIdx}`, style: { fontSize: 'var(--font-size-sub, 14px)' } },
              h('div', { style: { fontWeight: 600, color: 'var(--text-main, #1a241e)' } }, `• ${ex.text}`),
              ex.translation
                ? h(
                    'div',
                    { style: { color: 'var(--text-muted, #4a5b50)', fontStyle: 'italic', marginLeft: '14px' } },
                    ex.translation
                  )
                : null,
              ex.explanation
                ? h(
                    'div',
                    { style: { color: 'var(--text-muted, #4a5b50)', marginLeft: '14px', fontSize: '13px' } },
                    `(${ex.explanation})`
                  )
                : null
            )
          )
        )
      : null
  );
}

function renderUnsupportedBlock(
  block: UnsupportedBlockDto | { blockKey?: string; type: string; originalType?: string; message?: string },
  key: string
): React.ReactNode {
  const orig = (block as any).originalType || block.type || 'UNKNOWN';
  const msg = (block as any).message || 'Phiên bản hiển thị chưa hỗ trợ loại nội dung này.';
  return h(
    'div',
    {
      key,
      className: 'lingora-block lingora-block-unsupported',
      role: 'note',
      style: {
        padding: '14px 18px',
        margin: '12px 0',
        backgroundColor: '#fefce8',
        border: '1px dashed #ca8a04',
        borderRadius: 'var(--radius-md, 8px)',
        color: '#854d0e',
        fontSize: '14px',
        lineHeight: 1.5,
      },
    },
    h('strong', null, `[Khối nội dung không hỗ trợ: ${orig}] `),
    h('span', null, msg)
  );
}

function renderVocabularySection(
  vocabulary: PublicVocabularyDto[],
  locale = 'vi'
): React.ReactNode {
  if (!vocabulary || vocabulary.length === 0) return null;

  return h(
    'section',
    {
      id: 'vocabularySection',
      className: 'lesson-section lingora-vocab-section',
      style: { marginBottom: '24px' },
    },
    h(
      'h2',
      {
        style: {
          fontSize: 'var(--font-size-heading, 20px)',
          fontWeight: 700,
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
        },
      },
      `Từ vựng bài học (${vocabulary.length})`
    ),
    h(
      'div',
      {
        className: 'lingora-vocab-grid',
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '14px',
        },
      },
      vocabulary.map((v) => {
        const snap = v.displaySnapshot || ({} as any);
        const meaningVi = snap.meaningLabels?.vi || '';
        const meaningEn = snap.meaningLabels?.en || '';
        const meaningCustom = snap.meaningLabels?.[locale] || '';

        return h(
          'div',
          {
            key: v.id,
            className: 'vocab-card lingora-vocab-card',
            'data-vocab-id': v.id,
            style: {
              padding: '14px 16px',
              backgroundColor: 'var(--surface-bg, #ffffff)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              borderRadius: 'var(--radius-md, 8px)',
            },
          },
          h(
            'div',
            { style: { display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' } },
            h(
              'span',
              {
                style: {
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--primary-green, #10b981)',
                },
              },
              snap.canonicalForm || ''
            ),
            snap.phonetic
              ? h(
                  'span',
                  {
                    style: {
                      fontSize: 'var(--font-size-sub, 14px)',
                      color: 'var(--text-muted, #4a5b50)',
                    },
                  },
                  `/${snap.phonetic}/`
                )
              : null
          ),
          snap.partOfSpeech
            ? h(
                'div',
                { style: { marginBottom: '6px' } },
                h(
                  'span',
                  {
                    style: {
                      fontSize: 'var(--font-size-ref, 12px)',
                      fontStyle: 'italic',
                      color: 'var(--text-muted, #4a5b50)',
                    },
                  },
                  `(${snap.partOfSpeech})`
                )
              )
            : null,
          h(
            'div',
            { style: { fontSize: 'var(--font-size-body, 16px)', marginBottom: '4px' } },
            meaningCustom && locale !== 'vi' && locale !== 'en'
              ? h('div', null, meaningCustom)
              : null,
            meaningVi ? h('div', null, meaningVi) : null,
            meaningEn && meaningEn !== meaningVi
              ? h(
                  'div',
                  { style: { color: 'var(--text-muted, #4a5b50)', fontSize: 'var(--font-size-sub, 14px)' } },
                  meaningEn
                )
              : null
          ),
          snap.example
            ? h(
                'div',
                {
                  style: {
                    marginTop: '8px',
                    paddingTop: '6px',
                    borderTop: '1px dashed var(--border-subtle, #e2e8f0)',
                    fontSize: 'var(--font-size-sub, 14px)',
                    color: 'var(--text-muted, #4a5b50)',
                    fontStyle: 'italic',
                  },
                },
                `\u201C${snap.example}\u201D`
              )
            : null
        );
      })
    )
  );
}

function renderExercisesSection(
  exercises: PublicExerciseDto[],
  audioErrors: Record<string, boolean>,
  onAudioError: (id: string) => void
): React.ReactNode {
  if (!exercises || exercises.length === 0) return null;

  return h(
    'section',
    {
      id: 'exercisesSection',
      className: 'lesson-section lingora-exercises-section',
      style: { marginBottom: '24px' },
    },
    h(
      'h2',
      {
        style: {
          fontSize: 'var(--font-size-heading, 20px)',
          fontWeight: 700,
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
        },
      },
      `Bài tập đọc hiểu (${exercises.length})`
    ),
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '20px' } },
      exercises.map((ex) => {
        const promptData = (ex.promptData || {}) as Record<string, any>;
        const prompt = typeof promptData.prompt === 'string' ? promptData.prompt : '';
        const audioKey = `exercise-${ex.id}`;
        const hasAudioError = !!audioErrors[audioKey];

        return h(
          'div',
          {
            key: ex.id,
            className: 'exercise-card lingora-exercise-card',
            'data-exercise-id': ex.id,
            'data-exercise-type': ex.type,
            style: {
              padding: '18px 20px',
              backgroundColor: 'var(--surface-bg, #ffffff)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              borderRadius: 'var(--radius-md, 8px)',
            },
          },
          h(
            'div',
            {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              },
            },
            h('span', { style: { fontWeight: 600 } }, `Bài tập ${ex.position}: ${ex.type}`),
            h(
              'span',
              {
                className: 'badge badge-default',
                style: {
                  fontSize: 'var(--font-size-ref, 12px)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--canvas-bg, #fbfbf9)',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                },
              },
              'Chỉ đọc'
            )
          ),
          prompt
            ? h('p', { style: { marginBottom: '14px', fontSize: 'var(--font-size-body, 16px)' } }, prompt)
            : null,

          // MCQ
          ex.type === 'MCQ'
            ? h(
                'div',
                { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
                (Array.isArray(promptData.options) ? promptData.options : []).map((opt: any) =>
                  h(
                    'div',
                    {
                      key: opt.id,
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        border: '1px solid var(--border-subtle, #e2e8f0)',
                        borderRadius: 'var(--radius-sm, 6px)',
                        backgroundColor: 'var(--canvas-bg, #fbfbf9)',
                      },
                    },
                    h('input', {
                      type: 'radio',
                      disabled: true,
                      name: `mcq-${ex.id}`,
                      id: `opt-${ex.id}-${opt.id}`,
                    }),
                    h(
                      'label',
                      { htmlFor: `opt-${ex.id}-${opt.id}`, style: { cursor: 'default' } },
                      opt.text
                    )
                  )
                )
              )
            : null,

          // FILL_BLANK
          ex.type === 'FILL_BLANK'
            ? h(
                'div',
                {
                  style: {
                    padding: '12px 16px',
                    backgroundColor: 'var(--canvas-bg, #fbfbf9)',
                    borderRadius: 'var(--radius-sm, 6px)',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    fontSize: 'var(--font-size-body, 16px)',
                  },
                },
                typeof promptData.sentence === 'string'
                  ? promptData.sentence.replace('____', '[ ____________ ]')
                  : ''
              )
            : null,

          // REORDER
          ex.type === 'REORDER'
            ? h(
                'div',
                { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' } },
                (Array.isArray(promptData.tokens) ? promptData.tokens : []).map((t: any) =>
                  h(
                    'span',
                    {
                      key: t.id,
                      style: {
                        padding: '6px 12px',
                        backgroundColor: 'var(--canvas-bg, #fbfbf9)',
                        border: '1px solid var(--border-control, #cbd5e1)',
                        borderRadius: 'var(--radius-sm, 6px)',
                        fontWeight: 500,
                      },
                    },
                    t.text
                  )
                )
              )
            : null,

          // LISTENING
          ex.type === 'LISTENING'
            ? h(
                'div',
                { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
                promptData.audioUrl
                  ? h(
                      'div',
                      null,
                      h('audio', {
                        controls: true,
                        src: promptData.audioUrl,
                        onError: () => onAudioError(audioKey),
                        style: { width: '100%', maxWidth: '400px', display: 'block' },
                      }),
                      hasAudioError
                        ? h(
                            'div',
                            {
                              id: `audioError-${ex.id}`,
                              className: 'audio-error-box',
                              role: 'alert',
                              style: {
                                marginTop: '6px',
                                fontSize: 'var(--font-size-sub, 14px)',
                                color: 'var(--danger-red, #ef4444)',
                              },
                            },
                            'Không thể tải âm thanh. Vui lòng thử lại.'
                          )
                        : null
                    )
                  : null,
                h(
                  'div',
                  { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
                  (Array.isArray(promptData.options) ? promptData.options : []).map((opt: any) =>
                    h(
                      'div',
                      {
                        key: opt.id,
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          border: '1px solid var(--border-subtle, #e2e8f0)',
                          borderRadius: 'var(--radius-sm, 6px)',
                          backgroundColor: 'var(--canvas-bg, #fbfbf9)',
                        },
                      },
                      h('input', {
                        type: 'radio',
                        disabled: true,
                        name: `listening-${ex.id}`,
                        id: `opt-${ex.id}-${opt.id}`,
                      }),
                      h(
                        'label',
                        { htmlFor: `opt-${ex.id}-${opt.id}`, style: { cursor: 'default' } },
                        opt.text
                      )
                    )
                  )
                )
              )
            : null,

          // GRAMMAR
          ex.type === 'GRAMMAR'
            ? h(
                'div',
                { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
                promptData.sourceSentence
                  ? h(
                      'div',
                      {
                        style: {
                          padding: '10px 14px',
                          backgroundColor: 'var(--canvas-bg, #fbfbf9)',
                          borderRadius: 'var(--radius-sm, 6px)',
                          border: '1px solid var(--border-subtle, #e2e8f0)',
                        },
                      },
                      h('span', { style: { fontWeight: 600 } }, 'Câu gốc: '),
                      promptData.sourceSentence
                    )
                  : null,
                promptData.targetPattern
                  ? h(
                      'div',
                      {
                        style: {
                          padding: '10px 14px',
                          backgroundColor: 'var(--canvas-bg, #fbfbf9)',
                          borderRadius: 'var(--radius-sm, 6px)',
                          border: '1px solid var(--border-subtle, #e2e8f0)',
                        },
                      },
                      h('span', { style: { fontWeight: 600 } }, 'Cấu trúc mẫu: '),
                      promptData.targetPattern
                    )
                  : null
              )
            : null
        );
      })
    )
  );
}

export function LessonContent(props: LessonContentProps): React.ReactElement {
  const [audioErrors, setAudioErrors] = useState<Record<string, boolean>>({});

  const handleAudioError = (id: string) => {
    setAudioErrors((prev) => ({ ...prev, [id]: true }));
  };

  const presentation = props.presentation;
  const blocks = (Array.isArray(presentation?.blocks) ? [...presentation.blocks] : []).sort(
    (a, b) => a.position - b.position
  );
  const vocabulary = (
    Array.isArray(presentation?.vocabulary) ? [...presentation.vocabulary] : []
  ).sort((a, b) => a.position - b.position);
  const exercises = (
    Array.isArray(presentation?.exercises) ? [...presentation.exercises] : []
  ).sort((a, b) => a.position - b.position);

  const hasExplicitVocabBlock = blocks.some((b) => b.type === 'VOCABULARY');

  // Render content blocks
  const renderedBlocks: React.ReactNode[] = [];

  // Default section title if no heading is in blocks
  const hasHeading = blocks.some((b) => b.type === 'HEADING');
  if (!hasHeading && blocks.length > 0) {
    renderedBlocks.push(
      h(
        'h2',
        {
          key: 'default-heading',
          style: {
            fontSize: 'var(--font-size-heading, 20px)',
            fontWeight: 700,
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          },
        },
        'Bài đọc'
      )
    );
  }

  for (const block of blocks) {
    const key = `block-${block.blockKey || block.position}`;
    switch (block.type) {
      case 'HEADING':
        renderedBlocks.push(renderHeadingBlock(block as any, key));
        break;
      case 'TEXT':
        renderedBlocks.push(renderTextBlock(block as any, key));
        break;
      case 'EXAMPLE':
        renderedBlocks.push(renderExampleBlock(block as any, key));
        break;
      case 'DIALOGUE':
        renderedBlocks.push(renderDialogueBlock(block as any, key));
        break;
      case 'CALLOUT':
        renderedBlocks.push(renderCalloutBlock(block as any, key));
        break;
      case 'MEDIA':
        renderedBlocks.push(
          renderMediaBlock(block as any, key, audioErrors, handleAudioError)
        );
        break;
      case 'DIVIDER':
        renderedBlocks.push(renderDividerBlock(key));
        break;
      case 'GRAMMAR':
        renderedBlocks.push(renderGrammarBlock(block as any, key));
        break;
      case 'VOCABULARY':
        renderedBlocks.push(
          h(
            React.Fragment,
            { key },
            renderVocabularySection(vocabulary, props.locale)
          )
        );
        break;
      case 'UNSUPPORTED':
        renderedBlocks.push(renderUnsupportedBlock(block as any, key));
        break;
      default:
        renderedBlocks.push(renderUnsupportedBlock(block as any, key));
        break;
    }
  }

  return h(
    'div',
    {
      className: `lingora-lesson-content ${props.className || ''}`.trim(),
      style: { display: 'flex', flexDirection: 'column', gap: '32px' },
    },
    h(
      'section',
      {
        id: 'contentBlocksSection',
        className: 'lesson-section lingora-content-blocks',
        style: { display: 'flex', flexDirection: 'column', gap: '14px', minHeight: '1px' },
      },
      renderedBlocks
    ),
    !hasExplicitVocabBlock && vocabulary.length > 0
      ? renderVocabularySection(vocabulary, props.locale)
      : null,
    exercises.length > 0
      ? renderExercisesSection(exercises, audioErrors, handleAudioError)
      : null
  );
}
