import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../../../lingora-admin/generated/product-client/index.js';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import {
  createReviewSession,
  getReviewSession,
  revealSessionCurrentItem,
  submitSessionReview,
  submitSessionWritingAttempt,
  completeReviewSession,
  SrsServiceError,
} from '../../src/server/srs/index.ts';
import { resolveWritingCharactersForCards } from '../../src/server/srs/session-service.ts';
import { createPracticeFixture } from './harness/practice-db-fixture.mjs';

const url = process.env.SLICE11_TEST_DATABASE_URL;
assert.ok(url, 'Explicit owned loopback DB required (run via scripts/local-test-db.mjs)');

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

test('Session timezone validation rejects before creating sessions or memory states', async () => {
  for (const timezone of ['Invalid/Timezone']) {
    await db.account.update({ where: { id: f.learnerA }, data: { timezone } });
    const before = await db.srsReviewSession.count({ where: { learnerId: f.learnerA } });
    await assert.rejects(
      () => createReviewSession(f.learnerA, {}, db),
      error => error instanceof SrsServiceError && error.status === 400 && error.code === 'INVALID_TIMEZONE',
    );
    assert.equal(await db.srsReviewSession.count({ where: { learnerId: f.learnerA } }), before);
  }
});

for (const timezone of ['UTC', 'Asia/Bangkok', ' UTC ', ' Asia/Bangkok ']) {
  test(`Session review persists the account local date for ${JSON.stringify(timezone)}`, async () => {
    await db.account.update({ where: { id: f.learnerA }, data: { timezone } });
    const card = await db.srsCard.create({ data: {
      learnerId: f.learnerA, vocabularyId: f.vocabId, stage: 1,
      dueAt: new Date(Date.now() - 3600000), enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    } });
    const session = await createReviewSession(f.learnerA, { limit: 1 }, db);
    await revealSessionCurrentItem(f.learnerA, session.sessionId, { cardId: card.id }, db);
    const input = { operationKey: randomUUID(), cardId: card.id, rating: 'REMEMBERED' };
    await db.account.update({ where: { id: f.learnerA }, data: { timezone: 'Invalid/Timezone' } });
    await assert.rejects(
      () => submitSessionReview(f.learnerA, session.sessionId, input, db),
      error => error instanceof SrsServiceError && error.status === 400 && error.code === 'INVALID_TIMEZONE',
    );
    assert.deepEqual(await db.srsCard.findUnique({ where: { id: card.id } }), card);
    assert.equal(await db.srsReviewOperation.count({ where: { learnerId: f.learnerA } }), 0);
    assert.equal(await db.srsMemoryState.count({ where: { cardId: card.id } }), 0);
    assert.equal(await db.xpEvent.count({ where: { learnerId: f.learnerA } }), 0);
    await db.account.update({ where: { id: f.learnerA }, data: { timezone } });
    const result = await submitSessionReview(f.learnerA, session.sessionId, input, db);
    assert.equal(result.status, 'COMPLETED');
    const operation = await db.srsReviewOperation.findFirstOrThrow({ where: { learnerId: f.learnerA, operationKey: input.operationKey } });
    const localDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone.trim(), year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(operation.reviewedAt);
    assert.equal(operation.qualifyingLocalDate.toISOString().slice(0, 10), localDate);
    assert.equal(operation.nextStage, 2);
    assert.equal(operation.nextDueAt - operation.reviewedAt, 3 * 86400000);
  });
}

test('Real PostgreSQL S5-02: SrsMemoryState tracks skill MEANING, count, lapse, dueAt, version upon review', async () => {
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

  // Start session
  const session = await createReviewSession(f.learnerA, { limit: 10 }, db);
  assert.equal(session.status, 'ACTIVE');
  assert.equal(session.progress.total, 1);
  assert.equal(session.progress.currentIndex, 0);
  assert.equal(session.progress.completedCount, 0);

  // Review item as FORGOTTEN
  const opKey1 = randomUUID();
  const res1 = await submitSessionReview(
    f.learnerA,
    session.sessionId,
    {
      operationKey: opKey1,
      rating: 'FORGOTTEN',
      cardId: card.id,
    },
    db
  );

  assert.equal(res1.status, 'COMPLETED');
  assert.equal(res1.recordedRating, 'FORGOTTEN');

  // Verify SrsMemoryState in database
  const memoryState = await db.srsMemoryState.findUnique({
    where: {
      cardId_skill: {
        cardId: card.id,
        skill: 'MEANING',
      },
    },
  });

  assert.ok(memoryState, 'SrsMemoryState row must exist in DB');
  assert.equal(memoryState.skill, 'MEANING');
  assert.equal(memoryState.schedulerVersion, 'POLICY_B');
  assert.equal(memoryState.state, 1);
  assert.equal(memoryState.count, 1);
  assert.equal(memoryState.lapse, 1);
  assert.ok(memoryState.dueAt > new Date());
  assert.ok(memoryState.lastReviewedAt);
});

test('Real PostgreSQL S5-03: Session queue order is deterministic and preserves secrecy (no due preview or meaning leak)', async () => {
  // Create second vocab concept
  const vocab2 = await db.vocabularyConcept.create({
    data: {
      languageId: f.lang,
      normalizedForm: 'world',
      senseKey: 'noun',
      canonicalForm: 'World',
      meaningLabels: { vi: 'Thế giới' },
      phonetic: 'wɜːld',
      example: 'World in a sentence',
      createdBy: f.admin,
    },
  });

  const t1 = new Date(Date.now() - 7200 * 1000);
  const t2 = new Date(Date.now() - 3600 * 1000);

  const card1 = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: t2,
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });

  const card2 = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: vocab2.id,
      stage: 2,
      dueAt: t1, // Earlier due date
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });

  const session = await createReviewSession(f.learnerA, { limit: 20 }, db);
  assert.equal(session.status, 'ACTIVE');
  assert.equal(session.progress.total, 2);
  assert.equal(session.progress.currentIndex, 0);

  // The earlier due card (card2, 'World') must be presented first
  assert.equal(session.currentItem.canonicalForm, 'World');
  assert.equal(session.currentItem.cardId, card2.id);

  assert.deepEqual(session.currentItem, { cardId: card2.id, canonicalForm: 'World' });
  assert.equal(session['cardIds'], undefined);
  assert.equal(session['queue'], undefined);

  // GET session must also be front-safe
  const getRes = await getReviewSession(f.learnerA, session.sessionId, db);
  assert.deepEqual(getRes.currentItem, session.currentItem);

  // Reveal contract: explicit reveal returns meaning
  const revealRes = await revealSessionCurrentItem(f.learnerA, session.sessionId, { cardId: card2.id }, db);
  assert.equal(revealRes.cardId, card2.id);
  assert.equal(revealRes.meaningLabels.vi, 'Thế giới');
  assert.equal(revealRes.phonetic, 'wɜːld');
  assert.equal(revealRes.example, 'World in a sentence');
});

test('Real PostgreSQL S5-03: Two separate learners are strictly isolated', async () => {
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

  const sessionA = await createReviewSession(f.learnerA, {}, db);
  assert.equal(sessionA.status, 'ACTIVE');

  // Learner B cannot access Learner A's session
  await assert.rejects(
    async () => getReviewSession(f.learnerB, sessionA.sessionId, db),
    (err) => err instanceof SrsServiceError && err.status === 404
  );

  await assert.rejects(
    async () => submitSessionReview(f.learnerB, sessionA.sessionId, { operationKey: randomUUID(), rating: 'REMEMBERED', cardId: card.id }, db),
    (err) => err instanceof SrsServiceError && err.status === 404
  );
});

test('Real PostgreSQL: first-touch completion and rating persist expiry with one connection', async () => {
  const card = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: new Date(Date.now() - 3600 * 1000),
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });
  const singleConnectionUrl = new URL(url);
  singleConnectionUrl.searchParams.set('connection_limit', '1');
  singleConnectionUrl.searchParams.set('pool_timeout', '1');
  const singleConnection = new PrismaClient({ datasourceUrl: singleConnectionUrl.toString() });

  try {
    const rating = { operationKey: randomUUID(), rating: 'REMEMBERED', cardId: card.id };
    for (const action of [
      id => completeReviewSession(f.learnerA, id, singleConnection),
      id => submitSessionReview(f.learnerA, id, rating, singleConnection),
    ]) {
      const session = await createReviewSession(f.learnerA, {}, db);
      await db.srsReviewSession.update({
        where: { id: session.sessionId },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      await assert.rejects(
        () => action(session.sessionId),
        err => err instanceof SrsServiceError && err.status === 409 && err.code === 'SESSION_EXPIRED',
      );
      const expired = await db.srsReviewSession.findUnique({ where: { id: session.sessionId } });
      assert.equal(expired.status, 'EXPIRED');
      assert.equal(expired.completedCount, 0);
    }
    assert.equal(await db.srsReviewOperation.count({ where: { learnerId: f.learnerA } }), 0);
    assert.equal(await db.xpEvent.count({ where: { learnerId: f.learnerA } }), 0);
  } finally {
    await singleConnection.$disconnect();
  }
});

test('Real PostgreSQL: rating checks expiry against the database clock after locking the card', async () => {
  const card = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: new Date(Date.now() - 60_000),
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });
  const session = await createReviewSession(f.learnerA, {}, db);
  const clock = new Date(session.expiresAt);
  let cardLocked = false;
  const clockDb = {
    $transaction: work => db.$transaction(tx => work(new Proxy(tx, {
      get(target, prop, receiver) {
        if (prop !== '$queryRaw') return Reflect.get(target, prop, receiver);
        return async (strings, ...values) => {
          const sql = strings.join('');
          if (sql.includes('clock_timestamp')) {
            assert.equal(cardLocked, true, 'database clock must be read after the card lock');
            return target.$queryRaw`SELECT ${clock}::timestamptz AS ts`;
          }
          const result = await target.$queryRaw(strings, ...values);
          if (sql.includes('app.srs_cards') && sql.includes('FOR UPDATE')) cardLocked = true;
          return result;
        };
      },
    }))),
  };
  await assert.rejects(
    () => submitSessionReview(f.learnerA, session.sessionId, {
      operationKey: randomUUID(), rating: 'REMEMBERED', cardId: card.id,
    }, clockDb),
    err => err instanceof SrsServiceError && err.code === 'SESSION_EXPIRED',
  );
  assert.equal((await db.srsReviewSession.findUnique({ where: { id: session.sessionId } })).status, 'EXPIRED');
  assert.equal(await db.srsReviewOperation.count({ where: { learnerId: f.learnerA } }), 0);
  assert.equal((await db.srsCard.findUnique({ where: { id: card.id } })).rowVersion, card.rowVersion);
});

test('Real PostgreSQL S5-03 / Finding 2: Second tab with different key on same card cannot advance next card', async () => {
  // Create 2 due cards
  const vocab2 = await db.vocabularyConcept.create({
    data: {
      languageId: f.lang,
      normalizedForm: 'apple',
      senseKey: 'fruit',
      canonicalForm: 'Apple',
      meaningLabels: { vi: 'Quả táo' },
      createdBy: f.admin,
    },
  });

  const pastDue1 = new Date(Date.now() - 7200 * 1000);
  const pastDue2 = new Date(Date.now() - 3600 * 1000);

  const card1 = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: pastDue1,
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });

  const card2 = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: vocab2.id,
      stage: 1,
      dueAt: pastDue2,
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });

  const session = await createReviewSession(f.learnerA, { limit: 20 }, db);
  assert.equal(session.currentItem.cardId, card1.id);

  const [first, second] = await Promise.allSettled([db, otherDb].map(client =>
    submitSessionReview(f.learnerA, session.sessionId, {
      operationKey: randomUUID(), rating: 'REMEMBERED', cardId: card1.id,
    }, client),
  ));
  const success = [first, second].find(result => result.status === 'fulfilled');
  const rejected = [first, second].find(result => result.status === 'rejected');
  assert.ok(success);
  assert.equal(success.value.status, 'ACTIVE');
  assert.equal(success.value.progress.completedCount, 1);
  assert.equal(success.value.currentItem.cardId, card2.id);
  assert.ok(rejected);
  assert.equal(rejected.reason.code, 'STALE_OPERATION');

  // Verify that Card 2 was NOT rated or advanced: session is still at index 1, completedCount is still 1
  const sessionDb = await db.srsReviewSession.findUnique({ where: { id: session.sessionId } });
  assert.equal(sessionDb.currentIndex, 1);
  assert.equal(sessionDb.completedCount, 1);

  // Card 2 stage in DB must still be 1 (unmodified)
  const card2Db = await db.srsCard.findUnique({ where: { id: card2.id } });
  assert.equal(card2Db.stage, 1);
});

test('Real PostgreSQL S5-03 / Finding 2: Same-key exact retries return committed outcome across progress changes and terminal state', async () => {
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

  const session = await createReviewSession(f.learnerA, {}, db);
  const opKey = randomUUID();

  // First submit
  const res1 = await submitSessionReview(
    f.learnerA,
    session.sessionId,
    { operationKey: opKey, rating: 'REMEMBERED', cardId: card.id },
    db
  );
  assert.equal(res1.status, 'COMPLETED');
  assert.equal(res1.recordedRating, 'REMEMBERED');

  // Exact retry with same key and same cardId/rating on terminal session
  const res2 = await submitSessionReview(
    f.learnerA,
    session.sessionId,
    { operationKey: opKey, rating: 'REMEMBERED', cardId: card.id },
    otherDb
  );
  assert.equal(res2.status, 'COMPLETED');
  assert.equal(res2.recordedRating, 'REMEMBERED');

  // Reusing same operationKey with different cardId or rating must fail with 409 OPERATION_CONFLICT
  await assert.rejects(
    async () => submitSessionReview(
      f.learnerA,
      session.sessionId,
      { operationKey: opKey, rating: 'FORGOTTEN', cardId: card.id },
      db
    ),
    (err) => err instanceof SrsServiceError && err.status === 409 && err.code === 'OPERATION_CONFLICT'
  );

  await assert.rejects(
    async () => submitSessionReview(
      f.learnerA,
      session.sessionId,
      { operationKey: opKey, rating: 'REMEMBERED', cardId: randomUUID() },
      db
    ),
    (err) => err instanceof SrsServiceError && err.status === 409 && err.code === 'OPERATION_CONFLICT'
  );
});

test('Real PostgreSQL: replay preserves the original response after a skipped card and later completion', async () => {
  const cards = [];
  for (let index = 0; index < 3; index++) {
    const vocabulary = index === 0 ? { id: f.vocabId } : await db.vocabularyConcept.create({
      data: {
        languageId: f.lang,
        normalizedForm: `word-${index}`,
        senseKey: 'regression',
        canonicalForm: `Word ${index}`,
        meaningLabels: { vi: `Từ ${index}` },
        createdBy: f.admin,
      },
    });
    cards.push(await db.srsCard.create({
      data: {
        learnerId: f.learnerA,
        vocabularyId: vocabulary.id,
        dueAt: new Date(Date.now() - (3 - index) * 60_000),
        enrollmentSource: 'OPTIONAL_CHOICE',
        sourceLessonVocabularyId: f.vocabLinkId,
      },
    }));
  }

  const full = await createReviewSession(f.learnerA, {}, db);
  const short = await createReviewSession(f.learnerA, { limit: 1 }, db);
  const rate = card => ({ operationKey: randomUUID(), rating: 'REMEMBERED', cardId: card.id });
  const stale = rate(cards[0]);
  await submitSessionReview(f.learnerA, short.sessionId, rate(cards[0]), otherDb);
  await assert.rejects(
    () => submitSessionReview(f.learnerA, full.sessionId, stale, db),
    err => err.code === 'STALE_OPERATION',
  );
  const reconciled = await db.srsReviewSession.findUnique({ where: { id: full.sessionId } });
  assert.equal(reconciled.currentIndex, 1);
  assert.equal(reconciled.completedCount, 0);

  const review = rate(cards[1]);
  const committed = await submitSessionReview(f.learnerA, full.sessionId, review, db);
  assert.deepEqual(committed.progress, { currentIndex: 2, completedCount: 1, total: 3 });
  assert.equal(committed.currentItem.cardId, cards[2].id);
  await submitSessionReview(f.learnerA, full.sessionId, rate(cards[2]), db);
  await db.vocabularyConcept.update({ where: { id: cards[2].vocabularyId }, data: { canonicalForm: 'Updated' } });

  assert.deepEqual(await submitSessionReview(f.learnerA, full.sessionId, review, otherDb), committed);
  assert.equal(await db.srsReviewOperation.count({ where: { learnerId: f.learnerA } }), 3);
  assert.equal(await db.xpEvent.count({ where: { learnerId: f.learnerA } }), 3);
});

test('Real PostgreSQL S5-03 / Finding 4: Overlapping sessions safely reconcile cards reviewed elsewhere', async () => {
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

  // Session 1 and Session 2 both snapshot card
  const s1 = await createReviewSession(f.learnerA, {}, db);
  const s2 = await createReviewSession(f.learnerA, {}, otherDb);

  // Session 1 reviews card -> card dueAt moves to future
  await submitSessionReview(
    f.learnerA,
    s1.sessionId,
    { operationKey: randomUUID(), rating: 'REMEMBERED', cardId: card.id },
    db
  );

  // Pause the reader just after it takes the session snapshot. A second
  // connection must be unable to update that row before reconciliation.
  const snapshotRead = Promise.withResolvers();
  const releaseReader = Promise.withResolvers();
  const pauseAfterRead = client => ({
    $queryRaw: client.$queryRaw.bind(client),
    account: client.account,
    srsCard: client.srsCard,
    srsReviewSession: {
      ...client.srsReviewSession,
      async findUnique(args) {
        const row = await client.srsReviewSession.findUnique(args);
        snapshotRead.resolve();
        await releaseReader.promise;
        return row;
      },
    },
  });
  const readerDb = {
    ...pauseAfterRead(otherDb),
    $transaction: work => otherDb.$transaction(tx => work(pauseAfterRead(tx))),
  };
  const reading = getReviewSession(f.learnerA, s2.sessionId, readerDb);
  let s2State;
  try {
    await Promise.race([snapshotRead.promise, reading]);
    await assert.rejects(
      () => db.$queryRaw`SELECT id FROM app.srs_review_sessions WHERE id = ${s2.sessionId}::uuid FOR UPDATE NOWAIT`,
      err => err.code === 'P2010' && err.meta?.code === '55P03',
    );
  } finally {
    releaseReader.resolve();
    s2State = await reading;
  }
  assert.equal(s2State.status, 'COMPLETED');
  assert.equal(s2State.currentItem, null);

  // Session 2 submitting review on the already-reviewed card gets 409 SESSION_COMPLETED or STALE_OPERATION (not unhandled 400 CARD_NOT_DUE crash)
  await assert.rejects(
    async () => submitSessionReview(
      f.learnerA,
      s2.sessionId,
      { operationKey: randomUUID(), rating: 'REMEMBERED', cardId: card.id },
      otherDb
    ),
    (err) => err instanceof SrsServiceError && (err.status === 409)
  );
});

test('Real PostgreSQL S5-03: PostgreSQL failure-injection after card, memory, operation and XP writes rolls back all five', async () => {
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

  const session = await createReviewSession(f.learnerA, {}, db);

  // Inject failure right after card, memory, operation, and XP writes, but before session progress commit
  await assert.rejects(
    async () => submitSessionReview(
      f.learnerA,
      session.sessionId,
      { operationKey: randomUUID(), rating: 'REMEMBERED', cardId: card.id },
      db,
      { _injectFaultBeforeSessionCommit: true }
    ),
    (err) => err.message === 'INJECTED_FAULT_BEFORE_SESSION_COMMIT'
  );

  // Assert atomic rollback across ALL 5 entities:
  // 1. Card remains at stage 1 and original dueAt
  const cardAfter = await db.srsCard.findUnique({ where: { id: card.id } });
  assert.equal(cardAfter.stage, 1);
  assert.equal(cardAfter.dueAt.getTime(), pastDue.getTime());

  // 2. SrsMemoryState has 0 rows committed
  const memState = await db.srsMemoryState.findUnique({
    where: { cardId_skill: { cardId: card.id, skill: 'MEANING' } },
  });
  assert.equal(memState, null);

  // 3. SrsReviewOperation has 0 rows committed
  const ops = await db.srsReviewOperation.findMany({ where: { sessionKey: session.sessionId } });
  assert.equal(ops.length, 0);

  // 4. XpEvent has 0 rows committed
  const xpRows = await db.xpEvent.findMany({ where: { learnerId: f.learnerA } });
  assert.equal(xpRows.length, 0);

  // 5. Session progress remained 0
  const sessionAfter = await db.srsReviewSession.findUnique({ where: { id: session.sessionId } });
  assert.equal(sessionAfter.currentIndex, 0);
  assert.equal(sessionAfter.completedCount, 0);
  assert.equal(sessionAfter.status, 'ACTIVE');
});

test('Real PostgreSQL S5-03 / Finding 6: Optional contextId filters due cards and rejects foreign context', async () => {
  // Create second language, course and unit
  const lang2 = await db.language.create({
    data: {
      code: 'test-lang-b-' + randomUUID().slice(0, 8),
      names: { vi: 'Ngôn ngữ B' },
      isLearnable: true,
      isUiLocale: true,
    },
  });
  const course2 = await db.course.create({
    data: {
      languageId: lang2.id,
      frameworkId: f.framework,
      names: { vi: 'Khóa học B' },
      isActive: true,
      defaultStartLevelId: f.level,
    },
  });
  const unit2 = await db.unit.create({
    data: {
      courseId: course2.id,
      levelId: f.level,
      code: 'UNIT_B1',
      position: 1,
      names: { vi: 'Unit B' },
    },
  });
  const lesson2 = await db.lesson.create({
    data: {
      unitId: unit2.id,
      position: 1,
      availability: 'PLANNED',
    },
  });
  const assign2 = await db.contentAssignment.create({
    data: {
      createdBy: f.admin,
      currentTeacherId: f.teacher,
      lessonId: lesson2.id,
    },
  });
  const ep2 = await db.assignmentHistory.create({
    data: {
      assignmentId: assign2.id,
      sequenceNo: 1,
      eventType: 'ASSIGNED',
      nextTeacherId: f.teacher,
      scopeGeneration: 1n,
      changedBy: f.admin,
      scopeSnapshot: { unit: 'UNIT_B1' },
    },
  });
  const rev2 = await db.lessonRevision.create({
    data: {
      lessonId: lesson2.id,
      revisionNo: 1,
      assignmentId: assign2.id,
      creationAssignmentEpisodeId: ep2.id,
      status: 'DRAFT',
      title: { vi: 'Bài học B' },
      contentBlocks: [],
      createdBy: f.teacher,
      lastEditedBy: f.teacher,
    },
  });
  const vocabConceptB = await db.vocabularyConcept.create({
    data: {
      languageId: lang2.id,
      normalizedForm: 'banana',
      senseKey: 'fruit',
      canonicalForm: 'Banana',
      meaningLabels: { vi: 'Quả chuối' },
      createdBy: f.admin,
    },
  });
  const linkB = await db.lessonVocabularyLink.create({
    data: {
      lessonRevisionId: rev2.id,
      vocabularyId: vocabConceptB.id,
      position: 1,
      isCore: true,
      displaySnapshot: {},
    },
  });

  // Learner A has Context 1 (Course A, Language 1) and Context 2 (Course B, Language 2)
  const ctx2 = await db.learningContext.create({
    data: {
      learnerId: f.learnerA,
      languageId: lang2.id,
      courseId: course2.id,
      status: 'ACTIVE',
      rowVersion: 1n,
    },
  });

  const pastDue = new Date(Date.now() - 3600 * 1000);
  // Card A in Course A
  const cardA = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: pastDue,
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });
  // Card B in Course B
  const cardB = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: vocabConceptB.id,
      stage: 1,
      dueAt: pastDue,
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: linkB.id,
    },
  });

  // 1. Session scoped to Context 1 must only return Card A
  const sCtx1 = await createReviewSession(f.learnerA, { contextId: f.ctxA }, db);
  assert.equal(sCtx1.progress.total, 1);
  assert.equal(sCtx1.currentItem.cardId, cardA.id);

  // 2. Session scoped to Context 2 must only return Card B
  const sCtx2 = await createReviewSession(f.learnerA, { contextId: ctx2.id }, db);
  assert.equal(sCtx2.progress.total, 1);
  assert.equal(sCtx2.currentItem.cardId, cardB.id);

  // 3. Account-wide session (no contextId) must return both cards
  const sGlobal = await createReviewSession(f.learnerA, {}, db);
  assert.equal(sGlobal.progress.total, 2);

  // 4. Foreign context (Context belonging to Learner B) must be rejected with 403 FORBIDDEN
  await assert.rejects(
    async () => createReviewSession(f.learnerA, { contextId: f.ctxB }, db),
    (err) => err instanceof SrsServiceError && err.status === 403 && err.code === 'FORBIDDEN'
  );
});

test('Real PostgreSQL S5-03: completeReviewSession revalidates active learner under account lock', async () => {
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

  const session = await createReviewSession(f.learnerA, {}, db);

  // Disable learner account
  await db.account.update({
    where: { id: f.learnerA },
    data: { status: 'DISABLED' },
  });

  // completeReviewSession must reject inactive account
  await assert.rejects(
    async () => completeReviewSession(f.learnerA, session.sessionId, db),
    (err) => err instanceof SrsServiceError && err.status === 403 && err.code === 'ACCOUNT_INACTIVE'
  );
});

test('Real PostgreSQL S6-09: WRITING SRS enrolls lazily, hides answers, grades each character, and schedules independently', async () => {
  const priorEnabled = process.env.WRITING_SRS_ENABLED;
  const priorLearners = process.env.WRITING_SRS_LEARNER_IDS;
  delete process.env.WRITING_SRS_ENABLED;

  try {
    const fixture = await createPracticeFixture(db, { writingCharacter: true, secondWritingCharacter: true });
    process.env.WRITING_SRS_LEARNER_IDS = fixture.learnerA;
    await db.vocabularyCharacter.createMany({
      data: [
        { vocabularyId: fixture.vocabId, characterId: fixture.characterId, position: 1 },
        { vocabularyId: fixture.vocabId, characterId: fixture.secondCharacterId, position: 2 },
      ],
    });
    const meaningDueAt = new Date(Date.now() - 60_000);
    const card = await db.srsCard.create({
      data: {
        learnerId: fixture.learnerA,
        vocabularyId: fixture.vocabId,
        stage: 2,
        dueAt: meaningDueAt,
        enrollmentSource: 'OPTIONAL_CHOICE',
        sourceLessonVocabularyId: fixture.vocabLinkId,
      },
    });

    const disabledSession = await createReviewSession(fixture.learnerA, {}, db);
    assert.equal(disabledSession.currentItem.canonicalForm, 'Hello');
    assert.equal(await db.srsMemoryState.count({ where: { cardId: card.id, skill: 'WRITING' } }), 0);
    await assert.rejects(
      () => submitSessionReview(fixture.learnerA, disabledSession.sessionId, { cardId: card.id, operationKey: randomUUID(), rating: 'GOOD' }, db),
      err => err instanceof SrsServiceError && err.status === 400 && err.code === 'INVALID_RATING',
    );

    process.env.WRITING_SRS_ENABLED = 'true';
    const enabledAt = new Date();
    const firstSession = await createReviewSession(fixture.learnerA, {}, db);
    assert.equal(firstSession.currentItem.canonicalForm, 'Hello');
    const writingState = await db.srsMemoryState.findUnique({
      where: { cardId_skill: { cardId: card.id, skill: 'WRITING' } },
    });
    assert.ok(writingState);
    assert.ok(writingState.dueAt.getTime() >= enabledAt.getTime() + 86_399_000);
    assert.equal((await db.srsCard.findUnique({ where: { id: card.id } })).dueAt.getTime(), meaningDueAt.getTime());

    await db.srsCard.update({ where: { id: card.id }, data: { dueAt: new Date(Date.now() + 86_400_000) } });
    await db.srsMemoryState.update({ where: { id: writingState.id }, data: { dueAt: new Date(Date.now() - 1000) } });
    const session = await createReviewSession(fixture.learnerA, {}, db);
    assert.equal(session.currentItem.skill, 'WRITING');
    assert.deepEqual(session.currentItem.meaningLabels, { vi: 'Xin chào' });
    assert.equal(session.currentItem.writing.characterNumber, 1);
    assert.equal(session.currentItem.writing.characterCount, 2);
    assert.equal(session.currentItem.writing.strokeCount, 1);
    assert.equal('canonicalForm' in session.currentItem, false);
    assert.equal('glyph' in session.currentItem, false);
    assert.equal('characters' in session.currentItem, false);

    const firstAttempt = {
      cardId: card.id,
      operationKey: randomUUID(),
      characterNumber: 1,
      candidateStrokes: [{ points: [[0.1, 0.5], [0.9, 0.5]] }],
    };
    const attempt1 = await submitSessionWritingAttempt(fixture.learnerA, session.sessionId, firstAttempt, db);
    assert.equal(attempt1.currentItem.writing.attemptedCharacters, 1);
    assert.equal(attempt1.currentItem.writing.characterNumber, 2);
    assert.equal(attempt1.currentItem.writing.revealedCharacters, null);
    await assert.rejects(
      () => submitSessionReview(fixture.learnerA, session.sessionId, { cardId: card.id, operationKey: randomUUID(), rating: 'GOOD' }, db),
      err => err instanceof SrsServiceError && err.status === 409 && err.code === 'WRITING_ATTEMPT_REQUIRED',
    );
    assert.deepEqual(
      await submitSessionWritingAttempt(fixture.learnerA, session.sessionId, firstAttempt, db),
      attempt1,
    );
    await assert.rejects(
      () => submitSessionWritingAttempt(fixture.learnerA, session.sessionId, {
        ...firstAttempt,
        candidateStrokes: [{ points: [[0.9, 0.5], [0.1, 0.5]] }],
      }, db),
      err => err instanceof SrsServiceError && err.status === 409 && err.code === 'OPERATION_CONFLICT',
    );

    const attempt2 = await submitSessionWritingAttempt(fixture.learnerA, session.sessionId, {
      cardId: card.id,
      operationKey: randomUUID(),
      characterNumber: 2,
      candidateStrokes: [{ points: [[0.1, 0.5], [0.9, 0.5]] }],
    }, db);
    const revealed = attempt2.currentItem.writing.revealedCharacters;
    assert.equal(revealed.length, 2);
    assert.deepEqual(revealed.map(character => character.glyph), ['文', '字']);
    assert.ok(revealed.every(character => Number.isInteger(character.score)));
    const storedSession = await db.srsReviewSession.findUnique({ where: { id: session.sessionId } });
    assert.equal(JSON.stringify(storedSession.cardIds).includes('candidateStrokes'), false);
    assert.equal(JSON.stringify(storedSession.cardIds).includes('0.1,0.5'), false);

    const beforeReviewCard = await db.srsCard.findUnique({ where: { id: card.id } });
    const beforeWritingState = await db.srsMemoryState.findUnique({ where: { cardId_skill: { cardId: card.id, skill: 'WRITING' } } });
    const review = { cardId: card.id, operationKey: randomUUID(), rating: 'GOOD' };
    await assert.rejects(
      () => submitSessionReview(fixture.learnerA, session.sessionId, review, db, { _injectFaultBeforeSessionCommit: true }),
      /INJECTED_FAULT_BEFORE_SESSION_COMMIT/,
    );
    const rolledBackState = await db.srsMemoryState.findUnique({ where: { cardId_skill: { cardId: card.id, skill: 'WRITING' } } });
    assert.equal(rolledBackState.rowVersion, beforeWritingState.rowVersion);
    assert.equal(rolledBackState.dueAt.getTime(), beforeWritingState.dueAt.getTime());
    assert.equal(await db.srsReviewOperation.count({ where: { cardId: card.id, skill: 'WRITING' } }), 0);
    assert.equal(await db.xpEvent.count({ where: { learnerId: fixture.learnerA, eventType: 'SRS_REVIEW' } }), 0);

    const result = await submitSessionReview(fixture.learnerA, session.sessionId, review, db);
    assert.equal(result.recordedRating, 'GOOD');
    assert.equal(result.status, 'COMPLETED');
    assert.deepEqual(await submitSessionReview(fixture.learnerA, session.sessionId, review, db), result);

    const afterReviewCard = await db.srsCard.findUnique({ where: { id: card.id } });
    assert.equal(afterReviewCard.dueAt.getTime(), beforeReviewCard.dueAt.getTime());
    const afterWriting = await db.srsMemoryState.findUnique({ where: { cardId_skill: { cardId: card.id, skill: 'WRITING' } } });
    assert.equal(afterWriting.schedulerVersion, 'FSRS_6_TS_FSRS_5_4_2');
    assert.equal(afterWriting.count, 1);
    assert.ok(afterWriting.dueAt > beforeReviewCard.dueAt);
    const operation = await db.srsReviewOperation.findUnique({ where: { learnerId_operationKey: { learnerId: fixture.learnerA, operationKey: review.operationKey } } });
    assert.equal(operation.skill, 'WRITING');
    assert.equal(operation.schedulerVersion, 'FSRS_6_TS_FSRS_5_4_2');
    assert.equal(operation.rating, 'GOOD');
    assert.ok(operation.schedulerLog);
    assert.equal(await db.xpEvent.count({ where: { learnerId: fixture.learnerA, eventType: 'SRS_REVIEW', sourceId: operation.id } }), 1);
  } finally {
    if (priorEnabled === undefined) delete process.env.WRITING_SRS_ENABLED;
    else process.env.WRITING_SRS_ENABLED = priorEnabled;
    if (priorLearners === undefined) delete process.env.WRITING_SRS_LEARNER_IDS;
    else process.env.WRITING_SRS_LEARNER_IDS = priorLearners;
  }
});

test('Real PostgreSQL S6-10.2a: Published snapshot eligibility gates WRITING cards and protects prompt secrecy', async () => {
  const priorEnabled = process.env.WRITING_SRS_ENABLED;
  const priorLearners = process.env.WRITING_SRS_LEARNER_IDS;
  process.env.WRITING_SRS_ENABLED = 'true';
  process.env.WRITING_SRS_LEARNER_IDS = f.learnerA;

  try {
    // 1. Catalogue-only: Link has empty snapshot, but catalogue has mapping
    const catChar = await db.writingCharacter.create({
      data: {
        languageId: f.lang,
        glyph: '貓',
        scriptType: 'KANJI',
        meaning: 'cat',
        primaryReading: 'neko',
        romanization: 'neko',
        strokeCount: 1,
      },
    });
    await db.characterStrokeData.create({
      data: {
        characterId: catChar.id,
        version: 1,
        strokes: [{ points: [[0.1, 0.5], [0.9, 0.5]] }],
        source: 'SELF_AUTHORED',
        license: 'CC-BY-4.0',
        provenance: { source: 'TEST' },
      },
    });
    await db.vocabularyCharacter.create({
      data: { vocabularyId: f.vocabId, characterId: catChar.id, position: 1 },
    });
    const cardCatOnly = await db.srsCard.create({
      data: {
        learnerId: f.learnerA,
        vocabularyId: f.vocabId,
        stage: 1,
        dueAt: new Date(Date.now() - 60_000),
        enrollmentSource: 'OPTIONAL_CHOICE',
        sourceLessonVocabularyId: f.vocabLinkId, // snapshot has NO characters
      },
    });
    const resolvedCatOnly = await resolveWritingCharactersForCards(db, [{
      id: cardCatOnly.id,
      vocabularyId: f.vocabId,
      sourceLessonVocabularyId: f.vocabLinkId,
      vocabulary: { canonicalForm: 'Hello', languageId: f.lang },
    }]);
    assert.equal(resolvedCatOnly.has(cardCatOnly.id), false, 'Catalogue-only card without snapshot characters must be ineligible');

    // 2. Draft-only revision rejected
    const vocabDraft = await db.vocabularyConcept.create({
      data: {
        languageId: f.lang,
        canonicalForm: 'DraftWord',
        normalizedForm: 'draftword',
        senseKey: 'draft',
        meaningLabels: { en: 'Draft' },
        createdBy: f.teacher,
      },
    });
    const draftRev = await db.lessonRevision.create({
      data: {
        lessonId: f.lesson,
        revisionNo: 91,
        assignmentId: f.assignment,
        creationAssignmentEpisodeId: f.episode,
        status: 'DRAFT',
        title: { en: 'Draft Rev' },
        createdBy: f.teacher,
        lastEditedBy: f.teacher,
      },
    });
    const linkDraft = await db.lessonVocabularyLink.create({
      data: {
        lessonRevisionId: draftRev.id,
        vocabularyId: vocabDraft.id,
        position: 1,
        isCore: true,
        displaySnapshot: {
          languageId: f.lang,
          characters: [{
            characterId: catChar.id,
            position: 1,
            glyph: '貓',
            strokeCount: 1,
            strokeVersion: 1,
          }],
        },
      },
    });
    const cardDraft = await db.srsCard.create({
      data: {
        learnerId: f.learnerA,
        vocabularyId: vocabDraft.id,
        stage: 1,
        dueAt: new Date(Date.now() - 60_000),
        enrollmentSource: 'OPTIONAL_CHOICE',
        sourceLessonVocabularyId: linkDraft.id,
      },
    });
    const resolvedDraft = await resolveWritingCharactersForCards(db, [{
      id: cardDraft.id,
      vocabularyId: vocabDraft.id,
      sourceLessonVocabularyId: linkDraft.id,
      vocabulary: { canonicalForm: 'DraftWord', languageId: f.lang },
    }]);
    assert.equal(resolvedDraft.has(cardDraft.id), false, 'Draft revision link must be ineligible');

    // 3. Archived publication is accepted
    const fArch = await createPracticeFixture(db, { writingCharacter: true });
    await db.lesson.update({
      where: { id: fArch.lesson },
      data: { availability: 'PLANNED', activeRevisionId: null },
    });
    await db.lessonRevision.update({
      where: { id: fArch.revision },
      data: {
        status: 'ARCHIVED',
        endedAt: new Date(),
      },
    });
    const cardArchived = await db.srsCard.create({
      data: {
        learnerId: fArch.learnerA,
        vocabularyId: fArch.vocabId,
        stage: 1,
        dueAt: new Date(Date.now() - 60_000),
        enrollmentSource: 'OPTIONAL_CHOICE',
        sourceLessonVocabularyId: fArch.vocabLinkId,
      },
    });
    const resolvedArchived = await resolveWritingCharactersForCards(db, [{
      id: cardArchived.id,
      vocabularyId: fArch.vocabId,
      sourceLessonVocabularyId: fArch.vocabLinkId,
      vocabulary: { canonicalForm: 'Hello', languageId: fArch.lang },
    }]);
    assert.equal(resolvedArchived.has(cardArchived.id), true, 'Archived published revision must be eligible');
    assert.equal(resolvedArchived.get(cardArchived.id)?.[0]?.glyph, '文');

    // 4. Invalid template geometry rejected (out of [0, 1] bounds)
    const fBad = await createPracticeFixture(db, { writingCharacter: true });
    await db.characterStrokeData.update({
      where: { characterId: fBad.characterId },
      data: { strokes: [{ points: [[0.1, 0.5], [1.5, 0.5]] }] }, // 1.5 is > 1.0 -> invalid template
    });
    const cardBadGeom = await db.srsCard.create({
      data: {
        learnerId: fBad.learnerA,
        vocabularyId: fBad.vocabId,
        stage: 1,
        dueAt: new Date(Date.now() - 60_000),
        enrollmentSource: 'OPTIONAL_CHOICE',
        sourceLessonVocabularyId: fBad.vocabLinkId,
      },
    });
    const resolvedBadGeom = await resolveWritingCharactersForCards(db, [{
      id: cardBadGeom.id,
      vocabularyId: fBad.vocabId,
      sourceLessonVocabularyId: fBad.vocabLinkId,
      vocabulary: { canonicalForm: 'Hello', languageId: fBad.lang },
    }]);
    assert.equal(resolvedBadGeom.has(cardBadGeom.id), false, 'Invalid template geometry must be ineligible');

    // 5. Chinese prompt secrecy: echoes of canonicalForm / glyph stripped pre-reveal
    const fZh = await createPracticeFixture(db, {
      writingCharacter: true,
      canonicalForm: '人口',
      meaningLabels: { vi: 'Dân số', en: 'population', zh: '人口' },
    });
    const cardZh = await db.srsCard.create({
      data: {
        learnerId: fZh.learnerA,
        vocabularyId: fZh.vocabId,
        stage: 1,
        dueAt: new Date(Date.now() + 86_400_000), // future MEANING
        enrollmentSource: 'OPTIONAL_CHOICE',
        sourceLessonVocabularyId: fZh.vocabLinkId,
      },
    });
    process.env.WRITING_SRS_LEARNER_IDS = fZh.learnerA;
    await createReviewSession(fZh.learnerA, {}, db);
    await db.srsMemoryState.update({
      where: { cardId_skill: { cardId: cardZh.id, skill: 'WRITING' } },
      data: { dueAt: new Date(Date.now() - 1000) },
    });
    const zhSession = await createReviewSession(fZh.learnerA, {}, db);
    assert.equal(zhSession.currentItem.skill, 'WRITING');
    assert.deepEqual(zhSession.currentItem.meaningLabels, { vi: 'Dân số', en: 'population' });
    assert.equal('zh' in zhSession.currentItem.meaningLabels, false, 'Echoing zh meaning label must be stripped pre-reveal');
  } finally {
    if (priorEnabled === undefined) delete process.env.WRITING_SRS_ENABLED;
    else process.env.WRITING_SRS_ENABLED = priorEnabled;
    if (priorLearners === undefined) delete process.env.WRITING_SRS_LEARNER_IDS;
    else process.env.WRITING_SRS_LEARNER_IDS = priorLearners;
  }
});

test('Real PostgreSQL S6-10.2b: Independent WRITING initialization, due order merging, and limit filtering', async () => {
  const priorEnabled = process.env.WRITING_SRS_ENABLED;
  const priorLearners = process.env.WRITING_SRS_LEARNER_IDS;
  process.env.WRITING_SRS_ENABLED = 'true';
  process.env.WRITING_SRS_LEARNER_IDS = f.learnerA;

  try {
    const fixture = await createPracticeFixture(db, { writingCharacter: true });
    process.env.WRITING_SRS_LEARNER_IDS = fixture.learnerA;

    // Card 1: Meaning is 10 days in the future
    const futureMeaningDue = new Date(Date.now() + 10 * 86_400_000);
    const card1 = await db.srsCard.create({
      data: {
        learnerId: fixture.learnerA,
        vocabularyId: fixture.vocabId,
        stage: 1,
        dueAt: futureMeaningDue,
        enrollmentSource: 'OPTIONAL_CHOICE',
        sourceLessonVocabularyId: fixture.vocabLinkId,
      },
    });

    // 1. Initial review session initializes WRITING memory state independently
    const sessionInit = await createReviewSession(fixture.learnerA, { limit: 10 }, db);
    assert.equal(sessionInit.status, 'COMPLETED'); // no cards due yet
    assert.equal(sessionInit.progress.total, 0);

    // Verify MEANING dueAt was NOT touched
    const card1AfterInit = await db.srsCard.findUniqueOrThrow({ where: { id: card1.id } });
    assert.equal(card1AfterInit.dueAt.getTime(), futureMeaningDue.getTime());

    // Verify WRITING memory state exists with ~1 day interval
    const writingState = await db.srsMemoryState.findUnique({
      where: { cardId_skill: { cardId: card1.id, skill: 'WRITING' } },
    });
    assert.ok(writingState);
    assert.ok(writingState.dueAt.getTime() >= Date.now() + 86_300_000);

    // Concurrent/repeat call to createReviewSession doesn't create duplicate or fail
    const sessionRepeat = await createReviewSession(fixture.learnerA, { limit: 10 }, db);
    assert.equal(sessionRepeat.progress.total, 0);
    assert.equal(await db.srsMemoryState.count({ where: { cardId: card1.id, skill: 'WRITING' } }), 1);

    // 2. Prove due WRITING item enters queue while MEANING is still future
    await db.srsMemoryState.update({
      where: { id: writingState.id },
      data: { dueAt: new Date(Date.now() - 3600_000) }, // WRITING due 1 hour ago
    });
    const sessionWritingDue = await createReviewSession(fixture.learnerA, { limit: 10 }, db);
    assert.equal(sessionWritingDue.progress.total, 1);
    assert.equal(sessionWritingDue.currentItem.cardId, card1.id);
    assert.equal(sessionWritingDue.currentItem.skill, 'WRITING');

    // 3. Merging due order: Card 2 (MEANING due 2 hours ago) should appear before Card 1 (WRITING due 1 hour ago)
    const vocab2 = await db.vocabularyConcept.create({
      data: {
        languageId: fixture.lang,
        canonicalForm: 'SecondWord',
        normalizedForm: 'secondword',
        senseKey: 'second',
        meaningLabels: { en: 'Second' },
        createdBy: fixture.teacher,
      },
    });
    const card2 = await db.srsCard.create({
      data: {
        learnerId: fixture.learnerA,
        vocabularyId: vocab2.id,
        stage: 1,
        dueAt: new Date(Date.now() - 7200_000), // MEANING due 2 hours ago
        enrollmentSource: 'OPTIONAL_CHOICE',
        sourceLessonVocabularyId: fixture.vocabLinkId,
      },
    });
    const sessionMerged = await createReviewSession(fixture.learnerA, { limit: 10 }, db);
    assert.equal(sessionMerged.progress.total, 2);
    // Index 0: Card 2 (MEANING due earlier)
    assert.equal(sessionMerged.currentItem.cardId, card2.id);
    assert.equal(sessionMerged.currentItem.canonicalForm, 'SecondWord');

    // 4. Session limit after eligibility: ineligible due WRITING does not crowd out eligible card
    const vocab3 = await db.vocabularyConcept.create({
      data: {
        languageId: fixture.lang,
        canonicalForm: 'ThirdWord',
        normalizedForm: 'thirdword',
        senseKey: 'third',
        meaningLabels: { en: 'Third' },
        createdBy: fixture.teacher,
      },
    });
    const cardIneligible = await db.srsCard.create({
      data: {
        learnerId: fixture.learnerA,
        vocabularyId: vocab3.id,
        stage: 1,
        dueAt: new Date(Date.now() + 86_400_000),
        enrollmentSource: 'OPTIONAL_CHOICE',
        sourceLessonVocabularyId: f.vocabLinkId, // snapshot has no characters -> ineligible for WRITING
      },
    });
    await db.srsMemoryState.create({
      data: {
        cardId: cardIneligible.id,
        skill: 'WRITING',
        schedulerVersion: 'FSRS_6_TS_FSRS_5_4_2',
        state: 1,
        stability: 1.0,
        difficulty: 5.0,
        dueAt: new Date(Date.now() - 10000_000), // earlier dueAt
        count: 0,
        lapse: 0,
        scheduledDays: 1,
        learningSteps: 0,
      },
    });
    // With limit: 1 and Card 2 (MEANING) moved to future: Card 1 (eligible WRITING) must be selected!
    await db.srsCard.update({ where: { id: card2.id }, data: { dueAt: new Date(Date.now() + 86_400_000) } });
    const sessionLimited = await createReviewSession(fixture.learnerA, { limit: 1 }, db);
    assert.equal(sessionLimited.progress.total, 1);
    assert.equal(sessionLimited.currentItem.cardId, card1.id);
    assert.equal(sessionLimited.currentItem.skill, 'WRITING');
  } finally {
    if (priorEnabled === undefined) delete process.env.WRITING_SRS_ENABLED;
    else process.env.WRITING_SRS_ENABLED = priorEnabled;
    if (priorLearners === undefined) delete process.env.WRITING_SRS_LEARNER_IDS;
    else process.env.WRITING_SRS_LEARNER_IDS = priorLearners;
  }
});

test('Real PostgreSQL S6-10.2c: WRITING attempt request contract, character identity, concurrency, and overlapping sessions', async () => {
  const priorEnabled = process.env.WRITING_SRS_ENABLED;
  const priorLearners = process.env.WRITING_SRS_LEARNER_IDS;
  process.env.WRITING_SRS_ENABLED = 'true';

  try {
    const fixture = await createPracticeFixture(db, { writingCharacter: true, secondWritingCharacter: true });
    process.env.WRITING_SRS_LEARNER_IDS = fixture.learnerA;

    const card = await db.srsCard.create({
      data: {
        learnerId: fixture.learnerA,
        vocabularyId: fixture.vocabId,
        stage: 1,
        dueAt: new Date(Date.now() + 86_400_000), // future MEANING
        enrollmentSource: 'OPTIONAL_CHOICE',
        sourceLessonVocabularyId: fixture.vocabLinkId,
      },
    });

    // Initialize WRITING
    await createReviewSession(fixture.learnerA, {}, db);
    const writingState = await db.srsMemoryState.findUniqueOrThrow({
      where: { cardId_skill: { cardId: card.id, skill: 'WRITING' } },
    });
    await db.srsMemoryState.update({
      where: { id: writingState.id },
      data: { dueAt: new Date(Date.now() - 1000) },
    });

    const session = await createReviewSession(fixture.learnerA, {}, db);
    assert.equal(session.currentItem.skill, 'WRITING');
    assert.equal(session.currentItem.writing.characterNumber, 1);

    // 1. Invalid characterNumber: 0 returns 400
    await assert.rejects(
      () => submitSessionWritingAttempt(fixture.learnerA, session.sessionId, {
        cardId: card.id,
        operationKey: randomUUID(),
        characterNumber: 0,
        candidateStrokes: [{ points: [[0.1, 0.5], [0.9, 0.5]] }],
      }, db),
      err => err instanceof SrsServiceError && err.status === 400,
    );

    // 2. Two tabs race ordinal 1 on separate PostgreSQL connections.
    const competingKeys = [randomUUID(), randomUUID()];
    const competingAttempts = await Promise.allSettled([db, otherDb].map((client, index) =>
      submitSessionWritingAttempt(fixture.learnerA, session.sessionId, {
        cardId: card.id,
        operationKey: competingKeys[index],
        characterNumber: 1,
        candidateStrokes: [{ points: [[0.1, 0.5], [0.9, 0.5]] }],
      }, client),
    ));
    const winningAttemptIndex = competingAttempts.findIndex(attempt => attempt.status === 'fulfilled');
    const res1 = competingAttempts[winningAttemptIndex].value;
    const key1 = competingKeys[winningAttemptIndex];
    const staleAttempt = competingAttempts[1 - winningAttemptIndex];
    assert.equal(competingAttempts.filter(attempt => attempt.status === 'fulfilled').length, 1);
    assert.equal(staleAttempt.status, 'rejected');
    assert.ok(staleAttempt.reason instanceof SrsServiceError);
    assert.equal(staleAttempt.reason.code, 'STALE_OPERATION');
    assert.equal(res1.currentItem.writing.characterNumber, 2);
    assert.equal(res1.currentItem.writing.attemptedCharacters, 1);

    // 3. Reusing key1 with different ordinal (characterNumber: 2) -> OPERATION_CONFLICT (409)
    await assert.rejects(
      () => submitSessionWritingAttempt(fixture.learnerA, session.sessionId, {
        cardId: card.id,
        operationKey: key1,
        characterNumber: 2,
        candidateStrokes: [{ points: [[0.1, 0.5], [0.9, 0.5]] }],
      }, db),
      err => err instanceof SrsServiceError && err.status === 409 && err.code === 'OPERATION_CONFLICT',
    );

    // 4. Reusing key1 with different strokes on same ordinal 1 -> OPERATION_CONFLICT (409)
    await assert.rejects(
      () => submitSessionWritingAttempt(fixture.learnerA, session.sessionId, {
        cardId: card.id,
        operationKey: key1,
        characterNumber: 1,
        candidateStrokes: [{ points: [[0.2, 0.5], [0.8, 0.5]] }],
      }, db),
      err => err instanceof SrsServiceError && err.status === 409 && err.code === 'OPERATION_CONFLICT',
    );

    // Same key exact replay -> succeeds with identical response
    const replay1 = await submitSessionWritingAttempt(fixture.learnerA, session.sessionId, {
      cardId: card.id,
      operationKey: key1,
      characterNumber: 1,
      candidateStrokes: [{ points: [[0.1, 0.5], [0.9, 0.5]] }],
    }, db);
    assert.deepEqual(replay1, res1);

    // 5. Submit ordinal 2 -> reveals both characters
    const key3 = randomUUID();
    const res2 = await submitSessionWritingAttempt(fixture.learnerA, session.sessionId, {
      cardId: card.id,
      operationKey: key3,
      characterNumber: 2,
      candidateStrokes: [{ points: [[0.1, 0.5], [0.9, 0.5]] }],
    }, db);
    assert.equal(res2.currentItem.writing.attemptedCharacters, 2);
    assert.equal(res2.currentItem.writing.revealedCharacters?.length, 2);

    // 6. Complete review for the card
    const reviewOpKey = randomUUID();
    const reviewRes = await submitSessionReview(fixture.learnerA, session.sessionId, {
      cardId: card.id,
      operationKey: reviewOpKey,
      rating: 'GOOD',
    }, db);
    assert.equal(reviewRes.status, 'COMPLETED');
  } finally {
    if (priorEnabled === undefined) delete process.env.WRITING_SRS_ENABLED;
    else process.env.WRITING_SRS_ENABLED = priorEnabled;
    if (priorLearners === undefined) delete process.env.WRITING_SRS_LEARNER_IDS;
    else process.env.WRITING_SRS_LEARNER_IDS = priorLearners;
  }
});

test('Real PostgreSQL S6-10.2d: Rollout continuity, mid-session toggle, replay, and cross-skill isolation', async () => {
  const priorEnabled = process.env.WRITING_SRS_ENABLED;
  const priorLearners = process.env.WRITING_SRS_LEARNER_IDS;
  process.env.WRITING_SRS_ENABLED = 'true';

  try {
    const fixture = await createPracticeFixture(db, { writingCharacter: true });
    process.env.WRITING_SRS_LEARNER_IDS = fixture.learnerA;

    // Card 1: Eligible for WRITING, due now
    const card1 = await db.srsCard.create({
      data: {
        learnerId: fixture.learnerA,
        vocabularyId: fixture.vocabId,
        stage: 1,
        dueAt: new Date(Date.now() + 86_400_000), // future MEANING
        enrollmentSource: 'OPTIONAL_CHOICE',
        sourceLessonVocabularyId: fixture.vocabLinkId,
      },
    });
    // Card 2: MEANING due now
    const vocab2 = await db.vocabularyConcept.create({
      data: {
        languageId: fixture.lang,
        canonicalForm: 'RolloutMeaning',
        normalizedForm: 'rolloutmeaning',
        senseKey: 'rollout-meaning',
        meaningLabels: { en: 'Rollout Meaning' },
        createdBy: fixture.teacher,
      },
    });
    const card2 = await db.srsCard.create({
      data: {
        learnerId: fixture.learnerA,
        vocabularyId: vocab2.id,
        stage: 1,
        dueAt: new Date(Date.now() - 3600_000), // past due MEANING
        enrollmentSource: 'OPTIONAL_CHOICE',
        sourceLessonVocabularyId: fixture.vocabLinkId,
      },
    });

    // Initialize WRITING
    await createReviewSession(fixture.learnerA, {}, db);
    await db.srsMemoryState.update({
      where: { cardId_skill: { cardId: card1.id, skill: 'WRITING' } },
      data: { dueAt: new Date(Date.now() - 7200_000) }, // WRITING due earlier than MEANING
    });

    // Create session containing [Card 1 (WRITING), Card 2 (MEANING)]
    const session = await createReviewSession(fixture.learnerA, { limit: 10 }, db);
    assert.equal(session.progress.total, 2);
    assert.equal(session.currentItem.skill, 'WRITING');
    assert.equal(session.currentItem.cardId, card1.id);

    // Commit attempt 1 for Card 1
    const opKeyAttempt1 = randomUUID();
    const attemptPayload = {
      cardId: card1.id,
      operationKey: opKeyAttempt1,
      characterNumber: 1,
      candidateStrokes: [{ points: [[0.1, 0.5], [0.9, 0.5]] }],
    };
    const attemptRes = await submitSessionWritingAttempt(fixture.learnerA, session.sessionId, attemptPayload, db);
    assert.equal(attemptRes.currentItem.writing.attemptedCharacters, 1);

    // NOW DISABLE WRITING SRS!
    delete process.env.WRITING_SRS_ENABLED;

    // 1. GET session skips disabled WRITING and reconciles to Card 2 (MEANING)
    const reconciledSession = await getReviewSession(fixture.learnerA, session.sessionId, db);
    assert.equal(reconciledSession.status, 'ACTIVE');
    assert.equal(reconciledSession.currentItem.cardId, card2.id);
    assert.equal(reconciledSession.currentItem.canonicalForm, 'RolloutMeaning');
    assert.equal(reconciledSession.progress.currentIndex, 1); // skipped slot
    assert.equal(reconciledSession.progress.completedCount, 0); // completedCount unchanged!

    // Verify WRITING receipts and memory state in DB are preserved
    const storedSession = await db.srsReviewSession.findUniqueOrThrow({ where: { id: session.sessionId } });
    const storedWritingEntry = storedSession.cardIds.find(e => typeof e === 'object' && e.cardId === card1.id);
    assert.ok(storedWritingEntry);
    assert.equal(storedWritingEntry.attempts.length, 1);
    assert.equal(storedWritingEntry.attempts[0].operationKey, opKeyAttempt1);

    // 2. Replay of committed operation succeeds even while disabled!
    const replayRes = await submitSessionWritingAttempt(fixture.learnerA, session.sessionId, attemptPayload, db);
    assert.deepEqual(replayRes, attemptRes);

    // 3. New WRITING submission while disabled is rejected (404 / disabled)
    await assert.rejects(
      () => submitSessionWritingAttempt(fixture.learnerA, session.sessionId, {
        cardId: card1.id,
        operationKey: randomUUID(),
        characterNumber: 1,
        candidateStrokes: [{ points: [[0.1, 0.5], [0.9, 0.5]] }],
      }, db),
      err => err instanceof SrsServiceError && (err.status === 404 || err.status === 403),
    );

    // 4. Learner reviews Card 2 (MEANING) as REMEMBERED -> session finishes cleanly
    const meaningOpKey = randomUUID();
    const meaningReviewRes = await submitSessionReview(fixture.learnerA, session.sessionId, {
      cardId: card2.id,
      operationKey: meaningOpKey,
      rating: 'REMEMBERED',
    }, db);
    assert.equal(meaningReviewRes.status, 'COMPLETED');
    assert.equal(meaningReviewRes.progress.completedCount, 1);

    // Verify WRITING memory state of card 1 is still intact
    const card1WritingState = await db.srsMemoryState.findUnique({
      where: { cardId_skill: { cardId: card1.id, skill: 'WRITING' } },
    });
    assert.ok(card1WritingState);

    // 6. Re-enabling restores eligibility on next session
    process.env.WRITING_SRS_ENABLED = 'true';
    const reenabledSession = await createReviewSession(fixture.learnerA, {}, db);
    assert.equal(reenabledSession.progress.total, 1);
    assert.equal(reenabledSession.currentItem.cardId, card1.id);
    assert.equal(reenabledSession.currentItem.skill, 'WRITING');
  } finally {
    if (priorEnabled === undefined) delete process.env.WRITING_SRS_ENABLED;
    else process.env.WRITING_SRS_ENABLED = priorEnabled;
    if (priorLearners === undefined) delete process.env.WRITING_SRS_LEARNER_IDS;
    else process.env.WRITING_SRS_LEARNER_IDS = priorLearners;
  }
});

test('Real PostgreSQL: a stale WRITING rating cannot mutate the following MEANING entry for the same card', async () => {
  const priorEnabled = process.env.WRITING_SRS_ENABLED;
  const priorLearners = process.env.WRITING_SRS_LEARNER_IDS;
  process.env.WRITING_SRS_ENABLED = 'true';

  try {
    const fixture = await createPracticeFixture(db, { writingCharacter: true });
    process.env.WRITING_SRS_LEARNER_IDS = fixture.learnerA;
    const card = await db.srsCard.create({
      data: {
        learnerId: fixture.learnerA,
        vocabularyId: fixture.vocabId,
        stage: 1,
        dueAt: new Date(Date.now() - 2 * 3_600_000),
        enrollmentSource: 'OPTIONAL_CHOICE',
        sourceLessonVocabularyId: fixture.vocabLinkId,
      },
    });

    await createReviewSession(fixture.learnerA, {}, db);
    await db.srsMemoryState.update({
      where: { cardId_skill: { cardId: card.id, skill: 'WRITING' } },
      data: { dueAt: new Date(Date.now() - 3 * 3_600_000) },
    });
    const session = await createReviewSession(fixture.learnerA, {}, db);
    assert.equal(session.currentItem.skill, 'WRITING');
    assert.equal(session.progress.total, 2);

    await submitSessionWritingAttempt(fixture.learnerA, session.sessionId, {
      cardId: card.id,
      operationKey: randomUUID(),
      characterNumber: 1,
      candidateStrokes: [{ points: [[0.1, 0.5], [0.9, 0.5]] }],
    }, db);
    const writingReview = await submitSessionReview(fixture.learnerA, session.sessionId, {
      cardId: card.id,
      operationKey: randomUUID(),
      rating: 'GOOD',
    }, db);
    assert.equal(writingReview.status, 'ACTIVE');
    assert.equal(writingReview.currentItem.skill, undefined);
    assert.equal(writingReview.currentItem.canonicalForm, 'Hello');

    const meaningBefore = await db.srsCard.findUniqueOrThrow({ where: { id: card.id } });
    const staleWritingKey = randomUUID();
    await assert.rejects(
      () => submitSessionReview(fixture.learnerA, session.sessionId, {
        cardId: card.id,
        operationKey: staleWritingKey,
        rating: 'GOOD',
      }, db),
      error => error instanceof SrsServiceError && error.code === 'INVALID_RATING',
    );
    assert.equal(await db.srsReviewOperation.count({ where: { learnerId: fixture.learnerA, operationKey: staleWritingKey } }), 0);
    const meaningAfter = await db.srsCard.findUniqueOrThrow({ where: { id: card.id } });
    assert.equal(meaningAfter.stage, meaningBefore.stage);
    assert.equal(meaningAfter.dueAt.getTime(), meaningBefore.dueAt.getTime());
    assert.equal(meaningAfter.rowVersion, meaningBefore.rowVersion);

    const meaningReview = await submitSessionReview(fixture.learnerA, session.sessionId, {
      cardId: card.id,
      operationKey: randomUUID(),
      rating: 'REMEMBERED',
    }, db);
    assert.equal(meaningReview.status, 'COMPLETED');
  } finally {
    if (priorEnabled === undefined) delete process.env.WRITING_SRS_ENABLED;
    else process.env.WRITING_SRS_ENABLED = priorEnabled;
    if (priorLearners === undefined) delete process.env.WRITING_SRS_LEARNER_IDS;
    else process.env.WRITING_SRS_LEARNER_IDS = priorLearners;
  }
});

test('Real PostgreSQL: new WRITING attempts must match the published character order in the session queue', async () => {
  const priorEnabled = process.env.WRITING_SRS_ENABLED;
  const priorLearners = process.env.WRITING_SRS_LEARNER_IDS;
  process.env.WRITING_SRS_ENABLED = 'true';

  try {
    const fixture = await createPracticeFixture(db, { writingCharacter: true, secondWritingCharacter: true });
    process.env.WRITING_SRS_LEARNER_IDS = fixture.learnerA;
    const card = await db.srsCard.create({
      data: {
        learnerId: fixture.learnerA,
        vocabularyId: fixture.vocabId,
        stage: 1,
        dueAt: new Date(Date.now() + 86_400_000),
        enrollmentSource: 'OPTIONAL_CHOICE',
        sourceLessonVocabularyId: fixture.vocabLinkId,
      },
    });
    await createReviewSession(fixture.learnerA, {}, db);
    await db.srsMemoryState.update({
      where: { cardId_skill: { cardId: card.id, skill: 'WRITING' } },
      data: { dueAt: new Date(Date.now() - 1000) },
    });
    const session = await createReviewSession(fixture.learnerA, {}, db);
    const storedSession = await db.srsReviewSession.findUniqueOrThrow({ where: { id: session.sessionId } });
    const [entry] = storedSession.cardIds;
    entry.characters = entry.characters.reverse();
    await db.srsReviewSession.update({ where: { id: session.sessionId }, data: { cardIds: [entry] } });

    await assert.rejects(
      () => submitSessionWritingAttempt(fixture.learnerA, session.sessionId, {
        cardId: card.id,
        operationKey: randomUUID(),
        characterNumber: 1,
        candidateStrokes: [{ points: [[0.1, 0.5], [0.9, 0.5]] }],
      }, db),
      error => error instanceof SrsServiceError && error.code === 'CONTENT_INCONSISTENT',
    );
    const unchanged = await db.srsReviewSession.findUniqueOrThrow({ where: { id: session.sessionId } });
    assert.equal(unchanged.cardIds[0].attempts.length, 0);
  } finally {
    if (priorEnabled === undefined) delete process.env.WRITING_SRS_ENABLED;
    else process.env.WRITING_SRS_ENABLED = priorEnabled;
    if (priorLearners === undefined) delete process.env.WRITING_SRS_LEARNER_IDS;
    else process.env.WRITING_SRS_LEARNER_IDS = priorLearners;
  }
});

// ---------------------------------------------------------------------------
// G11 (per-language sessions), G12 (same-day first review) and the "Ôn nhanh"
// in-lesson warm-up (limit + excludeLessonId).
// ---------------------------------------------------------------------------

/** Units are unique per (course, level, position), so each holder lesson gets its own slot. */
let holderPosition = 100;

/** Minimal DRAFT lesson in an existing course, usable as a vocabulary-link holder. */
async function createDraftLesson(courseId, code) {
  const unit = await db.unit.create({
    data: { courseId, levelId: f.level, code, position: holderPosition++, names: { vi: code } },
  });
  const lesson = await db.lesson.create({
    data: { unitId: unit.id, position: 1, availability: 'PLANNED' },
  });
  const assignment = await db.contentAssignment.create({
    data: { createdBy: f.admin, currentTeacherId: f.teacher, lessonId: lesson.id },
  });
  const episode = await db.assignmentHistory.create({
    data: {
      assignmentId: assignment.id,
      sequenceNo: 1,
      eventType: 'ASSIGNED',
      nextTeacherId: f.teacher,
      scopeGeneration: 1n,
      changedBy: f.admin,
      scopeSnapshot: { unit: code },
    },
  });
  const revision = await db.lessonRevision.create({
    data: {
      lessonId: lesson.id,
      revisionNo: 1,
      assignmentId: assignment.id,
      creationAssignmentEpisodeId: episode.id,
      status: 'DRAFT',
      title: { vi: code },
      contentBlocks: [],
      createdBy: f.teacher,
      lastEditedBy: f.teacher,
    },
  });
  return { lessonId: lesson.id, revisionId: revision.id, nextPosition: 1 };
}

/** A second language with its own course and a DRAFT lesson to hold vocabulary links. */
async function createSecondLanguage() {
  const language = await db.language.create({
    data: {
      code: 'lang-b-' + randomUUID().slice(0, 8),
      names: { vi: 'Tiếng Pháp (test)', en: 'French (test)' },
      isLearnable: true,
      isUiLocale: false,
    },
  });
  const course = await db.course.create({
    data: {
      languageId: language.id,
      frameworkId: f.framework,
      names: { vi: 'Khóa học B' },
      isActive: true,
      defaultStartLevelId: f.level,
    },
  });
  const holder = await createDraftLesson(course.id, 'UB-' + randomUUID().slice(0, 6));
  return { language, course, holder };
}

/**
 * A due card whose vocabulary belongs to `languageId` and whose provenance link lives on
 * `holder` (satisfying srs_cards_source_shape_check).
 */
async function createDueCard(learnerId, languageId, holder, canonicalForm, extra = {}) {
  const concept = await db.vocabularyConcept.create({
    data: {
      languageId,
      canonicalForm,
      normalizedForm: canonicalForm.toLowerCase(),
      senseKey: 'sense-' + randomUUID().slice(0, 8),
      meaningLabels: { vi: 'Nghĩa của ' + canonicalForm },
      createdBy: f.teacher,
    },
  });
  const link = await db.lessonVocabularyLink.create({
    data: {
      lessonRevisionId: holder.revisionId,
      vocabularyId: concept.id,
      position: holder.nextPosition++,
      isCore: true,
      displaySnapshot: {},
    },
  });
  const card = await db.srsCard.create({
    data: {
      learnerId,
      vocabularyId: concept.id,
      stage: 1,
      dueAt: new Date(Date.now() - 3600 * 1000),
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: link.id,
      ...extra,
    },
  });
  return { concept, link, card };
}

test('G11: a context session only contains cards of that context language, whatever the card source', async () => {
  const b = await createSecondLanguage();
  const ctxB = await db.learningContext.create({
    data: {
      learnerId: f.learnerA,
      languageId: b.language.id,
      courseId: b.course.id,
      status: 'ACTIVE',
    },
  });

  const pastDue = new Date(Date.now() - 3600 * 1000);
  // Card 1: language A, provenance in course A (the regular case).
  const cardA1 = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: pastDue,
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });
  // Card 2: language A word, but its provenance link sits on a lesson of course B.
  // The old course-based filter leaked it into the language-B session; the language
  // filter keeps it in the language-A session where it belongs.
  const cardA2 = await createDueCard(f.learnerA, f.lang, b.holder, 'Crossover');
  // Card 3: a genuine language-B word.
  const cardB1 = await createDueCard(f.learnerA, b.language.id, b.holder, 'Bonjour');

  const sessionA = await createReviewSession(f.learnerA, { contextId: f.ctxA, limit: 50 }, db);
  assert.equal(sessionA.progress.total, 2);

  const sessionB = await createReviewSession(f.learnerA, { contextId: ctxB.id, limit: 50 }, db);
  assert.equal(sessionB.progress.total, 1);
  assert.equal(sessionB.currentItem.cardId, cardB1.card.id);

  // The queue order is not asserted, only its composition.
  const itemsOf = async (sessionId) => {
    const session = await db.srsReviewSession.findUniqueOrThrow({ where: { id: sessionId } });
    return new Set(session.cardIds.map((entry) => (typeof entry === 'string' ? entry : entry.cardId)));
  };
  const queueA = await itemsOf(sessionA.sessionId);
  assert.ok(queueA.has(cardA1.id));
  assert.ok(queueA.has(cardA2.card.id));
  assert.ok(!queueA.has(cardB1.card.id));

  // Backward compatibility: no contextId still means the whole account.
  const sessionAll = await createReviewSession(f.learnerA, { limit: 50 }, db);
  assert.equal(sessionAll.progress.total, 3);
});

test('G11: context ownership is still enforced (403 for a foreign context, 404 for an unknown one)', async () => {
  await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: new Date(Date.now() - 3600 * 1000),
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });

  await assert.rejects(
    () => createReviewSession(f.learnerA, { contextId: f.ctxB }, db),
    (error) => error instanceof SrsServiceError && error.status === 403 && error.code === 'FORBIDDEN',
  );
  await assert.rejects(
    () => createReviewSession(f.learnerA, { contextId: randomUUID() }, db),
    (error) => error instanceof SrsServiceError && error.status === 404 && error.code === 'NOT_FOUND',
  );
  // No session row is created for a rejected context.
  assert.equal(await db.srsReviewSession.count({ where: { learnerId: f.learnerA } }), 0);
});

test('Ôn nhanh: a warm-up session is capped at 3 cards and skips words this lesson introduces', async () => {
  const holder = await createDraftLesson(f.course, 'UA2-' + randomUUID().slice(0, 6));

  // One due card on the word the current lesson (f.lesson) introduces.
  const lessonWordCard = await db.srsCard.create({
    data: {
      learnerId: f.learnerA,
      vocabularyId: f.vocabId,
      stage: 1,
      dueAt: new Date(Date.now() - 3600 * 1000),
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: f.vocabLinkId,
    },
  });
  // Four older due cards from another lesson of the same language.
  const older = [];
  for (const form of ['Older1', 'Older2', 'Older3', 'Older4']) {
    older.push(await createDueCard(f.learnerA, f.lang, holder, form));
  }

  // Without the exclusion the lesson word is part of the queue.
  const full = await createReviewSession(f.learnerA, { contextId: f.ctxA, limit: 50 }, db);
  assert.equal(full.progress.total, 5);

  const warmUp = await createReviewSession(
    f.learnerA,
    { contextId: f.ctxA, limit: 3, excludeLessonId: f.lesson },
    db,
  );
  assert.equal(warmUp.progress.total, 3);
  const row = await db.srsReviewSession.findUniqueOrThrow({ where: { id: warmUp.sessionId } });
  const queue = row.cardIds.map((entry) => (typeof entry === 'string' ? entry : entry.cardId));
  assert.equal(queue.length, 3);
  assert.ok(!queue.includes(lessonWordCard.id), 'the word introduced by this lesson must not be drilled');
  const olderIds = new Set(older.map((o) => o.card.id));
  for (const cardId of queue) assert.ok(olderIds.has(cardId));
});

test('Ôn nhanh: reviewing a warm-up card schedules it by Policy B and leaves no lesson attempt behind', async () => {
  const holder = await createDraftLesson(f.course, 'UA3-' + randomUUID().slice(0, 6));
  const { card } = await createDueCard(f.learnerA, f.lang, holder, 'Warmup1');

  const session = await createReviewSession(
    f.learnerA,
    { contextId: f.ctxA, limit: 3, excludeLessonId: f.lesson },
    db,
  );
  assert.equal(session.progress.total, 1);
  assert.equal(session.currentItem.cardId, card.id);

  await revealSessionCurrentItem(f.learnerA, session.sessionId, { cardId: card.id }, db);
  const result = await submitSessionReview(
    f.learnerA,
    session.sessionId,
    { operationKey: randomUUID(), cardId: card.id, rating: 'REMEMBERED' },
    db,
  );
  assert.equal(result.status, 'COMPLETED');

  const updated = await db.srsCard.findUniqueOrThrow({ where: { id: card.id } });
  assert.equal(updated.stage, 2);
  const operation = await db.srsReviewOperation.findFirstOrThrow({ where: { cardId: card.id } });
  assert.equal(operation.nextDueAt - operation.reviewedAt, 3 * 86400000);

  // The warm-up never touches the lesson: no attempt, so no score, XP or accuracy impact.
  assert.equal(await db.lessonAttempt.count({ where: { contextId: f.ctxA } }), 0);
});
