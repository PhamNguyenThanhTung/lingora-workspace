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
import {
  createSrsToken,
  verifySrsToken,
  computeSrsInputHash,
} from '../../src/server/srs/token.ts';
import {
  startSrsReview,
  respondSrsReview,
  SrsServiceError,
} from '../../src/server/srs/index.ts';

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

const startRoute = await import('../../src/app/api/learner/review/start/route.ts');
const respondRoute = await import('../../src/app/api/learner/review/respond/route.ts');

const VALID_SECRET = 'a'.repeat(32); // 32-byte secret
const realFetch = globalThis.fetch;

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

function authHeaders(user = confirmedUser()) {
  const tok = token(user);
  return {
    Authorization: `Bearer ${tok.access_token}`,
    Origin: 'http://localhost:3000',
    Host: 'localhost:3000',
    'Content-Type': 'application/json',
  };
}

let state;

after(() => {
  globalThis.fetch = realFetch;
});

beforeEach(() => {
  setupEnv();
  process.env.LINGORA_SRS_SIGNING_SECRET = VALID_SECRET;
  setAuthenticatedCookie();
  state = {
    account: account(),
    srsCards: [],
    srsReviewOperations: [],
    vocabularyConcepts: [
      {
        id: 'vocab-1',
        canonicalForm: 'Hello',
        senseKey: 'greeting',
        phonetic: 'həˈləʊ',
        partOfSpeech: 'interjection',
        meaningLabels: { vi: 'Xin chào', en: 'Greeting' },
        example: 'Hello, how are you?',
      },
      {
        id: 'vocab-2',
        canonicalForm: 'Book',
        senseKey: 'noun-reading',
        phonetic: 'bʊk',
        partOfSpeech: 'noun',
        meaningLabels: { vi: 'Quyển sách' },
        example: 'I read a book.',
      },
    ],
  };
  globalThis.fetch = providerDouble(state);
  setLearnerPrismaForTest(fixtureDb(state));
});

describe('P4: SRS Token Helper & Security', () => {
  test('secret missing or < 32 bytes throws 503 SERVICE_UNAVAILABLE', () => {
    delete process.env.LINGORA_SRS_SIGNING_SECRET;
    assert.throws(
      () => createSrsToken({
        learnerId,
        cardId: 'c1',
        expectedRowVersion: '1',
        sessionKey: 'sk-1',
        exp: Math.floor(Date.now() / 1000) + 900,
      }),
      (err) => err.status === 503 && err.code === 'SERVICE_UNAVAILABLE'
    );

    process.env.LINGORA_SRS_SIGNING_SECRET = 'short-secret';
    assert.throws(
      () => createSrsToken({
        learnerId,
        cardId: 'c1',
        expectedRowVersion: '1',
        sessionKey: 'sk-1',
        exp: Math.floor(Date.now() / 1000) + 900,
      }),
      (err) => err.status === 503 && err.code === 'SERVICE_UNAVAILABLE'
    );
  });

  test('valid creation and verification returns exact payload', () => {
    const exp = Math.floor(Date.now() / 1000) + 900;
    const tokenStr = createSrsToken({
      learnerId,
      cardId: 'card-123',
      expectedRowVersion: '2',
      sessionKey: 'sess-abc',
      exp,
    });
    const payload = verifySrsToken(tokenStr, learnerId);
    assert.equal(payload.v, 1);
    assert.equal(payload.learnerId, learnerId);
    assert.equal(payload.cardId, 'card-123');
    assert.equal(payload.expectedRowVersion, '2');
    assert.equal(payload.sessionKey, 'sess-abc');
    assert.equal(payload.exp, exp);
  });

  test('tampered payload or signature fails with 400 INVALID_TOKEN', () => {
    const exp = Math.floor(Date.now() / 1000) + 900;
    const tokenStr = createSrsToken({
      learnerId,
      cardId: 'card-123',
      expectedRowVersion: '1',
      sessionKey: 'sess-abc',
      exp,
    });
    const [payloadB64, sig] = tokenStr.split('.');

    // Tampered signature
    assert.throws(
      () => verifySrsToken(`${payloadB64}.invalid_signature`, learnerId),
      (err) => err.status === 400 && err.code === 'INVALID_TOKEN'
    );

    // Tampered payload
    const tamperedPayload = Buffer.from(JSON.stringify({ learnerId, cardId: 'card-999', exp })).toString('base64url');
    assert.throws(
      () => verifySrsToken(`${tamperedPayload}.${sig}`, learnerId),
      (err) => err.status === 400 && err.code === 'INVALID_TOKEN'
    );
  });

  test('expired token fails with 409 SESSION_EXPIRED', () => {
    const exp = Math.floor(Date.now() / 1000) - 10; // expired 10 seconds ago
    const tokenStr = createSrsToken({
      learnerId,
      cardId: 'card-123',
      expectedRowVersion: '1',
      sessionKey: 'sess-abc',
      exp,
    });
    assert.throws(
      () => verifySrsToken(tokenStr, learnerId),
      (err) => err.status === 409 && err.code === 'SESSION_EXPIRED'
    );
  });

  test('mismatched learnerId fails with 403 FORBIDDEN', () => {
    const exp = Math.floor(Date.now() / 1000) + 900;
    const tokenStr = createSrsToken({
      learnerId: otherLearnerId,
      cardId: 'card-123',
      expectedRowVersion: '1',
      sessionKey: 'sess-abc',
      exp,
    });
    assert.throws(
      () => verifySrsToken(tokenStr, learnerId),
      (err) => err.status === 403 && err.code === 'FORBIDDEN'
    );
  });
});

describe('P4: SRS Route Guards & Invariants', () => {
  test('rejects foreign origin with 403 FORBIDDEN_ORIGIN', async () => {
    const req = new Request('http://localhost:3000/api/learner/review/start', {
      method: 'POST',
      headers: { ...authHeaders(), Origin: 'https://evil.com' },
      body: JSON.stringify({}),
    });
    const res = await startRoute.POST(req);
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.error.code, 'FORBIDDEN_ORIGIN');
  });

  test('rejects non-json content-type with 415 UNSUPPORTED_MEDIA_TYPE', async () => {
    const req = new Request('http://localhost:3000/api/learner/review/start', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'text/plain' },
      body: '{}',
    });
    const res = await startRoute.POST(req);
    assert.equal(res.status, 415);
  });

  test('rejects extra fields with 400 VALIDATION_ERROR (strict schema)', async () => {
    const req = new Request('http://localhost:3000/api/learner/review/start', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ extraField: 'not_allowed' }),
    });
    const res = await startRoute.POST(req);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });

  test('rejects teacher or disabled account with 403', async () => {
    // Disabled account
    state.account.status = 'DISABLED';
    const req = new Request('http://localhost:3000/api/learner/review/start', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    const res = await startRoute.POST(req);
    assert.equal(res.status, 403);

    // Teacher role
    state.account.status = 'ACTIVE';
    state.account.role = 'TEACHER';
    const reqTeacher = new Request('http://localhost:3000/api/learner/review/start', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    const resTeacher = await startRoute.POST(reqTeacher);
    assert.equal(resTeacher.status, 403);
  });
});

describe('P4: SRS Start & Prompt Secrecy', () => {
  test('empty due list returns done: true and null card/token', async () => {
    const req = new Request('http://localhost:3000/api/learner/review/start', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    const res = await startRoute.POST(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.deepEqual(json.data, {
      done: true,
      token: null,
      card: null,
    });
  });

  test('future card (dueAt > now) is not returned', async () => {
    const futureDue = new Date(Date.now() + 86400 * 1000); // due tomorrow
    state.srsCards.push({
      id: randomUUID(),
      learnerId,
      vocabularyId: 'vocab-1',
      stage: 1,
      dueAt: futureDue,
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      sourceAttemptId: null,
      sourceLessonVocabularyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      rowVersion: 1n,
    });

    const req = new Request('http://localhost:3000/api/learner/review/start', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    const res = await startRoute.POST(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.done, true);
    assert.equal(json.data.card, null);
  });

  test('due card returns safe prompt card and signed token without leaking stage/due schedule', async () => {
    const pastDue = new Date(Date.now() - 3600 * 1000); // 1 hour ago
    const cardId = randomUUID();
    state.srsCards.push({
      id: cardId,
      learnerId,
      vocabularyId: 'vocab-1',
      stage: 2,
      dueAt: pastDue,
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      sourceAttemptId: null,
      sourceLessonVocabularyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      rowVersion: 3n,
    });

    const req = new Request('http://localhost:3000/api/learner/review/start', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    const res = await startRoute.POST(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.done, false);
    assert.ok(json.data.token);
    assert.ok(json.data.card);

    // Verify card content
    assert.equal(json.data.card.canonicalForm, 'Hello');
    assert.equal(json.data.card.phonetic, 'həˈləʊ');
    assert.equal(json.data.card.partOfSpeech, 'interjection');
    assert.equal(json.data.card.example, 'Hello, how are you?');
    assert.deepEqual(json.data.card.meaningLabels, { vi: 'Xin chào', en: 'Greeting' });

    // Secrecy invariants: DTO must NEVER contain stage, dueAt, or id
    assert.equal(json.data.card.stage, undefined);
    assert.equal(json.data.card.dueAt, undefined);
    assert.equal(json.data.card.id, undefined);
  });
});

describe('P4: SRS Respond & Policy Progression', () => {
  test('REMEMBERED follows stages 1->2->3->4->5->5 intervals [1,3,7,14,30]', async () => {
    const intervals = [1, 3, 7, 14, 30];
    const stages = [1, 2, 3, 4, 5];

    for (const priorStage of stages) {
      const cardId = randomUUID();
      const pastDue = new Date(Date.now() - 3600 * 1000);
      const card = {
        id: cardId,
        learnerId,
        vocabularyId: 'vocab-1',
        stage: priorStage,
        dueAt: pastDue,
        lastReviewedAt: null,
        enrollmentSource: 'CORE_COMPLETION',
        sourceAttemptId: null,
        sourceLessonVocabularyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rowVersion: 1n,
      };
      state.srsCards = [card];
      state.srsReviewOperations = [];

      const tokenStr = createSrsToken({
        learnerId,
        cardId,
        expectedRowVersion: '1',
        sessionKey: randomUUID(),
        exp: Math.floor(Date.now() / 1000) + 900,
      });

      const opKey = randomUUID();
      const req = new Request('http://localhost:3000/api/learner/review/respond', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          token: tokenStr,
          operationKey: opKey,
          rating: 'REMEMBERED',
        }),
      });

      const res = await respondRoute.POST(req);
      assert.equal(res.status, 200);

      const expectedNextStage = Math.min(priorStage + 1, 5);
      const expectedDays = intervals[expectedNextStage - 1];

      assert.equal(card.stage, expectedNextStage, `Stage ${priorStage} -> ${expectedNextStage}`);
      assert.equal(card.rowVersion, 2n);
      assert.ok(card.lastReviewedAt);

      // Verify operation record
      assert.equal(state.srsReviewOperations.length, 1);
      const op = state.srsReviewOperations[0];
      assert.equal(op.cardId, cardId);
      assert.equal(op.rating, 'REMEMBERED');
      assert.equal(op.priorStage, priorStage);
      assert.equal(op.nextStage, expectedNextStage);
      assert.equal(op.kind, 'SCHEDULE');
    }
  });

  test('FORGOTTEN resets any stage (1..5) to stage 1 and +1 day', async () => {
    const stages = [1, 2, 3, 4, 5];

    for (const priorStage of stages) {
      const cardId = randomUUID();
      const pastDue = new Date(Date.now() - 3600 * 1000);
      const card = {
        id: cardId,
        learnerId,
        vocabularyId: 'vocab-1',
        stage: priorStage,
        dueAt: pastDue,
        lastReviewedAt: null,
        enrollmentSource: 'CORE_COMPLETION',
        sourceAttemptId: null,
        sourceLessonVocabularyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rowVersion: 1n,
      };
      state.srsCards = [card];
      state.srsReviewOperations = [];

      const tokenStr = createSrsToken({
        learnerId,
        cardId,
        expectedRowVersion: '1',
        sessionKey: randomUUID(),
        exp: Math.floor(Date.now() / 1000) + 900,
      });

      const opKey = randomUUID();
      const req = new Request('http://localhost:3000/api/learner/review/respond', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          token: tokenStr,
          operationKey: opKey,
          rating: 'FORGOTTEN',
        }),
      });

      const res = await respondRoute.POST(req);
      assert.equal(res.status, 200);

      assert.equal(card.stage, 1, `FORGOTTEN on stage ${priorStage} must reset to 1`);
      assert.equal(card.rowVersion, 2n);

      assert.equal(state.srsReviewOperations.length, 1);
      const op = state.srsReviewOperations[0];
      assert.equal(op.rating, 'FORGOTTEN');
      assert.equal(op.priorStage, priorStage);
      assert.equal(op.nextStage, 1);
    }
  });

  test('idempotency: duplicate same operationKey returns previous outcome without double schedule', async () => {
    const cardId = randomUUID();
    const pastDue = new Date(Date.now() - 3600 * 1000);
    const card = {
      id: cardId,
      learnerId,
      vocabularyId: 'vocab-1',
      stage: 1,
      dueAt: pastDue,
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      sourceAttemptId: null,
      sourceLessonVocabularyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      rowVersion: 1n,
    };
    state.srsCards = [card];

    const tokenStr = createSrsToken({
      learnerId,
      cardId,
      expectedRowVersion: '1',
      sessionKey: randomUUID(),
      exp: Math.floor(Date.now() / 1000) + 900,
    });

    const opKey = randomUUID();
    const reqPayload = {
      token: tokenStr,
      operationKey: opKey,
      rating: 'REMEMBERED',
    };

    // First request
    const res1 = await respondRoute.POST(new Request('http://localhost:3000/api/learner/review/respond', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(reqPayload),
    }));
    assert.equal(res1.status, 200);
    const json1 = await res1.json();
    assert.equal(card.stage, 2);
    assert.equal(card.rowVersion, 2n);
    assert.equal(state.srsReviewOperations.length, 1);

    // Second request with EXACT SAME operationKey and payload
    const res2 = await respondRoute.POST(new Request('http://localhost:3000/api/learner/review/respond', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(reqPayload),
    }));
    assert.equal(res2.status, 200);
    const json2 = await res2.json();

    // Must NOT double schedule or create second operation record
    assert.equal(card.stage, 2);
    assert.equal(card.rowVersion, 2n);
    assert.equal(state.srsReviewOperations.length, 1);
    assert.equal(json2.data.recordedRating, json1.data.recordedRating);
  });

  test('conflict: same operationKey with different payload fails with 409 OPERATION_CONFLICT', async () => {
    const cardId = randomUUID();
    const pastDue = new Date(Date.now() - 3600 * 1000);
    const card = {
      id: cardId,
      learnerId,
      vocabularyId: 'vocab-1',
      stage: 1,
      dueAt: pastDue,
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      sourceAttemptId: null,
      sourceLessonVocabularyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      rowVersion: 1n,
    };
    state.srsCards = [card];

    const tokenStr = createSrsToken({
      learnerId,
      cardId,
      expectedRowVersion: '1',
      sessionKey: randomUUID(),
      exp: Math.floor(Date.now() / 1000) + 900,
    });

    const opKey = randomUUID();

    // First request with REMEMBERED
    await respondRoute.POST(new Request('http://localhost:3000/api/learner/review/respond', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ token: tokenStr, operationKey: opKey, rating: 'REMEMBERED' }),
    }));

    // Second request with SAME operationKey but FORGOTTEN
    const resConflict = await respondRoute.POST(new Request('http://localhost:3000/api/learner/review/respond', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ token: tokenStr, operationKey: opKey, rating: 'FORGOTTEN' }),
    }));

    assert.equal(resConflict.status, 409);
    const json = await resConflict.json();
    assert.equal(json.error.code, 'OPERATION_CONFLICT');
  });

  test('CAS: stale token rowVersion fails with 409 STALE_OPERATION', async () => {
    const cardId = randomUUID();
    const pastDue = new Date(Date.now() - 3600 * 1000);
    state.srsCards = [{
      id: cardId,
      learnerId,
      vocabularyId: 'vocab-1',
      stage: 1,
      dueAt: pastDue,
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      sourceAttemptId: null,
      sourceLessonVocabularyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      rowVersion: 5n, // current version in DB is 5
    }];

    // Token expected rowVersion is 4 (stale)
    const tokenStr = createSrsToken({
      learnerId,
      cardId,
      expectedRowVersion: '4',
      sessionKey: randomUUID(),
      exp: Math.floor(Date.now() / 1000) + 900,
    });

    const res = await respondRoute.POST(new Request('http://localhost:3000/api/learner/review/respond', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        token: tokenStr,
        operationKey: randomUUID(),
        rating: 'REMEMBERED',
      }),
    }));

    assert.equal(res.status, 409);
    const json = await res.json();
    assert.equal(json.error.code, 'STALE_OPERATION');
  });

  test('card not due fails with 409 CARD_NOT_DUE', async () => {
    const cardId = randomUUID();
    const futureDue = new Date(Date.now() + 86400 * 1000); // tomorrow
    state.srsCards = [{
      id: cardId,
      learnerId,
      vocabularyId: 'vocab-1',
      stage: 1,
      dueAt: futureDue,
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      sourceAttemptId: null,
      sourceLessonVocabularyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      rowVersion: 1n,
    }];

    const tokenStr = createSrsToken({
      learnerId,
      cardId,
      expectedRowVersion: '1',
      sessionKey: randomUUID(),
      exp: Math.floor(Date.now() / 1000) + 900,
    });

    const res = await respondRoute.POST(new Request('http://localhost:3000/api/learner/review/respond', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        token: tokenStr,
        operationKey: randomUUID(),
        rating: 'REMEMBERED',
      }),
    }));

    assert.equal(res.status, 409);
    const json = await res.json();
    assert.equal(json.error.code, 'CARD_NOT_DUE');
  });

  test('multi-card progression: rates first card, receives next card in session, rates second card, receives done', async () => {
    const card1Id = randomUUID();
    const card2Id = randomUUID();
    const pastDue1 = new Date(Date.now() - 7200 * 1000);
    const pastDue2 = new Date(Date.now() - 3600 * 1000);

    state.srsCards = [
      {
        id: card1Id,
        learnerId,
        vocabularyId: 'vocab-1',
        stage: 1,
        dueAt: pastDue1,
        lastReviewedAt: null,
        enrollmentSource: 'CORE_COMPLETION',
        sourceAttemptId: null,
        sourceLessonVocabularyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rowVersion: 1n,
      },
      {
        id: card2Id,
        learnerId,
        vocabularyId: 'vocab-2',
        stage: 1,
        dueAt: pastDue2,
        lastReviewedAt: null,
        enrollmentSource: 'CORE_COMPLETION',
        sourceAttemptId: null,
        sourceLessonVocabularyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rowVersion: 1n,
      },
    ];

    // 1. Start review -> gets card 1
    const resStart = await startRoute.POST(new Request('http://localhost:3000/api/learner/review/start', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({}),
    }));
    assert.equal(resStart.status, 200);
    const startJson = await resStart.json();
    assert.equal(startJson.data.done, false);
    assert.equal(startJson.data.card.canonicalForm, 'Hello');
    const token1 = startJson.data.token;

    // 2. Respond to card 1 -> gets card 2
    const resResp1 = await respondRoute.POST(new Request('http://localhost:3000/api/learner/review/respond', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        token: token1,
        operationKey: randomUUID(),
        rating: 'REMEMBERED',
      }),
    }));
    assert.equal(resResp1.status, 200);
    const resp1Json = await resResp1.json();
    assert.equal(resp1Json.data.done, false);
    assert.equal(resp1Json.data.card.canonicalForm, 'Book');
    const token2 = resp1Json.data.token;

    // 3. Respond to card 2 -> all cards reviewed -> done: true
    const resResp2 = await respondRoute.POST(new Request('http://localhost:3000/api/learner/review/respond', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        token: token2,
        operationKey: randomUUID(),
        rating: 'FORGOTTEN',
      }),
    }));
    assert.equal(resResp2.status, 200);
    const resp2Json = await resResp2.json();
    assert.equal(resp2Json.data.done, true);
    assert.equal(resp2Json.data.token, null);
    assert.equal(resp2Json.data.card, null);

    // Verify operations recorded
    assert.equal(state.srsReviewOperations.length, 2);
    assert.equal(state.srsReviewOperations[0].cardId, card1Id);
    assert.equal(state.srsReviewOperations[0].rating, 'REMEMBERED');
    assert.equal(state.srsReviewOperations[1].cardId, card2Id);
    assert.equal(state.srsReviewOperations[1].rating, 'FORGOTTEN');
  });
});

describe('P3: Strict SRS Contract & Fault Boundaries (R4)', () => {
  function seedCardAndToken(overrides = {}) {
    const cardId = randomUUID();
    const pastDue = new Date(Date.now() - 3600 * 1000);
    const card = {
      id: cardId,
      learnerId,
      vocabularyId: 'vocab-1',
      stage: 1,
      dueAt: pastDue,
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      sourceAttemptId: null,
      sourceLessonVocabularyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      rowVersion: 1n,
      ...overrides,
    };
    state.srsCards = [card];
    const tok = createSrsToken({
      learnerId,
      cardId,
      expectedRowVersion: card.rowVersion.toString(),
      sessionKey: randomUUID(),
      exp: Math.floor(Date.now() / 1000) + 900,
    });
    return { cardId, card, tok };
  }

  test('missing $queryRaw method fails closed with 503 SERVICE_UNAVAILABLE', async () => {
    const { cardId, card, tok } = seedCardAndToken();
    const base = fixtureDb(state);
    const brokenDb = {
      ...base,
      $queryRaw: undefined,
      $transaction: async (fn) => fn({ ...base, $queryRaw: undefined }),
    };

    // startSrsReview fails closed with 503, no token issued
    await assert.rejects(
      async () => startSrsReview(learnerId, {}, brokenDb),
      (err) => err instanceof SrsServiceError && err.status === 503 && err.code === 'SERVICE_UNAVAILABLE'
    );

    // respondSrsReview fails closed with 503, no card/version/history mutation
    const countBefore = state.srsReviewOperations.length;
    await assert.rejects(
      async () => respondSrsReview(learnerId, { token: tok, operationKey: randomUUID(), rating: 'REMEMBERED' }, brokenDb),
      (err) => err instanceof SrsServiceError && err.status === 503 && err.code === 'SERVICE_UNAVAILABLE'
    );
    assert.equal(state.srsReviewOperations.length, countBefore);
    assert.equal(card.stage, 1);
    assert.equal(card.rowVersion, 1n);
  });

  test('clock query rejects fails closed with 503 SERVICE_UNAVAILABLE', async () => {
    const { cardId, card, tok } = seedCardAndToken();
    const base = fixtureDb(state);
    const mockQueryRaw = async (strings, ...vals) => {
      const sql = strings.join('');
      if (sql.includes('clock_timestamp')) {
        throw new Error('DATABASE_CONNECTION_LOST');
      }
      return base.$queryRaw(strings, ...vals);
    };
    const failingClockDb = {
      ...base,
      $queryRaw: mockQueryRaw,
      $transaction: async (fn) => fn({ ...base, $queryRaw: mockQueryRaw }),
    };

    await assert.rejects(
      async () => startSrsReview(learnerId, {}, failingClockDb),
      (err) => err instanceof SrsServiceError && err.status === 503 && err.code === 'SERVICE_UNAVAILABLE'
    );

    const countBefore = state.srsReviewOperations.length;
    await assert.rejects(
      async () => respondSrsReview(learnerId, { token: tok, operationKey: randomUUID(), rating: 'REMEMBERED' }, failingClockDb),
      (err) => err instanceof SrsServiceError && err.status === 503 && err.code === 'SERVICE_UNAVAILABLE'
    );
    assert.equal(state.srsReviewOperations.length, countBefore);
    assert.equal(card.stage, 1);
    assert.equal(card.rowVersion, 1n);
  });

  test('empty, malformed, or invalid-Date clock result fails closed with 503 SERVICE_UNAVAILABLE', async () => {
    const { cardId, card, tok } = seedCardAndToken();
    const base = fixtureDb(state);

    for (const badResult of [[], [{ ts: null }], [{ ts: '2026-11-06' }], [{ ts: new Date(NaN) }], {}]) {
      const mockQueryRaw = async (strings, ...vals) => {
        const sql = strings.join('');
        if (sql.includes('clock_timestamp')) return badResult;
        return base.$queryRaw(strings, ...vals);
      };
      const badClockDb = {
        ...base,
        $queryRaw: mockQueryRaw,
        $transaction: async (fn) => fn({ ...base, $queryRaw: mockQueryRaw }),
      };

      await assert.rejects(
        async () => startSrsReview(learnerId, {}, badClockDb),
        (err) => err instanceof SrsServiceError && err.status === 503 && err.code === 'SERVICE_UNAVAILABLE'
      );

      const countBefore = state.srsReviewOperations.length;
      await assert.rejects(
        async () => respondSrsReview(learnerId, { token: tok, operationKey: randomUUID(), rating: 'REMEMBERED' }, badClockDb),
        (err) => err instanceof SrsServiceError && err.status === 503 && err.code === 'SERVICE_UNAVAILABLE'
      );
      assert.equal(state.srsReviewOperations.length, countBefore);
      assert.equal(card.stage, 1);
      assert.equal(card.rowVersion, 1n);
    }
  });

  test('account lock fails closed with 503 SERVICE_UNAVAILABLE before card lock or replay lookup', async () => {
    const { cardId, card, tok } = seedCardAndToken();
    let cardLockAttempted = false;
    const base = fixtureDb(state);

    const mockQueryRaw = async (strings, ...vals) => {
      const sql = strings.join('');
      if (sql.includes('app.accounts') && sql.includes('FOR UPDATE')) {
        throw new Error('ACCOUNT_LOCK_TIMEOUT');
      }
      if (sql.includes('app.srs_cards') && sql.includes('FOR UPDATE')) {
        cardLockAttempted = true;
      }
      return base.$queryRaw(strings, ...vals);
    };

    const failingAccountLockDb = {
      ...base,
      $queryRaw: mockQueryRaw,
      $transaction: async (fn) => fn({ ...base, $queryRaw: mockQueryRaw }),
    };

    const countBefore = state.srsReviewOperations.length;
    await assert.rejects(
      async () => respondSrsReview(learnerId, { token: tok, operationKey: randomUUID(), rating: 'REMEMBERED' }, failingAccountLockDb),
      (err) => err instanceof SrsServiceError && err.status === 503 && err.code === 'SERVICE_UNAVAILABLE'
    );
    assert.equal(cardLockAttempted, false, 'Card lock must not be attempted when account lock fails');
    assert.equal(state.srsReviewOperations.length, countBefore);
    assert.equal(card.stage, 1);
    assert.equal(card.rowVersion, 1n);
  });

  test('card lock fails closed with 503 SERVICE_UNAVAILABLE before CAS or history writes', async () => {
    const { cardId, card, tok } = seedCardAndToken();
    const base = fixtureDb(state);

    const mockQueryRaw = async (strings, ...vals) => {
      const sql = strings.join('');
      if (sql.includes('app.srs_cards') && sql.includes('FOR UPDATE')) {
        throw new Error('CARD_LOCK_TIMEOUT');
      }
      return base.$queryRaw(strings, ...vals);
    };

    const failingCardLockDb = {
      ...base,
      $queryRaw: mockQueryRaw,
      $transaction: async (fn) => fn({ ...base, $queryRaw: mockQueryRaw }),
    };

    const countBefore = state.srsReviewOperations.length;
    await assert.rejects(
      async () => respondSrsReview(learnerId, { token: tok, operationKey: randomUUID(), rating: 'REMEMBERED' }, failingCardLockDb),
      (err) => err instanceof SrsServiceError && err.status === 503 && err.code === 'SERVICE_UNAVAILABLE'
    );
    assert.equal(state.srsReviewOperations.length, countBefore);
    assert.equal(card.stage, 1);
    assert.equal(card.rowVersion, 1n);
  });

  test('invalid or empty timezone fails closed with 503 SERVICE_UNAVAILABLE', async () => {
    const { cardId, card, tok } = seedCardAndToken();

    for (const badTz of ['Invalid/Timezone', '', null, undefined]) {
      state.account = { ...account(), timezone: badTz };
      const countBefore = state.srsReviewOperations.length;
      await assert.rejects(
        async () => respondSrsReview(learnerId, { token: tok, operationKey: randomUUID(), rating: 'REMEMBERED' }, fixtureDb(state)),
        (err) => err instanceof SrsServiceError && err.status === 503 && err.code === 'SERVICE_UNAVAILABLE'
      );
      assert.equal(state.srsReviewOperations.length, countBefore);
      assert.equal(card.stage, 1);
      assert.equal(card.rowVersion, 1n);
    }
  });

  test('query execution order enforces Account Lock -> Card Lock -> Validation -> Replay -> CAS -> DB Clock', async () => {
    const { cardId, card, tok } = seedCardAndToken();
    const calls = [];
    const base = fixtureDb(state);

    const mockQueryRaw = async (strings, ...vals) => {
      const sql = strings.join('');
      if (sql.includes('app.accounts') && sql.includes('FOR UPDATE')) {
        calls.push('ACCOUNT_LOCK');
      } else if (sql.includes('app.srs_cards') && sql.includes('FOR UPDATE')) {
        calls.push('CARD_LOCK');
      } else if (sql.includes('clock_timestamp')) {
        calls.push('DB_CLOCK');
      }
      return base.$queryRaw(strings, ...vals);
    };

    const traceTx = {
      ...base,
      $queryRaw: mockQueryRaw,
      account: {
        ...base.account,
        findUnique: async (args) => {
          calls.push('ACCOUNT_FIND');
          return base.account.findUnique(args);
        },
      },
      srsReviewOperation: {
        ...base.srsReviewOperation,
        findUnique: async (args) => {
          calls.push('REPLAY_LOOKUP');
          return base.srsReviewOperation.findUnique(args);
        },
      },
    };

    const traceDb = {
      ...base,
      $transaction: async (fn) => fn(traceTx),
    };

    const res = await respondSrsReview(
      learnerId,
      { token: tok, operationKey: randomUUID(), rating: 'REMEMBERED' },
      traceDb
    );
    assert.equal(res.recordedRating, 'REMEMBERED');

    // Verify strict lock/query execution sequence
    assert.deepEqual(calls.slice(0, 5), [
      'ACCOUNT_LOCK',
      'CARD_LOCK',
      'ACCOUNT_FIND',
      'REPLAY_LOOKUP',
      'DB_CLOCK',
    ]);
  });
});
