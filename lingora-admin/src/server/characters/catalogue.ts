import { getProductPrisma } from '../db/index.js';
import type { PrismaClient } from '../../../generated/product-client/index.js';
import {
  validateCharacterInput,
  validateAndNormalizeGlyph,
  isScriptTypeAllowedForLanguage,
  listCharactersQuerySchema,
  type WritingScriptType,
} from './validator.ts';

export interface ListCharactersParams {
  languageId?: string;
  scriptType?: WritingScriptType;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface CharacterApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export interface CharacterCatalogueItemDto {
  id: string;
  languageId: string;
  languageCode: string | null;
  languageNames: Record<string, string> | null;
  glyph: string;
  scriptType: WritingScriptType;
  meaning: string | null;
  primaryReading: string | null;
  romanization: string | null;
  strokeCount: number;
  metadata: Record<string, unknown>;
  hasStrokes: boolean;
  strokeVersion: number | null;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseLanguageNames(rawNames: unknown): Record<string, string> | null {
  if (typeof rawNames !== 'object' || rawNames === null || Array.isArray(rawNames)) {
    return null;
  }
  const names: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawNames as Record<string, unknown>)) {
    if (typeof value === 'string') {
      names[key] = value;
    } else if (value != null) {
      names[key] = String(value);
    }
  }
  return names;
}

function toCharacterCatalogueItemDto(row: {
  id: string;
  languageId: string;
  glyph: string;
  scriptType: string;
  meaning: string | null;
  primaryReading: string | null;
  romanization: string | null;
  strokeCount: number;
  metadata: unknown;
  language?: { id: string; code: string; names: unknown } | null;
  strokeData?: { version: number } | null;
}): CharacterCatalogueItemDto {
  const metadata =
    typeof row.metadata === 'object' && row.metadata !== null && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};

  return {
    id: row.id,
    languageId: row.languageId,
    languageCode: row.language?.code ?? null,
    languageNames: parseLanguageNames(row.language?.names),
    glyph: row.glyph,
    scriptType: row.scriptType as WritingScriptType,
    meaning: row.meaning ?? null,
    primaryReading: row.primaryReading ?? null,
    romanization: row.romanization ?? null,
    strokeCount: row.strokeCount,
    metadata,
    hasStrokes: Boolean(row.strokeData),
    strokeVersion: row.strokeData?.version ?? null,
  };
}

function buildCharacterWhere(params: {
  languageId?: string;
  scriptType?: WritingScriptType;
  search?: string;
}) {
  const { languageId, scriptType, search } = params;
  const where: any = {
    ...(languageId ? { languageId } : {}),
    ...(scriptType ? { scriptType } : {}),
  };

  if (search && search.trim()) {
    const trimmed = search.trim();
    where.OR = [
      { glyph: { contains: trimmed } },
      { meaning: { contains: trimmed, mode: 'insensitive' } },
      { primaryReading: { contains: trimmed, mode: 'insensitive' } },
      { romanization: { contains: trimmed, mode: 'insensitive' } },
    ];
  }

  return where;
}

function isServiceUnavailableError(err: unknown): boolean {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code?: unknown }).code;
    if (
      code === 'P1000' ||
      code === 'P1001' ||
      code === 'P1002' ||
      code === 'P1008' ||
      code === 'P1017' ||
      code === 'P2024'
    ) {
      return true;
    }
  }
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('connect') ||
    msg.includes('Connection') ||
    msg.includes('DATABASE_URL') ||
    msg.includes('timeout')
  );
}

function mapCharacterErrorToHttp(err: unknown): { status: number; error: CharacterApiError } {
  const errCode =
    typeof err === 'object' && err !== null && 'code' in err
      ? (err as { code?: unknown }).code
      : undefined;

  if (errCode === 'VALIDATION_ERROR') {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: (err as Error).message || 'Dữ liệu ký tự không hợp lệ.',
        ...((err as any).fields ? { fields: (err as any).fields } : {}),
      },
    };
  }

  if (errCode === 'LANGUAGE_NOT_FOUND') {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Ngôn ngữ đã chọn không tồn tại trong hệ thống.',
        fields: { languageId: 'Ngôn ngữ đã chọn không tồn tại trong hệ thống.' },
      },
    };
  }

  if (errCode === 'SCRIPT_LANGUAGE_MISMATCH') {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: (err as Error).message || 'Loại chữ không phù hợp với ngôn ngữ đã chọn.',
        fields: {
          scriptType: (err as Error).message || 'Loại chữ không phù hợp với ngôn ngữ đã chọn.',
        },
      },
    };
  }

  if (errCode === 'CHARACTER_DUPLICATE' || errCode === 'P2002') {
    return {
      status: 409,
      error: {
        code: 'CHARACTER_DUPLICATE',
        message: 'Ký tự này đã tồn tại trong danh mục của ngôn ngữ đã chọn.',
        fields: {
          glyph: 'Ký tự này đã tồn tại trong danh mục của ngôn ngữ đã chọn.',
        },
      },
    };
  }

  if (errCode === 'P2003') {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Ngôn ngữ đã chọn không tồn tại trong hệ thống.',
        fields: { languageId: 'Ngôn ngữ đã chọn không tồn tại trong hệ thống.' },
      },
    };
  }

  if (isServiceUnavailableError(err)) {
    return {
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }

  return {
    status: 500,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Đã xảy ra lỗi không mong muốn từ hệ thống máy chủ.',
    },
  };
}

/**
 * Creates a new writing character in the catalogue.
 * Validates input, normalizes glyph to NFC, and enforces language scoping and constraints.
 */
export async function createCharacter(
  input: unknown,
  db?: PrismaClient
) {
  const validation = validateCharacterInput(input);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const path = issue.path.join('.') || 'form';
      if (!fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }
    const error = new Error(validation.error.issues[0]?.message || 'Invalid character catalogue input');
    (error as any).code = 'VALIDATION_ERROR';
    (error as any).details = validation.error.format();
    (error as any).fields = fieldErrors;
    throw error;
  }

  const client = db ?? getProductPrisma();
  const validData = validation.data;

  // Verify target language exists and supports the requested scriptType
  if (typeof (client as any).language?.findUnique === 'function') {
    const language = await client.language.findUnique({
      where: { id: validData.languageId },
      select: { id: true, code: true },
    });

    if (!language) {
      const err = new Error('Ngôn ngữ đã chọn không tồn tại trong hệ thống.');
      (err as any).code = 'LANGUAGE_NOT_FOUND';
      throw err;
    }

    if (!isScriptTypeAllowedForLanguage(language.code, validData.scriptType)) {
      const err = new Error(
        `Loại chữ ${validData.scriptType} không hợp lệ cho ngôn ngữ "${language.code}".`
      );
      (err as any).code = 'SCRIPT_LANGUAGE_MISMATCH';
      throw err;
    }
  }

  try {
    return await client.writingCharacter.create({
      data: {
        ...(validData.id ? { id: validData.id } : {}),
        languageId: validData.languageId,
        glyph: validData.glyph,
        scriptType: validData.scriptType,
        meaning: normalizeOptionalText(validData.meaning),
        primaryReading: normalizeOptionalText(validData.primaryReading),
        romanization: normalizeOptionalText(validData.romanization),
        strokeCount: validData.strokeCount,
        metadata: validData.metadata as any,
      },
    });
  } catch (err: unknown) {
    const prismaCode =
      typeof err === 'object' && err !== null && 'code' in err
        ? (err as { code?: unknown }).code
        : undefined;

    if (prismaCode === 'P2002') {
      const duplicateErr = new Error('Ký tự này đã tồn tại trong danh mục của ngôn ngữ đã chọn.');
      (duplicateErr as any).code = 'CHARACTER_DUPLICATE';
      throw duplicateErr;
    }
    if (prismaCode === 'P2003') {
      const fkErr = new Error('Ngôn ngữ đã chọn không tồn tại trong hệ thống.');
      (fkErr as any).code = 'LANGUAGE_NOT_FOUND';
      throw fkErr;
    }
    throw err;
  }
}

/**
 * Admin API helper for creating a character with full validation and HTTP error envelope mapping.
 */
export async function createAdminCharacter(
  input: unknown,
  db?: PrismaClient
): Promise<{ status: number; data?: { data: CharacterCatalogueItemDto }; error?: CharacterApiError }> {
  try {
    const client = db ?? getProductPrisma();
    const created = await createCharacter(input, client);

    let language: { id: string; code: string; names: unknown } | null = null;
    if (typeof (client as any).language?.findUnique === 'function') {
      language = await client.language.findUnique({
        where: { id: created.languageId },
        select: { id: true, code: true, names: true },
      });
    }

    return {
      status: 201,
      data: {
        data: toCharacterCatalogueItemDto({
          ...created,
          language,
          strokeData: null,
        }),
      },
    };
  } catch (err: unknown) {
    return mapCharacterErrorToHttp(err);
  }
}

/**
 * Retrieves a character by its ID, strictly scoped by languageId.
 * Returns null if the character does not exist or does not belong to the specified language.
 */
export async function getCharacterById(
  languageId: string,
  id: string,
  db?: PrismaClient
) {
  if (!languageId || !id) return null;
  const client = db ?? getProductPrisma();

  return client.writingCharacter.findFirst({
    where: {
      id,
      languageId,
    },
  });
}

/**
 * Retrieves a character by glyph, strictly scoped by languageId.
 * The glyph is normalized to NFC before lookup.
 */
export async function getCharacterByGlyph(
  languageId: string,
  rawGlyph: string,
  db?: PrismaClient
) {
  if (!languageId || !rawGlyph) return null;
  const norm = validateAndNormalizeGlyph(rawGlyph);
  if (!norm.valid) return null;

  const client = db ?? getProductPrisma();

  return client.writingCharacter.findUnique({
    where: {
      languageId_glyph: {
        languageId,
        glyph: norm.glyph,
      },
    },
  });
}

/**
 * Lists characters scoped by languageId, optionally filtered by scriptType or search string.
 * Result set is paginated and ordered deterministically by stroke count then glyph.
 */
export async function listCharacters(
  params: ListCharactersParams,
  db?: PrismaClient
) {
  const { languageId, scriptType, limit = 50, offset = 0, search } = params;
  if (!languageId) {
    throw new Error('languageId is required for character lookup');
  }

  const client = db ?? getProductPrisma();
  const clampedLimit = Math.max(1, Math.min(limit, 100));
  const clampedOffset = Math.max(0, offset);
  const where = buildCharacterWhere({ languageId, scriptType, search });

  return client.writingCharacter.findMany({
    where,
    orderBy: [
      { strokeCount: 'asc' },
      { glyph: 'asc' },
    ],
    take: clampedLimit,
    skip: clampedOffset,
  });
}

/**
 * Admin API helper for listing characters across one or all languages with stroke availability status and pagination total.
 */
export async function listCharacterCatalogue(
  rawQuery: unknown,
  db?: PrismaClient
): Promise<{
  status: number;
  data?: {
    data: CharacterCatalogueItemDto[];
    total: number;
    limit: number;
    offset: number;
  };
  error?: CharacterApiError;
}> {
  const parsed = listCharactersQuerySchema.safeParse(rawQuery ?? {});
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.') || 'query';
      if (!fields[path]) {
        fields[path] = issue.message;
      }
    }
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message || 'Tham số truy vấn không hợp lệ.',
        fields,
      },
    };
  }

  const { languageId, scriptType, search, limit, offset } = parsed.data;
  const where = buildCharacterWhere({ languageId, scriptType, search });

  try {
    const client = db ?? getProductPrisma();
    const [rows, total] = await Promise.all([
      client.writingCharacter.findMany({
        where,
        orderBy: [
          { strokeCount: 'asc' },
          { glyph: 'asc' },
          { id: 'asc' },
        ],
        take: limit,
        skip: offset,
        include: {
          language: {
            select: {
              id: true,
              code: true,
              names: true,
            },
          },
          strokeData: {
            select: {
              version: true,
            },
          },
        },
      }),
      client.writingCharacter.count({ where }),
    ]);

    return {
      status: 200,
      data: {
        data: rows.map(toCharacterCatalogueItemDto),
        total,
        limit,
        offset,
      },
    };
  } catch (err: unknown) {
    return mapCharacterErrorToHttp(err);
  }
}

/**
 * Counts characters scoped by languageId, optionally filtered by scriptType.
 */
export async function countCharacters(
  params: { languageId: string; scriptType?: WritingScriptType },
  db?: PrismaClient
): Promise<number> {
  const { languageId, scriptType } = params;
  if (!languageId) return 0;

  const client = db ?? getProductPrisma();
  return client.writingCharacter.count({
    where: {
      languageId,
      ...(scriptType ? { scriptType } : {}),
    },
  });
}
