#!/usr/bin/env bash
# ci-structure.sh — Validates project structure: required files exist, no secrets tracked.
set -euo pipefail

ERRORS=0
WARNINGS=0

echo "=== CI Structure Check ==="

# Required files
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
)

echo ""
echo "--- Required Files ---"
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (MISSING)"
        ERRORS=$((ERRORS + 1))
    fi
done

# Required directories
REQUIRED_DIRS=(
    ".claude/agents"
    ".claude/skills"
    ".claude/agent-learnings/entries"
    "scripts"
    "docs"
)

echo ""
echo "--- Required Directories ---"
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✓ $dir/"
    else
        echo "  ✗ $dir/ (MISSING)"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check no secrets are tracked
echo ""
echo "--- Secrets Check ---"
SECRET_PATTERNS=(".env" ".env.local" ".env.production" "credentials.json" "service-account.json" "*.pem" "*.key")
for pattern in "${SECRET_PATTERNS[@]}"; do
    TRACKED=$(git ls-files "$pattern" 2>/dev/null || true)
    if [ -n "$TRACKED" ]; then
        echo "  ✗ SECRET TRACKED: $TRACKED"
        ERRORS=$((ERRORS + 1))
    fi
done
if [ "$ERRORS" -eq 0 ]; then
    echo "  ✓ No secrets found in tracked files"
fi

# Check .gitignore includes essential patterns
echo ""
echo "--- Gitignore Check ---"
if [ -f ".gitignore" ]; then
    for pattern in ".env" "node_modules" "__pycache__"; do
        if grep -q "$pattern" .gitignore 2>/dev/null; then
            echo "  ✓ .gitignore includes $pattern"
        else
            echo "  ! .gitignore missing $pattern"
            WARNINGS=$((WARNINGS + 1))
        fi
    done
else
    echo "  ✗ .gitignore not found"
    ERRORS=$((ERRORS + 1))
fi

echo ""
if [ "$ERRORS" -gt 0 ]; then
    echo "FAIL: $ERRORS error(s), $WARNINGS warning(s)"
    exit 1
fi

if [ "$WARNINGS" -gt 0 ]; then
    echo "PASS with $WARNINGS warning(s)"
else
    echo "PASS: Structure check complete"
fi
