import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const webDir = path.resolve(repoRoot, 'lingora-web');
const nextBin = path.resolve(repoRoot, 'node_modules/next/dist/bin/next');
const evidenceDir = path.resolve(
  repoRoot,
  process.env.LANDING_EVIDENCE_DIR ?? 'plans/evidence/public-landing-20261109/review-2'
);

let webPort;
let webProcess;
let baseUrl;
let browser;

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200) return true;
    } catch {
      // server not ready yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server at ${url} failed to respond with 200 within ${timeoutMs}ms`);
}

before(async () => {
  await fs.mkdir(evidenceDir, { recursive: true });
  webPort = await getFreePort();
  baseUrl = `http://127.0.0.1:${webPort}`;

  webProcess = spawn(
    process.execPath,
    [nextBin, 'start', '-p', String(webPort), '--hostname', '127.0.0.1'],
    {
      cwd: webDir,
      env: {
        ...process.env,
        PORT: String(webPort),
        NODE_ENV: 'production',
      },
      stdio: 'pipe',
    }
  );

  webProcess.stderr?.on('data', (d) => {
    const msg = d.toString();
    if (!msg.includes('ExperimentalWarning')) {
      // ignore normal Next notices
    }
  });

  await waitForServer(baseUrl);
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
});

after(async () => {
  if (browser) await browser.close();
  if (webProcess) {
    webProcess.kill('SIGTERM');
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
});

test('production GET / returns HTTP 200 with complete landing page structure and metadata', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  try {
    const externalRequests = [];
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== baseUrl) externalRequests.push(request.url());
    });
    const res = await page.goto(`${baseUrl}/`);
    assert.equal(res?.status(), 200);

    // Metadata checks
    const title = await page.title();
    assert.match(title, /Lingora/);
    assert.match(title, /Học từng bước/);

    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    assert.ok(desc && desc.length > 20);

    // Heading and main sections
    const h1 = await page.locator('h1').textContent();
    assert.match(h1, /Học từng bài nhỏ/);

    // Hero CTA checks
    const heroRegister = page.locator('#heroRegisterBtn');
    assert.equal(await heroRegister.getAttribute('href'), '/register');

    const heroExplore = page.locator('#heroExploreBtn');
    assert.equal(await heroExplore.getAttribute('href'), '#cach-hoc');

    // Experience Preview presence
    assert.ok(await page.getByText('Bài học mẫu').isVisible());
    assert.ok(await page.getByText('Minh họa trải nghiệm').isVisible());
    assert.ok(await page.getByText('Good morning', { exact: true }).isVisible());
    assert.ok(await page.getByText('Lời giải thích:').isVisible());

    // 3 steps
    assert.ok(await page.getByLabel('Bước 1').isVisible());
    assert.ok(await page.getByText('Chọn điểm bắt đầu').isVisible());
    assert.ok(await page.getByLabel('Bước 2').isVisible());
    assert.ok(await page.getByText('Học và luyện tập').isVisible());
    assert.ok(await page.getByLabel('Bước 3').isVisible());
    assert.ok(await page.getByText('Ôn từ để ghi nhớ').isVisible());

    // 3 benefits
    assert.ok(await page.getByText('Biết mình nên học gì tiếp theo').isVisible());
    assert.ok(await page.getByText('Hiểu câu trả lời, không chỉ xem điểm').isVisible());
    assert.ok(await page.getByText('Ôn lại từ đã học đúng lúc').isVisible());

    // FAQ items
    const faqDetails = page.locator('details');
    assert.equal(await faqDetails.count(), 4);

    // Zero staff link leak
    const allLinks = await page.locator('a').evaluateAll((els) => els.map((a) => a.getAttribute('href') || ''));
    for (const link of allLinks) {
      assert.ok(!link.includes('/admin'), `Forbidden admin link found: ${link}`);
      assert.ok(!link.includes('/staff'), `Forbidden staff link found: ${link}`);
      assert.ok(!link.includes('/dashboard'), `Forbidden dashboard link found: ${link}`);
      assert.ok(!link.includes('/my-lessons'), `Forbidden my-lessons link found: ${link}`);
    }
    await page.waitForTimeout(100);
    assert.deepEqual(externalRequests, [], 'Opening the landing page should not call external services');
  } finally {
    await page.close();
  }
});

test('FAQ accordion disclosure interaction and keyboard accessibility', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  try {
    await page.goto(`${baseUrl}/`);
    const firstFaq = page.locator('details').first();
    const firstSummary = firstFaq.locator('summary');

    // Initially not open
    assert.equal(await firstFaq.getAttribute('open'), null);

    // Click summary opens details
    await firstSummary.click();
    assert.equal(await firstFaq.evaluate((el) => el.hasAttribute('open')), true);
    assert.ok(await firstFaq.getByText('Bạn chỉ cần tạo một tài khoản học viên miễn phí').isVisible());

    // Click summary again closes details
    await firstSummary.click();
    assert.equal(await firstFaq.evaluate((el) => el.hasAttribute('open')), false);
  } finally {
    await page.close();
  }
});

test('responsive viewports (1440, 1024, 768, 390, 320) produce no overflow and save evidence screenshots', async () => {
  const viewports = [
    { width: 1440, height: 960, name: 'landing-1440.png' },
    { width: 1024, height: 900, name: 'landing-1024.png' },
    { width: 768, height: 1024, name: 'landing-768.png' },
    { width: 390, height: 844, name: 'landing-390.png' },
    { width: 320, height: 800, name: 'landing-320.png' },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    try {
      await page.goto(`${baseUrl}/`);
      await page.evaluate(() => document.fonts.ready);

      // Verify no horizontal document overflow
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      assert.equal(fits, true, `Viewport ${vp.width}px overflowed horizontally!`);

      // Save screenshot
      await page.screenshot({
        path: path.join(evidenceDir, vp.name),
        fullPage: true,
      });
    } finally {
      await page.close();
    }
  }
});

test('mobile navigation drawer opens, handles Escape key, closes on anchor click, and saves menu screenshot', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.goto(`${baseUrl}/`);

    // Desktop nav is hidden on mobile
    const desktopNav = page.locator('nav[aria-label="Điều hướng trang giới thiệu"]');
    assert.equal(await desktopNav.isVisible(), false);

    // Mobile menu button is visible
    const menuBtn = page.locator('#mobileMenuToggleBtn');
    assert.ok(await menuBtn.isVisible());
    assert.equal(await menuBtn.getAttribute('aria-expanded'), 'false');
    assert.equal(await menuBtn.getAttribute('aria-label'), 'Mở menu điều hướng');

    // Native button activation by keyboard opens the disclosure.
    await menuBtn.focus();
    await page.keyboard.press('Enter');
    assert.equal(await menuBtn.getAttribute('aria-expanded'), 'true');
    assert.equal(await menuBtn.getAttribute('aria-label'), 'Đóng menu điều hướng');
    const mobileNav = page.locator('#mobileLandingNav');
    assert.ok(await mobileNav.isVisible());

    // Save open menu screenshot for evidence
    await page.screenshot({
      path: path.join(evidenceDir, 'landing-mobile-menu-390.png'),
    });

    // Tab enters the open disclosure and Escape restores focus to its opener.
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), 'Cách học');
    await page.keyboard.press('Escape');
    assert.equal(await menuBtn.getAttribute('aria-expanded'), 'false');
    assert.equal(await menuBtn.getAttribute('aria-label'), 'Mở menu điều hướng');
    assert.equal(await mobileNav.count(), 0);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'mobileMenuToggleBtn');

    // Closed links are removed from the tab order, even after the menu is dismissed.
    await page.keyboard.press('Tab');
    assert.notEqual(await page.evaluate(() => document.activeElement?.closest('#mobileLandingNav') !== null), true);

    // Open again and select an anchor; the target heading receives focus below the sticky header.
    await menuBtn.click();
    assert.equal(await menuBtn.getAttribute('aria-expanded'), 'true');
    await page.locator('#mobileLandingNav a[href="#faq"]').click();
    await page.waitForFunction(() => document.activeElement?.id === 'faq-heading');
    assert.equal(await page.locator('#mobileLandingNav').count(), 0);
    const targetTop = await page.locator('#faq-heading').evaluate((element) => element.getBoundingClientRect().top);
    const headerBottom = await page.locator('header').evaluate((element) => element.getBoundingClientRect().bottom);
    assert.ok(targetTop >= headerBottom, `Focused heading at ${targetTop}px is covered by header ending at ${headerBottom}px`);
  } finally {
    await page.close();
  }
});

test('mobile menu remains visible and usable after scrolling to the FAQ', async () => {
  const viewports = [
    { width: 390, height: 844, evidenceName: 'menu-after-scroll-390.png' },
    { width: 320, height: 800, evidenceName: 'menu-after-scroll-320.png' },
    { width: 390, height: 320, evidenceName: 'menu-short-viewport-390.png' },
  ];
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    try {
      await page.goto(`${baseUrl}/`);
      await page.locator('#faq').scrollIntoViewIfNeeded();
      await page.locator('#mobileMenuToggleBtn').click();

      const menu = page.locator('#mobileLandingNav');
      const login = menu.getByRole('link', { name: 'Đăng nhập tài khoản' });
      assert.ok(await menu.isVisible());
      assert.ok(await login.isVisible());

      const menuBounds = await menu.boundingBox();
      assert.ok(menuBounds, 'Mobile menu should have a rendered box');
      assert.ok(menuBounds.y >= 0, `Menu starts above viewport at ${menuBounds.y}px`);
      assert.ok(menuBounds.y + menuBounds.height <= viewport.height, `Menu ends below viewport at ${menuBounds.y + menuBounds.height}px`);
      if (viewport.height === 320) {
        const canScrollInsideMenu = await menu.evaluate((element) => element.scrollHeight > element.clientHeight);
        assert.equal(canScrollInsideMenu, true, 'Short viewport menu should scroll internally');
        await login.scrollIntoViewIfNeeded();
      }

      await page.screenshot({ path: path.join(evidenceDir, viewport.evidenceName) });
      if (viewport.width === 390 && viewport.height === 844) {
        await login.click();
        await page.waitForURL(`${baseUrl}/login`);
        assert.equal(new URL(page.url()).pathname, '/login');
      }
    } finally {
      await page.close();
    }
  }
});

test('header focus moves to a visible control when resizing across the mobile breakpoint', async () => {
  const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
  try {
    await page.goto(`${baseUrl}/`);
    await page.locator('nav[aria-label="Điều hướng trang giới thiệu"] a[href="#faq"]').focus();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.activeElement?.id === 'mobileMenuToggleBtn');

    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('href')), '#faq');

    await page.setViewportSize({ width: 1024, height: 900 });
    await page.waitForFunction(() => {
      const active = document.activeElement;
      return active instanceof HTMLAnchorElement && active.getAttribute('href') === '#faq';
    });
    assert.equal(await page.locator('#mobileLandingNav').count(), 0);
    assert.ok(await page.locator('nav[aria-label="Điều hướng trang giới thiệu"] a[href="#faq"]').isVisible());
  } finally {
    await page.close();
  }
});

function parseColor(color) {
  const hex = color.match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1];
  if (hex) {
    const fullHex = hex.length === 3 ? [...hex].map((digit) => digit + digit).join('') : hex;
    return [0, 2, 4].map((index) => Number.parseInt(fullHex.slice(index, index + 2), 16));
  }
  const rgb = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  assert.ok(rgb, `Unsupported CSS color value: ${color}`);
  return rgb.slice(1, 4).map(Number);
}

function contrastRatio(foreground, background) {
  const luminance = (color) => {
    const [red, green, blue] = parseColor(color).map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const values = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('landing small-text colors meet 4.5:1 contrast on their actual surfaces', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  try {
    await page.goto(`${baseUrl}/`);
    const colors = await page.evaluate(() => {
      const root = document.querySelector('[class*="landingRoot"]');
      const correctLabel = document.querySelector('[aria-label="Đáp án đúng"]');
      if (!root || !correctLabel) return null;
      const rootStyle = getComputedStyle(root);
      const labelStyle = getComputedStyle(correctLabel);
      const successSurface = correctLabel.parentElement;
      return {
        subtle: rootStyle.getPropertyValue('--landing-text-subtle').trim(),
        canvas: rootStyle.getPropertyValue('--landing-canvas').trim(),
        card: rootStyle.getPropertyValue('--landing-card').trim(),
        successText: labelStyle.color,
        successBackground: getComputedStyle(successSurface).backgroundColor,
      };
    });
    assert.ok(colors, 'Landing root and success label should be present');

    for (const background of [colors.canvas, colors.card]) {
      const ratio = contrastRatio(colors.subtle, background);
      assert.ok(ratio >= 4.5, `Subtle text contrast is ${ratio.toFixed(2)}:1 on ${background}`);
    }
    const successRatio = contrastRatio(colors.successText, colors.successBackground);
    assert.ok(successRatio >= 4.5, `Success label contrast is ${successRatio.toFixed(2)}:1`);
  } finally {
    await page.close();
  }
});

test('skip link and reduced-motion presentation remain usable', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${baseUrl}/`);
    await page.keyboard.press('Tab');

    const skipLink = page.getByRole('link', { name: 'Chuyển đến nội dung chính' });
    assert.ok(await skipLink.isVisible());
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.location.hash === '#main-content');

    const duration = await page.locator('#heroRegisterBtn').evaluate((element) => getComputedStyle(element).transitionDuration);
    assert.ok(Number.parseFloat(duration) <= 0.0001, `Reduced-motion transition duration is ${duration}`);

    await page.setViewportSize({ width: 195, height: 422 });
    const fitsAt200PercentZoom = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    assert.equal(fitsAt200PercentZoom, true, '390px viewport at 200% zoom should not overflow horizontally');
  } finally {
    await page.close();
  }
});

test('login and register forms feature accessible navigation link back to public root /', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  try {
    // Visit /login
    await page.goto(`${baseUrl}/login`);
    const loginBackLink = page.locator('#toHomeLandingLink');
    assert.ok(await loginBackLink.isVisible());
    assert.equal(await loginBackLink.getAttribute('href'), '/');
    await loginBackLink.click();
    await page.waitForURL(`${baseUrl}/`);
    assert.equal(new URL(page.url()).pathname, '/');

    // Visit /register
    await page.goto(`${baseUrl}/register`);
    const registerBackLink = page.locator('#toHomeLandingLink');
    assert.ok(await registerBackLink.isVisible());
    assert.equal(await registerBackLink.getAttribute('href'), '/');
    await registerBackLink.click();
    await page.waitForURL(`${baseUrl}/`);
    assert.equal(new URL(page.url()).pathname, '/');
  } finally {
    await page.close();
  }
});
