import type { Nomination } from "@prisma/client";

/**
 * Build a Nomination object for testing
 * @param overrides - Partial Nomination object to override defaults
 * @returns Nomination object with sensible defaults
 */
export function buildNomination(overrides: Partial<Nomination> = {}): Nomination {
  return {
    id: "nomination-test-1",
    categoryId: "category-test-1",
    workId: null,
    personId: null,
    nominationText: "Oppenheimer",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}
