import { z } from 'zod';
import {
  blockKeySchema,
  blockPositionSchema,
  blockSchemaVersionSchema,
} from './schema.ts';

// =============================================================================
// Author Input Schema (Teacher / Studio Submission)
// =============================================================================

/**
 * Author input payload is strictly characterId UUID and four boolean flags:
 * - showMeaning: boolean
 * - showReading: boolean
 * - showStrokeAnimation: boolean
 * guidedWriting: boolean
 *
 * It MUST reject any snapshot, stroke, or geometry fields (strict object).
 */
export const characterBlockAuthorInputContentSchema = z
  .object({
    characterId: z
      .string({ message: 'characterId phải là chuỗi ký tự' })
      .uuid('characterId phải là UUID hợp lệ'),
    showMeaning: z.boolean({ message: 'showMeaning phải là boolean' }),
    showReading: z.boolean({ message: 'showReading phải là boolean' }),
    showStrokeAnimation: z.boolean({ message: 'showStrokeAnimation phải là boolean' }),
    guidedWriting: z.boolean({ message: 'guidedWriting phải là boolean' }),
  })
  .strict();

export type CharacterBlockAuthorInputContent = z.infer<
  typeof characterBlockAuthorInputContentSchema
>;

export const characterBlockAuthorInputSchema = z
  .object({
    blockKey: blockKeySchema,
    type: z.literal('CHARACTER'),
    position: blockPositionSchema,
    schemaVersion: blockSchemaVersionSchema,
    content: characterBlockAuthorInputContentSchema,
  })
  .strict();

export type CharacterBlockAuthorInput = z.infer<
  typeof characterBlockAuthorInputSchema
>;

export function validateCharacterBlockAuthorInput(
  input: unknown
): CharacterBlockAuthorInput {
  return characterBlockAuthorInputSchema.parse(input);
}

// =============================================================================
// Server-Resolved Authoritative Character Metadata Snapshot Schema
// =============================================================================

export const CHARACTER_SCRIPT_TYPES = [
  'HIRAGANA',
  'KATAKANA',
  'KANJI',
  'HANZI_SIMPLIFIED',
  'HANZI_TRADITIONAL',
] as const;

export type CharacterScriptType = (typeof CHARACTER_SCRIPT_TYPES)[number];

/**
 * Authoritative character metadata snapshot pinned into the canonical block by the server.
 * Includes character catalogue metadata and optional pinned stroke version.
 * Strictly forbids raw stroke geometry (strokes, points, path).
 */
export const characterSnapshotSchema = z
  .object({
    glyph: z
      .string({ message: 'glyph phải là chuỗi ký tự' })
      .trim()
      .min(1, 'glyph không được để trống'),
    scriptType: z.enum(CHARACTER_SCRIPT_TYPES, {
      message:
        'scriptType phải là một trong: HIRAGANA, KATAKANA, KANJI, HANZI_SIMPLIFIED, HANZI_TRADITIONAL',
    }),
    strokeCount: z
      .number({ message: 'strokeCount phải là số nguyên' })
      .int('strokeCount phải là số nguyên')
      .min(1, 'strokeCount phải từ 1 trở lên')
      .max(128, 'strokeCount tối đa 128 nét'),
    meaning: z.string().trim().max(1000).optional().nullable(),
    primaryReading: z.string().trim().max(500).optional().nullable(),
    romanization: z.string().trim().max(500).optional().nullable(),
    metadata: z.record(z.string(), z.unknown()).optional().default({}),
    strokeVersion: z
      .number({ message: 'strokeVersion phải là số nguyên' })
      .int('strokeVersion phải là số nguyên')
      .positive('strokeVersion phải lớn hơn 0')
      .optional()
      .nullable(),
  })
  .strict();

export type CharacterSnapshot = z.infer<typeof characterSnapshotSchema>;

// =============================================================================
// Persisted Canonical Block Schema (Server-Authored / Resolved)
// =============================================================================

export const characterBlockPersistedContentSchema = z
  .object({
    characterId: z
      .string({ message: 'characterId phải là chuỗi ký tự' })
      .uuid('characterId phải là UUID hợp lệ'),
    showMeaning: z.boolean({ message: 'showMeaning phải là boolean' }),
    showReading: z.boolean({ message: 'showReading phải là boolean' }),
    showStrokeAnimation: z.boolean({ message: 'showStrokeAnimation phải là boolean' }),
    guidedWriting: z.boolean({ message: 'guidedWriting phải là boolean' }),
    snapshot: characterSnapshotSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    const requiresPin = data.showStrokeAnimation || data.guidedWriting;
    const hasPin =
      typeof data.snapshot?.strokeVersion === 'number' &&
      Number.isInteger(data.snapshot.strokeVersion) &&
      data.snapshot.strokeVersion > 0;

    if (requiresPin && !hasPin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['snapshot', 'strokeVersion'],
        message:
          'Bắt buộc ghim phiên bản nét (snapshot.strokeVersion) là số nguyên dương khi bật hoạt ảnh nét hoặc hướng dẫn viết',
      });
    }
  });

export type CharacterBlockPersistedContent = z.infer<
  typeof characterBlockPersistedContentSchema
>;

export const characterBlockPersistedSchema = z
  .object({
    blockKey: blockKeySchema,
    type: z.literal('CHARACTER'),
    position: blockPositionSchema,
    schemaVersion: blockSchemaVersionSchema,
    content: characterBlockPersistedContentSchema,
  })
  .strict();

export type CharacterBlockPersisted = z.infer<
  typeof characterBlockPersistedSchema
>;

export function validateCharacterBlockPersisted(
  input: unknown
): CharacterBlockPersisted {
  return characterBlockPersistedSchema.parse(input);
}
