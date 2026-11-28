/**
 * Compact authoring format for the core EN / JA / ZH communication courses.
 *
 * Lessons are written as small tuples so a reviewer can read a whole lesson on one screen;
 * `build.ts` expands them into the canonical lesson blocks, vocabulary and exercise payloads
 * accepted by `saveTeacherLessonDraft` (same schemas the Teacher Studio uses).
 */

export type LanguageKey = 'en' | 'ja' | 'zh';

/** [word, reading, partOfSpeech, vietnameseMeaning, exampleSentence, exampleMeaning] */
export type VocabTuple = [
  word: string,
  /** IPA (en), kana + romaji (ja) or pinyin (zh). */
  reading: string,
  pos: string,
  vi: string,
  example: string,
  exampleVi: string,
];

/** [text, vietnameseMeaning, reading?] — reading is romaji (ja) or pinyin (zh). */
export type ExampleTuple = [text: string, vi: string, reading?: string];

/** [speaker, text, vietnameseMeaning, reading?] */
export type DialogueTuple = [speaker: string, text: string, vi: string, reading?: string];

export interface GrammarQuestion {
  /** Vietnamese instruction. */
  prompt: string;
  /** Sentence / cue shown to the learner. */
  source: string;
  /** Pattern the answer must follow. */
  pattern: string;
  /** Every accepted answer (graded after trim; case-insensitive for English). */
  answers: string[];
}

export interface LessonSpec {
  title: { vi: string; en: string };
  /** Vietnamese lead paragraph: situation + learning goal ("can-do"). */
  intro: string;
  /** 8–20 words/phrases. */
  vocab: VocabTuple[];
  grammar: { title: string; explain: string; examples: ExampleTuple[] };
  dialogue: { lines: DialogueTuple[] };
  /** Sentences split with "|" into tokens, plus a Vietnamese hint. */
  reorder: Array<[tokens: string, hintVi: string]>;
  grammarQ: GrammarQuestion[];
  tip: [title: string, text: string];
}

export interface UnitSpec {
  /** Level code inside the course framework (A1, N5, HSK1 …). */
  level: string;
  names: { vi: string; en: string };
  lessons: LessonSpec[];
}

export interface CourseSpec {
  key: LanguageKey;
  names: { vi: string; en: string };
  defaultLevel: string;
  units: UnitSpec[];
}
