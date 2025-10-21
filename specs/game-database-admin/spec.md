# Feature: Game Database Schema and Admin Dashboard

**Status**: Draft
**Created**: 2025-10-17

## Problem Statement

**Current State:**

- Database only contains Auth.js models (User, Account, VerificationToken)
- No game-related data models exist
- No way to create or manage events, categories, or nominations
- No seed data for development and testing

**Desired State:**

- Complete database schema for game entities (Event, Game, Category, Work, Person, Nomination, Pick)
- Normalized schema supporting cross-event entity reuse (works and people can be nominated for multiple awards)
- Admin dashboard for CRUD operations on game data
- Idempotent seed script creating realistic Oscar data for development

**Gap:**

- Missing 7 core game models in Prisma schema
- Missing 2 enums (GameStatus, WorkType)
- Missing seed script and pnpm command
- Missing admin routes and UI
- Missing model/service/action layers for game entities

## Requirements

> **Note**: All features must follow @docs/constitutions/v1/

### Functional Requirements

**Database:**

- FR1: Add Event model (award show data: name, slug, date)
- FR2: Add Game model (competition instance: access code, status, picks lock time)
- FR3: Add Category model (award category: name, points, winner tracking, reveal control)
- FR4: Add Work model (normalized entity for films/TV/albums/etc with type enum)
- FR5: Add Person model (normalized entity for individuals)
- FR6: Add Nomination model (links category to work/person with display text)
- FR7: Add Pick model (user predictions with composite unique constraint)
- FR8: Add GameStatus enum (SETUP, OPEN, LIVE, COMPLETED)
- FR9: Add WorkType enum (FILM, TV_SHOW, ALBUM, SONG, PLAY, BOOK)

**Seed Script:**

- FR10: Create idempotent seed script (clears and recreates data)
- FR11: Seed creates 3 Works (FILM type), 3 People, 1 Event, 1 Game, 3 Categories, 9 Nominations
- FR12: Add `db:seed` pnpm script to run seed

**Admin Dashboard:**

- FR13: Admin-only routes protected by role check
- FR14: CRUD operations for Events (create, view, edit, delete)
- FR15: CRUD operations for Games (create, view, edit, delete)
- FR16: CRUD operations for Categories (create, view, edit, delete)
- FR17: CRUD operations for Nominations (create, view, edit, delete)
- FR18: CRUD operations for Works (create, view, edit, delete)
- FR19: CRUD operations for People (create, view, edit, delete)
- FR20: Dashboard home showing overview of all entities

### Non-Functional Requirements

- NFR1: Schema follows all naming conventions per @docs/constitutions/v1/schema-rules.md
- NFR2: All foreign keys indexed for query performance
- NFR3: Composite unique constraints enforce business rules (one pick per user per category per game)
- NFR4: Nomination validation ensures at least one of workId or personId is set
- NFR5: Admin dashboard uses simple server components (no client-side state management)
- NFR6: Full page refresh on mutations (no optimistic updates for MVP)

## Architecture

> **Layer boundaries**: @docs/constitutions/v1/architecture.md
> **Required patterns**: @docs/constitutions/v1/patterns.md

### Database Schema

**Models to Add:**

1. **Event** - Award show instance
   - Fields: id, name, slug (unique), description, eventDate
   - Relations: has many Game, has many Category

2. **Game** - Competition instance
   - Fields: id, eventId, name, accessCode (unique), status (enum), picksLockAt
   - Relations: belongs to Event, has many Pick

3. **Category** - Award category
   - Fields: id, eventId, name, order, points (default 1), isRevealed (default false), winnerNominationId
   - Relations: belongs to Event, has many Nomination, has many Pick

4. **Work** - Creative work entity (film, album, etc)
   - Fields: id, type (enum), title, year, imageUrl, externalId
   - Relations: has many Nomination

5. **Person** - Individual entity
   - Fields: id, name, imageUrl, externalId
   - Relations: has many Nomination

6. **Nomination** - Links category to work/person
   - Fields: id, categoryId, workId (optional), personId (optional), nominationText
   - Relations: belongs to Category, optionally references Work, optionally references Person
   - Validation: At least one of workId or personId required

7. **Pick** - User prediction
   - Fields: id, gameId, userId, categoryId, nominationId
   - Relations: belongs to Game, User, Category, Nomination
   - Constraint: @@unique([gameId, userId, categoryId])

**Enums:**

- GameStatus: SETUP, OPEN, LIVE, COMPLETED
- WorkType: FILM, TV_SHOW, ALBUM, SONG, PLAY, BOOK

**Indexes:**

- Foreign keys: gameId, userId, categoryId, nominationId on Pick
- Foreign keys: categoryId, workId, personId on Nomination
- Composite: [gameId, userId] on Pick
- User.email updated to include picks relation

**Migration:** `add_game_models` - Creates all 7 models and 2 enums

### Components

**New Files:**

**Models Layer** (src/lib/models/):

- `event.ts` - Event CRUD operations
- `game.ts` - Game CRUD operations
- `category.ts` - Category CRUD operations
- `work.ts` - Work CRUD operations
- `person.ts` - Person CRUD operations
- `nomination.ts` - Nomination CRUD operations with Work/Person includes
- `pick.ts` - Pick CRUD operations (for future player functionality)

**Services Layer** (src/lib/services/):

- `event-service.ts` - Event business logic, orchestrates event + category creation
- `game-service.ts` - Game lifecycle management
- `admin-service.ts` - Admin operations, cascading deletes

**Actions Layer** (src/lib/actions/):

- `admin-actions.ts` - All admin CRUD actions using adminAction client

**Schemas** (src/schemas/):

- `event-schema.ts` - Event create/update validation
- `game-schema.ts` - Game create/update validation
- `category-schema.ts` - Category create/update validation
- `work-schema.ts` - Work create/update validation (validates WorkType enum)
- `person-schema.ts` - Person create/update validation
- `nomination-schema.ts` - Nomination create/update validation (validates at least one of workId/personId)

**Admin Routes** (src/app/(admin)/admin/):

```
admin/
├── layout.tsx              # Auth + role check
├── page.tsx                # Dashboard home
├── events/
│   ├── page.tsx
│   ├── new/page.tsx
│   └── [id]/
│       ├── page.tsx
│       └── categories/
│           ├── new/page.tsx
│           └── [categoryId]/
│               ├── page.tsx
│               └── nominations/
│                   └── new/page.tsx
├── games/
│   ├── page.tsx
│   ├── new/page.tsx
│   └── [id]/page.tsx
├── works/
│   ├── page.tsx
│   ├── new/page.tsx
│   └── [id]/page.tsx
└── people/
    ├── page.tsx
    ├── new/page.tsx
    └── [id]/page.tsx
```

**Seed Script:**

- `prisma/seed.ts` - Idempotent seed creating Oscar data

**Modified Files:**

- `prisma/schema.prisma` - Add all game models
- `package.json` - Add `db:seed` script
- User model - Add `picks Pick[]` relation

### Dependencies

**New Packages:**

- `tsx` (dev) - TypeScript execution for seed script
- See: https://github.com/privatenumber/tsx

**Existing Packages (no additions needed):**

- `@prisma/client` - Database queries
- `next-safe-action` - Server actions
- `zod` - Input validation
- `ts-pattern` - Pattern matching

### Integration Points

**Authentication:**

- Uses existing Auth.js setup from `src/lib/auth/config.ts`
- Admin routes check `session.user.role === 'ADMIN'`
- Admin actions use `adminAction` client from `src/lib/actions/safe-action.ts`

**Database:**

- Uses existing Prisma client from `src/lib/db/prisma.ts`
- Follows migration strategy per @docs/constitutions/v1/schema-rules.md
- All models follow field organization rules from schema-rules.md

**Validation:**

- All schemas use Zod per @docs/constitutions/v1/patterns.md
- Server actions use next-safe-action per patterns.md
- Pattern matching uses ts-pattern for GameStatus enum

**Authorization:**

- Leverage existing Role enum (USER, ADMIN)
- Admin middleware from existing safe-action.ts setup

## Acceptance Criteria

**Constitution Compliance:**

- [ ] All server actions use next-safe-action (@docs/constitutions/v1/patterns.md)
- [ ] GameStatus pattern matching uses ts-pattern with .exhaustive()
- [ ] Layer boundaries respected (no Prisma outside models/)
- [ ] All inputs validated with Zod
- [ ] Schema follows naming conventions (@docs/constitutions/v1/schema-rules.md)
- [ ] Field organization per schema-rules.md (ID, required, optional, relations, timestamps)
- [ ] All foreign keys indexed
- [ ] Composite unique constraint on Pick model

**Database:**

- [ ] Migration creates all 7 models successfully
- [ ] All relations properly defined with cascade behavior
- [ ] Seed script runs without errors
- [ ] Seed script is idempotent (can run multiple times safely)
- [ ] `pnpm db:seed` command works

**Admin Dashboard:**

- [ ] Non-admin users redirected from /admin routes
- [ ] All CRUD operations work for all 6 entity types
- [ ] Forms validate inputs before submission
- [ ] Error messages display on validation failures
- [ ] revalidatePath() called after mutations

**Data Integrity:**

- [ ] Cannot create duplicate picks (same game/user/category)
- [ ] Cannot create nomination without work or person
- [ ] Cannot delete work/person referenced by nominations (foreign key error)
- [ ] Deleting game cascades to delete picks

**Verification:**

- [ ] `pnpm lint` passes
- [ ] `pnpm check-types` passes
- [ ] Seed data viewable in Prisma Studio
- [ ] Admin dashboard accessible and functional

## Open Questions

None - design validated through brainstorming phases 1-3.

## References

**Constitutions:**

- Architecture: @docs/constitutions/v1/architecture.md
- Patterns: @docs/constitutions/v1/patterns.md
- Schema Rules: @docs/constitutions/v1/schema-rules.md
- Tech Stack: @docs/constitutions/v1/tech-stack.md
- Testing: @docs/constitutions/v1/testing.md

**External Documentation:**

- Prisma Schema: https://www.prisma.io/docs/orm/prisma-schema
- Zod Validation: https://zod.dev
- next-safe-action: https://next-safe-action.dev
- tsx: https://github.com/privatenumber/tsx
