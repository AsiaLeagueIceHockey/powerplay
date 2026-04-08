# PRD — Power Play Hockey Tamagotchi v1

## Metadata
- Source spec: `.omx/specs/deep-interview-tamagotchi-dau-push-engagement.md`
- Planning mode: `$ralplan` consensus
- Scope: v1
- Brownfield anchors:
  - `src/app/[locale]/(public)/mypage/page.tsx`
  - `src/app/actions/fortune.ts`
  - `src/app/actions/push.ts`
  - `src/components/notification-status.tsx`
  - `src/components/push-manager.tsx`
  - `sql/v49_daily_hockey_fortunes.sql`

## RALPLAN-DR Summary

### Principles
1. Optimize for a **once-daily lightweight habit**, not a grind loop.
2. Keep v1 **forgiving**: soft decay, easy recovery, no punishment-heavy pet mechanics.
3. Preserve a **clear upgrade path** from placeholder UI and best-effort reminders to richer assets and stronger scheduling later.
4. Favor **server-truth + deterministic time-delta evaluation** over background mutation or client-only state.
5. Ship a loop that still works **without push permission**; push is an enhancer, not a dependency.

### Decision Drivers
1. Increase **daily return behavior** with minimal friction.
2. Fit naturally into the existing **MyPage + daily fortune** brownfield surface.
3. Avoid overbuilding infra for v1 while keeping the architecture extendable.

### Viable Options

#### Option A — Reuse the existing daily fortune pattern heavily, store tamagotchi state in a single new per-user snapshot table, queue reminders separately
- Pros:
  - Closest to current repo precedent
  - Smallest product surface change
  - Easy to localize and render in MyPage + detail page
- Cons:
  - Snapshot-only design can become awkward if actions/history/analytics evolve
  - Needs discipline around idempotency and time-delta recompute rules

#### Option B — Dedicated snapshot + reminder queue, with minimal action logging only if needed
- Pros:
  - Clean separation of current state, analytics history, and notification intent
  - Easier future expansion to richer growth/variants/rewards
  - Cleaner testability for idempotency and reminder dispatch
- Cons:
  - More schema and server-action complexity for v1
  - Slightly longer implementation and verification path

#### Option C — Client-heavy/localStorage-first prototype with optional server sync
- Pros:
  - Fastest visual prototype
  - Minimal backend work
- Cons:
  - Weak cross-device consistency
  - Poor analytics trustworthiness
  - Push/reminder integration becomes awkward
  - Conflicts with authenticated product expectations

### Recommendation
Choose **Option B**, but keep the domain intentionally small.

**Why:** The feature’s habit loop is simple, but two areas make a dedicated model worth it even in v1: (1) time-delta state recompute with idempotent actions, and (2) best-effort delayed reminders that should not be entangled with UI state. Option B keeps the current state, action history, and reminder intent separate while still fitting the repo’s existing patterns.

### Alternative invalidation rationale
- Option C is rejected because client-first state undermines the very goals of cross-session habit measurement and push-driven return.
- Option A is viable, but its compressed snapshot model becomes brittle as soon as training rotation, special meal outcomes, and reminder dedupe rules need independent testing.

---

## Product Goal
Introduce a hockey-themed tamagotchi loop inside MyPage that makes users want to check in once per day, enjoy a small branded interaction, and optionally return again through a best-effort reminder push.

## User Outcome
When a logged-in user opens MyPage, they should see a clear entry into the new tamagotchi feature. On the tamagotchi page, they can immediately understand the pet’s current condition, perform both daily actions (feed + training), receive a satisfying reaction, and leave feeling there is something fresh to check tomorrow.

## In Scope
- New MyPage entry point to a dedicated tamagotchi page
- Placeholder floating pixel character UI
- Deterministic server-side time-delta state evaluation
- Two core actions per visit:
  - feed
  - train
- Rotating hockey-themed training variants
- Occasional special meal variants linked to results/context
- Soft decay on missed days
- Best-effort 8-hour reminder intent after actions
- KR/EN localization
- Basic analytics events for habit tracking

## Out of Scope
- Competitive systems, leaderboards, clubs/points deep linkage
- Multiple pets or collection systems
- Harsh failure/death/reset loops
- Exact-on-time reminder guarantees
- Asset-heavy pixel art production

## Target User Stories
1. As a returning player, I want to quickly see my hockey pet’s condition so I have a reason to open MyPage daily.
2. As a user, I want the training action to feel hockey-specific so the feature feels native to Power Play.
3. As a user without push enabled, I still want the feature to feel complete.
4. As a user with push enabled, I want a gentle reminder later so I remember to return without feeling spammed.

## UX / Flow
### Entry
- Add a tamagotchi card/banner in `mypage/page.tsx`, likely adjacent to the existing daily fortune banner rather than buried below low-priority settings.
- Card states:
  - first-time CTA
  - ready-to-check status
  - post-action “come back later” state

### Detail page
Route proposal:
- `src/app/[locale]/mypage/tamagotchi/page.tsx`

Layout:
- top summary (name/title/status)
- floating placeholder character stage
- state chips/bars (2 or 3 dimensions)
- today’s training card
- feed action card
- result/reaction panel
- optional reminder hint / notification CTA when push missing

### Daily loop rules
- Feed and train are both available in one visit.
- Training variant rotates from a small seeded pool.
- Feeding may surface a special meal outcome occasionally.
- Each action produces a reaction payload (copy + visual state).
- Repeated taps should not double-apply effects after completion.

## Architecture

### Recommended domain model
Create dedicated feature tables instead of extending `daily_hockey_fortunes`.

#### `tamagotchi_pets`
One row per user, current state snapshot.
Suggested columns:
- `id`
- `user_id` unique FK to `profiles`
- `nickname` nullable (future-proof; optional in v1)
- `energy`
- `condition`
- `mood` nullable or deferred depending on final implementation choice
- `last_decay_at`
- `last_interacted_at`
- `last_fed_at`
- `last_trained_at`
- `last_training_key`
- `pending_special_meal_key` nullable
- `created_at`
- `updated_at`

#### `tamagotchi_action_logs` (optional/minimal in v1)
Append-only action evidence / analytics support only if implementation needs explicit auditability beyond analytics events.
Suggested minimal columns if kept:
- `id`
- `user_id`
- `pet_id`
- `action_type` (`feed`, `train`)
- `variant_key`
- `delta_payload` jsonb
- `performed_at`
- `kst_date_key`
- `idempotency_key` unique

#### `tamagotchi_reminder_jobs`
Best-effort reminder intent queue.
Suggested columns:
- `id`
- `user_id`
- `pet_id`
- `trigger_action_type`
- `scheduled_for`
- `status` (`pending`, `sent`, `skipped`, `failed`, `canceled`)
- `dedupe_key` unique
- `payload` jsonb
- `last_attempt_at`
- `sent_at`
- `error_message`
- `created_at`

#### Optional seed source
Either:
- hardcoded TypeScript config in `src/lib/` for v1, or
- tiny static table later if content editing becomes necessary.

**Recommendation:** hardcoded config in code for v1; do not create admin CMS scope.

### State model recommendation
Use **2 core visible dimensions** in v1:
- `energy`
- `condition`

Keep `mood` as a derived/presentation layer or defer entirely.

Why:
- Matches the lightweight requirement
- Easier copy, UI, and decay logic
- Reduces overfitting on pseudo-depth

### Time-delta rule shape
On every read or action:
1. Load pet snapshot
2. Compute elapsed time from `last_decay_at` in KST-aware server logic
3. Apply soft decay in bounded steps
4. Persist normalized snapshot before rendering or action mutation

Properties:
- no background scheduler needed
- deterministic and testable
- no passive mutation while user is away

### Action rules
- `feed` can run once per defined cooldown window / day bucket
- `train` can run once per defined cooldown window / day bucket
- actions should use idempotency keys so retries do not duplicate effects
- training variant for the current day should be deterministic from seed inputs (user id + KST date key + pool version), unless product later wants reroll behavior

### Reminder strategy
Implement a **queue-backed, cron-ready, best-effort reminder path**.

Explicit rules:
- feed and train both completing in one visit must result in **at most one active reminder job** for the next reminder window
- after both daily actions are consumed, same-day revisit becomes **read-only / reaction-only**, not mutating
- dispatcher truthfulness > delivery aggressiveness: user/admin evidence must not imply a push was scheduled/sent unless an actual job exists or a real dispatch attempt happened

v1 behavior:
- When user completes an action, upsert a reminder job for ~8 hours later.
- Dispatcher function selects due pending jobs and sends push if the user currently has valid subscriptions.
- Because repo has no existing scheduler, v1 may trigger dispatcher opportunistically from safe server touchpoints and keep the code structured so a future Vercel cron / route handler can call the same dispatcher without refactor.

Why this is the best v1 compromise:
- avoids hard-coding reminder logic into UI actions
- gives a real queue model for dedupe/status visibility
- preserves a clean path to stronger delivery later

### Integration points
- MyPage entry card in `src/app/[locale]/(public)/mypage/page.tsx`
- New server actions file, likely `src/app/actions/tamagotchi.ts`
- New route under `src/app/[locale]/mypage/tamagotchi/`
- New lib modules for config + state math, likely:
  - `src/lib/tamagotchi-config.ts`
  - `src/lib/tamagotchi-state.ts`
  - `src/lib/tamagotchi-reminders.ts`

## Delivery plan

### Slice 1 — Schema + state engine
- Add next valid migration after checking duplicates around v45; expected target is `sql/v50_tamagotchi_v1.sql` unless numbering is already consumed
- Add tables + RLS + indexes
- Add pure state math utilities
- Add deterministic training/special-meal selection helpers

### Slice 2 — Server actions
- `getTamagotchiState(locale)`
- `feedTamagotchi()`
- `trainTamagotchi()`
- internal reminder enqueue / dispatcher helpers
- analytics event/log insertion

### Slice 3 — MyPage entry + page UI
- Add MyPage card/banner
- Add dedicated page route and screen component
- Add placeholder animation + reaction states
- Add notification prompt/fallback messaging for unsubscribed users

### Slice 4 — Verification + polish
- Unit tests for state math and action idempotency
- Integration-style tests for action gating / queue enqueue
- Manual QA for MyPage flow and push-disabled flow

## Analytics / Measurement plan
Minimum events:
- `tamagotchi_entry_impression`
- `tamagotchi_entry_click`
- `tamagotchi_page_view`
- `tamagotchi_feed`
- `tamagotchi_train`
- `tamagotchi_reminder_enqueued`
- `tamagotchi_reminder_sent`
- `tamagotchi_reminder_skipped`

Primary KPI proxy for v1:
- % of exposed users who perform at least one tamagotchi action on distinct KST days

Secondary signals:
- repeat action on day+1 / day+3 / day+7
- push-enabled users vs non-push users return delta
- entry CTR from MyPage

## Risks
1. **Action duplication** on retries/double taps if idempotency is skipped.
2. **Reminder jobs pile up** without dedupe/cancel rules.
3. **UI clutter** on MyPage if the entry is placed below too many existing sections.
4. **Weak novelty** if training rotation is too obviously repetitive.
5. **Push value failure** if no subscription-aware fallback UX exists.

## Mitigations
- Idempotency keys per action/day bucket
- one active pending reminder per user/pet/action window
- place entry near current high-value repeat-visit surface (fortune)
- ship a seed pool with enough copy variation, not one generic “train” string
- surface notification CTA/status near tamagotchi loop, not only in the settings section

## ADR
### Decision
Implement v1 with a **dedicated tamagotchi domain model**: current pet snapshot + reminder jobs queue, with minimal optional action logging only if implementation needs explicit auditability, surfaced via a new MyPage entry and detail page.

### Drivers
- Need deterministic time-delta state
- Need testable action idempotency
- Need best-effort delayed reminder path without overcommitting to full scheduler infra
- Need single-source-of-truth state with low enough schema complexity for a small v1 loop

### Alternatives considered
- Reuse a single fortune-like snapshot table only
- Client-heavy/localStorage prototype

### Why chosen
The dedicated-but-small domain best balances v1 simplicity with real backend requirements around state and reminders, while keeping action logging optional/minimal so v1 does not overfit future needs.

### Consequences
- Slightly more initial schema work
- Cleaner evolution path for richer content and more reliable reminders later
- Easier verification because state, history, and reminder status are separable

### Follow-ups
- Consider Vercel cron/route-handler dispatcher after v1 if reminder quality matters
- Consider richer art/stage evolution once the habit loop validates
- Consider deeper linkage to points/matches only after retention proof exists

## Architect review synthesis
### Steelman antithesis
A stricter minimalist could argue v1 should avoid an action log and reminder queue entirely: just persist one snapshot table and issue no delayed notifications until the loop proves value.

### Real tradeoff tension
- **Minimalism** reduces implementation time and verification burden.
- **Separation of concerns** reduces rewrite risk when reminders and analytics immediately matter.

### Synthesis
Keep the dedicated model, but minimize it ruthlessly:
- 2 visible state dimensions
- hardcoded content config
- queue-backed reminders without strong SLA promises
- no admin tooling

## Critic review result
**APPROVE** with these enforced qualities:
- alternatives are explicit and fairly bounded
- reminder reliability is not overstated
- acceptance/verification path is concrete
- v1 scope is protected against feature creep

## Available agent types roster
- `executor` — implementation / refactor
- `architect` — design review / risk checks
- `verifier` — completion evidence / validation
- `test-engineer` — test strategy / coverage
- `build-fixer` — build/type/lint issue resolution
- `writer` — docs / migration notes / QA notes

## Follow-up staffing guidance
### If using `$ralph`
Recommended sequential lane:
1. `executor` (high): schema + state math + server actions
2. `executor` (medium): MyPage entry + page UI + i18n
3. `test-engineer` (medium): tests + QA matrix refinement
4. `verifier` (high): final evidence pass
5. `build-fixer` (high, only if needed): fix residual type/lint/test issues

Suggested reasoning by phase:
- schema/state/reminder architecture: **high**
- UI wiring and i18n: **medium**
- verification: **high**

Launch hint:
- `$ralph .omx/plans/prd-tamagotchi-dau-push-engagement.md`

Verification path for Ralph:
- apply SQL migration review
- run targeted unit tests for state math / actions / reminders
- run `npm run typecheck`
- run `npm run lint`
- run relevant `npm run test`
- manual QA: MyPage entry, first-time user, repeat visit, no-push user, subscribed user, duplicate tap behavior

### If using `$team`
Suggested lanes:
- Lane 1 (`executor`, high): schema + state engine + reminder queue
- Lane 2 (`executor`, medium): MyPage entry + detail page UI + i18n
- Lane 3 (`test-engineer`, medium): tests + QA harness + event verification notes
- Shared review: `verifier` high after merge of all lanes

Suggested reasoning by lane:
- lane 1: **high**
- lane 2: **medium**
- lane 3: **medium**
- final verification: **high**

Launch hints:
- `$team .omx/plans/prd-tamagotchi-dau-push-engagement.md`
- or `omx team run .omx/plans/prd-tamagotchi-dau-push-engagement.md` if using explicit team runtime

Concrete team verification path:
1. Lane 1 proves schema and state math with tests
2. Lane 2 proves UI states and i18n wiring
3. Lane 3 proves regression coverage and QA checklist
4. `verifier` runs integrated review on merged result
5. final leader check runs typecheck/lint/tests + manual flow validation
