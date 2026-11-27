import { z } from 'zod';
import type { LearningContextSummaryDto } from '../context/dto.ts';
import type { AchievementDefinition } from '../gamification/metadata.ts';

export interface ProfileAchievementDto extends AchievementDefinition {
  isUnlocked: boolean;
  awardedAt: string | null;
}

export interface LearnerProfileDto {
  displayName: string | null;
  activatedAt: string | null;
  uiLocale: string;
  timezone: string;
  rowVersion: string;
  contexts: LearningContextSummaryDto[];
  totals: {
    xp: number;
    gems: number;
    lessonsCompleted: number;
    srsCards: number;
  };
  streak: {
    current: number;
    longest: number;
  };
  calendar28: string[];
  achievements: ProfileAchievementDto[];
}

export interface LearnerProfilePatchDto {
  displayName: string;
  rowVersion: string;
}

export const profilePatchSchema = z.object({
  displayName: z.string().refine(value => !/[\u0000-\u001f\u007f-\u009f]/u.test(value), 'Tên không được chứa ký tự điều khiển.').transform(value => value.trim()).pipe(z.string().min(1).max(40)),
  expectedRowVersion: z.string().regex(/^[1-9][0-9]{0,18}$/).refine(value => BigInt(value) < 9223372036854775807n),
}).strict();
