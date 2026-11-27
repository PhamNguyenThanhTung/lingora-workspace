import type { CourseSpec } from '../types.ts';
import { ZH_HSK1_UNITS } from './zh-hsk1.ts';
import { ZH_HSK1_EXTRA_UNITS } from './zh-hsk1-extra.ts';
import { ZH_HSK1_EXTRA2_UNITS } from './zh-hsk1-extra2.ts';
import { ZH_HSK2_UNITS } from './zh-hsk2.ts';
import { ZH_HSK2_EXTRA_UNITS } from './zh-hsk2-extra.ts';

export const ZH_COURSE: CourseSpec = {
  key: 'zh',
  names: { vi: 'Tiếng Trung giao tiếp HSK1–HSK2', en: 'Chinese for Communication HSK1–HSK2' },
  defaultLevel: 'HSK1',
  units: [...ZH_HSK1_UNITS, ...ZH_HSK1_EXTRA_UNITS, ...ZH_HSK1_EXTRA2_UNITS, ...ZH_HSK2_UNITS, ...ZH_HSK2_EXTRA_UNITS],
};
