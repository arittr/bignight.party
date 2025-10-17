---
description: Generate a complete feature specification using brainstorming and codebase analysis
---

You are creating a comprehensive feature specification for BigNight.Party.

## Input

User will provide: `/spec {feature-description}`

Example: `/spec magic link authentication with Auth.js`

## Workflow

### Step 1: Brainstorm Requirements

Use the `brainstorming` skill to refine the feature requirements:
- Clarify scope and boundaries
- Identify architectural decisions needed
- Define acceptance criteria
- Explore alternatives if applicable

### Step 2: Analyze Codebase Context

Use the Task tool to spawn an agent that analyzes relevant codebase context:

```
ROLE: You are a codebase analysis agent for BigNight.Party.

TASK: Analyze the codebase to provide architectural context for: {feature-description}

REQUIRED READING:
- @docs/constitutions/current/architecture.md - Mandatory patterns and tech stack
- @docs/constitutions/current/patterns.md - Required libraries (ts-pattern, next-safe-action)
- @docs/constitutions/current/schema-rules.md - Database design philosophy

ANALYSIS TASKS:

1. **Identify Integration Points**:
   - Which existing files/modules will be affected?
   - What patterns should be followed?
   - Where does this feature fit in the architecture?

2. **Technology Stack**:
   - Next.js 15 App Router
   - Auth.js v5 for authentication
   - Prisma + PostgreSQL
   - Socket.io for real-time
   - ts-pattern for discriminated unions
   - next-safe-action for server actions

3. **Required Components**:
   - Model layer files (src/lib/models/)
   - Service layer files (src/lib/services/)
   - Action layer files (src/lib/actions/)
   - UI components (src/components/)
   - Schemas (src/schemas/)
   - Types (src/types/)

4. **Mandatory Patterns** (from patterns.md):
   - ALL server actions use next-safe-action
   - ALL discriminated unions use ts-pattern with .exhaustive()
   - Models only import Prisma
   - Services call models, contain business logic
   - Actions only call services
   - No Prisma outside models layer

OUTPUT: Create a codebase context document with:
- Integration points (specific file paths)
- Components needed (with layer assignments)
- Patterns to follow (with examples)
- Dependencies and ordering
```

### Step 3: Generate Feature Specification

Create a comprehensive spec document at `specs/features/{feature-name}.md`:

```markdown
# Feature: {Feature Name}

**Status**: Draft
**Created**: {date}

## Overview

{1-2 paragraph description from brainstorming}

## Requirements

### Functional Requirements
- FR1: {requirement}
- FR2: {requirement}
- FR3: {requirement}

### Non-Functional Requirements
- NFR1: Must use next-safe-action for all server actions
- NFR2: Must use ts-pattern for all discriminated unions
- NFR3: Must follow model/service/action layer boundaries
- NFR4: {performance/security requirement}

## Architecture

### Components

#### 1. Model Layer (src/lib/models/{feature}.ts)
**Purpose**: Database access only

**Files**:
- `src/lib/models/{model}.ts`

**Responsibilities**:
- Prisma queries only
- No business logic
- Return Prisma types

#### 2. Service Layer (src/lib/services/{feature}-service.ts)
**Purpose**: Business logic and orchestration

**Files**:
- `src/lib/services/{service}.ts`

**Responsibilities**:
- Call model layer for data
- Implement business rules using ts-pattern
- Emit WebSocket events if needed
- No direct Prisma imports

#### 3. Action Layer (src/lib/actions/{feature}-actions.ts)
**Purpose**: Server actions with validation

**Files**:
- `src/lib/actions/{feature}-actions.ts`

**Responsibilities**:
- Use next-safe-action for all actions
- Zod schema validation
- Call service layer only
- Auth checks via middleware

#### 4. UI Components (src/components/{feature}/)
**Purpose**: React components

**Files**:
- `src/components/{feature}/{Component}.tsx`

**Responsibilities**:
- Use useAction hook from next-safe-action
- Call server actions
- Display loading/error states

#### 5. Schemas (src/schemas/{feature}-schema.ts)
**Purpose**: Zod validation schemas

**Files**:
- `src/schemas/{feature}-schema.ts`

**Responsibilities**:
- Define all input validation schemas
- Export types inferred from schemas

#### 6. Types (src/types/{feature}.ts)
**Purpose**: Shared TypeScript types

**Files**:
- `src/types/{feature}.ts`

**Responsibilities**:
- Client/server shared types
- Domain types

### Implementation Order

1. **Database/Types** (if schema changes needed)
   - Update Prisma schema
   - Run migrations
   - Define types

2. **Model Layer**
   - Implement data access functions

3. **Service Layer**
   - Implement business logic with ts-pattern
   - Add WebSocket events if needed

4. **Schemas**
   - Define Zod validation schemas

5. **Action Layer**
   - Create next-safe-action actions
   - Add auth middleware

6. **UI Components**
   - Build React components
   - Connect to actions via useAction

## Acceptance Criteria

- [ ] All server actions use next-safe-action
- [ ] All discriminated unions use ts-pattern with .exhaustive()
- [ ] Layer boundaries respected (no Prisma in services/actions)
- [ ] All inputs validated with Zod
- [ ] Tests pass
- [ ] Biome linting passes
- [ ] Feature works end-to-end

## Implementation Plan

### Task 1: {Task Name}
**Complexity**: M (2-4 hours)
**Files**:
- `{file-1}`
- `{file-2}`

**Description**: {what to implement}

**Acceptance**:
- [ ] {criterion 1}
- [ ] {criterion 2}

### Task 2: {Task Name}
{Similar structure...}

## References

- Architecture: @docs/constitutions/current/architecture.md
- Patterns: @docs/constitutions/current/patterns.md
- Schema Rules: @docs/constitutions/current/schema-rules.md
- Tech Stack: @docs/constitutions/current/tech-stack.md
- Testing: @docs/constitutions/current/testing.md
```

### Step 4: Validate Specification

Review the spec for:
- ✅ All files have explicit paths (no wildcards)
- ✅ All tasks reference mandatory patterns
- ✅ Layer boundaries are clear
- ✅ Acceptance criteria are testable
- ✅ Implementation order makes sense

Report to user:
```
✅ Feature Specification Complete

Location: specs/features/{feature-name}.md

Components:
- {count} model files
- {count} service files
- {count} action files
- {count} UI components

Estimated Complexity: {total}

Next Steps:
1. Review spec: specs/features/{feature-name}.md
2. Implement: /implement-feature @specs/features/{feature-name}.md
```

Now generate the specification for: {feature-description}
