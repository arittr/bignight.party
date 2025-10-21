import type { Nomination } from "@prisma/client";

/**
 * Build a Nomination object for testing
 * @param overrides - Partial Nomination object to override defaults
 * @returns Nomination object with sensible defaults
 */
export function buildNomination(overrides: Partial<Nomination> = {}): Nomination {
  return {
    categoryId: "category-test-1",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    id: "nomination-test-1",
    nominationText: "Oppenheimer",
    personId: null,
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    workId: null,
    ...overrides,
  };
}
