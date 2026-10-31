import { z } from 'zod';
import { isValidUuid } from '../frameworks/index.ts';
import { exerciseInputSchema, type ExerciseType } from '../lessons/content.ts';

export const SUPPORTED_EXERCISE_TYPES = [
  'MCQ',
  'FILL_BLANK',
  'REORDER',
  'LISTENING',
  'GRAMMAR',
] as const;

export const exerciseTypeEnum = z.enum(SUPPORTED_EXERCISE_TYPES, {
  message: 'Kiểu bài tập không được hỗ trợ',
});

export const assessmentPurposeEnum = z.enum(['PLACEMENT', 'LEVEL_UP'], {
  message: 'Mục đích bài đánh giá phải là PLACEMENT hoặc LEVEL_UP',
});

export const blueprintCoverageSchema = z
  .object({
    itemCount: z
      .number({ message: 'itemCount phải là số' })
      .int('itemCount phải là số nguyên')
      .positive('itemCount phải lớn hơn 0')
      .refine(Number.isSafeInteger, 'itemCount vượt quá giới hạn số nguyên an toàn'),
    exerciseTypes: z
      .array(exerciseTypeEnum, { message: 'exerciseTypes phải là danh sách kiểu bài tập' })
      .min(1, 'exerciseTypes phải chứa ít nhất một kiểu bài tập')
      .refine(
        (types) => new Set(types).size === types.length,
        'exerciseTypes không được chứa các giá trị trùng lặp'
      ),
  })
  .strict();

export const blueprintRequirementsSchema = z
  .object({
    minimumItemsByType: z.partialRecord(
        exerciseTypeEnum,
        z
          .number({ message: 'Số lượng tối thiểu phải là số' })
          .int('Số lượng tối thiểu phải là số nguyên')
          .min(0, 'Số lượng tối thiểu không được âm')
          .refine(Number.isSafeInteger, 'Số lượng tối thiểu vượt quá giới hạn an toàn'),
      ),
  })
  .strict();

export const blueprintConfigSchema = z
  .object({
    shuffleItems: z.boolean({ message: 'shuffleItems phải là giá trị boolean' }),
    shuffleOptions: z.boolean({ message: 'shuffleOptions phải là giá trị boolean' }),
  })
  .strict();

export function validateBlueprintComposition(
  coverage: { itemCount: number; exerciseTypes: string[] },
  requirements: { minimumItemsByType?: Record<string, number> }
): { valid: boolean; error?: string } {
  const allowedSet = new Set(coverage.exerciseTypes);
  const minMap = requirements?.minimumItemsByType || {};
  let sum = 0;

  for (const [type, count] of Object.entries(minMap)) {
    if (!allowedSet.has(type)) {
      return {
        valid: false,
        error: `Kiểu bài tập '${type}' trong requirements không nằm trong coverage.exerciseTypes`,
      };
    }
    if (typeof count !== 'number' || count < 0 || !Number.isSafeInteger(count)) {
      return {
        valid: false,
        error: `Số lượng bài tập cho '${type}' phải là số nguyên không âm`,
      };
    }
    sum += count;
    if (!Number.isSafeInteger(sum)) {
      return { valid: false, error: 'Tổng số bài tập tối thiểu vượt quá giới hạn an toàn' };
    }
  }

  if (sum > coverage.itemCount) {
    return {
      valid: false,
      error: `Tổng số bài tập tối thiểu (${sum}) vượt quá tổng số bài tập của khung (${coverage.itemCount})`,
    };
  }

  return { valid: true };
}

export const createBlueprintSchema = z
  .object({
    courseId: z
      .string({ message: 'courseId là bắt buộc' })
      .trim()
      .refine(isValidUuid, 'courseId không đúng định dạng UUID'),
    purpose: assessmentPurposeEnum,
    targetLevelId: z
      .string({ message: 'targetLevelId phải là UUID' })
      .trim()
      .refine(isValidUuid, 'targetLevelId không đúng định dạng UUID')
      .nullable()
      .optional(),
    nextLevelId: z
      .string({ message: 'nextLevelId phải là UUID' })
      .trim()
      .refine(isValidUuid, 'nextLevelId không đúng định dạng UUID')
      .nullable()
      .optional(),
    coverage: blueprintCoverageSchema,
    requirements: blueprintRequirementsSchema,
    config: blueprintConfigSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    const compCheck = validateBlueprintComposition(data.coverage, data.requirements);
    if (!compCheck.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: compCheck.error || 'Cấu trúc bài đánh giá không hợp lệ',
        path: ['requirements', 'minimumItemsByType'],
      });
    }
  });

const rowVersionStringSchema = z
  .string({ message: 'expectedRowVersion là bắt buộc' })
  .refine(
    (value) => /^[1-9]\d{0,18}$/.test(value) && BigInt(value) <= 9223372036854775807n,
    'expectedRowVersion phải là chuỗi số nguyên dương int64 chuẩn'
  );

export const updateBlueprintSchema = z
  .object({
    expectedRowVersion: rowVersionStringSchema,
    purpose: assessmentPurposeEnum.optional(),
    targetLevelId: z
      .string({ message: 'targetLevelId phải là UUID' })
      .trim()
      .refine(isValidUuid, 'targetLevelId không đúng định dạng UUID')
      .nullable()
      .optional(),
    nextLevelId: z
      .string({ message: 'nextLevelId phải là UUID' })
      .trim()
      .refine(isValidUuid, 'nextLevelId không đúng định dạng UUID')
      .nullable()
      .optional(),
    coverage: blueprintCoverageSchema.optional(),
    requirements: blueprintRequirementsSchema.optional(),
    config: blueprintConfigSchema.optional(),
  })
  .strict();

export const assembleVersionSchema = z
  .object({
    expectedBlueprintGeneration: z
      .string({ message: 'expectedBlueprintGeneration là bắt buộc' })
      .refine(
        (value) => /^[1-9]\d{0,18}$/.test(value) && BigInt(value) <= 9223372036854775807n,
        'expectedBlueprintGeneration phải là chuỗi số nguyên dương'
      ),
    itemRevisionIds: z
      .array(
        z
          .string()
          .trim()
          .refine(isValidUuid, 'Mỗi itemRevisionId phải là UUID hợp lệ')
      )
      .min(1, 'Cần ít nhất một bài tập để tạo phiên bản đánh giá'),
  })
  .strict();

export const teacherAssessmentItemSchema = z
  .object({
    blueprintId: z
      .string({ message: 'blueprintId là bắt buộc' })
      .trim()
      .refine(isValidUuid, 'blueprintId không đúng định dạng UUID'),
    sourceItemId: z
      .string({ message: 'sourceItemId phải là UUID' })
      .trim()
      .refine(isValidUuid, 'sourceItemId không đúng định dạng UUID')
      .optional()
      .nullable(),
    type: exerciseTypeEnum,
    promptData: z.unknown(),
    gradingData: z.unknown(),
    feedbackData: z.unknown().optional().nullable(),
    expectedRevisionId: z
      .string({ message: 'expectedRevisionId là bắt buộc' })
      .trim()
      .refine(isValidUuid, 'expectedRevisionId không đúng định dạng UUID'),
  })
  .strict()
  .transform((data, ctx) => {
    const parseResult = exerciseInputSchema.safeParse({
      position: 1,
      isCore: true,
      type: data.type,
      promptData: data.promptData,
      gradingData: data.gradingData,
      feedbackData: data.feedbackData,
    });
    if (!parseResult.success) {
      for (const issue of parseResult.error.issues) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: issue.message,
          path: issue.path,
        });
      }
      return z.NEVER;
    }
    return {
      ...data,
      promptData: parseResult.data.promptData,
      gradingData: parseResult.data.gradingData,
      feedbackData: parseResult.data.feedbackData,
    };
  });
