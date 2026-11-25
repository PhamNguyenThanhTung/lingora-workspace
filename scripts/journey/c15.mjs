import { open, stack, shot, text } from './lib.mjs';
const l = await open('learner', { mobile: true }); const p = l.page;
await p.goto(`${stack.web}/review`); await p.waitForLoadState('networkidle');
await p.click('#startReviewBtn'); await p.waitForTimeout(2500);
for (let i = 0; i < 8; i++) {
  console.log(`S${i}:`, (await text(p)).split('\n').filter(Boolean).slice(3).join(' | ').slice(0, 500));
  const btns = await p.$$eval('button:not([disabled])', (e) => e.map((x) => `${x.id}:${x.textContent.trim().slice(0,25)}`)); console.log(btns.join(', '));
  await shot(p, `C9-srs-${i}`, 'mobile');
  const b = p.locator('#showAnswerBtn, #revealBtn, button:has-text("Hiện đáp án"), button:has-text("Xem đáp án")'); 
  if (await b.count()) { await b.first().click(); await p.waitForTimeout(500); await shot(p, `C9-srs-${i}-back`, 'mobile'); console.log('  back:', (await text(p)).split('\n').filter(Boolean).slice(3).join(' | ').slice(0, 400)); }
  const g = p.locator('[id^=grade], button:has-text("Dễ"), button:has-text("Nhớ")'); if (await g.count()) await g.first().click(); else break;
  await p.waitForTimeout(900);
}
console.log('errors', l.errors); await l.browser.close();
