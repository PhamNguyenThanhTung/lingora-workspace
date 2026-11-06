import 'server-only';
import { Prisma } from '../../../../lingora-admin/generated/product-client/index.js';
import { getLearnerPrisma } from '../db/index.ts';
import {
  contextCreateSchema,
  contextPatchSchema,
  contextStartSchema,
  ContextServiceError,
  isValidUuid,
  type ContextCreateInput,
  type ContextPatchInput,
  type ContextStartInput,
  type ContextOptionsData,
  type LearningContextSummaryDto,
  type CourseOptionDto,
  type LanguageOptionDto,
  type LevelOptionDto,
} from './dto.ts';

export function fail(status: number, code: string, message: string): never {
  throw new ContextServiceError(status, code, message);
}

export { isValidUuid };

export async function clock(db: any): Promise<Date> {
  const rows = await db.$queryRaw<Array<{ ts: Date }>>`SELECT clock_timestamp() AS ts`;
  if (!(rows[0]?.ts instanceof Date) || !Number.isFinite(rows[0].ts.valueOf())) {
    throw new ContextServiceError(503, 'SERVICE_UNAVAILABLE', 'Không thể xác định thời gian cơ sở dữ liệu.');
  }
  return rows[0].ts;
}

export function isPublishedLesson(lesson: any): boolean {
  return (
    lesson.availability === 'AVAILABLE' &&
    !!lesson.activeRevisionId &&
    lesson.activeRevision?.id === lesson.activeRevisionId &&
    lesson.activeRevision?.lessonId === lesson.id &&
    lesson.activeRevision?.status === 'PUBLISHED'
  );
}

export const contextSelectWithRowVersion = {
  id: true,
  learnerId: true,
  languageId: true,
  courseId: true,
  status: true,
  rowVersion: true,
  startSource: true,
  selectedStartLevelId: true,
  workingLevelId: true,
  language: { select: { id: true, code: true, names: true } },
  course: {
    select: {
      id: true,
      languageId: true,
      frameworkId: true,
      names: true,
      isActive: true,
      framework: { select: { id: true, code: true, version: true, names: true } },
    },
  },
  selectedStartLevel: { select: { id: true, frameworkId: true, code: true, label: true, position: true } },
  workingLevel: { select: { id: true, frameworkId: true, code: true, label: true, position: true } },
} as const;

export function mapContextToSummaryDto(c: any): LearningContextSummaryDto {
  return {
    id: c.id,
    status: c.status,
    rowVersion: (c.rowVersion ?? 1n).toString(),
    startSource: c.startSource ?? null,
    targetLanguage: {
      id: c.language.id,
      code: c.language.code,
      names: c.language.names,
    },
    course: {
      id: c.course.id,
      names: c.course.names,
      isActive: c.course.isActive,
    },
    framework: {
      id: c.course.framework.id,
      code: c.course.framework.code,
      version: c.course.framework.version,
      names: c.course.framework.names,
    },
    selectedStartLevel: c.selectedStartLevel
      ? {
          id: c.selectedStartLevel.id,
          code: c.selectedStartLevel.code,
          label: c.selectedStartLevel.label,
          position: c.selectedStartLevel.position,
        }
      : null,
    workingLevel: c.workingLevel
      ? {
          id: c.workingLevel.id,
          code: c.workingLevel.code,
          label: c.workingLevel.label,
          position: c.workingLevel.position,
        }
      : null,
  };
}

/**
 * Loads context creation options for the authenticated Learner.
 * Returns safe projection of learnable languages, active courses, and eligible published-content levels.
 */
export async function loadContextOptions(
  verifiedUserId: string,
  prismaOverride?: any
): Promise<ContextOptionsData> {
  const db = prismaOverride || getLearnerPrisma();

  const account = await db.account.findUnique({
    where: { id: verifiedUserId },
    select: { id: true, role: true, status: true },
  });
  if (!account || account.role !== 'LEARNER' || account.status !== 'ACTIVE') {
    fail(403, 'FORBIDDEN', 'Tài khoản không thuộc phân hệ học viên hoạt động.');
  }

  const languages = await db.language.findMany({
    where: { isLearnable: true },
    orderBy: [{ code: 'asc' }],
    select: {
      id: true,
      code: true,
      names: true,
    },
  });

  const languageOptions: LanguageOptionDto[] = [];

  for (const lang of languages) {
    const courses = await db.course.findMany({
      where: { languageId: lang.id, isActive: true },
      orderBy: [{ id: 'asc' }],
      include: {
        framework: {
          select: {
            id: true,
            code: true,
            version: true,
            names: true,
          },
        },
      },
    });

    const courseOptions: CourseOptionDto[] = [];

    for (const course of courses) {
      const units = await db.unit.findMany({
        where: {
          courseId: course.id,
          level: { frameworkId: course.frameworkId },
        },
        include: {
          level: {
            select: {
              id: true,
              code: true,
              label: true,
              position: true,
              frameworkId: true,
            },
          },
          lessons: {
            where: {
              availability: 'AVAILABLE',
              activeRevisionId: { not: null },
            },
            include: {
              activeRevision: {
                select: {
                  id: true,
                  lessonId: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: [{ level: { position: 'asc' } }, { position: 'asc' }],
      });

      // Group units by level and identify levels with published lessons
      const eligibleLevelMap = new Map<string, LevelOptionDto>();

      for (const unit of units) {
        if (!unit.level || unit.level.frameworkId !== course.frameworkId) continue;
        const hasPublished = unit.lessons.some(isPublishedLesson);
        if (hasPublished) {
          if (!eligibleLevelMap.has(unit.level.id)) {
            eligibleLevelMap.set(unit.level.id, {
              id: unit.level.id,
              code: unit.level.code,
              label: unit.level.label as Record<string, any>,
              position: unit.level.position,
            });
          }
        }
      }

      const eligibleLevels = Array.from(eligibleLevelMap.values()).sort(
        (a, b) => a.position - b.position || a.id.localeCompare(b.id)
      );

      const defaultLevelId = eligibleLevels.length > 0 ? eligibleLevels[0].id : null;

      courseOptions.push({
        id: course.id,
        names: course.names as Record<string, any>,
        isActive: course.isActive,
        framework: {
          id: course.framework.id,
          code: course.framework.code,
          version: course.framework.version,
          names: course.framework.names as Record<string, any>,
        },
        defaultLevelId,
        levels: eligibleLevels,
      });
    }

    languageOptions.push({
      id: lang.id,
      code: lang.code,
      names: lang.names as Record<string, any>,
      courses: courseOptions,
    });
  }

  return { languages: languageOptions };
}

/**
 * Shared starting level resolution for DEFAULT and SELF_REPORT.
 * Enforces course content shared locks, hierarchy validation, and content presence.
 */
export async function resolveStartingLevel(
  tx: any,
  course: any,
  input: { startSource: 'DEFAULT' } | { startSource: 'SELF_REPORT'; levelId: string }
): Promise<{
  selectedStartLevelId: string;
  workingLevelId: string;
  resolvedStartSource: 'DEFAULT' | 'SELF_REPORT';
  selfReport?: { levelId: string };
}> {
  if (input.startSource === 'DEFAULT') {
    // Complete stable Course content shared lock set in fixed ascending UUID order:
    // 1. All Levels referenced by this Course's Units
    const lockedLevels = await tx.$queryRaw<Array<{ id: string; position?: number }>>`
      SELECT lev.id::text, lev.position
      FROM app.levels lev
      WHERE lev.id IN (
        SELECT DISTINCT u.level_id
        FROM app.units u
        WHERE u.course_id = ${course.id}::uuid
      )
      ORDER BY lev.id ASC
      FOR SHARE
    `;
    const heldLevelIds = new Set(lockedLevels.map((l: any) => l.id.toLowerCase()));

    // 2. This Course's Units
    const lockedUnits = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT u.id::text
      FROM app.units u
      WHERE u.course_id = ${course.id}::uuid
      ORDER BY u.id ASC
      FOR SHARE
    `;
    const heldUnitIds = new Set(lockedUnits.map((u: any) => u.id.toLowerCase()));

    // 3. ALL existing Lessons in those Units (including PLANNED/WITHDRAWN and null active revision)
    const lockedLessons = await tx.$queryRaw<Array<{ id: string; activeRevisionId: string | null }>>`
      SELECT l.id::text, l.active_revision_id::text AS "activeRevisionId"
      FROM app.lessons l
      JOIN app.units u ON u.id = l.unit_id
      WHERE u.course_id = ${course.id}::uuid
      ORDER BY l.id ASC
      FOR SHARE OF l
    `;
    const heldLessonIds = new Set(lockedLessons.map((l: any) => l.id.toLowerCase()));

    // 4. Each exact active Revision referenced by the now-locked Lesson rows
    const activeRevIds = [
      ...new Set(
        lockedLessons
          .map((l: any) => l.activeRevisionId?.toLowerCase())
          .filter((id: any): id is string => Boolean(id))
      ),
    ].sort();

    let lockedRevisions: Array<{ id: string; lessonId: string; status: string }> = [];
    if (activeRevIds.length > 0) {
      lockedRevisions = await tx.$queryRaw<Array<{ id: string; lessonId: string; status: string }>>`
        SELECT r.id::text, r.lesson_id::text AS "lessonId", r.status
        FROM app.lesson_revisions r
        WHERE r.id IN (
          SELECT DISTINCT l.active_revision_id
          FROM app.lessons l
          JOIN app.units u ON u.id = l.unit_id
          WHERE u.course_id = ${course.id}::uuid
            AND l.active_revision_id IS NOT NULL
        )
        ORDER BY r.id ASC
        FOR SHARE
      `;
    }
    const heldRevisionIds = new Set(lockedRevisions.map((r: any) => r.id.toLowerCase()));

    // Drift checks: verify counts match held sets
    if (typeof tx.unit?.count === 'function') {
      const currentUnitCount = await tx.unit.count({
        where: { courseId: course.id },
      });
      if (currentUnitCount !== heldUnitIds.size) {
        fail(409, 'CONTEXT_CONFLICT', 'Cấu trúc khóa học đã thay đổi trong quá trình xử lý.');
      }
    }

    if (typeof tx.lesson?.count === 'function' && heldUnitIds.size > 0) {
      const currentLessonCount = await tx.lesson.count({
        where: { unit: { courseId: course.id } },
      });
      if (currentLessonCount !== heldLessonIds.size) {
        fail(409, 'CONTEXT_CONFLICT', 'Cấu trúc bài học đã thay đổi trong quá trình xử lý.');
      }
    }

    // Derive DEFAULT only from fresh rows strictly within held sets
    const units = heldUnitIds.size > 0
      ? await tx.unit.findMany({
          where: {
            id: { in: Array.from(heldUnitIds) },
            courseId: course.id,
          },
          include: {
            level: true,
            lessons: {
              where: {
                id: { in: Array.from(heldLessonIds) },
              },
              include: {
                activeRevision: true,
              },
            },
          },
        })
      : [];

    const eligibleLevelMap = new Map<string, any>();
    for (const unit of units) {
      if (!unit.level || unit.level.frameworkId.toLowerCase() !== course.frameworkId.toLowerCase()) continue;
      if (!heldLevelIds.has(unit.level.id.toLowerCase())) {
        fail(409, 'CONTEXT_CONFLICT', 'Trình độ bài học đã thay đổi trong quá trình xử lý.');
      }

      for (const lesson of unit.lessons) {
        if (!heldLessonIds.has(lesson.id.toLowerCase())) {
          fail(409, 'CONTEXT_CONFLICT', 'Bài học không nằm trong tập được bảo vệ.');
        }
        if (lesson.activeRevisionId && !heldRevisionIds.has(lesson.activeRevisionId.toLowerCase())) {
          fail(409, 'CONTEXT_CONFLICT', 'Phiên bản bài học đã thay đổi trong quá trình xử lý.');
        }
      }

      if (unit.lessons.some(isPublishedLesson)) {
        const lvlId = unit.level.id.toLowerCase();
        if (!eligibleLevelMap.has(lvlId)) {
          eligibleLevelMap.set(lvlId, unit.level);
        }
      }
    }

    const eligibleLevels = Array.from(eligibleLevelMap.values()).sort(
      (a, b) => a.position - b.position || a.id.localeCompare(b.id)
    );

    if (eligibleLevels.length === 0) {
      fail(
        409,
        'COURSE_NO_AVAILABLE_LESSONS',
        'Khóa học chưa có bài học nào sẵn sàng để học. Vui lòng quay lại sau.'
      );
    }

    return {
      selectedStartLevelId: eligibleLevels[0].id.toLowerCase(),
      workingLevelId: eligibleLevels[0].id.toLowerCase(),
      resolvedStartSource: 'DEFAULT',
    };
  } else {
    // SELF_REPORT
    await tx.$queryRaw`SELECT id::text FROM app.levels WHERE id = ${input.levelId}::uuid FOR SHARE`;
    const targetLevel = await tx.level.findUnique({
      where: { id: input.levelId },
    });
    if (!targetLevel || targetLevel.frameworkId.toLowerCase() !== course.frameworkId.toLowerCase()) {
      fail(
        400,
        'LEVEL_INVALID',
        'Trình độ được chọn không thuộc khung năng lực của khóa học.'
      );
    }

    const publishedLessonsInLevel = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT l.id::text
      FROM app.lessons l
      JOIN app.units u ON u.id = l.unit_id
      JOIN app.lesson_revisions r ON r.id = l.active_revision_id AND r.lesson_id = l.id
      WHERE u.course_id = ${course.id}::uuid
        AND u.level_id = ${input.levelId}::uuid
        AND l.availability = 'AVAILABLE'
        AND r.status = 'PUBLISHED'
      FOR SHARE
    `;

    if (publishedLessonsInLevel.length === 0) {
      fail(
        409,
        'LEVEL_NOT_ELIGIBLE',
        'Trình độ được chọn hiện chưa có bài học nào được phát hành.'
      );
    }

    return {
      selectedStartLevelId: targetLevel.id.toLowerCase(),
      workingLevelId: targetLevel.id.toLowerCase(),
      resolvedStartSource: 'SELF_REPORT',
      selfReport: { levelId: targetLevel.id.toLowerCase() },
    };
  }
}

/**
 * Creates a new LearningContext for the authenticated Learner.
 * Strictly checks actor lock, idempotency / dedup, 2-ACTIVE capacity, Course / Language validity,
 * resolves starting level (DEFAULT or SELF_REPORT), and serializes context creation.
 */
export async function createLearningContext(
  verifiedUserId: string,
  rawInput: unknown,
  prismaOverride?: any
): Promise<LearningContextSummaryDto> {
  const parsed = contextCreateSchema.safeParse(rawInput);
  if (!parsed.success) {
    fail(400, 'VALIDATION_ERROR', 'Dữ liệu tạo lộ trình không hợp lệ.');
  }
  const input = parsed.data;
  const canonicalActorId = verifiedUserId.trim().toLowerCase();

  const db = prismaOverride || getLearnerPrisma();

  return db.$transaction(
    async (tx: any) => {
      // 1. Lock & verify Account
      await tx.$queryRaw`SELECT id::text FROM app.accounts WHERE id = ${canonicalActorId}::uuid FOR NO KEY UPDATE`;
      const account = await tx.account.findUnique({
        where: { id: canonicalActorId },
        select: { id: true, role: true, status: true },
      });
      if (!account || account.role !== 'LEARNER' || account.status !== 'ACTIVE') {
        fail(403, 'ACCOUNT_INACTIVE', 'Tài khoản học viên không hoạt động.');
      }

      // 2. Dedup & conflict check by contextId
      const existingById = await tx.learningContext.findUnique({
        where: { id: input.contextId },
        select: contextSelectWithRowVersion,
      });

      if (existingById) {
        if (existingById.learnerId.toLowerCase() !== canonicalActorId) {
          // Foreign id gives opaque conflict without leaking owner
          fail(409, 'CONTEXT_CONFLICT', 'Mã định danh lộ trình đã tồn tại.');
        }

        // Matching owned initial selection replays persisted row
        const matchCourse = existingById.courseId.toLowerCase() === input.courseId;
        const matchLanguage = existingById.languageId.toLowerCase() === input.languageId;
        let matchStartSource = (existingById.startSource || '').toUpperCase() === input.startSource;
        if (input.startSource === 'DEFAULT' && existingById.startSource === null) {
          matchStartSource = true;
        }
        let matchLevel = true;
        if (input.startSource === 'SELF_REPORT') {
          matchLevel = (existingById.selectedStartLevelId || '').toLowerCase() === input.levelId;
        }

        if (matchCourse && matchLanguage && matchStartSource && matchLevel) {
          return mapContextToSummaryDto(existingById);
        }

        fail(409, 'CONTEXT_CONFLICT', 'Mã lộ trình đã được sử dụng với cấu hình khác.');
      }

      // 3. Single-language uniqueness check: one context per learner + language
      const existingByLang = await tx.learningContext.findUnique({
        where: {
          learnerId_languageId: {
            learnerId: canonicalActorId,
            languageId: input.languageId,
          },
        },
        select: contextSelectWithRowVersion,
      });

      if (existingByLang) {
        fail(
          409,
          'CONTEXT_ALREADY_EXISTS_FOR_LANGUAGE',
          'Bạn đã có một lộ trình học cho ngôn ngữ này.'
        );
      }

      // 4. Capacity check: at most two ACTIVE contexts
      const activeCount = await tx.learningContext.count({
        where: { learnerId: canonicalActorId, status: 'ACTIVE' },
      });
      if (activeCount >= 2) {
        fail(
          409,
          'CAPACITY_EXCEEDED',
          'Bạn đã đạt giới hạn tối đa 2 lộ trình học đang hoạt động.'
        );
      }

      // 5. Shared lock & validate Course
      await tx.$queryRaw`SELECT id::text FROM app.courses WHERE id = ${input.courseId}::uuid FOR SHARE`;
      const course = await tx.course.findUnique({
        where: { id: input.courseId },
        include: { language: true, framework: true },
      });
      if (!course || !course.isActive) {
        fail(403, 'COURSE_INACTIVE', 'Khóa học không khả dụng hoặc đã tạm khóa.');
      }
      if (course.languageId.toLowerCase() !== input.languageId || course.language.id.toLowerCase() !== input.languageId) {
        fail(409, 'CONTEXT_INCONSISTENT', 'Khóa học không khớp ngôn ngữ mục tiêu.');
      }

      // 6. Shared lock & validate Language (Finding 3)
      await tx.$queryRaw`SELECT id::text FROM app.languages WHERE id = ${input.languageId}::uuid FOR SHARE`;
      const language = await tx.language.findUnique({
        where: { id: input.languageId },
      });
      if (!language || !language.isLearnable) {
        fail(409, 'LANGUAGE_NOT_LEARNABLE', 'Ngôn ngữ mục tiêu không khả dụng để học.');
      }

      // 7. Starting level resolution
      const {
        selectedStartLevelId,
        workingLevelId,
        resolvedStartSource,
        selfReport,
      } = await resolveStartingLevel(tx, course, input);

      // 8. Insert LearningContext
      await tx.learningContext.create({
        data: {
          id: input.contextId,
          learnerId: canonicalActorId,
          languageId: input.languageId,
          courseId: input.courseId,
          status: 'ACTIVE',
          purpose: null,
          studyPreferences: {},
          studyFocus: 'BALANCED',
          selectedStartLevelId,
          workingLevelId,
          startSource: resolvedStartSource,
          selfReport,
          startResultId: null,
          rowVersion: 1n,
        },
      });

      const inserted = await tx.learningContext.findUnique({
        where: { id: input.contextId },
        select: contextSelectWithRowVersion,
      });

      return mapContextToSummaryDto(inserted);
    },
    { isolationLevel: 'ReadCommitted', timeout: 15000 }
  );
}

/**
 * Desired-state CAS lifecycle transition (ACTIVE / PAUSED) for an owned LearningContext.
 * Respects rowVersion, two-ACTIVE capacity on resume, course status on resume, and locks context FOR UPDATE.
 */
export async function patchLearningContext(
  verifiedUserId: string,
  contextId: string,
  rawInput: unknown,
  prismaOverride?: any
): Promise<LearningContextSummaryDto> {
  if (!isValidUuid(contextId)) {
    fail(400, 'VALIDATION_ERROR', 'Mã định danh lộ trình không hợp lệ.');
  }

  const canonicalContextId = contextId.trim().toLowerCase();
  const canonicalActorId = verifiedUserId.trim().toLowerCase();

  const parsed = contextPatchSchema.safeParse(rawInput);
  if (!parsed.success) {
    fail(400, 'VALIDATION_ERROR', 'Dữ liệu cập nhật lộ trình không hợp lệ.');
  }
  const { status: targetStatus, expectedRowVersion } = parsed.data;

  const db = prismaOverride || getLearnerPrisma();

  return db.$transaction(
    async (tx: any) => {
      // 1. Lock & verify Account
      await tx.$queryRaw`SELECT id::text FROM app.accounts WHERE id = ${canonicalActorId}::uuid FOR NO KEY UPDATE`;
      const account = await tx.account.findUnique({
        where: { id: canonicalActorId },
        select: { id: true, role: true, status: true },
      });
      if (!account || account.role !== 'LEARNER' || account.status !== 'ACTIVE') {
        fail(403, 'ACCOUNT_INACTIVE', 'Tài khoản học viên không hoạt động.');
      }

      // 2. Candidate Context lookup (Foreign 404)
      const candidate = await tx.learningContext.findFirst({
        where: { id: canonicalContextId, learnerId: canonicalActorId },
        select: { id: true, courseId: true, languageId: true },
      });
      if (!candidate) {
        fail(404, 'NOT_FOUND', 'Lộ trình học không tồn tại.');
      }

      // 3. Shared lock Course
      await tx.$queryRaw`SELECT id::text FROM app.courses WHERE id = ${candidate.courseId}::uuid FOR SHARE`;

      // 4. Shared lock Language (Finding 3)
      await tx.$queryRaw`SELECT id::text FROM app.languages WHERE id = ${candidate.languageId}::uuid FOR SHARE`;

      // 5. Lock Context FOR UPDATE (preserves actor -> Course -> Language -> Context lock order)
      await tx.$queryRaw`SELECT id::text FROM app.learning_contexts WHERE id = ${canonicalContextId}::uuid FOR UPDATE`;
      const context = await tx.learningContext.findFirst({
        where: { id: canonicalContextId, learnerId: canonicalActorId },
        select: contextSelectWithRowVersion,
      });
      if (!context || context.courseId.toLowerCase() !== candidate.courseId.toLowerCase() || context.languageId.toLowerCase() !== candidate.languageId.toLowerCase()) {
        fail(409, 'CONTEXT_INCONSISTENT', 'Lộ trình học đã thay đổi. Vui lòng tải lại.');
      }

      const course = await tx.course.findUnique({
        where: { id: context.courseId },
      });
      if (!course) {
        fail(409, 'CONTEXT_INCONSISTENT', 'Khóa học của lộ trình không tồn tại.');
      }

      // 6. Desired-state CAS logic
      const currentVersion = (context.rowVersion ?? 1n).toString();
      const expVersion = expectedRowVersion;

      if (currentVersion === expVersion) {
        if (context.status === targetStatus) {
          // Already at desired state: no-op, return current DTO
          return mapContextToSummaryDto(context);
        }

        // Transition:
        if (targetStatus === 'ACTIVE') {
          // Resume: check capacity and course/language availability
          const activeCount = await tx.learningContext.count({
            where: { learnerId: canonicalActorId, status: 'ACTIVE' },
          });
          if (activeCount >= 2) {
            fail(
              409,
              'CAPACITY_EXCEEDED',
              'Bạn đã đạt giới hạn tối đa 2 lộ trình học đang hoạt động.'
            );
          }

          if (!course.isActive) {
            fail(
              403,
              'COURSE_INACTIVE',
              'Khóa học đã bị tạm khóa, không thể tiếp tục lộ trình.'
            );
          }

          const lang = await tx.language.findUnique({
            where: { id: context.languageId },
          });
          if (!lang || !lang.isLearnable) {
            fail(
              403,
              'LANGUAGE_NOT_LEARNABLE',
              'Ngôn ngữ mục tiêu không còn khả dụng để học.'
            );
          }
        }

        // Apply status transition: update status, row_version + 1, updated_at = now
        const now = await clock(tx);
        await tx.$executeRaw`
          UPDATE app.learning_contexts
          SET status = ${targetStatus},
              row_version = row_version + 1,
              updated_at = ${now}
          WHERE id = ${canonicalContextId}::uuid
        `;

        const updated = await tx.learningContext.findFirst({
          where: { id: canonicalContextId },
          select: contextSelectWithRowVersion,
        });

        return mapContextToSummaryDto(updated);
      }

      if (
        BigInt(currentVersion) === BigInt(expVersion) + 1n &&
        context.status === targetStatus
      ) {
        // Replay of already applied transition
        return mapContextToSummaryDto(context);
      }

      // Stale row version or mismatched status replay
      fail(
        409,
        'STALE_ROW_VERSION',
        'Phiên bản lộ trình học không khớp hoặc đã thay đổi. Vui lòng tải lại trang.'
      );
    },
    { isolationLevel: 'ReadCommitted', timeout: 15000 }
  );
}

/**
 * Safe initial-level selection and recovery for an existing ACTIVE LearningContext
 * with null initial levels and zero learning history.
 * Lock order: Account -> Course(shared) -> Language(shared) -> Context FOR UPDATE.
 */
export async function startLearningContext(
  verifiedUserId: string,
  contextId: string,
  rawInput: unknown,
  prismaOverride?: any
): Promise<LearningContextSummaryDto> {
  if (!isValidUuid(contextId)) {
    fail(400, 'VALIDATION_ERROR', 'Mã định danh lộ trình không hợp lệ.');
  }

  const canonicalContextId = contextId.trim().toLowerCase();
  const canonicalActorId = verifiedUserId.trim().toLowerCase();

  const parsed = contextStartSchema.safeParse(rawInput);
  if (!parsed.success) {
    fail(400, 'VALIDATION_ERROR', 'Dữ liệu chọn trình độ khởi điểm không hợp lệ.');
  }
  const input = parsed.data;

  const db = prismaOverride || getLearnerPrisma();

  return db.$transaction(
    async (tx: any) => {
      // 1. Lock & verify Account
      await tx.$queryRaw`SELECT id::text FROM app.accounts WHERE id = ${canonicalActorId}::uuid FOR NO KEY UPDATE`;
      const account = await tx.account.findUnique({
        where: { id: canonicalActorId },
        select: { id: true, role: true, status: true },
      });
      if (!account || account.role !== 'LEARNER' || account.status !== 'ACTIVE') {
        fail(403, 'ACCOUNT_INACTIVE', 'Tài khoản học viên không hoạt động.');
      }

      // 2. Candidate Context lookup (Foreign 404)
      const candidate = await tx.learningContext.findFirst({
        where: { id: canonicalContextId, learnerId: canonicalActorId },
        select: { id: true, courseId: true, languageId: true },
      });
      if (!candidate) {
        fail(404, 'NOT_FOUND', 'Lộ trình học không tồn tại.');
      }

      // 3. Shared lock Course
      await tx.$queryRaw`SELECT id::text FROM app.courses WHERE id = ${candidate.courseId}::uuid FOR SHARE`;

      // 4. Shared lock Language
      await tx.$queryRaw`SELECT id::text FROM app.languages WHERE id = ${candidate.languageId}::uuid FOR SHARE`;

      // 5. Lock Context FOR UPDATE (preserves lock order: Account -> Course -> Language -> Context)
      await tx.$queryRaw`SELECT id::text FROM app.learning_contexts WHERE id = ${canonicalContextId}::uuid FOR UPDATE`;
      const context = await tx.learningContext.findFirst({
        where: { id: canonicalContextId, learnerId: canonicalActorId },
        select: {
          ...contextSelectWithRowVersion,
          startResultId: true,
          selfReport: true,
          _count: {
            select: {
              lessonConsumptions: true,
              lessonAttempts: true,
              lessonCompletions: true,
              assessmentAttempts: true,
            },
          },
        },
      });
      if (
        !context ||
        context.courseId.toLowerCase() !== candidate.courseId.toLowerCase() ||
        context.languageId.toLowerCase() !== candidate.languageId.toLowerCase()
      ) {
        fail(409, 'CONTEXT_INCONSISTENT', 'Lộ trình học đã thay đổi. Vui lòng tải lại.');
      }

      // 6. Check context status: must be ACTIVE
      if (context.status !== 'ACTIVE') {
        fail(409, 'CONTEXT_NOT_ACTIVE', 'Chỉ có thể chọn trình độ cho lộ trình đang hoạt động.');
      }

      // 7. CAS and single replay check
      const currentVersion = (context.rowVersion ?? 1n).toString();
      const expVersion = input.expectedRowVersion;

      if (currentVersion !== expVersion) {
        if (BigInt(currentVersion) === BigInt(expVersion) + 1n) {
          if (input.startSource === 'DEFAULT') {
            if (context.startSource === 'DEFAULT' && context.selectedStartLevelId) {
              return mapContextToSummaryDto(context);
            }
          } else if (input.startSource === 'SELF_REPORT') {
            if (
              context.startSource === 'SELF_REPORT' &&
              context.selectedStartLevelId?.toLowerCase() === input.levelId.toLowerCase()
            ) {
              return mapContextToSummaryDto(context);
            }
          }
        }
        fail(
          409,
          'STALE_ROW_VERSION',
          'Phiên bản lộ trình học không khớp hoặc đã thay đổi. Vui lòng tải lại trang.'
        );
      }

      // 8. Verify context is unconfigured (null start level / working level / source / result)
      if (
        context.selectedStartLevelId !== null ||
        context.workingLevelId !== null ||
        context.startSource !== null ||
        context.startResultId !== null
      ) {
        fail(409, 'CONTEXT_ALREADY_CONFIGURED', 'Lộ trình học đã được thiết lập trình độ bắt đầu.');
      }

      // 9. Verify context has zero learning/assessment history
      const counts = context._count || {
        lessonConsumptions: 0,
        lessonAttempts: 0,
        lessonCompletions: 0,
        assessmentAttempts: 0,
      };
      if (
        (counts.lessonConsumptions || 0) > 0 ||
        (counts.lessonAttempts || 0) > 0 ||
        (counts.lessonCompletions || 0) > 0 ||
        (counts.assessmentAttempts || 0) > 0
      ) {
        fail(409, 'CONTEXT_HAS_HISTORY', 'Không thể chọn trình độ cho lộ trình đã có lịch sử học tập.');
      }

      // 10. Revalidate Course and Language
      const course = await tx.course.findUnique({
        where: { id: context.courseId },
        include: { language: true, framework: true },
      });
      if (!course || !course.isActive) {
        fail(403, 'COURSE_INACTIVE', 'Khóa học không khả dụng hoặc đã tạm khóa.');
      }

      const language = await tx.language.findUnique({
        where: { id: context.languageId },
      });
      if (!language || !language.isLearnable) {
        fail(409, 'LANGUAGE_NOT_LEARNABLE', 'Ngôn ngữ mục tiêu không khả dụng để học.');
      }

      // 11. Starting level resolution
      const {
        selectedStartLevelId,
        workingLevelId,
        resolvedStartSource,
        selfReport,
      } = await resolveStartingLevel(tx, course, input);

      // 12. Atomically update LearningContext and increment rowVersion
      const now = await clock(tx);
      await tx.$executeRaw`
        UPDATE app.learning_contexts
        SET selected_start_level_id = ${selectedStartLevelId}::uuid,
            working_level_id = ${workingLevelId}::uuid,
            start_source = ${resolvedStartSource},
            self_report = ${selfReport ? JSON.stringify(selfReport) : null}::jsonb,
            row_version = row_version + 1,
            updated_at = ${now}
        WHERE id = ${canonicalContextId}::uuid
      `;

      const updated = await tx.learningContext.findFirst({
        where: { id: canonicalContextId },
        select: contextSelectWithRowVersion,
      });

      return mapContextToSummaryDto(updated);
    },
    { isolationLevel: 'ReadCommitted', timeout: 15000 }
  );
}
