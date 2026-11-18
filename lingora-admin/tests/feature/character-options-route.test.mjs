import { test, describe, before } from 'node:test';
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

const { GET: getCharacterOptionsRoute } = await import(
  '../../src/app/api/teacher/lessons/[lessonId]/character-options/route.ts'
);
const {
  getTeacherCharacterOptions,
  getTeacherLessonDetail,
  saveTeacherLessonDraft,
  toLessonDetailDto,
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

describe('S6-04b1: Teacher Studio Character Options Lookup & Draft Projection', () => {
  let prisma;
  let jaLang;
  let zhLang;
  let assignedTeacherId;
  let unassignedTeacherId;
  let inactiveTeacherId;
  let adminId;

  // Japanese context
  let jaCourse;
  let jaUnit;
  let jaLesson;
  let jaCharSun; // 日, with strokes
  let jaCharTree; // 木, no strokes
  let jaCharGlyph; // 字, Japanese

  // Chinese context
  let zhCourse;
  let zhUnit;
  let zhLesson;
  let zhCharGlyph; // 字, Chinese

  let activeAuthId;

  before(async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://auth-test.invalid';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    prisma = new PrismaClient({
      datasources: { db: { url: testDbUrl } },
      log: [],
    });

    await prisma.$connect();
    await seed(prisma);
    setProductPrismaForTest(prisma);

    // Mock global fetch for Supabase auth getUser
    globalThis.fetch = async () => {
      return Response.json({
        id: activeAuthId,
        email: `${activeAuthId}@lingora.test`,
      });
    };

    // Ensure ja and zh languages exist
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

    // Accounts
    assignedTeacherId = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO auth.users (id, email)
      VALUES (${assignedTeacherId}::uuid, 'assigned-t@lingora.test')
      ON CONFLICT DO NOTHING
    `;
    await prisma.account.create({
      data: {
        id: assignedTeacherId,
        role: 'TEACHER',
        status: 'ACTIVE',
        displayName: 'Assigned Teacher S604b1',
        uiLocale: 'vi',
      },
    });

    unassignedTeacherId = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO auth.users (id, email)
      VALUES (${unassignedTeacherId}::uuid, 'unassigned-t@lingora.test')
      ON CONFLICT DO NOTHING
    `;
    await prisma.account.create({
      data: {
        id: unassignedTeacherId,
        role: 'TEACHER',
        status: 'ACTIVE',
        displayName: 'Unassigned Teacher S604b1',
        uiLocale: 'vi',
      },
    });

    inactiveTeacherId = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO auth.users (id, email)
      VALUES (${inactiveTeacherId}::uuid, 'inactive-t@lingora.test')
      ON CONFLICT DO NOTHING
    `;
    await prisma.account.create({
      data: {
        id: inactiveTeacherId,
        role: 'TEACHER',
        status: 'DISABLED',
        displayName: 'Inactive Teacher S604b1',
        uiLocale: 'vi',
      },
    });

    adminId = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO auth.users (id, email)
      VALUES (${adminId}::uuid, 'admin-s604b1@lingora.test')
      ON CONFLICT DO NOTHING
    `;
    await prisma.account.create({
      data: {
        id: adminId,
        role: 'ADMIN',
        status: 'ACTIVE',
        displayName: 'Admin User S604b1',
        uiLocale: 'vi',
      },
    });

    // Japanese Course & Lesson
    jaCourse = await prisma.course.create({
      data: {
        language: { connect: { id: jaLang.id } },
        framework: { connect: { id: '00000000-0000-0000-0000-000000000010' } },
        defaultStartLevel: { connect: { id: '00000000-0000-0000-0000-000000000021' } },
        names: { ja: '日本語初級', vi: 'Tiếng Nhật S6' },
        isActive: true,
      },
    });

    jaUnit = await prisma.unit.create({
      data: {
        course: { connect: { id: jaCourse.id } },
        level: { connect: { id: '00000000-0000-0000-0000-000000000021' } },
        code: 'JA-U1',
        position: 1,
        names: { ja: '第1課', vi: 'Bài 1' },
      },
    });

    jaLesson = await prisma.lesson.create({
      data: {
        unitId: jaUnit.id,
        position: 1,
        isRequired: true,
        availability: 'PLANNED',
        rowVersion: 1n,
      },
    });

    const jaAssignment = await prisma.contentAssignment.create({
      data: {
        lessonId: jaLesson.id,
        currentTeacherId: assignedTeacherId,
        createdBy: adminId,
        scopeGeneration: 1n,
      },
    });

    await prisma.assignmentHistory.create({
      data: {
        assignmentId: jaAssignment.id,
        sequenceNo: 1,
        eventType: 'ASSIGNED',
        nextTeacherId: assignedTeacherId,
        changedBy: adminId,
        scopeGeneration: 1n,
        reason: 'Initial assignment',
      },
    });

    // Chinese Course & Lesson
    zhCourse = await prisma.course.create({
      data: {
        language: { connect: { id: zhLang.id } },
        framework: { connect: { id: '00000000-0000-0000-0000-000000000010' } },
        defaultStartLevel: { connect: { id: '00000000-0000-0000-0000-000000000021' } },
        names: { zh: '中文初级', vi: 'Tiếng Trung S6' },
        isActive: true,
      },
    });

    zhUnit = await prisma.unit.create({
      data: {
        course: { connect: { id: zhCourse.id } },
        level: { connect: { id: '00000000-0000-0000-0000-000000000021' } },
        code: 'ZH-U1',
        position: 1,
        names: { zh: '第一课', vi: 'Bài 1' },
      },
    });

    zhLesson = await prisma.lesson.create({
      data: {
        unitId: zhUnit.id,
        position: 1,
        isRequired: true,
        availability: 'PLANNED',
        rowVersion: 1n,
      },
    });

    await prisma.contentAssignment.create({
      data: {
        lessonId: zhLesson.id,
        currentTeacherId: assignedTeacherId,
        createdBy: adminId,
        scopeGeneration: 1n,
      },
    });

    // Japanese Characters:
    // 1. '日' with stroke data version 1
    jaCharSun = await createCharacter({
      languageId: jaLang.id,
      glyph: '日',
      scriptType: 'KANJI',
      meaning: 'Mặt trời, ngày',
      primaryReading: 'ひ, にち',
      romanization: 'hi, nichi',
      strokeCount: 4,
    }, prisma);

    const sunStrokes = [
      createStroke(1, [[0.2, 0.1], [0.2, 0.9]]),
      createStroke(2, [[0.2, 0.1], [0.8, 0.1], [0.8, 0.9]]),
      createStroke(3, [[0.2, 0.5], [0.8, 0.5]]),
      createStroke(4, [[0.2, 0.9], [0.8, 0.9]]),
    ];

    await seedCharacterStrokeData({
      characterId: jaCharSun.id,
      version: 1,
      strokes: sunStrokes,
      source: 'lingora-admin/tests/fixtures/ja-sun.json',
      license: 'CC-BY-4.0',
      provenance: { author: 'Lingora Content Team', attribution: 'Self-authored' },
    }, prisma);

    // 2. '木' without stroke data
    jaCharTree = await createCharacter({
      languageId: jaLang.id,
      glyph: '木',
      scriptType: 'KANJI',
      meaning: 'Cây, gỗ',
      primaryReading: 'き, もく',
      romanization: 'ki, moku',
      strokeCount: 4,
    }, prisma);

    // 3. '字' in Japanese
    jaCharGlyph = await createCharacter({
      languageId: jaLang.id,
      glyph: '字',
      scriptType: 'KANJI',
      meaning: 'Chữ, ký tự',
      primaryReading: 'じ',
      romanization: 'ji',
      strokeCount: 6,
    }, prisma);

    // Chinese Characters:
    // 4. '字' in Chinese
    zhCharGlyph = await createCharacter({
      languageId: zhLang.id,
      glyph: '字',
      scriptType: 'HANZI_SIMPLIFIED',
      meaning: 'Chữ, văn tự',
      primaryReading: 'zì',
      romanization: 'zi4',
      strokeCount: 6,
    }, prisma);
  });

  test('SECURITY & ROUTE: rejects unauthenticated caller with 401 and private no-store headers', async () => {
    currentCookieStore = {
      getAll: () => [],
      get: () => undefined,
      set: () => {},
      delete: () => {},
    };

    const req = new Request(`https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options`);
    const res = await getCharacterOptionsRoute(req, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });

    assert.equal(res.status, 401);
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
    const json = await res.json();
    assert.equal(json.error.code, 'UNAUTHENTICATED');
  });

  test('SECURITY & ROUTE: rejects non-teacher role (ADMIN) with 403 FORBIDDEN', async () => {
    activeAuthId = adminId;
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(adminId)],
      get: (n) => n === 'sb-auth-test-auth-token' ? createMockSessionCookie(adminId) : undefined,
      set: () => {},
      delete: () => {},
    };

    const req = new Request(`https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options`);
    const res = await getCharacterOptionsRoute(req, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });

    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.error.code, 'FORBIDDEN');
  });

  test('SECURITY & ROUTE: rejects inactive teacher status with 403 ACCOUNT_INACTIVE', async () => {
    activeAuthId = inactiveTeacherId;
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(inactiveTeacherId)],
      get: (n) => n === 'sb-auth-test-auth-token' ? createMockSessionCookie(inactiveTeacherId) : undefined,
      set: () => {},
      delete: () => {},
    };

    const req = new Request(`https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options`);
    const res = await getCharacterOptionsRoute(req, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });

    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.error.code, 'ACCOUNT_INACTIVE');
  });

  test('ASSIGNMENT GUARD: rejects unassigned teacher with 404 LESSON_NOT_FOUND', async () => {
    activeAuthId = unassignedTeacherId;
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(unassignedTeacherId)],
      get: (n) => n === 'sb-auth-test-auth-token' ? createMockSessionCookie(unassignedTeacherId) : undefined,
      set: () => {},
      delete: () => {},
    };

    const req = new Request(`https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options`);
    const res = await getCharacterOptionsRoute(req, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });

    assert.equal(res.status, 404);
    const json = await res.json();
    assert.equal(json.error.code, 'LESSON_NOT_FOUND');
  });

  test('VALIDATION: rejects search query exceeding 300 characters with 400', async () => {
    activeAuthId = assignedTeacherId;
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(assignedTeacherId)],
      get: (n) => n === 'sb-auth-test-auth-token' ? createMockSessionCookie(assignedTeacherId) : undefined,
      set: () => {},
      delete: () => {},
    };

    const oversizedQ = 'a'.repeat(301);
    const req = new Request(`https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options?q=${oversizedQ}`);
    const res = await getCharacterOptionsRoute(req, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });

    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });

  test('COURSE LANGUAGE ISOLATION: same glyph in another language can NEVER appear', async () => {
    activeAuthId = assignedTeacherId;
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(assignedTeacherId)],
      get: (n) => n === 'sb-auth-test-auth-token' ? createMockSessionCookie(assignedTeacherId) : undefined,
      set: () => {},
      delete: () => {},
    };

    // 1. Search '字' in Japanese lesson -> MUST return ONLY Japanese '字', NEVER Chinese '字'
    const jaReq = new Request(`https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options?q=字`);
    const jaRes = await getCharacterOptionsRoute(jaReq, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });

    assert.equal(jaRes.status, 200);
    const jaJson = await jaRes.json();
    assert.ok(Array.isArray(jaJson.data));
    assert.equal(jaJson.data.length, 1);
    assert.equal(jaJson.data[0].id, jaCharGlyph.id);
    assert.equal(jaJson.data[0].languageId, jaLang.id);
    assert.equal(jaJson.data[0].scriptType, 'KANJI');

    // 2. Search '字' in Chinese lesson -> MUST return ONLY Chinese '字', NEVER Japanese '字'
    const zhReq = new Request(`https://admin.lingora.test/api/teacher/lessons/${zhLesson.id}/character-options?q=字`);
    const zhRes = await getCharacterOptionsRoute(zhReq, {
      params: Promise.resolve({ lessonId: zhLesson.id }),
    });

    assert.equal(zhRes.status, 200);
    const zhJson = await zhRes.json();
    assert.ok(Array.isArray(zhJson.data));
    assert.equal(zhJson.data.length, 1);
    assert.equal(zhJson.data[0].id, zhCharGlyph.id);
    assert.equal(zhJson.data[0].languageId, zhLang.id);
    assert.equal(zhJson.data[0].scriptType, 'HANZI_SIMPLIFIED');
  });

  test('DATA BOUNDARY: returns minimum selector data with stroke availability and NO raw geometry', async () => {
    activeAuthId = assignedTeacherId;
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(assignedTeacherId)],
      get: (n) => n === 'sb-auth-test-auth-token' ? createMockSessionCookie(assignedTeacherId) : undefined,
      set: () => {},
      delete: () => {},
    };

    const req = new Request(`https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options`);
    const res = await getCharacterOptionsRoute(req, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data));
    assert.ok(json.data.length >= 3);

    for (const item of json.data) {
      // Must contain expected fields
      assert.equal(typeof item.id, 'string');
      assert.equal(typeof item.languageId, 'string');
      assert.equal(typeof item.glyph, 'string');
      assert.equal(typeof item.scriptType, 'string');
      assert.equal(typeof item.strokeCount, 'number');
      assert.equal(typeof item.hasStrokes, 'boolean');

      // CRITICAL: MUST NOT leak raw geometry or strokes array
      assert.equal(item.strokes, undefined);
      assert.equal(item.path, undefined);
      assert.equal(item.points, undefined);
      assert.equal(item.strokeData, undefined);
    }

    // Verify stroke availability reflection
    const sunItem = json.data.find((c) => c.id === jaCharSun.id);
    assert.ok(sunItem);
    assert.equal(sunItem.hasStrokes, true);

    const treeItem = json.data.find((c) => c.id === jaCharTree.id);
    assert.ok(treeItem);
    assert.equal(treeItem.hasStrokes, false);
  });

  test('PROJECTION & RECOVERY: teacher save and detail GET project valid CHARACTER draft block to author shape with selectedLabel', async () => {
    // 1. Teacher saves draft with CHARACTER block in author shape
    const saveRes = await saveTeacherLessonDraft(assignedTeacherId, jaLesson.id, {
      expectedRowVersion: (jaLesson.rowVersion ?? 1n).toString(),
      expectedRevisionId: null,
      contentSchemaVersion: 1,
      title: { vi: 'Bài học tiếng Nhật 1', en: 'Japanese Lesson 1' },
      blocks: [
        {
          blockKey: 'char_author_block_1',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: jaCharSun.id,
            showMeaning: true,
            showReading: false,
            showStrokeAnimation: true,
            guidedWriting: false,
          },
        },
      ],
    }, prisma);

    assert.equal(saveRes.status, 200);
    assert.ok(saveRes.data?.data);

    const savedDraft = saveRes.data.data;
    assert.equal(savedDraft.contentSchemaVersion, 1);
    assert.ok(Array.isArray(savedDraft.blocks));
    assert.equal(savedDraft.blocks.length, 1);

    const blockAfterSave = savedDraft.blocks[0];
    assert.equal(blockAfterSave.blockKey, 'char_author_block_1');
    assert.equal(blockAfterSave.type, 'CHARACTER');
    assert.equal(blockAfterSave.position, 1);
    assert.equal(blockAfterSave.content.characterId, jaCharSun.id);
    assert.equal(blockAfterSave.content.showMeaning, true);
    assert.equal(blockAfterSave.content.showReading, false);
    assert.equal(blockAfterSave.content.showStrokeAnimation, true);
    assert.equal(blockAfterSave.content.guidedWriting, false);

    // Selected label projection
    assert.ok(blockAfterSave.selectedLabel);
    assert.equal(blockAfterSave.selectedLabel.glyph, '日');
    assert.equal(blockAfterSave.selectedLabel.scriptType, 'KANJI');
    assert.equal(blockAfterSave.selectedLabel.strokeCount, 4);
    assert.equal(blockAfterSave.selectedLabel.hasStrokes, true);

    // 2. Teacher detail GET reloads the same draft
    const detailRes = await getTeacherLessonDetail(assignedTeacherId, jaLesson.id, prisma);
    assert.equal(detailRes.status, 200);
    assert.ok(detailRes.data?.data);

    const reloadedDraft = detailRes.data.data;
    assert.equal(reloadedDraft.blocks.length, 1);
    const reloadedBlock = reloadedDraft.blocks[0];
    assert.equal(reloadedBlock.blockKey, 'char_author_block_1');
    assert.equal(reloadedBlock.type, 'CHARACTER');
    assert.equal(reloadedBlock.content.characterId, jaCharSun.id);
    assert.equal(reloadedBlock.content.showMeaning, true);
    assert.equal(reloadedBlock.content.showReading, false);
    assert.equal(reloadedBlock.content.showStrokeAnimation, true);
    assert.equal(reloadedBlock.content.guidedWriting, false);
    assert.equal(reloadedBlock.selectedLabel.glyph, '日');
    assert.equal(reloadedBlock.selectedLabel.hasStrokes, true);
  });

  test('REGRESSION: malformed persisted CHARACTER row (showReading string) marks draft uneditable and falls back to UNSUPPORTED', async () => {
    // 1. Fetch highest revision of jaLesson
    const rev = await prisma.lessonRevision.findFirstOrThrow({
      where: { lessonId: jaLesson.id },
      orderBy: { revisionNo: 'desc' },
      include: { blocks: true },
    });

    const charBlock = await prisma.lessonContentBlock.findFirstOrThrow({
      where: { lessonRevisionId: rev.id, type: 'CHARACTER' },
    });

    // Corrupt the content so showReading is a string
    const rawContent = typeof charBlock.content === 'string' ? JSON.parse(charBlock.content) : charBlock.content;
    await prisma.lessonContentBlock.update({
      where: { id: charBlock.id },
      data: { content: { ...rawContent, showReading: 'false' } },
    });

    // 2. Fetch via getTeacherLessonDetail
    const detail = await getTeacherLessonDetail(assignedTeacherId, jaLesson.id, prisma);
    assert.equal(detail.status, 200);
    assert.equal(detail.data.data.isEditable, false, 'malformed CHARACTER must mark draft isEditable = false');
    assert.ok(detail.data.data.editabilityReason);
    const reloadedCharBlock = detail.data.data.blocks.find((b) => b.blockKey === charBlock.blockKey);
    assert.equal(reloadedCharBlock.type, 'UNSUPPORTED', 'malformed CHARACTER must fall back to UNSUPPORTED');

    // Restore valid content for subsequent tests
    await prisma.lessonContentBlock.update({
      where: { id: charBlock.id },
      data: { content: rawContent },
    });
  });

  test('REGRESSION: malformed persisted legacy block (HEADING level 99) marks draft uneditable and falls back to UNSUPPORTED', async () => {
    // 1. Add a malformed HEADING block to jaLesson highest revision
    const rev = await prisma.lessonRevision.findFirstOrThrow({
      where: { lessonId: jaLesson.id },
      orderBy: { revisionNo: 'desc' },
    });

    const badHeading = await prisma.lessonContentBlock.create({
      data: {
        lessonRevisionId: rev.id,
        blockKey: 'bad_heading_test',
        type: 'HEADING',
        position: 2,
        schemaVersion: 1,
        content: { level: 99, text: 'Malformed Heading' },
      },
    });

    // 2. Fetch via getTeacherLessonDetail
    const detail = await getTeacherLessonDetail(assignedTeacherId, jaLesson.id, prisma);
    assert.equal(detail.status, 200);
    assert.equal(detail.data.data.isEditable, false, 'malformed HEADING must mark draft isEditable = false');
    assert.ok(detail.data.data.editabilityReason);
    const badBlock = detail.data.data.blocks.find((b) => b.blockKey === 'bad_heading_test');
    assert.equal(badBlock.type, 'UNSUPPORTED', 'malformed HEADING must fall back to UNSUPPORTED');

    // Clean up bad heading
    await prisma.lessonContentBlock.delete({ where: { id: badHeading.id } });
  });

  test('REGRESSION: generic toLessonDetailDto keeps shared presentation projection without teacher author transformation', async () => {
    const lessonWithRev = await prisma.lesson.findFirstOrThrow({
      where: { id: jaLesson.id },
      include: {
        unit: { include: { course: true } },
        revisions: {
          orderBy: { revisionNo: 'desc' },
          include: { blocks: true },
        },
      },
    });

    const adminDetail = toLessonDetailDto(lessonWithRev);
    assert.ok(adminDetail.currentDraft);
    // Generic DTO blocks come directly from parsePersistedLessonContent(highestRev).blocks
    // where CHARACTER is UNSUPPORTED for common presentation
    const charBlock = adminDetail.currentDraft.blocks.find((b) => b.blockKey === 'char_author_block_1');
    assert.equal(charBlock.type, 'UNSUPPORTED', 'Admin generic DTO must not expose teacher author shape');
  });

  // --------------------------------------------------------------------------
  // S6-04b1p: Teacher Catalogue Picker Pagination & Scoping
  // --------------------------------------------------------------------------

  test('PAGINATION: multiple pages with fixed 20 results, deterministic order, and signal for next page only when exists', async () => {
    activeAuthId = assignedTeacherId;
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(assignedTeacherId)],
      get: (n) => n === 'sb-auth-test-auth-token' ? createMockSessionCookie(assignedTeacherId) : undefined,
      set: () => {},
      delete: () => {},
    };

    // Seed 45 Japanese characters with unique glyphs and deterministic stroke counts
    const seededJaChars = [];
    for (let i = 0; i < 45; i++) {
      const glyph = String.fromCodePoint(0x30a1 + i); // Katakana ァ, ア, ィ...
      const char = await createCharacter(
        {
          languageId: jaLang.id,
          glyph,
          scriptType: 'KATAKANA',
          meaning: `PaginationBatch item ${i}`,
          primaryReading: `reading_${i}`,
          romanization: `rom_${i}`,
          strokeCount: (i % 10) + 1,
        },
        prisma
      );
      seededJaChars.push(char);
    }

    // 1. Fetch Page 1 (initial request without cursor)
    const page1Req = new Request(`https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options`);
    const page1Res = await getCharacterOptionsRoute(page1Req, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });
    assert.equal(page1Res.status, 200);
    const page1Json = await page1Res.json();

    assert.ok(Array.isArray(page1Json.data), 'data must be an array');
    assert.equal(page1Json.data.length, 20, 'Page 1 must contain exactly 20 items (fixed page size)');
    assert.equal(page1Json.hasMore, true, 'hasMore must be true when another page exists');
    assert.equal(typeof page1Json.nextCursor, 'string', 'nextCursor must be a string');
    assert.ok(page1Json.nextCursor.length > 0);
    assert.equal(page1Json.pagination?.hasMore, true);
    assert.equal(page1Json.pagination?.nextCursor, page1Json.nextCursor);

    // Verify deterministic ordering: strokeCount asc, then glyph asc, then id asc
    for (let i = 0; i < page1Json.data.length - 1; i++) {
      const current = page1Json.data[i];
      const next = page1Json.data[i + 1];
      if (current.strokeCount === next.strokeCount) {
        assert.ok(current.glyph <= next.glyph, 'Deterministic ordering by glyph');
      } else {
        assert.ok(current.strokeCount < next.strokeCount, 'Deterministic ordering by strokeCount');
      }
    }

    // 2. Fetch Page 2 (with cursor from page 1)
    const page2Req = new Request(
      `https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options?cursor=${encodeURIComponent(page1Json.nextCursor)}`
    );
    const page2Res = await getCharacterOptionsRoute(page2Req, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });
    assert.equal(page2Res.status, 200);
    const page2Json = await page2Res.json();

    assert.ok(Array.isArray(page2Json.data), 'Page 2 data must be an array');
    assert.equal(page2Json.data.length, 20, 'Page 2 must contain exactly 20 items');
    assert.equal(page2Json.hasMore, true, 'Page 2 hasMore must be true');
    assert.equal(typeof page2Json.nextCursor, 'string');

    // Verify all items in Page 2 are distinct from Page 1
    const page1Ids = new Set(page1Json.data.map((c) => c.id));
    for (const item of page2Json.data) {
      assert.ok(!page1Ids.has(item.id), `Page 2 item ${item.glyph} must not duplicate Page 1`);
    }

    // 3. Fetch Page 3 (final page)
    const page3Req = new Request(
      `https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options?cursor=${encodeURIComponent(page2Json.nextCursor)}`
    );
    const page3Res = await getCharacterOptionsRoute(page3Req, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });
    assert.equal(page3Res.status, 200);
    const page3Json = await page3Res.json();

    assert.ok(Array.isArray(page3Json.data), 'Page 3 data must be an array');
    // Total Japanese characters = 3 initial + 45 batch = 48. Page 1 = 20, Page 2 = 20, Page 3 = 8.
    assert.equal(page3Json.data.length, 8, 'Page 3 must contain remaining 8 items');
    // Final page: signal for another page only when it exists!
    assert.equal(page3Json.hasMore, false, 'hasMore must be false on final page');
    assert.equal(page3Json.nextCursor, null, 'nextCursor must be null on final page');
    assert.equal(page3Json.pagination?.hasMore, false);
    assert.equal(page3Json.pagination?.nextCursor, null);

    // Verify union of all 3 pages covers all 48 characters with 0 duplicates
    const allIds = new Set([...page1Json.data, ...page2Json.data, ...page3Json.data].map((c) => c.id));
    assert.equal(allIds.size, 48, 'Combined pages must contain all 48 characters with zero duplicates');
  });

  test('PAGINATION: invalid continuation parameter is rejected with 400 VALIDATION_ERROR', async () => {
    activeAuthId = assignedTeacherId;
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(assignedTeacherId)],
      get: (n) => n === 'sb-auth-test-auth-token' ? createMockSessionCookie(assignedTeacherId) : undefined,
      set: () => {},
      delete: () => {},
    };

    // 1. Malformed non-base64 continuation string
    const malformedReq = new Request(
      `https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options?cursor=not-a-valid-cursor-token`
    );
    const malformedRes = await getCharacterOptionsRoute(malformedReq, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });
    assert.equal(malformedRes.status, 400);
    const malformedJson = await malformedRes.json();
    assert.equal(malformedJson.error?.code, 'VALIDATION_ERROR');

    // 2. Non-existent UUID as continuation
    const nonexistentUuidReq = new Request(
      `https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options?cursor=99999999-9999-9999-9999-999999999999`
    );
    const nonexistentUuidRes = await getCharacterOptionsRoute(nonexistentUuidReq, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });
    assert.equal(nonexistentUuidRes.status, 400);
    const nonexistentUuidJson = await nonexistentUuidRes.json();
    assert.equal(nonexistentUuidJson.error?.code, 'VALIDATION_ERROR');

    // 3. Valid base64 but invalid JSON schema
    const badSchemaCursor = Buffer.from(JSON.stringify({ wrongField: 123 }), 'utf8').toString('base64url');
    const badSchemaReq = new Request(
      `https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options?cursor=${badSchemaCursor}`
    );
    const badSchemaRes = await getCharacterOptionsRoute(badSchemaReq, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });
    assert.equal(badSchemaRes.status, 400);
    const badSchemaJson = await badSchemaRes.json();
    assert.equal(badSchemaJson.error?.code, 'VALIDATION_ERROR');

    // 4. Duplicate cursor parameters
    const duplicateCursorReq = new Request(
      `https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options?cursor=token1&cursor=token2`
    );
    const duplicateCursorRes = await getCharacterOptionsRoute(duplicateCursorReq, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });
    assert.equal(duplicateCursorRes.status, 400);
    const duplicateCursorJson = await duplicateCursorRes.json();
    assert.equal(duplicateCursorJson.error?.code, 'VALIDATION_ERROR');
  });

  test('PAGINATION: assignment and language scoping are strictly enforced on later pages', async () => {
    // Obtain valid page 1 nextCursor for Japanese lesson
    activeAuthId = assignedTeacherId;
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(assignedTeacherId)],
      get: (n) => n === 'sb-auth-test-auth-token' ? createMockSessionCookie(assignedTeacherId) : undefined,
      set: () => {},
      delete: () => {},
    };

    const p1Req = new Request(`https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options`);
    const p1Res = await getCharacterOptionsRoute(p1Req, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });
    const p1Json = await p1Res.json();
    const jaCursor = p1Json.nextCursor;
    assert.ok(jaCursor);

    // 1. Unassigned teacher requesting later page -> 404 LESSON_NOT_FOUND
    activeAuthId = unassignedTeacherId;
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(unassignedTeacherId)],
      get: (n) => n === 'sb-auth-test-auth-token' ? createMockSessionCookie(unassignedTeacherId) : undefined,
      set: () => {},
      delete: () => {},
    };
    const unassignedReq = new Request(
      `https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options?cursor=${encodeURIComponent(jaCursor)}`
    );
    const unassignedRes = await getCharacterOptionsRoute(unassignedReq, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });
    assert.equal(unassignedRes.status, 404);
    const unassignedJson = await unassignedRes.json();
    assert.equal(unassignedJson.error?.code, 'LESSON_NOT_FOUND');

    // 2. Non-teacher role requesting later page -> 403 FORBIDDEN
    activeAuthId = adminId;
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(adminId)],
      get: (n) => n === 'sb-auth-test-auth-token' ? createMockSessionCookie(adminId) : undefined,
      set: () => {},
      delete: () => {},
    };
    const adminReq = new Request(
      `https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options?cursor=${encodeURIComponent(jaCursor)}`
    );
    const adminRes = await getCharacterOptionsRoute(adminReq, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });
    assert.equal(adminRes.status, 403);
    const adminJson = await adminRes.json();
    assert.equal(adminJson.error?.code, 'FORBIDDEN');

    // 3. Passing Chinese character cursor to Japanese lesson -> 400 VALIDATION_ERROR
    activeAuthId = assignedTeacherId;
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(assignedTeacherId)],
      get: (n) => n === 'sb-auth-test-auth-token' ? createMockSessionCookie(assignedTeacherId) : undefined,
      set: () => {},
      delete: () => {},
    };
    const zhCursor = Buffer.from(
      JSON.stringify({ id: zhCharGlyph.id, strokeCount: zhCharGlyph.strokeCount, glyph: zhCharGlyph.glyph }),
      'utf8'
    ).toString('base64url');

    const crossLangReq = new Request(
      `https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options?cursor=${encodeURIComponent(zhCursor)}`
    );
    const crossLangRes = await getCharacterOptionsRoute(crossLangReq, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });
    assert.equal(crossLangRes.status, 400);
    const crossLangJson = await crossLangRes.json();
    assert.equal(crossLangJson.error?.code, 'VALIDATION_ERROR');

    // 4. Passing Japanese character cursor to Chinese lesson -> 400 VALIDATION_ERROR
    const crossLangZhReq = new Request(
      `https://admin.lingora.test/api/teacher/lessons/${zhLesson.id}/character-options?cursor=${encodeURIComponent(jaCursor)}`
    );
    const crossLangZhRes = await getCharacterOptionsRoute(crossLangZhReq, {
      params: Promise.resolve({ lessonId: zhLesson.id }),
    });
    assert.equal(crossLangZhRes.status, 400);
    const crossLangZhJson = await crossLangZhRes.json();
    assert.equal(crossLangZhJson.error?.code, 'VALIDATION_ERROR');
  });

  test('PAGINATION: search query resets results to first page and isolates continuation scope', async () => {
    activeAuthId = assignedTeacherId;
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(assignedTeacherId)],
      get: (n) => n === 'sb-auth-test-auth-token' ? createMockSessionCookie(assignedTeacherId) : undefined,
      set: () => {},
      delete: () => {},
    };

    // 1. Search for batch characters: 'PaginationBatch' (matches all 45 Katakana items)
    const search1Req = new Request(
      `https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options?q=PaginationBatch`
    );
    const search1Res = await getCharacterOptionsRoute(search1Req, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });
    assert.equal(search1Res.status, 200);
    const search1Json = await search1Res.json();
    assert.equal(search1Json.data.length, 20, 'Search 1 Page 1 returns 20 items');
    assert.equal(search1Json.hasMore, true);
    assert.ok(search1Json.nextCursor);

    // 2. Fetch page 2 of Search 1
    const search1P2Req = new Request(
      `https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options?q=PaginationBatch&cursor=${encodeURIComponent(search1Json.nextCursor)}`
    );
    const search1P2Res = await getCharacterOptionsRoute(search1P2Req, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });
    assert.equal(search1P2Res.status, 200);
    const search1P2Json = await search1P2Res.json();
    assert.equal(search1P2Json.data.length, 20, 'Search 1 Page 2 returns 20 items');
    for (const item of search1P2Json.data) {
      assert.ok(item.meaning.includes('PaginationBatch'), 'All items match search query');
    }

    // 3. New search with different query: 'PaginationBatch item 1' (matches items 1, 10..19 = 11 items)
    // Resets to first page!
    const search2Req = new Request(
      `https://admin.lingora.test/api/teacher/lessons/${jaLesson.id}/character-options?q=${encodeURIComponent('PaginationBatch item 1')}`
    );
    const search2Res = await getCharacterOptionsRoute(search2Req, {
      params: Promise.resolve({ lessonId: jaLesson.id }),
    });
    assert.equal(search2Res.status, 200);
    const search2Json = await search2Res.json();
    assert.equal(search2Json.data.length, 11, 'New search resets to first page with only matching results (11)');
    assert.equal(search2Json.hasMore, false, 'No more pages when count <= 20');
    assert.equal(search2Json.nextCursor, null, 'nextCursor is null on final/only page of new search');
  });
});
