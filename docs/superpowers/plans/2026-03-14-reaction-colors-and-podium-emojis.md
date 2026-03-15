# Reaction Name Colors & Podium Emojis — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Color-code player names in floating reactions using a hash-based palette, and prepend podium emojis (🪿/🥈/🥉) for top-3 ranked players.

**Architecture:** Client-side `playerColor()` utility maps `playerId` → hex color. Server includes `rank` in reaction broadcasts by calling existing `getLeaderboard(db)`. Shared `RANK_EMOJIS` constant keeps podium emoji mapping DRY between podium component and reaction rendering.

**Tech Stack:** TypeScript, Zod (schemas), Vitest (testing), React (components), Socket.io (WebSocket)

---

## Chunk 1: Shared Constants & Schema

### Task 1: Add RANK_EMOJIS constant to shared package

**Files:**
- Modify: `packages/shared/src/constants.ts`
- Test: `packages/shared/src/__tests__/rank-emojis.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/shared/src/__tests__/rank-emojis.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { RANK_EMOJIS, getRankEmoji } from "../constants";

describe("RANK_EMOJIS", () => {
  it("maps rank 1 to goose", () => {
    expect(RANK_EMOJIS[1]).toBe("🪿");
  });

  it("maps rank 2 to silver medal", () => {
    expect(RANK_EMOJIS[2]).toBe("🥈");
  });

  it("maps rank 3 to bronze medal", () => {
    expect(RANK_EMOJIS[3]).toBe("🥉");
  });
});

describe("getRankEmoji", () => {
  it("returns the emoji for ranks 1-3", () => {
    expect(getRankEmoji(1)).toBe("🪿");
    expect(getRankEmoji(2)).toBe("🥈");
    expect(getRankEmoji(3)).toBe("🥉");
  });

  it("returns empty string for rank 4+", () => {
    expect(getRankEmoji(4)).toBe("");
    expect(getRankEmoji(99)).toBe("");
  });

  it("returns empty string for null", () => {
    expect(getRankEmoji(null)).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/shared && npx vitest run src/__tests__/rank-emojis.test.ts`
Expected: FAIL — `RANK_EMOJIS` and `getRankEmoji` not found

- [ ] **Step 3: Implement RANK_EMOJIS and getRankEmoji**

Add to `packages/shared/src/constants.ts`:

```typescript
/** Emoji shown next to player names for top-3 ranks. Matches podium display. */
export const RANK_EMOJIS: Record<number, string> = {
  1: "🪿",
  2: "🥈",
  3: "🥉",
};

/** Get the podium emoji for a rank, or empty string if not top 3. */
export function getRankEmoji(rank: number | null): string {
  if (rank === null) return "";
  return RANK_EMOJIS[rank] ?? "";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/shared && npx vitest run src/__tests__/rank-emojis.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/constants.ts packages/shared/src/__tests__/rank-emojis.test.ts
git commit -m "feat: add RANK_EMOJIS constant and getRankEmoji helper"
```

---

### Task 2: Add rank field to ReactionBroadcastSchema

**Files:**
- Modify: `packages/shared/src/schemas.ts`
- Test: `packages/shared/src/__tests__/schemas.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `packages/shared/src/__tests__/schemas.test.ts` (inside an existing or new describe block):

```typescript
import { ReactionBroadcastSchema } from "../schemas";

describe("ReactionBroadcastSchema", () => {
  it("accepts a reaction with a numeric rank", () => {
    const result = ReactionBroadcastSchema.safeParse({
      playerId: "p1",
      name: "Drew",
      emoji: "🔥",
      id: "abc-123",
      timestamp: Date.now(),
      rank: 1,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a reaction with null rank", () => {
    const result = ReactionBroadcastSchema.safeParse({
      playerId: "p1",
      name: "Drew",
      emoji: "🔥",
      id: "abc-123",
      timestamp: Date.now(),
      rank: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a reaction with non-integer rank", () => {
    const result = ReactionBroadcastSchema.safeParse({
      playerId: "p1",
      name: "Drew",
      emoji: "🔥",
      id: "abc-123",
      timestamp: Date.now(),
      rank: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a reaction with rank 0", () => {
    const result = ReactionBroadcastSchema.safeParse({
      playerId: "p1",
      name: "Drew",
      emoji: "🔥",
      id: "abc-123",
      timestamp: Date.now(),
      rank: 0,
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/shared && npx vitest run src/__tests__/schemas.test.ts`
Expected: FAIL — `rank` field not recognized (or tests fail on validation)

- [ ] **Step 3: Add rank to ReactionBroadcastSchema**

In `packages/shared/src/schemas.ts`, modify `ReactionBroadcastSchema`:

```typescript
export const ReactionBroadcastSchema = z.object({
  playerId: z.string(),
  name: z.string(),
  emoji: z.string(),
  id: z.string(),
  timestamp: z.number(),
  rank: z.number().int().positive().nullable(),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/shared && npx vitest run src/__tests__/schemas.test.ts`
Expected: PASS

- [ ] **Step 5: Fix pre-existing ALLOWED_REACTIONS test**

The existing test in `schemas.test.ts` (line 201-212) asserts `ALLOWED_REACTIONS` has 5 emojis, but there are 6 (🍿 was added later). Fix the test:

In `packages/shared/src/__tests__/schemas.test.ts`, update the `ALLOWED_REACTIONS` describe block:

```typescript
describe("ALLOWED_REACTIONS", () => {
  it("contains exactly six emojis", () => {
    expect(ALLOWED_REACTIONS).toHaveLength(6);
  });
  it("includes expected emojis", () => {
    expect(ALLOWED_REACTIONS).toContain("🔥");
    expect(ALLOWED_REACTIONS).toContain("💕");
    expect(ALLOWED_REACTIONS).toContain("💩");
    expect(ALLOWED_REACTIONS).toContain("💀");
    expect(ALLOWED_REACTIONS).toContain("👏");
    expect(ALLOWED_REACTIONS).toContain("🍿");
  });
});
```

- [ ] **Step 6: Run all shared tests to check for regressions**

Run: `cd packages/shared && npx vitest run`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/schemas.ts packages/shared/src/__tests__/schemas.test.ts
git commit -m "feat: add rank field to ReactionBroadcastSchema"
```

---

### Task 3: Update podium.tsx to use shared RANK_EMOJIS

**Files:**
- Modify: `packages/web/src/components/podium.tsx`

This is a refactor — no new behavior, just using the shared constant. The `PODIUM_CONFIG` array is ordered `[silver, gold, bronze]` to match visual layout `[2nd, 1st, 3rd]`. We replace the hardcoded `medal` strings with `RANK_EMOJIS` lookups based on actual player rank.

- [ ] **Step 1: Replace hardcoded medal emojis with RANK_EMOJIS**

In `packages/web/src/components/podium.tsx`:

1. Add import: `import { RANK_EMOJIS } from "@bignight/shared";`
2. Remove the `medal` field from each `PODIUM_CONFIG` entry.
3. In the render, replace `{PODIUM_CONFIG[i]?.medal}` with `{RANK_EMOJIS[player.rank] ?? ""}`.

The `PODIUM_CONFIG` becomes:

```typescript
const PODIUM_CONFIG = [
  {
    barHeight: "h-20 md:h-28",
    barStyle: "from-gray-400/20 to-gray-400/5",
  },
  {
    barHeight: "h-28 md:h-40",
    barStyle:
      "from-[#e2b04a]/30 to-[#e2b04a]/10 shadow-lg shadow-[#e2b04a]/10",
  },
  {
    barHeight: "h-16 md:h-24",
    barStyle: "from-amber-700/20 to-amber-700/5",
  },
] as const;
```

And the medal span becomes:

```tsx
{RANK_EMOJIS[player.rank] ?? ""}
```

- [ ] **Step 2: Run full web test suite to check for regressions**

Run: `cd packages/web && npx vitest run`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/components/podium.tsx
git commit -m "refactor: use shared RANK_EMOJIS in podium component"
```

---

## Chunk 2: Server — Include Rank in Reaction Broadcast

### Task 4: Server broadcasts rank with reactions

**Files:**
- Modify: `packages/server/src/websocket/server.ts`
- Test: `packages/server/src/websocket/__tests__/server.test.ts`

The existing WebSocket test uses `createSocketServer(httpServer)` which does NOT pass `db`. In that path, rank will be `null`. We need a separate test that uses `configureSocketServer(io, db)` with a test db to verify rank is populated.

**Pre-existing bug:** The test "broadcasts a valid reaction emoji to all clients in the game room" (line 88-104) is already broken — it times out because it sends a raw emoji string (`ALLOWED_REACTIONS[0]`) instead of `{ emoji: string }`, so the handler's shape guard rejects it and never broadcasts. This test must be fixed as part of this task.

- [ ] **Step 1: Fix the existing broken broadcast test**

In `packages/server/src/websocket/__tests__/server.test.ts`, replace the existing "broadcasts a valid reaction emoji" test (lines 88-104):

```typescript
  it("broadcasts a valid reaction emoji to all clients in the game room", async () => {
    const token2 = await signToken({ playerId: "player_2", isAdmin: false });

    const sender = connectClient(port, validToken);
    const receiver = connectClient(port, token2);

    await Promise.all([waitForConnect(sender), waitForConnect(receiver)]);

    const broadcastPromise = waitForEvent(receiver, WEBSOCKET_EVENTS.REACTION_BROADCAST);
    sender.emit(WEBSOCKET_EVENTS.REACTION_SEND, { emoji: ALLOWED_REACTIONS[0] });

    const received = (await broadcastPromise) as Record<string, unknown>;
    expect(received).toMatchObject({
      playerId: "player_1",
      emoji: ALLOWED_REACTIONS[0],
    });
    expect(received.id).toEqual(expect.any(String));
    expect(received.timestamp).toEqual(expect.any(Number));

    sender.disconnect();
    receiver.disconnect();
  });
```

- [ ] **Step 2: Write test for rank=null when db is unavailable**

Add to `packages/server/src/websocket/__tests__/server.test.ts`, a new describe block after the existing one:

```typescript
describe("Reaction broadcast rank field", () => {
  let port: number;
  let stopServer: () => Promise<void>;
  let validToken: string;

  beforeAll(
    () =>
      new Promise<void>((resolve) => {
        const httpServer = createServer();
        createSocketServer(httpServer); // no db → rank should be null

        httpServer.listen(0, async () => {
          const addr = httpServer.address();
          port = typeof addr === "object" && addr ? addr.port : 0;
          validToken = await signToken({ playerId: "player_1", isAdmin: false });
          stopServer = () =>
            new Promise((res, rej) => httpServer.close((err) => (err ? rej(err) : res())));
          resolve();
        });
      }),
  );

  afterAll(async () => {
    await stopServer();
  });

  it("includes rank: null when no db is available", async () => {
    const sender = connectClient(port, validToken);
    await waitForConnect(sender);

    const broadcastPromise = waitForEvent(sender, WEBSOCKET_EVENTS.REACTION_BROADCAST);
    sender.emit(WEBSOCKET_EVENTS.REACTION_SEND, { emoji: ALLOWED_REACTIONS[0] });

    const received = (await broadcastPromise) as Record<string, unknown>;
    expect(received).toMatchObject({
      playerId: "player_1",
      emoji: ALLOWED_REACTIONS[0],
      rank: null,
    });
    expect(received.id).toEqual(expect.any(String));
    expect(received.timestamp).toEqual(expect.any(Number));

    sender.disconnect();
  });
});
```

Add necessary imports at the top if not already present: `beforeAll, afterAll` from vitest.

- [ ] **Step 3: Run test to verify it fails**

Run: `cd packages/server && npx vitest run src/websocket/__tests__/server.test.ts`
Expected: The fixed broadcast test passes, but the new rank test FAILS — broadcast does not include `rank`

- [ ] **Step 4: Add rank to the broadcast in server.ts**

Modify `packages/server/src/websocket/server.ts`:

1. Add import: `import { getLeaderboard } from "../services/leaderboard";`
2. In the `REACTION_SEND` handler, look up the player's rank:

```typescript
socket.on(WEBSOCKET_EVENTS.REACTION_SEND, async (data: unknown) => {
  if (!data || typeof data !== "object" || !("emoji" in data)) return;
  const { emoji } = data as { emoji: string };
  if (!(ALLOWED_REACTIONS as readonly string[]).includes(emoji)) return;

  // Look up current rank if db is available
  let rank: number | null = null;
  if (db) {
    const leaderboard = await getLeaderboard(db);
    const entry = leaderboard.find((p) => p.playerId === socket.data.playerId);
    rank = entry?.rank ?? null;
  }

  io.to(GAME_ROOM).emit(WEBSOCKET_EVENTS.REACTION_BROADCAST, {
    playerId: socket.data.playerId,
    name: socket.data.playerName ?? "Player",
    emoji,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    rank,
  });
});
```

Note: The handler callback becomes `async` to await `getLeaderboard`.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd packages/server && npx vitest run src/websocket/__tests__/server.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/websocket/server.ts packages/server/src/websocket/__tests__/server.test.ts
git commit -m "feat: include player rank in reaction broadcast"
```

---

### Task 5: Integration test — rank is populated with a real db

**Files:**
- Test: `packages/server/src/websocket/__tests__/server.test.ts`

This test proves that when the server has a db with leaderboard data, the rank comes through in the broadcast.

- [ ] **Step 1: Write integration test with db fixture**

Add a new describe block to `packages/server/src/websocket/__tests__/server.test.ts`:

```typescript
import { eq } from "drizzle-orm";
import { Server } from "socket.io";
import { createTestDb } from "../../db/connection";
import { categories, nominations, picks, players } from "../../db/schema";
import { createId } from "@paralleldrive/cuid2";
import { configureSocketServer } from "../server";
import type { Db } from "../../db/connection";

describe("Reaction broadcast with db", () => {
  let port: number;
  let stopServer: () => Promise<void>;
  let db: Db;
  let playerToken: string;
  let testPlayerId: string;

  beforeAll(async () => {
    db = createTestDb();

    // Set up: 1 category, 1 nomination, 1 player with a correct pick
    // Insert order respects FK constraints: category (no winner yet) → nomination → update category winner → player → pick
    const catId = createId();
    const nomId = createId();
    testPlayerId = createId();

    await db.insert(categories).values({
      id: catId, name: "Best Picture", order: 0, points: 1,
      winnerId: null, isRevealed: false, createdAt: Date.now(),
    });
    await db.insert(nominations).values({
      id: nomId, categoryId: catId, title: "Film A",
      subtitle: "", imageUrl: null, createdAt: Date.now(),
    });
    await db.update(categories)
      .set({ winnerId: nomId, isRevealed: true })
      .where(eq(categories.id, catId));
    await db.insert(players).values({
      id: testPlayerId, name: "Drew", pin: "hashed", createdAt: Date.now(),
    });
    await db.insert(picks).values({
      id: createId(), playerId: testPlayerId, categoryId: catId,
      nominationId: nomId, createdAt: Date.now(), updatedAt: Date.now(),
    });

    playerToken = await signToken({ playerId: testPlayerId, isAdmin: false });

    const httpServer = createServer();
    const io = new Server(httpServer, { cors: { origin: "*" } });
    configureSocketServer(io, db);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        port = typeof addr === "object" && addr ? addr.port : 0;
        stopServer = () =>
          new Promise((res, rej) => httpServer.close((err) => (err ? rej(err) : res())));
        resolve();
      });
    });
  });

  afterAll(async () => {
    await stopServer();
  });

  it("includes the player's current rank when db is available", async () => {
    const sender = connectClient(port, playerToken);
    await waitForConnect(sender);

    const broadcastPromise = waitForEvent(sender, WEBSOCKET_EVENTS.REACTION_BROADCAST);
    sender.emit(WEBSOCKET_EVENTS.REACTION_SEND, { emoji: ALLOWED_REACTIONS[0] });

    const received = (await broadcastPromise) as Record<string, unknown>;
    expect(received).toMatchObject({
      playerId: testPlayerId,
      name: "Drew",
      emoji: ALLOWED_REACTIONS[0],
      rank: 1,
    });

    sender.disconnect();
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `cd packages/server && npx vitest run src/websocket/__tests__/server.test.ts`
Expected: PASS (server implementation from Task 4 should handle this)

- [ ] **Step 3: Run full server test suite**

Run: `cd packages/server && npx vitest run`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add packages/server/src/websocket/__tests__/server.test.ts
git commit -m "test: integration test for rank in reaction broadcast with real db"
```

---

## Chunk 3: Client — playerColor Utility & Reaction Rendering

### Task 6: Create playerColor utility

**Files:**
- Create: `packages/web/src/lib/player-color.ts`
- Test: `packages/web/src/lib/__tests__/player-color.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/web/src/lib/__tests__/player-color.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { playerColor, PLAYER_COLORS } from "../player-color";

describe("playerColor", () => {
  it("returns a color from the palette", () => {
    const color = playerColor("some-player-id");
    expect(PLAYER_COLORS).toContain(color);
  });

  it("is deterministic — same id returns same color", () => {
    const color1 = playerColor("player-abc");
    const color2 = playerColor("player-abc");
    expect(color1).toBe(color2);
  });

  it("produces varied colors for different ids", () => {
    const ids = [
      "id-alpha", "id-bravo", "id-charlie", "id-delta", "id-echo",
      "id-foxtrot", "id-golf", "id-hotel", "id-india", "id-juliet",
    ];
    const colors = new Set(ids.map(playerColor));
    expect(colors.size).toBeGreaterThanOrEqual(4);
  });

  it("handles empty string without crashing", () => {
    expect(() => playerColor("")).not.toThrow();
    expect(PLAYER_COLORS).toContain(playerColor(""));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/web && npx vitest run src/lib/__tests__/player-color.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement playerColor**

Create `packages/web/src/lib/player-color.ts`:

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/web && npx vitest run src/lib/__tests__/player-color.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/web/src/lib/player-color.ts packages/web/src/lib/__tests__/player-color.test.ts
git commit -m "feat: add playerColor utility for hash-based name colors"
```

---

### Task 7: Update FloatingReaction interface and use-reactions hook

**Files:**
- Modify: `packages/web/src/hooks/use-reactions.ts`

Add `playerId` and `rank` to the `FloatingReaction` interface and export it. The broadcast already sends these fields — we just need to include them in the interface so they flow through to the component.

- [ ] **Step 1: Update FloatingReaction interface**

In `packages/web/src/hooks/use-reactions.ts`:

1. Export the interface
2. Add `playerId` and `rank` fields:

```typescript
export interface FloatingReaction {
  id: string;
  emoji: string;
  name: string;
  playerId: string;
  rank: number | null;
}
```

- [ ] **Step 2: Run existing reaction tests**

Run: `cd packages/web && npx vitest run`
Expected: PASS — adding fields to the interface doesn't break anything

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/hooks/use-reactions.ts
git commit -m "feat: add playerId and rank to FloatingReaction interface"
```

---

### Task 8: Update ReactionBar to show colored names and podium emojis

**Files:**
- Modify: `packages/web/src/components/reaction-bar.tsx`

- [ ] **Step 1: Update reaction-bar.tsx**

Apply these targeted edits (do NOT rewrite the whole file):

**Edit 1 — Update imports** (lines 1-2):

Replace:
```tsx
import { AnimatePresence, motion } from "framer-motion";
import { ALLOWED_REACTIONS } from "@bignight/shared";
```

With:
```tsx
import { AnimatePresence, motion } from "framer-motion";
import { ALLOWED_REACTIONS, getRankEmoji } from "@bignight/shared";
import { playerColor } from "../lib/player-color";
import type { FloatingReaction } from "../hooks/use-reactions";
```

**Edit 2 — Remove local FloatingReaction interface** (lines 4-8):

Delete:
```tsx
interface FloatingReaction {
  id: string;
  emoji: string;
  name: string;
}
```

**Edit 3 — Update name span** (line 31):

Replace:
```tsx
              <span className="text-xs text-white/50 ml-1">{r.name}</span>
```

With:
```tsx
              <span className="text-xs ml-1" style={{ color: playerColor(r.playerId) }}>
                {getRankEmoji(r.rank)} {r.name}
              </span>
```

- [ ] **Step 2: Run web tests to check for regressions**

Run: `cd packages/web && npx vitest run`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add packages/web/src/components/reaction-bar.tsx
git commit -m "feat: color-coded names and podium emojis in floating reactions"
```

---

## Chunk 4: Smoke Test & Final Verification

### Task 9: Full test suite and build verification

- [ ] **Step 1: Run all tests across all packages**

Run from repo root: `npx vitest run` (or whatever the monorepo test command is — check `package.json` scripts)

Alternatively run each package:
```bash
cd packages/shared && npx vitest run
cd ../server && npx vitest run
cd ../web && npx vitest run
```
Expected: All tests PASS

- [ ] **Step 2: Build check**

Run: `cd packages/web && npx tsc --noEmit` (or the project's build/typecheck command)
Expected: No type errors

- [ ] **Step 3: Final commit if any cleanup was needed**

Only if changes were required to fix issues found in steps 1-2.

```bash
git add -A && git commit -m "fix: address issues from final verification"
```
