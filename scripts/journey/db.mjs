import pkg from 'pg';
import fs from 'node:fs';
export const q = async (sql, params) => { const c = new pkg.Client({ connectionString: fs.readFileSync('/tmp/journey-dburl', 'utf8').trim() }); await c.connect(); try { return (await c.query(sql, params)).rows; } finally { await c.end(); } };
if (import.meta.url === `file://${process.argv[1]}`) console.log(JSON.stringify(await q(process.argv[2]), null, 1).slice(0, 4000));
