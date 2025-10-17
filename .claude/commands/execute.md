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

**Use `subagent-driven-development` skill in current branch:**

1. Announce: "I'm using the Subagent-Driven Development skill to execute Phase {N}: {phase-name}"

2. The skill will:
   - Spawn fresh subagent per task
   - Each subagent implements autonomously
   - Code review after each task
   - Continuous commits

3. Monitor progress and handle any issues

4. After phase completes, verify:
   ```bash
   pnpm biome check
   pnpm test
   git log --oneline -10  # Review commits
   ```

#### Parallel Phase Strategy

For phases where tasks are independent:

**Create worktrees and spawn parallel agents:**

1. **Verify independence** (from plan's dependency analysis):
   - Confirm no file overlaps between tasks
   - Check dependencies are satisfied

2. **Create worktree per task**:

   For each task in parallel phase:
   ```bash
   git worktree add ../worktree-{task-id} -b {task-id}
   ```

   Store worktree info:
   ```javascript
   worktrees = {
     'task-3-magic-link-service': {
       path: '../worktree-task-3-magic-link-service',
       branch: 'task-3-magic-link-service'
     },
     'task-4-email-service': {
       path: '../worktree-task-4-email-service',
       branch: 'task-4-email-service'
     }
   }
   ```

3. **Setup each worktree**:
   ```bash
   cd {worktree-path}
   pnpm install
   pnpm test  # Verify baseline
   ```

4. **Spawn parallel agents** (CRITICAL: Single message with multiple Task tools):

   For each task, spawn agent with this prompt:

   ```
   ROLE: You are implementing Task {task-id} for BigNight.Party.

   TASK: {task-name}
   WORKTREE: {worktree-path}
   BRANCH: {branch-name}

   CRITICAL - WORKTREE ISOLATION:
   You are working in an isolated worktree at: {worktree-path}

   1. ALL operations happen in worktree:
      cd {worktree-path}

   2. Read plan from MAIN repository:
      /Users/drewritter/projects/bignight.party/{plan-path}

   3. Find your task: "Task {task-id}: {task-name}"

   4. You are on branch: {branch-name}

   5. DO NOT touch main repository

   IMPLEMENTATION:

   Use the `subagent-driven-development` skill to implement this ONE task.

   The task specifies:
   - Files to modify: {files}
   - Acceptance criteria: {criteria}
   - Implementation steps: {steps}

   Follow BigNight.Party mandatory patterns:
   - Server actions: Use next-safe-action ONLY
   - Discriminated unions: Use ts-pattern with .exhaustive()
   - Layer boundaries: Models (Prisma) → Services → Actions
   - No Prisma imports outside models layer

   Quality gates (in worktree):
   ```bash
   cd {worktree-path}
   pnpm biome check --write .
   pnpm test
   ```

   Commit after task completes:
   ```bash
   cd {worktree-path}
   git add --all
   git commit -m "[{task-id}] {task-name}"
   ```

   CRITICAL:
   - ✅ Stay in worktree directory
   - ✅ Implement ONLY this task
   - ✅ Follow mandatory patterns
   - ❌ DO NOT touch other files

   Execute: Task {task-id}
   ```

5. **Monitor parallel execution**:
   - Track progress of each agent
   - Watch for errors or blockers
   - Note when agents complete

6. **Verify each worktree after completion**:
   ```bash
   cd {worktree-path}
   pnpm test  # Must pass
   pnpm biome check  # Must be clean
   git log --oneline  # Review commits
   ```

7. **Merge worktree branches into feature branch**:

   For each completed worktree:
   ```bash
   # Switch to main repository
   cd /Users/drewritter/projects/bignight.party

   # Merge task branch into feature branch
   git checkout {feature-branch}
   git merge --no-ff {task-branch} -m "Merge task: {task-name}"
   ```

8. **Cleanup worktrees**:
   ```bash
   git worktree remove {worktree-path}
   ```

9. **Verify merged result**:
   ```bash
   cd /Users/drewritter/projects/bignight.party
   pnpm test
   pnpm biome check
   ```

### Step 4: Verify Completion

After all phases execute successfully:

**Use the `verification-before-completion` skill:**

This skill enforces verification BEFORE claiming work is done.

**Required verifications:**
```bash
# Run full test suite
pnpm test

# Run linting
pnpm biome check

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
**Worktree**: {worktree-path}
**Error**: {error-message}

**Successful Tasks**: {list}

## Resolution Options

### Option A: Fix in Worktree
```bash
cd {worktree-path}
# Debug and fix issue
pnpm test
git add --all
git commit -m "[{task-id}] Fix: {description}"
```

### Option B: Restart Failed Agent
Delete worktree, recreate, spawn new agent for this task only.

### Option C: Continue Without Failed Task
Merge successful tasks, address failed task separately.
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
