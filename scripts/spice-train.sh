#!/usr/bin/env bash
# spice-train.sh — use git-spice for sync/restack; merge PRs bottom→top with gh (rebase)
#
# Usage:
#   ./scripts/spice-train.sh [options] [trunk-branch]
#
# Options:
#   --dry-run      Preview what would happen without making changes
#   --no-auto      Merge immediately instead of waiting for CI
#   --squash       Use squash merge instead of rebase
#   --merge        Use merge commit instead of rebase
#   --help         Show this help message
#
# Examples:
#   ./scripts/spice-train.sh --dry-run              # Preview with defaults
#   ./scripts/spice-train.sh                        # Run merge train to main
#   ./scripts/spice-train.sh --squash develop       # Squash merge to develop
#   ./scripts/spice-train.sh --no-auto              # Merge without waiting for CI
#
# Safety:
#   - Requires clean working tree
#   - Shows preview of all PRs before merging
#   - Prompts for confirmation (unless --dry-run)
#   - Checks PR status and updates bases as needed
#
set -euo pipefail

# --- Configuration ---------------------------------------------------------
TRUNK="main"  # default trunk branch
AUTO=1        # 1 = wait for CI (--auto), 0 = merge immediately
MODE="rebase" # rebase|squash|merge
DRY_RUN=0     # 1 = preview only, 0 = execute

# Parse flags
while [[ $# -gt 0 ]]; do
    case "$1" in
        --help|-h)
            grep '^#' "$0" | sed 's/^# \?//'
            exit 0
            ;;
        --dry-run)
            DRY_RUN=1
            shift
            ;;
        --no-auto)
            AUTO=0
            shift
            ;;
        --squash)
            MODE="squash"
            shift
            ;;
        --merge)
            MODE="merge"
            shift
            ;;
        -*)
            echo "Unknown option: $1"
            echo "Run with --help for usage"
            exit 1
            ;;
        *)
            TRUNK="$1"
            shift
            ;;
    esac
done

# --- helpers ---------------------------------------------------------------
upstream_of() { git rev-parse --abbrev-ref --symbolic-full-name "$1@{upstream}" 2>/dev/null || true; }
build_stack_bottom_to_top() {
    local top="$1" cur="$top" arr=() up
    while :; do
        arr+=("$cur")
        up="$(upstream_of "$cur")"
        [[ -z "$up" || "$up" == "$TRUNK" ]] && break
        cur="$up"
    done
    for ((i = 0, j = ${#arr[@]} - 1; i < j; i++, j--)); do
        tmp=${arr[i]}
        arr[i]=${arr[j]}
        arr[j]=$tmp
    done
    printf "%s\n" "${arr[@]}"
}
merge_pr() {
    local br="$1" parent="$2"

    # Check if PR exists
    if ! gh pr view --head "$br" >/dev/null 2>&1; then
        if [[ $DRY_RUN -eq 1 ]]; then
            echo "  [DRY-RUN] Would create PR: $br → $parent"
            return 0
        fi
        echo "  Creating PR: $br → $parent"
        gh pr create --head "$br" --base "$parent" --title "$br" --fill
    else
        local base
        base="$(gh pr view --head "$br" --json baseRefName -q .baseRefName)"
        if [[ "$base" != "$parent" ]]; then
            if [[ $DRY_RUN -eq 1 ]]; then
                echo "  [DRY-RUN] Would update PR base: $br ($base → $parent)"
                return 0
            fi
            echo "  Updating PR base: $br ($base → $parent)"
            gh pr edit --head "$br" --base "$parent"
        fi
    fi

    # Merge PR
    local auto_flag=""
    [[ $AUTO -eq 1 ]] && auto_flag="--auto"

    if [[ $DRY_RUN -eq 1 ]]; then
        echo "  [DRY-RUN] Would merge: gh pr merge $auto_flag --$MODE --match-head $br"
    else
        echo "  Merging: $br"
        gh pr merge $auto_flag --"$MODE" --match-head "$br"
    fi
}

# --- preflight -------------------------------------------------------------
echo "════════════════════════════════════════════════════════════════════════════"
echo "  Git-Spice Merge Train"
echo "════════════════════════════════════════════════════════════════════════════"
[[ $DRY_RUN -eq 1 ]] && echo "  MODE: DRY-RUN (no destructive operations)"
echo "  Trunk: $TRUNK"
echo "  Merge mode: $MODE"
echo "  Auto-merge: $([ $AUTO -eq 1 ] && echo 'yes (wait for CI)' || echo 'no (immediate)')"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

echo "→ Checking prerequisites..."
gh auth status >/dev/null || {
    echo "✖ GitHub CLI not authenticated. Run: gh auth login"
    exit 1
}

git rev-parse --show-toplevel >/dev/null || {
    echo "✖ Not in a git repository"
    exit 1
}

[[ -z "$(git status --porcelain)" ]] || {
    echo "✖ Dirty tree; commit or stash changes first."
    git status --short
    exit 1
}

CURRENT="$(git branch --show-current)"
[[ -n "$CURRENT" ]] || {
    echo "✖ Detached HEAD - checkout a branch first"
    exit 1
}

echo "✓ Prerequisites passed"
echo ""

# --- 1) Sync & restack with git-spice -------------------------------------
if [[ $DRY_RUN -eq 1 ]]; then
    echo "→ [DRY-RUN] Would run: gs repo sync --restack"
    echo "→ [DRY-RUN] Would run: gs stack restack"
else
    echo "→ Syncing with trunk and restacking..."
    gs repo sync --restack || {
        echo "✖ Failed to sync/restack. Check for conflicts."
        exit 1
    }
    gs stack restack || {
        echo "✖ Failed to restack. Check for conflicts."
        exit 1
    }
    echo "✓ Sync complete"
fi
echo ""

# --- 2) Build stack and show preview --------------------------------------
mapfile -t STACK < <(build_stack_bottom_to_top "$CURRENT")

echo "════════════════════════════════════════════════════════════════════════════"
echo "  Stack Preview (${#STACK[@]} branches, bottom → top → $TRUNK)"
echo "════════════════════════════════════════════════════════════════════════════"

for i in "${!STACK[@]}"; do
    br="${STACK[$i]}"
    parent="$(upstream_of "$br")"
    [[ -z "$parent" ]] && {
        echo "✖ $br has no upstream parent set"
        exit 1
    }

    # Check if PR exists
    if gh pr view --head "$br" >/dev/null 2>&1; then
        pr_num="$(gh pr view --head "$br" --json number -q .number)"
        pr_status="$(gh pr view --head "$br" --json state -q .state)"
        pr_base="$(gh pr view --head "$br" --json baseRefName -q .baseRefName)"
        base_status=""
        [[ "$pr_base" != "$parent" ]] && base_status=" (⚠️  base is $pr_base, will update to $parent)"
        echo "  $((i+1)). $br → $parent"
        echo "     PR #$pr_num [$pr_status]$base_status"
    else
        echo "  $((i+1)). $br → $parent"
        echo "     ⚠️  No PR exists (will be created)"
    fi
done

echo "════════════════════════════════════════════════════════════════════════════"
echo ""

# --- 3) Confirmation prompt ------------------------------------------------
if [[ $DRY_RUN -ne 1 ]]; then
    read -p "Proceed with merge train? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "✖ Aborted by user"
        exit 0
    fi
    echo ""
fi

# --- 4) Merge PRs bottom→top -----------------------------------------------
echo "→ Starting merge train..."
echo ""

for i in "${!STACK[@]}"; do
    br="${STACK[$i]}"
    parent="$(upstream_of "$br")"
    echo "[$((i+1))/${#STACK[@]}] Processing: $br → $parent"
    merge_pr "$br" "$parent"
    echo ""
done

# --- 5) Final sync to prune merged branches -------------------------------
if [[ $DRY_RUN -eq 1 ]]; then
    echo "→ [DRY-RUN] Would run: gs repo sync"
else
    echo "→ Final sync to clean up merged branches..."
    gs repo sync
    echo "✓ Cleanup complete"
fi
echo ""

echo "════════════════════════════════════════════════════════════════════════════"
if [[ $DRY_RUN -eq 1 ]]; then
    echo "  ✓ Dry-run complete (no changes made)"
else
    echo "  ✓ Merge train complete"
fi
echo "════════════════════════════════════════════════════════════════════════════"
