import type { Game, GameStatus } from "@prisma/client";

/**
 * Build a Game object for testing
 * @param overrides - Partial Game object to override defaults
 * @returns Game object with sensible defaults
 */
export function buildGame(overrides: Partial<Game> = {}): Game {
  return {
    id: "game-test-1",
    eventId: "event-test-1",
    name: "Test Game",
    accessCode: "TEST123",
    status: "OPEN" as GameStatus,
    picksLockAt: new Date("2025-03-02T19:00:00Z"),
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}
