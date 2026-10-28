// =============================================================================
// Seed: Minimal Product Configuration with Semantic Mismatch Protection
// =============================================================================

import { PrismaClient } from '../../generated/product-client/index.js';

/**
 * Deep semantic JSON equality check (sorts object keys for order-insensitive comparison).
 * @param {any} a
 * @param {any} b
 * @returns {boolean}
 */
export function jsonEquals(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== 'object' || typeof b !== 'object') return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!jsonEquals(a[i], b[i])) return false;
    }
    return true;
  }
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    if (keysA[i] !== keysB[i]) return false;
    if (!jsonEquals(a[keysA[i]], b[keysB[i]])) return false;
  }
  return true;
}

/**
 * Idempotently seed canonical configuration and minimum DEV fixture data.
 * Does not overwrite existing conflicting data; reports semantic mismatch on conflict.
 * Executes all operations inside one transaction.
 * @param {any} client PrismaClient or interactive transaction client
 */
export async function seed(client, options = {}) {
  const overrides = options.overrideExpected || {};
  const runner = async (tx) => {
    console.log('[seed] Seeding canonical configuration with semantic mismatch detection...');

    // 1. Languages (app.languages)
    // English (Learnable + UI locale)
    const expectedLangEn = {
      id: '00000000-0000-0000-0000-000000000001',
      code: 'en',
      names: { en: 'English', vi: 'Tiếng Anh' },
      isLearnable: true,
      isUiLocale: true,
      ...overrides.langEn,
    };
    const langEn = await tx.language.upsert({
      where: { code: 'en' },
      update: {},
      create: expectedLangEn,
    });
    if (
      langEn.isLearnable !== expectedLangEn.isLearnable ||
      langEn.isUiLocale !== expectedLangEn.isUiLocale ||
      !jsonEquals(langEn.names, expectedLangEn.names)
    ) {
      throw new Error(
        `[seed] MISMATCH: Existing language 'en' has conflicting configuration: names=${JSON.stringify(langEn.names)}, isLearnable=${langEn.isLearnable}, isUiLocale=${langEn.isUiLocale}. Refusing to overwrite.`
      );
    }
    console.log(`[seed] Language verified: ${langEn.code} (${langEn.id})`);

    // Vietnamese (UI locale only)
    const expectedLangVi = {
      id: '00000000-0000-0000-0000-000000000002',
      code: 'vi',
      names: { en: 'Vietnamese', vi: 'Tiếng Việt' },
      isLearnable: false,
      isUiLocale: true,
      ...overrides.langVi,
    };
    const langVi = await tx.language.upsert({
      where: { code: 'vi' },
      update: {},
      create: expectedLangVi,
    });
    if (
      langVi.isLearnable !== expectedLangVi.isLearnable ||
      langVi.isUiLocale !== expectedLangVi.isUiLocale ||
      !jsonEquals(langVi.names, expectedLangVi.names)
    ) {
      throw new Error(
        `[seed] MISMATCH: Existing language 'vi' has conflicting configuration: names=${JSON.stringify(langVi.names)}, isLearnable=${langVi.isLearnable}, isUiLocale=${langVi.isUiLocale}. Refusing to overwrite.`
      );
    }
    console.log(`[seed] Language verified: ${langVi.code} (${langVi.id})`);

    // 2. Framework (app.frameworks)
    const expectedFw = {
      id: '00000000-0000-0000-0000-000000000010',
      code: 'CEFR',
      version: '2020',
      names: { en: 'Common European Framework of Reference', vi: 'Khung tham chiếu chung Châu Âu' },
      ...overrides.framework,
    };
    const framework = await tx.framework.upsert({
      where: {
        code_version: {
          code: expectedFw.code,
          version: expectedFw.version,
        },
      },
      update: {},
      create: expectedFw,
    });
    if (
      framework.code !== expectedFw.code ||
      framework.version !== expectedFw.version ||
      !jsonEquals(framework.names, expectedFw.names)
    ) {
      throw new Error(
        `[seed] MISMATCH: Existing framework ${framework.id} has conflicting names or version. Refusing to overwrite.`
      );
    }
    console.log(`[seed] Framework verified: ${framework.code} v${framework.version} (${framework.id})`);

    // 3. Levels (app.levels)
    const levelsData = [
      { id: '00000000-0000-0000-0000-000000000021', code: 'A1', position: 1, label: { en: 'Beginner', vi: 'Mới bắt đầu' } },
      { id: '00000000-0000-0000-0000-000000000022', code: 'A2', position: 2, label: { en: 'Elementary', vi: 'Sơ cấp' } },
      { id: '00000000-0000-0000-0000-000000000023', code: 'B1', position: 3, label: { en: 'Intermediate', vi: 'Trung cấp' } },
      { id: '00000000-0000-0000-0000-000000000024', code: 'B2', position: 4, label: { en: 'Upper Intermediate', vi: 'Trung cao cấp' } },
    ];

    const levels = {};
    for (const l of levelsData) {
      const levelOverride = (overrides.levels && overrides.levels[l.code]) || {};
      const expectedLevel = {
        id: l.id,
        frameworkId: framework.id,
        code: l.code,
        label: l.label,
        position: l.position,
        ...levelOverride,
      };
      const level = await tx.level.upsert({
        where: {
          frameworkId_code: {
            frameworkId: framework.id,
            code: l.code,
          },
        },
        update: {},
        create: expectedLevel,
      });
      // DB-R8: Full semantic comparison (position, frameworkId, label JSON)
      if (
        level.position !== expectedLevel.position ||
        level.frameworkId !== framework.id ||
        !jsonEquals(level.label, expectedLevel.label)
      ) {
        throw new Error(
          `[seed] MISMATCH: Existing level '${l.code}' has conflicting position (${level.position} vs ${expectedLevel.position}) or label (${JSON.stringify(level.label)} vs ${JSON.stringify(expectedLevel.label)}). Refusing to overwrite.`
        );
      }
      levels[l.code] = level;
      console.log(`[seed] Level verified: ${level.code} pos ${level.position} (${level.id})`);
    }

    // 4. Course (app.courses - DEV fixture curriculum marked per DB-R8)
    const expectedCourse = {
      id: '00000000-0000-0000-0000-000000000030',
      languageId: langEn.id,
      frameworkId: framework.id,
      names: { en: '[DEV] English Core Curriculum', vi: '[DEV] Chương trình tiếng Anh chuẩn' },
      isActive: true,
      curriculumGeneration: 1n,
      defaultStartLevelId: levels['A1'].id,
      gateConfig: {},
      practiceConfig: {},
      coverageCatalog: {},
      coverageCatalogGeneration: 1n,
      ...overrides.course,
    };
    let course = await tx.course.findUnique({ where: { id: expectedCourse.id } });
    if (!course) {
      course = await tx.course.create({ data: expectedCourse });
      console.log(`[seed] DEV Course created: ${course.id}`);
    } else {
      if (
        course.languageId !== expectedCourse.languageId ||
        course.frameworkId !== expectedCourse.frameworkId ||
        course.defaultStartLevelId !== expectedCourse.defaultStartLevelId ||
        course.isActive !== expectedCourse.isActive ||
        course.curriculumGeneration !== expectedCourse.curriculumGeneration ||
        course.coverageCatalogGeneration !== expectedCourse.coverageCatalogGeneration ||
        !jsonEquals(course.names, expectedCourse.names) ||
        !jsonEquals(course.gateConfig, expectedCourse.gateConfig) ||
        !jsonEquals(course.practiceConfig, expectedCourse.practiceConfig) ||
        !jsonEquals(course.coverageCatalog, expectedCourse.coverageCatalog)
      ) {
        throw new Error(
          `[seed] MISMATCH: Existing course ${course.id} belongs to conflicting parents or configuration: language=${course.languageId}, framework=${course.frameworkId}, defaultStartLevel=${course.defaultStartLevelId}, names=${JSON.stringify(course.names)}, gateConfig=${JSON.stringify(course.gateConfig)}, practiceConfig=${JSON.stringify(course.practiceConfig)}, coverageCatalog=${JSON.stringify(course.coverageCatalog)}. Refusing to overwrite.`
        );
      }
      console.log(`[seed] DEV Course verified: ${course.id}`);
    }

    // 5. Unit (app.units - DEV fixture curriculum marked per DB-R8)
    const expectedUnit = {
      id: '00000000-0000-0000-0000-000000000040',
      courseId: course.id,
      levelId: levels['A1'].id,
      code: 'DEV-UNIT-01',
      position: 1,
      names: { en: '[DEV] Unit 1: Foundations', vi: '[DEV] Bài 1: Nền tảng' },
      ...overrides.unit,
    };
    const unit = await tx.unit.upsert({
      where: {
        courseId_levelId_position: {
          courseId: course.id,
          levelId: levels['A1'].id,
          position: 1,
        },
      },
      update: {},
      create: expectedUnit,
    });
    if (
      unit.courseId !== expectedUnit.courseId ||
      unit.levelId !== expectedUnit.levelId ||
      unit.position !== expectedUnit.position ||
      unit.code !== expectedUnit.code ||
      !jsonEquals(unit.names, expectedUnit.names)
    ) {
      throw new Error(
        `[seed] MISMATCH: Existing unit ${unit.id} has conflicting code (${unit.code} vs ${expectedUnit.code}), names (${JSON.stringify(unit.names)}), or parents. Refusing to overwrite.`
      );
    }
    console.log(`[seed] DEV Unit verified: ${unit.code} (${unit.id})`);

    // 6. Planned Lesson (app.lessons - PLANNED, no active revision)
    const expectedLesson = {
      id: '00000000-0000-0000-0000-000000000050',
      unitId: unit.id,
      position: 1,
      isRequired: true,
      availability: 'PLANNED',
      activeRevisionId: null,
      ...overrides.lesson,
    };
    const lesson = await tx.lesson.upsert({
      where: {
        unitId_position: {
          unitId: unit.id,
          position: 1,
        },
      },
      update: {},
      create: expectedLesson,
    });
    if (
      lesson.unitId !== expectedLesson.unitId ||
      lesson.position !== expectedLesson.position ||
      lesson.availability !== expectedLesson.availability ||
      lesson.isRequired !== expectedLesson.isRequired ||
      lesson.activeRevisionId !== expectedLesson.activeRevisionId
    ) {
      throw new Error(
        `[seed] MISMATCH: Existing lesson ${lesson.id} has availability=${lesson.availability} (expected ${expectedLesson.availability}), isRequired=${lesson.isRequired}, activeRevisionId=${lesson.activeRevisionId}. Refusing to overwrite.`
      );
    }
    console.log(`[seed] DEV Planned Lesson verified: pos ${lesson.position} (${lesson.id})`);

    console.log('[seed] Seeding completed successfully (all semantic records verified idempotent).');
    return { langEn, langVi, framework, levels, course, unit, lesson };
  };

  // If client is already in a transaction (no $transaction method), run directly
  if (typeof client.$transaction === 'function') {
    return client.$transaction(runner, { timeout: 30000 });
  }
  return runner(client);
}

async function main() {
  // Prisma CLI loads .env before invoking the configured seed command.
  const prisma = new PrismaClient();

  try {
    await seed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed.mjs')) {
  main().catch((err) => {
    const safeError = err instanceof Error ? err.message.replace(/postgresql:\/\/[^@]+@/gi, 'postgresql://***@') : String(err);
    console.error('[seed] Fatal error:', safeError);
    process.exit(1);
  });
}
