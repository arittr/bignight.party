---
runId: 3a5240
feature: testing-strategy
created: 2025-01-20
status: draft
---

# Feature: Comprehensive Testing Strategy with Vitest

**Status**: Draft
**Created**: 2025-01-20

## Problem Statement

**Current State:**
BigNight.Party has stub test files in `src/lib/services/__tests__/` and `src/lib/models/__tests__/` with commented-out Vitest tests. No testing framework is configured. The `package.json` has no test scripts or Vitest dependencies. Developers cannot run tests or practice TDD workflows.

**Desired State:**
Vitest testing framework fully configured with layered test strategies matching the application architecture. Developers can run fast unit tests during development and comprehensive integration tests in CI. Critical business logic in services and models has test coverage. Component tests exist for critical UI interactions.

**Gap:**
Need to install Vitest, configure test database, create test infrastructure (factories, utilities), define layer-specific testing strategies, and migrate existing stub tests to working implementations.

## Requirements

> **Note**: All testing must follow @docs/constitutions/current/testing.md

### Functional Requirements

**Test Infrastructure:**
- FR1: Vitest configured with TypeScript support and path aliases matching tsconfig.json
- FR2: Separate PostgreSQL test database (bignight_test on port 5433) for model layer tests
- FR3: Test database lifecycle managed via global setup (migrations in beforeAll, truncation in afterEach)
- FR4: NPM scripts for running all tests, layer-specific tests, and coverage reports

**Models Layer Testing:**
- FR5: Model tests use real test database with no mocking
- FR6: Tests verify Prisma queries, database constraints, and referential integrity
- FR7: Tests cover unique constraints, foreign key relationships, and query correctness

**Services Layer Testing:**
- FR8: Service tests mock all model layer imports using vi.mock()
- FR9: Tests verify business logic: state machines (ts-pattern), validation rules, error handling
- FR10: Tests verify orchestration between multiple models without database queries

**Component Testing (Minimal):**
- FR11: Component tests for critical UI components only (PickForm, ConfirmDeleteButton, admin controls)
- FR12: Component tests use @testing-library/react with mocked server actions
- FR13: Tests verify user interactions, form submissions, and action invocations

**Test Data Management:**
- FR14: Factory functions in `tests/factories/` for creating test data with sensible defaults
- FR15: Fixture files in `tests/fixtures/` for common test scenarios (events, games, picks)
- FR16: Shared utilities in `tests/utils/` for database helpers, common mocks, test setup

### Non-Functional Requirements

**Performance:**
- NFR1: Service layer tests (mocked) run in <5 seconds for full suite
- NFR2: Model layer tests (real DB) run in <15 seconds for full suite
- NFR3: Tests run in parallel per layer (models, services, components)

**Developer Experience:**
- NFR4: Watch mode for rapid feedback during development
- NFR5: Clear test failure messages with expected vs actual values
- NFR6: Layer-specific test scripts (test:models, test:services, test:ui)

**Quality Gates:**
- NFR7: PR checks enforce test passage and coverage reporting (manual execution during development)
- NFR8: Coverage targets: 80% statements, 75% branches for critical business logic
- NFR9: Tests are isolated (no shared state), deterministic (no flaky tests), and fast

## Architecture

> **Layer boundaries**: @docs/constitutions/current/architecture.md
> **Required patterns**: @docs/constitutions/current/patterns.md
> **Testing standards**: @docs/constitutions/current/testing.md

### Components

**New Files - Test Infrastructure:**
- `vitest.config.ts` - Vitest configuration with React plugin, path aliases, global setup
- `tests/setup/database.ts` - Test database lifecycle (migrations, truncation, disconnect)
- `tests/utils/prisma.ts` - Shared test Prisma client, truncate helper
- `tests/utils/mocks.ts` - Common mock implementations for models and actions
- `tests/factories/game.ts` - Factory for creating test Game data
- `tests/factories/pick.ts` - Factory for creating test Pick data
- `tests/factories/category.ts` - Factory for creating test Category data
- `tests/factories/nomination.ts` - Factory for creating test Nomination data
- `tests/fixtures/events.ts` - Pre-defined Event test data (e.g., OSCARS_2025_EVENT)
- `tests/fixtures/games.ts` - Pre-defined Game test data (e.g., OPEN_GAME_FIXTURE)
- `.env.test` - Test environment variables (DATABASE_URL_TEST)

**New Files - Component Tests:**
- `src/components/__tests__/PickForm.test.tsx` - Test pick submission form interactions
- `src/app/(admin)/admin/_components/__tests__/ConfirmDeleteButton.test.tsx` - Test delete confirmation flow

**Modified Files - Docker & Config:**
- `docker-compose.yml` - Add bignight_test database service on port 5433
- `package.json` - Add Vitest dependencies, test scripts
- `.gitignore` - Add coverage/ directory

**Existing Test Files to Migrate:**
- `src/lib/models/__tests__/game-participant.test.ts` - Uncomment and update to use test database
- `src/lib/services/__tests__/game-service.test.ts` - Uncomment and update with proper mocking
- `src/lib/services/__tests__/pick-service.test.ts` - Uncomment and update with proper mocking

### Dependencies

**New packages (devDependencies):**
- `vitest` - Test framework (see: https://vitest.dev)
- `@vitest/ui` - Optional UI for test debugging (see: https://vitest.dev/guide/ui.html)
- `@vitejs/plugin-react` - React support for component tests (see: https://github.com/vitejs/vite-plugin-react)
- `@testing-library/react` - Component testing utilities (see: https://testing-library.com/docs/react-testing-library/intro/)
- `@testing-library/user-event` - User interaction simulation (see: https://testing-library.com/docs/user-event/intro)
- `happy-dom` - Lightweight DOM for component tests (see: https://github.com/capricorn86/happy-dom)

All packages follow @docs/constitutions/current/tech-stack.md approval process.

**Database changes:**
- Add test database container to docker-compose.yml
- No Prisma schema changes required

### Integration Points

**Test Database:**
- Uses existing Prisma schema and migrations
- Separate PostgreSQL instance (port 5433) to avoid conflicts with development database
- Environment variable `DATABASE_URL_TEST` for test-specific connection string

**Existing Test Stubs:**
- Three stub test files already exist with commented Vitest code
- Migration converts stubs to working tests following new patterns

**Constitution Compliance:**
- All tests follow TDD workflow per @docs/constitutions/current/testing.md
- Model tests verify data access only (no business logic)
- Service tests verify business logic with mocked models
- Component tests use mocked actions (no direct model/service imports)

## Critical Flows to Test

**Business Logic (Services Layer):**
1. **Pick Submission State Machine**: Validate game status transitions (SETUP → OPEN → LIVE → COMPLETED) using ts-pattern exhaustive matching
2. **Winner Marking**: Admin marks category winner, validates winner belongs to category, updates isRevealed flag
3. **Leaderboard Calculation**: Aggregate picks by user, sum points for correct picks (nominationId === category.winnerId), count only revealed categories
4. **Game Participation**: User joins game, validates game exists, handles duplicate memberships
5. **Access Code Resolution**: Resolve game by access code, check user membership status

**Data Integrity (Models Layer):**
1. **Unique Constraints**: Pick unique on [gameId, userId, categoryId], Game unique on accessCode
2. **Foreign Key Relationships**: Cascading deletes (Game → Picks), referential integrity
3. **Query Correctness**: findByAccessCode returns null for invalid codes, findByUserId returns user's games

**UI Interactions (Component Layer):**
1. **PickForm**: Renders nominees, submits pick with correct categoryId and nominationId
2. **ConfirmDeleteButton**: Shows confirmation dialog, calls delete action only after confirmation

**Explicitly NOT Testing:**
- Zod schema parsing (library's responsibility)
- Prisma query syntax (covered by model layer tests)
- Next.js routing and middleware (framework's responsibility)
- Auth.js authentication flows (library's responsibility)

## Acceptance Criteria

**Constitution Compliance:**
- [ ] Vitest configuration follows patterns per @docs/constitutions/current/testing.md
- [ ] Layer boundaries respected: Models (real DB), Services (mocked models), Components (mocked actions)
- [ ] TDD workflow enabled: Write test (RED) → Minimal code (GREEN) → Refactor

**Infrastructure:**
- [ ] Test database starts successfully with `pnpm stack:up`
- [ ] Migrations run automatically in test setup
- [ ] Table truncation works between tests (fast, isolated)
- [ ] All NPM test scripts execute successfully

**Test Coverage:**
- [ ] All three existing stub tests migrated and passing
- [ ] Critical business logic in services has test coverage (pick submission, winner marking, leaderboard)
- [ ] Model layer tests verify database constraints and query correctness
- [ ] At least two critical components have test coverage (PickForm, ConfirmDeleteButton)

**Developer Experience:**
- [ ] `pnpm test` runs tests in watch mode for rapid feedback
- [ ] `pnpm test:run` executes all tests once for CI
- [ ] `pnpm test:coverage` generates coverage report
- [ ] Test failures show clear error messages with expected vs actual

**Verification:**
- [ ] All tests pass with `pnpm test:run`
- [ ] Coverage report shows >80% for services layer critical paths
- [ ] Linting passes with `pnpm lint`
- [ ] Test database can be reset without affecting development database

## Open Questions

None - design validated through brainstorming.

## References

- **Architecture**: @docs/constitutions/current/architecture.md (layer boundaries, project structure)
- **Patterns**: @docs/constitutions/current/patterns.md (ts-pattern, next-safe-action, mocking)
- **Testing Standards**: @docs/constitutions/current/testing.md (TDD workflow, test organization)
- **Tech Stack**: @docs/constitutions/current/tech-stack.md (approved libraries and versions)
- **Vitest Documentation**: https://vitest.dev
- **Testing Library**: https://testing-library.com
- **Prisma Testing**: https://www.prisma.io/docs/guides/testing
