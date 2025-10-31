# Phase 1: Database Foundation

**Strategy**: Sequential (single task)
**Dependencies**: None (foundation phase)
**Estimated Time**: 4 hours

---

## Task 1: Database Schema & Migrations

**Complexity**: M (3-4h)

**Files**:
- `/Users/drewritter/projects/bignight.party-vite/prisma/schema.prisma`
- `/Users/drewritter/projects/bignight.party-vite/prisma/migrations/`
- `/Users/drewritter/projects/bignight.party-vite/.env.local`
- `/Users/drewritter/projects/bignight.party-vite/.env.example`

**Dependencies**: None

**Description**:
Copy the complete Prisma schema and all migrations from the existing Next.js project to establish the database foundation. This includes all models for Users, Games, Events, Categories, Nominations, Picks, Works, and People. The schema must support Better-Auth's requirements (User, Account, VerificationToken models).

**Implementation Steps**:

1. Copy Prisma schema from source project:
   ```bash
   cp /Users/drewritter/projects/bignight.party/prisma/schema.prisma \
      /Users/drewritter/projects/bignight.party-vite/prisma/schema.prisma
   ```

2. Copy all migrations:
   ```bash
   cp -r /Users/drewritter/projects/bignight.party/prisma/migrations/* \
         /Users/drewritter/projects/bignight.party-vite/prisma/migrations/
   ```

3. Create `.env.example` with database variables:
   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/bignight
   ```

4. Copy `.env.local` from source or create new one

5. Generate Prisma client:
   ```bash
   cd /Users/drewritter/projects/bignight.party-vite
   bun run db:generate
   ```

6. Run migrations:
   ```bash
   bun run db:migrate
   ```

7. Verify schema integrity:
   ```bash
   bun run db:validate
   ```

**Acceptance Criteria**:
- [ ] Prisma schema file copied with all 10+ models intact
- [ ] All migrations copied (10-15 migration files)
- [ ] `bun run db:generate` completes without errors
- [ ] `bun run db:migrate` applies all migrations successfully
- [ ] `bun run db:validate` passes
- [ ] Database tables match expected schema (verify in Prisma Studio)

**Mandatory Patterns**:

> **Source Reference**: All files copied from `/Users/drewritter/projects/bignight.party/`

Schema follows existing patterns:
- User model has Role enum (USER, ADMIN)
- Game has status enum (SETUP, OPEN, LIVE, COMPLETED)
- Pick has unique constraint per user/category/game
- Category stores point values (not nominations)

**Quality Gates**:
```bash
bun run db:validate
bun run db:studio  # Visual verification
```
