import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
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
const consumptionRoute = await import('../../src/app/api/learner/contexts/[contextId]/lessons/[lessonId]/consumption/route.ts');

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
  };
}

describe('Slice 10: Learner Lesson Catalogue, Detail & Consumption', () => {
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
    };
    setLearnerPrismaForTest(fixtureDb(state));
    globalThis.fetch = providerDouble(state);
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    setLearnerPrismaForTest(null);
    clearCookieStore();
  });

  // ===========================================================================
  // 1. Success & Denial Matrix
  // ===========================================================================

  test('401: Unauthenticated request is rejected on all lesson endpoints', async () => {
    clearCookieStore();

    const unauthReq = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons', {
      headers: { Host: 'localhost:3000', Origin: 'http://localhost:3000' },
    });
    const resCat = await lessonsRoute.GET(unauthReq, { params: Promise.resolve({ contextId }) });
    assert.equal(resCat.status, 401);

    const resDetail = await lessonDetailRoute.GET(unauthReq, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(resDetail.status, 401);

    const resConsGet = await consumptionRoute.GET(unauthReq, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(resConsGet.status, 401);

    const postReq = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons/' + lesson1Id + '/consumption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000', Host: 'localhost:3000' },
      body: JSON.stringify({ action: 'start', expectedPublishedRevisionId: revision1Id }),
    });
    const resConsPost = await consumptionRoute.POST(postReq, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(resConsPost.status, 401);
  });

  test('403: Inactive account or non-learner role is rejected', async () => {
    // Disabled account
    state.account.status = 'DISABLED';
    const req = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons', {
      headers: authHeaders(),
    });
    const resDisabled = await lessonsRoute.GET(req, { params: Promise.resolve({ contextId }) });
    assert.equal(resDisabled.status, 403);

    // Teacher role
    state.account.status = 'ACTIVE';
    state.account.role = 'TEACHER';
    const resTeacher = await lessonsRoute.GET(req, { params: Promise.resolve({ contextId }) });
    assert.equal(resTeacher.status, 403);

    // Admin role
    state.account.role = 'ADMIN';
    const resAdmin = await lessonsRoute.GET(req, { params: Promise.resolve({ contextId }) });
    assert.equal(resAdmin.status, 403);
  });

  test('403: Paused context is rejected', async () => {
    state.contexts[0].status = 'PAUSED';
    const req = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons', {
      headers: authHeaders(),
    });
    const res = await lessonsRoute.GET(req, { params: Promise.resolve({ contextId }) });
    assert.equal(res.status, 403);
  });

  test('404: Inaccessible contextId or lessonId returns 404', async () => {
    const unknownCtxId = '11111111-2222-4333-8444-555555555555';
    const req = new Request('http://localhost:3000/api/learner/contexts/' + unknownCtxId + '/lessons', {
      headers: authHeaders(),
    });
    const resUnknownCtx = await lessonsRoute.GET(req, { params: Promise.resolve({ contextId: unknownCtxId }) });
    assert.equal(resUnknownCtx.status, 404);

    const unknownLessonId = '22222222-3333-4444-8555-666666666666';
    const reqDetail = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons/' + unknownLessonId, {
      headers: authHeaders(),
    });
    const resUnknownLesson = await lessonDetailRoute.GET(reqDetail, { params: Promise.resolve({ contextId, lessonId: unknownLessonId }) });
    assert.equal(resUnknownLesson.status, 404);
  });

  test('409: Inconsistent course language or framework join fails closed', async () => {
    // Mismatched course language
    state.contexts[0].course.languageId = '99999999-9999-4999-8999-999999999999';
    const req = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons', {
      headers: authHeaders(),
    });
    const resLangMismatch = await lessonsRoute.GET(req, { params: Promise.resolve({ contextId }) });
    assert.equal(resLangMismatch.status, 409);

    // Reset and test mismatched framework
    state.contexts = [contextRow()];
    state.contexts[0].course.frameworkId = '88888888-8888-4888-8888-888888888888';
    const resFwMismatch = await lessonsRoute.GET(req, { params: Promise.resolve({ contextId }) });
    assert.equal(resFwMismatch.status, 409);
  });

  test('200: Null workingLevel is valid non-actionable state with empty units', async () => {
    state.contexts[0].workingLevelId = null;
    state.contexts[0].workingLevel = null;

    const req = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons', {
      headers: authHeaders(),
    });
    const res = await lessonsRoute.GET(req, { params: Promise.resolve({ contextId }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.units.length, 0);
    assert.match(body.data.message, /Chưa có trình độ học hiện tại/);
  });

  test('200: Catalogue returns ordered units, lessons, badges and lock states', async () => {
    const req = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons', {
      headers: authHeaders(),
    });
    const res = await lessonsRoute.GET(req, { params: Promise.resolve({ contextId }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.units.length, 1);
    const unit = body.data.units[0];
    assert.equal(unit.lessons.length, 2);

    // Lesson 1 is first in working level -> unlocked
    assert.equal(unit.lessons[0].id, lesson1Id);
    assert.equal(unit.lessons[0].isLocked, false);
    assert.equal(unit.lessons[0].readingState, 'NOT_STARTED');

    // Lesson 2 is second in working level and Lesson 1 is not completed -> locked
    assert.equal(unit.lessons[1].id, lesson2Id);
    assert.equal(unit.lessons[1].isLocked, true);
    assert.equal(unit.lessons[1].activeRevisionId, null, 'Locked lesson must not expose activeRevisionId');
    assert.match(unit.lessons[1].lockReason, /Cần hoàn thành bài học trước/);
  });

  // ===========================================================================
  // 2. Canonical Graded Gating (LessonCompletion ONLY)
  // ===========================================================================

  test('Canonical Gating: LessonConsumption does NOT unlock sequential lesson; only LessonCompletion unlocks', async () => {
    // 1. Attempt to read Lesson 2 before Lesson 1 is completed -> 409 LESSON_LOCKED
    const reqDetail2 = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons/' + lesson2Id, {
      headers: authHeaders(),
    });
    const resLocked = await lessonDetailRoute.GET(reqDetail2, { params: Promise.resolve({ contextId, lessonId: lesson2Id }) });
    assert.equal(resLocked.status, 409);
    const errBody = await resLocked.json();
    assert.equal(errBody.error.code, 'LESSON_LOCKED');

    // 2. Mark Lesson 1 as COMPLETED in LessonConsumption (reading completed)
    state.consumptions.push({
      id: 'cons-1',
      contextId,
      lessonId: lesson1Id,
      lessonRevisionId: revision1Id,
      startedAt: new Date(),
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      rowVersion: 2n,
    });

    // 3. Lesson 2 must STILL BE LOCKED! (Reading row alone never unlocks!)
    const resStillLocked = await lessonDetailRoute.GET(reqDetail2, { params: Promise.resolve({ contextId, lessonId: lesson2Id }) });
    assert.equal(resStillLocked.status, 409, 'Lesson 2 must remain locked despite LessonConsumption completion');

    // 4. Now add official canonical LessonCompletion for Lesson 1
    state.completions.push({
      id: 'comp-1',
      contextId,
      lessonId: lesson1Id,
    });

    // 5. Lesson 2 is now officially unlocked!
    const resUnlocked = await lessonDetailRoute.GET(reqDetail2, { params: Promise.resolve({ contextId, lessonId: lesson2Id }) });
    assert.equal(resUnlocked.status, 200, 'Lesson 2 must unlock once LessonCompletion exists for Lesson 1');
  });

  // ===========================================================================
  // 3. Safe Projections & Child Snapshots
  // ===========================================================================

  test('Safe Projections: Detail DTO contains exact promptData and displaySnapshot; never leaks grading secrets', async () => {
    const req = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons/' + lesson1Id, {
      headers: authHeaders(),
    });
    const res = await lessonDetailRoute.GET(req, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    const data = body.data;

    assert.equal(data.lessonId, lesson1Id);
    assert.equal(data.revision.id, revision1Id);
    assert.equal(data.revision.contentBlocks.length, 2);

    // Verify 5 exercise types are present
    assert.equal(data.exercises.length, 5);
    const types = data.exercises.map(e => e.type);
    assert.deepEqual(types, ['MCQ', 'FILL_BLANK', 'REORDER', 'LISTENING', 'GRAMMAR']);

    // Ensure NO grading secrets leaked
    for (const ex of data.exercises) {
      assert.equal(ex.gradingData, undefined);
      assert.equal(ex.feedbackData, undefined);
      assert.equal(ex.gradingSecret, undefined);
      assert.equal(ex.correctOptionId, undefined);
      assert.equal(ex.correctOrder, undefined);
      assert.equal(ex.acceptedAnswers, undefined);
    }

    // Verify vocabulary displaySnapshot
    assert.equal(data.vocabulary.length, 1);
    const vocab = data.vocabulary[0];
    assert.equal(vocab.displaySnapshot.canonicalForm, 'Hello');
    assert.equal(vocab.displaySnapshot.phonetic, 'həˈləʊ');
    assert.equal(vocab.displaySnapshot.meaningLabels.vi, 'Xin chào');
  });

  // ===========================================================================
  // 4. Strict Mutation Validation & Consumption Lifecycle
  // ===========================================================================

  test('POST consumption: rejects foreign origin with 403', async () => {
    const req = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons/' + lesson1Id + '/consumption', {
      method: 'POST',
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/json',
        Origin: 'http://malicious-attacker.com',
      },
      body: JSON.stringify({ action: 'start', expectedPublishedRevisionId: revision1Id }),
    });
    const res = await consumptionRoute.POST(req, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error.code, 'FORBIDDEN_ORIGIN');
  });

  test('POST consumption: rejects non-JSON content-type with 415', async () => {
    const req = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons/' + lesson1Id + '/consumption', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
        ...authHeaders(),
      },
      body: 'invalid-body',
    });
    const res = await consumptionRoute.POST(req, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(res.status, 415);
  });

  test('POST consumption: rejects malformed JSON with 400', async () => {
    const req = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons/' + lesson1Id + '/consumption', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
        ...authHeaders(),
      },
      body: '{ invalid json',
    });
    const res = await consumptionRoute.POST(req, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'MALFORMED_JSON');
  });

  test('POST consumption: rejects unexpected body fields with 400', async () => {
    const req = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons/' + lesson1Id + '/consumption', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
        ...authHeaders(),
      },
      body: JSON.stringify({
        action: 'start',
        expectedPublishedRevisionId: revision1Id,
        learnerId: 'fake-learner-id', // Extra forbidden field
      }),
    });
    const res = await consumptionRoute.POST(req, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });

  test('POST consumption: complete when NOT started returns 409 CONSUMPTION_NOT_STARTED', async () => {
    const req = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons/' + lesson1Id + '/consumption', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
        ...authHeaders(),
      },
      body: JSON.stringify({ action: 'complete', expectedPublishedRevisionId: revision1Id }),
    });
    const res = await consumptionRoute.POST(req, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, 'CONSUMPTION_NOT_STARTED');
    assert.equal(state.consumptions.length, 0, 'Complete must never fabricate start');
  });

  test('POST consumption: start creates IN_PROGRESS version 1; duplicate start is idempotent', async () => {
    const startReq = () =>
      new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons/' + lesson1Id + '/consumption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000',
          Host: 'localhost:3000',
          ...authHeaders(),
        },
        body: JSON.stringify({ action: 'start', expectedPublishedRevisionId: revision1Id }),
      });

    // 1. Initial start
    const res1 = await consumptionRoute.POST(startReq(), { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    assert.equal(body1.data.state, 'IN_PROGRESS');
    assert.equal(body1.data.rowVersion, '1');
    assert.ok(body1.data.startedAt);
    assert.equal(body1.data.completedAt, null);

    const firstStartedAt = body1.data.startedAt;

    // 2. Duplicate start (idempotent)
    const res2 = await consumptionRoute.POST(startReq(), { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    assert.equal(body2.data.state, 'IN_PROGRESS');
    assert.equal(body2.data.rowVersion, '1');
    assert.equal(body2.data.startedAt, firstStartedAt, 'Duplicate start must preserve startedAt timestamp');
  });

  test('POST consumption: complete transitions to COMPLETED version 2; duplicate complete is idempotent', async () => {
    const makeStartReq = () =>
      new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons/' + lesson1Id + '/consumption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000',
          Host: 'localhost:3000',
          ...authHeaders(),
        },
        body: JSON.stringify({ action: 'start', expectedPublishedRevisionId: revision1Id }),
      });
    await consumptionRoute.POST(makeStartReq(), { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });

    const completeReq = () =>
      new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons/' + lesson1Id + '/consumption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000',
          Host: 'localhost:3000',
          ...authHeaders(),
        },
        body: JSON.stringify({ action: 'complete', expectedPublishedRevisionId: revision1Id }),
      });

    // 1. First complete
    const resComp1 = await consumptionRoute.POST(completeReq(), { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(resComp1.status, 200);
    const bodyComp1 = await resComp1.json();
    assert.equal(bodyComp1.data.state, 'COMPLETED');
    assert.equal(bodyComp1.data.rowVersion, '2');
    assert.ok(bodyComp1.data.completedAt);
    const firstCompletedAt = bodyComp1.data.completedAt;

    // 2. Duplicate complete (idempotent)
    const resComp2 = await consumptionRoute.POST(completeReq(), { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(resComp2.status, 200);
    const bodyComp2 = await resComp2.json();
    assert.equal(bodyComp2.data.state, 'COMPLETED');
    assert.equal(bodyComp2.data.rowVersion, '2');
    assert.equal(bodyComp2.data.completedAt, firstCompletedAt, 'Duplicate complete must preserve completedAt timestamp');

    // 3. Start after complete returns COMPLETED verbatim (idempotent)
    const resStartAfterComp = await consumptionRoute.POST(makeStartReq(), { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(resStartAfterComp.status, 200);
    const bodyStartAfter = await resStartAfterComp.json();
    assert.equal(bodyStartAfter.data.state, 'COMPLETED');
    assert.equal(bodyStartAfter.data.rowVersion, '2');
  });

  // ===========================================================================
  // 5. Stale Publication Precondition & Republish X -> Y Isolation
  // ===========================================================================

  test('Republish X -> Y: Stale expectedPublishedRevisionId returns 409 PUBLICATION_CHANGED before any write', async () => {
    // Lesson 1 is republished: activeRevisionId changes from revision1Id to newRevisionY
    const newRevisionY = 'bbbbbbbb-2222-4222-8222-222222222222';
    state.lessons[0].activeRevisionId = newRevisionY;
    state.lessons[0].activeRevision = {
      id: newRevisionY,
      lessonId: lesson1Id,
      revisionNo: 2,
      status: 'PUBLISHED',
      title: { vi: 'Bài 1: Làm quen (Tái bản)', en: 'Lesson 1: Republished' },
      contentBlocks: [{ type: 'paragraph', text: 'Nội dung bản tái bản.' }],
      topicIds: [],
      skillIds: [],
      purposeTags: [],
    };

    // Client sends request with old revision1Id
    const staleReq = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons/' + lesson1Id + '/consumption', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
        ...authHeaders(),
      },
      body: JSON.stringify({ action: 'start', expectedPublishedRevisionId: revision1Id }),
    });

    const res = await consumptionRoute.POST(staleReq, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error.code, 'PUBLICATION_CHANGED');
    assert.equal(state.consumptions.length, 0, 'No consumption row must be created on stale request');
  });

  // ===========================================================================
  // 6. Mandatory Mutation Controls A–G
  // ===========================================================================

  test('Mutation A Control: Must use exact activeRevisionId pointer, not latest revision', async () => {
    // Suppose activeRevisionId is revision1Id, but a newer draft revision exists
    const newerDraftRevision = {
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      lessonId: lesson1Id,
      revisionNo: 2,
      status: 'DRAFT',
      title: { vi: 'Bản nháp 2', en: 'Draft 2' },
      contentBlocks: [{ type: 'paragraph', text: 'Nội dung chưa xuất bản.' }],
    };

    // Ensure lesson activeRevisionId remains revision1Id
    assert.equal(state.lessons[0].activeRevisionId, revision1Id);

    const req = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons/' + lesson1Id, {
      headers: authHeaders(),
    });
    const res = await lessonDetailRoute.GET(req, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(body.data.revision.id, revision1Id, 'Must return exact activeRevisionId');
    assert.notEqual(body.data.revision.id, newerDraftRevision.id, 'Must never return newer draft revision');
  });

  test('Mutation B Control: Context ownership check rejects accessing other learner context', async () => {
    // Context belongs to otherLearnerId
    state.contexts[0].learnerId = otherLearnerId;

    const req = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons', {
      headers: authHeaders(),
    });
    const res = await lessonsRoute.GET(req, { params: Promise.resolve({ contextId }) });
    assert.equal(res.status, 404, 'Must not disclose context belonging to another learner');
  });

  test('Mutation C Control: Consumption ownership check prevents mutating consumption of other context', async () => {
    state.contexts[0].learnerId = otherLearnerId;

    const req = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons/' + lesson1Id + '/consumption', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
        ...authHeaders(),
      },
      body: JSON.stringify({ action: 'start', expectedPublishedRevisionId: revision1Id }),
    });
    const res = await consumptionRoute.POST(req, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(res.status, 404);
  });

  test('Mutation D Control: ACTIVE status guard prevents access when context is paused or course inactive', async () => {
    state.contexts[0].status = 'PAUSED';
    const req = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons/' + lesson1Id, {
      headers: authHeaders(),
    });
    const resPaused = await lessonDetailRoute.GET(req, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(resPaused.status, 403);

    state.contexts[0].status = 'ACTIVE';
    state.contexts[0].course.isActive = false;
    const resInactiveCourse = await lessonDetailRoute.GET(req, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(resInactiveCourse.status, 403);
  });

  test('Mutation E Control: Lesson availability guard rejects PLANNED or unavailable lesson', async () => {
    state.lessons[0].availability = 'PLANNED';
    const req = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons/' + lesson1Id, {
      headers: authHeaders(),
    });
    const res = await lessonDetailRoute.GET(req, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(res.status, 404, 'Unavailable lesson must return 404');
  });

  test('Mutation G Control: Child snapshot isolation excludes assessment items and preserves promptData', async () => {
    // Add an assessment item to exercises
    state.exercises.push({
      id: 'ex-assessment-1',
      lessonRevisionId: revision1Id,
      itemId: 'item-assessment',
      itemRevisionId: 'ir-assessment',
      position: 6,
      isCore: true,
      item: { id: 'item-assessment', origin: 'ASSESSMENT' },
      itemRevision: {
        id: 'ir-assessment',
        itemId: 'item-assessment',
        type: 'MCQ',
        schemaVersion: 1,
        promptData: { prompt: 'Assessment MCQ', options: [] },
        assessmentBlueprintId: 'blueprint-1',
      },
    });

    const req = new Request('http://localhost:3000/api/learner/contexts/' + contextId + '/lessons/' + lesson1Id, {
      headers: authHeaders(),
    });
    const res = await lessonDetailRoute.GET(req, { params: Promise.resolve({ contextId, lessonId: lesson1Id }) });
    assert.equal(res.status, 200);
    const body = await res.json();

    const ids = body.data.exercises.map(e => e.id);
    assert.ok(!ids.includes('ex-assessment-1'), 'Authored assessment items must be excluded from practice lesson');
  });
});
