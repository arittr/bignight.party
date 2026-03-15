/**
 * Curated palette of saturated pastels readable on dark backgrounds.
 * Indexed by a hash of the player ID for stable, per-player colors.
 */
export const PLAYER_COLORS = [
  "#FF6B6B", // coral
  "#4ECDC4", // sky
  "#A8E06C", // lime
  "#C084FC", // violet
  "#FBBF24", // amber
  "#2DD4BF", // teal
  "#F472B6", // pink
  "#FB923C", // orange
  "#6EE7B7", // mint
  "#A78BFA", // lavender
] as const;

/** Map a player ID to a stable color from the palette. */
export function playerColor(playerId: string): string {
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) {
    hash += playerId.charCodeAt(i);
  }
  return PLAYER_COLORS[hash % PLAYER_COLORS.length];
}
