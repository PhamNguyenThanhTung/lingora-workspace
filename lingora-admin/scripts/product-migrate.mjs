// =============================================================================
// Product Database Safe Migration Wrapper
// Authority: plans/2026-10-27-product-database-finalize-spec.md §5, FDB-01, FDB-02
// Resolves: DB-R2, FDB-01, FDB-02
// =============================================================================

import fs from 'fs';
import { runPreflight, loadEnvSafely, sanitizeConnectionUrl } from './product-preflight.mjs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const adminRoot = path.resolve(__dirname, '..');

async function main() {
  console.log('=== Step 1: Pre-Migration Read-Only Preflight Gate ===');
  const preCheck = await runPreflight({ intent: 'migrate' });
  if (!preCheck.ok) {
    console.error(`❌ MIGRATION BLOCKED: Preflight rejected with state: ${preCheck.state} (${preCheck.reason})`);
    process.exit(1);
  }

  console.log(`\n=== Step 2: Executing Prisma Migrate Deploy (State=${preCheck.state}) ===`);
  let prismaBin = path.join(adminRoot, 'node_modules', '.bin', 'prisma');
  if (!fs.existsSync(prismaBin)) {
    prismaBin = path.join(adminRoot, '..', 'node_modules', '.bin', 'prisma');
  }
  const schemaPath = path.join(adminRoot, 'prisma', 'product', 'schema.prisma');

  const env = loadEnvSafely();
  const cleanDbUrl = sanitizeConnectionUrl(env.DATABASE_URL);
  const cleanDirectUrl = sanitizeConnectionUrl(env.DIRECT_URL);

  const deploy = spawnSync(prismaBin, ['migrate', 'deploy', '--schema', schemaPath], {
    cwd: adminRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: cleanDbUrl,
      DIRECT_URL: cleanDirectUrl,
    },
  });

  if (deploy.status !== 0) {
    console.error(`❌ MIGRATION FAILED with exit code: ${deploy.status}`);
    process.exit(deploy.status || 1);
  }

  console.log('\n=== Step 3: Post-Migration Replay Preflight Gate ===');
  const postCheck = await runPreflight({ intent: 'smoke' });
  if (!postCheck.ok || postCheck.state !== 'REPLAY_REPAIRED') {
    console.error(`❌ POST-MIGRATION GATE FAILED: Expected REPLAY_REPAIRED, got ${postCheck.state} (${postCheck.reason || 'Unexpected state'})`);
    process.exit(1);
  }

  console.log('\n✅ MIGRATION SUCCESSFUL: Database transitioned to REPLAY_REPAIRED.');
}

main().catch((err) => {
  const safeError = err instanceof Error ? err.message.replace(/postgresql:\/\/[^@]+@/gi, 'postgresql://***@') : String(err);
  console.error('Fatal migration error:', safeError);
  process.exit(1);
});
