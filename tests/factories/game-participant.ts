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
    id: "game-participant-test-1",
    userId: "user-test-1",
    gameId: "game-test-1",
    joinedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
