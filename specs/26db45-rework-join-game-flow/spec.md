# Specification: Rework Join Game Flow

**Feature ID**: 26db45-rework-join-game-flow
**Created**: 2025-11-04
**Status**: Draft

## Problem Statement

### Current State

The join game flow has the following issues:

1. **Collision Risk**: `Game.accessCode` has a global `@unique` constraint, meaning no two games can share the same access code across the entire platform. This creates collision risk as the system scales.

2. **Fragmented Join Logic**: The only entry point for joining games is `/signup?code={code}`, which:
   - Requires a two-step API flow: `resolveAccessCode` → `join`
   - Tightly couples authentication with game joining
   - Lacks a dedicated join route for already-authenticated users
   - Results in duplicated logic between signup-with-code and standalone join flows

3. **No Dashboard Join UI**: Authenticated users cannot join additional games from the dashboard. They must receive a signup link even if already registered.

4. **Code-Only Validation**: The `resolveAccessCode` API only validates access codes, not the combination of `gameId + accessCode`. This makes it impossible to support multiple games with the same access code.

### Desired State

A unified join game flow where:

- Access codes are scoped to games (multiple games can use the same code)
- A single canonical route `/join/{gameId}?code={code}` handles all join operations
- Authenticated users can join games from the dashboard
- Signup flow redirects to the canonical join route instead of handling join logic directly
- All join operations validate both `gameId` AND `accessCode` together (compound key)

## Requirements

### Functional Requirements

**FR-1: Schema Changes**
- Remove `@unique` constraint from `Game.accessCode`
- Add `@@index([accessCode])` to `Game` model for query performance
- Preserve existing `GameParticipant.@@unique([userId, gameId])` constraint

**FR-2: API Contract Changes**
- Update `joinGameSchema` to require both `gameId` (string, cuid) and `accessCode` (string, regex `/^[A-Z0-9]+$/`)
- Remove `resolveAccessCodeContract` and its implementation
- Update `joinContract` input to use the new `joinGameSchema`
- Maintain existing `joinContract` output structure (GameParticipant fields)

**FR-3: Route Structure**
- Create new route: `/join/[gameId]` (accepts `?code={accessCode}` query param)
- Update `src/lib/routes.ts`: `join: (gameId: string, code: string) => `/join/${gameId}?code=${code}`
- Protect route with `requireValidatedSession()` per authentication patterns

**FR-4: Join Route Implementation**
- Server Component validates `gameId` and `code` query param
- Calls `serverClient.game.join({ gameId, accessCode })` with both parameters
- Success: Redirect to `routes.game.pick(gameId)`
- Error: Display error message with link to dashboard

**FR-5: Dashboard Join UI**
- Add "Join Game" button/modal to `/dashboard` page
- Client Component form with inputs: Game ID (text), Access Code (text, uppercase)
- Use `useMutation(orpc.game.join.mutationOptions())` per oRPC patterns
- Success: Navigate to `routes.game.pick(gameId)` or refresh game list
- Error: Display inline validation errors

**FR-6: Simplified Signup Flow**
- `/signup?code={code}` displays "You'll join after signing in" message
- `/signup/callback?code={code}` redirects to `/join/{gameId}?code={code}` after detecting which game the code belongs to (one-time lookup)
- Remove `JoinGameHandler` client component (replaced by /join route)

**FR-7: Service Layer Implementation**
- Update `gameService.join(userId: string, gameId: string, accessCode: string)` to validate compound key
- Query: `prisma.game.findFirst({ where: { id: gameId, accessCode } })`
- Validate game exists, status is OPEN or LIVE (not SETUP or COMPLETED)
- Check existing membership via `GameParticipant.exists(userId, gameId)`
- Create `GameParticipant` record if not already a member
- Return participant record

### Non-Functional Requirements

**NFR-1: Security**
- Preserve authentication requirements (all join operations require valid session)
- Use `requireValidatedSession()` per Edge runtime authentication patterns (see `docs/constitutions/current/patterns.md`)
- Validate access codes with same regex constraint: `/^[A-Z0-9]+$/`

**NFR-2: Performance**
- Add database index on `Game.accessCode` to maintain query performance
- Single database query for join validation (compound WHERE clause)

**NFR-3: Architecture Compliance**
- Follow layered architecture: UI → oRPC → Service → Model → Prisma
- Use contract-first oRPC pattern with `implement(contract)`
- Use `ts-pattern` for game status validation
- Use centralized routes from `src/lib/routes.ts`
- Await `params` and `searchParams` per Next.js 15 async conventions

**NFR-4: Error Handling**
- Invalid game ID: "Game not found"
- Invalid access code: "Invalid access code for this game"
- Game status not joinable: "This game is no longer accepting new players"
- Already a member: Silent success (idempotent operation)
- Network errors: Display user-friendly message with retry option

## Architecture

### Schema Changes

**File**: `prisma/schema.prisma`

```prisma
model Game {
  id          String     @id @default(cuid())
  eventId     String
  name        String
  accessCode  String  // Remove @unique constraint
  status      GameStatus @default(SETUP)
  picksLockAt DateTime?

  event        Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  picks        Pick[]
  participants GameParticipant[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([eventId])
  @@index([accessCode])  // Add index for query performance
}
```

**Migration**: `pnpm db:migrate` will create migration to drop unique constraint and add index.

### API Contract Changes

**File**: `src/schemas/game-schema.ts`

Update `joinGameSchema`:
```typescript
export const joinGameSchema = z.object({
  gameId: z.string().cuid("Invalid game ID"),
  accessCode: z.string()
    .regex(/^[A-Z0-9]+$/, "Access code must be uppercase alphanumeric"),
});
```

Remove `resolveAccessCodeSchema` (no longer needed).

**File**: `src/lib/api/contracts/game.ts`

- Update `joinContract` to use new `joinGameSchema`
- Remove `resolveAccessCodeContract`
- Update `gameContract` export to remove `resolveAccessCode`

**File**: `src/lib/api/routers/game.ts`

- Update `join` procedure implementation to accept both `gameId` and `accessCode`
- Remove `resolveAccessCode` procedure implementation

### New Route Implementation

**File**: `src/app/join/[gameId]/page.tsx` (new)

- Server Component with `params: Promise<{ gameId: string }>` and `searchParams: Promise<{ code?: string }>`
- Await params and searchParams per Next.js 15 conventions
- Validate presence of `code` query param
- Call `requireValidatedSession()` for authentication
- Call `serverClient.game.join({ gameId, accessCode })`
- Redirect to `routes.game.pick(gameId)` on success
- Display error UI on failure with link to dashboard

**File**: `src/lib/routes.ts`

Update join route definition:
```typescript
/** Join game with access code */
join: (gameId: string, code: string) => `/join/${gameId}?code=${code}`,
```

### Dashboard UI Changes

**File**: `src/app/dashboard/page.tsx`

Add "Join Game" button that opens modal/dialog (or navigate to dedicated page).

**File**: `src/components/join-game-form.tsx` (new)

- Client Component with form inputs for gameId and accessCode
- Use `useMutation(orpc.game.join.mutationOptions())`
- Display loading state, success message, error validation
- Navigate to `routes.game.pick(gameId)` on success

### Signup Flow Changes

**File**: `src/app/signup/page.tsx`

- Update messaging when `?code` param present: "You'll join the game after signing in"
- No API calls in this component (pure UI)

**File**: `src/app/signup/callback/page.tsx`

- When `?code` param present:
  1. Query all games to find which gameId matches this accessCode (one-time lookup)
  2. Redirect to `/join/{gameId}?code={code}`
- When no `?code` param: Redirect to `/dashboard`

**File**: `src/app/signup/callback/join-game-handler.tsx`

- **DELETE** this file (logic replaced by `/join/[gameId]` route)

### Service Layer Changes

**File**: `src/lib/services/game-service.ts`

Update `join` method signature:
```typescript
async join(userId: string, gameId: string, accessCode: string): Promise<GameParticipant>
```

Implementation:
1. Query game with compound validation: `{ id: gameId, accessCode }`
2. Validate game exists (throw error if not found or accessCode mismatch)
3. Validate game status is OPEN or LIVE using `ts-pattern`
4. Check existing membership
5. Create GameParticipant if not exists
6. Return participant record

**File**: `src/lib/models/game-participant-model.ts`

- Existing `exists(userId: string, gameId: string)` method remains unchanged
- Existing `create(userId: string, gameId: string)` method remains unchanged

### Files Modified Summary

**Schema**:
- `prisma/schema.prisma` (remove @unique, add index)

**Contracts & Schemas**:
- `src/schemas/game-schema.ts` (update joinGameSchema, remove resolveAccessCodeSchema)
- `src/lib/api/contracts/game.ts` (update joinContract, remove resolveAccessCodeContract)

**Routers**:
- `src/lib/api/routers/game.ts` (update join procedure, remove resolveAccessCode)

**Services**:
- `src/lib/services/game-service.ts` (update join method signature and implementation)

**Routes**:
- `src/lib/routes.ts` (update join route function)
- `src/app/join/[gameId]/page.tsx` (new file)

**UI Components**:
- `src/app/dashboard/page.tsx` (add Join Game UI)
- `src/components/join-game-form.tsx` (new file)
- `src/app/signup/page.tsx` (update messaging)
- `src/app/signup/callback/page.tsx` (update redirect logic)
- `src/app/signup/callback/join-game-handler.tsx` (delete file)

## Acceptance Criteria

### Constitution Compliance

See `docs/constitutions/current/` for complete patterns. Key requirements:

**Architecture** (`architecture.md`):
- ✅ Services call models, never Prisma directly
- ✅ oRPC procedures call services, never models directly
- ✅ UI components use serverClient (Server Components) or orpc (Client Components)
- ✅ No business logic in models (validation only in service layer)

**Patterns** (`patterns.md`):
- ✅ Await `params` and `searchParams` in Next.js 15
- ✅ Use `requireValidatedSession()` for protected routes
- ✅ Use oRPC contract-first with `implement(contract)`
- ✅ Use centralized routes from `src/lib/routes.ts`
- ✅ Client Components use `useMutation(orpc.*.mutationOptions())`
- ✅ Use `ts-pattern` with `.exhaustive()` for discriminated unions

**Schema Rules** (`schema-rules.md`):
- ✅ Index on frequently queried fields (accessCode)
- ✅ Preserve existing @@unique constraints (GameParticipant)
- ✅ Follow naming conventions (camelCase fields, PascalCase models)

**Testing** (`testing.md`):
- ✅ TDD for service layer changes (write tests first)
- ✅ Test compound key validation (gameId + accessCode)
- ✅ Test error paths (invalid code, wrong game, status checks)

### Feature-Specific Criteria

**AC-1: Schema Migration**
- [ ] `Game.accessCode` has no `@unique` constraint
- [ ] `Game` model has `@@index([accessCode])`
- [ ] Migration runs successfully on dev database
- [ ] Existing games retain their access codes
- [ ] No duplicate accessCodes are created in seed data

**AC-2: Join API Validation**
- [ ] `/api/orpc/game.join` requires both `gameId` and `accessCode`
- [ ] Returns 400 if either parameter missing
- [ ] Returns 404 if game not found
- [ ] Returns 400 if accessCode doesn't match gameId
- [ ] Returns 400 if game status is SETUP or COMPLETED
- [ ] Returns existing GameParticipant if user already a member (idempotent)
- [ ] Creates new GameParticipant if user not a member and game is OPEN/LIVE

**AC-3: Join Route**
- [ ] `/join/{gameId}?code={code}` requires authentication
- [ ] Redirects to sign-in if not authenticated
- [ ] Calls join API with both parameters
- [ ] Redirects to `/game/{gameId}/pick` on success
- [ ] Displays error message on failure
- [ ] Error message includes link to dashboard

**AC-4: Dashboard Join UI**
- [ ] Dashboard page shows "Join Game" button
- [ ] Form accepts Game ID and Access Code inputs
- [ ] Validates inputs client-side before submission
- [ ] Shows loading state during API call
- [ ] Navigates to pick wizard on success
- [ ] Displays error message inline on failure

**AC-5: Signup Flow**
- [ ] `/signup?code={code}` displays invitation message
- [ ] `/signup/callback?code={code}` redirects to `/join/{gameId}?code={code}`
- [ ] Callback finds correct gameId for the access code
- [ ] Flow completes successfully for new users
- [ ] Flow completes successfully for existing users

**AC-6: Removed Code**
- [ ] `JoinGameHandler` component deleted
- [ ] `resolveAccessCode` API removed from contracts
- [ ] `resolveAccessCode` procedure removed from router
- [ ] `resolveAccessCodeSchema` removed from schemas
- [ ] No references to removed code remain in codebase

**AC-7: Error Handling**
- [ ] Invalid game ID → "Game not found"
- [ ] Wrong access code → "Invalid access code for this game"
- [ ] Game status SETUP → "This game is not yet open for joining"
- [ ] Game status COMPLETED → "This game is no longer accepting new players"
- [ ] Already a member → Succeeds silently, redirects to picks

## References

- **Architecture Patterns**: `docs/constitutions/current/architecture.md`
- **Next.js 15 Conventions**: `docs/constitutions/current/patterns.md#async-params-and-searchparams`
- **oRPC Contract Pattern**: `docs/constitutions/current/patterns.md#orpc-contract-first`
- **Authentication**: `docs/constitutions/current/patterns.md#edge-runtime-authentication`
- **Schema Design**: `docs/constitutions/current/schema-rules.md`
- **Testing Requirements**: `docs/constitutions/current/testing.md`
- **Centralized Routes**: `src/lib/routes.ts`
- **Game Status Enum**: `@prisma/client` (GameStatus = SETUP | OPEN | LIVE | COMPLETED)

## Migration Strategy

1. **Schema Migration First**: Run `pnpm db:migrate` to update database
2. **Update Contracts & Schemas**: Modify validation and contract definitions
3. **Service Layer**: Update game service join method
4. **API Router**: Update join procedure, remove resolveAccessCode
5. **New Join Route**: Create `/join/[gameId]` route
6. **Dashboard UI**: Add join game form component
7. **Signup Flow**: Update callback redirect logic
8. **Cleanup**: Remove JoinGameHandler and resolveAccessCode references
9. **Test**: Verify all join flows (direct link, dashboard, signup)

## Future Considerations

- **Share Links**: Generate shareable links in format `/join/{gameId}?code={code}` for social sharing
- **QR Codes**: Generate QR codes that encode the join URL
- **Access Code Generation**: Admin UI could suggest unique access codes within a game's event to avoid confusion
- **Invite Expiration**: Optional expiration date for access codes (requires schema change)
