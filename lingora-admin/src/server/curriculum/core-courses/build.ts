import type { LanguageKey, LessonSpec, VocabTuple } from './types.ts';

type Block = Record<string, unknown>;

const KEY_LABEL: Record<LanguageKey, string> = { en: 'tiếng Anh', ja: 'tiếng Nhật', zh: 'tiếng Trung' };

function para(text: string) {
  return { nodes: [{ type: 'paragraph' as const, runs: [{ text }] }] };
}

/** "pinyin — nghĩa" so the learner always sees the reading next to the Vietnamese meaning. */
function withReading(vi: string, reading?: string): string {
  return reading ? `${reading} — ${vi}` : vi;
}

export function buildBlocks(lang: LanguageKey, lessonKey: string, lesson: LessonSpec): Block[] {
  const blocks: Omit<Block, 'position' | 'schemaVersion'>[] = [];
  const add = (suffix: string, type: string, content: unknown) =>
    blocks.push({ blockKey: `${lessonKey}-${suffix}`, type, content });

  add('h-main', 'HEADING', { level: 2, text: lesson.title.vi });
  add('intro', 'TEXT', para(lesson.intro));
  add('h-vocab', 'HEADING', { level: 3, text: `Từ vựng ${KEY_LABEL[lang]}` });
  add('vocab', 'VOCABULARY', { selection: 'lesson' });
  add('h-grammar', 'HEADING', { level: 3, text: 'Mẫu câu và ngữ pháp' });
  add('grammar', 'GRAMMAR', {
    title: lesson.grammar.title,
    explanation: lesson.grammar.explain,
    examples: lesson.grammar.examples.map(([text, vi, reading]) => ({ text, translation: withReading(vi, reading) })),
  });
  add('h-dialogue', 'HEADING', { level: 3, text: 'Hội thoại mẫu' });
  add('dialogue', 'DIALOGUE', {
    lines: lesson.dialogue.lines.map(([speaker, text, vi, reading]) => ({ speaker, text, translation: withReading(vi, reading) })),
  });
  add('tip', 'CALLOUT', { tone: 'tip', title: lesson.tip[0], document: para(lesson.tip[1]) });
  add('end', 'DIVIDER', {});

  return blocks.map((b, i) => ({ ...b, position: i + 1, schemaVersion: 1 }));
}

function slug(text: string): string {
  return text
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export function buildVocabulary(vocab: VocabTuple[]) {
  return vocab.map(([word, reading, pos, vi, example], i) => ({
    position: i + 1,
    isCore: true,
    create: {
      canonicalForm: word,
      senseKey: pos,
      phonetic: reading,
      partOfSpeech: pos,
      meaningLabels: { vi },
      example,
    },
  }));
}

/** Deterministic rotation so distractors and answer positions are stable between runs. */
function pickDistractors<T>(pool: T[], correctIndex: number, count: number, salt: number): T[] {
  const out: T[] = [];
  for (let step = 1; out.length < count && step <= pool.length; step++) {
    const candidate = pool[(correctIndex + step * (salt % 2 === 0 ? 1 : 2) + salt) % pool.length];
    if (pool.indexOf(candidate) !== correctIndex && !out.includes(candidate)) out.push(candidate);
  }
  return out;
}

function shuffleStable<T>(items: T[], salt: number): T[] {
  const arr = [...items];
  const shift = salt % arr.length;
  return [...arr.slice(shift), ...arr.slice(0, shift)];
}

function label(word: string, reading: string, lang: LanguageKey): string {
  return lang === 'en' || !reading ? `“${word}”` : `“${word}” (${reading})`;
}

export function buildExercises(lang: LanguageKey, lessonKey: string, lessonIndex: number, lesson: LessonSpec) {
  const v = lesson.vocab;
  const exercises: Array<Record<string, unknown>> = [];
  const push = (e: Record<string, unknown>) => exercises.push({ position: exercises.length + 1, isCore: true, ...e });

  const meaningDetail = (i: number) => `${v[i][4]} — ${v[i][5]}`;

  // 1) Word → meaning (four words spread across the vocabulary list).
  [0, 2, 4, 6].filter((i) => i < v.length).forEach((i, n) => {
    const wrong = pickDistractors(v.map((x) => x[3]), i, 2, lessonIndex + n).filter((t) => t !== v[i][3]);
    const opts = shuffleStable([{ t: v[i][3], ok: true }, ...wrong.map((t) => ({ t, ok: false }))], lessonIndex + n);
    const options = opts.map((o, k) => ({ id: `o${k + 1}`, text: o.t }));
    push({
      type: 'MCQ',
      promptData: { prompt: `${label(v[i][0], v[i][1], lang)} nghĩa là gì?`, options },
      gradingData: { correctOptionId: options[opts.findIndex((o) => o.ok)].id },
      feedbackData: { explanation: `${label(v[i][0], v[i][1], lang)} nghĩa là “${v[i][3]}”. Ví dụ: ${meaningDetail(i)}` },
    });
  });

  // 2) Meaning → word (two words).
  [1, 5].filter((i) => i < v.length).forEach((i, n) => {
    const wrong = pickDistractors(v.map((x) => x[0]), i, 2, lessonIndex + n + 1).filter((t) => t !== v[i][0]);
    const opts = shuffleStable([{ t: v[i][0], ok: true }, ...wrong.map((t) => ({ t, ok: false }))], lessonIndex + n + 1);
    const options = opts.map((o, k) => ({ id: `o${k + 1}`, text: o.t }));
    push({
      type: 'MCQ',
      promptData: { prompt: `Từ ${KEY_LABEL[lang]} nào có nghĩa là “${v[i][3]}”?`, options },
      gradingData: { correctOptionId: options[opts.findIndex((o) => o.ok)].id },
      feedbackData: { explanation: `“${v[i][3]}” là ${label(v[i][0], v[i][1], lang)}. Ví dụ: ${meaningDetail(i)}` },
    });
  });

  // 3) Fill in the blank from vocabulary example sentences that contain the word exactly once.
  let fills = 0;
  for (let n = 0; n < v.length && fills < 2; n++) {
    const i = (n * 3 + 1) % v.length;
    const [word, reading, , vi, example, exampleVi] = v[i];
    if (example.split(word).length !== 2 || word.length < 1) continue;
    if (exercises.some((e) => (e.promptData as { sentence?: string }).sentence === example.replace(word, '____'))) continue;
    // Japanese readings are written "かな (romaji)"; accept the kanji form or the kana reading.
    const kana = reading.split(/[ （(]/)[0];
    const accepted = lang === 'ja' && kana && kana !== word ? [word, kana] : [word];
    push({
      type: 'FILL_BLANK',
      promptData: { prompt: `Điền từ còn thiếu. Nghĩa của câu: “${exampleVi}”`, sentence: example.replace(word, '____') },
      gradingData: { acceptedAnswers: accepted, caseSensitive: false },
      feedbackData: { explanation: `Từ cần điền là ${label(word, reading, lang)} (${vi}). Câu hoàn chỉnh: ${example}` },
    });
    fills++;
  }

  // 4) Sentence ordering.
  lesson.reorder.forEach(([tokensRaw, hint], n) => {
    const parts = tokensRaw.split('|');
    const tokens = parts.map((text, k) => ({ id: `t${n + 1}-${k + 1}`, text }));
    // Present tokens in a deterministic non-sorted order (rotate, then swap the first pair if still identical).
    let order = shuffleStable(tokens, lessonIndex + n + 1);
    if (order.every((t, k) => t === tokens[k])) order = [...tokens].reverse();
    push({
      type: 'REORDER',
      promptData: { prompt: `Sắp xếp thành câu hoàn chỉnh: “${hint}”`, tokens: order },
      gradingData: { correctOrder: tokens.map((t) => t.id) },
      feedbackData: { explanation: `Câu đúng: ${lang === 'en' ? parts.join(' ') : parts.join('')} — ${hint}` },
    });
  });

  // 5) Hand-written grammar production.
  lesson.grammarQ.forEach((q) => {
    push({
      type: 'GRAMMAR',
      promptData: { prompt: q.prompt, sourceSentence: q.source, targetPattern: q.pattern },
      gradingData: { acceptedAnswers: q.answers, caseSensitive: false },
      feedbackData: { explanation: `Mẫu câu: ${q.pattern}. Đáp án mẫu: ${q.answers[0]}` },
    });
  });

  return exercises;
}

export function buildLessonPayload(lang: LanguageKey, lessonKey: string, lessonIndex: number, lesson: LessonSpec) {
  return {
    title: lesson.title,
    blocks: buildBlocks(lang, lessonKey, lesson),
    vocabulary: buildVocabulary(lesson.vocab),
    exercises: buildExercises(lang, lessonKey, lessonIndex, lesson),
  };
}
