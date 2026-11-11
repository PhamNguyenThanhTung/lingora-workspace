import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultBlock,
  generateBlockKey,
  addBlock,
  duplicateBlock,
  deleteBlock,
  moveBlock,
  reorderBlocks,
  updateBlock,
  normalizePositions,
} from '../../src/components/lesson-studio/block-operations.ts';
import { validateLessonBlocks } from '@lingora/lesson-content';

describe('T07 / T08: Studio Block Pure Operations', () => {
  const BLOCK_TYPES = [
    'HEADING',
    'TEXT',
    'EXAMPLE',
    'DIALOGUE',
    'CALLOUT',
    'MEDIA',
    'GRAMMAR',
    'DIVIDER',
    'VOCABULARY',
  ];

  test('createDefaultBlock creates valid blocks that pass validateLessonBlocks', () => {
    const blocks = BLOCK_TYPES.map((type, idx) => createDefaultBlock(type, idx + 1));
    assert.equal(blocks.length, BLOCK_TYPES.length);

    // Validate each position
    blocks.forEach((block, idx) => {
      assert.equal(block.position, idx + 1);
      assert.equal(block.schemaVersion, 1);
      assert.ok(block.blockKey.length > 0);
      assert.ok(/^[A-Za-z0-9_.:-]+$/.test(block.blockKey));
    });

    // Schema validation across the entire collection
    const validated = validateLessonBlocks(blocks);
    assert.equal(validated.length, BLOCK_TYPES.length);
  });

  test('generateBlockKey produces distinct keys matching regex', () => {
    const keys = new Set();
    for (let i = 0; i < 50; i++) {
      const key = generateBlockKey('HEADING');
      assert.ok(/^[A-Za-z0-9_.:-]+$/.test(key));
      assert.ok(key.length <= 128);
      assert.equal(keys.has(key), false, `Duplicate key generated: ${key}`);
      keys.add(key);
    }
  });

  test('addBlock inserts block at specified index and normalizes positions', () => {
    let list = [];
    list = addBlock(list, 'HEADING'); // index 0, position 1
    list = addBlock(list, 'TEXT'); // index 1, position 2
    list = addBlock(list, 'EXAMPLE'); // index 2, position 3

    assert.equal(list.length, 3);
    assert.deepEqual(list.map((b) => b.position), [1, 2, 3]);
    assert.equal(list[0].type, 'HEADING');
    assert.equal(list[1].type, 'TEXT');
    assert.equal(list[2].type, 'EXAMPLE');

    // Insert at index 1 (between HEADING and TEXT)
    list = addBlock(list, 'CALLOUT', 1);
    assert.equal(list.length, 4);
    assert.deepEqual(list.map((b) => b.position), [1, 2, 3, 4]);
    assert.equal(list[0].type, 'HEADING');
    assert.equal(list[1].type, 'CALLOUT');
    assert.equal(list[2].type, 'TEXT');
    assert.equal(list[3].type, 'EXAMPLE');

    // Collection validation must pass
    validateLessonBlocks(list);
  });

  test('duplicateBlock creates clone with a NEW blockKey directly after source', () => {
    const b1 = createDefaultBlock('HEADING', 1);
    const b2 = createDefaultBlock('TEXT', 2);
    const initial = [b1, b2];

    const duplicated = duplicateBlock(initial, b1.blockKey);
    assert.equal(duplicated.length, 3);
    assert.deepEqual(duplicated.map((b) => b.position), [1, 2, 3]);

    const original = duplicated[0];
    const clone = duplicated[1];
    const untouched = duplicated[2];

    assert.equal(original.blockKey, b1.blockKey);
    assert.equal(untouched.blockKey, b2.blockKey);

    // Clone must have NEW blockKey
    assert.notEqual(clone.blockKey, b1.blockKey);
    assert.equal(clone.type, b1.type);
    assert.deepEqual(clone.content, b1.content);
    assert.equal(clone.position, 2);
    assert.equal(untouched.position, 3);

    // Both keys must be unique and valid
    validateLessonBlocks(duplicated);
  });

  test('deleteBlock removes the target block and renumbers positions', () => {
    const b1 = createDefaultBlock('HEADING', 1);
    const b2 = createDefaultBlock('TEXT', 2);
    const b3 = createDefaultBlock('DIVIDER', 3);
    const initial = [b1, b2, b3];

    const afterDelete = deleteBlock(initial, b2.blockKey);
    assert.equal(afterDelete.length, 2);
    assert.equal(afterDelete[0].blockKey, b1.blockKey);
    assert.equal(afterDelete[0].position, 1);
    assert.equal(afterDelete[1].blockKey, b3.blockKey);
    assert.equal(afterDelete[1].position, 2);

    validateLessonBlocks(afterDelete);
  });

  test('moveBlock moves element up and down safely', () => {
    const b1 = createDefaultBlock('HEADING', 1);
    const b2 = createDefaultBlock('TEXT', 2);
    const b3 = createDefaultBlock('CALLOUT', 3);
    const initial = [b1, b2, b3];

    // Move first item UP -> no change
    const noopUp = moveBlock(initial, b1.blockKey, 'up');
    assert.deepEqual(noopUp.map((b) => b.blockKey), [b1.blockKey, b2.blockKey, b3.blockKey]);

    // Move last item DOWN -> no change
    const noopDown = moveBlock(initial, b3.blockKey, 'down');
    assert.deepEqual(noopDown.map((b) => b.blockKey), [b1.blockKey, b2.blockKey, b3.blockKey]);

    // Move b2 UP -> becomes first
    const movedUp = moveBlock(initial, b2.blockKey, 'up');
    assert.deepEqual(movedUp.map((b) => b.blockKey), [b2.blockKey, b1.blockKey, b3.blockKey]);
    assert.deepEqual(movedUp.map((b) => b.position), [1, 2, 3]);

    // Move b1 DOWN -> becomes last
    const movedDown = moveBlock(initial, b1.blockKey, 'down');
    assert.deepEqual(movedDown.map((b) => b.blockKey), [b2.blockKey, b1.blockKey, b3.blockKey]);
    assert.deepEqual(movedDown.map((b) => b.position), [1, 2, 3]);

    validateLessonBlocks(movedUp);
    validateLessonBlocks(movedDown);
  });

  test('reorderBlocks (DnD simulation) preserves blockKeys and re-normalizes position', () => {
    const b1 = createDefaultBlock('HEADING', 1);
    const b2 = createDefaultBlock('TEXT', 2);
    const b3 = createDefaultBlock('EXAMPLE', 3);
    const b4 = createDefaultBlock('DIALOGUE', 4);
    const list = [b1, b2, b3, b4];

    // Drag block at index 3 (DIALOGUE) to index 0 (top)
    const reordered = reorderBlocks(list, 3, 0);
    assert.equal(reordered.length, 4);
    assert.deepEqual(reordered.map((b) => b.blockKey), [
      b4.blockKey,
      b1.blockKey,
      b2.blockKey,
      b3.blockKey,
    ]);
    assert.deepEqual(reordered.map((b) => b.position), [1, 2, 3, 4]);

    validateLessonBlocks(reordered);
  });

  test('updateBlock updates content without mutating other properties', () => {
    const b1 = createDefaultBlock('HEADING', 1);
    const b2 = createDefaultBlock('TEXT', 2);
    const list = [b1, b2];

    const updated = updateBlock(list, b1.blockKey, {
      content: { level: 3, text: 'Tiêu đề cấp 3 đã sửa' },
    });

    assert.equal(updated[0].blockKey, b1.blockKey);
    assert.equal(updated[0].position, 1);
    assert.equal(updated[0].content.level, 3);
    assert.equal(updated[0].content.text, 'Tiêu đề cấp 3 đã sửa');

    // b2 remains untouched
    assert.equal(updated[1].blockKey, b2.blockKey);
    assert.deepEqual(updated[1].content, b2.content);

    validateLessonBlocks(updated);
  });

  test('normalizePositions guarantees sequential 1-based ordering', () => {
    const b1 = { ...createDefaultBlock('HEADING', 10), position: 99 };
    const b2 = { ...createDefaultBlock('TEXT', 20), position: 105 };
    const normalized = normalizePositions([b1, b2]);
    assert.equal(normalized[0].position, 1);
    assert.equal(normalized[1].position, 2);
  });

  test('duplicateBlock performs deep clone so modifying duplicate does not alter original', () => {
    const originalDialogue = createDefaultBlock('DIALOGUE', 1);
    const list = [originalDialogue];
    const duplicated = duplicateBlock(list, originalDialogue.blockKey);

    assert.equal(duplicated.length, 2);
    // Mutate duplicated dialogue line
    duplicated[1].content.lines[0].text = 'Altered in duplicate';

    assert.notEqual(duplicated[0].content.lines[0].text, 'Altered in duplicate');
    assert.equal(duplicated[0].content.lines[0].text, 'Hello, how are you today?');
  });

  test('nonexistent blockKey operations return safe untouched copies', () => {
    const b1 = createDefaultBlock('HEADING', 1);
    const list = [b1];

    assert.deepEqual(duplicateBlock(list, 'nonexistent-key'), list);
    assert.deepEqual(deleteBlock(list, 'nonexistent-key'), list);
    assert.deepEqual(moveBlock(list, 'nonexistent-key', 'up'), list);
    assert.deepEqual(updateBlock(list, 'nonexistent-key', { content: {} }), list);
  });

  test('reorderBlocks handles out-of-bounds and identity indices safely', () => {
    const b1 = createDefaultBlock('HEADING', 1);
    const b2 = createDefaultBlock('TEXT', 2);
    const list = [b1, b2];

    assert.deepEqual(reorderBlocks(list, 0, 0), list);
    assert.deepEqual(reorderBlocks(list, -1, 1), list);
    assert.deepEqual(reorderBlocks(list, 0, 10), list);
  });

  test('addBlock with negative or exceeding targetIndex appends to end', () => {
    const b1 = createDefaultBlock('HEADING', 1);
    let list = [b1];

    list = addBlock(list, 'TEXT', -5);
    assert.equal(list.length, 2);
    assert.equal(list[1].type, 'TEXT');
    assert.equal(list[1].position, 2);

    list = addBlock(list, 'DIVIDER', 999);
    assert.equal(list.length, 3);
    assert.equal(list[2].type, 'DIVIDER');
    assert.equal(list[2].position, 3);
  });
});
