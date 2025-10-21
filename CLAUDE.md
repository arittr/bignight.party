# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BigNight.Party is a real-time prediction game for awards shows. Users fill out predictions via a wizard, then watch a live leaderboard update in real-time as winners are revealed during the ceremony. Built with Next.js 15 App Router, Prisma, Auth.js v5, and Socket.io for WebSocket real-time updates.

## Essential Commands

### Development
```bash
# Start development server (Turbopack)
pnpm dev

# Format and lint (runs type checking + Biome formatting)
pnpm lint

# Build for production
pnpm build
```

### Database
```bash
# Start local PostgreSQL (Docker)
pnpm stack:up

# Stop database
pnpm stack:down

# Run migrations
pnpm db:migrate

# Push schema changes without migration
pnpm db:push

# Open Prisma Studio
pnpm db:studio

# Seed database with sample data
pnpm db:seed

# Reset database and run all migrations
pnpm db:reset
```

**Note:** All database commands use `dotenv -e .env.local` to load environment variables from `.env.local` (not `.env`).

## Architecture

### Layered Architecture (MANDATORY)

```
UI Components (RSC) → Server Actions → Services → Models → Prisma
```

**Layer Boundaries** (strictly enforced):

- **Models** (`src/lib/models/`): Prisma queries only, no business logic
  - ✅ Can import: `@prisma/client`, `src/lib/db/prisma`, `src/types/`
  - ❌ Cannot import: Services, Actions, `next/*`

- **Services** (`src/lib/services/`): Business logic and orchestration
  - ✅ Can import: Models, other services, `ts-pattern`, `zod`
  - ❌ Cannot import: `@prisma/client` directly, `next/*`, Actions

- **Actions** (`src/lib/actions/`): Server Actions with validation
  - ✅ Can import: Services, `next-safe-action`, schemas, auth
  - ❌ Cannot import: Models directly, `@prisma/client`

- **UI Components** (`src/app/`, `src/components/`): React Server/Client Components
  - ✅ Can import: Actions (via `useAction` or form `action`), Services (read-only in Server Components)
  - ❌ Cannot import: Models, direct Prisma
  - ❌ Event handlers (onClick, onChange) in Server Components

**Why this matters:** Violating layer boundaries breaks the architecture. Services must call Models (never Prisma directly). Actions must call Services (never Models directly). This separation enables testing, reusability, and maintainability.

### Server/Client Component Boundaries

**Server Components** (default):
- Can be async, fetch data directly
- Can use server actions in form `action` prop
- **Cannot** use onClick, onChange, or React hooks

**Client Components** (require `"use client"`):
- Can use event handlers and React hooks
- **Cannot** be async functions
- Use sparingly for interactivity only

**Pattern: Inline Form Actions** (for simple mutations without redirects):
```typescript
<form action={async (formData: FormData) => {
  "use server";
  const title = formData.get("title");
  await updateAction({ id, title: title as string });
  // NO redirect() here
}}>
```

**Pattern: Standalone Server Actions** (for redirects):
```typescript
async function handleDelete() {
  "use server";
  await deleteAction({ id });
  redirect("/list"); // ✅ redirect() in standalone function only
}
```

**Why this matters:** Next.js redirect() must be at the top level of a server action. Inline form actions cannot reliably handle redirects.

## Mandatory Patterns

### 1. Async params and searchParams (Next.js 15)

**IMPORTANT:** Next.js 15 breaking change - `params` and `searchParams` are now Promises and MUST be awaited:

```typescript
// ❌ BAD - Synchronous access (Next.js 15 error)
type Props = {
  params: { id: string };
};

export default async function EventDetailPage({ params }: Props) {
  const event = await eventModel.findById(params.id); // ERROR!
  return <div>{event.name}</div>;
}

// ✅ GOOD - Await params before accessing
type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await eventModel.findById(id);
  return <div>{event.name}</div>;
}
```

**For searchParams:**
```typescript
// ✅ GOOD - Await searchParams before accessing
type Props = {
  searchParams: Promise<{ category?: string }>;
};

export default async function PicksPage({ searchParams }: Props) {
  const { category } = await searchParams;
  return <div>Category: {category}</div>;
}
```

**For Client Components:**
Use `React.use()` instead of `await`:
```typescript
"use client";
import { use } from "react";

type Props = {
  params: Promise<{ id: string }>;
};

export default function GameClient({ params }: Props) {
  const { id } = use(params);
  return <div>Game: {id}</div>;
}
```

**Why:** Enables better static/dynamic rendering optimization. Synchronous access causes runtime errors in Next.js 15.

**See:** `docs/constitutions/current/patterns.md` for complete examples and migration guide.

### 2. Centralized Routes for ALL Navigation

**Never** hardcode route strings. Always use `src/lib/routes.ts`:

```typescript
// ❌ BAD
redirect("/game/" + gameId + "/pick");
router.push(`/admin/events/${eventId}`);

// ✅ GOOD
import { routes } from "@/lib/routes";
redirect(routes.game.pick(gameId));
router.push(routes.admin.events.detail(eventId));
```

**Why:** Single source of truth, type-safe parameters, easy refactoring, no typos.

### 3. requireValidatedSession() for ALL Protected Routes

**IMPORTANT:** Due to Edge runtime constraints, use `requireValidatedSession()` instead of raw `auth()`:

```typescript
// ❌ BAD - Missing database validation
const session = await auth();
if (!session?.user?.id) {
  redirect("/sign-in"); // Stale JWTs can pass!
}

// ✅ GOOD - Validates JWT + user exists in database
import { requireValidatedSession } from "@/lib/auth/config";
const session = await requireValidatedSession();
// If we get here, user is authenticated AND exists in DB
```

**Why this matters:**
- **Edge runtime constraint**: Middleware runs in Edge runtime, cannot query database
- **Two-layer validation**: Middleware validates JWT signature, pages validate user exists
- **Stale JWT protection**: User deleted from DB but JWT still valid = security issue
- **Redirect loop prevention**: Clears JWT when user doesn't exist

**Pattern:**
```typescript
// Layouts and pages
import { requireValidatedSession } from "@/lib/auth/config";

export default async function ProtectedPage() {
  const session = await requireValidatedSession();

  // Optional: Business logic authorization
  const isMember = await gameParticipantModel.exists(session.user.id, gameId);
  if (!isMember) {
    redirect(routes.dashboard()); // Business check, not auth
  }
}
```

**See:** `docs/constitutions/current/patterns.md` for complete details on Edge runtime authentication.

### 4. next-safe-action for ALL Server Actions

```typescript
// src/lib/actions/safe-action.ts
export const action = createSafeActionClient()
export const authenticatedAction = createSafeActionClient({ /* auth middleware */ })
export const adminAction = createSafeActionClient({ /* admin middleware */ })

// Usage
export const submitPickAction = authenticatedAction
  .schema(pickSchema)
  .action(async ({ parsedInput, ctx }) => {
    return pickService.submitPick(ctx.userId, parsedInput)
  })
```

**Never** create raw server actions without validation. All actions must use next-safe-action with Zod schemas.

### 5. ts-pattern for ALL Discriminated Unions

```typescript
import { match } from 'ts-pattern'

return match(event.status)
  .with('SETUP', () => false)
  .with('OPEN', () => true)
  .with('LIVE', () => false)
  .with('COMPLETED', () => false)
  .exhaustive() // ✅ Compile error if case missing
```

**Never** use switch statements on discriminated unions. Always use ts-pattern with `.exhaustive()` to ensure all cases are handled.

### 6. Zod Schemas for All Inputs

All Zod schemas live in `src/schemas/`. Server actions validate inputs using these schemas via next-safe-action.

### 7. Proper Typing (Avoid Type Assertions)

**Never** use `as` for type assertions without validation:

```typescript
// ❌ BAD
const title = formData.get("title") as string;
const year = formData.get("year") as number;

// ✅ GOOD - Validate with Zod
const validated = schema.parse({
  title: formData.get("title"),
  year: formData.get("year"),
});

// ✅ GOOD - Type guard
if (typeof value !== "string") throw new Error("Invalid type");
```

**Why:** Type assertions bypass TypeScript's safety. Use Zod validation or type guards instead. The only acceptable uses of `as` are:
- `as const` for readonly values
- After Zod validation when narrowing to subtypes
- External library types that return `any`

## Authentication & Authorization

### Admin Access

Admins are designated via the `ADMIN_EMAILS` environment variable (comma-separated):

```bash
# .env.local
ADMIN_EMAILS=admin@example.com,other-admin@example.com
```

The JWT callback in `src/lib/auth/config.ts` assigns the ADMIN role if the user's email is in this list. Admin routes are protected by:
1. Middleware (checks authentication)
2. Layout (checks ADMIN role)

**Why this matters:** Admin access is configured via environment variables, not hardcoded. Always update `.env.local` to test admin features.

## Database Schema

### Event vs Game Separation

- **Event**: The actual awards show (e.g., "97th Academy Awards 2025")
  - Has categories, nominations, winners
  - Can be reused across multiple games
  - Admin manages via `/admin/events`

- **Game**: A prediction game for a specific event
  - Users join with access code
  - Users submit picks
  - Has picks lock time and status (SETUP → OPEN → LIVE → COMPLETED)
  - Admin manages via `/admin/games`

**Why this matters:** A single event (Oscars 2025) can have multiple independent games (friend group game, work game, public game). Don't conflate them.

### Key Models

- **User**: Email-based authentication, role (USER or ADMIN)
- **Game**: Status machine (SETUP → OPEN → LIVE → COMPLETED)
- **Category**: Point values stored here (not on nominations)
- **Nomination**: Can be for Person OR Work (polymorphic via workId/personId)
- **Pick**: User's prediction for a category in a game

## Project-Specific Workflows

### Custom Slash Commands

This project has custom Claude Code slash commands:

- `/spec` - Generate a lean feature specification using brainstorming
- `/plan` - Decompose spec into executable plan with sequential/parallel phases
- `/execute` - Execute implementation plan with git-spice stacking and worktrees

**Usage:** `/execute @specs/my-feature/plan.md` will automatically create git-spice stacked branches and use git worktrees for parallel task isolation.

### Git Workflow

This project uses **git-spice** for stacked branch management:

```bash
# Create new branch in stack
gs branch create feature-name

# Stack branch on top of another
gs upstack onto branch-name

# View stack
gs log short
```

**Why this matters:** Features are implemented as stacked branches that get merged sequentially. Don't use regular `git checkout -b`.

## Constitution

This project maintains a **versioned constitution** at `docs/constitutions/current/` (symlink to latest version). The constitution contains:

- **architecture.md**: Layer boundaries, project structure, security patterns
- **patterns.md**: Mandatory patterns (next-safe-action, ts-pattern, Server/Client boundaries)
- **schema-rules.md**: Database design philosophy and Prisma conventions
- **tech-stack.md**: Approved libraries and versions
- **testing.md**: TDD requirements

**When in doubt about patterns, check the constitution first.** It documents proven patterns from production implementation.

## Real-Time Architecture

The app uses Socket.io for real-time updates:

- Admin marks winner → Service emits WebSocket event → All clients update leaderboard
- Events are namespaced by game ID
- Reactions are in-memory only (no DB persistence)

**Pattern:** Services emit events, NOT actions. Keep WebSocket logic in the service layer.

## Common Pitfalls

1. **Don't access params/searchParams synchronously** - Always await params/searchParams in Next.js 15 (use `React.use()` in Client Components)
2. **Don't hardcode route strings** - Always use routes from `src/lib/routes.ts`
3. **Don't use raw auth() in protected routes** - Always use `requireValidatedSession()` for stale JWT protection
4. **Don't use type assertions (`as`)** - Use Zod validation or type guards instead
5. **Don't import Prisma in services** - Services call models, never Prisma directly
6. **Don't use switch on discriminated unions** - Always use ts-pattern with .exhaustive()
7. **Don't put business logic in models** - Models are data access only
8. **Don't put event handlers in Server Components** - Extract to client components
9. **Don't call redirect() in inline form actions** - Use standalone server action functions
10. **Don't skip next-safe-action** - All server actions must use it
11. **Don't forget ADMIN_EMAILS** - Admin routes won't work without it in .env.local

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bignight
AUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
RESEND_API_KEY=<get from resend.com>
EMAIL_FROM=noreply@yourdomain.com
ADMIN_EMAILS=your-email@example.com
```

**Start local database:** `pnpm stack:up`
**Run migrations:** `pnpm db:migrate`
**Seed data:** `pnpm db:seed`

## Key Files to Reference

- `docs/constitutions/current/` - Architecture patterns and mandatory practices
- `prisma/schema.prisma` - Database schema
- `src/lib/routes.ts` - Centralized route definitions (use for ALL navigation)
- `src/lib/actions/safe-action.ts` - Server action client setup
- `src/lib/auth/config.ts` - Auth.js configuration with admin role assignment
- `src/middleware.ts` - Route protection and authentication
- `.claude/commands/` - Custom slash command definitions
