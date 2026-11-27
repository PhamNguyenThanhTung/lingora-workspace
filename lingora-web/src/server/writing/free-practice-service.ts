import 'server-only';
import { getLearnerPrisma } from '../db/index.ts';
import { isValidUuid, LessonServiceError } from '../lessons/dto.ts';
import { ownedContext } from '../lessons/service.ts';
import type { LearnerStrokeTemplateDto } from '../lessons/character-service.ts';
import type { WritingSessionDto } from './session-service.ts';

/**
 * Standalone writing practice ("Luyện viết"): characters of the learner's course language, independent of any lesson.
 * Attempts and completion reuse the session-scoped endpoints/services; only listing, template loading and session start live here.
 */

export interface FreePracticeCharacterDto {
  characterId: string;
  glyph: string;
  scriptType: string;
  strokeCount: number;
  meaning: string | null;
  reading: string | null;
  romanization: string | null;
  attempts: number;
  bestScore: number | null;
}

export interface FreePracticeCharacterDetailDto {
  characterId: string;
  glyph: string;
  scriptType: string;
  strokeCount: number;
  meaning: string | null;
  primaryReading: string | null;
  romanization: string | null;
  strokeVersion: number;
  strokes: LearnerStrokeTemplateDto[];
}

function fail(status: number, code: string, message: string): never {
  throw new LessonServiceError(status, code, message);
}

function isUniqueConflict(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2002');
}

export async function listFreePracticeCharacters(contextId: string, verifiedUserId: string): Promise<FreePracticeCharacterDto[]> {
  if (!isValidUuid(contextId)) fail(400, 'VALIDATION_ERROR', 'contextId phải là UUID hợp lệ.');
  const db: any = getLearnerPrisma();
  const context = await ownedContext(db, contextId.toLowerCase(), verifiedUserId);

  const characters = await db.writingCharacter.findMany({
    where: { languageId: context.course.languageId, strokeData: { isNot: null } },
    select: { id: true, glyph: true, scriptType: true, strokeCount: true, meaning: true, primaryReading: true, romanization: true },
    orderBy: [{ scriptType: 'asc' }, { strokeCount: 'asc' }, { glyph: 'asc' }],
  });
  const grouped = await db.writingAttempt.groupBy({
    by: ['characterId'],
    where: { learnerId: verifiedUserId, characterId: { in: characters.map((c: any) => c.id) } },
    _count: { _all: true },
    _max: { score: true },
  });
  const stats = new Map<string, { attempts: number; best: number | null }>(
    grouped.map((g: any) => [g.characterId, { attempts: g._count._all, best: g._max.score ?? null }])
  );

  return characters.map((c: any) => ({
    characterId: c.id,
    glyph: c.glyph,
    scriptType: c.scriptType,
    strokeCount: c.strokeCount,
    meaning: c.meaning,
    reading: c.primaryReading,
    romanization: c.romanization,
    attempts: stats.get(c.id)?.attempts ?? 0,
    bestScore: stats.get(c.id)?.best ?? null,
  }));
}

async function loadCharacterWithStrokes(db: any, languageId: string, characterId: string) {
  const character = await db.writingCharacter.findFirst({
    where: { id: characterId, languageId },
    include: { strokeData: true },
  });
  if (!character || !character.strokeData || !Array.isArray(character.strokeData.strokes) || character.strokeData.strokes.length === 0) {
    fail(404, 'NOT_FOUND', 'Ký tự không tồn tại hoặc chưa có dữ liệu nét viết.');
  }
  return character;
}

export async function loadFreePracticeCharacter(
  contextId: string,
  characterId: string,
  verifiedUserId: string
): Promise<FreePracticeCharacterDetailDto> {
  if (!isValidUuid(contextId) || !isValidUuid(characterId)) fail(400, 'VALIDATION_ERROR', 'contextId và characterId phải là UUID hợp lệ.');
  const db: any = getLearnerPrisma();
  const context = await ownedContext(db, contextId.toLowerCase(), verifiedUserId);
  const character = await loadCharacterWithStrokes(db, context.course.languageId, characterId.toLowerCase());
  return {
    characterId: character.id,
    glyph: character.glyph,
    scriptType: character.scriptType,
    strokeCount: character.strokeCount,
    meaning: character.meaning,
    primaryReading: character.primaryReading,
    romanization: character.romanization,
    strokeVersion: character.strokeData.version,
    strokes: (character.strokeData.strokes as any[]).map((s) => ({ index: s.index, path: s.path, points: s.points })),
  };
}

export async function startFreePracticeSession(input: {
  contextId: string;
  characterId: string;
  operationKey: string;
  verifiedUserId: string;
}): Promise<WritingSessionDto> {
  const { contextId, characterId, operationKey, verifiedUserId } = input;
  if (!isValidUuid(contextId) || !isValidUuid(characterId) || !isValidUuid(operationKey)) {
    fail(400, 'VALIDATION_ERROR', 'contextId, characterId và requestId phải là UUID hợp lệ.');
  }
  const cleanOp = operationKey.toLowerCase();
  const db: any = getLearnerPrisma();

  const run = async (): Promise<WritingSessionDto> => {
    const context = await ownedContext(db, contextId.toLowerCase(), verifiedUserId);
    const account = await db.account.findUnique({ where: { id: verifiedUserId }, select: { role: true, status: true } });
    if (!account || account.role !== 'LEARNER' || account.status !== 'ACTIVE') fail(403, 'ACCOUNT_INACTIVE', 'Tài khoản học viên không hoạt động.');
    const character = await loadCharacterWithStrokes(db, context.course.languageId, characterId.toLowerCase());

    const toDto = (session: any, isReplay: boolean): WritingSessionDto => ({
      sessionId: session.id,
      learnerId: session.learnerId,
      contextId: session.contextId,
      lessonId: null,
      lessonRevisionId: null,
      practiceKind: 'FREE',
      characterId: session.characterId,
      glyph: character.glyph,
      strokeCount: character.strokeCount,
      strokeVersion: session.strokeVersion,
      status: session.status,
      startedAt: session.startedAt.toISOString(),
      rowVersion: session.rowVersion.toString(),
      isReplay,
    });

    const existing = await db.writingSession.findFirst({ where: { learnerId: verifiedUserId, operationKey: cleanOp } });
    if (existing) {
      if (existing.practiceKind !== 'FREE' || existing.contextId !== context.id || existing.characterId !== character.id) {
        fail(409, 'OPERATION_CONFLICT', 'Khóa thao tác đã được dùng cho phiên luyện viết khác.');
      }
      return toDto(existing, true);
    }

    const created = await db.writingSession.create({
      data: {
        learnerId: verifiedUserId,
        contextId: context.id,
        practiceKind: 'FREE',
        characterId: character.id,
        strokeVersion: character.strokeData.version,
        operationKey: cleanOp,
        sourceKey: 'free',
      },
    });
    return toDto(created, false);
  };

  try {
    return await run();
  } catch (error) {
    if (isUniqueConflict(error)) return run();
    throw error;
  }
}
