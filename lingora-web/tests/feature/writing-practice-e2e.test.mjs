import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { test, before, after } from 'node:test';
import { chromium } from 'playwright';
import { PrismaClient } from '../../../lingora-admin/generated/product-client/index.js';
import { createPracticeFixture } from './harness/practice-db-fixture.mjs';
import { createJapaneseCurriculumFixture } from './harness/japanese-curriculum-fixture.mjs';
import { CHINESE_AUDIO_FIXTURE_URL, createChineseCurriculumFixture } from './harness/chinese-curriculum-fixture.mjs';
import { getLearnerCookieName } from '../../src/server/auth/env.ts';
import { completeOnboarding } from '../../src/server/context/onboarding-service.ts';

const databaseUrl = process.env.SLICE11_TEST_DATABASE_URL;
assert.ok(databaseUrl, 'Run through scripts/local-test-db.mjs to provision an owned database');
assert.equal(process.env.SLICE11_TEST_DATABASE_OWNED, '1');
assert.equal(databaseUrl, process.env.SLICE11_LOCAL_DATABASE_URL);
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(databaseUrl).hostname));
assert.match(new URL(databaseUrl).pathname, /^\/slice11_test/);

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const webDirectory = path.join(repoRoot, 'lingora-web');
const nextBinary = createRequire(import.meta.url).resolve('next/dist/bin/next');
let learnerId;
const accessToken = `writing-${randomUUID()}`;
const authUsers = new Map();

let database;
let fixture;
let japaneseFixture;
let japaneseContextId;
let chineseFixture;
let chineseContextId;
let chineseAccessToken;
let srsLearnerId;
let srsAccessToken;
let browser;
let providerServer;
let webProcess;
let serverOrigin;
let providerOrigin;

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

async function waitForServer(url, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (webProcess?.exitCode !== null) {
      throw new Error(`Next.js exited before readiness (code ${webProcess.exitCode}).`);
    }
    try {
      const response = await fetch(url);
      if (response.status < 500) return;
    } catch {
      // The production server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Next.js server did not become ready at ${url}.`);
}

function learnerCookie(providerOrigin, tokenValue = accessToken) {
  const session = {
    access_token: tokenValue,
    refresh_token: `refresh-${randomUUID()}`,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: authUsers.get(tokenValue),
  };
  return {
    name: getLearnerCookieName(providerOrigin),
    value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`,
    domain: '127.0.0.1',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax',
  };
}

before(async () => {
  database = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  await database.$connect();
  fixture = await createPracticeFixture(database, { writingCharacter: true });
  learnerId = fixture.learnerA;
  japaneseFixture = await createJapaneseCurriculumFixture(database, { learnerId });
  japaneseContextId = randomUUID();
  await completeOnboarding(learnerId, {
    contextId: japaneseContextId,
    languageId: japaneseFixture.language.id,
    purpose: 'TRAVEL',
    dailyGoalMinutes: 15,
    entryChoice: { startSource: 'DEFAULT' },
    expectedCourseId: japaneseFixture.course.id,
    expectedStartLevelId: japaneseFixture.level.id,
  }, database);
  chineseFixture = await createChineseCurriculumFixture(database);
  chineseContextId = randomUUID();
  await completeOnboarding(chineseFixture.learner, {
    contextId: chineseContextId,
    languageId: chineseFixture.language.id,
    purpose: 'TRAVEL',
    dailyGoalMinutes: 15,
    entryChoice: { startSource: 'DEFAULT' },
    expectedCourseId: chineseFixture.course.id,
    expectedStartLevelId: chineseFixture.level.id,
  }, database);
  authUsers.set(accessToken, {
    id: learnerId,
    email: `writing-${learnerId}@lingora.test`,
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
    app_metadata: { role: 'LEARNER' },
  });
  chineseAccessToken = `writing-chinese-${randomUUID()}`;
  authUsers.set(chineseAccessToken, {
    id: chineseFixture.learner,
    email: `writing-${chineseFixture.learner}@lingora.test`,
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
    app_metadata: { role: 'LEARNER' },
  });
  srsLearnerId = randomUUID();
  srsAccessToken = `writing-srs-${randomUUID()}`;
  await database.$executeRaw`INSERT INTO auth.users (id, email) VALUES (${srsLearnerId}::uuid, ${'writing-srs-' + srsLearnerId + '@lingora.test'}) ON CONFLICT DO NOTHING`;
  await database.account.create({
    data: {
      id: srsLearnerId,
      role: 'LEARNER',
      status: 'ACTIVE',
      timezone: 'Asia/Ho_Chi_Minh',
    },
  });
  authUsers.set(srsAccessToken, {
    id: srsLearnerId,
    email: `writing-srs-${srsLearnerId}@lingora.test`,
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
    app_metadata: { role: 'LEARNER' },
  });

  providerServer = http.createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/auth/v1/user') {
      const token = (request.headers.authorization || '').replace(/^Bearer\s+/i, '');
      const user = authUsers.get(token);
      response.writeHead(user ? 200 : 401).end(JSON.stringify(user || { message: 'Unauthorized' }));
      return;
    }
    response.writeHead(404).end(JSON.stringify({ message: 'Not found' }));
  });
  providerServer.listen(0, '127.0.0.1');
  await once(providerServer, 'listening');
  providerOrigin = `http://127.0.0.1:${providerServer.address().port}`;

  const port = await freePort();
  serverOrigin = `http://127.0.0.1:${port}`;
  webProcess = spawn(process.execPath, [nextBinary, 'start', '-p', String(port), '--hostname', '127.0.0.1'], {
    cwd: webDirectory,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
      SUPABASE_URL: providerOrigin,
      NEXT_PUBLIC_SUPABASE_URL: providerOrigin,
      SUPABASE_ANON_KEY: 'synthetic-writing-e2e-key',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'synthetic-writing-e2e-key',
      DATABASE_URL: databaseUrl,
      DIRECT_URL: databaseUrl,
      LINGORA_APP_ORIGIN: serverOrigin,
      WRITING_SRS_ENABLED: 'true',
      WRITING_SRS_LEARNER_IDS: srsLearnerId,
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  webProcess.stderr.on('data', (chunk) => {
    const message = String(chunk);
    if (/error|failed|exception/i.test(message)) process.stderr.write(message);
  });
  await waitForServer(`${serverOrigin}/login`);
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
});

after(async () => {
  if (browser) await browser.close();
  if (webProcess && webProcess.exitCode === null) {
    webProcess.kill('SIGTERM');
    await Promise.race([once(webProcess, 'exit'), new Promise((resolve) => setTimeout(resolve, 3000))]);
    if (webProcess.exitCode === null) webProcess.kill('SIGKILL');
  }
  if (providerServer) await new Promise((resolve) => providerServer.close(resolve));
  if (database) {
    await database.$disconnect();
  }
});

test('production learner flow creates, grades, completes, and restarts a writing session', async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addCookies([learnerCookie(providerOrigin)]);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  try {
    await page.goto(`${serverOrigin}/learn/${fixture.ctxA}/${fixture.lesson}`);
    await page.locator('#startReadingBtn').waitFor({ state: 'visible' });
    await page.locator('#startReadingBtn').click();
    await page.locator('#lessonContentContainer').waitFor({ state: 'visible' });
    assert.equal(
      await page.locator('#lessonContentContainer').locator('#start-practice-btn-script-character').count(),
      1,
      `Writing practice CTA was not rendered. Page text: ${await page.locator('body').innerText()}`
    );
    await page.locator('#start-practice-btn-script-character').waitFor({ state: 'visible' });
    await page.locator('#start-practice-btn-script-character').click();

    await page.locator('#demo-to-trace-btn').click();
    await page.locator('#trace-to-freehand-btn').click();

    const drawAndSubmit = async () => {
      const canvas = page.locator('#freehand-canvas');
      const box = await canvas.boundingBox();
      assert.ok(box);
      await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.5, { steps: 8 });
      await page.mouse.up();
      await page.locator('#freehand-submit-btn').click();
      await page.locator('#attempt-score').waitFor({ state: 'visible' });
    };

    await drawAndSubmit();
    const firstSession = await database.writingSession.findFirst({
      where: { learnerId, contextId: fixture.ctxA, lessonId: fixture.lesson },
      orderBy: { startedAt: 'desc' },
    });
    assert.ok(firstSession);
    assert.equal(firstSession.status, 'ACTIVE');
    assert.equal(firstSession.graderVersion, 1);
    assert.equal(await database.writingAttempt.count({ where: { sessionId: firstSession.id } }), 1);

    const aliasResponse = await page.request.post(
      `${serverOrigin}/api/writing/sessions/${firstSession.id}/characters/${fixture.characterId}/attempts`,
      {
        headers: { Origin: serverOrigin },
        data: {
          characterId: fixture.characterId,
          requestId: randomUUID(),
          strokePoints: [[[0.1, 0.5], [0.9, 0.5]]],
        },
      }
    );
    assert.equal(aliasResponse.status(), 201, await aliasResponse.text());

    await page.locator('#complete-session-btn').click();
    await page.locator('#session-completed-notice').waitFor({ state: 'visible' });
    const completed = await database.writingSession.findUnique({ where: { id: firstSession.id } });
    assert.equal(completed.status, 'COMPLETED');
    assert.ok(completed.completedAt);
    assert.equal(await database.writingAttempt.count({ where: { sessionId: firstSession.id } }), 2);

    await page.locator('#retry-practice-btn').click();
    await drawAndSubmit();
    const sessions = await database.writingSession.findMany({
      where: { learnerId, contextId: fixture.ctxA, lessonId: fixture.lesson },
      orderBy: { startedAt: 'asc' },
    });
    assert.equal(sessions.length, 2);
    assert.notEqual(sessions[0].operationKey, sessions[1].operationKey);
    assert.equal(sessions[1].status, 'ACTIVE');
  } finally {
    await context.close();
  }
});

test('production Japanese learner flow keeps writing separate from lesson completion and unlocks only after core practice', async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addCookies([learnerCookie(providerOrigin)]);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  const firstLesson = japaneseFixture.lessons[0];
  const nextLesson = japaneseFixture.lessons[1];
  const hiraganaBlock = firstLesson.activeRevision.blocks.find((block) => block.blockKey === 'char_hiragana_i');
  assert.ok(hiraganaBlock);
  const expectedStrokeVersion = hiraganaBlock.content.snapshot.strokeVersion;

  try {
    await page.goto(`${serverOrigin}/home`);
    await page.locator(`#enterContextBtn-${japaneseContextId}`).click();
    await page.waitForURL(`${serverOrigin}/learn/${japaneseContextId}`);
    await page.locator(`#lessonLink-${firstLesson.id}`).waitFor({ state: 'visible' });
    await page.locator(`#lockedBtn-${nextLesson.id}`).waitFor({ state: 'visible' });

    await page.goto(`${serverOrigin}/learn/${japaneseContextId}/${nextLesson.id}`);
    await page.locator('#playerErrorBox').waitFor({ state: 'visible' });
    assert.match(await page.locator('#playerErrorBox').innerText(), /Bài học chưa mở khóa/);
    assert.equal(await page.locator('#startReadingBtn').count(), 0);

    await page.goto(`${serverOrigin}/learn/${japaneseContextId}`);
    await page.locator(`#lessonLink-${firstLesson.id}`).click();
    await page.waitForURL(`${serverOrigin}/learn/${japaneseContextId}/${firstLesson.id}`);
    await page.locator('#startReadingBtn').click();
    await page.locator('#lessonContentContainer').waitFor({ state: 'visible' });
    assert.equal((await page.locator('#character-glyph-char_hiragana_i').innerText()).trim(), 'い');
    await page.locator('#start-practice-btn-char_hiragana_i').click();
    await page.locator('#demo-to-trace-btn').waitFor({ state: 'visible' });
    await page.locator('#demo-to-trace-btn').click();
    await page.locator('#trace-to-freehand-btn').waitFor({ state: 'visible' });
    await page.locator('#trace-to-freehand-btn').click();

    const canvas = page.locator('#freehand-canvas');
    const box = await canvas.boundingBox();
    assert.ok(box);
    const drawStroke = async (points) => {
      await page.mouse.move(box.x + box.width * points[0][0], box.y + box.height * points[0][1]);
      await page.mouse.down();
      for (const [x, y] of points.slice(1)) {
        await page.mouse.move(box.x + box.width * x, box.y + box.height * y, { steps: 6 });
      }
      await page.mouse.up();
    };
    await drawStroke([[0.3, 0.25], [0.28, 0.5], [0.35, 0.75]]);
    await drawStroke([[0.7, 0.35], [0.72, 0.55]]);
    await page.locator('#freehand-submit-btn').click();
    await page.locator('#attempt-score').waitFor({ state: 'visible' });

    const rewardBefore = {
      xp: await database.xpEvent.count({ where: { learnerId } }),
      achievements: await database.learnerAchievement.count({ where: { learnerId } }),
      cards: await database.srsCard.count({ where: { learnerId } }),
    };
    const session = await database.writingSession.findFirst({
      where: { learnerId, contextId: japaneseContextId, lessonId: firstLesson.id },
      orderBy: { startedAt: 'desc' },
    });
    assert.ok(session);
    assert.equal(session.lessonRevisionId, firstLesson.activeRevision.id);
    assert.equal(session.characterId, japaneseFixture.characters.hiraganaI.id);
    assert.equal(session.sourceKey, 'block:char_hiragana_i');
    assert.equal(session.strokeVersion, expectedStrokeVersion);
    assert.equal(session.status, 'ACTIVE');
    const writingAttempt = await database.writingAttempt.findFirst({ where: { sessionId: session.id } });
    assert.ok(writingAttempt);
    assert.equal(writingAttempt.learnerId, learnerId);
    assert.equal(writingAttempt.characterId, japaneseFixture.characters.hiraganaI.id);

    await page.locator('#complete-session-btn').click();
    await page.locator('#session-completed-notice').waitFor({ state: 'visible' });

    assert.equal(await database.lessonAttempt.count({ where: { contextId: japaneseContextId, lessonId: firstLesson.id } }), 0);
    assert.equal(await database.lessonCompletion.count({ where: { contextId: japaneseContextId, lessonId: firstLesson.id } }), 0);
    assert.equal(await database.xpEvent.count({ where: { learnerId } }), rewardBefore.xp);
    assert.equal(await database.learnerAchievement.count({ where: { learnerId } }), rewardBefore.achievements);
    assert.equal(await database.srsCard.count({ where: { learnerId } }), rewardBefore.cards);
    const reading = await database.lessonConsumption.findFirst({
      where: { contextId: japaneseContextId, lessonId: firstLesson.id },
    });
    assert.ok(reading);
    assert.equal(reading.completedAt, null);

    await page.locator('#close-completed-btn').click();
    await page.goto(`${serverOrigin}/learn/${japaneseContextId}`);
    await page.locator(`#lockedBtn-${nextLesson.id}`).waitFor({ state: 'visible' });

    await page.goto(`${serverOrigin}/learn/${japaneseContextId}/${firstLesson.id}`);
    await page.locator('#startPracticeBtn').click();
    await page.locator('#activeExerciseCard').waitFor({ state: 'visible' });
    await page.locator('input[name="mcq-option"][value="opt_i"]').check();
    await page.locator('#submitResponseBtn').click();
    await page.locator('#finalizePracticeBtn').waitFor({ state: 'visible' });
    await page.locator('#finalizePracticeBtn').click();
    await page.locator('#practiceCompletionSummary').waitFor({ state: 'visible' });

    const completion = await database.lessonCompletion.findFirst({
      where: { contextId: japaneseContextId, lessonId: firstLesson.id },
    });
    assert.ok(completion);
    assert.ok(await database.xpEvent.count({ where: { learnerId } }) > rewardBefore.xp);

    await page.goto(`${serverOrigin}/learn/${japaneseContextId}`);
    await page.locator(`#lessonLink-${nextLesson.id}`).waitFor({ state: 'visible' });
    await page.goto(`${serverOrigin}/learn/${japaneseContextId}/${nextLesson.id}`);
    await page.locator('#startReadingBtn').waitFor({ state: 'visible' });
    await page.locator('#startReadingBtn').click();
    await page.locator('#lessonContentContainer').waitFor({ state: 'visible' });
    assert.equal((await page.locator('#character-glyph-char_katakana_a').innerText()).trim(), 'ア');
  } finally {
    await context.close();
  }
});

function createToneWav() {
  const sampleRate = 24000;
  const durationSeconds = 0.8;
  const sampleCount = sampleRate * durationSeconds;
  const wav = Buffer.alloc(44 + sampleCount * 2);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(sampleCount * 2, 40);
  let phase = 0;
  for (let index = 0; index < sampleCount; index++) {
    const time = index / sampleRate;
    const frequency = time < 0.08 ? 210 + (time / 0.08) * 50 : 260;
    phase += (2 * Math.PI * frequency) / sampleRate;
    const envelope = Math.min(1, time * 40, (durationSeconds - time) * 20);
    const formants = time < 0.08
      ? [[280, 120, 1], [1050, 250, 0.5], [2500, 500, 0.1]]
      : [[800, 130, 1], [1250, 180, 0.7], [2600, 350, 0.25]];
    let voiced = 0;
    let normalization = 0;
    for (let harmonic = 1; harmonic <= 30; harmonic++) {
      const harmonicFrequency = harmonic * frequency;
      const formantGain = formants.reduce((sum, [center, bandwidth, gain]) => {
        const distance = (harmonicFrequency - center) / bandwidth;
        return sum + gain * Math.exp(-0.5 * distance * distance);
      }, 0) / (harmonic * harmonic);
      voiced += formantGain * Math.sin(harmonic * phase);
      normalization += formantGain;
    }
    const sample = envelope * 0.45 * (voiced / Math.max(normalization, 0.001));
    wav.writeInt16LE(Math.round(sample * 32767), 44 + index * 2);
  }
  return wav;
}

test('production Chinese learner flow plays local tone audio, grades Hanzi writing, and unlocks by core completion', async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addCookies([learnerCookie(providerOrigin, chineseAccessToken)]);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  await page.route(CHINESE_AUDIO_FIXTURE_URL, (route) => route.fulfill({
    status: 200,
    contentType: 'audio/wav',
    body: createToneWav(),
  }));

  const pinyinLesson = chineseFixture.lessons[0];
  const firstHanziLesson = chineseFixture.lessons[1];
  const componentLesson = chineseFixture.lessons[2];
  const hanziBlock = firstHanziLesson.activeRevision.blocks.find((block) => block.blockKey === 'zh_char_one');
  assert.ok(hanziBlock);

  try {
    await page.goto(`${serverOrigin}/home`);
    await page.locator(`#enterContextBtn-${chineseContextId}`).click();
    await page.waitForURL(`${serverOrigin}/learn/${chineseContextId}`);
    await page.locator(`#lessonLink-${pinyinLesson.id}`).waitFor({ state: 'visible' });
    await page.locator(`#lockedBtn-${firstHanziLesson.id}`).waitFor({ state: 'visible' });

    await page.goto(`${serverOrigin}/learn/${chineseContextId}/${firstHanziLesson.id}`);
    await page.locator('#playerErrorBox').waitFor({ state: 'visible' });
    assert.match(await page.locator('#playerErrorBox').innerText(), /Bài học chưa mở khóa/);

    await page.goto(`${serverOrigin}/learn/${chineseContextId}/${pinyinLesson.id}`);
    await page.locator('#startReadingBtn').click();
    await page.locator('#lessonContentContainer').waitFor({ state: 'visible' });
    const pinyinText = await page.locator('#lessonContentContainer').innerText();
    for (const tone of ['mā', 'má', 'mǎ', 'mà']) assert.ok(pinyinText.includes(tone));
    const audio = page.locator('#lessonContentContainer audio').first();
    await audio.waitFor({ state: 'visible' });
    assert.equal(await audio.getAttribute('src'), CHINESE_AUDIO_FIXTURE_URL);
    const audioBox = await audio.boundingBox();
    assert.ok(audioBox);
    await page.mouse.click(audioBox.x + 24, audioBox.y + audioBox.height / 2);
    await page.waitForFunction(() => {
      const player = document.querySelector('#lessonContentContainer audio');
      return player && !player.paused && player.currentTime > 0;
    }, null, { timeout: 5000 });

    await page.locator('#startPracticeBtn').click();
    await page.locator('input[name="mcq-option"][value="opt_third"]').check();
    await page.locator('#submitResponseBtn').click();
    await page.locator('#finalizePracticeBtn').waitFor({ state: 'visible' });
    await page.locator('#finalizePracticeBtn').click();
    await page.locator('#practiceCompletionSummary').waitFor({ state: 'visible' });
    const pinyinCompletion = await database.lessonCompletion.findUnique({
      where: { contextId_lessonId: { contextId: chineseContextId, lessonId: pinyinLesson.id } },
    });
    assert.ok(pinyinCompletion);

    await page.goto(`${serverOrigin}/learn/${chineseContextId}`);
    await page.locator(`#lessonLink-${firstHanziLesson.id}`).click();
    await page.locator('#startReadingBtn').click();
    await page.locator('#character-glyph-zh_char_one').waitFor({ state: 'visible' });
    assert.equal((await page.locator('#character-glyph-zh_char_one').innerText()).trim(), '一');
    assert.match(await page.locator('#character-reading-zh_char_one').innerText(), /yī/);
    assert.match(await page.locator('#character-meaning-zh_char_one').innerText(), /một/);
    assert.match(await page.locator('#character-strokes-zh_char_one').innerText(), /1 nét/);

    const rewardBeforeWriting = await database.xpEvent.count({ where: { learnerId: chineseFixture.learner } });
    await page.locator('#start-practice-btn-zh_char_one').click();
    await page.locator('#demo-to-trace-btn').waitFor({ state: 'visible' });
    await page.locator('#demo-to-trace-btn').click();
    await page.locator('#trace-to-freehand-btn').waitFor({ state: 'visible' });
    await page.locator('#trace-to-freehand-btn').click();
    const canvas = page.locator('#freehand-canvas');
    const box = await canvas.boundingBox();
    assert.ok(box);
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5, { steps: 8 });
    await page.mouse.up();
    await page.locator('#freehand-submit-btn').click();
    await page.locator('#attempt-score').waitFor({ state: 'visible' });

    const session = await database.writingSession.findFirst({
      where: { learnerId: chineseFixture.learner, contextId: chineseContextId, lessonId: firstHanziLesson.id },
      orderBy: { startedAt: 'desc' },
    });
    assert.ok(session);
    assert.equal(session.lessonRevisionId, firstHanziLesson.activeRevision.id);
    assert.equal(session.characterId, chineseFixture.characters.one.id);
    assert.equal(session.sourceKey, 'block:zh_char_one');
    assert.equal(session.strokeVersion, hanziBlock.content.snapshot.strokeVersion);
    const writingAttempt = await database.writingAttempt.findFirst({ where: { sessionId: session.id } });
    assert.ok(writingAttempt);
    assert.equal(writingAttempt.learnerId, chineseFixture.learner);
    assert.equal(writingAttempt.characterId, chineseFixture.characters.one.id);

    await page.locator('#complete-session-btn').click();
    await page.locator('#session-completed-notice').waitFor({ state: 'visible' });
    assert.equal(await database.lessonCompletion.count({ where: { contextId: chineseContextId, lessonId: firstHanziLesson.id } }), 0);
    assert.equal(await database.xpEvent.count({ where: { learnerId: chineseFixture.learner } }), rewardBeforeWriting);
    const reading = await database.lessonConsumption.findFirst({
      where: { contextId: chineseContextId, lessonId: firstHanziLesson.id },
    });
    assert.ok(reading);
    assert.equal(reading.completedAt, null);

    await page.locator('#close-completed-btn').click();
    await page.goto(`${serverOrigin}/learn/${chineseContextId}`);
    await page.locator(`#lockedBtn-${componentLesson.id}`).waitFor({ state: 'visible' });
    await page.goto(`${serverOrigin}/learn/${chineseContextId}/${componentLesson.id}`);
    await page.locator('#playerErrorBox').waitFor({ state: 'visible' });

    await page.goto(`${serverOrigin}/learn/${chineseContextId}/${firstHanziLesson.id}`);
    await page.locator('#startPracticeBtn').click();
    await page.locator('input[name="mcq-option"][value="opt_one"]').check();
    await page.locator('#submitResponseBtn').click();
    await page.locator('#finalizePracticeBtn').waitFor({ state: 'visible' });
    await page.locator('#finalizePracticeBtn').click();
    await page.locator('#practiceCompletionSummary').waitFor({ state: 'visible' });
    assert.ok(await database.lessonCompletion.findUnique({
      where: { contextId_lessonId: { contextId: chineseContextId, lessonId: firstHanziLesson.id } },
    }));
    assert.ok(await database.xpEvent.count({ where: { learnerId: chineseFixture.learner } }) > rewardBeforeWriting);

    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`${serverOrigin}/learn/${chineseContextId}/${pinyinLesson.id}`);
      const pageWidth = await page.evaluate(() => ({ viewport: window.innerWidth, content: document.documentElement.scrollWidth }));
      assert.ok(pageWidth.content <= pageWidth.viewport, `Pinyin lesson overflows at ${width}px: ${JSON.stringify(pageWidth)}`);
      assert.equal(await page.locator('#lessonContentContainer audio').isVisible(), true);
      assert.ok((await page.locator('#lessonContentContainer').innerText()).includes('mǎ'));

      await page.goto(`${serverOrigin}/learn/${chineseContextId}/${firstHanziLesson.id}`);
      await page.locator('#lessonContentContainer').waitFor({ state: 'visible' });
      await page.locator('#start-practice-btn-zh_char_one').click();
      await page.locator('#writingPracticeModal').waitFor({ state: 'visible' });
      const modalWidth = await page.locator('#writingPracticeModal > div').evaluate((element) => element.getBoundingClientRect().width);
      assert.ok(modalWidth <= width, `Writing modal overflows at ${width}px: ${modalWidth}px`);
      await page.keyboard.press('Escape');
      await page.locator('#writingPracticeModal').waitFor({ state: 'detached' });
    }

    await page.goto(`${serverOrigin}/learn/${chineseContextId}`);
    await page.locator(`#lessonLink-${componentLesson.id}`).waitFor({ state: 'visible' });
    await page.goto(`${serverOrigin}/learn/${chineseContextId}/${componentLesson.id}`);
    await page.locator('#startReadingBtn').waitFor({ state: 'visible' });
    await page.locator('#startReadingBtn').click();
    await page.locator('#character-glyph-zh_char_mouth').waitFor({ state: 'visible' });
    assert.equal((await page.locator('#character-glyph-zh_char_mouth').innerText()).trim(), '口');
  } finally {
    await context.close();
  }
});

test('production review flow: published Chinese 人口 writing SRS, attempt secrecy, lost-response retry, reveal, four ratings, and XP', async () => {
  const renKouLink = await database.lessonVocabularyLink.findFirst({
    where: { vocabularyId: chineseFixture.vocabulary.population.id },
    include: { lessonRevision: true },
  });
  assert.ok(renKouLink, 'Chinese 人口 lessonVocabularyLink must exist');
  assert.equal(renKouLink.lessonRevision.status, 'PUBLISHED');

  const futureMeaningDue = new Date(Date.now() + 86_400_000 * 7);
  const card = await database.srsCard.create({
    data: {
      learnerId: srsLearnerId,
      vocabularyId: chineseFixture.vocabulary.population.id,
      stage: 1,
      dueAt: futureMeaningDue,
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: renKouLink.id,
    },
  });

  const pastWritingDue = new Date(Date.now() - 3600_000);
  await database.srsMemoryState.create({
    data: {
      cardId: card.id,
      skill: 'WRITING',
      schedulerVersion: 'FSRS_6_TS_FSRS_5_4_2',
      state: 1,
      stability: 1.0,
      difficulty: 5.0,
      dueAt: pastWritingDue,
      count: 0,
      lapse: 0,
      scheduledDays: 1,
      learningSteps: 0,
    },
  });

  const xpBefore = await database.xpEvent.count({ where: { learnerId: srsLearnerId } });

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addCookies([learnerCookie(providerOrigin, srsAccessToken)]);
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  const screenshotDir = process.env.EXT03_SCREENSHOT_DIR;
  if (screenshotDir) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  try {
    await page.goto(`${serverOrigin}/review`);
    await page.locator('#startReviewBtn').waitFor({ state: 'visible' });
    const startResponsePromise = page.waitForResponse(response =>
      response.url().endsWith('/api/srs/sessions') && response.request().method() === 'POST',
    );
    await page.locator('#startReviewBtn').click();
    const startResponse = await startResponsePromise;
    const startBody = await startResponse.json();
    const startPrompt = JSON.stringify(startBody.data.currentItem);
    assert.equal(startPrompt.includes('人口'), false, 'API prompt must not contain the target word');
    assert.equal(startPrompt.includes('人'), false, 'API prompt must not contain the first glyph');
    assert.equal(startPrompt.includes('口'), false, 'API prompt must not contain the second glyph');

    await page.locator('#srsReviewCard').waitFor({ state: 'visible' });

    // Assert pre-reveal prompt response secrecy
    const canonicalDiv = page.locator('.srs-canonical-form');
    await canonicalDiv.waitFor({ state: 'visible' });
    const promptText = (await canonicalDiv.innerText()).trim();
    assert.ok(promptText.includes('dân số') || promptText.includes('population'), `Prompt text must show meaning: ${promptText}`);
    assert.equal(promptText.includes('人口'), false, 'Prompt text must NOT echo 人口');
    assert.equal(promptText.includes('人'), false, 'Prompt text must NOT echo 人');
    assert.equal(promptText.includes('口'), false, 'Prompt text must NOT echo 口');

    // Canvas must be visible
    const canvas = page.locator('#srs-writing-canvas');
    await canvas.waitFor({ state: 'visible' });
    const box = await canvas.boundingBox();
    assert.ok(box);
    if (screenshotDir) {
      await page.screenshot({
        path: path.join(screenshotDir, 'ext03-writing-srs-prompt-desktop.png'),
        fullPage: true,
      });
    }

    // Setup network interception: abort the first response to simulate lost-response after server commits
    let interceptedOnce = false;
    let serverResponseStatusCode = 0;
    let firstAttemptPayload;
    let firstAttemptBody;
    await page.route('**/api/srs/sessions/*/writing-attempts', async (route) => {
      if (!interceptedOnce) {
        interceptedOnce = true;
        firstAttemptPayload = route.request().postDataJSON();
        const response = await route.fetch();
        serverResponseStatusCode = response.status();
        firstAttemptBody = await response.json();
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    // Draw stroke 1 for 人
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.8, { steps: 8 });
    await page.mouse.up();
    await page.locator('#srs-writing-submit:not([disabled])').waitFor({ state: 'visible' });

    // Submit attempt 1
    await page.locator('#srs-writing-submit').click();

    // Lost response causes browser to show retry button
    await page.locator('#retryReviewBtn').waitFor({ state: 'visible' });
    assert.equal(serverResponseStatusCode, 200, 'Server must have processed and returned 200 before response was lost');
    assert.equal(firstAttemptPayload.characterNumber, 1);
    const nextPrompt = JSON.stringify(firstAttemptBody.data.currentItem);
    assert.equal(nextPrompt.includes('人'), false, 'API must hide both target glyphs between attempts');
    assert.equal(nextPrompt.includes('口'), false, 'API must hide both target glyphs between attempts');

    // Check database: server committed the attempt receipt once
    const sessionInDb = await database.srsReviewSession.findFirst({
      where: { learnerId: srsLearnerId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    assert.ok(sessionInDb);
    const queueEntryBeforeRetry = sessionInDb.cardIds.find(e => typeof e === 'object' && e.cardId === card.id);
    assert.ok(queueEntryBeforeRetry);
    assert.equal(queueEntryBeforeRetry.attempts.length, 1);
    const firstReceiptEvidenceId = queueEntryBeforeRetry.attempts[0].evidenceId;

    // Click retry: browser replays exact same payload
    await page.locator('#retryReviewBtn').click();

    // After successful replay, session advances to character 2
    await page.locator('#retryReviewBtn').waitFor({ state: 'hidden' });
    await page.locator('text=Ký tự 2/').waitFor({ state: 'visible' });
    await page.locator('#srs-writing-canvas').waitFor({ state: 'visible' });

    // Verify retry added NO duplicate receipt in DB!
    const sessionAfterRetry = await database.srsReviewSession.findUniqueOrThrow({ where: { id: sessionInDb.id } });
    const queueEntryAfterRetry = sessionAfterRetry.cardIds.find(e => typeof e === 'object' && e.cardId === card.id);
    assert.equal(queueEntryAfterRetry.attempts.length, 1, 'Retry must NOT add a duplicate receipt');
    assert.equal(queueEntryAfterRetry.attempts[0].evidenceId, firstReceiptEvidenceId, 'Receipt evidence ID must be identical');

    // Draw for character 2 (口)
    const box2 = await page.locator('#srs-writing-canvas').boundingBox();
    assert.ok(box2);
    await page.mouse.move(box2.x + box2.width * 0.2, box2.y + box2.height * 0.2);
    await page.mouse.down();
    await page.mouse.move(box2.x + box2.width * 0.8, box2.y + box2.height * 0.2, { steps: 5 });
    await page.mouse.move(box2.x + box2.width * 0.8, box2.y + box2.height * 0.8, { steps: 5 });
    await page.mouse.up();
    await page.locator('#srs-writing-submit:not([disabled])').waitFor({ state: 'visible' });

    // Submit attempt 2
    const secondAttemptResponsePromise = page.waitForResponse(response =>
      response.url().includes('/writing-attempts') && response.request().method() === 'POST',
    );
    await page.locator('#srs-writing-submit').click();
    const secondAttemptResponse = await secondAttemptResponsePromise;
    assert.equal(secondAttemptResponse.status(), 200);
    assert.equal(secondAttemptResponse.request().postDataJSON().characterNumber, 2);
    const secondAttemptBody = await secondAttemptResponse.json();
    assert.deepEqual(
      secondAttemptBody.data.currentItem.writing.revealedCharacters.map(character => character.glyph),
      ['人', '口'],
    );

    // Both characters graded -> revealed feedback
    await page.locator('#srsAnswerSection').waitFor({ state: 'visible' });
    const answerText = await page.locator('#srsAnswerSection').innerText();
    assert.ok(answerText.includes('人'), 'Revealed view must show 人');
    assert.ok(answerText.includes('口'), 'Revealed view must show 口');
    assert.ok(answerText.includes('Điểm'), 'Revealed view must show scores');
    const sessionAfterSecondAttempt = await database.srsReviewSession.findUniqueOrThrow({ where: { id: sessionInDb.id } });
    const entryAfterSecondAttempt = sessionAfterSecondAttempt.cardIds.find(entry => typeof entry === 'object' && entry.cardId === card.id);
    assert.equal(entryAfterSecondAttempt.attempts.length, 2);
    assert.equal(entryAfterSecondAttempt.attempts[0].characterNumber, 1);
    assert.equal(entryAfterSecondAttempt.attempts[1].characterNumber, 2);

    // Four explicit rating buttons must be visible
    await page.locator('#rateWritingAGAINBtn').waitFor({ state: 'visible' });
    await page.locator('#rateWritingHARDBtn').waitFor({ state: 'visible' });
    await page.locator('#rateWritingGOODBtn').waitFor({ state: 'visible' });
    await page.locator('#rateWritingEASYBtn').waitFor({ state: 'visible' });
    if (screenshotDir) {
      await page.screenshot({
        path: path.join(screenshotDir, 'ext03-writing-srs-revealed-desktop.png'),
        fullPage: true,
      });
    }

    // Click GOOD rating
    await page.locator('#rateWritingGOODBtn').click();

    // Session completes
    await page.locator('#srsDoneBox').waitFor({ state: 'visible' });

    // Verify database state:
    // 1. One srsReviewOperation recorded
    const reviewOps = await database.srsReviewOperation.findMany({
      where: { learnerId: srsLearnerId, cardId: card.id },
    });
    assert.equal(reviewOps.length, 1);
    assert.equal(reviewOps[0].skill, 'WRITING');
    assert.equal(reviewOps[0].rating, 'GOOD');
    assert.equal(reviewOps[0].schedulerVersion, 'FSRS_6_TS_FSRS_5_4_2');

    // 2. WRITING srsMemoryState updated
    const writingStateAfter = await database.srsMemoryState.findUniqueOrThrow({
      where: { cardId_skill: { cardId: card.id, skill: 'WRITING' } },
    });
    assert.equal(writingStateAfter.count, 1);
    assert.ok(writingStateAfter.dueAt.getTime() > Date.now());

    // 3. SrsCard.dueAt (MEANING) is UNCHANGED (+7 days)
    const cardAfter = await database.srsCard.findUniqueOrThrow({ where: { id: card.id } });
    assert.equal(cardAfter.dueAt.getTime(), futureMeaningDue.getTime());

    // 4. Exactly 1 SRS XP event awarded
    const xpAfter = await database.xpEvent.count({
      where: { learnerId: srsLearnerId, eventType: 'SRS_REVIEW' },
    });
    assert.equal(xpAfter - xpBefore, 1);
  } finally {
    await context.close();
  }
});

test('EXT-03 E2E: non-allowlisted learner receives 404 on direct writing-attempts POST, and mobile (375x812) renders writing SRS cleanly', async () => {
  // Ca 1 over real HTTP: learnerId is NOT in WRITING_SRS_LEARNER_IDS
  const nonAllowlistedCard = await database.srsCard.create({
    data: {
      learnerId,
      vocabularyId: fixture.vocabId,
      stage: 1,
      dueAt: new Date(Date.now() - 3600_000),
      enrollmentSource: 'OPTIONAL_CHOICE',
      sourceLessonVocabularyId: fixture.vocabLinkId,
    },
  });

  const desktopNonAllowlisted = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await desktopNonAllowlisted.addCookies([learnerCookie(providerOrigin, accessToken)]);
  const nonAllowlistedPage = await desktopNonAllowlisted.newPage();
  nonAllowlistedPage.setDefaultTimeout(15000);
  try {
    const createSessionRes = await nonAllowlistedPage.request.post(`${serverOrigin}/api/srs/sessions`, {
      headers: { Origin: serverOrigin },
      data: { limit: 10 },
    });
    assert.equal(createSessionRes.status(), 201, await createSessionRes.text());
    const createSessionBody = await createSessionRes.json();
    assert.equal(createSessionBody.data.currentItem.canonicalForm, 'Hello');
    assert.equal('skill' in createSessionBody.data.currentItem, false);
    assert.equal(
      await database.srsMemoryState.count({ where: { cardId: nonAllowlistedCard.id, skill: 'WRITING' } }),
      0,
    );

    const directAttemptRes = await nonAllowlistedPage.request.post(
      `${serverOrigin}/api/srs/sessions/${createSessionBody.data.sessionId}/writing-attempts`,
      {
        headers: { Origin: serverOrigin },
        data: {
          cardId: nonAllowlistedCard.id,
          operationKey: randomUUID(),
          characterNumber: 1,
          candidateStrokes: [{ points: [[0.1, 0.5], [0.9, 0.5]] }],
        },
      },
    );
    assert.equal(directAttemptRes.status(), 404, await directAttemptRes.text());
    const directAttemptBody = await directAttemptRes.json();
    assert.equal(directAttemptBody.error.code, 'NOT_FOUND');
  } finally {
    await desktopNonAllowlisted.close();
  }

  // Mobile 375x812 viewport check + screenshot for allowlisted srsLearnerId
  const screenshotDir = process.env.EXT03_SCREENSHOT_DIR;
  if (screenshotDir) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  const writingState = await database.srsMemoryState.findFirstOrThrow({
    where: {
      skill: 'WRITING',
      card: { learnerId: srsLearnerId },
    },
  });
  await database.srsMemoryState.update({
    where: { id: writingState.id },
    data: { dueAt: new Date(Date.now() - 3600_000) },
  });

  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await mobileContext.addCookies([learnerCookie(providerOrigin, srsAccessToken)]);
  const mobilePage = await mobileContext.newPage();
  mobilePage.setDefaultTimeout(20000);

  try {
    await mobilePage.goto(`${serverOrigin}/review`);
    await mobilePage.locator('#startReviewBtn').waitFor({ state: 'visible' });
    await mobilePage.locator('#startReviewBtn').click();

    await mobilePage.locator('#srsReviewCard').waitFor({ state: 'visible' });
    await mobilePage.locator('#srs-writing-canvas').waitFor({ state: 'visible' });

    const promptOverflow = await mobilePage.evaluate(() => ({
      viewport: window.innerWidth,
      content: document.documentElement.scrollWidth,
    }));
    assert.ok(
      promptOverflow.content <= promptOverflow.viewport,
      `Writing SRS prompt overflows mobile 375px: ${JSON.stringify(promptOverflow)}`,
    );
    if (screenshotDir) {
      await mobilePage.screenshot({
        path: path.join(screenshotDir, 'ext03-writing-srs-prompt-mobile.png'),
        fullPage: true,
      });
    }

    // Draw character 1 (人) and character 2 (口)
    for (let step = 1; step <= 2; step++) {
      const box = await mobilePage.locator('#srs-writing-canvas').boundingBox();
      assert.ok(box);
      await mobilePage.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3);
      await mobilePage.mouse.down();
      await mobilePage.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.7, { steps: 6 });
      await mobilePage.mouse.up();
      await mobilePage.locator('#srs-writing-submit:not([disabled])').waitFor({ state: 'visible' });
      await mobilePage.locator('#srs-writing-submit').click();
      if (step === 1) {
        await mobilePage.locator('text=Ký tự 2/').waitFor({ state: 'visible' });
      }
    }

    await mobilePage.locator('#srsAnswerSection').waitFor({ state: 'visible' });
    await mobilePage.locator('#rateWritingEASYBtn').waitFor({ state: 'visible' });

    const revealedOverflow = await mobilePage.evaluate(() => ({
      viewport: window.innerWidth,
      content: document.documentElement.scrollWidth,
    }));
    assert.ok(
      revealedOverflow.content <= revealedOverflow.viewport,
      `Writing SRS revealed screen overflows mobile 375px: ${JSON.stringify(revealedOverflow)}`,
    );
    if (screenshotDir) {
      await mobilePage.screenshot({
        path: path.join(screenshotDir, 'ext03-writing-srs-revealed-mobile.png'),
        fullPage: true,
      });
    }

    await mobilePage.locator('#rateWritingEASYBtn').click();
    await mobilePage.locator('#srsDoneBox').waitFor({ state: 'visible' });
  } finally {
    await mobileContext.close();
  }
});
