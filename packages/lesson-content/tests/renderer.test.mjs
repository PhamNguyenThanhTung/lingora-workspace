import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LessonContent } from '../src/LessonContent.ts';
import {
  formatPhonetic,
  formatReading,
  formatReorderTokens,
  getBaseLanguageCode,
  isNoSpaceLanguage,
  isValidJapaneseReading,
  isValidRomanization,
  joinTokensByLanguage,
  normalizeLanguageCode,
  resolveContentLang,
  toLessonPresentationDto,
} from '../src/index.ts';

const h = React.createElement;

test('T06: LessonContent renderer - Null, undefined, and empty presentation resilience', () => {
  // Gracefully handles null / undefined presentation without crashing
  const nullHtml = renderToStaticMarkup(h(LessonContent, { presentation: null }));
  assert.ok(nullHtml.includes('lingora-lesson-content'));
  assert.ok(nullHtml.includes('id="contentBlocksSection"'));

  const emptyHtml = renderToStaticMarkup(h(LessonContent, { presentation: {} }));
  assert.ok(emptyHtml.includes('lingora-lesson-content'));

  const emptyPres = toLessonPresentationDto([]);
  const dtoHtml = renderToStaticMarkup(h(LessonContent, { presentation: emptyPres }));
  assert.ok(dtoHtml.includes('lingora-lesson-content'));
});

test('T06: LessonContent renderer - All 9 Canonical Block Types', async (t) => {
  await t.test('HEADING: renders h2, h3, h4 with correct level and typography classes', () => {
    const presentation = {
      contentSchemaVersion: 1,
      blocks: [
        {
          blockKey: 'h-1',
          type: 'HEADING',
          position: 1,
          schemaVersion: 1,
          content: { level: 2, text: 'Tiêu đề chính cấp 2' },
        },
        {
          blockKey: 'h-2',
          type: 'HEADING',
          position: 2,
          schemaVersion: 1,
          content: { level: 3, text: 'Tiêu đề phụ cấp 3' },
        },
        {
          blockKey: 'h-3',
          type: 'HEADING',
          position: 3,
          schemaVersion: 1,
          content: { level: 4, text: 'Tiêu đề nhỏ cấp 4' },
        },
        {
          blockKey: 'h-default',
          type: 'HEADING',
          position: 4,
          schemaVersion: 1,
          content: { level: undefined, text: 'Tiêu đề mặc định' },
        },
      ],
      vocabulary: [],
      exercises: [],
    };

    const html = renderToStaticMarkup(h(LessonContent, { presentation }));
    assert.ok(html.includes('<h2 class="lingora-block lingora-block-heading lingora-block-heading-h2"'));
    assert.ok(html.includes('Tiêu đề chính cấp 2</h2>'));
    assert.ok(html.includes('<h3 class="lingora-block lingora-block-heading lingora-block-heading-h3"'));
    assert.ok(html.includes('Tiêu đề phụ cấp 3</h3>'));
    assert.ok(html.includes('<h4 class="lingora-block lingora-block-heading lingora-block-heading-h4"'));
    assert.ok(html.includes('Tiêu đề nhỏ cấp 4</h4>'));
    // Level undefined falls back to h2
    assert.ok(html.includes('Tiêu đề mặc định</h2>'));
  });

  await t.test('TEXT: renders rich text nodes with bold, italic, underline, safe link and lists', () => {
    const presentation = {
      contentSchemaVersion: 1,
      blocks: [
        {
          blockKey: 'txt-1',
          type: 'TEXT',
          position: 1,
          schemaVersion: 1,
          content: {
            nodes: [
              {
                type: 'paragraph',
                runs: [
                  { text: 'Chữ thường, ' },
                  { text: 'chữ đậm', bold: true },
                  { text: ', chữ nghiêng', italic: true },
                  { text: ', chữ gạch chân', underline: true },
                  {
                    text: ', liên kết an toàn',
                    link: { url: 'https://lingora.edu.vn/guide', title: 'Hướng dẫn' },
                  },
                  {
                    text: ', liên kết không an toàn bị chặn',
                    link: { url: 'javascript:alert(1)' },
                  },
                ],
              },
              {
                type: 'list',
                style: 'bullet',
                items: [
                  { runs: [{ text: 'Mục danh sách 1' }] },
                  { runs: [{ text: 'Mục danh sách 2' }] },
                ],
              },
              {
                type: 'list',
                style: 'ordered',
                items: [
                  { runs: [{ text: 'Bước một' }] },
                  { runs: [{ text: 'Bước hai' }] },
                ],
              },
            ],
          },
        },
      ],
      vocabulary: [],
      exercises: [],
    };

    const html = renderToStaticMarkup(h(LessonContent, { presentation }));
    assert.ok(html.includes('<strong>chữ đậm</strong>'));
    assert.ok(html.includes('<em>, chữ nghiêng</em>'));
    assert.ok(html.includes('<u>, chữ gạch chân</u>'));
    assert.ok(html.includes('<a href="https://lingora.edu.vn/guide" title="Hướng dẫn" target="_blank" rel="noopener noreferrer"'));
    assert.ok(!html.includes('javascript:alert(1)'));
    assert.ok(html.includes('<ul class="lingora-block-list"'));
    assert.ok(html.includes('Mục danh sách 1</li>'));
    assert.ok(html.includes('<ol class="lingora-block-list"'));
    assert.ok(html.includes('Bước một</li>'));
  });

  await t.test('EXAMPLE: renders example sentence with translation', () => {
    const presentation = {
      contentSchemaVersion: 1,
      blocks: [
        {
          blockKey: 'ex-1',
          type: 'EXAMPLE',
          position: 1,
          schemaVersion: 1,
          content: {
            text: 'I have been studying English for three years.',
            translation: 'Tôi đã học tiếng Anh được ba năm.',
          },
        },
      ],
      vocabulary: [],
      exercises: [],
    };

    const html = renderToStaticMarkup(h(LessonContent, { presentation }));
    assert.ok(html.includes('lingora-block-example'));
    assert.ok(html.includes('I have been studying English for three years.'));
    assert.ok(html.includes('Tôi đã học tiếng Anh được ba năm.'));
  });

  await t.test('DIALOGUE: renders turns with speaker, text, and translation', () => {
    const presentation = {
      contentSchemaVersion: 1,
      blocks: [
        {
          blockKey: 'dia-1',
          type: 'DIALOGUE',
          position: 1,
          schemaVersion: 1,
          content: {
            lines: [
              { speaker: 'Alice', text: 'Hello, how are you?', translation: 'Xin chào, bạn khỏe không?' },
              { speaker: 'Bob', text: "I'm doing well, thank you!", translation: 'Tôi khỏe, cảm ơn bạn!' },
            ],
          },
        },
      ],
      vocabulary: [],
      exercises: [],
    };

    const html = renderToStaticMarkup(h(LessonContent, { presentation }));
    assert.ok(html.includes('lingora-block-dialogue'));
    assert.ok(html.includes('Alice:'));
    assert.ok(html.includes('Hello, how are you?'));
    assert.ok(html.includes('(Xin chào, bạn khỏe không?)'));
    assert.ok(html.includes('Bob:'));
    assert.ok(html.includes("I&#x27;m doing well, thank you!"));
  });

  await t.test('CALLOUT: renders tone styling (info, tip, warning, caution, important) and body', () => {
    const presentation = {
      contentSchemaVersion: 1,
      blocks: [
        {
          blockKey: 'callout-info',
          type: 'CALLOUT',
          position: 1,
          schemaVersion: 1,
          content: {
            tone: 'info',
            title: 'Lưu ý quan trọng',
            document: {
              nodes: [{ type: 'paragraph', runs: [{ text: 'Nội dung thông tin lưu ý.' }] }],
            },
          },
        },
        {
          blockKey: 'callout-tip',
          type: 'CALLOUT',
          position: 2,
          schemaVersion: 1,
          content: {
            tone: 'tip',
            title: 'Mẹo phát âm',
            document: {
              nodes: [{ type: 'paragraph', runs: [{ text: 'Mẹo nhỏ giúp phát âm chuẩn.' }] }],
            },
          },
        },
        {
          blockKey: 'callout-warn',
          type: 'CALLOUT',
          position: 3,
          schemaVersion: 1,
          content: {
            tone: 'warning',
            title: 'Cảnh báo',
            document: {
              nodes: [{ type: 'paragraph', runs: [{ text: 'Tránh dùng cấu trúc này.' }] }],
            },
          },
        },
      ],
      vocabulary: [],
      exercises: [],
    };

    const html = renderToStaticMarkup(h(LessonContent, { presentation }));
    assert.ok(html.includes('lingora-callout-info'));
    assert.ok(html.includes('Lưu ý quan trọng'));
    assert.ok(html.includes('Nội dung thông tin lưu ý.'));
    assert.ok(html.includes('lingora-callout-tip'));
    assert.ok(html.includes('Mẹo phát âm'));
    assert.ok(html.includes('lingora-callout-warning'));
    assert.ok(html.includes('Cảnh báo'));
  });

  await t.test('MEDIA: renders audio player and caption', () => {
    const presentation = {
      contentSchemaVersion: 1,
      blocks: [
        {
          blockKey: 'media-1',
          type: 'MEDIA',
          position: 1,
          schemaVersion: 1,
          content: {
            kind: 'audio',
            url: 'https://cdn.lingora.edu.vn/audio/unit1-lesson1.mp3',
            caption: 'Đoạn hội thoại mẫu bài 1',
          },
        },
      ],
      vocabulary: [],
      exercises: [],
    };

    const html = renderToStaticMarkup(h(LessonContent, { presentation }));
    assert.ok(html.includes('lingora-block-media'));
    assert.ok(html.includes('<audio controls="" src="https://cdn.lingora.edu.vn/audio/unit1-lesson1.mp3"'));
    assert.ok(html.includes('Đoạn hội thoại mẫu bài 1</figcaption>'));
  });

  await t.test('DIVIDER: renders hr line', () => {
    const presentation = {
      contentSchemaVersion: 1,
      blocks: [
        {
          blockKey: 'div-1',
          type: 'DIVIDER',
          position: 1,
          schemaVersion: 1,
          content: {},
        },
      ],
      vocabulary: [],
      exercises: [],
    };

    const html = renderToStaticMarkup(h(LessonContent, { presentation }));
    assert.ok(html.includes('<hr class="lingora-block lingora-block-divider"'));
  });

  await t.test('GRAMMAR: renders title, explanation, and examples', () => {
    const presentation = {
      contentSchemaVersion: 1,
      blocks: [
        {
          blockKey: 'gram-1',
          type: 'GRAMMAR',
          position: 1,
          schemaVersion: 1,
          content: {
            title: 'Hiện tại hoàn thành (Present Perfect)',
            explanation: 'Dùng để diễn tả một hành động đã xảy ra trong quá khứ và còn liên hệ tới hiện tại.',
            examples: [
              {
                text: 'She has visited Paris twice.',
                translation: 'Cô ấy đã từng đến Paris hai lần.',
                explanation: 'Diễn tả trải nghiệm.',
              },
            ],
          },
        },
      ],
      vocabulary: [],
      exercises: [],
    };

    const html = renderToStaticMarkup(h(LessonContent, { presentation }));
    assert.ok(html.includes('lingora-block-grammar'));
    assert.ok(html.includes('Hiện tại hoàn thành (Present Perfect)</h4>'));
    assert.ok(html.includes('Dùng để diễn tả một hành động đã xảy ra'));
    assert.ok(html.includes('She has visited Paris twice.'));
    assert.ok(html.includes('Cô ấy đã từng đến Paris hai lần.'));
    assert.ok(html.includes('(Diễn tả trải nghiệm.)'));
  });

  await t.test('VOCABULARY block: renders vocabulary directly at block position', () => {
    const vocabList = [
      {
        id: 'v-1',
        position: 1,
        isCore: true,
        displaySnapshot: {
          canonicalForm: 'ubiquitous',
          phonetic: 'juːˈbɪk.wə.təs',
          partOfSpeech: 'adj',
          meaningLabels: { vi: 'phổ biến khắp nơi', en: 'present everywhere' },
          example: 'Smartphones are ubiquitous today.',
          characters: [
            { characterId: 'b0000000-0000-4000-8000-000000000002', position: 2, glyph: '本', scriptType: 'KANJI', primaryReading: 'ほん', meaning: 'sách' },
            { characterId: 'b0000000-0000-4000-8000-000000000001', position: 1, glyph: '日', scriptType: 'KANJI', primaryReading: 'にち', meaning: 'ngày' },
          ],
        },
      },
    ];

    const presentation = {
      contentSchemaVersion: 1,
      blocks: [
        {
          blockKey: 'h-1',
          type: 'HEADING',
          position: 1,
          schemaVersion: 1,
          content: { level: 2, text: 'Bài học từ vựng' },
        },
        {
          blockKey: 'voc-block',
          type: 'VOCABULARY',
          position: 2,
          schemaVersion: 1,
          content: { selection: 'lesson' },
        },
      ],
      vocabulary: vocabList,
      exercises: [],
    };

    const html = renderToStaticMarkup(h(LessonContent, { presentation }));
    assert.ok(html.includes('id="vocabularySection"'));
    assert.ok(html.includes('Từ vựng bài học (1)'));
    assert.ok(html.includes('ubiquitous'));
    assert.ok(html.includes('/juːˈbɪk.wə.təs/'));
    assert.ok(html.includes('(adj)'));
    assert.ok(html.includes('phổ biến khắp nơi'));
    assert.ok(html.includes('Smartphones are ubiquitous today.'));
    assert.ok(html.includes('vocab-character-breakdown'));
    assert.ok(html.includes('日'));
    assert.ok(html.includes('本'));
    assert.ok(html.indexOf('日') < html.indexOf('本'));
    // Ensures vocabulary section is NOT rendered twice!
    const occurrences = (html.match(/id="vocabularySection"/g) || []).length;
    assert.equal(occurrences, 1);
  });
});

test('T06: LessonContent renderer - UNSUPPORTED block safe placeholder', () => {
  const presentation = {
    contentSchemaVersion: 1,
    blocks: [
      {
        blockKey: 'unsupp-1',
        type: 'UNSUPPORTED',
        position: 1,
        schemaVersion: 1,
        originalType: 'VIDEO_STREAM',
        message: 'Khối video tương tác chưa được hỗ trợ trên phiên bản hiện tại.',
      },
    ],
    vocabulary: [],
    exercises: [],
  };

  const html = renderToStaticMarkup(h(LessonContent, { presentation }));
  assert.ok(html.includes('lingora-block-unsupported'));
  assert.ok(html.includes('[Khối nội dung không hỗ trợ: VIDEO_STREAM]'));
  assert.ok(html.includes('Khối video tương tác chưa được hỗ trợ'));
});

test('T06: LessonContent renderer - Auto vocabulary at end when no VOCABULARY block', () => {
  const vocabList = [
    {
      id: 'v-auto-1',
      position: 1,
      isCore: true,
      displaySnapshot: {
        canonicalForm: 'persevere',
        phonetic: 'ˌpɜː.sɪˈvɪər',
        partOfSpeech: 'verb',
        meaningLabels: { vi: 'kiên trì, bền chí' },
        example: 'She persevered in her studies.',
      },
    },
  ];

  const presentation = {
    contentSchemaVersion: 1,
    blocks: [
      {
        blockKey: 'p-1',
        type: 'TEXT',
        position: 1,
        schemaVersion: 1,
        content: {
          nodes: [{ type: 'paragraph', runs: [{ text: 'Đoạn văn đọc.' }] }],
        },
      },
    ],
    vocabulary: vocabList,
    exercises: [],
  };

  const html = renderToStaticMarkup(h(LessonContent, { presentation }));
  assert.ok(html.includes('id="vocabularySection"'));
  assert.ok(html.includes('Từ vựng bài học (1)'));
  assert.ok(html.includes('persevere'));
  assert.ok(html.includes('kiên trì, bền chí'));
});

test('T06: LessonContent renderer - Readonly Exercises preview across all 5 types', () => {
  const exercises = [
    {
      id: 'ex-mcq-1',
      itemId: 'it-1',
      itemRevisionId: 'ir-1',
      position: 1,
      isCore: true,
      type: 'MCQ',
      schemaVersion: 1,
      promptData: {
        prompt: 'Chọn từ đồng nghĩa với "happy":',
        options: [
          { id: 'opt-a', text: 'Joyful' },
          { id: 'opt-b', text: 'Sad' },
        ],
      },
    },
    {
      id: 'ex-fill-2',
      itemId: 'it-2',
      itemRevisionId: 'ir-2',
      position: 2,
      isCore: true,
      type: 'FILL_BLANK',
      schemaVersion: 1,
      promptData: {
        prompt: 'Điền từ thích hợp:',
        sentence: 'She ____ to school every morning.',
      },
    },
    {
      id: 'ex-reorder-3',
      itemId: 'it-3',
      itemRevisionId: 'ir-3',
      position: 3,
      isCore: true,
      type: 'REORDER',
      schemaVersion: 1,
      promptData: {
        prompt: 'Sắp xếp lại các từ:',
        tokens: [
          { id: 't-1', text: 'English' },
          { id: 't-2', text: 'is' },
          { id: 't-3', text: 'fun' },
        ],
      },
    },
    {
      id: 'ex-listening-4',
      itemId: 'it-4',
      itemRevisionId: 'ir-4',
      position: 4,
      isCore: true,
      type: 'LISTENING',
      schemaVersion: 1,
      promptData: {
        prompt: 'Nghe đoạn audio sau và chọn đáp án:',
        audioUrl: 'https://cdn.lingora.edu.vn/audio/test.mp3',
        options: [
          { id: 'opt-1', text: 'Morning' },
          { id: 'opt-2', text: 'Evening' },
        ],
      },
    },
    {
      id: 'ex-grammar-5',
      itemId: 'it-5',
      itemRevisionId: 'ir-5',
      position: 5,
      isCore: true,
      type: 'GRAMMAR',
      schemaVersion: 1,
      promptData: {
        prompt: 'Chuyển câu sau sang thể bị động:',
        sourceSentence: 'The teacher praised the student.',
        targetPattern: 'S + was/were + V3/ed + by O',
      },
    },
  ];

  const presentation = {
    contentSchemaVersion: 1,
    blocks: [],
    vocabulary: [],
    exercises,
  };

  const html = renderToStaticMarkup(h(LessonContent, { presentation }));
  assert.ok(html.includes('id="exercisesSection"'));
  assert.ok(html.includes('Bài tập đọc hiểu (5)'));

  // MCQ
  assert.ok(html.includes('Bài tập 1: Trắc nghiệm'));
  assert.ok(html.includes('happy'));
  assert.ok(html.includes('Joyful'));
  assert.ok(html.includes('type="radio" disabled=""'));

  // FILL_BLANK
  assert.ok(html.includes('Bài tập 2: Điền từ'));
  assert.ok(html.includes('She [ ____________ ] to school every morning.'));

  // REORDER
  assert.ok(html.includes('Bài tập 3: Sắp xếp từ'));
  assert.ok(html.includes('English'));
  assert.ok(html.includes('fun'));

  // LISTENING
  assert.ok(html.includes('Bài tập 4: Nghe và chọn'));
  assert.ok(html.includes('https://cdn.lingora.edu.vn/audio/test.mp3'));

  // GRAMMAR
  assert.ok(html.includes('Bài tập 5: Viết câu'));
  assert.ok(html.includes('The teacher praised the student.'));
  assert.ok(html.includes('S + was/were + V3/ed + by O'));

  // Strict check: NO grading secrets, answers, or submit button!
  assert.ok(!html.includes('correctOptionId'));
  assert.ok(!html.includes('gradingData'));
  assert.ok(!html.includes('submit'));
  assert.ok(!html.includes('Nộp bài'));
});

test('T06b: read-only exercise preview does not show REORDER tokens or MCQ options in answer order', () => {
  const words = ['Nice', 'to', 'meet', 'you.'];
  const exercises = [
    {
      id: 'ex-reorder-shuffle', itemId: 'it', itemRevisionId: 'ir', position: 1, isCore: true,
      type: 'REORDER', schemaVersion: 1,
      promptData: { prompt: 'Sắp xếp:', tokens: words.map((text, i) => ({ id: `t${i}`, text })) },
    },
    {
      id: 'ex-mcq-shuffle', itemId: 'it2', itemRevisionId: 'ir2', position: 2, isCore: true,
      type: 'MCQ', schemaVersion: 1,
      promptData: { prompt: 'Chọn:', options: ['Good morning', 'Good night', 'Goodbye'].map((text, i) => ({ id: `o${i}`, text })) },
    },
  ];
  const presentation = { contentSchemaVersion: 1, blocks: [], vocabulary: [], exercises };
  const html = renderToStaticMarkup(h(LessonContent, { presentation }));
  const html2 = renderToStaticMarkup(h(LessonContent, { presentation }));
  assert.equal(html, html2, 'display order must be deterministic across renders');

  const orderOf = (labels) => labels.map((l) => html.indexOf(`>${l}<`));
  const reorderPositions = orderOf(words);
  assert.ok(reorderPositions.every((p) => p >= 0), 'all tokens still rendered');
  assert.notDeepEqual(reorderPositions, [...reorderPositions].sort((a, b) => a - b), 'tokens must not appear in answer order');
  const mcqPositions = orderOf(['Good morning', 'Good night', 'Goodbye']);
  assert.ok(mcqPositions.every((p) => p >= 0), 'all options still rendered');
  assert.notDeepEqual(mcqPositions, [...mcqPositions].sort((a, b) => a - b), 'options must not appear in authored order');
});

test('LNG-01: joinTokensByLanguage and formatReorderTokens join tokens per language without changing content', () => {
  // Japanese & Chinese omit renderer spaces at CJK/kana boundaries and before closing punctuation
  assert.equal(joinTokensByLanguage(['わたしは', '田中', 'です'], 'ja'), 'わたしは田中です');
  assert.equal(joinTokensByLanguage(['わたしは', '田中', 'です', '。'], 'ja-JP'), 'わたしは田中です。');
  assert.equal(joinTokensByLanguage(['「', 'おはよう', '」', 'と', '言った', '。'], 'ja'), '「おはよう」と言った。');
  assert.equal(joinTokensByLanguage(['コーヒー', 'を', 'ください'], 'ja'), 'コーヒーをください');
  assert.equal(joinTokensByLanguage(['日', '々', 'の', '練習'], 'ja-x-lingora-01'), '日々の練習');
  assert.equal(joinTokensByLanguage(['我', '是', '学生', '。'], 'zh-Hans'), '我是学生。');

  // Mixed Latin words inside Japanese sentences preserve spaces between Latin words and internal spaces
  assert.equal(joinTokensByLanguage(['わたしは', 'New', 'York', 'に', '行きます', '。'], 'ja'), 'わたしはNew Yorkに行きます。');
  assert.equal(joinTokensByLanguage(['わたしは', 'New York', 'に', '住んでいます'], 'ja'), 'わたしはNew Yorkに住んでいます');
  assert.equal(joinTokensByLanguage(['Mr.', 'Tanaka', 'です'], 'ja'), 'Mr. Tanakaです');

  // English & French preserve word spacing and original casing/punctuation
  assert.equal(joinTokensByLanguage(['What', 'is', 'your', 'name?'], 'en'), 'What is your name?');
  assert.equal(joinTokensByLanguage(['Je', 'suis', 'étudiant.'], 'fr'), 'Je suis étudiant.');

  // Repeated tokens, missing tokens, and empty entries
  assert.equal(
    formatReorderTokens(
      ['t1', 't2', 't1'],
      [
        { id: 't1', text: 'の' },
        { id: 't2', text: '本' },
      ],
      'ja'
    ),
    'の本の'
  );
  assert.equal(
    formatReorderTokens(
      ['t1', 'missing-token', 't2'],
      [
        { id: 't1', text: 'わたしは' },
        { id: 't2', text: 'です' },
      ],
      'ja'
    ),
    'わたしはmissing-tokenです'
  );
  assert.equal(joinTokensByLanguage(['', null, 'Hello', undefined, 'World', ''], 'en'), 'Hello World');
  assert.equal(formatReorderTokens([], [], 'ja'), '');
});

test('LNG-02: language code normalization, character fallback, and scoped lang DOM attributes', () => {
  assert.equal(normalizeLanguageCode('JA'), 'ja');
  assert.equal(normalizeLanguageCode(' ja_jp '), 'ja-JP');
  assert.equal(normalizeLanguageCode('zh_hans_cn'), 'zh-Hans-CN');
  assert.equal(normalizeLanguageCode('zh-hant'), 'zh-Hant');
  assert.equal(normalizeLanguageCode('ja-x-lingora-abc123'), 'ja-x-lingora-abc123');
  assert.equal(normalizeLanguageCode(''), undefined);
  assert.equal(normalizeLanguageCode('   '), undefined);
  assert.equal(normalizeLanguageCode(null), undefined);
  assert.equal(normalizeLanguageCode('invalid lang!'), undefined);

  assert.equal(getBaseLanguageCode('ja-JP'), 'ja');
  assert.equal(getBaseLanguageCode('zh-Hans'), 'zh');
  assert.equal(getBaseLanguageCode('fr-FR'), 'fr');
  assert.equal(isNoSpaceLanguage('ja-JP'), true);
  assert.equal(isNoSpaceLanguage('zh-Hant'), true);
  assert.equal(isNoSpaceLanguage('fr'), false);
  assert.equal(isNoSpaceLanguage('en'), false);

  // Explicit languageCode takes precedence over scriptType so non-ja characters are not forced to ja
  assert.equal(resolveContentLang({ languageCode: 'zh', scriptType: 'KANJI' }), 'zh');
  assert.equal(resolveContentLang({ languageCode: null, scriptType: 'HANZI_SIMPLIFIED' }), 'zh-Hans');
  assert.equal(resolveContentLang({ languageCode: undefined, scriptType: 'HANZI_TRADITIONAL' }), 'zh-Hant');
  assert.equal(resolveContentLang({ languageCode: undefined, scriptType: 'HIRAGANA' }), 'ja');
  assert.equal(resolveContentLang({}), undefined);

  const dtoWithLang = toLessonPresentationDto({ blocks: [], languageCode: 'ja_jp' });
  assert.equal(dtoWithLang.languageCode, 'ja-JP');
  const dtoWithoutLang = toLessonPresentationDto({ blocks: [] });
  assert.equal('languageCode' in dtoWithoutLang, false);

  const jaPresentation = {
    contentSchemaVersion: 1,
    languageCode: 'ja',
    blocks: [
      {
        blockKey: 'ex-ja',
        type: 'EXAMPLE',
        position: 1,
        schemaVersion: 1,
        content: { text: '私は学生です。', translation: 'Tôi là học sinh.' },
      },
      {
        blockKey: 'dia-ja',
        type: 'DIALOGUE',
        position: 2,
        schemaVersion: 1,
        content: { lines: [{ speaker: 'A', text: 'おはようございます。', translation: 'Chào buổi sáng.' }] },
      },
      {
        blockKey: 'char-ja',
        type: 'CHARACTER',
        position: 3,
        schemaVersion: 1,
        characterId: '10000000-0000-4000-8000-000000000001',
        glyph: 'い',
        scriptType: 'HIRAGANA',
        strokeCount: 2,
        showMeaning: true,
        showReading: true,
        showStrokeAnimation: false,
        guidedWriting: false,
        meaning: 'chữ i',
        primaryReading: 'い',
      },
    ],
    vocabulary: [
      {
        id: 'v-ja-1',
        position: 1,
        isCore: true,
        displaySnapshot: {
          canonicalForm: '学生',
          phonetic: 'がくせい / gakusei',
          meaningLabels: { vi: 'học sinh' },
          example: '私は学生です。',
        },
      },
    ],
    exercises: [
      {
        id: 'ex-ro-ja',
        itemId: 'it-ja',
        itemRevisionId: 'ir-ja',
        position: 1,
        isCore: true,
        type: 'REORDER',
        schemaVersion: 1,
        promptData: {
          prompt: 'Sắp xếp thành câu hoàn chỉnh:',
          tokens: [
            { id: 't1', text: '私は' },
            { id: 't2', text: '学生です' },
          ],
        },
      },
    ],
  };

  const jaHtml = renderToStaticMarkup(h(LessonContent, { presentation: jaPresentation }));
  // Root wrapper stays Vietnamese/neutral without lang="ja"
  assert.ok(jaHtml.startsWith('<div class="lingora-lesson-content"'));
  assert.ok(!jaHtml.includes('<div class="lingora-lesson-content" lang='));
  // Foreign text regions receive lang="ja"
  assert.ok(jaHtml.includes('class="lingora-example-text" lang="ja"'));
  assert.ok(jaHtml.includes('class="lingora-dialogue-text" lang="ja"'));
  assert.ok(jaHtml.includes('id="character-glyph-char-ja" class="character-glyph" lang="ja"'));
  assert.ok(jaHtml.includes('<span lang="ja" style="font-size:18px;font-weight:700'));
  assert.ok(jaHtml.includes('<span lang="ja" style="padding:6px 12px'));

  // Non-Japanese course keeps its own lang on CHARACTER blocks
  const zhCharHtml = renderToStaticMarkup(
    h(LessonContent, {
      languageCode: 'zh-Hans',
      presentation: {
        contentSchemaVersion: 1,
        blocks: [
          {
            blockKey: 'char-zh',
            type: 'CHARACTER',
            position: 1,
            schemaVersion: 1,
            characterId: '10000000-0000-4000-8000-000000000002',
            glyph: '日',
            scriptType: 'KANJI',
            strokeCount: 4,
            showMeaning: false,
            showReading: false,
            showStrokeAnimation: false,
            guidedWriting: false,
          },
        ],
        vocabulary: [],
        exercises: [],
      },
    })
  );
  assert.ok(zhCharHtml.includes('id="character-glyph-char-zh" class="character-glyph" lang="zh-Hans"'));
});

test('LNG-03: formatPhonetic normalizes en/fr IPA slashes and leaves ja/zh readings unwrapped', () => {
  // English & French: single /.../ pair regardless of existing slashes
  assert.equal(formatPhonetic('/ˈkɒfi/', 'en'), '/ˈkɒfi/');
  assert.equal(formatPhonetic('ˈkɒfi', 'en'), '/ˈkɒfi/');
  assert.equal(formatPhonetic('//ˈkɒfi//', 'en'), '/ˈkɒfi/');
  assert.equal(formatPhonetic('bɔ̃.ʒuʁ', 'fr'), '/bɔ̃.ʒuʁ/');
  assert.equal(formatPhonetic('/bɔ̃.ʒuʁ/', 'fr'), '/bɔ̃.ʒuʁ/');
  assert.equal(formatPhonetic('a / b', 'en'), '/a / b/');

  // Japanese & Chinese: plain reading text, internal slashes preserved, never wrapped
  assert.equal(formatPhonetic('konnichiwa', 'ja'), 'konnichiwa');
  assert.equal(formatPhonetic('gakusei', 'ja-JP'), 'gakusei');
  assert.equal(formatPhonetic('がくせい / gakusei', 'ja'), 'がくせい / gakusei');
  assert.equal(formatPhonetic('nǐ hǎo', 'zh-CN'), 'nǐ hǎo');

  // Empty, null, or slash-only values never produce //
  assert.equal(formatPhonetic(null, 'en'), null);
  assert.equal(formatPhonetic('', 'fr'), null);
  assert.equal(formatPhonetic('   ', 'ja'), null);
  assert.equal(formatPhonetic('/', 'en'), null);
  assert.equal(formatPhonetic('//', 'fr'), null);

  // Renderer integration for ja vs fr and empty phonetic
  const jaVocabHtml = renderToStaticMarkup(
    h(LessonContent, {
      languageCode: 'ja',
      presentation: {
        contentSchemaVersion: 1,
        blocks: [],
        vocabulary: [
          {
            id: 'v1',
            position: 1,
            isCore: true,
            displaySnapshot: {
              canonicalForm: '学生',
              phonetic: 'がくせい / gakusei',
              meaningLabels: { vi: 'học sinh' },
            },
          },
          {
            id: 'v2',
            position: 2,
            isCore: true,
            displaySnapshot: {
              canonicalForm: '本',
              phonetic: '',
              meaningLabels: { vi: 'sách' },
            },
          },
        ],
        exercises: [],
      },
    })
  );
  assert.ok(jaVocabHtml.includes('>がくせい / gakusei<'));
  assert.ok(!jaVocabHtml.includes('/がくせい / gakusei/'));
  assert.ok(!jaVocabHtml.includes('//'));

  const frVocabHtml = renderToStaticMarkup(
    h(LessonContent, {
      languageCode: 'fr',
      presentation: {
        contentSchemaVersion: 1,
        blocks: [],
        vocabulary: [
          {
            id: 'v-fr-1',
            position: 1,
            isCore: true,
            displaySnapshot: {
              canonicalForm: 'bonjour',
              phonetic: 'bɔ̃.ʒuʁ',
              meaningLabels: { vi: 'xin chào' },
            },
          },
          {
            id: 'v-fr-2',
            position: 2,
            isCore: true,
            displaySnapshot: {
              canonicalForm: 'café',
              phonetic: '/ka.fe/',
              meaningLabels: { vi: 'cà phê' },
            },
          },
          {
            id: 'v-fr-3',
            position: 3,
            isCore: true,
            displaySnapshot: {
              canonicalForm: 'merci',
              phonetic: '//',
              meaningLabels: { vi: 'cảm ơn' },
            },
          },
        ],
        exercises: [],
      },
    })
  );
  assert.ok(frVocabHtml.includes('>/bɔ̃.ʒuʁ/<'));
  assert.ok(frVocabHtml.includes('>/ka.fe/<'));
  assert.ok(!frVocabHtml.includes('//'));
});

test('EXT-01: formatReading, reading/romanization validators, and LessonContent vocab reading rendering', () => {
  // Validators
  assert.equal(isValidJapaneseReading('がくせい'), true);
  assert.equal(isValidJapaneseReading('コーヒー・ショップ'), true);
  assert.equal(isValidJapaneseReading('お とうさん'), true);
  assert.equal(isValidJapaneseReading(''), true);
  assert.equal(isValidJapaneseReading('gakusei'), false);
  assert.equal(isValidJapaneseReading('学生'), false);
  assert.equal(isValidJapaneseReading('がく生'), false);
  assert.equal(isValidJapaneseReading('123'), false);

  assert.equal(isValidRomanization('gakusei'), true);
  assert.equal(isValidRomanization('tōkyō'), true);
  assert.equal(isValidRomanization('kon-nichiwa'), true);
  assert.equal(isValidRomanization('ohayou gozaimasu'), true);
  assert.equal(isValidRomanization(''), true);
  assert.equal(isValidRomanization('がくせい'), false);
  assert.equal(isValidRomanization('学生'), false);
  assert.equal(isValidRomanization('123'), false);

  // formatReading prefers structured reading (+ optional romanization) and falls back to formatPhonetic
  assert.deepEqual(
    formatReading({ reading: 'がくせい', romanization: 'gakusei', phonetic: 'legacy', languageCode: 'ja' }),
    { primary: 'がくせい', romanization: 'gakusei', text: 'がくせい (gakusei)', source: 'reading' }
  );
  assert.deepEqual(
    formatReading({ reading: 'がくせい', romanization: null, phonetic: null, languageCode: 'ja' }),
    { primary: 'がくせい', romanization: null, text: 'がくせい', source: 'reading' }
  );
  assert.deepEqual(
    formatReading({ reading: null, romanization: null, phonetic: 'がくせい / gakusei', languageCode: 'ja' }),
    { primary: 'がくせい / gakusei', romanization: null, text: 'がくせい / gakusei', source: 'phonetic' }
  );
  assert.deepEqual(
    formatReading({ reading: null, romanization: null, phonetic: 'ˈkɒfi', languageCode: 'en' }),
    { primary: '/ˈkɒfi/', romanization: null, text: '/ˈkɒfi/', source: 'phonetic' }
  );
  assert.equal(formatReading({ reading: '  ', romanization: '', phonetic: '//', languageCode: 'en' }), null);
  assert.equal(formatReading({ reading: '  ', romanization: '', phonetic: '   ', languageCode: 'ja' }), null);

  // toLessonPresentationDto preserves reading & romanization and LessonContent renders both
  const presentation = toLessonPresentationDto(
    { contentSchemaVersion: 1, blocks: [] },
    [
      {
        id: 'v-ja-new',
        position: 1,
        isCore: true,
        displaySnapshot: {
          canonicalForm: '学生',
          senseKey: 'default',
          reading: 'がくせい',
          romanization: 'gakusei',
          meaningLabels: { vi: 'học sinh' },
        },
      },
      {
        id: 'v-ja-legacy',
        position: 2,
        isCore: true,
        displaySnapshot: {
          canonicalForm: '先生',
          phonetic: 'せんせい',
          meaningLabels: { vi: 'giáo viên' },
        },
      },
    ],
    [],
    'ja'
  );
  assert.equal(presentation.vocabulary[0].displaySnapshot.reading, 'がくせい');
  assert.equal(presentation.vocabulary[0].displaySnapshot.romanization, 'gakusei');

  const html = renderToStaticMarkup(h(LessonContent, { presentation }));
  assert.ok(html.includes('lang="ja"'));
  assert.ok(html.includes('>学生<'));
  assert.ok(html.includes('>がくせい<'));
  assert.ok(html.includes('>(gakusei)<'));
  assert.ok(html.includes('>先生<'));
  assert.ok(html.includes('>せんせい<'));
});
