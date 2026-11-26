// Round-3 wrapper: same stack as scripts/journey-stack.mjs, but also exposes the
// disposable Postgres URL at /tmp/journey-dburl so r3 read-only probes can inspect data.
// Run: node scripts/local-test-db.mjs node --experimental-strip-types scripts/journey/r3/stack-r3.mjs
import fs from 'node:fs';
fs.writeFileSync('/tmp/journey-dburl', process.env.SLICE11_TEST_DATABASE_URL ?? '');
await import('../../journey-stack.mjs');
