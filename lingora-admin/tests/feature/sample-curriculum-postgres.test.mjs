import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import pkg from 'pg';
import { PrismaClient } from '../../generated/product-client/index.js';
import { seed } from '../../prisma/product/seed.mjs';
import {
  provisionSampleA1Curriculum,
  SAMPLE_A1_CONSTANTS,
} from '../../src/server/curriculum/sample-a1.ts';
import {
  validateOwnedDatabaseUrl,
  preflightAndSeedActors,
} from '../../../scripts/test-guard-utils.mjs';
import {
  installNetworkGuard,
  getNetworkGuardSummary,
  assertNoForbiddenOutbound,
  addAllowedPort,
  resetNetworkGuardInventory,
} from '../../../scripts/test-network-guard.mjs';

const { Client } = pkg;
const repoRoot = path.resolve(import.meta.dirname, '../../..');

// Strict owned loopback DB validation at entrypoint
const guard = validateOwnedDatabaseUrl();
const databaseUrl = guard.ownedUrl;
const pgPort = Number(guard.parsedUrl.port || 5432);

// Install network guard permitting only Postgres port initially
installNetworkGuard({ allowedPorts: [pgPort] });

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
  log: [],
});

const adminId = '00000000-0000-4000-8000-000000000001';
const teacherId = '11111111-1111-4111-8111-111111111111';
let pgClient;

before(async () => {
  await prisma.$connect();
  pgClient = new Client({ connectionString: databaseUrl });
  await pgClient.connect();
  await seed(prisma);
});

after(async () => {
  await prisma.$disconnect();
  await pgClient.end();
  assertNoForbiddenOutbound();
});

describe('P1: Real PostgreSQL Actor Preflight & Boundary Safeguards (R1)', () => {
  test('test wrapper child-env override sets SAMPLE_CURRICULUM_DATABASE_URL', () => {
    // Verified by running under local-test-db wrapper
    assert.equal(process.env.SLICE11_TEST_DATABASE_OWNED, '1');
    assert.ok(process.env.SAMPLE_CURRICULUM_DATABASE_URL);
    assert.equal(process.env.SAMPLE_CURRICULUM_DATABASE_URL, databaseUrl);
  });

  test('network guard negative control blocks forbidden outbound destination before connect', async () => {
    let blocked = false;
    try {
      await fetch('http://192.0.2.1:8080/test');
    } catch (err) {
      blocked = true;
      assert.match(err.message, /BLOCKED_OUTBOUND/);
    }
    assert.equal(blocked, true, 'Forbidden outbound fetch must be blocked before connect');

    const summary = getNetworkGuardSummary();
    assert.ok(summary.blockedCount >= 1);
    // Reset blocked inventory for subsequent tests
    resetNetworkGuardInventory();
  });

  test('actor preflight rejects same-role DISABLED at a later slot and preserves zero changes', async () => {
    const learner1Id = '33333333-0000-4000-8000-000000000001';
    const learner2Id = '44444444-0000-4000-8000-000000000001';

    // Clean test accounts
    await pgClient.query(`DELETE FROM app.accounts WHERE id IN ('${learner1Id}', '${learner2Id}')`);
    await pgClient.query(`DELETE FROM auth.users WHERE id IN ('${learner1Id}', '${learner2Id}')`);

    // Pre-seed learner2 as DISABLED
    await pgClient.query(`
      INSERT INTO auth.users (id, email) VALUES ('${learner2Id}', 'learner2@lingora.test');
      INSERT INTO app.accounts (id, role, status, display_name, ui_locale, created_at, updated_at)
      VALUES ('${learner2Id}', 'LEARNER', 'DISABLED', 'Disabled Learner', 'vi', NOW(), NOW());
    `);

    // Snapshot counts before attempt
    const countBefore = await pgClient.query(
      `SELECT COUNT(*)::int AS count FROM app.accounts WHERE id IN ('${learner1Id}', '${learner2Id}')`
    );
    assert.equal(countBefore.rows[0].count, 1);

    await assert.rejects(
      async () => {
        await preflightAndSeedActors(pgClient, [
          { id: learner1Id, role: 'LEARNER', status: 'ACTIVE', email: 'learner1@lingora.test', displayName: 'L1' },
          { id: learner2Id, role: 'LEARNER', status: 'ACTIVE', email: 'learner2@lingora.test', displayName: 'L2' },
        ]);
      },
      (err) => {
        assert.match(err.message, /Actor mismatch.*DISABLED/);
        return true;
      }
    );

    // Verify zero changes: learner1 was NOT inserted; learner2 remains DISABLED
    const l1Check = await pgClient.query(`SELECT id FROM app.accounts WHERE id = '${learner1Id}'`);
    assert.equal(l1Check.rows.length, 0, 'Earlier missing actor must not be inserted when later actor conflicts');

    const l2Check = await pgClient.query(`SELECT status FROM app.accounts WHERE id = '${learner2Id}'`);
    assert.equal(l2Check.rows[0].status, 'DISABLED', 'Conflicting actor status must not be overwritten');

    // Clean up
    await pgClient.query(`DELETE FROM app.accounts WHERE id IN ('${learner1Id}', '${learner2Id}')`);
    await pgClient.query(`DELETE FROM auth.users WHERE id IN ('${learner1Id}', '${learner2Id}')`);
  });

  test('actor preflight rejects wrong role at a later slot and preserves existing rows', async () => {
    const actorId = '55555555-0000-4000-8000-000000000001';
    await pgClient.query(`DELETE FROM app.accounts WHERE id = '${actorId}'`);
    await pgClient.query(`DELETE FROM auth.users WHERE id = '${actorId}'`);

    // Insert as TEACHER
    await pgClient.query(`
      INSERT INTO auth.users (id, email) VALUES ('${actorId}', 'staff@lingora.test');
      INSERT INTO app.accounts (id, role, status, display_name, ui_locale, created_at, updated_at)
      VALUES ('${actorId}', 'TEACHER', 'ACTIVE', 'Teacher Staff', 'vi', NOW(), NOW());
    `);

    await assert.rejects(
      async () => {
        await preflightAndSeedActors(pgClient, [
          { id: actorId, role: 'LEARNER', status: 'ACTIVE', email: 'staff@lingora.test', displayName: 'Staff' },
        ]);
      },
      (err) => {
        assert.match(err.message, /Actor mismatch.*expected LEARNER\/ACTIVE/);
        return true;
      }
    );

    const check = await pgClient.query(`SELECT role FROM app.accounts WHERE id = '${actorId}'`);
    assert.equal(check.rows[0].role, 'TEACHER');

    await pgClient.query(`DELETE FROM app.accounts WHERE id = '${actorId}'`);
    await pgClient.query(`DELETE FROM auth.users WHERE id = '${actorId}'`);
  });
});

describe('P2: Real PostgreSQL Sample Curriculum Persistence & Invariant Proof (R2)', () => {
  async function cleanSampleUnitData() {
    // Delete lesson attempts, responses, completions, srs cards, links, exercises, reviews, revisions, assignments
    const lessons = await prisma.lesson.findMany({
      where: { unitId: SAMPLE_A1_CONSTANTS.unitId },
      select: { id: true },
    });
    const lessonIds = lessons.map((l) => l.id);

    await pgClient.query("SET session_replication_role = 'replica'");
    try {
      if (lessonIds.length > 0) {
        await pgClient.query(`DELETE FROM app.lesson_consumptions WHERE context_id IN (SELECT id FROM app.learning_contexts WHERE course_id = '${SAMPLE_A1_CONSTANTS.courseId}')`);
        await pgClient.query(`DELETE FROM app.lesson_attempts WHERE lesson_id = ANY($1::uuid[])`, [lessonIds]);
        await pgClient.query(`DELETE FROM app.lesson_completions WHERE lesson_id = ANY($1::uuid[])`, [lessonIds]);
        await pgClient.query(`DELETE FROM app.srs_review_operations WHERE card_id IN (SELECT id FROM app.srs_cards WHERE source_lesson_vocabulary_id IN (SELECT id FROM app.lesson_vocabulary_links WHERE lesson_revision_id IN (SELECT id FROM app.lesson_revisions WHERE lesson_id = ANY($1::uuid[]))))`, [lessonIds]);
        await pgClient.query(`DELETE FROM app.srs_cards WHERE source_lesson_vocabulary_id IN (SELECT id FROM app.lesson_vocabulary_links WHERE lesson_revision_id IN (SELECT id FROM app.lesson_revisions WHERE lesson_id = ANY($1::uuid[])))`, [lessonIds]);
        await pgClient.query(`DELETE FROM app.lesson_vocabulary_links WHERE lesson_revision_id IN (SELECT id FROM app.lesson_revisions WHERE lesson_id = ANY($1::uuid[]))`, [lessonIds]);
        await pgClient.query(`DELETE FROM app.lesson_responses WHERE lesson_exercise_id IN (SELECT id FROM app.lesson_exercises WHERE lesson_revision_id IN (SELECT id FROM app.lesson_revisions WHERE lesson_id = ANY($1::uuid[])))`, [lessonIds]);
        await pgClient.query(`DELETE FROM app.lesson_exercises WHERE lesson_revision_id IN (SELECT id FROM app.lesson_revisions WHERE lesson_id = ANY($1::uuid[]))`, [lessonIds]);
        await pgClient.query(`DELETE FROM app_private.item_grading_secrets WHERE item_revision_id IN (SELECT id FROM app.item_revisions WHERE authoring_lesson_revision_id IN (SELECT id FROM app.lesson_revisions WHERE lesson_id = ANY($1::uuid[])))`, [lessonIds]);
        await pgClient.query(`DELETE FROM app.item_revisions WHERE authoring_lesson_revision_id IN (SELECT id FROM app.lesson_revisions WHERE lesson_id = ANY($1::uuid[]))`, [lessonIds]);
        await pgClient.query(`DELETE FROM app.revision_reviews WHERE lesson_revision_id IN (SELECT id FROM app.lesson_revisions WHERE lesson_id = ANY($1::uuid[]))`, [lessonIds]);
        await pgClient.query(`UPDATE app.lessons SET active_revision_id = NULL WHERE id = ANY($1::uuid[])`, [lessonIds]);
        await pgClient.query(`DELETE FROM app.lesson_revisions WHERE lesson_id = ANY($1::uuid[])`, [lessonIds]);
        await pgClient.query(`DELETE FROM app.assignment_history WHERE assignment_id IN (SELECT id FROM app.content_assignments WHERE lesson_id = ANY($1::uuid[]))`, [lessonIds]);
        await pgClient.query(`DELETE FROM app.content_assignments WHERE lesson_id = ANY($1::uuid[])`, [lessonIds]);
        await pgClient.query(`DELETE FROM app.lessons WHERE id = ANY($1::uuid[])`, [lessonIds]);
      }
      // Also delete any vocabulary concepts created by admin or teacher
      await pgClient.query(`DELETE FROM app.vocabulary_concepts WHERE created_by IN ($1::uuid, $2::uuid)`, [adminId, teacherId]);
    } finally {
      await pgClient.query("SET session_replication_role = 'origin'");
    }
  }

  beforeEach(async () => {
    // Seed admin and teacher
    await preflightAndSeedActors(pgClient, [
      { id: adminId, role: 'ADMIN', status: 'ACTIVE', email: 'admin@lingora.test', displayName: 'Admin' },
      { id: teacherId, role: 'TEACHER', status: 'ACTIVE', email: 'teacher@lingora.test', displayName: 'Teacher' },
    ]);
    await cleanSampleUnitData();
  });

  test('(a) clean provision and exact second-run identity/count/history preservation', async () => {
    // First run
    const res1 = await provisionSampleA1Curriculum(prisma, { adminId, teacherId });
    assert.equal(res1.alreadyProvisioned, false);
    assert.equal(res1.lessonIds.length, 3);

    // Snapshot DB state
    const lessonsBefore = await prisma.lesson.findMany({
      where: { unitId: SAMPLE_A1_CONSTANTS.unitId },
      orderBy: { position: 'asc' },
      include: { revisions: true, assignment: { include: { history: true } } },
    });
    const revsCountBefore = await prisma.lessonRevision.count({
      where: { lesson: { unitId: SAMPLE_A1_CONSTANTS.unitId } },
    });
    const reviewsCountBefore = await prisma.revisionReview.count({
      where: { lessonRevision: { lesson: { unitId: SAMPLE_A1_CONSTANTS.unitId } } },
    });

    // Second run
    const res2 = await provisionSampleA1Curriculum(prisma, { adminId, teacherId });
    assert.equal(res2.alreadyProvisioned, true);
    assert.deepEqual(res2.lessonIds, res1.lessonIds);

    // Verify exact count, IDs, versions, and history preservation
    const lessonsAfter = await prisma.lesson.findMany({
      where: { unitId: SAMPLE_A1_CONSTANTS.unitId },
      orderBy: { position: 'asc' },
      include: { revisions: true, assignment: { include: { history: true } } },
    });
    const revsCountAfter = await prisma.lessonRevision.count({
      where: { lesson: { unitId: SAMPLE_A1_CONSTANTS.unitId } },
    });
    const reviewsCountAfter = await prisma.revisionReview.count({
      where: { lessonRevision: { lesson: { unitId: SAMPLE_A1_CONSTANTS.unitId } } },
    });

    assert.equal(revsCountAfter, revsCountBefore);
    assert.equal(reviewsCountAfter, reviewsCountBefore);
    for (let i = 0; i < 3; i++) {
      assert.equal(lessonsAfter[i].id, lessonsBefore[i].id);
      assert.equal(lessonsAfter[i].rowVersion, lessonsBefore[i].rowVersion);
      assert.equal(lessonsAfter[i].activeRevisionId, lessonsBefore[i].activeRevisionId);
    }
  });

  test('(b) identical titles with changed paragraph content rejected with conflict', async () => {
    const res = await provisionSampleA1Curriculum(prisma, { adminId, teacherId });
    const l1Id = res.lessonIds[0];

    // Alter paragraph content in PostgreSQL via replica mode to simulate preexisting divergent content
    const l1 = await prisma.lesson.findUniqueOrThrow({ where: { id: l1Id }, include: { activeRevision: true } });
    await pgClient.query("SET session_replication_role = 'replica'");
    try {
      await pgClient.query(
        `UPDATE app.lesson_revisions SET content_blocks = $1::jsonb WHERE id = $2::uuid`,
        [JSON.stringify([{ type: 'paragraph', text: 'Nội dung thực tế trong PostgreSQL bị thay đổi.' }]), l1.activeRevisionId]
      );
    } finally {
      await pgClient.query("SET session_replication_role = 'origin'");
    }

    const revBefore = await prisma.lessonRevision.findUniqueOrThrow({ where: { id: l1.activeRevisionId } });

    await assert.rejects(
      async () => {
        await provisionSampleA1Curriculum(prisma, { adminId, teacherId });
      },
      (err) => {
        assert.match(err.message, /SAMPLE_CURRICULUM_CONFLICT/);
        assert.match(err.message, /contentBlocks do not match sample definition/);
        return true;
      }
    );

    // Assert rows were preserved without overwrite
    const revAfter = await prisma.lessonRevision.findUniqueOrThrow({ where: { id: l1.activeRevisionId } });
    assert.equal(revAfter.rowVersion, revBefore.rowVersion);
    assert.deepEqual(revAfter.contentBlocks, revBefore.contentBlocks);
  });

  test('(c) same-title draft/PLANNED content rejected before mutation', async () => {
    const res = await provisionSampleA1Curriculum(prisma, { adminId, teacherId });
    const l1Id = res.lessonIds[0];

    // Demote lesson 1 to PLANNED and draft with altered text via replica mode
    const l1 = await prisma.lesson.findUniqueOrThrow({ where: { id: l1Id }, include: { activeRevision: true } });
    await pgClient.query("SET session_replication_role = 'replica'");
    try {
      await pgClient.query(
        `UPDATE app.lessons SET availability = 'PLANNED', active_revision_id = NULL WHERE id = $1::uuid`,
        [l1Id]
      );
      await pgClient.query(
        `UPDATE app.lesson_revisions SET status = 'DRAFT', content_blocks = $1::jsonb, submitted_at = NULL, submitted_by = NULL, approved_at = NULL, approved_by = NULL, published_at = NULL, published_by = NULL WHERE id = $2::uuid`,
        [JSON.stringify([{ type: 'paragraph', text: 'Bản nháp người dùng thay đổi.' }]), l1.activeRevisionId]
      );
    } finally {
      await pgClient.query("SET session_replication_role = 'origin'");
    }

    const l1Before = await prisma.lesson.findUniqueOrThrow({ where: { id: l1Id } });

    await assert.rejects(
      async () => {
        await provisionSampleA1Curriculum(prisma, { adminId, teacherId });
      },
      (err) => {
        assert.match(err.message, /SAMPLE_CURRICULUM_CONFLICT/);
        return true;
      }
    );

    const l1After = await prisma.lesson.findUniqueOrThrow({ where: { id: l1Id } });
    assert.equal(l1After.rowVersion, l1Before.rowVersion);
    assert.equal(l1After.availability, 'PLANNED');
  });

  test('(d) extra successor revision rejected before mutation', async () => {
    const res = await provisionSampleA1Curriculum(prisma, { adminId, teacherId });
    const l1Id = res.lessonIds[0];

    const asgn = await prisma.contentAssignment.findUniqueOrThrow({ where: { lessonId: l1Id } });
    const hist = await prisma.assignmentHistory.findFirstOrThrow({ where: { assignmentId: asgn.id } });

    // Insert successor revision 2
    await prisma.lessonRevision.create({
      data: {
        lessonId: l1Id,
        revisionNo: 2,
        assignmentId: asgn.id,
        creationAssignmentEpisodeId: hist.id,
        createdBy: teacherId,
        lastEditedBy: teacherId,
        status: 'DRAFT',
        title: { vi: 'Bài 1: Chào hỏi cơ bản', en: 'Lesson 1: Basic Greetings' },
        contentBlocks: [],
      },
    });

    const countBefore = await prisma.lessonRevision.count({ where: { lessonId: l1Id } });
    assert.equal(countBefore, 2);

    await assert.rejects(
      async () => {
        await provisionSampleA1Curriculum(prisma, { adminId, teacherId });
      },
      (err) => {
        assert.match(err.message, /SAMPLE_CURRICULUM_CONFLICT/);
        assert.match(err.message, /extra or successor revisions/);
        return true;
      }
    );

    const countAfter = await prisma.lessonRevision.count({ where: { lessonId: l1Id } });
    assert.equal(countAfter, countBefore);
  });

  test('(e) global later-vocabulary conflict preflights and fails closed before lesson writes', async () => {
    // Pre-insert conflicting global concept for word 'Morning' in course language
    const langRes = await prisma.course.findUniqueOrThrow({
      where: { id: SAMPLE_A1_CONSTANTS.courseId },
      select: { languageId: true },
    });

    await prisma.vocabularyConcept.create({
      data: {
        languageId: langRes.languageId,
        canonicalForm: 'Morning',
        normalizedForm: 'morning',
        senseKey: 'time-of-day',
        meaningLabels: { vi: 'Nghĩa xung đột thực tế', en: 'Conflicting meaning' },
        createdBy: adminId,
      },
    });

    const lessonsCountBefore = await prisma.lesson.count({ where: { unitId: SAMPLE_A1_CONSTANTS.unitId } });

    await assert.rejects(
      async () => {
        await provisionSampleA1Curriculum(prisma, { adminId, teacherId });
      },
      (err) => {
        assert.match(err.message, /SAMPLE_CURRICULUM_CONFLICT/);
        assert.match(err.message, /Conflicting global vocabulary concept for word 'Morning'/);
        return true;
      }
    );

    // Assert zero lessons created in DB
    const lessonsCountAfter = await prisma.lesson.count({ where: { unitId: SAMPLE_A1_CONSTANTS.unitId } });
    assert.equal(lessonsCountAfter, lessonsCountBefore);

    // Clean up
    await prisma.vocabularyConcept.deleteMany({
      where: { languageId: langRes.languageId, normalizedForm: 'morning' },
    });
  });

  test('(f) PUBLISHED+PLANNED activation with no new revision', async () => {
    const res1 = await provisionSampleA1Curriculum(prisma, { adminId, teacherId });
    assert.equal(res1.alreadyProvisioned, false);

    const l1Id = res1.lessonIds[0];
    const l1 = await prisma.lesson.findUniqueOrThrow({ where: { id: l1Id } });
    const initialRevId = l1.activeRevisionId;

    // Set to PLANNED
    await prisma.lesson.update({
      where: { id: l1Id },
      data: { availability: 'PLANNED' },
    });

    const revsCountBefore = await prisma.lessonRevision.count({ where: { lessonId: l1Id } });

    // Second provision activates without creating new revision
    const res2 = await provisionSampleA1Curriculum(prisma, { adminId, teacherId });
    assert.equal(res2.alreadyProvisioned, false);
    assert.equal(res2.lessonIds.length, 3);

    const l1After = await prisma.lesson.findUniqueOrThrow({ where: { id: l1Id } });
    assert.equal(l1After.availability, 'AVAILABLE');
    assert.equal(l1After.activeRevisionId, initialRevId);

    const revsCountAfter = await prisma.lessonRevision.count({ where: { lessonId: l1Id } });
    assert.equal(revsCountAfter, revsCountBefore);
  });
});
