import { open, stack, shot, text } from './lib.mjs';
export const LESSON = {
  titleVi: 'Bài 4: Gia đình của bạn', titleEn: 'Lesson 4: Your Family',
  paragraphs: [
    'Sau khi biết cách giới thiệu bản thân, bạn sẽ muốn nói về gia đình. Trong bài này ta học các từ chỉ thành viên gia đình và cấu trúc "I have + số lượng + danh từ".',
    "Các từ cần nhớ: 'mother' (mẹ), 'father' (bố), 'brother' (anh/em trai), 'sister' (chị/em gái), 'family' (gia đình).",
    "Hội thoại: Nam: Do you have any brothers or sisters? Anna: Yes, I have one brother and one sister. My mother is a teacher and my father is a doctor. Nam: I have a small family. I have a mother, a father and a sister.",
  ],
  vocab: [
    { w: 'family', vi: 'gia đình', en: 'a group of related people', ph: '/ˈfæməli/', pos: 'noun', ex: 'I love my family.' },
    { w: 'mother', vi: 'mẹ', en: 'a female parent', ph: '/ˈmʌðər/', pos: 'noun', ex: 'My mother is a teacher.' },
    { w: 'father', vi: 'bố', en: 'a male parent', ph: '/ˈfɑːðər/', pos: 'noun', ex: 'My father is a doctor.' },
    { w: 'brother', vi: 'anh/em trai', en: 'a male sibling', ph: '/ˈbrʌðər/', pos: 'noun', ex: 'I have one brother.' },
    { w: 'sister', vi: 'chị/em gái', en: 'a female sibling', ph: '/ˈsɪstər/', pos: 'noun', ex: 'I have one sister.' },
  ],
  exercises: [
    { type: 'MCQ', prompt: 'Trong hội thoại, Anna có mấy người anh/chị/em?', options: ['Không có', 'Hai người: một anh/em trai và một chị/em gái', 'Ba người'], correct: 1, expl: "Anna nói: 'I have one brother and one sister' — một anh/em trai và một chị/em gái." },
    { type: 'FILL_BLANK', prompt: 'Điền từ còn thiếu: Bố của Anna là bác sĩ.', sentence: 'My ____ is a doctor.', answers: 'father', expl: "'father' nghĩa là bố; Anna nói 'my father is a doctor'." },
    { type: 'REORDER', prompt: 'Sắp xếp các từ thành câu: Tôi có một người em gái.', tokens: ['I', 'have', 'one', 'sister'], expl: "Cấu trúc: I have + số lượng + danh từ." },
    { type: 'GRAMMAR', prompt: 'Viết câu: Tôi có một người anh/em trai (theo mẫu I have ...).', src: 'one brother', pattern: 'I have + one + noun', answers: 'I have one brother', expl: "Dùng 'I have' + số lượng + danh từ." },
    { type: 'MCQ', prompt: "Từ 'mother' có nghĩa là gì?", options: ['Bố', 'Mẹ', 'Chị gái'], correct: 1, expl: "'mother' = mẹ; 'father' = bố." },
    { type: 'FILL_BLANK', prompt: 'Điền từ: Tôi có một gia đình nhỏ.', sentence: 'I have a small ____.', answers: 'family', expl: "'family' = gia đình." },
  ],
};
export async function fillLesson(page, L = LESSON) {
  await page.fill('#inputDraftTitleVi', L.titleVi); await page.fill('#inputDraftTitleEn', L.titleEn);
  for (let i = 0; i < L.paragraphs.length; i++) {
    await page.click('#btnAddParagraph'); await page.fill(`#inputParagraph-${i}`, L.paragraphs[i]);
  }
  for (const v of L.vocab) {
    await page.click('#btnAddVocabulary'); await page.click('#tabVocabCreate');
    await page.fill('#inputVocabCanonical', v.w); await page.fill('#inputVocabMeaningVi', v.vi); await page.fill('#inputVocabMeaningEn', v.en);
    await page.fill('#inputVocabPhonetic', v.ph); await page.fill('#inputVocabPartOfSpeech', v.pos); await page.fill('#inputVocabExample', v.ex);
    await page.click('#btnSaveVocabModal'); await page.waitForSelector('#vocabModalBackdrop', { state: 'detached' }).catch(() => {});
  }
  for (const e of L.exercises) {
    await page.click('#btnAddExercise'); await page.selectOption('#selectExerciseType', e.type);
    await page.check('#inputExerciseIsCore').catch(() => {});
    await page.fill('#inputExercisePrompt', e.prompt);
    if (e.type === 'MCQ') {
      for (let i = 0; i < e.options.length; i++) {
        if (!(await page.locator(`#inputMcqOptionText-${i}`).count())) await page.click('#btnAddMcqOption');
        await page.fill(`#inputMcqOptionText-${i}`, e.options[i]);
      }
      await page.check(`#radioMcqCorrectOption-${e.correct}`);
    } else if (e.type === 'FILL_BLANK') { await page.fill('#inputFillBlankSentence', e.sentence); await page.fill('#inputFillBlankAnswers', e.answers); }
    else if (e.type === 'REORDER') {
      const btn = page.locator('#exerciseModalBackdrop').getByRole('button', { name: '+ Thêm từ', exact: true });
      for (let i = 0; i < e.tokens.length; i++) {
        if (!(await page.locator(`#inputReorderToken-${i}`).count())) await btn.first().click();
        await page.fill(`#inputReorderToken-${i}`, e.tokens[i]);
      }
    } else if (e.type === 'GRAMMAR') { await page.fill('#inputGrammarSourceSentence', e.src); await page.fill('#inputGrammarTargetPattern', e.pattern); await page.fill('#inputGrammarAnswers', e.answers); }
    await page.fill('#inputExerciseExplanation', e.expl);
    await page.click('#btnSaveExerciseModal');
    await page.waitForSelector('#exerciseModalBackdrop', { state: 'detached', timeout: 4000 }).catch(async () => { console.log('MODAL STAYED OPEN after exercise', e.type, '\n' + (await page.locator('#exerciseModalBackdrop').innerText()).slice(-400)); });
    if (await page.locator('#exerciseModalBackdrop').count()) { await shot(page, `A5-stuck-${e.type}`, 'desktop'); await page.click('#btnCancelExerciseModal'); }
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const { browser, page, errors } = await open('teacher');
  await page.goto(`${stack.admin}/my-lessons/${stack.authoringLessonId}`); await page.waitForLoadState('networkidle');
  await fillLesson(page);
  await shot(page, 'A5-filled-before-save', 'desktop');
  await page.click('#btnSaveDraft'); await page.waitForTimeout(1500);
  const msg = await page.locator('[role=alert], [role=status], .alert, .banner, .toast').allInnerTexts();
  console.log('after save messages:', msg);
  await shot(page, 'A3-after-save', 'desktop');
  await page.reload(); await page.waitForLoadState('networkidle');
  console.log('reload -> titles:', await page.inputValue('#inputDraftTitleVi'), '|', await page.inputValue('#inputDraftTitleEn'));
  console.log('paragraph count:', await page.locator('[id^=inputParagraph-]').count());
  console.log((await text(page)).match(/Tổng số: .*/g));
  await shot(page, 'A8-after-reload', 'desktop');
  console.log('errors', errors); await browser.close();
}
