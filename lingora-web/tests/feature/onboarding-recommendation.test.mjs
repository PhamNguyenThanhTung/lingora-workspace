import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import {
  normalizeOnboardingPreferences,
  mergeStudyPreferences,
  parseRecommendationSnapshot,
} from '../../src/server/context/preferences.ts';
import {
  resolveRecommendation,
  resolveNextLesson,
  isEligiblePublishedLesson,
} from '../../src/server/context/curriculum.ts';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import { getLearnerCookieName } from '../../src/server/auth/env.ts';

const LEARNER_A_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const LANG_EN_ID = '11111111-1111-4111-8111-111111111111';
const LANG_EMPTY_ID = '22222222-2222-4222-8222-222222222222';
const FW_CEFR_ID = '33333333-3333-4333-8333-333333333333';
const FW_OTHER_ID = '44444444-4444-4444-8444-444444444444';

const COURSE_A_ID = '55555555-5555-4555-8555-555555555555';
const COURSE_B_ID = '66666666-6666-4666-8666-666666666666';

const LVL_A1_ID = '77777777-7777-4777-8777-777777777777';
const LVL_A2_ID = '88888888-8888-4888-8888-888888888888';
const LVL_OTHER_ID = '99999999-9999-4999-8999-999999999999';

function createMockSessionCookie(userId = LEARNER_A_ID) {
  const cookieName = getLearnerCookieName('https://sncfyvpzwedqgwfpffkh.supabase.co');
  const payload = { sub: userId, email: 'learner@lingora.edu.vn', exp: Math.floor(Date.now() / 1000) + 3600 };
  const access_token = 'token.' + Buffer.from(JSON.stringify(payload)).toString('base64url') + '.sig';
  const sessionData = {
    access_token,
    refresh_token: 'refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: userId, email: 'learner@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' },
  };
  return { name: cookieName, value: 'base64-' + Buffer.from(JSON.stringify(sessionData)).toString('base64') };
}

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

const { POST: previewRoute } = await import('../../src/app/api/learner/onboarding/preview/route.ts');

function buildMockDb(options = {}) {
  const courses = [
    {
      id: COURSE_A_ID,
      languageId: LANG_EN_ID,
      frameworkId: FW_CEFR_ID,
      isActive: true,
      names: { vi: 'Khóa học Anh A' },
      framework: { id: FW_CEFR_ID, code: 'CEFR', version: '2020', names: { vi: 'CEFR' } },
      units: [
        {
          id: 'u1',
          courseId: COURSE_A_ID,
          levelId: LVL_A1_ID,
          position: 1,
          level: { id: LVL_A1_ID, code: 'A1', label: { vi: 'A1' }, position: 1, frameworkId: FW_CEFR_ID },
          lessons: [
            {
              id: 'l1',
              unitId: 'u1',
              position: 1,
              isRequired: true,
              availability: options.l1Availability ?? 'AVAILABLE',
              activeRevisionId: options.l1ActiveRevId ?? 'r1',
              activeRevision: options.l1NoActiveRev ? null : {
                id: 'r1',
                lessonId: options.l1WrongLessonId ? 'other-lesson' : 'l1',
                status: options.l1RevStatus ?? 'PUBLISHED',
                title: { vi: 'Bài 1: Chào hỏi' },
                purposeTags: options.courseAPurposeTags ?? ['TRAVEL'],
              },
            },
            {
              id: 'l2',
              unitId: 'u1',
              position: 2,
              isRequired: true,
              availability: 'AVAILABLE',
              activeRevisionId: 'r2',
              activeRevision: {
                id: 'r2',
                lessonId: 'l2',
                status: 'PUBLISHED',
                title: { vi: 'Bài 2: Làm quen' },
                purposeTags: [],
              },
            },
          ],
        },
        {
          id: 'u2',
          courseId: COURSE_A_ID,
          levelId: LVL_A2_ID,
          position: 2,
          level: { id: LVL_A2_ID, code: 'A2', label: { vi: 'A2' }, position: 2, frameworkId: FW_CEFR_ID },
          lessons: [
            {
              id: 'l3',
              unitId: 'u2',
              position: 1,
              isRequired: true,
              availability: 'AVAILABLE',
              activeRevisionId: 'r3',
              activeRevision: {
                id: 'r3',
                lessonId: 'l3',
                status: 'PUBLISHED',
                title: { vi: 'Bài 3: Mua sắm' },
                purposeTags: [],
              },
            },
          ],
        },
      ],
    },
    ...(options.includeCourseB ? [
      {
        id: COURSE_B_ID,
        languageId: LANG_EN_ID,
        frameworkId: FW_CEFR_ID,
        isActive: true,
        names: { vi: 'Khóa học Anh B' },
        framework: { id: FW_CEFR_ID, code: 'CEFR', version: '2020', names: { vi: 'CEFR' } },
        units: [
          {
            id: 'ub1',
            courseId: COURSE_B_ID,
            levelId: LVL_A1_ID,
            position: 1,
            level: { id: LVL_A1_ID, code: 'A1', label: { vi: 'A1' }, position: 1, frameworkId: FW_CEFR_ID },
            lessons: [
              {
                id: 'lb1',
                unitId: 'ub1',
                position: 1,
                isRequired: true,
                availability: 'AVAILABLE',
                activeRevisionId: 'rb1',
                activeRevision: {
                  id: 'rb1',
                  lessonId: 'lb1',
                  status: 'PUBLISHED',
                  title: { vi: 'Bài B1' },
                  purposeTags: options.courseBPurposeTags ?? ['WORK'],
                },
              },
            ],
          },
        ],
      },
    ] : []),
  ];

  return {
    account: {
      findUnique: async ({ where }) => {
        if (where.id === LEARNER_A_ID) {
          return { id: LEARNER_A_ID, role: 'LEARNER', status: 'ACTIVE' };
        }
        return null;
      },
    },
    language: {
      findUnique: async ({ where }) => {
        if (where.id === LANG_EN_ID) {
          return { id: LANG_EN_ID, code: 'en', isLearnable: true };
        }
        if (where.id === LANG_EMPTY_ID) {
          return { id: LANG_EMPTY_ID, code: 'empty', isLearnable: true };
        }
        return null;
      },
    },
    course: {
      findMany: async ({ where }) => {
        if (where.languageId === LANG_EMPTY_ID) return [];
        return courses.filter((c) => c.languageId === where.languageId && (!where.isActive || c.isActive));
      },
      findFirst: async ({ where }) => {
        return courses.find((c) => c.id === where.id && c.languageId === where.languageId) || null;
      },
    },
    level: {
      findUnique: async ({ where }) => {
        if (where.id === LVL_A1_ID) return { id: LVL_A1_ID, code: 'A1', label: { vi: 'A1' }, position: 1, frameworkId: FW_CEFR_ID };
        if (where.id === LVL_A2_ID) return { id: LVL_A2_ID, code: 'A2', label: { vi: 'A2' }, position: 2, frameworkId: FW_CEFR_ID };
        if (where.id === LVL_OTHER_ID) return { id: LVL_OTHER_ID, code: 'O1', label: { vi: 'Other' }, position: 1, frameworkId: FW_OTHER_ID };
        return null;
      },
    },
    unit: {
      findMany: async ({ where }) => {
        const result = [];
        for (const c of courses) {
          if (where.courseId && c.id !== where.courseId) continue;
          for (const u of c.units) {
            if (where.levelId && u.levelId !== where.levelId) continue;
            if (where.level?.position?.lte !== undefined && u.level.position > where.level.position.lte) continue;
            result.push(u);
          }
        }
        return result;
      },
    },
    learningContext: {
      count: async () => 0,
      create: async () => { throw new Error('Preview must not call create'); },
    },
    learningPlan: {
      create: async () => { throw new Error('Preview must not call create'); },
    },
  };
}

describe('S3-01: Recommendation Foundation & Preview', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const cookie = createMockSessionCookie(LEARNER_A_ID);
    currentCookieStore = {
      getAll: () => [cookie],
      get: (n) => (n === cookie.name ? cookie : undefined),
      set: () => {},
      delete: () => {},
    };
    setLearnerPrismaForTest(buildMockDb());
  });

  afterEach(() => {
    setLearnerPrismaForTest(null);
  });

  describe('Preferences Normalization', () => {
    test('normalizes purpose to uppercase or null when invalid', () => {
      assert.equal(normalizeOnboardingPreferences({ purpose: 'travel' }).purpose, 'TRAVEL');
      assert.equal(normalizeOnboardingPreferences({ purpose: 'WORK' }).purpose, 'WORK');
      assert.equal(normalizeOnboardingPreferences({ purpose: 'INVALID_PURPOSE' }).purpose, null);
      assert.equal(normalizeOnboardingPreferences({ purpose: null }).purpose, null);
      assert.equal(normalizeOnboardingPreferences({}).purpose, null);
    });

    test('normalizes daily goal to 5, 10, 15, 20 with default 10', () => {
      assert.equal(normalizeOnboardingPreferences({ dailyGoalMinutes: 5 }).dailyGoalMinutes, 5);
      assert.equal(normalizeOnboardingPreferences({ dailyGoalMinutes: 15 }).dailyGoalMinutes, 15);
      assert.equal(normalizeOnboardingPreferences({ dailyGoalMinutes: '20' }).dailyGoalMinutes, 20);
      assert.equal(normalizeOnboardingPreferences({ dailyGoalMinutes: 45 }).dailyGoalMinutes, 10);
      assert.equal(normalizeOnboardingPreferences({}).dailyGoalMinutes, 10);
    });

    test('deduplicates, filters against allowlist, caps at 5, and canonicalizes interest order', () => {
      const input = ['FOOD', 'TRAVEL', 'FOOD', 'INVALID', 'CULTURE', 'TECHNOLOGY', 'NEWS', 'SCIENCE'];
      const result = normalizeOnboardingPreferences({ interests: input });
      assert.deepEqual(result.interests, ['TRAVEL', 'CULTURE', 'TECHNOLOGY', 'FOOD', 'NEWS']);
      assert.equal(result.interests.length, 5);
    });

    test('preserves unrelated keys on merge', () => {
      const existing = { customSetting: true, studyFocus: 'GRAMMAR', otherMeta: { foo: 'bar' } };
      const normalized = { purpose: 'TRAVEL', dailyGoalMinutes: 15, interests: ['TRAVEL', 'FOOD'] };
      const merged = mergeStudyPreferences(existing, normalized, new Date('2026-11-12T00:00:00Z'));

      assert.equal(merged.customSetting, true);
      assert.equal(merged.studyFocus, 'GRAMMAR');
      assert.deepEqual(merged.otherMeta, { foo: 'bar' });
      assert.equal(merged.dailyGoalMinutes, 15);
      assert.deepEqual(merged.interests, ['TRAVEL', 'FOOD']);
      assert.equal(merged.onboardingVersion, 1);
      assert.equal(merged.onboardingCompletedAt, '2026-11-12T00:00:00.000Z');
    });

    test('snapshot parser handles malformed or legacy json safely', () => {
      const empty = parseRecommendationSnapshot({});
      assert.equal(empty.algorithmVersion, 1);
      assert.equal(empty.normalizedPreferences.dailyGoalMinutes, 10);
      assert.deepEqual(empty.reasonCodes, ['LOWEST_AVAILABLE_LEVEL']);

      const valid = parseRecommendationSnapshot({
        algorithmVersion: 1,
        normalizedPreferences: { purpose: 'WORK', dailyGoalMinutes: 20, interests: ['BUSINESS'] },
        recommendedLessonId: 'l1',
        reasonCodes: ['LOWEST_AVAILABLE_LEVEL', 'PURPOSE_MATCH'],
      });
      assert.equal(valid.normalizedPreferences.purpose, 'WORK');
      assert.equal(valid.normalizedPreferences.dailyGoalMinutes, 20);
      assert.deepEqual(valid.reasonCodes, ['LOWEST_AVAILABLE_LEVEL', 'PURPOSE_MATCH']);
    });
  });

  describe('Curriculum Eligibility & Next Lesson Rules', () => {
    test('isEligiblePublishedLesson correctly checks status, availability, and lesson match', () => {
      assert.equal(isEligiblePublishedLesson({
        availability: 'AVAILABLE',
        activeRevisionId: 'r1',
        activeRevision: { id: 'r1', lessonId: 'l1', status: 'PUBLISHED' },
        id: 'l1',
      }), true);

      // Draft revision
      assert.equal(isEligiblePublishedLesson({
        availability: 'AVAILABLE',
        activeRevisionId: 'r1',
        activeRevision: { id: 'r1', lessonId: 'l1', status: 'DRAFT' },
        id: 'l1',
      }), false);

      // Withdrawn lesson
      assert.equal(isEligiblePublishedLesson({
        availability: 'WITHDRAWN',
        activeRevisionId: 'r1',
        activeRevision: { id: 'r1', lessonId: 'l1', status: 'PUBLISHED' },
        id: 'l1',
      }), false);

      // Revision belonging to another lesson
      assert.equal(isEligiblePublishedLesson({
        availability: 'AVAILABLE',
        activeRevisionId: 'r1',
        activeRevision: { id: 'r1', lessonId: 'other-lesson', status: 'PUBLISHED' },
        id: 'l1',
      }), false);
    });

    test('DEFAULT chooses lowest eligible level with published content', async () => {
      // Mock db where Level 1 has only DRAFT lessons
      const db = buildMockDb({ l1RevStatus: 'DRAFT' });
      const res = await resolveRecommendation(db, {
        languageId: LANG_EN_ID,
        entryChoice: { startSource: 'DEFAULT' },
      });

      assert.ok(res);
      // Level 1 lesson 1 is DRAFT, but lesson 2 in Level 1 is PUBLISHED, so Level 1 is still eligible!
      assert.equal(res.startLevel.id, LVL_A1_ID);
      assert.deepEqual(res.reasonCodes, ['LOWEST_AVAILABLE_LEVEL']);
      assert.equal(res.nextLesson?.id, 'l2');
    });

    test('DEFAULT skips level completely when all lessons in level are draft', async () => {
      // If Level 1 has NO published lessons at all, it should pick Level 2
      const modifiedCourses = [
        {
          id: COURSE_A_ID,
          languageId: LANG_EN_ID,
          frameworkId: FW_CEFR_ID,
          isActive: true,
          names: { vi: 'Khóa A' },
          framework: { id: FW_CEFR_ID, code: 'CEFR', version: '2020', names: { vi: 'CEFR' } },
          units: [
            {
              id: 'u1',
              courseId: COURSE_A_ID,
              levelId: LVL_A1_ID,
              position: 1,
              level: { id: LVL_A1_ID, code: 'A1', label: { vi: 'A1' }, position: 1, frameworkId: FW_CEFR_ID },
              lessons: [
                {
                  id: 'l1',
                  unitId: 'u1',
                  position: 1,
                  availability: 'AVAILABLE',
                  activeRevisionId: 'r1',
                  activeRevision: { id: 'r1', lessonId: 'l1', status: 'DRAFT', title: { vi: 'Draft' } },
                },
              ],
            },
            {
              id: 'u2',
              courseId: COURSE_A_ID,
              levelId: LVL_A2_ID,
              position: 2,
              level: { id: LVL_A2_ID, code: 'A2', label: { vi: 'A2' }, position: 2, frameworkId: FW_CEFR_ID },
              lessons: [
                {
                  id: 'l3',
                  unitId: 'u2',
                  position: 1,
                  availability: 'AVAILABLE',
                  activeRevisionId: 'r3',
                  activeRevision: { id: 'r3', lessonId: 'l3', status: 'PUBLISHED', title: { vi: 'L3' } },
                },
              ],
            },
          ],
        },
      ];

      const db = buildMockDb();
      db.course.findMany = async () => modifiedCourses;
      db.unit.findMany = async () => modifiedCourses[0].units;

      const res = await resolveRecommendation(db, {
        languageId: LANG_EN_ID,
        entryChoice: { startSource: 'DEFAULT' },
      });

      assert.ok(res);
      assert.equal(res.startLevel.id, LVL_A2_ID);
      assert.equal(res.nextLesson?.id, 'l3');
    });

    test('SELF_REPORT rejects wrong framework with LEVEL_INVALID', async () => {
      const db = buildMockDb();
      await assert.rejects(
        async () => {
          await resolveRecommendation(db, {
            languageId: LANG_EN_ID,
            entryChoice: {
              startSource: 'SELF_REPORT',
              courseId: COURSE_A_ID,
              levelId: LVL_OTHER_ID, // Belongs to FW_OTHER_ID, not FW_CEFR_ID
            },
          });
        },
        { status: 400, code: 'LEVEL_INVALID' }
      );
    });

    test('SELF_REPORT rejects level without published eligible lessons with LEVEL_NOT_ELIGIBLE', async () => {
      const db = buildMockDb();
      // Level A2 has only draft lessons in unit
      db.unit.findMany = async () => [
        {
          id: 'u2',
          courseId: COURSE_A_ID,
          levelId: LVL_A2_ID,
          lessons: [
            {
              id: 'l3',
              unitId: 'u2',
              availability: 'AVAILABLE',
              activeRevisionId: 'r3',
              activeRevision: { id: 'r3', lessonId: 'l3', status: 'DRAFT', title: { vi: 'Draft' } },
            },
          ],
        },
      ];

      await assert.rejects(
        async () => {
          await resolveRecommendation(db, {
            languageId: LANG_EN_ID,
            entryChoice: {
              startSource: 'SELF_REPORT',
              courseId: COURSE_A_ID,
              levelId: LVL_A2_ID,
            },
          });
        },
        { status: 409, code: 'LEVEL_NOT_ELIGIBLE' }
      );
    });

    test('Purpose matching between multiple courses emits PURPOSE_MATCH only when it decided the winner', async () => {
      // Course A has purpose 'TRAVEL' in starting level, Course B has 'WORK'
      const db = buildMockDb({
        includeCourseB: true,
        courseAPurposeTags: ['TRAVEL'],
        courseBPurposeTags: ['WORK'],
      });

      // Course A already wins the ID tie-break, so TRAVEL does not change the choice.
      const resTravel = await resolveRecommendation(db, {
        languageId: LANG_EN_ID,
        purpose: 'TRAVEL',
        entryChoice: { startSource: 'DEFAULT' },
      });

      assert.ok(resTravel);
      assert.equal(resTravel.course.id, COURSE_A_ID);
      assert.deepEqual(resTravel.reasonCodes, ['LOWEST_AVAILABLE_LEVEL']);

      // User chose WORK -> Course B wins with PURPOSE_MATCH
      const resWork = await resolveRecommendation(db, {
        languageId: LANG_EN_ID,
        purpose: 'WORK',
        entryChoice: { startSource: 'DEFAULT' },
      });

      assert.ok(resWork);
      assert.equal(resWork.course.id, COURSE_B_ID);
      assert.deepEqual(resWork.reasonCodes, ['LOWEST_AVAILABLE_LEVEL', 'PURPOSE_MATCH']);

      // User chose CULTURE -> Neither matches -> tie-break by courseId ASC -> PURPOSE_MATCH is NOT emitted
      const resCulture = await resolveRecommendation(db, {
        languageId: LANG_EN_ID,
        purpose: 'CULTURE',
        entryChoice: { startSource: 'DEFAULT' },
      });

      assert.ok(resCulture);
      assert.equal(resCulture.course.id, COURSE_A_ID); // COURSE_A_ID ('5555...') < COURSE_B_ID ('6666...')
      assert.deepEqual(resCulture.reasonCodes, ['LOWEST_AVAILABLE_LEVEL']);
    });

    test('Language with no eligible curriculum returns null / NO_ELIGIBLE_CURRICULUM', async () => {
      const db = buildMockDb();
      const res = await resolveRecommendation(db, {
        languageId: LANG_EMPTY_ID,
        entryChoice: { startSource: 'DEFAULT' },
      });
      assert.equal(res, null);
    });

    test('Next lesson enforces required completion before unlocking subsequent lessons', async () => {
      const db = buildMockDb();

      // With 0 completions: lesson 1 is unlocked and returned as nextLesson
      const next1 = await resolveNextLesson(db, {
        courseId: COURSE_A_ID,
        frameworkId: FW_CEFR_ID,
        workingLevel: { id: LVL_A1_ID, position: 1 },
        completedLessonIds: new Set(),
      });
      assert.equal(next1?.id, 'l1');

      // When lesson 1 is completed: lesson 2 is unlocked and returned
      const next2 = await resolveNextLesson(db, {
        courseId: COURSE_A_ID,
        frameworkId: FW_CEFR_ID,
        workingLevel: { id: LVL_A1_ID, position: 1 },
        completedLessonIds: new Set(['l1']),
      });
      assert.equal(next2?.id, 'l2');

      // When all lessons completed: returns null
      const nextDone = await resolveNextLesson(db, {
        courseId: COURSE_A_ID,
        frameworkId: FW_CEFR_ID,
        workingLevel: { id: LVL_A1_ID, position: 1 },
        completedLessonIds: new Set(['l1', 'l2']),
      });
      assert.equal(nextDone, null);
    });
  });

  describe('Route: POST /api/learner/onboarding/preview', () => {
    test('rejects foreign origin with 403 FORBIDDEN_ORIGIN', async () => {
      const req = new Request('http://localhost:3000/api/learner/onboarding/preview', {
        method: 'POST',
        headers: {
          origin: 'http://malicious.site',
          host: 'localhost:3000',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          languageId: LANG_EN_ID,
          entryChoice: { startSource: 'DEFAULT' },
        }),
      });

      const res = await previewRoute(req);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.error.code, 'FORBIDDEN_ORIGIN');
    });

    test('rejects non-json content-type with 415 UNSUPPORTED_MEDIA_TYPE', async () => {
      const req = new Request('http://localhost:3000/api/learner/onboarding/preview', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          host: 'localhost:3000',
          'content-type': 'text/plain',
        },
        body: 'hello',
      });

      const res = await previewRoute(req);
      assert.equal(res.status, 415);
      const json = await res.json();
      assert.equal(json.error.code, 'UNSUPPORTED_MEDIA_TYPE');
    });

    test('rejects invalid payload with 400 VALIDATION_ERROR', async () => {
      const req = new Request('http://localhost:3000/api/learner/onboarding/preview', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          host: 'localhost:3000',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          languageId: 'not-a-uuid',
          entryChoice: { startSource: 'DEFAULT' },
        }),
      });

      const res = await previewRoute(req);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.error.code, 'VALIDATION_ERROR');
    });

    test('successful preview returns 200 with READY, course, startLevel, nextLesson, and sets no-store', async () => {
      const db = buildMockDb();
      setLearnerPrismaForTest(db);

      const req = new Request('http://localhost:3000/api/learner/onboarding/preview', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          host: 'localhost:3000',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          languageId: LANG_EN_ID,
          purpose: 'TRAVEL',
          dailyGoalMinutes: 15,
          interests: ['TRAVEL', 'FOOD'],
          entryChoice: { startSource: 'DEFAULT' },
        }),
      });

      const res = await previewRoute(req);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('cache-control'), 'no-store, private');

      const json = await res.json();
      assert.equal(json.data.status, 'READY');
      assert.equal(json.data.course.id, COURSE_A_ID);
      assert.equal(json.data.startLevel.id, LVL_A1_ID);
      assert.equal(json.data.source, 'DEFAULT');
      assert.equal(json.data.dailyGoalMinutes, 15);
      assert.deepEqual(json.data.reasonCodes, ['LOWEST_AVAILABLE_LEVEL']);
      assert.equal(json.data.nextLesson.id, 'l1');
      assert.equal(json.data.nextLesson.href, '/learn/l1');
    });

    test('preview for empty language returns 200 with NO_ELIGIBLE_CURRICULUM', async () => {
      const db = buildMockDb();
      setLearnerPrismaForTest(db);

      const req = new Request('http://localhost:3000/api/learner/onboarding/preview', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          host: 'localhost:3000',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          languageId: LANG_EMPTY_ID,
          entryChoice: { startSource: 'DEFAULT' },
        }),
      });

      const res = await previewRoute(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.status, 'NO_ELIGIBLE_CURRICULUM');
    });
  });
});
