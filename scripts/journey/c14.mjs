import { open, stack, shot, text } from './lib.mjs';
const l = await open('learner', { mobile: true }); const p = l.page;
await p.goto(`${stack.web}/review`); await p.waitForLoadState('networkidle');
await p.click('#startReviewBtn'); await p.waitForTimeout(2500);
console.log('S1:', (await text(p)).split('\n').filter(Boolean).slice(3).join(' | ').slice(0, 700));
console.log(await p.$$eval('button', (e) => e.map((x) => `${x.id}:${x.textContent.trim().slice(0,25)}`).join(', ')));
await shot(p, 'C9-srs-card', 'mobile');
console.log('errors', l.errors); await l.browser.close();
