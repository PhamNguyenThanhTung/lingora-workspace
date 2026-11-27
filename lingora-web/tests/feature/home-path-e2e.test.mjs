/**
 * Sprint 4 E2E Acceptance Test:
 * Home & Learning Path, Gamification Overview, Daily Quests, Streak,
 * Practice Finalize Celebration, and Unlock Progression.
 */

import assert from 'node:assert/strict';
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
const evidenceDir = process.env.E2E_OUTPUT_DIR || path.resolve(repoRoot, 'plans/evidence/sprint-4/screenshots');
fs.mkdirSync(evidenceDir, { recursive: true });

const dbGuard = validateOwnedDatabaseUrl();
const dbUrl = dbGuard.ownedUrl;

const ADMIN_ID = '11111111-0000-4000-8000-000000000001';
const TEACHER_ID = '22222222-0000-4000-8000-000000000001';
const LEARNER_ID = '33333333-0000-4000-8000-000000000001';
const CONTEXT_ID = '55555555-0000-4000-8000-000000000001';

function makeSessionCookie(userId, email, cookieName) {
  const session = {
    access_token: `token-${userId}`,
    refresh_token: `refresh-${userId}`,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    user: { id: userId, email },
  };
  return {
    name: cookieName,
    value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`,
    domain: '127.0.0.1',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax',
  };
}

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
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error(`Server at ${url} failed to respond within ${timeoutMs}ms`);
}

async function run() {
  console.log('=== Sprint 4 Home, Path & Gamification E2E Acceptance ===');

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
      if (child && child.exitCode === null) child.kill('SIGTERM');
    }
    await new Promise(r => setTimeout(r, 500));
    for (const child of children) {
      if (child && child.exitCode === null) child.kill('SIGKILL');
    }
    if (providerServer) {
      try { await new Promise(res => providerServer.close(res)); } catch {}
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
    // 1. Synthetic Auth Provider
    const authUsers = new Map([
      [`token-${LEARNER_ID}`, { id: LEARNER_ID, email: 'learner4@lingora.test', email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { role: 'LEARNER' } }],
    ]);

    providerServer = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://127.0.0.1');
      res.setHeader('Content-Type', 'application/json');

      if (url.pathname === '/auth/v1/user') {
        const token = (req.headers.authorization || '').replace(/^Bearer /, '');
        const user = authUsers.get(token);
        if (user) return res.end(JSON.stringify(user));
        return res.writeHead(401).end(JSON.stringify({ message: 'Invalid or missing token', status: 401 }));
      }
      res.writeHead(404).end('{}');
    });

    providerServer.listen(0, '127.0.0.1');
    await once(providerServer, 'listening');
    const providerPort = providerServer.address().port;
    const providerOrigin = `http://127.0.0.1:${providerPort}`;
    console.log(`✔ Synthetic Auth Provider listening on ${providerOrigin}`);

    // 2. Database Bootstrap & Curriculum Provisioning
    prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    await seed(prisma);
    console.log('✔ Base canonical seed applied');

    pgClient = new Client({ connectionString: dbUrl });
    await pgClient.connect();

    await preflightAndSeedActors(pgClient, [
      { id: ADMIN_ID, role: 'ADMIN', status: 'ACTIVE', email: 'admin@lingora.test', displayName: 'Quản trị viên' },
      { id: TEACHER_ID, role: 'TEACHER', status: 'ACTIVE', email: 'teacher@lingora.test', displayName: 'Giáo viên Hương' },
      { id: LEARNER_ID, role: 'LEARNER', status: 'ACTIVE', email: 'learner4@lingora.test', displayName: 'Học viên Mai Anh' },
    ]);
    console.log('✔ Synthetic actors seeded in PostgreSQL');

    const sampleResult = await provisionSampleA1Curriculum(prisma, {
      adminId: ADMIN_ID,
      teacherId: TEACHER_ID,
    });
    const lesson1Id = sampleResult.lessonIds[0];
    const lesson2Id = sampleResult.lessonIds[1];
    console.log(`✔ Sample curriculum ready: lesson1=${lesson1Id}, lesson2=${lesson2Id}`);

    // Pre-create active learning context with workingLevel A1 for LEARNER_ID
    await pgClient.query(`
      INSERT INTO app.learning_contexts (id, learner_id, language_id, course_id, status, start_source, selected_start_level_id, working_level_id, row_version, created_at, updated_at)
      VALUES ('${CONTEXT_ID}', '${LEARNER_ID}', '00000000-0000-0000-0000-000000000001', '${SAMPLE_A1_CONSTANTS.courseId}', 'ACTIVE', 'DEFAULT', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000021', 1, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET working_level_id = '00000000-0000-0000-0000-000000000021', start_source = 'DEFAULT', selected_start_level_id = '00000000-0000-0000-0000-000000000021', row_version = 1;
    `);
    console.log(`✔ Pre-created active LearningContext: ${CONTEXT_ID}`);

    // 3. Start lingora-web
    const webPort = await getFreePort();
    const webOrigin = `http://127.0.0.1:${webPort}`;

    const webEnv = {
      ...process.env,
      PORT: String(webPort),
      DATABASE_URL: dbUrl,
      DIRECT_URL: dbUrl,
      SUPABASE_URL: providerOrigin,
      NEXT_PUBLIC_SUPABASE_URL: providerOrigin,
      SUPABASE_ANON_KEY: 'synthetic-anon-key',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'synthetic-anon-key',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'synthetic-anon-key',
      SUPABASE_PUBLISHABLE_KEY: 'synthetic-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: '',
      SUPABASE_SECRET_KEY: '',
      LINGORA_APP_ORIGIN: webOrigin,
      LINGORA_SRS_SIGNING_SECRET: 'test-srs-hmac-secret-at-least-32-chars-long-very-secure',
    };

    console.log(`Starting lingora-web on port ${webPort}...`);
    const webProcess = spawn(process.execPath, [nextBin, 'start', '--hostname', '127.0.0.1', '-p', String(webPort)], {
      cwd: webDir,
      env: webEnv,
      stdio: 'pipe',
    });
    children.push(webProcess);
    await waitForServer(`${webOrigin}/api/learner/home`);
    console.log(`✔ lingora-web ready at ${webOrigin}`);

    // 4. Launch Chromium & Set Cookie
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });

    const learnerCookie = makeSessionCookie(LEARNER_ID, 'learner4@lingora.test', 'sb-127-learner-token');
    await context.addCookies([learnerCookie]);

    const outboundRequests = [];
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin === webOrigin || url.origin === providerOrigin) return route.continue();
      outboundRequests.push(url.origin);
      return route.abort();
    });
    const page = await context.newPage();

    // -------------------------------------------------------------
    // Step 1: Visit /home -> Initial Gamification & Learning Path View
    // -------------------------------------------------------------
    console.log('Navigating to /home...');
    await page.goto(`${webOrigin}/home`);
    await page.waitForSelector('#homeView', { timeout: 15000 });
    await page.waitForSelector('#gamificationOverview', { timeout: 10000 });
    await page.waitForSelector('#learningPathSection', { timeout: 10000 });

    // Verify initial gamification state
    const initialXpText = await page.textContent('#totalXpBadge');
    assert.match(initialXpText, /0\s*XP/, 'Initial XP must be 0');

    assert.equal((await page.textContent('#totalGemsBadge')).trim(), '0', 'Initial gems must be 0');

    const initialStreakText = await page.textContent('#streakBadge');
    assert.match(initialStreakText, /0/, 'Initial streak must be 0');

    // Verify Continue Learning banner is present
    await page.waitForSelector('#continueLearningBanner', { timeout: 10000 });
    const continueLink = page.locator('#continueLearningBtn');
    assert.equal((await continueLink.innerText()).trim(), 'Bắt đầu học');
    assert.match((await page.locator('#pathProgressSummary').innerText()).trim(), /^0\/3 bài đã hoàn thành$/);
    assert.equal(await page.evaluate(() => {
      const action = document.querySelector('#continueLearningBanner');
      const gamification = document.querySelector('#gamificationOverview');
      return !!action && !!gamification && Boolean(action.compareDocumentPosition(gamification) & Node.DOCUMENT_POSITION_FOLLOWING);
    }), true, 'The main learning action must appear before gamification');

    // Verify Path nodes: Lesson 1 is present
    await page.waitForSelector(`#pathNode-${lesson1Id}`, { timeout: 10000 });
    await page.waitForSelector(`#pathNode-${lesson2Id}`, { timeout: 10000 });

    await page.screenshot({
      path: path.join(evidenceDir, '01-home-initial-desktop.png'),
      fullPage: true,
    });
    console.log('✔ Captured 01-home-initial-desktop.png: Initial Home, Gamification & Learning Path');

    // -------------------------------------------------------------
    // Step 2: Click Continue Learning to enter Lesson 1 Practice
    // -------------------------------------------------------------
    console.log('Clicking continue learning CTA...');
    await continueLink.focus();
    await continueLink.press('Enter');
    await page.waitForURL(`**/learn/${CONTEXT_ID}/${lesson1Id}`);
    await page.waitForSelector('#practiceSection', { timeout: 15000 });
    console.log(`✔ Navigated to Lesson 1 Practice: /learn/${CONTEXT_ID}/${lesson1Id}`);

    // Complete reading if not completed
    const startReadingBtn = page.locator('#startReadingBtn');
    if (await startReadingBtn.isVisible()) {
      await startReadingBtn.click();
      await page.waitForSelector('#completeReadingBtn', { timeout: 10000 });
      await page.click('#completeReadingBtn');
      await page.waitForSelector('#completedStateBtn', { timeout: 10000 });
    }

    // Start practice attempt
    await page.waitForSelector('#startPracticeBtn', { timeout: 10000 });
    await page.click('#startPracticeBtn');
    await page.waitForSelector('#submitResponseBtn', { timeout: 10000 });

    // Answer Exercise 1 (MCQ - opt-1-1 is correct)
    await page.locator('input[value="opt-1-1"]').click();
    await page.click('#submitResponseBtn');
    await page.waitForSelector('#formativeFeedback', { timeout: 10000 });

    // Answer Exercise 2 (FILL_BLANK - "meet")
    await page.waitForSelector('#fillBlankInput', { timeout: 10000 });
    await page.fill('#fillBlankInput', 'meet');
    await page.click('#submitResponseBtn');
    await page.waitForSelector('#formativeFeedback', { timeout: 10000 });

    // Answer Exercise 3 (REORDER - t1, t2, t3)
    await page.waitForSelector('#tokenBtn-t1', { timeout: 10000 });
    await page.click('#tokenBtn-t1');
    await page.click('#tokenBtn-t2');
    await page.click('#tokenBtn-t3');
    await page.click('#submitResponseBtn');
    await page.waitForSelector('#formativeFeedback', { timeout: 10000 });

    // Answer Exercise 4 (MCQ - opt-1b-1 is correct)
    await page.locator('input[value="opt-1b-1"]').click();
    await page.click('#submitResponseBtn');
    await page.waitForSelector('#formativeFeedback', { timeout: 10000 });

    // Answer Exercise 5 (FILL_BLANK - "afternoon")
    await page.waitForSelector('#fillBlankInput', { timeout: 10000 });
    await page.fill('#fillBlankInput', 'afternoon');
    await page.click('#submitResponseBtn');
    await page.waitForSelector('#formativeFeedback', { timeout: 10000 });

    // Answer Exercise 6 (REORDER - See, you, later.)
    await page.waitForSelector('#tokenBtn-t1b-1', { timeout: 10000 });
    await page.click('#tokenBtn-t1b-1');
    await page.click('#tokenBtn-t1b-2');
    await page.click('#tokenBtn-t1b-3');
    await page.click('#submitResponseBtn');
    await page.waitForSelector('#formativeFeedback', { timeout: 10000 });

    // Finalize practice attempt
    await page.waitForSelector('#finalizePracticeBtn:not([disabled])', { timeout: 15000 });
    const finalizePromise = page.waitForResponse(res => res.url().includes('/finalize') && res.request().method() === 'POST');
    await page.click('#finalizePracticeBtn');
    const finalizeRes = await finalizePromise;
    assert.equal(finalizeRes.status(), 200, `Finalize must return 200, got ${finalizeRes.status()}`);

    // -------------------------------------------------------------
    // Step 3: Celebration Display Verification
    // -------------------------------------------------------------
    await page.waitForSelector('#practiceCelebrationBox', { timeout: 15000 });
    console.log('✔ Practice finalized: #practiceCelebrationBox is visible');

    const celebrationXpText = await page.textContent('#celebrationTotalXp');
    assert.match(celebrationXpText, /\+40\s*XP/, 'Celebration must show +40 XP (+30 lesson + 10 quest)');

    const celebrationGemsText = await page.textContent('#celebrationGems');
    assert.match(celebrationGemsText, /\+15/, 'Celebration must show +15 gems (5 lesson + 5 quest + 5 perfect first try)');

    const celebrationStreakText = await page.textContent('#celebrationStreak');
    assert.match(celebrationStreakText, /1\s*ngày/, 'Celebration must show 1 day streak');

    const celebrationAccuracyText = await page.textContent('#celebrationAccuracy');
    assert.match(celebrationAccuracyText, /100%/, 'Celebration must show 100% first try accuracy');

    // Check unlocked achievements in celebration box
    await page.waitForSelector('#celebrationAchievements', { timeout: 10000 });
    const achText = await page.textContent('#celebrationAchievements');
    assert.ok(achText.includes('Bài học đầu tiên'), 'Must display FIRST_LESSON achievement badge');
    assert.ok(achText.includes('Điểm tuyệt đối'), 'Must display PERFECT_PRACTICE achievement badge');

    await page.screenshot({
      path: path.join(evidenceDir, '02-practice-celebration-desktop.png'),
      fullPage: true,
    });
    console.log('✔ Captured 02-practice-celebration-desktop.png: Practice Completion Celebration');

    // -------------------------------------------------------------
    // Step 4: Return to Home & Verify Gamification & Path Updates
    // -------------------------------------------------------------
    await page.reload();
    await page.locator('#practiceCelebrationBox').waitFor();
    assert.match(await page.locator('#celebrationTotalXp').textContent(), /\+40\s*XP/);

    await page.click('#celebrationHomeBtn');
    await page.waitForURL(url => url.pathname === '/home' && url.searchParams.get('contextId') === CONTEXT_ID);
    await page.waitForSelector('#homeView', { timeout: 10000 });

    // Verify updated Total XP = 40
    const updatedXpText = await page.textContent('#totalXpBadge');
    assert.match(updatedXpText, /40\s*XP/, 'Updated total XP must be 40');

    // Verify updated gems = 15
    assert.equal((await page.textContent('#totalGemsBadge')).trim(), '15', 'Updated total gems must be 15');

    // Verify updated Streak = 1
    const updatedStreakText = await page.textContent('#streakBadge');
    assert.match(updatedStreakText, /1/, 'Updated streak must be 1');
    // The 28-day calendar moved to the profile page (plan 1.7); the quests stay in the quest column.
    await page.goto(`${webOrigin}/profile`);
    const calendarDays = page.locator('#streakCalendar li');
    assert.equal(await calendarDays.count(), 28);
    assert.match(await calendarDays.last().getAttribute('aria-label'), / đã học$/);

    // Verify Daily Quest LESSON_1 is completed and claimed (quest column on /home)
    await page.goto(`${webOrigin}/home`);
    const lessonQuestEl = page.locator('[id^="quest-"]').filter({ hasText: 'Hoàn thành 1 bài học' });
    await lessonQuestEl.waitFor({ timeout: 10000 });
    const questHtml = await lessonQuestEl.innerHTML();
    assert.ok(questHtml.includes('1/1') || questHtml.includes('badge-active'), 'Daily quest must show completed/claimed');

    // Verify Learning Path progression
    // Lesson 1 is now COMPLETED
    const lesson1Node = page.locator(`#pathNode-${lesson1Id}`);
    assert.equal(await lesson1Node.getAttribute('data-state'), 'COMPLETED', 'Lesson 1 state must be COMPLETED');
    const l1Text = await lesson1Node.textContent();
    assert.match(l1Text, /Đã hoàn thành/, 'Lesson 1 node must show completed state badge');

    // Lesson 2 is now CURRENT or AVAILABLE (unlocked)
    const lesson2Node = page.locator(`#pathNode-${lesson2Id}`);
    const l2State = await lesson2Node.getAttribute('data-state');
    assert.ok(l2State === 'CURRENT' || l2State === 'AVAILABLE', 'Lesson 2 must be unlocked');

    await page.screenshot({
      path: path.join(evidenceDir, '03-home-updated-gamification-desktop.png'),
      fullPage: true,
    });
    console.log('✔ Captured 03-home-updated-gamification-desktop.png: Updated Home with Gamification & Path Progression');

    // -------------------------------------------------------------
    // Age one owned card to exercise the real SRS write and Home aggregate.
    // G12: newly enrolled cards are due immediately, so park them in the future first and
    // keep exactly one due card for this single-review assertion.
    await pgClient.query(
      "UPDATE app.srs_cards SET due_at = clock_timestamp() + interval '1 day' WHERE learner_id = $1",
      [LEARNER_ID],
    );
    const due = await pgClient.query(
      "UPDATE app.srs_cards SET due_at = clock_timestamp() - interval '1 minute' WHERE id = (SELECT id FROM app.srs_cards WHERE learner_id = $1 ORDER BY id LIMIT 1) RETURNING id",
      [LEARNER_ID],
    );
    assert.equal(due.rowCount, 1);
    await page.goto(webOrigin + '/review');
    await page.locator('#startReviewBtn').click();
    await page.locator('#revealAnswerBtn').click();
    await page.locator('#rateRememberedBtn').click();
    await page.locator('#srsDoneBox').waitFor();
    await page.goto(webOrigin + '/home');
    await page.getByText('41 XP', { exact: true }).waitFor();
    assert.match(await page.locator('#dailyGoalDisplay').textContent(), /1 từ đã ôn/);
    await page.reload();
    await page.getByText('41 XP', { exact: true }).waitFor();
    console.log('✔ SRS review persists exactly +1 XP and one daily review after reload');

    // Step 5: Mobile Viewport (390px) Responsive Verification
    // -------------------------------------------------------------
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    assert.ok(scrollWidth <= clientWidth + 2, `No horizontal overflow on 390px mobile (scrollWidth: ${scrollWidth}, clientWidth: ${clientWidth})`);

    await page.screenshot({
      path: path.join(evidenceDir, '04-home-mobile-390px.png'),
      fullPage: true,
    });
    console.log('✔ Captured 04-home-mobile-390px.png: Mobile 390px Viewport Home & Gamification');
    assert.deepEqual(outboundRequests, [], 'Browser must use only local E2E origins');

    console.log('=============================================================');
    console.log('🎉 SPRINT 4 HOME, PATH & GAMIFICATION E2E ACCEPTANCE: PASSED! 🎉');
    console.log('=============================================================');
  } finally {
    await cleanup();
  }
}

run().catch(err => {
  console.error('E2E TEST FAILURE:', err);
  process.exit(1);
});
