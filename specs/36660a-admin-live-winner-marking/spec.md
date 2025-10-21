---
runId: 36660a
feature: admin-live-winner-marking
created: 2025-01-21
status: draft
---

# Feature: Live Winner Marking for Game Admin

**Status**: Draft
**Created**: 2025-01-21

## Problem Statement

**Current State:**
Admins can mark winners by navigating to individual category detail pages (`/admin/events/[id]/categories/[categoryId]`), editing the category, and setting the winner nomination ID. During a live ceremony, this workflow requires:
- Multiple page navigations (one per category)
- Scrolling through edit forms
- No visibility into how many users picked each nomination
- Difficult to track which categories have been marked

**Desired State:**
During a live ceremony, admin needs a focused interface to:
- View all categories for a specific game in one scrollable list
- See pick distribution (how many users picked each nomination)
- Quickly mark winners with minimal clicks
- Track progress (which categories are marked/revealed)
- Correct mistakes (change or unmark winners)

**Gap:**
No dedicated live winner marking interface exists. Current category edit workflow not optimized for speed during live events.

## Requirements

> **Note**: All features must follow @docs/constitutions/current/

### Functional Requirements

**FR1: Live Winner Marking Page**
- New page at `/admin/games/[gameId]/live`
- Displays all categories for the game's event, ordered by `Category.order` ascending
- Shows category name, point value, and reveal status

**FR2: Pick Distribution Display**
- For each category, display all nominations with pick counts
- Pick counts scoped to the specific game (not all games using the event)
- Nominations sorted by pick count descending
- Format: "Nomination Title (X picks)"

**FR3: Winner Selection**
- Dropdown per category showing all nominations (titles only)
- Selecting nomination marks winner (sets `Category.winnerNominationId`) AND reveals (sets `Category.isRevealed: true`) in one action
- Visual indicator when winner is marked ("Current: {nomination} ✓")

**FR4: Winner Editing**
- Allow changing winner (select different nomination from dropdown)
- Allow unmarking winner (clear button sets `winnerNominationId: null`, `isRevealed: false`)
- No confirmation prompts (fast workflow during live event)

**FR5: Navigation**
- Link to live page from `/admin/games/[gameId]` detail page ("Live Winner Marking" button)
- Breadcrumb on live page: "Games > {Game Name} > Live"
- Back link returns to game detail

**FR6: Authorization**
- Page requires ADMIN role (via `requireValidatedSession()` + role check)
- Server actions use `adminAction` client from next-safe-action

### Non-Functional Requirements

**NFR1: Performance**
- Pick count aggregation: Single batch query for all categories (avoid N+1)
- Page load < 1s for events with 20 categories, 5 nominations each
- Index: Picks already indexed on `[gameId]` and `[categoryId]`

**NFR2: No Real-Time Updates**
- Page refresh after server action completes
- No WebSocket updates for multi-admin scenarios
- Acceptable: Single admin use case is primary

**NFR3: Mobile Compatibility**
- Vertical scrolling layout works on tablets (iPad during live event)
- Dropdown native `<select>` element (mobile-friendly)
- No horizontal scrolling required

**NFR4: Error Handling**
- Display error message if server action fails ("Failed to mark winner. Please try again.")
- Invalid nomination ID rejected by server action schema validation
- Service layer validates nomination belongs to category

## Architecture

> **Layer boundaries**: @docs/constitutions/current/architecture.md
> **Required patterns**: @docs/constitutions/current/patterns.md

### Components

**New Files:**

**Page:**
- `src/app/(admin)/admin/games/[gameId]/live/page.tsx` - Server Component, fetches game + categories + pick counts, renders category list

**Components:**
- `src/components/admin/games/category-card.tsx` - Client Component ("use client"), displays category with nominations and winner selector
- Uses `useAction` from next-safe-action for dropdown onChange and clear button onClick

**Models:**
- `src/lib/models/pick.ts` - Add `getPickCountsByCategory(gameId: string, categoryId: string): Promise<Array<{ nominationId: string; count: number }>>`
- Prisma aggregation query: `groupBy({ by: ['nominationId'], where: { gameId, categoryId }, _count: { id: true } })`

**Services:**
- `src/lib/services/category-service.ts` - Add `markWinner(categoryId, nominationId)`, `clearWinner(categoryId)`
- Calls `categoryModel.update(categoryId, { winnerNominationId, isRevealed: true })` or `{ winnerNominationId: null, isRevealed: false }`

**Actions:**
- `src/lib/actions/admin-actions.ts` - Add `markWinnerAction`, `clearWinnerAction`
- Uses `adminAction` client (ADMIN role middleware)
- Schemas: `{ categoryId: z.string(), nominationId: z.string() }` and `{ categoryId: z.string() }`

**Modified Files:**
- `src/lib/routes.ts` - Add `admin.games.live: (gameId: string) => \`/admin/games/${gameId}/live\``
- `src/app/(admin)/admin/games/[gameId]/page.tsx` - Add "Live Winner Marking" link to game detail page

### Dependencies

**No new packages required.**

All dependencies already in tech stack:
- next-safe-action (server actions)
- Zod (validation)
- Tailwind CSS (styling)
- Prisma (aggregation queries)

See: @docs/constitutions/current/tech-stack.md

**No schema changes required.**

Uses existing fields:
- `Category.winnerNominationId` (nullable string)
- `Category.isRevealed` (boolean)
- `Category.order` (int, for sorting)

### Integration Points

**Authentication:**
- Uses `requireValidatedSession()` from `@/lib/auth/config` (validates JWT + user exists in DB)
- Role check: `session.user.role === 'ADMIN'` in page component
- Pattern: @docs/constitutions/current/patterns.md#session-validation

**Data Access:**
- Prisma client per @docs/constitutions/current/tech-stack.md
- Layer boundaries: Page → Actions → Services → Models → Prisma
- No Prisma imports outside Models layer

**Validation:**
- Zod schemas in server actions via next-safe-action
- Pattern: @docs/constitutions/current/patterns.md#next-safe-action

**Routing:**
- Centralized routes from `src/lib/routes.ts`
- Pattern: @docs/constitutions/current/patterns.md#centralized-routes

**Server/Client Boundaries:**
- CategoryCard is Client Component (needs event handlers)
- Page is Server Component (fetches data)
- Pattern: @docs/constitutions/current/patterns.md#server-client-component-boundaries

## Acceptance Criteria

**Constitution compliance:**
- [ ] All patterns followed (@docs/constitutions/current/patterns.md)
  - next-safe-action for server actions
  - requireValidatedSession() for auth
  - Centralized routes for navigation
  - Server/Client component boundaries respected
- [ ] Architecture boundaries respected (@docs/constitutions/current/architecture.md)
  - Models: Prisma queries only
  - Services: Business logic, calls models
  - Actions: Validation, calls services
  - UI: Server Components + minimal Client Components
- [ ] Testing requirements met (@docs/constitutions/current/testing.md)
  - Model: Test pick count aggregation
  - Service: Test markWinner/clearWinner logic
  - Action: Test schema validation
  - Component: Test CategoryCard interactions

**Feature-specific:**
- [ ] Navigate to `/admin/games/[gameId]/live` shows category list
- [ ] Categories ordered by `order` field ascending
- [ ] Each category shows nominations sorted by pick count descending
- [ ] Pick counts accurate for that game's picks only
- [ ] Dropdown shows all nominations for category (titles only)
- [ ] Selecting nomination from dropdown marks winner AND reveals
- [ ] Marked categories show "Current: {nomination} ✓"
- [ ] Clear button removes winner AND unreveals
- [ ] Error message displayed if server action fails
- [ ] Categories with no nominations show disabled state
- [ ] Back link returns to game detail page
- [ ] Non-admin users redirected (ADMIN role required)
- [ ] "Live Winner Marking" link added to game detail page

**Verification:**
- [ ] All tests pass (pnpm test)
- [ ] Linting passes (pnpm lint)
- [ ] Feature works end-to-end (manual testing on dev)
- [ ] Mobile/tablet layout works (test on iPad viewport)

## Open Questions

None - design validated through brainstorming.

## References

- Architecture: @docs/constitutions/current/architecture.md
- Patterns: @docs/constitutions/current/patterns.md
- Schema Rules: @docs/constitutions/current/schema-rules.md
- Tech Stack: @docs/constitutions/current/tech-stack.md
- Testing: @docs/constitutions/current/testing.md
- Next.js Params (Async): @docs/constitutions/current/patterns.md#async-params-and-searchparams
