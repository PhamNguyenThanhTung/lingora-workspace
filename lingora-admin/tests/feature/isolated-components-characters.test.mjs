import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { startIsolatedServer } from './isolated-server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const TEST_PORT = 3015;
const TEST_URL = `http://127.0.0.1:${TEST_PORT}`;
const SCREENSHOT_DIR = path.resolve(
  import.meta.dirname,
  '../../../docs/acceptance/ext02-screenshots'
);

const JA_LANG_ID = '44444444-4444-4444-8444-444444444444';
const ZH_LANG_ID = '77777777-7777-4777-8777-777777777777';

describe('EXT-02 Character Catalogue: Isolated Component & Browser Suite', () => {
  let server;
  let browser;

  before(async () => {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
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

  test('Populated catalogue renders Sidebar navCharacters active, stroke availability badges, no edit/delete controls, and fits desktop & mobile', async () => {
    for (const viewport of [
      { name: 'desktop', width: 1440, height: 900, file: 'characters-desktop.png' },
      { name: 'mobile', width: 390, height: 844, file: 'characters-mobile.png' },
    ]) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));

      await page.goto(`${TEST_URL}/characters?state=characters-populated`, {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForSelector('#charactersTable', { state: 'visible' });
      await page.evaluate(() => document.fonts.ready);

      // Sidebar link active on desktop (hidden inside drawer on mobile)
      if (viewport.name === 'desktop') {
        const navItem = page.locator('#navCharacters');
        assert.equal(await navItem.getAttribute('aria-current'), 'page');
        assert.ok((await navItem.getAttribute('class'))?.includes('active'));
      }

      // Verify rows & stroke availability text
      const tableText = await page.locator('#charactersTable').innerText();
      assert.ok(tableText.includes('あ'));
      assert.ok(tableText.includes('日'));
      assert.ok(tableText.includes('人'));
      assert.ok(tableText.includes('Có nét chữ'), 'Must show Có nét chữ for character with strokes');
      assert.ok(
        tableText.includes('Chưa có nét chữ, chỉ hiển thị tĩnh'),
        'Must show Chưa có nét chữ, chỉ hiển thị tĩnh for character without strokes'
      );

      // Q-C7: no edit or delete buttons in catalogue rows
      const rowActionButtons = await page.locator('#charactersTable tbody button').count();
      assert.equal(rowActionButtons, 0, 'Row edit/delete controls must not exist in Q-C7');

      // Responsive: zero horizontal document overflow
      const noOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      );
      assert.equal(noOverflow, true, `Page must not overflow horizontally at ${viewport.width}px`);

      // Touch targets >= 44px on primary controls
      const controlHeights = await page.evaluate(() => {
        const els = [
          document.querySelector('#openCreateCharacterBtn'),
          document.querySelector('#filterLanguageSelect'),
          document.querySelector('#filterScriptSelect'),
          document.querySelector('#searchCharacterInput'),
          document.querySelector('#btnSearchCharacters'),
          document.querySelector('#btnCharactersPrev'),
          document.querySelector('#btnCharactersNext'),
        ].filter(Boolean);
        return els.map((el) => ({
          id: el.id,
          height: el.getBoundingClientRect().height,
        }));
      });
      for (const c of controlHeights) {
        assert.ok(c.height >= 44, `Control #${c.id} height (${c.height}px) must be >= 44px`);
      }

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, viewport.file),
        fullPage: true,
      });

      assert.deepEqual(pageErrors, []);
      await context.close();
    }
  });

  test('Filters, search, pagination, and late-response guard keep newest filter results', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    let releaseSlowRequest;
    const slowRequestGate = new Promise((resolve) => {
      releaseSlowRequest = resolve;
    });
    let markSlowRequestSeen;
    const slowRequestStarted = new Promise((resolve) => {
      markSlowRequestSeen = resolve;
    });
    let slowRequestSeen = false;

    await page.route('**/api/characters**', async (route) => {
      const url = new URL(route.request().url());
      const lang = url.searchParams.get('languageId') || '';
      const script = url.searchParams.get('scriptType') || '';
      const search = url.searchParams.get('search') || '';
      const offset = Number(url.searchParams.get('offset') || '0');

      // Simulate slow first filter request (Japanese) arriving AFTER fast Chinese filter request
      if (lang === JA_LANG_ID && !script && !search && offset === 0) {
        slowRequestSeen = true;
        markSlowRequestSeen();
        await slowRequestGate;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: '99990001-0000-4000-8000-000000000099',
                languageId: JA_LANG_ID,
                languageCode: 'ja',
                languageNames: { vi: 'Tiếng Nhật' },
                glyph: '火',
                scriptType: 'KANJI',
                meaning: 'lửa (trả về muộn)',
                primaryReading: 'ひ',
                romanization: 'hi',
                strokeCount: 4,
                metadata: {},
                hasStrokes: false,
                strokeVersion: null,
              },
            ],
            total: 1,
            limit: 20,
            offset: 0,
          }),
        });
        return;
      }

      if (lang === ZH_LANG_ID) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: '99990001-0000-4000-8000-000000000003',
                languageId: ZH_LANG_ID,
                languageCode: 'zh-cn',
                languageNames: { vi: 'Tiếng Trung (Giản thể)' },
                glyph: '人',
                scriptType: 'HANZI_SIMPLIFIED',
                meaning: 'người (kết quả mới nhất)',
                primaryReading: 'rén',
                romanization: 'ren',
                strokeCount: 2,
                metadata: {},
                hasStrokes: false,
                strokeVersion: null,
              },
            ],
            total: 1,
            limit: 20,
            offset: 0,
          }),
        });
        return;
      }

      if (offset === 20) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: '99990001-0000-4000-8000-000000000021',
                languageId: JA_LANG_ID,
                languageCode: 'ja',
                languageNames: { vi: 'Tiếng Nhật' },
                glyph: '水',
                scriptType: 'KANJI',
                meaning: 'nước (trang 2)',
                primaryReading: 'みず',
                romanization: 'mizu',
                strokeCount: 4,
                metadata: {},
                hasStrokes: false,
                strokeVersion: null,
              },
            ],
            total: 21,
            limit: 20,
            offset: 20,
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: '99990001-0000-4000-8000-000000000002',
              languageId: JA_LANG_ID,
              languageCode: 'ja',
              languageNames: { vi: 'Tiếng Nhật' },
              glyph: '日',
              scriptType: 'KANJI',
              meaning: 'mặt trời, ngày',
              primaryReading: 'にち',
              romanization: 'nichi',
              strokeCount: 4,
              metadata: {},
              hasStrokes: true,
              strokeVersion: 1,
            },
          ],
          total: 25,
          limit: 20,
          offset: 0,
        }),
      });
    });

    await page.goto(`${TEST_URL}/characters?state=characters-populated`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('#charactersTable', { state: 'visible' });

    // 1. Pagination Next -> page 2, then Prev -> page 1
    assert.equal(await page.locator('#btnCharactersPrev').isDisabled(), true);
    assert.equal(await page.locator('#btnCharactersNext').isDisabled(), false);

    await page.click('#btnCharactersNext');
    await page.waitForFunction(() =>
      document.querySelector('#charactersTable')?.innerText.includes('nước (trang 2)')
    );
    assert.equal(await page.locator('#btnCharactersPrev').isDisabled(), false);
    assert.equal(await page.locator('#btnCharactersNext').isDisabled(), true);

    await page.click('#btnCharactersPrev');
    await page.waitForFunction(() =>
      document.querySelector('#charactersTable')?.innerText.includes('mặt trời, ngày')
    );

    // 2. Late response race condition test:
    // Select Japanese (slow), wait until request is in flight, then immediately switch to Chinese (fast)
    await page.selectOption('#filterLanguageSelect', JA_LANG_ID);
    await slowRequestStarted;
    assert.equal(slowRequestSeen, true);

    await page.selectOption('#filterLanguageSelect', ZH_LANG_ID);
    await page.waitForFunction(() =>
      document.querySelector('#charactersTable')?.innerText.includes('người (kết quả mới nhất)')
    );

    // Release slow Japanese response and ensure it does NOT overwrite Chinese results
    releaseSlowRequest();
    await page.evaluate(() => new Promise((r) => setTimeout(r, 50)));
    const finalText = await page.locator('#charactersTable').innerText();
    assert.ok(finalText.includes('người (kết quả mới nhất)'));
    assert.ok(!finalText.includes('lửa (trả về muộn)'));

    await context.close();
  });

  test('Add character flow validates input, supports confirmation step + back edit, handles 409 duplicate, and saves 201', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    let postAttempt = 0;
    const createdItem = {
      id: '99990001-0000-4000-8000-000000000077',
      languageId: JA_LANG_ID,
      languageCode: 'ja',
      languageNames: { vi: 'Tiếng Nhật' },
      glyph: '山',
      scriptType: 'KANJI',
      meaning: 'núi',
      primaryReading: 'やま',
      romanization: 'yama',
      strokeCount: 3,
      metadata: { jlptLevel: 'N5' },
      hasStrokes: false,
      strokeVersion: null,
    };

    await page.route('**/api/characters**', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        postAttempt += 1;
        const body = req.postDataJSON();
        if (postAttempt === 1) {
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({
              error: {
                code: 'CHARACTER_DUPLICATE',
                message: 'Ký tự này đã tồn tại trong danh mục của ngôn ngữ đã chọn.',
                fields: { glyph: 'Ký tự này đã tồn tại trong danh mục của ngôn ngữ đã chọn.' },
              },
            }),
          });
          return;
        }
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              ...createdItem,
              glyph: body.glyph,
              strokeCount: body.strokeCount,
              meaning: body.meaning,
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [createdItem],
          total: 1,
          limit: 20,
          offset: 0,
        }),
      });
    });

    await page.goto(`${TEST_URL}/characters?state=characters-populated`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('#openCreateCharacterBtn', { state: 'visible' });

    // Open modal
    await page.click('#openCreateCharacterBtn');
    await page.waitForSelector('#characterFormModal[data-initialized="true"]');
    assert.equal(
      await page.locator('#appContainer').evaluate((el) => el.inert),
      true,
      'Background must become inert when modal opens'
    );

    // Client validation rejects multi-grapheme glyph
    await page.fill('#charGlyphInput', '日本');
    await page.click('#btnProceedCharConfirm');
    await page.waitForSelector('#charGlyphError');

    // Fill valid character and go to confirmation step
    await page.fill('#charGlyphInput', '日');
    await page.fill('#charStrokeCountInput', '4');
    await page.fill('#charMeaningInput', 'mặt trời');
    await page.fill('#charPrimaryReadingInput', 'にち');
    await page.fill('#charRomanizationInput', 'nichi');
    await page.click('#btnProceedCharConfirm');

    await page.waitForSelector('#characterConfirmSummary');
    const summaryText = await page.locator('#characterConfirmSummary').innerText();
    assert.ok(summaryText.includes('日'));
    assert.ok(summaryText.includes('4 nét'));
    assert.ok(summaryText.includes('Chưa có nét chữ, chỉ hiển thị tĩnh'));

    // Back button preserves inputs
    await page.click('#btnBackCharForm');
    await page.waitForSelector('#charGlyphInput');
    assert.equal(await page.inputValue('#charGlyphInput'), '日');

    // Proceed and hit 409 duplicate -> returns to edit step preserving inputs with error message
    await page.click('#btnProceedCharConfirm');
    await page.waitForSelector('#btnConfirmCharSubmit');
    await page.click('#btnConfirmCharSubmit');

    await page.waitForSelector('#charFormGeneralError');
    assert.equal(await page.inputValue('#charGlyphInput'), '日');

    // Change glyph to 山 and confirm save -> 201
    await page.fill('#charGlyphInput', '山');
    await page.fill('#charStrokeCountInput', '3');
    await page.fill('#charMeaningInput', 'núi');
    await page.click('#btnProceedCharConfirm');
    await page.waitForSelector('#characterFormModal[data-step="confirm"]');
    await page.waitForSelector('#btnConfirmCharSubmit');
    await page.click('#btnConfirmCharSubmit');

    await page.waitForSelector('#characterMutationStatus');
    const statusText = await page.locator('#characterMutationStatus').innerText();
    assert.ok(statusText.includes('Đã thêm ký tự "山"'));
    assert.equal(await page.locator('#characterFormModal').count(), 0);
    assert.equal(await page.locator('#appContainer').evaluate((el) => el.inert), false);

    await context.close();
  });
});
