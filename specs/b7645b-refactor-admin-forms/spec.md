---
runId: b7645b
feature: refactor-admin-forms
created: 2025-01-01
status: draft
---

# Feature: Refactor Admin Forms to Wire-to-Domain + React Hook Form Pattern

**Status**: Draft
**Created**: 2025-01-01
**RUN_ID**: b7645b

## Problem Statement

**Current State:**

The admin section has inconsistent form patterns:
- ✅ `games/new` uses React Hook Form + oRPC + wire format schema (reference implementation)
- ❌ `games/[id]` uses Server Action with FormData
- ❌ All other admin forms (events, categories, nominations, people, works, Wikipedia import) use Server Actions with manual FormData extraction

This creates:
- **Type duplication**: Inline validation in forms duplicates schema validation
- **Inconsistent UX**: Some forms have real-time validation, others don't
- **Manual validation**: FormData extraction requires type assertions and manual error handling
- **No loading states**: Server Actions lack built-in loading/error state management
- **Schema complexity**: Mix of `.coerce()` and wire format creates confusion

**Desired State:**

All admin forms follow a consistent, type-safe pattern:
- Single wire format schema used everywhere (forms, contracts, validation)
- React Hook Form provides real-time validation and error handling
- oRPC mutations with TanStack Query provide loading states and error management
- Router transforms wire format → domain types at API boundary
- Services receive clean domain types (Date objects, enums)

**Gap:**

Without this refactoring:
- Adding new forms requires decision: "Which pattern should I follow?"
- Maintaining forms requires understanding two different patterns
- Type safety weakens at form boundaries (manual FormData parsing)
- UX inconsistencies confuse users (some forms validate, others don't)

## Requirements

> **Note**: All features must follow @docs/constitutions/current/

### Functional Requirements

**FR1: Schema Standardization**
- All schemas in `src/schemas/` use wire format (JSON-serializable types)
- Date fields use `z.string().datetime()` not `z.coerce.date()`
- Enum fields use `z.enum([...])` not `z.nativeEnum()`
- Remove `.default()` from schemas (defaults set in router/service)
- Export both schema and inferred type for each entity

**FR2: Router Transformation**
- All routers in `src/lib/api/routers/admin.ts` import wire-to-domain utilities
- Create/update handlers destructure wire fields and transform before calling services
- Use `parseOptionalDate()`, `parseDate()`, `parseOptionalDateOrNull()` for date transformation
- Services continue to receive `Prisma.*Input` types with domain types

**FR3: Form Component Extraction**
- All forms extracted to Client Components in `src/components/admin/{domain}/`
- Create forms: `create-{domain}-form.tsx`
- Edit forms: `edit-{domain}-form.tsx`
- All forms use React Hook Form with `zodResolver(wireSchema)`
- All forms use oRPC mutations with `useMutation(orpc.admin.{domain}.{action}.mutationOptions())`
- Submit handlers send data as-is (no transformation)

**FR4: Page Simplification**
- Pages remain Server Components for data fetching
- Pages use `serverClient` to fetch data
- Pages render form components with data as props
- Remove inline Server Actions from pages

**FR5: Constitution Update**
- Add "Wire-to-Domain Pattern" section to `docs/constitutions/current/patterns.md`
- Add "Admin Form Pattern" section to `docs/constitutions/current/patterns.md`
- Both sections reference existing documentation (`docs/admin-form-pattern.md`, `docs/wire-to-domain-pattern.md`)
- Mark these patterns as **mandatory** for all admin forms

### Non-Functional Requirements

**NFR1: Real-time Validation**
- All forms display Zod validation errors immediately as user types
- Field-level errors appear below each input
- Form-level errors appear in error banner

**NFR2: Loading States**
- Submit buttons show loading text during mutation
- Submit buttons disabled during submission
- No double-submit issues

**NFR3: Error Handling**
- Mutation errors displayed in error banner
- Error messages user-friendly (not raw stack traces)
- Network errors handled gracefully

**NFR4: Consistent UX**
- All forms use same Tailwind classes for styling
- All forms follow same layout pattern (matching `games/new`)
- All error/success messages use consistent format

**NFR5: Type Safety**
- Full type inference from schema → router → service
- No manual type assertions in forms
- Compile errors if schema/router mismatch

## Architecture

> **Layer boundaries**: @docs/constitutions/current/architecture.md
> **Required patterns**: @docs/constitutions/current/patterns.md
> **Wire-to-domain pattern**: docs/wire-to-domain-pattern.md
> **Admin form pattern**: docs/admin-form-pattern.md

### Migration Strategy

**Pattern-Layer Migration:** Complete each layer across all domains before proceeding to next layer.

**Layer 1: Schema Standardization** (all schemas → wire format)
**Layer 2: Router Transformation** (all routers → wire-to-domain)
**Layer 3: Form Components** (all forms → React Hook Form + oRPC)
**Layer 4: Constitution** (update mandatory patterns)

### Components

**Schemas to Migrate** (Layer 1):
- `src/schemas/event-schema.ts` - Convert eventDate to wire format
- `src/schemas/category-schema.ts` - No date fields, verify wire format
- `src/schemas/nomination-schema.ts` - No date fields, verify wire format
- `src/schemas/person-schema.ts` - No date fields, verify wire format
- `src/schemas/work-schema.ts` - Convert WorkType enum to string literals
- `src/schemas/game-schema.ts` - Already done (reference)

**Routers to Update** (Layer 2):
- `src/lib/api/routers/admin.ts`:
  - `events.create/update` - Transform eventDate
  - `categories.create/update` - No transformation needed
  - `nominations.create/update` - No transformation needed
  - `people.create/update` - No transformation needed
  - `works.create/update` - No transformation needed
  - `games.create/update` - Already done (reference)

**Form Components to Create** (Layer 3):
- `src/components/admin/events/create-event-form.tsx`
- `src/components/admin/events/edit-event-form.tsx`
- `src/components/admin/categories/create-category-form.tsx`
- `src/components/admin/categories/edit-category-form.tsx`
- `src/components/admin/nominations/create-nomination-form.tsx`
- `src/components/admin/nominations/edit-nomination-form.tsx`
- `src/components/admin/people/create-person-form.tsx`
- `src/components/admin/people/edit-person-form.tsx`
- `src/components/admin/works/create-work-form.tsx`
- `src/components/admin/works/edit-work-form.tsx`
- `src/components/admin/games/edit-game-form.tsx` (create form already exists)

**Pages to Update** (Layer 3):
- `src/app/(admin)/admin/events/new/page.tsx` - Render CreateEventForm
- `src/app/(admin)/admin/events/[id]/page.tsx` - Render EditEventForm
- `src/app/(admin)/admin/categories/new/page.tsx` - Render CreateCategoryForm
- `src/app/(admin)/admin/categories/[id]/page.tsx` - Render EditCategoryForm
- `src/app/(admin)/admin/nominations/new/page.tsx` - Render CreateNominationForm
- `src/app/(admin)/admin/nominations/[id]/page.tsx` - Render EditNominationForm
- `src/app/(admin)/admin/people/new/page.tsx` - Render CreatePersonForm
- `src/app/(admin)/admin/people/[id]/page.tsx` - Render EditPersonForm
- `src/app/(admin)/admin/works/new/page.tsx` - Render CreateWorkForm
- `src/app/(admin)/admin/works/[id]/page.tsx` - Render EditWorkForm
- `src/app/(admin)/admin/games/[id]/page.tsx` - Render EditGameForm

**Constitution to Update** (Layer 4):
- `docs/constitutions/current/patterns.md` - Add two new sections

### Dependencies

**Existing packages:**
- `react-hook-form` - Already installed
- `@hookform/resolvers` - Already installed
- `@tanstack/react-query` - Already installed via oRPC
- `zod` - Already installed

**No new packages required.**

### Integration Points

**Existing Infrastructure:**
- oRPC contracts already defined in `src/lib/api/contracts/admin.ts`
- oRPC routers already exist in `src/lib/api/routers/admin.ts`
- Wire-to-domain utilities already exist in `src/lib/api/utils/wire-to-domain.ts`
- Services already accept domain types (no changes needed)
- Reference implementation exists: `games/new` form

**No breaking changes** - Migration is additive:
- Schemas change from backend to wire format (still compatible)
- Routers add transformation (services unchanged)
- Forms move from Server Actions to oRPC (same endpoints)
- Pages simplified (behavior unchanged)

## Acceptance Criteria

**Constitution compliance:**
- [ ] All schemas follow wire format rules (@docs/wire-to-domain-pattern.md)
- [ ] All routers transform at API boundary (@docs/wire-to-domain-pattern.md)
- [ ] All forms follow RHF + oRPC pattern (@docs/admin-form-pattern.md)
- [ ] All patterns documented in constitution (@docs/constitutions/current/patterns.md)

**Layer 1: Schema Standardization:**
- [ ] All date fields use `z.string().datetime()` (no `.coerce()`)
- [ ] All enum fields use `z.enum([...])` (no `.nativeEnum()`)
- [ ] All schemas export both schema and type
- [ ] No `.default()` in schemas (defaults in router/service)

**Layer 2: Router Transformation:**
- [ ] All routers import wire-to-domain utilities
- [ ] All date fields transformed using `parseOptionalDate()` or `parseDate()`
- [ ] Services receive domain types (unchanged signatures)
- [ ] All handlers destructure wire fields before transformation

**Layer 3: Form Components:**
- [ ] All forms use React Hook Form with `zodResolver(wireSchema)`
- [ ] All forms use oRPC mutations with `.mutationOptions()`
- [ ] All forms display field-level errors
- [ ] All forms display mutation errors in banner
- [ ] All forms show loading states
- [ ] All pages simplified to Server Components that render form components

**Layer 4: Constitution:**
- [ ] Wire-to-domain pattern documented as mandatory
- [ ] Admin form pattern documented as mandatory
- [ ] Both sections reference existing documentation
- [ ] Code review checklist includes these patterns

**Verification:**
- [ ] TypeScript compiles without errors
- [ ] All forms function identically to before (no behavior changes)
- [ ] Real-time validation works on all forms
- [ ] Loading states display correctly
- [ ] Error handling works for network/validation errors
- [ ] All forms follow consistent styling

## Open Questions

None - design validated during brainstorming phases 1-3.

## References

- **Wire-to-Domain Pattern**: docs/wire-to-domain-pattern.md
- **Admin Form Pattern**: docs/admin-form-pattern.md
- **Architecture**: @docs/constitutions/current/architecture.md
- **Patterns**: @docs/constitutions/current/patterns.md
- **Tech Stack**: @docs/constitutions/current/tech-stack.md
- **React Hook Form**: https://react-hook-form.com/get-started
- **TanStack Query**: https://tanstack.com/query/latest/docs/framework/react/guides/mutations
- **Zod**: https://zod.dev
