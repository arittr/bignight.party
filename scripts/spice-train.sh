#!/usr/bin/env bash
# spice-train.sh — use git-spice for sync/restack; merge PRs bottom→top with gh (rebase)
set -euo pipefail

TRUNK="${1:-main}"
AUTO=1        # set 0 to drop --auto
MODE="rebase" # rebase|squash|merge

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
    # ensure PR exists and points at parent; gs submit already does this, but be resilient
    if ! gh pr view --head "$br" >/dev/null 2>&1; then
        gh pr create --head "$br" --base "$parent" --title "$br" --fill
    else
        local base
        base="$(gh pr view --head "$br" --json baseRefName -q .baseRefName)"
        [[ "$base" != "$parent" ]] && gh pr edit --head "$br" --base "$parent"
    fi
    local auto_flag=""
    [[ $AUTO -eq 1 ]] && auto_flag="--auto"
    gh pr merge $auto_flag --"$MODE" --match-head "$br"
}

# --- preflight -------------------------------------------------------------
gh auth status >/dev/null
git rev-parse --show-toplevel >/dev/null
[[ -z "$(git status --porcelain)" ]] || {
    echo "✖ Dirty tree; commit/stash first."
    exit 1
}

CURRENT="$(git branch --show-current)"
[[ -n "$CURRENT" ]] || {
    echo "✖ Detached HEAD"
    exit 1
}

# --- 1) Sync & restack with git-spice -------------------------------------
# Updates trunk, deletes branches with merged CRs, optional restack (Spice official)  [docs]
gs repo sync --restack # pulls trunk, prunes merged branches, and restacks current stack  #  [oai_citation:2‡Abhinav](https://abhinav.github.io/git-spice/guide/cr/)

# Optional explicit restack of the whole stack (no-op if already clean)     [docs]
gs stack restack # rebases every branch in the stack onto its base                      #  [oai_citation:3‡Abhinav](https://abhinav.github.io/git-spice/cli/reference/)

# --- 2) Merge PRs bottom→top with gh (rebase merges) -----------------------
mapfile -t STACK < <(build_stack_bottom_to_top "$CURRENT")
echo "Stack (bottom→top → $TRUNK): ${STACK[*]}"

for br in "${STACK[@]}"; do
    parent="$(upstream_of "$br")"
    [[ -z "$parent" ]] && {
        echo "✖ $br has no upstream parent set"
        exit 1
    }
    echo "→ Merge $br (base: $parent)"
    merge_pr "$br" "$parent"
done

# --- 3) Final sync to prune anything that just merged ----------------------
gs repo sync # prunes local branches whose PRs just merged; updates trunk again                 #  [oai_citation:4‡Abhinav](https://abhinav.github.io/git-spice/guide/cr/)

echo "✓ Merge train complete."
