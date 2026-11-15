/**
 * Sprint 5 E2E Acceptance Test:
 * SRS v2, Flashcards, Policy B Scheduler, Memory States, Home CTA Connection,
 * Error Recovery & Idempotency, Multi-Learner Isolation, and Mobile 390px Viewport.
 */

import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
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
const evidenceDir = process.env.E2E_OUTPUT_DIR || path.resolve(repoRoot, 'plans/evidence/sprint-5/screenshots');
fs.mkdirSync(evidenceDir, { recursive: true });

const dbGuard = validateOwnedDatabaseUrl();
const dbUrl = dbGuard.ownedUrl;

const ADMIN_ID = '11111111-0000-4000-8000-000000000001';
const TEACHER_ID = '22222222-0000-4000-8000-000000000001';
const LEARNER_ID = '33333333-0000-4000-8000-000000000001';
const LEARNER2_ID = '33333333-0000-4000-8000-000000000002';
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
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Server at ${url} failed to respond within ${timeoutMs}ms`);
}

async function run() {
  console.log('=== Sprint 5 SRS v2 & Flashcards E2E Acceptance ===');

  const children = [];
  let pgClient;
  let prisma;
  let browser;
  let providerServer;

  const cleanup = async () => {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    for (const child of children) {
      try {
        child.kill('SIGTERM');
      } catch {}
    }
    if (providerServer) {
      try {
        providerServer.close();
      } catch {}
    }
    if (pgClient) {
      try {
        await pgClient.end();
      } catch {}
    }
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch {}
    }
  };

  process.on('SIGINT', async () => {
    await cleanup();
    process.exit(130);
  });
  process.on('SIGTERM', async () => {
    await cleanup();
    process.exit(143);
  });

  try {
    // 1. Synthetic Auth Provider
    const authUsers = new Map([
      [
        `token-${ADMIN_ID}`,
        {
          id: ADMIN_ID,
          aud: 'authenticated',
          role: 'authenticated',
          email: 'admin@lingora.test',
          email_confirmed_at: '2026-01-01T00:00:00Z',
          app_metadata: { role: 'ADMIN' },
        },
      ],
      [
        `token-${TEACHER_ID}`,
        {
          id: TEACHER_ID,
          aud: 'authenticated',
          role: 'authenticated',
          email: 'teacher@lingora.test',
          email_confirmed_at: '2026-01-01T00:00:00Z',
          app_metadata: { role: 'TEACHER' },
        },
      ],
      [
        `token-${LEARNER_ID}`,
        {
          id: LEARNER_ID,
          aud: 'authenticated',
          role: 'authenticated',
          email: 'learner5@lingora.test',
          email_confirmed_at: '2026-01-01T00:00:00Z',
          app_metadata: { role: 'LEARNER' },
        },
      ],
      [
        `token-${LEARNER2_ID}`,
        {
          id: LEARNER2_ID,
          aud: 'authenticated',
          role: 'authenticated',
          email: 'learner5_isolated@lingora.test',
          email_confirmed_at: '2026-01-01T00:00:00Z',
          app_metadata: { role: 'LEARNER' },
        },
      ],
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
      { id: LEARNER_ID, role: 'LEARNER', status: 'ACTIVE', email: 'learner5@lingora.test', displayName: 'Học viên Minh Tuấn' },
      { id: LEARNER2_ID, role: 'LEARNER', status: 'ACTIVE', email: 'learner5_isolated@lingora.test', displayName: 'Học viên Cách Ly' },
    ]);
    console.log('✔ Synthetic actors seeded in PostgreSQL');

    await provisionSampleA1Curriculum(prisma, {
      adminId: ADMIN_ID,
      teacherId: TEACHER_ID,
    });
    console.log('✔ Sample curriculum ready');

    // Create active LearningContext for LEARNER_ID
    await pgClient.query(`
      INSERT INTO app.learning_contexts (id, learner_id, language_id, course_id, status, start_source, selected_start_level_id, working_level_id, row_version, created_at, updated_at)
      VALUES ('${CONTEXT_ID}', '${LEARNER_ID}', '00000000-0000-0000-0000-000000000001', '${SAMPLE_A1_CONSTANTS.courseId}', 'ACTIVE', 'DEFAULT', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000021', 1, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET working_level_id = '00000000-0000-0000-0000-000000000021', start_source = 'DEFAULT', selected_start_level_id = '00000000-0000-0000-0000-000000000021', row_version = 1;
    `);

    // Fetch provisioned lesson vocabulary links
    const vocabLinks = await pgClient.query(`
      SELECT lvl.id as link_id, lvl.vocabulary_id, vc.canonical_form
      FROM app.lesson_vocabulary_links lvl
      JOIN app.vocabulary_concepts vc ON vc.id = lvl.vocabulary_id
      ORDER BY lvl.position ASC
      LIMIT 3;
    `);
    assert.ok(vocabLinks.rows.length >= 2, 'Must have at least 2 lesson vocabulary links provisioned');
    const v1 = vocabLinks.rows[0];
    const v2 = vocabLinks.rows[1];
    const v3 = vocabLinks.rows[2] || vocabLinks.rows[0];
    console.log(`✔ Found vocabulary links: ${v1.canonical_form} (${v1.link_id}), ${v2.canonical_form} (${v2.link_id})`);

    // Clean any pre-existing SRS records for these learners in foreign-key safe order
    await pgClient.query(`DELETE FROM app.srs_review_operations WHERE learner_id IN ('${LEARNER_ID}', '${LEARNER2_ID}')`);
    await pgClient.query(`DELETE FROM app.srs_review_sessions WHERE learner_id IN ('${LEARNER_ID}', '${LEARNER2_ID}')`);
    await pgClient.query(`DELETE FROM app.srs_memory_states WHERE card_id IN (SELECT id FROM app.srs_cards WHERE learner_id IN ('${LEARNER_ID}', '${LEARNER2_ID}'))`);
    await pgClient.query(`DELETE FROM app.srs_cards WHERE learner_id IN ('${LEARNER_ID}', '${LEARNER2_ID}')`);
    await pgClient.query(`DELETE FROM app.xp_events WHERE learner_id IN ('${LEARNER_ID}', '${LEARNER2_ID}')`);

    // Seed 2 overdue SRS cards for LEARNER_ID (past due by 2 hours and 1 hour)
    const card1Id = randomUUID();
    const card2Id = randomUUID();
    await pgClient.query(`
      INSERT INTO app.srs_cards (id, learner_id, vocabulary_id, stage, due_at, enrollment_source, source_lesson_vocabulary_id, row_version, created_at, updated_at)
      VALUES
        ('${card1Id}', '${LEARNER_ID}', '${v1.vocabulary_id}', 1, NOW() - INTERVAL '2 hours', 'OPTIONAL_CHOICE', '${v1.link_id}', 1, NOW(), NOW()),
        ('${card2Id}', '${LEARNER_ID}', '${v2.vocabulary_id}', 1, NOW() - INTERVAL '1 hour', 'OPTIONAL_CHOICE', '${v2.link_id}', 1, NOW(), NOW());
    `);

    // Seed 1 card for LEARNER2_ID to verify multi-learner isolation
    const cardIsolatedId = randomUUID();
    await pgClient.query(`
      INSERT INTO app.srs_cards (id, learner_id, vocabulary_id, stage, due_at, enrollment_source, source_lesson_vocabulary_id, row_version, created_at, updated_at)
      VALUES
        ('${cardIsolatedId}', '${LEARNER2_ID}', '${v1.vocabulary_id}', 1, NOW() - INTERVAL '2 hours', 'OPTIONAL_CHOICE', '${v1.link_id}', 1, NOW(), NOW());
    `);
    console.log(`✔ Pre-seeded 2 overdue SRS cards for Learner 1 and 1 isolated card for Learner 2`);

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

    // 4. Launch Chromium
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

    // -------------------------------------------------------------
    // Desktop Flow (1280x800 Viewport)
    // -------------------------------------------------------------
    console.log('\n--- Desktop Viewport (1280x800) SRS Flow ---');
    const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const learnerCookie = makeSessionCookie(LEARNER_ID, 'learner5@lingora.test', 'sb-127-learner-token');
    await desktopContext.addCookies([learnerCookie]);

    let dropNextReviewResponse = false;
    let droppedOpKey = null;

    // Route interceptor for API calls to verify secrecy, routes, and simulate dropped response
    await desktopContext.route('**/*', async (route) => {
      const req = route.request();
      const url = new URL(req.url());

      if (url.origin !== webOrigin && url.origin !== providerOrigin) {
        return route.abort();
      }

      // Check if this is the review submission where we want to simulate a lost response after server commit
      if (dropNextReviewResponse && url.pathname.includes('/reviews') && req.method() === 'POST') {
        dropNextReviewResponse = false;
        const postData = JSON.parse(req.postData() || '{}');
        droppedOpKey = postData.operationKey;
        console.log(`Simulating network drop for review opKey: ${droppedOpKey} after server commit...`);

        // Send request to server using fetch to ensure server executes and commits the transaction
        const serverRes = await fetch(req.url(), {
          method: req.method(),
          headers: req.headers(),
          body: req.postData(),
        });
        console.log(`Server committed rating with status: ${serverRes.status}`);

        // Abort the client's connection so the browser fetch catches a network error
        return route.abort('failed');
      }

      return route.continue();
    });

    const page = await desktopContext.newPage();

    // Step 1: Visit /home -> Observe CTA shows due count (2)
    console.log('Navigating to /home...');
    await page.goto(`${webOrigin}/home`);
    await page.waitForSelector('#homeView', { timeout: 15000 });
    await page.waitForSelector('#reviewNavBtn', { timeout: 10000 });

    const reviewNavText = await page.textContent('#reviewNavBtn');
    console.log(`Home CTA button text: "${reviewNavText.trim()}"`);
    assert.match(reviewNavText, /Ôn từ vựng\s*\(2\)/, 'Home header CTA must indicate 2 due cards');

    // Verify initial gamification state
    const initialXpText = await page.textContent('#totalXpBadge');
    assert.match(initialXpText, /0\s*XP/, 'Initial XP must be 0');

    await page.screenshot({
      path: path.join(evidenceDir, '01-home-initial-due-desktop.png'),
      fullPage: true,
    });
    console.log('✔ Captured 01-home-initial-due-desktop.png: Initial Home with 2 due cards');

    // Step 2: Click #reviewNavBtn -> Navigate to /review
    console.log('Clicking #reviewNavBtn to enter /review...');
    await page.click('#reviewNavBtn');
    await page.waitForURL(`${webOrigin}/review`);
    await page.waitForSelector('#srsInitialBox', { timeout: 10000 });

    // Step 3: Click #startReviewBtn -> Start Review Session
    console.log('Clicking #startReviewBtn to begin review session...');
    const [createSessionResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/srs/sessions') && res.request().method() === 'POST'),
      page.click('#startReviewBtn'),
    ]);

    assert.equal(createSessionResponse.status(), 201, 'POST /api/srs/sessions must return 201 Created');
    const createSessionJson = await createSessionResponse.json();
    assert.equal(createSessionJson.data.status, 'ACTIVE');
    assert.equal(createSessionJson.data.progress.total, 2);
    assert.equal(createSessionJson.data.progress.completedCount, 0);
    assert.ok(createSessionJson.data.currentItem.cardId, 'currentItem must have cardId');
    assert.deepEqual(Object.keys(createSessionJson.data.currentItem).sort(), ['canonicalForm', 'cardId']);

    const activeSessionId = createSessionJson.data.sessionId;
    const card1DisplayedId = createSessionJson.data.currentItem.cardId;

    await page.waitForSelector('#srsReviewCard', { timeout: 10000 });

    // Verify Card 1 Front Side
    await page.waitForSelector('.srs-canonical-form', { timeout: 10000 });
    const word1 = await page.textContent('.srs-canonical-form');
    console.log(`Card 1 Front: Canonical form is "${word1.trim()}" (cardId: ${card1DisplayedId})`);
    assert.ok(word1.trim().length > 0, 'Card front must display word');

    // Progress counter shows 0 / 2
    const counterText0 = await page.textContent('#sessionCounter');
    assert.match(counterText0, /Đã ôn:\s*0\s*\/\s*2\s*từ/, 'Session counter must show 0 / 2');

    // Back side / meaning must be unrevealed
    const answerSectionHidden = (await page.$('#srsAnswerSection')) === null;
    assert.equal(answerSectionHidden, true, 'Meaning must NOT be visible before flip');

    await page.screenshot({
      path: path.join(evidenceDir, '02-srs-card-front-desktop.png'),
      fullPage: true,
    });
    console.log('✔ Captured 02-srs-card-front-desktop.png: Card front before flip');

    // Step 4: Flip card (Reveal answer via #revealAnswerBtn click)
    console.log('Clicking #revealAnswerBtn to reveal answer...');
    const [revealResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/reveal') && res.request().method() === 'POST'),
      page.click('#revealAnswerBtn'),
    ]);

    assert.equal(revealResponse.status(), 200, 'POST /reveal must return 200 OK');
    const revealJson = await revealResponse.json();
    assert.equal(revealJson.data.cardId, card1DisplayedId);
    assert.ok(revealJson.data.meaningLabels, 'Reveal response must contain meaningLabels');
    assert.ok(revealJson.data.phonetic, 'Reveal response must contain available phonetics');
    assert.ok(revealJson.data.example, 'Reveal response must contain available examples');
    console.log(`Revealed meaning: ${JSON.stringify(revealJson.data.meaningLabels)}`);

    await page.waitForSelector('#srsAnswerSection', { timeout: 10000 });
    await page.waitForSelector('.srs-meaning', { timeout: 10000 });

    // Focus management assertion (Finding 5): focus moves sensibly after reveal
    await page.waitForTimeout(100);
    const activeElementId = await page.evaluate(() => document.activeElement?.id);
    console.log(`Active element id after reveal: "${activeElementId}"`);
    assert.ok(
      activeElementId === 'rateRememberedBtn' || activeElementId === 'srsAnswerSection',
      'Focus must move sensibly to rating control or answer section after reveal'
    );

    await page.screenshot({
      path: path.join(evidenceDir, '03-srs-card-revealed-desktop.png'),
      fullPage: true,
    });
    console.log('✔ Captured 03-srs-card-revealed-desktop.png: Card back revealed with meaning & rating buttons');

    // Step 5: Test keyboard handling (Finding 5)
    // Focus "#rateForgottenBtn", press native Enter. Native Enter must submit FORGOTTEN (must not trigger Remembered!)
    console.log('Focusing #rateForgottenBtn and pressing Enter to rate FORGOTTEN...');
    await page.focus('#rateForgottenBtn');
    const focusedBeforeEnter = await page.evaluate(() => document.activeElement?.id);
    assert.equal(focusedBeforeEnter, 'rateForgottenBtn', 'Focus must be on rateForgottenBtn');

    const [review1Response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/reviews') && res.request().method() === 'POST'),
      page.keyboard.press('Enter'),
    ]);

    assert.equal(review1Response.status(), 200, 'Review submission must succeed with 200');
    const review1Json = await review1Response.json();
    assert.equal(review1Json.data.recordedRating, 'FORGOTTEN', 'Focused Enter must submit FORGOTTEN rating');
    assert.equal(review1Json.data.progress.completedCount, 1);
    assert.deepEqual(Object.keys(review1Json.data.currentItem).sort(), ['canonicalForm', 'cardId']);

    const card2DisplayedId = review1Json.data.currentItem.cardId;

    // Step 6: Verify Card 2 Front Side & Progress Counter
    await page.waitForSelector('#srsReviewCard', { timeout: 10000 });
    const counterText1 = await page.textContent('#sessionCounter');
    console.log(`Session counter after Card 1: "${counterText1.trim()}"`);
    assert.match(counterText1, /Đã ôn:\s*1\s*\/\s*2\s*từ/, 'Session counter must show 1 / 2');

    // Step 7: Test Session Persistence & Resume Across Reload (Finding 1)
    console.log('Testing session persistence across page reload...');
    const storedSessionId = await page.evaluate(() => window.sessionStorage.getItem('lingora_srs_session_id'));
    assert.equal(storedSessionId, activeSessionId, 'sessionStorage must store active sessionId');

    const [resumeResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes(`/api/srs/sessions/${activeSessionId}`) && res.request().method() === 'GET'),
      page.reload(),
    ]);

    assert.equal(resumeResponse.status(), 200, 'GET /api/srs/sessions/[id] on resume must return 200');
    const resumeJson = await resumeResponse.json();
    assert.equal(resumeJson.data.sessionId, activeSessionId);
    assert.equal(resumeJson.data.progress.completedCount, 1);
    assert.equal(resumeJson.data.currentItem.cardId, card2DisplayedId);
    assert.deepEqual(Object.keys(resumeJson.data.currentItem).sort(), ['canonicalForm', 'cardId']);

    await page.waitForSelector('#srsReviewCard', { timeout: 10000 });
    const counterAfterReload = await page.textContent('#sessionCounter');
    assert.match(counterAfterReload, /Đã ôn:\s*1\s*\/\s*2\s*từ/, 'Resumed session must preserve progress 1 / 2');

    // Step 8: Reveal Card 2 via Space
    console.log('Pressing Space to reveal Card 2...');
    await page.keyboard.press('Space');
    await page.waitForSelector('#srsAnswerSection', { timeout: 10000 });
    await page.waitForSelector('.srs-meaning', { timeout: 10000 });

    // Step 9: Simulate dropped response after server commit & test retry (Finding 1 & 2)
    console.log('Simulating committed response loss on Card 2 rating submission...');
    dropNextReviewResponse = true;

    // Press '2' to rate REMEMBERED
    await page.keyboard.press('2');

    // The fetch failed due to simulated response drop -> error state with retry button is displayed
    await page.waitForSelector('#retryReviewBtn', { timeout: 10000 });
    const retryBtnText = await page.textContent('#retryReviewBtn');
    console.log(`Retry button appeared with text: "${retryBtnText.trim()}"`);
    assert.match(retryBtnText, /Thử lại gửi kết quả/i, 'Retry button must indicate pending result retry');
    assert.ok(droppedOpKey, 'droppedOpKey must be recorded');

    // Click #retryReviewBtn: assert the retry sends the SAME identical operationKey
    console.log('Clicking #retryReviewBtn to test idempotent retry...');
    const [retryResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/reviews') && res.request().method() === 'POST'),
      page.click('#retryReviewBtn'),
    ]);

    const retryPostData = JSON.parse(retryResponse.request().postData() || '{}');
    assert.equal(
      retryPostData.operationKey,
      droppedOpKey,
      'Retry submission must reuse identical operationKey UUID'
    );
    assert.equal(retryResponse.status(), 200, 'Server must return 200 for idempotent retry');
    const retryJson = await retryResponse.json();
    assert.equal(retryJson.data.status, 'COMPLETED', 'Session must be COMPLETED');

    // Step 10: Review Session Done Screen
    await page.waitForSelector('#srsDoneBox', { timeout: 10000 });
    const doneText = await page.textContent('#srsDoneBox');
    console.log(`Done box message: "${doneText.trim()}"`);
    assert.match(doneText, /Hoàn thành ôn tập/i, 'Completion message must be displayed');
    assert.match(doneText, /2 từ vựng/i, 'Session count summary must indicate 2 reviewed cards');

    // sessionStorage must have been cleared upon completion
    const clearedSessionId = await page.evaluate(() => window.sessionStorage.getItem('lingora_srs_session_id'));
    assert.equal(clearedSessionId, null, 'sessionStorage must be cleared on session completion');

    await page.screenshot({
      path: path.join(evidenceDir, '04-srs-session-done-desktop.png'),
      fullPage: true,
    });
    console.log('✔ Captured 04-srs-session-done-desktop.png: Review session completed screen');

    // Step 11: Return to /home via #doneBackHomeBtn
    console.log('Clicking #doneBackHomeBtn to return to /home...');
    await page.click('#doneBackHomeBtn');
    await page.waitForURL(`${webOrigin}/home`);
    await page.waitForSelector('#homeView', { timeout: 10000 });
    await page.waitForSelector('#reviewNavBtn', { timeout: 10000 });

    // Verify due count is now 0 (badge "(2)" is gone)
    const updatedNavText = await page.textContent('#reviewNavBtn');
    console.log(`Updated Home CTA button text: "${updatedNavText.trim()}"`);
    assert.equal(updatedNavText.trim(), 'Ôn từ vựng', 'Due count must be 0 after completed review');

    // Verify Learner XP incremented by +2 XP (+1 XP per scheduled card)
    const updatedXpText = await page.textContent('#totalXpBadge');
    console.log(`Updated Total XP: "${updatedXpText.trim()}"`);
    assert.match(updatedXpText, /2\s*XP/, 'Total XP must be exactly 2 XP (+1 per reviewed card)');

    await page.screenshot({
      path: path.join(evidenceDir, '05-home-after-review-desktop.png'),
      fullPage: true,
    });
    console.log('✔ Captured 05-home-after-review-desktop.png: Home after review with 0 due and +2 XP');

    await desktopContext.close();

    // -------------------------------------------------------------
    // Mobile Flow (390x844 Viewport)
    // -------------------------------------------------------------
    console.log('\n--- Mobile Viewport (390x844) SRS Flow ---');
    // Seed 1 more overdue card (v3) for mobile verification
    const card3Id = randomUUID();
    await pgClient.query(`
      INSERT INTO app.srs_cards (id, learner_id, vocabulary_id, stage, due_at, enrollment_source, source_lesson_vocabulary_id, row_version, created_at, updated_at)
      VALUES ('${card3Id}', '${LEARNER_ID}', '${v3.vocabulary_id}', 1, NOW() - INTERVAL '30 minutes', 'OPTIONAL_CHOICE', '${v3.link_id}', 1, NOW(), NOW())
      ON CONFLICT (learner_id, vocabulary_id) DO UPDATE SET due_at = NOW() - INTERVAL '30 minutes';
    `);

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await mobileContext.addCookies([learnerCookie]);
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto(`${webOrigin}/home`);
    await mobilePage.waitForSelector('#homeView', { timeout: 15000 });
    await mobilePage.waitForSelector('#reviewNavBtn', { timeout: 10000 });

    // Check mobile responsive layout: no horizontal scrollbar
    const hasHorizontalOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    assert.equal(hasHorizontalOverflow, false, 'Mobile home page must not have horizontal scrollbar');

    // Click into review
    await mobilePage.click('#reviewNavBtn');
    await mobilePage.waitForURL(`${webOrigin}/review`);
    await mobilePage.waitForSelector('#startReviewBtn', { timeout: 10000 });
    await mobilePage.click('#startReviewBtn');

    // Wait for card and reveal
    await mobilePage.waitForSelector('#srsReviewCard', { timeout: 10000 });
    await mobilePage.waitForSelector('#revealAnswerBtn', { timeout: 10000 });
    await mobilePage.click('#revealAnswerBtn');
    await mobilePage.waitForSelector('#srsAnswerSection', { timeout: 10000 });

    // Verify touch targets (buttons >= 44px min-height)
    const btnBox = await mobilePage.locator('#rateRememberedBtn').boundingBox();
    assert.ok(btnBox && btnBox.height >= 44, 'Rating button must have >= 44px touch target height');

    await mobilePage.screenshot({
      path: path.join(evidenceDir, '06-srs-review-mobile-390px.png'),
      fullPage: true,
    });
    console.log('✔ Captured 06-srs-review-mobile-390px.png: Mobile 390px revealed flashcard');

    // Rate remembered
    await mobilePage.click('#rateRememberedBtn');
    await mobilePage.waitForSelector('#srsDoneBox', { timeout: 10000 });
    await mobileContext.close();

    // -------------------------------------------------------------
    // Multi-Learner Isolation Verification
    // -------------------------------------------------------------
    console.log('\n--- Verifying Multi-Learner Isolation ---');
    const learner2Cards = await pgClient.query(`
      SELECT stage, due_at < NOW() as is_overdue
      FROM app.srs_cards
      WHERE learner_id = '${LEARNER2_ID}';
    `);
    assert.equal(learner2Cards.rows.length, 1, 'Learner 2 card count must be untouched');
    assert.equal(learner2Cards.rows[0].stage, 1, 'Learner 2 card stage must remain 1');
    assert.equal(learner2Cards.rows[0].is_overdue, true, 'Learner 2 card due_at must remain untouched');

    const learner2Xp = await pgClient.query(`
      SELECT count(*) as count FROM app.xp_events WHERE learner_id = '${LEARNER2_ID}';
    `);
    assert.equal(Number(learner2Xp.rows[0].count), 0, 'Learner 2 must have 0 XP events');
    console.log('✔ Multi-learner isolation verified: Learner 2 untouched');

    // -------------------------------------------------------------
    // PostgreSQL Database State Assertions (Policy B & Memory States)
    // -------------------------------------------------------------
    console.log('\n--- Verifying PostgreSQL State (Policy B, SrsMemoryState, Operations) ---');
    // Verify Card 1 (FORGOTTEN): reset to stage 1, scheduled +1 day
    const c1 = await pgClient.query(`
      SELECT stage, due_at, due_at > NOW() as in_future
      FROM app.srs_cards
      WHERE id = '${card1Id}';
    `);
    assert.equal(c1.rows[0].stage, 1, 'Card 1 (FORGOTTEN) must be reset to stage 1');
    assert.equal(c1.rows[0].in_future, true, 'Card 1 must be scheduled in the future (+1 day)');

    // Verify Card 2 (REMEMBERED): stage 1 -> stage 2, scheduled +3 days
    const c2 = await pgClient.query(`
      SELECT stage, due_at, due_at > NOW() as in_future
      FROM app.srs_cards
      WHERE id = '${card2Id}';
    `);
    assert.equal(c2.rows[0].stage, 2, 'Card 2 (REMEMBERED) must advance from stage 1 to stage 2');
    assert.equal(c2.rows[0].in_future, true, 'Card 2 must be scheduled in the future (+3 days)');

    // Verify SrsMemoryState (S5-02)
    const memStates = await pgClient.query(`
      SELECT card_id, skill, scheduler_version, count, lapse
      FROM app.srs_memory_states
      WHERE card_id IN ('${card1Id}', '${card2Id}')
      ORDER BY card_id ASC;
    `);
    assert.equal(memStates.rows.length, 2, 'SrsMemoryState rows must exist for both reviewed cards');
    for (const ms of memStates.rows) {
      assert.equal(ms.skill, 'MEANING', 'Skill must be MEANING');
      assert.equal(ms.scheduler_version.toUpperCase(), 'POLICY_B', 'Scheduler version must be POLICY_B');
      assert.ok(ms.count >= 1, 'Count must be at least 1');
    }

    // Verify SrsReviewOperations
    // The retry after dropped response MUST NOT create a duplicate operation row!
    const desktopSessionOps = await pgClient.query(`
      SELECT rating, prior_stage, next_stage, kind
      FROM app.srs_review_operations
      WHERE learner_id = '${LEARNER_ID}' AND session_key = '${activeSessionId}'
      ORDER BY created_at ASC;
    `);
    assert.equal(
      desktopSessionOps.rows.length,
      2,
      'Desktop session must record exactly 2 operations despite network retry (no duplicate on retry)'
    );

    // Verify total XP events for Learner 1: 2 from desktop session + 1 from mobile session = 3
    const xpEvents = await pgClient.query(`
      SELECT sum(xp) as total_xp, count(*) as event_count
      FROM app.xp_events
      WHERE learner_id = '${LEARNER_ID}';
    `);
    console.log(`✔ Total XP in DB: ${xpEvents.rows[0].total_xp} XP (${xpEvents.rows[0].event_count} events)`);
    assert.equal(Number(xpEvents.rows[0].event_count), 3, 'Must have exactly 3 XP events (no double XP on retry)');
    assert.equal(Number(xpEvents.rows[0].total_xp), 3, 'Learner 1 must have earned exactly 3 XP');

    console.log('\n=============================================================');
    console.log('🎉 SPRINT 5 SRS V2 & FLASHCARDS E2E ACCEPTANCE: PASSED! 🎉');
    console.log('=============================================================');
  } finally {
    await cleanup();
  }
}

run().catch((err) => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
