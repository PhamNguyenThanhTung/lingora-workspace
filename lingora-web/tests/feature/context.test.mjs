import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { loadLearnerContext } from '../../src/server/context/loader.ts';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import { getLearnerCookieName } from '../../src/server/auth/env.ts';
import { loadContextOptions, createLearningContext, patchLearningContext, startLearningContext } from '../../src/server/context/service.ts';

function createMockSessionCookie(userId = LEARNER_A_ID, email = 'learner.a@lingora.edu.vn') {
  const cookieName = getLearnerCookieName('https://sncfyvpzwedqgwfpffkh.supabase.co');
  const payload = {
    sub: userId,
    email,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const access_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + Buffer.from(JSON.stringify(payload)).toString('base64url') + '.signature';
  const sessionData = {
    access_token,
    refresh_token: 'valid-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: userId, email, email_confirmed_at: '2026-10-31T00:00:00Z' },
  };
  const cookieValue = 'base64-' + Buffer.from(JSON.stringify(sessionData)).toString('base64');
  return {
    name: cookieName,
    value: cookieValue,
  };
}

// Setup module mock for next/headers.js before importing route handlers
let currentCookieStore = {
  getAll: () => [],
  get: (name) => undefined,
  set: (name, val, opts) => {},
  delete: (name) => {},
};

mock.module('next/headers.js', {
  exports: {
    cookies: async () => currentCookieStore,
  },
});

const { GET: contextRoute, POST: contextPostRoute } = await import('../../src/app/api/learner/context/route.ts');
const { GET: contextOptionsRoute } = await import('../../src/app/api/learner/context/options/route.ts');
const { PATCH: contextPatchRoute } = await import('../../src/app/api/learner/contexts/[contextId]/route.ts');
const { POST: contextStartRoute } = await import('../../src/app/api/learner/contexts/[contextId]/start/route.ts');

const LEARNER_A_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const LEARNER_B_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const LANG_EN_ID = '11111111-1111-4111-8111-111111111111';
const LANG_JA_ID = '22222222-2222-4222-8222-222222222222';

const FW_CEFR_ID = '33333333-3333-4333-8333-333333333333';
const FW_JLPT_ID = '44444444-4444-4444-8444-444444444444';

const COURSE_EN_ID = '55555555-5555-4555-8555-555555555555';
const COURSE_JA_ID = '66666666-6666-4666-8666-666666666666';

const LVL_A1_ID = '77777777-7777-4777-8777-777777777777';
const LVL_A2_ID = '88888888-8888-4888-8888-888888888888';

function createMockAuthClient(userId = LEARNER_A_ID, email = 'learner.a@lingora.edu.vn') {
  return {
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: userId,
            email,
            email_confirmed_at: '2026-10-31T00:00:00Z',
          },
        },
        error: null,
      }),
    },
  };
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-placeholder';
  const mockCookie = createMockSessionCookie(LEARNER_A_ID, 'learner.a@lingora.edu.vn');
  currentCookieStore = {
    getAll: () => [mockCookie],
    get: (name) => name === mockCookie.name ? mockCookie : undefined,
    set: () => {},
    delete: () => {},
  };
});

afterEach(() => {
  setLearnerPrismaForTest(null);
});

describe('Slice 9: Learner Context Cases & Data Consistency', () => {
  test('A/B fixtures: returns valid shaped summary with correct relations', async () => {
    const authClient = createMockAuthClient(LEARNER_A_ID);
    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: LEARNER_A_ID,
          role: 'LEARNER',
          status: 'ACTIVE',
          displayName: 'Học Viên A',
          uiLocale: 'vi',
        }),
      },
      learningContext: {
        findMany: async ({ where }) => {
          assert.equal(where.learnerId, LEARNER_A_ID);
          return [
            {
              id: 'ctx-a-1',
              learnerId: LEARNER_A_ID,
              languageId: LANG_EN_ID,
              courseId: COURSE_EN_ID,
              status: 'ACTIVE',
              createdAt: new Date('2026-10-28T10:00:00Z'),
              language: {
                id: LANG_EN_ID,
                code: 'en',
                names: { vi: 'Tiếng Anh', en: 'English' },
              },
              course: {
                id: COURSE_EN_ID,
                languageId: LANG_EN_ID,
                frameworkId: FW_CEFR_ID,
                names: { vi: 'Tiếng Anh Giao Tiếp', en: 'Conversational English' },
                isActive: true,
                framework: {
                  id: FW_CEFR_ID,
                  code: 'CEFR',
                  version: '2020',
                  names: { vi: 'Khung CEFR', en: 'CEFR Framework' },
                },
              },
              selectedStartLevel: {
                id: LVL_A1_ID,
                frameworkId: FW_CEFR_ID,
                code: 'A1',
                label: { vi: 'Mới bắt đầu', en: 'Beginner' },
                position: 1,
              },
              workingLevel: {
                id: LVL_A2_ID,
                frameworkId: FW_CEFR_ID,
                code: 'A2',
                label: { vi: 'Sơ cấp', en: 'Elementary' },
                position: 2,
              },
            },
          ];
        },
      },
    };

    const result = await loadLearnerContext(undefined, {
      authClient,
      prisma: mockPrisma,
    });

    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
    assert.equal(result.data.learner.id, LEARNER_A_ID);
    assert.equal(result.data.learner.role, 'LEARNER');
    assert.equal(result.data.learner.status, 'ACTIVE');
    assert.equal(result.data.learner.displayName, 'Học Viên A');
    assert.equal(result.data.learner.uiLocale, 'vi');

    assert.equal(result.data.contexts.length, 1);
    const ctx = result.data.contexts[0];
    assert.equal(ctx.id, 'ctx-a-1');
    assert.equal(ctx.status, 'ACTIVE');
    assert.equal(ctx.targetLanguage.code, 'en');
    assert.equal(ctx.course.id, COURSE_EN_ID);
    assert.equal(ctx.course.isActive, true);
    assert.equal(ctx.framework.code, 'CEFR');
    assert.equal(ctx.selectedStartLevel?.code, 'A1');
    assert.equal(ctx.workingLevel?.code, 'A2');
  });

  test('Mutation C Control: Strict ownership check - cannot return contexts of another learner', async () => {
    const authClient = createMockAuthClient(LEARNER_A_ID);

    // Simulate bug/attack where query returns context belonging to Learner B
    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: LEARNER_A_ID,
          role: 'LEARNER',
          status: 'ACTIVE',
          displayName: 'Học Viên A',
          uiLocale: 'vi',
        }),
      },
      learningContext: {
        findMany: async () => [
          {
            id: 'ctx-b-1',
            learnerId: LEARNER_B_ID, // Mismatched owner!
            languageId: LANG_EN_ID,
            courseId: COURSE_EN_ID,
            status: 'ACTIVE',
            language: { id: LANG_EN_ID, code: 'en', names: {} },
            course: {
              id: COURSE_EN_ID,
              languageId: LANG_EN_ID,
              frameworkId: FW_CEFR_ID,
              names: {},
              isActive: true,
              framework: { id: FW_CEFR_ID, code: 'CEFR', version: '2020', names: {} },
            },
            selectedStartLevel: null,
            workingLevel: null,
          },
        ],
      },
    };

    const result = await loadLearnerContext(undefined, {
      authClient,
      prisma: mockPrisma,
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 409);
    assert.equal(result.error.code, 'CONTEXT_INCONSISTENT');
  });

  test('Mutation E Control: Zero contexts is successful 200 with contexts: []', async () => {
    const authClient = createMockAuthClient(LEARNER_A_ID);
    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: LEARNER_A_ID,
          role: 'LEARNER',
          status: 'ACTIVE',
          displayName: 'Học Viên Mới',
          uiLocale: 'en',
        }),
      },
      learningContext: {
        findMany: async () => [],
      },
    };

    const result = await loadLearnerContext(undefined, {
      authClient,
      prisma: mockPrisma,
    });

    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
    assert.deepEqual(result.data.contexts, []);
    assert.equal(result.data.learner.role, 'LEARNER');
    assert.equal(result.data.learner.status, 'ACTIVE');
  });

  test('Context with null levels returns valid summary with selectedStartLevel: null and workingLevel: null', async () => {
    const authClient = createMockAuthClient(LEARNER_A_ID);
    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: LEARNER_A_ID,
          role: 'LEARNER',
          status: 'ACTIVE',
          displayName: 'Học Viên',
          uiLocale: 'vi',
        }),
      },
      learningContext: {
        findMany: async () => [
          {
            id: 'ctx-null-levels',
            learnerId: LEARNER_A_ID,
            languageId: LANG_EN_ID,
            courseId: COURSE_EN_ID,
            status: 'ACTIVE',
            language: { id: LANG_EN_ID, code: 'en', names: { vi: 'Tiếng Anh' } },
            course: {
              id: COURSE_EN_ID,
              languageId: LANG_EN_ID,
              frameworkId: FW_CEFR_ID,
              names: { vi: 'Khóa Học' },
              isActive: true,
              framework: { id: FW_CEFR_ID, code: 'CEFR', version: '2020', names: { vi: 'Khung' } },
            },
            selectedStartLevel: null,
            workingLevel: null,
          },
        ],
      },
    };

    const result = await loadLearnerContext(undefined, {
      authClient,
      prisma: mockPrisma,
    });

    assert.equal(result.ok, true);
    assert.equal(result.data.contexts[0].selectedStartLevel, null);
    assert.equal(result.data.contexts[0].workingLevel, null);
  });

  test('Multiple languages returned without asserting a single current choice', async () => {
    const authClient = createMockAuthClient(LEARNER_A_ID);
    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: LEARNER_A_ID,
          role: 'LEARNER',
          status: 'ACTIVE',
          displayName: 'Đa Ngôn Ngữ',
          uiLocale: 'vi',
        }),
      },
      learningContext: {
        findMany: async () => [
          {
            id: 'ctx-1-en',
            learnerId: LEARNER_A_ID,
            languageId: LANG_EN_ID,
            courseId: COURSE_EN_ID,
            status: 'ACTIVE',
            language: { id: LANG_EN_ID, code: 'en', names: { vi: 'Tiếng Anh' } },
            course: {
              id: COURSE_EN_ID,
              languageId: LANG_EN_ID,
              frameworkId: FW_CEFR_ID,
              names: { vi: 'Khóa Anh' },
              isActive: true,
              framework: { id: FW_CEFR_ID, code: 'CEFR', version: '2020', names: {} },
            },
            selectedStartLevel: null,
            workingLevel: null,
          },
          {
            id: 'ctx-2-ja',
            learnerId: LEARNER_A_ID,
            languageId: LANG_JA_ID,
            courseId: COURSE_JA_ID,
            status: 'PAUSED',
            language: { id: LANG_JA_ID, code: 'ja', names: { vi: 'Tiếng Nhật' } },
            course: {
              id: COURSE_JA_ID,
              languageId: LANG_JA_ID,
              frameworkId: FW_JLPT_ID,
              names: { vi: 'Khóa Nhật' },
              isActive: false, // Inactive course
              framework: { id: FW_JLPT_ID, code: 'JLPT', version: '2010', names: {} },
            },
            selectedStartLevel: null,
            workingLevel: null,
          },
        ],
      },
    };

    const result = await loadLearnerContext(undefined, {
      authClient,
      prisma: mockPrisma,
    });

    assert.equal(result.ok, true);
    assert.equal(result.data.contexts.length, 2);
    assert.equal(result.data.contexts[0].targetLanguage.code, 'en');
    assert.equal(result.data.contexts[0].status, 'ACTIVE');
    assert.equal(result.data.contexts[1].targetLanguage.code, 'ja');
    assert.equal(result.data.contexts[1].status, 'PAUSED');
    assert.equal(result.data.contexts[1].course.isActive, false);
  });

  test('Inconsistent join: course.languageId !== context.languageId fails closed as 409 CONTEXT_INCONSISTENT', async () => {
    const authClient = createMockAuthClient(LEARNER_A_ID);
    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: LEARNER_A_ID,
          role: 'LEARNER',
          status: 'ACTIVE',
          displayName: 'Học Viên',
          uiLocale: 'vi',
        }),
      },
      learningContext: {
        findMany: async () => [
          {
            id: 'ctx-bad-lang',
            learnerId: LEARNER_A_ID,
            languageId: LANG_EN_ID,
            courseId: COURSE_JA_ID,
            status: 'ACTIVE',
            language: { id: LANG_EN_ID, code: 'en', names: {} },
            course: {
              id: COURSE_JA_ID,
              languageId: LANG_JA_ID, // Mismatched language!
              frameworkId: FW_JLPT_ID,
              names: {},
              isActive: true,
              framework: { id: FW_JLPT_ID, code: 'JLPT', version: '2010', names: {} },
            },
            selectedStartLevel: null,
            workingLevel: null,
          },
        ],
      },
    };

    const result = await loadLearnerContext(undefined, {
      authClient,
      prisma: mockPrisma,
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 409);
    assert.equal(result.error.code, 'CONTEXT_INCONSISTENT');
  });

  test('Inconsistent join: level frameworkId !== course.frameworkId fails closed as 409 CONTEXT_INCONSISTENT', async () => {
    const authClient = createMockAuthClient(LEARNER_A_ID);
    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: LEARNER_A_ID,
          role: 'LEARNER',
          status: 'ACTIVE',
          displayName: 'Học Viên',
          uiLocale: 'vi',
        }),
      },
      learningContext: {
        findMany: async () => [
          {
            id: 'ctx-bad-level',
            learnerId: LEARNER_A_ID,
            languageId: LANG_EN_ID,
            courseId: COURSE_EN_ID,
            status: 'ACTIVE',
            language: { id: LANG_EN_ID, code: 'en', names: {} },
            course: {
              id: COURSE_EN_ID,
              languageId: LANG_EN_ID,
              frameworkId: FW_CEFR_ID,
              names: {},
              isActive: true,
              framework: { id: FW_CEFR_ID, code: 'CEFR', version: '2020', names: {} },
            },
            selectedStartLevel: {
              id: 'bad-lvl',
              frameworkId: FW_JLPT_ID, // Wrong framework!
              code: 'N5',
              label: {},
              position: 1,
            },
            workingLevel: null,
          },
        ],
      },
    };

    const result = await loadLearnerContext(undefined, {
      authClient,
      prisma: mockPrisma,
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 409);
    assert.equal(result.error.code, 'CONTEXT_INCONSISTENT');
  });

  test('No private fields leaked in context DTO', async () => {
    const authClient = createMockAuthClient(LEARNER_A_ID);
    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: LEARNER_A_ID,
          role: 'LEARNER',
          status: 'ACTIVE',
          displayName: 'Học Viên',
          uiLocale: 'vi',
          rowVersion: 42n,
          createdAt: new Date(),
          nativeLanguageId: 'some-native-lang',
        }),
      },
      learningContext: {
        findMany: async () => [
          {
            id: 'ctx-safe',
            learnerId: LEARNER_A_ID,
            languageId: LANG_EN_ID,
            courseId: COURSE_EN_ID,
            status: 'ACTIVE',
            rowVersion: 100n,
            gateConfig: { secret: 'hidden' },
            practiceConfig: { secret: 'hidden' },
            language: { id: LANG_EN_ID, code: 'en', names: { vi: 'Tiếng Anh' } },
            course: {
              id: COURSE_EN_ID,
              languageId: LANG_EN_ID,
              frameworkId: FW_CEFR_ID,
              names: { vi: 'Khóa Anh' },
              isActive: true,
              curriculumGeneration: 5n,
              framework: { id: FW_CEFR_ID, code: 'CEFR', version: '2020', names: {} },
            },
            selectedStartLevel: null,
            workingLevel: null,
          },
        ],
      },
    };

    const result = await loadLearnerContext(undefined, {
      authClient,
      prisma: mockPrisma,
    });

    assert.equal(result.ok, true);
    const jsonStr = JSON.stringify(result.data);
    assert.equal(result.data.contexts[0].rowVersion, '100');
    assert.equal(result.data.contexts[0].startSource, null);
    assert.ok(!jsonStr.includes('42'));
    assert.ok(!jsonStr.includes('curriculumGeneration'));
    assert.ok(!jsonStr.includes('nativeLanguageId'));
  });

  test('Context failure then successful retry', async () => {
    let failureCount = 1;
    const authClient = createMockAuthClient(LEARNER_A_ID);
    const mockPrisma = {
      account: {
        findUnique: async () => ({
          id: LEARNER_A_ID,
          role: 'LEARNER',
          status: 'ACTIVE',
          displayName: 'Học Viên',
          uiLocale: 'vi',
        }),
      },
      learningContext: {
        findMany: async () => {
          if (failureCount > 0) {
            failureCount--;
            throw new Error('Database connection failed');
          }
          return [];
        },
      },
    };

    // First attempt fails with 503
    const failResult = await loadLearnerContext(undefined, {
      authClient,
      prisma: mockPrisma,
    });
    assert.equal(failResult.ok, false);
    assert.equal(failResult.status, 503);
    assert.equal(failResult.error.code, 'SERVICE_UNAVAILABLE');

    // Retry succeeds with 200
    const retryResult = await loadLearnerContext(undefined, {
      authClient,
      prisma: mockPrisma,
    });
    assert.equal(retryResult.ok, true);
    assert.equal(retryResult.status, 200);
    assert.deepEqual(retryResult.data.contexts, []);
  });
});

describe('Slice 9: GET /api/learner/context Route Handler', () => {
  test('rejects unsupported query selector parameters with 400', async () => {
    const request = new Request('http://localhost:3000/api/learner/context?learnerId=some-other-id');
    const res = await contextRoute(request);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.error.code, 'INVALID_QUERY_PARAMETERS');
  });

  test('rejects other query parameters with 400', async () => {
    const request = new Request('http://localhost:3000/api/learner/context?filter=all');
    const res = await contextRoute(request);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.error.code, 'INVALID_QUERY_PARAMETERS');
  });

  test('GET /api/learner/context returns 200 with Cache-Control no-store private', async () => {
    setLearnerPrismaForTest({
      account: {
        findUnique: async () => ({
          id: LEARNER_A_ID,
          role: 'LEARNER',
          status: 'ACTIVE',
          displayName: 'Học Viên A',
          uiLocale: 'vi',
        }),
      },
      learningContext: {
        findMany: async () => [],
      },
    });

    globalThis.fetch = async (url) => {
      if (url.toString().includes('/auth/v1/user')) {
        return new Response(JSON.stringify({
          id: LEARNER_A_ID,
          email: 'learner.a@lingora.edu.vn',
          email_confirmed_at: '2026-10-31T00:00:00Z',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('Not Found', { status: 404 });
    };

    const request = new Request('http://localhost:3000/api/learner/context');
    const res = await contextRoute(request);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.learner.id, LEARNER_A_ID);
    assert.deepEqual(json.data.contexts, []);
    const cc = res.headers.get('cache-control') || '';
    assert.ok(cc.includes('no-store') && cc.includes('private'));
  });
});

describe('Slice 12: GET /api/learner/context/options Route & Service', () => {
  const setupPrisma = (overrides = {}) => {
    const defaultLang = { id: LANG_EN_ID, code: 'en', names: { vi: 'Tiếng Anh' }, isLearnable: true };
    const nonLearnableLang = { id: LANG_JA_ID, code: 'ja', names: { vi: 'Tiếng Nhật' }, isLearnable: false };

    const activeCourse = {
      id: COURSE_EN_ID,
      languageId: LANG_EN_ID,
      frameworkId: FW_CEFR_ID,
      names: { vi: 'Tiếng Anh Căn Bản' },
      isActive: true,
      framework: { id: FW_CEFR_ID, code: 'CEFR', version: '2020', names: { vi: 'CEFR' } },
    };

    const inactiveCourse = {
      id: COURSE_JA_ID,
      languageId: LANG_EN_ID,
      frameworkId: FW_CEFR_ID,
      names: { vi: 'Tiếng Anh Nâng Cao' },
      isActive: false,
      framework: { id: FW_CEFR_ID, code: 'CEFR', version: '2020', names: { vi: 'CEFR' } },
    };

    const levelA1 = { id: LVL_A1_ID, frameworkId: FW_CEFR_ID, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 };
    const levelA2 = { id: LVL_A2_ID, frameworkId: FW_CEFR_ID, code: 'A2', label: { vi: 'Sơ cấp' }, position: 2 };

    const units = [
      {
        id: 'u1',
        courseId: COURSE_EN_ID,
        level: levelA1,
        lessons: [
          {
            id: 'l1',
            availability: 'AVAILABLE',
            activeRevisionId: 'rev1',
            activeRevision: { id: 'rev1', lessonId: 'l1', status: 'PUBLISHED' },
          },
        ],
      },
      {
        id: 'u2',
        courseId: COURSE_EN_ID,
        level: levelA2,
        lessons: [
          {
            id: 'l2',
            availability: 'AVAILABLE',
            activeRevisionId: 'rev2',
            activeRevision: { id: 'rev2', lessonId: 'l2', status: 'DRAFT' }, // Not published!
          },
        ],
      },
    ];

    return {
      account: {
        findUnique: async () => ({
          id: LEARNER_A_ID,
          role: overrides.accountRole || 'LEARNER',
          status: overrides.accountStatus || 'ACTIVE',
        }),
      },
      language: {
        findMany: async ({ where }) => {
          const all = [defaultLang, nonLearnableLang];
          return all.filter((l) => (where.isLearnable === undefined ? true : l.isLearnable === where.isLearnable));
        },
      },
      course: {
        findMany: async ({ where }) => {
          const all = [activeCourse, inactiveCourse];
          return all.filter((c) => c.languageId === where.languageId && (where.isActive === undefined ? true : c.isActive === where.isActive));
        },
      },
      unit: {
        findMany: async ({ where }) => {
          if (overrides.emptyUnits) return [];
          return units.filter((u) => u.courseId === where.courseId);
        },
      },
    };
  };

  test('returns 200 with learnable languages, active courses, eligible levels and defaultLevelId', async () => {
    const mockPrisma = setupPrisma();
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const req = new Request('http://localhost:3000/api/learner/context/options');
    const res = await contextOptionsRoute(req);
    assert.equal(res.status, 200);
    const json = await res.json();

    assert.equal(json.data.languages.length, 1);
    const lang = json.data.languages[0];
    assert.equal(lang.code, 'en');
    assert.equal(lang.courses.length, 1);

    const course = lang.courses[0];
    assert.equal(course.id, COURSE_EN_ID);
    assert.equal(course.defaultLevelId, LVL_A1_ID);
    // Level A2 had only DRAFT lesson, so only A1 is eligible
    assert.equal(course.levels.length, 1);
    assert.equal(course.levels[0].code, 'A1');

    const cc = res.headers.get('cache-control') || '';
    assert.ok(cc.includes('no-store') && cc.includes('private'));
  });

  test('honest empty coming-soon when course has no published content', async () => {
    const mockPrisma = setupPrisma({ emptyUnits: true });
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const req = new Request('http://localhost:3000/api/learner/context/options');
    const res = await contextOptionsRoute(req);
    assert.equal(res.status, 200);
    const json = await res.json();

    const course = json.data.languages[0].courses[0];
    assert.equal(course.defaultLevelId, null);
    assert.deepEqual(course.levels, []);
  });

  test('rejects unauthenticated or non-learner account with 403', async () => {
    const mockPrisma = setupPrisma({ accountRole: 'TEACHER' });
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'teacher@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const req = new Request('http://localhost:3000/api/learner/context/options');
    const res = await contextOptionsRoute(req);
    assert.equal(res.status, 403);
  });
});

describe('Slice 12: POST /api/learner/context Route & Service', () => {
  const CTX_NEW_ID = 'cccccccc-1111-4111-8111-111111111111';

  const createMockDb = (customState = {}) => {
    const state = {
      accounts: [{ id: LEARNER_A_ID, role: 'LEARNER', status: 'ACTIVE' }],
      languages: [{ id: LANG_EN_ID, code: 'en', names: { vi: 'Tiếng Anh' }, isLearnable: true }],
      courses: [
        {
          id: COURSE_EN_ID,
          languageId: LANG_EN_ID,
          frameworkId: FW_CEFR_ID,
          names: { vi: 'Khóa Anh' },
          isActive: true,
          language: { id: LANG_EN_ID, code: 'en', names: { vi: 'Tiếng Anh' }, isLearnable: true },
          framework: { id: FW_CEFR_ID, code: 'CEFR', version: '2020', names: { vi: 'CEFR' } },
        },
      ],
      levels: [
        { id: LVL_A1_ID, frameworkId: FW_CEFR_ID, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
        { id: LVL_A2_ID, frameworkId: FW_CEFR_ID, code: 'A2', label: { vi: 'Sơ cấp' }, position: 2 },
      ],
      units: [
        {
          id: 'u1',
          courseId: COURSE_EN_ID,
          level: { id: LVL_A1_ID, frameworkId: FW_CEFR_ID, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
          lessons: [
            {
              id: 'l1',
              availability: 'AVAILABLE',
              activeRevisionId: 'rev1',
              activeRevision: { id: 'rev1', lessonId: 'l1', status: 'PUBLISHED' },
            },
          ],
        },
      ],
      contexts: [],
      ...customState,
    };

    const mockPrisma = {
      $transaction: async (fn) => fn(mockPrisma),
      $queryRaw: async (sql) => {
        const str = sql.join ? sql.join('') : String(sql);
        if (str.includes('app.levels') && str.includes('FOR SHARE')) {
          const referencedLevelIds = new Set(state.units.map((u) => u.level?.id || u.levelId).filter(Boolean));
          return state.levels.filter((l) => referencedLevelIds.has(l.id)).map((l) => ({ id: l.id, position: l.position }));
        }
        if (str.includes('app.lesson_revisions') && str.includes('FOR SHARE')) {
          const revs = state.units.flatMap((u) => (u.lessons || []).map((l) => l.activeRevision).filter(Boolean));
          return revs.map((r) => ({ id: r.id, lessonId: r.lessonId, status: r.status }));
        }
        if (str.includes('app.lessons') && str.includes('FOR SHARE')) {
          const lessons = state.units.flatMap((u) => u.lessons || []);
          return lessons.map((l) => ({ id: l.id, activeRevisionId: l.activeRevisionId || null }));
        }
        if (str.includes('app.units') && str.includes('FOR SHARE')) {
          return state.units.map((u) => ({ id: u.id }));
        }
        return [{ id: 'locked' }];
      },
      $executeRaw: async () => 1,
      account: {
        findUnique: async ({ where }) => state.accounts.find((a) => a.id === where.id) || null,
      },
      language: {
        findUnique: async ({ where }) => state.languages.find((l) => l.id === where.id) || null,
        findMany: async () => state.languages,
      },
      course: {
        findUnique: async ({ where }) => state.courses.find((c) => c.id === where.id) || null,
      },
      level: {
        findUnique: async ({ where }) => state.levels.find((l) => l.id === where.id) || null,
      },
      unit: {
        findMany: async ({ where }) => state.units.filter((u) => !where?.courseId || u.courseId === where.courseId),
        count: async ({ where }) => state.units.filter((u) => !where?.courseId || u.courseId === where.courseId).length,
      },
      lesson: {
        count: async () => state.units.flatMap((u) => u.lessons || []).length,
      },
      learningContext: {
        count: async ({ where }) => state.contexts.filter((c) => c.learnerId === where.learnerId && c.status === where.status).length,
        findUnique: async ({ where }) => {
          if (where.id) return state.contexts.find((c) => c.id === where.id) || null;
          if (where.learnerId_languageId) {
            return (
              state.contexts.find(
                (c) => c.learnerId === where.learnerId_languageId.learnerId && c.languageId === where.learnerId_languageId.languageId
              ) || null
            );
          }
          return null;
        },
        findFirst: async ({ where }) => state.contexts.find((c) => c.id === where.id) || null,
        create: async ({ data }) => {
          const lang = state.languages.find((l) => l.id === data.languageId);
          const course = state.courses.find((c) => c.id === data.courseId);
          const startLvl = state.levels.find((l) => l.id === data.selectedStartLevelId) || null;
          const workLvl = state.levels.find((l) => l.id === data.workingLevelId) || null;
          const row = {
            id: data.id,
            learnerId: data.learnerId,
            languageId: data.languageId,
            courseId: data.courseId,
            status: data.status,
            rowVersion: data.rowVersion || 1n,
            startSource: data.startSource || null,
            selfReport: data.selfReport || null,
            selectedStartLevelId: data.selectedStartLevelId || null,
            workingLevelId: data.workingLevelId || null,
            language: lang,
            course: course,
            selectedStartLevel: startLvl,
            workingLevel: workLvl,
          };
          state.contexts.push(row);
          return row;
        },
      },
    };

    return { mockPrisma, state };
  };

  test('strict schema validation rejects extra keys with 400', async () => {
    const { mockPrisma } = createMockDb();
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const req = new Request('http://localhost:3000/api/learner/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        contextId: CTX_NEW_ID,
        languageId: LANG_EN_ID,
        courseId: COURSE_EN_ID,
        startSource: 'DEFAULT',
        extraField: 'not-allowed',
      }),
    });

    const res = await contextPostRoute(req);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });

  test('creates context with DEFAULT startSource resolving lowest published level', async () => {
    const { mockPrisma, state } = createMockDb();
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const req = new Request('http://localhost:3000/api/learner/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        contextId: CTX_NEW_ID,
        languageId: LANG_EN_ID,
        courseId: COURSE_EN_ID,
        startSource: 'DEFAULT',
      }),
    });

    const res = await contextPostRoute(req);
    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.data.id, CTX_NEW_ID);
    assert.equal(json.data.status, 'ACTIVE');
    assert.equal(json.data.rowVersion, '1');
    assert.equal(json.data.startSource, 'DEFAULT');
    assert.equal(json.data.selectedStartLevel.id, LVL_A1_ID);
    assert.equal(json.data.workingLevel.id, LVL_A1_ID);

    assert.equal(state.contexts.length, 1);
  });

  test('creates context with SELF_REPORT startSource storing selfReport provenance', async () => {
    const { mockPrisma, state } = createMockDb();
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const req = new Request('http://localhost:3000/api/learner/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        contextId: CTX_NEW_ID,
        languageId: LANG_EN_ID,
        courseId: COURSE_EN_ID,
        startSource: 'SELF_REPORT',
        levelId: LVL_A1_ID,
      }),
    });

    const res = await contextPostRoute(req);
    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.data.id, CTX_NEW_ID);
    assert.equal(json.data.startSource, 'SELF_REPORT');
    assert.equal(json.data.selectedStartLevel.id, LVL_A1_ID);
    assert.deepEqual(state.contexts[0].selfReport, { levelId: LVL_A1_ID });
  });

  test('dedup: exact same contextId and same selection replays persisted row', async () => {
    const { mockPrisma, state } = createMockDb();
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const payload = {
      contextId: CTX_NEW_ID,
      languageId: LANG_EN_ID,
      courseId: COURSE_EN_ID,
      startSource: 'DEFAULT',
    };

    // First call: create
    const res1 = await contextPostRoute(new Request('http://localhost:3000/api/learner/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify(payload),
    }));
    assert.equal(res1.status, 201);

    // Second call: replay
    const res2 = await contextPostRoute(new Request('http://localhost:3000/api/learner/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify(payload),
    }));
    assert.equal(res2.status, 201);
    const json2 = await res2.json();
    assert.equal(json2.data.id, CTX_NEW_ID);
    assert.equal(state.contexts.length, 1);
  });

  test('capacity: rejects creating 3rd active context with 409', async () => {
    const { mockPrisma } = createMockDb({
      contexts: [
        { id: 'c1', learnerId: LEARNER_A_ID, languageId: 'lang1', courseId: COURSE_EN_ID, status: 'ACTIVE' },
        { id: 'c2', learnerId: LEARNER_A_ID, languageId: 'lang2', courseId: COURSE_EN_ID, status: 'ACTIVE' },
      ],
    });
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const req = new Request('http://localhost:3000/api/learner/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        contextId: CTX_NEW_ID,
        languageId: LANG_EN_ID,
        courseId: COURSE_EN_ID,
        startSource: 'DEFAULT',
      }),
    });

    const res = await contextPostRoute(req);
    assert.equal(res.status, 409);
    const json = await res.json();
    assert.equal(json.error.code, 'CAPACITY_EXCEEDED');
  });

  test('single-language uniqueness: rejects second context for same language with 409', async () => {
    const { mockPrisma } = createMockDb({
      contexts: [
        { id: 'c1', learnerId: LEARNER_A_ID, languageId: LANG_EN_ID, courseId: COURSE_EN_ID, status: 'PAUSED' },
      ],
    });
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const req = new Request('http://localhost:3000/api/learner/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        contextId: CTX_NEW_ID,
        languageId: LANG_EN_ID,
        courseId: COURSE_EN_ID,
        startSource: 'DEFAULT',
      }),
    });

    const res = await contextPostRoute(req);
    assert.equal(res.status, 409);
    const json = await res.json();
    assert.equal(json.error.code, 'CONTEXT_ALREADY_EXISTS_FOR_LANGUAGE');
  });

  test('POST /api/learner/context: rejects foreign origin with 403 FORBIDDEN_ORIGIN and zero writes', async () => {
    let dbAccessed = false;
    const { mockPrisma, state } = createMockDb();
    mockPrisma.account.findUnique = async () => {
      dbAccessed = true;
      return null;
    };
    setLearnerPrismaForTest(mockPrisma);

    const req = new Request('http://localhost:3000/api/learner/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://malicious-site.example.com',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        contextId: CTX_NEW_ID,
        languageId: LANG_EN_ID,
        courseId: COURSE_EN_ID,
        startSource: 'DEFAULT',
      }),
    });

    const res = await contextPostRoute(req);
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.error.code, 'FORBIDDEN_ORIGIN');
    assert.equal(dbAccessed, false, 'No DB work allowed before Origin validation');
    assert.equal(state.contexts.length, 0);
  });

  test('POST /api/learner/context: rejects same-site sibling origin with 403', async () => {
    const req = new Request('http://localhost:3000/api/learner/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://attacker.localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        contextId: CTX_NEW_ID,
        languageId: LANG_EN_ID,
        courseId: COURSE_EN_ID,
        startSource: 'DEFAULT',
      }),
    });

    const res = await contextPostRoute(req);
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.error.code, 'FORBIDDEN_ORIGIN');
  });

  test('POST /api/learner/context: rejects missing or null origin with 403', async () => {
    // Missing origin
    const reqMissing = new Request('http://localhost:3000/api/learner/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        contextId: CTX_NEW_ID,
        languageId: LANG_EN_ID,
        courseId: COURSE_EN_ID,
        startSource: 'DEFAULT',
      }),
    });
    const resMissing = await contextPostRoute(reqMissing);
    assert.equal(resMissing.status, 403);

    // Null origin
    const reqNull = new Request('http://localhost:3000/api/learner/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'null',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        contextId: CTX_NEW_ID,
        languageId: LANG_EN_ID,
        courseId: COURSE_EN_ID,
        startSource: 'DEFAULT',
      }),
    });
    const resNull = await contextPostRoute(reqNull);
    assert.equal(resNull.status, 403);
  });

  test('POST /api/learner/context: rejects non-JSON content-type with 415', async () => {
    const req = new Request('http://localhost:3000/api/learner/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: 'plain-text-body',
    });

    const res = await contextPostRoute(req);
    assert.equal(res.status, 415);
    const json = await res.json();
    assert.equal(json.error.code, 'UNSUPPORTED_MEDIA_TYPE');
  });

  test('POST /api/learner/context: accepts seeded all-zero version/variant IDs', async () => {
    const SEEDED_LANG_ID = '00000000-0000-0000-0000-000000000001';
    const SEEDED_COURSE_ID = '00000000-0000-0000-0000-000000000010';
    const SEEDED_LEVEL_ID = '00000000-0000-0000-0000-000000000100';
    const SEEDED_CTX_ID = '00000000-0000-0000-0000-000000001000';

    const { mockPrisma, state } = createMockDb({
      languages: [{ id: SEEDED_LANG_ID, code: 'seed-en', names: { vi: 'Tiếng Anh Gốc' }, isLearnable: true }],
      courses: [
        {
          id: SEEDED_COURSE_ID,
          languageId: SEEDED_LANG_ID,
          frameworkId: FW_CEFR_ID,
          names: { vi: 'Khóa Seed' },
          isActive: true,
          language: { id: SEEDED_LANG_ID, code: 'seed-en', names: { vi: 'Tiếng Anh Gốc' }, isLearnable: true },
          framework: { id: FW_CEFR_ID, code: 'CEFR', version: '2020', names: { vi: 'CEFR' } },
        },
      ],
      levels: [
        { id: SEEDED_LEVEL_ID, frameworkId: FW_CEFR_ID, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
      ],
      units: [
        {
          id: 'u-seed',
          courseId: SEEDED_COURSE_ID,
          level: { id: SEEDED_LEVEL_ID, frameworkId: FW_CEFR_ID, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
          lessons: [
            {
              id: 'l-seed',
              availability: 'AVAILABLE',
              activeRevisionId: 'rev-seed',
              activeRevision: { id: 'rev-seed', lessonId: 'l-seed', status: 'PUBLISHED' },
            },
          ],
        },
      ],
    });
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const req = new Request('http://localhost:3000/api/learner/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        contextId: SEEDED_CTX_ID,
        languageId: SEEDED_LANG_ID,
        courseId: SEEDED_COURSE_ID,
        startSource: 'DEFAULT',
      }),
    });

    const res = await contextPostRoute(req);
    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.data.id, SEEDED_CTX_ID);
    assert.equal(json.data.targetLanguage.id, SEEDED_LANG_ID);
    assert.equal(json.data.course.id, SEEDED_COURSE_ID);
    assert.equal(json.data.selectedStartLevel.id, SEEDED_LEVEL_ID);
  });

  test('POST /api/learner/context: uppercase UUID create and exact uppercase replay succeed without 409', async () => {
    const UPPER_CTX = 'CCCCCCCC-EEEE-4EEE-8EEE-EEEEEEEEEEEE';
    const UPPER_LANG = LANG_EN_ID.toUpperCase();
    const UPPER_COURSE = COURSE_EN_ID.toUpperCase();
    const UPPER_LEVEL = LVL_A1_ID.toUpperCase();

    const { mockPrisma, state } = createMockDb();
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const payload = {
      contextId: UPPER_CTX,
      languageId: UPPER_LANG,
      courseId: UPPER_COURSE,
      startSource: 'SELF_REPORT',
      levelId: UPPER_LEVEL,
    };

    // First call: creates with uppercase UUIDs
    const res1 = await contextPostRoute(new Request('http://localhost:3000/api/learner/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify(payload),
    }));
    assert.equal(res1.status, 201);
    const json1 = await res1.json();
    // Persisted and returned IDs are normalized lowercase
    assert.equal(json1.data.id, UPPER_CTX.toLowerCase());
    assert.equal(json1.data.targetLanguage.id, LANG_EN_ID);
    assert.equal(json1.data.course.id, COURSE_EN_ID);
    assert.equal(json1.data.selectedStartLevel.id, LVL_A1_ID);

    // Second call: exact uppercase replay succeeds 201 without 409
    const res2 = await contextPostRoute(new Request('http://localhost:3000/api/learner/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify(payload),
    }));
    assert.equal(res2.status, 201);
    const json2 = await res2.json();
    assert.equal(json2.data.id, UPPER_CTX.toLowerCase());
    assert.equal(state.contexts.length, 1);
  });
});

describe('Slice 12: PATCH /api/learner/contexts/[contextId] Lifecycle & CAS', () => {
  const CTX_ID = 'cccccccc-2222-4222-8222-222222222222';

  const createPatchDb = (contextPatch = {}, customState = {}) => {
    const lang = { id: LANG_EN_ID, code: 'en', names: { vi: 'Tiếng Anh' }, isLearnable: true };
    const course = {
      id: COURSE_EN_ID,
      languageId: LANG_EN_ID,
      frameworkId: FW_CEFR_ID,
      names: { vi: 'Khóa Anh' },
      isActive: customState.courseIsActive !== undefined ? customState.courseIsActive : true,
      framework: { id: FW_CEFR_ID, code: 'CEFR', version: '2020', names: { vi: 'CEFR' } },
    };

    const initialContext = {
      id: CTX_ID,
      learnerId: LEARNER_A_ID,
      languageId: LANG_EN_ID,
      courseId: COURSE_EN_ID,
      status: 'ACTIVE',
      rowVersion: 1n,
      startSource: 'DEFAULT',
      selectedStartLevelId: LVL_A1_ID,
      workingLevelId: LVL_A1_ID,
      language: lang,
      course: course,
      selectedStartLevel: { id: LVL_A1_ID, frameworkId: FW_CEFR_ID, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
      workingLevel: { id: LVL_A1_ID, frameworkId: FW_CEFR_ID, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
      ...contextPatch,
    };

    const state = {
      accounts: [{ id: LEARNER_A_ID, role: 'LEARNER', status: 'ACTIVE' }],
      contexts: [initialContext],
      ...customState,
    };

    const mockPrisma = {
      $transaction: async (fn) => fn(mockPrisma),
      $queryRaw: async (sql) => {
        const str = sql.join ? sql.join('') : String(sql);
        if (str.includes('clock_timestamp')) {
          return [{ ts: new Date() }];
        }
        return [{ id: 'locked' }];
      },
      $executeRaw: async (strings, ...v) => {
        const sql = strings.join('');
        if (sql.includes('UPDATE app.learning_contexts')) {
          const targetStatus = v[0];
          const ctx = state.contexts.find((c) => c.id === CTX_ID);
          if (ctx) {
            ctx.status = targetStatus;
            ctx.rowVersion = ctx.rowVersion + 1n;
          }
        }
        return 1;
      },
      account: {
        findUnique: async ({ where }) => state.accounts.find((a) => a.id === where.id) || null,
      },
      language: {
        findUnique: async () => lang,
      },
      course: {
        findUnique: async () => course,
      },
      learningContext: {
        count: async ({ where }) => state.contexts.filter((c) => c.learnerId === where.learnerId && c.status === where.status).length,
        findFirst: async ({ where }) => state.contexts.find((c) => c.id === where.id && (!where.learnerId || c.learnerId === where.learnerId)) || null,
      },
    };

    return { mockPrisma, state };
  };

  test('transitions ACTIVE -> PAUSED incrementing rowVersion from 1 to 2', async () => {
    const { mockPrisma, state } = createPatchDb();
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const req = new Request(`http://localhost:3000/api/learner/contexts/${CTX_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        status: 'PAUSED',
        expectedRowVersion: '1',
      }),
    });

    const res = await contextPatchRoute(req, { params: Promise.resolve({ contextId: CTX_ID }) });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.status, 'PAUSED');
    assert.equal(json.data.rowVersion, '2');
    assert.equal(state.contexts[0].status, 'PAUSED');
    assert.equal(state.contexts[0].rowVersion, 2n);
  });

  test('transitions PAUSED -> ACTIVE incrementing rowVersion from 2 to 3', async () => {
    const { mockPrisma, state } = createPatchDb({ status: 'PAUSED', rowVersion: 2n });
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const req = new Request(`http://localhost:3000/api/learner/contexts/${CTX_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        status: 'ACTIVE',
        expectedRowVersion: '2',
      }),
    });

    const res = await contextPatchRoute(req, { params: Promise.resolve({ contextId: CTX_ID }) });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.status, 'ACTIVE');
    assert.equal(json.data.rowVersion, '3');
    assert.equal(state.contexts[0].status, 'ACTIVE');
    assert.equal(state.contexts[0].rowVersion, 3n);
  });

  test('no-op when context is already desired status with expected version', async () => {
    const { mockPrisma, state } = createPatchDb({ status: 'PAUSED', rowVersion: 2n });
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const req = new Request(`http://localhost:3000/api/learner/contexts/${CTX_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        status: 'PAUSED',
        expectedRowVersion: '2',
      }),
    });

    const res = await contextPatchRoute(req, { params: Promise.resolve({ contextId: CTX_ID }) });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.status, 'PAUSED');
    assert.equal(json.data.rowVersion, '2');
    assert.equal(state.contexts[0].rowVersion, 2n); // Not incremented!
  });

  test('replays already applied transition when version is exactly expected + 1 and status matches', async () => {
    const { mockPrisma, state } = createPatchDb({ status: 'PAUSED', rowVersion: 2n });
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    // Client sent expectedRowVersion: '1', but DB already transitioned to '2' and PAUSED
    const req = new Request(`http://localhost:3000/api/learner/contexts/${CTX_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        status: 'PAUSED',
        expectedRowVersion: '1',
      }),
    });

    const res = await contextPatchRoute(req, { params: Promise.resolve({ contextId: CTX_ID }) });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.status, 'PAUSED');
    assert.equal(json.data.rowVersion, '2');
  });

  test('rejects stale rowVersion with 409', async () => {
    const { mockPrisma } = createPatchDb({ status: 'ACTIVE', rowVersion: 5n });
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const req = new Request(`http://localhost:3000/api/learner/contexts/${CTX_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        status: 'PAUSED',
        expectedRowVersion: '2',
      }),
    });

    const res = await contextPatchRoute(req, { params: Promise.resolve({ contextId: CTX_ID }) });
    assert.equal(res.status, 409);
    const json = await res.json();
    assert.equal(json.error.code, 'STALE_ROW_VERSION');
  });

  test('foreign contextId returns 404', async () => {
    const { mockPrisma } = createPatchDb({ learnerId: LEARNER_B_ID });
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const req = new Request(`http://localhost:3000/api/learner/contexts/${CTX_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        status: 'PAUSED',
        expectedRowVersion: '1',
      }),
    });

    const res = await contextPatchRoute(req, { params: Promise.resolve({ contextId: CTX_ID }) });
    assert.equal(res.status, 404);
  });

  test('pause remains possible when course becomes inactive', async () => {
    const { mockPrisma, state } = createPatchDb({ status: 'ACTIVE', rowVersion: 1n }, { courseIsActive: false });
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const req = new Request(`http://localhost:3000/api/learner/contexts/${CTX_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        status: 'PAUSED',
        expectedRowVersion: '1',
      }),
    });

    const res = await contextPatchRoute(req, { params: Promise.resolve({ contextId: CTX_ID }) });
    assert.equal(res.status, 200);
    assert.equal(state.contexts[0].status, 'PAUSED');
  });

  test('resume fails with 403 when course is inactive', async () => {
    const { mockPrisma } = createPatchDb({ status: 'PAUSED', rowVersion: 2n }, { courseIsActive: false });
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const req = new Request(`http://localhost:3000/api/learner/contexts/${CTX_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        status: 'ACTIVE',
        expectedRowVersion: '2',
      }),
    });

    const res = await contextPatchRoute(req, { params: Promise.resolve({ contextId: CTX_ID }) });
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.error.code, 'COURSE_INACTIVE');
  });

  test('PATCH: rejects foreign origin with 403 FORBIDDEN_ORIGIN', async () => {
    let dbAccessed = false;
    const { mockPrisma } = createPatchDb();
    mockPrisma.account.findUnique = async () => {
      dbAccessed = true;
      return null;
    };
    setLearnerPrismaForTest(mockPrisma);

    const req = new Request(`http://localhost:3000/api/learner/contexts/${CTX_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://malicious.example.com',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({ status: 'PAUSED', expectedRowVersion: '1' }),
    });

    const res = await contextPatchRoute(req, { params: Promise.resolve({ contextId: CTX_ID }) });
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.error.code, 'FORBIDDEN_ORIGIN');
    assert.equal(dbAccessed, false, 'No DB work allowed before Origin validation');
  });

  test('PATCH: rejects same-site sibling origin with 403', async () => {
    const req = new Request(`http://localhost:3000/api/learner/contexts/${CTX_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://attacker.localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({ status: 'PAUSED', expectedRowVersion: '1' }),
    });

    const res = await contextPatchRoute(req, { params: Promise.resolve({ contextId: CTX_ID }) });
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.error.code, 'FORBIDDEN_ORIGIN');
  });

  test('PATCH: rejects missing or null origin with 403', async () => {
    // Missing origin
    const reqMissing = new Request(`http://localhost:3000/api/learner/contexts/${CTX_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({ status: 'PAUSED', expectedRowVersion: '1' }),
    });
    const resMissing = await contextPatchRoute(reqMissing, { params: Promise.resolve({ contextId: CTX_ID }) });
    assert.equal(resMissing.status, 403);

    // Null origin
    const reqNull = new Request(`http://localhost:3000/api/learner/contexts/${CTX_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'null',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({ status: 'PAUSED', expectedRowVersion: '1' }),
    });
    const resNull = await contextPatchRoute(reqNull, { params: Promise.resolve({ contextId: CTX_ID }) });
    assert.equal(resNull.status, 403);
  });

  test('PATCH: rejects non-JSON content-type with 415', async () => {
    const req = new Request(`http://localhost:3000/api/learner/contexts/${CTX_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'text/plain',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: 'plain-text',
    });

    const res = await contextPatchRoute(req, { params: Promise.resolve({ contextId: CTX_ID }) });
    assert.equal(res.status, 415);
    const json = await res.json();
    assert.equal(json.error.code, 'UNSUPPORTED_MEDIA_TYPE');
  });

  test('PATCH: fails closed on invalid DB clock with 503 without host time fallback', async () => {
    const { mockPrisma } = createPatchDb();
    mockPrisma.$queryRaw = async (sql) => {
      const str = sql.join ? sql.join('') : String(sql);
      if (str.includes('clock_timestamp')) {
        return [{ ts: 'invalid-clock-string' }];
      }
      return [{ id: 'locked' }];
    };
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const req = new Request(`http://localhost:3000/api/learner/contexts/${CTX_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        status: 'PAUSED',
        expectedRowVersion: '1',
      }),
    });

    const res = await contextPatchRoute(req, { params: Promise.resolve({ contextId: CTX_ID }) });
    assert.equal(res.status, 503);
    const json = await res.json();
    assert.equal(json.error.code, 'SERVICE_UNAVAILABLE');
  });

  test('PATCH: canonicalizes uppercase path contextId and succeeds', async () => {
    const UPPER_ID = CTX_ID.toUpperCase();
    const { mockPrisma, state } = createPatchDb();
    setLearnerPrismaForTest(mockPrisma);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const req = new Request(`http://localhost:3000/api/learner/contexts/${UPPER_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
      },
      body: JSON.stringify({
        status: 'PAUSED',
        expectedRowVersion: '1',
      }),
    });

    const res = await contextPatchRoute(req, { params: Promise.resolve({ contextId: UPPER_ID }) });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.id, CTX_ID.toLowerCase());
    assert.equal(json.data.status, 'PAUSED');
  });
});

describe('Slice 12: PostgreSQL Concurrency Suite Environment Guards (Finding 7)', () => {
  const harnessUrl = new URL('./harness/server-only.mjs', import.meta.url).href;
  const concurrencyTestPath = fileURLToPath(
    new URL('./context-concurrency.test.mjs', import.meta.url)
  );

  test('context-concurrency test fails immediately when SLICE11_TEST_DATABASE_OWNED is missing or not 1', () => {
    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', '--experimental-test-module-mocks', '--import', harnessUrl, concurrencyTestPath],
      {
        cwd: os.tmpdir(),
        env: {
          ...process.env,
          SLICE11_TEST_DATABASE_URL: 'postgresql://postgres:pass@127.0.0.1:5432/slice11_test?schema=app',
          SLICE11_TEST_DATABASE_OWNED: '0',
          DATABASE_URL: '',
        },
        encoding: 'utf8',
      }
    );
    assert.notEqual(result.status, 0);
    const combinedOutput = (result.stderr || '') + (result.stdout || '');
    assert.match(
      combinedOutput,
      /Explicit owned optin marker required/,
      `Expected explicit owned optin marker diagnostic; got status=${result.status}, output=${combinedOutput}`
    );
  });

  test('context-concurrency test fails immediately when SLICE11_TEST_DATABASE_URL is not loopback', () => {
    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', '--experimental-test-module-mocks', '--import', harnessUrl, concurrencyTestPath],
      {
        cwd: os.tmpdir(),
        env: {
          ...process.env,
          SLICE11_TEST_DATABASE_URL: 'postgresql://postgres:pass@192.168.1.100:5432/slice11_test?schema=app',
          SLICE11_TEST_DATABASE_OWNED: '1',
          DATABASE_URL: '',
        },
        encoding: 'utf8',
      }
    );
    assert.notEqual(result.status, 0);
    const combinedOutput = (result.stderr || '') + (result.stdout || '');
    assert.match(
      combinedOutput,
      /Loopback host required/,
      `Expected loopback host diagnostic; got status=${result.status}, output=${combinedOutput}`
    );
  });

  test('context-concurrency test fails immediately when only DATABASE_URL is set without SLICE11_TEST_DATABASE_URL', () => {
    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', '--experimental-test-module-mocks', '--import', harnessUrl, concurrencyTestPath],
      {
        cwd: os.tmpdir(),
        env: {
          ...process.env,
          DATABASE_URL: 'postgresql://postgres:pass@127.0.0.1:5432/slice11_test?schema=app',
          SLICE11_TEST_DATABASE_URL: '',
          SLICE11_TEST_DATABASE_OWNED: '1',
        },
        encoding: 'utf8',
      }
    );
    assert.notEqual(result.status, 0);
    const combinedOutput = (result.stderr || '') + (result.stdout || '');
    assert.match(
      combinedOutput,
      /Explicit owned loopback DB required/,
      `Expected explicit owned loopback DB diagnostic; got status=${result.status}, output=${combinedOutput}`
    );
  });
});

describe('P2: Safe initial-level selection and recovery (startLearningContext & route)', () => {
  const NULL_CTX_ID = '99999999-9999-4999-8999-999999999999';

  function createStartDb(contextOverrides = {}, customState = {}) {
    const lang = { id: LANG_EN_ID, code: 'en', names: { vi: 'Tiếng Anh' }, isLearnable: true };
    const course = {
      id: COURSE_EN_ID,
      languageId: LANG_EN_ID,
      frameworkId: FW_CEFR_ID,
      names: { vi: 'Khóa Anh' },
      isActive: customState.courseIsActive !== undefined ? customState.courseIsActive : true,
      language: lang,
      framework: { id: FW_CEFR_ID, code: 'CEFR', version: '2020', names: { vi: 'CEFR' } },
    };
    const levelA1 = { id: LVL_A1_ID, frameworkId: FW_CEFR_ID, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 };
    const levelA2 = { id: LVL_A2_ID, frameworkId: FW_CEFR_ID, code: 'A2', label: { vi: 'Sơ cấp' }, position: 2 };

    const initialContext = {
      id: NULL_CTX_ID,
      learnerId: LEARNER_A_ID,
      languageId: LANG_EN_ID,
      courseId: COURSE_EN_ID,
      status: 'ACTIVE',
      rowVersion: 1n,
      startSource: null,
      selectedStartLevelId: null,
      workingLevelId: null,
      startResultId: null,
      selfReport: null,
      language: lang,
      course: course,
      selectedStartLevel: null,
      workingLevel: null,
      ...contextOverrides,
    };

    const state = {
      accounts: [{ id: LEARNER_A_ID, role: 'LEARNER', status: 'ACTIVE' }],
      contexts: [initialContext],
      levels: [levelA1, levelA2],
      units: [
        {
          id: 'u-1',
          courseId: COURSE_EN_ID,
          levelId: LVL_A1_ID,
          level: levelA1,
          lessons: [
            {
              id: 'l-1',
              unitId: 'u-1',
              availability: 'AVAILABLE',
              activeRevisionId: 'rev-1',
              activeRevision: { id: 'rev-1', lessonId: 'l-1', status: 'PUBLISHED' },
            },
          ],
        },
      ],
      consumptions: [],
      attempts: [],
      completions: [],
      assessmentAttempts: [],
      ...customState,
    };

    const mockPrisma = {
      $transaction: async (fn) => fn(mockPrisma),
      $queryRaw: async (sql, ...args) => {
        const str = Array.isArray(sql) ? sql.join('?') : String(sql);
        if (str.includes('clock_timestamp')) return [{ ts: new Date() }];
        if (str.includes('app.lesson_revisions')) {
          return state.units.flatMap((u) =>
            u.lessons.filter((l) => l.activeRevisionId).map((l) => ({ id: l.activeRevisionId, lessonId: l.id, status: l.activeRevision?.status || 'PUBLISHED' }))
          );
        }
        if (str.includes('FROM app.levels') && str.includes('FOR SHARE')) {
          return state.levels.map((l) => ({ id: l.id, position: l.position }));
        }
        if (str.includes('FROM app.units') && str.includes('FOR SHARE')) {
          return state.units.map((u) => ({ id: u.id }));
        }
        if (str.includes('FROM app.lessons') && str.includes('FOR SHARE')) {
          return state.units.flatMap((u) => u.lessons.map((l) => ({ id: l.id, activeRevisionId: l.activeRevisionId })));
        }
        return [{ id: 'locked' }];
      },
      $executeRaw: async (strings, ...v) => {
        const sql = strings.join('');
        if (sql.includes('UPDATE app.learning_contexts')) {
          const selectedStartLevelId = v[0];
          const workingLevelId = v[1];
          const startSource = v[2];
          const selfReport = v[3] ? JSON.parse(v[3]) : null;
          const ctx = state.contexts.find((c) => c.id === NULL_CTX_ID);
          if (ctx) {
            ctx.selectedStartLevelId = selectedStartLevelId;
            ctx.workingLevelId = workingLevelId;
            ctx.startSource = startSource;
            ctx.selfReport = selfReport;
            ctx.selectedStartLevel = state.levels.find((l) => l.id === selectedStartLevelId) || null;
            ctx.workingLevel = state.levels.find((l) => l.id === workingLevelId) || null;
            ctx.rowVersion = ctx.rowVersion + 1n;
          }
        }
        return 1;
      },
      account: {
        findUnique: async ({ where }) => state.accounts.find((a) => a.id === where.id) || null,
      },
      language: {
        findUnique: async ({ where }) => (where.id === LANG_EN_ID ? lang : null),
      },
      course: {
        findUnique: async ({ where }) => (where.id === COURSE_EN_ID ? course : null),
      },
      level: {
        findUnique: async ({ where }) => state.levels.find((l) => l.id === where.id) || null,
      },
      unit: {
        findMany: async () => state.units,
        count: async () => state.units.length,
      },
      lesson: {
        count: async () => state.units.flatMap((u) => u.lessons).length,
      },
      learningContext: {
        findFirst: async ({ where }) => {
          const c = state.contexts.find((ctx) => ctx.id === where.id && (!where.learnerId || ctx.learnerId === where.learnerId));
          if (!c) return null;
          return {
            ...c,
            _count: {
              lessonConsumptions: state.consumptions.length,
              lessonAttempts: state.attempts.length,
              lessonCompletions: state.completions.length,
              assessmentAttempts: state.assessmentAttempts.length,
            },
          };
        },
        findUnique: async ({ where }) => {
          const c = state.contexts.find((ctx) => ctx.id === where.id);
          if (!c) return null;
          return {
            ...c,
            _count: {
              lessonConsumptions: state.consumptions.length,
              lessonAttempts: state.attempts.length,
              lessonCompletions: state.completions.length,
              assessmentAttempts: state.assessmentAttempts.length,
            },
          };
        },
        count: async () => state.contexts.filter((c) => c.status === 'ACTIVE').length,
      },
    };

    return { mockPrisma, state };
  }

  test('P2: createLearningContext with startSource=DEFAULT returns 409 COURSE_NO_AVAILABLE_LESSONS when course has no lessons', async () => {
    const { mockPrisma, state } = createStartDb();
    // Empty units
    state.units = [];

    await assert.rejects(
      async () => {
        await createLearningContext(
          LEARNER_A_ID,
          {
            contextId: 'aaaaaaaa-1111-4111-8111-111111111111',
            languageId: LANG_EN_ID,
            courseId: COURSE_EN_ID,
            startSource: 'DEFAULT',
          },
          mockPrisma
        );
      },
      (err) => {
        assert.equal(err.status, 409);
        assert.equal(err.code, 'COURSE_NO_AVAILABLE_LESSONS');
        return true;
      }
    );
  });

  test('P2: POST /api/contexts/[id]/start route validates Origin, Content-Type, UUID and auth', async () => {
    const { mockPrisma } = createStartDb();
    setLearnerPrismaForTest(mockPrisma);

    // 1. Foreign origin returns 403
    const foreignRes = await contextStartRoute(
      new Request(`http://localhost:3000/api/learner/contexts/${NULL_CTX_ID}/start`, {
        method: 'POST',
        headers: { Origin: 'http://evil.com', Host: 'localhost:3000', 'Content-Type': 'application/json' },
        body: JSON.stringify({ startSource: 'DEFAULT', expectedRowVersion: '1' }),
      }),
      { params: Promise.resolve({ contextId: NULL_CTX_ID }) }
    );
    assert.equal(foreignRes.status, 403);

    // 2. Non-json returns 415
    const nonJsonRes = await contextStartRoute(
      new Request(`http://localhost:3000/api/learner/contexts/${NULL_CTX_ID}/start`, {
        method: 'POST',
        headers: { Origin: 'http://localhost:3000', Host: 'localhost:3000', 'Content-Type': 'text/plain' },
        body: 'startSource=DEFAULT',
      }),
      { params: Promise.resolve({ contextId: NULL_CTX_ID }) }
    );
    assert.equal(nonJsonRes.status, 415);

    // 3. Invalid UUID returns 400
    const badIdRes = await contextStartRoute(
      new Request('http://localhost:3000/api/learner/contexts/not-a-uuid/start', {
        method: 'POST',
        headers: { Origin: 'http://localhost:3000', Host: 'localhost:3000', 'Content-Type': 'application/json' },
        body: JSON.stringify({ startSource: 'DEFAULT', expectedRowVersion: '1' }),
      }),
      { params: Promise.resolve({ contextId: 'not-a-uuid' }) }
    );
    assert.equal(badIdRes.status, 400);

    // 4. Valid route call with DEFAULT recovers context and returns 200
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(LEARNER_A_ID)],
      get: (name) => (name.includes('auth-token') ? createMockSessionCookie(LEARNER_A_ID) : undefined),
      set: () => {},
      delete: () => {},
    };
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: LEARNER_A_ID, email: 'learner.a@lingora.edu.vn', email_confirmed_at: '2026-10-31T00:00:00Z' }), { status: 200 });

    const validRes = await contextStartRoute(
      new Request(`http://localhost:3000/api/learner/contexts/${NULL_CTX_ID}/start`, {
        method: 'POST',
        headers: { Origin: 'http://localhost:3000', Host: 'localhost:3000', 'Content-Type': 'application/json' },
        body: JSON.stringify({ startSource: 'DEFAULT', expectedRowVersion: '1' }),
      }),
      { params: Promise.resolve({ contextId: NULL_CTX_ID }) }
    );
    assert.equal(validRes.status, 200);
    const json = await validRes.json();
    assert.equal(json.data.startSource, 'DEFAULT');
    assert.equal(json.data.selectedStartLevel.id, LVL_A1_ID);
    assert.equal(json.data.workingLevel.id, LVL_A1_ID);
    assert.equal(json.data.rowVersion, '2');
  });

  test('P2: startLearningContext service rejects foreign context, inactive status, configured level, history and stale CAS', async () => {
    // 1. Foreign context returns 404
    const { mockPrisma: p1 } = createStartDb({ learnerId: LEARNER_B_ID });
    await assert.rejects(
      async () => {
        await startLearningContext(LEARNER_A_ID, NULL_CTX_ID, { startSource: 'DEFAULT', expectedRowVersion: '1' }, p1);
      },
      (err) => {
        assert.equal(err.status, 404);
        assert.equal(err.code, 'NOT_FOUND');
        return true;
      }
    );

    // 2. PAUSED context returns 409 CONTEXT_NOT_ACTIVE
    const { mockPrisma: p2 } = createStartDb({ status: 'PAUSED' });
    await assert.rejects(
      async () => {
        await startLearningContext(LEARNER_A_ID, NULL_CTX_ID, { startSource: 'DEFAULT', expectedRowVersion: '1' }, p2);
      },
      (err) => {
        assert.equal(err.status, 409);
        assert.equal(err.code, 'CONTEXT_NOT_ACTIVE');
        return true;
      }
    );

    // 3. Already-configured context returns 409 CONTEXT_ALREADY_CONFIGURED
    const { mockPrisma: p3 } = createStartDb({ selectedStartLevelId: LVL_A1_ID, workingLevelId: LVL_A1_ID });
    await assert.rejects(
      async () => {
        await startLearningContext(LEARNER_A_ID, NULL_CTX_ID, { startSource: 'DEFAULT', expectedRowVersion: '1' }, p3);
      },
      (err) => {
        assert.equal(err.status, 409);
        assert.equal(err.code, 'CONTEXT_ALREADY_CONFIGURED');
        return true;
      }
    );

    // 4. Context with history returns 409 CONTEXT_HAS_HISTORY
    const { mockPrisma: p4 } = createStartDb({}, { consumptions: [{ id: 'cons-1' }] });
    await assert.rejects(
      async () => {
        await startLearningContext(LEARNER_A_ID, NULL_CTX_ID, { startSource: 'DEFAULT', expectedRowVersion: '1' }, p4);
      },
      (err) => {
        assert.equal(err.status, 409);
        assert.equal(err.code, 'CONTEXT_HAS_HISTORY');
        return true;
      }
    );

    // 5. Stale CAS returns 409 STALE_ROW_VERSION
    const { mockPrisma: p5 } = createStartDb();
    await assert.rejects(
      async () => {
        await startLearningContext(LEARNER_A_ID, NULL_CTX_ID, { startSource: 'DEFAULT', expectedRowVersion: '999' }, p5);
      },
      (err) => {
        assert.equal(err.status, 409);
        assert.equal(err.code, 'STALE_ROW_VERSION');
        return true;
      }
    );

    // 6. Inactive course returns 403 COURSE_INACTIVE
    const { mockPrisma: p6 } = createStartDb({}, { courseIsActive: false });
    await assert.rejects(
      async () => {
        await startLearningContext(LEARNER_A_ID, NULL_CTX_ID, { startSource: 'DEFAULT', expectedRowVersion: '1' }, p6);
      },
      (err) => {
        assert.equal(err.status, 403);
        assert.equal(err.code, 'COURSE_INACTIVE');
        return true;
      }
    );
  });

  test('P2: startLearningContext with SELF_REPORT sets specified level and supports single replay', async () => {
    const { mockPrisma, state } = createStartDb();

    // 1. Valid SELF_REPORT start
    const result = await startLearningContext(
      LEARNER_A_ID,
      NULL_CTX_ID,
      {
        startSource: 'SELF_REPORT',
        levelId: LVL_A1_ID,
        expectedRowVersion: '1',
      },
      mockPrisma
    );

    assert.equal(result.startSource, 'SELF_REPORT');
    assert.equal(result.selectedStartLevel.id, LVL_A1_ID);
    assert.equal(result.workingLevel.id, LVL_A1_ID);
    assert.equal(result.rowVersion, '2');

    // 2. Exact same payload retry with prior expectedRowVersion ('1') returns current state (idempotent replay)
    const replay = await startLearningContext(
      LEARNER_A_ID,
      NULL_CTX_ID,
      {
        startSource: 'SELF_REPORT',
        levelId: LVL_A1_ID,
        expectedRowVersion: '1',
      },
      mockPrisma
    );
    assert.equal(replay.rowVersion, '2');
    assert.equal(replay.selectedStartLevel.id, LVL_A1_ID);
  });
});
