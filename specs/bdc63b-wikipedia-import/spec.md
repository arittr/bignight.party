---
runId: bdc63b
feature: wikipedia-import
created: 2025-01-20
status: draft
---

# Feature: Wikipedia Event Import

**Status**: Draft
**Created**: 2025-01-20
**Run ID**: bdc63b

## Problem Statement

**Current State:**
Admins must manually create Events, Categories, Nominations, Person, and Work records through the admin interface. For awards shows like the Oscars with 20+ categories and 100+ nominations, this is time-consuming and error-prone.

**Desired State:**
Admins can import complete event data (categories, nominations, persons, works, images) from a Wikipedia URL in minutes with a preview-first workflow.

**Gap:**
No automated import mechanism exists. Manual data entry takes hours and risks typos, missing nominees, or incorrect associations.

## Requirements

> **Note**: All features must follow @docs/constitutions/current/

### Functional Requirements

- **FR1**: Admin can paste Wikipedia URL (e.g., `https://en.wikipedia.org/wiki/97th_Academy_Awards`) and preview parsed event data
- **FR2**: System parses Wikipedia page via API (wikitext format) to extract event metadata, categories, and nominations
- **FR3**: System extracts Person/Work entities with Wikipedia slugs and image URLs from Wikipedia/Wikimedia Commons
- **FR4**: System deduplicates Person/Work records by `wikipediaSlug` (same person nominated in multiple categories creates single Person record)
- **FR5**: Admin reviews preview showing event name, date, categories, nominations before committing
- **FR6**: Admin confirms import to create Event + Categories + Nominations + Person/Work records atomically
- **FR7**: If parsing fails at any step, entire import fails (no partial imports)
- **FR8**: System redirects to Event detail page after successful import

### Non-Functional Requirements

- **NFR1**: Import completes within 30 seconds for typical awards show (20-30 categories)
- **NFR2**: Atomic transaction ensures database consistency (all-or-nothing import)
- **NFR3**: Error messages provide actionable guidance ("Invalid Wikipedia URL format" vs generic errors)
- **NFR4**: Preview shows sufficient detail for admin to validate correctness (category names, nominee counts, sample nominations)
- **NFR5**: Respects Wikipedia API terms of service (rate limits, user agent)

## Architecture

> **Layer boundaries**: @docs/constitutions/current/architecture.md
> **Required patterns**: @docs/constitutions/current/patterns.md

### Schema Changes

**Add to `Person` model:**
```prisma
wikipediaSlug String? @unique  // e.g., "Cillian_Murphy"

@@index([wikipediaSlug])
```

**Add to `Work` model:**
```prisma
wikipediaSlug String? @unique  // e.g., "Oppenheimer_(film)"

@@index([wikipediaSlug])
```

**Migration name**: `add_wikipedia_slugs`

**Rationale**: Enables deduplication during import (same person in multiple categories). Nullable to support manually-created records.

See: @docs/constitutions/current/schema-rules.md

### Components

**New Files:**

- `src/lib/parsers/wikipedia/wikipedia-parser.ts` - Fetches Wikipedia API, parses wikitext to extract event data
- `src/lib/parsers/wikipedia/wikipedia-adapter.ts` - Transforms parsed data to Prisma input types
- `src/lib/parsers/wikipedia/types.ts` - Parser-specific types (ParsedEvent, ParsedCategory, ParsedNomination)
- `src/lib/services/wikipedia-import-service.ts` - Orchestrates parsing, deduplication, transaction management
- `src/lib/actions/wikipedia-import-actions.ts` - Server actions: `previewImportAction`, `confirmImportAction`
- `src/schemas/wikipedia-import-schema.ts` - Zod validation for Wikipedia URL and preview data
- `src/app/(admin)/admin/import/page.tsx` - Server Component: Import wizard UI
- `src/app/(admin)/admin/import/_components/import-form.tsx` - Client Component: URL input form
- `src/app/(admin)/admin/import/_components/preview-table.tsx` - Client Component: Preview data table

**Modified Files:**

- `src/lib/models/person-model.ts` - Add `findOrCreateByWikipediaSlug()` for deduplication
- `src/lib/models/work-model.ts` - Add `findOrCreateByWikipediaSlug()` for deduplication
- `prisma/schema.prisma` - Add `wikipediaSlug` fields to Person and Work models

### Layer Responsibilities

**Parser** (`wikipedia-parser.ts`):
- Calls Wikipedia API: `https://en.wikipedia.org/w/api.php?action=parse&page={title}&format=json&prop=wikitext`
- Parses wikitext using `wtf_wikipedia` library
- Extracts event metadata (name, date), categories, nominations, images
- Returns structured `ParsedEvent` type
- **No** Prisma imports, **no** business logic

**Adapter** (`wikipedia-adapter.ts`):
- Transforms `ParsedEvent` → Prisma input types (`Prisma.EventCreateInput`)
- Normalizes data (trim strings, parse dates, extract Wikipedia slugs from URLs)
- **No** external API calls, **no** database access

**Service** (`wikipedia-import-service.ts`):
- Orchestrates: calls parser → calls adapter → deduplicates → creates records
- Deduplicates Person/Work via `findOrCreateByWikipediaSlug` (reuses existing records)
- Wraps all creates in Prisma transaction (atomic import)
- Two modes: preview (return data without saving) and commit (save to database)

**Actions** (`wikipedia-import-actions.ts`):
- `previewImportAction`: Validates URL, calls service for preview, returns preview data
- `confirmImportAction`: Validates preview data, calls service to commit, redirects to event detail
- Uses `adminAction` middleware (admin-only access)
- All inputs validated with Zod schemas

**Models** (`person-model.ts`, `work-model.ts`):
- New function: `findOrCreateByWikipediaSlug(data)` - Upserts by wikipediaSlug
- Returns existing record if wikipediaSlug matches, creates new if not

### Dependencies

**New packages:**
- `wtf_wikipedia` - Parses Wikipedia wikitext format
- See: https://github.com/spencermountain/wtf_wikipedia

**Schema migration:**
- `add_wikipedia_slugs` - Add wikipediaSlug fields to Person and Work models

### Integration Points

- **Auth**: Uses existing `adminAction` middleware per @docs/constitutions/current/patterns.md
- **Database**: Prisma transactions per @docs/constitutions/current/tech-stack.md
- **Validation**: Zod schemas per @docs/constitutions/current/patterns.md
- **Routes**: Uses `routes.admin.import` per @docs/constitutions/current/patterns.md (centralized routes)
- **Server/Client**: Form and preview components follow Server/Client boundaries per @docs/constitutions/current/patterns.md

## Data Flow

### Preview Flow

```
Admin enters Wikipedia URL
  ↓
ImportForm (Client) calls previewImportAction
  ↓
Action validates URL with Zod
  ↓
Service calls parser.parse(url)
  ↓
Parser fetches Wikipedia API, parses wikitext, returns ParsedEvent
  ↓
Service calls adapter.transform(parsedEvent)
  ↓
Adapter returns preview data (no DB access)
  ↓
Action returns preview to client
  ↓
PreviewTable (Client) displays categories, nominations, counts
```

### Commit Flow

```
Admin clicks "Confirm Import"
  ↓
PreviewTable (Client) calls confirmImportAction with preview data
  ↓
Action validates preview data with Zod
  ↓
Service starts Prisma transaction:
  ├─ For each unique Person: findOrCreateByWikipediaSlug()
  ├─ For each unique Work: findOrCreateByWikipediaSlug()
  └─ Create Event with nested Categories and Nominations
  ↓
Transaction commits (atomic) or rolls back on error
  ↓
Action redirects to routes.admin.events.detail(newEventId)
```

## Error Handling

### Error Scenarios

- **Invalid Wikipedia URL**: Zod validation fails → Show "Must be a valid Wikipedia URL"
- **Wikipedia API timeout**: Parser throws → Show "Failed to fetch Wikipedia page"
- **Parse failure**: Parser cannot extract categories → Show "Failed to parse Wikipedia structure"
- **Missing required data**: No event date or categories found → Show "Incomplete Wikipedia page data"
- **Duplicate event slug**: Event slug already exists → Show "Event already imported"
- **Transaction failure**: Database error during commit → Show "Failed to create event" (rollback ensures no partial import)

### Atomic Behavior

- Import is all-or-nothing via Prisma transaction
- If ANY step fails (parsing, deduplication, creation), entire import rolls back
- Database remains consistent (no orphaned records)

## Acceptance Criteria

### Constitution Compliance

- [ ] All patterns followed (@docs/constitutions/current/patterns.md):
  - Server actions use `next-safe-action` with Zod validation
  - All routes use centralized `routes` object
  - Server/Client component boundaries respected
  - No type assertions without validation
- [ ] Architecture boundaries respected (@docs/constitutions/current/architecture.md):
  - Parser has no Prisma imports
  - Service calls models (not Prisma directly)
  - Actions call services (not models directly)
- [ ] Schema rules followed (@docs/constitutions/current/schema-rules.md):
  - Proper indexing on wikipediaSlug
  - Naming conventions (camelCase fields, PascalCase models)

### Feature-Specific

- [ ] Admin can paste Wikipedia URL and see preview
- [ ] Preview shows event name, date, category count, nomination count
- [ ] Admin can confirm preview to create event
- [ ] Same person nominated in multiple categories creates single Person record
- [ ] Import fails atomically if parsing fails (no partial data)
- [ ] Successful import redirects to Event detail page
- [ ] Error messages are actionable and user-friendly

### Verification

- [ ] Linting passes (`pnpm lint`)
- [ ] Feature works end-to-end (import real Wikipedia page)
- [ ] Transaction rollback verified (force parse error, check no records created)

## Open Questions

None at this time.

## References

- Architecture: @docs/constitutions/current/architecture.md
- Patterns: @docs/constitutions/current/patterns.md
- Schema Rules: @docs/constitutions/current/schema-rules.md
- Tech Stack: @docs/constitutions/current/tech-stack.md
- Testing: @docs/constitutions/current/testing.md (testing deferred for now)
- wtf_wikipedia: https://github.com/spencermountain/wtf_wikipedia
- Wikipedia API: https://www.mediawiki.org/wiki/API:Main_page
