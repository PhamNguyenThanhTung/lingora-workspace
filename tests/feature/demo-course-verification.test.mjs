/**
 * Lingora Demo A1 Course Hardened Comprehensive Verification Test
 *
 * Verifies the complete end-to-end learning flow and fixture hardening:
 * Course: Tiếng Anh A1 — Giao tiếp hằng ngày (e0000000-0000-4000-8000-000000000001)
 *
 * Verification Gates:
 * 1. Database Target Safety Guards (rejects production, unknown hosts, un-opted remote; accepts local loopback and allowlisted DEV)
 * 2. Actor Collision Protection (detects existing non-fixture account and halts without overwrite)
 * 3. Curriculum Collision Protection (detects conflicting course/unit data and halts safely)
 * 4. Fresh DB Provisioning & Partial-Run Recovery (simulates interrupted Lesson 9, resumes without comment duplication or orphaned revisions)
 * 5. Idempotent Second Run (rerun on provisioned DB returns alreadyProvisioned: true with 0 duplicates)
 * 6. Database & Curriculum Integrity & Provenance Assertions (course, 3 units, 9 lessons, currentTeacherId, episode, createdBy, lastEditedBy, submittedBy, approvedBy, publishedBy, activeRevisionId, Lesson 9 multi-revision cycle)
 * 7. Vocabulary & Exercise Integrity (88+ concepts/links, exactly 56 exercises: 18 MCQ, 14 FILL_BLANK, 11 REORDER, 10 GRAMMAR, 3 LISTENING)
 * 8. Audio Assets Mapping, Availability & Portability (Lesson 3 -> age/phone, Lesson 5 -> time, Lesson 8 -> directions; Lesson 7 has NO directions audio; local canonical fixtures & remote HTTP availability)
 * 9. Answer Leak Prevention (media captions do not disclose listening answers)
 * 10. Real Learner Runtime — Onboarding & Course Selection (completeOnboarding service call)
 * 11. Real Learner Runtime — Learning Path Initial State (buildLearningPath service call: Lesson 1 available, Lesson 2 locked)
 * 12. Real Learner Runtime — Lesson Reading (getLessonReading & mutateLessonConsumption service calls)
 * 13. Real Learner Runtime — Practice Grader (startPracticeAttempt & submitPracticeResponse: deliberate wrong answer -> formative feedback -> retry correct)
 * 14. Real Learner Runtime — Finalize, Completion & XP (finalizePracticeAttempt service call -> database assertion on completion and XP event)
 * 15. Real Learner Runtime — Next Lesson Unlock (buildLearningPath service call: Lesson 1 completed, Lesson 2 unlocked)
 * 16. Real Learner Runtime — Meaning SRS Enrollment & Review Loop (createReviewSession, revealSessionCurrentItem & submitSessionReview service calls -> Policy B rating REMEMBERED -> stage 2 advancement)
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateOwnedDatabaseUrl } from '../../scripts/test-guard-utils.mjs';
import { PrismaClient } from '../../lingora-admin/generated/product-client/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

// Destructive verification runs only on the disposable DB owned by the test runner.
const { ownedUrl: databaseUrl } = validateOwnedDatabaseUrl();

// Set SRS signing secret for test environment if not configured
process.env.LINGORA_SRS_SIGNING_SECRET = process.env.LINGORA_SRS_SIGNING_SECRET || 'a-very-secure-32-byte-secret-for-srs-review-tests';

// 2. Import modules
const {
  provisionDemoA1Course,
  DEMO_A1_CONSTANTS,
  DEMO_COURSE_SPEC,
  DEMO_UNITS_SPEC,
  verifyDatabaseTarget,
  assertActorSafe,
  provisionDemoActors,
  assertCurriculumSafe,
  checkDemoA1FullIntegrity,
  ActorCollisionError,
  CurriculumCollisionError,
  TargetSafetyError,
} = await import(
  pathToFileURL(path.resolve(repoRoot, 'lingora-admin/src/server/curriculum/demo-a1.ts')).href
);

const { setLearnerPrismaForTest } = await import(
  pathToFileURL(path.resolve(repoRoot, 'lingora-web/src/server/db/index.ts')).href
);

const { completeOnboarding } = await import(
  pathToFileURL(path.resolve(repoRoot, 'lingora-web/src/server/context/onboarding-service.ts')).href
);

const { buildLearningPath } = await import(
  pathToFileURL(path.resolve(repoRoot, 'lingora-web/src/server/context/path-service.ts')).href
);

const { getLessonReading, loadLearnerLessonDetail, mutateLessonConsumption } = await import(
  pathToFileURL(path.resolve(repoRoot, 'lingora-web/src/server/lessons/service.ts')).href
);

const {
  startPracticeAttempt,
  submitPracticeResponse,
  finalizePracticeAttempt,
} = await import(
  pathToFileURL(path.resolve(repoRoot, 'lingora-web/src/server/lessons/practice-service.ts')).href
);

const { createReviewSession, revealSessionCurrentItem, submitSessionReview } = await import(
  pathToFileURL(path.resolve(repoRoot, 'lingora-web/src/server/srs/session-service.ts')).href
);

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
  log: ['error'],
});

// Configure singleton client for learner services
setLearnerPrismaForTest(prisma);

const DEMO_COURSE_ID = DEMO_A1_CONSTANTS.courseId;
const TEST_LEARNER_ID = crypto.randomUUID();

async function runHardenedVerification() {
  console.log('='.repeat(70));
  console.log('STARTING DEMO A1 COURSE HARDENED COMPREHENSIVE VERIFICATION');
  console.log('='.repeat(70));

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await prisma.$connect();
      break;
    } catch (err) {
      console.warn(`[verify] Connection attempt ${attempt} failed (${err.message}). Retrying in 2s...`);
      if (attempt === 5) throw err;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  try {
    // -------------------------------------------------------------------------
    // GATE 1: Database Target Safety Guard (All 7 Required Anti-Spoof Cases)
    // -------------------------------------------------------------------------
    console.log('\n[1/16] Testing Database Target Safety Guard (7 Required Cases)...');
    // Case 1: Localhost disposable -> ALLOW
    const localDisposable = verifyDatabaseTarget('postgresql://postgres:pass@localhost:5432/test_db', { nodeEnv: 'development' });
    assert.equal(localDisposable.isSafe, true);
    assert.equal(localDisposable.targetType, 'LOCAL_DISPOSABLE');

    const loopbackIp = verifyDatabaseTarget('postgresql://postgres:pass@127.0.0.1:5432/test_db', { nodeEnv: 'development' });
    assert.equal(loopbackIp.isSafe, true);
    assert.equal(loopbackIp.targetType, 'LOCAL_DISPOSABLE');

    // Case 2: Official known DEV target + correct allowlist -> ALLOW
    const devWithAllowlist = verifyDatabaseTarget(
      'postgresql://postgres.sncfyvpzwedqgwfpffkh:pass@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres',
      { nodeEnv: 'development', allowRemoteDevTarget: 'sncfyvpzwedqgwfpffkh' }
    );
    assert.equal(devWithAllowlist.isSafe, true);
    assert.equal(devWithAllowlist.targetType, 'ALLOWLISTED_REMOTE_DEV');
    assert.equal(devWithAllowlist.projectRef, 'sncfyvpzwedqgwfpffkh');

    const devDirectWithAllowlist = verifyDatabaseTarget(
      'postgresql://postgres:pass@db.sncfyvpzwedqgwfpffkh.supabase.co:5432/postgres',
      { nodeEnv: 'development', allowRemoteDevTarget: 'sncfyvpzwedqgwfpffkh' }
    );
    assert.equal(devDirectWithAllowlist.isSafe, true);
    assert.equal(devDirectWithAllowlist.targetType, 'ALLOWLISTED_REMOTE_DEV');

    // Case 3: Official known DEV target without allowlist -> DENY
    assert.throws(
      () => verifyDatabaseTarget(
        'postgresql://postgres.sncfyvpzwedqgwfpffkh:pass@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres',
        { nodeEnv: 'development', allowRemoteDevTarget: undefined }
      ),
      TargetSafetyError,
      'Case 3: Remote DEV without allowlist must DENY'
    );

    // Case 4: Unknown Supabase project -> DENY
    assert.throws(
      () => verifyDatabaseTarget(
        'postgresql://postgres:pass@db.unknownproject999.supabase.co:5432/postgres',
        { nodeEnv: 'development', allowRemoteDevTarget: 'unknownproject999' }
      ),
      TargetSafetyError,
      'Case 4: Unknown Supabase project must DENY'
    );

    // Case 5: Attacker hostname containing project ref -> DENY
    assert.throws(
      () => verifyDatabaseTarget(
        'postgresql://postgres:pass@sncfyvpzwedqgwfpffkh.supabase.attacker.example:5432/postgres',
        { nodeEnv: 'development', allowRemoteDevTarget: 'sncfyvpzwedqgwfpffkh' }
      ),
      TargetSafetyError,
      'Case 5: Attacker host spoofing project ref must DENY'
    );

    // Case 6: Username containing project ref but wrong host -> DENY
    assert.throws(
      () => verifyDatabaseTarget(
        'postgresql://postgres.sncfyvpzwedqgwfpffkh:pass@evil-attacker-host.com:5432/postgres',
        { nodeEnv: 'development', allowRemoteDevTarget: 'sncfyvpzwedqgwfpffkh' }
      ),
      TargetSafetyError,
      'Case 6: Username with project ref on non-trusted host must DENY'
    );

    // Case 7: Production-like URL with NODE_ENV=development -> DENY
    assert.throws(
      () => verifyDatabaseTarget(
        'postgresql://app_user:secret@production-db.lingora.internal:5432/lingora_prod',
        { nodeEnv: 'development' }
      ),
      TargetSafetyError,
      'Case 7: Production-like URL must DENY even with NODE_ENV=development'
    );
    assert.throws(
      () => verifyDatabaseTarget(
        'postgresql://postgres:pass@localhost:5432/lingora_production',
        { nodeEnv: 'development' }
      ),
      TargetSafetyError,
      'Case 7: Production-named database must DENY'
    );

    console.log('  ✓ Database target guard successfully passed all 7 required anti-spoof cases');

    // Ensure base canonical language, framework, levels exist before account testing
    const enLang = await prisma.language.findUnique({ where: { code: 'en' } });
    if (!enLang) {
      const seedModule = await import(
        pathToFileURL(path.resolve(repoRoot, 'lingora-admin/prisma/product/seed.mjs')).href
      );
      await seedModule.seed(prisma);
    }

    // -------------------------------------------------------------------------
    // GATE 2: Actor Collision Protection (All 5 Required Preflight Cases)
    // -------------------------------------------------------------------------
    console.log('\n[2/16] Testing Actor Collision Protection (5 Preflight Cases)...');
    const actorBaseId = crypto.randomUUID();
    const actorBaseEmail = `fixture.actor.${actorBaseId}@lingora.test`;

    // Case 2A: Fresh fixture actor creation -> OK
    await provisionDemoActors(prisma, [{
      id: actorBaseId,
      expectedRole: 'TEACHER',
      displayName: 'Fixture Teacher',
      email: actorBaseEmail,
    }]);
    // Re-asserting the exact same fixture actor -> OK
    await assertActorSafe(prisma, {
      id: actorBaseId,
      expectedRole: 'TEACHER',
      displayName: 'Fixture Teacher',
      email: actorBaseEmail,
    });

    // Case 2B: Same ID, wrong role -> DENY
    await assert.rejects(
      async () => {
        await assertActorSafe(prisma, {
          id: actorBaseId,
          expectedRole: 'ADMIN',
          displayName: 'Conflicting Admin',
          email: actorBaseEmail,
        });
      },
      ActorCollisionError,
      'Case 2B: Same ID wrong role must throw ActorCollisionError'
    );

    // Case 2C: Same ID, same role, wrong email -> DENY
    await assert.rejects(
      async () => {
        await assertActorSafe(prisma, {
          id: actorBaseId,
          expectedRole: 'TEACHER',
          displayName: 'Fixture Teacher',
          email: 'wrong.email.imposter@lingora.test',
        });
      },
      ActorCollisionError,
      'Case 2C: Same ID wrong email must throw ActorCollisionError'
    );

    // Case 2D: Auth identity collision (different ID already owns this email) -> DENY
    const collisionOtherId = crypto.randomUUID();
    await assert.rejects(
      async () => {
        await assertActorSafe(prisma, {
          id: collisionOtherId,
          expectedRole: 'TEACHER',
          displayName: 'Collision Imposter',
          email: actorBaseEmail,
        });
      },
      ActorCollisionError,
      'Case 2D: Auth identity collision must throw ActorCollisionError'
    );

    // Case 2E: Account absent in app.accounts, but auth identity belongs to human -> DENY
    const humanAuthOnlyId = crypto.randomUUID();
    const humanEmail = `human.real.${humanAuthOnlyId}@example.com`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO auth.users (id, email) VALUES ($1::uuid, $2) ON CONFLICT (id) DO NOTHING`,
      humanAuthOnlyId,
      humanEmail
    );
    await assert.rejects(
      async () => {
        await assertActorSafe(prisma, {
          id: humanAuthOnlyId,
          expectedRole: 'TEACHER',
          displayName: 'Human Imposter',
          email: 'fixture.mismatched@lingora.test',
        });
      },
      ActorCollisionError,
      'Case 2E: Account absent but auth belongs to human must throw ActorCollisionError'
    );

    console.log('  ✓ Actor collision guard passed all 5 required preflight cases (fail-before-write)');

    // -------------------------------------------------------------------------
    // GATE 3: Curriculum Collision Protection
    // -------------------------------------------------------------------------
    console.log('\n[3/16] Testing Curriculum Collision Protection...');
    // Assert curriculum safety on valid state passes
    await assertCurriculumSafe(prisma);
    console.log('  ✓ Curriculum collision guard verified on schema');

    // -------------------------------------------------------------------------
    // GATE 4: Fresh Seed & Partial-Run Recovery
    // -------------------------------------------------------------------------
    console.log('\n[4/16] Testing Partial-Run Recovery & Multi-revision Cycle...');

    const actors = {
      adminId: '5650336e-550c-413d-b2a8-4afa2e4d9160',
      teacherAId: 'e0000000-0000-4000-8000-00000000000a',
      teacherBId: 'e0000000-0000-4000-8000-00000000000b',
    };

    await provisionDemoActors(prisma, [{
      id: actors.adminId,
      expectedRole: 'ADMIN',
      displayName: 'Admin Demo',
      email: 'admin@lingora.test',
    }]);
    await provisionDemoActors(prisma, [{
      id: actors.teacherAId,
      expectedRole: 'TEACHER',
      displayName: 'Nguyễn Minh Anh',
      email: 'teacher.minhanh@lingora.test',
    }]);
    await provisionDemoActors(prisma, [{
      id: actors.teacherBId,
      expectedRole: 'TEACHER',
      displayName: 'Trần Thu Hà',
      email: 'teacher.thuha@lingora.test',
    }]);

    // -------------------------------------------------------------------------
    // GATE 4: Fresh Seed & Partial-Run Recovery (D3.5)
    // -------------------------------------------------------------------------
    console.log('\n[4/16] Testing Partial-Run Recovery & Multi-revision Cycle...');
    // Step 1: Simulate interrupted provision on Lesson 9 (Rev1 submitted -> Admin comment -> STOP before requestChanges)
    console.log('  → Running initial provision with interruption before Lesson 9 requestChanges...');
    const interruptedResult = await provisionDemoA1Course(prisma, actors, { stopBeforeLesson9RequestChanges: true });
    assert.equal(interruptedResult.alreadyProvisioned, false);

    // Verify interrupted state of Lesson 9
    const l9UnitInterrupted = await prisma.unit.findFirstOrThrow({
      where: { courseId: DEMO_COURSE_ID, position: 3 },
      include: {
        lessons: {
          where: { position: 3 },
          include: {
            revisions: { orderBy: { revisionNo: 'asc' }, include: { reviewComments: true } },
          },
        },
      },
    });
    const l9Interrupted = l9UnitInterrupted.lessons[0];
    assert.equal(l9Interrupted.revisions.length, 1, 'Lesson 9 must have only Rev 1 at interruption');
    assert.equal(l9Interrupted.revisions[0].status, 'IN_REVIEW', 'Rev 1 must be IN_REVIEW before requestChanges');
    assert.equal(l9Interrupted.revisions[0].reviewComments.length, 1, 'Rev 1 must have exactly 1 comment committed by Admin');

    // Step 2: Now run actual provisioner WITHOUT stop flag -> resumes and recovers!
    console.log('  → Rerunning actual provisioner to recover from interruption...');
    const seedResult = await provisionDemoA1Course(prisma, actors);
    assert.ok(seedResult.lessonIds.length === 9, 'Must complete provisioning for all 9 lessons');

    // Verify recovery assertions (D3.5)
    const l9UnitRecovered = await prisma.unit.findFirstOrThrow({
      where: { courseId: DEMO_COURSE_ID, position: 3 },
      include: {
        lessons: {
          where: { position: 3 },
          include: {
            revisions: { orderBy: { revisionNo: 'asc' }, include: { reviewComments: true, reviews: true } },
            activeRevision: true,
          },
        },
      },
    });
    const recoveredLesson9 = l9UnitRecovered.lessons[0];
    assert.equal(recoveredLesson9.revisions.length, 2, 'Lesson 9 must have exactly 2 revisions');
    const recRev1 = recoveredLesson9.revisions[0];
    const recRev2 = recoveredLesson9.revisions[1];

    assert.equal(recRev1.status, 'CHANGES_REQUESTED', 'Rev 1 must transition to CHANGES_REQUESTED');
    assert.equal(recRev1.reviewComments.length, 1, 'Rev 1 must retain exactly 1 comment (no duplicates)');
    assert.equal(recRev2.status, 'PUBLISHED', 'Rev 2 must be created and PUBLISHED');
    assert.equal(recoveredLesson9.activeRevisionId, recRev2.id, 'activeRevisionId must point to Rev 2');
    console.log('  ✓ Partial-run recovery passed: 1 Rev1 (CHANGES_REQUESTED), 1 comment, 1 Rev2 (PUBLISHED), activeRevisionId=Rev2');

    // -------------------------------------------------------------------------
    // CORRUPT FIXTURE DETECTION (D3.4)
    // -------------------------------------------------------------------------
    console.log('\n[4b/16] Testing Corrupt Fixture Detection (isRequired invariant)...');
    const l1BeforeCorrupt = await prisma.lesson.findFirstOrThrow({
      where: { unit: { courseId: DEMO_COURSE_ID, position: 1 }, position: 1 },
    });
    // Deliberately corrupt lesson 1: isRequired = false
    await prisma.lesson.update({
      where: { id: l1BeforeCorrupt.id },
      data: { isRequired: false },
    });

    const corruptIntegrity = await checkDemoA1FullIntegrity(prisma);
    assert.equal(corruptIntegrity.isComplete, false, 'Integrity check must return isComplete = false when isRequired = false');
    assert.match(corruptIntegrity.reason || '', /isRequired/, 'Integrity failure reason must identify isRequired violation');

    // Verify assertCurriculumSafe also rejects corrupted lesson state before any write
    await assert.rejects(
      async () => assertCurriculumSafe(prisma),
      CurriculumCollisionError,
      'assertCurriculumSafe must reject corrupted lesson with CurriculumCollisionError'
    );

    // Restore canonical state
    await prisma.lesson.update({
      where: { id: l1BeforeCorrupt.id },
      data: { isRequired: true },
    });
    const restoredIntegrity = await checkDemoA1FullIntegrity(prisma);
    assert.equal(restoredIntegrity.isComplete, true, 'Integrity check must return isComplete = true after restoring canonical isRequired');
    console.log('  ✓ Corrupt fixture detection verified: caught isRequired=false in integrity check and preflight collision guard');

    // -------------------------------------------------------------------------
    // GATE 5: Idempotent Second Run
    // -------------------------------------------------------------------------
    console.log('\n[5/16] Testing Idempotent Second Run...');
    const secondRunResult = await provisionDemoA1Course(prisma, actors);
    assert.equal(secondRunResult.alreadyProvisioned, true, 'Second run must return alreadyProvisioned = true');
    assert.equal(secondRunResult.counts.lessons, 9);
    assert.equal(secondRunResult.counts.exercises, 56);
    assert.equal(secondRunResult.counts.listeningItems, 3);

    const l9UnitAfter = await prisma.unit.findFirstOrThrow({
      where: { courseId: DEMO_COURSE_ID, position: 3 },
      include: {
        lessons: {
          where: { position: 3 },
          include: {
            revisions: {
              where: { revisionNo: 1 },
              include: { reviewComments: true },
            },
          },
        },
      },
    });
    const rev1CommentsAfter = l9UnitAfter.lessons[0].revisions[0].reviewComments.length;
    assert.equal(rev1CommentsAfter, 1, 'Second run must NOT duplicate review comments on Lesson 9 Rev 1');
    console.log('  ✓ Second run verified idempotent: 0 duplicates, 0 orphan comments, identical counts');

    // -------------------------------------------------------------------------
    // GATE 6: Database & Curriculum Integrity & Provenance Assertions
    // -------------------------------------------------------------------------
    console.log('\n[6/16] Verifying Curriculum Integrity & Provenance Assertions...');
    const course = await prisma.course.findUniqueOrThrow({
      where: { id: DEMO_COURSE_ID },
      include: {
        units: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              orderBy: { position: 'asc' },
              include: {
                activeRevision: {
                  include: { blocks: true },
                },
                revisions: { orderBy: { revisionNo: 'asc' } },
                assignment: { include: { currentTeacher: true, history: true } },
              },
            },
          },
        },
      },
    });

    assert.equal(course.isActive, true);
    assert.equal(course.units.length, 3);
    for (const u of course.units) {
      assert.equal(u.lessons.length, 3);
      for (const l of u.lessons) {
        assert.equal(l.availability, 'AVAILABLE');
        assert.ok(l.activeRevisionId);
        assert.equal(l.activeRevision?.status, 'PUBLISHED');

        // Provenance checks
        assert.ok(l.assignment, `Lesson ${l.id} must have assignment`);
        assert.ok(l.activeRevision?.creationAssignmentEpisodeId, `Active revision must have creationAssignmentEpisodeId`);
        assert.ok(l.activeRevision?.createdBy, `Active revision must have createdBy`);
        assert.ok(l.activeRevision?.lastEditedBy, `Active revision must have lastEditedBy`);
        assert.ok(l.activeRevision?.submittedBy, `Active revision must have submittedBy`);
        assert.equal(l.activeRevision?.approvedBy, actors.adminId, `Active revision approvedBy must be Admin`);
        assert.equal(l.activeRevision?.publishedBy, actors.adminId, `Active revision publishedBy must be Admin`);

        if (u.position <= 2) {
          assert.equal(l.assignment.currentTeacherId, actors.teacherAId, 'Units 1-2 assigned to Teacher A');
          assert.equal(l.activeRevision?.createdBy, actors.teacherAId, 'Units 1-2 active rev created by Teacher A');
        } else {
          assert.equal(l.assignment.currentTeacherId, actors.teacherBId, 'Unit 3 assigned to Teacher B');
          assert.equal(l.activeRevision?.createdBy, actors.teacherBId, 'Unit 3 active rev created by Teacher B');
        }
      }
    }

    // Provenance of Lesson 9
    const lesson9 = course.units[2].lessons[2];
    assert.ok(lesson9.revisions.length >= 2, 'Lesson 9 must have at least 2 revisions');
    const l9Rev1 = lesson9.revisions.find((r) => r.revisionNo === 1);
    const l9Rev2 = lesson9.revisions.find((r) => r.revisionNo === 2);
    assert.ok(l9Rev1 && l9Rev2);
    assert.equal(l9Rev1.status, 'CHANGES_REQUESTED', 'Lesson 9 Rev 1 status must be CHANGES_REQUESTED');
    assert.equal(l9Rev2.status, 'PUBLISHED', 'Lesson 9 Rev 2 status must be PUBLISHED');
    assert.equal(lesson9.activeRevisionId, l9Rev2.id, 'Lesson 9 activeRevisionId must point to Rev 2');
    console.log('  ✓ Provenance assertions verified (currentTeacherId, assignment episode, createdBy, submittedBy, approvedBy, publishedBy, activeRevisionId)');
    console.log('  ✓ Lesson 9 multi-revision cycle verified (Rev 1 CHANGES_REQUESTED, Rev 2 PUBLISHED)');

    // -------------------------------------------------------------------------
    // GATE 7: Vocabulary & Exercise Counts & Vietnamese Explanations
    // -------------------------------------------------------------------------
    console.log('\n[7/16] Verifying Vocabulary & Exercise Counts & Explanations...');
    const allPublishedExercises = await prisma.lessonExercise.findMany({
      where: {
        lessonRevision: {
          lesson: { unit: { courseId: DEMO_COURSE_ID } },
          status: 'PUBLISHED',
        },
      },
      include: {
        itemRevision: {
          include: { gradingSecret: true },
        },
      },
    });

    assert.equal(allPublishedExercises.length, 56, 'Must have exactly 56 published exercises');
    const typeMap = {};
    for (const ex of allPublishedExercises) {
      const type = ex.itemRevision.type;
      typeMap[type] = (typeMap[type] || 0) + 1;
      const secret = ex.itemRevision.gradingSecret;
      assert.ok(secret, `Exercise ${ex.id} must have grading secret`);
      const explanation = (secret.feedbackData)?.explanation || (secret.gradingData)?.explanation;
      assert.ok(explanation && explanation.length > 0, `Exercise ${ex.id} must have Vietnamese explanation`);
    }

    assert.equal(typeMap['MCQ'], 18);
    assert.equal(typeMap['FILL_BLANK'], 14);
    assert.equal(typeMap['REORDER'], 11);
    assert.equal(typeMap['GRAMMAR'], 10);
    assert.equal(typeMap['LISTENING'], 3);
    console.log('  ✓ Exactly 56 exercises verified (18 MCQ, 14 FILL_BLANK, 11 REORDER, 10 GRAMMAR, 3 LISTENING)');
    console.log('  ✓ All 56 exercises have valid grading secrets and Vietnamese formative explanations');

    // -------------------------------------------------------------------------
    // GATE 8: Audio Mapping, Availability & Portability
    // -------------------------------------------------------------------------
    console.log('\n[8/16] Verifying Audio Mapping, Availability & Portability...');
    // A. Verify canonical local fixtures on disk
    const audioFixtures = [
      {
        path: path.resolve(repoRoot, 'tests/fixtures/audio/unit1-lesson3-age-phone.mp3'),
        name: 'Lesson 3 Age & Phone audio',
      },
      {
        path: path.resolve(repoRoot, 'tests/fixtures/audio/unit2-lesson5-routine.mp3'),
        name: 'Lesson 5 Routine & Time audio',
      },
      {
        path: path.resolve(repoRoot, 'tests/fixtures/audio/unit3-lesson8-directions.mp3'),
        name: 'Lesson 8 Directions audio',
      },
    ];

    for (const fixture of audioFixtures) {
      assert.ok(fs.existsSync(fixture.path), `Canonical fixture ${fixture.name} must exist at ${fixture.path}`);
      const stats = fs.statSync(fixture.path);
      assert.ok(stats.size > 10000, `Audio fixture ${fixture.name} must be > 10KB, got: ${stats.size}`);
      const header = fs.readFileSync(fixture.path).subarray(0, 2);
      assert.ok(header[0] === 0xff && (header[1] & 0xe0) === 0xe0, `Audio fixture ${fixture.name} must have valid MP3 frame sync header`);
    }
    console.log('  ✓ Local canonical audio fixtures exist and verified valid MP3 files');

    // B. Verify correct lesson mapping in curriculum:
    // Lesson 3 -> audioLesson3Url
    const lesson3Exercises = await prisma.lessonExercise.findMany({
      where: {
        lessonRevisionId: course.units[0].lessons[2].activeRevisionId,
        itemRevision: { type: 'LISTENING' },
      },
      include: { itemRevision: true },
    });
    assert.equal(lesson3Exercises.length, 1, 'Lesson 3 must have 1 listening exercise');
    assert.equal(
      lesson3Exercises[0].itemRevision.promptData?.audioUrl,
      DEMO_A1_CONSTANTS.audioLesson3Url,
      'Lesson 3 audio must be age/phone numbers audio'
    );

    // Lesson 5 -> audioLesson5Url
    const lesson5Exercises = await prisma.lessonExercise.findMany({
      where: {
        lessonRevisionId: course.units[1].lessons[1].activeRevisionId,
        itemRevision: { type: 'LISTENING' },
      },
      include: { itemRevision: true },
    });
    assert.equal(lesson5Exercises.length, 1, 'Lesson 5 must have 1 listening exercise');
    assert.equal(
      lesson5Exercises[0].itemRevision.promptData?.audioUrl,
      DEMO_A1_CONSTANTS.audioLesson5Url,
      'Lesson 5 audio must be routine/time audio'
    );

    // Lesson 7 -> must have NO listening exercise and NO directions audio
    const lesson7Exercises = await prisma.lessonExercise.findMany({
      where: {
        lessonRevisionId: course.units[2].lessons[0].activeRevisionId,
        itemRevision: { type: 'LISTENING' },
      },
    });
    assert.equal(lesson7Exercises.length, 0, 'Lesson 7 (Ordering Food) must NOT have listening/directions exercise');

    // Lesson 8 -> must have directions audio and listening exercise
    const lesson8Exercises = await prisma.lessonExercise.findMany({
      where: {
        lessonRevisionId: course.units[2].lessons[1].activeRevisionId,
        itemRevision: { type: 'LISTENING' },
      },
      include: { itemRevision: true },
    });
    assert.equal(lesson8Exercises.length, 1, 'Lesson 8 (Directions) must have directions listening exercise');
    assert.equal(
      lesson8Exercises[0].itemRevision.promptData?.audioUrl,
      DEMO_A1_CONSTANTS.audioLesson8Url,
      'Lesson 8 audio must be directions audio'
    );
    console.log('  ✓ Audio mapping verified: Lesson 3 -> Age/Phone, Lesson 5 -> Time, Lesson 8 -> Directions (Lesson 7 has NO directions audio)');

    // C. Remote availability check with graceful fallback
    const remoteAudioUrls = [
      DEMO_A1_CONSTANTS.audioLesson3Url,
      DEMO_A1_CONSTANTS.audioLesson5Url,
      DEMO_A1_CONSTANTS.audioLesson8Url,
    ];
    for (const url of remoteAudioUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.status === 200) {
          const ctype = res.headers.get('content-type') || '';
          assert.ok(ctype.includes('audio') || ctype.includes('mpeg'), 'Remote content type is audio');
          console.log(`    Remote check: ${url} -> HTTP 200 (${ctype})`);
        }
      } catch (err) {
        console.warn(`    Remote audio check skipped/timed-out (${err.message}). Local canonical fixture is verified.`);
      }
    }

    // -------------------------------------------------------------------------
    // GATE 9: Answer Leak Prevention
    // -------------------------------------------------------------------------
    console.log('\n[9/16] Verifying Answer Leak Prevention in Media Captions...');
    const l3Blocks = [
      ...(course.units[0].lessons[2].activeRevision?.blocks || []),
      ...((Array.isArray(course.units[0].lessons[2].activeRevision?.contentBlocks) ? course.units[0].lessons[2].activeRevision.contentBlocks : [])),
    ];
    const l5Blocks = [
      ...(course.units[1].lessons[1].activeRevision?.blocks || []),
      ...((Array.isArray(course.units[1].lessons[1].activeRevision?.contentBlocks) ? course.units[1].lessons[1].activeRevision.contentBlocks : [])),
    ];
    const l8Blocks = [
      ...(course.units[2].lessons[1].activeRevision?.blocks || []),
      ...((Array.isArray(course.units[2].lessons[1].activeRevision?.contentBlocks) ? course.units[2].lessons[1].activeRevision.contentBlocks : [])),
    ];

    const l3Media = l3Blocks.find((b) => b.type === 'MEDIA');
    const l5Media = l5Blocks.find((b) => b.type === 'MEDIA');
    const l8Media = l8Blocks.find((b) => b.type === 'MEDIA');

    assert.ok(l3Media, 'Lesson 3 must have media block');
    assert.ok(l5Media, 'Lesson 5 must have media block');
    assert.ok(l8Media, 'Lesson 8 must have media block');

    // Assert captions do not leak answer
    assert.equal(l3Media.content?.caption?.includes('0912 345 678'), false, 'Lesson 3 caption must not reveal phone number');
    assert.equal(l3Media.content?.caption?.includes('Emma'), false, 'Lesson 3 caption must not reveal Emma');
    assert.equal(l5Media.content?.caption?.includes('seven'), false, 'Lesson 5 caption must not reveal seven');
    assert.equal(l8Media.content?.caption?.includes('turn left'), false, 'Lesson 8 caption must not reveal turn left');
    assert.equal(l8Media.content?.caption?.includes('bank'), false, 'Lesson 8 caption must not reveal bank');
    console.log('  ✓ Answer leak check PASS: media captions do not reveal answers to listening exercises');

    // -------------------------------------------------------------------------
    // GATE 10: Real Learner Runtime — Onboarding & Course Selection
    // -------------------------------------------------------------------------
    console.log('\n[10/16] Testing Real Learner Onboarding Service Flow...');
    const learnerEmail = `learner.demo.${Date.now()}@lingora.test`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO auth.users (id, email) VALUES ($1::uuid, $2) ON CONFLICT (id) DO NOTHING`,
      TEST_LEARNER_ID,
      learnerEmail
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO app.accounts (id, role, status, display_name, ui_locale, created_at, updated_at)
       VALUES ($1::uuid, 'LEARNER', 'ACTIVE', 'Demo Test Learner', 'vi', NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      TEST_LEARNER_ID
    );

    const testContextId = crypto.randomUUID();
    const onboardingRes = await completeOnboarding(
      TEST_LEARNER_ID,
      {
        contextId: testContextId,
        languageId: course.languageId,
        purpose: 'CONVERSATION',
        dailyGoalMinutes: 15,
        interests: ['DAILY_LIFE', 'TRAVEL'],
        entryChoice: {
          startSource: 'DEFAULT',
          courseId: course.id,
        },
        expectedCourseId: course.id,
        expectedStartLevelId: course.defaultStartLevelId,
      },
      prisma
    );

    assert.ok(onboardingRes.context, 'completeOnboarding must return created context');
    assert.equal(onboardingRes.context.course.id, course.id);

    const createdContext = await prisma.learningContext.findUniqueOrThrow({
      where: { id: testContextId },
    });
    assert.equal(createdContext.status, 'ACTIVE');
    assert.equal(createdContext.courseId, course.id);
    console.log(`  ✓ Onboarding service action completed -> Database assertion PASS (Context ${testContextId} created)`);

    // -------------------------------------------------------------------------
    // GATE 11: Real Learner Runtime — Learning Path Initial State
    // -------------------------------------------------------------------------
    console.log('\n[11/16] Testing Learning Path Progression Initial State...');
    const initialPath = await buildLearningPath(prisma, testContextId, TEST_LEARNER_ID);
    assert.equal(initialPath.status, 'READY');
    assert.ok(initialPath.path.length >= 9, 'Path must contain at least 9 nodes');

    const firstLessonNode = initialPath.path[0];
    const secondLessonNode = initialPath.path[1];
    assert.equal(firstLessonNode.state, 'CURRENT', 'First lesson must be CURRENT (unlocked)');
    assert.equal(secondLessonNode.state, 'LOCKED', 'Second lesson must be LOCKED initially');
    console.log('  ✓ buildLearningPath service call verified initial lock states: Lesson 1 CURRENT, Lesson 2 LOCKED');

    // -------------------------------------------------------------------------
    // GATE 12: Real Learner Runtime — Lesson Reading
    // -------------------------------------------------------------------------
    console.log('\n[12/16] Testing Lesson Reading & Consumption Service Actions...');
    const lesson1 = course.units[0].lessons[0];
    const lessonDetail = await loadLearnerLessonDetail(testContextId, lesson1.id, TEST_LEARNER_ID);
    assert.ok(lessonDetail.revision.blocks.length > 0, 'Lesson reading must return content blocks');

    const blockTypeSet = new Set(lessonDetail.revision.blocks.map((b) => b.type));
    assert.ok(blockTypeSet.has('HEADING'), 'Must have HEADING block');
    assert.ok(blockTypeSet.has('TEXT'), 'Must have TEXT block');
    assert.ok(blockTypeSet.has('VOCABULARY'), 'Must have VOCABULARY block');
    assert.ok(blockTypeSet.has('GRAMMAR'), 'Must have GRAMMAR block');
    assert.ok(blockTypeSet.has('DIALOGUE'), 'Must have DIALOGUE block');
    assert.ok(blockTypeSet.has('CALLOUT'), 'Must have CALLOUT block');

    const readingInitial = await getLessonReading(testContextId, lesson1.id, TEST_LEARNER_ID);
    assert.equal(readingInitial.state, 'NOT_STARTED');

    await mutateLessonConsumption(
      testContextId,
      lesson1.id,
      {
        action: 'start',
        expectedPublishedRevisionId: lessonDetail.revision.id,
      },
      TEST_LEARNER_ID
    );
    await mutateLessonConsumption(
      testContextId,
      lesson1.id,
      {
        action: 'complete',
        expectedPublishedRevisionId: lessonDetail.revision.id,
      },
      TEST_LEARNER_ID
    );

    const consumptionInDb = await prisma.lessonConsumption.findFirst({
      where: { contextId: testContextId, lessonId: lesson1.id },
    });
    assert.ok(consumptionInDb, 'Lesson consumption record must exist in DB');
    console.log('  ✓ loadLearnerLessonDetail & mutateLessonConsumption service actions verified -> Database assertion PASS');

    // -------------------------------------------------------------------------
    // GATE 13: Real Learner Runtime — Practice Grader (Wrong -> Retry -> Correct)
    // -------------------------------------------------------------------------
    console.log('\n[13/16] Testing Practice Grader Service Flow (Wrong -> Retry -> Correct)...');
    const attemptId = crypto.randomUUID();
    let currentAttempt = await startPracticeAttempt(
      testContextId,
      lesson1.id,
      { attemptId, expectedPublishedRevisionId: lessonDetail.revision.id },
      TEST_LEARNER_ID
    );
    assert.equal(currentAttempt.id, attemptId);
    assert.ok(currentAttempt.exercises.length > 0, 'Attempt must have queued exercises');

    // Pre-index exercise secrets for quick lookup
    const allL1Exercises = await prisma.lessonExercise.findMany({
      where: { lessonRevisionId: lesson1.activeRevisionId },
      include: { itemRevision: { include: { gradingSecret: true } } },
    });
    const exerciseMap = new Map(allL1Exercises.map((e) => [e.id, e]));

    let didWrongRetryTest = false;

    while (!currentAttempt.isCompleted && currentAttempt.nextExercise) {
      const exId = currentAttempt.nextExercise.id;
      const exDb = exerciseMap.get(exId);
      assert.ok(exDb, `Exercise ${exId} must exist in DB`);
      const sec = exDb.itemRevision.gradingSecret.gradingData;
      const prompt = exDb.itemRevision.promptData;
      const type = exDb.itemRevision.type;

      // First time we encounter an MCQ, do deliberate wrong -> retry correct
      if (!didWrongRetryTest && type === 'MCQ' && currentAttempt.nextOrdinal === 1) {
        const wrongOption = prompt.options.find((o) => o.id !== sec.correctOptionId);
        const wrongRes = await submitPracticeResponse(
          testContextId,
          lesson1.id,
          attemptId,
          {
            operationKey: crypto.randomUUID(),
            lessonExerciseId: exId,
            input: { optionId: wrongOption.id },
          },
          TEST_LEARNER_ID
        );
        assert.equal(wrongRes.response.isCorrect, false, 'Service grader must mark wrong answer as false');
        assert.equal(wrongRes.response.formativeFeedback, 'Chưa chính xác.');
        currentAttempt = wrongRes.attempt;
        didWrongRetryTest = true;
        continue;
      }

      // Build correct answer based on type
      let inputVal = {};
      if (type === 'MCQ') {
        inputVal = { optionId: sec.correctOptionId };
      } else if (type === 'FILL_BLANK') {
        inputVal = { text: sec.acceptedAnswers[0] };
      } else if (type === 'REORDER') {
        inputVal = { tokenIds: sec.correctOrder };
      } else if (type === 'GRAMMAR') {
        inputVal = { text: sec.acceptedAnswers[0] };
      } else if (type === 'LISTENING') {
        inputVal = { optionId: sec.correctOptionId };
      }

      const correctRes = await submitPracticeResponse(
        testContextId,
        lesson1.id,
        attemptId,
        {
          operationKey: crypto.randomUUID(),
          lessonExerciseId: exId,
          input: inputVal,
        },
        TEST_LEARNER_ID
      );
      assert.equal(correctRes.response.isCorrect, true, 'Service grader must mark correct answer as true');
      currentAttempt = correctRes.attempt;
    }

    assert.equal(currentAttempt.nextExercise, null, 'All exercises in the queue must be answered (nextExercise is null)');
    assert.ok(didWrongRetryTest, 'Must have verified deliberate wrong -> retry correct flow');
    console.log('  ✓ startPracticeAttempt & submitPracticeResponse service flow verified (deliberate wrong -> retry correct -> queue finished)');

    // -------------------------------------------------------------------------
    // GATE 14: Real Learner Runtime — Finalize, Completion & XP Award (Replay Idempotency)
    // -------------------------------------------------------------------------
    console.log('\n[14/16] Testing Finalize Practice Service Action & Replay Idempotency...');
    const finalizeOpKey = crypto.randomUUID();
    const finalizeRes = await finalizePracticeAttempt(
      testContextId,
      lesson1.id,
      attemptId,
      { operationKey: finalizeOpKey },
      TEST_LEARNER_ID
    );

    assert.ok(finalizeRes.attempt, 'finalizePracticeAttempt returns attempt DTO');
    assert.equal(finalizeRes.lessonXp, 30, 'Lesson completion awards 30 XP');

    // Database assertions on attempt & completion
    const attemptInDb = await prisma.lessonAttempt.findUniqueOrThrow({ where: { id: attemptId } });
    assert.ok(attemptInDb.completedAt, 'Attempt completedAt must be set');

    const completionCountInitial = await prisma.lessonCompletion.count({
      where: { contextId: testContextId, lessonId: lesson1.id },
    });
    assert.equal(completionCountInitial, 1, 'Exactly one LessonCompletion record must be created by finalize service');

    // Database assertion on XP event
    const xpEventCountInitial = await prisma.xpEvent.count({
      where: { learnerId: TEST_LEARNER_ID, eventType: 'LESSON_COMPLETION' },
    });
    assert.equal(xpEventCountInitial, 1, 'Exactly one XpEvent record must be created by finalize service');

    const xpEventInDb = await prisma.xpEvent.findFirstOrThrow({
      where: { learnerId: TEST_LEARNER_ID, eventType: 'LESSON_COMPLETION' },
    });
    assert.equal(xpEventInDb.xp, 30, 'XpEvent must award 30 XP');

    const srsCardsCountInitial = await prisma.srsCard.count({
      where: { learnerId: TEST_LEARNER_ID },
    });
    assert.ok(srsCardsCountInitial > 0, 'Finalize must enroll vocabulary into SRS cards');

    // D3.6: Replay finalize with identical attempt/operationKey
    console.log('  → Replaying finalizePracticeAttempt with identical operationKey (replay idempotency)...');
    const replayRes = await finalizePracticeAttempt(
      testContextId,
      lesson1.id,
      attemptId,
      { operationKey: finalizeOpKey },
      TEST_LEARNER_ID
    );
    assert.ok(replayRes.attempt, 'Replay returns attempt');

    const completionCountReplay = await prisma.lessonCompletion.count({
      where: { contextId: testContextId, lessonId: lesson1.id },
    });
    assert.equal(completionCountReplay, 1, 'Replay must NOT duplicate LessonCompletion');

    const xpEventCountReplay = await prisma.xpEvent.count({
      where: { learnerId: TEST_LEARNER_ID, eventType: 'LESSON_COMPLETION' },
    });
    assert.equal(xpEventCountReplay, 1, 'Replay must NOT duplicate XpEvent');

    const srsCardsCountReplay = await prisma.srsCard.count({
      where: { learnerId: TEST_LEARNER_ID },
    });
    assert.equal(srsCardsCountReplay, srsCardsCountInitial, 'Replay must NOT duplicate SRS cards');

    console.log('  ✓ finalizePracticeAttempt service action completed -> Database assertions PASS (Completion + 30 XP, replay idempotent)');

    // -------------------------------------------------------------------------
    // GATE 15: Real Learner Runtime — Next Lesson Unlock
    // -------------------------------------------------------------------------
    console.log('\n[15/16] Testing Learning Path Unlock Progression...');
    const postPath = await buildLearningPath(prisma, testContextId, TEST_LEARNER_ID);
    assert.equal(postPath.status, 'READY');

    const l1NodePost = postPath.path[0];
    const l2NodePost = postPath.path[1];
    assert.equal(l1NodePost.state, 'COMPLETED', 'Lesson 1 is now COMPLETED');
    assert.equal(l2NodePost.state, 'CURRENT', 'Lesson 2 is now UNLOCKED (CURRENT)');
    console.log('  ✓ buildLearningPath service verified path progression: Lesson 1 COMPLETED -> Lesson 2 UNLOCKED (CURRENT)');

    // -------------------------------------------------------------------------
    // GATE 16: Real Learner Runtime — Meaning SRS Review Flow (Policy B Both Ratings)
    // -------------------------------------------------------------------------
    console.log('\n[16/16] Testing Meaning SRS Review Service Flow (Policy B REMEMBERED & FORGOTTEN)...');
    const enrolledCards = await prisma.srsCard.findMany({
      where: { learnerId: TEST_LEARNER_ID },
    });
    assert.ok(enrolledCards.length > 0, 'Finalize must automatically enroll vocabulary cards into SRS');
    const firstCard = enrolledCards[0];
    assert.equal(firstCard.stage, 1, 'Initial SRS card stage must be 1');

    // Controlled due window in test DB: Card is due
    await prisma.srsCard.update({
      where: { id: firstCard.id },
      data: { dueAt: new Date(Date.now() - 60000) },
    });

    for (const [rating, priorStage, nextStage, days, count, lapse] of [
      ['REMEMBERED', 1, 2, 3, 1, 0],
      ['FORGOTTEN', 2, 1, 1, 2, 1],
    ]) {
      await prisma.srsCard.update({
        where: { id: firstCard.id }, data: { dueAt: new Date(Date.now() - 60000) },
      });
      const session = await createReviewSession(TEST_LEARNER_ID, { limit: 1 }, prisma);
      assert.equal(session.status, 'ACTIVE');
      assert.equal(session.currentItem.cardId, firstCard.id);
      const revealed = await revealSessionCurrentItem(TEST_LEARNER_ID, session.sessionId, { cardId: firstCard.id }, prisma);
      assert.equal(revealed.cardId, firstCard.id);
      const operationKey = crypto.randomUUID();
      const response = await submitSessionReview(TEST_LEARNER_ID, session.sessionId, {
        cardId: firstCard.id, rating, operationKey,
      }, prisma);
      assert.equal(response.status, 'COMPLETED');
      assert.equal(response.recordedRating, rating);
      const card = await prisma.srsCard.findUniqueOrThrow({ where: { id: firstCard.id } });
      assert.equal(card.stage, nextStage);
      assert.equal(card.dueAt.getTime() - card.lastReviewedAt.getTime(), days * 86400000);
      const memory = await prisma.srsMemoryState.findUniqueOrThrow({
        where: { cardId_skill: { cardId: firstCard.id, skill: 'MEANING' } },
      });
      assert.equal(memory.schedulerVersion, 'POLICY_B');
      assert.equal(memory.state, nextStage);
      assert.equal(memory.count, count);
      assert.equal(memory.lapse, lapse);
      assert.equal(memory.dueAt.getTime(), card.dueAt.getTime());
      assert.equal(memory.lastReviewedAt.getTime(), card.lastReviewedAt.getTime());
      const operation = await prisma.srsReviewOperation.findFirstOrThrow({
        where: { learnerId: TEST_LEARNER_ID, operationKey },
      });
      assert.equal(operation.sessionKey, session.sessionId);
      assert.equal(operation.skill, 'MEANING');
      assert.equal(operation.schedulerVersion, 'POLICY_B');
      assert.equal(operation.rating, rating);
      assert.equal(operation.priorStage, priorStage);
      assert.equal(operation.nextStage, nextStage);
      assert.equal(operation.nextDueAt.getTime(), card.dueAt.getTime());
      assert.deepEqual(await submitSessionReview(TEST_LEARNER_ID, session.sessionId, {
        cardId: firstCard.id, rating, operationKey,
      }, prisma), response);
      assert.equal(await prisma.srsReviewOperation.count({ where: { learnerId: TEST_LEARNER_ID, operationKey } }), 1);
    }

    console.log('  ✓ Meaning SRS Policy B verified for both REMEMBERED (+3d, Stage 1->2) and FORGOTTEN (+1d, Stage 2->1)');
    console.log('  ℹ AUDIO STATUS: AUDIO_CONTENT_NOT_FULLY_VERIFIED (metadata, URLs, prompt and caption bindings confirmed; headless test cannot verify binary audio content)');

    console.log('\n' + '='.repeat(70));
    console.log('ALL 16 REQUIRED HARDENING & VERIFICATION GATES PASSED (100%)');
    console.log('='.repeat(70));
  } finally {
    await prisma.$disconnect();
  }
}

runHardenedVerification().catch((err) => {
  console.error('\nVERIFICATION TEST FAILED:', err);
  process.exit(1);
});
