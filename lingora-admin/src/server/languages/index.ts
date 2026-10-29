import { z } from 'zod';
import { getProductPrisma } from '../db/index.js';

export interface LanguageDto {
  id: string;
  code: string;
  names: Record<string, string>;
  isLearnable: boolean;
  isUiLocale: boolean;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export const createLanguageSchema = z.object({
  code: z.string({ message: 'Mã ngôn ngữ là bắt buộc' })
    .regex(/^[a-z0-9]{2,10}(-[a-z0-9]+)?$/, 'Mã ngôn ngữ phải là chữ thường và số (2–10 ký tự, có thể có gạch ngang)')
    .refine((val) => val.length >= 2 && val.length <= 10, 'Tổng độ dài mã ngôn ngữ phải từ 2 đến 10 ký tự'),
  names: z.object({
    vi: z.string({ message: 'Tên tiếng Việt là bắt buộc' })
      .trim()
      .min(1, 'Tên tiếng Việt không được để trống')
      .max(100, 'Tên tiếng Việt không được vượt quá 100 ký tự'),
    en: z.string({ message: 'Tên tiếng Anh phải là chuỗi ký tự' })
      .trim()
      .max(100, 'Tên tiếng Anh không được vượt quá 100 ký tự')
      .optional(),
  }).strict(),
  isLearnable: z.boolean({ message: 'Trạng thái có thể học là bắt buộc' }),
  isUiLocale: z.boolean({ message: 'Trạng thái làm giao diện là bắt buộc' }),
}).strict();

export const updateLanguageSchema = z.object({
  names: z.object({
    vi: z.string({ message: 'Tên tiếng Việt là bắt buộc' })
      .trim()
      .min(1, 'Tên tiếng Việt không được để trống')
      .max(100, 'Tên tiếng Việt không được vượt quá 100 ký tự'),
    en: z.string({ message: 'Tên tiếng Anh phải là chuỗi ký tự' })
      .trim()
      .max(100, 'Tên tiếng Anh không được vượt quá 100 ký tự')
      .optional(),
  }).strict(),
  isLearnable: z.boolean({ message: 'Trạng thái có thể học là bắt buộc' }),
  isUiLocale: z.boolean({ message: 'Trạng thái làm giao diện là bắt buộc' }),
}).strict();

export function toLanguageDto(record: {
  id: string;
  code: string;
  names: unknown;
  isLearnable: boolean;
  isUiLocale: boolean;
}): LanguageDto {
  const rawNames = record.names;
  const names: Record<string, string> = {};
  if (typeof rawNames === 'object' && rawNames !== null && !Array.isArray(rawNames)) {
    for (const [key, value] of Object.entries(rawNames as Record<string, unknown>)) {
      if (typeof value === 'string') {
        names[key] = value;
      } else if (value != null) {
        names[key] = String(value);
      }
    }
  }
  return {
    id: record.id,
    code: record.code,
    names,
    isLearnable: Boolean(record.isLearnable),
    isUiLocale: Boolean(record.isUiLocale),
  };
}

export function handlePrismaError(err: unknown): { status: number; body: ApiErrorEnvelope } {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const prismaCode = (err as { code: string }).code;
    if (prismaCode === 'P2002') {
      return {
        status: 409,
        body: {
          error: {
            code: 'DUPLICATE_CODE',
            message: 'Mã ngôn ngữ này đã tồn tại trong hệ thống.',
            fields: {
              code: 'Mã ngôn ngữ này đã tồn tại trong hệ thống.',
            },
          },
        },
      };
    }
    if (prismaCode === 'P2003') {
      return {
        status: 409,
        body: {
          error: {
            code: 'LANGUAGE_IN_USE',
            message: 'Ngôn ngữ đang được sử dụng trong các khóa học hoặc tài khoản người dùng.',
          },
        },
      };
    }
    if (prismaCode === 'P2025') {
      return {
        status: 404,
        body: {
          error: {
            code: 'NOT_FOUND',
            message: 'Không tìm thấy ngôn ngữ trong hệ thống.',
          },
        },
      };
    }
    if (
      prismaCode === 'P1000' ||
      prismaCode === 'P1001' ||
      prismaCode === 'P1002' ||
      prismaCode === 'P1008' ||
      prismaCode === 'P1017' ||
      prismaCode === 'P2024'
    ) {
      return {
        status: 503,
        body: {
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
          },
        },
      };
    }
  }

  const safeMsg = err instanceof Error ? err.message : String(err);
  if (
    safeMsg.includes('connect') ||
    safeMsg.includes('Connection') ||
    safeMsg.includes('DATABASE_URL') ||
    safeMsg.includes('timeout')
  ) {
    return {
      status: 503,
      body: {
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Đã xảy ra lỗi không mong muốn từ hệ thống máy chủ.',
      },
    },
  };
}

/**
 * Service operations
 */
export async function listLanguages(prismaClient?: any): Promise<{ status: number; data?: { data: LanguageDto[] }; error?: ApiErrorEnvelope['error'] }> {
  try {
    const prisma = prismaClient || getProductPrisma();
    const rows = await prisma.language.findMany({
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        names: true,
        isLearnable: true,
        isUiLocale: true,
      },
    });
    return {
      status: 200,
      data: {
        data: rows.map(toLanguageDto),
      },
    };
  } catch (err) {
    const errorRes = handlePrismaError(err);
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function createLanguage(
  input: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: { data: LanguageDto }; error?: ApiErrorEnvelope['error'] }> {
  const parseResult = createLanguageSchema.safeParse(input);
  if (!parseResult.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parseResult.error.issues) {
      const path = issue.path.join('.');
      fieldErrors[path] = issue.message;
    }
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Dữ liệu không hợp lệ.',
        fields: fieldErrors,
      },
    };
  }

  const validated = parseResult.data;
  const namesPayload: Record<string, string> = {
    vi: validated.names.vi,
  };
  if (validated.names.en && validated.names.en.length > 0) {
    namesPayload.en = validated.names.en;
  }

  try {
    const prisma = prismaClient || getProductPrisma();
    const created = await prisma.language.create({
      data: {
        code: validated.code,
        names: namesPayload,
        isLearnable: validated.isLearnable,
        isUiLocale: validated.isUiLocale,
      },
      select: {
        id: true,
        code: true,
        names: true,
        isLearnable: true,
        isUiLocale: true,
      },
    });

    return {
      status: 201,
      data: {
        data: toLanguageDto(created),
      },
    };
  } catch (err) {
    const errorRes = handlePrismaError(err);
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function updateLanguage(
  id: string,
  rawBody: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: { data: LanguageDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(id)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh UUID không đúng định dạng.',
      },
    };
  }

  if (typeof rawBody === 'object' && rawBody !== null && 'code' in rawBody) {
    return {
      status: 400,
      error: {
        code: 'IMMUTABLE_FIELD',
        message: 'Mã ngôn ngữ không thể thay đổi sau khi tạo.',
        fields: {
          code: 'Mã ngôn ngữ không thể thay đổi sau khi tạo.',
        },
      },
    };
  }

  const parseResult = updateLanguageSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parseResult.error.issues) {
      const path = issue.path.join('.');
      fieldErrors[path] = issue.message;
    }
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Dữ liệu không hợp lệ.',
        fields: fieldErrors,
      },
    };
  }

  const validated = parseResult.data;
  const prisma = prismaClient || getProductPrisma();

  try {
    // Read existing to preserve other locales
    const existing = await prisma.language.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        names: true,
        isLearnable: true,
        isUiLocale: true,
      },
    });

    if (!existing) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Không tìm thấy ngôn ngữ trong hệ thống.',
        },
      };
    }

    const mergedNames: Record<string, unknown> =
      typeof existing.names === 'object' && existing.names !== null && !Array.isArray(existing.names)
        ? { ...(existing.names as Record<string, unknown>) }
        : {};

    mergedNames.vi = validated.names.vi;
    if (validated.names.en && validated.names.en.length > 0) {
      mergedNames.en = validated.names.en;
    } else {
      delete mergedNames.en;
    }

    const updated = await prisma.language.update({
      where: { id },
      data: {
        names: mergedNames,
        isLearnable: validated.isLearnable,
        isUiLocale: validated.isUiLocale,
      },
      select: {
        id: true,
        code: true,
        names: true,
        isLearnable: true,
        isUiLocale: true,
      },
    });

    return {
      status: 200,
      data: {
        data: toLanguageDto(updated),
      },
    };
  } catch (err) {
    const errorRes = handlePrismaError(err);
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function deleteLanguage(
  id: string,
  prismaClient?: any
): Promise<{ status: number; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(id)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh UUID không đúng định dạng.',
      },
    };
  }

  const prisma = prismaClient || getProductPrisma();

  try {
    // First verify record exists so absent record returns 404
    const existing = await prisma.language.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Không tìm thấy ngôn ngữ trong hệ thống.',
        },
      };
    }

    await prisma.language.delete({
      where: { id },
    });

    return { status: 204 };
  } catch (err) {
    const errorRes = handlePrismaError(err);
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}
