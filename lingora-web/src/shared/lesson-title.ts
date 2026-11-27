/**
 * G15/H2: teachers often type their own numbering into the title ("Bài 4: Một ngày của tôi",
 * "Chương 1: Chào hỏi"). Every learner surface used to add its own prefix on top of that, so the
 * same lesson showed up as "Bài 4: ..." on the home path, "Bài 1: ..." in the catalogue and
 * "Chương 1: Chương 1: ..." in the breadcrumb.
 *
 * One rule, shared by home, catalogue and the lesson player breadcrumb: only add the system
 * prefix when the title does not already start with a numbering prefix of its own.
 */

/**
 * "Bài 4:", "bài 4 -", "Lesson 2.", "Unit 3 —", "Chương 1:", "Chapter 10:", "Leçon 1 :", "Chapitre 2 -" ...
 * and the Japanese/Chinese counter form "第1課", "第２章", "第三回" (no separator needed).
 */
const NUMBER_PREFIX = new RegExp(
  '^\\s*(?:' +
    '(?:bài|chương|phần|lesson|unit|chapter|part|leçon|lecon|chapitre|partie|unité|unite)\\s*\\d+\\s*(?:[:.)\\]\\-–—]|$)' +
    '|第\\s*[0-9０-９一二三四五六七八九十百]+\\s*[課课章回部話话节節]' +
    ')',
  'i'
);

export function hasNumberPrefix(title: string | null | undefined): boolean {
  return NUMBER_PREFIX.test((title ?? '').trim());
}

/**
 * `numberedTitle('Bài', 4, 'Bài 4: Một ngày của tôi')` -> "Bài 4: Một ngày của tôi"
 * `numberedTitle('Bài', 4, 'Một ngày của tôi')`        -> "Bài 4: Một ngày của tôi"
 * `numberedTitle('Chương', 1, '')`                     -> "Chương 1"
 */
export function numberedTitle(
  label: string,
  position: number | null | undefined,
  title: string | null | undefined
): string {
  const text = (title ?? '').trim();
  if (position == null || !Number.isFinite(position)) return text;
  if (!text) return `${label} ${position}`;
  if (hasNumberPrefix(text)) return text;
  return `${label} ${position}: ${text}`;
}
