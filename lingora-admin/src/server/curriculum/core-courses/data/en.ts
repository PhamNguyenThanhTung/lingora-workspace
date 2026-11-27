import type { CourseSpec } from '../types.ts';
import { EN_A1_UNITS } from './en-a1.ts';
import { EN_A1_EXTRA_UNITS } from './en-a1-extra.ts';
import { EN_A1_EXTRA2_UNITS } from './en-a1-extra2.ts';
import { EN_A2_EXTRA_UNITS } from './en-a2-extra.ts';
import { EN_A2_EXTRA2_UNITS } from './en-a2-extra2.ts';
import { EN_A2_UNITS } from './en-a2.ts';

export const EN_COURSE: CourseSpec = {
  key: 'en',
  names: { vi: 'Tiếng Anh giao tiếp A1–A2', en: 'English for Communication A1–A2' },
  defaultLevel: 'A1',
  units: [...EN_A1_UNITS, ...EN_A1_EXTRA_UNITS, ...EN_A1_EXTRA2_UNITS, ...EN_A2_UNITS, ...EN_A2_EXTRA_UNITS, ...EN_A2_EXTRA2_UNITS],
};
