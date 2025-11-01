# Constitution v4

**Created**: 2025-01-22
**Previous**: v3 (2025-01-21)

## Summary

Mandates contract-first oRPC architecture using `implement(contract)` pattern for full end-to-end type safety. Replaces ad-hoc procedure definitions with proper contract validation, RPCLink client setup, and TanStack Query integration pattern.

## Changes from v3

### Updated

**oRPC Contract-First Pattern** (patterns.md):
- **MANDATORY**: All routers MUST use `implement(contract)` pattern
- Contracts defined with `oc.input().output()` from `@orpc/contract`
- Typed procedure builders created via `implement(contract)`
- Client uses `RPCLink` (not `LinkFetchClient`/`StandardRPCLink`)
- TanStack Query via `createTanstackQueryUtils(baseClient)`
- Client Component pattern: `useMutation(orpc.domain.proc.mutationOptions())`
- Replaces broken pattern: `orpc.domain.proc.useMutation()` (type inference fails)

**oRPC Layer Description** (architecture.md):
- Updated to emphasize contract-first development
- Documents `implement(contract)` as required pattern
- Clarifies RPCLink vs deprecated imports

**Tech Stack** (tech-stack.md):
- Clarified contract-first approach is mandatory
- Documents correct oRPC package usage

### Rationale

**Why create v4?**

1. **Type Inference Was Broken**: The v3 oRPC pattern used `{ input }: any` type annotations without connecting contracts to implementations. TypeScript couldn't infer types, causing ~40+ type errors and breaking TanStack Query integration.

2. **Contract-First is Foundational**: Using `implement(contract)` is not an optional optimization—it's the correct oRPC architecture. Without it:
   - No automatic type inference (manual `any` annotations required)
   - No runtime validation (Zod schemas defined but not used)
   - No TanStack Query integration (`.mutationOptions()` doesn't exist)
   - Client setup uses wrong imports (`LinkFetchClient` instead of `RPCLink`)

3. **Validated Through Pain**: We discovered these issues when Wikipedia import endpoints returned 404s despite routes existing. Investigation revealed:
   - Procedures registered but types broken
   - Client couldn't access `.admin`, `.game` properties (type was `never`)
   - Root cause: Not following official oRPC documentation patterns

4. **Official Pattern**: The contract-first pattern using `implement(contract)` is documented in official oRPC docs:
   - https://orpc.unnoq.com/docs/contract-first/define-contract
   - https://orpc.unnoq.com/docs/contract-first/implement-contract
   - https://orpc.unnoq.com/docs/integrations/tanstack-query

5. **Break-and-Fix Migration**: All 4 routers (auth, admin, game, pick) and ~15 Client Component files require updates. This is a coordinated breaking change across the entire oRPC layer.

### Migration Impact

**Breaking Changes:**
- All Client Components using oRPC must update from `orpc.domain.proc.useMutation()` to `useMutation(orpc.domain.proc.mutationOptions())`
- All routers must migrate from ad-hoc procedure definitions to `implement(contract)` pattern
- Affects ~15 files across hooks, components, and pages

**Migration Path:**
1. Define complete contracts for all 4 routers using `oc.input().output()`
2. Implement routers using `implement(contract)` with typed builders
3. Update client.ts to use `RPCLink` and `createTanstackQueryUtils`
4. Update all Client Component call sites to use `.mutationOptions()` pattern
5. Verify zero TypeScript errors with `pnpm tsc --noEmit`

### Context

This architectural shift emerged from spec d0ed99 (orpc-contract-first-migration), which diagnosed and fixed the broken oRPC type inference. The migration was triggered by:
- Wikipedia import 404 errors (routes existed but types were broken)
- ~40+ TypeScript errors across routers and client usage
- TanStack Query integration failures (`.admin`, `.game` property errors)
- Discovery that contracts existed but weren't connected to implementations

The v4 constitution documents the CORRECT oRPC patterns that should have been used from the start, based on official documentation and best practices.

## Files in This Version

1. **meta.md** (this file) - Version 4 metadata and changelog
2. **architecture.md** - Layer boundaries with contract-first oRPC emphasis
3. **patterns.md** - Mandatory patterns including contract-first oRPC
4. **tech-stack.md** - Approved libraries with oRPC contract-first clarification
5. **schema-rules.md** - Database design philosophy (unchanged from v3)
6. **testing.md** - TDD requirements (unchanged from v3)

## No Backward Compatibility

**All oRPC code MUST be updated to v4 patterns.** The v3 pattern (`{ input }: any` without contracts) is fundamentally broken and will not be supported.

This is not a "nice to have" improvement—it's fixing a fundamental architectural error.

## Future Versions

**When to create v5:**
- Deprecation of any v4 patterns (e.g., moving away from oRPC entirely)
- Major architectural shifts affecting multiple layers
- New mandatory patterns that conflict with v4
- Significant tech stack changes (e.g., migrating from Next.js to Remix)
