---
runId: 46cee5
feature: admin-migration
created: 2025-01-21
status: draft
---

# Feature: Admin Component Architecture Migration

**Status**: Draft
**Created**: 2025-01-21
**Run ID**: 46cee5

## Problem Statement

**Current State:**
Admin pages use inline Tailwind styling, inline form actions, and Server Components with minimal client interactivity. Tables are basic HTML with no sorting/filtering. Forms have inconsistent validation display. No reusable admin component library. Different patterns across pages (events, games, people, works, categories, nominations, import).

**Desired State:**
Admin pages follow the modular component architecture pattern (per `patterns.md:340-828`) with shadcn/ui components, custom hooks for business logic, feature-slice organization, and consistent UX. All interactive elements properly separated into client components. Reusable admin primitives shared across domains.

**Gap:**
The admin interface needs architectural modernization to match the pick-wizard pattern: orchestrator components coordinating custom hooks and feature components, shadcn/ui base layer for consistency, proper server/client boundaries, and testable separation of concerns.

## Requirements

> **Note**: All features must follow @docs/constitutions/current/

### Functional Requirements

- FR1: All admin pages use shadcn/ui components (Table, Card, Form, Dialog, Badge, Button, Input, Select, etc.)
- FR2: Shared admin primitives (AdminTable, AdminForm, AdminPageHeader, AdminSidebar, AdminEmptyState) wrap shadcn with admin-specific defaults
- FR3: Domain-specific feature components for each admin area (events, categories, games, people, works, nominations, import)
- FR4: Custom hooks extract business logic (useFormSubmission, useConfirmDialog, useToast, useAdminNavigation, domain-specific hooks)
- FR5: Orchestrator components coordinate hooks and feature components per orchestrator pattern
- FR6: All tables support sorting, filtering, and row actions
- FR7: All forms integrate with next-safe-action for validation display
- FR8: Delete operations use confirmation dialogs before execution
- FR9: Success/error messages display via toast notifications
- FR10: Empty states provide clear guidance and action buttons
- FR11: Loading states show skeletons or spinners during async operations
- FR12: Optimistic updates for better perceived performance

### Non-Functional Requirements

- NFR1: All interactive components have proper ARIA roles, keyboard navigation, and screen reader support (per `patterns.md:658-700`)
- NFR2: Component library is reusable across all admin domains (events, games, people, works)
- NFR3: Custom hooks are unit-testable with mock dependencies (per `testing.md`)
- NFR4: Feature components are testable with mock callbacks (per `patterns.md:701-743`)
- NFR5: Server/Client boundaries follow strict separation (per `patterns.md:17-316`)
- NFR6: All mutations go through next-safe-action validation (per `patterns.md:1246-1328`)
- NFR7: Error handling follows structured pattern with toast notifications
- NFR8: Code follows feature-slice organization (per `patterns.md:624-657`)

## Architecture

> **Layer boundaries**: @docs/constitutions/current/architecture.md
> **Required patterns**: @docs/constitutions/current/patterns.md
> **Modular components**: @docs/constitutions/current/patterns.md:340-828

### Component Hierarchy

**Layer 1: Shared Admin UI Primitives** (`src/components/admin/ui/`)
- Built on shadcn/ui components
- Reusable across all admin domains
- Consistent styling, accessibility, keyboard navigation

**Layer 2: Domain-Specific Features** (`src/components/admin/{domain}/`)
- Event management components
- Category/nomination management
- Game management
- People/Works management

**Layer 3: Orchestrators**
- Client components coordinating hooks + features
- Similar to PickWizard pattern

### New Files

**Shared Admin Primitives:**
- `src/components/admin/ui/admin-table.tsx` - Reusable table with sorting, filtering, actions
- `src/components/admin/ui/admin-form.tsx` - Form wrapper with next-safe-action integration
- `src/components/admin/ui/admin-page-header.tsx` - Consistent page headers with breadcrumbs
- `src/components/admin/ui/admin-sidebar.tsx` - Sidebar layout component
- `src/components/admin/ui/admin-empty-state.tsx` - Empty state with icon, message, actions

**Event Domain:**
- `src/components/admin/events/event-list.tsx` - Event table with domain logic
- `src/components/admin/events/event-form.tsx` - Event create/edit form
- `src/components/admin/events/event-detail-layout.tsx` - Three-column detail layout
- `src/components/admin/events/event-manager.tsx` - Orchestrator for events list page

**Category Domain:**
- `src/components/admin/categories/category-list.tsx` - Category sidebar list
- `src/components/admin/categories/category-form.tsx` - Category create/edit
- `src/components/admin/categories/category-detail-layout.tsx` - Category detail with nominations

**Game Domain:**
- `src/components/admin/games/game-list.tsx` - Games table
- `src/components/admin/games/game-form.tsx` - Game create/edit
- `src/components/admin/games/game-status-badge.tsx` - Status indicator
- `src/components/admin/games/game-detail-layout.tsx` - Game detail page

**People/Works Domain:**
- `src/components/admin/people/person-list.tsx` - People table
- `src/components/admin/people/person-form.tsx` - Person create/edit
- `src/components/admin/works/work-list.tsx` - Works table with type filter
- `src/components/admin/works/work-form.tsx` - Work create/edit
- `src/components/admin/works/type-filter.tsx` - Client component for filtering

**Import Domain:**
- `src/components/admin/import/import-wizard.tsx` - Multi-step import orchestrator
- `src/components/admin/import/import-form.tsx` - URL input step
- `src/components/admin/import/preview-table.tsx` - Preview nominations step

**Shared Features:**
- `src/components/admin/shared/confirm-dialog.tsx` - Reusable confirmation dialog
- `src/components/admin/shared/toast.tsx` - Toast notification component

**Custom Hooks:**
- `src/hooks/admin/use-form-submission.ts` - Form state, optimistic updates, errors
- `src/hooks/admin/use-confirm-dialog.ts` - Confirmation dialog state management
- `src/hooks/admin/use-toast.ts` - Toast notification state
- `src/hooks/admin/use-admin-navigation.ts` - Type-safe navigation using routes.ts
- `src/hooks/admin/use-event-management.ts` - Event CRUD operations
- `src/hooks/admin/use-category-ordering.ts` - Drag-and-drop category reordering
- `src/hooks/admin/use-nomination-manager.ts` - Nomination CRUD within category
- `src/hooks/admin/use-game-status.ts` - Game status machine transitions

**Tests:**
- `src/components/admin/ui/__tests__/admin-table.test.tsx`
- `src/components/admin/ui/__tests__/admin-form.test.tsx`
- `src/hooks/admin/__tests__/use-form-submission.test.ts`
- `src/hooks/admin/__tests__/use-confirm-dialog.test.ts`
- (Additional tests per `testing.md` requirements)

### Modified Files

**Admin Pages** (Server Components - data fetching only):
- `src/app/(admin)/admin/events/page.tsx` - Use EventManager orchestrator
- `src/app/(admin)/admin/events/[id]/page.tsx` - Use EventDetailOrchestrator
- `src/app/(admin)/admin/games/page.tsx` - Use GameManager orchestrator
- `src/app/(admin)/admin/games/[id]/page.tsx` - Use GameDetailOrchestrator
- `src/app/(admin)/admin/people/page.tsx` - Use PeopleManager orchestrator
- `src/app/(admin)/admin/people/[id]/page.tsx` - Use PersonForm component
- `src/app/(admin)/admin/works/page.tsx` - Use WorksManager orchestrator
- `src/app/(admin)/admin/works/[id]/page.tsx` - Use WorkForm component
- `src/app/(admin)/admin/events/[id]/categories/[categoryId]/page.tsx` - Use CategoryDetailLayout
- `src/app/(admin)/admin/import/page.tsx` - Use ImportWizard orchestrator

**Removed Files:**
- `src/app/(admin)/admin/_components/confirm-delete-button.tsx` - Replaced by shared ConfirmDialog
- `src/app/(admin)/admin/works/_components/type-filter.tsx` - Moved to works domain
- `src/app/(admin)/admin/import/_components/import-form.tsx` - Moved to import domain
- `src/app/(admin)/admin/import/_components/preview-table.tsx` - Moved to import domain

### Dependencies

**shadcn/ui components to install:**
```bash
pnpm dlx shadcn@latest add table card form button input textarea select label badge dialog alert separator dropdown-menu tabs toast scroll-area skeleton command
```

See: https://ui.shadcn.com/docs/components for component APIs

**Existing dependencies (no new packages):**
- next-safe-action - Server action validation
- ts-pattern - State machine handling
- zod - Input validation
- React Hook Form (via shadcn Form) - Form state management

### Integration Points

- **Server Actions**: All mutations via `src/lib/actions/admin-actions.ts` using next-safe-action (per `patterns.md:1246-1328`)
- **Routes**: All navigation via `src/lib/routes.ts` centralized routes (per `patterns.md:1065-1243`)
- **Auth**: Server Components use `requireValidatedSession()` (per `patterns.md:830-1062`)
- **Models**: Admin pages can query models directly for reads (architecture.md allows in admin context)
- **Validation**: Zod schemas in `src/schemas/` (per `tech-stack.md:81-96`)

## Acceptance Criteria

**Constitution compliance:**
- [ ] All patterns followed (@docs/constitutions/current/patterns.md)
  - [ ] Server/Client component boundaries (patterns.md:17-316)
  - [ ] Modular component architecture (patterns.md:340-828)
  - [ ] Centralized routes for navigation (patterns.md:1065-1243)
  - [ ] requireValidatedSession() for auth (patterns.md:830-1062)
  - [ ] next-safe-action for server actions (patterns.md:1246-1328)
  - [ ] Proper typing, no type assertions (patterns.md:1410-1626)
- [ ] Architecture boundaries respected (@docs/constitutions/current/architecture.md)
  - [ ] Server Components fetch data, pass to client orchestrators
  - [ ] Client components handle UI state and interactions
  - [ ] Mutations go through actions layer
- [ ] Testing requirements met (@docs/constitutions/current/testing.md)
  - [ ] Hooks unit tested with renderHook
  - [ ] Feature components tested with mock callbacks
  - [ ] Orchestrators have integration tests

**Feature-specific:**
- [ ] All shadcn/ui components installed and functioning
- [ ] AdminTable supports sorting, filtering, row actions
- [ ] AdminForm displays validation errors inline
- [ ] ConfirmDialog confirms destructive operations
- [ ] Toast shows success/error messages
- [ ] All admin pages migrated to new architecture
- [ ] All interactive elements have ARIA labels
- [ ] Keyboard navigation works throughout
- [ ] Empty states provide clear guidance
- [ ] Loading states show during async operations
- [ ] Optimistic updates feel responsive

**Verification:**
- [ ] All tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Admin workflows function end-to-end
- [ ] Screen readers can navigate all interactions
- [ ] No console errors or warnings

## Open Questions

None - design validated through brainstorming phases 1-3.

## References

- Architecture: @docs/constitutions/current/architecture.md
- Patterns: @docs/constitutions/current/patterns.md
- Schema Rules: @docs/constitutions/current/schema-rules.md
- Tech Stack: @docs/constitutions/current/tech-stack.md
- Testing: @docs/constitutions/current/testing.md
- shadcn/ui: https://ui.shadcn.com/docs
- React Hook Form: https://react-hook-form.com (used by shadcn Form)
