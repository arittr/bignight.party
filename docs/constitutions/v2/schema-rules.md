# Schema Design Rules

**Note**: This file contains database design *philosophy* and *rules*. The actual Prisma schema lives at `prisma/schema.prisma`.

---

## Design Philosophy

### 1. Event-Driven Schema

- `Event` as top-level entity supports multi-show future
- `Game` separates award show data from competition data
- One Event can power multiple independent Games
- `isRevealed` flag enables incremental reveals
- `status` enum tracks game lifecycle

### 2. Clear Separation: Event vs Game

**Event** represents the award show itself:
- Reusable across multiple games
- Contains categories and nominees (the "content")
- Winner data stored at category level
- Can be imported from external APIs
- Immutable once created (except winner marking)

**Game** represents a specific competition:
- Tied to one event
- Has its own access code, lock time, status
- Contains picks from participants
- Isolated from other games
- Multiple games can use same event

**Benefits:**
- Create multiple games for same event (e.g., "Friends Game", "Work Game")
- Prepare event data once, use for many games
- Clear separation of concerns (content vs competition)
- Easy to add templates later (Event becomes template source)

### 3. Referential Integrity

- Foreign keys with cascading deletes
- Unique constraints prevent duplicate picks
- Indexes on foreign keys for query performance
- Composite indexes for leaderboard queries

### 4. Future-Proof Design

- Schema supports multiple events without migration
- User accounts persist across years
- Can add historical stats without schema changes
- Room for growth (templates, imports, advanced features)

---

## Naming Conventions

### Model Names

- **Singular**: `User`, `Event`, `Category`, `Pick`
- **PascalCase**: Capitalize each word
- **Descriptive**: Clear what entity represents

❌ Bad: `Users`, `user`, `event_table`
✅ Good: `User`, `Event`, `Category`

### Field Names

- **camelCase**: Standard JavaScript convention
- **Descriptive**: Clear what field contains
- **Consistent**: Use same naming patterns

```prisma
// ✅ Good
model Event {
  id          String   @id
  name        String
  slug        String   @unique
  picksLockAt DateTime
  createdAt   DateTime @default(now())
}

// ❌ Bad
model Event {
  ID          String   @id
  EventName   String
  event_slug  String   @unique
  picks_lock  DateTime
  created     DateTime @default(now())
}
```

### Relation Field Names

- **Singular for one-to-one**: `user`, `event`, `category`
- **Plural for one-to-many**: `picks`, `categories`, `nominees`
- **Descriptive for ambiguous**: `winner` not `nominee`, `wonCategories` not `categories`

```prisma
model Category {
  winnerId   String?
  winner     Nominee?   @relation("CategoryWinner", fields: [winnerId], references: [id])
}

model Nominee {
  wonCategories  Category[] @relation("CategoryWinner")
}
```

---

## Field Organization

### Order Within Model

1. **ID field** first
2. **Required fields** next
3. **Optional fields**
4. **Relation fields**
5. **Timestamps** last

```prisma
model User {
  // 1. ID
  id            String     @id @default(cuid())

  // 2. Required fields
  email         String     @unique
  role          Role       @default(USER)

  // 3. Optional fields
  name          String?
  emailVerified DateTime?
  image         String?

  // 4. Relations
  accounts      Account[]
  sessions      Session[]
  picks         Pick[]

  // 5. Timestamps
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}
```

---

## Data Modeling Patterns

### Point Values on Category

`Category.points` stores the point value for correct predictions:

**Why Category, not Pick:**
- Centralized point values (no denormalization)
- Admin can adjust point values and all scores update
- Simpler data model with no duplication
- Scoring queries join through category to sum points

```prisma
model Category {
  points     Int        @default(1)  // Point value for correct pick
}

model Pick {
  // No points field - join through category to get value
  categoryId String
  category   Category   @relation(fields: [categoryId], references: [id])
}
```

### Incremental Reveals

`Category.isRevealed` enables suspense:

```prisma
model Category {
  isRevealed Boolean @default(false)
  winnerId   String?
}
```

**Usage:**
- Admin marks winner without revealing
- Admin controls when to reveal (category-by-category)
- Scores only update for revealed categories
- Build tension during ceremony

### Composite Unique Constraints

Ensure business rule enforcement:

```prisma
model Pick {
  // One pick per user per category per game
  @@unique([gameId, userId, categoryId])
}
```

**Benefits:**
- Database-level enforcement
- Prevents duplicate submissions
- Allows same user different picks across games
- Clear business rule in schema

### No Reaction Table

Reactions are **not persisted**:
- Handled in-memory via WebSocket
- `{ type: 'REACTION', userId, emoji, timestamp }`
- Broadcast to all clients in game room
- Display for 3-5 seconds then discard
- Reduces DB writes during high-traffic ceremony

---

## Index Strategy

### Primary Indexes

Every query-heavy foreign key needs an index:

```prisma
model Pick {
  @@index([gameId])       // Leaderboard queries
  @@index([userId])       // User's picks
  @@index([categoryId])   // Category stats
  @@index([nomineeId])    // Nominee popularity
}
```

### Composite Indexes

For common multi-field queries:

```prisma
model Pick {
  @@index([gameId, userId])  // User's picks in specific game
}
```

### Unique Constraints

Enforce data integrity:

```prisma
model Event {
  slug String @unique  // URL-safe lookup
}

model Game {
  accessCode String @unique  // Join code
}

model User {
  email String @unique  // Login
}
```

---

## Enum Patterns

### Status Enums

Use descriptive, uppercase names:

```prisma
enum GameStatus {
  SETUP      // Admin is configuring
  OPEN       // Users can make picks
  LIVE       // Ceremony happening, picks locked
  COMPLETED  // Game is over
}

enum Role {
  USER
  ADMIN
}
```

**Rules:**
- All caps for enum values
- Descriptive names (not PENDING/ACTIVE/DONE)
- Ordered by lifecycle when applicable

---

## Migration Strategy

### Adding Fields

**Safe additions:**
```prisma
// Add optional field
model Event {
  description String?  // New field
}
```

**Breaking changes:**
```prisma
// Make field required (needs migration)
model Event {
  description String @default("")  // Provide default
}
```

### Renaming Fields

Use Prisma migrate with `--create-only`:

```bash
# 1. Create migration file
pnpm prisma migrate dev --create-only --name rename_field

# 2. Edit SQL to preserve data
# In migration.sql:
ALTER TABLE "Event" RENAME COLUMN "old_name" TO "new_name";

# 3. Apply migration
pnpm prisma migrate dev
```

### Deleting Models

1. Remove foreign keys first
2. Deploy migration
3. Remove model from schema
4. Deploy second migration

### Schema Versioning

- One migration per feature/fix
- Descriptive migration names: `add_game_settings`, `split_event_game`
- Never edit applied migrations
- Always test migrations on staging first

---

## Query Patterns

### Leaderboard Query

```typescript
// Get all correct picks with category points
const correctPicks = await prisma.pick.findMany({
  where: {
    gameId: gameId,
    category: {
      isRevealed: true,
      winnerId: { not: null },
    },
  },
  include: {
    category: {
      select: {
        points: true,
        winnerId: true,
      },
    },
    user: {
      select: {
        id: true,
        name: true,
        image: true,
      },
    },
  },
})

// Calculate scores by summing category points
const scoresByUser = correctPicks.reduce((acc, pick) => {
  if (pick.nomineeId === pick.category.winnerId) {
    const userId = pick.user.id
    if (!acc[userId]) {
      acc[userId] = { user: pick.user, points: 0 }
    }
    acc[userId].points += pick.category.points
  }
  return acc
}, {})
```

**Why this pattern:**
- Single query gets all data
- No N+1 problems
- Points calculated at query time (never stale)
- Type-safe with Prisma

### User Picks with Status

```typescript
const picks = await prisma.pick.findMany({
  where: { gameId, userId },
  include: {
    category: {
      select: {
        id: true,
        name: true,
        points: true,
        isRevealed: true,
        winnerId: true,
      },
    },
    nominee: {
      select: {
        id: true,
        name: true,
      },
    },
  },
  orderBy: {
    category: {
      order: 'asc',
    },
  },
})

// Add computed fields
const picksWithStatus = picks.map((pick) => ({
  ...pick,
  isCorrect: pick.category.isRevealed && pick.category.winnerId === pick.nomineeId,
  earnedPoints: pick.category.isRevealed && pick.category.winnerId === pick.nomineeId
    ? pick.category.points
    : 0,
}))
```

---

## Performance Rules

### Avoid N+1 Queries

❌ **Bad:**
```typescript
const games = await prisma.game.findMany()
for (const game of games) {
  game.picks = await prisma.pick.findMany({ where: { gameId: game.id } })
}
```

✅ **Good:**
```typescript
const games = await prisma.game.findMany({
  include: {
    picks: true,
  },
})
```

### Use Select Wisely

Only fetch fields you need:

```typescript
// ❌ Bad - fetches everything
const user = await prisma.user.findUnique({ where: { id } })

// ✅ Good - only needed fields
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    email: true,
  },
})
```

### Batch Operations

Use `createMany`, `updateMany` for bulk operations:

```typescript
// ✅ Good - single query
await prisma.pick.createMany({
  data: picks.map((p) => ({
    userId: p.userId,
    gameId: p.gameId,
    categoryId: p.categoryId,
    nomineeId: p.nomineeId,
  })),
})
```

---

## Security Rules

### Never Trust Input

Use Zod schemas before Prisma:

```typescript
// ❌ Bad - direct input to Prisma
await prisma.pick.create({ data: userInput })

// ✅ Good - validate first
const validated = pickSchema.parse(userInput)
await pickModel.create(validated)
```

### Cascade Deletes Carefully

```prisma
model Pick {
  game Game @relation(fields: [gameId], references: [id], onDelete: Cascade)
}
```

**Understand implications:**
- Deleting Game deletes all Picks
- Useful for cleanup
- Dangerous if accidental

### Use Transactions

For multi-step operations:

```typescript
await prisma.$transaction(async (tx) => {
  const pick = await tx.pick.create({ data: pickData })
  await tx.category.update({
    where: { id: pickData.categoryId },
    data: { winnerId: pickData.nomineeId },
  })
})
```

---

## Future Schema Extensions

### Phase 2: Import from APIs
- Add `Event.source` enum (MANUAL, TMDB, OMDB)
- Add `Category.externalId` for API mapping
- Add `Nominee.externalId` for API mapping
- Add `Event.importedAt` timestamp

### Phase 3: Templates
- Add `EventTemplate` model
- Add `CategoryTemplate` with default point values
- Link events to templates for quick setup
- "Grammy Awards" template, "Golden Globes" template

### Game Features
- Add `Game.categoryPointOverrides` JSONB for custom points
- Add `Game.revealMode` enum (AUTO, MANUAL, BATCH)
- Add `Game.settings` JSONB for game-specific config

### Historical Stats
- Current schema already supports cross-game queries
- Query picks across multiple games for same user
- Aggregate stats per event across all games
- No migration needed
