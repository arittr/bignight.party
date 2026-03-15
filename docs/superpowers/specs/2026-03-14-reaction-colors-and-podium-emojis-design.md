# Reaction Name Colors & Podium Emojis

## Problem

Floating emoji reactions show usernames in uniform semi-transparent white (`text-white/50`), making it impossible to tell who sent what. Top players have no visual distinction in reactions.

## Solution

1. **Hash-based name colors** — each player gets a stable color derived from their `playerId`.
2. **Podium emojis** — 1st/2nd/3rd place players get their podium emoji prefixed to their name in reactions.

## Design

### Hash-based name colors

A utility function `playerColor(playerId: string): string` in the web package maps a player ID to one of ~10 curated colors. The palette is chosen for readability on dark backgrounds (saturated pastels).

**Algorithm:** Sum the char codes of the `playerId`, mod by palette length. Deterministic — same player always gets the same color.

**Palette (approximate):**

| Index | Color   | Hex       |
|-------|---------|-----------|
| 0     | Coral   | `#FF6B6B` |
| 1     | Sky     | `#4ECDC4` |
| 2     | Lime    | `#A8E06C` |
| 3     | Violet  | `#C084FC` |
| 4     | Amber   | `#FBBF24` |
| 5     | Teal    | `#2DD4BF` |
| 6     | Pink    | `#F472B6` |
| 7     | Orange  | `#FB923C` |
| 8     | Mint    | `#6EE7B7` |
| 9     | Lavender| `#A78BFA` |

**Usage:** Replace `text-white/50` on the name `<span>` in `ReactionBar` with an inline `style={{ color }}`.

**File:** New utility `packages/web/src/lib/player-color.ts`.

### Podium emojis in reactions

**Rank emojis (matching the podium component):**
- Rank 1 → 🪿 (goose)
- Rank 2 → 🥈
- Rank 3 → 🥉
- All others → no emoji

**Server change:** The reaction broadcast payload gains a `rank` field. When a player sends a reaction, the server queries their current leaderboard rank and includes it.

**Schema change:** `ReactionBroadcastSchema` adds `rank: z.number().nullable()`. Null means the player isn't on the leaderboard (hasn't completed picks).

**Server implementation:** Extract the leaderboard ranking query into a reusable function callable by both the leaderboard API route and the WebSocket reaction handler. The WebSocket handler calls this to look up the sending player's rank.

**Client rendering:** The floating reaction renders as: `{emoji} {rankEmoji} {coloredName}` — e.g., `🔥 🪿 Drew` with "Drew" in their assigned color.

### Data flow

```
Player taps reaction
  → client emits REACTION_SEND { emoji }
  → server looks up playerName + current rank
  → server broadcasts REACTION_BROADCAST { playerId, name, emoji, id, timestamp, rank }
  → client receives broadcast
  → client computes color from playerId (client-side only)
  → client maps rank to podium emoji (client-side)
  → floating reaction renders with color + podium emoji
```

### Interface changes

**`FloatingReaction` (use-reactions.ts and reaction-bar.tsx):** Add `playerId: string` and `rank: number | null`. The `playerId` field is already in the broadcast but wasn't included in the client-side interface.

### Files touched

| File | Change |
|------|--------|
| `packages/shared/src/schemas.ts` | Add `rank` to `ReactionBroadcastSchema` |
| `packages/server/src/websocket/server.ts` | Look up player rank, include in broadcast |
| `packages/server/src/routes/leaderboard.ts` (or equivalent) | Extract ranking query into reusable function |
| `packages/web/src/lib/player-color.ts` | New — `playerColor()` utility |
| `packages/web/src/hooks/use-reactions.ts` | Add `playerId` and `rank` to `FloatingReaction` |
| `packages/web/src/components/reaction-bar.tsx` | Add `playerId` and `rank` to interface, render colored name with podium emoji |

### Testing

- Unit test for `playerColor()`: deterministic output, same input always returns same color, different inputs produce varied colors.
- Unit test for rank-to-emoji mapping.
- Integration test: reaction broadcast includes rank field.
- Existing reaction tests should continue to pass with the new field.
