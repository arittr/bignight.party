# Phase 5: API Layer

**Strategy**: Sequential (single task)
**Dependencies**: Task 4 (Services Layer)
**Estimated Time**: 6 hours

---

## Task 5: oRPC Router Layer

**Complexity**: L (5-6h)

**Files**:
- `/Users/drewritter/projects/bignight.party-vite/src/orpc/router/game.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/orpc/router/pick.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/orpc/router/event.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/orpc/router/category.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/orpc/router/nomination.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/orpc/router/admin.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/orpc/router/leaderboard.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/orpc/router/work.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/orpc/router/person.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/orpc/router/auth.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/orpc/router/index.ts`

**Dependencies**: Task 4 (Services Layer)

**Dependency Reason**: oRPC procedures call service functions. Each router imports corresponding service (e.g., `gameRouter` imports `gameService`).

**Description**:
Create oRPC router layer that replaces Next.js Server Actions. Each router defines type-safe RPC procedures with Zod validation. Procedures call services and return typed responses. This provides the API surface for the frontend.

**Implementation Steps**:

1. Analyze existing Server Actions:
   - Review `/Users/drewritter/projects/bignight.party/src/lib/actions/`
   - Map each action to corresponding oRPC procedure
   - Identify input schemas (already ported in Task 4)

2. Create router files (one per domain):
   - `game.ts` - Game management (create, join, update status)
   - `pick.ts` - Pick submission and retrieval
   - `event.ts` - Event CRUD operations
   - `category.ts` - Category management
   - `nomination.ts` - Nomination management
   - `admin.ts` - Admin-specific operations
   - `leaderboard.ts` - Leaderboard queries
   - `work.ts` - Works library management
   - `person.ts` - People library management
   - `auth.ts` - Authentication (sign in/out)

3. Define procedures using oRPC pattern:
   ```typescript
   import { os } from '@orpc/server';
   import { gameSchema } from '@/schemas/game';
   import * as gameService from '@/lib/services/game-service';

   export const gameRouter = {
     create: os
       .input(gameSchema.create)
       .handler(async ({ input, context }) => {
         // Require authentication
         if (!context.user) throw new Error('Unauthorized');

         // Call service
         return gameService.create(input, context.user.id);
       }),

     // More procedures...
   };
   ```

4. Add auth guards to protected procedures:
   - Check `context.user` for authenticated procedures
   - Check `context.user.role === 'ADMIN'` for admin procedures
   - Throw typed errors for unauthorized access

5. Update router index to export all routers:
   ```typescript
   import { gameRouter } from './game';
   import { pickRouter } from './pick';
   // ... import all

   export default {
     game: gameRouter,
     pick: pickRouter,
     event: eventRouter,
     // ... all routers
   };
   ```

6. Test procedures with oRPC client:
   ```typescript
   // From client code
   const game = await orpc.game.create({
     eventId: '123',
     accessCode: 'TEST2025'
   });
   ```

**Acceptance Criteria**:
- [ ] All 10 router files created
- [ ] Each router exports procedures matching former Server Actions
- [ ] Procedures use Zod schemas for input validation
- [ ] Auth guards check `context.user` for protected endpoints
- [ ] Admin guards check `context.user.role === 'ADMIN'`
- [ ] Router index exports all routers
- [ ] TypeScript infers types correctly (end-to-end)
- [ ] Test procedure call from client succeeds

**Mandatory Patterns**:

> **oRPC Procedure Pattern**:
> ```typescript
> export const procedureName = os
>   .input(zodSchema)           // Validate input
>   .handler(async ({ input, context }) => {
>     // 1. Check auth
>     if (!context.user) throw new Error('Unauthorized');
>
>     // 2. Call service
>     const result = await service.doSomething(input, context.user.id);
>
>     // 3. Return typed result
>     return result;
>   });
> ```

**Auth Guard Patterns**:
```typescript
// Require any authenticated user
if (!context.user) throw new Error('Unauthorized');

// Require admin role
if (context.user.role !== 'ADMIN') throw new Error('Forbidden');

// Require game participant (business logic check)
const isParticipant = await gameParticipantModel.exists(
  context.user.id,
  input.gameId
);
if (!isParticipant) throw new Error('Not a game participant');
```

**Quality Gates**:
```bash
bun run check-types  # Verify end-to-end type inference
bun run lint
# Manual test: Call procedure from client, verify response
```

**Reference**:
- Spec section: "Data Flow - Pick Submission" (lines 399-407)
- oRPC docs: https://orpc.unnoq.com/docs
