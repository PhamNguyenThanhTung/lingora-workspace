import { test, describe, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import { getLearnerCookieName } from '../../src/server/auth/env.ts';
import {
  learnerId,
  otherLearnerId,
  account,
  setupEnv,
  fixtureDb,
  providerDouble,
  token,
  confirmedUser,
  fixtureEmail,
  providerOrigin,
} from './harness/learner-fixture.mjs';

const realFetch = globalThis.fetch;

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

const sessionsRoute = await import('../../src/app/api/srs/sessions/route.ts');
const sessionDetailRoute = await import('../../src/app/api/srs/sessions/[sessionId]/route.ts');
const sessionReviewsRoute = await import('../../src/app/api/srs/sessions/[sessionId]/reviews/route.ts');
const sessionWritingAttemptsRoute = await import('../../src/app/api/srs/sessions/[sessionId]/writing-attempts/route.ts');
const sessionRevealRoute = await import('../../src/app/api/srs/sessions/[sessionId]/reveal/route.ts');
const sessionCompleteRoute = await import('../../src/app/api/srs/sessions/[sessionId]/complete/route.ts');

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

function authHeaders() {
  return {
    Origin: 'http://localhost:3000',
    Host: 'localhost:3000',
    'Content-Type': 'application/json',
  };
}

let state;

beforeEach(() => {
  setupEnv();
  setAuthenticatedCookie();
  state = {
    account: account(),
    srsCards: [],
    srsMemoryStates: [],
    srsReviewSessions: [],
    srsReviewOperations: [],
    vocabularyConcepts: [
      {
        id: 'vocab-1',
        canonicalForm: 'Hello',
        senseKey: 'greeting',
        phonetic: 'həˈləʊ',
        partOfSpeech: 'interjection',
        meaningLabels: { vi: 'Xin chào', en: 'Greeting' },
        example: 'Hello, how are you today?',
      },
    ],
  };
  globalThis.fetch = providerDouble(state);
  setLearnerPrismaForTest(fixtureDb(state));
});

after(() => {
  globalThis.fetch = realFetch;
  setLearnerPrismaForTest(null);
});

describe('S5-03: SRS Sessions API Route Handlers', () => {
  test('POST /api/srs/sessions rejects foreign origin with 403', async () => {
    const req = new Request('http://localhost:3000/api/srs/sessions', {
      method: 'POST',
      headers: {
        Origin: 'https://evil.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const res = await sessionsRoute.POST(req);
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error.code, 'FORBIDDEN_ORIGIN');
  });

  test('POST /api/srs/sessions creates session with due cards and returns current item', async () => {
    const cardId = randomUUID();
    state.srsCards.push({
      id: cardId,
      learnerId: state.account.id,
      vocabularyId: 'vocab-1',
      stage: 1,
      dueAt: new Date(Date.now() - 3600 * 1000),
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      rowVersion: 1n,
    });

    const req = new Request('http://localhost:3000/api/srs/sessions', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ limit: 10 }),
    });

    const res = await sessionsRoute.POST(req);
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.status, 'ACTIVE');
    assert.equal(body.data.progress.total, 1);
    assert.equal(body.data.progress.completedCount, 0);
    assert.equal(body.data.currentItem.canonicalForm, 'Hello');
    assert.ok(body.data.sessionId);
  });

  test('GET /api/srs/sessions/:sessionId returns session progress and item', async () => {
    const cardId = randomUUID();
    const sessionId = randomUUID();
    state.srsCards.push({
      id: cardId,
      learnerId: state.account.id,
      vocabularyId: 'vocab-1',
      stage: 1,
      dueAt: new Date(Date.now() - 3600 * 1000),
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      rowVersion: 1n,
    });

    const sessionRow = {
      id: sessionId,
      learnerId: state.account.id,
      status: 'ACTIVE',
      sessionLimit: 20,
      cardIds: [cardId],
      currentIndex: 0,
      completedCount: 0,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      rowVersion: 1n,
    };
    state.srsReviewSessions.push(sessionRow);

    const req = new Request(`http://localhost:3000/api/srs/sessions/${sessionId}`, {
      method: 'GET',
      headers: authHeaders(),
    });

    const res = await sessionDetailRoute.GET(req, { params: Promise.resolve({ sessionId }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.sessionId, sessionId);
    assert.equal(body.data.status, 'ACTIVE');
    assert.equal(body.data.currentItem.canonicalForm, 'Hello');
  });

  test('POST /api/srs/sessions/:sessionId/reviews submits rating and records review', async () => {
    const cardId = randomUUID();
    const sessionId = randomUUID();
    state.srsCards.push({
      id: cardId,
      learnerId: state.account.id,
      vocabularyId: 'vocab-1',
      stage: 1,
      dueAt: new Date(Date.now() - 3600 * 1000),
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      rowVersion: 1n,
    });

    state.srsReviewSessions.push({
      id: sessionId,
      learnerId: state.account.id,
      status: 'ACTIVE',
      sessionLimit: 20,
      cardIds: [cardId],
      currentIndex: 0,
      completedCount: 0,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      rowVersion: 1n,
    });

    const opKey = randomUUID();
    const req = new Request(`http://localhost:3000/api/srs/sessions/${sessionId}/reviews`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        operationKey: opKey,
        rating: 'REMEMBERED',
        cardId,
      }),
    });

    const res = await sessionReviewsRoute.POST(req, { params: Promise.resolve({ sessionId }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.status, 'COMPLETED');
    assert.equal(body.data.progress.completedCount, 1);
    assert.equal(body.data.recordedRating, 'REMEMBERED');
  });

  test('POST /api/srs/sessions/:sessionId/writing-attempts rejects cross-origin and malformed stroke input', async () => {
    const foreignOrigin = await sessionWritingAttemptsRoute.POST(
      new Request('http://localhost:3000/api/srs/sessions/session-id/writing-attempts', {
        method: 'POST',
        headers: { Origin: 'https://evil.com', 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
      { params: { sessionId: randomUUID() } },
    );
    assert.equal(foreignOrigin.status, 403);

    const invalid = await sessionWritingAttemptsRoute.POST(
      new Request('http://localhost:3000/api/srs/sessions/session-id/writing-attempts', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ cardId: randomUUID(), operationKey: randomUUID(), characterNumber: 1, candidateStrokes: [{ points: [[0, 0], [1.1, 0.5]] }] }),
      }),
      { params: { sessionId: randomUUID() } },
    );
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json()).error.code, 'VALIDATION_ERROR');

    // Reject missing characterNumber
    const missingOrdinal = await sessionWritingAttemptsRoute.POST(
      new Request('http://localhost:3000/api/srs/sessions/session-id/writing-attempts', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ cardId: randomUUID(), operationKey: randomUUID(), candidateStrokes: [{ points: [[0, 0], [0.5, 0.5]] }] }),
      }),
      { params: { sessionId: randomUUID() } },
    );
    assert.equal(missingOrdinal.status, 400);
    assert.equal((await missingOrdinal.json()).error.code, 'VALIDATION_ERROR');

    // Reject invalid characterNumber (<= 0)
    const invalidOrdinal = await sessionWritingAttemptsRoute.POST(
      new Request('http://localhost:3000/api/srs/sessions/session-id/writing-attempts', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ cardId: randomUUID(), operationKey: randomUUID(), characterNumber: 0, candidateStrokes: [{ points: [[0, 0], [0.5, 0.5]] }] }),
      }),
      { params: { sessionId: randomUUID() } },
    );
    assert.equal(invalidOrdinal.status, 400);
    assert.equal((await invalidOrdinal.json()).error.code, 'VALIDATION_ERROR');

    // Strict body: reject extra sessionId in request body
    const extraSessionId = await sessionWritingAttemptsRoute.POST(
      new Request('http://localhost:3000/api/srs/sessions/session-id/writing-attempts', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ sessionId: randomUUID(), cardId: randomUUID(), operationKey: randomUUID(), characterNumber: 1, candidateStrokes: [{ points: [[0, 0], [0.5, 0.5]] }] }),
      }),
      { params: { sessionId: randomUUID() } },
    );
    assert.equal(extraSessionId.status, 400);
    assert.equal((await extraSessionId.json()).error.code, 'VALIDATION_ERROR');
  });

  test('POST /api/srs/sessions/:sessionId/complete seals session', async () => {
    const cardId = randomUUID();
    const sessionId = randomUUID();
    state.srsReviewSessions.push({
      id: sessionId,
      learnerId: state.account.id,
      status: 'ACTIVE',
      sessionLimit: 20,
      cardIds: [cardId],
      currentIndex: 0,
      completedCount: 0,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      rowVersion: 1n,
    });

    const req = new Request(`http://localhost:3000/api/srs/sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: authHeaders(),
    });

    const res = await sessionCompleteRoute.POST(req, { params: Promise.resolve({ sessionId }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.status, 'COMPLETED');
    assert.ok(body.data.completedAt);
  });

  test('EXT-01: POST /api/srs/sessions/:sessionId/reveal returns reading and romanization', async () => {
    state.vocabularyConcepts.push({
      id: 'vocab-ja-1',
      canonicalForm: '学生',
      senseKey: 'default',
      phonetic: null,
      reading: 'がくせい',
      romanization: 'gakusei',
      partOfSpeech: 'noun',
      meaningLabels: { vi: 'học sinh' },
      example: 'わたしは学生です。',
    });
    const cardId = randomUUID();
    const sessionId = randomUUID();
    state.srsCards.push({
      id: cardId,
      learnerId: state.account.id,
      vocabularyId: 'vocab-ja-1',
      stage: 1,
      dueAt: new Date(Date.now() - 3600 * 1000),
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      rowVersion: 1n,
    });
    state.srsReviewSessions.push({
      id: sessionId,
      learnerId: state.account.id,
      status: 'ACTIVE',
      sessionLimit: 20,
      cardIds: [cardId],
      currentIndex: 0,
      completedCount: 0,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      rowVersion: 1n,
    });

    const req = new Request(`http://localhost:3000/api/srs/sessions/${sessionId}/reveal`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ cardId }),
    });
    const res = await sessionRevealRoute.POST(req, { params: Promise.resolve({ sessionId }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.reading, 'がくせい');
    assert.equal(body.data.romanization, 'gakusei');
  });
});
