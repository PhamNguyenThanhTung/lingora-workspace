import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateLessonBlocks,
  lessonBlockSchema,
  headingBlockSchema,
  textBlockSchema,
  grammarBlockSchema,
  exampleBlockSchema,
  dialogueBlockSchema,
  calloutBlockSchema,
  mediaBlockSchema,
  vocabularyBlockSchema,
  dividerBlockSchema,
  isSafeRichTextUrl,
  isValidMediaAudioUrl,
  MAX_BLOCKS_PER_REVISION,
} from '../src/schema.ts';

describe('T01: Block Union & Schemas (9 Canonical Types)', () => {
  const validHeading = {
    blockKey: 'h-1',
    type: 'HEADING',
    position: 1,
    schemaVersion: 1,
    content: {
      level: 2,
      text: 'Introduction to Greetings',
    },
  };

  const validText = {
    blockKey: 't-1',
    type: 'TEXT',
    position: 2,
    schemaVersion: 1,
    content: {
      nodes: [
        {
          type: 'paragraph',
          runs: [
            { text: 'Hello, ', bold: true },
            { text: 'world! ', italic: true },
            { text: 'Learn more', link: { url: 'https://example.com/guide', title: 'Guide' } },
          ],
        },
        {
          type: 'list',
          style: 'bullet',
          items: [
            { runs: [{ text: 'Item 1' }] },
            { runs: [{ text: 'Item 2' }] },
          ],
        },
      ],
    },
  };

  const validGrammar = {
    blockKey: 'g-1',
    type: 'GRAMMAR',
    position: 3,
    schemaVersion: 1,
    content: {
      title: 'Present Simple',
      explanation: 'Use present simple for routines and facts.',
      examples: [
        { text: 'I walk to school.', translation: 'Tôi đi bộ đến trường.' },
      ],
    },
  };

  const validExample = {
    blockKey: 'e-1',
    type: 'EXAMPLE',
    position: 4,
    schemaVersion: 1,
    content: {
      text: 'She drinks tea every morning.',
      translation: 'Cô ấy uống trà mỗi sáng.',
    },
  };

  const validDialogue = {
    blockKey: 'd-1',
    type: 'DIALOGUE',
    position: 5,
    schemaVersion: 1,
    content: {
      lines: [
        { speaker: 'Alice', text: 'Good morning!', translation: 'Chào buổi sáng!' },
        { speaker: 'Bob', text: 'Good morning, Alice.', translation: 'Chào buổi sáng, Alice.' },
      ],
    },
  };

  const validCallout = {
    blockKey: 'c-1',
    type: 'CALLOUT',
    position: 6,
    schemaVersion: 1,
    content: {
      tone: 'tip',
      title: 'Helpful Tip',
      document: {
        nodes: [
          {
            type: 'paragraph',
            runs: [{ text: 'Remember to practice daily for better retention.' }],
          },
        ],
      },
    },
  };

  const validMedia = {
    blockKey: 'm-1',
    type: 'MEDIA',
    position: 7,
    schemaVersion: 1,
    content: {
      kind: 'audio',
      url: 'https://cdn.example.com/audio/lesson-01.mp3',
      caption: 'Native speaker pronunciation',
    },
  };

  const validVocabulary = {
    blockKey: 'v-1',
    type: 'VOCABULARY',
    position: 8,
    schemaVersion: 1,
    content: {
      selection: 'lesson',
    },
  };

  const validDivider = {
    blockKey: 'div-1',
    type: 'DIVIDER',
    position: 9,
    schemaVersion: 1,
    content: {},
  };

  test('validates all 9 canonical block types successfully', () => {
    const blocks = [
      validHeading,
      validText,
      validGrammar,
      validExample,
      validDialogue,
      validCallout,
      validMedia,
      validVocabulary,
      validDivider,
    ];

    const result = validateLessonBlocks(blocks);
    assert.equal(result.length, 9);
    assert.equal(result[0].type, 'HEADING');
    assert.equal(result[1].type, 'TEXT');
    assert.equal(result[2].type, 'GRAMMAR');
    assert.equal(result[3].type, 'EXAMPLE');
    assert.equal(result[4].type, 'DIALOGUE');
    assert.equal(result[5].type, 'CALLOUT');
    assert.equal(result[6].type, 'MEDIA');
    assert.equal(result[7].type, 'VOCABULARY');
    assert.equal(result[8].type, 'DIVIDER');
  });

  test('individual block schemas accept their corresponding type', () => {
    assert.ok(headingBlockSchema.safeParse(validHeading).success);
    assert.ok(textBlockSchema.safeParse(validText).success);
    assert.ok(grammarBlockSchema.safeParse(validGrammar).success);
    assert.ok(exampleBlockSchema.safeParse(validExample).success);
    assert.ok(dialogueBlockSchema.safeParse(validDialogue).success);
    assert.ok(calloutBlockSchema.safeParse(validCallout).success);
    assert.ok(mediaBlockSchema.safeParse(validMedia).success);
    assert.ok(vocabularyBlockSchema.safeParse(validVocabulary).success);
    assert.ok(dividerBlockSchema.safeParse(validDivider).success);
  });

  test('rejects unknown block types', () => {
    const unknown = {
      blockKey: 'u-1',
      type: 'UNKNOWN_TYPE',
      position: 1,
      schemaVersion: 1,
      content: {},
    };
    assert.equal(lessonBlockSchema.safeParse(unknown).success, false);
    assert.throws(() => validateLessonBlocks([unknown]));
  });

  test('rejects unsupported schemaVersion', () => {
    const invalidVersion = {
      ...validHeading,
      schemaVersion: 2,
    };
    assert.equal(lessonBlockSchema.safeParse(invalidVersion).success, false);
    assert.throws(() => validateLessonBlocks([invalidVersion]));
  });

  test('strictness: rejects unexpected properties on block container', () => {
    const withExtra = {
      ...validHeading,
      extraProperty: 'forbidden',
    };
    assert.equal(headingBlockSchema.safeParse(withExtra).success, false);
    assert.equal(lessonBlockSchema.safeParse(withExtra).success, false);
  });

  test('strictness: rejects grading secrets and teacher answers in block content', () => {
    const withGrading = {
      ...validText,
      content: {
        ...validText.content,
        gradingData: { correctOptionId: 'a' },
      },
    };
    assert.equal(textBlockSchema.safeParse(withGrading).success, false);

    const withSecret = {
      ...validHeading,
      content: {
        ...validHeading.content,
        answer: 'secret',
      },
    };
    assert.equal(headingBlockSchema.safeParse(withSecret).success, false);

    const withCorrectOption = {
      ...validExample,
      content: {
        ...validExample.content,
        correctOptionId: 'opt-1',
      },
    };
    assert.equal(exampleBlockSchema.safeParse(withCorrectOption).success, false);
  });
});

describe('T01: Content-Specific Validations', () => {
  test('HEADING: allows level 2, 3, 4; rejects 1, 5, 0', () => {
    assert.ok(headingBlockSchema.safeParse({
      blockKey: 'h-2', type: 'HEADING', position: 1, schemaVersion: 1, content: { level: 2, text: 'H2' },
    }).success);
    assert.ok(headingBlockSchema.safeParse({
      blockKey: 'h-3', type: 'HEADING', position: 1, schemaVersion: 1, content: { level: 3, text: 'H3' },
    }).success);
    assert.ok(headingBlockSchema.safeParse({
      blockKey: 'h-4', type: 'HEADING', position: 1, schemaVersion: 1, content: { level: 4, text: 'H4' },
    }).success);

    assert.equal(headingBlockSchema.safeParse({
      blockKey: 'h-1', type: 'HEADING', position: 1, schemaVersion: 1, content: { level: 1, text: 'H1' },
    }).success, false);
    assert.equal(headingBlockSchema.safeParse({
      blockKey: 'h-5', type: 'HEADING', position: 1, schemaVersion: 1, content: { level: 5, text: 'H5' },
    }).success, false);
  });

  test('Rich Text URL Safety: rejects javascript, data, vbscript URIs; accepts safe http/https and relative paths', () => {
    assert.equal(isSafeRichTextUrl('javascript:alert(1)'), false);
    assert.equal(isSafeRichTextUrl('  JaVaScRiPt:alert(1) '), false);
    assert.equal(isSafeRichTextUrl('data:text/html,<script>alert(1)</script>'), false);
    assert.equal(isSafeRichTextUrl('vbscript:msgbox(1)'), false);
    assert.equal(isSafeRichTextUrl(''), false);

    assert.equal(isSafeRichTextUrl('https://lingora.app/lessons/intro'), true);
    assert.equal(isSafeRichTextUrl('http://example.com'), true);
    assert.equal(isSafeRichTextUrl('/learn/ctx-1/lesson-2'), true);
    assert.equal(isSafeRichTextUrl('#practice-section'), true);
  });

  test('MEDIA: audio reference URL validation identical to public publication boundary', () => {
    assert.equal(isValidMediaAudioUrl('https://cdn.lingora.app/audio/1.mp3'), true);
    assert.equal(isValidMediaAudioUrl('https://storage.googleapis.com/lingora/audio.mp3'), true);

    // Rejects non-https
    assert.equal(isValidMediaAudioUrl('http://cdn.lingora.app/audio/1.mp3'), false);
    // Rejects queries and fragments
    assert.equal(isValidMediaAudioUrl('https://cdn.lingora.app/audio.mp3?token=xyz'), false);
    assert.equal(isValidMediaAudioUrl('https://cdn.lingora.app/audio.mp3#part1'), false);
    // Rejects custom ports
    assert.equal(isValidMediaAudioUrl('https://cdn.lingora.app:8443/audio.mp3'), false);
    // Rejects IP addresses and localhost
    assert.equal(isValidMediaAudioUrl('https://127.0.0.1/audio.mp3'), false);
    assert.equal(isValidMediaAudioUrl('https://localhost/audio.mp3'), false);
    assert.equal(isValidMediaAudioUrl('https://internal.local/audio.mp3'), false);
  });

  test('CALLOUT: accepts standard tones; rejects invalid tone', () => {
    const makeCallout = (tone) => ({
      blockKey: 'c-1',
      type: 'CALLOUT',
      position: 1,
      schemaVersion: 1,
      content: {
        tone,
        document: {
          nodes: [{ type: 'paragraph', runs: [{ text: 'Content' }] }],
        },
      },
    });

    assert.ok(calloutBlockSchema.safeParse(makeCallout('note')).success);
    assert.ok(calloutBlockSchema.safeParse(makeCallout('NOTE')).success);
    assert.ok(calloutBlockSchema.safeParse(makeCallout('tip')).success);
    assert.ok(calloutBlockSchema.safeParse(makeCallout('warning')).success);
    assert.ok(calloutBlockSchema.safeParse(makeCallout('caution')).success);
    assert.ok(calloutBlockSchema.safeParse(makeCallout('important')).success);

    assert.equal(calloutBlockSchema.safeParse(makeCallout('party_tone')).success, false);
  });

  test('VOCABULARY: accepts selection "lesson", rejects arbitrary selections', () => {
    assert.ok(vocabularyBlockSchema.safeParse({
      blockKey: 'v-1', type: 'VOCABULARY', position: 1, schemaVersion: 1, content: { selection: 'lesson' },
    }).success);

    assert.equal(vocabularyBlockSchema.safeParse({
      blockKey: 'v-1', type: 'VOCABULARY', position: 1, schemaVersion: 1, content: { selection: 'custom' },
    }).success, false);
  });

  test('DIVIDER: must be an empty object', () => {
    assert.ok(dividerBlockSchema.safeParse({
      blockKey: 'd-1', type: 'DIVIDER', position: 1, schemaVersion: 1, content: {},
    }).success);

    assert.equal(dividerBlockSchema.safeParse({
      blockKey: 'd-1', type: 'DIVIDER', position: 1, schemaVersion: 1, content: { thickness: 2 },
    }).success, false);
  });
});

describe('T01: Collection Validation & Invariants', () => {
  test('rejects duplicate blockKey within revision', () => {
    const blocks = [
      {
        blockKey: 'duplicate-key',
        type: 'HEADING',
        position: 1,
        schemaVersion: 1,
        content: { level: 2, text: 'Heading 1' },
      },
      {
        blockKey: 'duplicate-key',
        type: 'TEXT',
        position: 2,
        schemaVersion: 1,
        content: { nodes: [{ type: 'paragraph', runs: [{ text: 'Text 1' }] }] },
      },
    ];

    assert.throws(() => validateLessonBlocks(blocks), (err) => {
      assert.ok(err.message.includes('Khóa khối nội dung (blockKey) không được trùng lặp'));
      return true;
    });
  });

  test('rejects duplicate position within revision', () => {
    const blocks = [
      {
        blockKey: 'k-1',
        type: 'HEADING',
        position: 1,
        schemaVersion: 1,
        content: { level: 2, text: 'Heading 1' },
      },
      {
        blockKey: 'k-2',
        type: 'TEXT',
        position: 1, // Duplicate position 1
        schemaVersion: 1,
        content: { nodes: [{ type: 'paragraph', runs: [{ text: 'Text 1' }] }] },
      },
    ];

    assert.throws(() => validateLessonBlocks(blocks), (err) => {
      assert.ok(err.message.includes('Thứ tự vị trí (position) của các khối không được trùng lặp'));
      return true;
    });
  });

  test('rejects negative or zero position', () => {
    assert.throws(() => validateLessonBlocks([
      {
        blockKey: 'k-1',
        type: 'HEADING',
        position: 0,
        schemaVersion: 1,
        content: { level: 2, text: 'Heading 1' },
      },
    ]));

    assert.throws(() => validateLessonBlocks([
      {
        blockKey: 'k-1',
        type: 'HEADING',
        position: -5,
        schemaVersion: 1,
        content: { level: 2, text: 'Heading 1' },
      },
    ]));
  });

  test('rejects non-array input', () => {
    assert.throws(() => validateLessonBlocks(null));
    assert.throws(() => validateLessonBlocks({}));
    assert.throws(() => validateLessonBlocks('not-an-array'));
  });

  test(`rejects collection exceeding ${MAX_BLOCKS_PER_REVISION} blocks`, () => {
    const tooMany = [];
    for (let i = 1; i <= MAX_BLOCKS_PER_REVISION + 1; i++) {
      tooMany.push({
        blockKey: `key-${i}`,
        type: 'DIVIDER',
        position: i,
        schemaVersion: 1,
        content: {},
      });
    }
    assert.throws(() => validateLessonBlocks(tooMany));
  });

  test('rejects blockKey exceeding 128 chars or containing invalid characters', () => {
    const longKey = 'a'.repeat(129);
    assert.throws(() => validateLessonBlocks([
      {
        blockKey: longKey,
        type: 'DIVIDER',
        position: 1,
        schemaVersion: 1,
        content: {},
      },
    ]));

    assert.throws(() => validateLessonBlocks([
      {
        blockKey: 'invalid key with spaces',
        type: 'DIVIDER',
        position: 1,
        schemaVersion: 1,
        content: {},
      },
    ]));
  });

  test('accepts deterministic legacy blockKey format', () => {
    const legacyKey = 'legacy:849d7fca-0b27-4632-9cb7-fa5d691bc354:paragraph:0';
    const result = validateLessonBlocks([
      {
        blockKey: legacyKey,
        type: 'TEXT',
        position: 1,
        schemaVersion: 1,
        content: { nodes: [{ type: 'paragraph', runs: [{ text: 'Legacy text' }] }] },
      },
    ]);
    assert.equal(result[0].blockKey, legacyKey);
  });
});
