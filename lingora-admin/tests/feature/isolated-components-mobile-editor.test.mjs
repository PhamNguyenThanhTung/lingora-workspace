import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { startIsolatedServer } from './isolated-server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const TEST_PORT = 3019;
const TEST_URL = `http://127.0.0.1:${TEST_PORT}`;
const MOBILE_VIEWPORT = { width: 375, height: 812 };

/**
 * F12: the teacher lesson editor must fit a 375px viewport in both content
 * modes (legacy paragraphs and Lesson Studio V1), with wide tables scrolling
 * inside their own card instead of widening the document.
 */
describe('F12: Teacher lesson editor on a 375x812 viewport', () => {
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

  async function withMobilePage(run) {
    const context = await browser.newContext({ viewport: MOBILE_VIEWPORT });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    try {
      // `slice7` seeds the draft with an exercise and a vocabulary entry so the
      // wide data tables are actually rendered.
      await page.goto(`${TEST_URL}/?state=page-teacher-draft-wire&slice7`);
      await page.locator('#appContainer').waitFor();
      await run(page);
    } finally {
      await context.close();
    }
  }

  /** @returns {Promise<{ docWidth: number, viewportWidth: number }>} */
  const measure = (page) =>
    page.evaluate(() => ({
      docWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));

  /** Elements that are cut off by an `overflow: hidden` ancestor-less clip. */
  const clippedElements = (page) =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll('*'))
        .filter((el) => {
          const overflowX = getComputedStyle(el).overflowX;
          return overflowX === 'hidden' && el.scrollWidth > el.clientWidth + 1;
        })
        .map((el) => `${el.tagName}#${el.id || '(no id)'}`)
    );

  async function assertFits(page, label) {
    const { docWidth, viewportWidth } = await measure(page);
    assert.ok(
      docWidth <= viewportWidth,
      `${label}: document scrollWidth ${docWidth}px must not exceed viewport ${viewportWidth}px`
    );
    assert.deepEqual(await clippedElements(page), [], `${label}: content must not be clipped`);
  }

  test('legacy paragraph mode fits 375px, with and without the preview open', async () => {
    await withMobilePage(async (page) => {
      await page.locator('#btnAddParagraph').waitFor();
      await assertFits(page, 'legacy editor');

      // Wide tables stay readable by scrolling inside their own card.
      const exercisesWrap = page.locator('#exercisesTable').locator('xpath=ancestor::div[@class="table-wrap"][1]');
      const wrapBox = await exercisesWrap.boundingBox();
      assert.ok(
        wrapBox.width <= MOBILE_VIEWPORT.width,
        `exercise table wrapper ${wrapBox.width}px must fit the viewport`
      );
      assert.equal(
        await exercisesWrap.evaluate((el) => getComputedStyle(el).overflowX),
        'auto'
      );
      assert.ok(
        await exercisesWrap.evaluate((el) => el.scrollWidth > el.clientWidth),
        'exercise table must be horizontally scrollable rather than clipped'
      );

      await page.locator('#btnTogglePreview').click();
      await page.locator('#legacyPreviewPanel').waitFor({ state: 'visible' });
      await assertFits(page, 'legacy editor with preview open');

      await page.locator('#legacyPreviewPanel #btnPreviewDeviceMobile').click();
      await assertFits(page, 'legacy preview in phone device view');
    });
  });

  test('Lesson Studio V1 mode fits 375px on the canvas and the preview tab', async () => {
    await withMobilePage(async (page) => {
      await page.locator('#btnToggleStudioMode').click();
      await page.locator('#lessonStudioLayout').waitFor();
      await assertFits(page, 'studio canvas');

      await page.getByRole('tab', { name: 'Xem trước' }).click();
      await page.locator('#studioLivePreviewContainer').waitFor({ state: 'visible' });
      await assertFits(page, 'studio preview tab');
    });
  });
});
