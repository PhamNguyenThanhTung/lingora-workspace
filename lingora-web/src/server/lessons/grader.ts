import 'server-only';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { LessonServiceError } from './dto.ts';

// =============================================================================
// Canonical JSON & SHA-256 for deterministic input hashing and receipts
// =============================================================================

export function canonicalJsonStringify(val: unknown): string {
  if (val === null || typeof val !== 'object') {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    return '[' + val.map(canonicalJsonStringify).join(',') + ']';
  }
  const obj = val as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const entries: string[] = [];
  for (const k of sortedKeys) {
    if (obj[k] !== undefined) {
      entries.push(`${JSON.stringify(k)}:${canonicalJsonStringify(obj[k])}`);
    }
  }
  return '{' + entries.join(',') + '}';
}

export function computeInputHash(val: unknown): string {
  return createHash('sha256').update(canonicalJsonStringify(val)).digest('hex');
}

// =============================================================================
// D1: Approved Practice Text Normalization
// =============================================================================

/**
 * D1 — APPROVED:
 * Normalize both response and accepted answers with Unicode NFC, trim both ends,
 * then JavaScript toLowerCase() only when caseSensitive=false;
 * preserve punctuation, accents and internal whitespace;
 * exact equality against any accepted answer.
 */
export function normalizePracticeText(text: string, caseSensitive: boolean): string {
  const nfcTrimmed = text.normalize('NFC').trim();
  return caseSensitive ? nfcTrimmed : nfcTrimmed.toLowerCase();
}

// =============================================================================
// Strict Schemas for Learner Inputs
// =============================================================================

const identifierSchema = z
  .string({ message: 'Mã định danh phải là chuỗi ký tự' })
  .min(1, 'Mã định danh không được để trống')
  .max(64, 'Mã định danh tối đa 64 ký tự')
  .regex(/^[A-Za-z0-9_-]+$/, 'Mã lựa chọn không hợp lệ');

export const mcqInputSchema = z
  .object({
    optionId: identifierSchema,
  })
  .strict();

export const listeningInputSchema = z
  .object({
    optionId: identifierSchema,
  })
  .strict();

export const fillBlankInputSchema = z
  .object({
    text: z
      .string({ message: 'Câu trả lời phải là chuỗi ký tự' })
      .max(4000, 'Câu trả lời tối đa 4000 ký tự')
      .refine(s => s.trim().length > 0, 'Câu trả lời không được để trống hoặc chỉ có khoảng trắng'),
  })
  .strict();

export const grammarInputSchema = z
  .object({
    text: z
      .string({ message: 'Câu trả lời phải là chuỗi ký tự' })
      .max(4000, 'Câu trả lời tối đa 4000 ký tự')
      .refine(s => s.trim().length > 0, 'Câu trả lời không được để trống hoặc chỉ có khoảng trắng'),
  })
  .strict();

export const reorderInputSchema = z
  .object({
    tokenIds: z
      .array(identifierSchema, { message: 'tokenIds phải là danh sách mã định danh' })
      .min(2, 'Cần ít nhất 2 phần tử sắp xếp')
      .max(30, 'Tối đa 30 phần tử sắp xếp'),
  })
  .strict();

// =============================================================================
// Validation & Grading Function
// =============================================================================

export interface GradedResult {
  isCorrect: boolean;
  formativeFeedback: string;
  validatedInput: unknown;
}

export function gradePracticeExercise(
  type: string,
  promptData: unknown,
  gradingData: unknown,
  rawInput: unknown
): GradedResult {
  if (!gradingData || typeof gradingData !== 'object') {
    throw new LessonServiceError(500, 'GRADING_CONFIG_ERROR', 'Cấu hình chấm điểm bài tập bị thiếu.');
  }

  switch (type) {
    case 'MCQ': {
      const parsedInput = mcqInputSchema.safeParse(rawInput);
      if (!parsedInput.success) {
        throw new LessonServiceError(400, 'VALIDATION_ERROR', 'Định dạng câu trả lời trắc nghiệm không hợp lệ.');
      }
      const prompt = promptData as { options?: Array<{ id: string }> };
      const validOptionIds = new Set((prompt.options || []).map(o => o.id));
      if (!validOptionIds.has(parsedInput.data.optionId)) {
        throw new LessonServiceError(400, 'INVALID_OPTION', 'Lựa chọn trả lời không nằm trong danh sách bài tập.');
      }
      const grading = gradingData as { correctOptionId: string };
      const isCorrect = parsedInput.data.optionId === grading.correctOptionId;
      return {
        isCorrect,
        formativeFeedback: isCorrect ? 'Chính xác!' : 'Chưa chính xác.',
        validatedInput: parsedInput.data,
      };
    }

    case 'LISTENING': {
      const parsedInput = listeningInputSchema.safeParse(rawInput);
      if (!parsedInput.success) {
        throw new LessonServiceError(400, 'VALIDATION_ERROR', 'Định dạng câu trả lời nghe hiểu không hợp lệ.');
      }
      const prompt = promptData as { options?: Array<{ id: string }> };
      const validOptionIds = new Set((prompt.options || []).map(o => o.id));
      if (!validOptionIds.has(parsedInput.data.optionId)) {
        throw new LessonServiceError(400, 'INVALID_OPTION', 'Lựa chọn trả lời không nằm trong danh sách bài tập.');
      }
      const grading = gradingData as { correctOptionId: string };
      const isCorrect = parsedInput.data.optionId === grading.correctOptionId;
      return {
        isCorrect,
        formativeFeedback: isCorrect ? 'Chính xác!' : 'Chưa chính xác.',
        validatedInput: parsedInput.data,
      };
    }

    case 'REORDER': {
      const parsedInput = reorderInputSchema.safeParse(rawInput);
      if (!parsedInput.success) {
        throw new LessonServiceError(400, 'VALIDATION_ERROR', 'Định dạng câu trả lời sắp xếp không hợp lệ.');
      }
      const prompt = promptData as { tokens?: Array<{ id: string }> };
      const promptTokens = prompt.tokens || [];
      const submittedTokens = parsedInput.data.tokenIds;

      if (submittedTokens.length !== promptTokens.length) {
        throw new LessonServiceError(400, 'INVALID_PERMUTATION', 'Số lượng phần tử sắp xếp không khớp với bài tập.');
      }
      const promptTokenIds = new Set(promptTokens.map(t => t.id));
      const submittedTokenIds = new Set(submittedTokens);
      if (submittedTokenIds.size !== submittedTokens.length || ![...promptTokenIds].every(id => submittedTokenIds.has(id))) {
        throw new LessonServiceError(400, 'INVALID_PERMUTATION', 'Thứ tự sắp xếp phải là hoán vị chính xác của các phần tử bài tập.');
      }

      const grading = gradingData as { correctOrder: string[] };
      const isCorrect = grading.correctOrder.length === submittedTokens.length &&
        grading.correctOrder.every((id, idx) => id === submittedTokens[idx]);

      return {
        isCorrect,
        formativeFeedback: isCorrect ? 'Chính xác!' : 'Chưa chính xác.',
        validatedInput: parsedInput.data,
      };
    }

    case 'FILL_BLANK': {
      const parsedInput = fillBlankInputSchema.safeParse(rawInput);
      if (!parsedInput.success) {
        throw new LessonServiceError(400, 'VALIDATION_ERROR', 'Định dạng câu trả lời điền từ không hợp lệ.');
      }
      const grading = gradingData as { acceptedAnswers: string[]; caseSensitive: boolean };
      const caseSensitive = Boolean(grading.caseSensitive);
      const normalizedInput = normalizePracticeText(parsedInput.data.text, caseSensitive);

      const isCorrect = (grading.acceptedAnswers || []).some(ans => {
        return normalizePracticeText(ans, caseSensitive) === normalizedInput;
      });

      return {
        isCorrect,
        formativeFeedback: isCorrect ? 'Chính xác!' : 'Chưa chính xác.',
        validatedInput: parsedInput.data,
      };
    }

    case 'GRAMMAR': {
      const parsedInput = grammarInputSchema.safeParse(rawInput);
      if (!parsedInput.success) {
        throw new LessonServiceError(400, 'VALIDATION_ERROR', 'Định dạng câu trả lời ngữ pháp không hợp lệ.');
      }
      const grading = gradingData as { acceptedAnswers: string[]; caseSensitive: boolean };
      const caseSensitive = Boolean(grading.caseSensitive);
      const normalizedInput = normalizePracticeText(parsedInput.data.text, caseSensitive);

      const isCorrect = (grading.acceptedAnswers || []).some(ans => {
        return normalizePracticeText(ans, caseSensitive) === normalizedInput;
      });

      return {
        isCorrect,
        formativeFeedback: isCorrect ? 'Chính xác!' : 'Chưa chính xác.',
        validatedInput: parsedInput.data,
      };
    }

    default:
      throw new LessonServiceError(400, 'UNSUPPORTED_EXERCISE_TYPE', `Loại bài tập ${type} không được hỗ trợ.`);
  }
}
