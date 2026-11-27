/**
 * S6-04b1: Teacher Studio CHARACTER Authoring Flow Browser Verification
 *
 * Runs a real local Chromium browser flow on disposable loopback PostgreSQL:
 * 1. Verifies HTTP lookup rejects an unassigned teacher (404) and same glyph in another language can never appear.
 * 2. Verifies options lookup returns stroke availability without leaking raw stroke geometry.
 * 3. Mobile / narrow viewport (390x844):
 *    - Teacher selects character '日' in Japanese course lesson.
 *    - Changes flags (meaning, reading, stroke animation, guided writing).
 *    - Saves draft, verifies success banner.
 *    - Reloads page, verifies author block values, identity and flags persist.
 * 4. Desktop viewport (1280x800) with keyboard selection and reordering:
 *    - Adds a second CHARACTER block ('木' without strokes).
 *    - Keyboard selection in search input & option list.
 *    - Asserts dynamic warning when stroke animation is toggled for character without strokes.
 *    - Reorders blocks (moves block 2 up), saves, reloads and verifies persisted order.
 * 5. Local draft recovery:
 *    - Edits flags without saving, waits for debounced localStorage backup.
 *    - Reloads page, detects backup banner, clicks restore, saves and verifies persisted recovery.
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
import { PrismaClient } from '../../generated/product-client/index.js';
import { seed } from '../../prisma/product/seed.mjs';
import {
  validateOwnedDatabaseUrl,
  preflightAndSeedActors,
} from '../../../scripts/test-guard-utils.mjs';
import {
  createCharacter,
  createStroke,
  seedCharacterStrokeData,
} from '../../src/server/characters/index.ts';
import {
  saveTeacherLessonDraft,
  submitTeacherLesson,
} from '../../src/server/lessons/index.ts';

const { Client } = pkg;

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const adminDir = path.resolve(repoRoot, 'lingora-admin');
const nextBin = path.resolve(repoRoot, 'node_modules/next/dist/bin/next');
const evidenceDir = path.resolve(repoRoot, 'plans/evidence/sprint-6/s6-04b1/screenshots');
fs.mkdirSync(evidenceDir, { recursive: true });

const dbGuard = validateOwnedDatabaseUrl();
const dbUrl = dbGuard.ownedUrl;

// Synthetic Teacher & Admin IDs
const ASSIGNED_TEACHER_ID = 'aaaaaaaa-1111-4111-8111-111111111111';
const UNASSIGNED_TEACHER_ID = 'bbbbbbbb-2222-4222-8222-222222222222';
const ADMIN_ID = 'cccccccc-0000-4000-8000-000000000001';
const INACTIVE_TEACHER_ID = 'dddddddd-3333-4333-8333-333333333333';

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

async function waitForServer(url, timeoutMs = 35000) {
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

async function run() {
  console.log('=== S6-04b1: Teacher Studio CHARACTER Real Local Chromium Verification ===');

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
      try { child.kill('SIGTERM'); } catch {}
    }
    await new Promise((r) => setTimeout(r, 400));
    for (const child of children) {
      try { child.kill('SIGKILL'); } catch {}
    }
    if (providerServer) {
      try { await new Promise((r) => providerServer.close(r)); } catch {}
    }
    if (prisma) {
      try { await prisma.$disconnect(); } catch {}
    }
    if (pgClient) {
      try { await pgClient.end(); } catch {}
    }
  };

  process.on('SIGINT', async () => { await cleanup(); process.exit(130); });
  process.on('SIGTERM', async () => { await cleanup(); process.exit(143); });

  try {
    // -------------------------------------------------------------
    // 1. Synthetic Supabase Auth Loopback Provider
    // -------------------------------------------------------------
    const authUsers = new Map([
      [`token-${ASSIGNED_TEACHER_ID}`, { id: ASSIGNED_TEACHER_ID, email: 'assigned.teacher@lingora.test', app_metadata: { role: 'TEACHER' } }],
      [`token-${UNASSIGNED_TEACHER_ID}`, { id: UNASSIGNED_TEACHER_ID, email: 'unassigned.teacher@lingora.test', app_metadata: { role: 'TEACHER' } }],
      [`token-${INACTIVE_TEACHER_ID}`, { id: INACTIVE_TEACHER_ID, email: 'inactive.teacher@lingora.test', app_metadata: { role: 'TEACHER' } }],
      [`token-${ADMIN_ID}`, { id: ADMIN_ID, email: 'admin@lingora.test', app_metadata: { role: 'ADMIN' } }],
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

    // -------------------------------------------------------------
    // 2. Database Bootstrap & Seeding
    // -------------------------------------------------------------
    prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    await seed(prisma);

    pgClient = new Client({ connectionString: dbUrl });
    await pgClient.connect();

    // Preflight actors
    await preflightAndSeedActors(pgClient, [
      { id: ADMIN_ID, role: 'ADMIN', status: 'ACTIVE', email: 'admin@lingora.test', displayName: 'Quản trị viên' },
      { id: ASSIGNED_TEACHER_ID, role: 'TEACHER', status: 'ACTIVE', email: 'assigned.teacher@lingora.test', displayName: 'Cô Lan (Phụ trách)' },
      { id: UNASSIGNED_TEACHER_ID, role: 'TEACHER', status: 'ACTIVE', email: 'unassigned.teacher@lingora.test', displayName: 'Thầy Hùng (Không phụ trách)' },
      { id: INACTIVE_TEACHER_ID, role: 'TEACHER', status: 'ACTIVE', email: 'inactive.teacher@lingora.test', displayName: 'Thầy Minh (Vô hiệu hóa)' },
    ]);
    await pgClient.query(`UPDATE app.accounts SET status = 'DISABLED' WHERE id = $1::uuid`, [INACTIVE_TEACHER_ID]);

    // Upsert Japanese and Chinese languages
    const jaLang = await prisma.language.upsert({
      where: { code: 'ja' },
      update: {},
      create: {
        code: 'ja',
        names: { ja: '日本語', en: 'Japanese', vi: 'Tiếng Nhật' },
        isLearnable: true,
        isUiLocale: false,
      },
    });

    const zhLang = await prisma.language.upsert({
      where: { code: 'zh' },
      update: {},
      create: {
        code: 'zh',
        names: { zh: '中文', en: 'Chinese', vi: 'Tiếng Trung' },
        isLearnable: true,
        isUiLocale: false,
      },
    });

    // Create Japanese Course, Unit, Lesson, ContentAssignment
    const jaCourse = await prisma.course.create({
      data: {
        language: { connect: { id: jaLang.id } },
        framework: { connect: { id: '00000000-0000-0000-0000-000000000010' } },
        defaultStartLevel: { connect: { id: '00000000-0000-0000-0000-000000000021' } },
        names: { en: 'Japanese Beginner Studio', ja: '初級日本語スタジオ', vi: 'Tiếng Nhật Sơ cấp' },
        isActive: true,
      },
    });

    const jaUnit = await prisma.unit.create({
      data: {
        course: { connect: { id: jaCourse.id } },
        level: { connect: { id: '00000000-0000-0000-0000-000000000021' } },
        code: 'JA-STUDIO-U01',
        names: { en: 'Unit 1: Kanji Basics', ja: '第1課：漢字の基本', vi: 'Bài 1: Chữ Hán cơ bản' },
        position: 1,
      },
    });

    const jaLesson = await prisma.lesson.create({
      data: {
        unitId: jaUnit.id,
        position: 1,
        availability: 'PLANNED',
        isRequired: true,
        rowVersion: 1n,
      },
    });

    const jaAssignment = await prisma.contentAssignment.create({
      data: {
        lessonId: jaLesson.id,
        currentTeacherId: ASSIGNED_TEACHER_ID,
        createdBy: ADMIN_ID,
        scopeGeneration: 1n,
      },
    });

    await prisma.assignmentHistory.create({
      data: {
        assignmentId: jaAssignment.id,
        sequenceNo: 1,
        eventType: 'ASSIGNED',
        nextTeacherId: ASSIGNED_TEACHER_ID,
        changedBy: ADMIN_ID,
        scopeGeneration: 1n,
        reason: 'Initial assignment for S6-04b1 browser test',
      },
    });

    // Seed Characters:
    // 1. Japanese '日' (with 4 strokes)
    const charJaSun = await createCharacter(
      {
        languageId: jaLang.id,
        glyph: '日',
        scriptType: 'KANJI',
        meaning: 'Mặt trời, ngày',
        primaryReading: 'にち',
        romanization: 'nichi',
        strokeCount: 4,
        metadata: {
          radical: '日',
          jlptLevel: 'N5',
          onyomi: ['ニチ', 'ジツ'],
          kunyomi: ['ひ', 'か'],
        },
      },
      prisma
    );

    const sunStrokes = [
      createStroke(1, [[0.2, 0.1], [0.2, 0.9]]),
      createStroke(2, [[0.2, 0.1], [0.8, 0.1], [0.8, 0.9]]),
      createStroke(3, [[0.2, 0.5], [0.8, 0.5]]),
      createStroke(4, [[0.2, 0.9], [0.8, 0.9]]),
    ];

    await seedCharacterStrokeData(
      {
        characterId: charJaSun.id,
        version: 1,
        strokes: sunStrokes,
        source: 'Lingora Japanese Script Engine',
        license: 'CC-BY-4.0',
        provenance: { author: 'Lingora Content Team', attribution: 'Self-authored' },
      },
      prisma
    );

    // 2. Japanese '木' (static, NO stroke data)
    const charJaTree = await createCharacter(
      {
        languageId: jaLang.id,
        glyph: '木',
        scriptType: 'KANJI',
        meaning: 'Cây cối',
        primaryReading: 'もく',
        romanization: 'moku',
        strokeCount: 4,
        metadata: {
          radical: '木',
          jlptLevel: 'N5',
          onyomi: ['ボク', 'モク'],
          kunyomi: ['き'],
        },
      },
      prisma
    );

    const charJaRiver = await createCharacter(
      { languageId: jaLang.id, glyph: '川', scriptType: 'KANJI', strokeCount: 3 },
      prisma
    );

    // 3. Chinese '日' (same glyph, DIFFERENT course language 'zh')
    const charZhSun = await createCharacter(
      {
        languageId: zhLang.id,
        glyph: '日',
        scriptType: 'HANZI_SIMPLIFIED',
        meaning: 'Mặt trời (tiếng Trung)',
        primaryReading: 'rì',
        romanization: 'ri',
        strokeCount: 4,
        metadata: {
          pinyin: ['rì'],
          hskLevel: 1,
        },
      },
      prisma
    );

    // Seed 25 additional Japanese Katakana characters for pagination verification
    const extraJaChars = [];
    for (let i = 0; i < 25; i++) {
      const glyph = String.fromCodePoint(0x30a1 + i); // ァ, ア, ィ, イ, ゥ, ウ, ェ, エ...
      const c = await createCharacter(
        {
          languageId: jaLang.id,
          glyph,
          scriptType: 'KATAKANA',
          meaning: `Katakana item ${i}`,
          primaryReading: `read_${i}`,
          romanization: `rom_${i}`,
          strokeCount: (i % 8) + 1,
        },
        prisma
      );
      extraJaChars.push(c);
    }

    console.log(`✔ Database setup completed: Course=${jaCourse.id}, Lesson=${jaLesson.id}, Characters=[Ja:日(${charJaSun.id}), Ja:木(${charJaTree.id}), Zh:日(${charZhSun.id}), ExtraJa=${extraJaChars.length}]`);

    // -------------------------------------------------------------
    // 3. Start Production Next.js Server
    // -------------------------------------------------------------
    const adminPort = await getFreePort();
    const adminOrigin = `http://127.0.0.1:${adminPort}`;

    const adminEnv = {
      ...process.env,
      PORT: String(adminPort),
      DATABASE_URL: dbUrl,
      DIRECT_URL: dbUrl,
      SUPABASE_URL: providerOrigin,
      NEXT_PUBLIC_SUPABASE_URL: providerOrigin,
      SUPABASE_ANON_KEY: 'synthetic-anon-key',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'synthetic-anon-key',
      SUPABASE_PUBLISHABLE_KEY: 'synthetic-anon-key',
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
    };

    console.log(`Starting lingora-admin production server on ${adminOrigin}...`);
    const adminProcess = spawn(
      process.execPath,
      [nextBin, 'start', '-p', String(adminPort), '--hostname', '127.0.0.1'],
      {
        cwd: adminDir,
        env: adminEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    children.push(adminProcess);

    await waitForServer(`${adminOrigin}/login`);
    console.log(`✔ lingora-admin ready at ${adminOrigin}`);

    // -------------------------------------------------------------
    // 4. HTTP API Checks: Security, Language Isolation & No Geometry Leakage
    // -------------------------------------------------------------
    console.log('\n--- Part 1: API Security & Isolation Checks ---');

    // 4.1. Unassigned teacher cannot access character options (404)
    const unassignedCookieHeader = `sb-127-auth-token=base64-${Buffer.from(JSON.stringify({
      access_token: `token-${UNASSIGNED_TEACHER_ID}`,
      refresh_token: `refresh-${UNASSIGNED_TEACHER_ID}`,
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      user: { id: UNASSIGNED_TEACHER_ID, email: 'unassigned.teacher@lingora.test' },
    })).toString('base64')}`;

    const unassignedRes = await fetch(`${adminOrigin}/api/teacher/lessons/${jaLesson.id}/character-options`, {
      headers: { Cookie: unassignedCookieHeader },
    });
    assert.equal(unassignedRes.status, 404, 'Unassigned teacher must receive 404');
    console.log('✔ Unassigned teacher rejected with 404');

    // 4.2. Assigned teacher queries '日': only Japanese '日' returned, never Chinese '日'
    const assignedCookieHeader = `sb-127-auth-token=base64-${Buffer.from(JSON.stringify({
      access_token: `token-${ASSIGNED_TEACHER_ID}`,
      refresh_token: `refresh-${ASSIGNED_TEACHER_ID}`,
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      user: { id: ASSIGNED_TEACHER_ID, email: 'assigned.teacher@lingora.test' },
    })).toString('base64')}`;

    const searchRes = await fetch(`${adminOrigin}/api/teacher/lessons/${jaLesson.id}/character-options?q=日`, {
      headers: { Cookie: assignedCookieHeader },
    });
    assert.equal(searchRes.status, 200, 'Assigned teacher search must return 200');
    const searchBody = await searchRes.json();
    assert.ok(Array.isArray(searchBody.data), 'Response must have data array');
    assert.equal(searchBody.data.length, 1, 'Must return exactly 1 Japanese character option for "日"');

    const returnedOption = searchBody.data[0];
    assert.equal(returnedOption.id, charJaSun.id, 'Must return the Japanese character ID');
    assert.notEqual(returnedOption.id, charZhSun.id, 'Chinese character must NEVER appear in Japanese course lesson');
    assert.equal(returnedOption.hasStrokes, true, 'Japanese "日" must have hasStrokes = true');

    // Strictly verify no raw geometry leakage
    assert.equal(returnedOption.strokes, undefined, 'No raw strokes array leakage');
    assert.equal(returnedOption.path, undefined, 'No path data leakage');
    assert.equal(returnedOption.points, undefined, 'No points data leakage');
    console.log('✔ Course language isolation & stroke availability verified without raw geometry leakage');

    // 4.3. Pagination API Checks: multiple pages, invalid continuation, and later-page scoping
    const page1Res = await fetch(`${adminOrigin}/api/teacher/lessons/${jaLesson.id}/character-options`, {
      headers: { Cookie: assignedCookieHeader },
    });
    assert.equal(page1Res.status, 200);
    const page1Body = await page1Res.json();
    assert.equal(page1Body.data.length, 20, 'API page 1 must have exactly 20 items');
    assert.equal(page1Body.hasMore, true, 'API page 1 hasMore must be true');
    assert.ok(page1Body.nextCursor, 'API page 1 nextCursor must be present');

    const page2Res = await fetch(
      `${adminOrigin}/api/teacher/lessons/${jaLesson.id}/character-options?cursor=${encodeURIComponent(page1Body.nextCursor)}`,
      { headers: { Cookie: assignedCookieHeader } }
    );
    assert.equal(page2Res.status, 200);
    const page2Body = await page2Res.json();
    assert.equal(page2Body.data.length, 8, 'API page 2 must have remaining 8 items');
    assert.equal(page2Body.hasMore, false, 'API page 2 hasMore must be false on final page');
    assert.equal(page2Body.nextCursor, null, 'API page 2 nextCursor must be null on final page');

    // Invalid continuation rejected with 400
    const invalidCursorRes = await fetch(
      `${adminOrigin}/api/teacher/lessons/${jaLesson.id}/character-options?cursor=invalid-continuation-token`,
      { headers: { Cookie: assignedCookieHeader } }
    );
    assert.equal(invalidCursorRes.status, 400, 'Invalid continuation must be rejected with 400');
    console.log('✔ Pagination API multiple pages, final page, and invalid continuation verified');

    // -------------------------------------------------------------
    // 5. Browser Flow: Mobile / Narrow Viewport (390x844)
    // -------------------------------------------------------------
    console.log('\n--- Part 2: Mobile Viewport (390x844) Character Authoring Flow ---');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });

    const teacherCookie = makeSessionCookie(ASSIGNED_TEACHER_ID, 'assigned.teacher@lingora.test', 'sb-127-auth-token');
    await mobileContext.addCookies([teacherCookie]);

    const mobilePage = await mobileContext.newPage();
    mobilePage.setDefaultTimeout(10000);

    await mobilePage.goto(`${adminOrigin}/my-lessons/${jaLesson.id}`);
    await mobilePage.waitForSelector('#lessonDraftForm');

    // If Studio mode needs toggle, click it
    const toggleStudioBtn = mobilePage.locator('#btnToggleStudioMode');
    if (await toggleStudioBtn.isVisible()) {
      await toggleStudioBtn.click();
    }

    // Add CHARACTER block
    const addCharBtn = mobilePage.locator('#btnAddBlock-character');
    await addCharBtn.waitFor({ state: 'visible' });
    await addCharBtn.click();
    console.log('✔ Added CHARACTER block via Studio toolbar');

    // Search for character '日'
    const searchInput = mobilePage.locator('input[id^="character-search-input-"]').first();
    await searchInput.waitFor({ state: 'visible' });
    await searchInput.fill('日');

    const searchBtn = mobilePage.locator('button[id^="character-search-btn-"]').first();
    await searchBtn.click();

    // Option should appear
    const optionBtn = mobilePage.locator(`#character-option-${charJaSun.id}`);
    await optionBtn.waitFor({ state: 'visible' });
    await optionBtn.click();
    console.log('✔ Selected Japanese character "日"');

    // Assert selected card is visible
    const selectedCard = mobilePage.locator('div[id^="character-selected-card-"]').first();
    await selectedCard.waitFor({ state: 'visible' });
    const cardText = await selectedCard.textContent();
    assert.ok(cardText.includes('日'), 'Selected card must display glyph "日"');
    assert.ok(cardText.includes('KANJI'), 'Selected card must display script type KANJI');
    assert.ok(cardText.includes('Có dữ liệu nét'), 'Selected card must display stroke availability badge');

    // Assert flags: meaning and reading are checked by default
    const flagMeaning = mobilePage.locator('input[id^="character-flag-meaning-"]').first();
    const flagReading = mobilePage.locator('input[id^="character-flag-reading-"]').first();
    const flagStrokeAnim = mobilePage.locator('input[id^="character-flag-stroke-anim-"]').first();
    const flagGuidedWriting = mobilePage.locator('input[id^="character-flag-guided-writing-"]').first();

    assert.equal(await flagMeaning.isChecked(), true, 'showMeaning should be true by default');
    assert.equal(await flagReading.isChecked(), true, 'showReading should be true by default');
    assert.equal(await flagStrokeAnim.isChecked(), false, 'showStrokeAnimation should be false by default');
    assert.equal(await flagGuidedWriting.isChecked(), false, 'guidedWriting should be false by default');

    // Toggle stroke animation and guided writing flags on
    await flagStrokeAnim.check();
    await flagGuidedWriting.check();
    assert.equal(await flagStrokeAnim.isChecked(), true, 'showStrokeAnimation is checked');
    assert.equal(await flagGuidedWriting.isChecked(), true, 'guidedWriting is checked');

    // Fill titles if empty
    const viTitle = mobilePage.locator('#inputDraftTitleVi');
    await viTitle.fill('Bài học Chữ Hán Ngày (日)');
    const enTitle = mobilePage.locator('#inputDraftTitleEn');
    await enTitle.fill('Lesson: Kanji Sun / Day (日)');

    // Save draft
    const saveBtn = mobilePage.locator('#btnSaveDraft');
    await saveBtn.click();

    // Assert success banner
    const successBanner = mobilePage.locator('#draftSaveSuccess');
    await successBanner.waitFor({ state: 'visible' });
    const successText = await successBanner.textContent();
    assert.ok(successText.includes('Đã lưu bản nháp thành công'), 'Save draft success banner must be displayed');
    console.log(`✔ Draft saved successfully: "${successText.trim()}"`);

    await mobilePage.screenshot({ path: path.join(evidenceDir, '01-mobile-saved.png') });

    // Reload page to verify persistence and projection
    await mobilePage.reload();
    await mobilePage.waitForSelector('#lessonDraftForm');

    // Assert CHARACTER block reloaded with author projection
    const reloadedCard = mobilePage.locator('div[id^="character-selected-card-"]').first();
    await reloadedCard.waitFor({ state: 'visible' });
    const reloadedText = await reloadedCard.textContent();
    assert.ok(reloadedText.includes('日'), 'Reloaded card must display glyph "日"');
    assert.ok(reloadedText.includes('KANJI'), 'Reloaded card must display KANJI');

    const reloadedMeaning = mobilePage.locator('input[id^="character-flag-meaning-"]').first();
    const reloadedReading = mobilePage.locator('input[id^="character-flag-reading-"]').first();
    const reloadedStrokeAnim = mobilePage.locator('input[id^="character-flag-stroke-anim-"]').first();
    const reloadedGuidedWriting = mobilePage.locator('input[id^="character-flag-guided-writing-"]').first();

    assert.equal(await reloadedMeaning.isChecked(), true, 'showMeaning reloaded true');
    assert.equal(await reloadedReading.isChecked(), true, 'showReading reloaded true');
    assert.equal(await reloadedStrokeAnim.isChecked(), true, 'showStrokeAnimation reloaded true');
    assert.equal(await reloadedGuidedWriting.isChecked(), true, 'guidedWriting reloaded true');
    console.log('✔ Reloaded author draft block accurately projected author values and flags');

    await mobilePage.screenshot({ path: path.join(evidenceDir, '02-mobile-reloaded.png') });
    await mobileContext.close();

    // -------------------------------------------------------------
    // 6. Desktop Viewport (1280x800): Keyboard Selection & Reordering
    // -------------------------------------------------------------
    console.log('\n--- Part 3: Desktop Viewport Keyboard Selection & Reordering ---');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    await desktopContext.addCookies([teacherCookie]);

    const desktopPage = await desktopContext.newPage();
    desktopPage.setDefaultTimeout(10000);

    await desktopPage.goto(`${adminOrigin}/my-lessons/${jaLesson.id}`);
    await desktopPage.waitForSelector('#lessonDraftForm');

    // Add a second block: Character '木'
    const desktopAddCharBtn = desktopPage.locator('#btnAddBlock-character');
    await desktopAddCharBtn.click();

    // The second block's search input (only visible picker on canvas)
    const secondSearchInput = desktopPage.locator('input[id^="character-search-input-"]').first();
    await secondSearchInput.waitFor({ state: 'visible' });

    // Test keyboard selection: focus input, type query, press Enter
    await secondSearchInput.focus();
    await secondSearchInput.fill('木');
    await secondSearchInput.press('Enter');

    // Wait for the option button to appear
    const treeOptionBtn = desktopPage.locator(`#character-option-${charJaTree.id}`);
    await treeOptionBtn.waitFor({ state: 'visible' });

    // Focus option and select via Enter key
    await treeOptionBtn.focus();
    await treeOptionBtn.press('Enter');
    console.log('✔ Selected second character "木" via keyboard');

    // Second block card displays '木'
    const secondCard = desktopPage.locator('div[id^="character-selected-card-"]').nth(1);
    await secondCard.waitFor({ state: 'visible' });
    const secondCardText = await secondCard.textContent();
    assert.ok(secondCardText.includes('木'), 'Second card must display "木"');
    assert.ok(secondCardText.includes('Chưa có dữ liệu nét'), 'Second card displays missing strokes badge');

    // Toggle stroke animation on '木' which has NO strokes -> Dynamic warning must appear
    const treeStrokeAnimFlag = desktopPage.locator('input[id^="character-flag-stroke-anim-"]').nth(1);
    await treeStrokeAnimFlag.check();

    const warningEl = desktopPage.locator('div[id^="character-stroke-warning-"]').first();
    await warningEl.waitFor({ state: 'visible' });
    const warningText = await warningEl.textContent();
    assert.ok(warningText.includes('chưa có dữ liệu nét'), 'Stroke warning must appear for character without stroke data');
    console.log('✔ Dynamic stroke warning appeared when enabling stroke animation on character without strokes');

    // Uncheck stroke animation on '木' so draft remains valid for server save
    await treeStrokeAnimFlag.uncheck();

    // Reorder: Move second block up (position 2 -> position 1)
    const moveUpBtns = desktopPage.locator('button[id^="btnMoveUp-"]');
    // Block 1 moveUp is disabled (isFirst). Block 2 moveUp is enabled.
    const secondBlockMoveUp = moveUpBtns.nth(1);
    await secondBlockMoveUp.click();
    console.log('✔ Reordered blocks: moved block 2 up to position 1');

    // Verify block 1 is now '木' and block 2 is '日'
    const firstCardAfterMove = desktopPage.locator('div[id^="character-selected-card-"]').nth(0);
    assert.ok((await firstCardAfterMove.textContent()).includes('木'), 'Block 1 is now "木"');
    const secondCardAfterMove = desktopPage.locator('div[id^="character-selected-card-"]').nth(1);
    assert.ok((await secondCardAfterMove.textContent()).includes('日'), 'Block 2 is now "日"');

    // Save reordered draft
    const desktopSaveBtn = desktopPage.locator('#btnSaveDraft');
    await desktopSaveBtn.click();
    const desktopSuccess = desktopPage.locator('#draftSaveSuccess');
    await desktopSuccess.waitFor({ state: 'visible' });
    console.log('✔ Reordered draft saved to server');

    await desktopPage.screenshot({ path: path.join(evidenceDir, '03-desktop-reordered.png') });

    // Reload and verify reordered order persisted
    await desktopPage.reload();
    await desktopPage.waitForSelector('#lessonDraftForm');

    const card1Reloaded = desktopPage.locator('div[id^="character-selected-card-"]').nth(0);
    await card1Reloaded.waitFor({ state: 'visible' });
    assert.ok((await card1Reloaded.textContent()).includes('木'), 'Reloaded block 1 persisted as "木"');

    const card2Reloaded = desktopPage.locator('div[id^="character-selected-card-"]').nth(1);
    assert.ok((await card2Reloaded.textContent()).includes('日'), 'Reloaded block 2 persisted as "日"');
    console.log('✔ Reordered block identity and positions persisted through server save and reload');

    // Unpinned static snapshot does not establish catalogue stroke unavailability (no false warning on rehydration)
    const rehydratedMissingBadge = desktopPage.locator('span[id^="character-badge-nostrokes-"]');
    assert.equal(await rehydratedMissingBadge.count(), 0, 'Rehydrated unpinned static block must not display false missing strokes badge');
    const rehydratedWarning = desktopPage.locator('div[id^="character-stroke-warning-"]');
    assert.equal(await rehydratedWarning.count(), 0, 'Rehydrated unpinned static block must not display false stroke warning');
    console.log('✔ Rehydrated unpinned static block does not show false missing strokes warning');

    // -------------------------------------------------------------
    // 7. Local Draft Recovery Flow
    // -------------------------------------------------------------
    console.log('\n--- Part 4: Local Draft Recovery Flow ---');

    // Make an unsaved edit: toggle showMeaning off on block 1 ('木')
    const block1MeaningFlag = desktopPage.locator('input[id^="character-flag-meaning-"]').nth(0);
    assert.equal(await block1MeaningFlag.isChecked(), true);
    await block1MeaningFlag.uncheck();
    assert.equal(await block1MeaningFlag.isChecked(), false);

    const backupKey = `lingora_draft_backup_${ASSIGNED_TEACHER_ID}_${jaLesson.id}`;
    await desktopPage.waitForFunction((key) => localStorage.getItem(key) !== null, backupKey);
    await desktopPage.evaluate(({ key, riverId }) => {
      const backup = JSON.parse(localStorage.getItem(key));
      backup.blocks[0].selectedLabel.glyph = '偽';
      backup.blocks[1].content.characterId = riverId;
      backup.blocks[1].content.showStrokeAnimation = false;
      backup.blocks[1].content.guidedWriting = false;
      localStorage.setItem(key, JSON.stringify(backup));
    }, { key: backupKey, riverId: charJaRiver.id });

    // Reload WITHOUT clicking Save Draft
    await desktopPage.reload();
    await desktopPage.waitForSelector('#lessonDraftForm');

    // Assert local backup restoration banner appears
    const restoreBanner = desktopPage.locator('#backupRestoreBanner');
    await restoreBanner.waitFor({ state: 'visible' });
    const bannerText = await restoreBanner.textContent();
    assert.ok(bannerText.includes('Phát hiện bản thảo tự động lưu'), 'Backup restore banner must be displayed');
    console.log('✔ Detected local backup banner on reload');

    // Click restore
    const restoreBtn = desktopPage.locator('#btnRestoreBackup');
    await restoreBtn.click();
    console.log('✔ Clicked Restore Backup');

    // Verify restored state: showMeaning on block 1 is false (recovered from backup!)
    const recoveredMeaningFlag = desktopPage.locator('input[id^="character-flag-meaning-"]').nth(0);
    assert.equal(await recoveredMeaningFlag.isChecked(), false, 'showMeaning should be restored as false from backup');
    const recoveredCard = desktopPage.locator('div[id^="character-selected-card-"]').first();
    assert.equal(await recoveredCard.getByText('偽', { exact: true }).count(), 0, 'A backup label must not be shown as catalogue data');
    assert.equal(await recoveredCard.getByText('木', { exact: true }).count(), 1, 'The saved catalogue label should remain visible');
    const newlySelectedCard = desktopPage.locator('div[id^="character-selected-card-"]').nth(1);
    await newlySelectedCard.getByText('Ký tự đã chọn', { exact: true }).waitFor();
    assert.ok(await newlySelectedCard.getByRole('button', { name: 'Đổi ký tự khác' }).isEnabled());

    // Save the recovered draft to server
    await desktopPage.locator('#btnSaveDraft').click();
    await desktopPage.locator('#draftSaveSuccess').waitFor({ state: 'visible' });
    console.log('✔ Successfully saved recovered draft to server');

    await desktopPage.screenshot({ path: path.join(evidenceDir, '04-draft-recovery.png') });

    // Final reload check
    await desktopPage.reload();
    await desktopPage.waitForSelector('#lessonDraftForm');
    const finalMeaningFlag = desktopPage.locator('input[id^="character-flag-meaning-"]').nth(0);
    assert.equal(await finalMeaningFlag.isChecked(), false, 'Final persisted state retained recovered value');
    await newlySelectedCard.getByText('川', { exact: true }).waitFor();
    console.log('✔ Full local recovery and server reconciliation cycle completed');

    // -------------------------------------------------------------
    // 8. Corrupt Local Backup Rejection & Safe Baseline Preservation
    // -------------------------------------------------------------
    console.log('\n--- Part 5: Corrupt Local Backup Rejection & Fallback ---');

    // Inject corrupt backup with malformed CHARACTER block (string showReading and non-UUID characterId)
    await desktopPage.evaluate(({ teacherId, lessonId }) => {
      const backupKey = `lingora_draft_backup_${teacherId}_${lessonId}`;
      const form = document.getElementById('lessonDraftForm');
      const baseRowVersion = form?.getAttribute('data-row-version') || '1';
      const baseRevisionId = form?.getAttribute('data-revision-id') || null;

      const corruptData = {
        timestamp: Date.now(),
        lessonId,
        baseRowVersion,
        baseRevisionId,
        useV1Studio: true,
        titleVi: 'Corrupt Title',
        titleEn: 'Corrupt Title',
        blocks: [
          {
            blockKey: 'corrupt-block',
            type: 'CHARACTER',
            position: 1,
            schemaVersion: 1,
            content: {
              characterId: 'not-a-valid-uuid',
              showMeaning: true,
              showReading: 'false', // String boolean coercion attempt
              showStrokeAnimation: false,
              guidedWriting: false,
            },
          },
        ],
        paragraphs: [],
        exercises: [],
        vocabulary: [],
      };
      window.localStorage.setItem(backupKey, JSON.stringify(corruptData));
    }, { teacherId: ASSIGNED_TEACHER_ID, lessonId: jaLesson.id });

    // Reload to detect backup banner
    await desktopPage.reload();
    await desktopPage.waitForSelector('#lessonDraftForm');

    const corruptRestoreBanner = desktopPage.locator('#backupRestoreBanner');
    await corruptRestoreBanner.waitFor({ state: 'visible' });

    // Click restore
    await desktopPage.locator('#btnRestoreBackup').click();

    // Verify corrupt backup was rejected and safe server baseline was preserved
    const draftSaveError = desktopPage.locator('#draftSaveError');
    await draftSaveError.waitFor({ state: 'visible' });
    const alertText = await draftSaveError.textContent();
    assert.ok(alertText.includes('Bản sao lưu cục bộ chứa khối nội dung không hợp lệ'), 'Actionable notice shown when corrupt local backup is rejected');
    console.log('✔ Corrupt local backup rejected and safely fell back to server baseline state with actionable notice');

    await desktopContext.close();

    // -------------------------------------------------------------
    // 9. S6-04b1p: Teacher Catalogue Picker Pagination & Later-Page Selection Flow
    // -------------------------------------------------------------
    console.log('\n--- Part 6: Teacher Catalogue Picker Pagination & Later-Page Selection Flow ---');
    const paginationContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    await paginationContext.addCookies([teacherCookie]);

    const paginationPage = await paginationContext.newPage();
    paginationPage.setDefaultTimeout(10000);

    await paginationPage.goto(`${adminOrigin}/my-lessons/${jaLesson.id}`);
    await paginationPage.waitForSelector('#lessonDraftForm');

    // Add a new CHARACTER block
    const addCharBlockBtn = paginationPage.locator('#btnAddBlock-character');
    await addCharBlockBtn.click();
    console.log('✔ Added new CHARACTER block for pagination test');

    // 1. Initial page has exactly 20 character options
    const pickerSearchInput = paginationPage.locator('input[id^="character-search-input-"]').last();
    await pickerSearchInput.waitFor({ state: 'visible' });

    // Click search button with empty query to load catalogue first page
    const initialSearchBtn = paginationPage.locator('button[id^="character-search-btn-"]').last();
    await initialSearchBtn.click();

    // Wait for first 20 options to render
    await paginationPage.waitForFunction(() => {
      const results = document.querySelectorAll('div[id^="character-search-results-"]');
      if (results.length === 0) return false;
      const lastResult = results[results.length - 1];
      return lastResult.querySelectorAll('button[id^="character-option-"]').length === 20;
    });

    const initialOptionsCount = await paginationPage.evaluate(() => {
      const results = document.querySelectorAll('div[id^="character-search-results-"]');
      const lastResult = results[results.length - 1];
      return lastResult.querySelectorAll('button[id^="character-option-"]').length;
    });
    assert.equal(initialOptionsCount, 20, 'Initial page must display exactly 20 character options');
    console.log('✔ Initial catalogue page rendered fixed 20 results');

    // Load more button must be visible
    const loadMoreBtn = paginationPage.locator('button[id^="character-search-load-more-"]').last();
    await loadMoreBtn.waitFor({ state: 'visible' });
    assert.ok(await loadMoreBtn.isVisible(), 'Load more button must be visible when subsequent page exists');
    console.log('✔ Signal for next page present when another page exists');

    // 2. Unsubmitted query test: edit search input to something that has 0 matches, but DO NOT submit
    await pickerSearchInput.fill('nonexistent-query-never-submitted');

    // Click load more button: must use the submitted query (empty), NOT the unsubmitted edited input!
    await loadMoreBtn.click();

    // Verify subsequent page loaded and results were appended (20 + 8 = 28 options)
    await paginationPage.waitForFunction(() => {
      const results = document.querySelectorAll('div[id^="character-search-results-"]');
      if (results.length === 0) return false;
      const lastResult = results[results.length - 1];
      return lastResult.querySelectorAll('button[id^="character-option-"]').length === 28;
    });

    const appendedOptionsCount = await paginationPage.evaluate(() => {
      const results = document.querySelectorAll('div[id^="character-search-results-"]');
      const lastResult = results[results.length - 1];
      return lastResult.querySelectorAll('button[id^="character-option-"]').length;
    });
    assert.equal(appendedOptionsCount, 28, 'Page 2 results appended, keeping submitted query despite edited input');
    console.log('✔ Subsequent page results appended using most recent submitted query');

    // Load more button must disappear on final page
    assert.equal(await loadMoreBtn.isVisible(), false, 'Load more button must disappear on final page');
    console.log('✔ Signal for next page absent on final page');

    // 3. Select a later-page character (extraJaChars[24])
    const targetLaterChar = extraJaChars[24];
    const laterOptionBtn = paginationPage.locator(`#character-option-${targetLaterChar.id}`);
    await laterOptionBtn.waitFor({ state: 'visible' });
    await laterOptionBtn.click();
    console.log(`✔ Selected later-page character "${targetLaterChar.glyph}"`);

    const paginationSelectedCard = paginationPage.locator('div[id^="character-selected-card-"]').last();
    await paginationSelectedCard.waitFor({ state: 'visible' });
    const cardContent = await paginationSelectedCard.textContent();
    assert.ok(cardContent.includes(targetLaterChar.glyph), `Selected card displays glyph "${targetLaterChar.glyph}"`);

    // 4. Test search reset: click "Đổi ký tự khác", search for specific query, results reset to page 1
    const changeBtn = paginationPage.locator('button[id^="character-change-btn-"]').last();
    await changeBtn.click();
    await pickerSearchInput.waitFor({ state: 'visible' });

    // Type query matching Katakana item 1 (matches 1, 10..19 = 11 items)
    await pickerSearchInput.fill('Katakana item 1');
    const paginationSearchBtn = paginationPage.locator('button[id^="character-search-btn-"]').last();
    await paginationSearchBtn.click();

    await paginationPage.waitForFunction(() => {
      const results = document.querySelectorAll('div[id^="character-search-results-"]');
      if (results.length === 0) return false;
      const lastResult = results[results.length - 1];
      return lastResult.querySelectorAll('button[id^="character-option-"]').length === 11;
    });
    console.log('✔ New search reset results to first page and reset continuation');

    // Select first option from new search (e.g. Katakana item 1)
    const resetOptionBtn = paginationPage.locator(`#character-option-${extraJaChars[1].id}`);
    await resetOptionBtn.waitFor({ state: 'visible' });
    await resetOptionBtn.click();

    // 5. Save draft to server
    const paginationSaveBtn = paginationPage.locator('#btnSaveDraft');
    await paginationSaveBtn.click();
    const paginationSaveSuccess = paginationPage.locator('#draftSaveSuccess');
    await paginationSaveSuccess.waitFor({ state: 'visible' });
    console.log('✔ Draft saved to server with selected character');

    // 6. Reload page to verify persistence
    await paginationPage.reload();
    await paginationPage.waitForSelector('#lessonDraftForm');

    const reloadedCards = paginationPage.locator('div[id^="character-selected-card-"]');
    const lastCard = reloadedCards.last();
    await lastCard.waitFor({ state: 'visible' });
    const lastCardText = await lastCard.textContent();
    assert.ok(lastCardText.includes(extraJaChars[1].glyph), `Reloaded draft persisted character "${extraJaChars[1].glyph}"`);
    console.log('✔ Reloaded draft preserved selected character');

    await paginationContext.close();

    // -------------------------------------------------------------
    // 10. S6-04b1p Regression: Invalidation of Stale Concurrent Queries & Late Error Immunity
    // -------------------------------------------------------------
    console.log('\n--- Part 7: Teacher Catalogue Picker Request Invalidation & Race Condition Immunity ---');
    const raceContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    await raceContext.addCookies([teacherCookie]);

    const racePage = await raceContext.newPage();
    racePage.setDefaultTimeout(10000);

    // Seed 22 characters for Query A fixture
    await prisma.writingCharacter.createMany({
      data: Array.from({ length: 22 }, (_, index) => ({
        languageId: jaLang.id,
        glyph: String.fromCodePoint(0x4e20 + index),
        scriptType: 'KANJI',
        strokeCount: 7,
        meaning: 'PaginationRaceFixture',
      })),
    });

    await racePage.goto(`${adminOrigin}/my-lessons/${jaLesson.id}`);
    await racePage.waitForSelector('#lessonDraftForm');

    // Add a new CHARACTER block
    const addRaceBlockBtn = racePage.locator('#btnAddBlock-character');
    await addRaceBlockBtn.click();
    console.log('✔ Added new CHARACTER block for race condition regression test');

    const blockKey = await racePage.evaluate(() => {
      const bodies = document.querySelectorAll('div[id^="characterBlockBody-"]');
      const last = bodies[bodies.length - 1];
      return last.id.replace('characterBlockBody-', '');
    });

    const raceInput = racePage.locator(`#character-search-input-${blockKey}`);
    const raceSearchBtn = racePage.locator(`#character-search-btn-${blockKey}`);
    const raceLoadMoreBtn = racePage.locator(`#character-search-load-more-${blockKey}`);
    const raceOptionsList = racePage.locator(`#character-search-results-${blockKey} button[id^="character-option-"]`);

    // 1. Initial search for Query A (PaginationRaceFixture)
    await raceInput.fill('PaginationRaceFixture');
    await raceSearchBtn.click();
    await raceLoadMoreBtn.waitFor({ state: 'visible' });
    assert.equal(await raceOptionsList.count(), 20, 'Query A page 1 must have 20 items');
    console.log('✔ Query A page 1 rendered 20 items with load more visible');

    // 2. Intercept and hold Query A page 2 request
    const { promise: holdA, resolve: releaseA } = Promise.withResolvers();
    const { promise: startedA, resolve: markStartedA } = Promise.withResolvers();

    await racePage.route('**/character-options?**', async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('q') === 'PaginationRaceFixture' && url.searchParams.has('cursor')) {
        const response = await route.fetch();
        markStartedA();
        await holdA;
        await route.fulfill({ response }).catch(() => {});
      } else {
        await route.continue();
      }
    });

    // Click load more for Query A (request is sent and held)
    await raceLoadMoreBtn.click();
    await Promise.race([
      startedA,
      racePage.waitForTimeout(5000).then(() => { throw new Error('Query A page 2 request was not intercepted'); }),
    ]);
    console.log('✔ Intercepted and holding Query A page 2 request in-flight');

    // 3. Send Query B ('日') while Query A page 2 is in-flight
    await raceInput.fill('日');
    await raceSearchBtn.click();
    await racePage.locator(`#character-option-${charJaSun.id}`).waitFor({ state: 'visible' });
    console.log('✔ Query B ("日") resolved and rendered while Query A page 2 was held');

    // 4. Release held Query A page 2 response
    releaseA();
    await racePage.waitForFunction(
      (bKey) => !document.querySelector(`#character-search-loading-more-${bKey}`) && !document.querySelector(`#character-search-loading-${bKey}`),
      blockKey
    );

    // 5. Assert Query B list was NOT corrupted by late Query A page 2 items
    const optionIdsAfterRelease = await raceOptionsList.evaluateAll((buttons) => buttons.map((b) => b.id));
    assert.deepEqual(
      optionIdsAfterRelease,
      [`character-option-${charJaSun.id}`],
      'Late page 2 of Query A must not be appended to Query B search results'
    );
    assert.equal(await raceLoadMoreBtn.isVisible().catch(() => false), false, 'Load more button must not be visible on Query B');
    console.log('✔ Stale Query A page 2 response was rejected; Query B results and cursor remained intact');

    // 6. Test late error immunity
    const { promise: holdErr, resolve: releaseErr } = Promise.withResolvers();
    const { promise: startedErr, resolve: markStartedErr } = Promise.withResolvers();

    await racePage.unroute('**/character-options?**');

    // Search for PaginationRaceFixture again to get page 1 with load more button
    await raceInput.fill('PaginationRaceFixture');
    await raceSearchBtn.click();
    await raceLoadMoreBtn.waitFor({ state: 'visible' });

    // Intercept page 2 request and hold it to return a 500 error
    await racePage.route('**/character-options?**', async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('q') === 'PaginationRaceFixture' && url.searchParams.has('cursor')) {
        markStartedErr();
        await holdErr;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Late 500 server error from stale pagination' } }),
        }).catch(() => {});
      } else {
        await route.continue();
      }
    });

    // Click load more (input remains enabled while loading more)
    await raceLoadMoreBtn.click();
    await Promise.race([
      startedErr,
      racePage.waitForTimeout(5000).then(() => { throw new Error('Pagination page 2 request was not intercepted'); }),
    ]);

    // Send Query C ('木') before the held page 2 request returns its error
    await raceInput.fill('木');
    await raceSearchBtn.click();
    await racePage.locator(`#character-option-${charJaTree.id}`).waitFor({ state: 'visible' });

    // Release late 500 error from stale page 2 request
    releaseErr();
    await racePage.waitForTimeout(300);

    const raceErrorAlert = racePage.locator(`#character-search-error-${blockKey}`);
    assert.equal(await raceErrorAlert.isVisible().catch(() => false), false, 'Late error from stale query must not appear on active results');
    const optionIdsAfterError = await raceOptionsList.evaluateAll((buttons) => buttons.map((b) => b.id));
    assert.deepEqual(
      optionIdsAfterError,
      [`character-option-${charJaTree.id}`],
      'Active query results must remain untouched by late error'
    );
    console.log('✔ Late error from stale query was ignored and did not corrupt active Query C results');

    await racePage.unroute('**/character-options?**');
    await raceContext.close();

    // -------------------------------------------------------------
    // 11. S6-04b2: Admin Review Flow for Submitted CHARACTER Revision
    // -------------------------------------------------------------
    console.log('\n--- Part 8: Admin Review Flow for Submitted CHARACTER Revision ---');

    // Create a new lesson specifically for review test
    const reviewLesson = await prisma.lesson.create({
      data: {
        unitId: jaUnit.id,
        position: 99,
        availability: 'PLANNED',
        isRequired: true,
        rowVersion: 1n,
      },
    });

    const reviewAssignment = await prisma.contentAssignment.create({
      data: {
        lessonId: reviewLesson.id,
        currentTeacherId: ASSIGNED_TEACHER_ID,
        createdBy: ADMIN_ID,
        scopeGeneration: 1n,
      },
    });

    await prisma.assignmentHistory.create({
      data: {
        assignmentId: reviewAssignment.id,
        sequenceNo: 1,
        eventType: 'ASSIGNED',
        nextTeacherId: ASSIGNED_TEACHER_ID,
        changedBy: ADMIN_ID,
        scopeGeneration: 1n,
        reason: 'Assignment for S6-04b2 review test',
      },
    });

    // Save initial draft with 2 CHARACTER blocks and 1 core exercise
    const draftSaveRes = await saveTeacherLessonDraft(
      ASSIGNED_TEACHER_ID,
      reviewLesson.id,
      {
        title: { vi: 'Bài học kiểm duyệt ký tự' },
        contentSchemaVersion: 1,
        expectedRowVersion: '1',
        expectedRevisionId: null,
        blocks: [
          {
            blockKey: 'char_review_sun',
            type: 'CHARACTER',
            position: 1,
            schemaVersion: 1,
            content: {
              characterId: charJaSun.id,
              showMeaning: true,
              showReading: true,
              showStrokeAnimation: true,
              guidedWriting: true,
            },
          },
          {
            blockKey: 'char_review_tree',
            type: 'CHARACTER',
            position: 2,
            schemaVersion: 1,
            content: {
              characterId: charJaTree.id,
              showMeaning: false,
              showReading: false,
              showStrokeAnimation: false,
              guidedWriting: false,
            },
          },
        ],
        exercises: [
          {
            type: 'MCQ',
            isCore: true,
            position: 1,
            promptData: {
              prompt: 'Chọn nghĩa đúng của chữ 日',
              options: [
                { id: 'opt_1', text: 'Mặt trời' },
                { id: 'opt_2', text: 'Cây cối' },
              ],
            },
            gradingData: { correctOptionId: 'opt_1' },
            feedbackData: { explanation: '日 nghĩa là mặt trời.' },
          },
        ],
      },
      prisma
    );
    assert.equal(draftSaveRes.status, 200, JSON.stringify(draftSaveRes.error));
    const submittedRevId = draftSaveRes.data.data.highestRevision.id;

    // Submit the lesson revision
    const freshLesson = await prisma.lesson.findUnique({ where: { id: reviewLesson.id } });
    const freshRev = await prisma.lessonRevision.findUnique({ where: { id: submittedRevId } });
    const submitLessonRes = await submitTeacherLesson(
      ASSIGNED_TEACHER_ID,
      reviewLesson.id,
      {
        revisionId: submittedRevId,
        expectedLessonRowVersion: String(freshLesson.rowVersion),
        expectedRevisionRowVersion: String(freshRev.rowVersion),
      },
      prisma
    );
    assert.equal(submitLessonRes.status, 200);
    const submissionId = submitLessonRes.data.submissionId;
    console.log(`✔ Teacher submitted lesson with CHARACTER blocks: submissionId=${submissionId}`);

    // Mutate the catalogue in database to verify historical snapshot retention
    await prisma.writingCharacter.update({
      where: { id: charJaSun.id },
      data: {
        meaning: 'Ý NGHĨA CATALOGUE ĐÃ THAY ĐỔI SAU KHI NỘP',
        primaryReading: 'shin_reading',
      },
    });

    // Admin opens browser at review page
    const adminCookie = makeSessionCookie(ADMIN_ID, 'admin@lingora.test', 'sb-127-auth-token');
    const adminContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    await adminContext.addCookies([adminCookie]);

    const adminPage = await adminContext.newPage();
    adminPage.setDefaultTimeout(10000);

    await adminPage.goto(`${adminOrigin}/review/${submissionId}`);
    await adminPage.waitForSelector('#reviewActionsPanel');

    // 1. Verify blocks rendered in position order
    const blockSun = adminPage.locator('#review-block-char_review_sun');
    await blockSun.waitFor({ state: 'visible' });
    const blockTree = adminPage.locator('#review-block-char_review_tree');
    await blockTree.waitFor({ state: 'visible' });

    // Block 1 (char_review_sun):
    const glyphSun = await adminPage.locator('#review-character-glyph-char_review_sun').textContent();
    assert.equal(glyphSun?.trim(), '日', 'Glyph "日" must be rendered');
    const meaningSun = await adminPage.locator('#review-character-meaning-char_review_sun').textContent();
    assert.ok(meaningSun?.includes('Mặt trời, ngày'), 'Original submitted snapshot meaning must be preserved');
    assert.ok(!meaningSun?.includes('Ý NGHĨA CATALOGUE ĐÃ THAY ĐỔI'), 'Mutated catalogue meaning must NOT appear');
    const pinBadge = adminPage.locator('#review-character-badge-pin-char_review_sun');
    await pinBadge.waitFor({ state: 'visible' });
    const pinText = await pinBadge.textContent();
    assert.ok(pinText?.includes('Ghim nét v1'), 'Stroke version pin v1 displayed');

    // Block 2 (char_review_tree):
    const glyphTree = await adminPage.locator('#review-character-glyph-char_review_tree').textContent();
    assert.equal(glyphTree?.trim(), '木', 'Glyph "木" must be rendered');
    assert.equal(await adminPage.locator('#review-character-meaning-char_review_tree').isVisible().catch(() => false), false, 'Disabled meaning must be omitted');
    assert.equal(await adminPage.locator('#review-character-reading-char_review_tree').isVisible().catch(() => false), false, 'Disabled reading must be omitted');
    const noPinBadge = adminPage.locator('#review-character-badge-nopin-char_review_tree');
    await noPinBadge.waitFor({ state: 'visible' });
    console.log('✔ Admin review view accurately projected submitted snapshot with allowlist & display flags');

    // 2. Add block comment on char_review_sun
    const blockCommentsSection = adminPage.locator('#blockComments-char_review_sun');
    await blockCommentsSection.waitFor({ state: 'visible' });
    const writeCommentBtn = blockCommentsSection.getByRole('button', { name: '+ Viết nhận xét' });
    await writeCommentBtn.click();
    const commentInput = blockCommentsSection.locator('textarea');
    await commentInput.fill('Admin nhận xét: Nét chữ rất chuẩn!');
    const saveCommentBtn = blockCommentsSection.getByRole('button', { name: 'Lưu nhận xét' });
    await saveCommentBtn.click();
    await adminPage.waitForFunction(() => {
      const section = document.querySelector('#blockComments-char_review_sun');
      return section && section.textContent && section.textContent.includes('Admin nhận xét: Nét chữ rất chuẩn!');
    });
    console.log('✔ Block-anchored comment created and displayed on CHARACTER block');

    // 3. Admin approves review
    const approveBtn = adminPage.locator('#btnApprove');
    await approveBtn.click();
    const approveSuccess = adminPage.locator('#reviewActionSuccess');
    await approveSuccess.waitFor({ state: 'visible' });
    const statusAfterApprove = await adminPage.locator('#badgeRevisionStatus').textContent();
    assert.ok(statusAfterApprove?.includes('Đã duyệt'), 'Status updated to Đã duyệt');
    console.log('✔ Revision approved by Admin');

    // 4. Admin publishes review
    const publishBtn = adminPage.locator('#btnPublish');
    await publishBtn.click();
    await adminPage.waitForFunction(() => {
      const el = document.querySelector('#badgeRevisionStatus');
      return el && el.textContent && el.textContent.includes('Đã xuất bản');
    });
    console.log('✔ Revision published by Admin');

    // 5. Teacher creates successor draft with updated blocks
    const lessonAfterPublish = await prisma.lesson.findUnique({ where: { id: reviewLesson.id } });
    const successorDraftRes = await saveTeacherLessonDraft(
      ASSIGNED_TEACHER_ID,
      reviewLesson.id,
      {
        title: { vi: 'Bài học đã sửa đổi (bản nháp #2)' },
        contentSchemaVersion: 1,
        expectedRowVersion: String(lessonAfterPublish.rowVersion),
        expectedRevisionId: submittedRevId,
        blocks: [
          {
            blockKey: 'char_successor_only',
            type: 'CHARACTER',
            position: 1,
            schemaVersion: 1,
            content: {
              characterId: charJaTree.id,
              showMeaning: true,
              showReading: true,
              showStrokeAnimation: false,
              guidedWriting: false,
            },
          },
        ],
      },
      prisma
    );
    assert.equal(successorDraftRes.status, 200);

    // 6. Admin reloads `/review/${submissionId}`: original snapshot, order, and blockKey remain intact
    await adminPage.reload();
    await adminPage.waitForSelector('#reviewActionsPanel');
    const reloadedSunGlyph = await adminPage.locator('#review-character-glyph-char_review_sun').textContent();
    assert.equal(reloadedSunGlyph?.trim(), '日', 'Reloaded review page must retain original submitted block "日"');
    const reloadedSunMeaning = await adminPage.locator('#review-character-meaning-char_review_sun').textContent();
    assert.ok(reloadedSunMeaning?.includes('Mặt trời, ngày'), 'Reloaded review page retains original snapshot meaning');

    // Revert catalogue mutation
    await prisma.writingCharacter.update({
      where: { id: charJaSun.id },
      data: {
        meaning: 'Mặt trời, ngày',
        primaryReading: 'にち',
      },
    });

    await adminContext.close();
    console.log('✔ Admin review browser flow completed successfully');

    // -------------------------------------------------------------
    // Part 9: Real Local Chromium Flow - Checkpoint 1: Admin Creates Shell, Assigns Teacher A, /my-lessons Visibility & Route Boundaries
    // -------------------------------------------------------------
    console.log('\n--- Part 9: Checkpoint 1 - Admin Creates Lesson Shell, Assigns Teacher A, /my-lessons Visibility & Route Boundaries ---');

    const adminContextWf = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    await adminContextWf.addCookies([makeSessionCookie(ADMIN_ID, 'admin@lingora.test', 'sb-127-auth-token')]);
    const adminPageWf = await adminContextWf.newPage();
    adminPageWf.setDefaultTimeout(10000);

    // 1. Admin navigates to Japanese course unit lessons page
    await adminPageWf.goto(`${adminOrigin}/courses/${jaCourse.id}/units/${jaUnit.id}`);
    await adminPageWf.waitForSelector('#btnOpenCreateLesson');

    // 2. Admin opens create lesson modal and creates lesson position 2
    await adminPageWf.click('#btnOpenCreateLesson');
    await adminPageWf.waitForSelector('#inputLessonPosition');
    await adminPageWf.fill('#inputLessonPosition', '2');
    await adminPageWf.click('#btnSubmitLessonModal');
    await adminPageWf.waitForSelector('#inputLessonPosition', { state: 'detached' });

    const createdLesson = await prisma.lesson.findFirst({
      where: { unitId: jaUnit.id, position: 2 },
    });
    assert.ok(createdLesson, 'Lesson position 2 must be created in DB');
    const workflowLessonId = createdLesson.id;
    console.log(`✔ Admin created lesson shell position 2: ${workflowLessonId}`);

    // 3. Admin assigns Teacher A via LessonAssignModal
    const assignBtn = adminPageWf.locator(`#btn-assign-lesson-${workflowLessonId}`);
    await assignBtn.waitFor({ state: 'visible' });
    await assignBtn.click();
    await adminPageWf.waitForSelector('#selectAssignTeacher');
    await adminPageWf.selectOption('#selectAssignTeacher', ASSIGNED_TEACHER_ID);
    await adminPageWf.click('#btnSubmitAssignModal');
    await adminPageWf.waitForSelector('#selectAssignTeacher', { state: 'detached' });

    // Verify table in Admin page updates to show Cô Lan
    await adminPageWf.waitForFunction((lessonId) => {
      const row = document.querySelector(`tr:has(#btn-assign-lesson-${lessonId})`);
      return row && row.textContent && row.textContent.includes('Cô Lan');
    }, workflowLessonId);
    console.log('✔ Admin assigned lesson to Teacher A in Chromium UI');

    // 4. Teacher A verifies lesson visible in /my-lessons
    const teacherACtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await teacherACtx.addCookies([makeSessionCookie(ASSIGNED_TEACHER_ID, 'assigned.teacher@lingora.test', 'sb-127-auth-token')]);
    const teacherAPage = await teacherACtx.newPage();
    teacherAPage.setDefaultTimeout(10000);
    await teacherAPage.goto(`${adminOrigin}/my-lessons`);
    await teacherAPage.waitForSelector('#populatedTeacherLessonsTable');
    const teacherAOpenBtn = teacherAPage.locator(`#btn-open-lesson-${workflowLessonId}`);
    await teacherAOpenBtn.waitFor({ state: 'visible' });
    assert.ok(await teacherAOpenBtn.isVisible(), 'Teacher A must see assigned lesson in /my-lessons');
    console.log('✔ /my-lessons of Teacher A displays assigned lesson');

    // 5. Teacher B verifies lesson NOT visible in /my-lessons
    const teacherBCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await teacherBCtx.addCookies([makeSessionCookie(UNASSIGNED_TEACHER_ID, 'unassigned.teacher@lingora.test', 'sb-127-auth-token')]);
    const teacherBPage = await teacherBCtx.newPage();
    teacherBPage.setDefaultTimeout(10000);
    await teacherBPage.goto(`${adminOrigin}/my-lessons`);
    const teacherBOpenBtn = teacherBPage.locator(`#btn-open-lesson-${workflowLessonId}`);
    assert.equal(await teacherBOpenBtn.isVisible().catch(() => false), false, 'Teacher B must NOT see lesson in /my-lessons');
    console.log('✔ /my-lessons of Teacher B does NOT display lesson');

    // 6. Route security checks
    const teacherCookieVal = makeSessionCookie(ASSIGNED_TEACHER_ID, 'assigned.teacher@lingora.test', 'sb-127-auth-token').value;
    const adminCookieVal = makeSessionCookie(ADMIN_ID, 'admin@lingora.test', 'sb-127-auth-token').value;

    const tCreateRes = await fetch(`${adminOrigin}/api/courses/${jaCourse.id}/units/${jaUnit.id}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: adminOrigin,
        Cookie: `sb-127-auth-token=${teacherCookieVal}`,
      },
      body: JSON.stringify({ position: 55, isRequired: true }),
    });
    assert.equal(tCreateRes.status, 403, 'Teacher cannot create lesson shell');

    const tAssignRes = await fetch(`${adminOrigin}/api/courses/${jaCourse.id}/units/${jaUnit.id}/lessons/${workflowLessonId}/assignment`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: adminOrigin,
        Cookie: `sb-127-auth-token=${teacherCookieVal}`,
      },
      body: JSON.stringify({ teacherId: UNASSIGNED_TEACHER_ID, expectedRowVersion: '2' }),
    });
    assert.equal(tAssignRes.status, 403, 'Teacher cannot assign lesson');

    const lessonFreshInact = await prisma.lesson.findUnique({ where: { id: workflowLessonId } });
    const inactAssignRes = await fetch(`${adminOrigin}/api/courses/${jaCourse.id}/units/${jaUnit.id}/lessons/${workflowLessonId}/assignment`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: adminOrigin,
        Cookie: `sb-127-auth-token=${adminCookieVal}`,
      },
      body: JSON.stringify({ teacherId: INACTIVE_TEACHER_ID, expectedRowVersion: String(lessonFreshInact.rowVersion) }),
    });
    assert.equal(inactAssignRes.status, 409, 'Assigning to inactive teacher must return 409');
    const inactBody = await inactAssignRes.json();
    assert.equal(inactBody?.error?.code, 'INVALID_TEACHER_TARGET');
    console.log('✔ Route security: create & assign require Admin, teacher target must be ACTIVE');

    // -------------------------------------------------------------
    // Part 10: Real Local Chromium Flow - Checkpoint 2: Teacher Studio A Opens Lesson, Saves Initial Draft, Reloads, Submits; URL & Save/Submit Security for Unassigned Teacher & After Reassignment
    // -------------------------------------------------------------
    console.log('\n--- Part 10: Checkpoint 2 - Teacher Studio Authoring, Save, Reload, Submit & Reassignment Security ---');

    // 1. Teacher A opens assigned lesson
    await teacherAPage.goto(`${adminOrigin}/my-lessons/${workflowLessonId}`);
    await teacherAPage.waitForSelector('#lessonDraftForm');

    // 2. Teacher A authors content: sets title, adds a paragraph & adds a core exercise
    await teacherAPage.fill('#inputDraftTitleVi', 'Bài 2: Giao tiếp tiếng Nhật cơ bản');
    await teacherAPage.click('#btnAddParagraph');
    await teacherAPage.waitForSelector('#inputParagraph-0');
    await teacherAPage.fill('#inputParagraph-0', 'Nội dung bài học ban đầu do Giáo viên A soạn thảo.');

    // Add a core MCQ exercise required for review submission
    await teacherAPage.click('#btnAddExercise');
    await teacherAPage.waitForSelector('#exerciseModal');
    await teacherAPage.fill('#inputExercisePrompt', 'Chọn nghĩa đúng của chữ 日');
    await teacherAPage.fill('#inputMcqOptionText-0', 'Mặt trời');
    await teacherAPage.fill('#inputMcqOptionText-1', 'Cây cối');
    await teacherAPage.click('#radioMcqCorrectOption-0');
    await teacherAPage.click('#btnSaveExerciseModal');
    await teacherAPage.waitForSelector('#exercisesTable');

    await teacherAPage.click('#btnSaveDraft');
    await teacherAPage.waitForSelector('#draftSaveSuccess');
    const saveSuccessText = await teacherAPage.locator('#draftSaveSuccess').textContent();
    assert.ok(saveSuccessText?.includes('Bản sửa đổi #1'), 'Initial save creates revision #1');
    console.log('✔ Teacher A saved initial draft: Revision #1 created');

    // 3. Reload page: verify persisted title, paragraph & exercise
    await teacherAPage.reload();
    await teacherAPage.waitForSelector('#lessonDraftForm');
    const reloadedTitle = await teacherAPage.inputValue('#inputDraftTitleVi');
    assert.equal(reloadedTitle, 'Bài 2: Giao tiếp tiếng Nhật cơ bản');
    const reloadedPara = await teacherAPage.inputValue('#inputParagraph-0');
    assert.equal(reloadedPara, 'Nội dung bài học ban đầu do Giáo viên A soạn thảo.');
    await teacherAPage.waitForSelector('#exercisesTable');
    console.log('✔ Reload verified: persisted title & content restored accurately');

    // 4. Teacher A submits for review
    await teacherAPage.click('#btnSubmitForReview');
    await teacherAPage.waitForSelector('#submitConfirmModal');
    await teacherAPage.click('#btnConfirmSubmitForReview');
    await teacherAPage.waitForSelector('#inReviewNotice');
    const inRevText = await teacherAPage.locator('#inReviewNotice').textContent();
    assert.ok(inRevText?.includes('Bài học đang chờ duyệt'));
    console.log('✔ Teacher A submitted lesson: status transitioned to IN_REVIEW');

    // 5. Unassigned Teacher B accessing URL directly
    const respB = await teacherBPage.goto(`${adminOrigin}/my-lessons/${workflowLessonId}`);
    assert.equal(respB?.status(), 404, 'Direct URL by unassigned teacher returns 404');

    // 6. Unassigned Teacher B API save & submit
    const unassignedCookieVal = makeSessionCookie(UNASSIGNED_TEACHER_ID, 'unassigned.teacher@lingora.test', 'sb-127-auth-token').value;
    const bSaveRes = await fetch(`${adminOrigin}/api/teacher/lessons/${workflowLessonId}/draft`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: adminOrigin,
        Cookie: `sb-127-auth-token=${unassignedCookieVal}`,
      },
      body: JSON.stringify({
        contentSchemaVersion: 1,
        title: { vi: 'Hacking draft' },
        expectedRowVersion: '2',
        expectedRevisionId: null,
      }),
    });
    assert.equal(bSaveRes.status, 404, 'Unassigned teacher save rejected with 404');

    const bSubmitRes = await fetch(`${adminOrigin}/api/teacher/lessons/${workflowLessonId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: adminOrigin,
        Cookie: `sb-127-auth-token=${unassignedCookieVal}`,
      },
      body: JSON.stringify({
        revisionId: '00000000-0000-0000-0000-000000000000',
        expectedLessonRowVersion: '2',
        expectedRevisionRowVersion: '1',
      }),
    });
    assert.equal(bSubmitRes.status, 404, 'Unassigned teacher submit rejected with 404');
    console.log('✔ Unassigned teacher URL and save/submit APIs strictly rejected with 404');

    // 7. Reassignment: Admin reassigns lesson to Teacher B
    const lessonPreReassign = await prisma.lesson.findUnique({ where: { id: workflowLessonId } });
    const reassignRes = await fetch(`${adminOrigin}/api/courses/${jaCourse.id}/units/${jaUnit.id}/lessons/${workflowLessonId}/assignment`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: adminOrigin,
        Cookie: `sb-127-auth-token=${adminCookieVal}`,
      },
      body: JSON.stringify({
        teacherId: UNASSIGNED_TEACHER_ID,
        expectedRowVersion: String(lessonPreReassign.rowVersion),
      }),
    });
    assert.equal(reassignRes.status, 200, 'Reassignment to Teacher B succeeds');

    // 8. Stale tab save attempt by Teacher A with old expectedRowVersion:
    const staleSaveRes = await fetch(`${adminOrigin}/api/teacher/lessons/${workflowLessonId}/draft`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Origin: adminOrigin,
        Cookie: `sb-127-auth-token=${teacherCookieVal}`,
      },
      body: JSON.stringify({
        contentSchemaVersion: 1,
        title: { vi: 'Stale save from tab' },
        expectedRowVersion: String(lessonPreReassign.rowVersion),
        expectedRevisionId: null,
      }),
    });
    assert.ok(staleSaveRes.status === 404 || staleSaveRes.status === 409, 'Stale tab save rejected');

    const staleSubmitRes = await fetch(`${adminOrigin}/api/teacher/lessons/${workflowLessonId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: adminOrigin,
        Cookie: `sb-127-auth-token=${teacherCookieVal}`,
      },
      body: JSON.stringify({
        revisionId: '00000000-0000-0000-0000-000000000000',
        expectedLessonRowVersion: String(lessonPreReassign.rowVersion),
        expectedRevisionRowVersion: '1',
      }),
    });
    assert.equal(staleSubmitRes.status, 404, 'Stale teacher submit rejected with 404');
    console.log('✔ Reassignment & stale tab concurrency checks verified');

    // -------------------------------------------------------------
    // Part 11: Real Local Chromium Flow - Checkpoint 3: Admin Review Requests Changes with Feedback, Teacher Sees Feedback Banner & Resubmits, Admin Approves & Publishes, Attribution & History Verification
    // -------------------------------------------------------------
    console.log('\n--- Part 11: Checkpoint 3 - Admin Review Requests Changes, Feedback Display, Resubmit, Publish & Attribution ---');

    // 1. Admin opens review page for Revision #1 submission
    const sub1Res = await pgClient.query(`
      SELECT rr.id FROM app.revision_reviews rr
      JOIN app.lesson_revisions lr ON lr.id = rr.lesson_revision_id
      WHERE lr.lesson_id = $1::uuid AND rr.action = 'SUBMIT'
      ORDER BY rr.created_at DESC LIMIT 1
    `, [workflowLessonId]);
    assert.ok(sub1Res.rows.length, 'Submission 1 exists');
    const sub1Id = sub1Res.rows[0].id;
    await adminPageWf.goto(`${adminOrigin}/review/${sub1Id}`);
    await adminPageWf.waitForSelector('#reviewActionsPanel');

    // 2. Admin requests changes with feedback comment
    const feedbackComment = 'Vui lòng bổ sung thêm giải thích chi tiết cho bài học.';
    await adminPageWf.fill('#reviewActionsPanel textarea', feedbackComment);
    await adminPageWf.click('#btnRequestChanges');
    await adminPageWf.waitForSelector('#reviewActionSuccess');
    console.log('✔ Admin requested changes with feedback comment');

    // 3. Currently assigned Teacher B visits Studio in browser
    await teacherBPage.goto(`${adminOrigin}/my-lessons/${workflowLessonId}`);
    await teacherBPage.waitForSelector('#changeRequestFeedbackBanner');
    const feedbackBannerText = await teacherBPage.locator('#changeRequestFeedbackBanner').textContent();
    assert.ok(feedbackBannerText?.includes(feedbackComment), 'Feedback comment appears in banner');
    console.log('✔ Teacher B sees Admin feedback comment in Studio banner');

    // 4. Teacher B clicks "Chỉnh sửa lại", edits title & saves successor Revision #2
    await teacherBPage.click('#btnRequestChangesEdit');
    await teacherBPage.fill('#inputDraftTitleVi', 'Bài 2: Giao tiếp tiếng Nhật cơ bản (Đã sửa theo góp ý)');
    await teacherBPage.click('#btnSaveDraft');
    await teacherBPage.waitForSelector('#draftSaveSuccess');
    const saveSuccess2 = await teacherBPage.locator('#draftSaveSuccess').textContent();
    assert.ok(saveSuccess2?.includes('Bản sửa đổi #2'), 'Successor save creates revision #2');
    console.log('✔ Teacher B saved successor draft: Revision #2 created');

    // 5. Teacher B submits Revision #2
    await teacherBPage.click('#btnSubmitForReview');
    await teacherBPage.waitForSelector('#submitConfirmModal');
    await teacherBPage.click('#btnConfirmSubmitForReview');
    await teacherBPage.waitForSelector('#inReviewNotice');
    console.log('✔ Teacher B resubmitted Revision #2 (IN_REVIEW)');

    // 6. Admin approves & publishes Revision #2
    const sub2Res = await pgClient.query(`
      SELECT rr.id FROM app.revision_reviews rr
      JOIN app.lesson_revisions lr ON lr.id = rr.lesson_revision_id
      WHERE lr.lesson_id = $1::uuid AND rr.action = 'SUBMIT'
      ORDER BY rr.created_at DESC LIMIT 1
    `, [workflowLessonId]);
    assert.ok(sub2Res.rows.length, 'Submission 2 exists');
    const sub2Id = sub2Res.rows[0].id;
    await adminPageWf.goto(`${adminOrigin}/review/${sub2Id}`);
    await adminPageWf.waitForSelector('#reviewActionsPanel');
    await adminPageWf.click('#btnApprove');
    await adminPageWf.waitForSelector('#reviewActionSuccess');
    await adminPageWf.waitForSelector('#btnPublish');
    await adminPageWf.click('#btnPublish');
    await adminPageWf.waitForFunction(() => {
      const el = document.querySelector('#badgeRevisionStatus');
      return el && el.textContent && el.textContent.includes('Đã xuất bản');
    });
    console.log('✔ Admin approved and published Revision #2');

    // 7. Verify published state in database
    const publishedWfLesson = await prisma.lesson.findUnique({
      where: { id: workflowLessonId },
      include: { activeRevision: true },
    });
    assert.equal(publishedWfLesson.availability, 'AVAILABLE');
    assert.equal(publishedWfLesson.activeRevision.revisionNo, 2);
    assert.equal(publishedWfLesson.activeRevision.title.vi, 'Bài 2: Giao tiếp tiếng Nhật cơ bản (Đã sửa theo góp ý)');

    // 8. Attribution & Assignment History verification
    const [rev1DbWf, rev2DbWf] = await Promise.all([
      prisma.lessonRevision.findFirst({ where: { lessonId: workflowLessonId, revisionNo: 1 } }),
      prisma.lessonRevision.findFirst({ where: { lessonId: workflowLessonId, revisionNo: 2 } }),
    ]);
    assert.equal(rev1DbWf.createdBy, ASSIGNED_TEACHER_ID, 'Revision 1 createdBy must be Teacher A');
    assert.equal(rev2DbWf.createdBy, UNASSIGNED_TEACHER_ID, 'Revision 2 createdBy must be Teacher B');

    const historiesWf = await prisma.assignmentHistory.findMany({
      where: { assignment: { lessonId: workflowLessonId } },
      orderBy: { sequenceNo: 'asc' },
    });
    assert.equal(historiesWf.length, 2);
    assert.equal(historiesWf[0].eventType, 'ASSIGNED');
    assert.equal(historiesWf[0].nextTeacherId, ASSIGNED_TEACHER_ID);
    assert.equal(historiesWf[1].eventType, 'REASSIGNED');
    assert.equal(historiesWf[1].previousTeacherId, ASSIGNED_TEACHER_ID);
    assert.equal(historiesWf[1].nextTeacherId, UNASSIGNED_TEACHER_ID);
    console.log('✔ Attribution & Assignment History preserved accurately across reassignment');

    await adminContextWf.close();
    await teacherACtx.close();
    await teacherBCtx.close();

    console.log('\n=== ALL S6-04b1, S6-04b1p & S6-04b2 BROWSER & API VERIFICATIONS PASSED ===');
  } finally {
    await cleanup();
  }
}

run().catch((err) => {
  console.error('\n❌ S6-04b1 Test Failed:', err);
  process.exit(1);
});
