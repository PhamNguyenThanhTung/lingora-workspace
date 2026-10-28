import { runScaffold } from './runner-base.mjs';

await runScaffold({
  testSuiteName: 'test:db:a3',
  testDir: 'tests/database/a3',
  gateRequirement: 'G0 reviewed PASS and P1-A3 assignment (Migration replay and incremental delta)',
  description: 'A3 Fresh baseline replay, incremental custom migration, catalog diff',
});
