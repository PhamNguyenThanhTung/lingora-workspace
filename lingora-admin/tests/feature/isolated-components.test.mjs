import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { startIsolatedServer } from './isolated-server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const TEST_PORT = 3008;
const TEST_URL = `http://127.0.0.1:${TEST_PORT}`;

describe('STAB-1 R2 / R7 / R9: Isolated Component State & Interaction Tests', () => {
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

  test('R2: DeleteConfirmModal held pending locks, disables buttons, prevents Escape/backdrop dismiss and duplicate submit', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=populated-table`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedTable', { state: 'visible' });

    // Open delete modal for a row that simulates held request
    await page.click('#btn-delete-vi');
    await page.waitForSelector('#deleteConfirmModal', { state: 'visible' });
    await page.waitForTimeout(100);

    // Initial focus strictly on Cancel button per SCR-A-LANG-04
    const cancelFocused = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.classList?.contains('btn-secondary') && el?.textContent?.trim() === 'Hủy';
    });
    assert.equal(cancelFocused, true, 'SCR-A-LANG-04: Cancel button must be strictly focused on open');

    // Intercept DELETE request with a delay and count requests to prove duplicate submit prevention
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
      // Submit multiple times in rapid succession
      document.querySelector('#confirmDeleteBtn').click();
      document.querySelector('#confirmDeleteBtn').click();
      document.querySelector('#confirmDeleteBtn').click();
    });

    // While pending: check that confirm button displays 'Đang xóa...' and is disabled
    const isPendingDisabled = await page.evaluate(() => {
      const confirmBtn = document.querySelector('#confirmDeleteBtn');
      const cancelBtn = document.querySelector('#deleteConfirmModal .btn-secondary');
      const closeBtn = document.querySelector('#deleteConfirmModal .modal-close-btn');
      return {
        confirmDisabled: confirmBtn?.disabled,
        confirmText: confirmBtn?.textContent?.trim(),
        cancelDisabled: cancelBtn?.disabled,
        closeDisabled: closeBtn?.disabled,
      };
    });

    assert.equal(isPendingDisabled.confirmDisabled, true, 'Confirm button must be disabled while pending');
    assert.equal(isPendingDisabled.confirmText, 'Đang xóa...', 'Confirm button must show loading text while pending');
    assert.equal(isPendingDisabled.cancelDisabled, true, 'Cancel button must be disabled while pending');
    assert.equal(isPendingDisabled.closeDisabled, true, 'Close button must be disabled while pending');

    // Verify duplicate click prevention
    const requestCount = await page.evaluate(() => window.__deleteRequestCount);
    assert.equal(requestCount, 1, 'Duplicate clicks while held must be ignored (requestCount === 1)');

    // Attempt Escape dismissal while held: MUST NOT dismiss modal
    await page.keyboard.press('Escape');
    const isStillVisibleAfterEscape = await page.locator('#deleteConfirmModal').isVisible();
    assert.equal(isStillVisibleAfterEscape, true, 'Escape must NOT dismiss modal while delete is held pending');

    // Attempt backdrop click while held: MUST NOT dismiss modal
    await page.click('#deleteConfirmModal', { position: { x: 5, y: 5 } });
    const isStillVisibleAfterBackdrop = await page.locator('#deleteConfirmModal').isVisible();
    assert.equal(isStillVisibleAfterBackdrop, true, 'Backdrop click must NOT dismiss modal while delete is held pending');

    // Wait for held request to finish (server responds)
    await page.waitForTimeout(650);
    await context.close();
  });

  test('R2: DeleteConfirmModal failure retains dialog and enables retry', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=populated-table`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedTable', { state: 'visible' });

    // Open delete modal
    await page.click('#btn-delete-ja');
    await page.waitForSelector('#deleteConfirmModal', { state: 'visible' });

    // Click confirm: trigger retryable 503 error
    await page.evaluate(() => {
      window.fetch = (url, opts) => {
        if (opts?.method === 'DELETE') {
          return Promise.resolve(new Response(JSON.stringify({
            error: { code: 'SERVICE_UNAVAILABLE', message: 'Cơ sở dữ liệu tạm thời không phản hồi. Vui lòng thử lại sau ít phút.' }
          }), { status: 503, headers: { 'Content-Type': 'application/json' } }));
        }
        return window.fetch(url, opts);
      };
      document.querySelector('#confirmDeleteBtn').click();
    });

    await page.waitForSelector('#deleteErrorMsg', { state: 'visible' });
    const errorMsg = await page.textContent('#deleteErrorMsg');
    assert.ok(errorMsg.includes('không phản hồi'), 'Error message must be shown in dialog');

    // Buttons must be re-enabled to permit retry
    const buttonsReEnabled = await page.evaluate(() => {
      const confirmBtn = document.querySelector('#confirmDeleteBtn');
      const cancelBtn = document.querySelector('#deleteConfirmModal .btn-secondary');
      return !confirmBtn?.disabled && !cancelBtn?.disabled;
    });
    assert.equal(buttonsReEnabled, true, 'Buttons must re-enable on failure to allow retry');

    await context.close();
  });

  test('R2: LanguageFormModal focuses server field error after disabled controls become enabled', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=populated-table`, { waitUntil: 'domcontentloaded' });
    await page.click('#openCreateBtn');
    await page.waitForSelector('#languageFormModal', { state: 'visible' });
    await page.waitForFunction(() => document.activeElement?.id === 'langCodeInput');

    await page.fill('#langCodeInput', 'vi'); // duplicate code triggers 409
    await page.fill('#langViInput', 'Tiếng Việt');
    await page.click('#submitLanguageFormBtn');

    await page.waitForSelector('#codeError', { state: 'visible' });
    await page.waitForTimeout(100);

    const activeInputId = await page.evaluate(() => document.activeElement?.id);
    assert.equal(activeInputId, 'langCodeInput', 'Focus must move to errored input field after controls become enabled');

    await context.close();
  });

  test('R2/R9: POST create held pending locks, prevents duplicate submit, retries on 503, reconciles 201 to catalog', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=populated-table`, { waitUntil: 'domcontentloaded' });
    await page.click('#openCreateBtn');
    await page.waitForSelector('#languageFormModal', { state: 'visible' });
    await page.waitForFunction(() => document.activeElement?.id === 'langCodeInput');

    // 1. Held pending and duplicate click prevention
    await page.fill('#langCodeInput', 'heldpost');
    await page.fill('#langViInput', 'Ngôn ngữ giữ chờ');

    await page.evaluate(() => {
      window.__postRequestCount = 0;
      const origFetch = window.fetch;
      window.fetch = (url, opts) => {
        if (opts?.method === 'POST') {
          window.__postRequestCount++;
        }
        return origFetch(url, opts);
      };
      // Rapid multiple clicks
      document.querySelector('#submitLanguageFormBtn').click();
      document.querySelector('#submitLanguageFormBtn').click();
    });

    // Check loading text and disabled state while held
    const submitBtnState = await page.evaluate(() => {
      const btn = document.querySelector('#submitLanguageFormBtn');
      return { disabled: btn?.disabled, text: btn?.textContent?.trim() };
    });
    assert.equal(submitBtnState.disabled, true, 'Submit button must be disabled while pending');
    assert.equal(submitBtnState.text, 'Đang lưu...', 'Submit button must show loading text while pending');

    const postCount = await page.evaluate(() => window.__postRequestCount);
    assert.equal(postCount, 1, 'Duplicate clicks on create submit must be ignored');

    // Wait for server response and reconciliation (modal closes, new row added)
    await page.waitForSelector('#languageFormModal', { state: 'hidden' });
    await page.waitForSelector('#tableMutationStatus', { state: 'visible' });
    const statusText = await page.textContent('#tableMutationStatus');
    assert.equal(statusText, 'Đã thêm ngôn ngữ', 'Mutation status must report added language');

    // 2. Retry on 503 test
    await page.click('#openCreateBtn');
    await page.waitForSelector('#languageFormModal', { state: 'visible' });
    await page.waitForFunction(() => document.activeElement?.id === 'langCodeInput');

    await page.fill('#langCodeInput', 'err503');
    await page.fill('#langViInput', 'Ngôn ngữ lỗi 503');
    await page.click('#submitLanguageFormBtn');

    // Wait for 503 error display in form
    await page.waitForSelector('#formGeneralError', { state: 'visible' });
    const errText = await page.textContent('#formGeneralError');
    assert.ok(errText.includes('không khả dụng'), '503 error message must be shown');

    // Verify inputs retained and buttons re-enabled to permit retry
    const formRetained = await page.evaluate(() => {
      const codeInput = document.querySelector('#langCodeInput');
      const viInput = document.querySelector('#langViInput');
      const submitBtn = document.querySelector('#submitLanguageFormBtn');
      return {
        code: codeInput?.value,
        vi: viInput?.value,
        btnDisabled: submitBtn?.disabled,
      };
    });
    assert.equal(formRetained.code, 'err503', 'Code input must be retained on failure');
    assert.equal(formRetained.vi, 'Ngôn ngữ lỗi 503', 'Vi input must be retained on failure');
    assert.equal(formRetained.btnDisabled, false, 'Submit button must re-enable to permit retry');

    await context.close();
  });

  test('R2/R9: PATCH edit held pending locks, prevents duplicate submit, retries on 503, reconciles 200 to catalog', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=populated-table`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedTable', { state: 'visible' });

    // Open edit modal for row 'ja'
    await page.click('#btn-edit-ja');
    await page.waitForSelector('#languageFormModal', { state: 'visible' });

    // Verify immutable code field is disabled
    const codeDisabled = await page.evaluate(() => document.querySelector('#langCodeInput')?.disabled);
    assert.equal(codeDisabled, true, 'Code input must be disabled (immutable) on edit');

    // Modify name to heldpatch
    await page.fill('#langViInput', 'heldpatch');

    // Submit with intercept
    await page.evaluate(() => {
      window.__patchRequestCount = 0;
      const origFetch = window.fetch;
      window.fetch = (url, opts) => {
        if (opts?.method === 'PATCH') {
          window.__patchRequestCount++;
        }
        return origFetch(url, opts);
      };
      document.querySelector('#submitLanguageFormBtn').click();
      document.querySelector('#submitLanguageFormBtn').click();
    });

    const patchBtnState = await page.evaluate(() => {
      const btn = document.querySelector('#submitLanguageFormBtn');
      return { disabled: btn?.disabled, text: btn?.textContent?.trim() };
    });
    assert.equal(patchBtnState.disabled, true, 'Submit button must be disabled while PATCH is pending');
    assert.equal(patchBtnState.text, 'Đang lưu...', 'Submit button must show loading text');

    const patchCount = await page.evaluate(() => window.__patchRequestCount);
    assert.equal(patchCount, 1, 'Duplicate clicks on edit submit must be ignored');

    // Wait for server response and reconciliation (modal closes, row updated)
    await page.waitForSelector('#languageFormModal', { state: 'hidden' });
    await page.waitForSelector('#tableMutationStatus', { state: 'visible' });
    const patchStatus = await page.textContent('#tableMutationStatus');
    assert.equal(patchStatus, 'Đã cập nhật ngôn ngữ', 'Mutation status must report updated language');

    // 2. Retry on 503 for PATCH
    await page.click('#btn-edit-fr');
    await page.waitForSelector('#languageFormModal', { state: 'visible' });
    await page.fill('#langViInput', 'err503');
    await page.click('#submitLanguageFormBtn');

    await page.waitForSelector('#formGeneralError', { state: 'visible' });
    const retryButtonsEnabled = await page.evaluate(() => {
      const btn = document.querySelector('#submitLanguageFormBtn');
      return !btn?.disabled;
    });
    assert.equal(retryButtonsEnabled, true, 'Buttons must re-enable on PATCH failure to allow retry');

    await context.close();
  });

  test('R9: Modal keyboard focus trapping (Tab and Shift+Tab) in LanguageFormModal and DeleteConfirmModal', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=populated-table`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedTable', { state: 'visible' });

    // 1. LanguageFormModal focus trapping
    await page.click('#openCreateBtn');
    await page.waitForSelector('#languageFormModal', { state: 'visible' });
    await page.waitForTimeout(100);

    // Initial focus on code input
    const initialFocused = await page.evaluate(() => document.activeElement?.id);
    assert.equal(initialFocused, 'langCodeInput', 'Initial focus must be on first input');

    // Focus last element (Hủy button) and press Tab -> should wrap to first element
    await page.evaluate(() => {
      document.querySelector('#languageFormModal .btn-secondary').focus();
    });
    await page.keyboard.press('Tab');
    const wrappedToFirst = await page.evaluate(() => document.activeElement?.id);
    assert.equal(wrappedToFirst, 'langCodeInput', 'Tab from last element must wrap to first element');

    // Press Shift+Tab from first element -> should wrap to last element
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    const wrappedToLast = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.classList?.contains('btn-secondary') && el?.textContent?.trim() === 'Hủy';
    });
    assert.equal(wrappedToLast, true, 'Shift+Tab from first element must wrap to last element');

    // Close modal
    await page.click('#languageFormModal .btn-secondary');
    await page.waitForSelector('#languageFormModal', { state: 'hidden' });

    // 2. DeleteConfirmModal focus trapping
    await page.click('#btn-delete-ja');
    await page.waitForSelector('#deleteConfirmModal', { state: 'visible' });
    await page.waitForTimeout(100);

    // Focus confirm button and press Tab -> wraps to cancel or close button
    await page.evaluate(() => {
      document.querySelector('#confirmDeleteBtn').focus();
    });
    await page.keyboard.press('Tab');
    const trappedInsideDelete = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.closest('#deleteConfirmModal') !== null;
    });
    assert.equal(trappedInsideDelete, true, 'Tab in delete modal must stay trapped inside modal');

    await context.close();
  });

  test('R9: 403 Forbidden vs 503 Service Unavailable error distinctions in forms', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=populated-table`, { waitUntil: 'domcontentloaded' });
    await page.click('#openCreateBtn');
    await page.waitForSelector('#languageFormModal', { state: 'visible' });
    await page.waitForFunction(() => document.activeElement?.id === 'langCodeInput');

    // 1. POST create 403: closes modal, shows forbidden banner with Logout, no session-loss modal or inline retry
    await page.fill('#langCodeInput', 'err403');
    await page.fill('#langViInput', 'Ngôn ngữ cấm');
    assert.equal(await page.inputValue('#langCodeInput'), 'err403');
    assert.equal(await page.inputValue('#langViInput'), 'Ngôn ngữ cấm');

    const [reqPost403, resPost403] = await Promise.all([
      page.waitForRequest((req) => req.url().includes('/api/languages') && req.method() === 'POST'),
      page.waitForResponse((res) => res.url().includes('/api/languages') && res.status() === 403),
      page.click('#submitLanguageFormBtn'),
    ]);
    assert.equal(resPost403.status(), 403, 'POST must return 403');

    // Modal must close on 403 per spec and callback
    await page.waitForSelector('#languageFormModal', { state: 'hidden' });

    // Catalogue displays forbiddenBanner with Logout action
    await page.waitForSelector('#forbiddenBanner', { state: 'visible' });
    const forbiddenText = await page.textContent('#forbiddenBanner');
    assert.ok(forbiddenText.includes('không có quyền') || forbiddenText.includes('Truy cập bị từ chối'), '403 must show permission denial banner');
    const logoutBtn = page.locator('#forbiddenBanner button');
    assert.equal(await logoutBtn.isVisible(), true, 'Forbidden banner must contain Logout button');
    assert.equal((await logoutBtn.textContent()).trim(), 'Đăng xuất');

    // Assert distinct from 401
    assert.equal(await page.locator('#sessionLostModal').isVisible(), false, '403 must NOT open SessionLostModal');
    const navAfter403 = await page.evaluate(() => window.__lastNavigatedUrl);
    assert.ok(!navAfter403 || !navAfter403.includes('/login?expired=1'), '403 must not navigate to login');

    // 2. PATCH edit 403: closes edit modal, shows forbidden banner with Logout
    await page.click('#btn-edit-vi');
    await page.waitForSelector('#languageFormModal', { state: 'visible' });
    await page.waitForFunction(() => document.activeElement?.id === 'langViInput');

    await page.fill('#langViInput', 'err403');
    const [reqPatch403, resPatch403] = await Promise.all([
      page.waitForRequest((req) => req.url().includes('/api/languages') && req.method() === 'PATCH'),
      page.waitForResponse((res) => res.url().includes('/api/languages') && res.status() === 403),
      page.click('#submitLanguageFormBtn'),
    ]);
    assert.equal(resPatch403.status(), 403, 'PATCH must return 403');
    await page.waitForSelector('#languageFormModal', { state: 'hidden' });
    await page.waitForSelector('#forbiddenBanner', { state: 'visible' });
    assert.equal(await page.locator('#sessionLostModal').isVisible(), false, 'PATCH 403 must NOT open SessionLostModal');

    // 3. 503 Service Unavailable retains retryable modal and input (distinct from 403)
    await page.goto(`${TEST_URL}?state=populated-table`, { waitUntil: 'domcontentloaded' });
    await page.click('#openCreateBtn');
    await page.waitForSelector('#languageFormModal', { state: 'visible' });
    await page.waitForFunction(() => document.activeElement?.id === 'langCodeInput');

    await page.fill('#langCodeInput', 'err503');
    await page.fill('#langViInput', 'Ngôn ngữ thử 503');

    const [req503, res503] = await Promise.all([
      page.waitForRequest((req) => req.url().includes('/api/languages') && req.method() === 'POST'),
      page.waitForResponse((res) => res.url().includes('/api/languages') && res.status() === 503),
      page.click('#submitLanguageFormBtn'),
    ]);
    assert.equal(res503.status(), 503, 'POST err503 must return 503');

    // Modal remains OPEN for retry
    assert.equal(await page.locator('#languageFormModal').isVisible(), true, '503 must keep modal open');
    await page.waitForSelector('#formGeneralError', { state: 'visible' });
    const serviceErrorText = await page.textContent('#formGeneralError');
    assert.ok(serviceErrorText.includes('không khả dụng') || serviceErrorText.includes('không phản hồi'), '503 response must display service unavailable text');

    // Input values retained and submit button enabled for retry
    assert.equal(await page.inputValue('#langCodeInput'), 'err503', '503 must retain code input');
    assert.equal(await page.inputValue('#langViInput'), 'Ngôn ngữ thử 503', '503 must retain vi input');
    assert.equal(await page.isEnabled('#submitLanguageFormBtn'), true, '503 must permit retry');
    assert.equal(await page.locator('#forbiddenBanner').isVisible(), false, '503 must not show forbidden banner');
    assert.equal(await page.locator('#sessionLostModal').isVisible(), false, '503 must not show session lost modal');

    await context.close();
  });

  test('R7: Untouched edit modal does NOT create dirty draft, dirty edit saves draft, discard clears it', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=populated-table`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedTable', { state: 'visible' });

    // Open edit modal for 'vi' row
    await page.click('#btn-edit-vi');
    await page.waitForSelector('#languageFormModal', { state: 'visible' });
    await page.waitForTimeout(100);

    // 1. Untouched edit check
    const draftBeforeEdit = await page.evaluate(() =>
      sessionStorage.getItem('lingora_draft_lang_00000000-0000-4000-8000-000000000001')
    );
    assert.equal(draftBeforeEdit, null, 'R7: Untouched edit modal must NOT save a draft to storage');

    // 2. Modify field
    await page.fill('#langViInput', 'Tiếng Việt Chỉnh Sửa');
    await page.waitForTimeout(100);
    const draftAfterEdit = await page.evaluate(() =>
      sessionStorage.getItem('lingora_draft_lang_00000000-0000-4000-8000-000000000001')
    );
    assert.ok(draftAfterEdit !== null, 'R7: Dirty edit modal must save draft to storage');
    assert.ok(draftAfterEdit.includes('Tiếng Việt Chỉnh Sửa'));

    // 3. Discard with Hủy button: clears draft
    await page.click('#languageFormModal .btn-secondary');
    await page.waitForSelector('#languageFormModal', { state: 'hidden' });
    await page.waitForTimeout(100);

    const draftAfterDiscard = await page.evaluate(() =>
      sessionStorage.getItem('lingora_draft_lang_00000000-0000-4000-8000-000000000001')
    );
    assert.equal(draftAfterDiscard, null, 'R7: Discard must remove dirty draft from storage');

    await context.close();
  });

  test('R7: 401 session expiry on form submit retains draft in storage and opens non-dismissible SessionLostModal', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=populated-table`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#openCreateBtn', { state: 'visible' });
    await page.click('#openCreateBtn');
    await page.waitForSelector('#languageFormModal', { state: 'visible' });

    // Synchronize with initialized autofocus timer (50ms)
    await page.waitForFunction(() => document.activeElement?.id === 'langCodeInput');

    // Fill form with valid expire401 and verify inputs before submit
    await page.fill('#langCodeInput', 'expire401');
    await page.fill('#langViInput', 'Tiếng Thử Nghiệm Hết Hạn');
    assert.equal(await page.inputValue('#langCodeInput'), 'expire401', 'langCodeInput must contain only expire401');
    assert.equal(await page.inputValue('#langViInput'), 'Tiếng Thử Nghiệm Hết Hạn', 'langViInput must contain Vietnamese name');

    // Assert actual request payload and 401 response
    const [request401, response401] = await Promise.all([
      page.waitForRequest((req) => req.url().includes('/api/languages') && req.method() === 'POST'),
      page.waitForResponse((res) => res.url().includes('/api/languages') && res.status() === 401),
      page.click('#submitLanguageFormBtn'),
    ]);

    const postPayload = JSON.parse(request401.postData() || '{}');
    assert.equal(postPayload.code, 'expire401', 'Request payload code must not have mixed fields');
    assert.equal(postPayload.names?.vi, 'Tiếng Thử Nghiệm Hết Hạn', 'Request payload names.vi must match');
    assert.equal(response401.status(), 401, 'Response must be 401');

    // LanguageFormModal is closed
    await page.waitForSelector('#languageFormModal', { state: 'hidden' });

    // SessionLostModal opens
    await page.waitForSelector('#sessionLostModal', { state: 'visible' });

    // Non-dismissible session-loss overlay marks stale catalogue access inert
    const appInert = await page.getAttribute('#appContainer', 'inert');
    assert.notEqual(appInert, null, 'Stale catalogue must be marked inert');

    // Verify draft was retained in storage account-bound
    const draftAfter401 = await page.evaluate(() =>
      sessionStorage.getItem('lingora_draft_lang_00000000-0000-4000-8000-000000000001')
    );
    assert.ok(draftAfter401 !== null, 'R7: 401 expiry must retain draft in sessionStorage');
    const parsedDraft = JSON.parse(draftAfter401);
    assert.equal(parsedDraft.code, 'expire401');
    assert.equal(parsedDraft.vi, 'Tiếng Thử Nghiệm Hết Hạn');

    // Verify SessionLostModal message confirms data was saved
    const descText = await page.textContent('#sessionLostDesc');
    assert.ok(descText.includes('đã được lưu tạm'), 'SessionLostModal must report data was saved');

    // Verify Escape key cannot dismiss SessionLostModal
    await page.keyboard.press('Escape');
    const isModalStillOpen = await page.locator('#sessionLostModal').isVisible();
    assert.equal(isModalStillOpen, true, 'Escape key must not dismiss SessionLostModal');

    // Primary login button focused
    await page.waitForFunction(() => document.activeElement?.id === 'sessionLoginBtn');
    const focusedId = await page.evaluate(() => document.activeElement?.id);
    assert.equal(focusedId, 'sessionLoginBtn', 'Primary login return button must be focused');

    // Explicit login action navigates /login?expired=1
    await page.click('#sessionLoginBtn');
    const navigatedUrl = await page.evaluate(() => window.__lastNavigatedUrl);
    assert.equal(navigatedUrl, '/login?expired=1', 'Explicit login action must navigate to /login?expired=1');

    // Return/reload shows same-account recovery prompt, no automatic submit/write
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#draftRecoveryBanner', { state: 'visible' });
    const recoveryBannerText = await page.textContent('#draftRecoveryBanner');
    assert.ok(recoveryBannerText.includes('Bản nháp chưa lưu'), 'Reload must show recovery prompt');

    // Explicit recovery preserves draft and permits intentional retry
    await page.click('#draftRecoverBtn');
    await page.waitForSelector('#languageFormModal', { state: 'visible' });
    await page.waitForFunction(() => document.activeElement?.id === 'langViInput');
    assert.equal(await page.inputValue('#langCodeInput'), 'expire401', 'Recovered modal must retain code');
    assert.equal(await page.inputValue('#langViInput'), 'Tiếng Thử Nghiệm Hết Hạn', 'Recovered modal must retain vi');

    // Discard recovered draft with Hủy button
    await page.click('#languageFormModal .btn-secondary');
    await page.waitForSelector('#languageFormModal', { state: 'hidden' });

    // Truthful message on storage-save failure: when saveDraft fails, SessionLostModal must NOT claim draft saved
    await page.click('#openCreateBtn');
    await page.waitForSelector('#languageFormModal', { state: 'visible' });
    await page.waitForFunction(() => document.activeElement?.id === 'langCodeInput');
    await page.fill('#langCodeInput', 'expire401');
    await page.fill('#langViInput', 'Tiếng Lỗi Lưu');

    // Break sessionStorage.setItem to simulate storage failure on 401
    await page.evaluate(() => {
      sessionStorage.setItem = () => { throw new Error('QuotaExceededError'); };
    });

    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/languages') && res.status() === 401),
      page.click('#submitLanguageFormBtn'),
    ]);
    await page.waitForSelector('#sessionLostModal', { state: 'visible' });
    const unsavedDescText = await page.textContent('#sessionLostDesc');
    assert.ok(!unsavedDescText.includes('đã được lưu tạm'), 'SessionLostModal must not falsely claim draft was saved when storage fails');
    assert.ok(unsavedDescText.includes('Phiên đăng nhập đã kết thúc'), 'SessionLostModal must display truthful expiry message');

    // Restore storage
    await page.evaluate(() => {
      sessionStorage.setItem = Storage.prototype.setItem;
    });

    await context.close();
  });

  test('R7/R9b: Recovered edit survives a second reload unchanged, reopen after discard displays authoritative server data', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Seed recovered draft for admin
    await page.goto(`${TEST_URL}?state=populated-table`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      sessionStorage.setItem('lingora_draft_lang_00000000-0000-4000-8000-000000000001', JSON.stringify({
        mode: 'edit',
        id: '00000000-0000-4000-8000-000000000001',
        code: 'vi',
        vi: 'Tiếng Việt Bản Nháp 1',
        en: 'Vietnamese Draft 1',
        isLearnable: true,
        isUiLocale: true,
        timestamp: Date.now(),
      }));
    });

    // First reload
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#draftRecoveryBanner', { state: 'visible' });
    const bannerText1 = await page.textContent('#draftRecoveryBanner');
    assert.ok(bannerText1.includes('Bản nháp chưa lưu'), 'Draft recovery banner must be visible on first reload');

    // Second reload: MUST survive unchanged per S-R9b
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#draftRecoveryBanner', { state: 'visible' });
    const bannerText2 = await page.textContent('#draftRecoveryBanner');
    assert.ok(bannerText2.includes('Bản nháp chưa lưu'), 'Draft recovery banner must survive a second reload unchanged');

    // Click "Khôi phục" -> edit modal opens with recovered draft data
    await page.click('#draftRecoverBtn');
    await page.waitForSelector('#languageFormModal', { state: 'visible' });
    const recoveredVi = await page.evaluate(() => document.querySelector('#langViInput')?.value);
    assert.equal(recoveredVi, 'Tiếng Việt Bản Nháp 1', 'Modal must load recovered draft values');

    // Discard draft with Hủy button
    await page.click('#languageFormModal .btn-secondary');
    await page.waitForSelector('#languageFormModal', { state: 'hidden' });

    // Verify recovery banner is gone after discard
    const bannerAfterDiscard = await page.locator('#draftRecoveryBanner').isVisible();
    assert.equal(bannerAfterDiscard, false, 'Recovery banner must be removed after discard');

    // Reopen edit modal for 'vi': MUST display authoritative server data per S-R9b
    await page.click('#btn-edit-vi');
    await page.waitForSelector('#languageFormModal', { state: 'visible' });
    const authoritativeVi = await page.evaluate(() => document.querySelector('#langViInput')?.value);
    assert.equal(authoritativeVi, 'Tiếng Việt', 'Reopened edit modal after discard must display authoritative server data');

    await context.close();
  });

  test('R7/R9b: Teacher holding view entry prunes drafts belonging to other accounts', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Seed draft for admin account in sessionStorage
    await page.goto(`${TEST_URL}?state=populated-table`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      sessionStorage.setItem('lingora_draft_lang_00000000-0000-4000-8000-000000000001', JSON.stringify({
        mode: 'create',
        code: 'it',
        vi: 'Tiếng Ý',
        timestamp: Date.now(),
      }));
    });

    const adminDraftExists = await page.evaluate(() =>
      Boolean(sessionStorage.getItem('lingora_draft_lang_00000000-0000-4000-8000-000000000001'))
    );
    assert.equal(adminDraftExists, true, 'Admin draft seeded');

    // Teacher visits holding view
    await page.goto(`${TEST_URL}?state=teacher-holding`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.holding-title', { state: 'visible' });

    // Verify admin draft was pruned upon teacher view entry
    const adminDraftAfterTeacher = await page.evaluate(() =>
      sessionStorage.getItem('lingora_draft_lang_00000000-0000-4000-8000-000000000001')
    );
    assert.equal(adminDraftAfterTeacher, null, 'R7: Teacher view entry must prune drafts belonging to other accounts');

    await context.close();
  });

  test('R7/R9b: Draft TTL expiration, storage failure resilience, and logout clearing', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=populated-table`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#populatedTable', { state: 'visible' });

    // 1. TTL check: seed expired draft (>1 hour old)
    await page.evaluate(() => {
      const expiredTimestamp = Date.now() - (60 * 60 * 1000 + 5000);
      sessionStorage.setItem('lingora_draft_lang_00000000-0000-4000-8000-000000000001', JSON.stringify({
        mode: 'create',
        code: 'expired',
        vi: 'Ngôn ngữ hết hạn TTL',
        timestamp: expiredTimestamp,
      }));
    });

    // Reload: expired draft should be pruned by enforceIdentityAndPrune
    await page.reload({ waitUntil: 'domcontentloaded' });
    const draftAfterTtl = await page.evaluate(() =>
      sessionStorage.getItem('lingora_draft_lang_00000000-0000-4000-8000-000000000001')
    );
    assert.equal(draftAfterTtl, null, 'Expired draft exceeding TTL must be pruned');

    // 2. Storage failure resilience: simulate quota exceeded error
    await page.click('#openCreateBtn');
    await page.waitForSelector('#languageFormModal', { state: 'visible' });
    await page.waitForFunction(() => document.activeElement?.id === 'langCodeInput');

    await page.evaluate(() => {
      sessionStorage.setItem = () => {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      };
    });

    // Modifying input should NOT crash the component
    await page.fill('#langViInput', 'Tên an toàn khi storage lỗi');
    const inputStillWorks = await page.evaluate(() => document.querySelector('#langViInput')?.value);
    assert.equal(inputStillWorks, 'Tên an toàn khi storage lỗi', 'Form must remain fully functional despite storage error');

    // 3. Logout clearing
    await page.click('#languageFormModal .btn-secondary');
    await page.waitForSelector('#languageFormModal', { state: 'hidden' });

    // Seed active draft
    await page.evaluate(() => {
      sessionStorage.setItem = Storage.prototype.setItem; // restore
      sessionStorage.setItem('lingora_draft_lang_00000000-0000-4000-8000-000000000001', JSON.stringify({
        mode: 'create',
        code: 'ru',
        vi: 'Tiếng Nga',
        timestamp: Date.now(),
      }));
    });

    // Click logout
    await page.click('#btnLogout');
    const draftsAfterLogout = await page.evaluate(() =>
      sessionStorage.getItem('lingora_draft_lang_00000000-0000-4000-8000-000000000001')
    );
    assert.equal(draftsAfterLogout, null, 'Logout must purge all drafts from storage');

    await context.close();
  });
});
