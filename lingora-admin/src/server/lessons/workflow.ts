import { z } from 'zod';
import { getProductPrisma } from '../db/index.js';
import { isValidUuid, type ApiErrorEnvelope } from '../frameworks/index.ts';
import {
  ControlledDraftError,
  lockAccounts,
  lockLesson,
  lockAssignment,
  toTeacherLessonDetailDto,
  parseJsonRecord,
  isSupportedTitle,
  isSupportedContentBlocks,
  handleLessonPrismaError,
} from './index.ts';
import { type ExerciseType } from './content.ts';
import { revisionChildRelations, unsupportedChildren } from './snapshot.ts';

// =============================================================================
// Status Mapping & Helpers
// =============================================================================
// Status Labels
// =============================================================================

import { WORKFLOW_STATUS_LABELS, getWorkflowStatusLabel } from './workflow-status.ts';
export { WORKFLOW_STATUS_LABELS, getWorkflowStatusLabel };

// =============================================================================
// Schemas
// =============================================================================

const lessonVersionSchema = z.string({ message: 'expectedRowVersion là bắt buộc' }).refine(
  value => /^[1-9]\d{0,18}$/.test(value) && BigInt(value) <= 9223372036854775807n,
  'expectedRowVersion phải là chuỗi số nguyên dương int64 chuẩn'
);

const text4000Schema = z
  .string({ message: 'Nhận xét phải là chuỗi ký tự' })
  .trim()
  .max(4000, 'Nhận xét tối đa 4000 ký tự');

export const submitLessonSchema = z
  .object({
    revisionId: z
      .string({ message: 'revisionId là bắt buộc' })
      .trim()
      .refine(isValidUuid, 'revisionId không đúng định dạng UUID'),
    expectedLessonRowVersion: lessonVersionSchema,
    expectedRevisionRowVersion: lessonVersionSchema,
  })
  .strict();

export const reviewMutationSchema = z
  .object({
    expectedRevisionRowVersion: lessonVersionSchema,
    comment: text4000Schema.optional().nullable(),
  })
  .strict();

export const publishLessonSchema = z
  .object({
    expectedRevisionRowVersion: lessonVersionSchema,
    expectedLessonRowVersion: lessonVersionSchema,
    comment: text4000Schema.optional().nullable(),
  })
  .strict();

// =============================================================================
// DTOs & Interfaces
// =============================================================================

export interface ReviewQueueItemDto {
  submissionId: string;
  lessonId: string;
  revisionId: string;
  revisionNo: number;
  status: string;
  statusLabel: string;
  title: Record<string, string>;
  lessonPosition: number;
  unitCode: string;
  unitName: Record<string, string>;
  courseName: Record<string, string>;
  submitter: {
    id: string;
    displayName: string | null;
  };
  submittedAt: string;
  assignmentEpisode: {
    id: string;
    sequenceNo: number;
    scopeGeneration: string;
  } | null;
}

export interface ReviewExerciseDto {
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

export interface ReviewVocabularyDto {
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

export interface ReviewHistoryEventDto {
  id: string;
  action: string;
  actionLabel: string;
  actor: {
    id: string;
    displayName: string | null;
  };
  occurredAt: string;
  comment: string | null;
  revisionRowVersion: string;
}

export interface ReviewDetailDto {
  submissionId: string;
  assignmentEpisode: {
    id: string;
    sequenceNo: number;
    scopeGeneration: string;
    teacherName: string | null;
    scopeSnapshot: any;
  } | null;
  lesson: {
    id: string;
    position: number;
    unitId: string;
    unitCode: string;
    unitName: Record<string, string>;
    courseId: string;
    courseName: Record<string, string>;
    rowVersion: string;
    activeRevisionId: string | null;
    availability: string;
  };
  revision: {
    id: string;
    revisionNo: number;
    status: string;
    statusLabel: string;
    title: Record<string, string>;
    contentBlocks: Array<{ type: 'paragraph'; text: string }>;
    changeSummary: string | null;
    rowVersion: string;
    createdAt: string;
    submittedAt: string | null;
    approvedAt: string | null;
    publishedAt: string | null;
    endedAt: string | null;
    submitter: {
      id: string;
      displayName: string | null;
    } | null;
    approver: {
      id: string;
      displayName: string | null;
    } | null;
    publisher: {
      id: string;
      displayName: string | null;
    } | null;
  };
  exercises: ReviewExerciseDto[];
  vocabulary: ReviewVocabularyDto[];
  reviews: ReviewHistoryEventDto[];
}

// =============================================================================
// Locking Helpers
// =============================================================================

async function lockRevisionReview(tx: any, reviewId: string) {
  const rows = await tx.$queryRaw`
    SELECT id::text, lesson_revision_id::text AS "lessonRevisionId", action,
      actor_id::text AS "actorId", assignment_episode_id::text AS "assignmentEpisodeId",
      assignment_generation AS "assignmentGeneration", assignment_scope_snapshot AS "assignmentScopeSnapshot",
      revision_row_version AS "revisionRowVersion"
    FROM app.revision_reviews WHERE id = ${reviewId.toLowerCase()}::uuid FOR UPDATE
  `;
  return rows[0] || null;
}

async function lockLessonRevision(tx: any, revisionId: string) {
  const rows = await tx.$queryRaw`
    SELECT id::text, lesson_id::text AS "lessonId", revision_no AS "revisionNo",
      status, row_version AS "rowVersion"
    FROM app.lesson_revisions WHERE id = ${revisionId.toLowerCase()}::uuid FOR UPDATE
  `;
  return rows[0] || null;
}

// =============================================================================
// Teacher Submit Service
// =============================================================================

export async function submitTeacherLesson(
  teacherAccountId: string,
  lessonId: string,
  rawBody: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: any; error?: ApiErrorEnvelope['error'] }> {
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

  const parseResult = submitLessonSchema.safeParse(rawBody);
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

  const { revisionId, expectedLessonRowVersion, expectedRevisionRowVersion } = parseResult.data;
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

      // 4. CAS Lesson version verification
      const actualLessonVersion = (currentLesson.rowVersion ?? currentLesson.row_version ?? 1n).toString();
      if (actualLessonVersion !== expectedLessonRowVersion) {
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

      // 6. Fetch highest revision and lock/verify
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

      if (!highestRev) {
        throw new ControlledDraftError(404, {
          code: 'LESSON_NOT_FOUND',
          message: 'Chưa có bản sửa đổi nào để nộp duyệt.',
        });
      }

      if (highestRev.id.toLowerCase() !== revisionId.toLowerCase()) {
        throw new ControlledDraftError(409, {
          code: 'REVISION_CONFLICT',
          message: 'Bản sửa đổi dự kiến (revisionId) không khớp với bản sửa đổi cao nhất hiện tại.',
        });
      }

      const lockedRevision = await lockLessonRevision(tx, highestRev.id);
      if (!lockedRevision || lockedRevision.lessonId.toLowerCase() !== lessonId.toLowerCase()) {
        throw new ControlledDraftError(409, {
          code: 'REVISION_CONFLICT',
          message: 'Bản sửa đổi đã thay đổi trong lúc nộp duyệt. Vui lòng tải lại dữ liệu mới nhất.',
        });
      }

      const actualRevVersion = (highestRev.rowVersion ?? 1n).toString();
      if (
        actualRevVersion !== expectedRevisionRowVersion ||
        (lockedRevision.rowVersion ?? 1n).toString() !== actualRevVersion ||
        lockedRevision.status !== highestRev.status
      ) {
        throw new ControlledDraftError(409, {
          code: 'REVISION_CONFLICT',
          message: 'Phiên bản sửa đổi đã bị thay đổi bởi tác vụ khác.',
        });
      }

      if (highestRev.status !== 'DRAFT') {
        throw new ControlledDraftError(409, {
          code: 'DRAFT_NOT_EDITABLE',
          message: `Bản sửa đổi hiện tại có trạng thái ${highestRev.status}, không thể nộp duyệt.`,
        });
      }

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
          message: 'Bản sửa đổi đã từng được nộp duyệt và đã bị khóa quy trình.',
        });
      }

      // 7. Structural validation: title, content blocks, child associations and schemas.
      if (!isSupportedTitle(highestRev.title) || !isSupportedContentBlocks(highestRev.contentBlocks)) {
        throw new ControlledDraftError(400, {
          code: 'UNSUPPORTED_DRAFT_CONTENT',
          message: 'Bản nháp hiện tại chứa cấu trúc dữ liệu không được hỗ trợ để nộp duyệt.',
        });
      }

      const exercises = Array.isArray(highestRev.exercises) ? highestRev.exercises : [];
      const coreExercises = exercises.filter((e: any) => e.isCore);
      if (coreExercises.length === 0) {
        throw new ControlledDraftError(400, {
          code: 'VALIDATION_ERROR',
          message: 'Bài học yêu cầu ít nhất một bài tập cốt lõi (core exercise) trước khi nộp duyệt.',
        });
      }

      const unit = await tx.unit.findUnique({
        where: { id: currentLesson.unitId.toLowerCase() },
        select: { course: { select: { languageId: true } } },
      });
      const courseLanguageId = unit?.course?.languageId;
      if (!courseLanguageId || unsupportedChildren(highestRev, courseLanguageId)) {
        throw new ControlledDraftError(400, {
          code: 'UNSUPPORTED_DRAFT_CONTENT',
          message: 'Bản sửa đổi hiện tại chứa bài tập, từ vựng hoặc liên kết không được hỗ trợ để nộp duyệt.',
        });
      }

      // 8. Freeze exact referenced ItemRevisions
      const now = new Date();
      for (const ex of exercises) {
        await tx.itemRevision.update({
          where: { id: ex.itemRevisionId },
          data: { frozenAt: now },
        });
      }

      // 9. Update LessonRevision to IN_REVIEW
      const nextRevRowVersion = (highestRev.rowVersion ?? 1n) + 1n;
      await tx.lessonRevision.update({
        where: { id: highestRev.id },
        data: {
          status: 'IN_REVIEW',
          submittedAt: now,
          submittedBy: teacherAccountId.toLowerCase(),
          submittedAssignmentGeneration: latestEpisode.scopeGeneration,
          assignmentScopeSnapshot: latestEpisode.scopeSnapshot,
          rowVersion: nextRevRowVersion,
        },
      });

      // 10. Increment Lesson.rowVersion
      await tx.lesson.update({
        where: { id: lessonId.toLowerCase() },
        data: {
          rowVersion: { increment: 1n },
        },
      });

      // 11. Append SUBMIT event to RevisionReview
      const reviewEvent = await tx.revisionReview.create({
        data: {
          lessonRevisionId: highestRev.id,
          action: 'SUBMIT',
          actorId: teacherAccountId.toLowerCase(),
          assignmentEpisodeId: latestEpisode.id,
          assignmentGeneration: latestEpisode.scopeGeneration,
          assignmentScopeSnapshot: latestEpisode.scopeSnapshot,
          revisionRowVersion: nextRevRowVersion,
          occurredAt: now,
          comment: null,
        },
      });

      // 12. Fetch authoritative updated lesson
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
        data: {
          data: toTeacherLessonDetailDto(fullLesson, courseLanguageId),
          submissionId: reviewEvent.id,
        },
      };
    }, { timeout: 30000 });
  } catch (err) {
    if (err instanceof ControlledDraftError) {
      return {
        status: err.status,
        error: err.error,
      };
    }
    const errorRes = handleLessonPrismaError(err, 'submitTeacherLesson');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

// =============================================================================
// Admin Review Queue Service
// =============================================================================

export async function getReviewQueue(
  adminAccountId: string,
  prismaClient?: any
): Promise<{ status: number; data?: any; error?: ApiErrorEnvelope['error'] }> {
  const prisma = prismaClient || getProductPrisma();

  try {
    const adminAcc = await prisma.account.findUnique({
      where: { id: adminAccountId.toLowerCase() },
    });
    if (!adminAcc || adminAcc.role !== 'ADMIN') {
      return {
        status: 403,
        error: {
          code: 'FORBIDDEN',
          message: 'Chỉ quản trị viên mới có quyền truy cập hàng đợi kiểm duyệt.',
        },
      };
    }
    if (adminAcc.status !== 'ACTIVE') {
      return {
        status: 403,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Tài khoản quản trị viên đang chờ duyệt hoặc đã bị vô hiệu hóa.',
        },
      };
    }

    // Query SUBMIT events whose revision is currently IN_REVIEW
    const submitReviews = await prisma.revisionReview.findMany({
      where: {
        action: 'SUBMIT',
        lessonRevision: { is: { status: 'IN_REVIEW' } },
      },
      include: {
        actor: { select: { id: true, displayName: true } },
        assignmentEpisode: true,
        lessonRevision: {
          include: {
            submitter: { select: { id: true, displayName: true } },
            lesson: {
              include: {
                unit: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        occurredAt: 'asc',
      },
    });

    const queue: ReviewQueueItemDto[] = submitReviews.map((r: any) => {
      const rev = r.lessonRevision;
      const lesson = rev.lesson || {};
      const unit = lesson.unit || {};
      const course = unit.course || {};

      return {
        submissionId: r.id,
        lessonId: rev.lessonId,
        revisionId: rev.id,
        revisionNo: rev.revisionNo,
        status: rev.status,
        statusLabel: getWorkflowStatusLabel(rev.status),
        title: parseJsonRecord(rev.title),
        lessonPosition: lesson.position || 0,
        unitCode: unit.code || '',
        unitName: parseJsonRecord(unit.names),
        courseName: parseJsonRecord(course.names),
        submitter: {
          id: rev.submittedBy || r.actorId,
          displayName: rev.submitter?.displayName || r.actor?.displayName || null,
        },
        submittedAt: (rev.submittedAt || r.occurredAt || new Date()).toISOString(),
        assignmentEpisode: r.assignmentEpisode
          ? {
              id: r.assignmentEpisode.id,
              sequenceNo: r.assignmentEpisode.sequenceNo,
              scopeGeneration: r.assignmentEpisode.scopeGeneration.toString(),
            }
          : null,
      };
    });

    return {
      status: 200,
      data: { data: queue },
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
// Admin Review Detail Service
// =============================================================================

export async function getReviewDetail(
  adminAccountId: string,
  submissionId: string,
  prismaClient?: any
): Promise<{ status: number; data?: any; error?: ApiErrorEnvelope['error'] }> {
  const prisma = prismaClient || getProductPrisma();

  try {
    const adminAcc = await prisma.account.findUnique({
      where: { id: adminAccountId.toLowerCase() },
    });
    if (!adminAcc || adminAcc.role !== 'ADMIN') {
      return {
        status: 403,
        error: {
          code: 'FORBIDDEN',
          message: 'Chỉ quản trị viên mới có quyền xem chi tiết kiểm duyệt.',
        },
      };
    }
    if (adminAcc.status !== 'ACTIVE') {
      return {
        status: 403,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Tài khoản quản trị viên đang chờ duyệt hoặc đã bị vô hiệu hóa.',
        },
      };
    }

    const submission = await prisma.revisionReview.findFirst({
      where: {
        id: submissionId.toLowerCase(),
        action: 'SUBMIT',
      },
      include: {
        actor: { select: { id: true, displayName: true } },
        assignmentEpisode: {
          include: {
            nextTeacher: { select: { id: true, displayName: true } },
          },
        },
        lessonRevision: {
          include: {
            submitter: { select: { id: true, displayName: true } },
            approver: { select: { id: true, displayName: true } },
            publisher: { select: { id: true, displayName: true } },
            exercises: {
              include: {
                itemRevision: {
                  include: {
                    gradingSecret: true,
                  },
                },
              },
              orderBy: { position: 'asc' },
            },
            vocabularyLinks: {
              orderBy: { position: 'asc' },
            },
            lesson: {
              include: {
                unit: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!submission || !submission.lessonRevision) {
      return {
        status: 404,
        error: {
          code: 'SUBMISSION_NOT_FOUND',
          message: 'Không tìm thấy thông tin bản nộp kiểm duyệt tương ứng.',
        },
      };
    }

    const rev = submission.lessonRevision;
    const lesson = rev.lesson || {};
    const unit = lesson.unit || {};
    const course = unit.course || {};

    // Load review history for this exact lesson revision
    const reviewHistory = await prisma.revisionReview.findMany({
      where: {
        lessonRevisionId: rev.id,
      },
      include: {
        actor: { select: { id: true, displayName: true } },
      },
      orderBy: {
        occurredAt: 'asc',
      },
    });

    const reviews: ReviewHistoryEventDto[] = reviewHistory.map((rh: any) => ({
      id: rh.id,
      action: rh.action,
      actionLabel: getWorkflowStatusLabel(rh.action),
      actor: {
        id: rh.actorId,
        displayName: rh.actor?.displayName || null,
      },
      occurredAt: (rh.occurredAt instanceof Date ? rh.occurredAt : new Date(rh.occurredAt)).toISOString(),
      comment: rh.comment || null,
      revisionRowVersion: (rh.revisionRowVersion ?? 1n).toString(),
    }));

    const exercises: ReviewExerciseDto[] = (rev.exercises || []).map((ex: any) => {
      const ir = ex.itemRevision || {};
      const gs = ir.gradingSecret || {};
      return {
        id: ex.id,
        itemId: ex.itemId,
        itemRevisionId: ex.itemRevisionId,
        position: ex.position,
        isCore: ex.isCore,
        type: ir.type,
        promptData: ir.promptData,
        gradingData: gs.gradingData,
        feedbackData: gs.feedbackData || null,
      };
    });

    const vocabulary: ReviewVocabularyDto[] = (rev.vocabularyLinks || []).map((vl: any) => ({
      id: vl.id,
      vocabularyId: vl.vocabularyId,
      position: vl.position,
      isCore: vl.isCore,
      displaySnapshot: vl.displaySnapshot,
    }));

    const detailDto: ReviewDetailDto = {
      submissionId: submission.id,
      assignmentEpisode: submission.assignmentEpisode
        ? {
            id: submission.assignmentEpisode.id,
            sequenceNo: submission.assignmentEpisode.sequenceNo,
            scopeGeneration: submission.assignmentEpisode.scopeGeneration.toString(),
            teacherName: submission.assignmentEpisode.nextTeacher?.displayName || null,
            scopeSnapshot: submission.assignmentEpisode.scopeSnapshot,
          }
        : null,
      lesson: {
        id: lesson.id || rev.lessonId,
        position: lesson.position || 0,
        unitId: unit.id || '',
        unitCode: unit.code || '',
        unitName: parseJsonRecord(unit.names),
        courseId: course.id || '',
        courseName: parseJsonRecord(course.names),
        rowVersion: (lesson.rowVersion ?? 1n).toString(),
        activeRevisionId: lesson.activeRevisionId || null,
        availability: lesson.availability || 'PLANNED',
      },
      revision: {
        id: rev.id,
        revisionNo: rev.revisionNo,
        status: rev.status,
        statusLabel: getWorkflowStatusLabel(rev.status),
        title: parseJsonRecord(rev.title),
        contentBlocks: Array.isArray(rev.contentBlocks) ? rev.contentBlocks : [],
        changeSummary: rev.changeSummary || null,
        rowVersion: (rev.rowVersion ?? 1n).toString(),
        createdAt: (rev.createdAt instanceof Date ? rev.createdAt : new Date(rev.createdAt)).toISOString(),
        submittedAt: rev.submittedAt ? (rev.submittedAt instanceof Date ? rev.submittedAt : new Date(rev.submittedAt)).toISOString() : null,
        approvedAt: rev.approvedAt ? (rev.approvedAt instanceof Date ? rev.approvedAt : new Date(rev.approvedAt)).toISOString() : null,
        publishedAt: rev.publishedAt ? (rev.publishedAt instanceof Date ? rev.publishedAt : new Date(rev.publishedAt)).toISOString() : null,
        endedAt: rev.endedAt ? (rev.endedAt instanceof Date ? rev.endedAt : new Date(rev.endedAt)).toISOString() : null,
        submitter: rev.submittedBy
          ? {
              id: rev.submittedBy,
              displayName: rev.submitter?.displayName || submission.actor?.displayName || null,
            }
          : null,
        approver: rev.approvedBy
          ? {
              id: rev.approvedBy,
              displayName: rev.approver?.displayName || null,
            }
          : null,
        publisher: rev.publishedBy
          ? {
              id: rev.publishedBy,
              displayName: rev.publisher?.displayName || null,
            }
          : null,
      },
      exercises,
      vocabulary,
      reviews,
    };

    return {
      status: 200,
      data: { data: detailDto },
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
// Admin Request Changes Service
// =============================================================================

export async function requestChangesReview(
  adminAccountId: string,
  submissionId: string,
  rawBody: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: any; error?: ApiErrorEnvelope['error'] }> {
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

  const parseResult = reviewMutationSchema.safeParse(rawBody);
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

  const { expectedRevisionRowVersion, comment } = parseResult.data;
  const prisma = prismaClient || getProductPrisma();

  try {
    return await prisma.$transaction(async (tx: any) => {
      // 1. Lock admin account FOR NO KEY UPDATE
      const accounts = await lockAccounts(tx, [adminAccountId]);
      const adminAcc = accounts.get(adminAccountId.toLowerCase());
      if (!adminAcc || adminAcc.role !== 'ADMIN') {
        throw new ControlledDraftError(403, {
          code: 'FORBIDDEN',
          message: 'Chỉ quản trị viên mới có quyền yêu cầu chỉnh sửa bài học.',
        });
      }
      if (adminAcc.status !== 'ACTIVE') {
        throw new ControlledDraftError(403, {
          code: 'ACCOUNT_INACTIVE',
          message: 'Tài khoản quản trị viên đang chờ duyệt hoặc đã bị vô hiệu hóa.',
        });
      }

      // 2. Lock pinned submission review
      const submission = await lockRevisionReview(tx, submissionId);
      if (!submission || submission.action !== 'SUBMIT') {
        throw new ControlledDraftError(404, {
          code: 'SUBMISSION_NOT_FOUND',
          message: 'Không tìm thấy thông tin bản nộp kiểm duyệt tương ứng.',
        });
      }

      // 3. Lock pinned LessonRevision
      const revision = await lockLessonRevision(tx, submission.lessonRevisionId);
      if (!revision) {
        throw new ControlledDraftError(404, {
          code: 'LESSON_REVISION_NOT_FOUND',
          message: 'Không tìm thấy bản sửa đổi tương ứng với bản nộp.',
        });
      }

      // 4. Verify revision status & expectedRowVersion
      if (revision.status !== 'IN_REVIEW') {
        throw new ControlledDraftError(409, {
          code: 'REVISION_CONFLICT',
          message: `Chỉ có thể yêu cầu chỉnh sửa khi bản sửa đổi đang ở trạng thái chờ duyệt (IN_REVIEW). Trạng thái hiện tại: ${revision.status}.`,
        });
      }

      const actualRevVersion = (revision.rowVersion ?? 1n).toString();
      if (actualRevVersion !== expectedRevisionRowVersion) {
        throw new ControlledDraftError(409, {
          code: 'STALE_REVISION',
          message: 'Bản sửa đổi đã bị thay đổi bởi tác vụ khác. Vui lòng tải lại dữ liệu mới nhất.',
        });
      }

      // 5. Update revision status to CHANGES_REQUESTED
      const nextRevRowVersion = (revision.rowVersion ?? 1n) + 1n;
      await tx.lessonRevision.update({
        where: { id: revision.id },
        data: {
          status: 'CHANGES_REQUESTED',
          rowVersion: nextRevRowVersion,
        },
      });

      // 6. Append REQUEST_CHANGES event to RevisionReview retaining original submission episode
      const now = new Date();
      await tx.revisionReview.create({
        data: {
          lessonRevisionId: revision.id,
          action: 'REQUEST_CHANGES',
          actorId: adminAccountId.toLowerCase(),
          assignmentEpisodeId: submission.assignmentEpisodeId,
          assignmentGeneration: submission.assignmentGeneration,
          assignmentScopeSnapshot: submission.assignmentScopeSnapshot,
          revisionRowVersion: nextRevRowVersion,
          comment: comment ? comment.trim() : null,
          occurredAt: now,
        },
      });

      return await getReviewDetail(adminAccountId, submissionId, tx);
    }, { timeout: 30000 });
  } catch (err) {
    if (err instanceof ControlledDraftError) {
      return {
        status: err.status,
        error: err.error,
      };
    }
    const errorRes = handleLessonPrismaError(err, 'requestChangesReview');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

// =============================================================================
// Admin Approve Service
// =============================================================================

export async function approveReview(
  adminAccountId: string,
  submissionId: string,
  rawBody: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: any; error?: ApiErrorEnvelope['error'] }> {
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

  const parseResult = reviewMutationSchema.safeParse(rawBody);
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

  const { expectedRevisionRowVersion, comment } = parseResult.data;
  const prisma = prismaClient || getProductPrisma();

  try {
    return await prisma.$transaction(async (tx: any) => {
      // 1. Lock admin account FOR NO KEY UPDATE
      const accounts = await lockAccounts(tx, [adminAccountId]);
      const adminAcc = accounts.get(adminAccountId.toLowerCase());
      if (!adminAcc || adminAcc.role !== 'ADMIN') {
        throw new ControlledDraftError(403, {
          code: 'FORBIDDEN',
          message: 'Chỉ quản trị viên mới có quyền phê duyệt bài học.',
        });
      }
      if (adminAcc.status !== 'ACTIVE') {
        throw new ControlledDraftError(403, {
          code: 'ACCOUNT_INACTIVE',
          message: 'Tài khoản quản trị viên đang chờ duyệt hoặc đã bị vô hiệu hóa.',
        });
      }

      // 2. Lock pinned submission review
      const submission = await lockRevisionReview(tx, submissionId);
      if (!submission || submission.action !== 'SUBMIT') {
        throw new ControlledDraftError(404, {
          code: 'SUBMISSION_NOT_FOUND',
          message: 'Không tìm thấy thông tin bản nộp kiểm duyệt tương ứng.',
        });
      }

      // 3. Lock pinned LessonRevision
      const revision = await lockLessonRevision(tx, submission.lessonRevisionId);
      if (!revision) {
        throw new ControlledDraftError(404, {
          code: 'LESSON_REVISION_NOT_FOUND',
          message: 'Không tìm thấy bản sửa đổi tương ứng với bản nộp.',
        });
      }

      // 4. Verify revision status & expectedRowVersion
      if (revision.status !== 'IN_REVIEW') {
        throw new ControlledDraftError(409, {
          code: 'REVISION_CONFLICT',
          message: `Chỉ có thể phê duyệt khi bản sửa đổi đang ở trạng thái chờ duyệt (IN_REVIEW). Trạng thái hiện tại: ${revision.status}.`,
        });
      }

      const actualRevVersion = (revision.rowVersion ?? 1n).toString();
      if (actualRevVersion !== expectedRevisionRowVersion) {
        throw new ControlledDraftError(409, {
          code: 'STALE_REVISION',
          message: 'Bản sửa đổi đã bị thay đổi bởi tác vụ khác. Vui lòng tải lại dữ liệu mới nhất.',
        });
      }

      // 5. Update revision status to APPROVED
      const now = new Date();
      const nextRevRowVersion = (revision.rowVersion ?? 1n) + 1n;
      await tx.lessonRevision.update({
        where: { id: revision.id },
        data: {
          status: 'APPROVED',
          approvedBy: adminAccountId.toLowerCase(),
          approvedAt: now,
          rowVersion: nextRevRowVersion,
        },
      });

      // 6. Append APPROVE event to RevisionReview retaining original submission episode
      await tx.revisionReview.create({
        data: {
          lessonRevisionId: revision.id,
          action: 'APPROVE',
          actorId: adminAccountId.toLowerCase(),
          assignmentEpisodeId: submission.assignmentEpisodeId,
          assignmentGeneration: submission.assignmentGeneration,
          assignmentScopeSnapshot: submission.assignmentScopeSnapshot,
          revisionRowVersion: nextRevRowVersion,
          comment: comment ? comment.trim() : null,
          occurredAt: now,
        },
      });

      return await getReviewDetail(adminAccountId, submissionId, tx);
    }, { timeout: 30000 });
  } catch (err) {
    if (err instanceof ControlledDraftError) {
      return {
        status: err.status,
        error: err.error,
      };
    }
    const errorRes = handleLessonPrismaError(err, 'approveReview');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

// =============================================================================
// Admin Publish Service
// =============================================================================

export async function publishReview(
  adminAccountId: string,
  submissionId: string,
  rawBody: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: any; error?: ApiErrorEnvelope['error'] }> {
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

  const parseResult = publishLessonSchema.safeParse(rawBody);
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

  const { expectedRevisionRowVersion, expectedLessonRowVersion, comment } = parseResult.data;
  const prisma = prismaClient || getProductPrisma();

  try {
    return await prisma.$transaction(async (tx: any) => {
      // 1. Lock admin account FOR NO KEY UPDATE
      const accounts = await lockAccounts(tx, [adminAccountId]);
      const adminAcc = accounts.get(adminAccountId.toLowerCase());
      if (!adminAcc || adminAcc.role !== 'ADMIN') {
        throw new ControlledDraftError(403, {
          code: 'FORBIDDEN',
          message: 'Chỉ quản trị viên mới có quyền xuất bản bài học.',
        });
      }
      if (adminAcc.status !== 'ACTIVE') {
        throw new ControlledDraftError(403, {
          code: 'ACCOUNT_INACTIVE',
          message: 'Tài khoản quản trị viên đang chờ duyệt hoặc đã bị vô hiệu hóa.',
        });
      }

      // Resolve immutable identity first, then lock Lesson before review/revision.
      // Authoring takes Lesson before inserting a successor that references its
      // predecessor, so the same order avoids an FK/row-lock cycle with publish.
      const submissionRef = await tx.revisionReview.findUnique({
        where: { id: submissionId.toLowerCase() },
        select: { id: true, lessonRevisionId: true, action: true },
      });
      if (!submissionRef || submissionRef.action !== 'SUBMIT') {
        throw new ControlledDraftError(404, {
          code: 'SUBMISSION_NOT_FOUND',
          message: 'Không tìm thấy thông tin bản nộp kiểm duyệt tương ứng.',
        });
      }

      const revisionRef = await tx.lessonRevision.findUnique({
        where: { id: submissionRef.lessonRevisionId },
        select: { id: true, lessonId: true },
      });
      if (!revisionRef) {
        throw new ControlledDraftError(404, {
          code: 'LESSON_REVISION_NOT_FOUND',
          message: 'Không tìm thấy bản sửa đổi tương ứng với bản nộp.',
        });
      }

      // 2. Lock Lesson first to match the authoring transaction's lock order.
      const lesson = await lockLesson(tx, revisionRef.lessonId);
      if (!lesson) {
        throw new ControlledDraftError(404, {
          code: 'LESSON_NOT_FOUND',
          message: 'Không tìm thấy bài học tương ứng.',
        });
      }

      // 3. Lock and recheck the pinned submission and exact revision.
      const submission = await lockRevisionReview(tx, submissionId);
      if (
        !submission ||
        submission.action !== 'SUBMIT' ||
        submission.lessonRevisionId.toLowerCase() !== submissionRef.lessonRevisionId.toLowerCase()
      ) {
        throw new ControlledDraftError(404, {
          code: 'SUBMISSION_NOT_FOUND',
          message: 'Không tìm thấy thông tin bản nộp kiểm duyệt tương ứng.',
        });
      }

      const revision = await lockLessonRevision(tx, submission.lessonRevisionId);
      if (!revision) {
        throw new ControlledDraftError(404, {
          code: 'LESSON_REVISION_NOT_FOUND',
          message: 'Không tìm thấy bản sửa đổi tương ứng với bản nộp.',
        });
      }
      if (revision.lessonId.toLowerCase() !== lesson.id.toLowerCase()) {
        throw new ControlledDraftError(409, {
          code: 'PARENT_MISMATCH',
          message: 'Bản nộp và bài học không còn thuộc cùng một ngữ cảnh.',
        });
      }

      // 5. Verify revision status & expected versions
      if (revision.status !== 'APPROVED') {
        throw new ControlledDraftError(409, {
          code: 'REVISION_CONFLICT',
          message: `Chỉ có thể xuất bản bản sửa đổi đã được phê duyệt (APPROVED). Trạng thái hiện tại: ${revision.status}.`,
        });
      }

      const actualRevVersion = (revision.rowVersion ?? 1n).toString();
      if (actualRevVersion !== expectedRevisionRowVersion) {
        throw new ControlledDraftError(409, {
          code: 'STALE_REVISION',
          message: 'Bản sửa đổi đã bị thay đổi bởi tác vụ khác. Vui lòng tải lại dữ liệu mới nhất.',
        });
      }

      const actualLessonVersion = (lesson.rowVersion ?? 1n).toString();
      if (actualLessonVersion !== expectedLessonRowVersion) {
        throw new ControlledDraftError(409, {
          code: 'STALE_LESSON',
          message: 'Dữ liệu bài học đã bị thay đổi bởi tác vụ khác. Vui lòng tải lại dữ liệu mới nhất.',
        });
      }

      const prevActiveRevisionId = lesson.activeRevisionId;
      const now = new Date();

      // 6. Transition target revision to PUBLISHED
      const nextRevRowVersion = (revision.rowVersion ?? 1n) + 1n;
      await tx.lessonRevision.update({
        where: { id: revision.id },
        data: {
          status: 'PUBLISHED',
          publishedBy: adminAccountId.toLowerCase(),
          publishedAt: now,
          rowVersion: nextRevRowVersion,
        },
      });

      // 7. Append PUBLISH event to RevisionReview
      await tx.revisionReview.create({
        data: {
          lessonRevisionId: revision.id,
          action: 'PUBLISH',
          actorId: adminAccountId.toLowerCase(),
          assignmentEpisodeId: submission.assignmentEpisodeId,
          assignmentGeneration: submission.assignmentGeneration,
          assignmentScopeSnapshot: submission.assignmentScopeSnapshot,
          revisionRowVersion: nextRevRowVersion,
          comment: comment ? comment.trim() : null,
          occurredAt: now,
        },
      });

      // 8. Atomically update Lesson.activeRevisionId to target revision and increment lesson rowVersion
      // Do NOT touch availability!
      await tx.lesson.update({
        where: { id: lesson.id },
        data: {
          activeRevisionId: revision.id,
          rowVersion: { increment: 1n },
        },
      });

      // 9. If previous active revision exists and was PUBLISHED, archive it after updating the lesson pointer
      if (prevActiveRevisionId && prevActiveRevisionId.toLowerCase() !== revision.id.toLowerCase()) {
        const prevLocked = await lockLessonRevision(tx, prevActiveRevisionId);
        const prevRev = prevLocked && await tx.lessonRevision.findUnique({
          where: { id: prevActiveRevisionId.toLowerCase() },
        });

        if (!prevRev || prevRev.lessonId.toLowerCase() !== lesson.id.toLowerCase() || prevRev.status !== 'PUBLISHED') {
          throw new ControlledDraftError(409, {
            code: 'PUBLISH_CONFLICT',
            message: 'Bản xuất bản hiện tại không đồng nhất với con trỏ bài học; không thể lưu trữ an toàn.',
          });
        }

        const originalSubmission = await tx.revisionReview.findFirst({
          where: { lessonRevisionId: prevRev.id, action: 'SUBMIT' },
          orderBy: { occurredAt: 'asc' },
        });
        if (
          !originalSubmission?.assignmentEpisodeId ||
          originalSubmission.assignmentGeneration == null ||
          originalSubmission.assignmentScopeSnapshot == null
        ) {
          throw new ControlledDraftError(409, {
            code: 'PUBLISH_CONFLICT',
            message: 'Thiếu dấu vết nộp ban đầu của bản xuất bản hiện tại; thao tác đã bị hủy.',
          });
        }

        const nextPrevVersion = (prevRev.rowVersion ?? 1n) + 1n;
        await tx.lessonRevision.update({
          where: { id: prevRev.id },
          data: {
            status: 'ARCHIVED',
            endedAt: now,
            rowVersion: nextPrevVersion,
          },
        });

        await tx.revisionReview.create({
          data: {
            lessonRevisionId: prevRev.id,
            action: 'ARCHIVE',
            actorId: adminAccountId.toLowerCase(),
            assignmentEpisodeId: originalSubmission.assignmentEpisodeId,
            assignmentGeneration: originalSubmission.assignmentGeneration,
            assignmentScopeSnapshot: originalSubmission.assignmentScopeSnapshot,
            revisionRowVersion: nextPrevVersion,
            comment: 'Tự động lưu trữ khi bản sửa đổi mới được xuất bản.',
            occurredAt: now,
          },
        });
      }

      return await getReviewDetail(adminAccountId, submissionId, tx);
    }, { timeout: 30000 });
  } catch (err) {
    if (err instanceof ControlledDraftError) {
      return {
        status: err.status,
        error: err.error,
      };
    }
    const errorRes = handleLessonPrismaError(err, 'publishReview');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}
