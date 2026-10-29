/**
 * Centralized, safe sessionStorage draft management for Lingora.
 * Handles TTL (1 hour), identity isolation, and safe exception containment.
 */

const DRAFT_PREFIX = 'lingora_draft_lang_';
export const DRAFT_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface LanguageDraftData {
  mode: 'create' | 'edit';
  id?: string;
  code?: string;
  vi?: string;
  en?: string;
  isLearnable?: boolean;
  isUiLocale?: boolean;
  timestamp?: number;
}

export function getAccountDraftKey(accountId: string): string {
  return `${DRAFT_PREFIX}${accountId}`;
}

export function saveDraft(accountId: string, data: Omit<LanguageDraftData, 'timestamp'>): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const payload: LanguageDraftData = {
      ...data,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(getAccountDraftKey(accountId), JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function loadDraft(accountId: string): LanguageDraftData | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = getAccountDraftKey(accountId);
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LanguageDraftData;
    const age = Date.now() - (parsed.timestamp || 0);
    if (age > DRAFT_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function removeDraft(accountId: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(getAccountDraftKey(accountId));
  } catch {
    // Isolated safety
  }
}

export function clearAllDrafts(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(DRAFT_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      sessionStorage.removeItem(k);
    }
  } catch {
    // Isolated safety
  }
}

/**
 * On login / identity switch: clear all drafts from previous different accounts.
 * Also prunes expired drafts.
 */
export function enforceIdentityAndPrune(currentAccountId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const currentKey = getAccountDraftKey(currentAccountId);
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (!k || !k.startsWith(DRAFT_PREFIX)) continue;
      if (k !== currentKey) {
        keysToRemove.push(k);
      } else {
        // Check current key TTL
        const raw = sessionStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Date.now() - (parsed.timestamp || 0) > DRAFT_TTL_MS) {
              keysToRemove.push(k);
            }
          } catch {
            keysToRemove.push(k);
          }
        }
      }
    }
    for (const k of keysToRemove) {
      sessionStorage.removeItem(k);
    }
  } catch {
    // Isolated safety
  }
}
