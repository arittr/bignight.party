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
  "#F87171", // red
  "#38BDF8", // light blue
  "#BEF264", // yellow-green
  "#E879F9", // fuchsia
  "#FCD34D", // gold
  "#34D399", // emerald
  "#FDA4AF", // rose
  "#FDBA74", // peach
  "#86EFAC", // light green
  "#818CF8", // indigo
  "#FCA5A1", // salmon
  "#67E8F9", // cyan
  "#D9F99D", // chartreuse
  "#D946EF", // magenta
  "#FDE047", // lemon
  "#5EEAD4", // aqua
  "#F9A8D4", // blush
  "#F97316", // tangerine
  "#A7F3D0", // seafoam
  "#6366F1", // blue-violet
  "#FECDD3", // light rose
  "#7DD3FC", // powder blue
  "#ECFCCB", // pale lime
  "#E9D5FF", // pale violet
  "#FEF08A", // cream
  "#99F6E4", // pale teal
  "#FBCFE8", // pale pink
  "#FED7AA", // light peach
  "#BBF7D0", // pale mint
  "#C7D2FE", // pale indigo
  "#FF9F43", // marigold
  "#48DBFB", // electric blue
  "#BADC58", // olive green
  "#F368E0", // hot pink
  "#FFD93D", // sunflower
  "#0ABDE3", // cerulean
  "#FF6348", // vermilion
  "#55E6C1", // jade
  "#CF6A87", // dusty rose
  "#58B19F", // sage
] as const;

/** Map a player ID to a stable color from the palette. */
export function playerColor(playerId: string): string {
  let hash = 5381;
  for (let i = 0; i < playerId.length; i++) {
    hash = ((hash << 5) + hash + playerId.charCodeAt(i)) | 0;
  }
  return PLAYER_COLORS[Math.abs(hash) % PLAYER_COLORS.length];
}
