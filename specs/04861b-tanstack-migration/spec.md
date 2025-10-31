# Migration: Next.js to TanStack Start + tRPC + Bun

**Status**: Draft
**Created**: 2025-10-30
**Run ID**: 04861b
**Target Repo**: `bignight.party-no_nextjs`

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
- **tRPC**: Type-safe API instead of Server Actions
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
- NFR5: Type-safe API calls (tRPC end-to-end inference)
- NFR6: Fast build times with Vite
- NFR7: Straightforward routing (file-based, no nested madness)

**Architecture:**
- NFR8: Clean layer separation (UI → tRPC → Services → Models → Prisma)
- NFR9: No runtime constraints (Bun runs anywhere)
- NFR10: Testable business logic (services isolated from framework)

## Architecture

> **Note**: This spec documents the NEW architecture for `bignight.party-no_nextjs`. The existing Next.js project at `bignight.party/` remains as reference.

### Tech Stack

**Runtime & Framework:**
- Bun 1.x - JavaScript runtime (replaces Node.js)
- TanStack Start - SSR framework with file-based routing
- Vite 6.x - Build tool and dev server
- React 19 - UI library (REQUIRED: TanStack Start + Bun requires React 19.0.0+)

**API Layer:**
- tRPC v11 - Type-safe RPC procedures
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
- tRPC: https://trpc.io
- Better-Auth: https://www.better-auth.com
- Bun: https://bun.sh

### Project Structure

```
bignight.party-no_nextjs/
├── app/
│   ├── routes/           # TanStack Router file-based routes
│   ├── components/       # React components (UI primitives + features)
│   ├── hooks/            # Custom React hooks
│   ├── client.tsx        # Client entry
│   └── server.tsx        # Server entry (SSR)
│
├── server/
│   ├── api/
│   │   ├── trpc.ts       # tRPC router setup
│   │   ├── context.ts    # Request context (auth, db)
│   │   └── routers/      # tRPC procedure definitions
│   ├── services/         # Business logic (port from existing)
│   ├── models/           # Data access (port from existing)
│   ├── auth/             # Better-Auth configuration
│   └── websocket/        # Socket.io server
│
├── shared/
│   ├── types/            # Shared TypeScript types
│   ├── schemas/          # Zod schemas for tRPC
│   └── utils/            # Shared utilities
│
├── prisma/               # Reuse existing schema + migrations
├── public/               # Static assets
└── tests/                # E2E and integration tests
```

### Layer Architecture

**New Stack Layers:**
```
UI Components → tRPC Procedures → Services → Models → Prisma
```

Replaces:
```
UI Components → Server Actions → Services → Models → Prisma
```

**Key Changes:**
- Server Actions → tRPC procedures (type-safe RPC calls)
- next-safe-action → Zod validation in tRPC input
- Auth middleware → Better-Auth context
- Route protection → TanStack Router beforeLoad guards

### Components

**Ported from Existing:**
- All models (`src/lib/models/*.ts`) - Data access unchanged
- All services (`src/lib/services/*.ts`) - Business logic unchanged
- All Zod schemas (`src/schemas/*.ts`) - Used in tRPC inputs
- All Prisma migrations (`prisma/migrations/`) - Database schema unchanged
- All UI components (`src/components/`) - Adapted for new routing

**New Files:**
- `server/api/routers/*.ts` - tRPC procedures (replaces Server Actions)
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
5. tRPC context includes authenticated user on every request

**Pick Submission:**
1. Client calls `trpc.pick.submit.mutate({ ... })`
2. tRPC validates input via Zod schema
3. tRPC context includes authenticated user
4. Procedure calls `pickService.submitPick(userId, data)`
5. Service validates business rules (game open, user is participant)
6. Service calls `pickModel.create(data)`
7. React Query invalidates cache, UI updates

**Real-Time Updates:**
1. Admin calls `trpc.admin.markWinner.mutate({ categoryId, nominationId })`
2. Service updates database via `categoryModel.markWinner()`
3. Service emits Socket.io event to game room: `category:revealed`
4. All connected clients receive event
5. Clients invalidate `leaderboard.getByGame` query
6. React Query refetches leaderboard data
7. UI updates automatically

### Build & Production Configuration

**Vite Configuration (required):**
```typescript
// vite.config.ts
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin'

export default defineConfig({
  plugins: [
    tanstackStart(),
    nitroV2Plugin({ preset: 'bun' }), // REQUIRED for Bun hosting
    viteReact(),
  ],
})
```

**Build Commands:**
```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "start": "bun run server.ts"
  }
}
```

**Production Server:**
- TanStack provides reference `server.ts` implementation
- Uses Bun-native file handling for static assets
- Includes ETag and Gzip compression support
- Build outputs to `.output/server/index.mjs`
- Custom server wraps build output with Socket.io and tRPC

See: https://tanstack.com/start/latest/docs/framework/react/guide/hosting#bun

### Integration Points

**Database:**
- Reuse existing Prisma schema (no changes)
- Reuse existing migrations (no re-migration needed)
- Prisma client generated same way (`pnpm db:generate`)

**Email:**
- Resend API unchanged
- Magic link email template unchanged
- Better-Auth handles token generation

**WebSocket:**
- Socket.io server attached to Bun HTTP server
- Same event patterns (`game:${gameId}` rooms)
- Better-Auth validates socket connections
- Services emit events (no change to pattern)

**Routing:**
- File-based routes: `app/routes/game.$gameId.pick.tsx`
- Dynamic params: `{ params: { gameId } }`
- Search params: `{ search: { category } }`
- Loaders fetch data on server during SSR
- Auth guards in route `beforeLoad`

## Dependencies

**New Packages:**
- `@tanstack/react-router` - File-based routing
- `@tanstack/start` - SSR framework
- `@tanstack/nitro-v2-vite-plugin` - Nitro plugin with Bun preset (required)
- `@trpc/server` - tRPC server
- `@trpc/client` - tRPC client
- `@trpc/react-query` - React Query integration
- `better-auth` - Authentication

See: `package.json` in new repo for complete dependency list

**Removed Packages:**
- `next` - No longer needed
- `next-safe-action` - Replaced by tRPC
- `next-auth` (Auth.js) - Replaced by Better-Auth

**Unchanged Packages:**
- `prisma` / `@prisma/client` - Database access
- `socket.io` / `socket.io-client` - Real-time
- `zod` - Validation
- `tailwindcss` - Styling
- `@biomejs/biome` - Linting
- `typescript` - Type safety

## Migration Strategy

**Phase 1: Infrastructure**
- Set up Bun project with TanStack Start
- Configure Vite with Nitro plugin (Bun preset)
- Copy reference `server.ts` from TanStack docs
- Install React 19.0.0+ (required for Bun hosting)
- Copy Prisma schema and migrations
- Set up Better-Auth configuration
- Create tRPC router skeleton

**Phase 2: Business Logic**
- Port all models from `src/lib/models/`
- Port all services from `src/lib/services/`
- Create tRPC procedures for each former Server Action
- Port Zod schemas to `shared/schemas/`

**Phase 3: UI & Routes**
- Port UI components from `src/components/`
- Create TanStack Router routes
- Implement data loaders
- Add auth guards
- Connect tRPC mutations to forms

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
- [ ] All layers respect boundaries (UI → tRPC → Services → Models)
- [ ] No Next.js dependencies remain
- [ ] Bun runtime runs all code successfully
- [ ] Type safety end-to-end (tRPC infers all types)
- [ ] React 19.0.0+ installed (required for TanStack Start + Bun)
- [ ] Vite configured with Nitro plugin (Bun preset)
- [ ] Build outputs to `.output/server/index.mjs`

**Feature Parity:**
- [ ] All 19 functional requirements implemented
- [ ] Magic link authentication works
- [ ] Users can join games and submit picks
- [ ] Real-time leaderboard updates work
- [ ] Admin panel has full functionality
- [ ] Works and People management operational

**Performance:**
- [ ] Page loads < 1 second (measured with Lighthouse)
- [ ] HMR < 100ms (measured during development)
- [ ] Build time < 30 seconds

**Quality:**
- [ ] All tests pass (unit, integration, E2E)
- [ ] Biome linting passes with zero errors
- [ ] TypeScript compilation passes with strict mode
- [ ] No console errors in production build

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
- tRPC: https://trpc.io/docs
- Better-Auth: https://www.better-auth.com/docs
- Bun: https://bun.sh/docs
- Prisma: https://www.prisma.io/docs
- Socket.io: https://socket.io/docs/v4

**Example Projects:**
- TanStack Basic: https://github.com/depsimon/tanstack-basic

**Source Material:**
- Next.js Pain Points: https://paperclover.net/blog/webdev/one-year-next-app-router
- Existing project: `/Users/drewritter/projects/bignight.party/`
- Target project: `/Users/drewritter/projects/bignight.party-no_nextjs/`

---

**Next Steps:**
1. Review this specification
2. Generate implementation plan: `/spectacular:plan @specs/04861b-tanstack-migration/spec.md`
3. Execute plan with isolated worktrees and stacked branches
