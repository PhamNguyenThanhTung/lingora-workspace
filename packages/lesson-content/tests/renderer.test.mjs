import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LessonContent } from '../src/LessonContent.ts';
import { toLessonPresentationDto } from '../src/index.ts';

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
  assert.ok(html.includes('Bài tập 1: MCQ'));
  assert.ok(html.includes('happy'));
  assert.ok(html.includes('Joyful'));
  assert.ok(html.includes('type="radio" disabled=""'));

  // FILL_BLANK
  assert.ok(html.includes('Bài tập 2: FILL_BLANK'));
  assert.ok(html.includes('She [ ____________ ] to school every morning.'));

  // REORDER
  assert.ok(html.includes('Bài tập 3: REORDER'));
  assert.ok(html.includes('English'));
  assert.ok(html.includes('fun'));

  // LISTENING
  assert.ok(html.includes('Bài tập 4: LISTENING'));
  assert.ok(html.includes('https://cdn.lingora.edu.vn/audio/test.mp3'));

  // GRAMMAR
  assert.ok(html.includes('Bài tập 5: GRAMMAR'));
  assert.ok(html.includes('The teacher praised the student.'));
  assert.ok(html.includes('S + was/were + V3/ed + by O'));

  // Strict check: NO grading secrets, answers, or submit button!
  assert.ok(!html.includes('correctOptionId'));
  assert.ok(!html.includes('gradingData'));
  assert.ok(!html.includes('submit'));
  assert.ok(!html.includes('Nộp bài'));
});
