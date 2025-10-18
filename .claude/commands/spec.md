---
description: Generate a complete feature specification using brainstorming and codebase analysis
---

You are creating a comprehensive feature specification for BigNight.Party.

## Input

User will provide: `/spec {feature-description}`

Example: `/spec magic link authentication with Auth.js`

## Workflow

### Step 1: Brainstorm Requirements

Use the `brainstorming` skill for Phases 1-3 ONLY:
- Phase 1: Understanding - Clarify scope and boundaries
- Phase 2: Exploration - Explore alternatives, identify architectural decisions
- Phase 3: Design Presentation - Present design incrementally

**IMPORTANT**: STOP after Phase 3 (Design Presentation). Do NOT continue to:
- Phase 4: Worktree Setup
- Phase 5: Planning Handoff (which launches writing-plans skill)

Return to this /spec workflow after design is validated.

### Step 2: Analyze Task-Specific Context

Use the Task tool to spawn an agent that analyzes task-specific integration points:

```
ROLE: You are a codebase analysis agent for BigNight.Party.

TASK: Analyze task-specific context for: {feature-description}

REQUIRED READING (architectural rules - do NOT recreate these):
- @docs/constitutions/current/architecture.md - Layer boundaries and tech stack
- @docs/constitutions/current/patterns.md - Mandatory patterns (ts-pattern, next-safe-action)
- @docs/constitutions/current/schema-rules.md - Database design rules
- @docs/constitutions/current/tech-stack.md - Required and prohibited libraries
- @docs/constitutions/current/testing.md - TDD requirements

FOCUS: Analyze ONLY task-specific details, NOT general architecture (that's in constitutions).

TASK-SPECIFIC ANALYSIS:

1. **Existing Files Scan**:
   - What files currently exist in the codebase?
   - Which existing files will this feature integrate with?
   - What directories need to be created?
   - Are there similar features to reference?

2. **Dependencies Check**:
   - What npm packages are currently installed?
   - What new dependencies are needed for THIS task?
   - Check package.json, pnpm-lock.yaml

3. **Schema State**:
   - Does prisma/schema.prisma exist?
   - What migrations exist in prisma/migrations/?
   - Does this task need schema changes?

4. **File Path Mapping**:
   Map exactly where new files go (following architecture.md):
   - Models: src/lib/models/{name}.ts
   - Services: src/lib/services/{name}-service.ts
   - Actions: src/lib/actions/{name}-actions.ts
   - Components: src/components/{name}/
   - Schemas: src/schemas/{name}-schema.ts
   - Types: src/types/{name}.ts

OUTPUT (focused on THIS task only):
- List of existing files that will be modified (exact paths)
- List of new files to create (exact paths with layer assignment)
- New dependencies to install (if any)
- Schema changes needed (if any)
- Implementation order based on dependencies
- References to similar existing code (if any)

DO NOT include:
- General architecture explanations (already in constitutions)
- Pattern examples (already in patterns.md)
- Layer boundary rules (already in architecture.md)
```

### Step 3: Generate Feature Specification

Create a comprehensive spec document at `specs/{feature-name}/spec.md`:

```markdown
# Feature: {Feature Name}

**Status**: Draft
**Created**: {date}

## Overview

{1-2 paragraph description from brainstorming}

## Requirements

> **Note**: All features must follow architecture patterns defined in @docs/constitutions/current/

### Functional Requirements
- FR1: {specific requirement for this task}
- FR2: {specific requirement for this task}
- FR3: {specific requirement for this task}

### Non-Functional Requirements
- NFR1: {performance requirement specific to this task}
- NFR2: {security requirement specific to this task}
- NFR3: {DX requirement specific to this task}

## Architecture

> **See**: @docs/constitutions/current/architecture.md for layer boundaries and patterns

### Task-Specific Components

{List files from codebase analysis - existing files to modify, new files to create}

**Example:**
- **New**: `src/lib/db/prisma.ts` - Prisma client singleton
- **New**: `docker-compose.yml` - PostgreSQL container
- **New**: `prisma/schema.prisma` - Database schema
- **Modify**: `package.json` - Add Prisma dependencies and scripts

### Dependencies

{From codebase analysis}

**New packages to install:**
- `@prisma/client` - Prisma ORM client
- `prisma` (dev) - Schema management
- `tsx` (dev) - TypeScript script runner

### Schema Changes

{If applicable from codebase analysis}

**Migrations needed:**
1. Migration name: `init` - Create enums
2. Migration name: `auth` - Add auth models
3. Migration name: `game` - Add game models

### Implementation Order

{From codebase analysis - task-specific order based on dependencies}

**Example:**
1. Docker & environment setup
2. Install dependencies
3. Create Prisma schema
4. Run migrations
5. Create Prisma client singleton
6. Create validation script
7. Update package scripts

## Acceptance Criteria

**Must follow constitution patterns:**
- [ ] All server actions use next-safe-action (see patterns.md)
- [ ] All discriminated unions use ts-pattern with .exhaustive() (see patterns.md)
- [ ] Layer boundaries respected: no Prisma outside models/ (see architecture.md)
- [ ] All inputs validated with Zod (see patterns.md)

**Task-specific criteria:**
- [ ] {criterion specific to this task}
- [ ] {criterion specific to this task}
- [ ] {criterion specific to this task}

**Verification:**
- [ ] Tests pass (if tests exist)
- [ ] Biome linting passes
- [ ] Feature works end-to-end

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

Location: specs/{feature-name}/spec.md

Components:
- {count} model files
- {count} service files
- {count} action files
- {count} UI components

Estimated Complexity: {total}

Next Steps:
1. Review spec: specs/{feature-name}/spec.md
2. Create implementation plan: /plan @specs/{feature-name}/spec.md
```

Now generate the specification for: {feature-description}
