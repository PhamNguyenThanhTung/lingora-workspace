import { open, stack, shot, text } from './lib.mjs';
const l = await open('learner');
await l.page.goto(`${stack.web}/onboarding`); await l.page.waitForLoadState('networkidle'); await l.page.waitForTimeout(1500);
console.log((await text(l.page)).slice(0, 1500));
console.log(await l.page.$$eval('button,input,select,a', (e) => e.map((x) => `${x.tagName}#${x.id}:${x.textContent.trim().slice(0,30)}`)));
await shot(l.page, 'C1-onboarding-1', 'desktop'); console.log('errors', l.errors); await l.browser.close();
