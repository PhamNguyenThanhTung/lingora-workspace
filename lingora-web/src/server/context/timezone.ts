/**
 * Shared Timezone Normalization and Validation Contract
 *
 * Implements canonical timezone normalization across Home, Practice, SRS, and Gamification.
 * Supports valid IANA timezones and handles whitespace normalization (e.g. " UTC ", " Asia/Bangkok ").
 * Rejects invalid, malformed, empty, or invented timezones.
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
    const dtf = new Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    const resolved = dtf.resolvedOptions().timeZone;
    return {
      ok: true,
      timezone: resolved || trimmed,
    };
  } catch {
    return { ok: false };
  }
}

export function isValidTimezone(tz?: string | null): boolean {
  return normalizeStoredTimezone(tz).ok;
}
