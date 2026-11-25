import { open, stack, shot, text } from './lib.mjs';
const CTX = '3ad5be92-f608-4fd1-a4c8-24d59f87c9cf';
const l = await open('learner', { mobile: true }); const p = l.page;
await p.goto(`${stack.web}/learn/${CTX}/${stack.authoringLessonId}`); await p.waitForLoadState('networkidle');
console.log((await text(p)).split('\n').filter(Boolean).join(' | ').slice(0, 600));
if (await p.locator('#startReadingBtn').count()) { await p.click('#startReadingBtn'); await p.waitForSelector('#completeReadingBtn'); await shot(p, 'C4-L4-reading', 'mobile'); }
console.log('READING:', (await text(p)).split('\n').filter(Boolean).join(' | ').slice(0, 1500));
if (await p.locator('#completeReadingBtn').count()) { await p.click('#completeReadingBtn'); await p.waitForSelector('#completedStateBtn'); }
if (await p.locator('#startPracticeBtn').count()) await p.click('#startPracticeBtn'); await p.waitForSelector('#submitResponseBtn');
await shot(p, 'C5-L4-ex1', 'mobile');
console.log('EX1:', (await text(p)).split('\n').filter(Boolean).slice(-14).join(' | '));
console.log(await p.$$eval('input,button', (e) => e.map((x) => `${x.id}:${x.value||''}:${x.textContent.trim().slice(0,25)}:${x.disabled}`)));
// wrong answer on purpose
await p.locator('input[value="opt_1"]').click(); await p.click('#submitResponseBtn'); await p.waitForSelector('#formativeFeedback');
await shot(p, 'C5-L4-ex1-wrong', 'mobile');
console.log('PAGE AFTER WRONG:', (await text(p)).split('\n').filter(Boolean).slice(5).join(' | '));
await p.fill('#fillBlankInput', 'mother'); await p.click('#submitResponseBtn'); await p.waitForSelector('#formativeFeedback'); await p.waitForTimeout(500);
await shot(p, 'C5-L4-ex2-wrong-fill', 'mobile');
console.log('PAGE AFTER WRONG FILL:', (await text(p)).split('\n').filter(Boolean).slice(5).join(' | '));
console.log(await p.$$eval('button', (e) => e.map((x) => `${x.id}:${x.textContent.trim().slice(0,25)}:${x.disabled}`)));
console.log('errors', l.errors); await l.browser.close();
