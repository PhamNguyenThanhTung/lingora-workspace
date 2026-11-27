'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WritingPracticeModal } from '../learn/[contextId]/[lessonId]/WritingPracticeModal.tsx';
import type { FreePracticeCharacterDto } from '../../server/writing/free-practice-service.ts';

const SCRIPT_LABELS: Record<string, string> = {
  HIRAGANA: 'Hiragana',
  KATAKANA: 'Katakana',
  KANJI: 'Kanji',
  HANZI_SIMPLIFIED: 'Hán tự giản thể',
  HANZI_TRADITIONAL: 'Hán tự phồn thể',
};

function bandColor(score: number | null): string {
  if (score == null) return 'var(--color-border, #d0d5dd)';
  if (score >= 85) return '#2e7d32';
  if (score >= 60) return '#b26a00';
  return '#c62828';
}

export function WriteHub({ contextId, characters }: { contextId: string; characters: FreePracticeCharacterDto[] }) {
  const router = useRouter();
  const scripts = useMemo(() => Array.from(new Set(characters.map((c) => c.scriptType))), [characters]);
  const [script, setScript] = useState<string>(scripts[0] ?? '');
  const [active, setActive] = useState<FreePracticeCharacterDto | null>(null);

  const visible = characters.filter((c) => c.scriptType === script);
  const practised = characters.filter((c) => c.attempts > 0).length;

  return (
    <div id="writeView">
      <h1 style={{ fontSize: 'var(--font-size-title)', fontWeight: 800, marginBottom: 6 }}>Luyện viết</h1>
      <p style={{ marginBottom: 14 }}>
        Chọn một chữ để xem thứ tự nét, tô theo nét mờ rồi tự viết lại. Đã luyện {practised}/{characters.length} chữ.
      </p>

      <div role="tablist" aria-label="Loại chữ" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {scripts.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={s === script}
            className={s === script ? 'btn btn-primary' : 'btn'}
            onClick={() => setScript(s)}
          >
            {SCRIPT_LABELS[s] ?? s} ({characters.filter((c) => c.scriptType === s).length})
          </button>
        ))}
      </div>

      <ul
        aria-label={SCRIPT_LABELS[script] ?? script}
        style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 10 }}
      >
        {visible.map((c) => (
          <li key={c.characterId}>
            <button
              type="button"
              onClick={() => setActive(c)}
              aria-label={`Luyện viết ${c.glyph}${c.romanization ? ` (${c.romanization})` : ''}${c.bestScore != null ? `, điểm cao nhất ${c.bestScore}` : ', chưa luyện'}`}
              style={{
                width: '100%',
                padding: '10px 6px',
                borderRadius: 12,
                border: `2px solid ${bandColor(c.bestScore)}`,
                background: 'var(--color-surface, #fff)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <span lang={script.startsWith('HANZI') ? 'zh' : 'ja'} style={{ fontSize: 34, lineHeight: 1.1 }}>{c.glyph}</span>
              <span style={{ fontSize: 12 }}>{c.reading || c.romanization || c.meaning || ''}</span>
              <span style={{ fontSize: 11, opacity: 0.75 }}>{c.bestScore != null ? `${c.bestScore} điểm` : `${c.strokeCount} nét`}</span>
            </button>
          </li>
        ))}
      </ul>

      {active && (
        <WritingPracticeModal
          contextId={contextId}
          character={{
            characterId: active.characterId,
            glyph: active.glyph,
            scriptType: active.scriptType,
            strokeCount: active.strokeCount,
            meaning: active.meaning ?? undefined,
            primaryReading: active.reading ?? undefined,
            romanization: active.romanization ?? undefined,
            showStrokeAnimation: true,
            guidedWriting: true,
          }}
          onClose={() => {
            setActive(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
