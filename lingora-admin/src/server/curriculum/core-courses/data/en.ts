import type { CourseSpec, UnitSpec } from '../types.ts';
import { EN_A1_UNITS } from './en-a1.ts';
import { EN_A1_EXTRA_UNITS } from './en-a1-extra.ts';
import { EN_A1_EXTRA2_UNITS } from './en-a1-extra2.ts';
import { EN_A1_EXTRA_VOCAB } from './en-a1-vocab.ts';
import { EN_A2_EXTRA_VOCAB } from './en-a2-vocab.ts';
import { EN_A2_EXTRA_UNITS } from './en-a2-extra.ts';
import { EN_A2_EXTRA2_UNITS } from './en-a2-extra2.ts';
import { EN_A2_UNITS } from './en-a2.ts';

/** Appends the extra vocabulary (keyed by English lesson title) to the matching lessons. */
function withExtraVocab(units: UnitSpec[], extra: Record<string, UnitSpec['lessons'][number]['vocab']>): UnitSpec[] {
  return units.map((unit) => ({
    ...unit,
    lessons: unit.lessons.map((lesson) => {
      const more = extra[lesson.title.en];
      return more ? { ...lesson, vocab: [...lesson.vocab, ...more] } : lesson;
    }),
  }));
}

export const EN_COURSE: CourseSpec = {
  key: 'en',
  names: { vi: 'Tiếng Anh giao tiếp A1–A2', en: 'English for Communication A1–A2' },
  defaultLevel: 'A1',
  units: [
    ...withExtraVocab([...EN_A1_UNITS, ...EN_A1_EXTRA_UNITS, ...EN_A1_EXTRA2_UNITS], EN_A1_EXTRA_VOCAB),
    ...withExtraVocab([...EN_A2_UNITS, ...EN_A2_EXTRA_UNITS, ...EN_A2_EXTRA2_UNITS], EN_A2_EXTRA_VOCAB),
  ],
};
