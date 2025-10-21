import type { Game, GameStatus } from "@prisma/client";

/**
 * Build a Game object for testing
 * @param overrides - Partial Game object to override defaults
 * @returns Game object with sensible defaults
 */
export function buildGame(overrides: Partial<Game> = {}): Game {
  return {
    accessCode: "TEST123",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    eventId: "event-test-1",
    id: "game-test-1",
    name: "Test Game",
    picksLockAt: new Date("2025-03-02T19:00:00Z"),
    status: "OPEN" as GameStatus,
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}
