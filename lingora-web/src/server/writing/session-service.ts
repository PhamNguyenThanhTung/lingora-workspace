import 'server-only';
import { createHash } from 'node:crypto';
import { gradeStrokeAttempt, type CandidateStrokeInput } from '@lingora/lesson-content';
import { getLearnerPrisma } from '../db/index.ts';
import { isValidUuid, LessonServiceError } from '../lessons/dto.ts';
import { ownedContext, authorizedLesson } from '../lessons/service.ts';

export const CURRENT_WRITING_GRADER_VERSION = 1;

export interface StartWritingSessionInput {
  contextId: string;
  lessonId: string;
  characterId?: string | null;
  blockKey?: string | null;
  lessonVocabularyLinkId?: string | null;
  expectedPublishedRevisionId?: string | null;
  operationKey?: string | null;
  verifiedUserId: string;
}

export interface WritingSessionDto {
  sessionId: string;
  learnerId: string;
  contextId: string;
  lessonId: string | null;
  lessonRevisionId: string | null;
  practiceKind?: string;
  characterId: string;
  glyph: string;
  strokeCount: number;
  strokeVersion: number;
  status: string;
  startedAt: string;
  rowVersion: string;
  isReplay?: boolean;
}

export interface SubmitWritingAttemptInput {
  sessionId: string;
  operationKey: string;
  candidateStrokes: CandidateStrokeInput[];
  expectedCharacterId?: string | null;
  verifiedUserId: string;
}

export interface WritingAttemptDto {
  attemptId: string;
  sessionId: string;
  characterId: string;
  operationKey: string;
  score: number;
  band: string;
  passed: boolean;
  strokeCount: number;
  details: {
    strokeCount: {
      expected: number;
      actual: number;
      diff: number;
    };
    strokeFeedback: Array<{
      strokeIndex: number;
      score: number;
      directionInverted: boolean;
    }>;
  };
  createdAt: string;
  isReplay?: boolean;
}

export interface CompleteWritingSessionDto {
  sessionId: string;
  learnerId: string;
  status: string;
  completedAt: string;
  rowVersion: string;
}

export function computeInputFingerprint(strokes: CandidateStrokeInput[]): string {
  return createHash('sha256').update(JSON.stringify(strokes.map((stroke) => stroke.points))).digest('hex');
}

function fail(status: number, code: string, message: string): never {
  throw new LessonServiceError(status, code, message);
}

function transaction<T>(db: any, operation: (tx: any) => Promise<T>): Promise<T> {
  return typeof db.$transaction === 'function' ? db.$transaction(operation) : operation(db);
}

function isUniqueConflict(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2002');
}

function sessionDto(session: any, character: any, isReplay: boolean): WritingSessionDto {
  return {
    sessionId: session.id,
    learnerId: session.learnerId,
    contextId: session.contextId,
    lessonId: session.lessonId,
    lessonRevisionId: session.lessonRevisionId,
    practiceKind: session.practiceKind,
    characterId: session.characterId,
    glyph: character.glyph,
    strokeCount: character.strokeCount,
    strokeVersion: session.strokeVersion,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    rowVersion: session.rowVersion.toString(),
    isReplay,
  };
}

async function lockActiveRevision(tx: any, lessonId: string, revisionId: string): Promise<void> {
  if (typeof tx.$queryRaw !== 'function') return;
  const rows = await tx.$queryRaw`
    SELECT id
    FROM app.lessons
    WHERE id = ${lessonId}::uuid
      AND active_revision_id = ${revisionId}::uuid
      AND availability = 'AVAILABLE'
    FOR SHARE
  `;
  if (!Array.isArray(rows) || rows.length !== 1) {
    fail(409, 'REVISION_STALE', 'Phiên bản bài học đã bị thay đổi. Vui lòng tải lại trang.');
  }
}

async function lockActiveLearner(tx: any, learnerId: string): Promise<void> {
  if (typeof tx.$queryRaw === 'function') {
    const rows = await tx.$queryRaw`
      SELECT id::text FROM app.accounts
      WHERE id = ${learnerId}::uuid
      FOR NO KEY UPDATE
    `;
    if (!Array.isArray(rows) || rows.length !== 1) {
      fail(403, 'ACCOUNT_INACTIVE', 'Tài khoản học viên không hoạt động.');
    }
  }

  const account = await tx.account.findUnique({
    where: { id: learnerId },
    select: { id: true, role: true, status: true },
  });
  if (!account || account.role !== 'LEARNER' || account.status !== 'ACTIVE') {
    fail(403, 'ACCOUNT_INACTIVE', 'Tài khoản học viên không hoạt động.');
  }
}

async function lockLearningParents(
  tx: any,
  contextId: string,
  lessonId: string,
  learnerId: string
): Promise<void> {
  if (typeof tx.$queryRaw !== 'function') return;
  const candidate = await tx.learningContext.findFirst({
    where: { id: contextId, learnerId },
    select: { id: true, courseId: true },
  });
  if (!candidate) fail(404, 'NOT_FOUND', 'Lộ trình học không tồn tại.');

  await tx.$queryRaw`SELECT id::text FROM app.courses WHERE id = ${candidate.courseId}::uuid FOR SHARE`;
  await tx.$queryRaw`SELECT id::text FROM app.learning_contexts WHERE id = ${contextId}::uuid FOR SHARE`;
  await tx.$queryRaw`SELECT id::text FROM app.lessons WHERE id = ${lessonId}::uuid FOR SHARE`;
}

async function lockAndReadWritingSession(tx: any, sessionId: string, learnerId: string): Promise<any> {
  if (typeof tx.$queryRaw === 'function') {
    const rows = await tx.$queryRaw`
      SELECT id::text FROM app.writing_sessions
      WHERE id = ${sessionId}::uuid AND learner_id = ${learnerId}::uuid
      FOR UPDATE
    `;
    if (!Array.isArray(rows) || rows.length !== 1) {
      fail(404, 'NOT_FOUND', 'Phiên luyện viết không tồn tại.');
    }
  }
  const session = await tx.writingSession.findFirst({
    where: { id: sessionId, learnerId },
  });
  if (!session) fail(404, 'NOT_FOUND', 'Phiên luyện viết không tồn tại.');
  return session;
}

async function validateWritingSessionSource(tx: any, session: any, lesson: any): Promise<void> {
  if (typeof session.sourceKey !== 'string') return;

  if (session.sourceKey.startsWith('block:')) {
    const blockKey = session.sourceKey.slice('block:'.length);
    const block = (lesson.activeRevision.blocks || []).find((entry: any) => entry.blockKey === blockKey);
    const content = block?.content || block;
    const snapshot = content?.snapshot || content;
    if (
      !block || block.type !== 'CHARACTER' ||
      String(content.characterId || '').toLowerCase() !== session.characterId.toLowerCase() ||
      !content.guidedWriting ||
      snapshot.strokeVersion !== session.strokeVersion
    ) {
      fail(409, 'CONTENT_INCONSISTENT', 'Nguồn của phiên luyện viết không còn hợp lệ.');
    }
    return;
  }

  if (session.sourceKey.startsWith('vocabulary:')) {
    const linkId = session.sourceKey.slice('vocabulary:'.length);
    const link = await tx.lessonVocabularyLink.findFirst({
      where: { id: linkId, lessonRevisionId: session.lessonRevisionId },
    });
    const pinned = (link?.displaySnapshot as any)?.characters;
    const matched = Array.isArray(pinned) && pinned.find((character: any) =>
      String(character?.characterId || '').toLowerCase() === session.characterId.toLowerCase()
    );
    if (!matched || matched.strokeVersion !== session.strokeVersion) {
      fail(409, 'CONTENT_INCONSISTENT', 'Nguồn của phiên luyện viết không còn hợp lệ.');
    }
    return;
  }

  fail(409, 'CONTENT_INCONSISTENT', 'Nguồn của phiên luyện viết không còn hợp lệ.');
}

/**
 * Starts a new writing practice session or replays an existing one by operationKey.
 *
 * Implements S6-06a:
 * - Scoped by learning context, authorized published lesson, and active revision.
 * - Requires exactly one selector: `blockKey` (S6-04b4) or `lessonVocabularyLinkId` (S6-04b5).
 * - Enforces character ID matches the selector target.
 * - Pins character stroke version from revision / stroke data.
 * - Checks stale revision with `expectedPublishedRevisionId`.
 * - Replays identical session if `operationKey` matches, rejects with 409 on conflict.
 */
export async function startWritingSession(
  input: StartWritingSessionInput
): Promise<WritingSessionDto> {
  const {
    contextId,
    lessonId,
    characterId,
    blockKey,
    lessonVocabularyLinkId,
    expectedPublishedRevisionId,
    operationKey,
    verifiedUserId,
  } = input;

  // 1. Validate UUIDs
  if (!isValidUuid(contextId)) {
    fail(400, 'VALIDATION_ERROR', 'contextId phải là UUID hợp lệ.');
  }
  if (!isValidUuid(lessonId)) {
    fail(400, 'VALIDATION_ERROR', 'lessonId phải là UUID hợp lệ.');
  }
  if (characterId && !isValidUuid(characterId)) {
    fail(400, 'VALIDATION_ERROR', 'characterId phải là UUID hợp lệ.');
  }
  if (operationKey && !isValidUuid(operationKey)) {
    fail(400, 'VALIDATION_ERROR', 'operationKey phải là UUID hợp lệ.');
  }

  const cleanContextId = contextId.toLowerCase();
  const cleanLessonId = lessonId.toLowerCase();
  const cleanOpKey = operationKey ? operationKey.toLowerCase() : null;

  // 2. Validate selectors: exactly one required
  const hasBlockKey = typeof blockKey === 'string' && blockKey.trim().length > 0;
  const hasVocabLink =
    typeof lessonVocabularyLinkId === 'string' && lessonVocabularyLinkId.trim().length > 0;

  if (hasBlockKey && hasVocabLink) {
    fail(
      400,
      'VALIDATION_ERROR',
      'Không thể cung cấp đồng thời cả hai selector: blockKey và lessonVocabularyLinkId.'
    );
  }
  if (!hasBlockKey && !hasVocabLink) {
    fail(
      400,
      'VALIDATION_ERROR',
      'Cần cung cấp đúng một trong hai selector: blockKey hoặc lessonVocabularyLinkId.'
    );
  }

  const db = getLearnerPrisma();

  const sourceKey = hasBlockKey
    ? `block:${blockKey!.trim()}`
    : `vocabulary:${lessonVocabularyLinkId!.trim().toLowerCase()}`;

  // 3. Authenticate context ownership and lesson authorization before replay.
  const context = await ownedContext(db, cleanContextId, verifiedUserId);
  const lesson = await authorizedLesson(db, context, cleanLessonId);
  const activeRev = lesson.activeRevision;

  if (!activeRev) {
    fail(404, 'NOT_FOUND', 'Bài học chưa có bản sửa đổi xuất bản.');
  }

  // 5. Stale revision check
  if (
    expectedPublishedRevisionId &&
    expectedPublishedRevisionId.toLowerCase() !== activeRev.id.toLowerCase()
  ) {
    fail(409, 'REVISION_STALE', 'Phiên bản bài học đã bị thay đổi. Vui lòng tải lại trang.');
  }

  if (cleanOpKey) {
    const existing = await db.writingSession.findFirst({
      where: { learnerId: verifiedUserId, operationKey: cleanOpKey },
    });
    if (existing && (
      existing.contextId.toLowerCase() !== cleanContextId ||
      (existing.lessonId ?? "").toLowerCase() !== cleanLessonId ||
      (existing.lessonRevisionId ?? "").toLowerCase() !== activeRev.id.toLowerCase() ||
      existing.sourceKey !== sourceKey ||
      (characterId && existing.characterId.toLowerCase() !== characterId.toLowerCase())
    )) {
      fail(409, 'OPERATION_CONFLICT', 'Khóa thao tác trùng nhưng dữ liệu phiên viết khác nhau.');
    }
  }

  let cleanCharId = characterId?.toLowerCase() || null;
  let pinnedStrokeVersion: number | null = null;
  let pinnedCharacter: any = null;

  // 6. Selector branch A: blockKey
  if (hasBlockKey) {
    const rawBlocks = (activeRev.blocks || []) as any[];
    const targetBlock: any = rawBlocks.find((b: any) => b.blockKey === blockKey.trim());

    if (!targetBlock) {
      fail(404, 'NOT_FOUND', 'Khối nội dung không tồn tại trong bài học.');
    }
    if (targetBlock.type !== 'CHARACTER') {
      fail(404, 'NOT_FOUND', 'Khối nội dung không phải là khối ký tự.');
    }

    const content: any = targetBlock.content || targetBlock;
    const blockCharId = String(content.characterId || targetBlock.characterId || '').toLowerCase();

    if (!isValidUuid(blockCharId)) {
      fail(409, 'CONTENT_INCONSISTENT', 'Khối ký tự không có mã ký tự hợp lệ.');
    }
    if (cleanCharId && blockCharId !== cleanCharId) {
      fail(404, 'NOT_FOUND', 'Ký tự không khớp với khối nội dung được chọn.');
    }
    cleanCharId = blockCharId;

    const guidedWriting = Boolean(content.guidedWriting ?? targetBlock.guidedWriting);

    if (!guidedWriting) {
      fail(
        409,
        'CONTENT_INCONSISTENT',
        'Khối ký tự này chưa được bật chế độ luyện viết.'
      );
    }

    pinnedCharacter = content.snapshot || content;
    pinnedStrokeVersion = pinnedCharacter.strokeVersion ?? content.strokeVersion ?? null;
  }

  // 7. Selector branch B: lessonVocabularyLinkId
  if (hasVocabLink) {
    if (!cleanCharId) {
      fail(400, 'VALIDATION_ERROR', 'characterId là bắt buộc khi chọn liên kết từ vựng.');
    }
    const cleanVocabLinkId = lessonVocabularyLinkId!.trim().toLowerCase();
    let vocabLink: any = null;
    try {
      vocabLink = await db.lessonVocabularyLink.findFirst({
        where: {
          id: cleanVocabLinkId,
          lessonRevisionId: activeRev.id,
        },
      });
    } catch {
      vocabLink = null;
    }

    if (!vocabLink) {
      fail(404, 'NOT_FOUND', 'Liên kết từ vựng không tồn tại trong bài học.');
    }

    const snap = (vocabLink.displaySnapshot || {}) as any;
    const pinnedCharacters = Array.isArray(snap.characters) ? snap.characters : [];

    const matched = pinnedCharacters.find(
      (c: any) => String(c?.characterId || '').toLowerCase() === cleanCharId
    );

    if (!matched) {
      fail(404, 'NOT_FOUND', 'Ký tự không thuộc liên kết từ vựng này.');
    }

    pinnedCharacter = matched;
    pinnedStrokeVersion = matched.strokeVersion;
  }

  if (!cleanCharId) {
    fail(400, 'VALIDATION_ERROR', 'Không xác định được ký tự cần luyện viết.');
  }

  if (!Number.isInteger(pinnedStrokeVersion) || Number(pinnedStrokeVersion) < 1) {
    fail(409, 'CONTENT_INCONSISTENT', 'Phiên bản dữ liệu nét của ký tự không khả dụng.');
  }

  const strokeVersion = Number(pinnedStrokeVersion);
  return transaction(db, async (tx) => {
    await lockActiveLearner(tx, verifiedUserId);
    await lockLearningParents(tx, cleanContextId, cleanLessonId, verifiedUserId);
    const currentContext = await ownedContext(tx, cleanContextId, verifiedUserId);
    const currentLesson = await authorizedLesson(tx, currentContext, cleanLessonId);
    if (currentLesson.activeRevision.id.toLowerCase() !== activeRev.id.toLowerCase()) {
      fail(409, 'REVISION_STALE', 'Phiên bản bài học đã bị thay đổi. Vui lòng tải lại trang.');
    }
    await lockActiveRevision(tx, cleanLessonId, activeRev.id);

    const character = await tx.writingCharacter.findFirst({
      where: { id: cleanCharId, languageId: currentContext.course.languageId },
    });
    if (!character) fail(404, 'NOT_FOUND', 'Ký tự không tồn tại trong danh mục của khóa học này.');

    const strokeData = await tx.characterStrokeData.findFirst({
      where: {
        characterId: cleanCharId,
        character: { languageId: currentContext.course.languageId },
        version: strokeVersion,
      },
    });
    if (!strokeData || !Array.isArray(strokeData.strokes) || strokeData.strokes.length === 0) {
      fail(409, 'CONTENT_INCONSISTENT', 'Ký tự chưa có dữ liệu nét khả dụng.');
    }

    const responseCharacter = {
      glyph: typeof pinnedCharacter.glyph === 'string' ? pinnedCharacter.glyph : character.glyph,
      strokeCount: Number.isInteger(pinnedCharacter.strokeCount)
        ? pinnedCharacter.strokeCount
        : character.strokeCount,
    };

    if (cleanOpKey) {
      const existing = await tx.writingSession.findFirst({
        where: { learnerId: verifiedUserId, operationKey: cleanOpKey },
      });
      if (existing) {
        const samePayload =
          existing.contextId.toLowerCase() === cleanContextId &&
          existing.lessonId.toLowerCase() === cleanLessonId &&
          existing.lessonRevisionId.toLowerCase() === activeRev.id.toLowerCase() &&
          existing.characterId.toLowerCase() === cleanCharId &&
          existing.strokeVersion === strokeVersion &&
          existing.sourceKey === sourceKey;
        if (!samePayload) {
          fail(409, 'OPERATION_CONFLICT', 'Khóa thao tác trùng nhưng dữ liệu phiên viết khác nhau.');
        }
        return sessionDto(existing, responseCharacter, true);
      }
    }

    const session = await tx.writingSession.create({
      data: {
        learnerId: verifiedUserId,
        contextId: cleanContextId,
        lessonId: cleanLessonId,
        lessonRevisionId: activeRev.id,
        characterId: cleanCharId,
        strokeVersion,
        graderVersion: CURRENT_WRITING_GRADER_VERSION,
        sourceKey,
        status: 'ACTIVE',
        operationKey: cleanOpKey,
        startedAt: new Date(),
        rowVersion: 1n,
      },
    });

    return sessionDto(session, responseCharacter, false);
  }).catch((error) => {
    if (cleanOpKey && isUniqueConflict(error)) return startWritingSession(input);
    throw error;
  });
}

/**
 * Submits a writing attempt for grading and receipt generation.
 *
 * Implements S6-06b:
 * - Pure server-side deterministic grading via gradeStrokeAttempt.
 * - Input validation & limits (max 128 strokes, max 500 points/stroke, finite coordinates).
 * - Generates normalized input fingerprint for idempotency without logging raw points.
 * - Idempotent replay: retrying with same operationKey returns stored receipt.
 * - Rejects attempt on completed session with 409 SESSION_COMPLETED.
 */
export async function submitWritingAttempt(
  input: SubmitWritingAttemptInput
): Promise<WritingAttemptDto> {
  const { sessionId, operationKey, candidateStrokes, expectedCharacterId, verifiedUserId } = input;

  if (!isValidUuid(sessionId) || !isValidUuid(operationKey)) {
    fail(400, 'VALIDATION_ERROR', 'sessionId và operationKey phải là UUID hợp lệ.');
  }
  if (expectedCharacterId && !isValidUuid(expectedCharacterId)) {
    fail(400, 'VALIDATION_ERROR', 'characterId phải là UUID hợp lệ.');
  }
  if (!Array.isArray(candidateStrokes) || candidateStrokes.length === 0) {
    fail(400, 'VALIDATION_ERROR', 'Cần ít nhất một nét vẽ trong bài làm.');
  }
  if (candidateStrokes.length > 128) {
    fail(400, 'VALIDATION_ERROR', 'Số lượng nét vẽ vượt quá giới hạn tối đa cho phép (128).');
  }

  let totalPoints = 0;
  for (let i = 0; i < candidateStrokes.length; i++) {
    const stroke = candidateStrokes[i];
    if (!stroke || !Array.isArray(stroke.points) || stroke.points.length < 2) {
      fail(400, 'VALIDATION_ERROR', `Nét thứ ${i + 1} phải chứa ít nhất 2 điểm tọa độ.`);
    }
    if (stroke.points.length > 256) {
      fail(400, 'VALIDATION_ERROR', `Nét thứ ${i + 1} vượt quá số điểm tối đa (256).`);
    }
    totalPoints += stroke.points.length;
    if (totalPoints > 4096) {
      fail(400, 'VALIDATION_ERROR', 'Tổng số điểm vượt quá giới hạn 4096.');
    }
    for (const point of stroke.points) {
      if (
        !Array.isArray(point) || point.length !== 2 ||
        typeof point[0] !== 'number' || typeof point[1] !== 'number' ||
        !Number.isFinite(point[0]) || !Number.isFinite(point[1]) ||
        point[0] < 0 || point[0] > 1 || point[1] < 0 || point[1] > 1
      ) {
        fail(400, 'VALIDATION_ERROR', `Tọa độ điểm không hợp lệ trong nét thứ ${i + 1}.`);
      }
    }
  }

  const cleanSessionId = sessionId.toLowerCase();
  const cleanOpKey = operationKey.toLowerCase();
  const inputFingerprint = computeInputFingerprint(candidateStrokes);
  const db = getLearnerPrisma();

  try {
    return await transaction(db, async (tx) => {
      await lockActiveLearner(tx, verifiedUserId);
      const candidateSession = await tx.writingSession.findFirst({
        where: { id: cleanSessionId, learnerId: verifiedUserId },
      });
      if (!candidateSession) fail(404, 'NOT_FOUND', 'Phiên luyện viết không tồn tại.');

      // Free practice ("Luyện viết") sessions are not tied to a lesson: only the owned context is checked.
      const isFree = candidateSession.practiceKind === 'FREE';
      if (!isFree) {
        await lockLearningParents(
          tx,
          candidateSession.contextId,
          candidateSession.lessonId,
          verifiedUserId
        );
      }
      const session = await lockAndReadWritingSession(tx, cleanSessionId, verifiedUserId);
      if (
        session.contextId !== candidateSession.contextId ||
        session.lessonId !== candidateSession.lessonId
      ) {
        fail(409, 'SESSION_CONFLICT', 'Nguồn của phiên luyện viết đã thay đổi.');
      }
      if (expectedCharacterId && session.characterId.toLowerCase() !== expectedCharacterId.toLowerCase()) {
        fail(409, 'CHARACTER_MISMATCH', 'Ký tự trên route không khớp với phiên luyện viết.');
      }
      if ((session.graderVersion ?? CURRENT_WRITING_GRADER_VERSION) !== CURRENT_WRITING_GRADER_VERSION) {
        fail(409, 'GRADER_VERSION_UNSUPPORTED', 'Phiên luyện viết đang dùng bộ chấm điểm không còn được hỗ trợ.');
      }

      const context = await ownedContext(tx, session.contextId, verifiedUserId);
      if (!isFree) {
        const lesson = await authorizedLesson(tx, context, session.lessonId);
        if (lesson.activeRevision.id.toLowerCase() !== session.lessonRevisionId.toLowerCase()) {
          fail(409, 'REVISION_STALE', 'Bài học đã được xuất bản phiên bản mới.');
        }
        await lockActiveRevision(tx, session.lessonId, session.lessonRevisionId);
        await validateWritingSessionSource(tx, session, lesson);
      }

      const existingAttempt = await tx.writingAttempt.findFirst({
        where: { learnerId: verifiedUserId, operationKey: cleanOpKey },
      });
      if (existingAttempt) {
        if (
          existingAttempt.sessionId.toLowerCase() !== cleanSessionId ||
          existingAttempt.characterId.toLowerCase() !== session.characterId.toLowerCase() ||
          existingAttempt.inputFingerprint !== inputFingerprint
        ) {
          fail(409, 'OPERATION_CONFLICT', 'Khóa thao tác trùng nhưng dữ liệu nét vẽ khác nhau.');
        }
        const snapDetails = (existingAttempt.details || {}) as any;
        return {
          attemptId: existingAttempt.id,
          sessionId: existingAttempt.sessionId,
          characterId: existingAttempt.characterId,
          operationKey: existingAttempt.operationKey,
          score: existingAttempt.score,
          band: existingAttempt.band,
          passed: existingAttempt.receipt?.passed ?? existingAttempt.band === 'EXCELLENT',
          strokeCount: existingAttempt.strokeCount,
          details: {
            strokeCount: snapDetails.strokeCount ?? {
              expected: existingAttempt.strokeCount,
              actual: existingAttempt.strokeCount,
              diff: 0,
            },
            strokeFeedback: Array.isArray(snapDetails.strokeFeedback)
              ? snapDetails.strokeFeedback
              : [],
          },
          createdAt: existingAttempt.createdAt.toISOString(),
          isReplay: true,
        };
      }

      if (session.status !== 'ACTIVE') {
        fail(409, 'SESSION_COMPLETED', 'Phiên luyện viết đã kết thúc. Không thể gửi thêm bài làm.');
      }

      const strokeData = await tx.characterStrokeData.findFirst({
        where: {
          characterId: session.characterId,
          character: { languageId: context.course.languageId },
          version: session.strokeVersion,
        },
      });
      if (!strokeData || !Array.isArray(strokeData.strokes) || strokeData.strokes.length === 0) {
        fail(409, 'CONTENT_INCONSISTENT', 'Dữ liệu nét của ký tự không khả dụng.');
      }

      const gradeResult = gradeStrokeAttempt({
        candidateStrokes,
        templateStrokes: strokeData.strokes as any,
      });
      if (gradeResult.details.strokeScores.length === 0) {
        fail(400, 'INVALID_STROKE_GEOMETRY', 'Nét vẽ không tạo thành đường đi hợp lệ.');
      }
      const details = {
        strokeCount: gradeResult.details.strokeCount,
        strokeFeedback: gradeResult.details.strokeScores.map((stroke) => ({
          strokeIndex: stroke.strokeIndex,
          score: stroke.score,
          directionInverted: stroke.isDirectionInverted,
        })),
      };
      const receipt = {
        score: gradeResult.score,
        band: gradeResult.band,
        passed: gradeResult.passed,
        details,
      };

      const increment = await tx.writingSession.updateMany({
        where: {
          id: session.id,
          learnerId: verifiedUserId,
          status: 'ACTIVE',
          rowVersion: session.rowVersion,
        },
        data: { rowVersion: { increment: 1 } },
      });
      if (increment.count !== 1) {
        fail(409, 'SESSION_CONFLICT', 'Phiên luyện viết đã được cập nhật ở nơi khác.');
      }

      const attempt = await tx.writingAttempt.create({
        data: {
          sessionId: session.id,
          learnerId: verifiedUserId,
          characterId: session.characterId,
          operationKey: cleanOpKey,
          inputFingerprint,
          score: gradeResult.score,
          band: gradeResult.band,
          strokeCount: candidateStrokes.length,
          details,
          receipt,
        },
      });

      return {
        attemptId: attempt.id,
        sessionId: session.id,
        characterId: session.characterId,
        operationKey: cleanOpKey,
        score: gradeResult.score,
        band: gradeResult.band,
        passed: gradeResult.passed,
        strokeCount: candidateStrokes.length,
        details,
        createdAt: attempt.createdAt.toISOString(),
        isReplay: false,
      };
    });
  } catch (error) {
    if (isUniqueConflict(error)) return submitWritingAttempt(input);
    throw error;
  }
}

/**
 * Completes and finalizes an active writing practice session.
 *
 * Implements S6-06b:
 * - Transitions status to COMPLETED and stamps completedAt.
 * - Idempotent: repeated calls on completed session return 200 OK.
 */
export async function completeWritingSession(
  sessionId: string,
  verifiedUserId: string
): Promise<CompleteWritingSessionDto> {
  if (!isValidUuid(sessionId)) {
    fail(400, 'VALIDATION_ERROR', 'sessionId phải là UUID hợp lệ.');
  }

  const cleanSessionId = sessionId.toLowerCase();
  const db = getLearnerPrisma();
  return transaction(db, async (tx) => {
    await lockActiveLearner(tx, verifiedUserId);
    const candidateSession = await tx.writingSession.findFirst({
      where: { id: cleanSessionId, learnerId: verifiedUserId },
    });
    if (!candidateSession) fail(404, 'NOT_FOUND', 'Phiên luyện viết không tồn tại.');

    const isFree = candidateSession.practiceKind === 'FREE';
    if (!isFree) {
      await lockLearningParents(
        tx,
        candidateSession.contextId,
        candidateSession.lessonId,
        verifiedUserId
      );
    }
    const session = await lockAndReadWritingSession(tx, cleanSessionId, verifiedUserId);

    const context = await ownedContext(tx, session.contextId, verifiedUserId);
    if (!isFree) {
      const lesson = await authorizedLesson(tx, context, session.lessonId);
      if (lesson.activeRevision.id.toLowerCase() !== session.lessonRevisionId.toLowerCase()) {
        fail(409, 'REVISION_STALE', 'Bài học đã được xuất bản phiên bản mới.');
      }
      await lockActiveRevision(tx, session.lessonId, session.lessonRevisionId);
      await validateWritingSessionSource(tx, session, lesson);
    }

    if (session.status === 'COMPLETED') {
      return {
        sessionId: session.id,
        learnerId: session.learnerId,
        status: session.status,
        completedAt: session.completedAt ? session.completedAt.toISOString() : new Date().toISOString(),
        rowVersion: session.rowVersion.toString(),
      };
    }
    if (session.status !== 'ACTIVE') {
      fail(409, 'SESSION_COMPLETED', 'Phiên luyện viết đã kết thúc.');
    }

    const attempts = await tx.writingAttempt.count({
      where: { sessionId: session.id, learnerId: verifiedUserId },
    });
    if (attempts < 1) {
      fail(409, 'NO_ATTEMPTS', 'Cần nộp ít nhất một bài làm trước khi kết thúc phiên viết.');
    }

    const now = new Date();
    const updated = await tx.writingSession.updateMany({
      where: {
        id: session.id,
        learnerId: verifiedUserId,
        status: 'ACTIVE',
        rowVersion: session.rowVersion,
      },
      data: {
        status: 'COMPLETED',
        completedAt: now,
        rowVersion: { increment: 1 },
      },
    });
    if (updated.count !== 1) {
      const latest = await tx.writingSession.findFirst({
        where: { id: session.id, learnerId: verifiedUserId },
      });
      if (latest?.status === 'COMPLETED') {
        return {
          sessionId: latest.id,
          learnerId: latest.learnerId,
          status: latest.status,
          completedAt: latest.completedAt?.toISOString() || now.toISOString(),
          rowVersion: latest.rowVersion.toString(),
        };
      }
      fail(409, 'SESSION_CONFLICT', 'Phiên luyện viết đã được cập nhật ở nơi khác.');
    }

    const completed = await tx.writingSession.findFirst({
      where: { id: session.id, learnerId: verifiedUserId },
    });
    return {
      sessionId: completed.id,
      learnerId: completed.learnerId,
      status: completed.status,
      completedAt: completed.completedAt?.toISOString() || now.toISOString(),
      rowVersion: completed.rowVersion.toString(),
    };
  });
}
