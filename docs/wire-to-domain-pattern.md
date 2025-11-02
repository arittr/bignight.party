# Wire-to-Domain Transformation Pattern

**Single Schema, Clear Boundaries**

This pattern eliminates type duplication by using one schema (wire format) across forms and API, with transformation happening at the router boundary.

## Architecture

```
Form (wire) → oRPC Router (transform) → Service (domain) → Model (Prisma)
```

- **Wire Format**: JSON-serializable types (strings, numbers, booleans)
- **Domain Types**: Rich types (Date, custom objects)
- **Transformation Boundary**: oRPC routers

## The Problem We Solved

### Before (3 Schema Versions)

```ts
// ❌ Backend schema with .coerce
export const gameCreateSchema = z.object({
  picksLockAt: z.coerce.date().optional(),
});

// ❌ Form schema (inline duplication)
z.object({
  picksLockAt: z.string().optional(),
});

// ❌ Contract schema
oc.input(gameCreateSchema)
```

**Issues**:
- Duplication across 3 places
- `.coerce()` doesn't work in React Hook Form
- Confusing which schema to use where

### After (Single Schema)

```ts
// ✅ Wire format - single source of truth
export const gameCreateSchema = z.object({
  picksLockAt: z.string().datetime().optional(),
});
```

**Benefits**:
- ✅ One schema, no duplication
- ✅ Works everywhere (forms, contracts, validation)
- ✅ Clear transformation at router boundary

## Implementation

### 1. Schema = Wire Format

```ts
// src/schemas/game-schema.ts
import { z } from "zod";

/**
 * Game Schemas - Wire Format
 *
 * These schemas validate the wire format (JSON/HTTP) that comes from forms and clients.
 * Dates are ISO 8601 strings, not Date objects.
 * Routers transform wire format → domain types before passing to services.
 */

export const gameCreateSchema = z.object({
  name: z.string().min(1, "Game name is required"),
  eventId: z.string().cuid("Invalid event ID"),
  accessCode: z
    .string()
    .min(4, "Access code must be at least 4 characters")
    .regex(/^[A-Z0-9]+$/, "Access code must be uppercase alphanumeric"),
  picksLockAt: z.string().datetime().optional(), // ✅ ISO 8601 string
});

export type GameCreateInput = z.infer<typeof gameCreateSchema>;
// Type: { name: string; eventId: string; accessCode: string; picksLockAt?: string }
```

**Key Points**:
- Use `z.string().datetime()` for date validation (validates ISO 8601 format)
- No `.coerce()` or `.default()` - those are domain logic
- Schema represents what actually travels over the wire

### 2. Transformation Utilities

```ts
// src/lib/api/utils/wire-to-domain.ts

/**
 * Parse an optional ISO 8601 datetime string to Date object
 *
 * Assumes Zod has already validated the string format with z.string().datetime()
 */
export function parseOptionalDate(iso?: string): Date | undefined {
  return iso ? new Date(iso) : undefined;
}

export function parseDate(iso: string): Date {
  return new Date(iso);
}

export function parseOptionalDateOrNull(iso?: string): Date | null {
  return iso ? new Date(iso) : null;
}
```

**Why This Is Safe**:
- Zod validates the string is valid ISO 8601 before router is called
- If string passes Zod, `new Date()` is guaranteed to work
- No runtime validation needed in utilities

### 3. Router = Transformation Boundary

```ts
// src/lib/api/routers/admin.ts
import { parseOptionalDate } from "@/lib/api/utils/wire-to-domain";
import * as gameService from "@/lib/services/game-service";

export const adminRouter = implement(adminContract).router({
  games: {
    create: os.games.create.use(adminMiddleware).handler(async ({ input }) => {
      const { eventId, picksLockAt, ...data } = input;

      // Transform wire → domain at the API boundary
      const game = await gameService.createGame({
        ...data,
        picksLockAt: parseOptionalDate(picksLockAt), // string → Date
        event: { connect: { id: eventId } },
      });

      return game;
    }),
  },
});
```

**Pattern**:
1. Destructure fields that need transformation
2. Call transformation utilities
3. Pass domain types to service

### 4. Service = Domain Types

```ts
// src/lib/services/game-service.ts
import type { Prisma } from "@prisma/client";

/**
 * Create a new game
 *
 * Accepts domain types (Date objects, enums, etc.)
 */
export async function createGame(data: Prisma.GameCreateInput) {
  return gameModel.create(data);
}
```

**Service Signature**:
- `Prisma.GameCreateInput` includes `picksLockAt?: Date | null`
- Service works with clean domain types
- No wire format concerns

### 5. Form = Wire Format

```tsx
// src/components/admin/games/create-game-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { GameCreateInput } from "@/schemas/game-schema";
import { gameCreateSchema } from "@/schemas/game-schema";
import { orpc } from "@/lib/api/client";

export function CreateGameForm({ events }: CreateGameFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GameCreateInput>({
    resolver: zodResolver(gameCreateSchema), // ✅ Same schema!
  });

  const createGame = useMutation(
    orpc.admin.games.create.mutationOptions({
      onSuccess: () => router.push("/admin/games"),
    })
  );

  const onSubmit = async (data: GameCreateInput) => {
    await createGame.mutateAsync(data); // ✅ No transformation needed!
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("picksLockAt")} type="datetime-local" />
      {errors.picksLockAt && <p>{errors.picksLockAt.message}</p>}
    </form>
  );
}
```

**Form Benefits**:
- ✅ No inline schema duplication
- ✅ No manual transformation in onSubmit
- ✅ Type-safe with `GameCreateInput`
- ✅ Validation errors from Zod

### 6. Contract = Wire Format

```ts
// src/lib/api/contracts/admin.ts
import { oc } from "@orpc/contract";
import { gameCreateSchema } from "@/schemas/game-schema";

export const createGameContract = oc
  .input(gameCreateSchema) // ✅ Same schema!
  .output(z.object({
    id: z.string(),
    name: z.string(),
    // ... output shape
  }));
```

## Type Flow

```
HTML Form
  ↓ (datetime-local returns string)
GameCreateInput { picksLockAt?: string }
  ↓ (Zod validation)
oRPC Router
  ↓ (parseOptionalDate transforms)
Prisma.GameCreateInput { picksLockAt?: Date }
  ↓
Service (domain logic)
  ↓
Model (Prisma query)
  ↓
Database (DateTime column)
```

## Common Patterns

### Optional Dates

```ts
// Schema
picksLockAt: z.string().datetime().optional()

// Router
picksLockAt: parseOptionalDate(input.picksLockAt)

// Service
data: Prisma.GameCreateInput // picksLockAt?: Date | null
```

### Required Dates

```ts
// Schema
eventDate: z.string().datetime()

// Router
eventDate: parseDate(input.eventDate)

// Service
data: { eventDate: Date }
```

### Nullable Dates (for database null)

```ts
// Schema
completedAt: z.string().datetime().optional()

// Router
completedAt: parseOptionalDateOrNull(input.completedAt)

// Service
data: { completedAt: Date | null }
```

### Enums

```ts
// Schema (wire = string literal)
status: z.enum(["SETUP", "OPEN", "LIVE", "COMPLETED"]).optional()

// Router (no transformation needed for enums)
status: input.status

// Service (Prisma enum type)
data: { status?: GameStatus }
```

## Migration Guide

### Updating Existing Schemas

1. **Remove `.coerce()`**:
```ts
// Before
picksLockAt: z.coerce.date().optional()

// After
picksLockAt: z.string().datetime().optional()
```

2. **Remove `.default()`**:
```ts
// Before
status: z.nativeEnum(GameStatus).default(GameStatus.SETUP)

// After
// (omit field from schema, set default in service/router)
```

3. **Update enum validation**:
```ts
// Before
status: z.nativeEnum(GameStatus)

// After
status: z.enum(["SETUP", "OPEN", "LIVE", "COMPLETED"])
```

### Updating Routers

```ts
// Before (no transformation)
const game = await gameService.createGame(input);

// After (transform dates)
const { picksLockAt, ...data } = input;
const game = await gameService.createGame({
  ...data,
  picksLockAt: parseOptionalDate(picksLockAt),
});
```

### Updating Forms

```ts
// Before (inline schema)
useForm({
  resolver: zodResolver(
    z.object({
      picksLockAt: z.string().optional(),
    })
  ),
});

// After (wire schema)
useForm<GameCreateInput>({
  resolver: zodResolver(gameCreateSchema),
});
```

## FAQ

### Why not transform in the service?

**Service should work with domain types**, not wire format. Services might be called from:
- HTTP routes
- Server Components
- Background jobs
- Tests

Each caller has different input types. The router is the HTTP boundary, so that's where wire → domain transformation belongs.

### Why not use `.coerce()` everywhere?

`.coerce()` doesn't work in React Hook Form - it expects raw input types. We'd need separate schemas anyway.

### What about validation errors for invalid dates?

`z.string().datetime()` validates the ISO 8601 format. Invalid formats fail Zod validation before reaching the router.

### Can I still use TypeScript's Date type in tests?

No - tests should use wire format (strings) to match production:

```ts
// ❌ Don't do this
await createGame({ picksLockAt: new Date() });

// ✅ Do this
await createGame({ picksLockAt: "2025-01-01T12:00:00.000Z" });
```

This ensures tests validate the same path as production.

### What about other transformations (numbers, arrays, etc.)?

Same pattern:
- Schema validates wire format
- Router transforms to domain
- Service accepts domain types

```ts
// Wire schema
quantity: z.string().regex(/^\d+$/)

// Router
quantity: Number.parseInt(input.quantity)

// Service
data: { quantity: number }
```

## Checklist

When implementing wire-to-domain pattern:

- [ ] Schema uses wire format (`z.string().datetime()` not `z.coerce.date()`)
- [ ] Schema has no `.default()` (defaults set in service/router)
- [ ] Router imports transformation utilities
- [ ] Router transforms before calling service
- [ ] Service signature uses domain types (`Date` not `string`)
- [ ] Form uses wire schema directly
- [ ] Form onSubmit sends data as-is (no transformation)
- [ ] Contract reuses wire schema
- [ ] Tests use wire format (ISO strings, not Date objects)

## Benefits Summary

✅ **Single source of truth** - One schema, no duplication
✅ **Type safety** - Full end-to-end from form to database
✅ **Clear boundaries** - Wire format vs. domain types explicit
✅ **Works everywhere** - Forms, contracts, validation all use same schema
✅ **Easy to maintain** - Change validation in one place
✅ **Follows REST patterns** - JSON API accepts strings, transforms internally
✅ **Testable** - Tests use wire format like production

## Trade-offs

❌ **Manual transformation** - Each date field needs `parseOptionalDate()` in router
❌ **Two type definitions** - Wire type (`string`) and domain type (`Date`) both exist

**Why we accept this**: The transformation is LOCAL (one line per field in router) while schema duplication would be GLOBAL (spread across files). The benefit of single schema outweighs the cost of explicit transformation.
