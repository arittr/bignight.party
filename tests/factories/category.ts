import type { Category } from "@prisma/client";

/**
 * Build a Category object for testing
 * @param overrides - Partial Category object to override defaults
 * @returns Category object with sensible defaults
 */
export function buildCategory(overrides: Partial<Category> = {}): Category {
  return {
    createdAt: new Date("2025-01-01T00:00:00Z"),
    eventId: "event-test-1",
    id: "category-test-1",
    isRevealed: false,
    name: "Best Picture",
    order: 1,
    points: 10,
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    winnerNominationId: null,
    ...overrides,
  };
}
