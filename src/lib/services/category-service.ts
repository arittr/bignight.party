import * as categoryModel from "@/lib/models/category";
import * as gameModel from "@/lib/models/game";
import * as leaderboardService from "@/lib/services/leaderboard-service";

/**
 * Mark a winner for a category
 * Sets the winnerNominationId and marks the category as revealed in a single operation
 *
 * After marking the winner, broadcasts leaderboard updates to all games using this event.
 * Broadcast errors are logged but don't fail the winner reveal operation.
 *
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

  // Mark winner and reveal in one operation
  const updatedCategory = await categoryModel.update(categoryId, {
    isRevealed: true,
    winnerNominationId: nominationId,
  });

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

/**
 * Clear the winner for a category
 * Removes the winnerNominationId and unreveals the category in a single operation
 */
export async function clearWinner(categoryId: string) {
  return categoryModel.update(categoryId, {
    isRevealed: false,
    winnerNominationId: null,
  });
}
