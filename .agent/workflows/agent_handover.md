---
description: Standard protocol for starting and ending tasks to maintain project context in AGENTS.md
---

# Agent Handover Protocol

This workflow ensures that every AI agent works with the full context of the project and passes on knowledge to the next agent.

## 1. Start of Thread: Load Context

At the beginning of every new thread or task, you MUST read `AGENTS.md` to understand the project status, coding standards, and current objectives.

1. **Read AGENTS.md**
   - Use `view_file` to read the entire `AGENTS.md` file.
   - Pay close attention to the "Critical Development Guidelines" and "Roadmap".
   - Then read `.agent/skills/codex-bootstrap/SKILL.md` and only the referenced files needed for the task.

2. **Check Status**
   - Review the "Agent Handover Log" at the bottom of the file (if present) to understand the previous agent's status.
   - Identify uncompleted tasks marked with `[ ]` or `[/]`.

## 2. During Execution

- Follow the coding standards and conventions defined in `AGENTS.md`.
- If you make architectural changes or add new features, keep notes to update `AGENTS.md` later.
- If the task includes an open PR or AI review comments, also follow `.agent/workflows/pr_review_loop.md`.

## 3. User Context & Escalation

**IMPORTANT**: The user is a 4-year Full Stack Developer.
- If you encounter ambiguous logic, bugs that require deeper investigation, or if you are stuck, **DO NOT HESITATE TO ASK THE USER**.
- You can explain technical details/hypotheses freely.
- Validating assumptions with the user is the standard workflow.

## 4. End of Thread: Update Context

Before finishing your session or task, you MUST update `AGENTS.md` to record your work. This is critical for the continuity of the project.

1. **Update Roadmap/Todo**
   - Mark completed items in `AGENTS.md` with `[x]`.
   - Update `[/]` for items in progress.

2. **Log Handover**
   - Append a new entry to the "Agent Handover Log" section at the bottom of `AGENTS.md`. 
   - Use the following format:

```markdown
### [YYYY-MM-DD] Task Name (e.g., Fix Login Bug)
- **Summary**: Concise summary of what was done.
- **Changes**:
  - Modified `src/components/auth-form.tsx`
  - Added `src/actions/auth.ts`
- **Next Steps**: What should the next agent do?
- **Notes**: Any warnings, tricky parts, or commands to run.
```

3. **Verify**
   - Ensure the markdown syntax is correct and the file is saved.

## 5. PR Review State (When Applicable)

If the task ends with an open PR or active AI review:

1. record the PR number
2. record the latest feature branch commit
3. record whether `sandbox` was synced
4. summarize which review comments were:
   - applied
   - intentionally rejected
   - still pending

This keeps the next agent from re-triaging the same review thread from scratch.
