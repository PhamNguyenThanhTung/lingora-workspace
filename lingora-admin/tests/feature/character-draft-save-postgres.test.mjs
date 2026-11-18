import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mock } from 'node:test';
import { PrismaClient } from '../../generated/product-client/index.js';
import { seed } from '../../prisma/product/seed.mjs';
import { setProductPrismaForTest } from '../../src/server/db/index.js';

let currentCookieStore = {
  getAll: () => [],
  get: () => undefined,
  set: () => {},
  delete: () => {},
};

mock.module('next/headers.js', {
  exports: {
    cookies: async () => currentCookieStore,
  },
});

mock.module('server-only', {
  exports: {},
});

const { PATCH: patchTeacherDraftRoute } = await import(
  '../../src/app/api/teacher/lessons/[lessonId]/draft/route.ts'
);
const {
  saveTeacherLessonDraft,
} = await import('../../src/server/lessons/index.ts');
const {
  createCharacter,
  createStroke,
  seedCharacterStrokeData,
} = await import('../../src/server/characters/index.ts');

export function validateTestDatabaseUrl(env = process.env) {
  const url = env.SLICE11_TEST_DATABASE_URL;
  if (!url) {
    throw new Error('Run test with scripts/local-test-db.mjs to provision a disposable database');
  }
  if (env.SLICE11_TEST_DATABASE_OWNED !== '1' || url !== env.SLICE11_LOCAL_DATABASE_URL) {
    throw new Error('Expected the owned database provisioned by scripts/local-test-db.mjs');
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Database URL is not a valid URL');
  }
  if (!['127.0.0.1', 'localhost'].includes(parsed.hostname)) {
    throw new Error(`Database URL must target loopback host (127.0.0.1 or localhost), got: ${parsed.hostname}`);
  }
  return url;
}

const testDbUrl = validateTestDatabaseUrl(process.env);

function createMockSessionCookie(userId, email = `${userId}@lingora.test`) {
  const payload = {
    sub: userId,
    email,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const access_token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    Buffer.from(JSON.stringify(payload)).toString('base64url') +
    '.signature';
  const sessionData = {
    access_token,
    refresh_token: 'valid-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: userId, email },
  };
  const cookieValue = 'base64-' + Buffer.from(JSON.stringify(sessionData)).toString('base64');
  return {
    name: 'sb-auth-test-auth-token',
    value: cookieValue,
  };
}

describe('S6-04a2: CHARACTER Server Draft Save, Route Rejection & Successor Immutability', () => {
  let prisma;
  let jaLang;
  let zhLang;
  let teacher1Id;
  let teacher2Id;
  let adminId;
  let jaCourse;
  let jaUnit;
  let jaLesson;
  let jaAssignment;
  let activeTeacherId;
  const originalFetch = globalThis.fetch;

  // Characters
  let charJaSun; // 日 in Japanese, with stroke data version 1
  let charJaTree; // 木 in Japanese, NO stroke data
  let charZhChar; // 字 in Chinese
  let charJaChar; // 字 in Japanese

  before(async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://auth-test.invalid';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl,
        },
      },
      log: [],
    });

    await prisma.$connect();
    await seed(prisma);
    setProductPrismaForTest(prisma);

    // Mock global fetch for Supabase auth getUser
    globalThis.fetch = async (url) => {
      return Response.json({
        id: activeTeacherId,
        email: `${activeTeacherId}@lingora.test`,
      });
    };

    // 1. Ensure test languages exist in app.languages
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

    // 2. Create teacher and admin accounts
    teacher1Id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO auth.users (id, email)
      VALUES (${teacher1Id}::uuid, 's604a2-t1@lingora.test')
      ON CONFLICT DO NOTHING
    `;
    await prisma.account.create({
      data: {
        id: teacher1Id,
        role: 'TEACHER',
        status: 'ACTIVE',
        displayName: 'S6-04a2 Assigned Teacher',
        uiLocale: 'en',
      },
    });

    teacher2Id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO auth.users (id, email)
      VALUES (${teacher2Id}::uuid, 's604a2-t2@lingora.test')
      ON CONFLICT DO NOTHING
    `;
    await prisma.account.create({
      data: {
        id: teacher2Id,
        role: 'TEACHER',
        status: 'ACTIVE',
        displayName: 'S6-04a2 Unassigned Teacher',
        uiLocale: 'en',
      },
    });

    adminId = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO auth.users (id, email)
      VALUES (${adminId}::uuid, 's604a2-admin@lingora.test')
      ON CONFLICT DO NOTHING
    `;
    await prisma.account.create({
      data: {
        id: adminId,
        role: 'ADMIN',
        status: 'ACTIVE',
        displayName: 'S6-04a2 Admin',
        uiLocale: 'en',
      },
    });

    // 3. Create Japanese Course, Unit, Lesson, and ContentAssignment
    jaCourse = await prisma.course.create({
      data: {
        language: { connect: { id: jaLang.id } },
        framework: { connect: { id: '00000000-0000-0000-0000-000000000010' } },
        defaultStartLevel: { connect: { id: '00000000-0000-0000-0000-000000000021' } },
        names: { en: 'Japanese Beginner', ja: '初級日本語' },
        isActive: true,
      },
    });

    jaUnit = await prisma.unit.create({
      data: {
        course: { connect: { id: jaCourse.id } },
        level: { connect: { id: '00000000-0000-0000-0000-000000000021' } },
        code: 'JA-UNIT-01',
        names: { en: 'Japanese Writing Basics', ja: '日本語の文字' },
        position: 1,
      },
    });

    jaLesson = await prisma.lesson.create({
      data: {
        unitId: jaUnit.id,
        position: 1,
        availability: 'PLANNED',
        isRequired: true,
        rowVersion: 1n,
      },
    });

    jaAssignment = await prisma.contentAssignment.create({
      data: {
        lessonId: jaLesson.id,
        currentTeacherId: teacher1Id,
        createdBy: adminId,
        scopeGeneration: 1n,
      },
    });

    await prisma.assignmentHistory.create({
      data: {
        assignmentId: jaAssignment.id,
        sequenceNo: 1,
        eventType: 'ASSIGNED',
        nextTeacherId: teacher1Id,
        changedBy: adminId,
        scopeGeneration: 1n,
        reason: 'S6-04a2 test initial assignment',
      },
    });

    // 4. Create catalogue characters
    // Char 1: 日 in Japanese with stroke data
    charJaSun = await createCharacter(
      {
        languageId: jaLang.id,
        glyph: '日',
        scriptType: 'KANJI',
        meaning: 'Mặt trời',
        primaryReading: 'にち',
        romanization: 'nichi',
        strokeCount: 4,
        metadata: {
          radical: '日',
          jlptLevel: 'N5',
          onyomi: ['ニチ', 'ジツ'],
          kunyomi: ['ひ', 'か'],
        },
      },
      prisma
    );

    const sunStrokes = [
      createStroke(1, [[0.2, 0.1], [0.2, 0.9]]),
      createStroke(2, [[0.2, 0.1], [0.8, 0.1], [0.8, 0.9]]),
      createStroke(3, [[0.2, 0.5], [0.8, 0.5]]),
      createStroke(4, [[0.2, 0.9], [0.8, 0.9]]),
    ];

    await seedCharacterStrokeData(
      {
        characterId: charJaSun.id,
        version: 1,
        strokes: sunStrokes,
        source: 'Lingora Japanese Script Engine',
        license: 'CC-BY-4.0',
        provenance: { author: 'Lingora Content Team', attribution: 'Self-authored' },
      },
      prisma
    );

    // Char 2: 木 in Japanese, NO stroke data (static only)
    charJaTree = await createCharacter(
      {
        languageId: jaLang.id,
        glyph: '木',
        scriptType: 'KANJI',
        meaning: 'Cây cối',
        primaryReading: 'もく',
        romanization: 'moku',
        strokeCount: 4,
        metadata: {
          radical: '木',
          jlptLevel: 'N5',
        },
      },
      prisma
    );

    // Char 3: 字 in Chinese
    charZhChar = await createCharacter(
      {
        languageId: zhLang.id,
        glyph: '字',
        scriptType: 'HANZI_SIMPLIFIED',
        meaning: 'Chữ viết',
        primaryReading: 'zì',
        romanization: 'zi4',
        strokeCount: 6,
        metadata: {
          radical: '子',
          hanziSystems: ['SIMPLIFIED', 'TRADITIONAL'],
          hskLevel: 1,
        },
      },
      prisma
    );

    // Char 4: 字 in Japanese
    charJaChar = await createCharacter(
      {
        languageId: jaLang.id,
        glyph: '字',
        scriptType: 'KANJI',
        meaning: 'Chữ',
        primaryReading: 'じ',
        romanization: 'ji',
        strokeCount: 6,
        metadata: {
          radical: '子',
          jlptLevel: 'N4',
        },
      },
      prisma
    );
  });

  beforeEach(() => {
    activeTeacherId = teacher1Id;
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(activeTeacherId)],
      get: () => createMockSessionCookie(activeTeacherId),
      set: () => {},
      delete: () => {},
    };
  });

  after(async () => {
    globalThis.fetch = originalFetch;
    setProductPrismaForTest(null);
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  function makeDraftRequest(body) {
    return new Request('http://localhost:3000/api/teacher/lessons/draft', {
      method: 'PATCH',
      headers: {
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  // ===========================================================================
  // 1. Route & Server Level Rejection of Client Snapshot or Geometry
  // ===========================================================================

  test('ROUTE: rejects draft when client sends snapshot inside CHARACTER block content', async () => {
    const lesson = await prisma.lesson.findUnique({ where: { id: jaLesson.id } });
    const rowVersion = (lesson.rowVersion ?? 1n).toString();

    const payload = {
      title: { vi: 'Bài học kiểm tra route snapshot' },
      expectedRowVersion: rowVersion,
      expectedRevisionId: null,
      blocks: [
        {
          blockKey: 'char_snap_1',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charJaSun.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: false,
            snapshot: {
              glyph: '日',
              scriptType: 'KANJI',
              strokeCount: 4,
            },
          },
        },
      ],
    };

    const res = await patchTeacherDraftRoute(makeDraftRequest(payload), {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(body.error.message);

    // Verify atomic: no revisions created
    const count = await prisma.lessonRevision.count({ where: { lessonId: jaLesson.id } });
    assert.equal(count, 0);
  });

  test('ROUTE: rejects draft when client sends raw stroke geometry (strokes, points, path)', async () => {
    const lesson = await prisma.lesson.findUnique({ where: { id: jaLesson.id } });
    const rowVersion = (lesson.rowVersion ?? 1n).toString();

    const payloadWithStrokes = {
      title: { vi: 'Bài học kiểm tra geometry' },
      expectedRowVersion: rowVersion,
      expectedRevisionId: null,
      blocks: [
        {
          blockKey: 'char_geom_1',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charJaSun.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: false,
            strokes: [{ points: [[0, 0], [1, 1]] }],
          },
        },
      ],
    };

    const res = await patchTeacherDraftRoute(makeDraftRequest(payloadWithStrokes), {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'VALIDATION_ERROR');

    const count = await prisma.lessonRevision.count({ where: { lessonId: jaLesson.id } });
    assert.equal(count, 0);
  });

  test('SERVER SAVE: rejects rawBody containing client snapshot or geometry', async () => {
    const lesson = await prisma.lesson.findUnique({ where: { id: jaLesson.id } });
    const rowVersion = (lesson.rowVersion ?? 1n).toString();

    const payload = {
      title: { vi: 'Direct server save snapshot rejection' },
      expectedRowVersion: rowVersion,
      expectedRevisionId: null,
      blocks: [
        {
          blockKey: 'char_direct_snap',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          snapshot: { glyph: '日' },
          content: {
            characterId: charJaSun.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: false,
            guidedWriting: false,
          },
        },
      ],
    };

    const result = await saveTeacherLessonDraft(teacher1Id, jaLesson.id, payload, prisma);
    assert.equal(result.status, 400);
    assert.equal(result.error.code, 'VALIDATION_ERROR');

    const count = await prisma.lessonRevision.count({ where: { lessonId: jaLesson.id } });
    assert.equal(count, 0);
  });

  // ===========================================================================
  // 2. Same-Language Authoritative Persisted Snapshot and Stroke Version Pin
  // ===========================================================================

  test('SERVER SAVE & ROUTE: saves valid CHARACTER block with authoritative persisted snapshot and stroke pin', async () => {
    const lessonBefore = await prisma.lesson.findUnique({ where: { id: jaLesson.id } });
    const rowVersion = (lessonBefore.rowVersion ?? 1n).toString();

    const payload = {
      title: { vi: 'Bài học 1: Chữ Nhật cơ bản' },
      expectedRowVersion: rowVersion,
      expectedRevisionId: null,
      changeSummary: 'Lưu bản nháp có ký tự 日',
      blocks: [
        {
          blockKey: 'char_block_sun',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charJaSun.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: false,
          },
        },
      ],
    };

    const res = await patchTeacherDraftRoute(makeDraftRequest(payload), {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });

    assert.equal(res.status, 200);
    const resBody = await res.json();
    assert.ok(resBody.data);
    assert.equal(resBody.data.highestRevision.revisionNo, 1);

    // Verify database persisted state
    const rev = await prisma.lessonRevision.findFirst({
      where: { lessonId: jaLesson.id, revisionNo: 1 },
      include: {
        blocks: true,
      },
    });

    assert.ok(rev, 'Revision 1 must exist');
    assert.equal(rev.contentSchemaVersion, 1);
    assert.equal(rev.blocks.length, 1);

    const block = rev.blocks[0];
    assert.equal(block.type, 'CHARACTER');
    assert.equal(block.blockKey, 'char_block_sun');
    assert.equal(block.position, 1);
    assert.equal(block.schemaVersion, 1);

    const content = block.content;
    assert.equal(content.characterId, charJaSun.id);
    assert.equal(content.showMeaning, true);
    assert.equal(content.showReading, true);
    assert.equal(content.showStrokeAnimation, true);
    assert.equal(content.guidedWriting, false);

    // Verify Authoritative Snapshot Fields
    const snap = content.snapshot;
    assert.ok(snap, 'Snapshot must be present in persisted block');
    assert.equal(snap.glyph, '日');
    assert.equal(snap.scriptType, 'KANJI');
    assert.equal(snap.strokeCount, 4);
    assert.equal(snap.meaning, 'Mặt trời');
    assert.equal(snap.primaryReading, 'にち');
    assert.equal(snap.romanization, 'nichi');
    assert.equal(snap.strokeVersion, 1); // Pinned authoritative stroke version!

    // Verify defined metadata fields preserved, NO raw geometry in snapshot
    assert.equal(snap.metadata.radical, '日');
    assert.equal(snap.metadata.jlptLevel, 'N5');
    assert.equal(snap.metadata.strokes, undefined);
    assert.equal(snap.metadata.points, undefined);
    assert.equal(snap.metadata.path, undefined);
    assert.equal(content.strokes, undefined);

    // Lesson rowVersion incremented
    const lessonAfter = await prisma.lesson.findUnique({ where: { id: jaLesson.id } });
    assert.equal(lessonAfter.rowVersion, lessonBefore.rowVersion + 1n);
  });

  // ===========================================================================
  // 3. Static No-Stroke Case
  // ===========================================================================

  test('STATIC CASE: saves CHARACTER block when both animation and guided writing are false for character without strokes', async () => {
    const lessonBefore = await prisma.lesson.findUnique({ where: { id: jaLesson.id } });
    const rowVersion = (lessonBefore.rowVersion ?? 1n).toString();
    const highestRev = await prisma.lessonRevision.findFirst({
      where: { lessonId: jaLesson.id },
      orderBy: { revisionNo: 'desc' },
    });

    const payload = {
      title: { vi: 'Bài học 1: Thêm chữ tĩnh không nét' },
      expectedRowVersion: rowVersion,
      expectedRevisionId: highestRev.id,
      changeSummary: 'Lưu chữ 木 tĩnh',
      blocks: [
        {
          blockKey: 'char_tree_static',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charJaTree.id, // 木 has NO stroke data in DB!
            showMeaning: true,
            showReading: false,
            showStrokeAnimation: false,
            guidedWriting: false,
          },
        },
      ],
    };

    const result = await saveTeacherLessonDraft(teacher1Id, jaLesson.id, payload, prisma);
    assert.equal(result.status, 200);

    const rev2 = await prisma.lessonRevision.findFirst({
      where: { lessonId: jaLesson.id, revisionNo: 2 },
      include: { blocks: true },
    });

    assert.ok(rev2);
    assert.equal(rev2.blocks.length, 1);
    const content = rev2.blocks[0].content;
    assert.equal(content.characterId, charJaTree.id);
    assert.equal(content.showStrokeAnimation, false);
    assert.equal(content.guidedWriting, false);
    assert.equal(content.snapshot.glyph, '木');
    assert.equal(content.snapshot.strokeCount, 4);
    assert.equal(content.snapshot.strokeVersion, null); // Unpinned null strokeVersion for static display
  });

  // ===========================================================================
  // 4. Wrong Language & Missing Catalogue Scope Regression (Identical Envelope & Rollback)
  // ===========================================================================

  test('LANGUAGE SCOPE REGRESSION: outside-language and non-existent characters fail with identical 400 envelope and rollback', async () => {
    const lessonBefore = await prisma.lesson.findUnique({ where: { id: jaLesson.id } });
    const rowVersion = (lessonBefore.rowVersion ?? 1n).toString();
    const highestRev = await prisma.lessonRevision.findFirst({
      where: { lessonId: jaLesson.id },
      orderBy: { revisionNo: 'desc' },
    });

    const nonExistentUuid = randomUUID();

    // 1. Missing catalogue UUID
    const missingPayload = {
      title: { vi: 'Bài học thử ký tự không tồn tại' },
      expectedRowVersion: rowVersion,
      expectedRevisionId: highestRev.id,
      blocks: [
        {
          blockKey: 'char_non_exist',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: nonExistentUuid,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: false,
            guidedWriting: false,
          },
        },
      ],
    };

    // 2. Cross-language reference: Chinese character (charZhChar.id) in Japanese course
    const crossLangPayload = {
      title: { vi: 'Bài học thử ký tự sai ngôn ngữ' },
      expectedRowVersion: rowVersion,
      expectedRevisionId: highestRev.id,
      blocks: [
        {
          blockKey: 'char_cross_lang',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charZhChar.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: false,
            guidedWriting: false,
          },
        },
      ],
    };

    const missingResult = await saveTeacherLessonDraft(teacher1Id, jaLesson.id, missingPayload, prisma);
    const crossLangResult = await saveTeacherLessonDraft(teacher1Id, jaLesson.id, crossLangPayload, prisma);

    assert.equal(missingResult.status, 400);
    assert.equal(crossLangResult.status, 400);

    // Identical error envelope (code, message, structure) - zero information leak
    assert.deepEqual(missingResult, crossLangResult);
    assert.equal(crossLangResult.error.code, 'VALIDATION_ERROR');
    assert.equal(crossLangResult.error.message, 'Ký tự không tồn tại trong danh mục ký tự của khóa học.');

    // Leak protection: neither the foreign glyph ('字') nor foreign UUID is revealed
    assert.doesNotMatch(crossLangResult.error.message, /字/);
    assert.doesNotMatch(crossLangResult.error.message, new RegExp(charZhChar.id, 'i'));

    // Verify atomic rollback: lesson rowVersion unchanged, no new revision created
    const lessonAfter = await prisma.lesson.findUnique({ where: { id: jaLesson.id } });
    assert.equal(lessonAfter.rowVersion, lessonBefore.rowVersion);
    const revCount = await prisma.lessonRevision.count({ where: { lessonId: jaLesson.id } });
    assert.equal(revCount, 2);
  });

  // ===========================================================================
  // 5. Required Strokes Missing Rejection
  // ===========================================================================

  test('REQUIRED STROKES MISSING: rejects showStrokeAnimation/guidedWriting when character has no stroke data', async () => {
    const lessonBefore = await prisma.lesson.findUnique({ where: { id: jaLesson.id } });
    const rowVersion = (lessonBefore.rowVersion ?? 1n).toString();
    const highestRev = await prisma.lessonRevision.findFirst({
      where: { lessonId: jaLesson.id },
      orderBy: { revisionNo: 'desc' },
    });

    // charJaTree has NO stroke data in DB
    const payloadAnim = {
      title: { vi: 'Bật hoạt ảnh cho ký tự thiếu nét' },
      expectedRowVersion: rowVersion,
      expectedRevisionId: highestRev.id,
      blocks: [
        {
          blockKey: 'char_tree_missing_stroke',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charJaTree.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true, // Requires strokes!
            guidedWriting: false,
          },
        },
      ],
    };

    const resultAnim = await saveTeacherLessonDraft(teacher1Id, jaLesson.id, payloadAnim, prisma);
    assert.equal(resultAnim.status, 400);
    assert.equal(resultAnim.error.code, 'VALIDATION_ERROR');
    assert.match(resultAnim.error.message, /thiếu dữ liệu nét/i);

    // Also test guidedWriting = true
    const payloadGuided = {
      title: { vi: 'Bật hướng dẫn viết cho ký tự thiếu nét' },
      expectedRowVersion: rowVersion,
      expectedRevisionId: highestRev.id,
      blocks: [
        {
          blockKey: 'char_tree_missing_stroke_guided',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: charJaTree.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: false,
            guidedWriting: true, // Requires strokes!
          },
        },
      ],
    };

    const resultGuided = await saveTeacherLessonDraft(teacher1Id, jaLesson.id, payloadGuided, prisma);
    assert.equal(resultGuided.status, 400);
    assert.equal(resultGuided.error.code, 'VALIDATION_ERROR');
    assert.match(resultGuided.error.message, /thiếu dữ liệu nét/i);

    // Rollback preserved
    const revCount = await prisma.lessonRevision.count({ where: { lessonId: jaLesson.id } });
    assert.equal(revCount, 2);
  });

  // ===========================================================================
  // 6. Assignment & Stale Revision Verification
  // ===========================================================================

  test('WRONG ASSIGNMENT: unassigned teacher cannot save draft on lesson', async () => {
    const lesson = await prisma.lesson.findUnique({ where: { id: jaLesson.id } });
    const rowVersion = (lesson.rowVersion ?? 1n).toString();
    const highestRev = await prisma.lessonRevision.findFirst({
      where: { lessonId: jaLesson.id },
      orderBy: { revisionNo: 'desc' },
    });

    const payload = {
      title: { vi: 'Thầy khác cố lưu bài' },
      expectedRowVersion: rowVersion,
      expectedRevisionId: highestRev.id,
      blocks: [],
    };

    // teacher2Id is not assigned to jaLesson
    const result = await saveTeacherLessonDraft(teacher2Id, jaLesson.id, payload, prisma);
    assert.equal(result.status, 404);
    assert.equal(result.error.code, 'LESSON_NOT_FOUND');
  });

  test('STALE REVISION & ROW VERSION: rejects stale expectedRowVersion and expectedRevisionId', async () => {
    const lesson = await prisma.lesson.findUnique({ where: { id: jaLesson.id } });
    const highestRev = await prisma.lessonRevision.findFirst({
      where: { lessonId: jaLesson.id },
      orderBy: { revisionNo: 'desc' },
    });

    // Stale expectedRowVersion
    const payloadStaleVersion = {
      title: { vi: 'Stale version' },
      expectedRowVersion: '9999',
      expectedRevisionId: highestRev.id,
      blocks: [],
    };
    const resVer = await saveTeacherLessonDraft(teacher1Id, jaLesson.id, payloadStaleVersion, prisma);
    assert.equal(resVer.status, 409);
    assert.equal(resVer.error.code, 'STALE_LESSON');

    // Stale expectedRevisionId
    const payloadStaleRev = {
      title: { vi: 'Stale rev id' },
      expectedRowVersion: (lesson.rowVersion ?? 1n).toString(),
      expectedRevisionId: randomUUID(),
      blocks: [],
    };
    const resRev = await saveTeacherLessonDraft(teacher1Id, jaLesson.id, payloadStaleRev, prisma);
    assert.equal(resRev.status, 409);
    assert.equal(resRev.error.code, 'REVISION_CONFLICT');
  });

  // ===========================================================================
  // 7. Mixed Block Invariants & Collection Constraints
  // ===========================================================================

  test('MIXED BLOCKS: saves revision with HEADING, CHARACTER, and TEXT in ordered sequence', async () => {
    const lessonBefore = await prisma.lesson.findUnique({ where: { id: jaLesson.id } });
    const rowVersion = (lessonBefore.rowVersion ?? 1n).toString();
    const highestRev = await prisma.lessonRevision.findFirst({
      where: { lessonId: jaLesson.id },
      orderBy: { revisionNo: 'desc' },
    });

    const payload = {
      title: { vi: 'Bài học 3 khối kết hợp' },
      expectedRowVersion: rowVersion,
      expectedRevisionId: highestRev.id,
      changeSummary: 'Thêm heading, character, text',
      blocks: [
        {
          blockKey: 'h_intro',
          type: 'HEADING',
          position: 1,
          schemaVersion: 1,
          content: {
            level: 2,
            text: 'Giới thiệu chữ Hán',
          },
        },
        {
          blockKey: 'char_sun_mid',
          type: 'CHARACTER',
          position: 2,
          schemaVersion: 1,
          content: {
            characterId: charJaSun.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: false,
          },
        },
        {
          blockKey: 't_explanation',
          type: 'TEXT',
          position: 3,
          schemaVersion: 1,
          content: {
            nodes: [
              {
                type: 'paragraph',
                runs: [{ text: 'Chữ Nhật nghĩa là mặt trời, cũng là ngày.' }],
              },
            ],
          },
        },
      ],
    };

    const result = await saveTeacherLessonDraft(teacher1Id, jaLesson.id, payload, prisma);
    assert.equal(result.status, 200);

    const rev3 = await prisma.lessonRevision.findFirst({
      where: { lessonId: jaLesson.id, revisionNo: 3 },
      include: {
        blocks: { orderBy: { position: 'asc' } },
      },
    });

    assert.ok(rev3);
    assert.equal(rev3.blocks.length, 3);
    assert.equal(rev3.blocks[0].type, 'HEADING');
    assert.equal(rev3.blocks[0].position, 1);
    assert.equal(rev3.blocks[1].type, 'CHARACTER');
    assert.equal(rev3.blocks[1].position, 2);
    assert.equal(rev3.blocks[1].content.snapshot.glyph, '日');
    assert.equal(rev3.blocks[2].type, 'TEXT');
    assert.equal(rev3.blocks[2].position, 3);
  });

  test('COLLECTION CONSTRAINTS: rejects duplicate position, duplicate blockKey, and exceeding 50 blocks', async () => {
    const lesson = await prisma.lesson.findUnique({ where: { id: jaLesson.id } });
    const rowVersion = (lesson.rowVersion ?? 1n).toString();
    const highestRev = await prisma.lessonRevision.findFirst({
      where: { lessonId: jaLesson.id },
      orderBy: { revisionNo: 'desc' },
    });

    // 1. Duplicate position
    const dupPosPayload = {
      title: { vi: 'Trùng position' },
      expectedRowVersion: rowVersion,
      expectedRevisionId: highestRev.id,
      blocks: [
        {
          blockKey: 'b_1',
          type: 'HEADING',
          position: 1,
          schemaVersion: 1,
          content: { level: 2, text: 'H1' },
        },
        {
          blockKey: 'b_2',
          type: 'CHARACTER',
          position: 1, // Duplicate position 1!
          schemaVersion: 1,
          content: {
            characterId: charJaSun.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: false,
            guidedWriting: false,
          },
        },
      ],
    };
    const resDupPos = await saveTeacherLessonDraft(teacher1Id, jaLesson.id, dupPosPayload, prisma);
    assert.equal(resDupPos.status, 400);
    assert.equal(resDupPos.error.code, 'VALIDATION_ERROR');
    assert.match(resDupPos.error.message, /position.*trùng lặp/i);

    // 2. Duplicate blockKey
    const dupKeyPayload = {
      title: { vi: 'Trùng key' },
      expectedRowVersion: rowVersion,
      expectedRevisionId: highestRev.id,
      blocks: [
        {
          blockKey: 'same_key',
          type: 'HEADING',
          position: 1,
          schemaVersion: 1,
          content: { level: 2, text: 'H1' },
        },
        {
          blockKey: 'same_key', // Duplicate key!
          type: 'CHARACTER',
          position: 2,
          schemaVersion: 1,
          content: {
            characterId: charJaSun.id,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: false,
            guidedWriting: false,
          },
        },
      ],
    };
    const resDupKey = await saveTeacherLessonDraft(teacher1Id, jaLesson.id, dupKeyPayload, prisma);
    assert.equal(resDupKey.status, 400);
    assert.equal(resDupKey.error.code, 'VALIDATION_ERROR');
    assert.match(resDupKey.error.message, /blockKey.*trùng lặp/i);

    // 3. Exceeding 50 blocks
    const tooManyBlocks = Array.from({ length: 51 }, (_, i) => ({
      blockKey: `key_${i + 1}`,
      type: 'DIVIDER',
      position: i + 1,
      schemaVersion: 1,
      content: {},
    }));
    const resOverflow = await saveTeacherLessonDraft(
      teacher1Id,
      jaLesson.id,
      {
        title: { vi: 'Quá 50 blocks' },
        expectedRowVersion: rowVersion,
        expectedRevisionId: highestRev.id,
        blocks: tooManyBlocks,
      },
      prisma
    );
    assert.equal(resOverflow.status, 400);
    assert.equal(resOverflow.error.code, 'VALIDATION_ERROR');
    assert.match(resOverflow.error.message, /50 khối nội dung/i);
  });

  // ===========================================================================
  // 8. Successor Snapshot Immutability After Catalogue Change
  // ===========================================================================

  test('SUCCESSOR IMMUTABILITY: metadata-only successor preserves already persisted snapshot exactly after catalogue changes', async () => {
    // Current highest revision is Revision 3, which contains:
    // Block position 2: CHARACTER '日' with meaning: 'Mặt trời', strokeCount: 4, strokeVersion: 1.
    const rev3 = await prisma.lessonRevision.findFirst({
      where: { lessonId: jaLesson.id, revisionNo: 3 },
      include: { blocks: { orderBy: { position: 'asc' } } },
    });
    assert.ok(rev3);
    const origBlock = rev3.blocks.find((b) => b.type === 'CHARACTER');
    assert.ok(origBlock);
    assert.equal(origBlock.content.snapshot.meaning, 'Mặt trời');
    assert.equal(origBlock.content.snapshot.strokeCount, 4);
    assert.equal(origBlock.content.snapshot.strokeVersion, 1);

    // Now, simulate catalogue change in DB:
    // 1) Change meaning of charJaSun in WritingCharacter
    // 2) Change strokeCount to 5
    // 3) Update CharacterStrokeData version to 2
    await prisma.writingCharacter.update({
      where: { id: charJaSun.id },
      data: {
        meaning: 'Nghĩa mới sau khi sửa catalogue: Ngày / Ban ngày',
        strokeCount: 5,
        metadata: { radical: '日', jlptLevel: 'N4', notes: 'Catalogue updated' },
      },
    });

    await prisma.characterStrokeData.update({
      where: { characterId: charJaSun.id },
      data: {
        version: 2, // Bumped version!
      },
    });

    // Verify catalogue in DB really changed
    const updatedChar = await prisma.writingCharacter.findUnique({
      where: { id: charJaSun.id },
      include: { strokeData: true },
    });
    assert.equal(updatedChar.meaning, 'Nghĩa mới sau khi sửa catalogue: Ngày / Ban ngày');
    assert.equal(updatedChar.strokeCount, 5);
    assert.equal(updatedChar.strokeData.version, 2);

    // Teacher saves metadata-only update (omitting `blocks`)
    const lesson = await prisma.lesson.findUnique({ where: { id: jaLesson.id } });
    const rowVersion = (lesson.rowVersion ?? 1n).toString();

    const successorPayload = {
      title: { vi: 'Bài học 1: Tiêu đề bản sửa đổi thứ 4' },
      changeSummary: 'Chỉ cập nhật tiêu đề, kế thừa toàn bộ khối canonical',
      expectedRowVersion: rowVersion,
      expectedRevisionId: rev3.id,
      // `blocks` is omitted / undefined!
    };

    const successorResult = await saveTeacherLessonDraft(
      teacher1Id,
      jaLesson.id,
      successorPayload,
      prisma
    );
    assert.equal(successorResult.status, 200);

    // Verify Revision 4
    const rev4 = await prisma.lessonRevision.findFirst({
      where: { lessonId: jaLesson.id, revisionNo: 4 },
      include: { blocks: { orderBy: { position: 'asc' } } },
    });

    assert.ok(rev4, 'Revision 4 must be created');
    assert.equal(rev4.contentSchemaVersion, 1);
    assert.equal(rev4.blocks.length, 3, 'All 3 blocks must be copied to successor');

    const successorCharBlock = rev4.blocks.find((b) => b.type === 'CHARACTER');
    assert.ok(successorCharBlock);
    assert.equal(successorCharBlock.blockKey, origBlock.blockKey);
    assert.equal(successorCharBlock.position, origBlock.position);

    // IMMUTABILITY ASSERTIONS:
    // Must preserve the trusted snapshot as it was originally pinned in Revision 3!
    const snap = successorCharBlock.content.snapshot;
    assert.equal(snap.meaning, 'Mặt trời', 'Must preserve original meaning from predecessor snapshot');
    assert.equal(snap.strokeCount, 4, 'Must preserve original strokeCount from predecessor snapshot');
    assert.equal(snap.strokeVersion, 1, 'Must preserve original pinned strokeVersion 1, NOT catalogue version 2');
    assert.equal(snap.metadata.jlptLevel, 'N5', 'Must preserve original metadata jlptLevel N5, NOT N4');
    assert.equal(snap.metadata.notes, undefined, 'Must NOT pick up newly added catalogue notes');
  });

  // ===========================================================================
  // 9. Atomic Rollback Preserving Revision State Across All Failures
  // ===========================================================================

  test('ROLLBACK INTEGRITY: all failed save operations preserve database revision state intact', async () => {
    const lessonBefore = await prisma.lesson.findUnique({ where: { id: jaLesson.id } });
    const rowVersionBefore = lessonBefore.rowVersion;
    const revCountBefore = await prisma.lessonRevision.count({ where: { lessonId: jaLesson.id } });
    const blockCountBefore = await prisma.lessonContentBlock.count();

    const highestRev = await prisma.lessonRevision.findFirst({
      where: { lessonId: jaLesson.id },
      orderBy: { revisionNo: 'desc' },
    });

    const failedAttempts = [
      // Client snapshot attempt
      {
        title: { vi: 'Fail 1' },
        expectedRowVersion: rowVersionBefore.toString(),
        expectedRevisionId: highestRev.id,
        blocks: [
          {
            blockKey: 'f1',
            type: 'CHARACTER',
            position: 1,
            schemaVersion: 1,
            content: {
              characterId: charJaSun.id,
              showMeaning: true,
              showReading: true,
              showStrokeAnimation: false,
              guidedWriting: false,
              snapshot: { glyph: '日' },
            },
          },
        ],
      },
      // Wrong language attempt
      {
        title: { vi: 'Fail 2' },
        expectedRowVersion: rowVersionBefore.toString(),
        expectedRevisionId: highestRev.id,
        blocks: [
          {
            blockKey: 'f2',
            type: 'CHARACTER',
            position: 1,
            schemaVersion: 1,
            content: {
              characterId: charZhChar.id,
              showMeaning: true,
              showReading: true,
              showStrokeAnimation: false,
              guidedWriting: false,
            },
          },
        ],
      },
      // Non-existent character
      {
        title: { vi: 'Fail 3' },
        expectedRowVersion: rowVersionBefore.toString(),
        expectedRevisionId: highestRev.id,
        blocks: [
          {
            blockKey: 'f3',
            type: 'CHARACTER',
            position: 1,
            schemaVersion: 1,
            content: {
              characterId: randomUUID(),
              showMeaning: true,
              showReading: true,
              showStrokeAnimation: false,
              guidedWriting: false,
            },
          },
        ],
      },
      // Missing stroke data when animation enabled
      {
        title: { vi: 'Fail 4' },
        expectedRowVersion: rowVersionBefore.toString(),
        expectedRevisionId: highestRev.id,
        blocks: [
          {
            blockKey: 'f4',
            type: 'CHARACTER',
            position: 1,
            schemaVersion: 1,
            content: {
              characterId: charJaTree.id,
              showMeaning: true,
              showReading: true,
              showStrokeAnimation: true,
              guidedWriting: false,
            },
          },
        ],
      },
    ];

    for (const attempt of failedAttempts) {
      const res = await saveTeacherLessonDraft(teacher1Id, jaLesson.id, attempt, prisma);
      assert.equal(res.status, 400);
      assert.equal(res.error.code, 'VALIDATION_ERROR');
    }

    // Verify complete state preservation
    const lessonAfter = await prisma.lesson.findUnique({ where: { id: jaLesson.id } });
    assert.equal(lessonAfter.rowVersion, rowVersionBefore);
    const revCountAfter = await prisma.lessonRevision.count({ where: { lessonId: jaLesson.id } });
    assert.equal(revCountAfter, revCountBefore);
    const blockCountAfter = await prisma.lessonContentBlock.count();
    assert.equal(blockCountAfter, blockCountBefore);
  });

  test('VOCABULARY REVISION PIN: saves character membership and display data in the revision snapshot', async () => {
    const vocabularyCharacter = await createCharacter({
      languageId: jaLang.id,
      glyph: '語',
      scriptType: 'KANJI',
      meaning: 'Ngôn ngữ',
      primaryReading: 'ご',
      romanization: 'go',
      strokeCount: 14,
    }, prisma);
    const vocabulary = await prisma.vocabularyConcept.create({
      data: {
        languageId: jaLang.id,
        canonicalForm: '日語',
        normalizedForm: '日語',
        senseKey: 'revision-pin-test',
        meaningLabels: { vi: 'tiếng Nhật' },
        createdBy: teacher1Id,
      },
    });
    await prisma.vocabularyCharacter.create({
      data: {
        vocabularyId: vocabulary.id,
        characterId: vocabularyCharacter.id,
        position: 1,
      },
    });

    const lessonBefore = await prisma.lesson.findUnique({ where: { id: jaLesson.id } });
    const predecessor = await prisma.lessonRevision.findFirst({
      where: { lessonId: jaLesson.id },
      orderBy: { revisionNo: 'desc' },
    });
    const result = await saveTeacherLessonDraft(teacher1Id, jaLesson.id, {
      title: { vi: 'Ghim ký tự từ vựng theo revision' },
      expectedRowVersion: String(lessonBefore.rowVersion),
      expectedRevisionId: predecessor?.id,
      vocabulary: [{ vocabularyId: vocabulary.id, position: 1 }],
    }, prisma);

    assert.equal(result.status, 200);
    const revision = await prisma.lessonRevision.findFirst({
      where: { lessonId: jaLesson.id },
      orderBy: { revisionNo: 'desc' },
      include: { vocabularyLinks: true },
    });
    const characters = revision.vocabularyLinks[0].displaySnapshot.characters;
    assert.deepEqual(characters, [{
      characterId: vocabularyCharacter.id,
      position: 1,
      glyph: '語',
      scriptType: 'KANJI',
      meaning: 'Ngôn ngữ',
      primaryReading: 'ご',
      romanization: 'go',
      strokeCount: 14,
      strokeVersion: null,
    }]);

    await prisma.writingCharacter.update({
      where: { id: vocabularyCharacter.id },
      data: { meaning: 'Nghĩa mới', primaryReading: 'あたらしい' },
    });
    await prisma.vocabularyCharacter.delete({
      where: {
        vocabularyId_position: { vocabularyId: vocabulary.id, position: 1 },
      },
    });
    const pinnedRevision = await prisma.lessonRevision.findUniqueOrThrow({
      where: { id: revision.id },
      include: { vocabularyLinks: true },
    });
    assert.deepEqual(pinnedRevision.vocabularyLinks[0].displaySnapshot.characters, characters);
  });
});
