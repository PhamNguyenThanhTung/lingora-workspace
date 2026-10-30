import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';

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

let notFoundHookCalled = false;
let redirectHookTarget = null;

mock.module('next/navigation.js', {
  exports: {
    notFound: () => {
      notFoundHookCalled = true;
      const err = new Error('NEXT_NOT_FOUND');
      err.digest = 'NEXT_NOT_FOUND';
      throw err;
    },
    redirect: (url) => {
      redirectHookTarget = url;
      const err = new Error(`NEXT_REDIRECT:${url}`);
      err.digest = `NEXT_REDIRECT;${url}`;
      throw err;
    },
    useRouter: () => ({ push: () => {}, refresh: () => {} }),
    usePathname: () => '/courses',
  },
});

const {
  createCourseSchema,
  updateCourseSchema,
  toCourseDto,
  handleCoursePrismaError,
  isValidUuid,
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} = await import('../../src/server/courses/index.ts');

const {
  createUnitSchema,
  updateUnitSchema,
  toUnitDto,
  handleUnitPrismaError,
  listUnits,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit,
} = await import('../../src/server/units/index.ts');

const { GET: getCoursesRoute, POST: postCoursesRoute } = await import('../../src/app/api/courses/route.ts');
const {
  GET: getCourseDetailRoute,
  PATCH: patchCourseRoute,
  DELETE: deleteCourseRoute,
} = await import('../../src/app/api/courses/[courseId]/route.ts');

const { GET: getUnitsRoute, POST: postUnitsRoute } = await import('../../src/app/api/courses/[courseId]/units/route.ts');
const {
  PATCH: patchUnitRoute,
  DELETE: deleteUnitRoute,
} = await import('../../src/app/api/courses/[courseId]/units/[unitId]/route.ts');

const { setProductPrismaForTest } = await import('../../src/server/db/index.js');
const { compileAndLoadPage } = await import('./harness/load-production-pages.mjs');
const { renderToStaticMarkup } = await import('react-dom/server');

function createMockSessionCookie(userId = '5650336e-550c-413d-b2a8-4afa2e4d9160', email = 'admin@lingora.edu.vn') {
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
    user: { id: userId, email },
  };
  const cookieValue = 'base64-' + Buffer.from(JSON.stringify(sessionData)).toString('base64');
  return {
    name: 'sb-sncfyvpzwedqgwfpffkh-auth-token',
    value: cookieValue,
  };
}

const originalFetch = globalThis.fetch;

describe('S3-01 / S3-02: Course & Unit Domain Grounded Validation & Error Mapping', () => {
  const seedCourse30 = '00000000-0000-0000-0000-000000000030';
  const seedUnit40 = '00000000-0000-0000-0000-000000000040';
  const seedFw10 = '00000000-0000-0000-0000-000000000010';
  const seedLvl21 = '00000000-0000-0000-0000-000000000021';
  const seedLvl22 = '00000000-0000-0000-0000-000000000022';
  const seedLangEn = '00000000-0000-0000-0000-000000000002';

  test('isValidUuid accepts canonical seed Course30, Unit40, Framework10, Level21 and standard UUIDs', () => {
    assert.equal(isValidUuid(seedCourse30), true);
    assert.equal(isValidUuid(seedUnit40), true);
    assert.equal(isValidUuid(seedFw10), true);
    assert.equal(isValidUuid(seedLvl21), true);
    assert.equal(isValidUuid('11111111-2222-3333-8888-999999999999'), true);
    assert.equal(isValidUuid('not-a-valid-uuid'), false);
    assert.equal(isValidUuid(''), false);
    assert.equal(isValidUuid(' 00000000-0000-0000-0000-000000000030'), false);
    assert.equal(isValidUuid('00000000-0000-0000-0000-000000000030-extra'), false);
  });

  describe('createCourseSchema & updateCourseSchema validation', () => {
    test('accepts valid full-form Course payload', () => {
      const res = createCourseSchema.safeParse({
        languageId: seedLangEn,
        frameworkId: seedFw10,
        defaultStartLevelId: seedLvl21,
        names: { vi: 'Tiếng Anh chuẩn', en: 'Core English' },
        isActive: true,
      });
      assert.equal(res.success, true);
    });

    test('accepts optional locale strings, blank names', () => {
      const res = createCourseSchema.safeParse({
        languageId: seedLangEn,
        frameworkId: seedFw10,
        defaultStartLevelId: seedLvl21,
        names: {},
        isActive: false,
      });
      assert.equal(res.success, true);
    });

    test('trims names and rejects unknown / internal fields (id, curriculumGeneration, rowVersion, configs)', () => {
      const parsed = createCourseSchema.parse({
        languageId: seedLangEn,
        frameworkId: seedFw10,
        defaultStartLevelId: seedLvl21,
        names: { vi: '  Tiếng Anh  ' },
        isActive: true,
      });
      assert.equal(parsed.names.vi, 'Tiếng Anh');

      // Unknown fields rejected
      assert.equal(createCourseSchema.safeParse({
        languageId: seedLangEn,
        frameworkId: seedFw10,
        defaultStartLevelId: seedLvl21,
        names: {},
        isActive: true,
        id: seedCourse30,
      }).success, false);

      assert.equal(createCourseSchema.safeParse({
        languageId: seedLangEn,
        frameworkId: seedFw10,
        defaultStartLevelId: seedLvl21,
        names: {},
        isActive: true,
        curriculumGeneration: 5,
      }).success, false);

      assert.equal(createCourseSchema.safeParse({
        languageId: seedLangEn,
        frameworkId: seedFw10,
        defaultStartLevelId: seedLvl21,
        names: {},
        isActive: true,
        gateConfig: {},
      }).success, false);
    });

    test('rejects malformed relation UUIDs before DB access', () => {
      assert.equal(createCourseSchema.safeParse({
        languageId: 'invalid-lang-id',
        frameworkId: seedFw10,
        defaultStartLevelId: seedLvl21,
        names: {},
        isActive: true,
      }).success, false);

      assert.equal(createCourseSchema.safeParse({
        languageId: seedLangEn,
        frameworkId: 'bad-framework-uuid',
        defaultStartLevelId: seedLvl21,
        names: {},
        isActive: true,
      }).success, false);

      assert.equal(createCourseSchema.safeParse({
        languageId: seedLangEn,
        frameworkId: seedFw10,
        defaultStartLevelId: 'bad-level-uuid',
        names: {},
        isActive: true,
      }).success, false);
    });

    test('allows duplicate Course names (no unique natural key)', () => {
      const payload1 = {
        languageId: seedLangEn,
        frameworkId: seedFw10,
        defaultStartLevelId: seedLvl21,
        names: { vi: 'Khóa học trùng tên', en: 'Duplicate Course' },
        isActive: true,
      };
      const res1 = createCourseSchema.safeParse(payload1);
      const res2 = createCourseSchema.safeParse(payload1);
      assert.equal(res1.success, true);
      assert.equal(res2.success, true);
    });
  });

  describe('createUnitSchema & updateUnitSchema validation', () => {
    test('accepts valid full-form Unit payload with positive integer position', () => {
      const res = createUnitSchema.safeParse({
        levelId: seedLvl21,
        code: 'UNIT-01',
        names: { vi: 'Bài 1: Khởi động', en: 'Unit 1: Foundations' },
        position: 1,
      });
      assert.equal(res.success, true);
    });

    test('rejects non-positive, decimal or string-coerced position', () => {
      assert.equal(createUnitSchema.safeParse({
        levelId: seedLvl21,
        code: 'UNIT-01',
        names: {},
        position: 0,
      }).success, false, 'position 0 rejected');

      assert.equal(createUnitSchema.safeParse({
        levelId: seedLvl21,
        code: 'UNIT-01',
        names: {},
        position: -1,
      }).success, false, 'negative position rejected');

      assert.equal(createUnitSchema.safeParse({
        levelId: seedLvl21,
        code: 'UNIT-01',
        names: {},
        position: 1.5,
      }).success, false, 'decimal position rejected');

      assert.equal(createUnitSchema.safeParse({
        levelId: seedLvl21,
        code: 'UNIT-01',
        names: {},
        position: '1',
      }).success, false, 'string position without coercion rejected');
    });

    test('trims code, rejects blank or empty code', () => {
      const parsed = createUnitSchema.parse({
        levelId: seedLvl21,
        code: '  UNIT-02  ',
        names: {},
        position: 2,
      });
      assert.equal(parsed.code, 'UNIT-02');

      assert.equal(createUnitSchema.safeParse({
        levelId: seedLvl21,
        code: '',
        names: {},
        position: 1,
      }).success, false);

      assert.equal(createUnitSchema.safeParse({
        levelId: seedLvl21,
        code: '   ',
        names: {},
        position: 1,
      }).success, false);
    });

    test('rejects unknown or internal fields on Unit payload (id, courseId, rowVersion)', () => {
      assert.equal(createUnitSchema.safeParse({
        levelId: seedLvl21,
        code: 'U1',
        names: {},
        position: 1,
        id: seedUnit40,
      }).success, false);

      assert.equal(createUnitSchema.safeParse({
        levelId: seedLvl21,
        code: 'U1',
        names: {},
        position: 1,
        courseId: seedCourse30,
      }).success, false);

      assert.equal(createUnitSchema.safeParse({
        levelId: seedLvl21,
        code: 'U1',
        names: {},
        position: 1,
        rowVersion: 2,
      }).success, false);
    });

    test('allows duplicate Unit codes (code uniqueness is NOT enforced)', () => {
      const u1 = createUnitSchema.safeParse({
        levelId: seedLvl21,
        code: 'DUP-CODE',
        names: { vi: 'Bài A' },
        position: 1,
      });
      const u2 = createUnitSchema.safeParse({
        levelId: seedLvl22,
        code: 'DUP-CODE',
        names: { vi: 'Bài B' },
        position: 1,
      });
      assert.equal(u1.success, true);
      assert.equal(u2.success, true);
    });
  });

  describe('DTO serialization & Error mapping', () => {
    test('toCourseDto serializes BigInt as number and includes authoritative relations and unitCount', () => {
      const dto = toCourseDto({
        id: seedCourse30,
        languageId: seedLangEn,
        frameworkId: seedFw10,
        defaultStartLevelId: seedLvl21,
        names: { vi: 'Tiếng Anh chuẩn', en: 'Standard English' },
        isActive: true,
        curriculumGeneration: 42n,
        unitCount: 5,
        language: { id: seedLangEn, code: 'en', names: { vi: 'Tiếng Anh', en: 'English' } },
        framework: { id: seedFw10, code: 'CEFR', version: '2020', names: { en: 'CEFR' } },
        defaultStartLevel: { id: seedLvl21, code: 'A1', label: { en: 'Beginner' }, position: 1 },
      });

      assert.equal(typeof dto.curriculumGeneration, 'number');
      assert.equal(dto.curriculumGeneration, 42);
      assert.equal(dto.unitCount, 5);
      assert.equal(dto.language?.code, 'en');
      assert.equal(dto.framework?.code, 'CEFR');
      assert.equal(dto.defaultStartLevel?.code, 'A1');

      // Ensure JSON.stringify does NOT throw
      const jsonStr = JSON.stringify(dto);
      assert.ok(jsonStr.includes('"curriculumGeneration":42'));
    });

    test('toUnitDto serializes Unit with level labels and position', () => {
      const dto = toUnitDto({
        id: seedUnit40,
        courseId: seedCourse30,
        levelId: seedLvl21,
        code: 'DEV-UNIT-01',
        names: { vi: 'Bài 1' },
        position: 1,
        level: { id: seedLvl21, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
      });

      assert.equal(dto.id, seedUnit40);
      assert.equal(dto.position, 1);
      assert.equal(dto.level?.code, 'A1');
      assert.equal(dto.level?.position, 1);
    });

    test('handleCoursePrismaError maps scope freeze, deactivation guard and P2003 in-use properly', () => {
      // 1. guard_course_scope
      const errScope = new Error('Cannot change language_id or framework_id of course referenced by units, contexts or blueprints');
      const resScope = handleCoursePrismaError(errScope);
      assert.equal(resScope.status, 409);
      assert.equal(resScope.body.error.code, 'SCOPE_FROZEN');

      // 2. guard_course_available_lessons
      const errDeact = new Error('Cannot deactivate course with AVAILABLE lessons');
      const resDeact = handleCoursePrismaError(errDeact);
      assert.equal(resDeact.status, 409);
      assert.equal(resDeact.body.error.code, 'DEACTIVATION_BLOCKED');

      // 3. check_course_default_level_scope
      const errFwMismatch = new Error('Course default start level framework mismatch: course fid, level fid');
      const resFw = handleCoursePrismaError(errFwMismatch);
      assert.equal(resFw.status, 400);
      assert.equal(resFw.body.error.code, 'INVALID_RELATION');
      assert.ok(resFw.body.error.fields?.defaultStartLevelId);

      // 4. P2003 on delete
      const errInUse = { code: 'P2003', message: 'Foreign key constraint violated' };
      const resInUse = handleCoursePrismaError(errInUse, 'delete');
      assert.equal(resInUse.status, 409);
      assert.equal(resInUse.body.error.code, 'COURSE_IN_USE');
    });

    test('handleUnitPrismaError maps triple uniqueness P2002 to position & levelId fields and P2003 in-use', () => {
      const errP2002 = { code: 'P2002', meta: { target: ['course_id', 'level_id', 'position'] } };
      const resP2002 = handleUnitPrismaError(errP2002);
      assert.equal(resP2002.status, 409);
      assert.equal(resP2002.body.error.code, 'DUPLICATE_UNIT_POSITION');
      assert.ok(resP2002.body.error.fields?.position);
      assert.ok(resP2002.body.error.fields?.levelId);

      const errInUse = { code: 'P2003', message: 'Foreign key constraint violated' };
      const resInUse = handleUnitPrismaError(errInUse, 'delete');
      assert.equal(resInUse.status, 409);
      assert.equal(resInUse.body.error.code, 'UNIT_IN_USE');

      const errUnitScope = new Error('Cannot change course_id or level_id of unit with lessons');
      const resUnitScope = handleUnitPrismaError(errUnitScope);
      assert.equal(resUnitScope.status, 409);
      assert.equal(resUnitScope.body.error.code, 'SCOPE_FROZEN');
    });
  });
});

describe('S3-03: Courses CRUD Service & Transaction Mechanics', () => {
  const seedCourse30 = '00000000-0000-0000-0000-000000000030';
  const seedFw10 = '00000000-0000-0000-0000-000000000010';
  const seedFw20 = '00000000-0000-0000-0000-000000000020';
  const seedLvl21 = '00000000-0000-0000-0000-000000000021';
  const otherLvl99 = '00000000-0000-0000-0000-000000000099';
  const seedLangEn = '00000000-0000-0000-0000-000000000002';

  afterEach(() => {
    setProductPrismaForTest(null);
  });

  test('createCourse enforces Framework-Level consistency (defaultStartLevel must belong to Course framework)', async () => {
    const mockPrisma = {
      language: { findUnique: async () => ({ id: seedLangEn }) },
      framework: { findUnique: async () => ({ id: seedFw10 }) },
      level: { findUnique: async () => ({ id: otherLvl99, frameworkId: seedFw20 }) }, // Belongs to different framework!
    };

    const res = await createCourse({
      languageId: seedLangEn,
      frameworkId: seedFw10,
      defaultStartLevelId: otherLvl99,
      names: { vi: 'Khóa sai cấp độ' },
      isActive: true,
    }, mockPrisma);

    assert.equal(res.status, 400);
    assert.equal(res.error?.code, 'INVALID_RELATION');
    assert.ok(res.error?.fields?.defaultStartLevelId);
  });

  test('createCourse allows duplicate course name and relations (no natural uniqueness)', async () => {
    let createdCount = 0;
    const mockPrisma = {
      language: { findUnique: async () => ({ id: seedLangEn }) },
      framework: { findUnique: async () => ({ id: seedFw10 }) },
      level: { findUnique: async () => ({ id: seedLvl21, frameworkId: seedFw10 }) },
      course: {
        create: async ({ data }) => {
          createdCount++;
          return {
            id: `course-${createdCount}`,
            ...data,
            curriculumGeneration: 1n,
            rowVersion: 1n,
          };
        },
      },
    };

    const payload = {
      languageId: seedLangEn,
      frameworkId: seedFw10,
      defaultStartLevelId: seedLvl21,
      names: { vi: 'Khóa học tiếng Anh', en: 'English Course' },
      isActive: true,
    };

    const res1 = await createCourse(payload, mockPrisma);
    const res2 = await createCourse(payload, mockPrisma);

    assert.equal(res1.status, 201);
    assert.equal(res2.status, 201);
    assert.equal(createdCount, 2, 'Two courses with identical names and relations must be created');
  });

  test('updateCourse locks course with $queryRaw FOR UPDATE, increments curriculumGeneration and rowVersion, merges locale', async () => {
    let queryRawCalled = false;
    let updateData = null;

    const mockCourse = {
      id: seedCourse30,
      frameworkId: seedFw10,
      languageId: seedLangEn,
      defaultStartLevelId: seedLvl21,
      names: { vi: 'Tiếng Anh gốc', en: 'Original English' },
      isActive: true,
      curriculumGeneration: 1n,
      rowVersion: 1n,
    };

    const mockTx = {
      $queryRaw: async () => {
        queryRawCalled = true;
        return [{
          id: seedCourse30,
          framework_id: seedFw10,
          language_id: seedLangEn,
          curriculum_generation: 1n,
          row_version: 1n,
          is_active: true,
        }];
      },
      language: { findUnique: async () => ({ id: seedLangEn }) },
      framework: { findUnique: async () => ({ id: seedFw10 }) },
      level: { findUnique: async () => ({ id: seedLvl21, frameworkId: seedFw10 }) },
      course: {
        findUnique: async () => mockCourse,
        update: async ({ data }) => {
          updateData = data;
          return {
            ...mockCourse,
            ...data,
            curriculumGeneration: 2n,
            rowVersion: 2n,
          };
        },
      },
      unit: { findFirst: async () => null },
    };

    const mockPrisma = {
      $transaction: async (fn) => fn(mockTx),
    };

    const res = await updateCourse(seedCourse30, {
      languageId: seedLangEn,
      frameworkId: seedFw10,
      defaultStartLevelId: seedLvl21,
      names: { vi: 'Tiếng Anh đã sửa' }, // en omitted -> preserve untouched other locale!
      isActive: true,
    }, mockPrisma);

    assert.equal(res.status, 200);
    assert.equal(queryRawCalled, true, 'Must execute parameterized $queryRaw FOR UPDATE');
    assert.deepEqual(updateData.curriculumGeneration, { increment: 1 });
    assert.deepEqual(updateData.rowVersion, { increment: 1 });
    assert.equal(updateData.names.vi, 'Tiếng Anh đã sửa');
    assert.equal(updateData.names.en, 'Original English', 'Untouched locale en must be preserved');
  });

  test('updateCourse blocks deactivation (409 DEACTIVATION_BLOCKED) when AVAILABLE lessons exist', async () => {
    const mockTx = {
      $queryRaw: async () => [{
        id: seedCourse30,
        framework_id: seedFw10,
        language_id: seedLangEn,
        curriculum_generation: 1n,
        row_version: 1n,
        is_active: true,
      }],
      lesson: {
        findFirst: async () => ({ id: 'available-lesson-1' }), // AVAILABLE lesson exists!
      },
    };

    const mockPrisma = {
      $transaction: async (fn) => fn(mockTx),
    };

    const res = await updateCourse(seedCourse30, {
      languageId: seedLangEn,
      frameworkId: seedFw10,
      defaultStartLevelId: seedLvl21,
      names: { vi: 'Tắt khóa học' },
      isActive: false, // Trying to deactivate!
    }, mockPrisma);

    assert.equal(res.status, 409);
    assert.equal(res.error?.code, 'DEACTIVATION_BLOCKED');
  });

  test('updateCourse blocks changing languageId or frameworkId (409 SCOPE_FROZEN) when referenced by units', async () => {
    const newLang = '00000000-0000-0000-0000-000000000099';
    const mockTx = {
      $queryRaw: async () => [{
        id: seedCourse30,
        framework_id: seedFw10,
        language_id: seedLangEn,
        curriculum_generation: 1n,
        row_version: 1n,
        is_active: true,
      }],
      unit: {
        findFirst: async () => ({ id: 'child-unit-1' }), // Units reference course!
      },
    };

    const mockPrisma = {
      $transaction: async (fn) => fn(mockTx),
    };

    const res = await updateCourse(seedCourse30, {
      languageId: newLang, // Trying to change language!
      frameworkId: seedFw10,
      defaultStartLevelId: seedLvl21,
      names: { vi: 'Đổi ngôn ngữ' },
      isActive: true,
    }, mockPrisma);

    assert.equal(res.status, 409);
    assert.equal(res.error?.code, 'SCOPE_FROZEN');
  });

  test('deleteCourse locks course, rejects deletion (409 COURSE_IN_USE) when units reference course, returns 204 on free delete', async () => {
    let deletedId = null;
    let hasUnits = true;

    const mockTx = {
      $queryRaw: async () => [{ id: seedCourse30 }],
      unit: {
        findFirst: async () => (hasUnits ? { id: 'existing-unit' } : null),
      },
      learningContext: { findFirst: async () => null },
      assessmentBlueprint: { findFirst: async () => null },
      course: {
        delete: async ({ where }) => {
          deletedId = where.id;
        },
      },
    };

    const mockPrisma = {
      $transaction: async (fn) => fn(mockTx),
    };

    // 1. In-use rejection
    const resBlocked = await deleteCourse(seedCourse30, mockPrisma);
    assert.equal(resBlocked.status, 409);
    assert.equal(resBlocked.error?.code, 'COURSE_IN_USE');
    assert.equal(deletedId, null);

    // 2. Free delete succeeds
    hasUnits = false;
    const resSuccess = await deleteCourse(seedCourse30, mockPrisma);
    assert.equal(resSuccess.status, 204);
    assert.equal(deletedId, seedCourse30);
  });
});

describe('S3-04: Units CRUD Service, Triple Uniqueness & Child Ownership Seams', () => {
  const seedCourse30 = '00000000-0000-0000-0000-000000000030';
  const otherCourse99 = '00000000-0000-0000-0000-000000000099';
  const seedUnit40 = '00000000-0000-0000-0000-000000000040';
  const seedFw10 = '00000000-0000-0000-0000-000000000010';
  const otherFw20 = '00000000-0000-0000-0000-000000000020';
  const seedLvl21 = '00000000-0000-0000-0000-000000000021';
  const seedLvl22 = '00000000-0000-0000-0000-000000000022';
  const foreignLvl88 = '00000000-0000-0000-0000-000000000088';

  afterEach(() => {
    setProductPrismaForTest(null);
  });

  test('createUnit enforces Unit level framework matches parent Course framework', async () => {
    const mockTx = {
      $queryRaw: async () => [{ id: seedCourse30, framework_id: seedFw10, curriculum_generation: 1n, row_version: 1n }],
      level: { findUnique: async () => ({ id: foreignLvl88, frameworkId: otherFw20 }) }, // Foreign framework!
    };

    const mockPrisma = {
      $transaction: async (fn) => fn(mockTx),
    };

    const res = await createUnit(seedCourse30, {
      levelId: foreignLvl88,
      code: 'UNIT-FOREIGN',
      position: 1,
      names: { vi: 'Bài sai khung' },
    }, mockPrisma);

    assert.equal(res.status, 400);
    assert.equal(res.error?.code, 'INVALID_RELATION');
    assert.ok(res.error?.fields?.levelId);
  });

  test('createUnit enforces triple uniqueness (courseId, levelId, position) with 409 mapped to level/position fields', async () => {
    const mockTx = {
      $queryRaw: async () => [{ id: seedCourse30, framework_id: seedFw10, curriculum_generation: 1n, row_version: 1n }],
      level: { findUnique: async () => ({ id: seedLvl21, frameworkId: seedFw10 }) },
      unit: {
        findFirst: async () => ({ id: 'existing-unit-pos-1' }), // Position 1 already exists in this level!
      },
    };

    const mockPrisma = {
      $transaction: async (fn) => fn(mockTx),
    };

    const res = await createUnit(seedCourse30, {
      levelId: seedLvl21,
      code: 'UNIT-DUP-POS',
      position: 1,
      names: {},
    }, mockPrisma);

    assert.equal(res.status, 409);
    assert.equal(res.error?.code, 'DUPLICATE_UNIT_POSITION');
    assert.ok(res.error?.fields?.position);
    assert.ok(res.error?.fields?.levelId);
  });

  test('createUnit allows same position in different levels of the same course and advances Course generation', async () => {
    let courseUpdated = false;
    let unitCreated = false;

    const mockTx = {
      $queryRaw: async () => [{ id: seedCourse30, framework_id: seedFw10, curriculum_generation: 1n, row_version: 1n }],
      level: { findUnique: async () => ({ id: seedLvl22, frameworkId: seedFw10 }) },
      unit: {
        findFirst: async () => null, // Position 1 is free in level A2!
        create: async ({ data }) => {
          unitCreated = true;
          return { id: 'new-unit-a2-pos1', ...data, level: { id: seedLvl22, code: 'A2', position: 2 } };
        },
      },
      course: {
        update: async ({ where, data }) => {
          if (where.id === seedCourse30 && data.curriculumGeneration) {
            courseUpdated = true;
          }
        },
      },
    };

    const mockPrisma = {
      $transaction: async (fn) => fn(mockTx),
    };

    const res = await createUnit(seedCourse30, {
      levelId: seedLvl22,
      code: 'UNIT-A2-01',
      position: 1, // Same position 1, but in level A2!
      names: { vi: 'Bài 1 cấp độ A2' },
    }, mockPrisma);

    assert.equal(res.status, 201);
    assert.equal(unitCreated, true);
    assert.equal(courseUpdated, true, 'Parent course generation must advance on child mutation');
  });

  test('updateUnit & deleteUnit use atomic selector id + courseId and return 404 for foreign child (B child ownership)', async () => {
    let updateSelector = null;
    let deleteSelector = null;

    const mockTx = {
      $queryRaw: async () => [{ id: seedCourse30, framework_id: seedFw10, curriculum_generation: 1n, row_version: 1n }],
      unit: {
        findFirst: async ({ where }) => {
          // If query uses wrong parent course -> return null!
          if (where.courseId === seedCourse30 && where.id === seedUnit40) {
            return { id: seedUnit40, courseId: seedCourse30, levelId: seedLvl21, code: 'U1', names: {}, position: 1 };
          }
          return null;
        },
        updateMany: async ({ where, data }) => {
          updateSelector = where;
          if (where.courseId !== seedCourse30 || where.id !== seedUnit40) return { count: 0 };
          return { count: 1 };
        },
        deleteMany: async ({ where }) => {
          deleteSelector = where;
          if (where.courseId !== seedCourse30 || where.id !== seedUnit40) return { count: 0 };
          return { count: 1 };
        },
      },
      course: {
        update: async () => {},
      },
      level: { findUnique: async () => ({ id: seedLvl21, frameworkId: seedFw10 }) },
      lesson: { findFirst: async () => null },
    };

    const mockPrisma = {
      $transaction: async (fn) => fn(mockTx),
    };

    // 1. Cross-course update via wrong course returns 404
    const resForeignUpdate = await updateUnit(otherCourse99, seedUnit40, {
      levelId: seedLvl21,
      code: 'HACK',
      position: 1,
      names: {},
    }, mockPrisma);
    assert.equal(resForeignUpdate.status, 404);

    // 2. Authoritative update uses atomic selector id + courseId
    const resValidUpdate = await updateUnit(seedCourse30, seedUnit40, {
      levelId: seedLvl21,
      code: 'UPDATED',
      position: 1,
      names: {},
    }, mockPrisma);
    assert.equal(resValidUpdate.status, 200);
    assert.deepEqual(updateSelector, { id: seedUnit40, courseId: seedCourse30 }, 'Atomic selector must contain both id and courseId');

    // 3. Cross-course delete via wrong course returns 404
    const resForeignDelete = await deleteUnit(otherCourse99, seedUnit40, mockPrisma);
    assert.equal(resForeignDelete.status, 404);

    // 4. Authoritative delete uses atomic selector id + courseId
    const resValidDelete = await deleteUnit(seedCourse30, seedUnit40, mockPrisma);
    assert.equal(resValidDelete.status, 204);
    assert.deepEqual(deleteSelector, { id: seedUnit40, courseId: seedCourse30 }, 'Atomic selector must contain both id and courseId');
  });

  test('listUnits sorts by Level.position asc, Unit.position asc, Unit.id asc', async () => {
    const unsortedUnits = [
      { id: 'u3', courseId: seedCourse30, levelId: seedLvl22, code: 'U-A2-2', names: {}, position: 2, level: { id: seedLvl22, code: 'A2', position: 2 } },
      { id: 'u1', courseId: seedCourse30, levelId: seedLvl21, code: 'U-A1-1', names: {}, position: 1, level: { id: seedLvl21, code: 'A1', position: 1 } },
      { id: 'u2', courseId: seedCourse30, levelId: seedLvl21, code: 'U-A1-2', names: {}, position: 2, level: { id: seedLvl21, code: 'A1', position: 1 } },
      { id: 'u4', courseId: seedCourse30, levelId: seedLvl22, code: 'U-A2-1', names: {}, position: 1, level: { id: seedLvl22, code: 'A2', position: 2 } },
    ];

    const mockPrisma = {
      course: { findUnique: async () => ({ id: seedCourse30 }) },
      unit: { findMany: async () => unsortedUnits },
    };

    const res = await listUnits(seedCourse30, mockPrisma);
    assert.equal(res.status, 200);
    const order = res.data?.data.map((u) => u.code);
    assert.deepEqual(order, ['U-A1-1', 'U-A1-2', 'U-A2-1', 'U-A2-2']);
  });
});

describe('S3-05: Real Mutation ADMIN Guard, Auth Matrix & Zero Write Spies (C kill)', () => {
  const seedCourse30 = '00000000-0000-0000-0000-000000000030';
  const seedUnit40 = '00000000-0000-0000-0000-000000000040';
  const adminId = '5650336e-550c-413d-b2a8-4afa2e4d9160';
  const teacherId = '00000000-0000-4000-8000-000000000002';
  const inactiveAdminId = '00000000-0000-4000-8000-000000000004';

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.DATABASE_URL = 'postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder?schema=app';
  });

  afterEach(() => {
    setProductPrismaForTest(null);
    globalThis.fetch = originalFetch;
  });

  test('POST /api/courses mutation rejects unauthenticated, teacher and inactive accounts with zero writes (C kill)', async () => {
    let writeCount = 0;
    const mockPrisma = {
      account: {
        findUnique: async ({ where }) => {
          if (where.id === teacherId) return { id: teacherId, role: 'TEACHER', status: 'ACTIVE' };
          if (where.id === inactiveAdminId) return { id: inactiveAdminId, role: 'ADMIN', status: 'DISABLED' };
          return null;
        },
      },
      course: {
        create: async () => { writeCount++; },
        update: async () => { writeCount++; },
        delete: async () => { writeCount++; },
      },
    };
    setProductPrismaForTest(mockPrisma);

    const makeReq = () => new Request('http://localhost:3000/api/courses', {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ languageId: 'some-id' }),
    });

    // 1. Unauthenticated -> 401
    currentCookieStore = { getAll: () => [] };
    const resUnauth = await postCoursesRoute(makeReq());
    assert.equal(resUnauth.status, 401);
    assert.equal(resUnauth.headers.get('Cache-Control'), 'no-store, private');

    // 2. Teacher role -> 403
    currentCookieStore = { getAll: () => [createMockSessionCookie(teacherId)] };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: teacherId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    const resTeacher = await postCoursesRoute(makeReq());
    assert.equal(resTeacher.status, 403);

    // 3. Inactive Admin -> 403
    currentCookieStore = { getAll: () => [createMockSessionCookie(inactiveAdminId)] };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: inactiveAdminId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    const resInactive = await postCoursesRoute(makeReq());
    assert.equal(resInactive.status, 403);

    assert.equal(writeCount, 0, 'Zero writes must occur on denied mutations');
  });

  test('PATCH & DELETE Unit mutation endpoints reject foreign Origin, unauthenticated, and non-admins with zero writes', async () => {
    let writeCount = 0;
    const mockPrisma = {
      account: {
        findUnique: async () => ({ id: teacherId, role: 'TEACHER', status: 'ACTIVE' }),
      },
      unit: {
        updateMany: async () => { writeCount++; },
        deleteMany: async () => { writeCount++; },
      },
    };
    setProductPrismaForTest(mockPrisma);

    // 1. Foreign origin on PATCH
    const reqForeign = new Request(`http://localhost:3000/api/courses/${seedCourse30}/units/${seedUnit40}`, {
      method: 'PATCH',
      headers: { 'Origin': 'https://evil.attacker.com', 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'U1' }),
    });
    const resForeign = await patchUnitRoute(reqForeign, { params: Promise.resolve({ courseId: seedCourse30, unitId: seedUnit40 }) });
    assert.equal(resForeign.status, 403);

    // 2. Teacher on DELETE
    currentCookieStore = { getAll: () => [createMockSessionCookie(teacherId)] };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: teacherId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    const reqDelete = new Request(`http://localhost:3000/api/courses/${seedCourse30}/units/${seedUnit40}`, {
      method: 'DELETE',
      headers: { 'Origin': 'http://localhost:3000' },
    });
    const resDelete = await deleteUnitRoute(reqDelete, { params: Promise.resolve({ courseId: seedCourse30, unitId: seedUnit40 }) });
    assert.equal(resDelete.status, 403);

    assert.equal(writeCount, 0, 'Zero writes must execute on denied Unit mutations');
  });
});

describe('S3-06: Production Page Wiring, Generated Href Extraction & Canonical Seed Exercise (A kill)', () => {
  const seedCourse30 = '00000000-0000-0000-0000-000000000030';
  const seedUnit40 = '00000000-0000-0000-0000-000000000040';
  const seedFw10 = '00000000-0000-0000-0000-000000000010';
  const seedLvl21 = '00000000-0000-0000-0000-000000000021';
  const seedLangEn = '00000000-0000-0000-0000-000000000002';
  const adminId = '5650336e-550c-413d-b2a8-4afa2e4d9160';
  const teacherId = '00000000-0000-4000-8000-000000000002';

  let CoursesPage;
  let CourseDetailPage;

  beforeEach(async () => {
    CoursesPage = await compileAndLoadPage('src/app/courses/page.tsx');
    CourseDetailPage = await compileAndLoadPage('src/app/courses/[courseId]/page.tsx');
    process.env.DATABASE_URL = 'postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder?schema=app';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    setProductPrismaForTest(null);
    globalThis.fetch = originalFetch;
  });

  test('Render real CoursesPage -> extract actual generated href -> invoke real CourseDetailPage -> assert parent/child reconciliation (A kill)', async () => {
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(adminId)],
      get: () => createMockSessionCookie(adminId),
      set: () => {},
      delete: () => {},
    };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const canonicalCourse = {
      id: seedCourse30,
      languageId: seedLangEn,
      frameworkId: seedFw10,
      defaultStartLevelId: seedLvl21,
      names: { en: '[DEV] English Core Curriculum', vi: '[DEV] Chương trình tiếng Anh chuẩn' },
      isActive: true,
      curriculumGeneration: 1n,
      rowVersion: 1n,
      language: { id: seedLangEn, code: 'en', names: { vi: 'Tiếng Anh', en: 'English' } },
      framework: { id: seedFw10, code: 'CEFR', version: '2020', names: { en: 'CEFR' } },
      defaultStartLevel: { id: seedLvl21, code: 'A1', label: { en: 'Beginner' }, position: 1 },
      _count: { units: 1 },
    };

    const canonicalUnit = {
      id: seedUnit40,
      courseId: seedCourse30,
      levelId: seedLvl21,
      code: 'DEV-UNIT-01',
      position: 1,
      names: { en: '[DEV] Unit 1: Foundations', vi: '[DEV] Bài 1: Nền tảng' },
      level: { id: seedLvl21, code: 'A1', label: { en: 'Beginner' }, position: 1 },
    };

    setProductPrismaForTest({
      account: {
        findUnique: async () => ({ id: adminId, role: 'ADMIN', status: 'ACTIVE', displayName: 'Quản trị viên' }),
      },
      course: {
        findMany: async () => [canonicalCourse],
        findUnique: async ({ where }) => (where.id === seedCourse30 ? canonicalCourse : null),
      },
      language: {
        findMany: async () => [{ id: seedLangEn, code: 'en', names: { vi: 'Tiếng Anh' } }],
      },
      framework: {
        findMany: async () => [{ id: seedFw10, code: 'CEFR', version: '2020', names: { en: 'CEFR' } }],
      },
      unit: {
        findMany: async ({ where }) => (where.courseId === seedCourse30 ? [canonicalUnit] : []),
      },
      level: {
        findMany: async () => [{ id: seedLvl21, frameworkId: seedFw10, code: 'A1', label: { en: 'Beginner' }, position: 1 }],
      },
    });

    // 1. Render production catalogue page
    const catalogueJsx = await CoursesPage();
    assert.equal(catalogueJsx.type.name, 'AppShell');
    const catalogHtml = renderToStaticMarkup(catalogueJsx);

    // 2. Extract actual generated href from HTML
    const hrefMatch = catalogHtml.match(/href="(\/courses\/[0-9a-f-]+)"/);
    assert.ok(hrefMatch, 'Catalogue must render actual generated href to course detail');
    const generatedHref = hrefMatch[1];
    assert.equal(generatedHref, `/courses/${seedCourse30}`);

    // Extract course ID from generated href
    const targetCourseId = generatedHref.replace('/courses/', '');

    // 3. Invoke real production detail page
    notFoundHookCalled = false;
    const detailJsx = await CourseDetailPage({
      params: Promise.resolve({ courseId: targetCourseId }),
    });
    assert.equal(notFoundHookCalled, false, 'Canonical seed Course must never trigger notFound()');
    assert.equal(detailJsx.type.name, 'AppShell');
    assert.equal(detailJsx.props.children.props.course.id, targetCourseId, 'UnitsCatalog must receive exact parent course id');
    assert.equal(detailJsx.props.children.props.course.id, seedCourse30, 'UnitsCatalog must receive seedCourse30');
    assert.equal(detailJsx.props.children.props.course.frameworkId, seedFw10, 'UnitsCatalog must receive frameworkId');
    assert.equal(detailJsx.props.children.props.initialUnits[0].courseId, detailJsx.props.children.props.course.id, 'Child units must reconcile with parent course');

    const detailHtml = renderToStaticMarkup(detailJsx);

    // 4. Assert parent identity banner shows authoritative Course identity, target language, framework, default start level
    assert.ok(detailHtml.includes('parentIdentityBanner'), 'Detail page must render parent identity banner');
    assert.ok(detailHtml.includes('[DEV] Chương trình tiếng Anh chuẩn') || detailHtml.includes('[DEV] English Core Curriculum'));
    assert.ok(detailHtml.includes('Tiếng Anh'), 'Must display authoritative target learned language');
    assert.ok(detailHtml.includes('CEFR v2020'), 'Must display framework');
    assert.ok(detailHtml.includes('A1'), 'Must display default start level');

    // 5. Assert child unit row rendered
    assert.ok(detailHtml.includes('DEV-UNIT-01'), 'Child unit code must be rendered in table');
    assert.ok(detailHtml.includes('Bài 1: Nền tảng') || detailHtml.includes('Unit 1: Foundations'));
  });

  test('C regression: CourseDetailPage faithfully passes initialLevelsError and empty frameworkLevels props on service lookup failure', async () => {
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(adminId)],
      get: () => createMockSessionCookie(adminId),
      set: () => {},
      delete: () => {},
    };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const canonicalCourse = {
      id: seedCourse30,
      languageId: seedLangEn,
      frameworkId: seedFw10,
      defaultStartLevelId: seedLvl21,
      names: { en: '[DEV] English Core Curriculum', vi: '[DEV] Chương trình tiếng Anh chuẩn' },
      isActive: true,
      curriculumGeneration: 1n,
      rowVersion: 1n,
      language: { id: seedLangEn, code: 'en', names: { vi: 'Tiếng Anh', en: 'English' } },
      framework: { id: seedFw10, code: 'CEFR', version: '2020', names: { en: 'CEFR' } },
      defaultStartLevel: { id: seedLvl21, code: 'A1', label: { en: 'Beginner' }, position: 1 },
      _count: { units: 1 },
    };

    setProductPrismaForTest({
      account: {
        findUnique: async () => ({ id: adminId, role: 'ADMIN', status: 'ACTIVE', displayName: 'Quản trị viên' }),
      },
      course: {
        findUnique: async ({ where }) => (where.id === seedCourse30 ? canonicalCourse : null),
      },
      framework: {
        findUnique: async () => ({ id: seedFw10 }),
      },
      unit: {
        findMany: async () => [],
      },
      level: {
        findMany: async () => {
          throw new Error('Database connection failed when fetching levels');
        },
      },
    });

    notFoundHookCalled = false;
    const detailJsx = await CourseDetailPage({
      params: Promise.resolve({ courseId: seedCourse30 }),
    });

    assert.equal(notFoundHookCalled, false, 'Canonical course must not trigger notFound on child level error');
    assert.equal(detailJsx.type.name, 'AppShell');
    const catalogProps = detailJsx.props.children.props;
    assert.equal(catalogProps.course.id, seedCourse30, 'Must pass course id to UnitsCatalog');
    assert.deepEqual(catalogProps.frameworkLevels, [], 'Must pass empty frameworkLevels array on level service failure');
    assert.ok(catalogProps.initialLevelsError, 'CourseDetailPage must pass initialLevelsError prop on level service failure');
    assert.ok(
      typeof catalogProps.initialLevelsError === 'string' && catalogProps.initialLevelsError.length > 0,
      `initialLevelsError must be a non-empty string, got: ${catalogProps.initialLevelsError}`
    );
  });

  test('CourseDetailPage renders ServiceUnavailableView on DB 503 outage instead of notFound()', async () => {
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(adminId)],
      get: () => createMockSessionCookie(adminId),
      set: () => {},
      delete: () => {},
    };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const outageErr = new Error("Can't reach database server at localhost:5432");
    outageErr.code = 'P1001';

    setProductPrismaForTest({
      account: {
        findUnique: async () => ({ id: adminId, role: 'ADMIN', status: 'ACTIVE', displayName: 'Admin' }),
      },
      course: {
        findUnique: async () => { throw outageErr; },
      },
    });

    notFoundHookCalled = false;
    const jsx = await CourseDetailPage({
      params: Promise.resolve({ courseId: seedCourse30 }),
    });
    assert.equal(notFoundHookCalled, false, 'DB 503 outage must NEVER call notFound()');
    assert.equal(jsx.type.name, 'ServiceUnavailableView');
    assert.equal(jsx.props.onRetryHref, `/courses/${seedCourse30}`);
  });

  test('CourseDetailPage calls notFound() on genuinely absent course and malformed UUID', async () => {
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(adminId)],
      get: () => createMockSessionCookie(adminId),
      set: () => {},
      delete: () => {},
    };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    setProductPrismaForTest({
      account: {
        findUnique: async () => ({ id: adminId, role: 'ADMIN', status: 'ACTIVE', displayName: 'Admin' }),
      },
      course: {
        findUnique: async () => null,
      },
    });

    // 1. Absent course
    notFoundHookCalled = false;
    try {
      await CourseDetailPage({
        params: Promise.resolve({ courseId: seedCourse30 }),
      });
    } catch {}
    assert.equal(notFoundHookCalled, true, 'Absent course must trigger notFound()');

    // 2. Malformed UUID before DB access
    let dbAccessCount = 0;
    setProductPrismaForTest({
      account: { findUnique: async () => { dbAccessCount++; return null; } },
      course: { findUnique: async () => { dbAccessCount++; return null; } },
    });

    for (const badId of ['not-a-uuid', '00000000-0000-0000-0000-000000000030-bad', '']) {
      notFoundHookCalled = false;
      try {
        await CourseDetailPage({
          params: Promise.resolve({ courseId: badId }),
        });
      } catch {}
      assert.equal(notFoundHookCalled, true, `Malformed ID "${badId}" must trigger notFound()`);
    }
    assert.equal(dbAccessCount, 0, 'Malformed UUID must trigger notFound() before any DB access');
  });

  test('CoursesPage redirects Teacher to /holding and unauthenticated user to /login', async () => {
    // 1. Unauthenticated -> /login
    currentCookieStore = { getAll: () => [] };
    redirectHookTarget = null;
    try {
      await CoursesPage();
    } catch {}
    assert.equal(redirectHookTarget, '/login');

    // 2. Teacher -> /holding
    currentCookieStore = { getAll: () => [createMockSessionCookie(teacherId)] };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: teacherId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    setProductPrismaForTest({
      account: { findUnique: async () => ({ id: teacherId, role: 'TEACHER', status: 'ACTIVE' }) },
    });
    redirectHookTarget = null;
    try {
      await CoursesPage();
    } catch {}
    assert.equal(redirectHookTarget, '/holding');
  });
});

describe('S3-07: Acceptance Matrix - Active Admin Positives, UUID Casing, Rollback, Relations & Merges', () => {
  const seedCourse30 = '00000000-0000-0000-0000-000000000030';
  const seedUnit40 = '00000000-0000-0000-0000-000000000040';
  const seedFw10 = '00000000-0000-0000-0000-000000000010';
  const seedLvl21 = '00000000-0000-0000-0000-000000000021';
  const seedLvl22 = '00000000-0000-0000-0000-000000000022';
  const seedLangEn = '00000000-0000-0000-0000-000000000002';
  const adminId = '5650336e-550c-413d-b2a8-4afa2e4d9160';
  const teacherId = '00000000-0000-4000-8000-000000000002';
  const inactiveAdminId = '00000000-0000-4000-8000-000000000004';

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.DATABASE_URL = 'postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder?schema=app';
  });

  afterEach(() => {
    setProductPrismaForTest(null);
    globalThis.fetch = originalFetch;
  });

  function setupAdminAuth() {
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(adminId)],
      get: () => createMockSessionCookie(adminId),
      set: () => {},
      delete: () => {},
    };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1. Valid ACTIVE ADMIN positives for all 8 Course & Unit HTTP routes
  test('Active Admin positive routes: GET/POST courses, GET/PATCH/DELETE course, GET/POST units, PATCH/DELETE unit', async () => {
    setupAdminAuth();

    let courseCreated = false;
    let courseUpdated = false;
    let courseDeleted = false;
    let unitCreated = false;
    let unitUpdated = false;
    let unitDeleted = false;

    const mockPrisma = {
      account: {
        findUnique: async () => ({ id: adminId, role: 'ADMIN', status: 'ACTIVE', displayName: 'Admin' }),
      },
      language: {
        findUnique: async () => ({ id: seedLangEn, code: 'en' }),
        findMany: async () => [{ id: seedLangEn, code: 'en', names: { vi: 'Tiếng Anh' } }],
      },
      framework: {
        findUnique: async () => ({ id: seedFw10, code: 'CEFR', version: '2020' }),
        findMany: async () => [{ id: seedFw10, code: 'CEFR', version: '2020', names: { en: 'CEFR' } }],
      },
      level: {
        findUnique: async ({ where }) => ({
          id: where.id,
          frameworkId: seedFw10,
          code: 'A1',
          label: { en: 'Beginner' },
          position: 1,
        }),
        findMany: async () => [{ id: seedLvl21, frameworkId: seedFw10, code: 'A1', label: { en: 'Beginner' }, position: 1 }],
      },
      course: {
        findMany: async () => [{
          id: seedCourse30,
          languageId: seedLangEn,
          frameworkId: seedFw10,
          defaultStartLevelId: seedLvl21,
          names: { vi: 'Tiếng Anh' },
          isActive: true,
          curriculumGeneration: 1n,
          rowVersion: 1n,
          _count: { units: 1 },
        }],
        findUnique: async ({ where }) => ({
          id: where.id,
          frameworkId: seedFw10,
          languageId: seedLangEn,
          defaultStartLevelId: seedLvl21,
          names: { vi: 'Tiếng Anh' },
          isActive: true,
          curriculumGeneration: 1n,
          rowVersion: 1n,
          _count: { units: 1 },
        }),
        create: async () => {
          courseCreated = true;
          return {
            id: '11111111-2222-3333-4444-555555555555',
            languageId: seedLangEn,
            frameworkId: seedFw10,
            defaultStartLevelId: seedLvl21,
            names: { vi: 'Khóa mới' },
            isActive: true,
            curriculumGeneration: 1n,
            rowVersion: 1n,
          };
        },
        update: async () => {
          courseUpdated = true;
          return {
            id: seedCourse30,
            languageId: seedLangEn,
            frameworkId: seedFw10,
            defaultStartLevelId: seedLvl21,
            names: { vi: 'Khóa sửa' },
            isActive: true,
            curriculumGeneration: 2n,
            rowVersion: 2n,
          };
        },
        delete: async () => {
          courseDeleted = true;
          return { id: seedCourse30 };
        },
      },
      unit: {
        findMany: async () => [{
          id: seedUnit40,
          courseId: seedCourse30,
          levelId: seedLvl21,
          code: 'UNIT-01',
          position: 1,
          names: { vi: 'Bài 1' },
          rowVersion: 1n,
          level: { id: seedLvl21, code: 'A1', label: { en: 'Beginner' }, position: 1 },
        }],
        findFirst: async () => ({
          id: seedUnit40,
          courseId: seedCourse30,
          levelId: seedLvl21,
          code: 'UNIT-01',
          position: 1,
          names: { vi: 'Bài 1' },
          rowVersion: 1n,
          level: { id: seedLvl21, code: 'A1', label: { en: 'Beginner' }, position: 1 },
        }),
        create: async () => {
          unitCreated = true;
          return {
            id: '22222222-3333-4444-5555-666666666666',
            courseId: seedCourse30,
            levelId: seedLvl21,
            code: 'UNIT-02',
            position: 2,
            names: { vi: 'Bài 2' },
            rowVersion: 1n,
            level: { id: seedLvl21, code: 'A1', label: { en: 'Beginner' }, position: 1 },
          };
        },
        updateMany: async () => {
          unitUpdated = true;
          return { count: 1 };
        },
        deleteMany: async () => {
          unitDeleted = true;
          return { count: 1 };
        },
      },
      lesson: {
        findFirst: async () => null,
      },
      $transaction: async (fn) => fn(mockPrisma),
    };
    setProductPrismaForTest(mockPrisma);

    const originHeaders = {
      'Origin': 'http://localhost:3000',
      'Host': 'localhost:3000',
      'Content-Type': 'application/json',
    };

    // 1. GET /api/courses
    const resGetCourses = await getCoursesRoute(new Request('http://localhost:3000/api/courses'));
    assert.equal(resGetCourses.status, 200);
    assert.ok(resGetCourses.headers.get('content-type')?.includes('application/json'));
    assert.ok(resGetCourses.headers.get('cache-control')?.includes('no-store'));
    const jsonGetCourses = await resGetCourses.json();
    assert.ok(Array.isArray(jsonGetCourses.data));

    // 2. POST /api/courses
    const resPostCourses = await postCoursesRoute(new Request('http://localhost:3000/api/courses', {
      method: 'POST',
      headers: originHeaders,
      body: JSON.stringify({
        languageId: seedLangEn,
        frameworkId: seedFw10,
        defaultStartLevelId: seedLvl21,
        names: { vi: 'Khóa mới' },
        isActive: true,
      }),
    }));
    assert.equal(resPostCourses.status, 201);
    assert.equal(courseCreated, true);

    // 3. GET /api/courses/:courseId
    const resGetCourse = await getCourseDetailRoute(new Request(`http://localhost:3000/api/courses/${seedCourse30}`), {
      params: Promise.resolve({ courseId: seedCourse30 }),
    });
    assert.equal(resGetCourse.status, 200);
    const jsonGetCourse = await resGetCourse.json();
    assert.equal(jsonGetCourse.data.id, seedCourse30);

    // 4. PATCH /api/courses/:courseId
    const resPatchCourse = await patchCourseRoute(new Request(`http://localhost:3000/api/courses/${seedCourse30}`, {
      method: 'PATCH',
      headers: originHeaders,
      body: JSON.stringify({
        languageId: seedLangEn,
        frameworkId: seedFw10,
        defaultStartLevelId: seedLvl21,
        names: { vi: 'Khóa sửa' },
        isActive: true,
      }),
    }), { params: Promise.resolve({ courseId: seedCourse30 }) });
    assert.equal(resPatchCourse.status, 200);
    assert.equal(courseUpdated, true);

    // 5. DELETE /api/courses/:courseId
    mockPrisma.unit.findFirst = async () => null; // No units blocking delete
    const resDeleteCourse = await deleteCourseRoute(new Request(`http://localhost:3000/api/courses/${seedCourse30}`, {
      method: 'DELETE',
      headers: { 'Origin': 'http://localhost:3000', 'Host': 'localhost:3000' },
    }), { params: Promise.resolve({ courseId: seedCourse30 }) });
    assert.equal(resDeleteCourse.status, 204);
    assert.equal(courseDeleted, true);

    // 6. GET /api/courses/:courseId/units
    const resGetUnits = await getUnitsRoute(new Request(`http://localhost:3000/api/courses/${seedCourse30}/units`), {
      params: Promise.resolve({ courseId: seedCourse30 }),
    });
    assert.equal(resGetUnits.status, 200);
    const jsonGetUnits = await resGetUnits.json();
    assert.ok(Array.isArray(jsonGetUnits.data));

    // 7. POST /api/courses/:courseId/units
    const resPostUnits = await postUnitsRoute(new Request(`http://localhost:3000/api/courses/${seedCourse30}/units`, {
      method: 'POST',
      headers: originHeaders,
      body: JSON.stringify({
        levelId: seedLvl21,
        code: 'UNIT-02',
        position: 2,
        names: { vi: 'Bài 2' },
      }),
    }), { params: Promise.resolve({ courseId: seedCourse30 }) });
    assert.equal(resPostUnits.status, 201);
    assert.equal(unitCreated, true);

    // 8. PATCH /api/courses/:courseId/units/:unitId
    mockPrisma.unit.findFirst = async () => ({
      id: seedUnit40,
      courseId: seedCourse30,
      levelId: seedLvl21,
      code: 'UNIT-01',
      position: 1,
      names: { vi: 'Bài 1' },
      rowVersion: 1n,
      level: { id: seedLvl21, code: 'A1', label: { en: 'Beginner' }, position: 1 },
    });
    const resPatchUnit = await patchUnitRoute(new Request(`http://localhost:3000/api/courses/${seedCourse30}/units/${seedUnit40}`, {
      method: 'PATCH',
      headers: originHeaders,
      body: JSON.stringify({
        levelId: seedLvl21,
        code: 'UNIT-01-RENAMED',
        position: 1,
        names: { vi: 'Bài 1 mới' },
      }),
    }), { params: Promise.resolve({ courseId: seedCourse30, unitId: seedUnit40 }) });
    assert.equal(resPatchUnit.status, 200);
    assert.equal(unitUpdated, true);

    // 9. DELETE /api/courses/:courseId/units/:unitId
    const resDeleteUnit = await deleteUnitRoute(new Request(`http://localhost:3000/api/courses/${seedCourse30}/units/${seedUnit40}`, {
      method: 'DELETE',
      headers: { 'Origin': 'http://localhost:3000', 'Host': 'localhost:3000' },
    }), { params: Promise.resolve({ courseId: seedCourse30, unitId: seedUnit40 }) });
    assert.equal(resDeleteUnit.status, 204);
    assert.equal(unitDeleted, true);
  });

  // 2. Denials with zero catalogue database reads
  test('Denial check: unauthenticated, teacher, and inactive admin trigger zero catalogue reads on GET routes', async () => {
    let catalogueReadCount = 0;
    const mockPrisma = {
      account: {
        findUnique: async ({ where }) => {
          if (where.id === teacherId) return { id: teacherId, role: 'TEACHER', status: 'ACTIVE' };
          if (where.id === inactiveAdminId) return { id: inactiveAdminId, role: 'ADMIN', status: 'DISABLED' };
          return null;
        },
      },
      course: { findMany: async () => { catalogueReadCount++; return []; } },
      unit: { findMany: async () => { catalogueReadCount++; return []; } },
    };
    setProductPrismaForTest(mockPrisma);

    // Unauthenticated GET /api/courses
    currentCookieStore = { getAll: () => [] };
    const res1 = await getCoursesRoute(new Request('http://localhost:3000/api/courses'));
    assert.equal(res1.status, 401);

    // Teacher GET /api/courses
    currentCookieStore = { getAll: () => [createMockSessionCookie(teacherId)] };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: teacherId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    const res2 = await getCoursesRoute(new Request('http://localhost:3000/api/courses'));
    assert.equal(res2.status, 403);

    // Inactive Admin GET /api/courses/:courseId/units
    currentCookieStore = { getAll: () => [createMockSessionCookie(inactiveAdminId)] };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: inactiveAdminId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    const res3 = await getUnitsRoute(new Request(`http://localhost:3000/api/courses/${seedCourse30}/units`), {
      params: Promise.resolve({ courseId: seedCourse30 }),
    });
    assert.equal(res3.status, 403);

    assert.equal(catalogueReadCount, 0, 'Zero catalogue database reads on denied GET requests');
  });

  // 3. Route ID 400 validation with malformed UUIDs
  test('Route ID 400 validation rejects malformed UUIDs before database operations', async () => {
    setupAdminAuth();
    setProductPrismaForTest({
      account: { findUnique: async () => ({ id: adminId, role: 'ADMIN', status: 'ACTIVE' }) },
    });

    const badIds = ['not-a-uuid', '1234', '   ', '00000000-0000-0000-0000-000000000030-bad'];
    const originHeaders = { 'Origin': 'http://localhost:3000', 'Host': 'localhost:3000', 'Content-Type': 'application/json' };

    for (const badId of badIds) {
      const r1 = await getCourseDetailRoute(new Request(`http://localhost:3000/api/courses/${badId}`), { params: Promise.resolve({ courseId: badId }) });
      assert.equal(r1.status, 400);

      const r2 = await patchCourseRoute(new Request(`http://localhost:3000/api/courses/${badId}`, { method: 'PATCH', headers: originHeaders, body: JSON.stringify({}) }), { params: Promise.resolve({ courseId: badId }) });
      assert.equal(r2.status, 400);

      const r3 = await deleteCourseRoute(new Request(`http://localhost:3000/api/courses/${badId}`, { method: 'DELETE', headers: { 'Origin': 'http://localhost:3000', 'Host': 'localhost:3000' } }), { params: Promise.resolve({ courseId: badId }) });
      assert.equal(r3.status, 400);

      const r4 = await getUnitsRoute(new Request(`http://localhost:3000/api/courses/${badId}/units`), { params: Promise.resolve({ courseId: badId }) });
      assert.equal(r4.status, 400);

      const r5 = await postUnitsRoute(new Request(`http://localhost:3000/api/courses/${badId}/units`, { method: 'POST', headers: originHeaders, body: JSON.stringify({}) }), { params: Promise.resolve({ courseId: badId }) });
      assert.equal(r5.status, 400);

      const r6 = await patchUnitRoute(new Request(`http://localhost:3000/api/courses/${seedCourse30}/units/${badId}`, { method: 'PATCH', headers: originHeaders, body: JSON.stringify({}) }), { params: Promise.resolve({ courseId: seedCourse30, unitId: badId }) });
      assert.equal(r6.status, 400);

      const r7 = await deleteUnitRoute(new Request(`http://localhost:3000/api/courses/${seedCourse30}/units/${badId}`, { method: 'DELETE', headers: { 'Origin': 'http://localhost:3000', 'Host': 'localhost:3000' } }), { params: Promise.resolve({ courseId: seedCourse30, unitId: badId }) });
      assert.equal(r7.status, 400);
    }
  });

  // 4. Missing / foreign parent 404 tests
  test('Missing parent Course returns 404 in routes and service functions', async () => {
    setupAdminAuth();
    const emptyPrisma = {
      account: { findUnique: async () => ({ id: adminId, role: 'ADMIN', status: 'ACTIVE' }) },
      course: { findUnique: async () => null },
      $transaction: async (fn) => fn(emptyPrisma),
    };
    setProductPrismaForTest(emptyPrisma);

    const absentCourseId = '00000000-0000-0000-0000-000000000404';

    // Route 404 on GET units
    const rGetUnits = await getUnitsRoute(new Request(`http://localhost:3000/api/courses/${absentCourseId}/units`), {
      params: Promise.resolve({ courseId: absentCourseId }),
    });
    assert.equal(rGetUnits.status, 404);

    // Route 404 on POST units
    const rPostUnits = await postUnitsRoute(new Request(`http://localhost:3000/api/courses/${absentCourseId}/units`, {
      method: 'POST',
      headers: { 'Origin': 'http://localhost:3000', 'Host': 'localhost:3000', 'Content-Type': 'application/json' },
      body: JSON.stringify({ levelId: seedLvl21, code: 'U1', position: 1, names: {} }),
    }), { params: Promise.resolve({ courseId: absentCourseId }) });
    assert.equal(rPostUnits.status, 404);

    // Services 404
    assert.equal((await listUnits(absentCourseId, emptyPrisma)).status, 404);
    assert.equal((await getUnit(absentCourseId, seedUnit40, emptyPrisma)).status, 404);
    assert.equal((await createUnit(absentCourseId, { levelId: seedLvl21, code: 'U1', position: 1, names: {} }, emptyPrisma)).status, 404);
    assert.equal((await updateUnit(absentCourseId, seedUnit40, { levelId: seedLvl21, code: 'U1', position: 1, names: {} }, emptyPrisma)).status, 404);
    assert.equal((await deleteUnit(absentCourseId, seedUnit40, emptyPrisma)).status, 404);
  });

  // 5. R6: Case-insensitive UUID handling (Uppercase Hex UUIDs)
  test('R6: Case-insensitive UUIDs accepted in createCourse and createUnit without 400 INVALID_RELATION', async () => {
    const upperCourseId = '00000000-0000-0000-0000-00000000003A';
    const upperFwId = '00000000-0000-0000-0000-00000000001A';
    const upperLvlId = '00000000-0000-0000-0000-00000000002A';
    const upperLangId = '00000000-0000-0000-0000-00000000000A';

    const mockPrisma = {
      language: { findUnique: async () => ({ id: upperLangId.toLowerCase() }) },
      framework: { findUnique: async () => ({ id: upperFwId.toLowerCase() }) },
      level: { findUnique: async () => ({ id: upperLvlId.toLowerCase(), frameworkId: upperFwId.toLowerCase(), position: 1 }) },
      course: {
        findUnique: async () => ({ id: upperCourseId.toLowerCase(), frameworkId: upperFwId.toLowerCase() }),
        create: async ({ data }) => ({
          ...data,
          id: upperCourseId.toLowerCase(),
          curriculumGeneration: 1n,
          rowVersion: 1n,
        }),
        update: async () => ({ id: upperCourseId.toLowerCase() }),
      },
      unit: {
        findFirst: async () => null,
        create: async ({ data }) => ({
          ...data,
          id: '00000000-0000-0000-0000-00000000004a',
          level: { id: upperLvlId.toLowerCase(), code: 'A1', label: {}, position: 1 },
          rowVersion: 1n,
        }),
      },
      $transaction: async (fn) => fn(mockPrisma),
    };

    // 1. createCourse with uppercase UUIDs
    const resCourse = await createCourse({
      languageId: upperLangId,
      frameworkId: upperFwId,
      defaultStartLevelId: upperLvlId,
      names: { vi: 'Khóa học hoa' },
      isActive: true,
    }, mockPrisma);
    assert.equal(resCourse.status, 201, `createCourse with uppercase UUIDs must succeed (got ${resCourse.status} ${JSON.stringify(resCourse.error)})`);

    // 2. createUnit with uppercase UUIDs
    const resUnit = await createUnit(upperCourseId, {
      levelId: upperLvlId,
      code: 'UNIT-UPPER',
      position: 1,
      names: { vi: 'Bài học hoa' },
    }, mockPrisma);
    assert.equal(resUnit.status, 201, `createUnit with uppercase UUIDs must succeed (got ${resUnit.status} ${JSON.stringify(resUnit.error)})`);
  });

  // 6. Unit edit success names merge semantics
  test('Unit update merges locale names: preserves other locale and removes blanked locale', async () => {
    let savedNames = null;
    const mockPrisma = {
      course: {
        findUnique: async () => ({ id: seedCourse30, frameworkId: seedFw10 }),
        update: async () => ({ id: seedCourse30 }),
      },
      level: { findUnique: async () => ({ id: seedLvl21, frameworkId: seedFw10, position: 1 }) },
      unit: {
        findFirst: async () => ({
          id: seedUnit40,
          courseId: seedCourse30,
          levelId: seedLvl21,
          code: 'UNIT-01',
          position: 1,
          names: { vi: 'Bài 1 cũ', en: 'Unit 1 Old' },
          rowVersion: 1n,
        }),
        updateMany: async ({ data }) => {
          savedNames = data.names;
          return { count: 1 };
        },
      },
      $transaction: async (fn) => fn(mockPrisma),
    };

    // Update with blanked vi and new en
    const res = await updateUnit(seedCourse30, seedUnit40, {
      levelId: seedLvl21,
      code: 'UNIT-01',
      position: 1,
      names: { vi: '', en: 'Unit 1 Brand New' },
    }, mockPrisma);

    assert.equal(res.status, 200);
    assert.deepEqual(savedNames, { en: 'Unit 1 Brand New' }, 'Blanked vi should be deleted, en updated');
  });

  // 7. Unit with lessons blocks DELETE (409) and level change (409)
  test('Unit with lessons blocks DELETE (409 UNIT_IN_USE) and PATCH level change (409 SCOPE_FROZEN)', async () => {
    const mockPrisma = {
      course: { findUnique: async () => ({ id: seedCourse30, frameworkId: seedFw10 }) },
      level: { findUnique: async () => ({ id: seedLvl22, frameworkId: seedFw10, position: 2 }) },
      unit: {
        findFirst: async () => ({
          id: seedUnit40,
          courseId: seedCourse30,
          levelId: seedLvl21,
          code: 'UNIT-01',
          position: 1,
          names: {},
          rowVersion: 1n,
        }),
      },
      lesson: {
        findFirst: async () => ({ id: 'lesson-1', unitId: seedUnit40 }),
      },
      $transaction: async (fn) => fn(mockPrisma),
    };

    // 1. DELETE blocked
    const resDel = await deleteUnit(seedCourse30, seedUnit40, mockPrisma);
    assert.equal(resDel.status, 409);
    assert.equal(resDel.error?.code, 'UNIT_IN_USE');

    // 2. PATCH level change blocked
    const resPatch = await updateUnit(seedCourse30, seedUnit40, {
      levelId: seedLvl22, // Changed level
      code: 'UNIT-01',
      position: 1,
      names: {},
    }, mockPrisma);
    assert.equal(resPatch.status, 409);
    assert.equal(resPatch.error?.code, 'SCOPE_FROZEN');
  });

  // 8. Unit transaction rollback test
  test('Unit transaction atomicity: failure updating parent Course counter rolls back transaction', async () => {
    let unitCreated = false;
    const failingPrisma = {
      course: {
        findUnique: async () => ({ id: seedCourse30, frameworkId: seedFw10 }),
        update: async () => {
          throw new Error('Course counter increment lock conflict');
        },
      },
      level: { findUnique: async () => ({ id: seedLvl21, frameworkId: seedFw10, position: 1 }) },
      unit: {
        findFirst: async () => null,
        create: async () => {
          unitCreated = true;
          return { id: 'u-temp' };
        },
      },
      $transaction: async (fn) => {
        try {
          return await fn(failingPrisma);
        } catch (err) {
          // Prisma transaction rollback simulation: throws to outer caller
          throw err;
        }
      },
    };

    const res = await createUnit(seedCourse30, {
      levelId: seedLvl21,
      code: 'UNIT-FAIL',
      position: 1,
      names: {},
    }, failingPrisma);

    assert.equal(res.status, 500);
    assert.equal(res.error?.code, 'INTERNAL_ERROR');
  });
});
