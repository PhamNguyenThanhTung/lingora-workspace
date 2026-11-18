import { createEmptyCard, dateDiffInDays, fsrs, Rating, type Card } from 'ts-fsrs';

export const WRITING_SRS_SCHEDULER_VERSION = 'FSRS_6_TS_FSRS_5_4_2';
const DAY_MS = 24 * 60 * 60 * 1000;

const scheduler = fsrs({
  request_retention: 0.9,
  enable_fuzz: false,
  enable_short_term: false,
  learning_steps: [],
  relearning_steps: [],
});

const ratings = {
  AGAIN: Rating.Again,
  HARD: Rating.Hard,
  GOOD: Rating.Good,
  EASY: Rating.Easy,
} as const;

export interface WritingSrsState {
  state: number;
  stability: number | null;
  difficulty: number | null;
  dueAt: Date;
  lastReviewedAt: Date | null;
  count: number;
  lapse: number;
  scheduledDays: number;
  learningSteps: number;
}

export interface WritingSrsReviewResult extends WritingSrsState {
  schedulerVersion: typeof WRITING_SRS_SCHEDULER_VERSION;
  priorState: number;
  reviewLog: Record<string, unknown>;
}

export function createInitialWritingSrsState(now: Date): WritingSrsState {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new Error('Invalid WRITING enrollment time.');
  }
  const card = createEmptyCard(now);
  return {
    state: card.state + 1,
    stability: null,
    difficulty: null,
    dueAt: new Date(now.getTime() + DAY_MS),
    lastReviewedAt: null,
    count: 0,
    lapse: 0,
    scheduledDays: 0,
    learningSteps: 0,
  };
}

export function scheduleWritingSrsReview(
  state: WritingSrsState,
  rating: string,
  reviewedAt: Date,
): WritingSrsReviewResult {
  if (!Number.isInteger(state.state) || state.state < 1 || state.state > 4) {
    throw new Error('Invalid WRITING FSRS state.');
  }
  if (!Object.hasOwn(ratings, rating)) {
    throw new Error('Invalid WRITING FSRS rating.');
  }
  if (!(reviewedAt instanceof Date) || !Number.isFinite(reviewedAt.getTime())) {
    throw new Error('Invalid WRITING FSRS review time.');
  }

  const card: Card = {
    due: state.dueAt,
    stability: state.stability ?? 0,
    difficulty: state.difficulty ?? 0,
    elapsed_days: state.lastReviewedAt ? dateDiffInDays(state.lastReviewedAt, reviewedAt) : 0,
    scheduled_days: state.scheduledDays,
    learning_steps: state.learningSteps,
    reps: state.count,
    lapses: state.lapse,
    state: state.state - 1 as Card['state'],
    last_review: state.lastReviewedAt ?? undefined,
  };
  const result = scheduler.next(card, reviewedAt, ratings[rating as keyof typeof ratings]);
  return {
    schedulerVersion: WRITING_SRS_SCHEDULER_VERSION,
    priorState: card.state,
    state: result.card.state + 1,
    stability: result.card.stability,
    difficulty: result.card.difficulty,
    dueAt: result.card.due,
    lastReviewedAt: result.card.last_review ?? reviewedAt,
    count: result.card.reps,
    lapse: result.card.lapses,
    scheduledDays: result.card.scheduled_days,
    learningSteps: result.card.learning_steps,
    reviewLog: JSON.parse(JSON.stringify(result.log)) as Record<string, unknown>,
  };
}
