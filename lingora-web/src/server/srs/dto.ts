import { z } from 'zod';

export const reviewStartSchema = z.object({}).strict();
export type ReviewStartInput = z.infer<typeof reviewStartSchema>;

export const reviewRespondSchema = z.object({
  token: z.string().min(1, 'Token là bắt buộc.'),
  operationKey: z.string().uuid('Mã thao tác phải là UUID hợp lệ.'),
  rating: z.enum(['REMEMBERED', 'FORGOTTEN']),
}).strict();
export type ReviewRespondInput = z.infer<typeof reviewRespondSchema>;

export interface SrsPromptCardDto {
  canonicalForm: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  example: string | null;
  meaningLabels: Record<string, string>;
}

export interface ReviewStartResultDto {
  done: boolean;
  token: string | null;
  card: SrsPromptCardDto | null;
}

export interface ReviewRespondResultDto {
  done: boolean;
  token: string | null;
  card: SrsPromptCardDto | null;
  recordedRating: 'REMEMBERED' | 'FORGOTTEN';
}

export interface SrsEnvelope<T> {
  data: T;
}

export class SrsServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'SrsServiceError';
  }
}
