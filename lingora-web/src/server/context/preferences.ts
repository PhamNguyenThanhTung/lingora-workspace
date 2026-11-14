import { z } from 'zod';
import {
  ALLOWED_PURPOSES,
  ALLOWED_DAILY_GOALS,
  ALLOWED_INTERESTS,
  ONBOARDING_VERSION,
  type OnboardingPurpose,
  type DailyGoalMinutes,
  type RecommendationSnapshotDto,
  type RecommendationReasonCode,
} from './onboarding-dto.ts';

export function normalizePurpose(raw: unknown): OnboardingPurpose | null {
  if (typeof raw !== 'string') return null;
  const upper = raw.trim().toUpperCase();
  if ((ALLOWED_PURPOSES as readonly string[]).includes(upper)) {
    return upper as OnboardingPurpose;
  }
  return null;
}

export function normalizeDailyGoal(raw: unknown): DailyGoalMinutes {
  const num = typeof raw === 'string' ? parseInt(raw, 10) : typeof raw === 'number' ? raw : 10;
  if ((ALLOWED_DAILY_GOALS as readonly number[]).includes(num)) {
    return num as DailyGoalMinutes;
  }
  return 10;
}

export function normalizeInterests(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const validSet = new Set<string>();
  for (const item of raw) {
    if (typeof item === 'string') {
      const upper = item.trim().toUpperCase();
      if ((ALLOWED_INTERESTS as readonly string[]).includes(upper)) {
        validSet.add(upper);
      }
    }
  }

  // Canonical stable sort based on ALLOWED_INTERESTS array position, capped at 5
  return ALLOWED_INTERESTS.filter((interest) => validSet.has(interest)).slice(0, 5);
}

export interface NormalizedPreferences {
  purpose: OnboardingPurpose | null;
  dailyGoalMinutes: DailyGoalMinutes;
  interests: string[];
}

export function normalizeOnboardingPreferences(input: {
  purpose?: unknown;
  dailyGoalMinutes?: unknown;
  interests?: unknown;
}): NormalizedPreferences {
  return {
    purpose: normalizePurpose(input.purpose),
    dailyGoalMinutes: normalizeDailyGoal(input.dailyGoalMinutes),
    interests: normalizeInterests(input.interests),
  };
}

export function mergeStudyPreferences(
  existing: unknown,
  normalized: NormalizedPreferences,
  serverDate: Date
): Record<string, any> {
  const base = existing && typeof existing === 'object' && !Array.isArray(existing) ? { ...existing } : {};
  return {
    ...base,
    dailyGoalMinutes: normalized.dailyGoalMinutes,
    interests: normalized.interests,
    onboardingVersion: ONBOARDING_VERSION,
    onboardingCompletedAt: (base as any).onboardingCompletedAt || serverDate.toISOString(),
  };
}

/**
 * Applies a partial update (patch) to context preferences.
 * Distinguishes between omitted fields (retains existing) and explicit null/empty (clears).
 * Preserves unrelated studyPreferences keys and initial onboardingCompletedAt.
 */
export function patchPreferences(
  existing: {
    purpose: string | null;
    studyPreferences: unknown;
  },
  patch: {
    purpose?: OnboardingPurpose | null;
    dailyGoalMinutes?: DailyGoalMinutes;
    interests?: string[];
  }
): {
  purpose: OnboardingPurpose | null;
  dailyGoalMinutes: DailyGoalMinutes;
  interests: string[];
  updatedStudyPreferences: Record<string, any>;
} {
  const existingStudyPrefs =
    existing.studyPreferences && typeof existing.studyPreferences === 'object' && !Array.isArray(existing.studyPreferences)
      ? { ...(existing.studyPreferences as Record<string, any>) }
      : {};

  // 1. Purpose: if patch.purpose is provided (including null), use it. If omitted, retain existing.
  let purpose: OnboardingPurpose | null;
  if (patch.purpose !== undefined) {
    purpose = patch.purpose === null ? null : normalizePurpose(patch.purpose);
  } else {
    purpose = normalizePurpose(existing.purpose);
  }

  // 2. Daily Goal: if patch.dailyGoalMinutes is provided, normalize it. If omitted, retain existing (or default to 10).
  let dailyGoalMinutes: DailyGoalMinutes;
  if (patch.dailyGoalMinutes !== undefined) {
    dailyGoalMinutes = normalizeDailyGoal(patch.dailyGoalMinutes);
  } else {
    dailyGoalMinutes = normalizeDailyGoal(existingStudyPrefs.dailyGoalMinutes);
  }

  // 3. Interests: if patch.interests is provided, normalize it. If omitted, retain existing.
  let interests: string[];
  if (patch.interests !== undefined) {
    interests = normalizeInterests(patch.interests);
  } else {
    interests = normalizeInterests(existingStudyPrefs.interests);
  }

  const updatedStudyPreferences: Record<string, any> = {
    ...existingStudyPrefs,
    dailyGoalMinutes,
    interests,
    onboardingVersion: existingStudyPrefs.onboardingVersion || ONBOARDING_VERSION,
    onboardingCompletedAt: existingStudyPrefs.onboardingCompletedAt,
  };

  return {
    purpose,
    dailyGoalMinutes,
    interests,
    updatedStudyPreferences,
  };
}

const reasonCodeEnum = z.enum([
  'LOWEST_AVAILABLE_LEVEL',
  'SELF_REPORTED_LEVEL',
  'PLACEMENT_RECOMMENDED_LEVEL',
  'PURPOSE_MATCH',
]);

const recommendationSnapshotSchema = z.object({
  algorithmVersion: z.number().int().default(ONBOARDING_VERSION),
  normalizedPreferences: z.object({
    purpose: z.string().nullable().default(null),
    dailyGoalMinutes: z.number().int().default(10),
    interests: z.array(z.string()).default([]),
  }).default({
    purpose: null,
    dailyGoalMinutes: 10,
    interests: [],
  }),
  recommendedLessonId: z.string().nullable().default(null),
  reasonCodes: z.array(reasonCodeEnum).default([]),
});

export function parseRecommendationSnapshot(raw: unknown): RecommendationSnapshotDto {
  const result = recommendationSnapshotSchema.safeParse(raw);
  if (!result.success) {
    return {
      algorithmVersion: ONBOARDING_VERSION,
      normalizedPreferences: {
        purpose: null,
        dailyGoalMinutes: 10,
        interests: [],
      },
      recommendedLessonId: null,
      reasonCodes: ['LOWEST_AVAILABLE_LEVEL'],
    };
  }

  const parsed = result.data;
  return {
    algorithmVersion: parsed.algorithmVersion,
    normalizedPreferences: {
      purpose: normalizePurpose(parsed.normalizedPreferences.purpose),
      dailyGoalMinutes: normalizeDailyGoal(parsed.normalizedPreferences.dailyGoalMinutes),
      interests: normalizeInterests(parsed.normalizedPreferences.interests),
    },
    recommendedLessonId: parsed.recommendedLessonId,
    reasonCodes: (parsed.reasonCodes.length > 0
      ? parsed.reasonCodes
      : ['LOWEST_AVAILABLE_LEVEL']) as RecommendationReasonCode[],
  };
}
