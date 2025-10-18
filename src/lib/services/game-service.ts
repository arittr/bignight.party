import type { GameStatus, Prisma } from "@prisma/client";
import { match } from "ts-pattern";
import * as gameModel from "@/lib/models/game";

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
