import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { createPracticeFixture, deferred, bounded } from './practice-db-fixture.mjs';
import { submitTeacherLesson, approveReview, publishReview } from '../../../../lingora-admin/src/server/lessons/index.ts';

export { deferred, bounded };

async function addExerciseToRevision(db, teacher, episodeId, revisionId) {
  const item = await db.itemIdentity.create({
    data: { origin: 'PRACTICE', createdBy: teacher, exactFingerprint: 'practice-fp-' + randomUUID() },
  });
  const ir = await db.itemRevision.create({
    data: {
      itemId: item.id,
      revisionNo: 1,
      type: 'MCQ',
      promptData: { prompt: 'Prompt ' + randomUUID(), options: [{ id: 'o1', text: 'A' }, { id: 'o2', text: 'B' }] },
      exactFingerprint: item.exactFingerprint,
      createdBy: teacher,
      creationAssignmentEpisodeId: episodeId,
      authoringLessonRevisionId: revisionId,
      frozenAt: null,
    },
  });
  await db.itemGradingSecret.create({
    data: { itemRevisionId: ir.id, gradingData: { correctOptionId: 'o1' } },
  });
  await db.lessonExercise.create({
    data: {
      lessonRevisionId: revisionId,
      itemId: item.id,
      itemRevisionId: ir.id,
      position: 1,
      isCore: true,
    },
  });
}

export async function createContextConcurrencyFixture(db) {
  // Base practice fixture provides: admin, teacher, learnerA, learnerB, lang, framework, level, course, unit, lesson, revision, ctxA, ctxB
  const f = await createPracticeFixture(db);

  const id = () => randomUUID();

  // Additional level 2 in framework
  f.level2 = id();
  await db.level.create({
    data: {
      id: f.level2,
      frameworkId: f.framework,
      code: 'A2',
      label: { vi: 'A2 Sơ cấp', en: 'Elementary' },
      position: 2,
    },
  });

  // Unit and Lesson in Level 2 for course 1
  f.unit2 = id();
  f.lesson2 = id();
  f.revision2 = id();
  f.assignment2 = id();
  f.episode2 = id();

  await db.unit.create({
    data: {
      id: f.unit2,
      courseId: f.course,
      levelId: f.level2,
      code: 'U2',
      names: { vi: 'Chương 2', en: 'Unit 2' },
      position: 2,
    },
  });

  await db.lesson.create({
    data: {
      id: f.lesson2,
      unitId: f.unit2,
      position: 1,
      availability: 'PLANNED',
    },
  });

  await db.contentAssignment.create({
    data: { id: f.assignment2, createdBy: f.admin, currentTeacherId: f.teacher, lessonId: f.lesson2 },
  });

  await db.assignmentHistory.create({
    data: {
      id: f.episode2,
      assignmentId: f.assignment2,
      sequenceNo: 1,
      eventType: 'ASSIGNED',
      nextTeacherId: f.teacher,
      scopeGeneration: 1n,
      changedBy: f.admin,
      scopeSnapshot: { unit: 'U2' },
    },
  });

  await db.lessonRevision.create({
    data: {
      id: f.revision2,
      lessonId: f.lesson2,
      revisionNo: 1,
      assignmentId: f.assignment2,
      creationAssignmentEpisodeId: f.episode2,
      status: 'DRAFT',
      title: { vi: 'Bài 2', en: 'Lesson 2' },
      contentBlocks: [{ type: 'paragraph', text: 'Nội dung bài 2' }],
      createdBy: f.teacher,
      lastEditedBy: f.teacher,
    },
  });

  // Add practice exercise to revision 2
  const item2 = await db.itemIdentity.create({
    data: { origin: 'PRACTICE', createdBy: f.teacher, exactFingerprint: 'practice-fp-' + randomUUID() },
  });
  const ir2 = await db.itemRevision.create({
    data: {
      itemId: item2.id,
      revisionNo: 1,
      type: 'MCQ',
      promptData: { prompt: 'Question 2', options: [{ id: 'o1', text: 'A' }, { id: 'o2', text: 'B' }] },
      exactFingerprint: item2.exactFingerprint,
      createdBy: f.teacher,
      creationAssignmentEpisodeId: f.episode2,
      authoringLessonRevisionId: f.revision2,
      frozenAt: null,
    },
  });
  await db.itemGradingSecret.create({
    data: { itemRevisionId: ir2.id, gradingData: { correctOptionId: 'o1' } },
  });
  await db.lessonExercise.create({
    data: {
      lessonRevisionId: f.revision2,
      itemId: item2.id,
      itemRevisionId: ir2.id,
      position: 1,
      isCore: true,
    },
  });

  // Publish lesson 2
  const lesson2Row = await db.lesson.findUnique({ where: { id: f.lesson2 } });
  const sub2 = await submitTeacherLesson(f.teacher, f.lesson2, {
    revisionId: f.revision2,
    expectedLessonRowVersion: lesson2Row.rowVersion.toString(),
    expectedRevisionRowVersion: '1',
  }, db);
  assert.equal(sub2.status, 200);

  const rev2Row = await db.lessonRevision.findUnique({ where: { id: f.revision2 } });
  const app2 = await approveReview(f.admin, sub2.data.submissionId, {
    expectedRevisionRowVersion: rev2Row.rowVersion.toString(),
  }, db);
  assert.equal(app2.status, 200);

  const rev2Pub = await db.lessonRevision.findUnique({ where: { id: f.revision2 } });
  const cur2 = await db.lesson.findUnique({ where: { id: f.lesson2 } });
  const pub2 = await publishReview(f.admin, sub2.data.submissionId, {
    expectedRevisionRowVersion: rev2Pub.rowVersion.toString(),
    expectedLessonRowVersion: cur2.rowVersion.toString(),
  }, db);
  assert.equal(pub2.status, 200);

  await db.lesson.update({
    where: { id: f.lesson2 },
    data: { availability: 'AVAILABLE', activeRevisionId: f.revision2 },
  });

  // Second Learnable Language (lang2) and Course (course2)
  f.lang2 = id();
  await db.language.create({
    data: {
      id: f.lang2,
      code: 'local-ja-' + f.lang2.slice(0, 8),
      names: { vi: 'Tiếng Nhật', en: 'Japanese' },
      isLearnable: true,
      isUiLocale: false,
    },
  });

  f.course2 = id();
  await db.course.create({
    data: {
      id: f.course2,
      languageId: f.lang2,
      frameworkId: f.framework,
      names: { vi: 'Tiếng Nhật Căn Bản', en: 'Basic Japanese' },
      isActive: true,
      defaultStartLevelId: f.level,
    },
  });

  // Unit and published lesson for Course 2
  f.unitCourse2 = id();
  f.lessonCourse2 = id();
  f.revisionCourse2 = id();
  f.assignmentCourse2 = id();
  f.episodeCourse2 = id();

  await db.unit.create({
    data: {
      id: f.unitCourse2,
      courseId: f.course2,
      levelId: f.level,
      code: 'JA-U1',
      names: { vi: 'Chương 1 Tiếng Nhật', en: 'Japanese Unit 1' },
      position: 1,
    },
  });

  await db.lesson.create({
    data: {
      id: f.lessonCourse2,
      unitId: f.unitCourse2,
      position: 1,
      availability: 'PLANNED',
    },
  });

  await db.contentAssignment.create({
    data: { id: f.assignmentCourse2, createdBy: f.admin, currentTeacherId: f.teacher, lessonId: f.lessonCourse2 },
  });

  await db.assignmentHistory.create({
    data: {
      id: f.episodeCourse2,
      assignmentId: f.assignmentCourse2,
      sequenceNo: 1,
      eventType: 'ASSIGNED',
      nextTeacherId: f.teacher,
      scopeGeneration: 1n,
      changedBy: f.admin,
      scopeSnapshot: { unit: 'JA-U1' },
    },
  });

  await db.lessonRevision.create({
    data: {
      id: f.revisionCourse2,
      lessonId: f.lessonCourse2,
      revisionNo: 1,
      assignmentId: f.assignmentCourse2,
      creationAssignmentEpisodeId: f.episodeCourse2,
      status: 'DRAFT',
      title: { vi: 'Bài Nhật 1', en: 'Japanese Lesson 1' },
      contentBlocks: [{ type: 'paragraph', text: 'Nội dung bài Nhật 1' }],
      createdBy: f.teacher,
      lastEditedBy: f.teacher,
    },
  });

  await addExerciseToRevision(db, f.teacher, f.episodeCourse2, f.revisionCourse2);

  const subJA = await submitTeacherLesson(f.teacher, f.lessonCourse2, {
    revisionId: f.revisionCourse2,
    expectedLessonRowVersion: '1',
    expectedRevisionRowVersion: '1',
  }, db);
  assert.equal(subJA.status, 200, JSON.stringify(subJA));

  const revJARow = await db.lessonRevision.findUnique({ where: { id: f.revisionCourse2 } });
  const appJA = await approveReview(f.admin, subJA.data.submissionId, {
    expectedRevisionRowVersion: revJARow.rowVersion.toString(),
  }, db);
  assert.equal(appJA.status, 200, JSON.stringify(appJA));

  const revJAPub = await db.lessonRevision.findUnique({ where: { id: f.revisionCourse2 } });
  const curJA = await db.lesson.findUnique({ where: { id: f.lessonCourse2 } });
  const pubJA = await publishReview(f.admin, subJA.data.submissionId, {
    expectedRevisionRowVersion: revJAPub.rowVersion.toString(),
    expectedLessonRowVersion: curJA.rowVersion.toString(),
  }, db);
  assert.equal(pubJA.status, 200, JSON.stringify(pubJA));

  await db.lesson.update({
    where: { id: f.lessonCourse2 },
    data: { availability: 'AVAILABLE', activeRevisionId: f.revisionCourse2 },
  });

  // Third Learnable Language (lang3) and Course (course3)
  f.lang3 = id();
  await db.language.create({
    data: {
      id: f.lang3,
      code: 'local-fr-' + f.lang3.slice(0, 8),
      names: { vi: 'Tiếng Pháp', en: 'French' },
      isLearnable: true,
      isUiLocale: false,
    },
  });

  f.course3 = id();
  await db.course.create({
    data: {
      id: f.course3,
      languageId: f.lang3,
      frameworkId: f.framework,
      names: { vi: 'Tiếng Pháp Căn Bản', en: 'Basic French' },
      isActive: true,
      defaultStartLevelId: f.level,
    },
  });

  return f;
}
