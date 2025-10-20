# Mandatory Patterns

This document defines the required patterns and libraries that **must** be used throughout the codebase.

## Core Principles

1. **Type Safety First** - Leverage TypeScript's type system at every layer
2. **Exhaustive Handling** - Compiler ensures all cases are handled
3. **Validated Inputs** - All user inputs validated with Zod
4. **Clear Boundaries** - Respect layered architecture
5. **Server/Client Separation** - Explicit boundary between Server and Client Components
6. **No Type Assertions** - Avoid `as` keyword; use proper typing and validation instead

---

## Required Pattern: Server/Client Component Boundaries

**When:** Building Next.js UI components with interactivity

**Why:**
- Prevents hydration errors and runtime failures
- Optimizes bundle size (server-only code stays on server)
- Enables Server Component benefits (zero JS, direct DB access)
- Makes interactive elements explicit and intentional

### The Rules

#### Server Components (default)
- All components are Server Components by default
- Can directly call services, models, or fetch data
- Can use async/await for data fetching
- Can use server actions in form `action` prop
- **CANNOT** use event handlers (onClick, onChange, onSubmit function)
- **CANNOT** use React hooks (useState, useEffect, useContext)
- **CANNOT** use browser APIs (window, document, localStorage)

#### Client Components ("use client")
- Must have `"use client"` directive at top of file
- Can use event handlers and React hooks
- Can use browser APIs
- **CANNOT** directly import server-only code
- **CANNOT** be async functions
- Should be used sparingly for interactivity only

### Pattern: Reusable Client Components

Extract interactive elements into focused client components:

```typescript
// src/app/(admin)/admin/_components/confirm-delete-button.tsx
"use client";

type ConfirmDeleteButtonProps = {
  onDelete: () => Promise<void>;
  confirmMessage: string;
  buttonText: string;
  className?: string;
};

export function ConfirmDeleteButton({
  onDelete,
  confirmMessage,
  buttonText,
  className = "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700",
}: ConfirmDeleteButtonProps) {
  async function handleSubmit(_formData: FormData) {
    if (confirm(confirmMessage)) {
      await onDelete();
    }
  }

  return (
    <form action={handleSubmit}>
      <button type="submit" className={className}>
        {buttonText}
      </button>
    </form>
  );
}
```

**Usage in Server Component:**
```typescript
// src/app/(admin)/admin/works/[id]/page.tsx
import { ConfirmDeleteButton } from "@/app/(admin)/admin/_components/confirm-delete-button";

export default async function WorkDetailPage({ params }: Props) {
  const { id } = await params;
  const work = await workModel.findById(id);

  async function handleDelete() {
    "use server";
    await deleteWorkAction({ id });
    redirect("/admin/works");
  }

  return (
    <div>
      <h1>{work.title}</h1>
      <ConfirmDeleteButton
        onDelete={handleDelete}
        confirmMessage="Are you sure you want to delete this work?"
        buttonText="Delete Work"
      />
    </div>
  );
}
```

### Pattern: Filter/Select Client Components

Extract interactive form controls:

```typescript
// src/app/(admin)/admin/works/_components/type-filter.tsx
"use client";

import { WorkType } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";

export function TypeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") || "";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const type = e.target.value;
    if (type) {
      router.push(`/admin/works?type=${type}`);
    } else {
      router.push("/admin/works");
    }
  }

  return (
    <select value={currentType} onChange={handleChange}>
      <option value="">All Types</option>
      <option value={WorkType.FILM}>Film</option>
      <option value={WorkType.TV_SHOW}>TV Show</option>
    </select>
  );
}
```

### Pattern: Inline Server Action Wrappers

When using form actions in Server Components, extract FormData and call centralized actions:

```typescript
// src/app/(admin)/admin/works/[id]/page.tsx
export default async function WorkDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <form
      action={async (formData: FormData) => {
        "use server";

        // Extract FormData fields
        const title = formData.get("title");
        const type = formData.get("type");
        const year = formData.get("year");

        // Call centralized next-safe-action action
        await updateWorkAction({
          id,
          ...(title && { title: title as string }),
          ...(type && { type: type as WorkType }),
          ...(year && { year: Number(year) }),
        });

        // NO redirect() here - see below for redirect pattern
      }}
    >
      <input name="title" defaultValue={work.title} />
      <button type="submit">Update</button>
    </form>
  );
}
```

**Why this pattern:**
- Keeps form handling colocated with UI
- Still uses centralized next-safe-action for validation
- Inline wrapper only extracts FormData and calls validated action
- Simple mutations without redirects or complex error handling

### Pattern: Standalone Server Actions for Redirects

**IMPORTANT:** If you need to call `redirect()`, use a standalone server action function, NOT an inline form action.

```typescript
// src/app/(admin)/admin/works/[id]/page.tsx
export default async function WorkDetailPage({ params }: Props) {
  const { id } = await params;
  const work = await workModel.findById(id);

  // Standalone server action for delete with redirect
  async function handleDelete() {
    "use server";

    try {
      await deleteWorkAction({ id });
      redirect("/admin/works"); // ✅ redirect() in standalone function
    } catch (error) {
      // Foreign key constraint error will be caught here
      throw error;
    }
  }

  return (
    <div>
      <h1>{work.title}</h1>

      {/* Update form - no redirect needed */}
      <form action={async (formData: FormData) => {
        "use server";
        const title = formData.get("title");
        await updateWorkAction({ id, title: title as string });
        // ✅ No redirect - page stays on same route
      }}>
        <input name="title" defaultValue={work.title} />
        <button type="submit">Update</button>
      </form>

      {/* Delete with redirect - uses standalone function */}
      <ConfirmDeleteButton
        onDelete={handleDelete}
        confirmMessage="Are you sure?"
        buttonText="Delete Work"
      />
    </div>
  );
}
```

**Why redirects need standalone functions:**
- Next.js redirect() must be at the top level of a server action
- Inline form actions can't reliably handle redirects
- Standalone functions provide proper error boundaries
- Easier to test and reason about

### Common Mistakes

#### ❌ Event handlers in Server Components
```typescript
// ❌ BAD - onClick in Server Component
export default async function Page() {
  const items = await fetchItems();

  return (
    <button onClick={() => console.log("clicked")}>
      Click me
    </button>
  );
}
```

```typescript
// ✅ GOOD - Extract to client component
"use client";
export function ClickableButton() {
  return (
    <button onClick={() => console.log("clicked")}>
      Click me
    </button>
  );
}
```

#### ❌ Nested forms
```typescript
// ❌ BAD - HTML validation error
<form action={updateAction}>
  <input name="title" />
  <form action={deleteAction}>
    <button>Delete</button>
  </form>
</form>
```

```typescript
// ✅ GOOD - Separate forms
<form action={updateAction}>
  <input name="title" />
  <button>Update</button>
</form>

<form action={deleteAction} className="mt-4">
  <button>Delete</button>
</form>
```

#### ❌ Async client components
```typescript
// ❌ BAD - Client components cannot be async
"use client";
export default async function Page() {
  const data = await fetch("/api/data");
  return <div>{data}</div>;
}
```

```typescript
// ✅ GOOD - Fetch in Server Component, pass to Client Component
export default async function Page() {
  const data = await fetch("/api/data");
  return <ClientComponent data={data} />;
}

"use client";
export function ClientComponent({ data }: { data: Data }) {
  const [count, setCount] = useState(0);
  return <div>{data} - {count}</div>;
}
```

### Linter Configuration

Add Biome rules to catch Server/Client violations:

```jsonc
// biome.jsonc
{
  "linter": {
    "rules": {
      "nursery": {
        "noNextAsyncClientComponent": "error",
        "noSecrets": "error",
        "useReactFunctionComponents": "error",
        "useExhaustiveSwitchCases": "error"
      }
    }
  }
}
```

---

## Required Pattern: Centralized Routes

**When:** ANY navigation, redirect, or URL generation

**Why:**
- Single source of truth for all URLs
- Type-safe route parameters
- Easy refactoring (change route in one place)
- Prevents typos in route strings
- Makes URL structure explicit and discoverable

### Setup

```typescript
// src/lib/routes.ts
export const routes = {
  home: () => "/",
  signIn: () => "/sign-in",
  dashboard: () => "/dashboard",

  game: {
    pick: (gameId: string, categoryId?: string) =>
      categoryId ? `/game/${gameId}/pick?category=${categoryId}` : `/game/${gameId}/pick`,
    leaderboard: (gameId: string) => `/game/${gameId}/leaderboard`,
  },

  admin: {
    events: {
      index: () => "/admin/events",
      detail: (eventId: string) => `/admin/events/${eventId}`,
    },
  },
} as const;
```

### Usage in Server Components

```typescript
// ❌ BAD - hardcoded route string
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();
  if (!session) {
    redirect("/sign-in"); // Hardcoded!
  }

  const game = await getGame();
  if (!game) {
    redirect("/dashboard"); // Hardcoded!
  }

  return <div>...</div>;
}
```

```typescript
// ✅ GOOD - centralized routes
import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

export default async function Page() {
  const session = await auth();
  if (!session) {
    redirect(routes.signIn());
  }

  const game = await getGame();
  if (!game) {
    redirect(routes.dashboard());
  }

  return <div>...</div>;
}
```

### Usage in Client Components

```typescript
// ❌ BAD - hardcoded route string
"use client";
import { useRouter } from "next/navigation";

export function GameButton({ gameId }: { gameId: string }) {
  const router = useRouter();

  return (
    <button onClick={() => router.push(`/game/${gameId}/pick`)}>
      Start Picks
    </button>
  );
}
```

```typescript
// ✅ GOOD - centralized routes
"use client";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";

export function GameButton({ gameId }: { gameId: string }) {
  const router = useRouter();

  return (
    <button onClick={() => router.push(routes.game.pick(gameId))}>
      Start Picks
    </button>
  );
}
```

### Usage in Server Actions

```typescript
// ❌ BAD - hardcoded route string
export const deleteGameAction = adminAction
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    await gameService.deleteGame(parsedInput.id);
    redirect("/admin/games");
  });
```

```typescript
// ✅ GOOD - centralized routes
import { routes } from "@/lib/routes";

export const deleteGameAction = adminAction
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    await gameService.deleteGame(parsedInput.id);
    redirect(routes.admin.games.index());
  });
```

### Usage in Links

```typescript
// ❌ BAD - hardcoded route string
<Link href={`/game/${game.id}/pick`}>
  Make Picks
</Link>
```

```typescript
// ✅ GOOD - centralized routes
import { routes } from "@/lib/routes";

<Link href={routes.game.pick(game.id)}>
  Make Picks
</Link>
```

### Benefits

- **Refactoring**: Change `/game/[gameId]/pick` to `/games/[id]/picks` in one place
- **Type Safety**: TypeScript ensures you provide required parameters
- **Autocomplete**: IDE suggests available routes
- **No Typos**: Compile error if route doesn't exist
- **Discoverability**: New developers can explore routes by reading routes.ts

### Migration Guide

**Before:**
```typescript
redirect("/game/" + gameId + "/pick");
router.push(`/admin/events/${eventId}`);
<Link href={`/dashboard`}>Dashboard</Link>
```

**After:**
```typescript
import { routes } from "@/lib/routes";

redirect(routes.game.pick(gameId));
router.push(routes.admin.events.detail(eventId));
<Link href={routes.dashboard()}>Dashboard</Link>
```

---

## Required Pattern: next-safe-action

**When:** ALL server actions without exception

**Why:**
- Automatic input validation with Zod
- Type-safe middleware (auth, logging)
- Consistent error handling
- Input/output type inference

### Setup

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

### Usage

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

---

## Required Pattern: ts-pattern

**When:** ANY discriminated union or state machine

**Why:**
- Exhaustive matching (compile error if case missing)
- Automatic type narrowing
- More expressive than switch/if-else
- Enforces handling all paths

### Event Status State Machine

```typescript
import { match } from 'ts-pattern'

export function canSubmitPicks(event: Event): boolean {
  return match(event.status)
    .with('SETUP', () => false)
    .with('OPEN', () => new Date() < event.picksLockAt)
    .with('LIVE', () => false)
    .with('COMPLETED', () => false)
    .exhaustive() // ✅ Compile error if status added to enum!
}
```

### WebSocket Message Routing

```typescript
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
```

### Result Type Handling

```typescript
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
```

### Guard Patterns

```typescript
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

## Required Pattern: Proper Typing (No Type Assertions)

**When:** ALL code that handles data

**Why:**
- Type assertions (`as`) bypass TypeScript's type checking
- Silent runtime errors when assertions are wrong
- Masks underlying type issues
- Validation ensures runtime safety
- Proper types document expected data shape

### The Rule

**Avoid `as` keyword** - Use proper typing, validation, or type guards instead.

### Pattern: Zod for Runtime Validation

```typescript
// ❌ BAD - Type assertion without validation
const formData = new FormData();
const title = formData.get("title") as string; // Could be null!
const year = formData.get("year") as number;   // Actually a string!

await updateWork({ title, year });
```

```typescript
// ✅ GOOD - Validate with Zod
import { z } from "zod";

const formDataSchema = z.object({
  title: z.string().min(1),
  year: z.coerce.number().int().min(1900),
});

const rawData = {
  title: formData.get("title"),
  year: formData.get("year"),
};

const validated = formDataSchema.parse(rawData); // Throws if invalid
await updateWork(validated); // TypeScript knows types are correct
```

### Pattern: Type Guards

```typescript
// ❌ BAD - Type assertion
function processValue(value: unknown) {
  const str = value as string; // Unsafe!
  return str.toUpperCase();
}
```

```typescript
// ✅ GOOD - Type guard
function processValue(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Expected string");
  }
  // TypeScript knows value is string here
  return value.toUpperCase();
}
```

### Pattern: Discriminated Unions with ts-pattern

```typescript
// ❌ BAD - Type assertion to narrow
type Result = { success: true; data: string } | { success: false; error: string };

function handleResult(result: Result) {
  if (result.success) {
    // TypeScript doesn't narrow automatically with just if
    const data = (result as { success: true; data: string }).data;
    return data;
  }
}
```

```typescript
// ✅ GOOD - ts-pattern automatically narrows
import { match } from "ts-pattern";

function handleResult(result: Result) {
  return match(result)
    .with({ success: true }, ({ data }) => data) // TypeScript knows data exists
    .with({ success: false }, ({ error }) => {
      throw new Error(error);
    })
    .exhaustive();
}
```

### Pattern: Proper Function Return Types

```typescript
// ❌ BAD - Force type with assertion
function getUser(id: string) {
  const user = db.findUser(id); // Could be null
  return user as User; // Lying to TypeScript!
}
```

```typescript
// ✅ GOOD - Honest return type
function getUser(id: string): User | null {
  return db.findUser(id); // Caller handles null case
}

// Or throw if null not expected
function getUserOrThrow(id: string): User {
  const user = db.findUser(id);
  if (!user) {
    throw new Error(`User ${id} not found`);
  }
  return user; // TypeScript knows it's User
}
```

### Pattern: Prisma Generated Types

```typescript
// ❌ BAD - Recreating types
async function getGame(id: string) {
  const game = await prisma.game.findUnique({ where: { id } });
  return game as { id: string; name: string; status: string }; // Duplication!
}
```

```typescript
// ✅ GOOD - Use Prisma types
import type { Game } from "@prisma/client";

async function getGame(id: string): Promise<Game | null> {
  return prisma.game.findUnique({ where: { id } });
}

// For partial selects
import type { Prisma } from "@prisma/client";

async function getGameSummary(id: string) {
  return prisma.game.findUnique({
    where: { id },
    select: { id: true, name: true, status: true },
  });
}

// Return type is automatically: { id: string; name: string; status: GameStatus } | null
```

### Pattern: FormData Handling

```typescript
// ❌ BAD - Direct assertion
async function handleSubmit(formData: FormData) {
  "use server";

  const title = formData.get("title") as string;
  const year = formData.get("year") as string;

  await updateAction({ title, year: Number(year) }); // year could be null!
}
```

```typescript
// ✅ GOOD - Validate before using
async function handleSubmit(formData: FormData) {
  "use server";

  const title = formData.get("title");
  const year = formData.get("year");

  // Let action validate via Zod schema
  await updateAction({
    title: title ?? "",
    year: year ? Number(year) : 0,
  });
  // Or validate here with Zod first
}
```

### When `as` is Acceptable

There are rare cases where `as` is acceptable:

1. **Type narrowing when you have external guarantees:**
```typescript
// Library types that are too narrow
const response = await fetch(url);
const data = await response.json() as ApiResponse; // json() returns 'any'
```

2. **`as const` for readonly values:**
```typescript
// ✅ GOOD - as const is fine
const routes = {
  home: "/",
  dashboard: "/dashboard",
} as const;
```

3. **When TypeScript type system limitation requires it AND you have validation:**
```typescript
// After Zod validation, narrowing to more specific type
const validated = schema.parse(data);
const specific = validated as SpecificSubtype; // Only if validated and necessary
```

**Rule of thumb:** If you're using `as`, ask:
1. Can I validate this with Zod instead?
2. Can I use a type guard instead?
3. Can I fix the source to have proper types?
4. Am I 100% certain this assertion is safe?

If you can't answer "yes" to #4, don't use `as`.

---

## Prohibited Patterns

### ❌ NO: Type assertions without validation

```typescript
// ❌ BAD - Unsafe type assertions
const title = formData.get("title") as string;
const user = getUser() as User;
const data = response.json() as ApiResponse;
```

```typescript
// ✅ GOOD - Validate or use type guards
const title = formData.get("title");
if (typeof title !== "string") throw new Error("Invalid title");

const user = getUser();
if (!user) throw new Error("User not found");

const rawData = await response.json();
const data = apiResponseSchema.parse(rawData);
```

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

## Layer Pattern Examples

### Models Layer

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

### Services Layer

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

### Actions Layer

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

## Migration Guides

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
- [ ] No type assertions (`as`) without validation
- [ ] All `as` usage has clear justification comment
- [ ] All inputs validated with Zod
- [ ] All outputs properly typed
- [ ] Function return types explicitly declared
- [ ] No hardcoded route strings (use `src/lib/routes.ts`)

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
