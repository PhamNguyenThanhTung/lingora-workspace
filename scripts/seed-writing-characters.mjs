#!/usr/bin/env node
/**
 * Seed the standalone "Luyện viết" character set (JA kana + kanji, ZH hanzi) with stroke data.
 * Idempotent; never targets production (same guard as the demo / core course seeds).
 * Usage: node --experimental-strip-types scripts/seed-writing-characters.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateOwnedDatabaseUrl } from './test-guard-utils.mjs';
import { PrismaClient } from '../lingora-admin/generated/product-client/index.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  const envPath = path.resolve(repoRoot, 'lingora-admin/.env');
  if (fs.existsSync(envPath)) {
    for (const rawLine of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const [key, ...rest] = line.split('=');
      if (key.trim() === 'DATABASE_URL') {
        let val = rest.join('=').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
        databaseUrl = val;
        break;
      }
    }
  }
}
if (!databaseUrl) { console.error('[seed-writing] ERROR: DATABASE_URL is not configured'); process.exit(1); }

const mod = (rel) => import(pathToFileURL(path.resolve(repoRoot, rel)).href);
const demo = await mod('lingora-admin/src/server/curriculum/demo-a1.ts');
const core = await mod('lingora-admin/src/server/curriculum/core-courses/index.ts');
const chars = await mod('lingora-admin/src/server/characters/core-dataset.ts');

let targetSafety;
try {
  targetSafety = demo.verifyDatabaseTarget(databaseUrl, { allowRemoteDevTarget: process.env.LINGORA_ALLOW_DEMO_SEED_TARGET });
  if (targetSafety.targetType === 'LOCAL_DISPOSABLE') validateOwnedDatabaseUrl();
} catch (err) {
  console.error(`\n[seed-writing] CRITICAL TARGET SAFETY ERROR: ${err.message}\n`);
  process.exit(1);
}
const parsed = new URL(databaseUrl);
console.log(`LINGORA WRITING CHARACTER SEED | ${targetSafety.targetType} | ${parsed.hostname}:${parsed.port || '5432'}${parsed.pathname}`);

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } }, log: ['error'] });
try {
  await prisma.$connect();
  if (!(await prisma.language.findUnique({ where: { code: 'en' } }))) {
    const { seed } = await import('../lingora-admin/prisma/product/seed.mjs');
    await seed(prisma);
  }
  await core.ensureReferenceData(prisma, ['ja', 'zh']);
  const res = await chars.seedCoreWritingCharacters(prisma, (m) => console.log(`  ${m}`));
  const counts = await prisma.writingCharacter.groupBy({ by: ['scriptType'], _count: true });
  console.log('catalogue:', JSON.stringify(counts));
  console.log('Status:', res.created === 0 && res.strokeSeeded === 0 ? 'ALREADY_SEEDED (IDEMPOTENT PASS)' : 'SEEDED');
} catch (e) {
  console.error('[seed-writing] FATAL', e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
