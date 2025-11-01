---
runId: d0ed99
feature: orpc-contract-first-migration
created: 2025-01-11
status: draft
---

# Feature: oRPC Contract-First Migration

## Problem Statement

**Current State:**
- oRPC procedures use `{ input }: any` type annotations with no schema validation
- Type inference broken - TypeScript cannot infer types from contracts
- TanStack Query integration fails (`.admin`, `.game` property errors)
- Client setup uses incorrect imports (`LinkFetchClient`, `StandardRPCLink` instead of `RPCLink`)
- Contracts exist in `src/lib/api/contracts/` but aren't connected to procedure implementations
- ~40+ TypeScript errors across routers and client usage

**Desired State:**
- All routers follow contract-first development pattern
- Full end-to-end type safety from contracts to client
- Zero TypeScript errors in oRPC usage
- TanStack Query hooks work correctly (`.mutationOptions()`, `.queryOptions()`)
- Server Components use `serverClient` with zero HTTP overhead
- Client Components use `orpc` with React Query integration

**Gap:**
Current implementation doesn't use `implement(contract)` pattern from oRPC documentation. Procedures are defined without connecting to contracts, breaking type inference and validation.

## Requirements

> **Note**: All features must follow @docs/constitutions/current/

### Functional Requirements

- **FR1**: Define complete contracts for all 4 routers (auth, admin, game, pick) using `oc.input().output()`
- **FR2**: Implement routers using `implement(contract)` pattern with typed procedure builders
- **FR3**: HTTP client uses `RPCLink` with proper Next.js headers integration
- **FR4**: TanStack Query utilities created via `createTanstackQueryUtils(baseClient)`
- **FR5**: All Client Components updated to use `useMutation(orpc.domain.proc.mutationOptions())`
- **FR6**: All Server Components use `serverClient` for direct procedure calls
- **FR7**: Route handler at `/api/rpc` uses `RPCHandler` from `@orpc/server/fetch`

### Non-Functional Requirements

- **NFR1**: Zero TypeScript errors after migration
- **NFR2**: Type inference works without manual type annotations
- **NFR3**: No runtime errors from type mismatches
- **NFR4**: Maintains existing authentication middleware patterns
- **NFR5**: Break-and-fix migration acceptable (all changes in one coordinated effort)

## Architecture

> **Layer boundaries**: @docs/constitutions/current/architecture.md
> **Required patterns**: @docs/constitutions/current/patterns.md

### Components

**New Files:**
- `src/lib/api/contracts/auth.ts` - Auth contract (signIn, signUp, verifyEmail)
- `src/lib/api/contracts/admin.ts` - Admin contract (events, categories, nominations, people, works, games, Wikipedia import)
- `src/lib/api/contracts/game.ts` - Game contract (list, join, getLeaderboard)
- `src/lib/api/contracts/pick.ts` - Pick contract (submit, list, update)

**Modified Files:**
- `src/lib/api/procedures.ts` - Base procedures remain same, used via `.use()` chain
- `src/lib/api/routers/auth.ts` - Implement `authContract` using `implement()`
- `src/lib/api/routers/admin.ts` - Implement `adminContract` using `implement()`
- `src/lib/api/routers/game.ts` - Implement `gameContract` using `implement()`
- `src/lib/api/routers/pick.ts` - Implement `pickContract` using `implement()`
- `src/lib/api/client.ts` - Replace `LinkFetchClient`/`StandardRPCLink` with `RPCLink`, use `createTanstackQueryUtils`
- `src/lib/api/server-client.ts` - Use `createRouterClient` (already correct, verify)
- `src/app/api/rpc/[[...rest]]/route.ts` - Verify `RPCHandler` setup (may already be correct)
- All Client Components using oRPC (~15 files) - Update `.useMutation()` to `useMutation(orpc.*.mutationOptions())`

### Dependencies

**Existing packages (verify versions):**
- `@orpc/server` - Already installed
- `@orpc/client` - Already installed
- `@orpc/contract` - Already installed
- `@orpc/tanstack-query` - Already installed
- `@tanstack/react-query` - Already installed

**No new packages required** - all dependencies already in package.json

**See**:
- https://orpc.unnoq.com/docs/contract-first/define-contract
- https://orpc.unnoq.com/docs/contract-first/implement-contract
- https://orpc.unnoq.com/docs/adapters/next
- https://orpc.unnoq.com/docs/integrations/tanstack-query

### Integration Points

**Contracts:**
- Reuse existing Zod schemas from `src/schemas/` for contract input/output
- Organize contracts hierarchically matching router structure
- Export type utilities using `InferContractRouterInputs` if needed

**Procedures:**
- Use `implement(contract)` to create typed builder per domain
- Chain `.use(authenticatedProcedure)` or `.use(adminProcedure)` for auth
- Build router with `.router({ proc: builder.proc.handler(...) })`

**Client (Browser):**
- `RPCLink` automatically handles browser vs SSR contexts
- Uses `window.location.origin` in browser
- Imports Next.js `headers()` for SSR requests

**Client (Server Components):**
- `createRouterClient(appRouter)` for direct function calls
- No HTTP overhead
- Context provided per-call if needed

**TanStack Query:**
- `createTanstackQueryUtils(baseClient)` provides `.mutationOptions()` and `.queryOptions()`
- Pass options objects to `useMutation()` and `useQuery()` hooks
- Replace pattern: `orpc.domain.proc.useMutation()` → `useMutation(orpc.domain.proc.mutationOptions())`

## Acceptance Criteria

**Constitution compliance:**
- [ ] All patterns followed (@docs/constitutions/current/patterns.md - Zod validation, type safety)
- [ ] Architecture boundaries respected (@docs/constitutions/current/architecture.md - layers maintained)
- [ ] No unapproved dependencies (@docs/constitutions/current/tech-stack.md)
- [ ] Testing requirements met (@docs/constitutions/current/testing.md - if tests exist)

**Feature-specific:**
- [ ] All 4 contracts defined (auth, admin, game, pick) with complete procedure coverage
- [ ] All 4 routers use `implement(contract)` pattern
- [ ] Client uses `RPCLink` for HTTP requests
- [ ] TanStack Query utilities properly configured
- [ ] All ~15 Client Component files updated to use `.mutationOptions()`
- [ ] Server Components use `serverClient` correctly
- [ ] Zero TypeScript errors (`pnpm tsc --noEmit` passes)
- [ ] All existing oRPC functionality works end-to-end

**Verification:**
- [ ] Type check passes: `pnpm tsc --noEmit`
- [ ] Linting passes: `pnpm lint`
- [ ] Build succeeds: `pnpm build`
- [ ] Dev server starts without errors: `pnpm dev`
- [ ] Manual testing: Wikipedia import, pick submission, admin operations all work

## Migration Impact

**Breaking Changes:**
All existing Client Component usages of oRPC will break during migration:
- Pattern changes from `orpc.domain.proc.useMutation()` to `useMutation(orpc.domain.proc.mutationOptions())`
- Affects approximately 15 files across components and hooks
- Break-and-fix approach means all changes happen together

**Files Requiring Updates:**
- Hooks: `src/hooks/admin/*.ts` (5 files), `src/hooks/game/*.ts` (3 files)
- Components: `src/components/admin/**/*.tsx` (3 files)
- Pages: `src/app/**/*.tsx` (4 files)

**Testing Strategy:**
- Update one router as proof-of-concept (e.g., pick router)
- Verify types work correctly
- Apply pattern to remaining 3 routers
- Update all call sites
- Full regression testing

## Open Questions

None - design validated through brainstorming phases 1-3.

## References

- oRPC Contract-First: https://orpc.unnoq.com/docs/contract-first/define-contract
- oRPC Implementation: https://orpc.unnoq.com/docs/contract-first/implement-contract
- oRPC Next.js Adapter: https://orpc.unnoq.com/docs/adapters/next
- oRPC TanStack Query: https://orpc.unnoq.com/docs/integrations/tanstack-query
- Architecture: @docs/constitutions/current/architecture.md
- Patterns: @docs/constitutions/current/patterns.md
- Tech Stack: @docs/constitutions/current/tech-stack.md
