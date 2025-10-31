# Migration: Next.js to TanStack Start + oRPC + Bun

**Status**: In Progress - Infrastructure Complete
**Created**: 2025-10-30
**Updated**: 2025-10-31
**Run ID**: 04861b
**Target Repo**: `bignight.party-vite`
**Repository Path**: `/Users/drewritter/projects/bignight.party-vite/`

---

**Quick Start**: The scaffolded application is ready. Run `bun run dev` in the target directory to see the working demo app.

**Next Steps**:
1. Copy Prisma schema and migrations from source project
2. Set up Better-Auth configuration
3. Port models and services to new structure
4. Create oRPC routers for business logic
5. Build UI routes and components

---

## Problem Statement

**Current State:**

BigNight.Party is built on Next.js 15 App Router with:
- Server Components with async params/searchParams complexity
- Server Actions for mutations (requires `"use server"` directives)
- Edge runtime constraints (middleware can't query database)
- Auth.js v5 with JWT validation workarounds (`requireValidatedSession()`)
- Artificial Server/Client component boundaries
- Complex routing with nested layouts and route groups
- Build/development experience friction

The application works but the framework adds unnecessary complexity for our use case.

**Desired State:**

Rebuild on modern, enjoyable tooling:
- **TanStack Start**: SSR without App Router complexity
- **oRPC**: Type-safe RPC framework instead of Server Actions
- **Bun**: Fast runtime replacing Node.js
- **Better-Auth**: Auth without Edge constraints
- **Vite**: Fast development with proper HMR
- Clean separation of concerns (client/server)
- Full feature parity with existing app

**Gap:**

Need to port all functionality to new stack while maintaining:
- Real-time leaderboard updates (Socket.io)
- Magic link authentication
- Admin panel capabilities
- Database schema and migrations (Prisma)
- Business logic integrity (services/models)

## Requirements

### Functional Requirements (Feature Parity)

**Authentication:**
- FR1: Magic link email authentication (passwordless)
- FR2: Session management with secure cookies
- FR3: Role-based access control (USER, ADMIN)
- FR4: Admin designation via environment variable

**Game Flow:**
- FR5: Users join game via access code
- FR6: Users submit picks for all categories (wizard interface)
- FR7: Admin creates events with categories and nominations
- FR8: Admin marks winners during ceremony
- FR9: Real-time leaderboard updates when winners revealed

**Admin Panel:**
- FR10: Manage events (create, edit, delete)
- FR11: Manage categories within events
- FR12: Manage nominations (Work-based or Person-based)
- FR13: Manage Works library (films, TV shows, albums, etc.)
- FR14: Manage People library (actors, directors, etc.)
- FR15: Import data from external sources (Wikipedia slugs)

**Data Management:**
- FR16: Event/Game separation (one event, many games)
- FR17: Point values per category (not per nomination)
- FR18: Incremental winner reveals (category.isRevealed flag)
- FR19: Pick uniqueness (one pick per user per category per game)

### Non-Functional Requirements

**Performance:**
- NFR1: Sub-second page loads (leveraging Vite build)
- NFR2: Fast HMR during development (<100ms)
- NFR3: Efficient WebSocket connections (existing Socket.io pattern)

**Developer Experience:**
- NFR4: No artificial component boundaries (use client markers only when needed)
- NFR5: Type-safe API calls (oRPC end-to-end inference)
- NFR6: Fast build times with Vite
- NFR7: Straightforward routing (file-based, no nested madness)

**Architecture:**
- NFR8: Clean layer separation (UI → oRPC → Services → Models → Prisma)
- NFR9: No runtime constraints (Bun runs anywhere)
- NFR10: Testable business logic (services isolated from framework)

## Current Status

**Repository**: `bignight.party-vite` at `/Users/drewritter/projects/bignight.party-vite/`

**Already Scaffolded (Working):**
- ✅ Bun runtime configured
- ✅ TanStack Start with file-based routing (`src/routes/`)
- ✅ Vite 7.x with TanStack Start plugin
- ✅ React 19.2.0
- ✅ oRPC server and client integration
  - Example routers in `src/orpc/router/`
  - Client setup with isomorphic server/client handling
  - TanStack Query utilities configured
- ✅ Prisma ORM with PostgreSQL
  - Basic schema (`Todo` model)
  - Database client in `src/db.ts`
  - Migration scripts in package.json
- ✅ Tailwind CSS v4 with `@tailwindcss/vite` plugin
- ✅ shadcn/ui components installed (Button, Input, Select, Switch, Label, Slider, Textarea)
- ✅ TanStack Query and Router devtools
- ✅ Biome for linting and formatting
- ✅ Vitest for testing
- ✅ TypeScript 5.7.2
- ✅ Demo routes showing:
  - oRPC integration (`demo/orpc-todo.tsx`)
  - Prisma usage (`demo/prisma.tsx`)
  - TanStack Query (`demo/tanstack-query.tsx`)
  - Server-side rendering patterns (`demo/start.ssr.*`)
  - Form handling with TanStack Form (`demo/form.*`)

**Demo App Status**: ✅ Runs successfully with `bun run dev`

**Still Needed:**
- ⏳ Copy BigNight.Party Prisma schema and migrations
- ⏳ Set up Better-Auth configuration (with admin role assignment)
- ⏳ Port models, services, and business logic
- ⏳ Create oRPC routers for BigNight.Party functionality
- ⏳ Build UI components and routes for actual features
- ⏳ **Set up Socket.IO with `@socket.io/bun-engine`** (critical architecture requirement)
- ⏳ Create `server.ts` production server (integrates Socket.IO + TanStack Start)
- ⏳ Create `dev-socket.ts` development server (separate Socket.IO process)
- ⏳ Create centralized routes helper (like `src/lib/routes.ts`)
- ⏳ Port Wikipedia parser for data import (FR15)
- ⏳ Set up toast notifications (sonner or similar)
- ⏳ Configure error boundaries and error handling

## Key Architectural Findings

**Research Date**: 2025-10-31

### Socket.IO + Bun Integration (CRITICAL)

After researching Vite, Bun, and Socket.IO integration, the **correct architecture** is:

**✅ Production (Custom `server.ts`)**:
- Use `@socket.io/bun-engine` package (required for Bun runtime)
- Create custom `server.ts` at project root
- Use `Bun.serve()` with routing logic:
  - `/socket.io/` → Socket.IO engine handler
  - `/*` → TanStack Start app handler
- Pass `websocket` handler from Socket.IO engine to `Bun.serve()`

**✅ Development (Separate Process)**:
- Run Socket.IO server in separate process (`dev-socket.ts`)
- Run Vite dev server in main process
- Client connects to Socket.IO on different port (e.g., 3001)
- Simpler than trying to integrate into Vite dev server

**❌ What NOT to Do**:
- ~~Don't use `vite-plugin-socket-io`~~ (outdated, last updated 3 years ago)
- ~~Don't try to integrate Socket.IO into Vite dev server~~ (complex, unnecessary)
- ~~Don't use Node.js Socket.IO engine with Bun~~ (use `@socket.io/bun-engine` instead)

**References**:
- Socket.IO Bun Engine: https://socket.io/blog/bun-engine/
- TanStack Start Bun Example: https://github.com/TanStack/router/tree/main/examples/react/start-bun
- Bun + Socket.IO Discussion: https://github.com/oven-sh/bun/discussions/2111

### TanStack Start Custom Server Pattern

TanStack Start provides a reference `server.ts` that:
1. Imports built app from `.tanstack/build/server/server.js`
2. Uses `Bun.serve()` with custom routing
3. Handles static assets with intelligent preloading
4. Supports environment-based configuration

**Our Addition**: Integrate Socket.IO routing into this pattern.

## Architecture

> **Note**: This spec documents the NEW architecture for `bignight.party-vite`. The existing Next.js project at `bignight.party/` remains as reference.

### Tech Stack

**Runtime & Framework:**
- Bun 1.x - JavaScript runtime (replaces Node.js)
- TanStack Start - SSR framework with file-based routing
- Vite 6.x - Build tool and dev server
- React 19 - UI library (REQUIRED: TanStack Start + Bun requires React 19.0.0+)

**API Layer:**
- oRPC - Type-safe RPC framework with OpenAPI support
- Zod - Input validation and schema definition
- TanStack Query - Client-side data fetching/caching

**Authentication:**
- Better-Auth 1.x - Auth solution with magic links
- Resend - Email delivery (unchanged)
- Prisma adapter - Session storage in PostgreSQL

**Database:**
- Prisma 6.x - ORM (schema unchanged)
- PostgreSQL 15+ - Database (unchanged)
- Existing migrations reused

**Real-Time:**
- Socket.io 4.x - WebSocket server (unchanged pattern)
- Game rooms for event isolation

**Styling:**
- Tailwind CSS v4 - Utility-first CSS
- shadcn/ui - Component primitives
- lucide-react - Icons

**Validation & Types:**
- TypeScript 5.x - Type safety
- Zod - Runtime validation

See:
- TanStack Start: https://tanstack.com/start
- oRPC: https://orpc.unnoq.com
- Better-Auth: https://www.better-auth.com
- Bun: https://bun.sh

### Project Structure

**Current Structure (Scaffolded):**
```
bignight.party-vite/
├── src/
│   ├── routes/           # TanStack Router file-based routes (✅ working)
│   │   ├── __root.tsx    # Root layout with devtools
│   │   ├── index.tsx     # Homepage
│   │   └── demo/         # Demo routes (can be deleted)
│   ├── components/       # React components
│   │   └── ui/           # shadcn/ui primitives (✅ installed)
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # TanStack Query provider setup
│   ├── orpc/             # oRPC configuration (✅ working)
│   │   ├── client.ts     # Isomorphic client setup
│   │   ├── schema.ts     # Shared schemas
│   │   └── router/       # oRPC procedures
│   │       ├── index.ts  # Router aggregation
│   │       └── todos.ts  # Example router (demo)
│   ├── lib/              # Utilities (to be populated)
│   ├── data/             # Data utilities (to be populated)
│   ├── db.ts             # Prisma client (✅ working)
│   ├── router.tsx        # TanStack Router config
│   └── routeTree.gen.ts  # Auto-generated route tree
│
├── schema.prisma         # Prisma schema (basic Todo model - needs replacement)
├── seed.ts               # Database seed script
├── public/               # Static assets
├── vite.config.ts        # Vite configuration (✅ working)
├── package.json          # Dependencies (✅ all installed)
├── biome.jsonc           # Biome linting config
├── tsconfig.json         # TypeScript config
└── lefthook.yml          # Git hooks
```

**Planned Structure (After Migration):**
```
bignight.party-vite/
├── src/
│   ├── routes/           # BigNight.Party routes (to be built)
│   │   ├── admin/        # Admin panel routes
│   │   ├── game/         # Game routes
│   │   └── auth/         # Authentication routes
│   ├── components/       # UI components (to be ported)
│   ├── orpc/
│   │   └── router/       # Business logic routers (to be created)
│   │       ├── game.ts
│   │       ├── pick.ts
│   │       ├── admin.ts
│   │       └── ...
│   ├── lib/
│   │   ├── models/       # Data access layer (to be ported)
│   │   ├── services/     # Business logic (to be ported)
│   │   └── auth/         # Better-Auth config (to be created)
│   └── server/
│       └── websocket/    # Socket.io server (to be created)
│
├── prisma/
│   ├── schema.prisma     # Full BigNight schema (to be copied)
│   └── migrations/       # Existing migrations (to be copied)
└── ...
```

### Layer Architecture

**New Stack Layers:**
```
UI Components → oRPC Procedures → Services → Models → Prisma
```

Replaces:
```
UI Components → Server Actions → Services → Models → Prisma
```

**Key Changes:**
- Server Actions → oRPC procedures (type-safe RPC calls)
- next-safe-action → Zod validation in oRPC input
- Auth middleware → Better-Auth context
- Route protection → TanStack Router beforeLoad guards

### Components

**Ported from Existing:**
- All models (`src/lib/models/*.ts`) - Data access unchanged
- All services (`src/lib/services/*.ts`) - Business logic unchanged
- All Zod schemas (`src/schemas/*.ts`) - Used in oRPC inputs
- All Prisma migrations (`prisma/migrations/`) - Database schema unchanged
- All UI components (`src/components/`) - Adapted for new routing

**New Files:**
- `server/api/routers/*.ts` - oRPC procedures (replaces Server Actions)
- `server/api/context.ts` - Request context with Better-Auth session
- `server/auth/config.ts` - Better-Auth configuration
- `app/routes/*.tsx` - TanStack Router routes (replaces App Router pages)
- `server.ts` - Bun production server (reference implementation from TanStack docs)
- `vite.config.ts` - Vite configuration with Nitro plugin (Bun preset)

### Data Flow

**Authentication:**
1. User requests magic link via Better-Auth
2. Email sent via Resend (existing pattern)
3. User clicks link → Better-Auth creates session
4. Session stored in cookie + PostgreSQL
5. **Admin Role Assignment**: Better-Auth checks `ADMIN_EMAILS` env var during user creation/login
   - If user email matches → assign `role: 'ADMIN'`
   - Otherwise → assign `role: 'USER'`
   - Store role in User table (Prisma schema unchanged)
6. oRPC context includes authenticated user + role on every request

**Better-Auth Configuration** (⏳ Critical - Must Implement):
```typescript
// src/lib/auth/config.ts
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { magicLink } from 'better-auth/plugins/magic-link';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: false, // Only magic links
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // Send email via Resend
        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: email,
          subject: 'Sign in to BigNight.Party',
          html: `<a href="${url}">Click here to sign in</a>`,
        });
      },
    }),
  ],
  user: {
    // Custom hook to assign admin role
    onCreate: async (user) => {
      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
      const isAdmin = adminEmails.includes(user.email);
      return {
        ...user,
        role: isAdmin ? 'ADMIN' : 'USER',
      };
    },
  },
});
```

**Key Difference from Auth.js**:
- Auth.js: Admin role assigned in JWT callback (middleware limitation)
- Better-Auth: Admin role assigned during user creation, stored in database
- Better-Auth: No Edge runtime constraints, can query database anywhere

**Pick Submission:**
1. Client calls `orpc.pick.submit({ ... })`
2. oRPC validates input via Zod schema
3. oRPC context includes authenticated user
4. Procedure calls `pickService.submitPick(userId, data)`
5. Service validates business rules (game open, user is participant)
6. Service calls `pickModel.create(data)`
7. React Query invalidates cache, UI updates

**Real-Time Updates:**
1. Admin calls `orpc.admin.markWinner({ categoryId, nominationId })`
2. Service updates database via `categoryModel.markWinner()`
3. Service emits Socket.io event to game room: `category:revealed`
4. All connected clients receive event
5. Clients invalidate `leaderboard.getByGame` query
6. React Query refetches leaderboard data
7. UI updates automatically

### Build & Production Configuration

**Vite Configuration** (✅ Already configured in `vite.config.ts`):
```typescript
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    viteTsConfigPaths({ projects: ["./tsconfig.json"] }), // Path aliases
    tailwindcss(),                                        // Tailwind v4
    tanstackStart(),                                      // TanStack Start
    viteReact(),                                          // React
  ],
});
```

**Scripts** (✅ Already in `package.json`):
```json
{
  "scripts": {
    "dev": "vite dev --port 3000",
    "build": "vite build",
    "serve": "vite preview",
    "lint": "bun check-types && biome check --write",
    "test": "vitest run",
    "db:generate": "dotenv -e .env.local -- prisma generate",
    "db:migrate": "dotenv -e .env.local -- prisma migrate dev",
    "db:push": "dotenv -e .env.local -- prisma db push",
    "db:studio": "dotenv -e .env.local -- prisma studio"
  }
}
```

**Production Server** (⏳ Critical - Must Create):

TanStack Start with Bun requires a custom `server.ts` file at project root that:
1. Imports the built TanStack Start handler from `./dist/server/server.js`
2. Integrates Socket.IO using `@socket.io/bun-engine`
3. Routes requests between Socket.IO and the app

**Production Build Process**:
```bash
# 1. Build the app
bun run build

# Output: .tanstack/build/server/server.js (app handler)

# 2. Start production server
bun run start
# Or: bun run server.ts
```

**Package.json Scripts**:
```json
{
  "scripts": {
    "build": "vite build",
    "start": "bun run server.ts",
    "dev": "vite dev --port 3000",
    "dev:socket": "bun run dev-socket.ts"  // Separate Socket.IO dev server
  }
}
```

**What Gets Built**:
- Vite builds app to `.tanstack/build/`
- Server code compiled to `.tanstack/build/server/server.js`
- Client code compiled to `.tanstack/build/client/`
- `server.ts` wraps the built handler with Socket.IO

**Reference**: TanStack Start provides a reference `server.ts` implementation in their Bun example: https://github.com/TanStack/router/tree/main/examples/react/start-bun

### Critical Patterns to Port

**1. Centralized Routes** (`src/lib/routes.ts`):
```typescript
// Existing Next.js pattern - MUST be ported
export const routes = {
  admin: {
    events: {
      detail: (eventId: string) => `/admin/events/${eventId}`,
      // ... 20+ route functions
    },
  },
  game: {
    pick: (gameId: string, categoryId?: string) =>
      categoryId ? `/game/${gameId}/pick?category=${categoryId}` : `/game/${gameId}/pick`,
    leaderboard: (gameId: string) => `/game/${gameId}/leaderboard`,
  },
  // ... more routes
};
```
**Why critical**: Type-safe navigation, single source of truth, prevents hardcoded URL strings.

**2. Wikipedia Data Parser** (`src/lib/parsers/wikipedia/`):
- Parses Wikipedia pages for film/person data
- Used in admin import flow (FR15)
- Depends on `wtf_wikipedia` package
- Extracts: title, year, director, cast, images

**3. WebSocket Event Constants** (`src/lib/websocket/events.ts`):
```typescript
export const LEADERBOARD_EVENTS = {
  UPDATE: "leaderboard:update",
  ERROR: "leaderboard:error",
  JOIN: "join",
  REACTION_SEND: "reaction:send",     // Future feature
  REACTION_BROADCAST: "reaction:broadcast",  // Future feature
};
```

**4. Toast Notifications**:
- Existing app uses `sonner` for toast notifications
- Used for success/error feedback throughout app
- Must be integrated into new app

**5. Error Boundaries**:
- Need React error boundaries for graceful error handling
- TanStack Router has built-in error boundary support

### Integration Points

**Database:**
- Reuse existing Prisma schema (no changes)
- Reuse existing migrations (no re-migration needed)
- Prisma client generated same way (`bun run db:generate`)

**Email:**
- Resend API unchanged
- Magic link email template unchanged
- Better-Auth handles token generation

**WebSocket:**
- Socket.io server must be attached to Bun HTTP server (custom server required)
- Same event patterns as Next.js app
- Connection flow:
  1. Client connects with `auth: { userId }` in handshake
  2. Server validates user exists in database
  3. Client emits `join` event with `{ gameId }`
  4. Server verifies user is game participant
  5. Socket joins game room (room name = gameId)
  6. Services emit to room: `io.to(gameId).emit(LEADERBOARD_EVENTS.UPDATE, data)`
- Better-Auth session validation required
- See existing implementation in `src/lib/websocket/server.ts` for patterns

**WebSocket Server Setup** (⏳ Critical - Correct Architecture):

**Required Package**: `@socket.io/bun-engine` - Socket.IO engine specifically for Bun

**Production Setup** (in `server.ts`):
```typescript
import { Server as SocketIOEngine } from "@socket.io/bun-engine";
import { Server as SocketIO } from "socket.io";
import { getSocketServer } from '@/lib/websocket/server';

// Import TanStack Start app handler
import handler from './dist/server/server.js';

// Initialize Socket.IO with Bun engine
const io = new SocketIO();
const engine = new SocketIOEngine({ path: "/socket.io/" });
io.bind(engine);

// Set up Socket.IO connection handlers (import from existing code)
setupSocketHandlers(io);

const { websocket } = engine.handler();

// Bun server with Socket.IO integration
const server = Bun.serve({
  port: 3000,
  idleTimeout: 30, // Must exceed Socket.IO pingInterval (default 25s)

  // Route Socket.IO requests vs app requests
  fetch(req, server) {
    const url = new URL(req.url);

    // Socket.IO upgrade requests
    if (url.pathname === "/socket.io/") {
      return engine.handleRequest(req, server);
    }

    // All other requests go to TanStack Start app
    return handler.fetch(req);
  },

  // WebSocket handler from Socket.IO engine
  websocket
});
```

**Development Setup** (Two Options):

**Option 1 - Separate Socket.IO Server** (Simpler):
```bash
# Terminal 1: Vite dev server
bun run dev

# Terminal 2: Socket.IO server
bun run dev:socket
```

**Option 2 - Custom Vite Plugin** (Integrated):
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { Server as SocketIOEngine } from "@socket.io/bun-engine";
import { Server as SocketIO } from "socket.io";

export default defineConfig({
  plugins: [
    {
      name: 'socket-io-server',
      configureServer(viteServer) {
        const io = new SocketIO();
        const engine = new SocketIOEngine({ path: "/socket.io/" });
        io.bind(engine);

        // Setup handlers
        setupSocketHandlers(io);

        // Intercept Socket.IO requests
        viteServer.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/socket.io/')) {
            // Handle via Socket.IO
            // Note: This requires additional setup for Bun engine
          }
          next();
        });
      }
    },
    // ... other plugins
  ]
});
```

**Recommended Approach**: Option 1 (separate server in dev) is simpler and clearer.

**Routing:**
- File-based routes: `src/routes/game.$gameId.pick.tsx`
- Dynamic params: `{ params: { gameId } }`
- Search params: `{ search: { category } }`
- Loaders fetch data on server during SSR
- Auth guards in route `beforeLoad`:
  ```typescript
  // Protected route pattern
  export const Route = createFileRoute('/game/$gameId/pick')({
    beforeLoad: async ({ context }) => {
      const session = await getSession(context);
      if (!session) throw redirect({ to: '/sign-in' });

      // Business logic authorization
      const isParticipant = await gameParticipantModel.exists(
        session.user.id,
        params.gameId
      );
      if (!isParticipant) throw redirect({ to: '/dashboard' });
    },
    loader: async ({ params, context }) => {
      // User is authenticated and authorized
      return fetchGameData(params.gameId);
    },
  });
  ```

**Route Protection Patterns:**
- **Authentication**: Check Better-Auth session in `beforeLoad`
- **Authorization**: Verify user role (admin routes) or game participant status
- **Admin Routes**: Check `session.user.role === 'ADMIN'`
- **Game Routes**: Verify game participant via `gameParticipantModel.exists()`

### Complete Route Map

**Route Structure** (⏳ Must be implemented in `src/routes/`):

**Public Routes:**
- `/` - Homepage (marketing/landing)
- `/sign-in` - Sign in page (magic link request)
- `/signup` - Sign up flow with optional access code
- `/signup/callback` - Magic link verification callback
- `/join/$code` - Join game via access code

**Authenticated Routes:**
- `/dashboard` - User dashboard (list of user's games)

**Game Routes** (require game participant verification):
- `/game/$gameId/pick` - Pick wizard (with optional `?category=` query param)
- `/game/$gameId/leaderboard` - Real-time leaderboard

**Admin Routes** (require `role === 'ADMIN'`):
- `/admin` - Admin home
- `/admin/events` - List all events
- `/admin/events/new` - Create new event
- `/admin/events/$eventId` - Edit event
- `/admin/events/$eventId/categories/new` - Create category
- `/admin/events/$eventId/categories/$categoryId` - Edit category
- `/admin/events/$eventId/categories/$categoryId/nominations/new` - Create nomination
- `/admin/games` - List all games
- `/admin/games/new` - Create new game
- `/admin/games/$gameId` - Edit game
- `/admin/games/$gameId/live` - Live winner marking (ceremony mode)
- `/admin/works` - List works library (with optional `?type=` filter)
- `/admin/works/new` - Create new work
- `/admin/works/$workId` - Edit work
- `/admin/people` - List people library
- `/admin/people/new` - Create new person
- `/admin/people/$personId` - Edit person
- `/admin/import` - Wikipedia data import tool

**Total Routes**: ~25 routes to implement

### Environment Variables

**Required Environment Variables** (⏳ Must be configured):
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bignight

# Better-Auth (replaces AUTH_SECRET/NEXTAUTH_URL)
BETTER_AUTH_SECRET=  # Generate with: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=noreply@yourdomain.com

# Admin Configuration (comma-separated emails)
ADMIN_EMAILS=admin@example.com,other@example.com

# Node Environment
NODE_ENV=development  # or production
```

**Migration Notes**:
- `AUTH_SECRET` → `BETTER_AUTH_SECRET`
- `NEXTAUTH_URL` → `BETTER_AUTH_URL`
- Admin role assignment: Better-Auth will check `ADMIN_EMAILS` during user creation/login

## Dependencies

**Already Installed** ✅:
- `@tanstack/react-router` ^1.132.0 - File-based routing
- `@tanstack/react-start` ^1.132.0 - SSR framework
- `@tanstack/react-query` ^5.66.5 - Data fetching/caching
- `@orpc/server` ^1.7.5 - oRPC server
- `@orpc/client` ^1.7.5 - oRPC client
- `@orpc/tanstack-query` ^1.7.5 - TanStack Query integration
- `@orpc/zod` ^1.7.5 - Zod integration
- `@orpc/openapi` ^1.7.5 - OpenAPI support
- `prisma` / `@prisma/client` ^6.16.3 - Database ORM
- `zod` ^4.0.10 - Schema validation
- `tailwindcss` ^4.0.6 - Utility-first CSS
- `@tailwindcss/vite` ^4.0.6 - Vite plugin
- `@biomejs/biome` 2.3.2 - Linting/formatting
- `typescript` ^5.7.2 - Type safety
- `react` / `react-dom` ^19.2.0 - UI library
- `vite` ^7.1.7 - Build tool
- `vitest` ^3.0.5 - Testing framework
- shadcn/ui components (Button, Input, Select, etc.)

**Still Needed** ⏳:
- `better-auth` - Authentication library with magic links
- `socket.io` ^4.8.1 - Socket.IO server
- `@socket.io/bun-engine` ^1.0.0 - **REQUIRED** Socket.IO engine for Bun runtime
- `socket.io-client` ^4.8.1 - Socket.IO client for browser
- `resend` ^6.2.0 - Email delivery service
- `sonner` ^2.0.7 - Toast notifications
- `wtf_wikipedia` ^10.4.0 - Wikipedia data parsing (FR15)
- `date-fns` ^4.1.0 - Date formatting utilities
- `ts-pattern` ^5.8.0 - Pattern matching for discriminated unions

**Critical Note**: When using Socket.IO with Bun, you **must** use `@socket.io/bun-engine` instead of Node.js-based engines. This package leverages Bun's native HTTP server for optimal performance.

**Removed from Next.js Project:**
- `next` - Replaced by TanStack Start
- `next-safe-action` - Replaced by oRPC
- `next-auth` (Auth.js) - Replaced by Better-Auth

## Migration Strategy

**Phase 1: Infrastructure** ✅ **COMPLETE**
- ✅ Set up Bun project with TanStack Start
- ✅ Configure Vite (TanStack Start plugin configured)
- ✅ Install React 19.2.0
- ✅ Install and configure oRPC with TanStack Query integration
- ✅ Set up Prisma client with basic schema
- ✅ Configure Tailwind CSS v4
- ✅ Install shadcn/ui components (Button, Input, Select, etc.)
- ✅ Set up Biome for linting/formatting
- ✅ Configure Vitest for testing
- ✅ Create demo routes showing all features
- ⏳ Copy actual Prisma schema and migrations from existing project
- ⏳ Set up Better-Auth configuration
- ✅ Create oRPC router skeleton (example todos router exists)

**Phase 2: Business Logic**
- Port all models from `src/lib/models/`
- Port all services from `src/lib/services/`
- Create oRPC procedures for each former Server Action
- Port Zod schemas to `shared/schemas/`

**Phase 3: UI & Routes**
- Port UI components from `src/components/`
- Create TanStack Router routes
- Implement data loaders
- Add auth guards
- Connect oRPC mutations to forms

**Phase 4: Real-Time**
- Set up Socket.io server with Bun
- Port WebSocket event handlers
- Connect client-side socket hooks
- Test live leaderboard updates

**Phase 5: Testing & Deployment**
- Port existing tests (adapt for new framework)
- Add E2E tests with Playwright
- Configure deployment (Railway/Fly.io/VPS)
- Set up environment variables
- Production deployment

> **Note**: Detailed task breakdown will be generated via `/spectacular:plan` command.

## Acceptance Criteria

**Architecture:**
- [x] Bun runtime runs all code successfully
- [x] React 19.2.0 installed (required for TanStack Start)
- [x] Vite configured with TanStack Start plugin
- [x] oRPC type safety configured (client-server inference working)
- [ ] All layers respect boundaries (UI → oRPC → Services → Models) - *pending business logic migration*
- [ ] No Next.js dependencies remain
- [ ] Production build configured with Socket.io integration

**Feature Parity:**
- [ ] All 19 functional requirements implemented
- [ ] Magic link authentication works
- [ ] Users can join games and submit picks
- [ ] Real-time leaderboard updates work
- [ ] Admin panel has full functionality
- [ ] Works and People management operational

**Performance:**
- [x] HMR < 100ms (Vite provides fast HMR out of the box)
- [ ] Page loads < 1 second (pending app implementation)
- [ ] Build time < 30 seconds (pending full app build)

**Quality:**
- [x] Biome linting configured and passes on scaffold
- [x] TypeScript compilation passes with strict mode
- [x] Vitest configured for testing
- [ ] All tests pass (pending test migration)
- [ ] No console errors in production build (pending production build)

**Deployment:**
- [ ] Production build succeeds
- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] WebSocket connections stable
- [ ] Application accessible via public URL

## Open Questions

1. **Deployment Platform**: Railway, Fly.io, Render, or self-hosted VPS?
   - Decision deferred (architecture supports all)

2. **Constitution for New Project**: Should we create new constitution docs for the TanStack stack?
   - Recommendation: Yes, create lean constitution after migration complete

3. **Test Migration**: Port existing tests or rewrite for new framework?
   - Recommendation: Port test logic, adapt framework-specific code

4. **Gradual Migration**: Any reason to run both stacks in parallel?
   - Recommendation: No, clean cut migration (no production users yet)

## References

**External Documentation:**
- TanStack Start: https://tanstack.com/start/latest
- TanStack Router: https://tanstack.com/router/latest
- TanStack Start + Bun Hosting: https://tanstack.com/start/latest/docs/framework/react/guide/hosting#bun
- oRPC: https://orpc.unnoq.com/docs
- Better-Auth: https://www.better-auth.com/docs
- Bun: https://bun.sh/docs
- Prisma: https://www.prisma.io/docs
- Socket.io: https://socket.io/docs/v4

**Example Projects:**
- TanStack Basic: https://github.com/depsimon/tanstack-basic

**Source Material:**
- Next.js Pain Points: https://paperclover.net/blog/webdev/one-year-next-app-router
- Existing project: `/Users/drewritter/projects/bignight.party/`
- Target project: `/Users/drewritter/projects/bignight.party-vite/`

---

**Next Steps:**
1. Review this specification
2. Generate implementation plan: `/spectacular:plan @specs/04861b-tanstack-migration/spec.md`
3. Execute plan with isolated worktrees and stacked branches

---

## Critical Gaps for Feature Parity

This section summarizes the **must-have** items before the app can function:

### 1. Authentication (BLOCKER)
- [ ] Install `better-auth` package
- [ ] Configure Better-Auth with magic link plugin
- [ ] Implement admin role assignment via `ADMIN_EMAILS`
- [ ] Create Better-Auth session context for oRPC
- [ ] Integrate Resend email sending in magic link callback

**Why critical**: App is unusable without authentication

### 2. WebSocket Server (BLOCKER for Real-Time)
- [ ] Install `socket.io`, `@socket.io/bun-engine`, and `socket.io-client`
- [ ] Create `server.ts` at project root (copy from TanStack Start Bun example)
- [ ] Integrate Socket.IO into `server.ts` using Bun engine
  - Initialize Socket.IO with `@socket.io/bun-engine`
  - Split routing: `/socket.io/` → Socket.IO, `/*` → TanStack Start app
  - Export `websocket` handler from engine
- [ ] Port WebSocket server logic from `src/lib/websocket/server.ts`
  - Connection validation (user exists in DB)
  - Room management (join game rooms)
  - Event handlers (join, disconnect)
- [ ] Create `dev-socket.ts` for development Socket.IO server (separate process)
- [ ] Configure client-side Socket.io connection with auth handshake

**Why critical**: Real-time leaderboard updates (FR9) won't work

**Key Architectural Decision**: Use **separate Socket.IO server in development** (simpler) but **integrated in production** via `server.ts`

### 3. Database Schema (BLOCKER)
- [ ] Copy Prisma schema from `bignight.party/prisma/schema.prisma`
- [ ] Copy all migrations from `bignight.party/prisma/migrations/`
- [ ] Run migrations in new project
- [ ] Verify schema integrity

**Why critical**: App cannot function without correct database schema

### 4. Core Utilities (HIGH PRIORITY)
- [ ] Create centralized routes file (`src/lib/routes.ts`)
- [ ] Install and configure `sonner` for toast notifications
- [ ] Install `ts-pattern` for discriminated union matching
- [ ] Install `date-fns` for date formatting
- [ ] Install `wtf_wikipedia` for data import (FR15)

**Why critical**: These are used throughout the app

### 5. Business Logic (HIGH PRIORITY)
- [ ] Port all models from `src/lib/models/`
- [ ] Port all services from `src/lib/services/`
- [ ] Port all Zod schemas from `src/schemas/`
- [ ] Create oRPC routers calling services
- [ ] Port Wikipedia parser for admin import

**Why critical**: No functionality without business logic

### 6. UI Routes (HIGH PRIORITY)
- [ ] Implement all 25 routes (see Route Map above)
- [ ] Port UI components from `src/components/`
- [ ] Configure route guards (`beforeLoad` for auth/authz)
- [ ] Implement loaders for data fetching

**Why critical**: Users need UI to interact with app

### 7. Environment Configuration (MEDIUM PRIORITY)
- [ ] Create `.env.example` with all required variables
- [ ] Document Better-Auth environment variables
- [ ] Update deployment documentation

### Implementation Priority Order:
1. **Phase 1**: Database schema + models (foundation)
2. **Phase 2**: Authentication (Better-Auth + oRPC context)
3. **Phase 3**: Services + oRPC routers (business logic)
4. **Phase 4**: Core utilities (routes, toast, patterns)
5. **Phase 5**: UI routes + components (user-facing features)
6. **Phase 6**: WebSocket server (real-time updates)
7. **Phase 7**: Wikipedia parser (admin import feature)

**Estimated Scope**: ~40-50 hours of focused development work
