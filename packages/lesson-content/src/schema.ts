import { z } from 'zod';

export const MAX_BLOCKS_PER_REVISION = 50;
export const MAX_BLOCK_KEY_LENGTH = 128;
export const MAX_BLOCK_POSITION = 2147483647;
export const MAX_BLOCK_PAYLOAD_BYTES = 1048576; // 1 MiB

export const LESSON_BLOCK_TYPES = [
  'HEADING',
  'TEXT',
  'GRAMMAR',
  'EXAMPLE',
  'DIALOGUE',
  'CALLOUT',
  'MEDIA',
  'VOCABULARY',
  'DIVIDER',
] as const;

export type LessonBlockType = (typeof LESSON_BLOCK_TYPES)[number];

export const blockKeySchema = z
  .string({ message: 'blockKey phải là chuỗi ký tự' })
  .trim()
  .min(1, 'blockKey không được để trống')
  .max(MAX_BLOCK_KEY_LENGTH, `blockKey tối đa ${MAX_BLOCK_KEY_LENGTH} ký tự`)
  .regex(/^[A-Za-z0-9_.:-]+$/, 'blockKey chỉ gồm chữ cái, số, gạch ngang, gạch dưới, hai chấm hoặc dấu chấm');

export const blockPositionSchema = z
  .number({ message: 'Thứ tự vị trí phải là số nguyên' })
  .int('Thứ tự vị trí phải là số nguyên')
  .min(1, 'Thứ tự vị trí phải lớn hơn 0')
  .max(MAX_BLOCK_POSITION, 'Thứ tự vị trí vượt quá giới hạn');

export const blockSchemaVersionSchema = z.literal(1, {
  message: 'Phiên bản schema khối nội dung (schemaVersion) hiện chỉ hỗ trợ 1',
});

// =============================================================================
// Safe URLs and Media Validators
// =============================================================================

export function isSafeRichTextUrl(url: string): boolean {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) return false;

  const stripped = trimmed.replace(/[\x00-\x20\s]+/g, '').toLowerCase();
  if (
    stripped.startsWith('javascript:') ||
    stripped.startsWith('data:') ||
    stripped.startsWith('vbscript:')
  ) {
    return false;
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true;
  }
  if (trimmed.startsWith('#')) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isValidMediaAudioUrl(rawUrl: string): boolean {
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
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false;
    if (hostname.includes(':') || hostname.startsWith('[') || hostname.endsWith(']')) return false;

    if (!hostname.includes('.')) return false;

    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false;
    }

    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export const safeRichTextUrlSchema = z
  .string({ message: 'URL liên kết phải là chuỗi ký tự' })
  .trim()
  .max(2048, 'URL liên kết tối đa 2048 ký tự')
  .refine(isSafeRichTextUrl, 'URL liên kết không an toàn hoặc không được hỗ trợ');

// =============================================================================
// Bounded Rich Text Document AST
// =============================================================================

export const textRunSchema = z
  .object({
    text: z.string({ message: 'Nội dung run phải là chuỗi ký tự' }).max(20000, 'Đoạn văn bản tối đa 20.000 ký tự'),
    bold: z.boolean({ message: 'bold phải là boolean' }).optional(),
    italic: z.boolean({ message: 'italic phải là boolean' }).optional(),
    link: z
      .object({
        url: safeRichTextUrlSchema,
        title: z.string().trim().max(300, 'Tiêu đề liên kết tối đa 300 ký tự').optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type TextRun = z.infer<typeof textRunSchema>;

export const textParagraphNodeSchema = z
  .object({
    type: z.literal('paragraph'),
    runs: z.array(textRunSchema).min(1, 'Đoạn văn yêu cầu ít nhất một đoạn văn bản (run)').max(100, 'Tối đa 100 runs trong một đoạn văn'),
  })
  .strict();

export type TextParagraphNode = z.infer<typeof textParagraphNodeSchema>;

export const textListItemSchema = z
  .object({
    runs: z.array(textRunSchema).min(1, 'Mục danh sách yêu cầu ít nhất một đoạn văn bản (run)').max(100, 'Tối đa 100 runs trong một mục danh sách'),
  })
  .strict();

export type TextListItem = z.infer<typeof textListItemSchema>;

export const textListNodeSchema = z
  .object({
    type: z.literal('list'),
    style: z.enum(['bullet', 'ordered'], {
      message: 'Kiểu danh sách phải là bullet hoặc ordered',
    }),
    items: z.array(textListItemSchema).min(1, 'Danh sách yêu cầu ít nhất 1 mục').max(50, 'Tối đa 50 mục trong danh sách'),
  })
  .strict();

export type TextListNode = z.infer<typeof textListNodeSchema>;

export const textDocumentNodeSchema = z.discriminatedUnion('type', [
  textParagraphNodeSchema,
  textListNodeSchema,
]);

export type TextDocumentNode = z.infer<typeof textDocumentNodeSchema>;

export const boundedTextDocumentSchema = z
  .object({
    nodes: z.array(textDocumentNodeSchema).min(1, 'Tài liệu văn bản yêu cầu ít nhất 1 đoạn văn hoặc danh sách').max(50, 'Tối đa 50 phần tử trong một khối văn bản'),
  })
  .strict();

export type BoundedTextDocument = z.infer<typeof boundedTextDocumentSchema>;

// =============================================================================
// Block Content Schemas (9 Canonical Types)
// =============================================================================

// 1. HEADING
export const headingContentSchema = z
  .object({
    level: z.union([z.literal(2), z.literal(3), z.literal(4)], {
      message: 'Cấp độ tiêu đề (level) phải là 2, 3 hoặc 4',
    }),
    text: z.string({ message: 'Tiêu đề phải là chuỗi ký tự' }).trim().min(1, 'Tiêu đề không được để trống').max(500, 'Tiêu đề tối đa 500 ký tự'),
  })
  .strict();

export type HeadingContent = z.infer<typeof headingContentSchema>;

// 2. TEXT
export const textContentSchema = boundedTextDocumentSchema;
export type TextContent = BoundedTextDocument;

// 3. GRAMMAR
export const grammarExampleSchema = z
  .object({
    text: z.string({ message: 'Ví dụ phải là chuỗi ký tự' }).trim().min(1, 'Ví dụ không được để trống').max(2000, 'Ví dụ tối đa 2000 ký tự'),
    translation: z.string().trim().max(2000, 'Bản dịch tối đa 2000 ký tự').optional().nullable(),
    explanation: z.string().trim().max(2000, 'Giải thích ví dụ tối đa 2000 ký tự').optional().nullable(),
  })
  .strict();

export type GrammarExample = z.infer<typeof grammarExampleSchema>;

export const grammarContentSchema = z
  .object({
    title: z.string().trim().max(500, 'Tiêu đề ngữ pháp tối đa 500 ký tự').optional().nullable(),
    explanation: z.string({ message: 'Giải thích ngữ pháp phải là chuỗi ký tự' }).trim().min(1, 'Giải thích ngữ pháp không được để trống').max(4000, 'Giải thích ngữ pháp tối đa 4000 ký tự'),
    examples: z.array(grammarExampleSchema).min(1, 'Ngữ pháp yêu cầu ít nhất 1 ví dụ').max(20, 'Tối đa 20 ví dụ cho một điểm ngữ pháp'),
  })
  .strict();

export type GrammarContent = z.infer<typeof grammarContentSchema>;

// 4. EXAMPLE
export const exampleContentSchema = z
  .object({
    text: z.string({ message: 'Câu ví dụ phải là chuỗi ký tự' }).trim().min(1, 'Câu ví dụ không được để trống').max(2000, 'Câu ví dụ tối đa 2000 ký tự'),
    translation: z.string().trim().max(2000, 'Bản dịch tối đa 2000 ký tự').optional().nullable(),
  })
  .strict();

export type ExampleContent = z.infer<typeof exampleContentSchema>;

// 5. DIALOGUE
export const dialogueLineSchema = z
  .object({
    speaker: z.string({ message: 'Tên người nói phải là chuỗi ký tự' }).trim().min(1, 'Tên người nói không được để trống').max(100, 'Tên người nói tối đa 100 ký tự'),
    text: z.string({ message: 'Lời thoại phải là chuỗi ký tự' }).trim().min(1, 'Lời thoại không được để trống').max(2000, 'Lời thoại tối đa 2000 ký tự'),
    translation: z.string().trim().max(2000, 'Bản dịch tối đa 2000 ký tự').optional().nullable(),
  })
  .strict();

export type DialogueLine = z.infer<typeof dialogueLineSchema>;

export const dialogueContentSchema = z
  .object({
    lines: z.array(dialogueLineSchema).min(1, 'Hội thoại yêu cầu ít nhất 1 dòng thoại').max(50, 'Tối đa 50 dòng thoại trong một đoạn hội thoại'),
  })
  .strict();

export type DialogueContent = z.infer<typeof dialogueContentSchema>;

// 6. CALLOUT
export const CALLOUT_TONES = [
  'note',
  'tip',
  'info',
  'warning',
  'caution',
  'important',
  'NOTE',
  'TIP',
  'INFO',
  'WARNING',
  'CAUTION',
  'IMPORTANT',
] as const;

export const calloutToneSchema = z.enum(CALLOUT_TONES, {
  message: 'Tone của callout phải là một trong: note, tip, info, warning, caution, important',
});

export type CalloutTone = z.infer<typeof calloutToneSchema>;

export const calloutContentSchema = z
  .object({
    tone: calloutToneSchema,
    title: z.string().trim().max(500, 'Tiêu đề callout tối đa 500 ký tự').optional().nullable(),
    document: boundedTextDocumentSchema,
  })
  .strict();

export type CalloutContent = z.infer<typeof calloutContentSchema>;

// 7. MEDIA
export const mediaContentSchema = z
  .object({
    kind: z.literal('audio', { message: 'Media kind hiện chỉ hỗ trợ audio' }),
    url: z
      .string({ message: 'Đường dẫn âm thanh phải là chuỗi ký tự' })
      .trim()
      .max(2048, 'Đường dẫn âm thanh tối đa 2048 ký tự')
      .refine(
        isValidMediaAudioUrl,
        'Đường dẫn âm thanh phải là URL HTTPS hợp lệ với tên miền công khai (không chấp nhận query, fragment, cổng tùy chỉnh, IP hoặc localhost)'
      )
      .transform((val) => new URL(val).href),
    caption: z.string().trim().max(500, 'Chú thích tối đa 500 ký tự').optional().nullable(),
  })
  .strict();

export type MediaContent = z.infer<typeof mediaContentSchema>;

// 8. VOCABULARY
export const vocabularyContentSchema = z
  .object({
    selection: z.literal('lesson', { message: 'Lựa chọn từ vựng (selection) trong Sprint 1 phải là "lesson"' }),
  })
  .strict();

export type VocabularyContent = z.infer<typeof vocabularyContentSchema>;

// 9. DIVIDER
export const dividerContentSchema = z.object({}).strict();
export type DividerContent = z.infer<typeof dividerContentSchema>;

// =============================================================================
// Discriminated Union of Lesson Blocks
// =============================================================================

const baseBlockProps = {
  blockKey: blockKeySchema,
  position: blockPositionSchema,
  schemaVersion: blockSchemaVersionSchema,
};

export const headingBlockSchema = z
  .object({
    ...baseBlockProps,
    type: z.literal('HEADING'),
    content: headingContentSchema,
  })
  .strict();

export const textBlockSchema = z
  .object({
    ...baseBlockProps,
    type: z.literal('TEXT'),
    content: textContentSchema,
  })
  .strict();

export const grammarBlockSchema = z
  .object({
    ...baseBlockProps,
    type: z.literal('GRAMMAR'),
    content: grammarContentSchema,
  })
  .strict();

export const exampleBlockSchema = z
  .object({
    ...baseBlockProps,
    type: z.literal('EXAMPLE'),
    content: exampleContentSchema,
  })
  .strict();

export const dialogueBlockSchema = z
  .object({
    ...baseBlockProps,
    type: z.literal('DIALOGUE'),
    content: dialogueContentSchema,
  })
  .strict();

export const calloutBlockSchema = z
  .object({
    ...baseBlockProps,
    type: z.literal('CALLOUT'),
    content: calloutContentSchema,
  })
  .strict();

export const mediaBlockSchema = z
  .object({
    ...baseBlockProps,
    type: z.literal('MEDIA'),
    content: mediaContentSchema,
  })
  .strict();

export const vocabularyBlockSchema = z
  .object({
    ...baseBlockProps,
    type: z.literal('VOCABULARY'),
    content: vocabularyContentSchema,
  })
  .strict();

export const dividerBlockSchema = z
  .object({
    ...baseBlockProps,
    type: z.literal('DIVIDER'),
    content: dividerContentSchema,
  })
  .strict();

export const lessonBlockSchema = z.discriminatedUnion('type', [
  headingBlockSchema,
  textBlockSchema,
  grammarBlockSchema,
  exampleBlockSchema,
  dialogueBlockSchema,
  calloutBlockSchema,
  mediaBlockSchema,
  vocabularyBlockSchema,
  dividerBlockSchema,
]);

export type HeadingBlock = z.infer<typeof headingBlockSchema>;
export type TextBlock = z.infer<typeof textBlockSchema>;
export type GrammarBlock = z.infer<typeof grammarBlockSchema>;
export type ExampleBlock = z.infer<typeof exampleBlockSchema>;
export type DialogueBlock = z.infer<typeof dialogueBlockSchema>;
export type CalloutBlock = z.infer<typeof calloutBlockSchema>;
export type MediaBlock = z.infer<typeof mediaBlockSchema>;
export type VocabularyBlock = z.infer<typeof vocabularyBlockSchema>;
export type DividerBlock = z.infer<typeof dividerBlockSchema>;

export type LessonBlock = z.infer<typeof lessonBlockSchema>;

// =============================================================================
// Collection Validation
// =============================================================================

export const lessonBlocksCollectionSchema = z
  .array(lessonBlockSchema)
  .max(MAX_BLOCKS_PER_REVISION, `Tối đa ${MAX_BLOCKS_PER_REVISION} khối nội dung trong một bài học`)
  .superRefine((blocks, ctx) => {
    const keySet = new Set<string>();
    const posSet = new Set<number>();

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (keySet.has(b.blockKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Khóa khối nội dung (blockKey) không được trùng lặp: ${b.blockKey}`,
          path: [i, 'blockKey'],
        });
      }
      keySet.add(b.blockKey);

      if (posSet.has(b.position)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Thứ tự vị trí (position) của các khối không được trùng lặp: ${b.position}`,
          path: [i, 'position'],
        });
      }
      posSet.add(b.position);
    }
  });

export function validateLessonBlocks(input: unknown): LessonBlock[] {
  if (!Array.isArray(input)) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        message: 'Danh sách các khối nội dung phải là mảng',
        path: [],
      },
    ]);
  }

  const serialized = JSON.stringify(input);
  if (new TextEncoder().encode(serialized).length > MAX_BLOCK_PAYLOAD_BYTES) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        message: 'Tổng kích thước nội dung các khối vượt quá giới hạn 1 MiB',
        path: [],
      },
    ]);
  }

  return lessonBlocksCollectionSchema.parse(input);
}
