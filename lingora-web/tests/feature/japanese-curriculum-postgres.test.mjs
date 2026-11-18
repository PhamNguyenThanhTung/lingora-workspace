import { test, describe, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../../../lingora-admin/generated/product-client/index.js';
import { getLearnerCookieName } from '../../src/server/auth/env.ts';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import { createJapaneseCurriculumFixture } from './harness/japanese-curriculum-fixture.mjs';
import { providerDouble, providerOrigin, setupEnv, token } from './harness/learner-fixture.mjs';
import { resolveRecommendation } from '../../src/server/context/curriculum.ts';
import { completeOnboarding, getOnboardingPreview } from '../../src/server/context/onboarding-service.ts';
import { buildLearningPath } from '../../src/server/context/path-service.ts';
import { authorizedLesson, loadLearnerLessonDetail, loadLessonHierarchy, mutateLessonConsumption } from '../../src/server/lessons/service.ts';
import {
  startPracticeAttempt,
  submitPracticeResponse,
  finalizePracticeAttempt,
} from '../../src/server/lessons/practice-service.ts';

let cookieStore = { getAll: () => [], get: () => undefined, set: () => {}, delete: () => {} };
const originalFetch = globalThis.fetch;
mock.module('next/headers.js', { exports: { cookies: async () => cookieStore } });
const lessonDetailRoute = await import('../../src/app/api/learner/contexts/[contextId]/lessons/[lessonId]/route.ts');

function authenticateFixtureLearner(learnerId) {
  const user = {
    id: learnerId,
    email: `${learnerId}@lingora.test`,
    email_confirmed_at: '2026-11-17T00:00:00.000Z',
  };
  const session = token(user);
  const name = getLearnerCookieName(providerOrigin);
  const cookie = { name, value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}` };
  cookieStore = {
    getAll: () => [cookie],
    get: (key) => (key === name ? cookie : undefined),
    set: () => {},
    delete: () => {},
  };
  globalThis.fetch = providerDouble({ user });
}

const url = process.env.SLICE11_TEST_DATABASE_URL;
assert.ok(url, 'Run through scripts/local-test-db.mjs to provision an owned database');
assert.equal(process.env.SLICE11_TEST_DATABASE_OWNED, '1');
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(url).hostname));
assert.match(new URL(url).pathname, /^\/slice11_test/);

const db = new PrismaClient({ datasourceUrl: url, log: [] });
let f;
let contextId;

before(async () => {
  await db.$connect();
  setLearnerPrismaForTest(db);
});

after(async () => {
  globalThis.fetch = originalFetch;
  cookieStore = { getAll: () => [], get: () => undefined, set: () => {}, delete: () => {} };
  setLearnerPrismaForTest(null);
  await db.$disconnect();
});

beforeEach(async () => {
  globalThis.fetch = originalFetch;
  setupEnv();
  setLearnerPrismaForTest(db);
  let canonicalJa = await db.language.findUnique({ where: { code: 'ja' } });
  if (!canonicalJa) {
    canonicalJa = await db.language.create({
      data: { id: randomUUID(), code: 'ja', names: { vi: 'Tiếng Nhật', en: 'Japanese' }, isLearnable: false, isUiLocale: false },
    });
  }
  let canonicalJlpt = await db.framework.findUnique({ where: { code_version: { code: 'JLPT', version: '2020' } } });
  if (!canonicalJlpt) {
    canonicalJlpt = await db.framework.create({
      data: { id: randomUUID(), code: 'JLPT', version: '2020', names: { vi: 'Khung năng lực Nhật', en: 'Japanese Framework' } },
    });
  }
  let canonicalN5 = await db.level.findFirst({ where: { frameworkId: canonicalJlpt.id, code: 'N5' } });
  if (!canonicalN5) {
    canonicalN5 = await db.level.create({
      data: { id: randomUUID(), frameworkId: canonicalJlpt.id, code: 'N5', position: 1, label: { vi: 'N5', en: 'N5' } },
    });
  }
  let canonicalCourse = await db.course.findFirst({
    where: { languageId: canonicalJa.id, frameworkId: canonicalJlpt.id, isActive: true },
  });
  if (!canonicalCourse) {
    canonicalCourse = await db.course.create({
      data: {
        id: randomUUID(), languageId: canonicalJa.id, frameworkId: canonicalJlpt.id,
        names: { vi: 'Khóa Nhật chuẩn', en: 'Canonical Japanese Course' },
        isActive: true, defaultStartLevelId: canonicalN5.id,
      },
    });
  }
  let canonicalUnit = await db.unit.findFirst({
    where: { courseId: canonicalCourse.id, levelId: canonicalN5.id, position: 1 },
  });
  if (!canonicalUnit) {
    canonicalUnit = await db.unit.create({
      data: {
        id: randomUUID(), courseId: canonicalCourse.id, levelId: canonicalN5.id,
        code: 'JA-BASELINE-U1', names: { vi: 'Chương chuẩn', en: 'Canonical Unit' }, position: 1,
      },
    });
  }
  const canonicalJaBefore = { id: canonicalJa.id, isLearnable: canonicalJa.isLearnable, isUiLocale: canonicalJa.isUiLocale };
  const canonicalJlptBefore = { id: canonicalJlpt.id, version: canonicalJlpt.version };
  const canonicalLessonCount = await db.lesson.count({ where: { unitId: canonicalUnit.id } });
  f = await createJapaneseCurriculumFixture(db);
  const canonicalJaAfter = await db.language.findUnique({ where: { code: 'ja' }, select: { id: true, isLearnable: true, isUiLocale: true } });
  const canonicalJlptAfter = await db.framework.findUnique({ where: { code_version: { code: 'JLPT', version: '2020' } }, select: { id: true, version: true } });
  assert.deepEqual(canonicalJaAfter, canonicalJaBefore, 'Fixture must not create or mutate the canonical Japanese language');
  assert.deepEqual(canonicalJlptAfter, canonicalJlptBefore, 'Fixture must not create or mutate the canonical JLPT framework');
  assert.notEqual(f.language.id, canonicalJa.id);
  assert.notEqual(f.framework.id, canonicalJlpt.id);
  assert.notEqual(f.course.id, canonicalCourse.id, 'Fixture must not adopt an existing active canonical Japanese course');
  assert.notEqual(f.unit.id, canonicalUnit.id, 'Fixture must not adopt an existing canonical unit');
  assert.equal(await db.lesson.count({ where: { unitId: canonicalUnit.id } }), canonicalLessonCount);
  assert.match(f.language.code, /^ja-x-lingora-[0-9a-f]{12}$/);
  assert.match(f.framework.code, /^JLPT-S6-[0-9a-f]{12}$/);
});

describe('S6-08a.1: Japanese Curriculum Fixture & Progression Gating (PostgreSQL)', () => {
  test('(1) Published Japanese stage order is strictly sequential: Hiragana -> Katakana -> Basic Vocabulary -> Kanji Components -> Kanji -> Words with Kanji', async () => {
    assert.equal(f.lessons.length, 7, 'Expected 7 stages in Japanese curriculum fixture');

    // Stage 1: Hiragana (Lesson 1)
    const l1 = f.lessons[0];
    assert.equal(l1.position, 1);
    assert.equal(l1.stage, 'HIRAGANA');
    assert.equal(l1.availability, 'AVAILABLE');
    assert.equal(l1.activeRevision.status, 'PUBLISHED');
    assert.equal(f.characters.hiraganaI.glyph, 'い');
    assert.equal(f.characters.hiraganaI.scriptType, 'HIRAGANA');
    assert.equal(f.characters.hiraganaI.strokeCount, 2);
    const l1CharBlock = l1.activeRevision.blocks.find((b) => b.type === 'CHARACTER');
    assert.ok(l1CharBlock, 'Lesson 1 must contain a CHARACTER block');
    assert.equal(l1CharBlock.content.snapshot.glyph, 'い');
    assert.equal(l1CharBlock.content.guidedWriting, true);
    assert.equal(l1CharBlock.content.showStrokeAnimation, true);

    // Stage 2: Katakana (Lesson 2)
    const l2 = f.lessons[1];
    assert.equal(l2.position, 2);
    assert.equal(l2.stage, 'KATAKANA');
    assert.equal(l2.availability, 'AVAILABLE');
    assert.equal(l2.activeRevision.status, 'PUBLISHED');
    assert.equal(f.characters.katakanaA.glyph, 'ア');
    assert.equal(f.characters.katakanaA.scriptType, 'KATAKANA');
    assert.equal(f.characters.katakanaA.strokeCount, 2);
    const l2CharBlock = l2.activeRevision.blocks.find((b) => b.type === 'CHARACTER');
    assert.ok(l2CharBlock, 'Lesson 2 must contain a CHARACTER block');
    assert.equal(l2CharBlock.content.snapshot.glyph, 'ア');
    assert.equal(l2CharBlock.content.guidedWriting, true);

    // Stage 3: Basic Vocabulary without Kanji (Lesson 3)
    const l3 = f.lessons[2];
    assert.equal(l3.position, 3);
    assert.equal(l3.stage, 'BASIC_VOCABULARY');
    assert.equal(l3.availability, 'AVAILABLE');
    assert.equal(l3.activeRevision.status, 'PUBLISHED');
    assert.equal(f.vocabulary.basic.canonicalForm, 'いいえ');
    const l3VocabLink = l3.activeRevision.vocabularyLinks[0];
    assert.ok(l3VocabLink, 'Lesson 3 must contain a vocabulary link');
    assert.equal(l3VocabLink.vocabularyId, f.vocabulary.basic.id);

    // Stage 4: Kanji Components (Lesson 4)
    const l4 = f.lessons[3];
    assert.equal(l4.position, 4);
    assert.equal(l4.stage, 'KANJI_COMPONENTS');
    assert.equal(l4.availability, 'AVAILABLE');
    assert.equal(l4.activeRevision.status, 'PUBLISHED');
    assert.equal(f.characters.kanjiCompTree.glyph, '木');
    assert.equal(f.characters.kanjiCompTree.scriptType, 'KANJI');
    assert.equal(f.characters.kanjiCompTree.strokeCount, 4);
    assert.equal(f.characters.kanjiCompTree.metadata.radical, '木');

    // Stage 5: Kanji (Lesson 5)
    const l5 = f.lessons[4];
    assert.equal(l5.position, 5);
    assert.equal(l5.stage, 'KANJI');
    assert.equal(l5.availability, 'AVAILABLE');
    assert.equal(l5.activeRevision.status, 'PUBLISHED');
    assert.equal(f.characters.kanjiSun.glyph, '日');
    assert.equal(f.characters.kanjiSun.scriptType, 'KANJI');
    assert.equal(f.characters.kanjiSun.strokeCount, 4);
    assert.equal(f.characters.kanjiSun.metadata.jlptLevel, 'N5');

    // Stage 6: Words with Kanji (Lesson 6)
    const l6 = f.lessons[5];
    assert.equal(l6.position, 6);
    assert.equal(l6.stage, 'WORDS_CONTAINING_KANJI');
    assert.equal(l6.availability, 'AVAILABLE');
    assert.equal(l6.activeRevision.status, 'PUBLISHED');
    assert.equal(f.vocabulary.kanji.canonicalForm, '日本語');
    const l6VocabLink = l6.activeRevision.vocabularyLinks[0];
    assert.ok(l6VocabLink, 'Lesson 6 must contain vocabulary link for 日本語');
    assert.equal(l6VocabLink.vocabularyId, f.vocabulary.kanji.id);

    // Verify vocabulary characters mapping for 日本語 -> 日 (1), 本 (2), 語 (3)
    const mappings = await db.vocabularyCharacter.findMany({
      where: { vocabularyId: f.vocabulary.kanji.id },
      orderBy: { position: 'asc' },
      include: { character: true },
    });
    assert.equal(mappings.length, 3);
    assert.equal(mappings[0].position, 1);
    assert.equal(mappings[0].character.glyph, '日');
    assert.equal(mappings[1].position, 2);
    assert.equal(mappings[1].character.glyph, '本');
    assert.equal(mappings[2].position, 3);
    assert.equal(mappings[2].character.glyph, '語');

    // Stage 7: Incomplete curriculum (Lesson 7 remains PLANNED)
    const l7 = f.lessons[6];
    assert.equal(l7.position, 7);
    assert.equal(l7.stage, 'INCOMPLETE_PLANNED');
    assert.equal(l7.availability, 'PLANNED');
    assert.equal(l7.activeRevisionId, null);
  });

  test('(2) Learner Home/onboarding/course readiness reports PLANNED while required curriculum is incomplete', async () => {
    // 2a. Onboarding course recommendation selects Japanese course and start level N5
    const recommendation = await resolveRecommendation(db, {
      languageId: f.language.id,
      entryChoice: { startSource: 'DEFAULT' },
    });
    assert.ok(recommendation, 'Recommendation candidate must be resolved for Japanese');
    assert.equal(recommendation.course.id, f.course.id);
    assert.equal(recommendation.startLevel.id, f.level.id);
    assert.equal(recommendation.startLevel.code, 'N5');
    assert.ok(recommendation.nextLesson);
    assert.equal(recommendation.nextLesson.id, f.lessons[0].id);

    // 2b. Complete onboarding creates ACTIVE context and plan
    contextId = randomUUID();
    const onboardingRes = await completeOnboarding(
      f.learner,
      {
        contextId,
        languageId: f.language.id,
        purpose: 'TRAVEL',
        dailyGoalMinutes: 15,
        entryChoice: { startSource: 'DEFAULT' },
        expectedCourseId: f.course.id,
        expectedStartLevelId: f.level.id,
      },
      db
    );
    assert.equal(onboardingRes.context.id, contextId);
    assert.equal(onboardingRes.context.status, 'ACTIVE');
    assert.equal(onboardingRes.plan.contextId, contextId);
    assert.equal(onboardingRes.plan.status, 'ACTIVE');
    assert.equal(onboardingRes.nextLesson.id, f.lessons[0].id);

    // 2c. Home learning path reflects initial state: Lesson 1 CURRENT, 2-6 LOCKED, 7 COMING_SOON
    const homePath = await buildLearningPath(db, contextId, f.learner);
    assert.equal(homePath.status, 'READY');
    assert.equal(homePath.path.length, 7);

    // Node 1: Lesson 1 (Hiragana) is CURRENT (next eligible)
    assert.equal(homePath.path[0].lessonId, f.lessons[0].id);
    assert.equal(homePath.path[0].state, 'CURRENT');
    assert.equal(homePath.path[0].href, `/learn/${contextId}/${f.lessons[0].id}`);

    // Nodes 2 to 6: Locked sequential lessons
    for (let i = 1; i < 6; i++) {
      assert.equal(homePath.path[i].lessonId, f.lessons[i].id);
      assert.equal(homePath.path[i].state, 'LOCKED');
      assert.equal(homePath.path[i].href, '');
    }

    // Node 7: Lesson 7 is COMING_SOON (incomplete curriculum remains PLANNED)
    assert.equal(homePath.path[6].lessonId, f.lessons[6].id);
    assert.equal(homePath.path[6].state, 'COMING_SOON');
    assert.equal(homePath.path[6].title, 'Bài học sắp ra mắt');
    assert.equal(homePath.path[6].href, '');

    // Continue learning CTA points to Lesson 1
    assert.ok(homePath.continueLearning);
    assert.equal(homePath.continueLearning.lessonId, f.lessons[0].id);
    assert.equal(homePath.continueLearning.status, 'READY');

    // 2d. Incomplete curriculum (Lesson 7) cannot be loaded as learner detail (404 NOT_FOUND)
    await assert.rejects(
      loadLearnerLessonDetail(contextId, f.lessons[6].id, f.learner),
      (err) => {
        assert.equal(err.status, 404);
        assert.equal(err.error.code, 'NOT_FOUND');
        return true;
      }
    );

    // 2e. Separately seed a course with no eligible published lesson and verify onboarding excludes it with NO_ELIGIBLE_CURRICULUM
    const emptyLang = await db.language.create({
      data: {
        id: randomUUID(),
        code: 'ja-empty-' + randomUUID().slice(0, 8),
        names: { vi: 'Tiếng Nhật Trống', en: 'Empty Japanese' },
        isLearnable: true,
        isUiLocale: false,
      },
    });
    const emptyCourse = await db.course.create({
      data: {
        id: randomUUID(),
        languageId: emptyLang.id,
        frameworkId: f.framework.id,
        names: { vi: 'Khóa học chưa phát hành', en: 'Unpublished Course' },
        isActive: true,
        defaultStartLevelId: f.level.id,
      },
    });
    const emptyUnit = await db.unit.create({
      data: {
        id: randomUUID(),
        courseId: emptyCourse.id,
        levelId: f.level.id,
        code: 'EMPTY-U1',
        names: { vi: 'Chương 1', en: 'Unit 1' },
        position: 1,
      },
    });
    await db.lesson.create({
      data: {
        id: randomUUID(),
        unitId: emptyUnit.id,
        position: 1,
        isRequired: true,
        availability: 'PLANNED',
        rowVersion: 1n,
      },
    });

    const preview = await getOnboardingPreview(
      f.learner,
      {
        languageId: emptyLang.id,
        purpose: 'TRAVEL',
        dailyGoalMinutes: 15,
        entryChoice: { startSource: 'DEFAULT' },
      },
      db
    );
    assert.equal(preview.status, 'NO_ELIGIBLE_CURRICULUM');
    assert.match(preview.message, /chưa có bài học nào được phát hành/);

    const emptyRec = await resolveRecommendation(db, {
      languageId: emptyLang.id,
      entryChoice: { startSource: 'DEFAULT' },
    });
    assert.equal(emptyRec, null);
  });

  test('(3) Completing a core lesson unlocks exactly the next lesson (progression gating)', async () => {
    // Complete onboarding first to have active context
    contextId = randomUUID();
    await completeOnboarding(
      f.learner,
      {
        contextId,
        languageId: f.language.id,
        purpose: 'TRAVEL',
        dailyGoalMinutes: 15,
        entryChoice: { startSource: 'DEFAULT' },
        expectedCourseId: f.course.id,
        expectedStartLevelId: f.level.id,
      },
      db
    );

    // Baseline: Lesson 1 is unlocked, Lesson 2 is locked
    const l1Detail = await loadLearnerLessonDetail(contextId, f.lessons[0].id, f.learner);
    assert.equal(l1Detail.lessonId, f.lessons[0].id);

    await assert.rejects(
      loadLearnerLessonDetail(contextId, f.lessons[1].id, f.learner),
      (err) => {
        assert.equal(err.status, 409);
        assert.equal(err.error.code, 'LESSON_LOCKED');
        return true;
      }
    );

    // Reading through the production mutation service alone does NOT unlock Lesson 2.
    const readingStart = await mutateLessonConsumption(
      contextId,
      f.lessons[0].id,
      { action: 'start', expectedPublishedRevisionId: f.lessons[0].activeRevisionId },
      f.learner
    );
    assert.equal(readingStart.state, 'IN_PROGRESS');
    const readingComplete = await mutateLessonConsumption(
      contextId,
      f.lessons[0].id,
      { action: 'complete', expectedPublishedRevisionId: f.lessons[0].activeRevisionId },
      f.learner
    );
    assert.equal(readingComplete.state, 'COMPLETED');

    await assert.rejects(
      loadLearnerLessonDetail(contextId, f.lessons[1].id, f.learner),
      (err) => {
        assert.equal(err.status, 409, 'Lesson 2 must remain locked despite reading completion');
        assert.equal(err.error.code, 'LESSON_LOCKED');
        return true;
      }
    );

    // Perform official Core Lesson Practice Completion on Lesson 1
    const attemptId = randomUUID();
    const startResult = await startPracticeAttempt(
      contextId,
      f.lessons[0].id,
      {
        attemptId,
        expectedPublishedRevisionId: f.lessons[0].activeRevisionId,
      },
      f.learner
    );
    assert.equal(startResult.id, attemptId);
    assert.equal(startResult.lessonRevisionId, f.lessons[0].activeRevisionId);
    assert.equal(startResult.isCompleted, false);

    const coreExercise = f.lessons[0].activeRevision.exercises.find((ex) => ex.isCore);
    assert.ok(coreExercise, 'Lesson 1 must have a core exercise');

    const opKey1 = randomUUID();
    const respResult = await submitPracticeResponse(
      contextId,
      f.lessons[0].id,
      attemptId,
      {
        operationKey: opKey1,
        lessonExerciseId: coreExercise.id,
        input: { optionId: 'opt_i' },
      },
      f.learner
    );
    assert.equal(respResult.response.isCorrect, true);

    const finalizeOpKey = randomUUID();
    const finResult = await finalizePracticeAttempt(
      contextId,
      f.lessons[0].id,
      attemptId,
      { operationKey: finalizeOpKey },
      f.learner
    );
    assert.equal(finResult.attempt.isCompleted, true);
    assert.equal(finResult.isFirstCompletion, true);

    // Verify official LessonCompletion row exists in PostgreSQL
    const completion = await db.lessonCompletion.findUnique({
      where: {
        contextId_lessonId: {
          contextId,
          lessonId: f.lessons[0].id,
        },
      },
      include: { firstAttempt: { select: { id: true, lessonRevisionId: true } } },
    });
    assert.ok(completion, 'Official LessonCompletion must be persisted in database');
    assert.equal(completion.firstAttemptId, attemptId);
    assert.equal(completion.firstAttempt.id, attemptId);
    assert.equal(completion.firstAttempt.lessonRevisionId, f.lessons[0].activeRevisionId);

    // UNLOCK VERIFICATION: Exactly Lesson 2 (Katakana) is unlocked!
    const l2Detail = await loadLearnerLessonDetail(contextId, f.lessons[1].id, f.learner);
    assert.equal(l2Detail.lessonId, f.lessons[1].id);

    // Read public glyph through presentation.blocks and persisted glyph through blocks
    const l2PresChar = l2Detail.revision.presentation.blocks.find((b) => b.type === 'CHARACTER');
    assert.ok(l2PresChar, 'Lesson 2 presentation must contain CHARACTER block');
    assert.equal(l2PresChar.glyph, 'ア');

    const l2PersChar = l2Detail.revision.blocks.find((b) => b.type === 'CHARACTER');
    assert.ok(l2PersChar, 'Lesson 2 revision must contain CHARACTER block');
    assert.equal(l2PersChar.glyph, 'ア');

    // Lesson 3 (Basic vocabulary) is STILL LOCKED
    await assert.rejects(
      loadLearnerLessonDetail(contextId, f.lessons[2].id, f.learner),
      (err) => {
        assert.equal(err.status, 409, 'Lesson 3 must remain locked');
        assert.equal(err.error.code, 'LESSON_LOCKED');
        return true;
      }
    );

    // Lessons 4 to 6 remain locked
    for (let i = 3; i < 6; i++) {
      await assert.rejects(
        loadLearnerLessonDetail(contextId, f.lessons[i].id, f.learner),
        (err) => err.status === 409 && err.error.code === 'LESSON_LOCKED'
      );
    }

    // Verify Home learning path updated: Lesson 1 COMPLETED, Lesson 2 CURRENT, Lesson 3 LOCKED
    const updatedPath = await buildLearningPath(db, contextId, f.learner);
    assert.equal(updatedPath.path[0].state, 'COMPLETED');
    assert.equal(updatedPath.path[1].state, 'CURRENT');
    assert.equal(updatedPath.path[1].href, `/learn/${contextId}/${f.lessons[1].id}`);
    assert.equal(updatedPath.path[2].state, 'LOCKED');
    assert.equal(updatedPath.continueLearning.lessonId, f.lessons[1].id);
    assert.equal(updatedPath.continueLearning.status, 'READY');

    // Verify fixture rerun preserves publication identity
    const fRerun = await createJapaneseCurriculumFixture(db, {
      fixtureKey: f.fixtureKey,
      adminId: f.admin,
      teacherId: f.teacher,
      learnerId: f.learner,
    });
    for (let i = 0; i < 6; i++) {
      assert.equal(fRerun.lessons[i].id, f.lessons[i].id, `Lesson ${i + 1} identity must survive fixture rerun`);
      assert.equal(fRerun.lessons[i].activeRevisionId, f.lessons[i].activeRevisionId, `Lesson ${i + 1} publication must survive fixture rerun`);
    }
  });

  test('(4) Detail API returns safe errors for locked, PLANNED and missing lesson IDs', async () => {
    // Complete onboarding
    contextId = randomUUID();
    await completeOnboarding(
      f.learner,
      {
        contextId,
        languageId: f.language.id,
        purpose: 'TRAVEL',
        dailyGoalMinutes: 15,
        entryChoice: { startSource: 'DEFAULT' },
        expectedCourseId: f.course.id,
        expectedStartLevelId: f.level.id,
      },
      db
    );

    setupEnv();
    authenticateFixtureLearner(f.learner);
    const requestDetail = async (lessonId) => lessonDetailRoute.GET(
      new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lessonId}`),
      { params: Promise.resolve({ contextId, lessonId }) }
    );
    try {
      const lockedRes = await requestDetail(f.lessons[2].id);
      assert.equal(lockedRes.status, 409);
      const lockedBody = await lockedRes.json();
      assert.deepEqual(lockedBody, { error: { code: 'LESSON_LOCKED', message: 'Cần hoàn thành bài học trước.' } });

      const plannedRes = await requestDetail(f.lessons[6].id);
      assert.equal(plannedRes.status, 404);
      const plannedBody = await plannedRes.json();
      assert.deepEqual(plannedBody, { error: { code: 'NOT_FOUND', message: 'Bài học không khả dụng.' } });

      const missingLessonId = randomUUID();
      assert.equal(await db.lesson.findUnique({ where: { id: missingLessonId }, select: { id: true } }), null);
      const missingRes = await requestDetail(missingLessonId);
      assert.equal(missingRes.status, 404);
      const missingBody = await missingRes.json();
      assert.deepEqual(missingBody, { error: { code: 'NOT_FOUND', message: 'Bài học không khả dụng.' } });
    } finally {
      globalThis.fetch = originalFetch;
      cookieStore = { getAll: () => [], get: () => undefined, set: () => {}, delete: () => {} };
    }

    const hierarchy = await loadLessonHierarchy(db, f.course.id, f.framework.id, 1, new Set());
    const lesson3Hierarchy = hierarchy.flatMap((unit) => unit.lessons).find((lesson) => lesson.id === f.lessons[2].id);
    assert.ok(lesson3Hierarchy);
    assert.equal(lesson3Hierarchy.isLocked, true);
  });
});
