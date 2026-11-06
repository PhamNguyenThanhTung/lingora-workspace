import 'server-only';
import crypto from 'node:crypto';
import type { Prisma, PrismaClient } from '../../../../lingora-admin/generated/product-client/index.js';
import { getLearnerPrisma } from '../db/index.ts';
import {
  reviewStartSchema,
  reviewRespondSchema,
  SrsServiceError,
  type SrsPromptCardDto,
  type ReviewStartResultDto,
  type ReviewRespondResultDto,
} from './dto.ts';
import {
  createSrsToken,
  verifySrsToken,
  computeSrsInputHash,
} from './token.ts';

type Db = PrismaClient | Prisma.TransactionClient;

export async function getDbTime(db: Db): Promise<Date> {
  if (!db || typeof (db as any).$queryRaw !== 'function') {
    throw new SrsServiceError(503, 'SERVICE_UNAVAILABLE', 'Không thể lấy thời gian cơ sở dữ liệu.');
  }
  try {
    const rows = await (db as any).$queryRaw`SELECT clock_timestamp() AS ts`;
    if (Array.isArray(rows) && rows[0]?.ts instanceof Date && Number.isFinite(rows[0].ts.getTime())) {
      return rows[0].ts;
    }
  } catch (err: any) {
    if (err instanceof SrsServiceError) throw err;
    throw new SrsServiceError(503, 'SERVICE_UNAVAILABLE', 'Không thể lấy thời gian cơ sở dữ liệu.');
  }
  throw new SrsServiceError(503, 'SERVICE_UNAVAILABLE', 'Không thể lấy thời gian cơ sở dữ liệu.');
}

function toPromptCardDto(card: {
  vocabulary: {
    canonicalForm: string;
    meaningLabels: unknown;
    phonetic: string | null;
    partOfSpeech: string | null;
    example: string | null;
  };
}): SrsPromptCardDto {
  const meaningLabels =
    typeof card.vocabulary.meaningLabels === 'object' && card.vocabulary.meaningLabels !== null
      ? (card.vocabulary.meaningLabels as Record<string, string>)
      : {};

  return {
    canonicalForm: card.vocabulary.canonicalForm,
    phonetic: card.vocabulary.phonetic,
    partOfSpeech: card.vocabulary.partOfSpeech,
    example: card.vocabulary.example,
    meaningLabels,
  };
}

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

export async function startSrsReview(
  verifiedUserId: string,
  rawInput: unknown,
  prismaOverride?: Db
): Promise<ReviewStartResultDto> {
  const parsed = reviewStartSchema.safeParse(rawInput ?? {});
  if (!parsed.success) {
    throw new SrsServiceError(400, 'VALIDATION_ERROR', 'Dữ liệu yêu cầu không hợp lệ.');
  }

  const db = prismaOverride ?? getLearnerPrisma();

  // 1. Verify active learner
  const account = await (db as PrismaClient).account.findUnique({
    where: { id: verifiedUserId },
    select: { id: true, role: true, status: true },
  });
  if (!account || account.role !== 'LEARNER' || account.status !== 'ACTIVE') {
    throw new SrsServiceError(403, 'ACCOUNT_INACTIVE', 'Tài khoản học viên không hoạt động.');
  }

  // 2. Query DB clock
  const dbNow = await getDbTime(db);

  // 3. Find earliest due card for this learner
  const dueCard = await (db as PrismaClient).srsCard.findFirst({
    where: {
      learnerId: verifiedUserId,
      dueAt: { lte: dbNow },
    },
    orderBy: [
      { dueAt: 'asc' },
      { id: 'asc' },
    ],
    include: {
      vocabulary: {
        select: {
          canonicalForm: true,
          meaningLabels: true,
          phonetic: true,
          partOfSpeech: true,
          example: true,
        },
      },
    },
  });

  if (!dueCard) {
    return {
      done: true,
      token: null,
      card: null,
    };
  }

  const sessionKey = crypto.randomUUID();
  const exp = Math.floor(dbNow.getTime() / 1000) + 15 * 60; // 15-minute token
  const token = createSrsToken({
    learnerId: verifiedUserId,
    cardId: dueCard.id,
    expectedRowVersion: dueCard.rowVersion.toString(),
    sessionKey,
    exp,
  });

  return {
    done: false,
    token,
    card: toPromptCardDto(dueCard),
  };
}

export async function respondSrsReview(
  verifiedUserId: string,
  rawInput: unknown,
  prismaOverride?: Db
): Promise<ReviewRespondResultDto> {
  const parsed = reviewRespondSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new SrsServiceError(400, 'VALIDATION_ERROR', 'Dữ liệu đánh giá không hợp lệ.');
  }
  const input = parsed.data;

  // Verify HMAC signature, expiry, and learner ownership
  const tokenPayload = verifySrsToken(input.token, verifiedUserId);

  const canonicalInputHash = computeSrsInputHash({
    cardId: tokenPayload.cardId,
    rating: input.rating,
    sessionKey: tokenPayload.sessionKey,
  });

  const rootDb = (prismaOverride ?? getLearnerPrisma()) as PrismaClient;

  // Use interactive transaction
  return rootDb.$transaction(async (tx) => {
    // 1. Lock Account FOR UPDATE (R4: required lock)
    if (!tx || typeof (tx as any).$queryRaw !== 'function') {
      throw new SrsServiceError(503, 'SERVICE_UNAVAILABLE', 'Không thể khóa tài khoản để xử lý.');
    }
    try {
      await (tx as any).$queryRaw`SELECT id::text FROM app.accounts WHERE id = ${verifiedUserId}::uuid FOR UPDATE`;
    } catch (err: any) {
      if (err instanceof SrsServiceError) throw err;
      throw new SrsServiceError(503, 'SERVICE_UNAVAILABLE', 'Không thể khóa tài khoản để xử lý.');
    }

    // 2. Lock Card FOR UPDATE (R4: required lock)
    try {
      await (tx as any).$queryRaw`SELECT id::text, row_version FROM app.srs_cards WHERE id = ${tokenPayload.cardId}::uuid AND learner_id = ${verifiedUserId}::uuid FOR UPDATE`;
    } catch (err: any) {
      if (err instanceof SrsServiceError) throw err;
      throw new SrsServiceError(503, 'SERVICE_UNAVAILABLE', 'Không thể khóa thẻ từ vựng để xử lý.');
    }

    // 3. Verify active learner after locks
    const account = await tx.account.findUnique({
      where: { id: verifiedUserId },
      select: { id: true, role: true, status: true, timezone: true },
    });
    if (!account || account.role !== 'LEARNER' || account.status !== 'ACTIVE') {
      throw new SrsServiceError(403, 'ACCOUNT_INACTIVE', 'Tài khoản học viên không hoạt động.');
    }

    // 4. Check idempotency AFTER locks (R3: serialize same operationKey retry without 409 STALE_OPERATION)
    const existingOp = await tx.srsReviewOperation.findUnique({
      where: {
        learnerId_operationKey: {
          learnerId: verifiedUserId,
          operationKey: input.operationKey,
        },
      },
    });

    if (existingOp) {
      if (existingOp.inputHash !== canonicalInputHash) {
        throw new SrsServiceError(409, 'OPERATION_CONFLICT', 'Mã thao tác đã được sử dụng với nội dung khác.');
      }
      // Replay of previously committed operation: find next due card using DB clock
      const dbNow = await getDbTime(tx);
      const nextDueCard = await tx.srsCard.findFirst({
        where: {
          learnerId: verifiedUserId,
          dueAt: { lte: dbNow },
        },
        orderBy: [
          { dueAt: 'asc' },
          { id: 'asc' },
        ],
        include: {
          vocabulary: {
            select: {
              canonicalForm: true,
              meaningLabels: true,
              phonetic: true,
              partOfSpeech: true,
              example: true,
            },
          },
        },
      });

      if (!nextDueCard) {
        return {
          done: true,
          token: null,
          card: null,
          recordedRating: existingOp.rating as 'REMEMBERED' | 'FORGOTTEN',
        };
      }

      const nextExp = Math.floor(dbNow.getTime() / 1000) + 15 * 60;
      const nextToken = createSrsToken({
        learnerId: verifiedUserId,
        cardId: nextDueCard.id,
        expectedRowVersion: nextDueCard.rowVersion.toString(),
        sessionKey: tokenPayload.sessionKey,
        exp: nextExp,
      });

      return {
        done: false,
        token: nextToken,
        card: toPromptCardDto(nextDueCard),
        recordedRating: existingOp.rating as 'REMEMBERED' | 'FORGOTTEN',
      };
    }

    // 4. If new operation, verify card existence and CAS token
    const card = await tx.srsCard.findUnique({
      where: { id: tokenPayload.cardId },
    });

    if (!card || card.learnerId !== verifiedUserId) {
      throw new SrsServiceError(404, 'CARD_NOT_FOUND', 'Thẻ từ vựng không tồn tại.');
    }

    if (card.rowVersion.toString() !== tokenPayload.expectedRowVersion) {
      throw new SrsServiceError(409, 'STALE_OPERATION', 'Thẻ từ vựng đã được cập nhật bởi một phiên học khác.');
    }

    const dbNow = await getDbTime(tx);
    if (card.dueAt > dbNow) {
      throw new SrsServiceError(409, 'CARD_NOT_DUE', 'Thẻ từ vựng chưa đến hạn ôn tập.');
    }

    // Calculate stage and nextDueAt
    let nextStage: number;
    let nextDueAt: Date;
    const priorStage = card.stage;
    const priorDueAt = card.dueAt;

    if (input.rating === 'REMEMBERED') {
      nextStage = Math.min(priorStage + 1, 5);
      const intervals = [1, 3, 7, 14, 30];
      const intervalDays = intervals[nextStage - 1];
      nextDueAt = new Date(dbNow.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    } else {
      // FORGOTTEN
      nextStage = 1;
      nextDueAt = new Date(dbNow.getTime() + 1 * 24 * 60 * 60 * 1000);
    }

    const qualifyingLocalDate = computeQualifyingLocalDate(dbNow, account.timezone);

    // Update card atomically
    await tx.srsCard.update({
      where: { id: card.id },
      data: {
        stage: nextStage,
        dueAt: nextDueAt,
        lastReviewedAt: dbNow,
        rowVersion: card.rowVersion + 1n,
      },
    });

    // Record immutable review operation
    await tx.srsReviewOperation.create({
      data: {
        cardId: card.id,
        learnerId: verifiedUserId,
        operationKey: input.operationKey,
        kind: 'SCHEDULE',
        rating: input.rating,
        sessionKey: tokenPayload.sessionKey,
        priorStage,
        nextStage,
        priorDueAt,
        nextDueAt,
        reviewedAt: dbNow,
        qualifyingLocalDate,
        inputHash: canonicalInputHash,
      },
    });

    // Find next due card using DB clock
    const nextDueCard = await tx.srsCard.findFirst({
      where: {
        learnerId: verifiedUserId,
        dueAt: { lte: dbNow },
      },
      orderBy: [
        { dueAt: 'asc' },
        { id: 'asc' },
      ],
      include: {
        vocabulary: {
          select: {
            canonicalForm: true,
            meaningLabels: true,
            phonetic: true,
            partOfSpeech: true,
            example: true,
          },
        },
      },
    });

    if (!nextDueCard) {
      return {
        done: true,
        token: null,
        card: null,
        recordedRating: input.rating,
      };
    }

    const nextExp = Math.floor(dbNow.getTime() / 1000) + 15 * 60;
    const nextToken = createSrsToken({
      learnerId: verifiedUserId,
      cardId: nextDueCard.id,
      expectedRowVersion: nextDueCard.rowVersion.toString(),
      sessionKey: tokenPayload.sessionKey,
      exp: nextExp,
    });

    return {
      done: false,
      token: nextToken,
      card: toPromptCardDto(nextDueCard),
      recordedRating: input.rating,
    };
  });
}
