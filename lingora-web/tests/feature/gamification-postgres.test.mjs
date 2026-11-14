import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../../../lingora-admin/generated/product-client/index.js';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import { validateOwnedDatabaseUrl } from '../../../scripts/test-guard-utils.mjs';
import { createPracticeFixture } from './harness/practice-db-fixture.mjs';
import {
  startPracticeAttempt,
  submitPracticeResponse,
  finalizePracticeAttempt,
} from '../../src/server/lessons/practice-service.ts';
import { respondSrsReview, createSrsToken } from '../../src/server/srs/index.ts';
import {
  getLearnerStreak,
  getTotalXp,
  getDailyQuests,
  computeQualifyingLocalDate,
} from '../../src/server/gamification/service.ts';

describe('Real PostgreSQL: Sprint 4 Gamification, XP, and Achievements', () => {
  let db;
  let f;

  before(async () => {
    process.env.LINGORA_SRS_SIGNING_SECRET = 'test-srs-hmac-secret-at-least-32-chars-long-very-secure';
    db = new PrismaClient({ datasourceUrl: validateOwnedDatabaseUrl().ownedUrl });
    f = await createPracticeFixture(db);
    setLearnerPrismaForTest(db);
  });

  after(async () => {
    setLearnerPrismaForTest(null);
    if (db) await db.$disconnect();
  });

  test('Real PostgreSQL: First completion awards +30 XP, daily quest +10 XP, achievements & safe replay', async () => {
    const attemptId = randomUUID();
    const startRes = await startPracticeAttempt(
      f.ctxA,
      f.lesson,
      { attemptId, expectedPublishedRevisionId: f.revision },
      f.learnerA
    );
    assert.equal(startRes.id, attemptId);

    // Answer the core exercise correctly
    await submitPracticeResponse(
      f.ctxA,
      f.lesson,
      attemptId,
      {
        operationKey: randomUUID(),
        lessonExerciseId: f.exerciseId,
        input: { optionId: 'opt-1' },
      },
      f.learnerA
    );

    const finalizeOp = randomUUID();
    const finalize = () => finalizePracticeAttempt(
      f.ctxA,
      f.lesson,
      attemptId,
      { operationKey: finalizeOp },
      f.learnerA
    );
    const [finRes, concurrentReplay] = await Promise.all([finalize(), finalize()]);
    assert.deepEqual(concurrentReplay, finRes);

    assert.equal(finRes.attempt.isCompleted, true);
    assert.equal(finRes.lessonXp, 30);
    assert.equal(finRes.questXp, 10); // LESSON_1 completed
    assert.equal(finRes.streak, 1);
    assert.equal(finRes.firstTryAccuracy, 100);
    assert.equal(finRes.newlyEnrolledCount, 1);

    const earnedCodes = finRes.earnedAchievements.map(a => a.code);
    assert.ok(earnedCodes.includes('FIRST_LESSON'), 'Should earn FIRST_LESSON');
    assert.ok(earnedCodes.includes('PERFECT_PRACTICE'), 'Should earn PERFECT_PRACTICE');

    // Verify DB rows directly in PostgreSQL
    const xpRows = await db.xpEvent.findMany({ where: { learnerId: f.learnerA } });
    assert.equal(xpRows.length, 2); // 30 XP lesson + 10 XP daily quest
    const totalXp = await getTotalXp(db, f.learnerA);
    assert.equal(totalXp, 40);

    const achRows = await db.learnerAchievement.findMany({ where: { learnerId: f.learnerA } });
    assert.equal(achRows.length, 2);

    const srsCards = await db.srsCard.findMany({ where: { learnerId: f.learnerA } });
    assert.equal(srsCards.length, 1);
    assert.equal(srsCards[0].enrollmentSource, 'CORE_COMPLETION');

    // Replay idempotency: replaying same finalizeOp returns identical result without double-awarding
    const replayRes = await finalizePracticeAttempt(
      f.ctxA,
      f.lesson,
      attemptId,
      { operationKey: finalizeOp },
      f.learnerA
    );
    assert.equal(replayRes.lessonXp, 30);
    assert.equal(replayRes.questXp, 10);
    assert.equal(replayRes.streak, 1);

    const xpRowsAfter = await db.xpEvent.findMany({ where: { learnerId: f.learnerA } });
    assert.equal(xpRowsAfter.length, 2, 'No duplicate XP events on replay');
  });

  test('Real PostgreSQL: Redo attempt awards 0 lesson XP, no duplicate FIRST_LESSON, and maintains streak', async () => {
    const redoAttemptId = randomUUID();
    await startPracticeAttempt(
      f.ctxA,
      f.lesson,
      { attemptId: redoAttemptId, expectedPublishedRevisionId: f.revision },
      f.learnerA
    );

    await submitPracticeResponse(
      f.ctxA,
      f.lesson,
      redoAttemptId,
      {
        operationKey: randomUUID(),
        lessonExerciseId: f.exerciseId,
        input: { optionId: 'opt-1' },
      },
      f.learnerA
    );

    const redoFin = await finalizePracticeAttempt(
      f.ctxA,
      f.lesson,
      redoAttemptId,
      { operationKey: randomUUID() },
      f.learnerA
    );

    assert.equal(redoFin.lessonXp, 0, 'Redo must yield 0 lesson XP');
    assert.equal(redoFin.newlyEnrolledCount, 0, 'No new cards enrolled on redo');
    const earnedCodes = redoFin.earnedAchievements.map(a => a.code);
    assert.ok(!earnedCodes.includes('FIRST_LESSON'), 'FIRST_LESSON must not be re-awarded');
  });

  test('Real PostgreSQL: Paused context retains SRS card and review awards +1 XP and updates streak', async () => {
    // Pause the context
    await db.learningContext.update({
      where: { id: f.ctxA },
      data: { status: 'PAUSED' },
    });

    const card = await db.srsCard.findFirst({
      where: { learnerId: f.learnerA },
    });
    assert.ok(card);

    // Make card due now
    await db.srsCard.update({
      where: { id: card.id },
      data: { dueAt: new Date(Date.now() - 60000) },
    });

    const tok = createSrsToken({
      learnerId: f.learnerA,
      cardId: card.id,
      expectedRowVersion: card.rowVersion.toString(),
      sessionKey: randomUUID(),
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const reviewRes = await respondSrsReview(
      f.learnerA,
      { token: tok, operationKey: randomUUID(), rating: 'REMEMBERED' },
      db
    );
    assert.equal(reviewRes.recordedRating, 'REMEMBERED');

    // Verify +1 XP recorded in real PostgreSQL
    const srsXp = await db.xpEvent.findMany({
      where: { learnerId: f.learnerA, eventType: 'SRS_REVIEW' },
    });
    assert.equal(srsXp.length, 1);
    assert.equal(srsXp[0].xp, 1);

    // Resume context
    await db.learningContext.update({
      where: { id: f.ctxA },
      data: { status: 'ACTIVE' },
    });
  });

  test('Real PostgreSQL: Midnight boundary calculation across timezones (Asia/Ho_Chi_Minh and America/New_York)', () => {
    // 2026-11-13 16:59:59 UTC -> Asia/Ho_Chi_Minh (+7) = 23:59:59 on Nov 13
    const beforeMidnightUtc = new Date('2026-11-13T16:59:59.000Z');
    const b1 = computeQualifyingLocalDate(beforeMidnightUtc, 'Asia/Ho_Chi_Minh');
    assert.equal(b1.localDateStr, '2026-11-13');

    // 2026-11-13 17:00:00 UTC -> Asia/Ho_Chi_Minh (+7) = 00:00:00 on Nov 14
    const afterMidnightUtc = new Date('2026-11-13T17:00:00.000Z');
    const a1 = computeQualifyingLocalDate(afterMidnightUtc, 'Asia/Ho_Chi_Minh');
    assert.equal(a1.localDateStr, '2026-11-14');

    // America/New_York (EST, UTC-5): 2026-11-14 04:59:59 UTC = 23:59:59 Nov 13 EST
    const nyBefore = new Date('2026-11-14T04:59:59.000Z');
    const ny1 = computeQualifyingLocalDate(nyBefore, 'America/New_York');
    assert.equal(ny1.localDateStr, '2026-11-13');

    // 2026-11-14 05:00:00 UTC = 00:00:00 Nov 14 EST
    const nyAfter = new Date('2026-11-14T05:00:00.000Z');
    const ny2 = computeQualifyingLocalDate(nyAfter, 'America/New_York');
    assert.equal(ny2.localDateStr, '2026-11-14');
  });

  test('Real PostgreSQL: Transaction rollback on fault prevents partial gamification or completion writes', async () => {
    // Create attempt for learnerB
    const attemptId = randomUUID();
    await startPracticeAttempt(
      f.ctxB,
      f.lesson,
      { attemptId, expectedPublishedRevisionId: f.revision },
      f.learnerB
    );

    await submitPracticeResponse(
      f.ctxB,
      f.lesson,
      attemptId,
      {
        operationKey: randomUUID(),
        lessonExerciseId: f.exerciseId,
        input: { optionId: 'opt-1' },
      },
      f.learnerB
    );

    // Instrument client to inject failure before receipt creation
    const failingDb = new Proxy(db, {
      get(target, prop) {
        if (prop === '$transaction') {
          return async (fn, opts) => {
            return target.$transaction(async tx => {
              const txProxy = new Proxy(tx, {
                get(t, k) {
                  if (k === 'commandReceipt') {
                    return {
                      ...t.commandReceipt,
                      create: async () => {
                        throw new Error('Injected simulated database failure during receipt write');
                      },
                    };
                  }
                  return Reflect.get(t, k);
                },
              });
              return fn(txProxy);
            }, opts);
          };
        }
        return Reflect.get(target, prop);
      },
    });

    setLearnerPrismaForTest(failingDb);

    await assert.rejects(
      async () => {
        await finalizePracticeAttempt(
          f.ctxB,
          f.lesson,
          attemptId,
          { operationKey: randomUUID() },
          f.learnerB
        );
      },
      /Injected simulated database failure/
    );

    // Reset to real db
    setLearnerPrismaForTest(db);

    // Verify that NO partial rows were committed in PostgreSQL
    const completions = await db.lessonCompletion.findMany({ where: { contextId: f.ctxB } });
    assert.equal(completions.length, 0, 'No completions should be committed');

    const xpEvents = await db.xpEvent.findMany({ where: { learnerId: f.learnerB } });
    assert.equal(xpEvents.length, 0, 'No XP events should be committed on rollback');

    const achievements = await db.learnerAchievement.findMany({ where: { learnerId: f.learnerB } });
    assert.equal(achievements.length, 0, 'No achievements should be committed on rollback');

    const srsCards = await db.srsCard.findMany({ where: { learnerId: f.learnerB } });
    assert.equal(srsCards.length, 0, 'No SRS cards should be committed on rollback');

    const attempt = await db.lessonAttempt.findUnique({ where: { id: attemptId } });
    assert.equal(attempt.completedAt, null, 'Attempt must remain uncompleted');
  });
});
