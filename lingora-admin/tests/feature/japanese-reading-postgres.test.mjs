import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import pkg from 'pg';
import { PrismaClient } from '../../generated/product-client/index.js';
import { seed } from '../../prisma/product/seed.mjs';
import { validateOwnedDatabaseUrl } from '../../../scripts/test-guard-utils.mjs';
import {
  installNetworkGuard,
  assertNoForbiddenOutbound,
} from '../../../scripts/test-network-guard.mjs';
import {
  createLesson,
  assignLesson,
  getTeacherLessonDetail,
  saveTeacherLessonDraft,
} from '../../src/server/lessons/index.ts';
import {
  submitTeacherLesson,
  getReviewDetail,
  approveReview,
  publishReview,
} from '../../src/server/lessons/workflow.ts';
import { loadLearnerLessonDetail } from '../../../lingora-web/src/server/lessons/service.ts';
import { startSrsReview } from '../../../lingora-web/src/server/srs/service.ts';
import {
  createReviewSession,
  revealSessionCurrentItem,
} from '../../../lingora-web/src/server/srs/session-service.ts';
import { setLearnerPrismaForTest } from '../../../lingora-web/src/server/db/index.ts';

const { Client } = pkg;

const guard = validateOwnedDatabaseUrl();
const databaseUrl = guard.ownedUrl;
const pgPort = Number(guard.parsedUrl.port || 5432);

installNetworkGuard({ allowedPorts: [pgPort] });

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
  log: [],
});

let pgClient;

const testTeacherId = '11111111-1111-4111-8111-111111111111';
const testAdminId = '00000000-0000-4000-8000-000000000001';
const testLearnerId = '22222222-2222-4222-8222-222222222222';

let jaLanguageId;
let jaCourseId;
let jaUnitId;
let jaContextId;
let enCourseId;
let enUnitId;

before(async () => {
  process.env.LINGORA_SRS_SIGNING_SECRET ||= 'test-srs-signing-secret-at-least-32-bytes-long';
  await prisma.$connect();
  setLearnerPrismaForTest(prisma);
  pgClient = new Client({ connectionString: databaseUrl });
  await pgClient.connect();
  await seed(prisma);

  await pgClient.query(`
    INSERT INTO auth.users (id, email) VALUES
      ('${testTeacherId}', 'teacher.ja@lingora.test'),
      ('${testAdminId}', 'admin.ja@lingora.test'),
      ('${testLearnerId}', 'learner.ja@lingora.test')
    ON CONFLICT (id) DO NOTHING;
  `);

  await pgClient.query(`
    INSERT INTO app.accounts (id, role, status, display_name, ui_locale, created_at, updated_at)
    VALUES
      ('${testTeacherId}', 'TEACHER', 'ACTIVE', 'JA Teacher', 'vi', NOW(), NOW()),
      ('${testAdminId}', 'ADMIN', 'ACTIVE', 'JA Admin', 'vi', NOW(), NOW()),
      ('${testLearnerId}', 'LEARNER', 'ACTIVE', 'JA Learner', 'vi', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE';
  `);

  const enUnit = await prisma.unit.findFirst({
    where: { course: { language: { code: 'en' } } },
  });
  assert.ok(enUnit, 'Seeded English unit must exist');
  enCourseId = enUnit.courseId;
  enUnitId = enUnit.id;

  const jaLanguage = await prisma.language.upsert({
    where: { code: 'ja' },
    update: { isLearnable: true },
    create: {
      code: 'ja',
      names: { vi: 'Tiếng Nhật', en: 'Japanese' },
      isLearnable: true,
    },
  });
  jaLanguageId = jaLanguage.id;

  const framework = await prisma.framework.create({
    data: {
      code: `JLPT-EXT01-${Date.now()}`,
      version: '1.0',
      names: { vi: 'JLPT', en: 'JLPT' },
    },
  });

  const levelN5 = await prisma.level.create({
    data: {
      frameworkId: framework.id,
      code: 'N5',
      position: 1,
      label: { vi: 'N5', en: 'N5' },
    },
  });

  const course = await prisma.course.create({
    data: {
      languageId: jaLanguage.id,
      frameworkId: framework.id,
      defaultStartLevelId: levelN5.id,
      names: { vi: 'Tiếng Nhật N5 (EXT-01)', en: 'Japanese N5' },
      isActive: true,
    },
  });
  jaCourseId = course.id;

  const unit = await prisma.unit.create({
    data: {
      courseId: course.id,
      levelId: levelN5.id,
      code: 'JA-EXT01-U1',
      position: 1,
      names: { vi: 'Chương 1', en: 'Unit 1' },
    },
  });
  jaUnitId = unit.id;

  const ctx = await prisma.learningContext.create({
    data: {
      learnerId: testLearnerId,
      courseId: course.id,
      languageId: jaLanguage.id,
      startSource: 'DEFAULT',
      selectedStartLevelId: levelN5.id,
      workingLevelId: levelN5.id,
      status: 'ACTIVE',
    },
  });
  jaContextId = ctx.id;
});

after(async () => {
  await prisma.$disconnect();
  await pgClient.end();
  assertNoForbiddenOutbound();
});

const sampleMcq = {
  position: 1,
  isCore: true,
  type: 'MCQ',
  promptData: {
    prompt: 'Nghĩa của 学生 là gì?',
    options: [
      { id: 'opt_1', text: 'học sinh' },
      { id: 'opt_2', text: 'giáo viên' },
    ],
  },
  gradingData: { correctOptionId: 'opt_1' },
};

describe('EXT-01: Japanese Reading Fields PostgreSQL End-to-End', () => {
  test('Cases 1-6: save, reload, submit, review, publish, learner, SRS, successor copy, legacy snapshot, conflict, validation', async () => {
    // 1. Create and assign Japanese lesson
    const createdLesson = await createLesson(testAdminId, jaCourseId, jaUnitId, {
      position: 1,
      isRequired: true,
    }, prisma);
    assert.equal(createdLesson.status, 201);
    const lessonId = createdLesson.data.data.id;

    const assigned = await assignLesson(testAdminId, jaCourseId, jaUnitId, lessonId, {
      teacherId: testTeacherId,
      expectedRowVersion: createdLesson.data.data.rowVersion,
    }, prisma);
    assert.equal(assigned.status, 200);

    // Save draft with reading and romanization (Case 1)
    const saved = await saveTeacherLessonDraft(testTeacherId, lessonId, {
      title: { vi: 'Bài 1: Học sinh' },
      contentSchemaVersion: 1,
      blocks: [
        {
          blockKey: 'blk_text_1',
          type: 'TEXT',
          position: 1,
          schemaVersion: 1,
          content: {
            nodes: [{ type: 'paragraph', runs: [{ text: 'Từ vựng mới' }] }],
          },
        },
      ],
      expectedRowVersion: assigned.data.data.rowVersion,
      expectedRevisionId: null,
      exercises: [sampleMcq],
      vocabulary: [
        {
          position: 1,
          isCore: true,
          create: {
            canonicalForm: '学生',
            senseKey: 'default',
            meaningLabels: { vi: 'học sinh', en: 'student' },
            reading: 'がくせい',
            romanization: 'gakusei',
            partOfSpeech: 'noun',
          },
        },
      ],
    }, prisma);
    assert.equal(saved.status, 200);
    const detailAfterSave = saved.data.data;
    assert.equal(detailAfterSave.vocabulary[0].displaySnapshot.reading, 'がくせい');
    assert.equal(detailAfterSave.vocabulary[0].displaySnapshot.romanization, 'gakusei');

    const reloaded = await getTeacherLessonDetail(testTeacherId, lessonId, prisma);
    assert.equal(reloaded.status, 200);
    assert.equal(reloaded.data.data.vocabulary[0].displaySnapshot.reading, 'がくせい');
    assert.equal(reloaded.data.data.vocabulary[0].displaySnapshot.romanization, 'gakusei');

    // Verify DB columns directly on app.vocabulary_concepts
    const dbConcept = await prisma.vocabularyConcept.findUnique({
      where: { id: detailAfterSave.vocabulary[0].vocabularyId },
    });
    assert.equal(dbConcept?.reading, 'がくせい');
    assert.equal(dbConcept?.romanization, 'gakusei');

    // Case 5: Conflict when same canonicalForm + senseKey has different reading
    const conflictSave = await saveTeacherLessonDraft(testTeacherId, lessonId, {
      title: { vi: 'Bài 1: Học sinh' },
      contentSchemaVersion: 1,
      blocks: detailAfterSave.blocks,
      expectedRowVersion: detailAfterSave.rowVersion,
      expectedRevisionId: detailAfterSave.highestRevision.id,
      exercises: [sampleMcq],
      vocabulary: [
        {
          position: 1,
          isCore: true,
          create: {
            canonicalForm: '学生',
            senseKey: 'default',
            meaningLabels: { vi: 'học sinh', en: 'student' },
            reading: 'がくしょう',
            romanization: 'gakusei',
            partOfSpeech: 'noun',
          },
        },
      ],
    }, prisma);
    assert.equal(conflictSave.status, 409);
    assert.equal(conflictSave.error?.code, 'VOCABULARY_IDENTITY_CONFLICT');

    // Case 6: Invalid reading (Latin/Kanji) -> 400
    for (const badReading of ['gakusei', '学生']) {
      const badSave = await saveTeacherLessonDraft(testTeacherId, lessonId, {
        title: { vi: 'Invalid' },
        contentSchemaVersion: 1,
        blocks: detailAfterSave.blocks,
        expectedRowVersion: detailAfterSave.rowVersion,
        expectedRevisionId: detailAfterSave.highestRevision.id,
        exercises: [sampleMcq],
        vocabulary: [
          {
            position: 1,
            isCore: true,
            create: {
              canonicalForm: '先生',
              senseKey: 'default',
              meaningLabels: { vi: 'giáo viên' },
              reading: badReading,
            },
          },
        ],
      }, prisma);
      assert.equal(badSave.status, 400);
      assert.equal(badSave.error?.code, 'VALIDATION_ERROR');
    }

    // Case 2: Submit -> Admin Review -> Approve -> Publish -> Learner + SRS
    const submitted = await submitTeacherLesson(testTeacherId, lessonId, {
      revisionId: detailAfterSave.highestRevision.id,
      expectedLessonRowVersion: detailAfterSave.rowVersion,
      expectedRevisionRowVersion: detailAfterSave.highestRevision.rowVersion,
    }, prisma);
    assert.equal(submitted.status, 200);
    const submissionId = submitted.data.submissionId;

    const reviewDetail = await getReviewDetail(testAdminId, submissionId, prisma);
    assert.equal(reviewDetail.status, 200);
    assert.equal(reviewDetail.data.data.vocabulary[0].displaySnapshot.reading, 'がくせい');
    assert.equal(reviewDetail.data.data.vocabulary[0].displaySnapshot.romanization, 'gakusei');

    const approved = await approveReview(testAdminId, submissionId, {
      expectedRevisionRowVersion: reviewDetail.data.data.revision.rowVersion,
    }, prisma);
    assert.equal(approved.status, 200);

    const published = await publishReview(testAdminId, submissionId, {
      expectedRevisionRowVersion: approved.data.data.revision.rowVersion,
      expectedLessonRowVersion: approved.data.data.lesson.rowVersion,
      makeAvailable: true,
    }, prisma);
    assert.equal(published.status, 200);

    // Learner lesson detail
    const learnerLesson = await loadLearnerLessonDetail(jaContextId, lessonId, testLearnerId);
    assert.equal(learnerLesson.vocabulary[0].displaySnapshot.reading, 'がくせい');
    assert.equal(learnerLesson.vocabulary[0].displaySnapshot.romanization, 'gakusei');
    assert.equal(learnerLesson.revision.presentation?.vocabulary[0].displaySnapshot.reading, 'がくせい');
    assert.equal(learnerLesson.revision.presentation?.vocabulary[0].displaySnapshot.romanization, 'gakusei');

    // SRS card & session reveal (Warm-up + SRS)
    await prisma.srsCard.create({
      data: {
        learnerId: testLearnerId,
        vocabularyId: dbConcept.id,
        stage: 1,
        dueAt: new Date(Date.now() - 60_000),
        enrollmentSource: 'OPTIONAL_CHOICE',
        sourceLessonVocabularyId: detailAfterSave.vocabulary[0].id,
      },
    });

    const srsStart = await startSrsReview(testLearnerId, {}, prisma);
    assert.equal(srsStart.done, false);
    assert.equal(srsStart.card?.reading, 'がくせい');
    assert.equal(srsStart.card?.romanization, 'gakusei');

    const session = await createReviewSession(testLearnerId, { contextId: jaContextId }, prisma);
    assert.equal(session.status, 'ACTIVE');
    const revealed = await revealSessionCurrentItem(
      testLearnerId,
      session.sessionId,
      { cardId: session.currentItem.cardId },
      prisma
    );
    assert.equal(revealed.reading, 'がくせい');
    assert.equal(revealed.romanization, 'gakusei');

    // Case 3: Successor revision from PUBLISHED keeps reading & romanization
    const successor = await saveTeacherLessonDraft(testTeacherId, lessonId, {
      title: { vi: 'Bài 1: Học sinh (v2)' },
      contentSchemaVersion: 1,
      blocks: detailAfterSave.blocks,
      expectedRowVersion: published.data.data.lesson.rowVersion,
      expectedRevisionId: published.data.data.revision.id,
      exercises: [
        {
          ...sampleMcq,
          sourceExerciseId: published.data.data.exercises[0].id,
        },
      ],
      vocabulary: [
        {
          position: 1,
          isCore: true,
          sourceLinkId: published.data.data.vocabulary[0].id,
        },
      ],
    }, prisma);
    assert.equal(successor.status, 200);
    assert.equal(successor.data.data.vocabulary[0].displaySnapshot.reading, 'がくせい');
    assert.equal(successor.data.data.vocabulary[0].displaySnapshot.romanization, 'gakusei');

    // Case 4: Legacy published snapshot without reading/romanization opens and creates successor cleanly
    const legacyLesson = await createLesson(testAdminId, jaCourseId, jaUnitId, {
      position: 2,
      isRequired: false,
    }, prisma);
    assert.equal(legacyLesson.status, 201);
    const legacyLessonId = legacyLesson.data.data.id;
    const legacyAssigned = await assignLesson(testAdminId, jaCourseId, jaUnitId, legacyLessonId, {
      teacherId: testTeacherId,
      expectedRowVersion: legacyLesson.data.data.rowVersion,
    }, prisma);
    assert.equal(legacyAssigned.status, 200);

    const legacyDraft = await saveTeacherLessonDraft(testTeacherId, legacyLessonId, {
      title: { vi: 'Bài legacy' },
      contentBlocks: [{ type: 'paragraph', text: 'Nội dung cũ' }],
      expectedRowVersion: legacyAssigned.data.data.rowVersion,
      expectedRevisionId: null,
      exercises: [sampleMcq],
      vocabulary: [
        {
          position: 1,
          isCore: true,
          create: {
            canonicalForm: '水',
            senseKey: 'default',
            meaningLabels: { vi: 'nước' },
            phonetic: 'みず',
          },
        },
      ],
    }, prisma);
    assert.equal(legacyDraft.status, 200);
    const legacyRevId = legacyDraft.data.data.highestRevision.id;
    const legacyLinkId = legacyDraft.data.data.vocabulary[0].id;
    // Strip reading/romanization keys from display_snapshot to simulate a pre-EXT-01 legacy snapshot.
    await pgClient.query(
      `UPDATE app.lesson_vocabulary_links SET display_snapshot = display_snapshot - 'reading' - 'romanization' WHERE id = $1::uuid`,
      [legacyLinkId]
    );
    const legacySub = await submitTeacherLesson(testTeacherId, legacyLessonId, {
      revisionId: legacyRevId,
      expectedLessonRowVersion: legacyDraft.data.data.rowVersion,
      expectedRevisionRowVersion: legacyDraft.data.data.highestRevision.rowVersion,
    }, prisma);
    assert.equal(legacySub.status, 200);
    const legacyRevDetail = await getReviewDetail(testAdminId, legacySub.data.submissionId, prisma);
    const legacyApproved = await approveReview(testAdminId, legacySub.data.submissionId, {
      expectedRevisionRowVersion: legacyRevDetail.data.data.revision.rowVersion,
    }, prisma);
    assert.equal(legacyApproved.status, 200);
    const legacyPublished = await publishReview(testAdminId, legacySub.data.submissionId, {
      expectedRevisionRowVersion: legacyApproved.data.data.revision.rowVersion,
      expectedLessonRowVersion: legacyApproved.data.data.lesson.rowVersion,
      makeAvailable: true,
    }, prisma);
    assert.equal(legacyPublished.status, 200);

    const legacyLoaded = await getTeacherLessonDetail(testTeacherId, legacyLessonId, prisma);
    assert.equal(legacyLoaded.status, 200);
    assert.equal(legacyLoaded.data.data.vocabulary[0].displaySnapshot.phonetic, 'みず');
    assert.equal(legacyLoaded.data.data.vocabulary[0].displaySnapshot.reading, null);

    const legacySuccessor = await saveTeacherLessonDraft(testTeacherId, legacyLessonId, {
      title: { vi: 'Bài legacy v2' },
      contentBlocks: [{ type: 'paragraph', text: 'Nội dung mới' }],
      expectedRowVersion: legacyLoaded.data.data.rowVersion,
      expectedRevisionId: legacyRevId,
    }, prisma);
    assert.equal(legacySuccessor.status, 200);
    assert.equal(legacySuccessor.data.data.vocabulary[0].displaySnapshot.phonetic, 'みず');

    const legacyLearner = await loadLearnerLessonDetail(jaContextId, legacyLessonId, testLearnerId);
    assert.equal(legacyLearner.vocabulary[0].displaySnapshot.phonetic, 'みず');

    // Case 6 (Q-C3): Non-Japanese course rejects reading & romanization
    const enLesson = await createLesson(testAdminId, enCourseId, enUnitId, {
      position: 99,
      isRequired: true,
    }, prisma);
    assert.equal(enLesson.status, 201);
    const enAssigned = await assignLesson(testAdminId, enCourseId, enUnitId, enLesson.data.data.id, {
      teacherId: testTeacherId,
      expectedRowVersion: enLesson.data.data.rowVersion,
    }, prisma);
    assert.equal(enAssigned.status, 200);

    const enRejected = await saveTeacherLessonDraft(testTeacherId, enLesson.data.data.id, {
      title: { vi: 'EN reject reading' },
      contentBlocks: [{ type: 'paragraph', text: 'Hello' }],
      expectedRowVersion: enAssigned.data.data.rowVersion,
      vocabulary: [
        {
          position: 1,
          isCore: true,
          create: {
            canonicalForm: 'apple',
            senseKey: 'default',
            meaningLabels: { vi: 'táo' },
            reading: 'アップル',
          },
        },
      ],
    }, prisma);
    assert.equal(enRejected.status, 400);
    assert.equal(enRejected.error?.code, 'VALIDATION_ERROR');
  });
});
