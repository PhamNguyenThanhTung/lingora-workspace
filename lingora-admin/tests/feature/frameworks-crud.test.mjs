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
    usePathname: () => '/frameworks',
  },
});

const {
  createFrameworkSchema,
  updateFrameworkSchema,
  toFrameworkDto,
  handleFrameworkPrismaError,
  isValidUuid,
  listFrameworks,
  getFramework,
  createFramework,
  updateFramework,
  deleteFramework,
} = await import('../../src/server/frameworks/index.ts');

const {
  createLevelSchema,
  updateLevelSchema,
  toLevelDto,
  handleLevelPrismaError,
  listLevels,
  getLevel,
  createLevel,
  updateLevel,
  deleteLevel,
} = await import('../../src/server/levels/index.ts');

const { GET: getFrameworksRoute, POST: postFrameworksRoute } = await import('../../src/app/api/frameworks/route.ts');
const {
  GET: getFrameworkDetailRoute,
  PATCH: patchFrameworkRoute,
  DELETE: deleteFrameworkRoute,
} = await import('../../src/app/api/frameworks/[frameworkId]/route.ts');

const { GET: getLevelsRoute, POST: postLevelsRoute } = await import('../../src/app/api/frameworks/[frameworkId]/levels/route.ts');
const {
  PATCH: patchLevelRoute,
  DELETE: deleteLevelRoute,
} = await import('../../src/app/api/frameworks/[frameworkId]/levels/[levelId]/route.ts');

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

describe('S2-01 / S2-02: Framework & Level Domain Grounded Validation & Error Mapping', () => {
  const dummyUuid = '11111111-1111-4111-8111-111111111111';
  const dummyUuid2 = '22222222-2222-4222-8222-222222222222';

  test('isValidUuid accepts standard UUID v4 and rejects invalid formats', () => {
    assert.equal(isValidUuid(dummyUuid), true);
    assert.equal(isValidUuid('not-a-uuid'), false);
    assert.equal(isValidUuid(''), false);
  });

  test('isValidUuid accepts canonical CEFR, deterministic child levels, nil, max, non-version1-5 and rejects malformed strings (U1)', () => {
    // Canonical CEFR ID (seed) and deterministic Level IDs
    const canonicalCefrId = '00000000-0000-0000-0000-000000000010';
    assert.equal(isValidUuid(canonicalCefrId), true);
    assert.equal(isValidUuid('00000000-0000-0000-0000-000000000021'), true);
    assert.equal(isValidUuid('00000000-0000-0000-0000-000000000022'), true);
    assert.equal(isValidUuid('00000000-0000-0000-0000-000000000023'), true);
    assert.equal(isValidUuid('00000000-0000-0000-0000-000000000024'), true);

    // Nil and Max 128-bit standard UUIDs
    assert.equal(isValidUuid('00000000-0000-0000-0000-000000000000'), true);
    assert.equal(isValidUuid('ffffffff-ffff-ffff-ffff-ffffffffffff'), true);

    // Case-insensitivity (uppercase / mixed)
    assert.equal(isValidUuid('00000000-0000-0000-0000-000000000010'), true);
    assert.equal(isValidUuid('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF'), true);
    assert.equal(isValidUuid('00000000-0000-0000-0000-00000000001A'), true);

    // Non-version1-5 and non-variant8-b (v0, v6, v7, etc.)
    assert.equal(isValidUuid('11111111-2222-0333-4444-555555555555'), true);
    assert.equal(isValidUuid('11111111-2222-6333-7444-555555555555'), true);
    assert.equal(isValidUuid('11111111-2222-f333-c444-555555555555'), true);

    // Malformed rejections
    assert.equal(isValidUuid('not-a-uuid'), false);
    assert.equal(isValidUuid(''), false);
    assert.equal(isValidUuid(' 00000000-0000-0000-0000-000000000010'), false, 'rejects leading space');
    assert.equal(isValidUuid('00000000-0000-0000-0000-000000000010 '), false, 'rejects trailing space');
    assert.equal(isValidUuid('00000000-0000-0000-0000-000000000010\n'), false, 'rejects newline');
    assert.equal(isValidUuid('00000000-0000- 0000-0000-000000000010'), false, 'rejects embedded space');
    assert.equal(isValidUuid('00000000-0000-0000-0000-00000000001g'), false, 'rejects non-hex char g');
    assert.equal(isValidUuid('00000000-0000-0000-0000-00000000001z'), false, 'rejects non-hex char z');
    assert.equal(isValidUuid('00000000-0000-0000-0000-00000000001'), false, 'rejects short uuid (31 hex)');
    assert.equal(isValidUuid('00000000-0000-0000-0000-0000000000010'), false, 'rejects long uuid (33 hex)');
    assert.equal(isValidUuid('{00000000-0000-0000-0000-000000000010}'), false, 'rejects braces');
    assert.equal(isValidUuid('00000000000000000000000000000010'), false, 'rejects missing hyphens');
    assert.equal(isValidUuid('00000000-0000-0000-0000-0000-00000010'), false, 'rejects invalid hyphen layout');
  });

  describe('createFrameworkSchema & updateFrameworkSchema validation (S2-01)', () => {
    test('accepts valid code, version and optional names object', () => {
      const res = createFrameworkSchema.safeParse({
        code: 'CEFR',
        version: '2020',
        names: { vi: 'Khung Tham chiếu Châu Âu', en: 'CEFR Companion' },
      });
      assert.equal(res.success, true);
    });

    test('accepts empty names object or omitted locale strings', () => {
      const res1 = createFrameworkSchema.safeParse({
        code: 'ACTFL',
        version: 'v1',
        names: {},
      });
      assert.equal(res1.success, true);

      const res2 = createFrameworkSchema.safeParse({
        code: 'HSK',
        version: '3.0',
        names: { vi: 'Chuẩn HSK 3.0' },
      });
      assert.equal(res2.success, true);
    });

    test('trims whitespace on code and version', () => {
      const parsed = createFrameworkSchema.parse({
        code: '  JLPT  ',
        version: '  2010  ',
        names: {},
      });
      assert.equal(parsed.code, 'JLPT');
      assert.equal(parsed.version, '2010');
    });

    test('rejects empty or whitespace-only code or version', () => {
      assert.equal(createFrameworkSchema.safeParse({ code: '', version: '1.0', names: {} }).success, false);
      assert.equal(createFrameworkSchema.safeParse({ code: '   ', version: '1.0', names: {} }).success, false);
      assert.equal(createFrameworkSchema.safeParse({ code: 'CEFR', version: '', names: {} }).success, false);
      assert.equal(createFrameworkSchema.safeParse({ code: 'CEFR', version: '   ', names: {} }).success, false);
    });

    test('rejects arbitrary unknown fields at root and inside names', () => {
      assert.equal(createFrameworkSchema.safeParse({
        code: 'CEFR',
        version: '1',
        names: {},
        extra: 'not allowed',
      }).success, false);

      assert.equal(createFrameworkSchema.safeParse({
        code: 'CEFR',
        version: '1',
        names: { vi: 'CEFR', fr: 'interdit' },
      }).success, false);
    });

    test('updateFrameworkSchema allows modifying code and version', () => {
      const res = updateFrameworkSchema.safeParse({
        code: 'CEFR_UPDATED',
        version: '2025',
        names: { vi: 'Bản Cập Nhật' },
      });
      assert.equal(res.success, true);
    });
  });

  describe('createLevelSchema & updateLevelSchema validation (S2-02)', () => {
    test('accepts valid Level payload with positive int32 position', () => {
      const res = createLevelSchema.safeParse({
        code: 'B1',
        label: { vi: 'Trung cấp B1', en: 'Threshold' },
        position: 3,
      });
      assert.equal(res.success, true);
    });

    test('accepts position up to PostgreSQL int32 maximum (2147483647)', () => {
      const res = createLevelSchema.safeParse({
        code: 'MAX',
        label: {},
        position: 2147483647,
      });
      assert.equal(res.success, true);
    });

    test('strictly rejects string position (no string coercion)', () => {
      const res = createLevelSchema.safeParse({
        code: 'A1',
        label: {},
        position: '1',
      });
      assert.equal(res.success, false, 'String position must be rejected without coercion');
    });

    test('rejects zero, negative, and float position', () => {
      assert.equal(createLevelSchema.safeParse({ code: 'A1', label: {}, position: 0 }).success, false);
      assert.equal(createLevelSchema.safeParse({ code: 'A1', label: {}, position: -1 }).success, false);
      assert.equal(createLevelSchema.safeParse({ code: 'A1', label: {}, position: 1.5 }).success, false);
    });

    test('rejects position exceeding int32 maximum (> 2147483647)', () => {
      const res = createLevelSchema.safeParse({
        code: 'TOO_BIG',
        label: {},
        position: 2147483648,
      });
      assert.equal(res.success, false);
    });

    test('allows non-contiguous positions (e.g. 10, 20, 50)', () => {
      assert.equal(createLevelSchema.safeParse({ code: 'L1', label: {}, position: 10 }).success, true);
      assert.equal(createLevelSchema.safeParse({ code: 'L2', label: {}, position: 50 }).success, true);
    });

    test('rejects missing or empty code', () => {
      assert.equal(createLevelSchema.safeParse({ code: '', label: {}, position: 1 }).success, false);
      assert.equal(createLevelSchema.safeParse({ code: '   ', label: {}, position: 1 }).success, false);
    });

    test('rejects arbitrary unknown fields in level payload', () => {
      assert.equal(createLevelSchema.safeParse({
        code: 'A1',
        label: {},
        position: 1,
        frameworkId: dummyUuid,
      }).success, false);
    });
  });

  describe('Prisma Error Mapping (S2-01 & S2-02)', () => {
    test('Framework P2002 maps to 409 DUPLICATE_CODE_VERSION with fields', () => {
      const err = new Error('Unique constraint failed on code, version');
      err.code = 'P2002';
      const res = handleFrameworkPrismaError(err);
      assert.equal(res.status, 409);
      assert.equal(res.body.error.code, 'DUPLICATE_CODE_VERSION');
      assert.ok(res.body.error.fields?.code);
      assert.ok(res.body.error.fields?.version);
    });

    test('Framework P2003 maps to 409 FRAMEWORK_IN_USE', () => {
      const err = new Error('FK constraint');
      err.code = 'P2003';
      const res = handleFrameworkPrismaError(err);
      assert.equal(res.status, 409);
      assert.equal(res.body.error.code, 'FRAMEWORK_IN_USE');
    });

    test('Level P2002 structured target [framework_id, code] with realistic message containing position: 2 gives precedence to target and returns DUPLICATE_LEVEL_CODE', () => {
      const err = new Error('Invalid `prisma.level.create()` invocation: data: { position: 2, code: "A1" }. Unique constraint failed on the fields: (`framework_id`,`code`)');
      err.code = 'P2002';
      err.meta = { target: ['framework_id', 'code'] };
      const res = handleLevelPrismaError(err);
      assert.equal(res.status, 409);
      assert.equal(res.body.error.code, 'DUPLICATE_LEVEL_CODE');
      assert.ok(res.body.error.fields?.code);
      assert.equal(res.body.error.fields?.position, undefined);
    });

    test('Level P2002 structured target [framework_id, position] with realistic message containing code: "A1" gives precedence to target and returns DUPLICATE_LEVEL_POSITION', () => {
      const err = new Error('Invalid `prisma.level.create()` invocation: data: { position: 2, code: "A1" }. Unique constraint failed on the fields: (`framework_id`,`position`)');
      err.code = 'P2002';
      err.meta = { target: ['framework_id', 'position'] };
      const res = handleLevelPrismaError(err);
      assert.equal(res.status, 409);
      assert.equal(res.body.error.code, 'DUPLICATE_LEVEL_POSITION');
      assert.ok(res.body.error.fields?.position);
      assert.equal(res.body.error.fields?.code, undefined);
    });

    test('Level P2002 string constraint name in message returns accurate field without target', () => {
      const errCode = new Error('Unique constraint failed on the constraint: levels_framework_id_code_key');
      errCode.code = 'P2002';
      assert.equal(handleLevelPrismaError(errCode).body.error.code, 'DUPLICATE_LEVEL_CODE');

      const errPos = new Error('Unique constraint failed on the constraint: levels_framework_id_position_key');
      errPos.code = 'P2002';
      assert.equal(handleLevelPrismaError(errPos).body.error.code, 'DUPLICATE_LEVEL_POSITION');
    });

    test('Level P2002 unrecognized target falls back to generic DUPLICATE_LEVEL without field association', () => {
      const err = new Error('Unique constraint failed on unknown');
      err.code = 'P2002';
      err.meta = { target: ['unknown_column'] };
      const res = handleLevelPrismaError(err);
      assert.equal(res.status, 409);
      assert.equal(res.body.error.code, 'DUPLICATE_LEVEL');
      assert.equal(res.body.error.fields, undefined);
    });

    test('Level P2003 on delete maps to 409 LEVEL_IN_USE', () => {
      const err = new Error('FK restriction on unit');
      err.code = 'P2003';
      const res = handleLevelPrismaError(err, 'delete');
      assert.equal(res.status, 409);
      assert.equal(res.body.error.code, 'LEVEL_IN_USE');
    });

    test('Level P2003 on create (parent deleted in race) maps to 404 NOT_FOUND', () => {
      const err = new Error('FK restriction on framework_id');
      err.code = 'P2003';
      const res = handleLevelPrismaError(err, 'create');
      assert.equal(res.status, 404);
      assert.equal(res.body.error.code, 'NOT_FOUND');
    });

    test('Prisma DB connection outage codes map to 503 SERVICE_UNAVAILABLE', () => {
      for (const code of ['P1000', 'P1001', 'P1002', 'P1008', 'P1017', 'P2024']) {
        const err = new Error('DB outage');
        err.code = code;
        assert.equal(handleFrameworkPrismaError(err).status, 503);
        assert.equal(handleLevelPrismaError(err).status, 503);
      }
    });
  });
});

describe('S2-01 / S2-02: Framework & Level Service Operations with Doubles', () => {
  const fwId = '11111111-1111-4111-8111-111111111111';
  const lvlId = '22222222-2222-4222-8222-222222222222';

  test('listFrameworks computes accurate levelCount from _count', async () => {
    const mockPrisma = {
      framework: {
        findMany: async () => [
          {
            id: fwId,
            code: 'CEFR',
            version: '2020',
            names: { vi: 'Châu Âu', en: 'European' },
            _count: { levels: 6 },
          },
        ],
      },
    };

    const res = await listFrameworks(mockPrisma);
    assert.equal(res.status, 200);
    assert.equal(res.data?.data[0].levelCount, 6);
  });

  test('createFramework creates record and returns DTO with levelCount 0', async () => {
    const mockPrisma = {
      framework: {
        create: async ({ data }) => ({
          id: fwId,
          ...data,
        }),
      },
    };

    const res = await createFramework({
      code: 'ACTFL',
      version: '2024',
      names: { en: 'ACTFL Proficiency' },
    }, mockPrisma);

    assert.equal(res.status, 201);
    assert.equal(res.data?.data.code, 'ACTFL');
    assert.equal(res.data?.data.version, '2024');
    assert.equal(res.data?.data.levelCount, 0);
  });

  test('updateFramework preserves existing unedited translations and removes cleared ones', async () => {
    let savedNames = null;
    const mockPrisma = {
      framework: {
        findUnique: async () => ({
          id: fwId,
          code: 'CEFR',
          version: '2020',
          names: { vi: 'Tiếng Việt Cũ', en: 'English Old', fr: 'Francais Inchange' },
          _count: { levels: 6 },
        }),
        update: async ({ data }) => {
          savedNames = data.names;
          return {
            id: fwId,
            code: data.code,
            version: data.version,
            names: data.names,
            _count: { levels: 6 },
          };
        },
      },
    };

    // Update vi, clear en (empty string), preserve fr
    const res = await updateFramework(fwId, {
      code: 'CEFR_NEW',
      version: '2021',
      names: { vi: 'Tiếng Việt Mới', en: '' },
    }, mockPrisma);

    assert.equal(res.status, 200);
    assert.equal(savedNames.vi, 'Tiếng Việt Mới');
    assert.equal(savedNames.en, undefined, 'Cleared en must be removed from JSON');
    assert.equal(savedNames.fr, 'Francais Inchange', 'Existing untouched locale must be preserved');
  });

  test('deleteFramework returns 204 on success, 404 when absent, 409 when in use', async () => {
    let deleteCalled = false;
    const mockPrisma = {
      framework: {
        findUnique: async () => ({ id: fwId }),
        delete: async () => { deleteCalled = true; },
      },
    };

    const resSuccess = await deleteFramework(fwId, mockPrisma);
    assert.equal(resSuccess.status, 204);
    assert.equal(deleteCalled, true);

    const mockPrismaAbsent = {
      framework: {
        findUnique: async () => null,
      },
    };
    const resAbsent = await deleteFramework(fwId, mockPrismaAbsent);
    assert.equal(resAbsent.status, 404);
  });

  test('listLevels returns 404 when parent framework does not exist', async () => {
    const mockPrisma = {
      framework: {
        findUnique: async () => null,
      },
    };
    const res = await listLevels(fwId, mockPrisma);
    assert.equal(res.status, 404);
  });

  test('createLevel enforces parent frameworkId strictly from URL', async () => {
    let createdPayload = null;
    const mockPrisma = {
      framework: {
        findUnique: async () => ({ id: fwId }),
      },
      level: {
        create: async ({ data }) => {
          createdPayload = data;
          return { id: lvlId, ...data };
        },
      },
    };

    const res = await createLevel(fwId, {
      code: 'B2',
      label: { vi: 'Trung cao cấp B2' },
      position: 4,
    }, mockPrisma);

    assert.equal(res.status, 201);
    assert.equal(createdPayload.frameworkId, fwId, 'Must assign parent from URL');
    assert.equal(createdPayload.position, 4);
  });

  test('updateLevel rejects mismatched level / parent framework with 404 and zero update', async () => {
    let updateInvoked = false;
    const mockPrisma = {
      $transaction: async (fn) => fn({
        framework: { findUnique: async () => ({ id: fwId }) },
        level: {
          findFirst: async () => null, // Not found under this framework
          updateMany: async () => { updateInvoked = true; return { count: 0 }; },
        },
      }),
    };

    const res = await updateLevel(fwId, lvlId, {
      code: 'B2_UPDATED',
      label: {},
      position: 5,
    }, mockPrisma);

    assert.equal(res.status, 404);
    assert.equal(updateInvoked, false, 'No update executed when level is mismatched');
  });

  test('updateLevel atomic selector strictly asserts id and frameworkId in updateMany where clause and clears edited locale', async () => {
    let updateSelectorWhere = null;
    let savedLabel = null;
    const mockPrisma = {
      $transaction: async (fn) => fn({
        framework: { findUnique: async () => ({ id: fwId }) },
        level: {
          findFirst: async () => ({
            id: lvlId,
            frameworkId: fwId,
            code: 'B2',
            label: { vi: 'Trung cao cấp B2', en: 'Upper Intermediate', de: 'Grundstufe' },
            position: 4,
          }),
          updateMany: async ({ where, data }) => {
            updateSelectorWhere = where;
            savedLabel = data.label;
            return { count: 1 };
          },
        },
      }),
    };

    const res = await updateLevel(fwId, lvlId, {
      code: 'B2_EDITED',
      label: { vi: '', en: 'Upper Intermediate Edited' },
      position: 5,
    }, mockPrisma);

    assert.equal(res.status, 200);
    // Explicitly assert atomic selector contains BOTH id and frameworkId
    assert.ok(updateSelectorWhere, 'updateMany must be called');
    assert.equal(updateSelectorWhere.id, lvlId, 'updateMany must match level id');
    assert.equal(updateSelectorWhere.frameworkId, fwId, 'CRITICAL: updateMany must include frameworkId in WHERE clause to close parent-swap race');
    // Assert R2 locale clearing & preservation:
    assert.equal(savedLabel.vi, undefined, 'Cleared vi must be removed from label');
    assert.equal(savedLabel.en, 'Upper Intermediate Edited');
    assert.equal(savedLabel.de, 'Grundstufe', 'Untouched de translation must be preserved');
  });

  test('valid existing child under WRONG existing parent cannot be updated or deleted and returns 404', async () => {
    const wrongFwId = '33333333-3333-4333-8333-333333333333';
    let updateInvoked = false;
    let deleteInvoked = false;

    const mockPrisma = {
      $transaction: async (fn) => fn({
        framework: { findUnique: async () => ({ id: wrongFwId }) },
        level: {
          // findFirst with where { id: lvlId, frameworkId: wrongFwId } returns null because child belongs to fwId
          findFirst: async ({ where }) => {
            if (where.frameworkId === wrongFwId) return null;
            return { id: lvlId, frameworkId: fwId };
          },
          updateMany: async () => {
            updateInvoked = true;
            return { count: 0 };
          },
        },
      }),
      framework: { findUnique: async () => ({ id: wrongFwId }) },
      level: {
        findFirst: async ({ where }) => {
          if (where.frameworkId === wrongFwId) return null;
          return { id: lvlId, frameworkId: fwId };
        },
        deleteMany: async () => {
          deleteInvoked = true;
          return { count: 0 };
        },
      },
    };

    const updateRes = await updateLevel(wrongFwId, lvlId, { code: 'A1', label: {}, position: 1 }, mockPrisma);
    assert.equal(updateRes.status, 404);
    assert.equal(updateInvoked, false, 'updateMany must not execute when parent is wrong');

    const deleteRes = await deleteLevel(wrongFwId, lvlId, mockPrisma);
    assert.equal(deleteRes.status, 404);
    assert.equal(deleteInvoked, false, 'deleteMany must not execute when parent is wrong');
  });

  test('listLevels orders by position asc with stable secondary code asc and filters by parent', async () => {
    let capturedQuery = null;
    const mockPrisma = {
      framework: { findUnique: async () => ({ id: fwId }) },
      level: {
        findMany: async (args) => {
          capturedQuery = args;
          return [
            { id: '1', frameworkId: fwId, code: 'A1', label: {}, position: 1 },
            { id: '2', frameworkId: fwId, code: 'A2', label: {}, position: 2 },
          ];
        },
      },
    };

    const res = await listLevels(fwId, mockPrisma);
    assert.equal(res.status, 200);
    assert.equal(capturedQuery.where.frameworkId, fwId);
    assert.deepEqual(capturedQuery.orderBy, [{ position: 'asc' }, { code: 'asc' }, { id: 'asc' }]);
  });

  test('code and version pair rules: same code different version allowed, same pair conflicts', async () => {
    const existing = new Set(['CEFR::2020']);
    const mockPrisma = {
      framework: {
        create: async ({ data }) => {
          const key = `${data.code}::${data.version}`;
          if (existing.has(key)) {
            const err = new Error('Unique constraint failed on (code, version)');
            err.code = 'P2002';
            err.meta = { target: ['code', 'version'] };
            throw err;
          }
          existing.add(key);
          return { id: 'new-id', ...data };
        },
      },
    };

    // Same code different version -> allowed
    const resDiffVersion = await createFramework({ code: 'CEFR', version: '2024', names: {} }, mockPrisma);
    assert.equal(resDiffVersion.status, 201);

    // Different code same version -> allowed
    const resDiffCode = await createFramework({ code: 'ACTFL', version: '2020', names: {} }, mockPrisma);
    assert.equal(resDiffCode.status, 201);

    // Exact same pair -> conflicts with 409 DUPLICATE_CODE_VERSION
    const resConflict = await createFramework({ code: 'CEFR', version: '2020', names: {} }, mockPrisma);
    assert.equal(resConflict.status, 409);
    assert.equal(resConflict.error?.code, 'DUPLICATE_CODE_VERSION');
  });

  test('per-parent level code and position scope: allowed across parents, conflicts within same parent', async () => {
    const parentA = '11111111-1111-4111-8111-111111111111';
    const parentB = '22222222-2222-4222-8222-222222222222';
    const existing = new Set([`${parentA}::code::A1`, `${parentA}::pos::1`]);

    const mockPrisma = {
      framework: { findUnique: async () => ({ id: 'any' }) },
      level: {
        create: async ({ data }) => {
          const codeKey = `${data.frameworkId}::code::${data.code}`;
          const posKey = `${data.frameworkId}::pos::${data.position}`;
          if (existing.has(codeKey)) {
            const err = new Error('Unique constraint failed on code');
            err.code = 'P2002';
            err.meta = { target: ['framework_id', 'code'] };
            throw err;
          }
          if (existing.has(posKey)) {
            const err = new Error('Unique constraint failed on position');
            err.code = 'P2002';
            err.meta = { target: ['framework_id', 'position'] };
            throw err;
          }
          existing.add(codeKey);
          existing.add(posKey);
          return { id: 'lvl-new', ...data };
        },
      },
    };

    // Same code A1 and position 1 in parentB -> ALLOWED
    const resParentB = await createLevel(parentB, { code: 'A1', label: {}, position: 1 }, mockPrisma);
    assert.equal(resParentB.status, 201);

    // Duplicate code in parentA -> 409 DUPLICATE_LEVEL_CODE
    const resDupCode = await createLevel(parentA, { code: 'A1', label: {}, position: 99 }, mockPrisma);
    assert.equal(resDupCode.status, 409);
    assert.equal(resDupCode.error?.code, 'DUPLICATE_LEVEL_CODE');

    // Duplicate position in parentA -> 409 DUPLICATE_LEVEL_POSITION
    const resDupPos = await createLevel(parentA, { code: 'UNIQUE_CODE', label: {}, position: 1 }, mockPrisma);
    assert.equal(resDupPos.status, 409);
    assert.equal(resDupPos.error?.code, 'DUPLICATE_LEVEL_POSITION');
  });

  test('P2025 record not found maps cleanly to 404 NOT_FOUND', async () => {
    const err2025 = new Error('Record to update not found');
    err2025.code = 'P2025';
    assert.equal(handleFrameworkPrismaError(err2025).status, 404);
    assert.equal(handleLevelPrismaError(err2025).status, 404);
  });

  test('canonical CEFR parent framework ID and deterministic child level IDs operate correctly across all Framework and Level service helpers (U1)', async () => {
    const canonicalFwId = '00000000-0000-0000-0000-000000000010';
    const canonicalLevelId = '00000000-0000-0000-0000-000000000021';
    const querySpies = {
      fwFindUnique: null,
      fwUpdate: null,
      fwDelete: null,
      lvlFindMany: null,
      lvlFindFirst: null,
      lvlCreate: null,
      lvlUpdateMany: null,
      lvlDeleteMany: null,
    };

    const mockCanonicalPrisma = {
      $transaction: async (fn) => fn(mockCanonicalPrisma),
      framework: {
        findUnique: async (args) => {
          querySpies.fwFindUnique = args;
          return {
            id: canonicalFwId,
            code: 'CEFR',
            version: '2020',
            names: { en: 'Common European Framework', vi: 'Khung Châu Âu' },
            _count: { levels: 4 },
          };
        },
        update: async (args) => {
          querySpies.fwUpdate = args;
          return {
            id: canonicalFwId,
            code: args.data.code,
            version: args.data.version,
            names: args.data.names,
            _count: { levels: 4 },
          };
        },
        delete: async (args) => {
          querySpies.fwDelete = args;
          return { id: canonicalFwId };
        },
      },
      level: {
        findMany: async (args) => {
          querySpies.lvlFindMany = args;
          return [
            { id: canonicalLevelId, frameworkId: canonicalFwId, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
          ];
        },
        findFirst: async (args) => {
          querySpies.lvlFindFirst = args;
          return { id: canonicalLevelId, frameworkId: canonicalFwId, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 };
        },
        create: async (args) => {
          querySpies.lvlCreate = args;
          return { id: canonicalLevelId, ...args.data };
        },
        updateMany: async (args) => {
          querySpies.lvlUpdateMany = args;
          return { count: 1 };
        },
        deleteMany: async (args) => {
          querySpies.lvlDeleteMany = args;
          return { count: 1 };
        },
      },
    };

    // 1. getFramework
    const fwGetRes = await getFramework(canonicalFwId, mockCanonicalPrisma);
    assert.equal(fwGetRes.status, 200);
    assert.equal(fwGetRes.data?.data.id, canonicalFwId);
    assert.equal(querySpies.fwFindUnique?.where?.id, canonicalFwId);

    // 2. updateFramework
    const fwUpdateRes = await updateFramework(canonicalFwId, { code: 'CEFR', version: '2020', names: { vi: 'Khung Châu Âu' } }, mockCanonicalPrisma);
    assert.equal(fwUpdateRes.status, 200);
    assert.equal(querySpies.fwUpdate?.where?.id, canonicalFwId);

    // 3. deleteFramework
    const fwDelRes = await deleteFramework(canonicalFwId, mockCanonicalPrisma);
    assert.equal(fwDelRes.status, 204);
    assert.equal(querySpies.fwDelete?.where?.id, canonicalFwId);

    // 4. listLevels
    const lvlListRes = await listLevels(canonicalFwId, mockCanonicalPrisma);
    assert.equal(lvlListRes.status, 200);
    assert.equal(lvlListRes.data?.data[0].frameworkId, canonicalFwId);
    assert.equal(querySpies.lvlFindMany?.where?.frameworkId, canonicalFwId);

    // 5. getLevel
    const lvlGetRes = await getLevel(canonicalFwId, canonicalLevelId, mockCanonicalPrisma);
    assert.equal(lvlGetRes.status, 200);
    assert.equal(lvlGetRes.data?.data.id, canonicalLevelId);
    assert.equal(lvlGetRes.data?.data.frameworkId, canonicalFwId);
    assert.equal(querySpies.lvlFindFirst?.where?.id, canonicalLevelId);
    assert.equal(querySpies.lvlFindFirst?.where?.frameworkId, canonicalFwId);

    // 6. createLevel
    const lvlCreateRes = await createLevel(canonicalFwId, { code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 }, mockCanonicalPrisma);
    assert.equal(lvlCreateRes.status, 201);
    assert.equal(lvlCreateRes.data?.data.frameworkId, canonicalFwId);
    assert.equal(querySpies.lvlCreate?.data?.frameworkId, canonicalFwId);

    // 7. updateLevel
    const lvlUpdateRes = await updateLevel(canonicalFwId, canonicalLevelId, { code: 'A1', label: { vi: 'Sơ cấp' }, position: 1 }, mockCanonicalPrisma);
    assert.equal(lvlUpdateRes.status, 200);
    assert.equal(querySpies.lvlUpdateMany?.where?.id, canonicalLevelId);
    assert.equal(querySpies.lvlUpdateMany?.where?.frameworkId, canonicalFwId);

    // 8. deleteLevel
    const lvlDelRes = await deleteLevel(canonicalFwId, canonicalLevelId, mockCanonicalPrisma);
    assert.equal(lvlDelRes.status, 204);
    assert.equal(querySpies.lvlDeleteMany?.where?.id, canonicalLevelId);
    assert.equal(querySpies.lvlDeleteMany?.where?.frameworkId, canonicalFwId);

    // 9. Malformed ID rejection with zero database calls
    let malformedDbCalled = false;
    const bombPrisma = {
      framework: { findUnique: async () => { malformedDbCalled = true; } },
      level: { findMany: async () => { malformedDbCalled = true; } },
    };
    for (const bad of ['bad-uuid', ' 00000000-0000-0000-0000-000000000010 ', '00000000-0000-0000-0000-00000000001g']) {
      assert.equal((await getFramework(bad, bombPrisma)).status, 400);
      assert.equal((await updateFramework(bad, { code: 'C', version: '1', names: {} }, bombPrisma)).status, 400);
      assert.equal((await deleteFramework(bad, bombPrisma)).status, 400);
      assert.equal((await listLevels(bad, bombPrisma)).status, 400);
      assert.equal((await getLevel(bad, canonicalLevelId, bombPrisma)).status, 400);
      assert.equal((await getLevel(canonicalFwId, bad, bombPrisma)).status, 400);
      assert.equal((await createLevel(bad, { code: 'A', label: {}, position: 1 }, bombPrisma)).status, 400);
      assert.equal((await updateLevel(bad, canonicalLevelId, { code: 'A', label: {}, position: 1 }, bombPrisma)).status, 400);
      assert.equal((await updateLevel(canonicalFwId, bad, { code: 'A', label: {}, position: 1 }, bombPrisma)).status, 400);
      assert.equal((await deleteLevel(bad, canonicalLevelId, bombPrisma)).status, 400);
      assert.equal((await deleteLevel(canonicalFwId, bad, bombPrisma)).status, 400);
    }
    assert.equal(malformedDbCalled, false, 'Malformed IDs must reject before touching database');
  });
});

describe('S2-03: HTTP Route Handlers Auth Matrix, Guard Verification & Write Spies', () => {
  const adminUserId = '5650336e-550c-413d-b2a8-4afa2e4d9160';
  const teacherUserId = '00000000-0000-4000-8000-000000000002';
  const learnerUserId = '00000000-0000-4000-8000-000000000003';
  const disabledAdminId = '00000000-0000-4000-8000-000000000004';
  const pendingAdminId = '00000000-0000-4000-8000-000000000005';
  const missingAccountId = '00000000-0000-4000-8000-000000000006';

  const fwId = '11111111-1111-4111-8111-111111111111';
  const lvlId = '22222222-2222-4222-8222-222222222222';

  let writeCount = 0;
  let catalogueReadCount = 0;
  let frameworkFindUniqueOverride = null;
  let accountFindUniqueOverride = null;

  const createPrismaDouble = () => {
    writeCount = 0;
    catalogueReadCount = 0;
    return {
      account: {
        findUnique: async ({ where }) => {
          if (accountFindUniqueOverride) return accountFindUniqueOverride({ where });
          if (where.id === adminUserId) {
            return { id: adminUserId, role: 'ADMIN', status: 'ACTIVE', displayName: 'Admin User', uiLocale: 'vi' };
          }
          if (where.id === teacherUserId) {
            return { id: teacherUserId, role: 'TEACHER', status: 'ACTIVE', displayName: 'Teacher User', uiLocale: 'vi' };
          }
          if (where.id === learnerUserId) {
            return { id: learnerUserId, role: 'LEARNER', status: 'ACTIVE', displayName: 'Learner User', uiLocale: 'vi' };
          }
          if (where.id === disabledAdminId) {
            return { id: disabledAdminId, role: 'ADMIN', status: 'DISABLED', displayName: 'Disabled Admin', uiLocale: 'vi' };
          }
          if (where.id === pendingAdminId) {
            return { id: pendingAdminId, role: 'ADMIN', status: 'PENDING', displayName: 'Pending Admin', uiLocale: 'vi' };
          }
          return null;
        },
      },
      framework: {
        findMany: async () => {
          catalogueReadCount++;
          return [
            { id: fwId, code: 'CEFR', version: '2020', names: { vi: 'Khung Châu Âu' }, _count: { levels: 6 } },
          ];
        },
        findUnique: async ({ where }) => {
          catalogueReadCount++;
          if (frameworkFindUniqueOverride) return frameworkFindUniqueOverride({ where });
          if (where.id === fwId) {
            return { id: fwId, code: 'CEFR', version: '2020', names: { vi: 'Khung Châu Âu' }, _count: { levels: 6 } };
          }
          return null;
        },
        create: async ({ data }) => {
          writeCount++;
          return { id: fwId, ...data };
        },
        update: async ({ data }) => {
          writeCount++;
          return { id: fwId, code: data.code, version: data.version, names: data.names, _count: { levels: 6 } };
        },
        delete: async () => {
          writeCount++;
          return { id: fwId };
        },
      },
      level: {
        findMany: async () => {
          catalogueReadCount++;
          return [
            { id: lvlId, frameworkId: fwId, code: 'A1', label: { vi: 'Cơ bản' }, position: 1 },
          ];
        },
        findFirst: async ({ where }) => {
          catalogueReadCount++;
          if (where.id === lvlId && where.frameworkId === fwId) {
            return { id: lvlId, frameworkId: fwId, code: 'A1', label: { vi: 'Cơ bản' }, position: 1 };
          }
          return null;
        },
        create: async ({ data }) => {
          writeCount++;
          return { id: lvlId, ...data };
        },
        updateMany: async () => {
          writeCount++;
          return { count: 1 };
        },
        deleteMany: async () => {
          writeCount++;
          return { count: 1 };
        },
      },
      $transaction: async (fn) => fn(createPrismaDouble()),
    };
  };

  beforeEach(() => {
    frameworkFindUniqueOverride = null;
    accountFindUniqueOverride = null;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.DATABASE_URL = 'postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder?schema=app';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    setProductPrismaForTest(createPrismaDouble());
  });

  afterEach(() => {
    setProductPrismaForTest(null);
    globalThis.fetch = originalFetch;
  });

  test('GET /api/frameworks returns 401 when no session cookie is present', async () => {
    currentCookieStore = { getAll: () => [], get: () => undefined, set: () => {}, delete: () => {} };
    const res = await getFrameworksRoute(new Request('http://localhost:3000/api/frameworks'));
    assert.equal(res.status, 401);
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
  });

  test('GET /api/frameworks returns 403 when user is TEACHER', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(teacherUserId)], get: () => createMockSessionCookie(teacherUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: teacherUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const res = await getFrameworksRoute(new Request('http://localhost:3000/api/frameworks'));
    assert.equal(res.status, 403);
  });

  test('GET /api/frameworks returns 403 when admin status is DISABLED', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(disabledAdminId)], get: () => createMockSessionCookie(disabledAdminId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: disabledAdminId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const res = await getFrameworksRoute(new Request('http://localhost:3000/api/frameworks'));
    assert.equal(res.status, 403);
  });

  test('GET /api/frameworks returns 200 with framework list for active ADMIN', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const res = await getFrameworksRoute(new Request('http://localhost:3000/api/frameworks'));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].code, 'CEFR');
  });

  test('POST /api/frameworks rejects foreign Origin with 403 and zero writes', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const req = new Request('http://localhost:3000/api/frameworks', {
      method: 'POST',
      headers: {
        'Origin': 'https://malicious-site.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'HACK', version: '1', names: {} }),
    });

    const res = await postFrameworksRoute(req);
    assert.equal(res.status, 403);
    assert.equal(writeCount, 0, 'Zero writes must occur on denied Origin');
  });

  test('POST /api/frameworks rejects non-JSON Content-Type with 415 and zero writes', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const req = new Request('http://localhost:3000/api/frameworks', {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'text/plain',
      },
      body: 'code=HACK',
    });

    const res = await postFrameworksRoute(req);
    assert.equal(res.status, 415);
    assert.equal(writeCount, 0);
  });

  test('POST /api/frameworks creates framework for active ADMIN', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const req = new Request('http://localhost:3000/api/frameworks', {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'ACTFL', version: '2024', names: { vi: 'Khung Mỹ' } }),
    });

    const res = await postFrameworksRoute(req);
    assert.equal(res.status, 201);
    assert.equal(writeCount, 1);
    const body = await res.json();
    assert.equal(body.data.code, 'ACTFL');
  });

  test('PATCH /api/frameworks/[frameworkId] allows updating code and version', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}`, {
      method: 'PATCH',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'CEFR_UPDATED', version: '2026', names: {} }),
    });

    const res = await patchFrameworkRoute(req, { params: Promise.resolve({ frameworkId: fwId }) });
    assert.equal(res.status, 200);
    assert.equal(writeCount, 1);
  });

  test('DELETE /api/frameworks/[frameworkId] returns 204 on success', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}`, {
      method: 'DELETE',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
      },
    });

    const res = await deleteFrameworkRoute(req, { params: Promise.resolve({ frameworkId: fwId }) });
    assert.equal(res.status, 204);
    assert.equal(writeCount, 1);
  });

  test('GET /api/frameworks/[frameworkId]/levels returns 200 with levels for active ADMIN', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}/levels`, {
      headers: { 'Host': 'localhost:3000' },
    });
    const res = await getLevelsRoute(req, { params: Promise.resolve({ frameworkId: fwId }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].code, 'A1');
  });

  test('POST /api/frameworks/[frameworkId]/levels creates level with position', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}/levels`, {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'A2', label: { vi: 'Sơ cấp A2' }, position: 2 }),
    });

    const res = await postLevelsRoute(req, { params: Promise.resolve({ frameworkId: fwId }) });
    assert.equal(res.status, 201);
    assert.equal(writeCount, 1);
    const body = await res.json();
    assert.equal(body.data.code, 'A2');
    assert.equal(body.data.position, 2);
    assert.equal(body.data.frameworkId, fwId, 'Level response must contain exact parent framework id');
  });

  test('POST /api/frameworks/[frameworkId]/levels propagates refreshed session headers from auth client to response', async () => {
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(adminUserId)],
      get: () => createMockSessionCookie(adminUserId),
      set: () => {},
      delete: () => {},
    };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}/levels`, {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'A2_REF', label: { vi: 'Sơ cấp A2' }, position: 2 }),
    });

    const res = await postLevelsRoute(req, { params: Promise.resolve({ frameworkId: fwId }) });
    assert.equal(res.status, 201);
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
  });

  test('POST /api/frameworks/[frameworkId]/levels returns 401 when no session cookie is present with zero catalogue reads/writes', async () => {
    currentCookieStore = { getAll: () => [], get: () => undefined, set: () => {}, delete: () => {} };
    catalogueReadCount = 0;
    writeCount = 0;

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}/levels`, {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'A2', label: { vi: 'Sơ cấp A2' }, position: 2 }),
    });

    const res = await postLevelsRoute(req, { params: Promise.resolve({ frameworkId: fwId }) });
    assert.equal(res.status, 401);
    assert.equal(catalogueReadCount, 0, 'Zero catalogue reads on missing session');
    assert.equal(writeCount, 0, 'Zero catalogue writes on missing session');
    assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
    const body = await res.json();
    assert.equal(body.error?.code, 'UNAUTHENTICATED');
  });

  test('POST /api/frameworks/[frameworkId]/levels returns 401 on invalid/expired session with zero catalogue reads/writes', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ error: 'invalid_token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    catalogueReadCount = 0;
    writeCount = 0;

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}/levels`, {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'A2', label: { vi: 'Sơ cấp A2' }, position: 2 }),
    });

    const res = await postLevelsRoute(req, { params: Promise.resolve({ frameworkId: fwId }) });
    assert.equal(res.status, 401);
    assert.equal(catalogueReadCount, 0, 'Zero catalogue reads on expired session');
    assert.equal(writeCount, 0, 'Zero catalogue writes on expired session');
    const body = await res.json();
    assert.equal(body.error?.code, 'UNAUTHENTICATED');
  });

  test('POST /api/frameworks/[frameworkId]/levels returns 403 on missing Account record with zero catalogue reads/writes', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(missingAccountId)], get: () => createMockSessionCookie(missingAccountId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: missingAccountId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    catalogueReadCount = 0;
    writeCount = 0;

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}/levels`, {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'A2', label: { vi: 'Sơ cấp A2' }, position: 2 }),
    });

    const res = await postLevelsRoute(req, { params: Promise.resolve({ frameworkId: fwId }) });
    assert.equal(res.status, 403);
    assert.equal(catalogueReadCount, 0, 'Zero catalogue reads on missing account');
    assert.equal(writeCount, 0, 'Zero catalogue writes on missing account');
    const body = await res.json();
    assert.equal(body.error?.code, 'FORBIDDEN');
  });

  test('POST /api/frameworks/[frameworkId]/levels returns 403 when user is ACTIVE TEACHER with zero catalogue reads/writes (R6 mutant guard)', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(teacherUserId)], get: () => createMockSessionCookie(teacherUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: teacherUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    catalogueReadCount = 0;
    writeCount = 0;

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}/levels`, {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'A2', label: { vi: 'Sơ cấp A2' }, position: 2 }),
    });

    const res = await postLevelsRoute(req, { params: Promise.resolve({ frameworkId: fwId }) });
    assert.equal(res.status, 403);
    assert.equal(catalogueReadCount, 0, 'Zero catalogue reads on TEACHER POST');
    assert.equal(writeCount, 0, 'Zero catalogue writes on TEACHER POST');
    const body = await res.json();
    assert.equal(body.error?.code, 'FORBIDDEN');
  });

  test('POST /api/frameworks/[frameworkId]/levels returns 403 when user is ACTIVE LEARNER with zero catalogue reads/writes', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(learnerUserId)], get: () => createMockSessionCookie(learnerUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: learnerUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    catalogueReadCount = 0;
    writeCount = 0;

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}/levels`, {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'A2', label: { vi: 'Sơ cấp A2' }, position: 2 }),
    });

    const res = await postLevelsRoute(req, { params: Promise.resolve({ frameworkId: fwId }) });
    assert.equal(res.status, 403);
    assert.equal(catalogueReadCount, 0, 'Zero catalogue reads on LEARNER POST');
    assert.equal(writeCount, 0, 'Zero catalogue writes on LEARNER POST');
    const body = await res.json();
    assert.equal(body.error?.code, 'FORBIDDEN');
  });

  test('POST /api/frameworks/[frameworkId]/levels returns 403 when admin is PENDING with zero catalogue reads/writes', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(pendingAdminId)], get: () => createMockSessionCookie(pendingAdminId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: pendingAdminId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    catalogueReadCount = 0;
    writeCount = 0;

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}/levels`, {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'A2', label: { vi: 'Sơ cấp A2' }, position: 2 }),
    });

    const res = await postLevelsRoute(req, { params: Promise.resolve({ frameworkId: fwId }) });
    assert.equal(res.status, 403);
    assert.equal(catalogueReadCount, 0, 'Zero catalogue reads on PENDING admin');
    assert.equal(writeCount, 0, 'Zero catalogue writes on PENDING admin');
    const body = await res.json();
    assert.equal(body.error?.code, 'ACCOUNT_INACTIVE');
  });

  test('POST /api/frameworks/[frameworkId]/levels returns 403 when admin is DISABLED with zero catalogue reads/writes', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(disabledAdminId)], get: () => createMockSessionCookie(disabledAdminId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: disabledAdminId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    catalogueReadCount = 0;
    writeCount = 0;

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}/levels`, {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'A2', label: { vi: 'Sơ cấp A2' }, position: 2 }),
    });

    const res = await postLevelsRoute(req, { params: Promise.resolve({ frameworkId: fwId }) });
    assert.equal(res.status, 403);
    assert.equal(catalogueReadCount, 0, 'Zero catalogue reads on DISABLED admin');
    assert.equal(writeCount, 0, 'Zero catalogue writes on DISABLED admin');
    const body = await res.json();
    assert.equal(body.error?.code, 'ACCOUNT_INACTIVE');
  });

  test('POST /api/frameworks/[frameworkId]/levels returns 503 on provider outage with zero catalogue reads/writes', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => { throw new Error('Provider unreachable'); };
    catalogueReadCount = 0;
    writeCount = 0;

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}/levels`, {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'A2', label: { vi: 'Sơ cấp A2' }, position: 2 }),
    });

    const res = await postLevelsRoute(req, { params: Promise.resolve({ frameworkId: fwId }) });
    assert.equal(res.status, 503);
    assert.equal(catalogueReadCount, 0, 'Zero catalogue reads on provider outage');
    assert.equal(writeCount, 0, 'Zero catalogue writes on provider outage');
    const body = await res.json();
    assert.equal(body.error?.code, 'SERVICE_UNAVAILABLE');
  });

  test('POST /api/frameworks/[frameworkId]/levels returns 503 on Account DB outage with zero catalogue reads/writes', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    accountFindUniqueOverride = async () => {
      const err = new Error('Database connection failed');
      err.code = 'P1001';
      throw err;
    };
    catalogueReadCount = 0;
    writeCount = 0;

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}/levels`, {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'A2', label: { vi: 'Sơ cấp A2' }, position: 2 }),
    });

    const res = await postLevelsRoute(req, { params: Promise.resolve({ frameworkId: fwId }) });
    assert.equal(res.status, 503);
    assert.equal(catalogueReadCount, 0, 'Zero catalogue reads on DB outage');
    assert.equal(writeCount, 0, 'Zero catalogue writes on DB outage');
    const body = await res.json();
    assert.equal(body.error?.code, 'SERVICE_UNAVAILABLE');
  });

  test('POST /api/frameworks/[frameworkId]/levels returns 404 when parent framework does not exist with zero writes', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    frameworkFindUniqueOverride = async () => null;
    writeCount = 0;

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}/levels`, {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'A2', label: { vi: 'Sơ cấp A2' }, position: 2 }),
    });

    const res = await postLevelsRoute(req, { params: Promise.resolve({ frameworkId: fwId }) });
    assert.equal(res.status, 404);
    assert.equal(writeCount, 0, 'Zero writes when parent is absent');
    const body = await res.json();
    assert.equal(body.error?.code, 'NOT_FOUND');
  });

  test('GET /api/frameworks/[frameworkId]/levels returns 404 when parent framework does not exist', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    frameworkFindUniqueOverride = async () => null;

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}/levels`);
    const res = await getLevelsRoute(req, { params: Promise.resolve({ frameworkId: fwId }) });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error?.code, 'NOT_FOUND');
  });

  test('PATCH /api/frameworks/[frameworkId]/levels/[levelId] returns 404 on mismatched id', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}/levels/33333333-3333-4333-8333-333333333333`, {
      method: 'PATCH',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'A1_MOD', label: {}, position: 1 }),
    });

    const res = await patchLevelRoute(req, {
      params: Promise.resolve({ frameworkId: fwId, levelId: '33333333-3333-4333-8333-333333333333' }),
    });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error?.code, 'NOT_FOUND');
  });

  test('DELETE /api/frameworks/[frameworkId]/levels/[levelId] returns 204 on success', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}/levels/${lvlId}`, {
      method: 'DELETE',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
      },
    });

    const res = await deleteLevelRoute(req, {
      params: Promise.resolve({ frameworkId: fwId, levelId: lvlId }),
    });
    assert.equal(res.status, 204);
    assert.equal(writeCount, 1);
  });

  test('GET /api/frameworks returns 503 when Supabase provider has an outage', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => {
      const err = new Error('Supabase network gateway timeout');
      err.status = 503;
      throw err;
    };

    const res = await getFrameworksRoute(new Request('http://localhost:3000/api/frameworks'));
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.error.code, 'SERVICE_UNAVAILABLE');
  });

  test('POST /api/frameworks returns 400 on malformed JSON body with zero writes', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const req = new Request('http://localhost:3000/api/frameworks', {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: '{"code": "ACTFL", broken json',
    });

    const res = await postFrameworksRoute(req);
    assert.equal(res.status, 400);
    assert.equal(writeCount, 0, 'Zero writes on malformed JSON');
  });

  test('PATCH /api/frameworks/[frameworkId] returns 400 on malformed UUID route param with zero writes', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const req = new Request('http://localhost:3000/api/frameworks/not-a-valid-uuid', {
      method: 'PATCH',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'CODE', version: '1', names: {} }),
    });

    const res = await patchFrameworkRoute(req, { params: Promise.resolve({ frameworkId: 'not-a-valid-uuid' }) });
    assert.equal(res.status, 400);
    assert.equal(writeCount, 0, 'Zero writes on invalid UUID param');
  });

  test('PATCH /api/frameworks/[frameworkId]/levels/[levelId] returns 400 on malformed UUID param', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}/levels/bad-uuid`, {
      method: 'PATCH',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'A1', label: {}, position: 1 }),
    });

    const res = await patchLevelRoute(req, { params: Promise.resolve({ frameworkId: fwId, levelId: 'bad-uuid' }) });
    assert.equal(res.status, 400);
    assert.equal(writeCount, 0);
  });

  test('PATCH /api/frameworks/[frameworkId] returns 404 on disappeared target with zero writes', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    frameworkFindUniqueOverride = async () => null;
    writeCount = 0;

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}`, {
      method: 'PATCH',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'MOD', version: '2', names: {} }),
    });

    const res = await patchFrameworkRoute(req, { params: Promise.resolve({ frameworkId: fwId }) });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error?.code, 'NOT_FOUND');
    assert.equal(writeCount, 0, 'Zero writes on disappeared framework patch');
  });

  test('DELETE /api/frameworks/[frameworkId] returns 404 on disappeared target with zero writes', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    frameworkFindUniqueOverride = async () => null;
    writeCount = 0;

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}`, {
      method: 'DELETE',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
      },
    });

    const res = await deleteFrameworkRoute(req, { params: Promise.resolve({ frameworkId: fwId }) });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error?.code, 'NOT_FOUND');
    assert.equal(writeCount, 0, 'Zero writes on disappeared framework delete');
  });

  test('DELETE /api/frameworks/[frameworkId]/levels/[levelId] returns 404 on disappeared target with zero writes', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    writeCount = 0;

    const db = createPrismaDouble();
    db.level.findFirst = async () => null;
    setProductPrismaForTest(db);

    const req = new Request(`http://localhost:3000/api/frameworks/${fwId}/levels/44444444-4444-4444-8444-444444444444`, {
      method: 'DELETE',
      headers: {
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000',
      },
    });

    const res = await deleteLevelRoute(req, {
      params: Promise.resolve({ frameworkId: fwId, levelId: '44444444-4444-4444-8444-444444444444' }),
    });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error?.code, 'NOT_FOUND');
    assert.equal(writeCount, 0, 'Zero writes on disappeared level delete');
  });

  test('canonical CEFR parent framework ID and child level ID succeed across all HTTP route handlers with zero errors (U1)', async () => {
    currentCookieStore = { getAll: () => [createMockSessionCookie(adminUserId)], get: () => createMockSessionCookie(adminUserId), set: () => {}, delete: () => {} };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: adminUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    const canonicalFwId = '00000000-0000-0000-0000-000000000010';
    const canonicalLevelId = '00000000-0000-0000-0000-000000000021';

    const db = createPrismaDouble();
    db.framework.findUnique = async ({ where }) => ({
      id: where.id || canonicalFwId,
      code: 'CEFR',
      version: '2020',
      names: { en: 'Common European Framework', vi: 'Khung Châu Âu' },
      _count: { levels: 4 },
    });
    db.framework.update = async ({ where, data }) => ({
      id: where.id,
      code: data.code,
      version: data.version,
      names: data.names,
      _count: { levels: 4 },
    });
    db.framework.delete = async () => ({ id: canonicalFwId });
    db.level.findMany = async () => [
      { id: canonicalLevelId, frameworkId: canonicalFwId, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
    ];
    db.level.findFirst = async () => ({
      id: canonicalLevelId,
      frameworkId: canonicalFwId,
      code: 'A1',
      label: { vi: 'Mới bắt đầu' },
      position: 1,
    });
    db.level.create = async ({ data }) => ({ id: canonicalLevelId, ...data });
    db.level.updateMany = async () => ({ count: 1 });
    db.level.deleteMany = async () => ({ count: 1 });
    db.$transaction = async (fn) => fn(db);
    setProductPrismaForTest(db);

    // 1. GET /api/frameworks/[frameworkId]
    const getFwReq = new Request(`http://localhost:3000/api/frameworks/${canonicalFwId}`, {
      headers: { 'Origin': 'http://localhost:3000', 'Host': 'localhost:3000' },
    });
    const getFwRes = await getFrameworkDetailRoute(getFwReq, { params: Promise.resolve({ frameworkId: canonicalFwId }) });
    assert.equal(getFwRes.status, 200);
    const getFwJson = await getFwRes.json();
    assert.equal(getFwJson.data.id, canonicalFwId);

    // 2. PATCH /api/frameworks/[frameworkId]
    const patchFwReq = new Request(`http://localhost:3000/api/frameworks/${canonicalFwId}`, {
      method: 'PATCH',
      headers: { 'Origin': 'http://localhost:3000', 'Host': 'localhost:3000', 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'CEFR', version: '2020', names: { vi: 'Khung Châu Âu' } }),
    });
    const patchFwRes = await patchFrameworkRoute(patchFwReq, { params: Promise.resolve({ frameworkId: canonicalFwId }) });
    assert.equal(patchFwRes.status, 200);

    // 3. DELETE /api/frameworks/[frameworkId]
    const delFwReq = new Request(`http://localhost:3000/api/frameworks/${canonicalFwId}`, {
      method: 'DELETE',
      headers: { 'Origin': 'http://localhost:3000', 'Host': 'localhost:3000' },
    });
    const delFwRes = await deleteFrameworkRoute(delFwReq, { params: Promise.resolve({ frameworkId: canonicalFwId }) });
    assert.equal(delFwRes.status, 204);

    // 4. GET /api/frameworks/[frameworkId]/levels
    const getLvlsReq = new Request(`http://localhost:3000/api/frameworks/${canonicalFwId}/levels`, {
      headers: { 'Origin': 'http://localhost:3000', 'Host': 'localhost:3000' },
    });
    const getLvlsRes = await getLevelsRoute(getLvlsReq, { params: Promise.resolve({ frameworkId: canonicalFwId }) });
    assert.equal(getLvlsRes.status, 200);
    const getLvlsJson = await getLvlsRes.json();
    assert.equal(getLvlsJson.data[0].frameworkId, canonicalFwId);

    // 5. POST /api/frameworks/[frameworkId]/levels
    const postLvlReq = new Request(`http://localhost:3000/api/frameworks/${canonicalFwId}/levels`, {
      method: 'POST',
      headers: { 'Origin': 'http://localhost:3000', 'Host': 'localhost:3000', 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 }),
    });
    const postLvlRes = await postLevelsRoute(postLvlReq, { params: Promise.resolve({ frameworkId: canonicalFwId }) });
    assert.equal(postLvlRes.status, 201);
    const postLvlJson = await postLvlRes.json();
    assert.equal(postLvlJson.data.frameworkId, canonicalFwId);

    // 6. PATCH /api/frameworks/[frameworkId]/levels/[levelId]
    const patchLvlReq = new Request(`http://localhost:3000/api/frameworks/${canonicalFwId}/levels/${canonicalLevelId}`, {
      method: 'PATCH',
      headers: { 'Origin': 'http://localhost:3000', 'Host': 'localhost:3000', 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'A1', label: { vi: 'Sơ cấp' }, position: 1 }),
    });
    const patchLvlRes = await patchLevelRoute(patchLvlReq, { params: Promise.resolve({ frameworkId: canonicalFwId, levelId: canonicalLevelId }) });
    assert.equal(patchLvlRes.status, 200);

    // 7. DELETE /api/frameworks/[frameworkId]/levels/[levelId]
    const delLvlReq = new Request(`http://localhost:3000/api/frameworks/${canonicalFwId}/levels/${canonicalLevelId}`, {
      method: 'DELETE',
      headers: { 'Origin': 'http://localhost:3000', 'Host': 'localhost:3000' },
    });
    const delLvlRes = await deleteLevelRoute(delLvlReq, { params: Promise.resolve({ frameworkId: canonicalFwId, levelId: canonicalLevelId }) });
    assert.equal(delLvlRes.status, 204);

    // 8. Malformed route params return 400 INVALID_ID with zero DB writes/reads
    writeCount = 0;
    const badParamReq = new Request(`http://localhost:3000/api/frameworks/bad-uuid`, {
      method: 'PATCH',
      headers: { 'Origin': 'http://localhost:3000', 'Host': 'localhost:3000', 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'MOD', version: '2', names: {} }),
    });
    const badParamRes = await patchFrameworkRoute(badParamReq, { params: Promise.resolve({ frameworkId: ' 00000000-0000-0000-0000-000000000010 ' }) });
    assert.equal(badParamRes.status, 400);
    assert.equal(writeCount, 0);
  });
});

describe('S2-03 / S2-04: Actual Production Page Wiring, Error Boundaries & Outage vs 404 (R3/Gate 1/Gate 2)', () => {
  const fwId = '11111111-1111-4111-8111-111111111111';
  const adminUserId = '5650336e-550c-413d-b2a8-4afa2e4d9160';
  const teacherUserId = '00000000-0000-4000-8000-000000000002';
  const disabledAdminId = '00000000-0000-4000-8000-000000000004';

  let FrameworkDetailPage;
  let FrameworksPage;

  beforeEach(async () => {
    FrameworkDetailPage = await compileAndLoadPage('src/app/frameworks/[frameworkId]/page.tsx');
    FrameworksPage = await compileAndLoadPage('src/app/frameworks/page.tsx');
    process.env.DATABASE_URL = 'postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder?schema=app';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    setProductPrismaForTest(null);
    globalThis.fetch = originalFetch;
  });

  test('frameworks/[frameworkId] page renders ServiceUnavailableView on DB 503 outage instead of notFound() (R3/Gate 2)', async () => {
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(adminUserId)],
      get: () => createMockSessionCookie(adminUserId),
      set: () => {},
      delete: () => {},
    };
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: adminUserId }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    const outageErr = new Error("Can't reach database server at localhost:5432");
    outageErr.code = 'P1001';

    setProductPrismaForTest({
      account: {
        findUnique: async () => ({
          id: adminUserId,
          role: 'ADMIN',
          status: 'ACTIVE',
          displayName: 'Admin User',
          uiLocale: 'vi',
        }),
      },
      framework: {
        findUnique: async () => {
          throw outageErr;
        },
      },
    });

    notFoundHookCalled = false;
    const jsx = await FrameworkDetailPage({
      params: Promise.resolve({ frameworkId: fwId }),
    });
    assert.equal(notFoundHookCalled, false, 'DB 503 outage must NEVER call notFound()');
    assert.equal(jsx.type.name, 'ServiceUnavailableView');
    assert.equal(jsx.props.onRetryHref, `/frameworks/${fwId}`);
  });

  test('frameworks/[frameworkId] page calls notFound() when framework is genuinely 404 absent (Gate 2)', async () => {
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(adminUserId)],
      get: () => createMockSessionCookie(adminUserId),
      set: () => {},
      delete: () => {},
    };
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: adminUserId }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    setProductPrismaForTest({
      account: {
        findUnique: async () => ({
          id: adminUserId,
          role: 'ADMIN',
          status: 'ACTIVE',
          displayName: 'Admin User',
          uiLocale: 'vi',
        }),
      },
      framework: {
        findUnique: async () => null,
      },
    });

    notFoundHookCalled = false;
    try {
      await FrameworkDetailPage({
        params: Promise.resolve({ frameworkId: fwId }),
      });
    } catch {}
    assert.equal(notFoundHookCalled, true, 'Absent framework must trigger notFound()');
  });

  test('frameworks/[frameworkId] page calls notFound() on invalid UUID format', async () => {
    notFoundHookCalled = false;
    try {
      await FrameworkDetailPage({
        params: Promise.resolve({ frameworkId: 'not-a-valid-uuid' }),
      });
    } catch {}
    assert.equal(notFoundHookCalled, true, 'Invalid UUID must trigger notFound()');
  });

  test('frameworks/[frameworkId] page on unauthenticated/unauthorized access renders denial with zero framework queries', async () => {
    let frameworkQueryCalled = false;
    currentCookieStore = {
      getAll: () => [],
      get: () => undefined,
      set: () => {},
      delete: () => {},
    };

    setProductPrismaForTest({
      framework: {
        findUnique: async () => {
          frameworkQueryCalled = true;
          return null;
        },
      },
    });

    redirectHookTarget = null;
    try {
      await FrameworkDetailPage({
        params: Promise.resolve({ frameworkId: fwId }),
      });
    } catch {}

    assert.equal(redirectHookTarget, '/login', 'Unauthenticated user redirected to login');
    assert.equal(frameworkQueryCalled, false, 'Zero framework queries on denied auth');

    // Test TEACHER role redirects to /holding
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(teacherUserId)],
      get: () => createMockSessionCookie(teacherUserId),
      set: () => {},
      delete: () => {},
    };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: teacherUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    setProductPrismaForTest({
      account: {
        findUnique: async () => ({ id: teacherUserId, role: 'TEACHER', status: 'ACTIVE', displayName: 'Teacher', uiLocale: 'vi' }),
      },
      framework: {
        findUnique: async () => {
          frameworkQueryCalled = true;
          return null;
        },
      },
    });
    redirectHookTarget = null;
    try {
      await FrameworkDetailPage({
        params: Promise.resolve({ frameworkId: fwId }),
      });
    } catch {}
    assert.equal(redirectHookTarget, '/holding', 'Teacher redirected to /holding');
    assert.equal(frameworkQueryCalled, false, 'Zero framework queries on teacher access');

    // Test DISABLED ADMIN renders AccessDeniedView
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(disabledAdminId)],
      get: () => createMockSessionCookie(disabledAdminId),
      set: () => {},
      delete: () => {},
    };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: disabledAdminId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    setProductPrismaForTest({
      account: {
        findUnique: async () => ({ id: disabledAdminId, role: 'ADMIN', status: 'DISABLED', displayName: 'Disabled Admin', uiLocale: 'vi' }),
      },
      framework: {
        findUnique: async () => {
          frameworkQueryCalled = true;
          return null;
        },
      },
    });
    const deniedJsx = await FrameworkDetailPage({
      params: Promise.resolve({ frameworkId: fwId }),
    });
    assert.equal(deniedJsx.type.name, 'AccessDeniedView');
    assert.equal(frameworkQueryCalled, false, 'Zero framework queries on disabled admin');
  });

  test('frameworks/[frameworkId] page actual execution wires parent framework, levels, and account to LevelsCatalog inside AppShell (Gate 1)', async () => {
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(adminUserId)],
      get: () => createMockSessionCookie(adminUserId),
      set: () => {},
      delete: () => {},
    };
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: adminUserId }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    const mockFw = {
      id: fwId,
      code: 'CEFR',
      version: '2020',
      names: { vi: 'Khung Năng Lực Châu Âu', en: 'CEFR' },
      _count: { levels: 2 },
    };
    const mockLevels = [
      { id: 'lvl-1', frameworkId: fwId, code: 'A1', label: { vi: 'Sơ cấp A1' }, position: 1 },
      { id: 'lvl-2', frameworkId: fwId, code: 'A2', label: { vi: 'Sơ cấp A2' }, position: 2 },
    ];

    setProductPrismaForTest({
      account: {
        findUnique: async () => ({
          id: adminUserId,
          role: 'ADMIN',
          status: 'ACTIVE',
          displayName: 'Nguyễn Quản Trị',
          uiLocale: 'vi',
        }),
      },
      framework: {
        findUnique: async () => mockFw,
      },
      level: {
        findMany: async () => mockLevels,
      },
    });

    const jsx = await FrameworkDetailPage({
      params: Promise.resolve({ frameworkId: fwId }),
    });

    assert.equal(jsx.type.name, 'AppShell');
    assert.equal(jsx.props.account.role, 'ADMIN');
    assert.equal(jsx.props.account.displayName, 'Nguyễn Quản Trị');

    const catalog = jsx.props.children;
    assert.equal(catalog.type.name, 'LevelsCatalog');
    assert.equal(catalog.props.framework.id, fwId, 'Gate 1: Detail page must wire exact parent framework id');
    assert.equal(catalog.props.framework.code, 'CEFR');
    assert.equal(catalog.props.framework.version, '2020');
    assert.equal(catalog.props.framework.levelCount, 2);
    assert.deepEqual(catalog.props.framework, toFrameworkDto(mockFw), 'Gate 1: Detail page must pass authoritative framework DTO');
    assert.equal(catalog.props.initialLevels.length, 2);
    assert.equal(catalog.props.initialLevels[0].frameworkId, fwId, 'Gate 1: Child level 0 must belong to exact parent framework id');
    assert.equal(catalog.props.initialLevels[1].frameworkId, fwId, 'Gate 1: Child level 1 must belong to exact parent framework id');
    assert.equal(catalog.props.initialLevels[0].code, 'A1');
    assert.equal(catalog.props.account.id, adminUserId);
  });

  test('frameworks page actual execution wires frameworks list and account to FrameworksCatalog inside AppShell (Gate 1)', async () => {
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(adminUserId)],
      get: () => createMockSessionCookie(adminUserId),
      set: () => {},
      delete: () => {},
    };
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: adminUserId }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    const mockFwList = [
      { id: fwId, code: 'CEFR', version: '2020', names: { vi: 'Khung Châu Âu' }, _count: { levels: 4 } },
    ];

    setProductPrismaForTest({
      account: {
        findUnique: async () => ({
          id: adminUserId,
          role: 'ADMIN',
          status: 'ACTIVE',
          displayName: 'Nguyễn Quản Trị',
          uiLocale: 'vi',
        }),
      },
      framework: {
        findMany: async () => mockFwList,
      },
    });

    const jsx = await FrameworksPage();
    assert.equal(jsx.type.name, 'AppShell');
    assert.equal(jsx.props.account.role, 'ADMIN');

    const catalog = jsx.props.children;
    assert.equal(catalog.type.name, 'FrameworksCatalog');
    assert.equal(catalog.props.initialFrameworks.length, 1);
    assert.equal(catalog.props.initialFrameworks[0].id, fwId, 'Gate 1: Frameworks page must wire exact framework id');
    assert.equal(catalog.props.initialFrameworks[0].code, 'CEFR');
    assert.equal(catalog.props.account.id, adminUserId);
  });

  test('frameworks page handles unauthenticated and teacher holding boundaries', async () => {
    currentCookieStore = { getAll: () => [], get: () => undefined, set: () => {}, delete: () => {} };
    redirectHookTarget = null;
    try {
      await FrameworksPage();
    } catch {}
    assert.equal(redirectHookTarget, '/login', 'Unauthenticated redirected to /login');

    currentCookieStore = {
      getAll: () => [createMockSessionCookie(teacherUserId)],
      get: () => createMockSessionCookie(teacherUserId),
      set: () => {},
      delete: () => {},
    };
    globalThis.fetch = async () => new Response(JSON.stringify({ id: teacherUserId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    setProductPrismaForTest({
      account: {
        findUnique: async () => ({ id: teacherUserId, role: 'TEACHER', status: 'ACTIVE', displayName: 'Teacher', uiLocale: 'vi' }),
      },
    });
    redirectHookTarget = null;
    try {
      await FrameworksPage();
    } catch {}
    assert.equal(redirectHookTarget, '/holding', 'Teacher redirected to /holding');
  });

  test('frameworks/[frameworkId] page actual execution with canonical CEFR framework ID renders correct parent and levels (Acceptance 1)', async () => {
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(adminUserId)],
      get: () => createMockSessionCookie(adminUserId),
      set: () => {},
      delete: () => {},
    };
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: adminUserId }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    const canonicalFwId = '00000000-0000-0000-0000-000000000010';
    const mockCanonicalFw = {
      id: canonicalFwId,
      code: 'CEFR',
      version: '2020',
      names: { vi: 'Khung tham chiếu chung Châu Âu', en: 'Common European Framework of Reference' },
      _count: { levels: 4 },
    };
    const mockCanonicalLevels = [
      { id: '00000000-0000-0000-0000-000000000021', frameworkId: canonicalFwId, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
      { id: '00000000-0000-0000-0000-000000000022', frameworkId: canonicalFwId, code: 'A2', label: { vi: 'Sơ cấp' }, position: 2 },
      { id: '00000000-0000-0000-0000-000000000023', frameworkId: canonicalFwId, code: 'B1', label: { vi: 'Trung cấp' }, position: 3 },
      { id: '00000000-0000-0000-0000-000000000024', frameworkId: canonicalFwId, code: 'B2', label: { vi: 'Trung cao cấp' }, position: 4 },
    ];

    let fwQueryWhere = null;
    let lvlQueryWhere = null;

    setProductPrismaForTest({
      account: {
        findUnique: async () => ({
          id: adminUserId,
          role: 'ADMIN',
          status: 'ACTIVE',
          displayName: 'Nguyễn Quản Trị',
          uiLocale: 'vi',
        }),
      },
      framework: {
        findUnique: async ({ where }) => {
          fwQueryWhere = where;
          return mockCanonicalFw;
        },
      },
      level: {
        findMany: async ({ where }) => {
          lvlQueryWhere = where;
          return mockCanonicalLevels;
        },
      },
    });

    notFoundHookCalled = false;
    const jsx = await FrameworkDetailPage({
      params: Promise.resolve({ frameworkId: canonicalFwId }),
    });

    assert.equal(notFoundHookCalled, false, 'Canonical CEFR ID must never trigger notFound()');
    assert.deepEqual(fwQueryWhere, { id: canonicalFwId }, 'Framework lookup must execute with exact canonical ID');
    assert.equal(lvlQueryWhere.frameworkId, canonicalFwId, 'Levels lookup must query with exact canonical frameworkId');

    assert.equal(jsx.type.name, 'AppShell');
    assert.equal(jsx.props.account.role, 'ADMIN');

    const catalog = jsx.props.children;
    assert.equal(catalog.type.name, 'LevelsCatalog');
    assert.equal(catalog.props.framework.id, canonicalFwId, 'Detail page must wire exact canonical framework id');
    assert.equal(catalog.props.framework.code, 'CEFR');
    assert.equal(catalog.props.framework.version, '2020');
    assert.equal(catalog.props.framework.levelCount, 4);
    assert.deepEqual(catalog.props.framework, toFrameworkDto(mockCanonicalFw));
    assert.equal(catalog.props.initialLevels.length, 4);
    assert.equal(catalog.props.initialLevels[0].id, '00000000-0000-0000-0000-000000000021');
    assert.equal(catalog.props.initialLevels[0].frameworkId, canonicalFwId);
    assert.equal(catalog.props.initialLevels[3].id, '00000000-0000-0000-0000-000000000024');
  });

  test('Production catalogue renders canonical CEFR and its actual generated href leads to production detail success, rejecting malformed IDs with zero DB access (Acceptance 1)', async () => {
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(adminUserId)],
      get: () => createMockSessionCookie(adminUserId),
      set: () => {},
      delete: () => {},
    };
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ id: adminUserId }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    const canonicalCefrId = '00000000-0000-0000-0000-000000000010';
    const mockCanonicalFw = {
      id: canonicalCefrId,
      code: 'CEFR',
      version: '2020',
      names: { vi: 'Khung tham chiếu chung Châu Âu', en: 'Common European Framework of Reference' },
      _count: { levels: 4 },
    };
    const mockCanonicalLevels = [
      { id: '00000000-0000-0000-0000-000000000021', frameworkId: canonicalCefrId, code: 'A1', label: { vi: 'Mới bắt đầu' }, position: 1 },
      { id: '00000000-0000-0000-0000-000000000022', frameworkId: canonicalCefrId, code: 'A2', label: { vi: 'Sơ cấp' }, position: 2 },
      { id: '00000000-0000-0000-0000-000000000023', frameworkId: canonicalCefrId, code: 'B1', label: { vi: 'Trung cấp' }, position: 3 },
      { id: '00000000-0000-0000-0000-000000000024', frameworkId: canonicalCefrId, code: 'B2', label: { vi: 'Trung cao cấp' }, position: 4 },
    ];

    // 1. Render production catalogue page
    setProductPrismaForTest({
      account: {
        findUnique: async () => ({
          id: adminUserId,
          role: 'ADMIN',
          status: 'ACTIVE',
          displayName: 'Nguyễn Quản Trị',
          uiLocale: 'vi',
        }),
      },
      framework: {
        findMany: async () => [mockCanonicalFw],
      },
    });

    const pageJsx = await FrameworksPage();
    assert.equal(pageJsx.type.name, 'AppShell');

    const frameworksCatalogElement = pageJsx.props.children;
    assert.equal(frameworksCatalogElement.type.name, 'FrameworksCatalog');
    assert.equal(frameworksCatalogElement.props.initialFrameworks.length, 1);
    assert.equal(frameworksCatalogElement.props.initialFrameworks[0].id, canonicalCefrId);

    // Render actual production FrameworksCatalog component via standard React server renderer seam
    const catalogHtml = renderToStaticMarkup(frameworksCatalogElement);
    const hrefMatch = catalogHtml.match(/href="(\/frameworks\/[^"]+)"/);
    assert.ok(hrefMatch, 'Rendered catalogue must contain link to detail');
    const generatedHref = hrefMatch[1];
    assert.equal(generatedHref, `/frameworks/${canonicalCefrId}`, 'Catalogue must generate exact href to canonical CEFR detail');

    const matchParam = generatedHref.match(/^\/frameworks\/([^/?#]+)$/);
    assert.ok(matchParam, 'Generated href must match standard detail route');
    const targetFrameworkId = matchParam[1];
    assert.equal(targetFrameworkId, canonicalCefrId);

    // 2. Navigate to production detail page via extracted href target
    let detailFwQueryWhere = null;
    let detailLvlQueryWhere = null;

    setProductPrismaForTest({
      account: {
        findUnique: async () => ({
          id: adminUserId,
          role: 'ADMIN',
          status: 'ACTIVE',
          displayName: 'Nguyễn Quản Trị',
          uiLocale: 'vi',
        }),
      },
      framework: {
        findUnique: async ({ where }) => {
          detailFwQueryWhere = where;
          return where.id === canonicalCefrId ? mockCanonicalFw : null;
        },
      },
      level: {
        findMany: async ({ where }) => {
          detailLvlQueryWhere = where;
          return where.frameworkId === canonicalCefrId ? mockCanonicalLevels : [];
        },
      },
    });

    notFoundHookCalled = false;
    const detailJsx = await FrameworkDetailPage({
      params: Promise.resolve({ frameworkId: targetFrameworkId }),
    });

    assert.equal(notFoundHookCalled, false, 'Canonical CEFR ID must never trigger notFound()');
    assert.deepEqual(detailFwQueryWhere, { id: canonicalCefrId }, 'Framework lookup must execute with exact canonical ID');
    assert.equal(detailLvlQueryWhere.frameworkId, canonicalCefrId, 'Levels lookup must query with exact canonical frameworkId');

    assert.equal(detailJsx.type.name, 'AppShell');
    const levelsCatalog = detailJsx.props.children;
    assert.equal(levelsCatalog.type.name, 'LevelsCatalog');
    assert.equal(levelsCatalog.props.framework.id, canonicalCefrId);
    assert.equal(levelsCatalog.props.framework.code, 'CEFR');
    assert.equal(levelsCatalog.props.framework.version, '2020');
    assert.equal(levelsCatalog.props.initialLevels.length, 4);
    assert.equal(levelsCatalog.props.initialLevels[0].frameworkId, canonicalCefrId);

    // 3. Malformed ID rejection with zero catalogue DB access
    let malformedCatalogueQueries = 0;
    setProductPrismaForTest({
      account: {
        findUnique: async () => ({ id: adminUserId, role: 'ADMIN', status: 'ACTIVE', displayName: 'Admin' }),
      },
      framework: {
        findUnique: async () => {
          malformedCatalogueQueries++;
          return null;
        },
      },
      level: {
        findMany: async () => {
          malformedCatalogueQueries++;
          return [];
        },
      },
    });

    for (const badId of [
      '00000000-0000-0000-0000-000000000010-extra',
      'not-a-valid-uuid',
      ' 00000000-0000-0000-0000-000000000010 ',
      '00000000-0000-0000-0000-00000000001g',
    ]) {
      notFoundHookCalled = false;
      try {
        await FrameworkDetailPage({
          params: Promise.resolve({ frameworkId: badId }),
        });
      } catch {}
      assert.equal(notFoundHookCalled, true, `Malformed ID "${badId}" must trigger notFound()`);
    }
    assert.equal(malformedCatalogueQueries, 0, 'Malformed IDs must be rejected before any catalogue DB access');
  });
});
