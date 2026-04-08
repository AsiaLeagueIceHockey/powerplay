# Test Spec — Power Play Hockey Tamagotchi v1

## Source
- PRD: `.omx/plans/prd-tamagotchi-dau-push-engagement.md`
- Deep interview spec: `.omx/specs/deep-interview-tamagotchi-dau-push-engagement.md`

## Verification goals
1. Prove the once-daily habit loop works without heavy punishment.
2. Prove state is derived deterministically from elapsed time.
3. Prove action application is idempotent and does not double-apply.
4. Prove reminder jobs are enqueued/deduped honestly, without overstating delivery guarantees.
5. Prove the feature is useful even when push is disabled or unavailable.

## Test layers

### Unit tests
#### State math
- decay applies based on elapsed KST time windows
- decay is bounded; values do not drop below configured minimums
- soft decay after missed day remains recoverable in one visit
- read normalization does not mutate unexpectedly when no time elapsed

#### Action rules
- feed applies exactly once per allowed window
- train applies exactly once per allowed window
- second identical request with same idempotency key is ignored / returns existing result
- feed + train can both be completed in same visit
- training variant selection is deterministic for the intended seed inputs
- special meal selection follows expected rarity / gating rules

#### Reminder logic
- action enqueues a due reminder job ~8 hours later
- feed + train completed in one visit still produce at most one active pending reminder job for the same reminder window
- duplicate actions do not create duplicate pending jobs for same window
- sent / canceled / skipped jobs are not resent incorrectly
- unsubscribed user jobs are skipped or remain honest in status handling per implementation choice
- dispatcher does not overstate delivery; status/copy reflect queue-vs-attempt truthfully

### Integration tests
#### Server actions
- first visit creates or hydrates pet state correctly
- repeat visit after elapsed time rehydrates decayed state correctly
- feed action updates snapshot + action log + reminder job
- train action updates snapshot + action log + reminder job
- unauthorized user paths fail safely

#### Route / page behavior
- MyPage shows tamagotchi entry for logged-in user
- tamagotchi page renders first-time state
- tamagotchi page renders repeat-visit state
- same-day revisit after both actions are exhausted is read-only / reaction-only and does not mutate state
- push-disabled state shows fallback CTA/copy without blocking actions

### Manual QA
1. First-time logged-in user sees entry card on MyPage.
2. Opening the page shows floating placeholder character and current state.
3. Feed action triggers reaction copy/visual state.
4. Train action shows one hockey-themed variant and corresponding reaction.
5. Completing both actions in one visit works.
6. Refresh/retry does not double-apply the action result.
7. Returning after enough elapsed time shows mild decay only.
8. User without push subscription can still complete the loop.
9. User with push subscription gets reminder job intent recorded; if dispatcher runs, notification copy/url are correct.
10. KR/EN copy renders correctly on entry and detail screens.

## Observability / evidence
- DB evidence:
  - pet snapshot row updated
  - action log rows inserted once
  - reminder job rows deduped correctly
- Application evidence:
  - server logs show reminder enqueue / dispatch attempt outcomes
- Product evidence:
  - analytics events for entry view, page view, feed, train, reminder enqueue

## Edge-case matrix
- no existing pet row
- stale pet row with large elapsed gap
- repeated click / retry on slow network
- push subscription missing
- push subscription expired
- locale switch after state exists
- same-day revisit after both actions already completed
- training pool key missing / invalid fallback

## Exit criteria
- Unit tests cover state math, actions, and reminder dedupe
- Integration coverage exists for first-time and repeat-visit flows
- Typecheck/lint/tests pass
- Manual QA confirms MyPage entry, detail flow, no-push fallback, and duplicate-tap safety
- Reminder design is documented as best-effort, not guaranteed
