# Phase 3: Business Logic Foundation

**Strategy**: Parallel (2 independent tasks)
**Dependencies**: Phase 2 (requires auth context)
**Sequential Time**: 9 hours
**Parallel Time**: 5 hours
**Time Savings**: 4 hours (44%)

---

## Task 3: Models Layer

**Complexity**: M (4-5h)

**Files**:
- `/Users/drewritter/projects/bignight.party-vite/src/lib/models/category.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/models/event.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/models/game.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/models/game-participant.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/models/nomination.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/models/person.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/models/pick.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/models/user.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/models/work.ts`

**Dependencies**: Task 1 (Database Schema)

**Dependency Reason**: Models use Prisma client generated from schema in Task 1.

**Description**:
Port all 9 model files from the Next.js project. Models provide the data access layer with Prisma queries. These are framework-agnostic and can be copied with minimal changes (update import paths for Prisma client location).

**Implementation Steps**:

1. Create models directory:
   ```bash
   mkdir -p /Users/drewritter/projects/bignight.party-vite/src/lib/models
   ```

2. Copy all model files from source:
   ```bash
   cp /Users/drewritter/projects/bignight.party/src/lib/models/*.ts \
      /Users/drewritter/projects/bignight.party-vite/src/lib/models/
   ```

3. Update Prisma client import in each file:
   - Change from: `import { prisma } from '@/lib/db/prisma'`
   - To: `import { prisma } from '@/db'`

4. Verify TypeScript compilation:
   ```bash
   bun run check-types
   ```

5. Run linting:
   ```bash
   bun run lint
   ```

**Acceptance Criteria**:
- [ ] All 9 model files copied and adapted
- [ ] Prisma client imports updated to new path (`@/db`)
- [ ] TypeScript compilation passes
- [ ] Biome linting passes
- [ ] No runtime errors when importing models
- [ ] Models export expected functions (exists, create, update, delete patterns)

**Mandatory Patterns**:

> **Layer Architecture**: Models layer contains ONLY Prisma queries - no business logic.

Models export functions like:
- `exists(id)` - Check existence
- `findById(id)` - Find single record
- `findMany(filters)` - Query with filters
- `create(data)` - Create record
- `update(id, data)` - Update record
- `deleteById(id)` - Delete record

**Quality Gates**:
```bash
bun run check-types
bun run lint
```

---

## Task 6: Core Utilities & Patterns

**Complexity**: M (3-4h)

**Files**:
- `/Users/drewritter/projects/bignight.party-vite/src/lib/routes.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/utils.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/utils/cn.ts`
- `/Users/drewritter/projects/bignight.party-vite/package.json`

**Dependencies**: Task 2 (no code deps, but routes reference auth)

**Dependency Reason**: Routes helper includes auth-related routes (sign-in, signup), but this is just route string generation with no runtime dependency.

**Description**:
Set up core utilities used throughout the application: centralized routes helper for type-safe navigation, toast notifications with Sonner, utility libraries (ts-pattern, date-fns), and shared utility functions.

**Implementation Steps**:

1. Install utility dependencies:
   ```bash
   cd /Users/drewritter/projects/bignight.party-vite
   bun add sonner ts-pattern date-fns wtf_wikipedia
   ```

2. Copy routes helper from source:
   ```bash
   cp /Users/drewritter/projects/bignight.party/src/lib/routes.ts \
      /Users/drewritter/projects/bignight.party-vite/src/lib/routes.ts
   ```

3. Create/update utility functions:
   - Copy `utils.ts` (if exists in source)
   - Ensure `cn()` utility for className merging exists

4. Set up Sonner toast provider:
   - Add `<Toaster />` to root layout (`src/routes/__root.tsx`)
   - Export toast helper: `import { toast } from 'sonner'`

5. Verify all imports work:
   ```bash
   bun run check-types
   ```

**Acceptance Criteria**:
- [ ] All utility packages installed (sonner, ts-pattern, date-fns, wtf_wikipedia)
- [ ] Routes helper copied with 20+ route functions
- [ ] `routes.admin.events.detail(id)` generates correct URL
- [ ] `routes.game.pick(gameId, categoryId?)` handles optional params
- [ ] Sonner toaster component added to root layout
- [ ] `toast.success()` and `toast.error()` work in test component
- [ ] TypeScript compilation passes

**Mandatory Patterns**:

> **Centralized Routes**: ALL navigation must use `routes` helper - never hardcode URL strings.

Route helper benefits:
- Type-safe parameters
- Single source of truth
- Easy refactoring
- No typos in URLs

**Quality Gates**:
```bash
bun run check-types
bun run lint
# Test toast in browser: toast.success("Test message")
```

**Reference**:
- Spec section: "Critical Patterns to Port" - Centralized Routes (lines 495-513)
