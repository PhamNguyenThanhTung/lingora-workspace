import type { LearningContextSummaryDto } from '../../server/context/dto.ts';
import type { HomeDto, PathNodeDto } from '../../server/context/home-dto.ts';
import type { HomeWithSections, PathSectionDto, ShellData } from './types.ts';

export function getLocalizedText(obj: unknown, locale = 'vi'): string {
  if (!obj || typeof obj !== 'object') return typeof obj === 'string' ? obj : '';
  const record = obj as Record<string, string>;
  return record[locale] || record['vi'] || record['en'] || Object.values(record)[0] || '';
}

export function languageName(ctx: LearningContextSummaryDto, locale = 'vi'): string {
  return getLocalizedText(ctx.targetLanguage.names, locale) || ctx.targetLanguage.code.toUpperCase();
}

export function contextLevelCode(ctx: LearningContextSummaryDto): string | null {
  return (ctx.workingLevel ?? ctx.selectedStartLevel)?.code ?? null;
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

function requiredProgress(nodes: PathNodeDto[]) {
  const required = nodes.filter((n) => n.isRequired && n.state !== 'COMING_SOON');
  return {
    requiredDone: required.filter((n) => n.state === 'COMPLETED').length,
    requiredTotal: required.length,
  };
}

/**
 * Sections for the map. Uses the server `sections` (plan §2.1) when present; until U1 ships them,
 * groups the flat `path` by chapter under the learner's working level.
 */
export function getSections(home: Partial<HomeWithSections>, uiLocale = 'vi'): PathSectionDto[] {
  if (home.sections?.length) return home.sections;
  const nodes = home.path ?? [];
  if (!nodes.length) return [];
  const ctx = home.contexts?.find((c) => c.id === home.selectedContextId);
  const level = ctx?.workingLevel ?? null;
  const units: PathSectionDto['units'] = [];
  for (const node of nodes) {
    let unit = units.find((u) => u.position === node.unitPosition && u.title === node.unitTitle);
    if (!unit) {
      unit = {
        unitId: `unit-${node.unitPosition}`,
        position: node.unitPosition,
        title: node.unitTitle,
        progress: { done: 0, total: 0 },
        nodes: [],
      };
      units.push(unit);
    }
    unit.nodes.push(node);
  }
  for (const unit of units) {
    const required = unit.nodes.filter((n) => n.isRequired && n.state !== 'COMING_SOON');
    unit.progress = { done: required.filter((n) => n.state === 'COMPLETED').length, total: required.length };
  }
  const progress = requiredProgress(nodes);
  return [
    {
      levelId: level?.id ?? 'current',
      levelCode: level?.code ?? home.currentLevel?.code ?? '',
      levelLabel: level ? getLocalizedText(level.label, uiLocale) : home.currentLevel?.label ?? '',
      position: level?.position ?? 1,
      state: progress.requiredTotal > 0 && progress.requiredDone === progress.requiredTotal ? 'COMPLETED' : 'CURRENT',
      progress,
      canSkipTo: false,
      units,
    },
  ];
}

export function toShellData(home: HomeDto): ShellData {
  const nodes = home.path ?? [];
  const progress = requiredProgress(nodes);
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
    selectedProgress: progress.requiredTotal
      ? { done: progress.requiredDone, total: progress.requiredTotal }
      : null,
  };
}
