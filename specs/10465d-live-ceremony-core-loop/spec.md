---
runId: 10465d
feature: live-ceremony-core-loop
created: 2025-11-12
status: ready
---

# Live Ceremony Core Loop - Design Document

**Date:** 2025-11-12
**Phase:** Phase 1 (Core Functional Loop)
**Status:** Design Complete, Ready for Implementation

## Overview

Build the complete core loop for live awards ceremony experience. Admin marks winners in real-time, leaderboard updates automatically, game completes when all categories revealed. Includes stubbed insight rotation component (plumbing only, content in Phase 2).

## Problem Statement

**Current State:**
- Leaderboard viewer exists with WebSocket updates
- Admin can mark winners via category edit pages (slow, not ceremony-optimized)
- No automatic game completion
- No insight rotation framework

**Desired State:**
- Fast admin interface for marking winners during live ceremony
- Real-time score updates across all connected clients
- Automatic game completion when last category revealed
- Insight rotation component architecture in place (with placeholders)

**Gap:**
- Admin live winner marking interface
- Game completion orchestration
- WebSocket event for game status changes
- Insight rotation component framework

## Architecture

### Feature 1: Admin Live Winner Marking

**Route:** `/admin/games/[gameId]/live`

**Layout:**
- Page header: Game name, event name, breadcrumb
- Scrollable category list (ordered by `Category.order`)
- Each category card:
  - Category name + point value
  - Visual indicator if already revealed ("✓ Revealed: [Nomination]")
  - List of nominations with pick counts ("Oppenheimer (15 picks)")
  - Dropdown to select winner
  - Clear button to unmark

**Behavior:**
When admin selects winner:
1. Set `Category.winnerNominationId` and `Category.isRevealed = true` (atomic)
2. Calculate updated scores via `leaderboardService.calculateLeaderboard()`
3. Broadcast leaderboard update via WebSocket
4. Check: Are ALL categories revealed? If yes → `gameService.completeGame()`
5. Refresh page to show updated state

**Component Structure:**
- `src/app/(admin)/admin/games/[gameId]/live/page.tsx` - Server Component
- `src/components/admin/games/live-category-card.tsx` - Client Component (uses `useMutation`)

**Data Fetching (Server Component):**
- Game + Event + Categories (with nominations)
- Pick counts per nomination per category (aggregated, no N+1)

**Layer Boundaries:**
```
Page (Server Component)
  ↓
oRPC Procedure (validates ADMIN role)
  ↓
Service (orchestrates multi-step operation)
  ↓
Models (data access)
  ↓
Prisma
```

### Feature 2: Automatic Game Completion

**Trigger:** After any winner is marked, check if all categories revealed.

**Service Method:** `gameService.completeGame(gameId)`

**Logic:**
1. Verify game is in LIVE status
2. Verify ALL categories have `isRevealed = true`
3. Update game status: LIVE → COMPLETED
4. Set `completedAt` timestamp
5. Broadcast `game:completed` event via WebSocket

**WebSocket Events:**
- Existing: `leaderboard:update` (scores changed)
- New: `game:completed` (game status changed)

**Client Behavior:**
- LeaderboardClient listens for `game:completed` event
- When received, updates local `gameStatus` state
- InsightRotation switches from LIVE to COMPLETED card set
- Smooth transition, no page refresh

**Edge Cases:**
- Admin unmarks winner → Game stays in LIVE
- Admin changes winner → Still checks if all revealed
- Multiple admins → Race condition acceptable (idempotent final state)

### Feature 3: Insight Rotation (Stubbed)

**Component Hierarchy:**
```
LeaderboardClient (existing)
├── GameHeader
├── ReactionDisplay
├── LeaderboardList (scoreboard - always visible)
├── InsightRotation (NEW)
│   ├── InsightCard (fade transition container)
│   └── Renders one of:
│       ├── LiveMomentumInsight (placeholder)
│       ├── LivePickDistributionInsight (placeholder)
│       ├── CompletedAccuracyInsight (placeholder)
│       ├── CompletedPopularityInsight (placeholder)
│       └── CompletedSurprisesInsight (placeholder)
└── ReactionBar
```

**InsightRotation Component:**
- Client Component (needs `setInterval` timer)
- Props: `gameStatus: GameStatus`, `gameId: string`
- State: `currentIndex: number`
- Logic: Rotate every 15 seconds
- Behavior:
  - LIVE: Cycles [LiveMomentum, LivePickDistribution]
  - COMPLETED: Cycles [CompletedAccuracy, CompletedPopularity, CompletedSurprises]

**Individual Insight Components:**
- Each is Client Component
- Props: `gameId: string`
- Phase 1: Returns hardcoded placeholder JSX
- Phase 2: Will fetch real data via oRPC

**Styling:**
- Consistent card dimensions (prevents layout shift)
- Simple fade in/out transition
- Responsive: Below scoreboard on mobile, beside on desktop

### Feature 4: WebSocket Coordination

**New Event Definition:**

`src/lib/websocket/events.ts`:
```typescript
export const GAME_COMPLETED = 'game:completed'

export type GameCompletedPayload = {
  gameId: string;
  completedAt: string; // ISO timestamp
}
```

**Server-side Emission:**

`src/lib/websocket/server.ts`:
```typescript
export function emitGameCompleted(gameId: string, payload: GameCompletedPayload) {
  io.to(`game:${gameId}`).emit(GAME_COMPLETED, payload)
}
```

**Client-side Hook Update:**

`src/hooks/game/use-leaderboard-socket.ts`:
```typescript
// Add gameStatus state
const [gameStatus, setGameStatus] = useState<GameStatus>(initialStatus)

// Listen for game completion
useEffect(() => {
  socket.on(GAME_COMPLETED, (payload) => {
    setGameStatus('COMPLETED')
  })

  return () => socket.off(GAME_COMPLETED)
}, [socket])

// Return gameStatus
return { players, connectionStatus, gameStatus }
```

**LeaderboardClient Integration:**
```typescript
const { players, connectionStatus, gameStatus } = useLeaderboardSocket(...)

<InsightRotation gameStatus={gameStatus} gameId={gameId} />
```

## Data Layer

### New Model Methods

**`src/lib/models/pick.ts`:**
```typescript
// Aggregate pick counts for all categories in a game
getPickCountsForGame(gameId: string): Promise<{
  categoryId: string;
  nominationId: string;
  count: number;
}[]>

// Check if all categories revealed
areAllCategoriesRevealed(gameId: string): Promise<boolean>
```

**`src/lib/models/category.ts`:**
```typescript
// Mark winner and reveal atomically
markWinner(categoryId: string, nominationId: string): Promise<void>

// Clear winner and unreveal
clearWinner(categoryId: string): Promise<void>
```

**`src/lib/models/game.ts`:**
```typescript
// Transition game to completed
completeGame(gameId: string): Promise<void>
```

### Service Methods

**`src/lib/services/category-service.ts`:**
```typescript
async markWinnerAndUpdate(categoryId: string, nominationId: string, gameId: string) {
  // 1. Mark winner
  await categoryModel.markWinner(categoryId, nominationId)

  // 2. Broadcast leaderboard update
  await leaderboardService.broadcastLeaderboardUpdate(gameId)

  // 3. Check if game should complete
  const allRevealed = await pickModel.areAllCategoriesRevealed(gameId)
  if (allRevealed) {
    await gameService.completeGame(gameId)
  }
}
```

**`src/lib/services/game-service.ts`:**
```typescript
async completeGame(gameId: string) {
  // 1. Verify game is LIVE
  const game = await gameModel.findById(gameId)
  if (game.status !== 'LIVE') throw new Error('Game must be LIVE')

  // 2. Update status
  await gameModel.completeGame(gameId)

  // 3. Broadcast completion event
  emitGameCompleted(gameId, { gameId, completedAt: new Date().toISOString() })
}
```

### oRPC Contracts

**`src/lib/api/contracts/admin.ts`:**
```typescript
export const markWinnerContract = oc
  .input(z.object({
    categoryId: z.string(),
    nominationId: z.string(),
    gameId: z.string(),
  }))
  .output(z.object({ success: z.boolean() }))

export const clearWinnerContract = oc
  .input(z.object({
    categoryId: z.string(),
    gameId: z.string(),
  }))
  .output(z.object({ success: z.boolean() }))
```

**Router Implementation:**

`src/lib/api/routers/admin.ts`:
- Implement contracts using `implement(adminContract)`
- Chain `.use(authenticatedProcedure)` with ADMIN role check
- Handler calls `categoryService.markWinnerAndUpdate()`

## Database Schema

**No schema changes required.**

Existing fields:
- `Category.winnerNominationId` (nullable string)
- `Category.isRevealed` (boolean)
- `Category.order` (int)
- `Game.status` (enum: SETUP, OPEN, LIVE, COMPLETED)
- `Game.completedAt` (nullable DateTime)

## Files Created/Modified

**New Files:**
- `src/app/(admin)/admin/games/[gameId]/live/page.tsx`
- `src/components/admin/games/live-category-card.tsx`
- `src/components/game/leaderboard/insight-rotation.tsx`
- `src/components/game/leaderboard/insights/live-momentum-insight.tsx`
- `src/components/game/leaderboard/insights/live-pick-distribution-insight.tsx`
- `src/components/game/leaderboard/insights/completed-accuracy-insight.tsx`
- `src/components/game/leaderboard/insights/completed-popularity-insight.tsx`
- `src/components/game/leaderboard/insights/completed-surprises-insight.tsx`

**Modified Files:**
- `src/lib/models/pick.ts` - Add `getPickCountsForGame()`, `areAllCategoriesRevealed()`
- `src/lib/models/category.ts` - Add `markWinner()`, `clearWinner()`
- `src/lib/models/game.ts` - Add `completeGame()`
- `src/lib/services/category-service.ts` - Add `markWinnerAndUpdate()`
- `src/lib/services/game-service.ts` - Add `completeGame()`
- `src/lib/api/contracts/admin.ts` - Add winner marking contracts
- `src/lib/api/routers/admin.ts` - Implement winner marking procedures
- `src/lib/websocket/events.ts` - Add `GAME_COMPLETED` event
- `src/lib/websocket/server.ts` - Add `emitGameCompleted()`
- `src/hooks/game/use-leaderboard-socket.ts` - Add `gameStatus` state and listener
- `src/components/game/leaderboard/leaderboard-client.tsx` - Integrate InsightRotation
- `src/lib/routes.ts` - Add `admin.games.live(gameId)`
- `src/app/(admin)/admin/games/[gameId]/page.tsx` - Add "Live Winner Marking" link

## Testing Strategy

**Model Layer:**
- Test `getPickCountsForGame()` aggregation accuracy
- Test `areAllCategoriesRevealed()` with various reveal states
- Test `markWinner()` sets both fields atomically
- Test `completeGame()` status transition

**Service Layer:**
- Test `markWinnerAndUpdate()` orchestration flow
- Test auto-completion triggers when last category revealed
- Test completion doesn't trigger if not all revealed
- Mock WebSocket emissions

**Component Layer:**
- Test LiveCategoryCard dropdown interaction
- Test InsightRotation timer and card switching
- Test gameStatus prop changes insight set

**Integration:**
- Test complete flow: Mark winner → Score updates → Game completes
- Test WebSocket event propagation

## Success Criteria

**Phase 1 Complete When:**
- ✅ Admin can mark winners from `/admin/games/[gameId]/live`
- ✅ Leaderboard scores update in real-time across all clients
- ✅ Game auto-completes when last category revealed
- ✅ InsightRotation component renders with placeholders
- ✅ LIVE vs COMPLETED show different placeholder cards
- ✅ Cards rotate every 15 seconds
- ✅ All tests pass
- ✅ Constitution compliance (layered architecture, oRPC contracts, centralized routes)

**Phase 2 Scope (Visual Polish):**
- Winner reveal animations
- Confetti/celebration effects
- Real insight content (replace placeholders)
- Smooth card transitions
- Mobile-first design pass

## Open Questions

None - design validated through brainstorming.

## References

- CLAUDE.md - Project patterns and architecture
- docs/constitutions/current/ - Versioned constitution
- specs/36660a-admin-live-winner-marking/spec.md - Original admin interface spec
- src/lib/services/leaderboard-service.ts - Existing leaderboard logic
- src/components/game/leaderboard/leaderboard-client.tsx - Existing leaderboard UI
