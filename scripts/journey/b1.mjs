import { open, stack, shot, text } from './lib.mjs';
const { browser, page, errors } = await open('admin');
await page.goto(`${stack.admin}/review`); await page.waitForLoadState('networkidle');
console.log((await text(page)).slice(0, 1800));
console.log(await page.$$eval('a,button', (e) => e.map((x) => `${x.tagName}:${x.id}:${(x.getAttribute('href')||'')}:${x.textContent.trim().slice(0,30)}`).filter(s=>/review|duyệt|Xem|btn/i.test(s))));
await shot(page, 'B1-review-queue', 'desktop');
console.log('errors', errors); await browser.close();
