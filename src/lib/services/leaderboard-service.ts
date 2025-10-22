/**
 * Leaderboard service for real-time score calculation and broadcasting
 *
 * Responsibilities:
 * - Calculate leaderboard scores by calling the pick model
 * - Broadcast updates to connected clients via WebSocket
 * - Mark current user for UI highlighting
 *
 * This service sits between the models layer (data access) and the WebSocket
 * layer (real-time communication). It contains the business logic for when
 * and how to broadcast leaderboard updates.
 */

import * as pickModel from "@/lib/models/pick";
import { emitLeaderboardUpdate } from "@/lib/websocket/server";
import type {
  LeaderboardData,
  LeaderboardPlayer,
  LeaderboardUpdatePayload,
} from "@/types/leaderboard";

/**
 * Calculate the leaderboard for a game
 *
 * Fetches all player scores from the database and returns structured
 * leaderboard data. This is a pure data-fetching operation with no side effects.
 *
 * @param gameId - Game ID to calculate leaderboard for
 * @returns Leaderboard data with all players and their scores
 *
 * @example
 * ```typescript
 * const leaderboard = await calculateLeaderboard(gameId);
 * // { players: [...], gameId: "abc123", updatedAt: Date(...) }
 * ```
 */
export async function calculateLeaderboard(gameId: string): Promise<LeaderboardData> {
  // Call the model layer to get leaderboard data
  const players = await pickModel.getLeaderboard(gameId);

  // Build and return the complete leaderboard data structure
  const data: LeaderboardData = {
    gameId,
    players,
    updatedAt: new Date(),
  };

  return data;
}

/**
 * Broadcast a leaderboard update to all connected clients in a game room
 *
 * Combines calculation and broadcasting into a single operation. This is the
 * primary function called by the admin service after revealing a winner.
 *
 * Errors during broadcast are logged but do not throw - we don't want to fail
 * the winner reveal operation just because the WebSocket broadcast fails.
 *
 * @param gameId - Game ID to broadcast update for
 *
 * @example
 * ```typescript
 * // After admin reveals a winner
 * await categoryService.markWinner(categoryId, nominationId);
 * await broadcastLeaderboardUpdate(gameId); // Notify all clients
 * ```
 */
export async function broadcastLeaderboardUpdate(gameId: string): Promise<void> {
  try {
    // Calculate the latest leaderboard data
    const leaderboard = await calculateLeaderboard(gameId);

    // Build the WebSocket payload
    const payload: LeaderboardUpdatePayload = {
      gameId,
      players: leaderboard.players,
      timestamp: Date.now(),
    };

    // Emit to all clients in the game room
    emitLeaderboardUpdate(gameId, payload);

    // biome-ignore lint/suspicious/noConsole: Broadcast success logging is intentional for debugging
    console.log(
      `[Leaderboard] Broadcast update for game ${gameId} - ${leaderboard.players.length} players`
    );
  } catch (error) {
    // Log the error but don't throw - we don't want to fail the winner reveal
    // just because the WebSocket broadcast failed
    // biome-ignore lint/suspicious/noConsole: Error logging is intentional for debugging
    console.error(`[Leaderboard] Failed to broadcast update for game ${gameId}:`, error);
  }
}

/**
 * Mark the current user in a list of players
 *
 * This is a pure utility function used by the UI layer to highlight the
 * current user's row in the leaderboard. It does not modify the original
 * array, instead returning a new array with updated isCurrentUser flags.
 *
 * @param players - Array of players from the leaderboard
 * @param currentUserId - User ID of the current user viewing the leaderboard
 * @returns New array with isCurrentUser flags set correctly
 *
 * @example
 * ```typescript
 * const players = await calculateLeaderboard(gameId);
 * const playersWithCurrentUser = markCurrentUser(players.players, session.user.id);
 * ```
 */
export function markCurrentUser(
  players: LeaderboardPlayer[],
  currentUserId: string
): LeaderboardPlayer[] {
  return players.map((player) => ({
    ...player,
    isCurrentUser: player.userId === currentUserId,
  }));
}
