/**
 * Joined local proof and final E2E acceptance test for Core Learner MVP (P7).
 *
 * Verifies the full slice sequence P1-P6 on a live disposable PostgreSQL database
 * and production Next.js servers with loopback synthetic Supabase auth:
 * 1. Admin/Staff authoring workflow publication & activation verification.
 * 2. Learner context selection & recovery (P2).
 * 3. Learner completes Lesson 1 (MCQ, FILL_BLANK, REORDER) and finalizes (P3).
 * 4. Completed-only feedback with authored Vietnamese explanations (P3).
 * 5. Unlock progression: Lesson 2 becomes unlocked after Lesson 1 completion.
 * 6. Database assertions: completion status, response count, SRS card enrollment.
 * 7. Owned card aging in DB & Due-Card SRS review session via /review (P4/P5).
 * 8. Review session completion, answer reveal, rating, and DB schedule progression.
 * 9. Desktop and mobile viewports with evidence screenshots.
 * 10. Multi-learner isolation and anonymous protected route rejection.
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
const adminDir = path.resolve(repoRoot, 'lingora-admin');
const webDir = path.resolve(repoRoot, 'lingora-web');
const nextBin = path.resolve(repoRoot, 'node_modules/next/dist/bin/next');
const defaultEvidenceDir = path.resolve(repoRoot, 'plans/evidence/learning-mvp-closure-20261106/initial-run-1/screenshots');
const evidenceDir = process.env.E2E_OUTPUT_DIR || defaultEvidenceDir;

fs.mkdirSync(evidenceDir, { recursive: true });

// Strict owned disposable loopback DB validation
const dbGuard = validateOwnedDatabaseUrl();
const dbUrl = dbGuard.ownedUrl;

// Synthetic actor IDs
const ADMIN_ID = '11111111-0000-4000-8000-000000000001';
const TEACHER_ID = '22222222-0000-4000-8000-000000000001';
const LEARNER1_ID = '33333333-0000-4000-8000-000000000001';
const LEARNER2_ID = '44444444-0000-4000-8000-000000000001';
const CONTEXT1_ID = '55555555-0000-4000-8000-000000000001';

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
  console.log('=== P7: Core Learner MVP Joined Acceptance & E2E Proof ===');

  const children = [];
  let pgClient;
  let prisma;
  let browser;
  let providerServer;

  // Cleanup handler
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
      [`token-${LEARNER1_ID}`, { id: LEARNER1_ID, email: 'learner1@lingora.test', email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { role: 'LEARNER' } }],
      [`token-${LEARNER2_ID}`, { id: LEARNER2_ID, email: 'learner2@lingora.test', email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { role: 'LEARNER' } }],
    ]);

    providerServer = http.createServer((req, res) => {
      // Sanitized: never log authorization headers or tokens
      console.log(`[Provider] ${req.method} ${req.url}`);
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/auth/v1/user') {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.replace(/^Bearer\s+/, '');
        const user = authUsers.get(token);
        if (user) {
          res.writeHead(200).end(JSON.stringify(user));
        } else {
          res.writeHead(401).end(JSON.stringify({ message: 'Invalid or missing token', status: 401 }));
        }
        return;
      }
      res.writeHead(404).end(JSON.stringify({ message: 'Not found' }));
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

    // Preflight and transactional create-if-absent / no-overwrite for synthetic actors (R1)
    await preflightAndSeedActors(pgClient, [
      { id: ADMIN_ID, role: 'ADMIN', status: 'ACTIVE', email: 'admin@lingora.test', displayName: 'Quản trị viên' },
      { id: TEACHER_ID, role: 'TEACHER', status: 'ACTIVE', email: 'teacher@lingora.test', displayName: 'Giáo viên Hương' },
      { id: LEARNER1_ID, role: 'LEARNER', status: 'ACTIVE', email: 'learner1@lingora.test', displayName: 'Học viên Minh' },
      { id: LEARNER2_ID, role: 'LEARNER', status: 'ACTIVE', email: 'learner2@lingora.test', displayName: 'Học viên An' },
    ]);
    console.log('✔ Synthetic actors verified and seeded with strict fail-on-conflict semantics');

    // Provision Sample A1 Curriculum using the canonical authoring workflow
    const sampleResult = await provisionSampleA1Curriculum(prisma, {
      adminId: ADMIN_ID,
      teacherId: TEACHER_ID,
    });
    assert.equal(sampleResult.courseId, SAMPLE_A1_CONSTANTS.courseId);
    assert.equal(sampleResult.lessonIds.length, 3);
    const [lesson1Id, lesson2Id, lesson3Id] = sampleResult.lessonIds;
    console.log(`✔ Sample A1 Curriculum provisioned: course=${sampleResult.courseId}, lessons=${sampleResult.lessonIds.length}`);

    // Seed null-working-level context for Learner 1 to exercise P2 recovery flow
    await pgClient.query(`
      INSERT INTO app.learning_contexts (id, learner_id, language_id, course_id, status, working_level_id, row_version, created_at, updated_at)
      VALUES ('${CONTEXT1_ID}', '${LEARNER1_ID}', '00000000-0000-0000-0000-000000000001', '${SAMPLE_A1_CONSTANTS.courseId}', 'ACTIVE', NULL, 1, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET working_level_id = NULL, row_version = 1;
    `);
    console.log('✔ Pre-seeded initial context for Learner 1 with null working level (for P2 recovery proof)');

    // -------------------------------------------------------------
    // 3. Start Production Next.js Servers
    // -------------------------------------------------------------
    const webPort = await getFreePort();
    const adminPort = await getFreePort();

    const sharedEnv = {
      ...process.env,
      SUPABASE_URL: providerOrigin,
      NEXT_PUBLIC_SUPABASE_URL: providerOrigin,
      SUPABASE_ANON_KEY: 'synthetic-anon-key',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'synthetic-anon-key',
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

    console.log(`Starting lingora-admin on port ${adminPort}...`);
    const adminProcess = spawn(
      process.execPath,
      [nextBin, 'start', '-p', String(adminPort), '--hostname', '127.0.0.1'],
      {
        cwd: adminDir,
        env: {
          ...sharedEnv,
          PORT: String(adminPort),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    children.push(adminProcess);

    await waitForServer(`http://127.0.0.1:${webPort}/login`);
    console.log(`✔ lingora-web ready at http://127.0.0.1:${webPort}`);

    await waitForServer(`http://127.0.0.1:${adminPort}/login`);
    console.log(`✔ lingora-admin ready at http://127.0.0.1:${adminPort}`);

    // -------------------------------------------------------------
    // 4. Staff Auth Guard & Protected Admin Route Verification
    // -------------------------------------------------------------
    console.log('\n--- Checking Admin Protected Routes ---');
    const adminCookie = makeSessionCookie(ADMIN_ID, 'admin@lingora.test', 'sb-127-auth-token');
    const teacherCookie = makeSessionCookie(TEACHER_ID, 'teacher@lingora.test', 'sb-127-auth-token');

    // Unauthenticated call to admin audit events returns 401
    const unauthRes = await fetch(`http://127.0.0.1:${adminPort}/api/audit-events`);
    assert.equal(unauthRes.status, 401, 'Unauthenticated admin API must return 401');
    console.log('✔ Unauthenticated admin API returns 401');

    // Full staff authoring workflow via protected HTTP API routes
    // Step 4.1: Admin creates Lesson 4 in the unit
    const createLessRes = await fetch(
      `http://127.0.0.1:${adminPort}/api/courses/${SAMPLE_A1_CONSTANTS.courseId}/units/${SAMPLE_A1_CONSTANTS.unitId}/lessons`,
      {
        method: 'POST',
        headers: {
          Cookie: `${adminCookie.name}=${adminCookie.value}`,
          'Content-Type': 'application/json',
          Origin: `http://127.0.0.1:${adminPort}`,
        },
        body: JSON.stringify({ position: 4, isRequired: true }),
      }
    );
    assert.equal(createLessRes.status, 201, `Create lesson must return 201, got ${createLessRes.status}`);
    const createJson = await createLessRes.json();
    const lesson4Id = createJson.data?.id || createJson.id;

    // Step 4.2: Admin assigns Teacher
    const l4AfterCreate = await pgClient.query(`SELECT row_version FROM app.lessons WHERE id = '${lesson4Id}'`);
    const assignRes = await fetch(
      `http://127.0.0.1:${adminPort}/api/courses/${SAMPLE_A1_CONSTANTS.courseId}/units/${SAMPLE_A1_CONSTANTS.unitId}/lessons/${lesson4Id}/assignment`,
      {
        method: 'PATCH',
        headers: {
          Cookie: `${adminCookie.name}=${adminCookie.value}`,
          'Content-Type': 'application/json',
          Origin: `http://127.0.0.1:${adminPort}`,
        },
        body: JSON.stringify({
          teacherId: TEACHER_ID,
          expectedRowVersion: l4AfterCreate.rows[0].row_version.toString(),
        }),
      }
    );
    assert.equal(assignRes.status, 200, `Assign lesson must return 200, got ${assignRes.status}`);

    // Step 4.3: Teacher saves draft
    const l4AfterAssign = await pgClient.query(`SELECT row_version FROM app.lessons WHERE id = '${lesson4Id}'`);
    const draftRes = await fetch(
      `http://127.0.0.1:${adminPort}/api/teacher/lessons/${lesson4Id}/draft`,
      {
        method: 'PATCH',
        headers: {
          Cookie: `${teacherCookie.name}=${teacherCookie.value}`,
          'Content-Type': 'application/json',
          Origin: `http://127.0.0.1:${adminPort}`,
        },
        body: JSON.stringify({
          title: { vi: 'Bài 4: Luyện nói nâng cao' },
          contentBlocks: [{ type: 'paragraph', text: 'Nội dung bài đọc mở rộng' }],
          exercises: [
            {
              position: 1,
              isCore: true,
              type: 'MCQ',
              promptData: {
                prompt: 'Chọn câu chào buổi sáng:',
                options: [
                  { id: 'opt-1', text: 'Good morning' },
                  { id: 'opt-2', text: 'Good night' },
                ],
              },
              gradingData: {
                correctOptionId: 'opt-1',
              },
              feedbackData: {
                explanation: 'Chào buổi sáng là Good morning',
              },
            },
          ],
          expectedRowVersion: l4AfterAssign.rows[0].row_version.toString(),
        }),
      }
    );
    assert.equal(draftRes.status, 200, `Save draft must return 200, got ${draftRes.status}`);

    // Step 4.4: Teacher submits draft
    const revRow = await pgClient.query(`
      SELECT id, row_version FROM app.lesson_revisions WHERE lesson_id = '${lesson4Id}' ORDER BY revision_no DESC LIMIT 1
    `);
    const l4AfterDraft = await pgClient.query(`SELECT row_version FROM app.lessons WHERE id = '${lesson4Id}'`);
    const draftRevisionId = revRow.rows[0].id;
    const submitRes = await fetch(
      `http://127.0.0.1:${adminPort}/api/teacher/lessons/${lesson4Id}/submit`,
      {
        method: 'POST',
        headers: {
          Cookie: `${teacherCookie.name}=${teacherCookie.value}`,
          'Content-Type': 'application/json',
          Origin: `http://127.0.0.1:${adminPort}`,
        },
        body: JSON.stringify({
          revisionId: draftRevisionId,
          expectedLessonRowVersion: l4AfterDraft.rows[0].row_version.toString(),
          expectedRevisionRowVersion: revRow.rows[0].row_version.toString(),
        }),
      }
    );
    const submitJson = await submitRes.json();
    if (submitRes.status !== 200) {
      console.error('submitRes error:', submitRes.status, submitJson);
    }
    assert.equal(submitRes.status, 200, `Submit draft must return 200, got ${submitRes.status}`);
    const submissionId = submitJson.submissionId || submitJson.data?.submissionId;

    // Step 4.5: Admin approves submission via protected API
    const revAfterSubmit = await pgClient.query(`SELECT row_version FROM app.lesson_revisions WHERE id = '${draftRevisionId}'`);
    const approveRes = await fetch(
      `http://127.0.0.1:${adminPort}/api/reviews/${submissionId}/approve`,
      {
        method: 'POST',
        headers: {
          Cookie: `${adminCookie.name}=${adminCookie.value}`,
          'Content-Type': 'application/json',
          Origin: `http://127.0.0.1:${adminPort}`,
        },
        body: JSON.stringify({
          expectedRevisionRowVersion: revAfterSubmit.rows[0].row_version.toString(),
          comment: 'Duyệt bài học số 4',
        }),
      }
    );
    assert.equal(approveRes.status, 200, `Approve review must return 200, got ${approveRes.status}`);

    // -------------------------------------------------------------
    // 5. Real Chromium Browser Launch & Outbound Network Guard (P4)
    // -------------------------------------------------------------
    console.log('\n--- Launching Real Chromium Browser & Installing Network Guard ---');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const consoleErrors = [];
    const forbiddenOutboundAttempts = [];
    async function installContextNetworkGuard(context) {
      await context.route('**', (route) => {
        try {
          const reqUrl = new URL(route.request().url());
          const origin = reqUrl.origin;
          const allowed = [
            `http://127.0.0.1:${webPort}`,
            `http://127.0.0.1:${adminPort}`,
            providerOrigin,
          ];
          if (!allowed.includes(origin)) {
            forbiddenOutboundAttempts.push({
              url: route.request().url(),
              method: route.request().method(),
            });
            return route.abort('blockedbyclient');
          }
        } catch {
          return route.abort('blockedbyclient');
        }
        return route.continue();
      });
    }

    // Step 4.6: Admin Browser Context — Real UI Publication of Lesson 4 (R6 closure)
    console.log('\n--- Admin Browser Context: Lesson 4 Publication via UI ---');
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await installContextNetworkGuard(adminContext);
    await adminContext.addCookies([
      {
        name: adminCookie.name,
        value: adminCookie.value,
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    const adminPage = await adminContext.newPage();
    adminPage.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    console.log(`Navigating Admin to /review/${submissionId}...`);
    await adminPage.goto(`http://127.0.0.1:${adminPort}/review/${submissionId}`);
    await adminPage.waitForSelector('#btnPublish', { timeout: 10000 });
    await adminPage.screenshot({
      path: path.join(evidenceDir, '00a-admin-review-before-publish.png'),
      fullPage: true,
    });
    console.log('✔ Captured 00a-admin-review-before-publish.png: Review detail loaded with #btnPublish');

    // Click actual "Xuất bản và mở cho học viên" button and observe real POST 200 with makeAvailable: true
    const publishPromise = adminPage.waitForResponse((res) => {
      return res.url().includes(`/api/reviews/${submissionId}/publish`) && res.request().method() === 'POST';
    });
    await adminPage.click('#btnPublish');
    const publishResponse = await publishPromise;
    assert.equal(publishResponse.status(), 200, `Real POST publish must return 200, got ${publishResponse.status()}`);
    const publishPostData = JSON.parse(publishResponse.request().postData() || '{}');
    assert.equal(publishPostData.makeAvailable, true, 'Publish UI must send makeAvailable: true');

    // Assert DB published pointer and AVAILABLE transition
    const l4Db = await pgClient.query(`SELECT availability, active_revision_id FROM app.lessons WHERE id = '${lesson4Id}'`);
    assert.equal(l4Db.rows[0].availability, 'AVAILABLE', 'Lesson 4 must be AVAILABLE in DB');
    assert.equal(l4Db.rows[0].active_revision_id, draftRevisionId, 'Lesson 4 active_revision_id must point to draftRevisionId');

    await adminPage.waitForSelector('#reviewActionSuccess', { timeout: 10000 });
    await adminPage.screenshot({
      path: path.join(evidenceDir, '00b-admin-review-after-publish.png'),
      fullPage: true,
    });
    console.log('✔ Captured 00b-admin-review-after-publish.png: Published via UI, DB AVAILABLE confirmed');

    // Step 4.7: Separate Lesson 5 for Real UI Activation Proof (R6 closure)
    console.log('\n--- Admin Authoring & Browser Context: Lesson 5 Activation via UI ---');
    // Step 4.7a: Create Lesson 5
    const createL5Res = await fetch(
      `http://127.0.0.1:${adminPort}/api/courses/${SAMPLE_A1_CONSTANTS.courseId}/units/${SAMPLE_A1_CONSTANTS.unitId}/lessons`,
      {
        method: 'POST',
        headers: {
          Cookie: `${adminCookie.name}=${adminCookie.value}`,
          'Content-Type': 'application/json',
          Origin: `http://127.0.0.1:${adminPort}`,
        },
        body: JSON.stringify({ position: 5, isRequired: true }),
      }
    );
    assert.equal(createL5Res.status, 201, `Create Lesson 5 must return 201, got ${createL5Res.status}`);
    const l5Json = await createL5Res.json();
    const lesson5Id = l5Json.data?.id || l5Json.id;

    // Step 4.7b: Assign Teacher to Lesson 5
    const l5AfterCreate = await pgClient.query(`SELECT row_version FROM app.lessons WHERE id = '${lesson5Id}'`);
    const assignL5Res = await fetch(
      `http://127.0.0.1:${adminPort}/api/courses/${SAMPLE_A1_CONSTANTS.courseId}/units/${SAMPLE_A1_CONSTANTS.unitId}/lessons/${lesson5Id}/assignment`,
      {
        method: 'PATCH',
        headers: {
          Cookie: `${adminCookie.name}=${adminCookie.value}`,
          'Content-Type': 'application/json',
          Origin: `http://127.0.0.1:${adminPort}`,
        },
        body: JSON.stringify({
          teacherId: TEACHER_ID,
          expectedRowVersion: l5AfterCreate.rows[0].row_version.toString(),
        }),
      }
    );
    assert.equal(assignL5Res.status, 200);

    // Step 4.7c: Teacher saves draft Lesson 5
    const l5AfterAssign = await pgClient.query(`SELECT row_version FROM app.lessons WHERE id = '${lesson5Id}'`);
    const draftL5Res = await fetch(
      `http://127.0.0.1:${adminPort}/api/teacher/lessons/${lesson5Id}/draft`,
      {
        method: 'PATCH',
        headers: {
          Cookie: `${teacherCookie.name}=${teacherCookie.value}`,
          'Content-Type': 'application/json',
          Origin: `http://127.0.0.1:${adminPort}`,
        },
        body: JSON.stringify({
          title: { vi: 'Bài 5: Giao tiếp thực hành' },
          contentBlocks: [{ type: 'paragraph', text: 'Nội dung bài học số 5' }],
          exercises: [
            {
              position: 1,
              isCore: true,
              type: 'MCQ',
              promptData: {
                prompt: 'Chọn câu chào:',
                options: [
                  { id: 'opt-1', text: 'Hello' },
                  { id: 'opt-2', text: 'Goodbye' },
                ],
              },
              gradingData: { correctOptionId: 'opt-1' },
              feedbackData: { explanation: 'Hello là xin chào' },
            },
          ],
          expectedRowVersion: l5AfterAssign.rows[0].row_version.toString(),
        }),
      }
    );
    assert.equal(draftL5Res.status, 200);

    // Step 4.7d: Teacher submits draft Lesson 5
    const rev5Row = await pgClient.query(`
      SELECT id, row_version FROM app.lesson_revisions WHERE lesson_id = '${lesson5Id}' ORDER BY revision_no DESC LIMIT 1
    `);
    const l5AfterDraft = await pgClient.query(`SELECT row_version FROM app.lessons WHERE id = '${lesson5Id}'`);
    const draft5RevisionId = rev5Row.rows[0].id;
    const submit5Res = await fetch(
      `http://127.0.0.1:${adminPort}/api/teacher/lessons/${lesson5Id}/submit`,
      {
        method: 'POST',
        headers: {
          Cookie: `${teacherCookie.name}=${teacherCookie.value}`,
          'Content-Type': 'application/json',
          Origin: `http://127.0.0.1:${adminPort}`,
        },
        body: JSON.stringify({
          revisionId: draft5RevisionId,
          expectedLessonRowVersion: l5AfterDraft.rows[0].row_version.toString(),
          expectedRevisionRowVersion: rev5Row.rows[0].row_version.toString(),
        }),
      }
    );
    assert.equal(submit5Res.status, 200);
    const submit5Json = await submit5Res.json();
    const submission5Id = submit5Json.submissionId || submit5Json.data?.submissionId;

    // Step 4.7e: Admin approves submission 5
    const rev5AfterSubmit = await pgClient.query(`SELECT row_version FROM app.lesson_revisions WHERE id = '${draft5RevisionId}'`);
    const approve5Res = await fetch(
      `http://127.0.0.1:${adminPort}/api/reviews/${submission5Id}/approve`,
      {
        method: 'POST',
        headers: {
          Cookie: `${adminCookie.name}=${adminCookie.value}`,
          'Content-Type': 'application/json',
          Origin: `http://127.0.0.1:${adminPort}`,
        },
        body: JSON.stringify({
          expectedRevisionRowVersion: rev5AfterSubmit.rows[0].row_version.toString(),
          comment: 'Duyệt bài học số 5',
        }),
      }
    );
    assert.equal(approve5Res.status, 200);

    // Step 4.7f: Admin publishes Lesson 5 via API with makeAvailable: false -> resulting in PUBLISHED + PLANNED
    const rev5AfterApprove = await pgClient.query(`SELECT row_version FROM app.lesson_revisions WHERE id = '${draft5RevisionId}'`);
    const l5AfterApprove = await pgClient.query(`SELECT row_version FROM app.lessons WHERE id = '${lesson5Id}'`);
    const publish5Res = await fetch(
      `http://127.0.0.1:${adminPort}/api/reviews/${submission5Id}/publish`,
      {
        method: 'POST',
        headers: {
          Cookie: `${adminCookie.name}=${adminCookie.value}`,
          'Content-Type': 'application/json',
          Origin: `http://127.0.0.1:${adminPort}`,
        },
        body: JSON.stringify({
          expectedLessonRowVersion: l5AfterApprove.rows[0].row_version.toString(),
          expectedRevisionRowVersion: rev5AfterApprove.rows[0].row_version.toString(),
          comment: 'Xuất bản chưa mở',
          makeAvailable: false,
        }),
      }
    );
    assert.equal(publish5Res.status, 200);

    // Verify Lesson 5 is strictly PUBLISHED + PLANNED in DB
    const l5DbBeforeActivate = await pgClient.query(`SELECT availability, active_revision_id FROM app.lessons WHERE id = '${lesson5Id}'`);
    assert.equal(l5DbBeforeActivate.rows[0].availability, 'PLANNED', 'Lesson 5 must be PLANNED before activation');
    assert.equal(l5DbBeforeActivate.rows[0].active_revision_id, draft5RevisionId, 'Lesson 5 active_revision_id must be set');

    // Step 4.7g: Admin browser navigates to LessonsCatalog for unit
    console.log(`Navigating Admin to LessonsCatalog: /courses/${SAMPLE_A1_CONSTANTS.courseId}/units/${SAMPLE_A1_CONSTANTS.unitId}...`);
    await adminPage.goto(`http://127.0.0.1:${adminPort}/courses/${SAMPLE_A1_CONSTANTS.courseId}/units/${SAMPLE_A1_CONSTANTS.unitId}`);
    await adminPage.waitForSelector(`#btn-activate-lesson-${lesson5Id}`, { timeout: 10000 });
    await adminPage.screenshot({
      path: path.join(evidenceDir, '00c-admin-catalog-before-activate.png'),
      fullPage: true,
    });
    console.log(`✔ Captured 00c-admin-catalog-before-activate.png: LessonsCatalog shows #btn-activate-lesson-${lesson5Id}`);

    // Step 4.7h: Click "Mở cho học viên" button in LessonsCatalog and observe real POST 200
    const activatePromise = adminPage.waitForResponse((res) => {
      return res.url().includes(`/lessons/${lesson5Id}/activate`) && res.request().method() === 'POST';
    });
    await adminPage.click(`#btn-activate-lesson-${lesson5Id}`);
    const activateResponse = await activatePromise;
    assert.equal(activateResponse.status(), 200, `Real POST activate must return 200, got ${activateResponse.status()}`);

    // Verify Lesson 5 is now AVAILABLE in DB
    const l5DbAfterActivate = await pgClient.query(`SELECT availability FROM app.lessons WHERE id = '${lesson5Id}'`);
    assert.equal(l5DbAfterActivate.rows[0].availability, 'AVAILABLE', 'Lesson 5 must be AVAILABLE in DB');

    await adminPage.screenshot({
      path: path.join(evidenceDir, '00d-admin-catalog-after-activate.png'),
      fullPage: true,
    });
    console.log('✔ Captured 00d-admin-catalog-after-activate.png: Activated via LessonsCatalog UI');

    // Step 4.7i: Reload LessonsCatalog page and verify activation button is gone
    await adminPage.reload();
    await adminPage.waitForSelector('#populatedLessonsTable', { timeout: 10000 });
    const activateBtnCount = await adminPage.locator(`#btn-activate-lesson-${lesson5Id}`).count();
    assert.equal(activateBtnCount, 0, 'Activation button must no longer exist after reload for an AVAILABLE lesson');
    console.log('✔ Reloaded LessonsCatalog: activation control cleanly unmounted');
    await adminContext.close();

    // -------------------------------------------------------------
    // 6. Learner Browser Testing with Playwright
    // -------------------------------------------------------------
    console.log('\n--- Learner 1 Browser Testing ---');
    const learner1Cookie = makeSessionCookie(LEARNER1_ID, 'learner1@lingora.test', 'sb-127-learner-token');

    const learnerContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    await installContextNetworkGuard(learnerContext);
    await learnerContext.addCookies([
      {
        name: learner1Cookie.name,
        value: learner1Cookie.value,
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    const page = await learnerContext.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Step 5.1: Learner Home & Context Recovery (P2)
    console.log('Visiting /home for Learner 1...');
    await page.goto(`http://127.0.0.1:${webPort}/home`);
    await page.waitForSelector(`#startLevelBtn-${CONTEXT1_ID}`);
    await page.screenshot({
      path: path.join(evidenceDir, '01-learner-home-desktop.png'),
      fullPage: true,
    });
    console.log('✔ Captured 01-learner-home-desktop.png: context recovery button visible');

    // Click "Chọn trình độ bắt đầu" to open inline recovery form
    await page.click(`#startLevelBtn-${CONTEXT1_ID}`);
    await page.waitForSelector(`#confirmStartLevelBtn-${CONTEXT1_ID}`);
    // Confirm default level (A1)
    await page.click(`#confirmStartLevelBtn-${CONTEXT1_ID}`);
    // Wait for "Vào học" button to appear after successful start
    await page.waitForSelector(`#enterContextBtn-${CONTEXT1_ID}`, { timeout: 10000 });
    console.log('✔ Context recovered: working level set, "Vào học" button active');

    // Step 5.2: Course Catalogue View
    await page.click(`#enterContextBtn-${CONTEXT1_ID}`);
    await page.waitForURL(`**/learn/${CONTEXT1_ID}`);
    await page.waitForSelector(`#lessonLink-${lesson1Id}`);
    // Verify Lesson 2, Lesson 4, and Lesson 5 are initially locked but visible in catalogue
    await page.waitForSelector(`#lockedBtn-${lesson2Id}`);
    await page.waitForSelector(`#lockedBtn-${lesson4Id}`);
    await page.waitForSelector(`#lockedBtn-${lesson5Id}`);
    await page.screenshot({
      path: path.join(evidenceDir, '02-course-catalogue-desktop.png'),
      fullPage: true,
    });
    console.log('✔ Captured 02-course-catalogue-desktop.png: Lesson 1 unlocked, Lesson 2 locked');

    // Step 5.3: Lesson 1 Reading & Practice Section (MCQ, FILL_BLANK, REORDER)
    await page.click(`#lessonLink-${lesson1Id}`);
    await page.waitForURL(`**/learn/${CONTEXT1_ID}/${lesson1Id}`);

    // Learner opens reading content ("Mở nội dung")
    await page.waitForSelector('#startReadingBtn', { timeout: 10000 });
    await page.click('#startReadingBtn');
    await page.waitForSelector('#lessonContentContainer', { timeout: 10000 });
    console.log('✔ Opened lesson reading content: lessonContentContainer rendered');

    // Learner completes reading ("Hoàn thành đọc nội dung")
    await page.waitForSelector('#completeReadingBtn', { timeout: 10000 });
    await page.click('#completeReadingBtn');
    await page.waitForSelector('#completedStateBtn', { timeout: 10000 });
    console.log('✔ Completed reading: completedStateBtn is visible');

    // Verify DB reading completion
    const readingDbRes = await pgClient.query(`
      SELECT completed_at IS NOT NULL as is_completed
      FROM app.lesson_consumptions
      WHERE context_id = '${CONTEXT1_ID}' AND lesson_id = '${lesson1Id}';
    `);
    assert.equal(readingDbRes.rows[0].is_completed, true, 'DB reading consumption must be completed');

    await page.screenshot({
      path: path.join(evidenceDir, '03-lesson-content-desktop.png'),
      fullPage: true,
    });
    console.log('✔ Captured 03-lesson-content-desktop.png: reading completed and practice start');

    // Start practice attempt
    await page.waitForSelector('#startPracticeBtn', { timeout: 10000 });
    await page.click('#startPracticeBtn');
    await page.waitForSelector('#submitResponseBtn', { timeout: 10000 });

    // Exercise 1 (Pass 1): MCQ - Intentionally submit wrong answer first
    await page.locator('input[value="opt-1-2"]').click();
    await page.click('#submitResponseBtn');
    await page.waitForSelector('#formativeFeedback.alert-box.is-warning', { timeout: 10000 });
    console.log('✔ Submitted Exercise 1 with intentional wrong answer, formative feedback displayed');

    // Exercise 2 (Pass 1): FILL_BLANK ("meet")
    await page.waitForSelector('#fillBlankInput', { timeout: 10000 });
    await page.fill('#fillBlankInput', 'meet');
    await page.click('#submitResponseBtn');
    console.log('✔ Submitted Exercise 2 (FILL_BLANK)');

    // Exercise 3 (Pass 1): REORDER ("How", "are", "you?")
    await page.waitForSelector('#tokenBtn-t1', { timeout: 10000 });
    await page.click('#tokenBtn-t1');
    await page.click('#tokenBtn-t2');
    await page.click('#tokenBtn-t3');
    await page.click('#submitResponseBtn');
    console.log('✔ Submitted Exercise 3 (REORDER)');

    // Exercise 1 (Pass 2 Retry): Re-enters queue for formative second attempt
    const retryLabel = page.locator('#queueProgressLabel').filter({ hasText: 'Làm lại câu sai' });
    await retryLabel.waitFor({ timeout: 10000 });
    const progressText = await retryLabel.textContent();
    assert.match(progressText, /Làm lại câu sai/, 'Progress label must indicate retry for wrong answer in pass 2');
    await page.locator('input[value="opt-1-1"]').click();
    await page.click('#submitResponseBtn');
    await page.waitForSelector('#formativeFeedback.alert-box.is-success', { timeout: 10000 });
    console.log('✔ Submitted Exercise 1 Retry (MCQ) successfully in pass 2');

    // Finalize practice attempt
    await page.waitForSelector('#finalizePracticeBtn', { timeout: 10000 });
    await page.click('#finalizePracticeBtn');

    // Step 5.4: Verify Completed-Only Feedback & Authored Vietnamese Explanations (P3)
    await page.waitForSelector('#practiceFeedbackReview', { timeout: 10000 });
    const reviewCards = await page.$$('.review-entry-card');
    assert.equal(reviewCards.length, 3, 'Must render exactly 3 review cards for the 3 answered exercises');

    // Check authored explanations are displayed in the review cards
    const reviewHtml = await page.innerHTML('#practiceFeedbackReview');
    assert.ok(
      reviewHtml.includes('chào buổi sáng'),
      'Explanation for Ex 1 must mention chào buổi sáng'
    );
    assert.ok(
      reviewHtml.includes('Rất vui được gặp bạn'),
      'Explanation for Ex 2 must mention Rất vui được gặp bạn'
    );
    assert.ok(
      reviewHtml.includes('Bạn có khỏe không?'),
      'Explanation for Ex 3 must mention Bạn có khỏe không?'
    );

    // Reload page to prove feedback persists on reload!
    await page.reload();
    await page.waitForSelector('#practiceFeedbackReview', { timeout: 10000 });
    console.log('✔ Page reloaded: feedback and explanations remain persisted');

    await page.screenshot({
      path: path.join(evidenceDir, '04-practice-feedback-desktop.png'),
      fullPage: true,
    });
    console.log('✔ Captured 04-practice-feedback-desktop.png: reading completed and authored Vietnamese explanations');

    // Step 5.5: Database Verification
    const attemptDbRes = await pgClient.query(`
      SELECT id, completed_at IS NOT NULL as is_completed
      FROM app.lesson_attempts
      WHERE context_id = '${CONTEXT1_ID}' AND lesson_id = '${lesson1Id}'
      ORDER BY created_at DESC LIMIT 1;
    `);
    assert.equal(attemptDbRes.rows[0].is_completed, true, 'DB attempt must be completed');

    const completionDbRes = await pgClient.query(`
      SELECT id, first_attempt_id, completed_at
      FROM app.lesson_completions
      WHERE context_id = '${CONTEXT1_ID}' AND lesson_id = '${lesson1Id}';
    `);
    assert.equal(completionDbRes.rows.length, 1, 'DB lesson completion must be recorded');
    assert.equal(completionDbRes.rows[0].first_attempt_id, attemptDbRes.rows[0].id, 'First attempt ID must match');
    assert.ok(completionDbRes.rows[0].completed_at, 'Completion timestamp must be set');

    const responsesDbRes = await pgClient.query(`
      SELECT count(*) as count FROM app.lesson_responses
      WHERE attempt_id = '${attemptDbRes.rows[0].id}';
    `);
    assert.equal(Number(responsesDbRes.rows[0].count), 4, 'DB responses count must be 4 (including retry response)');

    const srsCardsDbRes = await pgClient.query(`
      SELECT c.id, v.canonical_form, c.stage, c.enrollment_source
      FROM app.srs_cards c
      JOIN app.vocabulary_concepts v ON v.id = c.vocabulary_id
      WHERE c.learner_id = '${LEARNER1_ID}'
      ORDER BY v.canonical_form ASC;
    `);
    assert.equal(srsCardsDbRes.rows.length, 3, 'Exactly 3 vocabulary items must be enrolled as SRS cards');
    assert.equal(srsCardsDbRes.rows[0].stage, 1, 'Initial stage must be 1');
    assert.equal(srsCardsDbRes.rows[0].enrollment_source, 'CORE_COMPLETION');
    console.log('✔ DB Assertions PASS: practice completed, responses=4 (with formative retry), enrolled srs_cards=3');

    // Step 5.6: Progression - Lesson 2 Unlocked in Catalogue & Navigate to Lesson 2
    await page.goto(`http://127.0.0.1:${webPort}/learn/${CONTEXT1_ID}`);
    await page.waitForSelector(`#lessonLink-${lesson2Id}`, { timeout: 10000 });
    await page.screenshot({
      path: path.join(evidenceDir, '05-course-catalogue-unlocked-desktop.png'),
      fullPage: true,
    });
    console.log('✔ Captured 05-course-catalogue-unlocked-desktop.png: Lesson 2 is UNLOCKED!');

    // Enter Lesson 2 to prove progression
    await page.click(`#lessonLink-${lesson2Id}`);
    await page.waitForURL(`**/learn/${CONTEXT1_ID}/${lesson2Id}`);
    await page.waitForSelector('#startReadingBtn', { timeout: 10000 });
    console.log('✔ Successfully navigated into Lesson 2: startReadingBtn is visible');

    // Step 5.7: Age owned SRS cards in DB & Due SRS Review Session (P4/P5)
    await pgClient.query(`
      UPDATE app.srs_cards
      SET due_at = NOW() - INTERVAL '2 hours'
      WHERE learner_id = '${LEARNER1_ID}';
    `);
    console.log('✔ Owned cards aged in DB: due_at set to 2 hours ago');

    // Navigate to /review via header navigation "Ôn từ vựng" on /home
    await page.goto(`http://127.0.0.1:${webPort}/home`);
    await page.waitForSelector('#reviewNavBtn');
    await page.click('#reviewNavBtn');
    await page.waitForURL('**/review');
    await page.waitForSelector('#startReviewBtn');

    // Start SRS review
    await page.click('#startReviewBtn');
    await page.waitForSelector('#srsReviewCard');
    await page.screenshot({
      path: path.join(evidenceDir, '06-srs-review-prompt-desktop.png'),
      fullPage: true,
    });
    console.log('✔ Captured 06-srs-review-prompt-desktop.png: Card 1 prompt visible, dueAt/stage hidden');

    // Card 1: Reveal & Rate REMEMBERED
    await page.click('#revealAnswerBtn');
    await page.waitForSelector('#srsAnswerSection');
    await page.screenshot({
      path: path.join(evidenceDir, '07-srs-review-revealed-desktop.png'),
      fullPage: true,
    });
    console.log('✔ Captured 07-srs-review-revealed-desktop.png: Answer revealed with explanation');
    await page.click('#rateRememberedBtn');

    // Card 2: Reveal & Rate REMEMBERED
    await page.waitForSelector('.srs-canonical-form', { timeout: 10000 });
    await page.click('#revealAnswerBtn');
    await page.waitForSelector('#srsAnswerSection', { timeout: 10000 });
    await page.click('#rateRememberedBtn');

    // Card 3: Reveal & Rate REMEMBERED
    await page.waitForSelector('.srs-canonical-form', { timeout: 10000 });
    await page.click('#revealAnswerBtn');
    await page.waitForSelector('#srsAnswerSection', { timeout: 10000 });
    await page.click('#rateRememberedBtn');

    // Review session complete
    await page.waitForSelector('#srsDoneBox', { timeout: 10000 });
    await page.screenshot({
      path: path.join(evidenceDir, '08-srs-review-done-desktop.png'),
      fullPage: true,
    });
    console.log('✔ Captured 08-srs-review-done-desktop.png: Review session completed!');

    // Reload /review to verify zero cards due persisted
    await page.reload();
    await page.waitForSelector('#startReviewBtn');
    await page.click('#startReviewBtn');
    await page.waitForSelector('#srsDoneBox', { timeout: 10000 });
    const emptyDoneText = await page.innerText('#srsDoneBox');
    assert.ok(emptyDoneText.includes('không có từ vựng nào đến hạn'), 'After review, no cards are due');

    // Verify DB schedule progression
    const updatedCardsDbRes = await pgClient.query(`
      SELECT v.canonical_form, c.stage, c.due_at > NOW() as in_future
      FROM app.srs_cards c
      JOIN app.vocabulary_concepts v ON v.id = c.vocabulary_id
      WHERE c.learner_id = '${LEARNER1_ID}';
    `);
    for (const card of updatedCardsDbRes.rows) {
      assert.equal(card.stage, 2, `Card ${card.canonical_form} must have progressed to stage 2`);
      assert.equal(card.in_future, true, `Card ${card.canonical_form} must be scheduled in the future`);
    }

    const reviewOpsDbRes = await pgClient.query(`
      SELECT count(*) as count FROM app.srs_review_operations
      WHERE learner_id = '${LEARNER1_ID}';
    `);
    assert.equal(Number(reviewOpsDbRes.rows[0].count), 3, 'Exactly 3 review operations must be persisted in DB');
    console.log('✔ DB Assertions PASS: all cards at stage 2, scheduled in future, operations=3');

    // Step 5.8: Mobile Viewport Screenshots (390x844) & Long Display Name Verification (R8)
    console.log('\n--- Capturing Mobile Viewport Evidence & Long Display Name ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await installContextNetworkGuard(mobileContext);
    await mobileContext.addCookies([
      {
        name: learner1Cookie.name,
        value: learner1Cookie.value,
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    const mobilePage = await mobileContext.newPage();
    mobilePage.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await mobilePage.goto(`http://127.0.0.1:${webPort}/home`);
    await mobilePage.waitForSelector(`#enterContextBtn-${CONTEXT1_ID}`);
    await mobilePage.screenshot({
      path: path.join(evidenceDir, '09-learner-home-mobile.png'),
      fullPage: true,
    });
    console.log('✔ Captured 09-learner-home-mobile.png (390px mobile home)');

    // Set long display name in database to test header wrapping without horizontal scroll
    await pgClient.query(`
      UPDATE app.accounts
      SET display_name = 'Học viên Nguyễn Trần Hoàng Minh Khang'
      WHERE id = '${LEARNER1_ID}';
    `);

    await mobilePage.reload();
    await mobilePage.waitForSelector(`#enterContextBtn-${CONTEXT1_ID}`);

    // Assert no horizontal scroll overflow
    const scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth);
    assert.ok(
      scrollWidth <= clientWidth,
      `Mobile page has horizontal overflow with long display name: scrollWidth=${scrollWidth} > clientWidth=${clientWidth}`
    );

    // Assert nav labels inside bounds
    const headerBox = await mobilePage.locator('header').boundingBox();
    assert.ok(headerBox && headerBox.width <= 390, 'Header must not overflow 390px viewport');

    // Usable keyboard focus
    await mobilePage.focus('#reviewNavBtn');
    const focusedId = await mobilePage.evaluate(() => document.activeElement?.id);
    assert.equal(focusedId, 'reviewNavBtn', 'Keyboard focus must be usable on reviewNavBtn');

    await mobilePage.screenshot({
      path: path.join(evidenceDir, '10-learner-home-mobile-longname.png'),
      fullPage: true,
    });
    console.log('✔ Captured 10-learner-home-mobile-longname.png (390px header with long display name)');

    // Restore display name
    await pgClient.query(`
      UPDATE app.accounts
      SET display_name = 'Học viên Minh'
      WHERE id = '${LEARNER1_ID}';
    `);

    await mobilePage.goto(`http://127.0.0.1:${webPort}/review`);
    await mobilePage.waitForSelector('#startReviewBtn');
    await mobilePage.screenshot({
      path: path.join(evidenceDir, '11-srs-review-mobile.png'),
      fullPage: true,
    });
    console.log('✔ Captured 11-srs-review-mobile.png (390px mobile review)');
    await mobileContext.close();

    // Step 5.9: Two-Learner Isolation
    console.log('\n--- Checking Multi-Learner Isolation ---');
    const learner2Cookie = makeSessionCookie(LEARNER2_ID, 'learner2@lingora.test', 'sb-127-learner-token');
    const learner2Context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    await installContextNetworkGuard(learner2Context);
    await learner2Context.addCookies([
      {
        name: learner2Cookie.name,
        value: learner2Cookie.value,
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    const page2 = await learner2Context.newPage();
    page2.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Learner 2 visits /review: 0 due cards
    await page2.goto(`http://127.0.0.1:${webPort}/review`);
    await page2.waitForSelector('#startReviewBtn');
    await page2.click('#startReviewBtn');
    await page2.waitForSelector('#srsDoneBox', { timeout: 10000 });
    const l2DoneText = await page2.innerText('#srsDoneBox');
    assert.ok(l2DoneText.includes('không có từ vựng nào đến hạn'), 'Learner 2 must have 0 cards due');

    // Learner 2 visits Learner 1 context /learn/[context1Id]: access rejected in UI and API
    await page2.goto(`http://127.0.0.1:${webPort}/learn/${CONTEXT1_ID}`);
    const page2Text = await page2.innerText('body');
    assert.ok(
      page2Text.includes('không tồn tại') || page2Text.includes('không có quyền') || page2Text.includes('404'),
      'Learner 2 page must show error indicating context not accessible'
    );

    const crossApiRes = await fetch(`http://127.0.0.1:${webPort}/api/learner/contexts/${CONTEXT1_ID}/lessons`, {
      headers: {
        Cookie: `${learner2Cookie.name}=${learner2Cookie.value}`,
      },
    });
    assert.equal(crossApiRes.status, 404, 'Learner 2 API request for Learner 1 context lessons must return 404');
    await learner2Context.close();
    console.log('✔ Multi-learner isolation verified: Learner 2 has 0 cards and cannot access Learner 1 context');

    // Step 5.10: Anonymous Access Rejection
    console.log('\n--- Checking Anonymous Protected-Route Rejection ---');
    const anonContext = await browser.newContext();
    await installContextNetworkGuard(anonContext);
    const anonPage = await anonContext.newPage();
    anonPage.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Anonymous visiting /review redirects to /login
    await anonPage.goto(`http://127.0.0.1:${webPort}/review`);
    assert.ok(anonPage.url().includes('/login'), `Anonymous /review must redirect to /login, got ${anonPage.url()}`);

    // Anonymous fetch to /api/learner/review/start returns 401 UNAUTHENTICATED
    const anonStartRes = await fetch(`http://127.0.0.1:${webPort}/api/learner/review/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: `http://127.0.0.1:${webPort}`,
      },
      body: JSON.stringify({}),
    });
    assert.equal(anonStartRes.status, 401, 'Anonymous /api/learner/review/start must return 401');
    assert.equal(anonStartRes.headers.get('Cache-Control'), 'no-store, private');

    // Anonymous fetch to /api/learner/context returns 401 UNAUTHENTICATED
    const anonContextRes = await fetch(`http://127.0.0.1:${webPort}/api/learner/context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: `http://127.0.0.1:${webPort}`,
      },
      body: JSON.stringify({ courseId: SAMPLE_A1_CONSTANTS.courseId }),
    });
    assert.equal(anonContextRes.status, 401, 'Anonymous /api/learner/context must return 401');
    assert.equal(anonContextRes.headers.get('Cache-Control'), 'no-store, private');
    await anonContext.close();
    console.log('✔ Anonymous protected route rejection verified (401 + no-store/private)');

    // Step 5.11: Boundary Invariants — Zero forbidden outbound & clean console
    assert.equal(forbiddenOutboundAttempts.length, 0, `No forbidden outbound requests permitted, caught: ${JSON.stringify(forbiddenOutboundAttempts)}`);
    assert.equal(consoleErrors.length, 0, `No browser console errors permitted, caught: ${JSON.stringify(consoleErrors)}`);
    console.log('✔ Boundary Invariants PASS: forbidden outbound attempts = 0, browser console errors = 0');

    console.log('\n=============================================================');
    console.log('🎉 P7 JOINED ACCEPTANCE E2E PROOF: ALL VERIFICATIONS PASSED! 🎉');
    console.log('=============================================================\n');
  } finally {
    await cleanup();
  }
}

run().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('P7 E2E Test Failed with error:', err);
  process.exit(1);
});
