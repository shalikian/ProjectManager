# AI Project Manager — Engineering Standards

This repository is an AI-driven project management system. Claude Code is the sole LLM.
GitHub Issues are the system of record. All agents communicate via issue comments.

---

## Commands

| Command | Description |
|---------|-------------|
| `/prd "description"` | Interactive PRD workflow → creates EPIC + TASK issues |
| `/impl <issue-number>` | Chains Dev → QA → Merge agents to implement a TASK |
| `/redteam [focus]` | Launches red-team auditor against the codebase |
| `/investigate "topic"` | Read-only codebase research, returns structured report |

---

## Engineering Standards

### Code Quality
- **File limit**: 800 lines per source file. Split if exceeded.
- **Function limit**: 80 lines per function/method. Decompose if exceeded.
- **Test coverage target**: 80% line coverage minimum.
- **Tests per feature**: 1 happy-path + 3 negative/edge-case E2E tests minimum.

### Git Conventions
- **Branch naming**: `issue-<N>-<short-desc>` (e.g., `issue-42-add-auth`)
- **Merge strategy**: Squash merge only.
- **PR body**: Must include `Fixes #<N>` to auto-close the linked issue.
- **Commit messages**: Imperative mood, max 72 chars first line.

### Issue Hierarchy
- **EPICs**: Labeled `type:epic`. High-level features or projects.
- **TASKs**: Labeled `type:task`. Atomic, implementable units of work.
- TASKs reference their parent EPIC with `Epic: #<N>` in the body.
- Each TASK must have: acceptance criteria, test plan, and evidence requirements.

---

## Agent Communication Protocol

All agents post to GitHub issue comments with role prefixes:

| Role | Prefix | Example |
|------|--------|---------|
| PRD | `[prd]` | EPIC created, clarification questions |
| Orchestrator | `[orchestrator]` | Phase transitions, blockers |
| Dev | `[dev]` | PR opened, files changed, test results |
| QA | `[qa]` | Requirements matrix, PASS/FAIL verdict |
| Merge | `[merge]` | PR merged, commit SHA, cleanup done |
| Red Team | `[redteam]` | Audit findings by severity |

### Comment Format
```
**[role] — Phase/Action**

<structured content>

---
*Automated by AI Project Manager*
```

---

## Agent Rules

1. **Never bypass tests.** If tests fail, fix the code — do not delete or skip tests.
2. **Never force-push.** All history is preserved.
3. **Never commit secrets.** No `.env` files, API keys, or credentials in git.
4. **Respect file limits.** Refactor before exceeding 800 lines or 80-line functions.
5. **Log learnings.** After completing work, agents write entries to `.claude/agent-learnings/entries/`.
6. **QA is independent.** The QA agent must never see dev agent reasoning. Fresh context only.
7. **Issues are truth.** All requirements, status, and decisions live on GitHub Issues.

---

## Agent Learnings

Agents record reusable knowledge in `.claude/agent-learnings/entries/` as JSON:

```json
{
  "timestamp": "ISO-8601",
  "agent": "dev|qa|merge|redteam",
  "issue": "#N",
  "category": "pattern|pitfall|convention|tool",
  "summary": "One-line description",
  "detail": "Full explanation",
  "tags": ["relevant", "tags"]
}
```

Before starting work, agents should read recent learnings for applicable insights.

---

## Project Structure Conventions

- Source code goes in project-specific directories (e.g., `src/`, `app/`, `lib/`).
- Tests mirror source structure under `tests/` or `__tests__/`.
- CI scripts live in `scripts/`.
- Documentation lives in `docs/`.
- Agent/skill definitions live in `.claude/`.
