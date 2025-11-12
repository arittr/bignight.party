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
 * Validates compound key (gameId + accessCode) and game status before creating membership
 */
export async function joinGame(userId: string, gameId: string, accessCode: string) {
  // Query game with compound WHERE clause validation
  const game = await gameModel.findByIdAndAccessCode(gameId, accessCode);

  // Validate game exists (compound key validation)
  if (!game) {
    throw new Error("Game not found or invalid access code");
  }

  // Validate game status using ts-pattern
  const canJoin = match(game.status)
    .with("SETUP", () => false)
    .with("OPEN", () => true)
    .with("LIVE", () => true)
    .with("COMPLETED", () => false)
    .exhaustive();

  if (!canJoin) {
    throw new Error(
      game.status === "SETUP"
        ? "This game is not yet open for joining"
        : "This game is no longer accepting new players"
    );
  }

  // Check if user is already a member (idempotent operation)
  const existingParticipant = await gameParticipantModel.findByUserIdAndGameId(userId, gameId);

  if (existingParticipant) {
    // Return existing participant instead of creating duplicate
    return existingParticipant;
  }

  // Create new participant record
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

  // Build results matching contract output shape
  const gamesWithCompletion = await Promise.all(
    participants.map(async (participant) => {
      const picksCount = await pickModel.getPicksCountByGameAndUser(participant.gameId, userId);
      const participantsCount = await gameParticipantModel.getParticipantsCount(participant.gameId);

      return {
        id: participant.game.id,
        name: participant.game.name,
        status: participant.game.status,
        accessCode: participant.game.accessCode,
        picksLockAt: participant.game.picksLockAt,
        eventId: participant.game.eventId,
        createdAt: participant.game.createdAt,
        updatedAt: participant.game.updatedAt,
        event: {
          id: participant.game.event.id,
          name: participant.game.event.name,
          eventDate: participant.game.event.eventDate,
        },
        _count: {
          participants: participantsCount,
          picks: picksCount,
        },
      };
    })
  );

  return gamesWithCompletion;
}

