---
name: redteam
description: Launches a red-team security and quality audit of the codebase.
user_invocable: true
---

# /redteam — Security & Quality Audit

Launch an independent red-team agent to audit the codebase.

**Input**: `$ARGUMENTS` (optional) contains a focus area (e.g., "authentication", "API endpoints").

---

## Execution

Launch the red-team sub-agent:

```
Use the Agent tool with:
  subagent_type: general-purpose
  prompt: |
    You are a Red Team Agent. Read your instructions from .claude/agents/red-team.md in the repository root.

    Your task: audit this repository for security vulnerabilities and code quality issues.

    <if focus area provided>
    FOCUS AREA: <$ARGUMENTS>
    Concentrate your analysis on: <$ARGUMENTS>
    </if>

    <if no focus area>
    Perform a full codebase audit across all categories: security, code quality, architecture, test coverage.
    </if>

    IMPORTANT: You are READ-ONLY. Do NOT modify any source files. You MAY create GitHub issues for critical/high findings.

    Follow the workflow in .claude/agents/red-team.md exactly.
    Return your results in the format specified in that file.
```

---

## After Agent Returns

Present the audit results to the user in a clear summary:

```
## Red Team Audit Complete

**Scope**: <what was audited>
**Focus**: <focus area or "full codebase">

**Findings**: <total>
- CRITICAL: <N>
- HIGH: <N>
- MEDIUM: <N>
- LOW: <N>

**Issues Created**: <list with links, or "none">

<key findings summary>
```

If CRITICAL findings were found, emphasize them and recommend immediate action.
