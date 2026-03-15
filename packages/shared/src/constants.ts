export const ALLOWED_REACTIONS = ["🔥", "💕", "💩", "💀", "👏", "😱", "🍿", "🏆"] as const;
export type AllowedReaction = (typeof ALLOWED_REACTIONS)[number];

export const WEBSOCKET_EVENTS = {
  LEADERBOARD_UPDATE: "leaderboard:update",
  GAME_COMPLETED: "game:completed",
  REACTION_BROADCAST: "reaction:broadcast",
  JOIN: "join",
  REACTION_SEND: "reaction:send",
} as const;

/** Point values by category name. Matched case-insensitively by getCategoryPoints(). */
export const CATEGORY_POINTS: Record<string, number> = {
  "Best Picture": 5,
  "Best Director": 4,
  "Best Actor": 3,
  "Best Actress": 3,
  "Best Supporting Actor": 2,
  "Best Supporting Actress": 2,
  "Best Original Screenplay": 2,
  "Best Adapted Screenplay": 2,
  "Best Animated Feature": 2,
  "Best International Feature": 2,
  "Best Casting": 2,
};

/**
 * Look up point value for a category by name.
 * Returns the mapped value or 1 for unrecognized categories (technical/craft awards).
 */
export function getCategoryPoints(categoryName: string): number {
  const normalized = categoryName.toLowerCase();
  for (const [name, points] of Object.entries(CATEGORY_POINTS)) {
    if (name.toLowerCase() === normalized) return points;
  }
  return 1;
}

export const REACTION_TTL_MS = 3000;
export const TOKEN_EXPIRY_HOURS = 24;
export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 6;
