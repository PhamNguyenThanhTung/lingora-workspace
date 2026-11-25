// R3 / S7 — Probe the real grader (lingora-web/src/server/lessons/grader.ts) with the
// French / Japanese answer shapes a learner actually types: missing accents, straight vs
// typographic apostrophe, full-width punctuation and spaces, half-width kana.
// Usage: node --conditions=react-server --experimental-strip-types scripts/journey/r3/s7-grader-probe.mjs
const { gradePracticeExercise, normalizePracticeText } = await import(
  '../../../lingora-web/src/server/lessons/grader.ts'
);

const fill = (answers, input, caseSensitive = false) =>
  gradePracticeExercise('FILL_BLANK', {}, { acceptedAnswers: answers, caseSensitive }, { text: input }).isCorrect;

const CASES = [
  // [nhóm, đáp án được chấp nhận, học viên nhập, ghi chú]
  ['fr', ['café'], 'café', 'đúng chính tả'],
  ['fr', ['café'], 'cafe', 'thiếu dấu sắc (bàn phím không có dấu)'],
  ['fr', ['café'], 'CAFÉ', 'in hoa, caseSensitive=false'],
  ['fr', ['café'], 'café.', 'thêm dấu chấm cuối câu'],
  ['fr', ['café'], ' café ', 'thừa khoảng trắng'],
  ['fr', ['café'], 'cafe\u0301', 'e + U+0301 (NFD) -> NFC'],
  ['fr', ['je m’appelle'], "je m'appelle", 'nháy thẳng thay nháy cong'],
  ['fr', ['Comment allez-vous ?'], 'Comment allez-vous?', 'thiếu khoảng trắng trước ?'],
  ['fr', ['Comment allez-vous ?'], 'Comment allez-vous', 'không có dấu ?'],
  ['fr', ['Ça va'], 'ca va', 'thiếu cedilla'],
  ['ja', ['わたしは田中です。'], 'わたしは田中です。', 'đúng, có 。'],
  ['ja', ['わたしは田中です。'], 'わたしは田中です', 'không có 。'],
  ['ja', ['わたしは田中です。'], 'わたしは　田中です。', 'khoảng trắng full-width U+3000 (IME Nhật)'],
  ['ja', ['わたしは田中です。'], 'わたしは 田中です。', 'khoảng trắng half-width'],
  ['ja', ['学生'], 'がくせい', 'đọc bằng kana (nếu không khai báo sẽ sai)'],
  ['ja', ['学生'], '学生。', 'thêm 。'],
  ['ja', ['ありがとう！'], 'ありがとう', 'bỏ ！ full-width'],
  ['ja', ['コーヒー'], 'ｺｰﾋｰ', 'katakana nửa chiều rộng (half-width)'],
  ['ja', ['コーヒー'], 'こーひー', 'hiragana thay katakana'],
];

console.log('| ngôn ngữ | đáp án mẫu | học viên nhập | kết quả | ghi chú |');
console.log('| --- | --- | --- | --- | --- |');
for (const [lang, answers, input, note] of CASES) {
  const ok = fill(answers, input);
  console.log(`| ${lang} | ${answers.join(' / ')} | ${JSON.stringify(input)} | ${ok ? 'ĐÚNG' : 'SAI'} | ${note} |`);
}

console.log('\nnormalizePracticeText (caseSensitive=false):');
for (const s of ['Café ', 'わたしは　田中です。', 'ｺｰﾋｰ', "je m'appelle", 'je m’appelle', 'Bonjour !!!']) {
  console.log(`  ${JSON.stringify(s)} -> ${JSON.stringify(normalizePracticeText(s, false))}`);
}
