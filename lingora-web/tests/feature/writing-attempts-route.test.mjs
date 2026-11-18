import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import { getLearnerCookieName } from '../../src/server/auth/env.ts';
import {
  learnerId,
  contextId,
  lesson1Id,
  revision1Id,
  setupEnv,
  fixtureDb,
  providerDouble,
  token,
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

const attemptsRoute = await import(
  '../../src/app/api/writing/sessions/[sessionId]/attempts/route.ts'
);
const characterAttemptsRoute = await import(
  '../../src/app/api/writing/sessions/[sessionId]/characters/[characterId]/attempts/route.ts'
);
const completeRoute = await import(
  '../../src/app/api/writing/sessions/[sessionId]/complete/route.ts'
);

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

describe('S6-06b: Submit Writing Attempt and Complete Session', () => {
  let charJaSunId;
  let activeSessionId;
  let completedSessionId;

  // Japanese character 日 template strokes (4 strokes in [0, 1] coordinate system)
  const sunTemplateStrokes = [
    {
      index: 1,
      path: 'M0.2,0.2 L0.2,0.8',
      points: [
        [0.2, 0.2],
        [0.2, 0.5],
        [0.2, 0.8],
      ],
    },
    {
      index: 2,
      path: 'M0.2,0.2 L0.8,0.2 L0.8,0.8',
      points: [
        [0.2, 0.2],
        [0.5, 0.2],
        [0.8, 0.2],
        [0.8, 0.5],
        [0.8, 0.8],
      ],
    },
    {
      index: 3,
      path: 'M0.2,0.5 L0.8,0.5',
      points: [
        [0.2, 0.5],
        [0.5, 0.5],
        [0.8, 0.5],
      ],
    },
    {
      index: 4,
      path: 'M0.2,0.8 L0.8,0.8',
      points: [
        [0.2, 0.8],
        [0.5, 0.8],
        [0.8, 0.8],
      ],
    },
  ];

  beforeEach(() => {
    setupEnv();

    charJaSunId = randomUUID();
    activeSessionId = randomUUID();
    completedSessionId = randomUUID();

    const jaLangId = '11111111-2222-4333-8444-555555555555';
    const jaCourseId = '22222222-3333-4444-8555-666666666666';
    const levelA1Id = '44444444-5555-4666-8777-888888888888';
    const jaUnitId = '55555555-6666-4777-8888-999999999999';
    const jaLevel = {
      id: levelA1Id,
      frameworkId: '33333333-4444-4555-8666-777777777777',
      code: 'A1',
      label: { vi: 'A1' },
      position: 1,
    };
    const jaCourse = {
      id: jaCourseId,
      languageId: jaLangId,
      frameworkId: jaLevel.frameworkId,
      isActive: true,
      framework: { id: jaLevel.frameworkId, code: 'CEFR', version: '2020' },
    };
    const jaUnit = {
      id: jaUnitId,
      courseId: jaCourseId,
      levelId: levelA1Id,
      position: 1,
      level: jaLevel,
    };
    const lesson = {
      id: lesson1Id,
      unitId: jaUnitId,
      position: 1,
      isRequired: true,
      availability: 'AVAILABLE',
      activeRevisionId: revision1Id,
      activeRevision: {
        id: revision1Id,
        lessonId: lesson1Id,
        revisionNo: 1,
        status: 'PUBLISHED',
        blocks: [{
          blockKey: 'block-char-sun',
          type: 'CHARACTER',
          content: {
            characterId: charJaSunId,
            showStrokeAnimation: true,
            guidedWriting: true,
            snapshot: { glyph: '日', strokeCount: 4, strokeVersion: 1 },
          },
        }],
      },
      unit: jaUnit,
    };
    jaUnit.lessons = [lesson];

    state = {
      account: {
        id: learnerId,
        role: 'LEARNER',
        status: 'ACTIVE',
        displayName: 'Learner Ja',
        uiLocale: 'vi',
        timezone: 'Asia/Tokyo',
      },
      languages: [{ id: jaLangId, code: 'ja', name: 'Japanese', names: { vi: 'Tiếng Nhật' } }],
      courses: [
        jaCourse,
      ],
      levels: [jaLevel],
      contexts: [{
        id: contextId,
        learnerId,
        languageId: jaLangId,
        courseId: jaCourseId,
        status: 'ACTIVE',
        course: jaCourse,
        language: { id: jaLangId, code: 'ja', names: { vi: 'Tiếng Nhật' } },
        workingLevelId: levelA1Id,
        workingLevel: jaLevel,
      }],
      units: [jaUnit],
      lessons: [lesson],
      characters: [
        {
          id: charJaSunId,
          languageId: jaLangId,
          glyph: '日',
          scriptType: 'KANJI',
          strokeCount: 4,
        },
      ],
      strokeData: [
        {
          id: randomUUID(),
          characterId: charJaSunId,
          version: 1,
          provenance: 'KANJIVG_2026',
          strokes: sunTemplateStrokes,
        },
      ],
      writingSessions: [
        {
          id: activeSessionId,
          learnerId,
          contextId,
          lessonId: lesson1Id,
          lessonRevisionId: revision1Id,
          characterId: charJaSunId,
          sourceKey: 'block:block-char-sun',
          strokeVersion: 1,
          status: 'ACTIVE',
          rowVersion: 1n,
          startedAt: new Date(),
        },
        {
          id: completedSessionId,
          learnerId,
          contextId,
          lessonId: lesson1Id,
          lessonRevisionId: revision1Id,
          characterId: charJaSunId,
          sourceKey: 'block:block-char-sun',
          strokeVersion: 1,
          status: 'COMPLETED',
          completedAt: new Date(),
          rowVersion: 2n,
          startedAt: new Date(),
        },
      ],
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

  function makePostRequest(url, body, options = {}) {
    const origin = options.origin || 'http://localhost:3000';
    const contentType = options.contentType !== undefined ? options.contentType : 'application/json';
    const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
    const headers = {
      Host: 'localhost:3000',
      Origin: origin,
    };
    if (contentType) headers['Content-Type'] = contentType;

    return new Request(url, {
      method: 'POST',
      headers,
      body: rawBody,
    });
  }

  test('1. 201 Created: Submit valid candidate strokes evaluates via grader and generates receipt', async () => {
    const opKey = randomUUID();
    const candidateStrokes = [
      { points: [[0.2, 0.2], [0.2, 0.8]] },
      { points: [[0.2, 0.2], [0.8, 0.2], [0.8, 0.8]] },
      { points: [[0.2, 0.5], [0.8, 0.5]] },
      { points: [[0.2, 0.8], [0.8, 0.8]] },
    ];

    const url = `http://localhost:3000/api/writing/sessions/${activeSessionId}/attempts`;
    const req = makePostRequest(url, {
      operationKey: opKey,
      candidateStrokes,
    });

    const res = await attemptsRoute.POST(req, {
      params: Promise.resolve({ sessionId: activeSessionId }),
    });
    assert.equal(res.status, 201);

    const body = await res.json();
    assert.ok(body.data);
    assert.ok(body.data.attemptId);
    assert.equal(body.data.sessionId, activeSessionId);
    assert.equal(body.data.characterId, charJaSunId);
    assert.equal(body.data.operationKey, opKey);
    assert.equal(body.data.strokeCount, 4);
    assert.equal(typeof body.data.score, 'number');
    assert.ok(body.data.score >= 75);
    assert.equal(body.data.band, 'EXCELLENT');
    assert.equal(body.data.passed, true);
    assert.deepEqual(body.data.details.strokeCount, { expected: 4, actual: 4, diff: 0 });
    assert.equal(body.data.details.strokeFeedback.length, 4);
    assert.equal('shapeScore' in body.data.details, false);
    assert.equal('directionScore' in body.data.details, false);
    assert.equal(body.data.isReplay, false);

    // Verify stored in DB
    assert.equal(state.writingAttempts.length, 1);
    assert.equal(state.writingAttempts[0].id, body.data.attemptId);
  });

  test('2. 200 OK: Idempotent replay of attempt with identical operationKey and strokes', async () => {
    const opKey = randomUUID();
    const candidateStrokes = [
      { points: [[0.2, 0.2], [0.2, 0.8]] },
      { points: [[0.2, 0.2], [0.8, 0.2], [0.8, 0.8]] },
      { points: [[0.2, 0.5], [0.8, 0.5]] },
      { points: [[0.2, 0.8], [0.8, 0.8]] },
    ];

    const url = `http://localhost:3000/api/writing/sessions/${activeSessionId}/attempts`;
    const payload = { operationKey: opKey, candidateStrokes };

    // First request
    const res1 = await attemptsRoute.POST(makePostRequest(url, payload), {
      params: Promise.resolve({ sessionId: activeSessionId }),
    });
    assert.equal(res1.status, 201);
    const body1 = await res1.json();

    // Replay request
    const res2 = await attemptsRoute.POST(makePostRequest(url, payload), {
      params: Promise.resolve({ sessionId: activeSessionId }),
    });
    assert.equal(res2.status, 200);
    const body2 = await res2.json();

    assert.equal(body2.data.attemptId, body1.data.attemptId);
    assert.equal(body2.data.isReplay, true);
    assert.equal(state.writingAttempts.length, 1);
  });

  test('3. 409 Conflict: Same operationKey with different strokes rejected with OPERATION_CONFLICT', async () => {
    const opKey = randomUUID();
    const strokes1 = [
      { points: [[0.2, 0.2], [0.2, 0.8]] },
    ];
    const strokes2 = [
      { points: [[0.5, 0.2], [0.5, 0.8]] },
    ];

    const url = `http://localhost:3000/api/writing/sessions/${activeSessionId}/attempts`;

    const res1 = await attemptsRoute.POST(makePostRequest(url, { operationKey: opKey, candidateStrokes: strokes1 }), {
      params: Promise.resolve({ sessionId: activeSessionId }),
    });
    assert.equal(res1.status, 201);

    const res2 = await attemptsRoute.POST(makePostRequest(url, { operationKey: opKey, candidateStrokes: strokes2 }), {
      params: Promise.resolve({ sessionId: activeSessionId }),
    });
    assert.equal(res2.status, 409);
    const body2 = await res2.json();
    assert.equal(body2.error.code, 'OPERATION_CONFLICT');
  });

  test('4. 400 Bad Request: Missing or invalid strokes structure', async () => {
    const url = `http://localhost:3000/api/writing/sessions/${activeSessionId}/attempts`;

    // Empty strokes
    const res1 = await attemptsRoute.POST(makePostRequest(url, { operationKey: randomUUID(), candidateStrokes: [] }), {
      params: Promise.resolve({ sessionId: activeSessionId }),
    });
    assert.equal(res1.status, 400);

    // Single point stroke (less than 2 points)
    const res2 = await attemptsRoute.POST(makePostRequest(url, {
      operationKey: randomUUID(),
      candidateStrokes: [{ points: [[0.1, 0.1]] }],
    }), {
      params: Promise.resolve({ sessionId: activeSessionId }),
    });
    assert.equal(res2.status, 400);
  });

  test('4a. 400 Bad Request: Coordinates outside the normalized drawing area are rejected', async () => {
    const url = `http://localhost:3000/api/writing/sessions/${activeSessionId}/attempts`;
    const res = await attemptsRoute.POST(makePostRequest(url, {
      operationKey: randomUUID(),
      candidateStrokes: [{ points: [[1.01, 0.5], [0.8, 0.5]] }],
    }), { params: Promise.resolve({ sessionId: activeSessionId }) });
    assert.equal(res.status, 400);
  });

  test('4b. 400 Bad Request: Per-stroke and total point limits are enforced', async () => {
    const url = `http://localhost:3000/api/writing/sessions/${activeSessionId}/attempts`;
    const tooManyInStroke = await attemptsRoute.POST(makePostRequest(url, {
      operationKey: randomUUID(),
      candidateStrokes: [{ points: Array.from({ length: 257 }, (_, i) => [i / 256, 0.5]) }],
    }), { params: Promise.resolve({ sessionId: activeSessionId }) });
    assert.equal(tooManyInStroke.status, 400);

    const tooManyTotal = await attemptsRoute.POST(makePostRequest(url, {
      operationKey: randomUUID(),
      candidateStrokes: Array.from({ length: 17 }, () => ({
        points: Array.from({ length: 241 }, () => [0.5, 0.5]),
      })),
    }), { params: Promise.resolve({ sessionId: activeSessionId }) });
    assert.equal(tooManyTotal.status, 400);
  });

  test('4c. 413 Payload Too Large: Request body is capped at 256 KiB', async () => {
    const url = `http://localhost:3000/api/writing/sessions/${activeSessionId}/attempts`;
    const res = await attemptsRoute.POST(makePostRequest(url, `{"padding":"${'x'.repeat(270 * 1024)}"}`), {
      params: Promise.resolve({ sessionId: activeSessionId }),
    });
    assert.equal(res.status, 413);
  });

  test('5. 404 Not Found: Session does not exist or not owned', async () => {
    const fakeSessionId = randomUUID();
    const url = `http://localhost:3000/api/writing/sessions/${fakeSessionId}/attempts`;
    const res = await attemptsRoute.POST(makePostRequest(url, {
      operationKey: randomUUID(),
      candidateStrokes: [{ points: [[0.1, 0.1], [0.2, 0.2]] }],
    }), {
      params: Promise.resolve({ sessionId: fakeSessionId }),
    });
    assert.equal(res.status, 404);
  });

  test('6. 409 Conflict: Submitting new attempt on completed session rejected', async () => {
    const url = `http://localhost:3000/api/writing/sessions/${completedSessionId}/attempts`;
    const res = await attemptsRoute.POST(makePostRequest(url, {
      operationKey: randomUUID(),
      candidateStrokes: [{ points: [[0.1, 0.1], [0.2, 0.2]] }],
    }), {
      params: Promise.resolve({ sessionId: completedSessionId }),
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, 'SESSION_COMPLETED');
  });

  test('7. 200 OK: Complete active session transitions status to COMPLETED', async () => {
    const attemptUrl = `http://localhost:3000/api/writing/sessions/${activeSessionId}/attempts`;
    const attempt = await attemptsRoute.POST(makePostRequest(attemptUrl, {
      operationKey: randomUUID(),
      candidateStrokes: [{ points: [[0.2, 0.2], [0.8, 0.8]] }],
    }), { params: Promise.resolve({ sessionId: activeSessionId }) });
    assert.equal(attempt.status, 201);

    const url = `http://localhost:3000/api/writing/sessions/${activeSessionId}/complete`;
    const req = makePostRequest(url, {});

    const res = await completeRoute.POST(req, {
      params: Promise.resolve({ sessionId: activeSessionId }),
    });
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.ok(body.data);
    assert.equal(body.data.sessionId, activeSessionId);
    assert.equal(body.data.status, 'COMPLETED');
    assert.ok(body.data.completedAt);

    // Verify session updated in DB
    const updated = state.writingSessions.find(s => s.id === activeSessionId);
    assert.equal(updated.status, 'COMPLETED');
    assert.ok(updated.completedAt);
  });

  test('7a. 409 Conflict: A session cannot complete before its first attempt', async () => {
    const emptySessionId = randomUUID();
    state.writingSessions.push({
      id: emptySessionId,
      learnerId,
      contextId,
      lessonId: lesson1Id,
      lessonRevisionId: revision1Id,
      characterId: charJaSunId,
      strokeVersion: 1,
      status: 'ACTIVE',
      rowVersion: 1n,
      startedAt: new Date(),
    });
    const url = `http://localhost:3000/api/writing/sessions/${emptySessionId}/complete`;
    const res = await completeRoute.POST(makePostRequest(url, {}), {
      params: Promise.resolve({ sessionId: emptySessionId }),
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, 'NO_ATTEMPTS');
    assert.equal(state.writingSessions.find((session) => session.id === emptySessionId).status, 'ACTIVE');
  });

  test('8. 200 OK: Complete already completed session is idempotent', async () => {
    const url = `http://localhost:3000/api/writing/sessions/${completedSessionId}/complete`;
    const req = makePostRequest(url, {});

    const res = await completeRoute.POST(req, {
      params: Promise.resolve({ sessionId: completedSessionId }),
    });
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.data.sessionId, completedSessionId);
    assert.equal(body.data.status, 'COMPLETED');
  });

  test('9. 200 OK: Replay of committed attempt is allowed after session is completed', async () => {
    const opKey = randomUUID();
    const candidateStrokes = [
      { points: [[0.2, 0.2], [0.2, 0.8]] },
      { points: [[0.2, 0.2], [0.8, 0.2], [0.8, 0.8]] },
    ];
    const url = `http://localhost:3000/api/writing/sessions/${activeSessionId}/attempts`;
    const payload = { operationKey: opKey, candidateStrokes };

    // Commit attempt while active
    const res1 = await attemptsRoute.POST(makePostRequest(url, payload), {
      params: Promise.resolve({ sessionId: activeSessionId }),
    });
    assert.equal(res1.status, 201);

    // Complete the session
    const completeUrl = `http://localhost:3000/api/writing/sessions/${activeSessionId}/complete`;
    const resComplete = await completeRoute.POST(makePostRequest(completeUrl, {}), {
      params: Promise.resolve({ sessionId: activeSessionId }),
    });
    assert.equal(resComplete.status, 200);

    // Replay attempt after session completed -> must succeed with 200 OK
    const resReplay = await attemptsRoute.POST(makePostRequest(url, payload), {
      params: Promise.resolve({ sessionId: activeSessionId }),
    });
    assert.equal(resReplay.status, 200);
    const bodyReplay = await resReplay.json();
    assert.equal(bodyReplay.data.isReplay, true);
  });

  test('10. 403 Forbidden: Foreign origin rejected', async () => {
    const url = `http://localhost:3000/api/writing/sessions/${activeSessionId}/attempts`;
    const req = makePostRequest(url, {
      operationKey: randomUUID(),
      candidateStrokes: [{ points: [[0.1, 0.1], [0.2, 0.2]] }],
    }, { origin: 'https://attacker.site' });

    const res = await attemptsRoute.POST(req, {
      params: Promise.resolve({ sessionId: activeSessionId }),
    });
    assert.equal(res.status, 403);
  });

  test('11. 201 Created: Submit via /characters/:characterId/attempts with strokePoints and requestId', async () => {
    const requestId = randomUUID();
    const strokePoints = [
      [[0.2, 0.2], [0.2, 0.8]],
      [[0.2, 0.2], [0.8, 0.2], [0.8, 0.8]],
    ];
    const url = `http://localhost:3000/api/writing/sessions/${activeSessionId}/characters/${charJaSunId}/attempts`;
    const payload = { characterId: charJaSunId, requestId, strokePoints };

    const res = await characterAttemptsRoute.POST(makePostRequest(url, payload), {
      params: Promise.resolve({ sessionId: activeSessionId, characterId: charJaSunId }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.characterId, charJaSunId);
    assert.equal(body.data.operationKey, requestId);
    assert.equal(typeof body.data.score, 'number');
  });

  test('12. 400 Bad Request: Character ID mismatch in character-specific route', async () => {
    const wrongCharId = randomUUID();
    const url = `http://localhost:3000/api/writing/sessions/${activeSessionId}/characters/${charJaSunId}/attempts`;
    const payload = {
      characterId: wrongCharId,
      requestId: randomUUID(),
      strokePoints: [[[0.1, 0.1], [0.2, 0.2]]],
    };

    const res = await characterAttemptsRoute.POST(makePostRequest(url, payload), {
      params: Promise.resolve({ sessionId: activeSessionId, characterId: charJaSunId }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'CHARACTER_MISMATCH');
  });

  test('12a. 409 Conflict: Route and body character must match the owned writing session', async () => {
    const wrongCharId = randomUUID();
    const requestId = randomUUID();
    const url = `http://localhost:3000/api/writing/sessions/${activeSessionId}/characters/${wrongCharId}/attempts`;
    const res = await characterAttemptsRoute.POST(makePostRequest(url, {
      characterId: wrongCharId,
      requestId,
      strokePoints: [[[0.1, 0.1], [0.2, 0.2]]],
    }), {
      params: Promise.resolve({ sessionId: activeSessionId, characterId: wrongCharId }),
    });

    assert.equal(res.status, 409);
    assert.equal((await res.json()).error.code, 'CHARACTER_MISMATCH');
    assert.equal(state.writingAttempts.length, 0);
  });

  test('12d. 400 Bad Request: Character-specific route requires body characterId', async () => {
    const url = `http://localhost:3000/api/writing/sessions/${activeSessionId}/characters/${charJaSunId}/attempts`;
    const res = await characterAttemptsRoute.POST(makePostRequest(url, {
      requestId: randomUUID(),
      strokePoints: [[[0.1, 0.1], [0.2, 0.2]]],
    }), {
      params: Promise.resolve({ sessionId: activeSessionId, characterId: charJaSunId }),
    });

    assert.equal(res.status, 400);
    assert.equal((await res.json()).error.code, 'CHARACTER_REQUIRED');
    assert.equal(state.writingAttempts.length, 0);
  });

  test('12e. 400 Bad Request: Attempt request rejects simultaneous requestId and operationKey', async () => {
    const url = `http://localhost:3000/api/writing/sessions/${activeSessionId}/characters/${charJaSunId}/attempts`;
    const res = await characterAttemptsRoute.POST(makePostRequest(url, {
      characterId: charJaSunId,
      requestId: randomUUID(),
      operationKey: randomUUID(),
      strokePoints: [[[0.1, 0.1], [0.2, 0.2]]],
    }), {
      params: Promise.resolve({ sessionId: activeSessionId, characterId: charJaSunId }),
    });

    assert.equal(res.status, 400);
    assert.equal((await res.json()).error.code, 'VALIDATION_ERROR');
    assert.equal(state.writingAttempts.length, 0);
  });

  test('12b. 413 Payload Too Large: Character-specific route shares the canonical body limit', async () => {
    const url = `http://localhost:3000/api/writing/sessions/${activeSessionId}/characters/${charJaSunId}/attempts`;
    const res = await characterAttemptsRoute.POST(makePostRequest(url, JSON.stringify({
      characterId: charJaSunId,
      requestId: randomUUID(),
      strokePoints: [[[0.1, 0.1], [0.2, 0.2]]],
      padding: 'x'.repeat(270 * 1024),
    })), {
      params: Promise.resolve({ sessionId: activeSessionId, characterId: charJaSunId }),
    });

    assert.equal(res.status, 413);
    assert.equal((await res.json()).error.code, 'PAYLOAD_TOO_LARGE');
    assert.equal(state.writingAttempts.length, 0);
  });

  test('12c. Degenerate pointer geometry is rejected and is not a completed attempt', async () => {
    const url = `http://localhost:3000/api/writing/sessions/${activeSessionId}/attempts`;
    const res = await attemptsRoute.POST(makePostRequest(url, {
      operationKey: randomUUID(),
      candidateStrokes: [{ points: [[0.4, 0.4], [0.4, 0.4]] }],
    }), { params: Promise.resolve({ sessionId: activeSessionId }) });

    assert.equal(res.status, 400);
    assert.equal((await res.json()).error.code, 'INVALID_STROKE_GEOMETRY');
    assert.equal(state.writingAttempts.length, 0);
  });

  test('13. 201 Created: Submit via /attempts with strokePoints and requestId', async () => {
    const requestId = randomUUID();
    const strokePoints = [
      [[0.2, 0.2], [0.2, 0.8]],
      [[0.2, 0.2], [0.8, 0.2], [0.8, 0.8]],
    ];
    const url = `http://localhost:3000/api/writing/sessions/${activeSessionId}/attempts`;
    const payload = { requestId, strokePoints };

    const res = await attemptsRoute.POST(makePostRequest(url, payload), {
      params: Promise.resolve({ sessionId: activeSessionId }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.operationKey, requestId);
  });

  test('14. 409 Conflict: Reusing an attempt key on a different session is rejected', async () => {
    const operationKey = randomUUID();
    const candidateStrokes = [{ points: [[0.2, 0.2], [0.8, 0.8]] }];
    const otherSessionId = randomUUID();
    state.writingSessions.push({
      id: otherSessionId,
      learnerId,
      contextId,
      lessonId: lesson1Id,
      lessonRevisionId: revision1Id,
      characterId: charJaSunId,
      strokeVersion: 1,
      status: 'ACTIVE',
      rowVersion: 1n,
      startedAt: new Date(),
    });
    const url = `http://localhost:3000/api/writing/sessions/${activeSessionId}/attempts`;
    const first = await attemptsRoute.POST(makePostRequest(url, { operationKey, candidateStrokes }), {
      params: Promise.resolve({ sessionId: activeSessionId }),
    });
    assert.equal(first.status, 201);

    const secondUrl = `http://localhost:3000/api/writing/sessions/${otherSessionId}/attempts`;
    const second = await attemptsRoute.POST(makePostRequest(secondUrl, { operationKey, candidateStrokes }), {
      params: Promise.resolve({ sessionId: otherSessionId }),
    });
    assert.equal(second.status, 409);
    const body = await second.json();
    assert.equal(body.error.code, 'OPERATION_CONFLICT');
  });
});
