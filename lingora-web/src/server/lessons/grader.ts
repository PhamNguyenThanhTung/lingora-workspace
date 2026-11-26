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
 * D1 — chuẩn hóa dung thứ (sửa sau nghiệm thu vòng 3, ghi nhận G1–G4).
 * Các khác biệt sau được coi là BẰNG NHAU, không cần ghi chú:
 *  - NFKC: katakana nửa chiều rộng (`ｺｰﾋｰ` == `コーヒー`), chữ/số toàn chiều rộng == ASCII,
 *    dấu cách toàn chiều rộng U+3000 và mọi loại khoảng trắng Unicode == dấu cách thường.
 *  - Nháy đơn cong `’ ‘ ʼ ′` == nháy thẳng `'`; nháy đôi cong `“ ” „ ″` và `« »` == `"`,
 *    kèm bỏ khoảng trắng sát dấu nháy đôi (kiểu Pháp `« oui »`).
 *  - Khoảng trắng kiểu Pháp trước `? ! : ;` bị bỏ (`Comment allez-vous ?` == `Comment allez-vous?`).
 *  - Tiếng Nhật/Trung viết liền: khoảng trắng giữa hai ký tự CJK/kana bị bỏ
 *    (`わたしは　田中です。` == `わたしは田中です。`).
 *  - Mọi run khoảng trắng còn lại thu về một dấu cách, trim hai đầu.
 *  - Dấu câu cuối câu bị bỏ (. ! ? … 。！？); toLowerCase() chỉ khi caseSensitive=false.
 * KHÔNG dung thứ: hiragana vs katakana (`こーひー` ≠ `コーヒー`) là lỗi chính tả thật.
 * Dấu phụ Latin thiếu (`cafe` vs `café`) xử lý riêng ở `stripLatinDiacritics`: vẫn ĐÚNG nhưng kèm ghi chú.
 * Hàm này áp dụng y hệt cho câu trả lời của học viên và cho từng đáp án được chấp nhận.
 */
export function normalizePracticeText(text: string, caseSensitive: boolean): string {
  const cleaned = text
    .normalize('NFKC')
    // nháy đơn cong -> nháy thẳng; nháy đôi cong và « » -> nháy đôi thẳng
    .replace(/[\u2018\u2019\u201B\u02BC\u2032]/gu, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u00AB\u00BB]/gu, '"')
    // bỏ khoảng trắng sát dấu nháy đôi (kiểu Pháp « oui ») và trước dấu câu kiểu Pháp
    .replace(/\s*"\s*/gu, '"')
    .replace(/\s+([?!:;])/gu, '$1')
    .replace(/\s+/gu, ' ')
    .trim()
    // tiếng Nhật/Trung viết liền: bỏ khoảng trắng giữa hai ký tự CJK/kana
    .replace(
      /(?<=[\p{scx=Han}\p{scx=Hiragana}\p{scx=Katakana}\u3000-\u303F])\s+(?=[\p{scx=Han}\p{scx=Hiragana}\p{scx=Katakana}\u3000-\u303F])/gu,
      ''
    )
    .replace(/(?:[.!?\u2026\u3002\uFF01\uFF1F]\s*)+$/u, '')
    .trimEnd();
  return caseSensitive ? cleaned : cleaned.toLowerCase();
}

/**
 * Bỏ dấu phụ CHỈ trên chữ Latin (NFD rồi xóa mark đứng ngay sau một chữ Latin).
 * Giữ nguyên dakuten/handakuten tiếng Nhật (`が` không bị hạ thành `か`).
 * Dùng để chấp nhận câu trả lời thiếu dấu (Pháp `cafe`, Việt `pho`) nhưng kèm ghi chú.
 */
export function stripLatinDiacritics(text: string): string {
  return text
    .normalize('NFD')
    .replace(/(\p{Script=Latin})\p{M}+/gu, '$1')
    .normalize('NFC');
}

/**
 * Nguồn duy nhất để chấm câu trả lời dạng chữ (FILL_BLANK, GRAMMAR).
 * - Khớp sau chuẩn hóa -> đúng, không ghi chú.
 * - Chỉ khớp sau khi bỏ dấu phụ Latin -> vẫn đúng, kèm `accentHint` là đáp án gần nhất.
 */
function gradeTextAnswer(
  text: string,
  acceptedAnswers: string[],
  caseSensitive: boolean
): { isCorrect: boolean; formativeFeedback: string; accentHint?: string } {
  const normalizedInput = normalizePracticeText(text, caseSensitive);
  const answers = (acceptedAnswers || []).map(ans => ({
    raw: ans,
    normalized: normalizePracticeText(ans, caseSensitive),
  }));

  if (answers.some(ans => ans.normalized === normalizedInput)) {
    return { isCorrect: true, formativeFeedback: 'Chính xác!' };
  }

  const strippedInput = stripLatinDiacritics(normalizedInput);
  const nearMiss = answers.find(ans => stripLatinDiacritics(ans.normalized) === strippedInput);
  if (nearMiss) {
    return {
      isCorrect: true,
      formativeFeedback: `Đúng rồi! Chú ý dấu: ${nearMiss.raw}`,
      accentHint: nearMiss.raw,
    };
  }

  return { isCorrect: false, formativeFeedback: 'Chưa chính xác.' };
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
  /** Chỉ có khi đúng nhưng thiếu dấu phụ: đáp án chuẩn để học viên đối chiếu. */
  accentHint?: string;
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
      const graded = gradeTextAnswer(
        parsedInput.data.text,
        grading.acceptedAnswers,
        Boolean(grading.caseSensitive)
      );

      return { ...graded, validatedInput: parsedInput.data };
    }

    case 'GRAMMAR': {
      const parsedInput = grammarInputSchema.safeParse(rawInput);
      if (!parsedInput.success) {
        throw new LessonServiceError(400, 'VALIDATION_ERROR', 'Định dạng câu trả lời ngữ pháp không hợp lệ.');
      }
      const grading = gradingData as { acceptedAnswers: string[]; caseSensitive: boolean };
      const graded = gradeTextAnswer(
        parsedInput.data.text,
        grading.acceptedAnswers,
        Boolean(grading.caseSensitive)
      );

      return { ...graded, validatedInput: parsedInput.data };
    }

    default:
      throw new LessonServiceError(400, 'UNSUPPORTED_EXERCISE_TYPE', `Loại bài tập ${type} không được hỗ trợ.`);
  }
}
