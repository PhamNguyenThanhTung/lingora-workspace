import { getProductPrisma } from '../db/index.js';
import type { PrismaClient } from '../../../generated/product-client/index.js';

export interface VocabularyConflictError extends Error {
  code: 'VOCABULARY_CHARACTER_CONFLICT';
  details?: unknown;
}

export interface VocabularyNotFoundError extends Error {
  code: 'VOCABULARY_NOT_FOUND';
}

export interface ComputedCharacterMapping {
  characterId: string;
  position: number;
  glyph: string;
}

const defaultGraphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * Segments a string into Unicode grapheme clusters using Intl.Segmenter.
 * Uses standard Unicode UAX #29 grapheme cluster boundaries independent of DB Language.code.
 */
export function segmentCanonicalForm(canonicalForm: string, _locale?: string): string[] {
  if (!canonicalForm || typeof canonicalForm !== 'string') return [];
  return Array.from(defaultGraphemeSegmenter.segment(canonicalForm)).map((s) => s.segment);
}

/**
 * Pure function helper that computes grapheme-to-character mappings against a provided catalogue.
 * - Positions are 1-based according to the grapheme index in canonicalForm.
 * - Non-catalogue graphemes are omitted, but subsequent graphemes keep their original 1-based positions.
 * - Repeated glyphs are supported and mapped to their respective distinct positions.
 */
export function computeVocabularyCharacterMapping(
  canonicalForm: string,
  catalogueCharacters: Array<{ id: string; glyph: string }>,
  _locale?: string
): ComputedCharacterMapping[] {
  if (!canonicalForm || typeof canonicalForm !== 'string') return [];
  const segments = segmentCanonicalForm(canonicalForm);
  if (segments.length === 0) return [];

  const charMap = new Map<string, { id: string; glyph: string }>();
  for (const c of catalogueCharacters) {
    charMap.set(c.glyph.normalize('NFC'), c);
  }

  const result: ComputedCharacterMapping[] = [];
  for (let i = 0; i < segments.length; i++) {
    const nfcGlyph = segments[i].normalize('NFC');
    const matched = charMap.get(nfcGlyph);
    if (matched) {
      result.push({
        characterId: matched.id,
        position: i + 1,
        glyph: matched.glyph,
      });
    }
  }

  return result;
}

export interface MapVocabularyOptions {
  db?: PrismaClient;
  [key: string]: unknown;
}

/**
 * Maps a vocabulary concept to writing characters from the catalogue.
 *
 * Requirements & Contract:
 * 1. Default source of truth is vocabulary and catalogue DB rows, not caller-supplied glyphs or language.
 * 2. Requires a real PostgreSQL transaction. Acquires an exclusive row lock (SELECT ... FOR UPDATE)
 *    on the target vocabulary_concepts row before reading vocabulary state or existing mappings.
 * 3. Segments canonicalForm using standard Unicode grapheme cluster boundaries, normalizes with NFC,
 *    and looks up matching WritingCharacter rows scoped strictly by VocabularyConcept.languageId.
 * 4. Reuses computeVocabularyCharacterMapping pure algorithm for 1-based positions, repeats, and gap preservation.
 * 5. Handles concurrent requests safely:
 *    - Saves new mappings if none existed previously.
 *    - If mappings already exist (including concurrent commit):
 *      * Confirms idempotent replay if existing records match computed mapping identically.
 *      * Throws VOCABULARY_CHARACTER_CONFLICT if existing mapping diverges from current computed result,
 *        leaving database records completely untouched.
 */
export async function mapVocabularyCharacters(
  input: string | { vocabularyId: string; [key: string]: unknown },
  optionsOrDb?: PrismaClient | MapVocabularyOptions
) {
  let vocabularyId: string;
  let client: PrismaClient | undefined;

  if (typeof input === 'string') {
    vocabularyId = input;
    if (optionsOrDb && 'vocabularyConcept' in (optionsOrDb as any)) {
      client = optionsOrDb as PrismaClient;
    } else if (optionsOrDb && typeof optionsOrDb === 'object' && 'db' in optionsOrDb) {
      client = (optionsOrDb as MapVocabularyOptions).db;
    }
  } else if (input && typeof input === 'object') {
    if (!input.vocabularyId || typeof input.vocabularyId !== 'string') {
      const err = new Error('vocabularyId is required for character mapping');
      (err as any).code = 'VALIDATION_ERROR';
      throw err;
    }
    vocabularyId = input.vocabularyId;
    if (optionsOrDb && 'vocabularyConcept' in (optionsOrDb as any)) {
      client = optionsOrDb as PrismaClient;
    } else if (optionsOrDb && typeof optionsOrDb === 'object' && 'db' in optionsOrDb) {
      client = (optionsOrDb as MapVocabularyOptions).db;
    }
  } else {
    const err = new Error('Invalid input: expected vocabularyId string or object with vocabularyId');
    (err as any).code = 'VALIDATION_ERROR';
    throw err;
  }

  const prisma = client ?? getProductPrisma();

  if (typeof (prisma as any).$transaction !== 'function') {
    const err = new Error('mapVocabularyCharacters requires an active PrismaClient with transaction support');
    (err as any).code = 'TRANSACTION_REQUIRED';
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    // 1. Acquire an exclusive row lock on the target vocabulary_concepts row before reading vocabulary or mappings
    const lockedRows = await tx.$queryRaw<Array<{ id: string; language_id: string; canonical_form: string }>>`
      SELECT id, language_id, canonical_form
      FROM app.vocabulary_concepts
      WHERE id = ${vocabularyId}::uuid
      FOR UPDATE
    `;

    if (!lockedRows || lockedRows.length === 0) {
      const notFoundErr = new Error(`Vocabulary concept with ID "${vocabularyId}" not found`);
      (notFoundErr as any).code = 'VOCABULARY_NOT_FOUND';
      throw notFoundErr;
    }

    const lockedVocab = lockedRows[0];
    const canonicalForm = lockedVocab.canonical_form;
    const languageId = lockedVocab.language_id;

    // 2. Segment canonicalForm using Unicode grapheme cluster rules
    const segments = segmentCanonicalForm(canonicalForm);

    // 3. Query catalogue writing characters scoped strictly to vocabulary's languageId
    const uniqueNfcGlyphs = Array.from(
      new Set(segments.map((s) => s.normalize('NFC')))
    );

    const catalogueChars =
      uniqueNfcGlyphs.length > 0
        ? await tx.writingCharacter.findMany({
            where: {
              languageId,
              glyph: { in: uniqueNfcGlyphs },
            },
            select: {
              id: true,
              glyph: true,
            },
          })
        : [];

    // 4. Compute expected mappings using the pure mapping algorithm (reusing position calculation)
    const computed = computeVocabularyCharacterMapping(canonicalForm, catalogueChars);
    const expectedMappings = computed.map((c) => ({
      vocabularyId: lockedVocab.id,
      characterId: c.characterId,
      position: c.position,
    }));

    // 5. Fetch existing mappings for this vocabulary (under the row lock)
    const existingMappings = await tx.vocabularyCharacter.findMany({
      where: { vocabularyId: lockedVocab.id },
      orderBy: { position: 'asc' },
    });

    // 6. Handle initial mapping vs idempotent replay vs conflict
    if (existingMappings.length === 0) {
      if (expectedMappings.length === 0) {
        return [];
      }

      await tx.vocabularyCharacter.createMany({
        data: expectedMappings,
      });

      return tx.vocabularyCharacter.findMany({
        where: { vocabularyId: lockedVocab.id },
        orderBy: { position: 'asc' },
        include: {
          character: true,
        },
      });
    }

    // Existing mappings exist: verify if strictly identical
    const isIdentical =
      existingMappings.length === expectedMappings.length &&
      existingMappings.every((existing, idx) => {
        const exp = expectedMappings[idx];
        return (
          existing.position === exp.position &&
          existing.characterId === exp.characterId
        );
      });

    if (isIdentical) {
      return tx.vocabularyCharacter.findMany({
        where: { vocabularyId: lockedVocab.id },
        orderBy: { position: 'asc' },
        include: {
          character: true,
        },
      });
    }

    // Divergent mapping detected: reject with conflict error, preserving existing data
    const conflictErr = new Error(
      `Character mapping conflict for vocabulary "${lockedVocab.id}": existing mapping diverges from newly computed catalogue mapping`
    );
    (conflictErr as any).code = 'VOCABULARY_CHARACTER_CONFLICT';
    (conflictErr as any).details = {
      vocabularyId: lockedVocab.id,
      canonicalForm,
      existing: existingMappings.map((m) => ({
        position: m.position,
        characterId: m.characterId,
      })),
      expected: expectedMappings.map((m) => ({
        position: m.position,
        characterId: m.characterId,
      })),
    };
    throw conflictErr;
  });
}

/**
 * Retrieves character mappings for a vocabulary concept, ordered by position ascending.
 * Includes writing character details (without exposing stroke data at this checkpoint).
 */
export async function getVocabularyCharacters(
  vocabularyId: string,
  db?: PrismaClient
) {
  if (!vocabularyId) return [];
  const client = db ?? getProductPrisma();

  return client.vocabularyCharacter.findMany({
    where: { vocabularyId },
    orderBy: { position: 'asc' },
    include: {
      character: true,
    },
  });
}

/**
 * Retrieves character mappings strictly scoped by languageId.
 * Constrains both vocabulary language and character language in the query.
 * Returns null if the vocabulary does not belong to the given languageId or does not exist.
 */
export async function getVocabularyCharactersScoped(
  languageId: string,
  vocabularyId: string,
  db?: PrismaClient
) {
  if (!languageId || !vocabularyId) return null;
  const client = db ?? getProductPrisma();

  const vocab = await client.vocabularyConcept.findFirst({
    where: {
      id: vocabularyId,
      languageId,
    },
  });

  if (!vocab) return null;

  return client.vocabularyCharacter.findMany({
    where: {
      vocabularyId,
      vocabulary: {
        languageId,
      },
      character: {
        languageId,
      },
    },
    orderBy: { position: 'asc' },
    include: {
      character: true,
    },
  });
}
