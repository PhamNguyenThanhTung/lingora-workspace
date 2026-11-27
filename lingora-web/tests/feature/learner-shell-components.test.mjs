import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { startIsolatedServer } from './harness/isolated-server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const PORT = 3027;
const URL_BASE = `http://127.0.0.1:${PORT}`;

describe('Learner shell, path map and navigation (workstream U2)', () => {
  let server;
  let browser;

  before(async () => {
    server = await startIsolatedServer(PORT);
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  });
  after(async () => {
    if (browser) await browser.close();
    if (server) await server.close();
  });

  async function open(state, viewport) {
    const context = await browser.newContext(viewport ? { viewport } : {});
    const page = await context.newPage();
    await page.goto(`${URL_BASE}/?state=${state}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#learnerShell');
    return { context, page };
  }

  test('nav: Luyện viết only appears for ja/zh paths and there is no review entry', async () => {
    const ja = await open('path-ja');
    const jaLabels = await ja.page.locator('#learnerSidebarNav a').allTextContents();
    assert.deepEqual(jaLabels.map((t) => t.replace(/[^\p{L}\s]/gu, '').trim()), ['Học', 'Luyện viết', 'Nhiệm vụ', 'Hồ sơ']);
    assert.equal(await ja.page.locator('#learnerSidebarNav [data-nav="write"]').getAttribute('href'), '/write');
    assert.equal(await ja.page.locator('[data-nav="review"], #reviewNavBtn, #reviewNowBtn').count(), 0);
    await ja.context.close();

    const en = await open('home-valid');
    assert.equal(await en.page.locator('[data-nav="write"]').count(), 0);
    await en.context.close();
  });

  test('top bar keeps the stat ids and the language chip lists the switchable path', async () => {
    const { context, page } = await open('path-ja');
    for (const id of ['streakBadge', 'totalXpBadge', 'totalGemsBadge']) {
      assert.equal(await page.locator(`#${id}`).count(), 1, `#${id} must exist`);
    }
    const chip = page.locator('#languageSwitcherBtn');
    assert.match(await chip.textContent(), /JA/);
    await chip.click();
    await page.locator('#languageSwitcherPanel').waitFor();
    assert.equal(await page.locator('#addOnboardingLanguageBtn').getAttribute('href'), '/onboarding');
    await page.keyboard.press('Escape');
    await page.locator('#languageSwitcherPanel').waitFor({ state: 'detached' });
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'languageSwitcherBtn');
    await context.close();
  });

  test('path map: nodes, lang="ja", popover focus trap, Esc restores focus, no skip button', async () => {
    const { context, page } = await open('path-ja');
    await page.locator('#learningPathSection').waitFor();
    assert.equal(await page.locator('#learningPathList li[id^="pathNode-"]').count(), 5);
    assert.ok((await page.locator('#learningPathSection [lang="ja"]').count()) > 0, 'Japanese titles carry lang="ja"');
    assert.equal(await page.locator('#continueLearningBanner').count(), 1);
    assert.equal(await page.getByText('Nhảy tới').count(), 0);

    const node = page.locator('#pathBtn-l2');
    await node.focus();
    await node.press('Enter');
    const dialog = page.locator('[role="dialog"]').filter({ has: page.locator('#pathLink-l2') });
    await dialog.waitFor();
    assert.match(await page.locator('#pathLink-l2').textContent(), /Bắt đầu|Tiếp tục/);
    // Focus stays inside the dialog while tabbing.
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      assert.equal(await dialog.evaluate((el) => el.contains(document.activeElement)), true);
    }
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'pathBtn-l2');

    // Locked node explains why and has no start link.
    await page.locator('#pathBtn-l4').click();
    assert.match(await page.locator('[role="dialog"]').textContent(), /Hoàn thành bài trước để mở khóa/);
    assert.equal(await page.locator('#pathLink-l4').count(), 0);
    await context.close();
  });

  test('path map: text list gives screen readers real links', async () => {
    const { context, page } = await open('path-ja');
    await page.locator('#pathListToggle').click();
    await page.locator('#pathTextList').waitFor();
    assert.equal(await page.locator('#pathTextList a[id^="pathLink-"]').count(), 3);
    assert.equal(await page.locator('#pathTextList [id^="pathDisabled-"]').count(), 2);
    await context.close();
  });

  for (const [name, width] of [['375px', 375], ['1440px', 1440]]) {
    test(`shell has no horizontal overflow at ${name} (/home, /profile)`, async () => {
      for (const state of ['path-ja', 'profile-valid']) {
        const { context, page } = await open(state, { width, height: 900 });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert.ok(overflow <= 0, `${state} overflows by ${overflow}px at ${name}`);
        await context.close();
      }
    });
  }

  test('layout: bottom tabs on mobile, three columns on desktop', async () => {
    const mobile = await open('path-ja', { width: 375, height: 800 });
    assert.equal(await mobile.page.locator('#learnerTabBar').isVisible(), true);
    assert.equal(await mobile.page.locator('#learnerSidebarNav').isVisible(), false);
    await mobile.context.close();

    const desktop = await open('path-ja', { width: 1440, height: 900 });
    assert.equal(await desktop.page.locator('#learnerSidebarNav').isVisible(), true);
    assert.equal(await desktop.page.locator('#learnerTabBar').isVisible(), false);
    assert.equal(await desktop.page.locator('#questColumn').isVisible(), true);
    await desktop.context.close();
  });

  test('profile: name form validates 1-40 characters', async () => {
    const { context, page } = await open('profile-valid');
    const input = page.locator('#displayNameInput');
    await input.fill('   ');
    assert.equal(await page.locator('#saveDisplayNameBtn').isDisabled(), true);
    await input.fill('Học viên');
    assert.equal(await page.locator('#saveDisplayNameBtn').isDisabled(), false);
    await context.close();
  });
});
