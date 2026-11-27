/**
 * Shared Timezone Normalization and Validation Contract
 *
 * Implements canonical timezone normalization across Home, Practice, SRS, and Gamification.
 * Supports valid IANA timezones and handles whitespace normalization (e.g. " UTC ", " Asia/Bangkok ").
 * Rejects invalid, malformed, empty, or invented timezones.
 *
 * Validation goes through Intl, but the returned (and therefore persisted) id is the
 * caller's own trimmed zone id, never `resolvedOptions().timeZone`. ICU maps IANA link
 * names onto a primary zone and which side of a link pair it picks changes between ICU
 * releases (e.g. "Asia/Ho_Chi_Minh" resolves to "Asia/Saigon" on ICU 78, and
 * "Asia/Kolkata" to "Asia/Calcutta"). Persisting the resolved id would make stored rows
 * such as LessonAttempt.timezoneAtCompletion depend on the Node/ICU build that happened
 * to write them. Aliases are interchangeable for every Intl date computation we do, so
 * keeping the learner's own id costs nothing and stays stable across runtimes.
 */

export interface NormalizedTimezoneResult {
  ok: true;
  timezone: string;
}

export interface InvalidTimezoneResult {
  ok: false;
}

export type TimezoneNormalizationResult = NormalizedTimezoneResult | InvalidTimezoneResult;

export function normalizeStoredTimezone(tz?: string | null): TimezoneNormalizationResult {
  if (!tz || typeof tz !== 'string') {
    return { ok: false };
  }

  const trimmed = tz.trim();
  if (!trimmed) {
    return { ok: false };
  }

  try {
    // Throws RangeError for invalid/invented zone ids; the resolved id is deliberately ignored.
    new Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return {
      ok: true,
      timezone: trimmed,
    };
  } catch {
    return { ok: false };
  }
}

export function isValidTimezone(tz?: string | null): boolean {
  return normalizeStoredTimezone(tz).ok;
}
