import 'server-only';
import { ContextServiceError } from './dto.ts';
import { labels, loadLessonHierarchy, published, type Db } from '../lessons/service.ts';
import {
  type OnboardingPurpose,
  type DailyGoalMinutes,
  type RecommendationReasonCode,
  type NextLessonCandidateDto,
} from './onboarding-dto.ts';
import type { LevelSummaryDto } from './dto.ts';

export { published as isEligiblePublishedLesson, labels as formatLabels };

export async function loadNextLesson(
  db: Db,
  params: {
    courseId: string;
    frameworkId: string;
    workingLevel: { id: string; position: number };
    completedLessonIds: ReadonlySet<string>;
    contextId?: string | null;
  }
) {
  const { courseId, frameworkId, workingLevel, completedLessonIds, contextId } = params;
  const units = await loadLessonHierarchy(db, courseId, frameworkId, workingLevel.position, completedLessonIds);
  const lesson = units.flatMap(unit => unit.lessons).find(row => !row.isLocked && !completedLessonIds.has(row.id));
  return {
    hasCurriculum: units.length > 0,
    nextLesson: lesson?.activeRevision
      ? {
          id: lesson.id,
          title: labels(lesson.activeRevision.title),
          href: contextId ? `/learn/${contextId}/${lesson.id}` : `/learn/${lesson.id}`,
        }
      : null,
  };
}

export async function resolveNextLesson(db: Db, params: Parameters<typeof loadNextLesson>[1]) {
  return (await loadNextLesson(db, params)).nextLesson;
}

export interface RecommendationCandidateResult {
  course: {
    id: string;
    names: Record<string, any>;
    framework: {
      id: string;
      code: string;
      version: string;
      names: Record<string, any>;
    };
  };
  startLevel: LevelSummaryDto;
  reasonCodes: RecommendationReasonCode[];
  nextLesson: NextLessonCandidateDto | null;
}

/**
 * Authoritative curriculum recommendation resolver.
 * Evaluates candidate courses/levels and next lesson for new or existing users.
 * Does NOT write to database.
 */
export async function resolveRecommendation(
  db: any,
  params: {
    languageId: string;
    purpose?: OnboardingPurpose | null;
    dailyGoalMinutes?: DailyGoalMinutes;
    entryChoice:
      | { startSource: 'DEFAULT' }
      | { startSource: 'SELF_REPORT'; courseId?: string; levelId: string };
    contextId?: string | null;
    completedLessonIds?: Set<string>;
    courseIds?: string[];
  }
): Promise<RecommendationCandidateResult | null> {
  const { languageId, purpose, entryChoice, contextId, completedLessonIds = new Set(), courseIds } = params;

  // 1. Verify language isLearnable
  const language = await db.language.findUnique({
    where: { id: languageId },
    select: { id: true, code: true, isLearnable: true },
  });

  if (!language || !language.isLearnable) {
    return null;
  }

  if (entryChoice.startSource === 'DEFAULT') {
    // 2. Fetch all active courses for this language
    const courses = await db.course.findMany({
      where: { languageId, isActive: true, ...(courseIds && { id: { in: courseIds } }) },
      orderBy: [{ id: 'asc' }],
      include: {
        framework: {
          select: { id: true, code: true, version: true, names: true },
        },
        units: {
          where: {
            level: { framework: { courses: { some: { languageId, isActive: true } } } },
          },
          include: {
            level: {
              select: { id: true, code: true, label: true, position: true, frameworkId: true },
            },
            lessons: {
              where: {
                availability: 'AVAILABLE',
                activeRevisionId: { not: null },
              },
              include: {
                activeRevision: {
                  select: { id: true, lessonId: true, status: true, title: true, purposeTags: true },
                },
              },
              orderBy: [{ position: 'asc' }, { id: 'asc' }],
            },
          },
          orderBy: [{ level: { position: 'asc' } }, { position: 'asc' }, { id: 'asc' }],
        },
      },
    });

    // Evaluate each course for candidate starting level
    interface CourseCandidate {
      course: typeof courses[number];
      lowestLevel: LevelSummaryDto;
      hasPurposeMatch: boolean;
    }

    const candidateCourses: CourseCandidate[] = [];

    for (const course of courses) {
      // Group eligible levels that have at least 1 published lesson
      const levelMap = new Map<string, { level: LevelSummaryDto; purposeMatch: boolean }>();

      for (const unit of course.units) {
        if (!unit.level || unit.courseId !== course.id || unit.level.id !== unit.levelId || unit.level.frameworkId !== course.frameworkId) continue;
        const publishedLessons = unit.lessons.filter((lesson: { unitId: string } & Parameters<typeof published>[0]) => lesson.unitId === unit.id && published(lesson));
        if (publishedLessons.length > 0) {
          const lvlId = unit.level.id;
          let purposeMatch = false;
          if (purpose) {
            const normPurpose = purpose.toLowerCase();
            for (const l of publishedLessons) {
              const tags = (l.activeRevision?.purposeTags || []).map((t: string) => t.toLowerCase());
              if (tags.includes(normPurpose)) {
                purposeMatch = true;
                break;
              }
            }
          }

          if (!levelMap.has(lvlId)) {
            levelMap.set(lvlId, {
              level: {
                id: unit.level.id,
                code: unit.level.code,
                label: unit.level.label as Record<string, any>,
                position: unit.level.position,
              },
              purposeMatch,
            });
          } else if (purposeMatch) {
            levelMap.get(lvlId)!.purposeMatch = true;
          }
        }
      }

      const eligibleLevels = Array.from(levelMap.values()).sort(
        (a, b) => a.level.position - b.level.position || a.level.id.localeCompare(b.level.id)
      );

      if (eligibleLevels.length > 0) {
        const lowest = eligibleLevels[0];
        candidateCourses.push({
          course,
          lowestLevel: lowest.level,
          hasPurposeMatch: lowest.purposeMatch,
        });
      }
    }

    if (candidateCourses.length === 0) {
      return null;
    }

    // Determine winning course among candidates
    let winningContenders = candidateCourses;
    let purposeMatchInfluenced = false;

    if (purpose && candidateCourses.length > 1) {
      const matchingCourses = candidateCourses.filter((c) => c.hasPurposeMatch);
      // Only influence if some match and some don't
      if (matchingCourses.length > 0 && matchingCourses.length < candidateCourses.length) {
        winningContenders = matchingCourses;
        purposeMatchInfluenced = true;
      }
    }

    // Tie-break deterministically by courseId ASC
    winningContenders.sort((a, b) => a.course.id.localeCompare(b.course.id));
    const winner = winningContenders[0];

    const reasonCodes: RecommendationReasonCode[] = ['LOWEST_AVAILABLE_LEVEL'];
    if (purposeMatchInfluenced && candidateCourses.some(candidate => candidate.course.id.localeCompare(winner.course.id) < 0)) {
      reasonCodes.push('PURPOSE_MATCH');
    }

    // Derive next lesson candidate
    const nextLesson = await resolveNextLesson(db, {
      courseId: winner.course.id,
      frameworkId: winner.course.frameworkId,
      workingLevel: winner.lowestLevel,
      completedLessonIds,
      contextId,
    });

    return {
      course: {
        id: winner.course.id,
        names: winner.course.names as Record<string, any>,
        framework: {
          id: winner.course.framework.id,
          code: winner.course.framework.code,
          version: winner.course.framework.version,
          names: winner.course.framework.names as Record<string, any>,
        },
      },
      startLevel: winner.lowestLevel,
      reasonCodes,
      nextLesson,
    };
  } else {
    // SELF_REPORT
    const { courseId, levelId } = entryChoice;

    let course: any = null;
    if (courseId) {
      if (courseIds && !courseIds.includes(courseId)) return null;
      course = await db.course.findFirst({
        where: { id: courseId, languageId, isActive: true },
        include: {
          framework: {
            select: { id: true, code: true, version: true, names: true },
          },
        },
      });
    } else {
      course = await db.course.findFirst({
        where: {
          languageId,
          isActive: true,
          units: { some: { levelId } },
          ...(courseIds && { id: { in: courseIds } }),
        },
        orderBy: { id: 'asc' },
        include: {
          framework: {
            select: { id: true, code: true, version: true, names: true },
          },
        },
      });
    }

    if (!course) {
      throw new ContextServiceError(
        400,
        'COURSE_INVALID',
        'Khóa học không hợp lệ hoặc không thuộc ngôn ngữ này.'
      );
    }

    const level = await db.level.findUnique({
      where: { id: levelId },
      select: { id: true, code: true, label: true, position: true, frameworkId: true },
    });

    if (!level || level.frameworkId !== course.frameworkId) {
      throw new ContextServiceError(
        400,
        'LEVEL_INVALID',
        'Trình độ được chọn không thuộc khung năng lực của khóa học.'
      );
    }

    // Verify published eligible lessons exist in this course at this level
    const unitsAtLevel = await db.unit.findMany({
      where: { courseId: course.id, levelId },
      include: {
        lessons: {
          where: { availability: 'AVAILABLE', activeRevisionId: { not: null } },
          include: {
            activeRevision: {
              select: { id: true, lessonId: true, status: true, title: true },
            },
          },
        },
      },
    });

    const hasPublished = unitsAtLevel.some((u: any) =>
      u.lessons.some(published)
    );

    if (!hasPublished) {
      throw new ContextServiceError(
        409,
        'LEVEL_NOT_ELIGIBLE',
        'Trình độ được chọn hiện chưa có bài học nào được phát hành.'
      );
    }

    const startLevel: LevelSummaryDto = {
      id: level.id,
      code: level.code,
      label: level.label as Record<string, any>,
      position: level.position,
    };

    const nextLesson = await resolveNextLesson(db, {
      courseId: course.id,
      frameworkId: course.frameworkId,
      workingLevel: startLevel,
      completedLessonIds,
      contextId,
    });

    return {
      course: {
        id: course.id,
        names: course.names as Record<string, any>,
        framework: {
          id: course.framework.id,
          code: course.framework.code,
          version: course.framework.version,
          names: course.framework.names as Record<string, any>,
        },
      },
      startLevel,
      reasonCodes: ['SELF_REPORTED_LEVEL'],
      nextLesson,
    };
  }
}
