import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { startIsolatedServer } from './isolated-server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const NEXT_PORT = 3005;
const NEXT_URL = `http://127.0.0.1:${NEXT_PORT}`;
const HARNESS_PORT = 3007;
const HARNESS_URL = `http://127.0.0.1:${HARNESS_PORT}`;

const rootDir = fs.existsSync(path.resolve(process.cwd(), 'lingora-admin'))
  ? process.cwd()
  : path.resolve(process.cwd(), '..');
const appDir = path.resolve(rootDir, 'lingora-admin');
const SCREENSHOT_DIR = path.resolve(rootDir, 'plans/evidence/2026-10-29-slice-1-stabilization/screenshots');

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch {
      // wait
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server at ${url} failed to respond within ${timeoutMs}ms`);
}

async function run() {
  console.log('=== STAB-1 R11 / R2 / R7 / R1 / R9: Real Browser & Isolated Components Suite ===');

  // Start isolated component harness server (port 3007)
  const harnessServer = await startIsolatedServer(HARNESS_PORT);
  console.log(`Isolated Component Test Server ready at ${HARNESS_URL}`);

  // Start production Next.js server (port 3005)
  const nextBin = require.resolve('next/dist/bin/next');
  const nextProcess = spawn(process.execPath, [nextBin, 'start', '-p', String(NEXT_PORT)], {
    cwd: appDir,
    stdio: 'inherit',
    env: { ...process.env, PORT: String(NEXT_PORT) },
  });

  try {
    await waitForServer(`${NEXT_URL}/login`);
    console.log(`Next.js production server ready at ${NEXT_URL}`);

    const browser = await chromium.launch({
      executablePath: '/opt/coccoc/browser/browser',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log('Chromium browser launched successfully.');

    // -------------------------------------------------------------
    // Part 1: Production Next.js Server Checks
    // -------------------------------------------------------------
    console.log('\n--- Part 1: Production Next.js Server Checks ---');

    // R11: Removed-route check: /test-harness MUST be 404 in production
    const harnessCheckRes = await fetch(`${NEXT_URL}/test-harness`);
    assert.equal(
      harnessCheckRes.status,
      404,
      'R11 Violation: /test-harness production route was not removed! Must return 404.'
    );
    console.log('✔ R11: Production /test-harness route verified removed (HTTP 404)');

    // Unauthenticated guard: /languages redirects to /login
    const langPageRes = await fetch(`${NEXT_URL}/languages`, { redirect: 'manual' });
    assert.ok(
      langPageRes.status === 307 || langPageRes.status === 308 || langPageRes.status === 302,
      `Unauthenticated /languages must redirect to /login, got status ${langPageRes.status}`
    );
    const redirectLocation = langPageRes.headers.get('location') || '';
    assert.ok(
      redirectLocation.includes('/login'),
      `Redirect location must point to /login, got ${redirectLocation}`
    );
    console.log('✔ Unauthenticated /languages redirects to /login');

    // Unauthenticated API: GET /api/languages returns 401
    const langApiRes = await fetch(`${NEXT_URL}/api/languages`);
    assert.equal(langApiRes.status, 401, 'Unauthenticated GET /api/languages must return 401');
    const langApiJson = await langApiRes.json();
    assert.equal(langApiJson.error.code, 'UNAUTHENTICATED');
    assert.equal(langApiRes.headers.get('Cache-Control'), 'no-store, private');
    console.log('✔ Unauthenticated GET /api/languages returns 401 UNAUTHENTICATED with private/no-store');

    for (const size of [
      { name: '1440', width: 1440, height: 960 },
      { name: '1100', width: 1100, height: 800 },
    ]) {
      const outDir = path.join(SCREENSHOT_DIR, size.name);
      fs.mkdirSync(outDir, { recursive: true });

      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
      });
      const page = await context.newPage();

      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // 1. Real Login Normal (Served by production Next.js)
      console.log(`[${size.name}] Testing: login-normal`);
      await page.goto(`${NEXT_URL}/login`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(100);

      const loginEmailFocused = await page.evaluate(() => document.activeElement?.id);
      assert.equal(loginEmailFocused, 'loginEmail', 'Login page must auto-focus email on mount');
      await page.screenshot({ path: path.join(outDir, 'login-normal.png') });

      // 2. Real Login Invalid (Client validation alert & focus to password)
      console.log(`[${size.name}] Testing: login-invalid`);
      await page.fill('#loginEmail', 'admin@lingora.edu.vn');
      await page.click('button[type="submit"]'); // empty password triggers client alert
      await page.waitForSelector('#loginAlert', { state: 'visible' });
      await page.waitForTimeout(100);
      const loginPasswordFocused = await page.evaluate(() => document.activeElement?.id);
      assert.equal(loginPasswordFocused, 'loginPassword', 'Password field must be focused after invalid login attempt');
      await page.screenshot({ path: path.join(outDir, 'login-invalid.png') });

      assert.equal(consoleErrors.length, 0, `Expected 0 console errors on production login, got: ${consoleErrors.join(', ')}`);

      // -------------------------------------------------------------
      // Part 2: Isolated Component Tests (Harness Server on Port 3007)
      // -------------------------------------------------------------
      console.log(`\n--- Part 2: Isolated Component Tests [${size.name}] ---`);

      // 3. Teacher Holding View
      console.log(`[${size.name}] Testing: teacher-holding`);
      await page.goto(`${HARNESS_URL}?state=teacher-holding`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      const holdingTitle = await page.textContent('.holding-title');
      assert.ok(holdingTitle.includes('Giáo viên'), 'Teacher holding must greet teacher');
      await page.screenshot({ path: path.join(outDir, 'teacher-holding.png') });

      // 4. Access Denied View
      console.log(`[${size.name}] Testing: access-denied`);
      await page.goto(`${HARNESS_URL}?state=access-denied`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      const deniedTitle = await page.textContent('.holding-title');
      assert.ok(deniedTitle.includes('bị từ chối'), 'Access denied title must indicate forbidden status');
      await page.screenshot({ path: path.join(outDir, 'access-denied.png') });

      // 5. Service Unavailable View
      console.log(`[${size.name}] Testing: service-unavailable`);
      await page.goto(`${HARNESS_URL}?state=service-unavailable`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      const serviceTitle = await page.textContent('.holding-title');
      assert.ok(serviceTitle.includes('không khả dụng'), 'Service unavailable title must indicate 503 outage');
      await page.screenshot({ path: path.join(outDir, 'service-unavailable.png') });

      // 6. Populated Languages Table & Search Filtering
      console.log(`[${size.name}] Testing: languages-populated`);
      await page.goto(`${HARNESS_URL}?state=populated-table`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      const summaryText = await page.textContent('#tableSummary');
      assert.ok(summaryText.includes('7 ngôn ngữ'), 'Summary must show 7 languages in catalog');
      const rowCountInitial = await page.locator('#populatedTable tbody tr').count();
      assert.equal(rowCountInitial, 7, 'Must render 7 rows initially');

      // Test Search
      await page.fill('#searchLanguageInput', 'Pháp');
      const filteredCount = await page.locator('#populatedTable tbody tr').count();
      assert.equal(filteredCount, 1, 'Search for Pháp must filter to 1 row');
      await page.fill('#searchLanguageInput', ''); // reset
      await page.screenshot({ path: path.join(outDir, 'languages-populated.png') });

      // 7. Loading Skeletons
      console.log(`[${size.name}] Testing: languages-loading`);
      await page.goto(`${HARNESS_URL}?state=table-loading`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      const isSkeletonVisible = await page.locator('#loadingTableView').isVisible();
      assert.equal(isSkeletonVisible, true, 'Loading skeletons must be visible');
      await page.screenshot({ path: path.join(outDir, 'languages-loading.png') });

      // 8. Fetch Error with Retry
      console.log(`[${size.name}] Testing: languages-fetch-error`);
      await page.goto(`${HARNESS_URL}?state=table-fetch-error`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      const isErrorVisible = await page.locator('#fetchErrorTableView').isVisible();
      assert.equal(isErrorVisible, true, 'Fetch error view must be visible');
      const isRetryBtnVisible = await page.locator('#fetchRetryBtn').isVisible();
      assert.equal(isRetryBtnVisible, true, 'Retry button must be visible');
      await page.screenshot({ path: path.join(outDir, 'languages-fetch-error.png') });

      // 9. Empty Catalog State with Preserved Summary Bar
      console.log(`[${size.name}] Testing: languages-empty`);
      await page.goto(`${HARNESS_URL}?state=table-empty`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      const isEmptyVisible = await page.locator('#emptyTableView').isVisible();
      assert.equal(isEmptyVisible, true, 'Empty state card must be visible');
      const emptySummary = await page.textContent('#tableSummary');
      assert.ok(emptySummary.includes('0 ngôn ngữ'), 'Summary bar must be preserved showing 0 languages in catalog');
      await page.screenshot({ path: path.join(outDir, 'languages-empty.png') });

      // 10. Language Create Modal & Inert Isolation
      console.log(`[${size.name}] Testing: language-create`);
      await page.goto(`${HARNESS_URL}?state=populated-table`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      await page.click('#openCreateBtn');
      await page.waitForSelector('#languageFormModal', { state: 'visible' });
      await page.waitForTimeout(100);

      // Inert attribute check
      const appContainerInert = await page.evaluate(() => document.getElementById('appContainer')?.hasAttribute('inert'));
      assert.equal(appContainerInert, true, 'appContainer must have inert attribute when modal is open');
      const modalInRoot = await page.evaluate(() => document.querySelector('#modalRoot #languageFormModal') !== null);
      assert.equal(modalInRoot, true, 'Modal must be mounted in #modalRoot outside #appContainer');

      const createCodeFocused = await page.evaluate(() => document.activeElement?.id);
      assert.equal(createCodeFocused, 'langCodeInput', 'Create modal must focus #langCodeInput');

      await page.fill('#langCodeInput', 'es');
      await page.fill('#langViInput', 'Tiếng Tây Ban Nha');
      await page.fill('#langEnInput', 'Spanish');
      await page.check('#checkLearnable');
      await page.screenshot({ path: path.join(outDir, 'language-create.png') });

      // Dismiss with Escape and verify focus restoration to trigger
      await page.keyboard.press('Escape');
      await page.waitForSelector('#languageFormModal', { state: 'hidden' });
      await page.waitForTimeout(100);
      const restoredFocusCreate = await page.evaluate(() => document.activeElement?.id);
      assert.equal(restoredFocusCreate, 'openCreateBtn', 'Focus must restore to #openCreateBtn after dismiss');

      // 11. Language Create Duplicate Rejection via Real Network 409 (R9 / R2 - Zero DOM fabrication!)
      console.log(`[${size.name}] Testing: language-create-duplicate (Real 409)`);
      await page.click('#openCreateBtn');
      await page.waitForSelector('#languageFormModal', { state: 'visible' });
      await page.waitForTimeout(100);
      await page.fill('#langCodeInput', 'vi'); // duplicate code
      await page.fill('#langViInput', 'Tiếng Việt');

      // Submit form: triggers REAL fetch POST /api/languages -> receives real 409 DUPLICATE_CODE!
      await page.click('#submitLanguageFormBtn');
      await page.waitForSelector('#codeError', { state: 'visible' });
      await page.waitForTimeout(100);

      const errorText = await page.textContent('#codeError');
      assert.ok(errorText.includes('đã tồn tại'), 'Real 409 must display server duplicate message in #codeError');

      // R2: Verify focus is placed on #langCodeInput after controls are re-enabled
      const postSubmitFocus = await page.evaluate(() => document.activeElement?.id);
      assert.equal(postSubmitFocus, 'langCodeInput', 'Focus must be restored to errored field after 409 rejection');
      await page.screenshot({ path: path.join(outDir, 'language-create-duplicate.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);

      // 12. Language Edit Modal & Immutability & Draft Lifecycle (R7, R10)
      console.log(`[${size.name}] Testing: language-edit`);
      await page.click('#btn-edit-vi');
      await page.waitForSelector('#languageFormModal', { state: 'visible' });
      await page.waitForTimeout(100);

      const editCodeDisabled = await page.evaluate(() => (document.getElementById('langCodeInput')).disabled);
      assert.equal(editCodeDisabled, true, 'Code input must be disabled (immutable) in edit mode');
      const editViFocused = await page.evaluate(() => document.activeElement?.id);
      assert.equal(editViFocused, 'langViInput', 'Edit modal must focus #langViInput');

      // R7 check: Untouched edit modal MUST NOT have created a dirty draft in storage
      const draftUntouched = await page.evaluate(() => sessionStorage.getItem('lingora_draft_lang_00000000-0000-4000-8000-000000000001'));
      assert.equal(draftUntouched, null, 'R7: Untouched edit modal must NOT save a draft in storage');

      // User makes a change: now a dirty draft SHOULD be saved
      await page.fill('#langViInput', 'Tiếng Việt Sửa Đổi');
      await page.waitForTimeout(100);
      const draftAfterEdit = await page.evaluate(() => sessionStorage.getItem('lingora_draft_lang_00000000-0000-4000-8000-000000000001'));
      assert.ok(draftAfterEdit !== null, 'R7: Dirty edit modal must save draft to sessionStorage');
      assert.ok(draftAfterEdit.includes('Tiếng Việt Sửa Đổi'), 'Draft must contain modified text');

      await page.screenshot({ path: path.join(outDir, 'language-edit.png') });

      // Dismiss edit modal with Hủy button and verify draft is removed
      await page.click('#languageFormModal .btn-secondary'); // Hủy button
      await page.waitForSelector('#languageFormModal', { state: 'hidden' });
      await page.waitForTimeout(100);

      const draftAfterDismiss = await page.evaluate(() => sessionStorage.getItem('lingora_draft_lang_00000000-0000-4000-8000-000000000001'));
      assert.equal(draftAfterDismiss, null, 'R7: Discarding edit modal must remove draft from sessionStorage');

      const restoredEditFocus = await page.evaluate(() => document.activeElement?.id);
      assert.equal(restoredEditFocus, 'btn-edit-vi', 'Focus must restore to #btn-edit-vi after dismiss');

      // 13. Delete Confirmation Modal (SCR-A-LANG-04 & R2)
      console.log(`[${size.name}] Testing: delete-confirmation`);
      await page.click('#btn-delete-vi');
      await page.waitForSelector('#deleteConfirmModal', { state: 'visible' });
      await page.waitForTimeout(100);

      // Verify Cancel button is default focused per SCR-A-LANG-04
      const cancelBtnFocused = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.classList?.contains('btn-secondary') && el?.textContent?.trim() === 'Hủy';
      });
      assert.equal(cancelBtnFocused, true, 'Cancel button must be strictly focused on delete modal open');
      await page.screenshot({ path: path.join(outDir, 'delete-confirmation.png') });

      // Dismiss and verify focus restores to delete trigger button
      await page.keyboard.press('Escape');
      await page.waitForSelector('#deleteConfirmModal', { state: 'hidden' });
      await page.waitForTimeout(100);
      const restoredDeleteFocus = await page.evaluate(() => document.activeElement?.id);
      assert.equal(restoredDeleteFocus, 'btn-delete-vi', 'Focus must restore to #btn-delete-vi after dismiss');

      // 14. Delete Blocked Modal (FK in-use 409)
      console.log(`[${size.name}] Testing: delete-blocked`);
      await page.goto(`${HARNESS_URL}?state=delete-blocked`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForSelector('#deleteBlockedModal', { state: 'visible' });
      await page.waitForTimeout(100);
      const blockedCloseFocused = await page.evaluate(() => document.activeElement?.id);
      assert.equal(blockedCloseFocused, 'closeBlockedModalBtn', 'Close button must be focused on delete blocked dialog');
      await page.screenshot({ path: path.join(outDir, 'delete-blocked.png') });

      // 15. Session Lost Modal (SCR-A-LANG-05 & R7)
      console.log(`[${size.name}] Testing: session-lost`);
      await page.goto(`${HARNESS_URL}?state=session-lost`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForSelector('#sessionLostModal', { state: 'visible' });
      await page.waitForTimeout(100);

      const sessionLoginFocused = await page.evaluate(() => document.activeElement?.id);
      assert.equal(sessionLoginFocused, 'sessionLoginBtn', 'Session login button must be strictly focused');

      const sessionLostDesc = await page.textContent('#sessionLostDesc');
      assert.ok(sessionLostDesc.includes('đã được lưu tạm'), 'Truth-in-storage message must confirm data was saved (R7)');

      // Verify Escape guard does NOT dismiss session lost modal
      await page.keyboard.press('Escape');
      const isStillOpen = await page.locator('#sessionLostModal').isVisible();
      assert.equal(isStillOpen, true, 'Escape key must NOT dismiss session lost modal');
      await page.screenshot({ path: path.join(outDir, 'session-lost.png') });

      // 16. Draft Recovery Prompt Banner (R7)
      console.log(`[${size.name}] Testing: draft-recovery`);
      await page.goto(`${HARNESS_URL}?state=draft-recovery`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForSelector('#draftRecoveryBanner', { state: 'visible' });

      const bannerText = await page.textContent('#draftRecoveryBanner');
      assert.ok(bannerText.includes('Tiếng Tây Ban Nha'), 'Draft recovery banner must name the draft language');
      await page.screenshot({ path: path.join(outDir, 'draft-recovery.png') });

      // Click Khôi phục: verify form modal opens with recovered fields
      await page.click('#draftRecoverBtn');
      await page.waitForSelector('#languageFormModal', { state: 'visible' });
      const recoveredCode = await page.inputValue('#langCodeInput');
      const recoveredVi = await page.inputValue('#langViInput');
      assert.equal(recoveredCode, 'es', 'Recovered draft must pre-populate code');
      assert.equal(recoveredVi, 'Tiếng Tây Ban Nha', 'Recovered draft must pre-populate Vietnamese name');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);

      await context.close();
      console.log(`[${size.name}] All 16 production component states verified and captured.`);
    }

    console.log('\nAll E2E browser and isolated component checks PASSED with 0 errors.');
    await browser.close();
  } finally {
    console.log('Stopping servers...');
    nextProcess.kill('SIGTERM');
    await harnessServer.close();
  }
}

run().catch((err) => {
  console.error('E2E Browser Test Failed:', err);
  process.exit(1);
});
