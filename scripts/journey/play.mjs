import { open, stack, shot, text } from './lib.mjs';
const CTX = '3ad5be92-f608-4fd1-a4c8-24d59f87c9cf';
const SAMPLE = stack.sampleLessonIds;
// answers in exercise order. {radio}|{fill}|{tokens: ids | words}
export const PLAN = {
  '00000000-0000-0000-0000-000000000050': [{ radio: 'opt-1-1' }, { fill: 'meet' }, { tokens: ['t1', 't2', 't3'] }],
  [SAMPLE[1]]: [{ radio: 'opt-2-1' }, { fill: 'I am from Vietnam.' }, { tokens: ['t2-1', 't2-2', 't2-3', 't2-4'] }],
  [SAMPLE[2]]: [{ fill: 'wakes' }, { radio: 'opt-3-1' }, { tokens: ['t3-1', 't3-2', 't3-3', 't3-4', 't3-5'] }],
};
export async function playLesson(p, lessonId, answers, { code, dev, wrongFirst = false, log = console.log } = {}) {
  await p.goto(`${stack.web}/learn/${CTX}/${lessonId}`); await p.waitForLoadState('networkidle');
  if (code) await shot(p, `${code}-lesson-open`, dev);
  if (await p.locator('#startReadingBtn').isVisible()) { await p.click('#startReadingBtn'); await p.waitForSelector('#completeReadingBtn'); if (code) await shot(p, `${code}-reading`, dev); await p.click('#completeReadingBtn'); await p.waitForSelector('#completedStateBtn'); }
  await p.click('#startPracticeBtn'); await p.waitForSelector('#submitResponseBtn');
  for (let i = 0; i < answers.length; i++) {
    const a = answers[i];
    const kind = await p.evaluate(() => document.querySelector('input[type=radio]') ? 'radio' : document.querySelector('[id^=tokenBtn-]') ? 'tokens' : 'text');
    log(`  ex${i + 1} kind=${kind}`);
    if (code) await shot(p, `${code}-ex${i + 1}-question`, dev);
    const prompt = (await text(p)).split('\n').filter(Boolean);
    const submitAnswer = async (ans) => {
      if (ans.radio) await p.locator(`input[value="${ans.radio}"]`).click();
      else if (ans.radioIndex != null) await p.locator('input[type=radio]').nth(ans.radioIndex).click();
      else if (ans.fill != null) await p.locator('input[type=text], textarea').first().fill(ans.fill);
      else for (const t of ans.tokens) await (t.startsWith('#') ? p.locator(`button:text-is("${t.slice(1)}")`).first() : p.locator(`#tokenBtn-${t}`)).click();
      await p.click('#submitResponseBtn'); await p.waitForSelector('#formativeFeedback');
    };
    if (wrongFirst && i === 0) {
      await submitAnswer({ radioIndex: 0 === 0 ? (await p.locator('input[type=radio]').count()) - 1 : 0 });
      log('  wrong answer feedback:', (await p.locator('#formativeFeedback').innerText()).replace(/\n/g, ' | '));
      if (code) await shot(p, `${code}-ex${i + 1}-wrong-feedback`, dev);
      const retry = p.locator('#retryResponseBtn, button:has-text("Làm lại")'); log('  retry button count', await retry.count());
      if (await retry.count()) await retry.first().click();
    }
    if (!(wrongFirst && i === 0 && !(await p.locator('#submitResponseBtn').isVisible()))) {}
    await submitAnswer(a).catch(async (e) => { log('  submit failed:', e.message.split('\n')[0]); });
    log('  feedback:', (await p.locator('#formativeFeedback').innerText()).replace(/\n/g, ' | ').slice(0, 300));
    if (code) await shot(p, `${code}-ex${i + 1}-feedback`, dev);
    const next = p.locator('#nextExerciseBtn, button:has-text("Câu tiếp theo")'); if (await next.count()) await next.first().click().catch(() => {});
    await p.waitForTimeout(600);
  }
  await p.waitForSelector('#finalizePracticeBtn:not([disabled])', { timeout: 15000 });
  if (code) await shot(p, `${code}-before-finalize`, dev);
  await p.click('#finalizePracticeBtn'); await p.waitForSelector('#practiceCelebrationBox', { timeout: 15000 });
  const res = { xp: await p.textContent('#celebrationTotalXp'), gems: await p.textContent('#celebrationGems').catch(() => null), acc: await p.textContent('#celebrationAccuracy').catch(() => null) };
  if (code) await shot(p, `${code}-celebration`, dev);
  return res;
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const l = await open('learner', { mobile: true });
  for (const id of Object.keys(PLAN)) { console.log('lesson', id); console.log(await playLesson(l.page, id, PLAN[id], { code: 'C4', dev: 'mobile' })); }
  console.log('errors', l.errors); await l.browser.close();
}
