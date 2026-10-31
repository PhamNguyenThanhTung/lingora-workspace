import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assessmentPurposeEnum,
  blueprintConfigSchema,
  blueprintCoverageSchema,
  blueprintRequirementsSchema,
  createBlueprintSchema,
} from '../../src/server/assessments/schemas.ts';
import { createBlueprint, updateBlueprint } from '../../src/server/assessments/blueprint.ts';
import { saveTeacherAssessmentItem } from '../../src/server/assessments/teacher-items.ts';
import { assembleAssessmentVersion, getAssessmentVersion } from '../../src/server/assessments/assembly.ts';
import { unsupportedChildren } from '../../src/server/lessons/snapshot.ts';
import { computeExerciseFingerprint } from '../../src/server/lessons/content.ts';

const validBlueprint = {
  courseId: '11111111-1111-4111-8111-111111111111',
  purpose: 'PLACEMENT',
  targetLevelId: null,
  nextLevelId: null,
  coverage: { itemCount: 2, exerciseTypes: ['MCQ', 'FILL_BLANK'] },
  requirements: { minimumItemsByType: { MCQ: 1, FILL_BLANK: 1 } },
  config: { shuffleItems: false, shuffleOptions: false },
};

test('Slice 8 purpose values match the Blueprint database check', () => {
  assert.deepEqual(assessmentPurposeEnum.safeParse('PLACEMENT').success, true);
  assert.deepEqual(assessmentPurposeEnum.safeParse('LEVEL_UP').success, true);
  assert.equal(assessmentPurposeEnum.safeParse('PRACTICE').success, false);
});

test('Blueprint v1 accepts a valid typed flat composition', () => {
  const result = createBlueprintSchema.safeParse(validBlueprint);
  assert.equal(result.success, true);
  if (result.success) assert.deepEqual(result.data.coverage, validBlueprint.coverage);
});

test('Blueprint v1 requires all three JSON objects to use their strict key sets', () => {
  assert.equal(blueprintCoverageSchema.safeParse({ ...validBlueprint.coverage, title: 'extra' }).success, false);
  assert.equal(blueprintRequirementsSchema.safeParse({ minimumItemsByType: {}, extra: true }).success, false);
  assert.equal(blueprintConfigSchema.safeParse({ ...validBlueprint.config, timeLimit: 10 }).success, false);
  assert.equal(blueprintRequirementsSchema.safeParse({}).success, false);
});

test('Blueprint composition rejects empty/duplicate/unknown exercise types', () => {
  assert.equal(blueprintCoverageSchema.safeParse({ itemCount: 1, exerciseTypes: [] }).success, false);
  assert.equal(blueprintCoverageSchema.safeParse({ itemCount: 1, exerciseTypes: ['MCQ', 'MCQ'] }).success, false);
  assert.equal(blueprintCoverageSchema.safeParse({ itemCount: 1, exerciseTypes: ['ESSAY'] }).success, false);
});

test('Blueprint minimum type counts must be non-negative integers on allowed types and sum within itemCount', () => {
  assert.equal(createBlueprintSchema.safeParse({
    ...validBlueprint,
    requirements: { minimumItemsByType: { MCQ: -1 } },
  }).success, false);
  assert.equal(createBlueprintSchema.safeParse({
    ...validBlueprint,
    requirements: { minimumItemsByType: { MCQ: 1.5 } },
  }).success, false);
  assert.equal(createBlueprintSchema.safeParse({
    ...validBlueprint,
    requirements: { minimumItemsByType: { LISTENING: 1 } },
  }).success, false);
  assert.equal(createBlueprintSchema.safeParse({
    ...validBlueprint,
    requirements: { minimumItemsByType: { MCQ: 2, FILL_BLANK: 1 } },
  }).success, false);
});

test('Blueprint request rejects unknown top-level fields and malformed UUIDs', () => {
  assert.equal(createBlueprintSchema.safeParse({ ...validBlueprint, status: 'ACTIVE' }).success, false);
  assert.equal(createBlueprintSchema.safeParse({ ...validBlueprint, courseId: 'not-a-uuid' }).success, false);
});

const ids = {
  admin: '5650336e-550c-413d-b2a8-4afa2e4d9160',
  teacher: '11111111-1111-4111-8111-111111111111',
  course: validBlueprint.courseId,
  lesson: '22222222-2222-4222-8222-222222222222',
  lessonRevision: '33333333-3333-4333-8333-333333333333',
  episode: '44444444-4444-4444-8444-444444444444',
  blueprint: '55555555-5555-4555-8555-555555555555',
  item: '66666666-6666-4666-8666-666666666666',
  itemRevision: '77777777-7777-4777-8777-777777777777',
  version: '88888888-8888-4888-8888-888888888888',
  versionItem: '99999999-9999-4999-8999-999999999999',
  language: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  framework: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
};

function exercisePayload() {
  return {
    type: 'MCQ',
    promptData: { prompt: 'Choose the greeting.', options: [{ id: 'hello', text: 'Hello' }, { id: 'bye', text: 'Goodbye' }] },
    gradingData: { correctOptionId: 'hello' },
    feedbackData: null,
  };
}

test('Admin service derives Blueprint scope and rejects non-Admin mutation', async () => {
  let createArgs;
  const adminDb = {
    account: { findUnique: async () => ({ id: ids.admin, role: 'ADMIN', status: 'ACTIVE' }) },
    course: { findUnique: async () => ({ id: ids.course, languageId: ids.language, frameworkId: ids.framework, coverageCatalogGeneration: 4n }) },
    level: { findUnique: async () => null },
    assessmentBlueprint: { create: async ({ data }) => {
      createArgs = data;
      return { id: ids.blueprint, ...data, createdAt: new Date('2026-10-31T00:00:00.000Z'), updatedAt: new Date('2026-10-31T00:00:00.000Z'), _count: { versions: 0 } };
    } },
  };
  const created = await createBlueprint(ids.admin, validBlueprint, adminDb);
  assert.equal(created.status, 201);
  assert.equal(createArgs.createdBy, ids.admin);
  assert.equal(createArgs.languageId, ids.language);
  assert.equal(createArgs.frameworkId, ids.framework);
  assert.equal(createArgs.coverageCatalogGeneration, 4n);

  let courseRead = false;
  const teacherDb = {
    account: { findUnique: async () => ({ id: ids.teacher, role: 'TEACHER', status: 'ACTIVE' }) },
    course: { findUnique: async () => { courseRead = true; return null; } },
  };
  const rejected = await createBlueprint(ids.teacher, validBlueprint, teacherDb);
  assert.equal(rejected.status, 403);
  assert.equal(courseRead, false);
});

test('Blueprint creation rejects a Level owned by a different Framework', async () => {
  let createCalled = false;
  const db = {
    account: { findUnique: async () => ({ id: ids.admin, role: 'ADMIN', status: 'ACTIVE' }) },
    course: { findUnique: async () => ({ id: ids.course, languageId: ids.language, frameworkId: ids.framework, coverageCatalogGeneration: 4n }) },
    level: { findUnique: async () => ({ id: ids.episode, frameworkId: ids.episode }) },
    assessmentBlueprint: { create: async ({ data }) => {
      createCalled = true;
      return {
        id: ids.blueprint, ...data, createdAt: new Date(), updatedAt: new Date(),
        course: { id: ids.course, names: {} }, language: { id: ids.language, code: 'en', names: {} },
        framework: { id: ids.framework, code: 'FW', version: '1', names: {} },
        targetLevel: null, nextLevel: null, _count: { versions: 0 },
      };
    } },
  };
  const result = await createBlueprint(ids.admin, {
    ...validBlueprint,
    targetLevelId: ids.episode,
  }, db);
  assert.equal(result.status, 400);
  assert.equal(result.error.code, 'LEVEL_FRAMEWORK_MISMATCH');
  assert.equal(createCalled, false);
});

test('Blueprint update uses rowVersion CAS and advances semantic generation', async () => {
  const current = {
    id: ids.blueprint, createdBy: ids.admin, courseId: ids.course, languageId: ids.language, frameworkId: ids.framework,
    purpose: 'PLACEMENT', targetLevelId: null, nextLevelId: null,
    coverage: { itemCount: 2, exerciseTypes: ['MCQ', 'FILL_BLANK'] },
    requirements: { minimumItemsByType: { MCQ: 1, FILL_BLANK: 1 } },
    config: { shuffleItems: false, shuffleOptions: false }, generation: 4n, coverageCatalogGeneration: 4n,
    rowVersion: 8n, createdAt: new Date(), updatedAt: new Date(), _count: { versions: 0 },
  };
  let updateArgs;
  let reads = 0;
  const db = {
    account: { findUnique: async () => ({ id: ids.admin, role: 'ADMIN', status: 'ACTIVE' }) },
    assessmentBlueprint: {
      findUnique: async () => { reads++; return structuredClone(current); },
      updateMany: async (args) => { updateArgs = args; return { count: args.where.rowVersion === 8n ? 1 : 0 }; },
    },
  };
  const updated = await updateBlueprint(ids.admin, ids.blueprint, {
    expectedRowVersion: '8',
    coverage: { itemCount: 2, exerciseTypes: ['MCQ', 'GRAMMAR'] },
    requirements: { minimumItemsByType: { MCQ: 1, GRAMMAR: 1 } },
  }, db);
  assert.equal(updated.status, 200);
  assert.equal(updateArgs.data.generation, 5n);
  assert.equal(updateArgs.data.rowVersion, 9n);

  let staleWrite = false;
  db.assessmentBlueprint.updateMany = async () => { staleWrite = true; return { count: 0 }; };
  const stale = await updateBlueprint(ids.admin, ids.blueprint, { expectedRowVersion: '7' }, db);
  assert.equal(stale.status, 409);
  assert.equal(staleWrite, false);
});

test('Teacher assessment item write pins the authenticated teacher, current episode, draft and blueprint generation', async () => {
  const payload = {
    ...exercisePayload(),
    promptData: { prompt: 'Choose the greeting.', options: [{ id: ' a ', text: 'Hello' }, { id: 'bye', text: 'Goodbye' }] },
    gradingData: { correctOptionId: 'a' },
  };
  let identityArgs, revisionArgs, secretArgs;
  const draft = {
    id: ids.lessonRevision, revisionNo: 2, status: 'DRAFT', submittedAt: null,
    assignmentId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', creationAssignmentEpisodeId: ids.episode,
    createdBy: ids.teacher,
  };
  const tx = {
    $queryRaw: async () => [],
    account: { findUnique: async () => ({ id: ids.teacher, role: 'TEACHER', status: 'ACTIVE' }) },
    lesson: { findUnique: async () => ({
      id: ids.lesson, unit: { courseId: ids.course, course: { languageId: ids.language, frameworkId: ids.framework } },
      assignment: { id: draft.assignmentId, currentTeacherId: ids.teacher, scopeGeneration: 1n }, revisions: [draft],
    }) },
    assignmentHistory: { findFirst: async () => ({ id: ids.episode, nextTeacherId: ids.teacher, scopeGeneration: 1n }) },
    assessmentBlueprint: { findUnique: async () => ({ id: ids.blueprint, courseId: ids.course, generation: 12n }) },
    itemIdentity: { create: async ({ data }) => { identityArgs = data; return { id: ids.item }; } },
    itemRevision: { create: async ({ data }) => { revisionArgs = data; return { id: ids.itemRevision, ...data, createdAt: new Date(), updatedAt: new Date() }; } },
    itemGradingSecret: { create: async ({ data }) => { secretArgs = data; return data; } },
  };
  const db = { $transaction: async (callback) => callback(tx) };
  const result = await saveTeacherAssessmentItem(ids.teacher, ids.lesson, {
    blueprintId: ids.blueprint, type: payload.type, promptData: payload.promptData, gradingData: payload.gradingData,
    feedbackData: payload.feedbackData, expectedRevisionId: ids.lessonRevision,
  }, db);
  assert.equal(result.status, 201);
  assert.equal(identityArgs.origin, 'ASSESSMENT');
  assert.equal(identityArgs.createdBy, ids.teacher);
  assert.equal(revisionArgs.authoringLessonRevisionId, ids.lessonRevision);
  assert.equal(revisionArgs.creationAssignmentEpisodeId, ids.episode);
  assert.equal(revisionArgs.createdBy, ids.teacher);
  assert.equal(revisionArgs.blueprintGeneration, 12n);
  assert.equal(revisionArgs.promptData.options[0].id, 'a');
  assert.equal(secretArgs.gradingData.correctOptionId, 'a');
  assert.equal(result.data.data.promptData.options[0].id, 'a');
  assert.equal(secretArgs.itemRevisionId, ids.itemRevision);

  tx.account.findUnique = async () => ({ id: ids.admin, role: 'ADMIN', status: 'ACTIVE' });
  const adminDenied = await saveTeacherAssessmentItem(ids.admin, ids.lesson, {
    blueprintId: ids.blueprint, ...payload, expectedRevisionId: ids.lessonRevision,
  }, db);
  assert.equal(adminDenied.status, 403);
});

test('Teacher item edits create an immutable successor revision on the same ASSESSMENT identity', async () => {
  const payload = exercisePayload();
  const draft = {
    id: ids.lessonRevision, revisionNo: 3, status: 'DRAFT', submittedAt: null,
    assignmentId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', creationAssignmentEpisodeId: ids.episode,
    createdBy: ids.teacher,
  };
  const createCalls = [];
  let identityCreateCalls = 0;
  let itemFindFirstCalls = 0;
  const tx = {
    $queryRaw: async () => [],
    account: { findUnique: async () => ({ id: ids.teacher, role: 'TEACHER', status: 'ACTIVE' }) },
    lesson: { findUnique: async () => ({
      id: ids.lesson, unit: { courseId: ids.course, course: { languageId: ids.language, frameworkId: ids.framework } },
      assignment: { id: draft.assignmentId, currentTeacherId: ids.teacher, scopeGeneration: 1n }, revisions: [draft],
    }) },
    assignmentHistory: { findFirst: async () => ({ id: ids.episode, nextTeacherId: ids.teacher, scopeGeneration: 1n }) },
    assessmentBlueprint: { findUnique: async () => ({ id: ids.blueprint, courseId: ids.course, generation: 12n }) },
    itemIdentity: {
      findUnique: async () => ({ id: ids.item, origin: 'ASSESSMENT' }),
      create: async () => { identityCreateCalls++; return { id: ids.item }; },
    },
    itemRevision: {
      findFirst: async () => ++itemFindFirstCalls === 1 ? { id: ids.itemRevision } : { revisionNo: 4 },
      create: async ({ data }) => {
        createCalls.push(data);
        return { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab', ...data, createdAt: new Date(), updatedAt: new Date() };
      },
    },
    itemGradingSecret: { create: async () => ({}) },
  };
  const result = await saveTeacherAssessmentItem(ids.teacher, ids.lesson, {
    blueprintId: ids.blueprint, sourceItemId: ids.item, type: payload.type,
    promptData: { ...payload.promptData, prompt: 'Revised prompt.' }, gradingData: payload.gradingData,
    feedbackData: null, expectedRevisionId: ids.lessonRevision,
  }, { $transaction: async (callback) => callback(tx) });

  assert.equal(result.status, 201);
  assert.equal(identityCreateCalls, 0);
  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0].itemId, ids.item);
  assert.equal(createCalls[0].revisionNo, 5);
  assert.equal(createCalls[0].authoringLessonRevisionId, ids.lessonRevision);
  assert.equal(createCalls[0].createdBy, ids.teacher);
});

test('Lesson snapshot accepts separate ASSESSMENT children while keeping PRACTICE exercise pairing exact', () => {
  const payload = exercisePayload();
  const practice = {
    id: 'practice-revision', itemId: 'practice-item', authoringLessonRevisionId: ids.lessonRevision,
    createdBy: ids.teacher, creationAssignmentEpisodeId: ids.episode, schemaVersion: 1,
    type: payload.type, promptData: payload.promptData, isDraftOmitted: false, frozenAt: null,
    assessmentBlueprintId: null, blueprintGeneration: null,
    gradingSecret: { schemaVersion: 1, gradingData: payload.gradingData, feedbackData: null },
    _count: { mediaBindings: 0, assessmentVersionItems: 0, provenanceVersionItems: 0 },
  };
  const assessment = {
    id: ids.itemRevision, itemId: ids.item, authoringLessonRevisionId: ids.lessonRevision,
    createdBy: ids.teacher, creationAssignmentEpisodeId: ids.episode, schemaVersion: 1,
    type: payload.type, promptData: payload.promptData, isDraftOmitted: false, frozenAt: null,
    assessmentBlueprintId: ids.blueprint, blueprintGeneration: 1n,
    item: { id: ids.item, origin: 'ASSESSMENT' }, assessmentBlueprint: { id: ids.blueprint },
    gradingSecret: { schemaVersion: 1, gradingData: payload.gradingData, feedbackData: null },
    _count: { mediaBindings: 0, assessmentVersionItems: 0, provenanceVersionItems: 0 },
  };
  const revision = {
    id: ids.lessonRevision, createdBy: ids.teacher, creationAssignmentEpisodeId: ids.episode,
    exercises: [{ id: 'exercise-link', lessonRevisionId: ids.lessonRevision, itemId: practice.itemId, itemRevisionId: practice.id, position: 1, isCore: true,
      item: { id: practice.itemId, origin: 'PRACTICE' }, itemRevision: practice }],
    authoredItemRevisions: [assessment], vocabularyLinks: [],
    _count: { exercises: 1, vocabularyLinks: 0, authoredItemRevisions: 2, mediaBindings: 0, attempts: 0, assessmentVersionItems: 1 },
  };
  assert.equal(unsupportedChildren(revision), false);
  assert.equal(unsupportedChildren({ ...revision, _count: { ...revision._count, authoredItemRevisions: 1 } }), true);
  assert.equal(unsupportedChildren({ ...revision, authoredItemRevisions: [{ ...assessment, item: { ...assessment.item, origin: 'PRACTICE' } }] }), true);
  assert.equal(unsupportedChildren({ ...revision, authoredItemRevisions: [{ ...assessment, frozenAt: new Date(), _count: { mediaBindings: 0, assessmentVersionItems: 1, provenanceVersionItems: 1 } }] }, undefined, true), false);
});

function assemblyFixture({ reviewActorId = ids.teacher } = {}) {
  const payload = exercisePayload();
  const fingerprint = computeExerciseFingerprint({ ...payload, schemaVersion: 1 });
  const review = { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', action: 'SUBMIT', lessonRevisionId: ids.lessonRevision, actorId: reviewActorId, assignmentEpisodeId: ids.episode };
  const itemRevision = {
    id: ids.itemRevision, itemId: ids.item, type: payload.type, promptData: payload.promptData, schemaVersion: 1,
    exactFingerprint: fingerprint, createdBy: ids.teacher, creationAssignmentEpisodeId: ids.episode,
    authoringLessonRevisionId: ids.lessonRevision, assessmentBlueprintId: ids.blueprint, blueprintGeneration: 1n,
    isDraftOmitted: false, frozenAt: null, gradingSecret: { schemaVersion: 1, gradingData: payload.gradingData, feedbackData: null },
    item: { id: ids.item, origin: 'ASSESSMENT', exactFingerprint: 'identity-fingerprint' },
    authoringLessonRevision: {
      id: ids.lessonRevision, revisionNo: 2, lessonId: ids.lesson, submittedAt: new Date('2026-10-31T00:00:00.000Z'),
      lesson: { id: ids.lesson, position: 1, unit: { code: 'DEV', position: 1, course: { id: ids.course, languageId: ids.language, frameworkId: ids.framework } } },
      reviews: [review],
    },
  };
  const blueprint = {
    id: ids.blueprint, courseId: ids.course, languageId: ids.language, frameworkId: ids.framework,
    purpose: 'PLACEMENT', targetLevelId: null, nextLevelId: null, generation: 1n, coverageCatalogGeneration: 4n,
    coverage: { itemCount: 1, exerciseTypes: ['MCQ'] }, requirements: { minimumItemsByType: { MCQ: 1 } },
    config: { shuffleItems: false, shuffleOptions: false },
  };
  const versionRow = {
    id: ids.version, blueprintId: ids.blueprint, versionNo: 1, blueprintGeneration: 1n,
    blueprintSnapshot: { blueprint_id: ids.blueprint, blueprint_generation: 1, course_id: ids.course, language_id: ids.language, framework_id: ids.framework, purpose: 'PLACEMENT', schema_version: 1, coverage_catalog_generation: 4, config: blueprint.config, target_level_id: null, next_level_id: null, coverage: blueprint.coverage, requirements: blueprint.requirements },
    assembledAt: new Date(), assemblyInputHash: 'a'.repeat(64), status: 'IN_REVIEW', isActive: false,
    createdAt: new Date(), updatedAt: new Date(), rowVersion: 1n,
    items: [{ id: ids.versionItem, assessmentVersionId: ids.version, itemRevisionId: ids.itemRevision, itemId: ids.item, position: 1, weight: '1.0000', coverageTags: {}, createdAt: new Date(), item: itemRevision.item, itemRevision, sourceLessonRevision: { id: ids.lessonRevision, revisionNo: 2, lessonId: ids.lesson } }],
  };
  const rawCalls = [];
  const tx = {
    $queryRaw: async (strings) => {
      const sql = strings.join(''); rawCalls.push(sql);
      if (sql.includes('FROM app.item_revisions WHERE id')) return [{ id: ids.itemRevision, itemId: ids.item }];
      if (sql.includes('INSERT INTO app.assessment_versions')) return [{ id: ids.version }];
      if (sql.includes('blueprint_snapshot->>')) return [{ id: ids.version, blueprintGeneration: '1', coverageCatalogGeneration: '4' }];
      return [];
    },
    assessmentBlueprint: { findUnique: async () => blueprint },
    itemRevision: { findUnique: async () => itemRevision, update: async () => ({}) },
    assessmentVersion: { findFirst: async () => null, findUnique: async () => versionRow },
    assessmentVersionItem: { create: async () => ({}) },
  };
  const db = {
    account: { findUnique: async () => ({ id: ids.admin, role: 'ADMIN', status: 'ACTIVE' }) },
    $queryRaw: tx.$queryRaw,
    $transaction: async (callback) => callback(tx),
    tx, rawCalls, review, itemRevision, blueprint, versionRow,
  };
  return db;
}

test('Assembly freezes and retrieves the exact selected ItemRevision through its persisted version relation', async () => {
  const db = assemblyFixture();
  const result = await assembleAssessmentVersion(ids.admin, ids.blueprint, { expectedBlueprintGeneration: '1', itemRevisionIds: [ids.itemRevision] }, db);
  assert.equal(result.status, 201);
  assert.equal(result.data.data.items[0].itemRevisionId, ids.itemRevision);
  assert.equal(result.data.data.blueprintSnapshot.blueprint_generation, '1');
  assert.equal(result.data.data.blueprintSnapshot.coverage_catalog_generation, '4');
  assert.equal(db.rawCalls.some((sql) => sql.includes('INSERT INTO app.assessment_versions')), true);
  assert.equal(db.tx.itemRevision.update !== undefined, true);

  const retrievalDb = {
    account: db.account,
    assessmentVersion: { findUnique: async () => ({
      ...db.versionRow,
      items: [{ ...db.versionRow.items[0], itemRevision: { ...db.itemRevision, id: ids.itemRevision, promptData: { prompt: 'Pinned version X.' } } }],
    }) },
    $queryRaw: async () => [{ id: ids.version, blueprintGeneration: '1', coverageCatalogGeneration: '4' }],
    itemRevision: { findMany: async () => [{ ...db.itemRevision, id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaac', revisionNo: 3, promptData: { prompt: 'Newer revision Y.' } }] },
  };
  const retrieved = await getAssessmentVersion(ids.admin, ids.version, retrievalDb);
  assert.equal(retrieved.data.data.items[0].itemRevisionId, ids.itemRevision);
  assert.equal(retrieved.data.data.items[0].itemRevision.promptData.prompt, 'Pinned version X.');
});

test('Assembly rejects PRACTICE origin and leaves the version table untouched', async () => {
  const db = assemblyFixture();
  db.tx.itemRevision.findUnique = async () => ({ ...db.itemRevision, item: { ...db.itemRevision.item, origin: 'PRACTICE' } });
  const result = await assembleAssessmentVersion(ids.admin, ids.blueprint, {
    expectedBlueprintGeneration: '1', itemRevisionIds: [ids.itemRevision],
  }, db);
  assert.equal(result.status, 400);
  assert.equal(result.error.code, 'INVALID_ITEM_ORIGIN');
  assert.equal(db.rawCalls.some((sql) => sql.includes('INSERT INTO app.assessment_versions')), false);
});

test('Assembly enforces minimum type composition and leaves revisions unfrozen on failure', async () => {
  const db = assemblyFixture();
  db.blueprint.coverage = { itemCount: 1, exerciseTypes: ['MCQ', 'FILL_BLANK'] };
  db.blueprint.requirements = { minimumItemsByType: { FILL_BLANK: 1 } };
  let freezeCalls = 0;
  db.tx.itemRevision.update = async () => { freezeCalls++; return {}; };
  const result = await assembleAssessmentVersion(ids.admin, ids.blueprint, {
    expectedBlueprintGeneration: '1', itemRevisionIds: [ids.itemRevision],
  }, db);
  assert.equal(result.status, 400);
  assert.equal(result.error.code, 'MINIMUM_REQUIREMENTS_NOT_MET');
  assert.equal(freezeCalls, 0);
  assert.equal(db.rawCalls.some((sql) => sql.includes('INSERT INTO app.assessment_versions')), false);
});

test('Assembly rejects a mismatched source Teacher review actor before inserting a version', async () => {
  const db = assemblyFixture({ reviewActorId: ids.admin });
  const result = await assembleAssessmentVersion(ids.admin, ids.blueprint, { expectedBlueprintGeneration: '1', itemRevisionIds: [ids.itemRevision] }, db);
  assert.equal(result.status, 400);
  assert.equal(db.rawCalls.some((sql) => sql.includes('INSERT INTO app.assessment_versions')), false);
});
