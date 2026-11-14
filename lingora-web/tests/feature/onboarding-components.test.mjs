import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startOnboardingServer } from './harness/onboarding-harness.mjs';

const TEST_PORT = 3031;
let server;
let browser;
let defaultCompleteResponse;

describe('Sprint 3: Onboarding Wizard Component & Flow Tests', () => {
  before(async () => {
    server = await startOnboardingServer(TEST_PORT);
    defaultCompleteResponse = JSON.parse(JSON.stringify(server.fixture.completeResponse));
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  });

  after(async () => {
    if (browser) await browser.close();
    if (server) await server.close();
  });

  beforeEach(() => {
    server.fixture.completeStatus = 200;
    server.fixture.completeCallCount = 0;
    server.fixture.lastCompletePayload = null;
    server.fixture.completeResponse = JSON.parse(JSON.stringify(defaultCompleteResponse));
  });

  test('Full wizard flow (DEFAULT): 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 with complete submission', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${server.origin}/onboarding`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#onboardingWizardView', { state: 'visible' });

    // Step 1: Language
    await page.waitForSelector('#langOption-en', { state: 'visible' });
    await page.click('#langOption-en');
    await page.click('#btnStep1Next');

    // Step 2: Purpose
    await page.waitForSelector('input[name="onboardingPurpose"][value="WORK"]', { state: 'visible' });
    await page.click('input[name="onboardingPurpose"][value="WORK"]');
    await page.click('#btnStep2Next');

    // Step 3: Daily Goal
    await page.waitForSelector('#goalOption-15', { state: 'visible' });
    await page.click('#goalOption-15');
    await page.click('#btnStep3Next');

    // Step 4: Interests
    await page.waitForSelector('label:has-text("Công nghệ & Đổi mới")', { state: 'visible' });
    await page.click('label:has-text("Công nghệ & Đổi mới")');
    await page.click('label:has-text("Đời sống & Thường nhật")');
    await page.click('#btnStep4Next');

    // Step 5: Start Point
    await page.waitForSelector('#optStartDefault', { state: 'visible' });
    await page.click('#optStartDefault');
    await page.click('#btnStep5Preview');

    // Step 6: Preview
    await page.waitForSelector('#previewCard', { state: 'visible' });
    const previewText = await page.textContent('#previewCard');
    assert.match(previewText, /Tiếng Anh Giao Tiếp/i);
    assert.match(previewText, /A1 - Mới bắt đầu/i);
    assert.match(previewText, /Bài 1: Giới thiệu bản thân/i);

    // Complete Onboarding
    await page.click('#btnCompleteOnboarding');

    // Step 7: Success Result
    await page.waitForSelector('#stepResult', { state: 'visible' });
    const successText = await page.textContent('#stepResult');
    assert.match(successText, /Chào mừng bạn đến với lộ trình học/i);
    assert.equal(await page.isVisible('#btnStartFirstLesson'), true);

    // Assert payload sent to server
    assert.equal(server.fixture.completeCallCount, 1);
    assert.equal(server.fixture.lastCompletePayload.languageId, 'lang-en');
    assert.equal(server.fixture.lastCompletePayload.purpose, 'WORK');
    assert.equal(server.fixture.lastCompletePayload.dailyGoalMinutes, 15);
    assert.deepEqual(server.fixture.lastCompletePayload.interests, ['TECHNOLOGY', 'DAILY_LIFE']);
    assert.equal(server.fixture.lastCompletePayload.entryChoice.startSource, 'DEFAULT');

    await context.close();
  });

  test('SELF_REPORT selection: enables level picker, sends selected startLevelId', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${server.origin}/onboarding`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#onboardingWizardView', { state: 'visible' });

    // Step 1: Language
    await page.waitForSelector('#langOption-en', { state: 'visible' });
    await page.click('#langOption-en');
    await page.click('#btnStep1Next');

    // Step 2: Skip purpose -> click Next directly
    await page.click('#btnStep2Next');

    // Step 3: Default is 10 min -> click Next
    await page.click('#btnStep3Next');

    // Step 4: Skip interests -> click Next
    await page.click('#btnStep4Next');

    // Step 5: Start Point -> SELF_REPORT
    await page.waitForSelector('#optStartSelfReport', { state: 'visible' });
    await page.click('#optStartSelfReport');
    await page.waitForSelector('#levelSelect', { state: 'visible' });
    await page.selectOption('#levelSelect', 'lvl-a2');
    await page.click('#btnStep5Preview');

    // Step 6: Complete
    await page.waitForSelector('#previewCard', { state: 'visible' });
    await page.click('#btnCompleteOnboarding');

    // Step 7: Verify payload
    await page.waitForSelector('#stepResult', { state: 'visible' });
    assert.equal(server.fixture.lastCompletePayload.entryChoice.startSource, 'SELF_REPORT');
    assert.equal(server.fixture.lastCompletePayload.entryChoice.levelId, 'lvl-a2');

    await context.close();
  });

  test('Changing language resets course and level selection', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${server.origin}/onboarding`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#onboardingWizardView', { state: 'visible' });

    // Step 1: Pick English
    await page.waitForSelector('#langOption-en', { state: 'visible' });
    await page.click('#langOption-en');
    await page.click('#btnStep1Next');

    // Step 2: Pick Purpose
    await page.click('input[name="onboardingPurpose"][value="TRAVEL"]');
    await page.click('#btnStep2Next');

    // Step 3: Goal
    await page.click('#btnStep3Next');

    // Step 4: Interests
    await page.click('#btnStep4Next');

    // Step 5: Pick SELF_REPORT and lvl-a2
    await page.click('#optStartSelfReport');
    await page.waitForSelector('#levelSelect', { state: 'visible' });
    await page.selectOption('#levelSelect', 'lvl-a2');

    // Navigate back to Step 1
    await page.locator('button:has-text("Quay lại")').click(); // to Step 4
    await page.locator('button:has-text("Quay lại")').click(); // to Step 3
    await page.locator('button:has-text("Quay lại")').click(); // to Step 2
    await page.locator('button:has-text("Quay lại")').click(); // to Step 1

    // Switch language to Japanese
    await page.click('#langOption-ja');
    await page.click('#btnStep1Next');
    await page.click('#btnStep2Next');
    await page.click('#btnStep3Next');
    await page.click('#btnStep4Next');

    // On Step 5: Check that Japanese levels are now rendered
    await page.waitForSelector('#optStartSelfReport', { state: 'visible' });
    await page.click('#optStartSelfReport');
    const options = await page.$$eval('#levelSelect option', (opts) =>
      opts.map((o) => o.value)
    );
    assert.ok(options.includes('lvl-n5'));
    assert.ok(!options.includes('lvl-a1'));
    assert.ok(!options.includes('lvl-a2'));

    await context.close();
  });

  test('sessionStorage draft persistence & recovery across reload', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${server.origin}/onboarding`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#onboardingWizardView', { state: 'visible' });

    // Step 1
    await page.click('#langOption-en');
    await page.click('#btnStep1Next');

    // Step 2: Select CULTURE
    await page.click('input[name="onboardingPurpose"][value="CULTURE"]');
    await page.click('#btnStep2Next');

    // Step 3: Select 20 min
    await page.click('#goalOption-20');
    await page.click('#btnStep3Next');

    // Now at Step 4. Reload the page!
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#onboardingWizardView', { state: 'visible' });

    // Verify restored at Step 4
    await page.waitForSelector('#btnStep4Next', { state: 'visible' });

    // Go back to Step 3 to verify goal 20 is still active
    await page.locator('button:has-text("Quay lại")').click();
    const goalOptionStyle = await page.getAttribute('#goalOption-20', 'style');
    assert.match(goalOptionStyle, /2563eb/);

    // Go back to Step 2 to verify CULTURE is still active
    await page.locator('button:has-text("Quay lại")').click();
    const isCultureChecked = await page.isChecked('input[name="onboardingPurpose"][value="CULTURE"]');
    assert.equal(isCultureChecked, true);

    await context.close();
  });

  test('Handling 409 RECOMMENDATION_CHANGED during completion updates preview gracefully', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${server.origin}/onboarding`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#onboardingWizardView', { state: 'visible' });

    await page.click('#langOption-en');
    await page.click('#btnStep1Next');
    await page.click('#btnStep2Next');
    await page.click('#btnStep3Next');
    await page.click('#btnStep4Next');
    await page.click('#btnStep5Preview');

    // At Step 6 preview
    await page.waitForSelector('#previewCard', { state: 'visible' });

    // Setup 409 response
    server.fixture.completeStatus = 409;
    server.fixture.completeResponse = {
      error: {
        code: 'RECOMMENDATION_CHANGED',
        message: 'Lộ trình vừa được hệ thống cập nhật phù hợp hơn.',
      },
    };

    await page.click('#btnCompleteOnboarding');

    // Expect alert box to appear
    await page.waitForSelector('#onboardingAlert', { state: 'visible' });
    const alertMsg = await page.textContent('#onboardingAlert');
    assert.match(alertMsg, /Lộ trình đề xuất đã thay đổi/i);

    await context.close();
  });

  test('Reload at Step 6 automatically refetches preview and allows completion', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${server.origin}/onboarding`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#onboardingWizardView', { state: 'visible' });

    await page.click('#langOption-en');
    await page.click('#btnStep1Next');
    await page.click('input[name="onboardingPurpose"][value="WORK"]');
    await page.click('#btnStep2Next');
    await page.click('#goalOption-15');
    await page.click('#btnStep3Next');
    await page.click('#btnStep4Next');
    await page.click('#btnStep5Preview');

    // At Step 6 preview
    await page.waitForSelector('#previewCard', { state: 'visible' });

    // Reload browser while on Step 6
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#onboardingWizardView', { state: 'visible' });

    // Preview should auto-fetch and render previewCard again
    await page.waitForSelector('#previewCard', { state: 'visible', timeout: 5000 });
    const previewText = await page.textContent('#previewCard');
    assert.match(previewText, /Tiếng Anh Giao Tiếp/i);

    // Click complete successfully
    await page.click('#btnCompleteOnboarding');
    await page.waitForSelector('#stepResult', { state: 'visible' });
    assert.equal(server.fixture.completeCallCount, 1);

    await context.close();
  });

  test('Mobile viewport (390px) responsive layout without horizontal clipping', async () => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();

    await page.goto(`${server.origin}/onboarding`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#onboardingWizardView', { state: 'visible' });

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    assert.ok(scrollWidth <= clientWidth + 2, `Expected no horizontal scroll: scrollWidth ${scrollWidth}, clientWidth ${clientWidth}`);

    await context.close();
  });
});
