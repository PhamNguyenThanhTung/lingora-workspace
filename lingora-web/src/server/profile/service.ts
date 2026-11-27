import 'server-only';
import { loadLearnerContext, type LoadLearnerContextOptions } from '../context/loader.ts';
import type { CookieAdapter } from '../auth/index.ts';
import { getLearnerPrisma } from '../db/index.ts';
import { ContextServiceError } from '../context/dto.ts';
import { getGamificationOverview } from '../gamification/service.ts';
import { ACHIEVEMENTS } from '../gamification/metadata.ts';
import { normalizeStoredTimezone } from '../context/timezone.ts';
import { getDbTime } from '../srs/service.ts';
import { profilePatchSchema, type LearnerProfileDto, type LearnerProfilePatchDto } from './dto.ts';

export async function loadLearnerProfile(cookieStore?: CookieAdapter, options?: LoadLearnerContextOptions) {
  const identity = await loadLearnerContext(cookieStore, options);
  if (!identity.ok) return identity;
  const db = options?.prisma || getLearnerPrisma();
  const learnerId = identity.data.learner.id;
  const account = await db.account.findUnique({ where: { id: learnerId }, select: { displayName: true, activatedAt: true, uiLocale: true, timezone: true, rowVersion: true, role: true, status: true } });
  if (!account || account.role !== 'LEARNER' || account.status !== 'ACTIVE') throw new ContextServiceError(403, 'ACCOUNT_INACTIVE', 'Tài khoản học viên không hoạt động.');
  const tz = normalizeStoredTimezone(account.timezone);
  if (!tz.ok) throw new ContextServiceError(400, 'INVALID_TIMEZONE', 'Múi giờ tài khoản không hợp lệ.');
  const [overview, lessonsCompleted, srsCards, earned] = await Promise.all([
    getGamificationOverview(db, learnerId, tz.timezone, await getDbTime(db), 10),
    db.lessonCompletion.count({ where: { context: { learnerId } } }),
    db.srsCard.count({ where: { learnerId } }),
    db.learnerAchievement.findMany({ where: { learnerId } }),
  ]);
  const data: LearnerProfileDto = {
    displayName: account.displayName, activatedAt: account.activatedAt?.toISOString() ?? null,
    uiLocale: account.uiLocale, timezone: account.timezone, rowVersion: account.rowVersion.toString(),
    contexts: identity.data.contexts,
    totals: { xp: overview.totalXp, gems: overview.totalGems, lessonsCompleted, srsCards },
    streak: { current: overview.streak.currentStreak, longest: overview.streak.longestStreak },
    calendar28: overview.streak.activeDays,
    achievements: Object.values(ACHIEVEMENTS).map(definition => ({ ...definition, isUnlocked: earned.some((row: {achievementCode: string}) => row.achievementCode === definition.code), awardedAt: earned.find((row: {achievementCode: string; awardedAt: Date}) => row.achievementCode === definition.code)?.awardedAt.toISOString() ?? null })),
  };
  return { ok: true as const, status: 200 as const, data };
}

export async function patchLearnerProfile(learnerId: string, body: unknown, db = getLearnerPrisma()): Promise<LearnerProfilePatchDto> {
  const parsed = profilePatchSchema.safeParse(body);
  if (!parsed.success) throw new ContextServiceError(400, 'VALIDATION_ERROR', 'Tên phải có từ 1 đến 40 ký tự và không chứa ký tự điều khiển.');
  const {displayName, expectedRowVersion} = parsed.data;
  const updated = await db.account.updateMany({ where: { id: learnerId, role: 'LEARNER', status: 'ACTIVE', rowVersion: BigInt(expectedRowVersion) }, data: { displayName, rowVersion: { increment: 1 } } });
  if (updated.count !== 1) throw new ContextServiceError(409, 'PROFILE_CONFLICT', 'Hồ sơ đã thay đổi hoặc không còn hoạt động. Vui lòng tải lại.');
  return { displayName, rowVersion: (BigInt(expectedRowVersion) + 1n).toString() };
}
