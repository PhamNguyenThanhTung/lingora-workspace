import { getProductPrisma } from '../db/index.js';
import type { PrismaClient } from '../../../generated/product-client/index.js';
import {
  validateCharacterInput,
  validateAndNormalizeGlyph,
  type CreateWritingCharacterInput,
  type WritingScriptType,
} from './validator.ts';

export interface ListCharactersParams {
  languageId: string;
  scriptType?: WritingScriptType;
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * Creates a new writing character in the catalogue.
 * Validates input, normalizes glyph to NFC, and enforces language scoping and constraints.
 */
export async function createCharacter(
  input: unknown,
  db?: PrismaClient
) {
  const validation = validateCharacterInput(input);
  if (!validation.success) {
    const error = new Error('Invalid character catalogue input');
    (error as any).code = 'VALIDATION_ERROR';
    (error as any).details = validation.error.format();
    throw error;
  }

  const client = db ?? getProductPrisma();
  const validData = validation.data;

  return client.writingCharacter.create({
    data: {
      ...(validData.id ? { id: validData.id } : {}),
      languageId: validData.languageId,
      glyph: validData.glyph,
      scriptType: validData.scriptType,
      meaning: validData.meaning ?? null,
      primaryReading: validData.primaryReading ?? null,
      romanization: validData.romanization ?? null,
      strokeCount: validData.strokeCount,
      metadata: validData.metadata as any,
    },
  });
}

/**
 * Retrieves a character by its ID, strictly scoped by languageId.
 * Returns null if the character does not exist or does not belong to the specified language.
 */
export async function getCharacterById(
  languageId: string,
  id: string,
  db?: PrismaClient
) {
  if (!languageId || !id) return null;
  const client = db ?? getProductPrisma();

  return client.writingCharacter.findFirst({
    where: {
      id,
      languageId,
    },
  });
}

/**
 * Retrieves a character by glyph, strictly scoped by languageId.
 * The glyph is normalized to NFC before lookup.
 */
export async function getCharacterByGlyph(
  languageId: string,
  rawGlyph: string,
  db?: PrismaClient
) {
  if (!languageId || !rawGlyph) return null;
  const norm = validateAndNormalizeGlyph(rawGlyph);
  if (!norm.valid) return null;

  const client = db ?? getProductPrisma();

  return client.writingCharacter.findUnique({
    where: {
      languageId_glyph: {
        languageId,
        glyph: norm.glyph,
      },
    },
  });
}

/**
 * Lists characters scoped by languageId, optionally filtered by scriptType or search string.
 * Result set is paginated and ordered deterministically by stroke count then glyph.
 */
export async function listCharacters(
  params: ListCharactersParams,
  db?: PrismaClient
) {
  const { languageId, scriptType, limit = 50, offset = 0, search } = params;
  if (!languageId) {
    throw new Error('languageId is required for character lookup');
  }

  const client = db ?? getProductPrisma();
  const clampedLimit = Math.max(1, Math.min(limit, 100));
  const clampedOffset = Math.max(0, offset);

  const where: any = {
    languageId,
    ...(scriptType ? { scriptType } : {}),
  };

  if (search && search.trim()) {
    const trimmed = search.trim();
    where.OR = [
      { glyph: { contains: trimmed } },
      { meaning: { contains: trimmed, mode: 'insensitive' } },
      { primaryReading: { contains: trimmed, mode: 'insensitive' } },
      { romanization: { contains: trimmed, mode: 'insensitive' } },
    ];
  }

  return client.writingCharacter.findMany({
    where,
    orderBy: [
      { strokeCount: 'asc' },
      { glyph: 'asc' },
    ],
    take: clampedLimit,
    skip: clampedOffset,
  });
}

/**
 * Counts characters scoped by languageId, optionally filtered by scriptType.
 */
export async function countCharacters(
  params: { languageId: string; scriptType?: WritingScriptType },
  db?: PrismaClient
): Promise<number> {
  const { languageId, scriptType } = params;
  if (!languageId) return 0;

  const client = db ?? getProductPrisma();
  return client.writingCharacter.count({
    where: {
      languageId,
      ...(scriptType ? { scriptType } : {}),
    },
  });
}
