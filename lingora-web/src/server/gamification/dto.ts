export interface QuestDto {
  id: 'LESSON_1' | 'REVIEW_10';
  title: string;
  target: number;
  progress: number;
  xpReward: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface AchievementDto {
  code: string;
  title: string;
  description: string;
  awardedAt?: string | null;
  isUnlocked: boolean;
}

export interface StreakDto {
  currentStreak: number;
  longestStreak: number;
  activeDays: string[];
  todayCompleted: boolean;
  today?: string;
}

export interface DailyProgressDto {
  dailyGoalMinutes: number;
  completedLessonsToday: number;
  reviewsCompletedToday: number;
}

export interface GamificationOverviewDto {
  totalXp: number;
  streak: StreakDto;
  dailyProgress: DailyProgressDto;
  quests: QuestDto[];
  recentAchievement: AchievementDto | null;
}
