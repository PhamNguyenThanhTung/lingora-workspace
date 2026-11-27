import 'server-only';
import type { Context, Db } from '../lessons/service.ts';

export interface LevelUpDto { from: { id: string; code: string }; to: { id: string; code: string } }

// Caller holds Account -> Course -> Context -> Lesson locks in the finalize transaction.
export async function advanceCompletedLevel(tx: Db, context: Context): Promise<LevelUpDto | null> {
  const from = context.workingLevel;
  if (!from) return null;
  const required = await tx.lesson.findMany({
    where: { isRequired: true, availability: 'AVAILABLE', unit: { courseId: context.courseId, levelId: from.id }, activeRevision: { status: 'PUBLISHED' } },
    select: { id: true, activeRevisionId: true, activeRevision: { select: { id: true, lessonId: true } } },
  });
  if (!required.length || required.some(lesson => lesson.activeRevisionId !== lesson.activeRevision?.id || lesson.activeRevision.lessonId !== lesson.id)) return null;
  const done = (await tx.lessonCompletion.findMany({ where: { contextId: context.id, lessonId: { in: required.map(lesson => lesson.id) } }, select: { lessonId: true } })).length;
  if (done !== required.length) return null;
  const [next] = await tx.level.findMany({ where: { frameworkId: from.frameworkId, position: { gt: from.position } }, orderBy: { position: 'asc' }, take: 1 });
  if (!next) return null;
  const published = await tx.lesson.count({ where: { availability: 'AVAILABLE', unit: { courseId: context.courseId, levelId: next.id }, activeRevision: { status: 'PUBLISHED' } } });
  if (!published) return null;
  const changed = await tx.learningContext.updateMany({ where: { id: context.id, learnerId: context.learnerId, status: 'ACTIVE', workingLevelId: from.id }, data: { workingLevelId: next.id, rowVersion: { increment: 1 } } });
  return changed.count === 1 ? { from: { id: from.id, code: from.code }, to: { id: next.id, code: next.code } } : null;
}
