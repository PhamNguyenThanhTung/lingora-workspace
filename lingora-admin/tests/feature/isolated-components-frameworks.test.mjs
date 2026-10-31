import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { startIsolatedServer } from './isolated-server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const TEST_PORT = 3009;
const TEST_URL = `http://127.0.0.1:${TEST_PORT}`;

describe('S2-04: Frameworks & Levels Isolated Component State & Interaction Suite', () => {
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
  // 1. Frameworks Catalog & Form Modal (POST / PATCH / 409 / Clearing Locales)
  // =========================================================================

  test('FrameworkFormModal POST create held pending locks, prevents duplicate submit, retries on 409 duplicate error, reconciles 201 to catalog and reopens cleanly', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=frameworks-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btnOpenCreateFramework', { state: 'visible' });

    // 1. Open create modal
    await page.click('#btnOpenCreateFramework');
    await page.waitForSelector('#frameworkFormModal', { state: 'visible' });

    // Initial focus on code input
    await page.waitForFunction(() => document.activeElement?.id === 'frameworkCode');
    const isCodeFocused = await page.evaluate(() => document.activeElement?.id === 'frameworkCode');
    assert.equal(isCodeFocused, true, 'First input must be focused on open');

    // 2. Test pending lock with held code
    await page.fill('#frameworkCode', 'heldpost');
    await page.fill('#frameworkVersion', '1.0');
    await page.fill('#frameworkNameVi', 'Khung Giữ Chờ');

    await page.evaluate(() => {
      window.__submitCount = 0;
      const origFetch = window.fetch;
      window.fetch = (url, opts) => {
        if (opts?.method === 'POST') {
          window.__submitCount++;
        }
        return origFetch(url, opts);
      };
      // Rapid multiple clicks
      document.querySelector('#btnSubmitFramework').click();
      document.querySelector('#btnSubmitFramework').click();
    });

    const isPending = await page.evaluate(() => {
      const btn = document.querySelector('#btnSubmitFramework');
      const input = document.querySelector('#frameworkCode');
      return btn?.disabled && input?.disabled && btn?.textContent?.trim() === 'Đang lưu...';
    });
    assert.equal(isPending, true, 'Submit button and inputs must be locked while pending');

    const submitCount = await page.evaluate(() => window.__submitCount);
    assert.equal(submitCount, 1, 'Duplicate submit clicks must be ignored');

    // Wait for held request to finish (450ms)
    await page.waitForSelector('#frameworkFormModal', { state: 'hidden' });

    // 3. Test 409 duplicate rejection and retry retaining exact inputs
    await page.click('#btnOpenCreateFramework');
    await page.waitForSelector('#frameworkFormModal', { state: 'visible' });

    await page.fill('#frameworkCode', 'CEFR');
    await page.fill('#frameworkVersion', '2020');
    await page.fill('#frameworkNameVi', 'Khung Trùng Lặp');

    await page.click('#btnSubmitFramework');
    await page.waitForSelector('#frameworkCodeError', { state: 'visible' });

    // Verify exact input is retained
    const retained = await page.evaluate(() => ({
      code: document.querySelector('#frameworkCode')?.value,
      version: document.querySelector('#frameworkVersion')?.value,
      nameVi: document.querySelector('#frameworkNameVi')?.value,
    }));
    assert.equal(retained.code, 'CEFR');
    assert.equal(retained.version, '2020');
    assert.equal(retained.nameVi, 'Khung Trùng Lặp');

    // Fix error by changing version and retry
    await page.fill('#frameworkVersion', '2025');
    await page.click('#btnSubmitFramework');
    await page.waitForSelector('#frameworkFormModal', { state: 'hidden' });

    // Verify new row exists in table
    const tableText = await page.textContent('#populatedFrameworksTable');
    assert.ok(tableText.includes('CEFR'));
    assert.ok(tableText.includes('2025'));

    // 4. Fresh reopen must NOT restore stale inputs
    await page.click('#btnOpenCreateFramework');
    await page.waitForSelector('#frameworkFormModal', { state: 'visible' });
    const freshValues = await page.evaluate(() => ({
      code: document.querySelector('#frameworkCode')?.value,
      version: document.querySelector('#frameworkVersion')?.value,
      nameVi: document.querySelector('#frameworkNameVi')?.value,
    }));
    assert.equal(freshValues.code, '', 'Fresh reopen must have empty code');
    assert.equal(freshValues.version, '', 'Fresh reopen must have empty version');
    assert.equal(freshValues.nameVi, '', 'Fresh reopen must have empty name');

    await context.close();
  });


  test('FrameworkFormModal PATCH edit held pending locks, Escape/backdrop suppression, clears vi locale (R2), reconciles 200, fresh reopen displays authoritative server data', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=frameworks-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedFrameworksTable', { state: 'visible' });

    // 1. Open edit modal on CEFR
    await page.click('#btn-edit-framework-11111111-1111-4111-8111-111111111111');
    await page.waitForSelector('#frameworkFormModal', { state: 'visible' });

    // Verify prefilled data
    const prefilled = await page.evaluate(() => ({
      code: document.querySelector('#frameworkCode')?.value,
      version: document.querySelector('#frameworkVersion')?.value,
      nameVi: document.querySelector('#frameworkNameVi')?.value,
      nameEn: document.querySelector('#frameworkNameEn')?.value,
    }));
    assert.equal(prefilled.code, 'CEFR');
    assert.equal(prefilled.version, '2020');
    assert.equal(prefilled.nameVi, 'Khung Tham chiếu Châu Âu');

    // 2. Test held PATCH lock & Escape/backdrop blocking
    await page.fill('#frameworkCode', 'held');
    // Clear Vietnamese locale (R2) and set English locale
    await page.fill('#frameworkNameVi', '');
    await page.fill('#frameworkNameEn', 'CEFR English Only');

    await page.evaluate(() => {
      window.__patchSubmitCount = 0;
      const origFetch = window.fetch;
      window.fetch = (url, opts) => {
        if (opts?.method === 'PATCH') {
          window.__patchSubmitCount++;
        }
        return origFetch(url, opts);
      };
      document.querySelector('#btnSubmitFramework').click();
      document.querySelector('#btnSubmitFramework').click();
    });

    const isPending = await page.evaluate(() => {
      const btn = document.querySelector('#btnSubmitFramework');
      const input = document.querySelector('#frameworkCode');
      const cancel = document.querySelector('#frameworkFormModal .btn-secondary');
      const close = document.querySelector('#frameworkFormModal .modal-close-btn');
      return btn?.disabled && input?.disabled && cancel?.disabled && close?.disabled && btn?.textContent?.trim() === 'Đang lưu...';
    });
    assert.equal(isPending, true, 'Controls must be disabled while PATCH is pending');

    const submitCount = await page.evaluate(() => window.__patchSubmitCount);
    assert.equal(submitCount, 1, 'Duplicate PATCH clicks must be ignored');

    // Escape and backdrop click ignored while held
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#frameworkFormModal').isVisible(), true);
    await page.click('#frameworkFormModal', { position: { x: 5, y: 5 } });
    assert.equal(await page.locator('#frameworkFormModal').isVisible(), true);

    // Wait for PATCH to finish (450ms)
    await page.waitForSelector('#frameworkFormModal', { state: 'hidden' });

    // 3. Verify authoritative server response merged: vi name cleared, en name displayed
    const updatedRowText = await page.textContent('#row-framework-11111111-1111-4111-8111-111111111111');
    assert.ok(updatedRowText.includes('CEFR English Only'));

    // 4. Reopen edit modal: authoritative server data shows cleared vi input
    await page.click('#btn-edit-framework-11111111-1111-4111-8111-111111111111');
    await page.waitForSelector('#frameworkFormModal', { state: 'visible' });
    await page.waitForFunction(() => document.querySelector('#frameworkNameEn')?.value === 'CEFR English Only');

    const reopenedValues = await page.evaluate(() => ({
      nameVi: document.querySelector('#frameworkNameVi')?.value,
      nameEn: document.querySelector('#frameworkNameEn')?.value,
    }));
    assert.equal(reopenedValues.nameVi, '', 'R2: Cleared vi locale must remain empty on reopen');
    assert.equal(reopenedValues.nameEn, 'CEFR English Only');

    await context.close();
  });


  test('FrameworkDeleteModal held pending locks, disables buttons, prevents Escape/backdrop dismiss and duplicate submit', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=frameworks-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedFrameworksTable', { state: 'visible' });

    // Open delete modal for CEFR
    await page.click('#btn-delete-framework-11111111-1111-4111-8111-111111111111');
    await page.waitForSelector('#frameworkDeleteModal', { state: 'visible' });

    // Initial focus strictly on Cancel button
    await page.waitForFunction(() => {
      const el = document.activeElement;
      return el?.classList?.contains('btn-secondary') && el?.textContent?.trim() === 'Hủy';
    });
    const cancelFocused = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.classList?.contains('btn-secondary') && el?.textContent?.trim() === 'Hủy';
    });
    assert.equal(cancelFocused, true, 'Cancel button must be strictly focused on open');

    // Intercept DELETE request with a delay and count requests to verify duplicate click prevention
    await page.evaluate(() => {
      window.__deleteRequestCount = 0;
      const origFetch = window.fetch;
      window.fetch = (url, opts) => {
        if (opts?.method === 'DELETE') {
          window.__deleteRequestCount++;
          return new Promise((resolve) => setTimeout(resolve, 600)).then(() => origFetch(url, opts));
        }
        return origFetch(url, opts);
      };
      document.querySelector('#confirmDeleteFrameworkBtn').click();
      document.querySelector('#confirmDeleteFrameworkBtn').click();
      document.querySelector('#confirmDeleteFrameworkBtn').click();
    });

    // While pending: check that confirm button displays 'Đang xóa...' and is disabled
    const isPendingDisabled = await page.evaluate(() => {
      const confirmBtn = document.querySelector('#confirmDeleteFrameworkBtn');
      const cancelBtn = document.querySelector('#frameworkDeleteModal .btn-secondary');
      const closeBtn = document.querySelector('#frameworkDeleteModal .modal-close-btn');
      return {
        confirmDisabled: confirmBtn?.disabled,
        confirmText: confirmBtn?.textContent?.trim(),
        cancelDisabled: cancelBtn?.disabled,
        closeDisabled: closeBtn?.disabled,
      };
    });

    assert.equal(isPendingDisabled.confirmDisabled, true);
    assert.equal(isPendingDisabled.confirmText, 'Đang xóa...');
    assert.equal(isPendingDisabled.cancelDisabled, true);
    assert.equal(isPendingDisabled.closeDisabled, true);

    const requestCount = await page.evaluate(() => window.__deleteRequestCount);
    assert.equal(requestCount, 1, 'Duplicate clicks must be ignored while held pending');

    // Attempt Escape dismissal while held
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#frameworkDeleteModal').isVisible(), true);

    // Attempt backdrop click while held
    await page.click('#frameworkDeleteModal', { position: { x: 5, y: 5 } });
    assert.equal(await page.locator('#frameworkDeleteModal').isVisible(), true);

    await page.waitForTimeout(650);
    await context.close();
  });


  test('FrameworkDeleteModal in-use error (409) retains modal and shows clear explanation', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=frameworks-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedFrameworksTable', { state: 'visible' });

    // Open delete modal for CEFR (id 11111111... maps to in-use in mock server)
    await page.click('#btn-delete-framework-11111111-1111-4111-8111-111111111111');
    await page.waitForSelector('#frameworkDeleteModal', { state: 'visible' });

    await page.click('#confirmDeleteFrameworkBtn');
    await page.waitForSelector('#frameworkDeleteError', { state: 'visible' });

    const errorText = await page.textContent('#frameworkDeleteError');
    assert.ok(errorText.includes('Khung năng lực đang được sử dụng hoặc có cấp độ trực thuộc, không thể xóa.'));

    // Modal remains open and buttons re-enabled
    const isEnabled = await page.evaluate(() => {
      const confirmBtn = document.querySelector('#confirmDeleteFrameworkBtn');
      return !confirmBtn?.disabled;
    });
    assert.equal(isEnabled, true);

    await context.close();
  });


  test('FrameworkDeleteModal successful deletion, focus restoration to surviving row action, and status clearance (R5)', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=frameworks-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedFrameworksTable', { state: 'visible' });

    // Click delete on ACTFL (id 22222222-2222-4222-8222-222222222222, returns 204 in mock server)
    await page.click('#btn-delete-framework-22222222-2222-4222-8222-222222222222');
    await page.waitForSelector('#frameworkDeleteModal', { state: 'visible' });

    // Confirm deletion
    await page.click('#confirmDeleteFrameworkBtn');
    await page.waitForSelector('#frameworkDeleteModal', { state: 'hidden' });

    // Verify ACTFL row is removed
    const rowExists = await page.locator('#row-framework-22222222-2222-4222-8222-222222222222').count();
    assert.equal(rowExists, 0, 'Deleted row must be removed from the catalog');

    // Verify mutation status announced
    const statusText = await page.textContent('#frameworkMutationStatus');
    assert.ok(statusText.includes('Đã xóa khung năng lực ACTFL (2024) thành công.'));

    // R5: Verify focus is restored to surviving row action or add, NOT BODY
    await page.waitForFunction(() => document.activeElement && document.activeElement !== document.body);
    const activeElementInfo = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        id: el?.id,
        className: el?.className,
        isBody: el === document.body,
      };
    });
    assert.equal(activeElementInfo.isBody, false, 'R5: Active element must NOT be BODY after deletion');
    assert.ok(
      activeElementInfo.id && (
        activeElementInfo.id.startsWith('btn-delete-framework-') ||
        activeElementInfo.id.startsWith('btn-edit-framework-') ||
        activeElementInfo.id === 'btnOpenCreateFramework'
      ),
      `R5: Focus must land on surviving row action or add button, got id: ${activeElementInfo.id}`
    );

    // Verify status is cleared on next interaction
    await page.click('#btnOpenCreateFramework');
    await page.waitForSelector('#frameworkFormModal', { state: 'visible' });
    const statusCleared = await page.locator('#frameworkMutationStatus').count();
    assert.equal(statusCleared, 0, 'Previous mutation status must be cleared on next interaction');

    await context.close();
  });


  // =========================================================================
  // 2. Levels Catalog & Form Modal (POST / PATCH / 409 / Clearing Locales)
  // =========================================================================

  test('LevelsCatalog displays parent identity banner and back link', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=levels-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedLevelsTable', { state: 'visible' });

    // Verify parent identity banner
    const bannerText = await page.textContent('#parentIdentityBanner');
    assert.ok(bannerText.includes('CEFR'));
    assert.ok(bannerText.includes('v2020'));
    assert.ok(bannerText.includes('Khung Tham chiếu Châu Âu'));

    // Verify back link
    const backLink = await page.getAttribute('#linkBackToFrameworks', 'href');
    assert.equal(backLink, '/frameworks');

    await context.close();
  });


  test('LevelFormModal create pending locks, prevents duplicate submit, distinguishes code vs position conflict and retains inputs', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=levels-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btnOpenCreateLevel', { state: 'visible' });

    // 1. Open create level modal
    await page.click('#btnOpenCreateLevel');
    await page.waitForSelector('#levelFormModal', { state: 'visible' });

    // 2. Test held pending lock with held code
    await page.fill('#levelCode', 'held');
    await page.fill('#levelPosition', '3');
    await page.fill('#levelLabelVi', 'Cấp độ giữ chờ');

    await page.evaluate(() => {
      window.__levelSubmitCount = 0;
      const origFetch = window.fetch;
      window.fetch = (url, opts) => {
        if (opts?.method === 'POST') {
          window.__levelSubmitCount++;
        }
        return origFetch(url, opts);
      };
      document.querySelector('#btnSubmitLevel').click();
      document.querySelector('#btnSubmitLevel').click();
    });

    await page.waitForFunction(() => {
      const btn = document.querySelector('#btnSubmitLevel');
      return btn?.disabled && btn?.textContent?.trim() === 'Đang lưu...';
    });
    const isPending = await page.evaluate(() => {
      const btn = document.querySelector('#btnSubmitLevel');
      return btn?.disabled && btn?.textContent?.trim() === 'Đang lưu...';
    });
    assert.equal(isPending, true, 'Level create button locked while pending');

    const submitCount = await page.evaluate(() => window.__levelSubmitCount);
    assert.equal(submitCount, 1, 'Duplicate submit clicks ignored');

    await page.waitForSelector('#levelFormModal', { state: 'hidden' });

    // 3. Test code conflict (409 DUPLICATE_LEVEL_CODE)
    await page.click('#btnOpenCreateLevel');
    await page.waitForSelector('#levelFormModal', { state: 'visible' });

    await page.fill('#levelCode', 'dupcode');
    await page.fill('#levelPosition', '5');
    await page.fill('#levelLabelVi', 'Cấp Độ Trùng Mã');

    await page.click('#btnSubmitLevel');
    await page.waitForSelector('#levelCodeError', { state: 'visible' });

    const codeErrorMsg = await page.textContent('#levelCodeError');
    assert.ok(codeErrorMsg.includes('Mã cấp độ này đã tồn tại trong khung năng lực.'));

    // Verify inputs retained
    const retainedAfterCodeErr = await page.evaluate(() => ({
      code: document.querySelector('#levelCode')?.value,
      position: document.querySelector('#levelPosition')?.value,
      labelVi: document.querySelector('#levelLabelVi')?.value,
    }));
    assert.equal(retainedAfterCodeErr.code, 'dupcode');
    assert.equal(retainedAfterCodeErr.position, '5');
    assert.equal(retainedAfterCodeErr.labelVi, 'Cấp Độ Trùng Mã');

    // 4. Test position conflict (409 DUPLICATE_LEVEL_POSITION)
    await page.fill('#levelCode', 'C1');
    await page.fill('#levelPosition', '999');

    await page.click('#btnSubmitLevel');
    await page.waitForSelector('#levelPositionError', { state: 'visible' });

    const posErrorMsg = await page.textContent('#levelPositionError');
    assert.ok(posErrorMsg.includes('Thứ tự vị trí này đã tồn tại trong khung năng lực.'));

    // 5. Correct and succeed (201)
    await page.fill('#levelPosition', '5');
    await page.click('#btnSubmitLevel');
    await page.waitForSelector('#levelFormModal', { state: 'hidden' });

    // Verify new level is in table
    const tableContent = await page.textContent('#populatedLevelsTable');
    assert.ok(tableContent.includes('C1'));
    assert.ok(tableContent.includes('#5'));

    await context.close();
  });


  test('LevelFormModal PATCH edit held pending locks, clears vi label (R2), reconciles 200, fresh reopen', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=levels-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedLevelsTable', { state: 'visible' });

    // 1. Open edit on level A1
    await page.click('#btn-edit-level-aaaa1111-1111-4111-8111-111111111111');
    await page.waitForSelector('#levelFormModal', { state: 'visible' });

    // Clear Vietnamese label (R2) and update English
    await page.fill('#levelCode', 'held');
    await page.fill('#levelLabelVi', '');
    await page.fill('#levelLabelEn', 'Breakthrough Updated');

    await page.evaluate(() => {
      window.__levelPatchCount = 0;
      const origFetch = window.fetch;
      window.fetch = (url, opts) => {
        if (opts?.method === 'PATCH') {
          window.__levelPatchCount++;
        }
        return origFetch(url, opts);
      };
      document.querySelector('#btnSubmitLevel').click();
      document.querySelector('#btnSubmitLevel').click();
    });

    const isPending = await page.evaluate(() => {
      const btn = document.querySelector('#btnSubmitLevel');
      return btn?.disabled && btn?.textContent?.trim() === 'Đang lưu...';
    });
    assert.equal(isPending, true);

    const submitCount = await page.evaluate(() => window.__levelPatchCount);
    assert.equal(submitCount, 1);

    await page.waitForSelector('#levelFormModal', { state: 'hidden' });

    // Verify table updated
    const updatedRowText = await page.textContent('#row-level-aaaa1111-1111-4111-8111-111111111111');
    assert.ok(updatedRowText.includes('Breakthrough Updated'));

    // 2. Reopen edit modal: verify authoritative server data shows cleared vi label
    await page.click('#btn-edit-level-aaaa1111-1111-4111-8111-111111111111');
    await page.waitForSelector('#levelFormModal', { state: 'visible' });
    await page.waitForFunction(() => document.querySelector('#levelLabelEn')?.value === 'Breakthrough Updated');

    const reopenedValues = await page.evaluate(() => ({
      labelVi: document.querySelector('#levelLabelVi')?.value,
      labelEn: document.querySelector('#levelLabelEn')?.value,
    }));
    assert.equal(reopenedValues.labelVi, '', 'R2: Cleared vi label must remain empty on reopen');
    assert.equal(reopenedValues.labelEn, 'Breakthrough Updated');

    await context.close();
  });


  test('LevelDeleteModal held pending locks, in-use restriction (409) vs successful deletion and focus restoration (R5)', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=levels-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedLevelsTable', { state: 'visible' });

    // 1. In-use restriction test on Level A1
    await page.click('#btn-delete-level-aaaa1111-1111-4111-8111-111111111111');
    await page.waitForSelector('#levelDeleteModal', { state: 'visible' });

    await page.click('#confirmDeleteLevelBtn');
    await page.waitForSelector('#levelDeleteError', { state: 'visible' });
    const inUseMsg = await page.textContent('#levelDeleteError');
    assert.ok(inUseMsg.includes('Cấp độ đang được sử dụng trong bài học hoặc khóa học, không thể xóa.'));

    // Cancel closes modal
    await page.click('#levelDeleteModal .btn-secondary');
    await page.waitForSelector('#levelDeleteModal', { state: 'hidden' });

    // 2. Successful deletion on Level A2 (aaaa2222...)
    await page.click('#btn-delete-level-aaaa2222-2222-4222-8222-222222222222');
    await page.waitForSelector('#levelDeleteModal', { state: 'visible' });

    await page.click('#confirmDeleteLevelBtn');
    await page.waitForSelector('#levelDeleteModal', { state: 'hidden' });

    // Verify row removed
    const rowExists = await page.locator('#row-level-aaaa2222-2222-4222-8222-222222222222').count();
    assert.equal(rowExists, 0, 'Deleted level must be removed from table');

    // Verify status announced
    const statusText = await page.textContent('#levelMutationStatus');
    assert.ok(statusText.includes('Đã xóa cấp độ A2 thành công.'));

    // R5: Verify focus restored to surviving row action, NOT BODY
    await page.waitForFunction(() => document.activeElement && document.activeElement !== document.body);
    const activeEl = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        id: el?.id,
        tagName: el?.tagName,
        className: el?.className,
        isBody: el === document.body,
      };
    });
    assert.equal(activeEl.isBody, false, 'R5: Active element must NOT be BODY after level deletion');
    assert.ok(
      activeEl.id && (
        activeEl.id.startsWith('btn-delete-level-') ||
        activeEl.id.startsWith('btn-edit-level-') ||
        activeEl.id === 'btnOpenCreateLevel'
      ),
      `R5: Focus must land on surviving row action or add button, got id: ${activeEl.id}`
    );

    // Status cleared on next interaction
    await page.click('#btnOpenCreateLevel');
    await page.waitForSelector('#levelFormModal', { state: 'visible' });
    const statusCleared = await page.locator('#levelMutationStatus').count();
    assert.equal(statusCleared, 0, 'Previous mutation status must be cleared on next interaction');

    await context.close();
  });


  // =========================================================================
  // 3. Security Boundaries: 403 Forbidden vs 401 Session Lost (R4)
  // =========================================================================

  test('FrameworksCatalog and LevelsCatalog on 403 show permission denial and suppress mutation controls (R4)', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Frameworks Catalog 403
    await page.goto(`${TEST_URL}?state=frameworks-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btnOpenCreateFramework', { state: 'visible' });

    await page.click('#btnOpenCreateFramework');
    await page.waitForSelector('#frameworkFormModal', { state: 'visible' });

    await page.fill('#frameworkCode', 'err403');
    await page.fill('#frameworkVersion', '1.0');
    await page.click('#btnSubmitFramework');

    // Form modal closes and #forbiddenBanner is displayed
    await page.waitForSelector('#forbiddenBanner', { state: 'visible' });
    const bannerText = await page.textContent('#forbiddenBanner');
    assert.ok(bannerText.includes('Truy cập bị từ chối:'));

    // R4: Mutation catalogue is completely hidden / suppressed!
    const tableVisible = await page.locator('#populatedFrameworksTable').count();
    const createBtnVisible = await page.locator('#btnOpenCreateFramework').count();
    assert.equal(tableVisible, 0, 'R4: Mutation table must be suppressed on 403');
    assert.equal(createBtnVisible, 0, 'R4: Create button must be suppressed on 403');

    // Logout button is usable
    assert.equal(await page.locator('#forbiddenLogoutBtn').isVisible(), true);

    // 2. Levels Catalog 403
    await page.goto(`${TEST_URL}?state=levels-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btnOpenCreateLevel', { state: 'visible' });

    await page.click('#btnOpenCreateLevel');
    await page.waitForSelector('#levelFormModal', { state: 'visible' });

    await page.fill('#levelCode', 'err403');
    await page.fill('#levelPosition', '10');
    await page.click('#btnSubmitLevel');

    await page.waitForSelector('#forbiddenBanner', { state: 'visible' });
    const lvlBannerText = await page.textContent('#forbiddenBanner');
    assert.ok(lvlBannerText.includes('Truy cập bị từ chối:'));

    // R4: Mutation controls suppressed in Levels catalog
    assert.equal(await page.locator('#populatedLevelsTable').count(), 0);
    assert.equal(await page.locator('#btnOpenCreateLevel').count(), 0);
    assert.equal(await page.locator('#parentIdentityBanner').count(), 0);
    assert.equal(await page.locator('#forbiddenLogoutBtnLevel').isVisible(), true);

    await context.close();
  });

  test('Both actual denial logout buttons remove real accepted drafts, preserve unrelated storage, and handle cleanup failure (Gate 4)', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const activeAdminId = '00000000-0000-4000-8000-000000000001';
    const otherAccountId = '99999999-9999-4999-8999-999999999999';

    // --- 1. FrameworksCatalog Denial Logout ---
    await page.goto(`${TEST_URL}?state=frameworks-populated`, { waitUntil: 'domcontentloaded' });

    // Seed real drafts via accepted saveDraft flow
    const seededFw = await page.evaluate(({ activeAdminId, otherAccountId }) => {
      window.saveDraft(activeAdminId, { mode: 'create', code: 'es', vi: 'Tiếng Tây Ban Nha' });
      window.saveDraft(otherAccountId, { mode: 'create', code: 'fr', vi: 'Tiếng Pháp' });
      sessionStorage.setItem('unrelated_auth_key', 'keep_this_token');
      return {
        active: window.loadDraft(activeAdminId),
        other: window.loadDraft(otherAccountId),
      };
    }, { activeAdminId, otherAccountId });

    assert.ok(seededFw.active, 'Recoverable active draft must exist before logout');
    assert.ok(seededFw.other, 'Recoverable other draft must exist before logout');

    // Trigger 403 banner
    await page.waitForSelector('#btnOpenCreateFramework', { state: 'visible' });
    await page.click('#btnOpenCreateFramework');
    await page.waitForSelector('#frameworkFormModal', { state: 'visible' });
    await page.fill('#frameworkCode', 'err403');
    await page.fill('#frameworkVersion', '1.0');
    await page.click('#btnSubmitFramework');

    await page.waitForSelector('#forbiddenBanner', { state: 'visible' });
    await page.waitForSelector('#forbiddenLogoutBtn', { state: 'visible' });

    // Spy on logout API request
    let logoutCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/auth/logout') && req.method() === 'POST') {
        logoutCalled = true;
      }
    });

    // Click actual production logout button and await real navigation to /login (no .catch)
    await Promise.all([
      page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 4000 }),
      page.click('#forbiddenLogoutBtn'),
    ]);

    assert.equal(logoutCalled, true, 'POST /api/auth/logout must be called on Frameworks logout');
    assert.ok(page.url().includes('/login'), 'Frameworks logout must navigate to /login');

    // Return to verify sessionStorage: both draft keys removed, unrelated key preserved!
    await page.goto(`${TEST_URL}?state=frameworks-populated`, { waitUntil: 'domcontentloaded' });
    const clearedFw = await page.evaluate(({ activeAdminId, otherAccountId }) => ({
      active: window.loadDraft(activeAdminId),
      other: window.loadDraft(otherAccountId),
      unrelated: sessionStorage.getItem('unrelated_auth_key'),
    }), { activeAdminId, otherAccountId });

    assert.equal(clearedFw.active, null, 'Active account draft must be removed');
    assert.equal(clearedFw.other, null, 'Other account draft must be removed');
    assert.equal(clearedFw.unrelated, 'keep_this_token', 'Unrelated storage must be preserved');

    // --- 2. Storage failure isolation on FrameworksCatalog ---
    await page.goto(`${TEST_URL}?state=frameworks-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btnOpenCreateFramework', { state: 'visible' });
    await page.click('#btnOpenCreateFramework');
    await page.waitForSelector('#frameworkFormModal', { state: 'visible' });
    await page.fill('#frameworkCode', 'err403');
    await page.fill('#frameworkVersion', '1.0');
    await page.click('#btnSubmitFramework');

    await page.waitForSelector('#forbiddenBanner', { state: 'visible' });

    let storageFailLogoutCalled = false;
    const onRequestFw = (req) => {
      if (req.url().includes('/api/auth/logout') && req.method() === 'POST') {
        storageFailLogoutCalled = true;
      }
    };
    page.on('request', onRequestFw);

    // Override sessionStorage.removeItem to throw storage error
    await page.evaluate(() => {
      sessionStorage.removeItem = () => { throw new Error('Simulated QuotaExceededError or StorageDenied'); };
      sessionStorage.clear = () => { throw new Error('Simulated QuotaExceededError or StorageDenied'); };
    });

    await Promise.all([
      page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 4000 }),
      page.click('#forbiddenLogoutBtn'),
    ]);

    assert.equal(storageFailLogoutCalled, true, 'Logout POST must still execute when sessionStorage throws');
    assert.ok(page.url().includes('/login'), 'Frameworks logout must navigate to /login even when storage throws');
    page.off('request', onRequestFw);

    // --- 3. LevelsCatalog Denial Logout ---
    await page.goto(`${TEST_URL}?state=levels-populated`, { waitUntil: 'domcontentloaded' });

    // Seed real drafts via accepted saveDraft flow
    const seededLvl = await page.evaluate(({ activeAdminId, otherAccountId }) => {
      window.saveDraft(activeAdminId, { mode: 'create', code: 'ja', vi: 'Tiếng Nhật' });
      window.saveDraft(otherAccountId, { mode: 'create', code: 'ko', vi: 'Tiếng Hàn' });
      sessionStorage.setItem('unrelated_level_key', 'keep_this_level_token');
      return {
        active: window.loadDraft(activeAdminId),
        other: window.loadDraft(otherAccountId),
      };
    }, { activeAdminId, otherAccountId });

    assert.ok(seededLvl.active, 'Recoverable active draft must exist before Levels logout');
    assert.ok(seededLvl.other, 'Recoverable other draft must exist before Levels logout');

    // Trigger 403 in Levels
    await page.waitForSelector('#btnOpenCreateLevel', { state: 'visible' });
    await page.click('#btnOpenCreateLevel');
    await page.waitForSelector('#levelFormModal', { state: 'visible' });
    await page.fill('#levelCode', 'err403');
    await page.fill('#levelPosition', '10');
    await page.click('#btnSubmitLevel');

    await page.waitForSelector('#forbiddenBanner', { state: 'visible' });
    await page.waitForSelector('#forbiddenLogoutBtnLevel', { state: 'visible' });

    let levelLogoutCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/auth/logout') && req.method() === 'POST') {
        levelLogoutCalled = true;
      }
    });

    await Promise.all([
      page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 4000 }),
      page.click('#forbiddenLogoutBtnLevel'),
    ]);

    assert.equal(levelLogoutCalled, true, 'POST /api/auth/logout must be called on Levels logout');
    assert.ok(page.url().includes('/login'), 'Levels logout must navigate to /login');

    await page.goto(`${TEST_URL}?state=levels-populated`, { waitUntil: 'domcontentloaded' });
    const clearedLvl = await page.evaluate(({ activeAdminId, otherAccountId }) => ({
      active: window.loadDraft(activeAdminId),
      other: window.loadDraft(otherAccountId),
      unrelated: sessionStorage.getItem('unrelated_level_key'),
    }), { activeAdminId, otherAccountId });

    assert.equal(clearedLvl.active, null, 'Active account draft must be removed on Levels logout');
    assert.equal(clearedLvl.other, null, 'Other account draft must be removed on Levels logout');
    assert.equal(clearedLvl.unrelated, 'keep_this_level_token', 'Unrelated storage must be preserved on Levels logout');

    // --- 4. Storage failure isolation on LevelsCatalog ---
    await page.goto(`${TEST_URL}?state=levels-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btnOpenCreateLevel', { state: 'visible' });
    await page.click('#btnOpenCreateLevel');
    await page.waitForSelector('#levelFormModal', { state: 'visible' });
    await page.fill('#levelCode', 'err403');
    await page.fill('#levelPosition', '10');
    await page.click('#btnSubmitLevel');

    await page.waitForSelector('#forbiddenBanner', { state: 'visible' });

    let storageFailLogoutLvlCalled = false;
    const onRequestLvl = (req) => {
      if (req.url().includes('/api/auth/logout') && req.method() === 'POST') {
        storageFailLogoutLvlCalled = true;
      }
    };
    page.on('request', onRequestLvl);

    await page.evaluate(() => {
      sessionStorage.removeItem = () => { throw new Error('Simulated storage error'); };
      sessionStorage.clear = () => { throw new Error('Simulated storage error'); };
    });

    await Promise.all([
      page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 4000 }),
      page.click('#forbiddenLogoutBtnLevel'),
    ]);

    assert.equal(storageFailLogoutLvlCalled, true, 'Levels logout POST must still execute when sessionStorage throws');
    assert.ok(page.url().includes('/login'), 'Levels logout must navigate to /login even when storage throws');
    page.off('request', onRequestLvl);

    await context.close();
  });


  // =========================================================================
  // 4. Loading, Empty, and Error States (including Actual Retry Click)
  // =========================================================================

  test('Frameworks and Levels empty states render truthful guidance and create triggers', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Empty frameworks
    await page.goto(`${TEST_URL}?state=frameworks-empty`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#emptyFrameworksState', { state: 'visible' });
    const fwEmptyText = await page.textContent('#emptyFrameworksState');
    assert.ok(fwEmptyText.includes('Chưa có khung năng lực nào'));
    assert.equal(await page.locator('#btnEmptyCreateFramework').isVisible(), true);

    // Empty levels
    await page.goto(`${TEST_URL}?state=levels-empty`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#emptyLevelsState', { state: 'visible' });
    const lvlEmptyText = await page.textContent('#emptyLevelsState');
    assert.ok(lvlEmptyText.includes('Chưa có cấp độ nào trong khung này'));
    assert.equal(await page.locator('#btnEmptyCreateLevel').isVisible(), true);

    await context.close();
  });


  test('Frameworks and Levels loading skeletons and fetch error retry success (R6 UI)', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Loading skeleton frameworks
    await page.goto(`${TEST_URL}?state=frameworks-loading`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#frameworksLoadingSkeleton', { state: 'visible' });

    // Loading skeleton levels
    await page.goto(`${TEST_URL}?state=levels-loading`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#levelsLoadingSkeleton', { state: 'visible' });

    // Fetch error retry on frameworks: clicking Retry actually loads populated table!
    await page.goto(`${TEST_URL}?state=frameworks-fetch-error`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#fetchErrorState', { state: 'visible' });
    const fwRetryBtn = page.locator('#btnRetryFetchFrameworks');
    assert.equal(await fwRetryBtn.textContent(), 'Thử lại');

    await fwRetryBtn.click();
    await page.waitForSelector('#populatedFrameworksTable', { state: 'visible' });
    const fwTableText = await page.textContent('#populatedFrameworksTable');
    assert.ok(fwTableText.includes('CEFR'));

    // Fetch error retry on levels: clicking Retry actually loads populated table!
    await page.goto(`${TEST_URL}?state=levels-fetch-error`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#fetchErrorState', { state: 'visible' });
    const lvlRetryBtn = page.locator('#btnRetryFetchLevels');
    assert.equal(await lvlRetryBtn.textContent(), 'Thử lại');

    await lvlRetryBtn.click();
    await page.waitForSelector('#populatedLevelsTable', { state: 'visible' });
    const lvlTableText = await page.textContent('#populatedLevelsTable');
    assert.ok(lvlTableText.includes('A1'));

    await context.close();
  });


  // =========================================================================
  // 5. R1: Production Server Component to Client UI & Callback Chain Tests
  // =========================================================================

  test('R1: Production FrameworkDetailPage renders into real LevelsCatalog UI, invokes POST with exact parent framework id in URL and payload, and visibly reconciles 201', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const parentFwId = '11111111-1111-4111-8111-111111111111';
    await page.goto(`${TEST_URL}?state=page-framework-detail-wire&frameworkId=${parentFwId}`, { waitUntil: 'domcontentloaded' });

    // Assert parent framework title rendered from production page props
    await page.waitForSelector('#populatedLevelsTable', { state: 'visible' });
    const parentBanner = await page.textContent('#parentIdentityBanner');
    assert.ok(parentBanner.includes('CEFR'), 'Parent banner must contain parent framework code');
    assert.ok(parentBanner.includes('2020'), 'Parent banner must contain parent framework version');

    // Open create level modal
    await page.click('#btnOpenCreateLevel');
    await page.waitForSelector('#levelFormModal', { state: 'visible' });

    await page.fill('#levelCode', 'C1');
    await page.fill('#levelPosition', '5');
    await page.fill('#levelLabelVi', 'Cao cấp C1');

    let interceptedUrl = null;
    let interceptedMethod = null;
    let interceptedPayload = null;

    const onRequest = (req) => {
      if (req.url().includes('/levels') && req.method() === 'POST') {
        interceptedUrl = req.url();
        interceptedMethod = req.method();
        try {
          interceptedPayload = JSON.parse(req.postData() || '{}');
        } catch {}
      }
    };
    page.on('request', onRequest);

    await page.click('#btnSubmitLevel');
    await page.waitForSelector('#levelFormModal', { state: 'hidden' });

    page.off('request', onRequest);

    assert.equal(interceptedMethod, 'POST');
    assert.ok(interceptedUrl.includes(`/api/frameworks/${parentFwId}/levels`), `URL must target exact parent framework id ${parentFwId}`);
    assert.equal(interceptedPayload.code, 'C1');
    assert.equal(interceptedPayload.position, 5);
    assert.equal(interceptedPayload.label?.vi, 'Cao cấp C1');

    // Visible reconciliation in table
    const tableText = await page.textContent('#populatedLevelsTable');
    assert.ok(tableText.includes('C1'), 'New level code C1 must be reconciled in DOM');
    assert.ok(tableText.includes('Cao cấp C1'), 'New level label must be reconciled in DOM');

    await context.close();
  });


  test('R1: Production FrameworksPage renders into real FrameworksCatalog UI, invokes POST with valid payload, and visibly reconciles 201', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=page-frameworks-wire`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedFrameworksTable', { state: 'visible' });

    // Assert existing framework rendered from production page props
    const tableInitial = await page.textContent('#populatedFrameworksTable');
    assert.ok(tableInitial.includes('CEFR'), 'Catalog table must render server framework CEFR');

    // Open create framework modal
    await page.click('#btnOpenCreateFramework');
    await page.waitForSelector('#frameworkFormModal', { state: 'visible' });

    await page.fill('#frameworkCode', 'ACTFL');
    await page.fill('#frameworkVersion', '2024');
    await page.fill('#frameworkNameVi', 'American Council');

    let interceptedUrl = null;
    let interceptedMethod = null;
    let interceptedPayload = null;

    const onRequest = (req) => {
      if (req.url().includes('/api/frameworks') && !req.url().includes('/levels') && req.method() === 'POST') {
        interceptedUrl = req.url();
        interceptedMethod = req.method();
        try {
          interceptedPayload = JSON.parse(req.postData() || '{}');
        } catch {}
      }
    };
    page.on('request', onRequest);

    await page.click('#btnSubmitFramework');
    await page.waitForSelector('#frameworkFormModal', { state: 'hidden' });

    page.off('request', onRequest);

    assert.equal(interceptedMethod, 'POST');
    assert.ok(interceptedUrl.endsWith('/api/frameworks'));
    assert.equal(interceptedPayload.code, 'ACTFL');
    assert.equal(interceptedPayload.version, '2024');
    assert.equal(interceptedPayload.names?.vi, 'American Council');

    // Visible reconciliation in table
    const tableUpdated = await page.textContent('#populatedFrameworksTable');
    assert.ok(tableUpdated.includes('ACTFL'), 'New framework ACTFL must be reconciled in DOM');
    assert.ok(tableUpdated.includes('2024'), 'New framework version 2024 must be reconciled in DOM');

    await context.close();
  });


  // =========================================================================
  // 6. R3: Actual Production UI 404 Callback & Envelope Handling
  // =========================================================================

  test('R3: Framework form modal edit 404 displays error, retains inputs, does not update table, and dismisses cleanly', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=frameworks-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedFrameworksTable', { state: 'visible' });

    // Open edit on CEFR
    await page.click('#btn-edit-framework-11111111-1111-4111-8111-111111111111');
    await page.waitForSelector('#frameworkFormModal', { state: 'visible' });

    // Change code to trigger 404 on server
    await page.fill('#frameworkCode', 'notfound404');
    await page.click('#btnSubmitFramework');

    await page.waitForSelector('#frameworkFormGeneralError', { state: 'visible' });
    const errorText = await page.textContent('#frameworkFormGeneralError');
    assert.ok(errorText.includes('Không tìm thấy khung năng lực trong hệ thống.'));

    // Verify inputs retained
    const retainedCode = await page.inputValue('#frameworkCode');
    assert.equal(retainedCode, 'notfound404');

    // Dismiss modal cleanly via cancel button
    await page.click('#frameworkFormModal .btn-secondary');
    await page.waitForSelector('#frameworkFormModal', { state: 'hidden' });

    // Verify table was NOT falsely updated
    const tableText = await page.textContent('#populatedFrameworksTable');
    assert.ok(!tableText.includes('notfound404'), 'Table must not contain 404-failed code');

    await context.close();
  });


  test('R3: Framework delete modal 404 displays error, keeps modal open with buttons re-enabled, retains table row, and dismisses cleanly', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=frameworks-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedFrameworksTable', { state: 'visible' });

    // Click delete on ILR (id ends with 404)
    const targetFwId = '44444444-4444-4444-8444-444444444404';
    await page.click(`#btn-delete-framework-${targetFwId}`);
    await page.waitForSelector('#frameworkDeleteModal', { state: 'visible' });

    await page.click('#confirmDeleteFrameworkBtn');
    await page.waitForSelector('#frameworkDeleteError', { state: 'visible' });

    const errorText = await page.textContent('#frameworkDeleteError');
    assert.ok(errorText.includes('Không tìm thấy khung năng lực trong hệ thống.'));

    // Modal remains open and buttons re-enabled for retry
    assert.equal(await page.locator('#frameworkDeleteModal').isVisible(), true);
    assert.equal(await page.locator('#confirmDeleteFrameworkBtn').isEnabled(), true);

    // Cancel dismisses
    await page.click('#frameworkDeleteModal .btn-secondary');
    await page.waitForSelector('#frameworkDeleteModal', { state: 'hidden' });

    // Table row must still exist (no false removal)
    const rowExists = await page.locator(`#row-framework-${targetFwId}`).count();
    assert.equal(rowExists, 1, 'Target row must remain visible after 404 delete');

    await context.close();
  });


  test('R3: Level form modal edit 404 displays error, retains inputs, does not update table, and dismisses cleanly', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=levels-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedLevelsTable', { state: 'visible' });

    // Open edit on A1
    await page.click('#btn-edit-level-aaaa1111-1111-4111-8111-111111111111');
    await page.waitForSelector('#levelFormModal', { state: 'visible' });

    // Change code to trigger 404 on server
    await page.fill('#levelCode', 'notfound404');
    await page.click('#btnSubmitLevel');

    await page.waitForSelector('#levelFormGeneralError', { state: 'visible' });
    const errorText = await page.textContent('#levelFormGeneralError');
    assert.ok(errorText.includes('Không tìm thấy cấp độ trong khung năng lực.'));

    // Verify inputs retained
    const retainedCode = await page.inputValue('#levelCode');
    assert.equal(retainedCode, 'notfound404');

    // Dismiss modal cleanly via cancel button
    await page.click('#levelFormModal .btn-secondary');
    await page.waitForSelector('#levelFormModal', { state: 'hidden' });

    // Verify table was NOT falsely updated
    const tableText = await page.textContent('#populatedLevelsTable');
    assert.ok(!tableText.includes('notfound404'), 'Table must not contain 404-failed code');

    await context.close();
  });


  test('R3: Level delete modal 404 displays error, keeps modal open with buttons re-enabled, retains table row, and dismisses cleanly', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=levels-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedLevelsTable', { state: 'visible' });

    // Click delete on C2 (id ends with 404)
    const targetLevelId = 'aaaa5555-5555-4555-8555-555555555404';
    await page.click(`#btn-delete-level-${targetLevelId}`);
    await page.waitForSelector('#levelDeleteModal', { state: 'visible' });

    await page.click('#confirmDeleteLevelBtn');
    await page.waitForSelector('#levelDeleteError', { state: 'visible' });

    const errorText = await page.textContent('#levelDeleteError');
    assert.ok(errorText.includes('Không tìm thấy cấp độ trong khung năng lực.'));

    // Modal remains open and buttons re-enabled for retry
    assert.equal(await page.locator('#levelDeleteModal').isVisible(), true);
    assert.equal(await page.locator('#confirmDeleteLevelBtn').isEnabled(), true);

    // Cancel dismisses
    await page.click('#levelDeleteModal .btn-secondary');
    await page.waitForSelector('#levelDeleteModal', { state: 'hidden' });

    // Table row must still exist (no false removal)
    const rowExists = await page.locator(`#row-level-${targetLevelId}`).count();
    assert.equal(rowExists, 1, 'Target row must remain visible after 404 delete');

    await context.close();
  });

});
