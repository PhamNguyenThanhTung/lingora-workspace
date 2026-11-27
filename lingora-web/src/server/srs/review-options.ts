import 'server-only';
import type { Prisma, PrismaClient } from '../../../../lingora-admin/generated/product-client/index.js';
import { getLearnerPrisma } from '../db/index.ts';
import { getDbTime } from './service.ts';

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * One review entry point per active learning context (one per language). The review page uses it
 * to scope a session to a single language (G11) and to show where work is waiting.
 */
export interface ReviewContextOptionDto {
  contextId: string;
  languageId: string;
  languageName: string;
  /** Target-language code (BCP-47-ish); drives `lang` on foreign-language card text. */
  languageCode: string | null;
  dueCount: number;
}

function localizedName(names: unknown, fallback: string): string {
  if (!names || typeof names !== 'object') return fallback;
  const record = names as Record<string, string>;
  return record.vi || record.en || Object.values(record)[0] || fallback;
}

export async function countDueSrsCards(
  db: Db,
  learnerId: string,
  languageId: string | null,
  now: Date,
): Promise<number> {
  return (db as PrismaClient).srsCard.count({
    where: {
      learnerId,
      dueAt: { lte: now },
      ...(languageId ? { vocabulary: { languageId } } : {}),
    },
  });
}

/**
 * Due counts per active learning context. Never throws: the review page must stay usable
 * (falling back to the account-wide session) when contexts or counts cannot be read.
 */
export async function listReviewContextOptions(
  learnerId: string,
  prismaOverride?: Db,
): Promise<ReviewContextOptionDto[]> {
  const db = (prismaOverride ?? getLearnerPrisma()) as PrismaClient;

  try {
    const contexts = await db.learningContext.findMany({
      where: { learnerId, status: 'ACTIVE' },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        languageId: true,
        language: { select: { id: true, code: true, names: true } },
      },
    });
    if (contexts.length === 0) return [];

    const now = await getDbTime(db);
    return await Promise.all(
      contexts.map(async context => ({
        contextId: context.id,
        languageId: context.languageId,
        languageName: localizedName(context.language?.names, context.language?.code ?? ''),
        languageCode: context.language?.code ?? null,
        dueCount: await countDueSrsCards(db, learnerId, context.languageId, now),
      })),
    );
  } catch {
    return [];
  }
}
