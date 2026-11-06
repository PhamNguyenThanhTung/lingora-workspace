import 'server-only';
import type { Prisma, PrismaClient } from '../../../../lingora-admin/generated/product-client/index.js';
import { getLearnerPrisma } from '../db/index.ts';
import {
  attemptPostSchema,
  responsePostSchema,
  finalizePostSchema,
  LessonServiceError,
  type AttemptPostInput,
  type ResponsePostInput,
  type FinalizePostInput,
  type PracticeAttemptDto,
  type PracticeResponseDto,
  type PracticeResponseResultDto,
  type PracticeFinalizeResultDto,
  type LearnerExerciseDto,
  type PracticeScoreDto,
  type PracticeReviewEntryDto,
} from './dto.ts';
import { publicExercise } from './content.ts';
import {
  gradePracticeExercise,
  computeInputHash,
} from './grader.ts';
import {
  ownedContext,
  authorizedLesson,
  clock,
  validId,
  fail,
} from './service.ts';

type Db = PrismaClient | Prisma.TransactionClient;

interface ExerciseWithSecret {
  id: string;
  itemId: string;
  itemRevisionId: string;
  position: number;
  isCore: boolean;
  item: { id: string; origin: string };
  itemRevision: {
    id: string;
    itemId: string;
    type: string;
    schemaVersion: number;
    promptData: unknown;
    assessmentBlueprintId: string | null;
    gradingSecret: {
      schemaVersion: number;
      gradingData: unknown;
      feedbackData?: unknown;
    } | null;
  };
}

async function loadRevisionCoreExercises(db: Db, lessonRevisionId: string): Promise<ExerciseWithSecret[]> {
  const exercises = await db.lessonExercise.findMany({
    where: {
      lessonRevisionId,
      isCore: true,
      item: { origin: 'PRACTICE' },
      itemRevision: { assessmentBlueprintId: null },
    },
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      itemId: true,
      itemRevisionId: true,
      position: true,
      isCore: true,
      item: { select: { id: true, origin: true } },
      itemRevision: {
        select: {
          id: true,
          itemId: true,
          type: true,
          schemaVersion: true,
          promptData: true,
          assessmentBlueprintId: true,
          gradingSecret: {
            select: {
              schemaVersion: true,
              gradingData: true,
              feedbackData: true,
            },
          },
        },
      },
    },
  });

  return exercises as unknown as ExerciseWithSecret[];
}

export function deriveQueueState(
  coreExercises: ExerciseWithSecret[],
  responses: Array<{
    id: string;
    lessonExerciseId: string;
    responseOrdinal: number;
    queuePosition: number;
    isCorrect: boolean;
    contributionUnits: number;
    respondedAt: Date;
    input: unknown;
  }>
) {
  const nCore = coreExercises.length;
  const nResponses = responses.length;

  // First pass: exercises in original position order
  for (let i = 0; i < nCore; i++) {
    if (i >= nResponses) {
      return {
        nextExercise: coreExercises[i],
        nextOrdinal: 1,
        queuePosition: i + 1,
        isQueueComplete: false,
      };
    }
  }

  // Identify exercises wrong on first pass, in their original response order
  const firstWrong = responses.slice(0, nCore).filter(r => !r.isCorrect);
  const kFirstWrong = firstWrong.length;

  for (let j = 0; j < kFirstWrong; j++) {
    const queueIndex = nCore + j;
    if (queueIndex >= nResponses) {
      const exerciseId = firstWrong[j].lessonExerciseId;
      const ex = coreExercises.find(e => e.id === exerciseId);
      if (!ex) {
        throw new LessonServiceError(500, 'QUEUE_INCONSISTENT', 'Không tìm thấy bài tập trong hàng đợi làm lại.');
      }
      return {
        nextExercise: ex,
        nextOrdinal: 2,
        queuePosition: queueIndex + 1,
        isQueueComplete: false,
      };
    }
  }

  return {
    nextExercise: null,
    nextOrdinal: null,
    queuePosition: null,
    isQueueComplete: true,
  };
}

function formatUserResponseText(type: string, promptData: any, input: unknown): string {
  if (!input || typeof input !== 'object') return '';
  const data = input as any;
  if (type === 'MCQ' || type === 'LISTENING') {
    const optionId = typeof data.optionId === 'string' ? data.optionId : '';
    const options = Array.isArray(promptData?.options) ? promptData.options : [];
    const matched = options.find((o: any) => o.id === optionId);
    return matched?.text || optionId;
  }
  if (type === 'REORDER') {
    const tokenIds = Array.isArray(data.tokenIds) ? data.tokenIds : [];
    const tokens = Array.isArray(promptData?.tokens) ? promptData.tokens : [];
    const tokenMap = new Map<string, string>(tokens.map((t: any) => [t.id, t.text]));
    return tokenIds.map((id: string) => tokenMap.get(id) || id).join(' ');
  }
  if (type === 'FILL_BLANK' || type === 'GRAMMAR') {
    return typeof data.text === 'string' ? data.text.trim() : '';
  }
  return '';
}

function formatCorrectAnswerText(type: string, promptData: any, gradingData: any): string {
  if (!gradingData || typeof gradingData !== 'object') return '';
  if (type === 'MCQ' || type === 'LISTENING') {
    const correctOptionId = gradingData.correctOptionId;
    const options = Array.isArray(promptData?.options) ? promptData.options : [];
    const matched = options.find((o: any) => o.id === correctOptionId);
    return matched?.text || String(correctOptionId || '');
  }
  if (type === 'REORDER') {
    const correctOrder = Array.isArray(gradingData.correctOrder) ? gradingData.correctOrder : [];
    const tokens = Array.isArray(promptData?.tokens) ? promptData.tokens : [];
    const tokenMap = new Map<string, string>(tokens.map((t: any) => [t.id, t.text]));
    return correctOrder.map((id: string) => tokenMap.get(id) || id).join(' ');
  }
  if (type === 'FILL_BLANK' || type === 'GRAMMAR') {
    const acceptedAnswers = gradingData.acceptedAnswers;
    if (Array.isArray(acceptedAnswers)) {
      return acceptedAnswers.map((a: unknown) => String(a).trim()).filter(Boolean).join(' / ');
    }
    return String(acceptedAnswers || '');
  }
  return '';
}

export function buildPracticeReviewEntries(
  coreExercises: ExerciseWithSecret[],
  responses: Array<{
    lessonExerciseId: string;
    responseOrdinal: number;
    queuePosition: number;
    isCorrect: boolean;
    input: unknown;
  }>
): PracticeReviewEntryDto[] {
  const responsesByExercise = new Map<
    string,
    Array<{ ordinal: number; text: string; isCorrect: boolean }>
  >();

  for (const resp of responses) {
    const ex = coreExercises.find((e) => e.id === resp.lessonExerciseId);
    const type = ex?.itemRevision.type || '';
    const promptData = ex?.itemRevision.promptData;
    const list = responsesByExercise.get(resp.lessonExerciseId) || [];
    list.push({
      ordinal: resp.responseOrdinal,
      text: formatUserResponseText(type, promptData, resp.input),
      isCorrect: resp.isCorrect,
    });
    responsesByExercise.set(resp.lessonExerciseId, list);
  }

  return coreExercises.map((ex) => {
    const type = ex.itemRevision.type;
    const promptData = ex.itemRevision.promptData as any;
    const gradingData = ex.itemRevision.gradingSecret?.gradingData as any;
    const feedbackData = ex.itemRevision.gradingSecret?.feedbackData as any;

    const rawExplanation = feedbackData?.explanation;
    const explanation =
      typeof rawExplanation === 'string' && rawExplanation.trim().length > 0
        ? rawExplanation.trim()
        : null;

    const exerciseResponses = responsesByExercise.get(ex.id) || [];
    const isCorrect = exerciseResponses.some((r) => r.isCorrect);
    const lastResponse = exerciseResponses[exerciseResponses.length - 1];

    let prompt = '';
    if (type === 'FILL_BLANK') {
      prompt = promptData?.sentence || promptData?.prompt || '';
    } else if (type === 'GRAMMAR') {
      prompt = promptData?.sourceSentence || promptData?.prompt || '';
    } else {
      prompt = promptData?.prompt || '';
    }

    const correctAnswer = formatCorrectAnswerText(type, promptData, gradingData);

    return {
      lessonExerciseId: ex.id,
      position: ex.position,
      type,
      prompt,
      userResponse: lastResponse?.text || '',
      userResponses: exerciseResponses,
      isCorrect,
      correctAnswer,
      explanation,
    };
  });
}

export async function buildAttemptDto(
  db: Db,
  attempt: {
    id: string;
    contextId: string;
    lessonId: string;
    lessonRevisionId: string;
    startedAt: Date;
    completedAt: Date | null;
    nCore: number;
    kFirstWrong: number | null;
    contributionUnits: number | null;
    responseCount: number | null;
    responses: Array<{
      id: string;
      lessonExerciseId: string;
      responseOrdinal: number;
      queuePosition: number;
      isCorrect: boolean;
      contributionUnits: number;
      respondedAt: Date;
      input: unknown;
    }>;
  },
  currentActiveRevisionId: string | null
): Promise<PracticeAttemptDto> {
  const coreExercises = await loadRevisionCoreExercises(db, attempt.lessonRevisionId);
  const isCompleted = attempt.completedAt != null;
  const isStale = currentActiveRevisionId != null && currentActiveRevisionId !== attempt.lessonRevisionId;

  const queue = deriveQueueState(coreExercises, attempt.responses);

  let score: PracticeScoreDto | null = null;
  if (isCompleted && attempt.contributionUnits != null) {
    const k = attempt.kFirstWrong ?? 0;
    const maxUnits = 2 * (attempt.nCore + k);
    const percentage = maxUnits > 0 ? Math.round((attempt.contributionUnits / maxUnits) * 100) : 0;
    score = {
      contributionUnits: attempt.contributionUnits,
      maxUnits,
      percentage,
    };
  }

  let reviewEntries: PracticeReviewEntryDto[] | null = null;
  if (isCompleted) {
    reviewEntries = buildPracticeReviewEntries(coreExercises, attempt.responses);
  }

  const responsesDto: PracticeResponseDto[] = attempt.responses.map(r => ({
    id: r.id,
    lessonExerciseId: r.lessonExerciseId,
    responseOrdinal: r.responseOrdinal,
    queuePosition: r.queuePosition,
    isCorrect: r.isCorrect,
    contributionUnits: r.contributionUnits,
    respondedAt: r.respondedAt.toISOString(),
    input: r.input,
    formativeFeedback: r.isCorrect ? 'Chính xác!' : 'Chưa chính xác.',
  }));

  const publicExercisesList: LearnerExerciseDto[] = coreExercises.map(ex => publicExercise(ex));
  const nextExPublic = queue.nextExercise ? publicExercise(queue.nextExercise) : null;

  return {
    id: attempt.id,
    contextId: attempt.contextId,
    lessonId: attempt.lessonId,
    lessonRevisionId: attempt.lessonRevisionId,
    startedAt: attempt.startedAt.toISOString(),
    completedAt: attempt.completedAt ? attempt.completedAt.toISOString() : null,
    nCore: attempt.nCore,
    kFirstWrong: attempt.kFirstWrong,
    contributionUnits: attempt.contributionUnits,
    responseCount: attempt.responseCount,
    score,
    isCompleted,
    isStale,
    nextExercise: isCompleted ? null : nextExPublic,
    nextOrdinal: isCompleted ? null : queue.nextOrdinal,
    queuePosition: isCompleted ? null : queue.queuePosition,
    exercises: publicExercisesList,
    responses: responsesDto,
    reviewEntries,
  };
}

export async function getPracticeAttempt(
  contextId: string,
  lessonId: string,
  attemptId: string,
  verifiedUserId: string
): Promise<PracticeAttemptDto> {
  contextId = validId(contextId);
  lessonId = validId(lessonId);
  attemptId = validId(attemptId);

  const db = getLearnerPrisma();
  const c = await ownedContext(db, contextId, verifiedUserId);

  const attempt = await db.lessonAttempt.findUnique({
    where: { id: attemptId },
    include: {
      responses: {
        orderBy: { queuePosition: 'asc' },
      },
    },
  });

  if (!attempt || attempt.contextId !== contextId || attempt.lessonId !== lessonId) {
    return fail(404, 'NOT_FOUND', 'Phiên luyện tập không tồn tại.');
  }

  // Verify lesson accessibility
  const l = await authorizedLesson(db, c, lessonId);

  return buildAttemptDto(db, attempt, l.activeRevisionId);
}

export async function startPracticeAttempt(
  contextId: string,
  lessonId: string,
  input: AttemptPostInput,
  verifiedUserId: string
): Promise<PracticeAttemptDto> {
  contextId = validId(contextId);
  lessonId = validId(lessonId);

  const parsed = attemptPostSchema.safeParse(input);
  if (!parsed.success) {
    return fail(400, 'VALIDATION_ERROR', 'Dữ liệu khởi tạo phiên học không hợp lệ.');
  }
  input = parsed.data;

  return getLearnerPrisma().$transaction(async tx => {
    // 1. Account lock
    await tx.$queryRaw`SELECT id::text FROM app.accounts WHERE id = ${verifiedUserId}::uuid FOR NO KEY UPDATE`;
    const account = await tx.account.findUnique({
      where: { id: verifiedUserId },
      select: { id: true, status: true, role: true },
    });
    if (!account || account.role !== 'LEARNER' || account.status !== 'ACTIVE') {
      return fail(403, 'ACCOUNT_INACTIVE', 'Tài khoản học viên không hoạt động.');
    }

    // Candidate lookup
    const candidate = await tx.learningContext.findFirst({
      where: { id: contextId, learnerId: verifiedUserId },
      select: { id: true, courseId: true },
    });
    if (!candidate) {
      return fail(404, 'NOT_FOUND', 'Lộ trình học không tồn tại.');
    }

    // 2. Shared parent locks: Course -> Context -> Lesson
    await tx.$queryRaw`SELECT id::text FROM app.courses WHERE id = ${candidate.courseId}::uuid FOR SHARE`;
    await tx.$queryRaw`SELECT id::text FROM app.learning_contexts WHERE id = ${contextId}::uuid FOR SHARE`;
    await tx.$queryRaw`SELECT id::text FROM app.lessons WHERE id = ${lessonId}::uuid FOR SHARE`;

    const c = await ownedContext(tx, contextId, verifiedUserId);
    if (c.courseId !== candidate.courseId) {
      return fail(409, 'CONTEXT_INCONSISTENT', 'Lộ trình học đã thay đổi. Vui lòng tải lại.');
    }

    const l = await authorizedLesson(tx, c, lessonId);
    const revisionId = l.activeRevisionId!;

    // Replay check for attemptId
    const existing = await tx.lessonAttempt.findUnique({
      where: { id: input.attemptId },
      include: {
        responses: { orderBy: { queuePosition: 'asc' } },
      },
    });

    if (existing) {
      // Must match original context, lesson, and revision scope
      if (
        existing.contextId !== contextId ||
        existing.lessonId !== lessonId ||
        existing.lessonRevisionId !== input.expectedPublishedRevisionId
      ) {
        return fail(409, 'OPERATION_KEY_CONFLICT', 'Mã phiên luyện tập đã tồn tại với phạm vi khác.');
      }
      // Committed-operation replay: return existing attempt
      return buildAttemptDto(tx, existing, revisionId);
    }

    // For new attempt creation: pointer must match today's active published revision
    if (input.expectedPublishedRevisionId !== revisionId) {
      return fail(409, 'PUBLICATION_CHANGED', 'Nội dung bài học đã được cập nhật. Vui lòng tải lại trang.');
    }

    // Count actual core exercises
    const coreExercises = await loadRevisionCoreExercises(tx, revisionId);
    const nCore = coreExercises.length;
    if (nCore === 0) {
      return fail(409, 'NO_CORE_EXERCISES', 'Bài học không có bài tập cốt lõi để luyện tập.');
    }

    const now = await clock(tx);

    const created = await tx.lessonAttempt.create({
      data: {
        id: input.attemptId,
        contextId,
        lessonId,
        lessonRevisionId: revisionId,
        nCore,
        startedAt: now,
      },
      include: {
        responses: { orderBy: { queuePosition: 'asc' } },
      },
    });

    return buildAttemptDto(tx, created, revisionId);
  }, { isolationLevel: 'ReadCommitted', timeout: 15000 });
}

export async function submitPracticeResponse(
  contextId: string,
  lessonId: string,
  attemptId: string,
  input: ResponsePostInput,
  verifiedUserId: string
): Promise<PracticeResponseResultDto> {
  contextId = validId(contextId);
  lessonId = validId(lessonId);
  attemptId = validId(attemptId);

  const parsed = responsePostSchema.safeParse(input);
  if (!parsed.success) {
    return fail(400, 'VALIDATION_ERROR', 'Dữ liệu câu trả lời không hợp lệ.');
  }
  input = parsed.data;

  const inputHash = computeInputHash(input.input);

  return getLearnerPrisma().$transaction(async tx => {
    // 1. Account lock
    await tx.$queryRaw`SELECT id::text FROM app.accounts WHERE id = ${verifiedUserId}::uuid FOR NO KEY UPDATE`;
    const account = await tx.account.findUnique({
      where: { id: verifiedUserId },
      select: { id: true, status: true, role: true },
    });
    if (!account || account.role !== 'LEARNER' || account.status !== 'ACTIVE') {
      return fail(403, 'ACCOUNT_INACTIVE', 'Tài khoản học viên không hoạt động.');
    }

    const candidate = await tx.learningContext.findFirst({
      where: { id: contextId, learnerId: verifiedUserId },
      select: { id: true, courseId: true },
    });
    if (!candidate) {
      return fail(404, 'NOT_FOUND', 'Lộ trình học không tồn tại.');
    }

    // 2. Shared parent locks: Course -> Context -> Lesson
    await tx.$queryRaw`SELECT id::text FROM app.courses WHERE id = ${candidate.courseId}::uuid FOR SHARE`;
    await tx.$queryRaw`SELECT id::text FROM app.learning_contexts WHERE id = ${contextId}::uuid FOR SHARE`;
    await tx.$queryRaw`SELECT id::text FROM app.lessons WHERE id = ${lessonId}::uuid FOR SHARE`;

    // 3. Attempt lock
    await tx.$queryRaw`SELECT id::text FROM app.lesson_attempts WHERE id = ${attemptId}::uuid FOR UPDATE`;

    const c = await ownedContext(tx, contextId, verifiedUserId);
    if (c.courseId !== candidate.courseId) {
      return fail(409, 'CONTEXT_INCONSISTENT', 'Lộ trình học đã thay đổi. Vui lòng tải lại.');
    }

    const attempt = await tx.lessonAttempt.findUnique({
      where: { id: attemptId },
      include: {
        responses: { orderBy: { queuePosition: 'asc' } },
      },
    });

    if (!attempt || attempt.contextId !== contextId || attempt.lessonId !== lessonId) {
      return fail(404, 'NOT_FOUND', 'Phiên luyện tập không tồn tại.');
    }

    // Replay check before completedAt and active pointer check (D3 & Idempotency)
    const existingOp = await tx.lessonResponse.findUnique({
      where: {
        attemptId_operationKey: {
          attemptId,
          operationKey: input.operationKey,
        },
      },
    });

    if (existingOp) {
      if (existingOp.lessonExerciseId !== input.lessonExerciseId || existingOp.inputHash !== inputHash) {
        return fail(409, 'OPERATION_KEY_CONFLICT', 'Mã thao tác đã được sử dụng với câu trả lời khác.');
      }
      // Authorized committed-operation replay
      const currentLesson = await authorizedLesson(tx, c, lessonId);
      const attemptDto = await buildAttemptDto(tx, attempt, currentLesson.activeRevisionId);
      const responseDto: PracticeResponseDto = {
        id: existingOp.id,
        lessonExerciseId: existingOp.lessonExerciseId,
        responseOrdinal: existingOp.responseOrdinal,
        queuePosition: existingOp.queuePosition,
        isCorrect: existingOp.isCorrect,
        contributionUnits: existingOp.contributionUnits,
        respondedAt: existingOp.respondedAt.toISOString(),
        input: existingOp.input,
        formativeFeedback: existingOp.isCorrect ? 'Chính xác!' : 'Chưa chính xác.',
      };
      return { response: responseDto, attempt: attemptDto };
    }

    // New response write: verify today's active published pointer (D3)
    const currentLesson = await authorizedLesson(tx, c, lessonId);
    if (currentLesson.activeRevisionId !== attempt.lessonRevisionId) {
      return fail(409, 'PUBLICATION_CHANGED', 'Nội dung bài học đã được cập nhật. Vui lòng bắt đầu phiên luyện tập mới.');
    }

    if (attempt.completedAt != null) {
      return fail(409, 'ATTEMPT_ALREADY_FINALIZED', 'Phiên luyện tập đã hoàn thành, không thể ghi nhận thêm câu trả lời.');
    }

    // Queue derivation & validation
    const coreExercises = await loadRevisionCoreExercises(tx, attempt.lessonRevisionId);
    const queue = deriveQueueState(coreExercises, attempt.responses);

    if (queue.isQueueComplete || !queue.nextExercise) {
      return fail(400, 'QUEUE_COMPLETED', 'Đã hoàn thành tất cả các bài tập trong hàng đợi. Vui lòng hoàn tất phiên học.');
    }

    if (input.lessonExerciseId !== queue.nextExercise.id) {
      return fail(400, 'INVALID_QUEUE_EXERCISE', 'Bài tập không khớp với thứ tự trong hàng đợi.');
    }

    // Server-side grading from secret
    const secret = queue.nextExercise.itemRevision.gradingSecret;
    if (!secret || secret.schemaVersion !== 1) {
      return fail(500, 'GRADING_CONFIG_ERROR', 'Thiếu dữ liệu chấm điểm cho bài tập.');
    }

    const gradeResult = gradePracticeExercise(
      queue.nextExercise.itemRevision.type,
      queue.nextExercise.itemRevision.promptData,
      secret.gradingData,
      input.input
    );

    // Contribution rule:
    // Ordinal 1: correct -> 2, wrong -> 0
    // Ordinal 2: correct -> 1, wrong -> 0
    const contributionUnits = queue.nextOrdinal === 1
      ? (gradeResult.isCorrect ? 2 : 0)
      : (gradeResult.isCorrect ? 1 : 0);

    const now = await clock(tx);

    const createdResponse = await tx.lessonResponse.create({
      data: {
        attemptId,
        lessonExerciseId: queue.nextExercise.id,
        lessonRevisionId: attempt.lessonRevisionId,
        responseOrdinal: queue.nextOrdinal,
        queuePosition: queue.queuePosition,
        operationKey: input.operationKey,
        input: input.input as Prisma.InputJsonValue,
        inputHash,
        isCorrect: gradeResult.isCorrect,
        contributionUnits,
        respondedAt: now,
      },
    });

    // Update in-memory attempt responses to build updated attemptDto
    attempt.responses.push(createdResponse);

    const updatedAttemptDto = await buildAttemptDto(tx, attempt, currentLesson.activeRevisionId);

    const responseDto: PracticeResponseDto = {
      id: createdResponse.id,
      lessonExerciseId: createdResponse.lessonExerciseId,
      responseOrdinal: createdResponse.responseOrdinal,
      queuePosition: createdResponse.queuePosition,
      isCorrect: createdResponse.isCorrect,
      contributionUnits: createdResponse.contributionUnits,
      respondedAt: createdResponse.respondedAt.toISOString(),
      input: createdResponse.input,
      formativeFeedback: gradeResult.formativeFeedback,
    };

    return { response: responseDto, attempt: updatedAttemptDto };
  }, { isolationLevel: 'ReadCommitted', timeout: 15000 });
}

export async function finalizePracticeAttempt(
  contextId: string,
  lessonId: string,
  attemptId: string,
  input: FinalizePostInput,
  verifiedUserId: string
): Promise<PracticeFinalizeResultDto> {
  contextId = validId(contextId);
  lessonId = validId(lessonId);
  attemptId = validId(attemptId);

  const parsed = finalizePostSchema.safeParse(input);
  if (!parsed.success) {
    return fail(400, 'VALIDATION_ERROR', 'Dữ liệu hoàn tất bài học không hợp lệ.');
  }
  input = parsed.data;

  const finalizeInputHash = computeInputHash({ operationKey: input.operationKey, attemptId });

  return getLearnerPrisma().$transaction(async tx => {
    // 1. Account lock
    await tx.$queryRaw`SELECT id::text FROM app.accounts WHERE id = ${verifiedUserId}::uuid FOR NO KEY UPDATE`;
    const account = await tx.account.findUnique({
      where: { id: verifiedUserId },
      select: { id: true, status: true, role: true, timezone: true },
    });
    if (!account || account.role !== 'LEARNER' || account.status !== 'ACTIVE') {
      return fail(403, 'ACCOUNT_INACTIVE', 'Tài khoản học viên không hoạt động.');
    }

    const candidate = await tx.learningContext.findFirst({
      where: { id: contextId, learnerId: verifiedUserId },
      select: { id: true, courseId: true },
    });
    if (!candidate) {
      return fail(404, 'NOT_FOUND', 'Lộ trình học không tồn tại.');
    }

    // 2. Shared parent locks: Course -> Context -> Lesson
    await tx.$queryRaw`SELECT id::text FROM app.courses WHERE id = ${candidate.courseId}::uuid FOR SHARE`;
    await tx.$queryRaw`SELECT id::text FROM app.learning_contexts WHERE id = ${contextId}::uuid FOR SHARE`;
    await tx.$queryRaw`SELECT id::text FROM app.lessons WHERE id = ${lessonId}::uuid FOR SHARE`;

    // 3. Attempt lock
    await tx.$queryRaw`SELECT id::text FROM app.lesson_attempts WHERE id = ${attemptId}::uuid FOR UPDATE`;

    const c = await ownedContext(tx, contextId, verifiedUserId);
    if (c.courseId !== candidate.courseId) {
      return fail(409, 'CONTEXT_INCONSISTENT', 'Lộ trình học đã thay đổi. Vui lòng tải lại.');
    }

    const attempt = await tx.lessonAttempt.findUnique({
      where: { id: attemptId },
      include: {
        responses: { orderBy: { queuePosition: 'asc' } },
      },
    });

    if (!attempt || attempt.contextId !== contextId || attempt.lessonId !== lessonId) {
      return fail(404, 'NOT_FOUND', 'Phiên luyện tập không tồn tại.');
    }

    // Check CommandReceipt dedupe before pointer check (D3 & Section F)
    const existingReceipt = await tx.commandReceipt.findUnique({
      where: {
        actorId_command_operationKey: {
          actorId: verifiedUserId,
          command: 'COMPLETE_LESSON',
          operationKey: input.operationKey,
        },
      },
    });

    if (existingReceipt) {
      if (existingReceipt.targetId !== attemptId || existingReceipt.inputHash !== finalizeInputHash) {
        return fail(409, 'OPERATION_KEY_CONFLICT', 'Mã thao tác hoàn tất đã được sử dụng với nội dung khác.');
      }
      const currentLesson = await authorizedLesson(tx, c, lessonId);
      const attemptDto = await buildAttemptDto(tx, attempt, currentLesson.activeRevisionId);
      const isFirst = (existingReceipt.safeResult as any)?.isFirstCompletion ?? false;
      return { attempt: attemptDto, isFirstCompletion: isFirst };
    }

    // Pointer check: uncommitted finalization requires active revision (D3)
    const currentLesson = await authorizedLesson(tx, c, lessonId);
    if (currentLesson.activeRevisionId !== attempt.lessonRevisionId) {
      return fail(409, 'PUBLICATION_CHANGED', 'Nội dung bài học đã được cập nhật. Không thể hoàn tất bài làm cũ.');
    }

    if (attempt.completedAt != null) {
      return fail(409, 'ATTEMPT_ALREADY_FINALIZED', 'Phiên luyện tập đã được hoàn tất trước đó với mã khác.');
    }

    // Queue completeness and unit verification
    const coreExercises = await loadRevisionCoreExercises(tx, attempt.lessonRevisionId);
    const nCore = coreExercises.length;
    if (nCore === 0 || nCore !== attempt.nCore) {
      return fail(409, 'CONTENT_INCONSISTENT', 'Dữ liệu bài tập cốt lõi không nhất quán.');
    }

    const responses = attempt.responses;
    if (responses.length < nCore) {
      return fail(400, 'INCOMPLETE_ATTEMPT', 'Chưa hoàn thành đủ tất cả các bài tập cốt lõi.');
    }

    // Verify first pass
    for (let i = 0; i < nCore; i++) {
      const r = responses[i];
      if (
        r.lessonExerciseId !== coreExercises[i].id ||
        r.responseOrdinal !== 1 ||
        r.queuePosition !== i + 1
      ) {
        return fail(400, 'INCOMPLETE_ATTEMPT', 'Lịch sử trả lời không khớp với hàng đợi bài tập cốt lõi.');
      }
    }

    // Verify retries
    const firstWrong = responses.slice(0, nCore).filter(r => !r.isCorrect);
    const kFirstWrong = firstWrong.length;
    const expectedTotal = nCore + kFirstWrong;

    if (responses.length !== expectedTotal) {
      return fail(400, 'INCOMPLETE_ATTEMPT', 'Chưa hoàn thành đủ tất cả các bài tập làm lại.');
    }

    for (let j = 0; j < kFirstWrong; j++) {
      const r = responses[nCore + j];
      if (
        r.lessonExerciseId !== firstWrong[j].lessonExerciseId ||
        r.responseOrdinal !== 2 ||
        r.queuePosition !== nCore + j + 1
      ) {
        return fail(400, 'INCOMPLETE_ATTEMPT', 'Lịch sử trả lời không khớp với hàng đợi làm lại.');
      }
    }

    const contributionUnits = responses.reduce((sum, r) => sum + r.contributionUnits, 0);

    // DB clock follows locks
    const clockRows = await tx.$queryRaw<Array<{ completed_at: Date; qualifying_date: Date }>>`
      SELECT instant.ts AS completed_at, (timezone(${account.timezone}, instant.ts))::date AS qualifying_date
      FROM (SELECT clock_timestamp() AS ts) AS instant
    `;
    const { completed_at: completedAt, qualifying_date: qualifyingLocalDate } = clockRows[0] ?? {};
    if (!(completedAt instanceof Date) || !Number.isFinite(completedAt.valueOf()) ||
        !(qualifyingLocalDate instanceof Date) || !Number.isFinite(qualifyingLocalDate.valueOf())) {
      throw new Error('Database completion clock unavailable');
    }

    // Atomically update LessonAttempt
    const updatedAttempt = await tx.lessonAttempt.update({
      where: { id: attemptId },
      data: {
        completedAt,
        kFirstWrong,
        contributionUnits,
        responseCount: expectedTotal,
        completionOperationKey: input.operationKey,
        qualifyingLocalDate,
        timezoneAtCompletion: account.timezone,
        rowVersion: { increment: 1 },
      },
      include: {
        responses: { orderBy: { queuePosition: 'asc' } },
      },
    });

    // Insert first LessonCompletion per context and lesson
    await tx.$executeRaw`
      INSERT INTO app.lesson_completions (
        context_id,
        lesson_id,
        first_attempt_id,
        completed_at,
        created_at
      ) VALUES (
        ${contextId}::uuid,
        ${lessonId}::uuid,
        ${attemptId}::uuid,
        ${completedAt},
        ${completedAt}
      ) ON CONFLICT (context_id, lesson_id) DO NOTHING
    `;

    const completion = await tx.lessonCompletion.findUnique({
      where: { contextId_lessonId: { contextId, lessonId } },
    });
    const isFirstCompletion = completion?.firstAttemptId === attemptId;

    // D2: Approved Core Vocabulary Enrollment
    const coreVocabLinks = await tx.lessonVocabularyLink.findMany({
      where: {
        lessonRevisionId: attempt.lessonRevisionId,
        isCore: true,
      },
      select: {
        id: true,
        vocabularyId: true,
      },
    });

    const dueAt = new Date(completedAt.getTime() + 24 * 60 * 60 * 1000); // stage 1, due after 1 day

    for (const link of coreVocabLinks) {
      await tx.$executeRaw`
        INSERT INTO app.srs_cards (
          learner_id,
          vocabulary_id,
          stage,
          due_at,
          enrollment_source,
          source_attempt_id,
          source_lesson_vocabulary_id,
          created_at,
          updated_at,
          row_version
        ) VALUES (
          ${account.id}::uuid,
          ${link.vocabularyId}::uuid,
          1,
          ${dueAt},
          'CORE_COMPLETION',
          ${attemptId}::uuid,
          ${link.id}::uuid,
          ${completedAt},
          ${completedAt},
          1
        ) ON CONFLICT (learner_id, vocabulary_id) DO NOTHING
      `;
    }

    // Insert CommandReceipt
    await tx.commandReceipt.create({
      data: {
        actorId: verifiedUserId,
        command: 'COMPLETE_LESSON',
        operationKey: input.operationKey,
        inputHash: finalizeInputHash,
        targetId: attemptId,
        safeResult: {
          attemptId,
          contributionUnits,
          nCore,
          kFirstWrong,
          responseCount: expectedTotal,
          completedAt: completedAt.toISOString(),
          isFirstCompletion,
        },
        committedAt: completedAt,
      },
    });

    const attemptDto = await buildAttemptDto(tx, updatedAttempt, currentLesson.activeRevisionId);

    return { attempt: attemptDto, isFirstCompletion };
  }, { isolationLevel: 'ReadCommitted', timeout: 15000 });
}

export async function loadLatestPracticeAttempt(
  contextId: string,
  lessonId: string,
  verifiedUserId: string
): Promise<PracticeAttemptDto | null> {
  contextId = validId(contextId);
  lessonId = validId(lessonId);

  const db = getLearnerPrisma();
  const c = await ownedContext(db, contextId, verifiedUserId);

  const l = await authorizedLesson(db, c, lessonId);
  const responses = { orderBy: { queuePosition: 'asc' as const } };
  // Resume current work before showing primary completed performance. Stale open
  // work remains accessible through its owner-scoped history endpoint.
  const open = await db.lessonAttempt.findFirst({
    where: { contextId, lessonId, lessonRevisionId: l.activeRevisionId!, completedAt: null },
    orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
    include: { responses },
  });
  const attempt = open ?? await db.lessonAttempt.findFirst({
    where: { contextId, lessonId, completedAt: { not: null } },
    orderBy: [{ completedAt: 'desc' }, { id: 'desc' }],
    include: { responses },
  });
  return attempt ? buildAttemptDto(db, attempt, l.activeRevisionId) : null;
}
