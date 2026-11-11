import { test, describe, before, after, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import pkg from 'pg';
import { PrismaClient } from '../../generated/product-client/index.js';
import { seed } from '../../prisma/product/seed.mjs';
import { validateOwnedDatabaseUrl } from '../../../scripts/test-guard-utils.mjs';
import {
  installNetworkGuard,
  assertNoForbiddenOutbound,
} from '../../../scripts/test-network-guard.mjs';

// Setup cookie mock for Next.js App Router API routes
let currentCookieStore = { getAll: () => [], get: () => undefined, set: () => {}, delete: () => {} };
mock.module('next/headers.js', { exports: { cookies: async () => currentCookieStore } });
mock.module('server-only', { exports: {} });

const {
  createReviewComment,
  resolveReviewComment,
  reopenReviewComment,
  getRevisionComments,
} = await import('../../src/server/lessons/comments.ts');

const { setProductPrismaForTest } = await import('../../src/server/db/index.js');

const { POST: postCommentRoute, GET: getRevisionCommentsRoute } = await import(
  '../../src/app/api/lessons/[lessonId]/revisions/[revisionId]/comments/route.ts'
);
const { GET: getLessonCommentsRoute } = await import(
  '../../src/app/api/lessons/[lessonId]/comments/route.ts'
);
const { PATCH: resolveCommentRoute } = await import(
  '../../src/app/api/lessons/[lessonId]/comments/[commentId]/resolve/route.ts'
);
const { PATCH: reopenCommentRoute } = await import(
  '../../src/app/api/lessons/[lessonId]/comments/[commentId]/reopen/route.ts'
);

const { Client } = pkg;

const guard = validateOwnedDatabaseUrl();
const databaseUrl = guard.ownedUrl;
const pgPort = Number(guard.parsedUrl.port || 5432);

installNetworkGuard({ allowedPorts: [pgPort] });

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
  log: [],
});

let pgClient;

const testAdminId = '00000000-0000-4000-8000-000000000001';
const testTeacherId = '11111111-1111-4111-8111-111111111111';
const unassignedTeacherId = '33333333-3333-4333-8333-333333333333';
const testLearnerId = '22222222-2222-4222-8222-222222222222';

let unitId;
let courseId;
let lessonId;
let revisionId;
let assignmentId;
let episodeId;
let itemIdentityId;
let itemRevisionId;

function mockSessionCookie(userId) {
  const payload = { sub: userId, email: `${userId}@lingora.test`, exp: Math.floor(Date.now() / 1000) + 3600 };
  const session = {
    access_token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`,
    refresh_token: 'test-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: userId, email: payload.email },
  };
  return { name: 'sb-test-project-ref-auth-token', value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}` };
}

function setTestActorSession(userId) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project-ref.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  globalThis.fetch = async () => Response.json({ id: userId, email: `${userId}@lingora.test` });
  currentCookieStore = {
    getAll: () => [mockSessionCookie(userId)],
    get: (name) => (name.includes('auth-token') ? mockSessionCookie(userId) : undefined),
    set: () => {},
    delete: () => {},
  };
}

before(async () => {
  await prisma.$connect();
  setProductPrismaForTest(prisma);
  pgClient = new Client({ connectionString: databaseUrl });
  await pgClient.connect();
  await seed(prisma);

  // 1. Get seeded unit
  const unit = await prisma.unit.findFirst({
    include: { course: true },
  });
  assert.ok(unit, 'Seeded unit must exist');
  unitId = unit.id;
  courseId = unit.courseId;

  // 2. Ensure test accounts exist in auth.users and app.accounts
  await pgClient.query(`
    INSERT INTO auth.users (id, email) VALUES
      ('${testAdminId}', 'admin.test@lingora.test'),
      ('${testTeacherId}', 'teacher.test@lingora.test'),
      ('${unassignedTeacherId}', 'unassigned.test@lingora.test'),
      ('${testLearnerId}', 'learner.test@lingora.test')
    ON CONFLICT (id) DO NOTHING;
  `);

  await pgClient.query(`
    INSERT INTO app.accounts (id, role, status, display_name, ui_locale, created_at, updated_at)
    VALUES
      ('${testAdminId}', 'ADMIN', 'ACTIVE', 'Admin Test', 'vi', NOW(), NOW()),
      ('${testTeacherId}', 'TEACHER', 'ACTIVE', 'Teacher Test', 'vi', NOW(), NOW()),
      ('${unassignedTeacherId}', 'TEACHER', 'ACTIVE', 'Unassigned Teacher', 'vi', NOW(), NOW()),
      ('${testLearnerId}', 'LEARNER', 'ACTIVE', 'Learner Test', 'vi', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE';
  `);

  // 3. Create test lesson
  const lessonRes = await pgClient.query(`
    INSERT INTO app.lessons (unit_id, position, availability, row_version)
    VALUES ('${unitId}', 981, 'PLANNED', 1)
    RETURNING id;
  `);
  lessonId = lessonRes.rows[0].id;

  // 4. Create content assignment to testTeacherId
  const assignRes = await pgClient.query(`
    INSERT INTO app.content_assignments (lesson_id, current_teacher_id, created_by, scope_generation)
    VALUES ('${lessonId}', '${testTeacherId}', '${testAdminId}', 1)
    RETURNING id;
  `);
  assignmentId = assignRes.rows[0].id;

  const histRes = await pgClient.query(`
    INSERT INTO app.assignment_history (assignment_id, event_type, next_teacher_id, changed_by, sequence_no, scope_generation, reason)
    VALUES ('${assignmentId}', 'ASSIGNED', '${testTeacherId}', '${testAdminId}', 1, 1, 'ASSIGN')
    RETURNING id;
  `);
  episodeId = histRes.rows[0].id;

  // 5. Create lesson revision with V1 content (initially DRAFT so items can be attached)
  const revRes = await pgClient.query(`
    INSERT INTO app.lesson_revisions (
      lesson_id, assignment_id, revision_no, content_schema_version, status,
      created_by, last_edited_by, creation_assignment_episode_id, title, content_blocks, row_version
    ) VALUES (
      '${lessonId}', '${assignmentId}', 1, 1, 'DRAFT',
      '${testTeacherId}', '${testTeacherId}', '${episodeId}', '{"vi":"Bài học kiểm thử review comments"}', '[]', 1
    )
    RETURNING id;
  `);
  revisionId = revRes.rows[0].id;

  // 6. Insert canonical block into app.lesson_content_blocks
  await pgClient.query(`
    INSERT INTO app.lesson_content_blocks (
      lesson_revision_id, block_key, type, position, schema_version, content
    ) VALUES (
      '${revisionId}', 'heading-block-01', 'HEADING', 1, 1, '{"level": 2, "text": "Tiêu đề bài học V1"}'
    );
  `);

  // 7. Create exercise item identity & item revision linked to this lesson revision
  const itemRes = await pgClient.query(`
    INSERT INTO app.item_identities (origin, exact_fingerprint, created_by)
    VALUES ('PRACTICE', 'fp-comments-test-01', '${testTeacherId}')
    RETURNING id;
  `);
  itemIdentityId = itemRes.rows[0].id;

  const itemRevRes = await pgClient.query(`
    INSERT INTO app.item_revisions (
      item_id, revision_no, type, prompt_data, exact_fingerprint,
      created_by, creation_assignment_episode_id, authoring_lesson_revision_id
    ) VALUES (
      '${itemIdentityId}', 1, 'MCQ', '{"prompt":"Chọn đáp án đúng"}', 'fp-comments-test-01',
      '${testTeacherId}', '${episodeId}', '${revisionId}'
    )
    RETURNING id;
  `);
  itemRevisionId = itemRevRes.rows[0].id;

  // Link exercise in app.lesson_exercises
  await pgClient.query(`
    INSERT INTO app.lesson_exercises (
      lesson_revision_id, item_revision_id, item_id, position, is_core
    ) VALUES (
      '${revisionId}', '${itemRevisionId}', '${itemIdentityId}', 1, true
    );
  `);
});

after(async () => {
  await prisma.$disconnect();
  await pgClient.end();
  assertNoForbiddenOutbound();
});

describe('T09: Review Comments Backend Service & Postgres Integration', () => {
  let blockCommentId;
  let itemCommentId;
  let revisionCommentId;

  test('1. Admin creates block-anchored comment successfully', async () => {
    const res = await createReviewComment(
      testAdminId,
      revisionId,
      {
        body: 'Tiêu đề cần ngắn gọn hơn.',
        blockKey: 'heading-block-01',
      },
      prisma,
      lessonId
    );

    assert.equal(res.status, 201);
    assert.ok(res.data);
    assert.equal(res.data.status, 'OPEN');
    assert.equal(res.data.rowVersion, '1');
    assert.equal(res.data.blockKey, 'heading-block-01');
    assert.equal(res.data.itemRevisionId, null);
    assert.equal(res.data.author.id, testAdminId);
    assert.equal(res.data.body, 'Tiêu đề cần ngắn gọn hơn.');
    assert.equal(res.data.resolvedAt, null);
    assert.equal(res.data.resolvedBy, null);
    blockCommentId = res.data.id;
  });

  test('2. Admin creates item-anchored comment successfully', async () => {
    const res = await createReviewComment(
      testAdminId,
      revisionId,
      {
        body: 'Câu hỏi trắc nghiệm này cần bổ sung lời giải thích.',
        itemRevisionId,
      },
      prisma,
      lessonId
    );

    assert.equal(res.status, 201);
    assert.ok(res.data);
    assert.equal(res.data.status, 'OPEN');
    assert.equal(res.data.rowVersion, '1');
    assert.equal(res.data.blockKey, null);
    assert.equal(res.data.itemRevisionId, itemRevisionId);
    assert.equal(res.data.author.id, testAdminId);
    itemCommentId = res.data.id;
  });

  test('3. Admin creates revision-wide comment successfully (both blockKey & itemRevisionId null)', async () => {
    const res = await createReviewComment(
      testAdminId,
      revisionId,
      {
        body: 'Tổng quan bài học đáp ứng yêu cầu chất lượng nhưng cần bổ sung thêm ví dụ.',
      },
      prisma,
      lessonId
    );

    assert.equal(res.status, 201);
    assert.ok(res.data);
    assert.equal(res.data.status, 'OPEN');
    assert.equal(res.data.rowVersion, '1');
    assert.equal(res.data.blockKey, null);
    assert.equal(res.data.itemRevisionId, null);
    assert.equal(res.data.author.id, testAdminId);
    revisionCommentId = res.data.id;
  });

  test('4. Reject if blockKey does not exist in revision', async () => {
    const res = await createReviewComment(
      testAdminId,
      revisionId,
      {
        body: 'Nhận xét vào khối không tồn tại.',
        blockKey: 'non-existent-block-key',
      },
      prisma,
      lessonId
    );

    assert.equal(res.status, 400);
    assert.equal(res.error?.code, 'BLOCK_NOT_FOUND');
  });

  test('5. Reject if itemRevisionId does not belong to revision', async () => {
    const foreignItemRevisionId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
    const res = await createReviewComment(
      testAdminId,
      revisionId,
      {
        body: 'Nhận xét vào bài tập không tồn tại.',
        itemRevisionId: foreignItemRevisionId,
      },
      prisma,
      lessonId
    );

    assert.equal(res.status, 400);
    assert.equal(res.error?.code, 'ITEM_NOT_FOUND');
  });

  test('6. Reject if sending both blockKey and itemRevisionId', async () => {
    const res = await createReviewComment(
      testAdminId,
      revisionId,
      {
        body: 'Nhận xét vào cả 2 đích.',
        blockKey: 'heading-block-01',
        itemRevisionId,
      },
      prisma,
      lessonId
    );

    assert.equal(res.status, 400);
    assert.equal(res.error?.code, 'VALIDATION_ERROR');
  });

  test('7. Non-admin accounts (TEACHER, LEARNER) cannot create review comments (403)', async () => {
    const teacherRes = await createReviewComment(
      testTeacherId,
      revisionId,
      { body: 'Giáo viên cố tạo comment' },
      prisma,
      lessonId
    );
    assert.equal(teacherRes.status, 403);
    assert.equal(teacherRes.error?.code, 'FORBIDDEN');

    const learnerRes = await createReviewComment(
      testLearnerId,
      revisionId,
      { body: 'Học viên cố tạo comment' },
      prisma,
      lessonId
    );
    assert.equal(learnerRes.status, 403);
    assert.equal(learnerRes.error?.code, 'FORBIDDEN');
  });

  test('8. Assigned teacher resolves comment successfully', async () => {
    const beforeLesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    const beforeRev = await prisma.lessonRevision.findUnique({ where: { id: revisionId } });

    const res = await resolveReviewComment(
      testTeacherId,
      blockCommentId,
      '1',
      prisma,
      lessonId
    );

    assert.equal(res.status, 200);
    assert.ok(res.data);
    assert.equal(res.data.status, 'RESOLVED');
    assert.equal(res.data.rowVersion, '2');
    assert.equal(res.data.resolvedBy?.id, testTeacherId);
    assert.ok(res.data.resolvedAt);

    // Verify Lesson and LessonRevision rowVersion are UNTOUCHED
    const afterLesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    const afterRev = await prisma.lessonRevision.findUnique({ where: { id: revisionId } });
    assert.equal(afterLesson.rowVersion, beforeLesson.rowVersion);
    assert.equal(afterRev.rowVersion, beforeRev.rowVersion);
  });

  test('9. Unassigned teacher or learner blocked from resolving comment (403)', async () => {
    const unassignedRes = await resolveReviewComment(
      unassignedTeacherId,
      itemCommentId,
      '1',
      prisma,
      lessonId
    );
    assert.equal(unassignedRes.status, 403);
    assert.equal(unassignedRes.error?.code, 'FORBIDDEN');

    const learnerRes = await resolveReviewComment(
      testLearnerId,
      itemCommentId,
      '1',
      prisma,
      lessonId
    );
    assert.equal(learnerRes.status, 403);
    assert.equal(learnerRes.error?.code, 'FORBIDDEN');
  });

  test('9b. Reassigned teacher is blocked under transaction lock from resolving comment (403)', async () => {
    // Create an open comment for testTeacherId
    const createRes = await createReviewComment(
      testAdminId,
      revisionId,
      {
        body: 'Comment before reassignment',
        blockKey: 'heading-block-01',
      },
      prisma,
      lessonId
    );
    assert.equal(createRes.status, 201);
    const reassignedCommentId = createRes.data?.id;

    // Reassign lesson from testTeacherId to unassignedTeacherId
    await prisma.contentAssignment.update({
      where: { id: assignmentId },
      data: { currentTeacherId: unassignedTeacherId },
    });

    try {
      // Former teacher (testTeacherId) attempts to resolve -> must be rejected with 403 FORBIDDEN
      const oldTeacherRes = await resolveReviewComment(
        testTeacherId,
        reassignedCommentId,
        '1',
        prisma,
        lessonId
      );
      assert.equal(oldTeacherRes.status, 403);
      assert.equal(oldTeacherRes.error?.code, 'FORBIDDEN');
      assert.equal(oldTeacherRes.error?.message, 'Bạn không có quyền xử lý nhận xét này.');

      // Newly assigned teacher CAN resolve
      const newTeacherRes = await resolveReviewComment(
        unassignedTeacherId,
        reassignedCommentId,
        '1',
        prisma,
        lessonId
      );
      assert.equal(newTeacherRes.status, 200);
      assert.equal(newTeacherRes.data?.data?.status, 'RESOLVED');
    } finally {
      // Restore assignment back to testTeacherId
      await prisma.contentAssignment.update({
        where: { id: assignmentId },
        data: { currentTeacherId: testTeacherId },
      });
    }
  });

  test('10. Concurrency CAS: 2 concurrent tasks resolving same comment at rowVersion 1 -> exactly one 200, one 409', async () => {
    // Create new OPEN comment for concurrency testing
    const createRes = await createReviewComment(
      testAdminId,
      revisionId,
      { body: 'Concurrent resolve test comment' },
      prisma,
      lessonId
    );
    assert.equal(createRes.status, 201);
    const concCommentId = createRes.data.id;
    assert.equal(createRes.data.rowVersion, '1');

    // Fire 2 concurrent resolves with expectedRowVersion: '1'
    const [res1, res2] = await Promise.all([
      resolveReviewComment(testTeacherId, concCommentId, '1', prisma, lessonId),
      resolveReviewComment(testAdminId, concCommentId, '1', prisma, lessonId),
    ]);

    const statuses = [res1.status, res2.status].sort();
    assert.deepEqual(statuses, [200, 409], 'Exactly one must succeed with 200, one must fail with 409 STALE_RECORD');

    const failed = res1.status === 409 ? res1 : res2;
    assert.equal(failed.error?.code, 'STALE_RECORD');
  });

  test('11. Resolving already RESOLVED comment fails with 409 INVALID_STATE', async () => {
    const res = await resolveReviewComment(
      testTeacherId,
      blockCommentId,
      '2',
      prisma,
      lessonId
    );
    assert.equal(res.status, 409);
    assert.equal(res.error?.code, 'INVALID_STATE');
  });

  test('12. Admin reopens comment successfully (status back to OPEN, clears resolvedAt/resolvedBy, increments rowVersion)', async () => {
    const res = await reopenReviewComment(
      testAdminId,
      blockCommentId,
      '2',
      prisma,
      lessonId
    );

    assert.equal(res.status, 200);
    assert.ok(res.data);
    assert.equal(res.data.status, 'OPEN');
    assert.equal(res.data.rowVersion, '3');
    assert.equal(res.data.resolvedAt, null);
    assert.equal(res.data.resolvedBy, null);
  });

  test('13. Non-admin (even assigned TEACHER) cannot reopen comment (403)', async () => {
    // Resolve comment again to rowVersion 4
    const resolveRes = await resolveReviewComment(
      testTeacherId,
      blockCommentId,
      '3',
      prisma,
      lessonId
    );
    assert.equal(resolveRes.status, 200);
    assert.equal(resolveRes.data.rowVersion, '4');

    // Teacher attempts to reopen
    const teacherReopen = await reopenReviewComment(
      testTeacherId,
      blockCommentId,
      '4',
      prisma,
      lessonId
    );
    assert.equal(teacherReopen.status, 403);
    assert.equal(teacherReopen.error?.code, 'FORBIDDEN');

    // Learner attempts to reopen
    const learnerReopen = await reopenReviewComment(
      testLearnerId,
      blockCommentId,
      '4',
      prisma,
      lessonId
    );
    assert.equal(learnerReopen.status, 403);
    assert.equal(learnerReopen.error?.code, 'FORBIDDEN');
  });

  test('14. Concurrency CAS: 2 concurrent tasks reopening same comment at rowVersion 4 -> exactly one 200, one 409', async () => {
    const [res1, res2] = await Promise.all([
      reopenReviewComment(testAdminId, blockCommentId, '4', prisma, lessonId),
      reopenReviewComment(testAdminId, blockCommentId, '4', prisma, lessonId),
    ]);

    const statuses = [res1.status, res2.status].sort();
    assert.deepEqual(statuses, [200, 409], 'Exactly one must succeed with 200, one must fail with 409 STALE_RECORD');

    const failed = res1.status === 409 ? res1 : res2;
    assert.equal(failed.error?.code, 'STALE_RECORD');
  });

  test('15. getRevisionComments retrieves comments for the lesson across revisions', async () => {
    // Admin reads comments
    const adminRes = await getRevisionComments(testAdminId, lessonId, prisma);
    assert.equal(adminRes.status, 200);
    assert.ok(Array.isArray(adminRes.data.comments));
    assert.ok(adminRes.data.comments.length >= 3);

    // Assigned Teacher reads comments
    const teacherRes = await getRevisionComments(testTeacherId, lessonId, prisma);
    assert.equal(teacherRes.status, 200);
    assert.equal(teacherRes.data.comments.length, adminRes.data.comments.length);

    // Unassigned Teacher is forbidden
    const unassignedRes = await getRevisionComments(unassignedTeacherId, lessonId, prisma);
    assert.equal(unassignedRes.status, 403);
    assert.equal(unassignedRes.error?.code, 'FORBIDDEN');

    // Learner is forbidden
    const learnerRes = await getRevisionComments(testLearnerId, lessonId, prisma);
    assert.equal(learnerRes.status, 403);
    assert.equal(learnerRes.error?.code, 'FORBIDDEN');
  });
});

describe('T09: HTTP Route Handlers Integration & Protections', () => {
  let routeCommentId;

  beforeEach(() => {
    setTestActorSession(testAdminId);
  });

  test('1. POST /api/lessons/.../comments enforces origin and content-type', async () => {
    // Foreign origin -> 403
    const badOriginReq = new Request(
      `http://localhost/api/lessons/${lessonId}/revisions/${revisionId}/comments`,
      {
        method: 'POST',
        headers: {
          Origin: 'https://evil.attacker.test',
          Host: 'localhost',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: 'Attack comment' }),
      }
    );
    const badOriginRes = await postCommentRoute(badOriginReq, {
      params: Promise.resolve({ lessonId, revisionId }),
    });
    assert.equal(badOriginRes.status, 403);
    const originBody = await badOriginRes.json();
    assert.equal(originBody.error?.code, 'FORBIDDEN_ORIGIN');

    // Non-JSON content-type -> 415
    const badTypeReq = new Request(
      `http://localhost/api/lessons/${lessonId}/revisions/${revisionId}/comments`,
      {
        method: 'POST',
        headers: {
          Origin: 'http://localhost',
          Host: 'localhost',
          'Content-Type': 'text/plain',
        },
        body: 'body=plain+text',
      }
    );
    const badTypeRes = await postCommentRoute(badTypeReq, {
      params: Promise.resolve({ lessonId, revisionId }),
    });
    assert.equal(badTypeRes.status, 415);
    const typeBody = await badTypeRes.json();
    assert.equal(typeBody.error?.code, 'UNSUPPORTED_MEDIA_TYPE');
  });

  test('2. POST /api/lessons/.../comments creates comment for ADMIN with 201', async () => {
    setTestActorSession(testAdminId);

    const validReq = new Request(
      `http://localhost/api/lessons/${lessonId}/revisions/${revisionId}/comments`,
      {
        method: 'POST',
        headers: {
          Origin: 'http://localhost',
          Host: 'localhost',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: 'HTTP route comment test',
          blockKey: 'heading-block-01',
        }),
      }
    );
    const res = await postCommentRoute(validReq, {
      params: Promise.resolve({ lessonId, revisionId }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.data || body.id);
    routeCommentId = (body.data?.id || body.id);
    assert.ok(routeCommentId);
  });

  test('3. PATCH /api/lessons/.../comments/[commentId]/resolve resolves comment for assigned TEACHER', async () => {
    setTestActorSession(testTeacherId);

    const validReq = new Request(
      `http://localhost/api/lessons/${lessonId}/comments/${routeCommentId}/resolve`,
      {
        method: 'PATCH',
        headers: {
          Origin: 'http://localhost',
          Host: 'localhost',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expectedRowVersion: '1',
        }),
      }
    );
    const res = await resolveCommentRoute(validReq, {
      params: Promise.resolve({ lessonId, commentId: routeCommentId }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    const comment = body.data || body;
    assert.equal(comment.status, 'RESOLVED');
    assert.equal(comment.rowVersion, '2');
  });

  test('4. PATCH /api/lessons/.../comments/[commentId]/reopen rejects TEACHER (403) and succeeds for ADMIN (200)', async () => {
    // Teacher attempt -> 403
    setTestActorSession(testTeacherId);
    const teacherReq = new Request(
      `http://localhost/api/lessons/${lessonId}/comments/${routeCommentId}/reopen`,
      {
        method: 'PATCH',
        headers: {
          Origin: 'http://localhost',
          Host: 'localhost',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expectedRowVersion: '2',
        }),
      }
    );
    const teacherRes = await reopenCommentRoute(teacherReq, {
      params: Promise.resolve({ lessonId, commentId: routeCommentId }),
    });
    assert.equal(teacherRes.status, 403);

    // Admin attempt -> 200
    setTestActorSession(testAdminId);
    const adminReq = new Request(
      `http://localhost/api/lessons/${lessonId}/comments/${routeCommentId}/reopen`,
      {
        method: 'PATCH',
        headers: {
          Origin: 'http://localhost',
          Host: 'localhost',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expectedRowVersion: '2',
        }),
      }
    );
    const adminRes = await reopenCommentRoute(adminReq, {
      params: Promise.resolve({ lessonId, commentId: routeCommentId }),
    });
    assert.equal(adminRes.status, 200);
    const body = await adminRes.json();
    const comment = body.data || body;
    assert.equal(comment.status, 'OPEN');
    assert.equal(comment.rowVersion, '3');
  });

  test('5. GET /api/lessons/.../comments retrieves comment list', async () => {
    setTestActorSession(testTeacherId);

    const getReq = new Request(
      `http://localhost/api/lessons/${lessonId}/comments`,
      {
        method: 'GET',
        headers: {
          Origin: 'http://localhost',
          Host: 'localhost',
        },
      }
    );
    const res = await getLessonCommentsRoute(getReq, {
      params: Promise.resolve({ lessonId }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    const comments = body.comments || body.data;
    assert.ok(Array.isArray(comments));
    assert.ok(comments.length >= 1);
  });
});
