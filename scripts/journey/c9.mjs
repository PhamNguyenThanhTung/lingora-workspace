import { open, stack, shot, text } from './lib.mjs';
const CTX = '3ad5be92-f608-4fd1-a4c8-24d59f87c9cf';
const l = await open('learner', { mobile: true }); const p = l.page;
await p.goto(`${stack.web}/learn/${CTX}/${stack.authoringLessonId}`); await p.waitForLoadState('networkidle'); await p.waitForTimeout(1200);
const dump = async (label) => { const t = (await text(p)).split('\n').filter(Boolean); const i = t.indexOf('Đang làm bài'); console.log(label, t.slice(i).join(' | ').slice(0, 700)); console.log('  btns', await p.$$eval('button:not([disabled])', (e) => e.map((x) => `${x.id}:${x.textContent.trim().slice(0,22)}`).join(', '))); };
await p.fill('#fillBlankInput', 'mother'); await p.click('#submitResponseBtn'); await p.waitForSelector('#formativeFeedback'); await p.waitForTimeout(400);
await shot(p, 'C5-L4-ex2-wrong', 'mobile'); await dump('AFTER WRONG FILL:');
// toggle "Ẩn"/explanation
const tg = p.locator('#formativeFeedback button'); console.log('toggle count', await tg.count());
await l.browser.close();
