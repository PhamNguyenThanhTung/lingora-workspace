import { getProductPrisma } from '../db/index.js';
import { isValidUuid, type ApiErrorEnvelope } from '../frameworks/index.ts';
import { computeExerciseFingerprint, type ExerciseType } from '../lessons/content.ts';
import { teacherAssessmentItemSchema } from './schemas.ts';
import type { TeacherAssessmentItemDto, AssessmentBlueprintDto } from './types.ts';
import { toBlueprintDto } from './blueprint.ts';

export class TeacherItemError extends Error {
  status: number;
  error: ApiErrorEnvelope['error'];
  constructor(status: number, error: ApiErrorEnvelope['error']) {
    super(error?.message || 'TeacherItemError');
    this.status = status;
    this.error = error;
    this.name = 'TeacherItemError';
  }
}

async function verifyAssignedTeacher(
  teacherAccountId: string,
  lessonId: string,
  prisma: any
): Promise<{ teacherAcc: any; lesson: any; assignment: any; latestEpisode: any; highestRev: any }> {
  // 1. Account verification
  const teacherAcc = await prisma.account.findUnique({
    where: { id: teacherAccountId.toLowerCase() },
    select: { id: true, role: true, status: true },
  });

  if (!teacherAcc || teacherAcc.role !== 'TEACHER') {
    throw new TeacherItemError(403, {
      code: 'FORBIDDEN',
      message: 'Chỉ giáo viên mới có quyền biên soạn bài tập đánh giá.',
    });
  }

  if (teacherAcc.status !== 'ACTIVE') {
    throw new TeacherItemError(403, {
      code: 'ACCOUNT_INACTIVE',
      message: 'Tài khoản giáo viên đang chờ duyệt hoặc đã bị vô hiệu hóa.',
    });
  }

  // 2. Lesson & Unit verification
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId.toLowerCase() },
    include: {
      unit: {
        include: {
          course: true,
        },
      },
      assignment: true,
      revisions: {
        orderBy: { revisionNo: 'desc' },
        take: 1,
      },
    },
  });

  if (!lesson) {
    throw new TeacherItemError(404, {
      code: 'LESSON_NOT_FOUND',
      message: 'Bài học không tồn tại hoặc không được phân công cho bạn.',
    });
  }

  // 3. Assignment verification
  const assignment = lesson.assignment;
  if (!assignment || assignment.currentTeacherId.toLowerCase() !== teacherAccountId.toLowerCase()) {
    throw new TeacherItemError(404, {
      code: 'LESSON_NOT_FOUND',
      message: 'Bài học không tồn tại hoặc không được phân công cho bạn.',
    });
  }

  // 4. Latest AssignmentHistory episode
  const latestEpisode = await prisma.assignmentHistory.findFirst({
    where: { assignmentId: assignment.id },
    orderBy: { sequenceNo: 'desc' },
  });

  if (!latestEpisode || latestEpisode.nextTeacherId.toLowerCase() !== teacherAccountId.toLowerCase()) {
    throw new TeacherItemError(409, {
      code: 'INCONSISTENT_ASSIGNMENT_HISTORY',
      message: 'Lịch sử phân công không đồng nhất với giáo viên hiện tại.',
    });
  }

  if (String(latestEpisode.scopeGeneration) !== String(assignment.scopeGeneration)) {
    throw new TeacherItemError(409, {
      code: 'INCONSISTENT_ASSIGNMENT_HISTORY',
      message: 'Lịch sử phân công không khớp với thế hệ phạm vi hiện tại.',
    });
  }

  const highestRev = lesson.revisions?.[0] || null;
  if (highestRev && (
    highestRev.assignmentId?.toLowerCase() !== assignment.id.toLowerCase() ||
    highestRev.creationAssignmentEpisodeId?.toLowerCase() !== latestEpisode.id.toLowerCase() ||
    highestRev.createdBy?.toLowerCase() !== teacherAccountId.toLowerCase()
  )) {
    throw new TeacherItemError(409, {
      code: 'DRAFT_NOT_OWNED_BY_CURRENT_TEACHER',
      message: 'Bản nháp hiện tại thuộc một đợt phân công trước. Hãy tạo bản nháp mới trước khi biên soạn bài tập đánh giá.',
    });
  }

  return { teacherAcc, lesson, assignment, latestEpisode, highestRev };
}

export async function listTeacherAssessmentBlueprints(
  teacherAccountId: string,
  lessonId: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: AssessmentBlueprintDto[] }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(lessonId)) {
    return {
      status: 400,
      error: { code: 'INVALID_ID', message: 'Mã định danh bài học không đúng định dạng UUID.' },
    };
  }

  const prisma = prismaClient || getProductPrisma();
  try {
    const { lesson } = await verifyAssignedTeacher(teacherAccountId, lessonId, prisma);
    const courseId = lesson.unit?.courseId;

    if (!courseId) {
      return { status: 200, data: { data: [] } };
    }

    const blueprints = await prisma.assessmentBlueprint.findMany({
      where: { courseId: courseId.toLowerCase() },
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { id: true, names: true } },
        language: { select: { id: true, code: true, names: true } },
        framework: { select: { id: true, code: true, version: true, names: true } },
        targetLevel: { select: { id: true, code: true, position: true, label: true } },
        nextLevel: { select: { id: true, code: true, position: true, label: true } },
        _count: { select: { versions: true } },
      },
    });

    return {
      status: 200,
      data: { data: blueprints.map(toBlueprintDto) },
    };
  } catch (err) {
    if (err instanceof TeacherItemError) {
      return { status: err.status, error: err.error };
    }
    return {
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }
}

export async function listTeacherAssessmentItems(
  teacherAccountId: string,
  lessonId: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: TeacherAssessmentItemDto[] }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(lessonId)) {
    return {
      status: 400,
      error: { code: 'INVALID_ID', message: 'Mã định danh bài học không đúng định dạng UUID.' },
    };
  }

  const prisma = prismaClient || getProductPrisma();
  try {
    const { highestRev } = await verifyAssignedTeacher(teacherAccountId, lessonId, prisma);

    if (!highestRev) {
      return { status: 200, data: { data: [] } };
    }

    const itemRevs = await prisma.itemRevision.findMany({
      where: {
        authoringLessonRevisionId: highestRev.id,
        item: {
          origin: 'ASSESSMENT',
        },
      },
      include: {
        gradingSecret: true,
        assessmentBlueprint: { select: { id: true, generation: true } },
      },
      orderBy: { revisionNo: 'asc' },
    });

    const dtoList: TeacherAssessmentItemDto[] = itemRevs.map((ir: any) => {
      const currentBpGen = ir.assessmentBlueprint?.generation;
      const isStale =
        currentBpGen != null && ir.blueprintGeneration != null
          ? ir.blueprintGeneration.toString() !== currentBpGen.toString()
          : false;

      return {
        id: ir.id,
        itemId: ir.itemId,
        revisionNo: ir.revisionNo,
        type: ir.type as ExerciseType,
        promptData: ir.promptData,
        gradingData: ir.gradingSecret?.gradingData || {},
        feedbackData: ir.gradingSecret?.feedbackData || null,
        blueprintId: ir.assessmentBlueprintId || '',
        blueprintGeneration: (ir.blueprintGeneration ?? 1n).toString(),
        isDraftOmitted: Boolean(ir.isDraftOmitted),
        frozenAt: ir.frozenAt instanceof Date ? ir.frozenAt.toISOString() : ir.frozenAt ? new Date(ir.frozenAt).toISOString() : null,
        authoringLessonRevisionId: ir.authoringLessonRevisionId,
        isStaleBlueprintGeneration: isStale,
        createdAt: ir.createdAt instanceof Date ? ir.createdAt.toISOString() : new Date(ir.createdAt).toISOString(),
        updatedAt: ir.updatedAt instanceof Date ? ir.updatedAt.toISOString() : new Date(ir.updatedAt).toISOString(),
      };
    });

    return {
      status: 200,
      data: { data: dtoList },
    };
  } catch (err) {
    if (err instanceof TeacherItemError) {
      return { status: err.status, error: err.error };
    }
    return {
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }
}

export async function saveTeacherAssessmentItem(
  teacherAccountId: string,
  lessonId: string,
  rawInput: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: { data: TeacherAssessmentItemDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(lessonId)) {
    return {
      status: 400,
      error: { code: 'INVALID_ID', message: 'Mã định danh bài học không đúng định dạng UUID.' },
    };
  }

  const parseResult = teacherAssessmentItemSchema.safeParse(rawInput);
  if (!parseResult.success) {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Dữ liệu không hợp lệ.',
        fields: Object.fromEntries(
          parseResult.error.issues.map((issue) => [issue.path.join('.'), issue.message])
        ),
      },
    };
  }

  const input = parseResult.data;
  const prisma = prismaClient || getProductPrisma();

  try {
    return await prisma.$transaction(async (tx: any) => {
      await tx.$queryRaw`SELECT id::text FROM app.accounts WHERE id = ${teacherAccountId.toLowerCase()}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT id::text FROM app.lessons WHERE id = ${lessonId.toLowerCase()}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT id::text FROM app.content_assignments WHERE lesson_id = ${lessonId.toLowerCase()}::uuid FOR UPDATE`;
      const { lesson, latestEpisode, highestRev } = await verifyAssignedTeacher(
        teacherAccountId,
        lessonId,
        tx
      );

      // Verify DRAFT status
      if (!highestRev) {
        throw new TeacherItemError(404, {
          code: 'LESSON_NOT_FOUND',
          message: 'Chưa có bản sửa đổi bài học nào để tạo bài tập đánh giá.',
        });
      }

      if (highestRev.status !== 'DRAFT' || highestRev.submittedAt != null) {
        throw new TeacherItemError(409, {
          code: 'DRAFT_NOT_EDITABLE',
          message: `Bản sửa đổi hiện tại có trạng thái ${highestRev.status}, không thể thêm hoặc sửa bài tập đánh giá.`,
        });
      }

      if (highestRev.id.toLowerCase() !== input.expectedRevisionId.toLowerCase()) {
        throw new TeacherItemError(409, {
          code: 'REVISION_CONFLICT',
          message: 'Bản sửa đổi dự kiến (expectedRevisionId) không khớp với bản sửa đổi hiện tại.',
        });
      }

      if (
        highestRev.assignmentId.toLowerCase() !== lesson.assignment.id.toLowerCase() ||
        highestRev.creationAssignmentEpisodeId.toLowerCase() !== latestEpisode.id.toLowerCase() ||
        highestRev.createdBy.toLowerCase() !== teacherAccountId.toLowerCase()
      ) {
        throw new TeacherItemError(409, {
          code: 'DRAFT_NOT_OWNED_BY_CURRENT_TEACHER',
          message: 'Bản nháp hiện tại thuộc một đợt phân công trước. Hãy tạo bản nháp mới trước khi biên soạn bài tập đánh giá.',
        });
      }

      // Verify Blueprint and Course correspondence
      await tx.$queryRaw`SELECT id::text FROM app.assessment_blueprints WHERE id = ${input.blueprintId.toLowerCase()}::uuid FOR SHARE`;
      const blueprint = await tx.assessmentBlueprint.findUnique({
        where: { id: input.blueprintId.toLowerCase() },
      });

      if (!blueprint) {
        throw new TeacherItemError(404, {
          code: 'BLUEPRINT_NOT_FOUND',
          message: 'Khung đánh giá không tồn tại.',
        });
      }

      if (blueprint.courseId.toLowerCase() !== lesson.unit.courseId.toLowerCase()) {
        throw new TeacherItemError(400, {
          code: 'BLUEPRINT_COURSE_MISMATCH',
          message: 'Khung đánh giá không thuộc khóa học của bài học này.',
        });
      }

      const fp = computeExerciseFingerprint({
        type: input.type,
        schemaVersion: 1,
        promptData: input.promptData,
        gradingData: input.gradingData,
        feedbackData: input.feedbackData,
      });

      let targetItemId: string;
      let nextRevNo = 1;

      if (input.sourceItemId) {
        // Successor revision on existing item identity
        await tx.$queryRaw`SELECT id::text FROM app.item_identities WHERE id = ${input.sourceItemId.toLowerCase()}::uuid FOR UPDATE`;
        const existingItem = await tx.itemIdentity.findUnique({
          where: { id: input.sourceItemId.toLowerCase() },
        });

        if (!existingItem) {
          throw new TeacherItemError(404, {
            code: 'ITEM_NOT_FOUND',
            message: 'Không tìm thấy bài tập gốc để tạo bản sửa đổi tiếp theo.',
          });
        }

        if (existingItem.origin !== 'ASSESSMENT') {
          throw new TeacherItemError(400, {
            code: 'INVALID_ITEM_ORIGIN',
            message: 'Chỉ có thể tạo bản sửa đổi tiếp theo cho bài tập có nguồn gốc ASSESSMENT.',
          });
        }

        const belongsToLesson = await tx.itemRevision.findFirst({
          where: {
            itemId: existingItem.id,
            item: { origin: 'ASSESSMENT' },
            authoringLessonRevision: { lessonId: lesson.id },
          },
          select: { id: true },
        });
        if (!belongsToLesson) {
          throw new TeacherItemError(404, {
            code: 'ITEM_NOT_FOUND',
            message: 'Bài tập gốc không thuộc lịch sử bài học được phân công này.',
          });
        }

        const maxRev = await tx.itemRevision.findFirst({
          where: { itemId: existingItem.id },
          orderBy: { revisionNo: 'desc' },
          select: { revisionNo: true },
        });

        targetItemId = existingItem.id;
        nextRevNo = (maxRev?.revisionNo ?? 0) + 1;
      } else {
        // Create new ItemIdentity with origin ASSESSMENT
        const newIdentity = await tx.itemIdentity.create({
          data: {
            origin: 'ASSESSMENT',
            createdBy: teacherAccountId.toLowerCase(),
            exactFingerprint: fp,
          },
        });
        targetItemId = newIdentity.id;
        nextRevNo = 1;
      }

      // Create new ItemRevision with Blueprint pins
      const newItemRev = await tx.itemRevision.create({
        data: {
          itemId: targetItemId,
          revisionNo: nextRevNo,
          type: input.type,
          promptData: input.promptData as any,
          schemaVersion: 1,
          exactFingerprint: fp,
          createdBy: teacherAccountId.toLowerCase(),
          creationAssignmentEpisodeId: latestEpisode.id,
          authoringLessonRevisionId: highestRev.id,
          assessmentBlueprintId: blueprint.id,
          blueprintGeneration: blueprint.generation,
          isDraftOmitted: false,
          frozenAt: null,
          rowVersion: 1n,
        },
      });

      // Create ItemGradingSecret in the same pre-submit transaction
      await tx.itemGradingSecret.create({
        data: {
          itemRevisionId: newItemRev.id,
          gradingData: input.gradingData as any,
          feedbackData: input.feedbackData ? (input.feedbackData as any) : undefined,
          schemaVersion: 1,
        },
      });

      return {
        status: 201,
        data: {
          data: {
            id: newItemRev.id,
            itemId: newItemRev.itemId,
            revisionNo: newItemRev.revisionNo,
            type: newItemRev.type as ExerciseType,
            promptData: newItemRev.promptData,
            gradingData: input.gradingData,
            feedbackData: input.feedbackData || null,
            blueprintId: blueprint.id,
            blueprintGeneration: (blueprint.generation ?? 1n).toString(),
            isDraftOmitted: false,
            frozenAt: null,
            authoringLessonRevisionId: highestRev.id,
            isStaleBlueprintGeneration: false,
            createdAt: newItemRev.createdAt instanceof Date ? newItemRev.createdAt.toISOString() : new Date(newItemRev.createdAt).toISOString(),
            updatedAt: newItemRev.updatedAt instanceof Date ? newItemRev.updatedAt.toISOString() : new Date(newItemRev.updatedAt).toISOString(),
          },
        },
      };
    });
  } catch (err) {
    if (err instanceof TeacherItemError) {
      return { status: err.status, error: err.error };
    }
    return {
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }
}
