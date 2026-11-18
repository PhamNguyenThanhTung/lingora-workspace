import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import { getLearnerCookieName } from '../../src/server/auth/env.ts';
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

// Setup module mock for next/headers.js before importing route handler
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

const characterRoute = await import('../../src/app/api/characters/[characterId]/route.ts');

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

describe('S6-04b4: Learner Read Character Stroke Template (GET /api/characters/:characterId)', () => {
  let charJaSunId;
  let charJaTreeId;
  let charJaBookId;
  let charJaPersonId;
  let jaLangId;
  let jaCourseId;
  let jaContextId;
  let jaUnitId;
  let publishedLessonId;
  let lockedLessonId;
  let rev1Id;
  let rev2Id;
  let vocabLinkPinnedId;
  let vocabLinkDbId;
  let vocabLinkLegacyId;
  let vocabLinkOtherLessonId;

  beforeEach(() => {
    setupEnv();

    charJaSunId = randomUUID();
    charJaTreeId = randomUUID();
    charJaBookId = randomUUID();
    charJaPersonId = randomUUID();
    jaLangId = '11111111-2222-4333-8444-555555555555';
    jaCourseId = '22222222-3333-4444-8555-666666666666';
    jaContextId = contextId;
    const levelA1Id = '44444444-5555-4666-8777-888888888888';
    jaUnitId = '55555555-6666-4777-8888-999999999999';
    publishedLessonId = lesson1Id;
    lockedLessonId = lesson2Id;
    rev1Id = revision1Id;
    rev2Id = randomUUID();

    vocabLinkPinnedId = randomUUID();
    vocabLinkDbId = randomUUID();
    vocabLinkLegacyId = randomUUID();
    vocabLinkOtherLessonId = randomUUID();

    const vocabConceptNihonId = randomUUID();
    const vocabConceptPersonId = randomUUID();
    const vocabConceptLegacyId = randomUUID();

    const jaLevelA1 = {
      id: levelA1Id,
      frameworkId: '33333333-4444-4555-8666-777777777777',
      code: 'A1',
      label: { vi: 'A1 Sơ cấp' },
      position: 1,
    };

    const jaCourse = {
      id: jaCourseId,
      languageId: jaLangId,
      frameworkId: '33333333-4444-4555-8666-777777777777',
      code: 'JA-BEG',
      title: 'Japanese Beginner',
      names: { vi: 'Tiếng Nhật Sơ cấp', ja: '初級日本語' },
      isActive: true,
      defaultStartLevelId: levelA1Id,
      framework: { id: '33333333-4444-4555-8666-777777777777', code: 'CEFR', version: '2020', names: { vi: 'CEFR' } },
    };

    const jaUnit = {
      id: jaUnitId,
      courseId: jaCourseId,
      levelId: levelA1Id,
      position: 1,
      names: { vi: 'Bài 1: Chữ Hán cơ bản' },
      level: jaLevelA1,
    };

    const jaLesson1 = {
      id: publishedLessonId,
      unitId: jaUnitId,
      position: 1,
      isRequired: true,
      availability: 'AVAILABLE',
      activeRevisionId: rev1Id,
      slug: 'lesson-1-sun',
      title: { vi: 'Bài 1: Mặt trời', ja: '第1課：日', en: 'Lesson 1: Sun' },
      activeRevision: {
        id: rev1Id,
        lessonId: publishedLessonId,
        revisionNo: 1,
        status: 'PUBLISHED',
        title: { vi: 'Bài 1: Mặt trời', ja: '第1課：日', en: 'Lesson 1: Sun' },
        blocks: [
          {
            id: randomUUID(),
            blockKey: 'block-char-sun',
            type: 'CHARACTER',
            position: 1,
            orderIndex: 1,
            content: {
              characterId: charJaSunId,
              showMeaning: true,
              showReading: true,
              showStrokeAnimation: true,
              guidedWriting: true,
              snapshot: {
                characterId: charJaSunId,
                glyph: '日',
                scriptType: 'KANJI',
                meaning: 'Mặt trời, ngày',
                primaryReading: 'にち (nichi)',
                romanization: 'nichi',
                strokeCount: 4,
                strokeVersion: 1,
              },
            },
          },
          {
            id: randomUUID(),
            blockKey: 'block-char-tree-static',
            type: 'CHARACTER',
            position: 2,
            orderIndex: 2,
            content: {
              characterId: charJaTreeId,
              showMeaning: false,
              showReading: false,
              showStrokeAnimation: false,
              guidedWriting: false,
              snapshot: {
                characterId: charJaTreeId,
                glyph: '木',
                scriptType: 'KANJI',
                meaning: 'Cây',
                primaryReading: 'き (ki)',
                romanization: 'ki',
                strokeCount: 4,
                strokeVersion: 1,
              },
            },
          },
          {
            id: randomUUID(),
            blockKey: 'block-text-intro',
            type: 'TEXT',
            position: 3,
            orderIndex: 3,
            content: {
              text: 'Giới thiệu kanji cơ bản',
            },
          },
        ],
      },
      unit: jaUnit,
    };

    const jaLesson2 = {
      id: lockedLessonId,
      unitId: jaUnitId,
      position: 2,
      isRequired: true,
      availability: 'AVAILABLE',
      activeRevisionId: rev2Id,
      slug: 'lesson-2-moon',
      title: { vi: 'Bài 2: Mặt trăng', ja: '第2課：月', en: 'Lesson 2: Moon' },
      activeRevision: {
        id: rev2Id,
        lessonId: lockedLessonId,
        revisionNo: 1,
        status: 'PUBLISHED',
        title: { vi: 'Bài 2: Mặt trăng', ja: '第2課：月', en: 'Lesson 2: Moon' },
        blocks: [],
      },
      unit: jaUnit,
    };

    jaUnit.lessons = [jaLesson1, jaLesson2];

    const jaContext = {
      id: jaContextId,
      learnerId,
      languageId: jaLangId,
      courseId: jaCourseId,
      currentLevelId: levelA1Id,
      status: 'ACTIVE',
      course: jaCourse,
      language: { id: jaLangId, code: 'ja', names: { vi: 'Tiếng Nhật' } },
      workingLevelId: levelA1Id,
      workingLevel: jaLevelA1,
      selectedStartLevelId: levelA1Id,
      selectedStartLevel: jaLevelA1,
    };

    state = {
      account: {
        id: learnerId,
        role: 'LEARNER',
        status: 'ACTIVE',
        displayName: 'Learner Ja',
        uiLocale: 'vi',
        timezone: 'Asia/Tokyo',
      },
      languages: [
        { id: jaLangId, code: 'ja', name: 'Japanese', names: { vi: 'Tiếng Nhật' } },
      ],
      courses: [jaCourse],
      levels: [jaLevelA1],
      contexts: [jaContext],
      units: [jaUnit],
      lessons: [jaLesson1, jaLesson2],
      characters: [
        {
          id: charJaSunId,
          languageId: jaLangId,
          glyph: '日',
          scriptType: 'KANJI',
          meaning: 'Mặt trời, ngày',
          primaryReading: 'にち (nichi)',
          romanization: 'nichi',
          strokeCount: 4,
        },
        {
          id: charJaTreeId,
          languageId: jaLangId,
          glyph: '木',
          scriptType: 'KANJI',
          meaning: 'Cây',
          primaryReading: 'き (ki)',
          romanization: 'ki',
          strokeCount: 4,
        },
        {
          id: charJaBookId,
          languageId: jaLangId,
          glyph: '本',
          scriptType: 'KANJI',
          meaning: 'Sách, gốc',
          primaryReading: 'ほん (hon)',
          romanization: 'hon',
          strokeCount: 5,
        },
        {
          id: charJaPersonId,
          languageId: jaLangId,
          glyph: '人',
          scriptType: 'KANJI',
          meaning: 'Người',
          primaryReading: 'ひと (hito)',
          romanization: 'hito',
          strokeCount: 2,
        },
      ],
      strokeData: [
        {
          id: randomUUID(),
          characterId: charJaSunId,
          version: 1,
          provenance: 'KANJIVG_2026',
          strokes: [
            { index: 1, path: 'M0.2,0.2 L0.2,0.8', points: [[0.2, 0.2], [0.2, 0.8]] },
            { index: 2, path: 'M20,20 L80,20 L80,80' },
            { index: 3, path: 'M20,50 L80,50' },
            { index: 4, path: 'M20,80 L80,80' },
          ],
        },
        {
          id: randomUUID(),
          characterId: charJaTreeId,
          version: 1,
          provenance: 'KANJIVG_2026',
          strokes: [
            { index: 1, path: 'M15,40 L85,40' },
            { index: 2, path: 'M50,15 L50,90' },
            { index: 3, path: 'M50,40 L20,85' },
            { index: 4, path: 'M50,40 L80,85' },
          ],
        },
        {
          id: randomUUID(),
          characterId: charJaPersonId,
          version: 1,
          provenance: 'KANJIVG_2026',
          strokes: [
            { index: 1, path: 'M50,20 L20,80' },
            { index: 2, path: 'M40,40 L80,80' },
          ],
        },
      ],
      vocabularyConcepts: [
        {
          id: vocabConceptNihonId,
          languageId: jaLangId,
          canonicalForm: '日本',
          senseKey: 'japan',
          meaningLabels: { vi: 'Nước Nhật' },
        },
        {
          id: vocabConceptPersonId,
          languageId: jaLangId,
          canonicalForm: '人人',
          senseKey: 'people',
          meaningLabels: { vi: 'Mọi người' },
        },
        {
          id: vocabConceptLegacyId,
          languageId: jaLangId,
          canonicalForm: 'こんにちは',
          senseKey: 'hello',
          meaningLabels: { vi: 'Xin chào' },
        },
      ],
      vocabulary: [
        {
          id: vocabLinkPinnedId,
          lessonRevisionId: rev1Id,
          vocabularyId: vocabConceptNihonId,
          position: 1,
          isCore: true,
          displaySnapshot: {
            canonicalForm: '日本',
            senseKey: 'japan',
            meaningLabels: { vi: 'Nước Nhật' },
            characters: [
              {
                characterId: charJaSunId, position: 1, glyph: '日', scriptType: 'KANJI',
                meaning: 'Mặt trời, ngày', primaryReading: 'にち (nichi)', romanization: 'nichi',
                strokeCount: 4, strokeVersion: 1,
              },
              {
                characterId: charJaBookId, position: 2, glyph: '本', scriptType: 'KANJI',
                meaning: 'Sách, gốc', primaryReading: 'ほん (hon)', romanization: 'hon',
                strokeCount: 5, strokeVersion: 1,
              },
            ],
          },
        },
        {
          id: vocabLinkDbId,
          lessonRevisionId: rev1Id,
          vocabularyId: vocabConceptPersonId,
          position: 2,
          isCore: true,
          displaySnapshot: {
            canonicalForm: '人人',
            senseKey: 'people',
            meaningLabels: { vi: 'Mọi người' },
            characters: [1, 2].map((position) => ({
              characterId: charJaPersonId,
              position,
              glyph: '人',
              scriptType: 'KANJI',
              meaning: 'Người',
              primaryReading: 'ひと (hito)',
              romanization: 'hito',
              strokeCount: 2,
              strokeVersion: 1,
            })),
          },
        },
        {
          id: vocabLinkLegacyId,
          lessonRevisionId: rev1Id,
          vocabularyId: vocabConceptLegacyId,
          position: 3,
          isCore: true,
          displaySnapshot: {
            canonicalForm: 'こんにちは',
            senseKey: 'hello',
            meaningLabels: { vi: 'Xin chào' },
          },
        },
        {
          id: vocabLinkOtherLessonId,
          lessonRevisionId: rev2Id,
          vocabularyId: vocabConceptNihonId,
          position: 1,
          isCore: true,
          displaySnapshot: {
            canonicalForm: '日本',
            meaningLabels: { vi: 'Nước Nhật' },
          },
        },
      ],
      vocabularyCharacters: [
        {
          id: randomUUID(),
          vocabularyId: vocabConceptPersonId,
          characterId: charJaPersonId,
          position: 1,
        },
        {
          id: randomUUID(),
          vocabularyId: vocabConceptPersonId,
          characterId: charJaPersonId,
          position: 2,
        },
      ],
      completions: [],
      consumptions: [],
      exercises: [],
    };

    setLearnerPrismaForTest(fixtureDb(state));
    globalThis.fetch = providerDouble(state);
    setAuthenticatedCookie();
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    setLearnerPrismaForTest(null);
    clearCookieStore();
  });

  test('1. 200 OK: Returns character detail with stroke template when showStrokeAnimation and guidedWriting are true', async () => {
    const url = `http://localhost:3000/api/characters/${charJaSunId}?contextId=${jaContextId}&lessonId=${publishedLessonId}&blockKey=block-char-sun`;
    const req = new Request(url, { method: 'GET' });

    const res = await characterRoute.GET(req, { params: Promise.resolve({ characterId: charJaSunId }) });
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.ok(body.data);
    assert.equal(body.data.characterId, charJaSunId);
    assert.equal(body.data.glyph, '日');
    assert.equal(body.data.scriptType, 'KANJI');
    assert.equal(body.data.strokeCount, 4);
    assert.equal(body.data.showMeaning, true);
    assert.equal(body.data.showReading, true);
    assert.equal(body.data.showStrokeAnimation, true);
    assert.equal(body.data.guidedWriting, true);
    assert.equal(body.data.meaning, 'Mặt trời, ngày');
    assert.equal(body.data.primaryReading, 'にち (nichi)');
    assert.equal(body.data.romanization, 'nichi');
    assert.equal(body.data.strokeVersion, 1);
    assert.ok(Array.isArray(body.data.strokes));
    assert.equal(body.data.strokes.length, 4);
    assert.equal(body.data.strokes[0].index, 1);
    assert.equal(body.data.strokes[0].path, 'M0.2,0.2 L0.2,0.8');
    assert.deepEqual(body.data.strokes[0].points, [[0.2, 0.2], [0.2, 0.8]]);
  });

  test('2. 200 OK: Static display omits stroke paths and hides unflagged fields', async () => {
    const url = `http://localhost:3000/api/characters/${charJaTreeId}?contextId=${jaContextId}&lessonId=${publishedLessonId}&blockKey=block-char-tree-static`;
    const req = new Request(url, { method: 'GET' });

    const res = await characterRoute.GET(req, { params: Promise.resolve({ characterId: charJaTreeId }) });
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.ok(body.data);
    assert.equal(body.data.characterId, charJaTreeId);
    assert.equal(body.data.glyph, '木');
    assert.equal(body.data.showMeaning, false);
    assert.equal(body.data.showReading, false);
    assert.equal(body.data.showStrokeAnimation, false);
    assert.equal(body.data.guidedWriting, false);
    // Fields must be omitted because flags are false
    assert.equal(body.data.meaning, undefined);
    assert.equal(body.data.primaryReading, undefined);
    assert.equal(body.data.romanization, undefined);
    // Strokes and strokeVersion must be omitted because both animation and guidedWriting are false
    assert.equal(body.data.strokes, undefined);
    assert.equal(body.data.strokeVersion, undefined);
  });

  test('3. 400 Bad Request: Missing both selectors or providing both selectors', async () => {
    // Missing both selectors
    const url1 = `http://localhost:3000/api/characters/${charJaSunId}?contextId=${jaContextId}&lessonId=${publishedLessonId}`;
    const res1 = await characterRoute.GET(new Request(url1), { params: Promise.resolve({ characterId: charJaSunId }) });
    assert.equal(res1.status, 400);
    const body1 = await res1.json();
    assert.equal(body1.error.code, 'VALIDATION_ERROR');

    // Both selectors
    const fakeVocabLinkId = randomUUID();
    const url2 = `http://localhost:3000/api/characters/${charJaSunId}?contextId=${jaContextId}&lessonId=${publishedLessonId}&blockKey=block-char-sun&lessonVocabularyLinkId=${fakeVocabLinkId}`;
    const res2 = await characterRoute.GET(new Request(url2), { params: Promise.resolve({ characterId: charJaSunId }) });
    assert.equal(res2.status, 400);
    const body2 = await res2.json();
    assert.equal(body2.error.code, 'VALIDATION_ERROR');
  });

  test('4. 400 Bad Request: Unknown query parameter rejected', async () => {
    const url = `http://localhost:3000/api/characters/${charJaSunId}?contextId=${jaContextId}&lessonId=${publishedLessonId}&blockKey=block-char-sun&unsupportedParam=true`;
    const res = await characterRoute.GET(new Request(url), { params: Promise.resolve({ characterId: charJaSunId }) });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'INVALID_QUERY_PARAMETERS');
  });

  test('5. 400 Bad Request: Invalid UUID format', async () => {
    const url = `http://localhost:3000/api/characters/invalid-uuid?contextId=${jaContextId}&lessonId=${publishedLessonId}&blockKey=block-char-sun`;
    const res = await characterRoute.GET(new Request(url), { params: Promise.resolve({ characterId: 'invalid-uuid' }) });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });

  test('6. 401 Unauthorized: Unauthenticated request rejected', async () => {
    clearCookieStore();
    const url = `http://localhost:3000/api/characters/${charJaSunId}?contextId=${jaContextId}&lessonId=${publishedLessonId}&blockKey=block-char-sun`;
    const res = await characterRoute.GET(new Request(url), { params: Promise.resolve({ characterId: charJaSunId }) });
    assert.equal(res.status, 401);
  });

  test('7. 404 Not Found: Learner context does not belong to user or does not exist', async () => {
    const otherContextId = randomUUID();
    const url = `http://localhost:3000/api/characters/${charJaSunId}?contextId=${otherContextId}&lessonId=${publishedLessonId}&blockKey=block-char-sun`;
    const res = await characterRoute.GET(new Request(url), { params: Promise.resolve({ characterId: charJaSunId }) });
    assert.equal(res.status, 404);
  });

  test('8. 409 Conflict: Lesson locked due to unfinished prerequisite', async () => {
    // Lesson 2 is orderIndex 2, lesson 1 is not completed
    const url = `http://localhost:3000/api/characters/${charJaSunId}?contextId=${jaContextId}&lessonId=${lockedLessonId}&blockKey=block-char-sun`;
    const res = await characterRoute.GET(new Request(url), { params: Promise.resolve({ characterId: charJaSunId }) });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, 'LESSON_LOCKED');
  });

  test('9. 404 Not Found: blockKey does not exist or does not match characterId or wrong block type', async () => {
    // Non-existent blockKey
    const url1 = `http://localhost:3000/api/characters/${charJaSunId}?contextId=${jaContextId}&lessonId=${publishedLessonId}&blockKey=non-existent-block`;
    const res1 = await characterRoute.GET(new Request(url1), { params: Promise.resolve({ characterId: charJaSunId }) });
    assert.equal(res1.status, 404);

    // Mismatched characterId
    const otherCharId = randomUUID();
    const url2 = `http://localhost:3000/api/characters/${otherCharId}?contextId=${jaContextId}&lessonId=${publishedLessonId}&blockKey=block-char-sun`;
    const res2 = await characterRoute.GET(new Request(url2), { params: Promise.resolve({ characterId: otherCharId }) });
    assert.equal(res2.status, 404);

    // Block is TEXT, not CHARACTER
    const url3 = `http://localhost:3000/api/characters/${charJaSunId}?contextId=${jaContextId}&lessonId=${publishedLessonId}&blockKey=block-text-intro`;
    const res3 = await characterRoute.GET(new Request(url3), { params: Promise.resolve({ characterId: charJaSunId }) });
    assert.equal(res3.status, 404);
  });

  test('10. 409 Conflict: expectedPublishedRevisionId mismatch (stale revision)', async () => {
    const staleRevisionId = randomUUID();
    const url = `http://localhost:3000/api/characters/${charJaSunId}?contextId=${jaContextId}&lessonId=${publishedLessonId}&blockKey=block-char-sun&expectedPublishedRevisionId=${staleRevisionId}`;
    const res = await characterRoute.GET(new Request(url), { params: Promise.resolve({ characterId: charJaSunId }) });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, 'REVISION_STALE');

    // Matching expectedPublishedRevisionId succeeds
    const matchingUrl = `http://localhost:3000/api/characters/${charJaSunId}?contextId=${jaContextId}&lessonId=${publishedLessonId}&blockKey=block-char-sun&expectedPublishedRevisionId=${rev1Id}`;
    const resMatch = await characterRoute.GET(new Request(matchingUrl), { params: Promise.resolve({ characterId: charJaSunId }) });
    assert.equal(resMatch.status, 200);
  });

  test('11. Course language boundary: Stroke data for another language is not delivered', async () => {
    // Modify character's language in db to Chinese
    const zhLangId = randomUUID();
    const sunChar = state.characters.find(c => c.id === charJaSunId);
    sunChar.languageId = zhLangId;

    const url = `http://localhost:3000/api/characters/${charJaSunId}?contextId=${jaContextId}&lessonId=${publishedLessonId}&blockKey=block-char-sun`;
    const res = await characterRoute.GET(new Request(url), { params: Promise.resolve({ characterId: charJaSunId }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    // Character details still returned from snapshot, but strokes cannot be loaded across language boundaries
    assert.equal(body.data.characterId, charJaSunId);
    assert.equal(body.data.strokes, undefined);
  });

  test('12. S6-04b5: 200 OK: Read character via lessonVocabularyLinkId pinned in displaySnapshot', async () => {
    const url = `http://localhost:3000/api/characters/${charJaSunId}?contextId=${jaContextId}&lessonId=${publishedLessonId}&lessonVocabularyLinkId=${vocabLinkPinnedId}`;
    const res = await characterRoute.GET(new Request(url), { params: Promise.resolve({ characterId: charJaSunId }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.characterId, charJaSunId);
    assert.equal(body.data.glyph, '日');
    assert.equal(body.data.meaning, 'Mặt trời, ngày');
    assert.equal(body.data.strokeCount, 4);
    assert.equal(body.data.strokeVersion, 1);
    assert.ok(Array.isArray(body.data.strokes));
    assert.equal(body.data.strokes.length, 4);
  });

  test('13. S6-04b5: 200 OK: Read second character of multi-character word (本 in 日本)', async () => {
    const url = `http://localhost:3000/api/characters/${charJaBookId}?contextId=${jaContextId}&lessonId=${publishedLessonId}&lessonVocabularyLinkId=${vocabLinkPinnedId}`;
    const res = await characterRoute.GET(new Request(url), { params: Promise.resolve({ characterId: charJaBookId }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.characterId, charJaBookId);
    assert.equal(body.data.glyph, '本');
    assert.equal(body.data.meaning, 'Sách, gốc');
    assert.equal(body.data.strokeCount, 5);
  });

  test('14. S6-04b5: 200 OK: Read repeated character from the revision snapshot (人人)', async () => {
    const url = `http://localhost:3000/api/characters/${charJaPersonId}?contextId=${jaContextId}&lessonId=${publishedLessonId}&lessonVocabularyLinkId=${vocabLinkDbId}`;
    const res = await characterRoute.GET(new Request(url), { params: Promise.resolve({ characterId: charJaPersonId }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.characterId, charJaPersonId);
    assert.equal(body.data.glyph, '人');
    assert.equal(body.data.meaning, 'Người');
    assert.equal(body.data.strokeCount, 2);
    assert.ok(Array.isArray(body.data.strokes));
    assert.equal(body.data.strokes.length, 2);
  });

  test('15. S6-04b5: Pinned mapping immunity to catalogue change after publication', async () => {
    // Modify the DB character's glyph and meaning after publication
    const bookChar = state.characters.find(c => c.id === charJaBookId);
    bookChar.glyph = '本-MODIFIED';
    bookChar.meaning = 'Nghĩa mới sau khi xuất bản';

    // Pinned link still returns valid character lookup matching the pinned characterId
    const url = `http://localhost:3000/api/characters/${charJaBookId}?contextId=${jaContextId}&lessonId=${publishedLessonId}&lessonVocabularyLinkId=${vocabLinkPinnedId}`;
    const res = await characterRoute.GET(new Request(url), { params: Promise.resolve({ characterId: charJaBookId }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.characterId, charJaBookId);
    assert.equal(body.data.glyph, '本');
    assert.equal(body.data.meaning, 'Sách, gốc');
  });

  test('16. S6-04b5: 404 Not Found: Legacy vocabulary without character mappings', async () => {
    const url = `http://localhost:3000/api/characters/${charJaSunId}?contextId=${jaContextId}&lessonId=${publishedLessonId}&lessonVocabularyLinkId=${vocabLinkLegacyId}`;
    const res = await characterRoute.GET(new Request(url), { params: Promise.resolve({ characterId: charJaSunId }) });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error.code, 'NOT_FOUND');
    assert.equal(body.error.message, 'Ký tự không thuộc liên kết từ vựng này.');

    state.vocabularyCharacters.push({
      id: randomUUID(),
      vocabularyId: state.vocabulary.find((link) => link.id === vocabLinkLegacyId).vocabularyId,
      characterId: charJaSunId,
      position: 1,
    });
    const afterCatalogueMapping = await characterRoute.GET(new Request(url), {
      params: Promise.resolve({ characterId: charJaSunId }),
    });
    assert.equal(afterCatalogueMapping.status, 404, 'A new catalogue mapping must not change an older revision');
  });

  test('17. S6-04b5: 404 Not Found: CharacterId does not belong to vocabulary item', async () => {
    // Requesting character '木' (tree) on vocabulary '日本' (Japan)
    const url = `http://localhost:3000/api/characters/${charJaTreeId}?contextId=${jaContextId}&lessonId=${publishedLessonId}&lessonVocabularyLinkId=${vocabLinkPinnedId}`;
    const res = await characterRoute.GET(new Request(url), { params: Promise.resolve({ characterId: charJaTreeId }) });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error.code, 'NOT_FOUND');
    assert.equal(body.error.message, 'Ký tự không thuộc liên kết từ vựng này.');
  });

  test('18. S6-04b5: 404 Not Found: Vocabulary link does not belong to this lesson', async () => {
    // vocabLinkOtherLessonId belongs to lesson 2, not publishedLessonId (lesson 1)
    const url = `http://localhost:3000/api/characters/${charJaSunId}?contextId=${jaContextId}&lessonId=${publishedLessonId}&lessonVocabularyLinkId=${vocabLinkOtherLessonId}`;
    const res = await characterRoute.GET(new Request(url), { params: Promise.resolve({ characterId: charJaSunId }) });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error.code, 'NOT_FOUND');
    assert.equal(body.error.message, 'Liên kết từ vựng không tồn tại trong bài học.');
  });
});
