import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  segmentCanonicalForm,
  computeVocabularyCharacterMapping,
  validateVocabularyCharacterInput,
} from '../../src/server/characters/index.ts';

describe('S6-03: Grapheme Segmentation (Intl.Segmenter)', () => {
  test('segments Japanese text into discrete graphemes', () => {
    const segs = segmentCanonicalForm('日本語', 'ja');
    assert.deepEqual(segs, ['日', '本', '語']);
  });

  test('segments Chinese text into discrete graphemes', () => {
    const segs = segmentCanonicalForm('你好世界', 'zh');
    assert.deepEqual(segs, ['你', '好', '世', '界']);
  });

  test('segments text with repeated glyphs into distinct occurrences', () => {
    const segs = segmentCanonicalForm('人人', 'zh');
    assert.deepEqual(segs, ['人', '人']);
  });

  test('handles mixed scripts and punctuation with 1-based indexing positions', () => {
    const segs = segmentCanonicalForm('日・本', 'ja');
    assert.deepEqual(segs, ['日', '・', '本']);
  });

  test('preserves Unicode variation sequences as single graphemes', () => {
    const baseWithVS = '辻\u{E0100}';
    const segs = segmentCanonicalForm(baseWithVS, 'ja');
    assert.equal(segs.length, 1);
    assert.equal(segs[0], baseWithVS);
  });

  test('returns empty array for empty or non-string input', () => {
    assert.deepEqual(segmentCanonicalForm(''), []);
    assert.deepEqual(segmentCanonicalForm(null), []);
    assert.deepEqual(segmentCanonicalForm(undefined), []);
  });

  test('grapheme segmentation functions identically without depending on valid BCP-47 locale tags', () => {
    // Arbitrary internal codes should not throw RangeError or change standard grapheme clustering
    const resA = segmentCanonicalForm('日本語', 'custom-internal-code-123');
    const resB = segmentCanonicalForm('日本語');
    assert.deepEqual(resA, ['日', '本', '語']);
    assert.deepEqual(resB, ['日', '本', '語']);
  });
});

describe('S6-03: Vocabulary-to-Catalogue Character Mapping Algorithm', () => {
  const charNichi = { id: randomUUID(), glyph: '日' };
  const charHon = { id: randomUUID(), glyph: '本' };
  const charGo = { id: randomUUID(), glyph: '語' };
  const charHito = { id: randomUUID(), glyph: '人' };
  const charTabe = { id: randomUUID(), glyph: '食' };

  test('exact 日本語 order: maps all three characters at positions 1, 2, 3', () => {
    const catalogue = [charNichi, charHon, charGo];
    const mappings = computeVocabularyCharacterMapping('日本語', catalogue, 'ja');

    assert.equal(mappings.length, 3);
    assert.deepEqual(mappings, [
      { characterId: charNichi.id, position: 1, glyph: '日' },
      { characterId: charHon.id, position: 2, glyph: '本' },
      { characterId: charGo.id, position: 3, glyph: '語' },
    ]);
  });

  test('repeated glyph: maps to distinct positions 1 and 2 with the same characterId', () => {
    const catalogue = [charHito];
    const mappings = computeVocabularyCharacterMapping('人人', catalogue, 'zh');

    assert.equal(mappings.length, 2);
    assert.deepEqual(mappings, [
      { characterId: charHito.id, position: 1, glyph: '人' },
      { characterId: charHito.id, position: 2, glyph: '人' },
    ]);
    assert.equal(mappings[0].characterId, mappings[1].characterId);
    assert.notEqual(mappings[0].position, mappings[1].position);
  });

  test('missing character gap: omits uncatalogued characters while preserving 1-based positions of remaining glyphs', () => {
    // Word is "日a語": 'a' is not in catalogue
    const catalogue = [charNichi, charGo];
    const mappings = computeVocabularyCharacterMapping('日a語', catalogue, 'ja');

    assert.equal(mappings.length, 2);
    assert.deepEqual(mappings, [
      { characterId: charNichi.id, position: 1, glyph: '日' },
      { characterId: charGo.id, position: 3, glyph: '語' },
    ]);
    // Gap at position 2 is preserved
    assert.equal(mappings[0].position, 1);
    assert.equal(mappings[1].position, 3);
  });

  test('omits trailing uncatalogued characters (e.g. okurigana like 食べる when る is not in catalogue)', () => {
    const catalogue = [charTabe];
    const mappings = computeVocabularyCharacterMapping('食べる', catalogue, 'ja');

    assert.equal(mappings.length, 1);
    assert.deepEqual(mappings, [
      { characterId: charTabe.id, position: 1, glyph: '食' },
    ]);
  });

  test('returns empty array when no characters match the catalogue', () => {
    const catalogue = [charNichi, charHon];
    const mappings = computeVocabularyCharacterMapping('りんご', catalogue, 'ja');
    assert.deepEqual(mappings, []);
  });

  test('normalizes decomposed Unicode glyphs with NFC before matching catalogue', () => {
    // Composed 'が' vs decomposed 'か' + combining dakuten '\u3099'
    const charGa = { id: randomUUID(), glyph: 'が' };
    const decomposedGa = 'か\u3099';
    const mappings = computeVocabularyCharacterMapping(decomposedGa, [charGa], 'ja');

    assert.equal(mappings.length, 1);
    assert.equal(mappings[0].characterId, charGa.id);
    assert.equal(mappings[0].position, 1);
  });
});

describe('S6-03: VocabularyCharacter Input Validation Schema', () => {
  const valid = {
    id: randomUUID(),
    vocabularyId: randomUUID(),
    characterId: randomUUID(),
    position: 1,
  };

  test('accepts valid vocabulary character link input', () => {
    const res = validateVocabularyCharacterInput(valid);
    assert.equal(res.success, true);
  });

  test('rejects position < 1', () => {
    for (const badPos of [0, -1, -5]) {
      const res = validateVocabularyCharacterInput({ ...valid, position: badPos });
      assert.equal(res.success, false);
    }
  });

  test('rejects non-integer position', () => {
    const res = validateVocabularyCharacterInput({ ...valid, position: 1.5 });
    assert.equal(res.success, false);
  });

  test('rejects invalid UUIDs for vocabularyId and characterId', () => {
    assert.equal(validateVocabularyCharacterInput({ ...valid, vocabularyId: 'not-a-uuid' }).success, false);
    assert.equal(validateVocabularyCharacterInput({ ...valid, characterId: '123' }).success, false);
  });

  test('rejects extra unrecognized fields (strict parse)', () => {
    const res = validateVocabularyCharacterInput({ ...valid, extraField: 'forbidden' });
    assert.equal(res.success, false);
  });
});
