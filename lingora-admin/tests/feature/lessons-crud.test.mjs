import { lessonsFixture } from './harness/lessons-fixture.mjs';
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
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
    usePathname: () => '/courses/course-1/units/unit-1',
  },
});

mock.module('server-only', {
  exports: {},
});

const {
  isValidUuid,
  createLessonSchema,
  updateLessonSchema,
  assignLessonSchema,
  saveTeacherDraftSchema,
  toLessonSummaryDto,
  toLessonDetailDto,
  listLessons,
  getLesson,
  createLesson,
  updateLesson,
  assignLesson,
  getTeacherOptions,
  listTeacherAssignedLessons,
  getTeacherLessonDetail,
  saveTeacherLessonDraft,
} = await import('../../src/server/lessons/index.ts');

const { GET: getLessonsRoute, POST: postLessonsRoute } = await import(
  '../../src/app/api/courses/[courseId]/units/[unitId]/lessons/route.ts'
);
const { GET: getLessonDetailRoute, PATCH: patchLessonRoute } = await import(
  '../../src/app/api/courses/[courseId]/units/[unitId]/lessons/[lessonId]/route.ts'
);
const { PATCH: patchAssignmentRoute } = await import(
  '../../src/app/api/courses/[courseId]/units/[unitId]/lessons/[lessonId]/assignment/route.ts'
);
const { GET: getTeacherOptionsRoute } = await import(
  '../../src/app/api/courses/[courseId]/units/[unitId]/lessons/teacher-options/route.ts'
);

const { GET: getTeacherLessonsRoute } = await import('../../src/app/api/teacher/lessons/route.ts');
const { GET: getTeacherLessonDetailRoute } = await import('../../src/app/api/teacher/lessons/[lessonId]/route.ts');
const { PATCH: patchTeacherDraftRoute } = await import('../../src/app/api/teacher/lessons/[lessonId]/draft/route.ts');

const { setProductPrismaForTest } = await import('../../src/server/db/index.js');
const originalFetch = globalThis.fetch;

describe('S5-06: Independent acceptance boundaries', () => {
  const admin = '00000000-0000-4000-8000-000000000001';
  const teacher = '11111111-1111-4111-8111-111111111111';
  const other = '22222222-2222-4222-8222-222222222222';
  const learner = '33333333-3333-4333-8333-333333333333';
  const course = '00000000-0000-0000-0000-000000000030';
  const unit = '00000000-0000-0000-0000-000000000040';
  let f, lesson, identity;
  const draft = (version = '2') => ({ title: { vi: 'Bản mới', en: '' }, contentBlocks: [], expectedRowVersion: version });
  const snapshot = () => structuredClone(f.state);
  const request = (method, body) => new Request('http://localhost:3000/api/test', {
    method, headers: { Origin: 'http://localhost:3000', Host: 'localhost:3000', 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const params = () => ({ params: Promise.resolve({ courseId: course, unitId: unit, lessonId: lesson }) });
  beforeEach(async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    f = lessonsFixture();
    for (const [id, role] of [[admin, 'ADMIN'], [teacher, 'TEACHER'], [other, 'TEACHER'], [learner, 'LEARNER']])
      f.state.accounts.set(id, { id, role, status: 'ACTIVE', displayName: role, uiLocale: 'vi' });
    f.state.courses.set(course, { id: course, names: { vi: 'DEV course' } });
    f.state.units.set(unit, { id: unit, courseId: course, code: 'DEV', names: { vi: 'DEV unit' }, position: 1 });
    lesson = (await f.db.lesson.create({ data: { unitId: unit, position: 1 } })).id;
    assert.equal((await assignLesson(admin, course, unit, lesson, { teacherId: teacher, expectedRowVersion: '1' }, f.db)).status, 200);
    identity = teacher;
    currentCookieStore = { getAll: () => identity ? [createMockSessionCookie(identity)] : [] };
    globalThis.fetch = async () => Response.json({ id: identity });
    setProductPrismaForTest(f.db);
  });
  afterEach(() => { globalThis.fetch = originalFetch; setProductPrismaForTest(null); });

  test('CAS tokens are canonical positive int64 strings on all writes', () => {
    for (const token of ['0', '00', '01', '-1', '+1', '1.0', '', '9223372036854775808', '9'.repeat(100)]) {
      assert.equal(updateLessonSchema.safeParse({ position: 1, isRequired: true, expectedRowVersion: token }).success, false, token);
      assert.equal(assignLessonSchema.safeParse({ teacherId: teacher, expectedRowVersion: token }).success, false, token);
      assert.equal(saveTeacherDraftSchema.safeParse(draft(token)).success, false, token);
    }
    assert.equal(saveTeacherDraftSchema.safeParse(draft('9223372036854775807')).success, true);
  });
  for (const token of ['1', '2', '999']) test(`unassigned Teacher draft write is opaque404 even with token ${token}`, async () => {
    const before = snapshot();
    const res = await saveTeacherLessonDraft(other, lesson, draft(token), f.db);
    assert.equal(res.status, 404);
    assert.deepEqual(f.state, before);
  });
  for (const table of ['accounts', 'lessons', 'content_assignments']) test(`failed ${table} lock fails closed without fallback writes`, async () => {
    const before = snapshot(), raw = f.db.$queryRaw;
    f.db.$queryRaw = (sql, ...args) => { if (sql.join('').includes(`FROM app.${table}`)) throw new Error('lock unavailable'); return raw(sql, ...args); };
    assert.equal((await saveTeacherLessonDraft(teacher, lesson, draft(), f.db)).status, 503);
    assert.deepEqual(f.state, before);
  });
  test('an absent locked Account cannot be replaced by an unlocked mock read', async () => {
    const raw = f.db.$queryRaw;
    f.db.$queryRaw = (sql, ...args) => sql.join('').includes('FROM app.accounts') ? [] : raw(sql, ...args);
    assert.equal((await saveTeacherLessonDraft(teacher, lesson, draft(), f.db)).status, 403);
    assert.equal(f.state.revisions.size, 0);
  });
  test('draft inserts use unambiguous nullable JSON and preserve server metadata', async () => {
    const create = f.db.lessonRevision.create;
    f.db.lessonRevision.create = args => { assert.notEqual(args.data.coverageSnapshot, null, 'Prisma SQL NULL must be omitted or explicit DbNull'); return create(args); };
    assert.equal((await saveTeacherLessonDraft(teacher, lesson, draft(), f.db)).status, 200);
    const prior = [...f.state.revisions.values()][0];
    Object.assign(prior, { topicIds: ['topic'], skillIds: ['skill'], purposeTags: ['purpose'], coverageCatalogGeneration: 4n, coverageSnapshot: { keep: true }, title: { vi: 'Cũ', en: 'Old', fr: 'Conserver' } });
    const before = structuredClone(prior);
    assert.equal((await saveTeacherLessonDraft(teacher, lesson, draft('3'), f.db)).status, 200);
    const next = [...f.state.revisions.values()][1];
    for (const key of ['topicIds', 'skillIds', 'purposeTags', 'coverageCatalogGeneration', 'coverageSnapshot']) assert.deepEqual(next[key], prior[key]);
    assert.equal(next.title.fr, 'Conserver'); assert.equal(next.title.en, undefined);
    assert.deepEqual(prior, before);
  });
  test('a post-insert failure rolls back revision and aggregate', async () => {
    const before = snapshot(); f.fail.lessonUpdate = true;
    assert.equal((await saveTeacherLessonDraft(teacher, lesson, draft(), f.db)).status, 503);
    assert.deepEqual(f.state, before);
  });
  test('reassignment failure after assignment write rolls back all rows', async () => {
    const before = snapshot(); f.fail.historyCreate = true;
    assert.equal((await assignLesson(admin, course, unit, lesson, { teacherId: other, expectedRowVersion: '2' }, f.db)).status, 503);
    assert.deepEqual(f.state, before);
  });
  test('missing current assignment history is rejected without inventing a repair episode', async () => {
    f.state.histories.clear(); const before = snapshot();
    assert.equal((await assignLesson(admin, course, unit, lesson, { teacherId: other, expectedRowVersion: '2' }, f.db)).status, 409);
    assert.deepEqual(f.state, before);
  });
  test('same-token concurrent saves have one winner and preserve revision advance', async () => {
    const rows = await Promise.all([saveTeacherLessonDraft(teacher, lesson, draft(), f.db), saveTeacherLessonDraft(teacher, lesson, draft(), f.db)]);
    assert.deepEqual(rows.map(r => r.status).sort(), [200, 409]);
    assert.equal(f.state.revisions.size, 1); assert.equal(f.state.lessons.get(lesson).rowVersion, 3n);
  });
  test('same-token assignment race has one winner and one new episode', async () => {
    const third = '44444444-4444-4444-8444-444444444444';
    f.state.accounts.set(third, { id: third, role: 'TEACHER', status: 'ACTIVE' });
    const rows = await Promise.all([other, third].map(teacherId => assignLesson(admin, course, unit, lesson, { teacherId, expectedRowVersion: '2' }, f.db)));
    assert.deepEqual(rows.map(r => r.status).sort(), [200, 409]);
    assert.equal(f.state.histories.size, 2); assert.equal(f.state.lessons.get(lesson).rowVersion, 3n);
  });
  for (const key of ['approvedBy', 'approvedAt', 'publishedBy', 'publishedAt', 'endedAt']) test(`inconsistent DRAFT ${key} workflow fact is read-only`, async () => {
    await saveTeacherLessonDraft(teacher, lesson, draft(), f.db);
    [...f.state.revisions.values()][0][key] = key.endsWith('By') ? admin : new Date();
    assert.equal((await saveTeacherLessonDraft(teacher, lesson, draft('3'), f.db)).status, 409);
    assert.equal(f.state.revisions.size, 1);
  });
  for (const mode of ['actor', 'target']) test(`disable ${mode} after auth but before transaction denies the request`, async () => {
    const tx = f.db.$transaction;
    f.db.$transaction = fn => { f.state.accounts.get(mode === 'actor' ? teacher : other).status = 'DISABLED'; return tx(fn); };
    const response = mode === 'actor'
      ? await patchTeacherDraftRoute(request('PATCH', draft()), params())
      : (identity = admin, await patchAssignmentRoute(request('PATCH', { teacherId: other, expectedRowVersion: '2' }), params()));
    assert.equal(response.status, mode === 'actor' ? 403 : 409);
    assert.equal(f.state.revisions.size, 0); assert.equal(f.state.histories.size, 1);
  });
  const adminHandlers = [
    [getLessonsRoute, 'GET'], [getLessonDetailRoute, 'GET'], [getTeacherOptionsRoute, 'GET'],
    [postLessonsRoute, 'POST', { position: 2 }], [patchLessonRoute, 'PATCH', { position: 2, isRequired: true, expectedRowVersion: '2' }],
    [patchAssignmentRoute, 'PATCH', { teacherId: other, expectedRowVersion: '2' }],
  ];
  for (const who of [null, teacher, learner]) test(`all Admin handlers deny ${who || 'anonymous'} without business effects`, async () => {
    identity = who; const before = snapshot(), tx = f.calls.transactions;
    for (const [handler, method, body] of adminHandlers) assert.equal((await handler(request(method, body), params())).status, who ? 403 : 401);
    assert.equal(f.calls.transactions, tx); assert.deepEqual(f.state, before);
  });
  for (const status of ['PENDING', 'DISABLED']) test(`all Teacher handlers reject ${status} session`, async () => {
    f.state.accounts.get(teacher).status = status; const before = snapshot();
    for (const [handler, method, body] of [[getTeacherLessonsRoute, 'GET'], [getTeacherLessonDetailRoute, 'GET'], [patchTeacherDraftRoute, 'PATCH', draft()]]) {
      const r = await handler(request(method, body), params()); assert.equal(r.status, 403); assert.equal((await r.json()).error.code, 'ACCOUNT_INACTIVE');
    }
    assert.deepEqual(f.state, before);
  });
  test('all nested mutations enforce Unit/Lesson and Course/Unit scope', async () => {
    const wrong = '99999999-9999-9999-9999-999999999999', before = snapshot();
    for (const [c, u] of [[wrong, unit], [course, wrong]]) {
      assert.equal((await updateLesson(admin, c, u, lesson, { position: 2, isRequired: false, expectedRowVersion: '2' }, f.db)).status, 404);
      assert.equal((await assignLesson(admin, c, u, lesson, { teacherId: other, expectedRowVersion: '2' }, f.db)).status, 404);
    }
    assert.deepEqual(f.state, before);
  });
  test('Teacher detail service503 renders the production retry view, not404', async () => {
    const { compileAndLoadPage } = await import('./harness/load-production-pages.mjs');
    f.db.lesson.findFirst = async () => { throw new Error('Database unavailable'); };
    const Page = await compileAndLoadPage('src/app/my-lessons/[lessonId]/page.tsx');
    const view = await Page({ params: Promise.resolve({ lessonId: lesson }) });
    assert.equal(view.props.onRetryHref, `/my-lessons/${lesson}`);
  });
  test('mutation locks are parameterized, ordered Accounts then Lesson then Assignment', async () => {
    const raw = f.db.$queryRaw, sequence = [];
    f.db.$queryRaw = (sql, ...args) => { sequence.push({ sql: sql.join('?'), args }); return raw(sql, ...args); };
    assert.equal((await saveTeacherLessonDraft(teacher, lesson, draft(), f.db)).status, 200);
    assert.deepEqual(sequence.map(q => /FROM app\.(\w+)/.exec(q.sql)[1]), ['accounts', 'lessons', 'content_assignments']);
    assert.ok(sequence.every(q => /FOR (?:NO KEY )?UPDATE/.test(q.sql) && q.args.length === 1 && !q.sql.includes(lesson)));
    assert.match(sequence[0].sql, /FOR NO KEY UPDATE/, 'Account locks must permit concurrent FK key-share checks');
  });
  test('draft raw request is capped before JSON parsing or business effects', async () => {
    const before = snapshot();
    const r = new Request('http://localhost:3000/api/test', { method: 'PATCH', headers: { Origin: 'http://localhost:3000', Host: 'localhost:3000', 'Content-Type': 'application/json' }, body: ' '.repeat(1024 * 1024) + JSON.stringify(draft()) });
    const response = await patchTeacherDraftRoute(r, params());
    assert.equal(response.status, 413); assert.deepEqual(f.state, before);
  });
  test('malformed IDs, missing Lesson and server-owned input overrides cause no writes', async () => {
    const missing = '99999999-9999-9999-9999-999999999999', before = snapshot();
    assert.equal((await createLesson(admin, 'bad', unit, { position: 2 }, f.db)).status, 400);
    assert.equal((await updateLesson(admin, course, unit, missing, { position: 2, isRequired: false, expectedRowVersion: '2' }, f.db)).status, 404);
    assert.equal((await getLesson(course, unit, missing, f.db)).status, 404);
    for (const override of [{ status: 'PUBLISHED' }, { unitId: missing }, { teacherId: other }, { assignmentId: missing }, { createdBy: admin }]) {
      assert.equal((await saveTeacherLessonDraft(teacher, lesson, { ...draft(), ...override }, f.db)).status, 400);
    }
    assert.deepEqual(f.state, before);
  });
  test('production route integration denies an unassigned Teacher read/write without leaking the Lesson', async () => {
    identity = other; const before = snapshot();
    const list = await getTeacherLessonsRoute(request('GET'));
    assert.equal(list.status, 200); assert.deepEqual((await list.json()).data, []);
    for (const [handler, method, body] of [[getTeacherLessonDetailRoute, 'GET'], [patchTeacherDraftRoute, 'PATCH', draft()]]) {
      const response = await handler(request(method, body), params());
      assert.equal(response.status, 404); assert.equal((await response.json()).error.code, 'LESSON_NOT_FOUND');
    }
    assert.deepEqual(f.state, before);
  });
  for (const defect of ['missing', 'generation', 'teacher']) test(`draft save rejects ${defect} assignment episode without writes or repair`, async () => {
    const episode = [...f.state.histories.values()][0];
    if (defect === 'missing') f.state.histories.clear();
    if (defect === 'generation') episode.scopeGeneration++;
    if (defect === 'teacher') episode.nextTeacherId = other;
    const before = snapshot();
    const res = await saveTeacherLessonDraft(teacher, lesson, draft(), f.db);
    assert.equal(res.status, 409); assert.equal(res.error.code, 'INCONSISTENT_ASSIGNMENT_HISTORY'); assert.deepEqual(f.state, before);
  });
  test('published revision remains intact as the source of a new successor draft', async () => {
    await saveTeacherLessonDraft(teacher, lesson, draft(), f.db);
    const prior = [...f.state.revisions.values()][0], id = '99999999-9999-4999-8999-999999999999';
    f.state.revisions.set(id, { ...structuredClone(prior), id, revisionNo: 2, priorRevisionId: prior.id, status: 'PUBLISHED', submittedBy: teacher, submittedAt: new Date(), publishedBy: admin, publishedAt: new Date(), submittedAssignmentGeneration: 1n, assignmentScopeSnapshot: {} });
    const res = await saveTeacherLessonDraft(teacher, lesson, draft('3'), f.db);
    assert.equal(res.status, 200);
    assert.equal(res.data.data.highestRevision.revisionNo, 3);
    assert.equal(f.state.revisions.get(id).status, 'PUBLISHED');
    assert.equal(f.state.revisions.get(id).title.vi, prior.title.vi);
    assert.equal(f.state.revisions.get(res.data.data.highestRevision.id).priorRevisionId, id);
  });
});

function createMockSessionCookie(
  userId = '00000000-0000-4000-8000-000000000001',
  email = 'admin@lingora.edu.vn'
) {
  const payload = {
    sub: userId,
    email,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const access_token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    Buffer.from(JSON.stringify(payload)).toString('base64url') +
    '.signature';
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

describe('S5-01: Lesson & Draft Validation Schemas & CAS Token Contract', () => {
  const seedCourseId = '00000000-0000-0000-0000-000000000030';
  const seedUnitId = '00000000-0000-0000-0000-000000000040';
  const seedTeacherId = '11111111-1111-4111-8111-111111111111';

  test('isValidUuid accepts canonical UUIDs and rejects invalid strings', () => {
    assert.equal(isValidUuid(seedCourseId), true);
    assert.equal(isValidUuid(seedUnitId), true);
    assert.equal(isValidUuid('22222222-2222-4222-8222-222222222222'), true);
    assert.equal(isValidUuid('not-a-uuid'), false);
    assert.equal(isValidUuid(''), false);
    assert.equal(isValidUuid(' 00000000-0000-0000-0000-000000000030'), false);
  });

  test('createLessonSchema validates positive int position and boolean isRequired', () => {
    const valid = createLessonSchema.safeParse({ position: 1, isRequired: true });
    assert.equal(valid.success, true);
    assert.equal(valid.data.position, 1);
    assert.equal(valid.data.isRequired, true);

    const defaultReq = createLessonSchema.safeParse({ position: 5 });
    assert.equal(defaultReq.success, true);
    assert.equal(defaultReq.data.isRequired, true);

    assert.equal(createLessonSchema.safeParse({ position: 0 }).success, false);
    assert.equal(createLessonSchema.safeParse({ position: -1 }).success, false);
    assert.equal(createLessonSchema.safeParse({ position: 1.5 }).success, false);
    // Extra fields rejected strictly
    assert.equal(createLessonSchema.safeParse({ position: 1, extraField: 'bad' }).success, false);
    assert.equal(createLessonSchema.safeParse({ position: 1, availability: 'AVAILABLE' }).success, false);
  });

  test('updateLessonSchema requires strict position, isRequired and expectedRowVersion string', () => {
    const valid = updateLessonSchema.safeParse({
      position: 2,
      isRequired: false,
      expectedRowVersion: '1',
    });
    assert.equal(valid.success, true);

    assert.equal(updateLessonSchema.safeParse({ position: 2, isRequired: false }).success, false);
    assert.equal(updateLessonSchema.safeParse({ position: 2, isRequired: false, expectedRowVersion: 'abc' }).success, false);
    assert.equal(updateLessonSchema.safeParse({ position: 2, isRequired: false, expectedRowVersion: '-1' }).success, false);
    assert.equal(updateLessonSchema.safeParse({ position: 2, isRequired: false, expectedRowVersion: 1 }).success, false);
    // Unknown fields strictly rejected
    assert.equal(updateLessonSchema.safeParse({ position: 2, isRequired: false, expectedRowVersion: '1', id: 'foo' }).success, false);
  });

  test('assignLessonSchema requires valid teacherId and expectedRowVersion string', () => {
    const valid = assignLessonSchema.safeParse({
      teacherId: seedTeacherId,
      expectedRowVersion: '3',
    });
    assert.equal(valid.success, true);

    assert.equal(assignLessonSchema.safeParse({ teacherId: 'bad-uuid', expectedRowVersion: '1' }).success, false);
    assert.equal(assignLessonSchema.safeParse({ teacherId: seedTeacherId }).success, false);
    assert.equal(assignLessonSchema.safeParse({ teacherId: seedTeacherId, expectedRowVersion: '1', reason: 'extra' }).success, false);
  });

  test('saveTeacherDraftSchema validates title, contentBlocks and changeSummary constraints', () => {
    const valid = saveTeacherDraftSchema.safeParse({
      title: { vi: 'Bài học số 1', en: 'Lesson 1' },
      contentBlocks: [
        { type: 'paragraph', text: 'Nội dung đoạn văn đầu tiên.' },
        { type: 'paragraph', text: 'Nội dung đoạn văn thứ hai.' },
      ],
      changeSummary: 'Khởi tạo bản nháp',
      expectedRowVersion: '1',
    });
    assert.equal(valid.success, true);

    // Empty array contentBlocks is permitted
    assert.equal(
      saveTeacherDraftSchema.safeParse({
        title: { vi: 'Chỉ có tiêu đề' },
        contentBlocks: [],
        expectedRowVersion: '1',
      }).success,
      true
    );

    // At least one non-empty title required
    assert.equal(
      saveTeacherDraftSchema.safeParse({
        title: { vi: '', en: '' },
        contentBlocks: [],
        expectedRowVersion: '1',
      }).success,
      false
    );

    // Content block must be strict paragraph
    assert.equal(
      saveTeacherDraftSchema.safeParse({
        title: { vi: 'Tiêu đề' },
        contentBlocks: [{ type: 'heading', text: 'Bad' }],
        expectedRowVersion: '1',
      }).success,
      false
    );

    // Paragraph text max 20,000 characters
    assert.equal(
      saveTeacherDraftSchema.safeParse({
        title: { vi: 'Tiêu đề' },
        contentBlocks: [{ type: 'paragraph', text: 'a'.repeat(20001) }],
        expectedRowVersion: '1',
      }).success,
      false
    );

    // Content blocks max 50
    const blocks51 = Array.from({ length: 51 }, (_, i) => ({ type: 'paragraph', text: `Đoạn ${i}` }));
    assert.equal(
      saveTeacherDraftSchema.safeParse({
        title: { vi: 'Tiêu đề' },
        contentBlocks: blocks51,
        expectedRowVersion: '1',
      }).success,
      false
    );

    // Change summary max 500 characters
    assert.equal(
      saveTeacherDraftSchema.safeParse({
        title: { vi: 'Tiêu đề' },
        contentBlocks: [],
        changeSummary: 'a'.repeat(501),
        expectedRowVersion: '1',
      }).success,
      false
    );
  });
});

describe('S5-02: Admin Lesson CRUD & Hierarchy Enforcement', () => {
  const adminId = '00000000-0000-4000-8000-000000000001';
  const teacherId = '11111111-1111-4111-8111-111111111111';
  const courseId = '00000000-0000-0000-0000-000000000030';
  const unitId = '00000000-0000-0000-0000-000000000040';
  const unrelatedCourseId = '00000000-0000-0000-0000-000000000099';

  let fixture;

  beforeEach(() => {
    fixture = lessonsFixture();
    fixture.state.accounts.set(adminId, {
      id: adminId,
      role: 'ADMIN',
      status: 'ACTIVE',
      displayName: 'Admin Quản Trị',
      uiLocale: 'vi',
    });
    fixture.state.accounts.set(teacherId, {
      id: teacherId,
      role: 'TEACHER',
      status: 'ACTIVE',
      displayName: 'Cô Lan Giáo Viên',
      uiLocale: 'vi',
    });
    fixture.state.courses.set(courseId, {
      id: courseId,
      names: { vi: 'Tiếng Anh Giao Tiếp', en: 'Communicative English' },
    });
    fixture.state.units.set(unitId, {
      id: unitId,
      courseId,
      code: 'U1',
      names: { vi: 'Làm quen', en: 'Getting Started' },
      position: 1,
    });
  });

  test('listLessons returns scoped lessons ordered by position and validates parent hierarchy', async () => {
    await fixture.db.lesson.create({ data: { unitId, position: 2 } });
    await fixture.db.lesson.create({ data: { unitId, position: 1 } });

    const res = await listLessons(courseId, unitId, fixture.db);
    assert.equal(res.status, 200);
    assert.equal(res.data.data.length, 2);
    assert.equal(res.data.data[0].position, 1);
    assert.equal(res.data.data[1].position, 2);
    assert.equal(res.data.data[0].unitContext.code, 'U1');
    assert.equal(res.data.data[0].courseContext.names.vi, 'Tiếng Anh Giao Tiếp');

    // Mismatched courseId returns 404
    const mismatch = await listLessons(unrelatedCourseId, unitId, fixture.db);
    assert.equal(mismatch.status, 404);
  });

  test('createLesson creates planned lesson skeleton, enforces unique position, and rolls back on failure', async () => {
    const res1 = await createLesson(adminId, courseId, unitId, { position: 1, isRequired: true }, fixture.db);
    assert.equal(res1.status, 201);
    assert.equal(res1.data.data.position, 1);
    assert.equal(res1.data.data.availability, 'PLANNED');
    assert.equal(res1.data.data.rowVersion, '1');
    assert.equal(res1.data.data.assignment, null);
    assert.equal(res1.data.data.highestRevision, null);

    // Duplicate position returns 409 DUPLICATE_LESSON_POSITION
    const duplicate = await createLesson(adminId, courseId, unitId, { position: 1 }, fixture.db);
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.error?.code, 'DUPLICATE_LESSON_POSITION');

    // Non-admin account rejected with 403
    const teacherCreate = await createLesson(teacherId, courseId, unitId, { position: 2 }, fixture.db);
    assert.equal(teacherCreate.status, 403);

    // Inactive admin rejected with 403
    fixture.state.accounts.get(adminId).status = 'DISABLED';
    const disabledAdmin = await createLesson(adminId, courseId, unitId, { position: 2 }, fixture.db);
    assert.equal(disabledAdmin.status, 403);
    fixture.state.accounts.get(adminId).status = 'ACTIVE';

    // Transaction failure rolls back completely
    fixture.fail.lessonCreate = true;
    const failRes = await createLesson(adminId, courseId, unitId, { position: 5 }, fixture.db);
    assert.equal(failRes.status, 503);
    assert.equal(fixture.state.lessons.has(5), false);
  });

  test('updateLesson updates position/isRequired, checks CAS rowVersion, and prevents duplicate position', async () => {
    const created = await fixture.db.lesson.create({ data: { unitId, position: 1, isRequired: true } });
    await fixture.db.lesson.create({ data: { unitId, position: 2, isRequired: true } });

    // Stale token returns 409 STALE_LESSON
    const stale = await updateLesson(
      adminId,
      courseId,
      unitId,
      created.id,
      { position: 3, isRequired: false, expectedRowVersion: '999' },
      fixture.db
    );
    assert.equal(stale.status, 409);
    assert.equal(stale.error?.code, 'STALE_LESSON');

    // Duplicate position with lesson 2 returns 409 DUPLICATE_LESSON_POSITION
    const duplicate = await updateLesson(
      adminId,
      courseId,
      unitId,
      created.id,
      { position: 2, isRequired: false, expectedRowVersion: '1' },
      fixture.db
    );
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.error?.code, 'DUPLICATE_LESSON_POSITION');

    // Valid update increments rowVersion
    const updated = await updateLesson(
      adminId,
      courseId,
      unitId,
      created.id,
      { position: 3, isRequired: false, expectedRowVersion: '1' },
      fixture.db
    );
    assert.equal(updated.status, 200);
    assert.equal(updated.data.data.position, 3);
    assert.equal(updated.data.data.isRequired, false);
    assert.equal(updated.data.data.rowVersion, '2');

    // Simulated failure after transaction start rolls back rowVersion bump
    fixture.fail.lessonUpdate = true;
    const failedUpdate = await updateLesson(
      adminId,
      courseId,
      unitId,
      created.id,
      { position: 4, isRequired: true, expectedRowVersion: '2' },
      fixture.db
    );
    assert.equal(failedUpdate.status, 503);
    assert.equal(fixture.state.lessons.get(created.id).rowVersion, 2n);
  });
});

describe('S5-03: Lesson Assignment, Reassignment & Concurrency Mechanics', () => {
  const adminId = '00000000-0000-4000-8000-000000000001';
  const teacherLanId = '11111111-1111-4111-8111-111111111111';
  const teacherMinhId = '22222222-2222-4222-8222-222222222222';
  const disabledTeacherId = '33333333-3333-4333-8333-333333333333';
  const courseId = '00000000-0000-0000-0000-000000000030';
  const unitId = '00000000-0000-0000-0000-000000000040';

  let fixture;
  let lessonId;

  beforeEach(async () => {
    fixture = lessonsFixture();
    fixture.state.accounts.set(adminId, {
      id: adminId,
      role: 'ADMIN',
      status: 'ACTIVE',
      displayName: 'Admin Quản Trị',
    });
    fixture.state.accounts.set(teacherLanId, {
      id: teacherLanId,
      role: 'TEACHER',
      status: 'ACTIVE',
      displayName: 'Nguyễn Thị Lan',
    });
    fixture.state.accounts.set(teacherMinhId, {
      id: teacherMinhId,
      role: 'TEACHER',
      status: 'ACTIVE',
      displayName: 'Trần Văn Minh',
    });
    fixture.state.accounts.set(disabledTeacherId, {
      id: disabledTeacherId,
      role: 'TEACHER',
      status: 'DISABLED',
      displayName: 'Lê Văn Khóa',
    });
    fixture.state.courses.set(courseId, {
      id: courseId,
      names: { vi: 'Tiếng Anh Giao Tiếp' },
    });
    fixture.state.units.set(unitId, {
      id: unitId,
      courseId,
      code: 'U1',
      names: { vi: 'Bài mở đầu' },
      position: 1,
    });

    const l = await fixture.db.lesson.create({ data: { unitId, position: 1, isRequired: true } });
    lessonId = l.id;
  });

  test('initial assignment atomically creates ContentAssignment, AssignmentHistory sequence 1, and bumps version', async () => {
    const res = await assignLesson(
      adminId,
      courseId,
      unitId,
      lessonId,
      { teacherId: teacherLanId, expectedRowVersion: '1' },
      fixture.db
    );

    assert.equal(res.status, 200);
    assert.equal(res.data.data.rowVersion, '2');
    assert.equal(res.data.data.assignment.currentTeacher.id, teacherLanId);
    assert.equal(res.data.data.assignment.currentTeacher.displayName, 'Nguyễn Thị Lan');
    assert.equal(res.data.data.assignment.generation, '1');

    // Assert DB state directly
    const assignment = [...fixture.state.assignments.values()].find((a) => a.lessonId === lessonId);
    assert.ok(assignment);
    assert.equal(assignment.currentTeacherId, teacherLanId);
    assert.equal(assignment.scopeGeneration, 1n);

    const history = [...fixture.state.histories.values()].filter((h) => h.assignmentId === assignment.id);
    assert.equal(history.length, 1);
    assert.equal(history[0].sequenceNo, 1);
    assert.equal(history[0].eventType, 'ASSIGNED');
    assert.equal(history[0].previousTeacherId, null);
    assert.equal(history[0].nextTeacherId, teacherLanId);
    assert.equal(history[0].changedBy, adminId);
  });

  test('same-teacher assignment is authoritative no-op: no version increment, no duplicate history episode', async () => {
    // 1. Initial assignment
    await assignLesson(
      adminId,
      courseId,
      unitId,
      lessonId,
      { teacherId: teacherLanId, expectedRowVersion: '1' },
      fixture.db
    );

    // 2. Same teacher assignment with new expectedRowVersion '2'
    const noopRes = await assignLesson(
      adminId,
      courseId,
      unitId,
      lessonId,
      { teacherId: teacherLanId, expectedRowVersion: '2' },
      fixture.db
    );

    assert.equal(noopRes.status, 200);
    assert.equal(noopRes.data.data.rowVersion, '2', 'Version must NOT bump on no-op');

    const assignment = [...fixture.state.assignments.values()].find((a) => a.lessonId === lessonId);
    const history = [...fixture.state.histories.values()].filter((h) => h.assignmentId === assignment.id);
    assert.equal(history.length, 1, 'No fake history episode created for same teacher');
  });

  test('reassignment atomically updates teacher, increments generation & sequence, and records old/new teachers', async () => {
    // Assign Lan
    await assignLesson(
      adminId,
      courseId,
      unitId,
      lessonId,
      { teacherId: teacherLanId, expectedRowVersion: '1' },
      fixture.db
    );

    // Reassign Minh
    const reassignRes = await assignLesson(
      adminId,
      courseId,
      unitId,
      lessonId,
      { teacherId: teacherMinhId, expectedRowVersion: '2' },
      fixture.db
    );

    assert.equal(reassignRes.status, 200);
    assert.equal(reassignRes.data.data.rowVersion, '3');
    assert.equal(reassignRes.data.data.assignment.currentTeacher.id, teacherMinhId);
    assert.equal(reassignRes.data.data.assignment.generation, '2');

    const assignment = [...fixture.state.assignments.values()].find((a) => a.lessonId === lessonId);
    assert.equal(assignment.scopeGeneration, 2n);

    const history = [...fixture.state.histories.values()]
      .filter((h) => h.assignmentId === assignment.id)
      .sort((a, b) => a.sequenceNo - b.sequenceNo);

    assert.equal(history.length, 2);
    assert.equal(history[1].sequenceNo, 2);
    assert.equal(history[1].eventType, 'REASSIGNED');
    assert.equal(history[1].previousTeacherId, teacherLanId);
    assert.equal(history[1].nextTeacherId, teacherMinhId);
    assert.equal(history[1].scopeGeneration, 2n);
  });

  test('assignment rejects target tampering (DISABLED, PENDING, ADMIN, LEARNER, missing)', async () => {
    // Target DISABLED teacher rejected
    const disabledRes = await assignLesson(
      adminId,
      courseId,
      unitId,
      lessonId,
      { teacherId: disabledTeacherId, expectedRowVersion: '1' },
      fixture.db
    );
    assert.equal(disabledRes.status, 409);
    assert.equal(disabledRes.error?.code, 'INVALID_TEACHER_TARGET');

    // Target ADMIN rejected
    const adminTarget = await assignLesson(
      adminId,
      courseId,
      unitId,
      lessonId,
      { teacherId: adminId, expectedRowVersion: '1' },
      fixture.db
    );
    assert.equal(adminTarget.status, 409);

    // Target missing account rejected
    const missingTarget = await assignLesson(
      adminId,
      courseId,
      unitId,
      lessonId,
      { teacherId: '99999999-9999-9999-9999-999999999999', expectedRowVersion: '1' },
      fixture.db
    );
    assert.equal(missingTarget.status, 409);
  });

  test('getTeacherOptions only lists ACTIVE Teachers', async () => {
    const opts = await getTeacherOptions(courseId, unitId, fixture.db);
    assert.equal(opts.status, 200);
    const list = opts.data.data;
    assert.equal(list.some((t) => t.id === teacherLanId), true);
    assert.equal(list.some((t) => t.id === teacherMinhId), true);
    assert.equal(list.some((t) => t.id === disabledTeacherId), false, 'Disabled teacher must be excluded');
    assert.equal(list.some((t) => t.id === adminId), false, 'Admin must be excluded');
  });

  test('disabled assigned teacher remains faithfully represented in Lesson DTO', async () => {
    // 1. Assign Lan
    await assignLesson(
      adminId,
      courseId,
      unitId,
      lessonId,
      { teacherId: teacherLanId, expectedRowVersion: '1' },
      fixture.db
    );

    // 2. Lan becomes disabled
    fixture.state.accounts.get(teacherLanId).status = 'DISABLED';

    // 3. Query lesson
    const res = await getLesson(courseId, unitId, lessonId, fixture.db);
    assert.equal(res.status, 200);
    assert.equal(res.data.data.assignment.currentTeacher.id, teacherLanId);
    assert.equal(res.data.data.assignment.currentTeacher.status, 'DISABLED');
  });

  test('failure during assignment rolls back assignment, history and Lesson version bump', async () => {
    fixture.fail.historyCreate = true;
    const failRes = await assignLesson(
      adminId,
      courseId,
      unitId,
      lessonId,
      { teacherId: teacherLanId, expectedRowVersion: '1' },
      fixture.db
    );
    assert.equal(failRes.status, 503);

    // Confirm total rollback: no assignment, no history, rowVersion stays 1n
    assert.equal(fixture.state.assignments.size, 0);
    assert.equal(fixture.state.histories.size, 0);
    assert.equal(fixture.state.lessons.get(lessonId).rowVersion, 1n);
  });
});

describe('S5-04: Teacher Workstream (List, Detail & Successor Draft Saves)', () => {
  const adminId = '00000000-0000-4000-8000-000000000001';
  const teacherLanId = '11111111-1111-4111-8111-111111111111';
  const teacherMinhId = '22222222-2222-4222-8222-222222222222';
  const courseId = '00000000-0000-0000-0000-000000000030';
  const unitId = '00000000-0000-0000-0000-000000000040';

  let fixture;
  let lessonLanId;
  let lessonMinhId;

  beforeEach(async () => {
    fixture = lessonsFixture();
    fixture.state.accounts.set(adminId, {
      id: adminId,
      role: 'ADMIN',
      status: 'ACTIVE',
      displayName: 'Admin Quản Trị',
    });
    fixture.state.accounts.set(teacherLanId, {
      id: teacherLanId,
      role: 'TEACHER',
      status: 'ACTIVE',
      displayName: 'Nguyễn Thị Lan',
    });
    fixture.state.accounts.set(teacherMinhId, {
      id: teacherMinhId,
      role: 'TEACHER',
      status: 'ACTIVE',
      displayName: 'Trần Văn Minh',
    });
    fixture.state.courses.set(courseId, {
      id: courseId,
      names: { vi: 'Tiếng Anh Giao Tiếp' },
    });
    fixture.state.units.set(unitId, {
      id: unitId,
      courseId,
      code: 'U1',
      names: { vi: 'Bài mở đầu' },
      position: 1,
    });

    const l1 = await fixture.db.lesson.create({ data: { unitId, position: 1, isRequired: true } });
    lessonLanId = l1.id;
    await assignLesson(adminId, courseId, unitId, lessonLanId, { teacherId: teacherLanId, expectedRowVersion: '1' }, fixture.db);

    const l2 = await fixture.db.lesson.create({ data: { unitId, position: 2, isRequired: true } });
    lessonMinhId = l2.id;
    await assignLesson(adminId, courseId, unitId, lessonMinhId, { teacherId: teacherMinhId, expectedRowVersion: '1' }, fixture.db);
  });

  test('listTeacherAssignedLessons only returns lessons assigned to caller teacher', async () => {
    const lanList = await listTeacherAssignedLessons(teacherLanId, fixture.db);
    assert.equal(lanList.status, 200);
    assert.equal(lanList.data.data.length, 1);
    assert.equal(lanList.data.data[0].id, lessonLanId);

    const minhList = await listTeacherAssignedLessons(teacherMinhId, fixture.db);
    assert.equal(minhList.status, 200);
    assert.equal(minhList.data.data.length, 1);
    assert.equal(minhList.data.data[0].id, lessonMinhId);
  });

  test('getTeacherLessonDetail returns 404 for unrelated lesson, never disclosing details', async () => {
    // Lan tries to view Minh's lesson -> 404 LESSON_NOT_FOUND
    const res = await getTeacherLessonDetail(teacherLanId, lessonMinhId, fixture.db);
    assert.equal(res.status, 404);
    assert.equal(res.error?.code, 'LESSON_NOT_FOUND');

    // Lan views own lesson -> 200
    const ownRes = await getTeacherLessonDetail(teacherLanId, lessonLanId, fixture.db);
    assert.equal(ownRes.status, 200);
    assert.equal(ownRes.data.data.id, lessonLanId);
    assert.equal(ownRes.data.data.highestRevision, null);
    assert.equal(ownRes.data.data.currentDraft, null);
  });

  test('first draft save creates revision 1, priorRevisionId null, and leaves activeRevisionId unchanged', async () => {
    const saveRes = await saveTeacherLessonDraft(
      teacherLanId,
      lessonLanId,
      {
        title: { vi: 'Bài 1: Lời chào', en: 'Lesson 1: Greetings' },
        contentBlocks: [{ type: 'paragraph', text: 'Chào mừng các bạn đến với khóa học.' }],
        changeSummary: 'Khởi tạo bài học',
        expectedRowVersion: '2', // Lesson bumped on assignment
      },
      fixture.db
    );

    assert.equal(saveRes.status, 200);
    assert.equal(saveRes.data.data.rowVersion, '3');
    assert.equal(saveRes.data.data.highestRevision.revisionNo, 1);
    assert.equal(saveRes.data.data.highestRevision.author.id, teacherLanId);
    assert.equal(saveRes.data.data.currentDraft.title.vi, 'Bài 1: Lời chào');
    assert.equal(saveRes.data.data.currentDraft.contentBlocks[0].text, 'Chào mừng các bạn đến với khóa học.');

    // Check Lesson.activeRevisionId remains null in DB!
    const lessonInDb = fixture.state.lessons.get(lessonLanId);
    assert.equal(lessonInDb.activeRevisionId, null);

    // Check revision row
    const rev1 = [...fixture.state.revisions.values()].find((r) => r.lessonId === lessonLanId && r.revisionNo === 1);
    assert.ok(rev1);
    assert.equal(rev1.priorRevisionId, null);
    assert.equal(rev1.createdBy, teacherLanId);
    assert.equal(rev1.lastEditedBy, teacherLanId);
    assert.equal(rev1.status, 'DRAFT');
  });

  test('second draft save appends revision 2, priorRevisionId points to rev 1, old revision untouched', async () => {
    // 1. First save
    await saveTeacherLessonDraft(
      teacherLanId,
      lessonLanId,
      {
        title: { vi: 'Bản 1', en: 'Draft 1' },
        contentBlocks: [{ type: 'paragraph', text: 'Đoạn 1' }],
        expectedRowVersion: '2',
      },
      fixture.db
    );

    const rev1Bytes = structuredClone([...fixture.state.revisions.values()].find((r) => r.revisionNo === 1));

    // 2. Second save
    const saveRes2 = await saveTeacherLessonDraft(
      teacherLanId,
      lessonLanId,
      {
        title: { vi: 'Bản 2 đã sửa' },
        contentBlocks: [
          { type: 'paragraph', text: 'Đoạn 1 đã sửa' },
          { type: 'paragraph', text: 'Đoạn 2 mới' },
        ],
        changeSummary: 'Bổ sung đoạn 2',
        expectedRowVersion: '3',
      },
      fixture.db
    );

    assert.equal(saveRes2.status, 200);
    assert.equal(saveRes2.data.data.rowVersion, '4');
    assert.equal(saveRes2.data.data.highestRevision.revisionNo, 2);
    assert.equal(saveRes2.data.data.revisions.length, 2);

    const rev2 = [...fixture.state.revisions.values()].find((r) => r.revisionNo === 2);
    assert.equal(rev2.priorRevisionId, rev1Bytes.id);

    // Check old revision 1 was NOT mutated
    const rev1Current = [...fixture.state.revisions.values()].find((r) => r.revisionNo === 1);
    assert.deepEqual(rev1Current.title, rev1Bytes.title);
    assert.deepEqual(rev1Current.contentBlocks, rev1Bytes.contentBlocks);
  });

  test('title merge preserves existing server locales (e.g. fr) while updating vi/en', async () => {
    // Seed revision with extra French locale
    const assignment = [...fixture.state.assignments.values()].find((a) => a.lessonId === lessonLanId);
    const episode = [...fixture.state.histories.values()].find((h) => h.assignmentId === assignment.id);

    await fixture.db.lessonRevision.create({
      data: {
        lessonId: lessonLanId,
        revisionNo: 1,
        assignmentId: assignment.id,
        creationAssignmentEpisodeId: episode.id,
        status: 'DRAFT',
        title: { vi: 'Gốc', en: 'Original', fr: 'Français' },
        contentBlocks: [],
        createdBy: teacherLanId,
        lastEditedBy: teacherLanId,
      },
    });

    const res = await saveTeacherLessonDraft(
      teacherLanId,
      lessonLanId,
      {
        title: { vi: 'Đã sửa vi', en: 'Updated en' },
        contentBlocks: [],
        expectedRowVersion: '2',
      },
      fixture.db
    );

    assert.equal(res.status, 200);
    const rev2 = [...fixture.state.revisions.values()].find((r) => r.revisionNo === 2);
    assert.equal(rev2.title.vi, 'Đã sửa vi');
    assert.equal(rev2.title.en, 'Updated en');
    assert.equal(rev2.title.fr, 'Français', 'French locale must be preserved');
  });

  test('unsupported title or blocks rejects save with 409 UNSUPPORTED_DRAFT_CONTENT', async () => {
    const assignment = [...fixture.state.assignments.values()].find((a) => a.lessonId === lessonLanId);
    const episode = [...fixture.state.histories.values()].find((h) => h.assignmentId === assignment.id);

    // Pre-existing revision has nonstring title value
    await fixture.db.lessonRevision.create({
      data: {
        lessonId: lessonLanId,
        revisionNo: 1,
        assignmentId: assignment.id,
        creationAssignmentEpisodeId: episode.id,
        status: 'DRAFT',
        title: { vi: 'Hợp lệ', bad: 12345 },
        contentBlocks: [],
        createdBy: teacherLanId,
        lastEditedBy: teacherLanId,
      },
    });

    const res = await saveTeacherLessonDraft(
      teacherLanId,
      lessonLanId,
      {
        title: { vi: 'Mới' },
        contentBlocks: [],
        expectedRowVersion: '2',
      },
      fixture.db
    );

    assert.equal(res.status, 409);
    assert.equal(res.error?.code, 'UNSUPPORTED_DRAFT_CONTENT');
  });

  test('revision-attached associations reject save with 409 UNSUPPORTED_DRAFT_CONTENT', async () => {
    const assignment = [...fixture.state.assignments.values()].find((a) => a.lessonId === lessonLanId);
    const episode = [...fixture.state.histories.values()].find((h) => h.assignmentId === assignment.id);

    const r = await fixture.db.lessonRevision.create({
      data: {
        lessonId: lessonLanId,
        revisionNo: 1,
        assignmentId: assignment.id,
        creationAssignmentEpisodeId: episode.id,
        status: 'DRAFT',
        title: { vi: 'Hợp lệ' },
        contentBlocks: [],
        createdBy: teacherLanId,
        lastEditedBy: teacherLanId,
      },
    });
    // Add exercise association count
    fixture.state.revisions.get(r.id)._count = { exercises: 1, vocabularyLinks: 0, mediaBindings: 0 };

    const res = await saveTeacherLessonDraft(
      teacherLanId,
      lessonLanId,
      {
        title: { vi: 'Mới' },
        contentBlocks: [],
        expectedRowVersion: '2',
      },
      fixture.db
    );

    assert.equal(res.status, 409);
    assert.equal(res.error?.code, 'UNSUPPORTED_DRAFT_CONTENT');
  });

  test('PUBLISHED highest revision permits a new draft successor without mutating the published revision', async () => {
    const assignment = [...fixture.state.assignments.values()].find((a) => a.lessonId === lessonLanId);
    const episode = [...fixture.state.histories.values()].find((h) => h.assignmentId === assignment.id);

    const publishedRevision = await fixture.db.lessonRevision.create({
      data: {
        lessonId: lessonLanId,
        revisionNo: 1,
        assignmentId: assignment.id,
        creationAssignmentEpisodeId: episode.id,
        status: 'PUBLISHED',
        title: { vi: 'Đã xuất bản' },
        contentBlocks: [],
        createdBy: teacherLanId,
        lastEditedBy: teacherLanId,
      },
    });

    const res = await saveTeacherLessonDraft(
      teacherLanId,
      lessonLanId,
      {
        title: { vi: 'Thử sửa' },
        contentBlocks: [],
        expectedRowVersion: '2',
      },
      fixture.db
    );

    assert.equal(res.status, 200);
    assert.equal(res.data?.data.highestRevision.revisionNo, 2);
    assert.equal(fixture.state.revisions.get(publishedRevision.id).status, 'PUBLISHED');
    assert.equal(fixture.state.revisions.get(publishedRevision.id).title.vi, 'Đã xuất bản');
  });

  test('highest DRAFT with submission provenance rejects save with 409 DRAFT_NOT_EDITABLE', async () => {
    const assignment = [...fixture.state.assignments.values()].find((a) => a.lessonId === lessonLanId);
    const episode = [...fixture.state.histories.values()].find((h) => h.assignmentId === assignment.id);

    const r = await fixture.db.lessonRevision.create({
      data: {
        lessonId: lessonLanId,
        revisionNo: 1,
        assignmentId: assignment.id,
        creationAssignmentEpisodeId: episode.id,
        status: 'DRAFT',
        title: { vi: 'Bản nộp' },
        contentBlocks: [],
        createdBy: teacherLanId,
        lastEditedBy: teacherLanId,
      },
    });
    fixture.state.revisions.get(r.id).submittedAt = new Date();
    fixture.state.revisions.get(r.id).submittedBy = teacherLanId;

    const res = await saveTeacherLessonDraft(
      teacherLanId,
      lessonLanId,
      {
        title: { vi: 'Thử sửa bản đã nộp' },
        contentBlocks: [],
        expectedRowVersion: '2',
      },
      fixture.db
    );

    assert.equal(res.status, 409);
    assert.equal(res.error?.code, 'DRAFT_NOT_EDITABLE');
  });

  test('save after reassignment binds new revision to new episode and teacher', async () => {
    // 1. Lan saves revision 1
    await saveTeacherLessonDraft(
      teacherLanId,
      lessonLanId,
      {
        title: { vi: 'Lan soạn' },
        contentBlocks: [{ type: 'paragraph', text: 'Nội dung Lan' }],
        expectedRowVersion: '2',
      },
      fixture.db
    );

    // 2. Admin reassigns to Minh (Lesson version becomes 4)
    await assignLesson(
      adminId,
      courseId,
      unitId,
      lessonLanId,
      { teacherId: teacherMinhId, expectedRowVersion: '3' },
      fixture.db
    );

    // 3. Minh saves successor revision 2
    const minhSave = await saveTeacherLessonDraft(
      teacherMinhId,
      lessonLanId,
      {
        title: { vi: 'Minh sửa tiếp' },
        contentBlocks: [{ type: 'paragraph', text: 'Nội dung Minh sửa' }],
        changeSummary: 'Minh tiếp quản biên soạn',
        expectedRowVersion: '4',
      },
      fixture.db
    );

    assert.equal(minhSave.status, 200);
    assert.equal(minhSave.data.data.highestRevision.revisionNo, 2);
    assert.equal(minhSave.data.data.highestRevision.author.id, teacherMinhId);

    const rev2 = [...fixture.state.revisions.values()].find((r) => r.revisionNo === 2);
    assert.equal(rev2.createdBy, teacherMinhId);
    assert.equal(rev2.lastEditedBy, teacherMinhId);

    const assignment = [...fixture.state.assignments.values()].find((a) => a.lessonId === lessonLanId);
    const latestEpisode = [...fixture.state.histories.values()]
      .filter((h) => h.assignmentId === assignment.id)
      .sort((a, b) => b.sequenceNo - a.sequenceNo)[0];

    assert.equal(rev2.creationAssignmentEpisodeId, latestEpisode.id);
  });

  test('CAS token mismatch on draft save returns 409 STALE_LESSON', async () => {
    const res = await saveTeacherLessonDraft(
      teacherLanId,
      lessonLanId,
      {
        title: { vi: 'Tiêu đề' },
        contentBlocks: [],
        expectedRowVersion: '999',
      },
      fixture.db
    );
    assert.equal(res.status, 409);
    assert.equal(res.error?.code, 'STALE_LESSON');
  });

  test('failure during revision save rolls back all revision writes and version bump', async () => {
    fixture.fail.revisionCreate = true;
    const failRes = await saveTeacherLessonDraft(
      teacherLanId,
      lessonLanId,
      {
        title: { vi: 'Thử lưu' },
        contentBlocks: [],
        expectedRowVersion: '2',
      },
      fixture.db
    );
    assert.equal(failRes.status, 503);
    assert.equal(fixture.state.revisions.size, 0);
    assert.equal(fixture.state.lessons.get(lessonLanId).rowVersion, 2n);
  });
});

describe('S5-05: Actual Route Handlers & Auth Role Guard Matrix', () => {
  const adminId = '00000000-0000-4000-8000-000000000001';
  const teacherLanId = '11111111-1111-4111-8111-111111111111';
  const courseId = '00000000-0000-0000-0000-000000000030';
  const unitId = '00000000-0000-0000-0000-000000000040';

  let fixture;
  let lessonId;

  beforeEach(async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    globalThis.fetch = async (url, opts) => {
      const cookies = currentCookieStore.getAll();
      const sessionCookie = cookies.find((c) => c.name?.includes('auth-token'));
      let userId = adminId;
      let email = 'admin@lingora.edu.vn';
      if (sessionCookie) {
        try {
          const decoded = JSON.parse(Buffer.from(sessionCookie.value.replace('base64-', ''), 'base64').toString());
          userId = decoded.user?.id || decoded.sub || userId;
          email = decoded.user?.email || email;
        } catch {}
      }
      return new Response(JSON.stringify({ id: userId, email }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    fixture = lessonsFixture();
    setProductPrismaForTest(fixture.db);

    fixture.state.accounts.set(adminId, {
      id: adminId,
      role: 'ADMIN',
      status: 'ACTIVE',
      displayName: 'Admin Quản Trị',
      uiLocale: 'vi',
    });
    fixture.state.accounts.set(teacherLanId, {
      id: teacherLanId,
      role: 'TEACHER',
      status: 'ACTIVE',
      displayName: 'Nguyễn Thị Lan',
      uiLocale: 'vi',
    });
    fixture.state.courses.set(courseId, {
      id: courseId,
      names: { vi: 'Tiếng Anh' },
    });
    fixture.state.units.set(unitId, {
      id: unitId,
      courseId,
      code: 'U1',
      names: { vi: 'Unit 1' },
      position: 1,
    });

    const l = await fixture.db.lesson.create({ data: { unitId, position: 1, isRequired: true } });
    lessonId = l.id;
  });

  afterEach(() => {
    setProductPrismaForTest(null);
    globalThis.fetch = originalFetch;
  });

  test('POST /api/courses/.../lessons enforces same-origin, json content-type and creates lesson', async () => {
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(adminId, 'admin@lingora.edu.vn')],
    };

    // 1. Foreign origin rejected 403 FORBIDDEN_ORIGIN
    const foreignReq = new Request(`http://localhost:3000/api/courses/${courseId}/units/${unitId}/lessons`, {
      method: 'POST',
      headers: {
        Origin: 'http://malicious.com',
        Host: 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ position: 2 }),
    });
    const resForeign = await postLessonsRoute(foreignReq, { params: Promise.resolve({ courseId, unitId }) });
    assert.equal(resForeign.status, 403);

    // 2. Non-json content-type rejected 415
    const textReq = new Request(`http://localhost:3000/api/courses/${courseId}/units/${unitId}/lessons`, {
      method: 'POST',
      headers: {
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
        'Content-Type': 'text/plain',
      },
      body: 'invalid',
    });
    const resText = await postLessonsRoute(textReq, { params: Promise.resolve({ courseId, unitId }) });
    assert.equal(resText.status, 415);

    // 3. Valid POST creates lesson 201
    const validReq = new Request(`http://localhost:3000/api/courses/${courseId}/units/${unitId}/lessons`, {
      method: 'POST',
      headers: {
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ position: 2, isRequired: true }),
    });
    const resValid = await postLessonsRoute(validReq, { params: Promise.resolve({ courseId, unitId }) });
    assert.equal(resValid.status, 201);
  });

  test('Admin is strictly forbidden on Teacher endpoints (403 FORBIDDEN)', async () => {
    // Admin session cookie
    currentCookieStore = {
      getAll: () => [createMockSessionCookie(adminId, 'admin@lingora.edu.vn')],
    };

    const reqList = new Request('http://localhost:3000/api/teacher/lessons');
    const resList = await getTeacherLessonsRoute(reqList);
    assert.equal(resList.status, 403);
    const bodyList = await resList.json();
    assert.equal(bodyList.error?.code, 'FORBIDDEN');

    const reqDetail = new Request(`http://localhost:3000/api/teacher/lessons/${lessonId}`);
    const resDetail = await getTeacherLessonDetailRoute(reqDetail, { params: Promise.resolve({ lessonId }) });
    assert.equal(resDetail.status, 403);

    const reqDraft = new Request(`http://localhost:3000/api/teacher/lessons/${lessonId}/draft`, {
      method: 'PATCH',
      headers: {
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: { vi: 'Thử' }, contentBlocks: [], expectedRowVersion: '1' }),
    });
    const resDraft = await patchTeacherDraftRoute(reqDraft, { params: Promise.resolve({ lessonId }) });
    assert.equal(resDraft.status, 403);
  });

  test('Disabled Teacher session is rejected with 403 ACCOUNT_INACTIVE', async () => {
    fixture.state.accounts.get(teacherLanId).status = 'DISABLED';

    currentCookieStore = {
      getAll: () => [createMockSessionCookie(teacherLanId, 'teacher.lan@lingora.edu.vn')],
    };

    const req = new Request('http://localhost:3000/api/teacher/lessons');
    const res = await getTeacherLessonsRoute(req);
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error?.code, 'ACCOUNT_INACTIVE');
  });

  test('Teacher successfully invokes GET /api/teacher/lessons and PATCH draft', async () => {
    // Assign Lan to lesson 1
    await assignLesson(adminId, courseId, unitId, lessonId, { teacherId: teacherLanId, expectedRowVersion: '1' }, fixture.db);

    currentCookieStore = {
      getAll: () => [createMockSessionCookie(teacherLanId, 'teacher.lan@lingora.edu.vn')],
    };

    // 1. GET /api/teacher/lessons returns assigned lesson
    const resList = await getTeacherLessonsRoute(new Request('http://localhost:3000/api/teacher/lessons'));
    assert.equal(resList.status, 200);
    const bodyList = await resList.json();
    assert.equal(bodyList.data.length, 1);
    assert.equal(bodyList.data[0].id, lessonId);

    // 2. PATCH draft saves draft successfully
    const draftReq = new Request(`http://localhost:3000/api/teacher/lessons/${lessonId}/draft`, {
      method: 'PATCH',
      headers: {
        Origin: 'http://localhost:3000',
        Host: 'localhost:3000',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: { vi: 'Bài học 1: Chào hỏi', en: 'Lesson 1' },
        contentBlocks: [{ type: 'paragraph', text: 'Xin chào các em.' }],
        changeSummary: 'Lưu bản đầu tiên',
        expectedRowVersion: '2',
      }),
    });
    const resDraft = await patchTeacherDraftRoute(draftReq, { params: Promise.resolve({ lessonId }) });
    assert.equal(resDraft.status, 200);
    const bodyDraft = await resDraft.json();
    assert.equal(bodyDraft.data.highestRevision.revisionNo, 1);
    assert.equal(bodyDraft.data.currentDraft.title.vi, 'Bài học 1: Chào hỏi');
  });
});
