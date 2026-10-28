import { runScaffold } from './runner-base.mjs';

await runScaffold({
  testSuiteName: 'test:db:integrity',
  testDir: 'tests/database/integrity',
  gateRequirement: 'G1 reviewed PASS and WP-04 34-table baseline',
  description: 'Relational integrity, FK checks, circular FK staged inserts, CHECK constraints',
});
