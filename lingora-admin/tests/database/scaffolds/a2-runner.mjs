import { runScaffold } from './runner-base.mjs';

await runScaffold({
  testSuiteName: 'test:db:a2',
  testDir: 'tests/database/a2',
  gateRequirement: 'G0 reviewed PASS and P1-A2 assignment (RLS/Prisma/locks/custom login)',
  description: 'A2 RLS enforcement, lock matrix, pooled transaction isolation, subject injection',
});
