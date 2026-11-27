import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../../../lingora-admin/generated/product-client/index.js';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import {
  listFreePracticeCharacters,
  loadFreePracticeCharacter,
  startFreePracticeSession,
} from '../../src/server/writing/free-practice-service.ts';
import { submitWritingAttempt, completeWritingSession } from '../../src/server/writing/session-service.ts';
import { createPracticeFixture } from './harness/practice-db-fixture.mjs';

const url = process.env.SLICE11_TEST_DATABASE_URL;
assert.ok(url, 'Run through scripts/local-test-db.mjs to provision an owned database');
assert.equal(process.env.SLICE11_TEST_DATABASE_OWNED, '1');
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
  fixture = await createPracticeFixture(db, { writingCharacter: true, secondWritingCharacter: true });
  setLearnerPrismaForTest(db);
});

test('free practice lists characters of the path language without any lesson', async () => {
  const list = await listFreePracticeCharacters(fixture.ctxA, fixture.learnerA);
  const glyphs = list.map((c) => c.glyph).sort();
  assert.deepEqual(glyphs, ['字', '文']);
  assert.ok(list.every((c) => c.attempts === 0 && c.bestScore === null));

  // a character of another language is never listed
  await assert.rejects(listFreePracticeCharacters(randomUUID(), fixture.learnerA), (e) => e.status === 404);
});

test('free practice loads the stroke template and rejects characters from other languages', async () => {
  const detail = await loadFreePracticeCharacter(fixture.ctxA, fixture.characterId, fixture.learnerA);
  assert.equal(detail.glyph, '文');
  assert.ok(detail.strokes.length >= 1 && typeof detail.strokes[0].path === 'string');
  await assert.rejects(loadFreePracticeCharacter(fixture.ctxA, randomUUID(), fixture.learnerA), (e) => e.status === 404);
});

test('free session: start is idempotent, attempt + completion work without a lesson, stats update', async () => {
  const operationKey = randomUUID();
  const input = { contextId: fixture.ctxA, characterId: fixture.characterId, operationKey, verifiedUserId: fixture.learnerA };
  const first = await startFreePracticeSession(input);
  assert.equal(first.isReplay, false);
  assert.equal(first.lessonId, null);
  const row = await db.writingSession.findUnique({ where: { id: first.sessionId } });
  assert.equal(row.practiceKind, 'FREE');
  assert.equal(row.lessonId, null);
  assert.equal(row.lessonRevisionId, null);

  const replay = await startFreePracticeSession(input);
  assert.equal(replay.sessionId, first.sessionId);
  assert.equal(replay.isReplay, true);
  await assert.rejects(
    startFreePracticeSession({ ...input, characterId: fixture.secondCharacterId }),
    (e) => e.status === 409 && e.error.code === 'OPERATION_CONFLICT'
  );

  await assert.rejects(
    completeWritingSession(first.sessionId, fixture.learnerA),
    (e) => e.status === 409 && e.error.code === 'NO_ATTEMPTS'
  );
  const attempt = await submitWritingAttempt({
    sessionId: first.sessionId,
    operationKey: randomUUID(),
    candidateStrokes,
    verifiedUserId: fixture.learnerA,
  });
  assert.equal(attempt.sessionId, first.sessionId);
  const completed = await completeWritingSession(first.sessionId, fixture.learnerA);
  assert.equal(completed.status, 'COMPLETED');

  const list = await listFreePracticeCharacters(fixture.ctxA, fixture.learnerA);
  const stat = list.find((c) => c.characterId === fixture.characterId);
  assert.equal(stat.attempts, 1);
  assert.equal(stat.bestScore, attempt.score);
});

test('free session is private to its learner and the lesson-bound invariant is still enforced by the database', async () => {
  const session = await startFreePracticeSession({
    contextId: fixture.ctxA, characterId: fixture.characterId, operationKey: randomUUID(), verifiedUserId: fixture.learnerA,
  });
  await assert.rejects(
    submitWritingAttempt({ sessionId: session.sessionId, operationKey: randomUUID(), candidateStrokes, verifiedUserId: fixture.learnerB }),
    (e) => e.status === 404 || e.status === 403
  );
  await assert.rejects(
    db.writingSession.create({
      data: { learnerId: fixture.learnerA, contextId: fixture.ctxA, characterId: fixture.characterId, strokeVersion: 1, practiceKind: 'LESSON' },
    }),
    /writing_sessions_practice_kind_lesson_check/
  );
  await assert.rejects(
    db.writingSession.create({
      data: { learnerId: fixture.learnerA, contextId: fixture.ctxA, characterId: fixture.characterId, strokeVersion: 1, practiceKind: 'FREE', lessonId: fixture.lesson, lessonRevisionId: fixture.revision },
    }),
    /writing_sessions_practice_kind_lesson_check/
  );
});
