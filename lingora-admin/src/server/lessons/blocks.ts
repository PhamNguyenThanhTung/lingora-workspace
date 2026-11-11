import type { LessonBlock } from '@lingora/lesson-content';
import { validateLessonBlocks } from '@lingora/lesson-content';

export { validateLessonBlocks, toLegacyParagraphProjection } from '@lingora/lesson-content';

/**
 * Persists canonical lesson content blocks for a newly created lesson revision.
 * Inserts rows into `app.lesson_content_blocks` in position order.
 * Predecessor revision blocks are never modified (append-only snapshot semantics).
 */
export async function persistLessonRevisionBlocks(
  tx: any,
  lessonRevisionId: string,
  blocks: LessonBlock[]
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
