import type { GameParticipant } from "@prisma/client";

/**
 * Build a GameParticipant with sensible defaults
 *
 * @example
 * const participant = buildGameParticipant()
 * const customParticipant = buildGameParticipant({ userId: 'user-123', gameId: 'game-456' })
 */
export function buildGameParticipant(overrides: Partial<GameParticipant> = {}): GameParticipant {
  const now = new Date();

  return {
    createdAt: now,
    gameId: "game-test-1",
    id: "game-participant-test-1",
    joinedAt: now,
    updatedAt: now,
    userId: "user-test-1",
    ...overrides,
  };
}
