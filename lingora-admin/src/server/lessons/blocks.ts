import type {
  LessonBlock,
  CharacterBlockPersisted,
  CharacterSnapshot,
  CharacterScriptType,
} from '@lingora/lesson-content';
import {
  validateLessonBlocks,
  validateCharacterBlockPersisted,
  characterSnapshotSchema,
  lessonBlockSchema,
  MAX_BLOCKS_PER_REVISION,
  MAX_BLOCK_PAYLOAD_BYTES,
} from '@lingora/lesson-content';
import { ControlledDraftError, type TeacherLessonAuthorBlock } from './content.ts';
import { writingCharacterMetadataSchema } from '../characters/validator.ts';

export { validateLessonBlocks, toLegacyParagraphProjection } from '@lingora/lesson-content';
export type PersistedLessonBlock = LessonBlock | CharacterBlockPersisted;

/**
 * Validates a single canonical persisted lesson block.
 * For CHARACTER blocks, validates against the authoritative persisted schema (including snapshot shape).
 * For other block types, validates against the standard V1 lesson block schema.
 */
export function validatePersistedLessonBlock(block: unknown): PersistedLessonBlock {
  if (typeof block !== 'object' || block === null) {
    throw new Error('Khối nội dung phải là đối tượng hợp lệ.');
  }
  const type = (block as any).type;
  if (type === 'CHARACTER') {
    return validateCharacterBlockPersisted(block);
  }
  return lessonBlockSchema.parse(block) as LessonBlock;
}

/**
 * Validates a collection of canonical persisted lesson blocks.
 * Preserves structural constraints:
 * - max MAX_BLOCKS_PER_REVISION (50) blocks
 * - max MAX_BLOCK_PAYLOAD_BYTES (1 MiB) UTF-8 canonical JSON block collection limit
 * - unique normalized blockKey
 * - unique position
 * - strictly conforms to persisted block schemas (persisted CHARACTER schema with snapshot, or standard V1 block schema)
 */
export function validatePersistedLessonBlocks(rawBlocks: unknown): PersistedLessonBlock[] {
  if (!Array.isArray(rawBlocks)) {
    throw new Error('Danh sách khối nội dung phải là mảng.');
  }
  if (rawBlocks.length > MAX_BLOCKS_PER_REVISION) {
    throw new Error(`Tối đa ${MAX_BLOCKS_PER_REVISION} khối nội dung trong một bài học.`);
  }

  // Project canonical fields, excluding Prisma row metadata (id, lessonRevisionId, createdAt, etc.)
  const projectedBlocks: unknown[] = [];
  for (const raw of rawBlocks) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      throw new Error('Khối nội dung phải là đối tượng.');
    }
    const { blockKey, type, position, schemaVersion, content } = raw as Record<string, unknown>;
    projectedBlocks.push({ blockKey, type, position, schemaVersion, content });
  }

  // 1 MiB UTF-8 canonical JSON block collection limit, with same semantics as validateLessonBlocks
  const serialized = JSON.stringify(projectedBlocks);
  if (new TextEncoder().encode(serialized).length > MAX_BLOCK_PAYLOAD_BYTES) {
    throw new Error('Tổng kích thước nội dung các khối vượt quá giới hạn 1 MiB.');
  }

  const keySet = new Set<string>();
  const posSet = new Set<number>();
  const validatedBlocks: PersistedLessonBlock[] = [];

  for (const blockPayload of projectedBlocks) {
    const validated = validatePersistedLessonBlock(blockPayload);

    if (keySet.has(validated.blockKey)) {
      throw new Error(`Khóa khối nội dung (blockKey) không được trùng lặp: ${validated.blockKey}`);
    }
    keySet.add(validated.blockKey);

    if (posSet.has(validated.position)) {
      throw new Error(`Thứ tự vị trí (position) của các khối không được trùng lặp: ${validated.position}`);
    }
    posSet.add(validated.position);

    validatedBlocks.push(validated);
  }

  return validatedBlocks;
}

/**
 * Validates persisted CHARACTER references and stroke data pins against the course language catalogue.
 * Scoped strictly by courseLanguageId.
 * For blocks requiring strokes (showStrokeAnimation || guidedWriting), matches exact current stroke version.
 * For static blocks (showStrokeAnimation === false && guidedWriting === false), stroke data is optional.
 * Historical snapshot text is read-only and never refreshed.
 */
export async function validatePersistedRevisionCharacterBlocks(
  tx: any,
  courseLanguageId: string,
  rawBlocks: unknown
): Promise<void> {
  if (!Array.isArray(rawBlocks) || rawBlocks.length === 0) {
    return;
  }

  const charBlocks: { blockKey: string; content: any }[] = [];
  for (const raw of rawBlocks) {
    if (typeof raw === 'object' && raw !== null && (raw as any).type === 'CHARACTER') {
      charBlocks.push(raw as any);
    }
  }

  if (charBlocks.length === 0) {
    return;
  }

  const uniqueCharIds = [
    ...new Set(
      charBlocks
        .map(b => b.content?.characterId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
        .map(id => id.toLowerCase())
    ),
  ];

  if (uniqueCharIds.length === 0) {
    return;
  }

  // Scoped lookup in catalogue
  const characters = await tx.writingCharacter.findMany({
    where: {
      id: { in: uniqueCharIds },
      languageId: courseLanguageId.toLowerCase(),
    },
    select: {
      id: true,
      glyph: true,
      strokeData: {
        select: {
          version: true,
        },
      },
    },
  });

  const charMap = new Map<string, (typeof characters)[number]>();
  for (const char of characters) {
    charMap.set(char.id.toLowerCase(), char);
  }

  for (const block of charBlocks) {
    const charId = String(block.content?.characterId || '').toLowerCase();
    const char = charMap.get(charId);

    // Missing from DB or from different language
    if (!char) {
      throw new ControlledDraftError(400, {
        code: 'VALIDATION_ERROR',
        message: 'Ký tự không tồn tại trong danh mục ký tự của khóa học.',
      });
    }

    const requiresStrokes = Boolean(
      block.content?.showStrokeAnimation || block.content?.guidedWriting
    );

    if (requiresStrokes) {
      const pinnedVersion = block.content?.snapshot?.strokeVersion;
      const currentVersion = char.strokeData?.version;

      if (
        typeof currentVersion !== 'number' ||
        !Number.isInteger(currentVersion) ||
        currentVersion <= 0 ||
        currentVersion !== pinnedVersion
      ) {
        throw new ControlledDraftError(400, {
          code: 'VALIDATION_ERROR',
          message: `Dữ liệu nét của ký tự "${char.glyph}" không còn khả dụng hoặc phiên bản nét đã thay đổi. Vui lòng cập nhật bản nháp.`,
        });
      }
    }
  }
}

/**
 * Resolves teacher author blocks into canonical persisted blocks.
 * For CHARACTER blocks, queries the catalogue scoped to the course target language,
 * selects required metadata, pins stroke version when stroke animation or guided writing
 * is requested, builds authoritative snapshot, and validates the resulting persisted canonical block.
 */
export async function resolveTeacherAuthorBlocks(
  tx: any,
  courseLanguageId: string,
  authorBlocks: TeacherLessonAuthorBlock[]
): Promise<PersistedLessonBlock[]> {
  const uniqueCharIds = [
    ...new Set(
      authorBlocks
        .filter((b): b is Extract<TeacherLessonAuthorBlock, { type: 'CHARACTER' }> => b.type === 'CHARACTER')
        .map((b) => b.content.characterId.toLowerCase())
    ),
  ];

  const charMap = new Map<string, any>();
  if (uniqueCharIds.length > 0) {
    const chars = await tx.writingCharacter.findMany({
      where: {
        id: { in: uniqueCharIds },
        languageId: courseLanguageId.toLowerCase(),
      },
      select: {
        id: true,
        glyph: true,
        scriptType: true,
        strokeCount: true,
        meaning: true,
        primaryReading: true,
        romanization: true,
        metadata: true,
        strokeData: {
          select: {
            version: true,
          },
        },
      },
    });
    for (const c of chars) {
      charMap.set(c.id.toLowerCase(), c);
    }
  }

  const resolvedBlocks: PersistedLessonBlock[] = [];

  for (const block of authorBlocks) {
    if (block.type !== 'CHARACTER') {
      resolvedBlocks.push(block);
      continue;
    }

    const characterId = block.content.characterId.toLowerCase();
    const char = charMap.get(characterId);

    if (!char) {
      throw new ControlledDraftError(400, {
        code: 'VALIDATION_ERROR',
        message: 'Ký tự không tồn tại trong danh mục ký tự của khóa học.',
      });
    }

    // 2. Validate stroke data requirement
    const requiresStrokes = block.content.showStrokeAnimation || block.content.guidedWriting;
    let strokeVersion: number | null = null;

    if (requiresStrokes) {
      const ver = char.strokeData?.version;
      if (typeof ver !== 'number' || !Number.isInteger(ver) || ver <= 0) {
        throw new ControlledDraftError(400, {
          code: 'VALIDATION_ERROR',
          message: `Ký tự "${char.glyph}" thiếu dữ liệu nét khi bật hoạt ảnh nét hoặc hướng dẫn viết.`,
        });
      }
      strokeVersion = ver;
    }

    // 3. Extract and sanitize metadata according to existing metadata contract
    const rawMeta = typeof char.metadata === 'object' && char.metadata !== null ? char.metadata : {};
    const parsedMeta = writingCharacterMetadataSchema.safeParse(rawMeta);
    const cleanMetadata = parsedMeta.success ? { ...parsedMeta.data } : {};

    // 4. Build authoritative snapshot
    const snapshot: CharacterSnapshot = {
      glyph: char.glyph,
      scriptType: char.scriptType as CharacterScriptType,
      strokeCount: char.strokeCount,
      meaning: char.meaning ?? null,
      primaryReading: char.primaryReading ?? null,
      romanization: char.romanization ?? null,
      metadata: cleanMetadata,
      strokeVersion,
    };

    const validatedSnapshot = characterSnapshotSchema.parse(snapshot);

    // 5. Construct canonical persisted block and validate
    const persistedBlock: CharacterBlockPersisted = {
      blockKey: block.blockKey,
      type: 'CHARACTER',
      position: block.position,
      schemaVersion: 1,
      content: {
        characterId: char.id,
        showMeaning: block.content.showMeaning,
        showReading: block.content.showReading,
        showStrokeAnimation: block.content.showStrokeAnimation,
        guidedWriting: block.content.guidedWriting,
        snapshot: validatedSnapshot,
      },
    };

    validateCharacterBlockPersisted(persistedBlock);
    resolvedBlocks.push(persistedBlock);
  }

  return resolvedBlocks;
}

/**
 * Persists canonical lesson content blocks for a newly created lesson revision.
 * Inserts rows into `app.lesson_content_blocks` in position order.
 * Predecessor revision blocks are never modified (append-only snapshot semantics).
 */
export async function persistLessonRevisionBlocks(
  tx: any,
  lessonRevisionId: string,
  blocks: PersistedLessonBlock[]
): Promise<void> {
  if (!blocks || blocks.length === 0) {
    return;
  }

  // Ensure blocks are strictly validated and sorted ascending by position
  const sorted = [...blocks].sort((a, b) => a.position - b.position);

  await tx.lessonContentBlock.createMany({
    data: sorted.map((block) => ({
      lessonRevisionId,
      blockKey: block.blockKey,
      type: block.type,
      position: block.position,
      schemaVersion: block.schemaVersion ?? 1,
      content: block.content as any,
    })),
  });
}

/**
 * Resolves author draft blocks against course language and catalogue,
 * then persists them in position order.
 */
export async function resolveAndPersistLessonRevisionBlocks(
  tx: any,
  lessonRevisionId: string,
  courseLanguageId: string,
  inputBlocks: TeacherLessonAuthorBlock[]
): Promise<PersistedLessonBlock[]> {
  if (!inputBlocks || inputBlocks.length === 0) {
    return [];
  }
  const resolved = await resolveTeacherAuthorBlocks(tx, courseLanguageId, inputBlocks);
  await persistLessonRevisionBlocks(tx, lessonRevisionId, resolved);
  return resolved;
}
