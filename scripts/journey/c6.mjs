import { open, stack, shot, text } from './lib.mjs';
const l = await open('learner', { mobile: true }); const p = l.page;
const ctx = '0c7a5c06-6d7c-4790-ace7-ffad5b7b7f7b';
await p.goto(`${stack.web}/learn/${ctx}/00000000-0000-0000-0000-000000000050`); await p.waitForLoadState('networkidle'); await p.waitForTimeout(1500);
console.log((await text(p)).split('\n').filter(Boolean).join(' | ').slice(0, 1800));
console.log(await p.$$eval('button,input,a', (e) => e.map((x) => `${x.tagName}#${x.id}:${x.textContent.trim().slice(0,25)}`)));
await shot(p, 'C4-lesson-open', 'mobile'); console.log('errors', l.errors); await l.browser.close();
