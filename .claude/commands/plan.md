---
description: Decompose feature spec into executable plan with automatic phase analysis and sequential/parallel strategy
---

You are creating an execution plan from a feature specification for BigNight.Party.

## Input

User will provide: `/plan {spec-path}`

Example: `/plan @specs/features/magic-link-auth.md`

## Workflow

### Step 1: Invoke Task Decomposition Skill

Announce: "I'm using the Task Decomposition skill to create an execution plan."

Use the `task-decomposition` skill to analyze the spec and create a plan.

**What the skill does:**
1. Reads the spec and extracts tasks from "Implementation Plan" section
2. Validates task quality (no XL tasks, explicit files, acceptance criteria, proper chunking)
3. Analyzes file dependencies between tasks
4. Groups tasks into phases (sequential or parallel)
5. Calculates execution time estimates with parallelization savings
6. Generates plan.md in the spec directory

**Critical validations:**
- ❌ XL tasks (>8h) → Must split before planning
- ❌ Missing files → Must specify exact paths
- ❌ Missing acceptance criteria → Must add 3-5 criteria
- ❌ Wildcard patterns (`src/**/*.ts`) → Must be explicit
- ❌ Too many S tasks (>30%) → Bundle into thematic M/L tasks

**Chunking Philosophy:**
Tasks should be PR-sized, thematically coherent units - not mechanical file splits.
- M (3-5h): Sweet spot - complete subsystem/layer/slice
- L (5-7h): Major units - full UI layer, complete API surface
- S (1-2h): Rare - only truly standalone work

**If validation fails:**
The skill will report issues and STOP. User must fix spec and re-run `/plan`.

**If validation passes:**
The skill generates `{spec-directory}/plan.md` with:
- Phase grouping (sequential/parallel strategies)
- Task dependencies and file analysis
- Execution time estimates
- Complete implementation details

### Step 2: Review Plan Output

After skill completes, review the generated plan:

```bash
cat {spec-directory}/plan.md
```

Verify:
- ✅ Phase strategies make sense (parallel for independent tasks)
- ✅ Dependencies are correct (based on file overlaps)
- ✅ No XL tasks (all split into M or smaller)
- ✅ Time savings calculation looks reasonable

### Step 3: Report to User

Provide comprehensive summary:

```markdown
✅ Execution Plan Generated

**Location**: {spec-directory}/plan.md

## Plan Summary

**Phases**: {count}
- Sequential: {count} phases ({tasks} tasks)
- Parallel: {count} phases ({tasks} tasks)

**Tasks**: {total-count}
- L (4-8h): {count}
- M (2-4h): {count}
- S (1-2h): {count}

## Time Estimates

**Sequential Execution**: {hours}h
**With Parallelization**: {hours}h
**Time Savings**: {hours}h ({percent}% faster)

## Parallelization Opportunities

{For each parallel phase:}
- **Phase {id}**: {task-count} tasks can run simultaneously
  - Tasks: {task-names}
  - Time: {sequential}h → {parallel}h
  - Savings: {hours}h

## Next Steps

### Review Plan
```bash
cat {spec-directory}/plan.md
```

### Execute Plan
```bash
/execute @{spec-directory}/plan.md
```

### Modify Plan (if needed)
Edit {spec-directory}/plan.md directly, then run `/execute`
```

## Error Handling

### Validation Failures

If the skill finds quality issues:

```markdown
❌ Plan Generation Failed - Spec Quality Issues

The spec has issues that prevent task decomposition:

**CRITICAL Issues** (must fix):
- Task 3: XL complexity (12h estimated) - split into M/L tasks
- Task 5: No files specified - add explicit file paths
- Task 7: No acceptance criteria - add 3-5 testable criteria
- Too many S tasks (5 of 8 = 63%) - bundle into thematic M/L tasks

**HIGH Issues** (strongly recommend):
- Task 2 (S - 1h): "Add routes" - bundle with UI components task
- Task 4 (S - 2h): "Create schemas" - bundle with agent or service task
- Task 6: Wildcard pattern `src/**/*.ts` - specify exact files

## Fix These Issues

1. Edit the spec at {spec-path}
2. Address all CRITICAL issues (required)
3. Consider fixing HIGH issues (recommended)
4. Bundle S tasks into thematic M/L tasks for better PR structure
5. Re-run: `/plan @{spec-path}`
```

### No Tasks Found

If spec has no "Implementation Plan" section:

```markdown
❌ Cannot Generate Plan - No Tasks Found

The spec at {spec-path} doesn't have an "Implementation Plan" section with tasks.

Use `/spec-feature` to generate a complete spec with task breakdown first:

```bash
/spec-feature "your feature description"
```

Then run `/plan` on the generated spec.
```

### Circular Dependencies

If tasks have circular dependencies:

```markdown
❌ Circular Dependencies Detected

The task dependency graph has cycles:
- Task A depends on Task B
- Task B depends on Task C
- Task C depends on Task A

This makes execution impossible.

## Resolution

Review the task file dependencies in the spec:
1. Check which files each task modifies
2. Ensure dependencies flow in one direction
3. Consider splitting tasks to break cycles
4. Re-run `/plan` after fixing
```

## Important Notes

- **Automatic strategy selection** - Skill analyzes dependencies and chooses sequential vs parallel
- **File-based dependencies** - Tasks sharing files must run sequentially
- **Quality gates** - Validates before generating (prevents bad plans)
- **Architecture adherence** - All tasks must follow project constitution at @docs/constitutions/current/

Now generate the plan from: {spec-path}
