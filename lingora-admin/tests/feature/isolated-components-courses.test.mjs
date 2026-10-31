import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { startIsolatedServer } from './isolated-server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const TEST_PORT = 3011;
const TEST_URL = `http://127.0.0.1:${TEST_PORT}`;
const SCREENSHOT_DIR = '/home/tung/.codex/task-logs/slice-3-final-patch';

describe('S3-04: Courses & Units Isolated Component State & Interaction Suite', () => {
  let server;
  let browser;

  before(async () => {
    server = await startIsolatedServer(TEST_PORT);
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  });

  after(async () => {
    if (browser) await browser.close();
    if (server) await server.close();
  });

  // =========================================================================
  // 1. Course Catalog & Form Modal (POST / PATCH / Retries / Stale Level Rejection)
  // =========================================================================

  test('CourseFormModal POST create held pending locks, prevents duplicate submit, dependent level updates, and reopens cleanly', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`${TEST_URL}?state=courses-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btnOpenCreateCourse', { state: 'visible' });

    // 1. Open create modal
    await page.click('#btnOpenCreateCourse');
    await page.waitForSelector('#courseFormModal', { state: 'visible' });

    // Initial focus on vi input
    await page.waitForFunction(() => document.activeElement?.id === 'inputCourseNameVi');
    const isViFocused = await page.evaluate(() => document.activeElement?.id === 'inputCourseNameVi');
    assert.equal(isViFocused, true, 'Vi input must be focused on open');

    // Select language & framework
    await page.selectOption('#selectCourseLanguage', '22222222-2222-4222-8222-222222222222');
    await page.selectOption('#selectCourseFramework', '11111111-1111-4111-8111-111111111111');

    // Wait for levels to load for framework
    await page.waitForFunction(() => {
      const select = document.querySelector('#selectCourseDefaultStartLevel');
      return select && select.options.length > 1;
    });

    await page.selectOption('#selectCourseDefaultStartLevel', 'aaaa1111-1111-4111-8111-111111111111');
    await page.fill('#inputCourseNameVi', 'heldpost');
    await page.fill('#inputCourseNameEn', 'Held Course');

    // 2. Pending lock on rapid submit
    await page.evaluate(() => {
      window.__submitCount = 0;
      const origFetch = window.fetch;
      window.fetch = (url, opts) => {
        if (opts?.method === 'POST') {
          window.__submitCount++;
        }
        return origFetch(url, opts);
      };
      document.querySelector('#btnSubmitCourseModal').click();
      document.querySelector('#btnSubmitCourseModal').click();
    });

    const isPending = await page.evaluate(() => {
      const btn = document.querySelector('#btnSubmitCourseModal');
      const input = document.querySelector('#inputCourseNameVi');
      return btn?.disabled && input?.disabled && btn?.textContent?.trim() === 'Đang tạo...';
    });
    assert.equal(isPending, true, 'Submit button and inputs must be locked while pending');

    const submitCount = await page.evaluate(() => window.__submitCount);
    assert.equal(submitCount, 1, 'Duplicate submit clicks must be ignored');

    // Wait for held request to finish (450ms)
    await page.waitForSelector('#courseFormModal', { state: 'hidden' });

    // 3. Dependent level updates: changing framework immediately clears stale level
    await page.click('#btnOpenCreateCourse');
    await page.waitForSelector('#courseFormModal', { state: 'visible' });

    await page.selectOption('#selectCourseLanguage', '22222222-2222-4222-8222-222222222222');
    await page.selectOption('#selectCourseFramework', '11111111-1111-4111-8111-111111111111');
    await page.waitForFunction(() => {
      const select = document.querySelector('#selectCourseDefaultStartLevel');
      return select && select.options.length > 1;
    });
    await page.selectOption('#selectCourseDefaultStartLevel', 'aaaa1111-1111-4111-8111-111111111111');
    assert.equal(await page.inputValue('#selectCourseDefaultStartLevel'), 'aaaa1111-1111-4111-8111-111111111111');

    // Switch to another framework (ACTFL has 0 levels in mock) -> level immediately reset to empty
    await page.selectOption('#selectCourseFramework', '22222222-2222-4222-8222-222222222222');
    const resetLevelVal = await page.inputValue('#selectCourseDefaultStartLevel');
    assert.equal(resetLevelVal, '', 'Changing framework must immediately reset defaultStartLevel');

    // Close and reopen cleanly
    await page.click('#btnCloseCourseModal');
    await page.waitForSelector('#courseFormModal', { state: 'hidden' });

    await page.click('#btnOpenCreateCourse');
    await page.waitForSelector('#courseFormModal', { state: 'visible' });
    const freshValues = await page.evaluate(() => ({
      vi: document.querySelector('#inputCourseNameVi')?.value,
      en: document.querySelector('#inputCourseNameEn')?.value,
      lang: document.querySelector('#selectCourseLanguage')?.value,
      fw: document.querySelector('#selectCourseFramework')?.value,
      lvl: document.querySelector('#selectCourseDefaultStartLevel')?.value,
    }));
    assert.equal(freshValues.vi, '');
    assert.equal(freshValues.en, '');
    assert.equal(freshValues.lang, '');
    assert.equal(freshValues.fw, '');
    assert.equal(freshValues.lvl, '');

    assert.equal(consoleErrors.length, 0, `Unexpected console errors: ${consoleErrors.join(', ')}`);
    await context.close();
  });

  test('CourseFormModal in-memory retry on 503 preserves user inputs, clears errors on edit, and submits successfully', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=courses-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btnOpenCreateCourse', { state: 'visible' });

    await page.click('#btnOpenCreateCourse');
    await page.waitForSelector('#courseFormModal', { state: 'visible' });

    await page.selectOption('#selectCourseLanguage', '22222222-2222-4222-8222-222222222222');
    await page.selectOption('#selectCourseFramework', '11111111-1111-4111-8111-111111111111');
    await page.waitForFunction(() => {
      const select = document.querySelector('#selectCourseDefaultStartLevel');
      return select && select.options.length > 1;
    });
    await page.selectOption('#selectCourseDefaultStartLevel', 'aaaa1111-1111-4111-8111-111111111111');

    // Trigger 503 error
    await page.fill('#inputCourseNameVi', 'err503');
    await page.fill('#inputCourseNameEn', 'Retry Candidate Course');
    await page.click('#btnSubmitCourseModal');

    // General error visible
    await page.waitForSelector('#courseFormGeneralError', { state: 'visible' });
    const errText = await page.textContent('#courseFormGeneralError');
    assert.ok(errText.includes('Cơ sở dữ liệu tạm thời không phản hồi'));

    // Verify inputs retained for in-memory retry
    const retained = await page.evaluate(() => ({
      vi: document.querySelector('#inputCourseNameVi')?.value,
      en: document.querySelector('#inputCourseNameEn')?.value,
      lang: document.querySelector('#selectCourseLanguage')?.value,
      fw: document.querySelector('#selectCourseFramework')?.value,
      lvl: document.querySelector('#selectCourseDefaultStartLevel')?.value,
    }));
    assert.equal(retained.vi, 'err503');
    assert.equal(retained.en, 'Retry Candidate Course');
    assert.equal(retained.lang, '22222222-2222-4222-8222-222222222222');
    assert.equal(retained.fw, '11111111-1111-4111-8111-111111111111');
    assert.equal(retained.lvl, 'aaaa1111-1111-4111-8111-111111111111');

    // Fix name and retry
    await page.fill('#inputCourseNameVi', 'Khóa học Thử Lại Thành Công');
    await page.click('#btnSubmitCourseModal');

    await page.waitForSelector('#courseFormModal', { state: 'hidden' });
    const tableText = await page.textContent('#populatedCoursesTable');
    assert.ok(tableText.includes('Khóa học Thử Lại Thành Công'));

    await context.close();
  });

  test('CourseFormModal PATCH edit held pending lock, Escape/backdrop blocked, and clears vi locale', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=courses-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedCoursesTable', { state: 'visible' });

    // Open edit modal on course 33333333-3333-4333-8333-333333333030
    await page.click('#btn-edit-course-33333333-3333-4333-8333-333333333030');
    await page.waitForSelector('#courseFormModal', { state: 'visible' });

    // Prefilled values check
    const prefilled = await page.evaluate(() => ({
      vi: document.querySelector('#inputCourseNameVi')?.value,
      en: document.querySelector('#inputCourseNameEn')?.value,
      isActive: document.querySelector('#checkboxCourseIsActive')?.checked,
    }));
    assert.equal(prefilled.vi, 'Tiếng Anh Giao Tiếp');
    assert.equal(prefilled.en, 'Conversational English');
    assert.equal(prefilled.isActive, true);

    // Wait for the modal's delayed initial focus before typing into either locale.
    await page.waitForFunction(() => document.activeElement?.id === 'inputCourseNameVi');

    // Set heldpatch name
    await page.fill('#inputCourseNameVi', 'heldpatch');
    await page.fill('#inputCourseNameEn', 'Conversational English Only');

    // Hold until every pending assertion finishes; a fixed450ms server delay can expire between actions.
    let releasePatch;
    const heldPatch = new Promise(resolve => { releasePatch = resolve; });
    await page.route('**/api/courses/*', async route => {
      if (route.request().method() === 'PATCH') await heldPatch;
      await route.continue();
    });
    const requestPromise = page.waitForRequest(r => r.method() === 'PATCH', { timeout: 5000 });
    try {
      await page.evaluate(() => {
        window.__patchCount = 0;
        const origFetch = window.fetch;
        window.fetch = (url, opts) => {
          if (opts?.method === 'PATCH') {
            window.__patchCount++;
          }
          return origFetch(url, opts);
        };
        document.querySelector('#btnSubmitCourseModal').click();
        document.querySelector('#btnSubmitCourseModal').click();
      });
      const patchRequest = await requestPromise;
      assert.equal(patchRequest.postDataJSON().names.vi, 'heldpatch');
      assert.equal(patchRequest.postDataJSON().names.en, 'Conversational English Only');

      const isPending = await page.evaluate(() => {
        const btn = document.querySelector('#btnSubmitCourseModal');
        const input = document.querySelector('#inputCourseNameVi');
        const cancel = document.querySelector('#btnCancelCourseModal');
        const close = document.querySelector('#btnCloseCourseModal');
        return btn?.disabled && input?.disabled && cancel?.disabled && close?.disabled && btn?.textContent?.trim() === 'Đang lưu...';
      });
      assert.equal(isPending, true, 'Controls must be locked during pending PATCH');

      const patchCount = await page.evaluate(() => window.__patchCount);
      assert.equal(patchCount, 1, 'Duplicate PATCH submits ignored');

      // Escape and backdrop click blocked
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#courseFormModal').isVisible(), true);
      await page.click('#courseFormModal', { position: { x: 5, y: 5 } });
      assert.equal(await page.locator('#courseFormModal').isVisible(), true);

      // Wait for held PATCH to finish
      releasePatch();
      await page.waitForSelector('#courseFormModal', { state: 'hidden' });

    } finally { releasePatch(); await context.close(); }
  });

  test('CourseDeleteModal held pending locks, in-use error (409) retention vs successful deletion and focus restoration (R5)', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=courses-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedCoursesTable', { state: 'visible' });

    // 1. In-use restriction test on course with units (33333333-3333-4333-8333-333333333030 has units)
    await page.click('#btn-delete-course-33333333-3333-4333-8333-333333333030');
    await page.waitForSelector('#courseDeleteModal', { state: 'visible' });

    // Initial focus strictly on Cancel button
    await page.waitForFunction(() => document.activeElement?.id === 'btnCancelCourseDelete');
    assert.equal(await page.evaluate(() => document.activeElement?.id === 'btnCancelCourseDelete'), true);

    // Confirm deletion -> 409 in-use error
    await page.click('#confirmDeleteCourseBtn');
    await page.waitForSelector('#courseDeleteError', { state: 'visible' });
    const inUseMsg = await page.textContent('#courseDeleteError');
    assert.ok(inUseMsg.includes('Khóa học đã có đơn vị bài học, không thể xóa.'));

    // Cancel closes modal and restores focus
    await page.click('#btnCancelCourseDelete');
    await page.waitForSelector('#courseDeleteModal', { state: 'hidden' });

    await page.waitForFunction(() => document.activeElement?.id === 'btn-delete-course-33333333-3333-4333-8333-333333333030');
    const activeAfterClose = await page.evaluate(() => document.activeElement?.id);
    assert.equal(activeAfterClose, 'btn-delete-course-33333333-3333-4333-8333-333333333030', 'Focus must restore to trigger');

    // 2. Add an empty course first to test clean deletion
    await page.click('#btnOpenCreateCourse');
    await page.waitForSelector('#courseFormModal', { state: 'visible' });
    await page.selectOption('#selectCourseLanguage', '22222222-2222-4222-8222-222222222222');
    await page.selectOption('#selectCourseFramework', '11111111-1111-4111-8111-111111111111');
    await page.waitForFunction(() => {
      const select = document.querySelector('#selectCourseDefaultStartLevel');
      return select && select.options.length > 1;
    });
    await page.selectOption('#selectCourseDefaultStartLevel', 'aaaa1111-1111-4111-8111-111111111111');
    await page.fill('#inputCourseNameVi', 'Khóa học Xóa Thử Nghiệm');
    await page.click('#btnSubmitCourseModal');
    await page.waitForSelector('#courseFormModal', { state: 'hidden' });

    // Verify row added
    const newCourseRow = page.locator('#row-course-33333333-3333-4333-8333-999999999999');
    await newCourseRow.waitFor({ state: 'visible' });

    // Delete the new course (mock server allows 33333333-3333-4333-8333-999999999999)
    await page.click('#btn-delete-course-33333333-3333-4333-8333-999999999999');
    await page.waitForSelector('#courseDeleteModal', { state: 'visible' });

    await page.click('#confirmDeleteCourseBtn');
    await page.waitForSelector('#courseDeleteModal', { state: 'hidden' });

    // Verify row removed
    assert.equal(await newCourseRow.count(), 0, 'Deleted course row must be removed');

    // Verify status announced
    const statusText = await page.textContent('#courseMutationStatus');
    assert.ok(statusText.includes('Đã xóa khóa học'));

    // R5: Verify focus restored to surviving row or action, NOT BODY
    await page.waitForFunction(() => document.activeElement && document.activeElement !== document.body);
    const activeEl = await page.evaluate(() => ({
      id: document.activeElement?.id,
      isBody: document.activeElement === document.body,
    }));
    assert.equal(activeEl.isBody, false, 'Focus must NOT land on body after course deletion');

    await context.close();
  });

  // =========================================================================
  // 2. Units Catalog & Form Modal (POST / PATCH / 409 Triple / Retries)
  // =========================================================================

  test('UnitFormModal POST create held pending locks, prevents duplicate submit, retries on 409 duplicate (Course, Level, position), and reopens cleanly', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=units-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btnOpenCreateUnit', { state: 'visible' });

    // Verify parent identity banner
    const bannerText = await page.textContent('#parentIdentityBanner');
    assert.ok(bannerText.includes('Tiếng Anh Giao Tiếp'));
    assert.ok(bannerText.includes('CEFR'));
    assert.ok(bannerText.includes('A1'));

    // 1. Open create modal
    await page.click('#btnOpenCreateUnit');
    await page.waitForSelector('#unitFormModal', { state: 'visible' });

    // Verify position label context
    const positionLabel = await page.textContent('label[for="inputUnitPosition"]');
    assert.ok(positionLabel.includes('Thứ tự vị trí'), 'Position input must be labeled within level');

    // Initial focus on level select
    await page.waitForFunction(() => document.activeElement?.id === 'selectUnitLevel');
    assert.equal(await page.evaluate(() => document.activeElement?.id === 'selectUnitLevel'), true);

    // 2. Held POST pending lock
    await page.selectOption('#selectUnitLevel', 'aaaa1111-1111-4111-8111-111111111111');
    await page.fill('#inputUnitPosition', '5');
    await page.fill('#inputUnitCode', 'UNIT-05');
    await page.fill('#inputUnitNameVi', 'heldpost');

    await page.evaluate(() => {
      window.__unitSubmitCount = 0;
      const origFetch = window.fetch;
      window.fetch = (url, opts) => {
        if (opts?.method === 'POST') {
          window.__unitSubmitCount++;
        }
        return origFetch(url, opts);
      };
      document.querySelector('#btnSubmitUnitModal').click();
      document.querySelector('#btnSubmitUnitModal').click();
    });

    const isPending = await page.evaluate(() => {
      const btn = document.querySelector('#btnSubmitUnitModal');
      const input = document.querySelector('#inputUnitPosition');
      return btn?.disabled && input?.disabled && btn?.textContent?.trim() === 'Đang tạo...';
    });
    assert.equal(isPending, true, 'Unit submit button and inputs must be locked while pending');

    const submitCount = await page.evaluate(() => window.__unitSubmitCount);
    assert.equal(submitCount, 1, 'Duplicate unit submit clicks must be ignored');

    // Wait for held request to finish (450ms)
    await page.waitForSelector('#unitFormModal', { state: 'hidden' });

    // 3. Test 409 duplicate position rejection and focus error
    await page.click('#btnOpenCreateUnit');
    await page.waitForSelector('#unitFormModal', { state: 'visible' });

    await page.selectOption('#selectUnitLevel', 'aaaa1111-1111-4111-8111-111111111111');
    // Position 1 already exists for level A1 in mock
    await page.fill('#inputUnitPosition', '1');
    await page.fill('#inputUnitCode', 'UNIT-DUP');
    await page.fill('#inputUnitNameVi', 'Bài trùng lặp');

    await page.click('#btnSubmitUnitModal');
    await page.waitForSelector('#unitPositionError', { state: 'visible' });
    await page.waitForFunction(() => document.activeElement?.id === 'inputUnitPosition');

    // Verify exact input is retained
    const retained = await page.evaluate(() => ({
      level: document.querySelector('#selectUnitLevel')?.value,
      pos: document.querySelector('#inputUnitPosition')?.value,
      code: document.querySelector('#inputUnitCode')?.value,
      vi: document.querySelector('#inputUnitNameVi')?.value,
      focusedId: document.activeElement?.id,
    }));
    assert.equal(retained.level, 'aaaa1111-1111-4111-8111-111111111111');
    assert.equal(retained.pos, '1');
    assert.equal(retained.code, 'UNIT-DUP');
    assert.equal(retained.vi, 'Bài trùng lặp');
    assert.equal(retained.focusedId, 'inputUnitPosition', 'Position input must be focused on 409 position error');

    // Fix error by changing position to 2 and retry
    await page.fill('#inputUnitPosition', '2');
    await page.click('#btnSubmitUnitModal');
    await page.waitForSelector('#unitFormModal', { state: 'hidden' });

    // Verify row added to table
    const tableText = await page.textContent('#populatedUnitsTable');
    assert.ok(tableText.includes('UNIT-DUP'));

    // 4. Fresh reopen must be clear
    await page.click('#btnOpenCreateUnit');
    await page.waitForSelector('#unitFormModal', { state: 'visible' });
    const freshValues = await page.evaluate(() => ({
      pos: document.querySelector('#inputUnitPosition')?.value,
      code: document.querySelector('#inputUnitCode')?.value,
      vi: document.querySelector('#inputUnitNameVi')?.value,
    }));
    assert.equal(freshValues.pos, '1', 'Fresh reopen resets position to initial default 1');
    assert.equal(freshValues.code, '');
    assert.equal(freshValues.vi, '');

    await context.close();
  });

  test('UnitDeleteModal held pending locks, in-use restriction (409) vs successful deletion and focus restoration (R5)', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=units-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedUnitsTable', { state: 'visible' });

    // 1. In-use restriction on UNIT-01 (44444444-4444-4444-8444-444444444040 has lessons)
    await page.click('#btn-delete-unit-44444444-4444-4444-8444-444444444040');
    await page.waitForSelector('#unitDeleteModal', { state: 'visible' });

    // Initial focus on Cancel
    await page.waitForFunction(() => document.activeElement?.id === 'btnCancelUnitDelete');
    assert.equal(await page.evaluate(() => document.activeElement?.id === 'btnCancelUnitDelete'), true);

    await page.click('#confirmDeleteUnitBtn');
    await page.waitForSelector('#unitDeleteError', { state: 'visible' });
    const inUseMsg = await page.textContent('#unitDeleteError');
    assert.ok(inUseMsg.includes('Đơn vị bài học đang chứa bài học, không thể xóa.'));

    await page.click('#btnCancelUnitDelete');
    await page.waitForSelector('#unitDeleteModal', { state: 'hidden' });

    // 2. Add an empty unit and delete it successfully
    await page.click('#btnOpenCreateUnit');
    await page.waitForSelector('#unitFormModal', { state: 'visible' });
    await page.selectOption('#selectUnitLevel', 'aaaa1111-1111-4111-8111-111111111111');
    await page.fill('#inputUnitPosition', '10');
    await page.fill('#inputUnitCode', 'UNIT-TEMP');
    await page.fill('#inputUnitNameVi', 'Bài học tạm xóa');
    await page.click('#btnSubmitUnitModal');
    await page.waitForSelector('#unitFormModal', { state: 'hidden' });

    const newUnitRow = page.locator('#row-unit-44444444-4444-4444-8444-999999999999');
    await newUnitRow.waitFor({ state: 'visible' });

    // Delete the new unit
    await page.click('#btn-delete-unit-44444444-4444-4444-8444-999999999999');
    await page.waitForSelector('#unitDeleteModal', { state: 'visible' });

    await page.click('#confirmDeleteUnitBtn');
    await page.waitForSelector('#unitDeleteModal', { state: 'hidden' });

    // Verify removed
    assert.equal(await newUnitRow.count(), 0);
    const statusText = await page.textContent('#unitMutationStatus');
    assert.ok(statusText.includes('Đã xóa đơn vị bài học'));

    // Focus restoration check
    await page.waitForFunction(() => document.activeElement && document.activeElement !== document.body);
    const isBody = await page.evaluate(() => document.activeElement === document.body);
    assert.equal(isBody, false, 'Focus must NOT land on body after unit deletion');

    await context.close();
  });

  // =========================================================================
  // 3. Security Boundaries & Denial Logout Cleanups (R4)
  // =========================================================================

  test('CoursesCatalog and UnitsCatalog on 403 suppress mutation controls and logout cleans up active drafts', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const activeAdminId = '00000000-0000-4000-8000-000000000001';
    const otherAccountId = '99999999-9999-4999-8999-999999999999';

    // 1. Courses Catalog 403 test
    await page.goto(`${TEST_URL}?state=courses-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btnOpenCreateCourse', { state: 'visible' });

    // Seed drafts
    await page.evaluate(({ activeAdminId, otherAccountId }) => {
      window.saveDraft(activeAdminId, { mode: 'create', code: 'es', vi: 'Tiếng Tây Ban Nha' });
      window.saveDraft(otherAccountId, { mode: 'create', code: 'fr', vi: 'Tiếng Pháp' });
      sessionStorage.setItem('unrelated_auth_key', 'keep_this_token');
    }, { activeAdminId, otherAccountId });

    await page.click('#btnOpenCreateCourse');
    await page.waitForSelector('#courseFormModal', { state: 'visible' });

    await page.selectOption('#selectCourseLanguage', '22222222-2222-4222-8222-222222222222');
    await page.selectOption('#selectCourseFramework', '11111111-1111-4111-8111-111111111111');
    await page.waitForFunction(() => {
      const select = document.querySelector('#selectCourseDefaultStartLevel');
      return select && select.options.length > 1;
    });
    await page.selectOption('#selectCourseDefaultStartLevel', 'aaaa1111-1111-4111-8111-111111111111');
    await page.fill('#inputCourseNameVi', 'err403');
    await page.click('#btnSubmitCourseModal');

    // 403 banner displayed
    await page.waitForSelector('#forbiddenBanner', { state: 'visible' });
    const bannerMsg = await page.textContent('#forbiddenBanner');
    assert.ok(bannerMsg.includes('Truy cập bị từ chối:'));

    // Mutation controls suppressed
    assert.equal(await page.locator('#populatedCoursesTable').count(), 0);
    assert.equal(await page.locator('#btnOpenCreateCourse').count(), 0);

    // Logout button cleans up drafts and redirects
    let logoutReq = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/auth/logout') && req.method() === 'POST') {
        logoutReq = true;
      }
    });

    await page.click('#forbiddenLogoutBtn');
    await page.waitForURL('**/login', { timeout: 5000 });
    assert.equal(logoutReq, true, 'Logout API must be called');

    const storageAfter = await page.evaluate(({ activeAdminId, otherAccountId }) => ({
      activeDraft: sessionStorage.getItem('lingora_draft_lang_' + activeAdminId),
      otherDraft: sessionStorage.getItem('lingora_draft_lang_' + otherAccountId),
      allDraftKeys: Object.keys(sessionStorage).filter((k) => k.startsWith('lingora_draft_')),
      unrelated: sessionStorage.getItem('unrelated_auth_key'),
    }), { activeAdminId, otherAccountId });

    assert.equal(storageAfter.activeDraft, null, 'Active draft must be removed on logout');
    assert.equal(storageAfter.otherDraft, null, 'All draft storage cleared on security logout');
    assert.equal(storageAfter.allDraftKeys.length, 0, 'No lingora_draft_* keys should remain in sessionStorage');
    assert.equal(storageAfter.unrelated, 'keep_this_token', 'Unrelated sessionStorage keys preserved');

    // 2. Units Catalog 403 test
    const page2 = await context.newPage();
    await page2.goto(`${TEST_URL}?state=units-populated`, { waitUntil: 'domcontentloaded' });
    await page2.waitForSelector('#btnOpenCreateUnit', { state: 'visible' });

    // Seed draft in session storage
    await page2.evaluate(({ activeAdminId }) => {
      sessionStorage.setItem('lingora_draft_lang_' + activeAdminId, JSON.stringify({
        draft: { code: 'UNIT-DRAFT' },
        timestamp: Date.now(),
      }));
      sessionStorage.setItem('unrelated_units_key', 'keep_units_val');
    }, { activeAdminId });

    // Trigger 403 in UnitFormModal
    await page2.click('#btnOpenCreateUnit');
    await page2.waitForSelector('#unitFormModal', { state: 'visible' });
    await page2.selectOption('#selectUnitLevel', 'aaaa1111-1111-4111-8111-111111111111');
    await page2.fill('#inputUnitPosition', '1');
    await page2.fill('#inputUnitCode', 'err403');
    await page2.click('#btnSubmitUnitModal');

    // 403 banner displayed in UnitsCatalog
    await page2.waitForSelector('#forbiddenBanner', { state: 'visible' });
    assert.equal(await page2.locator('#populatedUnitsTable').count(), 0);
    assert.equal(await page2.locator('#btnOpenCreateUnit').count(), 0);

    // Logout from UnitsCatalog cleans up drafts
    await page2.click('#forbiddenLogoutBtn');
    await page2.waitForURL('**/login', { timeout: 5000 });

    const unitsStorageAfter = await page2.evaluate(({ activeAdminId }) => ({
      activeDraft: sessionStorage.getItem('lingora_draft_lang_' + activeAdminId),
      unrelated: sessionStorage.getItem('unrelated_units_key'),
    }), { activeAdminId });

    assert.equal(unitsStorageAfter.activeDraft, null, 'UnitsCatalog logout removes active draft');
    assert.equal(unitsStorageAfter.unrelated, 'keep_units_val', 'Unrelated key preserved on units logout');

    // 3. Storage exception resilience: failing storage does not break logout redirect
    const page3 = await context.newPage();
    await page3.goto(`${TEST_URL}?state=courses-populated`, { waitUntil: 'domcontentloaded' });
    await page3.waitForSelector('#btnOpenCreateCourse', { state: 'visible' });

    // Trigger 403
    await page3.click('#btnOpenCreateCourse');
    await page3.waitForSelector('#courseFormModal', { state: 'visible' });
    await page3.selectOption('#selectCourseLanguage', '22222222-2222-4222-8222-222222222222');
    await page3.selectOption('#selectCourseFramework', '11111111-1111-4111-8111-111111111111');
    await page3.waitForFunction(() => {
      const select = document.querySelector('#selectCourseDefaultStartLevel');
      return select && select.options.length > 1;
    });
    await page3.selectOption('#selectCourseDefaultStartLevel', 'aaaa1111-1111-4111-8111-111111111111');
    await page3.fill('#inputCourseNameVi', 'err403');
    await page3.click('#btnSubmitCourseModal');
    await page3.waitForSelector('#forbiddenBanner', { state: 'visible' });

    // Poison sessionStorage.removeItem / clear to throw exception
    await page3.evaluate(() => {
      Storage.prototype.removeItem = () => { throw new Error('Quota/Security error'); };
      Storage.prototype.clear = () => { throw new Error('Quota/Security error'); };
    });

    // Logout must still redirect cleanly to /login despite storage exception
    await page3.click('#forbiddenLogoutBtn');
    await page3.waitForURL('**/login', { timeout: 5000 });

    await context.close();
  });

  test('UnitFormModal PATCH edit modal populates current values and reconciles catalogue table row on success', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=units-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedUnitsTable', { state: 'visible' });

    // Click edit on UNIT-01
    await page.click('#btn-edit-unit-44444444-4444-4444-8444-444444444040');
    await page.waitForSelector('#unitFormModal', { state: 'visible' });

    // Verify modal title and populated inputs
    const title = await page.textContent('#unitModalTitle');
    assert.equal(title, 'Chỉnh sửa đơn vị bài học');
    const values = await page.evaluate(() => ({
      level: document.querySelector('#selectUnitLevel')?.value,
      pos: document.querySelector('#inputUnitPosition')?.value,
      code: document.querySelector('#inputUnitCode')?.value,
      vi: document.querySelector('#inputUnitNameVi')?.value,
    }));
    assert.equal(values.code, 'UNIT-01');
    assert.equal(values.pos, '1');

    // Change unit code and name
    await page.fill('#inputUnitCode', 'UNIT-01-EDITED');
    await page.fill('#inputUnitNameVi', 'Bài 1 Đã Đổi Tên');
    await page.click('#btnSubmitUnitModal');
    await page.waitForSelector('#unitFormModal', { state: 'hidden' });

    // Verify catalogue table reconciled
    const rowText = await page.textContent('#row-unit-44444444-4444-4444-8444-444444444040');
    assert.ok(rowText.includes('UNIT-01-EDITED'));
    assert.ok(rowText.includes('Bài 1 Đã Đổi Tên'));

    // Status announced
    const statusText = await page.textContent('#unitMutationStatus');
    assert.ok(statusText.includes('Đã cập nhật đơn vị bài học'));

    await context.close();
  });

  test('401 triggers SessionLostModal and 503 triggers retry view in CoursesCatalog and UnitsCatalog', async () => {
    const context = await browser.newContext();

    // 1. Course modal 401 triggers SessionLostModal
    const page1 = await context.newPage();
    await page1.goto(`${TEST_URL}?state=courses-populated`, { waitUntil: 'domcontentloaded' });
    await page1.waitForSelector('#btnOpenCreateCourse', { state: 'visible' });
    await page1.click('#btnOpenCreateCourse');
    await page1.waitForSelector('#courseFormModal', { state: 'visible' });
    await page1.selectOption('#selectCourseLanguage', '22222222-2222-4222-8222-222222222222');
    await page1.selectOption('#selectCourseFramework', '11111111-1111-4111-8111-111111111111');
    await page1.waitForFunction(() => {
      const select = document.querySelector('#selectCourseDefaultStartLevel');
      return select && select.options.length > 1;
    });
    await page1.selectOption('#selectCourseDefaultStartLevel', 'aaaa1111-1111-4111-8111-111111111111');
    await page1.fill('#inputCourseNameVi', 'expire401');
    await page1.click('#btnSubmitCourseModal');
    await page1.waitForSelector('#sessionLostModal', { state: 'visible' });

    // 2. Unit modal 401 triggers SessionLostModal
    const page2 = await context.newPage();
    await page2.goto(`${TEST_URL}?state=units-populated`, { waitUntil: 'domcontentloaded' });
    await page2.waitForSelector('#btnOpenCreateUnit', { state: 'visible' });
    await page2.click('#btnOpenCreateUnit');
    await page2.waitForSelector('#unitFormModal', { state: 'visible' });
    await page2.selectOption('#selectUnitLevel', 'aaaa1111-1111-4111-8111-111111111111');
    await page2.fill('#inputUnitPosition', '1');
    await page2.fill('#inputUnitCode', 'expire401');
    await page2.click('#btnSubmitUnitModal');
    await page2.waitForSelector('#sessionLostModal', { state: 'visible' });

    // 3. CoursesCatalog initial error state with retry
    const page3 = await context.newPage();
    await page3.goto(`${TEST_URL}?state=courses-fetch-error`, { waitUntil: 'domcontentloaded' });
    await page3.waitForSelector('#fetchErrorState', { state: 'visible' });
    assert.ok((await page3.textContent('#fetchErrorState')).includes('Không thể kết nối'));
    await page3.click('#btnRetryFetchCourses');
    await page3.waitForSelector('#populatedCoursesTable', { state: 'visible' });

    // 4. UnitsCatalog initial error state with retry
    const page4 = await context.newPage();
    await page4.goto(`${TEST_URL}?state=units-fetch-error`, { waitUntil: 'domcontentloaded' });
    await page4.waitForSelector('#fetchErrorState', { state: 'visible' });
    assert.ok((await page4.textContent('#fetchErrorState')).includes('Không thể kết nối'));
    await page4.click('#btnRetryFetchUnits');
    await page4.waitForSelector('#populatedUnitsTable', { state: 'visible' });

    await context.close();
  });

  // =========================================================================
  // 4. Production Page Integration (Real Compiler Seam)
  // =========================================================================

  test('Real production pages compile and wire navigation links correctly', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Courses page wire
    await page.goto(`${TEST_URL}?state=page-courses-wire`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedCoursesTable', { state: 'visible' });

    // Link to units points to /courses/[courseId]
    const unitLink = page.locator('#linkCourseUnits-33333333-3333-4333-8333-333333333030');
    await unitLink.waitFor({ state: 'visible' });
    const href = await unitLink.getAttribute('href');
    assert.equal(href, '/courses/33333333-3333-4333-8333-333333333030');

    // 2. Course detail / Units page wire
    await page.goto(`${TEST_URL}?state=page-course-detail-wire`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedUnitsTable', { state: 'visible' });

    // Back link points to /courses
    const backLink = page.locator('#linkBackToCourses');
    await backLink.waitFor({ state: 'visible' });
    const backHref = await backLink.getAttribute('href');
    assert.equal(backHref, '/courses');

    await context.close();
  });

  // =========================================================================
  // 5. Playwright Visual & Keyboard Checks (1440x960 and 1100x800)
  // =========================================================================

  test('Visual layout and keyboard checks across responsive viewports with zero console errors', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // --- Viewport 1: Desktop 1440x960 ---
    await page.setViewportSize({ width: 1440, height: 960 });

    // Courses view screenshot
    await page.goto(`${TEST_URL}?state=courses-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedCoursesTable', { state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'courses-desktop-1440x960.png') });

    // Course modal screenshot
    await page.click('#btnOpenCreateCourse');
    await page.waitForSelector('#courseFormModal', { state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'course-modal-desktop-1440x960.png') });
    await page.click('#btnCloseCourseModal');
    await page.waitForSelector('#courseFormModal', { state: 'hidden' });

    // Units view screenshot
    await page.goto(`${TEST_URL}?state=units-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedUnitsTable', { state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'units-desktop-1440x960.png') });

    // Unit modal screenshot
    await page.click('#btnOpenCreateUnit');
    await page.waitForSelector('#unitFormModal', { state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'unit-modal-desktop-1440x960.png') });
    await page.click('#btnCloseUnitModal');
    await page.waitForSelector('#unitFormModal', { state: 'hidden' });

    // --- Viewport 2: Narrow Desktop 1100x800 ---
    await page.setViewportSize({ width: 1100, height: 800 });

    await page.goto(`${TEST_URL}?state=courses-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedCoursesTable', { state: 'visible' });
    await page.evaluate(() => document.fonts.ready);

    // Verify actions stay on a single line at 1100x800 viewport without wrapping
    const actionPositions = await page.evaluate(() => {
      const link = document.querySelector('.btn-text-levels')?.getBoundingClientRect();
      const edit = document.querySelector('.btn-text-edit')?.getBoundingClientRect();
      const del = document.querySelector('.btn-text-delete')?.getBoundingClientRect();
      return {
        linkTop: link?.top ?? 0,
        editTop: edit?.top ?? 0,
        delTop: del?.top ?? 0,
      };
    });
    assert.ok(
      Math.abs(actionPositions.linkTop - actionPositions.editTop) < 3,
      `Action link and edit button must be inline at 1100px (diff: ${Math.abs(actionPositions.linkTop - actionPositions.editTop)}px)`
    );
    assert.ok(
      Math.abs(actionPositions.editTop - actionPositions.delTop) < 3,
      `Action edit and delete button must be inline at 1100px (diff: ${Math.abs(actionPositions.editTop - actionPositions.delTop)}px)`
    );

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'courses-narrow-1100x800.png') });

    await page.goto(`${TEST_URL}?state=units-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedUnitsTable', { state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'units-narrow-1100x800.png') });

    // Keyboard tab navigation inside modal
    await page.click('#btnOpenCreateUnit');
    await page.waitForSelector('#unitFormModal', { state: 'visible' });

    // Tab through modal elements
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    assert.ok(focusedTag, 'Focused element must exist during tab navigation');

    await page.keyboard.press('Escape');
    await page.waitForSelector('#unitFormModal', { state: 'hidden' });

    assert.equal(consoleErrors.length, 0, `Visual check console errors: ${consoleErrors.join(', ')}`);
    await context.close();
  });

  // =========================================================================
  // 6. S3-FINAL-PATCH Targeted Regressions (A, B, C)
  // =========================================================================

  test('S3-FINAL-PATCH Regression A: Unit dependency retry preserves user inputs, retains/clears selection, locks pending mutation, reconciles server DTO, and reopens clean', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Open Unit create with dependency lookup failure (via compiler seam with failLevels)
    await page.goto(`${TEST_URL}?state=page-course-detail-wire&failLevels=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedUnitsTable', { state: 'visible' });

    await page.click('#btnOpenCreateUnit');
    await page.waitForSelector('#unitFormModal', { state: 'visible' });
    await page.waitForSelector('#btnRetryUnitLevels', { state: 'visible' });

    // 2. Fill non-default code, vi/en names, and position
    await page.fill('#inputUnitCode', 'RETAIN-ME');
    await page.fill('#inputUnitNameVi', 'Keep my unsaved name');
    await page.fill('#inputUnitNameEn', 'Keep English Name');
    await page.fill('#inputUnitPosition', '17');

    // 3. Retry fails once: intercept /levels with 500
    await page.route('**/api/frameworks/*/levels', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Lỗi máy chủ tạm thời khi tải cấp độ' } }),
      });
    }, { times: 1 });

    await page.click('#btnRetryUnitLevels');

    // Error alert remains, original typed values remain unchanged
    await page.waitForFunction(() => {
      const code = document.querySelector('#inputUnitCode')?.value;
      const vi = document.querySelector('#inputUnitNameVi')?.value;
      const pos = document.querySelector('#inputUnitPosition')?.value;
      return code === 'RETAIN-ME' && vi === 'Keep my unsaved name' && pos === '17';
    });

    const failedRetained = await page.evaluate(() => ({
      code: document.querySelector('#inputUnitCode')?.value,
      vi: document.querySelector('#inputUnitNameVi')?.value,
      en: document.querySelector('#inputUnitNameEn')?.value,
      pos: document.querySelector('#inputUnitPosition')?.value,
    }));
    assert.equal(failedRetained.code, 'RETAIN-ME', 'Code preserved on failed retry');
    assert.equal(failedRetained.vi, 'Keep my unsaved name', 'VI name preserved on failed retry');
    assert.equal(failedRetained.en, 'Keep English Name', 'EN name preserved on failed retry');
    assert.equal(failedRetained.pos, '17', 'Position preserved on failed retry');

    // 4. Retry succeeds: unintercepted request fetches valid levels
    await page.click('#btnRetryUnitLevels');
    await page.waitForFunction(() => {
      const select = document.querySelector('#selectUnitLevel');
      return select && select.options.length > 1;
    });

    const successRetained = await page.evaluate(() => ({
      code: document.querySelector('#inputUnitCode')?.value,
      vi: document.querySelector('#inputUnitNameVi')?.value,
      en: document.querySelector('#inputUnitNameEn')?.value,
      pos: document.querySelector('#inputUnitPosition')?.value,
    }));
    assert.equal(successRetained.code, 'RETAIN-ME', 'Code preserved on successful retry');
    assert.equal(successRetained.vi, 'Keep my unsaved name', 'VI name preserved on successful retry');
    assert.equal(successRetained.en, 'Keep English Name', 'EN name preserved on successful retry');
    assert.equal(successRetained.pos, '17', 'Position preserved on successful retry');

    // 5. Select loaded valid Level
    await page.selectOption('#selectUnitLevel', 'aaaa1111-1111-4111-8111-111111111111');

    // 6. Check pending mutation stays locked if an option response arrives / no duplicate submits
    await page.evaluate(() => {
      window.__submitClickCount = 0;
      const origFetch = window.fetch;
      window.fetch = (url, opts) => {
        if (opts?.method === 'POST') {
          window.__submitClickCount++;
        }
        return origFetch(url, opts);
      };
      document.querySelector('#btnSubmitUnitModal').click();
      document.querySelector('#btnSubmitUnitModal').click();
    });

    const submitCount = await page.evaluate(() => window.__submitClickCount);
    assert.equal(submitCount, 1, 'Duplicate submit clicks must be ignored while pending');

    // Modal closes on successful submission
    await page.waitForSelector('#unitFormModal', { state: 'hidden' });

    // Distinct server DTO updates table row
    const tableText = await page.textContent('#populatedUnitsTable');
    assert.ok(tableText.includes('RETAIN-ME'), 'New unit code must appear in table');
    assert.ok(tableText.includes('Keep my unsaved name'), 'New unit name must appear in table');

    // 7. Fresh reopen is clean (no stale input resurrection)
    await page.click('#btnOpenCreateUnit');
    await page.waitForSelector('#unitFormModal', { state: 'visible' });
    const freshReopen = await page.evaluate(() => ({
      pos: document.querySelector('#inputUnitPosition')?.value,
      code: document.querySelector('#inputUnitCode')?.value,
      vi: document.querySelector('#inputUnitNameVi')?.value,
      en: document.querySelector('#inputUnitNameEn')?.value,
    }));
    assert.equal(freshReopen.pos, '1', 'Reopen resets position to 1');
    assert.equal(freshReopen.code, '', 'Reopen resets code to empty');
    assert.equal(freshReopen.vi, '', 'Reopen resets vi to empty');
    assert.equal(freshReopen.en, '', 'Reopen resets en to empty');
    await page.click('#btnCloseUnitModal');
    await page.waitForSelector('#unitFormModal', { state: 'hidden' });

    // 8. Edit mode level retry reconciliation: failed, empty, different-ID, and same-ID outcomes

    // 8a. Failed lookup retains selection and typed user fields, and same-ID resolution preserves them through submission
    await page.goto(`${TEST_URL}?state=page-course-detail-wire&failLevels=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedUnitsTable', { state: 'visible' });

    await page.click('#btn-edit-unit-44444444-4444-4444-8444-444444444040');
    await page.waitForSelector('#unitFormModal', { state: 'visible' });
    await page.waitForSelector('#btnRetryUnitLevels', { state: 'visible' });

    await page.fill('#inputUnitCode', 'EDIT-FAIL-RETAIN');
    await page.fill('#inputUnitPosition', '21');
    await page.fill('#inputUnitNameVi', 'Tên thử nghiệm lỗi retry');
    await page.fill('#inputUnitNameEn', 'English retry fail name');

    // First retry fails: error alert remains, inputs and selection are retained
    await page.route('**/api/frameworks/*/levels', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Lỗi mạng khi tải cấp độ' } }),
      });
    }, { times: 1 });

    await page.click('#btnRetryUnitLevels');
    await page.waitForSelector('#btnRetryUnitLevels', { state: 'visible' });

    assert.equal(await page.inputValue('#inputUnitCode'), 'EDIT-FAIL-RETAIN', 'Code preserved across failed retry');
    assert.equal(await page.inputValue('#inputUnitPosition'), '21', 'Position preserved across failed retry');
    assert.equal(await page.inputValue('#inputUnitNameVi'), 'Tên thử nghiệm lỗi retry', 'VI name preserved across failed retry');
    assert.equal(await page.inputValue('#inputUnitNameEn'), 'English retry fail name', 'EN name preserved across failed retry');

    // Second retry succeeds with same ID: retains selection and typed inputs, allows successful PATCH
    const sameRetryPromise = page.waitForResponse((resp) => resp.url().includes('/levels') && resp.status() === 200);
    await page.route('**/api/frameworks/*/levels', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ id: 'aaaa1111-1111-4111-8111-111111111111', code: 'A1', position: 1, label: { vi: 'A1 Cơ bản' } }],
        }),
      });
    }, { times: 1 });

    await page.click('#btnRetryUnitLevels');
    await sameRetryPromise;
    await page.waitForFunction(() => {
      const sel = document.querySelector('#selectUnitLevel');
      return sel && sel.options.length > 1;
    });

    assert.equal(await page.inputValue('#selectUnitLevel'), 'aaaa1111-1111-4111-8111-111111111111', 'Same-ID reload retains selection across previous failed retry');
    assert.equal(await page.inputValue('#inputUnitCode'), 'EDIT-FAIL-RETAIN', 'Code preserved on same-ID reload');
    assert.equal(await page.inputValue('#inputUnitPosition'), '21', 'Position preserved on same-ID reload');
    assert.equal(await page.inputValue('#inputUnitNameVi'), 'Tên thử nghiệm lỗi retry', 'VI name preserved on same-ID reload');
    assert.equal(await page.inputValue('#inputUnitNameEn'), 'English retry fail name', 'EN name preserved on same-ID reload');

    let samePatchPayload = null;
    const samePatchListener = (req) => {
      if (req.method() === 'PATCH') samePatchPayload = JSON.parse(req.postData());
    };
    page.on('request', samePatchListener);

    await page.click('#btnSubmitUnitModal');
    await page.waitForSelector('#unitFormModal', { state: 'hidden' });

    assert.notEqual(samePatchPayload, null, 'PATCH request sent on same-ID submit');
    assert.equal(samePatchPayload.levelId, 'aaaa1111-1111-4111-8111-111111111111', 'PATCH retains same levelId');
    assert.equal(samePatchPayload.code, 'EDIT-FAIL-RETAIN', 'PATCH preserves typed code');
    assert.equal(samePatchPayload.position, 21, 'PATCH preserves typed position');
    assert.equal(samePatchPayload.names.vi, 'Tên thử nghiệm lỗi retry', 'PATCH preserves typed vi name');
    assert.equal(samePatchPayload.names.en, 'English retry fail name', 'PATCH preserves typed en name');
    page.off('request', samePatchListener);

    // 8b. Authoritative empty options clears absent selection, preserves typed fields, prevents stale PATCH
    await page.goto(`${TEST_URL}?state=page-course-detail-wire&failLevels=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedUnitsTable', { state: 'visible' });

    await page.click('#btn-edit-unit-44444444-4444-4444-8444-444444444040');
    await page.waitForSelector('#unitFormModal', { state: 'visible' });

    await page.fill('#inputUnitCode', 'STALE-LEVEL-PROBE');
    await page.fill('#inputUnitPosition', '17');
    await page.fill('#inputUnitNameVi', 'Keep non-default input');

    const emptyRetryPromise = page.waitForResponse((resp) => resp.url().includes('/levels') && resp.status() === 200);
    await page.route('**/api/frameworks/*/levels', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    }, { times: 1 });

    await page.click('#btnRetryUnitLevels');
    await emptyRetryPromise;
    await page.waitForSelector('#btnRetryUnitLevels', { state: 'hidden' });

    assert.equal(await page.inputValue('#selectUnitLevel'), '', 'Authoritative empty level options clears absent selection');
    assert.equal(await page.inputValue('#inputUnitCode'), 'STALE-LEVEL-PROBE', 'Code preserved on empty authoritative reload');
    assert.equal(await page.inputValue('#inputUnitPosition'), '17', 'Position preserved on empty authoritative reload');
    assert.equal(await page.inputValue('#inputUnitNameVi'), 'Keep non-default input', 'VI name preserved on empty authoritative reload');

    let emptyPatchPayload = null;
    const emptyPatchListener = (req) => {
      if (req.method() === 'PATCH') emptyPatchPayload = JSON.parse(req.postData());
    };
    page.on('request', emptyPatchListener);

    await page.click('#btnSubmitUnitModal');
    await page.waitForSelector('#unitLevelError', { state: 'visible' });

    assert.equal(emptyPatchPayload, null, 'No stale PATCH request sent when level selection cleared');
    assert.equal(await page.locator('#unitFormModal').isVisible(), true, 'Modal remains open on missing level');
    assert.ok((await page.textContent('#unitLevelError')).includes('Vui lòng chọn cấp độ'), 'Level validation error shown');
    page.off('request', emptyPatchListener);

    await page.click('#btnCloseUnitModal');
    await page.waitForSelector('#unitFormModal', { state: 'hidden' });

    // 8c. Authoritative different-ID options clears absent selection, preserves typed fields, blocks mutation until valid chosen
    await page.goto(`${TEST_URL}?state=page-course-detail-wire&failLevels=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedUnitsTable', { state: 'visible' });

    await page.click('#btn-edit-unit-44444444-4444-4444-8444-444444444040');
    await page.waitForSelector('#unitFormModal', { state: 'visible' });

    await page.fill('#inputUnitCode', 'EDIT-DIFF-LEVEL');
    await page.fill('#inputUnitPosition', '25');
    await page.fill('#inputUnitNameVi', 'Tên với level khác');

    const diffLevelId = 'bbbb2222-2222-4222-8222-222222222222';
    const diffRetryPromise = page.waitForResponse((resp) => resp.url().includes('/levels') && resp.status() === 200);
    await page.route('**/api/frameworks/*/levels', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ id: diffLevelId, code: 'B1', position: 2, label: { vi: 'B1 Trung cấp' } }],
        }),
      });
    }, { times: 1 });

    await page.click('#btnRetryUnitLevels');
    await diffRetryPromise;
    await page.waitForFunction(() => {
      const sel = document.querySelector('#selectUnitLevel');
      return sel && sel.options.length > 1;
    });

    assert.equal(await page.inputValue('#selectUnitLevel'), '', 'Authoritative different-ID options clears absent selection');
    assert.equal(await page.inputValue('#inputUnitCode'), 'EDIT-DIFF-LEVEL', 'Code preserved on different-ID reload');
    assert.equal(await page.inputValue('#inputUnitPosition'), '25', 'Position preserved on different-ID reload');
    assert.equal(await page.inputValue('#inputUnitNameVi'), 'Tên với level khác', 'VI name preserved on different-ID reload');

    let diffPatchPayload = null;
    const diffPatchListener = (req) => {
      if (req.method() === 'PATCH') diffPatchPayload = JSON.parse(req.postData());
    };
    page.on('request', diffPatchListener);

    await page.click('#btnSubmitUnitModal');
    await page.waitForSelector('#unitLevelError', { state: 'visible' });
    assert.equal(diffPatchPayload, null, 'No PATCH sent when selection is cleared for different ID');

    // Selecting valid newly loaded level allows successful mutation
    await page.selectOption('#selectUnitLevel', diffLevelId);
    assert.equal(await page.inputValue('#selectUnitLevel'), diffLevelId, 'Newly selected level active');

    await page.click('#btnSubmitUnitModal');
    await page.waitForSelector('#unitFormModal', { state: 'hidden' });

    assert.notEqual(diffPatchPayload, null, 'PATCH request sent once valid level chosen');
    assert.equal(diffPatchPayload.levelId, diffLevelId, 'PATCH payload contains selected different levelId');
    assert.equal(diffPatchPayload.code, 'EDIT-DIFF-LEVEL', 'PATCH payload preserves typed code');
    assert.equal(diffPatchPayload.position, 25, 'PATCH payload preserves typed position');
    assert.equal(diffPatchPayload.names.vi, 'Tên với level khác', 'PATCH payload preserves typed vi name');
    page.off('request', diffPatchListener);

    await context.close();
  });

  test('S3-FINAL-PATCH Regression B: Table-driven Course & Unit dependency 403 closes modal, releases inert, shows denial banner with usable Logout', async () => {
    const testCases = [
      {
        name: 'Course Language lookup 403',
        url: `${TEST_URL}?state=courses-unloaded-options`,
        interceptUrl: '**/api/languages',
        action: async (page) => {
          await page.click('#btnOpenCreateCourse');
        },
        modalSelector: '#courseFormModal',
        mutationButtonSelector: '#btnOpenCreateCourse',
      },
      {
        name: 'Course Framework lookup 403',
        url: `${TEST_URL}?state=courses-unloaded-options`,
        interceptUrl: '**/api/frameworks',
        action: async (page) => {
          await page.click('#btnOpenCreateCourse');
        },
        modalSelector: '#courseFormModal',
        mutationButtonSelector: '#btnOpenCreateCourse',
      },
      {
        name: 'Course Level lookup 403',
        url: `${TEST_URL}?state=courses-populated`,
        interceptUrl: '**/api/frameworks/*/levels',
        action: async (page) => {
          await page.click('#btnOpenCreateCourse');
          await page.waitForSelector('#courseFormModal', { state: 'visible' });
          await page.selectOption('#selectCourseFramework', '11111111-1111-4111-8111-111111111111');
        },
        modalSelector: '#courseFormModal',
        mutationButtonSelector: '#btnOpenCreateCourse',
      },
      {
        name: 'Unit Level retry 403',
        url: `${TEST_URL}?state=page-course-detail-wire&failLevels=true`,
        interceptUrl: '**/api/frameworks/*/levels',
        action: async (page) => {
          await page.click('#btnOpenCreateUnit');
          await page.waitForSelector('#unitFormModal', { state: 'visible' });
          await page.click('#btnRetryUnitLevels');
        },
        modalSelector: '#unitFormModal',
        mutationButtonSelector: '#btnOpenCreateUnit',
      },
    ];

    for (const tc of testCases) {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Intercept dependency lookup with 403
      await page.route(tc.interceptUrl, (route) => {
        route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'FORBIDDEN', message: `Truy cập bị từ chối: ${tc.name}` } }),
        });
      });

      // Track mutation POST requests to assert zero mutation calls
      let mutationRequestMade = false;
      page.on('request', (req) => {
        if ((req.url().includes('/api/courses') || req.url().includes('/api/units')) && req.method() === 'POST') {
          mutationRequestMade = true;
        }
      });

      await page.goto(tc.url, { waitUntil: 'domcontentloaded' });

      // Pre-seed unrelated storage that MUST be retained
      await page.evaluate(() => {
        sessionStorage.setItem('unrelated_auth_safe', 'do_not_delete_me');
      });

      // Trigger action
      await tc.action(page);

      // 1. Assert active modal is HIDDEN
      await page.waitForSelector(tc.modalSelector, { state: 'hidden' });
      assert.equal(await page.locator(tc.modalSelector).count(), 0, `${tc.name}: active modal must be removed from DOM or hidden`);

      // 2. Assert appContainer is NOT inert
      const isInert = await page.evaluate(() => {
        const c = document.getElementById('appContainer');
        return c?.hasAttribute('inert') ?? false;
      });
      assert.equal(isInert, false, `${tc.name}: appContainer must NOT remain inert on 403 denial`);

      // 3. Assert denial banner is visible
      await page.waitForSelector('#forbiddenBanner', { state: 'visible' });
      const bannerText = await page.textContent('#forbiddenBanner');
      assert.ok(bannerText.includes('Truy cập bị từ chối'), `${tc.name}: denial banner must be visible`);

      // 4. Assert create/edit mutation controls are hidden
      assert.equal(await page.locator(tc.mutationButtonSelector).count(), 0, `${tc.name}: create button must be hidden`);
      assert.equal(mutationRequestMade, false, `${tc.name}: no mutation requests must be issued`);

      // 5. Assert Logout button works: issues POST /api/auth/logout and navigates to /login
      let logoutReqIssued = false;
      page.on('request', (req) => {
        if (req.url().includes('/api/auth/logout') && req.method() === 'POST') {
          logoutReqIssued = true;
        }
      });

      await page.click('#forbiddenLogoutBtn');
      await page.waitForURL('**/login', { timeout: 5000 });
      assert.equal(logoutReqIssued, true, `${tc.name}: Logout button must issue POST /api/auth/logout`);

      // 6. Assert unrelated storage retained
      const unrelatedStorage = await page.evaluate(() => sessionStorage.getItem('unrelated_auth_safe'));
      assert.equal(unrelatedStorage, 'do_not_delete_me', `${tc.name}: unrelated storage must be retained`);

      await context.close();
    }
  });

  test('S3-FINAL-PATCH Regression C: Real catalogue -> generated href -> real detail compiler props with initialLevelsError -> retry callback -> create/edit callback -> server DTO reconciliation', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Production catalogue page -> extract generated href
    await page.goto(`${TEST_URL}?state=page-courses-wire`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedCoursesTable', { state: 'visible' });

    const unitLink = page.locator('#linkCourseUnits-33333333-3333-4333-8333-333333333030');
    await unitLink.waitFor({ state: 'visible' });
    const generatedHref = await unitLink.getAttribute('href');
    assert.equal(generatedHref, '/courses/33333333-3333-4333-8333-333333333030', 'Must render authoritative course href');

    // 2. Load detail page with real compiler props (simulating real service lookup failure for levels)
    await page.goto(`${TEST_URL}?state=page-course-detail-wire&failLevels=true`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedUnitsTable', { state: 'visible' });

    // Assert real compiler props passed faithfully without mock fallbacks
    const pageProps = await page.evaluate(() => window.__PAGE_PROPS__);
    assert.ok(pageProps, 'Production detail page props must exist on window');
    assert.equal(pageProps.course.id, '33333333-3333-4333-8333-333333333030', 'Must receive exact course id from compiler');
    assert.equal(pageProps.course.frameworkId, '11111111-1111-4111-8111-111111111111', 'Must receive exact frameworkId from compiler');
    assert.ok(pageProps.initialLevelsError, 'Must receive initialLevelsError prop from compiler');
    assert.deepEqual(pageProps.frameworkLevels, [], 'frameworkLevels must be empty array on lookup failure');

    // 3. Open Unit create modal -> shows levelsError and retry button
    await page.click('#btnOpenCreateUnit');
    await page.waitForSelector('#unitFormModal', { state: 'visible' });
    await page.waitForSelector('#btnRetryUnitLevels', { state: 'visible' });

    // 4. Fill form fields
    await page.fill('#inputUnitCode', 'UNIT-C-RECON');
    await page.fill('#inputUnitPosition', '9');
    await page.fill('#inputUnitNameVi', 'Đơn vị kiểm thử Seam C');

    // 5. Capture network request on onRetryLevels callback click
    let capturedRetryUrl = '';
    page.on('request', (req) => {
      if (req.url().includes('/api/frameworks/') && req.url().includes('/levels') && req.method() === 'GET') {
        capturedRetryUrl = req.url();
      }
    });

    await page.click('#btnRetryUnitLevels');

    // Wait for level options to populate
    await page.waitForFunction(() => {
      const select = document.querySelector('#selectUnitLevel');
      return select && select.options.length > 1;
    });

    // Assert retry callback requested exact authoritative scoped URL: /api/frameworks/{course.frameworkId}/levels
    assert.ok(
      capturedRetryUrl.includes('/api/frameworks/11111111-1111-4111-8111-111111111111/levels'),
      `Retry callback must invoke authoritative framework URL, got: ${capturedRetryUrl}`
    );

    // 6. Assert form fields preserved after level load
    assert.equal(await page.inputValue('#inputUnitCode'), 'UNIT-C-RECON', 'Code preserved after level options load');
    assert.equal(await page.inputValue('#inputUnitPosition'), '9', 'Position preserved after level options load');
    assert.equal(await page.inputValue('#inputUnitNameVi'), 'Đơn vị kiểm thử Seam C', 'Vi name preserved after level options load');

    // 7. Select loaded level
    await page.selectOption('#selectUnitLevel', 'aaaa1111-1111-4111-8111-111111111111');

    // 8. Capture submit request on create callback
    let capturedSubmitUrl = '';
    let capturedSubmitPayload = null;
    page.on('request', (req) => {
      if (req.url().includes('/api/courses/') && req.url().includes('/units') && req.method() === 'POST') {
        capturedSubmitUrl = req.url();
        try {
          capturedSubmitPayload = JSON.parse(req.postData() || '{}');
        } catch {}
      }
    });

    await page.click('#btnSubmitUnitModal');
    await page.waitForSelector('#unitFormModal', { state: 'hidden' });

    // Assert exact Course-scoped URL and payload
    assert.ok(
      capturedSubmitUrl.includes('/api/courses/33333333-3333-4333-8333-333333333030/units'),
      `Submit callback must invoke exact parent course units URL, got: ${capturedSubmitUrl}`
    );
    assert.deepEqual(capturedSubmitPayload, {
      levelId: 'aaaa1111-1111-4111-8111-111111111111',
      code: 'UNIT-C-RECON',
      position: 9,
      names: {
        vi: 'Đơn vị kiểm thử Seam C',
        en: '',
      },
    }, 'Submit payload must match exact authoritative schema');

    // 9. Assert table reconciled from distinct server result DTO
    await page.waitForSelector('#row-unit-44444444-4444-4444-8444-999999999999', { state: 'visible' });
    const rowText = await page.textContent('#row-unit-44444444-4444-4444-8444-999999999999');
    assert.ok(rowText.includes('UNIT-C-RECON'), 'Reconciled row contains code');
    assert.ok(rowText.includes('#9'), 'Reconciled row contains position');
    assert.ok(rowText.includes('Đơn vị kiểm thử Seam C'), 'Reconciled row contains Vietnamese name');
    assert.ok(rowText.includes('A1'), 'Reconciled row contains level badge');

    const statusText = await page.textContent('#unitMutationStatus');
    assert.ok(statusText.includes('Đã thêm đơn vị bài học "UNIT-C-RECON" thành công.'), 'Mutation announcement reconciled');

    await context.close();
  });
});
