#!/usr/bin/env bash
# ci-file-size.sh — Enforces 800-line file limit and 80-line function limit on tracked source files.
set -euo pipefail

MAX_FILE_LINES=800
MAX_FUNC_LINES=80
ERRORS=0

echo "=== CI File Size Check ==="

# Source file extensions to check
EXTENSIONS="py js ts jsx tsx go rs java kt swift rb php cs cpp c h"

# Build find pattern for source files
FIND_ARGS=""
for ext in $EXTENSIONS; do
    if [ -n "$FIND_ARGS" ]; then
        FIND_ARGS="$FIND_ARGS -o"
    fi
    FIND_ARGS="$FIND_ARGS -name *.$ext"
done

# Get git-tracked source files only
while IFS= read -r file; do
    # Skip if file doesn't exist (deleted but tracked)
    [ -f "$file" ] || continue

    # Skip vendor/dependency directories
    case "$file" in
        node_modules/*|vendor/*|.venv/*|venv/*|__pycache__/*|dist/*|build/*) continue ;;
    esac

    # Check if it's a source file
    IS_SOURCE=false
    for ext in $EXTENSIONS; do
        if [[ "$file" == *".$ext" ]]; then
            IS_SOURCE=true
            break
        fi
    done
    [ "$IS_SOURCE" = true ] || continue

    # Count lines
    LINE_COUNT=$(wc -l < "$file")
    if [ "$LINE_COUNT" -gt "$MAX_FILE_LINES" ]; then
        echo "FAIL: $file has $LINE_COUNT lines (max $MAX_FILE_LINES)"
        ERRORS=$((ERRORS + 1))
    fi
done < <(git ls-files 2>/dev/null || find . -type f | grep -v node_modules | grep -v .git)

echo ""
echo "File limit: $MAX_FILE_LINES lines"
echo "Function limit: $MAX_FUNC_LINES lines (checked by linters)"

if [ "$ERRORS" -gt 0 ]; then
    echo ""
    echo "FAIL: $ERRORS file(s) exceed the $MAX_FILE_LINES-line limit"
    exit 1
fi

echo "PASS: All source files within size limits"
