---
description: Execute implementation plan with automatic sequential/parallel orchestration using git-spice and worktrees
---

You are executing an implementation plan for BigNight.Party.

## Required Skills

Before starting, you MUST read these skills:
- `using-git-spice` - For managing stacked branches (~/.claude/skills/using-git-spice/SKILL.md)
- `using-git-worktrees` - For parallel task isolation (superpowers skill)
- `requesting-code-review` - For phase review gates (superpowers skill)
- `verification-before-completion` - For final verification (superpowers skill)
- `finishing-a-development-branch` - For completion workflow (superpowers skill)

## Input

User will provide: `/execute {plan-path}`

Example: `/execute @specs/features/magic-link-auth/plan.md`

## Workflow

### Step 0: Check for Existing Work

Before starting or resuming, check current state:

```bash
# Check current branch
git branch --show-current

# Check recent commits for task markers
git log --oneline --grep="\[Task" -20

# Check for existing stacked branches
gs ls
gs branch tree

# Check working directory status
git status
```

**If work already exists:**

1. **Identify completed tasks:**
   - Look for commits with `[Task X.Y]` pattern in git log
   - Check `gs ls` and `gs branch tree` for task branches
   - Match branch names to plan tasks (e.g., `task-2-1-auth-models`)
   - Determine which phase and task to resume from

2. **Resume strategy:**
   - Sequential phases: Resume from next incomplete task in current phase
   - Parallel phases: Resume incomplete tasks only
   - If phase complete: Move to next phase

3. **Report resume point:**
   ```
   📍 Resuming execution from existing work

   **Current branch**: {branch-name}
   **Completed tasks**: Task 1.1, Task 1.2
   **Resuming at**: Task 1.3 - {task-name}
   **Remaining**: {count} tasks in {phase-count} phases
   ```

4. **Skip to Step 3** (Execute Phases) at the resume point

**If no existing work:**
- Continue to Step 1 (Read and Parse Plan)

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

**Skip this step if resuming from existing work** (Step 0 detected existing branches).

Create a new git-spice branch for this feature:

```bash
gs branch create
```

Prompt for:
- **Branch name**: `feature/{feature-name-from-plan}`
- **Description**: Feature overview from plan

This branch will be the integration point for all work.

### Step 3: Execute Phases

**If resuming:** Start from the incomplete phase/task identified in Step 0.

For each phase in the plan, execute based on strategy:

#### Sequential Phase Strategy

For phases where tasks must run in order:

**Execute tasks sequentially with stacked branches:**

1. For each task in the phase:

   a. **Spawn subagent for task implementation** (use Task tool):

   ```
   ROLE: You are implementing Task {task-id} for BigNight.Party.

   TASK: {task-name}
   CURRENT BRANCH: {current-branch}

   CRITICAL - CONTEXT MANAGEMENT:
   You are a subagent with isolated context. Complete this task independently.

   IMPLEMENTATION:

   1. Verify you're on the correct branch:
   ```bash
   git branch --show-current  # Should be {current-branch}
   ```

   2. Read task details from: /Users/drewritter/projects/bignight.party/{plan-path}
      Find: "Task {task-id}: {task-name}"

   3. Implement according to:
      - Files specified in task
      - Acceptance criteria in task
      - BigNight.Party mandatory patterns (see @docs/constitutions/current/)

   4. Quality checks (MUST run all):
   ```bash
   pnpm format
   pnpm lint
   pnpm test
   ```

   5. Stage changes (but DO NOT commit):
   ```bash
   git add --all
   git status  # Verify changes staged
   ```

   6. Report completion with:
      - Summary of changes
      - Files modified
      - Test results
      - Any issues encountered

   CRITICAL:
   - ✅ Stay on current branch
   - ✅ Run ALL quality checks
   - ✅ Stage changes with git add
   - ✅ DO NOT commit (orchestrator will use gs branch create)
   - ✅ Follow mandatory patterns
   ```

   b. **Wait for subagent completion**, then verify:
   ```bash
   git status  # Confirm changes staged
   pnpm test   # Verify tests pass
   ```

   c. **Create branch and commit with gs branch create:**
   ```bash
   gs branch create task-{task-id}-{short-name}
   ```

   When prompted for commit message, use:
   ```
   [Task {task-id}] {task-name}

   {Brief summary of changes from subagent report}

   Acceptance criteria met:
   - {criterion 1}
   - {criterion 2}
   ```

   This will:
   - Create a new branch `task-{task-id}-{short-name}`
   - Commit all staged changes
   - Stack the branch on current branch automatically

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

**Use git worktrees for true parallel isolation (per using-git-worktrees skill):**

1. **Verify independence** (from plan's dependency analysis):
   - Confirm no file overlaps between tasks
   - Check dependencies are satisfied

2. **For each parallel task, create worktree on feature branch**:

   ```bash
   # Create worktree on feature branch (do NOT create task branch yet)
   git worktree add ./.worktrees/task-{task-id} {feature-branch}
   # Example: git worktree add ./.worktrees/task-2-1 feature/authentication
   ```

   This creates:
   - A worktree at `./.worktrees/task-{task-id}` checked out to the feature branch
   - Task branch will be created later with `gs branch create` after work is done

   Store worktree info:
   ```javascript
   taskWorktrees = {
     'task-3-1': {path: './.worktrees/task-3-1'},
     'task-3-2': {path: './.worktrees/task-3-2'}
   }
   ```

   Note: `.worktrees/` is gitignored to prevent contamination.

3. **Spawn parallel agents** (CRITICAL: Single message with multiple Task tools):

   For each task, spawn agent with this prompt:

   ```
   ROLE: You are implementing Task {task-id} for BigNight.Party.

   TASK: {task-name}
   WORKTREE: {worktree-path}
   FEATURE BRANCH: {feature-branch}

   CRITICAL - WORKTREE ISOLATION:
   You are working in an isolated git worktree. This means:
   - You have your own working directory: {worktree-path}
   - Other parallel tasks cannot interfere with your files
   - You must cd into your worktree before starting
   - When done, report completion and do NOT clean up worktree

   SETUP:
   ```bash
   cd {worktree-path}
   git branch --show-current  # Should be {feature-branch}
   pwd  # Confirm you're in worktree directory
   ```

   IMPLEMENTATION:

   1. Read plan from: {plan-path}
      Find: "Task {task-id}: {task-name}"

   2. Implement according to:
      - Files specified in task
      - Acceptance criteria in task
      - BigNight.Party mandatory patterns (see @docs/constitutions/current/)

   3. Follow mandatory patterns:
      - Server actions: Use next-safe-action ONLY
      - Discriminated unions: Use ts-pattern with .exhaustive()
      - Layer boundaries: Models (Prisma) → Services → Actions
      - No Prisma imports outside models layer

   4. Quality checks (MUST run all):
   ```bash
   pnpm format
   pnpm lint
   pnpm test
   ```

   5. Stage changes (but DO NOT commit):
   ```bash
   git add --all
   git status  # Verify changes staged
   ```

   6. Create branch and commit with gs branch create:
   ```bash
   gs branch create task-{task-id}-{short-name}
   ```

   When prompted for commit message, use:
   ```
   [Task {task-id}] {task-name}

   {Brief summary of changes}

   Acceptance criteria met:
   - {criterion 1}
   - {criterion 2}
   ```

   This will:
   - Create a new branch `task-{task-id}-{short-name}`
   - Commit all staged changes
   - Stack the branch on feature branch automatically

   7. Report completion with:
      - Summary of changes
      - Files modified
      - Test results
      - Branch name created
      - Worktree path for cleanup

   CRITICAL:
   - ✅ cd into worktree first
   - ✅ Stay in worktree directory
   - ✅ Implement ONLY this task
   - ✅ Run ALL quality checks
   - ✅ Stage changes with git add
   - ✅ Use gs branch create (NOT git commit)
   - ❌ DO NOT manually commit (use gs branch create)
   - ❌ DO NOT clean up worktree (orchestrator does this)
   - ❌ DO NOT touch other task files
   ```

4. **Wait for all parallel agents to complete**
   (Agents work independently, orchestrator collects results)

5. **After ALL parallel tasks complete, verify each**:
   ```bash
   # For each task worktree
   cd {worktree-path}
   pnpm test  # Must pass
   git log --oneline -1  # Review commit (should be [Task X.Y] message)
   git branch --show-current  # Should be task-{task-id}-{short-name}
   cd -  # Return to original directory
   ```

   Note: Branches are already tracked by git-spice since `gs branch create` was used.

6. **Bring branches home and cleanup worktrees**:
   ```bash
   # For each task worktree:
   # 1. Detach HEAD to release the branch reference
   git -C {worktree-path} switch --detach

   # 2. Now safely remove the worktree
   git worktree remove {worktree-path}
   ```

   Why detach first: When `gs branch create` runs in a worktree, that branch becomes
   "checked out" in that worktree. Detaching releases the ref so the branch is
   accessible in the parent directory and the worktree can be cleanly removed.

   Note: Commits are already on branches (tracked by git-spice), safe to remove worktrees.
   The `.worktrees/` directory itself persists (gitignored) for future runs.

7. **Verify git-spice stack**:

   Check that all task branches are properly tracked and stacked:
   ```bash
   git checkout {feature-branch}
   gs log short     # Verify all task branches visible
   gs repo restack  # Restack if needed (shouldn't be necessary)
   ```

   Expected output (all tasks stacked on feature branch):
   ```
   ┌── task-2-3-magic-link (on feature/authentication)
   ├── task-2-2-email-service (on feature/authentication)
   ├── task-2-1-auth-models (on feature/authentication)
   └── feature/authentication
       main
   ```

   Note: Since each task used `gs branch create` from the feature branch,
   all tasks are automatically stacked on the feature branch in parallel.

8. **After verification, use `requesting-code-review` skill:**

   Dispatch code-reviewer subagent to review the entire phase:
   - All task branches in this phase
   - Check for integration issues
   - Verify patterns followed
   - Ensure no file conflicts
   - Review quality and consistency

9. **Address review feedback if needed**

10. **Verify integration** (after review passes):
    ```bash
    git checkout {feature-branch}

    # Run tests on integrated feature branch
    pnpm test
    pnpm lint
    pnpm build
    ```

11. Phase is complete when code review passes and integration verified

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
   - Submit stack as PRs: `gs stack submit` (per using-git-spice skill)
   - Continue with dependent feature: `gs branch create`
   - Mark complete and sync: `gs repo sync`

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
gs log long               # View all branches and commits in stack
git log --oneline {feature-branch}
git diff main..{feature-branch}
```

### Submit for Review
```bash
gs stack submit  # Submits entire stack as PRs (per using-git-spice skill)
```

### Or Continue with Dependent Feature
```bash
gs branch create  # Creates new branch stacked on current
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
- Path already exists: `rm -rf {path}` and `git worktree prune`
- Uncommitted changes on feature branch: `git stash`
- Feature branch doesn't exist: Check `gs ls` for branch name

After fixing, re-run `/execute`
```

## Important Notes

- **Skill-driven execution** - Uses using-git-spice, using-git-worktrees, and other superpowers skills
- **Automatic orchestration** - Reads plan strategies, executes accordingly
- **Git-spice stacking** - All task branches stack on feature branch (per using-git-spice skill)
- **Worktree isolation** - Parallel tasks run in separate worktrees (per using-git-worktrees skill)
- **Context management** - Each task runs in isolated subagent to avoid token bloat
- **Mandatory patterns** - All agents enforce BigNight.Party patterns
- **Quality gates** - Tests and linting after every task, code review after every phase
- **Continuous commits** - Small, focused commits with [Task X.Y] markers throughout

Now execute the plan from: {plan-path}
