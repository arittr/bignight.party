# Phase 4: Business Logic Layer

**Strategy**: Sequential (single task)
**Dependencies**: Task 3 (Models Layer)
**Estimated Time**: 6 hours

---

## Task 4: Services Layer & Schemas

**Complexity**: L (5-6h)

**Files**:
- `/Users/drewritter/projects/bignight.party-vite/src/lib/services/admin-service.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/services/category-service.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/services/event-service.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/services/game-service.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/services/leaderboard-service.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/services/pick-service.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/lib/services/wikipedia-import-service.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/schemas/game.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/schemas/event.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/schemas/category.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/schemas/nomination.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/schemas/pick.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/schemas/work.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/schemas/person.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/schemas/auth.ts`
- `/Users/drewritter/projects/bignight.party-vite/src/schemas/wikipedia.ts`

**Dependencies**: Task 3 (Models Layer)

**Dependency Reason**: Services call model functions for database operations. All 7 services import from `@/lib/models/*`.

**Description**:
Port all business logic services and Zod validation schemas. Services orchestrate business rules and call models for data access. Schemas define input validation for API endpoints (will be used by oRPC routers in next phase).

**Implementation Steps**:

1. Create service directory:
   ```bash
   mkdir -p /Users/drewritter/projects/bignight.party-vite/src/lib/services
   ```

2. Copy all service files:
   ```bash
   cp /Users/drewritter/projects/bignight.party/src/lib/services/*.ts \
      /Users/drewritter/projects/bignight.party-vite/src/lib/services/
   ```

3. Update imports in services:
   - Model imports: `@/lib/models/game` → same path (already correct)
   - Prisma types: `@prisma/client` → same (already correct)
   - May need to update any Next.js-specific imports

4. Create schemas directory and copy all schemas:
   ```bash
   mkdir -p /Users/drewritter/projects/bignight.party-vite/src/schemas
   cp /Users/drewritter/projects/bignight.party/src/schemas/*.ts \
      /Users/drewritter/projects/bignight.party-vite/src/schemas/
   ```

5. Verify ts-pattern usage in services:
   - Services use `match()` from `ts-pattern` for discriminated unions
   - Ensure package installed (done in Task 6)

6. Remove Next.js specific code:
   - Remove any `next-safe-action` imports
   - Remove `"use server"` directives
   - Services should be framework-agnostic

7. Run type checking:
   ```bash
   bun run check-types
   ```

**Acceptance Criteria**:
- [ ] All 7 service files copied and adapted
- [ ] All 9 Zod schema files copied
- [ ] No Next.js-specific imports remain (`next-safe-action`, etc.)
- [ ] Services successfully import from models layer
- [ ] TypeScript compilation passes
- [ ] Biome linting passes
- [ ] Services use `ts-pattern` for match() calls
- [ ] All business logic functions exported (create, update, validate, etc.)

**Mandatory Patterns**:

> **Layer Boundaries**: Services layer can import:
> - ✅ Models (`@/lib/models/*`)
> - ✅ Other services
> - ✅ Utility libraries (`ts-pattern`, `zod`)
> - ❌ NEVER import Prisma directly (use models)
> - ❌ NEVER import framework code (Next.js, oRPC)

**Service Patterns**:
- Business rule validation (e.g., "can user submit pick?")
- Transaction orchestration (multiple model calls)
- Domain logic (point calculations, status transitions)
- Error handling with typed results

**Quality Gates**:
```bash
bun run check-types
bun run lint
```

**Reference**:
- Existing services in: `/Users/drewritter/projects/bignight.party/src/lib/services/`
- Spec: "Layer Architecture" (lines 305-321)
