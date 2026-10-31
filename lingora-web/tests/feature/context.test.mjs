import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { loadLearnerContext } from '../../src/server/context/loader.ts';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import { getLearnerCookieName } from '../../src/server/auth/env.ts';

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

const { GET: contextRoute } = await import('../../src/app/api/learner/context/route.ts');

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
    assert.ok(!jsonStr.includes('rowVersion'));
    assert.ok(!jsonStr.includes('secret'));
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
