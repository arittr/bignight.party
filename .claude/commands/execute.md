---
description: Execute implementation plan with automatic sequential/parallel orchestration using git-spice and worktrees
---

You are executing an implementation plan for BigNight.Party.

## Input

User will provide: `/execute {plan-path}`

Example: `/execute @specs/features/magic-link-auth/plan.md`

## Workflow

### Step 1: Read and Parse Plan

Read the plan file and extract:
- Feature name
- All phases (with strategy: sequential or parallel)
- All tasks within each phase
- Task details (files, dependencies, acceptance criteria)

Verify plan structure:
- ✅ Has phases with clear strategies
- ✅ All tasks have files specified
- ✅ All tasks have acceptance criteria
- ✅ Dependencies make sense

### Step 2: Create Feature Branch

Create a new git-spice branch for this feature:

```bash
gs branch create
```

Prompt for:
- **Branch name**: `feature/{feature-name-from-plan}`
- **Description**: Feature overview from plan

This branch will be the integration point for all work.

### Step 3: Execute Phases

For each phase in the plan, execute based on strategy:

#### Sequential Phase Strategy

For phases where tasks must run in order:

**Execute tasks sequentially with stacked branches:**

1. For each task in the phase:

   a. **Create stacked branch for task:**
   ```bash
   gs branch create --parent {current-branch}
   ```

   Prompt for:
   - **Branch name**: `task-{task-id}-{short-name}`
   - **Description**: Task name from plan

   b. **Spawn subagent for task implementation:**

   ```
   ROLE: You are implementing Task {task-id} for BigNight.Party.

   TASK: {task-name}
   BRANCH: {task-branch}

   IMPLEMENTATION:

   Read task details from: {plan-path}
   Find: "Task {task-id}: {task-name}"

   Implement according to:
   - Files specified in task
   - Acceptance criteria in task
   - BigNight.Party mandatory patterns (see @docs/constitutions/current/)

   Quality checks:
   ```bash
   pnpm format
   pnpm lint
   pnpm test
   ```

   Commit and create next stacked branch when complete:
   ```bash
   git add --all
   gs branch create -m "[Task {task-id}] {task-name}"
   ```

   Report completion with summary of changes.
   ```

   c. **Verify task completion:**
   ```bash
   pnpm test
   pnpm lint
   git log --oneline -1
   ```

2. After ALL tasks in phase complete:

   **Use `requesting-code-review` skill:**

   Dispatch code-reviewer subagent to review the entire phase:
   - All task branches in this phase
   - Verify patterns followed
   - Check acceptance criteria met
   - Review quality and consistency

3. Address review feedback if needed

4. Phase is complete when code review passes

#### Parallel Phase Strategy

For phases where tasks are independent:

**Create stacked branches and spawn parallel agents:**

1. **Verify independence** (from plan's dependency analysis):
   - Confirm no file overlaps between tasks
   - Check dependencies are satisfied

2. **Create stacked branch per task**:

   For each task in parallel phase:
   ```bash
   gs branch create --parent {feature-branch}
   ```

   Prompt for:
   - **Branch name**: `task-{task-id}-{short-name}`
   - **Description**: Task name from plan

   Store branch info:
   ```javascript
   taskBranches = {
     'task-3-magic-link-service': 'task-3-magic-link-service',
     'task-4-email-service': 'task-4-email-service'
   }
   ```

3. **Spawn parallel agents** (CRITICAL: Single message with multiple Task tools):

   For each task, spawn agent with this prompt:

   ```
   ROLE: You are implementing Task {task-id} for BigNight.Party.

   TASK: {task-name}
   BRANCH: {task-branch}
   PARENT BRANCH: {feature-branch}

   CRITICAL - BRANCH ISOLATION:
   1. You are on branch: {task-branch} (stacked on {feature-branch})
   2. Implement ONLY this task
   3. DO NOT touch files outside this task's scope

   IMPLEMENTATION:

   Read plan from: /Users/drewritter/projects/bignight.party/{plan-path}
   Find: "Task {task-id}: {task-name}"

   Implement according to:
   - Files specified in task
   - Acceptance criteria in task
   - BigNight.Party mandatory patterns (see @docs/constitutions/current/)

   Follow mandatory patterns:
   - Server actions: Use next-safe-action ONLY
   - Discriminated unions: Use ts-pattern with .exhaustive()
   - Layer boundaries: Models (Prisma) → Services → Actions
   - No Prisma imports outside models layer

   Quality checks:
   ```bash
   pnpm format
   pnpm lint
   pnpm test
   ```

   Commit and create next stacked branch when complete:
   ```bash
   git add --all
   gs branch create -m "[Task {task-id}] {task-name}"
   ```

   CRITICAL:
   - ✅ Stay on task branch
   - ✅ Implement ONLY this task
   - ✅ Follow mandatory patterns
   - ❌ DO NOT touch other task files

   Execute: Task {task-id}
   ```

4. **Monitor parallel execution**:
   - Track progress of each agent
   - Watch for errors or blockers
   - Note when agents complete

5. **Verify each task after completion**:
   ```bash
   git checkout {task-branch}
   pnpm test  # Must pass
   pnpm lint  # Must be clean
   git log --oneline -1  # Review commit
   ```

6. **After ALL parallel tasks complete:**

   **Use `requesting-code-review` skill:**

   Dispatch code-reviewer subagent to review the entire phase:
   - All task branches in this phase
   - Check for integration issues
   - Verify patterns followed
   - Ensure no file conflicts
   - Review quality and consistency

7. **Address review feedback if needed**

8. **Verify integration** (after review passes):
   ```bash
   git checkout {feature-branch}

   # Git-spice will handle stacking - verify all tasks visible
   gs branch tree

   # Test integration
   pnpm test
   pnpm lint
   ```

9. Phase is complete when code review passes and integration verified

### Step 4: Verify Completion

After all phases execute successfully:

**Use the `verification-before-completion` skill:**

This skill enforces verification BEFORE claiming work is done.

**Required verifications:**
```bash
# Run full test suite
pnpm test

# Run linting
pnpm lint

# Run production build
pnpm build

# Verify all pass
echo "All checks passed - ready to complete"
```

**Critical:** Evidence before assertions. Never claim "tests pass" without running them.

### Step 5: Finish Branch

After verification passes:

Use the `finishing-a-development-branch` skill to:
1. Review all changes
2. Choose next action:
   - Submit PR: `gs branch submit`
   - Continue with dependent feature
   - Mark complete

### Step 6: Final Report

```markdown
✅ Feature Implementation Complete

**Feature**: {feature-name}
**Branch**: {feature-branch}

## Execution Summary

**Phases Completed**: {count}
- Sequential: {count} phases
- Parallel: {count} phases

**Tasks Completed**: {count}
**Commits**: {count}

## Parallelization Results

{For each parallel phase:}
**Phase {id}**: {task-count} tasks in parallel
- Estimated sequential time: {hours}h
- Actual parallel time: {hours}h
- Time saved: {hours}h

**Total Time Saved**: {hours}h ({percent}%)

## Quality Checks

✅ All tests passing
✅ Biome linting clean
✅ Build successful
✅ {total-commits} commits on feature branch

## Next Steps

### Review Changes
```bash
git log --oneline {feature-branch}
git diff main..{feature-branch}
```

### Submit for Review
```bash
gs branch submit
```

### Or Continue with Dependent Feature
```bash
gs branch create  # Stack on current branch
```
```

## Error Handling

### Phase Execution Failure

If a sequential phase fails:

```markdown
❌ Phase {id} Execution Failed

**Task**: {task-id}
**Error**: {error-message}

## Resolution

1. Review the error above
2. Fix the issue manually or update the plan
3. Resume execution from this phase:
   - Current branch already has completed work
   - Re-run failed task or continue from next task
```

### Parallel Phase Failure

If one agent in parallel phase fails:

```markdown
❌ Parallel Phase {id} - Agent Failure

**Failed Task**: {task-id}
**Branch**: {task-branch}
**Error**: {error-message}

**Successful Tasks**: {list}

## Resolution Options

### Option A: Fix in Branch
```bash
git checkout {task-branch}
# Debug and fix issue
pnpm test
pnpm format
pnpm lint
git add --all
git commit -m "[{task-id}] Fix: {description}"
```

### Option B: Restart Failed Agent
Reset task branch, spawn new agent for this task only:
```bash
git checkout {task-branch}
git reset --hard {feature-branch}
# Spawn fresh agent for this task
```

### Option C: Continue Without Failed Task
Complete successful tasks, address failed task in follow-up.
```

### Merge Conflicts

If merging parallel branches causes conflicts:

```markdown
❌ Merge Conflict - Tasks Modified Same Files

**Conflict**: {file-path}
**Branches**: {branch-1}, {branch-2}

This should not happen if task independence was verified correctly.

## Resolution

1. Review plan's file dependencies
2. Check if tasks truly independent
3. Resolve conflict manually:
   ```bash
   git checkout {feature-branch}
   git merge {task-branch}
   # Resolve conflicts in editor
   git add {conflicted-files}
   git commit
   ```

4. Update plan to mark tasks as dependent (sequential) not parallel
```

### Worktree Creation Failure

If worktree creation fails:

```markdown
❌ Worktree Creation Failed

**Error**: {error-message}

Common causes:
- Path already exists: `rm -rf {path}`
- Branch already exists: `git branch -D {branch}`
- Uncommitted changes: `git stash`

After fixing, re-run `/execute`
```

## Important Notes

- **Automatic orchestration** - Reads plan strategies, executes accordingly
- **Git-spice stacking** - All work stacks on feature branch
- **Worktree isolation** - Parallel tasks cannot interfere
- **Mandatory patterns** - All agents enforce BigNight.Party patterns
- **Quality gates** - Tests and linting after every task
- **Continuous commits** - Small, focused commits throughout

Now execute the plan from: {plan-path}
