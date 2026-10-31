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
  getTeacherLessonDetail,
  getReviewQueue,
  getReviewDetail,
  submitTeacherLesson,
  requestChangesReview,
  approveReview,
  publishReview,
} = await import('../../src/server/lessons/index.ts');
const { setProductPrismaForTest } = await import('../../src/server/db/index.js');
const { POST: submitRoute } = await import('../../src/app/api/teacher/lessons/[lessonId]/submit/route.ts');

const adminId = '00000000-0000-4000-8000-000000000001';
const teacherId = '11111111-1111-4111-8111-111111111111';
const nextTeacherId = '22222222-2222-4222-8222-222222222222';
const languageId = 'eeeeeeee-1111-4111-8111-111111111111';
const courseId = '33333333-3333-4333-8333-333333333333';
const unitId = '44444444-4444-4444-8444-444444444444';
const lessonId = '55555555-5555-4555-8555-555555555555';
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

describe('S7-WORKFLOW: exact revision submit, review and publication', () => {
  let fixture;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project-ref.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    globalThis.fetch = async () => Response.json({ id: teacherId });
    currentCookieStore = { getAll: () => [mockSessionCookie(teacherId)], get: () => mockSessionCookie(teacherId), set: () => {}, delete: () => {} };
    fixture = lessonsFixture();
    setProductPrismaForTest(fixture.db);
    fixture.state.accounts.set(adminId, { id: adminId, role: 'ADMIN', status: 'ACTIVE', displayName: 'Quản trị viên' });
    fixture.state.accounts.set(teacherId, { id: teacherId, role: 'TEACHER', status: 'ACTIVE', displayName: 'Cô Hương' });
    fixture.state.accounts.set(nextTeacherId, { id: nextTeacherId, role: 'TEACHER', status: 'ACTIVE', displayName: 'Thầy Hùng' });
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
    globalThis.fetch = originalFetch;
    setProductPrismaForTest(null);
  });

  async function createDraft(changeSummary = 'Initial draft') {
    const result = await saveTeacherLessonDraft(teacherId, lessonId, {
      title: { vi: 'Bài học kiểm duyệt', en: 'Review lesson' },
      contentBlocks: [{ type: 'paragraph', text: `Persisted ${changeSummary}` }],
      changeSummary,
      expectedRowVersion: fixture.state.lessons.get(lessonId).rowVersion.toString(),
      exercises: [{
        position: 1, isCore: true, type: 'MCQ',
        promptData: { prompt: 'Choose the answer', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] },
        gradingData: { correctOptionId: 'a' },
      }],
      vocabulary: [],
    }, fixture.db);
    assert.equal(result.status, 200);
    return result.data.data;
  }

  async function submitThroughApi(lesson) {
    currentCookieStore = { getAll: () => [mockSessionCookie(teacherId)], get: () => mockSessionCookie(teacherId), set: () => {}, delete: () => {} };
    const request = new Request(`https://lingora.test/api/teacher/lessons/${lessonId}/submit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://lingora.test', host: 'lingora.test' },
      body: JSON.stringify({
        revisionId: lesson.highestRevision.id,
        expectedLessonRowVersion: lesson.rowVersion,
        expectedRevisionRowVersion: lesson.highestRevision.rowVersion,
      }),
    });
    return submitRoute(request, { params: Promise.resolve({ lessonId }) });
  }

  test('API submit pins the saved revision, rejects a duplicate and keeps disabled submitter attribution', async () => {
    const draft = await createDraft();
    const response = await submitThroughApi(draft);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.highestRevision.id, draft.highestRevision.id);
    assert.equal(body.submissionId != null, true);

    const revision = fixture.state.revisions.get(draft.highestRevision.id);
    const submitEvent = fixture.state.revisionReviews.get(body.submissionId);
    assert.equal(revision.status, 'IN_REVIEW');
    assert.equal(revision.submittedBy, teacherId);
    assert.equal(submitEvent.lessonRevisionId, revision.id);
    assert.equal(submitEvent.assignmentEpisodeId, episodeId);
    assert.equal(fixture.state.lessons.get(lessonId).rowVersion, BigInt(draft.rowVersion) + 1n);
    assert.equal([...fixture.state.itemRevisions.values()][0].frozenAt instanceof Date, true);

    const duplicate = await submitTeacherLesson(teacherId, lessonId, {
      revisionId: revision.id,
      expectedLessonRowVersion: fixture.state.lessons.get(lessonId).rowVersion.toString(),
      expectedRevisionRowVersion: revision.rowVersion.toString(),
    }, fixture.db);
    assert.equal(duplicate.status, 409);
    assert.equal([...fixture.state.revisionReviews.values()].filter(r => r.action === 'SUBMIT').length, 1);

    const reassigned = await assignLesson(adminId, courseId, unitId, lessonId, {
      teacherId: nextTeacherId,
      expectedRowVersion: fixture.state.lessons.get(lessonId).rowVersion.toString(),
    }, fixture.db);
    assert.equal(reassigned.status, 200);
    assert.equal(fixture.state.revisionReviews.get(body.submissionId).actorId, teacherId);
    assert.equal(fixture.state.revisionReviews.get(body.submissionId).assignmentEpisodeId, episodeId);

    fixture.state.accounts.get(teacherId).status = 'DISABLED';
    const queue = await getReviewQueue(adminId, fixture.db);
    assert.equal(queue.status, 200);
    assert.equal(queue.data.data.length, 1);
    assert.equal(queue.data.data[0].revisionId, revision.id);
    const detail = await getReviewDetail(adminId, body.submissionId, fixture.db);
    assert.equal(detail.data.data.revision.id, revision.id);
    assert.equal(detail.data.data.revision.submitter.id, teacherId);
    assert.equal(detail.data.data.revision.contentBlocks[0].text, 'Persisted Initial draft');
    assert.equal(detail.data.data.assignmentEpisode.teacherName, 'Cô Hương');
  });

  test('request changes keeps the old snapshot; successor copies frozen items and publish stays isolated', async () => {
    const firstDraft = await createDraft('First');
    const firstSubmit = await submitTeacherLesson(teacherId, lessonId, {
      revisionId: firstDraft.highestRevision.id,
      expectedLessonRowVersion: firstDraft.rowVersion,
      expectedRevisionRowVersion: firstDraft.highestRevision.rowVersion,
    }, fixture.db);
    const firstSubmissionId = firstSubmit.data.submissionId;
    let revision = fixture.state.revisions.get(firstDraft.highestRevision.id);

    const assessmentBlueprintId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01';
    const assessmentItemId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02';
    const assessmentItemRevisionId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03';
    const assessmentSecretId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04';
    fixture.state.itemIdentities.set(assessmentItemId, {
      id: assessmentItemId, origin: 'ASSESSMENT', createdBy: teacherId, exactFingerprint: 'assessment-identity-fingerprint',
    });
    fixture.state.itemRevisions.set(assessmentItemRevisionId, {
      id: assessmentItemRevisionId, itemId: assessmentItemId, revisionNo: 1, type: 'MCQ',
      promptData: { prompt: 'Select the greeting.', options: [{ id: 'hello', text: 'Hello' }, { id: 'bye', text: 'Goodbye' }] },
      schemaVersion: 1, exactFingerprint: 'assessment-revision-fingerprint', createdBy: teacherId,
      creationAssignmentEpisodeId: episodeId, authoringLessonRevisionId: revision.id,
      assessmentBlueprintId, blueprintGeneration: 3n, isDraftOmitted: false,
      frozenAt: new Date('2026-10-31T00:00:00.000Z'), rowVersion: 1n, assessmentVersionItemsCount: 1,
    });
    fixture.state.itemGradingSecrets.set(assessmentSecretId, {
      id: assessmentSecretId, itemRevisionId: assessmentItemRevisionId,
      gradingData: { correctOptionId: 'hello' }, feedbackData: null, schemaVersion: 1,
    });

    const lockedAuthoring = await saveTeacherLessonDraft(teacherId, lessonId, {
      title: { vi: 'Không được sửa khi đang duyệt' }, contentBlocks: [],
      expectedRowVersion: fixture.state.lessons.get(lessonId).rowVersion.toString(),
      expectedRevisionId: revision.id,
    }, fixture.db);
    assert.equal(lockedAuthoring.status, 409);
    assert.equal(lockedAuthoring.error.code, 'DRAFT_NOT_EDITABLE');

    const unapprovedPublish = await publishReview(adminId, firstSubmissionId, {
      expectedRevisionRowVersion: revision.rowVersion.toString(),
      expectedLessonRowVersion: fixture.state.lessons.get(lessonId).rowVersion.toString(),
    }, fixture.db);
    assert.equal(unapprovedPublish.status, 409);
    assert.equal(unapprovedPublish.error.code, 'REVISION_CONFLICT');
    assert.equal(fixture.state.lessons.get(lessonId).activeRevisionId, null);

    const stale = await approveReview(adminId, firstSubmissionId, { expectedRevisionRowVersion: '1' }, fixture.db);
    assert.equal(stale.status, 409);
    assert.equal(fixture.state.revisions.get(revision.id).status, 'IN_REVIEW');
    assert.equal(fixture.state.revisionReviews.size, 1);

    const requested = await requestChangesReview(adminId, firstSubmissionId, {
      expectedRevisionRowVersion: revision.rowVersion.toString(),
      comment: 'Please clarify the example.',
    }, fixture.db);
    assert.equal(requested.status, 200);
    assert.equal(requested.data.data.revision.status, 'CHANGES_REQUESTED');
    assert.equal(requested.data.data.reviews.at(-1).actor.id, adminId);
    assert.equal(fixture.state.revisionReviews.get(requested.data.data.reviews.at(-1).id).assignmentEpisodeId, episodeId);
    const feedback = await getTeacherLessonDetail(teacherId, lessonId, fixture.db);
    assert.equal(feedback.data.data.latestFeedback.comment, 'Please clarify the example.');

    fixture.state.accounts.get(teacherId).status = 'ACTIVE';
    const successor = await saveTeacherLessonDraft(teacherId, lessonId, {
      title: { vi: 'Bài học sửa đổi', en: 'Revised lesson' },
      contentBlocks: [{ type: 'paragraph', text: 'Persisted second revision' }],
      expectedRowVersion: fixture.state.lessons.get(lessonId).rowVersion.toString(),
      expectedRevisionId: revision.id,
    }, fixture.db);
    assert.equal(successor.status, 200);
    const secondDraft = successor.data.data;
    assert.equal(secondDraft.highestRevision.revisionNo, 2);
    assert.notEqual(secondDraft.highestRevision.id, revision.id);
    assert.equal(fixture.state.itemRevisions.get([...fixture.state.lessonExercises.values()][0].itemRevisionId).frozenAt instanceof Date, true);
    const secondItemRevisions = [...fixture.state.itemRevisions.values()].filter(ir => ir.authoringLessonRevisionId === secondDraft.highestRevision.id);
    assert.equal(secondItemRevisions.length, 2);
    const copiedAssessmentRevision = secondItemRevisions.find(ir => ir.itemId === assessmentItemId);
    assert.ok(copiedAssessmentRevision);
    assert.notEqual(copiedAssessmentRevision.id, assessmentItemRevisionId);
    assert.equal(copiedAssessmentRevision.revisionNo, 2);
    assert.equal(copiedAssessmentRevision.createdBy, teacherId);
    assert.equal(copiedAssessmentRevision.creationAssignmentEpisodeId, episodeId);
    assert.equal(copiedAssessmentRevision.assessmentBlueprintId, assessmentBlueprintId);
    assert.equal(copiedAssessmentRevision.blueprintGeneration, 3n);
    assert.equal(copiedAssessmentRevision.frozenAt, null);
    assert.deepEqual(fixture.state.itemGradingSecrets.get(assessmentSecretId).gradingData, { correctOptionId: 'hello' });
    assert.ok([...fixture.state.itemGradingSecrets.values()].some(secret =>
      secret.itemRevisionId === copiedAssessmentRevision.id && secret.gradingData.correctOptionId === 'hello'));
    assert.equal(fixture.state.itemRevisions.get(assessmentItemRevisionId).frozenAt instanceof Date, true);

    // The submission ID still resolves the original revision even though a newer revision now exists.
    const pinned = await getReviewDetail(adminId, firstSubmissionId, fixture.db);
    assert.equal(pinned.data.data.revision.id, revision.id);
    assert.equal(pinned.data.data.revision.contentBlocks[0].text, 'Persisted First');

    const invalidOldApproval = await approveReview(adminId, firstSubmissionId, {
      expectedRevisionRowVersion: fixture.state.revisions.get(revision.id).rowVersion.toString(),
    }, fixture.db);
    assert.equal(invalidOldApproval.status, 409);
    assert.equal(fixture.state.revisions.get(secondDraft.highestRevision.id).status, 'DRAFT');

    const secondSubmit = await submitTeacherLesson(teacherId, lessonId, {
      revisionId: secondDraft.highestRevision.id,
      expectedLessonRowVersion: secondDraft.rowVersion,
      expectedRevisionRowVersion: secondDraft.highestRevision.rowVersion,
    }, fixture.db);
    assert.equal(secondSubmit.status, 200);
    fixture.state.accounts.get(teacherId).status = 'DISABLED';
    revision = fixture.state.revisions.get(secondDraft.highestRevision.id);

    const validVersionUnapprovedPublish = await publishReview(adminId, secondSubmit.data.submissionId, {
      expectedRevisionRowVersion: revision.rowVersion.toString(),
      expectedLessonRowVersion: fixture.state.lessons.get(lessonId).rowVersion.toString(),
    }, fixture.db);
    assert.equal(validVersionUnapprovedPublish.status, 409);
    assert.equal(validVersionUnapprovedPublish.error.code, 'REVISION_CONFLICT');

    const approved = await approveReview(adminId, secondSubmit.data.submissionId, {
      expectedRevisionRowVersion: revision.rowVersion.toString(), comment: 'Approved.',
    }, fixture.db);
    assert.equal(approved.status, 200);
    fixture.state.accounts.get(teacherId).status = 'ACTIVE';
    const lockedApprovedAuthoring = await saveTeacherLessonDraft(teacherId, lessonId, {
      title: { vi: 'Không được sửa sau phê duyệt' }, contentBlocks: [],
      expectedRowVersion: fixture.state.lessons.get(lessonId).rowVersion.toString(),
      expectedRevisionId: revision.id,
    }, fixture.db);
    assert.equal(lockedApprovedAuthoring.status, 409);
    assert.equal(lockedApprovedAuthoring.error.code, 'DRAFT_NOT_EDITABLE');
    fixture.state.accounts.get(teacherId).status = 'DISABLED';
    const stalePublish = await publishReview(adminId, secondSubmit.data.submissionId, {
      expectedRevisionRowVersion: fixture.state.revisions.get(revision.id).rowVersion.toString(),
      expectedLessonRowVersion: '1',
    }, fixture.db);
    assert.equal(stalePublish.status, 409);
    assert.equal(stalePublish.error.code, 'STALE_LESSON');
    fixture.calls.lockOrder.length = 0;
    const published = await publishReview(adminId, secondSubmit.data.submissionId, {
      expectedRevisionRowVersion: fixture.state.revisions.get(revision.id).rowVersion.toString(),
      expectedLessonRowVersion: fixture.state.lessons.get(lessonId).rowVersion.toString(),
    }, fixture.db);
    assert.equal(published.status, 200);
    assert.deepEqual(fixture.calls.lockOrder.slice(0, 3), ['lesson', 'review', 'revision']);
    assert.equal(fixture.state.lessons.get(lessonId).activeRevisionId, revision.id);
    assert.equal(fixture.state.lessons.get(lessonId).availability, 'PLANNED');
    assert.equal(fixture.state.revisions.get(revision.id).status, 'PUBLISHED');
    assert.equal(fixture.state.revisions.get(firstDraft.highestRevision.id).contentBlocks[0].text, 'Persisted First');

    fixture.state.accounts.get(teacherId).status = 'ACTIVE';
    const afterPublish = await saveTeacherLessonDraft(teacherId, lessonId, {
      title: { vi: 'Bản nháp sau xuất bản' },
      contentBlocks: [{ type: 'paragraph', text: 'Not published yet' }],
      expectedRowVersion: fixture.state.lessons.get(lessonId).rowVersion.toString(),
      expectedRevisionId: revision.id,
    }, fixture.db);
    assert.equal(afterPublish.status, 200);
    assert.equal(fixture.state.lessons.get(lessonId).activeRevisionId, revision.id);
    assert.equal(fixture.state.revisions.get(revision.id).status, 'PUBLISHED');
    assert.equal(fixture.state.revisions.get(revision.id).contentBlocks[0].text, 'Persisted second revision');

    const thirdDraft = afterPublish.data.data;
    const thirdSubmit = await submitTeacherLesson(teacherId, lessonId, {
      revisionId: thirdDraft.highestRevision.id,
      expectedLessonRowVersion: thirdDraft.rowVersion,
      expectedRevisionRowVersion: thirdDraft.highestRevision.rowVersion,
    }, fixture.db);
    assert.equal(thirdSubmit.status, 200);
    const thirdRevision = fixture.state.revisions.get(thirdDraft.highestRevision.id);
    const thirdApproved = await approveReview(adminId, thirdSubmit.data.submissionId, {
      expectedRevisionRowVersion: thirdRevision.rowVersion.toString(),
    }, fixture.db);
    assert.equal(thirdApproved.status, 200);
    const thirdPublished = await publishReview(adminId, thirdSubmit.data.submissionId, {
      expectedRevisionRowVersion: fixture.state.revisions.get(thirdRevision.id).rowVersion.toString(),
      expectedLessonRowVersion: fixture.state.lessons.get(lessonId).rowVersion.toString(),
    }, fixture.db);
    assert.equal(thirdPublished.status, 200);
    assert.equal(fixture.state.lessons.get(lessonId).activeRevisionId, thirdRevision.id);
    assert.equal(fixture.state.revisions.get(revision.id).status, 'ARCHIVED');
    assert.equal(fixture.state.revisions.get(revision.id).contentBlocks[0].text, 'Persisted second revision');
    const archiveEvent = [...fixture.state.revisionReviews.values()].find(r => r.lessonRevisionId === revision.id && r.action === 'ARCHIVE');
    assert.ok(archiveEvent);
    assert.equal(archiveEvent.actorId, adminId);
    assert.equal(archiveEvent.assignmentEpisodeId, episodeId);
  });

  test('unassigned teacher and invalid publish transition are rejected without writes', async () => {
    const draft = await createDraft('Ownership');
    const unassigned = await submitTeacherLesson(nextTeacherId, lessonId, {
      revisionId: draft.highestRevision.id,
      expectedLessonRowVersion: draft.rowVersion,
      expectedRevisionRowVersion: draft.highestRevision.rowVersion,
    }, fixture.db);
    assert.equal(unassigned.status, 404);
    assert.equal(fixture.state.revisionReviews.size, 0);

    const rejected = await publishReview(adminId, '99999999-9999-4999-8999-999999999999', {
      expectedRevisionRowVersion: '1', expectedLessonRowVersion: '1',
    }, fixture.db);
    assert.equal(rejected.status, 404);
    assert.equal(fixture.state.lessons.get(lessonId).activeRevisionId, null);
    assert.equal(fixture.state.revisions.get(draft.highestRevision.id).status, 'DRAFT');
  });

  test('disabled Teacher and structurally incomplete revision cannot be submitted', async () => {
    const draft = await createDraft('Disabled');
    fixture.state.accounts.get(teacherId).status = 'DISABLED';
    const disabled = await submitTeacherLesson(teacherId, lessonId, {
      revisionId: draft.highestRevision.id,
      expectedLessonRowVersion: draft.rowVersion,
      expectedRevisionRowVersion: draft.highestRevision.rowVersion,
    }, fixture.db);
    assert.equal(disabled.status, 403);
    assert.equal(fixture.state.revisionReviews.size, 0);
    fixture.state.accounts.get(teacherId).status = 'ACTIVE';

    const incomplete = await saveTeacherLessonDraft(teacherId, lessonId, {
      title: { vi: 'Thiếu bài tập' }, contentBlocks: [], expectedRowVersion: fixture.state.lessons.get(lessonId).rowVersion.toString(),
      expectedRevisionId: draft.highestRevision.id, exercises: [], vocabulary: [],
    }, fixture.db);
    assert.equal(incomplete.status, 200);
    const rejected = await submitTeacherLesson(teacherId, lessonId, {
      revisionId: incomplete.data.data.highestRevision.id,
      expectedLessonRowVersion: incomplete.data.data.rowVersion,
      expectedRevisionRowVersion: incomplete.data.data.highestRevision.rowVersion,
    }, fixture.db);
    assert.equal(rejected.status, 400);
    assert.equal(fixture.state.revisions.get(incomplete.data.data.highestRevision.id).status, 'DRAFT');
    assert.equal(fixture.state.revisionReviews.size, 0);
  });

  test('concurrent request-changes and approve append one winning transition only', async () => {
    const draft = await createDraft('Concurrent review');
    const submitted = await submitTeacherLesson(teacherId, lessonId, {
      revisionId: draft.highestRevision.id,
      expectedLessonRowVersion: draft.rowVersion,
      expectedRevisionRowVersion: draft.highestRevision.rowVersion,
    }, fixture.db);
    const submittedRevision = fixture.state.revisions.get(draft.highestRevision.id);
    const expectedRevisionRowVersion = submittedRevision.rowVersion.toString();
    const [changes, approval] = await Promise.all([
      requestChangesReview(adminId, submitted.data.submissionId, { expectedRevisionRowVersion }, fixture.db),
      approveReview(adminId, submitted.data.submissionId, { expectedRevisionRowVersion }, fixture.db),
    ]);
    assert.deepEqual([changes.status, approval.status].sort(), [200, 409]);
    assert.equal(fixture.state.revisionReviews.size, 2);
    const winner = changes.status === 200 ? 'CHANGES_REQUESTED' : 'APPROVED';
    assert.equal(fixture.state.revisions.get(draft.highestRevision.id).status, winner);
  });
});
