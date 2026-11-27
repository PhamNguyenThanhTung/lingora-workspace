import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startOnboardingServer } from './harness/onboarding-harness.mjs';

const TEST_PORT = 3031;
let server;
let browser;
let defaultCompleteResponse;
let defaultOptions;

describe('Sprint 3: Onboarding Wizard Component & Flow Tests', () => {
  before(async () => {
    server = await startOnboardingServer(TEST_PORT);
    defaultCompleteResponse = JSON.parse(JSON.stringify(server.fixture.completeResponse));
    defaultOptions = JSON.parse(JSON.stringify(server.fixture.options));
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
    if (defaultOptions) {
      server.fixture.options = JSON.parse(JSON.stringify(defaultOptions));
    }
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
    const goal = page.getByRole('radio', { name: '10 phút / ngày' });
    await goal.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.getByRole('radio', { name: '15 phút / ngày' }).isChecked(), true);
    await page.click('#btnStep3Next');

    // Step 4: Interests
    await page.waitForSelector('label:has-text("Công nghệ & Đổi mới")', { state: 'visible' });
    await page.click('label:has-text("Công nghệ & Đổi mới")');
    await page.click('label:has-text("Đời sống & Thường nhật")');
    await page.click('#btnStep4Next');

    // Step 5: Start Point
    await page.waitForSelector('#optStartDefault', { state: 'visible' });
    assert.equal(await page.locator('#defaultCourseSelect').count(), 0, 'Hide course choice when there is only one eligible course');
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

  test('Step 1: Keyboard and native control selection of language', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${server.origin}/onboarding`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#stepLanguage', { state: 'visible' });

    // Radio controls should exist and initially be unchecked
    await page.waitForSelector('#langRadio-en', { state: 'visible' });
    assert.equal(await page.isChecked('#langRadio-en'), false);
    assert.equal(await page.isEnabled('#btnStep1Next'), false);

    // Focus native radio control and select via Space key
    await page.focus('#langRadio-en');
    await page.keyboard.press('Space');
    assert.equal(await page.isChecked('#langRadio-en'), true);
    assert.equal(await page.isEnabled('#btnStep1Next'), true);

    // Keyboard navigate/focus another language radio and select via Space key
    await page.focus('#langRadio-ja');
    await page.keyboard.press('Space');
    assert.equal(await page.isChecked('#langRadio-ja'), true);
    assert.equal(await page.isChecked('#langRadio-en'), false);

    // Keyboard selection with Enter on label
    await page.focus('#langOption-en');
    await page.keyboard.press('Enter');
    assert.equal(await page.isChecked('#langRadio-en'), true);

    // Proceed to Step 2
    await page.click('#btnStep1Next');
    await page.waitForSelector('#stepPurpose', { state: 'visible' });

    await context.close();
  });

  test('Step 1: Unavailable and already-owned language states communicated by name and disabled', async () => {
    // Configure options with English (available), Japanese (will be owned), French (no courses)
    server.fixture.options = {
      languages: [
        {
          id: 'lang-en',
          code: 'en',
          names: { vi: 'Tiếng Anh', en: 'English' },
          courses: [
            {
              id: 'course-en',
              names: { vi: 'Tiếng Anh Giao Tiếp', en: 'Conversational English' },
              levels: [{ id: 'lvl-a1', code: 'A1', label: { vi: 'A1 - Mới bắt đầu', en: 'Beginner' }, position: 1 }],
            },
          ],
        },
        {
          id: 'lang-ja',
          code: 'ja',
          names: { vi: 'Tiếng Nhật', en: 'Japanese' },
          courses: [
            {
              id: 'course-ja',
              names: { vi: 'Tiếng Nhật Cơ Bản', en: 'Basic Japanese' },
              levels: [{ id: 'lvl-n5', code: 'N5', label: { vi: 'N5 - Nhập môn', en: 'Introductory' }, position: 1 }],
            },
          ],
        },
        {
          id: 'lang-fr',
          code: 'fr',
          names: { vi: 'Tiếng Pháp', en: 'French' },
          courses: [], // No eligible courses/levels -> unavailable
        },
      ],
    };

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${server.origin}/onboarding?owned-ja`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#stepLanguage', { state: 'visible' });

    // 1. Unavailable language (French)
    await page.waitForSelector('#langRadio-fr', { state: 'visible' });
    assert.equal(await page.isDisabled('#langRadio-fr'), true);
    const frBadgeText = await page.textContent('#langStatusUnavailable-fr');
    assert.match(frBadgeText, /Tiếng Pháp: Sắp có nội dung/i);
    const frAriaDesc = await page.getAttribute('#langRadio-fr', 'aria-describedby');
    assert.equal(frAriaDesc, 'langStatusUnavailable-fr');

    // Clicking unavailable language does not select it
    await page.click('#langOption-fr', { force: true });
    assert.equal(await page.isChecked('#langRadio-fr'), false);

    // 2. Already-owned language (Japanese)
    await page.waitForSelector('#langRadio-ja', { state: 'visible' });
    assert.equal(await page.isDisabled('#langRadio-ja'), true);
    const jaBadgeText = await page.textContent('#langStatusOwned-ja');
    assert.match(jaBadgeText, /Tiếng Nhật: Đã có lộ trình/i);
    const jaAriaDesc = await page.getAttribute('#langRadio-ja', 'aria-describedby');
    assert.equal(jaAriaDesc, 'langStatusOwned-ja');

    // Clicking already-owned language does not select it
    await page.click('#langOption-ja', { force: true });
    assert.equal(await page.isChecked('#langRadio-ja'), false);

    // 3. Available language (English)
    assert.equal(await page.isDisabled('#langRadio-en'), false);
    await page.click('#langOption-en');
    assert.equal(await page.isChecked('#langRadio-en'), true);
    assert.equal(await page.isEnabled('#btnStep1Next'), true);

    await context.close();
  });

  test('Step 1: Options failure displays accessible error with explicit retry action', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    let failRequest = true;
    await page.route('**/api/learner/context/options', async (route) => {
      if (failRequest) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Lỗi tải danh mục khóa học' } }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${server.origin}/onboarding`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#onboardingWizardView', { state: 'visible' });

    // Alert with role="alert" and error message
    await page.waitForSelector('#optionsAlert', { state: 'visible' });
    assert.equal(await page.getAttribute('#optionsAlert', 'role'), 'alert');
    const alertText = await page.textContent('#optionsAlert');
    assert.match(alertText, /Lỗi tải danh mục/i);

    // Explicit retry button is exposed and operable
    await page.waitForSelector('#btnRetryOptions', { state: 'visible' });
    assert.equal(await page.isEnabled('#btnRetryOptions'), true);

    // Next button is disabled since no language can be selected
    assert.equal(await page.isEnabled('#btnStep1Next'), false);

    // Allow retry request to succeed
    failRequest = false;
    await page.click('#btnRetryOptions');

    // Languages should load and alert should disappear
    await page.waitForSelector('#langOption-en', { state: 'visible' });
    assert.equal(await page.isVisible('#optionsAlert'), false);

    // Can now select language and proceed
    await page.click('#langOption-en');
    assert.equal(await page.isChecked('#langRadio-en'), true);
    await page.click('#btnStep1Next');
    await page.waitForSelector('#stepPurpose', { state: 'visible' });

    await context.close();
  });

  test('Step 5: Simplified start labels (“Mới bắt đầu” and “Tôi biết trình độ của mình”) preserve DEFAULT/SELF_REPORT', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${server.origin}/onboarding`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#onboardingWizardView', { state: 'visible' });

    // Step 1: Language
    await page.click('#langOption-en');
    await page.click('#btnStep1Next');

    // Step 2 -> 3 -> 4 -> 5
    await page.click('#btnStep2Next');
    await page.click('#btnStep3Next');
    await page.click('#btnStep4Next');

    // Step 5: Verify simplified labels
    await page.waitForSelector('#optStartDefault', { state: 'visible' });
    const defaultLabelText = await page.textContent('#optStartDefault');
    assert.match(defaultLabelText, /Mới bắt đầu/i);

    await page.waitForSelector('#optStartSelfReport', { state: 'visible' });
    const selfReportLabelText = await page.textContent('#optStartSelfReport');
    assert.match(selfReportLabelText, /Tôi biết trình độ của mình/i);

    // Switch to SELF_REPORT, verify level select is exposed
    await page.click('#optStartSelfReport');
    await page.waitForSelector('#levelSelect', { state: 'visible' });

    // Switch back to DEFAULT and preview
    await page.click('#optStartDefault');
    await page.click('#btnStep5Preview');

    // Step 6: Preview card reflects simplified label
    await page.waitForSelector('#previewCard', { state: 'visible' });
    const previewText = await page.textContent('#previewCard');
    assert.match(previewText, /Mới bắt đầu/i);

    // Complete onboarding and verify entryChoice payload
    await page.click('#btnCompleteOnboarding');
    await page.waitForSelector('#stepResult', { state: 'visible' });
    assert.equal(server.fixture.lastCompletePayload.entryChoice.startSource, 'DEFAULT');

    await context.close();
  });

  test('DEFAULT course choice is optional, survives reload, and matches preview and completion', async () => {
    const english = server.fixture.options.languages.find((language) => language.id === 'lang-en');
    english.courses.push({
      id: 'course-en-b',
      names: { vi: 'Tiếng Anh Luyện thi', en: 'English Exam Course' },
      levels: [{ id: 'lvl-b1', code: 'B1', label: { vi: 'B1', en: 'Intermediate' }, position: 1 }],
    });

    const context = await browser.newContext();
    const page = await context.newPage();
    const previewPayloads = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/learner/onboarding/preview') {
        previewPayloads.push(request.postDataJSON());
      }
    });

    await page.goto(`${server.origin}/onboarding`, { waitUntil: 'domcontentloaded' });
    await page.click('#langOption-en');
    await page.click('#btnStep1Next');
    await page.click('#btnStep2Next');
    await page.click('#btnStep3Next');
    await page.click('#btnStep4Next');
    await page.waitForSelector('#defaultCourseSelect', { state: 'visible' });
    assert.equal(await page.inputValue('#defaultCourseSelect'), '');
    await page.selectOption('#defaultCourseSelect', 'course-en-b');
    await page.click('#btnStep5Preview');
    await page.waitForSelector('#previewCard', { state: 'visible' });
    assert.equal(previewPayloads.at(-1).entryChoice.courseId, 'course-en-b');
    assert.match(await page.textContent('#previewCard'), /Tiếng Anh Luyện thi/);

    await page.reload();
    await page.waitForSelector('#previewCard', { state: 'visible' });
    assert.equal(previewPayloads.at(-1).entryChoice.courseId, 'course-en-b');

    await page.click('#btnCompleteOnboarding');
    await page.waitForSelector('#stepResult', { state: 'visible' });
    assert.equal(server.fixture.lastCompletePayload.entryChoice.courseId, 'course-en-b');
    assert.equal(server.fixture.lastCompletePayload.expectedCourseId, 'course-en-b');
    await context.close();
  });

  test('A legacy DEFAULT draft does not treat its old SELF_REPORT courseId as an explicit choice', async () => {
    const english = server.fixture.options.languages.find((language) => language.id === 'lang-en');
    english.courses.push({
      id: 'course-en-b',
      names: { vi: 'Tiếng Anh Luyện thi', en: 'English Exam Course' },
      levels: [{ id: 'lvl-b1', code: 'B1', label: { vi: 'B1', en: 'Intermediate' }, position: 1 }],
    });

    const context = await browser.newContext();
    const page = await context.newPage();
    const previewPayloads = [];
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/learner/onboarding/preview') {
        previewPayloads.push(request.postDataJSON());
      }
    });
    await page.addInitScript((draft) => {
      sessionStorage.setItem('lingora_onboarding_draft_33333333-3333-4333-8333-333333333333', JSON.stringify(draft));
    }, {
      contextId: 'legacy-context-id',
      languageId: 'lang-en',
      purpose: 'WORK',
      dailyGoalMinutes: 10,
      interests: [],
      startSource: 'DEFAULT',
      courseId: 'course-en-b',
      levelId: 'lvl-b1',
      step: 5,
    });

    await page.goto(`${server.origin}/onboarding`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#defaultCourseSelect', { state: 'visible' });
    assert.equal(await page.inputValue('#defaultCourseSelect'), '');
    await page.click('#btnStep5Preview');
    await page.waitForSelector('#previewCard', { state: 'visible' });
    assert.equal(previewPayloads.at(-1).entryChoice.courseId, undefined);
    await context.close();
  });
});
