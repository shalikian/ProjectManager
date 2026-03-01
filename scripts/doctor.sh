#!/usr/bin/env bash
# doctor.sh — Checks all prerequisites for the AI Project Manager system.
set -euo pipefail

ERRORS=0
WARNINGS=0

echo "========================================"
echo "  AI Project Manager — Doctor"
echo "========================================"
echo ""

# --- CLI Tools ---
echo "--- CLI Tools ---"

check_tool() {
    local name="$1"
    local required="${2:-true}"
    if command -v "$name" &>/dev/null; then
        local version
        version=$("$name" --version 2>&1 | head -1) || version="(version unknown)"
        echo "  ✓ $name — $version"
    else
        if [ "$required" = "true" ]; then
            echo "  ✗ $name — NOT FOUND (required)"
            ERRORS=$((ERRORS + 1))
        else
            echo "  ! $name — not found (optional)"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
}

check_tool "git" true
check_tool "gh" true
check_tool "python" false
check_tool "node" false
check_tool "npm" false

# --- GitHub Auth ---
echo ""
echo "--- GitHub Authentication ---"
if gh auth status &>/dev/null 2>&1; then
    ACCOUNT=$(gh auth status 2>&1 | grep "account" | head -1 || echo "authenticated")
    echo "  ✓ GitHub CLI authenticated — $ACCOUNT"
else
    echo "  ✗ GitHub CLI not authenticated (run: gh auth login)"
    ERRORS=$((ERRORS + 1))
fi

# --- Git Repository ---
echo ""
echo "--- Git Repository ---"
if git rev-parse --git-dir &>/dev/null 2>&1; then
    REMOTE=$(git remote get-url origin 2>/dev/null || echo "no remote")
    BRANCH=$(git branch --show-current 2>/dev/null || echo "detached")
    echo "  ✓ Git repo initialized"
    echo "    Remote: $REMOTE"
    echo "    Branch: $BRANCH"
else
    echo "  ✗ Not a git repository (run: git init)"
    ERRORS=$((ERRORS + 1))
fi

# --- Project Structure ---
echo ""
echo "--- Project Structure ---"

REQUIRED_FILES=(
    "CLAUDE.md"
    ".gitignore"
    ".claude/agents/dev.md"
    ".claude/agents/qa.md"
    ".claude/agents/merge.md"
    ".claude/agents/red-team.md"
    ".claude/skills/prd/SKILL.md"
    ".claude/skills/impl/SKILL.md"
    ".claude/skills/redteam/SKILL.md"
    ".claude/skills/investigate/SKILL.md"
    "scripts/ci-lint.sh"
    "scripts/ci-file-size.sh"
    "scripts/ci-structure.sh"
    "scripts/doctor.sh"
    "docs/AGENTS.md"
    "docs/CONTRIBUTING.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (MISSING)"
        ERRORS=$((ERRORS + 1))
    fi
done

REQUIRED_DIRS=(
    ".claude/agents"
    ".claude/skills"
    ".claude/agent-learnings/entries"
    "scripts"
    "docs"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✓ $dir/"
    else
        echo "  ✗ $dir/ (MISSING)"
        ERRORS=$((ERRORS + 1))
    fi
done

# --- Scripts Executable ---
echo ""
echo "--- Script Permissions ---"
for script in scripts/*.sh; do
    if [ -x "$script" ]; then
        echo "  ✓ $script (executable)"
    else
        echo "  ! $script (not executable — run: chmod +x $script)"
        WARNINGS=$((WARNINGS + 1))
    fi
done

# --- Summary ---
echo ""
echo "========================================"
if [ "$ERRORS" -gt 0 ]; then
    echo "  FAIL: $ERRORS error(s), $WARNINGS warning(s)"
    echo "  Fix the errors above before using the system."
    echo "========================================"
    exit 1
elif [ "$WARNINGS" -gt 0 ]; then
    echo "  PASS with $WARNINGS warning(s)"
    echo "  System is functional but some optional items need attention."
    echo "========================================"
    exit 0
else
    echo "  PASS: All checks passed!"
    echo "  System is ready. Run /prd to create your first feature."
    echo "========================================"
    exit 0
fi
