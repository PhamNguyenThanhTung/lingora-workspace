'use client';

import React, { useEffect, useRef, useState } from 'react';
import { isSafeRichTextUrl } from '@lingora/lesson-content';
import type {
  LessonBlock,
  CalloutTone,
  CalloutContent,
  BoundedTextDocument,
  DialogueLine,
  GrammarExample,
  TextRun,
} from '@lingora/lesson-content';
import styles from './studio-styles';

interface TextDocumentEditorProps {
  document: BoundedTextDocument;
  idPrefix: string;
  label: string;
  disabled: boolean;
  onChange: (document: BoundedTextDocument) => void;
}

interface TextRunEditorProps {
  run: TextRun;
  id: string;
  disabled: boolean;
  onChange: (patch: Partial<TextRun>) => void;
}

function TextRunEditor({ run, id, disabled, onChange }: TextRunEditorProps) {
  const [linkUrl, setLinkUrl] = useState(run.link?.url || '');
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => setLinkUrl(run.link?.url || ''), [run.link?.url]);

  const applyLink = () => {
    if (!isSafeRichTextUrl(linkUrl)) {
      setLinkError('Nhập đường dẫn HTTP(S) hoặc đường dẫn tương đối an toàn.');
      return;
    }
    setLinkError(null);
    onChange({ link: { url: linkUrl, ...(run.link?.title ? { title: run.link.title } : {}) } });
  };

  return (
    <>
      <textarea
        id={id}
        className={styles.formTextarea}
        rows={2}
        value={run.text}
        disabled={disabled}
        maxLength={20000}
        onChange={(event) => onChange({ text: event.target.value })}
      />
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '5px' }}>
        <button type="button" className={styles.blockActionButton} aria-pressed={Boolean(run.bold)} disabled={disabled} onClick={() => onChange({ bold: !run.bold })}>
          Đậm
        </button>
        <button type="button" className={styles.blockActionButton} aria-pressed={Boolean(run.italic)} disabled={disabled} onClick={() => onChange({ italic: !run.italic })}>
          Nghiêng
        </button>
        <label className={styles.formLabel} htmlFor={`${id}-link`}>Liên kết</label>
        <input id={`${id}-link`} type="text" inputMode="url" className={styles.formInput} value={linkUrl} maxLength={2048} disabled={disabled} onChange={(event) => setLinkUrl(event.target.value)} style={{ flex: 1, minWidth: '180px' }} />
        <button type="button" className={styles.blockActionButton} disabled={disabled} onClick={applyLink}>
          Gắn link
        </button>
        {run.link && <button type="button" className={styles.blockActionButton} disabled={disabled} onClick={() => { setLinkUrl(''); onChange({ link: undefined }); }}>
          Bỏ link
        </button>}
      </div>
      {linkError && <div role="alert" style={{ color: '#b91c1c', fontSize: '12px' }}>{linkError}</div>}
    </>
  );
}

function TextDocumentEditor({ document, idPrefix, label, disabled, onChange }: TextDocumentEditorProps) {
  const safeDoc = document && Array.isArray(document.nodes) && document.nodes.length > 0
    ? document
    : { nodes: [{ type: 'paragraph' as const, runs: [{ text: '' }] }] };

  const updateRun = (
    nodeIndex: number,
    runIndex: number,
    patch: Partial<TextRun>,
    itemIndex?: number
  ) => {
    const nodes = safeDoc.nodes.map((node, currentNodeIndex) => {
      if (currentNodeIndex !== nodeIndex) return node;

      if (node.type === 'paragraph') {
        return {
          ...node,
          runs: node.runs.map((run, currentRunIndex) =>
            currentRunIndex === runIndex ? { ...run, ...patch } : run
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
                  currentRunIndex === runIndex ? { ...run, ...patch } : run
                ),
              }
        ),
      };
    });

    onChange({ ...safeDoc, nodes });
  };

  const convertParagraphToList = (nodeIndex: number) => {
    const nodes = safeDoc.nodes.map((node, index) => index !== nodeIndex || node.type !== 'paragraph'
      ? node
      : { type: 'list' as const, style: 'bullet' as const, items: [{ runs: node.runs }] });
    onChange({ ...safeDoc, nodes });
  };

  const toggleListStyle = (nodeIndex: number) => {
    const nodes = safeDoc.nodes.map((node, index) => index !== nodeIndex || node.type !== 'list'
      ? node
      : { ...node, style: node.style === 'bullet' ? 'ordered' as const : 'bullet' as const });
    onChange({ ...safeDoc, nodes });
  };

  const addListItem = (nodeIndex: number) => {
    const nodes = safeDoc.nodes.map((node, index) => index !== nodeIndex || node.type !== 'list'
      ? node
      : { ...node, items: [...node.items, { runs: [{ text: '' }] }] });
    onChange({ ...safeDoc, nodes });
  };

  const renderRuns = (
    runs: TextRun[],
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
        <TextRunEditor
          id={runId}
          run={run}
          disabled={disabled}
          onChange={(patch) => updateRun(nodeIndex, runIndex, patch, itemIndex)}
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
          <button type="button" className={styles.blockActionButton} disabled={disabled} onClick={() => convertParagraphToList(nodeIndex)}>
            Chuyển đoạn thành danh sách
          </button>
        </div>
      ) : (
        <div key={`${idPrefix}-list-${nodeIndex}`}>
          <button type="button" className={styles.blockActionButton} disabled={disabled} onClick={() => toggleListStyle(nodeIndex)}>
            {node.style === 'bullet' ? 'Đổi thành danh sách đánh số' : 'Đổi thành danh sách dấu đầu dòng'}
          </button>
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
          <button type="button" className={styles.blockActionButton} disabled={disabled || node.items.length >= 50} onClick={() => addListItem(nodeIndex)}>
            Thêm mục danh sách
          </button>
        </div>
      ))}
    </div>
  );
}

interface CharacterOption {
  id: string;
  languageId: string;
  glyph: string;
  scriptType: string;
  strokeCount: number;
  meaning: string | null;
  primaryReading: string | null;
  romanization: string | null;
  hasStrokes: boolean;
}

interface CharacterBlockEditorProps {
  block: any;
  onChange: (patch: Partial<any>) => void;
  disabled: boolean;
  lessonId?: string;
}

function CharacterBlockEditor({ block, onChange, disabled, lessonId }: CharacterBlockEditorProps) {
  const { blockKey, content, selectedLabel } = block;
  const characterId = content?.characterId || '';
  const showMeaning = content?.showMeaning ?? true;
  const showReading = content?.showReading ?? true;
  const showStrokeAnimation = content?.showStrokeAnimation ?? false;
  const guidedWriting = content?.guidedWriting ?? false;

  const [showPicker, setShowPicker] = useState(!characterId);
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<CharacterOption[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const activeControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
        activeControllerRef.current = null;
      }
    };
  }, []);

  const fetchOptions = async (query: string) => {
    if (!lessonId) return;

    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeControllerRef.current = controller;

    setIsSearching(true);
    setIsLoadingMore(false);
    setSearchError(null);
    setHasSearched(true);
    setSubmittedQuery(query);
    setSearchResults([]);
    setNextCursor(null);
    setHasMore(false);

    try {
      const res = await fetch(
        `/api/teacher/lessons/${lessonId}/character-options?q=${encodeURIComponent(query || '')}`,
        {
          headers: { Origin: window.location.origin },
          signal: controller.signal,
        }
      );

      if (activeControllerRef.current !== controller || controller.signal.aborted) {
        return;
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        if (activeControllerRef.current !== controller || controller.signal.aborted) {
          return;
        }
        setSearchError(json?.error?.message || 'Không thể tải danh sách ký tự.');
        setSearchResults([]);
        setNextCursor(null);
        setHasMore(false);
        return;
      }

      const json = await res.json();
      if (activeControllerRef.current !== controller || controller.signal.aborted) {
        return;
      }

      const items = Array.isArray(json.data) ? json.data : [];
      setSearchResults(items);
      const cursor = json.nextCursor ?? json.pagination?.nextCursor ?? null;
      setNextCursor(cursor);
      setHasMore(Boolean(json.hasMore ?? cursor ?? json.pagination?.hasMore));
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      if (activeControllerRef.current !== controller) {
        return;
      }
      setSearchError('Lỗi kết nối khi tải danh sách ký tự.');
      setSearchResults([]);
      setNextCursor(null);
      setHasMore(false);
    } finally {
      if (activeControllerRef.current === controller) {
        setIsSearching(false);
        activeControllerRef.current = null;
      }
    }
  };

  const fetchMoreOptions = async () => {
    if (!lessonId || !nextCursor || isLoadingMore || isSearching) return;

    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeControllerRef.current = controller;

    setIsLoadingMore(true);
    setSearchError(null);
    const queryToUse = submittedQuery;
    const cursorToUse = nextCursor;

    try {
      const res = await fetch(
        `/api/teacher/lessons/${lessonId}/character-options?q=${encodeURIComponent(queryToUse || '')}&cursor=${encodeURIComponent(cursorToUse)}`,
        {
          headers: { Origin: window.location.origin },
          signal: controller.signal,
        }
      );

      if (activeControllerRef.current !== controller || controller.signal.aborted) {
        return;
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        if (activeControllerRef.current !== controller || controller.signal.aborted) {
          return;
        }
        setSearchError(json?.error?.message || 'Không thể tải thêm ký tự.');
        return;
      }

      const json = await res.json();
      if (activeControllerRef.current !== controller || controller.signal.aborted) {
        return;
      }

      const newItems = Array.isArray(json.data) ? json.data : [];
      setSearchResults((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const filtered = newItems.filter((item: CharacterOption) => !existingIds.has(item.id));
        return [...prev, ...filtered];
      });
      const cursor = json.nextCursor ?? json.pagination?.nextCursor ?? null;
      setNextCursor(cursor);
      setHasMore(Boolean(json.hasMore ?? cursor ?? json.pagination?.hasMore));
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      if (activeControllerRef.current !== controller) {
        return;
      }
      setSearchError('Lỗi kết nối khi tải thêm ký tự.');
    } finally {
      if (activeControllerRef.current === controller) {
        setIsLoadingMore(false);
        activeControllerRef.current = null;
      }
    }
  };

  const handleOpenPicker = () => {
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
      activeControllerRef.current = null;
    }
    setShowPicker(true);
    setSearchQuery('');
    setSubmittedQuery('');
    setSearchResults([]);
    setNextCursor(null);
    setHasMore(false);
    setSearchError(null);
    setIsSearching(false);
    setIsLoadingMore(false);
    void fetchOptions('');
  };

  const handleClosePicker = () => {
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
      activeControllerRef.current = null;
    }
    setIsSearching(false);
    setIsLoadingMore(false);
    setShowPicker(false);
  };

  const handleSelectOption = (opt: CharacterOption) => {
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
      activeControllerRef.current = null;
    }
    setIsSearching(false);
    setIsLoadingMore(false);
    onChange({
      content: {
        ...content,
        characterId: opt.id,
      },
      selectedLabel: {
        glyph: opt.glyph,
        scriptType: opt.scriptType,
        strokeCount: opt.strokeCount,
        meaning: opt.meaning,
        primaryReading: opt.primaryReading,
        romanization: opt.romanization,
        hasStrokes: opt.hasStrokes,
      },
    });
    setShowPicker(false);
  };

  const updateFlag = (flagName: string, value: boolean) => {
    onChange({
      content: {
        ...content,
        [flagName]: value,
      },
      ...(selectedLabel ? { selectedLabel } : {}),
    });
  };

  const hasMissingStrokes = Boolean(
    selectedLabel &&
    selectedLabel.hasStrokes === false &&
    (showStrokeAnimation || guidedWriting)
  );

  return (
    <div className={styles.blockBody} id={`characterBlockBody-${blockKey}`}>
      {/* Selected character display or picker toggle */}
      {characterId && !showPicker ? (
        <div
          id={`character-selected-card-${blockKey}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          {selectedLabel ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  width: '64px',
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '2px solid #cbd5e1',
                  color: '#0f172a',
                }}
                aria-label={`Ký tự ${selectedLabel.glyph}`}
              >
                {selectedLabel.glyph}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '15px' }}>
                    {selectedLabel.scriptType}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>
                    ({selectedLabel.strokeCount} nét)
                  </span>
                  {selectedLabel.hasStrokes === true ? (
                    <span
                      id={`character-badge-strokes-${blockKey}`}
                      style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 600,
                      }}
                    >
                      ✓ Có dữ liệu nét
                    </span>
                  ) : selectedLabel.hasStrokes === false ? (
                    <span
                      id={`character-badge-nostrokes-${blockKey}`}
                      style={{
                        background: '#fef3c7',
                        color: '#b45309',
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 600,
                      }}
                    >
                      ⚠ Chưa có dữ liệu nét
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: '13px', color: '#334155', marginTop: '4px' }}>
                  <strong>Nghĩa:</strong> {selectedLabel.meaning || '(chưa có)'}
                </div>
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                  <strong>Cách đọc:</strong> {selectedLabel.primaryReading || selectedLabel.romanization || '(chưa có)'}
                </div>
              </div>
            </div>
          ) : (
            <span>Ký tự đã chọn</span>
          )}
          <button
            type="button"
            id={`character-change-btn-${blockKey}`}
            className={styles.blockActionButton}
            onClick={handleOpenPicker}
            disabled={disabled}
            style={{ padding: '6px 12px' }}
          >
            Đổi ký tự khác
          </button>
        </div>
      ) : null}

      {/* Character picker search & options list */}
      {(showPicker || !characterId) && (
        <div
          id={`character-picker-${blockKey}`}
          style={{
            padding: '12px',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            marginBottom: '12px',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
            Tra cứu và chọn ký tự từ danh mục khóa học:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              id={`character-search-input-${blockKey}`}
              type="text"
              className={styles.formInput}
              placeholder="Nhập chữ, nghĩa hoặc cách đọc (hoặc để trống tìm tất cả)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void fetchOptions(searchQuery);
                }
              }}
              disabled={disabled || isSearching}
              style={{ flex: 1, minWidth: '200px' }}
            />
            <button
              type="button"
              id={`character-search-btn-${blockKey}`}
              className={styles.blockActionButton}
              onClick={() => void fetchOptions(searchQuery)}
              disabled={disabled || isSearching}
              style={{ padding: '6px 14px' }}
            >
              {isSearching ? 'Đang tìm...' : 'Tìm kiếm'}
            </button>
            {characterId && (
              <button
                type="button"
                className={styles.blockActionButton}
                onClick={handleClosePicker}
                disabled={disabled}
              >
                Đóng
              </button>
            )}
          </div>

          {/* Pending State */}
          {isSearching && (
            <div id={`character-search-loading-${blockKey}`} style={{ color: '#64748b', fontSize: '13px', marginTop: '10px' }}>
              Đang tra cứu danh mục ký tự...
            </div>
          )}

          {/* Error State */}
          {searchError && (
            <div id={`character-search-error-${blockKey}`} role="alert" style={{ color: '#b91c1c', fontSize: '13px', marginTop: '10px' }}>
              {searchError}
            </div>
          )}

          {/* Empty State */}
          {hasSearched && !isSearching && searchResults.length === 0 && !searchError && (
            <div id={`character-search-empty-${blockKey}`} style={{ color: '#64748b', fontSize: '13px', marginTop: '10px' }}>
              Không tìm thấy ký tự phù hợp trong khóa học này.
            </div>
          )}

          {/* Results list */}
          {searchResults.length > 0 && !isSearching && (
            <div
              id={`character-search-results-${blockKey}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '8px',
                marginTop: '12px',
                maxHeight: '220px',
                overflowY: 'auto',
              }}
            >
              {searchResults.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  id={`character-option-${opt.id}`}
                  onClick={() => handleSelectOption(opt)}
                  disabled={disabled}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  aria-label={`Chọn ký tự ${opt.glyph} ${opt.meaning || ''}`}
                >
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>
                    {opt.glyph}
                  </span>
                  <div style={{ fontSize: '12px', overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                      {opt.scriptType} ({opt.strokeCount} nét)
                    </div>
                    {opt.meaning && (
                      <div style={{ color: '#475569', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {opt.meaning}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: opt.hasStrokes ? '#15803d' : '#b45309' }}>
                      {opt.hasStrokes ? '✓ Có nét' : '⚠ Thiếu nét'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Pagination: Load More Button */}
          {hasMore && nextCursor && !isSearching && (
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button
                type="button"
                id={`character-search-load-more-${blockKey}`}
                className={styles.blockActionButton}
                onClick={() => void fetchMoreOptions()}
                disabled={disabled || isLoadingMore}
                style={{ padding: '6px 16px', fontSize: '13px' }}
              >
                {isLoadingMore ? 'Đang tải thêm...' : 'Tải thêm ký tự'}
              </button>
            </div>
          )}

          {isLoadingMore && (
            <div
              id={`character-search-loading-more-${blockKey}`}
              style={{ color: '#64748b', fontSize: '12px', marginTop: '6px', textAlign: 'center' }}
            >
              Đang tải thêm các ký tự tiếp theo...
            </div>
          )}
        </div>
      )}

      {/* Unselected character notice */}
      {!characterId && (
        <div id={`character-unselected-warning-${blockKey}`} style={{ color: '#b91c1c', fontSize: '12px', marginBottom: '12px' }}>
          * Vui lòng chọn một ký tự để hoàn thành khối.
        </div>
      )}

      {/* The 4 Feature Flags */}
      <div
        id={`character-flags-${blockKey}`}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          padding: '12px',
          background: '#f8fafc',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
        }}
      >
        <label
          htmlFor={`character-flag-meaning-${blockKey}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: disabled ? 'default' : 'pointer' }}
        >
          <input
            type="checkbox"
            id={`character-flag-meaning-${blockKey}`}
            checked={Boolean(showMeaning)}
            onChange={(e) => updateFlag('showMeaning', e.target.checked)}
            disabled={disabled}
          />
          <span>Hiển thị nghĩa</span>
        </label>

        <label
          htmlFor={`character-flag-reading-${blockKey}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: disabled ? 'default' : 'pointer' }}
        >
          <input
            type="checkbox"
            id={`character-flag-reading-${blockKey}`}
            checked={Boolean(showReading)}
            onChange={(e) => updateFlag('showReading', e.target.checked)}
            disabled={disabled}
          />
          <span>Hiển thị cách đọc</span>
        </label>

        <label
          htmlFor={`character-flag-stroke-anim-${blockKey}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: disabled ? 'default' : 'pointer' }}
        >
          <input
            type="checkbox"
            id={`character-flag-stroke-anim-${blockKey}`}
            checked={Boolean(showStrokeAnimation)}
            onChange={(e) => updateFlag('showStrokeAnimation', e.target.checked)}
            disabled={disabled}
          />
          <span>Hoạt ảnh thứ tự nét</span>
        </label>

        <label
          htmlFor={`character-flag-guided-writing-${blockKey}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: disabled ? 'default' : 'pointer' }}
        >
          <input
            type="checkbox"
            id={`character-flag-guided-writing-${blockKey}`}
            checked={Boolean(guidedWriting)}
            onChange={(e) => updateFlag('guidedWriting', e.target.checked)}
            disabled={disabled}
          />
          <span>Luyện viết có hướng dẫn</span>
        </label>
      </div>

      {/* Warning when stroke-dependent flags are on but character lacks strokes */}
      {hasMissingStrokes && (
        <div
          id={`character-stroke-warning-${blockKey}`}
          role="alert"
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: '#fef3c7',
            color: '#92400e',
            borderRadius: '6px',
            fontSize: '13px',
            border: '1px solid #fde68a',
          }}
        >
          ⚠️ Ký tự &quot;{selectedLabel?.glyph}&quot; chưa có dữ liệu nét trong hệ thống. Server sẽ từ chối lưu bản nháp nếu bật Hoạt ảnh thứ tự nét hoặc Luyện viết có hướng dẫn.
        </div>
      )}
    </div>
  );
}

export interface BlockEditorProps {
  block: any;
  onChange: (patch: Partial<any>) => void;
  disabled?: boolean;
  lessonId?: string;
}

export function BlockEditor({ block, onChange, disabled = false, lessonId }: BlockEditorProps) {
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

    case 'CHARACTER': {
      return (
        <CharacterBlockEditor
          block={block}
          onChange={onChange}
          disabled={disabled}
          lessonId={lessonId}
        />
      );
    }

    default:
      return null;
  }
}
