import { z } from 'zod';
import { getProductPrisma } from '../db/index.js';
import { isValidUuid, type ApiErrorEnvelope } from '../frameworks/index.ts';

export interface CourseDto {
  id: string;
  languageId: string;
  frameworkId: string;
  defaultStartLevelId: string;
  names: Record<string, string>;
  isActive: boolean;
  curriculumGeneration: number;
  unitCount: number;
  language?: {
    id: string;
    code: string;
    names: Record<string, string>;
  };
  framework?: {
    id: string;
    code: string;
    version: string;
    names: Record<string, string>;
  };
  defaultStartLevel?: {
    id: string;
    code: string;
    label: Record<string, string>;
    position: number;
  };
}

export { isValidUuid };

export const createCourseSchema = z.object({
  languageId: z.string({ message: 'Ngôn ngữ học là bắt buộc' })
    .trim()
    .min(1, 'Ngôn ngữ học không được để trống')
    .refine(isValidUuid, 'Mã ngôn ngữ học không đúng định dạng UUID'),
  frameworkId: z.string({ message: 'Khung năng lực là bắt buộc' })
    .trim()
    .min(1, 'Khung năng lực không được để trống')
    .refine(isValidUuid, 'Mã khung năng lực không đúng định dạng UUID'),
  defaultStartLevelId: z.string({ message: 'Cấp độ bắt đầu mặc định là bắt buộc' })
    .trim()
    .min(1, 'Cấp độ bắt đầu mặc định không được để trống')
    .refine(isValidUuid, 'Mã cấp độ bắt đầu không đúng định dạng UUID'),
  names: z.object({
    vi: z.string({ message: 'Tên tiếng Việt phải là chuỗi ký tự' }).trim().optional(),
    en: z.string({ message: 'Tên tiếng Anh phải là chuỗi ký tự' }).trim().optional(),
  }).strict(),
  isActive: z.boolean({ message: 'Trạng thái hoạt động là bắt buộc' }),
}).strict();

export const updateCourseSchema = z.object({
  languageId: z.string({ message: 'Ngôn ngữ học là bắt buộc' })
    .trim()
    .min(1, 'Ngôn ngữ học không được để trống')
    .refine(isValidUuid, 'Mã ngôn ngữ học không đúng định dạng UUID'),
  frameworkId: z.string({ message: 'Khung năng lực là bắt buộc' })
    .trim()
    .min(1, 'Khung năng lực không được để trống')
    .refine(isValidUuid, 'Mã khung năng lực không đúng định dạng UUID'),
  defaultStartLevelId: z.string({ message: 'Cấp độ bắt đầu mặc định là bắt buộc' })
    .trim()
    .min(1, 'Cấp độ bắt đầu mặc định không được để trống')
    .refine(isValidUuid, 'Mã cấp độ bắt đầu không đúng định dạng UUID'),
  names: z.object({
    vi: z.string({ message: 'Tên tiếng Việt phải là chuỗi ký tự' }).trim().optional(),
    en: z.string({ message: 'Tên tiếng Anh phải là chuỗi ký tự' }).trim().optional(),
  }).strict(),
  isActive: z.boolean({ message: 'Trạng thái hoạt động là bắt buộc' }),
}).strict();

export function toCourseDto(record: {
  id: string;
  languageId: string;
  frameworkId: string;
  defaultStartLevelId: string;
  names: unknown;
  isActive: boolean;
  curriculumGeneration?: bigint | number;
  unitCount?: number;
  _count?: { units?: number };
  units?: unknown[];
  language?: {
    id: string;
    code: string;
    names: unknown;
  } | null;
  framework?: {
    id: string;
    code: string;
    version: string;
    names: unknown;
  } | null;
  defaultStartLevel?: {
    id: string;
    code: string;
    label: unknown;
    position: number;
  } | null;
}): CourseDto {
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
  if (typeof record.unitCount === 'number') {
    count = record.unitCount;
  } else if (typeof record._count?.units === 'number') {
    count = record._count.units;
  } else if (Array.isArray(record.units)) {
    count = record.units.length;
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

  const dto: CourseDto = {
    id: record.id,
    languageId: record.languageId,
    frameworkId: record.frameworkId,
    defaultStartLevelId: record.defaultStartLevelId,
    names,
    isActive: Boolean(record.isActive),
    curriculumGeneration:
      typeof record.curriculumGeneration === 'bigint'
        ? Number(record.curriculumGeneration)
        : typeof record.curriculumGeneration === 'number'
        ? record.curriculumGeneration
        : 1,
    unitCount: count,
  };

  if (record.language) {
    dto.language = {
      id: record.language.id,
      code: record.language.code,
      names: parseJsonObject(record.language.names),
    };
  }

  if (record.framework) {
    dto.framework = {
      id: record.framework.id,
      code: record.framework.code,
      version: record.framework.version,
      names: parseJsonObject(record.framework.names),
    };
  }

  if (record.defaultStartLevel) {
    dto.defaultStartLevel = {
      id: record.defaultStartLevel.id,
      code: record.defaultStartLevel.code,
      label: parseJsonObject(record.defaultStartLevel.label),
      position: record.defaultStartLevel.position,
    };
  }

  return dto;
}

export function handleCoursePrismaError(
  err: unknown,
  action?: 'create' | 'update' | 'delete' | 'read'
): { status: number; body: ApiErrorEnvelope } {
  const safeMsg = err instanceof Error ? err.message : String(err);

  // Check specific business triggers & PostgreSQL check violation codes
  if (
    safeMsg.includes('guard_course_scope') ||
    safeMsg.includes('Cannot change language_id or framework_id')
  ) {
    return {
      status: 409,
      body: {
        error: {
          code: 'SCOPE_FROZEN',
          message: 'Không thể thay đổi ngôn ngữ hoặc khung năng lực của khóa học đã có dữ liệu trực thuộc.',
        },
      },
    };
  }

  if (
    safeMsg.includes('guard_course_available_lessons') ||
    safeMsg.includes('Cannot deactivate course with AVAILABLE lessons')
  ) {
    return {
      status: 409,
      body: {
        error: {
          code: 'DEACTIVATION_BLOCKED',
          message: 'Không thể ngừng kích hoạt khóa học đang có bài học khả dụng (AVAILABLE).',
        },
      },
    };
  }

  if (
    safeMsg.includes('check_course_default_level_scope') ||
    safeMsg.includes('Course default start level framework mismatch')
  ) {
    return {
      status: 400,
      body: {
        error: {
          code: 'INVALID_RELATION',
          message: 'Cấp độ bắt đầu mặc định không thuộc khung năng lực đã chọn.',
          fields: {
            defaultStartLevelId: 'Cấp độ bắt đầu mặc định không thuộc khung năng lực đã chọn.',
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
            code: 'DUPLICATE_COURSE',
            message: 'Thông tin khóa học bị xung đột dữ liệu duy nhất trong hệ thống.',
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
              code: 'COURSE_IN_USE',
              message: 'Khóa học đang được sử dụng hoặc có đơn vị bài học trực thuộc, không thể xóa.',
            },
          },
        };
      }
      return {
        status: 400,
        body: {
          error: {
            code: 'INVALID_RELATION',
            message: 'Một trong các thực thể liên kết không tồn tại trong hệ thống.',
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
            message: 'Không tìm thấy khóa học trong hệ thống.',
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

export async function listCourses(
  prismaClient?: any
): Promise<{ status: number; data?: { data: CourseDto[] }; error?: ApiErrorEnvelope['error'] }> {
  try {
    const prisma = prismaClient || getProductPrisma();
    const rows = await prisma.course.findMany({
      orderBy: [
        { createdAt: 'desc' },
        { id: 'asc' },
      ],
      include: {
        language: {
          select: {
            id: true,
            code: true,
            names: true,
          },
        },
        framework: {
          select: {
            id: true,
            code: true,
            version: true,
            names: true,
          },
        },
        defaultStartLevel: {
          select: {
            id: true,
            code: true,
            label: true,
            position: true,
          },
        },
        _count: {
          select: { units: true },
        },
      },
    });

    return {
      status: 200,
      data: {
        data: rows.map(toCourseDto),
      },
    };
  } catch (err) {
    const errorRes = handleCoursePrismaError(err, 'read');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function getCourse(
  id: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: CourseDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(id)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh UUID không đúng định dạng.',
      },
    };
  }

  const normalizedId = id.toLowerCase();

  try {
    const prisma = prismaClient || getProductPrisma();
    const found = await prisma.course.findUnique({
      where: { id: normalizedId },
      include: {
        language: {
          select: {
            id: true,
            code: true,
            names: true,
          },
        },
        framework: {
          select: {
            id: true,
            code: true,
            version: true,
            names: true,
          },
        },
        defaultStartLevel: {
          select: {
            id: true,
            code: true,
            label: true,
            position: true,
          },
        },
        _count: {
          select: { units: true },
        },
      },
    });

    if (!found) {
      return {
        status: 404,
        error: {
          code: 'NOT_FOUND',
          message: 'Không tìm thấy khóa học trong hệ thống.',
        },
      };
    }

    return {
      status: 200,
      data: {
        data: toCourseDto(found),
      },
    };
  } catch (err) {
    const errorRes = handleCoursePrismaError(err, 'read');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function createCourse(
  input: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: { data: CourseDto }; error?: ApiErrorEnvelope['error'] }> {
  const parseResult = createCourseSchema.safeParse(input);
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

  const targetLangId = validated.languageId.toLowerCase();
  const targetFwId = validated.frameworkId.toLowerCase();
  const targetStartLvlId = validated.defaultStartLevelId.toLowerCase();

  try {
    const lang = await prisma.language.findUnique({
      where: { id: targetLangId },
      select: { id: true },
    });
    if (!lang) {
      return {
        status: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ngôn ngữ học không tồn tại trong hệ thống.',
          fields: {
            languageId: 'Ngôn ngữ học không tồn tại trong hệ thống.',
          },
        },
      };
    }

    const fw = await prisma.framework.findUnique({
      where: { id: targetFwId },
      select: { id: true },
    });
    if (!fw) {
      return {
        status: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Khung năng lực không tồn tại trong hệ thống.',
          fields: {
            frameworkId: 'Khung năng lực không tồn tại trong hệ thống.',
          },
        },
      };
    }

    const lvl = await prisma.level.findUnique({
      where: { id: targetStartLvlId },
      select: { id: true, frameworkId: true },
    });
    if (!lvl) {
      return {
        status: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cấp độ bắt đầu mặc định không tồn tại trong hệ thống.',
          fields: {
            defaultStartLevelId: 'Cấp độ bắt đầu mặc định không tồn tại trong hệ thống.',
          },
        },
      };
    }

    lvl.frameworkId = String(lvl.frameworkId).toLowerCase();
    validated.frameworkId = targetFwId;
    if (lvl.frameworkId !== validated.frameworkId) {
      return {
        status: 400,
        error: {
          code: 'INVALID_RELATION',
          message: 'Cấp độ bắt đầu mặc định không thuộc khung năng lực đã chọn.',
          fields: {
            defaultStartLevelId: 'Cấp độ bắt đầu mặc định không thuộc khung năng lực đã chọn.',
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

    const created = await prisma.course.create({
      data: {
        languageId: targetLangId,
        frameworkId: targetFwId,
        defaultStartLevelId: targetStartLvlId,
        names: namesPayload,
        isActive: validated.isActive,
        curriculumGeneration: 1n,
        coverageCatalogGeneration: 1n,
        rowVersion: 1n,
        gateConfig: {},
        practiceConfig: {},
        coverageCatalog: {},
      },
      include: {
        language: {
          select: {
            id: true,
            code: true,
            names: true,
          },
        },
        framework: {
          select: {
            id: true,
            code: true,
            version: true,
            names: true,
          },
        },
        defaultStartLevel: {
          select: {
            id: true,
            code: true,
            label: true,
            position: true,
          },
        },
        _count: {
          select: { units: true },
        },
      },
    });

    return {
      status: 201,
      data: {
        data: toCourseDto(created),
      },
    };
  } catch (err) {
    const errorRes = handleCoursePrismaError(err, 'create');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function updateCourse(
  id: string,
  rawBody: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: { data: CourseDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(id)) {
    return {
      status: 400,
      error: {
        code: 'INVALID_ID',
        message: 'Mã định danh UUID không đúng định dạng.',
      },
    };
  }

  const parseResult = updateCourseSchema.safeParse(rawBody);
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

  const normalizedId = id.toLowerCase();
  const validated = parseResult.data;
  const targetLangId = validated.languageId.toLowerCase();
  const targetFwId = validated.frameworkId.toLowerCase();
  const targetStartLvlId = validated.defaultStartLevelId.toLowerCase();
  const prisma = prismaClient || getProductPrisma();

  try {
    return await prisma.$transaction(async (tx: any) => {
      // Parameterized row lock on Course
      let currentCourse: any = null;
      if (typeof tx.$queryRaw === 'function') {
        const locked: any[] = await tx.$queryRaw`SELECT id, framework_id, language_id, curriculum_generation, row_version, is_active FROM app.courses WHERE id = ${normalizedId}::uuid FOR UPDATE`;
        if (Array.isArray(locked) && locked.length > 0) {
          currentCourse = locked[0];
        }
      }

      if (!currentCourse) {
        currentCourse = await tx.course.findUnique({
          where: { id: normalizedId },
          select: {
            id: true,
            frameworkId: true,
            languageId: true,
            curriculumGeneration: true,
            rowVersion: true,
            isActive: true,
            names: true,
          },
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

      // Check referenced scope guard before writes: cannot change languageId or frameworkId if referenced
      const currentLangId = String(currentCourse.language_id || currentCourse.languageId || '').toLowerCase();
      const currentFwId = String(currentCourse.framework_id || currentCourse.frameworkId || '').toLowerCase();
      if (currentLangId !== targetLangId || currentFwId !== targetFwId) {
        const hasUnits = await tx.unit.findFirst({ where: { courseId: normalizedId }, select: { id: true } });
        const hasContexts =
          tx.learningContext && (await tx.learningContext.findFirst({ where: { courseId: normalizedId }, select: { id: true } }));
        const hasBlueprints =
          tx.assessmentBlueprint &&
          (await tx.assessmentBlueprint.findFirst({ where: { courseId: normalizedId }, select: { id: true } }));

        if (hasUnits || hasContexts || hasBlueprints) {
          return {
            status: 409,
            error: {
              code: 'SCOPE_FROZEN',
              message: 'Không thể thay đổi ngôn ngữ hoặc khung năng lực của khóa học đã có dữ liệu trực thuộc.',
            },
          };
        }
      }

      // Check deactivation guard before writes: cannot deactivate with AVAILABLE lessons
      const currentIsActive =
        currentCourse.is_active !== undefined
          ? Boolean(currentCourse.is_active)
          : Boolean(currentCourse.isActive);

      if (currentIsActive && !validated.isActive) {
        const hasAvailableLessons = await tx.lesson.findFirst({
          where: {
            unit: { courseId: normalizedId },
            availability: 'AVAILABLE',
          },
          select: { id: true },
        });
        if (hasAvailableLessons) {
          return {
            status: 409,
            error: {
              code: 'DEACTIVATION_BLOCKED',
              message: 'Không thể ngừng kích hoạt khóa học đang có bài học khả dụng (AVAILABLE).',
            },
          };
        }
      }

      // Validate relations
      const lang = await tx.language.findUnique({
        where: { id: targetLangId },
        select: { id: true },
      });
      if (!lang) {
        return {
          status: 400,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Ngôn ngữ học không tồn tại trong hệ thống.',
            fields: {
              languageId: 'Ngôn ngữ học không tồn tại trong hệ thống.',
            },
          },
        };
      }

      const fw = await tx.framework.findUnique({
        where: { id: targetFwId },
        select: { id: true },
      });
      if (!fw) {
        return {
          status: 400,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Khung năng lực không tồn tại trong hệ thống.',
            fields: {
              frameworkId: 'Khung năng lực không tồn tại trong hệ thống.',
            },
          },
        };
      }

      const lvl = await tx.level.findUnique({
        where: { id: targetStartLvlId },
        select: { id: true, frameworkId: true },
      });
      if (!lvl) {
        return {
          status: 400,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Cấp độ bắt đầu mặc định không tồn tại trong hệ thống.',
            fields: {
              defaultStartLevelId: 'Cấp độ bắt đầu mặc định không tồn tại trong hệ thống.',
            },
          },
        };
      }

      lvl.frameworkId = String(lvl.frameworkId).toLowerCase();
    validated.frameworkId = targetFwId;
    if (lvl.frameworkId !== validated.frameworkId) {
        return {
          status: 400,
          error: {
            code: 'INVALID_RELATION',
            message: 'Cấp độ bắt đầu mặc định không thuộc khung năng lực đã chọn.',
            fields: {
              defaultStartLevelId: 'Cấp độ bắt đầu mặc định không thuộc khung năng lực đã chọn.',
            },
          },
        };
      }

      // Merge names: preserve untouched other locale JSON, clear edited locale if blank
      const existingRecord = await tx.course.findUnique({ where: { id: normalizedId }, select: { names: true } });
      const mergedNames: Record<string, unknown> =
        typeof existingRecord?.names === 'object' && existingRecord.names !== null && !Array.isArray(existingRecord.names)
          ? { ...(existingRecord.names as Record<string, unknown>) }
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

      const updated = await tx.course.update({
        where: { id: normalizedId },
        data: {
          languageId: targetLangId,
          frameworkId: targetFwId,
          defaultStartLevelId: targetStartLvlId,
          names: mergedNames,
          isActive: validated.isActive,
          curriculumGeneration: { increment: 1 },
          rowVersion: { increment: 1 },
        },
        include: {
          language: {
            select: {
              id: true,
              code: true,
              names: true,
            },
          },
          framework: {
            select: {
              id: true,
              code: true,
              version: true,
              names: true,
            },
          },
          defaultStartLevel: {
            select: {
              id: true,
              code: true,
              label: true,
              position: true,
            },
          },
          _count: {
            select: { units: true },
          },
        },
      });

      return {
        status: 200,
        data: {
          data: toCourseDto(updated),
        },
      };
    });
  } catch (err) {
    const errorRes = handleCoursePrismaError(err, 'update');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}

export async function deleteCourse(
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

  const normalizedId = id.toLowerCase();
  const prisma = prismaClient || getProductPrisma();

  try {
    return await prisma.$transaction(async (tx: any) => {
      // Row lock on course
      let currentCourse: any = null;
      if (typeof tx.$queryRaw === 'function') {
        const locked: any[] = await tx.$queryRaw`SELECT id FROM app.courses WHERE id = ${normalizedId}::uuid FOR UPDATE`;
        if (Array.isArray(locked) && locked.length > 0) {
          currentCourse = locked[0];
        }
      }

      if (!currentCourse) {
        currentCourse = await tx.course.findUnique({
          where: { id: normalizedId },
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

      // Check referencing relations
      const unitRef = await tx.unit.findFirst({ where: { courseId: normalizedId }, select: { id: true } });
      const ctxRef =
        tx.learningContext && (await tx.learningContext.findFirst({ where: { courseId: normalizedId }, select: { id: true } }));
      const bpRef =
        tx.assessmentBlueprint &&
        (await tx.assessmentBlueprint.findFirst({ where: { courseId: normalizedId }, select: { id: true } }));

      if (unitRef || ctxRef || bpRef) {
        return {
          status: 409,
          error: {
            code: 'COURSE_IN_USE',
            message: 'Khóa học đang được sử dụng hoặc có đơn vị bài học trực thuộc, không thể xóa.',
          },
        };
      }

      await tx.course.delete({
        where: { id: normalizedId },
      });

      return { status: 204 };
    });
  } catch (err) {
    const errorRes = handleCoursePrismaError(err, 'delete');
    return {
      status: errorRes.status,
      error: errorRes.body.error,
    };
  }
}
