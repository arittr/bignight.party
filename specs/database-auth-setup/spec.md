# Feature: Database & Authentication Setup

**Status**: Draft
**Created**: 2025-10-17

## Overview

This feature establishes the foundational infrastructure for BigNight.Party by setting up PostgreSQL with Docker Compose, implementing the Prisma ORM data layer, and integrating Auth.js v5 for magic link authentication. This is a vertical slice implementation that delivers complete authentication functionality first, with game-related database models added in a future phase.

The implementation follows a two-phase database strategy: Phase 1 (this spec) includes only Auth.js required models and delivers a working authentication system. Phase 2 (future) will add game models (Event, Game, Category, Nominee, Pick) via a new migration.

## Requirements

> **Note**: All features must follow architecture patterns defined in @docs/constitutions/current/

### Functional Requirements

- FR1: Local PostgreSQL database running in Docker container with persistent storage
- FR2: Prisma ORM configured with Auth.js v5 adapter models (User, Account, VerificationToken)
- FR3: Magic link authentication via Resend email provider
- FR4: JWT-based session management (stateless, no Session model)
- FR5: Role-based access control (USER vs ADMIN based on ADMIN_EMAILS env var)
- FR6: Complete authentication flow: sign-in page, email delivery, token verification, session creation
- FR7: Route protection middleware for `/picks`, `/leaderboard`, `/dashboard`, `/admin` routes
- FR8: Sign-out functionality via next-safe-action server action

### Non-Functional Requirements

- NFR1: Database connection pooling via Prisma client singleton pattern
- NFR2: All auth inputs validated with Zod schemas before processing
- NFR3: HTTP-only cookies for JWT storage (XSS protection)
- NFR4: Magic link tokens expire after 10 minutes
- NFR5: Environment variables properly configured with .env.example template
- NFR6: Development experience: single `pnpm dev` command starts everything
- NFR7: Type safety: Prisma generates TypeScript types from schema

## Architecture

> **See**: @docs/constitutions/current/architecture.md for layer boundaries and patterns

### Task-Specific Components

**Database Infrastructure:**
- **New**: `docker-compose.yml` - PostgreSQL 15 container, port 5432, persistent volume
- **New**: `prisma/schema.prisma` - Database schema with Auth.js models
- **New**: `.env.local` - Local environment variables (gitignored)
- **New**: `.env.example` - Environment variable template (committed)

**Data Layer:**
- **New**: `src/lib/db/prisma.ts` - Prisma client singleton (prevents multiple instances in dev)

**Auth Configuration:**
- **New**: `src/lib/auth/config.ts` - Auth.js v5 config with Resend provider, JWT strategy
- **New**: `src/app/api/auth/[...nextauth]/route.ts` - Auth.js API route handler

**Server Actions:**
- **New**: `src/lib/actions/safe-action.ts` - next-safe-action client setup (action, authenticatedAction, adminAction)
- **New**: `src/lib/actions/auth-actions.ts` - Sign-out action using next-safe-action

**Validation Schemas:**
- **New**: `src/schemas/auth-schema.ts` - Zod validation for email input

**UI Components:**
- **New**: `src/app/(auth)/sign-in/page.tsx` - Magic link sign-in page (Server Component with form)

**Middleware:**
- **New**: `src/middleware.ts` - Route protection, authentication checks, redirects

**Files Modified:**
- **None** - This is a greenfield setup with no existing files to modify

### Dependencies

**New packages to install:**

**Production dependencies:**
```bash
pnpm add @prisma/client next-auth@beta @auth/prisma-adapter next-safe-action zod resend ts-pattern
```

- `@prisma/client` (^5.0.0) - Type-safe database client
- `next-auth@beta` (5.0.0-beta.25) - Auth.js v5 for Next.js 15 compatibility
- `@auth/prisma-adapter` (^2.0.0) - Prisma adapter for Auth.js
- `next-safe-action` (^8.0.0) - Type-safe server actions with validation
- `zod` (^3.22.0) - Runtime validation and type inference
- `resend` (^4.0.0) - Email delivery for magic links
- `ts-pattern` (^5.0.0) - Exhaustive pattern matching (for Role enum)

**Development dependencies:**
```bash
pnpm add -D prisma
```

- `prisma` (^5.0.0) - Schema management, migrations, code generation

**Package.json scripts to add:**
```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

### Schema Changes

**New Prisma schema** (Phase 1 - Auth models only):

**Models:**
1. `User` - Core user entity
   - Fields: id (cuid), email (unique), role (USER/ADMIN enum), emailVerified, name, image, createdAt, updatedAt
   - Relations: accounts[], verificationTokens[]

2. `Account` - OAuth provider accounts (Auth.js adapter)
   - Fields: id, userId, type, provider, providerAccountId, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state
   - Relations: user

3. `VerificationToken` - Magic link tokens
   - Fields: identifier (email), token (unique), expires
   - Composite unique: [identifier, token]

**Enums:**
- `Role` - USER, ADMIN

**Indexes:**
- User.email (unique)
- Account.provider + providerAccountId (composite unique)
- VerificationToken.identifier + token (composite unique)
- VerificationToken.token (unique)

**Note**: Session model intentionally omitted - using JWT strategy (stateless sessions)

**Future migration** (Phase 2): Add Event, Game, Category, Nominee, Pick models

### Implementation Order

Based on dependencies, implement in this sequence:

**Phase 1: Database Infrastructure (can't proceed without this)**
1. Create `docker-compose.yml`
2. Create `.env.example` and `.env.local`
3. Start Docker: `docker compose up -d`
4. Verify PostgreSQL is running: `docker ps`

**Phase 2: Prisma Setup (requires Phase 1)**
5. Install Prisma: `pnpm add -D prisma && pnpm add @prisma/client`
6. Initialize: `pnpm prisma init` (or create schema.prisma manually)
7. Define schema models (User, Account, VerificationToken, Role enum)
8. Create Prisma client singleton: `src/lib/db/prisma.ts`
9. Generate client: `pnpm prisma generate`
10. Create migration: `pnpm prisma migrate dev --name init`
11. Verify with Prisma Studio: `pnpm prisma studio`

**Phase 3: Auth.js Configuration (requires Phase 2)**
12. Install Auth.js packages: `pnpm add next-auth@beta @auth/prisma-adapter zod resend`
13. Generate AUTH_SECRET: `openssl rand -base64 32` → add to `.env.local`
14. Create Auth.js config: `src/lib/auth/config.ts`
15. Create API route: `src/app/api/auth/[...nextauth]/route.ts`
16. Test: Visit `/api/auth/signin` and verify provider shows

**Phase 4: Server Actions & Validation (requires Phase 3)**
17. Install: `pnpm add next-safe-action ts-pattern`
18. Create safe-action clients: `src/lib/actions/safe-action.ts`
19. Create auth schema: `src/schemas/auth-schema.ts`
20. Create sign-out action: `src/lib/actions/auth-actions.ts`

**Phase 5: UI & Middleware (requires Phase 4)**
21. Create sign-in page: `src/app/(auth)/sign-in/page.tsx`
22. Create middleware: `src/middleware.ts`
23. Test complete flow: sign-in → receive email → click link → authenticated

**Phase 6: Verification**
24. Manual testing checklist (see Acceptance Criteria)
25. Verify in Prisma Studio that User and VerificationToken records are created
26. Verify JWT cookie is set in browser
27. Verify protected routes redirect to `/sign-in` when unauthenticated

## Data Flow

### Magic Link Authentication Flow

```
1. User visits /sign-in
   ↓
2. Renders Server Component with email form
   ↓
3. User enters email
   ↓
4. Form validates with Zod (auth-schema.ts)
   ↓
5. Submits to /api/auth/signin/resend (Auth.js handler)
   ↓
6. Auth.js:
   - Creates VerificationToken in database (10min expiry)
   - Calls Resend API to send magic link email
   ↓
7. User receives email with link: /api/auth/callback/resend?token=...
   ↓
8. User clicks link → Auth.js callback route
   ↓
9. Auth.js:
   - Verifies token exists in DB and not expired
   - Creates or updates User record
   - Checks if email in ADMIN_EMAILS env var
   - Sets role to ADMIN or USER
   ↓
10. Auth.js creates JWT with { userId, email, role, exp }
    ↓
11. Sets JWT in HTTP-only cookie (encrypted by Auth.js)
    ↓
12. Redirects to /dashboard
```

### Session Management

**JWT Strategy:**
- Stateless tokens (no database queries per request)
- Token encrypted and signed by Auth.js
- HTTP-only cookie (XSS protection)
- Token payload: `{ userId, email, role, exp }`
- Middleware validates JWT on every protected route

**Sign-out:**
- Client calls sign-out server action
- Action uses next-safe-action for type safety
- Clears JWT cookie
- Redirects to `/sign-in`

### Role Assignment

**On sign-in (Auth.js callback):**
```typescript
// In src/lib/auth/config.ts
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.userId = user.id
      token.role = process.env.ADMIN_EMAILS?.split(',').includes(user.email)
        ? 'ADMIN'
        : 'USER'
    }
    return token
  }
}
```

**In middleware:**
```typescript
// Access role from session
const session = await auth()
if (session?.user?.role !== 'ADMIN') {
  return NextResponse.redirect('/dashboard')
}
```

## Error Handling

**Validation Errors:**
- Zod email validation fails → Client-side error message (no form submission)
- Use `useActionState` for progressive enhancement

**Authentication Errors:**
- Magic link expired → Show error: "This link has expired. Please request a new one."
- Invalid token → Redirect to `/sign-in?error=verification`
- Email send failure → Log error, show "Unable to send email. Please try again."

**Authorization Errors:**
- Unauthenticated user accesses protected route → Middleware redirects to `/sign-in`
- Non-admin accesses `/admin` → Middleware redirects to `/dashboard`

**Database Errors:**
- PostgreSQL container not running → Clear error in dev: "Database connection failed. Run: docker compose up -d"
- Prisma client not generated → Error: "Run: pnpm prisma generate"
- Migration pending → Error: "Run: pnpm db:migrate"

**Pattern Compliance:**
- Sign-out action uses `authenticatedAction` from next-safe-action
- All errors typed and handled explicitly
- No ts-pattern needed yet (will be used for GameStatus enum in Phase 2)

## Testing Strategy

> **See**: @docs/constitutions/current/testing.md for TDD requirements

### Manual Verification (Initial Setup)

**Database Connection:**
- [ ] PostgreSQL container running: `docker ps`
- [ ] Can connect via Prisma Studio: `pnpm prisma studio`
- [ ] Database shows tables: User, Account, VerificationToken

**Auth Flow:**
- [ ] Navigate to `/sign-in`
- [ ] Enter email, submit form
- [ ] Check Resend dashboard for sent email (or logs in dev mode)
- [ ] Click magic link in email
- [ ] Redirected to `/dashboard`
- [ ] Session cookie set in browser (check DevTools)

**Session & Protection:**
- [ ] Can access protected routes while authenticated
- [ ] Sign out clears session
- [ ] Protected routes redirect to `/sign-in` after sign out
- [ ] Admin email gets ADMIN role, others get USER role

**Prisma Verification:**
- [ ] User record created in database
- [ ] VerificationToken created and deleted after use
- [ ] JWT includes userId, email, role

### Automated Testing (Future)

**Unit Tests (when Vitest implemented):**
- `src/lib/auth/__tests__/config.test.ts` - Role assignment logic
- `src/schemas/__tests__/auth-schema.test.ts` - Email validation

**Integration Tests:**
- `src/lib/actions/__tests__/auth-actions.test.ts` - Sign-out action
- Mock Auth.js session

**E2E Tests (when Playwright implemented):**
- Complete magic link flow
- Protected route access
- Sign-out flow

## Environment Variables

### .env.local (local development, gitignored)

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bignight"

# Auth.js
AUTH_SECRET="<generate-with-openssl-rand-base64-32>"
NEXTAUTH_URL="http://localhost:3000"

# Resend (get API key from resend.com)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
EMAIL_FROM="dev@bignight.party"

# Admin emails (comma-separated)
ADMIN_EMAILS="admin@example.com,admin2@example.com"
```

### .env.example (committed template)

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bignight"

# Auth.js (generate secret with: openssl rand -base64 32)
AUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"

# Resend
RESEND_API_KEY=""
EMAIL_FROM="game@bignight.party"

# Admin emails (comma-separated)
ADMIN_EMAILS=""
```

## Acceptance Criteria

### Pattern Compliance

> **Must follow constitution patterns** (see @docs/constitutions/current/)

**From patterns.md:**
- [ ] Sign-out action uses `next-safe-action` with `authenticatedAction` client
- [ ] All email inputs validated with Zod schemas
- [ ] No Prisma imports outside `src/lib/db/` (only in prisma.ts singleton)
- [ ] ts-pattern imported (will be used for enums in Phase 2)

**From architecture.md:**
- [ ] Layer boundaries respected: no business logic in prisma.ts
- [ ] Auth.js config in `src/lib/auth/` (not in models/services/actions)
- [ ] Middleware at root level (`src/middleware.ts`)

**From tech-stack.md:**
- [ ] Auth.js v5 (beta) for Next.js 15 compatibility
- [ ] Prisma for database access (no Mongoose, no raw SQL)
- [ ] Zod for validation (no joi, no yup)
- [ ] Resend for email (documented in constitution)

### Task-Specific Acceptance Criteria

**Database Setup:**
- [ ] Docker Compose file creates PostgreSQL 15+ container
- [ ] Database persists data across container restarts
- [ ] Connection pooling configured in Prisma
- [ ] Can run Prisma Studio to view data

**Prisma Schema:**
- [ ] Schema includes User, Account, VerificationToken models
- [ ] Role enum defined (USER, ADMIN)
- [ ] All indexes defined per schema-rules.md
- [ ] Migration runs successfully: `pnpm db:migrate`
- [ ] Prisma client generates TypeScript types

**Auth.js Integration:**
- [ ] Magic link provider configured with Resend
- [ ] JWT strategy enabled (no Session model)
- [ ] Role assigned from ADMIN_EMAILS env var
- [ ] Session includes userId, email, role
- [ ] HTTP-only cookies used
- [ ] Magic links expire after 10 minutes

**UI & UX:**
- [ ] `/sign-in` page renders email form
- [ ] Form validates email format client-side
- [ ] Success message shows after submitting email
- [ ] Magic link email received and functional
- [ ] Redirects to `/dashboard` after successful auth

**Middleware:**
- [ ] Protects `/picks`, `/leaderboard`, `/dashboard`, `/admin` routes
- [ ] Redirects unauthenticated users to `/sign-in`
- [ ] Allows authenticated users to access protected routes
- [ ] Admin-only routes check role

**Server Actions:**
- [ ] Sign-out action uses `authenticatedAction`
- [ ] Action clears session cookie
- [ ] Action redirects to `/sign-in`
- [ ] Type-safe with proper error handling

### Verification Commands

```bash
# Database
docker ps                    # PostgreSQL container running
pnpm prisma studio          # Open database browser

# Build & Lint
pnpm build                  # Production build succeeds
pnpm lint                   # Biome linting passes

# Development
pnpm dev                    # App starts without errors
curl http://localhost:3000/api/auth/signin  # Auth endpoint responds
```

## Security Considerations

**Authentication:**
- Magic link tokens single-use (deleted after verification)
- Tokens expire after 10 minutes
- JWT encrypted and signed by Auth.js
- HTTP-only cookies (XSS protection)

**Database:**
- No SQL injection (Prisma parameterized queries)
- Environment variables never committed
- Database password different in production

**Email:**
- Resend API key in environment variables
- Rate limiting on email sending (Resend built-in)
- Validate email format before sending

**Authorization:**
- Middleware checks authentication on every request
- Role-based access control enforced
- ADMIN role assigned from environment variable

## Future Enhancements (Out of Scope)

**Phase 2: Game Models**
- Add Event, Game, Category, Nominee, Pick models
- Create new migration: `pnpm prisma migrate dev --name add-game-models`
- Add indexes for leaderboard queries
- See schema-rules.md for complete schema

**Phase 3: Additional Auth Features**
- OAuth providers (Google, GitHub)
- "Remember me" functionality
- Session management UI
- Password reset (if adding password auth)

**Phase 4: Testing**
- Set up Vitest for unit tests
- Set up Playwright for E2E tests
- Add test coverage reporting
- CI/CD integration

## References

- **Architecture**: @docs/constitutions/current/architecture.md
- **Patterns**: @docs/constitutions/current/patterns.md
- **Schema Rules**: @docs/constitutions/current/schema-rules.md
- **Tech Stack**: @docs/constitutions/current/tech-stack.md
- **Testing**: @docs/constitutions/current/testing.md
- **Auth.js v5 Docs**: https://authjs.dev/getting-started/installation
- **Prisma Docs**: https://www.prisma.io/docs
- **Resend Docs**: https://resend.com/docs
- **next-safe-action Docs**: https://next-safe-action.dev

## Appendix: File Contents Outline

### docker-compose.yml
```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: bignight
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### prisma/schema.prisma
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  ADMIN
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  role          Role      @default(USER)
  emailVerified DateTime?
  name          String?
  image         String?

  accounts      Account[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### src/lib/db/prisma.ts
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### src/lib/auth/config.ts
```typescript
import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Resend from 'next-auth/providers/resend'
import { prisma } from '@/lib/db/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      from: process.env.EMAIL_FROM,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.role = process.env.ADMIN_EMAILS?.split(',').includes(user.email)
          ? 'ADMIN'
          : 'USER'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
        session.user.role = token.role as 'USER' | 'ADMIN'
      }
      return session
    },
  },
})
```

### src/app/api/auth/[...nextauth]/route.ts
```typescript
import { handlers } from '@/lib/auth/config'

export const { GET, POST } = handlers
```

### src/lib/actions/safe-action.ts
```typescript
import { createSafeActionClient } from 'next-safe-action'
import { auth } from '@/lib/auth/config'

export const action = createSafeActionClient()

export const authenticatedAction = createSafeActionClient({
  async middleware() {
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized')
    }
    return { userId: session.user.id, userRole: session.user.role }
  },
})

export const adminAction = createSafeActionClient({
  async middleware() {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      throw new Error('Forbidden')
    }
    return { userId: session.user.id }
  },
})
```

### src/schemas/auth-schema.ts
```typescript
import { z } from 'zod'

export const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export type EmailInput = z.infer<typeof emailSchema>
```

### src/lib/actions/auth-actions.ts
```typescript
'use server'

import { authenticatedAction } from './safe-action'
import { signOut } from '@/lib/auth/config'
import { redirect } from 'next/navigation'

export const signOutAction = authenticatedAction.action(async () => {
  await signOut()
  redirect('/sign-in')
})
```

### src/middleware.ts
```typescript
import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isAuthenticated = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/sign-in')
  const isProtectedRoute = ['/picks', '/leaderboard', '/dashboard', '/admin'].some(
    (route) => req.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### src/app/(auth)/sign-in/page.tsx
```typescript
import { signIn } from '@/lib/auth/config'
import { emailSchema } from '@/schemas/auth-schema'

export default function SignInPage() {
  async function handleSignIn(formData: FormData) {
    'use server'

    const email = formData.get('email') as string
    const validated = emailSchema.parse({ email })

    await signIn('resend', { email: validated.email, redirect: false })
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="text-3xl font-bold">Sign in to BigNight.Party</h2>
          <p className="mt-2 text-sm text-gray-600">
            We'll send you a magic link to sign in
          </p>
        </div>

        <form action={handleSignIn} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Send Magic Link
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

**End of Specification**
