import { open, stack, shot, text } from './lib.mjs';
const CTX = '3ad5be92-f608-4fd1-a4c8-24d59f87c9cf';
const l = await open('learner', { mobile: true }); const p = l.page;
await p.goto(`${stack.web}/learn/${CTX}/${stack.authoringLessonId}`); await p.waitForLoadState('networkidle'); await p.waitForTimeout(1500);
const t = (await text(p)).split('\n').filter(Boolean); const i = t.indexOf('Đang làm bài');
console.log('STATE:', t.slice(i - 1).join(' | ').slice(0, 900));
console.log(await p.$$eval('input:not([disabled]),button', (e) => e.map((x) => `${x.id}:${x.value||''}:${x.textContent.trim().slice(0,25)}:${x.disabled}`)));
await shot(p, 'C5-L4-resumed', 'mobile'); await l.browser.close();
