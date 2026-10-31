import type { ExerciseType } from '../lessons/content.ts';

export type AssessmentPurpose = 'PLACEMENT' | 'LEVEL_UP';

export interface BlueprintCoverage {
  itemCount: number;
  exerciseTypes: ExerciseType[];
}

export interface BlueprintRequirements {
  minimumItemsByType: Partial<Record<ExerciseType, number>>;
}

export interface BlueprintConfig {
  shuffleItems: boolean;
  shuffleOptions: boolean;
}

export interface AssessmentBlueprintDto {
  id: string;
  createdBy: string;
  languageId: string;
  frameworkId: string;
  courseId: string;
  purpose: AssessmentPurpose;
  targetLevelId: string | null;
  nextLevelId: string | null;
  coverage: BlueprintCoverage;
  requirements: BlueprintRequirements;
  config: BlueprintConfig;
  coverageCatalogGeneration: string;
  generation: string;
  createdAt: string;
  updatedAt: string;
  rowVersion: string;
  course?: {
    id: string;
    names: Record<string, string>;
  };
  language?: {
    id: string;
    code: string;
    names: Record<string, string>;
  };
  framework?: {
    id: string;
    code: string;
    version: string;
    names: Record<string, string>;
  };
  targetLevel?: {
    id: string;
    code: string;
    position: number;
    label: Record<string, string>;
  } | null;
  nextLevel?: {
    id: string;
    code: string;
    position: number;
    label: Record<string, string>;
  } | null;
  versionCount?: number;
}

export interface EligibleAssessmentItemDto {
  itemRevisionId: string;
  itemId: string;
  revisionNo: number;
  type: ExerciseType;
  promptData: unknown;
  exactFingerprint: string;
  sourceLessonRevisionId: string;
  sourceLessonRevisionNo: number;
  lessonId: string;
  unitCode: string;
  unitPosition: number;
  lessonPosition: number;
  teacherId: string;
  teacherDisplayName: string | null;
  sourceSubmissionId: string;
  creationAssignmentEpisodeId: string;
  blueprintId: string;
  blueprintGeneration: string;
  submittedAt: string;
}

export interface AssessmentVersionItemDto {
  id: string;
  assessmentVersionId: string;
  itemRevisionId: string;
  itemId: string;
  position: number;
  weight: string;
  coverageTags: Record<string, unknown>;
  createdAt: string;
  item: {
    origin: string;
    exactFingerprint: string;
  };
  itemRevision: {
    id: string;
    revisionNo: number;
    type: ExerciseType;
    promptData: unknown;
    schemaVersion: number;
    exactFingerprint: string;
    blueprintGeneration: string | null;
    isDraftOmitted: boolean;
    frozenAt: string | null;
  };
  sourceLessonRevision: {
    id: string;
    revisionNo: number;
    lessonId: string;
  };
}

export interface AssessmentVersionDto {
  id: string;
  blueprintId: string;
  versionNo: number;
  blueprintGeneration: string;
  blueprintSnapshot: Record<string, unknown>;
  assembledAt: string;
  assemblyInputHash: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rowVersion: string;
  items?: AssessmentVersionItemDto[];
  itemCount?: number;
}

export interface TeacherAssessmentItemDto {
  id: string;
  itemId: string;
  revisionNo: number;
  type: ExerciseType;
  promptData: unknown;
  gradingData: unknown;
  feedbackData?: unknown;
  blueprintId: string;
  blueprintGeneration: string;
  isDraftOmitted: boolean;
  frozenAt: string | null;
  authoringLessonRevisionId: string;
  isStaleBlueprintGeneration: boolean;
  createdAt: string;
  updatedAt: string;
}
