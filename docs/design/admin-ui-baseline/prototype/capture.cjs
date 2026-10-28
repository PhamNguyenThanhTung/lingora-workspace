// ==========================================================================
// Lingora Admin UI Baseline - Prototype Screenshot Capture Script
// ==========================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 4178;
const PROTOTYPE_DIR = __dirname;
const BASE_SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

// Create local static server
function createServer() {
  return http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(PROTOTYPE_DIR, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.warn(`[404 Not Found] ${req.url}`);
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
}

const ALL_STATES = [
  'login-normal',
  'login-invalid',
  'languages-populated',
  'languages-empty',
  'language-create',
  'language-edit',
  'delete-confirmation',
  'delete-blocked',
  // Optional companion states
  'language-create-duplicate',
  'languages-loading',
  'languages-fetch-error',
  'session-lost'
];

const CLI_FILTER = process.argv.slice(2).filter(arg => !arg.startsWith('-'));
const STATES = CLI_FILTER.length > 0 ? CLI_FILTER : ALL_STATES;

const VIEWPORTS = [
  { width: 1440, height: 960, dir: '1440' },
  { width: 1100, height: 800, dir: '1100' }
];

async function capture() {
  const server = createServer();
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`Prototype server running at http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({
    executablePath: '/opt/coccoc/browser/browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const consoleErrors = [];

  for (const vp of VIEWPORTS) {
    const outDir = path.join(BASE_SCREENSHOT_DIR, vp.dir);
    fs.mkdirSync(outDir, { recursive: true });

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1
    });

    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Console Error] ${msg.text()}`);
      }
    });

    page.on('pageerror', err => {
      consoleErrors.push(`[Page Error] ${err.message}`);
    });

    for (const state of STATES) {
      const url = `http://127.0.0.1:${PORT}/index.html?capture=1&state=${state}`;
      await page.goto(url, { waitUntil: 'networkidle' });

      // Ensure fonts are loaded
      await page.evaluate(async () => {
        await document.fonts.ready;
      });

      // Brief pause for focus and layout settling
      await page.waitForTimeout(200);

      const filename = `${state}.png`;
      const outPath = path.join(outDir, filename);

      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`Captured ${vp.dir}/${filename} (${vp.width}x${vp.height})`);
    }

    await context.close();
  }

  await browser.close();
  server.close();

  if (consoleErrors.length > 0) {
    console.error('Errors encountered during capture:', consoleErrors);
  } else {
    console.log('Capture completed successfully with 0 console errors!');
  }
}

capture().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
