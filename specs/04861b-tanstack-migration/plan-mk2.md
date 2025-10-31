# TanStack Migration - Phase 2 Completion Plan

**Status:** Phase 1 Complete (Backend + Core User Flows Working)
**Remaining Work:** Admin UI, Wikipedia Import, UX Polish
**Target:** Feature parity with Next.js version

---

## Overview

This plan covers the remaining UI components and admin features needed to achieve feature parity with the Next.js version. Phase 1 (Phases 1-5 from original plan) successfully migrated:
- ✅ Backend infrastructure (100%)
- ✅ API layer with tRPC (100%)
- ✅ Core user flows (80%)
- ✅ Real-time WebSocket integration (100%)
- ✅ Testing infrastructure (100%)

**Remaining:** Admin UI components, Wikipedia import system, and UX polish.

---

## Phase 6: Admin CRUD Forms

**Strategy:** Sequential
**Reason:** Forms share common components and patterns
**Phase Time:** 16h

### Task 6.1: Missing UI Components

**Files:**
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/ui/table.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/ui/tabs.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/ui/textarea.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/ui/scroll-area.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/ui/skeleton.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/ui/alert.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/ui/dropdown-menu.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/ui/command.tsx`

**Complexity:** S (2h)

**Dependencies:** None

**Description:**
Port missing shadcn/ui components from Next.js project. These are needed for admin forms and tables.

**Implementation Steps:**
1. Copy UI components from Next.js project
2. Update imports to use TanStack Router (if needed)
3. Verify components render correctly
4. Add to component exports

**Reference:**
- Copy from `bignight.party/src/components/ui/*`

**Acceptance Criteria:**
- [ ] All 8 UI components ported
- [ ] Components render without errors
- [ ] TypeScript types correct
- [ ] Exports added to `src/app/components/ui/index.ts`

**Quality Gates:**
```bash
bun run typecheck  # No errors
bun run lint       # No errors
```

---

### Task 6.2: Event Create/Edit Forms

**Files:**
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/routes/admin.events.new.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/routes/admin.events.$eventId.edit.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/admin/events/event-form.tsx`

**Complexity:** M (4h)

**Dependencies:** Task 6.1 (needs textarea component)

**Description:**
Create admin routes and forms for creating/editing events.

**Implementation Steps:**
1. Create tRPC procedures for create/update event:
   - `event.create` mutation
   - `event.update` mutation
2. Create `event-form.tsx` component:
   - Name, description, event date fields
   - Uses react-hook-form + Zod validation
3. Create `/admin/events/new` route:
   - Renders event form
   - Calls `event.create` on submit
   - Redirects to event detail on success
4. Create `/admin/events/$eventId/edit` route:
   - Loads existing event data
   - Renders event form with values
   - Calls `event.update` on submit
5. Add "New Event" button to events list
6. Add "Edit" button to event detail page

**Reference:**
- Form component: `bignight.party/src/components/admin/events/event-form.tsx`
- Original routes: `bignight.party/src/app/(admin)/admin/events/*`

**Acceptance Criteria:**
- [ ] Can create new events via form
- [ ] Can edit existing events
- [ ] Form validation works (required fields)
- [ ] Redirects to detail page after save
- [ ] Error messages display on failure

**Quality Gates:**
```bash
bun run test  # All tests pass
# Manual: Create event → verify saved → edit → verify updated
```

---

### Task 6.3: Game Create/Edit Forms

**Files:**
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/routes/admin.games.new.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/routes/admin.games.$gameId.edit.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/admin/games/game-form.tsx`

**Complexity:** M (4h)

**Dependencies:** Task 6.2 (same pattern)

**Description:**
Create admin routes and forms for creating/editing games.

**Implementation Steps:**
1. Create tRPC procedures:
   - `game.create` mutation
   - `game.update` mutation (already exists via `updateStatus`, extend it)
2. Create `game-form.tsx` component:
   - Name, event selection, access code, picks lock date
   - Event dropdown (populated from `event.getAll`)
3. Create `/admin/games/new` route
4. Create `/admin/games/$gameId/edit` route
5. Add "New Game" button to games list
6. Add "Edit Game" button to game detail

**Reference:**
- `bignight.party/src/components/admin/games/game-form.tsx`

**Acceptance Criteria:**
- [ ] Can create new games
- [ ] Can edit existing games
- [ ] Event selection dropdown works
- [ ] Access code auto-generated if empty
- [ ] Picks lock date picker works

**Quality Gates:**
```bash
bun run test
# Manual: Create game → join with access code → verify works
```

---

### Task 6.4: Person & Work Create/Edit Forms

**Files:**
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/routes/admin.people.new.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/routes/admin.people.$personId.edit.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/routes/admin.works.new.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/routes/admin.works.$workId.edit.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/admin/people/person-form.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/admin/works/work-form.tsx`

**Complexity:** M (6h)

**Dependencies:** Task 6.3 (same pattern)

**Description:**
Create CRUD forms for people and works (actors, directors, movies, etc.).

**Implementation Steps:**
1. Create tRPC procedures:
   - `person.create`, `person.update` mutations
   - `work.create`, `work.update` mutations
2. Create `person-form.tsx`:
   - Name field
3. Create `work-form.tsx`:
   - Title, type (FILM/TV/OTHER), year
   - Type dropdown with enum values
4. Create 4 routes (new/edit for person/work)
5. Add "New" buttons to list pages
6. Add "Edit" buttons to detail pages

**Reference:**
- `bignight.party/src/components/admin/people/person-form.tsx`
- `bignight.party/src/components/admin/works/work-form.tsx`

**Acceptance Criteria:**
- [ ] Can create/edit people
- [ ] Can create/edit works
- [ ] Work type dropdown functional
- [ ] All forms validate correctly

**Quality Gates:**
```bash
bun run test
# Manual: Create person → create work → use in nomination
```

---

## Phase 7: Category & Nomination Management

**Strategy:** Sequential
**Reason:** Nominations depend on categories
**Phase Time:** 12h

### Task 7.1: Category Management

**Files:**
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/routes/admin.events.$eventId.categories.new.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/routes/admin.events.$eventId.categories.$categoryId.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/admin/categories/category-form.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/admin/categories/category-list.tsx`

**Complexity:** M (6h)

**Dependencies:** Task 6.2 (needs events to exist)

**Description:**
Add nested routes for managing categories within events. Categories are created within the context of a specific event.

**Implementation Steps:**
1. Create tRPC procedures:
   - `category.create` mutation
   - `category.update` mutation
   - `category.delete` mutation
2. Update `admin.events.$eventId.tsx` to show categories list
3. Create `category-form.tsx`:
   - Name, points, order fields
   - Event context passed via route params
4. Create `/admin/events/$eventId/categories/new` route
5. Create `/admin/events/$eventId/categories/$categoryId` detail route
6. Add "New Category" button to event detail
7. Display categories as cards/table on event detail

**Reference:**
- `bignight.party/src/components/admin/categories/*`
- `bignight.party/src/app/(admin)/admin/events/[id]/categories/*`

**Acceptance Criteria:**
- [ ] Can create categories within an event
- [ ] Can edit category name/points/order
- [ ] Can delete categories (confirm dialog)
- [ ] Categories list shows on event detail
- [ ] Categories ordered by `order` field

**Quality Gates:**
```bash
bun run test
# Manual: Create event → add categories → verify ordering
```

---

### Task 7.2: Nomination Management

**Files:**
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/routes/admin.events.$eventId.categories.$categoryId.nominations.new.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/admin/nominations/nomination-form.tsx`
- Update: `/Users/drewritter/projects/bignight.party-no_nextjs/src/routes/admin.events.$eventId.categories.$categoryId.tsx`

**Complexity:** M (6h)

**Dependencies:** Task 7.1, Task 6.4 (needs categories, people, works)

**Description:**
Add nomination management within categories. Nominations can reference either a Person OR a Work.

**Implementation Steps:**
1. Create tRPC procedures:
   - `nomination.create` mutation
   - `nomination.update` mutation
   - `nomination.delete` mutation
2. Create `nomination-form.tsx`:
   - Type selector: "Person" or "Work"
   - Conditional fields based on type:
     - If Person: dropdown of people
     - If Work: dropdown of works
   - Auto-populated from `person.getAll` and `work.getAll`
3. Create `/admin/events/$eventId/categories/$categoryId/nominations/new` route
4. Update category detail to show nominations list
5. Add "New Nomination" button
6. Add delete button per nomination (with confirm)

**Reference:**
- `bignight.party/src/app/(admin)/admin/events/[id]/categories/[categoryId]/nominations/new/page.tsx`
- Nomination form was inline, extract to component

**Acceptance Criteria:**
- [ ] Can add nominations to categories
- [ ] Person vs Work selection works
- [ ] Dropdowns populated correctly
- [ ] Can delete nominations
- [ ] Nominations display on category detail

**Quality Gates:**
```bash
bun run test
# Manual: Create category → add 5 nominations → submit picks for game
```

---

## Phase 8: Wikipedia Import System

**Strategy:** Sequential
**Reason:** Parser → Service → UI pipeline
**Phase Time:** 14h

### Task 8.1: Wikipedia Parser Implementation

**Files:**
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/server/parsers/wikipedia/wikipedia-parser.ts`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/server/parsers/wikipedia/wikipedia-adapter.ts`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/server/parsers/wikipedia/types.ts`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/server/parsers/wikipedia/__tests__/wikipedia-parser.test.ts`

**Complexity:** L (8h)

**Dependencies:** None

**Description:**
Port Wikipedia HTML parser that extracts awards data from Wikipedia pages (e.g., Academy Awards pages).

**Implementation Steps:**
1. Copy parser files from Next.js project
2. Update imports (lib/ → server/)
3. Port parser tests
4. Verify parser works with sample HTML
5. Add error handling for malformed HTML

**Reference:**
- Source: `bignight.party/src/lib/parsers/wikipedia/*`
- Parser extracts: Event name, categories, nominations from HTML tables

**Acceptance Criteria:**
- [ ] Parser extracts event data from Wikipedia HTML
- [ ] Parser extracts categories with correct point values
- [ ] Parser extracts nominations (person/work references)
- [ ] Parser tests pass (sample HTML → structured data)
- [ ] Error handling for invalid HTML

**Quality Gates:**
```bash
bun run test  # Parser tests pass
# Test with real Wikipedia HTML (97th Academy Awards)
```

---

### Task 8.2: Import Wizard UI

**Files:**
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/routes/admin.import.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/admin/import/import-wizard.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/admin/import/import-form.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/admin/import/preview-table.tsx`

**Complexity:** M (6h)

**Dependencies:** Task 8.1 (needs parser), Task 6.1 (needs table component)

**Description:**
Create multi-step wizard for importing Wikipedia data:
1. Paste HTML
2. Preview parsed data
3. Confirm import

**Implementation Steps:**
1. Create tRPC procedure:
   - `admin.importWikipedia` mutation (already exists, verify)
2. Create `import-wizard.tsx`:
   - Step 1: Textarea for Wikipedia HTML
   - Step 2: Preview table (categories, nominations count)
   - Step 3: Confirmation + import button
   - Progress indicator between steps
3. Create `import-form.tsx` (Step 1 component)
4. Create `preview-table.tsx` (Step 2 component):
   - Shows parsed categories
   - Shows nomination counts per category
   - Allows editing event name before import
5. Create `/admin/import` route
6. Add navigation link in admin sidebar

**Reference:**
- `bignight.party/src/components/admin/import/*`
- `bignight.party/src/app/(admin)/admin/import/page.tsx`

**Acceptance Criteria:**
- [ ] Can paste Wikipedia HTML
- [ ] Preview shows correct data
- [ ] Can edit event name before import
- [ ] Import creates event with categories & nominations
- [ ] Success message shows after import

**Quality Gates:**
```bash
bun run test
# Manual: Import 97th Academy Awards → verify all categories/nominations created
```

---

## Phase 9: Pick Wizard Enhancement

**Strategy:** Sequential
**Reason:** Components build on each other
**Phase Time:** 10h

### Task 9.1: Pick Wizard Components

**Files:**
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/game/pick-wizard/category-sidebar.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/game/pick-wizard/nomination-list.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/game/pick-wizard/pick-progress-tracker.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/game/pick-wizard/wizard-navigation.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/game/pick-wizard/save-indicator.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/game/pick-wizard/pick-status-banner.tsx`
- Update: `/Users/drewritter/projects/bignight.party-no_nextjs/src/routes/game.$gameId.pick.tsx`

**Complexity:** M (6h)

**Dependencies:** None

**Description:**
Enhance pick submission page with wizard UI for better UX:
- Category sidebar navigation
- Progress tracker
- Auto-save indicator
- Next/Previous navigation

**Implementation Steps:**
1. Create `category-sidebar.tsx`:
   - List of categories
   - Show checkmark if category has pick
   - Click to jump to category
2. Create `nomination-list.tsx`:
   - Radio button group for nominations
   - Shows person/work name
   - Selected state styling
3. Create `pick-progress-tracker.tsx`:
   - Shows "X / Y categories completed"
   - Progress bar
4. Create `wizard-navigation.tsx`:
   - Previous/Next buttons
   - Skip to category dropdown
5. Create `save-indicator.tsx`:
   - Shows "Saving..." / "Saved" status
6. Create `pick-status-banner.tsx`:
   - Shows "Picks locked" if past deadline
   - Shows "Game has started" if LIVE
7. Refactor `game.$gameId.pick.tsx` to use wizard components

**Reference:**
- `bignight.party/src/components/game/pick-wizard/*`

**Acceptance Criteria:**
- [ ] Category sidebar shows all categories
- [ ] Can navigate between categories
- [ ] Progress tracker updates as picks saved
- [ ] Save indicator shows save status
- [ ] Can't submit after picks locked
- [ ] Wizard navigation (prev/next) works

**Quality Gates:**
```bash
bun run test
# Manual: Submit picks → verify auto-save → verify progress updates
```

---

### Task 9.2: Pick Wizard Polish

**Files:**
- Update all pick wizard components from 9.1
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/game/nominee-card.tsx`

**Complexity:** S (4h)

**Dependencies:** Task 9.1

**Description:**
Add visual polish to pick wizard:
- Nominee cards with images (if available)
- Animations for transitions
- Mobile responsive design
- Keyboard navigation

**Implementation Steps:**
1. Create `nominee-card.tsx`:
   - Card layout for each nomination
   - Image placeholder (future: add images)
   - Selection styling
   - Hover effects
2. Add animations:
   - Fade transitions between categories
   - Checkmark animation when pick saved
3. Mobile responsive:
   - Sidebar collapses on mobile
   - Category selector dropdown instead
4. Keyboard navigation:
   - Arrow keys to move between nominations
   - Enter to select
   - Tab to next category

**Reference:**
- `bignight.party/src/components/nominee-card.tsx`

**Acceptance Criteria:**
- [ ] Nominee cards display correctly
- [ ] Animations smooth (no jank)
- [ ] Mobile view functional
- [ ] Keyboard shortcuts work

**Quality Gates:**
```bash
# Manual: Test on mobile viewport → test keyboard navigation
```

---

## Phase 10: Leaderboard Polish

**Strategy:** Sequential
**Reason:** Components layer on top of each other
**Phase Time:** 8h

### Task 10.1: Leaderboard Components

**Files:**
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/game/leaderboard/connection-status.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/game/leaderboard/game-header.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/game/leaderboard/leaderboard-list.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/game/leaderboard/player-card.tsx`
- Update: `/Users/drewritter/projects/bignight.party-no_nextjs/src/routes/game.$gameId.leaderboard.tsx`

**Complexity:** M (5h)

**Dependencies:** Phase 5.1 (WebSocket already working)

**Description:**
Break leaderboard into polished components with connection status indicator.

**Implementation Steps:**
1. Create `connection-status.tsx`:
   - Shows WebSocket connection state (Connected/Disconnected/Connecting)
   - Uses `useSocket` hook connection events
   - Color-coded indicator (green/red/yellow)
2. Create `game-header.tsx`:
   - Game name, event name, status badge
   - Extracted from current leaderboard page
3. Create `leaderboard-list.tsx`:
   - Maps over players
   - Renders player cards
   - Handles empty state
4. Create `player-card.tsx`:
   - Player rank, name, score
   - Highlight current user
   - Show correct picks count
5. Refactor `game.$gameId.leaderboard.tsx` to use components

**Reference:**
- `bignight.party/src/components/game/leaderboard/*`

**Acceptance Criteria:**
- [ ] Connection status indicator shows WebSocket state
- [ ] Game header displays correctly
- [ ] Player cards render in order (by score)
- [ ] Current user highlighted
- [ ] Empty state shows if no players

**Quality Gates:**
```bash
bun run test
# Manual: Open leaderboard → disconnect network → verify indicator changes
```

---

### Task 10.2: Leaderboard Real-time Animations

**Files:**
- Update: `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/game/leaderboard/player-card.tsx`
- Update: `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/game/leaderboard/leaderboard-list.tsx`

**Complexity:** S (3h)

**Dependencies:** Task 10.1

**Description:**
Add animations when leaderboard updates in real-time:
- Score change animations
- Rank change animations
- New player joins animation

**Implementation Steps:**
1. Add score change animation:
   - Flash green when score increases
   - Animate number count-up
2. Add rank change animation:
   - Move players up/down in list
   - Use Framer Motion or CSS transitions
3. Add new player animation:
   - Fade in when player joins
4. Optimize re-renders:
   - Use React.memo on player cards
   - Only re-render changed players

**Reference:**
- Next.js version had basic animations, enhance them

**Acceptance Criteria:**
- [ ] Score changes animate smoothly
- [ ] Rank changes animate positions
- [ ] No layout thrashing
- [ ] Performance: 60fps on 50+ players

**Quality Gates:**
```bash
# Manual: Mark winner → verify leaderboard animates
# Performance: Chrome DevTools FPS meter shows 60fps
```

---

## Phase 11: Admin Live Game Control

**Strategy:** Sequential
**Reason:** Single feature
**Phase Time:** 6h

### Task 11.1: Live Game Admin Interface

**Files:**
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/routes/admin.games.$gameId.live.tsx`
- `/Users/drewritter/projects/bignight.party-no_nextjs/src/app/components/admin/games/category-card.tsx`

**Complexity:** M (6h)

**Dependencies:** Phase 5.1 (WebSocket), Task 7.1 (categories)

**Description:**
Create admin interface for controlling live games (marking winners during ceremony).

**Implementation Steps:**
1. Create tRPC procedure (already exists):
   - `category.markWinner` mutation
   - Verify it emits WebSocket event
2. Create `category-card.tsx`:
   - Shows category name, points
   - List of nominations as buttons
   - Click nomination → marks as winner
   - Shows checkmark on selected winner
   - Disabled if already revealed
3. Create `/admin/games/$gameId/live` route:
   - Requires ADMIN role
   - Shows all categories for game's event
   - Renders category cards
   - Updates in real-time (WebSocket)
4. Add "Live Control" button to game detail page

**Reference:**
- `bignight.party/src/app/(admin)/admin/games/[id]/live/page.tsx`
- `bignight.party/src/components/admin/games/category-card.tsx`

**Acceptance Criteria:**
- [ ] Admin can view live control page
- [ ] Can mark winners by clicking nominations
- [ ] WebSocket broadcasts winner to all clients
- [ ] Leaderboard updates in real-time
- [ ] Can't change winner once marked (or add confirmation)

**Quality Gates:**
```bash
bun run test
# Manual: Open live control + leaderboard → mark winner → verify both update
```

---

## Summary

### Phase Overview

| Phase | Name | Time | Dependencies |
|-------|------|------|--------------|
| 6 | Admin CRUD Forms | 16h | None |
| 7 | Category & Nomination Mgmt | 12h | Phase 6 |
| 8 | Wikipedia Import | 14h | None (parallel) |
| 9 | Pick Wizard Enhancement | 10h | None (parallel) |
| 10 | Leaderboard Polish | 8h | Phase 5 (done) |
| 11 | Live Game Control | 6h | Phase 7 |

**Total Sequential Time:** 66h
**With Parallelization:** ~48h (Phases 8, 9, 10 can run parallel to 6-7)

---

## Parallelization Strategy

### Wave 1 (16h)
- Phase 6: Admin CRUD Forms

### Wave 2 (14h - parallel)
- Phase 7: Category & Nomination Mgmt
- Phase 8: Wikipedia Import (can start anytime)

### Wave 3 (10h - parallel)
- Phase 9: Pick Wizard Enhancement
- Phase 10: Leaderboard Polish

### Wave 4 (6h)
- Phase 11: Live Game Control (needs Phase 7)

**Optimized Total: ~48 hours**

---

## Migration Completion Metrics

### Current State (Phase 1 Complete)
- Backend: ✅ 100%
- API Layer: ✅ 100%
- Core User Flows: ✅ 80%
- Admin UI: ⚠️ 30%
- UX Polish: ⚠️ 40%

### After Phase 2 (All Phases Complete)
- Backend: ✅ 100%
- API Layer: ✅ 100%
- Core User Flows: ✅ 100%
- Admin UI: ✅ 100%
- UX Polish: ✅ 100%

**Result:** Full feature parity with Next.js version

---

## Testing Strategy

Each phase includes:
1. Unit tests for new components
2. Integration tests for tRPC procedures
3. Manual testing checklist
4. E2E tests for critical flows

**Regression Testing:**
After each phase, verify existing functionality still works:
- Players can join games ✅
- Players can submit picks ✅
- Leaderboard updates in real-time ✅
- Admin can view lists ✅

---

## Next Steps

Execute phases sequentially or use parallelization strategy:

```bash
# Sequential execution
/spectacular:execute @specs/04861b-tanstack-migration/plan-mk2.md

# Or run specific phase
# Example: Start with Phase 6
cd /Users/drewritter/projects/bignight.party-no_nextjs
# Begin Task 6.1: Missing UI Components
```

**Recommended Approach:**
1. Start with Phase 6 (Admin CRUD) - enables full admin functionality
2. Run Phases 8-10 in parallel (Import, Wizard, Leaderboard)
3. Finish with Phase 11 (Live Control)

This maximizes feature delivery while maintaining quality gates.
