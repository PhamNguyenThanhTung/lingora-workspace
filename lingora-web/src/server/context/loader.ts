import { verifyLearnerIdentity, type CookieAdapter } from '../auth/index.ts';
import { getLearnerPrisma } from '../db/index.ts';
import type {
  LearnerDto,
  LearningContextSummaryDto,
  LearnerContextEnvelope,
} from './dto.ts';

export interface LoadLearnerContextOptions {
  authClient?: any;
  cookieStore?: CookieAdapter;
  prisma?: any;
  responseHeaders?: Headers | Record<string, string>;
}

export type LoadLearnerContextResult =
  | {
      ok: true;
      status: 200;
      data: LearnerContextEnvelope['data'];
    }
  | {
      ok: false;
      status: 401 | 403 | 409 | 503;
      error: {
        code: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'ACCOUNT_INACTIVE' | 'CONTEXT_INCONSISTENT' | 'SERVICE_UNAVAILABLE';
        message: string;
      };
    };

/**
 * Guarded context loader for the authenticated Learner.
 * Strictly verifies identity, queries contexts owned by that UUID,
 * defends against corrupted joins with 409, and maps to the canonical DTO.
 */
export async function loadLearnerContext(
  cookieStore?: CookieAdapter,
  options?: LoadLearnerContextOptions
): Promise<LoadLearnerContextResult> {
  const store = cookieStore || options?.cookieStore;
  const verified = await verifyLearnerIdentity({
    authClient: options?.authClient,
    cookieStore: store,
    prisma: options?.prisma,
    responseHeaders: options?.responseHeaders,
  });

  if (!verified.ok) {
    return verified;
  }

  const prisma = options?.prisma || getLearnerPrisma();
  let rawContexts: any[];

  try {
    rawContexts = await prisma.learningContext.findMany({
      where: { learnerId: verified.user.id },
      orderBy: [
        { createdAt: 'asc' },
        { id: 'asc' },
      ],
      select: {
        id: true,
        learnerId: true,
        languageId: true,
        courseId: true,
        status: true,
        language: {
          select: {
            id: true,
            code: true,
            names: true,
          },
        },
        course: {
          select: {
            id: true,
            languageId: true,
            frameworkId: true,
            names: true,
            isActive: true,
            framework: {
              select: {
                id: true,
                code: true,
                version: true,
                names: true,
              },
            },
          },
        },
        selectedStartLevel: {
          select: {
            id: true,
            frameworkId: true,
            code: true,
            label: true,
            position: true,
          },
        },
        workingLevel: {
          select: {
            id: true,
            frameworkId: true,
            code: true,
            label: true,
            position: true,
          },
        },
      },
    });
  } catch {
    return {
      ok: false,
      status: 503,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau.',
      },
    };
  }

  // Defensive validation of relations:
  // "Course.languageId must equal context.languageId; selectedStartLevel/workingLevel, when present, belong to Course.frameworkId."
  // "A malformed owner/course-language/framework/level join must fail closed as 409 CONTEXT_INCONSISTENT with safe support/retry UI, not empty success/auth redirect/500."
  for (const c of rawContexts) {
    if (c.learnerId !== verified.user.id) {
      return {
        ok: false,
        status: 409,
        error: {
          code: 'CONTEXT_INCONSISTENT',
          message: 'Dữ liệu lộ trình học tập không nhất quán về quyền sở hữu.',
        },
      };
    }
    if (!c.language || !c.course || !c.course.framework) {
      return {
        ok: false,
        status: 409,
        error: {
          code: 'CONTEXT_INCONSISTENT',
          message: 'Dữ liệu lộ trình học tập thiếu liên kết môn học hoặc khung năng lực.',
        },
      };
    }
    if (c.language.id !== c.languageId || c.course.id !== c.courseId ||
        c.course.framework.id !== c.course.frameworkId || c.course.languageId !== c.languageId) {
      return {
        ok: false,
        status: 409,
        error: {
          code: 'CONTEXT_INCONSISTENT',
          message: 'Khóa học không khớp ngôn ngữ mục tiêu của lộ trình.',
        },
      };
    }
    if (c.selectedStartLevel && c.selectedStartLevel.frameworkId !== c.course.frameworkId) {
      return {
        ok: false,
        status: 409,
        error: {
          code: 'CONTEXT_INCONSISTENT',
          message: 'Trình độ khởi điểm không thuộc khung năng lực của khóa học.',
        },
      };
    }
    if (c.workingLevel && c.workingLevel.frameworkId !== c.course.frameworkId) {
      return {
        ok: false,
        status: 409,
        error: {
          code: 'CONTEXT_INCONSISTENT',
          message: 'Trình độ hiện tại không thuộc khung năng lực của khóa học.',
        },
      };
    }
  }

  const contextsDto: LearningContextSummaryDto[] = rawContexts.map((c) => ({
    id: c.id,
    status: c.status,
    targetLanguage: {
      id: c.language.id,
      code: c.language.code,
      names: c.language.names,
    },
    course: {
      id: c.course.id,
      names: c.course.names,
      isActive: c.course.isActive,
    },
    framework: {
      id: c.course.framework.id,
      code: c.course.framework.code,
      version: c.course.framework.version,
      names: c.course.framework.names,
    },
    selectedStartLevel: c.selectedStartLevel
      ? {
          id: c.selectedStartLevel.id,
          code: c.selectedStartLevel.code,
          label: c.selectedStartLevel.label,
          position: c.selectedStartLevel.position,
        }
      : null,
    workingLevel: c.workingLevel
      ? {
          id: c.workingLevel.id,
          code: c.workingLevel.code,
          label: c.workingLevel.label,
          position: c.workingLevel.position,
        }
      : null,
  }));

  const learnerDto: LearnerDto = {
    id: verified.account.id,
    displayName: verified.account.displayName,
    role: 'LEARNER',
    status: 'ACTIVE',
    uiLocale: verified.account.uiLocale,
  };

  return {
    ok: true,
    status: 200,
    data: {
      learner: learnerDto,
      contexts: contextsDto,
    },
  };
}
