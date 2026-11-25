import { open, stack, shot, text } from './lib.mjs';
const { browser, page, errors } = await open('admin');
await page.goto(`${stack.admin}/review/1a3cd295-8c78-43d5-83ee-cd95f68d9cd5`); await page.waitForLoadState('networkidle');
const t = await text(page); console.log(t.slice(t.indexOf('Đến nội dung chính'), t.indexOf('Đến nội dung chính')+3500));
console.log(await page.$$eval('button,textarea,input,select', (e) => e.map((x) => `${x.tagName}#${x.id}${x.disabled?'(disabled)':''}`).filter(s=>!/btnLogout/.test(s))));
await shot(page, 'B2-review-detail', 'desktop');
console.log('errors', errors); await browser.close();
