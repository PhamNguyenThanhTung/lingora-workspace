import { z } from 'zod';
import { createHash } from 'node:crypto';

import { isValidUuid } from '../frameworks/index.ts';
export { isValidUuid };

export const MAX_COLLECTION_SIZE = 100;
export const MAX_POSITION = 2147483647;

export type ExerciseType = 'MCQ' | 'FILL_BLANK' | 'REORDER' | 'LISTENING' | 'GRAMMAR';

// =============================================================================
// Deterministic Canonical JSON & SHA-256 Fingerprint
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

export function computeExerciseFingerprint(payload: {
  type: string;
  schemaVersion: number;
  promptData: unknown;
  gradingData: unknown;
  feedbackData?: unknown;
}): string {
  const canonical = canonicalJsonStringify({
    type: payload.type,
    schemaVersion: payload.schemaVersion,
    promptData: payload.promptData,
    gradingData: payload.gradingData,
    ...(payload.feedbackData !== undefined && payload.feedbackData !== null ? { feedbackData: payload.feedbackData } : {}),
  });
  return createHash('sha256').update(canonical).digest('hex');
}

// =============================================================================
// Vocabulary Normalization
// =============================================================================

export function normalizeVocabularyTerm(canonicalForm: string): string {
  return canonicalForm
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

// =============================================================================
// Audio Reference URL Validator
// =============================================================================

export function isValidAudioReferenceUrl(rawUrl: string): boolean {
  if (typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.username !== '' || parsed.password !== '') return false;
    if (parsed.search !== '' || parsed.searchParams.size > 0) return false;
    if (parsed.hash !== '') return false;
    if (parsed.port !== '' && parsed.port !== '443') return false;

    const hostname = parsed.hostname.toLowerCase();
    // No IP literals (IPv4 or IPv6)
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false;
    if (hostname.includes(':') || hostname.startsWith('[') || hostname.endsWith(']')) return false;

    // Must have a dot
    if (!hostname.includes('.')) return false;

    // Reject localhost / local / internal
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false;
    }

    // Valid DNS label check
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// Exercise Types & Schemas
// =============================================================================

const identifierSchema = z
  .string({ message: 'Mã định danh phải là chuỗi ký tự' })
  .trim()
  .min(1, 'Mã định danh không được để trống')
  .max(64, 'Mã định danh tối đa 64 ký tự')
  .regex(/^[A-Za-z0-9_-]+$/, 'Mã định danh chỉ gồm chữ cái, chữ số, gạch nối hoặc gạch dưới');

const text500Schema = z
  .string({ message: 'Nội dung phải là chuỗi ký tự' })
  .trim()
  .min(1, 'Nội dung không được để trống')
  .max(500, 'Nội dung tối đa 500 ký tự');

const text4000Schema = z
  .string({ message: 'Văn bản phải là chuỗi ký tự' })
  .trim()
  .min(1, 'Văn bản không được để trống')
  .max(4000, 'Văn bản tối đa 4000 ký tự');

const optionalExplanationSchema = z
  .string({ message: 'Giải thích phải là chuỗi ký tự' })
  .trim()
  .max(4000, 'Giải thích tối đa 4000 ký tự')
  .optional()
  .nullable();

const feedbackDataSchema = z
  .object({
    explanation: optionalExplanationSchema,
  })
  .strict()
  .optional()
  .nullable();

// 1. MCQ Schema
export const mcqPromptDataSchema = z
  .object({
    prompt: text4000Schema,
    options: z
      .array(
        z
          .object({
            id: identifierSchema,
            text: text500Schema,
          })
          .strict()
      )
      .min(2, 'Bài tập trắc nghiệm yêu cầu ít nhất 2 lựa chọn')
      .max(10, 'Bài tập trắc nghiệm tối đa 10 lựa chọn')
      .refine(
        (options) => {
          const ids = new Set(options.map((o) => o.id));
          return ids.size === options.length;
        },
        { message: 'Các lựa chọn trắc nghiệm không được trùng mã định danh (id)' }
      ),
  })
  .strict();

export const mcqGradingDataSchema = z
  .object({
    correctOptionId: identifierSchema,
  })
  .strict();

// 2. FILL_BLANK Schema
export const fillBlankPromptDataSchema = z
  .object({
    prompt: text4000Schema,
    sentence: text4000Schema.refine(
      (s) => s.split('____').length === 2,
      { message: 'Câu điền từ phải chứa chính xác một vị trí chỗ trống dạng "____"' }
    ),
  })
  .strict();

export const fillBlankGradingDataSchema = z
  .object({
    acceptedAnswers: z
      .array(
        z
          .string({ message: 'Đáp án chấp nhận phải là chuỗi ký tự' })
          .trim()
          .min(1, 'Đáp án chấp nhận không được để trống')
          .max(1000, 'Mỗi đáp án tối đa 1000 ký tự')
          .refine(value => !/[\r\n]/.test(value), 'Mỗi đáp án phải nằm trên một dòng')
      )
      .min(1, 'Yêu cầu ít nhất 1 đáp án được chấp nhận')
      .max(20, 'Tối đa 20 đáp án được chấp nhận')
      .refine(
        (answers) => {
          const trimmedLower = new Set(answers.map((a) => a.trim()));
          return trimmedLower.size === answers.length;
        },
        { message: 'Các đáp án được chấp nhận không được trùng lặp' }
      ),
    caseSensitive: z.boolean({ message: 'caseSensitive phải là boolean' }),
  })
  .strict();

// 3. REORDER Schema
export const reorderPromptDataSchema = z
  .object({
    prompt: text4000Schema,
    tokens: z
      .array(
        z
          .object({
            id: identifierSchema,
            text: text500Schema,
          })
          .strict()
      )
      .min(2, 'Bài tập sắp xếp yêu cầu ít nhất 2 từ/cụm từ (token)')
      .max(30, 'Bài tập sắp xếp tối đa 30 từ/cụm từ (token)')
      .refine(
        (tokens) => {
          const ids = new Set(tokens.map((t) => t.id));
          return ids.size === tokens.length;
        },
        { message: 'Các từ/cụm từ không được trùng mã định danh (id)' }
      ),
  })
  .strict();

export const reorderGradingDataSchema = z
  .object({
    correctOrder: z
      .array(identifierSchema)
      .min(2, 'correctOrder yêu cầu ít nhất 2 mã định danh')
      .max(30, 'correctOrder tối đa 30 mã định danh'),
  })
  .strict();

// 4. LISTENING Schema
export const listeningPromptDataSchema = z
  .object({
    prompt: text4000Schema,
    audioUrl: z
      .string({ message: 'Đường dẫn âm thanh phải là chuỗi ký tự' })
      .trim()
      .max(2048, 'Đường dẫn âm thanh tối đa 2048 ký tự')
      .refine(
        isValidAudioReferenceUrl,
        { message: 'Đường dẫn âm thanh phải là URL HTTPS hợp lệ với tên miền công khai (không chấp nhận query, fragment, cổng tùy chỉnh, IP hoặc localhost)' }
      ).transform(value => new URL(value).href),
    options: z
      .array(
        z
          .object({
            id: identifierSchema,
            text: text500Schema,
          })
          .strict()
      )
      .min(2, 'Bài tập nghe hiểu yêu cầu ít nhất 2 lựa chọn')
      .max(10, 'Bài tập nghe hiểu tối đa 10 lựa chọn')
      .refine(
        (options) => {
          const ids = new Set(options.map((o) => o.id));
          return ids.size === options.length;
        },
        { message: 'Các lựa chọn nghe hiểu không được trùng mã định danh (id)' }
      ),
  })
  .strict();

export const listeningGradingDataSchema = z
  .object({
    correctOptionId: identifierSchema,
    transcript: z
      .string({ message: 'Lời thoại phải là chuỗi ký tự' })
      .trim()
      .max(4000, 'Lời thoại tối đa 4000 ký tự')
      .optional()
      .nullable(),
  })
  .strict();

// 5. GRAMMAR Schema
export const grammarPromptDataSchema = z
  .object({
    prompt: text4000Schema,
    sourceSentence: text4000Schema,
    targetPattern: text4000Schema,
  })
  .strict();

export const grammarGradingDataSchema = z
  .object({
    acceptedAnswers: z
      .array(
        z
          .string({ message: 'Đáp án chấp nhận phải là chuỗi ký tự' })
          .trim()
          .min(1, 'Đáp án chấp nhận không được để trống')
          .max(1000, 'Mỗi đáp án tối đa 1000 ký tự')
          .refine(value => !/[\r\n]/.test(value), 'Mỗi đáp án phải nằm trên một dòng')
      )
      .min(1, 'Yêu cầu ít nhất 1 đáp án được chấp nhận')
      .max(20, 'Tối đa 20 đáp án được chấp nhận')
      .refine(
        (answers) => {
          const trimmedSet = new Set(answers.map((a) => a.trim()));
          return trimmedSet.size === answers.length;
        },
        { message: 'Các đáp án được chấp nhận không được trùng lặp' }
      ),
    caseSensitive: z.boolean({ message: 'caseSensitive phải là boolean' }),
  })
  .strict();

// Exercise Item Input Schema
export const exerciseInputBaseSchema = z.object({
  sourceExerciseId: z.string().trim().refine(isValidUuid, 'sourceExerciseId phải là UUID hợp lệ').optional().nullable(),
  position: z
    .number({ message: 'Thứ tự vị trí phải là số nguyên' })
    .int('Thứ tự vị trí phải là số nguyên')
    .min(1, 'Thứ tự vị trí phải lớn hơn 0')
    .max(MAX_POSITION, 'Thứ tự vị trí vượt quá giới hạn'),
  isCore: z.boolean({ message: 'isCore phải là boolean' }).optional().default(true),
  feedbackData: feedbackDataSchema,
});

export const exerciseInputSchema = z.discriminatedUnion('type', [
  exerciseInputBaseSchema.extend({
    type: z.literal('MCQ'),
    promptData: mcqPromptDataSchema,
    gradingData: mcqGradingDataSchema,
  }).strict().superRefine((data, ctx) => {
    const validIds = new Set(data.promptData.options.map(o => o.id));
    if (!validIds.has(data.gradingData.correctOptionId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Đáp án đúng (correctOptionId) phải là một trong các lựa chọn được khai báo',
        path: ['gradingData', 'correctOptionId'],
      });
    }
  }),
  exerciseInputBaseSchema.extend({
    type: z.literal('FILL_BLANK'),
    promptData: fillBlankPromptDataSchema,
    gradingData: fillBlankGradingDataSchema,
  }).strict(),
  exerciseInputBaseSchema.extend({
    type: z.literal('REORDER'),
    promptData: reorderPromptDataSchema,
    gradingData: reorderGradingDataSchema,
  }).strict().superRefine((data, ctx) => {
    const tokenIds = data.promptData.tokens.map(t => t.id);
    const orderIds = data.gradingData.correctOrder;
    if (tokenIds.length !== orderIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'correctOrder phải có số lượng phần tử bằng chính xác số lượng token',
        path: ['gradingData', 'correctOrder'],
      });
      return;
    }
    const tokenSet = new Set(tokenIds);
    const orderSet = new Set(orderIds);
    if (tokenSet.size !== orderSet.size || ![...tokenSet].every(id => orderSet.has(id))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'correctOrder phải là hoán vị chính xác của các mã token (mỗi token xuất hiện đúng 1 lần)',
        path: ['gradingData', 'correctOrder'],
      });
    }
  }),
  exerciseInputBaseSchema.extend({
    type: z.literal('LISTENING'),
    promptData: listeningPromptDataSchema,
    gradingData: listeningGradingDataSchema,
  }).strict().superRefine((data, ctx) => {
    const validIds = new Set(data.promptData.options.map(o => o.id));
    if (!validIds.has(data.gradingData.correctOptionId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Đáp án đúng (correctOptionId) phải là một trong các lựa chọn được khai báo',
        path: ['gradingData', 'correctOptionId'],
      });
    }
  }),
  exerciseInputBaseSchema.extend({
    type: z.literal('GRAMMAR'),
    promptData: grammarPromptDataSchema,
    gradingData: grammarGradingDataSchema,
  }).strict(),
]);

export type ExerciseInput = z.infer<typeof exerciseInputSchema>;

// =============================================================================
// Vocabulary Schemas
// =============================================================================

export const vocabularyCreateSchema = z
  .object({
    canonicalForm: z
      .string({ message: 'Từ vựng (canonicalForm) phải là chuỗi ký tự' })
      .trim()
      .min(1, 'Từ vựng không được để trống')
      .max(300, 'Từ vựng tối đa 300 ký tự'),
    senseKey: z
      .string({ message: 'senseKey phải là chuỗi ký tự' })
      .trim()
      .min(1, 'senseKey không được để trống')
      .max(100, 'senseKey tối đa 100 ký tự')
      .default('default'),
    meaningLabels: z
      .object({
        vi: z.string({ message: 'Nghĩa tiếng Việt phải là chuỗi' }).trim().max(2000, 'Nghĩa tiếng Việt tối đa 2000 ký tự').optional(),
        en: z.string({ message: 'Nghĩa tiếng Anh phải là chuỗi' }).trim().max(2000, 'Nghĩa tiếng Anh tối đa 2000 ký tự').optional(),
      })
      .strict()
      .refine(
        (labels) => Boolean((labels.vi && labels.vi.trim().length > 0) || (labels.en && labels.en.trim().length > 0)),
        { message: 'Ít nhất một nghĩa (tiếng Việt hoặc tiếng Anh) phải có nội dung' }
      ),
    phonetic: z
      .string({ message: 'Phiên âm (phonetic) phải là chuỗi ký tự' })
      .trim()
      .max(300, 'Phiên âm tối đa 300 ký tự')
      .optional()
      .nullable(),
    partOfSpeech: z
      .string({ message: 'Từ loại (partOfSpeech) phải là chuỗi ký tự' })
      .trim()
      .max(100, 'Từ loại tối đa 100 ký tự')
      .optional()
      .nullable(),
    example: z
      .string({ message: 'Ví dụ phải là chuỗi ký tự' })
      .trim()
      .max(4000, 'Ví dụ tối đa 4000 ký tự')
      .optional()
      .nullable(),
  })
  .strict();

export const vocabularyInputSchema = z
  .object({
    sourceLinkId: z.string().trim().refine(isValidUuid, 'sourceLinkId phải là UUID hợp lệ').optional(),
    vocabularyId: z.string().trim().refine(isValidUuid, 'vocabularyId phải là UUID hợp lệ').optional(),
    create: vocabularyCreateSchema.optional(),
    position: z
      .number({ message: 'Thứ tự vị trí phải là số nguyên' })
      .int('Thứ tự vị trí phải là số nguyên')
      .min(1, 'Thứ tự vị trí phải lớn hơn 0')
      .max(MAX_POSITION, 'Thứ tự vị trí vượt quá giới hạn'),
    isCore: z.boolean({ message: 'isCore phải là boolean' }).optional().default(true),
  })
  .strict()
  .superRefine((data, ctx) => {
    const selectors = [
      data.sourceLinkId !== undefined,
      data.vocabularyId !== undefined,
      data.create !== undefined,
    ].filter(Boolean);

    if (selectors.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mỗi mục từ vựng phải chọn chính xác một phương thức: giữ lại liên kết cũ (sourceLinkId), liên kết từ vựng có sẵn (vocabularyId), hoặc tạo/tái sử dụng từ vựng (create)',
        path: [],
      });
    }
  });

export type VocabularyInput = z.infer<typeof vocabularyInputSchema>;

// =============================================================================
// Extended Save Teacher Draft Schema
// =============================================================================

const lessonVersionSchema = z.string({ message: 'expectedRowVersion là bắt buộc' }).refine(
  value => /^[1-9]\d{0,18}$/.test(value) && BigInt(value) <= 9223372036854775807n,
  'expectedRowVersion phải là chuỗi số nguyên dương int64 chuẩn'
);

export const saveTeacherDraftExtendedSchema = z
  .object({
    title: z
      .object({
        vi: z.string({ message: 'Tiêu đề tiếng Việt phải là chuỗi ký tự' }).trim().max(300, 'Tiêu đề tiếng Việt tối đa 300 ký tự').optional(),
        en: z.string({ message: 'Tiêu đề tiếng Anh phải là chuỗi ký tự' }).trim().max(300, 'Tiêu đề tiếng Anh tối đa 300 ký tự').optional(),
      })
      .strict()
      .refine(
        (t) => Boolean((t.vi && t.vi.trim().length > 0) || (t.en && t.en.trim().length > 0)),
        { message: 'Ít nhất một ngôn ngữ (tiếng Việt hoặc tiếng Anh) phải có tiêu đề.' }
      ),
    contentBlocks: z
      .array(
        z
          .object({
            type: z.literal('paragraph', { message: 'Kiểu nội dung phải là paragraph' }),
            text: z.string({ message: 'Nội dung đoạn văn phải là chuỗi ký tự' }).max(20000, 'Mỗi đoạn văn tối đa 20.000 ký tự'),
          })
          .strict()
      )
      .max(50, 'Tối đa 50 đoạn văn'),
    changeSummary: z
      .string({ message: 'Tóm tắt thay đổi phải là chuỗi ký tự' })
      .trim()
      .max(500, 'Tóm tắt thay đổi tối đa 500 ký tự')
      .optional()
      .nullable(),
    expectedRowVersion: lessonVersionSchema,
    expectedRevisionId: z
      .string({ message: 'expectedRevisionId phải là chuỗi' })
      .trim()
      .refine(isValidUuid, 'expectedRevisionId không đúng định dạng UUID')
      .optional()
      .nullable(),
    exercises: z
      .array(exerciseInputSchema)
      .max(MAX_COLLECTION_SIZE, 'Tối đa 100 bài tập trong một bài học')
      .optional(),
    vocabulary: z
      .array(vocabularyInputSchema)
      .max(MAX_COLLECTION_SIZE, 'Tối đa 100 từ vựng trong một bài học')
      .optional(),
  })
  .strict();
