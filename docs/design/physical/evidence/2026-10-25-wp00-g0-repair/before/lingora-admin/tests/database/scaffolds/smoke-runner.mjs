import { runScaffold } from './runner-base.mjs';

await runScaffold({
  testSuiteName: 'test:db:smoke',
  testDir: 'tests/database/smoke',
  gateRequirement: 'G3 reviewed PASS and WP-09/10/11 learner vertical slices',
  description: 'End-to-end provider smoke: Teacher author -> Admin publish -> Learner completion',
});
