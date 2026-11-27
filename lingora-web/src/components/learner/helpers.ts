import type { LearningContextSummaryDto } from '../../server/context/dto.ts';
import type { HomeDto, PathSectionDto } from '../../server/context/home-dto.ts';
import type { ShellData } from './types.ts';

export function getLocalizedText(obj: unknown, locale = 'vi'): string {
  if (!obj || typeof obj !== 'object') return typeof obj === 'string' ? obj : '';
  const record = obj as Record<string, string>;
  return record[locale] || record['vi'] || record['en'] || Object.values(record)[0] || '';
}

export function languageName(ctx: LearningContextSummaryDto, locale = 'vi'): string {
  return getLocalizedText(ctx.targetLanguage.names, locale) || ctx.targetLanguage.code.toUpperCase();
}

export function contextLevelCode(ctx: LearningContextSummaryDto): string | null {
  return ctx.levelCode ?? null;
}

/** Badge colours per language code (no flags: a language is not a country). Text/background pairs are AA. */
const BADGE_COLORS: Record<string, { bg: string; fg: string }> = {
  ja: { bg: '#FDE8EC', fg: '#9F1239' },
  en: { bg: '#E4F3FD', fg: '#075985' },
  zh: { bg: '#FFF2E3', fg: '#9A3412' },
  fr: { bg: '#E6EEFF', fg: '#1E3A8A' },
  ko: { bg: '#E6FAEE', fg: '#166534' },
  de: { bg: '#F3F0E4', fg: '#5B4A12' },
  es: { bg: '#FFF0C7', fg: '#7A4B00' },
};
const FALLBACK_BADGE = { bg: '#EEEBFF', fg: '#3B2FAE' };

export function languageBadgeStyle(code: string): { backgroundColor: string; color: string } {
  const c = BADGE_COLORS[code.toLowerCase()] ?? FALLBACK_BADGE;
  return { backgroundColor: c.bg, color: c.fg };
}

/** Fixed sine wave: the horizontal offset of node `index` inside a chapter (px). Never random. */
export const WAVE_AMPLITUDE = 44;
export function waveOffset(index: number): number {
  return Math.round(Math.sin((index * Math.PI) / 3) * WAVE_AMPLITUDE);
}

export function setContextCookie(contextId: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `lingora_ctx=${encodeURIComponent(contextId)}; path=/; max-age=31536000; SameSite=Lax`;
}

export const REVIEW_QUEST_ID = 'REVIEW_10';

/** A brand-new learner has nothing due for review, so that quest cannot progress yet; hide it until reachable. */
export function visibleQuests(home: Pick<ShellData, 'quests' | 'reviewDue'>) {
  return home.quests.filter(
    (q) => !(q.id === REVIEW_QUEST_ID && home.reviewDue === 0 && q.progress === 0 && !q.isClaimed),
  );
}

export function reviewHrefFor(selectedContextId: string | null | undefined): string {
  return selectedContextId ? `/review?contextId=${selectedContextId}` : '/review';
}

/** Sections of the path, exactly as the server sends them (plan §2.1). */
export function getSections(home: Pick<Partial<HomeDto>, 'sections'>): PathSectionDto[] {
  return home.sections ?? [];
}

export function toShellData(home: HomeDto): ShellData {
  return {
    learner: home.learner,
    contexts: home.contexts,
    selectedContextId: home.selectedContextId,
    streak: home.streak,
    totalXp: home.totalXp,
    totalGems: home.totalGems,
    reviewDue: home.reviewDue,
    quests: home.quests,
    dailyProgress: home.dailyProgress,
    gamificationStatus: home.gamificationStatus,
    gamificationMessage: home.gamificationMessage,
    recentAchievement: home.recentAchievement,
  };
}
