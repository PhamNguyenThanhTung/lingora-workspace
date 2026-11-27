import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setLearnerPrismaForTest } from '../../src/server/db/index.ts';
import {
  account,
  contextRow,
  unitRow,
  lessonRow,
  lesson2Row,
  exercisesRows,
  vocabularyRows,
  fixtureDb,
  learnerId,
  contextId,
  lesson1Id,
  lesson2Id,
} from './harness/learner-fixture.mjs';
import { loadLearnerHome, isValidTimezone, normalizeStoredTimezone } from '../../src/server/context/home-loader.ts';
import { startPracticeAttempt, finalizePracticeAttempt } from '../../src/server/lessons/practice-service.ts';
import { respondSrsReview, createSrsToken } from '../../src/server/srs/index.ts';
import {
  computeQualifyingLocalDate,
  getLearnerStreak,
  getGamificationOverview,
} from '../../src/server/gamification/service.ts';
import { SrsServiceError } from '../../src/server/srs/dto.ts';

function createMockCookieAdapter(token = 'valid-token') {
  return {
    get: (name) => {
      if (name.includes('access_token') || name.includes('auth-token')) {
        return { value: token };
      }
      return undefined;
    },
    getAll: () => [{ name: 'sb-access-token', value: token }],
    set: () => {},
  };
}

describe('Home Timezone Semantics, Midnight Boundary & Cross-System Consistency', () => {
  let state;
  let db;

  beforeEach(() => {
    process.env.LINGORA_SRS_SIGNING_SECRET = 'test-srs-hmac-secret-at-least-32-chars-long-very-secure';
    state = {
      account: account(),
      contexts: [contextRow()],
      units: [unitRow()],
      lessons: [lessonRow(), lesson2Row()],
      exercises: exercisesRows(),
      vocabulary: vocabularyRows(),
      completions: [],
      consumptions: [],
      attempts: [],
      responses: [],
      srsCards: [],
      srsReviewOperations: [],
      commandReceipts: [],
      xpEvents: [],
      learnerAchievements: [],
    };
    db = fixtureDb(state);
    setLearnerPrismaForTest(db);
  });

  describe('Timezone Validation & Normalization Helper', () => {
    test('isValidTimezone correctly distinguishes valid IANA zones from invalid strings and missing values', () => {
      assert.equal(isValidTimezone('UTC'), true);
      assert.equal(isValidTimezone('Asia/Bangkok'), true);
      assert.equal(isValidTimezone('Asia/Ho_Chi_Minh'), true);
      assert.equal(isValidTimezone('America/New_York'), true);
      assert.equal(isValidTimezone('Europe/London'), true);
      assert.equal(isValidTimezone(' UTC '), true);
      assert.equal(isValidTimezone(' Asia/Bangkok '), true);

      assert.equal(isValidTimezone('Mars/Olympus'), false);
      assert.equal(isValidTimezone('Invalid/Zone'), false);
      assert.equal(isValidTimezone('foo_bar'), false);
      assert.equal(isValidTimezone(''), false);
      assert.equal(isValidTimezone('   '), false);
      assert.equal(isValidTimezone(null), false);
      assert.equal(isValidTimezone(undefined), false);
    });

    test('Gamification rejects invalid or missing timezone without using the host timezone', () => {
      for (const timezone of [undefined, null, '', 'Invalid/Timezone']) {
        assert.throws(() => computeQualifyingLocalDate(new Date(), timezone), RangeError);
      }
    });

    test('normalizeStoredTimezone normalizes valid IANA zones and trims whitespace', () => {
      assert.deepEqual(normalizeStoredTimezone('UTC'), { ok: true, timezone: 'UTC' });
      assert.deepEqual(normalizeStoredTimezone(' UTC '), { ok: true, timezone: 'UTC' });
      assert.deepEqual(normalizeStoredTimezone('Asia/Bangkok'), { ok: true, timezone: 'Asia/Bangkok' });
      assert.deepEqual(normalizeStoredTimezone(' Asia/Bangkok '), { ok: true, timezone: 'Asia/Bangkok' });

      assert.deepEqual(normalizeStoredTimezone('Mars/Olympus'), { ok: false });
      assert.deepEqual(normalizeStoredTimezone(''), { ok: false });
      assert.deepEqual(normalizeStoredTimezone('   '), { ok: false });
      assert.deepEqual(normalizeStoredTimezone(null), { ok: false });
      assert.deepEqual(normalizeStoredTimezone(undefined), { ok: false });
    });

    test('normalizeStoredTimezone preserves caller IANA link aliases verbatim across ICU versions', () => {
      for (const alias of ['Asia/Ho_Chi_Minh', 'Asia/Saigon', 'Asia/Kolkata', 'Asia/Calcutta']) {
        assert.deepEqual(normalizeStoredTimezone(alias), { ok: true, timezone: alias });
        assert.deepEqual(normalizeStoredTimezone(`  ${alias}  `), { ok: true, timezone: alias });
        assert.equal(isValidTimezone(alias), true);
      }

      const instant = new Date('2026-11-18T17:00:00.000Z');
      assert.equal(
        computeQualifyingLocalDate(instant, 'Asia/Ho_Chi_Minh').localDateStr,
        computeQualifyingLocalDate(instant, 'Asia/Saigon').localDateStr
      );
      assert.equal(
        computeQualifyingLocalDate(instant, 'Asia/Kolkata').localDateStr,
        computeQualifyingLocalDate(instant, 'Asia/Calcutta').localDateStr
      );
    });

    test('computeQualifyingLocalDate computes exact midnight boundaries across DST transitions (America/New_York)', () => {
      // EDT (UTC-4): 2026-07-15 03:59:59Z = 23:59:59 Jul 14; 04:00:00Z = 00:00:00 Jul 15
      assert.equal(
        computeQualifyingLocalDate(new Date('2026-07-15T03:59:59.999Z'), 'America/New_York').localDateStr,
        '2026-07-14'
      );
      assert.equal(
        computeQualifyingLocalDate(new Date('2026-07-15T04:00:00.000Z'), 'America/New_York').localDateStr,
        '2026-07-15'
      );

      // Spring-forward day (2026-03-08: EST UTC-5 -> EDT UTC-4 at 02:00 local)
      assert.equal(
        computeQualifyingLocalDate(new Date('2026-03-08T04:59:59.999Z'), 'America/New_York').localDateStr,
        '2026-03-07'
      );
      assert.equal(
        computeQualifyingLocalDate(new Date('2026-03-08T05:00:00.000Z'), 'America/New_York').localDateStr,
        '2026-03-08'
      );
      // Following midnight uses EDT (UTC-4)
      assert.equal(
        computeQualifyingLocalDate(new Date('2026-03-09T03:59:59.999Z'), 'America/New_York').localDateStr,
        '2026-03-08'
      );
      assert.equal(
        computeQualifyingLocalDate(new Date('2026-03-09T04:00:00.000Z'), 'America/New_York').localDateStr,
        '2026-03-09'
      );

      // Fall-back day (2026-11-01: EDT UTC-4 -> EST UTC-5 at 02:00 local)
      assert.equal(
        computeQualifyingLocalDate(new Date('2026-11-01T03:59:59.999Z'), 'America/New_York').localDateStr,
        '2026-10-31'
      );
      assert.equal(
        computeQualifyingLocalDate(new Date('2026-11-01T04:00:00.000Z'), 'America/New_York').localDateStr,
        '2026-11-01'
      );
      // Following midnight uses EST (UTC-5)
      assert.equal(
        computeQualifyingLocalDate(new Date('2026-11-02T04:59:59.999Z'), 'America/New_York').localDateStr,
        '2026-11-01'
      );
      assert.equal(
        computeQualifyingLocalDate(new Date('2026-11-02T05:00:00.000Z'), 'America/New_York').localDateStr,
        '2026-11-02'
      );
    });
  });

  describe('MIDNIGHT TEST: Semantic divergence between UTC and Asia/Bangkok at 18:00Z', () => {
    // 2026-11-18 18:00:00Z:
    // UTC: 2026-11-18 18:00 (local date 2026-11-18)
    // Asia/Bangkok (+7): 2026-11-19 01:00 (local date 2026-11-19)
    test('Midnight boundary produces distinct local date, streak, daily progress and Home summary', async () => {
      const dbClock = new Date('2026-11-18T18:00:00.000Z');
      state.now = dbClock;

      // 1. Check computeQualifyingLocalDate directly
      const utcDate = computeQualifyingLocalDate(dbClock, 'UTC');
      const bkkDate = computeQualifyingLocalDate(dbClock, 'Asia/Bangkok');

      assert.equal(utcDate.localDateStr, '2026-11-18');
      assert.equal(bkkDate.localDateStr, '2026-11-19');
      assert.notEqual(utcDate.localDateStr, bkkDate.localDateStr);

      // Seed 2 activity attempts:
      // Activity A: Nov 18, 10:00Z (local date 2026-11-18 in both UTC and Asia/Bangkok)
      const attempt1Id = 'attempt-1111-1111-1111-111111111111';
      state.attempts.push({
        id: attempt1Id,
        contextId,
        lessonId: lesson1Id,
        lessonRevisionId: state.lessons[0].activeRevisionId,
        nCore: 5,
        kFirstWrong: 0,
        contributionUnits: 10,
        completedAt: new Date('2026-11-18T10:00:00.000Z'),
        qualifyingLocalDate: new Date('2026-11-18T00:00:00.000Z'),
      });
      state.completions.push({
        id: 'comp-1',
        contextId,
        lessonId: lesson1Id,
        firstAttemptId: attempt1Id,
        completedAt: new Date('2026-11-18T10:00:00.000Z'),
      });
      state.xpEvents.push({
        id: 'xp-1',
        learnerId,
        eventType: 'LESSON_COMPLETION',
        sourceId: 'comp-1',
        xp: 30,
        localDate: new Date('2026-11-18T00:00:00.000Z'),
        awardedAt: new Date('2026-11-18T10:00:00.000Z'),
      });

      // Activity B: Nov 18, 18:00Z
      // In UTC, this is Nov 18 (same calendar day as Activity A).
      // In Asia/Bangkok, this is Nov 19 (consecutive next calendar day).
      const attempt2Id = 'attempt-2222-2222-2222-222222222222';
      // For UTC evaluation:
      state.attempts.push({
        id: attempt2Id,
        contextId,
        lessonId: lesson2Id,
        lessonRevisionId: state.lessons[1].activeRevisionId,
        nCore: 5,
        kFirstWrong: 0,
        contributionUnits: 10,
        completedAt: new Date('2026-11-18T18:00:00.000Z'),
        qualifyingLocalDate: new Date('2026-11-18T00:00:00.000Z'), // UTC qualifying date
      });
      state.completions.push({
        id: 'comp-2',
        contextId,
        lessonId: lesson2Id,
        firstAttemptId: attempt2Id,
        completedAt: new Date('2026-11-18T18:00:00.000Z'),
      });

      // 2. Load Home as UTC learner
      state.account.timezone = 'UTC';
      const homeUtc = await loadLearnerHome(undefined, {
        prisma: db,
        authClient: {
          auth: {
            getUser: async () => ({
              data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
              error: null,
            }),
          },
        },
        cookieStore: createMockCookieAdapter(),
      });

      assert.equal(homeUtc.ok, true);
      if (!homeUtc.ok) return;

      // In UTC: today is 2026-11-18
      assert.equal(homeUtc.data.streak.today, '2026-11-18');
      assert.equal(homeUtc.data.streak.todayCompleted, true);
      // Both activities happened on 2026-11-18, so streak is 1 day
      assert.equal(homeUtc.data.streak.currentStreak, 1);
      assert.deepEqual(homeUtc.data.streak.activeDays, ['2026-11-18']);
      // Both lessons completed on today (2026-11-18)
      assert.equal(homeUtc.data.dailyProgress.completedLessonsToday, 2);

      // 3. Now evaluate as Asia/Bangkok learner
      // In Bangkok, Activity B has qualifying local date 2026-11-19
      state.attempts[1].qualifyingLocalDate = new Date('2026-11-19T00:00:00.000Z');
      state.account.timezone = 'Asia/Bangkok';

      const homeBkk = await loadLearnerHome(undefined, {
        prisma: db,
        authClient: {
          auth: {
            getUser: async () => ({
              data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
              error: null,
            }),
          },
        },
        cookieStore: createMockCookieAdapter(),
      });

      assert.equal(homeBkk.ok, true);
      if (!homeBkk.ok) return;

      // In Asia/Bangkok: today is 2026-11-19
      assert.equal(homeBkk.data.streak.today, '2026-11-19');
      assert.equal(homeBkk.data.streak.todayCompleted, true);
      // Activity A was on 2026-11-18 (yesterday) and Activity B on 2026-11-19 (today).
      // That is 2 consecutive days, so streak is 2 days!
      assert.equal(homeBkk.data.streak.currentStreak, 2);
      assert.ok(homeBkk.data.streak.activeDays.includes('2026-11-18'));
      assert.ok(homeBkk.data.streak.activeDays.includes('2026-11-19'));
      // Only Activity B completed on today (2026-11-19)
      assert.equal(homeBkk.data.dailyProgress.completedLessonsToday, 1);

      // SEMANTIC COMPARISON: Assert semantic divergence between the two timezones
      assert.notEqual(homeUtc.data.streak.today, homeBkk.data.streak.today);
      assert.notEqual(homeUtc.data.streak.currentStreak, homeBkk.data.streak.currentStreak);
      assert.notEqual(homeUtc.data.dailyProgress.completedLessonsToday, homeBkk.data.dailyProgress.completedLessonsToday);
    });
  });

  describe('CONSISTENCY TEST: Cross-system alignment (Home, Practice, SRS, Gamification)', () => {
    test('Valid timezone Asia/Bangkok yields identical qualifying local date across all 4 systems', async () => {
      const fixedTime = new Date('2026-11-18T18:00:00.000Z');
      state.now = fixedTime;
      state.account.timezone = 'Asia/Bangkok';
      state.exercises = [exercisesRows()[0]];

      // 1. Gamification service
      const gamificationDate = computeQualifyingLocalDate(fixedTime, 'Asia/Bangkok');
      assert.equal(gamificationDate.localDateStr, '2026-11-19');

      // 2. Home loader
      const homeRes = await loadLearnerHome(undefined, {
        prisma: db,
        authClient: {
          auth: {
            getUser: async () => ({
              data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
              error: null,
            }),
          },
        },
        cookieStore: createMockCookieAdapter(),
      });
      assert.equal(homeRes.ok, true);
      if (!homeRes.ok) return;
      assert.equal(homeRes.data.gamificationStatus, 'AVAILABLE');
      assert.equal(homeRes.data.streak.today, '2026-11-19');

      // 3. Practice completion
      const attemptId = randomUUID();
      state.attempts.push({
        id: attemptId,
        contextId,
        lessonId: lesson1Id,
        lessonRevisionId: state.lessons[0].activeRevisionId,
        nCore: 1,
        kFirstWrong: 0,
        contributionUnits: 1,
        responseCount: 1,
        completionOperationKey: null,
        qualifyingLocalDate: null,
        timezoneAtCompletion: null,
        startedAt: new Date(fixedTime.getTime() - 10000),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rowVersion: 1n,
      });
      state.responses.push({
        id: randomUUID(),
        attemptId,
        lessonExerciseId: state.exercises[0].id,
        lessonRevisionId: state.lessons[0].activeRevisionId,
        responseOrdinal: 1,
        queuePosition: 1,
        operationKey: randomUUID(),
        input: { optionId: 'opt-1' },
        inputHash: 'hash-1',
        isCorrect: true,
        contributionUnits: 1,
        respondedAt: fixedTime,
        createdAt: fixedTime,
      });
      const finResult = await finalizePracticeAttempt(
        contextId,
        lesson1Id,
        attemptId,
        { operationKey: randomUUID() },
        learnerId
      );
      assert.equal(finResult.attempt.isCompleted, true);
      const savedAttempt = state.attempts.find((a) => a.id === attemptId);
      assert.equal(savedAttempt.timezoneAtCompletion, 'Asia/Bangkok');
      assert.equal(savedAttempt.qualifyingLocalDate.toISOString().slice(0, 10), '2026-11-19');

      // 4. SRS review
      const cardId = randomUUID();
      state.srsCards.push({
        id: cardId,
        learnerId,
        vocabularyId: state.vocabulary[0].id,
        stage: 1,
        intervalDays: 1,
        dueAt: new Date(fixedTime.getTime() - 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
        rowVersion: 1n,
        enrollmentSource: 'CORE_LESSON',
      });
      const tok = createSrsToken({
        learnerId,
        cardId,
        expectedRowVersion: '1',
        sessionKey: randomUUID(),
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      const srsRes = await respondSrsReview(
        learnerId,
        { token: tok, operationKey: randomUUID(), rating: 'REMEMBERED' },
        db
      );
      assert.equal(srsRes.recordedRating, 'REMEMBERED');
      const op = state.srsReviewOperations[state.srsReviewOperations.length - 1];
      assert.equal(op.qualifyingLocalDate.toISOString().slice(0, 10), '2026-11-19');

      // VERIFY ALL 4 AGREE:
      assert.equal(gamificationDate.localDateStr, '2026-11-19');
      assert.equal(homeRes.data.streak.today, '2026-11-19');
      assert.equal(savedAttempt.qualifyingLocalDate.toISOString().slice(0, 10), '2026-11-19');
      assert.equal(op.qualifyingLocalDate.toISOString().slice(0, 10), '2026-11-19');
    });

    test('Whitespace timezone " Asia/Bangkok " is correctly normalized and aligned across all systems', async () => {
      const fixedTime = new Date('2026-11-18T18:00:00.000Z');
      state.now = fixedTime;
      state.account.timezone = ' Asia/Bangkok ';
      state.exercises = [exercisesRows()[0]];

      // 1. Gamification service normalizes whitespace timezone
      const gamificationDate = computeQualifyingLocalDate(fixedTime, ' Asia/Bangkok ');
      assert.equal(gamificationDate.localDateStr, '2026-11-19');

      // 2. Home loader
      const homeRes = await loadLearnerHome(undefined, {
        prisma: db,
        authClient: {
          auth: {
            getUser: async () => ({
              data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
              error: null,
            }),
          },
        },
        cookieStore: createMockCookieAdapter(),
      });
      assert.equal(homeRes.ok, true);
      if (!homeRes.ok) return;
      assert.equal(homeRes.data.gamificationStatus, 'AVAILABLE');
      assert.equal(homeRes.data.streak.today, '2026-11-19');

      // 3. Practice start & finalize with whitespace timezone
      const attemptId = randomUUID();
      const startRes = await startPracticeAttempt(
        contextId,
        lesson1Id,
        { attemptId, expectedPublishedRevisionId: state.lessons[0].activeRevisionId },
        learnerId
      );
      assert.equal(startRes.id, attemptId);

      state.responses.push({
        id: randomUUID(),
        attemptId,
        lessonExerciseId: state.exercises[0].id,
        lessonRevisionId: state.lessons[0].activeRevisionId,
        responseOrdinal: 1,
        queuePosition: 1,
        operationKey: randomUUID(),
        input: { optionId: 'opt-1' },
        inputHash: 'hash-1',
        isCorrect: true,
        contributionUnits: 1,
        respondedAt: fixedTime,
        createdAt: fixedTime,
      });

      const finResult = await finalizePracticeAttempt(
        contextId,
        lesson1Id,
        attemptId,
        { operationKey: randomUUID() },
        learnerId
      );
      assert.equal(finResult.attempt.isCompleted, true);
      const savedAttempt = state.attempts.find((a) => a.id === attemptId);
      assert.equal(savedAttempt.timezoneAtCompletion, 'Asia/Bangkok');
      assert.equal(savedAttempt.qualifyingLocalDate.toISOString().slice(0, 10), '2026-11-19');
    });

    test('Invalid timezone is rejected with typed INVALID_TIMEZONE (400) by all systems; Home does not invent UTC', async () => {
      const badTz = 'Invalid/NonExistent_Zone';
      state.account.timezone = badTz;
      state.exercises = [exercisesRows()[0]];

      // 1. Gamification service throws on invalid timezone
      assert.throws(
        () => computeQualifyingLocalDate(new Date(), badTz),
        (err) => err instanceof RangeError || err.message.includes('Invalid')
      );

      // 2. SRS review fails with typed 400 INVALID_TIMEZONE
      const cardId = randomUUID();
      state.srsCards.push({
        id: cardId,
        learnerId,
        vocabularyId: state.vocabulary[0].id,
        stage: 1,
        intervalDays: 1,
        dueAt: new Date(Date.now() - 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
        rowVersion: 1n,
        enrollmentSource: 'CORE_LESSON',
      });
      const tok = createSrsToken({
        learnerId,
        cardId,
        expectedRowVersion: '1',
        sessionKey: randomUUID(),
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      await assert.rejects(
        () => respondSrsReview(learnerId, { token: tok, operationKey: randomUUID(), rating: 'REMEMBERED' }, db),
        (err) => err instanceof SrsServiceError && err.status === 400 && err.code === 'INVALID_TIMEZONE'
      );

      // 3. Practice start fails before practice on invalid timezone with typed 400 INVALID_TIMEZONE
      await assert.rejects(
        () => startPracticeAttempt(
          contextId,
          lesson1Id,
          { attemptId: randomUUID(), expectedPublishedRevisionId: state.lessons[0].activeRevisionId },
          learnerId
        ),
        (err) => err?.status === 400 && err?.error?.code === 'INVALID_TIMEZONE'
      );

      // 4. Practice completion fails on invalid timezone with typed 400 INVALID_TIMEZONE
      const attemptId = randomUUID();
      state.attempts.push({
        id: attemptId,
        contextId,
        lessonId: lesson1Id,
        lessonRevisionId: state.lessons[0].activeRevisionId,
        nCore: 1,
        kFirstWrong: 0,
        contributionUnits: 1,
        responseCount: 1,
        completionOperationKey: null,
        qualifyingLocalDate: null,
        timezoneAtCompletion: null,
        startedAt: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rowVersion: 1n,
      });
      state.responses.push({
        id: randomUUID(),
        attemptId,
        lessonExerciseId: state.exercises[0].id,
        lessonRevisionId: state.lessons[0].activeRevisionId,
        responseOrdinal: 1,
        queuePosition: 1,
        operationKey: randomUUID(),
        input: { optionId: 'opt-1' },
        inputHash: 'hash-1',
        isCorrect: true,
        contributionUnits: 1,
        respondedAt: new Date(),
        createdAt: new Date(),
      });
      await assert.rejects(
        () => finalizePracticeAttempt(contextId, lesson1Id, attemptId, { operationKey: randomUUID() }, learnerId),
        (err) => err?.status === 400 && err?.error?.code === 'INVALID_TIMEZONE'
      );

      // 5. Home loader: Does NOT accept the bad timezone as UTC!
      // Marks gamificationStatus = 'UNAVAILABLE' and leaves streak.today = ''
      // while keeping the learning path accessible.
      const homeRes = await loadLearnerHome(undefined, {
        prisma: db,
        authClient: {
          auth: {
            getUser: async () => ({
              data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
              error: null,
            }),
          },
        },
        cookieStore: createMockCookieAdapter(),
      });
      assert.equal(homeRes.ok, true);
      if (!homeRes.ok) return;
      assert.equal(homeRes.data.gamificationStatus, 'UNAVAILABLE');
      assert.equal(homeRes.data.streak.today, ''); // NOT secretly defaulted to UTC today!
      assert.equal(homeRes.data.quests.length, 0); // NOT calculated with fake UTC!
      assert.ok(homeRes.data.gamificationMessage?.includes('Múi giờ tài khoản không hợp lệ'));
      assert.ok(homeRes.data.path.length > 0); // Path is still open for learner!
    });
  });

  describe('Missing Account & Error Mapping Contracts', () => {
    test('Missing account in DB returns 403 FORBIDDEN and is not treated as timezone error', async () => {
      const customDb = {
        ...db,
        account: {
          findUnique: async () => null,
        },
      };
      const res = await loadLearnerHome(undefined, {
        prisma: customDb,
        authClient: {
          auth: {
            getUser: async () => ({
              data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
              error: null,
            }),
          },
        },
        cookieStore: createMockCookieAdapter(),
      });

      assert.equal(res.ok, false);
      if (res.ok) return;
      assert.equal(res.status, 403);
      assert.equal(res.error.code, 'FORBIDDEN');
      assert.equal(res.error.message, 'Tài khoản chưa được khởi tạo phân hệ học viên.');
    });

    test('Inactive account in DB returns 403 ACCOUNT_INACTIVE', async () => {
      state.account.status = 'DISABLED';
      const res = await loadLearnerHome(undefined, {
        prisma: db,
        authClient: {
          auth: {
            getUser: async () => ({
              data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
              error: null,
            }),
          },
        },
        cookieStore: createMockCookieAdapter(),
      });

      assert.equal(res.ok, false);
      if (res.ok) return;
      assert.equal(res.status, 403);
      assert.equal(res.error.code, 'ACCOUNT_INACTIVE');
    });

    test('Context not found returns 404 NOT_FOUND', async () => {
      const unownedContextId = '00000000-0000-4000-8000-000000000000';
      const res = await loadLearnerHome(undefined, {
        contextId: unownedContextId,
        prisma: db,
        authClient: {
          auth: {
            getUser: async () => ({
              data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
              error: null,
            }),
          },
        },
        cookieStore: createMockCookieAdapter(),
      });

      assert.equal(res.ok, false);
      if (res.ok) return;
      assert.equal(res.status, 404);
      assert.equal(res.error.code, 'NOT_FOUND');
    });

    test('Malformed contextId returns 400 VALIDATION_ERROR', async () => {
      const res = await loadLearnerHome(undefined, {
        contextId: 'not-a-valid-uuid',
        prisma: db,
        authClient: {
          auth: {
            getUser: async () => ({
              data: { user: { id: learnerId, email: 'learner@example.com', email_confirmed_at: '2026-10-31T00:00:00Z' } },
              error: null,
            }),
          },
        },
        cookieStore: createMockCookieAdapter(),
      });

      assert.equal(res.ok, false);
      if (res.ok) return;
      assert.equal(res.status, 400);
      assert.equal(res.error.code, 'VALIDATION_ERROR');
    });
  });
});
