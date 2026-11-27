import { EN_COURSE } from './data/en.ts';
import { JA_COURSE } from './data/ja.ts';
import { ZH_COURSE } from './data/zh.ts';
import type { CourseSpec, LanguageKey } from './types.ts';

export const CORE_COURSES: Partial<Record<LanguageKey, CourseSpec>> = {
  en: EN_COURSE,
  ja: JA_COURSE,
  zh: ZH_COURSE,
};

export { provisionCoreCourse, ensureReferenceData } from './provision.ts';
export type { CoreActors, CoreProvisionResult } from './provision.ts';
export { buildLessonPayload } from './build.ts';
export * from './reference.ts';
export * from './types.ts';
