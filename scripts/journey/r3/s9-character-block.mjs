// R3 / S9 — Can a teacher add a Japanese writing/kanji (CHARACTER) block to the lesson?
// Checks the teacher character-options endpoint for the Japanese lesson and the block
// picker inside Lesson Studio.
// Usage: node scripts/journey/r3/s9-character-block.mjs ja|fr
import { open, stack, shot, loadIds } from './lib3.mjs';

const lang = process.argv[2] || 'ja';
const ids = loadIds();
const lessonId = ids[`${lang}LessonId`];
const t = await open('teacher');
const p = t.page;

await p.goto(`${stack.admin}/my-lessons/${lessonId}`);
await p.waitForLoadState('networkidle').catch(() => {});
const res = await p.evaluate(async (id) => {
  const r = await fetch(`/api/teacher/lessons/${id}/character-options`, { headers: { accept: 'application/json' } });
  return { status: r.status, body: (await r.text()).slice(0, 1500) };
}, lessonId);
console.log('character-options:', res.status, res.body);

// studio: look for a CHARACTER block option
if (await p.locator('#btnToggleStudioMode').count()) {
  await p.click('#btnToggleStudioMode');
  await p.waitForTimeout(1500);
}
const blockButtons = await p.$$eval('button', (els) =>
  els.map((e) => `${e.id}:${(e.textContent || '').trim().slice(0, 40)}`).filter((s) => /character|Chữ|chữ|viết|Viết/i.test(s))
);
console.log('character-ish controls in studio:', JSON.stringify(blockButtons));
await shot(p, 'A9-studio-character', 'desktop', lang);
console.log('console errors:', t.errors);
await t.browser.close();

// Follow-up: open the CHARACTER block picker to see what the teacher is offered.
const t2 = await open('teacher');
await t2.page.goto(`${stack.admin}/my-lessons/${lessonId}`);
await t2.page.waitForLoadState('networkidle').catch(() => {});
if (await t2.page.locator('#btnToggleStudioMode').count()) {
  await t2.page.click('#btnToggleStudioMode');
  await t2.page.waitForTimeout(1500);
}
await t2.page.click('#btnAddBlock-character').catch((e) => console.log('cannot click:', e.message));
await t2.page.waitForTimeout(1500);
console.log('PICKER:', (await t2.page.locator('body').innerText()).replace(/\n+/g, ' | ').slice(0, 1200));
await shot(t2.page, 'A9-character-picker', 'desktop', lang);
console.log('console errors (picker):', t2.errors);
await t2.browser.close();
