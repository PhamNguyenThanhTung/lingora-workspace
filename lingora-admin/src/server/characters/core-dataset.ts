import fs from 'node:fs';
import type { PrismaClient } from '../../../generated/product-client/index.js';
import { createStroke, validateCharacterInput, isScriptTypeAllowedForLanguage } from './validator.ts';
import { seedCharacterStrokeData } from './strokes.ts';

const LANGUAGE_IDS: Record<string, string> = {
  ja: '00000000-0000-0000-0000-000000000003',
  zh: '00000000-0000-0000-0000-000000000004',
};

interface DatasetCharacter {
  lang: 'ja' | 'zh';
  glyph: string;
  scriptType: string;
  strokeCount: number;
  meaning?: string | null;
  reading?: string | null;
  romanization?: string | null;
  jlptLevel?: string | null;
  hskLevel?: number | null;
  strokes: Array<Array<[number, number]>>;
}

interface Dataset {
  generatedFrom: {
    kanjivg: { release: string; url: string; license: string; copyright: string };
    makemeahanzi: { url: string; license: string; note: string };
  };
  characters: DatasetCharacter[];
}

export function loadCoreWritingDataset(): Dataset {
  const url = new URL('./data/writing-dataset.json', import.meta.url);
  return JSON.parse(fs.readFileSync(url, 'utf8')) as Dataset;
}

export interface CoreWritingSeedResult {
  created: number;
  existing: number;
  strokeSeeded: number;
  total: number;
}

/**
 * Seeds kana, kanji and hanzi (catalogue + stroke data) for JA and ZH. Idempotent: existing characters are reused,
 * stroke data that already matches is a no-op and a mismatch raises STROKE_DATA_CONFLICT (never overwritten).
 */
export async function seedCoreWritingCharacters(
  prisma: PrismaClient,
  log: (msg: string) => void = () => {}
): Promise<CoreWritingSeedResult> {
  const dataset = loadCoreWritingDataset();
  const result: CoreWritingSeedResult = { created: 0, existing: 0, strokeSeeded: 0, total: dataset.characters.length };
  const trim = (v: string | null | undefined, n: number) => (v ? v.trim().slice(0, n) || null : null);

  for (const c of dataset.characters) {
    const languageId = LANGUAGE_IDS[c.lang];
    const isKana = c.scriptType === 'HIRAGANA' || c.scriptType === 'KATAKANA';
    const metadata: Record<string, unknown> = {};
    if (c.scriptType === 'HANZI_SIMPLIFIED') {
      metadata.hanziSystems = ['SIMPLIFIED'];
      if (c.reading) metadata.pinyin = [c.reading];
      if (c.hskLevel) metadata.hskLevel = c.hskLevel;
    }
    if (c.scriptType === 'KANJI' && c.jlptLevel && /^N[1-5]$/.test(c.jlptLevel)) metadata.jlptLevel = c.jlptLevel;

    let row = await prisma.writingCharacter.findUnique({ where: { languageId_glyph: { languageId, glyph: c.glyph } } });
    if (row) {
      if (row.strokeCount !== c.strokeCount) throw new Error(`[writing-seed] ${c.glyph}: existing strokeCount ${row.strokeCount} != ${c.strokeCount}`);
      result.existing++;
    } else {
      // The canonical language ids of the base seed (00000000-…-0003) are not RFC-4122 UUIDs, so the Zod language check
      // cannot be used verbatim; validate everything else with a placeholder id and write with the real one.
      const input = {
        languageId: '11111111-1111-4111-8111-111111111111',
        glyph: c.glyph,
        scriptType: c.scriptType,
        meaning: trim(c.meaning, 120),
        primaryReading: isKana || c.scriptType === 'HANZI_SIMPLIFIED' ? trim(c.reading, 40) : null,
        romanization: trim(c.romanization, 40),
        strokeCount: c.strokeCount,
        metadata,
      };
      const validation = validateCharacterInput(input);
      if (!validation.success) throw new Error(`[writing-seed] invalid character ${c.glyph}: ${validation.error.issues[0]?.message}`);
      if (!isScriptTypeAllowedForLanguage(c.lang, c.scriptType as any)) throw new Error(`[writing-seed] ${c.glyph}: script ${c.scriptType} not allowed for ${c.lang}`);
      row = await prisma.writingCharacter.create({
        data: {
          languageId,
          glyph: validation.data.glyph,
          scriptType: validation.data.scriptType,
          meaning: input.meaning,
          primaryReading: input.primaryReading,
          romanization: input.romanization,
          strokeCount: c.strokeCount,
          metadata: validation.data.metadata as any,
        },
      });
      result.created++;
    }

    const existingStroke = await prisma.characterStrokeData.findUnique({ where: { characterId: row.id } });
    const isKanjiVG = c.lang === 'ja';
    try { await seedCharacterStrokeData(
      {
        characterId: row.id,
        version: 1,
        strokes: c.strokes.map((pts, i) => createStroke(i + 1, pts)),
        source: isKanjiVG ? 'KanjiVG' : 'Make Me a Hanzi',
        license: isKanjiVG ? 'CC BY-SA 3.0' : 'Arphic Public License',
        provenance: isKanjiVG
          ? {
              author: 'Ulrich Apel and KanjiVG contributors',
              version: dataset.generatedFrom.kanjivg.release,
              attribution: 'KanjiVG © 2009-2013 Ulrich Apel, https://kanjivg.tagaini.net',
              licenseObligations: 'Creative Commons Attribution-ShareAlike 3.0: keep this attribution; derived stroke data stays under CC BY-SA 3.0.',
              notes: 'Cubic bezier paths sampled to polylines and normalised to [0,1].',
            }
          : {
              author: 'Shaunak Kishore and Make Me a Hanzi contributors',
              version: 'graphics.txt',
              attribution: 'Make Me a Hanzi, https://github.com/skishore/makemeahanzi (Arphic Public License)',
              licenseObligations: 'Arphic Public License: keep this notice with derived stroke data.',
              notes: 'Median polylines normalised to [0,1].',
            },
      },
      prisma
    ); } catch (e: any) { if (e?.code === 'VALIDATION_ERROR') e.message = `[writing-seed] ${c.glyph}: ${JSON.stringify(e.details?.issues?.slice(0, 2))}`; throw e; }
    if (!existingStroke) result.strokeSeeded++;
  }
  log(`characters total=${result.total} created=${result.created} existing=${result.existing} strokeSeeded=${result.strokeSeeded}`);
  return result;
}
