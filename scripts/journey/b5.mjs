import { open, stack, shot, text } from './lib.mjs';
const a = await open('admin');
await a.page.goto(`${stack.admin}/review/6873fede-641c-4d65-914d-21650f332239`); await a.page.waitForLoadState('networkidle');
console.log(await a.page.$$eval('button', (e) => e.map((x) => `${x.id}:${x.disabled}:${x.textContent.trim().slice(0,40)}`).filter(s=>!/Logout|^:/.test(s))));
await shot(a.page, 'B5-approved-detail', 'desktop');
await a.browser.close();
