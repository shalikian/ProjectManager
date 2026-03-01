---
name: impl
description: Orchestrates Dev → QA → Merge pipeline for a GitHub issue using chained sub-agents.
user_invocable: true
---

# /impl — Implement Issue

You are the orchestrator for implementing a GitHub issue. You chain sub-agents sequentially: **Dev → QA → Merge**, giving each agent fresh context.

**Input**: `$ARGUMENTS` contains the GitHub issue number.

---

## Step 0: Validate Input

If `$ARGUMENTS` is empty or not a number, ask the user:
"Which issue should I implement? Provide the issue number (e.g., `/impl 5`)."

```bash
gh issue view $ARGUMENTS --json number,title,state,labels,body
```

Verify:
- The issue exists.
- The issue is open.
- The issue has a `type:task` label (warn if it's an EPIC — those should be decomposed first).

Post initial status:
```bash
gh issue comment $ARGUMENTS --body "$(cat <<'EOF'
**[orchestrator] — Implementation Started**

Beginning Dev → QA → Merge pipeline for this issue.

---
*Automated by AI Project Manager*
EOF
)"
```

---

## Step 1: Dev Agent

Launch the dev agent as a sub-agent in an isolated worktree:

```
Use the Agent tool with:
  subagent_type: general-purpose
  isolation: worktree
  prompt: |
    You are a Dev Agent. Read your instructions from .claude/agents/dev.md in the repository root.

    Your task: implement issue #<N> in this repository.

    Issue details:
    <paste full issue body here>

    Follow the workflow in .claude/agents/dev.md exactly.
    Return your results in the format specified in that file.
```

**Capture the dev agent's output**: PR URL, branch name, test results, risks.

Post status:
```bash
gh issue comment $ARGUMENTS --body "$(cat <<'EOF'
**[orchestrator] — Dev Phase Complete**

Dev agent has completed implementation.
- PR: <PR-URL>
- Moving to QA phase...

---
*Automated by AI Project Manager*
EOF
)"
```

---

## Step 2: QA Agent

Launch the QA agent with **completely fresh context** (this is critical — QA must not see dev reasoning):

```
Use the Agent tool with:
  subagent_type: general-purpose
  isolation: worktree
  prompt: |
    You are a QA Agent. Read your instructions from .claude/agents/qa.md in the repository root.

    Your task: verify that PR #<PR-number> (branch: <branch>) correctly implements issue #<N>.

    IMPORTANT: You are independent QA. You have NOT seen the dev agent's work or reasoning.
    Verify everything from scratch against the issue requirements.

    The PR branch is: <branch-name>
    The issue number is: #<N>

    Follow the workflow in .claude/agents/qa.md exactly.
    Return your results in the format specified in that file.
    Your verdict MUST be exactly one of: PASS, PASS-WITH-NITS, or FAIL.
```

**Capture the QA verdict**: PASS, PASS-WITH-NITS, or FAIL (with fix list if FAIL).

---

## Step 3: Handle QA Verdict

### If PASS or PASS-WITH-NITS → Proceed to Merge

Post status:
```bash
gh issue comment $ARGUMENTS --body "$(cat <<'EOF'
**[orchestrator] — QA Passed**

QA verdict: <PASS|PASS-WITH-NITS>
Moving to merge phase...

---
*Automated by AI Project Manager*
EOF
)"
```

Go to **Step 4: Merge Agent**.

### If FAIL → Retry Loop (max 3 iterations)

Post status:
```bash
gh issue comment $ARGUMENTS --body "$(cat <<'EOF'
**[orchestrator] — QA Failed (Attempt <N>/3)**

QA found issues. Launching new dev agent with fix list...

**Fix list from QA**:
<paste QA fix list here>

---
*Automated by AI Project Manager*
EOF
)"
```

Launch a **new dev agent** with the QA fix list included in the prompt:

```
Use the Agent tool with:
  subagent_type: general-purpose
  isolation: worktree
  prompt: |
    You are a Dev Agent on a FIX ITERATION. Read your instructions from .claude/agents/dev.md.

    Your task: fix the issues found by QA on PR #<PR-number> for issue #<N>.

    QA VERDICT: FAIL
    FIX LIST:
    <paste the full QA fix list>

    Check out the existing branch: <branch-name>
    Fix each item in the fix list.
    Push updates to the existing PR.
    Do NOT create a new PR — update the existing one.

    Return your results in the format specified in .claude/agents/dev.md.
```

Then launch a **new QA agent** (fresh context again).

Repeat up to **3 total dev→QA iterations**. If still failing after 3:

```bash
gh issue comment $ARGUMENTS --body "$(cat <<'EOF'
**[orchestrator] — Implementation Failed**

After 3 dev→QA iterations, the implementation still does not pass QA.

**Last QA verdict**: FAIL
**Fix list**: <remaining issues>

Human intervention needed. The PR is open for manual review: <PR-URL>

---
*Automated by AI Project Manager*
EOF
)"
```

Report failure to the user and stop.

---

## Step 4: Merge Agent

Launch the merge agent:

```
Use the Agent tool with:
  subagent_type: general-purpose
  model: haiku
  prompt: |
    You are a Merge Agent. Read your instructions from .claude/agents/merge.md in the repository root.

    Your task: merge PR #<PR-number> for issue #<N>.

    QA verdict: <PASS|PASS-WITH-NITS>

    Follow the workflow in .claude/agents/merge.md exactly.
    Return your results in the format specified in that file.
```

---

## Step 5: Final Summary

After merge completes, post the final summary:

```bash
gh issue comment $ARGUMENTS --body "$(cat <<'EOF'
**[orchestrator] — Implementation Complete ✓**

Issue #<N> has been fully implemented, verified, and merged.

**Pipeline Summary**:
- Dev: <N> iteration(s)
- QA verdict: <PASS|PASS-WITH-NITS>
- PR: #<PR-number> squash-merged
- Commit: <SHA>
- Issue: #<N> closed

---
*Automated by AI Project Manager*
EOF
)"
```

Report success to the user.

---

## Rules
- Always validate the issue exists and is open before starting.
- Always give QA fresh context — never include dev reasoning in QA prompt.
- Maximum 3 dev→QA iterations before escalating to user.
- Post `[orchestrator]` status comments at every phase transition.
- If any agent fails catastrophically (not just QA FAIL), report to user and stop.
