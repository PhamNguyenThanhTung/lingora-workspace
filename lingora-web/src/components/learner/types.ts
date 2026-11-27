import type { HomeDto } from '../../server/context/home-dto.ts';

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
  Partial<Pick<HomeDto, 'totalGems' | 'gamificationStatus' | 'gamificationMessage' | 'recentAchievement'>>;

export type ShellSection = 'home' | 'write' | 'quests' | 'profile';
