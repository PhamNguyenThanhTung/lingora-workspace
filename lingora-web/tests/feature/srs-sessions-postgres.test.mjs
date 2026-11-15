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
  completeReviewSession,
  SrsServiceError,
} from '../../src/server/srs/index.ts';
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
