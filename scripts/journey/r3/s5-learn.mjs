// R3 / S5 — Learner reads the lesson, practises (with deliberate mistakes that probe
// multi-language normalization), sees the result screen and redoes the wrong items.
// Usage: node scripts/journey/r3/s5-learn.mjs fr|ja [desktop]
import { open, stack, shot, lines, overflow, loadIds } from './lib3.mjs';

const lang = process.argv[2];
const mobile = process.argv[3] !== 'desktop';
const dev = mobile ? 'mobile' : 'desktop';
const ids = loadIds();
const ctx = ids[`${lang}ContextId`];
const lessonId = ids[`${lang}LessonId`];

// answer plan: [match in prompt, first answer, retry answer]
const PLAN = {
  fr: [
    ['mở đầu bằng lời chào', 'Bonsoir', 'Bonjour'],
    ['ly cà phê', 'cafe', 'café'],
    ['Tôi tên là Élodie', ['Je', 'm’appelle', 'Élodie'], null],
    ['Bạn có khỏe không', 'Comment allez-vous?', null],
    ['chọn lời chào bạn nghe được', 'Bonjour', null],
    ['Ça va', 'Ổn, khỏe', null],
  ],
  ja: [
    ['Buổi sáng người Nhật chào', 'こんばんは', 'おはようございます'],
    ['Tôi là học sinh', 'がくせい。', null],
    ['Sắp xếp thành câu: Tôi là Tanaka', ['わたしは', '田中', 'です'], null],
    ['Viết câu tự giới thiệu', 'わたしは　田中です。', 'わたしは田中です'],
    ['chọn câu chào bạn nghe được', 'はじめまして', null],
    ['ありがとうございます', 'Cảm ơn', null],
  ],
};

const l = await open('learner', { mobile });
const p = l.page;
await p.goto(`${stack.web}/learn/${ctx}/${lessonId}`);
await p.waitForLoadState('load').catch(() => {});
await p.waitForTimeout(2500);
console.log('LESSON OPEN:', await lines(p, 40));
await shot(p, 'C4-lesson-open', dev, lang);

// reading
if (await p.locator('#startReadingBtn').count()) {
  await p.click('#startReadingBtn');
  await p.waitForSelector('#completeReadingBtn', { timeout: 15000 });
  await p.waitForTimeout(800);
}
const reading = await p.locator('#lessonContentContainer').innerText().catch(() => p.locator('body').innerText());
console.log('READING TEXT:', reading.replace(/\n+/g, ' | ').slice(0, 3000));
console.log('MOJIBAKE:', /Ã|â€|ï¿½|�/.test(reading) ? 'FOUND' : 'none');
console.log('overflow reading:', await overflow(p));
await shot(p, 'C4-reading', dev, lang);
if (await p.locator('#completeReadingBtn').count()) {
  await p.click('#completeReadingBtn');
  await p.waitForTimeout(1500);
}

// practice
if (await p.locator('#startPracticeBtn').count()) await p.click('#startPracticeBtn');
await p.waitForSelector('#submitResponseBtn', { timeout: 20000 });
for (let i = 0; i < 16; i++) {
  if (!(await p.locator('#activeExerciseCard').count())) break;
  const type = await p.getAttribute('#activeExerciseCard', 'data-exercise-type');
  const label = (await p.locator('#queueProgressLabel').innerText()).replace(/\n+/g, ' ');
  const promptText = await p.locator('.practice-question').first().innerText();
  const isRetry = /Làm lại câu sai/.test(label);
  const row = PLAN[lang].find(([m]) => promptText.includes(m));
  if (!row) { console.log('!! no plan for prompt:', promptText); break; }
  const answer = isRetry && row[2] != null ? row[2] : row[1];
  console.log(`\n--- [${i}] ${label} | ${type} | ${promptText.slice(0, 60)} -> ${JSON.stringify(answer)}`);
  if (type === 'MCQ' || type === 'LISTENING') {
    const opts = await p.$$eval('input[id^=practice-]', (els) => els.map((e) => ({ id: e.id, label: e.closest('label')?.innerText.replace(/\n+/g, ' ').trim() })));
    console.log('   options:', JSON.stringify(opts));
    const pick = opts.find((o) => (o.label || '').includes(answer));
    await p.locator(`#${pick.id.replace(/([:.])/g, '\\$1')}`).click({ force: true });
  } else if (type === 'FILL_BLANK') {
    await p.fill('#fillBlankInput', answer);
  } else if (type === 'GRAMMAR') {
    await p.fill('#grammarInput', answer);
  } else if (type === 'REORDER') {
    const toks = await p.$$eval('button[id^=tokenBtn-]', (els) => els.map((e) => ({ id: e.id, text: e.innerText.trim() })));
    console.log('   tokens shown (shuffled):', JSON.stringify(toks.map((t) => t.text)));
    for (const want of answer) {
      const t = toks.find((x) => x.text === want);
      await p.locator(`#${t.id}`).click();
    }
    console.log('   placed:', await p.$$eval('button[id^=selectedToken-]', (els) => els.map((e) => e.innerText.replace(' ✕', '').trim())));
    console.log('   answer line (as shown):', (await p.locator('.practice-answer-line').innerText()).replace(/\n/g, '').replace(/ ✕/g, ''));
  }
  if (i < 2 || isRetry) await shot(p, `C5-ex${i}-${type}${isRetry ? '-retry' : ''}`, dev, lang);
  await p.click('#submitResponseBtn');
  await p.waitForSelector('#formativeFeedback', { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(900);
  const fb = await p.locator('#formativeFeedback').innerText().catch(() => '(no feedback box)');
  console.log('   FEEDBACK:', fb.replace(/\n+/g, ' | '));
  if (/Chưa chính xác/.test(fb)) await shot(p, `C5-ex${i}-${type}-wrong${isRetry ? '-retry' : ''}`, dev, lang);
  if (await p.locator('#finalizePracticeBtn').count()) break;
}

// finalize
await p.waitForSelector('#finalizePracticeBtn:not([disabled])', { timeout: 20000 }).catch(() => console.log('no finalize button'));
await shot(p, 'C6-ready-to-finish', dev, lang);
await p.click('#finalizePracticeBtn');
await p.waitForSelector('#practiceCelebrationBox', { timeout: 20000 });
await p.waitForTimeout(1200);
const box = await p.locator('#practiceCelebrationBox').innerText();
console.log('\nRESULT SCREEN:', box.replace(/\n+/g, ' | '));
console.log('MOJIBAKE result:', /Ã|â€|ï¿½|�/.test(box) ? 'FOUND' : 'none');
console.log('overflow result:', await overflow(p));
await shot(p, 'C7-result', dev, lang);
const review = await p.locator('#practiceFeedbackReview').innerText().catch(() => '(none)');
console.log('REVIEW ENTRIES:', review.replace(/\n+/g, ' | '));
await shot(p, 'C7-result-review', dev, lang);
console.log('console errors:', l.errors);
await l.browser.close();
