import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { hasNumberPrefix, numberedTitle } from '../../src/shared/lesson-title.ts';

describe('H2/G15: one numbering rule for lesson and unit titles', () => {
  test('keeps a teacher-typed prefix instead of adding a second one', () => {
    assert.equal(numberedTitle('Bài', 1, 'Bài 4: Một ngày của tôi'), 'Bài 4: Một ngày của tôi');
    assert.equal(numberedTitle('Chương', 3, 'Bài 3: Giao tiếp thực tế'), 'Bài 3: Giao tiếp thực tế');
    assert.equal(numberedTitle('Chương', 1, 'Chương 1: Chào hỏi'), 'Chương 1: Chào hỏi');
  });

  test('recognises the prefix case-insensitively and in English', () => {
    for (const title of [
      'bài 2 - Chào hỏi',
      'BÀI 2: Chào hỏi',
      'Lesson 2: Greetings',
      'unit 2. Greetings',
      'Chapter 2 — Greetings',
      'Phần 2: Chào hỏi',
      'Part 10: Greetings',
    ]) {
      assert.equal(hasNumberPrefix(title), true, title);
      assert.equal(numberedTitle('Bài', 7, title), title, title);
    }
  });

  test('adds the system prefix when the title carries no numbering', () => {
    assert.equal(numberedTitle('Bài', 4, 'Một ngày của tôi'), 'Bài 4: Một ngày của tôi');
    assert.equal(numberedTitle('Chương', 2, 'Giao tiếp thực tế'), 'Chương 2: Giao tiếp thực tế');
    assert.equal(numberedTitle('Bài', 1, '  Chào hỏi  '), 'Bài 1: Chào hỏi');
  });

  test('a number inside the title is not a numbering prefix', () => {
    assert.equal(hasNumberPrefix('Bài tập về số 5'), false);
    assert.equal(hasNumberPrefix('10 câu chào hỏi'), false);
    assert.equal(numberedTitle('Bài', 2, 'Bài tập về số 5'), 'Bài 2: Bài tập về số 5');
  });

  test('falls back to the label and position when there is no title', () => {
    assert.equal(numberedTitle('Chương', 1, ''), 'Chương 1');
    assert.equal(numberedTitle('Bài', 3, null), 'Bài 3');
    assert.equal(numberedTitle('Bài', null, 'Chào hỏi'), 'Chào hỏi');
  });
});
