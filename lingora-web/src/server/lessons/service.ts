import 'server-only';
import type { Prisma, PrismaClient } from '../../../../lingora-admin/generated/product-client/index.js';
import { getLearnerPrisma } from '../db/index.ts';
import { consumptionPostSchema, isValidUuid, LessonServiceError, type ConsumptionPostInput, type LearnerCatalogueDto, type LearnerLessonDetailDto, type LessonReadingDto } from './dto.ts';
import { publicExercise, publicVocabulary } from './content.ts';

type Db = PrismaClient | Prisma.TransactionClient;
const levelSelect = { id: true, frameworkId: true, code: true, label: true, position: true } as const;
const contextSelect = {
  id: true, learnerId: true, languageId: true, courseId: true, status: true,
  language: { select: { id: true, code: true, names: true } },
  course: { select: { id: true, languageId: true, frameworkId: true, names: true, isActive: true, framework: { select: { id: true, code: true, version: true } } } },
  workingLevelId: true, workingLevel: { select: levelSelect },
  selectedStartLevelId: true, selectedStartLevel: { select: levelSelect },
} as const;
const unitSelect = { id: true, courseId: true, levelId: true, position: true, names: true, level: { select: levelSelect } } as const;
const revisionSummary = { id: true, lessonId: true, status: true, title: true } as const;
const lessonSummary = { id: true, unitId: true, position: true, isRequired: true, availability: true, activeRevisionId: true, activeRevision: { select: revisionSummary } } as const;
const readingSelect = { id: true, contextId: true, lessonId: true, lessonRevisionId: true, startedAt: true, completedAt: true, updatedAt: true, rowVersion: true } as const;
type Context = Prisma.LearningContextGetPayload<{ select: typeof contextSelect }>;
type Summary = Prisma.LessonGetPayload<{ select: typeof lessonSummary }>;
type Reading = Prisma.LessonConsumptionGetPayload<{ select: typeof readingSelect }>;
const labels = (value: unknown): Record<string, string> => Object.fromEntries(Object.entries(value && typeof value === 'object' && !Array.isArray(value) ? value : {}).filter((pair): pair is [string, string] => typeof pair[1] === 'string'));
const fail = (status: number, code: string, message: string): never => { throw new LessonServiceError(status, code, message); };
function validId(id: string) { if (!isValidUuid(id)) fail(400, 'VALIDATION_ERROR', 'Mã định danh không hợp lệ.'); return id.toLowerCase(); }
function published(lesson: Summary) {
  return lesson.availability === 'AVAILABLE' && !!lesson.activeRevisionId && lesson.activeRevision?.id === lesson.activeRevisionId && lesson.activeRevision.lessonId === lesson.id && lesson.activeRevision.status === 'PUBLISHED';
}
async function ownedContext(db: Db, id: string, actorId: string): Promise<Context> {
  const c = await db.learningContext.findFirst({ where: { id, learnerId: actorId }, select: contextSelect });
  if (!c || c.learnerId !== actorId) return fail(404, 'NOT_FOUND', 'Lộ trình học không tồn tại.');
  if (c.status !== 'ACTIVE') return fail(403, 'CONTEXT_INACTIVE', 'Lộ trình học đang tạm dừng.');
  if (!c.course?.isActive) return fail(403, 'COURSE_INACTIVE', 'Khóa học đang tạm dừng.');
  if (c.course.id !== c.courseId || c.language?.id !== c.languageId || c.course.languageId !== c.languageId || c.course.framework?.id !== c.course.frameworkId ||
    (c.workingLevelId != null && (c.workingLevel?.id !== c.workingLevelId || c.workingLevel.frameworkId !== c.course.frameworkId)) ||
    (c.selectedStartLevelId != null && (c.selectedStartLevel?.id !== c.selectedStartLevelId || c.selectedStartLevel.frameworkId !== c.course.frameworkId))) {
    return fail(409, 'CONTEXT_INCONSISTENT', 'Ngôn ngữ hoặc khung năng lực của lộ trình không nhất quán.');
  }
  return c;
}

// Catalogue, detail and mutations share the same publication/order/graded gate.
async function hierarchy(db: Db, context: Context) {
  if (!context.workingLevel) return [];
  const units = await db.unit.findMany({
    where: { courseId: context.courseId, level: { frameworkId: context.course.frameworkId, position: { lte: context.workingLevel.position } } },
    select: { ...unitSelect, lessons: { where: { availability: 'AVAILABLE', activeRevisionId: { not: null } }, select: lessonSummary, orderBy: [{ position: 'asc' }, { id: 'asc' }] } },
    orderBy: [{ level: { position: 'asc' } }, { position: 'asc' }, { id: 'asc' }],
  });
  const completed = new Set((await db.lessonCompletion.findMany({ where: { contextId: context.id }, select: { lessonId: true } })).map(c => c.lessonId));
  let precedingRequiredCompleted = true;
  return units.map(unit => {
    if (unit.courseId !== context.courseId || unit.level.id !== unit.levelId || unit.level.frameworkId !== context.course.frameworkId) fail(409, 'CONTEXT_INCONSISTENT', 'Đơn vị học không nhất quán với lộ trình.');
    const earlier = unit.level.position < context.workingLevel!.position;
    const lessons = unit.lessons.filter(published).map(lesson => {
      if (lesson.unitId !== unit.id) fail(409, 'CONTEXT_INCONSISTENT', 'Bài học không nhất quán với đơn vị học.');
      const isLocked = !earlier && !completed.has(lesson.id) && !precedingRequiredCompleted;
      if (!earlier && lesson.isRequired && !completed.has(lesson.id)) precedingRequiredCompleted = false;
      return { ...lesson, isLocked };
    });
    return { ...unit, lessons };
  }).filter(unit => unit.lessons.length > 0);
}
async function authorizedLesson(db: Db, context: Context, lessonId: string) {
  if (!context.workingLevelId || !context.workingLevel) return fail(409, 'CONTEXT_NO_WORKING_LEVEL', 'Chưa có trình độ học hiện tại.');
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, availability: 'AVAILABLE' },
    select: { ...lessonSummary, unit: { select: unitSelect }, activeRevision: { select: { ...revisionSummary, revisionNo: true, contentBlocks: true, topicIds: true, skillIds: true, purposeTags: true } } },
  });
  if (!lesson || !published(lesson) || lesson.unit.courseId !== context.courseId) return fail(404, 'NOT_FOUND', 'Bài học không khả dụng.');
  if (lesson.unit.levelId !== lesson.unit.level.id || lesson.unit.level.frameworkId !== context.course.frameworkId) return fail(409, 'CONTEXT_INCONSISTENT', 'Khung năng lực của bài học không nhất quán.');
  const entry = (await hierarchy(db, context)).flatMap(u => u.lessons).find(l => l.id === lesson.id);
  if (!entry) return fail(404, 'NOT_FOUND', 'Bài học không khả dụng trong trình độ hiện tại.');
  if (entry.isLocked) return fail(409, 'LESSON_LOCKED', 'Cần hoàn thành bài học trước.');
  return { ...lesson, activeRevision: lesson.activeRevision! };
}
function readingDto(contextId: string, lessonId: string, revisionId: string, row: Reading | null): LessonReadingDto {
  if (row && (row.contextId !== contextId || row.lessonId !== lessonId || row.lessonRevisionId !== revisionId)) return fail(409, 'CONTEXT_INCONSISTENT', 'Dữ liệu đọc không nhất quán.');
  return { contextId, lessonId, lessonRevisionId: revisionId, state: !row ? 'NOT_STARTED' : row.completedAt ? 'COMPLETED' : 'IN_PROGRESS', id: row?.id ?? null, startedAt: row?.startedAt.toISOString() ?? null, completedAt: row?.completedAt?.toISOString() ?? null, updatedAt: row?.updatedAt.toISOString() ?? null, rowVersion: row?.rowVersion.toString() ?? null };
}
const readingRow = (db: Db, contextId: string, lessonRevisionId: string) => db.lessonConsumption.findUnique({ where: { contextId_lessonRevisionId: { contextId, lessonRevisionId } }, select: readingSelect });

export async function loadLearnerCatalogue(contextId: string, verifiedUserId: string): Promise<LearnerCatalogueDto> {
  contextId = validId(contextId);
  const db = getLearnerPrisma(), c = await ownedContext(db, contextId, verifiedUserId);
  const result: LearnerCatalogueDto = {
    context: { id: c.id, courseId: c.courseId, courseTitle: labels(c.course.names), targetLanguage: { id: c.language.id, code: c.language.code, names: labels(c.language.names) }, framework: c.course.framework, workingLevel: c.workingLevel ? { id: c.workingLevel.id, code: c.workingLevel.code, label: labels(c.workingLevel.label), position: c.workingLevel.position } : null }, units: [],
  };
  if (!c.workingLevel) return { ...result, message: 'Chưa có trình độ học hiện tại' };
  const units = await hierarchy(db, c);
  const rows = await db.lessonConsumption.findMany({ where: { contextId: c.id }, select: { lessonRevisionId: true, completedAt: true } });
  const reading = new Map(rows.map(r => [r.lessonRevisionId, r.completedAt ? 'COMPLETED' as const : 'IN_PROGRESS' as const]));
  result.units = units.map(unit => ({ id: unit.id, position: unit.position, names: labels(unit.names), lessons: unit.lessons.map(l => ({ id: l.id, position: l.position, isRequired: l.isRequired, title: labels(l.activeRevision!.title), isLocked: l.isLocked, ...(l.isLocked ? { lockReason: 'Cần hoàn thành bài học trước' } : {}), activeRevisionId: l.isLocked ? null : l.activeRevisionId, readingState: reading.get(l.activeRevisionId!) ?? 'NOT_STARTED' })) }));
  return result;
}
export async function loadLearnerLessonDetail(contextId: string, lessonId: string, verifiedUserId: string): Promise<LearnerLessonDetailDto> {
  contextId = validId(contextId); lessonId = validId(lessonId);
  const db = getLearnerPrisma(), c = await ownedContext(db, contextId, verifiedUserId), l = await authorizedLesson(db, c, lessonId), rev = l.activeRevision;
  const exercises = await db.lessonExercise.findMany({
    where: { lessonRevisionId: rev.id }, orderBy: [{ position: 'asc' }, { id: 'asc' }],
    select: { id: true, lessonRevisionId: true, itemId: true, itemRevisionId: true, position: true, isCore: true, item: { select: { id: true, origin: true } }, itemRevision: { select: { id: true, itemId: true, type: true, schemaVersion: true, promptData: true, assessmentBlueprintId: true } } },
  });
  const vocabulary = await db.lessonVocabularyLink.findMany({ where: { lessonRevisionId: rev.id }, orderBy: [{ position: 'asc' }, { id: 'asc' }], select: { id: true, position: true, isCore: true, displaySnapshot: true } });
  return {
    contextId: c.id, lessonId: l.id, unit: { id: l.unit.id, position: l.unit.position, names: labels(l.unit.names) },
    revision: { id: rev.id, revisionNo: rev.revisionNo, title: labels(rev.title), contentBlocks: Array.isArray(rev.contentBlocks) ? rev.contentBlocks.map(block => { const b = block as { type?: unknown; text?: unknown } | null; if (b?.type !== 'paragraph' || typeof b.text !== 'string') return fail(409, 'CONTENT_INCONSISTENT', 'Định dạng nội dung không được hỗ trợ.'); return { type: 'paragraph', text: b.text }; }) : fail(409, 'CONTENT_INCONSISTENT', 'Định dạng nội dung không được hỗ trợ.'), topicIds: rev.topicIds, skillIds: rev.skillIds, purposeTags: rev.purposeTags },
    exercises: exercises.filter(ex => ex.item.origin === 'PRACTICE' && ex.itemRevision.assessmentBlueprintId == null).map(ex => { if (ex.itemRevision.id !== ex.itemRevisionId || ex.itemRevision.itemId !== ex.itemId || ex.item.id !== ex.itemId || ex.lessonRevisionId !== rev.id) return fail(409, 'CONTENT_INCONSISTENT', 'Phiên bản bài tập không nhất quán.'); return publicExercise(ex); }),
    vocabulary: vocabulary.map(publicVocabulary), consumption: readingDto(c.id, l.id, rev.id, await readingRow(db, c.id, rev.id)),
  };
}
export async function getLessonReading(contextId: string, lessonId: string, verifiedUserId: string): Promise<LessonReadingDto> {
  contextId = validId(contextId); lessonId = validId(lessonId);
  const db = getLearnerPrisma(), c = await ownedContext(db, contextId, verifiedUserId), l = await authorizedLesson(db, c, lessonId);
  return readingDto(c.id, l.id, l.activeRevisionId!, await readingRow(db, c.id, l.activeRevisionId!));
}
async function clock(db: Db) {
  const rows = await db.$queryRaw<Array<{ ts: Date }>>`SELECT clock_timestamp() AS ts`;
  if (!(rows[0]?.ts instanceof Date) || !Number.isFinite(rows[0].ts.valueOf())) throw new Error('Database clock unavailable');
  return rows[0].ts;
}
export async function mutateLessonConsumption(contextId: string, lessonId: string, input: ConsumptionPostInput, verifiedUserId: string): Promise<LessonReadingDto> {
  contextId = validId(contextId); lessonId = validId(lessonId);
  const parsed = consumptionPostSchema.safeParse(input);
  if (!parsed.success) return fail(400, 'VALIDATION_ERROR', 'Dữ liệu đọc không hợp lệ.');
  input = parsed.data;
  return getLearnerPrisma().$transaction(async tx => {
    await tx.$queryRaw`SELECT id::text FROM app.accounts WHERE id = ${verifiedUserId}::uuid FOR NO KEY UPDATE`;
    const account = await tx.account.findUnique({ where: { id: verifiedUserId }, select: { id: true, status: true, role: true } });
    if (!account || account.role !== 'LEARNER' || account.status !== 'ACTIVE') return fail(403, 'ACCOUNT_INACTIVE', 'Tài khoản học viên không hoạt động.');
    const candidate = await tx.learningContext.findFirst({ where: { id: contextId, learnerId: verifiedUserId }, select: { id: true, courseId: true } });
    if (!candidate) return fail(404, 'NOT_FOUND', 'Lộ trình học không tồn tại.');
    await tx.$queryRaw`SELECT id::text FROM app.courses WHERE id = ${candidate.courseId}::uuid FOR SHARE`;
    await tx.$queryRaw`SELECT id::text FROM app.learning_contexts WHERE id = ${contextId}::uuid FOR SHARE`;
    await tx.$queryRaw`SELECT id::text FROM app.lessons WHERE id = ${lessonId}::uuid FOR SHARE`;
    const c = await ownedContext(tx, contextId, verifiedUserId);
    if (c.courseId !== candidate.courseId) return fail(409, 'CONTEXT_INCONSISTENT', 'Lộ trình học đã thay đổi. Vui lòng tải lại.');
    const l = await authorizedLesson(tx, c, lessonId), revisionId = l.activeRevisionId!;
    // This condition also precedes every idempotent return, even for completed X.
    if (input.expectedPublishedRevisionId !== revisionId) return fail(409, 'PUBLICATION_CHANGED', 'Nội dung bài học đã được cập nhật. Vui lòng tải lại trang.');
    const lockReading = async () => {
      await tx.$queryRaw`SELECT id::text FROM app.lesson_consumptions WHERE context_id = ${contextId}::uuid AND lesson_revision_id = ${revisionId}::uuid FOR UPDATE`;
      return readingRow(tx, contextId, revisionId);
    };
    let row = await lockReading();
    if (input.action === 'start') {
      if (!row) {
        const now = await clock(tx);
        await tx.$executeRaw`INSERT INTO app.lesson_consumptions (context_id, lesson_id, lesson_revision_id, started_at, created_at, updated_at) VALUES (${contextId}::uuid, ${lessonId}::uuid, ${revisionId}::uuid, ${now}, ${now}, ${now}) ON CONFLICT (context_id, lesson_revision_id) DO NOTHING`;
        row = await lockReading();
        if (!row) throw new Error('Consumption insert unavailable');
      }
    } else {
      if (!row) return fail(409, 'CONSUMPTION_NOT_STARTED', 'Chưa bắt đầu đọc bài học. Vui lòng mở nội dung trước.');
      if (!row.completedAt) {
        const now = await clock(tx);
        row = await tx.lessonConsumption.update({ where: { id: row.id }, data: { completedAt: now, updatedAt: now, rowVersion: { increment: 1 } }, select: readingSelect });
      }
    }
    return readingDto(contextId, lessonId, revisionId, row);
  }, { isolationLevel: 'ReadCommitted', timeout: 15000 });
}
