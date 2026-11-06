import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../../../lingora-admin/generated/product-client/index.js';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import {
  createLearningContext,
  patchLearningContext,
  loadContextOptions,
  startLearningContext,
} from '../../src/server/context/service.ts';
import { mutateLessonConsumption, getLessonReading } from '../../src/server/lessons/service.ts';
import {
  startPracticeAttempt,
  submitPracticeResponse,
  finalizePracticeAttempt,
} from '../../src/server/lessons/practice-service.ts';
import {
  createLesson,
  submitTeacherLesson,
  approveReview,
  publishReview,
} from '../../../lingora-admin/src/server/lessons/index.ts';
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
const other = new PrismaClient({ datasourceUrl: url, log: [] });
const monitor = new PrismaClient({ datasourceUrl: url, log: [] });
let f;

before(async () => {
  await Promise.all([db.$connect(), other.$connect(), monitor.$connect()]);
});

after(async () => {
  setLearnerPrismaForTest(null);
  await Promise.all([db.$disconnect(), other.$disconnect(), monitor.$disconnect()]);
});

beforeEach(async () => {
  f = await createContextConcurrencyFixture(db);
  setLearnerPrismaForTest(db);
});

test('Real PostgreSQL: simultaneous same-language create leaves exactly one row and serializes via actor lock', async () => {
  // Clear ctxA so Learner A has 0 contexts for Language 1
  await db.learningContext.deleteMany({ where: { learnerId: f.learnerA } });

  const id1 = randomUUID();
  const id2 = randomUUID();

  // Two concurrent create requests for Learner A with same language
  const [res1, res2] = await Promise.allSettled([
    createLearningContext(f.learnerA, {
      contextId: id1,
      languageId: f.lang,
      courseId: f.course,
      startSource: 'DEFAULT',
    }, db),
    createLearningContext(f.learnerA, {
      contextId: id2,
      languageId: f.lang,
      courseId: f.course,
      startSource: 'DEFAULT',
    }, other),
  ]);

  const successes = [res1, res2].filter((r) => r.status === 'fulfilled');
  const failures = [res1, res2].filter((r) => r.status === 'rejected');

  assert.equal(successes.length, 1, 'Exactly one create should succeed');
  assert.equal(failures.length, 1, 'Second create must fail with conflict');
  assert.equal(failures[0].reason.status, 409);
  assert.equal(failures[0].reason.code, 'CONTEXT_ALREADY_EXISTS_FOR_LANGUAGE');

  const rows = await db.learningContext.findMany({
    where: { learnerId: f.learnerA, languageId: f.lang },
  });
  assert.equal(rows.length, 1, 'Exactly one row in database');
});

test('Real PostgreSQL: concurrent create with exact same contextId converges on one row', async () => {
  await db.learningContext.deleteMany({ where: { learnerId: f.learnerA } });

  const sharedId = randomUUID();

  const [res1, res2] = await Promise.all([
    createLearningContext(f.learnerA, {
      contextId: sharedId,
      languageId: f.lang,
      courseId: f.course,
      startSource: 'DEFAULT',
    }, db),
    createLearningContext(f.learnerA, {
      contextId: sharedId,
      languageId: f.lang,
      courseId: f.course,
      startSource: 'DEFAULT',
    }, other),
  ]);

  assert.equal(res1.id, sharedId);
  assert.equal(res2.id, sharedId);
  assert.equal(res1.status, 'ACTIVE');
  assert.equal(res2.status, 'ACTIVE');

  const count = await db.learningContext.count({
    where: { learnerId: f.learnerA, languageId: f.lang },
  });
  assert.equal(count, 1);
});

test('Real PostgreSQL: different-language concurrent creates never exceed two ACTIVE capacity', async () => {
  await db.learningContext.deleteMany({ where: { learnerId: f.learnerA } });

  // Create 1st ACTIVE context for Lang 1
  const ctx1Id = randomUUID();
  await createLearningContext(f.learnerA, {
    contextId: ctx1Id,
    languageId: f.lang,
    courseId: f.course,
    startSource: 'DEFAULT',
  }, db);

  // Now concurrently attempt to create context for Lang 2 and context for Lang 3
  const ctx2Id = randomUUID();
  const ctx3Id = randomUUID();

  const [res2, res3] = await Promise.allSettled([
    createLearningContext(f.learnerA, {
      contextId: ctx2Id,
      languageId: f.lang2,
      courseId: f.course2,
      startSource: 'DEFAULT',
    }, db),
    createLearningContext(f.learnerA, {
      contextId: ctx3Id,
      languageId: f.lang3,
      courseId: f.course3,
      startSource: 'DEFAULT',
    }, other),
  ]);

  const successes = [res2, res3].filter((r) => r.status === 'fulfilled');
  const failures = [res2, res3].filter((r) => r.status === 'rejected');

  assert.equal(successes.length, 1, 'Only one should win the second slot');
  assert.equal(failures.length, 1, 'Third active attempt must be rejected');
  assert.equal(failures[0].reason.status, 409);
  assert.equal(failures[0].reason.code, 'CAPACITY_EXCEEDED');

  const activeCount = await db.learningContext.count({
    where: { learnerId: f.learnerA, status: 'ACTIVE' },
  });
  assert.equal(activeCount, 2, 'Never exceed two ACTIVE contexts');
});

test('Real PostgreSQL: replay at capacity returns existing row without 409', async () => {
  await db.learningContext.deleteMany({ where: { learnerId: f.learnerA } });

  const ctx1Id = randomUUID();
  const ctx2Id = randomUUID();

  await createLearningContext(f.learnerA, {
    contextId: ctx1Id,
    languageId: f.lang,
    courseId: f.course,
    startSource: 'DEFAULT',
  }, db);

  await createLearningContext(f.learnerA, {
    contextId: ctx2Id,
    languageId: f.lang2,
    courseId: f.course2,
    startSource: 'DEFAULT',
  }, db);

  // Learner A has 2 ACTIVE contexts (at max capacity)
  assert.equal(await db.learningContext.count({ where: { learnerId: f.learnerA, status: 'ACTIVE' } }), 2);

  // Replay ctx1 creation: must succeed
  const replayRes = await createLearningContext(f.learnerA, {
    contextId: ctx1Id,
    languageId: f.lang,
    courseId: f.course,
    startSource: 'DEFAULT',
  }, db);

  assert.equal(replayRes.id, ctx1Id);
  assert.equal(replayRes.status, 'ACTIVE');
});

test('Real PostgreSQL: duplicate PAUSED create does not implicitly resume or recreate', async () => {
  // Pause f.ctxA
  await patchLearningContext(f.learnerA, f.ctxA, {
    status: 'PAUSED',
    expectedRowVersion: '1',
  }, db);

  const paused = await db.learningContext.findUnique({ where: { id: f.ctxA } });
  assert.equal(paused.status, 'PAUSED');

  // Attempt to create another context for f.lang with a new id
  const newId = randomUUID();
  await assert.rejects(
    createLearningContext(f.learnerA, {
      contextId: newId,
      languageId: f.lang,
      courseId: f.course,
      startSource: 'DEFAULT',
    }, db),
    (err) => err.status === 409 && err.code === 'CONTEXT_ALREADY_EXISTS_FOR_LANGUAGE'
  );

  // f.ctxA remains PAUSED
  const after = await db.learningContext.findUnique({ where: { id: f.ctxA } });
  assert.equal(after.status, 'PAUSED');
  assert.equal(after.rowVersion, 2n);
});

test('Real PostgreSQL: two resume contenders compete for last active slot', async () => {
  await db.learningContext.deleteMany({ where: { learnerId: f.learnerA } });

  const c1 = randomUUID();
  const c2 = randomUUID();
  const c3 = randomUUID();

  // Create 1 ACTIVE (c1) and 2 PAUSED (c2, c3)
  await createLearningContext(f.learnerA, { contextId: c1, languageId: f.lang, courseId: f.course, startSource: 'DEFAULT' }, db);
  await createLearningContext(f.learnerA, { contextId: c2, languageId: f.lang2, courseId: f.course2, startSource: 'DEFAULT' }, db);
  await patchLearningContext(f.learnerA, c2, { status: 'PAUSED', expectedRowVersion: '1' }, db);

  await createLearningContext(f.learnerA, { contextId: c3, languageId: f.lang3, courseId: f.course3, startSource: 'DEFAULT' }, db);
  await patchLearningContext(f.learnerA, c3, { status: 'PAUSED', expectedRowVersion: '1' }, db);

  assert.equal(await db.learningContext.count({ where: { learnerId: f.learnerA, status: 'ACTIVE' } }), 1);

  // Concurrently attempt to resume c2 and c3
  const [res2, res3] = await Promise.allSettled([
    patchLearningContext(f.learnerA, c2, { status: 'ACTIVE', expectedRowVersion: '2' }, db),
    patchLearningContext(f.learnerA, c3, { status: 'ACTIVE', expectedRowVersion: '2' }, other),
  ]);

  const successes = [res2, res3].filter((r) => r.status === 'fulfilled');
  const failures = [res2, res3].filter((r) => r.status === 'rejected');

  assert.equal(successes.length, 1, 'Only one resume succeeds to fill the 2nd slot');
  assert.equal(failures.length, 1, 'Other resume hits capacity limit');
  assert.equal(failures[0].reason.status, 409);
  assert.equal(failures[0].reason.code, 'CAPACITY_EXCEEDED');

  assert.equal(await db.learningContext.count({ where: { learnerId: f.learnerA, status: 'ACTIVE' } }), 2);
});

test('Real PostgreSQL: Pause and Resume update status/rowVersion/updatedAt ONLY', async () => {
  const beforeCtx = await db.learningContext.findUnique({ where: { id: f.ctxA } });

  // Pause
  const pauseRes = await patchLearningContext(f.learnerA, f.ctxA, { status: 'PAUSED', expectedRowVersion: '1' }, db);
  const pausedCtx = await db.learningContext.findUnique({ where: { id: f.ctxA } });

  assert.equal(pausedCtx.status, 'PAUSED');
  assert.equal(pausedCtx.rowVersion, 2n);
  assert.equal(pausedCtx.selectedStartLevelId, beforeCtx.selectedStartLevelId);
  assert.equal(pausedCtx.workingLevelId, beforeCtx.workingLevelId);
  assert.equal(pausedCtx.startSource, beforeCtx.startSource);
  assert.deepEqual(pausedCtx.studyPreferences, beforeCtx.studyPreferences);
  assert.equal(pausedCtx.studyFocus, beforeCtx.studyFocus);

  // Resume
  const resumeRes = await patchLearningContext(f.learnerA, f.ctxA, { status: 'ACTIVE', expectedRowVersion: '2' }, db);
  const resumedCtx = await db.learningContext.findUnique({ where: { id: f.ctxA } });

  assert.equal(resumedCtx.status, 'ACTIVE');
  assert.equal(resumedCtx.rowVersion, 3n);
  assert.equal(resumedCtx.selectedStartLevelId, beforeCtx.selectedStartLevelId);
  assert.equal(resumedCtx.workingLevelId, beforeCtx.workingLevelId);
});

test('Real PostgreSQL: Language invalidation during create fails 409 LANGUAGE_NOT_LEARNABLE', async () => {
  const held = deferred();
  const release = deferred();

  const instrumentedDb = instrument(db, {
    after: async ({ sql }) => {
      if (sql.includes('app.courses') && sql.includes('FOR SHARE')) {
        held.resolve();
        await release.promise;
      }
    },
  });

  const ctxId = randomUUID();
  const createPromise = createLearningContext(f.learnerA, {
    contextId: ctxId,
    languageId: f.lang2,
    courseId: f.course2,
    startSource: 'DEFAULT',
  }, instrumentedDb);

  try {
    await bounded(held.promise, 'course locked before language check');

    // Invalidate language before learner checks language lock
    await other.language.update({
      where: { id: f.lang2 },
      data: { isLearnable: false },
    });
  } finally {
    release.resolve();
  }

  await assert.rejects(
    createPromise,
    (err) => err.status === 409 && err.code === 'LANGUAGE_NOT_LEARNABLE'
  );

  assert.equal(await db.learningContext.count({ where: { id: ctxId } }), 0);

  // Restore language
  await other.language.update({ where: { id: f.lang2 }, data: { isLearnable: true } });
});

test('Real PostgreSQL: Language invalidation during resume fails 403 LANGUAGE_NOT_LEARNABLE', async () => {
  // Pause context f.ctxA
  await patchLearningContext(f.learnerA, f.ctxA, { status: 'PAUSED', expectedRowVersion: '1' }, db);

  // Invalidate language
  await other.language.update({
    where: { id: f.lang },
    data: { isLearnable: false },
  });

  await assert.rejects(
    patchLearningContext(f.learnerA, f.ctxA, { status: 'ACTIVE', expectedRowVersion: '2' }, db),
    (err) => err.status === 403 && err.code === 'LANGUAGE_NOT_LEARNABLE'
  );

  // Context remains PAUSED
  const ctx = await db.learningContext.findUnique({ where: { id: f.ctxA } });
  assert.equal(ctx.status, 'PAUSED');

  // Restore language and resume
  await other.language.update({ where: { id: f.lang }, data: { isLearnable: true } });
  await patchLearningContext(f.learnerA, f.ctxA, { status: 'ACTIVE', expectedRowVersion: '2' }, db);
});

test('Real PostgreSQL: PAUSED denies submitPracticeResponse, finalize and committed replays', async () => {
  // First start an attempt while ACTIVE
  const attemptId = randomUUID();
  await startPracticeAttempt(f.ctxA, f.lesson, { attemptId, expectedPublishedRevisionId: f.revision }, f.learnerA);

  const opKey1 = randomUUID();
  const resp1 = await submitPracticeResponse(f.ctxA, f.lesson, attemptId, {
    lessonExerciseId: f.exerciseId,
    operationKey: opKey1,
    input: { optionId: 'opt-1' },
  }, f.learnerA);
  assert.equal(resp1.response.isCorrect, true);

  // Now PAUSE context
  await patchLearningContext(f.learnerA, f.ctxA, { status: 'PAUSED', expectedRowVersion: '1' }, db);

  // 1. New response rejected
  const opKey2 = randomUUID();
  await assert.rejects(
    submitPracticeResponse(f.ctxA, f.lesson, attemptId, {
      lessonExerciseId: f.exerciseId,
      operationKey: opKey2,
      input: { optionId: 'opt-1' },
    }, f.learnerA),
    (err) => err.status === 403 && (err.error?.code === 'CONTEXT_INACTIVE' || err.code === 'CONTEXT_INACTIVE')
  );

  // 2. Committed response replay ALSO rejected while PAUSED
  await assert.rejects(
    submitPracticeResponse(f.ctxA, f.lesson, attemptId, {
      lessonExerciseId: f.exerciseId,
      operationKey: opKey1,
      input: { optionId: 'opt-1' },
    }, f.learnerA),
    (err) => err.status === 403 && (err.error?.code === 'CONTEXT_INACTIVE' || err.code === 'CONTEXT_INACTIVE')
  );

  // 3. Finalize attempt rejected while PAUSED
  const finalKey = randomUUID();
  await assert.rejects(
    finalizePracticeAttempt(f.ctxA, f.lesson, attemptId, {
      operationKey: finalKey,
    }, f.learnerA),
    (err) => err.status === 403 && (err.error?.code === 'CONTEXT_INACTIVE' || err.code === 'CONTEXT_INACTIVE')
  );

  // Resume context
  await patchLearningContext(f.learnerA, f.ctxA, { status: 'ACTIVE', expectedRowVersion: '2' }, db);

  // Finalize succeeds after resume
  await finalizePracticeAttempt(f.ctxA, f.lesson, attemptId, {
    operationKey: finalKey,
  }, f.learnerA);

  // Pause again
  await patchLearningContext(f.learnerA, f.ctxA, { status: 'PAUSED', expectedRowVersion: '3' }, db);

  // 4. Committed finalize replay ALSO rejected while PAUSED
  await assert.rejects(
    finalizePracticeAttempt(f.ctxA, f.lesson, attemptId, {
      operationKey: finalKey,
    }, f.learnerA),
    (err) => err.status === 403 && (err.error?.code === 'CONTEXT_INACTIVE' || err.code === 'CONTEXT_INACTIVE')
  );
});

test('Real PostgreSQL: Post-write injected failure proves context transaction rollback', async () => {
  const injectedId = randomUUID();

  const failingDb = instrument(db, {
    afterContextCreate: async () => {
      throw new Error('Injected failure after context insert');
    },
  });

  await assert.rejects(
    createLearningContext(f.learnerA, {
      contextId: injectedId,
      languageId: f.lang2,
      courseId: f.course2,
      startSource: 'DEFAULT',
    }, failingDb),
    (err) => err.message === 'Injected failure after context insert'
  );

  // Verify that the whole transaction was rolled back: NO context row exists!
  const row = await db.learningContext.findUnique({
    where: { id: injectedId },
  });
  assert.equal(row, null, 'Transaction must roll back completely on post-write failure');
});

function instrument(targetDb, hooks) {
  return new Proxy(targetDb, {
    get(target, key) {
      if (key !== '$transaction') return Reflect.get(target, key);
      return (fn, options) =>
        target.$transaction(async (tx) => {
          const [{ pid }] = await tx.$queryRaw`SELECT pg_backend_pid() AS pid`;
          await hooks.enter?.(tx, pid);
          const proxy = new Proxy(tx, {
            get(t, k) {
              if (k === '$queryRaw') {
                return async (strings, ...values) => {
                  const q = { sql: strings.join(''), values, tx, pid };
                  await hooks.before?.(q);
                  const result = await t.$queryRaw(strings, ...values);
                  await hooks.after?.({ ...q, result });
                  return result;
                };
              }
              if (k === 'learningContext') {
                const lc = Reflect.get(t, k);
                return new Proxy(lc, {
                  get(lcTarget, lcKey) {
                    if (lcKey === 'create') {
                      return async (...args) => {
                        await hooks.beforeContextCreate?.({ args, tx, pid });
                        const result = await lcTarget.create(...args);
                        await hooks.afterContextCreate?.({ result, tx, pid });
                        return result;
                      };
                    }
                    return Reflect.get(lcTarget, lcKey);
                  },
                });
              }
              return Reflect.get(t, k);
            },
          });
          return fn(proxy);
        }, options);
    },
  });
}

async function waitForBlockingPid(waiterPid, expectedHolderPid, timeoutMs = 6000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const rows = await monitor.$queryRaw`SELECT pg_blocking_pids(${waiterPid}::int) AS pids`;
    const pids = rows[0]?.pids || [];
    if (pids.includes(expectedHolderPid)) {
      return true;
    }
    const activity = await monitor.$queryRaw`SELECT state, xact_start FROM pg_stat_activity WHERE pid = ${waiterPid}::int`;
    assert.ok(
      activity[0]?.state !== 'idle' || activity[0]?.xact_start !== null,
      `Waiter PID ${waiterPid} committed before the required blocker ${expectedHolderPid}`
    );
    await new Promise((r) => setTimeout(r, 25));
  }
  const current = await monitor.$queryRaw`SELECT pg_blocking_pids(${waiterPid}::int) AS pids`;
  throw new Error(`Timed out waiting for waiter PID ${waiterPid} to be blocked by ${expectedHolderPid}. Current blocking pids: ${JSON.stringify(current[0]?.pids || [])}`);
}

async function takeLearnerFullSnapshot(client, learnerId, contextId) {
  const cards = await client.$queryRaw`
    SELECT to_jsonb(c)::text AS row
    FROM app.srs_cards c
    WHERE learner_id = ${learnerId}::uuid
    ORDER BY id ASC
  `;

  const reviewOps = await client.$queryRaw`
    SELECT to_jsonb(r)::text AS row
    FROM app.srs_review_operations r
    WHERE learner_id = ${learnerId}::uuid
    ORDER BY id ASC
  `;

  const consumptions = await client.$queryRaw`
    SELECT to_jsonb(c)::text AS row
    FROM app.lesson_consumptions c
    WHERE context_id = ${contextId}::uuid
    ORDER BY id ASC
  `;

  const attempts = await client.$queryRaw`
    SELECT to_jsonb(a)::text AS row
    FROM app.lesson_attempts a
    WHERE context_id = ${contextId}::uuid
    ORDER BY id ASC
  `;

  const responses = await client.$queryRaw`
    SELECT to_jsonb(r)::text AS row
    FROM app.lesson_responses r
    WHERE attempt_id IN (
      SELECT id FROM app.lesson_attempts WHERE context_id = ${contextId}::uuid
    )
    ORDER BY id ASC
  `;

  const completions = await client.$queryRaw`
    SELECT to_jsonb(c)::text AS row
    FROM app.lesson_completions c
    WHERE context_id = ${contextId}::uuid
    ORDER BY id ASC
  `;

  const receipts = await client.$queryRaw`
    SELECT to_jsonb(r)::text AS row
    FROM app_private.command_receipts r
    WHERE actor_id = ${learnerId}::uuid
    ORDER BY id ASC
  `;

  return {
    cards: cards.map((r) => r.row),
    reviewOps: reviewOps.map((r) => r.row),
    consumptions: consumptions.map((r) => r.row),
    attempts: attempts.map((r) => r.row),
    responses: responses.map((r) => r.row),
    completions: completions.map((r) => r.row),
    receipts: receipts.map((r) => r.row),
  };
}

test('Real PostgreSQL: Level reorder writer held before selector locks; selector waits via pg_blocking_pids and derives fresh position', async () => {
  await db.learningContext.deleteMany({ where: { learnerId: f.learnerA } });

  // Ensure initial positions: level 1 = 1, level 2 = 2
  await db.level.update({ where: { id: f.level }, data: { position: 1 } });
  await db.level.update({ where: { id: f.level2 }, data: { position: 2 } });

  const writerHeld = deferred();
  const releaseWriter = deferred();
  let writerPid;

  const writerPromise = other.$transaction(async (tx) => {
    const [{ pid }] = await tx.$queryRaw`SELECT pg_backend_pid() AS pid`;
    writerPid = pid;
    // Lock Level 1 and move it to position 3
    await tx.$executeRaw`UPDATE app.levels SET position = 3 WHERE id = ${f.level}::uuid`;
    writerHeld.resolve(pid);
    await releaseWriter.promise;
  });

  const selectorPidDeferred = deferred();
  const instrumentedDb = instrument(db, {
    enter: async (tx, pid) => {
      selectorPidDeferred.resolve(pid);
    },
  });

  let createPromise;
  try {
    await bounded(writerHeld.promise, 'writer holds level row lock');
    const ctxId = randomUUID();
    createPromise = createLearningContext(f.learnerA, {
      contextId: ctxId,
      languageId: f.lang,
      courseId: f.course,
      startSource: 'DEFAULT',
    }, instrumentedDb);

    const selectorPid = await bounded(selectorPidDeferred.promise, 'selector entered transaction');
    await waitForBlockingPid(selectorPid, writerPid);
  } finally {
    releaseWriter.resolve();
  }

  await writerPromise;
  const res = await createPromise;
  // Level 1 moved to position 3, so Level 2 (position 2) is the fresh lowest eligible!
  assert.equal(res.selectedStartLevel?.id, f.level2);
  assert.equal(res.workingLevel?.id, f.level2);
  assert.equal(res.startSource, 'DEFAULT');

  // Restore positions
  await db.level.update({ where: { id: f.level }, data: { position: 1 } });
  await db.level.update({ where: { id: f.level2 }, data: { position: 2 } });
});

test('Real PostgreSQL: Learner holds Level shared lock; competing level reorder blocks via pg_blocking_pids until learner commits', async () => {
  await db.learningContext.deleteMany({ where: { learnerId: f.learnerA } });

  const selectorHeld = deferred();
  const releaseSelector = deferred();
  let selectorPid;

  const instrumentedDb = instrument(db, {
    beforeContextCreate: async ({ pid }) => {
      selectorPid = pid;
      selectorHeld.resolve(pid);
      await releaseSelector.promise;
    },
  });

  const ctxId = randomUUID();
  const createPromise = createLearningContext(f.learnerA, {
    contextId: ctxId,
    languageId: f.lang,
    courseId: f.course,
    startSource: 'DEFAULT',
  }, instrumentedDb);

  let writerPromise;
  const releaseWriter = deferred();
  try {
    await bounded(selectorHeld.promise, 'selector holds complete shared lock set');

    const writerPidDeferred = deferred();
    writerPromise = other.$transaction(async (tx) => {
      const [{ pid }] = await tx.$queryRaw`SELECT pg_backend_pid() AS pid`;
      writerPidDeferred.resolve(pid);
      await tx.$executeRaw`UPDATE app.levels SET position = 5 WHERE id = ${f.level}::uuid`;
      await releaseWriter.promise;
    });

    const writerPid = await bounded(writerPidDeferred.promise, 'writer entered');
    await waitForBlockingPid(writerPid, selectorPid);
  } finally {
    releaseSelector.resolve();
    releaseWriter.resolve();
  }

  const res = await createPromise;
  await writerPromise;
  assert.equal(res.selectedStartLevel?.id, f.level, 'Level 1 retained under learner-first lock');

  // Restore position
  await db.level.update({ where: { id: f.level }, data: { position: 1 } });
});

test('Real PostgreSQL: Lesson writer withdraws lowest lesson while selector waits via pg_blocking_pids; fresh selection chooses Level 2', async () => {
  await db.learningContext.deleteMany({ where: { learnerId: f.learnerA } });

  const writerHeld = deferred();
  const releaseWriter = deferred();
  let writerPid;

  const writerPromise = other.$transaction(async (tx) => {
    const [{ pid }] = await tx.$queryRaw`SELECT pg_backend_pid() AS pid`;
    writerPid = pid;
    await tx.$executeRaw`UPDATE app.lessons SET availability = 'PLANNED' WHERE id = ${f.lesson}::uuid`;
    writerHeld.resolve(pid);
    await releaseWriter.promise;
  });

  const selectorPidDeferred = deferred();
  const instrumentedDb = instrument(db, {
    enter: async (tx, pid) => {
      selectorPidDeferred.resolve(pid);
    },
  });

  let createPromise;
  try {
    await bounded(writerHeld.promise, 'writer withdraws lesson');
    const ctxId = randomUUID();
    createPromise = createLearningContext(f.learnerA, {
      contextId: ctxId,
      languageId: f.lang,
      courseId: f.course,
      startSource: 'DEFAULT',
    }, instrumentedDb);

    const selectorPid = await bounded(selectorPidDeferred.promise, 'selector entered');
    await waitForBlockingPid(selectorPid, writerPid);
  } finally {
    releaseWriter.resolve();
  }

  await writerPromise;
  const res = await createPromise;
  assert.equal(res.selectedStartLevel?.id, f.level2, 'Level 2 chosen after lower lesson withdrawn');

  // Restore lesson availability
  await db.lesson.update({ where: { id: f.lesson }, data: { availability: 'AVAILABLE' } });
});

test('Real PostgreSQL: Learner holds Lesson shared lock; competing lesson withdrawal blocks via pg_blocking_pids until learner commits', async () => {
  await db.learningContext.deleteMany({ where: { learnerId: f.learnerA } });

  const selectorHeld = deferred();
  const releaseSelector = deferred();
  let selectorPid;

  const instrumentedDb = instrument(db, {
    beforeContextCreate: async ({ pid }) => {
      selectorPid = pid;
      selectorHeld.resolve(pid);
      await releaseSelector.promise;
    },
  });

  const ctxId = randomUUID();
  const createPromise = createLearningContext(f.learnerA, {
    contextId: ctxId,
    languageId: f.lang,
    courseId: f.course,
    startSource: 'DEFAULT',
  }, instrumentedDb);

  let writerPromise;
  const releaseWriter = deferred();
  try {
    await bounded(selectorHeld.promise, 'selector holds shared locks');

    const writerPidDeferred = deferred();
    writerPromise = other.$transaction(async (tx) => {
      const [{ pid }] = await tx.$queryRaw`SELECT pg_backend_pid() AS pid`;
      writerPidDeferred.resolve(pid);
      await tx.$executeRaw`UPDATE app.lessons SET availability = 'PLANNED' WHERE id = ${f.lesson}::uuid`;
      await releaseWriter.promise;
    });

    const writerPid = await bounded(writerPidDeferred.promise, 'writer entered');
    await waitForBlockingPid(writerPid, selectorPid);
  } finally {
    releaseSelector.resolve();
    releaseWriter.resolve();
  }

  const res = await createPromise;
  await writerPromise;
  assert.equal(res.selectedStartLevel?.id, f.level, 'Level 1 retained');
  // Restore
  await db.lesson.update({ where: { id: f.lesson }, data: { availability: 'AVAILABLE' } });
});

test('Real PostgreSQL: Lesson writer withdraws all lessons; create fails 409 COURSE_NO_AVAILABLE_LESSONS without row', async () => {
  await db.learningContext.deleteMany({ where: { learnerId: f.learnerA } });

  await other.lesson.update({ where: { id: f.lesson }, data: { availability: 'PLANNED' } });
  await other.lesson.update({ where: { id: f.lesson2 }, data: { availability: 'PLANNED' } });

  const ctxId = randomUUID();
  await assert.rejects(
    async () => {
      await createLearningContext(f.learnerA, {
        contextId: ctxId,
        languageId: f.lang,
        courseId: f.course,
        startSource: 'DEFAULT',
      }, db);
    },
    (err) => {
      assert.equal(err.status, 409);
      assert.equal(err.code, 'COURSE_NO_AVAILABLE_LESSONS');
      return true;
    }
  );

  const contextCount = await db.learningContext.count({ where: { id: ctxId } });
  assert.equal(contextCount, 0, 'No context row written when no available lessons');

  // Restore
  await other.lesson.update({ where: { id: f.lesson }, data: { availability: 'AVAILABLE' } });
  await other.lesson.update({ where: { id: f.lesson2 }, data: { availability: 'AVAILABLE' } });
});

test('Real PostgreSQL: Initial lower Lesson PLANNED, selector holds after complete set acquisition; competing activation blocks via pg_blocking_pids', async () => {
  await db.learningContext.deleteMany({ where: { learnerId: f.learnerA } });

  // Lower lesson f.lesson is PLANNED
  await db.lesson.update({ where: { id: f.lesson }, data: { availability: 'PLANNED' } });

  const selectorHeld = deferred();
  const releaseSelector = deferred();
  let selectorPid;

  const instrumentedDb = instrument(db, {
    beforeContextCreate: async ({ pid }) => {
      selectorPid = pid;
      selectorHeld.resolve(pid);
      await releaseSelector.promise;
    },
  });

  const ctxId = randomUUID();
  const createPromise = createLearningContext(f.learnerA, {
    contextId: ctxId,
    languageId: f.lang,
    courseId: f.course,
    startSource: 'DEFAULT',
  }, instrumentedDb);

  let writerPromise;
  const releaseWriter = deferred();
  try {
    await bounded(selectorHeld.promise, 'selector locked all existing lessons including PLANNED');

    const writerPidDeferred = deferred();
    writerPromise = other.$transaction(async (tx) => {
      const [{ pid }] = await tx.$queryRaw`SELECT pg_backend_pid() AS pid`;
      writerPidDeferred.resolve(pid);
      // Attempt to activate f.lesson to AVAILABLE while selector is held
      await tx.$executeRaw`UPDATE app.lessons SET availability = 'AVAILABLE' WHERE id = ${f.lesson}::uuid`;
      await releaseWriter.promise;
    });

    const writerPid = await bounded(writerPidDeferred.promise, 'writer entered');
    await waitForBlockingPid(writerPid, selectorPid);
  } finally {
    releaseSelector.resolve();
    releaseWriter.resolve();
  }

  const res = await createPromise;
  await writerPromise;
  // Selector chose Level 2 because f.lesson was PLANNED in the held set; activation could not enter unheld!
  assert.equal(res.selectedStartLevel?.id, f.level2);

  // Restore f.lesson to AVAILABLE
  await db.lesson.update({ where: { id: f.lesson }, data: { availability: 'AVAILABLE' } });
});

test('Real PostgreSQL: Real publishReview waits for selector; subsequent DEFAULT locks the exact replacement revision', async () => {
  await db.learningContext.deleteMany({ where: { learnerId: f.learnerA } });

  // Prepare a second revision for f.lesson, submit and approve it
  const rev3 = randomUUID();
  await db.lessonRevision.create({
    data: {
      id: rev3,
      lessonId: f.lesson,
      revisionNo: 2,
      assignmentId: f.assignment,
      creationAssignmentEpisodeId: f.episode,
      status: 'DRAFT',
      title: { vi: 'Bài 1 Rev 2', en: 'Lesson 1 Rev 2' },
      contentBlocks: [{ type: 'paragraph', text: 'Successor content' }],
      createdBy: f.teacher,
      lastEditedBy: f.teacher,
    },
  });

  const item3 = await db.itemIdentity.create({
    data: { origin: 'PRACTICE', createdBy: f.teacher, exactFingerprint: 'practice-fp-' + randomUUID() },
  });
  const ir3 = await db.itemRevision.create({
    data: {
      itemId: item3.id,
      revisionNo: 1,
      type: 'MCQ',
      promptData: { prompt: 'Question 3', options: [{ id: 'o1', text: 'A' }, { id: 'o2', text: 'B' }] },
      exactFingerprint: item3.exactFingerprint,
      createdBy: f.teacher,
      creationAssignmentEpisodeId: f.episode,
      authoringLessonRevisionId: rev3,
      frozenAt: null,
    },
  });
  await db.itemGradingSecret.create({
    data: { itemRevisionId: ir3.id, gradingData: { correctOptionId: 'o1' } },
  });
  await db.lessonExercise.create({
    data: {
      lessonRevisionId: rev3,
      itemId: item3.id,
      itemRevisionId: ir3.id,
      position: 1,
      isCore: true,
    },
  });
  const lessonRow = await db.lesson.findUnique({ where: { id: f.lesson } });
  const sub = await submitTeacherLesson(f.teacher, f.lesson, {
    revisionId: rev3,
    expectedLessonRowVersion: lessonRow.rowVersion.toString(),
    expectedRevisionRowVersion: '1',
  }, db);
  assert.equal(sub.status, 200);
  const rev3RowBeforeApprove = await db.lessonRevision.findUnique({ where: { id: rev3 } });
  const app = await approveReview(f.admin, sub.data.submissionId, {
    expectedRevisionRowVersion: rev3RowBeforeApprove.rowVersion.toString(),
  }, db);
  assert.equal(app.status, 200);

  // Part A: Learner-first holds Lesson & Revision SHARE, competing publishReview blocks via pg_blocking_pids
  const selectorHeld = deferred();
  const releaseSelector = deferred();
  let selectorPid;
  let firstRevisionIds = [];

  const instrumentedDb = instrument(db, {
    after: async ({ sql, result }) => {
      if (sql.includes('FROM app.lesson_revisions') && sql.includes('FOR SHARE')) {
        firstRevisionIds = result.map((row) => row.id);
      }
    },
    beforeContextCreate: async ({ pid }) => {
      selectorPid = pid;
      selectorHeld.resolve(pid);
      await releaseSelector.promise;
    },
  });

  const ctxId = randomUUID();
  const createPromise = createLearningContext(f.learnerA, {
    contextId: ctxId,
    languageId: f.lang,
    courseId: f.course,
    startSource: 'DEFAULT',
  }, instrumentedDb);

  let publisherPromise;
  try {
    await bounded(selectorHeld.promise, 'selector holds lesson and revision SHARE');

    const publisherPidDeferred = deferred();
    const currentLesson = await db.lesson.findUnique({ where: { id: f.lesson } });
    const approvedRevision = await db.lessonRevision.findUnique({ where: { id: rev3 } });
    publisherPromise = publishReview(f.admin, sub.data.submissionId, {
      expectedRevisionRowVersion: approvedRevision.rowVersion.toString(),
      expectedLessonRowVersion: currentLesson.rowVersion.toString(),
    }, instrument(other, {
      enter: async (_tx, pid) => publisherPidDeferred.resolve(pid),
    }));

    const publisherPid = await bounded(publisherPidDeferred.promise, 'publisher entered');
    await waitForBlockingPid(publisherPid, selectorPid);
  } finally {
    releaseSelector.resolve();
  }

  const res = await createPromise;
  const pub = await publisherPromise;
  assert.equal(res.selectedStartLevel?.id, f.level);
  assert.equal(pub.status, 200);
  assert.ok(firstRevisionIds.includes(f.revision));
  assert.ok(!firstRevisionIds.includes(rev3));
  assert.equal((await db.lesson.findUnique({ where: { id: f.lesson } })).activeRevisionId, rev3);
  assert.equal((await db.lessonRevision.findUnique({ where: { id: f.revision } })).status, 'ARCHIVED');

  // Clear context and verify subsequent create selects Level 1 with fresh rev3
  await db.learningContext.deleteMany({ where: { learnerId: f.learnerA } });
  const ctx2Id = randomUUID();
  let replacementRevisionIds = [];
  const res2 = await createLearningContext(f.learnerA, {
    contextId: ctx2Id,
    languageId: f.lang,
    courseId: f.course,
    startSource: 'DEFAULT',
  }, instrument(db, {
    after: async ({ sql, result }) => {
      if (sql.includes('FROM app.lesson_revisions') && sql.includes('FOR SHARE')) {
        replacementRevisionIds = result.map((row) => row.id);
      }
    },
  }));
  assert.equal(res2.selectedStartLevel?.id, f.level);
  assert.ok(replacementRevisionIds.includes(rev3));
  assert.ok(!replacementRevisionIds.includes(f.revision));
});

test('Real PostgreSQL: Real createLesson waits behind Course SHARE via pg_blocking_pids; reverse order blocks selector on Course SHARE', async () => {
  await db.learningContext.deleteMany({ where: { learnerId: f.learnerA } });

  // Part A: Selector holds Course SHARE; real createLesson on lower Unit blocks on Course FOR NO KEY UPDATE
  const selectorHeld = deferred();
  const releaseSelector = deferred();
  let selectorPid;

  const instrumentedDb = instrument(db, {
    beforeContextCreate: async ({ pid }) => {
      selectorPid = pid;
      selectorHeld.resolve(pid);
      await releaseSelector.promise;
    },
  });

  const ctxId = randomUUID();
  const createPromise = createLearningContext(f.learnerA, {
    contextId: ctxId,
    languageId: f.lang,
    courseId: f.course,
    startSource: 'DEFAULT',
  }, instrumentedDb);

  let adminPromise;
  try {
    await bounded(selectorHeld.promise, 'selector holds the complete selection set before insert');

    const adminPidDeferred = deferred();
    const instrumentedAdminDb = instrument(other, {
      enter: async (tx, pid) => {
        adminPidDeferred.resolve(pid);
      },
    });

    // Real createLesson called on instrumentedAdminDb
    adminPromise = createLesson(
      f.admin,
      f.course,
      f.unit,
      { position: 88, isRequired: true },
      instrumentedAdminDb
    );

    const adminPid = await bounded(adminPidDeferred.promise, 'admin entered createLesson');
    await waitForBlockingPid(adminPid, selectorPid);
  } finally {
    releaseSelector.resolve();
  }

  const res = await createPromise;
  const adminRes = await adminPromise;
  assert.equal(res.status, 'ACTIVE');
  assert.equal(adminRes.status, 201);
  assert.equal(adminRes.data.data.position, 88);

  // Part B: Reverse order: Admin holds real createLesson after parent lock; selector blocks on Course SHARE
  await db.learningContext.deleteMany({ where: { learnerId: f.learnerA } });

  const adminHeld = deferred();
  const releaseAdmin = deferred();
  let adminPidB;

  const instrumentedAdminDbB = instrument(other, {
    enter: async (tx, pid) => {
      adminPidB = pid;
    },
    after: async ({ sql }) => {
      if (sql.includes('FROM app.courses') && sql.includes('FOR NO KEY UPDATE')) {
        adminHeld.resolve(adminPidB);
        await releaseAdmin.promise;
      }
    },
  });

  const adminPromiseB = createLesson(
    f.admin,
    f.course,
    f.unit,
    { position: 99, isRequired: true },
    instrumentedAdminDbB
  );

  let selectorPromiseB;
  let capturedLessonIdsB = [];
  const selectorPidDeferredB = deferred();
  const instrumentedDbB = instrument(db, {
    enter: async (tx, pid) => {
      selectorPidDeferredB.resolve(pid);
    },
    after: async ({ sql, result }) => {
      if (sql.includes('FROM app.lessons') && sql.includes('FOR SHARE OF l')) {
        capturedLessonIdsB = result.map((row) => row.id);
      }
    },
  });

  try {
    await bounded(adminHeld.promise, 'admin holds Course FOR NO KEY UPDATE');
    const ctxIdB = randomUUID();
    selectorPromiseB = createLearningContext(f.learnerA, {
      contextId: ctxIdB,
      languageId: f.lang,
      courseId: f.course,
      startSource: 'DEFAULT',
    }, instrumentedDbB);

    const selectorPidB = await bounded(selectorPidDeferredB.promise, 'selector entered');
    await waitForBlockingPid(selectorPidB, adminPidB);
  } finally {
    releaseAdmin.resolve();
  }

  const adminResB = await adminPromiseB;
  const resB = await selectorPromiseB;
  assert.equal(adminResB.status, 201);
  assert.equal(resB.status, 'ACTIVE');
  assert.ok(capturedLessonIdsB.includes(adminResB.data.data.id), 'Writer-first PLANNED/null-revision child must enter the held set');

  // Clean up created lessons
  await db.lesson.deleteMany({ where: { unitId: f.unit, position: { in: [88, 99] } } });
});

test('Real PostgreSQL: Two distinct learners on same Course reach concurrent held barrier and complete successfully without serialization', async () => {
  // Clear any existing contexts for both learners
  await db.learningContext.deleteMany({ where: { learnerId: { in: [f.learnerA, f.learnerB] } } });

  const learnerAHeld = deferred();
  const releaseLearnerA = deferred();

  const instrumentedDbA = instrument(db, {
    beforeContextCreate: async () => {
      learnerAHeld.resolve();
      await releaseLearnerA.promise;
    },
  });

  const ctxAId = randomUUID();
  const createPromiseA = createLearningContext(f.learnerA, {
    contextId: ctxAId,
    languageId: f.lang,
    courseId: f.course,
    startSource: 'DEFAULT',
  }, instrumentedDbA);

  let resB;
  try {
    await bounded(learnerAHeld.promise, 'Learner A holds all Course/Level/Unit/Lesson/Revision shared locks');

    // Learner B creates context on the EXACT SAME Course concurrently!
    const ctxBId = randomUUID();
    resB = await createLearningContext(f.learnerB, {
      contextId: ctxBId,
      languageId: f.lang,
      courseId: f.course,
      startSource: 'DEFAULT',
    }, other);

    assert.equal(resB.id, ctxBId);
    assert.equal(resB.status, 'ACTIVE');
    assert.equal(resB.course.id, f.course);
  } finally {
    releaseLearnerA.resolve();
  }

  const resA = await createPromiseA;
  assert.equal(resA.id, ctxAId);
  assert.equal(resA.status, 'ACTIVE');
  assert.equal(resA.course.id, f.course);

  // Both distinct contexts exist and are active for the same Course
  const count = await db.learningContext.count({
    where: { courseId: f.course, status: 'ACTIVE' },
  });
  assert.equal(count, 2, 'Both learners active on same course simultaneously');
});

test('Real PostgreSQL: Overlapping Pause vs Learning schedules (Reading start/complete, Practice start/response/finalize) prove true pg_blocking_pids serialization', async () => {
  const learningCases = [
    {
      name: 'Reading start',
      prepare: async () => ({}),
      execute: async () =>
        mutateLessonConsumption(f.ctxA, f.lesson, { action: 'start', expectedPublishedRevisionId: f.revision }, f.learnerA),
      assertCommitted: async () => {
        const row = await db.lessonConsumption.findFirst({ where: { contextId: f.ctxA, lessonId: f.lesson } });
        assert.ok(row, 'Consumption row must exist');
        assert.ok(row.startedAt, 'startedAt must be set');
        assert.equal(row.completedAt, null, 'completedAt must be null for start');
      },
      assertNoWrites: async () => {
        const count = await db.lessonConsumption.count({ where: { contextId: f.ctxA } });
        assert.equal(count, 0, 'No consumption row written');
      },
      cleanup: async () => {
        await db.lessonConsumption.deleteMany({ where: { contextId: f.ctxA } });
      },
    },
    {
      name: 'Reading complete',
      prepare: async () => {
        await mutateLessonConsumption(f.ctxA, f.lesson, { action: 'start', expectedPublishedRevisionId: f.revision }, f.learnerA);
        return {};
      },
      execute: async () =>
        mutateLessonConsumption(f.ctxA, f.lesson, { action: 'complete', expectedPublishedRevisionId: f.revision }, f.learnerA),
      assertCommitted: async () => {
        const row = await db.lessonConsumption.findFirst({ where: { contextId: f.ctxA, lessonId: f.lesson } });
        assert.ok(row, 'Consumption row must exist');
        assert.ok(row.completedAt, 'completedAt must be set for complete');
      },
      assertNoWrites: async () => {
        const row = await db.lessonConsumption.findFirst({ where: { contextId: f.ctxA, lessonId: f.lesson } });
        assert.ok(row, 'Consumption row exists');
        assert.equal(row.completedAt, null, 'completedAt remained null');
      },
      cleanup: async () => {
        await db.lessonConsumption.deleteMany({ where: { contextId: f.ctxA } });
      },
    },
    {
      name: 'Practice start',
      prepare: async () => {
        const attemptId = randomUUID();
        return { attemptId };
      },
      execute: async (bag) =>
        startPracticeAttempt(f.ctxA, f.lesson, { attemptId: bag.attemptId, expectedPublishedRevisionId: f.revision }, f.learnerA),
      assertCommitted: async (bag) => {
        const row = await db.lessonAttempt.findUnique({ where: { id: bag.attemptId } });
        assert.ok(row);
      },
      assertNoWrites: async () => {
        const count = await db.lessonAttempt.count({ where: { contextId: f.ctxA } });
        assert.equal(count, 0, 'No attempt row written');
      },
      cleanup: async () => {
        await db.lessonAttempt.deleteMany({ where: { contextId: f.ctxA } });
      },
    },
    {
      name: 'Practice response',
      prepare: async () => {
        const attemptId = randomUUID();
        await startPracticeAttempt(f.ctxA, f.lesson, { attemptId, expectedPublishedRevisionId: f.revision }, f.learnerA);
        const opKey = randomUUID();
        return { attemptId, opKey };
      },
      execute: async (bag) =>
        submitPracticeResponse(f.ctxA, f.lesson, bag.attemptId, { lessonExerciseId: f.exerciseId, operationKey: bag.opKey, input: { optionId: 'opt-1' } }, f.learnerA),
      assertCommitted: async (bag) => {
        const row = await db.lessonResponse.findFirst({ where: { attemptId: bag.attemptId } });
        assert.ok(row);
        assert.equal(row.isCorrect, true);
      },
      assertNoWrites: async (bag) => {
        const count = await db.lessonResponse.count({ where: { attemptId: bag.attemptId } });
        assert.equal(count, 0, 'No response row written');
      },
      cleanup: async () => {
        // Responses and attempts are append-only under DB-R3; each attempt uses unique UUID
      },
    },
    {
      name: 'Practice finalize',
      prepare: async () => {
        const attemptId = randomUUID();
        await startPracticeAttempt(f.ctxA, f.lesson, { attemptId, expectedPublishedRevisionId: f.revision }, f.learnerA);
        await submitPracticeResponse(f.ctxA, f.lesson, attemptId, { lessonExerciseId: f.exerciseId, operationKey: randomUUID(), input: { optionId: 'opt-1' } }, f.learnerA);
        const finalizeKey = randomUUID();
        return { attemptId, finalizeKey };
      },
      execute: async (bag) =>
        finalizePracticeAttempt(f.ctxA, f.lesson, bag.attemptId, { operationKey: bag.finalizeKey }, f.learnerA),
      assertCommitted: async (bag) => {
        const comp = await db.lessonCompletion.findFirst({ where: { firstAttemptId: bag.attemptId } });
        assert.ok(comp, 'Lesson completion must be recorded for finalized attempt');
      },
      assertNoWrites: async (bag) => {
        const count = await db.lessonCompletion.count({ where: { firstAttemptId: bag.attemptId } });
        assert.equal(count, 0, 'No completion row written for blocked attempt');
      },
      cleanup: async () => {
        // LessonCompletion, responses and review ops are append-only under DB-R3; each attempt uses unique UUID
      },
    },
  ];

  for (const c of learningCases) {
    // -------------------------------------------------------------
    // Schedule 1: Pause-first blocks Learning, monitor proves pg_blocking_pids,
    // Pause commits, learning fails 403 CONTEXT_INACTIVE without writes
    // -------------------------------------------------------------
    await c.cleanup();
    // Ensure f.ctxA is ACTIVE with rowVersion 1
    await db.learningContext.update({
      where: { id: f.ctxA },
      data: { status: 'ACTIVE', rowVersion: 1n },
    });

    const bag1 = await c.prepare();

    const pauseHeld1 = deferred();
    const releasePause1 = deferred();
    let pausePid1;

    const instrumentedPauseDb1 = instrument(other, {
      enter: async (tx, pid) => {
        pausePid1 = pid;
      },
      after: async ({ sql }) => {
        if (sql.includes('FROM app.accounts') && sql.includes('FOR NO KEY UPDATE')) {
          pauseHeld1.resolve(pausePid1);
          await releasePause1.promise;
        }
      },
    });

    const pausePromise1 = patchLearningContext(
      f.learnerA,
      f.ctxA,
      { status: 'PAUSED', expectedRowVersion: '1' },
      instrumentedPauseDb1
    );

    let learningPromise1;
    let learningOutcome1;
    const learningPidDeferred1 = deferred();
    const instrumentedLearningDb1 = instrument(db, {
      enter: async (tx, pid) => {
        learningPidDeferred1.resolve(pid);
      },
    });
    setLearnerPrismaForTest(instrumentedLearningDb1);

    try {
      await bounded(pauseHeld1.promise, `Pause held Account lock for ${c.name}`);
      learningPromise1 = c.execute(bag1);
      learningOutcome1 = Promise.allSettled([learningPromise1]);
      const learningPid1 = await bounded(learningPidDeferred1.promise, `Learning entered transaction for ${c.name}`);
      await waitForBlockingPid(learningPid1, pausePid1);
    } finally {
      releasePause1.resolve();
    }

    const pauseRes1 = await pausePromise1;
    assert.equal(pauseRes1.status, 'PAUSED');

    const [learningResult1] = await learningOutcome1;
    assert.equal(learningResult1.status, 'rejected', `Waiting ${c.name} must be denied after Pause`);
    assert.equal(learningResult1.reason.status, 403);
    assert.equal(learningResult1.reason.error?.code || learningResult1.reason.code, 'CONTEXT_INACTIVE');

    await c.assertNoWrites(bag1);
    await c.cleanup();

    // -------------------------------------------------------------
    // Schedule 2: Learning-first holds Account, competing Pause blocks
    // via pg_blocking_pids, Learning commits, Pause transitions to PAUSED
    // and preserves the completed write exactly.
    // -------------------------------------------------------------
    await db.learningContext.update({
      where: { id: f.ctxA },
      data: { status: 'ACTIVE', rowVersion: 1n },
    });

    const bag2 = await c.prepare();

    const learningHeld2 = deferred();
    const releaseLearning2 = deferred();
    let learningPid2;

    const instrumentedLearningDb2 = instrument(db, {
      enter: async (tx, pid) => {
        learningPid2 = pid;
      },
      after: async ({ sql }) => {
        if (sql.includes('FROM app.accounts') && sql.includes('FOR NO KEY UPDATE')) {
          learningHeld2.resolve(learningPid2);
          await releaseLearning2.promise;
        }
      },
    });
    setLearnerPrismaForTest(instrumentedLearningDb2);

    const learningPromise2 = c.execute(bag2);

    let pausePromise2;
    const pausePidDeferred2 = deferred();
    const instrumentedPauseDb2 = instrument(other, {
      enter: async (tx, pid) => {
        pausePidDeferred2.resolve(pid);
      },
    });

    try {
      await bounded(learningHeld2.promise, `Learning held Account lock for ${c.name}`);
      pausePromise2 = patchLearningContext(
        f.learnerA,
        f.ctxA,
        { status: 'PAUSED', expectedRowVersion: '1' },
        instrumentedPauseDb2
      );
      const pausePid2 = await bounded(pausePidDeferred2.promise, `Pause entered for ${c.name}`);
      await waitForBlockingPid(pausePid2, learningPid2);
    } finally {
      releaseLearning2.resolve();
    }

    await learningPromise2;
    const pauseRes2 = await pausePromise2;
    assert.equal(pauseRes2.status, 'PAUSED');
    assert.equal(pauseRes2.rowVersion, '2');

    // Learning write was preserved
    await c.assertCommitted(bag2);

    // Subsequent write while PAUSED must be denied
    setLearnerPrismaForTest(db);
    await assert.rejects(
      c.execute(bag2),
      (err) => err.status === 403 && (err.error?.code === 'CONTEXT_INACTIVE' || err.code === 'CONTEXT_INACTIVE')
    );

    await c.cleanup();
  }

  // Restore active state
  await db.learningContext.update({
    where: { id: f.ctxA },
    data: { status: 'ACTIVE', rowVersion: 1n },
  });
  setLearnerPrismaForTest(db);
});

test('Real PostgreSQL: Nonempty mature SRS card state and valid review history preserved across Pause and Resume with microsecond snapshot precision', async () => {
  setLearnerPrismaForTest(db);

  // beforeEach supplies a fresh owned learner/context; no immutable history cleanup is needed.
  assert.equal(await db.srsCard.count({ where: { learnerId: f.learnerA } }), 0);

  // 2. Finalize normal real Practice attempt first so at least one CORE_COMPLETION card exists
  const attemptId = randomUUID();
  await startPracticeAttempt(f.ctxA, f.lesson, { attemptId, expectedPublishedRevisionId: f.revision }, f.learnerA);
  await submitPracticeResponse(f.ctxA, f.lesson, attemptId, {
    lessonExerciseId: f.exerciseId,
    operationKey: randomUUID(),
    input: { optionId: 'opt-1' },
  }, f.learnerA);
  await finalizePracticeAttempt(f.ctxA, f.lesson, attemptId, { operationKey: randomUUID() }, f.learnerA);

  const card = await db.srsCard.findFirst({ where: { learnerId: f.learnerA } });
  assert.ok(card, 'SRS card must exist after normal real Practice finalization');

  // 3. Update to mature state (stage 3, fixed nontrivial due_at and last_reviewed_at with microsecond precision, row_version = 3)
  const dueMicro = '2026-11-20T14:30:00.123456Z';
  const revMicro = '2026-11-01T14:30:00.654321Z';
  await db.$executeRaw`
    UPDATE app.srs_cards
    SET stage = 3,
        due_at = ${dueMicro}::timestamptz,
        last_reviewed_at = ${revMicro}::timestamptz,
        row_version = 3
    WHERE id = ${card.id}::uuid
  `;

  // 4. Insert valid nonempty SCHEDULE review operation history row
  const opKey = randomUUID();
  const sessionKey = randomUUID();
  await db.$executeRaw`
    INSERT INTO app.srs_review_operations (
      id,
      card_id,
      learner_id,
      operation_key,
      kind,
      rating,
      session_key,
      prior_stage,
      prior_due_at,
      next_stage,
      next_due_at,
      reviewed_at,
      qualifying_local_date,
      input_hash,
      created_at
    ) VALUES (
      gen_random_uuid(),
      ${card.id}::uuid,
      ${f.learnerA}::uuid,
      ${opKey}::uuid,
      'SCHEDULE',
      'REMEMBERED',
      ${sessionKey}::uuid,
      2,
      ${revMicro}::timestamptz,
      3,
      ${dueMicro}::timestamptz,
      ${revMicro}::timestamptz,
      '2026-11-01'::date,
      'mature-srs-history-hash',
      ${revMicro}::timestamptz
    )
  `;

  // Verify nonempty count and unique learner/vocabulary pairs before comparison
  const cardCount = await db.srsCard.count({ where: { learnerId: f.learnerA } });
  const opCount = await db.srsReviewOperation.count({ where: { learnerId: f.learnerA } });
  assert.equal(cardCount, 1);
  assert.equal(opCount, 1);

  // 5. Snapshot before Pause
  const snapshotBefore = await takeLearnerFullSnapshot(db, f.learnerA, f.ctxA);
  assert.equal(snapshotBefore.cards.length, 1);
  assert.equal(snapshotBefore.reviewOps.length, 1);
  assert.ok(snapshotBefore.cards[0].includes('123456'), 'Microsecond precision in due_at preserved');
  assert.ok(snapshotBefore.cards[0].includes('654321'), 'Microsecond precision in last_reviewed_at preserved');

  // 6. Pause context
  const pausedRes = await patchLearningContext(
    f.learnerA,
    f.ctxA,
    { status: 'PAUSED', expectedRowVersion: '1' },
    db
  );
  assert.equal(pausedRes.status, 'PAUSED');
  assert.equal(pausedRes.rowVersion, '2');

  // 7. Verify in-flight / subsequent learning calls are blocked while PAUSED
  await assert.rejects(
    mutateLessonConsumption(f.ctxA, f.lesson, { action: 'start', expectedPublishedRevisionId: f.revision }, f.learnerA),
    (err) => err.status === 403 && (err.error?.code === 'CONTEXT_INACTIVE' || err.code === 'CONTEXT_INACTIVE')
  );
  await assert.rejects(
    startPracticeAttempt(f.ctxA, f.lesson, { attemptId: randomUUID(), expectedPublishedRevisionId: f.revision }, f.learnerA),
    (err) => err.status === 403 && (err.error?.code === 'CONTEXT_INACTIVE' || err.code === 'CONTEXT_INACTIVE')
  );

  // 8. Snapshot while PAUSED must match snapshotBefore with deep equality!
  const snapshotWhilePaused = await takeLearnerFullSnapshot(db, f.learnerA, f.ctxA);
  assert.deepEqual(snapshotWhilePaused, snapshotBefore, 'All SRS cards and review operations must be 100% identical while paused');

  // 9. Resume context
  const resumedRes = await patchLearningContext(
    f.learnerA,
    f.ctxA,
    { status: 'ACTIVE', expectedRowVersion: '2' },
    db
  );
  assert.equal(resumedRes.status, 'ACTIVE');
  assert.equal(resumedRes.rowVersion, '3');

  // 10. Snapshot after Resume must match snapshotBefore with deep equality!
  const snapshotAfterResume = await takeLearnerFullSnapshot(db, f.learnerA, f.ctxA);
  assert.deepEqual(snapshotAfterResume, snapshotBefore, 'All SRS cards and review operations must be 100% identical after resume');

  // Explicit verification: zero duplicate, zero reschedule, exact stage & due
  const finalCard = await db.srsCard.findUnique({ where: { id: card.id } });
  assert.equal(finalCard.stage, 3);
  assert.equal(finalCard.rowVersion, 3n);
  assert.equal(finalCard.lastReviewedAt?.toISOString(), new Date(revMicro).toISOString());
  assert.equal(finalCard.dueAt.toISOString(), new Date(dueMicro).toISOString());
});

test('Real PostgreSQL R6: simultaneous startLearningContext on unconfigured context converges with one winner and replay', async () => {
  // Clear any existing contexts for Learner A to stay clean
  await db.learningContext.deleteMany({ where: { learnerId: f.learnerA } });

  const ctxRecovId = randomUUID();
  // Create an unconfigured context (working_level_id = null)
  await db.$executeRaw`
    INSERT INTO app.learning_contexts (id, learner_id, language_id, course_id, status, working_level_id, selected_start_level_id, start_source, row_version, created_at, updated_at)
    VALUES (${ctxRecovId}::uuid, ${f.learnerA}::uuid, ${f.lang}::uuid, ${f.course}::uuid, 'ACTIVE', NULL, NULL, NULL, 1, NOW(), NOW())
  `;

  // Two concurrent calls attempting startLearningContext with DEFAULT
  const [res1, res2] = await Promise.all([
    startLearningContext(f.learnerA, ctxRecovId, { startSource: 'DEFAULT', expectedRowVersion: '1' }, db),
    startLearningContext(f.learnerA, ctxRecovId, { startSource: 'DEFAULT', expectedRowVersion: '1' }, other),
  ]);

  // Both should succeed (one performs update, the other converges via BigInt(expVersion) + 1n replay)
  assert.equal(res1.id, ctxRecovId);
  assert.equal(res2.id, ctxRecovId);
  assert.equal(res1.workingLevel?.id, f.level);
  assert.equal(res2.workingLevel?.id, f.level);
  assert.equal(res1.selectedStartLevel?.id, f.level);
  assert.equal(res2.selectedStartLevel?.id, f.level);

  // Check DB state: exactly 1 update occurred, row_version = 2n
  const dbCtx = await db.learningContext.findUnique({ where: { id: ctxRecovId } });
  assert.equal(dbCtx.workingLevelId, f.level);
  assert.equal(dbCtx.selectedStartLevelId, f.level);
  assert.equal(dbCtx.rowVersion, 2n);
});

test('Real PostgreSQL R6: startLearningContext with stale rowVersion or already configured fails 409', async () => {
  await db.learningContext.deleteMany({ where: { learnerId: f.learnerA } });

  const ctxRecovId = randomUUID();
  await db.$executeRaw`
    INSERT INTO app.learning_contexts (id, learner_id, language_id, course_id, status, working_level_id, selected_start_level_id, start_source, row_version, created_at, updated_at)
    VALUES (${ctxRecovId}::uuid, ${f.learnerA}::uuid, ${f.lang}::uuid, ${f.course}::uuid, 'ACTIVE', NULL, NULL, NULL, 1, NOW(), NOW())
  `;

  // 1. Mismatched version on unconfigured context
  await assert.rejects(
    startLearningContext(f.learnerA, ctxRecovId, { startSource: 'DEFAULT', expectedRowVersion: '99' }, db),
    (err) => err.status === 409 && err.code === 'STALE_ROW_VERSION'
  );

  // 2. Configure successfully
  await startLearningContext(f.learnerA, ctxRecovId, { startSource: 'DEFAULT', expectedRowVersion: '1' }, db);

  // 3. Second call with different startSource on already configured context fails
  await assert.rejects(
    startLearningContext(f.learnerA, ctxRecovId, { startSource: 'SELF_REPORT', levelId: f.level2, expectedRowVersion: '1' }, db),
    (err) => err.status === 409
  );
});

test('Real PostgreSQL R6: startLearningContext rejects context with learning history (409 CONTEXT_HAS_HISTORY)', async () => {
  await db.learningContext.deleteMany({ where: { learnerId: f.learnerA } });

  const ctxHistId = randomUUID();
  await db.$executeRaw`
    INSERT INTO app.learning_contexts (id, learner_id, language_id, course_id, status, working_level_id, selected_start_level_id, start_source, row_version, created_at, updated_at)
    VALUES (${ctxHistId}::uuid, ${f.learnerA}::uuid, ${f.lang}::uuid, ${f.course}::uuid, 'ACTIVE', NULL, NULL, NULL, 1, NOW(), NOW())
  `;

  // Insert a consumption row to simulate learning history
  await db.lessonConsumption.create({
    data: {
      id: randomUUID(),
      contextId: ctxHistId,
      lessonId: f.lesson,
      lessonRevisionId: f.revision,
    },
  });

  await assert.rejects(
    startLearningContext(f.learnerA, ctxHistId, { startSource: 'DEFAULT', expectedRowVersion: '1' }, db),
    (err) => err.status === 409 && err.code === 'CONTEXT_HAS_HISTORY'
  );
});
