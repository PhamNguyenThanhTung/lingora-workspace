// R3 / S6 — SRS review session for the words enrolled by the lesson.
// Usage: node scripts/journey/r3/s6-srs.mjs fr|ja [desktop]
import { open, stack, shot, lines, overflow } from './lib3.mjs';

const lang = process.argv[2];
const mobile = process.argv[3] !== 'desktop';
const dev = mobile ? 'mobile' : 'desktop';
const l = await open('learner', { mobile });
const p = l.page;
await p.goto(`${stack.web}/review`);
await p.waitForLoadState('load').catch(() => {});
await p.waitForTimeout(2500);
console.log('SRS LANDING:', await lines(p, 40));
await shot(p, 'C9-srs-landing', dev, lang);
if (!(await p.locator('#startReviewBtn').count())) {
  console.log('no start button; buttons:', await p.$$eval('button', (e) => e.map((x) => `${x.id}:${x.textContent.trim().slice(0, 25)}`)));
  await l.browser.close();
  process.exit(0);
}
await p.click('#startReviewBtn');
await p.waitForTimeout(2500);
for (let i = 0; i < 25; i++) {
  if (!(await p.locator('#revealAnswerBtn').count())) break;
  const front = await p.locator('body').innerText();
  console.log(`\nCARD ${i} FRONT:`, front.split('\n').filter(Boolean).slice(3, 20).join(' | ').slice(0, 400));
  if (i < 2) await shot(p, `C9-srs-card${i}-front`, dev, lang);
  await p.click('#revealAnswerBtn');
  await p.waitForTimeout(700);
  const back = await p.locator('body').innerText();
  console.log(`CARD ${i} BACK:`, back.split('\n').filter(Boolean).slice(3, 24).join(' | ').slice(0, 500));
  console.log('  MOJIBAKE:', /Ã|â€|ï¿½|�/.test(back) ? 'FOUND' : 'none', '| overflow:', await overflow(p));
  if (i < 2) await shot(p, `C9-srs-card${i}-back`, dev, lang);
  await p.click(i === 0 ? '#rateForgottenBtn' : '#rateRememberedBtn');
  await p.waitForTimeout(900);
}
await p.waitForTimeout(1200);
console.log('\nSRS END:', await lines(p, 40));
await shot(p, 'C9-srs-done', dev, lang);
console.log('console errors:', l.errors);
await l.browser.close();
