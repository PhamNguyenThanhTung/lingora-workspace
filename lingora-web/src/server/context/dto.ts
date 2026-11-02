import { z } from 'zod';

export interface LearnerDto {
  id: string;
  displayName: string | null;
  role: 'LEARNER';
  status: 'ACTIVE';
  uiLocale: string;
}

export interface TargetLanguageDto {
  id: string;
  code: string;
  names: Record<string, any>;
}

export interface CourseSummaryDto {
  id: string;
  names: Record<string, any>;
  isActive: boolean;
}

export interface FrameworkSummaryDto {
  id: string;
  code: string;
  version: string;
  names: Record<string, any>;
}

export interface LevelSummaryDto {
  id: string;
  code: string;
  label: Record<string, any>;
  position: number;
}

export interface LearningContextSummaryDto {
  id: string;
  status: string;
  rowVersion: string;
  startSource: string | null;
  targetLanguage: TargetLanguageDto;
  course: CourseSummaryDto;
  framework: FrameworkSummaryDto;
  selectedStartLevel: LevelSummaryDto | null;
  workingLevel: LevelSummaryDto | null;
}

export interface LearnerContextEnvelope {
  data: {
    learner: LearnerDto;
    contexts: LearningContextSummaryDto[];
  };
}

export interface LevelOptionDto {
  id: string;
  code: string;
  label: Record<string, any>;
  position: number;
}

export interface CourseOptionDto {
  id: string;
  names: Record<string, any>;
  isActive: boolean;
  framework: FrameworkSummaryDto;
  defaultLevelId: string | null;
  levels: LevelOptionDto[];
}

export interface LanguageOptionDto {
  id: string;
  code: string;
  names: Record<string, any>;
  courses: CourseOptionDto[];
}

export interface ContextOptionsData {
  languages: LanguageOptionDto[];
}

export interface ContextOptionsEnvelope {
  data: ContextOptionsData;
}

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

export const pgUuidSchema = z
  .string({ message: 'Mã định danh phải là chuỗi ký tự' })
  .refine(isValidUuid, 'Mã định danh phải là UUID hợp lệ')
  .transform((val) => val.toLowerCase());

export const contextCreateDefaultSchema = z.object({
  contextId: pgUuidSchema,
  languageId: pgUuidSchema,
  courseId: pgUuidSchema,
  startSource: z.literal('DEFAULT'),
}).strict();

export const contextCreateSelfReportSchema = z.object({
  contextId: pgUuidSchema,
  languageId: pgUuidSchema,
  courseId: pgUuidSchema,
  startSource: z.literal('SELF_REPORT'),
  levelId: pgUuidSchema,
}).strict();

export const contextCreateSchema = z.union([
  contextCreateDefaultSchema,
  contextCreateSelfReportSchema,
]);

export type ContextCreateInput = z.infer<typeof contextCreateSchema>;

export const contextPatchSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED']),
  expectedRowVersion: z.string().regex(/^[1-9]\d*$/),
}).strict();

export type ContextPatchInput = z.infer<typeof contextPatchSchema>;

export class ContextServiceError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ContextServiceError';
    this.status = status;
    this.code = code;
  }
}
