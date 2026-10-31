// =============================================================================
// Learner Database Server Module (Node ESM)
// Authority: plans/2026-10-31-slice-9-learner-auth-context.md
// Imports the existing generated product client server-only.
// =============================================================================

import 'server-only';
import { PrismaClient } from '../../../../lingora-admin/generated/product-client/index.js';

let prismaInstance: PrismaClient | null = null;

/**
 * Get or initialize the singleton Prisma client for the product database.
 * Uses DATABASE_URL from environment or optional override URL.
 */
export function getLearnerPrisma(databaseUrl?: string): PrismaClient {
  if (!prismaInstance) {
    const url = databaseUrl || process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not configured for learner database client');
    }
    prismaInstance = new PrismaClient({
      datasources: {
        db: { url },
      },
      log: [],
    });
  }
  return prismaInstance;
}

/**
 * Set a test double for the learner database client.
 * For use strictly by test infrastructure.
 */
export function setLearnerPrismaForTest(client: PrismaClient | null): void {
  prismaInstance = client;
}

/**
 * Disconnect cleanly from the database.
 */
export async function disconnect(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}
