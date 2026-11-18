import { test, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../../../lingora-admin/generated/product-client/index.js';
import { getLearnerCookieName } from '../../src/server/auth/env.ts';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import { buildLearningPath } from '../../src/server/context/path-service.ts';
import { completeOnboarding, getOnboardingPreview } from '../../src/server/context/onboarding-service.ts';
import { resolveRecommendation } from '../../src/server/context/curriculum.ts';
import { loadLearnerLessonDetail } from '../../src/server/lessons/service.ts';
import { finalizePracticeAttempt, startPracticeAttempt, submitPracticeResponse } from '../../src/server/lessons/practice-service.ts';
import { createChineseCurriculumFixture } from './harness/chinese-curriculum-fixture.mjs';
import { providerDouble, providerOrigin, setupEnv, token } from './harness/learner-fixture.mjs';

let cookieStore = { getAll: () => [], get: () => undefined, set: () => {}, delete: () => {} };
const originalFetch = globalThis.fetch;
mock.module('next/headers.js', { exports: { cookies: async () => cookieStore } });
const lessonDetailRoute = await import('../../src/app/api/learner/contexts/[contextId]/lessons/[lessonId]/route.ts');

const databaseUrl = process.env.SLICE11_TEST_DATABASE_URL;
assert.ok(databaseUrl, 'Run through scripts/local-test-db.mjs to provision an owned database');
assert.equal(process.env.SLICE11_TEST_DATABASE_OWNED, '1');
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(databaseUrl).hostname));
assert.match(new URL(databaseUrl).pathname, /^\/slice11_test/);

const database = new PrismaClient({ datasources: { db: { url: databaseUrl } }, log: [] });

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

before(async () => {
  await database.$connect();
  setLearnerPrismaForTest(database);
});

after(async () => {
  globalThis.fetch = originalFetch;
  cookieStore = { getAll: () => [], get: () => undefined, set: () => {}, delete: () => {} };
  setLearnerPrismaForTest(null);
  await database.$disconnect();
});

test('S6-08b.1: Chinese curriculum publication, pinyin projection, media, and progression gates', async () => {
  setupEnv();
  const fixture = await createChineseCurriculumFixture(database);
  assert.equal(fixture.lessons.length, 7);
  assert.deepEqual(fixture.lessons.slice(0, 6).map((lesson) => lesson.stage), [
    'PINYIN_TONES', 'BASIC_HANZI', 'COMPONENTS', 'CHARACTERS', 'WORDS', 'SENTENCES',
  ]);
  for (const [index, lesson] of fixture.lessons.slice(0, 6).entries()) {
    assert.equal(lesson.position, index + 1);
    assert.equal(lesson.availability, 'AVAILABLE');
    assert.equal(lesson.activeRevision.status, 'PUBLISHED');
    assert.ok(lesson.activeRevision.exercises.some((exercise) => exercise.isCore));
  }
  assert.equal(fixture.lessons[6].availability, 'PLANNED');
  assert.equal(fixture.lessons[6].activeRevisionId, null);

  const recommendation = await resolveRecommendation(database, {
    languageId: fixture.language.id,
    entryChoice: { startSource: 'DEFAULT' },
  });
  assert.equal(recommendation.course.id, fixture.course.id);
  assert.equal(recommendation.startLevel.id, fixture.level.id);
  const contextId = randomUUID();
  const onboarding = await completeOnboarding(fixture.learner, {
    contextId,
    languageId: fixture.language.id,
    purpose: 'TRAVEL',
    dailyGoalMinutes: 15,
    entryChoice: { startSource: 'DEFAULT' },
    expectedCourseId: fixture.course.id,
    expectedStartLevelId: fixture.level.id,
  }, database);
  assert.equal(onboarding.context.id, contextId);
  assert.equal(onboarding.nextLesson.id, fixture.lessons[0].id);

  const path = await buildLearningPath(database, contextId, fixture.learner);
  assert.equal(path.path.length, 7);
  assert.equal(path.path[0].state, 'CURRENT');
  assert.equal(path.path[0].href, `/learn/${contextId}/${fixture.lessons[0].id}`);
  for (const lesson of path.path.slice(1, 6)) {
    assert.equal(lesson.state, 'LOCKED');
    assert.equal(lesson.href, '');
  }
  assert.equal(path.path[6].state, 'COMING_SOON');
  assert.equal(path.path[6].href, '');

  const emptyLanguage = await database.language.create({
    data: {
      code: `zh-empty-${fixture.fixtureKey}`,
      names: { vi: 'Tiếng Trung chưa phát hành', en: 'Unpublished Chinese' },
      isLearnable: true,
      isUiLocale: false,
    },
  });
  const emptyCourse = await database.course.create({
    data: {
      languageId: emptyLanguage.id,
      frameworkId: fixture.framework.id,
      names: { vi: 'Khóa chưa phát hành', en: 'Unpublished course' },
      isActive: true,
      defaultStartLevelId: fixture.level.id,
    },
  });
  const emptyUnit = await database.unit.create({
    data: { courseId: emptyCourse.id, levelId: fixture.level.id, code: `ZH-EMPTY-${fixture.fixtureKey}`, names: { en: 'Empty unit' }, position: 1 },
  });
  await database.lesson.create({ data: { unitId: emptyUnit.id, position: 1, isRequired: true, availability: 'PLANNED' } });
  const preview = await getOnboardingPreview(fixture.learner, {
    languageId: emptyLanguage.id,
    purpose: 'TRAVEL',
    dailyGoalMinutes: 15,
    entryChoice: { startSource: 'DEFAULT' },
  }, database);
  assert.equal(preview.status, 'NO_ELIGIBLE_CURRICULUM');
  assert.equal(await resolveRecommendation(database, { languageId: emptyLanguage.id, entryChoice: { startSource: 'DEFAULT' } }), null);

  authenticateFixtureLearner(fixture.learner);
  const requestDetail = async (lessonId) => lessonDetailRoute.GET(
    new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lessonId}`),
    { params: Promise.resolve({ contextId, lessonId }) },
  );
  const lockedResponse = await requestDetail(fixture.lessons[1].id);
  assert.equal(lockedResponse.status, 409);
  assert.deepEqual(await lockedResponse.json(), { error: { code: 'LESSON_LOCKED', message: 'Cần hoàn thành bài học trước.' } });
  const plannedResponse = await requestDetail(fixture.lessons[6].id);
  assert.equal(plannedResponse.status, 404);
  assert.deepEqual(await plannedResponse.json(), { error: { code: 'NOT_FOUND', message: 'Bài học không khả dụng.' } });
  const missingId = randomUUID();
  const missingResponse = await requestDetail(missingId);
  assert.equal(missingResponse.status, 404);
  assert.deepEqual(await missingResponse.json(), { error: { code: 'NOT_FOUND', message: 'Bài học không khả dụng.' } });

  const pinyinDetail = await loadLearnerLessonDetail(contextId, fixture.lessons[0].id, fixture.learner);
  const pinyinPresentation = JSON.stringify(pinyinDetail.revision.presentation.blocks);
  for (const tone of ['mā', 'má', 'mǎ', 'mà']) assert.ok(pinyinPresentation.includes(tone));
  assert.ok(pinyinPresentation.includes(fixture.audioUrl), 'Published learner projection must retain the validated HTTPS audio URL');
  const mediaBlock = pinyinDetail.revision.presentation.blocks.find((block) => block.type === 'MEDIA');
  assert.ok(mediaBlock);

  const attemptId = randomUUID();
  const firstLesson = fixture.lessons[0];
  const attempt = await startPracticeAttempt(contextId, firstLesson.id, {
    attemptId,
    expectedPublishedRevisionId: firstLesson.activeRevisionId,
  }, fixture.learner);
  assert.equal(attempt.lessonRevisionId, firstLesson.activeRevisionId);
  const exercise = firstLesson.activeRevision.exercises.find((entry) => entry.isCore);
  assert.ok(exercise);
  const response = await submitPracticeResponse(contextId, firstLesson.id, attemptId, {
    operationKey: randomUUID(),
    lessonExerciseId: exercise.id,
    input: { optionId: 'opt_third' },
  }, fixture.learner);
  assert.equal(response.response.isCorrect, true);
  const finalized = await finalizePracticeAttempt(contextId, firstLesson.id, attemptId, {
    operationKey: randomUUID(),
  }, fixture.learner);
  assert.equal(finalized.isFirstCompletion, true);
  const completion = await database.lessonCompletion.findUnique({
    where: { contextId_lessonId: { contextId, lessonId: firstLesson.id } },
    include: { firstAttempt: true },
  });
  assert.equal(completion.firstAttemptId, attemptId);
  assert.equal(completion.firstAttempt.lessonRevisionId, firstLesson.activeRevisionId);

  const updatedPath = await buildLearningPath(database, contextId, fixture.learner);
  assert.equal(updatedPath.path[0].state, 'COMPLETED');
  assert.equal(updatedPath.path[1].state, 'CURRENT');
  const unlockedResponse = await requestDetail(fixture.lessons[1].id);
  assert.equal(unlockedResponse.status, 200);
  const unlockedBody = await unlockedResponse.json();
  const character = unlockedBody.data.revision.presentation.blocks.find((block) => block.type === 'CHARACTER');
  assert.ok(character);
  assert.equal(character.glyph, '一');
  assert.equal(character.primaryReading, 'yī');
  assert.equal(character.meaning, 'một');
  assert.equal(character.strokeCount, 1);
  assert.equal(character.strokeVersion, 1);
  assert.equal('metadata' in character, false);
  assert.equal('strokes' in character, false);

  const mapped = await database.vocabularyCharacter.findMany({
    where: { vocabularyId: fixture.vocabulary.population.id },
    orderBy: { position: 'asc' },
    include: { character: true },
  });
  assert.deepEqual(mapped.map((entry) => [entry.position, entry.character.glyph]), [[1, '人'], [2, '口']]);

  const rerun = await createChineseCurriculumFixture(database, {
    fixtureKey: fixture.fixtureKey,
    adminId: fixture.admin,
    teacherId: fixture.teacher,
    learnerId: fixture.learner,
  });
  for (let index = 0; index < 6; index++) {
    assert.equal(rerun.lessons[index].id, fixture.lessons[index].id);
    assert.equal(rerun.lessons[index].activeRevisionId, fixture.lessons[index].activeRevisionId);
  }
});
