# Mandatory Architecture Patterns

This document defines the required patterns and libraries that **must** be used throughout the codebase.

## Core Principles

1. **Type Safety First** - Leverage TypeScript's type system at every layer
2. **Exhaustive Handling** - Compiler ensures all cases are handled
3. **Validated Inputs** - All user inputs validated with Zod
4. **Clear Boundaries** - Respect layered architecture

---

## Required Libraries

### next-safe-action

**When:** All server actions

**Why:**
- Automatic input validation with Zod
- Type-safe middleware (auth, logging)
- Consistent error handling
- Input/output type inference

**How to use:**

```typescript
// src/lib/actions/safe-action.ts
import { createSafeActionClient } from 'next-safe-action'
import { auth } from '@/lib/auth/config'

// Base action client
export const action = createSafeActionClient()

// Authenticated action client
export const authenticatedAction = createSafeActionClient({
  async middleware() {
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized')
    }
    return { userId: session.user.id, userRole: session.user.role }
  },
})

// Admin action client
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

```typescript
// src/lib/actions/pick-actions.ts
import { authenticatedAction } from './safe-action'
import { pickSchema } from '@/schemas/pick-schema'
import { pickService } from '@/lib/services/pick-service'

export const submitPickAction = authenticatedAction
  .schema(pickSchema)
  .action(async ({ parsedInput, ctx }) => {
    // parsedInput is fully validated and typed
    // ctx.userId is available from middleware
    return pickService.submitPick(ctx.userId, parsedInput)
  })
```

```typescript
// In a client component
'use client'
import { useAction } from 'next-safe-action/hooks'
import { submitPickAction } from '@/lib/actions/pick-actions'

export function PickForm() {
  const { execute, status, data, serverError } = useAction(submitPickAction)

  const handleSubmit = async (formData: FormData) => {
    const result = await execute({
      categoryId: formData.get('categoryId'),
      nomineeId: formData.get('nomineeId'),
    })

    if (result?.serverError) {
      // Handle error
    }
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

### ts-pattern

**When:** Any discriminated union or state machine

**Why:**
- Exhaustive matching (compile error if case missing)
- Automatic type narrowing
- More expressive than switch/if-else
- Enforces handling all paths

**How to use:**

```typescript
import { match } from 'ts-pattern'

// Event status state machine
export function canSubmitPicks(event: Event): boolean {
  return match(event.status)
    .with('SETUP', () => false)
    .with('OPEN', () => new Date() < event.picksLockAt)
    .with('LIVE', () => false)
    .with('COMPLETED', () => false)
    .exhaustive() // ✅ Compile error if status added to enum!
}

// WebSocket message routing
export function handleWebSocketMessage(msg: WebSocketMessage) {
  match(msg)
    .with({ type: 'PICK_SUBMITTED' }, (data) => {
      // TypeScript knows data.pickId exists
      handlePickSubmitted(data.pickId)
    })
    .with({ type: 'CATEGORY_REVEALED' }, (data) => {
      // TypeScript knows data.categoryId exists
      handleCategoryRevealed(data.categoryId)
    })
    .with({ type: 'REACTION_SENT' }, (data) => {
      // TypeScript knows data.emoji exists
      handleReaction(data.emoji, data.userId)
    })
    .exhaustive() // ✅ Compile error if new message type added!
}

// Result type handling
type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E }

export function unwrapResult<T>(result: Result<T, Error>): T {
  return match(result)
    .with({ success: true }, ({ data }) => data)
    .with({ success: false }, ({ error }) => {
      throw error
    })
    .exhaustive()
}

// Guard patterns
export function getEventMessage(event: Event): string {
  return match(event)
    .with({ status: 'SETUP' }, () => 'Event is being set up')
    .with({ status: 'OPEN' }, (e) => `Picks close ${e.picksLockAt}`)
    .with({ status: 'LIVE' }, () => 'Ceremony in progress!')
    .with({ status: 'COMPLETED' }, () => 'Event complete')
    .exhaustive()
}
```

---

## Prohibited Patterns

### ❌ NO: Switch statements on unions

```typescript
// ❌ BAD - Easy to forget a case
function canSubmit(status: EventStatus) {
  switch (status) {
    case 'SETUP':
      return false
    case 'OPEN':
      return true
    // Oops! Forgot LIVE and COMPLETED - no compile error!
  }
}
```

```typescript
// ✅ GOOD - Compile error if case missing
function canSubmit(status: EventStatus) {
  return match(status)
    .with('SETUP', () => false)
    .with('OPEN', () => true)
    .with('LIVE', () => false)
    .with('COMPLETED', () => false)
    .exhaustive() // Compiler forces exhaustiveness
}
```

### ❌ NO: Raw server actions

```typescript
// ❌ BAD - No validation, no types, no error handling
'use server'
export async function submitPick(data: unknown) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  // data is unknown - easy to make mistakes!
  return prisma.pick.create({ data: data as any })
}
```

```typescript
// ✅ GOOD - Validated, typed, safe
export const submitPickAction = authenticatedAction
  .schema(pickSchema)
  .action(async ({ parsedInput, ctx }) => {
    // parsedInput is validated and typed
    return pickService.submitPick(ctx.userId, parsedInput)
  })
```

### ❌ NO: Prisma in services

```typescript
// ❌ BAD - Service layer doing DB queries
export async function submitPick(userId: string, data: PickInput) {
  // Don't do this!
  const pick = await prisma.pick.create({
    data: { userId, ...data },
  })
  return pick
}
```

```typescript
// ✅ GOOD - Service calls model layer
export async function submitPick(userId: string, data: PickInput) {
  // Validate business rules
  await validatePicksOpen(data.eventId)

  // Call model layer for DB access
  const pick = await pickModel.create({
    userId,
    ...data,
  })

  // Emit events
  emitPickSubmitted(pick)

  return pick
}
```

### ❌ NO: Business logic in models

```typescript
// ❌ BAD - Model layer doing business logic
export async function createPick(userId: string, data: PickData) {
  // Don't validate business rules here!
  const event = await prisma.event.findUnique({
    where: { id: data.eventId },
  })

  if (event.status !== 'OPEN') {
    throw new Error('Picks are closed')
  }

  return prisma.pick.create({ data: { userId, ...data } })
}
```

```typescript
// ✅ GOOD - Model layer only does data access
export async function createPick(data: PickData) {
  // Just create it - validation is service layer's job
  return prisma.pick.create({ data })
}
```

---

## Layer Boundaries

### Models Layer (`src/lib/models/`)

**Allowed:**
- Import `@prisma/client`
- Import `src/lib/db/prisma`
- Import `src/types/`
- Pure functions only

**Not Allowed:**
- Import services
- Import actions
- Import `next/*`
- Business logic
- Validation logic

**Example:**
```typescript
// src/lib/models/pick.ts
import { prisma } from '@/lib/db/prisma'
import type { Pick, Prisma } from '@prisma/client'

export async function create(data: Prisma.PickCreateInput): Promise<Pick> {
  return prisma.pick.create({ data })
}

export async function findByUserId(userId: string): Promise<Pick[]> {
  return prisma.pick.findMany({ where: { userId } })
}

export async function deleteById(id: string): Promise<void> {
  await prisma.pick.delete({ where: { id } })
}
```

### Services Layer (`src/lib/services/`)

**Allowed:**
- Import models
- Import other services
- Import `src/types/`
- Import `ts-pattern`
- Import `zod`
- Business logic
- Validation logic
- WebSocket emits

**Not Allowed:**
- Import `@prisma/client` directly
- Import `next/*`
- Import actions
- Direct Prisma queries

**Example:**
```typescript
// src/lib/services/pick-service.ts
import { match } from 'ts-pattern'
import * as pickModel from '@/lib/models/pick'
import * as eventModel from '@/lib/models/event'
import { socketServer } from '@/lib/websocket/server'

export async function submitPick(userId: string, data: PickInput) {
  // Business logic: validate event status
  const event = await eventModel.findById(data.eventId)

  const isAllowed = match(event.status)
    .with('OPEN', () => new Date() < event.picksLockAt)
    .otherwise(() => false)

  if (!isAllowed) {
    throw new Error('Picks are closed')
  }

  // Data access: call model layer
  const pick = await pickModel.create({
    userId,
    categoryId: data.categoryId,
    nomineeId: data.nomineeId,
  })

  // Side effects: emit events
  socketServer
    .to(data.eventId)
    .emit('pick:submitted', { userId, pickId: pick.id })

  return pick
}
```

### Actions Layer (`src/lib/actions/`)

**Allowed:**
- Import services
- Import `next-safe-action`
- Import schemas
- Import auth
- Auth checks
- Call services

**Not Allowed:**
- Import models directly
- Import `@prisma/client`
- Business logic
- Direct Prisma queries

**Example:**
```typescript
// src/lib/actions/pick-actions.ts
import { authenticatedAction } from './safe-action'
import { pickSchema } from '@/schemas/pick-schema'
import * as pickService from '@/lib/services/pick-service'

export const submitPickAction = authenticatedAction
  .schema(pickSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Just call service - auth already handled by middleware
    return pickService.submitPick(ctx.userId, parsedInput)
  })
```

---

## Code Review Checklist

When reviewing PRs, verify:

### Server Actions
- [ ] Uses `createSafeActionClient()`
- [ ] Has Zod schema validation
- [ ] Returns typed result
- [ ] Uses middleware for auth/permissions
- [ ] Calls service layer (not models directly)

### Pattern Matching
- [ ] All discriminated unions use `ts-pattern`
- [ ] All matches call `.exhaustive()`
- [ ] No switch statements on union types
- [ ] No long if-else chains for type checking

### Layer Boundaries
- [ ] No Prisma imports outside `src/lib/models/`
- [ ] No business logic in models
- [ ] No direct Prisma queries in services
- [ ] No `next/*` imports in services/models
- [ ] Actions only call services, not models

### Type Safety
- [ ] No `any` types (Biome enforces this)
- [ ] No type assertions without validation
- [ ] All inputs validated with Zod
- [ ] All outputs properly typed

---

## Migration Guide

### From raw server actions to next-safe-action

**Before:**
```typescript
'use server'
export async function updatePick(data: unknown) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  // Unsafe!
  return prisma.pick.update({
    where: { id: data.id },
    data: data,
  })
}
```

**After:**
```typescript
export const updatePickAction = authenticatedAction
  .schema(pickSchema)
  .action(async ({ parsedInput, ctx }) => {
    return pickService.updatePick(ctx.userId, parsedInput)
  })
```

### From switch to ts-pattern

**Before:**
```typescript
function getMessage(status: EventStatus) {
  switch (status) {
    case 'SETUP':
      return 'Setting up...'
    case 'OPEN':
      return 'Open for picks'
    // Missing cases - no error!
  }
}
```

**After:**
```typescript
function getMessage(status: EventStatus) {
  return match(status)
    .with('SETUP', () => 'Setting up...')
    .with('OPEN', () => 'Open for picks')
    .with('LIVE', () => 'Live!')
    .with('COMPLETED', () => 'Complete')
    .exhaustive() // Compile error if missing!
}
```

---

## Benefits

### Type Safety
- ✅ Compiler catches missing cases
- ✅ Automatic type narrowing
- ✅ Input/output types inferred

### Maintainability
- ✅ Clear layer boundaries
- ✅ Easy to test
- ✅ Consistent patterns

### Developer Experience
- ✅ Autocomplete works everywhere
- ✅ Refactoring is safe
- ✅ Compile errors catch bugs early

### Security
- ✅ All inputs validated
- ✅ Auth handled consistently
- ✅ No SQL injection (Prisma + validation)
