import { test, describe, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import { getLearnerCookieName } from '../../src/server/auth/env.ts';
import {
  learnerId,
  otherLearnerId,
  contextId,
  lesson1Id,
  lesson2Id,
  revision1Id,
  revision2Id,
  account,
  contextRow,
  unitRow,
  lessonRow,
  lesson2Row,
  exercisesRows,
  vocabularyRows,
  setupEnv,
  fixtureDb,
  providerDouble,
  token,
  confirmedUser,
  fixtureEmail,
  providerOrigin,
} from './harness/learner-fixture.mjs';
import {
  normalizePracticeText,
  gradePracticeExercise,
  computeInputHash,
} from '../../src/server/lessons/grader.ts';

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

const attemptsRoute = await import('../../src/app/api/learner/contexts/[contextId]/lessons/[lessonId]/attempts/route.ts');
const attemptDetailRoute = await import('../../src/app/api/learner/contexts/[contextId]/lessons/[lessonId]/attempts/[attemptId]/route.ts');
const responsesRoute = await import('../../src/app/api/learner/contexts/[contextId]/lessons/[lessonId]/attempts/[attemptId]/responses/route.ts');
const finalizeRoute = await import('../../src/app/api/learner/contexts/[contextId]/lessons/[lessonId]/attempts/[attemptId]/finalize/route.ts');

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
    Origin: 'http://localhost:3000',
    Host: 'localhost:3000',
    'Content-Type': 'application/json',
  };
}

describe('Slice 11: Grader & Decision D1 Normalization', () => {
  test('D1: Unicode NFC normalization compares composed and decomposed characters equally', () => {
    // Composed 'é' (\u00e9) vs Decomposed 'e' + combining acute (\u0065\u0301)
    const composed = 'caf\u00e9';
    const decomposed = 'cafe\u0301';
    assert.notEqual(composed, decomposed); // Different raw strings
    assert.equal(
      normalizePracticeText(composed, true),
      normalizePracticeText(decomposed, true)
    );
  });

  test('D1: outer whitespace is trimmed, internal whitespace is preserved', () => {
    assert.equal(normalizePracticeText('  bonjour   ', false), 'bonjour');
    assert.equal(normalizePracticeText('  un   deux  ', false), 'un   deux'); // internal whitespace preserved
    assert.notEqual(normalizePracticeText('un   deux', false), normalizePracticeText('un deux', false));
  });

  test('D1: case sensitivity mode respected', () => {
    assert.equal(normalizePracticeText('Hello World', false), 'hello world');
    assert.equal(normalizePracticeText('Hello World', true), 'Hello World');
    assert.notEqual(normalizePracticeText('Hello', true), normalizePracticeText('hello', true));
  });

  test('D1: punctuation and accents are preserved', () => {
    assert.equal(normalizePracticeText('¿Cómo estás?', false), '¿cómo estás?');
    assert.notEqual(normalizePracticeText('¿Cómo estás?', false), normalizePracticeText('Como estas', false));
  });

  test('Grader: MCQ grading and validation', () => {
    const prompt = { options: [{ id: 'opt-1', text: 'A' }, { id: 'opt-2', text: 'B' }] };
    const secret = { correctOptionId: 'opt-1' };

    // Correct
    const res1 = gradePracticeExercise('MCQ', prompt, secret, { optionId: 'opt-1' });
    assert.equal(res1.isCorrect, true);
    assert.equal(res1.formativeFeedback, 'Chính xác!');

    // Wrong
    const res2 = gradePracticeExercise('MCQ', prompt, secret, { optionId: 'opt-2' });
    assert.equal(res2.isCorrect, false);
    assert.equal(res2.formativeFeedback, 'Chưa chính xác.');

    // Foreign option
    assert.throws(
      () => gradePracticeExercise('MCQ', prompt, secret, { optionId: 'foreign-opt' }),
      (err) => err.error.code === 'INVALID_OPTION'
    );

    // Malformed input
    assert.throws(() => gradePracticeExercise('MCQ', prompt, secret, {}), (err) => err.error.code === 'VALIDATION_ERROR');
    assert.throws(() => gradePracticeExercise('MCQ', prompt, secret, { optionId: ' ' }), (err) => err.error.code === 'VALIDATION_ERROR');
  });

  test('Grader: LISTENING deterministic choice grading and transcript secrecy', () => {
    const prompt = { options: [{ id: 'opt-1', text: 'A' }, { id: 'opt-2', text: 'B' }], audioUrl: 'https://cdn.example.com/a.mp3' };
    const secret = { correctOptionId: 'opt-1', transcript: 'Confidential transcript' };

    const res = gradePracticeExercise('LISTENING', prompt, secret, { optionId: 'opt-1' });
    assert.equal(res.isCorrect, true);
    // Transcript must not appear anywhere in formative feedback or validatedInput
    assert.ok(!JSON.stringify(res).includes('Confidential transcript'));
  });

  test('Grader: REORDER permutation validation and exact position comparison', () => {
    const prompt = { tokens: [{ id: 't1', text: 'I' }, { id: 't2', text: 'am' }, { id: 't3', text: 'here' }] };
    const secret = { correctOrder: ['t1', 't2', 't3'] };

    // Correct permutation
    const resCorrect = gradePracticeExercise('REORDER', prompt, secret, { tokenIds: ['t1', 't2', 't3'] });
    assert.equal(resCorrect.isCorrect, true);

    // Wrong permutation
    const resWrong = gradePracticeExercise('REORDER', prompt, secret, { tokenIds: ['t2', 't1', 't3'] });
    assert.equal(resWrong.isCorrect, false);

    // Missing token
    assert.throws(() => gradePracticeExercise('REORDER', prompt, secret, { tokenIds: ['t1', 't2'] }), (err) => err.error.code === 'INVALID_PERMUTATION');

    // Duplicate token
    assert.throws(() => gradePracticeExercise('REORDER', prompt, secret, { tokenIds: ['t1', 't1', 't3'] }), (err) => err.error.code === 'INVALID_PERMUTATION');

    // Foreign token
    assert.throws(() => gradePracticeExercise('REORDER', prompt, secret, { tokenIds: ['t1', 't2', 'foreign'] }), (err) => err.error.code === 'INVALID_PERMUTATION');
  });

  test('Grader: FILL_BLANK & GRAMMAR multiple alternatives and blank rejection', () => {
    const prompt = { prompt: 'Fill in blank', sentence: 'Hello ____.' };
    const secret = { acceptedAnswers: ['world', 'there', 'everyone'], caseSensitive: false };

    // Matches first alternative
    assert.equal(gradePracticeExercise('FILL_BLANK', prompt, secret, { text: 'world' }).isCorrect, true);
    // Matches second alternative with case folding
    assert.equal(gradePracticeExercise('FILL_BLANK', prompt, secret, { text: '  THERE  ' }).isCorrect, true);
    // Wrong answer
    assert.equal(gradePracticeExercise('FILL_BLANK', prompt, secret, { text: 'friend' }).isCorrect, false);

    // Blank / whitespace-only rejected with 400
    assert.throws(() => gradePracticeExercise('FILL_BLANK', prompt, secret, { text: '' }), (err) => err.error.code === 'VALIDATION_ERROR');
    assert.throws(() => gradePracticeExercise('FILL_BLANK', prompt, secret, { text: '   ' }), (err) => err.error.code === 'VALIDATION_ERROR');
  });
});

describe('Slice 11: Practice Attempt Lifecycle & Routes', () => {
  beforeEach(() => {
    setupEnv();
    setAuthenticatedCookie();
    state = {
      account: account(),
      contexts: [contextRow()],
      units: [unitRow()],
      lessons: [lessonRow(), lesson2Row()],
      exercises: exercisesRows(),
      vocabulary: vocabularyRows(),
      completions: [],
      consumptions: [],
      attempts: [],
      responses: [],
      srsCards: [],
      commandReceipts: [],
    };
    globalThis.fetch = providerDouble(state);
    setLearnerPrismaForTest(fixtureDb(state));
  });

  test('POST /attempts: valid start returns safe PracticeAttemptDto and pins exact revision', async () => {
    const attemptId = randomUUID();
    const req = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        attemptId,
        expectedPublishedRevisionId: revision1Id,
      }),
    });

    const res = await attemptsRoute.POST(req, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    const data = body.data;

    assert.equal(data.id, attemptId);
    assert.equal(data.contextId, contextId);
    assert.equal(data.lessonId, lesson1Id);
    assert.equal(data.lessonRevisionId, revision1Id);
    assert.equal(data.nCore, 5); // 5 core exercises in fixture
    assert.equal(data.isCompleted, false);
    assert.equal(data.isStale, false);
    assert.equal(data.score, null);
    assert.equal(data.responses.length, 0);
    assert.ok(data.nextExercise);
    assert.equal(data.nextExercise.id, 'ex-mcq-1');
    assert.equal(data.nextOrdinal, 1);
    assert.equal(data.queuePosition, 1);

    // Answer secrecy scan on serialized JSON
    const serialized = JSON.stringify(body);
    assert.ok(!serialized.includes('correctOptionId'), 'Must not leak correctOptionId');
    assert.ok(!serialized.includes('acceptedAnswers'), 'Must not leak acceptedAnswers');
    assert.ok(!serialized.includes('Confidential transcript'), 'Must not leak transcript');
    assert.ok(!serialized.includes('gradingSecret'), 'Must not leak gradingSecret');
  });

  test('POST /attempts: same UUID + same scope is committed replay; conflicting scope fails 409', async () => {
    const attemptId = randomUUID();
    const payload = { attemptId, expectedPublishedRevisionId: revision1Id };

    const req1 = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const res1 = await attemptsRoute.POST(req1, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(res1.status, 200);

    // Replay same UUID and same scope
    const req2 = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const res2 = await attemptsRoute.POST(req2, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    assert.equal(body2.data.id, attemptId);
    assert.equal(state.attempts.length, 1, 'Replay must not duplicate attempt in DB');

    // Conflicting scope with same UUID
    const reqConflict = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson2Id}/attempts`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ attemptId, expectedPublishedRevisionId: revision2Id }),
    });
    const resConflict = await attemptsRoute.POST(reqConflict, { params: Promise.resolve({ contextId, lessonId: lesson2Id }) });
    assert.equal(resConflict.status, 409);
  });

  test('POST /attempts: stale pointer expectedPublishedRevisionId returns 409 PUBLICATION_CHANGED', async () => {
    const req = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        attemptId: randomUUID(),
        expectedPublishedRevisionId: randomUUID(), // Stale / unknown revision
      }),
    });
    const res = await attemptsRoute.POST(req, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, 'PUBLICATION_CHANGED');
  });

  test('POST /attempts: authorization & role checks (Admin, Teacher, Disabled, Unauthenticated)', async () => {
    const attemptId = randomUUID();
    const payload = JSON.stringify({ attemptId, expectedPublishedRevisionId: revision1Id });

    // 1. Unauthenticated
    clearCookieStore();
    const reqUnauth = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts`, {
      method: 'POST',
      headers: { Host: 'localhost:3000', Origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
      body: payload,
    });
    assert.equal((await attemptsRoute.POST(reqUnauth, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) })).status, 401);
    setAuthenticatedCookie();

    // 2. Admin role denied
    state.account.role = 'ADMIN';
    const reqAdmin = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts`, {
      method: 'POST',
      headers: authHeaders(),
      body: payload,
    });
    assert.equal((await attemptsRoute.POST(reqAdmin, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) })).status, 403);

    // 3. Teacher role denied
    state.account.role = 'TEACHER';
    assert.equal((await attemptsRoute.POST(reqAdmin, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) })).status, 403);

    // 4. Disabled learner denied
    state.account.role = 'LEARNER';
    state.account.status = 'DISABLED';
    assert.equal((await attemptsRoute.POST(reqAdmin, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) })).status, 403);

    // 5. Cross-learner context isolation
    state.account.status = 'ACTIVE';
    state.contexts[0].learnerId = otherLearnerId; // Belongs to different learner
    assert.equal((await attemptsRoute.POST(reqAdmin, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) })).status, 404);
  });

  test('GET /attempts/[attemptId]: owner returns safe DTO with no-store; cross-learner returns 404', async () => {
    const attemptId = randomUUID();
    // Create attempt first
    state.attempts.push({
      id: attemptId,
      contextId,
      lessonId: lesson1Id,
      lessonRevisionId: revision1Id,
      nCore: 5,
      startedAt: new Date(),
      completedAt: null,
      kFirstWrong: null,
      contributionUnits: null,
      responseCount: null,
      rowVersion: 1n,
    });

    const req = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}`, {
      headers: authHeaders(),
    });

    const res = await attemptDetailRoute.GET(req, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('cache-control'), 'no-store, private');
    const body = await res.json();
    assert.equal(body.data.id, attemptId);
    assert.equal(body.data.isCompleted, false);

    // Cross-learner attempt
    const foreignAttemptId = randomUUID();
    const resForeign = await attemptDetailRoute.GET(req, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId: foreignAttemptId }) });
    assert.equal(resForeign.status, 404);
  });

  test('Full Queue Progression: N core first responses, K retries, units, and deterministic replay', async () => {
    const attemptId = randomUUID();
    // Start attempt
    state.attempts.push({
      id: attemptId,
      contextId,
      lessonId: lesson1Id,
      lessonRevisionId: revision1Id,
      nCore: 5,
      startedAt: new Date(),
      completedAt: null,
      kFirstWrong: null,
      contributionUnits: null,
      responseCount: null,
      rowVersion: 1n,
    });

    // 1. Submit Q1 (MCQ: correct -> 2 units)
    const op1 = randomUUID();
    const reqQ1 = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}/responses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        operationKey: op1,
        lessonExerciseId: 'ex-mcq-1',
        input: { optionId: 'opt-1' },
      }),
    });
    const resQ1 = await responsesRoute.POST(reqQ1, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) });
    assert.equal(resQ1.status, 200);
    const bodyQ1 = await resQ1.json();
    assert.equal(bodyQ1.data.response.isCorrect, true);
    assert.equal(bodyQ1.data.response.contributionUnits, 2);
    assert.equal(bodyQ1.data.response.queuePosition, 1);
    assert.equal(bodyQ1.data.response.responseOrdinal, 1);
    assert.equal(bodyQ1.data.attempt.nextExercise.id, 'ex-fill-2');

    // Replay Q1 exact operationKey -> returns recorded result, does NOT advance queue
    const reqQ1Replay = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}/responses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        operationKey: op1,
        lessonExerciseId: 'ex-mcq-1',
        input: { optionId: 'opt-1' },
      }),
    });
    const resQ1Replay = await responsesRoute.POST(reqQ1Replay, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) });
    assert.equal(resQ1Replay.status, 200);
    const bodyQ1Replay = await resQ1Replay.json();
    assert.equal(bodyQ1Replay.data.response.id, bodyQ1.data.response.id);
    assert.equal(bodyQ1Replay.data.attempt.nextExercise.id, 'ex-fill-2');

    // Conflicting payload for same operationKey -> 409
    const reqQ1Conflict = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}/responses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        operationKey: op1,
        lessonExerciseId: 'ex-mcq-1',
        input: { optionId: 'opt-2' }, // different input
      }),
    });
    const resQ1Conflict = await responsesRoute.POST(reqQ1Conflict, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) });
    assert.equal(resQ1Conflict.status, 409);

    // Out of order submission attempt: try to submit Q3 instead of Q2 -> 400 INVALID_QUEUE_EXERCISE
    const reqOutOfOrder = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}/responses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        operationKey: randomUUID(),
        lessonExerciseId: 'ex-reorder-3',
        input: { tokenIds: ['t-1', 't-2', 't-3'] },
      }),
    });
    const resOutOfOrder = await responsesRoute.POST(reqOutOfOrder, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) });
    assert.equal(resOutOfOrder.status, 400);

    // 2. Submit Q2 (FILL_BLANK: WRONG -> 0 units)
    const reqQ2 = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}/responses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        operationKey: randomUUID(),
        lessonExerciseId: 'ex-fill-2',
        input: { text: 'wrong' },
      }),
    });
    const resQ2 = await responsesRoute.POST(reqQ2, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) });
    assert.equal(resQ2.status, 200);
    const bodyQ2 = await resQ2.json();
    assert.equal(bodyQ2.data.response.isCorrect, false);
    assert.equal(bodyQ2.data.response.contributionUnits, 0);

    // 3. Submit Q3 (REORDER: correct -> 2 units)
    const reqQ3 = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}/responses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        operationKey: randomUUID(),
        lessonExerciseId: 'ex-reorder-3',
        input: { tokenIds: ['t-1', 't-2', 't-3'] },
      }),
    });
    const resQ3 = await responsesRoute.POST(reqQ3, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) });
    assert.equal(resQ3.status, 200);

    // 4. Submit Q4 (LISTENING: WRONG -> 0 units)
    const reqQ4 = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}/responses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        operationKey: randomUUID(),
        lessonExerciseId: 'ex-listen-4',
        input: { optionId: 'opt-l2' }, // wrong
      }),
    });
    const resQ4 = await responsesRoute.POST(reqQ4, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) });
    assert.equal(resQ4.status, 200);

    // 5. Submit Q5 (GRAMMAR: correct -> 2 units)
    const reqQ5 = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}/responses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        operationKey: randomUUID(),
        lessonExerciseId: 'ex-grammar-5',
        input: { text: 'Subject + To Be + Noun' },
      }),
    });
    const resQ5 = await responsesRoute.POST(reqQ5, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) });
    assert.equal(resQ5.status, 200);
    const bodyQ5 = await resQ5.json();

    // Now all 5 first-pass exercises answered.
    // Q2 and Q4 were wrong (K = 2). Next in queue MUST be Q2 retry (ordinal 2)!
    assert.ok(bodyQ5.data.attempt.nextExercise);
    assert.equal(bodyQ5.data.attempt.nextExercise.id, 'ex-fill-2');
    assert.equal(bodyQ5.data.attempt.nextOrdinal, 2);
    assert.equal(bodyQ5.data.attempt.queuePosition, 6);

    // 6. Submit Q2 retry (ordinal 2: correct -> 1 unit)
    const reqQ2Retry = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}/responses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        operationKey: randomUUID(),
        lessonExerciseId: 'ex-fill-2',
        input: { text: 'meet' },
      }),
    });
    const resQ2Retry = await responsesRoute.POST(reqQ2Retry, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) });
    assert.equal(resQ2Retry.status, 200);
    const bodyQ2Retry = await resQ2Retry.json();
    assert.equal(bodyQ2Retry.data.response.isCorrect, true);
    assert.equal(bodyQ2Retry.data.response.responseOrdinal, 2);
    assert.equal(bodyQ2Retry.data.response.contributionUnits, 1);
    assert.equal(bodyQ2Retry.data.attempt.nextExercise.id, 'ex-listen-4');
    assert.equal(bodyQ2Retry.data.attempt.nextOrdinal, 2);
    assert.equal(bodyQ2Retry.data.attempt.queuePosition, 7);

    // 7. Submit Q4 retry (ordinal 2: WRONG again -> 0 units)
    const reqQ4Retry = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}/responses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        operationKey: randomUUID(),
        lessonExerciseId: 'ex-listen-4',
        input: { optionId: 'opt-l2' },
      }),
    });
    const resQ4Retry = await responsesRoute.POST(reqQ4Retry, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) });
    assert.equal(resQ4Retry.status, 200);
    const bodyQ4Retry = await resQ4Retry.json();
    assert.equal(bodyQ4Retry.data.response.isCorrect, false);
    assert.equal(bodyQ4Retry.data.response.responseOrdinal, 2);
    assert.equal(bodyQ4Retry.data.response.contributionUnits, 0);

    // All N + K = 7 responses answered! Queue is now complete.
    assert.equal(bodyQ4Retry.data.attempt.nextExercise, null);
    assert.equal(bodyQ4Retry.data.attempt.nextOrdinal, null);

    // Attempting another response rejected with 400 QUEUE_COMPLETED
    const reqExtra = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}/responses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        operationKey: randomUUID(),
        lessonExerciseId: 'ex-mcq-1',
        input: { optionId: 'opt-1' },
      }),
    });
    assert.equal((await responsesRoute.POST(reqExtra, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) })).status, 400);

    // 8. Finalize Attempt
    // Total units: Q1(2) + Q2(0) + Q3(2) + Q4(0) + Q5(2) + Q2_retry(1) + Q4_retry(0) = 7 units.
    // Max units: 2 * (N + K) = 2 * (5 + 2) = 14 units.
    const finalizeOp = randomUUID();
    const reqFinalize = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}/finalize`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ operationKey: finalizeOp }),
    });
    const resFinalize = await finalizeRoute.POST(reqFinalize, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) });
    assert.equal(resFinalize.status, 200);
    const bodyFin = await resFinalize.json();

    assert.equal(bodyFin.data.isFirstCompletion, true);
    assert.equal(bodyFin.data.attempt.isCompleted, true);
    assert.equal(bodyFin.data.attempt.contributionUnits, 7);
    assert.equal(bodyFin.data.attempt.kFirstWrong, 2);
    assert.equal(bodyFin.data.attempt.responseCount, 7);
    assert.deepEqual(bodyFin.data.attempt.score, {
      contributionUnits: 7,
      maxUnits: 14,
      percentage: 50,
    });

    // Verify DB side-effects:
    // a) First completion in lesson_completions
    assert.equal(state.completions.length, 1);
    assert.equal(state.completions[0].firstAttemptId, attemptId);
    // b) Core vocabulary enrolled into srs_cards (stage 1, sourceAttemptId)
    assert.equal(state.srsCards.length, 1);
    assert.equal(state.srsCards[0].stage, 1);
    assert.equal(state.srsCards[0].enrollmentSource, 'CORE_COMPLETION');
    assert.equal(state.srsCards[0].sourceAttemptId, attemptId);
    // c) Command receipt recorded
    assert.equal(state.commandReceipts.length, 1);
    assert.equal(state.commandReceipts[0].command, 'COMPLETE_LESSON');

    // 9. Finalized attempt is immutable: new response rejected with 409 ATTEMPT_ALREADY_FINALIZED
    const reqAfterFin = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}/responses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        operationKey: randomUUID(),
        lessonExerciseId: 'ex-mcq-1',
        input: { optionId: 'opt-1' },
      }),
    });
    const resAfterFin = await responsesRoute.POST(reqAfterFin, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) });
    assert.equal(resAfterFin.status, 409);

    // 10. Committed replay of finalize returns safe result
    const reqFinReplay = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}/finalize`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ operationKey: finalizeOp }),
    });
    const resFinReplay = await finalizeRoute.POST(reqFinReplay, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) });
    assert.equal(resFinReplay.status, 200);
    const bodyFinReplay = await resFinReplay.json();
    assert.equal(bodyFinReplay.data.attempt.id, attemptId);
  });

  test('D3: Stale attempt after publication X -> Y rejects new writes but allows committed replays', async () => {
    const attemptId = randomUUID();
    state.attempts.push({
      id: attemptId,
      contextId,
      lessonId: lesson1Id,
      lessonRevisionId: revision1Id,
      nCore: 5,
      startedAt: new Date(),
      completedAt: null,
      kFirstWrong: null,
      contributionUnits: null,
      responseCount: null,
      rowVersion: 1n,
    });

    // Submit one response on X
    const op1 = randomUUID();
    const reqQ1 = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}/responses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        operationKey: op1,
        lessonExerciseId: 'ex-mcq-1',
        input: { optionId: 'opt-1' },
      }),
    });
    const resQ1 = await responsesRoute.POST(reqQ1, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) });
    assert.equal(resQ1.status, 200);

    // Now Teacher publishes Y!
    const newRevYId = randomUUID();
    state.lessons[0].activeRevisionId = newRevYId;
    state.lessons[0].activeRevision = {
      id: newRevYId,
      lessonId: lesson1Id,
      revisionNo: 2,
      status: 'PUBLISHED',
      title: { vi: 'Bài 1 (Y)' },
      contentBlocks: [],
      topicIds: [],
      skillIds: [],
      purposeTags: [],
    };

    // 1. New response on X must be rejected with 409 PUBLICATION_CHANGED
    const reqNewResponse = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}/responses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        operationKey: randomUUID(),
        lessonExerciseId: 'ex-fill-2',
        input: { text: 'meet' },
      }),
    });
    const resNew = await responsesRoute.POST(reqNewResponse, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) });
    assert.equal(resNew.status, 409);
    assert.equal((await resNew.json()).error.code, 'PUBLICATION_CHANGED');

    // 2. Exact authorized committed-operation replay of op1 succeeds despite publication change (D3)
    const reqQ1Replay = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}/responses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        operationKey: op1,
        lessonExerciseId: 'ex-mcq-1',
        input: { optionId: 'opt-1' },
      }),
    });
    const resReplay = await responsesRoute.POST(reqQ1Replay, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) });
    assert.equal(resReplay.status, 200);

    // 3. GET attempt on X shows isStale = true
    const reqDetail = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}`, {
      headers: authHeaders(),
    });
    const resDetail = await attemptDetailRoute.GET(reqDetail, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) });
    assert.equal(resDetail.status, 200);
    assert.equal((await resDetail.json()).data.isStale, true);
  });

  test('D2: Existing SRS cards remain completely unchanged upon core enrollment (no-reset)', async () => {
    // Pre-insert an existing SRS card at stage 3 with custom dueAt
    const existingDueAt = new Date('2026-12-01T00:00:00Z');
    state.srsCards.push({
      id: 'existing-card-1',
      learnerId,
      vocabularyId: 'vocab-concept-1',
      stage: 3,
      dueAt: existingDueAt,
      lastReviewedAt: new Date('2026-10-30T00:00:00Z'),
      enrollmentSource: 'CORE_COMPLETION',
      sourceAttemptId: randomUUID(),
      sourceLessonVocabularyId: 'vocab-link-1',
      createdAt: new Date('2026-10-20T00:00:00Z'),
      updatedAt: new Date('2026-10-30T00:00:00Z'),
      rowVersion: 5n,
    });

    const attemptId = randomUUID();
    state.attempts.push({
      id: attemptId,
      contextId,
      lessonId: lesson1Id,
      lessonRevisionId: revision1Id,
      nCore: 1, // pretend 1 core
      startedAt: new Date(),
      completedAt: null,
      kFirstWrong: null,
      contributionUnits: null,
      responseCount: null,
      rowVersion: 1n,
    });
    // Add 1 response
    state.responses.push({
      id: randomUUID(),
      attemptId,
      lessonExerciseId: 'ex-mcq-1',
      lessonRevisionId: revision1Id,
      responseOrdinal: 1,
      queuePosition: 1,
      operationKey: randomUUID(),
      input: { optionId: 'opt-1' },
      inputHash: 'dummy',
      isCorrect: true,
      contributionUnits: 2,
      respondedAt: new Date(),
    });
    // Set only 1 exercise in revision for this test
    state.exercises = [state.exercises[0]];

    const reqFin = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/lessons/${lesson1Id}/attempts/${attemptId}/finalize`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ operationKey: randomUUID() }),
    });
    const resFin = await finalizeRoute.POST(reqFin, { params: Promise.resolve({ contextId, lessonId: lesson1Id, attemptId }) });
    assert.equal(resFin.status, 200);

    // Existing card must NOT be overwritten or reset!
    assert.equal(state.srsCards.length, 1);
    const card = state.srsCards[0];
    assert.equal(card.id, 'existing-card-1');
    assert.equal(card.stage, 3, 'Existing stage must remain 3');
    assert.equal(card.rowVersion, 5n, 'Existing rowVersion must remain 5');
    assert.equal(card.dueAt.toISOString(), existingDueAt.toISOString(), 'Existing dueAt must remain unchanged');
  });
});
