# Agent Roles & Responsibilities

This document describes each agent in the AI Project Manager system.

---

## Dev Agent

**Role**: Implements code changes for a given TASK issue.

**Trigger**: Launched by `/impl` orchestrator.

**Isolation**: Runs in a git worktree.

**Responsibilities**:
1. Read the issue and its acceptance criteria via `gh issue view`.
2. Create a feature branch: `issue-<N>-<short-desc>`.
3. Implement the required changes.
4. Write tests: 1 happy-path + 3 negative/edge-case E2E tests minimum.
5. Run all tests and ensure they pass.
6. Run CI scripts (`scripts/ci-lint.sh`, `scripts/ci-file-size.sh`).
7. Open a PR with `Fixes #<N>` in the body.
8. Post a `[dev]` comment on the issue with: files changed, test results, PR link, risks.
9. Log any learnings to `.claude/agent-learnings/entries/`.

**Outputs**: PR URL, test results, risk assessment.

---

## QA Agent

**Role**: Independently verifies that a PR meets the TASK requirements.

**Trigger**: Launched by `/impl` orchestrator after dev completes.

**Isolation**: Runs in the same worktree as the dev agent (to test the code).

**Key Principle**: "Assume nothing. Prove everything." QA has fresh context and has never seen the dev agent's reasoning.

**Responsibilities**:
1. Read the original issue acceptance criteria via `gh issue view`.
2. Build a Requirements Coverage Matrix mapping each criterion to test evidence.
3. Check out the PR branch and run all tests independently.
4. Execute E2E scenarios described in the issue's test plan.
5. Verify code quality (file limits, function limits, no secrets).
6. Deliver a verdict:
   - **PASS**: All criteria met, tests pass, code quality OK.
   - **PASS-WITH-NITS**: All criteria met, minor suggestions (non-blocking).
   - **FAIL**: One or more criteria unmet. Includes specific fix list.
7. Post a `[qa]` comment on the issue with the full matrix and verdict.

**Constraints**: QA never modifies code. Read-only analysis and test execution only.

**Outputs**: Verdict (PASS/PASS-WITH-NITS/FAIL), requirements matrix, fix list (if FAIL).

---

## Merge Agent

**Role**: Merges an approved PR and cleans up.

**Trigger**: Launched by `/impl` orchestrator after QA passes.

**Responsibilities**:
1. Locate the PR for the issue.
2. Verify QA verdict was PASS or PASS-WITH-NITS.
3. Check for merge conflicts and resolve if trivial.
4. Update documentation if the change introduces new env vars, config, or API changes.
5. Squash merge the PR.
6. Confirm the issue was auto-closed (or close manually if needed).
7. Delete the feature branch.
8. Post a `[merge]` comment with: commit SHA, merge status, cleanup summary.

**Outputs**: Commit SHA, confirmation of issue closure.

---

## Red Team Agent

**Role**: Independent security and quality auditor.

**Trigger**: Launched by `/redteam` command.

**Isolation**: Read-only access. Cannot modify code.

**Audit Categories**:
1. **Security**: OWASP Top 10, secrets in code, dependency vulnerabilities.
2. **Code Quality**: File/function size limits, dead code, complexity.
3. **Architecture**: Separation of concerns, dependency direction, modularity.
4. **Test Coverage**: Coverage gaps, missing edge cases, test quality.

**Severity Levels**:
- **CRITICAL**: Security vulnerability or data loss risk. Creates a GitHub issue.
- **HIGH**: Significant quality or reliability concern. Creates a GitHub issue.
- **MEDIUM**: Notable improvement opportunity. Included in report.
- **LOW**: Minor suggestion. Included in report.

**Outputs**: Structured audit report posted as issue comment or new issue.

---

## Orchestrator (within /impl)

**Role**: Coordinates the dev → QA → merge pipeline.

**Responsibilities**:
1. Parse the issue number and validate it exists.
2. Launch dev agent in a worktree.
3. After dev completes, launch QA agent with fresh context.
4. If QA fails, loop: launch new dev agent with fix list → new QA agent (max 3 loops).
5. If QA passes, launch merge agent.
6. Post `[orchestrator]` comments at each phase transition.

**Loop Limit**: Maximum 3 dev→QA iterations. If still failing, report to user.
