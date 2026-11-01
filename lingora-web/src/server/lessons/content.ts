import 'server-only';
import { z } from 'zod';
import { LessonServiceError, type LearnerExerciseDto, type LearnerVocabularyDto } from './dto.ts';

// Same public HTTPS reference contract accepted by staff publication; never fetch here.
function audioReference(raw: string) {
  if (!raw || raw.length > 2048) return false;
  try {
    const u = new URL(raw), h = u.hostname.toLowerCase();
    return u.protocol === 'https:' && !u.username && !u.password && !u.search && !u.hash && (!u.port || u.port === '443') && !/^\d{1,3}(\.\d{1,3}){3}$/.test(h) && !h.includes(':') && !h.startsWith('[') && !['.localhost', '.local', '.internal'].some(s => h.endsWith(s)) && /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(h);
  } catch { return false; }
}
const text = z.string(), options = z.array(z.object({ id: text, text }));
const prompts = {
  MCQ: z.object({ prompt: text, options }),
  FILL_BLANK: z.object({ prompt: text, sentence: text }),
  REORDER: z.object({ prompt: text, tokens: options }),
  LISTENING: z.object({ prompt: text, options, audioUrl: text.refine(audioReference) }),
  GRAMMAR: z.object({ prompt: text, sourceSentence: text, targetPattern: text }),
};
export function publicExercise(ex: { id: string; itemId: string; itemRevisionId: string; position: number; isCore: boolean; itemRevision: { type: string; schemaVersion: number; promptData: unknown } }): LearnerExerciseDto {
  const type = ex.itemRevision.type as keyof typeof prompts;
  const parsed = prompts[type]?.safeParse(ex.itemRevision.promptData);
  if (ex.itemRevision.schemaVersion !== 1 || !parsed?.success) throw new LessonServiceError(409, 'CONTENT_INCONSISTENT', 'Định dạng bài tập không được hỗ trợ.');
  return { id: ex.id, itemId: ex.itemId, itemRevisionId: ex.itemRevisionId, position: ex.position, isCore: ex.isCore, type, schemaVersion: 1, promptData: parsed.data };
}
const snapshot = z.object({ schemaVersion: z.literal(1).optional(), languageId: text.optional(), canonicalForm: text, senseKey: text.optional(), meaningLabels: z.record(text, text), phonetic: text.nullable().optional(), partOfSpeech: text.nullable().optional(), example: text.nullable().optional() });
export function publicVocabulary(link: { id: string; position: number; isCore: boolean; displaySnapshot: unknown }): LearnerVocabularyDto {
  const parsed = snapshot.safeParse(link.displaySnapshot);
  if (!parsed.success) throw new LessonServiceError(409, 'CONTENT_INCONSISTENT', 'Định dạng từ vựng không được hỗ trợ.');
  return { id: link.id, position: link.position, isCore: link.isCore, displaySnapshot: parsed.data };
}
