#!/usr/bin/env node

/**
 * Seed the core communication courses (English A1–A2, Japanese N5–N4, Chinese HSK1–HSK2).
 *
 * Content lives in lingora-admin/src/server/curriculum/core-courses/data and is published through the
 * same workflow as the Teacher Studio (create → assign → draft → submit → approve → publish).
 * - Idempotent: lessons that are already published are skipped; reference data is upserted.
 * - Never targets production: reuses the demo target guard (local disposable DB or an explicitly allowed dev target).
 * - Usage: node --experimental-strip-types scripts/seed-core-courses.mjs [en|ja|zh ...]
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
if (!databaseUrl) {
  console.error('[seed-core] ERROR: DATABASE_URL is not configured in environment or lingora-admin/.env');
  process.exit(1);
}

const mod = (rel) => import(pathToFileURL(path.resolve(repoRoot, rel)).href);
const demo = await mod('lingora-admin/src/server/curriculum/demo-a1.ts');
const core = await mod('lingora-admin/src/server/curriculum/core-courses/index.ts');

let targetSafety;
try {
  targetSafety = demo.verifyDatabaseTarget(databaseUrl, { allowRemoteDevTarget: process.env.LINGORA_ALLOW_DEMO_SEED_TARGET });
  if (targetSafety.targetType === 'LOCAL_DISPOSABLE') validateOwnedDatabaseUrl();
} catch (err) {
  console.error(`\n[seed-core] CRITICAL TARGET SAFETY ERROR: ${err.message}\n`);
  process.exit(1);
}

const wanted = process.argv.slice(2);
const keys = wanted.length ? wanted : Object.keys(core.CORE_COURSES);
for (const k of keys) {
  if (!core.CORE_COURSES[k]) {
    console.error(`[seed-core] Unknown course "${k}". Available: ${Object.keys(core.CORE_COURSES).join(', ')}`);
    process.exit(1);
  }
}

const parsed = new URL(databaseUrl);
console.log('='.repeat(70));
console.log('LINGORA CORE COURSES PROVISIONER');
console.log(`  Target: ${targetSafety.targetType} | ${parsed.hostname}:${parsed.port || '5432'}${parsed.pathname}`);
console.log(`  Courses: ${keys.join(', ')}`);
console.log('='.repeat(70));

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } }, log: ['error'] });

async function main() {
  try {
    for (let attempt = 1; ; attempt++) {
      try {
        await prisma.$connect();
        break;
      } catch (err) {
        if (attempt === 5) throw err;
        console.warn(`[seed-core] Connection attempt ${attempt} failed (${err.message}). Retrying in 2s...`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    const actors = {
      adminId: process.env.DEMO_ADMIN_ID || '5650336e-550c-413d-b2a8-4afa2e4d9160',
      teacherAId: process.env.DEMO_TEACHER_A_ID || demo.DEMO_A1_CONSTANTS.teacherAId,
      teacherBId: process.env.DEMO_TEACHER_B_ID || demo.DEMO_A1_CONSTANTS.teacherBId,
    };
    const actorSpecs = [
      { id: actors.adminId, expectedRole: 'ADMIN', displayName: 'Admin Demo', email: 'admin@lingora.test' },
      { id: actors.teacherAId, expectedRole: 'TEACHER', displayName: 'Nguyễn Minh Anh', email: 'teacher.minhanh@lingora.test' },
      { id: actors.teacherBId, expectedRole: 'TEACHER', displayName: 'Trần Thu Hà', email: 'teacher.thuha@lingora.test' },
    ];
    for (const actor of actorSpecs) await demo.assertActorSafe(prisma, actor);
    await demo.assertCurriculumSafe(prisma, actors);

    if (!(await prisma.language.findUnique({ where: { code: 'en' } }))) {
      const { seed } = await import('../lingora-admin/prisma/product/seed.mjs');
      await seed(prisma);
    }
    await demo.provisionDemoActors(prisma, actorSpecs);

    await core.ensureReferenceData(prisma, keys);

    const coreActors = { adminId: actors.adminId, teacherIds: { en: actors.teacherAId, ja: actors.teacherBId, zh: actors.teacherAId } };
    const results = [];
    for (const key of keys) {
      console.log(`\n[seed-core] Provisioning ${key}...`);
      const res = await core.provisionCoreCourse(prisma, core.CORE_COURSES[key], coreActors, (m) => console.log(`  ${m}`));
      results.push(res);
    }

    console.log('\n' + '='.repeat(70));
    console.log('VERIFICATION');
    console.log('='.repeat(70));
    for (const key of keys) {
      const courseId = core.COURSE_IDS[key];
      const lessons = await prisma.lesson.findMany({
        where: { unit: { courseId } },
        include: { activeRevision: { include: { vocabularyLinks: true, exercises: true } } },
      });
      const published = lessons.filter((l) => l.availability === 'AVAILABLE' && l.activeRevisionId);
      const vocab = new Set(published.flatMap((l) => l.activeRevision.vocabularyLinks.map((v) => v.vocabularyId)));
      const exercises = published.reduce((n, l) => n + l.activeRevision.exercises.length, 0);
      console.log(`${key}: lessons=${lessons.length} published=${published.length} vocabularyConcepts=${vocab.size} exercises=${exercises}`);
    }
    console.log('Status:', results.every((r) => r.published === 0) ? 'ALREADY_PROVISIONED (IDEMPOTENT PASS)' : 'SUCCESSFULLY_PROVISIONED');
  } catch (error) {
    console.error('[seed-core] FATAL ERROR:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
