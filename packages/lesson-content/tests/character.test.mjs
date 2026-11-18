import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  characterBlockAuthorInputContentSchema,
  characterBlockAuthorInputSchema,
  validateCharacterBlockAuthorInput,
  characterSnapshotSchema,
  characterBlockPersistedContentSchema,
  characterBlockPersistedSchema,
  validateCharacterBlockPersisted,
  validateLessonBlocks,
  parsePersistedLessonContent,
  toLegacyParagraphProjection,
  LessonContent,
} from '../src/index.ts';

describe('S6-04a1: Author Input Schema (Strict Client Submission Boundary)', () => {
  const validUuid = randomUUID();

  test('accepts valid author input with characterId and four boolean flags', () => {
    const input = {
      characterId: validUuid,
      showMeaning: true,
      showReading: true,
      showStrokeAnimation: false,
      guidedWriting: true,
    };
    const parsed = characterBlockAuthorInputContentSchema.parse(input);
    assert.deepEqual(parsed, input);
  });

  test('accepts all permutations of the four boolean flags', () => {
    const flags = [false, true];
    for (const showMeaning of flags) {
      for (const showReading of flags) {
        for (const showStrokeAnimation of flags) {
          for (const guidedWriting of flags) {
            const input = {
              characterId: validUuid,
              showMeaning,
              showReading,
              showStrokeAnimation,
              guidedWriting,
            };
            const parsed = characterBlockAuthorInputContentSchema.parse(input);
            assert.equal(parsed.showMeaning, showMeaning);
            assert.equal(parsed.showReading, showReading);
            assert.equal(parsed.showStrokeAnimation, showStrokeAnimation);
            assert.equal(parsed.guidedWriting, guidedWriting);
          }
        }
      }
    }
  });

  test('validates complete block container with validateCharacterBlockAuthorInput', () => {
    const block = {
      blockKey: 'char_valid_1',
      type: 'CHARACTER',
      position: 1,
      schemaVersion: 1,
      content: {
        characterId: validUuid,
        showMeaning: true,
        showReading: false,
        showStrokeAnimation: true,
        guidedWriting: false,
      },
    };
    const validated = validateCharacterBlockAuthorInput(block);
    assert.equal(validated.type, 'CHARACTER');
    assert.equal(validated.content.characterId, validUuid);
    assert.equal(validated.content.showMeaning, true);
    assert.equal(validated.content.showReading, false);
    assert.equal(validated.content.showStrokeAnimation, true);
    assert.equal(validated.content.guidedWriting, false);
  });

  test('rejects non-UUID characterId', () => {
    assert.throws(
      () =>
        characterBlockAuthorInputContentSchema.parse({
          characterId: 'not-a-uuid',
          showMeaning: true,
          showReading: true,
          showStrokeAnimation: true,
          guidedWriting: true,
        }),
      (err) => {
        assert.match(err.message, /UUID/);
        return true;
      }
    );
  });

  test('rejects missing characterId', () => {
    assert.throws(() =>
      characterBlockAuthorInputContentSchema.parse({
        showMeaning: true,
        showReading: true,
        showStrokeAnimation: true,
        guidedWriting: true,
      })
    );
  });

  test('rejects missing any of the four boolean flags', () => {
    const required = ['showMeaning', 'showReading', 'showStrokeAnimation', 'guidedWriting'];
    for (const field of required) {
      const payload = {
        characterId: validUuid,
        showMeaning: true,
        showReading: true,
        showStrokeAnimation: true,
        guidedWriting: true,
      };
      delete payload[field];
      assert.throws(
        () => characterBlockAuthorInputContentSchema.parse(payload),
        `Should reject when ${field} is missing`
      );
    }
  });

  test('rejects non-boolean values for flags (string, number, null, object)', () => {
    const invalidValues = ['true', 'false', 1, 0, null, {}, []];
    const fields = ['showMeaning', 'showReading', 'showStrokeAnimation', 'guidedWriting'];

    for (const field of fields) {
      for (const val of invalidValues) {
        const payload = {
          characterId: validUuid,
          showMeaning: true,
          showReading: true,
          showStrokeAnimation: true,
          guidedWriting: true,
          [field]: val,
        };
        assert.throws(
          () => characterBlockAuthorInputContentSchema.parse(payload),
          `Should reject ${val} for ${field}`
        );
      }
    }
  });

  test('STRICT: rejects snapshot field in author input content', () => {
    assert.throws(
      () =>
        characterBlockAuthorInputContentSchema.parse({
          characterId: validUuid,
          showMeaning: true,
          showReading: true,
          showStrokeAnimation: true,
          guidedWriting: true,
          snapshot: {
            glyph: '漢',
            scriptType: 'KANJI',
            strokeCount: 13,
          },
        }),
      (err) => {
        assert.match(err.message, /unrecognized/i);
        return true;
      }
    );
  });

  test('STRICT: rejects raw stroke geometry in author input content (strokes, points, path)', () => {
    const geometryFields = [
      { strokes: [{ path: 'M0,0 L1,1' }] },
      { points: [[0, 0], [1, 1]] },
      { path: 'M0,0 L1,1' },
      { strokeCount: 13 },
      { glyph: '漢' },
      { strokeVersion: 1 },
      { version: 1 },
      { metadata: { radical: '氵' } },
    ];

    for (const extra of geometryFields) {
      assert.throws(
        () =>
          characterBlockAuthorInputContentSchema.parse({
            characterId: validUuid,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: true,
            ...extra,
          }),
        (err) => {
          assert.match(err.message, /unrecognized/i);
          return true;
        }
      );
    }
  });

  test('STRICT: rejects snapshot or geometry fields on root block container', () => {
    assert.throws(
      () =>
        validateCharacterBlockAuthorInput({
          blockKey: 'char_extra_1',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          snapshot: { glyph: '漢' },
          content: {
            characterId: validUuid,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: true,
          },
        }),
      (err) => {
        assert.match(err.message, /unrecognized/i);
        return true;
      }
    );

    assert.throws(
      () =>
        validateCharacterBlockAuthorInput({
          blockKey: 'char_extra_2',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          strokes: [{ path: 'M0,0' }],
          content: {
            characterId: validUuid,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: true,
          },
        }),
      (err) => {
        assert.match(err.message, /unrecognized/i);
        return true;
      }
    );
  });

  test('rejects invalid block container properties (position <= 0, invalid blockKey, schemaVersion != 1)', () => {
    const validContent = {
      characterId: validUuid,
      showMeaning: true,
      showReading: true,
      showStrokeAnimation: true,
      guidedWriting: true,
    };

    assert.throws(() =>
      validateCharacterBlockAuthorInput({
        blockKey: 'char_1',
        type: 'CHARACTER',
        position: 0,
        schemaVersion: 1,
        content: validContent,
      })
    );

    assert.throws(() =>
      validateCharacterBlockAuthorInput({
        blockKey: 'invalid key with spaces',
        type: 'CHARACTER',
        position: 1,
        schemaVersion: 1,
        content: validContent,
      })
    );

    assert.throws(() =>
      validateCharacterBlockAuthorInput({
        blockKey: 'char_1',
        type: 'CHARACTER',
        position: 1,
        schemaVersion: 2,
        content: validContent,
      })
    );
  });
});

describe('S6-04a1: Authoritative Character Metadata Snapshot Schema', () => {
  test('accepts valid full snapshot with metadata and single pinned strokeVersion', () => {
    const snapshot = {
      glyph: 'あ',
      scriptType: 'HIRAGANA',
      strokeCount: 3,
      meaning: 'a (phonetic hiragana)',
      primaryReading: 'a',
      romanization: 'a',
      metadata: { notes: 'first kana' },
      strokeVersion: 1,
    };
    const parsed = characterSnapshotSchema.parse(snapshot);
    assert.deepEqual(parsed, snapshot);
  });

  test('accepts minimal required snapshot (glyph, scriptType, strokeCount)', () => {
    const minimal = {
      glyph: '漢',
      scriptType: 'KANJI',
      strokeCount: 13,
    };
    const parsed = characterSnapshotSchema.parse(minimal);
    assert.equal(parsed.glyph, '漢');
    assert.equal(parsed.scriptType, 'KANJI');
    assert.equal(parsed.strokeCount, 13);
    assert.deepEqual(parsed.metadata, {});
  });

  test('accepts all 5 approved spec scriptTypes', () => {
    const scripts = ['HIRAGANA', 'KATAKANA', 'KANJI', 'HANZI_SIMPLIFIED', 'HANZI_TRADITIONAL'];
    for (const scriptType of scripts) {
      const snap = characterSnapshotSchema.parse({
        glyph: '文',
        scriptType,
        strokeCount: 4,
      });
      assert.equal(snap.scriptType, scriptType);
    }
  });

  test('rejects unapproved scriptTypes', () => {
    assert.throws(() =>
      characterSnapshotSchema.parse({
        glyph: 'A',
        scriptType: 'LATIN',
        strokeCount: 3,
      })
    );
  });

  test('enforces strokeCount bounds (1..128)', () => {
    assert.throws(() =>
      characterSnapshotSchema.parse({
        glyph: '一',
        scriptType: 'KANJI',
        strokeCount: 0,
      })
    );

    assert.throws(() =>
      characterSnapshotSchema.parse({
        glyph: '一',
        scriptType: 'KANJI',
        strokeCount: 129,
      })
    );

    assert.throws(() =>
      characterSnapshotSchema.parse({
        glyph: '一',
        scriptType: 'KANJI',
        strokeCount: 3.5,
      })
    );
  });

  test('enforces strokeVersion must be positive integer when provided in snapshot', () => {
    assert.throws(() =>
      characterSnapshotSchema.parse({
        glyph: '一',
        scriptType: 'KANJI',
        strokeCount: 1,
        strokeVersion: 0,
      })
    );

    assert.throws(() =>
      characterSnapshotSchema.parse({
        glyph: '一',
        scriptType: 'KANJI',
        strokeCount: 1,
        strokeVersion: -1,
      })
    );

    assert.throws(() =>
      characterSnapshotSchema.parse({
        glyph: '一',
        scriptType: 'KANJI',
        strokeCount: 1,
        strokeVersion: 1.5,
      })
    );
  });

  test('STRICT: snapshot rejects raw stroke geometry fields (strokes, points, path)', () => {
    assert.throws(
      () =>
        characterSnapshotSchema.parse({
          glyph: '一',
          scriptType: 'KANJI',
          strokeCount: 1,
          strokes: [{ path: 'M0,0' }],
        }),
      (err) => {
        assert.match(err.message, /unrecognized/i);
        return true;
      }
    );

    assert.throws(
      () =>
        characterSnapshotSchema.parse({
          glyph: '一',
          scriptType: 'KANJI',
          strokeCount: 1,
          points: [[0, 0]],
        }),
      (err) => {
        assert.match(err.message, /unrecognized/i);
        return true;
      }
    );

    assert.throws(
      () =>
        characterSnapshotSchema.parse({
          glyph: '一',
          scriptType: 'KANJI',
          strokeCount: 1,
          path: 'M0,0',
        }),
      (err) => {
        assert.match(err.message, /unrecognized/i);
        return true;
      }
    );
  });
});

describe('S6-04a1: Persisted Canonical Block Schema (Server-Resolved)', () => {
  const validUuid = randomUUID();

  test('accepts valid persisted block with single pinned snapshot.strokeVersion when animation or guided is true', () => {
    const persistedBlock = {
      blockKey: 'char_persisted_1',
      type: 'CHARACTER',
      position: 1,
      schemaVersion: 1,
      content: {
        characterId: validUuid,
        showMeaning: true,
        showReading: true,
        showStrokeAnimation: true,
        guidedWriting: false,
        snapshot: {
          glyph: '日',
          scriptType: 'KANJI',
          strokeCount: 4,
          meaning: 'sun, day',
          primaryReading: 'hi',
          romanization: 'nichi',
          metadata: { jlptLevel: 'N5' },
          strokeVersion: 1,
        },
      },
    };

    const validated = validateCharacterBlockPersisted(persistedBlock);
    assert.equal(validated.type, 'CHARACTER');
    assert.equal(validated.content.characterId, validUuid);
    assert.equal(validated.content.snapshot.glyph, '日');
    assert.equal(validated.content.snapshot.strokeCount, 4);
    assert.equal(validated.content.snapshot.strokeVersion, 1);
  });

  test('accepts valid no-animation/no-guided block with null or omitted strokeVersion pin', () => {
    const withOmittedPin = {
      blockKey: 'char_persisted_static_1',
      type: 'CHARACTER',
      position: 1,
      schemaVersion: 1,
      content: {
        characterId: validUuid,
        showMeaning: true,
        showReading: true,
        showStrokeAnimation: false,
        guidedWriting: false,
        snapshot: {
          glyph: '日',
          scriptType: 'KANJI',
          strokeCount: 4,
        },
      },
    };
    const validated1 = validateCharacterBlockPersisted(withOmittedPin);
    assert.equal(validated1.content.snapshot.strokeVersion, undefined);

    const withNullPin = {
      blockKey: 'char_persisted_static_2',
      type: 'CHARACTER',
      position: 2,
      schemaVersion: 1,
      content: {
        characterId: validUuid,
        showMeaning: true,
        showReading: true,
        showStrokeAnimation: false,
        guidedWriting: false,
        snapshot: {
          glyph: '日',
          scriptType: 'KANJI',
          strokeCount: 4,
          strokeVersion: null,
        },
      },
    };
    const validated2 = validateCharacterBlockPersisted(withNullPin);
    assert.equal(validated2.content.snapshot.strokeVersion, null);
  });

  test('NEGATIVE: rejects showStrokeAnimation=true when no version is pinned (omitted)', () => {
    assert.throws(
      () =>
        validateCharacterBlockPersisted({
          blockKey: 'char_err_anim_omit',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: validUuid,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: false,
            snapshot: {
              glyph: '日',
              scriptType: 'KANJI',
              strokeCount: 4,
            },
          },
        }),
      (err) => {
        assert.match(err.message, /snapshot\.strokeVersion/);
        return true;
      }
    );
  });

  test('NEGATIVE: rejects showStrokeAnimation=true when strokeVersion is null', () => {
    assert.throws(
      () =>
        validateCharacterBlockPersisted({
          blockKey: 'char_err_anim_null',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: validUuid,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: false,
            snapshot: {
              glyph: '日',
              scriptType: 'KANJI',
              strokeCount: 4,
              strokeVersion: null,
            },
          },
        }),
      (err) => {
        assert.match(err.message, /snapshot\.strokeVersion/);
        return true;
      }
    );
  });

  test('NEGATIVE: rejects guidedWriting=true when no version is pinned (omitted)', () => {
    assert.throws(
      () =>
        validateCharacterBlockPersisted({
          blockKey: 'char_err_guided_omit',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: validUuid,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: false,
            guidedWriting: true,
            snapshot: {
              glyph: '日',
              scriptType: 'KANJI',
              strokeCount: 4,
            },
          },
        }),
      (err) => {
        assert.match(err.message, /snapshot\.strokeVersion/);
        return true;
      }
    );
  });

  test('NEGATIVE: rejects guidedWriting=true when strokeVersion is null', () => {
    assert.throws(
      () =>
        validateCharacterBlockPersisted({
          blockKey: 'char_err_guided_null',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: validUuid,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: false,
            guidedWriting: true,
            snapshot: {
              glyph: '日',
              scriptType: 'KANJI',
              strokeCount: 4,
              strokeVersion: null,
            },
          },
        }),
      (err) => {
        assert.match(err.message, /snapshot\.strokeVersion/);
        return true;
      }
    );
  });

  test('NEGATIVE: rejects legacy extra outer content.strokeVersion (strictly requires single pinned version inside snapshot)', () => {
    assert.throws(
      () =>
        validateCharacterBlockPersisted({
          blockKey: 'char_err_outer_version',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: validUuid,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: true,
            strokeVersion: 1, // Invalid outer duplicate field
            snapshot: {
              glyph: '日',
              scriptType: 'KANJI',
              strokeCount: 4,
              strokeVersion: 1,
            },
          },
        }),
      (err) => {
        assert.match(err.message, /unrecognized/i);
        return true;
      }
    );
  });

  test('rejects persisted block missing snapshot', () => {
    assert.throws(() =>
      validateCharacterBlockPersisted({
        blockKey: 'char_persisted_missing_snap',
        type: 'CHARACTER',
        position: 1,
        schemaVersion: 1,
        content: {
          characterId: validUuid,
          showMeaning: true,
          showReading: true,
          showStrokeAnimation: false,
          guidedWriting: false,
        },
      })
    );
  });

  test('STRICT: rejects persisted content with raw stroke geometry', () => {
    assert.throws(
      () =>
        validateCharacterBlockPersisted({
          blockKey: 'char_persisted_geom',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          content: {
            characterId: validUuid,
            showMeaning: true,
            showReading: true,
            showStrokeAnimation: true,
            guidedWriting: false,
            strokes: [{ path: 'M0,0' }],
            snapshot: {
              glyph: '日',
              scriptType: 'KANJI',
              strokeCount: 4,
              strokeVersion: 1,
            },
          },
        }),
      (err) => {
        assert.match(err.message, /unrecognized/i);
        return true;
      }
    );
  });
});

describe('S6-04a1: Isolation & Invariants (Live Writer and Legacy Reader Resilience)', () => {
  const validUuid = randomUUID();

  test('validateLessonBlocks (generic live writer parser) REJECTS CHARACTER blocks in S6-04a1', () => {
    const characterBlock = {
      blockKey: 'char_writer_1',
      type: 'CHARACTER',
      position: 1,
      schemaVersion: 1,
      content: {
        characterId: validUuid,
        showMeaning: true,
        showReading: true,
        showStrokeAnimation: true,
        guidedWriting: true,
      },
    };

    // In S6-04a1, CHARACTER cannot enter the live writer through generic parser widening!
    assert.throws(
      () => validateLessonBlocks([characterBlock]),
      (err) => {
        // Must reject CHARACTER as unrecognized block type in live writer
        assert.ok(err);
        return true;
      }
    );
  });

  test('parsePersistedLessonContent safely converts MALFORMED persisted CHARACTER block to UNSUPPORTED placeholder without throwing', () => {
    const malformedCharacterBlock = {
      blockKey: 'char_malformed_1',
      type: 'CHARACTER',
      position: 1,
      schemaVersion: 1,
      content: {
        characterId: validUuid,
        showMeaning: true,
        showReading: true,
        showStrokeAnimation: true,
        guidedWriting: true,
        snapshot: {
          // Missing glyph, missing scriptType, etc.
          strokeCount: 5,
        },
      },
    };

    const parsed = parsePersistedLessonContent([malformedCharacterBlock]);
    assert.equal(parsed.contentSchemaVersion, 1);
    assert.equal(parsed.blocks.length, 1);

    const block = parsed.blocks[0];
    assert.equal(block.blockKey, 'char_malformed_1');
    assert.equal(block.type, 'UNSUPPORTED');
    assert.equal(block.originalType, 'CHARACTER');
    assert.equal(block.position, 1);
    assert.ok(block.message);
  });

  test('parsePersistedLessonContent projects valid persisted CHARACTER block to PublicCharacterBlock with strict allowlist and flag compliance', () => {
    const validBlock = {
      blockKey: 'char_valid_1',
      type: 'CHARACTER',
      position: 1,
      schemaVersion: 1,
      content: {
        characterId: validUuid,
        showMeaning: false, // meaning must be omitted!
        showReading: true,
        showStrokeAnimation: true,
        guidedWriting: false,
        snapshot: {
          glyph: '本',
          scriptType: 'KANJI',
          strokeCount: 5,
          meaning: 'Sách, gốc rễ',
          primaryReading: 'ほん',
          romanization: 'hon',
          metadata: { jlpt: 'N5', radical: '木' }, // metadata must be omitted!
          strokeVersion: 1,
        },
      },
    };

    // Default parser without opt-in preserves generic/admin/teacher fallback (UNSUPPORTED)
    const defaultParsed = parsePersistedLessonContent([validBlock]);
    assert.equal(defaultParsed.blocks[0].type, 'UNSUPPORTED');
    assert.equal(defaultParsed.blocks[0].originalType, 'CHARACTER');

    // Explicit opt-in for learner projects valid CHARACTER to PublicCharacterBlock
    const parsed = parsePersistedLessonContent([validBlock], { allowCharacter: true });
    assert.equal(parsed.contentSchemaVersion, 1);
    assert.equal(parsed.blocks.length, 1);

    const block = parsed.blocks[0];
    assert.equal(block.blockKey, 'char_valid_1');
    assert.equal(block.type, 'CHARACTER');
    assert.equal(block.position, 1);
    assert.equal(block.glyph, '本');
    assert.equal(block.scriptType, 'KANJI');
    assert.equal(block.strokeCount, 5);
    assert.equal(block.showMeaning, false);
    assert.equal(block.showReading, true);
    assert.equal(block.showStrokeAnimation, true);
    assert.equal(block.guidedWriting, false);
    assert.equal(block.strokeVersion, 1);

    // Strict allowlist: showMeaning=false => meaning is omitted
    assert.equal('meaning' in block, false);
    assert.equal('meaning' in block.content, false);

    // Reading is kept
    assert.equal(block.primaryReading, 'ほん');
    assert.equal(block.romanization, 'hon');

    // Strict allowlist: raw strokes or metadata are NEVER leaked
    assert.equal('metadata' in block, false);
    assert.equal('metadata' in block.content, false);
    assert.equal('strokes' in block, false);
    assert.equal('strokes' in block.content, false);
  });

  test('toLegacyParagraphProjection safely skips CHARACTER / UNSUPPORTED blocks without crashing', () => {
    const blocks = [
      {
        blockKey: 'heading_1',
        type: 'HEADING',
        position: 1,
        schemaVersion: 1,
        content: { level: 2, text: 'Bài học 1' },
      },
      {
        blockKey: 'char_1',
        type: 'UNSUPPORTED',
        position: 2,
        schemaVersion: 1,
        originalType: 'CHARACTER',
        message: 'Khối nội dung không được hỗ trợ trong phiên bản hiện tại.',
      },
      {
        blockKey: 'char_direct',
        type: 'CHARACTER',
        position: 3,
        schemaVersion: 1,
        content: {},
      },
      {
        blockKey: 'text_1',
        type: 'TEXT',
        position: 4,
        schemaVersion: 1,
        content: {
          nodes: [{ type: 'paragraph', runs: [{ text: 'Nội dung tiếp theo.' }] }],
        },
      },
    ];

    const paragraphs = toLegacyParagraphProjection(blocks);
    assert.equal(paragraphs.length, 2);
    assert.equal(paragraphs[0].text, 'Bài học 1');
    assert.equal(paragraphs[1].text, 'Nội dung tiếp theo.');
  });

  test('LessonContent component renders CHARACTER card with glyph, badges, and details', () => {
    const presentation = {
      contentSchemaVersion: 1,
      blocks: [
        {
          blockKey: 'char_ui_1',
          type: 'CHARACTER',
          position: 1,
          schemaVersion: 1,
          characterId: validUuid,
          glyph: '日',
          scriptType: 'KANJI',
          strokeCount: 4,
          showMeaning: true,
          showReading: true,
          showStrokeAnimation: true,
          guidedWriting: true,
          meaning: 'Mặt trời, ngày',
          primaryReading: 'にち',
          romanization: 'nichi',
          strokeVersion: 1,
        },
      ],
      vocabulary: [],
      exercises: [],
    };

    const html = renderToStaticMarkup(
      React.createElement(LessonContent, { presentation })
    );

    assert.ok(html.includes('lesson-character-char_ui_1'));
    assert.ok(html.includes('character-glyph-char_ui_1'));
    assert.ok(html.includes('日'));
    assert.ok(html.includes('KANJI'));
    assert.ok(html.includes('4 nét'));
    assert.ok(html.includes('Hoạt ảnh nét'));
    assert.ok(html.includes('Luyện viết'));
    assert.ok(html.includes('Mặt trời, ngày'));
    assert.ok(html.includes('にち'));
  });

  test('LessonContent exposes animation-only characters without enabling guided writing', () => {
    const renderCharacter = (flags) => renderToStaticMarkup(
      React.createElement(LessonContent, {
        onStartWritingPractice: () => {},
        presentation: {
          contentSchemaVersion: 1,
          blocks: [{
            blockKey: 'char_animation_only',
            type: 'CHARACTER',
            position: 1,
            schemaVersion: 1,
            characterId: validUuid,
            glyph: '日',
            scriptType: 'KANJI',
            strokeCount: 4,
            showMeaning: false,
            showReading: false,
            showStrokeAnimation: flags.showStrokeAnimation,
            guidedWriting: flags.guidedWriting,
          }],
          vocabulary: [],
          exercises: [],
        },
      })
    );

    const animationOnlyHtml = renderCharacter({ showStrokeAnimation: true, guidedWriting: false });
    assert.ok(animationOnlyHtml.includes('id="start-practice-btn-char_animation_only"'));
    assert.ok(animationOnlyHtml.includes('Xem thứ tự nét'));

    const staticHtml = renderCharacter({ showStrokeAnimation: false, guidedWriting: false });
    assert.ok(!staticHtml.includes('start-practice-btn-char_animation_only'));
  });

  test('LessonContent component safely renders UNSUPPORTED fallback placeholder for corrupt block', () => {
    const presentation = {
      contentSchemaVersion: 1,
      blocks: [
        {
          blockKey: 'char_unsupported_ui',
          type: 'UNSUPPORTED',
          position: 1,
          schemaVersion: 1,
          originalType: 'CHARACTER',
          message: 'Khối nội dung không được hỗ trợ trong phiên bản hiện tại.',
        },
      ],
      vocabulary: [],
      exercises: [],
    };

    const html = renderToStaticMarkup(
      React.createElement(LessonContent, { presentation })
    );

    assert.ok(html.includes('lingora-block-unsupported'));
    assert.ok(html.includes('Khối nội dung không được hỗ trợ trong phiên bản hiện tại.'));
  });
});
