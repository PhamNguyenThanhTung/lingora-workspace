/**
 * Client- and server-safe helpers for vocabulary candidate normalization (G16)
 * and audio reference URL validation (G9).
 *
 * Candidate matching is strictly advisory and scoped to a single language:
 * it never mutates persisted `normalizedForm` values and never merges
 * hiragana/katakana, kana/kanji, Japanese voiced marks (dakuten), or distinct senses.
 */

export function normalizeVocabularyTermKey(canonicalForm: string): string {
  return canonicalForm
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

const SINGLE_QUOTE_CHARS = /[\u2018\u2019\u201B\u02BC\u2032]/g;
const DOUBLE_QUOTE_CHARS = /[\u201C\u201D\u201E\u2033]/g;

/**
 * Normalizes NFC, whitespace, case, and curly/straight quotes for candidate lookup.
 */
export function normalizeVocabularyCandidateKey(term: string): string {
  return term
    .normalize('NFC')
    .replace(SINGLE_QUOTE_CHARS, "'")
    .replace(DOUBLE_QUOTE_CHARS, '"')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Strips combining diacritical marks ONLY from Latin script letters so French/English
 * accent variants (e.g., `café` vs `cafe`) can be suggested as candidates without
 * collapsing Japanese voiced kana marks (`が` = `か` + U+3099) or other scripts.
 */
export function stripLatinDiacritics(term: string): string {
  let out = '';
  let prevWasLatin = false;
  for (const ch of term.normalize('NFD')) {
    if (/\p{Mn}/u.test(ch)) {
      if (prevWasLatin) {
        continue;
      }
      out += ch;
      continue;
    }
    prevWasLatin = /\p{Script=Latin}/u.test(ch);
    out += ch;
  }
  return out.normalize('NFC');
}

/**
 * Builds a small deduplicated list of exact `normalizedForm` candidate strings
 * to query via an indexed `IN (...)` lookup without bulk-rewriting DB rows.
 */
export function buildVocabularyCandidateForms(rawTerm: string): string[] {
  const exact = normalizeVocabularyTermKey(rawTerm);
  const straight = normalizeVocabularyCandidateKey(rawTerm);
  const forms = new Set<string>();
  if (exact) forms.add(exact);
  if (straight) forms.add(straight);
  if (straight.includes("'")) {
    forms.add(straight.replace(/'/g, '\u2019'));
  }
  if (/\p{Script=Latin}/u.test(straight)) {
    const folded = stripLatinDiacritics(straight);
    if (folded) forms.add(folded);
  }
  return [...forms];
}

export type VocabularyCandidateMatchKind = 'exact' | 'variant' | 'diacritic';

/**
 * Classifies whether an existing vocabulary concept in the same language is a
 * duplicate/near-duplicate candidate for the queried/entered term.
 */
export function classifyVocabularyCandidateMatch(
  query: string,
  candidateCanonicalForm: string
): VocabularyCandidateMatchKind | null {
  const qExact = normalizeVocabularyTermKey(query);
  const cExact = normalizeVocabularyTermKey(candidateCanonicalForm);
  if (!qExact || !cExact) return null;
  if (qExact === cExact) return 'exact';

  const qCandidate = normalizeVocabularyCandidateKey(query);
  const cCandidate = normalizeVocabularyCandidateKey(candidateCanonicalForm);
  if (qCandidate === cCandidate) return 'variant';

  if (/\p{Script=Latin}/u.test(qCandidate) && /\p{Script=Latin}/u.test(cCandidate)) {
    if (stripLatinDiacritics(qCandidate) === stripLatinDiacritics(cCandidate)) {
      return 'diacritic';
    }
  }

  return null;
}

/**
 * Client- and server-safe validation for author-supplied HTTPS audio reference URLs.
 */
export function isValidAudioReferenceUrl(rawUrl: string): boolean {
  if (typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.username !== '' || parsed.password !== '') return false;
    if (parsed.search !== '' || parsed.searchParams.size > 0) return false;
    if (parsed.hash !== '') return false;
    if (parsed.port !== '' && parsed.port !== '443') return false;

    const hostname = parsed.hostname.toLowerCase();
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false;
    if (hostname.includes(':') || hostname.startsWith('[') || hostname.endsWith(']')) return false;
    if (!hostname.includes('.')) return false;

    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false;
    }

    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
