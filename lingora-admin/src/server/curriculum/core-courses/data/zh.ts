import type { CourseSpec, UnitSpec } from '../types.ts';
import { ZH_HSK1_UNITS } from './zh-hsk1.ts';
import { ZH_HSK1_EXTRA_UNITS } from './zh-hsk1-extra.ts';
import { ZH_HSK1_EXTRA2_UNITS } from './zh-hsk1-extra2.ts';
import { ZH_HSK2_UNITS } from './zh-hsk2.ts';
import { ZH_HSK1_EXTRA_VOCAB } from './zh-hsk1-vocab.ts';
import { ZH_HSK2_EXTRA_UNITS } from './zh-hsk2-extra.ts';
import { ZH_HSK2_EXTRA2_UNITS } from './zh-hsk2-extra2.ts';

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

export const ZH_COURSE: CourseSpec = {
  key: 'zh',
  names: { vi: 'Tiếng Trung giao tiếp HSK1–HSK2', en: 'Chinese for Communication HSK1–HSK2' },
  defaultLevel: 'HSK1',
  units: [...withExtraVocab([...ZH_HSK1_UNITS, ...ZH_HSK1_EXTRA_UNITS, ...ZH_HSK1_EXTRA2_UNITS], ZH_HSK1_EXTRA_VOCAB), ...ZH_HSK2_UNITS, ...ZH_HSK2_EXTRA_UNITS, ...ZH_HSK2_EXTRA2_UNITS],
};
