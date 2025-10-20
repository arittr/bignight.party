# Feature: User Pick Wizard

**Status**: Draft
**Created**: 2025-10-20

## Problem Statement

**Current State:**
BigNight.Party has a complete admin interface for managing events, categories, and nominations. Users can authenticate via magic links. However, there is no user-facing interface for making predictions, no game membership tracking, and no dashboard for users to see their games.

**Desired State:**
Users receive invite links with game codes, sign up and automatically join that game, land on a dashboard showing "My Games", and can enter any game to make predictions via a category-by-category wizard with autosave. Users can be members of multiple games.

**Gap:**
Need to build game membership system (GameParticipant table), invite flow, user dashboard, game access logic (join vs return), and the entire pick wizard UI with autosave and locking.

## Requirements

> **Note**: All features must follow @docs/constitutions/current/

### Functional Requirements

**FR1: Invite Flow & Game Membership**
- New users receive invite link: `/signup?code=GAMECODE`
- Sign-in flow captures invite code and auto-joins game after authentication
- After signup, user lands on dashboard with success toast: "✓ You've joined [Game Name]!"
- GameParticipant record created (userId + gameId + joinedAt) to track membership
- Toast auto-dismisses after 5 seconds

**FR2: Dashboard**
- After login, users see `/dashboard` with "My Games" list
- Shows all games user has joined (from GameParticipant table)
- Each game shows: name, event name, status, completion count (X/Y categories completed)
- Click game → navigate to `/game/[gameId]/pick` (uses DB ID, not access code)

**FR3: Game Access - Direct Links**
- Direct URLs with access code (`/game/[code]` or `/game/[code]/pick`) work for sharing
- If user is already a member: redirect to `/game/[gameId]/pick` (resolve gameId from code)
- If user is NOT a member: show game info page with "Join Game" button (explicit join required)
- After clicking "Join Game": create GameParticipant record, then redirect to pick wizard

**FR4: Pick Wizard Navigation**
- Single route (`/game/[gameId]/pick`) with URL query parameter for category navigation (uses DB ID)
- Hybrid navigation: progress stepper with clickable category indicators + Previous/Next buttons
- Browser back/forward buttons work naturally with URL state
- Progress indicator shows "Category X of Y • Z completed"
- Categories displayed in order defined by `Category.order` field

**FR5: Nominee Selection**
- Nominees displayed as cards in responsive grid (2-3 per row)
- Each card shows: Work poster/Person photo, nomination text, work/person details
- If image is null, show gray placeholder with film/person icon
- Nomination text wraps to multiple lines (no truncation)
- Single selection per category (radio button behavior)
- Selected card shows visual feedback (blue border, checkmark, blue background)
- Click to select, click again to deselect (optional picks)

**FR6: Autosave**
- Picks automatically saved on each selection (no manual save button)
- Immediate optimistic UI update
- Server action called with pick data (upserts via unique constraint)
- Save status indicator: "Saving..." → "Saved ✓" → disappears after 2s
- Network errors show retry option

**FR7: Draft Management**
- Users can navigate between categories freely without losing selections
- Partial completion allowed during OPEN status
- Existing picks loaded on page load and pre-populate selections
- Skip categories permitted (scores 0 points for skipped)

**FR8: Game Status Locking**
- Picks only editable when `game.status === 'OPEN'`
- When game status is not OPEN: disable all cards, show "Picks are locked" banner
- Server action validates game status before saving (rejects if locked)
- User must refresh page to see status changes (no real-time WebSocket for lock state)

**FR9: Completion Tracking**
- Show count of completed categories (categories with Pick records)
- No enforcement of 100% completion before game starts
- Incomplete categories score 0 points when game goes LIVE

**FR10: Lock Time Warning**
- If game.status is OPEN and `picksLockAt` is within 30 minutes, show warning banner
- Banner text: "⚠️ Game starts in X minutes! You have Y incomplete categories."
- Only display if user has incomplete picks (some categories without Pick records)
- Warning appears at top of pick wizard page

### Non-Functional Requirements

**NFR1: Performance**
- Initial page load fetches only current category's nominations (not all categories)
- Category navigation updates URL without full page reload
- Images lazy-loaded with placeholders
- Autosave debounced if multiple rapid clicks

**NFR2: Mobile Responsive**
- Works on mobile, tablet, and desktop
- Card grid adjusts for screen size (1 column mobile, 2-3 desktop)
- Touch-friendly card selection (minimum 44px tap targets)
- Progress stepper scrollable horizontally on mobile

**NFR3: Accessibility**
- Keyboard navigation through categories and cards
- ARIA labels on interactive elements
- Focus indicators visible
- Screen reader friendly progress announcements

**NFR4: Data Integrity**
- Unique constraint on Pick (gameId + userId + categoryId) prevents duplicates
- Upsert pattern allows changing picks without errors
- Server-side validation prevents picks after game locked

## Architecture

> **Layer boundaries**: @docs/constitutions/current/architecture.md
> **Required patterns**: @docs/constitutions/current/patterns.md

### Components

**New Files:**

**Models Layer:**
- `src/lib/models/game-participant-model.ts` - Data access for GameParticipant join table (membership CRUD)
- `src/lib/models/pick-model.ts` - Data access for Pick table (CRUD operations)
- `src/lib/models/nomination-model.ts` - Add `getNominationsByCategoryId` method
- `src/lib/models/category-model.ts` - Add `getCategoriesByEventId` method

**Services Layer:**
- `src/lib/services/game-service.ts` - Add methods for joining games, checking membership
- `src/lib/services/pick-service.ts` - Business logic for pick submission (status validation, nomination validation)

**Actions Layer:**
- `src/lib/actions/game-actions.ts` - Server actions for joining games
- `src/lib/actions/pick-actions.ts` - Server actions with next-safe-action for pick submission

**UI Layer:**
- `src/app/signup/page.tsx` - Signup page that captures `?code=X` and auto-joins after auth
- `src/app/dashboard/page.tsx` - User dashboard (Server Component, shows "My Games" list)
- `src/app/game/[code]/page.tsx` - Game access resolver (checks membership, shows join button or redirects)
- `src/app/game/[gameId]/pick/page.tsx` - Pick wizard page (Server Component, fetches data based on query param)
- `src/components/pick-wizard.tsx` - Client Component for wizard UI (navigation, progress stepper)
- `src/components/nominee-card.tsx` - Client Component for selectable nominee cards
- `src/components/category-progress-stepper.tsx` - Client Component for category navigation with progress indicators
- `src/components/game-list-item.tsx` - Client Component for dashboard game cards

**Schemas:**
- `src/schemas/pick-schema.ts` - Zod validation schema for pick submission
- `src/schemas/game-schema.ts` - Zod validation schema for joining games

**Modified Files:**
- `src/app/(auth)/sign-in/page.tsx` - Capture `returnUrl` or `code` query params for post-auth redirect

### Dependencies

**Existing packages:**
- `next-safe-action` - Server action validation (already in project)
- `zod` - Input validation (already in project)
- `ts-pattern` - Exhaustive status checking (already in project)

**No new packages needed.**

### Integration Points

**Authentication:**
- Uses existing Auth.js v5 setup
- Middleware protects `/game/*` routes
- `authenticatedAction` from `src/lib/actions/safe-action.ts` provides `ctx.userId`

**Database:**
- Prisma client per @docs/constitutions/current/tech-stack.md
- Pick model already exists with correct schema
- Unique constraint `@@unique([gameId, userId, categoryId])` enables upsert pattern
- **Schema change needed**: New `GameParticipant` model with `userId + gameId + joinedAt`
- **Migration**: `add_game_participant` - Create join table for game membership tracking

**Validation:**
- Zod schemas per @docs/constitutions/current/patterns.md
- All inputs validated via next-safe-action

**Real-time (Future):**
- No WebSocket integration for lock state in initial version
- Lock state checked on page load only
- Future enhancement: WebSocket notification when game status changes

### Data Flow

**Invite & Signup:**
1. User receives link: `/signup?code=PARTY2025`
2. Signup page captures code in URL, shows sign-in form
3. After auth, callback checks for pending code
4. Create GameParticipant record (auto-join)
5. Redirect to `/dashboard`

**Dashboard Load:**
1. Server Component at `/dashboard` fetches user's games
2. Query GameParticipant where userId = current user
3. Include game + event data for each
4. Calculate completion count per game (count picks vs total categories)
5. Display game cards with "Continue Making Picks" buttons

**Game Access via Direct Link:**
1. User navigates to `/game/[code]` or `/game/[code]/pick`
2. Server Component looks up game by access code
3. Check if GameParticipant record exists for (userId, gameId)
4. If member: redirect to `/game/[gameId]/pick` (DB ID)
5. If not member: show game info page with "Join Game" button
6. Click "Join Game" → create GameParticipant → redirect to pick wizard

**Pick Wizard Page Load:**
1. Server Component at `/game/[gameId]/pick?category=[id]` runs
2. Verify user is game participant (check GameParticipant table)
3. Fetch game by DB ID via `gameModel.getGameById(gameId)`
4. Fetch categories via `categoryModel.getCategoriesByEventId(game.eventId)`
5. Fetch nominations for current category via `nominationModel.getNominationsByCategoryId(categoryId)`
6. Fetch existing picks via `pickModel.getPicksByGameAndUser(gameId, userId)`
7. Pass data as props to Client Components

**Pick Submission:**
1. User clicks nominee card in Client Component
2. Optimistic UI update (show selected state)
3. Call `submitPickAction({ gameId, categoryId, nominationId })`
4. Server action validates with Zod schema
5. Service layer validates user is participant (check GameParticipant)
6. Service layer validates game.status === 'OPEN'
7. Service layer validates nomination belongs to category
8. Model layer upserts Pick (unique constraint handles overwrites)
9. Return success/error to client

**Category Navigation:**
1. User clicks category in stepper or Previous/Next button
2. Client Component updates URL query param via `router.push()`
3. Server Component re-renders with new category data
4. Existing picks pre-populate selected state

### State Management

**Server State (fetched per route):**
- Current game
- All categories for event
- Nominations for current category
- User's existing picks

**Client State (Pick Wizard Component):**
- `selectedNominationId` - Current selection for displayed category
- `isSaving` - Loading state during autosave
- `currentCategoryIndex` - For Previous/Next navigation

**URL State:**
- `?category=[categoryId]` - Current category being viewed
- Browser history enables back/forward navigation

## Acceptance Criteria

**Constitution compliance:**
- [x] Server actions use next-safe-action (@docs/constitutions/current/patterns.md)
- [x] Game status checked with ts-pattern and .exhaustive() in service layer
- [x] Layer boundaries respected (Pick queries only in models/, business logic in services/)
- [x] All inputs validated with Zod schemas

**Feature-specific:**

*Invite & Membership:*
- [ ] User can access `/signup?code=GAMECODE` invite link
- [ ] After sign-in with invite code, GameParticipant record created automatically
- [ ] After signup, user redirects to dashboard with success toast
- [ ] Success toast shows "✓ You've joined [Game Name]!" and auto-dismisses after 5s
- [ ] GameParticipant table tracks userId + gameId + joinedAt

*Dashboard:*
- [ ] Dashboard at `/dashboard` shows "My Games" list
- [ ] Each game card shows name, event name, status, completion (X/Y categories)
- [ ] Clicking game navigates to `/game/[gameId]/pick`

*Game Access:*
- [ ] Direct link `/game/[code]` resolves game by access code
- [ ] If user is member: redirect to `/game/[gameId]/pick`
- [ ] If user is NOT member: show game info page with "Join Game" button
- [ ] Clicking "Join Game" creates GameParticipant and redirects to pick wizard

*Pick Wizard:*
- [ ] Pick wizard shows categories with progress stepper
- [ ] Categories displayed in order defined by Category.order field
- [ ] Nominee cards display images, nomination text, and work/person details
- [ ] Missing images show gray placeholder with film/person icon
- [ ] Nomination text wraps to multiple lines (no truncation)
- [ ] User can click nominee card to select/deselect
- [ ] Selected nominee shows visual feedback (border, checkmark, background)
- [ ] Pick automatically saves on selection with "Saving..." → "Saved ✓" indicator
- [ ] User can navigate between categories without losing picks
- [ ] Existing picks pre-populate on page load
- [ ] Previous/Next buttons navigate through categories
- [ ] Progress stepper shows completion count
- [ ] User can click any category in stepper to jump to it
- [ ] When game.status !== 'OPEN', all cards disabled and banner shows "Picks are locked"
- [ ] Server action rejects pick submission if game locked
- [ ] Server action validates user is game participant before saving pick
- [ ] User can skip categories (partial completion allowed)
- [ ] If picksLockAt within 30 mins and picks incomplete, show warning banner
- [ ] Warning banner shows time remaining and incomplete category count
- [ ] Mobile responsive (1 column on small screens, 2-3 on large)
- [ ] Browser back/forward buttons work for category navigation

**Verification:**
- [ ] Tests pass (TDD per @docs/constitutions/current/testing.md)
- [ ] Linting passes (`pnpm lint`)
- [ ] Feature works end-to-end (can submit picks, navigate categories, see lock state)

## Design Decisions

1. **GameParticipant schema fields**: `userId + gameId + joinedAt` only (minimal)
   - No additional tracking fields for v1
   - Can add `invitedBy`, `role`, `lastVisitedAt` in future if needed

2. **Image fallbacks**: Gray placeholder with icon
   - If `Work.posterUrl` or `Person.imageUrl` is null, show default placeholder
   - Design: Light gray background with film/person icon centered

3. **Completion warning**: Yes, show warning banner
   - If game status is OPEN and `picksLockAt` is within 30 minutes
   - Banner text: "⚠️ Game starts in X minutes! You have Y incomplete categories."
   - Only show if user has incomplete picks

4. **Category ordering**: Use `Category.order` field (no UI reordering)
   - Categories displayed in order set by admin during event setup
   - Sort query: `orderBy: { order: 'asc' }`

5. **Nomination text**: Wrap (no truncation)
   - Long nomination text wraps to multiple lines on card
   - Use line-clamp CSS for consistent card heights if needed

6. **Post-auth redirect**: Yes, show success message
   - After sign-in with code, dashboard shows toast: "✓ You've joined [Game Name]!"
   - Toast auto-dismisses after 5 seconds

## References

- Architecture: @docs/constitutions/current/architecture.md
- Patterns: @docs/constitutions/current/patterns.md
- Schema Rules: @docs/constitutions/current/schema-rules.md
- Tech Stack: @docs/constitutions/current/tech-stack.md
- Testing: @docs/constitutions/current/testing.md
- Prisma Schema: @prisma/schema.prisma
- Next.js Server Components: https://nextjs.org/docs/app/building-your-application/rendering/server-components
- next-safe-action: https://next-safe-action.dev
- ts-pattern: https://github.com/gvergnaud/ts-pattern
