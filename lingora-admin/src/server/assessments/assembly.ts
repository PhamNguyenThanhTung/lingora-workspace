import { createHash } from 'node:crypto';
import { getProductPrisma } from '../db/index.js';
import { isValidUuid, type ApiErrorEnvelope } from '../frameworks/index.ts';
import { computeExerciseFingerprint, exerciseInputSchema, type ExerciseType } from '../lessons/content.ts';
import { assembleVersionSchema } from './schemas.ts';
import type {
  AssessmentVersionDto,
  AssessmentVersionItemDto,
  EligibleAssessmentItemDto,
  BlueprintCoverage,
  BlueprintRequirements,
} from './types.ts';

export class AssemblyError extends Error {
  status: number;
  error: ApiErrorEnvelope['error'];
  constructor(status: number, error: ApiErrorEnvelope['error']) {
    super(error?.message || 'AssemblyError');
    this.status = status;
    this.error = error;
    this.name = 'AssemblyError';
  }
}

function canonicalJsonWithBigInt(value: unknown): string {
  if (value === undefined) return 'null';
  if (typeof value === 'bigint') return value.toString();
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJsonWithBigInt).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().filter((key) => object[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${canonicalJsonWithBigInt(object[key])}`).join(',')}}`;
}

async function verifyActiveAdmin(adminAccountId: string, prisma: any): Promise<void> {
  const account = await prisma.account.findUnique({
    where: { id: adminAccountId.toLowerCase() },
    select: { id: true, role: true, status: true },
  });

  if (!account || account.role !== 'ADMIN') {
    throw new AssemblyError(403, {
      code: 'FORBIDDEN',
      message: 'Chỉ quản trị viên mới có quyền lắp ghép và quản lý phiên bản đánh giá.',
    });
  }

  if (account.status !== 'ACTIVE') {
    throw new AssemblyError(403, {
      code: 'ACCOUNT_INACTIVE',
      message: 'Tài khoản quản trị viên đang chờ duyệt hoặc đã bị vô hiệu hóa.',
    });
  }
}

export function toVersionItemDto(vi: any): AssessmentVersionItemDto {
  const ir = vi.itemRevision || {};
  const it = vi.item || {};
  const lr = vi.sourceLessonRevision || {};

  return {
    id: vi.id,
    assessmentVersionId: vi.assessmentVersionId,
    itemRevisionId: vi.itemRevisionId,
    itemId: vi.itemId,
    position: vi.position,
    weight: typeof vi.weight?.toString === 'function' ? vi.weight.toString() : String(vi.weight || '1.0000'),
    coverageTags: (vi.coverageTags as Record<string, unknown>) || {},
    createdAt: vi.createdAt instanceof Date ? vi.createdAt.toISOString() : new Date(vi.createdAt).toISOString(),
    item: {
      origin: it.origin || '',
      exactFingerprint: it.exactFingerprint || '',
    },
    itemRevision: {
      id: ir.id || vi.itemRevisionId,
      revisionNo: ir.revisionNo ?? 1,
      type: ir.type as ExerciseType,
      promptData: ir.promptData,
      schemaVersion: ir.schemaVersion ?? 1,
      exactFingerprint: ir.exactFingerprint || '',
      blueprintGeneration: ir.blueprintGeneration != null ? ir.blueprintGeneration.toString() : null,
      isDraftOmitted: Boolean(ir.isDraftOmitted),
      frozenAt: ir.frozenAt instanceof Date ? ir.frozenAt.toISOString() : ir.frozenAt ? new Date(ir.frozenAt).toISOString() : null,
    },
    sourceLessonRevision: {
      id: lr.id || vi.sourceLessonRevisionId,
      revisionNo: lr.revisionNo ?? 1,
      lessonId: lr.lessonId || '',
    },
  };
}

export function toVersionDto(ver: any): AssessmentVersionDto {
  const items = Array.isArray(ver.items) ? ver.items.map(toVersionItemDto) : undefined;
  const rawSnapshot = (ver.blueprintSnapshot as Record<string, unknown>) || {};
  const blueprintSnapshot = {
    ...rawSnapshot,
    blueprint_generation: String(ver.exactSnapshotBlueprintGeneration ?? ver.blueprintGeneration ?? rawSnapshot.blueprint_generation ?? ''),
    coverage_catalog_generation: String(ver.exactCoverageCatalogGeneration ?? rawSnapshot.coverage_catalog_generation ?? ''),
  };
  return {
    id: ver.id,
    blueprintId: ver.blueprintId,
    versionNo: ver.versionNo,
    blueprintGeneration: (ver.blueprintGeneration ?? 1n).toString(),
    blueprintSnapshot,
    assembledAt: ver.assembledAt instanceof Date ? ver.assembledAt.toISOString() : new Date(ver.assembledAt).toISOString(),
    assemblyInputHash: ver.assemblyInputHash,
    status: ver.status,
    isActive: Boolean(ver.isActive),
    createdAt: ver.createdAt instanceof Date ? ver.createdAt.toISOString() : new Date(ver.createdAt).toISOString(),
    updatedAt: ver.updatedAt instanceof Date ? ver.updatedAt.toISOString() : new Date(ver.updatedAt).toISOString(),
    rowVersion: (ver.rowVersion ?? 1n).toString(),
    items,
    itemCount: items ? items.length : ver._count?.items,
  };
}

function withExactSnapshotBigInts<T extends Record<string, any>>(
  rows: T[],
  exactRows: Array<{ id: string; blueprintGeneration: string; coverageCatalogGeneration: string }>
): T[] {
  const exactById = new Map(exactRows.map((row) => [row.id.toLowerCase(), row]));
  return rows.map((row) => {
    const exact = exactById.get(row.id.toLowerCase());
    return exact ? {
      ...row,
      exactSnapshotBlueprintGeneration: exact.blueprintGeneration,
      exactCoverageCatalogGeneration: exact.coverageCatalogGeneration,
    } : row;
  });
}

export async function listEligibleItems(
  adminAccountId: string,
  blueprintId: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: EligibleAssessmentItemDto[] }; error?: ApiErrorEnvelope['error'] }> {
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
      select: {
        id: true,
        generation: true,
        courseId: true,
        languageId: true,
        frameworkId: true,
      },
    });

    if (!bp) {
      return {
        status: 404,
        error: { code: 'BLUEPRINT_NOT_FOUND', message: 'Không tìm thấy khung đánh giá yêu cầu.' },
      };
    }

    // Find candidate item revisions matching blueprint ID and current generation
    const itemRevs = await prisma.itemRevision.findMany({
      where: {
        assessmentBlueprintId: bp.id,
        blueprintGeneration: bp.generation,
        isDraftOmitted: false,
        item: {
          origin: 'ASSESSMENT',
        },
        authoringLessonRevision: {
          submittedAt: { not: null },
        },
      },
      include: {
        item: { select: { id: true, origin: true, exactFingerprint: true } },
        gradingSecret: true,
        authoringLessonRevision: {
          include: {
            lesson: {
              include: {
                unit: {
                  include: {
                    course: { select: { id: true, languageId: true, frameworkId: true } },
                  },
                },
              },
            },
            creator: { select: { id: true, displayName: true } },
            reviews: {
              where: { action: 'SUBMIT' },
              select: { id: true, action: true, lessonRevisionId: true, actorId: true, assignmentEpisodeId: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const eligibleItems: EligibleAssessmentItemDto[] = [];

    for (const ir of itemRevs) {
      const lessonRev = ir.authoringLessonRevision;
      if (!lessonRev) continue;

      const course = lessonRev.lesson?.unit?.course;
      if (!course) continue;

      // Verify curriculum scope
      if (
        course.id.toLowerCase() !== bp.courseId.toLowerCase() ||
        course.languageId.toLowerCase() !== bp.languageId.toLowerCase() ||
        course.frameworkId.toLowerCase() !== bp.frameworkId.toLowerCase()
      ) {
        continue;
      }

      // Check matching SUBMIT review for the creation assignment episode
      const matchingReview = (lessonRev.reviews || []).find(
        (r: any) =>
          r.action === 'SUBMIT' &&
          r.lessonRevisionId.toLowerCase() === lessonRev.id.toLowerCase() &&
          r.actorId.toLowerCase() === ir.createdBy.toLowerCase() &&
          r.assignmentEpisodeId &&
          r.assignmentEpisodeId.toLowerCase() === ir.creationAssignmentEpisodeId.toLowerCase()
      );

      const secret = ir.gradingSecret;
      if (!matchingReview || ir.schemaVersion !== 1 || !secret || secret.schemaVersion !== 1 ||
          !exerciseInputSchema.safeParse({
            position: 1,
            isCore: true,
            type: ir.type,
            promptData: ir.promptData,
            gradingData: secret.gradingData,
            feedbackData: secret.feedbackData,
          }).success ||
          computeExerciseFingerprint({
            type: ir.type,
            schemaVersion: ir.schemaVersion,
            promptData: ir.promptData,
            gradingData: secret.gradingData,
            feedbackData: secret.feedbackData,
          }) !== ir.exactFingerprint) continue;

      eligibleItems.push({
        itemRevisionId: ir.id,
        itemId: ir.itemId,
        revisionNo: ir.revisionNo,
        type: ir.type as ExerciseType,
        promptData: ir.promptData,
        exactFingerprint: ir.exactFingerprint,
        sourceLessonRevisionId: lessonRev.id,
        sourceLessonRevisionNo: lessonRev.revisionNo,
        lessonId: lessonRev.lessonId,
        unitCode: lessonRev.lesson?.unit?.code || '',
        unitPosition: lessonRev.lesson?.unit?.position ?? 0,
        lessonPosition: lessonRev.lesson?.position ?? 0,
        teacherId: ir.createdBy,
        teacherDisplayName: lessonRev.creator?.displayName || null,
        sourceSubmissionId: matchingReview.id,
        creationAssignmentEpisodeId: ir.creationAssignmentEpisodeId,
        blueprintId: bp.id,
        blueprintGeneration: (bp.generation ?? 1n).toString(),
        submittedAt: (lessonRev.submittedAt instanceof Date
          ? lessonRev.submittedAt
          : new Date(lessonRev.submittedAt!)
        ).toISOString(),
      });
    }

    return {
      status: 200,
      data: { data: eligibleItems },
    };
  } catch (err) {
    if (err instanceof AssemblyError) {
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

export async function assembleAssessmentVersion(
  adminAccountId: string,
  blueprintId: string,
  rawInput: unknown,
  prismaClient?: any
): Promise<{ status: number; data?: { data: AssessmentVersionDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(blueprintId)) {
    return {
      status: 400,
      error: { code: 'INVALID_ID', message: 'Mã định danh khung đánh giá không đúng định dạng UUID.' },
    };
  }

  const parseResult = assembleVersionSchema.safeParse(rawInput);
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

    return await prisma.$transaction(async (tx: any) => {
      // 1. Serialize assemblies and Blueprint edits on the same parent row.
      await tx.$queryRaw`SELECT id::text FROM app.assessment_blueprints WHERE id = ${blueprintId.toLowerCase()}::uuid FOR UPDATE`;
      const bp = await tx.assessmentBlueprint.findUnique({
        where: { id: blueprintId.toLowerCase() },
      });

      if (!bp) {
        throw new AssemblyError(404, {
          code: 'BLUEPRINT_NOT_FOUND',
          message: 'Không tìm thấy khung đánh giá yêu cầu.',
        });
      }

      // Check expected generation CAS
      const actualGeneration = (bp.generation ?? 1n).toString();
      if (actualGeneration !== input.expectedBlueprintGeneration) {
        throw new AssemblyError(409, {
          code: 'STALE_BLUEPRINT_GENERATION',
          message: 'Thế hệ khung đánh giá đã thay đổi. Vui lòng tải lại danh sách bài tập hợp lệ mới nhất.',
        });
      }

      const coverage = bp.coverage as BlueprintCoverage;
      const requirements = bp.requirements as BlueprintRequirements;

      // 2. Validate itemCount
      if (input.itemRevisionIds.length !== coverage.itemCount) {
        throw new AssemblyError(400, {
          code: 'ITEM_COUNT_MISMATCH',
          message: `Số lượng bài tập được chọn (${input.itemRevisionIds.length}) không khớp với cấu hình khung đánh giá (${coverage.itemCount}).`,
        });
      }

      if (new Set(input.itemRevisionIds.map((id) => id.toLowerCase())).size !== input.itemRevisionIds.length) {
        throw new AssemblyError(400, {
          code: 'DUPLICATE_ITEM_REVISION',
          message: 'Không được chọn lặp lại cùng một bản sửa đổi bài tập.',
        });
      }

      // Lock selected revisions in stable order before reading their eligibility.
      const lockedItemRows: Array<{ id: string; itemId: string }> = [];
      for (const revisionId of [...input.itemRevisionIds].map((id) => id.toLowerCase()).sort()) {
        const rows = await tx.$queryRaw`
          SELECT id::text AS id, item_id::text AS "itemId"
          FROM app.item_revisions WHERE id = ${revisionId}::uuid FOR UPDATE
        `;
        if (rows[0]) lockedItemRows.push(rows[0]);
      }
      for (const itemId of [...new Set(lockedItemRows.map((row) => row.itemId))].sort()) {
        await tx.$queryRaw`SELECT id::text FROM app.item_identities WHERE id = ${itemId}::uuid FOR SHARE`;
      }

      // 3. Load all selected ItemRevisions in exact user-supplied order
      const selectedItemRevisions: any[] = [];
      const seenItemIdentities = new Set<string>();
      const countByType: Record<string, number> = {};
      const allowedExerciseTypes = new Set(coverage.exerciseTypes);

      for (const revId of input.itemRevisionIds) {
        const ir = await tx.itemRevision.findUnique({
          where: { id: revId.toLowerCase() },
          include: {
            item: true,
            gradingSecret: true,
            authoringLessonRevision: {
              include: {
                lesson: {
                  include: {
                    unit: {
                      include: {
                        course: true,
                      },
                    },
                  },
                },
                reviews: {
                  where: { action: 'SUBMIT' },
                },
              },
            },
          },
        });

        if (!ir) {
          throw new AssemblyError(400, {
            code: 'ITEM_REVISION_NOT_FOUND',
            message: `Không tìm thấy bản sửa đổi bài tập với mã: ${revId}`,
          });
        }

        // Must have origin ASSESSMENT
        if (ir.item?.origin !== 'ASSESSMENT') {
          throw new AssemblyError(400, {
            code: 'INVALID_ITEM_ORIGIN',
            message: `Bài tập ${ir.itemId} không có nguồn gốc ASSESSMENT. Không thể đưa vào bài đánh giá.`,
          });
        }

        // Must match blueprint pins
        if (
          !ir.assessmentBlueprintId ||
          ir.assessmentBlueprintId.toLowerCase() !== bp.id.toLowerCase() ||
          ir.blueprintGeneration == null ||
          ir.blueprintGeneration.toString() !== bp.generation.toString()
        ) {
          throw new AssemblyError(400, {
            code: 'BLUEPRINT_PIN_MISMATCH',
            message: `Bài tập ${ir.id} không ghim đúng khung đánh giá hoặc thế hệ hiện tại (${bp.generation.toString()}).`,
          });
        }

        // Must not be draft omitted
        if (ir.isDraftOmitted) {
          throw new AssemblyError(400, {
            code: 'DRAFT_OMITTED_ITEM',
            message: `Bài tập ${ir.id} đã bị lược bỏ (draft omitted).`,
          });
        }

        // Authoring lesson revision must be submitted
        const authoringLessonRev = ir.authoringLessonRevision;
        if (!authoringLessonRev || !authoringLessonRev.submittedAt) {
          throw new AssemblyError(400, {
            code: 'UNSUBMITTED_SOURCE_REVISION',
            message: `Bản sửa đổi bài học gốc của bài tập ${ir.id} chưa được nộp duyệt.`,
          });
        }

        // Curriculum scope must match Blueprint
        const course = authoringLessonRev.lesson?.unit?.course;
        if (
          !course ||
          course.id.toLowerCase() !== bp.courseId.toLowerCase() ||
          course.languageId.toLowerCase() !== bp.languageId.toLowerCase() ||
          course.frameworkId.toLowerCase() !== bp.frameworkId.toLowerCase()
        ) {
          throw new AssemblyError(400, {
            code: 'SCOPE_MISMATCH',
            message: `Phạm vi khóa học/ngôn ngữ/khung năng lực của bài tập ${ir.id} không khớp với khung đánh giá.`,
          });
        }

        // Matching SUBMIT review must exist
        const submitReview = (authoringLessonRev.reviews || []).find(
          (r: any) =>
            r.action === 'SUBMIT' &&
            r.lessonRevisionId?.toLowerCase() === authoringLessonRev.id.toLowerCase() &&
            r.actorId?.toLowerCase() === ir.createdBy.toLowerCase() &&
            r.assignmentEpisodeId &&
            r.assignmentEpisodeId.toLowerCase() === ir.creationAssignmentEpisodeId.toLowerCase()
        );

        if (!submitReview) {
          throw new AssemblyError(400, {
            code: 'MISSING_SUBMIT_REVIEW',
            message: `Không tìm thấy bản ghi SUBMIT hợp lệ cho bài tập ${ir.id}.`,
          });
        }

        if (
          ir.schemaVersion !== 1 ||
          !ir.gradingSecret ||
          ir.gradingSecret.schemaVersion !== 1 ||
          !exerciseInputSchema.safeParse({
            position: 1,
            isCore: true,
            type: ir.type,
            promptData: ir.promptData,
            gradingData: ir.gradingSecret.gradingData,
            feedbackData: ir.gradingSecret.feedbackData,
          }).success ||
          computeExerciseFingerprint({
            type: ir.type,
            schemaVersion: ir.schemaVersion,
            promptData: ir.promptData,
            gradingData: ir.gradingSecret.gradingData,
            feedbackData: ir.gradingSecret.feedbackData,
          }) !== ir.exactFingerprint
        ) {
          throw new AssemblyError(400, {
            code: 'INVALID_ITEM_PAYLOAD',
            message: `Bài tập ${ir.id} không có nội dung và đáp án hợp lệ.`,
          });
        }

        // Unique item identity check (no duplicate item identities in one assessment version)
        if (seenItemIdentities.has(ir.itemId.toLowerCase())) {
          throw new AssemblyError(400, {
            code: 'DUPLICATE_ITEM_IDENTITY',
            message: `Bài tập với định danh ${ir.itemId} được chọn nhiều hơn một lần trong phiên bản đánh giá.`,
          });
        }
        seenItemIdentities.add(ir.itemId.toLowerCase());

        // Exercise type must be allowed
        if (!allowedExerciseTypes.has(ir.type as ExerciseType)) {
          throw new AssemblyError(400, {
            code: 'UNSUPPORTED_EXERCISE_TYPE',
            message: `Kiểu bài tập '${ir.type}' không nằm trong danh sách kiểu bài tập cho phép của khung đánh giá.`,
          });
        }

        countByType[ir.type] = (countByType[ir.type] || 0) + 1;
        selectedItemRevisions.push({ ir, submitReview });
      }

      for (const sourceRevisionId of [...new Set(selectedItemRevisions.map(({ ir }) => ir.authoringLessonRevisionId))].sort()) {
        await tx.$queryRaw`SELECT id::text FROM app.lesson_revisions WHERE id = ${sourceRevisionId}::uuid FOR SHARE`;
      }

      // 4. Validate minimum type counts
      const minMap = requirements?.minimumItemsByType || {};
      for (const [type, minCount] of Object.entries(minMap)) {
        const actualCount = countByType[type] || 0;
        if (actualCount < (minCount || 0)) {
          throw new AssemblyError(400, {
            code: 'MINIMUM_REQUIREMENTS_NOT_MET',
            message: `Kiểu bài tập '${type}' có số lượng (${actualCount}) thấp hơn yêu cầu tối thiểu (${minCount}).`,
          });
        }
      }

      // 5. Monotonically set frozenAt on selected ItemRevisions
      const now = new Date();
      for (const { ir } of selectedItemRevisions) {
        if (!ir.frozenAt) {
          await tx.itemRevision.update({
            where: { id: ir.id },
            data: { frozenAt: now },
          });
        }
      }

      // 6. Next versionNo
      const highestVersion = await tx.assessmentVersion.findFirst({
        where: { blueprintId: bp.id },
        orderBy: { versionNo: 'desc' },
        select: { versionNo: true },
      });
      const nextVersionNo = (highestVersion?.versionNo ?? 0) + 1;
      if (!Number.isSafeInteger(nextVersionNo) || nextVersionNo > 2147483647) {
        throw new AssemblyError(409, {
          code: 'VERSION_NUMBER_EXHAUSTED',
          message: 'Đã đạt giới hạn số phiên bản cho khung đánh giá này.',
        });
      }

      // 7. Construct the exact snapshot representation for hashing. Persist it
      // through SQL jsonb_build_object so bigint generations never pass through JS Number.
      const blueprintSnapshot = {
        blueprint_id: bp.id,
        blueprint_generation: bp.generation,
        course_id: bp.courseId,
        language_id: bp.languageId,
        framework_id: bp.frameworkId,
        purpose: bp.purpose,
        schema_version: 1, // EXACT numeric 1
        coverage_catalog_generation: bp.coverageCatalogGeneration,
        config: bp.config,
        target_level_id: bp.targetLevelId || null,
        next_level_id: bp.nextLevelId || null,
        coverage: bp.coverage,
        requirements: bp.requirements,
      };

      // 8. Compute assemblyInputHash over canonical JSON (no secrets!)
      const hashPayload = {
        schemaVersion: 1,
        blueprintSnapshot,
        items: selectedItemRevisions.map(({ ir }, index) => ({
          position: index + 1,
          itemId: ir.itemId,
          itemRevisionId: ir.id,
          exactFingerprint: ir.exactFingerprint,
        })),
      };
      const assemblyInputHash = createHash('sha256')
        .update(canonicalJsonWithBigInt(hashPayload))
        .digest('hex');

      // 9. Create AssessmentVersion. The database receives exact bigint JSON numbers.
      const createdRows = await tx.$queryRaw`
        INSERT INTO app.assessment_versions (
          blueprint_id, version_no, blueprint_generation, blueprint_snapshot,
          assembled_at, assembly_input_hash, status, is_active, row_version
        ) VALUES (
          ${bp.id}::uuid, ${nextVersionNo}, ${bp.generation}::bigint,
          jsonb_build_object(
            'blueprint_id', ${bp.id}::text,
            'blueprint_generation', ${bp.generation}::bigint,
            'course_id', ${bp.courseId}::text,
            'language_id', ${bp.languageId}::text,
            'framework_id', ${bp.frameworkId}::text,
            'purpose', ${bp.purpose}::text,
            'schema_version', 1,
            'coverage_catalog_generation', ${bp.coverageCatalogGeneration}::bigint,
            'config', ${JSON.stringify(bp.config)}::jsonb,
            'target_level_id', ${bp.targetLevelId}::text,
            'next_level_id', ${bp.nextLevelId}::text,
            'coverage', ${JSON.stringify(bp.coverage)}::jsonb,
            'requirements', ${JSON.stringify(bp.requirements)}::jsonb
          ),
          ${now}, ${assemblyInputHash}, 'IN_REVIEW', false, 1
        ) RETURNING id::text AS id
      `;
      const createdVersionId = createdRows[0]?.id;
      if (!createdVersionId) throw new Error('AssessmentVersion insert did not return an id');

      // 10. Create AssessmentVersionItem rows in explicit position order
      for (let i = 0; i < selectedItemRevisions.length; i++) {
        const { ir, submitReview } = selectedItemRevisions[i];
        await tx.assessmentVersionItem.create({
          data: {
            assessmentVersionId: createdVersionId,
            itemRevisionId: ir.id,
            itemId: ir.itemId,
            sourceLessonRevisionId: ir.authoringLessonRevisionId,
            sourceSubmissionId: submitReview.id,
            contributionAssignmentEpisodeId: ir.creationAssignmentEpisodeId,
            position: i + 1,
            weight: 1.0000,
            coverageTags: {},
          },
        });
      }

      // 11. Fetch full created version with exact pinned items
      const fullVersion = await tx.assessmentVersion.findUnique({
        where: { id: createdVersionId },
        include: {
          items: {
            orderBy: { position: 'asc' },
            include: {
              item: true,
              itemRevision: true,
              sourceLessonRevision: true,
            },
          },
        },
      });
      const exactRows = await tx.$queryRaw`
        SELECT id::text AS id, blueprint_generation::text AS "blueprintGeneration",
          blueprint_snapshot->>'coverage_catalog_generation' AS "coverageCatalogGeneration"
        FROM app.assessment_versions WHERE id = ${createdVersionId}::uuid
      `;

      return {
        status: 201,
        data: { data: toVersionDto(withExactSnapshotBigInts([fullVersion], exactRows)[0]) },
      };
    }, { timeout: 30000 });
  } catch (err) {
    if (err instanceof AssemblyError) {
      return { status: err.status, error: err.error };
    }
    if (['P2002', 'P2003', 'P2004'].includes(String((err as any)?.code))) {
      return {
        status: 409,
        error: {
          code: 'ASSEMBLY_CONFLICT',
          message: 'Dữ liệu nguồn đã thay đổi hoặc phiên bản tương tự vừa được tạo. Hãy tải lại và thử lại.',
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

export async function getAssessmentVersion(
  adminAccountId: string,
  versionId: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: AssessmentVersionDto }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(versionId)) {
    return {
      status: 400,
      error: { code: 'INVALID_ID', message: 'Mã định danh phiên bản đánh giá không đúng định dạng UUID.' },
    };
  }

  const prisma = prismaClient || getProductPrisma();
  try {
    await verifyActiveAdmin(adminAccountId, prisma);

    const version = await prisma.assessmentVersion.findUnique({
      where: { id: versionId.toLowerCase() },
      include: {
        items: {
          orderBy: { position: 'asc' },
          include: {
            item: true,
            // STRICTLY resolve persisted itemRevisionId relation only! Never latest ItemRevision.
            itemRevision: true,
            sourceLessonRevision: true,
          },
        },
      },
    });

    if (!version) {
      return {
        status: 404,
        error: { code: 'VERSION_NOT_FOUND', message: 'Không tìm thấy phiên bản đánh giá yêu cầu.' },
      };
    }

    const exactRows = await prisma.$queryRaw`
      SELECT id::text AS id, blueprint_generation::text AS "blueprintGeneration",
        blueprint_snapshot->>'coverage_catalog_generation' AS "coverageCatalogGeneration"
      FROM app.assessment_versions WHERE id = ${versionId.toLowerCase()}::uuid
    `;

    return {
      status: 200,
      data: { data: toVersionDto(withExactSnapshotBigInts([version], exactRows)[0]) },
    };
  } catch (err) {
    if (err instanceof AssemblyError) {
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

export async function listAssessmentVersions(
  adminAccountId: string,
  blueprintId: string,
  prismaClient?: any
): Promise<{ status: number; data?: { data: AssessmentVersionDto[] }; error?: ApiErrorEnvelope['error'] }> {
  if (!isValidUuid(blueprintId)) {
    return {
      status: 400,
      error: { code: 'INVALID_ID', message: 'Mã định danh khung đánh giá không đúng định dạng UUID.' },
    };
  }

  const prisma = prismaClient || getProductPrisma();
  try {
    await verifyActiveAdmin(adminAccountId, prisma);

    const versions = await prisma.assessmentVersion.findMany({
      where: { blueprintId: blueprintId.toLowerCase() },
      orderBy: { versionNo: 'desc' },
      include: {
        _count: { select: { items: true } },
      },
    });

    const exactRows = await prisma.$queryRaw`
      SELECT id::text AS id, blueprint_generation::text AS "blueprintGeneration",
        blueprint_snapshot->>'coverage_catalog_generation' AS "coverageCatalogGeneration"
      FROM app.assessment_versions WHERE blueprint_id = ${blueprintId.toLowerCase()}::uuid
    `;

    return {
      status: 200,
      data: { data: withExactSnapshotBigInts(versions, exactRows).map(toVersionDto) },
    };
  } catch (err) {
    if (err instanceof AssemblyError) {
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
