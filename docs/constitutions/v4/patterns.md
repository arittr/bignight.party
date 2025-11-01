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

## Required Pattern: Async params and searchParams (Next.js 15)

**When:** ALL Server Components that receive `params` or `searchParams` props

**Why:**
- Next.js 15 breaking change: `params` and `searchParams` are now Promises
- Enables better static/dynamic rendering optimization
- Allows framework to defer data fetching operations
- Prevents runtime errors from synchronous access

### The Rules

#### Server Components with Dynamic Routes

All page components and layouts with dynamic route segments MUST await `params`:

```typescript
// ❌ BAD - Synchronous access (Next.js 15 error)
type Props = {
  params: { id: string };
};

export default async function EventDetailPage({ params }: Props) {
  const event = await eventModel.findById(params.id); // ERROR!
  return <div>{event.name}</div>;
}
```

```typescript
// ✅ GOOD - Await params before accessing
type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await eventModel.findById(id);
  return <div>{event.name}</div>;
}
```

#### Server Components with Search Params

All page components that use search parameters MUST await `searchParams`:

```typescript
// ❌ BAD - Synchronous access
type Props = {
  searchParams: { category?: string };
};

export default async function PicksPage({ searchParams }: Props) {
  const categoryId = searchParams.category; // ERROR!
  return <div>Category: {categoryId}</div>;
}
```

```typescript
// ✅ GOOD - Await searchParams before accessing
type Props = {
  searchParams: Promise<{ category?: string }>;
};

export default async function PicksPage({ searchParams }: Props) {
  const { category } = await searchParams;
  return <div>Category: {category}</div>;
}
```

#### Client Components with Dynamic Routes

Client components cannot use async/await directly, use `React.use()`:

```typescript
// ❌ BAD - Client components cannot be async
"use client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function GameClient({ params }: Props) {
  const { id } = await params; // ERROR! Client components can't be async
  return <div>Game: {id}</div>;
}
```

```typescript
// ✅ GOOD - Use React.use() to unwrap Promise
"use client";

import { use } from "react";

type Props = {
  params: Promise<{ id: string }>;
};

export default function GameClient({ params }: Props) {
  const { id } = use(params);
  return <div>Game: {id}</div>;
}
```

### Pattern: Multiple Dynamic Segments

```typescript
// ✅ GOOD - Await and destructure all segments
type Props = {
  params: Promise<{
    eventId: string;
    categoryId: string;
    nominationId: string;
  }>;
};

export default async function NominationPage({ params }: Props) {
  const { eventId, categoryId, nominationId } = await params;

  const nomination = await nominationModel.findById(nominationId);
  return <div>{nomination.title}</div>;
}
```

### Pattern: Combining params and searchParams

```typescript
// ✅ GOOD - Await both independently
type Props = {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ category?: string }>;
};

export default async function PickWizardPage({ params, searchParams }: Props) {
  const { gameId } = await params;
  const { category } = await searchParams;

  const game = await gameModel.findById(gameId);
  const currentCategory = category
    ? await categoryModel.findById(category)
    : game.categories[0];

  return <PickWizard game={game} currentCategory={currentCategory} />;
}
```

### Pattern: Using in generateMetadata

Metadata functions also receive Promise params:

```typescript
// ✅ GOOD - Await params in generateMetadata
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await eventModel.findById(id);

  return {
    title: `${event.name} - BigNight.Party`,
    description: event.description,
  };
}

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  const event = await eventModel.findById(id);
  return <div>{event.name}</div>;
}
```

### Common Mistakes

#### ❌ Forgetting to await
```typescript
// ❌ BAD - TypeScript error, runtime error
type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const event = await eventModel.findById(params.id); // ERROR!
  // params.id doesn't exist on Promise
}
```

#### ❌ Wrong type annotation
```typescript
// ❌ BAD - Type doesn't match Next.js 15
type Props = {
  params: { id: string }; // Wrong! Should be Promise<{ id: string }>
};

export default async function Page({ params }: Props) {
  const { id } = await params; // TypeScript error
}
```

#### ❌ Destructuring in function signature
```typescript
// ❌ BAD - Cannot destructure Promise
type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params: { id } }: Props) {
  // ERROR! Cannot destructure Promise
}
```

```typescript
// ✅ GOOD - Destructure after awaiting
export default async function Page({ params }: Props) {
  const { id } = await params;
}
```

### Migration from Next.js 14

**Before (Next.js 14):**
```typescript
type Props = {
  params: { id: string };
  searchParams: { query?: string };
};

export default async function Page({ params, searchParams }: Props) {
  const event = await eventModel.findById(params.id);
  const query = searchParams.query;
  // ...
}
```

**After (Next.js 15):**
```typescript
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ query?: string }>;
};

export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const { query } = await searchParams;

  const event = await eventModel.findById(id);
  // ...
}
```

### Automated Migration

Use Next.js codemod for automatic migration:

```bash
npx @next/codemod@canary next-async-request-api .
```

This will update most cases automatically. Manual review required for complex cases.

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
- Can call serverClient (oRPC) for data fetching and mutations
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

### Pattern: Inline Form Actions for oRPC Mutations

When using form actions in Server Components, extract FormData and call oRPC procedures via serverClient:

```typescript
// src/app/(admin)/admin/works/[id]/page.tsx
import { serverClient } from '@/lib/api/server-client'
import { requireValidatedSession } from '@/lib/auth/config'

type Props = {
  params: Promise<{ id: string }>
}

export default async function WorkDetailPage({ params }: Props) {
  await requireValidatedSession()
  const { id } = await params;

  return (
    <form
      action={async (formData: FormData) => {
        "use server";

        // Extract FormData fields
        const title = formData.get("title");
        const type = formData.get("type");
        const year = formData.get("year");

        // Call oRPC procedure via serverClient (no HTTP overhead)
        await serverClient.admin.updateWork({
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
- serverClient calls oRPC procedures directly (no HTTP overhead)
- Inline wrapper only extracts FormData and validates before calling
- Simple mutations without redirects or complex error handling

### Pattern: Server Actions for Redirects

**IMPORTANT:** If you need to call `redirect()`, use a standalone server action function.

```typescript
// src/app/(admin)/admin/works/[id]/page.tsx
import { serverClient } from '@/lib/api/server-client'
import { requireValidatedSession } from '@/lib/auth/config'
import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ id: string }>
}

export default async function WorkDetailPage({ params }: Props) {
  await requireValidatedSession()
  const { id } = await params;
  const work = await serverClient.admin.getWork({ id });

  // Standalone server action for delete with redirect
  async function handleDelete() {
    "use server";

    try {
      await serverClient.admin.deleteWork({ id });
      redirect("/admin/works"); // ✅ redirect() in standalone function
    } catch (error) {
      // Error handling
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
        await serverClient.admin.updateWork({ id, title: title as string });
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
- oRPC calls via serverClient don't interfere with redirect()
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

## Required Pattern: Modular Component Architecture

**When:** Building complex UI features with business logic and interactivity

**Why:**
- Separates presentation from logic for better testability
- Enables component reuse across different contexts
- Improves maintainability by creating clear boundaries
- Scales from simple to complex features naturally
- Makes features easier to understand and modify

### The Hierarchy

```
┌─────────────────────────────────────────┐
│   Orchestrator Component                │
│   - Composes hooks + feature components │
│   - Minimal logic, mostly composition   │
└──────────┬───────────────┬──────────────┘
           │               │
    ┌──────▼──────┐  ┌────▼──────┐
    │ Custom      │  │ Feature   │
    │ Hooks       │  │ Components│
    │ - Business  │  │ - UI      │
    │   logic     │  │ - Callbacks│
    └──────┬──────┘  └────┬──────┘
           │               │
        ┌──▼───────────────▼──┐
        │  shadcn/ui          │
        │  UI Primitives      │
        │  (Card, Button, etc)│
        └─────────────────────┘
```

### Layer 1: UI Primitives (shadcn/ui)

Use shadcn/ui components as the foundation:

```bash
# Install components from shadcn/ui
pnpm dlx shadcn@latest add card button badge scroll-area separator alert
```

**Why shadcn/ui:**
- Consistent styling with Tailwind CSS
- Built-in accessibility (ARIA roles, keyboard navigation)
- Composable and customizable
- No runtime dependencies (copies code into your project)
- Radix UI primitives under the hood

### Layer 2: Feature Components

Build feature-specific components on shadcn/ui primitives:

```typescript
// src/components/game/pick-wizard/category-sidebar.tsx
"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CategorySidebarProps {
  categories: Array<{
    id: string;
    name: string;
    points: number;
  }>;
  currentCategoryId: string;
  completedCategoryIds: Set<string>;
  onCategorySelect: (categoryId: string) => void;
}

export function CategorySidebar({
  categories,
  currentCategoryId,
  completedCategoryIds,
  onCategorySelect,
}: CategorySidebarProps) {
  return (
    <div className="h-full border-r bg-gray-50 p-4">
      <h2 className="text-lg font-semibold">Categories</h2>
      <ScrollArea className="flex-1">
        {categories.map((category) => (
          <Button
            key={category.id}
            className={isCurrent ? "bg-gray-900 text-white" : ""}
            onClick={() => onCategorySelect(category.id)}
          >
            {completedCategoryIds.has(category.id) && <Check />}
            {category.name}
          </Button>
        ))}
      </ScrollArea>
    </div>
  );
}
```

**Feature Component Characteristics:**
- Focused on single feature/responsibility
- Accepts data and callbacks via props
- No business logic (just presentation + callbacks)
- Uses shadcn/ui primitives for consistent styling
- Fully testable with mock data/callbacks

### Layer 3: Custom Hooks

Extract business logic into custom hooks:

```typescript
// src/hooks/game/use-pick-navigation.ts
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { routes } from "@/lib/routes";

export interface UsePickNavigationProps {
  gameId: string;
  categories: Array<{ id: string }>;
  currentCategoryId: string;
}

export interface UsePickNavigationReturn {
  currentCategoryId: string;
  navigateToCategory: (categoryId: string) => void;
  handlePrevious: () => void;
  handleNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  currentIndex: number;
}

export function usePickNavigation({
  gameId,
  categories,
  currentCategoryId,
}: UsePickNavigationProps): UsePickNavigationReturn {
  const router = useRouter();

  const currentIndex = useMemo(
    () => categories.findIndex((c) => c.id === currentCategoryId),
    [categories, currentCategoryId]
  );

  const hasPrevious = useMemo(() => currentIndex > 0, [currentIndex]);

  const hasNext = useMemo(
    () => currentIndex < categories.length - 1,
    [currentIndex, categories.length]
  );

  const navigateToCategory = (categoryId: string) => {
    router.push(routes.game.pick(gameId, categoryId));
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      navigateToCategory(categories[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      navigateToCategory(categories[currentIndex + 1].id);
    }
  };

  return {
    currentCategoryId,
    currentIndex,
    handleNext,
    handlePrevious,
    hasNext,
    hasPrevious,
    navigateToCategory,
  };
}
```

**Custom Hook Characteristics:**
- Named with `use` prefix
- Returns object with values and handlers
- Contains business logic and state management
- Uses Next.js hooks (useRouter, useSearchParams)
- Fully testable with mock router/dependencies

### Layer 4: Orchestrator Component

Compose hooks and feature components:

```typescript
// src/components/game/pick-wizard/index.tsx
"use client";

import { useState } from "react";
import { usePickNavigation } from "@/hooks/game/use-pick-navigation";
import { usePickSubmission } from "@/hooks/game/use-pick-submission";
import { useSaveIndicator } from "@/hooks/game/use-save-indicator";
import { CategorySidebar } from "./category-sidebar";
import { NominationList } from "./nomination-list";
import { WizardNavigation } from "./wizard-navigation";
import { SaveIndicator } from "./save-indicator";

interface PickWizardProps {
  gameId: string;
  categories: Array<{
    id: string;
    name: string;
    points: number;
  }>;
  currentCategoryId: string;
  nominations: Array<{
    id: string;
    nominationText: string;
  }>;
  existingPicks: Array<{
    categoryId: string;
    nominationId: string;
  }>;
  isLocked: boolean;
}

export function PickWizard({
  gameId,
  categories,
  currentCategoryId,
  nominations,
  existingPicks,
  isLocked,
}: PickWizardProps) {
  // Custom hooks for business logic
  const navigation = usePickNavigation({
    categories,
    currentCategoryId,
    gameId,
  });

  const saveIndicator = useSaveIndicator();

  const submission = usePickSubmission({
    currentCategoryId,
    existingPicks,
    gameId,
    onError: saveIndicator.reset,
    onSaved: saveIndicator.setSaved,
    onSaving: saveIndicator.setSaving,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <CategorySidebar
        categories={categories}
        completedCategoryIds={submission.completedCategoryIds}
        currentCategoryId={navigation.currentCategoryId}
        onCategorySelect={navigation.navigateToCategory}
      />

      <NominationList
        isLocked={isLocked}
        nominations={nominations}
        onSelect={submission.handleSelect}
        selectedNominationId={submission.selectedNominationId}
      />

      <WizardNavigation
        hasNext={navigation.hasNext}
        hasPrevious={navigation.hasPrevious}
        onNext={navigation.handleNext}
        onPrevious={navigation.handlePrevious}
      />

      {saveIndicator.status !== "idle" && <SaveIndicator status={saveIndicator.status} />}
    </div>
  );
}
```

**Orchestrator Characteristics:**
- Minimal logic (mostly composition)
- Connects hooks to feature components
- Manages layout and structure
- Coordinates multiple features
- Entry point for the feature

### File Organization: Feature-Slice Pattern

Organize by feature, not by type:

```
src/
├── components/
│   └── game/
│       └── pick-wizard/          # Feature slice
│           ├── index.tsx          # Orchestrator
│           ├── category-sidebar.tsx    # Feature component
│           ├── nomination-list.tsx     # Feature component
│           ├── wizard-navigation.tsx   # Feature component
│           └── save-indicator.tsx      # Feature component
│
├── hooks/
│   └── game/
│       ├── use-pick-navigation.ts      # Custom hook
│       ├── use-pick-submission.ts      # Custom hook
│       └── use-save-indicator.ts       # Custom hook
│
└── components/ui/               # shadcn/ui primitives
    ├── card.tsx
    ├── button.tsx
    ├── badge.tsx
    └── scroll-area.tsx
```

**Why feature-slice:**
- All related files colocated
- Easy to find components for a feature
- Clear ownership boundaries
- Scales as features grow

### Accessibility Requirements

**All interactive components MUST:**

1. **Have proper ARIA roles:**
```typescript
<Card
  onClick={onClick}
  role="button"        // ✅ Screen reader knows it's clickable
  tabIndex={0}         // ✅ Keyboard accessible
>
```

2. **Support keyboard navigation:**
```typescript
<Card
  onClick={onClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick();
    }
  }}
  tabIndex={0}
>
```

3. **Have appropriate labels:**
```typescript
<button aria-label="Close sidebar">
  <X className="h-4 w-4" />
</button>
```

4. **Indicate state to screen readers:**
```typescript
<Button
  aria-pressed={isSelected}
  aria-disabled={isLocked}
>
  {nomination.title}
</Button>
```

### Testing Strategy

**Test each layer independently:**

```typescript
// Hook tests
import { renderHook } from '@testing-library/react';
import { usePickNavigation } from './use-pick-navigation';

test('navigates to next category', () => {
  const { result } = renderHook(() => usePickNavigation({
    gameId: 'game-1',
    categories: [{ id: 'cat-1' }, { id: 'cat-2' }],
    currentCategoryId: 'cat-1',
  }));

  expect(result.current.hasNext).toBe(true);
  result.current.handleNext();
  // Assert router.push was called with correct route
});

// Feature component tests
import { render, screen } from '@testing-library/react';
import { CategorySidebar } from './category-sidebar';

test('calls onCategorySelect when category clicked', () => {
  const mockSelect = vi.fn();

  render(
    <CategorySidebar
      categories={[{ id: 'cat-1', name: 'Best Picture', points: 10 }]}
      currentCategoryId="cat-1"
      completedCategoryIds={new Set()}
      onCategorySelect={mockSelect}
    />
  );

  const button = screen.getByRole('button', { name: /Best Picture/ });
  button.click();

  expect(mockSelect).toHaveBeenCalledWith('cat-1');
});
```

### Common Patterns

**Pattern: Optimistic UI Updates**

```typescript
// src/hooks/game/use-pick-submission.ts
export function usePickSubmission({ gameId, onSaving, onSaved, onError }) {
  const [selectedNominationId, setSelectedNominationId] = useState(null);

  const handleSelect = async (nominationId: string, isLocked: boolean) => {
    if (isLocked) return;

    // Optimistic update
    setSelectedNominationId(nominationId);
    onSaving();

    try {
      await submitPickAction({ gameId, nominationId });
      onSaved();
    } catch (error) {
      // Rollback on error
      setSelectedNominationId(null);
      onError();
    }
  };

  return { selectedNominationId, handleSelect };
}
```

**Pattern: Derived State in Hooks**

```typescript
export function usePickSubmission({ existingPicks, categories }) {
  // Derive completed categories from existing picks
  const completedCategoryIds = useMemo(() => {
    const picked = new Set(existingPicks.map(p => p.categoryId));
    return picked;
  }, [existingPicks]);

  // Derive if feature is complete
  const isComplete = completedCategoryIds.size === categories.length;

  return { completedCategoryIds, isComplete };
}
```

**Pattern: Callback Coordination**

```typescript
export function PickWizard({ ... }) {
  const saveIndicator = useSaveIndicator();

  const submission = usePickSubmission({
    onSaving: saveIndicator.setSaving,   // Coordinate callbacks
    onSaved: saveIndicator.setSaved,     // between hooks
    onError: saveIndicator.reset,
  });
}
```

### Benefits

**Testability:**
- Hooks tested with `renderHook`
- Feature components tested with mock callbacks
- Orchestrator integration tested end-to-end

**Reusability:**
- Feature components used in different contexts
- Hooks shared across components
- UI primitives consistent across app

**Maintainability:**
- Clear boundaries between layers
- Easy to locate and modify features
- Logic separated from presentation

**Developer Experience:**
- Type-safe props and returns
- Clear dependencies and data flow
- Easy to understand and extend

---

## Required Pattern: Session Validation with requireValidatedSession()

**When:** ANY protected Server Component (layout or page) that requires authentication

**Why:**
- Edge runtime constraints: Middleware can't query database (Prisma requires TCP)
- Stale JWT protection: User deleted from DB but JWT still valid
- Prevents redirect loops: Clears JWT when user doesn't exist
- Single responsibility: Middleware validates JWT, pages validate user exists

### The Problem

Next.js middleware ALWAYS runs in Edge runtime, which cannot:
- Use standard Prisma client (requires TCP sockets)
- Query the database to check if user exists
- Modify cookies in Server Components

This creates a vulnerability: User deleted from database → JWT still valid → can access protected routes

### The Solution

**Two-layer validation:**
1. **Middleware (Edge)**: Validates JWT signature only
2. **Layout/Page (Node.js)**: Validates JWT + user exists in database

```typescript
// src/lib/auth/config.ts
import * as userModel from "@/lib/models/user";

export async function requireValidatedSession() {
  const session = await auth();

  // No session - redirect to sign in
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // Validate user still exists in database
  const userExists = await userModel.exists(session.user.id);

  if (!userExists) {
    // User deleted - redirect to signout to clear JWT
    redirect("/api/auth/signout?callbackUrl=/sign-in");
  }

  return session;
}
```

**Why redirect to `/api/auth/signout`:**
- Route handlers can modify cookies (Server Components cannot)
- Clears JWT cookie before redirecting to sign-in
- Prevents redirect loop (middleware won't see stale JWT)

### Usage in Protected Routes

**✅ GOOD - Layouts:**
```typescript
// src/app/(admin)/admin/layout.tsx
import { requireValidatedSession } from "@/lib/auth/config";

export default async function AdminLayout({ children }) {
  const session = await requireValidatedSession();

  if (session.user.role !== 'ADMIN') {
    redirect('/');
  }

  return <div>{children}</div>;
}
```

**✅ GOOD - Pages:**
```typescript
// src/app/dashboard/page.tsx
import { requireValidatedSession } from "@/lib/auth/config";

export default async function DashboardPage() {
  const session = await requireValidatedSession();
  const games = await gameService.getUserGames(session.user.id);
  return <div>{/* ... */}</div>;
}
```

**❌ BAD - Missing database validation:**
```typescript
// ❌ Don't use raw auth() in protected routes
const session = await auth();
if (!session?.user?.id) {
  redirect("/sign-in"); // Missing DB check! Stale JWTs can pass!
}
```

### Business Logic Authorization

After authentication, add business-specific permission checks:

```typescript
// ✅ GOOD - Auth + business logic
import { requireValidatedSession } from "@/lib/auth/config";

export default async function PickWizardPage({ params }) {
  const session = await requireValidatedSession(); // Auth + DB check

  // Business logic: Check if user is member of THIS game
  const isMember = await gameParticipantModel.exists(
    session.user.id,
    params.gameId
  );

  if (!isMember) {
    redirect(routes.dashboard()); // Business authorization, not auth
  }

  // User is authenticated AND authorized
  const picks = await pickModel.getPicksByUser(session.user.id);
  return <PickWizard picks={picks} />;
}
```

### User Model

Create `src/lib/models/user.ts` for efficient existence checks:

```typescript
// src/lib/models/user.ts
import prisma from "@/lib/db/prisma";

export async function exists(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true }, // Minimal select for performance
  });
  return user !== null;
}

export async function findById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}
```

**Performance consideration:**
- Extra DB query on every protected page load
- Mitigated by: Primary key lookup (indexed), minimal select
- Security benefit > marginal performance cost
- Query is only in Node.js runtime (not Edge)

### Migration from auth()

**Find all usages:**
```bash
grep -r "const session = await auth()" src/app
```

**Replace pattern:**
```diff
- import { auth } from "@/lib/auth/config";
+ import { requireValidatedSession } from "@/lib/auth/config";

  export default async function ProtectedPage() {
-   const session = await auth();
-   if (!session?.user?.id) {
-     redirect("/sign-in");
-   }
+   const session = await requireValidatedSession();
    // If we get here, user is authenticated AND exists in DB
  }
```

### When NOT to use requireValidatedSession()

**Public pages** - Don't need authentication:
```typescript
// ✅ Public page - no auth needed
export default async function HomePage() {
  return <div>Welcome to BigNight.Party!</div>;
}
```

**Optional authentication** - Show different UI based on auth:
```typescript
// ✅ Optional auth - use getValidatedSession()
import { getValidatedSession } from "@/lib/auth/config";

export default async function HomePage() {
  const session = await getValidatedSession(); // Returns null if not logged in

  return (
    <div>
      {session ? (
        <p>Welcome back, {session.user.email}</p>
      ) : (
        <p>Welcome! Please sign in.</p>
      )}
    </div>
  );
}
```

### Common Mistakes

**❌ Using auth() in middleware:**
```typescript
// ❌ BAD - Can't query DB in middleware
export default auth(async (req) => {
  const session = req.auth;
  const userExists = await userModel.exists(session.user.id); // ERROR!
  // Middleware runs in Edge runtime - no Prisma!
});
```

**❌ Calling signOut() in Server Components:**
```typescript
// ❌ BAD - Can't modify cookies in Server Components
export async function requireValidatedSession() {
  // ...
  if (!userExists) {
    await signOut(); // ERROR! Server Components can't modify cookies
  }
}
```

**✅ GOOD - Redirect to signout route handler:**
```typescript
// ✅ GOOD - Route handler can modify cookies
export async function requireValidatedSession() {
  // ...
  if (!userExists) {
    redirect("/api/auth/signout?callbackUrl=/sign-in"); // ✅
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

## Required Pattern: oRPC Contract-First API

**When:** ALL remote procedure calls (mutations and queries)

**Why:**
- Type-safe end-to-end (TypeScript on client and server)
- Automatic input validation with Zod in contracts
- No HTTP overhead in Server Components (serverClient)
- React Query integration in Client Components
- Full type inference without manual annotations
- OpenRPC standard for API contracts

**CRITICAL:** Contract-first pattern using `implement(contract)` is MANDATORY. Ad-hoc procedures with `{ input }: any` break type inference and TanStack Query integration.

### Step 1: Define Contract

Use `oc.input().output()` from `@orpc/contract`:

```typescript
// src/lib/api/contracts/pick.ts
import { oc } from '@orpc/contract'
import { z } from 'zod'
import type { Pick } from '@prisma/client'

// Define contract with input/output schemas
export const submitPickContract = oc
  .input(
    z.object({
      gameId: z.string(),
      categoryId: z.string(),
      nominationId: z.string(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      pick: z.custom<Pick>(), // Prisma type
    })
  )

// Export root contract for entire router
export const pickContract = oc.router({
  submitPick: submitPickContract,
  // ... other procedures
})
```

### Step 2: Implement Router

Use `implement(contract)` to create typed procedure builder:

```typescript
// src/lib/api/routers/pick.ts
import { implement } from '@orpc/server'
import { authenticatedProcedure } from '@/lib/api/procedures'
import { pickContract } from '@/lib/api/contracts/pick'
import * as pickService from '@/lib/services/pick-service'

// Create typed builder from contract
const pickBuilder = implement(pickContract)

// Implement procedures with full type safety
export const pickRouter = pickBuilder.router({
  submitPick: pickBuilder.submitPick
    .use(authenticatedProcedure) // Chain auth middleware
    .handler(async ({ input, ctx }) => {
      // input is fully typed from contract
      // ctx.userId from authenticatedProcedure
      const pick = await pickService.submitPick(ctx.userId, input)
      return { success: true, pick }
    }),
})
```

**Why `implement(contract)`:**
- TypeScript infers input/output types automatically
- No `{ input }: any` type assertions needed
- Compile error if handler doesn't match contract
- TanStack Query integration works correctly

### Step 3: Client Setup

Use `RPCLink` (NOT `LinkFetchClient` or `StandardRPCLink`):

```typescript
// src/lib/api/client.ts
"use client"

import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import type { AppRouter } from './root'

// Browser vs SSR URL handling
const getBaseUrl = () => {
  if (typeof window !== 'undefined') return window.location.origin
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL
  return 'http://localhost:3000'
}

// Create RPCLink with Next.js headers integration
const link = new RPCLink({
  url: `${getBaseUrl()}/api/rpc`,
  headers: async () => {
    // In SSR, include Next.js headers for auth
    if (typeof window !== 'undefined') return {}
    const { headers } = await import('next/headers')
    return await headers()
  },
})

// Create base client
const baseClient = createORPCClient<AppRouter>(link)

// Create TanStack Query utilities (MANDATORY)
export const orpc = createTanstackQueryUtils(baseClient)
export const api = orpc // Alias for clarity
```

**Why RPCLink:**
- Handles browser vs SSR automatically
- Integrates with Next.js headers for auth
- Required for TanStack Query integration

**Why createTanstackQueryUtils:**
- Provides `.mutationOptions()` and `.queryOptions()` methods
- Required for React Query integration
- Without this, type inference breaks

### Step 4: Usage in Server Components

```typescript
// In a Server Component
import { serverClient } from '@/lib/api/server-client'
import { requireValidatedSession } from '@/lib/auth/config'

export default async function PickPage() {
  const session = await requireValidatedSession()

  // Call oRPC procedure directly (no HTTP)
  const result = await serverClient.pick.submitPick({
    gameId: '123',
    categoryId: '456',
    nominationId: '789',
  })

  return <div>Pick submitted: {result.success}</div>
}
```

### Step 5: Usage in Client Components

**MANDATORY PATTERN:** Use `useMutation(orpc.domain.proc.mutationOptions())`

```typescript
// In a Client Component
'use client'
import { useMutation } from '@tanstack/react-query'
import { orpc } from '@/lib/api/client'

export function PickForm() {
  // ✅ CORRECT - Use .mutationOptions()
  const mutation = useMutation(
    orpc.pick.submitPick.mutationOptions({
      onSuccess: (data) => {
        console.log('Pick submitted:', data.pick.id)
      },
      onError: (error) => {
        console.error('Failed to submit pick:', error)
      },
    })
  )

  const handleSubmit = async (formData: FormData) => {
    const result = await mutation.mutateAsync({
      gameId: formData.get('gameId') as string,
      categoryId: formData.get('categoryId') as string,
      nominationId: formData.get('nominationId') as string,
    })

    if (result.success) {
      // Handle success
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Submitting...' : 'Submit Pick'}
      </button>
    </form>
  )
}
```

**❌ WRONG PATTERN (v3):**
```typescript
// This DOES NOT WORK - type inference breaks
const mutation = orpc.pick.submitPick.useMutation() // ERROR!
```

**Why `.mutationOptions()` is required:**
- Created by `createTanstackQueryUtils(baseClient)`
- Returns TanStack Query options object
- Pass to `useMutation()` from `@tanstack/react-query`
- Without this, TypeScript sees type as `never`

### Common Mistakes

#### ❌ Not using implement(contract)

```typescript
// ❌ BAD - No type inference, breaks TanStack Query
export const pickRouter = {
  submit: authenticatedProcedure.handler(async ({ input }: { input: any }) => {
    // Manual type assertion required, no validation
    return await pickService.submitPick(input)
  })
}
```

#### ❌ Using wrong client imports

```typescript
// ❌ BAD - These are deprecated/incorrect
import { LinkFetchClient } from '@orpc/client/fetch'
import { StandardRPCLink } from '@orpc/client/standard'

const fetchClient = new LinkFetchClient({})
const link = new StandardRPCLink(fetchClient, { url: '/api/rpc' })
```

#### ❌ Not using createTanstackQueryUtils

```typescript
// ❌ BAD - No TanStack Query integration
const baseClient = createORPCClient<AppRouter>(link)
export const orpc = baseClient // Missing createTanstackQueryUtils!

// Client Components won't have .mutationOptions() method
```

### Migration from v3

**Before (v3):**
```typescript
// Router - no contract connection
export const pickRouter = {
  submit: authenticatedProcedure.handler(async ({ input }: { input: any }) => {
    // No type safety
  })
}

// Client - broken pattern
const mutation = orpc.pick.submit.useMutation() // Doesn't exist!
```

**After (v4):**
```typescript
// 1. Define contract
export const submitPickContract = oc.input(schema).output(schema)

// 2. Implement with contract
const pickBuilder = implement(pickContract)
export const pickRouter = pickBuilder.router({
  submitPick: pickBuilder.submitPick
    .use(authenticatedProcedure)
    .handler(async ({ input, ctx }) => {
      // Full type safety
    }),
})

// 3. Use .mutationOptions()
const mutation = useMutation(
  orpc.pick.submitPick.mutationOptions()
)
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

### From raw server actions to oRPC procedures

**Before:**
```typescript
'use server'
export async function updatePick(data: unknown) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  // Unsafe - no validation!
  return prisma.pick.update({
    where: { id: data.id },
    data: data,
  })
}
```

**After:**
```typescript
// src/lib/api/routers/pick.ts
export const pickRouter = {
  update: authenticatedProcedure.handler(async ({ input, ctx }) => {
    // input is validated by contract layer
    return pickService.updatePick(ctx.userId, input)
  })
}

// In a Server Component
const result = await serverClient.pick.update(input)
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

### oRPC Procedures
- [ ] Procedures have proper Zod contract validation
- [ ] Contract layer defines input/output types
- [ ] Procedures call service layer (not models directly)
- [ ] Authentication via authenticatedProcedure or adminProcedure
- [ ] Return types match contract

### Server Components
- [ ] Uses serverClient from `@/lib/api/server-client`
- [ ] Calls oRPC procedures directly (not HTTP)
- [ ] No form actions importing from deleted `@/lib/actions/`

### Client Components
- [ ] Uses orpc from `@/lib/api/client`
- [ ] Uses React Query mutations (`.useMutation()`)
- [ ] Proper error handling with toast notifications

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
- [ ] oRPC routers only call services, not models directly

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
