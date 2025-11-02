# Admin Form Pattern - React Hook Form + oRPC + TanStack Query

This document describes the recommended pattern for admin forms using React Hook Form, Zod validation, and oRPC mutations.

## Related Documentation

See [Wire-to-Domain Pattern](./wire-to-domain-pattern.md) for the complete schema architecture.

## Architecture

- **Page (Server Component)**: Fetches data, renders layout
- **Form (Client Component)**: Handles interactivity, validation, submission
- **oRPC**: Type-safe API calls with TanStack Query integration
- **Zod**: Single source of truth for validation (wire format)
- **Router**: Transforms wire format → domain types

## Key Benefits

✅ **Single schema** - One Zod schema used everywhere (forms, contracts, routers)
✅ **Type safety end-to-end** - From form → oRPC → router → service → database
✅ **Better UX** - Real-time validation, loading states, error handling
✅ **Less boilerplate** - No manual form state management or duplicate schemas

## Example: Create Game Form

### Before (Server Action)

```tsx
// app/(admin)/admin/games/new/page.tsx
export default async function NewGamePage() {
  const events = await eventModel.findAll();

  async function handleCreateGame(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const accessCode = formData.get("accessCode") as string;
    // ... manual validation, type assertions, error handling

    await serverClient.admin.games.create({ name, accessCode });
    redirect("/admin/games");
  }

  return (
    <form action={handleCreateGame}>
      <input
        name="accessCode"
        minLength={4}  {/* ❌ Duplicate validation */}
        pattern="[A-Z0-9]+"
        required
      />
      {/* No field-level errors, no loading state */}
    </form>
  );
}
```

### After (React Hook Form + oRPC)

#### 1. Page (Server Component) - Data Fetching

```tsx
// app/(admin)/admin/games/new/page.tsx
import { CreateGameForm } from "@/components/admin/games/create-game-form";
import * as eventModel from "@/lib/models/event";

export default async function NewGamePage() {
  const events = await eventModel.findAll();

  return (
    <div className="p-8">
      <h1>Create New Game</h1>
      <CreateGameForm events={events} />
    </div>
  );
}
```

#### 2. Form Component (Client Component) - Interactivity

```tsx
// components/admin/games/create-game-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { GameCreateInput } from "@/schemas/game-schema";
import { gameCreateSchema } from "@/schemas/game-schema";
import { orpc } from "@/lib/api/client";
import { routes } from "@/lib/routes";

interface CreateGameFormProps {
  events: Array<{
    id: string;
    name: string;
    eventDate: Date;
  }>;
}

export function CreateGameForm({ events }: CreateGameFormProps) {
  const router = useRouter();

  // Setup React Hook Form with wire format schema
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GameCreateInput>({
    resolver: zodResolver(gameCreateSchema), // ✅ Single schema!
  });

  // Setup oRPC mutation with TanStack Query
  const createGame = useMutation(
    orpc.admin.games.create.mutationOptions({
      onSuccess: () => {
        router.push(routes.admin.games.index());
      },
    })
  );

  // No transformation needed - router handles it
  const onSubmit = async (data: GameCreateInput) => {
    await createGame.mutateAsync(data); // ✅ Send wire format as-is
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name Field */}
      <div>
        <label htmlFor="name">Name *</label>
        <input
          {...register("name")}  {/* ✅ Validation from Zod */}
          id="name"
          type="text"
          placeholder="Friends & Family Game"
        />
        {errors.name && (
          <p className="text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Access Code Field */}
      <div>
        <label htmlFor="accessCode">Access Code *</label>
        <input
          {...register("accessCode")}  {/* ✅ Validation from Zod */}
          id="accessCode"
          type="text"
          placeholder="OSCARS2025"
        />
        {errors.accessCode && (
          <p className="text-red-600">{errors.accessCode.message}</p>
        )}
      </div>

      {/* Error Message */}
      {createGame.error && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-red-600">
            {createGame.error instanceof Error
              ? createGame.error.message
              : "Failed to create game"}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || createGame.isPending}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {isSubmitting || createGame.isPending ? "Creating..." : "Create Game"}
      </button>
    </form>
  );
}
```

## Pattern Breakdown

### 1. Import Wire Schema

Import the schema from `src/schemas/` - it's already in wire format:

```tsx
import type { GameCreateInput } from "@/schemas/game-schema";
import { gameCreateSchema } from "@/schemas/game-schema";
```

The wire format schema validates JSON-serializable types (strings, not Dates):

```ts
// src/schemas/game-schema.ts
export const gameCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  accessCode: z.string().min(4).regex(/^[A-Z0-9]+$/),
  picksLockAt: z.string().datetime().optional(), // ✅ ISO string, not Date
});
```

### 2. Use Schema in React Hook Form

```tsx
const { register, handleSubmit, formState: { errors } } = useForm<GameCreateInput>({
  resolver: zodResolver(gameCreateSchema), // ✅ Same schema used everywhere
});
```

### 3. oRPC Mutation with TanStack Query

```tsx
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/lib/api/client";

const mutation = useMutation(
  orpc.admin.games.create.mutationOptions({
    onSuccess: () => router.push("/admin/games"),
  })
);
```

### 4. Submit Without Transformation

Send wire format directly - the router handles transformation:

```tsx
const onSubmit = async (data: GameCreateInput) => {
  await mutation.mutateAsync(data); // ✅ No transformation needed!
};
```

The router transforms wire → domain at the API boundary (see [Wire-to-Domain Pattern](./wire-to-domain-pattern.md)).

### 5. Field Registration

```tsx
<input {...register("accessCode")} />
{errors.accessCode && <p>{errors.accessCode.message}</p>}
```

### 6. Loading & Error States

```tsx
// Loading state
<button disabled={isSubmitting || mutation.isPending}>
  {mutation.isPending ? "Creating..." : "Create"}
</button>

// Error display
{mutation.error && (
  <p className="text-red-600">
    {mutation.error instanceof Error ? mutation.error.message : "Error"}
  </p>
)}
```

## Migration Checklist

When converting a form from Server Action to RHF + oRPC:

- [ ] Install dependencies: `pnpm add react-hook-form @hookform/resolvers`
- [ ] Ensure schema uses wire format (see [Wire-to-Domain Pattern](./wire-to-domain-pattern.md))
- [ ] Create form component in `src/components/admin/[domain]/`
- [ ] Add `"use client"` directive
- [ ] Import wire format schema and type from `src/schemas/`
- [ ] Setup `useForm` with wire schema (`resolver: zodResolver(schema)`)
- [ ] Setup `useMutation` with `orpc.[domain].[action].mutationOptions()`
- [ ] Submit data as-is in `onSubmit` (no transformation)
- [ ] Register fields with `{...register("fieldName")}`
- [ ] Display field errors: `{errors.field && <p>{errors.field.message}</p>}`
- [ ] Show loading state on submit button
- [ ] Show mutation errors in error banner
- [ ] Ensure router transforms wire → domain (see [Wire-to-Domain Pattern](./wire-to-domain-pattern.md))
- [ ] Update page to import and render form component
- [ ] Remove old Server Action code
- [ ] Test validation, submission, and error handling

## Common Patterns

### Date/Time Fields

```tsx
// Schema (wire format)
z.object({
  eventDate: z.string().datetime().optional(),
})

// Form uses schema directly
const { register } = useForm<EventCreateInput>({
  resolver: zodResolver(eventCreateSchema),
});

// Submit without transformation
onSubmit: async (data) => {
  await mutation.mutateAsync(data); // Router transforms string → Date
}
```

### Select/Enum Fields

```tsx
// Schema (wire format - string literals)
z.object({
  status: z.enum(["SETUP", "OPEN", "LIVE", "COMPLETED"]).optional(),
})

// Form uses schema directly
const { register } = useForm<GameUpdateInput>({
  resolver: zodResolver(gameUpdateSchema),
});

// No transformation needed (enums stay as strings)
onSubmit: async (data) => {
  await mutation.mutateAsync(data);
}
```

### File Uploads

```tsx
// Form type (handled separately from useForm)
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);
  // Handle upload separately
};
```

## Testing

Test forms by:

1. **Validation**: Submit empty form, verify error messages appear
2. **API Errors**: Mock API failure, verify error banner displays
3. **Loading State**: Verify button shows "Loading..." and is disabled
4. **Success**: Verify redirect happens after successful submission
5. **Field Errors**: Enter invalid data, verify real-time validation

## Migration Priority

Recommended migration order:

1. ✅ **games/new** (done - reference implementation)
2. **games/[id]** (edit form - similar to create)
3. **events/new** (simple form)
4. **works/new** (has WorkType enum select)
5. **people/new** (simplest form)
6. **import** (complex - Wikipedia preview/import)

## Notes

- **Server Components stay Server Components** - Only extract forms to Client Components
- **Keep data fetching in pages** - Pass as props to form components
- **No progressive enhancement** - Admin forms assume JavaScript enabled
- **oRPC provides full type safety** - From Zod schema → API → backend
- **Forms are reusable** - Edit forms can reuse create form with `defaultValues`
