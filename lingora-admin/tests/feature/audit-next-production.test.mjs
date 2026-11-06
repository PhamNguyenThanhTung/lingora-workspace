import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const adminRoot = path.resolve(__dirname, '../..');

const PROD_PORT = 3029;
const PROD_URL = `http://127.0.0.1:${PROD_PORT}`;

describe('Production Built Next.js + Chromium Smoke Verification', () => {
  let nextProcess;
  let browser;

  before(async () => {
    // 1. Launch Next.js production server with safe loopback synthetic environment
    const safeEnv = {
      ...process.env,
      PORT: String(PROD_PORT),
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://audit_synthetic:audit_synthetic@127.0.0.1:54322/audit_synthetic?schema=app',
      DIRECT_URL: 'postgresql://audit_synthetic:audit_synthetic@127.0.0.1:54322/audit_synthetic?schema=app',
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      SUPABASE_URL: 'http://127.0.0.1:54321',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_audit_synthetic_only_1234567890',
      SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_audit_synthetic_only_1234567890',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_audit_synthetic_only_1234567890',
      SUPABASE_ANON_KEY: 'sb_publishable_audit_synthetic_only_1234567890',
      SUPABASE_SECRET_KEY: 'test_audit_synthetic_secret_only_1234567890',
      SUPABASE_SERVICE_ROLE_KEY: 'test_audit_synthetic_service_role_only_1234567890',
      NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: 'audit_synthetic_disabled',
      NEXT_PUBLIC_SUPABASE_SECRET_KEY: 'audit_synthetic_disabled',
      SUPABASE_DEV_PROJECT_REF: 'audit_synthetic_only',
      LINGORA_APP_ORIGIN: `http://127.0.0.1:${PROD_PORT}`,
    };

    nextProcess = spawn('npx', ['next', 'start', '-p', String(PROD_PORT)], {
      cwd: adminRoot,
      env: safeEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });

    // Wait for Next.js to start
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for next start'));
      }, 15000);

      const onData = (chunk) => {
        const text = chunk.toString();
        if (text.includes('Ready in') || text.includes('started server on') || text.includes(`:${PROD_PORT}`)) {
          clearTimeout(timeout);
          resolve();
        }
      };

      nextProcess.stdout.on('data', onData);
      nextProcess.stderr.on('data', onData);
      nextProcess.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  });

  after(async () => {
    if (browser) await browser.close();
    if (nextProcess && nextProcess.pid) {
      try {
        process.kill(-nextProcess.pid, 'SIGKILL');
      } catch {
        try {
          nextProcess.kill('SIGKILL');
        } catch {}
      }
    }
  });

  test('Anonymous visitor to built /audit-events redirects to /login with zero console errors', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleErrors = [];
    const pageErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    const response = await page.goto(`${PROD_URL}/audit-events`, { waitUntil: 'domcontentloaded' });

    // Must be redirected to /login
    const finalUrl = page.url();
    assert.ok(finalUrl.includes('/login'), `Expected redirect to /login, got: ${finalUrl}`);

    // Verify 0 client runtime/console errors
    assert.equal(pageErrors.length, 0, `Expected 0 page errors, got: ${JSON.stringify(pageErrors)}`);
    assert.equal(consoleErrors.length, 0, `Expected 0 console errors, got: ${JSON.stringify(consoleErrors)}`);

    await context.close();
  });

  test('Anonymous GET /api/audit-events returns 401 with Cache-Control: no-store, private', async () => {
    const res = await fetch(`${PROD_URL}/api/audit-events`);
    assert.equal(res.status, 401);
    assert.equal(res.headers.get('cache-control'), 'no-store, private');

    const body = await res.json();
    assert.equal(body.error?.code, 'UNAUTHENTICATED');
  });

  test('Test harness routes are not exposed in production build', async () => {
    const nonExistent1 = await fetch(`${PROD_URL}/__test_wire`);
    assert.equal(nonExistent1.status, 404, 'Test harness path must return 404 in production build');

    const nonExistent2 = await fetch(`${PROD_URL}/isolated-server`);
    assert.equal(nonExistent2.status, 404, 'Isolated server route must return 404 in production build');
  });
});
