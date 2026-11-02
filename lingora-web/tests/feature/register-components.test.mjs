import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startRegistrationServer } from './harness/registration-harness.mjs';

const TEST_PORT = 3028;
let server;
let browser;

describe('Package A: Dedicated Registration UI & Component Tests', () => {
  before(async () => {
    server = await startRegistrationServer(TEST_PORT);
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  });

  after(async () => {
    if (browser) await browser.close();
    if (server) await server.close();
  });

  test('RegisterForm: initial focus, empty email and password validation', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${server.origin}/register`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#authView', { state: 'visible' });

    // 1. Initial focus on email input
    const isFocused = await page.evaluate(() => document.activeElement?.id === 'registerEmail');
    assert.equal(isFocused, true, 'Email input should be focused on mount');

    // 2. Submit empty email
    await page.click('#registerSubmitBtn');
    await page.waitForSelector('#registerAlert', { state: 'visible' });
    let alertText = await page.textContent('#registerAlert');
    assert.match(alertText, /nhập địa chỉ email/i);

    // 3. Fill email, submit empty password
    await page.fill('#registerEmail', 'test@lingora.edu.vn');
    await page.click('#registerSubmitBtn');
    alertText = await page.textContent('#registerAlert');
    assert.match(alertText, /nhập mật khẩu/i);

    // 4. Fill short password (< 8 chars)
    await page.fill('#registerPassword', 'short7');
    await page.click('#registerSubmitBtn');
    alertText = await page.textContent('#registerAlert');
    assert.match(alertText, /ít nhất 8 ký tự/i);

    await context.close();
  });

  test('RegisterForm: submits POST /api/auth/register and shows pending state', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    let capturedHeaders = null;
    let capturedBody = null;

    await page.route('**/api/auth/register', async (route) => {
      capturedHeaders = route.request().headers();
      capturedBody = JSON.parse(route.request().postData() || '{}');
      await new Promise((r) => setTimeout(r, 200));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          message: 'Vui lòng kiểm tra hộp thư email của bạn để xác thực tài khoản.',
        }),
      });
    });

    await page.goto(`${server.origin}/register`, { waitUntil: 'domcontentloaded' });

    await page.fill('#registerEmail', 'learner.flow@lingora.edu.vn');
    await page.fill('#registerPassword', 'strongPassword123');
    await page.fill('#registerDisplayName', 'Trần Học Viên');

    const clickPromise = page.click('#registerSubmitBtn');

    // Verify pending disabled state
    await page.waitForFunction(() => {
      const btn = document.querySelector('#registerSubmitBtn');
      return btn?.disabled === true && btn?.textContent?.includes('Đang đăng ký');
    });

    await clickPromise;

    // Verify POST request details
    assert.equal(capturedHeaders['origin'], server.origin);
    assert.equal(capturedHeaders['content-type'], 'application/json');
    assert.equal(capturedBody.email, 'learner.flow@lingora.edu.vn');
    assert.equal(capturedBody.password, 'strongPassword123');
    assert.equal(capturedBody.displayName, 'Trần Học Viên');

    // Verify success UI
    await page.waitForSelector('#registerSuccess', { state: 'visible' });
    const successText = await page.textContent('#registerSuccess');
    assert.match(successText, /kiểm tra hộp thư/i);

    const loginLink = await page.$('#loginLink');
    assert.ok(loginLink);
    const href = await loginLink.getAttribute('href');
    assert.equal(href, '/login');

    await context.close();
  });

  test('RegisterForm: server error displays in #registerAlert and clears password field', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'REGISTRATION_FAILED',
            message: 'Email này không được chấp nhận.',
          },
        }),
      });
    });

    await page.goto(`${server.origin}/register`, { waitUntil: 'domcontentloaded' });

    await page.fill('#registerEmail', 'bad@lingora.edu.vn');
    await page.fill('#registerPassword', 'secretPassword123');

    await page.click('#registerSubmitBtn');

    await page.waitForSelector('#registerAlert', { state: 'visible' });
    const alertText = await page.textContent('#registerAlert');
    assert.match(alertText, /Email này không được chấp nhận/i);

    // Password field must be cleared
    const passwordValue = await page.inputValue('#registerPassword');
    assert.equal(passwordValue, '');

    await context.close();
  });

  test('RegisterForm: includes navigation link to /login', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${server.origin}/register`, { waitUntil: 'domcontentloaded' });

    const toLoginLink = await page.$('#toLoginLink');
    assert.ok(toLoginLink);
    const href = await toLoginLink.getAttribute('href');
    assert.equal(href, '/login');

    await context.close();
  });

  test('LoginForm: contains link to /register', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${server.origin}/login?view=login`, { waitUntil: 'domcontentloaded' });

    const toRegisterLink = await page.$('#toRegisterLink');
    assert.ok(toRegisterLink, '#toRegisterLink must be present on LoginForm');
    const href = await toRegisterLink.getAttribute('href');
    assert.equal(href, '/register');

    await context.close();
  });

  test('LoginForm: handles ?confirmed=1 query parameter with success message', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${server.origin}/login?view=login&confirmed=1`, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('#loginInfoAlert', { state: 'visible' });
    const text = await page.textContent('#loginInfoAlert');
    assert.match(text, /xác thực email thành công/i);

    await context.close();
  });

  test('LoginForm: handles ?error=confirmation_failed query parameter with error message', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${server.origin}/login?view=login&error=confirmation_failed`, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('#loginAlert', { state: 'visible' });
    const text = await page.textContent('#loginAlert');
    assert.match(text, /liên kết xác thực không hợp lệ hoặc đã hết hạn/i);

    await context.close();
  });
});
