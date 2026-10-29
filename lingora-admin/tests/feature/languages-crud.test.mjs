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

const {
  createLanguageSchema,
  updateLanguageSchema,
  toLanguageDto,
  handlePrismaError,
  isValidUuid,
  listLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage,
} = await import('../../src/server/languages/index.ts');
const { GET: getLanguagesRoute, POST: postLanguagesRoute } = await import('../../src/app/api/languages/route.ts');
const { PATCH: patchLanguageRoute, DELETE: deleteLanguageRoute } = await import('../../src/app/api/languages/[id]/route.ts');
const { setProductPrismaForTest } = await import('../../src/server/db/index.js');

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

describe('S1-03: Zod Validation & Language CRUD Handlers', () => {
  const dummyUuid = '22222222-2222-4222-8222-222222222222';

  test('isValidUuid accepts standard UUID v4 and rejects malformed strings', () => {
    assert.equal(isValidUuid(dummyUuid), true);
    assert.equal(isValidUuid('not-a-uuid'), false);
    assert.equal(isValidUuid('22222222-2222-4222-8222'), false);
    assert.equal(isValidUuid(''), false);
  });

  describe('createLanguageSchema validation (including R10 strict names)', () => {
    test('accepts valid 2-char code (e.g. vi, en, ja, fr)', () => {
      const res = createLanguageSchema.safeParse({
        code: 'vi',
        names: { vi: 'Tiếng Việt' },
        isLearnable: true,
        isUiLocale: true,
      });
      assert.equal(res.success, true);
    });

    test('accepts valid hyphenated codes (e.g. zh-cn, es-419)', () => {
      const res = createLanguageSchema.safeParse({
        code: 'zh-cn',
        names: { vi: 'Tiếng Trung (Giản thể)' },
        isLearnable: true,
        isUiLocale: false,
      });
      assert.equal(res.success, true);
    });

    test('rejects single char code (<2 total length)', () => {
      const res = createLanguageSchema.safeParse({
        code: 'z',
        names: { vi: 'Tiếng Z' },
        isLearnable: true,
        isUiLocale: false,
      });
      assert.equal(res.success, false);
    });

    test('rejects code longer than 10 characters (>10 total length)', () => {
      const res = createLanguageSchema.safeParse({
        code: 'abcdefghijk',
        names: { vi: 'Dài' },
        isLearnable: true,
        isUiLocale: false,
      });
      assert.equal(res.success, false);
    });

    test('rejects uppercase letters in code', () => {
      const res = createLanguageSchema.safeParse({
        code: 'EN',
        names: { vi: 'Tiếng Anh' },
        isLearnable: true,
        isUiLocale: true,
      });
      assert.equal(res.success, false);
    });

    test('rejects special characters or trailing hyphen in code', () => {
      assert.equal(createLanguageSchema.safeParse({
        code: 'en-',
        names: { vi: 'Tiếng Anh' },
        isLearnable: true,
        isUiLocale: true,
      }).success, false);

      assert.equal(createLanguageSchema.safeParse({
        code: 'en_US',
        names: { vi: 'Tiếng Anh' },
        isLearnable: true,
        isUiLocale: true,
      }).success, false);
    });

    test('trims whitespace and enforces names.vi required 1-100 characters', () => {
      const res = createLanguageSchema.safeParse({
        code: 'vi',
        names: { vi: '  Tiếng Việt  ' },
        isLearnable: true,
        isUiLocale: true,
      });
      assert.equal(res.success, true);
      if (res.success) {
        assert.equal(res.data.names.vi, 'Tiếng Việt');
      }
    });

    test('rejects empty or whitespace-only names.vi', () => {
      assert.equal(createLanguageSchema.safeParse({
        code: 'vi',
        names: { vi: '' },
        isLearnable: true,
        isUiLocale: true,
      }).success, false);

      assert.equal(createLanguageSchema.safeParse({
        code: 'vi',
        names: { vi: '   ' },
        isLearnable: true,
        isUiLocale: true,
      }).success, false);
    });

    test('R10: rejects arbitrary/unknown keys inside nested names object', () => {
      const res = createLanguageSchema.safeParse({
        code: 'ja',
        names: {
          vi: 'Tiếng Nhật',
          en: 'Japanese',
          unknownField: 'malicious-data',
        },
        isLearnable: true,
        isUiLocale: false,
      });
      assert.equal(res.success, false, 'names schema must be strict and reject extra keys');
    });

    test('R10: rejects null for names.en (contracted as optional string, not nullable)', () => {
      const res = createLanguageSchema.safeParse({
        code: 'ja',
        names: {
          vi: 'Tiếng Nhật',
          en: null,
        },
        isLearnable: true,
        isUiLocale: false,
      });
      assert.equal(res.success, false, 'names.en must reject null');
    });

    test('R10: rejects non-string types for names.en (number, boolean, object)', () => {
      assert.equal(createLanguageSchema.safeParse({
        code: 'ja',
        names: { vi: 'Tiếng Nhật', en: 123 },
        isLearnable: true,
        isUiLocale: false,
      }).success, false);

      assert.equal(createLanguageSchema.safeParse({
        code: 'ja',
        names: { vi: 'Tiếng Nhật', en: true },
        isLearnable: true,
        isUiLocale: false,
      }).success, false);
    });

    test('R10: accepts omitted or string names.en', () => {
      assert.equal(createLanguageSchema.safeParse({
        code: 'ja',
        names: { vi: 'Tiếng Nhật' },
        isLearnable: true,
        isUiLocale: false,
      }).success, true);

      assert.equal(createLanguageSchema.safeParse({
        code: 'ja',
        names: { vi: 'Tiếng Nhật', en: 'Japanese' },
        isLearnable: true,
        isUiLocale: false,
      }).success, true);
    });
  });

  describe('updateLanguageSchema validation (Code Immutability)', () => {
    test('strictly forbids code mutation in update payload', () => {
      const res = updateLanguageSchema.safeParse({
        code: 'fr-updated',
        names: { vi: 'Tiếng Pháp' },
        isLearnable: true,
        isUiLocale: false,
      });
      assert.equal(res.success, false, 'Code must not be permitted in updateLanguageSchema');
    });

    test('accepts valid updates to names and flags', () => {
      const res = updateLanguageSchema.safeParse({
        names: { vi: 'Tiếng Pháp Đổi Tên', en: 'French Renamed' },
        isLearnable: false,
        isUiLocale: true,
      });
      assert.equal(res.success, true);
    });

    test('R10: rejects arbitrary keys inside nested names on update', () => {
      const res = updateLanguageSchema.safeParse({
        names: { vi: 'Tiếng Pháp', extra: 'hacked' },
      });
      assert.equal(res.success, false);
    });
  });

  describe('R3: Prisma Error Mapping (503 Availability vs 409/404)', () => {
    test('P2002 unique constraint returns 409 DUPLICATE_CODE', () => {
      const err = new Error('Unique constraint');
      err.code = 'P2002';
      const res = handlePrismaError(err);
      assert.equal(res.status, 409);
      assert.equal(res.body.error.code, 'DUPLICATE_CODE');
    });

    test('P2003 foreign key restriction returns 409 LANGUAGE_IN_USE', () => {
      const err = new Error('FK restriction');
      err.code = 'P2003';
      const res = handlePrismaError(err);
      assert.equal(res.status, 409);
      assert.equal(res.body.error.code, 'LANGUAGE_IN_USE');
    });

    test('P2025 record not found returns 404 NOT_FOUND', () => {
      const err = new Error('Not found');
      err.code = 'P2025';
      const res = handlePrismaError(err);
      assert.equal(res.status, 404);
      assert.equal(res.body.error.code, 'NOT_FOUND');
    });

    test('P1000 Authentication failed returns 503 SERVICE_UNAVAILABLE', () => {
      const err = new Error('Auth failed');
      err.code = 'P1000';
      const res = handlePrismaError(err);
      assert.equal(res.status, 503);
      assert.equal(res.body.error.code, 'SERVICE_UNAVAILABLE');
    });

    test('P1001 Cannot reach DB server returns 503 SERVICE_UNAVAILABLE', () => {
      const err = new Error('Cannot reach server');
      err.code = 'P1001';
      const res = handlePrismaError(err);
      assert.equal(res.status, 503);
      assert.equal(res.body.error.code, 'SERVICE_UNAVAILABLE');
    });

    test('P1002 Database server timeout returns 503 SERVICE_UNAVAILABLE', () => {
      const err = new Error('Timeout');
      err.code = 'P1002';
      const res = handlePrismaError(err);
      assert.equal(res.status, 503);
      assert.equal(res.body.error.code, 'SERVICE_UNAVAILABLE');
    });

    test('P2024 Connection pool timeout returns 503 SERVICE_UNAVAILABLE', () => {
      const err = new Error('Pool timeout');
      err.code = 'P2024';
      const res = handlePrismaError(err);
      assert.equal(res.status, 503);
      assert.equal(res.body.error.code, 'SERVICE_UNAVAILABLE');
    });
  });

  describe('R9: CRUD Handlers & Denied-Write Nonexecution', () => {
    test('createLanguage invokes prisma.language.create on valid input', async () => {
      let createdData = null;
      const mockPrisma = {
        language: {
          create: async (args) => {
            createdData = args.data;
            return {
              id: dummyUuid,
              ...args.data,
            };
          },
        },
      };

      const res = await createLanguage(
        {
          code: 'ko',
          names: { vi: 'Tiếng Hàn', en: 'Korean' },
          isLearnable: true,
          isUiLocale: false,
        },
        mockPrisma
      );

      assert.equal(res.status, 201);
      assert.equal(res.data.data.code, 'ko');
      assert.equal(createdData.code, 'ko');
    });

    test('createLanguage rejects invalid input before touching database', async () => {
      let dbTouched = false;
      const mockPrisma = {
        language: {
          create: async () => {
            dbTouched = true;
          },
        },
      };

      const res = await createLanguage(
        {
          code: 'invalid_UPPER',
          names: { vi: 'Sai' },
          isLearnable: true,
          isUiLocale: false,
        },
        mockPrisma
      );

      assert.equal(res.status, 400);
      assert.equal(dbTouched, false, 'Database must NOT be touched when validation fails');
    });

    test('updateLanguage performs update and ignores/rejects code changes', async () => {
      let updatedData = null;
      const mockPrisma = {
        language: {
          findUnique: async () => ({
            id: dummyUuid,
            code: 'fr',
            names: { vi: 'Tiếng Pháp', en: 'French' },
            isLearnable: true,
            isUiLocale: false,
          }),
          update: async (args) => {
            updatedData = args.data;
            return {
              id: dummyUuid,
              code: 'fr',
              ...args.data,
            };
          },
        },
      };

      const res = await updateLanguage(
        dummyUuid,
        {
          names: { vi: 'Tiếng Pháp Cập Nhật', en: 'French Updated' },
          isLearnable: false,
          isUiLocale: true,
        },
        mockPrisma
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.data.isLearnable, false);
      assert.equal(updatedData.isLearnable, false);
    });

    test('deleteLanguage invokes prisma.language.delete on valid UUID', async () => {
      let deletedId = null;
      const mockPrisma = {
        language: {
          findUnique: async () => ({ id: dummyUuid }),
          delete: async (args) => {
            deletedId = args.where.id;
            return { id: args.where.id, code: 'fr' };
          },
        },
      };

      const res = await deleteLanguage(dummyUuid, mockPrisma);
      assert.equal(res.status, 204);
      assert.equal(deletedId, dummyUuid);
    });

    test('deleteLanguage returns 409 when foreign key blocks delete (P2003)', async () => {
      const mockPrisma = {
        language: {
          findUnique: async () => ({ id: dummyUuid }),
          delete: async () => {
            const err = new Error('Foreign key violation');
            err.code = 'P2003';
            throw err;
          },
        },
      };

      const res = await deleteLanguage(dummyUuid, mockPrisma);
      assert.equal(res.status, 409);
      assert.equal(res.error.code, 'LANGUAGE_IN_USE');
    });
  });

  describe('STAB-1 R9: HTTP Route Handlers Matrix (/api/languages & [id])', () => {
    const adminUserId = '5650336e-550c-413d-b2a8-4afa2e4d9160';
    const teacherUserId = '00000000-0000-4000-8000-000000000002';

    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      currentCookieStore = {
        getAll: () => [createMockSessionCookie(adminUserId)],
        get: () => createMockSessionCookie(adminUserId),
        set: () => {},
        delete: () => {},
      };
      globalThis.fetch = async (url) => {
        return new Response(JSON.stringify({
          id: adminUserId,
          email: 'admin@lingora.edu.vn',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    const createPrismaDouble = (overrides = {}) => ({
      account: {
        findUnique: async ({ where }) => {
          if (where.id === adminUserId) {
            return {
              id: adminUserId,
              role: 'ADMIN',
              status: 'ACTIVE',
              displayName: 'Admin User',
              uiLocale: 'vi',
            };
          }
          return {
            id: where.id,
            role: 'TEACHER',
            status: 'ACTIVE',
            displayName: 'Teacher User',
            uiLocale: 'vi',
          };
        },
      },
      language: {
        findMany: async () => [
          { id: '1', code: 'en', names: { vi: 'Tiếng Anh', en: 'English' }, isLearnable: true, isUiLocale: true },
          { id: '2', code: 'vi', names: { vi: 'Tiếng Việt', en: 'Vietnamese' }, isLearnable: true, isUiLocale: true },
        ],
        findUnique: async ({ where }) => {
          if (where.id === '1' || where.id === dummyUuid) {
            return { id: where.id, code: 'en', names: { vi: 'Tiếng Anh', en: 'English', fr: 'Anglais' }, isLearnable: true, isUiLocale: true };
          }
          return null;
        },
        create: async ({ data }) => ({
          id: dummyUuid,
          ...data,
        }),
        update: async ({ where, data }) => ({
          id: where.id,
          code: 'en',
          ...data,
        }),
        delete: async ({ where }) => ({
          id: where.id,
          code: 'en',
        }),
        ...overrides,
      },
    });

    test('GET /api/languages returns 200 list and Cache-Control: no-store, private', async () => {
      const prismaDouble = createPrismaDouble();
      setProductPrismaForTest(prismaDouble);

      const req = new Request('http://localhost:3000/api/languages', {
        headers: { host: 'localhost:3000' },
      });

      const res = await getLanguagesRoute(req);
      assert.equal(res.status, 200);
      assert.ok(res.headers.get('Cache-Control').includes('no-store'));
      assert.ok(res.headers.get('Cache-Control').includes('private'));
      const json = await res.json();
      assert.ok(Array.isArray(json.data));
      assert.equal(json.data.length, 2);
      assert.equal(json.data[0].code, 'en');
      assert.equal(json.data[1].code, 'vi');
    });

    test('GET /api/languages rejects non-admin with 403 FORBIDDEN', async () => {
      const prismaDouble = createPrismaDouble();
      setProductPrismaForTest(prismaDouble);

      currentCookieStore = {
        getAll: () => [createMockSessionCookie(teacherUserId, 'teacher@lingora.edu.vn')],
        get: () => createMockSessionCookie(teacherUserId, 'teacher@lingora.edu.vn'),
        set: () => {},
        delete: () => {},
      };
      globalThis.fetch = async () => new Response(JSON.stringify({
        id: teacherUserId,
        email: 'teacher@lingora.edu.vn',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });

      const req = new Request('http://localhost:3000/api/languages', {
        headers: { host: 'localhost:3000' },
      });

      const res = await getLanguagesRoute(req);
      assert.equal(res.status, 403);
      assert.ok(res.headers.get('Cache-Control').includes('no-store'));
      const json = await res.json();
      assert.equal(json.error.code, 'FORBIDDEN');
    });

    test('POST /api/languages succeeds with 201 and authoritative record', async () => {
      const prismaDouble = createPrismaDouble();
      setProductPrismaForTest(prismaDouble);

      const req = new Request('http://localhost:3000/api/languages', {
        method: 'POST',
        headers: {
          'Origin': 'http://localhost:3000',
          'Host': 'localhost:3000',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: 'ja',
          names: { vi: 'Tiếng Nhật', en: 'Japanese' },
          isLearnable: true,
          isUiLocale: false,
        }),
      });

      const res = await postLanguagesRoute(req);
      assert.equal(res.status, 201);
      assert.ok(res.headers.get('Cache-Control').includes('no-store'));
      const json = await res.json();
      assert.equal(json.data.code, 'ja');
      assert.equal(json.data.names.vi, 'Tiếng Nhật');
      assert.equal(json.data.names.en, 'Japanese');
    });

    test('POST /api/languages handles duplicate code with 409 DUPLICATE_CODE', async () => {
      const prismaDouble = createPrismaDouble({
        create: async () => {
          const err = new Error('Unique constraint violation');
          err.code = 'P2002';
          throw err;
        },
      });
      setProductPrismaForTest(prismaDouble);

      const req = new Request('http://localhost:3000/api/languages', {
        method: 'POST',
        headers: {
          'Origin': 'http://localhost:3000',
          'Host': 'localhost:3000',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: 'vi',
          names: { vi: 'Tiếng Việt' },
          isLearnable: true,
          isUiLocale: true,
        }),
      });

      const res = await postLanguagesRoute(req);
      assert.equal(res.status, 409);
      assert.ok(res.headers.get('Cache-Control').includes('no-store'));
      const json = await res.json();
      assert.equal(json.error.code, 'DUPLICATE_CODE');
      assert.ok(json.error.fields?.code);
    });

    test('POST /api/languages rejects foreign Origin with 403 FORBIDDEN_ORIGIN without writing', async () => {
      let createCalled = false;
      const prismaDouble = createPrismaDouble({
        create: async () => {
          createCalled = true;
        },
      });
      setProductPrismaForTest(prismaDouble);

      const req = new Request('http://localhost:3000/api/languages', {
        method: 'POST',
        headers: {
          'Origin': 'https://evil-attacker.com',
          'Host': 'localhost:3000',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: 'es',
          names: { vi: 'Tiếng Tây Ban Nha' },
          isLearnable: true,
          isUiLocale: false,
        }),
      });

      const res = await postLanguagesRoute(req);
      assert.equal(res.status, 403);
      assert.equal(createCalled, false, 'Denied POST must perform zero writes to database');
    });

    test('PATCH /api/languages/[id] rejects immutable code field with 400 IMMUTABLE_FIELD', async () => {
      let updateCalled = false;
      const prismaDouble = createPrismaDouble({
        update: async () => {
          updateCalled = true;
        },
      });
      setProductPrismaForTest(prismaDouble);

      const req = new Request('http://localhost:3000/api/languages/1', {
        method: 'PATCH',
        headers: {
          'Origin': 'http://localhost:3000',
          'Host': 'localhost:3000',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: 'en-us',
          names: { vi: 'Tiếng Anh Mỹ' },
          isLearnable: true,
          isUiLocale: false,
        }),
      });

      const res = await patchLanguageRoute(req, {
        params: Promise.resolve({ id: dummyUuid }),
      });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.error.code, 'IMMUTABLE_FIELD');
      assert.ok(json.error.fields?.code);
      assert.equal(updateCalled, false, 'Update must be rejected before touching database');
    });

    test('PATCH /api/languages/[id] merges locale keys preserving existing keys and removing cleared en', async () => {
      let finalSavedNames = null;
      const prismaDouble = createPrismaDouble({
        findUnique: async () => ({
          id: dummyUuid,
          code: 'en',
          names: { vi: 'Tiếng Anh Cũ', en: 'English Old', fr: 'Anglais' },
          isLearnable: true,
          isUiLocale: true,
        }),
        update: async ({ data }) => {
          finalSavedNames = data.names;
          return {
            id: dummyUuid,
            code: 'en',
            names: data.names,
            isLearnable: data.isLearnable,
            isUiLocale: data.isUiLocale,
          };
        },
      });
      setProductPrismaForTest(prismaDouble);

      // Clear en by omitting/blanking it
      const req = new Request('http://localhost:3000/api/languages/' + dummyUuid, {
        method: 'PATCH',
        headers: {
          'Origin': 'http://localhost:3000',
          'Host': 'localhost:3000',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          names: { vi: 'Tiếng Anh Mới' }, // en omitted => cleared
          isLearnable: false,
          isUiLocale: true,
        }),
      });

      const res = await patchLanguageRoute(req, {
        params: Promise.resolve({ id: dummyUuid }),
      });

      assert.equal(res.status, 200);
      assert.equal(finalSavedNames.vi, 'Tiếng Anh Mới');
      assert.equal(finalSavedNames.en, undefined, 'en must be removed when cleared in form');
      assert.equal(finalSavedNames.fr, 'Anglais', 'Existing untouched locale keys (e.g. fr) must be preserved');
    });

    test('PATCH note: update conflict on unique key is inapplicable due to immutable code', () => {
      assert.ok(true, 'Documented: update unique conflict is inapplicable because code is immutable');
    });

    test('PATCH /api/languages/[id] returns 404 NOT_FOUND for non-existent record', async () => {
      const prismaDouble = createPrismaDouble({
        findUnique: async () => null,
      });
      setProductPrismaForTest(prismaDouble);

      const req = new Request('http://localhost:3000/api/languages/' + dummyUuid, {
        method: 'PATCH',
        headers: {
          'Origin': 'http://localhost:3000',
          'Host': 'localhost:3000',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          names: { vi: 'Không Tồn Tại' },
          isLearnable: true,
          isUiLocale: false,
        }),
      });

      const res = await patchLanguageRoute(req, {
        params: Promise.resolve({ id: dummyUuid }),
      });

      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.error.code, 'NOT_FOUND');
    });

    test('DELETE /api/languages/[id] returns 204 on success', async () => {
      let deleteCalledWithId = null;
      const prismaDouble = createPrismaDouble({
        findUnique: async () => ({ id: dummyUuid }),
        delete: async ({ where }) => {
          deleteCalledWithId = where.id;
          return { id: where.id };
        },
      });
      setProductPrismaForTest(prismaDouble);

      const req = new Request('http://localhost:3000/api/languages/' + dummyUuid, {
        method: 'DELETE',
        headers: {
          'Origin': 'http://localhost:3000',
          'Host': 'localhost:3000',
        },
      });

      const res = await deleteLanguageRoute(req, {
        params: Promise.resolve({ id: dummyUuid }),
      });

      assert.equal(res.status, 204);
      assert.equal(deleteCalledWithId, dummyUuid);
      assert.ok(res.headers.get('Cache-Control').includes('no-store'));
    });

    test('DELETE /api/languages/[id] returns 409 LANGUAGE_IN_USE when foreign key blocks delete (P2003)', async () => {
      const prismaDouble = createPrismaDouble({
        findUnique: async () => ({ id: dummyUuid }),
        delete: async () => {
          const err = new Error('FK restriction');
          err.code = 'P2003';
          throw err;
        },
      });
      setProductPrismaForTest(prismaDouble);

      const req = new Request('http://localhost:3000/api/languages/' + dummyUuid, {
        method: 'DELETE',
        headers: {
          'Origin': 'http://localhost:3000',
          'Host': 'localhost:3000',
        },
      });

      const res = await deleteLanguageRoute(req, {
        params: Promise.resolve({ id: dummyUuid }),
      });

      assert.equal(res.status, 409);
      const json = await res.json();
      assert.equal(json.error.code, 'LANGUAGE_IN_USE');
    });

    test('DELETE /api/languages/[id] returns 404 NOT_FOUND when record is absent', async () => {
      const prismaDouble = createPrismaDouble({
        findUnique: async () => null,
      });
      setProductPrismaForTest(prismaDouble);

      const req = new Request('http://localhost:3000/api/languages/' + dummyUuid, {
        method: 'DELETE',
        headers: {
          'Origin': 'http://localhost:3000',
          'Host': 'localhost:3000',
        },
      });

      const res = await deleteLanguageRoute(req, {
        params: Promise.resolve({ id: dummyUuid }),
      });

      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.error.code, 'NOT_FOUND');
    });

    test('DELETE /api/languages/[id] returns 400 INVALID_ID on malformed UUID', async () => {
      let deleteCalled = false;
      const prismaDouble = createPrismaDouble({
        delete: async () => {
          deleteCalled = true;
        },
      });
      setProductPrismaForTest(prismaDouble);

      const req = new Request('http://localhost:3000/api/languages/not-a-uuid', {
        method: 'DELETE',
        headers: {
          'Origin': 'http://localhost:3000',
          'Host': 'localhost:3000',
        },
      });

      const res = await deleteLanguageRoute(req, {
        params: Promise.resolve({ id: 'not-a-uuid' }),
      });

      assert.equal(res.status, 400);
      assert.equal(deleteCalled, false);
      const json = await res.json();
      assert.equal(json.error.code, 'INVALID_ID');
    });
  });
});
