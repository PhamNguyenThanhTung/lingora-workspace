interface ProgressContext {
  workingLevel?: { id: string } | null;
  course: { units?: Array<{ levelId: string; lessons: Array<{ id: string }> }> };
  lessonCompletions?: Array<{ lessonId: string }>;
}

// The callers select only required, available lessons with a published active revision.
export function requiredProgress(context: ProgressContext) {
  const required = (context.course.units ?? [])
    .filter(unit => unit.levelId === context.workingLevel?.id)
    .flatMap(unit => unit.lessons);
  const completed = new Set((context.lessonCompletions ?? []).map(row => row.lessonId));
  return { requiredDone: required.filter(lesson => completed.has(lesson.id)).length, requiredTotal: required.length };
}
