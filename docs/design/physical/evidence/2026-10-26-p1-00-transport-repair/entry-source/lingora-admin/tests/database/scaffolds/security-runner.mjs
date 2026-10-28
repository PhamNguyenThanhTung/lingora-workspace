import { runScaffold } from './runner-base.mjs';

await runScaffold({
  testSuiteName: 'test:db:security',
  testDir: 'tests/database/security',
  gateRequirement: 'G1 reviewed PASS and WP-05 security matrix',
  description: 'Principal privileges, SECURITY DEFINER search_path, RLS leak denial, grant auditing',
});
