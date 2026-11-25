// Round-3 helpers: reuse round-1 lib (open/shot/stack) and add an id store for the
// French / Japanese curriculum created through the admin UI during this round.
import fs from 'node:fs';
export { open, stack, shot, text, cookie, shotDir } from '../lib.mjs';

const STORE = '/tmp/r3-ids.json';
export const loadIds = () => (fs.existsSync(STORE) ? JSON.parse(fs.readFileSync(STORE, 'utf8')) : {});
export function saveIds(patch) {
  const next = { ...loadIds(), ...patch };
  fs.writeFileSync(STORE, JSON.stringify(next, null, 2));
  return next;
}
export const alerts = async (page) =>
  (await page.locator('[role=alert],[role=status],.alert,.login-alert').allInnerTexts()).map((s) => s.replace(/\n+/g, ' ').trim()).filter(Boolean);
export const lines = async (page, n = 60) =>
  (await page.locator('body').innerText()).split('\n').map((s) => s.trim()).filter(Boolean).slice(0, n).join(' | ');
export const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
