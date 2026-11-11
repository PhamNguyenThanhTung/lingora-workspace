import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptLegacyParagraphs,
  toLegacyParagraphProjection,
  parsePersistedLessonContent,
} from '../src/legacy.ts';
import {
  toLessonPresentationDto,
} from '../src/dto.ts';

describe('T01: Legacy Paragraph Adapter & Projection', () => {
  const sampleRevisionId = 'c8b417e2-452a-4dfa-a92e-33560b296b61';

  test('adaptLegacyParagraphs creates deterministic keys and preserves exact text', () => {
    const legacyParagraphs = [
      { type: 'paragraph', text: 'Chào mừng bạn đến với Lingora.' },
      { type: 'paragraph', text: 'Đây là bài học cơ bản đầu tiên.' },
      { type: 'paragraph', text: 'Hãy cùng luyện tập phát âm nhé!' },
    ];

    const adapted = adaptLegacyParagraphs(sampleRevisionId, legacyParagraphs);

    assert.equal(adapted.length, 3);

    assert.equal(adapted[0].blockKey, `legacy:${sampleRevisionId}:paragraph:0`);
    assert.equal(adapted[0].position, 1);
    assert.equal(adapted[0].type, 'TEXT');
    assert.equal(adapted[0].schemaVersion, 1);
    assert.equal(adapted[0].content.nodes[0].runs[0].text, 'Chào mừng bạn đến với Lingora.');

    assert.equal(adapted[1].blockKey, `legacy:${sampleRevisionId}:paragraph:1`);
    assert.equal(adapted[1].position, 2);
    assert.equal(adapted[1].content.nodes[0].runs[0].text, 'Đây là bài học cơ bản đầu tiên.');

    assert.equal(adapted[2].blockKey, `legacy:${sampleRevisionId}:paragraph:2`);
    assert.equal(adapted[2].position, 3);
    assert.equal(adapted[2].content.nodes[0].runs[0].text, 'Hãy cùng luyện tập phát âm nhé!');
  });

  test('adaptLegacyParagraphs handles empty, null, or undefined gracefully', () => {
    assert.deepEqual(adaptLegacyParagraphs(sampleRevisionId, []), []);
    assert.deepEqual(adaptLegacyParagraphs(sampleRevisionId, null), []);
    assert.deepEqual(adaptLegacyParagraphs(sampleRevisionId, undefined), []);
  });

  test('round-trip fidelity: toLegacyParagraphProjection on adapted paragraphs reproduces original texts', () => {
    const original = [
      { type: 'paragraph', text: 'Paragraph One' },
      { type: 'paragraph', text: 'Paragraph Two with special chars: 100$, <b>bold</b>' },
    ];

    const adapted = adaptLegacyParagraphs(sampleRevisionId, original);
    const projected = toLegacyParagraphProjection(adapted);

    assert.equal(projected.length, 2);
    assert.equal(projected[0].type, 'paragraph');
    assert.equal(projected[0].text, original[0].text);
    assert.equal(projected[1].type, 'paragraph');
    assert.equal(projected[1].text, original[1].text);
  });

  test('toLegacyParagraphProjection projects rich blocks into readable paragraph representations', () => {
    const richBlocks = [
      {
        blockKey: 'h-1',
        type: 'HEADING',
        position: 1,
        schemaVersion: 1,
        content: { level: 2, text: 'Greetings Section' },
      },
      {
        blockKey: 'g-1',
        type: 'GRAMMAR',
        position: 2,
        schemaVersion: 1,
        content: {
          title: 'Rule 1',
          explanation: 'Subject + Verb agreement.',
          examples: [{ text: 'He walks.', translation: 'Anh ấy đi bộ.' }],
        },
      },
      {
        blockKey: 'e-1',
        type: 'EXAMPLE',
        position: 3,
        schemaVersion: 1,
        content: { text: 'Good afternoon.', translation: 'Chào buổi chiều.' },
      },
      {
        blockKey: 'd-1',
        type: 'DIALOGUE',
        position: 4,
        schemaVersion: 1,
        content: {
          lines: [
            { speaker: 'Ann', text: 'Hi', translation: 'Chào' },
            { speaker: 'Ben', text: 'Hello', translation: 'Xin chào' },
          ],
        },
      },
      {
        blockKey: 'c-1',
        type: 'CALLOUT',
        position: 5,
        schemaVersion: 1,
        content: {
          tone: 'NOTE',
          title: 'Usage Note',
          document: {
            nodes: [{ type: 'paragraph', runs: [{ text: 'Used in informal settings.' }] }],
          },
        },
      },
      {
        blockKey: 'm-1',
        type: 'MEDIA',
        position: 6,
        schemaVersion: 1,
        content: {
          kind: 'audio',
          url: 'https://cdn.example.com/audio.mp3',
          caption: 'Audio sample',
        },
      },
      {
        blockKey: 'div-1',
        type: 'DIVIDER',
        position: 7,
        schemaVersion: 1,
        content: {},
      },
      {
        blockKey: 'v-1',
        type: 'VOCABULARY',
        position: 8,
        schemaVersion: 1,
        content: { selection: 'lesson' },
      },
    ];

    const projected = toLegacyParagraphProjection(richBlocks);

    // DIVIDER and VOCABULARY do not produce paragraphs
    assert.equal(projected.length, 7); // HEADING, GRAMMAR, EXAMPLE, DIALOGUE(2 lines), CALLOUT, MEDIA
    assert.equal(projected[0].text, 'Greetings Section');
    assert.equal(projected[1].text, 'Rule 1: Subject + Verb agreement.');
    assert.equal(projected[2].text, 'Good afternoon. (Chào buổi chiều.)');
    assert.equal(projected[3].text, 'Ann: Hi (Chào)');
    assert.equal(projected[4].text, 'Ben: Hello (Xin chào)');
    assert.ok(projected[5].text.includes('Used in informal settings.'));
    assert.equal(projected[6].text, '[Audio] Audio sample');
  });
});

describe('T01: parsePersistedLessonContent & Version Invariants', () => {
  const revisionId = 'a1111111-2222-3333-4444-555555555555';

  test('V0 legacy lesson parses legacy paragraphs with contentSchemaVersion = 0', () => {
    const source = {
      contentSchemaVersion: 0,
      revisionId,
      contentBlocks: [
        { type: 'paragraph', text: 'Legacy paragraph text' },
      ],
    };

    const parsed = parsePersistedLessonContent(source);
    assert.equal(parsed.contentSchemaVersion, 0);
    assert.equal(parsed.blocks.length, 1);
    assert.equal(parsed.blocks[0].blockKey, `legacy:${revisionId}:paragraph:0`);
    assert.equal(parsed.blocks[0].type, 'TEXT');
  });

  test('V1 zero-block lesson NEVER falls back to legacy contentBlocks', () => {
    const source = {
      contentSchemaVersion: 1,
      revisionId,
      blocks: [], // Empty block list in V1
      contentBlocks: [
        { type: 'paragraph', text: 'Should NOT be used because contentSchemaVersion is 1' },
      ],
    };

    const parsed = parsePersistedLessonContent(source);
    assert.equal(parsed.contentSchemaVersion, 1);
    // MUST NOT fall back to legacy paragraphs
    assert.equal(parsed.blocks.length, 0);
  });

  test('parses persisted block rows directly with proper sorting', () => {
    const persistedRows = [
      {
        blockKey: 'k-2',
        type: 'DIVIDER',
        position: 2,
        schemaVersion: 1,
        content: {},
      },
      {
        blockKey: 'k-1',
        type: 'HEADING',
        position: 1,
        schemaVersion: 1,
        content: { level: 2, text: 'First' },
      },
    ];

    const parsed = parsePersistedLessonContent(persistedRows);
    assert.equal(parsed.contentSchemaVersion, 1);
    assert.equal(parsed.blocks.length, 2);
    assert.equal(parsed.blocks[0].blockKey, 'k-1');
    assert.equal(parsed.blocks[1].blockKey, 'k-2');
  });

  test('unsupported persisted blocks are replaced with safe placeholder without crashing', () => {
    const rowsWithUnsupported = [
      {
        blockKey: 'valid-1',
        type: 'HEADING',
        position: 1,
        schemaVersion: 1,
        content: { level: 2, text: 'Valid block' },
      },
      {
        blockKey: 'future-block',
        type: 'FUTURE_3D_WIDGET',
        position: 2,
        schemaVersion: 99,
        content: { customData: 'test' },
      },
    ];

    const parsed = parsePersistedLessonContent(rowsWithUnsupported);
    assert.equal(parsed.blocks.length, 2);
    assert.equal(parsed.blocks[0].type, 'HEADING');
    assert.equal(parsed.blocks[1].type, 'UNSUPPORTED');
    assert.equal(parsed.blocks[1].originalType, 'FUTURE_3D_WIDGET');
    assert.ok(parsed.blocks[1].message);
  });
});

describe('T01: toLessonPresentationDto Public Boundary', () => {
  test('creates structured presentation DTO and strips grading data / secrets even inside promptData', () => {
    const blocks = [
      {
        blockKey: 'h-1',
        type: 'HEADING',
        position: 1,
        schemaVersion: 1,
        content: { level: 2, text: 'Heading' },
      },
    ];

    const dirtyExercises = [
      {
        id: 'ex-2',
        itemId: 'item-2',
        itemRevisionId: 'rev-2',
        position: 2,
        isCore: true,
        type: 'MCQ',
        schemaVersion: 1,
        promptData: {
          prompt: 'Question 2',
          options: [
            { id: 'opt-1', text: 'Option A', isCorrect: true, secretFeedback: 'leak' },
            { id: 'opt-2', text: 'Option B' },
          ],
          // Canary secrets embedded directly inside promptData!
          correctOptionId: 'opt-1',
          gradingData: { correctOptionId: 'opt-1' },
          exploitCanary: 'secret-token',
        },
        // Leaked top-level fields that MUST NOT appear in presentation DTO
        gradingData: { correctOptionId: 'opt-1' },
        correctOptionId: 'opt-1',
        gradingSecret: 'sensitive-hash',
      },
      {
        id: 'ex-1',
        itemId: 'item-1',
        itemRevisionId: 'rev-1',
        position: 1,
        isCore: true,
        type: 'FILL_BLANK',
        schemaVersion: 1,
        promptData: {
          prompt: 'Question 1',
          sentence: 'Hello ____',
          solution: 'world',
          gradingData: ['world'],
        },
      },
      {
        id: 'ex-3',
        itemId: 'item-3',
        itemRevisionId: 'rev-3',
        position: 3,
        isCore: true,
        type: 'REORDER',
        schemaVersion: 1,
        promptData: {
          prompt: 'Reorder',
          tokens: [{ id: 't1', text: 'one', position: 0 }],
          correctOrder: ['t1'],
          gradingData: { key: 1 },
        },
      },
      {
        id: 'ex-4',
        itemId: 'item-4',
        itemRevisionId: 'rev-4',
        position: 4,
        isCore: true,
        type: 'LISTENING',
        schemaVersion: 1,
        promptData: {
          prompt: 'Listen',
          audioUrl: 'https://cdn.example.com/audio.mp3',
          options: [{ id: 'o1', text: 'A' }],
          correctOptionId: 'o1',
          transcript: 'secret transcript',
        },
      },
      {
        id: 'ex-5',
        itemId: 'item-5',
        itemRevisionId: 'rev-5',
        position: 5,
        isCore: true,
        type: 'GRAMMAR',
        schemaVersion: 1,
        promptData: {
          prompt: 'Grammar',
          sourceSentence: 'I go',
          targetPattern: 'S + V',
          secretRules: 'internal syntax',
        },
      },
    ];

    const vocabulary = [
      {
        id: 'v-2',
        position: 2,
        isCore: true,
        displaySnapshot: {
          canonicalForm: 'cat',
          meaningLabels: { vi: 'con mèo' },
        },
      },
      {
        id: 'v-1',
        position: 1,
        isCore: true,
        displaySnapshot: {
          canonicalForm: 'dog',
          meaningLabels: { vi: 'con chó' },
        },
      },
    ];

    const dto = toLessonPresentationDto(blocks, vocabulary, dirtyExercises);

    assert.equal(dto.contentSchemaVersion, 1);
    assert.equal(dto.blocks.length, 1);

    // Verify ordering
    assert.equal(dto.exercises.length, 5);
    assert.equal(dto.exercises[0].id, 'ex-1');
    assert.equal(dto.exercises[1].id, 'ex-2');
    assert.equal(dto.exercises[2].id, 'ex-3');
    assert.equal(dto.exercises[3].id, 'ex-4');
    assert.equal(dto.exercises[4].id, 'ex-5');

    assert.equal(dto.vocabulary.length, 2);
    assert.equal(dto.vocabulary[0].id, 'v-1');
    assert.equal(dto.vocabulary[1].id, 'v-2');

    // Verify secrecy: no top-level grading data leaked!
    const ex2 = dto.exercises[1];
    assert.equal('gradingData' in ex2, false);
    assert.equal('correctOptionId' in ex2, false);
    assert.equal('gradingSecret' in ex2, false);

    // Verify MCQ promptData sanitization: canary secrets inside promptData stripped!
    assert.deepEqual(ex2.promptData, {
      prompt: 'Question 2',
      options: [
        { id: 'opt-1', text: 'Option A' },
        { id: 'opt-2', text: 'Option B' },
      ],
    });

    // Verify FILL_BLANK promptData sanitization
    const fillBlank = dto.exercises[0];
    assert.deepEqual(fillBlank.promptData, {
      prompt: 'Question 1',
      sentence: 'Hello ____',
    });

    // Verify REORDER promptData sanitization
    const reorder = dto.exercises[2];
    assert.deepEqual(reorder.promptData, {
      prompt: 'Reorder',
      tokens: [{ id: 't1', text: 'one' }],
    });

    // Verify LISTENING promptData sanitization
    const listening = dto.exercises[3];
    assert.deepEqual(listening.promptData, {
      prompt: 'Listen',
      audioUrl: 'https://cdn.example.com/audio.mp3',
      options: [{ id: 'o1', text: 'A' }],
    });

    // Verify GRAMMAR promptData sanitization
    const grammar = dto.exercises[4];
    assert.deepEqual(grammar.promptData, {
      prompt: 'Grammar',
      sourceSentence: 'I go',
      targetPattern: 'S + V',
    });
  });
});
