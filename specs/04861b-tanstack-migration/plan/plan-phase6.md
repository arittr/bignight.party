# Phase 6: UI Layer

**Strategy**: Parallel (4 independent route groups)
**Dependencies**: Phase 5 (oRPC API Layer)
**Sequential Time**: 23 hours
**Parallel Time**: 7 hours
**Time Savings**: 16 hours (70%)

**Note**: The target repository already has basic shadcn/ui components installed (Button, Input, Select, Switch, Label, Slider, Textarea). If additional components are needed during implementation (Card, Dialog, Table, etc.), install with:
```bash
bunx shadcn@latest add card dialog table
```

---

## Task 7: Public & Auth Routes

**Complexity**: M (4-5h)

**Files**:
- `/Users/drewritter/projects/bignight.party-vite/src/routes/index.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/sign-in.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/signup.index.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/signup.callback.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/join.$code.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/components/auth/SignInForm.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/components/auth/MagicLinkSent.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/components/home/Hero.tsx`

**Dependencies**: Task 5 (oRPC API Layer)

**Dependency Reason**: Sign-in form calls `orpc.auth.signIn()`, join route calls `orpc.game.join()`.

**Description**:
Implement public routes (homepage, sign-in, signup, magic link callback, join game). These routes are accessible without authentication. Uses TanStack Router file-based routing.

**Implementation Steps**:

1. Create homepage (`src/routes/index.tsx`):
   - Marketing/landing page content
   - Links to sign-in/signup
   - Port from existing `src/app/page.tsx`

2. Create sign-in route (`src/routes/sign-in.tsx`):
   - Form to request magic link
   - Calls `orpc.auth.signIn({ email })`
   - Shows success message after submission

3. Create signup routes:
   - `signup.index.tsx` - Initial signup form
   - `signup.callback.tsx` - Magic link verification callback
   - Handle optional access code parameter

4. Create join game route (`join.$code.tsx`):
   - Dynamic param: `$code`
   - Verifies access code
   - Redirects to game or signup

5. Port auth components:
   - `SignInForm.tsx` - Email input form
   - `MagicLinkSent.tsx` - Confirmation message
   - Update to use oRPC instead of Server Actions

6. Update root layout (`src/routes/__root.tsx`):
   - Add navigation (if signed in)
   - Include Sonner toaster
   - Configure error boundary for graceful error handling
   - Use TanStack Router's built-in `errorComponent` prop

**Acceptance Criteria**:
- [ ] Homepage renders and routes work
- [ ] Sign-in form submits and sends magic link email
- [ ] Magic link callback creates session
- [ ] Signup flow handles access code parameter
- [ ] Join game route validates code and redirects
- [ ] All routes use centralized routes helper
- [ ] Error boundaries catch loader failures and show user-friendly message
- [ ] TypeScript compilation passes
- [ ] No console errors

**Mandatory Patterns**:

> **TanStack Router File-Based Pattern**:
> ```typescript
> // src/routes/sign-in.tsx
> import { createFileRoute } from '@tanstack/react-router';
>
> export const Route = createFileRoute('/sign-in')({
>   component: SignInPage,
> });
>
> function SignInPage() {
>   // Component code
> }
> ```

**Navigation Pattern**:
```typescript
import { useNavigate } from '@tanstack/react-router';
import { routes } from '@/lib/routes';

const navigate = useNavigate();
navigate({ to: routes.dashboard() });
```

**Quality Gates**:
```bash
bun run check-types
bun run lint
bun run dev  # Manual testing
```

---

## Task 8: User Routes (Dashboard & Game)

**Complexity**: L (6-7h)

**Files**:
- `/Users/drewritter/projects/bignight.party-vite/src/routes/dashboard.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/game.$gameId.pick.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/game.$gameId.leaderboard.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/components/dashboard/GameCard.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/components/dashboard/GameList.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/components/game/PickWizard.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/components/game/CategoryStep.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/components/game/NomineeCard.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/components/game/Leaderboard.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/components/game/LeaderboardRow.tsx`

**Dependencies**: Task 5 (oRPC API Layer)

**Dependency Reason**: Dashboard fetches games via `orpc.game.listForUser()`, pick wizard calls `orpc.pick.submit()`, leaderboard calls `orpc.leaderboard.get()`.

**Description**:
Implement authenticated user routes: dashboard (list of user's games), pick wizard (submit predictions), and leaderboard (view scores). Requires auth guard in `beforeLoad`.

**Implementation Steps**:

1. Create dashboard route (`dashboard.tsx`):
   - Add `beforeLoad` auth guard (check session)
   - Loader fetches user's games via oRPC
   - Display game cards with status
   - Link to pick or leaderboard based on game status

2. Create pick wizard route (`game.$gameId.pick.tsx`):
   - Dynamic param: `$gameId`
   - `beforeLoad`: Check auth + game participant
   - Optional search param: `?category=` for multi-step wizard
   - Loader fetches game + categories + existing picks
   - Wizard component submits picks

3. Create leaderboard route (`game.$gameId.leaderboard.tsx`):
   - Dynamic param: `$gameId`
   - `beforeLoad`: Check auth + game participant
   - Loader fetches leaderboard data
   - Real-time updates via Socket.IO (integrated in Phase 7)

4. Port game components:
   - `PickWizard.tsx` - Multi-step form
   - `CategoryStep.tsx` - Single category selection
   - `NomineeCard.tsx` - Selectable nomination card
   - `Leaderboard.tsx` - Score table
   - `LeaderboardRow.tsx` - Player row with score

5. Update components to use oRPC:
   - Replace `useAction` hooks with `orpc` mutations
   - Use TanStack Query for data fetching

**Acceptance Criteria**:
- [ ] Dashboard shows user's games
- [ ] Pick wizard navigates through categories
- [ ] Pick submission succeeds via oRPC
- [ ] Leaderboard displays scores
- [ ] Auth guards redirect unauthenticated users
- [ ] Non-participants redirected from game routes
- [ ] TypeScript compilation passes
- [ ] All routes use centralized routes helper

**Mandatory Patterns**:

> **Auth Guard Pattern**:
> ```typescript
> export const Route = createFileRoute('/dashboard')({
>   beforeLoad: async ({ context }) => {
>     const session = await getSession(context);
>     if (!session) {
>       throw redirect({ to: routes.signIn() });
>     }
>     return { session };
>   },
>   loader: async ({ context }) => {
>     // Fetch data with authenticated user
>     return orpc.game.listForUser();
>   },
> });
> ```

**Quality Gates**:
```bash
bun run check-types
bun run lint
bun run dev  # Test pick submission and leaderboard
```

---

## Task 9: Admin Core Routes (Events & Games)

**Complexity**: L (6-7h)

**Files**:
- `/Users/drewritter/projects/bignight.party-vite/src/routes/admin.index.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/admin.events.index.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/admin.events.new.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/admin.events.$eventId.index.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/admin.events.$eventId.categories.new.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/admin.events.$eventId.categories.$categoryId.index.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/admin.events.$eventId.categories.$categoryId.nominations.new.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/admin.games.index.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/admin.games.new.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/admin.games.$gameId.index.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/admin.games.$gameId.live.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/components/admin/EventForm.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/components/admin/CategoryForm.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/components/admin/NominationForm.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/components/admin/GameForm.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/components/admin/LiveCeremonyPanel.tsx`

**Dependencies**: Task 5 (oRPC API Layer)

**Dependency Reason**: Admin routes call admin oRPC procedures (`orpc.admin.*`, `orpc.event.*`, `orpc.game.*`).

**Description**:
Implement admin panel core routes for event and game management. All routes require admin role check in `beforeLoad`. Includes CRUD for events, categories, nominations, and games, plus live ceremony control.

**Implementation Steps**:

1. Create admin home route (`admin.index.tsx`):
   - `beforeLoad`: Check `session.user.role === 'ADMIN'`
   - Dashboard with links to events and games

2. Create event routes:
   - `events.index.tsx` - List all events
   - `events.new.tsx` - Create event form
   - `events.$eventId.index.tsx` - Edit event
   - Category subroutes (new, edit)
   - Nomination subroutes (new)

3. Create game routes:
   - `games.index.tsx` - List all games
   - `games.new.tsx` - Create game (select event)
   - `games.$gameId.index.tsx` - Edit game
   - `games.$gameId.live.tsx` - Live ceremony controls

4. Port admin components:
   - Forms for event/category/nomination/game
   - Live ceremony panel (mark winners)
   - Update to use oRPC mutations

5. Implement admin guard utility:
   ```typescript
   async function requireAdmin(context) {
     const session = await getSession(context);
     if (!session || session.user.role !== 'ADMIN') {
       throw redirect({ to: routes.home() });
     }
     return { session };
   }
   ```

**Acceptance Criteria**:
- [ ] Admin home displays admin dashboard
- [ ] Event CRUD operations work
- [ ] Category management within events works
- [ ] Nomination creation works
- [ ] Game CRUD operations work
- [ ] Live ceremony panel marks winners
- [ ] Non-admin users redirected from all admin routes
- [ ] TypeScript compilation passes

**Mandatory Patterns**:

> **Admin Guard Pattern**:
> ```typescript
> beforeLoad: async ({ context }) => {
>   const session = await getSession(context);
>   if (session?.user?.role !== 'ADMIN') {
>     throw redirect({ to: routes.home() });
>   }
>   return { session };
> }
> ```

**Quality Gates**:
```bash
bun run check-types
bun run lint
bun run dev  # Test as admin user
```

---

## Task 10: Admin Resource Routes (Works & People)

**Complexity**: M (4-5h)

**Files**:
- `/Users/drewritter/projects/bignight.party-vite/src/routes/admin.works.index.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/admin.works.new.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/admin.works.$workId.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/admin.people.index.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/admin.people.new.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/admin.people.$personId.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/routes/admin.import.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/components/admin/WorkForm.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/components/admin/PersonForm.tsx`
- `/Users/drewritter/projects/bignight.party-vite/src/components/admin/WikipediaImport.tsx`

**Dependencies**: Task 5 (oRPC API Layer)

**Dependency Reason**: Resource routes call oRPC procedures (`orpc.work.*`, `orpc.person.*`, `orpc.import.*`).

**Description**:
Implement admin routes for Works and People library management, plus Wikipedia import tool. These are resource management routes separate from event/game flows.

**Implementation Steps**:

1. Create works routes:
   - `works.index.tsx` - List works (with type filter)
   - `works.new.tsx` - Create work (film, album, etc.)
   - `works.$workId.tsx` - Edit work

2. Create people routes:
   - `people.index.tsx` - List people
   - `people.new.tsx` - Create person
   - `people.$personId.tsx` - Edit person

3. Create import route (`import.tsx`):
   - Wikipedia slug input
   - Parse and preview data
   - Confirm import

4. Port resource components:
   - `WorkForm.tsx` - Work type dropdown + fields
   - `PersonForm.tsx` - Person details
   - `WikipediaImport.tsx` - Import wizard

5. Integrate Wikipedia parser:
   - Call `orpc.import.parseWikipedia({ slug })`
   - Display parsed data
   - Submit to create work/person

**Acceptance Criteria**:
- [ ] Works list displays with type filter
- [ ] Work CRUD operations succeed
- [ ] People CRUD operations succeed
- [ ] Wikipedia import parses data correctly
- [ ] Import creates work or person from Wikipedia data
- [ ] Admin guard on all routes
- [ ] TypeScript compilation passes

**Mandatory Patterns**:

> **Wikipedia Import Flow**:
> 1. User enters Wikipedia slug
> 2. Client calls `orpc.import.parseWikipedia({ slug })`
> 3. Server fetches + parses with `wtf_wikipedia`
> 4. Returns parsed data (title, year, cast, etc.)
> 5. User reviews + confirms
> 6. Client calls `orpc.work.create()` or `orpc.person.create()`

**Quality Gates**:
```bash
bun run check-types
bun run lint
bun run dev  # Test Wikipedia import
```

**Reference**:
- Wikipedia parser: `/Users/drewritter/projects/bignight.party/src/lib/parsers/wikipedia/`
