import { open, stack, shot, text } from './lib.mjs';
const l = await open('learner', { mobile: true });
const p = l.page;
await p.goto(`${stack.web}/onboarding`); await p.waitForLoadState('networkidle');
for (let step = 1; step <= 6; step++) {
  console.log(`--- step ${step}`); console.log((await text(p)).split('\n').filter(Boolean).slice(2, 22).join(' | '));
  console.log(await p.$$eval('button,input', (e) => e.filter(x=>!x.disabled || x.type==='radio').map((x) => `${x.id}:${x.textContent.trim().slice(0,20)}`)));
  await shot(p, `C1-onboarding-${step}`, 'mobile');
  const radio = await p.$('input[type=radio]'); if (radio) await radio.check({ force: true }).catch(() => {});
  const next = await p.$('[id^=btnStep][id$=Next], #btnStart, #btnFinish, #btnConfirm');
  if (!next) break; await next.click(); await p.waitForTimeout(1800);
  if (!/onboarding/.test(p.url())) { console.log('left onboarding ->', p.url()); break; }
}
console.log('url', p.url(), 'errors', l.errors); await l.browser.close();
