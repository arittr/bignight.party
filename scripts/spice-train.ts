#!/usr/bin/env tsx

/** biome-ignore-all lint/suspicious/noConsole: it's a console tool */
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
  } catch (_error) {}

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
function ensurePRExists(
  branch: string,
  parent: string,
  prInfo: PRInfo | null,
  config: Config
): void {
  if (config.dryRun) return;

  if (!prInfo) {
    exec(`gh pr create --head "${branch}" --base "${parent}" --title "${branch}" --fill`);
  } else if (prInfo.baseRefName !== parent) {
    exec(`gh pr edit --head "${branch}" --base "${parent}"`);
  }
}

function executeMerge(branch: string, config: Config): void {
  if (config.dryRun) return;

  const autoFlag = config.auto ? "--auto" : "";
  const mergeCmd = `gh pr merge ${autoFlag} --${config.mode} --match-head "${branch}"`;
  exec(mergeCmd);
}

async function mergePR(branch: string, parent: string, config: Config): Promise<void> {
  const prInfo = getPRInfo(branch);
  ensurePRExists(branch, parent, prInfo, config);
  executeMerge(branch, config);
}

function checkPrerequisites(): void {
  // Check GitHub auth
  try {
    execQuiet("gh auth status");
  } catch {
    console.error("❌ GitHub CLI not authenticated. Run: gh auth login");
    process.exit(1);
  }

  // Check if in git repo
  try {
    execQuiet("git rev-parse --show-toplevel");
  } catch {
    console.error("❌ Not in a git repository");
    process.exit(1);
  }

  // Check for clean working tree
  const status = execQuiet("git status --porcelain");
  if (status) {
    console.error("❌ Working tree has uncommitted changes:");
    exec("git status --short");
    process.exit(1);
  }

  // Check not detached HEAD
  const currentBranch = execQuiet("git branch --show-current");
  if (!currentBranch) {
    console.error("❌ Detached HEAD state. Check out a branch first.");
    process.exit(1);
  }
}

function showHeader(config: Config): void {
  console.log("\n🚂 Git-Spice Merge Train\n");
  if (config.dryRun) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  }
  console.log(`Mode: ${config.mode}`);
  console.log(`Trunk: ${config.trunk}`);
  console.log(`Auto-merge: ${config.auto ? "enabled (wait for CI)" : "disabled (merge now)"}\n`);
}

function showStackPreview(stack: Branch[], _trunk: string): void {
  console.log(`📋 Stack Preview (${stack.length} branches)\n`);

  // Batch fetch all PR info for better performance
  const branchNames = stack.map((b) => b.name);
  const prInfoMap = getAllPRInfo(branchNames);

  for (let i = 0; i < stack.length; i++) {
    const { name, parent } = stack[i];
    const prInfo = prInfoMap.get(name);

    const stepNum = `${i + 1}.`.padEnd(3);

    if (prInfo) {
      let baseStatus = "";
      if (prInfo.baseRefName !== parent) {
        baseStatus = ` (⚠️  base is ${prInfo.baseRefName}, will update to ${parent})`;
      }
      console.log(`${stepNum} ${name} → ${parent}`);
      console.log(`     PR #${prInfo.number} [${prInfo.state}]${baseStatus}`);
    } else {
      console.log(`${stepNum} ${name} → ${parent}`);
      console.log(`     No PR yet (will create)`);
    }
  }
  console.log();
}

async function syncAndRestack(config: Config): Promise<void> {
  if (config.dryRun) {
    console.log("⏭️  Would run: gs repo sync --restack && gs stack restack\n");
  } else {
    console.log("🔄 Syncing and restacking...");
    try {
      exec("gs repo sync --restack");
      exec("gs stack restack");
      console.log("✅ Sync complete\n");
    } catch {
      console.error("❌ Failed to sync/restack");
      process.exit(1);
    }
  }
}

async function mergeStack(stack: Branch[], config: Config): Promise<void> {
  if (!config.dryRun) {
    console.log("🚀 Merging PRs bottom-to-top...\n");
  }

  for (let i = 0; i < stack.length; i++) {
    const { name, parent } = stack[i];
    const stepNum = i + 1;

    if (config.dryRun) {
      console.log(`${stepNum}. Would merge: ${name} → ${parent}`);
    } else {
      console.log(`${stepNum}. Merging: ${name} → ${parent}`);
      await mergePR(name, parent, config);
      console.log(`   ✅ Merged\n`);
    }
  }
}

async function finalCleanup(config: Config): Promise<void> {
  if (config.dryRun) {
    console.log("⏭️  Would run: gs repo sync\n");
  } else {
    console.log("\n🧹 Final sync...");
    exec("gs repo sync");
    console.log("✅ Done\n");
  }
}

function showCompletion(config: Config): void {
  if (config.dryRun) {
    console.log("✅ Dry run complete. No changes were made.");
    console.log("   Remove --dry-run to execute the merge train.");
  } else {
    console.log("🎉 Merge train complete!");
    console.log("   All PRs have been merged bottom-to-top.");
  }
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
    auto: true,
    dryRun: false,
    mode: "rebase",
    trunk: "main",
  };

  const args = process.argv.slice(2);

  for (const arg of args) {
    switch (arg) {
      case "--help":
      case "-h": {
        showHelp();
        process.exit(0);
        break; // Unreachable but satisfies linter
      }
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
          console.error(`❌ Unknown option: ${arg}`);
          console.error("   Run with --help to see available options");
          process.exit(1);
        }
        config.trunk = arg;
    }
  }

  // Show header
  showHeader(config);
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
      process.exit(0);
    }
  }

  // Merge PRs
  await mergeStack(stack, config);

  // Final cleanup
  await finalCleanup(config);

  // Show completion
  showCompletion(config);
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message || error);
  process.exit(1);
});
