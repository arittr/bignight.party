# Testing Standards

## Core Principle

**Test-Driven Development (TDD) is mandatory for all feature work.**

Follow the `test-driven-development` skill from superpowers:
1. Write the failing test
2. Watch it fail (RED)
3. Write minimal code to pass (GREEN)
4. Refactor (REFACTOR)

See: [test-driven-development skill](https://github.com/obra/superpowers-skills/blob/main/skills/testing/test-driven-development/SKILL.md)

---

## Testing Framework

### Vitest (Future)
- **Purpose**: Unit and integration tests
- **Why**: Fast, Vite-powered, excellent TypeScript support
- **Status**: Not yet implemented

### Playwright (Future)
- **Purpose**: End-to-end tests
- **Why**: Reliable, cross-browser, great debugging
- **Status**: Not yet implemented

---

## Test Organization

### Directory Structure

```
src/
├── lib/
│   ├── models/
│   │   ├── pick.ts
│   │   └── __tests__/
│   │       └── pick.test.ts
│   ├── services/
│   │   ├── pick-service.ts
│   │   └── __tests__/
│   │       └── pick-service.test.ts
│   └── actions/
│       ├── pick-actions.ts
│       └── __tests__/
│           └── pick-actions.test.ts
└── components/
    ├── PickForm.tsx
    └── __tests__/
        └── PickForm.test.tsx

tests/
└── e2e/
    ├── pick-flow.spec.ts
    ├── admin-workflow.spec.ts
    └── leaderboard.spec.ts
```

### Test File Naming

- Unit/Integration: `{filename}.test.ts`
- E2E: `{feature}.spec.ts`
- Co-located with source in `__tests__/` directory

---

## Test Levels

### Unit Tests (Models Layer)

Test data access functions in isolation:

```typescript
// src/lib/models/__tests__/pick.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import * as pickModel from '../pick'
import { prisma } from '@/lib/db/prisma'

describe('pickModel.create', () => {
  beforeEach(async () => {
    await prisma.pick.deleteMany()
  })

  it('creates pick with valid data', async () => {
    const pick = await pickModel.create({
      gameId: 'game-1',
      userId: 'user-1',
      categoryId: 'cat-1',
      nomineeId: 'nom-1',
    })

    expect(pick.id).toBeDefined()
    expect(pick.gameId).toBe('game-1')
  })

  it('throws on duplicate pick', async () => {
    await pickModel.create({
      gameId: 'game-1',
      userId: 'user-1',
      categoryId: 'cat-1',
      nomineeId: 'nom-1',
    })

    await expect(
      pickModel.create({
        gameId: 'game-1',
        userId: 'user-1',
        categoryId: 'cat-1',
        nomineeId: 'nom-2',
      })
    ).rejects.toThrow()
  })
})
```

### Integration Tests (Services Layer)

Test business logic with mocked models:

```typescript
// src/lib/services/__tests__/pick-service.test.ts
import { describe, it, expect, vi } from 'vitest'
import * as pickService from '../pick-service'
import * as pickModel from '@/lib/models/pick'
import * as eventModel from '@/lib/models/event'

vi.mock('@/lib/models/pick')
vi.mock('@/lib/models/event')

describe('pickService.submitPick', () => {
  it('creates pick when game is open', async () => {
    vi.mocked(eventModel.findById).mockResolvedValue({
      id: 'event-1',
      status: 'OPEN',
      picksLockAt: new Date(Date.now() + 10000),
    })

    vi.mocked(pickModel.create).mockResolvedValue({
      id: 'pick-1',
      gameId: 'game-1',
      userId: 'user-1',
      categoryId: 'cat-1',
      nomineeId: 'nom-1',
    })

    const result = await pickService.submitPick('user-1', {
      gameId: 'game-1',
      categoryId: 'cat-1',
      nomineeId: 'nom-1',
    })

    expect(result.id).toBe('pick-1')
    expect(pickModel.create).toHaveBeenCalledWith({
      gameId: 'game-1',
      userId: 'user-1',
      categoryId: 'cat-1',
      nomineeId: 'nom-1',
    })
  })

  it('throws when picks are closed', async () => {
    vi.mocked(eventModel.findById).mockResolvedValue({
      id: 'event-1',
      status: 'LIVE',
      picksLockAt: new Date(Date.now() - 10000),
    })

    await expect(
      pickService.submitPick('user-1', {
        gameId: 'game-1',
        categoryId: 'cat-1',
        nomineeId: 'nom-1',
      })
    ).rejects.toThrow('Picks are closed')
  })
})
```

### Component Tests

Test React components with user interactions:

```typescript
// src/components/__tests__/PickForm.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PickForm } from '../PickForm'

describe('PickForm', () => {
  it('renders category and nominees', () => {
    render(
      <PickForm
        category={{ id: '1', name: 'Best Picture' }}
        nominees={[
          { id: 'nom-1', name: 'Oppenheimer' },
          { id: 'nom-2', name: 'Barbie' },
        ]}
      />
    )

    expect(screen.getByText('Best Picture')).toBeInTheDocument()
    expect(screen.getByText('Oppenheimer')).toBeInTheDocument()
  })

  it('submits pick on form submission', async () => {
    const onSubmit = vi.fn()
    render(
      <PickForm
        category={{ id: '1', name: 'Best Picture' }}
        nominees={[{ id: 'nom-1', name: 'Oppenheimer' }]}
        onSubmit={onSubmit}
      />
    )

    fireEvent.click(screen.getByText('Oppenheimer'))
    fireEvent.click(screen.getByText('Submit'))

    expect(onSubmit).toHaveBeenCalledWith({
      categoryId: '1',
      nomineeId: 'nom-1',
    })
  })
})
```

### E2E Tests

Test complete user flows:

```typescript
// tests/e2e/pick-flow.spec.ts
import { test, expect } from '@playwright/test'

test('user can submit picks', async ({ page }) => {
  // Login
  await page.goto('/auth/signin')
  await page.fill('input[type="email"]', 'user@example.com')
  await page.click('button:has-text("Send Magic Link")')

  // Navigate to picks
  await page.goto('/picks')

  // Select nominees
  await page.click('text=Oppenheimer')
  await page.click('text=Next Category')

  await page.click('text=Cillian Murphy')
  await page.click('text=Submit Picks')

  // Verify confirmation
  await expect(page.locator('text=Picks submitted!')).toBeVisible()
})
```

---

## TDD Workflow

### RED-GREEN-REFACTOR

**1. RED - Write failing test:**
```typescript
it('marks winner correctly', async () => {
  const result = await adminService.markWinner('cat-1', 'nom-1')
  expect(result.winnerId).toBe('nom-1')
})

// Run: pnpm test
// Expected: FAIL - markWinner not implemented
```

**2. GREEN - Minimal code to pass:**
```typescript
export async function markWinner(categoryId: string, nomineeId: string) {
  return categoryModel.update(categoryId, { winnerId: nomineeId })
}

// Run: pnpm test
// Expected: PASS
```

**3. REFACTOR - Improve code:**
```typescript
export async function markWinner(categoryId: string, nomineeId: string) {
  // Validate nominee belongs to category
  const nominee = await nomineeModel.findById(nomineeId)
  if (nominee.categoryId !== categoryId) {
    throw new Error('Nominee does not belong to category')
  }

  return categoryModel.update(categoryId, { winnerId: nomineeId })
}

// Run: pnpm test
// Expected: PASS (add test for validation)
```

### Anti-Pattern: Writing Implementation First

❌ **Don't do this:**
```typescript
// 1. Write implementation
export function calculateScore(picks) {
  return picks.filter(p => p.isCorrect).reduce((sum, p) => sum + p.points, 0)
}

// 2. Write test after
it('calculates score', () => {
  expect(calculateScore([...])).toBe(100)
})
```

✅ **Do this:**
```typescript
// 1. Write failing test
it('calculates score from correct picks', () => {
  expect(calculateScore([...])).toBe(100)
})
// FAIL

// 2. Write minimal implementation
export function calculateScore(picks) {
  return picks.filter(p => p.isCorrect).reduce((sum, p) => sum + p.points, 0)
}
// PASS
```

See: `testing-anti-patterns` skill for more examples

---

## Coverage Standards

### Targets (Future)

- **Statements**: 80% minimum
- **Branches**: 75% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum

### What to Test

**Must test:**
- All business logic (services)
- All data transformations
- All state machines (ts-pattern exhaustiveness)
- All error handling paths
- All validation logic

**Can skip:**
- Type definitions
- Simple getters/setters
- Third-party library wrappers
- Configuration files

---

## Test Quality Rules

### Good Tests Are...

**1. Isolated:**
- Don't depend on test order
- Clean up after themselves
- No shared mutable state

**2. Fast:**
- Run in milliseconds
- Mock external dependencies
- Use in-memory database for models

**3. Descriptive:**
```typescript
// ❌ Bad
it('works', () => {})

// ✅ Good
it('throws error when picks are closed', () => {})
```

**4. Focused:**
```typescript
// ❌ Bad - tests multiple things
it('user flow', () => {
  // creates user
  // submits pick
  // views leaderboard
  // updates profile
})

// ✅ Good - one thing per test
it('creates user with valid data', () => {})
it('submits pick when game is open', () => {})
it('displays leaderboard sorted by points', () => {})
```

---

## Mocking Strategy

### Mock External Dependencies

```typescript
// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    pick: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

// Mock WebSocket
vi.mock('@/lib/websocket/server', () => ({
  socketServer: {
    to: vi.fn(() => ({
      emit: vi.fn(),
    })),
  },
}))
```

### Don't Mock What You're Testing

❌ **Bad:**
```typescript
it('pickService creates pick', () => {
  vi.mocked(pickService.create).mockResolvedValue({ id: '1' })
  const result = await pickService.create(data)
  expect(result.id).toBe('1')
})
```

✅ **Good:**
```typescript
it('pickService creates pick', () => {
  vi.mocked(pickModel.create).mockResolvedValue({ id: '1' })
  const result = await pickService.create(data)
  expect(pickModel.create).toHaveBeenCalledWith(data)
})
```

See: `testing-anti-patterns` skill

---

## CI/CD Integration (Future)

### Pre-commit Hooks

```bash
# .husky/pre-commit
pnpm lint
pnpm test --run
```

### Pull Request Checks

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: pnpm test --coverage
- name: Upload coverage
  run: pnpm codecov
```

### Deployment Gates

- All tests pass
- Coverage > 80%
- No linting errors
- Build successful

---

## Test Data Management

### Factories

Create test data builders:

```typescript
// tests/factories/pick.ts
export function buildPick(overrides = {}) {
  return {
    id: 'pick-1',
    gameId: 'game-1',
    userId: 'user-1',
    categoryId: 'cat-1',
    nomineeId: 'nom-1',
    createdAt: new Date(),
    ...overrides,
  }
}
```

### Fixtures

Use consistent test data:

```typescript
// tests/fixtures/events.ts
export const EVENT_FIXTURES = {
  oscars2025: {
    id: 'event-1',
    name: '96th Academy Awards',
    status: 'OPEN',
    picksLockAt: new Date('2025-03-10'),
  },
}
```

---

## Debugging Tests

### Run Single Test

```bash
pnpm test pick-service.test.ts
```

### Run With Debugging

```bash
pnpm test --inspect-brk pick-service.test.ts
```

### Use `it.only`

```typescript
it.only('runs this test only', () => {
  // Debug this specific test
})
```

### Console Logs

```typescript
it('debugs here', () => {
  console.log({ result })  // Shows in test output
  expect(result).toBe(true)
})
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [test-driven-development skill](https://github.com/obra/superpowers-skills/blob/main/skills/testing/test-driven-development/SKILL.md)
- [testing-anti-patterns skill](https://github.com/obra/superpowers-skills/blob/main/skills/testing/testing-anti-patterns/SKILL.md)
