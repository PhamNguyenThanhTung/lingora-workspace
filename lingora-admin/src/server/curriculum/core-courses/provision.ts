import type { PrismaClient } from '../../../../generated/product-client/index.js';
import {
  createLesson,
  assignLesson,
  saveTeacherLessonDraft,
  submitTeacherLesson,
  approveReview,
  publishReview,
} from '../../lessons/index.ts';
import { buildLessonPayload } from './build.ts';
import { COURSE_IDS, FRAMEWORKS, LANGUAGES, levelOf, unitId } from './reference.ts';
import type { CourseSpec, LanguageKey } from './types.ts';

export interface CoreActors {
  adminId: string;
  /** Teacher that owns (authors) the lessons of each language. */
  teacherIds: Record<LanguageKey, string>;
}

export interface CoreProvisionResult {
  language: LanguageKey;
  courseId: string;
  units: number;
  lessons: number;
  alreadyPublished: number;
  published: number;
}

/** Existing names may omit locales (older seeds); every locale that IS present must match. */
function namesCompatible(existing: unknown, expected: Record<string, string>): boolean {
  const ex = existing as Record<string, string>;
  return Object.entries(ex).every(([k, v]) => expected[k] === v) && Object.keys(ex).length > 0;
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a, Object.keys(a as object).sort()) === JSON.stringify(b, Object.keys(b as object).sort());
}

/** Languages, frameworks and levels. Existing rows are verified, never overwritten (same rule as the base seed). */
export async function ensureReferenceData(prisma: PrismaClient, keys: LanguageKey[]): Promise<void> {
  for (const key of keys) {
    const lang = LANGUAGES[key];
    const row = await prisma.language.upsert({
      where: { code: lang.code },
      update: {},
      create: { id: lang.id, code: lang.code, names: lang.names, isLearnable: lang.isLearnable, isUiLocale: lang.isUiLocale },
    });
    if (row.id !== lang.id || !row.isLearnable || !sameJson(row.names, lang.names)) {
      throw new Error(`[core-courses] MISMATCH: language '${lang.code}' already exists with different configuration. Refusing to overwrite.`);
    }

    const fw = FRAMEWORKS[key];
    const framework = await prisma.framework.upsert({
      where: { code_version: { code: fw.code, version: fw.version } },
      update: {},
      create: { id: fw.id, code: fw.code, version: fw.version, names: fw.names },
    });
    if (framework.id !== fw.id || !namesCompatible(framework.names, fw.names)) {
      throw new Error(`[core-courses] MISMATCH: framework ${fw.code} ${fw.version} already exists with different configuration.`);
    }
    for (const lv of fw.levels) {
      const level = await prisma.level.upsert({
        where: { frameworkId_code: { frameworkId: framework.id, code: lv.code } },
        update: {},
        create: { id: lv.id, frameworkId: framework.id, code: lv.code, position: lv.position, label: lv.label },
      });
      if (level.id !== lv.id || level.position !== lv.position || !sameJson(level.label, lv.label)) {
        throw new Error(`[core-courses] MISMATCH: level ${fw.code}/${lv.code} already exists with different configuration.`);
      }
    }
  }
}

async function resolveVocabulary(prisma: PrismaClient, languageId: string, list: Array<any>) {
  const resolved = [];
  for (const item of list) {
    const existing = await prisma.vocabularyConcept.findFirst({
      where: {
        languageId,
        normalizedForm: item.create.canonicalForm.normalize('NFC').trim().toLowerCase(),
        senseKey: item.create.senseKey.trim(),
      },
    });
    resolved.push(existing ? { vocabularyId: existing.id, position: item.position, isCore: item.isCore } : item);
  }
  return resolved;
}

function expectOk(res: { status: number; data?: any }, what: string, ok: number[] = [200, 201]): any {
  if (!ok.includes(res.status)) throw new Error(`[core-courses] ${what} failed: ${JSON.stringify(res)}`);
  return res.data?.data;
}

export async function provisionCoreCourse(
  prisma: PrismaClient,
  spec: CourseSpec,
  actors: CoreActors,
  log: (msg: string) => void = () => {}
): Promise<CoreProvisionResult> {
  const key = spec.key;
  const lang = LANGUAGES[key];
  const fw = FRAMEWORKS[key];
  const courseId = COURSE_IDS[key];
  const teacherId = actors.teacherIds[key];

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    await prisma.course.create({
      data: {
        id: courseId,
        languageId: lang.id,
        frameworkId: fw.id,
        defaultStartLevelId: levelOf(key, spec.defaultLevel).id,
        names: spec.names,
        isActive: true,
        curriculumGeneration: 1n,
        coverageCatalogGeneration: 1n,
        gateConfig: {},
        practiceConfig: {},
        coverageCatalog: {},
      },
    });
    log(`created course ${spec.names.vi}`);
  } else if (course.languageId !== lang.id || course.frameworkId !== fw.id) {
    throw new Error(`[core-courses] MISMATCH: course ${courseId} belongs to a different language/framework.`);
  }

  const levelCounters = new Map<string, number>();
  let lessonCount = 0;
  let alreadyPublished = 0;
  let published = 0;

  for (const unit of spec.units) {
    const position = (levelCounters.get(unit.level) ?? 0) + 1;
    levelCounters.set(unit.level, position);
    const level = levelOf(key, unit.level);
    const dbUnit = await prisma.unit.upsert({
      where: { courseId_levelId_position: { courseId, levelId: level.id, position } },
      update: { names: unit.names },
      create: {
        id: unitId(key, unit.level, position),
        courseId,
        levelId: level.id,
        code: `${key.toUpperCase()}-${unit.level}-U${String(position).padStart(2, '0')}`,
        position,
        names: unit.names,
      },
    });

    for (let li = 0; li < unit.lessons.length; li++) {
      lessonCount++;
      const lessonPos = li + 1;
      const lessonKey = `${key}-${unit.level.toLowerCase()}-u${position}-l${lessonPos}`;
      const payload = buildLessonPayload(key, lessonKey, lessonCount, unit.lessons[li]);

      let lesson = await prisma.lesson.findFirst({
        where: { unitId: dbUnit.id, position: lessonPos },
        include: { assignment: true, revisions: { orderBy: { revisionNo: 'desc' }, take: 1 }, activeRevision: true },
      });
      if (lesson?.availability === 'AVAILABLE' && lesson.activeRevision?.status === 'PUBLISHED') {
        alreadyPublished++;
        continue;
      }

      if (!lesson) {
        const res = await createLesson(actors.adminId, courseId, dbUnit.id, { position: lessonPos, isRequired: true }, prisma);
        const created = expectOk(res, `createLesson ${lessonKey}`, [201]);
        lesson = await prisma.lesson.findUniqueOrThrow({
          where: { id: created.id },
          include: { assignment: true, revisions: { orderBy: { revisionNo: 'desc' }, take: 1 }, activeRevision: true },
        });
      }
      if (!lesson.assignment) {
        const res = await assignLesson(
          actors.adminId, courseId, dbUnit.id, lesson.id,
          { teacherId, expectedRowVersion: lesson.rowVersion.toString() },
          prisma
        );
        expectOk(res, `assignLesson ${lessonKey}`);
      }

      let revision = (await prisma.lesson.findUniqueOrThrow({
        where: { id: lesson.id },
        include: { revisions: { orderBy: { revisionNo: 'desc' }, take: 1 } },
      })).revisions[0];

      if (!revision || revision.status === 'DRAFT') {
        const fresh = await prisma.lesson.findUniqueOrThrow({ where: { id: lesson.id } });
        const vocabulary = await resolveVocabulary(prisma, lang.id, payload.vocabulary);
        const res = await saveTeacherLessonDraft(
          teacherId,
          lesson.id,
          {
            title: payload.title,
            blocks: payload.blocks,
            vocabulary,
            exercises: payload.exercises,
            expectedRevisionId: revision?.id ?? null,
            expectedRowVersion: fresh.rowVersion.toString(),
          } as any,
          prisma
        );
        const saved = expectOk(res, `saveDraft ${lessonKey}`);
        revision = await prisma.lessonRevision.findUniqueOrThrow({ where: { id: saved.highestRevision.id } });
      }

      let submissionId: string | undefined;
      if (revision.status === 'DRAFT') {
        const freshLesson = await prisma.lesson.findUniqueOrThrow({ where: { id: lesson.id } });
        const res = await submitTeacherLesson(
          teacherId,
          lesson.id,
          {
            revisionId: revision.id,
            expectedLessonRowVersion: freshLesson.rowVersion.toString(),
            expectedRevisionRowVersion: revision.rowVersion.toString(),
          },
          prisma
        );
        expectOk(res, `submit ${lessonKey}`);
        submissionId = res.data.submissionId;
      } else {
        submissionId = (await prisma.revisionReview.findFirstOrThrow({
          where: { lessonRevisionId: revision.id, action: 'SUBMIT' },
          orderBy: { occurredAt: 'desc' },
        })).id;
      }

      let rev = await prisma.lessonRevision.findUniqueOrThrow({ where: { id: revision.id } });
      if (rev.status === 'IN_REVIEW') {
        const res = await approveReview(actors.adminId, submissionId!, { expectedRevisionRowVersion: rev.rowVersion.toString() }, prisma);
        expectOk(res, `approve ${lessonKey}`);
        rev = await prisma.lessonRevision.findUniqueOrThrow({ where: { id: revision.id } });
      }
      if (rev.status === 'APPROVED') {
        const freshLesson = await prisma.lesson.findUniqueOrThrow({ where: { id: lesson.id } });
        const res = await publishReview(
          actors.adminId,
          submissionId!,
          {
            expectedRevisionRowVersion: rev.rowVersion.toString(),
            expectedLessonRowVersion: freshLesson.rowVersion.toString(),
            makeAvailable: true,
          },
          prisma
        );
        expectOk(res, `publish ${lessonKey}`);
      }
      published++;
      log(`published ${lessonKey}: ${unit.lessons[li].title.en}`);
    }
  }

  return { language: key, courseId, units: spec.units.length, lessons: lessonCount, alreadyPublished, published };
}
