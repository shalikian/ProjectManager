#!/usr/bin/env bash
# ci-lint.sh — Detects project type and runs the appropriate linter.
set -euo pipefail

ERRORS=0

echo "=== CI Lint Check ==="

# Python projects
if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
    echo "Detected Python project"
    if command -v ruff &>/dev/null; then
        echo "Running ruff..."
        ruff check . || ERRORS=$((ERRORS + 1))
    elif command -v flake8 &>/dev/null; then
        echo "Running flake8..."
        flake8 . || ERRORS=$((ERRORS + 1))
    else
        echo "WARNING: No Python linter found (install ruff or flake8)"
    fi
fi

# Node.js projects
if [ -f "package.json" ]; then
    echo "Detected Node.js project"
    if [ -f "node_modules/.bin/eslint" ]; then
        echo "Running eslint..."
        npx eslint . || ERRORS=$((ERRORS + 1))
    elif command -v eslint &>/dev/null; then
        echo "Running eslint (global)..."
        eslint . || ERRORS=$((ERRORS + 1))
    else
        echo "WARNING: ESLint not found (run npm install)"
    fi
fi

# Go projects
if [ -f "go.mod" ]; then
    echo "Detected Go project"
    if command -v golangci-lint &>/dev/null; then
        echo "Running golangci-lint..."
        golangci-lint run || ERRORS=$((ERRORS + 1))
    elif command -v go &>/dev/null; then
        echo "Running go vet..."
        go vet ./... || ERRORS=$((ERRORS + 1))
    fi
fi

# Rust projects
if [ -f "Cargo.toml" ]; then
    echo "Detected Rust project"
    if command -v cargo &>/dev/null; then
        echo "Running cargo clippy..."
        cargo clippy -- -D warnings || ERRORS=$((ERRORS + 1))
    fi
fi

if [ "$ERRORS" -gt 0 ]; then
    echo "FAIL: $ERRORS linting error(s) found"
    exit 1
fi

echo "PASS: Lint check complete"
