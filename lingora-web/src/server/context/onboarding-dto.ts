import { z } from 'zod';
import { pgUuidSchema, type LevelSummaryDto } from './dto.ts';

export const ONBOARDING_VERSION = 1;

export const ALLOWED_PURPOSES = [
  'TRAVEL',
  'WORK',
  'SCHOOL',
  'EXAM',
  'CONVERSATION',
  'CULTURE',
  'ENTERTAINMENT',
  'OTHER',
] as const;

export type OnboardingPurpose = typeof ALLOWED_PURPOSES[number];

export const ALLOWED_DAILY_GOALS = [5, 10, 15, 20] as const;
export type DailyGoalMinutes = typeof ALLOWED_DAILY_GOALS[number];

export const ALLOWED_INTERESTS = [
  'TRAVEL',
  'BUSINESS',
  'ACADEMICS',
  'DAILY_LIFE',
  'CULTURE',
  'ENTERTAINMENT',
  'TECHNOLOGY',
  'FOOD',
  'NEWS',
  'SCIENCE',
] as const;

export type OnboardingInterest = typeof ALLOWED_INTERESTS[number];

export const purposeSchema = z.enum(ALLOWED_PURPOSES);

export const dailyGoalSchema = z.union([
  z.literal(5),
  z.literal(10),
  z.literal(15),
  z.literal(20),
]);

export const entryChoiceDefaultSchema = z.object({
  startSource: z.literal('DEFAULT'),
  courseId: pgUuidSchema.optional(),
}).strict();

export const entryChoiceSelfReportSchema = z.object({
  startSource: z.literal('SELF_REPORT'),
  courseId: pgUuidSchema.optional(),
  levelId: pgUuidSchema,
}).strict();

export const entryChoiceSchema = z.discriminatedUnion('startSource', [
  entryChoiceDefaultSchema,
  entryChoiceSelfReportSchema,
]);

export type EntryChoice = z.infer<typeof entryChoiceSchema>;

export const onboardingPreviewInputSchema = z.object({
  languageId: pgUuidSchema,
  purpose: purposeSchema.nullable().optional(),
  dailyGoalMinutes: dailyGoalSchema.optional(),
  interests: z.array(z.string()).optional(),
  entryChoice: entryChoiceSchema,
}).strict();

export type OnboardingPreviewInput = z.infer<typeof onboardingPreviewInputSchema>;

export const onboardingCompleteInputSchema = z.object({
  contextId: pgUuidSchema,
  languageId: pgUuidSchema,
  purpose: purposeSchema.nullable().optional(),
  dailyGoalMinutes: dailyGoalSchema.optional(),
  interests: z.array(z.string()).optional(),
  entryChoice: entryChoiceSchema,
  expectedCourseId: pgUuidSchema,
  expectedStartLevelId: pgUuidSchema,
}).strict();

export type OnboardingCompleteInput = z.infer<typeof onboardingCompleteInputSchema>;

export const contextPlanUpdateInputSchema = z.object({
  operationId: pgUuidSchema,
  expectedRowVersion: z.string().regex(/^[1-9]\d*$/),
  purpose: purposeSchema.nullable().optional(),
  dailyGoalMinutes: dailyGoalSchema.optional(),
  interests: z.array(z.string()).optional(),
}).strict();

export type ContextPlanUpdateInput = z.infer<typeof contextPlanUpdateInputSchema>;

export interface CoursePreviewDto {
  id: string;
  names: Record<string, any>;
}

export interface NextLessonCandidateDto {
  id: string;
  title: Record<string, string>;
  href: string;
}

export type RecommendationReasonCode =
  | 'LOWEST_AVAILABLE_LEVEL'
  | 'SELF_REPORTED_LEVEL'
  | 'PLACEMENT_RECOMMENDED_LEVEL'
  | 'PURPOSE_MATCH';

export interface RecommendationSnapshotDto {
  algorithmVersion: number;
  normalizedPreferences: {
    purpose: OnboardingPurpose | null;
    dailyGoalMinutes: DailyGoalMinutes;
    interests: string[];
  };
  recommendedLessonId: string | null;
  reasonCodes: RecommendationReasonCode[];
}

export interface LearningPlanDto {
  id: string;
  contextId: string;
  courseId: string;
  startLevel: LevelSummaryDto;
  source: 'DEFAULT' | 'SELF_REPORT' | 'PLACEMENT';
  dailyGoalMinutes: number;
  status: 'ACTIVE' | 'REPLACED';
  reasonCodes: RecommendationReasonCode[];
  createdAt: string;
  replacedAt?: string | null;
}

export type PreviewStatus = 'READY' | 'NO_ELIGIBLE_CURRICULUM';

export interface OnboardingPreviewData {
  status: PreviewStatus;
  message?: string;
  course?: CoursePreviewDto;
  startLevel?: LevelSummaryDto;
  source?: 'DEFAULT' | 'SELF_REPORT';
  dailyGoalMinutes?: DailyGoalMinutes;
  reasonCodes?: RecommendationReasonCode[];
  nextLesson?: NextLessonCandidateDto | null;
}

export interface OnboardingCompleteData {
  context: any; // LearningContextSummaryDto
  plan: LearningPlanDto;
  nextLesson: NextLessonCandidateDto | null;
}

export type PlanStatus = 'READY' | 'NO_PLAN' | 'PAUSED' | 'CURRICULUM_UNAVAILABLE';

export interface ContextPlanData {
  status: PlanStatus;
  plan: LearningPlanDto | null;
  nextLesson: NextLessonCandidateDto | null;
  rowVersion?: string;
  preferences?: {
    purpose: OnboardingPurpose | null;
    dailyGoalMinutes: DailyGoalMinutes;
    interests: string[];
  };
}

export interface ContextPlanUpdateData {
  plan: LearningPlanDto;
  nextLesson: NextLessonCandidateDto | null;
  rowVersion: string;
}
