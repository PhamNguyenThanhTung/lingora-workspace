import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../../../lingora-admin/generated/product-client/index.js';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import {
  startSrsReview,
  respondSrsReview,
  createSrsToken,
  SrsServiceError,
} from '../../src/server/srs/index.ts';
import { createPracticeFixture } from './harness/practice-db-fixture.mjs';

const url = process.env.SLICE11_TEST_DATABASE_URL;
assert.ok(url, 'Explicit owned loopback DB required (run via scripts/local-test-db.mjs)');
const parsed = new URL(url);
assert.ok(['postgresql:', 'postgres:'].includes(parsed.protocol));
assert.ok(['127.0.0.1', 'localhost'].includes(parsed.hostname));
assert.equal(parsed.pathname, '/slice11_test');
assert.equal(process.env.SLICE11_TEST_DATABASE_OWNED, '1');

process.env.LINGORA_SRS_SIGNING_SECRET = 'a'.repeat(32);

const db = new PrismaClient({ datasourceUrl: url, log: [] });
const otherDb = new PrismaClient({ datasourceUrl: url, log: [] });

let f;

before(async () => {
  await db.$connect();
  await otherDb.$connect();
});

after(async () => {
  setLearnerPrismaForTest(null);
  await Promise.all([db.$disconnect(), otherDb.$disconnect()]);
});

beforeEach(async () => {
  f = await createPracticeFixture(db);
  setLearnerPrismaForTest(db);
});

test('Real PostgreSQL: SRS earliest due selection, DB clock, and prompt card delivery', async () => {
  const pastDue = new Date(Date.now() - 3600 * 1000);

  const card1 = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: pastDue,
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });

  // Start review
  const startResult = await startSrsReview(f.learnerA, {}, db);
  assert.equal(startResult.done, false);
  assert.ok(startResult.token);
  assert.ok(startResult.card);
  assert.equal(startResult.card.canonicalForm, 'Hello');
  assert.equal(startResult.card.meaningLabels.vi, 'Xin chào');

  // Verify secrecy invariants on returned DTO
  assert.equal(startResult.card.id, undefined);
  assert.equal(startResult.card.stage, undefined);
  assert.equal(startResult.card.dueAt, undefined);
});

test('Real PostgreSQL: Respond rating progresses stage and schedules nextDueAt atomically in DB', async () => {
  const pastDue = new Date(Date.now() - 3600 * 1000);
  const card = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: pastDue,
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });

  const startResult = await startSrsReview(f.learnerA, {}, db);
  assert.equal(startResult.done, false);

  const opKey = randomUUID();
  const respResult = await respondSrsReview(
    f.learnerA,
    {
      token: startResult.token,
      operationKey: opKey,
      rating: 'REMEMBERED',
    },
    db
  );

  assert.equal(respResult.recordedRating, 'REMEMBERED');

  // Check card in database
  const updatedCard = await db.srsCard.findUniqueOrThrow({ where: { id: card.id } });
  assert.equal(updatedCard.stage, 2, 'Stage 1 -> Stage 2 on REMEMBERED');
  assert.equal(updatedCard.rowVersion, 2n);
  assert.ok(updatedCard.lastReviewedAt);
  // Interval for stage 2 is 3 days
  const expectedMinDue = new Date(Date.now() + 2 * 86400 * 1000);
  assert.ok(updatedCard.dueAt > expectedMinDue);

  // Check review operation in database
  const op = await db.srsReviewOperation.findUniqueOrThrow({
    where: {
      learnerId_operationKey: {
        learnerId: f.learnerA,
        operationKey: opKey,
      },
    },
  });
  assert.equal(op.cardId, card.id);
  assert.equal(op.rating, 'REMEMBERED');
  assert.equal(op.kind, 'SCHEDULE');
  assert.equal(op.priorStage, 1);
  assert.equal(op.nextStage, 2);
  assert.ok(op.qualifyingLocalDate instanceof Date);
});

test('Real PostgreSQL: Concurrent submissions on same card yield exactly one success and one STALE_OPERATION (CAS)', async () => {
  const pastDue = new Date(Date.now() - 3600 * 1000);
  const card = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: pastDue,
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });

  // Issue valid token for version 1
  const startResult = await startSrsReview(f.learnerA, {}, db);

  const opKey1 = randomUUID();
  const opKey2 = randomUUID();

  // Execute two concurrent rating requests with the exact same initial token
  const [res1, res2] = await Promise.allSettled([
    respondSrsReview(
      f.learnerA,
      {
        token: startResult.token,
        operationKey: opKey1,
        rating: 'REMEMBERED',
      },
      db
    ),
    respondSrsReview(
      f.learnerA,
      {
        token: startResult.token,
        operationKey: opKey2,
        rating: 'FORGOTTEN',
      },
      otherDb
    ),
  ]);

  // Exactly one must succeed and the other must fail with 409 STALE_OPERATION
  const successes = [res1, res2].filter(r => r.status === 'fulfilled');
  const rejections = [res1, res2].filter(r => r.status === 'rejected');

  assert.equal(successes.length, 1, 'Exactly one concurrent review must succeed');
  assert.equal(rejections.length, 1, 'The competing concurrent review must be rejected');

  const rejectedError = rejections[0].reason;
  assert.ok(rejectedError instanceof SrsServiceError);
  assert.equal(rejectedError.status, 409);
  assert.equal(rejectedError.code, 'STALE_OPERATION');

  // Verify DB state: exactly 1 operation recorded and card rowVersion is 2
  const operations = await db.srsReviewOperation.findMany({ where: { learnerId: f.learnerA } });
  assert.equal(operations.length, 1);

  const finalCard = await db.srsCard.findUniqueOrThrow({ where: { id: card.id } });
  assert.equal(finalCard.rowVersion, 2n);
});

test('Real PostgreSQL: Same-key concurrent requests both succeed with identical recorded outcome and single history row (R3 idempotency)', async () => {
  const pastDue = new Date(Date.now() - 3600 * 1000);
  const card = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: pastDue,
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });

  const startResult = await startSrsReview(f.learnerA, {}, db);
  const sharedOpKey = randomUUID();

  // Execute two concurrent rating requests with the exact same operationKey
  const [res1, res2] = await Promise.allSettled([
    respondSrsReview(
      f.learnerA,
      {
        token: startResult.token,
        operationKey: sharedOpKey,
        rating: 'REMEMBERED',
      },
      db
    ),
    respondSrsReview(
      f.learnerA,
      {
        token: startResult.token,
        operationKey: sharedOpKey,
        rating: 'REMEMBERED',
      },
      otherDb
    ),
  ]);

  // Both must fulfill successfully (one commits, the second idempotently returns the same recorded outcome)
  assert.equal(res1.status, 'fulfilled', 'Request 1 must fulfill');
  assert.equal(res2.status, 'fulfilled', 'Request 2 (concurrent retry) must fulfill with same outcome');
  assert.equal(res1.value.recordedRating, 'REMEMBERED');
  assert.equal(res2.value.recordedRating, 'REMEMBERED');

  // Exactly ONE history record in DB
  const historyCount = await db.srsReviewOperation.count({
    where: { learnerId: f.learnerA, operationKey: sharedOpKey },
  });
  assert.equal(historyCount, 1, 'Exactly one history record must be created');

  // Card updated exactly once (rowVersion is 2)
  const updatedCard = await db.srsCard.findUniqueOrThrow({ where: { id: card.id } });
  assert.equal(updatedCard.rowVersion, 2n, 'Card row version must be incremented exactly once');
  assert.equal(updatedCard.stage, 2);
});

test('Real PostgreSQL: Conflicting payload with same operationKey fails with 409 OPERATION_CONFLICT', async () => {
  const pastDue = new Date(Date.now() - 3600 * 1000);
  await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: pastDue,
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });

  const startResult = await startSrsReview(f.learnerA, {}, db);
  const opKey = randomUUID();

  // First request succeeds
  const res1 = await respondSrsReview(
    f.learnerA,
    { token: startResult.token, operationKey: opKey, rating: 'REMEMBERED' },
    db
  );
  assert.equal(res1.recordedRating, 'REMEMBERED');

  // Second request with conflicting rating fails with 409
  await assert.rejects(
    async () => {
      await respondSrsReview(
        f.learnerA,
        { token: startResult.token, operationKey: opKey, rating: 'FORGOTTEN' },
        otherDb
      );
    },
    (err) => {
      assert.ok(err instanceof SrsServiceError);
      assert.equal(err.status, 409);
      assert.equal(err.code, 'OPERATION_CONFLICT');
      return true;
    }
  );
});

test('Real PostgreSQL: Committed replay for disabled learner is rejected with 403 ACCOUNT_INACTIVE', async () => {
  const pastDue = new Date(Date.now() - 3600 * 1000);
  await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: pastDue,
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });

  const startResult = await startSrsReview(f.learnerA, {}, db);
  const opKey = randomUUID();

  // First request succeeds while active
  const res1 = await respondSrsReview(
    f.learnerA,
    { token: startResult.token, operationKey: opKey, rating: 'REMEMBERED' },
    db
  );
  assert.equal(res1.recordedRating, 'REMEMBERED');

  // Disable account
  await db.account.update({
    where: { id: f.learnerA },
    data: { status: 'DISABLED' },
  });

  // Replay request must be rejected because account is no longer active
  await assert.rejects(
    async () => {
      await respondSrsReview(
        f.learnerA,
        { token: startResult.token, operationKey: opKey, rating: 'REMEMBERED' },
        otherDb
      );
    },
    (err) => {
      assert.ok(err instanceof SrsServiceError);
      assert.equal(err.status, 403);
      assert.equal(err.code, 'ACCOUNT_INACTIVE');
      return true;
    }
  );

  // Restore account status
  await db.account.update({
    where: { id: f.learnerA },
    data: { status: 'ACTIVE' },
  });
});

test('Real PostgreSQL: FORGOTTEN resets stage 5 to stage 1 and schedules +1 day', async () => {
  const pastDue = new Date(Date.now() - 3600 * 1000);
  const card = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 5,
      dueAt: pastDue,
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });

  const startResult = await startSrsReview(f.learnerA, {}, db);
  const res = await respondSrsReview(
    f.learnerA,
    { token: startResult.token, operationKey: randomUUID(), rating: 'FORGOTTEN' },
    db
  );
  assert.equal(res.recordedRating, 'FORGOTTEN');

  const updatedCard = await db.srsCard.findUniqueOrThrow({ where: { id: card.id } });
  assert.equal(updatedCard.stage, 1, 'Stage 5 must reset to stage 1 on FORGOTTEN');
  const minExpectedDue = new Date(Date.now() + 20 * 3600 * 1000); // at least ~20h into future
  assert.ok(updatedCard.dueAt > minExpectedDue);
});

test('Real PostgreSQL: REMEMBERED caps stage 5 at stage 5 and schedules +30 days', async () => {
  const pastDue = new Date(Date.now() - 3600 * 1000);
  const card = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 5,
      dueAt: pastDue,
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });

  const startResult = await startSrsReview(f.learnerA, {}, db);
  const res = await respondSrsReview(
    f.learnerA,
    { token: startResult.token, operationKey: randomUUID(), rating: 'REMEMBERED' },
    db
  );
  assert.equal(res.recordedRating, 'REMEMBERED');

  const updatedCard = await db.srsCard.findUniqueOrThrow({ where: { id: card.id } });
  assert.equal(updatedCard.stage, 5, 'Stage 5 remains capped at stage 5');
  const minExpectedDue = new Date(Date.now() + 28 * 86400 * 1000); // ~28-30 days into future
  assert.ok(updatedCard.dueAt > minExpectedDue);
});

test('Real PostgreSQL: Strict timezone validation (invalid timezone fails 503 SERVICE_UNAVAILABLE)', async () => {
  const pastDue = new Date(Date.now() - 3600 * 1000);
  await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: pastDue,
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });

  // Temporarily set an invalid timezone on the account
  await db.account.update({
    where: { id: f.learnerA },
    data: { timezone: 'Invalid/NonExistent_Zone' },
  });

  const startResult = await startSrsReview(f.learnerA, {}, db);

  await assert.rejects(
    async () => {
      await respondSrsReview(
        f.learnerA,
        { token: startResult.token, operationKey: randomUUID(), rating: 'REMEMBERED' },
        db
      );
    },
    (err) => {
      assert.ok(err instanceof SrsServiceError);
      assert.equal(err.status, 503);
      assert.equal(err.code, 'SERVICE_UNAVAILABLE');
      return true;
    }
  );

  // Restore valid timezone
  await db.account.update({
    where: { id: f.learnerA },
    data: { timezone: 'UTC' },
  });
});

test('Real PostgreSQL: Injected failure after card update rolls back card stage and rowVersion', async () => {
  const pastDue = new Date(Date.now() - 3600 * 1000);
  const card = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: pastDue,
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });

  const startResult = await startSrsReview(f.learnerA, {}, db);
  const opKey = randomUUID();

  // Create an instrumented proxy that proxies $transaction and injects failure on srsReviewOperation.create
  const failingDb = new Proxy(db, {
    get(target, prop) {
      if (prop === '$transaction') {
        return async (fn, options) => {
          return target.$transaction(async (tx) => {
            const txProxy = new Proxy(tx, {
              get(t, k) {
                if (k === 'srsReviewOperation') {
                  return {
                    ...t.srsReviewOperation,
                    create: async () => {
                      throw new Error('INJECTED_SRS_HISTORY_INSERTION_FAILURE');
                    },
                  };
                }
                return Reflect.get(t, k);
              },
            });
            return fn(txProxy);
          }, options);
        };
      }
      return Reflect.get(target, prop);
    },
  });

  await assert.rejects(
    async () => {
      await respondSrsReview(
        f.learnerA,
        { token: startResult.token, operationKey: opKey, rating: 'REMEMBERED' },
        failingDb
      );
    },
    (err) => {
      assert.match(err.message, /INJECTED_SRS_HISTORY_INSERTION_FAILURE/);
      return true;
    }
  );

  // Assert rollback in database: card must STILL be stage 1, rowVersion 1, no history
  const unchangedCard = await db.srsCard.findUniqueOrThrow({ where: { id: card.id } });
  assert.equal(unchangedCard.stage, 1, 'Card stage must be rolled back to 1');
  assert.equal(unchangedCard.rowVersion, 1n, 'Card row version must be rolled back to 1');

  const history = await db.srsReviewOperation.findUnique({
    where: { learnerId_operationKey: { learnerId: f.learnerA, operationKey: opKey } },
  });
  assert.equal(history, null, 'No history record must remain after rollback');
});

// Test-scoped Prisma wrapper intercepting only clock_timestamp() via parameterized Postgres SELECT $1::timestamptz AS ts
// Real row locks (FOR UPDATE), transactions, constraints, and persistence remain fully active.
function createInjectedClockDb(targetDb, fixedIsoTimestamp) {
  function wrapClient(client) {
    return new Proxy(client, {
      get(target, prop, receiver) {
        if (prop === '$queryRaw') {
          return async (strings, ...values) => {
            const sql = typeof strings === 'string' ? strings : strings.join('');
            if (sql.includes('clock_timestamp')) {
              // Parameterized PostgreSQL query returning the injected timestamp as timestamptz Date
              return target.$queryRaw`SELECT ${fixedIsoTimestamp}::timestamptz AS ts`;
            }
            return target.$queryRaw(strings, ...values);
          };
        }
        if (prop === '$transaction') {
          return async (fnOrArray, options) => {
            if (typeof fnOrArray === 'function') {
              return target.$transaction(async (tx) => {
                return fnOrArray(wrapClient(tx));
              }, options);
            }
            return target.$transaction(fnOrArray, options);
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }
  return wrapClient(targetDb);
}

test('Real PostgreSQL Injected-Clock: dueAt boundary (exact clock, 1ms future rejection, overdue acceptance)', async () => {
  const fixedClockIso = '2026-11-06T12:00:00.000Z';
  const clockDb = createInjectedClockDb(db, fixedClockIso);

  // 1. Card 1ms in future relative to clock
  const cardFuture = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: new Date('2026-11-06T12:00:00.001Z'),
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });

  // startSrsReview with clock at 12:00:00.000Z must NOT return card due at 12:00:00.001Z
  const startFuture = await startSrsReview(f.learnerA, {}, clockDb);
  assert.equal(startFuture.done, true);
  assert.equal(startFuture.card, null);

  // Attempting to respond to cardFuture with valid token fails with 409 CARD_NOT_DUE
  const futureToken = createSrsToken({
    learnerId: f.learnerA,
    cardId: cardFuture.id,
    expectedRowVersion: '1',
    sessionKey: randomUUID(),
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  await assert.rejects(
    async () => {
      await respondSrsReview(
        f.learnerA,
        { token: futureToken, operationKey: randomUUID(), rating: 'REMEMBERED' },
        clockDb
      );
    },
    (err) => {
      assert.ok(err instanceof SrsServiceError);
      assert.equal(err.status, 409);
      assert.equal(err.code, 'CARD_NOT_DUE');
      return true;
    }
  );

  // Clean cardFuture
  await db.srsCard.delete({ where: { id: cardFuture.id } });

  // 2. Card exactly equal to clock
  const cardExact = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: new Date('2026-11-06T12:00:00.000Z'),
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });

  // startSrsReview with clock equal to dueAt MUST return the card
  const startExact = await startSrsReview(f.learnerA, {}, clockDb);
  assert.equal(startExact.done, false);
  assert.ok(startExact.card);

  // respondSrsReview must accept card with dueAt == clock
  const respExact = await respondSrsReview(
    f.learnerA,
    { token: startExact.token, operationKey: randomUUID(), rating: 'REMEMBERED' },
    clockDb
  );
  assert.equal(respExact.recordedRating, 'REMEMBERED');

  const updatedExact = await db.srsCard.findUniqueOrThrow({ where: { id: cardExact.id } });
  assert.equal(updatedExact.stage, 2);
});

test('Real PostgreSQL Injected-Clock: qualifyingLocalDate midnight boundaries and negative-offset timezone', async () => {
  // Ensure learner timezone is Asia/Ho_Chi_Minh (UTC+7)
  await db.account.update({
    where: { id: f.learnerA },
    data: { timezone: 'Asia/Ho_Chi_Minh' },
  });

  // Case 1: 16:59:59.999Z -> 23:59:59.999 in VN -> qualifying date 2026-11-06
  const clockBeforeMidnight = '2026-11-06T16:59:59.999Z';
  const dbBefore = createInjectedClockDb(db, clockBeforeMidnight);

  const card1 = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: new Date('2026-11-06T10:00:00.000Z'),
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });

  const tok1 = createSrsToken({
    learnerId: f.learnerA,
    cardId: card1.id,
    expectedRowVersion: '1',
    sessionKey: randomUUID(),
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  const opKey1 = randomUUID();
  await respondSrsReview(
    f.learnerA,
    { token: tok1, operationKey: opKey1, rating: 'REMEMBERED' },
    dbBefore
  );

  const op1 = await db.srsReviewOperation.findUniqueOrThrow({
    where: { learnerId_operationKey: { learnerId: f.learnerA, operationKey: opKey1 } },
  });
  assert.equal(op1.qualifyingLocalDate.toISOString(), '2026-11-06T00:00:00.000Z');

  // Case 2: 17:00:00.000Z -> 00:00:00.000 in VN -> qualifying date 2026-11-07
  const clockAtMidnight = '2026-11-06T17:00:00.000Z';
  const dbAt = createInjectedClockDb(db, clockAtMidnight);

  const opKey2 = randomUUID();
  const tok2 = createSrsToken({
    learnerId: f.learnerA,
    cardId: card1.id,
    expectedRowVersion: '2',
    sessionKey: randomUUID(),
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  // Temporarily set dueAt back to be eligible
  await db.srsCard.update({
    where: { id: card1.id },
    data: { dueAt: new Date('2026-11-06T16:00:00.000Z') },
  });

  await respondSrsReview(
    f.learnerA,
    { token: tok2, operationKey: opKey2, rating: 'REMEMBERED' },
    dbAt
  );

  const op2 = await db.srsReviewOperation.findUniqueOrThrow({
    where: { learnerId_operationKey: { learnerId: f.learnerA, operationKey: opKey2 } },
  });
  assert.equal(op2.qualifyingLocalDate.toISOString(), '2026-11-07T00:00:00.000Z');

  // Case 3: Negative-offset timezone America/New_York (UTC-5)
  // At 2026-11-06T03:00:00.000Z -> 2026-11-05 22:00:00 in NY -> qualifying date 2026-11-05
  await db.account.update({
    where: { id: f.learnerA },
    data: { timezone: 'America/New_York' },
  });

  const clockNy = '2026-11-06T03:00:00.000Z';
  const dbNy = createInjectedClockDb(db, clockNy);

  await db.srsCard.update({
    where: { id: card1.id },
    data: { dueAt: new Date('2026-11-06T00:00:00.000Z') },
  });

  const opKey3 = randomUUID();
  const tok3 = createSrsToken({
    learnerId: f.learnerA,
    cardId: card1.id,
    expectedRowVersion: '3',
    sessionKey: randomUUID(),
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  await respondSrsReview(
    f.learnerA,
    { token: tok3, operationKey: opKey3, rating: 'REMEMBERED' },
    dbNy
  );

  const op3 = await db.srsReviewOperation.findUniqueOrThrow({
    where: { learnerId_operationKey: { learnerId: f.learnerA, operationKey: opKey3 } },
  });
  assert.equal(op3.qualifyingLocalDate.toISOString(), '2026-11-05T00:00:00.000Z');

  // Restore timezone
  await db.account.update({
    where: { id: f.learnerA },
    data: { timezone: 'UTC' },
  });
});

test('Real PostgreSQL Injected-Clock: exact stored dates and interval math (nextDueAt minus reviewedAt)', async () => {
  const fixedClockIso = '2026-11-06T12:00:00.000Z';
  const clockDb = createInjectedClockDb(db, fixedClockIso);

  const card = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: new Date('2026-11-06T10:00:00.000Z'),
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });

  // 1. Rate REMEMBERED: Stage 1 -> 2 (interval = 3 days = 259,200,000 ms)
  const tok1 = createSrsToken({
    learnerId: f.learnerA,
    cardId: card.id,
    expectedRowVersion: '1',
    sessionKey: randomUUID(),
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  const opKey1 = randomUUID();
  await respondSrsReview(
    f.learnerA,
    { token: tok1, operationKey: opKey1, rating: 'REMEMBERED' },
    clockDb
  );

  const op1 = await db.srsReviewOperation.findUniqueOrThrow({
    where: { learnerId_operationKey: { learnerId: f.learnerA, operationKey: opKey1 } },
  });

  assert.equal(op1.reviewedAt.toISOString(), '2026-11-06T12:00:00.000Z');
  assert.equal(op1.nextDueAt.toISOString(), '2026-11-09T12:00:00.000Z');
  assert.equal(op1.nextDueAt.getTime() - op1.reviewedAt.getTime(), 3 * 24 * 60 * 60 * 1000);

  const updatedCard1 = await db.srsCard.findUniqueOrThrow({ where: { id: card.id } });
  assert.equal(updatedCard1.lastReviewedAt.toISOString(), '2026-11-06T12:00:00.000Z');
  assert.equal(updatedCard1.dueAt.toISOString(), '2026-11-09T12:00:00.000Z');
  assert.equal(updatedCard1.dueAt.getTime() - updatedCard1.lastReviewedAt.getTime(), 3 * 24 * 60 * 60 * 1000);

  // 2. Set card stage to 3, rate FORGOTTEN: Stage 3 -> 1 (interval = 1 day = 86,400,000 ms)
  await db.srsCard.update({
    where: { id: card.id },
    data: { stage: 3, dueAt: new Date('2026-11-06T10:00:00.000Z') },
  });

  const currentCard = await db.srsCard.findUniqueOrThrow({ where: { id: card.id } });
  const tok2 = createSrsToken({
    learnerId: f.learnerA,
    cardId: card.id,
    expectedRowVersion: currentCard.rowVersion.toString(),
    sessionKey: randomUUID(),
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  const opKey2 = randomUUID();
  await respondSrsReview(
    f.learnerA,
    { token: tok2, operationKey: opKey2, rating: 'FORGOTTEN' },
    clockDb
  );

  const op2 = await db.srsReviewOperation.findUniqueOrThrow({
    where: { learnerId_operationKey: { learnerId: f.learnerA, operationKey: opKey2 } },
  });

  assert.equal(op2.nextStage, 1);
  assert.equal(op2.reviewedAt.toISOString(), '2026-11-06T12:00:00.000Z');
  assert.equal(op2.nextDueAt.toISOString(), '2026-11-07T12:00:00.000Z');
  assert.equal(op2.nextDueAt.getTime() - op2.reviewedAt.getTime(), 1 * 24 * 60 * 60 * 1000);

  const updatedCard2 = await db.srsCard.findUniqueOrThrow({ where: { id: card.id } });
  assert.equal(updatedCard2.stage, 1);
  assert.equal(updatedCard2.lastReviewedAt.toISOString(), '2026-11-06T12:00:00.000Z');
  assert.equal(updatedCard2.dueAt.toISOString(), '2026-11-07T12:00:00.000Z');
  assert.equal(updatedCard2.dueAt.getTime() - updatedCard2.lastReviewedAt.getTime(), 1 * 24 * 60 * 60 * 1000);
});
