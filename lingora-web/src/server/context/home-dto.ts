import type { LearnerDto, LearningContextSummaryDto } from './dto.ts';
import type { LearningPlanDto } from './onboarding-dto.ts';
import type { DailyProgressDto, StreakDto, QuestDto, AchievementDto } from '../gamification/dto.ts';

export interface PathNodeDto {
  lessonId: string;
  title: string;
  unitTitle: string;
  unitPosition: number;
  state: 'COMPLETED' | 'CURRENT' | 'AVAILABLE' | 'LOCKED' | 'COMING_SOON';
  score: number | null;
  position: number;
  isRequired: boolean;
  href: string;
}

export interface ContinueLearningDto {
  lessonId: string;
  title: string;
  unitTitle: string;
  href: string;
  status: 'IN_PROGRESS' | 'READY';
}

export type PathStatus = 'READY' | 'PAUSED' | 'COURSE_INACTIVE' | 'NO_WORKING_LEVEL' | 'EMPTY_CURRICULUM';

export type GamificationStatus = 'AVAILABLE' | 'UNAVAILABLE';

export interface HomeDto {
  learner: LearnerDto;
  contexts: LearningContextSummaryDto[];
  selectedContextId: string | null;
  plan: LearningPlanDto | null;
  continueLearning: ContinueLearningDto | null;
  path: PathNodeDto[];
  sections: PathSectionDto[];
  currentLevel: { code: string; label: string } | null;
  pathStatus: PathStatus | null;
  pathMessage: string | null;
  reviewDue: number;
  gamificationStatus?: GamificationStatus;
  gamificationMessage?: string | null;
  dailyProgress: DailyProgressDto;
  streak: StreakDto;
  totalXp: number;
  totalGems?: number;
  quests: QuestDto[];
  recentAchievement: AchievementDto | null;
}

export interface PathSectionDto {
  levelId: string;
  levelCode: string;
  levelLabel: string;
  position: number;
  state: 'COMPLETED' | 'CURRENT' | 'NEXT' | 'LOCKED' | 'COMING_SOON';
  progress: { requiredDone: number; requiredTotal: number };
  canSkipTo: boolean;
  units: Array<{ unitId: string; position: number; title: string; progress: { done: number; total: number }; nodes: PathNodeDto[] }>;
}
