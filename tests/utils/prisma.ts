import { PrismaClient } from "@prisma/client";

/**
 * Shared test Prisma client instance
 * Uses DATABASE_URL from .env.test which points to the test database
 */
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

/**
 * Truncates all tables in the test database
 * Used in afterEach to clean up between tests
 */
export async function truncateAllTables() {
  const tablenames = await testPrisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  for (const { tablename } of tablenames) {
    if (tablename !== "_prisma_migrations") {
      try {
        await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (_error) {}
    }
  }
}
