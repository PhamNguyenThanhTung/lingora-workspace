import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { startIsolatedServer } from './isolated-server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const TEST_PORT = 3011;
const TEST_URL = `http://127.0.0.1:${TEST_PORT}`;
const LOGS_DIR = '/home/tung/.codex/task-logs/slice-4-teachers';

describe('S4-TEACHERS: Isolated Component State & Interaction Suite', () => {
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
  // 1. TeacherCreateModal: Pending Locks, Escape/Backdrop, Duplicate Submit,
  //    Input Retention on Error & 201 Catalog Reconciliation
  // =========================================================================

  test('TeacherCreateModal POST create held pending locks, prevents duplicate submit, retries on 409 duplicate error, and reconciles 201 to catalog', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=teachers-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btnOpenCreateTeacher', { state: 'visible' });

    // 1. Open create modal
    await page.click('#btnOpenCreateTeacher');
    await page.waitForSelector('#teacherCreateModal', { state: 'visible' });

    // Initial focus on email input
    await page.waitForFunction(() => document.activeElement?.id === 'teacherEmail');
    const isEmailFocused = await page.evaluate(() => document.activeElement?.id === 'teacherEmail');
    assert.equal(isEmailFocused, true, 'First input (teacherEmail) must be focused on modal open');

    // 2. Pending lock & duplicate submit prevention
    await page.fill('#teacherEmail', 'teacher.held@lingora.edu.vn');
    await page.fill('#teacherDisplayName', 'Giáo Viên Test');

    await page.evaluate(() => {
      window.__submitCount = 0;
      const origFetch = window.fetch;
      window.fetch = (url, opts) => {
        if (opts?.method === 'POST' && url.includes('/api/teachers')) {
          window.__submitCount++;
          // Simulate 500ms server processing time
          return new Promise((resolve) => setTimeout(resolve, 500)).then(() =>
            Response.json(
              {
                error: {
                  code: 'DUPLICATE_EMAIL',
                  message: 'Địa chỉ email này đã tồn tại trong hệ thống.',
                  fields: { email: 'Địa chỉ email đã tồn tại trong hệ thống.' },
                },
              },
              { status: 409, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
        return origFetch(url, opts);
      };

      // Click submit multiple times rapidly
      document.querySelector('#btnSubmitCreateTeacher').click();
      document.querySelector('#btnSubmitCreateTeacher').click();
      document.querySelector('#btnSubmitCreateTeacher').click();
    });

    // Check pending state while request is in flight
    const pendingState = await page.evaluate(() => {
      const submitBtn = document.querySelector('#btnSubmitCreateTeacher');
      const cancelBtn = document.querySelector('#btnCancelCreateTeacher');
      const closeBtn = document.querySelector('#btnCloseTeacherCreateModal');
      const emailInput = document.querySelector('#teacherEmail');
      const nameInput = document.querySelector('#teacherDisplayName');
      return {
        submitDisabled: submitBtn?.disabled,
        submitText: submitBtn?.textContent?.trim(),
        cancelDisabled: cancelBtn?.disabled,
        closeDisabled: closeBtn?.disabled,
        emailDisabled: emailInput?.disabled,
        nameDisabled: nameInput?.disabled,
      };
    });

    assert.equal(pendingState.submitDisabled, true, 'Submit button must be disabled while pending');
    assert.equal(pendingState.submitText, 'Đang gửi lời mời...', 'Submit button must show pending label');
    assert.equal(pendingState.cancelDisabled, true, 'Cancel button must be disabled while pending');
    assert.equal(pendingState.closeDisabled, true, 'Close button must be disabled while pending');
    assert.equal(pendingState.emailDisabled, true, 'Email input must be disabled while pending');
    assert.equal(pendingState.nameDisabled, true, 'Name input must be disabled while pending');

    // Attempt Escape dismissal while held: MUST NOT dismiss
    await page.keyboard.press('Escape');
    let isModalVisible = await page.locator('#teacherCreateModal').isVisible();
    assert.equal(isModalVisible, true, 'Escape must NOT dismiss modal while pending');

    // Attempt Backdrop click while held: MUST NOT dismiss
    await page.click('#teacherCreateModalBackdrop', { position: { x: 5, y: 5 } });
    isModalVisible = await page.locator('#teacherCreateModal').isVisible();
    assert.equal(isModalVisible, true, 'Backdrop click must NOT dismiss modal while pending');

    // Wait for in-flight request to resolve with 409
    await page.waitForTimeout(550);

    const submitCount = await page.evaluate(() => window.__submitCount);
    assert.equal(submitCount, 1, 'Duplicate clicks while held must be ignored (submitCount === 1)');

    // Modal remains open, inputs retained, error focused on email
    await page.waitForFunction(() => document.activeElement?.id === 'teacherEmail');
    const errorState = await page.evaluate(() => {
      const emailInput = document.querySelector('#teacherEmail');
      const nameInput = document.querySelector('#teacherDisplayName');
      const errorMsg = document.querySelector('#teacherEmailError');
      return {
        emailValue: emailInput?.value,
        nameValue: nameInput?.value,
        errorText: errorMsg?.textContent?.trim(),
        isFocused: document.activeElement?.id === 'teacherEmail',
      };
    });

    assert.equal(errorState.emailValue, 'teacher.held@lingora.edu.vn', 'Email input must be retained on error');
    assert.equal(errorState.nameValue, 'Giáo Viên Test', 'DisplayName input must be retained on error');
    assert.ok(errorState.errorText?.includes('đã tồn tại'), 'Error message must be displayed');
    assert.equal(errorState.isFocused, true, 'First error field must receive focus');

    // 3. Retry with unique email and reconcile 201 Created
    await page.fill('#teacherEmail', 'teacher.unique@lingora.edu.vn');
    await page.evaluate(() => {
      window.fetch = (url, opts) => {
        if (opts?.method === 'POST' && url.includes('/api/teachers')) {
          return Promise.resolve(
            Response.json(
              {
                message: 'Đã gửi lời mời, chờ kích hoạt',
                data: {
                  id: '99999999-9999-4999-8999-999999999999',
                  email: 'teacher.unique@lingora.edu.vn',
                  displayName: 'Giáo Viên Test',
                  role: 'TEACHER',
                  status: 'PENDING',
                  createdAt: new Date().toISOString(),
                  activatedAt: null,
                },
              },
              { status: 201, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
        return Promise.reject(new Error('Unexpected fetch'));
      };
    });

    await page.click('#btnSubmitCreateTeacher');
    await page.waitForSelector('#teacherCreateModal', { state: 'hidden' });

    // Table reconciled with newly created Teacher in PENDING state
    const isNewRowPresent = await page.locator('#teacher-row-99999999-9999-4999-8999-999999999999').isVisible();
    assert.equal(isNewRowPresent, true, 'Newly created teacher must be reconciled to catalog table');

    const newRowStatus = await page.textContent('#badge-status-99999999-9999-4999-8999-999999999999');
    assert.equal(newRowStatus?.trim(), 'Chờ kích hoạt');

    // Check mutation status banner
    const mutationBanner = await page.textContent('#teacherMutationStatus');
    assert.ok(mutationBanner?.includes('Đã gửi lời mời'), 'Success mutation banner must be displayed');

    await context.close();
  });

  // =========================================================================
  // 2. TeacherStatusModal: Disable Flow (Reason Required), Enable Flow,
  //    Pending Locks & Authoritative DTO Reconciliation
  // =========================================================================

  test('TeacherStatusModal disable enforces nonblank reason, pending lock, and reconciles DISABLED status', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=teachers-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btn-disable-11111111-1111-4111-8111-111111111111', { state: 'visible' });

    // Click Vô hiệu hóa for Active Teacher Lan
    await page.click('#btn-disable-11111111-1111-4111-8111-111111111111');
    await page.waitForSelector('#teacherStatusModal', { state: 'visible' });

    // Reason textarea should be focused
    await page.waitForFunction(() => document.activeElement?.id === 'statusReason');
    const isReasonFocused = await page.evaluate(() => document.activeElement?.id === 'statusReason');
    assert.equal(isReasonFocused, true, 'Reason input must be focused on open');

    // 1. Attempt submitting with blank reason: must prevent submission and show validation error
    await page.click('#btnSubmitStatusTeacher');
    const reasonError = await page.textContent('#statusReasonError');
    assert.ok(reasonError?.includes('Vui lòng nhập lý do'), 'Blank reason must trigger validation error');

    // 2. Fill reason and submit with delayed mock to verify pending locks
    await page.fill('#statusReason', 'Tạm hoãn nhiệm vụ giảng dạy học kỳ 1');

    await page.evaluate(() => {
      window.__statusSubmitCount = 0;
      window.fetch = (url, opts) => {
        if (opts?.method === 'PATCH' && url.includes('/api/teachers/11111111-1111-4111-8111-111111111111')) {
          window.__statusSubmitCount++;
          return new Promise((resolve) => setTimeout(resolve, 500)).then(() =>
            Response.json(
              {
                data: {
                  id: '11111111-1111-4111-8111-111111111111',
                  email: 'teacher.lan@lingora.edu.vn',
                  displayName: 'Nguyễn Thị Lan',
                  role: 'TEACHER',
                  status: 'DISABLED',
                  createdAt: '2026-10-28T08:00:00.000Z',
                  activatedAt: '2026-10-28T09:00:00.000Z',
                },
              },
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
        return Promise.reject(new Error('Unexpected fetch'));
      };

      // Click multiple times rapidly
      document.querySelector('#btnSubmitStatusTeacher').click();
      document.querySelector('#btnSubmitStatusTeacher').click();
      document.querySelector('#btnSubmitStatusTeacher').click();
    });

    const isPendingDisabled = await page.evaluate(() => {
      const submitBtn = document.querySelector('#btnSubmitStatusTeacher');
      const cancelBtn = document.querySelector('#btnCancelStatusTeacher');
      return {
        submitDisabled: submitBtn?.disabled,
        submitText: submitBtn?.textContent?.trim(),
        cancelDisabled: cancelBtn?.disabled,
      };
    });

    assert.equal(isPendingDisabled.submitDisabled, true, 'Status submit button must be disabled while pending');
    assert.equal(isPendingDisabled.submitText, 'Đang xử lý...', 'Status submit button must show pending text');
    assert.equal(isPendingDisabled.cancelDisabled, true, 'Status cancel button must be disabled while pending');

    // Wait for resolution
    await page.waitForTimeout(550);

    const submitCount = await page.evaluate(() => window.__statusSubmitCount);
    assert.equal(submitCount, 1, 'Duplicate status submit clicks must be ignored');

    await page.waitForSelector('#teacherStatusModal', { state: 'hidden' });

    // Verify row reconciled to DISABLED and action button changed to "Kích hoạt lại"
    const rowStatusText = await page.textContent('#badge-status-11111111-1111-4111-8111-111111111111');
    assert.equal(rowStatusText?.trim(), 'Vô hiệu hóa');

    const isEnableBtnVisible = await page.locator('#btn-enable-11111111-1111-4111-8111-111111111111').isVisible();
    assert.equal(isEnableBtnVisible, true, 'Action button must transition to Kích hoạt lại');

    await context.close();
  });

  test('TeacherStatusModal enable flow successfully reconciles ACTIVE status', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=teachers-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btn-enable-22222222-2222-4222-8222-222222222222', { state: 'visible' });

    // Click Kích hoạt lại for Disabled Teacher Minh
    await page.click('#btn-enable-22222222-2222-4222-8222-222222222222');
    await page.waitForSelector('#teacherStatusModal', { state: 'visible' });

    await page.evaluate(() => {
      window.fetch = (url, opts) => {
        if (opts?.method === 'PATCH' && url.includes('/api/teachers/22222222-2222-4222-8222-222222222222')) {
          const body = JSON.parse(opts.body);
          if (body.action === 'enable') {
            return Promise.resolve(
              Response.json(
                {
                  data: {
                    id: '22222222-2222-4222-8222-222222222222',
                    email: 'teacher.minh@lingora.edu.vn',
                    displayName: 'Trần Văn Minh',
                    role: 'TEACHER',
                    status: 'ACTIVE',
                    createdAt: '2026-10-27T10:00:00.000Z',
                    activatedAt: '2026-10-27T11:00:00.000Z',
                  },
                },
                { status: 200, headers: { 'Content-Type': 'application/json' } }
              )
            );
          }
        }
        return Promise.reject(new Error('Unexpected fetch'));
      };
    });

    await page.click('#btnSubmitStatusTeacher');
    await page.waitForSelector('#teacherStatusModal', { state: 'hidden' });

    // Verify row reconciled to ACTIVE and button changed to "Vô hiệu hóa"
    const statusText = await page.textContent('#badge-status-22222222-2222-4222-8222-222222222222');
    assert.equal(statusText?.trim(), 'Đang hoạt động');

    const isDisableBtnVisible = await page.locator('#btn-disable-22222222-2222-4222-8222-222222222222').isVisible();
    assert.equal(isDisableBtnVisible, true);

    await context.close();
  });

  // =========================================================================
  // 3. Orphan Accounts & Inactive PENDING State Protection
  // =========================================================================

  test('Broken Auth identity (orphan) displays explicit notice and disables mutation controls', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=teachers-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#teacher-row-44444444-4444-4444-8444-444444444444', { state: 'visible' });

    // Check orphan row text
    const orphanRow = page.locator('#teacher-row-44444444-4444-4444-8444-444444444444');
    const noticeText = await orphanRow.locator('.teacher-email-orphan').textContent();
    assert.ok(noticeText?.includes('(Chưa có danh tính xác thực)'));

    // Action button for orphan row is disabled
    const disableBtn = orphanRow.locator('#btn-disable-44444444-4444-4444-8444-444444444444');
    const isDisabled = await disableBtn.isDisabled();
    assert.equal(isDisabled, true, 'Mutation button on orphan teacher must be disabled');

    // PENDING teacher (Hoa) has no enable/disable button
    const pendingRow = page.locator('#teacher-row-33333333-3333-4333-8333-333333333333');
    const pendingText = await pendingRow.textContent();
    assert.ok(pendingText?.includes('Chờ kích hoạt'));
    assert.ok(pendingText?.includes('Đang chờ kích hoạt'));
    const pendingActionBtns = await pendingRow.locator('button').count();
    assert.equal(pendingActionBtns, 0, 'PENDING teacher must not have enable or disable action buttons');

    await context.close();
  });

  // =========================================================================
  // 4. 403 Forbidden: Modal Dismissal, Inert Release, Hiding Controls & Usable Logout
  // =========================================================================

  test('403 Forbidden closes mutation modal, releases inert, hides mutation controls and provides usable Logout', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=teachers-populated`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btnOpenCreateTeacher', { state: 'visible' });

    await page.click('#btnOpenCreateTeacher');
    await page.waitForSelector('#teacherCreateModal', { state: 'visible' });

    // Mock 403 response
    await page.evaluate(() => {
      window.fetch = () =>
        Promise.resolve(
          Response.json(
            {
              error: {
                code: 'FORBIDDEN',
                message: 'Bạn không có quyền quản trị danh sách giáo viên.',
              },
            },
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          )
        );
    });

    await page.fill('#teacherEmail', 'forbidden@lingora.edu.vn');
    await page.click('#btnSubmitCreateTeacher');

    // Modal closed and inert removed
    await page.waitForSelector('#teacherCreateModal', { state: 'hidden' });
    const isInert = await page.evaluate(() => document.getElementById('appContainer')?.hasAttribute('inert'));
    assert.equal(isInert, false, 'Inert attribute must be removed upon 403 dismissal');

    // Denial banner displayed
    await page.waitForSelector('#teachersForbiddenBanner', { state: 'visible' });
    const bannerText = await page.textContent('#teachersForbiddenBanner');
    assert.ok(bannerText?.includes('Bạn không có quyền'));

    // Mutation controls hidden
    const isCreateBtnVisible = await page.locator('#btnOpenCreateTeacher').isVisible();
    assert.equal(isCreateBtnVisible, false, 'Create button must be hidden on 403');

    // Usable logout button present
    const isLogoutBtnVisible = await page.locator('#btnForbiddenLogout').isVisible();
    assert.equal(isLogoutBtnVisible, true, 'Usable logout button must be present in denial banner');

    await context.close();
  });

  // =========================================================================
  // 5. Production Page Wiring & Exact API Callbacks (Mutant D kill)
  // =========================================================================

  test('Production TeachersPage wires to actual catalogue, invokes exact POST/PATCH API URLs and payload (Mutant D kill)', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=page-teachers-wire`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btnOpenCreateTeacher', { state: 'visible' });

    let capturedPostUrl = null;
    let capturedPostBody = null;
    let capturedPatchUrl = null;
    let capturedPatchBody = null;

    await page.exposeFunction('__recordApiCall', (type, url, body) => {
      if (type === 'POST') {
        capturedPostUrl = url;
        capturedPostBody = body;
      } else if (type === 'PATCH') {
        capturedPatchUrl = url;
        capturedPatchBody = body;
      }
    });

    await page.evaluate(() => {
      window.fetch = async (url, opts) => {
        if (opts?.method === 'POST') {
          window.__recordApiCall('POST', url, opts.body);
          return Response.json(
            {
              message: 'Đã gửi lời mời, chờ kích hoạt',
              data: {
                id: '88888888-8888-4888-8888-888888888888',
                email: 'prod.teacher@lingora.edu.vn',
                displayName: 'Tên từ Server',
                role: 'TEACHER',
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                activatedAt: null,
              },
            },
            { status: 201, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (opts?.method === 'PATCH') {
          window.__recordApiCall('PATCH', url, opts.body);
          return Response.json(
            {
              data: {
                id: '11111111-1111-4111-8111-111111111111',
                email: 'teacher.lan@lingora.edu.vn',
                displayName: 'Tên được Server cập nhật',
                role: 'TEACHER',
                status: 'DISABLED',
                createdAt: '2026-10-28T08:00:00.000Z',
                activatedAt: '2026-10-28T09:00:00.000Z',
              },
            },
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return Promise.reject(new Error('Unexpected fetch'));
      };
    });

    // 1. Create Teacher callback test
    await page.click('#btnOpenCreateTeacher');
    await page.waitForSelector('#teacherCreateModal', { state: 'visible' });
    await page.fill('#teacherEmail', 'prod.teacher@lingora.edu.vn');
    await page.fill('#teacherDisplayName', 'Giáo Viên Production');
    await page.click('#btnSubmitCreateTeacher');
    await page.waitForSelector('#teacherCreateModal', { state: 'hidden' });

    assert.equal(capturedPostUrl, '/api/teachers', 'Mutant D: Create must call exact /api/teachers endpoint');
    assert.deepEqual(JSON.parse(capturedPostBody), {
      email: 'prod.teacher@lingora.edu.vn',
      displayName: 'Giáo Viên Production',
    });

    assert.ok((await page.locator('#teacher-row-88888888-8888-4888-8888-888888888888').textContent()).includes('Tên từ Server'));

    // 2. Status Teacher callback test
    await page.click('#btn-disable-11111111-1111-4111-8111-111111111111');
    await page.waitForSelector('#teacherStatusModal', { state: 'visible' });
    await page.fill('#statusReason', 'Lý do kiểm thử production');
    await page.click('#btnSubmitStatusTeacher');
    await page.waitForSelector('#teacherStatusModal', { state: 'hidden' });

    assert.equal(
      capturedPatchUrl,
      '/api/teachers/11111111-1111-4111-8111-111111111111',
      'Mutant D: Disable must call exact /api/teachers/[accountId] endpoint'
    );
    assert.deepEqual(JSON.parse(capturedPatchBody), {
      action: 'disable',
      reason: 'Lý do kiểm thử production',
    });

    assert.ok((await page.locator('#teacher-row-11111111-1111-4111-8111-111111111111').textContent()).includes('Tên được Server cập nhật'));
    assert.equal((await page.locator('#badge-status-11111111-1111-4111-8111-111111111111').textContent()).trim(), 'Vô hiệu hóa');
    await context.close();
  });

  // =========================================================================
  // 6. Viewport Layout & Keyboard Navigation (1440x960 and 1100x800)
  // =========================================================================

  test('Responsive viewports 1440x960 and 1100x800 layout integrity and screenshots', async () => {
    const viewports = [
      { width: 1440, height: 960, name: 'desktop-1440' },
      { width: 1100, height: 800, name: 'tablet-1100' },
    ];

    for (const vp of viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto(`${TEST_URL}?state=teachers-populated`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#teachersTable', { state: 'visible' });

      // Check table layout width
      const tableBox = await page.locator('#teachersTable').boundingBox();
      assert.ok(tableBox.width > 700, `Table width must fit viewport at ${vp.width}px`);

      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'Page must not overflow horizontally');
      assert.ok((await page.locator('#teachersCatalogue .page-header').boundingBox()).x > 212, 'Frozen content padding is retained');

      // Screenshot saved strictly outside repo
      await page.screenshot({
        path: path.join(LOGS_DIR, `teachers-catalog-${vp.name}.png`),
        fullPage: true,
      });

      // Open modal and capture modal screenshot
      await page.click('#btnOpenCreateTeacher');
      await page.waitForSelector('#teacherCreateModal', { state: 'visible' });

      await page.screenshot({
        path: path.join(LOGS_DIR, `teacher-create-modal-${vp.name}.png`),
      });

      await page.click('#btnCancelCreateTeacher');
      await page.waitForSelector('#teacherCreateModal', { state: 'hidden' });
      await page.waitForFunction(() => document.activeElement?.id === 'btnOpenCreateTeacher');

      assert.equal(consoleErrors.length, 0, `No console errors at viewport ${vp.width}x${vp.height}`);
      await context.close();
    }
  });
});

describe('S4-TEACHERS: Activation runtime and mutation failure recovery', () => {
  let server, browser;
  before(async () => { server = await startIsolatedServer(TEST_PORT); browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] }); });
  after(async () => { await browser?.close(); await server?.close(); });
  for (const action of ['create', 'status']) for (const status of [401, 403]) {
    test(`${action} ${status} dismisses modal truthfully and leaves recovery usable`, async () => {
      const context = await browser.newContext(); const page = await context.newPage();
      try {
        await page.goto(`${TEST_URL}?state=teachers-populated`);
        await page.evaluate(() => { sessionStorage.setItem('lingora_draft_lang_old-admin', '{}'); sessionStorage.setItem('unrelated', 'keep'); });
        let loggedOut = false;
        await page.route('**/api/auth/logout', route => { loggedOut = true; return route.fulfill({ status: 200, json: { ok: true } }); });
        await page.route('**/login', route => route.fulfill({ status: 200, body: '<h1>Login</h1>', contentType: 'text/html' }));
        await page.route('**/api/teachers**', route => route.fulfill({ status, json: { error: { code: status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN', message: 'Quyền đã thay đổi' } } }));
        if (action === 'create') { await page.click('#btnOpenCreateTeacher'); await page.fill('#teacherEmail', 'fixture@example.test'); await page.click('#btnSubmitCreateTeacher'); }
        else { await page.click('#btn-disable-11111111-1111-4111-8111-111111111111'); await page.fill('#statusReason', 'fixture reason'); await page.click('#btnSubmitStatusTeacher'); }
        await page.waitForSelector(action === 'create' ? '#teacherCreateModal' : '#teacherStatusModal', { state: 'hidden' });
        assert.equal(await page.locator('#teacherMutationStatus').count(), 0);
        if (status === 403) {
          await page.waitForSelector('#btnForbiddenLogout');
          assert.equal(await page.locator('#appContainer').getAttribute('inert'), null);
          assert.equal(await page.locator('#btnOpenCreateTeacher').count(), 0);
          await page.click('#btnForbiddenLogout'); await page.waitForURL('**/login'); assert.equal(loggedOut, true);
          assert.equal(await page.evaluate(() => sessionStorage.getItem('lingora_draft_lang_old-admin')), null);
          assert.equal(await page.evaluate(() => sessionStorage.getItem('unrelated')), 'keep');
        } else {
          const text = await page.locator('[role="dialog"]').textContent();
          assert.ok(text.includes('Phiên đăng nhập')); assert.equal(text.includes('đã được lưu'), false);
        }
      } finally { await context.close(); }
    });
  }
  test('status held request locks confirmation/dismissal, failure retains reason then reconciles server result', async () => {
    const context = await browser.newContext(); const page = await context.newPage(); let release;
    try {
      await page.goto(`${TEST_URL}?state=teachers-populated`); let calls = 0;
      const held = new Promise(resolve => { release = resolve; });
      await page.route('**/api/teachers/*', async route => { calls++; await held; await route.fulfill({ status: 503, json: { error: { message: 'Tạm thời chưa thể cập nhật' } } }); });
      await page.click('#btn-disable-11111111-1111-4111-8111-111111111111'); await page.fill('#statusReason', 'Preserve this reason');
      await page.evaluate(() => { const b = document.querySelector('#btnSubmitStatusTeacher'); b.click(); b.click(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
      await page.waitForFunction(() => document.querySelector('#btnSubmitStatusTeacher').disabled);
      assert.equal(await page.locator('#teacherStatusModal').isVisible(), true);
      await page.click('#teacherStatusModalBackdrop', { position: { x: 2, y: 2 } });
      assert.equal(await page.locator('#teacherStatusModal').isVisible(), true);
      release(); await page.waitForFunction(() => !document.querySelector('#btnSubmitStatusTeacher').disabled);
      assert.equal(calls, 1); assert.equal(await page.inputValue('#statusReason'), 'Preserve this reason');
      assert.equal((await page.locator('#badge-status-11111111-1111-4111-8111-111111111111').textContent()).trim(), 'Đang hoạt động');
      assert.equal(await page.locator('#teacherMutationStatus').count(), 0);
      await page.keyboard.press('Escape'); await page.waitForSelector('#teacherStatusModal', { state: 'hidden' });
      await page.waitForFunction(() => document.activeElement?.id === 'btn-disable-11111111-1111-4111-8111-111111111111');
    } finally { release?.(); await context.close(); }
  });
  test('real invite fragment bootstraps SSR-compatible cookies, clears URL/drafts, serializes submit and clears passwords after failure', async () => {
    const context = await browser.newContext(); const page = await context.newPage(); let release;
    try {
      const id = '11111111-1111-4111-8111-111111111111'; const now = Math.floor(Date.now() / 1000);
      const token = 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({ sub: id, exp: now + 3600, iat: now, aud: 'authenticated', role: 'authenticated' })).toString('base64url') + '.test-signature';
      let authCalls = 0, posts = 0;
      await page.route('https://supabase.test/**', route => { authCalls++; return route.fulfill({ status: 200, json: { id, email: 'invited@example.test', email_confirmed_at: new Date().toISOString(), app_metadata: {}, user_metadata: {} } }); });
      const held = new Promise(resolve => { release = resolve; });
      await page.route('**/api/auth/teacher-activation', async route => {
        if (route.request().method() === 'GET') return route.fulfill({ status: 200, json: { ok: true, email: 'invited@example.test', displayName: 'Invited Teacher' } });
        posts++; assert.deepEqual(Object.keys(route.request().postDataJSON()), ['password']); await held;
        return route.fulfill({ status: 503, json: { error: { message: 'Chưa hoàn tất kích hoạt' } } });
      });
      await page.goto(TEST_URL); await page.evaluate(() => sessionStorage.setItem('lingora_draft_lang_previous-admin', '{}'));
      await page.goto(`${TEST_URL}?state=teacher-activation#type=invite&access_token=${token}&refresh_token=synthetic-refresh`);
      await page.waitForSelector('#newPassword'); assert.equal(new URL(page.url()).hash, ''); assert.equal(authCalls, 1);
      assert.equal(await page.evaluate(() => sessionStorage.getItem('lingora_draft_lang_previous-admin')), null);
      assert.ok((await context.cookies()).some(c => c.name.startsWith('sb-')), 'Manual setSession writes SSR cookie storage');
      await page.fill('#newPassword', 'é'.repeat(37)); await page.fill('#confirmPassword', 'é'.repeat(37));
      await page.click('#btnSubmitActivation'); await page.waitForSelector('#activationErrorMsg');
      assert.equal(posts, 0, 'Oversized UTF-8 password must be rejected before provider/API effects');
      assert.ok((await page.locator('#activationErrorMsg').textContent()).includes('quá dài'));
      await page.fill('#newPassword', 'synthetic-password'); await page.fill('#confirmPassword', 'synthetic-password');
      await page.evaluate(() => { const b = document.querySelector('#btnSubmitActivation'); b.click(); b.click(); });
      await page.waitForFunction(() => document.querySelector('#btnSubmitActivation').disabled); release();
      await page.waitForSelector('#activationErrorMsg'); assert.equal(posts, 1);
      assert.equal(await page.inputValue('#newPassword'), ''); assert.equal(await page.inputValue('#confirmPassword'), '');
      assert.equal(await page.evaluate(() => window.__lastNavigatedUrl), undefined);
    } finally { release?.(); await context.close(); }
  });
  for (const fragment of ['type=recovery&access_token=synthetic&refresh_token=synthetic', 'error=access_denied&type=invite']) {
    test(`unrecognized/expired invite cannot fall back to an ambient session (${fragment.split('&')[0]})`, async () => {
      const context = await browser.newContext(); const page = await context.newPage(); let requests = 0;
      try {
        await page.route('**/api/auth/teacher-activation', route => { requests++; return route.fulfill({ status: 200, json: { ok: true } }); });
        await page.goto(`${TEST_URL}?state=teacher-activation#${fragment}`);
        await page.getByText('Không thể kích hoạt tài khoản', { exact: true }).waitFor();
        assert.equal(new URL(page.url()).hash, ''); assert.equal(requests, 0); assert.equal(await page.locator('#newPassword').count(), 0);
      } finally { await context.close(); }
    });
  }
});
