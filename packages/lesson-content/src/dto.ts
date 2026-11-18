import type { LessonBlock } from './schema.ts';

export interface UnsupportedBlockDto {
  blockKey: string;
  type: 'UNSUPPORTED';
  position: number;
  schemaVersion: number;
  originalType: string;
  message: string;
}

export interface PublicCharacterBlock {
  blockKey: string;
  type: 'CHARACTER';
  position: number;
  schemaVersion: number;
  characterId: string;
  glyph: string;
  scriptType: string;
  strokeCount: number;
  showMeaning: boolean;
  showReading: boolean;
  showStrokeAnimation: boolean;
  guidedWriting: boolean;
  meaning?: string;
  primaryReading?: string;
  romanization?: string;
  strokeVersion?: number;
  content?: {
    characterId: string;
    glyph: string;
    scriptType: string;
    strokeCount: number;
    showMeaning: boolean;
    showReading: boolean;
    showStrokeAnimation: boolean;
    guidedWriting: boolean;
    meaning?: string;
    primaryReading?: string;
    romanization?: string;
    strokeVersion?: number;
  };
}

export type PresentationBlock = LessonBlock | UnsupportedBlockDto | PublicCharacterBlock;

export interface PublicVocabularyDisplaySnapshot {
  canonicalForm: string;
  senseKey?: string;
  meaningLabels: Record<string, string>;
  characters?: Array<{
    characterId: string;
    position: number;
    glyph: string;
    scriptType: string;
    meaning?: string | null;
    primaryReading?: string | null;
    romanization?: string | null;
    strokeCount?: number;
    strokeVersion?: number | null;
  }>;
  phonetic?: string | null;
  partOfSpeech?: string | null;
  example?: string | null;
}

export interface PublicVocabularyDto {
  id: string;
  position: number;
  isCore: boolean;
  displaySnapshot: PublicVocabularyDisplaySnapshot;
}

export type PublicExerciseType = 'MCQ' | 'FILL_BLANK' | 'REORDER' | 'LISTENING' | 'GRAMMAR';

export interface PublicExerciseDto {
  id: string;
  itemId: string;
  itemRevisionId: string;
  position: number;
  isCore: boolean;
  type: PublicExerciseType;
  schemaVersion: number;
  promptData: unknown;
}

export interface LessonPresentationDto {
  contentSchemaVersion: number;
  blocks: PresentationBlock[];
  vocabulary: PublicVocabularyDto[];
  exercises: PublicExerciseDto[];
}

export function sanitizePublicPromptData(type: string, promptData: unknown): Record<string, unknown> {
  if (!promptData || typeof promptData !== 'object') {
    return { prompt: '' };
  }
  const p = promptData as Record<string, unknown>;
  const prompt = typeof p.prompt === 'string' ? p.prompt : '';

  switch (type) {
    case 'MCQ': {
      const options = Array.isArray(p.options)
        ? p.options.map((opt: unknown) => {
            const o = opt && typeof opt === 'object' ? (opt as Record<string, unknown>) : {};
            return {
              id: typeof o.id === 'string' ? o.id : '',
              text: typeof o.text === 'string' ? o.text : '',
            };
          })
        : [];
      return { prompt, options };
    }

    case 'FILL_BLANK': {
      const sentence = typeof p.sentence === 'string' ? p.sentence : '';
      return { prompt, sentence };
    }

    case 'REORDER': {
      const tokens = Array.isArray(p.tokens)
        ? p.tokens.map((tok: unknown) => {
            const t = tok && typeof tok === 'object' ? (tok as Record<string, unknown>) : {};
            return {
              id: typeof t.id === 'string' ? t.id : '',
              text: typeof t.text === 'string' ? t.text : '',
            };
          })
        : [];
      return { prompt, tokens };
    }

    case 'LISTENING': {
      const audioUrl = typeof p.audioUrl === 'string' ? p.audioUrl : '';
      const options = Array.isArray(p.options)
        ? p.options.map((opt: unknown) => {
            const o = opt && typeof opt === 'object' ? (opt as Record<string, unknown>) : {};
            return {
              id: typeof o.id === 'string' ? o.id : '',
              text: typeof o.text === 'string' ? o.text : '',
            };
          })
        : [];
      return { prompt, audioUrl, options };
    }

    case 'GRAMMAR': {
      const sourceSentence = typeof p.sourceSentence === 'string' ? p.sourceSentence : '';
      const targetPattern = typeof p.targetPattern === 'string' ? p.targetPattern : '';
      return { prompt, sourceSentence, targetPattern };
    }

    default: {
      return { prompt };
    }
  }
}

export function sanitizePublicExercise(raw: unknown): PublicExerciseDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const ex = raw as Record<string, unknown>;
  if (typeof ex.id !== 'string' || typeof ex.position !== 'number') return null;

  const type = (typeof ex.type === 'string' ? ex.type : '') as PublicExerciseType;
  const promptData = sanitizePublicPromptData(type, ex.promptData);

  return {
    id: ex.id,
    itemId: typeof ex.itemId === 'string' ? ex.itemId : ex.id,
    itemRevisionId: typeof ex.itemRevisionId === 'string' ? ex.itemRevisionId : ex.id,
    position: ex.position,
    isCore: typeof ex.isCore === 'boolean' ? ex.isCore : true,
    type,
    schemaVersion: typeof ex.schemaVersion === 'number' ? ex.schemaVersion : 1,
    promptData,
    // Explicitly NO gradingData, NO correctOptionId, NO secrets attached!
  };
}

export function sanitizePublicVocabulary(raw: unknown): PublicVocabularyDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  if (typeof v.id !== 'string' || typeof v.position !== 'number') return null;

  const displaySnapshot = (v.displaySnapshot && typeof v.displaySnapshot === 'object'
    ? v.displaySnapshot
    : {}) as Record<string, unknown>;
  const characters = Array.isArray(displaySnapshot.characters)
    ? displaySnapshot.characters
        .map((rawCharacter) => {
          if (!rawCharacter || typeof rawCharacter !== 'object') return null;
          const character = rawCharacter as Record<string, unknown>;
          if (
            typeof character.characterId !== 'string' ||
            typeof character.position !== 'number' || !Number.isInteger(character.position) ||
            typeof character.glyph !== 'string' || typeof character.scriptType !== 'string'
          ) return null;
          return {
            characterId: character.characterId,
            position: character.position,
            glyph: character.glyph,
            scriptType: character.scriptType,
            ...(typeof character.meaning === 'string' || character.meaning === null
              ? { meaning: character.meaning as string | null }
              : {}),
            ...(typeof character.primaryReading === 'string' || character.primaryReading === null
              ? { primaryReading: character.primaryReading as string | null }
              : {}),
            ...(typeof character.romanization === 'string' || character.romanization === null
              ? { romanization: character.romanization as string | null }
              : {}),
            ...(typeof character.strokeCount === 'number' && Number.isInteger(character.strokeCount)
              ? { strokeCount: character.strokeCount }
              : {}),
            ...(typeof character.strokeVersion === 'number' && Number.isInteger(character.strokeVersion)
              ? { strokeVersion: character.strokeVersion }
              : character.strokeVersion === null ? { strokeVersion: null } : {}),
          };
        })
        .filter((character): character is NonNullable<typeof character> => character !== null)
        .sort((a, b) => a.position - b.position)
    : undefined;

  return {
    id: v.id,
    position: v.position,
    isCore: typeof v.isCore === 'boolean' ? v.isCore : true,
    displaySnapshot: {
      canonicalForm: typeof displaySnapshot.canonicalForm === 'string' ? displaySnapshot.canonicalForm : '',
      senseKey: typeof displaySnapshot.senseKey === 'string' ? displaySnapshot.senseKey : 'default',
      ...(characters ? { characters } : {}),
      meaningLabels: (displaySnapshot.meaningLabels && typeof displaySnapshot.meaningLabels === 'object'
        ? displaySnapshot.meaningLabels
        : {}) as Record<string, string>,
      phonetic: typeof displaySnapshot.phonetic === 'string' ? displaySnapshot.phonetic : null,
      partOfSpeech: typeof displaySnapshot.partOfSpeech === 'string' ? displaySnapshot.partOfSpeech : null,
      example: typeof displaySnapshot.example === 'string' ? displaySnapshot.example : null,
    },
  };
}

export function toLessonPresentationDto(
  content: { contentSchemaVersion?: number; blocks: PresentationBlock[] } | PresentationBlock[],
  publicVocabulary: unknown[] = [],
  publicExercises: unknown[] = []
): LessonPresentationDto {
  const contentSchemaVersion = Array.isArray(content)
    ? 1
    : typeof content.contentSchemaVersion === 'number'
      ? content.contentSchemaVersion
      : 1;

  const rawBlocks = Array.isArray(content) ? content : content.blocks ?? [];
  const blocks = [...rawBlocks].sort((a, b) => a.position - b.position);

  const cleanVocab = publicVocabulary
    .map(sanitizePublicVocabulary)
    .filter((v): v is PublicVocabularyDto => v !== null)
    .sort((a, b) => a.position - b.position);

  const cleanExercises = publicExercises
    .map(sanitizePublicExercise)
    .filter((e): e is PublicExerciseDto => e !== null)
    .sort((a, b) => a.position - b.position);

  return {
    contentSchemaVersion,
    blocks,
    vocabulary: cleanVocab,
    exercises: cleanExercises,
  };
}
