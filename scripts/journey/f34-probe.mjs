import fs from 'node:fs';
import { open, stack } from './lib.mjs';
const CTX = fs.readFileSync('/tmp/journey-ctx', 'utf8').trim();
const url = `${stack.web}/learn/${CTX}/${stack.authoringLessonId}`;
for (const mobile of [true, false]) {
  const dev = mobile ? 'mobile' : 'desktop';
  const l = await open('learner', { mobile }); const p = l.page;
  await p.goto(url); await p.waitForLoadState('networkidle');
  if (await p.locator('#startPracticeBtn').count()) { await p.click('#startPracticeBtn'); await p.waitForSelector('#submitResponseBtn'); }
  await p.waitForTimeout(600);
  const info = await p.evaluate(() => {
    const s = document.querySelector('.practice-session');
    const top = document.elementFromPoint(innerWidth/2, innerHeight/2);
    return { overlay: !!s, centerInsideOverlay: !!(s && top && s.contains(top)), bodyScrollable: document.documentElement.scrollHeight > innerHeight, bodyOverflow: getComputedStyle(document.body).overflow };
  });
  console.log(dev, JSON.stringify(info));
  await p.screenshot({ path: `/tmp/f34-${dev}-q1.png` });
  // answer Q wrong then look at next question with banner
  const mcq = p.locator('input[name=mcq-option][id^=practice-]').first();
  if (await mcq.count()) { await mcq.click(); await p.click('#submitResponseBtn'); await p.waitForSelector('#formativeFeedback'); await p.waitForTimeout(500); await p.screenshot({ path: `/tmp/f34-${dev}-banner.png` }); }
  await l.browser.close();
}
