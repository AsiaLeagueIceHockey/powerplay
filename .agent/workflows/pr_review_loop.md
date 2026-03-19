---
description: Standard PR and AI review loop for PowerPlay feature work
---

# PR Review Loop

Use this workflow for any non-trivial branch that will be reviewed through GitHub PRs and AI reviewers such as CodeRabbit.

## Goal

Keep every feature branch on a repeatable loop:

1. implement safely
2. verify before commit
3. open PR with high-signal context
4. triage AI review comments instead of blindly applying them
5. reply bilingually so the user can follow the thread
6. sync preview branches when needed
7. leave enough handover context for the next agent

## 1. Branch Setup

1. work on a dedicated branch
   - example: `feature/lounge-premium-hub`
2. if the branch is long-lived, rebase it on `main` before PR
3. if preview uses a separate branch such as `sandbox`, document whether it must be updated after feature pushes

## 2. Before Commit

Run the smallest meaningful verification set before every commit:

1. `npm run typecheck`
2. targeted tests for touched domains
3. optional: targeted eslint on touched files when UI-heavy work was done

Rules:
- do not commit with known TypeScript errors
- do not commit `console.log` debug output unless it is intentional error logging
- if a review fix changes server actions, form serialization, or URL handling, rerun verification even if the change looks small

## 3. PR Creation Standard

When opening a PR, include:

1. `Summary`
   - what changed at product level
2. `What changed`
   - public flows
   - admin/superuser flows
   - schema/platform changes
3. `Reviewer focus`
   - runtime states
   - permission or RLS boundaries
   - migration dependencies
   - routes to verify manually
4. `Required migrations`
5. `Validation`

Do not open a PR with a vague body. The reviewer should be able to test the feature without re-reading the branch diff.

## 4. AI Review Triage

Treat AI review comments as a second-pass scanner, not as final authority.

Classify each comment into one of three buckets:

1. `apply`
   - real bug
   - security issue
   - form serialization bug
   - async flow bug
   - accessibility issue with clear fix
2. `reject`
   - incorrect understanding of product behavior
   - suggestion conflicts with current architecture
   - generic refactor with weak value
3. `defer`
   - valid idea, but too broad for the PR

Priority order:

1. security
2. data integrity
3. auth / RLS / permissions
4. form serialization
5. analytics correctness
6. accessibility
7. refactor/style

## 5. AI Review Reply Standard

All replies to AI review comments must be bilingual:

1. Korean
2. English

Reply shape:

```md
반영했습니다. 원인은 ... 이었고, ... 방식으로 수정했습니다.

Applied. The issue was ..., and I fixed it by ...
```

If rejecting:

```md
이번 PR에서는 유지합니다. 이유는 ... 입니다.

Keeping the current behavior in this PR. The reason is ...
```

Rules:
- do not reply with one-line acknowledgements only
- say whether the comment was applied, rejected, or deferred
- mention the concrete reasoning

## 6. Preview Branch Sync

If the team uses a preview branch such as `sandbox`:

1. finish fixes on the feature branch
2. push the feature branch
3. merge or fast-forward `sandbox` to the feature branch
4. push `sandbox`
5. tell the user exactly which preview should be checked

Do not claim preview is current unless the preview branch has actually been pushed.

## 7. Migration Discipline

If the PR depends on SQL:

1. list all required migration files in the PR body
2. update env / QA docs if the set changed
3. when a feature introduces new enum/check values, do not expose the new option in UI without documenting the migration dependency

## 8. Handover Discipline

Before ending the task:

1. update `AGENTS.md` if the workflow or project rules changed
2. update `.agent/implementation/*.md` when a feature checklist exists
3. if PR review is in progress, record:
   - PR number
   - latest branch commit
   - what review comments were applied
   - what was intentionally rejected

## 9. Standard Execution Checklist

- [ ] branch is correct
- [ ] branch rebased or synced as needed
- [ ] typecheck passed before commit
- [ ] targeted tests passed
- [ ] PR body includes reviewer focus and migrations
- [ ] AI review comments triaged into apply/reject/defer
- [ ] replies posted in Korean and English
- [ ] preview branch updated if needed
- [ ] handover docs updated
