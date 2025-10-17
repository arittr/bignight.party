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
- ✅ Actions (via `useAction`)
- ✅ Server Components can import services (read-only)
- ✅ Client Components for interactivity
- ❌ Models
- ❌ Direct Prisma

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
- Middleware checks authentication on protected routes
- Role-based access control (USER vs ADMIN)
- Server Actions validate user permissions
- Context from middleware includes userId and role

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

# Admin
ADMIN_EMAILS=admin@example.com
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
