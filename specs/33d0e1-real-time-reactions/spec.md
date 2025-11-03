---
runId: 33d0e1
feature: real-time-reactions
created: 2025-11-03
status: draft
---

# Real-Time Reactions Feature

## Problem Statement

**Current State:**
The live leaderboard displays player scores in real-time during the ceremony, but users have no way to express emotional reactions to the reveals. The experience is passive—users watch scores update but cannot interact beyond viewing.

**Desired State:**
Users can click emoji reactions (🔥, 😍, 😱, 💀) at the bottom of the live leaderboard. When clicked, reactions appear on all connected clients' screens simultaneously, creating a shared, interactive experience similar to Twitch chat. Reactions display for 3-5 seconds with the user's name, then fade out automatically.

**Why This Matters:**
Real-time reactions transform the leaderboard from a passive scoreboard into an engaging social experience. Users can celebrate, commiserate, and react to dramatic reveals together, increasing emotional investment and session time during live ceremonies.

## Requirements

### Functional Requirements

**FR1: Reaction Bar**
- Display four emoji buttons (🔥 fire, 😍 love it, 😱 shocked, 💀 dead/hilarious) fixed at the bottom of the leaderboard
- Buttons must be large, touch-friendly, and accessible
- Buttons disabled when WebSocket disconnected
- Only visible on the live leaderboard page (`/game/[gameId]/leaderboard`)

**FR2: Send Reactions**
- User clicks emoji → client emits `reaction:send` event with `{ emoji, gameId }`
- Server validates emoji is in allowed list, validates user is game participant
- Server broadcasts `reaction:broadcast` event to all clients in game room with `{ emoji, userId, userName, gameId, timestamp }`

**FR3: Display Reactions**
- Show all reactions from all users as floating emoji + userName overlays
- Reactions appear with enter animation (fade + slide)
- Auto-remove after 3 seconds with exit animation (fade out)
- Multiple reactions can display simultaneously (stacked or randomized positioning)
- Current user's reactions visually distinct (optional: different styling/position)

**FR4: Real-Time Broadcast**
- Reactions must appear on all connected clients' leaderboards within <100ms
- Use existing Socket.io connection (reuse game room, no second connection)
- No HTTP requests (pure WebSocket for reactions)

### Non-Functional Requirements

**NFR1: Ephemeral State (No Database Persistence)**
- Reactions are in-memory only, never persisted to database
- Per `docs/constitutions/current/schema-rules.md` "No Reaction Table" section
- Follows philosophy: "Reactions are ephemeral, transient signals with no long-term value"

**NFR2: Architecture Compliance**
- Follow Modular Component Architecture pattern from `docs/constitutions/current/patterns.md`
- Custom Hooks → Feature Components → shadcn/ui Primitives
- Client Components only (require interactivity and WebSocket state)
- No oRPC layer (pure WebSocket, bypasses Services/Models layers)

**NFR3: Type Safety**
- All WebSocket payloads typed in `src/types/leaderboard.ts`
- Server validates emoji is in `ALLOWED_EMOJIS` constant
- TypeScript strict mode compliance

**NFR4: Performance**
- Reuse existing Socket.io connection (no additional connection overhead)
- Client-side auto-cleanup prevents memory leaks from stale reactions
- Server-side validation prevents spam (only allowed emojis broadcast)

**NFR5: Accessibility**
- Reaction buttons use shadcn/ui Button primitive (ARIA-compliant)
- Keyboard navigation support (Tab to buttons, Enter/Space to click)
- Screen reader announces emoji name + "reaction button"

## Architecture

### New Files

**1. `src/hooks/game/use-reactions.ts`**
- Custom hook managing WebSocket connection for reactions
- Pattern: Follow `src/hooks/game/use-leaderboard-socket.ts` structure
- State: `reactions: Reaction[]` with auto-cleanup timers (remove after 3 seconds)
- Functions: `sendReaction(emoji: string)` emits `reaction:send` event
- Listeners: `reaction:broadcast` event adds reaction to state with unique ID
- Returns: `{ reactions, sendReaction }`

**2. `src/components/game/leaderboard/reaction-bar.tsx`**
- Client Component (`"use client"`)
- Props: `onReactionClick: (emoji: string) => void`, `disabled?: boolean`
- Renders 4 `ReactionButton` components for 🔥, 😍, 😱, 💀
- Fixed positioning at bottom of leaderboard (within LeaderboardClient container)
- Styling: Responsive, horizontal layout, centered

**3. `src/components/game/leaderboard/reaction-button.tsx`**
- Client Component wrapping shadcn/ui Button
- Props: `emoji: string`, `onClick: () => void`, `disabled?: boolean`, `aria-label: string`
- Large emoji text (text-4xl or larger), hover scale animation
- Follows shadcn/ui Button variants for accessibility

**4. `src/components/game/leaderboard/reaction-display.tsx`**
- Client Component with AnimatePresence (Framer Motion)
- Props: `reactions: Reaction[]`, `currentUserId?: string`
- Floating overlay above leaderboard content
- Render each reaction as emoji + userName with enter/exit animations
- Position: Absolute/fixed, randomized or stacked to avoid overlap
- Animation: Fade + slide on enter, fade on exit

### Modified Files

**1. `src/components/game/leaderboard/leaderboard-client.tsx`**
- Import and call `useReactions(gameId)` hook
- Add `<ReactionDisplay reactions={reactions} currentUserId={session.user.id} />` above player list
- Add `<ReactionBar onReactionClick={sendReaction} disabled={connectionStatus !== 'connected'} />` at bottom
- Pass `connectionStatus` from `useLeaderboardSocket` to disable reactions when disconnected

**2. `src/lib/websocket/server.ts`**
- Add reaction handler inside `setupConnectionHandler()` after join handler
- Pattern:
  ```typescript
  authSocket.on(LEADERBOARD_EVENTS.REACTION_SEND, async (payload) => {
    const { emoji, gameId } = payload
    const ALLOWED_EMOJIS = ['🔥', '😍', '😱', '💀']
    if (!ALLOWED_EMOJIS.includes(emoji) || !gameId) return

    // Validate user is participant
    const isParticipant = await gameParticipantModel.exists(userId, gameId)
    if (!isParticipant) return

    // Fetch user name
    const user = await userModel.findById(userId)
    if (!user) return

    // Broadcast to game room
    server.to(gameId).emit(LEADERBOARD_EVENTS.REACTION_BROADCAST, {
      emoji,
      userId,
      userName: user.name || user.email,
      gameId,
      timestamp: Date.now()
    })
  })
  ```

**3. `src/types/leaderboard.ts`**
- Add type definitions:
  ```typescript
  export interface ReactionPayload {
    emoji: string
    userId: string
    userName: string
    gameId: string
    timestamp: number
  }

  export interface Reaction {
    id: string // Client-generated unique ID for React keys
    emoji: string
    userId: string
    userName: string
    timestamp: number
  }
  ```

### Integration Points

**WebSocket Events (Already Defined)**
- `src/lib/websocket/events.ts` already contains:
  - `REACTION_SEND: "reaction:send"` (client → server)
  - `REACTION_BROADCAST: "reaction:broadcast"` (server → all clients in room)
- No changes needed to this file

**Socket.io Connection**
- Reuse existing connection from `useLeaderboardSocket`
- Both hooks connect to same Socket.io server
- Share same game room (joined via `LEADERBOARD_EVENTS.JOIN`)

**Component Hierarchy**
```
LeaderboardClient (orchestrator)
├── useLeaderboardSocket() → players, connectionStatus
├── useReactions() → reactions, sendReaction
├── <ReactionDisplay reactions={reactions} /> (floating overlay)
├── <div> (player list - existing)
└── <ReactionBar onReactionClick={sendReaction} /> (fixed bottom)
```

## Acceptance Criteria

**AC1: User Can Send Reactions**
- [ ] Click 🔥 button → reaction appears on my screen and all other connected clients within 100ms
- [ ] Click 😍, 😱, or 💀 → same behavior as 🔥
- [ ] Buttons disabled when WebSocket disconnected (connectionStatus !== 'connected')

**AC2: Reactions Display Correctly**
- [ ] Reaction shows emoji + userName (e.g., "🔥 Alice")
- [ ] Reaction auto-removes after 3 seconds with fade-out animation
- [ ] Multiple reactions can display simultaneously without overlapping (stacked or randomized)
- [ ] My reactions visually distinct (optional: highlight or different position)

**AC3: Server Validates Reactions**
- [ ] Sending invalid emoji (not in 🔥, 😍, 😱, 💀) → server ignores, no broadcast
- [ ] Non-participant sends reaction → server rejects, no broadcast
- [ ] Valid reaction → server fetches user name and broadcasts to all clients in game room

**AC4: No Database Persistence**
- [ ] Check Prisma schema → no Reaction model exists
- [ ] Check server.ts → no Prisma queries for saving reactions
- [ ] Reactions disappear on page refresh (ephemeral state)

**AC5: Accessibility**
- [ ] Tab to reaction buttons → focus visible
- [ ] Press Enter or Space on focused button → sends reaction
- [ ] Screen reader announces "Fire reaction button" (etc.) for each emoji

**AC6: Architecture Compliance**
- [ ] All files follow Modular Component Architecture pattern (constitutions/current/patterns.md)
- [ ] No oRPC contracts created (pure WebSocket)
- [ ] Client Components have `"use client"` directive
- [ ] TypeScript strict mode passes with no errors
- [ ] Biome lint/format passes

## References

- **Architecture Pattern**: `docs/constitutions/current/patterns.md` → "Modular Component Architecture"
- **WebSocket Implementation**: `src/lib/websocket/server.ts`, `src/hooks/game/use-leaderboard-socket.ts`
- **No Database Persistence**: `docs/constitutions/current/schema-rules.md` → "No Reaction Table" section
- **Component Boundaries**: `docs/constitutions/current/patterns.md` → "Server/Client Component Boundaries"
- **shadcn/ui Components**: https://ui.shadcn.com/docs/components/button
- **Framer Motion AnimatePresence**: https://www.framer.com/motion/animate-presence/
- **Socket.io Client API**: https://socket.io/docs/v4/client-api/
