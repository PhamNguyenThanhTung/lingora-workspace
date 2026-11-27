import 'server-only';
import type { CookieAdapter } from '../../server/auth/index.ts';
import { loadLearnerHome, type LoadLearnerHomeResult } from '../../server/context/home-loader.ts';
import { toShellData } from './helpers.ts';
import type { ShellData } from './types.ts';

export const LAST_CONTEXT_COOKIE = 'lingora_ctx';

/**
 * Loads the home payload for a learner page. With no explicit context it opens the path used last
 * (cookie `lingora_ctx`, Q-U6); a stale cookie falls back to the default path instead of failing.
 */
export async function loadLearnerHomeRemembering(
  cookieStore: CookieAdapter,
  requested?: string | null,
): Promise<LoadLearnerHomeResult> {
  const remembered = requested
    ? undefined
    : (cookieStore.getAll?.() as Array<{ name: string; value: string }> | undefined)?.find(
        (c) => c.name === LAST_CONTEXT_COOKIE,
      )?.value;
  const result = await loadLearnerHome(cookieStore, { contextId: requested ?? remembered });
  if (!result.ok && remembered && (result.status === 400 || result.status === 404)) {
    return loadLearnerHome(cookieStore, {});
  }
  return result;
}

/**
 * Data for the learner frame on pages that do not load the home payload themselves
 * (review, catalogue). Best effort: if it fails the page renders without the frame instead of failing.
 */
export async function loadShellData(cookieStore: CookieAdapter, contextId?: string | null): Promise<ShellData | null> {
  try {
    let result = await loadLearnerHome(cookieStore, { contextId: contextId ?? undefined });
    if (!result.ok && contextId) result = await loadLearnerHome(cookieStore);
    return result.ok ? toShellData(result.data) : null;
  } catch {
    return null;
  }
}
