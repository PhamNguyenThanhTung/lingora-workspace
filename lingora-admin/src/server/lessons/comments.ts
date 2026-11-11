import { z } from 'zod';
import { getProductPrisma } from '../db/index.js';
import { isValidUuid, type ApiErrorEnvelope } from '../frameworks/index.ts';

export { isValidUuid };

// =============================================================================
// Schemas
// =============================================================================

export const rowVersionSchema = z.string({ message: 'expectedRowVersion là bắt buộc' }).refine(
  value => /^[1-9]\d{0,18}$/.test(value) && BigInt(value) <= 9223372036854775807n,
  'expectedRowVersion phải là chuỗi số nguyên dương int64 chuẩn'
);

export const createReviewCommentSchema = z
  .object({
    body: z
      .string({ message: 'Nội dung nhận xét là bắt buộc' })
      .trim()
      .min(1, 'Nội dung nhận xét không được để trống')
      .max(4000, 'Nội dung nhận xét tối đa 4000 ký tự'),
    blockKey: z
      .string()
      .trim()
      .max(128, 'blockKey tối đa 128 ký tự')
      .optional()
      .nullable(),
    itemRevisionId: z
      .string()
      .trim()
      .refine(isValidUuid, 'itemRevisionId không đúng định dạng UUID')
      .optional()
      .nullable(),
  })
  .strict()
  .refine(
    data => !(data.blockKey && data.itemRevisionId),
    {
      message: 'Không thể đồng thời gắn nhận xét vào cả blockKey và itemRevisionId',
      path: ['blockKey'],
    }
  );

export const resolveReviewCommentSchema = z
  .object({
    expectedRowVersion: z.union([
      rowVersionSchema,
      z.number().int().positive().transform(n => n.toString()),
    ], { message: 'expectedRowVersion là bắt buộc' }),
  })
  .strict();

export const reopenReviewCommentSchema = resolveReviewCommentSchema;

// =============================================================================
// DTOs & Interfaces
// =============================================================================

export interface ReviewCommentDto {
  id: string;
  lessonRevisionId: string;
  revisionNo: number;
  blockKey: string | null;
  itemRevisionId: string | null;
  author: {
    id: string;
    displayName: string | null;
  };
  body: string;
  status: 'OPEN' | 'RESOLVED';
  rowVersion: string;
  resolvedAt: string | null;
  resolvedBy: {
    id: string;
    displayName: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export function toReviewCommentDto(
  comment: {
    id: string;
    lessonRevisionId: string;
    blockKey: string | null;
    itemRevisionId: string | null;
    authorAccountId: string;
    author?: { id: string; displayName: string | null } | null;
    body: string;
    status: string;
    rowVersion: bigint | number | string;
    resolvedAt: Date | string | null;
    resolvedByAccountId?: string | null;
    resolvedBy?: { id: string; displayName: string | null } | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    lessonRevision?: { revisionNo: number } | null;
  },
  fallbackRevisionNo?: number
): ReviewCommentDto {
  return {
    id: comment.id,
    lessonRevisionId: comment.lessonRevisionId,
    revisionNo: comment.lessonRevision?.revisionNo ?? fallbackRevisionNo ?? 0,
    blockKey: comment.blockKey ?? null,
    itemRevisionId: comment.itemRevisionId ?? null,
    author: {
      id: comment.author?.id ?? comment.authorAccountId,
      displayName: comment.author?.displayName ?? null,
    },
    body: comment.body,
    status: comment.status as 'OPEN' | 'RESOLVED',
    rowVersion: comment.rowVersion.toString(),
    resolvedAt: comment.resolvedAt
      ? (comment.resolvedAt instanceof Date ? comment.resolvedAt.toISOString() : new Date(comment.resolvedAt).toISOString())
      : null,
    resolvedBy: comment.resolvedBy
      ? {
          id: comment.resolvedBy.id,
          displayName: comment.resolvedBy.displayName ?? null,
        }
      : null,
    createdAt: comment.createdAt instanceof Date ? comment.createdAt.toISOString() : new Date(comment.createdAt).toISOString(),
    updatedAt: comment.updatedAt instanceof Date ? comment.updatedAt.toISOString() : new Date(comment.updatedAt).toISOString(),
  };
}

export interface ReviewCommentServiceResult {
  status: number;
  data?: ReviewCommentDto & { data: ReviewCommentDto };
  error?: ApiErrorEnvelope['error'];
}

export interface RevisionCommentsListResult {
  status: number;
  data?: { comments: ReviewCommentDto[]; data: ReviewCommentDto[] };
  error?: ApiErrorEnvelope['error'];
}

// =============================================================================
// Error Helper
// =============================================================================

function handleCommentError(err: unknown): { status: number; error: ApiErrorEnvelope['error'] } {
  if (err && typeof err === 'object' && 'code' in err) {
    const prismaErr = err as { code: string; meta?: any };
    if (prismaErr.code === 'P2002') {
      return {
        status: 409,
        error: {
          code: 'CONFLICT',
          message: 'Dữ liệu nhận xét bị xung đột.',
        },
      };
    }
    if (prismaErr.code === 'P2025') {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Bản ghi không tồn tại.',
        },
      };
    }
  }
  return {
    status: 503,
    error: {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
    },
  };
}

class ReviewCommentMutationError extends Error {
  readonly status: number;
  readonly apiError: ApiErrorEnvelope['error'];

  constructor(
    status: number,
    apiError: ApiErrorEnvelope['error']
  ) {
    super(apiError.message);
    this.status = status;
    this.apiError = apiError;
  }
}

function rejectCommentMutation(
  status: number,
  code: string,
  message: string
): never {
  throw new ReviewCommentMutationError(status, { code, message });
}

async function lockActiveCommentActor(tx: any, actorId: string) {
  const rows = await tx.$queryRaw`
    SELECT id::text AS id, role, status
    FROM app.accounts WHERE id = ${actorId.toLowerCase()}::uuid FOR NO KEY UPDATE
  `;
  const actor = rows[0];
  if (!actor) {
    rejectCommentMutation(401, 'UNAUTHORIZED', 'Tài khoản không tồn tại.');
  }
  if (actor.status !== 'ACTIVE') {
    rejectCommentMutation(403, 'ACCOUNT_INACTIVE', 'Tài khoản đang chờ duyệt hoặc đã bị vô hiệu hóa.');
  }
  return actor;
}

async function lockCommentLessonAssignment(tx: any, lessonId: string) {
  await tx.$queryRaw`
    SELECT id::text FROM app.lessons WHERE id = ${lessonId.toLowerCase()}::uuid FOR UPDATE
  `;
  const rows = await tx.$queryRaw`
    SELECT current_teacher_id::text AS "currentTeacherId"
    FROM app.content_assignments WHERE lesson_id = ${lessonId.toLowerCase()}::uuid FOR UPDATE
  `;
  return rows[0] || null;
}

function commentMutationErrorResult(err: unknown) {
  if (err instanceof ReviewCommentMutationError) {
    return { status: err.status, error: err.apiError };
  }
  return null;
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Creates a review comment on a lesson revision, anchored to a blockKey, itemRevisionId, or revision-wide.
 * Restricted to active ADMIN accounts.
 */
export async function createReviewComment(
  actorId: string,
  lessonRevisionId: string,
  rawInput: unknown,
  prismaClient?: any,
  lessonId?: string
): Promise<ReviewCommentServiceResult> {
  if (!isValidUuid(actorId) || !isValidUuid(lessonRevisionId) || (lessonId && !isValidUuid(lessonId))) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh không đúng định dạng UUID.',
      },
    };
  }

  const parseResult = createReviewCommentSchema.safeParse(rawInput);
  if (!parseResult.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parseResult.error.issues) {
      fieldErrors[issue.path.join('.') || 'body'] = issue.message;
    }
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Dữ liệu nhận xét không hợp lệ.',
        fields: fieldErrors,
      },
    };
  }

  const { body, blockKey, itemRevisionId } = parseResult.data;
  const prisma = prismaClient || getProductPrisma();

  try {
    // 1. Verify actor: ADMIN role & ACTIVE status
    const actor = await prisma.account.findUnique({
      where: { id: actorId.toLowerCase() },
      select: { id: true, role: true, status: true, displayName: true },
    });

    if (!actor) {
      return {
        status: 401,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Tài khoản không tồn tại.',
        },
      };
    }

    if (actor.role !== 'ADMIN') {
      return {
        status: 403,
        error: {
          code: 'FORBIDDEN',
          message: 'Chỉ tài khoản ADMIN mới có quyền tạo nhận xét kiểm duyệt.',
        },
      };
    }

    if (actor.status !== 'ACTIVE') {
      return {
        status: 403,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Tài khoản đang chờ duyệt hoặc đã bị vô hiệu hóa.',
        },
      };
    }

    // 2. Verify lesson revision exists
    const revision = await prisma.lessonRevision.findUnique({
      where: { id: lessonRevisionId.toLowerCase() },
      select: {
        id: true,
        lessonId: true,
        revisionNo: true,
      },
    });

    if (!revision) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Bản sửa đổi bài học không tồn tại.',
        },
      };
    }

    if (lessonId && revision.lessonId.toLowerCase() !== lessonId.toLowerCase()) {
      return {
        status: 400,
        error: {
          code: 'LESSON_REVISION_MISMATCH',
          message: 'Bản sửa đổi không thuộc bài học được chỉ định.',
        },
      };
    }

    // 3. Anchor validations
    if (blockKey) {
      const blockExists = await prisma.lessonContentBlock.findFirst({
        where: {
          lessonRevisionId: revision.id,
          blockKey,
        },
        select: { id: true },
      });

      if (!blockExists) {
        return {
          status: 400,
          error: {
            code: 'BLOCK_NOT_FOUND',
            message: `Khối nội dung '${blockKey}' không tồn tại trong bản sửa đổi này.`,
          },
        };
      }
    }

    if (itemRevisionId) {
      const itemExists = await prisma.itemRevision.findFirst({
        where: {
          id: itemRevisionId.toLowerCase(),
          authoringLessonRevisionId: revision.id,
        },
        select: { id: true },
      });

      if (!itemExists) {
        return {
          status: 400,
          error: {
            code: 'ITEM_NOT_FOUND',
            message: `Bài tập '${itemRevisionId}' không tồn tại hoặc không thuộc bản sửa đổi này.`,
          },
        };
      }
    }

    // Recheck the actor while holding its account lock through the insert.
    const comment = await prisma.$transaction(async (tx: any) => {
      const currentActor = await lockActiveCommentActor(tx, actorId);
      if (currentActor.role !== 'ADMIN') {
        rejectCommentMutation(403, 'FORBIDDEN', 'Chỉ tài khoản ADMIN mới có quyền tạo nhận xét kiểm duyệt.');
      }
      return tx.revisionReviewComment.create({
        data: {
          lessonRevisionId: revision.id,
          blockKey: blockKey || null,
          itemRevisionId: itemRevisionId ? itemRevisionId.toLowerCase() : null,
          authorAccountId: currentActor.id,
          body,
          status: 'OPEN',
          rowVersion: 1n,
        },
        include: {
          author: { select: { id: true, displayName: true } },
          resolvedBy: { select: { id: true, displayName: true } },
          lessonRevision: { select: { revisionNo: true } },
        },
      });
    });

    const dto = toReviewCommentDto(comment, revision.revisionNo);
    return {
      status: 201,
      data: {
        ...dto,
        data: dto,
      },
    };
  } catch (err) {
    const mutationError = commentMutationErrorResult(err);
    if (mutationError) return mutationError;
    return handleCommentError(err);
  }
}

/**
 * Resolves an OPEN review comment.
 * Permitted for ADMIN or the currently assigned TEACHER.
 * Uses optimistic concurrency check (CAS) on rowVersion.
 */
export async function resolveReviewComment(
  actorId: string,
  commentId: string,
  expectedRowVersion: string,
  prismaClient?: any,
  lessonId?: string
): Promise<ReviewCommentServiceResult> {
  if (!isValidUuid(actorId) || !isValidUuid(commentId) || (lessonId && !isValidUuid(lessonId))) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh không đúng định dạng UUID.',
      },
    };
  }

  const verParse = rowVersionSchema.safeParse(expectedRowVersion);
  if (!verParse.success) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ROW_VERSION',
        message: 'expectedRowVersion phải là chuỗi số nguyên dương int64 chuẩn.',
      },
    };
  }
  const expVer = BigInt(verParse.data);

  const prisma = prismaClient || getProductPrisma();

  try {
    // 1. Verify actor
    const actor = await prisma.account.findUnique({
      where: { id: actorId.toLowerCase() },
      select: { id: true, role: true, status: true, displayName: true },
    });

    if (!actor) {
      return {
        status: 401,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Tài khoản không tồn tại.',
        },
      };
    }

    if (actor.status !== 'ACTIVE') {
      return {
        status: 403,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Tài khoản đang chờ duyệt hoặc đã bị vô hiệu hóa.',
        },
      };
    }

    if (actor.role !== 'ADMIN' && actor.role !== 'TEACHER') {
      return {
        status: 403,
        error: {
          code: 'FORBIDDEN',
          message: 'Bạn không có quyền xử lý nhận xét này.',
        },
      };
    }

    // Revalidate the role and assignment under locks inside the transaction so reassignment
    // or account changes cannot race the permission check and CAS.
    const now = new Date();
    const updatedComment = await prisma.$transaction(async (tx: any) => {
      const currentActor = await lockActiveCommentActor(tx, actorId);
      if (currentActor.role !== 'ADMIN' && currentActor.role !== 'TEACHER') {
        rejectCommentMutation(403, 'FORBIDDEN', 'Bạn không có quyền xử lý nhận xét này.');
      }

      // Lock comment row FOR UPDATE
      const commentRows = await tx.$queryRaw`
        SELECT c.id::text AS id, c.lesson_revision_id::text AS "lessonRevisionId",
               c.row_version::text AS "rowVersion", c.status, lr.lesson_id::text AS "lessonId",
               lr.revision_no AS "revisionNo"
        FROM app.revision_review_comments c
        JOIN app.lesson_revisions lr ON lr.id = c.lesson_revision_id
        WHERE c.id = ${commentId.toLowerCase()}::uuid
        FOR UPDATE
      `;
      const currentComment = commentRows[0];
      if (!currentComment) {
        rejectCommentMutation(404, 'NOT_FOUND', 'Không tìm thấy nhận xét kiểm duyệt.');
      }
      if (lessonId && currentComment.lessonId.toLowerCase() !== lessonId.toLowerCase()) {
        rejectCommentMutation(400, 'LESSON_COMMENT_MISMATCH', 'Nhận xét không thuộc bài học được chỉ định.');
      }

      if (currentActor.role === 'TEACHER') {
        const assignment = await lockCommentLessonAssignment(tx, currentComment.lessonId);
        if (assignment?.currentTeacherId?.toLowerCase() !== currentActor.id.toLowerCase()) {
          rejectCommentMutation(403, 'FORBIDDEN', 'Bạn không có quyền xử lý nhận xét này.');
        }
      }

      if (BigInt(currentComment.rowVersion) !== expVer) {
        rejectCommentMutation(409, 'STALE_RECORD', 'Nhận xét đã bị thay đổi bởi thao tác khác. Vui lòng tải lại trang.');
      }
      if (currentComment.status !== 'OPEN') {
        rejectCommentMutation(409, 'INVALID_STATE', 'Nhận xét đã được xử lý hoặc không ở trạng thái OPEN.');
      }

      const updateRes = await tx.revisionReviewComment.updateMany({
        where: {
          id: currentComment.id,
          rowVersion: expVer,
          status: 'OPEN',
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: now,
          resolvedByAccountId: currentActor.id,
          rowVersion: expVer + 1n,
          updatedAt: now,
        },
      });

      if (updateRes.count === 0) {
        throw new Error('STALE_OPERATION');
      }

      return await tx.revisionReviewComment.findUnique({
        where: { id: currentComment.id },
        include: {
          author: { select: { id: true, displayName: true } },
          resolvedBy: { select: { id: true, displayName: true } },
          lessonRevision: { select: { revisionNo: true } },
        },
      });
    });

    const dto = toReviewCommentDto(updatedComment, updatedComment?.lessonRevision?.revisionNo ?? 0);
    return {
      status: 200,
      data: {
        ...dto,
        data: dto,
      },
    };
  } catch (err: any) {
    const mutationError = commentMutationErrorResult(err);
    if (mutationError) return mutationError;
    if (err?.message === 'STALE_OPERATION') {
      return {
        status: 409,
        error: {
          code: 'STALE_RECORD',
          message: 'Nhận xét đã bị thay đổi bởi thao tác khác. Vui lòng tải lại trang.',
        },
      };
    }
    return handleCommentError(err);
  }
}

/**
 * Reopens a RESOLVED review comment back to OPEN.
 * Restricted to active ADMIN accounts.
 * Uses optimistic concurrency check (CAS) on rowVersion.
 */
export async function reopenReviewComment(
  actorId: string,
  commentId: string,
  expectedRowVersion: string,
  prismaClient?: any,
  lessonId?: string
): Promise<ReviewCommentServiceResult> {
  if (!isValidUuid(actorId) || !isValidUuid(commentId) || (lessonId && !isValidUuid(lessonId))) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh không đúng định dạng UUID.',
      },
    };
  }

  const verParse = rowVersionSchema.safeParse(expectedRowVersion);
  if (!verParse.success) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ROW_VERSION',
        message: 'expectedRowVersion phải là chuỗi số nguyên dương int64 chuẩn.',
      },
    };
  }
  const expVer = BigInt(verParse.data);

  const prisma = prismaClient || getProductPrisma();

  try {
    // 1. Verify actor: ADMIN role & ACTIVE status only
    const actor = await prisma.account.findUnique({
      where: { id: actorId.toLowerCase() },
      select: { id: true, role: true, status: true, displayName: true },
    });

    if (!actor) {
      return {
        status: 401,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Tài khoản không tồn tại.',
        },
      };
    }

    if (actor.role !== 'ADMIN') {
      return {
        status: 403,
        error: {
          code: 'FORBIDDEN',
          message: 'Chỉ quản trị viên mới có quyền mở lại nhận xét.',
        },
      };
    }

    if (actor.status !== 'ACTIVE') {
      return {
        status: 403,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Tài khoản đang chờ duyệt hoặc đã bị vô hiệu hóa.',
        },
      };
    }

    // 2. Fetch comment
    const comment = await prisma.revisionReviewComment.findUnique({
      where: { id: commentId.toLowerCase() },
      include: {
        lessonRevision: {
          select: {
            id: true,
            revisionNo: true,
            lessonId: true,
          },
        },
      },
    });

    if (!comment) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Không tìm thấy nhận xét kiểm duyệt.',
        },
      };
    }

    if (lessonId && comment.lessonRevision.lessonId.toLowerCase() !== lessonId.toLowerCase()) {
      return {
        status: 400,
        error: {
          code: 'LESSON_COMMENT_MISMATCH',
          message: 'Nhận xét không thuộc bài học được chỉ định.',
        },
      };
    }

    // 3. CAS check on rowVersion
    if (comment.rowVersion !== expVer) {
      return {
        status: 409,
        error: {
          code: 'STALE_RECORD',
          message: 'Nhận xét đã bị thay đổi bởi thao tác khác. Vui lòng tải lại trang.',
        },
      };
    }

    // 4. Status check: must be RESOLVED
    if (comment.status !== 'RESOLVED') {
      return {
        status: 409,
        error: {
          code: 'INVALID_STATE',
          message: 'Chỉ có thể mở lại nhận xét đang ở trạng thái RESOLVED.',
        },
      };
    }

    // Revalidate the admin while holding its account lock through the update.
    const now = new Date();
    const updatedComment = await prisma.$transaction(async (tx: any) => {
      const currentActor = await lockActiveCommentActor(tx, actorId);
      if (currentActor.role !== 'ADMIN') {
        rejectCommentMutation(403, 'FORBIDDEN', 'Chỉ quản trị viên mới có quyền mở lại nhận xét.');
      }

      const currentComment = await tx.revisionReviewComment.findUnique({
        where: { id: comment.id },
        include: {
          lessonRevision: {
            select: { id: true, revisionNo: true, lessonId: true },
          },
        },
      });
      if (!currentComment) {
        rejectCommentMutation(404, 'NOT_FOUND', 'Không tìm thấy nhận xét kiểm duyệt.');
      }
      if (lessonId && currentComment.lessonRevision.lessonId.toLowerCase() !== lessonId.toLowerCase()) {
        rejectCommentMutation(400, 'LESSON_COMMENT_MISMATCH', 'Nhận xét không thuộc bài học được chỉ định.');
      }
      if (currentComment.rowVersion !== expVer) {
        rejectCommentMutation(409, 'STALE_RECORD', 'Nhận xét đã bị thay đổi bởi thao tác khác. Vui lòng tải lại trang.');
      }
      if (currentComment.status !== 'RESOLVED') {
        rejectCommentMutation(409, 'INVALID_STATE', 'Chỉ có thể mở lại nhận xét đang ở trạng thái RESOLVED.');
      }

      const updateRes = await tx.revisionReviewComment.updateMany({
        where: {
          id: currentComment.id,
          rowVersion: expVer,
          status: 'RESOLVED',
        },
        data: {
          status: 'OPEN',
          resolvedAt: null,
          resolvedByAccountId: null,
          rowVersion: expVer + 1n,
          updatedAt: now,
        },
      });

      if (updateRes.count === 0) {
        throw new Error('STALE_OPERATION');
      }

      return await tx.revisionReviewComment.findUnique({
        where: { id: currentComment.id },
        include: {
          author: { select: { id: true, displayName: true } },
          resolvedBy: { select: { id: true, displayName: true } },
          lessonRevision: { select: { revisionNo: true } },
        },
      });
    });

    const dto = toReviewCommentDto(updatedComment, comment.lessonRevision.revisionNo);
    return {
      status: 200,
      data: {
        ...dto,
        data: dto,
      },
    };
  } catch (err: any) {
    const mutationError = commentMutationErrorResult(err);
    if (mutationError) return mutationError;
    if (err?.message === 'STALE_OPERATION') {
      return {
        status: 409,
        error: {
          code: 'STALE_RECORD',
          message: 'Nhận xét đã bị thay đổi bởi thao tác khác. Vui lòng tải lại trang.',
        },
      };
    }
    return handleCommentError(err);
  }
}

/**
 * Retrieves all review comments for a lesson across current and predecessor revisions.
 * Permitted for ADMIN or the currently assigned TEACHER.
 */
export async function getRevisionComments(
  actorId: string,
  lessonId: string,
  prismaClient?: any
): Promise<RevisionCommentsListResult> {
  if (!isValidUuid(actorId) || !isValidUuid(lessonId)) {
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
    // 1. Verify actor
    const actor = await prisma.account.findUnique({
      where: { id: actorId.toLowerCase() },
      select: { id: true, role: true, status: true },
    });

    if (!actor) {
      return {
        status: 401,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Tài khoản không tồn tại.',
        },
      };
    }

    if (actor.status !== 'ACTIVE') {
      return {
        status: 403,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Tài khoản đang chờ duyệt hoặc đã bị vô hiệu hóa.',
        },
      };
    }

    // 2. Fetch lesson & check assignment
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId.toLowerCase() },
      include: {
        assignment: {
          select: {
            currentTeacherId: true,
          },
        },
        revisions: {
          select: {
            id: true,
            revisionNo: true,
          },
          orderBy: {
            revisionNo: 'asc',
          },
        },
      },
    });

    if (!lesson) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Bài học không tồn tại trong hệ thống.',
        },
      };
    }

    const assignedTeacherId = lesson.assignment?.currentTeacherId?.toLowerCase();
    const isAssignedTeacher = actor.role === 'TEACHER' && assignedTeacherId === actor.id.toLowerCase();
    const isAdmin = actor.role === 'ADMIN';

    if (!isAdmin && !isAssignedTeacher) {
      return {
        status: 403,
        error: {
          code: 'FORBIDDEN',
          message: 'Bạn không có quyền xem nhận xét của bài học này.',
        },
      };
    }

    const revisionIds = (lesson.revisions as Array<{ id: string; revisionNo: number }>).map(r => r.id);
    const revisionNoMap = new Map<string, number>();
    for (const r of (lesson.revisions as Array<{ id: string; revisionNo: number }>)) {
      revisionNoMap.set(r.id.toLowerCase(), r.revisionNo);
    }

    const comments = await prisma.revisionReviewComment.findMany({
      where: {
        lessonRevisionId: { in: revisionIds },
      },
      include: {
        author: { select: { id: true, displayName: true } },
        resolvedBy: { select: { id: true, displayName: true } },
        lessonRevision: { select: { revisionNo: true } },
      },
      orderBy: [
        { createdAt: 'asc' },
        { id: 'asc' },
      ],
    });

    const dtos = (comments as any[]).map(c => toReviewCommentDto(c, revisionNoMap.get(c.lessonRevisionId.toLowerCase())));

    return {
      status: 200,
      data: {
        comments: dtos,
        data: dtos,
      },
    };
  } catch (err) {
    return handleCommentError(err);
  }
}
