import { open, stack, shot, text } from './lib.mjs';
const l = await open('learner', { mobile: true }); const p = l.page;
await p.goto(`${stack.web}/home`); await p.waitForLoadState('networkidle'); await p.waitForTimeout(1200);
console.log('HOME:', (await text(p)).split('\n').filter(Boolean).slice(5, 45).join(' | ').slice(0, 900));
await shot(p, 'C8-home-after', 'mobile');
await p.goto(`${stack.web}/review`); await p.waitForLoadState('networkidle'); await p.waitForTimeout(1500);
console.log('REVIEW:', (await text(p)).split('\n').filter(Boolean).slice(3).join(' | ').slice(0, 900));
console.log(await p.$$eval('button,a,input', (e) => e.map((x) => `${x.id}:${x.textContent.trim().slice(0,25)}`).filter(s=>!/^:Lingora/.test(s)).join(', ')));
await shot(p, 'C9-srs-review', 'mobile'); console.log('errors', l.errors); await l.browser.close();
