#!/usr/bin/env tsx
/**
 * spice-train.ts — use git-spice for sync/restack; merge PRs bottom→top with gh
 *
 * Usage:
 *   tsx scripts/spice-train.ts [options] [trunk-branch]
 *   ./scripts/spice-train.ts [options] [trunk-branch]  # if executable
 *
 * Options:
 *   --dry-run      Preview what would happen without making changes
 *   --no-auto      Merge immediately instead of waiting for CI
 *   --squash       Use squash merge instead of rebase
 *   --merge        Use merge commit instead of rebase
 *   --help         Show this help message
 *
 * Examples:
 *   tsx scripts/spice-train.ts --dry-run              # Preview with defaults
 *   tsx scripts/spice-train.ts                        # Run merge train to main
 *   tsx scripts/spice-train.ts --squash develop       # Squash merge to develop
 *
 * Safety:
 *   - Requires clean working tree
 *   - Shows preview of all PRs before merging
 *   - Prompts for confirmation (unless --dry-run)
 *   - Checks PR status and updates bases as needed
 */

import { execSync } from "node:child_process";
import * as readline from "node:readline/promises";

// --- Types -----------------------------------------------------------------
interface Config {
  trunk: string;
  auto: boolean;
  mode: "rebase" | "squash" | "merge";
  dryRun: boolean;
}

interface Branch {
  name: string;
  parent: string;
}

interface PRInfo {
  number: number;
  state: string;
  baseRefName: string;
}

// --- Helpers ---------------------------------------------------------------
function exec(cmd: string, options: { silent?: boolean } = {}): string {
  try {
    const result = execSync(cmd, {
      encoding: "utf8",
      stdio: options.silent ? "pipe" : "inherit",
    });
    return result ? result.trim() : "";
  } catch (error) {
    if (!options.silent) throw error;
    return "";
  }
}

function execQuiet(cmd: string): string {
  return exec(cmd, { silent: true });
}

function getUpstreamOf(branch: string): string | null {
  const upstream = execQuiet(
    `git rev-parse --abbrev-ref --symbolic-full-name "${branch}@{upstream}" 2>/dev/null`
  );
  if (!upstream) return null;

  // Strip remote prefix only if it exists (e.g., "origin/main" → "main")
  // But keep local branch names as-is (e.g., "task-1-1-schema" stays as-is)
  if (upstream.startsWith("origin/")) {
    return upstream.replace(/^origin\//, "");
  }

  return upstream;
}

function buildStackBottomToTop(topBranch: string, trunk: string): Branch[] {
  const stack: Branch[] = [];
  let current = topBranch;

  while (true) {
    const parent = getUpstreamOf(current);
    if (!parent) {
      throw new Error(`Branch ${current} has no upstream parent set`);
    }

    stack.unshift({ name: current, parent });

    if (parent === trunk) {
      break;
    }

    current = parent;
  }

  return stack;
}

function getPRInfo(branch: string): PRInfo | null {
  try {
    const json = execQuiet(
      `gh pr view --head "${branch}" --json number,state,baseRefName 2>/dev/null`
    );
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getAllPRInfo(branches: string[]): Map<string, PRInfo | null> {
  const prMap = new Map<string, PRInfo | null>();

  // Fetch all PRs in one batch query for better performance
  try {
    const branchList = branches.map((b) => `head:${b}`).join(" ");
    const json = execQuiet(
      `gh pr list --json number,headRefName,state,baseRefName --search "${branchList}"`
    );
    if (json) {
      const prs = JSON.parse(json) as Array<PRInfo & { headRefName: string }>;
      for (const pr of prs) {
        prMap.set(pr.headRefName, pr);
      }
    }
  } catch (error) {
    // Fallback to individual queries if batch fails
    console.log("  (Batch PR lookup failed, using slower individual queries...)");
  }

  // Fill in any missing branches with individual queries or null
  for (const branch of branches) {
    if (!prMap.has(branch)) {
      prMap.set(branch, getPRInfo(branch));
    }
  }

  return prMap;
}

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await rl.question(`${message} (y/N): `);
  rl.close();

  return answer.toLowerCase() === "y";
}

// --- Main Functions --------------------------------------------------------
async function mergePR(branch: string, parent: string, config: Config): Promise<void> {
  // Check if PR exists
  const prInfo = getPRInfo(branch);

  if (!prInfo) {
    if (config.dryRun) {
      console.log(`  [DRY-RUN] Would create PR: ${branch} → ${parent}`);
      return;
    }
    console.log(`  Creating PR: ${branch} → ${parent}`);
    exec(`gh pr create --head "${branch}" --base "${parent}" --title "${branch}" --fill`);
  } else {
    // Check if base needs updating
    if (prInfo.baseRefName !== parent) {
      if (config.dryRun) {
        console.log(
          `  [DRY-RUN] Would update PR base: ${branch} (${prInfo.baseRefName} → ${parent})`
        );
        return;
      }
      console.log(`  Updating PR base: ${branch} (${prInfo.baseRefName} → ${parent})`);
      exec(`gh pr edit --head "${branch}" --base "${parent}"`);
    }
  }

  // Merge PR
  const autoFlag = config.auto ? "--auto" : "";
  const mergeCmd = `gh pr merge ${autoFlag} --${config.mode} --match-head "${branch}"`;

  if (config.dryRun) {
    console.log(`  [DRY-RUN] Would merge: ${mergeCmd}`);
  } else {
    console.log(`  Merging: ${branch}`);
    exec(mergeCmd);
  }
}

function checkPrerequisites(): void {
  // Check GitHub auth
  try {
    execQuiet("gh auth status");
  } catch {
    console.error("✖ GitHub CLI not authenticated. Run: gh auth login");
    process.exit(1);
  }

  // Check if in git repo
  try {
    execQuiet("git rev-parse --show-toplevel");
  } catch {
    console.error("✖ Not in a git repository");
    process.exit(1);
  }

  // Check for clean working tree
  const status = execQuiet("git status --porcelain");
  if (status) {
    console.error("✖ Dirty tree; commit or stash changes first.");
    exec("git status --short");
    process.exit(1);
  }

  // Check not detached HEAD
  const currentBranch = execQuiet("git branch --show-current");
  if (!currentBranch) {
    console.error("✖ Detached HEAD - checkout a branch first");
    process.exit(1);
  }

  console.log("✓ Prerequisites passed");
  console.log("");
}

function showHeader(config: Config): void {
  console.log("════════════════════════════════════════════════════════════════════════════");
  console.log("  Git-Spice Merge Train");
  console.log("════════════════════════════════════════════════════════════════════════════");
  if (config.dryRun) {
    console.log("  MODE: DRY-RUN (no destructive operations)");
  }
  console.log(`  Trunk: ${config.trunk}`);
  console.log(`  Merge mode: ${config.mode}`);
  console.log(`  Auto-merge: ${config.auto ? "yes (wait for CI)" : "no (immediate)"}`);
  console.log("════════════════════════════════════════════════════════════════════════════");
  console.log("");
}

function showStackPreview(stack: Branch[], trunk: string): void {
  console.log("════════════════════════════════════════════════════════════════════════════");
  console.log(`  Stack Preview (${stack.length} branches, bottom → top → ${trunk})`);
  console.log("════════════════════════════════════════════════════════════════════════════");
  console.log("");
  console.log("  Fetching PR information...");

  // Batch fetch all PR info for better performance
  const branchNames = stack.map((b) => b.name);
  const prInfoMap = getAllPRInfo(branchNames);

  console.log("");

  for (let i = 0; i < stack.length; i++) {
    const { name, parent } = stack[i];
    const prInfo = prInfoMap.get(name);

    console.log(`  ${i + 1}. ${name} → ${parent}`);

    if (prInfo) {
      let baseStatus = "";
      if (prInfo.baseRefName !== parent) {
        baseStatus = ` (⚠️  base is ${prInfo.baseRefName}, will update to ${parent})`;
      }
      console.log(`     PR #${prInfo.number} [${prInfo.state}]${baseStatus}`);
    } else {
      console.log("     ⚠️  No PR exists (will be created)");
    }
  }

  console.log("════════════════════════════════════════════════════════════════════════════");
  console.log("");
}

async function syncAndRestack(config: Config): Promise<void> {
  if (config.dryRun) {
    console.log("→ [DRY-RUN] Would run: gs repo sync --restack");
    console.log("→ [DRY-RUN] Would run: gs stack restack");
  } else {
    console.log("→ Syncing with trunk and restacking...");
    try {
      exec("gs repo sync --restack");
      exec("gs stack restack");
      console.log("✓ Sync complete");
    } catch {
      console.error("✖ Failed to sync/restack. Check for conflicts.");
      process.exit(1);
    }
  }
  console.log("");
}

async function mergeStack(stack: Branch[], config: Config): Promise<void> {
  console.log("→ Starting merge train...");
  console.log("");

  for (let i = 0; i < stack.length; i++) {
    const { name, parent } = stack[i];
    console.log(`[${i + 1}/${stack.length}] Processing: ${name} → ${parent}`);
    await mergePR(name, parent, config);
    console.log("");
  }
}

async function finalCleanup(config: Config): Promise<void> {
  if (config.dryRun) {
    console.log("→ [DRY-RUN] Would run: gs repo sync");
  } else {
    console.log("→ Final sync to clean up merged branches...");
    exec("gs repo sync");
    console.log("✓ Cleanup complete");
  }
  console.log("");
}

function showCompletion(config: Config): void {
  console.log("════════════════════════════════════════════════════════════════════════════");
  if (config.dryRun) {
    console.log("  ✓ Dry-run complete (no changes made)");
  } else {
    console.log("  ✓ Merge train complete");
  }
  console.log("════════════════════════════════════════════════════════════════════════════");
}

function showHelp(): void {
  const helpText = `
Git-Spice Merge Train

Usage:
  tsx scripts/spice-train.ts [options] [trunk-branch]

Options:
  --dry-run      Preview what would happen without making changes
  --no-auto      Merge immediately instead of waiting for CI
  --squash       Use squash merge instead of rebase
  --merge        Use merge commit instead of rebase
  --help         Show this help message

Examples:
  tsx scripts/spice-train.ts --dry-run              # Preview with defaults
  tsx scripts/spice-train.ts                        # Run merge train to main
  tsx scripts/spice-train.ts --squash develop       # Squash merge to develop
  tsx scripts/spice-train.ts --no-auto              # Merge without waiting for CI

Safety:
  - Requires clean working tree
  - Shows preview of all PRs before merging
  - Prompts for confirmation (unless --dry-run)
  - Checks PR status and updates bases as needed
`;
  console.log(helpText);
}

// --- Main ------------------------------------------------------------------
async function main() {
  // Parse arguments
  const config: Config = {
    trunk: "main",
    auto: true,
    mode: "rebase",
    dryRun: false,
  };

  const args = process.argv.slice(2);

  for (const arg of args) {
    switch (arg) {
      case "--help":
      case "-h":
        showHelp();
        process.exit(0);
      case "--dry-run":
        config.dryRun = true;
        break;
      case "--no-auto":
        config.auto = false;
        break;
      case "--squash":
        config.mode = "squash";
        break;
      case "--merge":
        config.mode = "merge";
        break;
      default:
        if (arg.startsWith("-")) {
          console.error(`Unknown option: ${arg}`);
          console.error("Run with --help for usage");
          process.exit(1);
        }
        config.trunk = arg;
    }
  }

  // Show header
  showHeader(config);

  // Check prerequisites
  console.log("→ Checking prerequisites...");
  checkPrerequisites();

  // Sync and restack
  await syncAndRestack(config);

  // Build stack
  const currentBranch = execQuiet("git branch --show-current");
  const stack = buildStackBottomToTop(currentBranch, config.trunk);

  // Show preview
  showStackPreview(stack, config.trunk);

  // Confirm (unless dry-run)
  if (!config.dryRun) {
    const proceed = await confirm("Proceed with merge train?");
    if (!proceed) {
      console.log("✖ Aborted by user");
      process.exit(0);
    }
    console.log("");
  }

  // Merge PRs
  await mergeStack(stack, config);

  // Final cleanup
  await finalCleanup(config);

  // Show completion
  showCompletion(config);
}

main().catch((error) => {
  console.error("✖ Fatal error:", error.message);
  process.exit(1);
});
