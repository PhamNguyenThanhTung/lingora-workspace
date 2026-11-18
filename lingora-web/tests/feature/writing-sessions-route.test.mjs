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

const sessionsRoute = await import('../../src/app/api/writing/sessions/route.ts');

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

describe('S6-06a: Start Writing Practice Session (POST /api/writing/sessions)', () => {
  let charJaSunId;
  let charJaTreeId;
  let charJaBookId;
  let charNoStrokeId;
  let jaLangId;
  let jaCourseId;
  let jaContextId;
  let jaUnitId;
  let publishedLessonId;
  let lockedLessonId;
  let rev1Id;
  let rev2Id;
  let vocabLinkNihonId;

  beforeEach(() => {
    setupEnv();

    charJaSunId = randomUUID();
    charJaTreeId = randomUUID();
    charJaBookId = randomUUID();
    charNoStrokeId = randomUUID();
    jaLangId = '11111111-2222-4333-8444-555555555555';
    jaCourseId = '22222222-3333-4444-8555-666666666666';
    jaContextId = contextId;
    const levelA1Id = '44444444-5555-4666-8777-888888888888';
    jaUnitId = '55555555-6666-4777-8888-999999999999';
    publishedLessonId = lesson1Id;
    lockedLessonId = lesson2Id;
    rev1Id = revision1Id;
    rev2Id = randomUUID();

    vocabLinkNihonId = randomUUID();
    const vocabConceptNihonId = randomUUID();

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
      framework: {
        id: '33333333-4444-4555-8666-777777777777',
        code: 'CEFR',
        version: '2020',
        names: { vi: 'CEFR' },
      },
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
            blockKey: 'block-char-sun-demo-only',
            type: 'CHARACTER',
            position: 2,
            orderIndex: 2,
            content: {
              characterId: charJaSunId,
              showMeaning: true,
              showReading: true,
              showStrokeAnimation: true,
              guidedWriting: false,
              snapshot: {
                characterId: charJaSunId,
                glyph: '日',
                scriptType: 'KANJI',
                meaning: 'Mặt trời, ngày',
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
            blockKey: 'block-char-no-stroke',
            type: 'CHARACTER',
            position: 3,
            orderIndex: 3,
            content: {
              characterId: charNoStrokeId,
              showMeaning: true,
              showReading: true,
              showStrokeAnimation: true,
              guidedWriting: true,
              snapshot: {
                characterId: charNoStrokeId,
                glyph: '山',
                scriptType: 'KANJI',
                strokeCount: 3,
                strokeVersion: 1,
              },
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
          id: charNoStrokeId,
          languageId: jaLangId,
          glyph: '山',
          scriptType: 'KANJI',
          meaning: 'Núi',
          strokeCount: 3,
        },
      ],
      strokeData: [
        {
          id: randomUUID(),
          characterId: charJaSunId,
          version: 1,
          provenance: 'KANJIVG_2026',
          strokes: [
            { index: 1, path: 'M20,20 L20,80' },
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
          characterId: charJaBookId,
          version: 1,
          provenance: 'KANJIVG_2026',
          strokes: [
            { index: 1, path: 'M15,40 L85,40' },
            { index: 2, path: 'M50,15 L50,90' },
            { index: 3, path: 'M50,40 L20,85' },
            { index: 4, path: 'M50,40 L80,85' },
            { index: 5, path: 'M30,70 L70,70' },
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
      ],
      vocabulary: [
        {
          id: vocabLinkNihonId,
          lessonRevisionId: rev1Id,
          vocabularyId: vocabConceptNihonId,
          position: 1,
          isCore: true,
          displaySnapshot: {
            canonicalForm: '日本',
            meaningLabels: { vi: 'Nước Nhật' },
            characters: [
              { characterId: charJaSunId, position: 1, glyph: '日', strokeVersion: 1 },
              { characterId: charJaBookId, position: 2, glyph: '本', strokeVersion: 1 },
            ],
          },
        },
      ],
      writingSessions: [],
      writingAttempts: [],
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

  function makePostRequest(body, options = {}) {
    const origin = options.origin || 'http://localhost:3000';
    const contentType = options.contentType !== undefined ? options.contentType : 'application/json';
    const requestBody = typeof body === 'string' ? body : {
      expectedPublishedRevisionId: rev1Id,
      ...body,
    };
    if (typeof requestBody !== 'string') {
      if (!requestBody.requestId && !requestBody.operationKey) requestBody.requestId = randomUUID();
    }
    const rawBody = typeof body === 'string' ? body : JSON.stringify(requestBody);
    const headers = {
      Host: 'localhost:3000',
      Origin: origin,
    };
    if (contentType) headers['Content-Type'] = contentType;

    return new Request('http://localhost:3000/api/writing/sessions', {
      method: 'POST',
      headers,
      body: rawBody,
    });
  }

  test('1. 201 Created: Start writing session with blockKey selector', async () => {
    const opKey = randomUUID();
    const req = makePostRequest({
      contextId: jaContextId,
      lessonId: publishedLessonId,
      characterId: charJaSunId,
      blockKey: 'block-char-sun',
      operationKey: opKey,
    });

    const res = await sessionsRoute.POST(req);
    assert.equal(res.status, 201);

    const body = await res.json();
    assert.ok(body.data);
    assert.ok(body.data.sessionId);
    assert.equal(body.data.characterId, charJaSunId);
    assert.equal(body.data.glyph, '日');
    assert.equal(body.data.strokeCount, 4);
    assert.equal(body.data.strokeVersion, 1);
    assert.equal(body.data.status, 'ACTIVE');
    assert.equal(body.data.isReplay, false);

    // Verify session persisted in DB
    assert.equal(state.writingSessions.length, 1);
    assert.equal(state.writingSessions[0].id, body.data.sessionId);
    assert.equal(state.writingSessions[0].operationKey, opKey);
  });

  test('1a. 201 Created: Documented requestId start resolves the character from its block', async () => {
    const requestId = randomUUID();
    const res = await sessionsRoute.POST(makePostRequest({
      contextId: jaContextId,
      lessonId: publishedLessonId,
      expectedPublishedRevisionId: rev1Id,
      blockKey: 'block-char-sun',
      requestId,
    }));

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.characterId, charJaSunId);
    assert.equal(state.writingSessions[0].operationKey, requestId);
  });

  test('2. 201 Created: Start writing session with lessonVocabularyLinkId selector', async () => {
    const req = makePostRequest({
      contextId: jaContextId,
      lessonId: publishedLessonId,
      characterId: charJaBookId,
      lessonVocabularyLinkId: vocabLinkNihonId,
    });

    const res = await sessionsRoute.POST(req);
    assert.equal(res.status, 201);

    const body = await res.json();
    assert.ok(body.data);
    assert.equal(body.data.characterId, charJaBookId);
    assert.equal(body.data.glyph, '本');
    assert.equal(body.data.strokeCount, 5);
    assert.equal(body.data.strokeVersion, 1);
  });

  test('3. 200 OK: Idempotent replay with same operationKey and identical payload', async () => {
    const opKey = randomUUID();
    const payload = {
      contextId: jaContextId,
      lessonId: publishedLessonId,
      characterId: charJaSunId,
      blockKey: 'block-char-sun',
      operationKey: opKey,
    };

    // First request -> 201 Created
    const res1 = await sessionsRoute.POST(makePostRequest(payload));
    assert.equal(res1.status, 201);
    const body1 = await res1.json();

    // Replay with identical payload and same operationKey -> 200 OK
    const res2 = await sessionsRoute.POST(makePostRequest(payload));
    assert.equal(res2.status, 200);
    const body2 = await res2.json();

    assert.equal(body2.data.sessionId, body1.data.sessionId);
    assert.equal(body2.data.isReplay, true);
    // Did not create duplicate session
    assert.equal(state.writingSessions.length, 1);
  });

  test('4. 409 Conflict: Same operationKey with different payload rejected', async () => {
    const opKey = randomUUID();
    const payload1 = {
      contextId: jaContextId,
      lessonId: publishedLessonId,
      characterId: charJaSunId,
      blockKey: 'block-char-sun',
      operationKey: opKey,
    };

    const res1 = await sessionsRoute.POST(makePostRequest(payload1));
    assert.equal(res1.status, 201);

    // Second request with same operationKey but different characterId
    const payload2 = {
      contextId: jaContextId,
      lessonId: publishedLessonId,
      characterId: charJaTreeId,
      blockKey: 'block-char-sun',
      operationKey: opKey,
    };

    const res2 = await sessionsRoute.POST(makePostRequest(payload2));
    assert.equal(res2.status, 409);
    const body2 = await res2.json();
    assert.equal(body2.error.code, 'OPERATION_CONFLICT');
  });

  test('5. 400 Bad Request: Missing both selectors or providing both', async () => {
    // Missing both
    const req1 = makePostRequest({
      contextId: jaContextId,
      lessonId: publishedLessonId,
      characterId: charJaSunId,
    });
    const res1 = await sessionsRoute.POST(req1);
    assert.equal(res1.status, 400);

    // Both provided
    const req2 = makePostRequest({
      contextId: jaContextId,
      lessonId: publishedLessonId,
      characterId: charJaSunId,
      blockKey: 'block-char-sun',
      lessonVocabularyLinkId: vocabLinkNihonId,
    });
    const res2 = await sessionsRoute.POST(req2);
    assert.equal(res2.status, 400);
  });

  test('6. 400 Bad Request: Extra fields rejected by strict schema', async () => {
    const req = makePostRequest({
      contextId: jaContextId,
      lessonId: publishedLessonId,
      characterId: charJaSunId,
      blockKey: 'block-char-sun',
      extraField: 'unexpected',
    });
    const res = await sessionsRoute.POST(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });

  test('6a. 413 Payload Too Large: Start request is bounded before JSON parsing', async () => {
    const req = makePostRequest(JSON.stringify({
      contextId: jaContextId,
      lessonId: publishedLessonId,
      characterId: charJaSunId,
      blockKey: 'block-char-sun',
      padding: 'x'.repeat(17 * 1024),
    }));

    const res = await sessionsRoute.POST(req);
    assert.equal(res.status, 413);
    const body = await res.json();
    assert.equal(body.error.code, 'PAYLOAD_TOO_LARGE');
    assert.equal(state.writingSessions.length, 0);
  });

  test('6b. 400 Bad Request: blockKey length is bounded and trimmed', async () => {
    const req = makePostRequest({
      contextId: jaContextId,
      lessonId: publishedLessonId,
      characterId: charJaSunId,
      blockKey: ` ${'x'.repeat(129)} `,
    });

    const res = await sessionsRoute.POST(req);
    assert.equal(res.status, 400);
    assert.equal(state.writingSessions.length, 0);
  });

  test('6c. 400 Bad Request: Start requires the published revision pin', async () => {
    const req = makePostRequest(JSON.stringify({
      contextId: jaContextId,
      lessonId: publishedLessonId,
      blockKey: 'block-char-sun',
      requestId: randomUUID(),
    }));
    const res = await sessionsRoute.POST(req);
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error.code, 'VALIDATION_ERROR');
  });

  test('7. 403 Forbidden: Foreign origin rejected', async () => {
    const req = makePostRequest(
      {
        contextId: jaContextId,
        lessonId: publishedLessonId,
        characterId: charJaSunId,
        blockKey: 'block-char-sun',
      },
      { origin: 'https://evil.attacker.com' }
    );
    const res = await sessionsRoute.POST(req);
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error.code, 'FORBIDDEN_ORIGIN');
  });

  test('8. 415 Unsupported Media Type: Non-JSON content type rejected', async () => {
    const req = makePostRequest('raw-text', { contentType: 'text/plain' });
    const res = await sessionsRoute.POST(req);
    assert.equal(res.status, 415);
    const body = await res.json();
    assert.equal(body.error.code, 'UNSUPPORTED_MEDIA_TYPE');
  });

  test('9. 400 Bad Request: Malformed JSON syntax rejected', async () => {
    const req = makePostRequest('{ invalid json ', { contentType: 'application/json' });
    const res = await sessionsRoute.POST(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'MALFORMED_JSON');
  });

  test('10. 401 Unauthorized: Unauthenticated request rejected', async () => {
    clearCookieStore();
    const req = makePostRequest({
      contextId: jaContextId,
      lessonId: publishedLessonId,
      characterId: charJaSunId,
      blockKey: 'block-char-sun',
    });
    const res = await sessionsRoute.POST(req);
    assert.equal(res.status, 401);
  });

  test('11. 409 Conflict: Lesson locked due to unfinished prerequisite', async () => {
    const req = makePostRequest({
      contextId: jaContextId,
      lessonId: lockedLessonId,
      characterId: charJaSunId,
      blockKey: 'block-char-sun',
    });
    const res = await sessionsRoute.POST(req);
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, 'LESSON_LOCKED');
  });

  test('12. 409 Conflict: Stale revision check with expectedPublishedRevisionId', async () => {
    const staleRevId = randomUUID();
    const req = makePostRequest({
      contextId: jaContextId,
      lessonId: publishedLessonId,
      characterId: charJaSunId,
      blockKey: 'block-char-sun',
      expectedPublishedRevisionId: staleRevId,
    });
    const res = await sessionsRoute.POST(req);
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, 'REVISION_STALE');
  });

  test('13. 409 Conflict: Static character block has guidedWriting and showStrokeAnimation false', async () => {
    const req = makePostRequest({
      contextId: jaContextId,
      lessonId: publishedLessonId,
      characterId: charJaTreeId,
      blockKey: 'block-char-tree-static',
    });
    const res = await sessionsRoute.POST(req);
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, 'CONTENT_INCONSISTENT');
  });

  test('13a. 409 Conflict: Animation-only blocks cannot start graded writing', async () => {
    const res = await sessionsRoute.POST(makePostRequest({
      contextId: jaContextId,
      lessonId: publishedLessonId,
      characterId: charJaSunId,
      blockKey: 'block-char-sun-demo-only',
      operationKey: randomUUID(),
    }));

    assert.equal(res.status, 409);
    assert.equal((await res.json()).error.code, 'CONTENT_INCONSISTENT');
    assert.equal(state.writingSessions.length, 0);
  });

  test('14. 409 Conflict: Character without stroke data cannot start writing session', async () => {
    const req = makePostRequest({
      contextId: jaContextId,
      lessonId: publishedLessonId,
      characterId: charNoStrokeId,
      blockKey: 'block-char-no-stroke',
    });
    const res = await sessionsRoute.POST(req);
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, 'CONTENT_INCONSISTENT');
  });

  test('15. Legacy vocabulary revision ignores mappings added after publication', async () => {
    const link = state.vocabulary.find((item) => item.id === vocabLinkNihonId);
    delete link.displaySnapshot.characters;
    state.vocabularyCharacters = [{
      id: randomUUID(),
      vocabularyId: link.vocabularyId,
      characterId: charJaSunId,
      position: 1,
    }];

    const res = await sessionsRoute.POST(makePostRequest({
      contextId: jaContextId,
      lessonId: publishedLessonId,
      characterId: charJaSunId,
      lessonVocabularyLinkId: vocabLinkNihonId,
      operationKey: randomUUID(),
    }));
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error.code, 'NOT_FOUND');
    assert.equal(state.writingSessions.length, 0);
  });

  test('16. 409 Conflict: Start replay key is scoped to its original selector', async () => {
    const operationKey = randomUUID();
    const first = await sessionsRoute.POST(makePostRequest({
      contextId: jaContextId,
      lessonId: publishedLessonId,
      characterId: charJaSunId,
      blockKey: 'block-char-sun',
      operationKey,
    }));
    assert.equal(first.status, 201);

    const replayWithDifferentSelector = await sessionsRoute.POST(makePostRequest({
      contextId: jaContextId,
      lessonId: publishedLessonId,
      characterId: charJaSunId,
      lessonVocabularyLinkId: vocabLinkNihonId,
      operationKey,
    }));
    assert.equal(replayWithDifferentSelector.status, 409);
    const body = await replayWithDifferentSelector.json();
    assert.equal(body.error.code, 'OPERATION_CONFLICT');
  });

  test('17. 404 Not Found: Start replay still authenticates the requested context', async () => {
    const operationKey = randomUUID();
    const first = await sessionsRoute.POST(makePostRequest({
      contextId: jaContextId,
      lessonId: publishedLessonId,
      characterId: charJaSunId,
      blockKey: 'block-char-sun',
      operationKey,
    }));
    assert.equal(first.status, 201);

    const replayFromForeignContext = await sessionsRoute.POST(makePostRequest({
      contextId: randomUUID(),
      lessonId: publishedLessonId,
      characterId: charJaSunId,
      blockKey: 'block-char-sun',
      operationKey,
    }));
    assert.equal(replayFromForeignContext.status, 404);
  });
});
