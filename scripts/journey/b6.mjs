import { open, stack, shot, text } from './lib.mjs';
const a = await open('admin');
await a.page.goto(`${stack.admin}/review/6873fede-641c-4d65-914d-21650f332239`); await a.page.waitForLoadState('networkidle');
await a.page.click('#btnPublish'); await a.page.waitForTimeout(3000);
console.log(await a.page.locator('[role=alert],[role=status],.alert').allInnerTexts());
await shot(a.page, 'B6-published', 'desktop'); console.log('errors', a.errors); await a.browser.close();
// learner: look at home and the new lesson
const l = await open('learner');
await l.page.goto(`${stack.web}/`); await l.page.waitForLoadState('networkidle');
const tx = await text(l.page); console.log(tx.slice(0, 1500));
console.log(await l.page.$$eval('a', (e) => e.map((x) => x.getAttribute('href')).filter(Boolean)));
await shot(l.page, 'C2-home', 'desktop'); console.log('errors', l.errors); await l.browser.close();
