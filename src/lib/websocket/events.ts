/**
 * WebSocket event types and payloads for real-time leaderboard updates
 */

import type {
  GameCompletedPayload,
  JoinRoomPayload,
  LeaderboardErrorPayload,
  LeaderboardUpdatePayload,
} from "@/types/leaderboard";

/**
 * WebSocket event names as constants
 */
export const LEADERBOARD_EVENTS = {
  /** Error message sent to a specific client */
  // biome-ignore lint/style/useNamingConvention: UPPER_CASE is correct for constant event names
  ERROR: "leaderboard:error",
  /** Game completion status change broadcast to all clients in a game room */
  // biome-ignore lint/style/useNamingConvention: UPPER_CASE is correct for constant event names
  GAME_COMPLETED: "game:completed",
  /** Client request to join a game room */
  // biome-ignore lint/style/useNamingConvention: UPPER_CASE is correct for constant event names
  JOIN: "join",
  // biome-ignore lint/style/useNamingConvention: UPPER_CASE is correct for constant event names
  REACTION_BROADCAST: "reaction:broadcast",
  // Future: Reactions feature (not implemented)
  // biome-ignore lint/style/useNamingConvention: UPPER_CASE is correct for constant event names
  REACTION_SEND: "reaction:send",
  /** Leaderboard data update broadcast to all clients in a game room */
  // biome-ignore lint/style/useNamingConvention: UPPER_CASE is correct for constant event names
  UPDATE: "leaderboard:update",
} as const;

/**
 * Type-safe event names
 */
export type LeaderboardEventName = (typeof LEADERBOARD_EVENTS)[keyof typeof LEADERBOARD_EVENTS];

/**
 * Re-export payload types from shared types module
 */
export type { GameCompletedPayload, JoinRoomPayload, LeaderboardErrorPayload, LeaderboardUpdatePayload };
