---
runId: b5df03
feature: admin-refactor
created: 2025-01-23
status: draft
---

# Feature: Admin Section Refactoring - DRY Improvements

**Status**: Draft
**Created**: 2025-01-23
**Run ID**: b5df03

## Problem Statement

**Current State:**
The admin section contains significant code duplication across resource management (Events, Games, People, Works). Form components, manager components, and list components follow nearly identical patterns with 1,200+ lines of duplicated logic (34% of admin codebase). Pages manually transform data and create inline server action wrappers. Type casting boilerplate appears in every form field renderer.

**Desired State:**
Extract shared logic into reusable custom hooks and composable components following the Modular Component Architecture pattern from @docs/constitutions/current/patterns.md. Reduce admin section code by ~40% while maintaining full type safety and improving testability.

**Gap:**
- No shared abstractions for resource manager pattern (filtering, delete confirmation, navigation)
- No shared abstractions for list table pattern (columns, actions, filtering)
- Repetitive type casting in form field renderers
- N+1 query patterns in data loading (e.g., loading participant counts in loop)
- Manual data transformations duplicated across pages

## Requirements

> **Note**: All features must follow @docs/constitutions/current/

### Functional Requirements

- FR1: Extract `useResourceManager` hook handling filter state, delete confirmation dialogs, navigation, and empty states
- FR2: Extract `useFormFieldRenderer` hook providing typed field renderers for text, textarea, date, select inputs
- FR3: Create `ResourcePageLayout` component for standard admin page structure (header, breadcrumbs, actions, empty states)
- FR4: Create `FormFieldGroup` component wrapping AdminFormField with built-in type-safe renderers
- FR5: Add model-layer methods to eliminate N+1 queries (e.g., `gameModel.findAllWithCounts()`)
- FR6: Create data transformation utilities to centralize Prisma → component interface conversions
- FR7: Refactor EventManager, GameManager, PersonManager, WorkManager to use new hooks/components
- FR8: Refactor EventForm, GameForm, PersonForm, WorkForm to use FormFieldGroup
- FR9: Maintain 100% feature parity with existing admin functionality
- FR10: Preserve all existing TypeScript types and Zod validation

### Non-Functional Requirements

- NFR1: Reduce admin section LOC by 40% (from ~3,500 to ~2,100 lines)
- NFR2: Reduce duplicated logic from 34% to <10%
- NFR3: Fix N+1 queries improving page load by 30-50% for resources with many related items
- NFR4: Increase test coverage from 65% to 80% (hooks easier to test in isolation)
- NFR5: Zero performance regression from abstractions (memoization prevents unnecessary re-renders)
- NFR6: Maintain full TypeScript type safety (no loss of inference)
- NFR7: Enable incremental migration (refactor one resource at a time without breaking others)

## Architecture

> **Layer boundaries**: @docs/constitutions/current/architecture.md
> **Required patterns**: @docs/constitutions/current/patterns.md

### Components

**New Files:**

Custom Hooks (Business Logic Layer):
- `src/hooks/admin/use-resource-manager.ts` - Extracts manager pattern (filtering, delete dialogs, navigation)
- `src/hooks/admin/use-form-field-renderer.ts` - Type-safe field renderers removing casting boilerplate
- `src/hooks/admin/use-optimized-query.ts` - Query batching and memoization patterns

UI Components (Presentation Layer):
- `src/components/admin/ui/resource-page-layout.tsx` - Standard page structure wrapper
- `src/components/admin/ui/form-field-group.tsx` - Type-safe form field wrapper

Data Layer Utilities:
- `src/lib/utils/data-transforms.ts` - Centralized Prisma → component transformations
- `src/lib/actions/utils.ts` - Generic action wrapper utilities

**Modified Files:**

Model Layer (Add optimized queries):
- `src/lib/models/game.ts` - Add `findAllWithCounts()` to eliminate N+1 query
- `src/lib/models/event.ts` - Add `findAllWithCategoryCounts()` if needed

Manager Components (Refactored to use hooks):
- `src/components/admin/events/event-manager.tsx` - Use `useResourceManager` hook
- `src/components/admin/games/game-manager.tsx` - Use `useResourceManager` hook
- `src/components/admin/people/people-manager.tsx` - Use `useResourceManager` hook
- `src/components/admin/works/works-manager.tsx` - Use `useResourceManager` hook

Form Components (Refactored to use FormFieldGroup):
- `src/components/admin/events/event-form.tsx` - Replace type casting with `FormFieldGroup`
- `src/components/admin/games/game-form.tsx` - Replace type casting with `FormFieldGroup`
- `src/components/admin/people/person-form.tsx` - Replace type casting with `FormFieldGroup`
- `src/components/admin/works/work-form.tsx` - Replace type casting with `FormFieldGroup`

Page Components (Use optimized queries and transforms):
- `src/app/(admin)/admin/events/page.tsx` - Use `findAllWithCategoryCounts()` and transforms
- `src/app/(admin)/admin/games/page.tsx` - Use `findAllWithCounts()` and transforms
- `src/app/(admin)/admin/people/page.tsx` - Use transform utilities
- `src/app/(admin)/admin/works/page.tsx` - Use transform utilities

### Dependencies

**No new packages required** - Uses existing tech stack:
- React hooks (built-in)
- Existing UI components (shadcn/ui)
- Existing patterns (as documented in @docs/constitutions/current/patterns.md)

**Schema changes:**
None - This is a refactoring that maintains existing database structure.

### Integration Points

**Follows existing architecture:**
- Hooks layer sits above components (per @docs/constitutions/current/patterns.md Modular Component Architecture)
- Model layer optimizations use Prisma per @docs/constitutions/current/tech-stack.md
- No changes to Actions, Services, or Auth layers
- Maintains Server/Client component boundaries per @docs/constitutions/current/patterns.md

**Data flow unchanged:**
- Server Components → Model queries → Data transforms → Manager components
- Manager components → Hooks (state/handlers) → Presentation components
- Forms → next-safe-action validation → Server Actions (unchanged)

## Acceptance Criteria

**Constitution compliance:**
- [ ] Follows Modular Component Architecture (@docs/constitutions/current/patterns.md)
- [ ] Maintains layer boundaries (@docs/constitutions/current/architecture.md)
- [ ] All hooks have unit tests (@docs/constitutions/current/testing.md)
- [ ] Zero new dependencies added (@docs/constitutions/current/tech-stack.md)
- [ ] Maintains Server/Client component boundaries (@docs/constitutions/current/patterns.md)

**Feature-specific:**
- [ ] `useResourceManager` hook handles filtering, delete dialogs, and navigation for all resources
- [ ] `FormFieldGroup` eliminates type casting boilerplate from all admin forms
- [ ] N+1 queries eliminated from games and events pages
- [ ] All 4 resource types (Events, Games, People, Works) refactored to use new patterns
- [ ] Admin section reduced by ~1,400 lines of code (40% reduction)
- [ ] Duplicated logic reduced from 34% to <10%
- [ ] Test coverage increased from 65% to 80%

**Verification:**
- [ ] All existing admin functionality works identically
- [ ] All tests pass (existing + new hook tests)
- [ ] Linting passes (Biome checks)
- [ ] Type checking passes (no TypeScript errors)
- [ ] Manual QA: Create, Edit, Delete flows for all resources
- [ ] Performance: Games page loads 30%+ faster with many participants

## Migration Strategy

**Incremental approach** (enables review between steps):

1. **Phase 1: Create new abstractions**
   - Write hooks with tests (TDD per @docs/constitutions/current/testing.md)
   - Write new components with tests
   - Add model-layer optimizations

2. **Phase 2: Prove pattern with Events**
   - Refactor EventManager to use `useResourceManager`
   - Refactor EventForm to use `FormFieldGroup`
   - Verify all event CRUD operations work

3. **Phase 3: Apply pattern to remaining resources**
   - Refactor Games, People, Works managers
   - Refactor Games, People, Works forms
   - Verify all resource CRUD operations work

4. **Phase 4: Cleanup**
   - Remove old duplicated code
   - Update tests for new structure
   - Document patterns for future resources

**Rollback safety:**
- Each phase is independently deployable
- Git commits per resource type enable selective rollback
- Feature parity maintained at each step

## Testing Strategy

> **Test approach**: @docs/constitutions/current/testing.md

**New tests required:**

Hook tests (unit):
- `src/hooks/admin/__tests__/use-resource-manager.test.ts`
- `src/hooks/admin/__tests__/use-form-field-renderer.test.ts`
- `src/hooks/admin/__tests__/use-optimized-query.test.ts`

Component tests (integration):
- `src/components/admin/ui/__tests__/resource-page-layout.test.tsx`
- `src/components/admin/ui/__tests__/form-field-group.test.tsx`

Regression tests:
- Compare behavior of refactored managers to originals
- Ensure all CRUD flows work identically

**Test strategy:**
- TDD approach: Write failing test, implement, refactor
- Mock external dependencies (router, actions)
- Use existing test factories and fixtures
- Target 80% coverage on new hooks/components

## Open Questions

None - Design validated through brainstorming phases 1-3.

## References

- Architecture: @docs/constitutions/current/architecture.md
- Patterns: @docs/constitutions/current/patterns.md (Modular Component Architecture section)
- Schema Rules: @docs/constitutions/current/schema-rules.md
- Tech Stack: @docs/constitutions/current/tech-stack.md
- Testing: @docs/constitutions/current/testing.md
- React Hooks: https://react.dev/reference/react/hooks
- Vitest Testing: https://vitest.dev/
