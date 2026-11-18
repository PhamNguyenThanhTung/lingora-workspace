import 'server-only';
import crypto from 'node:crypto';
import { Prisma } from '../../../../lingora-admin/generated/product-client/index.js';
import { getLearnerPrisma } from '../db/index.ts';
import { ContextServiceError } from './dto.ts';
import {
  mapContextToSummaryDto,
  contextSelectWithRowVersion,
  clock,
} from './service.ts';
import {
  onboardingPreviewInputSchema,
  onboardingCompleteInputSchema,
  contextPlanUpdateInputSchema,
  type OnboardingPreviewInput,
  type OnboardingCompleteInput,
  type ContextPlanUpdateInput,
  type OnboardingPreviewData,
  type OnboardingCompleteData,
  type ContextPlanData,
  type ContextPlanUpdateData,
  type LearningPlanDto,
  type RecommendationSnapshotDto,
  ONBOARDING_VERSION,
} from './onboarding-dto.ts';
import {
  normalizePurpose,
  normalizeDailyGoal,
  normalizeInterests,
  normalizeOnboardingPreferences,
  mergeStudyPreferences,
  patchPreferences,
  parseRecommendationSnapshot,
} from './preferences.ts';
import {
  resolveRecommendation,
  loadNextLesson,
  formatLabels,
} from './curriculum.ts';

function fail(status: number, code: string, message: string): never {
  throw new ContextServiceError(status, code, message);
}

function computeCompleteOnboardingInputHash(input: {
  languageId: string;
  entryChoice: { startSource: 'DEFAULT'; courseId?: string } | { startSource: 'SELF_REPORT'; courseId?: string; levelId: string };
  purpose: string | null;
  dailyGoalMinutes: number;
  interests: string[];
  expectedCourseId: string;
  expectedStartLevelId: string;
}): string {
  const canonical = JSON.stringify({
    dailyGoalMinutes: input.dailyGoalMinutes,
    entryChoice: input.entryChoice.startSource === 'DEFAULT'
      ? input.entryChoice.courseId
        ? { courseId: input.entryChoice.courseId.toLowerCase(), startSource: 'DEFAULT' }
        : { startSource: 'DEFAULT' }
      : {
          courseId: input.entryChoice.courseId ? input.entryChoice.courseId.toLowerCase() : undefined,
          levelId: input.entryChoice.levelId.toLowerCase(),
          startSource: 'SELF_REPORT',
        },
    expectedCourseId: input.expectedCourseId.toLowerCase(),
    expectedStartLevelId: input.expectedStartLevelId.toLowerCase(),
    interests: [...input.interests].sort(),
    languageId: input.languageId.toLowerCase(),
    purpose: input.purpose,
  });
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

function computeUpdatePlanInputHash(input: {
  contextId: string;
  dailyGoalMinutes?: number;
  purpose?: string | null;
  interests?: string[];
  expectedRowVersion: string;
}): string {
  const canonical = JSON.stringify({
    contextId: input.contextId.toLowerCase(),
    dailyGoalMinutes: input.dailyGoalMinutes,
    expectedRowVersion: input.expectedRowVersion,
    interests: input.interests !== undefined ? normalizeInterests(input.interests) : undefined,
    purpose: input.purpose,
  });
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

async function currentCurriculum(db: any, context: {
  id: string;
  status: string;
  courseId: string;
  languageId: string;
  course: { id: string; languageId: string; frameworkId: string; isActive: boolean };
  language: { id: string; isLearnable: boolean };
  workingLevel: { id: string; frameworkId: string; position: number } | null;
}) {
  if (
    context.status !== 'ACTIVE' || !context.course.isActive || !context.language.isLearnable ||
    context.language.id !== context.languageId ||
    context.course.id !== context.courseId || context.course.languageId !== context.languageId ||
    !context.workingLevel || context.workingLevel.frameworkId !== context.course.frameworkId
  ) {
    return { hasCurriculum: false, nextLesson: null };
  }
  const completions = await db.lessonCompletion.findMany({
    where: { contextId: context.id },
    select: { lessonId: true },
  });
  return loadNextLesson(db, {
    courseId: context.courseId,
    frameworkId: context.course.frameworkId,
    workingLevel: context.workingLevel,
    completedLessonIds: new Set(completions.map((row: { lessonId: string }) => row.lessonId)),
    contextId: context.id,
  });
}

function formatPlanDto(plan: any): LearningPlanDto {
  const snapshot = parseRecommendationSnapshot(plan.recommendationSnapshot);
  return {
    id: plan.id,
    contextId: plan.contextId,
    courseId: plan.courseId,
    startLevel: {
      id: plan.startLevel.id,
      code: plan.startLevel.code,
      label: formatLabels(plan.startLevel.label),
      position: plan.startLevel.position,
    },
    source: plan.source,
    dailyGoalMinutes: plan.dailyGoalMinutes,
    status: plan.status,
    reasonCodes: snapshot.reasonCodes,
    createdAt: plan.createdAt instanceof Date ? plan.createdAt.toISOString() : plan.createdAt,
    replacedAt: plan.replacedAt ? (plan.replacedAt instanceof Date ? plan.replacedAt.toISOString() : plan.replacedAt) : null,
  };
}

/**
 * Returns read-only recommendation preview without side-effects.
 */
export async function getOnboardingPreview(
  verifiedUserId: string,
  rawInput: unknown,
  prismaOverride?: any
): Promise<OnboardingPreviewData> {
  const parsed = onboardingPreviewInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    fail(400, 'VALIDATION_ERROR', 'Dữ liệu đầu vào xem trước lộ trình không hợp lệ.');
  }
  const input = parsed.data;
  const db = prismaOverride || getLearnerPrisma();

  const normalized = normalizeOnboardingPreferences({
    purpose: input.purpose,
    dailyGoalMinutes: input.dailyGoalMinutes,
    interests: input.interests,
  });

  const recommendation = await resolveRecommendation(db, {
    languageId: input.languageId,
    purpose: normalized.purpose,
    dailyGoalMinutes: normalized.dailyGoalMinutes,
    entryChoice: input.entryChoice,
  });

  if (!recommendation) {
    return {
      status: 'NO_ELIGIBLE_CURRICULUM',
      message: 'Ngôn ngữ được chọn hiện chưa có bài học nào được phát hành. Vui lòng quay lại sau.',
    };
  }

  return {
    status: 'READY',
    course: {
      id: recommendation.course.id,
      names: recommendation.course.names,
    },
    startLevel: recommendation.startLevel,
    source: input.entryChoice.startSource,
    dailyGoalMinutes: normalized.dailyGoalMinutes,
    reasonCodes: recommendation.reasonCodes,
    nextLesson: recommendation.nextLesson,
  };
}

/**
 * Atomically creates LearningContext and its first ACTIVE LearningPlan,
 * with exact lock ordering: Account FOR NO KEY UPDATE -> Courses FOR SHARE -> Language FOR SHARE -> Content FOR SHARE.
 * Supports idempotent replay via CommandReceipt.
 */
export async function completeOnboarding(
  verifiedUserId: string,
  rawInput: unknown,
  prismaOverride?: any
): Promise<OnboardingCompleteData> {
  const parsed = onboardingCompleteInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    fail(400, 'VALIDATION_ERROR', 'Dữ liệu hoàn thành thiết lập lộ trình không hợp lệ.');
  }
  const input = parsed.data;
  const canonicalActorId = verifiedUserId.trim().toLowerCase();
  const db = prismaOverride || getLearnerPrisma();

  const normalized = normalizeOnboardingPreferences({
    purpose: input.purpose,
    dailyGoalMinutes: input.dailyGoalMinutes,
    interests: input.interests,
  });

  const inputHash = computeCompleteOnboardingInputHash({
    languageId: input.languageId,
    entryChoice: input.entryChoice,
    purpose: normalized.purpose,
    dailyGoalMinutes: normalized.dailyGoalMinutes,
    interests: normalized.interests,
    expectedCourseId: input.expectedCourseId,
    expectedStartLevelId: input.expectedStartLevelId,
  });

  return db.$transaction(
    async (tx: any) => {
      // 1. Lock Account FOR NO KEY UPDATE & verify role/status under lock
      await tx.$queryRaw`SELECT id::text FROM app.accounts WHERE id = ${canonicalActorId}::uuid FOR NO KEY UPDATE`;
      const account = await tx.account.findUnique({
        where: { id: canonicalActorId },
        select: { id: true, role: true, status: true },
      });
      if (!account || account.role !== 'LEARNER' || account.status !== 'ACTIVE') {
        fail(403, 'ACCOUNT_INACTIVE', 'Tài khoản học viên không hoạt động.');
      }

      // 2. Check CommandReceipt for COMPLETE_ONBOARDING (idempotency / dedupe)
      const existingReceipt = await tx.commandReceipt.findUnique({
        where: {
          actorId_command_operationKey: {
            actorId: canonicalActorId,
            command: 'COMPLETE_ONBOARDING',
            operationKey: input.contextId,
          },
        },
      });

      if (existingReceipt) {
        if (existingReceipt.inputHash !== inputHash || existingReceipt.targetId !== input.contextId) {
          fail(409, 'CONTEXT_CONFLICT', 'Yêu cầu mâu thuẫn với thao tác tạo lộ trình trước đó.');
        }

        const existingContext = await tx.learningContext.findFirst({
          where: { id: input.contextId, learnerId: canonicalActorId },
          select: {
            ...contextSelectWithRowVersion,
            language: { select: { id: true, code: true, names: true, isLearnable: true } },
            learningPlans: {
              where: { status: 'ACTIVE' },
              include: {
                startLevel: true,
                course: { include: { framework: true } },
              },
            },
          },
        });

        const activePlan = existingContext?.learningPlans[0];
        const receiptPlanId = (existingReceipt.safeResult as any)?.planId;
        if (!existingContext || !activePlan || activePlan.id !== receiptPlanId) {
          fail(409, 'CONTEXT_PLAN_REPLACED', 'Lộ trình học ban đầu đã bị thay thế hoặc không còn hiệu lực.');
        }

        const { nextLesson } = await currentCurriculum(tx, existingContext);

        return {
          context: mapContextToSummaryDto(existingContext),
          plan: formatPlanDto(activePlan),
          nextLesson,
        };
      }

      // 3. Check if contextId already exists without receipt
      const existingDirect = await tx.learningContext.findUnique({
        where: { id: input.contextId },
        select: { id: true },
      });
      if (existingDirect) {
        fail(409, 'CONTEXT_CONFLICT', 'Mã lộ trình đã được sử dụng.');
      }

      // 4. Enforce 2-ACTIVE contexts capacity
      const activeCount = await tx.learningContext.count({
        where: { learnerId: canonicalActorId, status: 'ACTIVE' },
      });
      if (activeCount >= 2) {
        fail(409, 'CONTEXT_CAPACITY_EXCEEDED', 'Mỗi học viên chỉ có thể mở tối đa 2 lộ trình học hoạt động.');
      }

      // 5. Enforce 1 context per language
      const sameLanguage = await tx.learningContext.findFirst({
        where: { learnerId: canonicalActorId, languageId: input.languageId },
        select: { id: true },
      });
      if (sameLanguage) {
        fail(409, 'CONTEXT_LANGUAGE_EXISTS', 'Học viên đã có lộ trình học cho ngôn ngữ này.');
      }

      // 6. Lock active Course(s) for Language in fixed ascending UUID order
      const candidateCourseRows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id::text
        FROM app.courses
        WHERE language_id = ${input.languageId}::uuid AND is_active = true
        ORDER BY id ASC
        FOR SHARE
      `;
      if (candidateCourseRows.length === 0) {
        fail(409, 'RECOMMENDATION_CHANGED', 'Ngôn ngữ chưa có khóa học nào sẵn sàng để học.');
      }

      // 7. Shared lock Language
      await tx.$queryRaw`SELECT id::text FROM app.languages WHERE id = ${input.languageId}::uuid FOR SHARE`;
      const language = await tx.language.findUnique({
        where: { id: input.languageId },
        select: { id: true, isLearnable: true },
      });
      if (!language || !language.isLearnable) {
        fail(409, 'RECOMMENDATION_CHANGED', 'Ngôn ngữ mục tiêu không khả dụng để học.');
      }

      // 8. Content shared locks (Levels, Units, Lessons, Revisions)
      for (const cRow of candidateCourseRows) {
        await tx.$queryRaw`
          SELECT lev.id::text
          FROM app.levels lev
          WHERE lev.id IN (
            SELECT DISTINCT u.level_id
            FROM app.units u
            WHERE u.course_id = ${cRow.id}::uuid
          )
          ORDER BY lev.id ASC
          FOR SHARE
        `;

        await tx.$queryRaw`
          SELECT u.id::text
          FROM app.units u
          WHERE u.course_id = ${cRow.id}::uuid
          ORDER BY u.id ASC
          FOR SHARE
        `;

        await tx.$queryRaw`
          SELECT l.id::text
          FROM app.lessons l
          JOIN app.units u ON u.id = l.unit_id
          WHERE u.course_id = ${cRow.id}::uuid
          ORDER BY l.id ASC
          FOR SHARE OF l
        `;

        await tx.$queryRaw`
          SELECT r.id::text
          FROM app.lesson_revisions r
          WHERE r.id IN (
            SELECT DISTINCT l.active_revision_id
            FROM app.lessons l
            JOIN app.units u ON u.id = l.unit_id
            WHERE u.course_id = ${cRow.id}::uuid
              AND l.active_revision_id IS NOT NULL
          )
          ORDER BY r.id ASC
          FOR SHARE
        `;
      }

      const activeCourseIds = (await tx.course.findMany({
        where: { languageId: input.languageId, isActive: true },
        orderBy: { id: 'asc' },
        select: { id: true },
      })).map((course: { id: string }) => course.id);
      if (activeCourseIds.length !== candidateCourseRows.length ||
          activeCourseIds.some((id: string, index: number) => id !== candidateCourseRows[index].id)) {
        fail(409, 'RECOMMENDATION_CHANGED', 'Danh sách khóa học đã thay đổi. Vui lòng xem lại lộ trình.');
      }

      // A saved SELF_REPORT preview can lose its last published lesson.
      const recommendation = await resolveRecommendation(tx, {
        languageId: input.languageId,
        purpose: normalized.purpose,
        entryChoice: input.entryChoice,
        contextId: input.contextId,
        courseIds: activeCourseIds,
      }).catch(error => {
        if (error instanceof ContextServiceError && error.code === 'LEVEL_NOT_ELIGIBLE') {
          fail(409, 'RECOMMENDATION_CHANGED', error.message);
        }
        throw error;
      });

      if (!recommendation) {
        fail(409, 'RECOMMENDATION_CHANGED', 'Khóa học chưa có bài học nào sẵn sàng để học.');
      }

      // Drift check: ensure recommendation still matches client preview expectation
      if (
        recommendation.course.id !== input.expectedCourseId ||
        recommendation.startLevel.id !== input.expectedStartLevelId
      ) {
        fail(
          409,
          'RECOMMENDATION_CHANGED',
          'Lộ trình đề xuất đã thay đổi do nội dung khóa học được cập nhật. Vui lòng xem lại trước khi lưu.'
        );
      }

      const serverDate = await clock(tx);
      const studyPreferences = mergeStudyPreferences({}, normalized, serverDate);

      // 10. Create LearningContext with exact start provenance
      const isSelfReport = input.entryChoice.startSource === 'SELF_REPORT';
      const createdContext = await tx.learningContext.create({
        data: {
          id: input.contextId,
          learnerId: canonicalActorId,
          languageId: input.languageId,
          courseId: recommendation.course.id,
          status: 'ACTIVE',
          purpose: normalized.purpose,
          studyPreferences,
          selectedStartLevelId: recommendation.startLevel.id,
          workingLevelId: recommendation.startLevel.id,
          startSource: input.entryChoice.startSource,
          selfReport: isSelfReport ? { levelId: recommendation.startLevel.id } : undefined,
          startResultId: null,
          createdAt: serverDate,
          updatedAt: serverDate,
          rowVersion: 1n,
        },
        select: contextSelectWithRowVersion,
      });

      // 11. Create first ACTIVE LearningPlan
      const snapshot: RecommendationSnapshotDto = {
        algorithmVersion: ONBOARDING_VERSION,
        normalizedPreferences: {
          purpose: normalized.purpose,
          dailyGoalMinutes: normalized.dailyGoalMinutes,
          interests: normalized.interests,
        },
        recommendedLessonId: recommendation.nextLesson ? recommendation.nextLesson.id : null,
        reasonCodes: recommendation.reasonCodes,
      };

      const createdPlan = await tx.learningPlan.create({
        data: {
          contextId: createdContext.id,
          courseId: recommendation.course.id,
          startLevelId: recommendation.startLevel.id,
          source: input.entryChoice.startSource,
          dailyGoalMinutes: normalized.dailyGoalMinutes,
          status: 'ACTIVE',
          recommendationSnapshot: snapshot,
          createdAt: serverDate,
        },
        include: {
          startLevel: true,
          course: { include: { framework: true } },
        },
      });

      // 12. Insert CommandReceipt for COMPLETE_ONBOARDING
      await tx.commandReceipt.create({
        data: {
          actorId: canonicalActorId,
          command: 'COMPLETE_ONBOARDING',
          operationKey: input.contextId,
          inputHash,
          targetId: input.contextId,
          safeResult: {
            contextId: input.contextId,
            planId: createdPlan.id,
          },
          committedAt: serverDate,
        },
      });

      return {
        context: mapContextToSummaryDto(createdContext),
        plan: formatPlanDto(createdPlan),
        nextLesson: recommendation.nextLesson,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 10000 }
  ).catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      fail(409, 'CONTEXT_CONFLICT', 'Mã lộ trình đã được sử dụng.');
    }
    throw error;
  });
}

/**
 * Reads the active plan and dynamically computed next lesson for a context.
 * Accessible even if context is PAUSED (with nextLesson: null).
 * Augments response with preferences and rowVersion for Home editor.
 */
async function readContextPlan(
  contextId: string,
  verifiedUserId: string,
  prismaOverride: any,
  summaryOnly: boolean
): Promise<ContextPlanData> {
  contextId = contextId.toLowerCase();
  const canonicalActorId = verifiedUserId.trim().toLowerCase();
  const db = prismaOverride || getLearnerPrisma();

  const context = await db.learningContext.findFirst({
    where: { id: contextId, learnerId: canonicalActorId },
    include: {
      course: { include: { framework: true } },
      language: { select: { id: true, isLearnable: true } },
      workingLevel: true,
      selectedStartLevel: true,
      learningPlans: {
        where: { status: 'ACTIVE' },
        include: {
          startLevel: true,
          course: { include: { framework: true } },
        },
      },
    },
  });

  if (!context) {
    fail(404, 'NOT_FOUND', 'Lộ trình học không tồn tại.');
  }

  const activePlan = context.learningPlans?.[0] ?? null;
  const currentPreferences = {
    purpose: normalizePurpose(context.purpose),
    dailyGoalMinutes: normalizeDailyGoal(
      (context.studyPreferences as any)?.dailyGoalMinutes ?? (activePlan ? activePlan.dailyGoalMinutes : 10)
    ),
    interests: normalizeInterests((context.studyPreferences as any)?.interests ?? []),
  };

  if (context.status === 'PAUSED') {
    return {
      status: 'PAUSED',
      plan: activePlan ? formatPlanDto(activePlan) : null,
      nextLesson: null,
      rowVersion: context.rowVersion.toString(),
      preferences: currentPreferences,
    };
  }

  if (!context.course.isActive || !context.language.isLearnable) {
    return {
      status: 'CURRICULUM_UNAVAILABLE',
      plan: activePlan ? formatPlanDto(activePlan) : null,
      nextLesson: null,
      rowVersion: context.rowVersion.toString(),
      preferences: currentPreferences,
    };
  }

  if (!activePlan) {
    return {
      status: 'NO_PLAN',
      plan: null,
      nextLesson: null,
      rowVersion: context.rowVersion.toString(),
      preferences: currentPreferences,
    };
  }

  const { hasCurriculum, nextLesson } = summaryOnly
    ? { hasCurriculum: true, nextLesson: null }
    : await currentCurriculum(db, context);
  return {
    status: hasCurriculum ? 'READY' : 'CURRICULUM_UNAVAILABLE',
    plan: formatPlanDto(activePlan),
    nextLesson,
    rowVersion: context.rowVersion.toString(),
    preferences: currentPreferences,
  };
}

export function getContextPlan(contextId: string, verifiedUserId: string, prismaOverride?: any) {
  return readContextPlan(contextId, verifiedUserId, prismaOverride, false);
}

export async function getContextPlanSummary(contextId: string, verifiedUserId: string, db: any) {
  const { plan, preferences } = await readContextPlan(contextId, verifiedUserId, db, true);
  return { plan, preferences };
}

/**
 * Updates learning context preferences and marks old plan REPLACED with CAS.
 * Enforces lock order: Account FOR NO KEY UPDATE -> Course FOR SHARE -> Language FOR SHARE -> Context FOR UPDATE.
 * Supports idempotent replay via CommandReceipt.
 */
export async function updateContextPlan(
  contextId: string,
  verifiedUserId: string,
  rawInput: unknown,
  prismaOverride?: any
): Promise<ContextPlanUpdateData> {
  const parsed = contextPlanUpdateInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    fail(400, 'VALIDATION_ERROR', 'Dữ liệu cập nhật lộ trình không hợp lệ.');
  }
  const input = parsed.data;
  contextId = contextId.toLowerCase();
  const canonicalActorId = verifiedUserId.trim().toLowerCase();
  const db = prismaOverride || getLearnerPrisma();

  const inputHash = computeUpdatePlanInputHash({
    contextId,
    dailyGoalMinutes: input.dailyGoalMinutes,
    purpose: input.purpose,
    interests: input.interests,
    expectedRowVersion: input.expectedRowVersion,
  });

  return db.$transaction(
    async (tx: any) => {
      // 1. Lock Account FOR NO KEY UPDATE & verify role/status under lock
      await tx.$queryRaw`SELECT id::text FROM app.accounts WHERE id = ${canonicalActorId}::uuid FOR NO KEY UPDATE`;
      const account = await tx.account.findUnique({
        where: { id: canonicalActorId },
        select: { id: true, role: true, status: true },
      });
      if (!account || account.role !== 'LEARNER' || account.status !== 'ACTIVE') {
        fail(403, 'ACCOUNT_INACTIVE', 'Tài khoản học viên không hoạt động.');
      }

      // 2. Check CommandReceipt for UPDATE_LEARNING_PLAN (idempotent replay)
      const existingReceipt = await tx.commandReceipt.findUnique({
        where: {
          actorId_command_operationKey: {
            actorId: canonicalActorId,
            command: 'UPDATE_LEARNING_PLAN',
            operationKey: input.operationId,
          },
        },
      });

      if (existingReceipt) {
        if (existingReceipt.inputHash !== inputHash || existingReceipt.targetId !== contextId) {
          fail(409, 'OPERATION_CONFLICT', 'Mã thao tác cập nhật đã được sử dụng với nội dung khác.');
        }

        const context = await tx.learningContext.findFirst({
          where: { id: contextId, learnerId: canonicalActorId },
          include: {
            course: { include: { framework: true } },
            language: { select: { id: true, isLearnable: true } },
            workingLevel: true,
            selectedStartLevel: true,
            learningPlans: {
              where: { status: 'ACTIVE' },
              include: {
                startLevel: true,
                course: { include: { framework: true } },
              },
            },
          },
        });

        const activePlan = context?.learningPlans[0];
        const receiptPlanId = (existingReceipt.safeResult as any)?.planId;
        if (!context || !activePlan || activePlan.id !== receiptPlanId) {
          fail(409, 'OPERATION_CONFLICT', 'Mã thao tác thuộc về bản lộ trình đã bị thay thế.');
        }

        if (context.status !== 'ACTIVE') {
          fail(403, 'CONTEXT_INACTIVE', 'Lộ trình học đang tạm dừng, không thể cập nhật.');
        }
        const { nextLesson } = await currentCurriculum(tx, context);

        return {
          plan: formatPlanDto(activePlan),
          nextLesson,
          rowVersion: context.rowVersion.toString(),
        };
      }

      // 3. Lock Course, Language, and Context in stable order
      const preContext = await tx.learningContext.findFirst({
        where: { id: contextId, learnerId: canonicalActorId },
        select: { id: true, courseId: true, languageId: true },
      });
      if (!preContext) {
        fail(404, 'NOT_FOUND', 'Lộ trình học không tồn tại.');
      }

      await tx.$queryRaw`SELECT id::text FROM app.courses WHERE id = ${preContext.courseId}::uuid FOR SHARE`;
      await tx.$queryRaw`SELECT id::text FROM app.languages WHERE id = ${preContext.languageId}::uuid FOR SHARE`;
      await tx.$queryRaw`SELECT id::text FROM app.learning_contexts WHERE id = ${contextId}::uuid FOR UPDATE`;

      // 4. Load context with locks held
      const context = await tx.learningContext.findFirst({
        where: { id: contextId, learnerId: canonicalActorId },
        include: {
          course: { include: { framework: true } },
          language: { select: { id: true, isLearnable: true } },
          workingLevel: true,
          selectedStartLevel: true,
          learningPlans: {
            where: { status: 'ACTIVE' },
            include: {
              startLevel: true,
              course: { include: { framework: true } },
            },
          },
        },
      });

      if (!context) {
        fail(404, 'NOT_FOUND', 'Lộ trình học không tồn tại.');
      }

      if (context.courseId !== preContext.courseId || context.languageId !== preContext.languageId) {
        fail(409, 'CONTEXT_CONFLICT', 'Lộ trình học đã thay đổi. Vui lòng tải lại.');
      }
      if (context.status !== 'ACTIVE') {
        fail(403, 'CONTEXT_INACTIVE', 'Lộ trình học đang tạm dừng, không thể cập nhật.');
      }

      // 5. CAS check
      if (context.rowVersion.toString() !== input.expectedRowVersion) {
        fail(
          409,
          'STALE_OPERATION',
          'Lộ trình học đã được cập nhật từ phiên khác. Vui lòng tải lại trước khi thử lại.'
        );
      }

      const activePlan = context.learningPlans[0] || null;
      const source = context.startSource;
      if (
        !context.selectedStartLevelId || !context.workingLevel ||
        !['DEFAULT', 'SELF_REPORT', 'PLACEMENT'].includes(source ?? '') ||
        context.selectedStartLevel?.frameworkId !== context.course.frameworkId
      ) {
        fail(409, 'CONTEXT_NO_START_LEVEL', 'Hãy chọn điểm bắt đầu trước khi lưu lộ trình học.');
      }

      if (await tx.learningPlan.findUnique({ where: { id: input.operationId }, select: { id: true } })) {
        fail(409, 'OPERATION_CONFLICT', 'Mã thao tác đã được sử dụng.');
      }

      // 6. Patch preferences with existing data
      const patched = patchPreferences(
        { purpose: context.purpose, studyPreferences: context.studyPreferences },
        { purpose: input.purpose, dailyGoalMinutes: input.dailyGoalMinutes, interests: input.interests }
      );

      // 7. Check if update is No-Op
      const snap = activePlan ? parseRecommendationSnapshot(activePlan.recommendationSnapshot) : null;
      const purposeEqual = context.purpose === patched.purpose;
      const dailyGoalEqual = activePlan?.dailyGoalMinutes === patched.dailyGoalMinutes;
      const currentInterests = snap?.normalizedPreferences.interests ?? [];
      const interestsEqual =
        currentInterests.length === patched.interests.length &&
        currentInterests.every((v, i) => v === patched.interests[i]);

      const isNoOp = purposeEqual && dailyGoalEqual && interestsEqual;

      const { nextLesson } = await currentCurriculum(tx, context);
      if (activePlan && isNoOp) {
        // Record receipt for no-op replay
        const serverDate = await clock(tx);
        await tx.commandReceipt.create({
          data: {
            actorId: canonicalActorId,
            command: 'UPDATE_LEARNING_PLAN',
            operationKey: input.operationId,
            inputHash,
            targetId: context.id,
            safeResult: {
              contextId: context.id,
              planId: activePlan.id,
            },
            committedAt: serverDate,
          },
        });

        return {
          plan: formatPlanDto(activePlan),
          nextLesson,
          rowVersion: context.rowVersion.toString(),
        };
      }

      // 8. Intent changed: mark old plan REPLACED, add new ACTIVE plan, increment context rowVersion
      const serverDate = await clock(tx);

      const updatedContext = await tx.learningContext.update({
        where: { id: context.id },
        data: {
          purpose: patched.purpose,
          studyPreferences: mergeStudyPreferences(patched.updatedStudyPreferences, patched, serverDate),
          rowVersion: context.rowVersion + 1n,
          updatedAt: serverDate,
        },
      });

      if (activePlan) {
        await tx.learningPlan.update({
          where: { id: activePlan.id },
          data: { status: 'REPLACED', replacedAt: serverDate },
        });
      }

      const sourceReason = source === 'SELF_REPORT' ? 'SELF_REPORTED_LEVEL'
        : source === 'PLACEMENT' ? 'PLACEMENT_RECOMMENDED_LEVEL' : 'LOWEST_AVAILABLE_LEVEL';
      const reasonCodes = snap?.reasonCodes.filter(code => code === sourceReason ||
        (code === 'PURPOSE_MATCH' && snap.normalizedPreferences.purpose === patched.purpose));

      const newSnapshot: RecommendationSnapshotDto = {
        algorithmVersion: ONBOARDING_VERSION,
        normalizedPreferences: {
          purpose: patched.purpose,
          dailyGoalMinutes: patched.dailyGoalMinutes,
          interests: patched.interests,
        },
        recommendedLessonId: nextLesson?.id ?? null,
        reasonCodes: reasonCodes?.length ? reasonCodes : [sourceReason],
      };

      const newPlan = await tx.learningPlan.create({
        data: {
          id: input.operationId,
          contextId: context.id,
          courseId: context.courseId,
          startLevelId: context.selectedStartLevelId,
          source,
          dailyGoalMinutes: patched.dailyGoalMinutes,
          status: 'ACTIVE',
          recommendationSnapshot: newSnapshot,
          createdAt: serverDate,
        },
        include: {
          startLevel: true,
          course: { include: { framework: true } },
        },
      });

      // Insert CommandReceipt for UPDATE_LEARNING_PLAN
      await tx.commandReceipt.create({
        data: {
          actorId: canonicalActorId,
          command: 'UPDATE_LEARNING_PLAN',
          operationKey: input.operationId,
          inputHash,
          targetId: context.id,
          safeResult: {
            contextId: context.id,
            planId: newPlan.id,
          },
          committedAt: serverDate,
        },
      });

      return {
        plan: formatPlanDto(newPlan),
        nextLesson,
        rowVersion: updatedContext.rowVersion.toString(),
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 10000 }
  ).catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      fail(409, 'OPERATION_CONFLICT', 'Mã thao tác đã được sử dụng.');
    }
    throw error;
  });
}
