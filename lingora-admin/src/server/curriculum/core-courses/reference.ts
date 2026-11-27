import { createHash } from 'node:crypto';
import type { LanguageKey } from './types.ts';

/** Deterministic UUID (v5-shaped) so re-running the seed never creates duplicates. */
export function stableUuid(key: string): string {
  const h = createHash('sha1').update(`lingora-core-courses:${key}`).digest('hex');
  const variant = ((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${variant}${h.slice(18, 20)}-${h.slice(20, 32)}`;
}

export interface LanguageRef {
  id: string;
  code: LanguageKey;
  names: { en: string; vi: string };
  isLearnable: boolean;
  isUiLocale: boolean;
}

export interface FrameworkRef {
  id: string;
  code: string;
  version: string;
  names: { en: string; vi: string };
  levels: Array<{ id: string; code: string; position: number; label: { en: string; vi: string } }>;
}

/** English/Vietnamese rows already belong to the canonical seed; ja/zh are added here. */
export const LANGUAGES: Record<LanguageKey, LanguageRef> = {
  en: { id: '00000000-0000-0000-0000-000000000001', code: 'en', names: { en: 'English', vi: 'Tiếng Anh' }, isLearnable: true, isUiLocale: true },
  ja: { id: '00000000-0000-0000-0000-000000000003', code: 'ja', names: { en: 'Japanese', vi: 'Tiếng Nhật' }, isLearnable: true, isUiLocale: false },
  zh: { id: '00000000-0000-0000-0000-000000000004', code: 'zh', names: { en: 'Chinese', vi: 'Tiếng Trung' }, isLearnable: true, isUiLocale: false },
};

/** CEFR rows are identical to the canonical seed (verified, never overwritten). */
export const FRAMEWORKS: Record<LanguageKey, FrameworkRef> = {
  en: {
    id: '00000000-0000-0000-0000-000000000010',
    code: 'CEFR',
    version: '2020',
    names: { en: 'Common European Framework of Reference', vi: 'Khung tham chiếu chung Châu Âu' },
    levels: [
      { id: '00000000-0000-0000-0000-000000000021', code: 'A1', position: 1, label: { en: 'Beginner', vi: 'Mới bắt đầu' } },
      { id: '00000000-0000-0000-0000-000000000022', code: 'A2', position: 2, label: { en: 'Elementary', vi: 'Sơ cấp' } },
      { id: '00000000-0000-0000-0000-000000000023', code: 'B1', position: 3, label: { en: 'Intermediate', vi: 'Trung cấp' } },
      { id: '00000000-0000-0000-0000-000000000024', code: 'B2', position: 4, label: { en: 'Upper Intermediate', vi: 'Trung cao cấp' } },
    ],
  },
  ja: {
    id: stableUuid('framework:jlpt'),
    code: 'JLPT',
    version: '2010',
    names: { en: 'Japanese-Language Proficiency Test', vi: 'Kỳ thi năng lực Nhật ngữ JLPT' },
    levels: [
      { id: stableUuid('level:jlpt:N5'), code: 'N5', position: 1, label: { en: 'Beginner (N5)', vi: 'Sơ cấp N5' } },
      { id: stableUuid('level:jlpt:N4'), code: 'N4', position: 2, label: { en: 'Elementary (N4)', vi: 'Sơ cấp N4' } },
      { id: stableUuid('level:jlpt:N3'), code: 'N3', position: 3, label: { en: 'Intermediate (N3)', vi: 'Trung cấp N3' } },
      { id: stableUuid('level:jlpt:N2'), code: 'N2', position: 4, label: { en: 'Upper Intermediate (N2)', vi: 'Trung cao cấp N2' } },
      { id: stableUuid('level:jlpt:N1'), code: 'N1', position: 5, label: { en: 'Advanced (N1)', vi: 'Cao cấp N1' } },
    ],
  },
  zh: {
    id: stableUuid('framework:hsk'),
    code: 'HSK',
    version: '2.0',
    names: { en: 'Hanyu Shuiping Kaoshi', vi: 'Kỳ thi năng lực Hán ngữ HSK' },
    levels: [
      { id: stableUuid('level:hsk:1'), code: 'HSK1', position: 1, label: { en: 'Beginner (HSK 1)', vi: 'Sơ cấp HSK 1' } },
      { id: stableUuid('level:hsk:2'), code: 'HSK2', position: 2, label: { en: 'Elementary (HSK 2)', vi: 'Sơ cấp HSK 2' } },
      { id: stableUuid('level:hsk:3'), code: 'HSK3', position: 3, label: { en: 'Intermediate (HSK 3)', vi: 'Trung cấp HSK 3' } },
      { id: stableUuid('level:hsk:4'), code: 'HSK4', position: 4, label: { en: 'Upper Intermediate (HSK 4)', vi: 'Trung cao cấp HSK 4' } },
      { id: stableUuid('level:hsk:5'), code: 'HSK5', position: 5, label: { en: 'Advanced (HSK 5)', vi: 'Cao cấp HSK 5' } },
      { id: stableUuid('level:hsk:6'), code: 'HSK6', position: 6, label: { en: 'Mastery (HSK 6)', vi: 'Thành thạo HSK 6' } },
    ],
  },
};

export const COURSE_IDS: Record<LanguageKey, string> = {
  en: 'c0000000-0000-4000-8000-0000000000e1',
  ja: 'c0000000-0000-4000-8000-0000000000a1',
  zh: 'c0000000-0000-4000-8000-0000000000b1',
};

export function levelOf(key: LanguageKey, code: string) {
  const level = FRAMEWORKS[key].levels.find((l) => l.code === code);
  if (!level) throw new Error(`Unknown level ${code} for ${key}`);
  return level;
}

export function unitId(key: LanguageKey, levelCode: string, position: number): string {
  return stableUuid(`unit:${key}:${levelCode}:${position}`);
}
