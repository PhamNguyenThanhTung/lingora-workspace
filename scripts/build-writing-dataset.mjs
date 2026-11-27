#!/usr/bin/env node
/**
 * Builds lingora-admin/src/server/characters/data/writing-dataset.json (committed) from two open stroke sources:
 *   - KanjiVG (CC BY-SA 3.0)           → Japanese kana + kanji   (SVG cubic paths, 109×109, y down)
 *   - Make Me a Hanzi (Arphic PL / LGPL) → Chinese hanzi        (median polylines, 1024 units, y up)
 * Character sets are the kana syllabaries plus every Han character used by the seeded core JA / ZH course vocabulary.
 *
 * Usage: node --experimental-strip-types scripts/build-writing-dataset.mjs <dir-with-kanjivg.xml,graphics.txt,dictionary.txt>
 * Source files are only parsed as data; nothing from them is executed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = process.argv[2];
if (!dir) { console.error('usage: build-writing-dataset.mjs <source-dir>'); process.exit(1); }
const { CORE_COURSES } = await import(pathToFileURL(path.join(repoRoot, 'lingora-admin/src/server/curriculum/core-courses/index.ts')).href);

// ---------- geometry ----------
function tokenize(d) {
  return d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
}
const ARGS = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, Z: 0 };
function samplePath(d, steps = 8) {
  const t = tokenize(d);
  let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, lcx = null, lcy = null, lqx = null, lqy = null;
  const pts = [];
  const num = () => parseFloat(t[i++]);
  while (i < t.length) {
    if (/[a-zA-Z]/.test(t[i])) cmd = t[i++];
    const up = cmd.toUpperCase();
    const rel = cmd !== up;
    if (up === 'Z') { x = sx; y = sy; lcx = lcy = lqx = lqy = null; continue; }
    const a = []; for (let k = 0; k < ARGS[up]; k++) a.push(num());
    const ox = rel ? x : 0, oy = rel ? y : 0;
    if (up === 'M') { x = ox + a[0]; y = oy + a[1]; sx = x; sy = y; pts.push([x, y]); cmd = rel ? 'l' : 'L'; lcx = lcy = lqx = lqy = null; }
    else if (up === 'L') { x = ox + a[0]; y = oy + a[1]; pts.push([x, y]); lcx = lcy = lqx = lqy = null; }
    else if (up === 'H') { x = (rel ? x : 0) + a[0]; pts.push([x, y]); lcx = lcy = lqx = lqy = null; }
    else if (up === 'V') { y = (rel ? y : 0) + a[0]; pts.push([x, y]); lcx = lcy = lqx = lqy = null; }
    else if (up === 'C' || up === 'S') {
      let c1x, c1y, c2x, c2y, ex, ey;
      if (up === 'C') { c1x = ox + a[0]; c1y = oy + a[1]; c2x = ox + a[2]; c2y = oy + a[3]; ex = ox + a[4]; ey = oy + a[5]; }
      else { c1x = lcx == null ? x : 2 * x - lcx; c1y = lcy == null ? y : 2 * y - lcy; c2x = ox + a[0]; c2y = oy + a[1]; ex = ox + a[2]; ey = oy + a[3]; }
      for (let s = 1; s <= steps; s++) {
        const u = s / steps, v = 1 - u;
        pts.push([v ** 3 * x + 3 * v * v * u * c1x + 3 * v * u * u * c2x + u ** 3 * ex, v ** 3 * y + 3 * v * v * u * c1y + 3 * v * u * u * c2y + u ** 3 * ey]);
      }
      lcx = c2x; lcy = c2y; x = ex; y = ey; lqx = lqy = null;
    } else if (up === 'Q' || up === 'T') {
      let qx, qy, ex, ey;
      if (up === 'Q') { qx = ox + a[0]; qy = oy + a[1]; ex = ox + a[2]; ey = oy + a[3]; }
      else { qx = lqx == null ? x : 2 * x - lqx; qy = lqy == null ? y : 2 * y - lqy; ex = ox + a[0]; ey = oy + a[1]; }
      for (let s = 1; s <= steps; s++) {
        const u = s / steps, v = 1 - u;
        pts.push([v * v * x + 2 * v * u * qx + u * u * ex, v * v * y + 2 * v * u * qy + u * u * ey]);
      }
      lqx = qx; lqy = qy; x = ex; y = ey; lcx = lcy = null;
    } else throw new Error(`unsupported path command ${cmd}`);
  }
  return pts;
}
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
  let max = 0, idx = 0;
  for (let k = 1; k < pts.length - 1; k++) {
    const dist = len < 1e-9 ? Math.hypot(pts[k][0] - ax, pts[k][1] - ay) : Math.abs(dy * pts[k][0] - dx * pts[k][1] + bx * ay - by * ax) / len;
    if (dist > max) { max = dist; idx = k; }
  }
  if (max <= eps) return [pts[0], pts[pts.length - 1]];
  return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)];
}
const clamp = (v) => Math.min(1, Math.max(0, v));
const round = (v) => Math.round(v * 10000) / 10000;
function finish(pts, eps) {
  const dedup = pts.filter((p, k) => k === 0 || Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1]) > 1e-6);
  const out = rdp(dedup, eps).map(([x, y]) => [round(clamp(x)), round(clamp(y))]);
  return out.length >= 2 ? out : null;
}

// ---------- KanjiVG ----------
const kvg = new Map();
{
  const xml = fs.readFileSync(path.join(dir, 'kanjivg.xml'), 'utf8');
  for (const m of xml.matchAll(/<kanji id="kvg:kanji_([0-9a-f]{5})">([\s\S]*?)<\/kanji>/g)) {
    const strokes = [...m[2].matchAll(/<path id="kvg:[0-9a-f]+-s\d+"[^>]* d="([^"]+)"/g)].map((p) => p[1]);
    kvg.set(String.fromCodePoint(parseInt(m[1], 16)), strokes);
  }
}
function fromKanjiVG(glyph) {
  const paths = kvg.get(glyph);
  if (!paths?.length) return null;
  const strokes = paths.map((d) => finish(samplePath(d).map(([x, y]) => [x / 109, y / 109]), 0.006));
  return strokes.every(Boolean) ? strokes : null;
}

// ---------- Make Me a Hanzi ----------
const mmh = new Map();
for (const line of fs.readFileSync(path.join(dir, 'graphics.txt'), 'utf8').split('\n')) {
  if (!line.trim()) continue;
  const o = JSON.parse(line);
  mmh.set(o.character, o.medians);
}
const dict = new Map();
for (const line of fs.readFileSync(path.join(dir, 'dictionary.txt'), 'utf8').split('\n')) {
  if (!line.trim()) continue;
  const o = JSON.parse(line);
  dict.set(o.character, o);
}
function fromMMH(glyph) {
  const medians = mmh.get(glyph);
  if (!medians?.length) return null;
  const strokes = medians.map((m) => finish(m.map(([x, y]) => [x / 1024, (900 - y) / 1024]), 0.004));
  return strokes.every(Boolean) ? strokes : null;
}

// ---------- kana ----------
const HIRA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ';
const ROMAJI = ['a','i','u','e','o','ka','ki','ku','ke','ko','sa','shi','su','se','so','ta','chi','tsu','te','to','na','ni','nu','ne','no','ha','hi','fu','he','ho','ma','mi','mu','me','mo','ya','yu','yo','ra','ri','ru','re','ro','wa','wo','n','ga','gi','gu','ge','go','za','ji','zu','ze','zo','da','ji','zu','de','do','ba','bi','bu','be','bo','pa','pi','pu','pe','po'];
const toKata = (s) => [...s].map((c) => String.fromCodePoint(c.codePointAt(0) + 0x60)).join('');
const hira = [...HIRA];
if (hira.length !== ROMAJI.length) throw new Error('kana table mismatch');

// ---------- assemble ----------
const characters = [];
const skipped = [];
function add(lang, glyph, scriptType, strokes, extra) {
  if (!strokes) { skipped.push(`${lang}:${glyph}`); return; }
  characters.push({ lang, glyph, scriptType, strokeCount: strokes.length, ...extra, strokes });
}
hira.forEach((g, k) => {
  add('ja', g, 'HIRAGANA', fromKanjiVG(g), { reading: g, romanization: ROMAJI[k] });
  const kg = toKata(g);
  add('ja', kg, 'KATAKANA', fromKanjiVG(kg), { reading: kg, romanization: ROMAJI[k] });
});
const han = (key) => {
  const set = new Set();
  for (const u of CORE_COURSES[key].units) for (const l of u.lessons) for (const v of l.vocab) for (const ch of v[0].match(/\p{Script=Han}/gu) ?? []) set.add(ch);
  return [...set];
};
const level = { ja: new Map(), zh: new Map() };
for (const key of ['ja', 'zh']) {
  for (const u of CORE_COURSES[key].units) for (const l of u.lessons) for (const v of l.vocab) for (const ch of v[0].match(/\p{Script=Han}/gu) ?? []) if (!level[key].has(ch)) level[key].set(ch, u.level);
}
for (const g of han('ja')) {
  const d = dict.get(g);
  add('ja', g, 'KANJI', fromKanjiVG(g), { meaning: d?.definition?.split(/[;,]/)[0]?.trim() || null, jlptLevel: level.ja.get(g) });
}
for (const g of han('zh')) {
  const d = dict.get(g);
  const py = d?.pinyin?.[0] ?? null;
  add('zh', g, 'HANZI_SIMPLIFIED', fromMMH(g), { meaning: d?.definition?.split(/[;,]/)[0]?.trim() || null, reading: py, hskLevel: Number(level.zh.get(g)?.replace('HSK', '')) || null });
}

const dataset = {
  generatedFrom: {
    kanjivg: { release: 'r20260714', url: 'https://kanjivg.tagaini.net', license: 'CC BY-SA 3.0', copyright: '2009-2013 Ulrich Apel' },
    makemeahanzi: { url: 'https://github.com/skishore/makemeahanzi', license: 'Arphic Public License (graphics), medians derived', note: 'Median polylines normalised to [0,1]' },
  },
  characters,
};
const out = path.join(repoRoot, 'lingora-admin/src/server/characters/data/writing-dataset.json');
fs.writeFileSync(out, JSON.stringify(dataset));
const by = {};
for (const c of characters) by[`${c.lang}/${c.scriptType}`] = (by[`${c.lang}/${c.scriptType}`] || 0) + 1;
console.log('characters', characters.length, by, 'bytes', fs.statSync(out).size);
console.log('skipped (no source strokes):', skipped.length, skipped.join(' '));
