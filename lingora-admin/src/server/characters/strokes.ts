import { getProductPrisma } from '../db/index.js';
import type { PrismaClient } from '../../../generated/product-client/index.js';
import { isDeepStrictEqual } from 'node:util';
import {
  validateStrokeDataInput,
  validateAndNormalizeGlyph,
  type CharacterStrokeDataInput,
  type Stroke,
} from './validator.ts';

export interface StrokeConflictError extends Error {
  code: 'STROKE_DATA_CONFLICT';
}

/**
 * Checks whether two stroke arrays or datasets are strictly equal in structure and geometry.
 */
export function areStrokesEqual(existingStrokes: unknown, newStrokes: unknown): boolean {
  return isDeepStrictEqual(existingStrokes, newStrokes);
}

/**
 * Seeds stroke data for a WritingCharacter idempotently.
 * 1. Checks that the character exists in the catalogue.
 * 2. Validates input against catalogue strokeCount and coordinate bounds.
 * 3. If stroke data already exists:
 *    - If identical (version, source, license, provenance, and canonical strokes): returns existing record (idempotent replay).
 *    - If differing in any field: throws a STROKE_DATA_CONFLICT error without modifying existing data.
 * 4. If not exists: inserts the new CharacterStrokeData record.
 */
export async function seedCharacterStrokeData(
  input: unknown,
  db?: PrismaClient
) {
  const client = db ?? getProductPrisma();
  const raw = input as any;

  if (!raw || typeof raw !== 'object' || !raw.characterId) {
    const err = new Error('characterId is required for stroke data');
    (err as any).code = 'VALIDATION_ERROR';
    throw err;
  }

  // 1. Ensure target character exists in catalogue
  const character = await client.writingCharacter.findUnique({
    where: { id: raw.characterId },
  });

  if (!character) {
    const err = new Error(`Character with ID "${raw.characterId}" does not exist in catalogue`);
    (err as any).code = 'CHARACTER_NOT_FOUND';
    throw err;
  }

  // 2. Validate stroke data input strictly against character strokeCount
  const validation = validateStrokeDataInput(input, character.strokeCount);
  if (!validation.success) {
    const err = new Error('Invalid stroke data input');
    (err as any).code = 'VALIDATION_ERROR';
    (err as any).details = validation.error;
    throw err;
  }

  const validData = validation.data;

  // 3. Check for existing stroke data on this character
  const existing = await client.characterStrokeData.findUnique({
    where: { characterId: validData.characterId },
  });

  if (existing) {
    // Compare canonical points/path and provenance exactly
    const canonicalInputProvenance = JSON.parse(JSON.stringify(validData.provenance));
    const canonicalInputStrokes = JSON.parse(JSON.stringify(validData.strokes));

    const sameVersion = existing.version === validData.version;
    const sameSource = existing.source.trim() === validData.source.trim();
    const sameLicense = existing.license.trim() === validData.license.trim();
    const sameProvenance = isDeepStrictEqual(existing.provenance, canonicalInputProvenance);
    const sameStrokes = isDeepStrictEqual(existing.strokes, canonicalInputStrokes);

    if (sameVersion && sameSource && sameLicense && sameProvenance && sameStrokes) {
      return existing;
    }

    const conflictErr = new Error(
      `Stroke data conflict: character "${validData.characterId}" already has conflicting stroke data (version ${existing.version})`
    );
    (conflictErr as any).code = 'STROKE_DATA_CONFLICT';
    throw conflictErr;
  }

  // 4. Create new stroke data record
  return client.characterStrokeData.create({
    data: {
      characterId: validData.characterId,
      version: validData.version,
      strokes: validData.strokes as any,
      source: validData.source,
      license: validData.license,
      provenance: validData.provenance as any,
    },
  });
}

/**
 * Retrieves stroke data for a character, strictly scoped by languageId.
 * Returns null if the character does not exist, belongs to a different language,
 * or has no stroke data attached.
 */
export async function getCharacterStrokeData(
  languageId: string,
  characterId: string,
  db?: PrismaClient
) {
  if (!languageId || !characterId) return null;
  const client = db ?? getProductPrisma();

  const character = await client.writingCharacter.findFirst({
    where: {
      id: characterId,
      languageId,
    },
    include: {
      strokeData: true,
    },
  });

  if (!character || !character.strokeData) {
    return null;
  }

  return character.strokeData;
}

/**
 * Retrieves stroke data by glyph, strictly scoped by languageId.
 * Normalizes glyph to NFC before lookup.
 */
export async function getCharacterStrokeDataByGlyph(
  languageId: string,
  rawGlyph: string,
  db?: PrismaClient
) {
  if (!languageId || !rawGlyph) return null;
  const norm = validateAndNormalizeGlyph(rawGlyph);
  if (!norm.valid) return null;

  const client = db ?? getProductPrisma();

  const character = await client.writingCharacter.findUnique({
    where: {
      languageId_glyph: {
        languageId,
        glyph: norm.glyph,
      },
    },
    include: {
      strokeData: true,
    },
  });

  if (!character || !character.strokeData) {
    return null;
  }

  return character.strokeData;
}

/**
 * Retrieves a character together with its stroke data, strictly scoped by languageId.
 */
export async function getCharacterWithStrokes(
  languageId: string,
  characterId: string,
  db?: PrismaClient
) {
  if (!languageId || !characterId) return null;
  const client = db ?? getProductPrisma();

  return client.writingCharacter.findFirst({
    where: {
      id: characterId,
      languageId,
    },
    include: {
      strokeData: true,
    },
  });
}
