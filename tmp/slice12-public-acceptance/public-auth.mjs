/**
 * public-auth.mjs — Register & Confirm helper for Slice 12 public acceptance.
 *
 * Usage:
 *   node public-auth.mjs register
 *   node public-auth.mjs confirm
 *
 * Offline-safe design:
 *   - No network or DB access at import time.
 *   - Database connections and browser launches are lazy inside run().
 *   - Uses canonical shared logic from helpers-testable.mjs.
 *
 * Input files:
 *   tmp/slice12-public-acceptance/ready-provenance.json  (root-supplied)
 *   tmp/slice12-public-acceptance/mode0600-private.json  (operator credentials)
 *   tmp/slice12-public-acceptance/eml-meta.json          (produced by parse-eml.py)
 *   tmp/slice12-public-acceptance/eml-url-private.txt    (produced by parse-eml.py, mode 0600)
 *   plans/evidence/slice-12-public-acceptance/before-registration.json (preflight baseline)
 *
 * State file:
 *   tmp/slice12-public-acceptance/auth-private.json      (mode 0600, single-effect markers)
 *
 * Evidence output:
 *   plans/evidence/slice-12-public-acceptance/public-auth.json
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

import {
  CANONICAL_LEARNER_ORIGIN,
  CANONICAL_PROVIDER_HOST,
  CANONICAL_VERIFY_PATH,
  CANONICAL_REDIRECT_PATH,
  EXPECTED_EML_TYPE,
  EXACT_LEARNER_PKCE_COOKIE_NAME,
  isValidLearnerPkceCookie,
  checkRegisterGuard,
  checkRegisterBinding,
  checkRegistrationPostDb,
  checkConfirmGuard,
  checkConfirmPreNavigationDb,
  checkIdentityPreflight,
  safeNavigation,
  safeErrorCategory,
  isSpent,
} from './helpers-testable.mjs';

// ── Paths ────────────────────────────────────────────────────────────────────
const EV_ROOT           = 'plans/evidence/slice-12-public-acceptance/';
const PROVENANCE_FILE   = 'tmp/slice12-public-acceptance/ready-provenance.json';
const PRIVATE_IN_FILE   = 'tmp/slice12-public-acceptance/mode0600-private.json';
const BASELINE_FILE     = EV_ROOT + 'before-registration.json';
const PROVIDER_FILE     = EV_ROOT + 'provider-before.json';
const EML_META_FILE     = 'tmp/slice12-public-acceptance/eml-meta.json';
const EML_URL_FILE      = 'tmp/slice12-public-acceptance/eml-url-private.txt';
const AUTH_PRIVATE_FILE = 'tmp/slice12-public-acceptance/auth-private.json';
const EVIDENCE_FILE     = EV_ROOT + 'public-auth.json';

// ── Helpers ──────────────────────────────────────────────────────────────────
function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    throw Object.assign(new Error('Failed to read JSON'), {name: 'SyntaxError'});
  }
}

function writePrivate(p, data) {
  const str = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(p, str, {mode: 0o600});
  fs.chmodSync(p, 0o600);
}

// ── Lazy live DB setup (offline imports never connect to DB) ─────────────────
let liveDb = null;
async function getLiveDb() {
  if (liveDb) return liveDb;
  const {config: loadEnv} = await import('dotenv');
  const {default: pg} = await import('pg');
  loadEnv({path: 'lingora-admin/.env', quiet: true});
  const ref = process.env.SUPABASE_DEV_PROJECT_REF;
  assert.ok(ref, 'SUPABASE_DEV_PROJECT_REF not set');
  const rawDbUrl = process.env.DATABASE_URL;
  assert.ok(rawDbUrl && rawDbUrl.includes(ref), 'DATABASE_URL missing or ref mismatch');
  const dbUrl = new URL(rawDbUrl);
  for (const p of ['schema', 'sslmode']) dbUrl.searchParams.delete(p);
  liveDb = new pg.Client({
    connectionString:        dbUrl.toString(),
    ssl:                     {rejectUnauthorized: false},
    connectionTimeoutMillis: 10_000,
    statement_timeout:       20_000,
  });
  await liveDb.connect();
  return liveDb;
}

// ── Main Runner ──────────────────────────────────────────────────────────────
export async function runAuth(mode, options = {}) {
  assert.ok(['register', 'confirm'].includes(mode), `mode must be register|confirm, got: ${mode}`);

  const rootDir = options.rootDir || process.env.SLICE12_ROOT_DIR || '.';
  const evRoot = path.join(rootDir, 'plans/evidence/slice-12-public-acceptance');
  const provenanceFile = path.join(rootDir, 'tmp/slice12-public-acceptance/ready-provenance.json');
  const privateInFile = path.join(rootDir, 'tmp/slice12-public-acceptance/mode0600-private.json');
  const baselineFile = path.join(evRoot, 'before-registration.json');
  const providerFile = path.join(evRoot, 'provider-before.json');
  const emlMetaFile = path.join(rootDir, 'tmp/slice12-public-acceptance/eml-meta.json');
  const emlUrlFile = path.join(rootDir, 'tmp/slice12-public-acceptance/eml-url-private.txt');
  const authPrivateFile = path.join(rootDir, 'tmp/slice12-public-acceptance/auth-private.json');
  const evidenceFile = path.join(evRoot, 'public-auth.json');

  let head;
  try {
    head = execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
  } catch {
    head = 'unknown';
  }

  const provenance = readJSON(provenanceFile);
  assert.equal(provenance.commit, head, 'HEAD does not match ready-provenance.json commit');
  assert.equal(provenance.ready,  true,  'ready-provenance.json is not marked ready');
  assert.equal(provenance.learnerBase, CANONICAL_LEARNER_ORIGIN,
    'ready-provenance.json learnerBase does not match canonical origin');

  // Load private operator inputs (never echoed)
  const privateIn = readJSON(privateInFile);
  assert.ok(typeof privateIn.email    === 'string' && privateIn.email.length > 0, 'missing email');
  assert.ok(typeof privateIn.password === 'string' && privateIn.password.length > 0, 'missing password');
  assert.ok(typeof privateIn.label    === 'string' && privateIn.label.startsWith('DEV_S12_PUBLIC_'),
    'label must start with DEV_S12_PUBLIC_');

  // Load or init auth-private state
  let authPrivate = fs.existsSync(authPrivateFile)
    ? readJSON(authPrivateFile)
    : {label: privateIn.label};

  // Single-effect spend check
  assert.ok(!isSpent(authPrivate, mode), `Refuse second ${mode}: spent marker already set`);

  // Evidence structure
  const evidence = fs.existsSync(evidenceFile)
    ? readJSON(evidenceFile)
    : {sourceCommit: head, checks: {}};
  assert.equal(evidence.sourceCommit, head, 'evidence sourceCommit mismatch');

  fs.mkdirSync(evRoot, {recursive: true});
  const checkpoint = () =>
    fs.writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2) + '\n');

  const base = CANONICAL_LEARNER_ORIGIN;
  const navigations = [];

  let browser, page;
  let step = 'launch';

  try {
    // ── REGISTER mode ────────────────────────────────────────────────────────
    if (mode === 'register') {
      const regGuard = checkRegisterGuard(authPrivate);
      assert.ok(regGuard.allowed, regGuard.reason || 'register guard check failed');

      // Required binding of private input, READY provenance, and preflight baseline BEFORE POST
      step = 'pre-registration baseline binding';
      assert.ok(fs.existsSync(baselineFile), 'preflight baseline before-registration.json not found');
      assert.ok(fs.existsSync(providerFile), 'preflight provider-before.json not found');
      const baseline = readJSON(baselineFile);
      const providerBefore = readJSON(providerFile);
      const bindCheck = checkRegisterBinding({
        provenance,
        privateIn,
        baseline,
        providerBefore,
        now: Date.now(),
      });
      assert.ok(bindCheck.allowed, bindCheck.reason || 'register binding check failed');

      // Read-only DB check immediately BEFORE POST: identity absence
      step = 'pre-registration identity check';
      const db = options.dbClient || await getLiveDb();
      const preIdentity = (await db.query(
        `SELECT u.id, u.email_confirmed_at, u.raw_user_meta_data->>'display_name' AS label
         FROM auth.users u WHERE lower(u.email) = lower($1)`,
        [privateIn.email]
      )).rows;
      const preCheck = checkIdentityPreflight(preIdentity);
      assert.ok(preCheck.allowed, preCheck.reason || 'identity already exists before registration');

      // Persist attempt-start marker BEFORE the POST
      authPrivate.registrationAttemptedAt = new Date().toISOString();
      writePrivate(authPrivateFile, authPrivate);

      if (options.onRegisterPost) {
        await options.onRegisterPost();
        return {status: 'PASS', mode, attemptedAt: authPrivate.registrationAttemptedAt};
      }

      browser = await chromium.launch({headless: true, args: ['--no-sandbox']});
      const ctx = await browser.newContext();
      page = await ctx.newPage();
      page.setDefaultTimeout(30_000);

      page.on('response', r => {
        if (r.request().isNavigationRequest()) {
          navigations.push({...safeNavigation(r.url()), status: r.status()});
        }
      });

      step = 'registration form';
      await page.goto(base + '/register');

      await page.locator('input[type=email]').fill(privateIn.email);
      await page.locator('input[type=password]').fill(privateIn.password);
      await page.locator('#registerDisplayName').fill(privateIn.label);

      const responsePromise = page.waitForResponse(
        r => new URL(r.url()).pathname === '/api/auth/register' && r.request().method() === 'POST'
      );
      await page.locator('button[type=submit]').click();

      step = 'registration response';
      const registrationResponse = await responsePromise;
      const registrationBody = await registrationResponse.json().catch(() => null);
      const returnedCode = registrationBody?.error?.code;

      evidence.registrationResponse = {
        status:    registrationResponse.status(),
        errorCode: typeof returnedCode === 'string' && /^[A-Z_]+$/.test(returnedCode)
          ? returnedCode : null,
      };
      checkpoint();

      if (registrationResponse.status() === 429) {
        throw Object.assign(new Error('Rate limit on registration (429)'), {name: 'RateLimitError'});
      }
      assert.equal(registrationResponse.status(), 200, 'Registration returned non-200');

      step = 'confirmation instructions';
      await page.locator('#registerSuccess').waitFor();
      evidence.checks.productRegistrationSubmitted = true;
      evidence.checks.confirmationInstructionsVisible = true;

      // Read-only DB check immediately AFTER 200
      step = 'post-registration DB verification';
      const postIdentity = (await db.query(
        `SELECT u.id, u.created_at, u.email_confirmed_at,
                u.raw_user_meta_data->>'display_name' AS label,
                a.id AS account_id,
                (SELECT count(*) FROM app.learning_contexts WHERE learner_id = u.id) AS context_count,
                (SELECT count(*) FROM auth.sessions WHERE user_id = u.id) AS session_count
         FROM auth.users u
         LEFT JOIN app.accounts a ON a.id = u.id
         WHERE lower(u.email) = lower($1)`,
        [privateIn.email]
      )).rows;

      const postCheck = checkRegistrationPostDb(
        postIdentity,
        privateIn.label,
        authPrivate.registrationAttemptedAt,
        {now: Date.now()}
      );
      assert.ok(postCheck.allowed, postCheck.reason || 'post-registration identity verification failed');

      const subjectId = postIdentity[0].id;
      evidence.registeredSubjectId = subjectId;
      evidence.checks.unconfirmedIdentityCreatedWithoutAccountOrContext = true;

      // Persist success marker and storage state (including PKCE code-verifier)
      authPrivate.registered = new Date().toISOString();
      authPrivate.subjectId = subjectId;
      authPrivate.storageState = await ctx.storageState();

      // Verify storageState contains exact valid Learner PKCE verifier cookie
      const cookies = authPrivate.storageState.cookies || [];
      const hasVerifier = cookies.some(c => isValidLearnerPkceCookie(c, {now: Date.now()}));
      assert.ok(hasVerifier, `storageState missing expected Learner PKCE verifier cookie (${EXACT_LEARNER_PKCE_COOKIE_NAME})`);

      writePrivate(authPrivateFile, authPrivate);
      checkpoint();

      console.log(JSON.stringify({
        mode, status: 'PASS', sourceCommit: head, checks: evidence.checks,
      }));

    // ── CONFIRM mode ─────────────────────────────────────────────────────────
    } else {
      // Validate EML metadata exists
      assert.ok(fs.existsSync(emlMetaFile), 'eml-meta.json not found — run parse-eml.py first');
      const emlMeta = readJSON(emlMetaFile);

      // Read original URL from private file (never printed)
      assert.ok(fs.existsSync(emlUrlFile), 'eml-url-private.txt not found');
      const rawUrl = fs.readFileSync(emlUrlFile, 'utf8').trim();
      assert.ok(rawUrl.length > 0, 'eml-url-private.txt is empty');

      // Run comprehensive confirm pre-flight guard checks
      const confirmGuard = checkConfirmGuard(authPrivate, emlMeta, rawUrl, privateIn, {now: Date.now()});
      assert.ok(confirmGuard.allowed, confirmGuard.reason || 'confirm guard check failed');

      // NO blank-context fallback: storageState must exist and be used
      assert.ok(authPrivate.storageState, 'missing storageState — blank-context fallback prohibited');

      // Read-only DB check immediately BEFORE navigation: exact unconfirmed subject
      step = 'pre-navigation DB verification';
      const db = options.dbClient || await getLiveDb();
      const userRows = (await db.query(
        `SELECT u.id, u.email, u.email_confirmed_at,
                u.raw_user_meta_data->>'display_name' AS label
         FROM auth.users u
         WHERE u.id = $1`,
        [authPrivate.subjectId]
      )).rows;

      const preNavCheck = checkConfirmPreNavigationDb(userRows, privateIn.email, privateIn.label);
      assert.ok(preNavCheck.allowed, preNavCheck.reason || 'pre-navigation DB check failed');

      // Persist navigation-attempt marker BEFORE navigation
      authPrivate.confirmationAttemptedAt = new Date().toISOString();
      writePrivate(authPrivateFile, authPrivate);

      if (options.onConfirmNavigate) {
        await options.onConfirmNavigate();
        return {status: 'PASS', mode, attemptedAt: authPrivate.confirmationAttemptedAt};
      }

      browser = await chromium.launch({headless: true, args: ['--no-sandbox']});
      const ctx = await browser.newContext({storageState: authPrivate.storageState});
      page = await ctx.newPage();
      page.setDefaultTimeout(30_000);

      // Track navigation metadata (safe fields only — no query values or tokens)
      page.on('response', r => {
        if (!r.request().isNavigationRequest()) return;
        const safe = safeNavigation(r.url());
        navigations.push({
          origin:    safe.origin,
          path:      safe.path,
          status:    r.status(),
          hasCode:   safe.hasCode,
          confirmed: safe.confirmed,
          error:     safe.error,
          errorCode: safe.errorCode,
          ts:        new Date().toISOString(),
        });
      });

      step = 'email link navigation';
      // Navigate using the actual original URL (not rebuilt)
      await page.goto(rawUrl, {waitUntil: 'domcontentloaded'});

      step = 'await learner callback and login';
      await page.waitForURL(
        u => u.origin === base && u.pathname === '/login',
        {timeout: 30_000}
      );

      // Assert callback chain:
      // 1. Visited canonical /auth/confirm with code and no error
      const callbackNav = navigations.find(n => n.path === CANONICAL_REDIRECT_PATH);
      assert.ok(callbackNav, 'Callback chain missing /auth/confirm navigation');
      assert.ok(callbackNav.hasCode, 'Callback navigation missing code parameter');
      assert.equal(callbackNav.error, null, 'Callback contains provider error');
      assert.equal(callbackNav.errorCode, null, 'Callback contains provider error_code');

      // 2. Final URL on /login with confirmed=1
      const finalUrl = new URL(page.url());
      assert.equal(finalUrl.pathname, '/login', 'Final navigation is not /login');
      assert.equal(finalUrl.searchParams.get('confirmed'), '1', 'Callback did not return confirmed=1');

      evidence.checks.realEmailLinkConfirmedInOriginalSignupSession = true;
      evidence.checks.callbackChainVerified = true;

      // Safe navigation metadata only
      evidence.confirmationNavigations = navigations;
      delete evidence.failure;

      // Persist confirmed marker and updated storage state
      authPrivate.confirmed = new Date().toISOString();
      authPrivate.storageState = await ctx.storageState();
      writePrivate(authPrivateFile, authPrivate);
      checkpoint();

      console.log(JSON.stringify({
        mode, status: 'PASS', sourceCommit: head, checks: evidence.checks,
      }));
    }

  } catch (error) {
    const safe = safeErrorCategory(error);
    evidence.status  = 'INCOMPLETE';
    evidence.failure = {
      step,
      name:       safe.name,
      category:   safe.category,
      navigation: navigations,
      final:      page ? safeNavigation(page.url()) : null,
    };
    checkpoint();

    // Never print token, password, raw URL, or raw error.message in error output
    console.error(JSON.stringify({
      status: 'FAIL', step, name: safe.name, category: safe.category,
    }));
    process.exitCode = 1;
    throw error;

  } finally {
    if (!options.dbClient) await liveDb?.end().catch(() => {});
    await browser?.close().catch(() => {});
  }
}

async function main() {
  const mode = process.argv[2];
  await runAuth(mode);
}

// Execute main only when invoked directly
if (process.argv[1] && process.argv[1].endsWith('public-auth.mjs')) {
  try {
    await main();
  } catch (topError) {
    const safe = safeErrorCategory(topError);
    console.error(JSON.stringify({
      status: 'FAIL', step: 'bootstrap', name: safe.name, category: safe.category,
    }));
    process.exitCode = 1;
  }
}
