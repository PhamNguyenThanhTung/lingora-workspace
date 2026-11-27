import type { HomeDto, PathNodeDto } from '../../server/context/home-dto.ts';

/** DTO §2.1 of the learner-home plan. U1 will return these from the server; until then
 *  `getSections` derives an equivalent shape from the flat `path`. */
export interface PathSectionDto {
  levelId: string;
  levelCode: string;
  levelLabel: string;
  position: number;
  state: 'COMPLETED' | 'CURRENT' | 'NEXT' | 'LOCKED' | 'COMING_SOON';
  progress: { requiredDone: number; requiredTotal: number };
  canSkipTo: boolean;
  units: Array<{
    unitId: string;
    position: number;
    title: string;
    progress: { done: number; total: number };
    nodes: PathNodeDto[];
  }>;
}

export type HomeWithSections = HomeDto & {
  sections?: PathSectionDto[];
  currentLevel?: { code: string; label: string } | null;
};

/** What the shell (top bar, nav, quest column) needs from the home payload. */
export type ShellData = Pick<
  HomeDto,
  | 'learner'
  | 'contexts'
  | 'selectedContextId'
  | 'streak'
  | 'totalXp'
  | 'reviewDue'
  | 'quests'
  | 'dailyProgress'
> &
  Partial<Pick<HomeDto, 'totalGems' | 'gamificationStatus' | 'gamificationMessage' | 'recentAchievement'>> & {
    /** Required-lesson progress of the selected path, shown under the language chip. */
    selectedProgress?: { done: number; total: number } | null;
  };

export type ShellSection = 'home' | 'write' | 'quests' | 'profile';
