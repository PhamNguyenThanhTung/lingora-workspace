import type { LearnerDto, LearningContextSummaryDto } from './dto.ts';
import type { LearningPlanDto } from './onboarding-dto.ts';
import type { DailyProgressDto, StreakDto, QuestDto, AchievementDto } from '../gamification/dto.ts';

export interface PathNodeDto {
  lessonId: string;
  title: string;
  unitTitle: string;
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
  pathStatus: PathStatus | null;
  pathMessage: string | null;
  reviewDue: number;
  gamificationStatus?: GamificationStatus;
  gamificationMessage?: string | null;
  dailyProgress: DailyProgressDto;
  streak: StreakDto;
  totalXp: number;
  quests: QuestDto[];
  recentAchievement: AchievementDto | null;
}
