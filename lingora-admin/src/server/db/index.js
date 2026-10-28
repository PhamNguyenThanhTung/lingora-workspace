// =============================================================================
// Product Database Server Module (Node ESM)
// Authority: plans/2026-10-27-product-database-spec.md §5
// =============================================================================

import { PrismaClient } from '../../../generated/product-client/index.js';

let prismaInstance = null;

/**
 * Get or initialize the singleton Prisma client for the product database.
 * Uses DATABASE_URL from environment or optional override URL.
 * @param {string} [databaseUrl]
 * @returns {PrismaClient}
 */
export function getProductPrisma(databaseUrl) {
  if (!prismaInstance) {
    const url = databaseUrl || process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not configured for product database client');
    }
    prismaInstance = new PrismaClient({
      datasources: {
        db: { url },
      },
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return prismaInstance;
}

/**
 * Connect explicitly to the product database.
 * @param {PrismaClient} [client]
 */
export async function connect(client) {
  const db = client || getProductPrisma();
  await db.$connect();
}

/**
 * Disconnect cleanly from the product database.
 */
export async function disconnect() {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

/**
 * Safe health/connectivity check.
 * Performs a lightweight parameterized read without exposing credentials or sensitive payloads.
 * @param {PrismaClient} [client]
 * @returns {Promise<{ ok: boolean, latencyMs: number, languageCount?: number, error?: string }>}
 */
export async function checkHealth(client) {
  const start = Date.now();
  try {
    const db = client || getProductPrisma();
    // Safe read on public catalog table: count languages
    const languageCount = await db.language.count();
    const latencyMs = Date.now() - start;
    return {
      ok: true,
      latencyMs,
      languageCount,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    // Redact error message to never leak DB credentials/URL
    const safeError = err instanceof Error ? err.message.replace(/postgresql:\/\/[^@]+@/gi, 'postgresql://***@') : String(err);
    return {
      ok: false,
      latencyMs,
      error: safeError,
    };
  }
}

/**
 * Read canonical course path relations: language -> course -> unit -> lesson
 * Used by representative server-side relational reads.
 * @param {PrismaClient} [client]
 * @param {string} [courseId]
 */
export async function readCanonicalCoursePath(client, courseId) {
  const db = client || getProductPrisma();
  const where = courseId ? { id: courseId } : { isActive: true };
  return db.course.findFirst({
    where,
    include: {
      language: true,
      framework: true,
      defaultStartLevel: true,
      units: {
        orderBy: { position: 'asc' },
        include: {
          level: true,
          lessons: {
            orderBy: { position: 'asc' },
          },
        },
      },
    },
  });
}
