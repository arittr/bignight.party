---
runId: 86343d
feature: pick-wizard-refactor
created: 2025-01-21
status: draft
---

# Feature: Pick Wizard Component Refactoring

**Status**: Draft
**Created**: 2025-01-21
**Run ID**: 86343d

## Problem Statement

**Current State:**
The pick wizard (`src/components/pick-wizard.tsx`) is a 460-line monolithic client component with excessive cognitive complexity. All logic lives directly in the component:
- Sidebar navigation, save status, form state mixed together
- No custom hooks - state management embedded in render logic
- Limited component reuse - only NomineeCard is extracted
- No design system - raw Tailwind classes throughout
- Unused legacy components (`PickForm.tsx`) remain in codebase
- Tight coupling makes extending features difficult

**Desired State:**
A modular, maintainable pick wizard with:
- Clear component boundaries following feature-slice architecture
- Business logic extracted into focused custom hooks
- Consistent UI using shadcn/ui design system
- Reusable components that can be used elsewhere
- Easy to extend with new features (comparison, undo, etc.)

**Gap:**
Need to refactor the wizard from a single monolithic component into a composable architecture with proper separation of concerns, while maintaining existing functionality and following Server/Client component boundaries.

## Requirements

> **Note**: All features must follow @docs/constitutions/current/

### Functional Requirements

**FR1**: Maintain all existing pick wizard functionality
- Category navigation (previous/next, direct selection)
- Nomination selection with optimistic UI updates
- Progress tracking across categories
- Lock warnings and locked state display
- Save status indicators (saving/saved)
- Mobile-responsive sidebar

**FR2**: Extract business logic into custom hooks
- `usePickNavigation` - category navigation logic and state
- `usePickSubmission` - pick submission with optimistic updates
- `useSaveIndicator` - save status management with auto-reset

**FR3**: Implement shadcn/ui design system
- Install and configure shadcn/ui
- Use Card, Button, Badge, Alert, Separator, ScrollArea components
- Add custom variants for success/warning states
- Use lucide-react icons throughout

**FR4**: Create feature-slice components (7-10 files)
- CategorySidebar - category list with progress indicators
- NominationList - nominee cards grid/list
- PickProgressTracker - horizontal progress stepper
- PickStatusBanner - lock warnings and error messages
- WizardNavigation - previous/next buttons
- SaveIndicator - saving/saved feedback

**FR5**: Remove legacy/unused code
- Delete `src/components/PickForm.tsx` (unused)
- Delete `src/components/pick-wizard.tsx` (replaced)
- Delete `src/components/category-progress-stepper.tsx` (replaced)

### Non-Functional Requirements

**NFR1**: Follow Server/Client component boundaries per @docs/constitutions/current/patterns.md
- Server Component (page.tsx) fetches all data
- Client Component (PickWizard) orchestrates with minimal state
- Feature components receive focused props (no god objects)
- Hooks encapsulate stateful logic, components render

**NFR2**: Maintain current performance characteristics
- No increase in client bundle size (hooks are logic extraction, not new code)
- Server-side data fetching unchanged
- Optimistic UI updates preserved

**NFR3**: Ensure component reusability
- UI components (shadcn) reusable across app
- Feature components focused on single responsibility
- Hooks testable in isolation
- Clear interfaces (props/return types)

## Architecture

> **Layer boundaries**: @docs/constitutions/current/architecture.md
> **Server/Client patterns**: @docs/constitutions/current/patterns.md
> **Required patterns**: next-safe-action, ts-pattern, centralized routes

### Component Structure

**Feature-Slice Organization:**
```
src/
├── components/
│   ├── ui/                               # shadcn components (generated)
│   │   ├── card.tsx
│   │   ├── button.tsx
│   │   ├── badge.tsx                     # + custom success/warning variants
│   │   ├── alert.tsx                     # + custom warning variant
│   │   ├── separator.tsx
│   │   └── scroll-area.tsx
│   └── game/                             # Game-specific components
│       ├── pick-wizard/
│       │   ├── index.tsx                 # Main orchestrator (Client Component)
│       │   ├── category-sidebar.tsx      # Sidebar with category list
│       │   ├── nomination-list.tsx       # List of nominee cards
│       │   ├── pick-progress-tracker.tsx # Progress stepper
│       │   ├── pick-status-banner.tsx    # Lock/warning banners
│       │   ├── wizard-navigation.tsx     # Previous/Next buttons
│       │   └── save-indicator.tsx        # Saving/Saved feedback
│       └── nominee-card.tsx              # Refactored to use shadcn Card
├── hooks/
│   └── game/
│       ├── usePickNavigation.ts          # Category navigation logic
│       ├── usePickSubmission.ts          # Pick submission with optimistic UI
│       └── useSaveIndicator.ts           # Save status management
└── app/
    └── game/[gameId]/pick/
        └── page.tsx                      # Server Component (unchanged logic)
```

**Responsibilities:**
- **Server Component (page.tsx)**: Fetches game, categories, nominations, existing picks; passes as props
- **Client Component (PickWizard/index.tsx)**: Orchestrates layout, imports feature slices, minimal UI state
- **Feature Components**: Self-contained pieces receiving focused props
- **Hooks**: Encapsulate stateful logic (navigation, submission, save status)
- **UI Components**: shadcn presentational primitives

### New Files

**Hooks:**
- `src/hooks/game/usePickNavigation.ts` - Returns navigation handlers and state (navigateToCategory, handlePrevious, handleNext, hasPrevious, hasNext)
- `src/hooks/game/usePickSubmission.ts` - Returns submission handlers and state (selectedNominationId, handleSelect, completedCategoryIds)
- `src/hooks/game/useSaveIndicator.ts` - Returns save status and setters (status, setSaving, setSaved, reset)

**Components:**
- `src/components/game/pick-wizard/index.tsx` - Main orchestrator consuming hooks
- `src/components/game/pick-wizard/category-sidebar.tsx` - Sidebar with ScrollArea
- `src/components/game/pick-wizard/nomination-list.tsx` - Renders NomineeCard list
- `src/components/game/pick-wizard/pick-progress-tracker.tsx` - Horizontal stepper with Button
- `src/components/game/pick-wizard/pick-status-banner.tsx` - Alert variants for lock/warning
- `src/components/game/pick-wizard/wizard-navigation.tsx` - Navigation Button components
- `src/components/game/pick-wizard/save-indicator.tsx` - Badge for save status

**UI Components (shadcn generated):**
- `src/components/ui/card.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/alert.tsx`
- `src/components/ui/separator.tsx`
- `src/components/ui/scroll-area.tsx`

### Modified Files

- `src/components/game/nominee-card.tsx` - Refactor to use shadcn Card/CardContent instead of raw divs
- `src/app/game/[gameId]/pick/page.tsx` - Update import from `pick-wizard` to `pick-wizard/index`

### Deleted Files

- `src/components/PickForm.tsx` - Unused legacy component
- `src/components/pick-wizard.tsx` - Replaced by pick-wizard/index.tsx
- `src/components/category-progress-stepper.tsx` - Replaced by pick-progress-tracker.tsx

### Dependencies

**New packages:**
- `shadcn` - UI component CLI and primitives
  - See: https://ui.shadcn.com/docs/installation/next
- `lucide-react` - Icon library (used by shadcn components)
  - See: https://lucide.dev/guide/packages/lucide-react

**Icons used:** X, Check, ChevronLeft, ChevronRight, AlertTriangle, Lock, Loader2, Archive

**Configuration:**
- Tailwind CSS v4 compatibility verified (shadcn supports v4)
- TypeScript strict mode enabled
- Biome linting configured for React

### Integration Points

**Existing Systems:**
- Auth: Uses existing `requireValidatedSession()` in page.tsx per patterns.md
- Navigation: Uses centralized `src/lib/routes.ts` for URL generation
- Actions: Consumes existing `submitPickAction` with next-safe-action
- Database: No schema changes required

**Component Composition:**
```
page.tsx (Server)
  → PickWizard/index.tsx (Client)
    → CategorySidebar + usePickNavigation
    → PickStatusBanner (props from page.tsx)
    → PickProgressTracker + usePickNavigation
    → SaveIndicator + useSaveIndicator
    → NominationList + usePickSubmission
    → WizardNavigation + usePickNavigation
```

## Acceptance Criteria

**Constitution Compliance:**
- [ ] Server/Client boundaries respected (@docs/constitutions/current/patterns.md)
- [ ] Hooks are pure logic - no JSX (@docs/constitutions/current/patterns.md)
- [ ] Components receive focused props - no god objects
- [ ] No business logic in components - extracted to hooks
- [ ] All shadcn components used (no raw Radix primitives)

**Feature-Specific:**
- [ ] All existing pick wizard functionality works identically
- [ ] Category navigation (previous/next/direct) functions correctly
- [ ] Pick submission with optimistic UI updates works
- [ ] Save indicators display correctly (saving → saved → idle)
- [ ] Lock warnings show at appropriate times
- [ ] Mobile sidebar toggle works
- [ ] Progress tracking displays completed categories
- [ ] All components use shadcn/ui (Card, Button, Badge, Alert, Separator, ScrollArea)
- [ ] lucide-react icons used throughout
- [ ] Custom Badge variants (success, warning) work
- [ ] Custom Alert variant (warning) works

**Code Quality:**
- [ ] No unused legacy components remain
- [ ] Hooks return focused interfaces (not god objects)
- [ ] Component files < 150 lines each
- [ ] Hooks files < 100 lines each
- [ ] No prop drilling (hooks provide cross-cutting concerns)

**Verification:**
- [ ] All linting passes (Biome)
- [ ] Type checking passes (TypeScript strict mode)
- [ ] Pick wizard flow works end-to-end in development
- [ ] Mobile responsive layout works
- [ ] No console errors or warnings

## Testing Strategy

> **Testing requirements**: @docs/constitutions/current/testing.md

**Hook Unit Tests:**
- `usePickNavigation.test.ts` - Test navigation logic in isolation
- `usePickSubmission.test.ts` - Test submission with mocked action
- `useSaveIndicator.test.ts` - Test status transitions and auto-reset

**Component Tests (Critical UI):**
- `nominee-card.test.tsx` - Test selection, locked state, image rendering
- `category-sidebar.test.tsx` - Test navigation, completion indicators
- `pick-status-banner.test.tsx` - Test lock/warning display logic

Testing framework: Vitest (when implemented per testing.md)

## Migration Approach

**Sequence:**
1. Install shadcn/ui and generate components
2. Create custom hooks (testable in isolation)
3. Create feature components using hooks
4. Refactor NomineeCard to use shadcn Card
5. Create new PickWizard/index.tsx
6. Update page.tsx import
7. Delete legacy components
8. Verify end-to-end functionality

**Risk Mitigation:**
- No schema changes - zero database migration risk
- Server Component (page.tsx) logic unchanged - data fetching identical
- Feature parity required before deleting old components
- Can test new components alongside old before switching

## Open Questions

None - design validated through brainstorming phases 1-3.

## References

- Architecture: @docs/constitutions/current/architecture.md
- Patterns: @docs/constitutions/current/patterns.md
- Schema Rules: @docs/constitutions/current/schema-rules.md
- Tech Stack: @docs/constitutions/current/tech-stack.md
- Testing: @docs/constitutions/current/testing.md
- shadcn/ui: https://ui.shadcn.com/docs
- lucide-react: https://lucide.dev/guide/packages/lucide-react
