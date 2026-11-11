import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { startIsolatedServer } from './isolated-server.mjs';

const url = 'http://127.0.0.1:3042';
const screenshots = path.resolve(import.meta.dirname, '../../../plans/evidence/admin-layout-refresh-20261106/screenshots');
let server, browser;
before(async () => {
  await fs.mkdir(screenshots, { recursive: true });
  server = await startIsolatedServer(3042);
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
});
after(async () => { await browser?.close(); await server?.close(); });

async function open(route, state, width = 1440) {
  const page = await browser.newPage({ viewport: { width, height: width < 768 ? 844 : 960 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${url}${route}?state=${state}`);
  await page.waitForSelector('.app-topbar');
  await page.evaluate(() => document.fonts.ready);
  return { page, errors };
}
async function fits(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Document must not overflow horizontally');
}

test('desktop navigation collapses with accessible links; dashboard uses supplied totals and queue links', async () => {
  const { page, errors } = await open('/dashboard', 'dashboard');
  try {
    assert.equal(await page.locator('#navDashboard').getAttribute('aria-current'), 'page');
    assert.deepEqual(await page.locator('.metric-value').allTextContents(), ['7', '3', '4', '2']);
    assert.equal(await page.locator('.dashboard-review-list li').count(), 2);
    assert.equal(await page.locator('.dashboard-review-list li a').first().getAttribute('href'), '/review/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    await fits(page);
    await page.screenshot({ path: path.join(screenshots, 'dashboard-1440.png'), fullPage: true });
    await page.getByRole('button', { name: 'Thu gọn thanh bên' }).click();
    assert.equal(await page.locator('.sidebar-region').evaluate(el => el.getBoundingClientRect().width), 80);
    assert.equal(await page.locator('#navCourses').getAttribute('title'), 'Khóa học');
    await page.getByRole('button', { name: 'Mở rộng thanh bên' }).click();
    assert.equal(await page.locator('.sidebar-region').evaluate(el => el.getBoundingClientRect().width), 256);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('mobile menu hides closed links, traps focus, closes on Escape/backdrop and survives resizing', async () => {
  const { page, errors } = await open('/dashboard', 'dashboard', 390);
  try {
    await fits(page);
    assert.equal(await page.locator('#navCourses').isVisible(), false);
    await page.screenshot({ path: path.join(screenshots, 'dashboard-390.png'), fullPage: true });
    const opener = page.getByRole('button', { name: 'Mở menu', exact: true });
    await opener.click();
    assert.equal(await page.locator('#appSidebar').getAttribute('role'), 'dialog');
    assert.equal(await page.locator('.app-main').evaluate(el => el.inert), true);
    await page.locator('#navAuditEvents').focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('.brand-link').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.locator('#navAuditEvents').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Escape');
    assert.equal(await opener.evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator('#navCourses').isVisible(), false);
    await opener.click();
    await page.locator('.sidebar-backdrop').click({ position: { x: 385, y: 300 } });
    assert.equal(await opener.getAttribute('aria-expanded'), 'false');
    await opener.click();
    await page.setViewportSize({ width: 1024, height: 960 });
    await page.waitForFunction(() => !document.querySelector('.app-main').inert);
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    await fits(page);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('catalog, search and form stay usable at desktop and phone sizes', async () => {
  for (const width of [1440, 390]) {
    const { page, errors } = await open('/languages', 'populated-table', width);
    try {
      await page.waitForSelector('#populatedTable');
      await fits(page);
      assert.equal(await page.locator('#navLanguages').getAttribute('aria-current'), 'page');
      if (width === 390) assert.equal(await page.locator('.table-wrap').evaluate(el => el.scrollWidth > el.clientWidth), true);
      await page.screenshot({ path: path.join(screenshots, `languages-${width}.png`), fullPage: true });
      await page.locator('.search-input').fill('Tiếng Nhật');
      assert.equal(await page.locator('#populatedTable tbody tr').count(), 1);
      await page.locator('.search-input').fill('');
      await page.getByRole('button', { name: '+ Thêm ngôn ngữ', exact: true }).click();
      await page.waitForSelector('#languageFormModal');
      await page.locator('.modal-dialog').evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished)));
      await fits(page);
      assert.equal(await page.locator('#appContainer').evaluate(el => el.inert), true);
      const bounds = await page.locator('.modal-dialog').boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
      await page.screenshot({ path: path.join(screenshots, `language-form-${width}.png`), fullPage: true });
      await page.locator('#btnCancelForm').click();
      assert.equal(await page.locator('#appContainer').evaluate(el => el.inert), false);
      await page.locator('#btn-edit-en').click();
      await page.waitForSelector('#languageFormModal');
      await page.waitForFunction(() => document.querySelector('#langCodeInput')?.value === 'en');
      assert.equal(await page.locator('#langCodeInput').inputValue(), 'en');
      await page.locator('#btnCancelForm').click();
      assert.deepEqual(errors, []);
    } finally { await page.close(); }
  }
});

test('detail breadcrumbs link to ancestors without exposing IDs, including teacher-only navigation', async () => {
  const { page } = await open('/courses/11111111-1111-4111-8111-111111111111/units/22222222-2222-4222-8222-222222222222', 'courses-populated', 768);
  try {
    assert.equal(await page.locator('#navCourses').getAttribute('aria-current'), 'page');
    assert.ok((await page.locator('.shell-breadcrumbs').textContent()).includes('Bài học trong đơn vị'));
    assert.ok(!(await page.locator('.shell-breadcrumbs').textContent()).includes('11111111'));
    await fits(page);
    await page.screenshot({ path: path.join(screenshots, 'course-breadcrumb-768.png'), fullPage: true });
  } finally { await page.close(); }
  const teacher = await open('/my-lessons', 'teacher-lessons-populated', 390);
  try {
    await fits(teacher.page);
    await teacher.page.getByRole('button', { name: 'Mở menu', exact: true }).click();
    assert.equal(await teacher.page.locator('#navTeacherLessons').getAttribute('aria-current'), 'page');
    assert.equal(await teacher.page.locator('#navDashboard').count(), 0);
    assert.equal(await teacher.page.locator('#navTeachers').count(), 0);
    await teacher.page.keyboard.press('Escape');
    assert.deepEqual(teacher.errors, []);
    await teacher.page.screenshot({ path: path.join(screenshots, 'teacher-390.png'), fullPage: true });
  } finally { await teacher.page.close(); }
});

test('dashboard empty and unavailable states differ and retain working shortcuts', async () => {
  const { page } = await open('/dashboard', 'dashboard-empty', 390);
  try {
    assert.equal(await page.locator('.metric-value').last().textContent(), '0');
    assert.equal(await page.getByText('Không có bài học chờ duyệt', { exact: true }).isVisible(), true);
    await page.goto(`${url}/dashboard?state=dashboard-error`);
    await page.waitForSelector('.metric-value');
    assert.equal(await page.locator('.metric-value').last().textContent(), '—');
    assert.equal(await page.getByText('Chưa tải được hàng đợi', { exact: true }).isVisible(), true);
    assert.equal(await page.locator('.dashboard-shortcuts a').count(), 4);
    await fits(page);
  } finally { await page.close(); }
});
