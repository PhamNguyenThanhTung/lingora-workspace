import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { startIsolatedServer } from './harness/isolated-server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const TEST_PORT = 3019;
const TEST_URL = `http://127.0.0.1:${TEST_PORT}`;

describe('Slice 9: Isolated Component State & Interaction Tests', () => {
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

  test('LoginForm: autofocuses email input and handles empty validation', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#authView', { state: 'visible' });

    // Verify initial focus is on email
    const isEmailFocused = await page.evaluate(() => {
      return document.activeElement?.id === 'loginEmail';
    });
    assert.equal(isEmailFocused, true, 'Email input must be focused on mount');

    // Click submit without entering email
    await page.click('#loginSubmitBtn');
    await page.waitForSelector('#loginAlert', { state: 'visible' });

    const alertText = await page.textContent('#loginAlert');
    assert.match(alertText, /nhập địa chỉ email/i);

    // Verify focus remains on email
    const focusAfterEmpty = await page.evaluate(() => document.activeElement?.id);
    assert.equal(focusAfterEmpty, 'loginEmail');

    await context.close();
  });

  test('LoginForm: shows pending state and disables button during submission', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=login`, { waitUntil: 'domcontentloaded' });

    // Intercept login request to introduce artificial delay
    await page.route('**/api/auth/login', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            user: { id: '11111111-1111-4111-8111-111111111111' },
            account: { id: '11111111-1111-4111-8111-111111111111', role: 'LEARNER', status: 'ACTIVE' },
          },
        }),
      });
    });

    await page.fill('#loginEmail', 'learner@lingora.edu.vn');
    await page.fill('#loginPassword', 'secret123');

    // Click submit and observe pending state
    const submitPromise = page.click('#loginSubmitBtn');

    await page.waitForFunction(() => {
      const btn = document.querySelector('#loginSubmitBtn');
      return btn?.disabled === true && btn?.textContent?.includes('Đang đăng nhập');
    });

    const isPending = await page.evaluate(() => {
      const btn = document.querySelector('#loginSubmitBtn');
      return {
        disabled: btn?.disabled,
        text: btn?.textContent?.trim(),
      };
    });

    assert.equal(isPending.disabled, true);
    assert.equal(isPending.text, 'Đang đăng nhập...');

    await submitPromise;
    await context.close();
  });

  test('LoginForm: handles invalid credentials by preserving email, clearing password, and focusing password', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=login`, { waitUntil: 'domcontentloaded' });

    await page.fill('#loginEmail', 'wrong@lingora.edu.vn');
    await page.fill('#loginPassword', 'wrongpassword');
    await page.click('#loginSubmitBtn');

    await page.waitForSelector('#loginAlert', { state: 'visible' });
    const alertText = await page.textContent('#loginAlert');
    assert.match(alertText, /không chính xác/i);

    await page.waitForFunction(() => document.activeElement?.id === 'loginPassword');

    // Verify email preserved, password cleared, password focused
    const values = await page.evaluate(() => {
      return {
        email: document.querySelector('#loginEmail')?.value,
        password: document.querySelector('#loginPassword')?.value,
        focusedId: document.activeElement?.id,
      };
    });

    assert.equal(values.email, 'wrong@lingora.edu.vn');
    assert.equal(values.password, '');
    assert.equal(values.focusedId, 'loginPassword');

    await context.close();
  });

  test('LoginForm: handles account inactive (403) error cleanly', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.route('**/api/auth/login', route => route.fulfill({ status:403, contentType:'application/json', body:JSON.stringify({error:{code:'ACCOUNT_INACTIVE',message:'Tài khoản đang chờ duyệt hoặc đã bị vô hiệu hóa.'}}) }));

    await page.goto(`${TEST_URL}?state=login`, { waitUntil: 'domcontentloaded' });

    await page.fill('#loginEmail', 'pending@lingora.edu.vn');
    await page.fill('#loginPassword', 'password');
    await page.click('#loginSubmitBtn');

    await page.waitForSelector('#loginAlert', { state: 'visible' });
    const alertText = await page.textContent('#loginAlert');
    assert.match(alertText, /chờ duyệt hoặc đã bị vô hiệu hóa/i);

    await context.close();
  });

  test('LoginForm: successful login navigates to /home', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=login`, { waitUntil: 'domcontentloaded' });

    await page.fill('#loginEmail', 'learner@lingora.edu.vn');
    await page.fill('#loginPassword', 'secret123');
    await page.click('#loginSubmitBtn');

    await page.waitForFunction(() => window.__lastNavigatedUrl === '/home');

    const navigated = await page.evaluate(() => window.__lastNavigatedUrl);
    assert.equal(navigated, '/home', 'Successful login must navigate to /home');

    await context.close();
  });

  test('LoginForm: keyboard Enter submit works correctly', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=login`, { waitUntil: 'domcontentloaded' });

    await page.fill('#loginEmail', 'learner@lingora.edu.vn');
    await page.fill('#loginPassword', 'secret123');
    await page.press('#loginPassword', 'Enter');

    await page.waitForFunction(() => window.__lastNavigatedUrl === '/home');
    const navigated = await page.evaluate(() => window.__lastNavigatedUrl);
    assert.equal(navigated, '/home');

    await context.close();
  });

  test('HomeView: renders valid learner identity and context summary', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=home-valid`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#homeView', { state: 'visible' });

    // Verify learner identity
    const learnerName = await page.textContent('#learnerIdentity');
    assert.match(learnerName, /Nguyễn Văn Học/);

    // Verify context card details
    await page.waitForSelector('.context-card', { state: 'visible' });
    const courseTitle = await page.textContent('.context-course-name');
    assert.match(courseTitle, /Tiếng Anh Giao Tiếp Cơ Bản/);

    const targetLang = await page.textContent('.context-target-lang');
    assert.match(targetLang, /Tiếng Anh/);

    const cardText = await page.textContent('.context-card');
    assert.match(cardText, /CEFR \(2020\)/);
    assert.match(cardText, /A1 Mới bắt đầu/);
    assert.match(cardText, /A2 Sơ cấp/);
    assert.match(cardText, /Đang mở/);
    assert.match(cardText, /Đang học/);

    // Verify Logout button exists and is usable
    const logoutVisible = await page.isVisible('#logoutBtn');
    assert.equal(logoutVisible, true);

    await context.close();
  });

  test('HomeView: empty context displays "Bạn chưa có lộ trình học." and keeps Logout usable', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=home-empty`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#emptyContextState', { state: 'visible' });

    const emptyText = await page.textContent('#emptyContextState');
    assert.match(emptyText, /Bạn chưa có lộ trình học/);

    const logoutVisible = await page.isVisible('#logoutBtn');
    assert.equal(logoutVisible, true);

    await context.close();
  });

  test('HomeView: 403 Forbidden renders accessible denial with Logout and no redirect loop', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=home-403`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#errorBox', { state: 'visible' });

    const title = await page.textContent('.alert-title');
    assert.match(title, /Truy cập bị từ chối/);

    const message = await page.textContent('.alert-message');
    assert.match(message, /Tài khoản không thuộc phân hệ học viên/);

    // Logout button must be present in header and alert actions
    const logoutBtns = await page.$$eval('button', btns =>
      btns.filter(b => b.textContent?.includes('Đăng xuất')).length
    );
    assert.ok(logoutBtns >= 1, 'Logout button must remain usable in 403 state');

    // Verify no redirect loop occurred
    const navigated = await page.evaluate(() => window.__lastNavigatedUrl);
    assert.equal(navigated, undefined, 'Must not redirect in a loop on 403');

    await context.close();
  });

  test('HomeView: 503 Service Unavailable renders retry button and Logout', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=home-503`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#errorBox', { state: 'visible' });

    const title = await page.textContent('.alert-title');
    assert.match(title, /Dịch vụ tạm thời không khả dụng/);

    const retryBtnVisible = await page.isVisible('#retryBtn');
    assert.equal(retryBtnVisible, true);

    // Click retry
    await page.click('#retryBtn');
    const refreshCalled = await page.evaluate(() => window.__refreshCalled);
    assert.equal(refreshCalled, true, 'Retry must call router.refresh()');

    await context.close();
  });

  test('HomeView: 409 Context Inconsistent renders safe support message and retry', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=home-409`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#errorBox', { state: 'visible' });

    const title = await page.textContent('.alert-title');
    assert.match(title, /Dữ liệu không nhất quán/);

    const retryBtnVisible = await page.isVisible('#retryBtn');
    assert.equal(retryBtnVisible, true);

    await context.close();
  });

  test('HomeView: clicking Logout invokes logout API and navigates to /login', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${TEST_URL}?state=home-valid`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#logoutBtn', { state: 'visible' });

    await page.click('#logoutBtn');
    await page.waitForFunction(() => window.__lastNavigatedUrl === '/login');

    const navigated = await page.evaluate(() => window.__lastNavigatedUrl);
    assert.equal(navigated, '/login', 'Logout must navigate to /login');

    await context.close();
  });
});
