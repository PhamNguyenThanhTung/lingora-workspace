// R3 lesson content (authored for this acceptance round) + a filler that drives the
// teacher lesson editor UI. French uses é è à ç and the typographic apostrophe ’;
// Japanese uses kana/kanji, full-width punctuation 。「」 and readings in the phonetic field.

export const FR = {
  lang: 'fr',
  titleVi: 'Bài 1: Chào hỏi và giới thiệu bản thân',
  titleEn: 'Lesson 1: Greetings and introducing yourself',
  changeSummary: 'Bài mới tiếng Pháp A1: chào hỏi và giới thiệu bản thân',
  paragraphs: [
    'Trong tiếng Pháp, lời chào thay đổi theo thời điểm trong ngày và mức độ thân mật. « Bonjour » dùng từ sáng đến chiều, « Bonsoir » dùng vào buổi tối, còn « Salut » chỉ dùng với bạn bè thân thiết.',
    'Để giới thiệu tên, người Pháp nói « Je m’appelle Élodie » (Tôi tên là Élodie). Khi hỏi tên người khác một cách lịch sự, ta nói « Comment vous appelez-vous ? ». Chú ý tiếng Pháp có một dấu cách trước dấu hỏi.',
    'Hội thoại: — Bonjour ! Je m’appelle Élodie. Comment allez-vous ? — Très bien, merci. Et vous ? — Ça va, merci. À bientôt ! Hãy để ý các dấu: é (accent aigu), è (accent grave), à (accent grave) và ç (cédille) trong « ça ».',
  ],
  vocab: [
    { w: 'bonjour', sense: 'greeting-day', vi: 'xin chào (ban ngày)', en: 'hello, good day', ph: '/bɔ̃.ʒuʁ/', pos: 'interjection', ex: 'Bonjour ! Je m’appelle Élodie.' },
    { w: 'je m’appelle', sense: 'introduce-name', vi: 'tôi tên là', en: 'my name is', ph: '/ʒə ma.pɛl/', pos: 'locution', ex: 'Je m’appelle Élodie.' },
    { w: 'merci', sense: 'thanks', vi: 'cảm ơn', en: 'thank you', ph: '/mɛʁ.si/', pos: 'interjection', ex: 'Très bien, merci !' },
    { w: 'ça va', sense: 'wellbeing', vi: 'ổn, khỏe', en: 'I am fine / how are you', ph: '/sa va/', pos: 'locution', ex: 'Ça va, merci.' },
    { w: 'à bientôt', sense: 'farewell-soon', vi: 'hẹn gặp lại', en: 'see you soon', ph: '/a bjɛ̃.to/', pos: 'locution', ex: 'À bientôt, madame !' },
  ],
  exercises: [
    { type: 'MCQ', prompt: 'Trong hội thoại, Élodie mở đầu bằng lời chào nào?', options: ['Bonsoir', 'Bonjour', 'Salut'], correct: 1, expl: '« Bonjour » dùng từ sáng đến chiều; « Bonsoir » dành cho buổi tối.' },
    { type: 'FILL_BLANK', prompt: 'Điền từ còn thiếu (chú ý dấu): Buổi sáng tôi uống một ly cà phê.', sentence: 'Je bois un ____ au petit déjeuner.', answers: 'café', expl: '« café » viết với dấu sắc (accent aigu) trên chữ e: café.' },
    { type: 'REORDER', prompt: 'Sắp xếp thành câu: Tôi tên là Élodie.', tokens: ['Je', 'm’appelle', 'Élodie'], expl: 'Cấu trúc: Je + m’appelle + tên.' },
    { type: 'GRAMMAR', prompt: 'Viết câu hỏi lịch sự « Bạn có khỏe không? » bằng tiếng Pháp (dùng vous).', src: 'vous', pattern: 'Comment + allez + vous ?', answers: 'Comment allez-vous ?', expl: 'Thể lịch sự: Comment allez-vous ? (có dấu cách trước dấu hỏi).' },
    { type: 'LISTENING', prompt: 'Nghe đoạn ghi âm và chọn lời chào bạn nghe được.', audio: 'https://cdn.lingora.test/audio/fr-a1-u1-bonjour.mp3', transcript: 'Bonjour ! Je m’appelle Élodie. Comment allez-vous ?', options: ['Bonjour', 'Bonsoir', 'Salut'], correct: 0, expl: 'Đoạn ghi âm mở đầu bằng « Bonjour ! ».' },
    { type: 'MCQ', prompt: '« Ça va » nghĩa là gì?', options: ['Cảm ơn', 'Ổn, khỏe', 'Hẹn gặp lại'], correct: 1, expl: '« Ça va » = ổn/khỏe; « merci » = cảm ơn; « à bientôt » = hẹn gặp lại.' },
  ],
};

export const JA = {
  lang: 'ja',
  titleVi: 'Bài 1: Chào hỏi và tự giới thiệu',
  titleEn: 'Lesson 1: Greetings and self-introduction',
  changeSummary: 'Bài mới tiếng Nhật N5: chào hỏi và tự giới thiệu',
  paragraphs: [
    'Tiếng Nhật phân biệt lời chào theo thời điểm: おはようございます dùng vào buổi sáng, こんにちは dùng buổi trưa và chiều, こんばんは dùng buổi tối. Câu tiếng Nhật không có dấu cách giữa các từ và kết thúc bằng dấu 。',
    'Khi tự giới thiệu, người Nhật nói: わたしは田中です。(Tôi là Tanaka.) Trợ từ は trong câu chủ đề đọc là「わ」. Sau khi giới thiệu tên, người ta thường thêm よろしくおねがいします。để tỏ ý mong được giúp đỡ.',
    'Hội thoại: A「はじめまして。わたしは田中（たなか）です。」B「はじめまして。リンです。よろしくおねがいします。」A「こちらこそ、よろしくおねがいします。」Hãy để ý dấu 、và 。cùng cặp ngoặc kép「」của tiếng Nhật.',
  ],
  vocab: [
    { w: 'こんにちは', sense: 'greeting-day', vi: 'xin chào (trưa, chiều)', en: 'hello (daytime)', ph: 'konnichiwa', pos: 'thán từ', ex: 'こんにちは、田中さん。' },
    { w: 'おはようございます', sense: 'greeting-morning', vi: 'chào buổi sáng', en: 'good morning (polite)', ph: 'ohayō gozaimasu', pos: 'thán từ', ex: '先生、おはようございます。' },
    { w: 'ありがとうございます', sense: 'thanks-polite', vi: 'cảm ơn (lịch sự)', en: 'thank you (polite)', ph: 'arigatō gozaimasu', pos: 'thán từ', ex: 'ありがとうございます。' },
    { w: '学生', sense: 'student', vi: 'học sinh, sinh viên', en: 'student', ph: 'がくせい / gakusei', pos: 'danh từ', ex: 'わたしは学生です。' },
    { w: 'はじめまして', sense: 'first-meeting', vi: 'rất vui được gặp bạn (lần đầu)', en: 'nice to meet you', ph: 'hajimemashite', pos: 'thán từ', ex: 'はじめまして。リンです。' },
  ],
  exercises: [
    { type: 'MCQ', prompt: 'Buổi sáng người Nhật chào nhau bằng câu nào?', options: ['おはようございます', 'こんばんは', 'さようなら'], correct: 0, expl: 'おはようございます dùng vào buổi sáng; こんばんは dùng buổi tối.' },
    { type: 'FILL_BLANK', prompt: 'Điền từ còn thiếu: Tôi là học sinh.', sentence: 'わたしは____です。', answers: '学生\nがくせい', expl: '学生（がくせい）nghĩa là học sinh/sinh viên. Có thể viết kanji hoặc kana.' },
    { type: 'REORDER', prompt: 'Sắp xếp thành câu: Tôi là Tanaka.', tokens: ['わたしは', '田中', 'です'], expl: 'Cấu trúc: 「わたしは」+ tên +「です」. Tiếng Nhật viết liền, không có dấu cách.' },
    { type: 'GRAMMAR', prompt: 'Viết câu tự giới thiệu: Tôi là Tanaka (theo mẫu わたしは〜です。).', src: '田中', pattern: 'わたしは〜です。', answers: 'わたしは田中です。', expl: 'わたしは田中です。— viết liền, không chèn dấu cách.' },
    { type: 'LISTENING', prompt: 'Nghe đoạn ghi âm và chọn câu chào bạn nghe được.', audio: 'https://cdn.lingora.test/audio/ja-n5-u1-aisatsu.mp3', transcript: 'はじめまして。わたしは田中です。よろしくおねがいします。', options: ['はじめまして', 'さようなら', 'おやすみなさい'], correct: 0, expl: 'Đoạn ghi âm mở đầu bằng はじめまして。' },
    { type: 'MCQ', prompt: '「ありがとうございます」nghĩa là gì?', options: ['Xin chào', 'Cảm ơn', 'Xin lỗi'], correct: 1, expl: 'ありがとうございます = cảm ơn (lịch sự).' },
  ],
};

export async function fillLesson(page, L, log = console.log) {
  await page.fill('#inputDraftTitleVi', L.titleVi);
  await page.fill('#inputDraftTitleEn', L.titleEn);
  for (let i = 0; i < L.paragraphs.length; i++) {
    await page.click('#btnAddParagraph');
    await page.fill(`#inputParagraph-${i}`, L.paragraphs[i]);
  }
  for (const v of L.vocab) {
    await page.click('#btnAddVocabulary');
    await page.click('#tabVocabCreate');
    await page.fill('#inputVocabCanonical', v.w);
    await page.fill('#inputVocabSenseKey', v.sense);
    await page.fill('#inputVocabMeaningVi', v.vi);
    await page.fill('#inputVocabMeaningEn', v.en);
    await page.fill('#inputVocabPhonetic', v.ph);
    await page.fill('#inputVocabPartOfSpeech', v.pos);
    await page.fill('#inputVocabExample', v.ex);
    await page.click('#btnSaveVocabModal');
    await page.waitForSelector('#vocabModalBackdrop', { state: 'detached', timeout: 6000 }).catch(async () => {
      log(`[vocab ${v.w}] MODAL STAYED OPEN: ` + (await page.locator('#vocabModalBackdrop').innerText()).replace(/\n+/g, ' | ').slice(-300));
      await page.click('#btnCancelVocabModal');
    });
  }
  for (const e of L.exercises) {
    await page.click('#btnAddExercise');
    await page.selectOption('#selectExerciseType', e.type);
    await page.fill('#inputExercisePrompt', e.prompt);
    if (e.type === 'MCQ' || e.type === 'LISTENING') {
      const pre = e.type === 'MCQ' ? 'Mcq' : 'Listening';
      if (e.type === 'LISTENING') {
        await page.fill('#inputListeningAudioUrl', e.audio);
        await page.fill('#inputListeningTranscript', e.transcript);
      }
      for (let i = 0; i < e.options.length; i++) {
        if (!(await page.locator(`#input${pre}OptionText-${i}`).count())) await page.click(`#btnAdd${pre}Option`);
        await page.fill(`#input${pre}OptionText-${i}`, e.options[i]);
      }
      await page.check(`#radio${pre}CorrectOption-${e.correct}`);
    } else if (e.type === 'FILL_BLANK') {
      await page.fill('#inputFillBlankSentence', e.sentence);
      await page.fill('#inputFillBlankAnswers', e.answers);
    } else if (e.type === 'REORDER') {
      for (let i = 0; i < e.tokens.length; i++) {
        if (!(await page.locator(`#inputReorderToken-${i}`).count())) await page.click('#btnAddReorderToken');
        await page.fill(`#inputReorderToken-${i}`, e.tokens[i]);
      }
    } else if (e.type === 'GRAMMAR') {
      await page.fill('#inputGrammarSourceSentence', e.src);
      await page.fill('#inputGrammarTargetPattern', e.pattern);
      await page.fill('#inputGrammarAnswers', e.answers);
    }
    await page.fill('#inputExerciseExplanation', e.expl);
    await page.click('#btnSaveExerciseModal');
    await page.waitForSelector('#exerciseModalBackdrop', { state: 'detached', timeout: 6000 }).catch(async () => {
      log(`[ex ${e.type}] MODAL STAYED OPEN: ` + (await page.locator('#exerciseModalBackdrop').innerText()).replace(/\n+/g, ' | ').slice(-400));
      await page.click('#btnCancelExerciseModal');
    });
  }
}
