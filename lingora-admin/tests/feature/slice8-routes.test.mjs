import { after, beforeEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';

let currentCookieStore = { getAll: () => [], get: () => undefined, set: () => {}, delete: () => {} };
mock.module('next/headers.js', { exports: { cookies: async () => currentCookieStore } });
mock.module('server-only', { exports: {} });

const { GET: listBlueprintsRoute, POST: createBlueprintRoute } = await import('../../src/app/api/assessment-blueprints/route.ts');
const { GET: listTeacherBlueprintsRoute } = await import('../../src/app/api/teacher/lessons/[lessonId]/assessment-blueprints/route.ts');
const { setProductPrismaForTest } = await import('../../src/server/db/index.js');

const adminId = '5650336e-550c-413d-b2a8-4afa2e4d9160';
const teacherId = '11111111-1111-4111-8111-111111111111';
const lessonId = '22222222-2222-4222-8222-222222222222';
const courseId = '33333333-3333-4333-8333-333333333333';
const languageId = '44444444-4444-4444-8444-444444444444';
const frameworkId = '55555555-5555-4555-8555-555555555555';
const blueprintId = '66666666-6666-4666-8666-666666666666';
const originalFetch = globalThis.fetch;
let accounts;
let blueprintListReads;
let blueprintCreates;

function mockSessionCookie(userId) {
  const email = `${userId}@lingora.test`;
  const payload = { sub: userId, email, exp: Math.floor(Date.now() / 1000) + 3600 };
  const accessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
  const session = {
    access_token: accessToken,
    refresh_token: 'test-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: payload.exp,
    user: { id: userId, email },
  };
  return {
    name: 'sb-test-project-ref-auth-token',
    value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`,
  };
}

function sessionFor(userId) {
  const cookie = mockSessionCookie(userId);
  currentCookieStore = {
    getAll: () => [cookie],
    get: (name) => name === cookie.name ? cookie : undefined,
    set: () => {},
    delete: () => {},
  };
}

function request(path, { method = 'GET', body, headers = {} } = {}) {
  const url = new URL(path, 'https://lingora.test');
  const requestHeaders = new Headers({ host: url.host, ...headers });
  return new Request(url, { method, headers: requestHeaders, body });
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project-ref.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  currentCookieStore = { getAll: () => [], get: () => undefined, set: () => {}, delete: () => {} };
  accounts = new Map([
    [adminId, { id: adminId, role: 'ADMIN', status: 'ACTIVE', displayName: 'Admin', uiLocale: 'vi' }],
    [teacherId, { id: teacherId, role: 'TEACHER', status: 'ACTIVE', displayName: 'Teacher', uiLocale: 'vi' }],
  ]);
  blueprintListReads = 0;
  blueprintCreates = 0;
  const createdAt = new Date('2026-10-31T00:00:00.000Z');
  globalThis.fetch = async (_url, _init) => Response.json({ id: currentUserId });
  setProductPrismaForTest({
    account: { findUnique: async ({ where }) => accounts.get(where.id) || null },
    course: { findUnique: async () => ({ id: courseId, languageId, frameworkId, coverageCatalogGeneration: 4n }) },
    assessmentBlueprint: {
      findMany: async () => { blueprintListReads++; return []; },
      create: async ({ data }) => {
        blueprintCreates++;
        return {
          id: blueprintId, ...data, createdAt, updatedAt: createdAt,
          course: { id: courseId, names: { vi: 'DEV Course' } },
          language: { id: languageId, code: 'en', names: {} },
          framework: { id: frameworkId, code: 'FW', version: '1', names: {} },
          targetLevel: null, nextLevel: null, _count: { versions: 0 },
        };
      },
    },
  });
});

let currentUserId = '';
after(() => {
  globalThis.fetch = originalFetch;
  setProductPrismaForTest(null);
});

test('Blueprint route requires an active Admin identity and returns no-store DTO responses', async () => {
  let response = await listBlueprintsRoute(request('/api/assessment-blueprints'));
  assert.equal(response.status, 401);
  assert.equal(blueprintListReads, 0);

  currentUserId = teacherId;
  sessionFor(teacherId);
  response = await listBlueprintsRoute(request('/api/assessment-blueprints'));
  assert.equal(response.status, 403);
  assert.equal(blueprintListReads, 0);

  currentUserId = adminId;
  accounts.get(adminId).status = 'DISABLED';
  sessionFor(adminId);
  response = await listBlueprintsRoute(request('/api/assessment-blueprints'));
  assert.equal(response.status, 403);
  assert.equal(blueprintListReads, 0);

  accounts.get(adminId).status = 'ACTIVE';
  currentUserId = adminId;
  sessionFor(adminId);
  response = await listBlueprintsRoute(request('/api/assessment-blueprints'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store, private');
  assert.deepEqual(await response.json(), { data: [] });
  assert.equal(blueprintListReads, 1);
});

test('Teacher route rejects Admin and unauthenticated sessions instead of widening the role boundary', async () => {
  currentUserId = adminId;
  sessionFor(adminId);
  let response = await listTeacherBlueprintsRoute(
    request(`/api/teacher/lessons/${lessonId}/assessment-blueprints`),
    { params: Promise.resolve({ lessonId }) },
  );
  assert.equal(response.status, 403);

  currentCookieStore = { getAll: () => [], get: () => undefined, set: () => {}, delete: () => {} };
  response = await listTeacherBlueprintsRoute(
    request(`/api/teacher/lessons/${lessonId}/assessment-blueprints`),
    { params: Promise.resolve({ lessonId }) },
  );
  assert.equal(response.status, 401);
});

test('Blueprint mutation validates origin and JSON before any authenticated write', async () => {
  sessionFor(adminId);
  currentUserId = adminId;
  const payload = JSON.stringify({});

  let response = await createBlueprintRoute(request('/api/assessment-blueprints', {
    method: 'POST', body: payload,
    headers: { origin: 'https://attacker.test', 'content-type': 'application/json' },
  }));
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, 'FORBIDDEN_ORIGIN');

  response = await createBlueprintRoute(request('/api/assessment-blueprints', {
    method: 'POST', body: payload,
    headers: { origin: 'https://lingora.test', 'content-type': 'text/plain' },
  }));
  assert.equal(response.status, 415);

  response = await createBlueprintRoute(request('/api/assessment-blueprints', {
    method: 'POST', body: '{',
    headers: { origin: 'https://lingora.test', 'content-type': 'application/json' },
  }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'MALFORMED_JSON');
  assert.equal(blueprintCreates, 0);
});

test('Blueprint creation route returns one production DTO envelope', async () => {
  currentUserId = adminId;
  sessionFor(adminId);
  const payload = JSON.stringify({
    courseId, purpose: 'PLACEMENT', targetLevelId: null, nextLevelId: null,
    coverage: { itemCount: 1, exerciseTypes: ['MCQ'] },
    requirements: { minimumItemsByType: {} },
    config: { shuffleItems: false, shuffleOptions: false },
  });

  const response = await createBlueprintRoute(request('/api/assessment-blueprints', {
    method: 'POST', body: payload,
    headers: { origin: 'https://lingora.test', 'content-type': 'application/json' },
  }));

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.data.id, blueprintId);
  assert.equal(body.data.courseId, courseId);
  assert.equal(body.data.rowVersion, '1');
  assert.equal(Object.hasOwn(body.data, 'data'), false);
  assert.equal(blueprintCreates, 1);
});
