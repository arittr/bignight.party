import type { GameStatus, Prisma } from "@prisma/client";
import { match } from "ts-pattern";
import * as categoryModel from "@/lib/models/category";
import * as gameModel from "@/lib/models/game";
import * as gameParticipantModel from "@/lib/models/game-participant";
import * as pickModel from "@/lib/models/pick";

/**
 * Create a new game
 */
export async function createGame(data: Prisma.GameCreateInput) {
  return gameModel.create(data);
}

/**
 * Update an existing game
 */
export async function updateGame(id: string, data: Prisma.GameUpdateInput) {
  return gameModel.update(id, data);
}

/**
 * Delete a game (cascades to picks via Prisma schema)
 */
export async function deleteGame(id: string) {
  return gameModel.deleteById(id);
}

/**
 * Validate and update game status with state machine logic
 */
export async function updateGameStatus(
  id: string,
  newStatus: GameStatus
): Promise<ReturnType<typeof gameModel.update>> {
  const game = await gameModel.findById(id);

  if (!game) {
    throw new Error(`Game with id ${id} not found`);
  }

  // Validate state transition using ts-pattern
  const isValidTransition = match([game.status, newStatus] as const)
    .with(["SETUP", "OPEN"], () => true)
    .with(["SETUP", "SETUP"], () => true)
    .with(["OPEN", "LIVE"], () => true)
    .with(["OPEN", "OPEN"], () => true)
    .with(["LIVE", "COMPLETED"], () => true)
    .with(["LIVE", "LIVE"], () => true)
    .with(["COMPLETED", "COMPLETED"], () => true)
    .otherwise(() => false);

  if (!isValidTransition) {
    throw new Error(`Invalid status transition from ${game.status} to ${newStatus}`);
  }

  // Validate business rules based on status
  match(newStatus)
    .with("SETUP", () => {
      // No special validation needed for SETUP
    })
    .with("OPEN", () => {
      // Validate that picksLockAt is set when opening
      if (!game.picksLockAt) {
        throw new Error("Cannot open game without picksLockAt date");
      }
    })
    .with("LIVE", () => {
      // No special validation needed for LIVE
    })
    .with("COMPLETED", () => {
      // No special validation needed for COMPLETED
    })
    .exhaustive();

  // Update the game status
  return gameModel.update(id, { status: newStatus });
}

/**
 * Join a game as a participant
 * Validates that the game exists before creating membership
 */
export async function joinGame(userId: string, gameId: string) {
  // Validate game exists
  const game = await gameModel.findById(gameId);

  if (!game) {
    throw new Error(`Game with id ${gameId} not found`);
  }

  // Create participant record
  return gameParticipantModel.create({ gameId, userId });
}

/**
 * Check if a user is a member of a game
 */
export async function checkMembership(userId: string, gameId: string): Promise<boolean> {
  return gameParticipantModel.exists(userId, gameId);
}

/**
 * Get all games for a user with completion counts
 * Returns games with picks count vs total categories
 */
export async function getUserGames(userId: string) {
  const participants = await gameParticipantModel.findByUserId(userId);

  // Build results with completion counts
  const gamesWithCompletion = await Promise.all(
    participants.map(async (participant) => {
      const picksCount = await pickModel.getPicksCountByGameAndUser(participant.gameId, userId);
      const categories = await categoryModel.getCategoriesByEventId(participant.game.eventId);

      return {
        game: participant.game,
        picksCount,
        totalCategories: categories.length,
      };
    })
  );

  return gamesWithCompletion;
}

/**
 * Resolve access code to gameId and check membership status
 * Returns { gameId, isMember } object
 */
export async function resolveAccessCode(
  code: string,
  userId: string
): Promise<{ gameId: string; isMember: boolean }> {
  // Find game by access code
  const game = await gameModel.findByAccessCode(code);

  if (!game) {
    throw new Error(`Game with access code ${code} not found`);
  }

  // Check if user is already a member
  const isMember = await gameParticipantModel.exists(userId, game.id);

  return {
    gameId: game.id,
    isMember,
  };
}
