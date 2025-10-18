---
description: Generate a lean feature specification using brainstorming and the writing-specs skill
---

You are creating a feature specification for BigNight.Party.

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
- Phase 5: Planning Handoff

Return to this /spec workflow after design is validated.

### Step 2: Generate Specification

**Announce:** "I'm using the Writing Specs skill to create the specification."

Use the `writing-specs` skill to generate the spec document.

**Task for writing-specs skill:**
- Feature: {feature-description}
- Design context: {summary from brainstorming}
- Output location: `specs/{feature-name}/spec.md`
- Analyze codebase for task-specific context:
  - Existing files to modify
  - New files to create (with exact paths per architecture.md)
  - Dependencies needed
  - Schema changes required
- Follow all Iron Laws:
  - Reference constitutions, don't duplicate
  - Link to SDK docs, don't embed examples
  - No implementation plans (that's `/plan`'s job)
  - Keep it lean (<300 lines)

### Step 3: Report Completion

After spec is generated, report to user:

```
✅ Feature Specification Complete

Location: specs/{feature-name}/spec.md

Next Steps:
1. Review the spec: specs/{feature-name}/spec.md
2. Resolve any Open Questions in the spec
3. Create implementation plan: /plan @specs/{feature-name}/spec.md
```

Now generate the specification for: {feature-description}
