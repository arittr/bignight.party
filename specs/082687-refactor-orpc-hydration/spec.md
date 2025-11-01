---
runId: 082687
feature: refactor-orpc-hydration
created: 2025-01-11
status: draft
---

# Feature: Migrate from Server Actions to oRPC with Clear Hydration Boundaries

## Problem Statement

**Current State:**

BigNight.Party uses Next.js Server Actions via `next-safe-action` for all mutations. The architecture creates several pain points:

1. **Server/Client Component boundary confusion**: Unclear when to use RSC vs Client Components, leading to wrapper hell
2. **Wrapper components**: Server Components become thin wrappers that just hoist data into giant Client Component trees
3. **Server Actions mixing concerns**: Validation, auth, and business logic combined in one layer
4. **Unclear data flow**: Hard to trace how data flows from server to client and back

**Desired State:**

- Contract-first oRPC API layer replacing Server Actions
- Server Components do real composition (not just wrappers)
- Small, focused Client Components only for interactivity
- Clear hydration boundaries: server-side oRPC calls (no HTTP) vs client-side HTTP calls
- Type-safe end-to-end communication
- Predictable data flow patterns

**Gap:**

Server Actions create implicit boundaries and encourage wrapper patterns. oRPC's server-side client enables Server Components to call procedures directly (no HTTP), eliminating wrapper hell while maintaining type safety.

## Requirements

> **Note**: All features must follow @docs/constitutions/current/

### Functional Requirements

**FR1: Contract-First API Layer**
- Define API contracts in `src/lib/api/contracts/` using `@orpc/contract`
- Contracts specify input schemas, output types, and error handling
- Separate contract definition from implementation

**FR2: Server-Side Client for Server Components**
- Server Components call oRPC procedures directly via server-side client
- No HTTP overhead for server-side calls
- Procedures callable as regular functions in RSC context

**FR3: HTTP Client for Client Components**
- Client Components use TanStack Query hooks for oRPC calls
- Procedures accessible via HTTP at `/api/rpc/*`
- Type-safe mutations and queries

**FR4: Authentication Middleware**
- Maintain existing `requireValidatedSession()` pattern
- oRPC procedures (public, authenticated, admin)
- Context flows to both server-side and HTTP calls

**FR5: Real-Time Integration**
- Socket.io unchanged, stays in Services layer
- Client Components combine oRPC queries + Socket.io listeners
- TanStack Query cache invalidation on socket events

**FR6: Incremental Migration**
- Migrate feature-by-feature (Game → Picks → Admin)
- Each migration PR fully functional
- Both patterns coexist temporarily during migration

### Non-Functional Requirements

**NFR1: Type Safety**
- End-to-end type inference from contracts
- No type assertions without validation
- Compiler catches contract violations

**NFR2: Performance**
- Server-side calls have zero HTTP overhead
- HTTP calls use TanStack Query caching
- No performance regression vs Server Actions

**NFR3: Developer Experience**
- Clear mental model: Server Components compose, Client Components interact
- TanStack Query hooks for familiar mutation/query patterns
- OpenAPI specs generated from contracts for documentation

**NFR4: Testing**
- Contracts testable independently from implementation
- Procedures testable with mock context
- Component tests mock oRPC client
- Services/Models tests unchanged

## Architecture

> **Layer boundaries**: @docs/constitutions/current/architecture.md
> **Required patterns**: @docs/constitutions/current/patterns.md

### New Architecture

```
┌─────────────────────────────────────┐
│   Server Components (RSC)           │
│   - Call oRPC procedures directly   │  ← serverClient.game.list()
│   - NO HTTP overhead                │
│   - Compose UI with data            │
├─────────────────────────────────────┤
│   Client Components                 │
│   - Call oRPC via TanStack Query    │  ← orpc.game.join.useMutation()
│   - Handle interactions             │
├─────────────────────────────────────┤
│   oRPC Procedures (API Layer)       │  ← Replaces Server Actions
│   - Contract-first definition       │
│   - Works server-side OR via HTTP   │
│   - Auth middleware                 │
│   - Zod validation                  │
├─────────────────────────────────────┤
│   Services (Business Logic)         │  ← UNCHANGED
├─────────────────────────────────────┤
│   Models (Data Access)              │  ← UNCHANGED
└─────────────────────────────────────┘
```

### Components

**New Files:**
- `src/lib/api/contracts/{domain}.ts` - API contract definitions per domain (game, pick, admin)
- `src/lib/api/routers/{domain}.ts` - Contract implementations calling services
- `src/lib/api/procedures.ts` - Base procedures (public, authenticated, admin)
- `src/lib/api/server-client.ts` - Server-side callable client for RSC
- `src/lib/api/client.ts` - HTTP client for Client Components
- `app/api/rpc/[[...rest]]/route.ts` - oRPC HTTP handler
- `app/providers.tsx` - TanStack Query provider

**Modified Files:**
- All Server Components: Replace service calls with `serverClient.*` calls
- All Client Components: Replace `useAction` with `orpc.*.useMutation()`
- `app/layout.tsx` - Wrap with TanStack Query provider

**Deleted Files (Post-Migration):**
- `src/lib/actions/` - Entire directory removed
- All server action files

### Dependencies

**New packages:**
- `@orpc/server` - Server-side oRPC implementation
- `@orpc/contract` - Contract-first definitions
- `@orpc/client` - HTTP client
- `@orpc/next` - Next.js adapter
- `@orpc/tanstack-query` - TanStack Query integration
- `@tanstack/react-query` - Data fetching/caching

See: https://orpc.unnoq.com/docs for oRPC documentation

**Removed packages:**
- `next-safe-action` - No longer needed

**Schema changes:**
- None required - database schema unchanged

### Integration Points

**Auth:**
- Uses existing `requireValidatedSession()` from @/lib/auth/config
- oRPC procedures use same auth middleware pattern
- Context includes userId, userRole, userEmail

**Services:**
- Services layer completely unchanged
- oRPC routers call services (same as actions did)
- Business logic remains framework-agnostic

**Socket.io:**
- Real-time updates unchanged
- Services still emit Socket.io events
- Client Components listen to Socket.io + use oRPC queries

**Validation:**
- Zod schemas from `src/schemas/` reused in contracts
- Input validation at contract level
- Per @docs/constitutions/current/patterns.md

## Component Composition Patterns

**Server Components:**
- Fetch data via `await serverClient.{domain}.{procedure}()`
- Compose UI with data
- Pass data as props to small Client Components
- No wrapper components

**Client Components:**
- Receive data via props OR fetch via `orpc.{domain}.{procedure}.useQuery()`
- Use `orpc.{domain}.{procedure}.useMutation()` for mutations
- Small, focused, single responsibility

**Decision Tree:**
- Need interactivity? → Client Component
- Need data + already have from parent? → Props
- Need data + not from parent? → `useQuery()`
- Need mutation? → `useMutation()`
- Just rendering? → Server Component

## Migration Strategy

> **Note**: Detailed task breakdown via `/spectacular:plan` command

**Phase-by-Phase:**
1. Foundation: Install dependencies, setup infrastructure
2. Game domain: Migrate all game-related functionality
3. Picks domain: Migrate picks wizard and submission
4. Admin domain: Migrate admin controls
5. Cleanup: Remove server actions, update constitution

**Per-Phase Deliverable:**
- oRPC contracts + routers for domain
- All Server/Client Components updated
- Tests passing
- Lint passing
- Feature fully functional
- Can merge to main

**Coexistence:**
- Server Actions and oRPC coexist during migration
- No reverse compatibility needed after completion
- Clean cutover per domain

## Acceptance Criteria

**Constitution compliance:**
- [ ] Follows layered architecture (@docs/constitutions/current/architecture.md)
- [ ] Uses ts-pattern for discriminated unions (@docs/constitutions/current/patterns.md)
- [ ] Zod validation at contract level (@docs/constitutions/current/patterns.md)
- [ ] Testing strategy defined (@docs/constitutions/current/testing.md)
- [ ] Tech stack updated (@docs/constitutions/current/tech-stack.md)

**Feature-specific:**
- [ ] All Server Components use `serverClient.*` (no HTTP)
- [ ] All Client Components use `orpc.*.useMutation()` or `orpc.*.useQuery()`
- [ ] All contracts defined before implementation
- [ ] OpenAPI specs generated from contracts
- [ ] Auth middleware works for both server-side and HTTP calls
- [ ] Socket.io integration preserved
- [ ] No wrapper components (Server Components compose directly)

**Verification:**
- [ ] All tests pass (contracts, procedures, components, integration)
- [ ] Linting passes
- [ ] Type checking passes
- [ ] All features work end-to-end
- [ ] Server Actions completely removed
- [ ] `next-safe-action` dependency removed

## Open Questions

None - design validated through brainstorming phases.

## References

- **Architecture**: @docs/constitutions/current/architecture.md
- **Patterns**: @docs/constitutions/current/patterns.md
- **Schema Rules**: @docs/constitutions/current/schema-rules.md
- **Tech Stack**: @docs/constitutions/current/tech-stack.md
- **Testing**: @docs/constitutions/current/testing.md
- **oRPC Documentation**: https://orpc.unnoq.com/docs
- **TanStack Query**: https://tanstack.com/query/latest/docs/framework/react/overview
