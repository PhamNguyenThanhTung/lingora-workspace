import { z } from 'zod';
import { getProductPrisma } from '../db/index.js';
import { isValidUuid, type ApiErrorEnvelope } from '../frameworks/index.ts';

export interface LevelDto {
  id: string;
  frameworkId: string;
  code: string;
  label: Record<string, string>;
  position: number;
}

export { isValidUuid };

export const createLevelSchema = z.object({
  code: z.string({ message: 'Mã cấp độ là bắt buộc' })
    .trim()
    .min(1, 'Mã cấp độ không được để trống'),
  label: z.object({
    vi: z.string({ message: 'Nhãn tiếng Việt phải là chuỗi ký tự' }).trim().optional(),
    en: z.string({ message: 'Nhãn tiếng Anh phải là chuỗi ký tự' }).trim().optional(),
  }).strict(),
  position: z.number({ message: 'Thứ tự vị trí phải là số' })
    .int('Thứ tự vị trí phải là số nguyên')
    .positive('Thứ tự vị trí phải lớn hơn 0')
    .max(2147483647, 'Thứ tự vị trí vượt quá giới hạn cho phép'),
}).strict();

export const updateLevelSchema = z.object({
  code: z.string({ message: 'Mã cấp độ là bắt buộc' })
    .trim()
    .min(1, 'Mã cấp độ không được để trống'),
  label: z.object({
    vi: z.string({ message: 'Nhãn tiếng Việt phải là chuỗi ký tự' }).trim().optional(),
    en: z.string({ message: 'Nhãn tiếng Anh phải là chuỗi ký tự' }).trim().optional(),
  }).strict(),
  position: z.number({ message: 'Thứ tự vị trí phải là số' })
    .int('Thứ tự vị trí phải là số nguyên')
    .positive('Thứ tự vị trí phải lớn hơn 0')
    .max(2147483647, 'Thứ tự vị trí vượt quá giới hạn cho phép'),
}).strict();

export function toLevelDto(record: {
  id: string;
  frameworkId: string;
  code: string;
  label: unknown;
  position: number;
}): LevelDto {
  const rawLabel = record.label;
  const label: Record<string, string> = {};
  if (typeof rawLabel === 'object' && rawLabel !== null && !Array.isArray(rawLabel)) {
    for (const [key, value] of Object.entries(rawLabel as Record<string, unknown>)) {
      if (typeof value === 'string') {
        label[key] = value;
      } else if (value != null) {
        label[key] = String(value);
      }
    }
  }

  return {
    id: record.id,
    frameworkId: record.frameworkId,
    code: record.code,
    label,
    position: record.position,
  };
}

export function handleLevelPrismaError(
  err: unknown,
  action?: 'create' | 'update' | 'delete' | 'read'
): { status: number; body: ApiErrorEnvelope } {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const prismaCode = (err as { code: string }).code;

    if (prismaCode === 'P2002') {
      const meta = (err as { meta?: { target?: unknown } }).meta as
        | { target?: string[] | string }
        | undefined;
      let isPosition = false;
      let isCode = false;

      // 1. Give structured target precedence
      if (Array.isArray(meta?.target)) {
        const targets = meta.target.map((t) => String(t).toLowerCase());
        if (targets.includes('position') || targets.some((t) => t.includes('position'))) {
          isPosition = true;
        } else if (targets.includes('code') || targets.some((t) => t.includes('code'))) {
          isCode = true;
        }
      } else if (typeof meta?.target === 'string') {
        const targetLower = meta.target.toLowerCase();
        if (targetLower.includes('position')) {
          isPosition = true;
        } else if (targetLower.includes('code')) {
          isCode = true;
        }
      }

      // 2. Fallback only to exact constraint names or failed-fields evidence, NEVER arbitrary invocation text
      if (!isPosition && !isCode) {
        const errMsg = ((err as { message?: string }).message || '').toLowerCase();
        if (
          errMsg.includes('levels_framework_id_position_key') ||
          errMsg.includes('unique constraint failed on the fields: (`framework_id`,`position`)') ||
          errMsg.includes('unique constraint failed on the fields: (`position`)') ||
          errMsg.includes('levels.position')
        ) {
          isPosition = true;
        } else if (
          errMsg.includes('levels_framework_id_code_key') ||
          errMsg.includes('unique constraint failed on the fields: (`framework_id`,`code`)') ||
          errMsg.includes('unique constraint failed on the fields: (`code`)') ||
          errMsg.includes('levels.code')
        ) {
          isCode = true;
        }
      }

      if (isPosition) {
        return {
          status: 409,
          body: {
            error: {
              code: 'DUPLICATE_LEVEL_POSITION',
              message: 'Thứ tự vị trí này đã tồn tại trong khung năng lực.',
              fields: {
                position: 'Thứ tự vị trí này đã tồn tại trong khung năng lực.',
              },
            },
          },
        };
      }

      if (isCode) {
        return {
          status: 409,
          body: {
            error: {
              code: 'DUPLICATE_LEVEL_CODE',
              message: 'Mã cấp độ này đã tồn tại trong khung năng lực.',
              fields: {
                code: 'Mã cấp độ này đã tồn tại trong khung năng lực.',
              },
            },
          },
        };
      }

      return {
        status: 409,
        body: {
          error: {
            code: 'DUPLICATE_LEVEL',
            message: 'Cấp độ bị trùng mã hoặc thứ tự vị trí trong khung năng lực.',
          },
        },
      };
    }

    if (prismaCode === 'P2003') {
      if (action === 'create' || action === 'update') {
        return {
          status: 404,
          body: {
            error: {
              code: 'NOT_FOUND',
              message: 'Khung năng lực không còn tồn tại.',
            },
          },
        };
      }

      return {
        status: 409,
        body: {
          error: {
            code: 'LEVEL_IN_USE',
            message: 'Cấp độ đang được sử dụng trong bài học hoặc khóa học, không thể xóa.',
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
            message: 'Không tìm thấy cấp độ trong hệ thống.',
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

export async function listLevels(
  frameworkId: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: LevelDto[] }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(frameworkId)) {
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
    const framework = await prisma.framework.findUnique({
      where: { id: frameworkId },
      select: { id: true },
    });

    if (!framework) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Không tìm thấy khung năng lực trong hệ thống.',
        },
      };
    }

    const rows = await prisma.level.findMany({
      where: { frameworkId },
      orderBy: [
        { position: 'asc' },
        { code: 'asc' },
        { id: 'asc' },
      ],
      select: {
        id: true,
        frameworkId: true,
        code: true,
        label: true,
        position: true,
      },
    });

    return {
      status: 200,
      data: {
        data: rows.map(toLevelDto),
      },
    };
  } catch (err) {
    const errorRes = handleLevelPrismaError(err, 'read');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function getLevel(
  frameworkId: string,
  levelId: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: LevelDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(frameworkId) || !isValidUuid(levelId)) {
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
    const framework = await prisma.framework.findUnique({
      where: { id: frameworkId },
      select: { id: true },
    });

    if (!framework) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Không tìm thấy khung năng lực trong hệ thống.',
        },
      };
    }

    const found = await prisma.level.findFirst({
      where: {
        id: levelId,
        frameworkId,
      },
      select: {
        id: true,
        frameworkId: true,
        code: true,
        label: true,
        position: true,
      },
    });

    if (!found) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Không tìm thấy cấp độ trong khung năng lực này.',
        },
      };
    }

    return {
      status: 200,
      data: {
        data: toLevelDto(found),
      },
    };
  } catch (err) {
    const errorRes = handleLevelPrismaError(err, 'read');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function createLevel(
  frameworkId: string,
  input: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: { data: LevelDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(frameworkId)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh UUID không đúng định dạng.',
      },
    };
  }

  const parseResult = createLevelSchema.safeParse(input);
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
    const framework = await prisma.framework.findUnique({
      where: { id: frameworkId },
      select: { id: true },
    });

    if (!framework) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Không tìm thấy khung năng lực trong hệ thống.',
        },
      };
    }

    const labelPayload: Record<string, string> = {};
    if (validated.label.vi && validated.label.vi.length > 0) {
      labelPayload.vi = validated.label.vi;
    }
    if (validated.label.en && validated.label.en.length > 0) {
      labelPayload.en = validated.label.en;
    }

    const created = await prisma.level.create({
      data: {
        frameworkId,
        code: validated.code,
        label: labelPayload,
        position: validated.position,
      },
      select: {
        id: true,
        frameworkId: true,
        code: true,
        label: true,
        position: true,
      },
    });

    return {
      status: 201,
      data: {
        data: toLevelDto(created),
      },
    };
  } catch (err) {
    const errorRes = handleLevelPrismaError(err, 'create');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function updateLevel(
  frameworkId: string,
  levelId: string,
  rawBody: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: { data: LevelDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(frameworkId) || !isValidUuid(levelId)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh UUID không đúng định dạng.',
      },
    };
  }

  const parseResult = updateLevelSchema.safeParse(rawBody);
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
    return await prisma.$transaction(async (tx: any) => {
      const framework = await tx.framework.findUnique({
        where: { id: frameworkId },
        select: { id: true },
      });

      if (!framework) {
        return {
          status: 404,
          error: {
            code: 'NOT_FOUND',
            message: 'Không tìm thấy khung năng lực trong hệ thống.',
          },
        };
      }

      const existing = await tx.level.findFirst({
        where: {
          id: levelId,
          frameworkId,
        },
        select: {
          id: true,
          frameworkId: true,
          code: true,
          label: true,
          position: true,
        },
      });

      if (!existing) {
        return {
          status: 404,
          error: {
            code: 'NOT_FOUND',
            message: 'Không tìm thấy cấp độ trong khung năng lực này.',
          },
        };
      }

      const mergedLabel: Record<string, unknown> =
        typeof existing.label === 'object' && existing.label !== null && !Array.isArray(existing.label)
          ? { ...(existing.label as Record<string, unknown>) }
          : {};

      if (validated.label.vi !== undefined) {
        if (validated.label.vi.length > 0) {
          mergedLabel.vi = validated.label.vi;
        } else {
          delete mergedLabel.vi;
        }
      }

      if (validated.label.en !== undefined) {
        if (validated.label.en.length > 0) {
          mergedLabel.en = validated.label.en;
        } else {
          delete mergedLabel.en;
        }
      }

      const updateCount = await tx.level.updateMany({
        where: {
          id: levelId,
          frameworkId,
        },
        data: {
          code: validated.code,
          label: mergedLabel,
          position: validated.position,
        },
      });

      if (updateCount.count === 0) {
        return {
          status: 404,
          error: {
            code: 'NOT_FOUND',
            message: 'Không tìm thấy cấp độ trong khung năng lực này.',
          },
        };
      }

      const updated = await tx.level.findFirst({
        where: {
          id: levelId,
          frameworkId,
        },
        select: {
          id: true,
          frameworkId: true,
          code: true,
          label: true,
          position: true,
        },
      });

      return {
        status: 200,
        data: {
          data: toLevelDto(updated!),
        },
      };
    });
  } catch (err) {
    const errorRes = handleLevelPrismaError(err, 'update');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function deleteLevel(
  frameworkId: string,
  levelId: string,
  prismaClient?: any
): Promise<{ status: number; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(frameworkId) || !isValidUuid(levelId)) {
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
    const framework = await prisma.framework.findUnique({
      where: { id: frameworkId },
      select: { id: true },
    });

    if (!framework) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Không tìm thấy khung năng lực trong hệ thống.',
        },
      };
    }

    const existing = await prisma.level.findFirst({
      where: {
        id: levelId,
        frameworkId,
      },
      select: { id: true },
    });

    if (!existing) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Không tìm thấy cấp độ trong khung năng lực này.',
        },
      };
    }

    const deleteCount = await prisma.level.deleteMany({
      where: {
        id: levelId,
        frameworkId,
      },
    });

    if (deleteCount.count === 0) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Không tìm thấy cấp độ trong khung năng lực này.',
        },
      };
    }

    return { status: 204 };
  } catch (err) {
    const errorRes = handleLevelPrismaError(err, 'delete');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}
