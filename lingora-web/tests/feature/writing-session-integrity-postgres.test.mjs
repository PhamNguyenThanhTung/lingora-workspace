import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../../../lingora-admin/generated/product-client/index.js';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import {
  startWritingSession,
  submitWritingAttempt,
  completeWritingSession,
} from '../../src/server/writing/session-service.ts';
import { createPracticeFixture } from './harness/practice-db-fixture.mjs';

const url = process.env.SLICE11_TEST_DATABASE_URL;
assert.ok(url, 'Run through scripts/local-test-db.mjs to provision an owned database');
assert.equal(process.env.SLICE11_TEST_DATABASE_OWNED, '1');
assert.equal(url, process.env.SLICE11_LOCAL_DATABASE_URL);
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(url).hostname));
assert.match(new URL(url).pathname, /^\/slice11_test/);

const db = new PrismaClient({ datasourceUrl: url, log: [] });
let fixture;
const candidateStrokes = [{ points: [[0.1, 0.5], [0.9, 0.5]] }];

before(async () => db.$connect());
after(async () => {
  setLearnerPrismaForTest(null);
  await db.$disconnect();
});

beforeEach(async () => {
  fixture = await createPracticeFixture(db, { writingCharacter: true });
  setLearnerPrismaForTest(db);
});

function startInput(overrides = {}) {
  return {
    contextId: fixture.ctxA,
    lessonId: fixture.lesson,
    characterId: fixture.characterId,
    blockKey: 'script-character',
    expectedPublishedRevisionId: fixture.revision,
    verifiedUserId: fixture.learnerA,
    ...overrides,
  };
}

test('PostgreSQL pins session source and authenticates before replay', async () => {
  const operationKey = randomUUID();
  const first = await startWritingSession(startInput({ operationKey }));
  assert.equal(first.glyph, '文');
  assert.equal(first.strokeCount, 1);
  assert.equal(first.isReplay, false);
  assert.equal((await db.writingSession.findUnique({ where: { id: first.sessionId } })).sourceKey, 'block:script-character');

  await db.writingCharacter.update({ where: { id: fixture.characterId }, data: { glyph: '改', strokeCount: 9 } });
  const replay = await startWritingSession(startInput({ operationKey }));
  assert.equal(replay.sessionId, first.sessionId);
  assert.equal(replay.glyph, '文');
  assert.equal(replay.strokeCount, 1);
  assert.equal(replay.isReplay, true);

  await assert.rejects(
    startWritingSession(startInput({ characterId: randomUUID(), operationKey })),
    (error) => error.status === 409 && error.error.code === 'OPERATION_CONFLICT'
  );
  await assert.rejects(
    startWritingSession(startInput({ contextId: randomUUID(), operationKey })),
    (error) => error.status === 404 && error.error.code === 'NOT_FOUND'
  );
});

test('PostgreSQL rejects completion without an attempt and completes after one is committed', async () => {
  const empty = await startWritingSession(startInput({ operationKey: randomUUID() }));
  await assert.rejects(
    completeWritingSession(empty.sessionId, fixture.learnerA),
    (error) => error.status === 409 && error.error.code === 'NO_ATTEMPTS'
  );
  assert.equal((await db.writingSession.findUnique({ where: { id: empty.sessionId } })).status, 'ACTIVE');

  const attempt = await submitWritingAttempt({
    sessionId: empty.sessionId,
    operationKey: randomUUID(),
    candidateStrokes,
    verifiedUserId: fixture.learnerA,
  });
  assert.equal(attempt.sessionId, empty.sessionId);
  const completed = await completeWritingSession(empty.sessionId, fixture.learnerA);
  assert.equal(completed.status, 'COMPLETED');
  assert.equal(await db.writingAttempt.count({ where: { sessionId: empty.sessionId } }), 1);
});

test('PostgreSQL scopes attempt idempotency to the same owned session and rolls back a losing unique race', async () => {
  const [first, second] = await Promise.all([
    startWritingSession(startInput({ operationKey: randomUUID() })),
    startWritingSession(startInput({ operationKey: randomUUID() })),
  ]);
  const operationKey = randomUUID();
  const results = await Promise.allSettled([
    submitWritingAttempt({ sessionId: first.sessionId, operationKey, candidateStrokes, verifiedUserId: fixture.learnerA }),
    submitWritingAttempt({ sessionId: second.sessionId, operationKey, candidateStrokes, verifiedUserId: fixture.learnerA }),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  const rejected = results.find((result) => result.status === 'rejected');
  assert.equal(rejected.reason.error.code, 'OPERATION_CONFLICT');
  assert.equal(await db.writingAttempt.count({ where: { learnerId: fixture.learnerA, operationKey } }), 1);

  const sessions = await db.writingSession.findMany({ where: { id: { in: [first.sessionId, second.sessionId] } } });
  assert.equal(sessions.filter((session) => session.rowVersion === 2n).length, 1);
  assert.equal(sessions.filter((session) => session.rowVersion === 1n).length, 1);
});

test('PostgreSQL attempt and completion race never completes a session with no attempt', async () => {
  const session = await startWritingSession(startInput({ operationKey: randomUUID() }));
  const [attempt, completion] = await Promise.allSettled([
    submitWritingAttempt({
      sessionId: session.sessionId,
      operationKey: randomUUID(),
      candidateStrokes,
      verifiedUserId: fixture.learnerA,
    }),
    completeWritingSession(session.sessionId, fixture.learnerA),
  ]);
  const persisted = await db.writingSession.findUnique({ where: { id: session.sessionId } });
  const attempts = await db.writingAttempt.count({ where: { sessionId: session.sessionId } });
  if (persisted.status === 'COMPLETED') assert.ok(attempts > 0);
  assert.ok(attempt.status === 'fulfilled' || attempt.reason.status === 409);
  assert.ok(completion.status === 'fulfilled' || completion.reason.status === 409);
});

test('PostgreSQL rechecks active learner status inside every writing mutation', async () => {
  const session = await startWritingSession(startInput({ operationKey: randomUUID() }));
  await db.account.update({ where: { id: fixture.learnerA }, data: { status: 'DISABLED' } });

  await assert.rejects(
    submitWritingAttempt({
      sessionId: session.sessionId,
      operationKey: randomUUID(),
      candidateStrokes,
      verifiedUserId: fixture.learnerA,
    }),
    (error) => error.status === 403 && error.error.code === 'ACCOUNT_INACTIVE'
  );
  await assert.rejects(
    completeWritingSession(session.sessionId, fixture.learnerA),
    (error) => error.status === 403 && error.error.code === 'ACCOUNT_INACTIVE'
  );
  assert.equal(await db.writingAttempt.count({ where: { sessionId: session.sessionId } }), 0);
});

test('PostgreSQL rejects attempts whose learner differs from the session owner', async () => {
  const session = await startWritingSession(startInput({ operationKey: randomUUID() }));
  await assert.rejects(
    db.writingAttempt.create({
      data: {
        sessionId: session.sessionId,
        learnerId: fixture.learnerB,
        characterId: fixture.characterId,
        operationKey: randomUUID(),
        inputFingerprint: 'test-fingerprint',
        score: 100,
        band: 'EXCELLENT',
        strokeCount: 1,
        details: {},
      },
    }),
    (error) => error.code === 'P2003'
  );
  assert.equal(await db.writingAttempt.count({ where: { sessionId: session.sessionId } }), 0);
});
