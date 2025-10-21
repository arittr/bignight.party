# Constitution v3

**Created**: 2025-01-21
**Previous**: v2 (2025-01-18)

## Summary

Adds modular component architecture patterns with custom hooks and shadcn/ui foundation. Documents feature-slice component pattern and hook-based business logic separation established during Pick Wizard refactor.

## Changes from v2

### Added

**Modular Component Architecture** (patterns.md):
- Feature-slice component pattern (organizing components by feature)
- Custom hooks for business logic (usePickNavigation, usePickSubmission, useSaveIndicator)
- shadcn/ui as component foundation
- Component composition patterns (orchestrator → hooks → feature components → UI primitives)
- Accessibility requirements (ARIA roles, keyboard navigation)

**Component Layer Hierarchy**:
1. **UI Primitives** - shadcn/ui components (Card, Button, Badge, ScrollArea, etc.)
2. **Feature Components** - Business-specific components (CategorySidebar, NominationList, SaveIndicator)
3. **Custom Hooks** - Business logic extraction (navigation, submission, state management)
4. **Orchestrator Components** - Compose hooks + feature components into complete features

**Examples from Production**:
- Pick Wizard refactor (86343d) with modular architecture
- Custom hooks replacing monolithic components
- shadcn/ui component integration
- Feature-slice organization pattern

### Context

These patterns emerged from the Pick Wizard refactor (spec 86343d), which migrated from a monolithic PickForm component to a modular architecture with:
- 6 feature-slice components
- 3 custom hooks for business logic
- shadcn/ui components as foundation
- Clear separation between presentation and logic

The refactor proved the value of:
1. **Testability**: Custom hooks can be tested in isolation
2. **Reusability**: Feature components compose into different contexts
3. **Maintainability**: Clear boundaries between concerns
4. **Developer Experience**: Easy to locate and modify specific features

## Migration Guide

### For Existing Monolithic Components

**Pattern: Extract Business Logic to Custom Hooks**

Before - Monolithic component with mixed concerns (300+ lines):
```typescript
"use client";
export function PickForm({ gameId, categories }) {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleNext = () => {
    const currentIndex = categories.findIndex(c => c.id === currentCategoryId);
    if (currentIndex < categories.length - 1) {
      router.push(`/game/${gameId}/pick?category=${categories[currentIndex + 1].id}`);
    }
  };

  return <div>{/* 300 lines of mixed logic and UI */}</div>;
}
```

After - Custom hooks + feature components:
```typescript
// src/hooks/game/use-pick-navigation.ts
export function usePickNavigation({ gameId, categories, currentCategoryId }) {
  const router = useRouter();
  const navigateToCategory = (categoryId: string) => {
    router.push(routes.game.pick(gameId, categoryId));
  };
  return { navigateToCategory, handleNext, hasPrevious, hasNext };
}

// src/components/game/pick-wizard/index.tsx
"use client";
export function PickWizard({ gameId, categories, currentCategoryId }) {
  const navigation = usePickNavigation({ gameId, categories, currentCategoryId });
  const submission = usePickSubmission({ gameId, currentCategoryId });

  return (
    <div>
      <CategorySidebar onCategorySelect={navigation.navigateToCategory} />
      <NominationList onSelect={submission.handleSelect} />
      <WizardNavigation onNext={navigation.handleNext} />
    </div>
  );
}
```

**Pattern: Use shadcn/ui Components**

```bash
# Install shadcn/ui components
pnpm dlx shadcn@latest add card button badge scroll-area separator alert
```

```typescript
// Build feature components on shadcn/ui primitives
import { Card, CardContent } from "@/components/ui/card";

export function NomineeCard({ nomination, isSelected, onClick }) {
  return (
    <Card
      className={isSelected ? "border-indigo-600" : "border-gray-200"}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <CardContent className="p-6">
        {/* Feature-specific content */}
      </CardContent>
    </Card>
  );
}
```

### No Breaking Changes

All v2 patterns remain valid. This version adds new patterns for modular component architecture but doesn't deprecate existing patterns.

## Rationale

**Why create v3?**

1. **Modular architecture is foundational**: The pattern of extracting business logic to custom hooks and composing feature components is a core architectural shift that deserves constitutional status.

2. **Scalability**: As features grow, monolithic components become unmaintainable. This pattern scales from simple (1 component) to complex (orchestrator + hooks + feature slices).

3. **Testability**: Custom hooks can be tested in isolation with mock routers/actions. Feature components can be tested with mock callbacks.

4. **Real-world validation**: The Pick Wizard refactor (spec 86343d) proved this pattern works:
   - Replaced 300+ line monolithic component
   - 6 feature components with clear boundaries
   - 3 custom hooks for business logic
   - All tests passing (122/122)

5. **shadcn/ui as standard**: Using shadcn/ui components as primitives provides consistent styling, accessibility, and reduces custom component code.

6. **Industry standard**: This pattern aligns with React best practices (hooks for logic, composition for UI) and modern Next.js patterns.

## Files in This Version

1. **meta.md** (this file) - Version 3 metadata and changelog
2. **architecture.md** - Layer boundaries, project structure (unchanged from v2)
3. **patterns.md** - Mandatory patterns including modular component architecture
4. **tech-stack.md** - Approved libraries including shadcn/ui
5. **schema-rules.md** - Database design philosophy (unchanged from v2)
6. **testing.md** - TDD requirements (unchanged from v2)

## Future Versions

**When to create v4:**
- Deprecation of any v3 patterns (e.g., moving away from custom hooks)
- Major architectural shifts (e.g., adopting different state management)
- New mandatory patterns that conflict with v3
- Significant tech stack changes (e.g., migrating from Next.js to Remix)
