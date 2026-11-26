// R3 — read-only look at how the French / Japanese data was actually stored
// (vocabulary identity, grading payloads, SRS cards), plus an optional test-harness
// step that moves SRS due dates into the past so the review session can be exercised
// today (`node scripts/journey/r3/db-probe.mjs --make-due`).
import fs from 'node:fs';
import pkg from 'pg';

const url = fs.readFileSync('/tmp/journey-dburl', 'utf8').trim();
const c = new pkg.Client({ connectionString: url });
await c.connect();
const q = async (sql, params) => (await c.query(sql, params)).rows;

console.log('--- languages');
console.table(await q(`select code, names, is_learnable, is_ui_locale from app.languages order by code`));

console.log('--- vocabulary concepts (fr/ja)');
console.table(await q(`
  select l.code as lang, v.canonical_form, v.normalized_form, v.sense_key, v.phonetic, v.part_of_speech
  from app.vocabulary_concepts v join app.languages l on l.id = v.language_id
  where l.code in ('fr','ja') order by l.code, v.canonical_form`));

console.log('--- lesson revisions (fr/ja)');
console.table(await q(`
  select l.code as lang, lr.title->>'vi' as title_vi, lr.status, lr.revision_no
  from app.lesson_revisions lr
  join app.lessons le on le.id = lr.lesson_id
  join app.units u on u.id = le.unit_id
  join app.courses co on co.id = u.course_id
  join app.languages l on l.id = co.language_id
  where l.code in ('fr','ja') order by l.code, lr.revision_no`));

console.log('--- grading payloads (fr/ja), published revisions');
for (const r of await q(`
  select l.code as lang, ir.type, ir.prompt_data, gs.grading_data
  from app.lesson_exercises le2
  join app.lesson_revisions lr on lr.id = le2.lesson_revision_id
  join app.lessons le on le.id = lr.lesson_id
  join app.units u on u.id = le.unit_id
  join app.courses co on co.id = u.course_id
  join app.languages l on l.id = co.language_id
  join app.item_revisions ir on ir.id = le2.item_revision_id
  join app_private.item_grading_secrets gs on gs.item_revision_id = ir.id
  where l.code in ('fr','ja') and lr.status = 'PUBLISHED'
  order by l.code, le2.position`)) {
  console.log(`[${r.lang}] ${r.type}: grading=${JSON.stringify(r.grading_data)}`);
  if (r.type === 'REORDER') console.log(`      tokens=${JSON.stringify(r.prompt_data.tokens)}`);
}

console.log('--- srs cards');
console.table(await q(`
  select l.code as lang, v.canonical_form, s.stage, s.due_at, s.enrollment_source
  from app.srs_cards s join app.vocabulary_concepts v on v.id = s.vocabulary_id
  join app.languages l on l.id = v.language_id order by l.code, v.canonical_form`));

if (process.argv.includes('--make-due')) {
  const res = await c.query(`update app.srs_cards set due_at = now() - interval '1 hour' where due_at > now()`);
  console.log('--- test harness: moved', res.rowCount, 'SRS cards to due now');
}
await c.end();
