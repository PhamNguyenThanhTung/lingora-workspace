import { lessonBlockSchema, type LessonBlock, type TextBlock } from './schema.ts';
import type { PresentationBlock, PublicCharacterBlock } from './dto.ts';
import { characterBlockPersistedSchema } from './character.ts';

/**
 * Converts legacy paragraph array [{ type: 'paragraph', text }] into canonical TEXT blocks.
 * Deterministic blockKey format: legacy:<revisionId>:paragraph:<index>
 */
export function adaptLegacyParagraphs(
  revisionId: string,
  paragraphs: Array<{ type?: string; text: string }> | null | undefined
): TextBlock[] {
  if (!paragraphs || !Array.isArray(paragraphs) || paragraphs.length === 0) {
    return [];
  }

  const safeRevisionId = revisionId.trim() || 'legacy';

  return paragraphs.map((p, index) => {
    const text = typeof p?.text === 'string' ? p.text : '';
    return {
      blockKey: `legacy:${safeRevisionId}:paragraph:${index}`,
      type: 'TEXT',
      position: index + 1,
      schemaVersion: 1,
      content: {
        nodes: [
          {
            type: 'paragraph',
            runs: [
              {
                text,
              },
            ],
          },
        ],
      },
    };
  });
}

/**
 * Projects canonical blocks into legacy paragraph array [{ type: 'paragraph', text }]
 * for backward-compatibility with older read clients that only understand paragraphs.
 */
export function toLegacyParagraphProjection(
  blocks: Array<LessonBlock | PresentationBlock>
): Array<{ type: 'paragraph'; text: string }> {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return [];
  }

  const sorted = [...blocks].sort((a, b) => a.position - b.position);
  const result: Array<{ type: 'paragraph'; text: string }> = [];

  for (const block of sorted) {
    switch (block.type) {
      case 'TEXT': {
        for (const node of block.content.nodes) {
          if (node.type === 'paragraph') {
            const text = node.runs.map((r) => r.text).join('');
            result.push({ type: 'paragraph', text });
          } else if (node.type === 'list') {
            for (const item of node.items) {
              const text = item.runs.map((r) => r.text).join('');
              result.push({ type: 'paragraph', text });
            }
          }
        }
        break;
      }

      case 'HEADING': {
        result.push({ type: 'paragraph', text: block.content.text });
        break;
      }

      case 'EXAMPLE': {
        const text = block.content.translation
          ? `${block.content.text} (${block.content.translation})`
          : block.content.text;
        result.push({ type: 'paragraph', text });
        break;
      }

      case 'DIALOGUE': {
        for (const line of block.content.lines) {
          const text =
            `${line.speaker}: ${line.text}` +
            (line.translation ? ` (${line.translation})` : '');
          result.push({ type: 'paragraph', text });
        }
        break;
      }

      case 'CALLOUT': {
        const docText = block.content.document.nodes
          .map((n) => {
            if (n.type === 'paragraph') {
              return n.runs.map((r) => r.text).join('');
            }
            return n.items.map((it) => it.runs.map((r) => r.text).join('')).join('\n');
          })
          .join('\n');
        const header = block.content.title
          ? `[${block.content.tone.toUpperCase()}] ${block.content.title}\n`
          : `[${block.content.tone.toUpperCase()}] `;
        result.push({ type: 'paragraph', text: header + docText });
        break;
      }

      case 'GRAMMAR': {
        const title = block.content.title ? `${block.content.title}: ` : '';
        result.push({ type: 'paragraph', text: title + block.content.explanation });
        break;
      }

      case 'MEDIA': {
        if (block.content.caption) {
          result.push({ type: 'paragraph', text: `[Audio] ${block.content.caption}` });
        }
        break;
      }

      case 'VOCABULARY':
      case 'DIVIDER':
      case 'UNSUPPORTED':
      default: {
        // Non-textual or unsupported blocks do not project to paragraphs
        break;
      }
    }
  }

  return result;
}

export interface ParsePersistedLessonContentOptions {
  allowCharacter?: boolean;
}

function extractBlockCandidate(raw: any) {
  if (!raw || typeof raw !== 'object') return raw;
  let content = raw.content;
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content);
    } catch {
      // Keep as-is if parsing fails
    }
  }
  return {
    blockKey: raw.blockKey,
    type: raw.type,
    position: raw.position,
    schemaVersion: raw.schemaVersion,
    content,
  };
}

export function parseSinglePersistedBlock(
  raw: any,
  index: number,
  options?: ParsePersistedLessonContentOptions
): PresentationBlock {
  const candidate = extractBlockCandidate(raw);
  const parsed = lessonBlockSchema.safeParse(candidate);
  if (parsed.success) {
    return parsed.data;
  }

  if (options?.allowCharacter && candidate && candidate.type === 'CHARACTER') {
    const charParsed = characterBlockPersistedSchema.safeParse(candidate);
    if (charParsed.success) {
      const persisted = charParsed.data;
      const snap = persisted.content.snapshot;
      const showMeaning = persisted.content.showMeaning;
      const showReading = persisted.content.showReading;
      const showAnim = persisted.content.showStrokeAnimation;
      const guided = persisted.content.guidedWriting;

      const publicContent: Record<string, unknown> = {
        characterId: persisted.content.characterId,
        glyph: snap.glyph,
        scriptType: snap.scriptType,
        strokeCount: snap.strokeCount,
        showMeaning,
        showReading,
        showStrokeAnimation: showAnim,
        guidedWriting: guided,
      };

      if (showMeaning && snap.meaning) {
        publicContent.meaning = snap.meaning;
      }
      if (showReading) {
        if (snap.primaryReading) publicContent.primaryReading = snap.primaryReading;
        if (snap.romanization) publicContent.romanization = snap.romanization;
      }
      if ((showAnim || guided) && typeof snap.strokeVersion === 'number' && snap.strokeVersion > 0) {
        publicContent.strokeVersion = snap.strokeVersion;
      }

      const publicBlock: PublicCharacterBlock = {
        blockKey: persisted.blockKey,
        type: 'CHARACTER',
        position: persisted.position,
        schemaVersion: persisted.schemaVersion,
        characterId: persisted.content.characterId,
        glyph: snap.glyph,
        scriptType: snap.scriptType,
        strokeCount: snap.strokeCount,
        showMeaning,
        showReading,
        showStrokeAnimation: showAnim,
        guidedWriting: guided,
        ...(showMeaning && snap.meaning ? { meaning: snap.meaning } : {}),
        ...(showReading && snap.primaryReading ? { primaryReading: snap.primaryReading } : {}),
        ...(showReading && snap.romanization ? { romanization: snap.romanization } : {}),
        ...((showAnim || guided) && typeof snap.strokeVersion === 'number' && snap.strokeVersion > 0
          ? { strokeVersion: snap.strokeVersion }
          : {}),
        content: publicContent as any,
      };

      return publicBlock;
    }
  }

  return {
    blockKey: typeof raw?.blockKey === 'string' ? raw.blockKey : `unsupported-${index}`,
    type: 'UNSUPPORTED',
    position: typeof raw?.position === 'number' ? raw.position : index + 1,
    schemaVersion: typeof raw?.schemaVersion === 'number' ? raw.schemaVersion : 0,
    originalType: typeof raw?.type === 'string' ? raw.type : 'UNKNOWN',
    message: 'Khối nội dung không được hỗ trợ trong phiên bản hiện tại.',
  };
}

/**
 * Parses persisted lesson revision content from either:
 * - Block rows array from DB
 * - Lesson revision object with contentSchemaVersion and contentBlocks or blocks
 */
export function parsePersistedLessonContent(
  source: unknown,
  options?: ParsePersistedLessonContentOptions
): {
  contentSchemaVersion: number;
  blocks: PresentationBlock[];
} {
  if (!source) {
    return { contentSchemaVersion: 0, blocks: [] };
  }

  // 1. Direct array of block rows
  if (Array.isArray(source)) {
    const blocks: PresentationBlock[] = [];
    for (let i = 0; i < source.length; i++) {
      blocks.push(parseSinglePersistedBlock(source[i], i, options));
    }
    return { contentSchemaVersion: 1, blocks: blocks.sort((a, b) => a.position - b.position) };
  }

  if (typeof source === 'object') {
    const obj = source as Record<string, unknown>;
    const contentSchemaVersion = obj.contentSchemaVersion;
    const revisionId = typeof obj.revisionId === 'string' ? obj.revisionId : typeof obj.id === 'string' ? obj.id : 'legacy';

    // Explicit V1 revision
    if (contentSchemaVersion === 1) {
      const rawBlocks = Array.isArray(obj.blocks) ? obj.blocks : [];
      const blocks: PresentationBlock[] = [];
      for (let i = 0; i < rawBlocks.length; i++) {
        blocks.push(parseSinglePersistedBlock(rawBlocks[i], i, options));
      }
      // Zero-block V1 does NOT fall back to legacy
      return { contentSchemaVersion: 1, blocks: blocks.sort((a, b) => a.position - b.position) };
    }

    // Explicit V0 legacy revision
    if (contentSchemaVersion === 0) {
      const legacyParagraphs = Array.isArray(obj.contentBlocks)
        ? (obj.contentBlocks as Array<{ type?: string; text: string }>)
        : [];
      return {
        contentSchemaVersion: 0,
        blocks: adaptLegacyParagraphs(revisionId, legacyParagraphs),
      };
    }

    // If contentSchemaVersion is undefined / null, infer from presence of blocks vs contentBlocks
    if (Array.isArray(obj.blocks) && obj.blocks.length > 0) {
      return parsePersistedLessonContent({ ...obj, contentSchemaVersion: 1 }, options);
    }

    const legacyParagraphs = Array.isArray(obj.contentBlocks)
      ? (obj.contentBlocks as Array<{ type?: string; text: string }>)
      : [];
    return {
      contentSchemaVersion: 0,
      blocks: adaptLegacyParagraphs(revisionId, legacyParagraphs),
    };
  }

  return { contentSchemaVersion: 0, blocks: [] };
}
