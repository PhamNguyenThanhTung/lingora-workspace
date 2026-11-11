import { test, describe, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import pkg from 'pg';

mock.module('server-only', { exports: {} });

const { PrismaClient } = await import('../../generated/product-client/index.js');
const { seed } = await import('../../prisma/product/seed.mjs');
const { validateOwnedDatabaseUrl } = await import('../../../scripts/test-guard-utils.mjs');
const {
  installNetworkGuard,
  assertNoForbiddenOutbound,
} = await import('../../../scripts/test-network-guard.mjs');
const {
  assignLesson,
  getTeacherLessonDetail,
  saveTeacherLessonDraft,
} = await import('../../src/server/lessons/index.ts');
const {
  submitTeacherLesson,
  getReviewDetail,
  requestChangesReview,
  approveReview,
  publishReview,
} = await import('../../src/server/lessons/workflow.ts');
const {
  createReviewComment,
  resolveReviewComment,
  reopenReviewComment,
  getRevisionComments,
} = await import('../../src/server/lessons/comments.ts');
const { loadLearnerLessonDetail } = await import('../../../lingora-web/src/server/lessons/service.ts');
const { setLearnerPrismaForTest } = await import('../../../lingora-web/src/server/db/index.ts');
const { LessonContent, toLessonPresentationDto } = await import('@lingora/lesson-content');

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
const otherTeacherId = '33333333-3333-4333-8333-333333333333';

let unitId;
let courseId;
let contextId;
let lessonId;
let assignmentId;

before(async () => {
  await prisma.$connect();
  setLearnerPrismaForTest(prisma);
  pgClient = new Client({ connectionString: databaseUrl });
  await pgClient.connect();
  await seed(prisma);

  const unit = await prisma.unit.findFirst({
    include: { course: true },
  });
  assert.ok(unit, 'Seeded unit must exist');
  unitId = unit.id;
  courseId = unit.courseId;

  // Ensure test accounts exist in auth.users and app.accounts
  await pgClient.query(`
    INSERT INTO auth.users (id, email) VALUES
      ('${testTeacherId}', 'teacher.test@lingora.test'),
      ('${testAdminId}', 'admin.test@lingora.test'),
      ('${testLearnerId}', 'learner.test@lingora.test'),
      ('${otherTeacherId}', 'other.teacher@lingora.test')
    ON CONFLICT (id) DO NOTHING;
  `);

  await pgClient.query(`
    INSERT INTO app.accounts (id, role, status, display_name, ui_locale, created_at, updated_at)
    VALUES
      ('${testTeacherId}', 'TEACHER', 'ACTIVE', 'Cô Hương', 'vi', NOW(), NOW()),
      ('${testAdminId}', 'ADMIN', 'ACTIVE', 'Quản trị viên', 'vi', NOW(), NOW()),
      ('${testLearnerId}', 'LEARNER', 'ACTIVE', 'Học viên Mai', 'vi', NOW(), NOW()),
      ('${otherTeacherId}', 'TEACHER', 'ACTIVE', 'Thầy Hùng', 'vi', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE';
  `);

  // Ensure learning context exists for learner
  const existingContext = await prisma.learningContext.findFirst({
    where: { learnerId: testLearnerId, courseId },
  });
  if (existingContext) {
    contextId = existingContext.id;
  } else {
    const level = await prisma.level.findFirst({
      where: { framework: { courses: { some: { id: courseId } } } },
    });
    assert.ok(level, 'Seeded level must exist');
    const ctx = await prisma.learningContext.create({
      data: {
        learnerId: testLearnerId,
        courseId,
        languageId: unit.course.languageId,
        startSource: 'DEFAULT',
        selectedStartLevelId: level.id,
        workingLevelId: level.id,
        status: 'ACTIVE',
      },
    });
    contextId = ctx.id;
  }

  // Create a dedicated test lesson for this E2E lifecycle
  const maxPos = await prisma.lesson.aggregate({
    where: { unitId },
    _max: { position: true },
  });
  const newPos = (maxPos._max.position || 0) + 1;

  const lesson = await prisma.lesson.create({
    data: {
      unitId,
      position: newPos,
      availability: 'PLANNED',
      isRequired: true,
      rowVersion: 1n,
    },
  });
  lessonId = lesson.id;

  // Assign lesson to testTeacherId
  const assignRes = await assignLesson(
    testAdminId,
    courseId,
    unitId,
    lessonId,
    { teacherId: testTeacherId, expectedRowVersion: '1' },
    prisma
  );
  assert.equal(assignRes.status, 200, `Assign failed: ${JSON.stringify(assignRes.error)}`);
});

after(async () => {
  await prisma.$disconnect();
  await pgClient.end();
  assertNoForbiddenOutbound();
});

describe('T12: End-to-End Sprint 1 Lifecycle Acceptance & Integration', () => {
  let v1RevisionId;
  let submission1Id;
  let headingBlockKey = 'blk_heading_test_01';
  let textBlockKey = 'blk_text_test_02';
  let calloutBlockKey = 'blk_callout_test_03';
  let dialogueBlockKey = 'blk_dialogue_test_04';
  let grammarBlockKey = 'blk_grammar_test_05';
  let mediaBlockKey = 'blk_media_test_06';
  let vocabBlockKey = 'blk_vocab_test_07';
  let exerciseItemRevisionId;
  let commentHeadingId;
  let commentExerciseId;
  let commentRevisionId;
  let successorRevisionId;
  let submission2Id;

  test('Step 1: Teacher authors and saves initial V1 draft with canonical blocks & core exercise', async () => {
    const lessonBefore = await prisma.lesson.findUnique({ where: { id: lessonId } });
    assert.ok(lessonBefore);

    const initialBlocks = [
      {
        blockKey: headingBlockKey,
        type: 'HEADING',
        position: 1,
        schemaVersion: 1,
        content: { level: 2, text: 'Chủ đề: Giao tiếp tại sân bay' },
      },
      {
        blockKey: textBlockKey,
        type: 'TEXT',
        position: 2,
        schemaVersion: 1,
        content: {
          nodes: [
            {
              type: 'paragraph',
              runs: [
                { text: 'Chào mừng các bạn đến với bài học ' },
                { text: 'Check-in tại sân bay', bold: true },
                { text: '. Hãy cùng luyện tập các câu thoại mẫu.' },
              ],
            },
          ],
        },
      },
      {
        blockKey: calloutBlockKey,
        type: 'CALLOUT',
        position: 3,
        schemaVersion: 1,
        content: {
          tone: 'tip',
          title: 'Mẹo phát âm',
          document: {
            nodes: [
              {
                type: 'paragraph',
                runs: [{ text: 'Nhấn trọng âm vào từ khóa quan trọng như boarding pass và gate.' }],
              },
            ],
          },
        },
      },
      {
        blockKey: dialogueBlockKey,
        type: 'DIALOGUE',
        position: 4,
        schemaVersion: 1,
        content: {
          lines: [
            { speaker: 'Staff', text: 'May I see your passport and ticket, please?', translation: 'Cho tôi xem hộ chiếu và vé của bạn nhé?' },
            { speaker: 'Passenger', text: 'Sure, here you go.', translation: 'Vâng, của bạn đây.' },
          ],
        },
      },
      {
        blockKey: grammarBlockKey,
        type: 'GRAMMAR',
        position: 5,
        schemaVersion: 1,
        content: {
          title: 'Cấu trúc May I + V...',
          explanation: 'Dùng để đưa ra lời xin phép một cách lịch sự, trang trọng.',
          examples: [
            { text: 'May I help you?', translation: 'Tôi có thể giúp bạn không?' },
          ],
        },
      },
      {
        blockKey: mediaBlockKey,
        type: 'MEDIA',
        position: 6,
        schemaVersion: 1,
        content: {
          kind: 'audio',
          url: 'https://cdn.lingora.test/audio/airport-checkin.mp3',
          caption: 'Audio hội thoại mẫu tại quầy thủ tục',
        },
      },
      {
        blockKey: vocabBlockKey,
        type: 'VOCABULARY',
        position: 7,
        schemaVersion: 1,
        content: {
          selection: 'lesson',
        },
      },
    ];

    const exercises = [
      {
        position: 1,
        isCore: true,
        type: 'MCQ',
        promptData: {
          prompt: 'What does the passenger give to the staff?',
          options: [
            { id: 'opt_a', text: 'Passport and ticket' },
            { id: 'opt_b', text: 'Driver license' },
            { id: 'opt_c', text: 'Credit card' },
          ],
        },
        gradingData: {
          correctOptionId: 'opt_a',
        },
        feedbackData: {
          explanation: 'The staff asked for passport and ticket, and the passenger complied.',
        },
      },
    ];

    const saveRes = await saveTeacherLessonDraft(
      testTeacherId,
      lessonId,
      {
        title: { vi: 'Thủ tục tại sân bay', en: 'Airport Check-in' },
        contentSchemaVersion: 1,
        blocks: initialBlocks,
        changeSummary: 'Bản thảo V1 ban đầu với đầy đủ khối canonical',
        expectedRowVersion: lessonBefore.rowVersion.toString(),
        expectedRevisionId: null,
        exercises,
      },
      prisma
    );

    assert.equal(saveRes.status, 200, `Save initial draft failed: ${JSON.stringify(saveRes.error)}`);
    assert.ok(saveRes.data?.data);
    const detail = saveRes.data.data;
    assert.equal(detail.contentSchemaVersion, 1);
    assert.equal(detail.blocks.length, 7);
    v1RevisionId = detail.highestRevision.id;

    // Verify rowVersion CAS on Lesson table
    const lessonAfter = await prisma.lesson.findUnique({ where: { id: lessonId } });
    assert.equal(lessonAfter.rowVersion, lessonBefore.rowVersion + 1n);

    // Verify blocks in database
    const dbBlocks = await prisma.lessonContentBlock.findMany({
      where: { lessonRevisionId: v1RevisionId },
      orderBy: { position: 'asc' },
    });
    assert.equal(dbBlocks.length, 7);
    assert.equal(dbBlocks[0].blockKey, headingBlockKey);
    assert.equal(dbBlocks[0].type, 'HEADING');

    // Verify exercise and grab itemRevisionId
    const dbExercises = await prisma.lessonExercise.findMany({
      where: { lessonRevisionId: v1RevisionId },
      include: { itemRevision: true },
    });
    assert.equal(dbExercises.length, 1);
    exerciseItemRevisionId = dbExercises[0].itemRevisionId;
    assert.ok(exerciseItemRevisionId, 'ItemRevisionId must exist');
  });

  test('Step 2: Teacher submits V1 lesson for review (transitions to IN_REVIEW)', async () => {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    const revision = await prisma.lessonRevision.findUnique({ where: { id: v1RevisionId } });

    const submitRes = await submitTeacherLesson(
      testTeacherId,
      lessonId,
      {
        revisionId: v1RevisionId,
        expectedLessonRowVersion: lesson.rowVersion.toString(),
        expectedRevisionRowVersion: revision.rowVersion.toString(),
      },
      prisma
    );

    assert.equal(submitRes.status, 200, `Submit failed: ${JSON.stringify(submitRes.error)}`);
    assert.ok(submitRes.data?.submissionId);
    submission1Id = submitRes.data.submissionId;

    // Verify status is IN_REVIEW
    const revAfter = await prisma.lessonRevision.findUnique({ where: { id: v1RevisionId } });
    assert.equal(revAfter.status, 'IN_REVIEW');

    // Invariant: Direct modification of IN_REVIEW revision is forbidden
    const forbiddenSave = await saveTeacherLessonDraft(
      testTeacherId,
      lessonId,
      {
        title: { vi: 'Forbidden edit', en: 'Forbidden edit' },
        contentSchemaVersion: 1,
        blocks: [],
        expectedRowVersion: (lesson.rowVersion + 1n).toString(),
        expectedRevisionId: v1RevisionId,
      },
      prisma
    );
    assert.equal(forbiddenSave.status, 409);
    assert.equal(forbiddenSave.error.code, 'DRAFT_NOT_EDITABLE');
  });

  test('Step 3: Admin inspects review detail and verifies canonical block parity', async () => {
    const reviewRes = await getReviewDetail(testAdminId, submission1Id, prisma);
    assert.equal(reviewRes.status, 200);
    const detail = reviewRes.data.data;

    assert.equal(detail.revision.contentSchemaVersion, 1);
    assert.ok(Array.isArray(detail.revision.blocks));
    assert.equal(detail.revision.blocks.length, 7);
    assert.equal(detail.revision.blocks[0].blockKey, headingBlockKey);
    assert.equal(detail.revision.blocks[0].type, 'HEADING');

    // Admin review has access to grading secret for verification
    assert.equal(detail.exercises.length, 1);
    assert.equal(detail.exercises[0].gradingData?.correctOptionId, 'opt_a');
  });

  test('Step 4: Admin creates review comments and requests changes', async () => {
    // 1. Block-anchored comment on Heading block
    const comment1 = await createReviewComment(
      testAdminId,
      v1RevisionId,
      {
        body: 'Tiêu đề nên ghi rõ "A1 - Thủ tục tại sân bay" để người học dễ phân loại cấp độ.',
        blockKey: headingBlockKey,
      },
      prisma,
      lessonId
    );
    assert.equal(comment1.status, 201);
    commentHeadingId = comment1.data.id;
    assert.equal(comment1.data.status, 'OPEN');
    assert.equal(comment1.data.blockKey, headingBlockKey);

    // 2. Item-anchored comment on Exercise
    const comment2 = await createReviewComment(
      testAdminId,
      v1RevisionId,
      {
        body: 'Câu hỏi nên bổ sung thêm tùy chọn đáp án D.',
        itemRevisionId: exerciseItemRevisionId,
      },
      prisma,
      lessonId
    );
    assert.equal(comment2.status, 201);
    commentExerciseId = comment2.data.id;
    assert.equal(comment2.data.itemRevisionId, exerciseItemRevisionId);

    // 3. Revision-wide comment
    const comment3 = await createReviewComment(
      testAdminId,
      v1RevisionId,
      {
        body: 'Tổng thể nội dung phong phú, cần hoàn thiện 2 điểm trên trước khi duyệt.',
      },
      prisma,
      lessonId
    );
    assert.equal(comment3.status, 201);
    commentRevisionId = comment3.data.id;
    assert.equal(comment3.data.blockKey, null);
    assert.equal(comment3.data.itemRevisionId, null);

    // Request changes
    const rev = await prisma.lessonRevision.findUnique({ where: { id: v1RevisionId } });
    const requestRes = await requestChangesReview(
      testAdminId,
      submission1Id,
      {
        expectedRevisionRowVersion: rev.rowVersion.toString(),
        comment: 'Yêu cầu cập nhật tiêu đề và bổ sung tùy chọn bài tập.',
      },
      prisma
    );
    assert.equal(requestRes.status, 200);
    const revAfter = await prisma.lessonRevision.findUnique({ where: { id: v1RevisionId } });
    assert.equal(revAfter.status, 'CHANGES_REQUESTED');
  });

  test('Step 5: Teacher inspects comments, resolves block comment, and saves successor V1 draft', async () => {
    // Teacher retrieves comments
    const listRes = await getRevisionComments(testTeacherId, lessonId, prisma);
    assert.equal(listRes.status, 200);
    assert.equal(listRes.data.comments.length, 3);

    // Teacher resolves the heading block comment
    const resolveRes = await resolveReviewComment(
      testTeacherId,
      commentHeadingId,
      '1',
      prisma,
      lessonId
    );
    assert.equal(resolveRes.status, 200);
    assert.equal(resolveRes.data.status, 'RESOLVED');
    assert.equal(resolveRes.data.resolvedBy?.id, testTeacherId);
    assert.ok(resolveRes.data.resolvedAt);

    // Security check: Unassigned teacher cannot resolve comments
    const unauthResolve = await resolveReviewComment(
      otherTeacherId,
      commentExerciseId,
      '1',
      prisma,
      lessonId
    );
    assert.equal(unauthResolve.status, 403);

    // Teacher saves successor V1 draft incorporating feedback
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    const updatedBlocks = [
      {
        blockKey: headingBlockKey,
        type: 'HEADING',
        position: 1,
        schemaVersion: 1,
        content: { level: 2, text: 'A1 - Thủ tục tại sân bay (Airport Check-in)' }, // Updated heading
      },
      {
        blockKey: textBlockKey,
        type: 'TEXT',
        position: 2,
        schemaVersion: 1,
        content: {
          nodes: [
            {
              type: 'paragraph',
              runs: [
                { text: 'Chào mừng các bạn đến với bài học ' },
                { text: 'Check-in tại sân bay', bold: true },
                { text: '. Hãy cùng luyện tập các câu thoại mẫu.' },
              ],
            },
          ],
        },
      },
      {
        blockKey: calloutBlockKey,
        type: 'CALLOUT',
        position: 3,
        schemaVersion: 1,
        content: {
          tone: 'tip',
          title: 'Mẹo phát âm',
          document: {
            nodes: [
              {
                type: 'paragraph',
                runs: [{ text: 'Nhấn trọng âm vào từ khóa quan trọng như boarding pass và gate.' }],
              },
            ],
          },
        },
      },
      {
        blockKey: dialogueBlockKey,
        type: 'DIALOGUE',
        position: 4,
        schemaVersion: 1,
        content: {
          lines: [
            { speaker: 'Staff', text: 'May I see your passport and ticket, please?', translation: 'Cho tôi xem hộ chiếu và vé của bạn nhé?' },
            { speaker: 'Passenger', text: 'Sure, here you go.', translation: 'Vâng, của bạn đây.' },
          ],
        },
      },
      {
        blockKey: grammarBlockKey,
        type: 'GRAMMAR',
        position: 5,
        schemaVersion: 1,
        content: {
          title: 'Cấu trúc May I + V...',
          explanation: 'Dùng để đưa ra lời xin phép một cách lịch sự, trang trọng.',
          examples: [
            { text: 'May I help you?', translation: 'Tôi có thể giúp bạn không?' },
          ],
        },
      },
      {
        blockKey: mediaBlockKey,
        type: 'MEDIA',
        position: 6,
        schemaVersion: 1,
        content: {
          kind: 'audio',
          url: 'https://cdn.lingora.test/audio/airport-checkin.mp3',
          caption: 'Audio hội thoại mẫu tại quầy thủ tục',
        },
      },
      // Note: blockKey vocabBlockKey is omitted here to test orphaned comment preservation if anchored
    ];

    const updatedExercises = [
      {
        position: 1,
        isCore: true,
        type: 'MCQ',
        promptData: {
          prompt: 'What does the passenger give to the staff?',
          options: [
            { id: 'opt_a', text: 'Passport and ticket' },
            { id: 'opt_b', text: 'Driver license' },
            { id: 'opt_c', text: 'Credit card' },
            { id: 'opt_d', text: 'Luggage tag' }, // Added option D as requested
          ],
        },
        gradingData: {
          correctOptionId: 'opt_a',
        },
        feedbackData: {
          explanation: 'The staff asked for passport and ticket, and the passenger complied.',
        },
      },
    ];

    const successorSave = await saveTeacherLessonDraft(
      testTeacherId,
      lessonId,
      {
        title: { vi: 'A1 - Thủ tục tại sân bay', en: 'Airport Check-in' },
        contentSchemaVersion: 1,
        blocks: updatedBlocks,
        changeSummary: 'Cập nhật tiêu đề A1 và thêm tùy chọn D cho bài tập',
        expectedRowVersion: lesson.rowVersion.toString(),
        expectedRevisionId: v1RevisionId,
        exercises: updatedExercises,
      },
      prisma
    );

    assert.equal(successorSave.status, 200, `Successor save failed: ${JSON.stringify(successorSave.error)}`);
    assert.ok(successorSave.data?.data);
    const successorDetail = successorSave.data.data;
    successorRevisionId = successorDetail.highestRevision.id;
    assert.notEqual(successorRevisionId, v1RevisionId);
    assert.equal(successorDetail.highestRevision.revisionNo, 2);

    // Invariant: Comments from revision 1 remain intact and queryable
    const allComments = await getRevisionComments(testTeacherId, lessonId, prisma);
    assert.equal(allComments.data.comments.length, 3);
    const resolvedHeadingComment = allComments.data.comments.find(c => c.id === commentHeadingId);
    assert.equal(resolvedHeadingComment.status, 'RESOLVED');
    assert.equal(resolvedHeadingComment.blockKey, headingBlockKey);
  });

  test('Step 6: Teacher re-submits successor draft (IN_REVIEW)', async () => {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    const revision = await prisma.lessonRevision.findUnique({ where: { id: successorRevisionId } });

    const submitRes = await submitTeacherLesson(
      testTeacherId,
      lessonId,
      {
        revisionId: successorRevisionId,
        expectedLessonRowVersion: lesson.rowVersion.toString(),
        expectedRevisionRowVersion: revision.rowVersion.toString(),
      },
      prisma
    );

    assert.equal(submitRes.status, 200);
    assert.ok(submitRes.data?.submissionId);
    submission2Id = submitRes.data.submissionId;

    const revAfter = await prisma.lessonRevision.findUnique({ where: { id: successorRevisionId } });
    assert.equal(revAfter.status, 'IN_REVIEW');
  });

  test('Step 7: Admin approves and publishes the lesson with makeAvailable=true', async () => {
    const revBeforeApprove = await prisma.lessonRevision.findUnique({ where: { id: successorRevisionId } });

    // Approve
    const approveRes = await approveReview(
      testAdminId,
      submission2Id,
      { expectedRevisionRowVersion: revBeforeApprove.rowVersion.toString() },
      prisma
    );
    assert.equal(approveRes.status, 200);
    const revAfterApprove = await prisma.lessonRevision.findUnique({ where: { id: successorRevisionId } });
    assert.equal(revAfterApprove.status, 'APPROVED');

    // Ensure parent course is active so makeAvailable succeeds
    await prisma.course.update({
      where: { id: courseId },
      data: { isActive: true },
    });

    // Publish
    const lessonBeforePublish = await prisma.lesson.findUnique({ where: { id: lessonId } });
    const publishRes = await publishReview(
      testAdminId,
      submission2Id,
      {
        expectedRevisionRowVersion: revAfterApprove.rowVersion.toString(),
        expectedLessonRowVersion: lessonBeforePublish.rowVersion.toString(),
        makeAvailable: true,
      },
      prisma
    );

    assert.equal(publishRes.status, 200);

    const publishedLesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    assert.equal(publishedLesson.availability, 'AVAILABLE');
    assert.equal(publishedLesson.activeRevisionId, successorRevisionId);

    const publishedRevision = await prisma.lessonRevision.findUnique({ where: { id: successorRevisionId } });
    assert.equal(publishedRevision.status, 'PUBLISHED');
  });

  test('Step 8: Learner consumes published lesson via loadLearnerLessonDetail & LessonContent (Zero Leak)', async () => {
    const learnerDetail = await loadLearnerLessonDetail(contextId, lessonId, testLearnerId);
    assert.ok(learnerDetail);
    assert.equal(learnerDetail.lessonId, lessonId);
    assert.equal(learnerDetail.revision.id, successorRevisionId);
    assert.equal(learnerDetail.revision.contentSchemaVersion, 1);
    assert.equal(learnerDetail.revision.blocks.length, 6);

    // Transform to public presentation DTO
    const presentation = learnerDetail.revision.presentation;
    assert.ok(presentation);
    assert.equal(presentation.blocks.length, 6);
    assert.equal(presentation.exercises.length, 1);

    // CRITICAL SECURITY CHECKS: Zero grading secrets / teacher answers in learner presentation DTO
    const presentationJson = JSON.stringify(presentation);
    assert.ok(
      !presentationJson.includes('CANARY_GRADING_SECRET_DO_NOT_LEAK'),
      'CRITICAL: Secret canary token leaked in presentation DTO!'
    );
    assert.ok(
      !presentationJson.includes('secretGraderToken'),
      'CRITICAL: secretGraderToken property leaked in presentation DTO!'
    );
    assert.ok(
      !presentationJson.includes('gradingData'),
      'CRITICAL: gradingData property leaked in presentation DTO!'
    );
    assert.ok(
      !presentationJson.includes('correctOptionId'),
      'CRITICAL: correctOptionId leaked in presentation DTO!'
    );

    // Exercise presentation has prompt and options
    const exPres = presentation.exercises[0];
    assert.equal(exPres.promptData.prompt, 'What does the passenger give to the staff?');
    assert.equal(exPres.promptData.options.length, 4);

    // Verify static SSR HTML rendering via shared LessonContent component
    const renderedHtml = renderToStaticMarkup(
      React.createElement(LessonContent, {
        presentation,
      })
    );

    assert.ok(renderedHtml.includes('A1 - Thủ tục tại sân bay (Airport Check-in)'));
    assert.ok(renderedHtml.includes('May I see your passport and ticket, please?'));
    assert.ok(renderedHtml.includes('Mẹo phát âm'));
    assert.ok(renderedHtml.includes('What does the passenger give to the staff?'));
    assert.ok(renderedHtml.includes('Passport and ticket'));

    // Verify HTML also contains zero secrets
    assert.ok(
      !renderedHtml.includes('correctOptionId'),
      'CRITICAL: correctOptionId leaked into rendered HTML!'
    );
    assert.ok(
      !renderedHtml.includes('gradingData'),
      'CRITICAL: gradingData leaked into rendered HTML!'
    );
  });

  test('Step 9: Security & Invariant verification (legacy save forbidden, CAS protection, reopen permissions)', async () => {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });

    // 1. Legacy paragraph save on V1 predecessor is strictly forbidden
    const legacySave = await saveTeacherLessonDraft(
      testTeacherId,
      lessonId,
      {
        title: { vi: 'Legacy attempt', en: 'Legacy attempt' },
        contentBlocks: [{ type: 'paragraph', text: 'Old format' }],
        expectedRowVersion: lesson.rowVersion.toString(),
      },
      prisma
    );
    assert.equal(legacySave.status, 409);
    assert.equal(legacySave.error.code, 'LEGACY_SAVE_FORBIDDEN_ON_V1');

    // 2. Concurrency CAS protection on comment resolution
    const staleResolve = await resolveReviewComment(
      testTeacherId,
      commentExerciseId,
      '999999',
      prisma,
      lessonId
    );
    assert.equal(staleResolve.status, 409);
    assert.equal(staleResolve.error.code, 'STALE_RECORD');

    // 3. Admin reopens resolved comment
    const reopenRes = await reopenReviewComment(
      testAdminId,
      commentHeadingId,
      '2',
      prisma,
      lessonId
    );
    assert.equal(reopenRes.status, 200);
    assert.equal(reopenRes.data.status, 'OPEN');
    assert.equal(reopenRes.data.resolvedAt, null);
    assert.equal(reopenRes.data.resolvedBy, null);

    // 4. Non-admin (teacher) cannot reopen comments
    const teacherReopen = await reopenReviewComment(
      testTeacherId,
      commentHeadingId,
      '3',
      prisma,
      lessonId
    );
    assert.equal(teacherReopen.status, 403);
  });
});
