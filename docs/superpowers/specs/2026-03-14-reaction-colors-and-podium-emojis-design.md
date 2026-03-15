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

**Rank emojis:** Shared constant `RANK_EMOJIS` in `packages/shared/src/constants.ts`, used by both `podium.tsx` and `ReactionBar`. This prevents the podium component and reaction rendering from drifting.

- Rank 1 → 🪿 (goose)
- Rank 2 → 🥈
- Rank 3 → 🥉
- All others → no emoji

**Server change:** The reaction broadcast payload gains a `rank` field. When a player sends a reaction, the server calls the existing `getLeaderboard(db)` from `packages/server/src/services/leaderboard.ts` and finds the player's rank in the result.

**Performance note:** `getLeaderboard` does a full scan of categories/picks/players. This is acceptable for a party game with ~15 users. No caching needed.

**Schema change:** `ReactionBroadcastSchema` adds `rank: z.number().int().positive().nullable()`. Null means the player isn't on the leaderboard (hasn't completed picks, is admin, or no winners revealed yet).

**When `db` is not available:** `configureSocketServer` receives `db` as an optional parameter. When `db` is undefined (e.g., in tests using `createSocketServer` without a db), rank defaults to `null`. No podium emoji is shown.

**Client rendering:** The floating reaction renders as: `{emoji} {rankEmoji} {coloredName}` — e.g., `🔥 🪿 Drew` with "Drew" in their assigned color.

### Edge cases

- **Admin reactions:** Admin is not on the leaderboard → `rank: null` → no podium emoji. No special-case code needed.
- **Players without all picks:** Filtered out by `getLeaderboard` → `rank: null` → no podium emoji.
- **Pre-reveal (no winners yet):** All leaderboard players have 0 points and rank 1. This is correct — tied players share rank 1, and they'd all get the goose. This is fine; it's a fun detail before scoring starts.
- **Tied ranks:** Handled by `buildLeaderboard` already. Two players tied at rank 1 both get 🪿. Next player is rank 3 and gets 🥉. No one gets 🥈. This matches podium behavior.

### Data flow

```
Player taps reaction
  → client emits REACTION_SEND { emoji }
  → server looks up playerName (existing) + calls getLeaderboard(db) for rank
  → server broadcasts REACTION_BROADCAST { playerId, name, emoji, id, timestamp, rank }
  → client receives broadcast
  → client computes color from playerId (client-side only)
  → client maps rank to podium emoji via shared RANK_EMOJIS constant
  → floating reaction renders with color + podium emoji
```

### Interface changes

**`FloatingReaction`:** Currently duplicated in `use-reactions.ts` and `reaction-bar.tsx`. Consolidate into a single definition in `use-reactions.ts` and import in `reaction-bar.tsx`. Add `playerId: string` and `rank: number | null`.

### Files touched

| File | Change |
|------|--------|
| `packages/shared/src/constants.ts` | Add `RANK_EMOJIS` map (rank → emoji) |
| `packages/shared/src/schemas.ts` | Add `rank` to `ReactionBroadcastSchema` |
| `packages/server/src/websocket/server.ts` | Call `getLeaderboard(db)` for player rank, include in broadcast |
| `packages/web/src/lib/player-color.ts` | New — `playerColor()` utility |
| `packages/web/src/hooks/use-reactions.ts` | Add `playerId` and `rank` to `FloatingReaction`, export the interface |
| `packages/web/src/components/reaction-bar.tsx` | Import `FloatingReaction`, render colored name with podium emoji |
| `packages/web/src/components/podium.tsx` | Use shared `RANK_EMOJIS` constant instead of local `PODIUM_CONFIG.medal` |

### Testing

- **`playerColor()` unit tests:** Deterministic (same ID → same color), varied (10 random UUIDs produce at least 4 distinct colors), handles empty string without crashing.
- **Rank-to-emoji mapping unit tests:** Ranks 1/2/3 return correct emoji, rank 4+ returns undefined/empty, null rank returns no emoji.
- **Server integration test:** Reaction broadcast includes `rank` field. This test uses `createSocketServer` without `db`, so rank should be `null`. A separate test with a db fixture verifies that rank is populated correctly when a player has completed picks and a winner is revealed.
- **Rendering:** Verify colored name span has inline style with a color from the palette. Verify podium emoji appears for rank 1-3 players.
- **Existing tests:** Must continue to pass with the new broadcast field.
