import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
export const stack = JSON.parse(fs.readFileSync('/tmp/journey-stack.json', 'utf8'));
export const shotDir = path.resolve(import.meta.dirname, '../../docs/acceptance/screenshots');
export function cookie(role, name) {
  const id = stack.ids[role];
  const session = { access_token: `token-${id}`, refresh_token: `refresh-${id}`, expires_at: Math.floor(Date.now() / 1000) + 86400, user: { id, email: stack.emails[role] } };
  return { name, value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`, domain: '127.0.0.1', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' };
}
export async function open(role, { mobile = false } = {}) {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: mobile ? { width: 375, height: 812 } : { width: 1280, height: 800 }, isMobile: mobile, hasTouch: mobile });
  await ctx.addCookies([cookie(role, role === 'learner' ? 'sb-127-learner-token' : 'sb-127-auth-token')]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  return { browser, ctx, page, errors };
}
export const shot = (page, code, device, lang = 'en') => page.screenshot({ path: path.join(shotDir, `${code}-${device}-${lang}.png`), fullPage: true });
export const text = (page) => page.locator('body').innerText();
