# Contributing Guide

## Overview

This project uses an AI-driven development workflow. Claude Code manages the entire lifecycle from requirements to merged code.

---

## Workflow

### 1. Define Requirements — `/prd "description"`

Start by describing what you want to build:

```
/prd "Add user authentication with OAuth2"
```

The PRD skill will:
- Ask clarifying questions (multiple-choice for speed).
- Score your requirements on a 100-point clarity rubric.
- Scan the codebase for reusable components.
- Create a GitHub EPIC issue with full requirements.
- Decompose the EPIC into atomic TASK issues.

### 2. Implement a Task — `/impl <issue-number>`

Pick a TASK issue and implement it:

```
/impl 5
```

This chains three agents automatically:
1. **Dev Agent**: Implements code, writes tests, opens PR.
2. **QA Agent**: Independently verifies requirements are met.
3. **Merge Agent**: Squash merges the PR, closes the issue.

If QA fails, the system automatically retries with a new dev agent (up to 3 times).

### 3. Security Audit — `/redteam [focus]`

Run a security and quality audit:

```
/redteam
/redteam "authentication module"
```

### 4. Research — `/investigate "topic"`

Explore the codebase without making changes:

```
/investigate "how does the database connection pool work"
```

---

## Issue Labels

| Label | Meaning |
|-------|---------|
| `type:epic` | High-level feature or project |
| `type:task` | Atomic, implementable unit of work |
| `priority:critical` | Must fix immediately |
| `priority:high` | Important, do soon |
| `priority:medium` | Normal priority |
| `priority:low` | Nice to have |

---

## Branch Naming

All branches follow the pattern: `issue-<N>-<short-description>`

Examples:
- `issue-5-add-oauth-login`
- `issue-12-fix-pagination-bug`

---

## Code Standards

- **Max 800 lines** per source file.
- **Max 80 lines** per function/method.
- **Min 80% test coverage**.
- **1 happy-path + 3 negative/edge-case** tests per feature.
- Squash merge only. PR body must include `Fixes #<N>`.

---

## Agent Communication

All automated updates appear as GitHub issue comments with role prefixes:
`[prd]`, `[dev]`, `[qa]`, `[merge]`, `[orchestrator]`, `[redteam]`

You can follow progress by watching the GitHub issue.

---

## Porting to Another Project

Copy these items to any project to install the AI Project Manager:

1. `.claude/` directory (agents, skills, settings)
2. `scripts/` directory (CI scripts)
3. `docs/` directory (documentation)
4. `CLAUDE.md` (engineering standards)

Then run `bash scripts/doctor.sh` to verify prerequisites.
