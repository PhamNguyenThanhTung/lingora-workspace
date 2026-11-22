import 'server-only';
import crypto from 'node:crypto';
import type { Prisma, PrismaClient } from '../../../../lingora-admin/generated/product-client/index.js';
import { ACHIEVEMENTS, DAILY_QUESTS } from './metadata.ts';
import { normalizeStoredTimezone } from '../context/timezone.ts';
import type {
  QuestDto,
  AchievementDto,
  StreakDto,
  DailyProgressDto,
  GamificationOverviewDto,
} from './dto.ts';

type Db = PrismaClient | Prisma.TransactionClient;

const QUEST_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

export function questSourceId(learnerId: string, localDateStr: string, questId: string): string {
  const hash = crypto.createHash('sha1').update(`${QUEST_NAMESPACE}:${learnerId}:${localDateStr}:${questId}`).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50; // v5
  hash[8] = (hash[8] & 0x3f) | 0x80; // rfc4122
  const hex = hash.toString('hex', 0, 16);
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join('-');
}

export function computeQualifyingLocalDate(now: Date, timezone: string): { localDate: Date; localDateStr: string } {
  const norm = normalizeStoredTimezone(timezone);
  if (!norm.ok) {
    // Fail closed: never fall back to the host timezone for qualifying dates.
    throw new RangeError('Invalid or missing learner timezone');
  }
  const tz = norm.timezone;
  const localDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  return { localDate: new Date(localDateStr + 'T00:00:00.000Z'), localDateStr };
}

export function getPreviousCalendarDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().substring(0, 10);
}

export function getDaysAgoCalendarDay(dateStr: string, daysAgo: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().substring(0, 10);
}

export async function getLearnerStreak(
  db: Db,
  learnerId: string,
  timezone: string,
  now: Date
): Promise<StreakDto> {
  const { localDateStr: todayStr } = computeQualifyingLocalDate(now, timezone);
  const yesterdayStr = getPreviousCalendarDay(todayStr);

  const rows = await db.$queryRaw<Array<{ active_date: string }>>`
    SELECT DISTINCT to_char(d, 'YYYY-MM-DD') AS active_date FROM (
      SELECT la.qualifying_local_date AS d
      FROM app.lesson_attempts la
      JOIN app.learning_contexts lc ON lc.id = la.context_id
      WHERE lc.learner_id = ${learnerId}::uuid
        AND la.completed_at IS NOT NULL
        AND la.qualifying_local_date IS NOT NULL
      UNION
      SELECT qualifying_local_date AS d
      FROM app.srs_review_operations
      WHERE learner_id = ${learnerId}::uuid
        AND kind = 'SCHEDULE'
        AND qualifying_local_date IS NOT NULL
    ) t ORDER BY active_date DESC
  `;
  const activeDateStrings = rows.map(row => row.active_date);

  const activeSet = new Set(activeDateStrings);
  const todayCompleted = activeSet.has(todayStr);

  let currentStreak = 0;
  if (todayCompleted) {
    currentStreak = 1;
    let checkDay = yesterdayStr;
    while (activeSet.has(checkDay)) {
      currentStreak++;
      checkDay = getPreviousCalendarDay(checkDay);
    }
  } else if (activeSet.has(yesterdayStr)) {
    currentStreak = 1;
    let checkDay = getPreviousCalendarDay(yesterdayStr);
    while (activeSet.has(checkDay)) {
      currentStreak++;
      checkDay = getPreviousCalendarDay(checkDay);
    }
  } else {
    currentStreak = 0;
  }

  // Longest streak in history
  let longestStreak = 0;
  if (activeDateStrings.length > 0) {
    const sortedAsc = [...activeDateStrings].sort();
    let tempStreak = 0;
    let prevDay: string | null = null;
    for (const d of sortedAsc) {
      if (!prevDay) {
        tempStreak = 1;
      } else {
        const expectedNext = getDaysAgoCalendarDay(d, 1);
        if (prevDay === expectedNext) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      prevDay = d;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }
  }
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // 28 days calendar: from 27 days ago to today
  const activeDays: string[] = [];
  for (let i = 27; i >= 0; i--) {
    const day = getDaysAgoCalendarDay(todayStr, i);
    if (activeSet.has(day)) {
      activeDays.push(day);
    }
  }

  return {
    currentStreak,
    longestStreak,
    activeDays,
    todayCompleted,
    today: todayStr,
  };
}

export async function getTotalXp(db: Db, learnerId: string): Promise<number> {
  const rows = await db.$queryRaw<Array<{ total_xp: number | null }>>`
    SELECT COALESCE(SUM(xp), 0)::int AS total_xp
    FROM app.xp_events
    WHERE learner_id = ${learnerId}::uuid
  `;
  return Number(rows[0]?.total_xp ?? 0);
}

export async function getDailyQuests(
  db: Db,
  learnerId: string,
  localDate: Date,
  localDateStr: string
): Promise<QuestDto[]> {
  let lessonCompletionsToday = 0;
  let reviewsToday = 0;
  const rows = await db.$queryRaw<Array<{ event_type: string; cnt: number }>>`
    SELECT event_type, COUNT(*)::int AS cnt
    FROM app.xp_events
    WHERE learner_id = ${learnerId}::uuid
      AND local_date = ${localDateStr}::date
      AND event_type IN ('LESSON_COMPLETION', 'SRS_REVIEW')
    GROUP BY event_type
  `;
  for (const r of rows) {
    if (r.event_type === 'LESSON_COMPLETION') lessonCompletionsToday = Number(r.cnt);
    if (r.event_type === 'SRS_REVIEW') reviewsToday = Number(r.cnt);
  }

  const lesson1SourceId = questSourceId(learnerId, localDateStr, 'LESSON_1');
  const review10SourceId = questSourceId(learnerId, localDateStr, 'REVIEW_10');

  const claimedRows = await db.$queryRaw<Array<{ source_id: string }>>`
    SELECT source_id::text
    FROM app.xp_events
    WHERE learner_id = ${learnerId}::uuid
      AND event_type = 'DAILY_QUEST'
      AND local_date = ${localDateStr}::date
      AND source_id IN (${lesson1SourceId}::uuid, ${review10SourceId}::uuid)
  `;
  const lesson1Claimed = claimedRows.some(row => row.source_id === lesson1SourceId);
  const review10Claimed = claimedRows.some(row => row.source_id === review10SourceId);

  const lessonTarget = DAILY_QUESTS.LESSON_1.target;
  const reviewTarget = DAILY_QUESTS.REVIEW_10.target;

  return [
    {
      id: 'LESSON_1',
      title: DAILY_QUESTS.LESSON_1.title,
      target: lessonTarget,
      progress: Math.min(lessonCompletionsToday, lessonTarget),
      xpReward: DAILY_QUESTS.LESSON_1.xpReward,
      isCompleted: lessonCompletionsToday >= lessonTarget,
      isClaimed: lesson1Claimed,
    },
    {
      id: 'REVIEW_10',
      title: DAILY_QUESTS.REVIEW_10.title,
      target: reviewTarget,
      progress: Math.min(reviewsToday, reviewTarget),
      xpReward: DAILY_QUESTS.REVIEW_10.xpReward,
      isCompleted: reviewsToday >= reviewTarget,
      isClaimed: review10Claimed,
    },
  ];
}

export async function getDailyProgress(
  db: Db,
  learnerId: string,
  localDate: Date,
  dailyGoalMinutes: number,
  localDateStr?: string
): Promise<DailyProgressDto> {
  const dateStr = localDateStr || localDate.toISOString().slice(0, 10);
  const rows = await db.$queryRaw<Array<{ lesson_count: number; review_count: number }>>`
    SELECT
      (SELECT COUNT(*)::int
       FROM app.lesson_attempts la
       JOIN app.learning_contexts lc ON lc.id = la.context_id
       WHERE lc.learner_id = ${learnerId}::uuid
         AND la.completed_at IS NOT NULL
         AND la.qualifying_local_date = ${dateStr}::date) AS lesson_count,
      (SELECT COUNT(*)::int
       FROM app.srs_review_operations
       WHERE learner_id = ${learnerId}::uuid
         AND kind = 'SCHEDULE'
         AND qualifying_local_date = ${dateStr}::date) AS review_count
  `;
  const completedLessonsToday = Number(rows[0]?.lesson_count ?? 0);
  const reviewsCompletedToday = Number(rows[0]?.review_count ?? 0);

  return {
    dailyGoalMinutes,
    completedLessonsToday,
    reviewsCompletedToday,
  };
}

export async function getRecentAchievement(
  db: Db,
  learnerId: string
): Promise<AchievementDto | null> {
  const row = await (db as any).learnerAchievement.findFirst({
    where: { learnerId },
    orderBy: [{ awardedAt: 'desc' }, { id: 'desc' }],
  });
  if (!row) return null;
  const meta = ACHIEVEMENTS[row.achievementCode as keyof typeof ACHIEVEMENTS];
  return {
    code: row.achievementCode,
    title: meta?.title || row.achievementCode,
    description: meta?.description || '',
    awardedAt: row.awardedAt instanceof Date ? row.awardedAt.toISOString() : String(row.awardedAt),
    isUnlocked: true,
  };
}

export const GEM_REWARDS = { LESSON_COMPLETION: 5, DAILY_QUEST: 5, PERFECT_PRACTICE: 5 } as const;

export async function getTotalGems(db: Db, learnerId: string): Promise<number> {
  const rows = await db.$queryRaw<Array<{ total: number | bigint | null }>>`
    SELECT COALESCE(SUM(gems), 0)::int AS total
    FROM app.gem_events
    WHERE learner_id = ${learnerId}::uuid
  `;
  return Number(rows[0]?.total ?? 0);
}

/** Idempotent gem award: returns the gems newly granted (0 when already granted). */
async function awardGems(
  tx: Db,
  learnerId: string,
  eventType: keyof typeof GEM_REWARDS,
  sourceId: string,
  localDateStr: string,
  at: Date
): Promise<number> {
  const gems = GEM_REWARDS[eventType];
  const affected = await tx.$executeRaw`
    INSERT INTO app.gem_events (learner_id, event_type, source_id, gems, local_date, created_at)
    VALUES (${learnerId}::uuid, ${eventType}, ${sourceId}::uuid, ${gems}, ${localDateStr}::date, ${at})
    ON CONFLICT (learner_id, event_type, source_id) DO NOTHING
  `;
  return affected > 0 ? gems : 0;
}

export async function getGamificationOverview(
  db: Db,
  learnerId: string,
  timezone: string,
  now: Date,
  dailyGoalMinutes = 10
): Promise<GamificationOverviewDto> {
  const { localDate, localDateStr } = computeQualifyingLocalDate(now, timezone);

  const [totalXp, totalGems, streak, dailyProgress, quests, recentAchievement] = await Promise.all([
    getTotalXp(db, learnerId),
    getTotalGems(db, learnerId),
    getLearnerStreak(db, learnerId, timezone, now),
    getDailyProgress(db, learnerId, localDate, dailyGoalMinutes, localDateStr),
    getDailyQuests(db, learnerId, localDate, localDateStr),
    getRecentAchievement(db, learnerId),
  ]);

  return {
    totalXp,
    totalGems,
    streak,
    dailyProgress,
    quests,
    recentAchievement,
  };
}

async function tryAwardAchievement(
  tx: Db,
  learnerId: string,
  achievementCode: keyof typeof ACHIEVEMENTS,
  sourceId: string,
  awardedAt: Date
): Promise<AchievementDto | null> {
  const rows = await tx.$queryRaw<Array<{ achievement_code: string }>>`
    INSERT INTO app.learner_achievements (
      learner_id,
      achievement_code,
      source_id,
      awarded_at,
      created_at
    ) VALUES (
      ${learnerId}::uuid,
      ${achievementCode},
      ${sourceId}::uuid,
      ${awardedAt},
      ${awardedAt}
    ) ON CONFLICT (learner_id, achievement_code) DO NOTHING
    RETURNING achievement_code
  `;
  if (rows.length > 0) {
    const meta = ACHIEVEMENTS[achievementCode];
    return {
      code: achievementCode,
      title: meta?.title || achievementCode,
      description: meta?.description || '',
      awardedAt: awardedAt.toISOString(),
      isUnlocked: true,
    };
  }
  return null;
}

export interface FinalizeGamificationResult {
  lessonXp: number;
  questXp: number;
  earnedAchievements: AchievementDto[];
  newlyEnrolledCount: number;
  firstTryAccuracy: number;
  streak: number;
  gems: number;
}

export async function evaluateAndAwardFinalizeGamification(
  tx: Db,
  params: {
    learnerId: string;
    completionId: string;
    isFirstCompletion: boolean;
    qualifyingLocalDate: Date;
    completedAt: Date;
    timezone: string;
    nCore: number;
    kFirstWrong: number | null;
    newlyEnrolledCount: number;
  }
): Promise<FinalizeGamificationResult> {
  const { learnerId, completionId, isFirstCompletion, qualifyingLocalDate, completedAt, timezone, nCore, kFirstWrong, newlyEnrolledCount } = params;
  const localDateStr = qualifyingLocalDate.toISOString().slice(0, 10);

  let lessonXp = 0;
  let questXp = 0;
  let gems = 0;
  const earnedAchievements: AchievementDto[] = [];

  // 1. Award Lesson Completion XP (+30 for first completion in context)
  if (isFirstCompletion) {
    const rowsAffected = await tx.$executeRaw`
      INSERT INTO app.xp_events (
        learner_id, event_type, source_id, xp, local_date, created_at
      ) VALUES (
        ${learnerId}::uuid,
        'LESSON_COMPLETION',
        ${completionId}::uuid,
        30,
        ${localDateStr}::date,
        ${completedAt}
      ) ON CONFLICT (learner_id, event_type, source_id) DO NOTHING
    `;
    if (rowsAffected > 0) {
      lessonXp = 30;
      gems += await awardGems(tx, learnerId, 'LESSON_COMPLETION', completionId, localDateStr, completedAt);
    }
  }

  // 2. Check and Award Daily Quest: LESSON_1 (+10 XP)
  const rows = await tx.$queryRaw<Array<{ cnt: number }>>`
    SELECT COUNT(*)::int AS cnt
    FROM app.xp_events
    WHERE learner_id = ${learnerId}::uuid
      AND event_type = 'LESSON_COMPLETION'
      AND local_date = ${localDateStr}::date
  `;
  const completionsToday = Number(rows[0]?.cnt ?? 0);

  if (completionsToday >= 1) {
    const questSource = questSourceId(learnerId, localDateStr, 'LESSON_1');
    const rowsAffected = await tx.$executeRaw`
      INSERT INTO app.xp_events (
        learner_id, event_type, source_id, xp, local_date, created_at
      ) VALUES (
        ${learnerId}::uuid,
        'DAILY_QUEST',
        ${questSource}::uuid,
        10,
        ${localDateStr}::date,
        ${completedAt}
      ) ON CONFLICT (learner_id, event_type, source_id) DO NOTHING
    `;
    if (rowsAffected > 0) {
      questXp += 10;
      gems += await awardGems(tx, learnerId, 'DAILY_QUEST', questSource, localDateStr, completedAt);
    }
  }

  // 3. Compute Streak
  const streakDto = await getLearnerStreak(tx, learnerId, timezone, completedAt);
  const streak = streakDto.currentStreak;

  // 4. Calculate First Try Accuracy
  const k = kFirstWrong ?? 0;
  const firstTryAccuracy = nCore > 0 ? Math.round(((nCore - k) / nCore) * 100) : 100;

  // 5. Evaluate and Award Achievements
  // Check total lesson completions across all contexts
  const completionRows = await tx.$queryRaw<Array<{ cnt: number }>>`
    SELECT COUNT(*)::int AS cnt
    FROM app.lesson_completions lc
    JOIN app.learning_contexts ctx ON ctx.id = lc.context_id
    WHERE ctx.learner_id = ${learnerId}::uuid
  `;
  const totalCompletions = Number(completionRows[0]?.cnt ?? 0);

  // FIRST_LESSON
  if (totalCompletions >= 1) {
    const ach = await tryAwardAchievement(tx, learnerId, 'FIRST_LESSON', completionId, completedAt);
    if (ach) earnedAchievements.push(ach);
  }

  // LESSONS_10
  if (totalCompletions >= 10) {
    const ach = await tryAwardAchievement(tx, learnerId, 'LESSONS_10', completionId, completedAt);
    if (ach) earnedAchievements.push(ach);
  }

  // PERFECT_PRACTICE: all core correct on first attempt (kFirstWrong == 0 or null)
  if (nCore > 0 && kFirstWrong === 0) {
    const ach = await tryAwardAchievement(tx, learnerId, 'PERFECT_PRACTICE', completionId, completedAt);
    if (ach) earnedAchievements.push(ach);
    if (isFirstCompletion) gems += await awardGems(tx, learnerId, 'PERFECT_PRACTICE', completionId, localDateStr, completedAt);
  }

  // STREAK_7 & STREAK_30
  if (streak >= 7) {
    const ach = await tryAwardAchievement(tx, learnerId, 'STREAK_7', completionId, completedAt);
    if (ach) earnedAchievements.push(ach);
  }
  if (streak >= 30) {
    const ach = await tryAwardAchievement(tx, learnerId, 'STREAK_30', completionId, completedAt);
    if (ach) earnedAchievements.push(ach);
  }

  return {
    lessonXp,
    questXp,
    earnedAchievements,
    newlyEnrolledCount,
    firstTryAccuracy,
    streak,
    gems,
  };
}

export interface SrsGamificationResult {
  srsXp: number;
  questXp: number;
  earnedAchievements: AchievementDto[];
  streak: number;
}

export async function evaluateAndAwardSrsGamification(
  tx: Db,
  params: {
    learnerId: string;
    reviewOpId: string;
    qualifyingLocalDate: Date;
    reviewedAt: Date;
    timezone: string;
  }
): Promise<SrsGamificationResult> {
  const { learnerId, reviewOpId, qualifyingLocalDate, reviewedAt, timezone } = params;
  const localDateStr = qualifyingLocalDate.toISOString().slice(0, 10);

  let srsXp = 0;
  let questXp = 0;
  const earnedAchievements: AchievementDto[] = [];

  // 1. Award +1 XP for SCHEDULE review
  const rowsAffected = await tx.$executeRaw`
    INSERT INTO app.xp_events (
      learner_id, event_type, source_id, xp, local_date, created_at
    ) VALUES (
      ${learnerId}::uuid,
      'SRS_REVIEW',
      ${reviewOpId}::uuid,
      1,
      ${localDateStr}::date,
      ${reviewedAt}
    ) ON CONFLICT (learner_id, event_type, source_id) DO NOTHING
  `;
  if (rowsAffected > 0) srsXp = 1;

  // 2. Check and Award Daily Quest: REVIEW_10 (+10 XP)
  const rows = await tx.$queryRaw<Array<{ cnt: number }>>`
    SELECT COUNT(*)::int AS cnt
    FROM app.xp_events
    WHERE learner_id = ${learnerId}::uuid
      AND event_type = 'SRS_REVIEW'
      AND local_date = ${localDateStr}::date
  `;
  const reviewsToday = Number(rows[0]?.cnt ?? 0);

  if (reviewsToday >= 10) {
    const questSource = questSourceId(learnerId, localDateStr, 'REVIEW_10');
    const rowsAffected = await tx.$executeRaw`
      INSERT INTO app.xp_events (
        learner_id, event_type, source_id, xp, local_date, created_at
      ) VALUES (
        ${learnerId}::uuid,
        'DAILY_QUEST',
        ${questSource}::uuid,
        10,
        ${localDateStr}::date,
        ${reviewedAt}
      ) ON CONFLICT (learner_id, event_type, source_id) DO NOTHING
    `;
    if (rowsAffected > 0) questXp += 10;
  }

  // 3. Compute Streak
  const streakDto = await getLearnerStreak(tx, learnerId, timezone, reviewedAt);
  const streak = streakDto.currentStreak;

  // 4. Check Achievements:
  // WORDS_100: 100 distinct vocabulary identities reviewed via SCHEDULE
  const reviewRows = await tx.$queryRaw<Array<{ cnt: number }>>`
    SELECT COUNT(DISTINCT sc.vocabulary_id)::int AS cnt
    FROM app.srs_review_operations sro
    JOIN app.srs_cards sc ON sc.id = sro.card_id
    WHERE sro.learner_id = ${learnerId}::uuid
      AND sro.kind = 'SCHEDULE'
  `;
  const distinctVocabReviewed = Number(reviewRows[0]?.cnt ?? 0);

  if (distinctVocabReviewed >= 100) {
    const ach = await tryAwardAchievement(tx, learnerId, 'WORDS_100', reviewOpId, reviewedAt);
    if (ach) earnedAchievements.push(ach);
  }

  // STREAK_7 & STREAK_30
  if (streak >= 7) {
    const ach = await tryAwardAchievement(tx, learnerId, 'STREAK_7', reviewOpId, reviewedAt);
    if (ach) earnedAchievements.push(ach);
  }
  if (streak >= 30) {
    const ach = await tryAwardAchievement(tx, learnerId, 'STREAK_30', reviewOpId, reviewedAt);
    if (ach) earnedAchievements.push(ach);
  }

  return {
    srsXp,
    questXp,
    earnedAchievements,
    streak,
  };
}
