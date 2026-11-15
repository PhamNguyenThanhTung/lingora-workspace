export type SrsRating = 'REMEMBERED' | 'FORGOTTEN';
export type SrsOperationKind = 'SCHEDULE' | 'REINFORCEMENT';

export const POLICY_B_INTERVALS = [1, 3, 7, 14, 30] as const;

export interface SrsScheduleInput {
  priorStage: number;
  priorDueAt: Date;
  rating: SrsRating;
  reviewedAt: Date;
}

export interface SrsScheduleResult {
  kind: 'SCHEDULE';
  nextStage: number;
  nextDueAt: Date;
  intervalDays: number;
}

export interface SrsReinforcementInput {
  priorStage: number;
  priorDueAt: Date;
  reviewedAt: Date;
}

export interface SrsReinforcementResult {
  kind: 'REINFORCEMENT';
  nextStage: number;
  nextDueAt: Date;
  intervalDays: 0;
}

export interface SrsSchedulerContract {
  calculateNextSchedule(input: SrsScheduleInput): SrsScheduleResult;
  calculateReinforcement(input: SrsReinforcementInput): SrsReinforcementResult;
}

export class PolicyBScheduler implements SrsSchedulerContract {
  calculateNextSchedule(input: SrsScheduleInput): SrsScheduleResult {
    const { priorStage, rating, reviewedAt } = input;
    if (!Number.isInteger(priorStage) || priorStage < 1 || priorStage > 5) {
      throw new Error(`Invalid priorStage: ${priorStage}. Must be an integer between 1 and 5.`);
    }
    if (!(reviewedAt instanceof Date) || !Number.isFinite(reviewedAt.getTime())) {
      throw new Error('Invalid reviewedAt. Must be a valid Date.');
    }
    if (rating !== 'REMEMBERED' && rating !== 'FORGOTTEN') {
      throw new Error(`Invalid rating: ${rating}. Must be REMEMBERED or FORGOTTEN.`);
    }

    let nextStage: number;
    let intervalDays: number;

    if (rating === 'REMEMBERED') {
      nextStage = Math.min(priorStage + 1, 5);
      intervalDays = POLICY_B_INTERVALS[nextStage - 1];
    } else {
      nextStage = 1;
      intervalDays = 1;
    }

    const nextDueAt = new Date(reviewedAt.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    return {
      kind: 'SCHEDULE',
      nextStage,
      nextDueAt,
      intervalDays,
    };
  }

  calculateReinforcement(input: SrsReinforcementInput): SrsReinforcementResult {
    const { priorStage, priorDueAt } = input;
    if (!Number.isInteger(priorStage) || priorStage < 1 || priorStage > 5) {
      throw new Error(`Invalid priorStage: ${priorStage}. Must be an integer between 1 and 5.`);
    }
    if (!(priorDueAt instanceof Date) || !Number.isFinite(priorDueAt.getTime())) {
      throw new Error('Invalid priorDueAt. Must be a valid Date.');
    }

    return {
      kind: 'REINFORCEMENT',
      nextStage: priorStage,
      nextDueAt: new Date(priorDueAt.getTime()),
      intervalDays: 0,
    };
  }
}

export const defaultPolicyBScheduler = new PolicyBScheduler();

export function calculatePolicyBSchedule(input: SrsScheduleInput): SrsScheduleResult {
  return defaultPolicyBScheduler.calculateNextSchedule(input);
}

export function calculatePolicyBReinforcement(input: SrsReinforcementInput): SrsReinforcementResult {
  return defaultPolicyBScheduler.calculateReinforcement(input);
}
