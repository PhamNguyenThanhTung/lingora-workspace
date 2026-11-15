import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePolicyBSchedule,
  calculatePolicyBReinforcement,
  PolicyBScheduler,
  POLICY_B_INTERVALS,
} from '../../src/server/srs/scheduler.ts';

describe('S5-01: Policy B Scheduler Contract & Fixtures', () => {
  const baseTime = new Date('2026-11-14T12:00:00.000Z');
  const scheduler = new PolicyBScheduler();

  test('Policy B intervals lock [1, 3, 7, 14, 30] days', () => {
    assert.deepEqual(POLICY_B_INTERVALS, [1, 3, 7, 14, 30]);
  });

  test('Stage 1 to 5 progression on REMEMBERED', () => {
    // Stage 1 -> 2 (+3 days)
    const res1 = scheduler.calculateNextSchedule({
      priorStage: 1,
      priorDueAt: baseTime,
      rating: 'REMEMBERED',
      reviewedAt: baseTime,
    });
    assert.equal(res1.kind, 'SCHEDULE');
    assert.equal(res1.nextStage, 2);
    assert.equal(res1.intervalDays, 3);
    assert.equal(res1.nextDueAt.getTime() - baseTime.getTime(), 3 * 24 * 60 * 60 * 1000);

    // Stage 2 -> 3 (+7 days)
    const res2 = scheduler.calculateNextSchedule({
      priorStage: 2,
      priorDueAt: baseTime,
      rating: 'REMEMBERED',
      reviewedAt: baseTime,
    });
    assert.equal(res2.nextStage, 3);
    assert.equal(res2.intervalDays, 7);
    assert.equal(res2.nextDueAt.getTime() - baseTime.getTime(), 7 * 24 * 60 * 60 * 1000);

    // Stage 3 -> 4 (+14 days)
    const res3 = scheduler.calculateNextSchedule({
      priorStage: 3,
      priorDueAt: baseTime,
      rating: 'REMEMBERED',
      reviewedAt: baseTime,
    });
    assert.equal(res3.nextStage, 4);
    assert.equal(res3.intervalDays, 14);
    assert.equal(res3.nextDueAt.getTime() - baseTime.getTime(), 14 * 24 * 60 * 60 * 1000);

    // Stage 4 -> 5 (+30 days)
    const res4 = scheduler.calculateNextSchedule({
      priorStage: 4,
      priorDueAt: baseTime,
      rating: 'REMEMBERED',
      reviewedAt: baseTime,
    });
    assert.equal(res4.nextStage, 5);
    assert.equal(res4.intervalDays, 30);
    assert.equal(res4.nextDueAt.getTime() - baseTime.getTime(), 30 * 24 * 60 * 60 * 1000);

    // Stage 5 -> 5 (capped at 5, +30 days)
    const res5 = scheduler.calculateNextSchedule({
      priorStage: 5,
      priorDueAt: baseTime,
      rating: 'REMEMBERED',
      reviewedAt: baseTime,
    });
    assert.equal(res5.nextStage, 5);
    assert.equal(res5.intervalDays, 30);
    assert.equal(res5.nextDueAt.getTime() - baseTime.getTime(), 30 * 24 * 60 * 60 * 1000);
  });

  test('FORGOTTEN resets all stages (1..5) to stage 1 and +1 day interval', () => {
    for (let stage = 1; stage <= 5; stage++) {
      const res = calculatePolicyBSchedule({
        priorStage: stage,
        priorDueAt: baseTime,
        rating: 'FORGOTTEN',
        reviewedAt: baseTime,
      });
      assert.equal(res.kind, 'SCHEDULE');
      assert.equal(res.nextStage, 1);
      assert.equal(res.intervalDays, 1);
      assert.equal(res.nextDueAt.getTime() - baseTime.getTime(), 1 * 24 * 60 * 60 * 1000);
    }
  });

  test('Reinforcement preserves prior stage and dueAt without advancing schedule', () => {
    const priorDue = new Date(baseTime.getTime() + 100000);
    const reinf = calculatePolicyBReinforcement({
      priorStage: 3,
      priorDueAt: priorDue,
      reviewedAt: baseTime,
    });
    assert.equal(reinf.kind, 'REINFORCEMENT');
    assert.equal(reinf.nextStage, 3);
    assert.equal(reinf.nextDueAt.getTime(), priorDue.getTime());
    assert.equal(reinf.intervalDays, 0);
  });

  test('Strict input validation rejects out-of-range stage and invalid rating/date', () => {
    assert.throws(
      () => scheduler.calculateNextSchedule({ priorStage: 0, priorDueAt: baseTime, rating: 'REMEMBERED', reviewedAt: baseTime }),
      /Invalid priorStage/
    );
    assert.throws(
      () => scheduler.calculateNextSchedule({ priorStage: 6, priorDueAt: baseTime, rating: 'REMEMBERED', reviewedAt: baseTime }),
      /Invalid priorStage/
    );
    assert.throws(
      () => scheduler.calculateNextSchedule({ priorStage: 2, priorDueAt: baseTime, rating: 'INVALID', reviewedAt: baseTime }),
      /Invalid rating/
    );
    assert.throws(
      () => scheduler.calculateNextSchedule({ priorStage: 2, priorDueAt: baseTime, rating: 'REMEMBERED', reviewedAt: new Date(NaN) }),
      /Invalid reviewedAt/
    );
  });
});
