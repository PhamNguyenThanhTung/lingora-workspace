import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialWritingSrsState,
  scheduleWritingSrsReview,
  WRITING_SRS_SCHEDULER_VERSION,
} from '../../src/server/srs/writing-scheduler.ts';

const start = new Date('2026-01-01T00:00:00.000Z');

test('WRITING FSRS initializes separately and stores four explicit ratings', () => {
  const initial = createInitialWritingSrsState(start);
  assert.equal(initial.state, 1);
  assert.equal(initial.dueAt.toISOString(), '2026-01-02T00:00:00.000Z');
  assert.equal(initial.count, 0);

  const reviewedAt = initial.dueAt;
  for (const [rating, expectedRating] of [
    ['AGAIN', 1],
    ['HARD', 2],
    ['GOOD', 3],
    ['EASY', 4],
  ]) {
    const result = scheduleWritingSrsReview(initial, rating, reviewedAt);
    assert.equal(result.schedulerVersion, WRITING_SRS_SCHEDULER_VERSION);
    assert.equal(result.reviewLog.rating, expectedRating);
    assert.ok(result.state >= 1 && result.state <= 4);
    assert.ok(result.dueAt instanceof Date && result.dueAt >= reviewedAt);
    assert.equal(result.count, 1);
    assert.ok(Number.isFinite(result.stability) && result.stability > 0);
    assert.ok(Number.isFinite(result.difficulty) && result.difficulty > 0);
  }
});

test('WRITING FSRS round-trips the state needed for another review deterministically', () => {
  const initial = createInitialWritingSrsState(start);
  const firstAt = initial.dueAt;
  const first = scheduleWritingSrsReview(initial, 'GOOD', firstAt);
  const second = scheduleWritingSrsReview(first, 'HARD', first.dueAt);
  const replay = scheduleWritingSrsReview(first, 'HARD', first.dueAt);

  assert.equal(first.state, 3); // FSRS Review state (2), stored offset by one.
  assert.equal(second.count, 2);
  assert.deepEqual(second, replay);
});

test('WRITING FSRS rejects invalid persisted state and rating values', () => {
  const initial = createInitialWritingSrsState(start);
  assert.throws(
    () => scheduleWritingSrsReview({ ...initial, state: 5 }, 'GOOD', initial.dueAt),
    /state/i,
  );
  assert.throws(
    () => scheduleWritingSrsReview(initial, 'REMEMBERED', initial.dueAt),
    /rating/i,
  );
});
