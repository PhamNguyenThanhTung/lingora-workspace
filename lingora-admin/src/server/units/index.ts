import { z } from 'zod';
import { getProductPrisma } from '../db/index.js';
import { isValidUuid, type ApiErrorEnvelope } from '../frameworks/index.ts';

export interface UnitDto {
  id: string;
  courseId: string;
  levelId: string;
  code: string;
  names: Record<string, string>;
  position: number;
  level?: {
    id: string;
    code: string;
    label: Record<string, string>;
    position: number;
  };
}

export { isValidUuid };

export const createUnitSchema = z.object({
  levelId: z.string({ message: 'Cấp độ là bắt buộc' })
    .trim()
    .min(1, 'Cấp độ không được để trống')
    .refine(isValidUuid, 'Mã cấp độ không đúng định dạng UUID'),
  code: z.string({ message: 'Mã đơn vị là bắt buộc' })
    .trim()
    .min(1, 'Mã đơn vị không được để trống'),
  names: z.object({
    vi: z.string({ message: 'Tên tiếng Việt phải là chuỗi ký tự' }).trim().optional(),
    en: z.string({ message: 'Tên tiếng Anh phải là chuỗi ký tự' }).trim().optional(),
  }).strict(),
  position: z.number({ message: 'Thứ tự vị trí phải là số' })
    .int('Thứ tự vị trí phải là số nguyên')
    .positive('Thứ tự vị trí phải lớn hơn 0')
    .max(2147483647, 'Thứ tự vị trí vượt quá giới hạn cho phép'),
}).strict();

export const updateUnitSchema = z.object({
  levelId: z.string({ message: 'Cấp độ là bắt buộc' })
    .trim()
    .min(1, 'Cấp độ không được để trống')
    .refine(isValidUuid, 'Mã cấp độ không đúng định dạng UUID'),
  code: z.string({ message: 'Mã đơn vị là bắt buộc' })
    .trim()
    .min(1, 'Mã đơn vị không được để trống'),
  names: z.object({
    vi: z.string({ message: 'Tên tiếng Việt phải là chuỗi ký tự' }).trim().optional(),
    en: z.string({ message: 'Tên tiếng Anh phải là chuỗi ký tự' }).trim().optional(),
  }).strict(),
  position: z.number({ message: 'Thứ tự vị trí phải là số' })
    .int('Thứ tự vị trí phải là số nguyên')
    .positive('Thứ tự vị trí phải lớn hơn 0')
    .max(2147483647, 'Thứ tự vị trí vượt quá giới hạn cho phép'),
}).strict();

export function toUnitDto(record: {
  id: string;
  courseId: string;
  levelId: string;
  code: string;
  names: unknown;
  position: number;
  level?: {
    id: string;
    code: string;
    label: unknown;
    position: number;
  } | null;
}): UnitDto {
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

  const parseJsonObject = (val: unknown): Record<string, string> => {
    const res: Record<string, string> = {};
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (typeof v === 'string') {
          res[k] = v;
        } else if (v != null) {
          res[k] = String(v);
        }
      }
    }
    return res;
  };

  const dto: UnitDto = {
    id: record.id,
    courseId: record.courseId,
    levelId: record.levelId,
    code: record.code,
    names,
    position: record.position,
  };

  if (record.level) {
    dto.level = {
      id: record.level.id,
      code: record.level.code,
      label: parseJsonObject(record.level.label),
      position: record.level.position,
    };
  }

  return dto;
}

export function handleUnitPrismaError(
  err: unknown,
  action?: 'create' | 'update' | 'delete' | 'read'
): { status: number; body: ApiErrorEnvelope } {
  const safeMsg = err instanceof Error ? err.message : String(err);

  if (
    safeMsg.includes('guard_unit_scope') ||
    safeMsg.includes('Cannot change course_id or level_id of unit with lessons')
  ) {
    return {
      status: 409,
      body: {
        error: {
          code: 'SCOPE_FROZEN',
          message: 'Không thể thay đổi cấp độ của đơn vị đã có bài học.',
        },
      },
    };
  }

  if (
    safeMsg.includes('check_unit_framework_scope') ||
    safeMsg.includes('Unit level framework mismatch')
  ) {
    return {
      status: 400,
      body: {
        error: {
          code: 'INVALID_RELATION',
          message: 'Cấp độ không thuộc khung năng lực của khóa học.',
          fields: {
            levelId: 'Cấp độ không thuộc khung năng lực của khóa học.',
          },
        },
      },
    };
  }

  if (typeof err === 'object' && err !== null && 'code' in err) {
    const prismaCode = (err as { code: string }).code;

    if (prismaCode === 'P2002') {
      return {
        status: 409,
        body: {
          error: {
            code: 'DUPLICATE_UNIT_POSITION',
            message: 'Thứ tự vị trí này đã tồn tại trong cấp độ của khóa học.',
            fields: {
              position: 'Thứ tự vị trí này đã tồn tại trong cấp độ của khóa học.',
              levelId: 'Thứ tự vị trí này đã tồn tại trong cấp độ của khóa học.',
            },
          },
        },
      };
    }

    if (prismaCode === 'P2003') {
      if (action === 'delete') {
        return {
          status: 409,
          body: {
            error: {
              code: 'UNIT_IN_USE',
              message: 'Đơn vị bài học đang chứa bài học trực thuộc, không thể xóa.',
            },
          },
        };
      }
      return {
        status: 400,
        body: {
          error: {
            code: 'INVALID_RELATION',
            message: 'Khóa học hoặc cấp độ liên kết không tồn tại trong hệ thống.',
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
            message: 'Không tìm thấy đơn vị bài học trong khóa học này.',
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

    if (prismaCode === 'P2004' || safeMsg.includes('23514')) {
      return {
        status: 409,
        body: {
          error: {
            code: 'CONSTRAINT_VIOLATION',
            message: 'Thao tác vi phạm ràng buộc toàn vẹn dữ liệu của hệ thống.',
          },
        },
      };
    }
  }

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

export async function listUnits(
  courseId: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: UnitDto[] }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(courseId)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh UUID không đúng định dạng.',
      },
    };
  }

  const normalizedCourseId = courseId.toLowerCase();

  try {
    const prisma = prismaClient || getProductPrisma();
    const course = await prisma.course.findUnique({
      where: { id: normalizedCourseId },
      select: { id: true },
    });

    if (!course) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Không tìm thấy khóa học trong hệ thống.',
        },
      };
    }

    const rows = await prisma.unit.findMany({
      where: { courseId: normalizedCourseId },
      include: {
        level: {
          select: {
            id: true,
            code: true,
            label: true,
            position: true,
          },
        },
      },
    });

    // Authoritative sort: Level.position asc, Unit.position asc, Unit.id asc
    rows.sort((a: any, b: any) => {
      const posA = a.level?.position ?? 0;
      const posB = b.level?.position ?? 0;
      if (posA !== posB) return posA - posB;
      if (a.position !== b.position) return a.position - b.position;
      return String(a.id).localeCompare(String(b.id));
    });

    return {
      status: 200,
      data: {
        data: rows.map(toUnitDto),
      },
    };
  } catch (err) {
    const errorRes = handleUnitPrismaError(err, 'read');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function getUnit(
  courseId: string,
  unitId: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: UnitDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(courseId) || !isValidUuid(unitId)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh UUID không đúng định dạng.',
      },
    };
  }

  const normalizedCourseId = courseId.toLowerCase();
  const normalizedUnitId = unitId.toLowerCase();

  try {
    const prisma = prismaClient || getProductPrisma();
    const course = await prisma.course.findUnique({
      where: { id: normalizedCourseId },
      select: { id: true },
    });

    if (!course) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Không tìm thấy khóa học trong hệ thống.',
        },
      };
    }

    const found = await prisma.unit.findFirst({
      where: {
        id: normalizedUnitId,
        courseId: normalizedCourseId,
      },
      include: {
        level: {
          select: {
            id: true,
            code: true,
            label: true,
            position: true,
          },
        },
      },
    });

    if (!found) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Không tìm thấy đơn vị bài học trong khóa học này.',
        },
      };
    }

    return {
      status: 200,
      data: {
        data: toUnitDto(found),
      },
    };
  } catch (err) {
    const errorRes = handleUnitPrismaError(err, 'read');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function createUnit(
  courseId: string,
  input: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: { data: UnitDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(courseId)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh UUID không đúng định dạng.',
      },
    };
  }

  const parseResult = createUnitSchema.safeParse(input);
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
  const normalizedCourseId = courseId.toLowerCase();
  const targetLevelId = validated.levelId.toLowerCase();

  try {
    return await prisma.$transaction(async (tx: any) => {
      // Row lock on parent Course
      let currentCourse: any = null;
      if (typeof tx.$queryRaw === 'function') {
        const locked: any[] = await tx.$queryRaw`SELECT id, framework_id, curriculum_generation, row_version FROM app.courses WHERE id = ${normalizedCourseId}::uuid FOR UPDATE`;
        if (Array.isArray(locked) && locked.length > 0) {
          currentCourse = locked[0];
        }
      }

      if (!currentCourse) {
        currentCourse = await tx.course.findUnique({
          where: { id: normalizedCourseId },
          select: { id: true, frameworkId: true },
        });
      }

      if (!currentCourse) {
        return {
          status: 404,
          error: {
            code: 'NOT_FOUND',
            message: 'Không tìm thấy khóa học trong hệ thống.',
          },
        };
      }

      // Check level framework scope
      const courseFrameworkId = String(currentCourse.framework_id || currentCourse.frameworkId).toLowerCase();
      const level = await tx.level.findUnique({
        where: { id: targetLevelId },
        select: {
          id: true,
          frameworkId: true,
          code: true,
          label: true,
          position: true,
        },
      });

      if (!level) {
        return {
          status: 400,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Cấp độ không tồn tại trong hệ thống.',
            fields: {
              levelId: 'Cấp độ không tồn tại trong hệ thống.',
            },
          },
        };
      }

      level.frameworkId = String(level.frameworkId).toLowerCase();
      if (level.frameworkId !== courseFrameworkId) {
        return {
          status: 400,
          error: {
            code: 'INVALID_RELATION',
            message: 'Cấp độ không thuộc khung năng lực của khóa học.',
            fields: {
              levelId: 'Cấp độ không thuộc khung năng lực của khóa học.',
            },
          },
        };
      }

      // Pre-check triple uniqueness: (courseId, levelId, position)
      const duplicate = await tx.unit.findFirst({
        where: {
          courseId: normalizedCourseId,
          levelId: targetLevelId,
          position: validated.position,
        },
        select: { id: true },
      });

      if (duplicate) {
        return {
          status: 409,
          error: {
            code: 'DUPLICATE_UNIT_POSITION',
            message: 'Thứ tự vị trí này đã tồn tại trong cấp độ của khóa học.',
            fields: {
              position: 'Thứ tự vị trí này đã tồn tại trong cấp độ của khóa học.',
              levelId: 'Thứ tự vị trí này đã tồn tại trong cấp độ của khóa học.',
            },
          },
        };
      }

      const namesPayload: Record<string, string> = {};
      if (validated.names.vi && validated.names.vi.length > 0) {
        namesPayload.vi = validated.names.vi;
      }
      if (validated.names.en && validated.names.en.length > 0) {
        namesPayload.en = validated.names.en;
      }

      const created = await tx.unit.create({
        data: {
          courseId: normalizedCourseId,
          levelId: targetLevelId,
          code: validated.code,
          names: namesPayload,
          position: validated.position,
          rowVersion: 1n,
        },
        include: {
          level: {
            select: {
              id: true,
              code: true,
              label: true,
              position: true,
            },
          },
        },
      });

      // Increment parent course curriculumGeneration and rowVersion
      await tx.course.update({
        where: { id: normalizedCourseId },
        data: {
          curriculumGeneration: { increment: 1 },
          rowVersion: { increment: 1 },
        },
      });

      return {
        status: 201,
        data: {
          data: toUnitDto(created),
        },
      };
    });
  } catch (err) {
    const errorRes = handleUnitPrismaError(err, 'create');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function updateUnit(
  courseId: string,
  unitId: string,
  rawBody: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: { data: UnitDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(courseId) || !isValidUuid(unitId)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh UUID không đúng định dạng.',
      },
    };
  }

  const parseResult = updateUnitSchema.safeParse(rawBody);
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
  const normalizedCourseId = courseId.toLowerCase();
  const normalizedUnitId = unitId.toLowerCase();
  courseId = normalizedCourseId;
  unitId = normalizedUnitId;
  const targetLevelId = validated.levelId.toLowerCase();

  try {
    return await prisma.$transaction(async (tx: any) => {
      // Row lock on parent Course
      let currentCourse: any = null;
      if (typeof tx.$queryRaw === 'function') {
        const locked: any[] = await tx.$queryRaw`SELECT id, framework_id, curriculum_generation, row_version FROM app.courses WHERE id = ${normalizedCourseId}::uuid FOR UPDATE`;
        if (Array.isArray(locked) && locked.length > 0) {
          currentCourse = locked[0];
        }
      }

      if (!currentCourse) {
        currentCourse = await tx.course.findUnique({
          where: { id: normalizedCourseId },
          select: { id: true, frameworkId: true },
        });
      }

      if (!currentCourse) {
        return {
          status: 404,
          error: {
            code: 'NOT_FOUND',
            message: 'Không tìm thấy khóa học trong hệ thống.',
          },
        };
      }

      const existing = await tx.unit.findFirst({
        where: {
          id: normalizedUnitId,
          courseId: normalizedCourseId,
        },
        select: {
          id: true,
          levelId: true,
          code: true,
          names: true,
          position: true,
        },
      });

      if (!existing) {
        return {
          status: 404,
          error: {
            code: 'NOT_FOUND',
            message: 'Không tìm thấy đơn vị bài học trong khóa học này.',
          },
        };
      }

      // Check level framework scope
      const courseFrameworkId = String(currentCourse.framework_id || currentCourse.frameworkId).toLowerCase();
      const level = await tx.level.findUnique({
        where: { id: targetLevelId },
        select: {
          id: true,
          frameworkId: true,
          code: true,
          label: true,
          position: true,
        },
      });

      if (!level) {
        return {
          status: 400,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Cấp độ không tồn tại trong hệ thống.',
            fields: {
              levelId: 'Cấp độ không tồn tại trong hệ thống.',
            },
          },
        };
      }

      level.frameworkId = String(level.frameworkId).toLowerCase();
      if (level.frameworkId !== courseFrameworkId) {
        return {
          status: 400,
          error: {
            code: 'INVALID_RELATION',
            message: 'Cấp độ không thuộc khung năng lực của khóa học.',
            fields: {
              levelId: 'Cấp độ không thuộc khung năng lực của khóa học.',
            },
          },
        };
      }

      // If levelId changes, check guard_unit_scope (cannot change level if unit has lessons)
      if (String(existing.levelId).toLowerCase() !== targetLevelId) {
        const hasLessons = await tx.lesson.findFirst({
          where: { unitId: normalizedUnitId },
          select: { id: true },
        });
        if (hasLessons) {
          return {
            status: 409,
            error: {
              code: 'SCOPE_FROZEN',
              message: 'Không thể thay đổi cấp độ của đơn vị đã có bài học.',
            },
          };
        }
      }

      // Check triple uniqueness if levelId or position changed
      if (String(existing.levelId).toLowerCase() !== targetLevelId || existing.position !== validated.position) {
        const duplicate = await tx.unit.findFirst({
          where: {
            courseId: normalizedCourseId,
            levelId: targetLevelId,
            position: validated.position,
            NOT: { id: normalizedUnitId },
          },
          select: { id: true },
        });

        if (duplicate) {
          return {
            status: 409,
            error: {
              code: 'DUPLICATE_UNIT_POSITION',
              message: 'Thứ tự vị trí này đã tồn tại trong cấp độ của khóa học.',
              fields: {
                position: 'Thứ tự vị trí này đã tồn tại trong cấp độ của khóa học.',
                levelId: 'Thứ tự vị trí này đã tồn tại trong cấp độ của khóa học.',
              },
            },
          };
        }
      }

      // Merge names: preserve untouched other locale JSON, clear edited locale if blank
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

      // Exact selector: id + courseId
      const updateCount = await tx.unit.updateMany({
        where: {
          id: unitId,
          courseId,
        },
        data: {
          levelId: targetLevelId,
          code: validated.code,
          names: mergedNames,
          position: validated.position,
          rowVersion: { increment: 1 },
        },
      });

      if (updateCount.count === 0) {
        return {
          status: 404,
          error: {
            code: 'NOT_FOUND',
            message: 'Không tìm thấy đơn vị bài học trong khóa học này.',
          },
        };
      }

      // Increment parent course curriculumGeneration and rowVersion
      await tx.course.update({
        where: { id: normalizedCourseId },
        data: {
          curriculumGeneration: { increment: 1 },
          rowVersion: { increment: 1 },
        },
      });

      const updated = await tx.unit.findFirst({
        where: {
          id: normalizedUnitId,
          courseId: normalizedCourseId,
        },
        include: {
          level: {
            select: {
              id: true,
              code: true,
              label: true,
              position: true,
            },
          },
        },
      });

      return {
        status: 200,
        data: {
          data: toUnitDto(updated!),
        },
      };
    });
  } catch (err) {
    const errorRes = handleUnitPrismaError(err, 'update');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function deleteUnit(
  courseId: string,
  unitId: string,
  prismaClient?: any
): Promise<{ status: number; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(courseId) || !isValidUuid(unitId)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh UUID không đúng định dạng.',
      },
    };
  }

  const prisma = prismaClient || getProductPrisma();
  const normalizedCourseId = courseId.toLowerCase();
  const normalizedUnitId = unitId.toLowerCase();
  courseId = normalizedCourseId;
  unitId = normalizedUnitId;

  try {
    return await prisma.$transaction(async (tx: any) => {
      // Row lock on parent Course
      let currentCourse: any = null;
      if (typeof tx.$queryRaw === 'function') {
        const locked: any[] = await tx.$queryRaw`SELECT id, curriculum_generation, row_version FROM app.courses WHERE id = ${normalizedCourseId}::uuid FOR UPDATE`;
        if (Array.isArray(locked) && locked.length > 0) {
          currentCourse = locked[0];
        }
      }

      if (!currentCourse) {
        currentCourse = await tx.course.findUnique({
          where: { id: normalizedCourseId },
          select: { id: true },
        });
      }

      if (!currentCourse) {
        return {
          status: 404,
          error: {
            code: 'NOT_FOUND',
            message: 'Không tìm thấy khóa học trong hệ thống.',
          },
        };
      }

      const existing = await tx.unit.findFirst({
        where: {
          id: normalizedUnitId,
          courseId: normalizedCourseId,
        },
        select: { id: true },
      });

      if (!existing) {
        return {
          status: 404,
          error: {
            code: 'NOT_FOUND',
            message: 'Không tìm thấy đơn vị bài học trong khóa học này.',
          },
        };
      }

      // Check referencing lessons
      const hasLessons = await tx.lesson.findFirst({
        where: { unitId: normalizedUnitId },
        select: { id: true },
      });

      if (hasLessons) {
        return {
          status: 409,
          error: {
            code: 'UNIT_IN_USE',
            message: 'Đơn vị bài học đang chứa bài học trực thuộc, không thể xóa.',
          },
        };
      }

      // Exact selector: id + courseId
      const deleteCount = await tx.unit.deleteMany({
        where: {
          id: unitId,
          courseId,
        },
      });

      if (deleteCount.count === 0) {
        return {
          status: 404,
          error: {
            code: 'NOT_FOUND',
            message: 'Không tìm thấy đơn vị bài học trong khóa học này.',
          },
        };
      }

      // Increment parent course curriculumGeneration and rowVersion
      await tx.course.update({
        where: { id: normalizedCourseId },
        data: {
          curriculumGeneration: { increment: 1 },
          rowVersion: { increment: 1 },
        },
      });

      return { status: 204 };
    });
  } catch (err) {
    const errorRes = handleUnitPrismaError(err, 'delete');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}
