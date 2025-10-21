import { execSync } from "node:child_process";
import { afterAll, afterEach, beforeAll } from "vitest";
import { testPrisma, truncateAllTables } from "../utils/prisma";

/**
 * Test database setup and teardown
 *
 * beforeAll: Run Prisma migrations against test database
 * afterEach: Truncate all tables (fast cleanup between tests)
 * afterAll: Disconnect Prisma client
 */

beforeAll(async () => {
  execSync("dotenv -e .env.test -- prisma migrate deploy", {
    cwd: process.cwd(),
    stdio: "inherit",
  });
});

afterEach(async () => {
  // Truncate all tables between tests for isolation
  await truncateAllTables();
});

afterAll(async () => {
  // Disconnect Prisma client
  await testPrisma.$disconnect();
});
