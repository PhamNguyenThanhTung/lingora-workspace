import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../../generated/product-client/index.js';
import { seed } from '../../prisma/product/seed.mjs';
import { setProductPrismaForTest } from '../../src/server/db/index.js';
import { validateOwnedDatabaseUrl } from '../../../scripts/test-guard-utils.mjs';

const {
  submitTeacherLesson,
  approveReview,
  publishReview,
  saveTeacherLessonDraft,
  getReviewDetail,
  getTeacherCharacterOptions,
  getTeacherLessonDetail,
} = await import('../../src/server/lessons/index.ts');

const { createStroke, createAdminCharacter } = await import('../../src/server/characters/index.ts');

const { ownedUrl } = validateOwnedDatabaseUrl();

describe('S6-04a3: Validate persisted CHARACTER references and snapshots at submit and publish', () => {
  let prisma;
  let jaLang;
  let zhLang;
  let teacherId;
  let adminId;
  let jaCourse;
  let jaUnit;
  let lessonCounter = 100;

  // Characters
  let charJaSun; // 日 (Japanese)
  let charJaTree; // 木 (Japanese, static no-stroke)
  let charZhSun; // 日 (Chinese, same glyph, different language)

  const coreExercise = {
    type: 'MCQ',
    isCore: true,
    position: 1,
    promptData: {
      prompt: 'Chọn đáp án đúng',
      options: [
        { id: 'opt_1', text: 'Đáp án A' },
        { id: 'opt_2', text: 'Đáp án B' },
      ],
    },
    gradingData: { correctOptionId: 'opt_1' },
    feedbackData: {
      explanation: 'Giải thích ngắn gọn cho câu hỏi.',
    },
  };

  const getLesson = async (id) =>
    prisma.lesson.findUniqueOrThrow({ where: { id } });

  const getRevision = async (id) =>
    prisma.lessonRevision.findUniqueOrThrow({
      where: { id },
      include: {
        blocks: { orderBy: { position: 'asc' } },
        exercises: true,
      },
    });

  const countReviews = async (revisionId, action) =>
    prisma.revisionReview.count({
      where: {
        lessonRevisionId: revisionId,
        ...(action ? { action } : {}),
      },
    });

  async function createTestLesson() {
    lessonCounter += 1;
    const lesson = await prisma.lesson.create({
      data: {
        unitId: jaUnit.id,
        position: lessonCounter,
        isRequired: true,
        availability: 'PLANNED',
        rowVersion: 1n,
      },
    });
    const assignment = await prisma.contentAssignment.create({
      data: {
        lessonId: lesson.id,
        currentTeacherId: teacherId,
        createdBy: adminId,
        scopeGeneration: 1n,
      },
    });
    await prisma.assignmentHistory.create({
      data: {
        assignmentId: assignment.id,
        eventType: 'ASSIGNED',
        nextTeacherId: teacherId,
        changedBy: adminId,
        sequenceNo: 1,
        scopeGeneration: 1n,
        reason: 'Initial assignment',
      },
    });
    return { lesson, assignment };
  }

  async function saveDraft({
    lessonId,
    title,
    predecessor = null,
    blocks,
    contentSchemaVersion = 1,
    contentBlocks,
    exercises = [coreExercise],
  }) {
    const lesson = await getLesson(lessonId);
    const payload = {
      title: { vi: title },
      contentSchemaVersion,
      expectedRowVersion: String(lesson.rowVersion),
      expectedRevisionId: predecessor,
      ...(blocks !== undefined ? { blocks } : {}),
      ...(contentBlocks !== undefined ? { contentBlocks } : {}),
      ...(exercises !== undefined ? { exercises } : {}),
    };
    const res = await saveTeacherLessonDraft(teacherId, lessonId, payload, prisma);
    return res;
  }

  async function submit(revisionId, lessonId) {
    const lesson = await getLesson(lessonId);
    const rev = await getRevision(revisionId);
    return submitTeacherLesson(
      teacherId,
      lessonId,
      {
        revisionId,
        expectedLessonRowVersion: String(lesson.rowVersion),
        expectedRevisionRowVersion: String(rev.rowVersion),
      },
      prisma
    );
  }

  async function approve(submissionId, revisionId) {
    const rev = await getRevision(revisionId);
    return approveReview(
      adminId,
      submissionId,
      {
        expectedRevisionRowVersion: String(rev.rowVersion),
      },
      prisma
    );
  }

  async function publish(submissionId, revisionId, options = {}, lessonId) {
    const lesson = await getLesson(lessonId);
    const rev = await getRevision(revisionId);
    return publishReview(
      adminId,
      submissionId,
      {
        expectedLessonRowVersion: String(lesson.rowVersion),
        expectedRevisionRowVersion: String(rev.rowVersion),
        ...options,
      },
      prisma
    );
  }

  before(async () => {
    prisma = new PrismaClient({
      datasources: { db: { url: ownedUrl } },
      log: [],
    });

    await prisma.$connect();
    await seed(prisma);
    setProductPrismaForTest(prisma);

    // 1. Ensure Japanese and Chinese test languages
    jaLang = await prisma.language.upsert({
      where: { code: 'ja' },
      update: {},
      create: {
        code: 'ja',
        names: { ja: '日本語', en: 'Japanese', vi: 'Tiếng Nhật' },
        isLearnable: true,
        isUiLocale: false,
      },
    });

    zhLang = await prisma.language.upsert({
      where: { code: 'zh' },
      update: {},
      create: {
        code: 'zh',
        names: { zh: '中文', en: 'Chinese', vi: 'Tiếng Trung' },
        isLearnable: true,
        isUiLocale: false,
      },
    });

    // 2. Create synthetic teacher and admin accounts
    teacherId = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO auth.users (id, email)
      VALUES (${teacherId}::uuid, 's604a3-teacher@lingora.test')
      ON CONFLICT DO NOTHING
    `;
    await prisma.account.create({
      data: {
        id: teacherId,
        role: 'TEACHER',
        status: 'ACTIVE',
        displayName: 'S6-04a3 Teacher',
        uiLocale: 'vi',
      },
    });

    adminId = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO auth.users (id, email)
      VALUES (${adminId}::uuid, 's604a3-admin@lingora.test')
      ON CONFLICT DO NOTHING
    `;
    await prisma.account.create({
      data: {
        id: adminId,
        role: 'ADMIN',
        status: 'ACTIVE',
        displayName: 'S6-04a3 Admin',
        uiLocale: 'vi',
      },
    });

    // 3. Create Japanese course and unit
    jaCourse = await prisma.course.create({
      data: {
        language: { connect: { id: jaLang.id } },
        framework: { connect: { id: '00000000-0000-0000-0000-000000000010' } },
        defaultStartLevel: { connect: { id: '00000000-0000-0000-0000-000000000021' } },
        names: { vi: 'Khóa học Tiếng Nhật S6-04a3', en: 'Japanese S6-04a3' },
        isActive: true,
      },
    });

    jaUnit = await prisma.unit.create({
      data: {
        course: { connect: { id: jaCourse.id } },
        level: { connect: { id: '00000000-0000-0000-0000-000000000021' } },
        code: 'JA-U1-S604A3',
        position: 1,
        names: { vi: 'Bài mở đầu Nhật ngữ' },
      },
    });

    // 4. Create catalogue characters
    charJaSun = await prisma.writingCharacter.create({
      data: {
        languageId: jaLang.id,
        glyph: '日',
        scriptType: 'KANJI',
        strokeCount: 4,
        meaning: 'mặt trời / ngày',
        primaryReading: 'にち',
        romanization: 'nichi',
        metadata: { radical: '日' },
      },
    });

    await prisma.characterStrokeData.create({
      data: {
        characterId: charJaSun.id,
        version: 1,
        strokes: [
          createStroke(1, [[0.2, 0.1], [0.2, 0.9]]),
          createStroke(2, [[0.2, 0.1], [0.8, 0.1], [0.8, 0.9]]),
          createStroke(3, [[0.2, 0.5], [0.8, 0.5]]),
          createStroke(4, [[0.2, 0.9], [0.8, 0.9]]),
        ],
        source: 'Synthetic test stroke geometry',
        license: 'CC0-1.0',
        provenance: { source: 'test-suite' },
      },
    });

    charJaTree = await prisma.writingCharacter.create({
      data: {
        languageId: jaLang.id,
        glyph: '木',
        scriptType: 'KANJI',
        strokeCount: 4,
        meaning: 'cây',
        primaryReading: 'き',
        romanization: 'ki',
        metadata: { radical: '木' },
      },
    });
    // charJaTree intentionally has NO stroke data

    charZhSun = await prisma.writingCharacter.create({
      data: {
        languageId: zhLang.id,
        glyph: '日',
        scriptType: 'HANZI_SIMPLIFIED',
        strokeCount: 4,
        meaning: 'ngày',
        primaryReading: 'rì',
        romanization: 'ri4',
        metadata: { radical: '日' },
      },
    });
  });

  after(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  // ===========================================================================
  // 1. Successful Dynamic Workflow (Draft -> Submit -> Approve -> Publish)
  // ===========================================================================
  test('SUCCESSFUL DYNAMIC: draft -> submit -> approve -> publish with stroke pin', async () => {
    const { lesson } = await createTestLesson();

    const saveRes = await saveDraft({
      lessonId: lesson.id,
      title: 'Bài học ký tự 日 có hoạt ảnh nét',
      predecessor: null,
      blocks: [
        {
          blockKey: 'char_sun_anim',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charJaSun.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: true,
          },
        },
      ],
    });

    assert.equal(saveRes.status, 200, JSON.stringify(saveRes.error));
    const rev1Id = saveRes.data.data.highestRevision.id;
    const rev1Before = await getRevision(rev1Id);
    assert.equal(rev1Before.status, 'DRAFT');
    assert.equal(rev1Before.blocks[0].content.snapshot.strokeVersion, 1);

    // SUBMIT
    const submitRes = await submit(rev1Id, lesson.id);
    assert.equal(submitRes.status, 200, JSON.stringify(submitRes.error));
    const submissionId = submitRes.data.submissionId;

    const rev1Submitted = await getRevision(rev1Id);
    assert.equal(rev1Submitted.status, 'IN_REVIEW');
    assert.ok(rev1Submitted.submittedAt !== null);
    assert.equal(await countReviews(rev1Id, 'SUBMIT'), 1);

    // Verify item revision was frozen
    const exRev = await prisma.itemRevision.findUniqueOrThrow({
      where: { id: rev1Submitted.exercises[0].itemRevisionId },
    });
    assert.ok(exRev.frozenAt !== null);

    // APPROVE
    const approveRes = await approve(submissionId, rev1Id);
    assert.equal(approveRes.status, 200, JSON.stringify(approveRes.error));

    const rev1Approved = await getRevision(rev1Id);
    assert.equal(rev1Approved.status, 'APPROVED');
    assert.equal(await countReviews(rev1Id, 'APPROVE'), 1);

    // PUBLISH (with makeAvailable: true)
    const publishRes = await publish(submissionId, rev1Id, { makeAvailable: true }, lesson.id);
    assert.equal(publishRes.status, 200, JSON.stringify(publishRes.error));

    const rev1Published = await getRevision(rev1Id);
    assert.equal(rev1Published.status, 'PUBLISHED');
    assert.equal(await countReviews(rev1Id, 'PUBLISH'), 1);

    const lessonAfter = await getLesson(lesson.id);
    assert.equal(lessonAfter.activeRevisionId, rev1Id);
    assert.equal(lessonAfter.availability, 'AVAILABLE');

    // Snapshot integrity: strokeVersion and glyph preserved
    assert.equal(rev1Published.blocks[0].content.snapshot.glyph, '日');
    assert.equal(rev1Published.blocks[0].content.snapshot.strokeVersion, 1);
  });

  // ===========================================================================
  // 2. Static No-Stroke Path
  // ===========================================================================
  test('STATIC NO-STROKE PATH: draft -> submit -> approve -> publish for character without stroke data', async () => {
    const { lesson } = await createTestLesson();

    // charJaTree has NO stroke data in catalogue
    const saveRes = await saveDraft({
      lessonId: lesson.id,
      title: 'Bài học ký tự 木 tĩnh không cần nét',
      predecessor: null,
      blocks: [
        {
          blockKey: 'char_tree_static',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charJaTree.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: false,
            guidedWriting: false,
          },
        },
      ],
    });

    assert.equal(saveRes.status, 200, JSON.stringify(saveRes.error));
    const revId = saveRes.data.data.highestRevision.id;
    const revBefore = await getRevision(revId);
    assert.equal(revBefore.blocks[0].content.snapshot.strokeVersion, null);

    // SUBMIT succeeds despite no stroke data in DB
    const submitRes = await submit(revId, lesson.id);
    assert.equal(submitRes.status, 200, JSON.stringify(submitRes.error));
    const submissionId = submitRes.data.submissionId;

    // APPROVE
    const approveRes = await approve(submissionId, revId);
    assert.equal(approveRes.status, 200);

    // PUBLISH (with makeAvailable: false)
    const publishRes = await publish(submissionId, revId, { makeAvailable: false }, lesson.id);
    assert.equal(publishRes.status, 200, JSON.stringify(publishRes.error));

    const revPublished = await getRevision(revId);
    assert.equal(revPublished.status, 'PUBLISHED');
    assert.equal(revPublished.blocks[0].content.snapshot.strokeVersion, null);

    const lessonAfter = await getLesson(lesson.id);
    assert.equal(lessonAfter.activeRevisionId, revId);
  });

  // ===========================================================================
  // 3. Missing Character Reference Rejection (Submit & Publish)
  // ===========================================================================
  let missingSubmitError;
  let missingPublishError;

  test('MISSING REFERENCE: rejects submit and publish when characterId does not exist in DB', async () => {
    const { lesson } = await createTestLesson();

    // 1. Save valid draft
    const saveRes = await saveDraft({
      lessonId: lesson.id,
      title: 'Bản nháp tạm để sửa ID ký tự',
      predecessor: null,
      blocks: [
        {
          blockKey: 'char_valid_for_mutation',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charJaSun.id,
            showMeaning: true,
            showReading: false,
            showStrokeAnimation: false,
            guidedWriting: false,
          },
        },
      ],
    });
    assert.equal(saveRes.status, 200);
    const draftRevId = saveRes.data.data.highestRevision.id;

    // 2. Mutate characterId in DB to non-existent UUID BEFORE submit
    const nonExistentId = randomUUID();
    const currentBlock = (await getRevision(draftRevId)).blocks[0];
    await prisma.lessonContentBlock.update({
      where: { id: currentBlock.id },
      data: {
        content: {
          ...currentBlock.content,
          characterId: nonExistentId,
        },
      },
    });

    // SUBMIT must fail with controlled 400 VALIDATION_ERROR
    const submitRes = await submit(draftRevId, lesson.id);
    assert.equal(submitRes.status, 400);
    assert.equal(submitRes.error.code, 'VALIDATION_ERROR');
    assert.equal(
      submitRes.error.message,
      'Ký tự không tồn tại trong danh mục ký tự của khóa học.'
    );
    missingSubmitError = submitRes.error;

    // Verify rollback: status remains DRAFT, rowVersion unchanged, no reviews
    const revAfterSubmit = await getRevision(draftRevId);
    assert.equal(revAfterSubmit.status, 'DRAFT');
    assert.equal(await countReviews(draftRevId), 0);

    // 3. Restore valid characterId, submit and approve legitimately
    await prisma.lessonContentBlock.update({
      where: { id: currentBlock.id },
      data: {
        content: currentBlock.content,
      },
    });

    const submitValidRes = await submit(draftRevId, lesson.id);
    assert.equal(submitValidRes.status, 200);
    const submissionId = submitValidRes.data.submissionId;

    const approveRes = await approve(submissionId, draftRevId);
    assert.equal(approveRes.status, 200);

    // 4. NOW mutate characterId in DB to non-existent UUID AFTER approval (before publish)
    await prisma.lessonContentBlock.update({
      where: { id: currentBlock.id },
      data: {
        content: {
          ...currentBlock.content,
          characterId: nonExistentId,
        },
      },
    });

    // PUBLISH must fail with controlled 400 VALIDATION_ERROR
    const publishRes = await publish(submissionId, draftRevId, {}, lesson.id);
    assert.equal(publishRes.status, 400);
    assert.equal(publishRes.error.code, 'VALIDATION_ERROR');
    assert.equal(
      publishRes.error.message,
      'Ký tự không tồn tại trong danh mục ký tự của khóa học.'
    );
    missingPublishError = publishRes.error;

    // Verify rollback: status remains APPROVED, activeRevisionId untouched
    const revAfterPublish = await getRevision(draftRevId);
    assert.equal(revAfterPublish.status, 'APPROVED');
    assert.equal((await getLesson(lesson.id)).activeRevisionId, null);
  });

  // ===========================================================================
  // 4. Out-of-Language (Different Language) Character Reference
  // ===========================================================================
  test('OUT-OF-LANGUAGE: outside-language character triggers identical 400 VALIDATION_ERROR with zero leakage', async () => {
    const { lesson } = await createTestLesson();

    const saveRes = await saveDraft({
      lessonId: lesson.id,
      title: 'Bản nháp tạm để thử sai ngôn ngữ',
      predecessor: null,
      blocks: [
        {
          blockKey: 'char_valid_for_diff_lang',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charJaSun.id,
            showMeaning: true,
            showReading: false,
            showStrokeAnimation: false,
            guidedWriting: false,
          },
        },
      ],
    });
    assert.equal(saveRes.status, 200);
    const draftRevId = saveRes.data.data.highestRevision.id;

    // Mutate characterId in DB to Chinese character charZhSun.id BEFORE submit
    const currentBlock = (await getRevision(draftRevId)).blocks[0];
    await prisma.lessonContentBlock.update({
      where: { id: currentBlock.id },
      data: {
        content: {
          ...currentBlock.content,
          characterId: charZhSun.id,
        },
      },
    });

    // SUBMIT must fail
    const submitRes = await submit(draftRevId, lesson.id);
    assert.equal(submitRes.status, 400);
    assert.equal(submitRes.error.code, 'VALIDATION_ERROR');

    // Identical error envelope as missing character reference (zero info leakage)
    assert.deepEqual(submitRes.error, missingSubmitError);
    assert.doesNotMatch(submitRes.error.message, new RegExp(charZhSun.id, 'i'));

    // Verify rollback
    assert.equal((await getRevision(draftRevId)).status, 'DRAFT');
    assert.equal(await countReviews(draftRevId), 0);

    // Restore, submit and approve legitimately
    await prisma.lessonContentBlock.update({
      where: { id: currentBlock.id },
      data: {
        content: currentBlock.content,
      },
    });

    const submitValidRes = await submit(draftRevId, lesson.id);
    assert.equal(submitValidRes.status, 200);
    const submissionId = submitValidRes.data.submissionId;

    const approveRes = await approve(submissionId, draftRevId);
    assert.equal(approveRes.status, 200);

    // Mutate to Chinese character AFTER approval
    await prisma.lessonContentBlock.update({
      where: { id: currentBlock.id },
      data: {
        content: {
          ...currentBlock.content,
          characterId: charZhSun.id,
        },
      },
    });

    const publishRes = await publish(submissionId, draftRevId, {}, lesson.id);
    assert.equal(publishRes.status, 400);
    assert.equal(publishRes.error.code, 'VALIDATION_ERROR');
    assert.deepEqual(publishRes.error, missingPublishError);

    // Verify rollback
    assert.equal((await getRevision(draftRevId)).status, 'APPROVED');
    assert.equal((await getLesson(lesson.id)).activeRevisionId, null);
  });

  // ===========================================================================
  // 5. Invalid Snapshot Rejection (Submit & Publish)
  // ===========================================================================
  test('INVALID SNAPSHOT: rejects submit and publish when snapshot violates schema', async () => {
    const { lesson } = await createTestLesson();

    const saveRes = await saveDraft({
      lessonId: lesson.id,
      title: 'Bản nháp tạm để thử snapshot lỗi',
      predecessor: null,
      blocks: [
        {
          blockKey: 'char_valid_for_corrupt_snap',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charJaSun.id,
            showMeaning: true,
            showReading: false,
            showStrokeAnimation: false,
            guidedWriting: false,
          },
        },
      ],
    });
    assert.equal(saveRes.status, 200);
    const draftRevId = saveRes.data.data.highestRevision.id;

    // Mutate snapshot to invalid shape (empty glyph, invalid scriptType, negative strokeCount)
    const currentBlock = (await getRevision(draftRevId)).blocks[0];
    await prisma.lessonContentBlock.update({
      where: { id: currentBlock.id },
      data: {
        content: {
          ...currentBlock.content,
          snapshot: {
            glyph: '', // Invalid empty glyph
            scriptType: 'INVALID_SCRIPT_TYPE',
            strokeCount: -1,
          },
        },
      },
    });

    // SUBMIT must fail with controlled 400 UNSUPPORTED_DRAFT_CONTENT
    const submitRes = await submit(draftRevId, lesson.id);
    assert.equal(submitRes.status, 400);
    assert.equal(submitRes.error.code, 'UNSUPPORTED_DRAFT_CONTENT');

    // State preserved
    assert.equal((await getRevision(draftRevId)).status, 'DRAFT');

    // Restore valid snapshot, submit and approve legitimately
    await prisma.lessonContentBlock.update({
      where: { id: currentBlock.id },
      data: {
        content: currentBlock.content,
      },
    });

    const submitValidRes = await submit(draftRevId, lesson.id);
    assert.equal(submitValidRes.status, 200);
    const submissionId = submitValidRes.data.submissionId;

    const approveRes = await approve(submissionId, draftRevId);
    assert.equal(approveRes.status, 200);

    // Mutate snapshot to invalid shape AFTER approval
    await prisma.lessonContentBlock.update({
      where: { id: currentBlock.id },
      data: {
        content: {
          ...currentBlock.content,
          snapshot: {
            glyph: '',
            scriptType: 'INVALID_SCRIPT_TYPE',
            strokeCount: -1,
          },
        },
      },
    });

    const publishRes = await publish(submissionId, draftRevId, {}, lesson.id);
    assert.equal(publishRes.status, 400);
    assert.equal(publishRes.error.code, 'UNSUPPORTED_DRAFT_CONTENT');

    // State preserved
    assert.equal((await getRevision(draftRevId)).status, 'APPROVED');
    assert.equal((await getLesson(lesson.id)).activeRevisionId, null);
  });

  // ===========================================================================
  // 6. Changed or Removed Pin Between Submit and Publish
  // ===========================================================================
  test('PIN CHANGED OR REMOVED: rejects publish when stroke version changes or stroke data removed after submit', async () => {
    const { lesson } = await createTestLesson();

    // 1. Create a dedicated character with stroke data version 1
    const testChar = await prisma.writingCharacter.create({
      data: {
        languageId: jaLang.id,
        glyph: '月',
        scriptType: 'KANJI',
        strokeCount: 4,
        meaning: 'mặt trăng',
      },
    });

    await prisma.characterStrokeData.create({
      data: {
        characterId: testChar.id,
        version: 1,
        strokes: [createStroke(1, [[0.2, 0.2], [0.8, 0.8]])],
        source: 'synthetic',
        license: 'CC0',
        provenance: {},
      },
    });

    // 2. Draft and submit with stroke pin = 1
    const saveRes = await saveDraft({
      lessonId: lesson.id,
      title: 'Bài học ký tự 月 ghim nét v1',
      predecessor: null,
      blocks: [
        {
          blockKey: 'char_moon_anim',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: testChar.id,
            showMeaning: true,
            showReading: false,
            showStrokeAnimation: true,
            guidedWriting: false,
          },
        },
      ],
    });

    assert.equal(saveRes.status, 200);
    const revId = saveRes.data.data.highestRevision.id;
    assert.equal((await getRevision(revId)).blocks[0].content.snapshot.strokeVersion, 1);

    const submitRes = await submit(revId, lesson.id);
    assert.equal(submitRes.status, 200);
    const submissionId = submitRes.data.submissionId;

    const approveRes = await approve(submissionId, revId);
    assert.equal(approveRes.status, 200);

    const approvedRev = await getRevision(revId);
    assert.equal(approvedRev.status, 'APPROVED');

    // 3. MUTATION: Update stroke data version in DB from 1 -> 2 (pin becomes stale!)
    await prisma.characterStrokeData.update({
      where: { characterId: testChar.id },
      data: { version: 2 },
    });

    // Publish must fail with controlled VALIDATION_ERROR
    const failedPublish1 = await publish(submissionId, revId, { makeAvailable: true }, lesson.id);
    assert.equal(failedPublish1.status, 400);
    assert.equal(failedPublish1.error.code, 'VALIDATION_ERROR');
    assert.match(failedPublish1.error.message, /phiên bản nét đã thay đổi/i);

    // Verify state preserved
    assert.equal((await getRevision(revId)).status, 'APPROVED');

    // 4. MUTATION: Delete stroke data completely from DB (pin becomes unavailable!)
    await prisma.characterStrokeData.delete({
      where: { characterId: testChar.id },
    });

    const failedPublish2 = await publish(submissionId, revId, {}, lesson.id);
    assert.equal(failedPublish2.status, 400);
    assert.equal(failedPublish2.error.code, 'VALIDATION_ERROR');
    assert.match(failedPublish2.error.message, /không còn khả dụng/i);

    // Verify state preserved
    assert.equal((await getRevision(revId)).status, 'APPROVED');
    assert.equal((await getLesson(lesson.id)).activeRevisionId, null);
  });

  // ===========================================================================
  // 7. Preservation of Prior Workflow State & Active Pointer on Failed Successor
  // ===========================================================================
  test('SUCCESSOR INTEGRITY: failed successor publish preserves active pointer across makeAvailable variations', async () => {
    const { lesson } = await createTestLesson();

    // 1. Publish initial revision (Rev 1) with static character
    const save1 = await saveDraft({
      lessonId: lesson.id,
      title: 'Bản gốc xuất bản ban đầu',
      predecessor: null,
      blocks: [
        {
          blockKey: 'char_init_static',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charJaTree.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: false,
            guidedWriting: false,
          },
        },
      ],
    });
    assert.equal(save1.status, 200);
    const rev1Id = save1.data.data.highestRevision.id;

    const sub1 = await submit(rev1Id, lesson.id);
    assert.equal(sub1.status, 200);
    await approve(sub1.data.submissionId, rev1Id);
    const pub1 = await publish(sub1.data.submissionId, rev1Id, { makeAvailable: true }, lesson.id);
    assert.equal(pub1.status, 200);

    const initialLesson = await getLesson(lesson.id);
    assert.equal(initialLesson.activeRevisionId, rev1Id);
    assert.equal((await getRevision(rev1Id)).status, 'PUBLISHED');

    // 2. Create character for successor with stroke data version 1
    const charFire = await prisma.writingCharacter.create({
      data: {
        languageId: jaLang.id,
        glyph: '火',
        scriptType: 'KANJI',
        strokeCount: 4,
        meaning: 'lửa',
      },
    });

    await prisma.characterStrokeData.create({
      data: {
        characterId: charFire.id,
        version: 1,
        strokes: [createStroke(1, [[0.5, 0.1], [0.5, 0.9]])],
        source: 'synthetic',
        license: 'CC0',
        provenance: {},
      },
    });

    // 3. Save successor revision with pinned stroke version 1
    const save2 = await saveDraft({
      lessonId: lesson.id,
      title: 'Bản sửa đổi kế nhiệm ký tự 火',
      predecessor: rev1Id,
      blocks: [
        {
          blockKey: 'char_fire_anim',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charFire.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: true,
          },
        },
      ],
    });
    assert.equal(save2.status, 200);
    const rev2Id = save2.data.data.highestRevision.id;

    // Submit and approve successor
    const sub2 = await submit(rev2Id, lesson.id);
    assert.equal(sub2.status, 200);
    await approve(sub2.data.submissionId, rev2Id);

    const successorApproved = await getRevision(rev2Id);
    assert.equal(successorApproved.status, 'APPROVED');

    // 4. Mutate stroke data version in DB to make pin stale (v1 -> v3)
    await prisma.characterStrokeData.update({
      where: { characterId: charFire.id },
      data: { version: 3 },
    });

    const lessonBeforePublish = await getLesson(lesson.id);
    const reviewsBefore = await countReviews(rev2Id);

    // Try all 3 options: { makeAvailable: true }, { makeAvailable: false }, and {}
    for (const options of [{ makeAvailable: true }, { makeAvailable: false }, {}]) {
      const res = await publish(sub2.data.submissionId, rev2Id, options, lesson.id);

      assert.equal(res.status, 400);
      assert.equal(res.error.code, 'VALIDATION_ERROR');

      // CRITICAL INVARIANTS:
      // 1. Lesson activeRevisionId must NOT move to successor (must stay rev1Id)
      const lessonCurrent = await getLesson(lesson.id);
      assert.equal(lessonCurrent.activeRevisionId, rev1Id);
      assert.equal(lessonCurrent.rowVersion, lessonBeforePublish.rowVersion);

      // 2. Initial active revision must remain PUBLISHED (not ARCHIVED)
      const initialCurrent = await getRevision(rev1Id);
      assert.equal(initialCurrent.status, 'PUBLISHED');

      // 3. Successor revision must remain APPROVED (not PUBLISHED)
      const successorCurrent = await getRevision(rev2Id);
      assert.equal(successorCurrent.status, 'APPROVED');

      // 4. No new reviews recorded on successor
      assert.equal(await countReviews(rev2Id), reviewsBefore);
    }
  });

  // ===========================================================================
  // 8. Historical Snapshot Read Immutability
  // ===========================================================================
  test('HISTORICAL SNAPSHOT: published revision retains original snapshot text when catalogue is modified', async () => {
    const { lesson } = await createTestLesson();

    // Create character with meaning 'original meaning'
    const charWater = await prisma.writingCharacter.create({
      data: {
        languageId: jaLang.id,
        glyph: '水',
        scriptType: 'KANJI',
        strokeCount: 4,
        meaning: 'original water meaning',
        primaryReading: 'みず',
      },
    });

    const saveRes = await saveDraft({
      lessonId: lesson.id,
      title: 'Bài học ký tự 水 kiểm tra snapshot lịch sử',
      predecessor: null,
      blocks: [
        {
          blockKey: 'char_water_static',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charWater.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: false,
            guidedWriting: false,
          },
        },
      ],
    });
    assert.equal(saveRes.status, 200);
    const revId = saveRes.data.data.highestRevision.id;

    // Mutate catalogue text in DB BEFORE submit/publish
    await prisma.writingCharacter.update({
      where: { id: charWater.id },
      data: {
        meaning: 'MODIFIED WATER MEANING IN CATALOGUE',
        primaryReading: 'MODIFIED READING',
      },
    });

    // Submit -> Approve -> Publish
    const submitRes = await submit(revId, lesson.id);
    assert.equal(submitRes.status, 200);

    const approveRes = await approve(submitRes.data.submissionId, revId);
    assert.equal(approveRes.status, 200);

    const publishRes = await publish(submitRes.data.submissionId, revId, {}, lesson.id);
    assert.equal(publishRes.status, 200);

    // Published revision MUST retain original historical snapshot text, NOT new catalogue values
    const publishedRev = await getRevision(revId);
    assert.equal(publishedRev.status, 'PUBLISHED');
    assert.equal(
      publishedRev.blocks[0].content.snapshot.meaning,
      'original water meaning'
    );
    assert.equal(publishedRev.blocks[0].content.snapshot.primaryReading, 'みず');
  });

  // ===========================================================================
  // 9. Legacy Revision Workflow Preservation
  // ===========================================================================
  test('LEGACY PRESERVATION: legacy revision (contentSchemaVersion 0) passes submit -> approve -> publish', async () => {
    const { lesson } = await createTestLesson();

    const saveRes = await saveDraft({
      lessonId: lesson.id,
      title: 'Bài học Legacy thuần văn bản',
      predecessor: null,
      contentSchemaVersion: 0,
      contentBlocks: [
        { type: 'paragraph', text: 'Đoạn văn 1' },
        { type: 'paragraph', text: 'Đoạn văn 2' },
      ],
      exercises: [coreExercise],
    });
    assert.equal(saveRes.status, 200, JSON.stringify(saveRes.error));
    const legacyRevId = saveRes.data.data.highestRevision.id;

    // Submit legacy
    const submitRes = await submit(legacyRevId, lesson.id);
    assert.equal(submitRes.status, 200, JSON.stringify(submitRes.error));

    // Approve legacy
    const approveRes = await approve(submitRes.data.submissionId, legacyRevId);
    assert.equal(approveRes.status, 200, JSON.stringify(approveRes.error));

    // Publish legacy
    const publishRes = await publish(submitRes.data.submissionId, legacyRevId, {}, lesson.id);
    assert.equal(publishRes.status, 200, JSON.stringify(publishRes.error));

    const publishedLegacy = await getRevision(legacyRevId);
    assert.equal(publishedLegacy.status, 'PUBLISHED');
    assert.equal(publishedLegacy.contentSchemaVersion, 0);

    const lessonAfter = await getLesson(lesson.id);
    assert.equal(lessonAfter.activeRevisionId, legacyRevId);
  });

  // ===========================================================================
  // 10. Collection Invariants: Normalized blockKey Duplication
  // ===========================================================================
  test('COLLECTION INVARIANTS: duplicate normalized blockKey (\'same\' and \' same \') rejects submit with controlled 400 and preserves state', async () => {
    const { lesson } = await createTestLesson();

    const saveRes = await saveDraft({
      lessonId: lesson.id,
      title: 'Bài học kiểm tra blockKey trùng sau chuẩn hóa',
      blocks: [
        {
          blockKey: 'char_single',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charJaTree.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: false,
            guidedWriting: false,
          },
        },
      ],
    });
    assert.equal(saveRes.status, 200, JSON.stringify(saveRes.error));
    const revId = saveRes.data.data.highestRevision.id;

    // Insert two blocks whose raw strings differ only by surrounding whitespace
    await prisma.lessonContentBlock.createMany({
      data: [
        {
          lessonRevisionId: revId,
          blockKey: 'same',
          position: 2,
          type: 'DIVIDER',
          schemaVersion: 1,
          content: {},
        },
        {
          lessonRevisionId: revId,
          blockKey: ' same ',
          position: 3,
          type: 'DIVIDER',
          schemaVersion: 1,
          content: {},
        },
      ],
    });

    const lessonBefore = await getLesson(lesson.id);
    const revBefore = await getRevision(revId);
    const reviewCountBefore = await countReviews(revId);

    const submitRes = await submit(revId, lesson.id);
    assert.equal(submitRes.status, 400, 'Duplicate normalized blockKey must fail submit');
    assert.equal(submitRes.error.code, 'UNSUPPORTED_DRAFT_CONTENT');

    const lessonAfter = await getLesson(lesson.id);
    const revAfter = await getRevision(revId);
    const reviewCountAfter = await countReviews(revId);

    assert.equal(lessonAfter.rowVersion, lessonBefore.rowVersion);
    assert.equal(revAfter.status, revBefore.status);
    assert.equal(revAfter.rowVersion, revBefore.rowVersion);
    assert.equal(reviewCountAfter, reviewCountBefore);
  });

  // ===========================================================================
  // 11. Collection Invariants: 1 MiB UTF-8 Canonical JSON Payload Limit
  // ===========================================================================
  test('COLLECTION INVARIANTS: oversized payload (> 1 MiB UTF-8 canonical JSON) rejects submit with controlled 400 and preserves state', async () => {
    const { lesson } = await createTestLesson();

    const saveRes = await saveDraft({
      lessonId: lesson.id,
      title: 'Bài học kiểm tra giới hạn 1 MiB payload',
      blocks: [
        {
          blockKey: 'char_single',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charJaTree.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: false,
            guidedWriting: false,
          },
        },
      ],
    });
    assert.equal(saveRes.status, 200, JSON.stringify(saveRes.error));
    const revId = saveRes.data.data.highestRevision.id;

    // Insert 1 TEXT block with 20 runs of 20,000 '語' characters (~1.2 MB UTF-8)
    await prisma.lessonContentBlock.create({
      data: {
        lessonRevisionId: revId,
        blockKey: 'large-multibyte',
        position: 2,
        type: 'TEXT',
        schemaVersion: 1,
        content: {
          nodes: [
            {
              type: 'paragraph',
              runs: Array.from({ length: 20 }, () => ({
                text: '語'.repeat(20000),
              })),
            },
          ],
        },
      },
    });

    const lessonBefore = await getLesson(lesson.id);
    const revBefore = await getRevision(revId);
    const reviewCountBefore = await countReviews(revId);

    const submitRes = await submit(revId, lesson.id);
    assert.equal(submitRes.status, 400, 'Oversized canonical block payload must fail submit');
    assert.equal(submitRes.error.code, 'UNSUPPORTED_DRAFT_CONTENT');

    const lessonAfter = await getLesson(lesson.id);
    const revAfter = await getRevision(revId);
    const reviewCountAfter = await countReviews(revId);

    assert.equal(lessonAfter.rowVersion, lessonBefore.rowVersion);
    assert.equal(revAfter.status, revBefore.status);
    assert.equal(revAfter.rowVersion, revBefore.rowVersion);
    assert.equal(reviewCountAfter, reviewCountBefore);
  });

  // ===========================================================================
  // 12. S6-04b2: Admin Review Detail Access Control, Snapshot Projection & Allowlist
  // ===========================================================================
  test('S6-04b2 ACCESS CONTROL: Admin review detail rejects teacher, inactive admin, and non-existent submission', async () => {
    const { lesson } = await createTestLesson();
    const saveRes = await saveDraft({
      lessonId: lesson.id,
      title: 'Bài học kiểm tra phân quyền xem bản nộp',
      blocks: [
        {
          blockKey: 'char_sun',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charJaSun.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: true,
          },
        },
      ],
    });
    assert.equal(saveRes.status, 200);
    const revId = saveRes.data.data.highestRevision.id;
    const submitRes = await submit(revId, lesson.id);
    assert.equal(submitRes.status, 200);
    const submissionId = submitRes.data.submissionId;

    // 1. ACTIVE Admin succeeds with 200
    const adminRes = await getReviewDetail(adminId, submissionId, prisma);
    assert.equal(adminRes.status, 200);
    assert.equal(adminRes.data.data.submissionId, submissionId);

    // 2. Teacher caller is rejected with 403 FORBIDDEN
    const teacherRes = await getReviewDetail(teacherId, submissionId, prisma);
    assert.equal(teacherRes.status, 403);
    assert.equal(teacherRes.error.code, 'FORBIDDEN');

    // 3. Inactive Admin is rejected with 403 ACCOUNT_INACTIVE
    const inactiveAdminId = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO auth.users (id, email)
      VALUES (${inactiveAdminId}::uuid, 'inactive-admin@lingora.test')
      ON CONFLICT DO NOTHING
    `;
    await prisma.account.create({
      data: {
        id: inactiveAdminId,
        role: 'ADMIN',
        status: 'DISABLED',
        displayName: 'Inactive Admin',
        uiLocale: 'vi',
      },
    });
    const inactiveRes = await getReviewDetail(inactiveAdminId, submissionId, prisma);
    assert.equal(inactiveRes.status, 403);
    assert.equal(inactiveRes.error.code, 'ACCOUNT_INACTIVE');

    // 4. Non-existent submission ID returns 404 SUBMISSION_NOT_FOUND
    const missingSubRes = await getReviewDetail(adminId, randomUUID(), prisma);
    assert.equal(missingSubRes.status, 404);
    assert.equal(missingSubRes.error.code, 'SUBMISSION_NOT_FOUND');
  });

  test('S6-04b2 DTO PROJECTION: Admin review projects snapshot through strict allowlist according to display flags', async () => {
    const { lesson } = await createTestLesson();

    const saveRes = await saveDraft({
      lessonId: lesson.id,
      title: 'Bài học kiểm tra chiếu snapshot Admin',
      blocks: [
        {
          blockKey: 'char_sun_full',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charJaSun.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: true,
          },
        },
        {
          blockKey: 'char_tree_masked',
          type: 'CHARACTER',
          position: 2,
          schemaVersion: 1,
          content: {
            characterId: charJaTree.id,
            showMeaning: false,
            showReading: false,
            showStrokeAnimation: false,
            guidedWriting: false,
          },
        },
        {
          blockKey: 'heading_v1',
          type: 'HEADING',
          position: 3,
          schemaVersion: 1,
          content: {
            level: 2,
            text: 'Tiêu đề khối V1 đi kèm',
          },
        },
      ],
    });
    assert.equal(saveRes.status, 200);
    const revId = saveRes.data.data.highestRevision.id;
    const submitRes = await submit(revId, lesson.id);
    assert.equal(submitRes.status, 200);
    const submissionId = submitRes.data.submissionId;

    const detailRes = await getReviewDetail(adminId, submissionId, prisma);
    assert.equal(detailRes.status, 200);
    const rev = detailRes.data.data.revision;
    assert.equal(rev.blocks.length, 3, 'All 3 blocks must be present in position order');

    // Block 1: Dynamic character with all flags enabled
    const block1 = rev.blocks[0];
    assert.equal(block1.type, 'CHARACTER');
    assert.equal(block1.blockKey, 'char_sun_full');
    assert.equal(block1.position, 1);
    assert.equal(block1.glyph, '日');
    assert.equal(block1.scriptType, 'KANJI');
    assert.equal(block1.strokeCount, 4);
    assert.equal(block1.showMeaning, true);
    assert.equal(block1.meaning, 'mặt trời / ngày');
    assert.equal(block1.showReading, true);
    assert.equal(block1.primaryReading, 'にち');
    assert.equal(block1.romanization, 'nichi');
    assert.equal(block1.showStrokeAnimation, true);
    assert.equal(block1.guidedWriting, true);
    assert.equal(block1.strokeVersion, 1);

    // Strict allowlist: forbidden fields must NOT leak into DTO
    assert.equal('metadata' in block1, false, 'Catalogue metadata must not leak into admin block DTO');
    assert.equal('strokes' in block1, false, 'Raw stroke geometry must not leak into admin block DTO');
    assert.equal('characterId' in block1, false, 'Internal characterId should not be in projected display block');

    // Block 2: Static character with flags disabled
    const block2 = rev.blocks[1];
    assert.equal(block2.type, 'CHARACTER');
    assert.equal(block2.blockKey, 'char_tree_masked');
    assert.equal(block2.position, 2);
    assert.equal(block2.glyph, '木');
    assert.equal(block2.scriptType, 'KANJI');
    assert.equal(block2.strokeCount, 4);
    assert.equal(block2.showMeaning, false);
    assert.equal('meaning' in block2, false, 'meaning MUST be omitted when showMeaning is false');
    assert.equal(block2.showReading, false);
    assert.equal('primaryReading' in block2, false, 'primaryReading MUST be omitted when showReading is false');
    assert.equal('romanization' in block2, false, 'romanization MUST be omitted when showReading is false');
    assert.equal(block2.showStrokeAnimation, false);
    assert.equal(block2.guidedWriting, false);
    assert.equal('strokeVersion' in block2, false, 'strokeVersion MUST be omitted for unpinned static character');

    // Block 3: HEADING block preserved
    const block3 = rev.blocks[2];
    assert.equal(block3.type, 'HEADING');
    assert.equal(block3.blockKey, 'heading_v1');
    assert.equal(block3.position, 3);
  });

  test('S6-04b2 RESILIENCE: Malformed persisted CHARACTER row falls back to UNSUPPORTED in Admin review', async () => {
    const { lesson } = await createTestLesson();

    const saveRes = await saveDraft({
      lessonId: lesson.id,
      title: 'Bài học kiểm tra snapshot lỗi',
      blocks: [
        {
          blockKey: 'char_valid',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charJaSun.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: true,
          },
        },
        {
          blockKey: 'char_to_corrupt',
          type: 'CHARACTER',
          position: 2,
          schemaVersion: 1,
          content: {
            characterId: charJaTree.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: false,
            guidedWriting: false,
          },
        },
      ],
    });
    assert.equal(saveRes.status, 200);
    const revId = saveRes.data.data.highestRevision.id;
    const submitRes = await submit(revId, lesson.id);
    assert.equal(submitRes.status, 200);
    const submissionId = submitRes.data.submissionId;

    // Directly corrupt block 2's snapshot in DB (e.g. invalid strokeCount: -1)
    await prisma.lessonContentBlock.update({
      where: {
        lessonRevisionId_blockKey: {
          lessonRevisionId: revId,
          blockKey: 'char_to_corrupt',
        },
      },
      data: {
        content: {
          characterId: charJaTree.id,
          showMeaning: true,
          showReading: true,
          showStrokeAnimation: false,
          guidedWriting: false,
          snapshot: {
            glyph: '木',
            scriptType: 'KANJI',
            strokeCount: -1, // Invalid negative stroke count
          },
        },
      },
    });

    const detailRes = await getReviewDetail(adminId, submissionId, prisma);
    assert.equal(detailRes.status, 200);
    const blocks = detailRes.data.data.revision.blocks;
    assert.equal(blocks.length, 2);
    assert.equal(blocks[0].type, 'CHARACTER');
    assert.equal(blocks[0].glyph, '日');

    // Corrupt block safely falls back to UNSUPPORTED
    assert.equal(blocks[1].type, 'UNSUPPORTED');
    assert.equal(blocks[1].blockKey, 'char_to_corrupt');
  });

  test('S6-04b2 IMMUTABILITY: Admin review retains submitted snapshot when catalogue is modified, across approve and successor draft', async () => {
    const { lesson } = await createTestLesson();

    const saveRes = await saveDraft({
      lessonId: lesson.id,
      title: 'Bài học kiểm tra tính bất biến của snapshot khi duyệt',
      blocks: [
        {
          blockKey: 'char_sun_immutability',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charJaSun.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: true,
          },
        },
      ],
    });
    assert.equal(saveRes.status, 200);
    const rev1Id = saveRes.data.data.highestRevision.id;
    const submitRes = await submit(rev1Id, lesson.id);
    assert.equal(submitRes.status, 200);
    const submissionId = submitRes.data.submissionId;

    // Mutate the catalogue in database
    await prisma.writingCharacter.update({
      where: { id: charJaSun.id },
      data: {
        meaning: 'Ý NGHĨA MỚI ĐÃ THAY ĐỔI TRONG CATALOGUE',
        primaryReading: 'shin_reading',
      },
    });

    // 1. Admin review before approval still shows original submitted snapshot
    const detailBeforeApprove = await getReviewDetail(adminId, submissionId, prisma);
    assert.equal(detailBeforeApprove.status, 200);
    const blockBeforeApprove = detailBeforeApprove.data.data.revision.blocks[0];
    assert.equal(blockBeforeApprove.meaning, 'mặt trời / ngày', 'Must retain original snapshot before approval');
    assert.equal(blockBeforeApprove.primaryReading, 'にち', 'Must retain original reading before approval');

    // 2. Admin approves revision
    const approveRes = await approve(submissionId, rev1Id);
    assert.equal(approveRes.status, 200);
    const approvedBlock = approveRes.data.data.revision.blocks[0];
    assert.equal(approvedBlock.meaning, 'mặt trời / ngày', 'Must retain original snapshot in approve response DTO');
    assert.equal(approvedBlock.primaryReading, 'にち');

    // 3. Admin publishes revision
    const publishRes = await publish(submissionId, rev1Id, {}, lesson.id);
    assert.equal(publishRes.status, 200);

    // 4. Teacher creates successor draft #2 with a different character
    const draft2Res = await saveDraft({
      lessonId: lesson.id,
      title: 'Bản nháp #2 kế tiếp',
      predecessor: rev1Id,
      blocks: [
        {
          blockKey: 'char_tree_successor',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charJaTree.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: false,
            guidedWriting: false,
          },
        },
      ],
    });
    assert.equal(draft2Res.status, 200);

    // 5. Admin re-opens original submission #1: original snapshot, order, and blockKey remain intact
    const originalDetail = await getReviewDetail(adminId, submissionId, prisma);
    assert.equal(originalDetail.status, 200);
    assert.equal(originalDetail.data.data.revision.blocks.length, 1);
    const preservedBlock = originalDetail.data.data.revision.blocks[0];
    assert.equal(preservedBlock.blockKey, 'char_sun_immutability');
    assert.equal(preservedBlock.glyph, '日');
    assert.equal(preservedBlock.meaning, 'mặt trời / ngày');

    // Revert catalogue mutation for other tests
    await prisma.writingCharacter.update({
      where: { id: charJaSun.id },
      data: {
        meaning: 'mặt trời / ngày',
        primaryReading: 'にち',
      },
    });
  });

  test('S6-04b2 LEGACY V0 PRESERVATION: Admin review detail on legacy V0 revision preserves adapted paragraphs', async () => {
    const { lesson } = await createTestLesson();

    const saveRes = await saveDraft({
      lessonId: lesson.id,
      title: 'Bài học legacy V0',
      contentSchemaVersion: 0,
      contentBlocks: [
        { type: 'paragraph', text: 'Đoạn văn mở đầu bài học V0.' },
        { type: 'paragraph', text: 'Đoạn văn kết thúc bài học V0.' },
      ],
    });
    assert.equal(saveRes.status, 200);
    const revId = saveRes.data.data.highestRevision.id;
    const submitRes = await submit(revId, lesson.id);
    assert.equal(submitRes.status, 200);
    const submissionId = submitRes.data.submissionId;

    const detailRes = await getReviewDetail(adminId, submissionId, prisma);
    assert.equal(detailRes.status, 200);
    const rev = detailRes.data.data.revision;
    assert.equal(rev.contentSchemaVersion, 0);
    assert.equal(rev.contentBlocks.length, 2);
    assert.equal(rev.blocks.length, 2);
    assert.equal(rev.blocks[0].type, 'TEXT');
  });

  test('EXT-02 END-TO-END: Admin creates static character -> Teacher picks in Japanese course (excluded in Chinese) -> publish -> active snapshot preserves static character', async () => {
    // 1. Admin creates a new Japanese Kanji character without strokes
    const createdRes = await createAdminCharacter(
      {
        languageId: jaLang.id,
        glyph: '学',
        scriptType: 'KANJI',
        strokeCount: 8,
        meaning: 'học tập',
        primaryReading: 'がく',
        romanization: 'gaku',
        metadata: { jlptLevel: 'N5' },
      },
      prisma
    );
    assert.equal(createdRes.status, 201);
    const createdChar = createdRes.data.data;
    assert.equal(createdChar.glyph, '学');
    assert.equal(createdChar.hasStrokes, false);

    // 2. Create a Japanese lesson and a Chinese lesson assigned to teacherId
    const { lesson: jaTestLesson } = await createTestLesson();

    const zhCourse = await prisma.course.create({
      data: {
        language: { connect: { id: zhLang.id } },
        framework: { connect: { id: '00000000-0000-0000-0000-000000000010' } },
        defaultStartLevel: { connect: { id: '00000000-0000-0000-0000-000000000021' } },
        names: { vi: 'Khóa học Tiếng Trung EXT-02', en: 'Chinese EXT-02' },
        isActive: true,
      },
    });
    const zhUnit = await prisma.unit.create({
      data: {
        course: { connect: { id: zhCourse.id } },
        level: { connect: { id: '00000000-0000-0000-0000-000000000021' } },
        code: 'ZH-U1-EXT02',
        position: 1,
        names: { vi: 'Bài mở đầu Trung ngữ' },
      },
    });
    const zhLesson = await prisma.lesson.create({
      data: {
        unitId: zhUnit.id,
        position: 1,
        isRequired: true,
        availability: 'PLANNED',
        rowVersion: 1n,
      },
    });
    const zhAssign = await prisma.contentAssignment.create({
      data: {
        lessonId: zhLesson.id,
        currentTeacherId: teacherId,
        createdBy: adminId,
        scopeGeneration: 1n,
      },
    });
    await prisma.assignmentHistory.create({
      data: {
        assignmentId: zhAssign.id,
        eventType: 'ASSIGNED',
        nextTeacherId: teacherId,
        changedBy: adminId,
        sequenceNo: 1,
        scopeGeneration: 1n,
        reason: 'EXT-02 scope check',
      },
    });

    // 3. Japanese teacher finds 学 via character-options; Chinese teacher MUST NOT see Japanese 学
    const jaOptions = await getTeacherCharacterOptions(teacherId, jaTestLesson.id, '学', prisma);
    assert.equal(jaOptions.status, 200);
    const matchedJa = jaOptions.data.data.find((item) => item.id === createdChar.id);
    assert.ok(matchedJa, 'Japanese teacher must find newly created Japanese character 学');
    assert.equal(matchedJa.hasStrokes, false);

    const zhOptions = await getTeacherCharacterOptions(teacherId, zhLesson.id, '学', prisma);
    assert.equal(zhOptions.status, 200);
    assert.equal(
      zhOptions.data.data.some((item) => item.id === createdChar.id),
      false,
      'Chinese course teacher MUST NOT see Japanese character 学'
    );

    // 4. Japanese teacher selects 学 (static, no stroke animation or guided writing), saves draft, and reloads
    const saveRes = await saveDraft({
      lessonId: jaTestLesson.id,
      title: 'Bài học chữ 学 từ danh mục Admin',
      blocks: [
        {
          blockKey: 'char_gaku_ext02',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: createdChar.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: false,
            guidedWriting: false,
          },
        },
      ],
    });
    assert.equal(saveRes.status, 200);
    const revId = saveRes.data.data.highestRevision.id;

    const reloaded = await getTeacherLessonDetail(teacherId, jaTestLesson.id, prisma);
    assert.equal(reloaded.status, 200);
    const reloadedBlock = reloaded.data.data.blocks[0];
    assert.equal(reloadedBlock.type, 'CHARACTER');
    assert.equal(reloadedBlock.selectedLabel.glyph, '学');
    assert.equal(reloadedBlock.content.characterId, createdChar.id);
    assert.equal(reloadedBlock.content.showStrokeAnimation, false);
    assert.equal(reloadedBlock.content.guidedWriting, false);

    // 5. Submit, Admin review, Approve, Publish
    const submitRes = await submit(revId, jaTestLesson.id);
    assert.equal(submitRes.status, 200);
    const submissionId = submitRes.data.submissionId;

    const reviewDetail = await getReviewDetail(adminId, submissionId, prisma);
    assert.equal(reviewDetail.status, 200);
    assert.equal(reviewDetail.data.data.revision.blocks[0].glyph, '学');

    const approveRes = await approve(submissionId, revId);
    assert.equal(approveRes.status, 200);

    const publishRes = await publish(submissionId, revId, {}, jaTestLesson.id);
    assert.equal(publishRes.status, 200);

    // 6. Active published revision snapshot has exact static character 学
    const publishedLesson = await prisma.lesson.findUniqueOrThrow({
      where: { id: jaTestLesson.id },
      include: {
        activeRevision: {
          include: {
            blocks: { orderBy: { position: 'asc' } },
          },
        },
      },
    });
    assert.equal(publishedLesson.activeRevisionId, revId);
    const pubBlock = publishedLesson.activeRevision.blocks[0];
    assert.equal(pubBlock.type, 'CHARACTER');
    assert.equal(pubBlock.content.characterId, createdChar.id);
    assert.equal(pubBlock.content.showStrokeAnimation, false);
    assert.equal(pubBlock.content.guidedWriting, false);
    assert.equal(pubBlock.content.snapshot.glyph, '学');
    assert.equal(pubBlock.content.snapshot.scriptType, 'KANJI');
    assert.equal(pubBlock.content.snapshot.strokeCount, 8);
    assert.equal(pubBlock.content.snapshot.meaning, 'học tập');
    assert.equal(pubBlock.content.snapshot.primaryReading, 'がく');
    assert.equal(pubBlock.content.snapshot.romanization, 'gaku');
  });
});
