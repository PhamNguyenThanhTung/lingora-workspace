import fs from 'node:fs';
import { open, stack, shot, text } from './lib.mjs';
const CTX = fs.readFileSync('/tmp/journey-ctx', 'utf8').trim();
const url = `${stack.web}/learn/${CTX}/${stack.authoringLessonId}`;
const probe = async (p, label) => {
  const fb = await p.locator('#formativeFeedback').innerText().catch(() => null);
  const ans = await p.locator('#feedbackCorrectAnswer').innerText().catch(() => null);
  const exp = await p.locator('#feedbackExplanation').innerText().catch(() => null);
  const ex = await p.evaluate(() => { const s = document.querySelector('#exercisesSection'); return { readingExercisesVisible: !!s, questionHeading: (document.body.innerText.match(/Câu hỏi \d+[^\n]*/) || [])[0] }; });
  console.log(label, JSON.stringify({ fb, ans, exp, ...ex, overflow: await p.evaluate(() => document.documentElement.scrollWidth > innerWidth) }));
};
for (const mobile of [true, false]) {
  const dev = mobile ? 'mobile' : 'desktop';
  const l = await open('learner', { mobile }); const p = l.page;
  await p.goto(url); await p.waitForLoadState('networkidle');
  if (await p.locator('#startReadingBtn').count()) { await p.click('#startReadingBtn'); await p.waitForSelector('#completeReadingBtn'); await p.click('#completeReadingBtn'); await p.waitForSelector('#completedStateBtn'); }
  if (await p.locator('#startPracticeBtn').count()) { await p.click('#startPracticeBtn'); await p.waitForSelector('#submitResponseBtn'); }
  await p.waitForTimeout(800);
  if (mobile) { // Q1 MCQ wrong
    await p.locator('input[name=mcq-option][value=opt_1][id^=practice-]').click();
  } else { // Q2 FILL_BLANK wrong
    await p.fill('#fillBlankInput', 'mother');
  }
  await p.click('#submitResponseBtn'); await p.waitForSelector('#formativeFeedback'); await p.waitForTimeout(600);
  await probe(p, `F2 ${dev}`);
  await shot(p, 'F2-after-fix-wrong-feedback', dev);
  await p.reload(); await p.waitForLoadState('networkidle'); await p.waitForTimeout(800);
  await probe(p, `F3/F4 after reload ${dev}`);
  await shot(p, 'F3F4-after-reload', dev);
  console.log('errors', l.errors); await l.browser.close();
}
