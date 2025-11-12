import * as categoryModel from "@/lib/models/category";
import * as gameModel from "@/lib/models/game";
import * as pickModel from "@/lib/models/pick";
import * as gameService from "@/lib/services/game-service";
import * as leaderboardService from "@/lib/services/leaderboard-service";

/**
 * Mark a winner for a category and update game state
 *
 * Orchestrates the complete winner marking flow:
 * 1. Validates nomination belongs to category
 * 2. Marks winner atomically (calls categoryModel.markWinner)
 * 3. Broadcasts leaderboard updates to all games using this event
 * 4. Checks if all categories revealed - if yes, completes the game
 *
 * Broadcast and game completion errors are logged but don't fail the operation.
 *
 * @param categoryId - The category ID to mark winner for
 * @param nominationId - The nomination ID that won
 * @param gameId - The game ID to check for completion
 * @throws Error if nomination does not belong to the category
 *
 * @example
 * ```ts
 * await markWinnerAndUpdate(categoryId, nominationId, gameId);
 * // Category marked, leaderboard updated, game may complete
 * ```
 */
export async function markWinnerAndUpdate(
  categoryId: string,
  nominationId: string,
  gameId: string
) {
  // Validate nomination belongs to category
  const category = await categoryModel.findById(categoryId);

  if (!category) {
    throw new Error(`Category with id ${categoryId} not found`);
  }

  const nominationBelongsToCategory = category.nominations.some((nom) => nom.id === nominationId);

  if (!nominationBelongsToCategory) {
    throw new Error(`Nomination ${nominationId} does not belong to category ${categoryId}`);
  }

  // Mark winner atomically using model method
  const updatedCategory = await categoryModel.markWinner(categoryId, nominationId);

  // Broadcast leaderboard updates to all games using this event
  // Find all games for this event and trigger leaderboard updates
  const games = await gameModel.findByEventId(category.eventId);

  // Broadcast to all games in parallel (don't wait for completion)
  // Errors are handled gracefully inside broadcastLeaderboardUpdate
  for (const game of games) {
    // Fire and forget - don't await, don't fail if broadcast fails
    leaderboardService.broadcastLeaderboardUpdate(game.id).catch((error) => {
      // biome-ignore lint/suspicious/noConsole: Error logging is intentional for debugging
      console.error(`[Category] Failed to broadcast leaderboard for game ${game.id}:`, error);
    });
  }

  // Check if all categories revealed for THIS game
  try {
    const allRevealed = await pickModel.areAllCategoriesRevealed(gameId);

    if (allRevealed) {
      // Trigger game completion (handles LIVE validation internally)
      await gameService.completeGame(gameId);
    }
  } catch (error) {
    // Log but don't throw - game completion is optional side effect
    // biome-ignore lint/suspicious/noConsole: Error logging is intentional for debugging
    console.error(`[Category] Failed to check/complete game ${gameId}:`, error);
  }

  return updatedCategory;
}

/**
 * Clear the winner for a category
 * Removes the winnerNominationId and unreveals the category atomically
 *
 * @param categoryId - The category ID to clear winner for
 * @returns Updated category with winner cleared
 *
 * @example
 * ```ts
 * await clearWinner(categoryId);
 * // Category now has: { isRevealed: false, winnerNominationId: null }
 * ```
 */
export async function clearWinner(categoryId: string) {
  return categoryModel.clearWinner(categoryId);
}

/**
 * Mark a winner for a category (legacy method)
 * Sets the winnerNominationId and marks the category as revealed in a single operation
 *
 * After marking the winner, broadcasts leaderboard updates to all games using this event.
 * Broadcast errors are logged but don't fail the winner reveal operation.
 *
 * @deprecated Use markWinnerAndUpdate() instead for game completion support
 * @throws Error if nomination does not belong to the category
 */
export async function markWinner(categoryId: string, nominationId: string) {
  // Validate nomination belongs to category
  const category = await categoryModel.findById(categoryId);

  if (!category) {
    throw new Error(`Category with id ${categoryId} not found`);
  }

  const nominationBelongsToCategory = category.nominations.some((nom) => nom.id === nominationId);

  if (!nominationBelongsToCategory) {
    throw new Error(`Nomination ${nominationId} does not belong to category ${categoryId}`);
  }

  // Mark winner atomically using model method
  const updatedCategory = await categoryModel.markWinner(categoryId, nominationId);

  // Broadcast leaderboard updates to all games using this event
  // Find all games for this event and trigger leaderboard updates
  const games = await gameModel.findByEventId(category.eventId);

  // Broadcast to all games in parallel (don't wait for completion)
  // Errors are handled gracefully inside broadcastLeaderboardUpdate
  for (const game of games) {
    // Fire and forget - don't await, don't fail if broadcast fails
    leaderboardService.broadcastLeaderboardUpdate(game.id).catch((error) => {
      // biome-ignore lint/suspicious/noConsole: Error logging is intentional for debugging
      console.error(`[Category] Failed to broadcast leaderboard for game ${game.id}:`, error);
    });
  }

  return updatedCategory;
}
