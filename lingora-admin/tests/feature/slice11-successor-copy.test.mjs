import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { lessonsFixture } from './harness/lessons-fixture.mjs';

let currentCookieStore = { getAll: () => [], get: () => undefined, set: () => {}, delete: () => {} };
mock.module('next/headers.js', { exports: { cookies: async () => currentCookieStore } });
mock.module('next/navigation.js', {
  exports: {
    notFound: () => { throw new Error('NEXT_NOT_FOUND'); },
    redirect: (url) => { throw new Error(`NEXT_REDIRECT:${url}`); },
    useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
    usePathname: () => '/review',
  },
});
mock.module('server-only', { exports: {} });

const {
  assignLesson,
  saveTeacherLessonDraft,
  submitTeacherLesson,
  approveReview,
  publishReview,
  hasUnsupportedRevisionAssociations,
} = await import('../../src/server/lessons/index.ts');
const { unsupportedChildren } = await import('../../src/server/lessons/snapshot.ts');
const { setProductPrismaForTest } = await import('../../src/server/db/index.js');

const adminId = '00000000-0000-4000-8000-000000000001';
const teacherId = '11111111-1111-4111-8111-111111111111';
const courseId = '33333333-3333-4333-8333-333333333333';
const unitId = '44444444-4444-4444-8444-444444444444';
const lessonId = '55555555-5555-4555-8555-555555555555';
const languageId = 'eeeeeeee-1111-4111-8111-111111111111';

const assignmentId = 'aaaaaaaa-1111-4111-8111-111111111111';
const episodeId = 'bbbbbbbb-1111-4111-8111-111111111111';

function mockSessionCookie(userId) {
  const payload = { sub: userId, email: `${userId}@lingora.test`, exp: Math.floor(Date.now() / 1000) + 3600 };
  const session = {
    access_token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`,
    refresh_token: 'test-refresh-token', token_type: 'bearer', expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: userId, email: payload.email },
  };
  return { name: 'sb-test-project-ref-auth-token', value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}` };
}

describe('Slice 11: Narrow Staff Snapshot Successor-Copy Guard & Regressions', () => {
  let fixture;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project-ref.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    currentCookieStore = { getAll: () => [mockSessionCookie(teacherId)], get: () => mockSessionCookie(teacherId), set: () => {}, delete: () => {} };
    fixture = lessonsFixture();
    setProductPrismaForTest(fixture.db);

    fixture.state.accounts.set(adminId, { id: adminId, role: 'ADMIN', status: 'ACTIVE', displayName: 'Quản trị viên' });
    fixture.state.accounts.set(teacherId, { id: teacherId, role: 'TEACHER', status: 'ACTIVE', displayName: 'Cô Hương' });
    fixture.state.courses.set(courseId, { id: courseId, languageId, names: { vi: 'Tiếng Anh', en: 'English' }, isActive: false });
    fixture.state.units.set(unitId, { id: unitId, courseId, code: 'UNIT-01', position: 1, names: { vi: 'Khởi động', en: 'Warm Up' } });
    fixture.state.lessons.set(lessonId, {
      id: lessonId, unitId, position: 1, isRequired: true, availability: 'PLANNED',
      activeRevisionId: null, rowVersion: 1n, createdAt: new Date(), updatedAt: new Date(),
    });
    fixture.state.assignments.set(assignmentId, {
      id: assignmentId, lessonId, createdBy: adminId, currentTeacherId: teacherId,
      scopeGeneration: 1n, rowVersion: 1n, requirement: {}, scope: {},
    });
    fixture.state.histories.set(episodeId, {
      id: episodeId, assignmentId, sequenceNo: 1, eventType: 'ASSIGNED', previousTeacherId: null,
      nextTeacherId: teacherId, scopeGeneration: 1n, changedBy: adminId, scopeSnapshot: { unit: 'UNIT-01' },
      changedAt: new Date(), createdAt: new Date(),
    });
  });

  afterEach(() => {
    setProductPrismaForTest(null);
  });

  test('Staff successor-copy: PUBLISHED revision X with attempts allows successor draft Y creation', async () => {

    // 2. Teacher authors revision 1 (X) with 1 core exercise
    const resDraftX = await saveTeacherLessonDraft(teacherId, lessonId, {
      title: { vi: 'Bài 1: Làm quen' },
      contentBlocks: [{ type: 'paragraph', text: 'Chào mừng các bạn.' }],
      expectedRowVersion: fixture.state.lessons.get(lessonId).rowVersion.toString(),
      exercises: [
        {
          position: 1,
          isCore: true,
          type: 'MCQ',
          promptData: {
            prompt: 'Chọn từ chào hỏi:',
            options: [
              { id: 'opt-1', text: 'Hello' },
              { id: 'opt-2', text: 'Goodbye' },
            ],
          },
          gradingData: {
            correctOptionId: 'opt-1',
          },
        },
      ],
      vocabulary: [],
    }, fixture.db);

    assert.equal(resDraftX.status, 200);
    const revX = resDraftX.data.data.highestRevision;
    const revXId = revX.id;
    const exXId = resDraftX.data.data.exercises[0].id;

    // 3. Submit -> Approve -> Publish revision X
    const resSubmit = await submitTeacherLesson(teacherId, lessonId, {
      revisionId: revXId,
      expectedLessonRowVersion: resDraftX.data.data.rowVersion,
      expectedRevisionRowVersion: revX.rowVersion,
    }, fixture.db);
    assert.equal(resSubmit.status, 200);

    const submissionId = resSubmit.data.submissionId;
    const subRev = fixture.state.revisions.get(revXId);
    const resApprove = await approveReview(adminId, submissionId, {
      expectedRevisionRowVersion: subRev.rowVersion.toString(),
    }, fixture.db);
    assert.equal(resApprove.status, 200);

    const appRev = fixture.state.revisions.get(revXId);
    const resPublish = await publishReview(adminId, submissionId, {
      expectedRevisionRowVersion: appRev.rowVersion.toString(),
      expectedLessonRowVersion: fixture.state.lessons.get(lessonId).rowVersion.toString(),
    }, fixture.db);
    assert.equal(resPublish.status, 200);

    // Verify revision X is PUBLISHED
    const pubRevX = fixture.state.revisions.get(revXId);
    assert.equal(pubRevX.status, 'PUBLISHED');

    // 4. Simulate Learner practice attempts on revision X
    // In product DB, learners create LessonAttempt rows referencing revision X.
    // _count.attempts becomes > 0
    pubRevX._count = { ...pubRevX._count, attempts: 12 };

    // 5. Verify the guard helper directly:
    // With allowFrozenPredecessor = false (e.g. in-place edit check), attempts > 0 IS unsupported
    assert.equal(
      unsupportedChildren(pubRevX, languageId, false),
      true,
      'In-place editing or unprivileged check on revision with attempts must be unsupported'
    );
    // With allowFrozenPredecessor = true (successor copy check), attempts > 0 IS allowed!
    assert.equal(
      unsupportedChildren(pubRevX, languageId, true),
      false,
      'Successor copy check with allowFrozenPredecessor = true must allow published predecessor with attempts'
    );

    // 6. Teacher creates successor draft revision 2 (Y) copying from X
    const currentLesson = fixture.state.lessons.get(lessonId);
    const resDraftY = await saveTeacherLessonDraft(teacherId, lessonId, {
      title: { vi: 'Bài 1: Làm quen (Bản mới)' },
      contentBlocks: [{ type: 'paragraph', text: 'Chào mừng các bạn đến với bản cập nhật.' }],
      expectedRowVersion: currentLesson.rowVersion.toString(),
      expectedRevisionId: revXId,
      exercises: [
        {
          sourceExerciseId: exXId,
          position: 1,
          isCore: true,
          type: 'MCQ',
          promptData: {
            prompt: 'Chọn từ chào hỏi phổ biến:',
            options: [
              { id: 'opt-1', text: 'Hello' },
              { id: 'opt-2', text: 'Goodbye' },
            ],
          },
          gradingData: {
            correctOptionId: 'opt-1',
          },
        },
      ],
      vocabulary: [],
    }, fixture.db);

    assert.equal(resDraftY.status, 200, 'Successor draft Y creation must succeed even when X has attempts');
    const revY = resDraftY.data.data.highestRevision;
    assert.equal(revY.revisionNo, 2);
    assert.equal(revY.status, 'DRAFT');

    // 7. Verify X attempts and revision data remain untouched
    const verifiedX = fixture.state.revisions.get(revXId);
    assert.equal(verifiedX.status, 'PUBLISHED');
    assert.equal(verifiedX._count.attempts, 12);
    const exerciseX = fixture.state.lessonExercises.get(exXId);
    assert.ok(exerciseX);
    assert.equal(exerciseX.lessonRevisionId, revXId);
  });
});
