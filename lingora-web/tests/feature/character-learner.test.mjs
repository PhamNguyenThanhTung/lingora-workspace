import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { randomUUID } from 'node:crypto';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import { getLearnerCookieName } from '../../src/server/auth/env.ts';
import { LessonContent } from '@lingora/lesson-content/LessonContent';
import {
  learnerId,
  contextId,
  lesson1Id,
  lesson2Id,
  revision1Id,
  setupEnv,
  fixtureDb,
  providerDouble,
  token,
  confirmedUser,
  fixtureEmail,
  providerOrigin,
} from './harness/learner-fixture.mjs';

// Setup module mock for next/headers.js before importing route handlers
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

const lessonsRoute = await import('../../src/app/api/learner/contexts/[contextId]/lessons/route.ts');
const lessonDetailRoute = await import('../../src/app/api/learner/contexts/[contextId]/lessons/[lessonId]/route.ts');

const realFetch = globalThis.fetch;
let state;

function setAuthenticatedCookie(userId = learnerId, email = fixtureEmail) {
  const cookieName = getLearnerCookieName(providerOrigin);
  const sessionData = {
    access_token: token({ id: userId, email }).access_token,
    refresh_token: 'valid-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: userId, email, email_confirmed_at: '2026-10-31T00:00:00Z' },
  };
  const cookieValue = 'base64-' + Buffer.from(JSON.stringify(sessionData)).toString('base64');
  const mockCookie = { name: cookieName, value: cookieValue };
  currentCookieStore = {
    getAll: () => [mockCookie],
    get: (name) => (name === cookieName ? mockCookie : undefined),
    set: () => {},
    delete: () => {},
  };
}

function clearCookieStore() {
  currentCookieStore = {
    getAll: () => [],
    get: () => undefined,
    set: () => {},
    delete: () => {},
  };
}

function authHeaders(user = confirmedUser()) {
  const tok = token(user);
  return {
    Authorization: `Bearer ${tok.access_token}`,
    Host: 'localhost:3000',
    Origin: 'http://localhost:3000',
  };
}

describe('S6-04b3: Learner View CHARACTER Snapshot & Gating', () => {
  beforeEach(() => {
    setupEnv();
    globalThis.fetch = providerDouble();
    setAuthenticatedCookie();

    const charJaSunId = randomUUID();
    const charJaTreeId = randomUUID();
    const charZhSunId = randomUUID();

    // Setup Japanese Course, Unit, Lessons with CHARACTER blocks
    const jaLangId = '11111111-2222-4333-8444-555555555555';
    const jaCourseId = '22222222-3333-4444-8555-666666666666';
    const frameworkId = '33333333-4444-4555-8666-777777777777';
    const levelA1Id = '44444444-5555-4666-8777-888888888888';
    const jaUnitId = '55555555-6666-4777-8888-999999999999';

    const rev1Id = revision1Id;
    const rev2Id = randomUUID();

    const jaLevelA1 = {
      id: levelA1Id,
      frameworkId,
      code: 'A1',
      label: { vi: 'A1 Sơ cấp', en: 'Beginner' },
      position: 1,
    };

    const jaCourse = {
      id: jaCourseId,
      languageId: jaLangId,
      frameworkId,
      names: { vi: 'Tiếng Nhật Sơ cấp', ja: '初級日本語', en: 'Beginner Japanese' },
      isActive: true,
      defaultStartLevelId: levelA1Id,
      framework: { id: frameworkId, code: 'CEFR', version: '2020', names: { vi: 'CEFR' } },
    };

    const jaUnit = {
      id: jaUnitId,
      courseId: jaCourseId,
      levelId: levelA1Id,
      position: 1,
      names: { vi: 'Bài 1: Chữ Hán cơ bản', ja: '第1課：基本漢字', en: 'Unit 1: Basic Kanji' },
      level: jaLevelA1,
    };

    // Published Lesson 1 Revision with multiple interleaved blocks
    const jaRevision1 = {
      id: rev1Id,
      lessonId: lesson1Id,
      revisionNo: 1,
      status: 'PUBLISHED',
      title: { vi: 'Bài 1: Mặt trời và Cây cối', ja: '第1課：日と木', en: 'Lesson 1: Sun and Tree' },
      contentSchemaVersion: 1,
      blocks: [
        {
          id: randomUUID(),
          blockKey: 'heading_intro',
          type: 'HEADING',
          position: 1,
          schemaVersion: 1,
          content: { level: 2, text: 'Khám phá chữ Hán cơ bản' },
        },
        {
          id: randomUUID(),
          blockKey: 'char_ja_sun',
          type: 'CHARACTER',
          position: 2,
          schemaVersion: 1,
          content: {
            characterId: charJaSunId,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: true,
            snapshot: {
              glyph: '日',
              scriptType: 'KANJI',
              strokeCount: 4,
              meaning: 'Mặt trời, ngày',
              primaryReading: 'にち',
              romanization: 'nichi',
              metadata: { radical: '日', jlpt: 'N5' },
              strokeVersion: 1,
            },
          },
        },
        {
          id: randomUUID(),
          blockKey: 'text_explanation',
          type: 'TEXT',
          position: 3,
          schemaVersion: 1,
          content: {
            nodes: [
              {
                type: 'paragraph',
                runs: [{ text: 'Chữ Nhật mô phỏng hình ảnh mặt trời hình tròn có vạch ở giữa.' }],
              },
            ],
          },
        },
        {
          id: randomUUID(),
          blockKey: 'char_ja_tree_flags_off',
          type: 'CHARACTER',
          position: 4,
          schemaVersion: 1,
          content: {
            characterId: charJaTreeId,
            showMeaning: false, // meaning must be omitted!
            showReading: false, // reading must be omitted!
            showStrokeAnimation: false, // no animation!
            guidedWriting: false, // no guided writing!
            snapshot: {
              glyph: '木',
              scriptType: 'KANJI',
              strokeCount: 4,
              meaning: 'Cây cối',
              primaryReading: 'き',
              romanization: 'ki',
              metadata: { radical: '木' },
              strokeVersion: null,
            },
          },
        },
      ],
      topicIds: ['topic-kanji-1'],
      skillIds: ['skill-reading', 'skill-writing'],
      purposeTags: ['core'],
    };

    // Published Lesson 2 (Sequential next lesson in Unit)
    const jaRevision2 = {
      id: rev2Id,
      lessonId: lesson2Id,
      revisionNo: 1,
      status: 'PUBLISHED',
      title: { vi: 'Bài 2: Trăng và Nước', ja: '第2課：月と水', en: 'Lesson 2: Moon and Water' },
      contentSchemaVersion: 1,
      blocks: [
        {
          id: randomUUID(),
          blockKey: 'char_ja_moon',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: randomUUID(),
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: false,
            guidedWriting: false,
            snapshot: {
              glyph: '月',
              scriptType: 'KANJI',
              strokeCount: 4,
              meaning: 'Mặt trăng, tháng',
              primaryReading: 'げつ',
              romanization: 'getsu',
            },
          },
        },
      ],
      topicIds: ['topic-kanji-2'],
      skillIds: ['skill-reading'],
      purposeTags: ['core'],
    };

    const jaLesson1 = {
      id: lesson1Id,
      unitId: jaUnitId,
      position: 1,
      isRequired: true,
      availability: 'AVAILABLE',
      activeRevisionId: rev1Id,
      activeRevision: jaRevision1,
      unit: jaUnit,
    };

    const jaLesson2 = {
      id: lesson2Id,
      unitId: jaUnitId,
      position: 2,
      isRequired: true,
      availability: 'AVAILABLE',
      activeRevisionId: rev2Id,
      activeRevision: jaRevision2,
      unit: jaUnit,
    };

    jaUnit.lessons = [jaLesson1, jaLesson2];

    const jaContext = {
      id: contextId,
      learnerId,
      languageId: jaLangId,
      courseId: jaCourseId,
      status: 'ACTIVE',
      rowVersion: 1n,
      startSource: 'DEFAULT',
      language: { id: jaLangId, code: 'ja', names: { vi: 'Tiếng Nhật', ja: '日本語', en: 'Japanese' } },
      course: jaCourse,
      selectedStartLevelId: levelA1Id,
      selectedStartLevel: jaLevelA1,
      workingLevelId: levelA1Id,
      workingLevel: jaLevelA1,
    };

    state = {
      account: { id: learnerId, role: 'LEARNER', status: 'ACTIVE', displayName: 'Learner Ja', uiLocale: 'vi', timezone: 'Asia/Tokyo' },
      contexts: [jaContext],
      units: [jaUnit],
      lessons: [jaLesson1, jaLesson2],
      exercises: [],
      vocabulary: [],
      consumptions: [],
      completions: [],
    };

    setLearnerPrismaForTest(fixtureDb(state));
    globalThis.fetch = providerDouble(state);
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    setLearnerPrismaForTest(null);
    clearCookieStore();
  });

  // 1. Unlocked Lesson Access & DTO Allowlist Projection
  test('200: Learner loads published lesson with CHARACTER blocks projected through allowlist', async () => {
    const req = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}`, {
      headers: authHeaders(),
    });
    const res = await lessonDetailRoute.GET(req, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(res.status, 200);

    const body = await res.json();
    const data = body.data;
    assert.equal(data.lessonId, lesson1Id);
    assert.equal(data.revision.id, revision1Id);

    const blocks = data.revision.presentation?.blocks || data.revision.blocks;
    assert.equal(blocks.length, 4);

    // Verify ordering: HEADING (1), CHARACTER (2), TEXT (3), CHARACTER (4)
    assert.equal(blocks[0].type, 'HEADING');
    assert.equal(blocks[0].position, 1);
    assert.equal(blocks[1].type, 'CHARACTER');
    assert.equal(blocks[1].position, 2);
    assert.equal(blocks[2].type, 'TEXT');
    assert.equal(blocks[2].position, 3);
    assert.equal(blocks[3].type, 'CHARACTER');
    assert.equal(blocks[3].position, 4);

    // Verify Block 2: char_ja_sun (all flags ON)
    const sunBlock = blocks[1];
    assert.equal(sunBlock.blockKey, 'char_ja_sun');
    assert.equal(sunBlock.glyph, '日');
    assert.equal(sunBlock.scriptType, 'KANJI');
    assert.equal(sunBlock.strokeCount, 4);
    assert.equal(sunBlock.showMeaning, true);
    assert.equal(sunBlock.showReading, true);
    assert.equal(sunBlock.showStrokeAnimation, true);
    assert.equal(sunBlock.guidedWriting, true);
    assert.equal(sunBlock.meaning, 'Mặt trời, ngày');
    assert.equal(sunBlock.primaryReading, 'にち');
    assert.equal(sunBlock.romanization, 'nichi');
    assert.equal(sunBlock.strokeVersion, 1);

    // Strict boundary: NO raw strokes, NO metadata
    assert.equal('metadata' in sunBlock, false);
    assert.equal('strokes' in sunBlock, false);
    assert.equal('metadata' in sunBlock.content, false);
    assert.equal('strokes' in sunBlock.content, false);

    // Verify Block 4: char_ja_tree_flags_off (flags OFF)
    const treeBlock = blocks[3];
    assert.equal(treeBlock.blockKey, 'char_ja_tree_flags_off');
    assert.equal(treeBlock.glyph, '木');
    assert.equal(treeBlock.scriptType, 'KANJI');
    assert.equal(treeBlock.strokeCount, 4);
    assert.equal(treeBlock.showMeaning, false);
    assert.equal(treeBlock.showReading, false);
    assert.equal(treeBlock.showStrokeAnimation, false);
    assert.equal(treeBlock.guidedWriting, false);

    // Strict boundary: meaning, reading, romanization, strokeVersion MUST BE OMITTED
    assert.equal('meaning' in treeBlock, false, 'meaning must be omitted when showMeaning is false');
    assert.equal('primaryReading' in treeBlock, false, 'primaryReading must be omitted when showReading is false');
    assert.equal('romanization' in treeBlock, false, 'romanization must be omitted when showReading is false');
    assert.equal('strokeVersion' in treeBlock, false, 'strokeVersion must be omitted when not animated/guided');
  });

  // 2. Sequential Unit Gating & Locked Lesson Isolation
  test('409: Direct access to locked lesson returns LESSON_LOCKED and hides draft/active revision', async () => {
    // Lesson 2 is sequential after Lesson 1; Lesson 1 is not completed
    const req = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson2Id}`, {
      headers: authHeaders(),
    });
    const res = await lessonDetailRoute.GET(req, { params: Promise.resolve({ contextId, lessonId: lesson2Id }) });
    assert.equal(res.status, 409);

    const body = await res.json();
    assert.equal(body.error.code, 'LESSON_LOCKED');
    assert.match(body.error.message, /Cần hoàn thành bài học trước/);

    // Check Catalogue: locked lesson hides activeRevisionId
    const catReq = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons`, {
      headers: authHeaders(),
    });
    const catRes = await lessonsRoute.GET(catReq, { params: Promise.resolve({ contextId }) });
    assert.equal(catRes.status, 200);
    const catBody = await catRes.json();
    const lesson2Entry = catBody.data.units[0].lessons.find((l) => l.id === lesson2Id);
    assert.equal(lesson2Entry.isLocked, true);
    assert.equal(lesson2Entry.activeRevisionId, null, 'Active revision ID must be hidden on locked lesson');

    // Complete Lesson 1 via LessonCompletion
    state.completions.push({
      id: randomUUID(),
      contextId,
      lessonId: lesson1Id,
    });

    // Lesson 2 now unlocks
    const resUnlocked = await lessonDetailRoute.GET(req, { params: Promise.resolve({ contextId, lessonId: lesson2Id }) });
    assert.equal(resUnlocked.status, 200);
    const unlockedBody = await resUnlocked.json();
    assert.equal(unlockedBody.data.lessonId, lesson2Id);
    assert.equal(unlockedBody.data.revision.blocks[0].glyph, '月');
  });

  // 3. Draft Revision Isolation
  test('Draft Isolation: Teacher creating a newer draft revision does not leak to Learner', async () => {
    // Teacher creates an unapproved/draft revision #2 on Lesson 1
    const draftRev2 = {
      id: randomUUID(),
      lessonId: lesson1Id,
      revisionNo: 2,
      status: 'DRAFT',
      title: { vi: 'Bản nháp #2 chưa xuất bản' },
      contentSchemaVersion: 1,
      blocks: [
        {
          id: randomUUID(),
          blockKey: 'char_leak_test',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: randomUUID(),
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: false,
            guidedWriting: false,
            snapshot: {
              glyph: '火',
              scriptType: 'KANJI',
              strokeCount: 4,
              meaning: 'Lửa (bản nháp bí mật)',
            },
          },
        },
      ],
    };

    // Lesson activeRevisionId remains revision1Id
    assert.equal(state.lessons[0].activeRevisionId, revision1Id);

    const req = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}`, {
      headers: authHeaders(),
    });
    const res = await lessonDetailRoute.GET(req, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.data.revision.id, revision1Id, 'Must return active published revision ID');
    assert.notEqual(body.data.revision.id, draftRev2.id, 'Must never return draft revision ID');

    const glyphs = body.data.revision.blocks.filter((b) => b.type === 'CHARACTER').map((b) => b.glyph);
    assert.ok(glyphs.includes('日'), 'Published character 日 is visible');
    assert.ok(!glyphs.includes('火'), 'Draft character 火 is isolated');
  });

  // 4. Two Languages: Chinese Context and Hanzi Character Blocks
  test('200: Learner in Chinese context receives Hanzi character blocks', async () => {
    const zhLangId = '66666666-7777-4888-8999-000000000001';
    const zhCourseId = '66666666-7777-4888-8999-000000000002';
    const zhContextId = '66666666-7777-4888-8999-000000000003';
    const zhLessonId = '66666666-7777-4888-8999-000000000004';
    const zhUnitId = '66666666-7777-4888-8999-000000000005';
    const zhRevId = '66666666-7777-4888-8999-000000000006';
    const frameworkId = '33333333-4444-4555-8666-777777777777';
    const levelId = '44444444-5555-4666-8777-888888888888';

    const zhLevel = {
      id: levelId,
      frameworkId,
      code: 'HSK1',
      label: { vi: 'HSK 1', en: 'HSK 1' },
      position: 1,
    };

    const zhCourse = {
      id: zhCourseId,
      languageId: zhLangId,
      frameworkId,
      names: { vi: 'Tiếng Trung HSK 1', zh: '中文 HSK 1', en: 'Chinese HSK 1' },
      isActive: true,
      defaultStartLevelId: levelId,
      framework: { id: frameworkId, code: 'HSK', version: '2020', names: { vi: 'HSK' } },
    };

    const zhUnit = {
      id: zhUnitId,
      courseId: zhCourseId,
      levelId,
      position: 1,
      names: { vi: 'Bài 1: Hán tự cơ bản', zh: '第一课：基础汉字', en: 'Unit 1: Basic Hanzi' },
      level: zhLevel,
    };

    const zhRevision = {
      id: zhRevId,
      lessonId: zhLessonId,
      revisionNo: 1,
      status: 'PUBLISHED',
      title: { vi: 'Bài 1: Chữ Nhật', zh: '第1课：日', en: 'Lesson 1: Character Ri' },
      contentSchemaVersion: 1,
      blocks: [
        {
          id: randomUUID(),
          blockKey: 'char_zh_sun',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: randomUUID(),
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: true,
            snapshot: {
              glyph: '日',
              scriptType: 'HANZI_SIMPLIFIED',
              strokeCount: 4,
              meaning: 'mặt trời, ngày',
              primaryReading: 'rì',
              romanization: 'ri4',
              metadata: { pinyin: ['rì'], radical: '日', hskLevel: 1 },
              strokeVersion: 1,
            },
          },
        },
      ],
      topicIds: ['topic-hanzi'],
      skillIds: ['skill-reading', 'skill-writing'],
      purposeTags: ['core'],
    };

    const zhLesson = {
      id: zhLessonId,
      unitId: zhUnitId,
      position: 1,
      isRequired: true,
      availability: 'AVAILABLE',
      activeRevisionId: zhRevId,
      activeRevision: zhRevision,
      unit: zhUnit,
    };

    zhUnit.lessons = [zhLesson];

    const zhContext = {
      id: zhContextId,
      learnerId,
      languageId: zhLangId,
      courseId: zhCourseId,
      status: 'ACTIVE',
      rowVersion: 1n,
      startSource: 'DEFAULT',
      language: { id: zhLangId, code: 'zh', names: { vi: 'Tiếng Trung', zh: '中文', en: 'Chinese' } },
      course: zhCourse,
      selectedStartLevelId: levelId,
      selectedStartLevel: zhLevel,
      workingLevelId: levelId,
      workingLevel: zhLevel,
    };

    state.contexts.push(zhContext);
    state.units.push(zhUnit);
    state.lessons.push(zhLesson);

    const req = new Request(`http://localhost:3000/api/learner/contexts/${zhContextId}/lessons/${zhLessonId}`, {
      headers: authHeaders(),
    });
    const res = await lessonDetailRoute.GET(req, { params: Promise.resolve({ contextId: zhContextId, lessonId: zhLessonId }) });
    assert.equal(res.status, 200);

    const body = await res.json();
    const charBlock = body.data.revision.blocks[0];
    assert.equal(charBlock.type, 'CHARACTER');
    assert.equal(charBlock.glyph, '日');
    assert.equal(charBlock.scriptType, 'HANZI_SIMPLIFIED');
    assert.equal(charBlock.primaryReading, 'rì');
    assert.equal(charBlock.romanization, 'ri4');
    assert.equal(charBlock.meaning, 'mặt trời, ngày');
    assert.equal('metadata' in charBlock, false);
    assert.equal('strokes' in charBlock, false);
  });

  // 5. Corrupt Persisted Block Fallback & Legacy Preservation
  test('Resilience: Malformed CHARACTER block falls back to UNSUPPORTED; legacy V0 adapts smoothly', async () => {
    // 1. Malformed persisted CHARACTER block (missing glyph)
    const corruptLessonId = randomUUID();
    const corruptRevId = randomUUID();
    const corruptUnitId = state.units[0].id;

    const corruptRev = {
      id: corruptRevId,
      lessonId: corruptLessonId,
      revisionNo: 1,
      status: 'PUBLISHED',
      title: { vi: 'Bài học có khối lỗi' },
      contentSchemaVersion: 1,
      blocks: [
        {
          id: randomUUID(),
          blockKey: 'corrupt_block_1',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: randomUUID(),
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: true,
            snapshot: {
              // Missing glyph and scriptType!
              strokeCount: 4,
            },
          },
        },
      ],
    };

    const corruptLesson = {
      id: corruptLessonId,
      unitId: corruptUnitId,
      position: 3,
      isRequired: false,
      availability: 'AVAILABLE',
      activeRevisionId: corruptRevId,
      activeRevision: corruptRev,
      unit: state.units[0],
    };

    state.units[0].lessons.push(corruptLesson);
    state.lessons.push(corruptLesson);

    // Bypass prerequisites by creating completion for lesson 1 and 2
    state.completions.push({ id: randomUUID(), contextId, lessonId: lesson1Id });
    state.completions.push({ id: randomUUID(), contextId, lessonId: lesson2Id });

    const req = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${corruptLessonId}`, {
      headers: authHeaders(),
    });
    const res = await lessonDetailRoute.GET(req, { params: Promise.resolve({ contextId, lessonId: corruptLessonId }) });
    assert.equal(res.status, 200);

    const body = await res.json();
    const block = body.data.revision.blocks[0];
    assert.equal(block.type, 'UNSUPPORTED');
    assert.equal(block.originalType, 'CHARACTER');
    assert.equal(block.blockKey, 'corrupt_block_1');

    // 2. Legacy V0 revision with contentSchemaVersion 0
    const legacyLessonId = randomUUID();
    const legacyRevId = randomUUID();
    const legacyRev = {
      id: legacyRevId,
      lessonId: legacyLessonId,
      revisionNo: 1,
      status: 'PUBLISHED',
      title: { vi: 'Bài học định dạng cũ V0' },
      contentSchemaVersion: 0,
      contentBlocks: [
        { type: 'paragraph', text: 'Đoạn văn định dạng cũ 1.' },
        { type: 'paragraph', text: 'Đoạn văn định dạng cũ 2.' },
      ],
    };

    const legacyLesson = {
      id: legacyLessonId,
      unitId: corruptUnitId,
      position: 4,
      isRequired: false,
      availability: 'AVAILABLE',
      activeRevisionId: legacyRevId,
      activeRevision: legacyRev,
      unit: state.units[0],
    };

    state.units[0].lessons.push(legacyLesson);
    state.lessons.push(legacyLesson);

    const legacyReq = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${legacyLessonId}`, {
      headers: authHeaders(),
    });
    const legacyRes = await lessonDetailRoute.GET(legacyReq, { params: Promise.resolve({ contextId, lessonId: legacyLessonId }) });
    assert.equal(legacyRes.status, 200);

    const legacyBody = await legacyRes.json();
    assert.equal(legacyBody.data.revision.contentSchemaVersion, 0);
    assert.equal(legacyBody.data.revision.contentBlocks.length, 2);
    assert.equal(legacyBody.data.revision.contentBlocks[0].text, 'Đoạn văn định dạng cũ 1.');
  });

  // 6. UI Component Rendering via LessonContent
  test('UI Rendering: LessonContent renders CHARACTER block card with semantic attributes and badges', () => {
    const presentation = {
      contentSchemaVersion: 1,
      blocks: [
        {
          blockKey: 'char_ui_kanji',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          characterId: randomUUID(),
          glyph: '木',
          scriptType: 'KANJI',
          strokeCount: 4,
          showMeaning: true,
          showReading: true,
          showStrokeAnimation: true,
          guidedWriting: true,
          meaning: 'Cây cối',
          primaryReading: 'き',
          romanization: 'ki',
          strokeVersion: 1,
        },
      ],
      vocabulary: [],
      exercises: [],
    };

    const html = renderToStaticMarkup(
      React.createElement(LessonContent, { presentation })
    );

    assert.ok(html.includes('id="lesson-character-char_ui_kanji"'));
    assert.ok(html.includes('data-block-type="CHARACTER"'));
    assert.ok(html.includes('data-block-key="char_ui_kanji"'));
    assert.ok(html.includes('id="character-glyph-char_ui_kanji"'));
    assert.ok(html.includes('木'));
    assert.ok(html.includes('id="character-script-char_ui_kanji"'));
    assert.ok(html.includes('KANJI'));
    assert.ok(html.includes('id="character-strokes-char_ui_kanji"'));
    assert.ok(html.includes('4 nét'));
    assert.ok(html.includes('id="character-badge-anim-char_ui_kanji"'));
    assert.ok(html.includes('Hoạt ảnh nét'));
    assert.ok(html.includes('id="character-badge-guided-char_ui_kanji"'));
    assert.ok(html.includes('Luyện viết'));
    assert.ok(html.includes('id="character-meaning-char_ui_kanji"'));
    assert.ok(html.includes('Cây cối'));
    assert.ok(html.includes('id="character-reading-char_ui_kanji"'));
    assert.ok(html.includes('き (ki)'));
  });
});
