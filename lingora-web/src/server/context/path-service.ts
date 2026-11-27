import 'server-only';
import { contextSelect, fail, labels, loadLessonHierarchy, validId, type Db } from '../lessons/service.ts';
import type { PathNodeDto, ContinueLearningDto, PathStatus, PathSectionDto } from './home-dto.ts';

function formatTitle(titleObj: unknown): string {
  if (typeof titleObj === 'string') return titleObj;
  const l = labels(titleObj);
  return l['vi'] || l['en'] || Object.values(l)[0] || '';
}

export interface PathResult {
  status: PathStatus;
  message?: string;
  path: PathNodeDto[];
  sections: PathSectionDto[];
  currentLevel: { code: string; label: string } | null;
  continueLearning: ContinueLearningDto | null;
}

export async function buildLearningPath(
  db: Db,
  contextId: string,
  verifiedUserId: string
): Promise<PathResult> {
  contextId = validId(contextId);
  const c = await db.learningContext.findFirst({
    where: { id: contextId, learnerId: verifiedUserId },
    select: contextSelect,
  });
  if (!c || c.learnerId !== verifiedUserId) {
    return fail(404, 'NOT_FOUND', 'Lộ trình học không tồn tại.');
  }

  if (c.status === 'PAUSED') {
    return {
      status: 'PAUSED',
      message: 'Lộ trình học đang tạm dừng.',
      path: [],
      sections: [],
      currentLevel: c.workingLevel ? { code: c.workingLevel.code, label: formatTitle(c.workingLevel.label) } : null,
      continueLearning: null,
    };
  }

  if (!c.course.isActive) {
    return {
      status: 'COURSE_INACTIVE',
      message: 'Khóa học hiện đang tạm khóa.',
      path: [],
      sections: [],
      currentLevel: c.workingLevel ? { code: c.workingLevel.code, label: formatTitle(c.workingLevel.label) } : null,
      continueLearning: null,
    };
  }

  if (!c.workingLevel) {
    return {
      status: 'NO_WORKING_LEVEL',
      message: 'Lộ trình chưa được xếp lớp trình độ học.',
      path: [],
      sections: [],
      currentLevel: null,
      continueLearning: null,
    };
  }

  if (c.course.id !== c.courseId || c.course.languageId !== c.languageId ||
      c.language.id !== c.languageId || c.workingLevel.id !== c.workingLevelId ||
      c.workingLevel.frameworkId !== c.course.frameworkId ||
      (c.selectedStartLevelId && (c.selectedStartLevel?.id !== c.selectedStartLevelId ||
        c.selectedStartLevel.frameworkId !== c.course.frameworkId))) {
    return fail(409, 'CONTEXT_INCONSISTENT', 'Ngôn ngữ hoặc khung năng lực của lộ trình không nhất quán.');
  }

  const completions = await db.lessonCompletion.findMany({
    where: { contextId },
    select: { lessonId: true },
  });
  const completedIds = new Set(completions.map(row => row.lessonId));
  const units = await loadLessonHierarchy(db, c.courseId, c.course.frameworkId, c.workingLevel.position, completedIds, true);
  const [openAttempts, openReading, completedAttempts] = await Promise.all([
    db.lessonAttempt.findMany({
      where: { contextId, completedAt: null },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      select: { lessonId: true, lessonRevisionId: true, startedAt: true },
    }),
    db.lessonConsumption.findMany({
      where: { contextId, completedAt: null },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      select: { lessonId: true, lessonRevisionId: true, startedAt: true },
    }),
    db.lessonAttempt.findMany({
      where: { contextId, completedAt: { not: null } },
      orderBy: [{ completedAt: 'desc' }, { id: 'desc' }],
      distinct: ['lessonId'],
      select: { lessonId: true, contributionUnits: true, nCore: true, kFirstWrong: true },
    }),
  ]);

  const scores = new Map(completedAttempts.flatMap(attempt =>
    attempt.contributionUnits != null && attempt.kFirstWrong != null && attempt.nCore > 0
      ? [[attempt.lessonId, Math.round(attempt.contributionUnits * 100 / (2 * (attempt.nCore + attempt.kFirstWrong)))] as const]
      : []
  ));
  const pathNodes: PathNodeDto[] = [];
  const available = new Map<string, { node: PathNodeDto; revisionId: string }>();

  for (const unit of units) {
    const unitTitle = formatTitle(unit.names) || 'Đơn vị ' + unit.position;
    for (const lesson of unit.lessons) {
      const comingSoon = lesson.availability === 'PLANNED';
      const completed = !comingSoon && completedIds.has(lesson.id);
      const node: PathNodeDto = {
        lessonId: lesson.id,
        title: comingSoon ? 'Bài học sắp ra mắt' : formatTitle(lesson.activeRevision?.title) || 'Bài học ' + lesson.position,
        unitTitle,
        unitPosition: unit.position,
        state: comingSoon ? 'COMING_SOON' : completed ? 'COMPLETED' : lesson.isLocked ? 'LOCKED' : 'AVAILABLE',
        score: completed ? scores.get(lesson.id) ?? null : null,
        position: lesson.position,
        isRequired: lesson.isRequired,
        href: lesson.isLocked ? '' : '/learn/' + c.id + '/' + lesson.id,
      };
      pathNodes.push(node);
      if (node.state === 'AVAILABLE' && lesson.activeRevisionId) {
        available.set(lesson.id, { node, revisionId: lesson.activeRevisionId });
      }
    }
  }

  const open = [...openAttempts, ...openReading]
    .sort((a, b) => b.startedAt.valueOf() - a.startedAt.valueOf())
    .find(row => available.get(row.lessonId)?.revisionId === row.lessonRevisionId);
  const current = (open && available.get(open.lessonId)) || available.values().next().value;
  let continueLearning: ContinueLearningDto | null = null;
  if (current) {
    current.node.state = 'CURRENT';
    const { lessonId, title, unitTitle, href } = current.node;
    continueLearning = { lessonId, title, unitTitle, href, status: open ? 'IN_PROGRESS' : 'READY' };
  }

  const levels = await db.level.findMany({ where: { frameworkId: c.course.frameworkId }, orderBy: [{ position: 'asc' }, { id: 'asc' }] });
  const next = levels.find(level => level.position > c.workingLevel!.position);
  const sections: PathSectionDto[] = levels.map(level => {
    const sectionUnits = units.filter(unit => unit.levelId === level.id).map(unit => {
      const nodes = pathNodes.filter(node => unit.lessons.some(lesson => lesson.id === node.lessonId));
      return { unitId: unit.id, position: unit.position, title: formatTitle(unit.names), progress: { done: nodes.filter(node => node.state === 'COMPLETED').length, total: nodes.filter(node => node.state !== 'COMING_SOON').length }, nodes };
    });
    const nodes = sectionUnits.flatMap(unit => unit.nodes);
    const required = nodes.filter(node => node.isRequired && node.state !== 'COMING_SOON');
    const requiredDone = required.filter(node => node.state === 'COMPLETED').length;
    const hasPublished = nodes.some(node => node.state !== 'COMING_SOON');
    const state = !hasPublished ? 'COMING_SOON' : level.id === c.workingLevel!.id ? 'CURRENT' : level.position < c.workingLevel!.position ? 'COMPLETED' : level.id === next?.id ? 'NEXT' : 'LOCKED';
    return { levelId: level.id, levelCode: level.code, levelLabel: formatTitle(level.label), position: level.position, state, progress: { requiredDone, requiredTotal: required.length }, canSkipTo: false, units: sectionUnits };
  });
  return {
    status: pathNodes.length ? 'READY' : 'EMPTY_CURRICULUM',
    ...(pathNodes.length ? {} : { message: 'Chưa có bài học nào trong lộ trình này.' }),
    sections,
    currentLevel: { code: c.workingLevel.code, label: formatTitle(c.workingLevel.label) },
    path: pathNodes,
    continueLearning,
  };
}
