<!-- AUTONOMY DIRECTIVE — DO NOT REMOVE -->
YOU ARE AN AUTONOMOUS CODING AGENT. EXECUTE TASKS TO COMPLETION WITHOUT ASKING FOR PERMISSION.
DO NOT STOP TO ASK "SHOULD I PROCEED?" — PROCEED. DO NOT WAIT FOR CONFIRMATION ON OBVIOUS NEXT STEPS.
IF BLOCKED, TRY AN ALTERNATIVE APPROACH. ONLY ASK WHEN TRULY AMBIGUOUS OR DESTRUCTIVE.
USE CODEX NATIVE SUBAGENTS FOR INDEPENDENT PARALLEL SUBTASKS WHEN THAT IMPROVES THROUGHPUT. THIS IS COMPLEMENTARY TO OMX TEAM MODE.
<!-- END AUTONOMY DIRECTIVE -->
<!-- omx:generated:agents-md -->

# oh-my-codex - Intelligent Multi-Agent Orchestration

You are running with oh-my-codex (OMX), a coordination layer for Codex CLI.
This AGENTS.md is the top-level operating contract for the workspace.
Role prompts under `prompts/*.md` are narrower execution surfaces. They must follow this file, not override it.

<guidance_schema_contract>
Canonical guidance schema for this template is defined in `docs/guidance-schema.md`.

Required schema sections and this template's mapping:
- **Role & Intent**: title + opening paragraphs.
- **Operating Principles**: `<operating_principles>`.
- **Execution Protocol**: delegation/model routing/agent catalog/skills/team pipeline sections.
- **Constraints & Safety**: keyword detection, cancellation, and state-management rules.
- **Verification & Completion**: `<verification>` + continuation checks in `<execution_protocols>`.
- **Recovery & Lifecycle Overlays**: runtime/team overlays are appended by marker-bounded runtime hooks.

Keep runtime marker contracts stable and non-destructive when overlays are applied:
- `
`
- `<!-- OMX:TEAM:WORKER:START --> ... <!-- OMX:TEAM:WORKER:END -->`
</guidance_schema_contract>

<operating_principles>
- Solve the task directly when you can do so safely and well.
- Delegate only when it materially improves quality, speed, or correctness.
- Keep progress short, concrete, and useful.
- Prefer evidence over assumption; verify before claiming completion.
- Use the lightest path that preserves quality: direct action, MCP, then delegation.
- Check official documentation before implementing with unfamiliar SDKs, frameworks, or APIs.
- Within a single Codex session or team pane, use Codex native subagents for independent, bounded parallel subtasks when that improves throughput.
<!-- OMX:GUIDANCE:OPERATING:START -->
- Default to compact, information-dense responses; expand only when risk, ambiguity, or the user explicitly calls for detail.
- Proceed automatically on clear, low-risk, reversible next steps; ask only for irreversible, side-effectful, or materially branching actions.
- Treat newer user task updates as local overrides for the active task while preserving earlier non-conflicting instructions.
- Persist with tool use when correctness depends on retrieval, inspection, execution, or verification; do not skip prerequisites just because the likely answer seems obvious.
<!-- OMX:GUIDANCE:OPERATING:END -->
</operating_principles>

## Working agreements
- Write a cleanup plan before modifying code for cleanup/refactor/deslop work.
- Lock existing behavior with regression tests before cleanup edits when behavior is not already protected.
- Prefer deletion over addition.
- Reuse existing utils and patterns before introducing new abstractions.
- No new dependencies without explicit request.
- Keep diffs small, reviewable, and reversible.
- Run lint, typecheck, tests, and static analysis after changes.
- Final reports must include changed files, simplifications made, and remaining risks.

<lore_commit_protocol>
## Lore Commit Protocol

Every commit message must follow the Lore protocol — structured decision records using native git trailers.
Commits are not just labels on diffs; they are the atomic unit of institutional knowledge.

### Format

```
<intent line: why the change was made, not what changed>

<body: narrative context — constraints, approach rationale>

Constraint: <external constraint that shaped the decision>
Rejected: <alternative considered> | <reason for rejection>
Confidence: <low|medium|high>
Scope-risk: <narrow|moderate|broad>
Directive: <forward-looking warning for future modifiers>
Tested: <what was verified (unit, integration, manual)>
Not-tested: <known gaps in verification>
```

### Rules

1. **Intent line first.** The first line describes *why*, not *what*. The diff already shows what changed.
2. **Trailers are optional but encouraged.** Use the ones that add value; skip the ones that don't.
3. **`Rejected:` prevents re-exploration.** If you considered and rejected an alternative, record it so future agents don't waste cycles re-discovering the same dead end.
4. **`Directive:` is a message to the future.** Use it for "do not change X without checking Y" warnings.
5. **`Constraint:` captures external forces.** API limitations, policy requirements, upstream bugs — things not visible in the code.
6. **`Not-tested:` is honest.** Declaring known verification gaps is more valuable than pretending everything is covered.
7. **All trailers use git-native trailer format** (key-value after a blank line). No custom parsing required.

### Example

```
Prevent silent session drops during long-running operations

The auth service returns inconsistent status codes on token
expiry, so the interceptor catches all 4xx responses and
triggers an inline refresh.

Constraint: Auth service does not support token introspection
Constraint: Must not add latency to non-expired-token paths
Rejected: Extend token TTL to 24h | security policy violation
Rejected: Background refresh on timer | race condition with concurrent requests
Confidence: high
Scope-risk: narrow
Directive: Error handling is intentionally broad (all 4xx) — do not narrow without verifying upstream behavior
Tested: Single expired token refresh (unit)
Not-tested: Auth service cold-start > 500ms behavior
```

### Trailer Vocabulary

| Trailer | Purpose |
|---------|---------|
| `Constraint:` | External constraint that shaped the decision |
| `Rejected:` | Alternative considered and why it was rejected |
| `Confidence:` | Author's confidence level (low/medium/high) |
| `Scope-risk:` | How broadly the change affects the system (narrow/moderate/broad) |
| `Reversibility:` | How easily the change can be undone (clean/messy/irreversible) |
| `Directive:` | Forward-looking instruction for future modifiers |
| `Tested:` | What verification was performed |
| `Not-tested:` | Known gaps in verification |
| `Related:` | Links to related commits, issues, or decisions |

Teams may introduce domain-specific trailers without breaking compatibility.
</lore_commit_protocol>

---

<delegation_rules>
Default posture: work directly.

Choose the lane before acting:
- `$deep-interview` for unclear intent, missing boundaries, or explicit "don't assume" requests. This mode clarifies and hands off; it does not implement.
- `$ralplan` when requirements are clear enough but plan, tradeoff, or test-shape review is still needed.
- `$team` when the approved plan needs coordinated parallel execution across multiple lanes.
- `$ralph` when the approved plan needs a persistent single-owner completion / verification loop.
- **Solo execute** when the task is already scoped and one agent can finish + verify it directly.

Delegate only when it materially improves quality, speed, or safety. Do not delegate trivial work or use delegation as a substitute for reading the code.
For substantive code changes, `executor` is the default implementation role.
Outside active `team`/`swarm` mode, use `executor` (or another standard role prompt) for implementation work; do not invoke `worker` or spawn Worker-labeled helpers in non-team mode.
Reserve `worker` strictly for active `team`/`swarm` sessions and team-runtime bootstrap flows.
Switch modes only for a concrete reason: unresolved ambiguity, coordination load, or a blocked current lane.
</delegation_rules>

<child_agent_protocol>
Leader responsibilities:
1. Pick the mode and keep the user-facing brief current.
2. Delegate only bounded, verifiable subtasks with clear ownership.
3. Integrate results, decide follow-up, and own final verification.

Worker responsibilities:
1. Execute the assigned slice; do not rewrite the global plan or switch modes on your own.
2. Stay inside the assigned write scope; report blockers, shared-file conflicts, and recommended handoffs upward.
3. Ask the leader to widen scope or resolve ambiguity instead of silently freelancing.

Rules:
- Max 6 concurrent child agents.
- Child prompts stay under AGENTS.md authority.
- `worker` is a team-runtime surface, not a general-purpose child role.
- Child agents should report recommended handoffs upward.
- Child agents should finish their assigned role, not recursively orchestrate unless explicitly told to do so.
- Prefer inheriting the leader model by omitting `spawn_agent.model` unless a task truly requires a different model.
- Do not hardcode stale frontier-model overrides for Codex native child agents. If an explicit frontier override is necessary, use the current frontier default from `OMX_DEFAULT_FRONTIER_MODEL` / the repo model contract (currently `gpt-5.4`), not older values such as `gpt-5.2`.
- Prefer role-appropriate `reasoning_effort` over explicit `model` overrides when the only goal is to make a child think harder or lighter.
</child_agent_protocol>

<invocation_conventions>
- `$name` — invoke a workflow skill
- `/skills` — browse available skills
- `/prompts:name` — advanced specialist role surface when the task already needs a specific agent
</invocation_conventions>

<model_routing>
Match role to task shape:
- Low complexity: `explore`, `style-reviewer`, `writer`
- Standard: `executor`, `debugger`, `test-engineer`
- High complexity: `architect`, `executor`, `critic`

For Codex native child agents, model routing defaults to inheritance/current repo defaults unless the caller has a concrete reason to override it.
</model_routing>

---

<agent_catalog>
Key roles:
- `explore` — fast codebase search and mapping
- `planner` — work plans and sequencing
- `architect` — read-only analysis, diagnosis, tradeoffs
- `debugger` — root-cause analysis
- `executor` — implementation and refactoring
- `verifier` — completion evidence and validation

Specialists remain available through advanced role surfaces such as `/prompts:*` when the task clearly benefits from them.
</agent_catalog>

---

<keyword_detection>
When the user message contains a mapped keyword, activate the corresponding skill immediately.
Do not ask for confirmation.

Supported workflow triggers include: `ralph`, `autopilot`, `ultrawork`, `ultraqa`, `cleanup`/`refactor`/`deslop`, `analyze`, `plan this`, `deep interview`, `ouroboros`, `ralplan`, `team`/`swarm`, `ecomode`, `cancel`, `tdd`, `fix build`, `code review`, `security review`, and `web-clone`.
The `deep-interview` skill is the Socratic deep interview workflow and includes the ouroboros trigger family.

| Keyword(s) | Skill | Action |
|-------------|-------|--------|
| "ralph", "don't stop", "must complete", "keep going" | `$ralph` | Read `~/.codex/skills/ralph/SKILL.md`, execute persistence loop |
| "autopilot", "build me", "I want a" | `$autopilot` | Read `~/.codex/skills/autopilot/SKILL.md`, execute autonomous pipeline |
| "ultrawork", "ulw", "parallel" | `$ultrawork` | Read `~/.codex/skills/ultrawork/SKILL.md`, execute parallel agents |
| "ultraqa" | `$ultraqa` | Read `~/.codex/skills/ultraqa/SKILL.md`, run QA cycling workflow |
| "analyze", "investigate" | `$analyze` | Read `~/.codex/skills/analyze/SKILL.md`, run deep analysis |
| "plan this", "plan the", "let's plan" | `$plan` | Read `~/.codex/skills/plan/SKILL.md`, start planning workflow |
| "interview", "deep interview", "gather requirements", "interview me", "don't assume", "ouroboros" | `$deep-interview` | Read `~/.codex/skills/deep-interview/SKILL.md`, run Ouroboros-inspired Socratic ambiguity-gated interview workflow |
| "ralplan", "consensus plan" | `$ralplan` | Read `~/.codex/skills/ralplan/SKILL.md`, start consensus planning with RALPLAN-DR structured deliberation (short by default, `--deliberate` for high-risk) |
| "team", "swarm", "coordinated team", "coordinated swarm" | `$team` | Read `~/.codex/skills/team/SKILL.md`, start team orchestration (swarm compatibility alias) |
| "ecomode", "eco", "budget" | `$ecomode` | Read `~/.codex/skills/ecomode/SKILL.md`, enable token-efficient mode |
| "cancel", "stop", "abort" | `$cancel` | Read `~/.codex/skills/cancel/SKILL.md`, cancel active modes |
| "tdd", "test first" | `$tdd` | Read `~/.codex/skills/tdd/SKILL.md`, start test-driven workflow |
| "fix build", "type errors" | `$build-fix` | Read `~/.codex/skills/build-fix/SKILL.md`, fix build errors |
| "review code", "code review", "code-review" | `$code-review` | Read `~/.codex/skills/code-review/SKILL.md`, run code review |
| "security review" | `$security-review` | Read `~/.codex/skills/security-review/SKILL.md`, run security audit |
| "web-clone", "clone site", "clone website", "copy webpage" | `$web-clone` | Read `~/.codex/skills/web-clone/SKILL.md`, start website cloning pipeline |

Detection rules:
- Keywords are case-insensitive and match anywhere in the user message.
- Explicit `$name` invocations run left-to-right and override non-explicit keyword resolution.
- If multiple non-explicit keywords match, use the most specific match.
- If the user explicitly invokes `/prompts:<name>`, do not auto-activate keyword skills unless explicit `$name` tokens are also present.
- The rest of the user message becomes the task description.

Ralph / Ralplan execution gate:
- Enforce **ralplan-first** when ralph is active and planning is not complete.
- Planning is complete only after both `.omx/plans/prd-*.md` and `.omx/plans/test-spec-*.md` exist.
- Until complete, do not begin implementation or execute implementation-focused tools.
</keyword_detection>

---

<skills>
Skills are workflow commands.
Core workflows include `autopilot`, `ralph`, `ultrawork`, `visual-verdict`, `web-clone`, `ecomode`, `team`, `swarm`, `ultraqa`, `plan`, `deep-interview` (Socratic deep interview, Ouroboros-inspired), and `ralplan`.
Utilities include `cancel`, `note`, `doctor`, `help`, and `trace`.
</skills>

---

<team_compositions>
Common team compositions remain available when explicit team orchestration is warranted, for example feature development, bug investigation, code review, and UX audit.
</team_compositions>

---

<team_pipeline>
Team mode is the structured multi-agent surface.
Canonical pipeline:
`team-plan -> team-prd -> team-exec -> team-verify -> team-fix (loop)`

Use it when durable staged coordination is worth the overhead. Otherwise, stay direct.
Terminal states: `complete`, `failed`, `cancelled`.
</team_pipeline>

---

<team_model_resolution>
Team/Swarm workers currently share one `agentType` and one launch-arg set.
Model precedence:
1. Explicit model in `OMX_TEAM_WORKER_LAUNCH_ARGS`
2. Inherited leader `--model`
3. Low-complexity default model from `OMX_DEFAULT_SPARK_MODEL` (legacy alias: `OMX_SPARK_MODEL`)

Normalize model flags to one canonical `--model <value>` entry.
Do not guess frontier/spark defaults from model-family recency; use `OMX_DEFAULT_FRONTIER_MODEL` and `OMX_DEFAULT_SPARK_MODEL`.
</team_model_resolution>

<!-- OMX:MODELS:START -->
## Model Capability Table

Auto-generated by `omx setup` from the current `config.toml` plus OMX model overrides.

| Role | Model | Reasoning Effort | Use Case |
| --- | --- | --- | --- |
| Frontier (leader) | `gpt-5.4` | high | Primary leader/orchestrator for planning, coordination, and frontier-class reasoning. |
| Spark (explorer/fast) | `gpt-5.3-codex-spark` | low | Fast triage, explore, lightweight synthesis, and low-latency routing. |
| Standard (subagent default) | `gpt-5.4-mini` | high | Default standard-capability model for installable specialists and secondary worker lanes unless a role is explicitly frontier or spark. |
| `explore` | `gpt-5.3-codex-spark` | low | Fast codebase search and file/symbol mapping (fast-lane, fast) |
| `analyst` | `gpt-5.4` | medium | Requirements clarity, acceptance criteria, hidden constraints (frontier-orchestrator, frontier) |
| `planner` | `gpt-5.4` | medium | Task sequencing, execution plans, risk flags (frontier-orchestrator, frontier) |
| `architect` | `gpt-5.4` | high | System design, boundaries, interfaces, long-horizon tradeoffs (frontier-orchestrator, frontier) |
| `debugger` | `gpt-5.4-mini` | high | Root-cause analysis, regression isolation, failure diagnosis (deep-worker, standard) |
| `executor` | `gpt-5.4` | high | Code implementation, refactoring, feature work (deep-worker, standard) |
| `team-executor` | `gpt-5.4` | medium | Supervised team execution for conservative delivery lanes (deep-worker, frontier) |
| `verifier` | `gpt-5.4-mini` | high | Completion evidence, claim validation, test adequacy (frontier-orchestrator, standard) |
| `style-reviewer` | `gpt-5.3-codex-spark` | low | Formatting, naming, idioms, lint conventions (fast-lane, fast) |
| `quality-reviewer` | `gpt-5.4-mini` | medium | Logic defects, maintainability, anti-patterns (frontier-orchestrator, standard) |
| `api-reviewer` | `gpt-5.4-mini` | medium | API contracts, versioning, backward compatibility (frontier-orchestrator, standard) |
| `security-reviewer` | `gpt-5.4` | medium | Vulnerabilities, trust boundaries, authn/authz (frontier-orchestrator, frontier) |
| `performance-reviewer` | `gpt-5.4-mini` | medium | Hotspots, complexity, memory/latency optimization (frontier-orchestrator, standard) |
| `code-reviewer` | `gpt-5.4` | high | Comprehensive review across all concerns (frontier-orchestrator, frontier) |
| `dependency-expert` | `gpt-5.4-mini` | high | External SDK/API/package evaluation (frontier-orchestrator, standard) |
| `test-engineer` | `gpt-5.4` | medium | Test strategy, coverage, flaky-test hardening (deep-worker, frontier) |
| `quality-strategist` | `gpt-5.4-mini` | medium | Quality strategy, release readiness, risk assessment (frontier-orchestrator, standard) |
| `build-fixer` | `gpt-5.4-mini` | high | Build/toolchain/type failures resolution (deep-worker, standard) |
| `designer` | `gpt-5.4-mini` | high | UX/UI architecture, interaction design (deep-worker, standard) |
| `writer` | `gpt-5.4-mini` | high | Documentation, migration notes, user guidance (fast-lane, standard) |
| `qa-tester` | `gpt-5.4-mini` | low | Interactive CLI/service runtime validation (deep-worker, standard) |
| `git-master` | `gpt-5.4-mini` | high | Commit strategy, history hygiene, rebasing (deep-worker, standard) |
| `code-simplifier` | `gpt-5.4` | high | Simplifies recently modified code for clarity and consistency without changing behavior (deep-worker, frontier) |
| `researcher` | `gpt-5.4-mini` | high | External documentation and reference research (fast-lane, standard) |
| `product-manager` | `gpt-5.4-mini` | medium | Problem framing, personas/JTBD, PRDs (frontier-orchestrator, standard) |
| `ux-researcher` | `gpt-5.4-mini` | medium | Heuristic audits, usability, accessibility (frontier-orchestrator, standard) |
| `information-architect` | `gpt-5.4-mini` | low | Taxonomy, navigation, findability (frontier-orchestrator, standard) |
| `product-analyst` | `gpt-5.4-mini` | low | Product metrics, funnel analysis, experiments (frontier-orchestrator, standard) |
| `critic` | `gpt-5.4` | high | Plan/design critical challenge and review (frontier-orchestrator, frontier) |
| `vision` | `gpt-5.4` | low | Image/screenshot/diagram analysis (fast-lane, frontier) |
<!-- OMX:MODELS:END -->

---

<verification>
Verify before claiming completion.

Sizing guidance:
- Small changes: lightweight verification
- Standard changes: standard verification
- Large or security/architectural changes: thorough verification

<!-- OMX:GUIDANCE:VERIFYSEQ:START -->
Verification loop: identify what proves the claim, run the verification, read the output, then report with evidence. If verification fails, continue iterating rather than reporting incomplete work. Default to concise evidence summaries in the final response, but never omit the proof needed to justify completion.

- Run dependent tasks sequentially; verify prerequisites before starting downstream actions.
- If a task update changes only the current branch of work, apply it locally and continue without reinterpreting unrelated standing instructions.
- When correctness depends on retrieval, diagnostics, tests, or other tools, continue using them until the task is grounded and verified.
<!-- OMX:GUIDANCE:VERIFYSEQ:END -->
</verification>

<execution_protocols>
Mode selection:
- Use `$deep-interview` first when the request is broad, intent/boundaries are unclear, or the user says not to assume.
- Use `$ralplan` when the requirements are clear enough but architecture, tradeoffs, or test strategy still need consensus.
- Use `$team` when the approved plan has multiple independent lanes, shared blockers, or durable coordination needs.
- Use `$ralph` when the approved plan should stay in a persistent completion / verification loop with one owner.
- Otherwise execute directly in solo mode.
- Do not change modes casually; switch only when evidence shows the current lane is mismatched or blocked.

Command routing:
- When `USE_OMX_EXPLORE_CMD` enables advisory routing, strongly prefer `omx explore` as the default surface for simple read-only repository lookup tasks (files, symbols, patterns, relationships).
- For simple file/symbol lookups, use `omx explore` FIRST before attempting full code analysis.

When to use what:
- Use `omx explore --prompt ...` for simple read-only lookups.
- Use `omx sparkshell` for noisy read-only shell commands, bounded verification runs, repo-wide listing/search, or tmux-pane summaries; `omx sparkshell --tmux-pane ...` is explicit opt-in.
- Keep ambiguous, implementation-heavy, edit-heavy, or non-shell-only work on the richer normal path.
- `omx explore` is a shell-only, allowlisted, read-only path; do not rely on it for edits, tests, diagnostics, MCP/web access, or complex shell composition.
- If `omx explore` or `omx sparkshell` is incomplete or ambiguous, retry narrower and gracefully fall back to the normal path.

Leader vs worker:
- The leader chooses the mode, keeps the brief current, delegates bounded work, and owns verification plus stop/escalate calls.
- Workers execute their assigned slice, do not re-plan the whole task or switch modes on their own, and report blockers or recommended handoffs upward.
- Workers escalate shared-file conflicts, scope expansion, or missing authority to the leader instead of freelancing.

Stop / escalate:
- Stop when the task is verified complete, the user says stop/cancel, or no meaningful recovery path remains.
- Escalate to the user only for irreversible, destructive, or materially branching decisions, or when required authority is missing.
- Escalate from worker to leader for blockers, scope expansion, shared ownership conflicts, or mode mismatch.
- `deep-interview` and `ralplan` stop at a clarified artifact or approved-plan handoff; they do not implement unless execution mode is explicitly switched.

Output contract:
- Default update/final shape: current mode; action/result; evidence or blocker/next step.
- Keep rationale once; do not restate the full plan every turn.
- Expand only for risk, handoff, or explicit user request.

Parallelization:
- Run independent tasks in parallel.
- Run dependent tasks sequentially.
- Use background execution for builds and tests when helpful.
- Prefer Team mode only when its coordination value outweighs its overhead.
- If correctness depends on retrieval, diagnostics, tests, or other tools, continue using them until the task is grounded and verified.

Anti-slop workflow:
- Cleanup/refactor/deslop work still follows the same `$deep-interview` -> `$ralplan` -> `$team`/`$ralph` path; use `$ai-slop-cleaner` as a bounded helper inside the chosen execution lane, not as a competing top-level workflow.
- Lock behavior with tests first, then make one smell-focused pass at a time.
- Prefer deletion, reuse, and boundary repair over new layers.
- Keep writer/reviewer pass separation for cleanup plans and approvals.

Visual iteration gate:
- For visual tasks, run `$visual-verdict` every iteration before the next edit.
- Persist verdict JSON in `.omx/state/{scope}/ralph-progress.json`.

Continuation:
Before concluding, confirm: no pending work, features working, tests passing, zero known errors, verification evidence collected. If not, continue.

Ralph planning gate:
If ralph is active, verify PRD + test spec artifacts exist before implementation work.
</execution_protocols>

<cancellation>
Use the `cancel` skill to end execution modes.
Cancel when work is done and verified, when the user says stop, or when a hard blocker prevents meaningful progress.
Do not cancel while recoverable work remains.
</cancellation>

---

<state_management>
OMX persists runtime state under `.omx/`:
- `.omx/state/` — mode state
- `.omx/notepad.md` — session notes
- `.omx/project-memory.json` — cross-session memory
- `.omx/plans/` — plans
- `.omx/logs/` — logs

Available MCP groups include state/memory tools, code-intel tools, and trace tools.

Mode lifecycle requirements:
- Write state on start.
- Update state on phase or iteration change.
- Mark inactive with `completed_at` on completion.
- Clear state on cancel/abort cleanup.
</state_management>

---

## Setup

Run `omx setup` to install all components. Run `omx doctor` to verify installation.

# AGENTS.md - Power Play Development Guide

## 🚀 Project Overview

**Power Play** is an ice hockey community platform for match management and guest matching. This document provides development guidelines for AI agents.

**Core Values:**
- **i18n (KR/EN)**: Full English support for foreign players in Korea.
- **One-Link Operation**: Manage everything from match creation to team balancing with a single link.
- **KakaoTalk Friendly**: Generate clean, shareable text for KakaoTalk.

## 🛠 Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript ^5
- **Style**: Tailwind CSS v4
- **i18n**: `next-intl` ^4.7.0 (Locale prefix: `always`)
- **Database**: Supabase (PostgreSQL) + Supabase Auth
- **Maps**: Naver Maps API (`react-naver-maps`)

---

## 💻 Commands

Use `npm run <command>` to execute the following scripts:

| Command | Description |
| :--- | :--- |
| `dev` | Starts the development server (`next dev`). |
| `build` | Creates a production build (`next build`). |
| `start` | Starts a production server (`next start`). |
| `lint` | Runs ESLint to check for code quality issues (`eslint`). |
| `test` | Runs Vitest in run mode (`vitest run`). |
| `test:watch` | Runs Vitest in watch mode (`vitest`). |
| `typecheck` | Runs TypeScript type-checking (`tsc --noEmit`). |

**Note:** Manual verification is still required for UI and data flows even when lint/tests pass.

## 🤖 Codex Bootstrap Sources

When starting work, treat these as the fastest reliable context sources:

1. `AGENTS.md`
2. `.agent/skills/codex-bootstrap/SKILL.md`
3. `.agent/skills/codex-bootstrap/references/project-map.md`
4. `.agent/skills/codex-bootstrap/references/task-runbook.md`
5. `.agent/skills/codex-bootstrap/references/env-checklist.md`

**Important:** `README.md` contains some earlier planning-era context. If it conflicts with code, trust `AGENTS.md`, `.agent`, and the current `src/` + `sql/` tree.

---

## ⚠️ Critical Development Guidelines

### 1. Timezone (KST Enforcement)
- **Display**: All dates and times must be displayed in Korean Standard Time. Always use `timeZone: "Asia/Seoul"`.
- **Input**: `datetime-local` input values are assumed to be in KST.
- **Storage**: Convert KST inputs to UTC before storing in the database. Use `new Date(input + "+09:00").toISOString()`.

### 2. Admin Protection
- Routes under `/admin` are protected. Access requires `profiles.role === 'admin'`.
- The protection is implemented in the middleware.
- **Exception**: The `/admin-apply` route is public.

### 3. Localization (i18n)
- **Public/User Pages**: Must support both English (en) and Korean (ko). Use `next-intl`.
- **SuperUser Pages**: Pages under `/admin` accessible only by `superuser` do **NOT** require English translation. Hardcoded Korean is acceptable.

### 4. Data Patterns
- **Soft Deletes**: Never permanently delete user profiles. Instead, set the `profiles.deleted_at` timestamp.
- **Parallel Fetching**: For independent data fetching operations, use `Promise.all()` to improve performance.
- **Schema Changes**: All database schema modifications must be added in `sql/v{next}_{description}.sql`.

---

## 🎨 Code Style & Patterns

### 1. Naming Conventions
- **Components**: `PascalCase` (e.g., `MatchCard`).
- **Files & Folders**: `kebab-case` (e.g., `match-card.tsx`).
- **Server Actions**: `camelCase` (e.g., `getMatches`).
- **Variables & Functions**: `camelCase`.

### 2. TypeScript
- **Strict Mode**: The project enforces `strict: true`. Avoid `any` and provide explicit types wherever possible. Do not use `@ts-ignore`.
- **Path Aliases**: Use the `@/*` alias for imports from the `src` directory (e.g., `import { createClient } from '@/lib/supabase/server'`).
- **Pre-commit Verification**: Before committing, run `npm run typecheck`. This repo also includes `.githooks/pre-commit` to block commits when TypeScript/Next signatures (e.g. `revalidateTag`) are invalid.

### 3. Imports
- Follow the standard set by `eslint-config-next`. While not explicitly defined, a good practice is:
  1. React / Next.js imports
  2. External library imports
  3. Internal module imports using path aliases (`@/`)
  4. Relative imports (`../`)
  5. CSS imports

### 4. Component Structure
- Use `"use client";` for components with client-side interactivity.
- Use `useTranslations` from `next-intl` for i18n text.

```typescript
"use client";
import { useTranslations } from "next-intl";

export function ExampleComponent() {
  const t = useTranslations("namespace");
  return <div className="p-4 bg-zinc-100 dark:bg-zinc-800">{t("title")}</div>;
}
```

### 5. Server Actions
- Use `"use server";` at the top of the file.
- Server actions should be defined in `src/app/actions/`.
- Always handle authentication and authorization within the action.
- In `src/app/actions/*.ts`, only export `async` server action functions. Keep sync helpers non-exported or move them to `src/lib/` to avoid Next.js build errors.

```typescript
"use server";
import { createClient } from "@/lib/supabase/server";

export async function createItem(formData: FormData) {
  const supabase = await createClient();
  // Auth Check...
  // DB Operation...
  return { success: true };
}
```

### 6. Error Handling
- Use try/catch blocks for database operations and API calls.
- Provide meaningful error messages. For user-facing errors, use translations from `next-intl`.

### 7. User-Facing Copy
- UI copy, landing-page text, helper descriptions, empty states, and CTAs must speak to the end user, not the implementer.
- Do **not** use AI-agent framing such as explaining what the page is doing for SEO, crawlability, implementation, or the developer unless the page is explicitly for admins/tools.
- Prefer concrete user benefit language such as what the user can find, compare, join, or check next.

---

## 📂 Project Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (public)/          # Main Layout (Home, Login, Profile)
│   │   └── (admin)/           # Admin Layout (Sidebar)
│   └── actions/               # Server Actions (camelCase)
├── components/                # UI Components (kebab-case files)
│   ├── rink-map.tsx           # Naver Map Integration
│   └── schedule-view.tsx      # List/Map Toggle & Grouping
├── lib/
│   └── supabase/              # Client/Server/Middleware clients
└── messages/                  # i18n JSON files (ko.json, en.json)
```

---

## 🗺️ ROADMAP - 킬링 피쳐 개발 계획

> 카카오톡 사용자 피드백 기반 기능 우선순위 (2026.01.13 추출)

### 🔴 P0 (최우선 - 1-2주 내)

| # | 기능 | 상세 | 상태 |
|---|------|------|------|
| 1 | **캘린더 뷰** | 한눈에 경기 일정 확인. "당장 오늘 어느링크장 몇시에 대관있는지" 캘린더로 바로 확인 | `[x]` |
| 2 | **전국 링크장 지도** | 협회사이트에도 없는 링크장 지도. 내 위치 기반 가까운 링크장 검색, 풀링크 + 미니링크 지원 | `[x]` |
| 3 | **전국 게스트 매칭** | 동호회 시스템 기반 게스트 참여. 동호회 생성/가입, 멤버/게스트 구분, 온보딩 플로우 | `[x]` |

### 🟠 P1 (핵심 - 2-4주)

| # | 기능 | 상세 | 상태 |
|---|------|------|------|
| 4 | **푸시 알림 시스템** | 관리자가 대관 새경기 생성하면 이용자한테 알림. 밴드만드는운영자가 중요공지 올렸을때만 전체 알림. 개인이 글올리는건 따로 알림이 안가서 이용자가 수시로 들어와서 확인해야지만 알수있음 → 해결 | `[x]` (PWA/iOS/Android 가이드 완료) |
| 5 | **운영진 공지 관리** | 공지가 카톡 대화에 묻혀 휘발되지 않도록 고정 공지 기능 | `[x]` (동호회 공지) |
| 6 | **반복 경기 템플릿 (복붙개념)** | "같은요일 같은시간 같은링크장 매주 진행되는경우가 많으니 그걸 복붙개념" - 정기 경기 자동 생성 | `[ ]` |
| 7 | **대기자 자동 승격** | 참가자 취소 시 대기자 자동 컨펌 + 알림 | `[ ]` |
| 8 | **신청자 프로필 정보** | 어느팀, 그팀의 디비전, 주포지션 표시 | `[ ]` |

### 🟣 P7. UI/UX 디자인 통일 (UI Polish)
- **필터 동작**: 특정 날짜 클릭 시 해당 날짜만 필터링. 전체 클릭 시 필터 해제. 직관성 개선.
- **카드 스타일**: 모든 카드형 UI(`MatchCard`, `ClubCard` 등)를 **`rounded-xl`**로 통일.
- **인터랙션**: Hover 시 **`border-blue-500` + `shadow-md`** 효과를 공통 적용하여 프리미엄 느낌 강화.
- **버튼 스타일**: 주요 버튼의 곡률을 `rounded-xl`로 조정하여 카드와 조화롭게 변경.
- **아이콘 버튼 가드레일**: 아이콘 + 라벨 버튼은 모바일에서 절대 줄바꿈되면 안 됨. `whitespace-nowrap` + `truncate`를 기본으로 두고, 같은 그룹의 버튼은 폰트 크기와 아이콘 크기를 통일할 것. 특히 동호회 상세 액션 버튼은 shared style/harness를 재사용하고, 새 작업 시 한 버튼만 따로 스타일링하지 말 것.
- **헤더(Header)**:
    - 상단 포인트 바 제거, 오직 로고와 프로필 메뉴만 유지하여 깔끔함 확보.
    - 프로필 드롭다운 재구성: **Person(마이페이지) | Coin(포인트) | Tool(관리자)** 구조.
    - 언어 설정 버튼을 드롭다운에서 제거하고 **마이페이지 하단**으로 이동.
- **마이페이지**:
    - "OOO님, 안녕하세요! 👋" 형태의 개인화된 헤딩 적용.
    - 포인트 안내 문구 및 아이콘(동전) 개선.
    - 하단에 큼직한 언어 설정 버튼 배치.

### 🟢 P2 (성장 - 4주+)

| # | 기능 | 상세 | 상태 |
|---|------|------|------|
| 9 | **링크장 등록 요청** | 사용자가 없는 링크장 직접 등록 요청 ("김포링크장이 없나요 등록해봐야겠다") | `[ ]` |
| 10 | **그룹 레슨 / 하키 캠프 주최** | "윤정님 펀드하기 + 하키캠프같은것들도 여기서 주최가되면 좋겠네요..!" | `[ ]` |
| 11 | **게스트비 가이드라인** | "게스트비 3만원이상글은 못올리게 크게 공지" - 시장 표준화 유도 | `[ ]` |
| 12 | **블랙리스트 관리** | 지각/노쇼 상습자를 운영진이 체크하고 관리할 수 있는 기능 | `[ ]` |

### 🔵 P3 (검증됨 - 유지)

| # | 기능 | 상세 | 상태 |
|---|------|------|------| 
| ✅ | **카카오 로그인** | "가입필요없이 카톡으로 로그인" | `[x]` |
| ✅ | **실시간 신청자 수** | "그게 제일 핵심인듯해요" / "신청자수도 모집자 입장에선 편리하고" | `[x]` |
| ✅ | **관리자 신청/승인** | "우측상단이름 메뉴누르면 관리자 신청버튼있고 그거 바로 처리되거든요" | `[x]` |
| ✅ | **상황판 UI** | "마치 상황판 같아서 좋네요 ^^" | `[x]` |

---

## 🚨 결제/환불/노쇼 관리 - Pain Point & 해결 방안

> 2026.01.15 사용자 피드백 기반. 현재 **사업자 등록 미비**로 결제 모듈 연동 불가.

### 💢 현재 Pain Points

| 문제 | 상세 |
|------|------|
| **당일 취소 노쇼** | "운영진이 제일 골머리 아픈부분이 그거예요. 온다고 했다가 당일대부분저녁운동인데 몇시간전에 갑자기 못가요 해버리면" |
| **플레이어 구하기 어려움** | "플레이어 구할시간도 없고 돈도 안보내고" |
| **선입금 없는 신청** | "그래서 대부분 요즘은 그래도 신청할때 선입금을 받는 추세이긴한데" |
| **환불 정책 부재** | "당일취소는 환불안되도록 / 전날까지는 환불해주고" |

### ✅ 현재 제약사항 내 해결 방안

#### 1. 🏷️ 환불 정책 명시 시스템 (개발 가능)
```
- 경기 생성 시 "환불 정책" 필드 추가 (예: "당일취소 환불불가, 전날까지 100% 환불")
- 경기 상세 페이지에 정책 명확히 표시
- 참가 신청 시 정책 동의 체크박스
```

#### 2. 📋 블랙리스트/신뢰도 시스템 (개발 가능)
```
- 운영진 전용 메모 기능: 특정 사용자에 대한 비공개 메모 ("노쇼 이력 2회" 등)
- 참가자 목록에 운영진에게만 보이는 ⚠️ 아이콘 표시
- 전체 공개 X, 운영진끼리만 공유되는 정보
```

#### 3. 💵 입금 확인 시스템 강화 (개발 가능)
```
- "입금확인" 상태가 되어야만 "참가 확정" 처리
- 미입금자는 별도 색상/상태로 표시 (현재도 일부 구현)
- 경기 X시간 전 미입금자 자동 알림 발송
```

#### 4. ⏰ 막판 할인가 모집 (개발 가능)
```
- 경기 당일 X시간 전부터 "급모집" 상태 활성화
- 할인가 표시 기능 (원가 30,000원 → 할인가 20,000원)
- 급하게 올 수 있는 사람 유도
```

#### 5. 📊 신청자 통계/이력 (개발 가능)
```
- 사용자별 참가 이력 조회 (취소율, 노쇼율)
- 운영진에게만 보이는 신뢰도 점수
- 신규 가입자 vs 기존 참여자 구분 표시
```

### 🔮 장기적 해결 (사업자 등록 후)

| 기능 | 설명 |
|------|------|
| **온라인 결제 연동** | 토스/카카오페이 등 PG 연동으로 선결제 처리 |
| **자동 환불 시스템** | 취소 시점에 따라 자동 환불률 적용 |
| **정산 시스템** | 동호회 운영측에 수수료 제외 후 정산 |
| **수수료 모델** | "이용자들이 뛰는사람들은 수수료 천원씩 받으면될거타고 될거같고" |

---

### 💡 추가 아이디어 (미래)

| 아이디어 | 출처 |
|----------|------|
| 운영자 자발적 등록 분위기 조성 | "핵심은 운영자분들이 이 어플로오셔서 자발적으로 등록하는 분위기를 만들어야하는데" |
| 소문 바이럴 전략 | "근데 소문은금방날거예요" / "써본사람들이 편하면 쓸듯" |
| 한명 당 가치 제공 | "딱 한명만 플랫폼에 들어와도 가치를 느낄 수 있을만한 거 한개가 더 있으면 좋을것같은데요" |
| 도메인 변경 | "도메인 조금 괜찮아보이는 것으로 변경하고 하면" |
| 수수료 심리적 저항 낮춤 | "처음부터 수수료를 딱정해서 받아야지 아니면 무료로 쓰다가 나중에 돈내라 그러면반감을 살테니" |

---

### 📋 개발 진행 방식

1. 각 피쳐 작업 시작 전 `상태` 를 `[/]` 로 변경
2. 작업 완료 시 `[x]` 로 변경
3. 관련 스키마 변경은 `sql/` 디렉토리에 버전별로 기록 (예: `v11_새기능.sql`)
4. i18n 키는 `messages/ko.json`, `messages/en.json` 동시 추가

---

## 📁 SQL 스키마 파일 구조

모든 데이터베이스 스키마 파일은 `sql/` 디렉토리에 버전 순서대로 정리되어 있습니다.

| 파일명 | 설명 |
|--------|------|
| `v1_schema.sql` | 초기 스키마 (profiles, matches, participants, rinks) |
| `v2_schema_changes.sql` | 링크 테이블 확장, 클럽 시스템 추가 |
| `v3_schema_changes_v2.sql` | max_skaters/max_goalies 통합 |
| `v4_schema_clubs_v2.sql` | 동호회 시스템 개선 |
| `v5_schema_clubs_v3.sql` | 동호회 시스템 추가 개선 |
| `v6_rink_updates.sql` | 링크 정보 업데이트 |
| `v7_schema_push.sql` | 푸시 알림 스키마 |
| `v8_schema_points_step1.sql` | 포인트 시스템 ENUM 추가 (먼저 실행) |
| `v9_schema_points_step2.sql` | 포인트 시스템 테이블/RLS/함수 |
| `v10_schema_superuser_fix.sql` | SuperUser RLS 권한 추가 |

**새 스키마 추가 시**: `v{다음번호}_{설명}.sql` 형식으로 파일 생성

---

## 🔒 Push Notification Security (RPC)

> **Context**: Regular users (e.g., User A) need to trigger notifications to other users (e.g., User B) or Admins. However, RLS policies prevent User A from reading User B's push tokens.

Instead of using a hazardous `SUPABASE_SERVICE_ROLE_KEY` in the application, we use a **SECURITY DEFINER RPC Function**.

### 1. The Problem
- `push_subscriptions` table has RLS enabled (Users can only see their own).
- When User A invites User B, User A's session tries to select User B's tokens -> **Blocked**.

### 2. The Solution: `get_user_push_tokens`
- A PostgreSQL function defined with `SECURITY DEFINER`.
- It runs with the privileges of the database owner (Admin), bypassing RLS.
- **Scope**: Strictly limited to selecting `endpoint`, `p256dh`, `auth` for a specific `user_id`.

```typescript
// src/app/actions/push.ts
const { data } = await supabase.rpc("get_user_push_tokens", { target_user_id: userId });
```

### 3. Critical Requirement
- The SQL file `sql/v18_secure_push_rpc.sql` MUST be applied to the database for push notifications to work.

---

## 💰 포인트 시스템 (Point System)

> 2026.01.19 구현 완료. 사업자등록 전까지 직접 결제 모듈 대신 포인트 충전 시스템으로 운영.

### 시스템 개요

```
사용자 → 포인트 충전 요청 → 은행 이체 → SuperUser 확인 → 포인트 적립
사용자 → 경기 참가 → 포인트 차감
사용자 → 경기 취소 → 환불 정책에 따라 포인트 환불
```

### 주요 테이블

| 테이블 | 설명 |
|--------|------|
| `profiles.points` | 사용자 보유 포인트 |
| `matches.entry_points` | 경기 참가비 (포인트) |
| `point_transactions` | 포인트 거래 내역 (charge/use/refund/admin_adjustment) |
| `point_charge_requests` | 포인트 충전 요청 (pending/confirmed/rejected/canceled) |
| `platform_settings` | 플랫폼 설정 (bank_account, refund_policy) |

### 역할 (Roles)

| 역할 | 권한 |
|------|------|
| `user` | 일반 사용자 (기본) |
| `admin` | 동호회 관리자 (경기/링크/동호회 CRUD) |
| `superuser` | 플랫폼 관리자 (admin 권한 + 포인트 충전 확인 + 플랫폼 설정) |

> ⚠️ **중요**: `superuser`는 `admin`의 상위 개념입니다.
> - **superuser는 admin이 할 수 있는 모든 작업을 수행할 수 있습니다.**
> - 코드에서 권한 체크 시 반드시 `superuser`도 포함해야 합니다.
> - 예시: `if (role !== "admin" && role !== "superuser")` 또는 `if (!["admin", "superuser"].includes(role))`
> - superuser 전용 기능(포인트 충전 확인 등)은 별도로 `checkIsSuperUser()`로 체크합니다.

### 주요 파일

| 경로 | 설명 |
|------|------|
| `src/app/actions/points.ts` | 포인트 조회/충전 요청/히스토리 서버 액션 |
| `src/app/actions/superuser.ts` | SuperUser 전용 서버 액션 (충전 확인/거부, 설정 관리) |
| `src/app/[locale]/(public)/mypage/points/page.tsx` | 사용자 포인트 히스토리 페이지 |
| `src/app/[locale]/(public)/mypage/points/charge/page.tsx` | 포인트 충전 신청 페이지 |
| `src/app/[locale]/(admin)/admin/settings/page.tsx` | SuperUser 플랫폼 설정 페이지 |
| `src/app/[locale]/(admin)/admin/charge-requests/page.tsx` | SuperUser 충전 요청 관리 |
| `src/components/charge-form.tsx` | 포인트 충전 폼 (계좌 복사 기능 포함) |
| `src/components/settings-form.tsx` | 플랫폼 설정 폼 (계좌/환불정책) |

### 환불 정책

- SuperUser가 `/admin/settings`에서 설정
- 예: 24시간 전 100%, 6시간 전 50%, 당일 0%
- `platform_settings.refund_policy`에 JSONB로 저장
- 경기 취소 시 `calculateRefundPercent()` 함수로 계산

### SuperUser 설정 방법

```sql
-- Supabase SQL Editor에서 실행
UPDATE profiles SET role = 'superuser' WHERE email = 'your-email@example.com';
```

---

## 📋 TODO 2026.01.20 - 사용자 피드백 기반 구현 계획

> 조윤정님(아이스하키) 카카오톡 피드백 기반. "운영자+참가자 둘다 편해지는 구조" 목표.

### 🔴 P0. 신청 플로우 개선 (핵심!) - 🚧 진행중

**현재 문제점:**
```
대관 발견 → 신청 클릭 → 포인트 부족 → 충전 페이지 → 이체 → 관리자 확인 대기 → 다시 대관 찾아서 신청
= "번거로움 + 이탈" 우려
```

**개선 목표 (티머니/선불카드 개념):**
```
신청 클릭 → 포인트 부족 시 충전 → 바로 신청 완료 (대기 상태) → 관리자 확인 → 확정 + 인원수 카운트
= "한번만 신청하면 끝"
```

#### ✅ 완료된 구현:

| 파일 | 변경 내용 | 상태 |
|------|----------|------|
| `sql/v11_participant_payment_flow.sql` | `pending_payment` ENUM 추가 + profiles 컬럼 확장 | `[x]` |
| `src/app/actions/match.ts` joinMatch | 포인트 충분→confirmed, 부족→pending_payment 분기 | `[x]` |
| `src/app/actions/match.ts` cancelJoin | pending_payment면 환불 없이 삭제 | `[x]` |
| `src/app/actions/cache.ts` | 인원수 카운트 `confirmed`만 포함 (pending_payment 제외) | `[x]` |
| `src/app/actions/superuser.ts` | `confirmParticipantPayment`, `cancelPendingParticipant`, `getPendingPaymentParticipants` 함수 추가 | `[x]` |
| `src/components/match-application.tsx` | `currentStatus` prop 추가, pending_payment용 노란색 UI 추가 | `[x]` |

#### ✅ 남은 구현 (완료됨):

| 파일 | 변경 내용 | 상태 |
|------|----------|------|
| `src/app/[locale]/(public)/match/[id]/page.tsx` | 1) 참가자 필터에 pending_payment 포함 2) currentStatus prop 전달 3) 참가자 목록에 "입금 대기" 배지 추가 | `[x]` |
| `src/app/[locale]/(admin)/admin/charge-requests/page.tsx` | 미입금 참가자 섹션 추가 (확인/취소 버튼) | `[x]` |
| `messages/ko.json`, `messages/en.json` | pending_payment 관련 번역 추가 | `[x]` |
| **SQL 실행** | `v11_participant_payment_flow.sql` Supabase에서 실행 필요 | `[x]` |

#### 🔧 추가 변경 사항:

- `src/app/actions/match.ts`: MatchParticipant.status에 `pending_payment` 추가
- `src/app/actions/mypage.ts`: MyMatch.participation.status에 `pending_payment` 추가  
- `src/components/admin-participant-list.tsx`: Participant.status에 `pending_payment` 추가

---

### 🟠 P1. 대기자 시스템 (Waitlist)

**필요성:**
- "10명이 딱 맞춰야 하는데 안오면 사람이 비어"
- "그래서 대기자들도 있어서 대기도 걸수있게해놔야하는.."

#### 구현 상세:

| 항목 | 상세 | 상태 |
|------|------|------|
| **대기자 신청 기능** | 정원 마감 시 "대기 신청" 버튼 표시 | `[x]` |
| **participant.status: waiting** | 대기자 상태 추가 | `[x]` |
| **대기자 목록 표시** | 운영자 및 사용자에게 대기자 명단 표시 | `[x]` |
| **자동 승격** (P2) | 취소 발생 시 대기자 자동 승격 + 알림 (나중에) | `[ ]` |

---

### 🟠 P2. 프로필 설정 강제화

**요청사항:**
- "처음에 로그인하자마자 프로필 설정하기" 바로 해놓는게 좋을것같고
- "기본설정 무조건 해야하니까 기본설정 안되어있으면뜨는걸로"
- 현재: 경기 신청 시에만 온보딩 유도 → **개선: 로그인 후 어디서든 온보딩 미완료 시 유도**

#### 필수 프로필 정보:

| 필드 | 설명 | 현재 |
|------|------|------|
| `full_name` | 실명 (별명보다 실명 선호) | `[x]` |
| `phone` | 휴대폰번호 | `[x]` |
| `birth_date` | 생년월일 (나이 확인용) | `[x]` |
| `avatar_url` | 프로필 사진 (나중에 대화연결 용이) | `[ ]` (optional) |
| `position` | 주포지션 (운영진 참고용) | `[x]` |
| `terms_agreed` | 약관 동의 (개인정보 수집) | `[x]` |

#### 구현 상세:

| 항목 | 상세 | 상태 |
|------|------|------|
| **profiles 테이블 확장** | phone, birth_date, terms_agreed 컬럼 추가 | `[x]` |
| **온보딩 페이지 수정** | 필수 정보 입력 폼 + 약관 동의 체크박스 | `[x]` |
| **전역 온보딩 체크** | 모든 페이지에서 온보딩 미완료 시 온보딩 페이지로 리다이렉트 | `[x]` |

---

### 🟢 P3. 환불 정책 시간 개선

**요청사항:**
- "24시간 전 무료취소 인걸로 본거같은데 혹시 기준을 전일자정이내로 할 수 있을까요"
- 예: 21일 오후10시 경기 → **20일 자정까지** 무료취소 (24시간 전이면 20일 오후10시)
- "이것도 좋네요 저희입장에서도 관리하기가 저게 더 편할듯요"

#### 구현 상세:

| 항목 | 상세 | 상태 |
|------|------|------|
| **refund_policy 구조 변경** | `hoursBeforeMatch` → `daysBeforeMatch` 또는 `deadlineType: 'midnight'` (코드 레벨 적용) | `[x]` |
| **환불 계산 함수 수정** | `calculateRefundPercent()` - 경기 전날 자정 기준으로 계산 | `[x]` |
| **설정 UI 수정** | 관리자 설정에서 "X일 전 자정까지" 형식으로 입력 | `[ ]` |

---

### 🟢 P4. SEO 및 도메인 변경 (Domain Migration)

**요청사항:**
- "도메인도 https://powerplay.kr/ 로 신규로 변경했어"
- 검색엔진 최적화(SEO) 및 OG 이미지 교체

#### 구현 상세:

| 항목 | 상세 | 상태 |
|------|------|------|
| **도메인 변경** | 코드 내 Fallback URL 변경 (`pphockey` -> `powerplay.kr`) | `[x]` |
| **SEO 설정** | `src/app/robots.ts`, `sitemap.ts`, `layout.tsx` 업데이트 | `[x]` |
| **OG 이미지** | 신규 디자인(한국어 부제) 적용 (`public/og-image.png`) | `[x]` |
| **등록 가이드** | `SEO_GUIDE.md` 및 `layout.tsx` 검증 태그 추가 | `[x]` |

### 🟢 P5. 알림 온보딩 및 가이드 (Notification Guide)

**필요성:**
- iOS(iPhone)는 PWA(홈 화면에 추가) 상태에서만 푸시 알림 수신 가능.
- 사용자가 이를 모르고 "왜 알림이 안 오지?" 할 수 있음.
- 접근성 높은 가이드 필요.

#### 구현 상세:

| 항목 | 상세 | 상태 |
|---|------|------|
| **가이드 모달** | `NotificationGuideModal`: OS 감지(iOS/Android) 후 맞춤 안내(홈 화면 추가법 등) 제공 | `[x]` |
| **온보딩 로직** | `NotificationContext`: 최초 방문자에게 자동 팝업, `localStorage`로 재노출 방지 | `[x]` |
| **접근성** | 헤더 메뉴(`알림 설정 가이드`) 및 마이페이지(`알림 설정 확인`)에서 언제든 재호출 가능 | `[x]` |
| **VAPID 설정** | `.env`에 `VAPID_SUBJECT` 등 필수 키 설정 가이드 제공 | `[x]` |

### 📌 구현 우선순위 요약

```
1. [P0] 신청 플로우 개선 - "한번만 신청" 이 핵심
2. [P1] 대기자 시스템 - 운영자 필수 기능
3. [P2] 프로필 강제화 - UX 개선 + 개인정보 수집
4. [P3] 환불 정책 시간 - 관리 편의성
```

### 🎯 파워플레이 비전 (피드백에서 추출)

> **파워플레이는 아이스하키 대관운영자가 모집·정산·명단 관리를 자동화하고,  
> 참가자는 신청부터 결제까지 한 번에 끝낼 수 있는 아이스하키 운영 플랫폼**

**하키러브밴드 (기존):** 공지 → 개개인연락 → 입금확인 → 명단수정 → 재공지 = 사람 갈아서 굴리는 구조  
**파워플레이 (목표):** 신청 → 결제 → 확정 → 자동카운트 마감 = 플랫폼이 일하는 구조

---

## 🚨 장애 보고

### [2026-04-04] iOS PWA Push Registration Failed Until Service Worker Precache Was Disabled
- **Summary**: iPhone 홈 화면 PWA에서 푸시 권한 허용 후에도 기기 등록이 실패했다. 원인은 Serwist 서비스 워커의 precache 설치 단계가 iOS PWA에서 activation을 지연/실패시키며 `pushManager.subscribe()`가 요구하는 active service worker를 만들지 못한 것이었다.
- **Symptoms**:
  - `설정 중...` 상태가 오래 유지되거나 재등록 UI로 되돌아감
  - `Timed out while waiting for the service worker to become ready`
  - `Subscribing for push requires an active service worker`
  - 동일 계정에 다른 기기 subscription이 있어도 현재 iPhone PWA는 subscription을 생성하지 못함
- **Root Cause**:
  - 기존 `src/app/sw.ts`는 `precacheEntries: self.__SW_MANIFEST` 기반으로 빌드 산출물을 install 시점에 precache했다.
  - iOS PWA에서는 이 precache 작업이 service worker의 `install -> activate`를 블로킹하거나 과도하게 지연시키는 것으로 보였다.
  - 푸시 구독은 active service worker가 필요하므로, precache가 끝나지 않으면 `navigator.serviceWorker.ready` 대기 또는 `pushManager.subscribe()` 호출이 실패한다.
- **Resolution**:
  - `src/app/sw.ts`에서 `precacheEntries`를 빈 배열로 변경했다.
  - 현재 설정:
    - `precacheEntries: []`
    - `runtimeCaching: defaultCache`
  - 의미:
    - install 단계의 대규모 precache를 제거해 service worker가 빠르게 active 되도록 함
    - 대신 runtime caching으로 사용자가 실제 방문한 리소스는 계속 캐싱되므로 실사용엔 큰 영향이 없음
- **Why It Works**:
  - push 등록 시점에 active service worker 확보가 가장 중요했는데, precache 제거로 install 부담이 사라지면서 iOS PWA에서도 activation이 통과하게 됨
  - 즉, 문제의 본질은 푸시 API 자체가 아니라 precache-heavy SW install lifecycle이었음
- **Do Not Reintroduce Without Verification**:
  - iOS PWA push 등록 흐름이 중요한 상태에서 `precacheEntries: self.__SW_MANIFEST` 또는 대규모 precache 전략을 다시 넣지 말 것
  - precache 재도입이 필요하면 iPhone 홈 화면 PWA 실기기에서 반드시 다음을 재검증할 것:
    - 첫 설치 직후 push permission 요청
    - `pushManager.subscribe()` 성공 여부
    - `/admin/push-test` 실발송 수신 여부

---

## 📝 Agent Handover Log

> **Latest work log for the next agent.**

<!-- Add new logs below this line -->

### [2026-03-30] Superuser Chat Monitoring and Global Unread Chat Signals
- **Summary**: Added a superuser-only chat monitoring tab for manual follow-up workflows, and strengthened in-app unread chat visibility with a global badge and toast.
- **Changes**:
  - Added `getSuperuserChatRooms` in `src/app/actions/superuser.ts` to load chat room participants, unread recipients, and contact info without exposing chat contents.
  - Extended `src/app/[locale]/(admin)/admin/admins/page.tsx` with a third `chat` tab and added `src/components/superuser-chat-tab.tsx` for profile links plus manual SMS-copy templates.
  - Added a direct superuser menu entry to the chat monitoring tab in `src/app/[locale]/(admin)/admin/layout.tsx` and `src/components/admin-superuser-menu.tsx`.
  - Added `ChatUnreadProvider` in `src/contexts/chat-unread-context.tsx`, wired it into `src/app/[locale]/layout.tsx`, and surfaced unread counts on `src/components/bottom-nav.tsx` with a realtime toast for new incoming messages outside the active room.
  - Updated `src/app/[locale]/(admin)/admin/admins/[id]/page.tsx` so the detail header badge reflects the target user role (`USER` / `ADMIN` / `SUPERUSER`) instead of always showing `ADMIN`.
  - Added chat toast and admin menu copy keys to `messages/ko.json` and `messages/en.json`.
- **Notes**:
  - Initial implementation only showed rooms the logged-in superuser personally participated in because `chat_rooms` / `chat_messages` RLS still applied to the server action query.
  - Added `sql/v42_superuser_chat_monitoring_rpc.sql` with security-definer RPCs for room metadata and unread-recipient summaries. This migration must be applied for superuser chat monitoring to show all users' rooms.
  - `npm run typecheck` passes.
  - Targeted ESLint for touched files passes except for one pre-existing warning on `src/app/[locale]/(admin)/admin/admins/[id]/page.tsx` about an existing `<img>` element.

### [2026-03-28] Lounge Event Cards Show Capacity and Description Fallbacks
- **Summary**: Improved public lounge event cards so schedule copy and capacity are more visible across the list and business detail experiences.
- **Changes**:
  - Updated `src/components/lounge-event-card.tsx` to show `max_participants` as a capacity badge when provided.
  - Added fallback preview logic so list cards use the first non-empty line of `description` when `summary` is empty.
  - Enabled richer detail rendering on the business detail page so event cards can show full `description` content in addition to summary and capacity.
- **Notes**:
  - The main lounge events tab still uses compact cards; the expanded description block is only enabled from the business detail page schedule list.

### [2026-03-27] Lounge Membership Target Expanded to Superusers
- **Summary**: Superuser lounge registration can now target both `admin` and `superuser` accounts from the superuser management page.
- **Changes**:
  - Added a lounge-specific eligible account fetch in `src/app/actions/lounge.ts` so `/admin/lounge-management` includes both roles in the contract target selector.
  - Hardened `upsertLoungeMembership` to reject non-admin-level targets even if a form is tampered with.
  - Added `sql/v41_lounge_membership_role_guard.sql` to enforce the same rule in Supabase with a trigger, while explicitly allowing `superuser`.
- **Notes**:
  - The database should apply `sql/v41_lounge_membership_role_guard.sql` so Supabase enforces the same admin-or-superuser rule as the app.

### [2026-03-25] Lounge Youth Club Category Added
- **Summary**: Added `유소년 클럽 / Youth Club` as the new highest-priority lounge business category across public and admin flows.
- **Changes**:
  - Added shared category definitions in `src/lib/lounge-business-category.ts` so labels, filter order, and priority stay consistent.
  - Updated lounge public list/detail/admin surfaces to show the new category and place it ahead of `레슨`.
  - Updated public lounge sorting in `src/app/actions/lounge.ts` so `featured` items still stay first, then `youth_club` businesses are prioritized over other categories.
  - Added `sql/v40_lounge_business_category_youth_club.sql` to expand the `lounge_businesses.category` check constraint.
  - Updated lounge brochure/admin guide/bootstrap docs and QA checklist to reference the new category and migration.
- **Notes**:
  - The database must apply `sql/v40_lounge_business_category_youth_club.sql` before admins can save a `youth_club` business.

### [2026-03-18] Search Indexing Hardening for Clubs and Matches
- **Summary**: Reduced crawl-budget waste on match detail pages and strengthened internal linking to club detail pages without changing the main home-tab UX.
- **Changes**:
  - Added public cached club fetch helpers in `src/lib/public-clubs.ts` and moved `clubs/[id]` detail to ISR-style rendering with `revalidate = 900`.
  - Added `src/app/[locale]/(public)/clubs/page.tsx` as a crawlable club directory hub page.
  - Updated `src/app/sitemap.ts` so match URLs submitted to search engines are limited to `open + future` matches instead of all non-canceled matches.
  - Updated `src/app/[locale]/(public)/match/[id]/page.tsx` so past/closed/canceled matches return `robots.index = false`.
  - Strengthened internal links from `src/components/match-card.tsx` and match detail so club badges/logo-name blocks link directly to club detail pages.
  - Kept the home screen tab UX unchanged; removed temporary home-level club discovery section.
  - Added `revalidateTag("clubs")` invalidation in `src/app/actions/clubs.ts` for club create/update/notice/member changes.
- **Notes**:
  - Search Console reindex should focus on `/sitemap.xml`, `/ko/clubs`, `/en/clubs`, representative `/clubs/[id]`, and a few `open` match pages first.
  - This work is primarily SEO/indexing infrastructure; user-facing behavior change is limited to club links becoming clickable from match surfaces.

### [2026-03-18] Commit Harness Hardening for Next 16 Cache APIs
- **Summary**: Added lightweight pre-commit verification after a production build failure caused by `revalidateTag` argument mismatch.
- **Changes**:
  - Added `typecheck` and `verify` scripts to `package.json`.
  - Added `.githooks/pre-commit` to run `npm run typecheck` before commits.
  - Updated `AGENTS.md` guidance so agents treat `typecheck` as mandatory before commit when touching typed server code.
- **Notes**:
  - `npm run build` can still fail in sandbox if Google Fonts fetch is blocked; `typecheck` is the minimum required gate for catching Next.js API signature regressions.

### [2026-02-02] Setup Agent Handover Workflow
- **Summary**: Established the Agent Handover Protocol to ensure context continuity between sessions.
- **Changes**:
  - Created `.agent/workflows/agent_handover.md`: Defines the protocol.
  - Updated `AGENTS.md`: Added the "Agent Handover Log" section.
### [2026-02-02] Update PWA Install Prompt with TTL
- **Summary**: Modified the PWA install prompt to reappear after 1 hour if dismissed, instead of being permanently hidden.
- **Changes**:
  - Modified `src/components/install-prompt.tsx`:
    - Added `DISMISS_TTL` (1 hour).
    - Updated dismissal check to compare current time with stored timestamp.
    - Updated `handleDismiss` and installation handler to store `Date.now()` instead of `"true"`.
- **Next Steps**: Monitor user feedback to see if the prompt is too intrusive or helpful.

### [2026-02-03] Refine Rink Filter, Terminology, and Match Detail
- **Summary**: Refined the Rink Filter logic to only show rinks for future matches, standardized "경기장" to "링크장", improved filter UI, and improved address availability.
- **Changes**:
  - **Rink Filter Logic**: Modified `home-client.tsx` and `rink-filter-drawer.tsx` to exclude rinks that only have past matches.
  - **Terminology**: Replaced all instances of "경기장" with "링크장" in `ko.json` and components for consistency.
  - **Filter UI**: Updated the filter chip container to use horizontal scrolling (`overflow-x-auto`) to fit multiple filters on one line.
  - **Address Display**:
    - **Rink Filter & Match Card**: Display "District" (e.g., "Seoul Gangnam-gu") below the rink name.
    - **Match Detail**: Added full address display below the map, aligned left with proper spacing.
  - **Bug Fix**: Updated `getMatch` in `src/app/actions/match.ts` to include the `address` field in the Rink query, fixing the missing address issue in the detail page.
### [2026-02-03] Enhance Rink Tab Experience & iOS PWA Guide
- **Summary**: Improved the Rink Tab UI/UX with better map interactions, list view layout, and data integration. Also updated the iOS PWA install guide.
- **Changes**:
  - **Rink Tab Features**: Integrated club data into Rink Map & List views.
  - **Map Interactions**: Added active markers (blue) for future matches/clubs, and auto-scroll to detail card on click.
  - **UI Improvements**: Redesigned list items (cleaner card, moved map button), standardized toggle button styles.
  - **Filtering**: Filtered out past matches from map detail and list views.
  - **iOS Guide**: Added "Open in Safari" step to the PWA install instructions.
- **Next Steps**: Gather user feedback on the new Rink Tab experience.
### [2026-02-05] Security Audit, Match Life-cycle Hardening & UI Polish
- **Summary**: Conducted a security audit on hard deletes, fixed a critical match cancellation bug, and refined match management constraints and UI.
- **Changes**:
  - **Security Audit**: Performed hard delete audit on `profiles`, `clubs`, and `matches`. Verified RLS policies for `admin` and `superuser` roles.
  - **Match Management**:
    - **Visibility**: Excluded 'canceled' matches from the public match list (`getCachedMatches`) and Rink Map details.
    - **Constraints**: Locked 'canceled' matches from editing. Disabled Edit/Cancel/Delete actions for completed matches in Admin UI.
    - **Goalie Free Setting**: Disabled the 'Goalie Free' toggle in the match edit form if goalies have already joined to prevent unfair changes.
  - **Critical Fixes**: 
    - Resolved a silent failure in `cancelMatchByAdmin` caused by an invalid SQL query (non-existent `entry_points` column in `participants`).
    - Added `v22_admin_superuser_matches_fix.sql` to explicitly grant both `admin` and `superuser` roles permission to update matches.
  - **UI/UX Enhancement**: Removed the nested scrollbar in the Rink Explorer list view, allowing it to use the full page scroll while keeping the map fixed at a proper viewport height.
- **Next Steps**: Monitor the points system for any edge cases during match cancellation and ensure notifications are delivered correctly.

### [2026-02-25] Equipment Rental Feature (체험 장비 대여) Implementation
- **Summary**: Implemented the end-to-end "Equipment Rental" feature (renamed to "Experience Equipment") to allow users to rent gear for matches.
- **Changes**:
  - **Schema**: Added `rental_available` and `rental_fee` to `matches` table. (`sql/v24_add_rental_options.sql`, `v25_add_rental_available.sql`)
  - **Admin UI**:
    - Added `Rental Available` toggle in `MatchForm` / `MatchEditForm`.
    - Made `Rental Fee` input conditional on the toggle.
    - Reordered form fields for better UX.
  - **User UI**:
    - Updated `MatchApplication` to support `rental_available` flag.
    - Implemented conditional rental option checkbox and fee display.
    - Added "Experience Equipment" badge to Match List and Details.
    - Added rental options to Waitlist application flow.
  - **Backend**:
    - Updated `joinMatch` and `joinWaitlist` actions to validate `rental_available` and calculate total cost (`Entry + Rental`).
    - Updated `promoteWaitlistUser` to handle rental fees during automatic promotion.
    - Fixed `pending_payment` logic to include rental fees in shortage calculation.
  - **Testing**:
    - Created `tests/unit/rental-logic.test.ts` (18 tests) verifying cost calculation, status logic, refund logic, and availability validation.
    - Created `tests/unit/waitlist-rental.test.ts` (8 tests) verifying waitlist promotion logic.
- **Next Steps**: Monitor the "Experience Equipment" usage and gather feedback on the rental fee pricing model.

### [2026-02-22] Add Participant Profile Details to Admin Views
- **Summary**: Enhanced the `AdminParticipantList` component used in Admin and SuperUser match cards to display detailed user profiles in a modal.
- **Changes**:
  - **Server Action**: Added `getParticipantProfile` in `src/app/actions/admin.ts` to asynchronously fetch profile information including Hockey Start Date, Bio, Stick Direction, and Detailed Positions.
  - **UI/UX**: Added a "[상세] (Details)" button next to confirmed participants in the admin list.
  - **Modal**: Built a modal component within `AdminParticipantList` displaying the fetched data clearly using existing i18n keys.
- **Next Steps**: Gather feedback from admins to see if these details help in balancing matches more effectively.

### [2026-02-22] Display Full Profile Details in User Management Tab
- **Summary**: Upgraded the `UserManagementTab` modal in the SuperUser dashboard to display all new hockey-related profile fields.
- **Changes**:
  - **Server Action Updates**: Modified the `getAllUsers` SELECT query in `src/app/actions/superuser.ts` to fetch `hockey_start_date`, `stick_direction`, `detailed_positions`, and a JOIN on `clubs`.
  - **Type Definition**: Updated the `UserProfile` interface to accurately type the newly fetched columns.
  - **Modal Refinements**: Added new `InfoItem` visual grid blocks to `user-management-tab.tsx` converting timestamps to relative experience periods ("X년 Y개월") and mapping database enum values to user-friendly Korean strings ("레프트", "FW" etc.).

### [2026-02-23] Onboarding Full-View Revamp
- **Summary**: Transformed the onboarding page to run as a full-screen view without headers or bottom navigation, while incorporating all new detailed profiling fields.
- **Changes**:
  - **Layout Isolation**: Moved the `onboarding` page routing directory natively outside of the `(public)` group to naturally shed any inherited Layout bindings.
  - **Form Updates**: Supercharged `OnboardingForm` to require `hockeyStartDate`, `stickDirection`, and `detailedPositions` in its validation logic before form submission is enabled. 
- **Next Steps**: Monitor sign-up completion rates.
### [2026-03-13] Codex Bootstrap Setup
- **Summary**: Added a Codex bootstrap layer so future agents can load the current architecture, env requirements, and task checklists quickly without depending on stale docs.
- **Changes**:
  - Added `.agent/skills/codex-bootstrap/SKILL.md`
  - Added `.agent/skills/codex-bootstrap/references/project-map.md`
  - Added `.agent/skills/codex-bootstrap/references/task-runbook.md`
  - Added `.agent/skills/codex-bootstrap/references/env-checklist.md`
  - Updated `.agent/workflows/agent_handover.md` to include the bootstrap skill
  - Expanded `.env.example` with current runtime variables
  - Added `npm run test`, `npm run test:watch`, `npm run typecheck`
  - Updated `README.md` and `AGENTS.md` to point to canonical sources
- **Next Steps**: Keep the bootstrap references aligned whenever major routes, env usage, or SQL milestones change.
### [2026-03-14] Lounge Foundation
- **Summary**: Started the new `라운지 / Lounge` premium membership feature on a dedicated branch with DB schema, public page, admin page, bottom-nav/banner entry points, and superuser membership management foundation.
- **Changes**:
  - Added `sql/v33_lounge_memberships.sql`
  - Added `src/app/actions/lounge.ts`
  - Added public route `src/app/[locale]/(public)/lounge/page.tsx`
  - Added admin route `src/app/[locale]/(admin)/admin/lounge/page.tsx`
  - Added lounge components for cards, calendar, CTA tracking, business/event forms, and membership manager
  - Updated `src/components/bottom-nav.tsx` and `src/components/feedback-banner.tsx` to expose Lounge
  - Updated `src/app/[locale]/(admin)/admin/layout.tsx` to expose admin Lounge entry
  - Updated `.agent/implementation/premium-showcase-hub.md` with the confirmed `라운지 / Lounge` naming and v1 scope
- **Next Steps**: Apply `sql/v33_lounge_memberships.sql`, review UI/UX in preview, then iterate on ranking/exposure rules, richer media handling, event editing, and analytics dashboards.
### [2026-03-14] Lounge Public Detail and CTA Metrics
- **Summary**: Strengthened the Lounge conversion funnel by adding business detail pages, tracked internal detail navigation, and more readable admin CTA metrics.
- **Changes**:
  - Added public route `src/app/[locale]/(public)/lounge/[businessId]/page.tsx`
  - Added `src/components/lounge-business-detail.tsx` for full public partner detail presentation
  - Added `src/components/lounge-detail-link.tsx` to track `detail` CTA clicks before internal navigation
  - Updated `src/components/lounge-card.tsx` and `src/components/lounge-event-card.tsx` to route users into business detail pages
  - Extended `src/app/actions/lounge.ts` with reusable active-business/event helpers, `getPublicLoungeBusinessDetail`, stronger detail-page revalidation, and safer event deletion ownership checks
  - Updated `src/app/[locale]/(admin)/admin/lounge/page.tsx` to show CTA click breakdown and simple CTR guidance
  - Updated `.agent/implementation/premium-showcase-hub.md` with the implemented state and remaining next slice
- **Next Steps**: Decide exposure ordering rules, add event editing, and expand analytics into date-based/event-based reporting.
### [2026-03-14] Lounge Priority, Source Attribution, and Event Editing
- **Summary**: Extended Lounge so partners can control exposure order, edit existing schedules, and inspect which entry points are driving Lounge interactions.
- **Changes**:
  - Added `sql/v34_lounge_priority_and_sources.sql`
  - Extended `src/app/actions/lounge.ts` with `display_priority`, source-aware metric tracking, and event upsert support
  - Updated `src/components/lounge-business-form.tsx` to edit business display priority
  - Rebuilt `src/components/lounge-event-form.tsx` to support create/edit/delete flows and event priority control
  - Updated Lounge public navigation entry points in `src/components/bottom-nav.tsx` and `src/components/feedback-banner.tsx` to pass Lounge source attribution
  - Updated public Lounge components to preserve and track source through list, detail, impression, and CTA flows
  - Updated `src/app/[locale]/(admin)/admin/lounge/page.tsx` to display source attribution alongside CTA metrics
  - Updated `.agent/implementation/premium-showcase-hub.md` with the new SQL dependency and current implemented scope
- **Next Steps**: Apply `sql/v34_lounge_priority_and_sources.sql`, then iterate on richer analytics filters and remote image optimization.
### [2026-03-14] Lounge Trend and Event Performance Analytics
- **Summary**: Expanded the admin Lounge analytics view so partners can see recent momentum and which specific schedules are generating engagement.
- **Changes**:
  - Extended `src/app/actions/lounge.ts` to build 7-day daily metrics and per-event performance summaries from `lounge_metrics`
  - Updated `src/app/[locale]/(admin)/admin/lounge/page.tsx` to render recent trend blocks and event-level CTR/impression/click summaries
  - Updated `.agent/implementation/premium-showcase-hub.md` to reflect that date trend and event performance are now implemented
- **Next Steps**: Add richer filtering windows, split impression-source vs click-source reporting more explicitly, and improve image delivery for partner media.
### [2026-03-14] Lounge Discovery Filters and Source Performance
- **Summary**: Improved public Lounge discovery with category filtering and surfaced source-level performance more explicitly in admin analytics.
- **Changes**:
  - Updated `src/components/lounge-page-client.tsx` with business category filters
  - Updated `src/components/lounge-card.tsx` and `src/components/lounge-event-card.tsx` to highlight featured items via `display_priority`
  - Extended `src/app/actions/lounge.ts` with per-source impression/click/CTR analytics rows
  - Updated `src/app/[locale]/(admin)/admin/lounge/page.tsx` to show source-level impressions, clicks, and CTR instead of a flat count only
  - Updated `.agent/implementation/premium-showcase-hub.md` with the expanded public/admin scope
- **Next Steps**: Add preview/testing checklist for manual QA and decide whether to localize/optimize partner images via `next/image` or keep remote `<img>` usage for flexibility.
### [2026-03-14] Lounge Manual QA Checklist
- **Summary**: Added a dedicated manual QA checklist so preview review can be done systematically across public flows, admin flows, analytics, mobile, and regressions.
- **Changes**:
  - Added `.agent/implementation/lounge-qa-checklist.md`
  - Updated `.agent/implementation/premium-showcase-hub.md` to mark `v34` as applied and point to the QA checklist
- **Next Steps**: Use the checklist during preview review, collect UX/product feedback, then iterate on issues in a focused batch.
### [2026-03-14] Lounge Location and Map Foundation
- **Summary**: Added first-pass location support for Lounge so businesses and events can store map metadata and expose location context to users.
- **Changes**:
  - Added `sql/v35_lounge_location_maps.sql`
  - Extended `src/app/actions/lounge.ts` with business/event map fields
  - Updated `src/components/lounge-business-form.tsx` to parse Naver map URLs for business address/coordinates
  - Updated `src/components/lounge-event-form.tsx` to parse Naver map URLs for event address/coordinates
  - Added `src/components/lounge-location-map.tsx`
  - Updated public Lounge cards/detail components to show region text and embed compact maps in detail views
  - Updated `.agent/implementation/premium-showcase-hub.md` with the new SQL dependency and location scope
- **Next Steps**: Apply `sql/v35_lounge_location_maps.sql`, then tune public location UX density and consider nearby/location-based filtering.

<!-- OMX:RUNTIME:START -->
<session_context>
**Session:** omx-1775487976577-sqnydp | 2026-04-06T15:06:20.462Z

**Codebase Map:**
  src/: middleware
  src/app/: page, page, page, page, page, page, page, layout, page, page
  src/components/: admin-club-card, admin-club-notices, admin-controls, admin-match-card, admin-month-selector, admin-new-badge, admin-participant-list, admin-rink-card, admin-superuser-menu, admin-user-menu
  src/contexts/: chat-unread-context, notification-context
  src/i18n/: navigation, request, routing
  src/lib/: audit, bulk-match-utils, club-voting, daily-hockey-fortune, lounge-business-category, lounge-link-utils, match-entry-limit, public-clubs, public-rinks, push-subscription
  src/types/: supabase
  scripts/: capture-instagram-story, update-rinks
  tests/: supabase, admin-refund-fix.test, admin-refund-repro.test, bank-account.test, bulk-match-utils.test, club-voting.test, lounge-link-utils.test, rental-logic.test, superuser-match-filters.test, waitlist-rental.test
  (root): eslint.config, next.config, postcss.config, sentry.client.config, sentry.edge.config, sentry.server.config, s...

**Explore Command Preference:** enabled via `USE_OMX_EXPLORE_CMD` (default-on; opt out with `0`, `false`, `no`, or `off`)
- Advisory steering only: agents SHOULD treat `omx explore` as the default first stop for direct inspection and SHOULD reserve `omx sparkshell` for qualifying read-only shell-native tasks.
- For simple file/symbol lookups, use `omx explore` FIRST before attempting full code analysis.
- When the user asks for a simple read-only exploration task (file/symbol/pattern/relationship lookup), strongly prefer `omx explore` as the default surface.
- Explore examples: `omx explore...

**Compaction Protocol:**
Before context compaction, preserve critical state:
1. Write progress checkpoint via state_write MCP tool
2. Save key decisions to notepad via notepad_write_working
3. If context is >80% full, proactively checkpoint state
</session_context>
<!-- OMX:RUNTIME:END -->
