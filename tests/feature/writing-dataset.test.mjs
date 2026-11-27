import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const dataset = JSON.parse(fs.readFileSync(new URL('../../lingora-admin/src/server/characters/data/writing-dataset.json', import.meta.url), 'utf8'));

test('writing dataset has kana, kanji and hanzi with valid normalised strokes', () => {
  const types = new Set(dataset.characters.map((c) => c.scriptType));
  for (const t of ['HIRAGANA', 'KATAKANA', 'KANJI', 'HANZI_SIMPLIFIED']) assert.ok(types.has(t), t);
  const seen = new Set();
  for (const c of dataset.characters) {
    const key = `${c.lang}:${c.glyph}`;
    assert.ok(!seen.has(key), `duplicate ${key}`);
    seen.add(key);
    assert.equal(c.strokes.length, c.strokeCount, key);
    let total = 0;
    for (const s of c.strokes) {
      assert.ok(s.length >= 2 && s.length <= 256, key);
      total += s.length;
      let len = 0;
      s.forEach(([x, y], i) => {
        assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1, key);
        if (i) len += Math.hypot(x - s[i - 1][0], y - s[i - 1][1]);
      });
      assert.ok(len > 1e-6, `${key} zero-length stroke`);
    }
    assert.ok(total <= 4096, key);
  }
  assert.ok(dataset.generatedFrom.kanjivg.license.includes('CC BY-SA'));
});
