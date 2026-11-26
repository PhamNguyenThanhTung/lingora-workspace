import { open, stack, shot, text } from './lib.mjs';
const { browser, page } = await open('teacher');
await page.goto(`${stack.admin}/my-lessons/${stack.authoringLessonId}`); await page.waitForLoadState('networkidle');
await page.waitForTimeout(1500);
console.log(await page.$$eval('button', (e) => e.map((x) => `${x.id||x.textContent.trim().slice(0,30)}:${x.disabled}`)));
const t = await text(page);
console.log(t.slice(0, 1500));
await shot(page, 'A10-state', 'desktop');
await browser.close();
