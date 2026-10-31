import { z } from 'zod';
import { exerciseInputSchema } from './content.ts';
import { isValidUuid } from '../frameworks/index.ts';

export const revisionChildRelations = {
  authoredItemRevisions: {
    where: { item: { is: { origin: 'ASSESSMENT' } } },
    orderBy: [{ itemId: 'asc' }, { revisionNo: 'asc' }],
    include: {
      item: true,
      gradingSecret: true,
      assessmentBlueprint: { select: { id: true } },
      _count: { select: { mediaBindings: true, assessmentVersionItems: true, provenanceVersionItems: true } },
    },
  },
  exercises: { orderBy: { position: 'asc' }, include: {
    item: true,
    itemRevision: { include: { gradingSecret: true, _count: { select: {
      mediaBindings: true, assessmentVersionItems: true, provenanceVersionItems: true,
    } } } },
  } },
  vocabularyLinks: { orderBy: { position: 'asc' }, include: { vocabulary: true } },
};
const labels = z.record(z.string(), z.string());
export const vocabularySnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  languageId: z.string().refine(isValidUuid),
  canonicalForm: z.string().trim().min(1).max(300),
  senseKey: z.string().trim().min(1).max(100).optional(),
  meaningLabels: labels.refine(v => Object.values(v).some(s => s.trim())),
  phonetic: z.string().max(300).nullable().optional(),
  partOfSpeech: z.string().max(100).nullable().optional(),
  example: z.string().max(4000).nullable().optional(),
}).strict();

export function unsupportedChildren(rev: any, languageId?: string, allowFrozenPredecessor = false): boolean {
  if (!rev) return false;
  const c = rev._count || {};
  // Assessment version pins are immutable references. They do not prevent a new
  // lesson/item revision from being authored; the older pinned revision remains exact.
  if (c.mediaBindings > 0 || c.attempts > 0) return true;
  const exercises = rev.exercises || [], vocabulary = rev.vocabularyLinks || [];
  const assessmentItems = (rev.authoredItemRevisions || []).filter((ir: any) => ir?.item?.origin === 'ASSESSMENT');
  if (!Array.isArray(exercises) || !Array.isArray(vocabulary) || !Array.isArray(assessmentItems)) return true;
  if ((c.exercises ?? 0) !== exercises.length || (c.vocabularyLinks ?? 0) !== vocabulary.length ||
      (c.authoredItemRevisions ?? 0) !== new Set(exercises.map((e: any) => e.itemRevisionId)).size + assessmentItems.length) return true;
  for (const ex of exercises) {
    const ir = ex.itemRevision, secret = ir?.gradingSecret;
    if (ex.lessonRevisionId !== rev.id || !ir || ir.id !== ex.itemRevisionId || ir.itemId !== ex.itemId ||
        ex.item?.id !== ex.itemId || ex.item.origin !== 'PRACTICE' || ir.authoringLessonRevisionId !== rev.id ||
        ir.createdBy !== rev.createdBy || ir.creationAssignmentEpisodeId !== rev.creationAssignmentEpisodeId ||
        ir.schemaVersion !== 1 || !secret || secret.schemaVersion !== 1 ||
        ir.isDraftOmitted || (!allowFrozenPredecessor && ir.frozenAt != null) || ir.assessmentBlueprintId != null || ir.blueprintGeneration != null ||
        ir._count?.mediaBindings > 0 || ir._count?.assessmentVersionItems > 0 || ir._count?.provenanceVersionItems > 0) return true;
    if (!exerciseInputSchema.safeParse({position: ex.position, isCore: ex.isCore, type: ir.type,
      promptData: ir.promptData, gradingData: secret.gradingData, feedbackData: secret.feedbackData}).success) return true;
  }
  for (const ir of assessmentItems) {
    const secret = ir?.gradingSecret;
    if (!ir || !ir.item || ir.item.origin !== 'ASSESSMENT' || ir.item.id !== ir.itemId ||
        ir.authoringLessonRevisionId !== rev.id || ir.createdBy !== rev.createdBy ||
        ir.creationAssignmentEpisodeId !== rev.creationAssignmentEpisodeId || ir.schemaVersion !== 1 ||
        !ir.assessmentBlueprintId || ir.assessmentBlueprint?.id !== ir.assessmentBlueprintId ||
        ir.blueprintGeneration == null || BigInt(ir.blueprintGeneration) < 1n ||
        !secret || secret.schemaVersion !== 1 || ir.isDraftOmitted ||
        (!allowFrozenPredecessor && ir.frozenAt != null) ||
        ir._count?.mediaBindings > 0) return true;
    if (!exerciseInputSchema.safeParse({position: 1, isCore: true, type: ir.type,
      promptData: ir.promptData, gradingData: secret.gradingData, feedbackData: secret.feedbackData}).success) return true;
  }
  for (const link of vocabulary) {
    const snap = link.displaySnapshot, concept = link.vocabulary;
    if (link.lessonRevisionId !== rev.id || !vocabularySnapshotSchema.safeParse(snap).success ||
        !concept || concept.id !== link.vocabularyId || concept.languageId !== snap.languageId ||
        (languageId && snap.languageId.toLowerCase() !== languageId.toLowerCase())) return true;
  }
  return false;
}

export function sameVocabularyMetadata(concept: any, input: any): boolean {
  const optional = (s: string | null | undefined) => s?.trim() || null;
  return concept.canonicalForm.normalize('NFC').trim() === input.canonicalForm.normalize('NFC').trim() &&
    ['vi', 'en'].every(locale => optional(concept.meaningLabels?.[locale]) === optional(input.meaningLabels[locale])) &&
    ['phonetic', 'partOfSpeech', 'example'].every(key => optional(concept[key]) === optional(input[key]));
}
