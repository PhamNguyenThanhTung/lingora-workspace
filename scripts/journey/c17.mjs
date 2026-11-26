import { open, stack, shot, text } from './lib.mjs';
const l = await open('learner', { mobile: true }); const p = l.page;
await p.goto(`${stack.web}/review`); await p.waitForLoadState('networkidle');
await p.click('#startReviewBtn'); await p.waitForTimeout(2000);
for (let i = 0; i < 14; i++) {
  await p.click('#revealAnswerBtn'); await p.click(i % 4 === 0 ? '#rateForgottenBtn' : '#rateRememberedBtn'); await p.waitForTimeout(500);
  if (!(await p.locator('#revealAnswerBtn').count())) break;
}
await p.waitForTimeout(1000); await shot(p, 'C9-srs-done', 'mobile');
console.log('END:', (await text(p)).split('\n').filter(Boolean).slice(3).join(' | ').slice(0, 600));
console.log('errors', l.errors); await l.browser.close();
