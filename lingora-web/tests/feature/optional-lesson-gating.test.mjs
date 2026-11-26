import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import {
  account,
  contextRow,
  unitRow,
  lessonRow,
  lesson2Row,
  exercisesRows,
  vocabularyRows,
  fixtureDb,
  learnerId,
  contextId,
  unit1Id,
  lesson1Id,
  lesson2Id,
} from './harness/learner-fixture.mjs';
import { loadLearnerCatalogue, loadLearnerLessonDetail } from '../../src/server/lessons/service.ts';
import { buildLearningPath } from '../../src/server/context/path-service.ts';

const optionalLessonId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const optionalRevisionId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

/** H1: an OPTIONAL lesson sitting between two required lessons of the same unit. */
const optionalLessonRow = () => ({
  id: optionalLessonId,
  unitId: unit1Id,
  position: 2,
  isRequired: false,
  availability: 'AVAILABLE',
  activeRevisionId: optionalRevisionId,
  activeRevision: {
    id: optionalRevisionId,
    lessonId: optionalLessonId,
    revisionNo: 1,
    status: 'PUBLISHED',
    title: { vi: 'Bài 4: Một ngày của tôi', en: 'Lesson 4: My day' },
    contentBlocks: [{ type: 'paragraph', text: 'Bài học mở rộng, không bắt buộc.' }],
    topicIds: ['topic-extra'],
    skillIds: ['skill-reading'],
    purposeTags: ['optional'],
  },
  unit: unitRow(),
});

describe('H1: OPTIONAL lessons are always open and never gate required lessons', () => {
  let state;
  let db;

  beforeEach(() => {
    const required2 = lesson2Row();
    required2.position = 3; // required lesson after the optional one
    state = {
      account: account(),
      contexts: [contextRow()],
      units: [unitRow()],
      lessons: [lessonRow(), optionalLessonRow(), required2],
      exercises: exercisesRows(),
      vocabulary: vocabularyRows(),
      completions: [],
      consumptions: [],
      attempts: [],
      responses: [],
      srsCards: [],
      srsReviewOperations: [],
      xpEvents: [],
      learnerAchievements: [],
    };
    db = fixtureDb(state);
    setLearnerPrismaForTest(db);
  });

  test('catalogue: the optional lesson is unlocked in its own unit slot while required gating still applies', async () => {
    const result = await loadLearnerCatalogue(contextId, learnerId);
    assert.equal(result.units.length, 1);
    const lessons = result.units[0].lessons;

    // Ordering: unit position, then lesson position -> the optional lesson keeps its slot.
    assert.deepEqual(lessons.map(l => l.id), [lesson1Id, optionalLessonId, lesson2Id]);
    assert.deepEqual(lessons.map(l => l.position), [1, 2, 3]);

    // Required lesson 1 is not completed yet.
    assert.equal(lessons[0].isLocked, false);
    assert.equal(lessons[1].isLocked, false, 'an optional lesson is never locked by sequential gating');
    assert.equal(lessons[1].isRequired, false);
    assert.ok(lessons[1].activeRevisionId, 'an unlocked optional lesson exposes its revision');
    assert.equal(lessons[1].lockReason, undefined);
    assert.equal(lessons[2].isLocked, true, 'the next required lesson stays sequentially gated');
  });

  test('lesson detail: the optional lesson opens while a preceding required lesson is still locked', async () => {
    const optional = await loadLearnerLessonDetail(contextId, optionalLessonId, learnerId);
    assert.equal(optional.lessonId, optionalLessonId);

    await assert.rejects(
      () => loadLearnerLessonDetail(contextId, lesson2Id, learnerId),
      (err) => {
        assert.equal(err.status, 409);
        assert.equal(err.error.code, 'LESSON_LOCKED');
        return true;
      }
    );
  });

  test('required gating ignores optional lessons: completing the required lesson unlocks the next required one', async () => {
    state.completions.push({ id: 'comp-1', contextId, lessonId: lesson1Id });

    const result = await loadLearnerCatalogue(contextId, learnerId);
    const lessons = result.units[0].lessons;
    assert.equal(lessons[1].isLocked, false);
    assert.equal(
      lessons[2].isLocked,
      false,
      'the skipped optional lesson must not block the next required lesson'
    );

    const detail = await loadLearnerLessonDetail(contextId, lesson2Id, learnerId);
    assert.equal(detail.lessonId, lesson2Id);
  });

  test('H11: catalogue reports lesson completion separately from the reading state', async () => {
    state.completions.push({ id: 'comp-1', contextId, lessonId: lesson1Id });

    const result = await loadLearnerCatalogue(contextId, learnerId);
    const lessons = result.units[0].lessons;
    assert.equal(lessons[0].isCompleted, true);
    assert.equal(lessons[0].readingState, 'NOT_STARTED');
    assert.equal(lessons[1].isCompleted, false);
    assert.equal(lessons[2].isCompleted, false);
  });

  test('home path: the optional lesson is AVAILABLE and ordered inside its unit', async () => {
    const res = await buildLearningPath(db, contextId, learnerId);
    assert.equal(res.status, 'READY');
    assert.deepEqual(res.path.map(node => node.lessonId), [lesson1Id, optionalLessonId, lesson2Id]);
    assert.equal(res.path[0].state, 'CURRENT');
    assert.equal(res.path[1].state, 'AVAILABLE', 'the optional lesson must never be LOCKED');
    assert.equal(res.path[1].isRequired, false);
    assert.equal(res.path[1].unitPosition, 1);
    assert.ok(res.path[1].href.includes(optionalLessonId));
    assert.equal(res.path[2].state, 'LOCKED');
  });
});
