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
  revision1Id,
} from './harness/learner-fixture.mjs';
import { finalizePracticeAttempt } from '../../src/server/lessons/practice-service.ts';
import { respondSrsReview, createSrsToken } from '../../src/server/srs/index.ts';
import {
  getLearnerStreak,
  getTotalXp,
  getDailyQuests,
  getDailyProgress,
  getGamificationOverview,
  computeQualifyingLocalDate,
  questSourceId,
} from '../../src/server/gamification/service.ts';

describe('Sprint 4: S4-02 & S4-03 Gamification, XP, and Achievements', () => {
  let state;
  let db;

  beforeEach(() => {
    process.env.LINGORA_SRS_SIGNING_SECRET = 'test-srs-hmac-secret-at-least-32-chars-long-very-secure';
    state = {
      account: account(),
      contexts: [contextRow()],
      units: [unitRow()],
      lessons: [lessonRow(), lesson2Row()],
      exercises: [exercisesRows()[0]], // single core exercise for test
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

  test('finalizePracticeAttempt: awards +30 XP for first completion, completes LESSON_1 quest (+10 XP), awards FIRST_LESSON and PERFECT_PRACTICE', async () => {
    const attemptId = randomUUID();
    state.attempts.push({
      id: attemptId,
      contextId,
      lessonId: lesson1Id,
      lessonRevisionId: revision1Id,
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
    // Add 1 correct response
    state.responses.push({
      id: randomUUID(),
      attemptId,
      lessonExerciseId: state.exercises[0].id,
      lessonRevisionId: revision1Id,
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

    const result = await finalizePracticeAttempt(
      contextId,
      lesson1Id,
      attemptId,
      { operationKey: randomUUID() },
      learnerId
    );

    assert.equal(result.attempt.isCompleted, true);
    assert.equal(result.lessonXp, 30);
    assert.equal(result.questXp, 10); // LESSON_1 daily quest completed
    assert.equal(result.streak, 1);
    assert.equal(result.firstTryAccuracy, 100);
    assert.equal(result.newlyEnrolledCount, 1);

    // Achievements: FIRST_LESSON and PERFECT_PRACTICE
    const achCodes = result.earnedAchievements.map(a => a.code);
    assert.ok(achCodes.includes('FIRST_LESSON'), 'Should earn FIRST_LESSON');
    assert.ok(achCodes.includes('PERFECT_PRACTICE'), 'Should earn PERFECT_PRACTICE');

    // Check DB state
    assert.equal(state.completions.length, 1);
    assert.equal(state.srsCards.length, 1);
    assert.equal(state.xpEvents.length, 2); // 30 XP lesson + 10 XP quest
    assert.equal(state.learnerAchievements.length, 2);

    const totalXp = await getTotalXp(db, learnerId);
    assert.equal(totalXp, 40);
  });

  test('finalizePracticeAttempt: replay with same operationKey is idempotent and returns identical rewards without double-awarding', async () => {
    const attemptId = randomUUID();
    const opKey = randomUUID();
    state.attempts.push({
      id: attemptId,
      contextId,
      lessonId: lesson1Id,
      lessonRevisionId: revision1Id,
      nCore: 1,
      kFirstWrong: 0,
      contributionUnits: 1,
      responseCount: 1,
      completionOperationKey: null,
      startedAt: new Date(),
      completedAt: null,
      rowVersion: 1n,
    });
    state.responses.push({
      id: randomUUID(),
      attemptId,
      lessonExerciseId: state.exercises[0].id,
      lessonRevisionId: revision1Id,
      responseOrdinal: 1,
      queuePosition: 1,
      operationKey: randomUUID(),
      input: { optionId: 'opt-1' },
      isCorrect: true,
      contributionUnits: 1,
      respondedAt: new Date(),
      createdAt: new Date(),
    });

    const call1 = await finalizePracticeAttempt(
      contextId,
      lesson1Id,
      attemptId,
      { operationKey: opKey },
      learnerId
    );

    const countXpBefore = state.xpEvents.length;
    const countAchBefore = state.learnerAchievements.length;

    const call2 = await finalizePracticeAttempt(
      contextId,
      lesson1Id,
      attemptId,
      { operationKey: opKey },
      learnerId
    );

    assert.deepEqual(call1.lessonXp, call2.lessonXp);
    assert.deepEqual(call1.questXp, call2.questXp);
    assert.deepEqual(call1.earnedAchievements, call2.earnedAchievements);
    assert.equal(state.xpEvents.length, countXpBefore, 'XP events must not be duplicated');
    assert.equal(state.learnerAchievements.length, countAchBefore, 'Achievements must not be duplicated');
  });

  test('finalizePracticeAttempt: redo of already completed lesson yields 0 lessonXp and does not re-award FIRST_LESSON', async () => {
    // Already completed lesson 1 previously
    state.completions.push({
      id: randomUUID(),
      contextId,
      lessonId: lesson1Id,
      firstAttemptId: randomUUID(),
      completedAt: new Date(Date.now() - 86400000),
      createdAt: new Date(Date.now() - 86400000),
    });
    state.learnerAchievements.push({
      id: randomUUID(),
      learnerId,
      achievementCode: 'FIRST_LESSON',
      sourceId: randomUUID(),
      awardedAt: new Date(Date.now() - 86400000),
      createdAt: new Date(Date.now() - 86400000),
    });

    const attemptId = randomUUID();
    state.attempts.push({
      id: attemptId,
      contextId,
      lessonId: lesson1Id,
      lessonRevisionId: revision1Id,
      nCore: 1,
      kFirstWrong: 0,
      contributionUnits: 1,
      responseCount: 1,
      completionOperationKey: null,
      startedAt: new Date(),
      completedAt: null,
      rowVersion: 1n,
    });
    state.responses.push({
      id: randomUUID(),
      attemptId,
      lessonExerciseId: state.exercises[0].id,
      lessonRevisionId: revision1Id,
      responseOrdinal: 1,
      queuePosition: 1,
      operationKey: randomUUID(),
      input: { optionId: 'opt-1' },
      isCorrect: true,
      contributionUnits: 1,
      respondedAt: new Date(),
      createdAt: new Date(),
    });

    const result = await finalizePracticeAttempt(
      contextId,
      lesson1Id,
      attemptId,
      { operationKey: randomUUID() },
      learnerId
    );

    assert.equal(result.lessonXp, 0, 'Redo of completed lesson must award 0 lesson XP');
    const achCodes = result.earnedAchievements.map(a => a.code);
    assert.ok(!achCodes.includes('FIRST_LESSON'), 'FIRST_LESSON must not be re-awarded');
  });

  test('respondSrsReview: SCHEDULE awards +1 XP, and reaches REVIEW_10 quest after 10 reviews', async () => {
    for (let i = 1; i <= 9; i++) {
      const cardId = randomUUID();
      state.srsCards.push({
        id: cardId,
        learnerId,
        vocabularyId: `vocab-${i}`,
        stage: 1,
        dueAt: new Date(Date.now() - 3600000),
        lastReviewedAt: null,
        enrollmentSource: 'CORE_COMPLETION',
        sourceAttemptId: null,
        sourceLessonVocabularyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rowVersion: 1n,
      });

      const tok = createSrsToken({
        learnerId,
        cardId,
        expectedRowVersion: '1',
        sessionKey: randomUUID(),
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const res = await respondSrsReview(
        learnerId,
        { token: tok, operationKey: randomUUID(), rating: 'REMEMBERED' },
        db
      );
      assert.equal(res.recordedRating, 'REMEMBERED');
    }

    assert.equal(state.xpEvents.filter(e => e.eventType === 'SRS_REVIEW').length, 9);
    assert.equal(state.xpEvents.filter(e => e.eventType === 'DAILY_QUEST').length, 0);

    // 10th review triggers REVIEW_10 daily quest (+10 XP)
    const card10Id = randomUUID();
    state.srsCards.push({
      id: card10Id,
      learnerId,
      vocabularyId: 'vocab-10',
      stage: 1,
      dueAt: new Date(Date.now() - 3600000),
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      sourceAttemptId: null,
      sourceLessonVocabularyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      rowVersion: 1n,
    });

    const tok10 = createSrsToken({
      learnerId,
      cardId: card10Id,
      expectedRowVersion: '1',
      sessionKey: randomUUID(),
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const res10 = await respondSrsReview(
      learnerId,
      { token: tok10, operationKey: randomUUID(), rating: 'REMEMBERED' },
      db
    );
    assert.equal(res10.recordedRating, 'REMEMBERED');

    assert.equal(state.xpEvents.filter(e => e.eventType === 'SRS_REVIEW').length, 10);
    const questEvents = state.xpEvents.filter(e => e.eventType === 'DAILY_QUEST');
    assert.equal(questEvents.length, 1);
    assert.equal(questEvents[0].xp, 10);

    const totalXp = await getTotalXp(db, learnerId);
    assert.equal(totalXp, 10 * 1 + 10); // 10 from reviews + 10 from quest = 20 XP
  });

  test('streak calculation across consecutive calendar days in local timezone', async () => {
    const tz = 'Asia/Ho_Chi_Minh';
    const now = new Date('2026-11-13T10:00:00Z');

    const dayAgo2 = new Date('2026-11-11T05:00:00Z');
    const dayAgo1 = new Date('2026-11-12T05:00:00Z');
    const today = new Date('2026-11-13T05:00:00Z');

    state.attempts.push({
      id: 'att-1',
      contextId,
      completedAt: dayAgo2,
      qualifyingLocalDate: new Date('2026-11-11T00:00:00Z'),
    });
    state.attempts.push({
      id: 'att-2',
      contextId,
      completedAt: dayAgo1,
      qualifyingLocalDate: new Date('2026-11-12T00:00:00Z'),
    });
    state.attempts.push({
      id: 'att-3',
      contextId,
      completedAt: today,
      qualifyingLocalDate: new Date('2026-11-13T00:00:00Z'),
    });

    const streak = await getLearnerStreak(db, learnerId, tz, now);
    assert.equal(streak.currentStreak, 3);
    assert.equal(streak.todayCompleted, true);
    assert.ok(streak.activeDays.includes('2026-11-13'));
    assert.ok(streak.activeDays.includes('2026-11-12'));
    assert.ok(streak.activeDays.includes('2026-11-11'));
  });

  test('H13: daily progress counts distinct lessons completed today, not attempts', async () => {
    const tz = 'Asia/Ho_Chi_Minh';
    const now = new Date('2026-11-13T12:00:00Z');
    const { localDate } = computeQualifyingLocalDate(now, tz);

    // Lesson 1 completed twice today ("Luyện tập lại" creates another attempt) and lesson 2 once.
    for (const lessonId of [lesson1Id, lesson1Id, lesson2Id]) {
      state.attempts.push({
        id: randomUUID(),
        contextId,
        lessonId,
        completedAt: now,
        qualifyingLocalDate: localDate,
      });
    }

    const progress = await getDailyProgress(db, learnerId, localDate, 10);
    assert.equal(progress.completedLessonsToday, 2);
  });

  test('gamification overview: returns quests with correct progress and claim status', async () => {
    const tz = 'Asia/Ho_Chi_Minh';
    const now = new Date('2026-11-13T12:00:00Z');
    const { localDate, localDateStr } = computeQualifyingLocalDate(now, tz);

    // Add 1 completed attempt and 5 srs review ops today
    state.attempts.push({
      id: randomUUID(),
      contextId,
      completedAt: now,
      qualifyingLocalDate: localDate,
    });
    for (let i = 0; i < 5; i++) {
      state.srsReviewOperations.push({
        id: randomUUID(),
        learnerId,
        cardId: randomUUID(),
        kind: 'SCHEDULE',
        qualifyingLocalDate: localDate,
        createdAt: now,
      });
    }

    // Add 1 lesson completion xp event and 5 srs review xp events today
    state.xpEvents.push({
      id: 'xp-1',
      learnerId,
      eventType: 'LESSON_COMPLETION',
      sourceId: 'src-1',
      xp: 30,
      localDate,
      createdAt: now,
    });
    // Add 1 daily quest event for LESSON_1
    const l1SourceId = questSourceId(learnerId, localDateStr, 'LESSON_1');
    state.xpEvents.push({
      id: 'xp-q1',
      learnerId,
      eventType: 'DAILY_QUEST',
      sourceId: l1SourceId,
      xp: 10,
      localDate,
      createdAt: now,
    });

    for (let i = 0; i < 5; i++) {
      state.xpEvents.push({
        id: `xp-srs-${i}`,
        learnerId,
        eventType: 'SRS_REVIEW',
        sourceId: `srs-src-${i}`,
        xp: 1,
        localDate,
        createdAt: now,
      });
    }

    const overview = await getGamificationOverview(db, learnerId, tz, now);
    assert.equal(overview.totalXp, 30 + 10 + 5);
    assert.equal(overview.dailyProgress.completedLessonsToday, 1);
    assert.equal(overview.dailyProgress.reviewsCompletedToday, 5);

    const lessonQuest = overview.quests.find(q => q.id === 'LESSON_1');
    assert.equal(lessonQuest?.isCompleted, true);
    assert.equal(lessonQuest?.isClaimed, true);
    assert.equal(lessonQuest?.progress, 1);

    const reviewQuest = overview.quests.find(q => q.id === 'REVIEW_10');
    assert.equal(reviewQuest?.isCompleted, false);
    assert.equal(reviewQuest?.isClaimed, false);
    assert.equal(reviewQuest?.progress, 5);
  });

  test('achievements: LESSONS_10 awarded upon 10th lesson completion', async () => {
    // Add 9 existing completions
    for (let i = 1; i <= 9; i++) {
      state.completions.push({
        id: randomUUID(),
        contextId,
        lessonId: `lesson-${i}`,
        firstAttemptId: randomUUID(),
        completedAt: new Date(Date.now() - i * 86400000),
        createdAt: new Date(Date.now() - i * 86400000),
      });
    }

    const attemptId = randomUUID();
    state.attempts.push({
      id: attemptId,
      contextId,
      lessonId: lesson1Id,
      lessonRevisionId: revision1Id,
      nCore: 1,
      kFirstWrong: 0,
      contributionUnits: 1,
      responseCount: 1,
      completionOperationKey: null,
      startedAt: new Date(),
      completedAt: null,
      rowVersion: 1n,
    });
    state.responses.push({
      id: randomUUID(),
      attemptId,
      lessonExerciseId: state.exercises[0].id,
      lessonRevisionId: revision1Id,
      responseOrdinal: 1,
      queuePosition: 1,
      operationKey: randomUUID(),
      input: { optionId: 'opt-1' },
      isCorrect: true,
      contributionUnits: 1,
      respondedAt: new Date(),
      createdAt: new Date(),
    });

    const result = await finalizePracticeAttempt(
      contextId,
      lesson1Id,
      attemptId,
      { operationKey: randomUUID() },
      learnerId
    );

    const codes = result.earnedAchievements.map(a => a.code);
    assert.ok(codes.includes('LESSONS_10'), '10th completion must award LESSONS_10');
  });

  test('achievements: STREAK_7 awarded upon reaching 7-day streak', async () => {
    const tz = 'Asia/Ho_Chi_Minh';
    // Add qualifying attempts for past 6 consecutive days
    for (let d = 6; d >= 1; d--) {
      const date = new Date(Date.now() - d * 86400000);
      const { localDate } = computeQualifyingLocalDate(date, tz);
      state.attempts.push({
        id: randomUUID(),
        contextId,
        completedAt: date,
        qualifyingLocalDate: localDate,
      });
    }

    const attemptId = randomUUID();
    state.attempts.push({
      id: attemptId,
      contextId,
      lessonId: lesson1Id,
      lessonRevisionId: revision1Id,
      nCore: 1,
      kFirstWrong: 0,
      contributionUnits: 1,
      responseCount: 1,
      completionOperationKey: null,
      startedAt: new Date(),
      completedAt: null,
      rowVersion: 1n,
    });
    state.responses.push({
      id: randomUUID(),
      attemptId,
      lessonExerciseId: state.exercises[0].id,
      lessonRevisionId: revision1Id,
      responseOrdinal: 1,
      queuePosition: 1,
      operationKey: randomUUID(),
      input: { optionId: 'opt-1' },
      isCorrect: true,
      contributionUnits: 1,
      respondedAt: new Date(),
      createdAt: new Date(),
    });

    const result = await finalizePracticeAttempt(
      contextId,
      lesson1Id,
      attemptId,
      { operationKey: randomUUID() },
      learnerId
    );

    assert.equal(result.streak, 7);
    const codes = result.earnedAchievements.map(a => a.code);
    assert.ok(codes.includes('STREAK_7'), 'Reaching streak 7 must award STREAK_7');
  });

  test('achievements: WORDS_100 awarded upon reviewing 100 distinct vocabulary cards', async () => {
    // Populate 99 distinct reviewed cards in srsReviewOperations
    for (let i = 1; i <= 99; i++) {
      const cardId = randomUUID();
      const vocabId = `vocab-distinct-${i}`;
      state.srsCards.push({
        id: cardId,
        learnerId,
        vocabularyId: vocabId,
        stage: 2,
        dueAt: new Date(),
        rowVersion: 1n,
        vocabulary: {
          canonicalForm: `word-${i}`,
          meaningLabels: { vi: `nghĩa ${i}` },
          phonetic: null,
          partOfSpeech: null,
          example: null,
        },
      });
      state.srsReviewOperations.push({
        id: randomUUID(),
        learnerId,
        cardId,
        kind: 'SCHEDULE',
        qualifyingLocalDate: new Date(),
        createdAt: new Date(),
      });
    }

    // 100th card review
    const card100Id = randomUUID();
    state.srsCards.push({
      id: card100Id,
      learnerId,
      vocabularyId: 'vocab-distinct-100',
      stage: 1,
      dueAt: new Date(Date.now() - 3600000),
      lastReviewedAt: null,
      enrollmentSource: 'CORE_COMPLETION',
      sourceAttemptId: null,
      sourceLessonVocabularyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      rowVersion: 1n,
      vocabulary: {
        canonicalForm: 'word-100',
        meaningLabels: { vi: 'nghĩa 100' },
        phonetic: null,
        partOfSpeech: null,
        example: null,
      },
    });

    const tok = createSrsToken({
      learnerId,
      cardId: card100Id,
      expectedRowVersion: '1',
      sessionKey: randomUUID(),
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const res = await respondSrsReview(
      learnerId,
      { token: tok, operationKey: randomUUID(), rating: 'REMEMBERED' },
      db
    );
    assert.equal(res.recordedRating, 'REMEMBERED');

    const words100Ach = state.learnerAchievements.find(a => a.achievementCode === 'WORDS_100');
    assert.ok(words100Ach, '100th distinct vocab review must award WORDS_100');
  });
});
