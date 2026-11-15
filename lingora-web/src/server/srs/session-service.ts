import 'server-only';
import crypto from 'node:crypto';
import type { Prisma, PrismaClient, SrsReviewSession } from '../../../../lingora-admin/generated/product-client/index.js';
import { getLearnerPrisma } from '../db/index.ts';
import { SrsServiceError } from './dto.ts';
import { calculatePolicyBSchedule } from './scheduler.ts';
import { evaluateAndAwardSrsGamification } from '../gamification/service.ts';
import { getDbTime } from './service.ts';
import { z } from 'zod';

type Db = PrismaClient | Prisma.TransactionClient;

export const createSessionSchema = z
  .object({
    limit: z.number().int().min(1).max(50).optional().default(20),
    contextId: z.string().uuid('Mã lộ trình phải là UUID hợp lệ.').optional(),
  })
  .strict();
export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const revealSessionItemSchema = z
  .object({
    cardId: z.string().uuid('Mã thẻ ôn tập phải là UUID hợp lệ.'),
  })
  .strict();
export type RevealSessionItemInput = z.infer<typeof revealSessionItemSchema>;

export const reviewSessionItemSchema = z
  .object({
    operationKey: z.string().uuid('Mã thao tác phải là UUID hợp lệ.'),
    rating: z.enum(['REMEMBERED', 'FORGOTTEN']),
    cardId: z.string().uuid('Mã thẻ ôn tập phải là UUID hợp lệ.'),
  })
  .strict();
export type ReviewSessionItemInput = z.infer<typeof reviewSessionItemSchema>;

export interface SrsSessionProgressDto {
  currentIndex: number;
  completedCount: number;
  total: number;
}

export interface SrsFrontPromptCardDto {
  cardId: string;
  canonicalForm: string;
}

export interface SrsRevealedCardDto {
  cardId: string;
  meaningLabels: Record<string, string>;
  phonetic: string | null;
  partOfSpeech: string | null;
  example: string | null;
}

export interface SrsSessionDto {
  sessionId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  progress: SrsSessionProgressDto;
  currentItem: SrsFrontPromptCardDto | null;
  expiresAt: string;
  completedAt?: string | null;
}

export interface SrsSessionReviewResultDto {
  sessionId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  progress: SrsSessionProgressDto;
  currentItem: SrsFrontPromptCardDto | null;
  recordedRating: 'REMEMBERED' | 'FORGOTTEN';
}

export interface SrsSessionCompleteResultDto {
  sessionId: string;
  status: 'COMPLETED';
  progress: SrsSessionProgressDto;
  completedAt: string;
}

export interface SubmitSessionReviewOptions {
  _injectFaultBeforeSessionCommit?: boolean;
}

function toFrontPromptCardDto(card: { id: string; vocabulary: { canonicalForm: string } }): SrsFrontPromptCardDto {
  return { cardId: card.id, canonicalForm: card.vocabulary.canonicalForm };
}

const frontCardSelect = {
  id: true,
  vocabulary: { select: { canonicalForm: true } },
} as const;

function computeQualifyingLocalDate(now: Date, timezone: string): Date {
  if (!timezone || typeof timezone !== 'string') {
    throw new SrsServiceError(503, 'SERVICE_UNAVAILABLE', 'Múi giờ tài khoản không hợp lệ.');
  }
  try {
    const localDateString = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    return new Date(`${localDateString}T00:00:00.000Z`);
  } catch {
    throw new SrsServiceError(503, 'SERVICE_UNAVAILABLE', `Múi giờ '${timezone}' không hợp lệ hoặc không được hỗ trợ.`);
  }
}

export function computeSessionInputHash(input: {
  sessionId: string;
  cardId: string;
  rating: string;
}): string {
  const canonical = JSON.stringify({
    sessionId: input.sessionId,
    cardId: input.cardId,
    rating: input.rating,
  });
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export async function createReviewSession(
  verifiedUserId: string,
  rawInput: unknown,
  prismaOverride?: Db
): Promise<SrsSessionDto> {
  const parsed = createSessionSchema.safeParse(rawInput ?? {});
  if (!parsed.success) {
    throw new SrsServiceError(400, 'VALIDATION_ERROR', 'Dữ liệu khởi tạo phiên học không hợp lệ.');
  }
  const input = parsed.data;
  const db = (prismaOverride ?? getLearnerPrisma()) as PrismaClient;

  // 1. Verify active learner
  const account = await db.account.findUnique({
    where: { id: verifiedUserId },
    select: { id: true, role: true, status: true },
  });
  if (!account || account.role !== 'LEARNER' || account.status !== 'ACTIVE') {
    throw new SrsServiceError(403, 'ACCOUNT_INACTIVE', 'Tài khoản học viên không hoạt động.');
  }

  // 2. If contextId provided, verify ownership and get course
  let contextFilter: Prisma.SrsCardWhereInput | undefined;
  if (input.contextId) {
    const context = await db.learningContext.findFirst({
      where: { id: input.contextId, learnerId: verifiedUserId },
      select: { id: true, courseId: true, learnerId: true },
    });
    if (!context) {
      const anyContext = await db.learningContext.findUnique({
        where: { id: input.contextId },
        select: { id: true, learnerId: true },
      });
      if (anyContext && anyContext.learnerId !== verifiedUserId) {
        throw new SrsServiceError(403, 'FORBIDDEN', 'Bạn không có quyền truy cập lộ trình học này.');
      }
      throw new SrsServiceError(404, 'NOT_FOUND', 'Lộ trình học không tồn tại.');
    }
    contextFilter = {
      OR: [
        { sourceAttempt: { contextId: context.id } },
        { sourceLessonVocabulary: { lessonRevision: { lesson: { unit: { courseId: context.courseId } } } } },
      ],
    };
  }

  // 3. Query DB clock
  const dbNow = await getDbTime(db);

  // 4. Query due cards in deterministic order
  const dueCards = await db.srsCard.findMany({
    where: {
      learnerId: verifiedUserId,
      dueAt: { lte: dbNow },
      ...(contextFilter ? contextFilter : {}),
    },
    orderBy: [
      { dueAt: 'asc' },
      { id: 'asc' },
    ],
    take: input.limit,
    select: frontCardSelect,
  });

  const cardIds = dueCards.map((c) => c.id);
  const expiresAt = new Date(dbNow.getTime() + 15 * 60 * 1000); // 15 minutes

  if (cardIds.length === 0) {
    const session = await db.srsReviewSession.create({
      data: {
        learnerId: verifiedUserId,
        contextId: input.contextId || null,
        status: 'COMPLETED',
        sessionLimit: input.limit,
        cardIds: [],
        currentIndex: 0,
        completedCount: 0,
        expiresAt,
        completedAt: dbNow,
      },
    });

    return {
      sessionId: session.id,
      status: 'COMPLETED',
      progress: {
        currentIndex: 0,
        completedCount: 0,
        total: 0,
      },
      currentItem: null,
      expiresAt: expiresAt.toISOString(),
      completedAt: dbNow.toISOString(),
    };
  }

  const session = await db.srsReviewSession.create({
    data: {
      learnerId: verifiedUserId,
      contextId: input.contextId || null,
      status: 'ACTIVE',
      sessionLimit: input.limit,
      cardIds,
      currentIndex: 0,
      completedCount: 0,
      expiresAt,
    },
  });

  return {
    sessionId: session.id,
    status: 'ACTIVE',
    progress: {
      currentIndex: 0,
      completedCount: 0,
      total: cardIds.length,
    },
    currentItem: toFrontPromptCardDto(dueCards[0]),
    expiresAt: expiresAt.toISOString(),
  };
}

function sessionExpiredError() {
  return new SrsServiceError(409, 'SESSION_EXPIRED', 'Phiên ôn tập đã hết hạn.');
}

function sessionCompletedError() {
  return new SrsServiceError(409, 'SESSION_COMPLETED', 'Phiên ôn tập đã kết thúc.');
}

function staleCardError() {
  return new SrsServiceError(409, 'STALE_OPERATION', 'Thẻ ôn tập không còn là thẻ hiện tại của phiên.');
}

async function withLockedSession<T>(
  db: PrismaClient,
  learnerId: string,
  sessionId: string,
  work: (tx: Prisma.TransactionClient, session: SrsReviewSession, timezone: string) => Promise<T | SrsServiceError>,
): Promise<T> {
  const result = await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM app.accounts WHERE id = ${learnerId}::uuid FOR UPDATE`;
    const account = await tx.account.findUnique({
      where: { id: learnerId },
      select: { role: true, status: true, timezone: true },
    });
    if (!account || account.role !== 'LEARNER' || account.status !== 'ACTIVE') {
      throw new SrsServiceError(403, 'ACCOUNT_INACTIVE', 'Tài khoản học viên không hoạt động.');
    }

    await tx.$queryRaw`
      SELECT id FROM app.srs_review_sessions
      WHERE id = ${sessionId}::uuid AND learner_id = ${learnerId}::uuid FOR UPDATE
    `;
    const session = await tx.srsReviewSession.findUnique({ where: { id: sessionId, learnerId } });
    if (!session) {
      throw new SrsServiceError(404, 'SESSION_NOT_FOUND', 'Phiên ôn tập không tồn tại.');
    }
    return work(tx, session, account.timezone);
  });

  // Domain conflicts that change session state must commit before returning the error.
  if (result instanceof SrsServiceError) throw result;
  return result;
}

async function expireSession(tx: Prisma.TransactionClient, session: SrsReviewSession, now: Date) {
  if (session.status !== 'ACTIVE' || session.expiresAt > now) return session;
  return tx.srsReviewSession.update({
    where: { id: session.id },
    data: { status: 'EXPIRED', rowVersion: session.rowVersion + 1n },
  });
}

async function findNextDueCard(tx: Prisma.TransactionClient, session: SrsReviewSession, start: number, now: Date) {
  const ids = session.cardIds as string[];
  const remainingIds = ids.slice(start);
  if (remainingIds.length === 0) return { index: ids.length, item: null };

  const cards = await tx.srsCard.findMany({
    where: { id: { in: remainingIds }, learnerId: session.learnerId, dueAt: { lte: now } },
    select: frontCardSelect,
  });
  const byId = new Map(cards.map(card => [card.id, card]));
  const offset = remainingIds.findIndex(id => byId.has(id));
  if (offset === -1) return { index: ids.length, item: null };
  return {
    index: start + offset,
    item: toFrontPromptCardDto(byId.get(remainingIds[offset])!),
  };
}

function sessionProgress(session: SrsReviewSession): SrsSessionProgressDto {
  return {
    currentIndex: session.currentIndex,
    completedCount: session.completedCount,
    total: (session.cardIds as string[]).length,
  };
}

async function reconcileSession(tx: Prisma.TransactionClient, original: SrsReviewSession, now: Date): Promise<SrsSessionDto> {
  let session = await expireSession(tx, original, now);
  let currentItem: SrsFrontPromptCardDto | null = null;

  if (session.status === 'ACTIVE') {
    const next = await findNextDueCard(tx, session, session.currentIndex, now);
    currentItem = next.item;
    if (next.index !== session.currentIndex || !currentItem) {
      session = await tx.srsReviewSession.update({
        where: { id: session.id },
        data: {
          currentIndex: next.index,
          status: currentItem ? 'ACTIVE' : 'COMPLETED',
          completedAt: currentItem ? null : now,
          rowVersion: session.rowVersion + 1n,
        },
      });
    }
  }

  return {
    sessionId: session.id,
    status: session.status as SrsSessionDto['status'],
    progress: sessionProgress(session),
    currentItem,
    expiresAt: session.expiresAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
  };
}

export async function revealSessionCurrentItem(
  verifiedUserId: string,
  sessionId: string,
  rawInput: unknown,
  prismaOverride?: Db
): Promise<SrsRevealedCardDto> {
  const parsed = revealSessionItemSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new SrsServiceError(400, 'VALIDATION_ERROR', 'Dữ liệu lật thẻ không hợp lệ.');
  }

  const db = (prismaOverride ?? getLearnerPrisma()) as PrismaClient;
  return withLockedSession<SrsRevealedCardDto>(db, verifiedUserId, sessionId, async (tx, session) => {
    const state = await reconcileSession(tx, session, await getDbTime(tx));
    if (state.status === 'EXPIRED') return sessionExpiredError();
    if (state.status === 'COMPLETED') return sessionCompletedError();
    if (state.currentItem?.cardId !== parsed.data.cardId) return staleCardError();

    const card = await tx.srsCard.findUnique({
      where: { id: parsed.data.cardId, learnerId: verifiedUserId },
      include: {
        vocabulary: { select: { meaningLabels: true, phonetic: true, partOfSpeech: true, example: true } },
      },
    });
    if (!card) return staleCardError();

    const labels = card.vocabulary.meaningLabels;
    const meaningLabels = labels && typeof labels === 'object' && !Array.isArray(labels)
      ? Object.fromEntries(Object.entries(labels).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
      : {};
    const { phonetic, partOfSpeech, example } = card.vocabulary;
    return { cardId: card.id, meaningLabels, phonetic, partOfSpeech, example };
  });
}

export async function getReviewSession(
  verifiedUserId: string,
  sessionId: string,
  prismaOverride?: Db
): Promise<SrsSessionDto> {
  const db = (prismaOverride ?? getLearnerPrisma()) as PrismaClient;
  return withLockedSession(db, verifiedUserId, sessionId, async (tx, session) =>
    reconcileSession(tx, session, await getDbTime(tx)),
  );
}

export async function submitSessionReview(
  verifiedUserId: string,
  sessionId: string,
  rawInput: unknown,
  prismaOverride?: Db,
  options?: SubmitSessionReviewOptions
): Promise<SrsSessionReviewResultDto> {
  const parsed = reviewSessionItemSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new SrsServiceError(400, 'VALIDATION_ERROR', 'Dữ liệu đánh giá không hợp lệ. Vui lòng cung cấp đầy đủ cardId, rating và operationKey.');
  }
  const input = parsed.data;
  const inputHash = computeSessionInputHash({ sessionId, cardId: input.cardId, rating: input.rating });
  const db = (prismaOverride ?? getLearnerPrisma()) as PrismaClient;

  return withLockedSession<SrsSessionReviewResultDto>(db, verifiedUserId, sessionId, async (tx, session, timezone) => {
    const existing = await tx.srsReviewOperation.findUnique({
      where: { learnerId_operationKey: { learnerId: verifiedUserId, operationKey: input.operationKey } },
    });
    if (existing) {
      if (existing.inputHash !== inputHash) {
        return new SrsServiceError(409, 'OPERATION_CONFLICT', 'Mã thao tác đã được sử dụng với nội dung khác.');
      }
      // Older operations have no stored response. The browser can refresh the session.
      if (!existing.sessionResponse) return staleCardError();
      const { currentItem, ...response } = existing.sessionResponse as unknown as SrsSessionReviewResultDto;
      // Apply the current prompt projection to receipts from older builds.
      return {
        ...response,
        currentItem: currentItem ? { cardId: currentItem.cardId, canonicalForm: currentItem.canonicalForm } : null,
      };
    }

    if (session.status === 'EXPIRED') return sessionExpiredError();
    if (session.status === 'COMPLETED') return sessionCompletedError();

    const matchesCurrent = (session.cardIds as string[])[session.currentIndex] === input.cardId;
    if (matchesCurrent) {
      await tx.$queryRaw`
        SELECT id FROM app.srs_cards
        WHERE id = ${input.cardId}::uuid AND learner_id = ${verifiedUserId}::uuid FOR UPDATE
      `;
    }
    const dbNow = await getDbTime(tx);
    if (dbNow >= session.expiresAt) {
      await expireSession(tx, session, dbNow);
      return sessionExpiredError();
    }
    if (!matchesCurrent) return staleCardError();

    const card = await tx.srsCard.findUnique({ where: { id: input.cardId, learnerId: verifiedUserId } });
    if (!card || card.dueAt > dbNow) {
      const state = await reconcileSession(tx, session, dbNow);
      return state.status === 'COMPLETED' ? sessionCompletedError() : staleCardError();
    }

    const scheduleResult = calculatePolicyBSchedule({
      priorStage: card.stage,
      priorDueAt: card.dueAt,
      rating: input.rating,
      reviewedAt: dbNow,
    });
    const priorStage = card.stage;
    const priorDueAt = card.dueAt;
    const nextStage = scheduleResult.nextStage;
    const nextDueAt = scheduleResult.nextDueAt;

    const qualifyingLocalDate = computeQualifyingLocalDate(dbNow, timezone);
    await tx.srsCard.update({
      where: { id: card.id },
      data: {
        stage: nextStage,
        dueAt: nextDueAt,
        lastReviewedAt: dbNow,
        rowVersion: card.rowVersion + 1n,
      },
    });

    const existingMemoryState = await tx.srsMemoryState.findUnique({
      where: {
        cardId_skill: {
          cardId: card.id,
          skill: 'MEANING',
        },
      },
    });

    if (existingMemoryState) {
      await tx.srsMemoryState.update({
        where: { id: existingMemoryState.id },
        data: {
          schedulerVersion: 'POLICY_B',
          state: nextStage,
          dueAt: nextDueAt,
          lastReviewedAt: dbNow,
          count: existingMemoryState.count + 1,
          lapse: input.rating === 'FORGOTTEN' ? existingMemoryState.lapse + 1 : existingMemoryState.lapse,
          rowVersion: existingMemoryState.rowVersion + 1n,
        },
      });
    } else {
      await tx.srsMemoryState.create({
        data: {
          cardId: card.id,
          skill: 'MEANING',
          schedulerVersion: 'POLICY_B',
          state: nextStage,
          dueAt: nextDueAt,
          lastReviewedAt: dbNow,
          count: 1,
          lapse: input.rating === 'FORGOTTEN' ? 1 : 0,
        },
      });
    }

    const next = await findNextDueCard(tx, session, session.currentIndex + 1, dbNow);
    const response = {
      sessionId,
      status: next.item ? 'ACTIVE' : 'COMPLETED',
      progress: {
        currentIndex: next.index,
        completedCount: session.completedCount + 1,
        total: (session.cardIds as string[]).length,
      },
      currentItem: next.item,
      recordedRating: input.rating,
    } satisfies SrsSessionReviewResultDto;

    const reviewOp = await tx.srsReviewOperation.create({
      data: {
        cardId: card.id,
        learnerId: verifiedUserId,
        operationKey: input.operationKey,
        kind: 'SCHEDULE',
        rating: input.rating,
        sessionKey: sessionId,
        priorStage,
        nextStage,
        priorDueAt,
        nextDueAt,
        reviewedAt: dbNow,
        qualifyingLocalDate,
        inputHash,
        sessionResponse: {
          ...response,
          currentItem: response.currentItem ? { ...response.currentItem } : null,
        },
      },
    });
    await evaluateAndAwardSrsGamification(tx, {
      learnerId: verifiedUserId,
      reviewOpId: reviewOp.id,
      qualifyingLocalDate,
      reviewedAt: dbNow,
      timezone,
    });

    if (options?._injectFaultBeforeSessionCommit) {
      throw new Error('INJECTED_FAULT_BEFORE_SESSION_COMMIT');
    }

    await tx.srsReviewSession.update({
      where: { id: sessionId },
      data: {
        currentIndex: response.progress.currentIndex,
        completedCount: response.progress.completedCount,
        status: response.status,
        completedAt: response.status === 'COMPLETED' ? dbNow : null,
        rowVersion: session.rowVersion + 1n,
      },
    });
    return response;
  });
}

export async function completeReviewSession(
  verifiedUserId: string,
  sessionId: string,
  prismaOverride?: Db
): Promise<SrsSessionCompleteResultDto> {
  const db = (prismaOverride ?? getLearnerPrisma()) as PrismaClient;
  return withLockedSession<SrsSessionCompleteResultDto>(db, verifiedUserId, sessionId, async (tx, original) => {
    const now = await getDbTime(tx);
    let session = await expireSession(tx, original, now);
    if (session.status === 'EXPIRED') return sessionExpiredError();

    if (session.status === 'ACTIVE') {
      session = await tx.srsReviewSession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', completedAt: now, rowVersion: session.rowVersion + 1n },
      });
    }
    return {
      sessionId,
      status: 'COMPLETED',
      progress: sessionProgress(session),
      completedAt: (session.completedAt ?? now).toISOString(),
    };
  });
}
