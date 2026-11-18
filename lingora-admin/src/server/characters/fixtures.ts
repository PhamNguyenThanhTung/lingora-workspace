import { getProductPrisma } from '../db/index.js';
import type { PrismaClient } from '../../../generated/product-client/index.js';
import {
  createStroke,
  type Stroke,
  type StrokeProvenance,
  type WritingScriptType,
  type WritingCharacterMetadata,
} from './validator.ts';
import { createCharacter } from './catalogue.ts';
import { seedCharacterStrokeData } from './strokes.ts';

export const SELF_AUTHORED_PROVENANCE: StrokeProvenance = {
  author: 'Lingora Calligraphy & Pedagogy Team',
  version: '1.0.0',
  attribution: 'Self-authored normalized geometric coordinates for Lingora character engine',
  licenseObligations: 'None (CC0-1.0 Universal Public Domain Dedication)',
  createdAt: '2026-11-15T00:00:00.000Z',
  notes: 'Hand-crafted normalized [0,1] coordinates with SVG M/L geometric pathing',
};

export const SELF_AUTHORED_SOURCE = 'Lingora Self-Authored Geometric Stroke Fixtures';
export const SELF_AUTHORED_LICENSE = 'CC0-1.0 Universal';

export interface SelfAuthoredCharacterFixture {
  languageCode: 'ja' | 'zh';
  glyph: string;
  scriptType: WritingScriptType;
  meaning: string | null;
  primaryReading: string | null;
  romanization: string | null;
  strokeCount: number;
  metadata?: WritingCharacterMetadata;
  strokes: Stroke[];
  source: string;
  license: string;
  provenance: StrokeProvenance;
}

export const SELF_AUTHORED_FIXTURES: SelfAuthoredCharacterFixture[] = [
  // --- Japanese Fixtures ---
  {
    languageCode: 'ja',
    glyph: '一',
    scriptType: 'KANJI',
    meaning: 'one',
    primaryReading: 'いち',
    romanization: 'ichi',
    strokeCount: 1,
    metadata: {
      jlptLevel: 'N5',
      gradeLevel: 1,
    },
    strokes: [
      createStroke(1, [
        [0.2, 0.5],
        [0.5, 0.5],
        [0.8, 0.5],
      ]),
    ],
    source: SELF_AUTHORED_SOURCE,
    license: SELF_AUTHORED_LICENSE,
    provenance: SELF_AUTHORED_PROVENANCE,
  },
  {
    languageCode: 'ja',
    glyph: '二',
    scriptType: 'KANJI',
    meaning: 'two',
    primaryReading: 'に',
    romanization: 'ni',
    strokeCount: 2,
    metadata: {
      jlptLevel: 'N5',
      gradeLevel: 1,
    },
    strokes: [
      createStroke(1, [
        [0.3, 0.35],
        [0.5, 0.35],
        [0.7, 0.35],
      ]),
      createStroke(2, [
        [0.2, 0.65],
        [0.5, 0.65],
        [0.8, 0.65],
      ]),
    ],
    source: SELF_AUTHORED_SOURCE,
    license: SELF_AUTHORED_LICENSE,
    provenance: SELF_AUTHORED_PROVENANCE,
  },
  {
    languageCode: 'ja',
    glyph: '十',
    scriptType: 'KANJI',
    meaning: 'ten',
    primaryReading: 'じゅう',
    romanization: 'juu',
    strokeCount: 2,
    metadata: {
      jlptLevel: 'N5',
      gradeLevel: 1,
    },
    strokes: [
      createStroke(1, [
        [0.2, 0.5],
        [0.5, 0.5],
        [0.8, 0.5],
      ]),
      createStroke(2, [
        [0.5, 0.2],
        [0.5, 0.5],
        [0.5, 0.8],
      ]),
    ],
    source: SELF_AUTHORED_SOURCE,
    license: SELF_AUTHORED_LICENSE,
    provenance: SELF_AUTHORED_PROVENANCE,
  },
  {
    languageCode: 'ja',
    glyph: 'い',
    scriptType: 'HIRAGANA',
    meaning: null,
    primaryReading: 'い',
    romanization: 'i',
    strokeCount: 2,
    strokes: [
      createStroke(1, [
        [0.3, 0.25],
        [0.28, 0.5],
        [0.35, 0.75],
      ]),
      createStroke(2, [
        [0.7, 0.35],
        [0.72, 0.55],
      ]),
    ],
    source: SELF_AUTHORED_SOURCE,
    license: SELF_AUTHORED_LICENSE,
    provenance: SELF_AUTHORED_PROVENANCE,
  },

  // --- Chinese Fixtures ---
  {
    languageCode: 'zh',
    glyph: '一',
    scriptType: 'HANZI_SIMPLIFIED',
    meaning: 'one',
    primaryReading: 'yī',
    romanization: 'yi1',
    strokeCount: 1,
    metadata: {
      hanziSystems: ['SIMPLIFIED', 'TRADITIONAL'],
      pinyin: ['yī'],
      tones: [1],
      hskLevel: 1,
    },
    strokes: [
      createStroke(1, [
        [0.2, 0.5],
        [0.5, 0.5],
        [0.8, 0.5],
      ]),
    ],
    source: SELF_AUTHORED_SOURCE,
    license: SELF_AUTHORED_LICENSE,
    provenance: SELF_AUTHORED_PROVENANCE,
  },
  {
    languageCode: 'zh',
    glyph: '二',
    scriptType: 'HANZI_SIMPLIFIED',
    meaning: 'two',
    primaryReading: 'èr',
    romanization: 'er4',
    strokeCount: 2,
    metadata: {
      hanziSystems: ['SIMPLIFIED', 'TRADITIONAL'],
      pinyin: ['èr'],
      tones: [4],
      hskLevel: 1,
    },
    strokes: [
      createStroke(1, [
        [0.3, 0.35],
        [0.5, 0.35],
        [0.7, 0.35],
      ]),
      createStroke(2, [
        [0.2, 0.65],
        [0.5, 0.65],
        [0.8, 0.65],
      ]),
    ],
    source: SELF_AUTHORED_SOURCE,
    license: SELF_AUTHORED_LICENSE,
    provenance: SELF_AUTHORED_PROVENANCE,
  },
  {
    languageCode: 'zh',
    glyph: '十',
    scriptType: 'HANZI_SIMPLIFIED',
    meaning: 'ten',
    primaryReading: 'shí',
    romanization: 'shi2',
    strokeCount: 2,
    metadata: {
      hanziSystems: ['SIMPLIFIED', 'TRADITIONAL'],
      pinyin: ['shí'],
      tones: [2],
      hskLevel: 1,
    },
    strokes: [
      createStroke(1, [
        [0.2, 0.5],
        [0.5, 0.5],
        [0.8, 0.5],
      ]),
      createStroke(2, [
        [0.5, 0.2],
        [0.5, 0.5],
        [0.5, 0.8],
      ]),
    ],
    source: SELF_AUTHORED_SOURCE,
    license: SELF_AUTHORED_LICENSE,
    provenance: SELF_AUTHORED_PROVENANCE,
  },
  {
    languageCode: 'zh',
    glyph: '人',
    scriptType: 'HANZI_SIMPLIFIED',
    meaning: 'person',
    primaryReading: 'rén',
    romanization: 'ren2',
    strokeCount: 2,
    metadata: {
      hanziSystems: ['SIMPLIFIED', 'TRADITIONAL'],
      pinyin: ['rén'],
      tones: [2],
      hskLevel: 1,
    },
    strokes: [
      createStroke(1, [
        [0.5, 0.2],
        [0.35, 0.5],
        [0.2, 0.8],
      ]),
      createStroke(2, [
        [0.42, 0.45],
        [0.6, 0.65],
        [0.8, 0.8],
      ]),
    ],
    source: SELF_AUTHORED_SOURCE,
    license: SELF_AUTHORED_LICENSE,
    provenance: SELF_AUTHORED_PROVENANCE,
  },
];

/**
 * Seeds self-authored Japanese and Chinese fixtures into the database idempotently.
 * Replays safely without duplicate entries or modifications.
 */
export async function seedSelfAuthoredFixtures(
  params: { jaLanguageId: string; zhLanguageId: string },
  db?: PrismaClient
) {
  const client = db ?? getProductPrisma();
  const results = [];

  for (const item of SELF_AUTHORED_FIXTURES) {
    const languageId = item.languageCode === 'ja' ? params.jaLanguageId : params.zhLanguageId;

    // 1. Find or create character
    let character = await client.writingCharacter.findUnique({
      where: {
        languageId_glyph: {
          languageId,
          glyph: item.glyph,
        },
      },
    });

    if (!character) {
      character = await createCharacter(
        {
          languageId,
          glyph: item.glyph,
          scriptType: item.scriptType,
          meaning: item.meaning,
          primaryReading: item.primaryReading,
          romanization: item.romanization,
          strokeCount: item.strokeCount,
          metadata: item.metadata ?? {},
        },
        client
      );
    }

    // 2. Seed stroke data idempotently
    const strokeData = await seedCharacterStrokeData(
      {
        characterId: character.id,
        version: 1,
        strokes: item.strokes,
        source: item.source,
        license: item.license,
        provenance: item.provenance,
      },
      client
    );

    results.push({ character, strokeData });
  }

  return results;
}
