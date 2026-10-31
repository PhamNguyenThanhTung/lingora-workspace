import { revisionChildRelations, unsupportedChildren, sameVocabularyMetadata, vocabularySnapshotSchema } from './snapshot.ts';
import { z } from 'zod';
import { getProductPrisma } from '../db/index.js';
import { isValidUuid, type ApiErrorEnvelope } from '../frameworks/index.ts';
import {
  saveTeacherDraftExtendedSchema,
  computeExerciseFingerprint,
  normalizeVocabularyTerm,
  type ExerciseInput,
  type VocabularyInput,
  type ExerciseType,
} from './content.ts';

export { isValidUuid };
export {
  saveTeacherDraftExtendedSchema,
  computeExerciseFingerprint,
  normalizeVocabularyTerm,
  type ExerciseInput,
  type VocabularyInput,
  type ExerciseType,
};
export {
  WORKFLOW_STATUS_LABELS,
  getWorkflowStatusLabel,
  submitLessonSchema,
  reviewMutationSchema,
  publishLessonSchema,
  submitTeacherLesson,
  getReviewQueue,
  getReviewDetail,
  requestChangesReview,
  approveReview,
  publishReview,
  type ReviewQueueItemDto,
  type ReviewDetailDto,
  type ReviewExerciseDto,
  type ReviewVocabularyDto,
  type ReviewHistoryEventDto,
} from './workflow.ts';

// =============================================================================
// Interfaces & DTOs
// =============================================================================

export interface TeacherExerciseDto {
  id: string;
  itemId: string;
  itemRevisionId: string;
  position: number;
  isCore: boolean;
  type: ExerciseType;
  promptData: any;
  gradingData: any;
  feedbackData: any;
}

export interface TeacherVocabularyDto {
  id: string;
  vocabularyId: string;
  position: number;
  isCore: boolean;
  displaySnapshot: {
    schemaVersion: number;
    languageId: string;
    canonicalForm: string;
    senseKey?: string | null;
    meaningLabels: Record<string, string>;
    phonetic: string | null;
    partOfSpeech: string | null;
    example: string | null;
  };
}

export interface VocabularyOptionDto {
  id: string;
  languageId: string;
  canonicalForm: string;
  senseKey: string;
  meaningLabels: Record<string, string>;
  phonetic: string | null;
  partOfSpeech: string | null;
  example: string | null;
}

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
  rowVersion?: string;
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

export interface TeacherLessonDetailDto extends LessonDetailDto {
  courseContext: LessonDetailDto['courseContext'] & {
    languageId: string;
  };
  exercises: TeacherExerciseDto[];
  vocabulary: TeacherVocabularyDto[];
  latestFeedback?: {
    comment: string | null;
    occurredAt: string;
  } | null;
}

export interface TeacherOptionDto {
  id: string;
  displayName: string | null;
}

export class ControlledDraftError extends Error {
  status: number;
  error: ApiErrorEnvelope['error'];
  constructor(status: number, error: ApiErrorEnvelope['error']) {
    super(error?.message || 'ControlledDraftError');
    this.status = status;
    this.error = error;
    this.name = 'ControlledDraftError';
  }
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
  return hasUnsupportedRevisionAssociations(rev);
}

export function hasUnsupportedRevisionAssociations(rev: any, languageId?: string, allowFrozenPredecessor = false): boolean {
  return unsupportedChildren(rev, languageId, allowFrozenPredecessor);
}

export function evaluateEditability(highestRev: any, languageId?: string): { isEditable: boolean; editabilityReason: string | null } {
  if (!highestRev) {
    return { isEditable: true, editabilityReason: null };
  }
  if (highestRev.status === 'IN_REVIEW') {
    return {
      isEditable: false,
      editabilityReason: 'Bài học đang trong quá trình xét duyệt của Quản trị viên. Bạn không thể chỉnh sửa trong thời gian này.',
    };
  }
  if (highestRev.status === 'APPROVED') {
    return {
      isEditable: false,
      editabilityReason: 'Bài học đã được duyệt và đang chờ xuất bản.',
    };
  }
  if (highestRev.status === 'CHANGES_REQUESTED') {
    return {
      isEditable: false,
      editabilityReason: 'Bài học đã có yêu cầu chỉnh sửa từ Quản trị viên. Bạn có thể chọn "Chỉnh sửa lại" để tạo bản nháp mới.',
    };
  }
  if (highestRev.status === 'PUBLISHED') {
    return {
      isEditable: false,
      editabilityReason: 'Bản sửa đổi này đã được xuất bản. Bạn có thể chọn "Tạo bản nháp mới" để tiếp tục cập nhật.',
    };
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
  if (hasUnsupportedRevisionAssociations(highestRev, languageId)) {
    return {
      isEditable: false,
      editabilityReason: 'Bản nháp gắn liền với các liên kết bài tập hoặc từ vựng không được hỗ trợ trong phân hệ này.',
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
      rowVersion: (highestRev.rowVersion ?? 1n).toString(),
    };
  }

  const { isEditable, editabilityReason } = evaluateEditability(highestRev, course.languageId);

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
      rowVersion: (rev.rowVersion ?? 1n).toString(),
    };
  });

  return {
    ...summary,
    currentDraft,
    revisions: revisionSummaries,
  };
}

export function toTeacherLessonDetailDto(lesson: any, languageId?: string): TeacherLessonDetailDto {
  const baseDetail = toLessonDetailDto(lesson);
  const revisions = Array.isArray(lesson.revisions) ? lesson.revisions : [];
  const sortedRevisions = [...revisions].sort((a, b) => b.revisionNo - a.revisionNo);
  const highestRev = sortedRevisions[0] || null;

  const exercises: TeacherExerciseDto[] = [];
  if (highestRev && Array.isArray(highestRev.exercises)) {
    for (const ex of highestRev.exercises) {
      const itemRev = ex.itemRevision || {};
      const secret = itemRev.gradingSecret || {};
      exercises.push({
        id: ex.id,
        itemId: ex.itemId,
        itemRevisionId: ex.itemRevisionId,
        position: ex.position,
        isCore: ex.isCore,
        type: itemRev.type || '',
        promptData: typeof itemRev.promptData?.prompt === 'string' ? itemRev.promptData : {prompt: 'Định dạng bài tập không được hỗ trợ'},
        gradingData: secret.gradingData || {},
        feedbackData: secret.feedbackData || null,
      });
    }
  }

  const vocabulary: TeacherVocabularyDto[] = [];
  if (highestRev && Array.isArray(highestRev.vocabularyLinks)) {
    for (const link of highestRev.vocabularyLinks) {
      const snap = link.displaySnapshot || {};
      vocabulary.push({
        id: link.id,
        vocabularyId: link.vocabularyId,
        position: link.position,
        isCore: link.isCore,
        displaySnapshot: {
          schemaVersion: snap.schemaVersion || 1,
          languageId: snap.languageId || '',
          canonicalForm: typeof snap.canonicalForm === 'string' ? snap.canonicalForm : 'Định dạng từ vựng không được hỗ trợ',
          senseKey: typeof snap.senseKey === 'string' ? snap.senseKey : null,
          meaningLabels: parseJsonRecord(snap.meaningLabels),
          phonetic: typeof snap.phonetic === 'string' ? snap.phonetic : null,
          partOfSpeech: typeof snap.partOfSpeech === 'string' ? snap.partOfSpeech : null,
          example: typeof snap.example === 'string' ? snap.example : null,
        },
      });
    }
  }

  const courseLangId = languageId || lesson.unit?.course?.languageId || '';

  let latestFeedback: TeacherLessonDetailDto['latestFeedback'] = null;
  if (highestRev && highestRev.status === 'CHANGES_REQUESTED') {
    const revReviews = Array.isArray(highestRev.reviews) ? highestRev.reviews : [];
    const changeReqReview = revReviews.find((r: any) => r.action === 'REQUEST_CHANGES');
    if (changeReqReview) {
      latestFeedback = {
        comment: changeReqReview.comment || null,
        occurredAt: (changeReqReview.occurredAt instanceof Date ? changeReqReview.occurredAt : new Date(changeReqReview.occurredAt)).toISOString(),
      };
    }
  }

  return {
    ...baseDetail,
    courseContext: {
      ...baseDetail.courseContext,
      languageId: courseLangId,
    },
    exercises,
    vocabulary,
    latestFeedback,
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
            message: op === 'saveTeacherLessonDraft' ? 'Nội dung bị xung đột khi lưu. Hãy tải dữ liệu mới nhất và thử lại.' : 'Vị trí bài học đã tồn tại trong đơn vị bài học này. Vui lòng chọn vị trí khác.',
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
export async function lockAccounts(tx: any, accountIds: string[]) {
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

export async function lockLesson(tx: any, lessonId: string) {
  const rows = await tx.$queryRaw`
    SELECT id::text, unit_id::text AS "unitId", position,
      is_required AS "isRequired", availability,
      active_revision_id::text AS "activeRevisionId", row_version AS "rowVersion"
    FROM app.lessons WHERE id = ${lessonId.toLowerCase()}::uuid FOR UPDATE
  `;
  return rows[0] || null;
}

export async function lockAssignment(tx: any, lessonId: string) {
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
  ...revisionChildRelations,
  creator: { select: { id: true, displayName: true } },
  lastEditor: { select: { id: true, displayName: true } },
  _count: { select: { exercises: true, vocabularyLinks: true, mediaBindings: true, authoredItemRevisions: true, attempts: true, assessmentVersionItems: true } },
};
const lessonRelations = {
  unit: { select: { id: true, courseId: true, position: true, code: true, names: true, course: { select: { id: true, names: true, languageId: true } } } },
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
): Promise<{ status: number; data?: { data: TeacherLessonDetailDto }; error?: ApiErrorEnvelope['error'] }> {
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
      include: {
        unit: {
          select: {
            id: true,
            courseId: true,
            position: true,
            code: true,
            names: true,
            course: {
              select: {
                id: true,
                names: true,
                languageId: true,
              },
            },
          },
        },
        assignment: {
          include: {
            currentTeacher: {
              select: { id: true, displayName: true, status: true },
            },
          },
        },
        revisions: {
          orderBy: { revisionNo: 'desc' },
          include: {
            creator: { select: { id: true, displayName: true } },
            lastEditor: { select: { id: true, displayName: true } },
            ...revisionChildRelations,
            reviews: {
              orderBy: { occurredAt: 'desc' },
              select: { action: true, occurredAt: true, comment: true },
            },
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
        },
      },
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

    const courseLanguageId = lesson.unit?.course?.languageId || '';

    return {
      status: 200,
      data: { data: toTeacherLessonDetailDto(lesson, courseLanguageId) },
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

export async function getTeacherVocabularyOptions(
  teacherAccountId: string,
  lessonId: string,
  rawQuery: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: VocabularyOptionDto[] }; error?: ApiErrorEnvelope['error'] }> {
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
    const teacher = await prisma.account.findUnique({
      where: { id: teacherAccountId.toLowerCase() },
    });
    if (!teacher || teacher.role !== 'TEACHER') {
      return {
        status: 403,
        error: {
          code: 'FORBIDDEN',
          message: 'Chỉ giáo viên mới có quyền tra cứu từ vựng bài học.',
        },
      };
    }
    if (teacher.status !== 'ACTIVE') {
      return {
        status: 403,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Tài khoản giáo viên đang chờ duyệt hoặc đã bị vô hiệu hóa.',
        },
      };
    }

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId.toLowerCase(),
        assignment: {
          currentTeacherId: teacherAccountId.toLowerCase(),
        },
      },
      include: {
        unit: {
          include: {
            course: true,
          },
        },
      },
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

    const courseLanguageId = lesson.unit?.course?.languageId;
    if (!courseLanguageId) {
      return {
        status: 503,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Không tìm thấy ngôn ngữ mục tiêu của khóa học.',
        },
      };
    }

    const trimmedQ = (rawQuery || '').trim();
    if (trimmedQ.length > 300) return { status: 400, error: { code: 'VALIDATION_ERROR', message: 'Từ tìm kiếm tối đa 300 ký tự.' } };
    if (!trimmedQ) {
      return {
        status: 200,
        data: { data: [] },
      };
    }

    const normalizedTerm = normalizeVocabularyTerm(trimmedQ);
    const concepts = await prisma.vocabularyConcept.findMany({
      where: {
        languageId: courseLanguageId.toLowerCase(),
        normalizedForm: normalizedTerm,
      },
      orderBy: {
        senseKey: 'asc',
      },
      take: 20,
    });

    const dtos: VocabularyOptionDto[] = concepts.map((c: any) => ({
      id: c.id,
      languageId: c.languageId,
      canonicalForm: c.canonicalForm,
      senseKey: c.senseKey,
      meaningLabels: parseJsonRecord(c.meaningLabels),
      phonetic: c.phonetic || null,
      partOfSpeech: c.partOfSpeech || null,
      example: c.example || null,
    }));

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

export async function saveTeacherLessonDraft(
  teacherAccountId: string,
  lessonId: string,
  rawBody: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: { data: TeacherLessonDetailDto }; error?: ApiErrorEnvelope['error'] }> {
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

  const parseResult = saveTeacherDraftExtendedSchema.safeParse(rawBody);
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

  const {
    title: inputTitle,
    contentBlocks,
    changeSummary,
    expectedRowVersion,
    expectedRevisionId,
    exercises: inputExercises,
    vocabulary: inputVocabulary,
  } = parseResult.data;

  // Check duplicate positions in exercises
  if (inputExercises) {
    const posSet = new Set<number>();
    for (const ex of inputExercises) {
      if (posSet.has(ex.position)) {
        return {
          status: 409,
          error: {
            code: 'DUPLICATE_EXERCISE_POSITION',
            message: `Trùng lặp thứ tự vị trí bài tập: ${ex.position}. Mỗi bài tập trong bài học phải có thứ tự vị trí duy nhất.`,
          },
        };
      }
      posSet.add(ex.position);
    }
    const sourceExSet = new Set<string>();
    for (const ex of inputExercises) {
      if (ex.sourceExerciseId) {
        const sId = ex.sourceExerciseId.toLowerCase();
        if (sourceExSet.has(sId)) {
          return {
            status: 409,
            error: {
              code: 'REVISION_CONFLICT',
              message: 'Không được tham chiếu trùng lặp một bài tập nguồn trong cùng một lần lưu.',
            },
          };
        }
        sourceExSet.add(sId);
      }
    }
  }

  // Check duplicate positions in vocabulary
  if (inputVocabulary) {
    const posSet = new Set<number>();
    for (const voc of inputVocabulary) {
      if (posSet.has(voc.position)) {
        return {
          status: 409,
          error: {
            code: 'DUPLICATE_VOCABULARY_POSITION',
            message: `Trùng lặp thứ tự vị trí từ vựng: ${voc.position}. Mỗi từ vựng trong bài học phải có thứ tự vị trí duy nhất.`,
          },
        };
      }
      posSet.add(voc.position);
    }
    const sourceLinkSet = new Set<string>();
    for (const voc of inputVocabulary) {
      if (voc.sourceLinkId) {
        const sId = voc.sourceLinkId.toLowerCase();
        if (sourceLinkSet.has(sId)) {
          return {
            status: 409,
            error: {
              code: 'DUPLICATE_VOCABULARY_LINK',
              message: 'Không được tham chiếu trùng lặp một liên kết từ vựng nguồn trong cùng một lần lưu.',
            },
          };
        }
        sourceLinkSet.add(sId);
      }
    }
    const vocabIdSet = new Set<string>();
    for (const voc of inputVocabulary) {
      if (voc.vocabularyId) {
        const vId = voc.vocabularyId.toLowerCase();
        if (vocabIdSet.has(vId)) {
          return {
            status: 409,
            error: {
              code: 'DUPLICATE_VOCABULARY_LINK',
              message: 'Không được thêm trùng một khái niệm từ vựng trong cùng một bài học.',
            },
          };
        }
        vocabIdSet.add(vId);
      }
    }
  }

  const prisma = prismaClient || getProductPrisma();

  try {
    return await prisma.$transaction(async (tx: any) => {
      // 1. Lock saving Teacher account FOR NO KEY UPDATE
      const accounts = await lockAccounts(tx, [teacherAccountId]);
      const teacherAcc = accounts.get(teacherAccountId.toLowerCase());
      if (!teacherAcc || teacherAcc.role !== 'TEACHER') {
        throw new ControlledDraftError(403, {
          code: 'FORBIDDEN',
          message: 'Tài khoản không thuộc phân hệ giáo viên.',
        });
      }
      if (teacherAcc.status !== 'ACTIVE') {
        throw new ControlledDraftError(403, {
          code: 'ACCOUNT_INACTIVE',
          message: 'Tài khoản giáo viên đang chờ duyệt hoặc đã bị vô hiệu hóa.',
        });
      }

      // 2. Lock Lesson FOR UPDATE
      const currentLesson = await lockLesson(tx, lessonId);
      if (!currentLesson) {
        throw new ControlledDraftError(404, {
          code: 'LESSON_NOT_FOUND',
          message: 'Bài học không tồn tại hoặc không được phân công cho bạn.',
        });
      }

      // 3. Lock Assignment FOR UPDATE & verify ownership
      const assignment = await lockAssignment(tx, lessonId);
      if (!assignment) {
        throw new ControlledDraftError(404, {
          code: 'LESSON_NOT_FOUND',
          message: 'Bài học không tồn tại hoặc không được phân công cho bạn.',
        });
      }

      const assignedTeacherId = String(assignment.currentTeacherId || assignment.current_teacher_id || '').toLowerCase();
      if (assignedTeacherId !== teacherAccountId.toLowerCase()) {
        throw new ControlledDraftError(404, {
          code: 'LESSON_NOT_FOUND',
          message: 'Bài học không tồn tại hoặc không được phân công cho bạn.',
        });
      }

      // 4. CAS token verification
      const actualVersion = (currentLesson.rowVersion ?? currentLesson.row_version ?? 1n).toString();
      if (actualVersion !== expectedRowVersion) {
        throw new ControlledDraftError(409, {
          code: 'STALE_LESSON',
          message: 'Dữ liệu bài học đã bị thay đổi bởi tác vụ khác. Vui lòng tải lại dữ liệu mới nhất.',
        });
      }

      // 5. Fetch latest AssignmentHistory episode and verify consistency
      const latestEpisode = await tx.assignmentHistory.findFirst({
        where: { assignmentId: assignment.id },
        orderBy: { sequenceNo: 'desc' },
      });

      if (!latestEpisode) {
        throw new ControlledDraftError(409, {
          code: 'INCONSISTENT_ASSIGNMENT_HISTORY',
          message: 'Lịch sử phân công không tồn tại hoặc không đồng nhất.',
        });
      }

      const nextTeacherId = String(latestEpisode.nextTeacherId || latestEpisode.next_teacher_id || '').toLowerCase();
      const episodeScopeGen = (latestEpisode.scopeGeneration ?? latestEpisode.scope_generation ?? 1n).toString();
      const assignmentScopeGen = (assignment.scopeGeneration ?? assignment.scope_generation ?? 1n).toString();

      if (nextTeacherId !== teacherAccountId.toLowerCase() || episodeScopeGen !== assignmentScopeGen) {
        throw new ControlledDraftError(409, {
          code: 'INCONSISTENT_ASSIGNMENT_HISTORY',
          message: 'Lịch sử phân công không đồng nhất với giáo viên hoặc thế hệ phạm vi hiện tại.',
        });
      }

      // 6. Fetch highest revision across ALL statuses
      const highestRev = await tx.lessonRevision.findFirst({
        where: { lessonId: lessonId.toLowerCase() },
        orderBy: { revisionNo: 'desc' },
        include: {
          ...revisionChildRelations,
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

      // 7. Verify expectedRevisionId if supplied
      if (expectedRevisionId !== undefined) {
        if (expectedRevisionId === null && highestRev !== null) {
          throw new ControlledDraftError(409, {
            code: 'REVISION_CONFLICT',
            message: 'expectedRevisionId null chỉ được phép trước khi có bản sửa đổi đầu tiên.',
          });
        }
        if (expectedRevisionId !== null && (!highestRev || highestRev.id.toLowerCase() !== expectedRevisionId.toLowerCase())) {
          throw new ControlledDraftError(409, {
            code: 'REVISION_CONFLICT',
            message: 'Bản sửa đổi dự kiến (expectedRevisionId) không khớp với bản sửa đổi cao nhất hiện tại.',
          });
        }
      }

      // 8. Validate highest revision editability
      if (highestRev) {
        if (highestRev.status === 'IN_REVIEW' || highestRev.status === 'APPROVED') {
          throw new ControlledDraftError(409, {
            code: 'DRAFT_NOT_EDITABLE',
            message: `Bản sửa đổi hiện tại có trạng thái ${highestRev.status}, quy trình đang khóa và không thể chỉnh sửa.`,
          });
        }

        if (highestRev.status === 'ARCHIVED' || highestRev.status === 'WITHDRAWN') {
          throw new ControlledDraftError(409, {
            code: 'DRAFT_NOT_EDITABLE',
            message: `Bản sửa đổi hiện tại có trạng thái ${highestRev.status}, không thể chỉnh sửa.`,
          });
        }

        if (highestRev.status === 'DRAFT') {
          if (
            highestRev.submittedAt != null ||
            highestRev.submittedBy != null ||
            highestRev.submittedAssignmentGeneration != null ||
            highestRev.assignmentScopeSnapshot != null ||
            highestRev.approvedBy != null ||
            highestRev.approvedAt != null ||
            highestRev.publishedBy != null ||
            highestRev.publishedAt != null ||
            highestRev.endedAt != null
          ) {
            throw new ControlledDraftError(409, {
              code: 'DRAFT_NOT_EDITABLE',
              message: 'Bản nháp đã từng được nộp duyệt và đã bị khóa quy trình.',
            });
          }
        }

        if (!isSupportedTitle(highestRev.title) || !isSupportedContentBlocks(highestRev.contentBlocks)) {
          throw new ControlledDraftError(409, {
            code: 'UNSUPPORTED_DRAFT_CONTENT',
            message: 'Bản nháp hiện tại chứa cấu trúc dữ liệu không được hỗ trợ để chỉnh sửa.',
          });
        }

      }

      // 9. Fetch course target language
      const unit = await tx.unit.findUnique({
        where: { id: currentLesson.unitId.toLowerCase() },
        select: {
          id: true,
          course: {
            select: { id: true, languageId: true },
          },
        },
      });

      const courseLanguageId = unit?.course?.languageId;
      if (!courseLanguageId) {
        throw new ControlledDraftError(503, {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Không tìm thấy ngôn ngữ mục tiêu của khóa học.',
        });
      }

      const mayCopyFrozenPredecessor = highestRev?.status === 'CHANGES_REQUESTED' || highestRev?.status === 'PUBLISHED';
      if (hasUnsupportedRevisionAssociations(highestRev, courseLanguageId, mayCopyFrozenPredecessor)) {
        throw new ControlledDraftError(409, {code: 'UNSUPPORTED_DRAFT_CONTENT', message: 'Bản nháp có nội dung hoặc liên kết không được hỗ trợ; không thể lưu kế thừa.'});
      }

      // 10. Map predecessor elements
      const predExercisesMap = new Map<string, any>();
      if (highestRev?.exercises) {
        for (const ex of highestRev.exercises) {
          predExercisesMap.set(ex.id.toLowerCase(), ex);
        }
      }
      const predVocabMap = new Map<string, any>();
      if (highestRev?.vocabularyLinks) {
        for (const vl of highestRev.vocabularyLinks) {
          predVocabMap.set(vl.id.toLowerCase(), vl);
        }
      }

      // Check sourceExerciseId validity
      if (inputExercises !== undefined) {
        for (const ex of inputExercises) {
          if (ex.sourceExerciseId) {
            const pred = predExercisesMap.get(ex.sourceExerciseId.toLowerCase());
            if (!pred) {
              throw new ControlledDraftError(404, {
                code: 'RELATION_NOT_FOUND',
                message: 'Bài tập nguồn không tồn tại trong bản sửa đổi trước đó.',
              });
            }
          }
        }
      }

      // Check sourceLinkId and vocabularyId validity & language matching
      if (inputVocabulary !== undefined) {
        for (const voc of inputVocabulary) {
          if (voc.sourceLinkId) {
            const pred = predVocabMap.get(voc.sourceLinkId.toLowerCase());
            if (!pred) {
              throw new ControlledDraftError(404, {
                code: 'RELATION_NOT_FOUND',
                message: 'Liên kết từ vựng nguồn không tồn tại trong bản sửa đổi trước đó.',
              });
            }
          }
          if (voc.vocabularyId) {
            const concept = await tx.vocabularyConcept.findUnique({
              where: { id: voc.vocabularyId.toLowerCase() },
            });
            if (!concept) {
              throw new ControlledDraftError(404, {
                code: 'RELATION_NOT_FOUND',
                message: 'Không tìm thấy khái niệm từ vựng.',
              });
            }
            if (concept.languageId.toLowerCase() !== courseLanguageId.toLowerCase()) {
              throw new ControlledDraftError(409, {
                code: 'VOCABULARY_LANGUAGE_MISMATCH',
                message: 'Ngôn ngữ của từ vựng không khớp với ngôn ngữ mục tiêu của khóa học.',
              });
            }
          }
        }
      }

      // Resolve vocabulary concept targets & check duplicate links / identity conflicts
      const resolvedConceptIdPerIndex: string[] = [];
      if (inputVocabulary !== undefined) {
        for (let i = 0; i < inputVocabulary.length; i++) {
          const voc = inputVocabulary[i];
          if (voc.sourceLinkId) {
            const pred = predVocabMap.get(voc.sourceLinkId.toLowerCase())!;
            resolvedConceptIdPerIndex[i] = pred.vocabularyId.toLowerCase();
          } else if (voc.vocabularyId) {
            resolvedConceptIdPerIndex[i] = voc.vocabularyId.toLowerCase();
          } else if (voc.create) {
            const norm = normalizeVocabularyTerm(voc.create.canonicalForm);
            const sense = voc.create.senseKey.trim();
            const existing = await tx.vocabularyConcept.findUnique({
              where: {
                languageId_normalizedForm_senseKey: {
                  languageId: courseLanguageId.toLowerCase(),
                  normalizedForm: norm,
                  senseKey: sense,
                },
              },
            });
            if (existing) {
              const existingVi = (existing.meaningLabels?.vi || '').trim();
              const existingEn = (existing.meaningLabels?.en || '').trim();
              const inputVi = (voc.create.meaningLabels.vi || '').trim();
              const inputEn = (voc.create.meaningLabels.en || '').trim();
              const existingPhonetic = existing.phonetic?.trim() || null;
              const inputPhonetic = voc.create.phonetic?.trim() || null;
              const existingPos = existing.partOfSpeech?.trim() || null;
              const inputPos = voc.create.partOfSpeech?.trim() || null;
              const existingEx = existing.example?.trim() || null;
              const inputEx = voc.create.example?.trim() || null;
              const existingCanonical = existing.canonicalForm.normalize('NFC').trim();
              const inputCanonical = voc.create.canonicalForm.normalize('NFC').trim();

              const isMatch =
                existingCanonical === inputCanonical &&
                existingVi === inputVi &&
                existingEn === inputEn &&
                existingPhonetic === inputPhonetic &&
                existingPos === inputPos &&
                existingEx === inputEx;

              if (!isMatch) {
                throw new ControlledDraftError(409, {
                  code: 'VOCABULARY_IDENTITY_CONFLICT',
                  message: `Từ vựng "${existingCanonical}" với nghĩa "${sense}" đã tồn tại nhưng có thông tin khác. Vui lòng chọn từ vựng có sẵn hoặc chọn nghĩa (senseKey) khác.`,
                });
              }
              resolvedConceptIdPerIndex[i] = existing.id.toLowerCase();
            } else {
              resolvedConceptIdPerIndex[i] = `new:${JSON.stringify([norm, sense])}`;
            }
          }
        }

        const seenConcepts = new Set<string>();
        for (const cId of resolvedConceptIdPerIndex) {
          if (seenConcepts.has(cId)) {
            throw new ControlledDraftError(409, {
              code: 'DUPLICATE_VOCABULARY_LINK',
              message: 'Không được thêm trùng một khái niệm từ vựng trong cùng một bài học.',
            });
          }
          seenConcepts.add(cId);
        }
      }

      // 11. Lock retained ItemIdentity rows in sorted UUID order
      const retainedItemIdsToLock: string[] = [];
      if (inputExercises === undefined) {
        if (highestRev?.exercises) {
          for (const ex of highestRev.exercises) {
            retainedItemIdsToLock.push(ex.itemId.toLowerCase());
          }
        }
      } else {
        for (const ex of inputExercises) {
          if (ex.sourceExerciseId) {
            const pred = predExercisesMap.get(ex.sourceExerciseId.toLowerCase())!;
            retainedItemIdsToLock.push(pred.itemId.toLowerCase());
          }
        }
      }
      const sortedItemIds = [...new Set(retainedItemIdsToLock)].sort();
      for (const itId of sortedItemIds) {
        await tx.$queryRaw`
          SELECT id::text FROM app.item_identities WHERE id = ${itId}::uuid FOR UPDATE
        `;
      }

      // 12. Prepare merged title and successor content
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

      // Preserve server-read metadata
      const topicIds = highestRev?.topicIds ?? [];
      const skillIds = highestRev?.skillIds ?? [];
      const purposeTags = highestRev?.purposeTags ?? [];
      const coverageCatalogGeneration = highestRev?.coverageCatalogGeneration ?? null;
      const coverageSnapshot = highestRev?.coverageSnapshot ?? null;

      // 13. Insert new LessonRevision
      const newRev = await tx.lessonRevision.create({
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

      // 14. Persist Exercises
      if (inputExercises === undefined) {
        // Clone predecessor exercises
        if (highestRev?.exercises) {
          for (const pred of highestRev.exercises) {
            const maxRevRow = await tx.itemRevision.findFirst({
              where: { itemId: pred.itemId.toLowerCase() },
              orderBy: { revisionNo: 'desc' },
            });
            const nextRevNo = (maxRevRow?.revisionNo ?? 0) + 1;
            const newItemRev = await tx.itemRevision.create({
              data: {
                itemId: pred.itemId.toLowerCase(),
                revisionNo: nextRevNo,
                type: pred.itemRevision.type,
                promptData: pred.itemRevision.promptData,
                practiceSkillIds: pred.itemRevision.practiceSkillIds || [],
                practiceCoverageSnapshot: pred.itemRevision.practiceCoverageSnapshot || undefined,
                schemaVersion: 1,
                exactFingerprint: pred.itemRevision.exactFingerprint,
                createdBy: teacherAccountId.toLowerCase(),
                creationAssignmentEpisodeId: latestEpisode.id,
                authoringLessonRevisionId: newRev.id,
                rowVersion: 1n,
              },
            });
            await tx.itemGradingSecret.create({
              data: {
                itemRevisionId: newItemRev.id,
                gradingData: pred.itemRevision.gradingSecret.gradingData,
                feedbackData: pred.itemRevision.gradingSecret.feedbackData || undefined,
                schemaVersion: 1,
              },
            });
            await tx.lessonExercise.create({
              data: {
                lessonRevisionId: newRev.id,
                itemRevisionId: newItemRev.id,
                itemId: pred.itemId.toLowerCase(),
                position: pred.position,
                isCore: pred.isCore,
              },
            });
          }
        }
      } else {
        // Insert supplied exercises
        for (const exInput of inputExercises) {
          const feedbackData = exInput.feedbackData?.explanation?.trim() ? { explanation: exInput.feedbackData.explanation.trim() } : undefined;
          const fp = computeExerciseFingerprint({
            type: exInput.type,
            schemaVersion: 1,
            promptData: exInput.promptData,
            gradingData: exInput.gradingData,
            feedbackData,
          });

          let targetItemId: string;
          let nextRevNo: number;
          let sourceSkillIds: string[] = [];
          let sourceCoverageSnapshot: any = undefined;

          if (exInput.sourceExerciseId) {
            const pred = predExercisesMap.get(exInput.sourceExerciseId.toLowerCase())!;
            targetItemId = pred.itemId.toLowerCase();
            sourceSkillIds = pred.itemRevision?.practiceSkillIds || [];
            sourceCoverageSnapshot = pred.itemRevision?.practiceCoverageSnapshot || undefined;
            const maxRevRow = await tx.itemRevision.findFirst({
              where: { itemId: targetItemId },
              orderBy: { revisionNo: 'desc' },
            });
            nextRevNo = (maxRevRow?.revisionNo ?? 0) + 1;
          } else {
            const newIdentity = await tx.itemIdentity.create({
              data: {
                origin: 'PRACTICE',
                createdBy: teacherAccountId.toLowerCase(),
                exactFingerprint: fp,
              },
            });
            targetItemId = newIdentity.id;
            nextRevNo = 1;
          }

          const newItemRev = await tx.itemRevision.create({
            data: {
              itemId: targetItemId,
              revisionNo: nextRevNo,
              type: exInput.type,
              promptData: exInput.promptData,
              practiceSkillIds: sourceSkillIds,
              practiceCoverageSnapshot: sourceCoverageSnapshot,
              schemaVersion: 1,
              exactFingerprint: fp,
              createdBy: teacherAccountId.toLowerCase(),
              creationAssignmentEpisodeId: latestEpisode.id,
              authoringLessonRevisionId: newRev.id,
              rowVersion: 1n,
            },
          });

          await tx.itemGradingSecret.create({
            data: {
              itemRevisionId: newItemRev.id,
              gradingData: exInput.gradingData,
              feedbackData,
              schemaVersion: 1,
            },
          });

          await tx.lessonExercise.create({
            data: {
              lessonRevisionId: newRev.id,
              itemRevisionId: newItemRev.id,
              itemId: targetItemId,
              position: exInput.position,
              isCore: exInput.isCore ?? true,
            },
          });
        }
      }

      // 15. Preserve assessment item lineage on the successor DRAFT. Item revisions
      // are append-only, so clone each exact payload/secret into a new revision owned
      // by this source revision and the current assignment episode.
      if (highestRev?.authoredItemRevisions) {
        for (const pred of highestRev.authoredItemRevisions) {
          const maxRevRow = await tx.itemRevision.findFirst({
            where: { itemId: pred.itemId.toLowerCase() },
            orderBy: { revisionNo: 'desc' },
            select: { revisionNo: true },
          });
          const copiedItemRevision = await tx.itemRevision.create({
            data: {
              itemId: pred.itemId.toLowerCase(),
              revisionNo: (maxRevRow?.revisionNo ?? 0) + 1,
              type: pred.type,
              promptData: pred.promptData,
              schemaVersion: pred.schemaVersion,
              exactFingerprint: pred.exactFingerprint,
              createdBy: teacherAccountId.toLowerCase(),
              creationAssignmentEpisodeId: latestEpisode.id,
              authoringLessonRevisionId: newRev.id,
              assessmentBlueprintId: pred.assessmentBlueprintId,
              blueprintGeneration: pred.blueprintGeneration,
              isDraftOmitted: pred.isDraftOmitted,
              frozenAt: null,
              rowVersion: 1n,
            },
          });
          await tx.itemGradingSecret.create({
            data: {
              itemRevisionId: copiedItemRevision.id,
              gradingData: pred.gradingSecret.gradingData,
              feedbackData: pred.gradingSecret.feedbackData ?? undefined,
              schemaVersion: pred.gradingSecret.schemaVersion,
            },
          });
        }
      }

      // 16. Persist Vocabulary
      if (inputVocabulary === undefined) {
        // Clone predecessor vocabulary links preserving stored displaySnapshot byte-for-JSON-value
        if (highestRev?.vocabularyLinks) {
          for (const pred of highestRev.vocabularyLinks) {
            await tx.lessonVocabularyLink.create({
              data: {
                lessonRevisionId: newRev.id,
                vocabularyId: pred.vocabularyId.toLowerCase(),
                position: pred.position,
                isCore: pred.isCore,
                displaySnapshot: pred.displaySnapshot,
              },
            });
          }
        }
      } else {
        for (const vocInput of inputVocabulary) {
          if (vocInput.sourceLinkId) {
            const pred = predVocabMap.get(vocInput.sourceLinkId.toLowerCase())!;
            await tx.lessonVocabularyLink.create({
              data: {
                lessonRevisionId: newRev.id,
                vocabularyId: pred.vocabularyId.toLowerCase(),
                position: vocInput.position,
                isCore: vocInput.isCore ?? true,
                displaySnapshot: pred.displaySnapshot, // preserved byte-for-JSON-value!
              },
            });
          } else if (vocInput.vocabularyId) {
            const concept = await tx.vocabularyConcept.findUnique({
              where: { id: vocInput.vocabularyId.toLowerCase() },
            });
            const snapshot = {
              schemaVersion: 1,
              languageId: concept.languageId,
              canonicalForm: concept.canonicalForm,
              senseKey: concept.senseKey,
              meaningLabels: concept.meaningLabels,
              phonetic: concept.phonetic || null,
              partOfSpeech: concept.partOfSpeech || null,
              example: concept.example || null,
            };
            if (!vocabularySnapshotSchema.safeParse(snapshot).success) {
              throw new ControlledDraftError(409, {code: 'UNSUPPORTED_DRAFT_CONTENT', message: 'Khái niệm từ vựng có cấu trúc không được hỗ trợ.'});
            }
            await tx.lessonVocabularyLink.create({
              data: {
                lessonRevisionId: newRev.id,
                vocabularyId: concept.id.toLowerCase(),
                position: vocInput.position,
                isCore: vocInput.isCore ?? true,
                displaySnapshot: snapshot,
              },
            });
          } else if (vocInput.create) {
            const c = vocInput.create;
            const norm = normalizeVocabularyTerm(c.canonicalForm);
            const sense = c.senseKey.trim();
            let concept = await tx.vocabularyConcept.findUnique({
              where: {
                languageId_normalizedForm_senseKey: {
                  languageId: courseLanguageId.toLowerCase(),
                  normalizedForm: norm,
                  senseKey: sense,
                },
              },
            });
            if (concept && (concept.languageId.toLowerCase() !== courseLanguageId.toLowerCase() || !sameVocabularyMetadata(concept, c))) {
              throw new ControlledDraftError(409, {code: 'VOCABULARY_IDENTITY_CONFLICT', message: 'Khái niệm đã tồn tại với thông tin khác. Hãy chọn từ có sẵn hoặc dùng nét nghĩa khác.'});
            }
            if (!concept) {
              concept = await tx.vocabularyConcept.create({
                data: {
                  languageId: courseLanguageId.toLowerCase(),
                  canonicalForm: c.canonicalForm.normalize('NFC').trim(),
                  normalizedForm: norm,
                  senseKey: sense,
                  meaningLabels: {
                    ...(c.meaningLabels.vi?.trim() ? { vi: c.meaningLabels.vi.trim() } : {}),
                    ...(c.meaningLabels.en?.trim() ? { en: c.meaningLabels.en.trim() } : {}),
                  },
                  phonetic: c.phonetic?.trim() || null,
                  partOfSpeech: c.partOfSpeech?.trim() || null,
                  example: c.example?.trim() || null,
                  createdBy: teacherAccountId.toLowerCase(),
                  rowVersion: 1n,
                },
              });
            }
            const snapshot = {
              schemaVersion: 1,
              languageId: concept.languageId,
              canonicalForm: concept.canonicalForm,
              senseKey: concept.senseKey,
              meaningLabels: concept.meaningLabels,
              phonetic: concept.phonetic || null,
              partOfSpeech: concept.partOfSpeech || null,
              example: concept.example || null,
            };
            if (!vocabularySnapshotSchema.safeParse(snapshot).success) {
              throw new ControlledDraftError(409, {code: 'UNSUPPORTED_DRAFT_CONTENT', message: 'Khái niệm từ vựng có cấu trúc không được hỗ trợ.'});
            }
            await tx.lessonVocabularyLink.create({
              data: {
                lessonRevisionId: newRev.id,
                vocabularyId: concept.id.toLowerCase(),
                position: vocInput.position,
                isCore: vocInput.isCore ?? true,
                displaySnapshot: snapshot,
              },
            });
          }
        }
      }

      // 16. Increment Lesson.rowVersion once; leave activeRevisionId unchanged
      await tx.lesson.update({
        where: { id: lessonId.toLowerCase() },
        data: {
          rowVersion: { increment: 1n },
        },
      });

      // 17. Return authoritative TeacherLessonDetailDto
      const fullLesson = await tx.lesson.findUnique({
        where: { id: lessonId.toLowerCase() },
        include: {
          unit: {
            select: {
              id: true,
              courseId: true,
              position: true,
              code: true,
              names: true,
              course: {
                select: {
                  id: true,
                  names: true,
                  languageId: true,
                },
              },
            },
          },
          assignment: {
            include: {
              currentTeacher: {
                select: { id: true, displayName: true, status: true },
              },
            },
          },
          revisions: {
            orderBy: { revisionNo: 'desc' },
            include: {
              creator: { select: { id: true, displayName: true } },
              lastEditor: { select: { id: true, displayName: true } },
              ...revisionChildRelations,
              reviews: {
                orderBy: { occurredAt: 'desc' },
                select: { action: true, occurredAt: true, comment: true },
              },
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
          },
        },
      });

      return {
        status: 200,
        data: { data: toTeacherLessonDetailDto(fullLesson, courseLanguageId) },
      };
    }, { timeout: 30000 });
  } catch (err) {
    if (err instanceof ControlledDraftError) {
      return {
        status: err.status,
        error: err.error,
      };
    }
    const errorRes = handleLessonPrismaError(err, 'saveTeacherLessonDraft');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}
