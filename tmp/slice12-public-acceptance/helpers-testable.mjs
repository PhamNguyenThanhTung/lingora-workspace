/**
 * helpers-testable.mjs — Import-safe shared logic for Slice 12 acceptance helpers.
 *
 * Provides shared guards, sanitization, single-effect markers, deterministic
 * 7-table snapshot queries, and schema-accurate cleanup queries used by:
 *   - public-auth.mjs
 *   - public-journey.mjs
 *   - resume-cleanup.mjs
 *   - preflight-readonly.mjs
 *   - test-offline.py (via subprocess entrypoint)
 *
 * Offline-safe: NO .env load, NO DB connection, NO browser launch at import.
 */

import crypto from 'node:crypto';

// ── Constants (canonical, authoritative) ────────────────────────────────────
export const CANONICAL_LEARNER_ORIGIN = 'https://lingora-learner-dev.vercel.app';
export const CANONICAL_PROVIDER_HOST  = 'sncfyvpzwedqgwfpffkh.supabase.co';
export const CANONICAL_PROVIDER_ORIGIN = 'https://sncfyvpzwedqgwfpffkh.supabase.co';
export const CANONICAL_VERIFY_PATH    = '/auth/v1/verify';
export const CANONICAL_REDIRECT_PATH  = '/auth/confirm';
export const EXPECTED_EML_TYPE        = 'signup';
export const CLOCK_SKEW_SECONDS       = 3600;

export const REQUIRED_S11_TABLES = [
  'consumptions',
  'attempts',
  'responses',
  'completions',
  'cards',
  'srs_review_operations',
  'receipts',
];

export const S11_KNOWN_NON_EMPTY_TABLES = [
  'attempts',
  'responses',
  'completions',
  'cards',
  'receipts',
];

export function getLearnerCookieName(url = CANONICAL_PROVIDER_ORIGIN) {
  try {
    const hostname = new URL(url).hostname;
    const ref = hostname.split('.')[0];
    if (ref) return `sb-${ref}-learner-token`;
  } catch {
    // ignore
  }
  return 'sb-learner-auth-token';
}

export const EXACT_LEARNER_PKCE_COOKIE_NAME = `${getLearnerCookieName(CANONICAL_PROVIDER_ORIGIN)}-code-verifier`;

export const ALLOWLISTED_ERROR_CODES = new Set([
  'invalid_request',
  'unauthorized',
  'access_denied',
  'server_error',
  'temporarily_unavailable',
  'rate_limit_exceeded',
]);

export const FULL_HISTORY_TABLES = [
  'lesson_consumptions',
  'lesson_attempts',
  'lesson_responses',
  'lesson_completions',
  'command_receipts',
  'srs_cards',
  'srs_review_operations',
];

// ── Sanitization: safeErrorCategory ─────────────────────────────────────────
// Extracts safe, fixed categories and allowlisted names from errors.
// NEVER outputs raw messages or arbitrary error.name that might contain
// full URLs, tokens, passwords, emails, or connection strings.
const ALLOWLISTED_ERROR_NAMES = new Set([
  'AssertionError',
  'TimeoutError',
  'RateLimitError',
  'SyntaxError',
  'TypeError',
  'RangeError',
  'DatabaseError',
  'NetworkError',
  'NavigationError',
  'Error',
]);

const ALLOWLISTED_CATEGORIES = new Set([
  'AssertionError',
  'TimeoutError',
  'RateLimitError',
  'SyntaxError',
  'TypeError',
  'RangeError',
  'DatabaseError',
  'NetworkError',
  'NavigationError',
  'GeneralError',
  'UnknownError',
]);

export function safeErrorCategory(error) {
  if (!error) return {name: 'Error', category: 'UnknownError'};
  const rawName = typeof error.name === 'string' ? error.name : 'Error';
  const name = ALLOWLISTED_ERROR_NAMES.has(rawName) ? rawName : 'Error';
  const rawMsg = typeof error.message === 'string' ? error.message : '';

  let category = 'GeneralError';
  if (name === 'AssertionError') {
    category = 'AssertionError';
  } else if (name === 'TimeoutError' || rawMsg.includes('Timeout') || rawMsg.includes('timeout')) {
    category = 'TimeoutError';
  } else if (name === 'RateLimitError' || rawMsg.includes('429') || rawMsg.includes('Rate limit')) {
    category = 'RateLimitError';
  } else if (name === 'SyntaxError') {
    category = 'SyntaxError';
  } else if (rawMsg.includes('ECONNREFUSED') || rawMsg.includes('ENOTFOUND') || rawMsg.includes('fetch failed')) {
    category = 'NetworkError';
  } else if (rawMsg.includes('relation') || rawMsg.includes('column') || rawMsg.includes('database') || rawMsg.includes('syntax error at or near')) {
    category = 'DatabaseError';
  } else if (rawMsg.includes('navigation') || rawMsg.includes('page.goto')) {
    category = 'NavigationError';
  } else if (ALLOWLISTED_CATEGORIES.has(name) && name !== 'Error') {
    category = name;
  } else {
    category = 'GeneralError';
  }

  return {
    name,
    category,
  };
}

// ── Sanitization: safeNavigation ───────────────────────────────────────────
// Extracts safe origin/path/hasCode/confirmed metadata.
// Allowlisted error/errorCode only; redacts unknown query parameters completely.
export function safeNavigation(raw) {
  try {
    const u = typeof raw === 'string' ? new URL(raw) : new URL(raw.url ? raw.url() : String(raw));
    const rawError = u.searchParams.get('error');
    const rawErrorCode = u.searchParams.get('error_code');

    const safeError = rawError && ALLOWLISTED_ERROR_CODES.has(rawError)
      ? rawError
      : (rawError ? '[REDACTED]' : null);

    const safeErrorCode = rawErrorCode && ALLOWLISTED_ERROR_CODES.has(rawErrorCode)
      ? rawErrorCode
      : (rawErrorCode ? '[REDACTED]' : null);

    return {
      origin:    u.origin,
      path:      u.pathname,
      hasCode:   u.searchParams.has('code'),
      confirmed: u.searchParams.get('confirmed') === '1',
      error:     safeError,
      errorCode: safeErrorCode,
    };
  } catch {
    return {invalid: true};
  }
}

// ── Cookie Validation: Dedicated Learner PKCE Verifier ─────────────────────
export function cookiePathMatches(cookiePath, requestPath) {
  if (!cookiePath || typeof cookiePath !== 'string') return false;
  if (!requestPath || typeof requestPath !== 'string') return false;
  if (cookiePath === '/') return true;
  if (cookiePath === requestPath) return true;
  if (requestPath.startsWith(cookiePath)) {
    if (cookiePath.endsWith('/')) return true;
    if (requestPath.charAt(cookiePath.length) === '/') return true;
  }
  return false;
}

export function isValidLearnerPkceCookie(cookie, options = {}) {
  if (!cookie || typeof cookie !== 'object') return false;
  if (cookie.name !== EXACT_LEARNER_PKCE_COOKIE_NAME) return false;
  if (typeof cookie.value !== 'string' || cookie.value.trim().length === 0) return false;

  // Domain validation: must be present and applicable to canonical learner host
  if (!cookie.domain || typeof cookie.domain !== 'string') return false;
  const canonicalHost = new URL(CANONICAL_LEARNER_ORIGIN).hostname.toLowerCase();
  const rawDomain = cookie.domain.trim().toLowerCase();
  const normalizedDomain = rawDomain.replace(/^\./, '');
  if (!normalizedDomain || normalizedDomain.length === 0) return false;

  // Reject public suffixes / foreign domains
  if (normalizedDomain === 'vercel.app' || (normalizedDomain.endsWith('.vercel.app') && normalizedDomain !== canonicalHost)) {
    return false;
  }
  if (normalizedDomain !== canonicalHost) {
    return false;
  }

  // Path validation: must be present and RFC 6265 path-match canonical redirect path
  if (!cookie.path || typeof cookie.path !== 'string') return false;
  if (!cookiePathMatches(cookie.path, CANONICAL_REDIRECT_PATH)) {
    return false;
  }

  // Expiry check: if expires is present and > 0, must not be expired
  if (cookie.expires !== undefined && typeof cookie.expires === 'number' && cookie.expires > 0) {
    const currentClockMs = typeof options.now === 'function' ? options.now() : (typeof options.now === 'number' ? options.now : Date.now());
    const expiresMs = cookie.expires > 10_000_000_000 ? cookie.expires : cookie.expires * 1000;
    if (expiresMs <= currentClockMs) {
      return false;
    }
  }

  return true;
}

// ── Guard: Preflight identity absence check ─────────────────────────────────
export function checkIdentityPreflight(identityRows) {
  if (Array.isArray(identityRows) && identityRows.length > 0) {
    return {
      allowed: false,
      reason: 'owned email identity already exists in auth.users',
      count: identityRows.length,
    };
  }
  return {allowed: true};
}

// ── Guard: Register binding check ──────────────────────────────────────────
export function checkRegisterBinding({provenance, privateIn, baseline, providerBefore, now = Date.now()}) {
  // 1. Provenance validation
  if (!provenance || typeof provenance !== 'object') {
    return {allowed: false, reason: 'missing provenance'};
  }
  if (!provenance.ready) {
    return {allowed: false, reason: 'provenance not marked ready'};
  }
  if (provenance.learnerBase !== CANONICAL_LEARNER_ORIGIN) {
    return {allowed: false, reason: 'provenance learnerBase mismatch'};
  }
  if (!provenance.commit || typeof provenance.commit !== 'string') {
    return {allowed: false, reason: 'provenance missing commit'};
  }
  if (!provenance.registrationEmail || typeof provenance.registrationEmail !== 'string') {
    return {allowed: false, reason: 'provenance missing registrationEmail'};
  }
  if (!provenance.runLabel || typeof provenance.runLabel !== 'string') {
    return {allowed: false, reason: 'provenance missing runLabel'};
  }

  // 2. Private input validation
  if (!privateIn || typeof privateIn !== 'object') {
    return {allowed: false, reason: 'missing privateIn'};
  }
  if (!privateIn.email || typeof privateIn.email !== 'string') {
    return {allowed: false, reason: 'missing privateIn.email'};
  }
  if (!privateIn.label || typeof privateIn.label !== 'string' || !privateIn.label.startsWith('DEV_S12_PUBLIC_')) {
    return {allowed: false, reason: 'privateIn label must start with DEV_S12_PUBLIC_'};
  }

  // 3. Exact equality between provenance and privateIn
  if (provenance.registrationEmail.toLowerCase().trim() !== privateIn.email.toLowerCase().trim()) {
    return {allowed: false, reason: 'provenance registrationEmail does not match privateIn email'};
  }
  if (provenance.runLabel !== privateIn.label) {
    return {allowed: false, reason: 'provenance runLabel does not match privateIn label'};
  }

  // 4. Baseline existence & readOnly
  if (!baseline || typeof baseline !== 'object') {
    return {allowed: false, reason: 'missing preflight baseline'};
  }
  if (!baseline.readOnly) {
    return {allowed: false, reason: 'baseline is not marked readOnly'};
  }

  // 5. Baseline identity binding: must match recipient, runLabel, commit
  if (!baseline.registrationEmail || typeof baseline.registrationEmail !== 'string') {
    return {allowed: false, reason: 'baseline missing registrationEmail'};
  }
  if (baseline.registrationEmail.toLowerCase().trim() !== privateIn.email.toLowerCase().trim()) {
    return {allowed: false, reason: 'baseline registrationEmail does not match privateIn email'};
  }
  if (!baseline.runLabel || typeof baseline.runLabel !== 'string') {
    return {allowed: false, reason: 'baseline missing runLabel'};
  }
  if (baseline.runLabel !== privateIn.label) {
    return {allowed: false, reason: 'baseline runLabel does not match privateIn label'};
  }
  if (!baseline.sourceCommit || typeof baseline.sourceCommit !== 'string') {
    return {allowed: false, reason: 'baseline missing sourceCommit'};
  }
  if (baseline.sourceCommit !== provenance.commit) {
    return {allowed: false, reason: 'baseline sourceCommit does not match provenance commit'};
  }

  // 6. Identity absence in baseline
  if (!Array.isArray(baseline.identity) || baseline.identity.length > 0) {
    return {allowed: false, reason: 'baseline shows existing identity or missing identity array'};
  }

  // 7. Fresh timestamp & TTL
  if (!baseline.at) {
    return {allowed: false, reason: 'baseline missing timestamp'};
  }
  const currentClockMs = typeof now === 'function' ? now() : (typeof now === 'number' ? now : Date.now());
  const baselineMs = new Date(baseline.at).getTime();
  if (isNaN(baselineMs)) {
    return {allowed: false, reason: 'unparseable baseline timestamp'};
  }
  if (baselineMs > currentClockMs + 60_000) {
    return {allowed: false, reason: 'baseline timestamp is in the future beyond clock skew'};
  }
  if (currentClockMs - baselineMs > CLOCK_SKEW_SECONDS * 1000) {
    return {allowed: false, reason: 'baseline is stale (older than 3600s TTL)'};
  }

  // 8. Mandatory course and lessons readiness
  if (!baseline.course || !baseline.course.id) {
    return {allowed: false, reason: 'baseline missing course'};
  }
  if (!Array.isArray(baseline.lessons) || baseline.lessons.length === 0) {
    return {allowed: false, reason: 'baseline missing lessons'};
  }

  // 9. Mandatory fullRuntimeSnapshot readiness
  if (!baseline.fullRuntimeSnapshot || typeof baseline.fullRuntimeSnapshot !== 'object') {
    return {allowed: false, reason: 'baseline missing fullRuntimeSnapshot'};
  }
  if (!Array.isArray(baseline.fullRuntimeSnapshot.course) || baseline.fullRuntimeSnapshot.course.length === 0) {
    return {allowed: false, reason: 'baseline fullRuntimeSnapshot missing course rows'};
  }
  if (!Array.isArray(baseline.fullRuntimeSnapshot.lessons) || baseline.fullRuntimeSnapshot.lessons.length === 0) {
    return {allowed: false, reason: 'baseline fullRuntimeSnapshot missing lesson rows'};
  }

  // 10. Mandatory Retained S11 baseline readiness
  if (!hasRetainedS11Scope(baseline.retainedS11Scope)) {
    return {allowed: false, reason: 'baseline missing retained S11 scope'};
  }
  if (!baseline.retainedS11Baseline || typeof baseline.retainedS11Baseline !== 'object') {
    return {allowed: false, reason: 'baseline missing retainedS11Baseline'};
  }
  for (const k of REQUIRED_S11_TABLES) {
    if (!Array.isArray(baseline.retainedS11Baseline[k])) {
      return {allowed: false, reason: `baseline retainedS11Baseline missing table ${k}`};
    }
  }
  for (const k of S11_KNOWN_NON_EMPTY_TABLES) {
    if (baseline.retainedS11Baseline[k].length === 0) {
      return {allowed: false, reason: `baseline retainedS11Baseline has empty ${k}`};
    }
  }

  // 11. Provider baseline readiness (if provided)
  if (providerBefore) {
    if (!providerBefore.readOnly) {
      return {allowed: false, reason: 'providerBefore is not marked readOnly'};
    }
    if (!Array.isArray(providerBefore.flowIndex)) {
      return {allowed: false, reason: 'providerBefore missing flowIndex array'};
    }
  }

  return {allowed: true};
}

// ── Guard: Register pre-flight ──────────────────────────────────────────────
export function checkRegisterGuard(authPrivate) {
  if (!authPrivate) return {allowed: false, reason: 'missing authPrivate'};
  if (authPrivate.registered !== undefined) {
    return {allowed: false, reason: 'registered marker already set'};
  }
  if (authPrivate.registrationAttemptedAt !== undefined) {
    return {allowed: false, reason: 'registrationAttemptedAt already set'};
  }
  return {allowed: true};
}

// ── Guard: Post-registration DB verification ────────────────────────────────
export function checkRegistrationPostDb(identityRows, expectedLabel, registrationAttemptedAt, options = {}) {
  if (!Array.isArray(identityRows) || identityRows.length !== 1) {
    return {allowed: false, reason: `expected exactly 1 user row, found ${identityRows?.length || 0}`};
  }
  const u = identityRows[0];
  if (u.label !== expectedLabel) {
    return {allowed: false, reason: 'label mismatch'};
  }
  if (u.email_confirmed_at !== null) {
    return {allowed: false, reason: 'identity is already confirmed unexpectedly'};
  }
  if (u.account_id !== null && u.account_id !== undefined) {
    return {allowed: false, reason: 'account already created before journey'};
  }
  if (Number(u.context_count || 0) > 0) {
    return {allowed: false, reason: 'learning context already exists'};
  }
  if (Number(u.session_count || 0) > 0) {
    return {allowed: false, reason: 'session already exists'};
  }
  if (registrationAttemptedAt && u.created_at) {
    const regMs = new Date(registrationAttemptedAt).getTime();
    const createdMs = new Date(u.created_at).getTime();
    if (isNaN(createdMs) || isNaN(regMs)) {
      return {allowed: false, reason: 'unparseable creation date'};
    }
    // Creation time must be fresh (between reg start - 60s and reg start + 3600s)
    if (createdMs < regMs - 60_000) {
      return {allowed: false, reason: 'user created_at is older than registration start'};
    }
    if (createdMs > regMs + CLOCK_SKEW_SECONDS * 1000) {
      return {allowed: false, reason: 'user created_at is in the future beyond clock skew'};
    }
    const currentClockMs = typeof options.now === 'function' ? options.now() : (typeof options.now === 'number' ? options.now : Date.now());
    if (currentClockMs - createdMs > CLOCK_SKEW_SECONDS * 1000) {
      return {allowed: false, reason: 'user created_at is expired against current clock'};
    }
  }
  return {allowed: true};
}

// ── Guard: Confirm pre-flight and pre-navigation checks ──────────────────────
export function checkConfirmGuard(authPrivate, emlMeta, rawUrl, privateIn, options = {}) {
  if (!authPrivate) return {allowed: false, reason: 'missing authPrivate'};
  if (!authPrivate.registered) {
    return {allowed: false, reason: 'not registered'};
  }
  if (authPrivate.confirmed !== undefined) {
    return {allowed: false, reason: 'already confirmed'};
  }
  if (authPrivate.confirmationAttemptedAt !== undefined) {
    return {allowed: false, reason: 'confirmationAttemptedAt already set'};
  }

  // StorageState check: NO blank-context fallback allowed
  if (!authPrivate.storageState) {
    return {allowed: false, reason: 'missing storageState — blank-context fallback prohibited'};
  }

  // Dedicated Learner PKCE verifier cookie check:
  // Must match exact dedicated Learner cookie name, non-empty value, and valid domain/path/expiry
  const cookies = authPrivate.storageState.cookies || [];
  const hasValidVerifier = cookies.some(c => isValidLearnerPkceCookie(c, options));
  if (!hasValidVerifier) {
    return {allowed: false, reason: 'missing or invalid expected Learner PKCE verifier cookie in storageState'};
  }

  // Mandatory private operator inputs
  if (!privateIn || typeof privateIn !== 'object') {
    return {allowed: false, reason: 'missing privateIn'};
  }
  if (!privateIn.email || typeof privateIn.email !== 'string') {
    return {allowed: false, reason: 'missing privateIn.email'};
  }
  if (!privateIn.label || typeof privateIn.label !== 'string') {
    return {allowed: false, reason: 'missing privateIn.label'};
  }

  // Mandatory run label check across both authPrivate and emlMeta
  if (!authPrivate.label || authPrivate.label !== privateIn.label) {
    return {allowed: false, reason: 'authPrivate label mismatch or missing'};
  }
  if (!emlMeta?.run_label || emlMeta.run_label !== privateIn.label) {
    return {allowed: false, reason: 'emlMeta run_label mismatch or missing'};
  }

  // EML metadata check
  if (!emlMeta || emlMeta.parsed !== true) {
    return {allowed: false, reason: 'eml not parsed'};
  }
  if (emlMeta.provider_host !== CANONICAL_PROVIDER_HOST) {
    return {allowed: false, reason: 'wrong provider host in emlMeta'};
  }
  if (emlMeta.type !== EXPECTED_EML_TYPE) {
    return {allowed: false, reason: 'wrong eml type in emlMeta'};
  }
  if (emlMeta.redirect_to_origin !== CANONICAL_LEARNER_ORIGIN) {
    return {allowed: false, reason: 'wrong redirect origin in emlMeta'};
  }
  if (emlMeta.redirect_to_path !== CANONICAL_REDIRECT_PATH) {
    return {allowed: false, reason: 'wrong redirect path in emlMeta'};
  }
  if (!emlMeta.recipient_matched) {
    return {allowed: false, reason: 'recipient not matched'};
  }

  // Mandatory recipient hash check (never skipped)
  if (!emlMeta.recipient_hash) {
    return {allowed: false, reason: 'missing recipient_hash in emlMeta'};
  }
  const expectedHash = crypto.createHash('sha256').update(privateIn.email.toLowerCase().trim()).digest('hex');
  if (emlMeta.recipient_hash !== expectedHash) {
    return {allowed: false, reason: 'recipient hash mismatch'};
  }

  // Date freshness & current TTL check:
  // Enforces current 3600-second expiry against current clock, conservative small clock skew,
  // and actual registration start; matching two old timestamps is insufficient.
  const regTimestamp = authPrivate.registrationAttemptedAt || authPrivate.registered;
  if (!emlMeta.message_date || !regTimestamp) {
    return {allowed: false, reason: 'missing message_date or registration timestamp'};
  }
  const currentClockMs = typeof options.now === 'function' ? options.now() : (typeof options.now === 'number' ? options.now : Date.now());
  const msgMs = new Date(emlMeta.message_date).getTime();
  const regMs = new Date(regTimestamp).getTime();
  const ttlMs = CLOCK_SKEW_SECONDS * 1000;
  const smallSkewMs = 60_000;

  if (isNaN(msgMs) || isNaN(regMs)) {
    return {allowed: false, reason: 'unparseable date in authPrivate or emlMeta'};
  }

  // Expiry check against current clock
  if (regMs > currentClockMs + smallSkewMs) {
    return {allowed: false, reason: 'registration start is in the future beyond clock skew'};
  }
  if (currentClockMs - regMs > ttlMs) {
    return {allowed: false, reason: 'registration attempt is expired (older than 3600s TTL)'};
  }
  if (msgMs > currentClockMs + smallSkewMs) {
    return {allowed: false, reason: 'message_date is in the future beyond clock skew'};
  }
  if (currentClockMs - msgMs > ttlMs) {
    return {allowed: false, reason: 'message_date is expired (older than 3600s TTL)'};
  }

  // Freshness between registration start and message date
  if (msgMs < regMs - smallSkewMs) {
    return {allowed: false, reason: 'message_date precedes registration start beyond clock skew'};
  }
  if (msgMs > regMs + ttlMs) {
    return {allowed: false, reason: 'message_date is more than 3600s after registration start'};
  }

  // URL security checks
  if (typeof rawUrl !== 'string' || !rawUrl) {
    return {allowed: false, reason: 'missing or empty raw confirmation URL'};
  }
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:') {
      return {allowed: false, reason: 'URL scheme must be https'};
    }
    if (u.hostname !== CANONICAL_PROVIDER_HOST) {
      return {allowed: false, reason: 'URL hostname mismatch'};
    }
    if (u.port && u.port !== '443') {
      return {allowed: false, reason: 'URL contains custom port'};
    }
    if (u.pathname !== CANONICAL_VERIFY_PATH) {
      return {allowed: false, reason: 'URL path mismatch'};
    }
    if (u.username || u.password) {
      return {allowed: false, reason: 'URL contains credentials'};
    }
    if (u.hash) {
      return {allowed: false, reason: 'URL contains fragment'};
    }

    for (const key of ['token', 'type', 'redirect_to']) {
      const vals = u.searchParams.getAll(key);
      if (vals.length !== 1 || !vals[0]) {
        return {allowed: false, reason: `duplicate, missing, or empty parameter: ${key}`};
      }
    }
    if (u.searchParams.get('type') !== EXPECTED_EML_TYPE) {
      return {allowed: false, reason: 'type param is not signup'};
    }

    // redirect_to: exact canonical, no query, no fragment, no credentials
    const redirectTo = u.searchParams.get('redirect_to');
    const ru = new URL(redirectTo);
    if (ru.protocol !== 'https:') {
      return {allowed: false, reason: 'redirect_to URL scheme must be https'};
    }
    if (ru.username || ru.password) {
      return {allowed: false, reason: 'redirect_to URL contains credentials'};
    }
    if (ru.hash) {
      return {allowed: false, reason: 'redirect_to URL contains fragment'};
    }
    if (ru.search && ru.search !== '?') {
      return {allowed: false, reason: 'redirect_to URL contains query parameters'};
    }
    if (ru.port && ru.port !== '443') {
      return {allowed: false, reason: 'redirect_to URL contains custom port'};
    }
    const expectedRedirect = `${CANONICAL_LEARNER_ORIGIN}${CANONICAL_REDIRECT_PATH}`;
    if (`${ru.origin}${ru.pathname}` !== expectedRedirect) {
      return {allowed: false, reason: 'redirect_to does not point to canonical /auth/confirm'};
    }
  } catch {
    return {allowed: false, reason: 'URL parse error'};
  }

  return {allowed: true};
}

// ── Guard: Immediate pre-navigation DB check ────────────────────────────────
export function checkConfirmPreNavigationDb(userRows, expectedEmail, expectedLabel) {
  if (!Array.isArray(userRows) || userRows.length !== 1) {
    return {allowed: false, reason: `expected exactly 1 user row in pre-navigation check, got ${userRows?.length || 0}`};
  }
  const u = userRows[0];
  if (u.email?.toLowerCase() !== expectedEmail.toLowerCase()) {
    return {allowed: false, reason: 'user email mismatch'};
  }
  if (u.label !== expectedLabel) {
    return {allowed: false, reason: 'user label mismatch'};
  }
  if (u.email_confirmed_at !== null) {
    return {allowed: false, reason: 'user identity is already confirmed; refusing navigation'};
  }
  return {allowed: true};
}

// ── Single-effect spend marker check ────────────────────────────────────────
export function isSpent(authPrivate, mode) {
  if (!authPrivate) return false;
  if (mode === 'register') {
    return (
      authPrivate.registered !== undefined ||
      authPrivate.registrationAttemptedAt !== undefined
    );
  }
  if (mode === 'confirm') {
    return (
      authPrivate.confirmed !== undefined ||
      authPrivate.confirmationAttemptedAt !== undefined
    );
  }
  return false;
}

// ── Reading Consumption: Exact singular endpoint and DTO validation ────────
export function isReadingConsumptionRequest(urlStr, method, contextIdOrParams, maybeLessonId) {
  if (method !== 'POST') return false;
  try {
    const contextId = typeof contextIdOrParams === 'object' && contextIdOrParams !== null
      ? contextIdOrParams.contextId
      : contextIdOrParams;
    const lessonId = typeof contextIdOrParams === 'object' && contextIdOrParams !== null
      ? contextIdOrParams.lessonId
      : maybeLessonId;
    const u = new URL(urlStr);
    const expected = `/api/learner/contexts/${contextId}/lessons/${lessonId}/consumption`;
    return u.pathname === expected;
  } catch {
    return false;
  }
}

export function validateReadingConsumptionDto(dto, {contextId, lessonId, lessonRevisionId}) {
  if (!dto || typeof dto !== 'object') {
    return {valid: false, reason: 'DTO is not an object'};
  }
  if (dto.contextId !== contextId) {
    return {valid: false, reason: `contextId mismatch: got ${dto.contextId}, expected ${contextId}`};
  }
  if (dto.lessonId !== lessonId) {
    return {valid: false, reason: `lessonId mismatch: got ${dto.lessonId}, expected ${lessonId}`};
  }
  if (dto.lessonRevisionId !== lessonRevisionId) {
    return {valid: false, reason: `lessonRevisionId mismatch: got ${dto.lessonRevisionId}, expected ${lessonRevisionId}`};
  }
  if (dto.state !== 'IN_PROGRESS') {
    return {valid: false, reason: `state must be IN_PROGRESS, got ${dto.state}`};
  }
  return {valid: true};
}

// ── Snapshot: Deterministic queries for all 7 groups ────────────────────────
export function historyQueryFor(table, {contextId, learnerId}) {
  switch (table) {
    case 'lesson_consumptions':
      return {
        sql: `SELECT to_jsonb(t)::text AS row FROM app.lesson_consumptions t WHERE context_id=$1 ORDER BY id`,
        params: [contextId],
      };
    case 'lesson_attempts':
      return {
        sql: `SELECT to_jsonb(t)::text AS row FROM app.lesson_attempts t WHERE context_id=$1 ORDER BY id`,
        params: [contextId],
      };
    case 'lesson_responses':
      return {
        sql: `SELECT to_jsonb(r)::text AS row FROM app.lesson_responses r JOIN app.lesson_attempts a ON a.id = r.attempt_id WHERE a.context_id=$1 ORDER BY r.id`,
        params: [contextId],
      };
    case 'lesson_completions':
      return {
        sql: `SELECT to_jsonb(t)::text AS row FROM app.lesson_completions t WHERE context_id=$1 ORDER BY id`,
        params: [contextId],
      };
    case 'command_receipts':
      return {
        sql: `SELECT to_jsonb(t)::text AS row FROM app_private.command_receipts t WHERE actor_id=$1 ORDER BY id`,
        params: [learnerId],
      };
    case 'srs_cards':
      return {
        sql: `SELECT to_jsonb(t)::text AS row FROM app.srs_cards t WHERE learner_id=$1 ORDER BY id`,
        params: [learnerId],
      };
    case 'srs_review_operations':
      return {
        sql: `SELECT to_jsonb(t)::text AS row FROM app.srs_review_operations t WHERE learner_id=$1 ORDER BY id`,
        params: [learnerId],
      };
    default:
      throw new Error(`Unknown history table: ${table}`);
  }
}

// Retained scope includes original contexts and any new contexts for these learners.
function hasRetainedS11Scope(scope) {
  return ['learnerIds', 'contextIds'].every(key =>
    Array.isArray(scope?.[key]) && scope[key].length > 0 &&
    scope[key].every(id => typeof id === 'string' && id.length > 0));
}

export async function captureRetainedS11Snapshot(db, scope) {
  if (!hasRetainedS11Scope(scope)) throw new Error('Missing retained S11 scope');
  const contextFilter = column => `(${column} = ANY($2::uuid[]) OR ${column} IN
    (SELECT id FROM app.learning_contexts WHERE learner_id = ANY($1::uuid[])))`;
  const queries = {
    consumptions: `SELECT to_jsonb(t)::text AS row FROM app.lesson_consumptions t WHERE ${contextFilter('t.context_id')} ORDER BY t.id`,
    attempts: `SELECT to_jsonb(t)::text AS row FROM app.lesson_attempts t WHERE ${contextFilter('t.context_id')} ORDER BY t.id`,
    responses: `SELECT to_jsonb(t)::text AS row FROM app.lesson_responses t JOIN app.lesson_attempts a ON a.id = t.attempt_id WHERE ${contextFilter('a.context_id')} ORDER BY t.id`,
    completions: `SELECT to_jsonb(t)::text AS row FROM app.lesson_completions t WHERE ${contextFilter('t.context_id')} ORDER BY t.id`,
    cards: 'SELECT to_jsonb(t)::text AS row FROM app.srs_cards t WHERE learner_id = ANY($1::uuid[]) ORDER BY t.id',
    srs_review_operations: 'SELECT to_jsonb(t)::text AS row FROM app.srs_review_operations t WHERE learner_id = ANY($1::uuid[]) ORDER BY t.id',
    receipts: 'SELECT to_jsonb(t)::text AS row FROM app_private.command_receipts t WHERE actor_id = ANY($1::uuid[]) ORDER BY t.id',
  };
  const snapshot = {};
  for (const table of REQUIRED_S11_TABLES) {
    const params = ['cards', 'srs_review_operations', 'receipts'].includes(table)
      ? [scope.learnerIds] : [scope.learnerIds, scope.contextIds];
    snapshot[table] = (await db.query(queries[table], params)).rows.map(r => r.row);
  }
  return snapshot;
}

// ── Snapshot / Baseline Comparison Helpers ─────────────────────────────────
export function compareHistorySnapshots(before, current) {
  if (!before || !current) return {equal: false, reason: 'missing snapshot'};
  for (const table of FULL_HISTORY_TABLES) {
    const bRows = before[table] || [];
    const cRows = current[table] || [];
    if (JSON.stringify(bRows) !== JSON.stringify(cRows)) {
      return {
        equal: false,
        table,
        beforeCount: bRows.length,
        currentCount: cRows.length,
        reason: `Snapshot changed in table ${table}`,
      };
    }
  }
  return {equal: true};
}

export function compareProviderFlowBaseline(currentNonOwnedFlows, baselineFlowIndex, subjects = []) {
  if (!Array.isArray(baselineFlowIndex)) {
    return {equal: false, reason: 'missing or invalid baselineFlowIndex'};
  }
  const expected = baselineFlowIndex.filter(f => !subjects.includes(f.user_id));
  const equal = JSON.stringify(currentNonOwnedFlows) === JSON.stringify(expected);
  return {equal, reason: equal ? undefined : 'Provider flow baseline changed unexpectedly'};
}

export function compareRetainedS11Baseline(currentRowsByTable, baselineS11) {
  if (!baselineS11 || typeof baselineS11 !== 'object' || Object.keys(baselineS11).length === 0) {
    return {equal: false, reason: 'mandatory retained S11 baseline is missing or empty'};
  }
  for (const table of REQUIRED_S11_TABLES) {
    if (!Array.isArray(baselineS11[table])) {
      return {equal: false, reason: `missing required retained S11 table: ${table}`};
    }
    if (S11_KNOWN_NON_EMPTY_TABLES.includes(table) && baselineS11[table].length === 0) {
      return {equal: false, reason: `retained S11 baseline for ${table} must not be empty`};
    }
    if (!Array.isArray(currentRowsByTable?.[table])) {
      return {equal: false, reason: `missing current retained S11 table: ${table}`};
    }
    const current = currentRowsByTable[table];
    if (JSON.stringify(current) !== JSON.stringify(baselineS11[table])) {
      return {
        equal: false,
        table,
        beforeCount: baselineS11[table].length,
        currentCount: current.length,
        reason: `retained S11 baseline for ${table} was modified`,
      };
    }
  }
  return {equal: true};
}

// ── Cleanup: Immutable count SQL with correct app_private schema ─────────────
export function immutableCountSQL() {
  return `SELECT
   (SELECT count(*) FROM app.lesson_responses r
    JOIN app.lesson_attempts a ON a.id = r.attempt_id
    WHERE a.context_id = ANY($1::uuid[]))
 + (SELECT count(*) FROM app.lesson_completions WHERE context_id = ANY($1::uuid[]))
 + (SELECT count(*) FROM app.srs_cards WHERE learner_id = $2)
 + (SELECT count(*) FROM app.srs_review_operations WHERE learner_id = $2)
 + (SELECT count(*) FROM app_private.command_receipts WHERE actor_id = $2)
   AS n`;
}

// ── Subprocess Entrypoint (invoked by test-offline.py) ───────────────────────
if (process.argv[1] && process.argv[1].endsWith('helpers-testable.mjs')) {
  const [, , testName, jsonArg] = process.argv;
  if (!testName) {
    console.error('Usage: node helpers-testable.mjs <testName> [jsonArg]');
    process.exitCode = 1;
  } else {
    try {
      const arg = jsonArg ? JSON.parse(jsonArg) : undefined;
      let result;

      switch (testName) {
        case 'checkRegisterGuard':
          result = checkRegisterGuard(arg.authPrivate);
          break;
        case 'checkRegisterBinding':
          result = checkRegisterBinding({
            provenance: arg.provenance,
            privateIn: arg.privateIn,
            baseline: arg.baseline,
            providerBefore: arg.providerBefore,
            now: arg.now,
          });
          break;
        case 'checkIdentityPreflight':
          result = checkIdentityPreflight(arg.identityRows);
          break;
        case 'checkRegistrationPostDb':
          result = checkRegistrationPostDb(arg.identityRows, arg.expectedLabel, arg.registrationAttemptedAt, {now: arg.now});
          break;
        case 'checkConfirmGuard':
          result = checkConfirmGuard(arg.authPrivate, arg.emlMeta, arg.rawUrl, arg.privateIn, arg.options || (arg.now !== undefined ? {now: arg.now} : {}));
          break;
        case 'checkConfirmPreNavigationDb':
          result = checkConfirmPreNavigationDb(arg.userRows, arg.expectedEmail, arg.expectedLabel);
          break;
        case 'safeNavigation':
          result = safeNavigation(arg.url);
          break;
        case 'safeErrorCategory':
          result = safeErrorCategory(arg.error);
          break;
        case 'isSpent':
          result = isSpent(arg.authPrivate, arg.mode);
          break;
        case 'isReadingConsumptionRequest':
          result = {matched: isReadingConsumptionRequest(arg.url, arg.method, arg.params)};
          break;
        case 'validateReadingConsumptionDto':
          result = validateReadingConsumptionDto(arg.dto, arg.params);
          break;
        case 'fullHistoryTables':
          result = {tables: FULL_HISTORY_TABLES};
          break;
        case 'historyQueryFor':
          result = historyQueryFor(arg.table, arg.ids);
          break;
        case 'immutableCountSQL':
          result = {sql: immutableCountSQL()};
          break;
        case 'compareHistorySnapshots':
          result = compareHistorySnapshots(arg.before, arg.current);
          break;
        case 'compareProviderFlowBaseline':
          result = compareProviderFlowBaseline(arg.current, arg.baseline, arg.subjects);
          break;
        case 'compareRetainedS11Baseline':
          result = compareRetainedS11Baseline(arg.current, arg.baseline);
          break;
        case 'isValidLearnerPkceCookie':
          result = {valid: isValidLearnerPkceCookie(arg.cookie, arg.options || (arg.now !== undefined ? {now: arg.now} : {}))};
          break;
        case 'cookiePathMatches':
          result = {matched: cookiePathMatches(arg.cookiePath, arg.requestPath)};
          break;
        default:
          throw new Error(`Unknown test command: ${testName}`);
      }

      console.log(JSON.stringify({ok: true, result}));
    } catch (e) {
      const safe = safeErrorCategory(e);
      console.error(JSON.stringify({ok: false, error: safe.name, category: safe.category}));
      process.exitCode = 1;
    }
  }
}
