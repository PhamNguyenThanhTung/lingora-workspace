import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import {
  account,
  contextRow,
  unitRow,
  lessonRow,
  lesson2Row,
  exercisesRows,
  vocabularyRows,
  fixtureDb,
  learnerId,
  contextId,
  courseId,
  level1Id,
  level2Id,
  lesson1Id,
  lesson2Id,
} from './harness/learner-fixture.mjs';
import { loadLearnerHome } from '../../src/server/context/home-loader.ts';
import { buildLearningPath } from '../../src/server/context/path-service.ts';
import { GET as homeGet } from '../../src/app/api/learner/home/route.ts';
import { GET as pathGet } from '../../src/app/api/learner/contexts/[contextId]/path/route.ts';

function createMockCookieAdapter(token = 'valid-token') {
  return {
    get: (name) => {
      if (name.includes('access_token') || name.includes('auth-token')) {
        return { value: token };
      }
      return undefined;
    },
    getAll: () => [{ name: 'sb-access-token', value: token }],
    set: () => {},
  };
}

describe('Sprint 4: S4-01 Home and Learning Path', () => {
  let state;
  let db;

  beforeEach(() => {
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
      srsReviewOperations: [],
      xpEvents: [],
      learnerAchievements: [],
    };
    db = fixtureDb(state);
    setLearnerPrismaForTest(db);
  });

  test('buildLearningPath: returns path nodes with COMPLETED, CURRENT, AVAILABLE, LOCKED, and COMING_SOON states', async () => {
    // Lesson 1 is completed
    state.completions.push({
      id: 'completion-1',
      contextId,
      lessonId: lesson1Id,
      firstAttemptId: 'attempt-1',
      completedAt: new Date(),
    });
    // Attempt 1 with score 100%
    state.attempts.push({
      id: 'attempt-1',
      contextId,
      lessonId: lesson1Id,
      lessonRevisionId: state.lessons[0].activeRevisionId,
      nCore: 5,
      kFirstWrong: 0,
      contributionUnits: 10,
      completedAt: new Date(),
      qualifyingLocalDate: new Date(),
    });

    // Add a PLANNED lesson 3 in unit 1
    const lesson3Id = '33333333-3333-4333-8333-333333333333';
    state.lessons.push({
      id: lesson3Id,
      unitId: state.units[0].id,
      position: 3,
      isRequired: true,
      availability: 'PLANNED',
      activeRevisionId: null,
      activeRevision: null,
    });

    const res = await buildLearningPath(db, contextId, learnerId);
    assert.equal(res.status, 'READY');
    assert.equal(res.path.length, 3);

    // Node 1: Completed
    assert.equal(res.path[0].lessonId, lesson1Id);
    assert.equal(res.path[0].state, 'COMPLETED');
    assert.equal(res.path[0].score, 100);
    assert.ok(res.path[0].href.includes(lesson1Id));

    // Node 2: Next eligible -> CURRENT (CTA)
    assert.equal(res.path[1].lessonId, lesson2Id);
    assert.equal(res.path[1].state, 'CURRENT');
    assert.equal(res.path[1].score, null);
    assert.ok(res.path[1].href.includes(lesson2Id));

    // Node 3: Planned -> COMING_SOON
    assert.equal(res.path[2].lessonId, lesson3Id);
    assert.equal(res.path[2].state, 'COMING_SOON');
    assert.equal(res.path[2].title, 'Bài học sắp ra mắt');
    assert.equal(res.path[2].href, '');

    // CTA
    assert.ok(res.continueLearning);
    assert.equal(res.continueLearning.lessonId, lesson2Id);
    assert.equal(res.continueLearning.status, 'READY');
  });

  test('buildLearningPath: open in-progress attempt is selected as CTA and CURRENT', async () => {
    // Open attempt on lesson 1
    state.attempts.push({
      id: 'attempt-open-1',
      contextId,
      lessonId: lesson1Id,
      lessonRevisionId: state.lessons[0].activeRevisionId,
      nCore: 5,
      kFirstWrong: null,
      contributionUnits: null,
      completedAt: null,
      startedAt: new Date(),
    });

    const res = await buildLearningPath(db, contextId, learnerId);
    assert.equal(res.status, 'READY');
    assert.ok(res.continueLearning);
    assert.equal(res.continueLearning.lessonId, lesson1Id);
    assert.equal(res.continueLearning.status, 'IN_PROGRESS');
    assert.equal(res.path[0].state, 'CURRENT');
  });

  test('buildLearningPath: returns clear status when context is PAUSED', async () => {
    state.contexts[0].status = 'PAUSED';
    const res = await buildLearningPath(db, contextId, learnerId);
    assert.equal(res.status, 'PAUSED');
    assert.equal(res.path.length, 0);
    assert.equal(res.continueLearning, null);
  });

  test('buildLearningPath: returns clear status when course is inactive', async () => {
    state.contexts[0].course.isActive = false;
    const res = await buildLearningPath(db, contextId, learnerId);
    assert.equal(res.status, 'COURSE_INACTIVE');
    assert.equal(res.path.length, 0);
  });

  test('buildLearningPath: returns clear status when context has no working level', async () => {
    state.contexts[0].workingLevel = null;
    state.contexts[0].workingLevelId = null;
    const res = await buildLearningPath(db, contextId, learnerId);
    assert.equal(res.status, 'NO_WORKING_LEVEL');
    assert.equal(res.path.length, 0);
  });

  test('loadLearnerHome: loads full HomeDto including selectedContextId, path, reviewDue, streak, totalXp, quests', async () => {
    // Add 1 due SRS card
    state.srsCards.push({
      id: 'card-1',
      learnerId,
      vocabularyId: 'vocab-1',
      dueAt: new Date(Date.now() - 10000), // overdue
      stage: 1,
      rowVersion: 1n,
    });

    const res = await loadLearnerHome(undefined, {
      prisma: db,
      authClient: {
        auth: {
          getUser: async () => ({
            data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
            error: null,
          }),
        },
      },
      cookieStore: createMockCookieAdapter(),
    });

    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(res.data.selectedContextId, contextId);
    assert.equal(res.data.reviewDue, 1);
    assert.equal(res.data.path.length, 2);
    assert.ok(res.data.continueLearning);
    assert.equal(res.data.quests.length, 2);
    assert.equal(res.data.totalXp, 0);
    assert.equal(res.data.streak.currentStreak, 0);
  });

  test('loadLearnerHome: returns 404 when requested contextId does not belong to learner', async () => {
    const unownedId = '99999999-9999-4999-8999-999999999999';
    const res = await loadLearnerHome(undefined, {
      contextId: unownedId,
      prisma: db,
      authClient: {
        auth: {
          getUser: async () => ({
            data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
            error: null,
          }),
        },
      },
      cookieStore: createMockCookieAdapter(),
    });

    assert.equal(res.ok, false);
    if (res.ok) return;
    assert.equal(res.status, 404);
  });

  test('loadLearnerHome: missing or invalid timezone marks gamification UNAVAILABLE without failing learning path or inventing UTC', async () => {
    state.account.timezone = null;
    const res = await loadLearnerHome(undefined, {
      prisma: db,
      authClient: {
        auth: {
          getUser: async () => ({
            data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
            error: null,
          }),
        },
      },
      cookieStore: createMockCookieAdapter(),
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.data.gamificationStatus, 'UNAVAILABLE');
    assert.equal(res.data.streak.today, '');
    assert.ok(res.data.gamificationMessage?.includes('Múi giờ tài khoản không hợp lệ'));
    assert.ok(Array.isArray(res.data.path));

    state.account.timezone = 'Invalid/Timezone_Name';
    const res2 = await loadLearnerHome(undefined, {
      prisma: db,
      authClient: {
        auth: {
          getUser: async () => ({
            data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
            error: null,
          }),
        },
      },
      cookieStore: createMockCookieAdapter(),
    });
    assert.equal(res2.ok, true);
    if (!res2.ok) return;
    assert.equal(res2.data.gamificationStatus, 'UNAVAILABLE');
    assert.equal(res2.data.streak.today, '');
    assert.ok(res2.data.gamificationMessage?.includes('Múi giờ tài khoản không hợp lệ'));
  });

  test('loadLearnerHome: missing account returns 403 FORBIDDEN and is not treated as a timezone error', async () => {
    const authClient = {
      auth: {
        getUser: async () => ({
          data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
          error: null,
        }),
      },
    };
    const customDb = {
      ...db,
      account: {
        findUnique: async () => null,
      },
    };
    const res = await loadLearnerHome(undefined, {
      prisma: customDb,
      authClient,
      cookieStore: createMockCookieAdapter(),
    });
    assert.equal(res.ok, false);
    if (res.ok) return;
    assert.equal(res.status, 403);
    assert.equal(res.error.code, 'FORBIDDEN');
    assert.equal(res.error.message, 'Tài khoản chưa được khởi tạo phân hệ học viên.');
  });

  test('loadLearnerHome: returns 200 with empty contexts when learner has no contexts', async () => {
    state.contexts = [];
    const res = await loadLearnerHome(undefined, {
      prisma: db,
      authClient: {
        auth: {
          getUser: async () => ({
            data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
            error: null,
          }),
        },
      },
      cookieStore: createMockCookieAdapter(),
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.data.contexts.length, 0);
    assert.equal(res.data.selectedContextId, null);
    assert.equal(res.data.pathStatus, null);
    assert.equal(res.data.continueLearning, null);
  });

  test('loadLearnerHome: returns 200 with NO_WORKING_LEVEL when context has no working level', async () => {
    state.contexts[0].workingLevel = null;
    state.contexts[0].workingLevelId = null;
    const res = await loadLearnerHome(undefined, {
      prisma: db,
      authClient: {
        auth: {
          getUser: async () => ({
            data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
            error: null,
          }),
        },
      },
      cookieStore: createMockCookieAdapter(),
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.data.pathStatus, 'NO_WORKING_LEVEL');
  });

  test('loadLearnerHome: returns 200 with PAUSED when context is paused', async () => {
    state.contexts[0].status = 'PAUSED';
    const res = await loadLearnerHome(undefined, {
      prisma: db,
      authClient: {
        auth: {
          getUser: async () => ({
            data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
            error: null,
          }),
        },
      },
      cookieStore: createMockCookieAdapter(),
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.data.pathStatus, 'PAUSED');
  });

  test('loadLearnerHome: returns 200 with COURSE_INACTIVE when course is inactive', async () => {
    state.contexts[0].course.isActive = false;
    const res = await loadLearnerHome(undefined, {
      prisma: db,
      authClient: {
        auth: {
          getUser: async () => ({
            data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
            error: null,
          }),
        },
      },
      cookieStore: createMockCookieAdapter(),
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.data.pathStatus, 'COURSE_INACTIVE');
  });

  test('loadLearnerHome: returns 200 with EMPTY_CURRICULUM when course has no published lessons', async () => {
    state.lessons = [];
    const res = await loadLearnerHome(undefined, {
      prisma: db,
      authClient: {
        auth: {
          getUser: async () => ({
            data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
            error: null,
          }),
        },
      },
      cookieStore: createMockCookieAdapter(),
    });
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.data.pathStatus, 'EMPTY_CURRICULUM');
  });

  test('loadLearnerHome: propagates ContextServiceError 409 as status 409, not 503', async () => {
    state.contexts[0].course.languageId = '99999999-9999-4999-8999-999999999999';
    const res = await loadLearnerHome(undefined, {
      prisma: db,
      authClient: {
        auth: {
          getUser: async () => ({
            data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
            error: null,
          }),
        },
      },
      cookieStore: createMockCookieAdapter(),
    });
    assert.equal(res.ok, false);
    if (res.ok) return;
    assert.equal(res.status, 409);
    assert.equal(res.error.code, 'CONTEXT_INCONSISTENT');
  });

  test('GET /api/learner/home: route guard rejects unknown query parameters with 400', async () => {
    const req = new Request('http://localhost:3000/api/learner/home?invalidParam=123');
    const res = await homeGet(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'INVALID_QUERY_PARAMETERS');
  });

  test('GET /api/learner/contexts/:contextId/path: route guard rejects extra query params with 400', async () => {
    const req = new Request(`http://localhost:3000/api/learner/contexts/${contextId}/path?foo=bar`);
    const res = await pathGet(req, { params: Promise.resolve({ contextId }) });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'INVALID_QUERY_PARAMETERS');
  });

  test('GET /api/learner/contexts/:contextId/path: returns 400 for malformed uuid', async () => {
    const req = new Request('http://localhost:3000/api/learner/contexts/not-a-uuid/path');
    const res = await pathGet(req, { params: Promise.resolve({ contextId: 'not-a-uuid' }) });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });
});
