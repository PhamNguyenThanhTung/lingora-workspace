/**
 * Offline content validation for the core EN / JA / ZH communication courses.
 * No database: every lesson is expanded exactly as the provisioner does and parsed with the real
 * Teacher Studio draft schema, then checked against pedagogy rules the schema cannot express.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CORE_COURSES, buildLessonPayload, FRAMEWORKS, LANGUAGES, COURSE_IDS, stableUuid } from '../../lingora-admin/src/server/curriculum/core-courses/index.ts';
import { saveTeacherDraftExtendedSchema } from '../../lingora-admin/src/server/lessons/content.ts';

const SCRIPT = {
  en: /^[\p{Script=Latin}0-9\s'’.,!?\-/()&:;“”"]+$/u,
  ja: /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u,
  zh: /\p{Script=Han}/u,
};
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}]/u;
const PINYIN = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüa-z]/i;

const EXPECTED = {
  en: { levels: ['A1', 'A2'], unitsPerLevel: 4, lessonsPerUnit: 3 },
  ja: { levels: ['N5', 'N4'], unitsPerLevel: 4, lessonsPerUnit: 3 },
  zh: { levels: ['HSK1', 'HSK2'], unitsPerLevel: 4, lessonsPerUnit: 3 },
};

for (const key of Object.keys(EXPECTED)) {
  const course = CORE_COURSES[key];
  describe(`${key} course`, { skip: course ? false : 'course data not written yet' }, () => {
    const exp = EXPECTED[key];

    test('structure: levels, units and lessons are complete', () => {
      for (const level of exp.levels) {
        const units = course.units.filter((u) => u.level === level);
        assert.ok(units.length >= exp.unitsPerLevel, `${level} units`);
        for (const unit of units) assert.equal(unit.lessons.length, exp.lessonsPerUnit, `${level} ${unit.names.en} lessons`);
      }
      assert.ok(FRAMEWORKS[key].levels.some((l) => l.code === course.defaultLevel));
      assert.ok(course.units.every((u) => FRAMEWORKS[key].levels.some((l) => l.code === u.level)));
      // Units must be ordered by level so positions inside a level follow the array order.
      const order = course.units.map((u) => FRAMEWORKS[key].levels.find((l) => l.code === u.level).position);
      assert.deepEqual(order, [...order].sort((a, b) => a - b));
    });

    test('every lesson expands to a payload accepted by the Teacher Studio draft schema', () => {
      let n = 0;
      for (const unit of course.units) {
        for (const lesson of unit.lessons) {
          n++;
          const payload = buildLessonPayload(key, `${key}-t${n}`, n, lesson);
          const result = saveTeacherDraftExtendedSchema.safeParse({ ...payload, expectedRowVersion: '1', expectedRevisionId: null });
          assert.ok(result.success, `${lesson.title.en}: ${result.success ? '' : JSON.stringify(result.error.issues.slice(0, 3))}`);
        }
      }
      assert.equal(n, course.units.reduce((sum, u) => sum + u.lessons.length, 0));
    });

    test('lesson depth: vocabulary, grammar, dialogue, exercises meet the minimum', () => {
      let n = 0;
      for (const unit of course.units) {
        for (const lesson of unit.lessons) {
          n++;
          const ctx = `${key}/${unit.level}/${lesson.title.en}`;
          assert.ok(lesson.vocab.length >= 8 && lesson.vocab.length <= 12, `${ctx}: vocab ${lesson.vocab.length}`);
          assert.ok(lesson.grammar.examples.length >= 3, `${ctx}: grammar examples`);
          assert.ok(lesson.grammar.explain.length >= 120, `${ctx}: grammar explanation too thin`);
          assert.ok(lesson.dialogue.lines.length >= 4, `${ctx}: dialogue lines`);
          assert.ok(lesson.reorder.length >= 2, `${ctx}: reorder`);
          assert.ok(lesson.grammarQ.length >= 1, `${ctx}: grammar question`);
          assert.ok(lesson.intro.length >= 80, `${ctx}: intro`);
          const payload = buildLessonPayload(key, `${key}-d${n}`, n, lesson);
          const types = payload.exercises.map((e) => e.type);
          assert.ok(payload.exercises.length >= 9, `${ctx}: only ${payload.exercises.length} exercises`);
          for (const t of ['MCQ', 'FILL_BLANK', 'REORDER', 'GRAMMAR']) assert.ok(types.includes(t), `${ctx}: missing ${t}`);
        }
      }
    });

    test('target-language script is correct and readings are present', () => {
      for (const unit of course.units) {
        for (const lesson of unit.lessons) {
          const ctx = `${key}/${lesson.title.en}`;
          for (const [word, reading, , vi, example, exampleVi] of lesson.vocab) {
            assert.ok(word && reading && vi && example && exampleVi, `${ctx}: incomplete vocab row ${word}`);
            if (key === 'en') assert.match(word, SCRIPT.en, `${ctx}: ${word}`);
            else assert.match(word, SCRIPT[key], `${ctx}: ${word} must be written in the target script`);
            if (key === 'ja') assert.match(reading, KANA, `${ctx}: ${word} needs a kana reading`);
            if (key === 'zh') assert.match(reading, PINYIN, `${ctx}: ${word} needs pinyin`);
            if (key !== 'en') assert.match(example, SCRIPT[key], `${ctx}: example for ${word}`);
          }
          if (key === 'zh') {
            for (const line of lesson.dialogue.lines) assert.ok(line[3], `${ctx}: dialogue line needs pinyin (${line[1]})`);
            for (const ex of lesson.grammar.examples) assert.ok(ex[2], `${ctx}: grammar example needs pinyin (${ex[0]})`);
          }
        }
      }
    });

    test('vocabulary senses are consistent across lessons and unique inside a lesson', () => {
      const seen = new Map();
      for (const unit of course.units) {
        for (const lesson of unit.lessons) {
          const inLesson = new Set();
          for (const [word, , pos, vi] of lesson.vocab) {
            const id = `${word.normalize('NFC').trim().toLowerCase()}|${pos}`;
            assert.ok(!inLesson.has(id), `${lesson.title.en}: duplicate ${id}`);
            inLesson.add(id);
            if (seen.has(id)) assert.equal(seen.get(id), vi, `sense conflict for ${id}: "${seen.get(id)}" vs "${vi}"`);
            else seen.set(id, vi);
          }
        }
      }
      assert.ok(seen.size >= 200, `only ${seen.size} distinct concepts`);
    });

    test('exercises are answerable and leak-free', () => {
      let n = 0;
      for (const unit of course.units) {
        for (const lesson of unit.lessons) {
          n++;
          const payload = buildLessonPayload(key, `${key}-x${n}`, n, lesson);
          for (const ex of payload.exercises) {
            const ctx = `${lesson.title.en} #${ex.position} ${ex.type}`;
            if (ex.type === 'MCQ') {
              const texts = ex.promptData.options.map((o) => o.text);
              assert.equal(new Set(texts).size, texts.length, `${ctx}: duplicate option text`);
              assert.ok(texts.length >= 3, `${ctx}: needs 3 options`);
              assert.ok(ex.promptData.options.some((o) => o.id === ex.gradingData.correctOptionId));
            }
            if (ex.type === 'FILL_BLANK') {
              const rebuilt = ex.promptData.sentence.replace('____', ex.gradingData.acceptedAnswers[0]);
              assert.ok(lesson.vocab.some((v) => v[4] === rebuilt), `${ctx}: blank must come from a vocabulary example`);
            }
            if (ex.type === 'REORDER') {
              const order = ex.promptData.tokens.map((t) => t.id).join();
              assert.notEqual(order, ex.gradingData.correctOrder.join(), `${ctx}: tokens already in answer order`);
            }
            if (ex.type === 'GRAMMAR') assert.ok(ex.gradingData.acceptedAnswers.length >= 1);
          }
        }
      }
    });

    test('reorder answers are real sentences used in the lesson', () => {
      for (const unit of course.units) {
        for (const lesson of unit.lessons) {
          const corpus = [
            ...lesson.vocab.map((v) => v[4]),
            ...lesson.grammar.examples.map((e) => e[0]),
            ...lesson.dialogue.lines.map((l) => l[1]),
          ].join('\n').replace(/\s+/g, '');
          for (const [tokens] of lesson.reorder) {
            const sentence = tokens.split('|').join('').replace(/\s+/g, '');
            const loose = sentence.replace(/[.?!。？！，,]/g, '');
            const corpusLoose = corpus.replace(/[.?!。？！，,]/g, '');
            assert.ok(corpusLoose.toLowerCase().includes(loose.toLowerCase()), `${key}/${lesson.title.en}: reorder sentence "${sentence}" does not appear in the lesson text`);
          }
        }
      }
    });
  });
}

describe('reference data', () => {
  test('ids are deterministic and well-formed', () => {
    assert.equal(stableUuid('x'), stableUuid('x'));
    for (const id of [...Object.values(COURSE_IDS), ...Object.values(LANGUAGES).map((l) => l.id), ...Object.values(FRAMEWORKS).flatMap((f) => [f.id, ...f.levels.map((l) => l.id)])]) {
      assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    }
    const all = Object.values(FRAMEWORKS).flatMap((f) => f.levels.map((l) => l.id));
    assert.equal(new Set(all).size, all.length);
  });
});
