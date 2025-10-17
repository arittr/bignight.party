# Database Schema

## Overview

The database schema is designed to support:
- **Event** = Award show (categories, nominees, winners) - reusable across games
- **Game** = Specific competition (access code, participants, picks) - tied to one event
- Multiple games can use the same event data
- Real-time scoring and leaderboard updates
- Incremental category reveals during ceremony
- Role-based access control

---

## Entity Relationship Diagram

```
Event (Award Show)
  └──< Category (many categories per event)
       └──< Nominee (many nominees per category)

Game (Competition)
  ├── → Event (references one event)
  └──< Pick (many picks per game)
       ├── → User (who made the pick)
       ├── → Category (which category)
       └── → Nominee (which nominee chosen)

User (AUTH)
  └──< Pick (many picks per user across games)

Admin Role (User.role = ADMIN)
  - Can manage Events, Categories, Nominees
  - Can create Games and manage access
  - Can mark winners and control reveals

Reactions (In-Memory Only)
  - Not persisted to database
  - Handled via WebSocket events
  - Ephemeral display only
```

**Key Separation:**
- **Event** = External data (the award show itself)
- **Game** = Internal competition (your party's predictions)
- One event can power multiple independent games
- Easy to import event data once, reuse across games

---

## Schema Definition

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// Auth.js Required Tables
// ============================================

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ============================================
// Application Models
// ============================================

model User {
  id            String     @id @default(cuid())
  name          String?
  email         String     @unique
  emailVerified DateTime?
  image         String?
  role          Role       @default(USER)

  // Relations
  accounts      Account[]
  sessions      Session[]
  picks         Pick[]

  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@index([email])
}

enum Role {
  USER
  ADMIN
}

// ============================================
// Event (Award Show Data)
// ============================================

model Event {
  id              String       @id @default(cuid())
  name            String       // "96th Academy Awards"
  slug            String       @unique // "oscars-2025"
  year            Int          // 2025
  date            DateTime?    // Ceremony date
  description     String?      // Optional description

  // Relations
  categories      Category[]
  games           Game[]

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([slug])
  @@index([year])
}

// ============================================
// Game (Competition Instance)
// ============================================

model Game {
  id              String       @id @default(cuid())
  eventId         String
  name            String       // "Drew's Party 2025"
  slug            String       @unique // "drews-party-2025"
  accessCode      String       @unique // "OSCARS2025"
  picksLockAt     DateTime     // When picks freeze
  status          GameStatus   @default(SETUP)

  // Relations
  event           Event        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  picks           Pick[]

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([eventId])
  @@index([accessCode])
  @@index([status])
}

enum GameStatus {
  SETUP        // Admin is configuring
  OPEN         // Users can make picks
  LIVE         // Ceremony happening, picks locked
  COMPLETED    // Game is over
}

// ============================================
// Event Content (Categories & Nominees)
// ============================================

model Category {
  id              String     @id @default(cuid())
  eventId         String
  name            String     // "Best Picture"
  description     String?    // Optional details
  order           Int        // Display order (0-indexed)
  points          Int        @default(1) // Point value for correct pick
  isRevealed      Boolean    @default(false) // Controls incremental reveals
  winnerId        String?    // Which nominee won (null until marked)

  // Relations
  event           Event      @relation(fields: [eventId], references: [id], onDelete: Cascade)
  nominees        Nominee[]
  picks           Pick[]
  winner          Nominee?   @relation("CategoryWinner", fields: [winnerId], references: [id])

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@unique([eventId, order])
  @@index([eventId])
  @@index([winnerId])
}

model Nominee {
  id              String     @id @default(cuid())
  categoryId      String
  name            String     // "Oppenheimer"
  details         String?    // Optional metadata (e.g., "Christopher Nolan")
  imageUrl        String?    // Optional poster/image
  order           Int        // Display order within category

  // Relations
  category        Category   @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  picks           Pick[]
  wonCategories   Category[] @relation("CategoryWinner")

  createdAt       DateTime   @default(now())

  @@unique([categoryId, order])
  @@index([categoryId])
}

// ============================================
// Game-Specific Data (Picks)
// ============================================

model Pick {
  id              String     @id @default(cuid())
  gameId          String     // Which game this pick belongs to
  userId          String
  categoryId      String
  nomineeId       String

  // Relations
  game            Game       @relation(fields: [gameId], references: [id], onDelete: Cascade)
  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  category        Category   @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  nominee         Nominee    @relation(fields: [nomineeId], references: [id], onDelete: Cascade)

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  // Constraints
  @@unique([gameId, userId, categoryId]) // One pick per user per category per game
  @@index([gameId])
  @@index([userId])
  @@index([categoryId])
  @@index([nomineeId])
  @@index([gameId, userId]) // Composite for user's picks in game
}
```

---

## Key Design Decisions

### 1. Event vs Game Separation

**Event** represents the award show itself:
- Reusable across multiple games
- Contains categories and nominees (the "content")
- Winner data stored at category level
- Can be imported from external APIs

**Game** represents a specific competition:
- Tied to one event
- Has its own access code, lock time, status
- Contains picks from participants
- Isolated from other games

**Benefits:**
- Create multiple games for same event (e.g., "Friends Game", "Work Game")
- Prepare event data once, use for many games
- Clear separation of concerns (content vs competition)
- Easy to add templates later (Event becomes template source)

### 2. Points on Category

`Category.points` stores the point value for correct predictions:
- Centralized point values (no denormalization)
- Admin can adjust point values and all scores update accordingly
- Simpler data model with no duplication
- Scoring queries join through category to sum points

### 3. No Reaction Table

Reactions are handled in-memory via WebSocket:
- `{ type: 'REACTION', userId, emoji, timestamp }`
- Broadcast to all clients in game room
- Display for 3-5 seconds then discard
- No database persistence needed
- Reduces DB writes during high-traffic ceremony

### 4. Incremental Reveals

`Category.isRevealed` enables suspense:
- Admin marks winner without revealing
- Admin controls when to reveal (category-by-category)
- Scores only update for revealed categories
- Build tension during ceremony

### 5. Composite Unique Constraint

`@@unique([gameId, userId, categoryId])`:
- Ensures one pick per user per category per game
- Allows same user to pick differently across games
- Prevents duplicate submissions

---

## Query Patterns

### Get Leaderboard for Game

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

// Calculate scores by summing category points for correct picks
const scoresByUser = correctPicks.reduce((acc, pick) => {
  // Only count if pick matches winner
  if (pick.nomineeId === pick.category.winnerId) {
    const userId = pick.user.id
    if (!acc[userId]) {
      acc[userId] = {
        user: pick.user,
        points: 0,
      }
    }
    acc[userId].points += pick.category.points
  }
  return acc
}, {} as Record<string, { user: { id: string; name: string | null; image: string | null }; points: number }>)

// Convert to sorted array
const leaderboard = Object.values(scoresByUser).sort((a, b) => b.points - a.points)
```

### Get User's Picks for Game

```typescript
const picks = await prisma.pick.findMany({
  where: {
    gameId,
    userId,
  },
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
        details: true,
      },
    },
  },
  orderBy: {
    category: {
      order: 'asc',
    },
  },
})

// Calculate status
const picksWithStatus = picks.map((pick) => ({
  ...pick,
  isCorrect:
    pick.category.isRevealed && pick.category.winnerId === pick.nomineeId,
  earnedPoints: pick.category.isRevealed && pick.category.winnerId === pick.nomineeId
    ? pick.category.points
    : 0,
}))
```

### Get Prediction Stats for Category (Across Game)

```typescript
const stats = await prisma.pick.groupBy({
  by: ['nomineeId'],
  where: {
    gameId,
    categoryId,
  },
  _count: true,
})

const total = stats.reduce((sum, stat) => sum + stat._count, 0)

const percentages = stats.map((stat) => ({
  nomineeId: stat.nomineeId,
  count: stat._count,
  percentage: total > 0 ? (stat._count / total) * 100 : 0,
}))
```

### Get All Games for Event

```typescript
const games = await prisma.game.findMany({
  where: {
    eventId,
  },
  include: {
    event: {
      select: {
        name: true,
        date: true,
      },
    },
    _count: {
      select: {
        picks: true,
      },
    },
  },
})
```

### Create Game from Event

```typescript
// Game references event, point values stay on categories
const event = await prisma.event.findUnique({
  where: { id: eventId },
  select: {
    date: true,
  },
})

const game = await prisma.game.create({
  data: {
    eventId,
    name: 'My Oscars Party',
    slug: 'my-oscars-party-2025',
    accessCode: generateCode(),
    picksLockAt: event.date, // Default to ceremony date
    status: 'SETUP',
  },
})

// Picks reference categories, points are calculated at query time
```

---

## Indexes for Performance

Key indexes added for common queries:

```prisma
// User lookups
@@index([email])                      // Login/auth

// Event queries
@@index([slug])                       // Event by slug
@@index([year])                       // Events by year

// Game queries
@@index([eventId])                    // Games for event
@@index([accessCode])                 // Game access
@@index([status])                     // Game filtering

// Category queries
@@index([eventId])                    // Event's categories
@@index([winnerId])                   // Winner lookups

// Nominee queries
@@index([categoryId])                 // Category's nominees

// Pick queries (critical for performance)
@@index([gameId])                     // Game's picks
@@index([userId])                     // User's picks
@@index([categoryId])                 // Category picks
@@index([nomineeId])                  // Nominee picks
@@index([gameId, userId])             // Composite for leaderboard
```

---

## Migration Strategy

### Initial Setup
```bash
# Generate Prisma client
pnpm prisma generate

# Create migration
pnpm prisma migrate dev --name init

# Apply to production
pnpm prisma migrate deploy
```

### Seeding (Optional)
```typescript
// prisma/seed.ts
async function seed() {
  // Create admin user
  await prisma.user.create({
    data: {
      email: 'admin@bignight.party',
      role: 'ADMIN',
    },
  })

  // Create event (the award show)
  const event = await prisma.event.create({
    data: {
      name: '96th Academy Awards',
      slug: 'oscars-2025',
      year: 2025,
      date: new Date('2025-03-10T20:00:00Z'),
    },
  })

  // Add categories with point values
  const bestPicture = await prisma.category.create({
    data: {
      eventId: event.id,
      name: 'Best Picture',
      order: 0,
      points: 100, // High-value category
    },
  })

  // Add nominees
  await prisma.nominee.createMany({
    data: [
      {
        categoryId: bestPicture.id,
        name: 'Oppenheimer',
        order: 0,
      },
      {
        categoryId: bestPicture.id,
        name: 'Killers of the Flower Moon',
        order: 1,
      },
    ],
  })

  // Create game (the competition)
  await prisma.game.create({
    data: {
      eventId: event.id,
      name: "Drew's Oscars Party",
      slug: 'drews-oscars-party-2025',
      accessCode: 'OSCARS2025',
      picksLockAt: new Date('2025-03-10T20:00:00Z'),
      status: 'OPEN',
    },
  })
}
```

---

## Future Schema Extensions

### Phase 2: Import from APIs
- Add `Event.source` enum (MANUAL, TMDB, OMDB, etc.)
- Add `Category.externalId` for API mapping
- Add `Nominee.externalId` for API mapping
- Add `Event.importedAt` timestamp

### Phase 3: Templates
- Add `EventTemplate` model
- Add `CategoryTemplate` model with default point values
- Link events to templates for quick setup
- "Grammy Awards" template, "Golden Globes" template, etc.

### Game Features
- Add `Game.categoryPointOverrides` JSONB for custom points
- Add `Game.revealMode` enum (AUTO, MANUAL, BATCH)
- Add `Game.settings` JSONB for game-specific config

### Historical Stats
- Current schema already supports cross-game queries
- Query picks across multiple games for same user
- Aggregate stats per event across all games
- No migration needed

---

## Reactions Implementation

Reactions are **not stored in the database**. They're handled entirely via WebSocket:

### Server-Side (Socket.io)

```typescript
// lib/websocket/server.ts
io.on('connection', (socket) => {
  socket.on('join-game', (gameId: string) => {
    socket.join(`game:${gameId}`)
  })

  socket.on('send-reaction', (data: { gameId: string; emoji: string }) => {
    io.to(`game:${data.gameId}`).emit('reaction-received', {
      userId: socket.data.userId,
      userName: socket.data.userName,
      emoji: data.emoji,
      timestamp: Date.now(),
    })
  })
})
```

### Client-Side

```typescript
// Client receives reactions
socket.on('reaction-received', (reaction) => {
  // Display reaction on screen for 3-5 seconds
  showReaction(reaction)
  setTimeout(() => hideReaction(reaction.id), 3000)
})

// Client sends reactions
function sendReaction(emoji: string) {
  socket.emit('send-reaction', {
    gameId: currentGame.id,
    emoji,
  })
}
```

**Benefits:**
- No database overhead
- Real-time delivery
- Automatic cleanup
- Scales well
