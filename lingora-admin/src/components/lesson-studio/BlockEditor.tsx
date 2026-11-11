'use client';

import React from 'react';
import type {
  LessonBlock,
  CalloutTone,
  CalloutContent,
  BoundedTextDocument,
  DialogueLine,
  GrammarExample,
} from '@lingora/lesson-content';
import styles from './studio-styles';

interface TextDocumentEditorProps {
  document: BoundedTextDocument;
  idPrefix: string;
  label: string;
  disabled: boolean;
  onChange: (document: BoundedTextDocument) => void;
}

function TextDocumentEditor({ document, idPrefix, label, disabled, onChange }: TextDocumentEditorProps) {
  const safeDoc = document && Array.isArray(document.nodes) && document.nodes.length > 0
    ? document
    : { nodes: [{ type: 'paragraph' as const, runs: [{ text: '' }] }] };

  const updateRun = (
    nodeIndex: number,
    runIndex: number,
    text: string,
    itemIndex?: number
  ) => {
    const nodes = safeDoc.nodes.map((node, currentNodeIndex) => {
      if (currentNodeIndex !== nodeIndex) return node;

      if (node.type === 'paragraph') {
        return {
          ...node,
          runs: node.runs.map((run, currentRunIndex) =>
            currentRunIndex === runIndex ? { ...run, text } : run
          ),
        };
      }

      return {
        ...node,
        items: node.items.map((item, currentItemIndex) =>
          currentItemIndex !== itemIndex
            ? item
            : {
                ...item,
                runs: item.runs.map((run, currentRunIndex) =>
                  currentRunIndex === runIndex ? { ...run, text } : run
                ),
              }
        ),
      };
    });

    onChange({ ...safeDoc, nodes });
  };

  const renderRuns = (
    runs: Array<{ text: string }>,
    nodeIndex: number,
    itemIndex?: number
  ) => runs.map((run, runIndex) => {
    const runId = `${idPrefix}-${nodeIndex}-${itemIndex ?? 'p'}-${runIndex}`;
    const location = itemIndex === undefined
      ? `Đoạn ${nodeIndex + 1}`
      : `Danh sách ${nodeIndex + 1}, mục ${itemIndex + 1}`;

    return (
      <div className={styles.formGroup} key={runId}>
        <label className={styles.formLabel} htmlFor={runId}>
          {location}, phần văn bản {runIndex + 1}
        </label>
        <textarea
          id={runId}
          className={styles.formTextarea}
          rows={2}
          value={run.text}
          disabled={disabled}
          maxLength={20000}
          onChange={(event) => updateRun(nodeIndex, runIndex, event.target.value, itemIndex)}
        />
      </div>
    );
  });

  return (
    <div className={styles.formGroup}>
      <span className={styles.formLabel}>{label}</span>
      {safeDoc.nodes.map((node, nodeIndex) => node.type === 'paragraph' ? (
        <div key={`${idPrefix}-paragraph-${nodeIndex}`}>
          {renderRuns(node.runs, nodeIndex)}
        </div>
      ) : (
        <div key={`${idPrefix}-list-${nodeIndex}`}>
          {node.items.map((item, itemIndex) => (
            <div
              key={`${idPrefix}-list-${nodeIndex}-item-${itemIndex}`}
              style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}
            >
              <span aria-hidden="true" style={{ paddingTop: '8px' }}>
                {node.style === 'ordered' ? `${itemIndex + 1}.` : '•'}
              </span>
              <div style={{ flex: 1 }}>{renderRuns(item.runs, nodeIndex, itemIndex)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export interface BlockEditorProps {
  block: LessonBlock;
  onChange: (patch: Partial<LessonBlock>) => void;
  disabled?: boolean;
}

export function BlockEditor({ block, onChange, disabled = false }: BlockEditorProps) {
  const { type, content, blockKey } = block;

  switch (type) {
    case 'HEADING': {
      const headingContent = content as { level: 2 | 3 | 4; text: string };
      return (
        <div className={styles.blockBody}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor={`headingLevel-${blockKey}`}>
                Cấp độ
              </label>
              <select
                id={`headingLevel-${blockKey}`}
                className={styles.formSelect}
                value={headingContent.level || 2}
                disabled={disabled}
                onChange={(e) => {
                  const level = Number(e.target.value) as 2 | 3 | 4;
                  onChange({
                    content: { ...headingContent, level },
                  });
                }}
              >
                <option value={2}>H2 (Mục lớn)</option>
                <option value={3}>H3 (Mục con)</option>
                <option value={4}>H4 (Tiểu mục)</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor={`headingText-${blockKey}`}>
                Nội dung tiêu đề
              </label>
              <input
                id={`headingText-${blockKey}`}
                type="text"
                className={styles.formInput}
                value={headingContent.text || ''}
                disabled={disabled}
                placeholder="Nhập tiêu đề..."
                maxLength={500}
                onChange={(e) => {
                  onChange({
                    content: { ...headingContent, text: e.target.value },
                  });
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    case 'TEXT': {
      const textContent = content as BoundedTextDocument;
      return (
        <div className={styles.blockBody}>
          <TextDocumentEditor
            document={textContent}
            idPrefix={`textContent-${blockKey}`}
            label="Nội dung văn bản"
            disabled={disabled}
            onChange={(document) => onChange({ content: document })}
          />
        </div>
      );
    }

    case 'EXAMPLE': {
      const exampleContent = content as { text: string; translation?: string | null };
      return (
        <div className={styles.blockBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor={`exampleText-${blockKey}`}>
              Câu ví dụ (Ngôn ngữ đang học)
            </label>
            <input
              id={`exampleText-${blockKey}`}
              type="text"
              className={styles.formInput}
              value={exampleContent.text || ''}
              disabled={disabled}
              placeholder="Nhập câu ví dụ..."
              maxLength={2000}
              onChange={(e) => {
                onChange({
                  content: { ...exampleContent, text: e.target.value },
                });
              }}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor={`exampleTranslation-${blockKey}`}>
              Bản dịch tiếng Việt (tùy chọn)
            </label>
            <input
              id={`exampleTranslation-${blockKey}`}
              type="text"
              className={styles.formInput}
              value={exampleContent.translation || ''}
              disabled={disabled}
              placeholder="Nhập bản dịch..."
              maxLength={2000}
              onChange={(e) => {
                onChange({
                  content: { ...exampleContent, translation: e.target.value || null },
                });
              }}
            />
          </div>
        </div>
      );
    }

    case 'DIALOGUE': {
      const dialogueContent = content as { lines: DialogueLine[] };
      const lines = dialogueContent.lines || [];

      const handleLineChange = (
        index: number,
        field: keyof DialogueLine,
        value: string
      ) => {
        const nextLines = lines.map((l, idx) => {
          if (idx !== index) return l;
          return { ...l, [field]: value };
        });
        onChange({ content: { lines: nextLines } });
      };

      const handleAddLine = () => {
        const nextLines: DialogueLine[] = [
          ...lines,
          {
            speaker: lines.length % 2 === 0 ? 'A' : 'B',
            text: '',
            translation: '',
          },
        ];
        onChange({ content: { lines: nextLines } });
      };

      const handleRemoveLine = (index: number) => {
        if (lines.length <= 1) return; // Giữ ít nhất 1 dòng
        const nextLines = lines.filter((_, idx) => idx !== index);
        onChange({ content: { lines: nextLines } });
      };

      return (
        <div className={styles.blockBody}>
          <div className={styles.formLabel}>Danh sách lượt thoại hội thoại</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {lines.map((line, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 1fr 1fr 32px',
                  gap: '8px',
                  alignItems: 'center',
                  background: '#f8fafc',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <input
                  type="text"
                  className={styles.formInput}
                  value={line.speaker}
                  disabled={disabled}
                  placeholder="Người nói"
                  maxLength={100}
                  onChange={(e) => handleLineChange(idx, 'speaker', e.target.value)}
                />
                <input
                  type="text"
                  className={styles.formInput}
                  value={line.text}
                  disabled={disabled}
                  placeholder="Lời thoại..."
                  maxLength={2000}
                  onChange={(e) => handleLineChange(idx, 'text', e.target.value)}
                />
                <input
                  type="text"
                  className={styles.formInput}
                  value={line.translation || ''}
                  disabled={disabled}
                  placeholder="Bản dịch..."
                  maxLength={2000}
                  onChange={(e) => handleLineChange(idx, 'translation', e.target.value)}
                />
                <button
                  type="button"
                  className={styles.blockActionButton}
                  style={{ color: '#ef4444' }}
                  onClick={() => handleRemoveLine(idx)}
                  disabled={disabled || lines.length <= 1}
                  title="Xóa lượt thoại"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={styles.addBlockBtn}
            style={{ marginTop: '10px', fontSize: '12px' }}
            onClick={handleAddLine}
            disabled={disabled || lines.length >= 50}
          >
            + Thêm lượt thoại
          </button>
        </div>
      );
    }

    case 'CALLOUT': {
      const calloutContent = content as CalloutContent;

      return (
        <div className={styles.blockBody}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor={`calloutTone-${blockKey}`}>
                Sắc thái (Tone)
              </label>
              <select
                id={`calloutTone-${blockKey}`}
                className={styles.formSelect}
                value={(calloutContent.tone || 'info').toLowerCase()}
                disabled={disabled}
                onChange={(e) => {
                  onChange({
                    content: {
                      ...calloutContent,
                      tone: e.target.value as CalloutTone,
                    },
                  });
                }}
              >
                <option value="info">Info (Thông tin)</option>
                <option value="tip">Tip (Mẹo nhỏ)</option>
                <option value="warning">Warning (Cảnh báo)</option>
                <option value="caution">Caution (Cẩn trọng)</option>
                <option value="important">Important (Quan trọng)</option>
                <option value="note">Note (Ghi chú)</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor={`calloutTitle-${blockKey}`}>
                Tiêu đề ghi chú (tùy chọn)
              </label>
              <input
                id={`calloutTitle-${blockKey}`}
                type="text"
                className={styles.formInput}
                value={calloutContent.title || ''}
                disabled={disabled}
                placeholder="Ví dụ: Lưu ý cách dùng..."
                maxLength={500}
                onChange={(e) => {
                  onChange({
                    content: {
                      ...calloutContent,
                      title: e.target.value || null,
                    },
                  });
                }}
              />
            </div>
          </div>
          <TextDocumentEditor
            document={calloutContent.document}
            idPrefix={`calloutText-${blockKey}`}
            label="Nội dung ghi chú"
            disabled={disabled}
            onChange={(document) => onChange({
              content: { ...calloutContent, document },
            })}
          />
        </div>
      );
    }

    case 'MEDIA': {
      const mediaContent = content as { kind: 'audio'; url: string; caption?: string | null };
      return (
        <div className={styles.blockBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor={`mediaUrl-${blockKey}`}>
              Đường dẫn âm thanh (HTTPS Audio URL)
            </label>
            <input
              id={`mediaUrl-${blockKey}`}
              type="url"
              className={styles.formInput}
              value={mediaContent.url || ''}
              disabled={disabled}
              placeholder="https://cdn.example.com/audio/sample.mp3"
              maxLength={2048}
              onChange={(e) => {
                onChange({
                  content: { ...mediaContent, kind: 'audio', url: e.target.value },
                });
              }}
            />
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Yêu cầu HTTPS với tên miền công khai, tệp audio .mp3/.wav/.m4a trực tiếp.
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor={`mediaCaption-${blockKey}`}>
              Chú thích âm thanh (tùy chọn)
            </label>
            <input
              id={`mediaCaption-${blockKey}`}
              type="text"
              className={styles.formInput}
              value={mediaContent.caption || ''}
              disabled={disabled}
              placeholder="Ví dụ: Phát âm giọng chuẩn bản xứ..."
              maxLength={500}
              onChange={(e) => {
                onChange({
                  content: { ...mediaContent, caption: e.target.value || null },
                });
              }}
            />
          </div>
        </div>
      );
    }

    case 'GRAMMAR': {
      const grammarContent = content as {
        title?: string | null;
        explanation: string;
        examples: GrammarExample[];
      };
      const examples = grammarContent.examples || [];

      const handleExampleChange = (
        index: number,
        field: keyof GrammarExample,
        value: string
      ) => {
        const nextExamples = examples.map((ex, idx) => {
          if (idx !== index) return ex;
          return { ...ex, [field]: value };
        });
        onChange({ content: { ...grammarContent, examples: nextExamples } });
      };

      const handleAddExample = () => {
        const nextExamples: GrammarExample[] = [
          ...examples,
          { text: '', translation: '', explanation: '' },
        ];
        onChange({ content: { ...grammarContent, examples: nextExamples } });
      };

      const handleRemoveExample = (index: number) => {
        if (examples.length <= 1) return;
        const nextExamples = examples.filter((_, idx) => idx !== index);
        onChange({ content: { ...grammarContent, examples: nextExamples } });
      };

      return (
        <div className={styles.blockBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor={`grammarTitle-${blockKey}`}>
              Tiêu đề điểm ngữ pháp (tùy chọn)
            </label>
            <input
              id={`grammarTitle-${blockKey}`}
              type="text"
              className={styles.formInput}
              value={grammarContent.title || ''}
              disabled={disabled}
              placeholder="Ví dụ: Thì Hiện Tại Đơn (Present Simple)"
              maxLength={500}
              onChange={(e) => {
                onChange({
                  content: { ...grammarContent, title: e.target.value || null },
                });
              }}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor={`grammarExplanation-${blockKey}`}>
              Giải thích cấu trúc và ngữ pháp
            </label>
            <textarea
              id={`grammarExplanation-${blockKey}`}
              className={styles.formTextarea}
              rows={3}
              value={grammarContent.explanation || ''}
              disabled={disabled}
              placeholder="Giải thích cách dùng, công thức và dấu hiệu nhận biết..."
              maxLength={4000}
              onChange={(e) => {
                onChange({
                  content: { ...grammarContent, explanation: e.target.value },
                });
              }}
            />
          </div>
          <div className={styles.formLabel}>Các câu ví dụ ngữ pháp</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {examples.map((ex, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 32px',
                  gap: '8px',
                  alignItems: 'center',
                  background: '#f8fafc',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <input
                  type="text"
                  className={styles.formInput}
                  value={ex.text}
                  disabled={disabled}
                  placeholder="Câu ví dụ..."
                  maxLength={2000}
                  onChange={(e) => handleExampleChange(idx, 'text', e.target.value)}
                />
                <input
                  type="text"
                  className={styles.formInput}
                  value={ex.translation || ''}
                  disabled={disabled}
                  placeholder="Dịch nghĩa..."
                  maxLength={2000}
                  onChange={(e) => handleExampleChange(idx, 'translation', e.target.value)}
                />
                <button
                  type="button"
                  className={styles.blockActionButton}
                  style={{ color: '#ef4444' }}
                  onClick={() => handleRemoveExample(idx)}
                  disabled={disabled || examples.length <= 1}
                  title="Xóa ví dụ"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={styles.addBlockBtn}
            style={{ marginTop: '10px', fontSize: '12px' }}
            onClick={handleAddExample}
            disabled={disabled || examples.length >= 20}
          >
            + Thêm ví dụ ngữ pháp
          </button>
        </div>
      );
    }

    case 'DIVIDER': {
      return (
        <div className={styles.blockBody} style={{ textAlign: 'center', padding: '16px' }}>
          <div style={{ height: '1px', background: '#cbd5e1', margin: '8px 0' }} />
          <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
            — Đường phân cách trực quan giữa các phần —
          </span>
        </div>
      );
    }

    case 'VOCABULARY': {
      return (
        <div className={styles.blockBody}>
          <div
            style={{
              padding: '12px',
              background: '#fefce8',
              border: '1px solid #fef08a',
              borderRadius: '6px',
              color: '#854d0e',
              fontSize: '13px',
            }}
          >
            <strong>Khối Từ Vựng:</strong> Tự động hiển thị danh sách các từ vựng được liên kết
            trong bài học này theo vị trí của khối trong luồng bài học.
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
