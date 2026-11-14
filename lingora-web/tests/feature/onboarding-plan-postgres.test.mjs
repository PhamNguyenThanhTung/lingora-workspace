import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../../../lingora-admin/generated/product-client/index.js';
import { startPracticeAttempt, submitPracticeResponse, finalizePracticeAttempt } from '../../src/server/lessons/practice-service.ts';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import {
  completeOnboarding,
  getContextPlan,
  updateContextPlan,
} from '../../src/server/context/onboarding-service.ts';
import {
  createContextConcurrencyFixture,
  deferred,
  bounded,
} from './harness/context-db-fixture.mjs';

const url = process.env.SLICE11_TEST_DATABASE_URL;
assert.ok(url, 'Explicit owned loopback DB required (run via scripts/local-test-db.mjs)');
const parsed = new URL(url);
assert.ok(['127.0.0.1', 'localhost'].includes(parsed.hostname), 'Loopback host required');
assert.match(parsed.pathname, /^\/slice11_test/, 'Test database identity required');
assert.equal(process.env.SLICE11_TEST_DATABASE_OWNED, '1', 'Explicit owned optin marker required');

const db = new PrismaClient({ datasourceUrl: url, log: [] });
let f;

async function createFreshLearner(prisma) {
  const id = randomUUID();
  await prisma.$executeRaw`INSERT INTO auth.users (id, email) VALUES (${id}::uuid, ${id + '@test.local'}) ON CONFLICT DO NOTHING`;
  await prisma.account.create({
    data: { id, role: 'LEARNER', status: 'ACTIVE', timezone: 'Asia/Ho_Chi_Minh' },
  });
  return id;
}

before(async () => {
  await db.$connect();
  setLearnerPrismaForTest(db);
});

after(async () => {
  setLearnerPrismaForTest(null);
  await db.$disconnect();
});

beforeEach(async () => {
  f = await createContextConcurrencyFixture(db);
});

test('Real PostgreSQL: First completeOnboarding creates 1 LearningContext and exactly 1 ACTIVE LearningPlan atomically', async () => {
  const learner = await createFreshLearner(db);
  const contextId = randomUUID();
  const res = await completeOnboarding(learner, {
    contextId,
    languageId: f.lang,
    purpose: 'TRAVEL',
    dailyGoalMinutes: 15,
    interests: ['TRAVEL', 'FOOD'],
    entryChoice: { startSource: 'DEFAULT' },
    expectedCourseId: f.course,
    expectedStartLevelId: f.level,
  }, db);

  assert.equal(res.context.id, contextId);
  assert.equal(res.context.status, 'ACTIVE');
  assert.equal(res.plan.contextId, contextId);
  assert.equal(res.plan.status, 'ACTIVE');
  assert.equal(res.plan.dailyGoalMinutes, 15);
  assert.deepEqual(res.plan.reasonCodes, ['LOWEST_AVAILABLE_LEVEL']);
  assert.ok(res.nextLesson);
  assert.equal(res.nextLesson.id, f.lesson);

  // Check DB state directly
  const savedContext = await db.learningContext.findUnique({
    where: { id: contextId },
  });
  assert.ok(savedContext);
  assert.equal(savedContext.purpose, 'TRAVEL');
  assert.equal(savedContext.studyPreferences?.dailyGoalMinutes, 15);
  assert.deepEqual(savedContext.studyPreferences?.interests, ['TRAVEL', 'FOOD']);
  assert.equal(savedContext.studyPreferences?.onboardingVersion, 1);
  assert.ok(savedContext.studyPreferences?.onboardingCompletedAt);

  const activePlans = await db.learningPlan.findMany({
    where: { contextId, status: 'ACTIVE' },
  });
  assert.equal(activePlans.length, 1);
  assert.equal(activePlans[0].id, res.plan.id);
  assert.equal(activePlans[0].dailyGoalMinutes, 15);
  assert.equal(activePlans[0].source, 'DEFAULT');
});

test('Real PostgreSQL: Double-submit with same contextId & intent converges idempotently on same context and plan', async () => {
  const learner = await createFreshLearner(db);
  const contextId = randomUUID();
  const payload = {
    contextId,
    languageId: f.lang,
    purpose: 'WORK',
    dailyGoalMinutes: 10,
    interests: ['BUSINESS'],
    entryChoice: { startSource: 'DEFAULT' },
    expectedCourseId: f.course,
    expectedStartLevelId: f.level,
  };

  const [res1, res2] = await Promise.all([
    completeOnboarding(learner, payload, db),
    completeOnboarding(learner, payload, db),
  ]);
  await assert.rejects(completeOnboarding(learner, { ...payload, purpose: 'TRAVEL' }, db), { code: 'CONTEXT_CONFLICT' });
  await assert.rejects(completeOnboarding(learner, { ...payload, interests: ['FOOD'] }, db), { code: 'CONTEXT_CONFLICT' });

  assert.equal(res1.context.id, res2.context.id);
  assert.equal(res1.plan.id, res2.plan.id);
  assert.equal(res1.plan.dailyGoalMinutes, res2.plan.dailyGoalMinutes);

  const totalPlans = await db.learningPlan.count({ where: { contextId } });
  assert.equal(totalPlans, 1);
});

test('Real PostgreSQL: Reusing contextId with conflicting payload fails 409 CONTEXT_CONFLICT', async () => {
  const learner = await createFreshLearner(db);
  const contextId = randomUUID();
  await completeOnboarding(learner, {
    contextId,
    languageId: f.lang,
    dailyGoalMinutes: 10,
    entryChoice: { startSource: 'DEFAULT' },
    expectedCourseId: f.course,
    expectedStartLevelId: f.level,
  }, db);

  await assert.rejects(
    async () => {
      await completeOnboarding(learner, {
        contextId,
        languageId: f.lang,
        dailyGoalMinutes: 20, // Different goal
        entryChoice: { startSource: 'DEFAULT' },
        expectedCourseId: f.course,
        expectedStartLevelId: f.level,
      }, db);
    },
    { status: 409, code: 'CONTEXT_CONFLICT' }
  );
});

test('Real PostgreSQL: Foreign contextId fails with 409 CONTEXT_CONFLICT', async () => {
  const learner1 = await createFreshLearner(db);
  const learner2 = await createFreshLearner(db);
  const contextId = randomUUID();

  await completeOnboarding(learner1, {
    contextId,
    languageId: f.lang,
    entryChoice: { startSource: 'DEFAULT' },
    expectedCourseId: f.course,
    expectedStartLevelId: f.level,
  }, db);

  // Learner 2 attempts to complete using Learner 1's contextId
  await assert.rejects(
    async () => {
      await completeOnboarding(learner2, {
        contextId,
        languageId: f.lang,
        entryChoice: { startSource: 'DEFAULT' },
        expectedCourseId: f.course,
        expectedStartLevelId: f.level,
      }, db);
    },
    { status: 409, code: 'CONTEXT_CONFLICT' }
  );
});

test('Real PostgreSQL: Stale preview expectation fails with 409 RECOMMENDATION_CHANGED', async () => {
  const learner = await createFreshLearner(db);
  const contextId = randomUUID();
  await assert.rejects(
    async () => {
      await completeOnboarding(learner, {
        contextId,
        languageId: f.lang,
        entryChoice: { startSource: 'DEFAULT' },
        expectedCourseId: f.course,
        expectedStartLevelId: f.level2, // Level 2 when Level 1 is the lowest available level!
      }, db);
    },
    { status: 409, code: 'RECOMMENDATION_CHANGED' }
  );

  const contextCount = await db.learningContext.count({ where: { id: contextId } });
  assert.equal(contextCount, 0);
});

test('Real PostgreSQL: Capacity rule limits to 2 ACTIVE contexts', async () => {
  const learner = await createFreshLearner(db);
  // Setup 2 additional languages and courses
  const lang2 = randomUUID();
  const lang3 = randomUUID();
  await db.language.createMany({
    data: [
      { id: lang2, code: 'l2', names: { vi: 'L2' }, isLearnable: true },
      { id: lang3, code: 'l3', names: { vi: 'L3' }, isLearnable: true },
    ],
  });
  const c2 = randomUUID();
  const c3 = randomUUID();
  await db.course.createMany({
    data: [
      { id: c2, languageId: lang2, frameworkId: f.framework, defaultStartLevelId: f.level, names: { vi: 'C2' }, isActive: true },
      { id: c3, languageId: lang3, frameworkId: f.framework, defaultStartLevelId: f.level, names: { vi: 'C3' }, isActive: true },
    ],
  });

  // Create 2 existing ACTIVE contexts for learner directly
  await db.learningContext.createMany({
    data: [
      { id: randomUUID(), learnerId: learner, languageId: lang2, courseId: c2, status: 'ACTIVE', workingLevelId: f.level, selectedStartLevelId: f.level, startSource: 'DEFAULT' },
      { id: randomUUID(), learnerId: learner, languageId: lang3, courseId: c3, status: 'ACTIVE', workingLevelId: f.level, selectedStartLevelId: f.level, startSource: 'DEFAULT' },
    ],
  });

  // Attempt to create context 3 (for f.lang) -> should fail with CONTEXT_CAPACITY_EXCEEDED
  await assert.rejects(
    async () => {
      await completeOnboarding(learner, {
        contextId: randomUUID(),
        languageId: f.lang,
        entryChoice: { startSource: 'DEFAULT' },
        expectedCourseId: f.course,
        expectedStartLevelId: f.level,
      }, db);
    },
    { status: 409, code: 'CONTEXT_CAPACITY_EXCEEDED' }
  );
});

test('Real PostgreSQL: GET plan returns READY, plan summary, and dynamic nextLesson', async () => {
  const learner = await createFreshLearner(db);
  const contextId = randomUUID();
  const completeRes = await completeOnboarding(learner, {
    contextId,
    languageId: f.lang,
    purpose: 'TRAVEL',
    dailyGoalMinutes: 10,
    entryChoice: { startSource: 'DEFAULT' },
    expectedCourseId: f.course,
    expectedStartLevelId: f.level,
  }, db);

  // Read plan via getContextPlan
  const planData = await getContextPlan(contextId, learner, db);
  assert.equal(planData.status, 'READY');
  assert.equal(planData.plan?.id, completeRes.plan.id);
  assert.equal(planData.plan?.dailyGoalMinutes, 10);
  assert.equal(planData.nextLesson?.id, f.lesson);

  // Pause context -> status becomes PAUSED and nextLesson becomes null
  await db.learningContext.update({
    where: { id: contextId },
    data: { status: 'PAUSED' },
  });

  const pausedData = await getContextPlan(contextId, learner, db);
  assert.equal(pausedData.status, 'PAUSED');
  assert.equal(pausedData.plan?.id, completeRes.plan.id);
  assert.equal(pausedData.nextLesson, null);
});

test('Real PostgreSQL: Existing context update plan with CAS and multiple REPLACED rows', async () => {
  const learner = await createFreshLearner(db);
  const contextId = randomUUID();
  const initRes = await completeOnboarding(learner, {
    contextId,
    languageId: f.lang,
    purpose: 'TRAVEL',
    dailyGoalMinutes: 10,
    entryChoice: { startSource: 'DEFAULT' },
    expectedCourseId: f.course,
    expectedStartLevelId: f.level,
  }, db);

  const initRowVersion = initRes.context.rowVersion;

  // Stale rowVersion fails CAS with 409 STALE_OPERATION
  await assert.rejects(
    async () => {
      await updateContextPlan(contextId, learner, {
        operationId: randomUUID(),
        expectedRowVersion: '999',
        dailyGoalMinutes: 20,
      }, db);
    },
    { status: 409, code: 'STALE_OPERATION' }
  );

  // Update 1: change goal from 10 to 20
  const op1 = randomUUID();
  const updateRes1 = await updateContextPlan(contextId, learner, {
    operationId: op1,
    expectedRowVersion: initRowVersion,
    dailyGoalMinutes: 20,
    purpose: 'WORK',
  }, db);

  assert.equal(updateRes1.plan.id, op1);
  assert.equal(updateRes1.plan.dailyGoalMinutes, 20);
  assert.equal(updateRes1.rowVersion, '2');

  // Verify DB: 1 ACTIVE plan and 1 REPLACED plan
  const plansAfter1 = await db.learningPlan.findMany({
    where: { contextId },
    orderBy: { createdAt: 'asc' },
  });
  assert.equal(plansAfter1.length, 2);
  assert.equal(plansAfter1[0].id, initRes.plan.id);
  assert.equal(plansAfter1[0].status, 'REPLACED');
  assert.ok(plansAfter1[0].replacedAt);
  assert.equal(plansAfter1[1].id, op1);
  assert.equal(plansAfter1[1].status, 'ACTIVE');

  // Idempotent retry of op1 returns active plan without duplicate
  const retryOp1 = await updateContextPlan(contextId, learner, {
    operationId: op1,
    expectedRowVersion: initRowVersion,
    dailyGoalMinutes: 20,
    purpose: 'WORK',
  }, db);
  assert.equal(retryOp1.plan.id, op1);
  const totalAfterRetry = await db.learningPlan.count({ where: { contextId } });
  assert.equal(totalAfterRetry, 2);

  // Update 2: change goal from 20 to 5
  const op2 = randomUUID();
  const updateRes2 = await updateContextPlan(contextId, learner, {
    operationId: op2,
    expectedRowVersion: '2',
    dailyGoalMinutes: 5,
    purpose: 'SCHOOL',
  }, db);

  assert.equal(updateRes2.plan.id, op2);
  assert.equal(updateRes2.plan.dailyGoalMinutes, 5);
  assert.equal(updateRes2.rowVersion, '3');

  // Verify DB: exactly 1 ACTIVE plan and 2 REPLACED plans!
  const allPlans = await db.learningPlan.findMany({
    where: { contextId },
    orderBy: { createdAt: 'asc' },
  });
  assert.equal(allPlans.length, 3);
  const activeCount = allPlans.filter((p) => p.status === 'ACTIVE').length;
  const replacedCount = allPlans.filter((p) => p.status === 'REPLACED').length;
  assert.equal(activeCount, 1);
  assert.equal(replacedCount, 2);

  // Verify context invariants are preserved
  const updatedContext = await db.learningContext.findUnique({
    where: { id: contextId },
  });
  assert.equal(updatedContext.workingLevelId, f.level);
  assert.equal(updatedContext.selectedStartLevelId, f.level);
  assert.equal(updatedContext.startSource, 'DEFAULT');
  assert.equal(updatedContext.purpose, 'SCHOOL');
  assert.equal(updatedContext.studyPreferences?.dailyGoalMinutes, 5);
});

test('Real PostgreSQL: Partial unique index prevents multiple simultaneous ACTIVE plans for same context', async () => {
  const learner = await createFreshLearner(db);
  const contextId = randomUUID();
  await completeOnboarding(learner, {
    contextId,
    languageId: f.lang,
    entryChoice: { startSource: 'DEFAULT' },
    expectedCourseId: f.course,
    expectedStartLevelId: f.level,
  }, db);

  // Raw SQL attempt to insert a second ACTIVE plan for the same context
  await assert.rejects(
    async () => {
      await db.$executeRaw`
        INSERT INTO app.learning_plans (id, context_id, course_id, start_level_id, source, daily_goal_minutes, status, recommendation_snapshot)
        VALUES (gen_random_uuid(), ${contextId}::uuid, ${f.course}::uuid, ${f.level}::uuid, 'DEFAULT', 10, 'ACTIVE', '{}'::jsonb)
      `;
    },
    (err) => {
      // Must violate partial unique index learning_plans_active_context_unique (PostgreSQL 23505)
      return err.message.includes('23505') || err.message.includes('learning_plans_active_context_unique') || err.message.includes('unique constraint');
    }
  );
});

test('Real PostgreSQL R1: SELF_REPORT valid writes provenance { levelId } and 1 ACTIVE plan', async () => {
  const learner = await createFreshLearner(db);
  const contextId = randomUUID();

  const res = await completeOnboarding(learner, {
    contextId,
    languageId: f.lang,
    purpose: 'WORK',
    dailyGoalMinutes: 20,
    interests: ['BUSINESS'],
    entryChoice: {
      startSource: 'SELF_REPORT',
      courseId: f.course,
      levelId: f.level,
    },
    expectedCourseId: f.course,
    expectedStartLevelId: f.level,
  }, db);

  assert.equal(res.context.id, contextId);
  assert.equal(res.context.status, 'ACTIVE');
  assert.equal(res.plan.source, 'SELF_REPORT');
  assert.equal(res.plan.startLevel.id, f.level);

  // Directly verify PostgreSQL row and constraint compliance
  const row = await db.learningContext.findUnique({
    where: { id: contextId },
  });
  assert.ok(row);
  assert.equal(row.startSource, 'SELF_REPORT');
  assert.equal(row.selectedStartLevelId, f.level);
  assert.equal(row.workingLevelId, f.level);
  assert.equal(row.startResultId, null);
  assert.deepEqual(row.selfReport, { levelId: f.level });
});

test('Real PostgreSQL R1: SELF_REPORT with invalid framework fails 400 LEVEL_INVALID and writes 0 rows', async () => {
  const learner = await createFreshLearner(db);
  const contextId = randomUUID();

  // Create alien framework and level
  const alienFw = randomUUID();
  const alienLvl = randomUUID();
  await db.framework.create({
    data: {
      id: alienFw,
      code: 'ALIEN',
      version: '1',
      names: { vi: 'Khung khác', en: 'Alien FW' },
    },
  });
  await db.level.create({
    data: {
      id: alienLvl,
      frameworkId: alienFw,
      code: 'X1',
      label: { vi: 'Level Alien', en: 'Alien Level' },
      position: 1,
    },
  });

  await assert.rejects(
    async () => {
      await completeOnboarding(learner, {
        contextId,
        languageId: f.lang,
        entryChoice: {
          startSource: 'SELF_REPORT',
          courseId: f.course,
          levelId: alienLvl,
        },
        expectedCourseId: f.course,
        expectedStartLevelId: alienLvl,
      }, db);
    },
    { status: 400, code: 'LEVEL_INVALID' }
  );

  const contextCount = await db.learningContext.count({ where: { id: contextId } });
  const planCount = await db.learningPlan.count({ where: { contextId } });
  assert.equal(contextCount, 0);
  assert.equal(planCount, 0);
});

test('Real PostgreSQL R1: SELF_REPORT on level without published lessons fails 409 RECOMMENDATION_CHANGED and writes 0 rows', async () => {
  const learner = await createFreshLearner(db);
  const contextId = randomUUID();

  // Create Level B1 in framework without any lessons/units in course
  const emptyLevel = randomUUID();
  await db.level.create({
    data: {
      id: emptyLevel,
      frameworkId: f.framework,
      code: 'B1',
      label: { vi: 'B1 Trung cấp', en: 'Intermediate' },
      position: 99,
    },
  });

  await assert.rejects(
    async () => {
      await completeOnboarding(learner, {
        contextId,
        languageId: f.lang,
        entryChoice: {
          startSource: 'SELF_REPORT',
          courseId: f.course,
          levelId: emptyLevel,
        },
        expectedCourseId: f.course,
        expectedStartLevelId: emptyLevel,
      }, db);
    },
    { status: 409, code: 'RECOMMENDATION_CHANGED' }
  );

  const contextCount = await db.learningContext.count({ where: { id: contextId } });
  const planCount = await db.learningPlan.count({ where: { contextId } });
  assert.equal(contextCount, 0);
  assert.equal(planCount, 0);
});

test('Real PostgreSQL R3: Preferences patch retains unmentioned fields and preserves onboardingCompletedAt', async () => {
  const learner = await createFreshLearner(db);
  const contextId = randomUUID();

  // 1. Initial complete with TRAVEL and ['TRAVEL', 'FOOD']
  const initRes = await completeOnboarding(learner, {
    contextId,
    languageId: f.lang,
    purpose: 'TRAVEL',
    dailyGoalMinutes: 10,
    interests: ['TRAVEL', 'FOOD'],
    entryChoice: { startSource: 'DEFAULT' },
    expectedCourseId: f.course,
    expectedStartLevelId: f.level,
  }, db);

  const initialContext = await db.learningContext.findUniqueOrThrow({ where: { id: contextId } });
  const initialCompletedAt = initialContext.studyPreferences.onboardingCompletedAt;
  assert.ok(initialCompletedAt);

  // 2. Patch ONLY dailyGoalMinutes to 20 (omitting purpose and interests)
  const op1 = randomUUID();
  const res1 = await updateContextPlan(contextId, learner, {
    operationId: op1,
    expectedRowVersion: '1',
    dailyGoalMinutes: 20,
  }, db);

  assert.equal(res1.plan.dailyGoalMinutes, 20);

  const contextAfter1 = await db.learningContext.findUniqueOrThrow({ where: { id: contextId } });
  // Verify TRAVEL and FOOD are preserved!
  assert.equal(contextAfter1.purpose, 'TRAVEL');
  assert.deepEqual(contextAfter1.studyPreferences.interests, ['TRAVEL', 'FOOD']);
  assert.equal(contextAfter1.studyPreferences.dailyGoalMinutes, 20);
  assert.equal(contextAfter1.studyPreferences.onboardingCompletedAt, initialCompletedAt);

  // 3. Explicitly clear purpose by passing purpose: null
  const op2 = randomUUID();
  const res2 = await updateContextPlan(contextId, learner, {
    operationId: op2,
    expectedRowVersion: '2',
    purpose: null,
  }, db);

  const contextAfter2 = await db.learningContext.findUniqueOrThrow({ where: { id: contextId } });
  assert.equal(contextAfter2.purpose, null);
  assert.deepEqual(contextAfter2.studyPreferences.interests, ['TRAVEL', 'FOOD']);

  // 4. Explicitly clear interests by passing interests: []
  const op3 = randomUUID();
  const res3 = await updateContextPlan(contextId, learner, {
    operationId: op3,
    expectedRowVersion: '3',
    interests: [],
  }, db);

  const contextAfter3 = await db.learningContext.findUniqueOrThrow({ where: { id: contextId } });
  assert.equal(contextAfter3.purpose, null);
  assert.deepEqual(contextAfter3.studyPreferences.interests, []);
});

test('Real PostgreSQL R3: No-op update returns active plan, records receipt, and does not bump rowVersion', async () => {
  const learner = await createFreshLearner(db);
  const contextId = randomUUID();

  await completeOnboarding(learner, {
    contextId,
    languageId: f.lang,
    purpose: 'WORK',
    dailyGoalMinutes: 15,
    interests: ['BUSINESS'],
    entryChoice: { startSource: 'DEFAULT' },
    expectedCourseId: f.course,
    expectedStartLevelId: f.level,
  }, db);

  // Send update with same values
  const opNoOp = randomUUID();
  const resNoOp = await updateContextPlan(contextId, learner, {
    operationId: opNoOp,
    expectedRowVersion: '1',
    dailyGoalMinutes: 15,
    purpose: 'WORK',
    interests: ['BUSINESS'],
  }, db);

  assert.equal(resNoOp.rowVersion, '1'); // Unchanged!
  const planCount = await db.learningPlan.count({ where: { contextId } });
  assert.equal(planCount, 1); // No new plan created!

  // Replay of the no-op operationId succeeds
  const replayNoOp = await updateContextPlan(contextId, learner, {
    operationId: opNoOp,
    expectedRowVersion: '1',
    dailyGoalMinutes: 15,
    purpose: 'WORK',
    interests: ['BUSINESS'],
  }, db);
  assert.equal(replayNoOp.plan.id, resNoOp.plan.id);
});

test('Real PostgreSQL R3: Update replay with conflicting payload fails 409 OPERATION_CONFLICT', async () => {
  const learner = await createFreshLearner(db);
  const contextId = randomUUID();

  await completeOnboarding(learner, {
    contextId,
    languageId: f.lang,
    dailyGoalMinutes: 10,
    entryChoice: { startSource: 'DEFAULT' },
    expectedCourseId: f.course,
    expectedStartLevelId: f.level,
  }, db);

  const opId = randomUUID();
  await updateContextPlan(contextId, learner, {
    operationId: opId,
    expectedRowVersion: '1',
    dailyGoalMinutes: 20,
  }, db);

  // Re-use same opId with conflicting dailyGoalMinutes: 15
  await assert.rejects(
    async () => {
      await updateContextPlan(contextId, learner, {
        operationId: opId,
        expectedRowVersion: '1',
        dailyGoalMinutes: 15,
      }, db);
    },
    { status: 409, code: 'OPERATION_CONFLICT' }
  );
});

test('Real PostgreSQL R3: Complete replay after plan is replaced fails 409 CONTEXT_PLAN_REPLACED', async () => {
  const learner = await createFreshLearner(db);
  const contextId = randomUUID();

  const payload = {
    contextId,
    languageId: f.lang,
    purpose: 'TRAVEL',
    dailyGoalMinutes: 10,
    entryChoice: { startSource: 'DEFAULT' },
    expectedCourseId: f.course,
    expectedStartLevelId: f.level,
  };

  const completeRes = await completeOnboarding(learner, payload, db);

  // Now replace the plan via an update
  await updateContextPlan(contextId, learner, {
    operationId: randomUUID(),
    expectedRowVersion: '1',
    dailyGoalMinutes: 20,
  }, db);

  // Now complete replay with the original contextId must fail because original plan is no longer ACTIVE!
  await assert.rejects(
    async () => {
      await completeOnboarding(learner, payload, db);
    },
    { status: 409, code: 'CONTEXT_PLAN_REPLACED' }
  );
});

test('Real PostgreSQL R2: Disabled account fails under lock with 403 ACCOUNT_INACTIVE', async () => {
  const learner = await createFreshLearner(db);
  const contextId = randomUUID();

  await db.account.update({
    where: { id: learner },
    data: { status: 'DISABLED' },
  });

  await assert.rejects(
    async () => {
      await completeOnboarding(learner, {
        contextId,
        languageId: f.lang,
        entryChoice: { startSource: 'DEFAULT' },
        expectedCourseId: f.course,
        expectedStartLevelId: f.level,
      }, db);
    },
    { status: 403, code: 'ACCOUNT_INACTIVE' }
  );
});

test('Real PostgreSQL R2: Withdrawing all lessons makes GET plan return CURRICULUM_UNAVAILABLE', async () => {
  const learner = await createFreshLearner(db);
  const contextId = randomUUID();

  await completeOnboarding(learner, {
    contextId,
    languageId: f.lang,
    entryChoice: { startSource: 'DEFAULT' },
    expectedCourseId: f.course,
    expectedStartLevelId: f.level,
  }, db);

  // Withdraw all lessons in the course
  await db.lesson.updateMany({
    where: { unit: { courseId: f.course } },
    data: { availability: 'WITHDRAWN' },
  });

  const planRes = await getContextPlan(contextId, learner, db);
  assert.equal(planRes.status, 'CURRICULUM_UNAVAILABLE');
  assert.equal(planRes.nextLesson, null);
  assert.ok(planRes.plan);
});


test('Existing learner can create and replace a plan while keeping completed practice and SRS', async () => {
  const attemptId = randomUUID();
  await startPracticeAttempt(f.ctxA, f.lesson, { attemptId, expectedPublishedRevisionId: f.revision }, f.learnerA);
  await submitPracticeResponse(f.ctxA, f.lesson, attemptId, {
    lessonExerciseId: f.exerciseId, operationKey: randomUUID(), input: { optionId: 'opt-1' },
  }, f.learnerA);
  await finalizePracticeAttempt(f.ctxA, f.lesson, attemptId, { operationKey: randomUUID() }, f.learnerA);
  const learningRows = () => Promise.all([
    db.lessonCompletion.findMany({ where: { contextId: f.ctxA } }),
    db.lessonAttempt.findMany({ where: { contextId: f.ctxA } }),
    db.srsCard.findMany({ where: { learnerId: f.learnerA } }),
  ]);
  const before = await learningRows();
  assert.ok(before.every(rows => rows.length > 0));
  assert.equal((await getContextPlan(f.ctxA, f.learnerA, db)).status, 'NO_PLAN');
  const context = await db.learningContext.findUniqueOrThrow({ where: { id: f.ctxA } });
  const first = await updateContextPlan(f.ctxA, f.learnerA, {
    operationId: randomUUID(), expectedRowVersion: String(context.rowVersion), purpose: 'TRAVEL',
  }, db);
  const results = await Promise.allSettled([15, 20].map(dailyGoalMinutes =>
    updateContextPlan(f.ctxA, f.learnerA, {
      operationId: randomUUID(), expectedRowVersion: first.rowVersion, dailyGoalMinutes,
    }, db)
  ));
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.find(result => result.status === 'rejected').reason.code, 'STALE_OPERATION');
  assert.deepEqual(await learningRows(), before);
  const updated = await db.learningContext.findUniqueOrThrow({ where: { id: f.ctxA } });
  assert.equal(updated.workingLevelId, context.workingLevelId);
  assert.equal(updated.selectedStartLevelId, context.selectedStartLevelId);
  assert.equal(updated.purpose, 'TRAVEL');
  assert.ok(updated.studyPreferences.onboardingCompletedAt);
  assert.equal(await db.learningPlan.count({ where: { contextId: f.ctxA, status: 'ACTIVE' } }), 1);
});

test('Complete holds its selected Lesson lock through commit', async () => {
  const learner = await createFreshLearner(db);
  const writing = deferred();
  const release = deferred();
  const contextId = randomUUID();
  const instrumented = {
    $transaction: (fn, options) => db.$transaction(tx => fn(new Proxy(tx, {
      get(target, key) {
        if (key === 'learningContext') {
          return new Proxy(target.learningContext, {
            get(model, method) {
              if (method !== 'create') return Reflect.get(model, method);
              return async (args) => {
                writing.resolve();
                await release.promise;
                return model.create(args);
              };
            },
          });
        }
        return Reflect.get(target, key);
      },
    })), options),
  };
  const completing = completeOnboarding(learner, {
    contextId, languageId: f.lang, entryChoice: { startSource: 'DEFAULT' },
    expectedCourseId: f.course, expectedStartLevelId: f.level,
  }, instrumented);
  try {
    await bounded(writing.promise, 'complete holds locks before insert');
    await assert.rejects(db.$transaction(async tx => {
      await tx.$executeRaw`SET LOCAL lock_timeout = '250ms'`;
      await tx.$executeRaw`UPDATE app.lessons SET availability = 'PLANNED' WHERE id = ${f.lesson}::uuid`;
    }), error => error.meta?.code === '55P03');
  } finally {
    release.resolve();
    await completing;
  }
  assert.equal(await db.learningPlan.count({ where: { contextId } }), 1);
});

test('Complete rejects a preview after the course loses its published lessons', async () => {
  const learner = await createFreshLearner(db);
  const contextId = randomUUID();
  await db.lesson.updateMany({
    where: { unit: { courseId: f.course } }, data: { availability: 'WITHDRAWN' },
  });
  await assert.rejects(completeOnboarding(learner, {
    contextId, languageId: f.lang, entryChoice: { startSource: 'DEFAULT' },
    expectedCourseId: f.course, expectedStartLevelId: f.level,
  }, db), { code: 'RECOMMENDATION_CHANGED' });
  assert.equal(await db.learningContext.count({ where: { id: contextId } }), 0);
  assert.equal(await db.learningPlan.count({ where: { contextId } }), 0);
});

test('A failed plan insert rolls back both onboarding and plan replacement', async () => {
  const learner = await createFreshLearner(db);
  const contextId = randomUUID();
  const payload = {
    contextId, languageId: f.lang, entryChoice: { startSource: 'DEFAULT' },
    expectedCourseId: f.course, expectedStartLevelId: f.level,
  };
  const faultyDb = {
    $transaction: (fn, options) => db.$transaction(tx => fn(new Proxy(tx, {
      get(target, key) {
        if (key !== 'learningPlan') return Reflect.get(target, key);
        return new Proxy(target.learningPlan, {
          get(model, method) {
            if (method !== 'create') return Reflect.get(model, method);
            return () => { throw new Error('injected plan insert failure'); };
          },
        });
      },
    })), options),
  };

  await assert.rejects(completeOnboarding(learner, payload, faultyDb), /injected plan insert failure/);
  assert.equal(await db.learningContext.count({ where: { id: contextId } }), 0);
  assert.equal(await db.learningPlan.count({ where: { contextId } }), 0);
  assert.equal(await db.commandReceipt.count({ where: { targetId: contextId } }), 0);
  await completeOnboarding(learner, payload, db);
  const beforeContext = await db.learningContext.findUniqueOrThrow({ where: { id: contextId } });
  const beforePlans = await db.learningPlan.findMany({ where: { contextId } });
  const operationId = randomUUID();
  await assert.rejects(updateContextPlan(contextId, learner, {
    operationId, expectedRowVersion: '1', dailyGoalMinutes: 20,
  }, faultyDb), /injected plan insert failure/);
  assert.deepEqual(await db.learningContext.findUniqueOrThrow({ where: { id: contextId } }), beforeContext);
  assert.deepEqual(await db.learningPlan.findMany({ where: { contextId } }), beforePlans);
  assert.equal(await db.commandReceipt.count({ where: { actorId: learner, operationKey: operationId } }), 0);
});

test('Complete waits for a lesson withdrawal already in flight and rechecks the lowest level', async () => {
  const learner = await createFreshLearner(db);
  const writerHeld = deferred();
  const releaseWriter = deferred();
  const selectorStarted = deferred();
  const contextId = randomUUID();
  const writer = db.$transaction(async tx => {
    const [{ pid }] = await tx.$queryRaw`SELECT pg_backend_pid() AS pid`;
    await tx.$executeRaw`UPDATE app.lessons SET availability = 'PLANNED' WHERE id = ${f.lesson}::uuid`;
    writerHeld.resolve(pid);
    await releaseWriter.promise;
  });
  let completeResult;
  try {
    const writerPid = await bounded(writerHeld.promise, 'withdrawal writer holds the lesson');
    const instrumented = {
      $transaction: (fn, options) => db.$transaction(async tx => {
        const [{ pid }] = await tx.$queryRaw`SELECT pg_backend_pid() AS pid`;
        selectorStarted.resolve(pid);
        return fn(tx);
      }, options),
    };
    completeResult = assert.rejects(completeOnboarding(learner, {
      contextId, languageId: f.lang, entryChoice: { startSource: 'DEFAULT' },
      expectedCourseId: f.course, expectedStartLevelId: f.level,
    }, instrumented), { code: 'RECOMMENDATION_CHANGED' });
    const selectorPid = await bounded(selectorStarted.promise, 'complete starts');
    let blocked = false;
    for (let attempt = 0; attempt < 80 && !blocked; attempt++) {
      const [row] = await db.$queryRaw`SELECT ${writerPid}::int = ANY(pg_blocking_pids(${selectorPid}::int)) AS blocked`;
      blocked = row.blocked;
      if (!blocked) await new Promise(resolve => setTimeout(resolve, 25));
    }
    assert.equal(blocked, true, 'complete waits for the writer before validating the level');
  } finally {
    releaseWriter.resolve();
    await writer;
    await completeResult;
  }
  assert.equal(await db.learningContext.count({ where: { id: contextId } }), 0);
  assert.equal(await db.learningPlan.count({ where: { contextId } }), 0);
});
