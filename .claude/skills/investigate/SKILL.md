---
name: investigate
description: Read-only codebase research — explores and returns a structured report.
user_invocable: true
---

# /investigate — Codebase Research

Launch a read-only research agent to explore the codebase and answer questions.

**Input**: `$ARGUMENTS` contains the research topic or question.

If `$ARGUMENTS` is empty, ask the user: "What would you like me to investigate? Provide a topic or question."

---

## Execution

Launch an Explore-type sub-agent:

```
Use the Agent tool with:
  subagent_type: Explore
  prompt: |
    Research the following topic in this codebase. Be thorough.

    TOPIC: <$ARGUMENTS>

    Provide a structured report covering:
    1. **Summary**: Brief answer to the question or overview of the topic.
    2. **Key Files**: Relevant files with paths and brief descriptions.
    3. **Architecture**: How the relevant components are structured and connected.
    4. **Code Patterns**: Notable patterns, conventions, or idioms used.
    5. **Dependencies**: External libraries or internal modules involved.
    6. **Potential Concerns**: Any issues, tech debt, or risks noticed.

    Be specific — include file paths, function names, and line numbers where relevant.
    This is a "very thorough" exploration — check multiple locations and naming conventions.
```

---

## After Agent Returns

Present the research results to the user as a clean, structured report.

If the agent found the topic well-covered in the codebase, present the findings directly.
If the topic is absent or unclear, say so and suggest what might need to be built.
