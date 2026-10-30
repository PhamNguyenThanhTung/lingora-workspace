import { z } from 'zod';
import { getProductPrisma } from '../db/index.js';
import { isValidUuid, type ApiErrorEnvelope } from '../frameworks/index.ts';

export { isValidUuid };

// =============================================================================
// Interfaces & DTOs
// =============================================================================

export interface LessonAssignmentDto {
  id: string;
  currentTeacher: {
    id: string;
    displayName: string | null;
    status: string;
  };
  generation: string;
}

export interface LessonRevisionSummaryDto {
  id: string;
  revisionNo: number;
  author: {
    id: string;
    displayName: string | null;
  };
  createdAt: string;
  changeSummary: string | null;
  status: string;
}

export interface LessonSummaryDto {
  id: string;
  unitId: string;
  position: number;
  isRequired: boolean;
  availability: string;
  rowVersion: string;
  courseContext: {
    id: string;
    names: Record<string, string>;
  };
  unitContext: {
    id: string;
    code: string;
    names: Record<string, string>;
  };
  assignment: LessonAssignmentDto | null;
  highestRevision: LessonRevisionSummaryDto | null;
  isEditable: boolean;
  editabilityReason: string | null;
}

export interface LessonDetailDto extends LessonSummaryDto {
  currentDraft: {
    title: Record<string, string>;
    contentBlocks: Array<{ type: 'paragraph'; text: string }>;
  } | null;
  revisions: LessonRevisionSummaryDto[];
}

export interface TeacherOptionDto {
  id: string;
  displayName: string | null;
}

// =============================================================================
// Schemas
// =============================================================================

const lessonVersionSchema = z.string({ message: 'expectedRowVersion là bắt buộc' }).refine(
  value => /^[1-9]\d{0,18}$/.test(value) && BigInt(value) <= 9223372036854775807n,
  'expectedRowVersion phải là chuỗi số nguyên dương int64 chuẩn'
);

export const createLessonSchema = z
  .object({
    position: z
      .number({ message: 'Thứ tự vị trí phải là số' })
      .int('Thứ tự vị trí phải là số nguyên')
      .positive('Thứ tự vị trí phải lớn hơn 0')
      .max(2147483647, 'Thứ tự vị trí vượt quá giới hạn cho phép'),
    isRequired: z.boolean({ message: 'Trường bắt buộc phải là giá trị boolean' }).optional().default(true),
  })
  .strict();

export const updateLessonSchema = z
  .object({
    position: z
      .number({ message: 'Thứ tự vị trí phải là số' })
      .int('Thứ tự vị trí phải là số nguyên')
      .positive('Thứ tự vị trí phải lớn hơn 0')
      .max(2147483647, 'Thứ tự vị trí vượt quá giới hạn cho phép'),
    isRequired: z.boolean({ message: 'Trường bắt buộc phải là giá trị boolean' }),
    expectedRowVersion: lessonVersionSchema,
  })
  .strict();

export const assignLessonSchema = z
  .object({
    teacherId: z
      .string({ message: 'Mã giáo viên là bắt buộc' })
      .trim()
      .min(1, 'Mã giáo viên không được để trống')
      .refine(isValidUuid, 'Mã giáo viên không đúng định dạng UUID'),
    expectedRowVersion: lessonVersionSchema,
  })
  .strict();

export const saveTeacherDraftSchema = z
  .object({
    title: z
      .object({
        vi: z.string({ message: 'Tiêu đề tiếng Việt phải là chuỗi ký tự' }).trim().max(300, 'Tiêu đề tiếng Việt tối đa 300 ký tự').optional(),
        en: z.string({ message: 'Tiêu đề tiếng Anh phải là chuỗi ký tự' }).trim().max(300, 'Tiêu đề tiếng Anh tối đa 300 ký tự').optional(),
      })
      .strict()
      .refine(
        (t) => Boolean((t.vi && t.vi.trim().length > 0) || (t.en && t.en.trim().length > 0)),
        { message: 'Ít nhất một ngôn ngữ (tiếng Việt hoặc tiếng Anh) phải có tiêu đề.' }
      ),
    contentBlocks: z
      .array(
        z
          .object({
            type: z.literal('paragraph', { message: 'Kiểu nội dung phải là paragraph' }),
            text: z.string({ message: 'Nội dung đoạn văn phải là chuỗi ký tự' }).max(20000, 'Mỗi đoạn văn tối đa 20.000 ký tự'),
          })
          .strict()
      )
      .max(50, 'Tối đa 50 đoạn văn'),
    changeSummary: z
      .string({ message: 'Tóm tắt thay đổi phải là chuỗi ký tự' })
      .trim()
      .max(500, 'Tóm tắt thay đổi tối đa 500 ký tự')
      .optional()
      .nullable(),
    expectedRowVersion: lessonVersionSchema,
  })
  .strict();

// =============================================================================
// Helpers
// =============================================================================

export function parseJsonRecord(val: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (typeof v === 'string') {
        result[k] = v;
      }
    }
  }
  return result;
}

export function isSupportedTitle(rawTitle: unknown): boolean {
  if (typeof rawTitle !== 'object' || rawTitle === null || Array.isArray(rawTitle)) {
    return false;
  }
  const entries = Object.entries(rawTitle as Record<string, unknown>);
  for (const [, v] of entries) {
    if (typeof v !== 'string') {
      return false;
    }
  }
  return true;
}

export function isSupportedContentBlocks(rawBlocks: unknown): boolean {
  if (!Array.isArray(rawBlocks)) return false;
  for (const block of rawBlocks) {
    if (typeof block !== 'object' || block === null || Array.isArray(block)) return false;
    const keys = Object.keys(block);
    if (keys.length !== 2 || !keys.includes('type') || !keys.includes('text')) return false;
    if (block.type !== 'paragraph' || typeof block.text !== 'string') return false;
  }
  return true;
}

export function hasRevisionAssociations(rev: any): boolean {
  if (!rev) return false;
  const c = rev._count || {};
  return (
    (c.exercises ?? 0) > 0 ||
    (c.vocabularyLinks ?? 0) > 0 ||
    (c.mediaBindings ?? 0) > 0 ||
    (c.authoredItemRevisions ?? 0) > 0 ||
    (c.attempts ?? 0) > 0 ||
    (c.assessmentVersionItems ?? 0) > 0
  );
}

export function evaluateEditability(highestRev: any): { isEditable: boolean; editabilityReason: string | null } {
  if (!highestRev) {
    return { isEditable: true, editabilityReason: null };
  }
  if (highestRev.status !== 'DRAFT') {
    return {
      isEditable: false,
      editabilityReason: `Bản sửa đổi hiện tại có trạng thái ${highestRev.status}, không thể chỉnh sửa bản nháp.`,
    };
  }
  if (
    highestRev.submittedAt != null ||
    highestRev.submittedBy != null ||
    highestRev.submittedAssignmentGeneration != null ||
    highestRev.assignmentScopeSnapshot != null ||
    highestRev.approvedBy != null || highestRev.approvedAt != null ||
    highestRev.publishedBy != null || highestRev.publishedAt != null || highestRev.endedAt != null
  ) {
    return {
      isEditable: false,
      editabilityReason: 'Bản nháp đã từng được nộp duyệt hoặc có dấu vết quy trình nộp, không thể chỉnh sửa.',
    };
  }
  if (!isSupportedTitle(highestRev.title) || !isSupportedContentBlocks(highestRev.contentBlocks)) {
    return {
      isEditable: false,
      editabilityReason: 'Cấu trúc tiêu đề hoặc nội dung bản nháp chứa định dạng không được hỗ trợ để sửa đổi.',
    };
  }
  if (hasRevisionAssociations(highestRev)) {
    return {
      isEditable: false,
      editabilityReason: 'Bản nháp gắn liền với các liên kết bài tập hoặc từ vựng, không thể sửa đổi trong phân hệ này.',
    };
  }
  return { isEditable: true, editabilityReason: null };
}

export function toLessonSummaryDto(lesson: any): LessonSummaryDto {
  const unit = lesson.unit || {};
  const course = unit.course || {};

  const assignment = lesson.assignment;
  let assignmentDto: LessonAssignmentDto | null = null;
  if (assignment && assignment.currentTeacher) {
    assignmentDto = {
      id: assignment.id,
      currentTeacher: {
        id: assignment.currentTeacher.id,
        displayName: assignment.currentTeacher.displayName || null,
        status: assignment.currentTeacher.status,
      },
      generation: assignment.scopeGeneration.toString(),
    };
  }

  // Determine highest revision
  const revisions = Array.isArray(lesson.revisions) ? lesson.revisions : [];
  // Sort descending by revisionNo
  const sortedRevisions = [...revisions].sort((a, b) => b.revisionNo - a.revisionNo);
  const highestRev = sortedRevisions[0] || null;

  let highestRevisionDto: LessonRevisionSummaryDto | null = null;
  if (highestRev) {
    const author = highestRev.lastEditor || highestRev.creator || {};
    highestRevisionDto = {
      id: highestRev.id,
      revisionNo: highestRev.revisionNo,
      author: {
        id: author.id || highestRev.lastEditedBy || highestRev.createdBy,
        displayName: author.displayName || null,
      },
      createdAt: highestRev.createdAt instanceof Date ? highestRev.createdAt.toISOString() : new Date(highestRev.createdAt).toISOString(),
      changeSummary: highestRev.changeSummary || null,
      status: highestRev.status,
    };
  }

  const { isEditable, editabilityReason } = evaluateEditability(highestRev);

  return {
    id: lesson.id,
    unitId: lesson.unitId,
    position: lesson.position,
    isRequired: lesson.isRequired,
    availability: lesson.availability,
    rowVersion: lesson.rowVersion.toString(),
    courseContext: {
      id: course.id || '',
      names: parseJsonRecord(course.names),
    },
    unitContext: {
      id: unit.id || '',
      code: unit.code || '',
      names: parseJsonRecord(unit.names),
    },
    assignment: assignmentDto,
    highestRevision: highestRevisionDto,
    isEditable,
    editabilityReason,
  };
}

export function toLessonDetailDto(lesson: any): LessonDetailDto {
  const summary = toLessonSummaryDto(lesson);

  const revisions = Array.isArray(lesson.revisions) ? lesson.revisions : [];
  const sortedRevisions = [...revisions].sort((a, b) => b.revisionNo - a.revisionNo);
  const highestRev = sortedRevisions[0] || null;

  let currentDraft: LessonDetailDto['currentDraft'] = null;
  if (highestRev) {
    // Only expose currentDraft if title & contentBlocks are supported
    const supportedTitle = isSupportedTitle(highestRev.title);
    const supportedBlocks = isSupportedContentBlocks(highestRev.contentBlocks);
    if (supportedTitle && supportedBlocks) {
      currentDraft = {
        title: parseJsonRecord(highestRev.title),
        contentBlocks: highestRev.contentBlocks as Array<{ type: 'paragraph'; text: string }>,
      };
    }
  }

  const revisionSummaries: LessonRevisionSummaryDto[] = sortedRevisions.map((rev) => {
    const author = rev.lastEditor || rev.creator || {};
    return {
      id: rev.id,
      revisionNo: rev.revisionNo,
      author: {
        id: author.id || rev.lastEditedBy || rev.createdBy,
        displayName: author.displayName || null,
      },
      createdAt: rev.createdAt instanceof Date ? rev.createdAt.toISOString() : new Date(rev.createdAt).toISOString(),
      changeSummary: rev.changeSummary || null,
      status: rev.status,
    };
  });

  return {
    ...summary,
    currentDraft,
    revisions: revisionSummaries,
  };
}

export function handleLessonPrismaError(err: unknown, op: string): { status: number; body: ApiErrorEnvelope } {
  if (err && typeof err === 'object' && 'code' in err) {
    const prismaErr = err as { code: string; meta?: any };
    if (prismaErr.code === 'P2002') {
      return {
        status: 409,
        body: {
          error: {
            code: op === 'saveTeacherLessonDraft' ? 'REVISION_CONFLICT' : op === 'assignLesson' ? 'ASSIGNMENT_CONFLICT' : 'DUPLICATE_LESSON_POSITION',
            message: 'Vị trí bài học đã tồn tại trong đơn vị bài học này. Vui lòng chọn vị trí khác.',
          },
        },
      };
    }
    if (prismaErr.code === 'P2025') {
      return {
        status: 404,
        body: {
          error: {
            code: 'NOT_FOUND',
            message: 'Bản ghi không tồn tại trong hệ thống.',
          },
        },
      };
    }
  }
  return {
    status: 503,
    body: {
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    },
  };
}

// Serialize status changes while allowing FK key-share checks from reassignment/lifecycle audits.
async function lockAccounts(tx: any, accountIds: string[]) {
  const accounts = new Map<string, any>();
  for (const id of [...new Set(accountIds.map(id => id.toLowerCase()))].sort()) {
    const rows = await tx.$queryRaw`
      SELECT id::text, role, status, display_name AS "displayName"
      FROM app.accounts WHERE id = ${id}::uuid FOR NO KEY UPDATE
    `;
    if (rows[0]) accounts.set(id, rows[0]);
  }
  return accounts;
}

async function lockLesson(tx: any, lessonId: string) {
  const rows = await tx.$queryRaw`
    SELECT id::text, unit_id::text AS "unitId", position,
      is_required AS "isRequired", availability,
      active_revision_id::text AS "activeRevisionId", row_version AS "rowVersion"
    FROM app.lessons WHERE id = ${lessonId.toLowerCase()}::uuid FOR UPDATE
  `;
  return rows[0] || null;
}

async function lockAssignment(tx: any, lessonId: string) {
  const rows = await tx.$queryRaw`
    SELECT id::text, lesson_id::text AS "lessonId", created_by::text AS "createdBy",
      current_teacher_id::text AS "currentTeacherId", scope_generation AS "scopeGeneration",
      row_version AS "rowVersion", requirement, scope
    FROM app.content_assignments WHERE lesson_id = ${lessonId.toLowerCase()}::uuid FOR UPDATE
  `;
  return rows[0] || null;
}

// =============================================================================
// Admin Lesson Management Services
// =============================================================================

const revisionRelations = {
  creator: { select: { id: true, displayName: true } },
  lastEditor: { select: { id: true, displayName: true } },
  _count: { select: { exercises: true, vocabularyLinks: true, mediaBindings: true, authoredItemRevisions: true, attempts: true, assessmentVersionItems: true } },
};
const lessonRelations = {
  unit: { select: { id: true, courseId: true, position: true, code: true, names: true, course: { select: { id: true, names: true } } } },
  assignment: { include: { currentTeacher: { select: { id: true, displayName: true, status: true } } } },
  revisions: { orderBy: { revisionNo: 'desc' }, include: revisionRelations },
};
const lessonSummaryRelations = { ...lessonRelations, revisions: { ...lessonRelations.revisions, take: 1 } };



export async function listLessons(
  courseId: string,
  unitId: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: LessonSummaryDto[] }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(courseId) || !isValidUuid(unitId)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh khóa học hoặc đơn vị không đúng định dạng.',
      },
    };
  }

  const prisma = prismaClient || getProductPrisma();

  try {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId.toLowerCase() },
      select: { id: true, courseId: true, code: true, names: true, course: { select: { id: true, names: true } } },
    });

    if (!unit || unit.courseId.toLowerCase() !== courseId.toLowerCase()) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Đơn vị bài học không tồn tại trong khóa học này.',
        },
      };
    }

    const lessons = await prisma.lesson.findMany({
      where: { unitId: unitId.toLowerCase() },
      orderBy: { position: 'asc' },
      include: lessonSummaryRelations,
    });

    const dtos = lessons.map(toLessonSummaryDto);

    return {
      status: 200,
      data: { data: dtos },
    };
  } catch {
    return {
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }
}

export async function getLesson(
  courseId: string,
  unitId: string,
  lessonId: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: LessonDetailDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(courseId) || !isValidUuid(unitId) || !isValidUuid(lessonId)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh không đúng định dạng UUID.',
      },
    };
  }

  const prisma = prismaClient || getProductPrisma();

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId.toLowerCase() },
      include: lessonRelations,
    });

    if (
      !lesson ||
      lesson.unitId.toLowerCase() !== unitId.toLowerCase() ||
      lesson.unit.courseId.toLowerCase() !== courseId.toLowerCase()
    ) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Không tìm thấy bài học trong đơn vị bài học này.',
        },
      };
    }

    return {
      status: 200,
      data: { data: toLessonDetailDto(lesson) },
    };
  } catch {
    return {
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }
}

export async function createLesson(
  adminAccountId: string,
  courseId: string,
  unitId: string,
  rawBody: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: { data: LessonDetailDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(courseId) || !isValidUuid(unitId)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh không đúng định dạng UUID.',
      },
    };
  }

  const parseResult = createLessonSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parseResult.error.issues) {
      const path = issue.path.join('.');
      fieldErrors[path] = issue.message;
    }
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Dữ liệu không hợp lệ.',
        fields: fieldErrors,
      },
    };
  }

  const { position, isRequired } = parseResult.data;
  const prisma = prismaClient || getProductPrisma();

  try {
    return await prisma.$transaction(async (tx: any) => {
      // Lock and recheck Admin account
      const accounts = await lockAccounts(tx, [adminAccountId]);
      const adminAcc = accounts.get(adminAccountId.toLowerCase());
      if (!adminAcc || adminAcc.role !== 'ADMIN' || adminAcc.status !== 'ACTIVE') {
        return {
          status: 403,
          error: {
            code: 'FORBIDDEN',
            message: 'Tài khoản không có quyền quản trị hoặc đã bị vô hiệu hóa.',
          },
        };
      }

      // Validate Unit / Course inside transaction
      const unit = await tx.unit.findUnique({
        where: { id: unitId.toLowerCase() },
        select: {
          id: true,
          courseId: true,
          code: true,
          names: true,
          course: { select: { id: true, names: true } },
        },
      });

      if (!unit || unit.courseId.toLowerCase() !== courseId.toLowerCase()) {
        return {
          status: 404,
          error: {
            code: 'NOT_FOUND',
            message: 'Đơn vị bài học không tồn tại trong khóa học này.',
          },
        };
      }

      // Check unique position within unit
      const existing = await tx.lesson.findFirst({
        where: { unitId: unitId.toLowerCase(), position },
        select: { id: true },
      });
      if (existing) {
        return {
          status: 409,
          error: {
            code: 'DUPLICATE_LESSON_POSITION',
            message: 'Vị trí bài học đã tồn tại trong đơn vị bài học này. Vui lòng chọn vị trí khác.',
          },
        };
      }

      const created = await tx.lesson.create({
        data: {
          unitId: unitId.toLowerCase(),
          position,
          isRequired: isRequired ?? true,
          availability: 'PLANNED',
          rowVersion: 1n,
        },
        include: lessonRelations,
      });

      return {
        status: 201,
        data: { data: toLessonDetailDto(created) },
      };
    });
  } catch (err) {
    const errorRes = handleLessonPrismaError(err, 'createLesson');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function updateLesson(
  adminAccountId: string,
  courseId: string,
  unitId: string,
  lessonId: string,
  rawBody: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: { data: LessonDetailDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(courseId) || !isValidUuid(unitId) || !isValidUuid(lessonId)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh không đúng định dạng UUID.',
      },
    };
  }

  const parseResult = updateLessonSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parseResult.error.issues) {
      const path = issue.path.join('.');
      fieldErrors[path] = issue.message;
    }
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Dữ liệu không hợp lệ.',
        fields: fieldErrors,
      },
    };
  }

  const { position, isRequired, expectedRowVersion } = parseResult.data;
  const prisma = prismaClient || getProductPrisma();

  try {
    return await prisma.$transaction(async (tx: any) => {
      // Lock Admin
      const accounts = await lockAccounts(tx, [adminAccountId]);
      const adminAcc = accounts.get(adminAccountId.toLowerCase());
      if (!adminAcc || adminAcc.role !== 'ADMIN' || adminAcc.status !== 'ACTIVE') {
        return {
          status: 403,
          error: {
            code: 'FORBIDDEN',
            message: 'Tài khoản không có quyền quản trị hoặc đã bị vô hiệu hóa.',
          },
        };
      }

      // Lock Lesson
      const currentLesson = await lockLesson(tx, lessonId);
      if (!currentLesson) {
        return {
          status: 404,
          error: {
            code: 'NOT_FOUND',
            message: 'Bài học không tồn tại trong hệ thống.',
          },
        };
      }

      // Verify Unit / Course context
      const unit = await tx.unit.findUnique({
        where: { id: unitId.toLowerCase() },
        select: {
          id: true,
          courseId: true,
          code: true,
          names: true,
          course: { select: { id: true, names: true } },
        },
      });

      if (
        !unit ||
        unit.courseId.toLowerCase() !== courseId.toLowerCase() ||
        currentLesson.unitId.toLowerCase() !== unitId.toLowerCase()
      ) {
        return {
          status: 404,
          error: {
            code: 'NOT_FOUND',
            message: 'Bài học không thuộc đơn vị bài học hoặc khóa học này.',
          },
        };
      }

      // CAS check
      const actualVersion = (currentLesson.rowVersion ?? currentLesson.row_version ?? 1n).toString();
      if (actualVersion !== expectedRowVersion) {
        return {
          status: 409,
          error: {
            code: 'STALE_LESSON',
            message: 'Dữ liệu bài học đã bị thay đổi bởi tác vụ khác. Vui lòng tải lại trang.',
          },
        };
      }

      // Check position uniqueness if position changed
      if (currentLesson.position !== position) {
        const collision = await tx.lesson.findFirst({
          where: {
            unitId: unitId.toLowerCase(),
            position,
            id: { not: lessonId.toLowerCase() },
          },
          select: { id: true },
        });
        if (collision) {
          return {
            status: 409,
            error: {
              code: 'DUPLICATE_LESSON_POSITION',
              message: 'Vị trí bài học đã tồn tại trong đơn vị bài học này. Vui lòng chọn vị trí khác.',
            },
          };
        }
      }

      const updated = await tx.lesson.update({
        where: { id: lessonId.toLowerCase() },
        data: {
          position,
          isRequired,
          rowVersion: { increment: 1n },
        },
        include: lessonRelations,
      });

      return {
        status: 200,
        data: { data: toLessonDetailDto(updated) },
      };
    });
  } catch (err) {
    const errorRes = handleLessonPrismaError(err, 'updateLesson');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function assignLesson(
  adminAccountId: string,
  courseId: string,
  unitId: string,
  lessonId: string,
  rawBody: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: { data: LessonDetailDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(courseId) || !isValidUuid(unitId) || !isValidUuid(lessonId)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh không đúng định dạng UUID.',
      },
    };
  }

  const parseResult = assignLessonSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parseResult.error.issues) {
      const path = issue.path.join('.');
      fieldErrors[path] = issue.message;
    }
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Dữ liệu không hợp lệ.',
        fields: fieldErrors,
      },
    };
  }

  const { teacherId, expectedRowVersion } = parseResult.data;
  const prisma = prismaClient || getProductPrisma();

  try {
    return await prisma.$transaction(async (tx: any) => {
      // Lock actor and target in stable UUID order
      const accounts = await lockAccounts(tx, [adminAccountId, teacherId]);
      const adminAcc = accounts.get(adminAccountId.toLowerCase());
      if (!adminAcc || adminAcc.role !== 'ADMIN' || adminAcc.status !== 'ACTIVE') {
        return {
          status: 403,
          error: {
            code: 'FORBIDDEN',
            message: 'Tài khoản không có quyền quản trị hoặc đã bị vô hiệu hóa.',
          },
        };
      }

      const targetTeacher = accounts.get(teacherId.toLowerCase());
      if (!targetTeacher || targetTeacher.role !== 'TEACHER' || targetTeacher.status !== 'ACTIVE') {
        return {
          status: 409,
          error: {
            code: 'INVALID_TEACHER_TARGET',
            message: 'Chỉ có thể phân công cho giáo viên đang ở trạng thái hoạt động (ACTIVE).',
          },
        };
      }

      // Lock Lesson
      const currentLesson = await lockLesson(tx, lessonId);
      if (!currentLesson) {
        return {
          status: 404,
          error: {
            code: 'NOT_FOUND',
            message: 'Bài học không tồn tại trong hệ thống.',
          },
        };
      }

      // Verify Unit / Course context
      const unit = await tx.unit.findUnique({
        where: { id: unitId.toLowerCase() },
        select: {
          id: true,
          courseId: true,
          code: true,
          names: true,
          course: { select: { id: true, names: true } },
        },
      });

      if (
        !unit ||
        unit.courseId.toLowerCase() !== courseId.toLowerCase() ||
        currentLesson.unitId.toLowerCase() !== unitId.toLowerCase()
      ) {
        return {
          status: 404,
          error: {
            code: 'NOT_FOUND',
            message: 'Bài học không thuộc đơn vị bài học hoặc khóa học này.',
          },
        };
      }

      // CAS check on Lesson.rowVersion
      const actualVersion = (currentLesson.rowVersion ?? currentLesson.row_version ?? 1n).toString();
      if (actualVersion !== expectedRowVersion) {
        return {
          status: 409,
          error: {
            code: 'STALE_LESSON',
            message: 'Dữ liệu bài học đã bị thay đổi bởi tác vụ khác. Vui lòng tải lại trang.',
          },
        };
      }

      // Lock or fetch existing ContentAssignment
      const existingAssignment = await lockAssignment(tx, lessonId);

      const fetchCurrentFullLesson = async () => {
        return tx.lesson.findUnique({
          where: { id: lessonId.toLowerCase() },
          include: lessonRelations,
        });
      };

      if (!existingAssignment) {
        // Initial assignment
        const newAssignment = await tx.contentAssignment.create({
          data: {
            createdBy: adminAccountId.toLowerCase(),
            currentTeacherId: teacherId.toLowerCase(),
            lessonId: lessonId.toLowerCase(),
            requirement: {},
            scope: {},
            scopeGeneration: 1n,
            rowVersion: 1n,
          },
        });

        await tx.assignmentHistory.create({
          data: {
            assignmentId: newAssignment.id,
            sequenceNo: 1,
            eventType: 'ASSIGNED',
            previousTeacherId: null,
            nextTeacherId: teacherId.toLowerCase(),
            scopeGeneration: 1n,
            changedBy: adminAccountId.toLowerCase(),
            scopeSnapshot: { schema_version: 1, requirement: {}, scope: {} },
          },
        });

        // Bump Lesson CAS token once
        await tx.lesson.update({
          where: { id: lessonId.toLowerCase() },
          data: { rowVersion: { increment: 1n } },
        });

        const fullLesson = await fetchCurrentFullLesson();
        return {
          status: 200,
          data: { data: toLessonDetailDto(fullLesson) },
        };
      }

      // Existing assignment
      const currentTeacherId = String(
        existingAssignment.currentTeacherId || existingAssignment.current_teacher_id || ''
      ).toLowerCase();

      const latestHistory = await tx.assignmentHistory.findFirst({
        where: { assignmentId: existingAssignment.id },
        orderBy: { sequenceNo: 'desc' },
      });
      if (!latestHistory || latestHistory.nextTeacherId !== currentTeacherId ||
          latestHistory.scopeGeneration.toString() !== existingAssignment.scopeGeneration.toString()) {
        return { status: 409, error: { code: 'INCONSISTENT_ASSIGNMENT_HISTORY', message: 'Lịch sử phân công không đồng nhất.' } };
      }

      if (currentTeacherId === teacherId.toLowerCase()) {
        // Authoritative no-op: same teacher, concurrency verified, no history created, no version bump
        const fullLesson = await fetchCurrentFullLesson();
        return {
          status: 200,
          data: { data: toLessonDetailDto(fullLesson) },
        };
      }

      // Reassignment to different teacher
      const currentScopeGen = BigInt(
        existingAssignment.scopeGeneration ?? existingAssignment.scope_generation ?? 1n
      );
      const nextScopeGen = currentScopeGen + 1n;

      // Determine next sequenceNo from AssignmentHistory
      const nextSeq = latestHistory.sequenceNo + 1;

      // Update assignment
      await tx.contentAssignment.update({
        where: { id: existingAssignment.id },
        data: {
          currentTeacherId: teacherId.toLowerCase(),
          scopeGeneration: nextScopeGen,
          rowVersion: { increment: 1n },
        },
      });

      // Insert history episode
      const assignmentReq = existingAssignment.requirement || {};
      const assignmentScope = existingAssignment.scope || {};
      await tx.assignmentHistory.create({
        data: {
          assignmentId: existingAssignment.id,
          sequenceNo: nextSeq,
          eventType: 'REASSIGNED',
          previousTeacherId: currentTeacherId,
          nextTeacherId: teacherId.toLowerCase(),
          scopeGeneration: nextScopeGen,
          changedBy: adminAccountId.toLowerCase(),
          scopeSnapshot: { schema_version: 1, requirement: assignmentReq, scope: assignmentScope },
        },
      });

      // Bump Lesson CAS token once
      await tx.lesson.update({
        where: { id: lessonId.toLowerCase() },
        data: { rowVersion: { increment: 1n } },
      });

      const fullLesson = await fetchCurrentFullLesson();
      return {
        status: 200,
        data: { data: toLessonDetailDto(fullLesson) },
      };
    });
  } catch (err) {
    const errorRes = handleLessonPrismaError(err, 'assignLesson');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function getTeacherOptions(
  courseId: string,
  unitId: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: TeacherOptionDto[] }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(courseId) || !isValidUuid(unitId)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh không đúng định dạng UUID.',
      },
    };
  }

  const prisma = prismaClient || getProductPrisma();

  try {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId.toLowerCase() },
      select: { id: true, courseId: true },
    });
    if (!unit || unit.courseId.toLowerCase() !== courseId.toLowerCase()) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Đơn vị bài học không tồn tại trong khóa học này.',
        },
      };
    }

    const teachers = await prisma.account.findMany({
      where: {
        role: 'TEACHER',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        displayName: true,
      },
      orderBy: {
        displayName: 'asc',
      },
    });

    return {
      status: 200,
      data: {
        data: teachers.map((t: any) => ({
          id: t.id,
          displayName: t.displayName || null,
        })),
      },
    };
  } catch {
    return {
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }
}

// =============================================================================
// Teacher Workstream Services
// =============================================================================

export async function listTeacherAssignedLessons(
  teacherAccountId: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: LessonSummaryDto[] }; error?: ApiErrorEnvelope['error'] }> {
  const prisma = prismaClient || getProductPrisma();

  try {
    const lessons = await prisma.lesson.findMany({
      where: {
        assignment: {
          currentTeacherId: teacherAccountId.toLowerCase(),
        },
      },
      include: lessonSummaryRelations,
      orderBy: [{ unit: { position: 'asc' } }, { position: 'asc' }],
    });

    const dtos = lessons.map(toLessonSummaryDto);

    return {
      status: 200,
      data: { data: dtos },
    };
  } catch {
    return {
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }
}

export async function getTeacherLessonDetail(
  teacherAccountId: string,
  lessonId: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: LessonDetailDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(lessonId)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh bài học không đúng định dạng UUID.',
      },
    };
  }

  const prisma = prismaClient || getProductPrisma();

  try {
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId.toLowerCase(),
        assignment: {
          currentTeacherId: teacherAccountId.toLowerCase(),
        },
      },
      include: lessonRelations,
    });

    if (!lesson) {
      return {
        status: 404,
        error: {
          code: 'LESSON_NOT_FOUND',
          message: 'Bài học không tồn tại hoặc không được phân công cho bạn.',
        },
      };
    }

    return {
      status: 200,
      data: { data: toLessonDetailDto(lesson) },
    };
  } catch {
    return {
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }
}

export async function saveTeacherLessonDraft(
  teacherAccountId: string,
  lessonId: string,
  rawBody: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: { data: LessonDetailDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(lessonId)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh bài học không đúng định dạng UUID.',
      },
    };
  }

  // Aggregate size check: 1 MiB limit
  try {
    const bodyString = JSON.stringify(rawBody);
    if (new TextEncoder().encode(bodyString).length > 1024 * 1024) {
      return {
        status: 400,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Dung lượng yêu cầu vượt quá giới hạn 1 MiB.',
        },
      };
    }
  } catch {
    // ignore serialize error here, parse will handle
  }

  const parseResult = saveTeacherDraftSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parseResult.error.issues) {
      const path = issue.path.join('.');
      fieldErrors[path] = issue.message;
    }
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Dữ liệu không hợp lệ.',
        fields: fieldErrors,
      },
    };
  }

  const { title: inputTitle, contentBlocks, changeSummary, expectedRowVersion } = parseResult.data;
  const prisma = prismaClient || getProductPrisma();

  try {
    return await prisma.$transaction(async (tx: any) => {
      // 1. Lock saving Teacher account
      const accounts = await lockAccounts(tx, [teacherAccountId]);
      const teacherAcc = accounts.get(teacherAccountId.toLowerCase());
      if (!teacherAcc || teacherAcc.role !== 'TEACHER') {
        return {
          status: 403,
          error: {
            code: 'FORBIDDEN',
            message: 'Tài khoản không thuộc phân hệ giáo viên.',
          },
        };
      }
      if (teacherAcc.status !== 'ACTIVE') {
        return {
          status: 403,
          error: {
            code: 'ACCOUNT_INACTIVE',
            message: 'Tài khoản giáo viên đang chờ duyệt hoặc đã bị vô hiệu hóa.',
          },
        };
      }

      // 2. Lock Lesson
      const currentLesson = await lockLesson(tx, lessonId);
      if (!currentLesson) {
        return {
          status: 404,
          error: {
            code: 'LESSON_NOT_FOUND',
            message: 'Bài học không tồn tại hoặc không được phân công cho bạn.',
          },
        };
      }

      // 4. Lock Assignment & verify ownership
      const assignment = await lockAssignment(tx, lessonId);
      if (!assignment) {
        return {
          status: 404,
          error: {
            code: 'LESSON_NOT_FOUND',
            message: 'Bài học không tồn tại hoặc không được phân công cho bạn.',
          },
        };
      }

      const assignedTeacherId = String(assignment.currentTeacherId || assignment.current_teacher_id || '').toLowerCase();
      if (assignedTeacherId !== teacherAccountId.toLowerCase()) {
        return {
          status: 404,
          error: {
            code: 'LESSON_NOT_FOUND',
            message: 'Bài học không tồn tại hoặc không được phân công cho bạn.',
          },
        };
      }

      // 3. CAS token verification
      const actualVersion = (currentLesson.rowVersion ?? currentLesson.row_version ?? 1n).toString();
      if (actualVersion !== expectedRowVersion) {
        return {
          status: 409,
          error: {
            code: 'STALE_LESSON',
            message: 'Dữ liệu bài học đã bị thay đổi bởi tác vụ khác. Vui lòng tải lại dữ liệu mới nhất.',
          },
        };
      }

      // 5. Fetch latest AssignmentHistory episode and verify consistency
      const latestEpisode = await tx.assignmentHistory.findFirst({
        where: { assignmentId: assignment.id },
        orderBy: { sequenceNo: 'desc' },
      });

      if (!latestEpisode) {
        return {
          status: 409,
          error: {
            code: 'INCONSISTENT_ASSIGNMENT_HISTORY',
            message: 'Lịch sử phân công không tồn tại hoặc không đồng nhất.',
          },
        };
      }

      const nextTeacherId = String(latestEpisode.nextTeacherId || latestEpisode.next_teacher_id || '').toLowerCase();
      const episodeScopeGen = (latestEpisode.scopeGeneration ?? latestEpisode.scope_generation ?? 1n).toString();
      const assignmentScopeGen = (assignment.scopeGeneration ?? assignment.scope_generation ?? 1n).toString();

      if (nextTeacherId !== teacherAccountId.toLowerCase() || episodeScopeGen !== assignmentScopeGen) {
        return {
          status: 409,
          error: {
            code: 'INCONSISTENT_ASSIGNMENT_HISTORY',
            message: 'Lịch sử phân công không đồng nhất với giáo viên hoặc thế hệ phạm vi hiện tại.',
          },
        };
      }

      // 6. Fetch highest revision across ALL statuses
      const highestRev = await tx.lessonRevision.findFirst({
        where: { lessonId: lessonId.toLowerCase() },
        orderBy: { revisionNo: 'desc' },
        include: {
          _count: {
            select: {
              exercises: true,
              vocabularyLinks: true,
              mediaBindings: true,
              authoredItemRevisions: true,
              attempts: true,
              assessmentVersionItems: true,
            },
          },
        },
      });

      if (highestRev) {
        // Must be DRAFT and never submitted
        if (highestRev.status !== 'DRAFT') {
          return {
            status: 409,
            error: {
              code: 'DRAFT_NOT_EDITABLE',
              message: `Bản sửa đổi hiện tại có trạng thái ${highestRev.status}, không thể lưu bản nháp mới.`,
            },
          };
        }

        if (
          highestRev.submittedAt != null ||
          highestRev.submittedBy != null ||
          highestRev.submittedAssignmentGeneration != null ||
          highestRev.assignmentScopeSnapshot != null ||
    highestRev.approvedBy != null || highestRev.approvedAt != null ||
    highestRev.publishedBy != null || highestRev.publishedAt != null || highestRev.endedAt != null
        ) {
          return {
            status: 409,
            error: {
              code: 'DRAFT_NOT_EDITABLE',
              message: 'Bản nháp đã từng được nộp duyệt và đã bị khóa quy trình.',
            },
          };
        }

        // Structure check: title & blocks
        if (!isSupportedTitle(highestRev.title) || !isSupportedContentBlocks(highestRev.contentBlocks)) {
          return {
            status: 409,
            error: {
              code: 'UNSUPPORTED_DRAFT_CONTENT',
              message: 'Bản nháp hiện tại chứa cấu trúc dữ liệu không được hỗ trợ để chỉnh sửa.',
            },
          };
        }

        // Association check
        if (hasRevisionAssociations(highestRev)) {
          return {
            status: 409,
            error: {
              code: 'UNSUPPORTED_DRAFT_CONTENT',
              message: 'Bản nháp hiện tại có bài tập, từ vựng hoặc phương tiện liên kết, không thể lưu kế thừa.',
            },
          };
        }
      }

      // 7. Prepare merged title and successor content
      const mergedTitle: Record<string, string> = highestRev ? parseJsonRecord(highestRev.title) : {};
      if (inputTitle.vi !== undefined) {
        const trimmed = inputTitle.vi.trim();
        if (trimmed) mergedTitle.vi = trimmed;
        else delete mergedTitle.vi;
      }
      if (inputTitle.en !== undefined) {
        const trimmed = inputTitle.en.trim();
        if (trimmed) mergedTitle.en = trimmed;
        else delete mergedTitle.en;
      }

      const nextRevisionNo = highestRev ? highestRev.revisionNo + 1 : 1;
      const priorRevId = highestRev ? highestRev.id : null;

      // Preserve server-read metadata from predecessor without exposing for edit
      const topicIds = highestRev?.topicIds ?? [];
      const skillIds = highestRev?.skillIds ?? [];
      const purposeTags = highestRev?.purposeTags ?? [];
      const coverageCatalogGeneration = highestRev?.coverageCatalogGeneration ?? null;
      const coverageSnapshot = highestRev?.coverageSnapshot ?? null;

      // 8. Insert new LessonRevision
      await tx.lessonRevision.create({
        data: {
          lessonId: lessonId.toLowerCase(),
          revisionNo: nextRevisionNo,
          priorRevisionId: priorRevId,
          changeSummary: changeSummary ? changeSummary.trim() : null,
          assignmentId: assignment.id,
          creationAssignmentEpisodeId: latestEpisode.id,
          status: 'DRAFT',
          title: mergedTitle,
          contentBlocks,
          topicIds,
          skillIds,
          purposeTags,
          coverageCatalogGeneration,
          ...(coverageSnapshot == null ? {} : { coverageSnapshot }),
          createdBy: teacherAccountId.toLowerCase(),
          lastEditedBy: teacherAccountId.toLowerCase(),
          rowVersion: 1n,
        },
      });

      // 9. Increment Lesson.rowVersion once; leave activeRevisionId unchanged
      await tx.lesson.update({
        where: { id: lessonId.toLowerCase() },
        data: {
          rowVersion: { increment: 1n },
        },
      });

      // 10. Return authoritative LessonDetailDto
      const fullLesson = await tx.lesson.findUnique({
        where: { id: lessonId.toLowerCase() },
        include: lessonRelations,
      });

      return {
        status: 200,
        data: { data: toLessonDetailDto(fullLesson) },
      };
    });
  } catch (err) {
    const errorRes = handleLessonPrismaError(err, 'saveTeacherLessonDraft');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}
