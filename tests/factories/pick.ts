import type { Pick } from "@prisma/client";

/**
 * Build a Pick object for testing
 * @param overrides - Partial Pick object to override defaults
 * @returns Pick object with sensible defaults
 */
export function buildPick(overrides: Partial<Pick> = {}): Pick {
  return {
    id: "pick-test-1",
    gameId: "game-test-1",
    userId: "user-test-1",
    categoryId: "category-test-1",
    nominationId: "nomination-test-1",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}
