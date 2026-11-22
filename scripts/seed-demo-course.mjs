#!/usr/bin/env node

/**
 * Seed Demo A1 Course Script for Lingora
 *
 * Course: Tiếng Anh A1 — Giao tiếp hằng ngày (English A1 — Everyday Communication)
 * ID: e0000000-0000-4000-8000-000000000001
 *
 * Features:
 * - 3 Units, 9 Lessons
 * - Real playable audio listening activities in Supabase Storage
 * - Real vocabularies (canonical forms, POS, IPA, Vietnamese definitions, example sentences)
 * - Diverse exercise types (MCQ, FILL_BLANK, REORDER, LISTENING, GRAMMAR)
 * - Full authoring provenance (Admin, Teacher A, Teacher B, multi-revision on Lesson 9)
 * - Idempotent execution (running multiple times produces 0 duplicates)
 * - Safe host/database reporting (never leaks credentials)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateOwnedDatabaseUrl } from './test-guard-utils.mjs';
import { PrismaClient } from '../lingora-admin/generated/product-client/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

// 1. Resolve DATABASE_URL
let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  const envPath = path.resolve(repoRoot, 'lingora-admin/.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const rawLine of envContent.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const [key, ...rest] = line.split('=');
      if (key.trim() === 'DATABASE_URL') {
        let val = rest.join('=').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        databaseUrl = val;
        break;
      }
    }
  }
}

if (!databaseUrl) {
  console.error('[seed-demo] ERROR: DATABASE_URL is not configured in environment or lingora-admin/.env');
  process.exit(1);
}

// 2. Parse database URL
let parsedUrl;
try {
  parsedUrl = new URL(databaseUrl);
} catch (err) {
  console.error(`[seed-demo] ERROR: Invalid DATABASE_URL format: ${err.message}`);
  process.exit(1);
}

// 3. Import demo modules early for safety validation
const {
  provisionDemoA1Course,
  DEMO_A1_CONSTANTS,
  verifyDatabaseTarget,
  assertActorSafe,
  provisionDemoActors,
  assertCurriculumSafe,
} = await import(
  pathToFileURL(path.resolve(repoRoot, 'lingora-admin/src/server/curriculum/demo-a1.ts')).href
);

let targetSafety;
try {
  targetSafety = verifyDatabaseTarget(databaseUrl, {
    allowRemoteDevTarget: process.env.LINGORA_ALLOW_DEMO_SEED_TARGET,
  });
  if (targetSafety.targetType === 'LOCAL_DISPOSABLE') validateOwnedDatabaseUrl();
} catch (err) {
  console.error(`\n[seed-demo] CRITICAL TARGET SAFETY ERROR: ${err.message}\n`);
  process.exit(1);
}

const safePort = parsedUrl.port || '5432';
const safeHost = parsedUrl.hostname;
const safeDbName = parsedUrl.pathname;
const safeSchema = parsedUrl.searchParams.get('schema') || 'app';

console.log('='.repeat(70));
console.log('LINGORA DEMO A1 COURSE PROVISIONER');
console.log('='.repeat(70));
console.log(`[seed-demo] Target Database:`);
console.log(`  Target Type: ${targetSafety.targetType}`);
console.log(`  Host:        ${safeHost}`);
console.log(`  Port:        ${safePort}`);
console.log(`  Database:    ${safeDbName}`);
console.log(`  Schema:      ${safeSchema}`);
if (targetSafety.projectRef) {
  console.log(`  Project Ref: ${targetSafety.projectRef}`);
}
console.log('='.repeat(70));

const prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
  log: ['error'],
});

async function main() {
  try {
    console.log('[seed-demo] Connecting to database...');
    let connected = false;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        await prisma.$connect();
        connected = true;
        break;
      } catch (err) {
        console.warn(`[seed-demo] Connection attempt ${attempt} failed (${err.message}). Retrying in 2s...`);
        if (attempt === 5) throw err;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    const actors = {
      adminId: process.env.DEMO_ADMIN_ID || '5650336e-550c-413d-b2a8-4afa2e4d9160',
      teacherAId: process.env.DEMO_TEACHER_A_ID || DEMO_A1_CONSTANTS.teacherAId,
      teacherBId: process.env.DEMO_TEACHER_B_ID || DEMO_A1_CONSTANTS.teacherBId,
    };
    const actorSpecs = [
      { id: actors.adminId, expectedRole: 'ADMIN', displayName: 'Admin Demo', email: 'admin@lingora.test' },
      { id: actors.teacherAId, expectedRole: 'TEACHER', displayName: 'Nguyễn Minh Anh', email: 'teacher.minhanh@lingora.test' },
      { id: actors.teacherBId, expectedRole: 'TEACHER', displayName: 'Trần Thu Hà', email: 'teacher.thuha@lingora.test' },
    ];
    for (const actor of actorSpecs) await assertActorSafe(prisma, actor);
    await assertCurriculumSafe(prisma, actors);

    const enLang = await prisma.language.findUnique({ where: { code: 'en' } });
    if (!enLang) {
      const { seed } = await import('../lingora-admin/prisma/product/seed.mjs');
      await seed(prisma);
    }
    await provisionDemoActors(prisma, actorSpecs);

    // 6. Assert curriculum safety and invoke provisionDemoA1Course
    await assertCurriculumSafe(prisma, actors);

    console.log('[seed-demo] Executing provisionDemoA1Course...');
    const result = await provisionDemoA1Course(prisma, actors);

    // 7. Query and Verify Comprehensive Statistics
    console.log('\n' + '='.repeat(70));
    console.log('COURSE VERIFICATION & STATISTICS');
    console.log('='.repeat(70));

    const course = await prisma.course.findUniqueOrThrow({
      where: { id: DEMO_A1_CONSTANTS.courseId },
      include: {
        units: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              orderBy: { position: 'asc' },
              include: {
                activeRevision: {
                  include: {
                    vocabularyLinks: true,
                    exercises: {
                      include: {
                        itemRevision: {
                          include: {
                            gradingSecret: true,
                          },
                        },
                      },
                    },
                  },
                },
                revisions: {
                  orderBy: { revisionNo: 'asc' },
                  include: {
                    reviewComments: true,
                    reviews: true,
                  },
                },
                assignment: {
                  include: {
                    currentTeacher: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const totalUnits = course.units.length;
    let totalLessons = 0;
    let activeLessons = 0;
    let totalRevisions = 0;
    const allVocabConceptIds = new Set();
    let totalExercises = 0;
    const exerciseTypeBreakdown = {};

    console.log(`Course: ${(course.names).vi} | ${(course.names).en}`);
    console.log(`Course ID: ${course.id}`);
    console.log(`Language ID: ${course.languageId}`);
    console.log(`Framework ID: ${course.frameworkId}`);
    console.log(`Default Start Level ID: ${course.defaultStartLevelId}`);
    console.log(`IsActive: ${course.isActive}`);
    console.log('-'.repeat(70));

    for (const unit of course.units) {
      console.log(`\nUnit ${unit.position}: ${(unit.names).vi} | ${(unit.names).en} (${unit.id})`);
      for (const lesson of unit.lessons) {
        totalLessons++;
        if (lesson.availability === 'AVAILABLE' && lesson.activeRevisionId) {
          activeLessons++;
        }
        totalRevisions += lesson.revisions.length;

        const assignedTeacher = lesson.assignment?.currentTeacher?.displayName || 'Unassigned';
        const activeRev = lesson.activeRevision;
        const vocabCount = activeRev?.vocabularyLinks?.length || 0;
        const exerciseCount = activeRev?.exercises?.length || 0;

        activeRev?.vocabularyLinks?.forEach((vl) => allVocabConceptIds.add(vl.vocabularyId));

        activeRev?.exercises?.forEach((le) => {
          totalExercises++;
          const type = le.itemRevision?.type || 'UNKNOWN';
          exerciseTypeBreakdown[type] = (exerciseTypeBreakdown[type] || 0) + 1;
        });

        const titleObj = (activeRev?.title) || (lesson.revisions[0]?.title) || {};
        console.log(
          `  Lesson ${lesson.position}: ${titleObj.vi || 'N/A'} | ${titleObj.en || 'N/A'}`
        );
        console.log(
          `    ID: ${lesson.id} | Availability: ${lesson.availability}`
        );
        console.log(
          `    Teacher: ${assignedTeacher} | Revisions: ${lesson.revisions.length} | Vocab: ${vocabCount} | Exercises: ${exerciseCount}`
        );

        if (lesson.revisions.length > 1) {
          console.log(`    Provenance Audit:`);
          for (const rev of lesson.revisions) {
            console.log(
              `      Rev #${rev.revisionNo}: Status=${rev.status} | Reviews=${rev.reviews.length} | Comments=${rev.reviewComments.length}`
            );
            for (const comment of rev.reviewComments) {
              console.log(`        Comment: "${comment.body}"`);
            }
          }
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY METRICS:');
    console.log(`  Total Courses:               1`);
    console.log(`  Total Units:                 ${totalUnits}`);
    console.log(`  Total Lessons:               ${totalLessons}`);
    console.log(`  Active Published Lessons:    ${activeLessons}`);
    console.log(`  Total Lesson Revisions:      ${totalRevisions}`);
    console.log(`  Total Vocabulary Concepts:   ${allVocabConceptIds.size}`);
    console.log(`  Total Exercises Created:     ${totalExercises}`);
    console.log(`  Exercise Breakdown:`);
    for (const [type, count] of Object.entries(exerciseTypeBreakdown)) {
      console.log(`    - ${type}: ${count}`);
    }
    console.log('='.repeat(70));
    console.log(`Status: ${result.alreadyProvisioned ? 'ALREADY_PROVISIONED (IDEMPOTENT PASS)' : 'SUCCESSFULLY_PROVISIONED'}`);
    console.log('='.repeat(70));

  } catch (error) {
    console.error('[seed-demo] FATAL ERROR:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
