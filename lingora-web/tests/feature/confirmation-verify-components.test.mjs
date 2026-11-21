import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startRegistrationServer } from './harness/registration-harness.mjs';

const TEST_PORT = 3029;
let server;
let browser;

describe('S12-XDEVICE 5.11 - 5.12: Component Tests (/auth/verify, LoginForm, ResendConfirmationForm)', () => {
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

  test('11a. /auth/verify with valid token & type renders form action="/auth/confirm", hidden inputs, button "Xác nhận email"', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${server.origin}/verify?view=verify&token_hash=valid_hash_abc123&type=email`, {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForSelector('#authView', { state: 'visible' });
    const heading = await page.textContent('.login-heading');
    assert.match(heading, /xác nhận email/i);

    // Verify form exists with action=/auth/confirm and method=post
    const form = page.locator('form[action="/auth/confirm"][method="post"]');
    assert.equal(await form.count(), 1, 'Form method=post action=/auth/confirm must be rendered');

    // Verify hidden inputs
    const tokenInput = page.locator('input[type="hidden"][name="token_hash"]');
    assert.equal(await tokenInput.getAttribute('value'), 'valid_hash_abc123');

    const typeInput = page.locator('input[type="hidden"][name="type"]');
    assert.equal(await typeInput.getAttribute('value'), 'email');

    // Verify submit button
    const submitBtn = page.locator('#verifySubmitBtn');
    assert.equal(await submitBtn.count(), 1);
    const btnText = await submitBtn.textContent();
    assert.match(btnText, /xác nhận email/i);

    // Verify verifyErrorAlert is NOT rendered
    assert.equal(await page.locator('#verifyErrorAlert').count(), 0);

    await context.close();
  });

  test('11b. /auth/verify with invalid token or type: NO form action="/auth/confirm", renders error and ResendConfirmationForm', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Bad token (contains slash) and bad type (recovery)
    await page.goto(`${server.origin}/verify?view=verify&token_hash=invalid/hash&type=recovery`, {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForSelector('#authView', { state: 'visible' });

    // Must NOT render confirmation form
    const form = page.locator('form[action="/auth/confirm"]');
    assert.equal(await form.count(), 0, 'Must NOT render confirmation form on invalid parameters');

    // Must render error alert
    await page.waitForSelector('#verifyErrorAlert', { state: 'visible' });
    const errorText = await page.textContent('#verifyErrorAlert');
    assert.match(errorText, /không hợp lệ hoặc thiếu thông tin/i);

    // Must render ResendConfirmationForm
    const resendEmail = page.locator('#resendEmail');
    assert.equal(await resendEmail.count(), 1);
    const resendBtn = page.locator('#resendSubmitBtn');
    assert.equal(await resendBtn.count(), 1);

    await context.close();
  });

  test('12a. LoginForm: displays correct notification for error query params and shows resend block when applicable', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. error=confirmation_failed -> message + resend block
    await page.goto(`${server.origin}/login?view=login&error=confirmation_failed`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#loginAlert', { state: 'visible' });
    let alertText = await page.textContent('#loginAlert');
    assert.match(alertText, /liên kết xác thực không hợp lệ hoặc đã hết hạn/i);
    assert.match(alertText, /gửi lại email xác nhận bên dưới/i);
    assert.ok(!alertText.includes('mở trên thiết bị khác'), 'Must drop old device hint');
    assert.equal(await page.locator('#loginResendSection').count(), 1);

    // 2. error=missing_confirmation_token -> message + resend block
    await page.goto(`${server.origin}/login?view=login&error=missing_confirmation_token`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#loginAlert', { state: 'visible' });
    alertText = await page.textContent('#loginAlert');
    assert.match(alertText, /thiếu mã xác thực trong liên kết/i);
    assert.equal(await page.locator('#loginResendSection').count(), 1);

    // 3. error=invalid_confirmation_type -> message, no resend block
    await page.goto(`${server.origin}/login?view=login&error=invalid_confirmation_type`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#loginAlert', { state: 'visible' });
    alertText = await page.textContent('#loginAlert');
    assert.match(alertText, /loại liên kết xác thực không hợp lệ/i);

    // 4. error=service_unavailable -> message
    await page.goto(`${server.origin}/login?view=login&error=service_unavailable`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#loginAlert', { state: 'visible' });
    alertText = await page.textContent('#loginAlert');
    assert.match(alertText, /dịch vụ xác thực tạm thời không khả dụng/i);

    await context.close();
  });

  test('12b. LoginForm: 403 unconfirmed email from login route shows resend block prefilled with email', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'FORBIDDEN',
            message: 'Tài khoản chưa xác thực email. Vui lòng xác thực email trước khi đăng nhập.',
          },
        }),
      });
    });

    await page.goto(`${server.origin}/login?view=login`, { waitUntil: 'domcontentloaded' });
    await page.fill('#loginEmail', 'unconfirmed.user@lingora.edu.vn');
    await page.fill('#loginPassword', 'anyPassword123');
    await page.click('#loginSubmitBtn');

    await page.waitForSelector('#loginAlert', { state: 'visible' });
    const alertText = await page.textContent('#loginAlert');
    assert.match(alertText, /chưa xác thực email/i);

    // Resend section must appear
    await page.waitForSelector('#loginResendSection', { state: 'visible' });
    const resendEmailVal = await page.inputValue('#resendEmail');
    assert.equal(resendEmailVal, 'unconfirmed.user@lingora.edu.vn');

    await context.close();
  });

  test('12c. ResendConfirmationForm: pending, 429 rate limit message, 200 success and 60s cooldown', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    let resendAttempts = 0;

    await page.route('**/api/auth/resend-confirmation', async (route) => {
      resendAttempts++;
      if (resendAttempts === 1) {
        // First attempt: 429 rate limited
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'RATE_LIMITED',
              message: 'Yêu cầu gửi quá nhanh. Vui lòng thử lại sau giây lát.',
            },
          }),
        });
      } else {
        // Second attempt: 200 success
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            message: 'Nếu email đã đăng ký và chưa xác thực, chúng tôi đã gửi lại liên kết xác nhận. Vui lòng kiểm tra hộp thư.',
          }),
        });
      }
    });

    await page.goto(`${server.origin}/login?view=login&error=confirmation_failed`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#loginResendSection', { state: 'visible' });

    // Submit with empty email -> client validation
    await page.click('#resendSubmitBtn');
    await page.waitForSelector('#resendAlert', { state: 'visible' });
    let resendMsg = await page.textContent('#resendAlert');
    assert.match(resendMsg, /nhập địa chỉ email/i);

    // Submit with email -> 429 response
    await page.fill('#resendEmail', 'rate.test@lingora.edu.vn');
    await page.click('#resendSubmitBtn');
    await page.waitForSelector('#resendAlert', { state: 'visible' });
    resendMsg = await page.textContent('#resendAlert');
    assert.match(resendMsg, /yêu cầu gửi quá nhanh/i);

    // Submit again -> 200 success with 60s cooldown
    await page.click('#resendSubmitBtn');
    await page.waitForSelector('#resendAlert', { state: 'visible' });
    resendMsg = await page.textContent('#resendAlert');
    assert.match(resendMsg, /đã gửi lại liên kết xác nhận/i);

    // Button disabled and shows countdown
    const submitBtn = page.locator('#resendSubmitBtn');
    assert.equal(await submitBtn.isDisabled(), true);
    const btnText = await submitBtn.textContent();
    assert.match(btnText, /gửi lại sau \(\d+s\)/i);

    await context.close();
  });

  test('16. Layout on narrow mobile viewports (360px and 390px) does not overflow horizontally', async () => {
    for (const width of [360, 390]) {
      const context = await browser.newContext({
        viewport: { width, height: 800 },
      });
      const page = await context.newPage();

      // Test /auth/verify
      await page.goto(`${server.origin}/verify?view=verify&token_hash=token123&type=email`, {
        waitUntil: 'domcontentloaded',
      });
      const scrollWidthVerify = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(
        scrollWidthVerify <= width,
        `Verify page scrollWidth (${scrollWidthVerify}) must not exceed viewport width (${width})`
      );

      // Test login with resend block
      await page.goto(`${server.origin}/login?view=login&error=confirmation_failed`, {
        waitUntil: 'domcontentloaded',
      });
      const scrollWidthLogin = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(
        scrollWidthLogin <= width,
        `Login with resend block scrollWidth (${scrollWidthLogin}) must not exceed viewport width (${width})`
      );

      await context.close();
    }
  });
});
