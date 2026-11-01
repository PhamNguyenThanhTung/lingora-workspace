import { z } from 'zod';

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

export type ReadingState = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export const consumptionPostSchema = z
  .object({
    action: z.enum(['start', 'complete'], {
      message: 'action phải là start hoặc complete',
    }),
    expectedPublishedRevisionId: z
      .string({ message: 'expectedPublishedRevisionId phải là chuỗi ký tự' })
      .refine(isValidUuid, 'expectedPublishedRevisionId phải là UUID hợp lệ').transform(value => value.toLowerCase()),
  })
  .strict();

export type ConsumptionPostInput = z.infer<typeof consumptionPostSchema>;

export interface LessonReadingDto {
  contextId: string;
  lessonId: string;
  lessonRevisionId: string;
  state: ReadingState;
  id: string | null;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string | null;
  rowVersion: string | null;
}

export interface LearnerLessonSummaryDto {
  id: string;
  position: number;
  title: Record<string, string>;
  isRequired: boolean;
  isLocked: boolean;
  lockReason?: string;
  activeRevisionId: string | null;
  readingState: ReadingState;
}

export interface LearnerUnitSummaryDto {
  id: string;
  position: number;
  names: Record<string, string>;
  lessons: LearnerLessonSummaryDto[];
}

export interface LearnerCatalogueDto {
  context: {
    id: string;
    courseId: string;
    courseTitle: Record<string, string>;
    targetLanguage: {
      id: string;
      code: string;
      names: Record<string, string>;
    };
    framework: {
      id: string;
      code: string;
      version: string;
    };
    workingLevel: {
      id: string;
      code: string;
      label: Record<string, string>;
      position: number;
    } | null;
  };
  units: LearnerUnitSummaryDto[];
  message?: string;
}

export interface LearnerExerciseDto {
  id: string;
  itemId: string;
  itemRevisionId: string;
  position: number;
  isCore: boolean;
  type: 'MCQ' | 'FILL_BLANK' | 'REORDER' | 'LISTENING' | 'GRAMMAR';
  schemaVersion: number;
  promptData: unknown;
}

export interface LearnerVocabularyDto {
  id: string;
  position: number;
  isCore: boolean;
  displaySnapshot: {
    canonicalForm: string;
    senseKey?: string;
    meaningLabels: Record<string, string>;
    phonetic?: string | null;
    partOfSpeech?: string | null;
    example?: string | null;
  };
}

export interface LearnerLessonDetailDto {
  contextId: string;
  lessonId: string;
  unit: {
    id: string;
    position: number;
    names: Record<string, string>;
  };
  revision: {
    id: string;
    revisionNo: number;
    title: Record<string, string>;
    contentBlocks: Array<{ type: string; text: string }>;
    topicIds: string[];
    skillIds: string[];
    purposeTags: string[];
  };
  exercises: LearnerExerciseDto[];
  vocabulary: LearnerVocabularyDto[];
  consumption: LessonReadingDto;
}

export interface LearnerCatalogueEnvelope {
  data: LearnerCatalogueDto;
}

export interface LearnerLessonDetailEnvelope {
  data: LearnerLessonDetailDto;
}

export interface LessonReadingEnvelope {
  data: LessonReadingDto;
}

export interface LessonServiceErrorPayload {
  code: string;
  message: string;
}

export class LessonServiceError extends Error {
  status: number;
  error: LessonServiceErrorPayload;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.error = { code, message };
    this.name = 'LessonServiceError';
  }
}
