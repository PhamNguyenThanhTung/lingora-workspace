import 'server-only';
import type { CookieAdapter } from '../auth/index.ts';
import { getLearnerPrisma } from '../db/index.ts';
import { LessonServiceError } from '../lessons/dto.ts';
import { ContextServiceError, isValidUuid } from './dto.ts';
import { loadLearnerContext, type LoadLearnerContextOptions } from './loader.ts';
import { buildLearningPath } from './path-service.ts';
import { getContextPlanSummary } from './onboarding-service.ts';
import { getGamificationOverview } from '../gamification/service.ts';
import { getDbTime } from '../srs/service.ts';
import type { HomeDto } from './home-dto.ts';

export interface LoadLearnerHomeOptions extends LoadLearnerContextOptions {
  contextId?: string | null;
}

export type LoadLearnerHomeResult =
  | {
      ok: true;
      status: 200;
      data: HomeDto;
    }
  | {
      ok: false;
      status: 400 | 401 | 403 | 404 | 409 | 503;
      error: {
        code: string;
        message: string;
      };
    };

export async function loadLearnerHome(
  cookieStore?: CookieAdapter,
  options?: LoadLearnerHomeOptions
): Promise<LoadLearnerHomeResult> {
  const contextResult = await loadLearnerContext(cookieStore, options);
  if (!contextResult.ok) {
    return contextResult;
  }

  const { learner, contexts } = contextResult.data;
  const prisma = options?.prisma || getLearnerPrisma();

  try {
    let selectedContextId: string | null = null;
    if (options?.contextId != null) {
      if (!isValidUuid(options.contextId)) return {
        ok: false, status: 400, error: { code: 'VALIDATION_ERROR', message: 'Mã lộ trình không hợp lệ.' },
      };
      selectedContextId = options.contextId.toLowerCase();
      if (!contexts.some(context => context.id === selectedContextId)) return {
        ok: false, status: 404, error: { code: 'NOT_FOUND', message: 'Lộ trình học không tồn tại.' },
      };
    } else {
      const active = contexts.filter(context => context.status === 'ACTIVE');
      const available = active.filter(context => context.course.isActive && context.workingLevel);
      const candidates = available.length ? available : active;
      if (candidates.length > 1) {
        const latest = await prisma.lessonAttempt.findFirst({
          where: { contextId: { in: candidates.map(context => context.id) } },
          orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
          select: { contextId: true },
        });
        selectedContextId = latest?.contextId ?? candidates[0].id;
      } else {
        selectedContextId = candidates[0]?.id ?? contexts[0]?.id ?? null;
      }
    }

    const [dbNow, account] = await Promise.all([
      getDbTime(prisma),
      prisma.account.findUnique({ where: { id: learner.id }, select: { timezone: true } }),
    ]);
    if (!account?.timezone) throw new Error('Learner timezone unavailable');
    const selected = selectedContextId;
    const [planSummary, pathResult, reviewDue] = await Promise.all([
      selected ? getContextPlanSummary(selected, learner.id, prisma) : null,
      selected ? buildLearningPath(prisma, selected, learner.id) : null,
      prisma.srsCard.count({ where: { learnerId: learner.id, dueAt: { lte: dbNow } } }),
    ]);
    const gamification = await getGamificationOverview(
      prisma, learner.id, account.timezone, dbNow, planSummary?.preferences?.dailyGoalMinutes ?? 10,
    );

    return {
      ok: true,
      status: 200,
      data: {
        learner, contexts, selectedContextId,
        plan: planSummary?.plan ?? null,
        continueLearning: pathResult?.continueLearning ?? null,
        path: pathResult?.path ?? [],
        pathStatus: pathResult?.status ?? null,
        pathMessage: pathResult?.message ?? null,
        reviewDue,
        ...gamification,
      },
    };
  } catch (error) {
    if (error instanceof LessonServiceError && (error.status === 404 || error.status === 409)) {
      return { ok: false, status: error.status, error: error.error };
    }
    if (error instanceof ContextServiceError && error.status === 404) {
      return { ok: false, status: 404, error: { code: error.code, message: error.message } };
    }
    return {
      ok: false, status: 503,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Không thể tải dữ liệu học tập. Vui lòng thử lại.' },
    };
  }
}
