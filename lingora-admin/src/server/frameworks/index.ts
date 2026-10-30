import { z } from 'zod';
import { getProductPrisma } from '../db/index.js';

export interface FrameworkDto {
  id: string;
  code: string;
  version: string;
  names: Record<string, string>;
  levelCount: number;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export const createFrameworkSchema = z.object({
  code: z.string({ message: 'Mã khung là bắt buộc' })
    .trim()
    .min(1, 'Mã khung không được để trống'),
  version: z.string({ message: 'Phiên bản là bắt buộc' })
    .trim()
    .min(1, 'Phiên bản không được để trống'),
  names: z.object({
    vi: z.string({ message: 'Tên tiếng Việt phải là chuỗi ký tự' }).trim().optional(),
    en: z.string({ message: 'Tên tiếng Anh phải là chuỗi ký tự' }).trim().optional(),
  }).strict(),
}).strict();

export const updateFrameworkSchema = z.object({
  code: z.string({ message: 'Mã khung là bắt buộc' })
    .trim()
    .min(1, 'Mã khung không được để trống'),
  version: z.string({ message: 'Phiên bản là bắt buộc' })
    .trim()
    .min(1, 'Phiên bản không được để trống'),
  names: z.object({
    vi: z.string({ message: 'Tên tiếng Việt phải là chuỗi ký tự' }).trim().optional(),
    en: z.string({ message: 'Tên tiếng Anh phải là chuỗi ký tự' }).trim().optional(),
  }).strict(),
}).strict();

export function toFrameworkDto(record: {
  id: string;
  code: string;
  version: string;
  names: unknown;
  _count?: { levels?: number };
  levelCount?: number;
  levels?: unknown[];
}): FrameworkDto {
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

  let count = 0;
  if (typeof record.levelCount === 'number') {
    count = record.levelCount;
  } else if (typeof record._count?.levels === 'number') {
    count = record._count.levels;
  } else if (Array.isArray(record.levels)) {
    count = record.levels.length;
  }

  return {
    id: record.id,
    code: record.code,
    version: record.version,
    names,
    levelCount: count,
  };
}

export function handleFrameworkPrismaError(err: unknown): { status: number; body: ApiErrorEnvelope } {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const prismaCode = (err as { code: string }).code;
    if (prismaCode === 'P2002') {
      return {
        status: 409,
        body: {
          error: {
            code: 'DUPLICATE_CODE_VERSION',
            message: 'Cặp mã khung và phiên bản này đã tồn tại trong hệ thống.',
            fields: {
              code: 'Cặp mã khung và phiên bản này đã tồn tại trong hệ thống.',
              version: 'Cặp mã khung và phiên bản này đã tồn tại trong hệ thống.',
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
            code: 'FRAMEWORK_IN_USE',
            message: 'Khung năng lực đang được sử dụng hoặc có cấp độ trực thuộc, không thể xóa.',
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
            message: 'Không tìm thấy khung năng lực trong hệ thống.',
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

export async function listFrameworks(
  prismaClient?: any
): Promise<{ status: number; data?: { data: FrameworkDto[] }; error?: ApiErrorEnvelope['error'] }> {
  try {
    const prisma = prismaClient || getProductPrisma();
    const rows = await prisma.framework.findMany({
      orderBy: [
        { code: 'asc' },
        { version: 'asc' },
      ],
      select: {
        id: true,
        code: true,
        version: true,
        names: true,
        _count: {
          select: { levels: true },
        },
      },
    });

    return {
      status: 200,
      data: {
        data: rows.map(toFrameworkDto),
      },
    };
  } catch (err) {
    const errorRes = handleFrameworkPrismaError(err);
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function getFramework(
  id: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: FrameworkDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(id)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh UUID không đúng định dạng.',
      },
    };
  }

  try {
    const prisma = prismaClient || getProductPrisma();
    const found = await prisma.framework.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        version: true,
        names: true,
        _count: {
          select: { levels: true },
        },
      },
    });

    if (!found) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Không tìm thấy khung năng lực trong hệ thống.',
        },
      };
    }

    return {
      status: 200,
      data: {
        data: toFrameworkDto(found),
      },
    };
  } catch (err) {
    const errorRes = handleFrameworkPrismaError(err);
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function createFramework(
  input: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: { data: FrameworkDto }; error?: ApiErrorEnvelope['error'] }> {
  const parseResult = createFrameworkSchema.safeParse(input);
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
  const namesPayload: Record<string, string> = {};
  if (validated.names.vi && validated.names.vi.length > 0) {
    namesPayload.vi = validated.names.vi;
  }
  if (validated.names.en && validated.names.en.length > 0) {
    namesPayload.en = validated.names.en;
  }

  try {
    const prisma = prismaClient || getProductPrisma();
    const created = await prisma.framework.create({
      data: {
        code: validated.code,
        version: validated.version,
        names: namesPayload,
      },
      select: {
        id: true,
        code: true,
        version: true,
        names: true,
      },
    });

    return {
      status: 201,
      data: {
        data: toFrameworkDto({ ...created, levelCount: 0 }),
      },
    };
  } catch (err) {
    const errorRes = handleFrameworkPrismaError(err);
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function updateFramework(
  id: string,
  rawBody: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: { data: FrameworkDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(id)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh UUID không đúng định dạng.',
      },
    };
  }

  const parseResult = updateFrameworkSchema.safeParse(rawBody);
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
    const existing = await prisma.framework.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        version: true,
        names: true,
        _count: {
          select: { levels: true },
        },
      },
    });

    if (!existing) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Không tìm thấy khung năng lực trong hệ thống.',
        },
      };
    }

    const mergedNames: Record<string, unknown> =
      typeof existing.names === 'object' && existing.names !== null && !Array.isArray(existing.names)
        ? { ...(existing.names as Record<string, unknown>) }
        : {};

    if (validated.names.vi !== undefined) {
      if (validated.names.vi.length > 0) {
        mergedNames.vi = validated.names.vi;
      } else {
        delete mergedNames.vi;
      }
    }

    if (validated.names.en !== undefined) {
      if (validated.names.en.length > 0) {
        mergedNames.en = validated.names.en;
      } else {
        delete mergedNames.en;
      }
    }

    const updated = await prisma.framework.update({
      where: { id },
      data: {
        code: validated.code,
        version: validated.version,
        names: mergedNames,
      },
      select: {
        id: true,
        code: true,
        version: true,
        names: true,
        _count: {
          select: { levels: true },
        },
      },
    });

    return {
      status: 200,
      data: {
        data: toFrameworkDto(updated),
      },
    };
  } catch (err) {
    const errorRes = handleFrameworkPrismaError(err);
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function deleteFramework(
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
    const existing = await prisma.framework.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Không tìm thấy khung năng lực trong hệ thống.',
        },
      };
    }

    await prisma.framework.delete({
      where: { id },
    });

    return { status: 204 };
  } catch (err) {
    const errorRes = handleFrameworkPrismaError(err);
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}
