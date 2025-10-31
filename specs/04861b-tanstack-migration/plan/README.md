# TanStack Migration Implementation Plan

**Spec**: [04861b-tanstack-migration/spec.md](../spec.md)
**Target**: `/Users/drewritter/projects/bignight.party-vite`
**Status**: Ready for Execution
**Generated**: 2025-10-31

---

## Executive Summary

This plan migrates BigNight.Party from Next.js to TanStack Start + oRPC + Bun in **7 phases** with **11 total tasks**.

### Time Estimates

- **Sequential Execution**: ~55 hours
- **Parallel Execution**: ~39 hours
- **Time Savings**: 16 hours (29% faster)

### Technology Stack

**Replacing**:
- Next.js App Router → TanStack Start (file-based routing)
- Server Actions → oRPC (type-safe RPC)
- Auth.js → Better-Auth (magic links, no Edge constraints)
- Node.js → Bun (JavaScript runtime)

**Keeping**:
- Prisma ORM with existing schema and migrations
- PostgreSQL database
- React 19 (UI library)
- Tailwind CSS v4 (styling)
- shadcn/ui (components)
- Socket.IO (real-time, with `@socket.io/bun-engine`)

---

## Phase Overview

| Phase | Focus | Tasks | Strategy | Time (Seq) | Time (Par) |
|-------|-------|-------|----------|-----------|-----------|
| 1 | Database Foundation | 1 | Sequential | 4h | 4h |
| 2 | Authentication Layer | 1 | Sequential | 7h | 7h |
| 3 | Business Logic Foundation | 2 | **Parallel** | 9h | 5h |
| 4 | Services Layer | 1 | Sequential | 6h | 6h |
| 5 | API Layer | 1 | Sequential | 6h | 6h |
| 6 | UI Layer | 4 | **Parallel** | 23h | 7h |
| 7 | Real-Time Layer | 1 | Sequential | 6h | 6h |
| **Total** | | **11** | | **55h** | **39h** |

---

## Detailed Phase Breakdown

### Phase 1: Database Foundation (4h)

**Strategy**: Sequential (single task)
**Dependencies**: None
**Files**: Prisma schema + migrations

**Task 1**: Database Schema & Prisma Setup
- Copy `prisma/schema.prisma` from source
- Copy all migrations from `prisma/migrations/`
- Run migrations against new database
- Verify schema integrity

**Critical**: Database must be set up first as all other phases depend on it.

**See**: [plan-phase1.md](./plan-phase1.md)

---

### Phase 2: Authentication Layer (7h)

**Strategy**: Sequential (single task)
**Dependencies**: Phase 1 (requires User, Account, VerificationToken models)
**Files**: Better-Auth config, oRPC context

**Task 2**: Better-Auth Integration
- Install `better-auth` and `resend` packages
- Configure Better-Auth with magic link plugin
- Implement admin role assignment via `ADMIN_EMAILS` env var
- Create oRPC context with authenticated session
- Set up email sending via Resend

**Critical**: Authentication is required for protected routes in all subsequent phases.

**See**: [plan-phase2.md](./plan-phase2.md)

---

### Phase 3: Business Logic Foundation (5h parallel, 9h sequential)

**Strategy**: **Parallel** (2 independent tasks)
**Dependencies**: Phase 1 (models use Prisma client)
**Files**: 9 model files + core utilities

**Task 3**: Models Layer (4-5h)
- Copy 9 model files from source
- Update Prisma client imports to `@/db`
- Framework-agnostic data access layer

**Task 6**: Core Utilities & Patterns (3-4h)
- Install utility packages (sonner, ts-pattern, date-fns, wtf_wikipedia)
- Copy centralized routes helper
- Configure Sonner toast provider

**Parallel Execution**: These tasks have no dependencies on each other. Task 3 imports Prisma client, Task 6 imports nothing from the codebase.

**Time Savings**: 4 hours (44%)

**See**: [plan-phase3.md](./plan-phase3.md)

---

### Phase 4: Services Layer (6h)

**Strategy**: Sequential (single task)
**Dependencies**: Phase 3 (services import models)
**Files**: 7 service files + 9 Zod schemas

**Task 4**: Services Layer & Schemas
- Copy 7 service files (admin, category, event, game, leaderboard, pick, wikipedia-import)
- Copy 9 Zod schema files (input validation)
- Remove Next.js-specific code (`"use server"`, `next-safe-action`)
- Ensure services only import models (never Prisma directly)

**Critical**: Services provide business logic for oRPC procedures in Phase 5.

**See**: [plan-phase4.md](./plan-phase4.md)

---

### Phase 5: API Layer (6h)

**Strategy**: Sequential (single task)
**Dependencies**: Phase 4 (oRPC procedures call services)
**Files**: 10 oRPC router files + index

**Task 5**: oRPC Router Layer
- Create 10 domain routers (game, pick, event, category, nomination, admin, leaderboard, work, person, auth)
- Map existing Server Actions to oRPC procedures
- Implement Zod input validation
- Add auth guards (check `context.user`)
- Add admin guards (check `context.user.role === 'ADMIN'`)

**Critical**: This is the API surface that all UI routes will call.

**See**: [plan-phase5.md](./plan-phase5.md)

---

### Phase 6: UI Layer (7h parallel, 23h sequential)

**Strategy**: **Parallel** (4 independent route groups)
**Dependencies**: Phase 5 (routes call oRPC procedures)
**Files**: 25 route files + components

**Task 7**: Public & Auth Routes (4-5h)
- Homepage, sign-in, signup, magic link callback, join game
- No authentication required

**Task 8**: User Routes - Dashboard & Game (6-7h)
- Dashboard (list games)
- Pick wizard (multi-step predictions)
- Leaderboard (view scores)
- Requires auth guard in `beforeLoad`

**Task 9**: Admin Core Routes - Events & Games (6-7h)
- Event CRUD (create/edit events, categories, nominations)
- Game CRUD (create/edit games)
- Live ceremony controls (mark winners)
- Requires admin role guard

**Task 10**: Admin Resource Routes - Works & People (4-5h)
- Works library management (films, albums, etc.)
- People library management
- Wikipedia import tool
- Requires admin role guard

**Parallel Execution**: All 4 tasks call oRPC procedures but have no interdependencies. Each route group operates independently.

**Time Savings**: 16 hours (70%)

**See**: [plan-phase6.md](./plan-phase6.md)

---

### Phase 7: Real-Time Layer (6h)

**Strategy**: Sequential (single task)
**Dependencies**: Phase 5 (services emit WebSocket events), Phase 3 (WebSocket validates users via models)
**Files**: Production server, dev server, WebSocket logic, client hook

**Task 11**: WebSocket Server Integration
- Install `socket.io`, `socket.io-client`, `@socket.io/bun-engine`
- Create production `server.ts` with Bun + Socket.IO integration
- Create development `dev-socket.ts` (separate process)
- Port WebSocket server logic (connection validation, room management)
- Port WebSocket events and types
- Create client-side Socket.IO hook

**Critical**: Required for real-time leaderboard updates during live ceremonies.

**IMPORTANT**: Must use `@socket.io/bun-engine` (NOT standard Socket.IO) for Bun runtime.

**See**: [plan-phase7.md](./plan-phase7.md)

---

## Execution Strategies

### Option 1: Full Sequential Execution

Execute phases 1-7 in order, one task at a time.

**Pros**:
- Simple, linear workflow
- Easy to track progress
- No git branch complexity

**Cons**:
- Takes 55 hours
- No parallelization benefits

**Best for**: Single developer, learning the migration process

---

### Option 2: Parallel Execution with git-spice

Use git worktrees and stacked branches for parallel tasks.

**Pros**:
- Saves 16 hours (29% faster)
- Parallel tasks isolated in separate worktrees
- Uses git-spice for stacked PR workflow

**Cons**:
- More complex git workflow
- Requires git-spice CLI installed
- Potential merge conflicts

**Best for**: Team of 2-4 developers, experienced with git worktrees

**Parallel Phases**:
- **Phase 3**: Tasks 3 and 6 (save 4 hours)
- **Phase 6**: Tasks 7, 8, 9, 10 (save 16 hours)

**Setup**:
```bash
# Install git-spice
brew install git-spice

# Create stack for Phase 3
gs branch create phase3-models
gs branch create phase3-utilities --onto phase3-models

# Create worktrees
git worktree add ../bignight.party-vite-models phase3-models
git worktree add ../bignight.party-vite-utils phase3-utilities

# Work in parallel
cd ../bignight.party-vite-models
# ... implement Task 3

cd ../bignight.party-vite-utils
# ... implement Task 6

# Merge when both complete
gs upstack submit
```

---

### Option 3: Hybrid Approach (Recommended)

Execute Phases 1-5 sequentially (foundation), then parallelize Phase 6 (UI).

**Pros**:
- Parallelizes the longest phase (23h → 7h, saves 16 hours)
- Foundation layers built sequentially (less risk)
- Moderate git complexity

**Cons**:
- Still requires git-spice and worktrees for Phase 6

**Best for**: Small team (2-3 developers) with solid git skills

**Strategy**:
1. Complete Phases 1-5 on main branch (linear)
2. Create 4 stacked branches for Phase 6 tasks
3. Work on all 4 UI route groups in parallel
4. Merge all before starting Phase 7

---

## Task Complexity Legend

- **S** (Small): 1-3 hours
- **M** (Medium): 3-5 hours
- **L** (Large): 5-7 hours
- **XL** (Extra Large): 7+ hours (NONE in this plan)

**Task Complexity Distribution**:
- 0 XL tasks ✓
- 5 L tasks (45%)
- 5 M tasks (45%)
- 0 S tasks (bundled into larger coherent units)

All tasks are PR-sized chunks designed for single work sessions.

---

## Critical Patterns

### 1. Layer Architecture (MANDATORY)

```
UI Routes → oRPC → Services → Models → Prisma
```

**Layer Boundaries**:
- Models can import: Prisma client only
- Services can import: Models, other services
- oRPC routers can import: Services, schemas
- UI routes can import: oRPC client

**Never**:
- Services importing Prisma directly
- UI routes importing Models or Services directly

### 2. Centralized Routes (MANDATORY)

```typescript
// ❌ BAD
redirect("/game/" + gameId + "/pick");

// ✅ GOOD
import { routes } from "@/lib/routes";
redirect(routes.game.pick(gameId));
```

### 3. Auth Guards (MANDATORY)

```typescript
// In route files
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context }) => {
    const session = await getSession(context);
    if (!session) {
      throw redirect({ to: routes.signIn() });
    }
    return { session };
  },
});
```

### 4. ts-pattern for Discriminated Unions (MANDATORY)

```typescript
// ❌ BAD
switch (status) {
  case 'OPEN': return true;
  case 'CLOSED': return false;
}

// ✅ GOOD
import { match } from 'ts-pattern';

return match(status)
  .with('OPEN', () => true)
  .with('CLOSED', () => false)
  .exhaustive(); // Compile error if case missing
```

### 5. Bun Socket.IO Engine (CRITICAL)

```typescript
// ❌ WRONG - Standard Socket.IO doesn't work with Bun
import { Server } from "socket.io";

// ✅ CORRECT - Use Bun-specific engine
import { Server as SocketIOEngine } from "@socket.io/bun-engine";
import { Server as SocketIO } from "socket.io";

const io = new SocketIO();
const engine = new SocketIOEngine({ path: "/socket.io/" });
io.bind(engine);
```

---

## Quality Gates

Each task must pass these gates before moving to the next:

```bash
bun run check-types  # TypeScript compilation
bun run lint         # Biome linting
bun run dev          # Manual testing (where applicable)
```

**Additional Gates**:
- Database tasks: Verify migrations succeed, Prisma client generates
- Auth tasks: Test magic link flow, verify admin role assignment
- UI tasks: Test route navigation, verify loaders fetch data
- WebSocket tasks: Test connection, verify room join and broadcasts

---

## Pre-Execution Checklist

Before starting Phase 1:

- [ ] Target repository scaffolded at `/Users/drewritter/projects/bignight.party-vite`
- [ ] TanStack Start demo app runs successfully
- [ ] Bun installed and working (`bun --version`)
- [ ] PostgreSQL database accessible
- [ ] Source repository available at `/Users/drewritter/projects/bignight.party`
- [ ] Environment variables documented in `.env.example`
- [ ] Git configured for commits
- [ ] (Optional) git-spice installed for parallel execution

---

## Environment Variables

Create `.env.local` in target repository:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bignight_vite

# Better-Auth
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000

# Resend (email)
RESEND_API_KEY=<get from resend.com>
EMAIL_FROM=noreply@bignight.party

# Admin access
ADMIN_EMAILS=admin@example.com,other-admin@example.com

# Socket.IO (development)
SOCKET_IO_URL=http://localhost:3001
```

---

## Success Criteria

The migration is complete when:

- [ ] All 11 tasks completed and quality gates passed
- [ ] User can sign in via magic link
- [ ] User can join a game with access code
- [ ] User can submit picks via wizard
- [ ] Admin can create events, categories, nominations
- [ ] Admin can create games
- [ ] Admin can mark winners during live ceremony
- [ ] Leaderboard updates in real-time when winners revealed
- [ ] Wikipedia import works for films and people
- [ ] All routes navigate correctly
- [ ] No TypeScript errors
- [ ] No console errors in browser

---

## Rollback Strategy

If critical issues arise during migration:

1. **Database**: Restore from backup before migrations
2. **Code**: Revert git commits to last known good state
3. **Dependencies**: Check `package.json` for version conflicts
4. **Environment**: Verify all env vars match `.env.example`

**Common Issues**:
- Socket.IO connection fails → Check `@socket.io/bun-engine` installed
- Auth redirects loop → Check `requireValidatedSession()` usage
- TypeScript errors → Check layer boundaries (no service importing Prisma)
- Route not found → Check centralized routes helper

---

## Next Steps

1. Review this plan and all phase files
2. Choose execution strategy (sequential, parallel, or hybrid)
3. Set up environment variables
4. Start with Phase 1: Database Foundation
5. Execute phases in order, validating quality gates
6. Update task status as you progress

**Good luck with the migration!** 🚀
