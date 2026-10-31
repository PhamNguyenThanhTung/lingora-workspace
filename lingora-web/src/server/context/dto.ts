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
