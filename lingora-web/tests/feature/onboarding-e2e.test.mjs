/**
 * Sprint 3 Core End-to-End Acceptance Test
 *
 * Verifies full end-to-end user journeys on live PostgreSQL and Next.js production server:
 * 1. Learner 1: Onboarding with DEFAULT branch (Bắt đầu từ đầu) -> preview -> reload step 6 recovery -> complete -> first lesson entry.
 * 2. Learner 2: Onboarding with SELF_REPORT branch (Tự chọn trình độ) -> preview -> complete -> verifies DB provenance.
 * 3. Learner 1: Goal and preferences update on Home -> CAS rowVersion -> plan replacement -> DB history check.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import pkg from 'pg';
import { chromium } from 'playwright';
import { PrismaClient } from '../../../lingora-admin/generated/product-client/index.js';
import { seed } from '../../../lingora-admin/prisma/product/seed.mjs';
import {
  provisionSampleA1Curriculum,
  SAMPLE_A1_CONSTANTS,
} from '../../../lingora-admin/src/server/curriculum/sample-a1.ts';
import {
  validateOwnedDatabaseUrl,
  preflightAndSeedActors,
} from '../../../scripts/test-guard-utils.mjs';

const { Client } = pkg;

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const webDir = path.resolve(repoRoot, 'lingora-web');
const nextBin = path.resolve(repoRoot, 'node_modules/next/dist/bin/next');
const evidenceDir = process.env.E2E_OUTPUT_DIR || path.resolve(repoRoot, 'plans/evidence/sprint-3-acceptance/screenshots');

fs.mkdirSync(evidenceDir, { recursive: true });

// Strict owned disposable loopback DB validation
const dbGuard = validateOwnedDatabaseUrl();
const dbUrl = dbGuard.ownedUrl;

// Synthetic actor IDs
const ADMIN_ID = '11111111-0000-4000-8000-000000000001';
const TEACHER_ID = '22222222-0000-4000-8000-000000000001';
const LEARNER_DEF_ID = '33333333-0000-4000-8000-000000000003';
const LEARNER_SR_ID = '44444444-0000-4000-8000-000000000004';

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch {
      // wait
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Server at ${url} failed to respond within ${timeoutMs}ms`);
}

async function registerAndLogin(page, origin, providerOrigin, email) {
  const password = 'SyntheticPassword123!';
  await page.goto(origin + '/register');
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill(password);
  await page.locator('#registerDisplayName').fill('Synthetic learner');
  await page.locator('#registerSubmitBtn').click();
  await page.locator('#registerSuccess').waitFor();
  await page.goto(providerOrigin + '/auth/v1/verify?email=' + encodeURIComponent(email));
  await page.waitForURL('**/login?confirmed=1');
  await page.locator('#loginEmail').fill(email);
  await page.locator('#loginPassword').fill(password);
  await page.locator('#loginSubmitBtn').click();
  await page.waitForURL('**/home');
  await page.locator('#startOnboardingBtn').click();
}

async function run() {
  console.log('=== Sprint 3 Core End-to-End Acceptance Test ===');

  const children = [];
  let pgClient;
  let prisma;
  let browser;
  let providerServer;

  const cleanup = async () => {
    if (browser) {
      try { await browser.close(); } catch {}
    }
    for (const child of children) {
      if (child && child.exitCode === null) {
        child.kill('SIGTERM');
      }
    }
    await new Promise((r) => setTimeout(r, 500));
    for (const child of children) {
      if (child && child.exitCode === null) {
        child.kill('SIGKILL');
      }
    }
    if (providerServer) {
      try {
        await new Promise((resolve) => providerServer.close(resolve));
      } catch {}
    }
    if (prisma) {
      try { await prisma.$disconnect(); } catch {}
    }
    if (pgClient) {
      try { await pgClient.end(); } catch {}
    }
  };

  process.on('SIGINT', async () => { await cleanup(); process.exit(1); });
  process.on('SIGTERM', async () => { await cleanup(); process.exit(1); });

  try {
    // -------------------------------------------------------------
    // 1. Synthetic Supabase Auth Loopback Provider
    // -------------------------------------------------------------
    const authUsers = new Map([
      [`token-${ADMIN_ID}`, { id: ADMIN_ID, email: 'admin@lingora.test', email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { role: 'ADMIN' } }],
      [`token-${TEACHER_ID}`, { id: TEACHER_ID, email: 'teacher@lingora.test', email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { role: 'TEACHER' } }],
      [`token-${LEARNER_DEF_ID}`, { id: LEARNER_DEF_ID, email: 'learner.default@lingora.test', email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { role: 'LEARNER' } }],
      [`token-${LEARNER_SR_ID}`, { id: LEARNER_SR_ID, email: 'learner.selfreport@lingora.test', email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { role: 'LEARNER' } }],
    ]);

    const pendingSignups = new Map();
    const confirmed = new Set();
    let learnerOrigin;
    providerServer = http.createServer(async (req, res) => {
      const url = new URL(req.url, 'http://127.0.0.1');
      res.setHeader('Content-Type', 'application/json');
      const userForEmail = email => [...authUsers.values()].find(user => user.email === email && user.app_metadata.role === 'LEARNER');
      if (req.method === 'POST' && url.pathname === '/auth/v1/signup') {
        let raw = '';
        for await (const chunk of req) raw += chunk;
        const { email, code_challenge: challenge } = JSON.parse(raw);
        const user = userForEmail(email);
        if (!user || !challenge || pendingSignups.has(email)) return res.writeHead(400).end('{}');
        pendingSignups.set(email, challenge);
        await pgClient.query('INSERT INTO auth.users (id, email) VALUES ($1, $2)', [user.id, email]);
        return res.end(JSON.stringify({ ...user, email_confirmed_at: null, identities: [{ id: user.id }] }));
      }
      if (url.pathname === '/auth/v1/verify' && pendingSignups.has(url.searchParams.get('email'))) {
        const code = url.searchParams.get('email');
        return res.writeHead(303, { Location: learnerOrigin + '/auth/confirm?code=' + encodeURIComponent(code) }).end();
      }
      if (req.method === 'POST' && url.pathname === '/auth/v1/token') {
        let raw = '';
        for await (const chunk of req) raw += chunk;
        const input = JSON.parse(raw);
        const isPkce = url.searchParams.get('grant_type') === 'pkce';
        const email = isPkce ? input.auth_code : input.email;
        const user = userForEmail(email);
        if (!user) return res.writeHead(400).end('{}');
        if (isPkce) {
          if (!input.code_verifier || createHash('sha256').update(input.code_verifier).digest('base64url') !== pendingSignups.get(email)) {
            return res.writeHead(400).end('{}');
          }
          pendingSignups.delete(email);
          confirmed.add(email);
        } else if (!confirmed.has(email) || input.password !== 'SyntheticPassword123!') {
          return res.writeHead(400).end('{}');
        }
        return res.end(JSON.stringify({
          access_token: 'token-' + user.id, refresh_token: 'refresh-' + user.id,
          expires_in: 3600, token_type: 'bearer', user,
        }));
      }
      if (url.pathname === '/auth/v1/user') {
        const user = authUsers.get((req.headers.authorization || '').replace(/^Bearer /, ''));
        if (user && confirmed.has(user.email)) return res.end(JSON.stringify(user));
        return res.writeHead(401).end(JSON.stringify({ message: 'Invalid or missing token', status: 401 }));
      }
      res.writeHead(404).end('{}');
    });

    providerServer.listen(0, '127.0.0.1');
    await once(providerServer, 'listening');
    const providerPort = providerServer.address().port;
    const providerOrigin = `http://127.0.0.1:${providerPort}`;
    console.log(`✔ Synthetic Supabase Auth provider listening on ${providerOrigin}`);

    // -------------------------------------------------------------
    // 2. Database Bootstrap & Sample A1 Curriculum Provisioning
    // -------------------------------------------------------------
    prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    await seed(prisma);
    console.log('✔ Base canonical seed (languages, frameworks, levels) applied');

    pgClient = new Client({ connectionString: dbUrl });
    await pgClient.connect();

    await preflightAndSeedActors(pgClient, [
      { id: ADMIN_ID, role: 'ADMIN', status: 'ACTIVE', email: 'admin@lingora.test', displayName: 'Quản trị viên' },
      { id: TEACHER_ID, role: 'TEACHER', status: 'ACTIVE', email: 'teacher@lingora.test', displayName: 'Giáo viên Hương' },
    ]);
    console.log('✔ Synthetic actors verified and seeded in PostgreSQL');

    // Provision Sample A1 Curriculum
    const sampleResult = await provisionSampleA1Curriculum(prisma, {
      adminId: ADMIN_ID,
      teacherId: TEACHER_ID,
    });
    console.log(`✔ Sample A1 Curriculum provisioned: course=${sampleResult.courseId}, lessons=${sampleResult.lessonIds.length}`);

    // -------------------------------------------------------------
    // 3. Start Production Next.js Web Server
    // -------------------------------------------------------------
    const webPort = await getFreePort();
    learnerOrigin = 'http://127.0.0.1:' + webPort;
    const sharedEnv = {
      ...process.env,
      SUPABASE_URL: providerOrigin,
      NEXT_PUBLIC_SUPABASE_URL: providerOrigin,
      SUPABASE_ANON_KEY: 'synthetic-anon-key',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'synthetic-anon-key',
      SUPABASE_PUBLISHABLE_KEY: 'synthetic-public-key',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'synthetic-public-key',
      SUPABASE_SECRET_KEY: '',
      DATABASE_URL: dbUrl,
      DIRECT_URL: dbUrl,
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
    };
    delete sharedEnv.OPENAI_API_KEY;
    delete sharedEnv.ANTHROPIC_API_KEY;
    delete sharedEnv.AWS_ACCESS_KEY_ID;
    delete sharedEnv.AWS_SECRET_ACCESS_KEY;
    delete sharedEnv.SUPABASE_SERVICE_ROLE_KEY;

    console.log(`Starting lingora-web on port ${webPort}...`);
    const webProcess = spawn(
      process.execPath,
      [nextBin, 'start', '-p', String(webPort), '--hostname', '127.0.0.1'],
      {
        cwd: webDir,
        env: {
          ...sharedEnv,
          PORT: String(webPort),
          LINGORA_APP_ORIGIN: `http://127.0.0.1:${webPort}`,
          LINGORA_SRS_SIGNING_SECRET: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    children.push(webProcess);

    await waitForServer(`http://127.0.0.1:${webPort}/login`);
    console.log(`✔ lingora-web ready at http://127.0.0.1:${webPort}`);

    // -------------------------------------------------------------
    // 4. Launch Chromium
    // -------------------------------------------------------------
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // -------------------------------------------------------------
    // SCENARIO 1: Learner 1 (DEFAULT branch)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 1: Learner 1 DEFAULT Onboarding ---');
    const defContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const defPage = await defContext.newPage();

    await registerAndLogin(defPage, learnerOrigin, providerOrigin, 'learner.default@lingora.test');
    await defPage.waitForSelector('#onboardingWizardView', { state: 'visible' });

    // Step 1: Language
    const enLangOption = defPage.locator('#langOption-en');
    await enLangOption.waitFor({ state: 'visible' });
    await enLangOption.click();
    await defPage.click('#btnStep1Next');

    // Step 2: Purpose
    await defPage.waitForSelector('input[name="onboardingPurpose"][value="WORK"]', { state: 'visible' });
    await defPage.click('input[name="onboardingPurpose"][value="WORK"]');
    await defPage.click('#btnStep2Next');

    // Step 3: Daily Goal
    await defPage.waitForSelector('#goalOption-15', { state: 'visible' });
    await defPage.click('#goalOption-15');
    await defPage.click('#btnStep3Next');

    // Step 4: Interests
    await defPage.waitForSelector('label:has-text("Công nghệ & Đổi mới")', { state: 'visible' });
    await defPage.click('label:has-text("Công nghệ & Đổi mới")');
    await defPage.click('label:has-text("Đời sống & Thường nhật")');
    await defPage.click('#btnStep4Next');

    // Step 5: Start Source (DEFAULT)
    await defPage.waitForSelector('#optStartDefault', { state: 'visible' });
    await defPage.click('#optStartDefault');
    await defPage.click('#btnStep5Preview');

    // Step 6: Preview Verification
    await defPage.waitForSelector('#previewCard', { state: 'visible' });
    const previewText = await defPage.textContent('#previewCard');
    assert.match(previewText, /English Core Curriculum|Chương trình tiếng Anh/i);
    assert.match(previewText, /A1/);
    assert.match(previewText, /15 phút \/ ngày/);
    console.log('✔ Preview rendered accurately with starting level and goal');

    // Screenshot of Preview
    await defPage.screenshot({ path: path.join(evidenceDir, '01-onboarding-preview-default.png') });

    // RELOAD RECOVERY CHECK: reload at Step 6
    console.log('Reloading browser at Step 6 to verify state & preview auto-recovery...');
    await defPage.reload({ waitUntil: 'domcontentloaded' });
    await defPage.waitForSelector('#onboardingWizardView', { state: 'visible' });
    await defPage.waitForSelector('#previewCard', { state: 'visible' });
    const restoredPreviewText = await defPage.textContent('#previewCard');
    assert.match(restoredPreviewText, /A1/);
    console.log('✔ Auto-recovery on reload at Step 6 verified');

    // Step 6: Complete
    let firstCompleteBody;
    await defPage.route('**/api/learner/onboarding/complete', async route => {
      firstCompleteBody = route.request().postData();
      const committed = await route.fetch();
      assert.equal(committed.status(), 201);
      await route.abort();
    }, { times: 1 });
    await defPage.click('#btnCompleteOnboarding');
    await defPage.getByRole('button', { name: 'Thử lưu lại' }).waitFor();
    await defPage.reload();
    const replayRequest = defPage.waitForRequest(req => req.url().endsWith('/onboarding/complete'));
    await defPage.getByRole('button', { name: 'Thử lưu lại' }).click();
    assert.equal((await replayRequest).postData(), firstCompleteBody);

    // Step 7: Confirmation & First Lesson
    await defPage.waitForSelector('#stepResult', { state: 'visible' });
    await defPage.screenshot({ path: path.join(evidenceDir, '02-onboarding-result-default.png') });
    console.log('✔ Onboarding completed; success confirmation displayed');

    const firstLessonBtn = defPage.locator('#btnStartFirstLesson');
    await firstLessonBtn.waitFor({ state: 'visible' });
    const firstLessonHref = await firstLessonBtn.getAttribute('href');
    assert.ok(firstLessonHref?.includes('/learn/'), `Expected lesson link, got ${firstLessonHref}`);

    // Click into first lesson
    await firstLessonBtn.click();
    await defPage.waitForSelector('#lessonContentContainer, #startReadingBtn', { state: 'visible' });
    await defPage.locator('#startReadingBtn').click();
    console.log('✔ Started the first lesson through the server-provided href');

    // Database assertions for Learner 1
    const defContextRows = await pgClient.query(`
      SELECT id, status, start_source, selected_start_level_id, self_report, row_version
      FROM app.learning_contexts
      WHERE learner_id = '${LEARNER_DEF_ID}'
    `);
    assert.equal(defContextRows.rowCount, 1, 'Learner 1 must have exactly 1 LearningContext');
    const defCtx = defContextRows.rows[0];
    await defPage.reload();
    const persistedPlan = await defPage.evaluate(async (id) => {
      const response = await fetch('/api/learner/contexts/' + id + '/plan');
      return { status: response.status, body: await response.json() };
    }, defCtx.id);
    assert.equal(persistedPlan.status, 200);
    assert.equal(defCtx.start_source, 'DEFAULT');
    assert.equal(defCtx.selected_start_level_id, '00000000-0000-0000-0000-000000000021');
    assert.equal(defCtx.self_report, null);
    assert.equal(defCtx.status, 'ACTIVE');
    assert.equal(String(defCtx.row_version), '1');

    const defPlanRows = await pgClient.query(`
      SELECT id, status, daily_goal_minutes, source, replaced_at
      FROM app.learning_plans
      WHERE context_id = '${defCtx.id}'
    `);
    assert.equal(defPlanRows.rowCount, 1, 'Learner 1 must have exactly 1 LearningPlan');
    assert.equal(defPlanRows.rows[0].status, 'ACTIVE');
    assert.equal(defPlanRows.rows[0].daily_goal_minutes, 15);
    assert.equal(defPlanRows.rows[0].source, 'DEFAULT');
    assert.equal(persistedPlan.body.data.plan.id, defPlanRows.rows[0].id);
    assert.equal(defPlanRows.rows[0].replaced_at, null);

    const receiptRows = await pgClient.query(`
      SELECT command, target_id FROM app_private.command_receipts
      WHERE target_id = '${defCtx.id}' AND command = 'COMPLETE_ONBOARDING'
    `);
    assert.equal(receiptRows.rowCount, 1, 'Must record COMPLETE_ONBOARDING CommandReceipt');
    console.log('✔ PostgreSQL assertions PASS for Learner 1 (DEFAULT branch)');

    // -------------------------------------------------------------
    // SCENARIO 2: Learner 2 (SELF_REPORT branch)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: Learner 2 SELF_REPORT Onboarding ---');
    const srContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const srPage = await srContext.newPage();

    await registerAndLogin(srPage, learnerOrigin, providerOrigin, 'learner.selfreport@lingora.test');
    await srPage.waitForSelector('#onboardingWizardView', { state: 'visible' });

    // Step 1: Language
    const srLangOption = srPage.locator('#langOption-en');
    await srLangOption.waitFor({ state: 'visible' });
    await srLangOption.click();
    await srPage.click('#btnStep1Next');

    // Step 2: Purpose -> TRAVEL
    await srPage.waitForSelector('input[name="onboardingPurpose"][value="TRAVEL"]', { state: 'visible' });
    await srPage.click('input[name="onboardingPurpose"][value="TRAVEL"]');
    await srPage.click('#btnStep2Next');

    // Step 3: Goal -> 20 min
    await srPage.waitForSelector('#goalOption-20', { state: 'visible' });
    await srPage.click('#goalOption-20');
    await srPage.click('#btnStep3Next');

    // Step 4: Interests -> TRAVEL, CULTURE
    await srPage.waitForSelector('label:has-text("Du lịch")', { state: 'visible' });
    await srPage.click('label:has-text("Du lịch")');
    await srPage.click('label:has-text("Văn hóa & Lịch sử")');
    await srPage.click('#btnStep4Next');

    // Step 5: Start Source -> SELF_REPORT
    await srPage.waitForSelector('#optStartSelfReport', { state: 'visible' });
    await srPage.click('#optStartSelfReport');
    await srPage.waitForSelector('#levelSelect', { state: 'visible' });
    await srPage.selectOption('#levelSelect', '00000000-0000-0000-0000-000000000021'); // Level A1
    await srPage.click('#btnStep5Preview');

    // Step 6: Preview
    await srPage.waitForSelector('#previewCard', { state: 'visible' });
    const srPreviewText = await srPage.textContent('#previewCard');
    assert.match(srPreviewText, /Tự khai trình độ/);
    assert.match(srPreviewText, /A1/);
    assert.match(srPreviewText, /20 phút \/ ngày/);

    await srPage.screenshot({ path: path.join(evidenceDir, '03-onboarding-preview-selfreport.png') });
    await srPage.click('#btnCompleteOnboarding');

    // Step 7: Confirmation
    await srPage.waitForSelector('#stepResult', { state: 'visible' });
    await srPage.locator('#btnStartFirstLesson').click();
    await srPage.locator('#startReadingBtn').click();
    console.log('✔ Learner 2 SELF_REPORT onboarding completed and first lesson opened');

    // Database assertions for Learner 2
    const srContextRows = await pgClient.query(`
      SELECT id, status, start_source, selected_start_level_id, self_report, start_result_id, row_version
      FROM app.learning_contexts
      WHERE learner_id = '${LEARNER_SR_ID}'
    `);
    assert.equal(srContextRows.rowCount, 1, 'Learner 2 must have exactly 1 LearningContext');
    const srCtx = srContextRows.rows[0];
    assert.equal(srCtx.start_source, 'SELF_REPORT');
    assert.equal(srCtx.selected_start_level_id, '00000000-0000-0000-0000-000000000021');
    assert.equal(srCtx.start_result_id, null);
    assert.ok(srCtx.self_report && typeof srCtx.self_report === 'object');
    assert.equal(srCtx.self_report.levelId, '00000000-0000-0000-0000-000000000021');

    const srPlanRows = await pgClient.query(`
      SELECT id, status, daily_goal_minutes, source
      FROM app.learning_plans
      WHERE context_id = '${srCtx.id}'
    `);
    assert.equal(srPlanRows.rowCount, 1, 'Learner 2 must have exactly 1 LearningPlan');
    assert.equal(srPlanRows.rows[0].status, 'ACTIVE');
    assert.equal(srPlanRows.rows[0].daily_goal_minutes, 20);
    assert.equal(srPlanRows.rows[0].source, 'SELF_REPORT');
    console.log('✔ PostgreSQL assertions PASS for Learner 2 (SELF_REPORT provenance verified)');

    // -------------------------------------------------------------
    // SCENARIO 3: Goal Update & Plan Replacement for Learner 1
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: Goal Update & Plan Replacement ---');
    await defPage.goto(`http://127.0.0.1:${webPort}/home`, { waitUntil: 'domcontentloaded' });
    await defPage.waitForSelector('.context-card', { state: 'visible' });

    // Open goal editor
    const editGoalBtn = defPage.locator(`#editGoalBtn-${defCtx.id}`);
    await editGoalBtn.waitFor({ state: 'visible' });
    await editGoalBtn.click();

    // Verify editor loaded plan via GET
    await defPage.waitForSelector(`#goalEditor-${defCtx.id}`, { state: 'visible' });
    const selectedGoalBtn = defPage.locator(`#selectGoal-${defCtx.id}-15`);
    assert.match(await selectedGoalBtn.getAttribute('class'), /btn-primary/);

    // Update goal minutes to 20
    await defPage.click(`#selectGoal-${defCtx.id}-20`);

    // Update purpose to CONVERSATION
    await defPage.selectOption(`#purposeSelect-${defCtx.id}`, 'CONVERSATION');

    // Lose the update response after the real POST commits, then retry the exact request.
    const planRoute = '**/api/learner/contexts/' + defCtx.id + '/plan';
    let firstUpdateBody;
    await defPage.route(planRoute, async route => {
      firstUpdateBody = route.request().postData();
      const committed = await route.fetch();
      assert.equal(committed.status(), 200);
      await route.abort();
    }, { times: 1 });
    await defPage.click(`#saveGoalBtn-${defCtx.id}`);
    const retryGoal = defPage.getByRole('button', { name: 'Thử lưu lại' });
    await retryGoal.waitFor();
    const updateReplay = defPage.waitForRequest(req => req.url().endsWith('/plan') && req.method() === 'POST');
    await retryGoal.click();
    assert.equal((await updateReplay).postData(), firstUpdateBody);
    await defPage.waitForSelector(`#goalEditor-${defCtx.id}`, { state: 'hidden' });

    // Verify rowVersion updated on UI
    const rowVerBadge = await defPage.textContent(`#rowVersion-${defCtx.id}`);
    assert.match(rowVerBadge, /v2/);
    console.log('✔ HomeView goal update completed; rowVersion bumped to v2');

    await defPage.screenshot({ path: path.join(evidenceDir, '04-home-goal-updated.png') });

    // Database assertions after goal update
    const updatedCtxRows = await pgClient.query(`
      SELECT row_version, study_preferences, purpose FROM app.learning_contexts WHERE id = '${defCtx.id}'
    `);
    assert.equal(String(updatedCtxRows.rows[0].row_version), '2');
    assert.equal(updatedCtxRows.rows[0].purpose, 'CONVERSATION');
    const prefs = updatedCtxRows.rows[0].study_preferences;
    assert.equal(prefs.dailyGoalMinutes, 20);
    // Unchanged fields preserved:
    assert.deepEqual([...prefs.interests].sort(), ['DAILY_LIFE', 'TECHNOLOGY']);

    const allPlans = await pgClient.query(`
      SELECT id, status, daily_goal_minutes, replaced_at FROM app.learning_plans
      WHERE context_id = '${defCtx.id}'
      ORDER BY created_at ASC
    `);
    assert.equal(allPlans.rowCount, 2, 'Must have exactly 2 plans (1 REPLACED, 1 ACTIVE)');
    assert.equal(allPlans.rows[0].status, 'REPLACED');
    assert.equal(allPlans.rows[0].daily_goal_minutes, 15);
    assert.ok(allPlans.rows[0].replaced_at !== null, 'Old plan must have replaced_at timestamp');

    assert.equal(allPlans.rows[1].status, 'ACTIVE');
    assert.equal(allPlans.rows[1].daily_goal_minutes, 20);
    assert.equal(allPlans.rows[1].replaced_at, null);

    const updateReceipts = await pgClient.query(`
      SELECT command, target_id FROM app_private.command_receipts
      WHERE command = 'UPDATE_LEARNING_PLAN'
    `);
    assert.equal(updateReceipts.rowCount, 1, 'Must record UPDATE_LEARNING_PLAN CommandReceipt');
    console.log('✔ PostgreSQL assertions PASS for Plan Replacement and Preferences preservation');

    await defContext.close();
    await srContext.close();

    console.log('\n=============================================================');
    console.log('🎉 SPRINT 3 CORE E2E ACCEPTANCE: ALL SCENARIOS PASSED! 🎉');
    console.log('=============================================================\n');
  } finally {
    await cleanup();
  }
}

run().catch((err) => {
  console.error('FATAL E2E FAILURE:', err);
  process.exit(1);
});
