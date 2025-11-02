import type { GameStatus } from "@prisma/client";
import { match } from "ts-pattern";
import * as gameModel from "@/lib/models/game";
import * as gameParticipantModel from "@/lib/models/game-participant";
import * as nominationModel from "@/lib/models/nomination";
import * as pickModel from "@/lib/models/pick";

/**
 * Submit or update a pick for a user in a game
 * Validates:
 * - User is a game participant
 * - Game status is OPEN (not SETUP, LIVE, or COMPLETED)
 * - Nomination belongs to the specified category
 */
export async function submitPick(
  userId: string,
  data: {
    gameId: string;
    categoryId: string;
    nominationId: string;
  }
) {
  const { gameId, categoryId, nominationId } = data;

  // Validate user is a game participant
  const isParticipant = await gameParticipantModel.exists(userId, gameId);
  if (!isParticipant) {
    throw new Error("User is not a participant in this game");
  }

  // Fetch game and validate status
  const game = await gameModel.findById(gameId);
  if (!game) {
    throw new Error(`Game with id ${gameId} not found`);
  }

  // Use ts-pattern to check game status with .exhaustive()
  const canAcceptPicks = match(game.status as GameStatus)
    .with("SETUP", () => false)
    .with("OPEN", () => true)
    .with("LIVE", () => false)
    .with("COMPLETED", () => false)
    .exhaustive();

  if (!canAcceptPicks) {
    throw new Error("Game is not accepting picks");
  }

  // Validate nomination belongs to category
  const nomination = await nominationModel.findById(nominationId);
  if (!nomination) {
    throw new Error(`Nomination with id ${nominationId} not found`);
  }

  if (nomination.categoryId !== categoryId) {
    throw new Error("Nomination does not belong to this category");
  }

  // All validations passed, upsert the pick
  const pick = await pickModel.upsert({
    categoryId,
    gameId,
    nominationId,
    userId,
  });

  return {
    success: true,
    pick: {
      id: pick.id,
      gameId: pick.gameId,
      userId: pick.userId,
      categoryId: pick.categoryId,
      nominationId: pick.nominationId,
      createdAt: pick.createdAt,
      updatedAt: pick.updatedAt,
    },
  };
}
