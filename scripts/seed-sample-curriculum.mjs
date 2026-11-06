#!/usr/bin/env node

/**
 * Seed Sample Curriculum Script (P1 / P6)
 *
 * Strict Guard:
 * 1. Requires explicit `--confirm-owned-loopback` argument.
 * 2. DATABASE_URL must explicitly target loopback (127.0.0.1 or localhost) with exact /slice11_test.
 * 3. Never runs against production, staging, or non-disposable environments.
 */

import { pathToFileURL } from 'node:url';
import path from 'node:path';
import pkg from 'pg';
import { PrismaClient } from '../lingora-admin/generated/product-client/index.js';
import { validateOwnedDatabaseUrl, preflightAndSeedActors } from './test-guard-utils.mjs';

const { Client } = pkg;
const repoRoot = path.resolve(import.meta.dirname, '..');

// 1. Guard check CLI flag
if (!process.argv.includes('--confirm-owned-loopback')) {
  console.error('[sample-curriculum] ERROR: Refusing to seed without explicit --confirm-owned-loopback flag.');
  process.exit(1);
}

// 2. Validate owned database URL and markers before client creation
let guard;
try {
  guard = validateOwnedDatabaseUrl();
} catch (err) {
  console.error(`[sample-curriculum] ERROR: ${err.message}`);
  process.exit(1);
}

console.log(`[sample-curriculum] Verified owned loopback DB: host=${guard.parsedUrl.hostname}, db=${guard.parsedUrl.pathname}`);

// Allow subprocess guard validation without DB connection
if (process.argv.includes('--check-guard-only')) {
  console.log('[sample-curriculum] GUARD_OK');
  process.exit(0);
}

const databaseUrl = guard.ownedUrl;
const prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
  log: [],
});

async function run() {
  try {
    // Ensure base canonical configuration (languages, frameworks, levels) is present
    const enLang = await prisma.language.findUnique({ where: { code: 'en' } });
    if (!enLang) {
      const { seed } = await import(
        pathToFileURL(path.resolve(repoRoot, 'lingora-admin/prisma/product/seed.mjs')).href
      );
      await seed(prisma);
    }

    // 4. Ensure synthetic staff actors exist in loopback DB without mutating mismatched accounts (R1)
    const adminId = '00000000-0000-4000-8000-000000000001';
    const teacherId = '11111111-1111-4111-8111-111111111111';

    const pgClient = new Client({ connectionString: databaseUrl });
    await pgClient.connect();
    try {
      await preflightAndSeedActors(pgClient, [
        {
          id: adminId,
          role: 'ADMIN',
          status: 'ACTIVE',
          email: 'admin@lingora.test',
          displayName: 'Sample Admin',
          uiLocale: 'en',
        },
        {
          id: teacherId,
          role: 'TEACHER',
          status: 'ACTIVE',
          email: 'teacher@lingora.test',
          displayName: 'Sample Teacher',
          uiLocale: 'en',
        },
      ]);
    } finally {
      await pgClient.end();
    }

    // 5. Import provisioner dynamically
    const { provisionSampleA1Curriculum } = await import(
      pathToFileURL(path.resolve(repoRoot, 'lingora-admin/src/server/curriculum/sample-a1.ts')).href
    );

    console.log('[sample-curriculum] Provisioning English A1 sample curriculum...');
    const result = await provisionSampleA1Curriculum(prisma, { adminId, teacherId });

    if (result.alreadyProvisioned) {
      console.log('[sample-curriculum] Curriculum already provisioned. Idempotent check PASS.');
    } else {
      console.log(`[sample-curriculum] Successfully provisioned ${result.lessonIds.length} sample lessons:`);
      for (const id of result.lessonIds) {
        console.log(`  - Lesson: ${id}`);
      }
    }

    console.log('[sample-curriculum] Done.');
    process.exit(0);
  } catch (err) {
    console.error('[sample-curriculum] Execution failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void run();
