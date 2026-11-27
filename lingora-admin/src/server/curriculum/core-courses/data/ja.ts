import type { CourseSpec } from '../types.ts';
import { JA_N5_UNITS } from './ja-n5.ts';
import { JA_N4_UNITS } from './ja-n4.ts';

export const JA_COURSE: CourseSpec = {
  key: 'ja',
  names: { vi: 'Tiếng Nhật giao tiếp N5–N4', en: 'Japanese for Communication N5–N4' },
  defaultLevel: 'N5',
  units: [...JA_N5_UNITS, ...JA_N4_UNITS],
};
