import React from 'react';

/** Hiragana, katakana, CJK ideographs, half/full-width forms and CJK punctuation. */
const CJK_RUN = /([　-ヿ㐀-䶿一-鿿豈-﫿＀-￯]+)/;
const KANA = /[぀-ヿ]/;

/**
 * Renders admin-authored text verbatim, marking Japanese/Chinese runs with `lang` so screen readers
 * and font selection work (acceptance finding M4-F04). Kana always means Japanese; a Han-only run
 * follows the course's target language.
 */
export function LangText({ text, targetLanguage }: { text: string; targetLanguage?: string }) {
  if (!CJK_RUN.test(text)) return <>{text}</>;
  const target = (targetLanguage || '').toLowerCase();
  const hanLang = target === 'zh' || target === 'ko' ? target : 'ja';
  const lang = KANA.test(text) ? 'ja' : hanLang;
  return (
    <>
      {text.split(CJK_RUN).map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} lang={lang}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
