import { z } from 'zod';

export const WRITING_SCRIPT_TYPES = [
  'HIRAGANA',
  'KATAKANA',
  'KANJI',
  'HANZI_SIMPLIFIED',
  'HANZI_TRADITIONAL',
] as const;

export type WritingScriptType = (typeof WRITING_SCRIPT_TYPES)[number];

export const HANZI_SYSTEMS = ['SIMPLIFIED', 'TRADITIONAL'] as const;
export type HanziSystem = (typeof HANZI_SYSTEMS)[number];

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

export function isVariationSelector(codePoint: number): boolean {
  return (codePoint >= 0xfe00 && codePoint <= 0xfe0f) || (codePoint >= 0xe0100 && codePoint <= 0xe01ef);
}

/**
 * Validates and normalizes a character glyph:
 * 1. Requires non-empty string.
 * 2. Normalizes strictly with NFC (preserving canonical composition and variation sequences).
 *    Does NOT use NFKC to avoid collapsing distinct script forms.
 * 3. Enforces exactly one Unicode grapheme cluster.
 * 4. Ensures variation selectors are attached to a valid base character, not standalone.
 */
export function validateAndNormalizeGlyph(rawGlyph: string): { valid: true; glyph: string } | { valid: false; reason: string } {
  if (typeof rawGlyph !== 'string' || !rawGlyph.trim()) {
    return { valid: false, reason: 'Glyph must be a non-empty string' };
  }

  // NFC normalization preserves variation selectors while composing canonical characters
  const nfc = rawGlyph.normalize('NFC');

  const segments = Array.from(graphemeSegmenter.segment(nfc));
  if (segments.length !== 1) {
    return {
      valid: false,
      reason: `Glyph must be exactly one grapheme cluster (got ${segments.length})`,
    };
  }

  const codePoints = Array.from(nfc).map((char) => char.codePointAt(0)!);

  // Standalone variation selector check
  if (codePoints.length > 0 && isVariationSelector(codePoints[0])) {
    return {
      valid: false,
      reason: 'Glyph cannot start with or consist solely of a variation selector',
    };
  }

  return { valid: true, glyph: nfc };
}

export const writingCharacterMetadataSchema = z
  .object({
    hanziSystems: z.array(z.enum(HANZI_SYSTEMS)).min(1).max(2).optional(),
    simplifiedVariant: z.string().optional(),
    traditionalVariant: z.string().optional(),
    pinyin: z.array(z.string()).optional(),
    tones: z.array(z.number().int().min(1).max(5)).optional(),
    onyomi: z.array(z.string()).optional(),
    kunyomi: z.array(z.string()).optional(),
    radical: z.string().optional(),
    components: z.array(z.string()).optional(),
    hskLevel: z.number().int().min(1).max(9).optional(),
    jlptLevel: z.string().regex(/^N[1-5]$/).optional(),
    gradeLevel: z.number().int().optional(),
    frequency: z.number().int().optional(),
    notes: z.string().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.hanziSystems) {
      const unique = new Set(data.hanziSystems);
      if (unique.size !== data.hanziSystems.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'hanziSystems cannot contain duplicate values',
          path: ['hanziSystems'],
        });
      }
    }

    if (data.simplifiedVariant !== undefined) {
      const res = validateAndNormalizeGlyph(data.simplifiedVariant);
      if (!res.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `simplifiedVariant must be a single grapheme: ${res.reason}`,
          path: ['simplifiedVariant'],
        });
      }
    }

    if (data.traditionalVariant !== undefined) {
      const res = validateAndNormalizeGlyph(data.traditionalVariant);
      if (!res.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `traditionalVariant must be a single grapheme: ${res.reason}`,
          path: ['traditionalVariant'],
        });
      }
    }
  });

export type WritingCharacterMetadata = z.infer<typeof writingCharacterMetadataSchema>;

export const createWritingCharacterSchema = z
  .object({
    id: z.string().uuid({ message: 'id must be a valid UUID' }).optional(),
    languageId: z.string().uuid({ message: 'languageId must be a valid UUID' }),
    glyph: z.string().min(1, 'glyph cannot be empty'),
    scriptType: z.enum(WRITING_SCRIPT_TYPES, {
      message: 'scriptType must be one of: HIRAGANA, KATAKANA, KANJI, HANZI_SIMPLIFIED, HANZI_TRADITIONAL',
    }),
    meaning: z.string().max(500).optional().nullable(),
    primaryReading: z.string().max(255).optional().nullable(),
    romanization: z.string().max(255).optional().nullable(),
    strokeCount: z
      .number()
      .int('strokeCount must be an integer')
      .min(1, 'strokeCount must be at least 1')
      .max(128, 'strokeCount cannot exceed 128'),
    metadata: writingCharacterMetadataSchema.default({}),
  })
  .strict()
  .superRefine((data, ctx) => {
    const glyphRes = validateAndNormalizeGlyph(data.glyph);
    if (!glyphRes.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: glyphRes.reason,
        path: ['glyph'],
      });
    }

    const isHanzi = data.scriptType === 'HANZI_SIMPLIFIED' || data.scriptType === 'HANZI_TRADITIONAL';
    const isKana = data.scriptType === 'HIRAGANA' || data.scriptType === 'KATAKANA';

    if (isKana) {
      if (data.metadata?.hanziSystems && data.metadata.hanziSystems.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Kana scripts (HIRAGANA, KATAKANA) cannot specify hanziSystems in metadata',
          path: ['metadata', 'hanziSystems'],
        });
      }
      if (data.metadata?.simplifiedVariant || data.metadata?.traditionalVariant) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Kana scripts (HIRAGANA, KATAKANA) cannot specify Hanzi variant metadata',
          path: ['metadata'],
        });
      }
    }

    if (data.metadata?.hanziSystems) {
      if (!isHanzi && data.scriptType !== 'KANJI') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'hanziSystems metadata is only allowed for Hanzi or Kanji scripts',
          path: ['metadata', 'hanziSystems'],
        });
      }

      // Metadata must match scriptType
      if (data.scriptType === 'HANZI_SIMPLIFIED' && !data.metadata.hanziSystems.includes('SIMPLIFIED')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'HANZI_SIMPLIFIED script requires hanziSystems to include SIMPLIFIED',
          path: ['metadata', 'hanziSystems'],
        });
      }
      if (data.scriptType === 'HANZI_TRADITIONAL' && !data.metadata.hanziSystems.includes('TRADITIONAL')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'HANZI_TRADITIONAL script requires hanziSystems to include TRADITIONAL',
          path: ['metadata', 'hanziSystems'],
        });
      }
    }
  });

export type CreateWritingCharacterInput = z.infer<typeof createWritingCharacterSchema>;

export function validateCharacterInput(input: unknown): {
  success: true;
  data: CreateWritingCharacterInput;
} | {
  success: false;
  error: z.ZodError;
} {
  const result = createWritingCharacterSchema.safeParse(input);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Ensure normalized glyph is returned
  const normalizedGlyph = validateAndNormalizeGlyph(result.data.glyph);
  if (!normalizedGlyph.valid) {
    // Should not happen due to superRefine, but ensure type safety
    return {
      success: false,
      error: new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          path: ['glyph'],
          message: normalizedGlyph.reason,
        },
      ]),
    };
  }

  return {
    success: true,
    data: {
      ...result.data,
      glyph: normalizedGlyph.glyph,
    },
  };
}

export const MAX_STROKES = 128;
export const MIN_POINTS_PER_STROKE = 2;
export const MAX_POINTS_PER_STROKE = 256;
export const MAX_TOTAL_POINTS = 4096;
export const MAX_STROKE_BODY_BYTES = 256 * 1024; // 256 KiB

export type StrokePoint = [number, number];

/**
 * Canonicalizes a point to a standard 5-decimal precision number within [0, 1].
 */
export function canonicalizePoint(p: StrokePoint): StrokePoint {
  return [Number(p[0].toFixed(5)), Number(p[1].toFixed(5))];
}

export interface Stroke {
  index: number;
  points: StrokePoint[];
  start: StrokePoint;
  end: StrokePoint;
  path: string;
}

export interface StrokeProvenance {
  author: string;
  version: string;
  attribution: string;
  licenseObligations?: string;
  createdAt?: string;
  notes?: string;
}

export interface CharacterStrokeDataInput {
  characterId: string;
  version: number;
  strokes: Stroke[];
  source: string;
  license: string;
  provenance: StrokeProvenance;
}

/**
 * Builds a canonical SVG path string (M and L commands only) from normalized points.
 */
export function buildSvgPath(points: StrokePoint[]): string {
  if (points.length === 0) return '';
  return points
    .map((p, i) => {
      const x = Number(p[0].toFixed(5));
      const y = Number(p[1].toFixed(5));
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');
}

/**
 * Creates a valid Stroke object with start, end, and SVG path generated from points.
 */
export function createStroke(index: number, points: StrokePoint[]): Stroke {
  if (points.length < MIN_POINTS_PER_STROKE) {
    throw new Error(`Stroke requires at least ${MIN_POINTS_PER_STROKE} points`);
  }
  const canonicalPoints = points.map(canonicalizePoint);
  return {
    index,
    points: canonicalPoints,
    start: [canonicalPoints[0][0], canonicalPoints[0][1]],
    end: [canonicalPoints[canonicalPoints.length - 1][0], canonicalPoints[canonicalPoints.length - 1][1]],
    path: buildSvgPath(canonicalPoints),
  };
}

export const strokePointSchema = z
  .tuple([z.number(), z.number()])
  .refine(
    ([x, y]) =>
      Number.isFinite(x) &&
      !Number.isNaN(x) &&
      x >= 0 &&
      x <= 1 &&
      Number.isFinite(y) &&
      !Number.isNaN(y) &&
      y >= 0 &&
      y <= 1,
    {
      message: 'Stroke point coordinates must be finite numbers within [0, 1]',
    }
  );

export const strokeProvenanceSchema = z
  .object({
    author: z.string().trim().min(1, 'author must not be empty').max(255),
    version: z.string().trim().min(1, 'version must not be empty').max(50).default('1.0.0'),
    attribution: z.string().trim().min(1, 'attribution must not be empty').max(500),
    licenseObligations: z.string().trim().max(1000).optional(),
    createdAt: z.string().optional(),
    notes: z.string().optional(),
  })
  .strict();

export const rawStrokeSchema = z
  .object({
    index: z.number().int('index must be an integer').min(1, 'index must be >= 1').max(MAX_STROKES),
    points: z
      .array(strokePointSchema)
      .min(MIN_POINTS_PER_STROKE, `Each stroke must have at least ${MIN_POINTS_PER_STROKE} points`)
      .max(MAX_POINTS_PER_STROKE, `Each stroke can have at most ${MAX_POINTS_PER_STROKE} points`),
    start: strokePointSchema.optional(),
    end: strokePointSchema.optional(),
    path: z.string().min(1, 'path cannot be empty').optional(),
  })
  .strict();

export const rawStrokeDataInputSchema = z
  .object({
    characterId: z.string().uuid({ message: 'characterId must be a valid UUID' }),
    version: z.number().int().min(1, 'version must be positive').default(1),
    strokes: z
      .array(rawStrokeSchema)
      .min(1, 'strokes array must contain at least 1 stroke')
      .max(MAX_STROKES, `strokes array cannot exceed ${MAX_STROKES} strokes`),
    source: z.string().trim().min(1, 'source must not be empty').max(255),
    license: z.string().trim().min(1, 'license must not be empty').max(255),
    provenance: strokeProvenanceSchema.default({
      author: 'Lingora Core Team',
      version: '1.0.0',
      attribution: 'Self-authored normalized stroke coordinates',
    }),
  })
  .strict();

export const SVG_PATH_REGEX = /^M\s+([0-9.]+)[,\s]+([0-9.]+)(?:\s+L\s+([0-9.]+)[,\s]+([0-9.]+))*$/;

/**
 * Parses all points from a valid SVG M/L path string and canonicalizes them.
 */
export function parseSvgPathPoints(path: string): StrokePoint[] | null {
  const trimmed = path.trim();
  if (!SVG_PATH_REGEX.test(trimmed)) return null;
  const matches = Array.from(trimmed.matchAll(/(?:M|L)\s+([0-9.]+)[,\s]+([0-9.]+)/g));
  if (matches.length === 0) return null;
  return matches.map((m) => canonicalizePoint([Number(m[1]), Number(m[2])]));
}

/**
 * Validates stroke data input strictly against Sprint 6 contract:
 * - JSON strict schema
 * - Coordinate bounds [0, 1] and finite numbers
 * - Max 128 strokes, min 2 points/stroke, max 256 points/stroke
 * - Max 4096 total points across all strokes
 * - Payload size <= 256 KiB
 * - Consecutive stroke indices starting at 1
 * - Stroke count equals catalogue strokeCount (if expectedStrokeCount provided)
 * - Single canonical set of normalized points for points/start/end/path
 * - Start/end/path match canonical geometry strictly; discrepancies rejected
 * - Degenerate paths rejected after canonicalization (zero cumulative path length)
 */
export function validateStrokeDataInput(
  input: unknown,
  expectedStrokeCount?: number
): { success: true; data: CharacterStrokeDataInput } | { success: false; error: z.ZodError | Error } {
  // Check payload byte limit if stringifiable
  try {
    const bytes = Buffer.byteLength(typeof input === 'string' ? input : JSON.stringify(input));
    if (bytes > MAX_STROKE_BODY_BYTES) {
      return {
        success: false,
        error: new Error(`Stroke data payload exceeds ${MAX_STROKE_BODY_BYTES} bytes limit (got ${bytes} bytes)`),
      };
    }
  } catch {
    // If not stringifiable, will fail Zod schema parse below
  }

  const parseResult = rawStrokeDataInputSchema.safeParse(input);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error };
  }

  const { strokes, ...rest } = parseResult.data;
  const issues: z.ZodIssue[] = [];

  // 1. Verify expected stroke count if provided
  if (expectedStrokeCount !== undefined && strokes.length !== expectedStrokeCount) {
    issues.push({
      code: z.ZodIssueCode.custom,
      message: `Stroke count must match catalogue strokeCount (expected ${expectedStrokeCount}, got ${strokes.length})`,
      path: ['strokes'],
    });
  }

  // 2. Verify total points across all strokes
  let totalPoints = 0;
  for (let i = 0; i < strokes.length; i++) {
    totalPoints += strokes[i].points.length;
  }
  if (totalPoints > MAX_TOTAL_POINTS) {
    issues.push({
      code: z.ZodIssueCode.custom,
      message: `Total points across all strokes (${totalPoints}) exceeds limit of ${MAX_TOTAL_POINTS}`,
      path: ['strokes'],
    });
  }

  const validatedStrokes: Stroke[] = [];

  for (let i = 0; i < strokes.length; i++) {
    const stroke = strokes[i];
    const expectedIndex = i + 1;

    // Consecutive 1-based index
    if (stroke.index !== expectedIndex) {
      issues.push({
        code: z.ZodIssueCode.custom,
        message: `Stroke indices must be strictly consecutive starting from 1 (expected ${expectedIndex}, got ${stroke.index})`,
        path: ['strokes', i, 'index'],
      });
    }

    // 1. One canonical set of normalized points with precision rounding
    const canonicalPoints: StrokePoint[] = stroke.points.map(canonicalizePoint);
    const canonicalStart: StrokePoint = [canonicalPoints[0][0], canonicalPoints[0][1]];
    const canonicalEnd: StrokePoint = [canonicalPoints[canonicalPoints.length - 1][0], canonicalPoints[canonicalPoints.length - 1][1]];
    const canonicalPath = buildSvgPath(canonicalPoints);

    // 2. Reject degenerate paths after canonicalization (zero cumulative path length)
    let cumulativeLength = 0;
    for (let j = 1; j < canonicalPoints.length; j++) {
      const dx = canonicalPoints[j][0] - canonicalPoints[j - 1][0];
      const dy = canonicalPoints[j][1] - canonicalPoints[j - 1][1];
      cumulativeLength += Math.hypot(dx, dy);
    }
    if (cumulativeLength < 1e-6) {
      issues.push({
        code: z.ZodIssueCode.custom,
        message: `Stroke at index ${stroke.index} has no movement (degenerate zero-length path after canonicalization)`,
        path: ['strokes', i, 'points'],
      });
    }

    // 3. If start is supplied, reject discrepancies with canonical start
    if (stroke.start) {
      const suppliedStart = canonicalizePoint(stroke.start);
      if (suppliedStart[0] !== canonicalStart[0] || suppliedStart[1] !== canonicalStart[1]) {
        issues.push({
          code: z.ZodIssueCode.custom,
          message: `Stroke start coordinate [${stroke.start[0]}, ${stroke.start[1]}] does not match canonical first point [${canonicalStart[0]}, ${canonicalStart[1]}]`,
          path: ['strokes', i, 'start'],
        });
      }
    }

    // 4. If end is supplied, reject discrepancies with canonical end
    if (stroke.end) {
      const suppliedEnd = canonicalizePoint(stroke.end);
      if (suppliedEnd[0] !== canonicalEnd[0] || suppliedEnd[1] !== canonicalEnd[1]) {
        issues.push({
          code: z.ZodIssueCode.custom,
          message: `Stroke end coordinate [${stroke.end[0]}, ${stroke.end[1]}] does not match canonical last point [${canonicalEnd[0]}, ${canonicalEnd[1]}]`,
          path: ['strokes', i, 'end'],
        });
      }
    }

    // 5. If path is supplied, verify syntax and reject discrepancies with canonical geometry
    if (stroke.path) {
      const trimmedPath = stroke.path.trim();
      if (!SVG_PATH_REGEX.test(trimmedPath)) {
        issues.push({
          code: z.ZodIssueCode.custom,
          message: `Stroke path must be a valid SVG path with only M and L commands (got: "${trimmedPath.slice(0, 40)}")`,
          path: ['strokes', i, 'path'],
        });
      } else {
        const pathPoints = parseSvgPathPoints(trimmedPath);
        if (!pathPoints || pathPoints.length !== canonicalPoints.length) {
          issues.push({
            code: z.ZodIssueCode.custom,
            message: `Stroke path point count (${pathPoints?.length ?? 0}) does not match canonical stroke points count (${canonicalPoints.length})`,
            path: ['strokes', i, 'path'],
          });
        } else {
          for (let pIdx = 0; pIdx < canonicalPoints.length; pIdx++) {
            if (
              pathPoints[pIdx][0] !== canonicalPoints[pIdx][0] ||
              pathPoints[pIdx][1] !== canonicalPoints[pIdx][1]
            ) {
              issues.push({
                code: z.ZodIssueCode.custom,
                message: `Stroke path point at position ${pIdx} [${pathPoints[pIdx][0]}, ${pathPoints[pIdx][1]}] does not match canonical stroke point [${canonicalPoints[pIdx][0]}, ${canonicalPoints[pIdx][1]}]`,
                path: ['strokes', i, 'path'],
              });
              break;
            }
          }
        }
      }
    }

    // Always use the single canonical set of normalized points for points/start/end/path
    validatedStrokes.push({
      index: stroke.index,
      points: canonicalPoints,
      start: canonicalStart,
      end: canonicalEnd,
      path: canonicalPath,
    });
  }

  if (issues.length > 0) {
    return {
      success: false,
      error: new z.ZodError(issues),
    };
  }

  return {
    success: true,
    data: {
      ...rest,
      strokes: validatedStrokes,
    },
  };
}

export const vocabularyCharacterInputSchema = z.object({
  id: z.string().uuid().optional(),
  vocabularyId: z.string().uuid(),
  characterId: z.string().uuid(),
  position: z.number().int().min(1),
}).strict();

export type VocabularyCharacterInput = z.infer<typeof vocabularyCharacterInputSchema>;

export function validateVocabularyCharacterInput(input: unknown) {
  return vocabularyCharacterInputSchema.safeParse(input);
}
