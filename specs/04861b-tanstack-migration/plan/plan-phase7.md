# Phase 7: Real-Time Layer

**Strategy**: Sequential (single task)
**Dependencies**: Phase 5 (oRPC API Layer)
**Estimated Time**: 6 hours

---

## Task 11: WebSocket Server Integration

**Complexity**: L (5-6h)

**Files**:
- `/Users/drewritter/projects/bignight.party-vite/server.ts`
- `/Users/drewritter/projects/bignight.party-vite/dev-socket.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/websocket/server.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/websocket/events.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/hooks/useSocket.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/types/leaderboard.ts`
- `/Users/drewritter/projects/bignight.party-vite/package.json`

**Dependencies**: Task 5 (oRPC API Layer), Task 3 (Models Layer)

**Dependency Reason**: WebSocket server validates users via model functions (`userModel.exists()`, `gameParticipantModel.exists()`). Services emit leaderboard updates via WebSocket helper functions.

**Description**:
Set up Socket.IO server with Bun runtime for real-time leaderboard updates. Implements two-server architecture: integrated production server using `@socket.io/bun-engine`, separate development server for simplicity. Ports connection validation, room management, and event broadcasting logic.

**Implementation Steps**:

1. Install Socket.IO dependencies:
   ```bash
   cd /Users/drewritter/projects/bignight.party-vite
   bun add socket.io socket.io-client @socket.io/bun-engine
   ```

2. Create production server (`server.ts`):
   - Import `@socket.io/bun-engine` (NOT standard Socket.IO)
   - Initialize Socket.IO with Bun engine
   - Import TanStack Start app handler from `./dist/server/server.js`
   - Configure `Bun.serve()` with routing logic:
     - `/socket.io/` → Socket.IO engine handler
     - `/*` → TanStack Start app handler
   - Export WebSocket handler from engine
   - Set `idleTimeout: 30` (must exceed Socket.IO pingInterval)

3. Create development Socket.IO server (`dev-socket.ts`):
   - Standalone Bun server on port 3001
   - Import and call `setupSocketHandlers()` from websocket/server
   - Enable CORS for localhost:3000
   - Run with: `bun run dev-socket.ts`

4. Port WebSocket server logic (`src/lib/websocket/server.ts`):
   - Copy from `/Users/drewritter/projects/bignight.party/src/lib/websocket/server.ts`
   - Update imports to use Bun-compatible Socket.IO
   - Keep singleton pattern: `getSocketServer()`
   - Connection handler:
     - Validate `socket.handshake.auth.userId`
     - Check user exists in database via `userModel.exists()`
     - Disconnect if invalid
   - Join handler:
     - Validate game participant via `gameParticipantModel.exists()`
     - Join Socket.IO room using `gameId`
   - Disconnect handler (logging only)
   - Export helper functions:
     - `emitLeaderboardUpdate()` - Broadcast to game room
     - `emitError()` - Send error to specific socket

5. Port WebSocket events constants (`src/lib/websocket/events.ts`):
   - Copy from source with no changes
   - Constants: `LEADERBOARD_EVENTS`
   - Event names: `UPDATE`, `ERROR`, `JOIN`, `REACTION_SEND`, `REACTION_BROADCAST`

6. Port leaderboard types (`src/types/leaderboard.ts`):
   - Copy from source with no changes
   - Types: `LeaderboardPlayer`, `LeaderboardData`, `LeaderboardUpdatePayload`, `JoinRoomPayload`, `LeaderboardErrorPayload`

7. Create client-side Socket.IO hook (`src/hooks/useSocket.ts`):
   - Initialize socket.io-client with auth
   - Connect to development server (port 3001) or production (port 3000)
   - Pass `userId` in `socket.handshake.auth`
   - Return socket instance
   - Handle connection/disconnection events

8. Update package.json scripts:
   ```json
   {
     "scripts": {
       "dev": "vinxi dev",
       "dev:socket": "bun run dev-socket.ts",
       "build": "vinxi build",
       "start": "bun run server.ts"
     }
   }
   ```

9. Test WebSocket integration:
   - Start dev server: `bun run dev`
   - Start Socket.IO server: `bun run dev:socket`
   - Connect from browser
   - Verify user validation works
   - Test joining game room
   - Test leaderboard update broadcast

**Acceptance Criteria**:
- [ ] `socket.io`, `socket.io-client`, and `@socket.io/bun-engine` packages installed
- [ ] Production `server.ts` integrates Socket.IO with TanStack Start handler
- [ ] Development `dev-socket.ts` runs standalone Socket.IO server on port 3001
- [ ] WebSocket server validates userId from `socket.handshake.auth`
- [ ] Connection rejected if user doesn't exist in database
- [ ] Join handler validates game participant before joining room
- [ ] `emitLeaderboardUpdate()` broadcasts to all clients in game room
- [ ] Client hook connects with userId authentication
- [ ] TypeScript compilation passes
- [ ] No console errors on connection/join

**Mandatory Patterns**:

> **Bun Socket.IO Engine Pattern** (CRITICAL):
> ```typescript
> // ❌ WRONG - Standard Socket.IO doesn't work with Bun
> import { Server } from "socket.io";
> const io = new Server(httpServer);
>
> // ✅ CORRECT - Use Bun-specific engine
> import { Server as SocketIOEngine } from "@socket.io/bun-engine";
> import { Server as SocketIO } from "socket.io";
>
> const io = new SocketIO();
> const engine = new SocketIOEngine({ path: "/socket.io/" });
> io.bind(engine);
>
> const { websocket } = engine.handler();
>
> Bun.serve({
>   fetch(req, server) {
>     if (url.pathname === "/socket.io/") {
>       return engine.handleRequest(req, server);
>     }
>     return appHandler.fetch(req);
>   },
>   websocket
> });
> ```

**Connection Validation Pattern**:
```typescript
// Always validate user exists in database
const userId = socket.handshake.auth.userId;

if (!userId) {
  emitError(socket.id, {
    code: "AUTH_REQUIRED",
    message: "Authentication required"
  });
  socket.disconnect(true);
  return;
}

const userExists = await userModel.exists(userId);

if (!userExists) {
  emitError(socket.id, {
    code: "USER_NOT_FOUND",
    message: "User not found"
  });
  socket.disconnect(true);
  return;
}
```

**Room Management Pattern**:
```typescript
// Always verify business logic (game participant) before joining room
const isParticipant = await gameParticipantModel.exists(userId, gameId);

if (!isParticipant) {
  emitError(socket.id, {
    code: "NOT_PARTICIPANT",
    message: "You are not a participant in this game"
  });
  return;
}

socket.join(gameId);
```

**Quality Gates**:
```bash
bun run check-types
bun run lint
bun run dev         # Terminal 1
bun run dev:socket  # Terminal 2
# Manual test: Connect from browser, verify auth and room join
```

**Reference**:
- Spec: "Key Architectural Findings - Socket.IO + Bun Integration" (lines 153-193)
- Spec: "WebSocket Server Setup" (lines 566-657)
- Source: `/Users/drewritter/projects/bignight.party/src/lib/websocket/server.ts`
- Socket.IO Bun Engine docs: https://socket.io/docs/v4/server-installation/#with-bun

**Anti-Patterns to Avoid**:
- ❌ Using standard Socket.IO without Bun engine
- ❌ Trying to integrate into Vite dev server (use separate process)
- ❌ Allowing connections without user validation
- ❌ Allowing room joins without participant verification
- ❌ Setting `idleTimeout` less than Socket.IO `pingInterval` (default 25s)
