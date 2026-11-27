/**
 * Shared language presentation helpers for Lingora (LNG-01, LNG-02, LNG-03).
 *
 * Used by both learner and admin surfaces so token joining, BCP-47 `lang`
 * attributes, and phonetic display formatting follow one deterministic rule
 * without changing token-ID/order grading semantics.
 */

const SUBTAG_RE = /^[A-Za-z0-9]{1,8}$/;
const PRIMARY_LANG_RE = /^[A-Za-z]{2,3}$/;
const SCRIPT_SUBTAG_RE = /^[A-Za-z]{4}$/;
const REGION_SUBTAG_RE = /^(?:[A-Za-z]{2}|\d{3})$/;

const CJK_OR_KANA_CHAR_RE =
  /[\u3005-\u3007\u3040-\u309F\u30A0-\u30FF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF65-\uFF9F]|\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u;

const CLOSING_PUNCT_START_RE =
  /^[\u3001\u3002\u3009\u300B\u300D\u300F\u3011\u3015\u3017\u3019\u301B\u30FB\uFF01\uFF09\uFF0C\uFF0E\uFF1A\uFF1B\uFF1F\uFF3D\uFF5D\uFF61\uFF63\uFF64.,!?;:)\]}»›”’"'…〜～]/u;

const OPENING_PUNCT_END_RE =
  /[\u3008\u300A\u300C\u300E\u3010\u3014\u3016\u3018\u301A(\[{«‹“‘]$/u;

const LATIN_OR_DIGIT_CHAR_RE = /[\p{Script=Latin}\p{Number}]/u;

// Japanese kana reading: hiragana, katakana (including full/half-width), 'ー', '・', and whitespace.
const JAPANESE_READING_RE = /^[\u3041-\u3096\u3099-\u309F\u30A1-\u30FF\uFF65-\uFF9F\s]+$/u;
// Romanization (romaji): Latin letters (including macrons/diacritics), hyphens, and whitespace.
const ROMANIZATION_RE = /^[\p{Script=Latin}\-\s]+$/u;

const SCRIPT_TYPE_FALLBACK_LANG: Record<string, string> = {
  HIRAGANA: 'ja',
  KATAKANA: 'ja',
  KANJI: 'ja',
  HANZI_SIMPLIFIED: 'zh-Hans',
  HANZI_TRADITIONAL: 'zh-Hant',
};

export interface ReorderTokenLike {
  id: string;
  text: string;
}

/**
 * Normalizes a language code into a canonical BCP-47 `lang` tag (e.g.
 * `ja_jp` -> `ja-JP`, `zh_hans` -> `zh-Hans`, `ja-x-lingora-1` -> `ja-x-lingora-1`).
 * Returns `undefined` when missing or invalid so React omits empty `lang` attributes.
 */
export function normalizeLanguageCode(code?: string | null): string | undefined {
  if (typeof code !== 'string') return undefined;
  const trimmed = code.trim().replace(/_/g, '-');
  if (!trimmed) return undefined;

  const parts = trimmed.split('-');
  if (!PRIMARY_LANG_RE.test(parts[0])) return undefined;

  const normalized: string[] = [parts[0].toLowerCase()];
  let inExtensionOrPrivate = false;

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (!SUBTAG_RE.test(part)) return undefined;

    if (part.length === 1) {
      inExtensionOrPrivate = true;
      normalized.push(part.toLowerCase());
      continue;
    }

    if (inExtensionOrPrivate) {
      normalized.push(part.toLowerCase());
    } else if (i === 1 && SCRIPT_SUBTAG_RE.test(part)) {
      normalized.push(part[0].toUpperCase() + part.slice(1).toLowerCase());
    } else if (REGION_SUBTAG_RE.test(part)) {
      normalized.push(part.toUpperCase());
    } else {
      normalized.push(part.toLowerCase());
    }
  }

  return normalized.join('-');
}

/**
 * Extracts the lowercase primary language subtag (e.g. `ja-JP` -> `ja`, `zh-Hans` -> `zh`).
 */
export function getBaseLanguageCode(code?: string | null): string | undefined {
  const normalized = normalizeLanguageCode(code);
  if (!normalized) return undefined;
  const dashIndex = normalized.indexOf('-');
  return dashIndex === -1 ? normalized : normalized.slice(0, dashIndex);
}

/**
 * Returns true when the language writes words without inter-word spaces (Japanese / Chinese).
 */
export function isNoSpaceLanguage(code?: string | null): boolean {
  const base = getBaseLanguageCode(code);
  return base === 'ja' || base === 'zh';
}

/**
 * Resolves the HTML `lang` attribute for foreign-language content.
 * Prefers the course/context `languageCode`; falls back to `scriptType` only when
 * `languageCode` is absent so non-Japanese characters are never forced to `ja`.
 */
export function resolveContentLang(options: {
  languageCode?: string | null;
  scriptType?: string | null;
}): string | undefined {
  const normalized = normalizeLanguageCode(options.languageCode);
  if (normalized) return normalized;

  if (typeof options.scriptType === 'string') {
    const key = options.scriptType.trim().toUpperCase();
    return SCRIPT_TYPE_FALLBACK_LANG[key];
  }

  return undefined;
}

function firstCodePoint(text: string): string {
  for (const ch of text) return ch;
  return '';
}

function lastCodePoint(text: string): string {
  const chars = Array.from(text);
  return chars.length > 0 ? chars[chars.length - 1] : '';
}

function shouldInsertSpace(prev: string, next: string, noSpaceLanguage: boolean): boolean {
  if (/\s$/u.test(prev) || /^\s/u.test(next)) {
    return false;
  }

  if (!noSpaceLanguage) {
    return true;
  }

  if (OPENING_PUNCT_END_RE.test(prev) || CLOSING_PUNCT_START_RE.test(next)) {
    return false;
  }

  const prevLast = lastCodePoint(prev);
  const nextFirst = firstCodePoint(next);

  // Drop renderer-added spaces whenever either side of the boundary is CJK or kana.
  if (CJK_OR_KANA_CHAR_RE.test(prevLast) || CJK_OR_KANA_CHAR_RE.test(nextFirst)) {
    return false;
  }

  // Keep meaningful spaces between adjacent Latin/numeric tokens inside ja/zh sentences.
  return LATIN_OR_DIGIT_CHAR_RE.test(nextFirst);
}

/**
 * Joins display tokens according to the target language without altering the
 * underlying token characters, casing, kana, or punctuation.
 */
export function joinTokensByLanguage(
  tokens: ReadonlyArray<string | null | undefined>,
  languageCode?: string | null
): string {
  const nonEmpty = tokens.filter((t): t is string => typeof t === 'string' && t.length > 0);
  if (nonEmpty.length === 0) return '';

  const noSpaceLanguage = isNoSpaceLanguage(languageCode);
  let result = nonEmpty[0];

  for (let i = 1; i < nonEmpty.length; i++) {
    const next = nonEmpty[i];
    if (shouldInsertSpace(result, next, noSpaceLanguage)) {
      result += ' ';
    }
    result += next;
  }

  return result;
}

/**
 * Maps ordered token IDs (including repeated IDs or missing token definitions)
 * to display text and joins them using `joinTokensByLanguage`.
 */
export function formatReorderTokens(
  tokenIds: ReadonlyArray<string> | null | undefined,
  tokens: ReadonlyArray<ReorderTokenLike> | null | undefined,
  languageCode?: string | null
): string {
  if (!Array.isArray(tokenIds) || tokenIds.length === 0) return '';

  const tokenMap = new Map<string, string>();
  if (Array.isArray(tokens)) {
    for (const token of tokens) {
      if (token && typeof token.id === 'string' && typeof token.text === 'string') {
        tokenMap.set(token.id, token.text);
      }
    }
  }

  const resolved = tokenIds.map((id) => tokenMap.get(id) ?? id);
  return joinTokensByLanguage(resolved, languageCode);
}

/**
 * Formats phonetic/reading text consistently across editor, preview, lesson,
 * WarmUp, and SRS without touching internal slashes or producing `//`.
 *
 * - For `ja` / `zh`: returns trimmed text as-is (no IPA `/.../` wrapping).
 * - For `en` / `fr` / default IPA: ensures exactly one wrapping `/.../` pair.
 * - For null/empty/slash-only values: returns `null`.
 */
export function formatPhonetic(
  phonetic?: string | null,
  languageCode?: string | null
): string | null {
  if (typeof phonetic !== 'string') return null;
  const trimmed = phonetic.trim();
  if (!trimmed) return null;

  if (isNoSpaceLanguage(languageCode)) {
    return trimmed;
  }

  const stripped = trimmed.replace(/^\/+|\/+$/g, '').trim();
  if (!stripped) return null;

  return `/${stripped}/`;
}

/**
 * Returns true when `value` (if non-empty after trim) contains only Japanese
 * kana (hiragana/katakana), `ー`, `・`, and whitespace.
 */
export function isValidJapaneseReading(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return JAPANESE_READING_RE.test(trimmed);
}

/**
 * Returns true when `value` (if non-empty after trim) contains only Latin
 * characters, hyphens, and whitespace.
 */
export function isValidRomanization(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return ROMANIZATION_RE.test(trimmed);
}

export interface FormattedReading {
  primary: string;
  romanization: string | null;
  text: string;
  source: 'reading' | 'romanization' | 'phonetic';
}

/**
 * Formats vocabulary reading/phonetic consistently across admin and learner UIs.
 * Prefers structured `reading` (with optional `romanization` beside it) and
 * falls back to `formatPhonetic(phonetic, languageCode)` for legacy entries.
 */
export function formatReading(options: {
  reading?: string | null;
  romanization?: string | null;
  phonetic?: string | null;
  languageCode?: string | null;
}): FormattedReading | null {
  const reading = typeof options.reading === 'string' ? options.reading.trim() : '';
  const romanization = typeof options.romanization === 'string' ? options.romanization.trim() : '';

  if (reading) {
    return {
      primary: reading,
      romanization: romanization || null,
      text: romanization ? `${reading} (${romanization})` : reading,
      source: 'reading',
    };
  }

  const formattedPhonetic = formatPhonetic(options.phonetic, options.languageCode);
  if (formattedPhonetic) {
    return {
      primary: formattedPhonetic,
      romanization: romanization || null,
      text: romanization ? `${formattedPhonetic} (${romanization})` : formattedPhonetic,
      source: 'phonetic',
    };
  }

  if (romanization) {
    return {
      primary: romanization,
      romanization: null,
      text: romanization,
      source: 'romanization',
    };
  }

  return null;
}
