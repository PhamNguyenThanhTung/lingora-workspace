import type { LessonBlock } from './schema.ts';

export interface UnsupportedBlockDto {
  blockKey: string;
  type: 'UNSUPPORTED';
  position: number;
  schemaVersion: number;
  originalType: string;
  message: string;
}

export type PresentationBlock = LessonBlock | UnsupportedBlockDto;

export interface PublicVocabularyDisplaySnapshot {
  canonicalForm: string;
  senseKey?: string;
  meaningLabels: Record<string, string>;
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

  return {
    id: v.id,
    position: v.position,
    isCore: typeof v.isCore === 'boolean' ? v.isCore : true,
    displaySnapshot: {
      canonicalForm: typeof displaySnapshot.canonicalForm === 'string' ? displaySnapshot.canonicalForm : '',
      senseKey: typeof displaySnapshot.senseKey === 'string' ? displaySnapshot.senseKey : 'default',
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
