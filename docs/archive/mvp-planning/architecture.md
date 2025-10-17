# Architecture & Technical Design

## Technology Stack

### Frontend
- **Next.js 15** - App Router with React Server Components
- **React 19** - Latest React features
- **TypeScript 5** - Strict type checking
- **Tailwind CSS v4** - Utility-first styling
- **Zod** - Runtime validation and type inference
- **ts-pattern** - Exhaustive pattern matching

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **next-safe-action** - Type-safe server actions with validation
- **Prisma** - Type-safe ORM with PostgreSQL
- **Auth.js v5** - Magic link authentication
- **Socket.io** - Real-time WebSocket communication

### Infrastructure
- **PostgreSQL** - Relational database
  - Local: Docker container
  - Production: Neon serverless Postgres
- **Resend** - Transactional email delivery
- **Vercel** - Hosting and deployment

### Development Tools
- **Biome** - Fast linter and formatter
- **Husky** - Git hooks for pre-commit linting
- **pnpm** - Fast, disk-efficient package manager

---

## Architecture Principles

### 1. Layered Architecture

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

**Layer Responsibilities:**

- **UI Components**: React components, forms, displays
- **Server Actions**: Entry points for mutations, auth checks
- **Services**: Business logic, orchestration, WebSocket events
- **Models**: Database queries, data transformation
- **Prisma**: Type-safe database access

### 2. Type Safety End-to-End

- Prisma generates TypeScript types from schema
- Zod schemas for runtime validation
- Shared types in `src/types/` for client/server
- No `any` types (enforced by Biome)

### 3. Real-Time Event Architecture

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

### 4. Safe Architecture Patterns

**Enforced throughout the codebase:**

- **ts-pattern** for exhaustive pattern matching
- **next-safe-action** for type-safe server actions
- No switch statements for discriminated unions
- All server actions validated and typed

**Why:**
- Compile-time safety for all code paths
- Automatic type narrowing
- Runtime validation built-in
- Impossible to forget error handling

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
├── specs/                # Documentation
└── docker-compose.yml    # Local PostgreSQL
```

---

## Key Design Decisions

### Authentication: Auth.js with Magic Links

**Why:**
- Built-in magic link provider
- Prisma adapter out of the box
- Session management handled
- Industry-standard security

**Implementation:**
```typescript
// src/lib/auth/config.ts
export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      from: 'game@bignight.party',
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.role = user.role
      return session
    },
  },
}
```

### Real-Time: Socket.io

**Why:**
- Bidirectional communication (needed for reactions)
- Automatic reconnection
- Room support for event isolation
- Fallback to polling if WebSockets blocked

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

### Server Actions: next-safe-action

**Why:**
- Type-safe server actions with automatic validation
- Built-in Zod integration
- Middleware support (auth, rate limiting)
- Input/output type inference
- Consistent error handling

**Example:**
```typescript
// lib/actions/pick-actions.ts
import { createSafeActionClient } from 'next-safe-action'
import { pickSchema } from '@/schemas/pick-schema'

// Create authenticated action client
const action = createSafeActionClient({
  async middleware() {
    const session = await auth()
    if (!session) throw new Error('Unauthorized')
    return { userId: session.user.id }
  },
})

// Type-safe server action with validation
export const submitPickAction = action
  .schema(pickSchema)
  .action(async ({ parsedInput, ctx }) => {
    return pickService.submitPick(ctx.userId, parsedInput)
  })

// Usage in component (fully typed!)
const { execute, status, data } = useAction(submitPickAction)
await execute({ categoryId: '123', nomineeId: '456' })
```

### Pattern Matching: ts-pattern

**Why:**
- Exhaustive matching (compiler ensures all cases handled)
- Type narrowing works automatically
- More expressive than switch/if-else
- Perfect for state machines and discriminated unions

**Example:**
```typescript
import { match } from 'ts-pattern'

// Event status state machine
export function canSubmitPicks(event: Event): boolean {
  return match(event.status)
    .with('SETUP', () => false)
    .with('OPEN', () => new Date() < event.picksLockAt)
    .with('LIVE', () => false)
    .with('COMPLETED', () => false)
    .exhaustive() // Compile error if any status missing!
}

// WebSocket event handling
socket.on('message', (msg) => {
  match(msg)
    .with({ type: 'PICK_SUBMITTED' }, (data) => {
      // data.type is narrowed to 'PICK_SUBMITTED'
      handlePickSubmit(data.userId, data.pickId)
    })
    .with({ type: 'CATEGORY_REVEALED' }, (data) => {
      // data.type is narrowed to 'CATEGORY_REVEALED'
      updateLeaderboard(data.categoryId)
    })
    .with({ type: 'REACTION_SENT' }, (data) => {
      // data.type is narrowed to 'REACTION_SENT'
      broadcastReaction(data.emoji, data.userId)
    })
    .exhaustive()
})

// Error handling with results
type Result<T, E> = { success: true; data: T } | { success: false; error: E }

function handleResult<T>(result: Result<T, Error>) {
  return match(result)
    .with({ success: true }, ({ data }) => {
      // TypeScript knows data exists here
      return data
    })
    .with({ success: false }, ({ error }) => {
      // TypeScript knows error exists here
      throw error
    })
    .exhaustive()
}
```

### Data Access: Model/Service Pattern

**Why:**
- Clear separation of concerns
- Easier testing (mock model layer)
- Business logic isolated from DB queries
- Reusable across Server Actions and WebSockets

**Example:**
```typescript
// models/pick.ts
export async function createPick(data: PickData) {
  return prisma.pick.create({ data })
}

// services/pick-service.ts
export async function submitPick(userId: string, pickData: PickInput) {
  // Use ts-pattern for validation
  const event = await eventModel.findById(pickData.eventId)

  const isAllowed = match(event.status)
    .with('OPEN', () => new Date() < event.picksLockAt)
    .otherwise(() => false)

  if (!isAllowed) {
    throw new Error('Picks are closed')
  }

  // Create pick
  const pick = await pickModel.createPick({
    userId,
    ...pickData,
  })

  // Emit event
  socketServer.to(pickData.eventId).emit('pick:submitted')

  return pick
}
```

### State Management: React Server Components + URL State

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

## Database Design Philosophy

### Event-Driven Schema
- `Event` as top-level entity supports multi-show future
- `isRevealed` flag enables incremental reveals
- `status` enum tracks game lifecycle

### Referential Integrity
- Foreign keys with cascading deletes
- Unique constraints prevent duplicate picks
- Indexes on foreign keys for query performance

### Future-Proof
- Schema supports multiple events without migration
- User accounts persist across years
- Can add historical stats without schema changes

---

## Security Considerations

### Authentication
- Magic links expire after 10 minutes
- Session tokens stored in HTTP-only cookies
- CSRF protection on all mutations

### Authorization
- Middleware checks authentication on protected routes
- Role-based access control (USER vs ADMIN)
- Server Actions validate user permissions

### Data Validation
- Zod schemas validate all inputs
- Database constraints enforce data integrity
- No raw SQL queries (Prisma only)

### Rate Limiting
- Email sending rate limited
- WebSocket connection limits
- API route rate limiting (TODO)

---

## Architecture Enforcement

### Mandatory Patterns

**These patterns must be used throughout the codebase:**

1. **All Server Actions = next-safe-action**
   - No raw `"use server"` functions
   - All actions must use `createSafeActionClient()`
   - All inputs validated with Zod schemas

2. **All Discriminated Unions = ts-pattern**
   - No switch statements on union types
   - No if-else chains for status/type checking
   - Use `.exhaustive()` to ensure all cases handled

3. **All Service Layer = Pure Business Logic**
   - Services must not import from `next/*`
   - Services must not access `req`/`res` directly
   - Services must be testable without Next.js runtime

4. **All Models = Pure Data Access**
   - Models only import Prisma client
   - Models must not contain business logic
   - Models must return Prisma types (not transformed data)

### Prohibited Patterns

**These patterns are explicitly forbidden:**

- ❌ Switch statements on discriminated unions
- ❌ Raw server actions without validation
- ❌ Prisma queries in service layer
- ❌ Business logic in model layer
- ❌ Direct database access from actions
- ❌ `any` type anywhere (enforced by Biome)

### Code Review Checklist

Before merging, verify:

- [ ] All server actions use `next-safe-action`
- [ ] All Zod schemas defined in `src/schemas/`
- [ ] All pattern matching uses `ts-pattern`
- [ ] All `.exhaustive()` called on matches
- [ ] No Prisma imports outside `src/lib/models/`
- [ ] All layers respect boundaries

---

## Performance Optimizations

### Database
- Indexes on foreign keys and query filters
- Connection pooling via Prisma
- Prepared statements prevent SQL injection

### Real-Time
- WebSocket rooms isolate events
- Selective updates (only changed data)
- Debounce rapid updates

### Caching
- Static generation for public pages
- Server Component caching
- React cache() for deduplication

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

## Testing Strategy (Future)

### Unit Tests
- Model layer (data access)
- Service layer (business logic)
- Utility functions

### Integration Tests
- Server Actions end-to-end
- WebSocket event handling
- Database transactions

### E2E Tests
- User pick flow
- Admin workflow
- Real-time updates

**Tools:** Vitest, Playwright
