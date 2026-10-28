import { runScaffold } from './runner-base.mjs';

await runScaffold({
  testSuiteName: 'test:db:a1',
  testDir: 'tests/database/a1',
  gateRequirement: 'G0 reviewed PASS and P1-A1 assignment (Auth lifecycle/correlation/recovery)',
  description: 'A1 Auth Lifecycle, Admin bootstrap, private marker, invite/activation',
});
