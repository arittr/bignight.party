# BigNight v2 — Design Spec

Oscar prediction game for friends. Players guess category winners before the ceremony, then watch a live leaderboard update as winners are announced during the broadcast.

## Context

BigNight v1 was overbuilt — 11 database tables, 24 pages, 18 admin pages, multi-tenant event/game abstraction. 77% of the API surface was admin. The actual game experience (pick wizard + live leaderboard) was solid but buried under CMS-level complexity.

v2 is a ground-up rebuild focused on the game itself: simpler data model, simpler admin, mobile-first UX, modern lightweight stack.

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Runtime | Bun | Fast startup, native SQLite, modern JS runtime |
| HTTP | Hono | Lightweight, first-class Bun support |
| WebSocket | Socket.io + @socket.io/bun-engine | Proven real-time library with native Bun adapter |
| Database | SQLite via Drizzle ORM | No external DB dependency, file-based |
| API | Hono routes + @hono/zod-validator | Zod-validated routes, types shared via @bignight/shared |
| Frontend | Vite + React 19 + React Router v7 (library mode) | SPA, no SSR needed |
| Styling | Tailwind CSS v4 | Utility-first, mobile-first |
| Validation | Zod | Runtime type validation, shared between client/server |
| Linting | Biome (strict rules) | Formatter + linter, replaces ESLint + Prettier |
| Animation | Framer Motion | Leaderboard reactions |
| Wikipedia | wtf_wikipedia | Nominee data import |
| Pattern matching | ts-pattern | Exhaustive matching for state logic |

### Architecture

Monorepo with Bun workspaces:

```
bignight.party.2/
├── packages/
│   ├── server/          # Hono + Socket.io + Drizzle + oRPC
│   ├── web/             # Vite + React + React Router
│   └── shared/          # oRPC contracts, Zod schemas, types
├── package.json         # Workspace root
├── biome.json           # Shared lint/format config
└── tsconfig.json        # Shared TypeScript config
```

**Dev:** `bun dev` starts both Vite dev server and Hono backend. Vite proxies API/WebSocket calls to Hono.

**Prod:** Hono serves the Vite static build. Single process, single deploy artifact.

**Server entrypoint:** Custom `export default` pattern required for Socket.io + Bun integration (not Hono's normal `app.listen()`):

```typescript
export default {
  port: 3000,
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/socket.io/")) {
      return engine.handleRequest(req, server);
    }
    return app.fetch(req, server);
  },
  websocket: engine.handler().websocket,
};
```

## Data Model

5 tables (4 domain + 1 config). Down from 11 in v1.

### Tables

**Player**
| Column | Type | Notes |
|--------|------|-------|
| id | text (cuid) | Primary key |
| name | text | Unique, required |
| pin | text | Hashed short PIN |
| createdAt | integer | Unix timestamp |

**Category**
| Column | Type | Notes |
|--------|------|-------|
| id | text (cuid) | Primary key |
| name | text | e.g., "Best Picture" |
| order | integer | Display/navigation order |
| points | integer | Default 1, configurable per category |
| winnerId | text | Nullable FK → Nomination |
| isRevealed | boolean | Controls leaderboard scoring visibility |
| createdAt | integer | Unix timestamp |

**Nomination**
| Column | Type | Notes |
|--------|------|-------|
| id | text (cuid) | Primary key |
| categoryId | text | FK → Category, cascade delete |
| title | text | Primary display text (work or person name) |
| subtitle | text | Secondary text (director for Best Picture, film for Best Actor) |
| imageUrl | text | Nullable, from Wikipedia |
| createdAt | integer | Unix timestamp |

**Pick**
| Column | Type | Notes |
|--------|------|-------|
| id | text (cuid) | Primary key |
| playerId | text | FK → Player, cascade delete |
| categoryId | text | FK → Category, cascade delete |
| nominationId | text | FK → Nomination, cascade delete |
| createdAt | integer | Unix timestamp |
| updatedAt | integer | Unix timestamp |

Unique constraint: `(playerId, categoryId)` — one pick per player per category.

### App-Level Config

Single-row `GameConfig` table for app-wide state:

| Column | Type | Notes |
|--------|------|-------|
| id | integer | Always 1 (singleton) |
| picksLockAt | integer | Nullable Unix timestamp — when picks lock |
| completedAt | integer | Nullable Unix timestamp — when game finished |

State is derived, not stored as an enum:
- **Setup:** No categories imported yet
- **Open:** Categories exist, `picksLockAt` is in the future (or null)
- **Locked:** `picksLockAt` has passed, `completedAt` is null
- **Completed:** `completedAt` is set

### Nomination Aggregation

"How many nominations does Anora have?" is answered via `GROUP BY title` on the Nomination table. The Wikipedia parser produces consistent titles, so string matching is reliable. No separate Work entity needed.

### SQLite Notes

- No database-level enums — use string fields validated by Zod
- Timestamps stored as Unix integers (not ISO strings)
- `PRAGMA foreign_keys = ON` must be set at connection time
- Drizzle handles SQLite constraints natively

## Pages

6 total. Down from 24 in v1.

### Player Pages (4)

**`/` — Join**
- Single form: name + PIN
- If player exists with that name, validate PIN → sign in
- If player doesn't exist, create with name + PIN → sign in
- Session stored client-side (JWT or simple token)
- Visual style: Awards Night — deep blue gradient, gold accents, theatrical
- No email, no OAuth, no magic links

**`/picks` — Pick Wizard**
- Horizontal scrollable category pills (not sidebar)
- Mobile-first: pills at top, nominations as tappable cards below
- Category pills show completion checkmarks
- Auto-saves picks on selection (optimistic UI with save indicator)
- Prev/Next navigation at bottom
- Progress counter: "5 of 23 picked"
- Yellow warning banner when < 30 minutes until picks lock
- Red locked banner + redirect to /leaderboard when picks are locked
- If picks locked, redirect to /leaderboard

**`/leaderboard` — Live Leaderboard**
- Podium style: top 3 get visual podium with crown/medals and proportional bars
- Remaining players in ranked list below
- "Just Announced" banner showing latest revealed winner
- Real-time score updates via WebSocket
- Floating emoji reactions (drift across screen, 3-second TTL)
- Reaction bar at bottom: 🔥 😍 😱 💀
- Connection status indicator (green "LIVE" badge)
- Progress: "12 of 23 categories revealed"
- Only shows players who submitted picks for ALL categories (players with incomplete picks see a message explaining they need to complete all picks to appear on the board)
- Tie handling: same score + correct count = same rank, gap-aware numbering

**`/my-picks` — Review Picks**
- Read-only view of your picks
- Shows which picks were correct (after reveal)
- Available in all phases (lets players review picks anytime, including while picking)
- During open phase: shows current picks without edit capability (editing happens on /picks)

### Admin Pages (2)

**`/admin` — Import & Setup**
- Wikipedia URL input → preview → import
- View imported categories and nominations
- Set picks lock time (datetime picker)
- Lock/unlock picks button
- Reset game button (with confirmation)
- Admin access via env var (ADMIN_PIN or similar)

**`/admin/live` — Mark Winners**
- Same pill nav pattern as picks page (consistency)
- Category pills: green checkmark for revealed, gold highlight for current
- Big tappable nominee cards with pick counts ("6 picks")
- Tap card → confirmation → winner marked
- No dropdowns — tap to select, mobile-first
- "Undo" capability (clear winner, sets isRevealed=false and winnerId=null)
- Progress: "8 / 23 revealed"

## Visual Design

**Theme: Awards Night**
- Background: deep blue gradient (`linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)`)
- Primary accent: gold (`#e2b04a`)
- Text: white/light gray on dark backgrounds
- Cards: semi-transparent with subtle borders (`rgba(255,255,255,0.04)`)
- Selected state: gold border + gold tint background
- Status indicators: green for live/revealed, gold for active/current
- Typography: system font stack, bold headings
- Mobile-first: all layouts designed for phone screens first

## Real-Time Architecture

### WebSocket (Socket.io)

**Server events (broadcast to all connected clients):**
- `leaderboard:update` — new scores after winner revealed. Payload: array of `{ playerId, name, totalScore, correctCount, rank }`
- `game:completed` — all categories revealed, game over. Payload: `{ completedAt }`
- `reaction:broadcast` — emoji from another player. Payload: `{ playerId, name, emoji, id, timestamp }`

**Client events (sent to server):**
- `join` — join the game room (with player auth)
- `reaction:send` — send emoji reaction. Payload: `{ emoji }`. Server validates against allowed set.

**Connection lifecycle:**
- Client connects with player ID in auth handshake
- Server validates player exists in DB
- Client joins game room
- On disconnect: auto-cleanup
- On reconnect: auto-rejoin room
- Connection status exposed to UI (connecting/connected/disconnected)

**Additional server events:**
- `picks:locked` — broadcast when `picksLockAt` passes, so clients on /picks can redirect immediately

**Allowed reactions:** 🔥, 😍, 😱, 💀 — server rejects anything else.

## Game Logic

### Scoring

For each player:
1. Must have picks for ALL categories to appear on leaderboard
2. For each revealed category: if player's pick matches winnerId, add category's points
3. Sort by: totalScore DESC → correctCount DESC → name ASC
4. Rank with gap-aware ties (1, 1, 3 — not 1, 1, 2)

### Winner Marking Flow

1. Admin taps nomination on `/admin/live`
2. Confirmation prompt
3. Server atomically sets `category.winnerId` and `category.isRevealed = true`
4. Server recalculates leaderboard
5. Server broadcasts `leaderboard:update` to all connected clients
6. Server checks if all categories revealed → if yes, sets `gameConfig.completedAt` and broadcasts `game:completed`

### Pick Submission Validation

Server validates:
- Player exists
- Picks are not locked (current time < picksLockAt, or picksLockAt is null)
- Game is not completed
- Nomination belongs to specified category
- Upsert: if player already picked this category, overwrite silently

### Clear Winner (Undo)

- Sets `category.winnerId = null` and `category.isRevealed = false`
- Recalculates and broadcasts leaderboard
- Does NOT revert game completion if already completed

## Auth

No auth framework. Lightweight player identity:

- Player provides name + short PIN (4-6 digits)
- PIN is hashed (bcrypt or similar) before storage
- On "sign in": validate name exists + PIN matches hash
- Session: server issues a simple signed token (JWT) containing playerId
- Token sent as Bearer header on API calls, also passed in WebSocket auth handshake
- Admin: separate PIN from env var (ADMIN_PIN), issues admin-flagged token

No email, no OAuth, no session store. Just signed tokens.

Token expiry: tokens last 24 hours. For a one-evening party game this is more than enough. No refresh mechanism needed.

## Wikipedia Import

### Parser (port from v1)

The v1 Wikipedia parser (`wikipedia-parser.ts`, ~600 lines) uses `wtf_wikipedia` to:
1. Fetch an Academy Awards ceremony page
2. Parse categories and nominations from tables and bullet lists
3. Extract person names, work titles, and images
4. Return structured data: `{ eventName, categories: [{ name, nominations: [{ title, subtitle, imageUrl }] }] }`

The v1 parser is split across `wikipedia-parser.ts`, `wikipedia-adapter.ts`, and `types.ts`. Port and consolidate into a single module for v2.

### Import Service (new for v2)

1. Parse Wikipedia URL → structured data
2. Preview mode: return parsed data for admin review (no DB writes)
3. Import mode: create Category and Nomination rows in a transaction
4. Deduplication: if categories already exist, warn and require reset first
5. Category order: assigned sequentially from Wikipedia parsing order
6. Nomination title/subtitle mapping:
   - For "Best Picture": title = film name, subtitle = director
   - For "Best Actor": title = actor name, subtitle = film name
   - Pattern depends on category — parser handles this

### New Category Support

The parser needs to handle "Best Casting" (new for 98th ceremony). The parser should be flexible enough to handle unknown categories without hardcoded category lists — parse whatever Wikipedia provides.

## Code to Lift from v1

### Direct Ports (minimal changes)
- Scoring logic: `getLeaderboard()`, `calculateUserScore()`, `areAllCategoriesRevealed()` — pure business logic
- WebSocket event constants and type definitions
- Wikipedia parser (database-agnostic)
- Reaction component (Framer Motion animations)
- Pick wizard component patterns (navigation, save indicator)

### Moderate Refactors (same logic, new interfaces)
- Leaderboard service (broadcasting) — adapt to Hono + Socket.io/Bun
- Category winner marking service — adapt to Drizzle
- Client WebSocket hooks (leaderboard + reactions) — same patterns, new setup
- Pick submission hook — same optimistic UI pattern, new oRPC routes

### Heavy Rewrites (new implementation inspired by v1 patterns)
- Model layer — Drizzle replaces Prisma, all queries rewritten
- Server entrypoint — Bun + Hono + Socket.io replaces custom Next.js server
- Auth middleware — simple JWT replaces Auth.js

## Testing Strategy

- Vitest for unit and integration tests
- Test database: separate SQLite file for tests, truncated between test runs
- Test factories for Player, Category, Nomination, Pick
- Real database tests (not mocked) — following v1's approach
- Key test areas:
  - Scoring/leaderboard calculation (edge cases: ties, partial picks, zero scores)
  - Pick submission validation (locked, completed, invalid nomination)
  - Winner marking + auto-completion
  - Wikipedia parser (known ceremony pages)
  - WebSocket event broadcasting

## Non-Goals

Things we're intentionally NOT building:
- Multi-game/multi-event support
- Email authentication
- Admin CRUD for works/people entities
- Dashboard page
- Game access codes
- User roles beyond admin/player
- SSR or server-side rendering
- CI/CD pipeline (deploy manually for now)
