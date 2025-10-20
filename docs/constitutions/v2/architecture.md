# Architecture

## Layered Architecture

```
┌─────────────────────────────────────┐
│        UI Components (RSC)          │
├─────────────────────────────────────┤
│       Server Actions / API          │
├─────────────────────────────────────┤
│       Services (Business Logic)     │
├─────────────────────────────────────┤
│       Models (Data Access)          │
├─────────────────────────────────────┤
│       Prisma + PostgreSQL           │
└─────────────────────────────────────┘
```

## Layer Responsibilities

### UI Components
- React Server Components and Client Components
- Forms, displays, user interactions
- Call Server Actions for mutations
- Subscribe to WebSocket events for real-time updates

### Server Actions
- Entry points for mutations
- Authentication and authorization checks
- Input validation with Zod schemas
- Call Service layer for business logic
- **Must use**: `next-safe-action` (see patterns.md)

### Services
- Business logic and orchestration
- Coordinate between multiple models
- Emit WebSocket events
- Pure TypeScript - no Next.js dependencies
- **Must NOT**: Import `@prisma/client` directly
- **Must use**: ts-pattern for state machines (see patterns.md)

### Models
- Data access layer
- Prisma queries only
- Type-safe database operations
- No business logic
- **Must NOT**: Import anything except Prisma client

### Database
- PostgreSQL via Prisma
- Type-safe queries
- Referential integrity enforced
- Migration-based schema evolution

---

## Layer Boundaries

### What Each Layer Can Import

**Models** (`src/lib/models/`):
- ✅ `@prisma/client`
- ✅ `src/lib/db/prisma`
- ✅ `src/types/`
- ❌ Services
- ❌ Actions
- ❌ `next/*`
- ❌ Business logic

**Services** (`src/lib/services/`):
- ✅ Models
- ✅ Other services
- ✅ `src/types/`
- ✅ `ts-pattern`
- ✅ `zod`
- ✅ WebSocket emits
- ❌ `@prisma/client` directly
- ❌ `next/*`
- ❌ Actions

**Actions** (`src/lib/actions/`):
- ✅ Services
- ✅ `next-safe-action`
- ✅ Schemas (`src/schemas/`)
- ✅ Auth
- ❌ Models directly
- ❌ `@prisma/client`

**UI Components** (`src/components/`, `src/app/`):
- ✅ Actions (via `useAction` in Client Components, or form `action` in Server Components)
- ✅ Server Components can import services (read-only)
- ✅ Client Components for interactivity ("use client" directive required)
- ❌ Models
- ❌ Direct Prisma
- ❌ Event handlers in Server Components (see patterns.md)

---

## Project Structure

```
bignight.party/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Migration history
├── src/
│   ├── app/
│   │   ├── (auth)/        # Auth pages (sign-in)
│   │   ├── (game)/        # Protected game routes
│   │   │   ├── picks/     # Pick wizard
│   │   │   ├── leaderboard/
│   │   │   └── dashboard/ # User dashboard
│   │   ├── (admin)/       # Admin routes
│   │   │   ├── events/
│   │   │   ├── categories/
│   │   │   └── live/      # Live admin controls
│   │   └── api/
│   │       └── auth/      # Auth.js handler
│   ├── components/
│   │   ├── ui/           # Reusable UI components
│   │   ├── game/         # Game-specific components
│   │   └── admin/        # Admin components
│   ├── lib/
│   │   ├── actions/      # Server Actions
│   │   │   ├── pick-actions.ts
│   │   │   ├── admin-actions.ts
│   │   │   └── auth-actions.ts
│   │   ├── auth/
│   │   │   └── config.ts # Auth.js configuration
│   │   ├── db/
│   │   │   └── prisma.ts # Prisma client singleton
│   │   ├── models/       # Data access layer
│   │   │   ├── user.ts
│   │   │   ├── event.ts
│   │   │   ├── category.ts
│   │   │   ├── nominee.ts
│   │   │   └── pick.ts
│   │   ├── services/     # Business logic
│   │   │   ├── pick-service.ts
│   │   │   ├── scoring-service.ts
│   │   │   └── event-service.ts
│   │   └── websocket/
│   │       ├── server.ts # Socket.io setup
│   │       └── events.ts # Event definitions
│   ├── schemas/          # Zod validation schemas
│   │   ├── pick-schema.ts
│   │   ├── category-schema.ts
│   │   └── event-schema.ts
│   └── types/            # TypeScript types
│       ├── game.ts
│       ├── leaderboard.ts
│       └── websocket.ts
├── docs/
│   └── constitutions/    # This file
└── specs/                # Feature specs and planning
```

---

## Architecture Principles

### 1. Type Safety End-to-End
- Prisma generates TypeScript types from schema
- Zod schemas for runtime validation
- Shared types in `src/types/` for client/server
- No `any` types (enforced by Biome)
- Compiler catches errors at build time

### 2. Real-Time Event Architecture

```
Admin marks winner
  ↓
Server Action validates
  ↓
Service updates database
  ↓
Service emits WebSocket event
  ↓
All connected clients receive update
  ↓
Clients update leaderboard UI
```

**WebSocket Events:**
```typescript
// Server → Client
'leaderboard:update' - New scores available
'category:revealed' - Category winner revealed
'reaction:new' - User sent emoji reaction

// Client → Server
'reaction:send' - User sends reaction
'heartbeat' - Keep connection alive
```

### 3. State Management: React Server Components + URL State

**Why:**
- No client-side state library needed
- URL as source of truth for navigation
- React Server Components for data fetching
- Use client components only for interactivity

**Approach:**
- Search params for wizard step: `/picks?category=3`
- Server Components fetch data on each navigation
- Client components for forms, WebSocket listeners
- Optimistic updates for better UX

---

## Security Architecture

### Authentication
- Magic links expire after 10 minutes
- Session tokens stored in HTTP-only cookies
- CSRF protection on all mutations
- Auth.js v5 handles session management

### Authorization

**Middleware Protection (MANDATORY):**

All authentication redirects MUST happen in middleware (`src/middleware.ts`), NOT in individual pages.

**Why:**
- Centralized auth logic (single source of truth)
- Runs before page even loads (faster)
- No duplication across pages
- Follows Next.js best practices

**Pattern:**
```typescript
// src/middleware.ts
import { auth } from "@/lib/auth/config";
import { protectedRoutePrefixes } from "@/lib/routes";

export default auth((req) => {
  const isAuthenticated = !!req.auth;

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutePrefixes.some((prefix) =>
    req.nextUrl.pathname.startsWith(prefix)
  );

  // Redirect unauthenticated users to sign-in
  if (!isProtectedRoute && isProtectedRoute) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
});
```

**Pages should NOT check auth:**
```typescript
// ❌ BAD - Don't do auth checks in pages
export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in"); // Middleware should handle this!
  }
  // ...
}
```

**Exception: Business Logic Checks**
Pages CAN check authorization for business logic (not authentication):
```typescript
// ✅ GOOD - Business logic checks in pages
export default async function PickWizardPage({ params }) {
  const session = await auth(); // Already know user is authenticated

  // Check if user is a member of THIS specific game
  const isMember = await gameParticipantModel.exists(session.user.id, gameId);
  if (!isMember) {
    redirect(routes.dashboard()); // Business logic, not auth
  }
}
```

**Role-Based Access Control:**
- Middleware checks authentication on protected routes
- Role-based access control (USER vs ADMIN)
- Server Actions validate user permissions
- Context from middleware includes userId and role

**Admin Role Assignment:**
```typescript
// src/lib/auth/config.ts
export const authOptions: NextAuthConfig = {
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;

        // Assign ADMIN role if email is in ADMIN_EMAILS env var
        const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
        token.role = adminEmails.includes(user.email) ? 'ADMIN' : 'USER';
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
```

**Environment Variable:**
```bash
# .env.local
ADMIN_EMAILS=admin@example.com,other-admin@example.com
```

**Layout Protection:**
```typescript
// src/app/(admin)/layout.tsx
export default async function AdminLayout({ children }) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  return <div>{children}</div>;
}
```

**Why this pattern:**
- Environment variable makes admin access configurable without code changes
- JWT callback ensures role is in session token (no extra DB queries)
- Layout enforces authorization at route group level
- Middleware ensures authentication before layout runs

### Data Validation
- Zod schemas validate all inputs
- Database constraints enforce data integrity
- No raw SQL queries (Prisma only)
- Type-safe queries prevent SQL injection

### Rate Limiting
- Email sending rate limited
- WebSocket connection limits
- API route rate limiting (TODO)

---

## Performance Architecture

### Database
- Indexes on foreign keys and query filters
- Connection pooling via Prisma
- Prepared statements prevent SQL injection
- Composite indexes for leaderboard queries

### Real-Time
- WebSocket rooms isolate events
- Selective updates (only changed data)
- Debounce rapid updates
- In-memory reactions (no DB persistence)

### Caching
- Static generation for public pages
- Server Component caching
- React cache() for deduplication
- Prisma query result caching

---

## Deployment Architecture

### Production Environment

```
┌─────────────┐
│   Vercel    │  - Next.js hosting
│  (Edge)     │  - Serverless functions
└──────┬──────┘  - WebSocket server
       │
       ├──────────┐
       │          │
┌──────▼──────┐  │
│    Neon     │  │  - PostgreSQL database
│  (Postgres) │  │  - Serverless + autoscaling
└─────────────┘  │
                 │
         ┌───────▼──────┐
         │   Resend     │  - Email delivery
         │              │  - Magic links
         └──────────────┘
```

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...

# Auth
AUTH_SECRET=random-secret
NEXTAUTH_URL=https://bignight.party

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=game@bignight.party

# Admin (comma-separated list of admin emails)
ADMIN_EMAILS=admin@example.com,other-admin@example.com
```

---

## Architecture Enforcement

### Code Review Checklist

Before merging, verify:

- [ ] All server actions use `next-safe-action`
- [ ] All Zod schemas defined in `src/schemas/`
- [ ] All pattern matching uses `ts-pattern`
- [ ] All `.exhaustive()` called on matches
- [ ] No Prisma imports outside `src/lib/models/`
- [ ] All layers respect boundaries
- [ ] No `any` types anywhere
- [ ] Services don't import `next/*`
- [ ] Models contain no business logic

### Prohibited Violations

These patterns are **explicitly forbidden**:

- ❌ Switch statements on discriminated unions
- ❌ Raw server actions without validation
- ❌ Prisma queries in service layer
- ❌ Business logic in model layer
- ❌ Direct database access from actions
- ❌ `any` type anywhere (enforced by Biome)
- ❌ Services importing `next/*`
- ❌ Models importing anything except Prisma

See patterns.md for detailed examples and migration guides.
