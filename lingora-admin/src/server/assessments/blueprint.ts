import { getProductPrisma } from '../db/index.js';
import { isValidUuid, type ApiErrorEnvelope } from '../frameworks/index.ts';
import { canonicalJsonStringify } from '../lessons/content.ts';
import {
  createBlueprintSchema,
  updateBlueprintSchema,
  validateBlueprintComposition,
} from './schemas.ts';
import type {
  AssessmentBlueprintDto,
  BlueprintCoverage,
  BlueprintRequirements,
  BlueprintConfig,
  AssessmentPurpose,
} from './types.ts';

export class BlueprintError extends Error {
  status: number;
  error: ApiErrorEnvelope['error'];
  constructor(status: number, error: ApiErrorEnvelope['error']) {
    super(error?.message || 'BlueprintError');
    this.status = status;
    this.error = error;
    this.name = 'BlueprintError';
  }
}

async function verifyActiveAdmin(adminAccountId: string, prisma: any): Promise<void> {
  const account = await prisma.account.findUnique({
    where: { id: adminAccountId.toLowerCase() },
    select: { id: true, role: true, status: true },
  });

  if (!account || account.role !== 'ADMIN') {
    throw new BlueprintError(403, {
      code: 'FORBIDDEN',
      message: 'Chỉ quản trị viên mới có quyền quản lý khung đánh giá (Blueprint).',
    });
  }

  if (account.status !== 'ACTIVE') {
    throw new BlueprintError(403, {
      code: 'ACCOUNT_INACTIVE',
      message: 'Tài khoản quản trị viên đang chờ duyệt hoặc đã bị vô hiệu hóa.',
    });
  }
}

export function toBlueprintDto(bp: any): AssessmentBlueprintDto {
  return {
    id: bp.id,
    createdBy: bp.createdBy,
    languageId: bp.languageId,
    frameworkId: bp.frameworkId,
    courseId: bp.courseId,
    purpose: bp.purpose as AssessmentPurpose,
    targetLevelId: bp.targetLevelId || null,
    nextLevelId: bp.nextLevelId || null,
    coverage: bp.coverage as BlueprintCoverage,
    requirements: bp.requirements as BlueprintRequirements,
    config: bp.config as BlueprintConfig,
    coverageCatalogGeneration: (bp.coverageCatalogGeneration ?? 1n).toString(),
    generation: (bp.generation ?? 1n).toString(),
    createdAt: bp.createdAt instanceof Date ? bp.createdAt.toISOString() : new Date(bp.createdAt).toISOString(),
    updatedAt: bp.updatedAt instanceof Date ? bp.updatedAt.toISOString() : new Date(bp.updatedAt).toISOString(),
    rowVersion: (bp.rowVersion ?? 1n).toString(),
    course: bp.course
      ? {
          id: bp.course.id,
          names: bp.course.names || {},
        }
      : undefined,
    language: bp.language
      ? {
          id: bp.language.id,
          code: bp.language.code,
          names: bp.language.names || {},
        }
      : undefined,
    framework: bp.framework
      ? {
          id: bp.framework.id,
          code: bp.framework.code,
          version: bp.framework.version,
          names: bp.framework.names || {},
        }
      : undefined,
    targetLevel: bp.targetLevel
      ? {
          id: bp.targetLevel.id,
          code: bp.targetLevel.code,
          position: bp.targetLevel.position,
          label: bp.targetLevel.label || {},
        }
      : null,
    nextLevel: bp.nextLevel
      ? {
          id: bp.nextLevel.id,
          code: bp.nextLevel.code,
          position: bp.nextLevel.position,
          label: bp.nextLevel.label || {},
        }
      : null,
    versionCount: bp._count?.versions ?? (Array.isArray(bp.versions) ? bp.versions.length : undefined),
  };
}

export async function listBlueprints(
  adminAccountId: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: AssessmentBlueprintDto[] }; error?: ApiErrorEnvelope['error'] }> {
  const prisma = prismaClient || getProductPrisma();
  try {
    await verifyActiveAdmin(adminAccountId, prisma);

    const blueprints = await prisma.assessmentBlueprint.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { id: true, names: true } },
        language: { select: { id: true, code: true, names: true } },
        framework: { select: { id: true, code: true, version: true, names: true } },
        targetLevel: { select: { id: true, code: true, position: true, label: true } },
        nextLevel: { select: { id: true, code: true, position: true, label: true } },
        _count: { select: { versions: true } },
      },
    });

    return {
      status: 200,
      data: { data: blueprints.map(toBlueprintDto) },
    };
  } catch (err) {
    if (err instanceof BlueprintError) {
      return { status: err.status, error: err.error };
    }
    return {
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }
}

export async function getBlueprint(
  adminAccountId: string,
  blueprintId: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: AssessmentBlueprintDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(blueprintId)) {
    return {
      status: 400,
      error: { code: 'INVALID_ID', message: 'Mã định danh khung đánh giá không đúng định dạng UUID.' },
    };
  }

  const prisma = prismaClient || getProductPrisma();
  try {
    await verifyActiveAdmin(adminAccountId, prisma);

    const bp = await prisma.assessmentBlueprint.findUnique({
      where: { id: blueprintId.toLowerCase() },
      include: {
        course: { select: { id: true, names: true } },
        language: { select: { id: true, code: true, names: true } },
        framework: { select: { id: true, code: true, version: true, names: true } },
        targetLevel: { select: { id: true, code: true, position: true, label: true } },
        nextLevel: { select: { id: true, code: true, position: true, label: true } },
        _count: { select: { versions: true } },
      },
    });

    if (!bp) {
      return {
        status: 404,
        error: { code: 'BLUEPRINT_NOT_FOUND', message: 'Không tìm thấy khung đánh giá yêu cầu.' },
      };
    }

    return {
      status: 200,
      data: { data: toBlueprintDto(bp) },
    };
  } catch (err) {
    if (err instanceof BlueprintError) {
      return { status: err.status, error: err.error };
    }
    return {
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }
}

export async function createBlueprint(
  adminAccountId: string,
  rawInput: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: { data: AssessmentBlueprintDto }; error?: ApiErrorEnvelope['error'] }> {
  const parseResult = createBlueprintSchema.safeParse(rawInput);
  if (!parseResult.success) {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Dữ liệu không hợp lệ.',
        fields: Object.fromEntries(
          parseResult.error.issues.map((issue) => [issue.path.join('.'), issue.message])
        ),
      },
    };
  }

  const input = parseResult.data;
  const prisma = prismaClient || getProductPrisma();

  try {
    await verifyActiveAdmin(adminAccountId, prisma);

    // 1. Fetch Course and derive languageId, frameworkId
    const course = await prisma.course.findUnique({
      where: { id: input.courseId.toLowerCase() },
      select: {
        id: true,
        languageId: true,
        frameworkId: true,
        coverageCatalogGeneration: true,
      },
    });

    if (!course) {
      return {
        status: 404,
        error: { code: 'COURSE_NOT_FOUND', message: 'Khóa học được chọn không tồn tại.' },
      };
    }

    // 2. Validate nullable Level FKs against that Framework
    if (input.targetLevelId) {
      const targetLevel = await prisma.level.findUnique({
        where: { id: input.targetLevelId.toLowerCase() },
        select: { id: true, frameworkId: true },
      });
      if (!targetLevel || targetLevel.frameworkId.toLowerCase() !== course.frameworkId.toLowerCase()) {
        return {
          status: 400,
          error: {
            code: 'LEVEL_FRAMEWORK_MISMATCH',
            message: 'Cấp độ mục tiêu (targetLevelId) không thuộc khung năng lực của khóa học.',
          },
        };
      }
    }

    if (input.nextLevelId) {
      const nextLevel = await prisma.level.findUnique({
        where: { id: input.nextLevelId.toLowerCase() },
        select: { id: true, frameworkId: true },
      });
      if (!nextLevel || nextLevel.frameworkId.toLowerCase() !== course.frameworkId.toLowerCase()) {
        return {
          status: 400,
          error: {
            code: 'LEVEL_FRAMEWORK_MISMATCH',
            message: 'Cấp độ tiếp theo (nextLevelId) không thuộc khung năng lực của khóa học.',
          },
        };
      }
    }

    // 3. Persist new AssessmentBlueprint
    const newBp = await prisma.assessmentBlueprint.create({
      data: {
        createdBy: adminAccountId.toLowerCase(),
        courseId: course.id,
        languageId: course.languageId,
        frameworkId: course.frameworkId,
        purpose: input.purpose,
        targetLevelId: input.targetLevelId ? input.targetLevelId.toLowerCase() : null,
        nextLevelId: input.nextLevelId ? input.nextLevelId.toLowerCase() : null,
        coverage: input.coverage,
        requirements: input.requirements,
        config: input.config,
        coverageCatalogGeneration: course.coverageCatalogGeneration ?? 1n,
        generation: 1n,
        rowVersion: 1n,
      },
      include: {
        course: { select: { id: true, names: true } },
        language: { select: { id: true, code: true, names: true } },
        framework: { select: { id: true, code: true, version: true, names: true } },
        targetLevel: { select: { id: true, code: true, position: true, label: true } },
        nextLevel: { select: { id: true, code: true, position: true, label: true } },
        _count: { select: { versions: true } },
      },
    });

    return {
      status: 201,
      data: { data: toBlueprintDto(newBp) },
    };
  } catch (err) {
    if (err instanceof BlueprintError) {
      return { status: err.status, error: err.error };
    }
    return {
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }
}

export async function updateBlueprint(
  adminAccountId: string,
  blueprintId: string,
  rawInput: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: { data: AssessmentBlueprintDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(blueprintId)) {
    return {
      status: 400,
      error: { code: 'INVALID_ID', message: 'Mã định danh khung đánh giá không đúng định dạng UUID.' },
    };
  }

  const parseResult = updateBlueprintSchema.safeParse(rawInput);
  if (!parseResult.success) {
    return {
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Dữ liệu không hợp lệ.',
        fields: Object.fromEntries(
          parseResult.error.issues.map((issue) => [issue.path.join('.'), issue.message])
        ),
      },
    };
  }

  const input = parseResult.data;
  const prisma = prismaClient || getProductPrisma();

  try {
    await verifyActiveAdmin(adminAccountId, prisma);

    const bp = await prisma.assessmentBlueprint.findUnique({
      where: { id: blueprintId.toLowerCase() },
      include: {
        _count: { select: { versions: true } },
      },
    });

    if (!bp) {
      return {
        status: 404,
        error: { code: 'BLUEPRINT_NOT_FOUND', message: 'Không tìm thấy khung đánh giá yêu cầu.' },
      };
    }

    // CAS check on rowVersion
    const actualRowVersion = (bp.rowVersion ?? 1n).toString();
    if (actualRowVersion !== input.expectedRowVersion) {
      return {
        status: 409,
        error: {
          code: 'REVISION_CONFLICT',
          message: 'Khung đánh giá đã bị sửa đổi bởi tác vụ khác. Vui lòng tải lại dữ liệu mới nhất.',
        },
      };
    }

    const hasVersions = (bp._count?.versions ?? 0) > 0;

    // Scope immutability once versions exist
    if (hasVersions) {
      if (input.purpose !== undefined && input.purpose !== bp.purpose) {
        return {
          status: 409,
          error: {
            code: 'BLUEPRINT_SCOPE_IMMUTABLE',
            message: 'Mục đích (purpose) của khung đánh giá không thể thay đổi sau khi đã có phiên bản đánh giá được tạo.',
          },
        };
      }

      if (
        input.targetLevelId !== undefined &&
        (input.targetLevelId ? input.targetLevelId.toLowerCase() : null) !==
          (bp.targetLevelId ? bp.targetLevelId.toLowerCase() : null)
      ) {
        return {
          status: 409,
          error: {
            code: 'BLUEPRINT_SCOPE_IMMUTABLE',
            message: 'Cấp độ mục tiêu (targetLevelId) không thể thay đổi sau khi đã có phiên bản đánh giá được tạo.',
          },
        };
      }

      if (
        input.nextLevelId !== undefined &&
        (input.nextLevelId ? input.nextLevelId.toLowerCase() : null) !==
          (bp.nextLevelId ? bp.nextLevelId.toLowerCase() : null)
      ) {
        return {
          status: 409,
          error: {
            code: 'BLUEPRINT_SCOPE_IMMUTABLE',
            message: 'Cấp độ tiếp theo (nextLevelId) không thể thay đổi sau khi đã có phiên bản đánh giá được tạo.',
          },
        };
      }
    }

    // Validate level framework matching if level targets changed
    const targetLevelId =
      input.targetLevelId !== undefined
        ? input.targetLevelId ? input.targetLevelId.toLowerCase() : null
        : bp.targetLevelId;
    const nextLevelId =
      input.nextLevelId !== undefined
        ? input.nextLevelId ? input.nextLevelId.toLowerCase() : null
        : bp.nextLevelId;

    if (input.targetLevelId !== undefined && input.targetLevelId !== null) {
      const targetLevel = await prisma.level.findUnique({
        where: { id: input.targetLevelId.toLowerCase() },
        select: { id: true, frameworkId: true },
      });
      if (!targetLevel || targetLevel.frameworkId.toLowerCase() !== bp.frameworkId.toLowerCase()) {
        return {
          status: 400,
          error: {
            code: 'LEVEL_FRAMEWORK_MISMATCH',
            message: 'Cấp độ mục tiêu (targetLevelId) không thuộc khung năng lực của khung đánh giá.',
          },
        };
      }
    }

    if (input.nextLevelId !== undefined && input.nextLevelId !== null) {
      const nextLevel = await prisma.level.findUnique({
        where: { id: input.nextLevelId.toLowerCase() },
        select: { id: true, frameworkId: true },
      });
      if (!nextLevel || nextLevel.frameworkId.toLowerCase() !== bp.frameworkId.toLowerCase()) {
        return {
          status: 400,
          error: {
            code: 'LEVEL_FRAMEWORK_MISMATCH',
            message: 'Cấp độ tiếp theo (nextLevelId) không thuộc khung năng lực của khung đánh giá.',
          },
        };
      }
    }

    const newCoverage: BlueprintCoverage = (input.coverage ?? bp.coverage) as BlueprintCoverage;
    const newRequirements: BlueprintRequirements = (input.requirements ?? bp.requirements) as BlueprintRequirements;
    const newConfig: BlueprintConfig = (input.config ?? bp.config) as BlueprintConfig;
    const newPurpose: AssessmentPurpose = (input.purpose ?? bp.purpose) as AssessmentPurpose;

    const compCheck = validateBlueprintComposition(newCoverage, newRequirements);
    if (!compCheck.valid) {
      return {
        status: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: compCheck.error || 'Cấu trúc bài đánh giá không hợp lệ.',
        },
      };
    }

    // Check if typed composition or scope semantics changed
    const coverageChanged = canonicalJsonStringify(newCoverage) !== canonicalJsonStringify(bp.coverage);
    const requirementsChanged = canonicalJsonStringify(newRequirements) !== canonicalJsonStringify(bp.requirements);
    const configChanged = canonicalJsonStringify(newConfig) !== canonicalJsonStringify(bp.config);
    const purposeChanged = newPurpose !== bp.purpose;
    const targetLevelChanged = targetLevelId !== bp.targetLevelId;
    const nextLevelChanged = nextLevelId !== bp.nextLevelId;

    const semanticsChanged =
      coverageChanged ||
      requirementsChanged ||
      configChanged ||
      purposeChanged ||
      targetLevelChanged ||
      nextLevelChanged;

    const currentGen = BigInt(bp.generation ?? 1n);
    const newGeneration = semanticsChanged ? currentGen + 1n : currentGen;
    const currentRowVer = BigInt(bp.rowVersion ?? 1n);
    if (
      (semanticsChanged && currentGen >= 9223372036854775807n) ||
      currentRowVer >= 9223372036854775807n
    ) {
      return {
        status: 409,
        error: {
          code: 'BLUEPRINT_VERSION_EXHAUSTED',
          message: 'Đã đạt giới hạn phiên bản dữ liệu của khung đánh giá.',
        },
      };
    }
    const newRowVersion = currentRowVer + 1n;

    const cas = await prisma.assessmentBlueprint.updateMany({
      where: { id: bp.id, rowVersion: BigInt(input.expectedRowVersion) },
      data: {
        purpose: newPurpose,
        targetLevelId,
        nextLevelId,
        coverage: newCoverage as any,
        requirements: newRequirements as any,
        config: newConfig as any,
        generation: newGeneration,
        rowVersion: newRowVersion,
      },
    });

    if (cas.count !== 1) {
      return {
        status: 409,
        error: {
          code: 'REVISION_CONFLICT',
          message: 'Khung đánh giá đã bị sửa đổi bởi tác vụ khác. Vui lòng tải lại dữ liệu mới nhất.',
        },
      };
    }

    const updatedBp = await prisma.assessmentBlueprint.findUnique({
      where: { id: bp.id },
      include: {
        course: { select: { id: true, names: true } },
        language: { select: { id: true, code: true, names: true } },
        framework: { select: { id: true, code: true, version: true, names: true } },
        targetLevel: { select: { id: true, code: true, position: true, label: true } },
        nextLevel: { select: { id: true, code: true, position: true, label: true } },
        _count: { select: { versions: true } },
      },
    });

    return {
      status: 200,
      data: { data: toBlueprintDto(updatedBp) },
    };
  } catch (err) {
    if (err instanceof BlueprintError) {
      return { status: err.status, error: err.error };
    }
    if (String((err as any)?.code) === 'P2004') {
      return {
        status: 409,
        error: {
          code: 'BLUEPRINT_SCOPE_IMMUTABLE',
          message: 'Phạm vi khung đánh giá đã bị khóa bởi phiên bản đánh giá hiện có.',
        },
      };
    }
    return {
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }
}

export async function deleteBlueprint(
  adminAccountId: string,
  blueprintId: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: { id: string; deleted: true } }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(blueprintId)) {
    return {
      status: 400,
      error: { code: 'INVALID_ID', message: 'Mã định danh khung đánh giá không đúng định dạng UUID.' },
    };
  }

  const prisma = prismaClient || getProductPrisma();
  try {
    await verifyActiveAdmin(adminAccountId, prisma);
    return await prisma.$transaction(async (tx: any) => {
      const locked = await tx.$queryRaw`
        SELECT id::text FROM app.assessment_blueprints WHERE id = ${blueprintId.toLowerCase()}::uuid FOR UPDATE
      `;
      if (!locked.length) {
        return {
          status: 404,
          error: { code: 'BLUEPRINT_NOT_FOUND', message: 'Không tìm thấy khung đánh giá yêu cầu.' },
        };
      }
      const versions = await tx.assessmentVersion.count({ where: { blueprintId: blueprintId.toLowerCase() } });
      const items = await tx.itemRevision.count({ where: { assessmentBlueprintId: blueprintId.toLowerCase() } });
      if (versions > 0 || items > 0) {
        return {
          status: 409,
          error: {
            code: 'BLUEPRINT_IN_USE',
            message: 'Không thể xóa khung đánh giá đã được dùng bởi bài tập hoặc phiên bản có lịch sử.',
          },
        };
      }
      await tx.assessmentBlueprint.delete({ where: { id: blueprintId.toLowerCase() } });
      return { status: 200, data: { data: { id: blueprintId.toLowerCase(), deleted: true as const } } };
    });
  } catch (err) {
    if (err instanceof BlueprintError) return { status: err.status, error: err.error };
    return {
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }
}
