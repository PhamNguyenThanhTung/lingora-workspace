import { runScaffold } from './runner-base.mjs';

await runScaffold({
  testSuiteName: 'test:db:concurrency',
  testDir: 'tests/database/concurrency',
  gateRequirement: 'G3 reviewed PASS and WP-12 integrated race harness',
  description: 'LOCK-01 total rank verification, multi-connection barriers, deadlock retries',
});
