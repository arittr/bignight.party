/**
 * Leaderboard types for real-time score tracking
 */

/**
 * Player information and scoring for leaderboard display
 */
export interface LeaderboardPlayer {
  /** User ID */
  userId: string;
  /** User display name */
  name: string;
  /** User email */
  email: string;
  /** User avatar image URL */
  image: string | null;
  /** Total points scored from correct picks */
  totalScore: number;
  /** Number of correct picks */
  correctCount: number;
  /** Rank position (1-based, handles ties) */
  rank: number;
  /** Whether this player is the current user viewing the leaderboard */
  isCurrentUser: boolean;
}

/**
 * Complete leaderboard data for a game
 */
export interface LeaderboardData {
  /** Array of players with scores, sorted by rank */
  players: LeaderboardPlayer[];
  /** Game ID this leaderboard belongs to */
  gameId: string;
  /** Timestamp of last update */
  updatedAt: Date;
}

/**
 * WebSocket event payload for leaderboard updates
 */
export interface LeaderboardUpdatePayload {
  /** Array of players with updated scores */
  players: LeaderboardPlayer[];
  /** Game ID for this update */
  gameId: string;
  /** Unix timestamp (milliseconds) when update was sent */
  timestamp: number;
}

/**
 * WebSocket event payload for joining a game room
 */
export interface JoinRoomPayload {
  /** Game ID to join */
  gameId: string;
}

/**
 * WebSocket event payload for error messages
 */
export interface LeaderboardErrorPayload {
  /** Human-readable error message */
  message: string;
  /** Error code for programmatic handling */
  code: string;
}
