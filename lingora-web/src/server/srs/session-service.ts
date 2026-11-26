import 'server-only';
import crypto from 'node:crypto';
import type { Prisma, PrismaClient, SrsReviewSession } from '../../../../lingora-admin/generated/product-client/index.js';
import { getLearnerPrisma } from '../db/index.ts';
import { SrsServiceError } from './dto.ts';
import { calculatePolicyBSchedule } from './scheduler.ts';
import { evaluateAndAwardSrsGamification } from '../gamification/service.ts';
import { getDbTime } from './service.ts';
import { normalizeStoredTimezone } from '../context/timezone.ts';
import { UUID_REGEX } from '../lessons/dto.ts';
import { z } from 'zod';
import { gradeStrokeAttempt, validateTemplateStrokes, type CandidateStrokeInput } from '@lingora/lesson-content';
import {
  createInitialWritingSrsState,
  scheduleWritingSrsReview,
  WRITING_SRS_SCHEDULER_VERSION,
} from './writing-scheduler.ts';

type Db = PrismaClient | Prisma.TransactionClient;

export const createSessionSchema = z
  .object({
    limit: z.number().int().min(1).max(50).optional().default(20),
    contextId: z.string().uuid('Mã lộ trình phải là UUID hợp lệ.').optional(),
    // "Ôn nhanh" warm-up: skip words that this very lesson introduces for the first time.
    // Lesson ids come from seeded content and are not always version-4 UUIDs, so this uses
    // the same permissive UUID shape the lesson APIs accept.
    excludeLessonId: z.string().regex(UUID_REGEX, 'Mã bài học phải là UUID hợp lệ.').optional(),
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
    rating: z.enum(['REMEMBERED', 'FORGOTTEN', 'AGAIN', 'HARD', 'GOOD', 'EASY']),
    cardId: z.string().uuid('Mã thẻ ôn tập phải là UUID hợp lệ.'),
  })
  .strict();
export type ReviewSessionItemInput = z.infer<typeof reviewSessionItemSchema>;

export const writingSessionAttemptSchema = z.object({
  operationKey: z.string().uuid('Mã thao tác phải là UUID hợp lệ.'),
  cardId: z.string().uuid('Mã thẻ ôn tập phải là UUID hợp lệ.'),
  characterNumber: z.number().int().min(1, 'Thứ tự ký tự phải là số nguyên dương.'),
  candidateStrokes: z.array(z.object({
    points: z.array(z.tuple([z.number().finite().min(0).max(1), z.number().finite().min(0).max(1)])).min(2).max(256),
  }).strict()).min(1).max(128),
}).strict().superRefine((value, ctx) => {
  if (value.candidateStrokes.reduce((sum, stroke) => sum + stroke.points.length, 0) > 4096) {
    ctx.addIssue({ code: 'custom', message: 'Tổng số điểm vượt quá giới hạn 4096.', path: ['candidateStrokes'] });
  }
});

export type SubmitSessionWritingAttemptInput = z.infer<typeof writingSessionAttemptSchema>;

export interface SrsSessionProgressDto {
  currentIndex: number;
  completedCount: number;
  total: number;
}

export interface SrsMeaningFrontPromptCardDto {
  cardId: string;
  canonicalForm: string;
}

export interface SrsWritingCharacterReceiptDto {
  glyph: string;
  score: number;
  band: string;
  passed: boolean;
  details: {
    strokeCount: { expected: number; actual: number; diff: number };
    strokeFeedback: Array<{ strokeIndex: number; score: number; directionInverted: boolean }>;
  };
}

export interface SrsWritingFrontPromptCardDto {
  cardId: string;
  skill: 'WRITING';
  meaningLabels: Record<string, string>;
  writing: {
    characterNumber: number;
    characterCount: number;
    strokeCount: number;
    attemptedCharacters: number;
    revealedCharacters: SrsWritingCharacterReceiptDto[] | null;
  };
}

export type SrsFrontPromptCardDto = SrsMeaningFrontPromptCardDto | SrsWritingFrontPromptCardDto;

export interface WritingQueueCharacter {
  characterId: string;
  glyph: string;
  strokeVersion: number;
  strokeCount: number;
  position?: number;
}

export interface WritingAttemptReceipt {
  evidenceId: string;
  operationKey: string;
  cardId?: string;
  characterNumber?: number;
  characterPosition?: number;
  inputFingerprint: string;
  score: number;
  band: string;
  passed: boolean;
  details: SrsWritingCharacterReceiptDto['details'];
  response: SrsSessionWritingAttemptResultDto;
}

export interface WritingQueueEntry {
  cardId: string;
  skill: 'WRITING';
  characters: WritingQueueCharacter[];
  attempts: WritingAttemptReceipt[];
}

type SessionQueueEntry = string | WritingQueueEntry;

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
  recordedRating: 'REMEMBERED' | 'FORGOTTEN' | 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';
}

export interface SrsSessionWritingAttemptResultDto {
  sessionId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  progress: SrsSessionProgressDto;
  currentItem: SrsFrontPromptCardDto | null;
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

function toFrontPromptCardDto(card: { id: string; vocabulary: { canonicalForm: string } }): SrsMeaningFrontPromptCardDto {
  return { cardId: card.id, canonicalForm: card.vocabulary.canonicalForm };
}

const frontCardSelect = {
  id: true,
  dueAt: true,
  vocabularyId: true,
  vocabulary: { select: { canonicalForm: true, meaningLabels: true } },
} as const;

function isWritingSrsEnabled(learnerId: string): boolean {
  if (process.env.WRITING_SRS_ENABLED !== 'true') return false;
  return (process.env.WRITING_SRS_LEARNER_IDS ?? '')
    .split(',')
    .some(id => id.trim().toLowerCase() === learnerId.toLowerCase());
}

function normalizeQueueEntry(entry: SessionQueueEntry): { cardId: string; skill: 'MEANING' } | WritingQueueEntry {
  if (typeof entry === 'string') return { cardId: entry, skill: 'MEANING' };
  if (entry && typeof entry.cardId === 'string' && entry.skill === 'WRITING' && Array.isArray(entry.characters) && Array.isArray(entry.attempts)) {
    return entry;
  }
  throw new SrsServiceError(503, 'SESSION_DATA_INVALID', 'Dữ liệu phiên ôn tập không hợp lệ.');
}

function meaningLabelsDto(value: unknown): Record<string, string> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
    : {};
}

function toWritingFrontPromptCardDto(
  entry: WritingQueueEntry,
  labels: unknown,
  canonicalForm?: string
): SrsWritingFrontPromptCardDto {
  const attemptedCharacters = entry.attempts.length;
  const complete = attemptedCharacters === entry.characters.length;
  const character = entry.characters[Math.min(attemptedCharacters, entry.characters.length - 1)];

  let meaningLabels = meaningLabelsDto(labels);
  if (!complete) {
    const answerGlyphs = entry.characters.map(c => c.glyph.trim().toLowerCase());
    const answerTargets = [
      ...(canonicalForm ? [canonicalForm.trim().toLowerCase()] : []),
      ...answerGlyphs,
    ].filter(s => s.length > 0);

    const filtered: Record<string, string> = {};
    for (const [locale, val] of Object.entries(meaningLabels)) {
      const lower = val.toLowerCase();
      const echoes = answerTargets.some(target => lower.includes(target));
      if (!echoes) {
        filtered[locale] = val;
      }
    }
    meaningLabels = filtered;
  }

  return {
    cardId: entry.cardId,
    skill: 'WRITING',
    meaningLabels,
    writing: {
      characterNumber: Math.min(attemptedCharacters + 1, entry.characters.length),
      characterCount: entry.characters.length,
      strokeCount: complete ? 0 : character.strokeCount,
      attemptedCharacters,
      revealedCharacters: complete ? entry.attempts.map((attempt, index) => ({
        glyph: entry.characters[index].glyph,
        score: attempt.score,
        band: attempt.band,
        passed: attempt.passed,
        details: attempt.details,
      })) : null,
    },
  };
}

function computeQualifyingLocalDate(now: Date, timezone: string): Date {
  const norm = normalizeStoredTimezone(timezone);
  if (!norm.ok) {
    throw new SrsServiceError(400, 'INVALID_TIMEZONE', `Múi giờ '${timezone}' không hợp lệ hoặc không được hỗ trợ.`);
  }
  const localDateString = new Intl.DateTimeFormat('en-CA', {
    timeZone: norm.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return new Date(`${localDateString}T00:00:00.000Z`);
}

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function resolveWritingCharactersForCards(
  db: Db,
  cards: Array<{
    id: string;
    vocabularyId: string;
    sourceLessonVocabularyId?: string | null;
    vocabulary: { canonicalForm: string; languageId: string; meaningLabels?: unknown };
  }>
): Promise<Map<string, WritingQueueCharacter[]>> {
  const result = new Map<string, WritingQueueCharacter[]>();
  const linkIds = cards
    .map(c => c.sourceLessonVocabularyId)
    .filter((id): id is string => typeof id === 'string' && isValidUuid(id));

  if (linkIds.length === 0) return result;

  const links = await db.lessonVocabularyLink.findMany({
    where: { id: { in: linkIds } },
    select: {
      id: true,
      vocabularyId: true,
      displaySnapshot: true,
      lessonRevision: {
        select: {
          status: true,
          publishedAt: true,
        },
      },
    },
  });
  const linkMap = new Map(links.map(l => [l.id, l]));

  interface CandidateChar {
    characterId: string;
    position: number;
    glyph: string;
    strokeCount: number;
    strokeVersion: number;
  }
  const cardCandidates = new Map<string, { languageId: string; characters: CandidateChar[] }>();
  const allNeededCharIds = new Set<string>();

  for (const card of cards) {
    if (!card.sourceLessonVocabularyId) continue;
    const link = linkMap.get(card.sourceLessonVocabularyId);
    if (!link) continue;

    // Must be PUBLISHED or ARCHIVED with publishedAt
    if (!link.lessonRevision || !link.lessonRevision.publishedAt) continue;
    if (link.lessonRevision.status !== 'PUBLISHED' && link.lessonRevision.status !== 'ARCHIVED') continue;

    // Matching vocabulary
    if (link.vocabularyId !== card.vocabularyId) continue;

    // Valid displaySnapshot
    const snap = link.displaySnapshot as any;
    if (!snap || typeof snap !== 'object') continue;
    if (snap.languageId !== card.vocabulary.languageId) continue;
    if (!Array.isArray(snap.characters) || snap.characters.length === 0) continue;

    let validEntries = true;
    const characters: CandidateChar[] = [];
    for (const rc of snap.characters) {
      if (!rc || typeof rc !== 'object') { validEntries = false; break; }
      if (typeof rc.characterId !== 'string' || !isValidUuid(rc.characterId)) { validEntries = false; break; }
      if (typeof rc.position !== 'number' || !Number.isInteger(rc.position) || rc.position < 1) { validEntries = false; break; }
      if (typeof rc.glyph !== 'string' || rc.glyph.length === 0) { validEntries = false; break; }
      if (typeof rc.strokeCount !== 'number' || !Number.isInteger(rc.strokeCount) || rc.strokeCount < 1) { validEntries = false; break; }
      if (typeof rc.strokeVersion !== 'number' || !Number.isInteger(rc.strokeVersion) || rc.strokeVersion < 1) { validEntries = false; break; }
      characters.push({
        characterId: rc.characterId,
        position: rc.position,
        glyph: rc.glyph,
        strokeCount: rc.strokeCount,
        strokeVersion: rc.strokeVersion,
      });
    }
    if (!validEntries) continue;

    // Check unique positive positions in strictly ascending order
    characters.sort((a, b) => a.position - b.position);
    let positionsUnique = true;
    for (let i = 0; i < characters.length - 1; i++) {
      if (characters[i].position >= characters[i + 1].position) {
        positionsUnique = false;
        break;
      }
    }
    if (!positionsUnique) continue;

    for (const c of characters) allNeededCharIds.add(c.characterId);
    cardCandidates.set(card.id, { languageId: snap.languageId, characters });
  }

  if (allNeededCharIds.size === 0) return result;

  // Batch query character stroke data
  const dbCharacters = await db.writingCharacter.findMany({
    where: { id: { in: [...allNeededCharIds] } },
    select: {
      id: true,
      languageId: true,
      strokeCount: true,
      strokeData: {
        select: {
          version: true,
          strokes: true,
        },
      },
    },
  });
  const dbCharMap = new Map(dbCharacters.map(c => [c.id, c]));

  // Verify each candidate card against database stroke data
  for (const [cardId, cand] of cardCandidates) {
    let eligible = true;
    for (const c of cand.characters) {
      const dbChar = dbCharMap.get(c.characterId);
      if (!dbChar) { eligible = false; break; }
      if (dbChar.languageId !== cand.languageId) { eligible = false; break; }
      const sData = dbChar.strokeData;
      if (!sData || sData.version !== c.strokeVersion) { eligible = false; break; }
      if (!Array.isArray(sData.strokes) || sData.strokes.length !== c.strokeCount) { eligible = false; break; }
      const templateErrors = validateTemplateStrokes(sData.strokes);
      if (templateErrors.length > 0) { eligible = false; break; }
    }
    if (eligible) {
      result.set(cardId, cand.characters.map(c => ({
        characterId: c.characterId,
        glyph: c.glyph,
        strokeVersion: c.strokeVersion,
        strokeCount: c.strokeCount,
        position: c.position,
      })));
    }
  }

  return result;
}

export function computeSessionInputHash(input: {
  sessionId: string;
  cardId: string;
  rating: string;
  skill?: 'MEANING' | 'WRITING';
  evidenceIds?: string[];
}): string {
  const canonicalInput: Record<string, unknown> = {
    sessionId: input.sessionId,
    cardId: input.cardId,
    rating: input.rating,
  };
  if (input.skill === 'WRITING') {
    canonicalInput.skill = input.skill;
    canonicalInput.evidenceIds = input.evidenceIds ?? [];
  }
  const canonical = JSON.stringify(canonicalInput);
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
    select: { id: true, role: true, status: true, timezone: true },
  });
  if (!account || account.role !== 'LEARNER' || account.status !== 'ACTIVE') {
    throw new SrsServiceError(403, 'ACCOUNT_INACTIVE', 'Tài khoản học viên không hoạt động.');
  }

  if (!normalizeStoredTimezone(account.timezone).ok) {
    throw new SrsServiceError(400, 'INVALID_TIMEZONE', 'Múi giờ của tài khoản không hợp lệ.');
  }

  // 2. If contextId provided, verify ownership and scope the queue to that context's language.
  // G11: one review session must never mix languages (e.g. French cards inside a Japanese session).
  let contextFilter: Prisma.SrsCardWhereInput | undefined;
  if (input.contextId) {
    const context = await db.learningContext.findFirst({
      where: { id: input.contextId, learnerId: verifiedUserId },
      select: { id: true, languageId: true, learnerId: true },
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
    contextFilter = { vocabulary: { languageId: context.languageId } };
  }

  // 2b. "Ôn nhanh" warm-up: never drill words the current lesson introduces for the first time.
  if (input.excludeLessonId) {
    const introducedLinks = await db.lessonVocabularyLink.findMany({
      where: { lessonRevision: { lessonId: input.excludeLessonId } },
      select: { vocabularyId: true },
    });
    const introducedIds = [...new Set(introducedLinks.map(link => link.vocabularyId))];
    if (introducedIds.length > 0) {
      contextFilter = { ...(contextFilter ?? {}), vocabularyId: { notIn: introducedIds } };
    }
  }

  // 3. Query DB clock
  const dbNow = await getDbTime(db);

  // 4. Query due cards and lazily initialize WRITING only for opted-in learners.
  // 4. S6-10.2b: Initialize WRITING state independently of SrsCard.dueAt and limit for opted-in learners
  if (isWritingSrsEnabled(verifiedUserId)) {
    const allEnrolledCards = await db.srsCard.findMany({
      where: {
        learnerId: verifiedUserId,
        ...(contextFilter ? contextFilter : {}),
      },
      select: {
        id: true,
        vocabularyId: true,
        sourceLessonVocabularyId: true,
        vocabulary: { select: { canonicalForm: true, languageId: true, meaningLabels: true } },
      },
    });

    const eligibleMap = await resolveWritingCharactersForCards(db, allEnrolledCards);
    const eligibleCardIds = [...eligibleMap.keys()];

    if (eligibleCardIds.length > 0) {
      const existingStates = await db.srsMemoryState.findMany({
        where: { cardId: { in: eligibleCardIds }, skill: 'WRITING' },
        select: { cardId: true },
      });
      const enrolledCardIds = new Set(existingStates.map(state => state.cardId));
      const uninitializedCards = eligibleCardIds.filter(id => !enrolledCardIds.has(id));

      if (uninitializedCards.length > 0) {
        const initial = createInitialWritingSrsState(dbNow);
        await db.srsMemoryState.createMany({
          data: uninitializedCards.map(cardId => ({
            cardId,
            skill: 'WRITING',
            schedulerVersion: WRITING_SRS_SCHEDULER_VERSION,
            state: initial.state,
            stability: initial.stability,
            difficulty: initial.difficulty,
            dueAt: initial.dueAt,
            count: initial.count,
            lapse: initial.lapse,
            scheduledDays: initial.scheduledDays,
            learningSteps: initial.learningSteps,
          })),
          skipDuplicates: true,
        });
      }
    }
  }

  // 5. Query due cards for MEANING and WRITING
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
  const candidates: Array<{
    dueAt: Date;
    cardId: string;
    skill: 'MEANING' | 'WRITING';
    entry: SessionQueueEntry;
    item: SrsFrontPromptCardDto;
  }> = dueCards.map(card => ({
    dueAt: card.dueAt,
    cardId: card.id,
    skill: 'MEANING',
    entry: card.id,
    item: toFrontPromptCardDto(card),
  }));

  if (isWritingSrsEnabled(verifiedUserId)) {
    const writingStates = await db.srsMemoryState.findMany({
      where: {
        skill: 'WRITING',
        dueAt: { lte: dbNow },
        card: { is: { learnerId: verifiedUserId, ...(contextFilter ?? {}) } },
      },
      orderBy: [{ dueAt: 'asc' }, { cardId: 'asc' }],
      select: {
        cardId: true,
        dueAt: true,
        card: {
          select: {
            id: true,
            vocabularyId: true,
            sourceLessonVocabularyId: true,
            vocabulary: { select: { canonicalForm: true, languageId: true, meaningLabels: true } },
          },
        },
      },
    });
    const eligibleMap = await resolveWritingCharactersForCards(
      db,
      writingStates.map(state => state.card),
    );
    for (const state of writingStates) {
      const characters = eligibleMap.get(state.cardId);
      if (!characters) continue;
      const entry: WritingQueueEntry = { cardId: state.cardId, skill: 'WRITING', characters, attempts: [] };
      candidates.push({
        dueAt: state.dueAt,
        cardId: state.cardId,
        skill: 'WRITING',
        entry,
        item: toWritingFrontPromptCardDto(
          entry,
          state.card.vocabulary.meaningLabels,
          state.card.vocabulary.canonicalForm
        ),
      });
    }
  }

  candidates.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime() || a.cardId.localeCompare(b.cardId) || a.skill.localeCompare(b.skill));
  const queue = candidates.slice(0, input.limit);
  const cardIds = queue.map(candidate => candidate.entry);
  const expiresAt = new Date(dbNow.getTime() + 15 * 60 * 1000); // 15 minutes

  if (queue.length === 0) {
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
      cardIds: cardIds as unknown as Prisma.InputJsonValue,
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
      total: queue.length,
    },
    currentItem: queue[0].item,
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
    const tzResult = normalizeStoredTimezone(account.timezone);
    if (!tzResult.ok) {
      throw new SrsServiceError(400, 'INVALID_TIMEZONE', 'Múi giờ của tài khoản không hợp lệ.');
    }
    return work(tx, session, tzResult.timezone);
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
  const entries = (session.cardIds as SessionQueueEntry[]).map(normalizeQueueEntry);
  const remaining = entries.slice(start);
  if (remaining.length === 0) return { index: entries.length, item: null };

  const isWritingEnabled = isWritingSrsEnabled(session.learnerId);
  const meaningIds = remaining.filter(entry => entry.skill === 'MEANING').map(entry => entry.cardId);
  const writingEntries = remaining.filter((entry): entry is WritingQueueEntry => entry.skill === 'WRITING');
  const [cards, writingStates] = await Promise.all([
    meaningIds.length > 0
      ? tx.srsCard.findMany({
        where: { id: { in: meaningIds }, learnerId: session.learnerId, dueAt: { lte: now } },
        select: frontCardSelect,
      })
      : Promise.resolve([]),
    writingEntries.length > 0 && isWritingEnabled
      ? tx.srsMemoryState.findMany({
        where: {
          cardId: { in: writingEntries.map(entry => entry.cardId) },
          skill: 'WRITING',
          dueAt: { lte: now },
          card: { is: { learnerId: session.learnerId } },
        },
        select: {
          cardId: true,
          card: { select: { vocabulary: { select: { meaningLabels: true, canonicalForm: true } } } },
        },
      })
      : Promise.resolve([]),
  ]);
  const cardsById = new Map(cards.map(card => [card.id, card]));
  const statesById = new Map(writingStates.map(state => [state.cardId, state]));

  for (let offset = 0; offset < remaining.length; offset++) {
    const entry = remaining[offset];
    if (entry.skill === 'MEANING') {
      const card = cardsById.get(entry.cardId);
      if (card) return { index: start + offset, item: toFrontPromptCardDto(card) };
    } else if (isWritingEnabled) {
      const state = statesById.get(entry.cardId);
      if (state) {
        return {
          index: start + offset,
          item: toWritingFrontPromptCardDto(
            entry,
            state.card.vocabulary.meaningLabels,
            state.card.vocabulary.canonicalForm
          ),
        };
      }
    }
  }
  return { index: entries.length, item: null };
}

function sessionProgress(session: SrsReviewSession): SrsSessionProgressDto {
  return {
    currentIndex: session.currentIndex,
    completedCount: session.completedCount,
    total: (session.cardIds as SessionQueueEntry[]).length,
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
    if (state.currentItem && 'skill' in state.currentItem && state.currentItem.skill === 'WRITING') {
      return new SrsServiceError(409, 'WRITING_ATTEMPT_REQUIRED', 'Hãy hoàn thành lượt viết trước khi xem đáp án.');
    }

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

function writingAttemptConflict() {
  return new SrsServiceError(409, 'OPERATION_CONFLICT', 'Mã thao tác đã được dùng với dữ liệu nét khác.');
}

function matchesPinnedWritingEntry(entry: WritingQueueEntry, pinned: WritingQueueCharacter[]): boolean {
  if (entry.characters.length !== pinned.length || entry.attempts.length > pinned.length) return false;
  const charactersMatch = entry.characters.every((character, index) => {
    const pinnedCharacter = pinned[index];
    return character.characterId === pinnedCharacter.characterId &&
      character.glyph === pinnedCharacter.glyph &&
      character.strokeVersion === pinnedCharacter.strokeVersion &&
      character.strokeCount === pinnedCharacter.strokeCount &&
      (character.position === undefined || character.position === pinnedCharacter.position);
  });
  if (!charactersMatch) return false;

  return entry.attempts.every((attempt, index) =>
    (attempt.cardId === undefined || attempt.cardId === entry.cardId) &&
    (attempt.characterNumber === undefined || attempt.characterNumber === index + 1) &&
    (attempt.characterPosition === undefined || attempt.characterPosition === pinned[index].position),
  );
}

export async function submitSessionWritingAttempt(
  verifiedUserId: string,
  sessionId: string,
  rawInput: unknown,
  prismaOverride?: Db,
): Promise<SrsSessionWritingAttemptResultDto> {
  const parsed = writingSessionAttemptSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new SrsServiceError(400, 'VALIDATION_ERROR', 'Dữ liệu nét vẽ không hợp lệ.');
  }
  const input = parsed.data;
  const fingerprint = crypto.createHash('sha256')
    .update(JSON.stringify(input.candidateStrokes.map(stroke => stroke.points)), 'utf8')
    .digest('hex');
  const db = (prismaOverride ?? getLearnerPrisma()) as PrismaClient;

  return withLockedSession(db, verifiedUserId, sessionId, async (tx, session) => {
    const storedEntries = session.cardIds as SessionQueueEntry[];
    const entries = storedEntries.map(normalizeQueueEntry);

    // 1. Same-key replay check across the entire session
    for (const entry of entries) {
      if (entry.skill !== 'WRITING') continue;
      const receipt = entry.attempts.find(attempt => attempt.operationKey === input.operationKey);
      if (receipt) {
        const storedOrdinal = receipt.characterNumber ?? (entry.attempts.indexOf(receipt) + 1);
        if (
          entry.cardId !== input.cardId ||
          storedOrdinal !== input.characterNumber ||
          receipt.inputFingerprint !== fingerprint
        ) {
          return writingAttemptConflict();
        }
        return receipt.response;
      }
    }

    // 2. Rollout check for new submissions
    if (!isWritingSrsEnabled(verifiedUserId)) {
      return new SrsServiceError(404, 'NOT_FOUND', 'Phiên luyện viết không tồn tại.');
    }
    const dbNow = await getDbTime(tx);
    const expired = await expireSession(tx, session, dbNow);
    if (expired.status === 'EXPIRED') return sessionExpiredError();
    if (expired.status === 'COMPLETED') return sessionCompletedError();

    // 3. Reconcile session forward
    const state = await reconcileSession(tx, session, dbNow);
    if (state.status === 'EXPIRED') return sessionExpiredError();
    if (state.status === 'COMPLETED') return sessionCompletedError();

    // 4. Use locked row's reconciled index and version
    const freshSession = await tx.srsReviewSession.findUniqueOrThrow({ where: { id: sessionId } });
    const currentStoredEntries = freshSession.cardIds as SessionQueueEntry[];
    const currentEntries = currentStoredEntries.map(normalizeQueueEntry);
    const queueEntry = currentEntries[freshSession.currentIndex];

    if (!queueEntry || queueEntry.skill !== 'WRITING' || queueEntry.cardId !== input.cardId) {
      return staleCardError();
    }

    // 5. Ordinal checks: new key for stale ordinal gives STALE_OPERATION with no new receipt
    const expectedOrdinal = queueEntry.attempts.length + 1;
    if (input.characterNumber !== expectedOrdinal) {
      return new SrsServiceError(409, 'STALE_OPERATION', 'Thứ tự ký tự không khớp với trạng thái hiện tại.');
    }
    if (queueEntry.attempts.length >= queueEntry.characters.length) {
      return staleCardError();
    }

    // 6. Lock and verify memory state
    await tx.$queryRaw`
      SELECT id FROM app.srs_memory_states
      WHERE card_id = ${input.cardId}::uuid AND skill = 'WRITING' FOR UPDATE
    `;
    const memoryState = await tx.srsMemoryState.findUnique({
      where: { cardId_skill: { cardId: input.cardId, skill: 'WRITING' } },
      select: {
        dueAt: true,
        card: {
          select: {
            id: true,
            vocabularyId: true,
            sourceLessonVocabularyId: true,
            vocabulary: { select: { canonicalForm: true, languageId: true, meaningLabels: true } },
          },
        },
      },
    });
    if (!memoryState || memoryState.dueAt > dbNow) return staleCardError();

    const pinnedCharactersByCard = await resolveWritingCharactersForCards(tx, [memoryState.card]);
    const pinnedCharacters = pinnedCharactersByCard.get(input.cardId);
    if (!pinnedCharacters || !matchesPinnedWritingEntry(queueEntry, pinnedCharacters)) {
      return new SrsServiceError(409, 'CONTENT_INCONSISTENT', 'Thứ tự ký tự của phiên không khớp với nội dung đã xuất bản.');
    }
    queueEntry.characters = pinnedCharacters;

    // 7. Verify template and grade
    const character = queueEntry.characters[queueEntry.attempts.length];
    const strokeData = await tx.characterStrokeData.findFirst({
      where: { characterId: character.characterId, version: character.strokeVersion },
      select: { strokes: true },
    });
    if (!strokeData || !Array.isArray(strokeData.strokes)) {
      return new SrsServiceError(409, 'CONTENT_INCONSISTENT', 'Dữ liệu nét của ký tự không khả dụng.');
    }
    const templateErrors = validateTemplateStrokes(strokeData.strokes);
    if (templateErrors.length > 0) {
      return new SrsServiceError(409, 'CONTENT_INCONSISTENT', 'Dữ liệu nét mẫu của ký tự không hợp lệ.');
    }
    const graded = gradeStrokeAttempt({
      candidateStrokes: input.candidateStrokes as CandidateStrokeInput[],
      templateStrokes: strokeData.strokes as any,
    });
    if (graded.details.strokeScores.length === 0) {
      return new SrsServiceError(400, 'INVALID_STROKE_GEOMETRY', 'Nét vẽ không tạo thành đường đi hợp lệ.');
    }

    // 8. Bind receipt to card, attempted ordinal, pinned position, fingerprint
    const details: SrsWritingCharacterReceiptDto['details'] = {
      strokeCount: graded.details.strokeCount,
      strokeFeedback: graded.details.strokeScores.map(stroke => ({
        strokeIndex: stroke.strokeIndex,
        score: stroke.score,
        directionInverted: stroke.isDirectionInverted,
      })),
    };
    const attempt: Omit<WritingAttemptReceipt, 'response'> = {
      evidenceId: crypto.randomUUID(),
      operationKey: input.operationKey,
      cardId: input.cardId,
      characterNumber: input.characterNumber,
      characterPosition: character.position ?? input.characterNumber,
      inputFingerprint: fingerprint,
      score: graded.score,
      band: graded.band,
      passed: graded.passed,
      details,
    };
    const updatedEntry: WritingQueueEntry = {
      ...queueEntry,
      attempts: [...queueEntry.attempts, { ...attempt, response: undefined as never }],
    };
    const currentItem = toWritingFrontPromptCardDto(
      updatedEntry,
      memoryState.card.vocabulary.meaningLabels,
      memoryState.card.vocabulary.canonicalForm
    );
    const response: SrsSessionWritingAttemptResultDto = {
      sessionId,
      status: 'ACTIVE',
      progress: sessionProgress(freshSession),
      currentItem,
    };
    updatedEntry.attempts[updatedEntry.attempts.length - 1].response = response;
    currentStoredEntries[freshSession.currentIndex] = updatedEntry;
    await tx.srsReviewSession.update({
      where: { id: sessionId },
      data: {
        cardIds: currentStoredEntries as unknown as Prisma.InputJsonValue,
        rowVersion: freshSession.rowVersion + 1n,
      },
    });
    return response;
  });
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
  const db = (prismaOverride ?? getLearnerPrisma()) as PrismaClient;

  return withLockedSession<SrsSessionReviewResultDto>(db, verifiedUserId, sessionId, async (tx, session, timezone) => {
    const existing = await tx.srsReviewOperation.findUnique({
      where: { learnerId_operationKey: { learnerId: verifiedUserId, operationKey: input.operationKey } },
    });
    if (existing) {
      const saved = existing.sessionResponse as (SrsSessionReviewResultDto & { _writingEvidenceIds?: string[] }) | null;
      const inputHash = computeSessionInputHash({
        sessionId,
        cardId: input.cardId,
        rating: input.rating,
        skill: existing.skill === 'WRITING' ? 'WRITING' : 'MEANING',
        evidenceIds: existing.skill === 'WRITING' ? saved?._writingEvidenceIds ?? [] : undefined,
      });
      if (existing.inputHash !== inputHash) {
        return new SrsServiceError(409, 'OPERATION_CONFLICT', 'Mã thao tác đã được sử dụng với nội dung khác.');
      }
      // Older operations have no stored response. The browser can refresh the session.
      if (!saved) return staleCardError();
      const { currentItem, _writingEvidenceIds: _evidenceIds, ...response } = saved;
      return {
        ...response,
        currentItem: currentItem && 'skill' in currentItem
          ? currentItem
          : currentItem ? { cardId: currentItem.cardId, canonicalForm: currentItem.canonicalForm } : null,
      };
    }

    if (session.status === 'EXPIRED') return sessionExpiredError();
    if (session.status === 'COMPLETED') return sessionCompletedError();

    const entries = (session.cardIds as SessionQueueEntry[]).map(normalizeQueueEntry);
    const currentEntry = entries[session.currentIndex];
    if (!currentEntry || currentEntry.cardId !== input.cardId) return staleCardError();
    await tx.$queryRaw`
      SELECT id FROM app.srs_cards
      WHERE id = ${input.cardId}::uuid AND learner_id = ${verifiedUserId}::uuid FOR UPDATE
    `;
    const dbNow = await getDbTime(tx);
    if (dbNow >= session.expiresAt) {
      await expireSession(tx, session, dbNow);
      return sessionExpiredError();
    }
    const card = await tx.srsCard.findUnique({ where: { id: input.cardId, learnerId: verifiedUserId } });
    if (!card) return staleCardError();
    if (currentEntry.skill === 'MEANING' && card.dueAt > dbNow) {
      const state = await reconcileSession(tx, session, dbNow);
      return state.status === 'COMPLETED' ? sessionCompletedError() : staleCardError();
    }

    let priorStage: number | null = null;
    let nextStage: number | null = null;
    let priorState: number | null = null;
    let nextState: number | null = null;
    let priorDueAt: Date | null = null;
    let nextDueAt: Date;
    let schedulerVersion = 'POLICY_B';
    let schedulerLog: Record<string, unknown> | undefined;
    let evidenceIds: string[] | undefined;
    const qualifyingLocalDate = computeQualifyingLocalDate(dbNow, timezone);
    let inputHash: string;

    if (currentEntry.skill === 'MEANING') {
      if (input.rating !== 'REMEMBERED' && input.rating !== 'FORGOTTEN') {
        return new SrsServiceError(400, 'INVALID_RATING', 'Thẻ MEANING chỉ nhận đánh giá Đã nhớ hoặc Chưa nhớ.');
      }
      const scheduleResult = calculatePolicyBSchedule({
        priorStage: card.stage,
        priorDueAt: card.dueAt,
        rating: input.rating,
        reviewedAt: dbNow,
      });
      priorStage = card.stage;
      nextStage = scheduleResult.nextStage;
      priorDueAt = card.dueAt;
      nextDueAt = scheduleResult.nextDueAt;
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
        where: { cardId_skill: { cardId: card.id, skill: 'MEANING' } },
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
      inputHash = computeSessionInputHash({ sessionId, cardId: input.cardId, rating: input.rating });
    } else {
      if (!isWritingSrsEnabled(verifiedUserId)) {
        return new SrsServiceError(404, 'NOT_FOUND', 'Phiên luyện viết không tồn tại.');
      }
      if (input.rating !== 'AGAIN' && input.rating !== 'HARD' && input.rating !== 'GOOD' && input.rating !== 'EASY') {
        return new SrsServiceError(400, 'INVALID_RATING', 'Thẻ WRITING chỉ nhận đánh giá AGAIN, HARD, GOOD hoặc EASY.');
      }
      if (currentEntry.attempts.length !== currentEntry.characters.length) {
        return new SrsServiceError(409, 'WRITING_ATTEMPT_REQUIRED', 'Hãy viết từng ký tự trước khi chọn mức ôn.');
      }
      const writingState = await tx.srsMemoryState.findUnique({
        where: { cardId_skill: { cardId: card.id, skill: 'WRITING' } },
      });
      if (!writingState || writingState.dueAt > dbNow) {
        const state = await reconcileSession(tx, session, dbNow);
        return state.status === 'COMPLETED' ? sessionCompletedError() : staleCardError();
      }
      if (writingState.schedulerVersion !== WRITING_SRS_SCHEDULER_VERSION) {
        return new SrsServiceError(409, 'SCHEDULER_VERSION_UNSUPPORTED', 'Lịch WRITING này cần được nâng cấp trước khi tiếp tục.');
      }
      evidenceIds = currentEntry.attempts.map(attempt => attempt.evidenceId);
      if (new Set(evidenceIds).size !== evidenceIds.length) {
        return new SrsServiceError(409, 'SESSION_DATA_INVALID', 'Bằng chứng WRITING của phiên không hợp lệ.');
      }
      const scheduleResult = scheduleWritingSrsReview({
        state: writingState.state,
        stability: writingState.stability,
        difficulty: writingState.difficulty,
        dueAt: writingState.dueAt,
        lastReviewedAt: writingState.lastReviewedAt,
        count: writingState.count,
        lapse: writingState.lapse,
        scheduledDays: writingState.scheduledDays,
        learningSteps: writingState.learningSteps,
      }, input.rating, dbNow);
      schedulerVersion = scheduleResult.schedulerVersion;
      schedulerLog = scheduleResult.reviewLog;
      priorDueAt = writingState.dueAt;
      nextDueAt = scheduleResult.dueAt;
      priorState = scheduleResult.priorState;
      nextState = scheduleResult.state - 1;
      await tx.srsMemoryState.update({
        where: { id: writingState.id },
        data: {
          schedulerVersion,
          state: scheduleResult.state,
          stability: scheduleResult.stability,
          difficulty: scheduleResult.difficulty,
          dueAt: scheduleResult.dueAt,
          lastReviewedAt: scheduleResult.lastReviewedAt,
          count: scheduleResult.count,
          lapse: scheduleResult.lapse,
          scheduledDays: scheduleResult.scheduledDays,
          learningSteps: scheduleResult.learningSteps,
          rowVersion: writingState.rowVersion + 1n,
        },
      });
      inputHash = computeSessionInputHash({ sessionId, cardId: input.cardId, rating: input.rating, skill: 'WRITING', evidenceIds });
    }

    const next = await findNextDueCard(tx, session, session.currentIndex + 1, dbNow);
    const response = {
      sessionId,
      status: next.item ? 'ACTIVE' : 'COMPLETED',
      progress: {
        currentIndex: next.index,
        completedCount: session.completedCount + 1,
        total: entries.length,
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
        skill: currentEntry.skill,
        schedulerVersion,
        sessionKey: sessionId,
        priorStage,
        nextStage,
        priorState,
        nextState,
        priorDueAt,
        nextDueAt,
        reviewedAt: dbNow,
        qualifyingLocalDate,
        inputHash,
        sessionResponse: {
          ...response,
          currentItem: response.currentItem ? { ...response.currentItem } : null,
          ...(evidenceIds ? { _writingEvidenceIds: evidenceIds } : {}),
        } as unknown as Prisma.InputJsonValue,
        ...(schedulerLog ? { schedulerLog: schedulerLog as Prisma.InputJsonValue } : {}),
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
