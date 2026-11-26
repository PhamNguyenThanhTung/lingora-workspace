import { open, stack, shot, text } from './lib.mjs';
const l = await open('learner', { mobile: true }); const p = l.page;
await p.goto(`${stack.web}/review`); await p.waitForLoadState('networkidle');
await p.click('#startReviewBtn'); await p.waitForTimeout(2000);
await p.click('#revealAnswerBtn'); await p.waitForTimeout(500);
await shot(p, 'C9-srs-card-back', 'mobile');
console.log('BACK:', (await text(p)).split('\n').filter(Boolean).slice(3).join(' | ').slice(0, 500));
console.log(await p.$$eval('button:not([disabled])', (e) => e.map((x) => `${x.id}:${x.textContent.trim().slice(0,25)}`).join(', ')));
for (let i = 0; i < 20; i++) {
  const g = p.locator('button[id^=grade]'); if (!(await g.count())) { if (await p.locator('#revealAnswerBtn').count()) await p.click('#revealAnswerBtn'); else break; await p.waitForTimeout(300); continue; }
  await g.nth(Math.min(2, (await g.count()) - 1)).click(); await p.waitForTimeout(700);
  if (await p.locator('#revealAnswerBtn').count()) await p.click('#revealAnswerBtn');
  if (/Hoàn thành|Kết quả|hoàn tất/i.test(await text(p))) break;
}
await shot(p, 'C9-srs-done', 'mobile');
console.log('END:', (await text(p)).split('\n').filter(Boolean).slice(3).join(' | ').slice(0, 600));
console.log('errors', l.errors); await l.browser.close();
