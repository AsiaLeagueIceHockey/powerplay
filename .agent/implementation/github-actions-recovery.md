# GitHub Actions recovery — 2026-11-01

## Scope and acceptance

Restore the three scheduled Instagram capture jobs without changing the app UI,
vote storage, ranking rules, or production schema. Audit the other scheduled jobs
and provide repeatable historical month recovery. Verify all configured checks,
KST month boundaries, delivery failure reporting, and real Ubuntu browser startup.
Only this fix is released from `origin/main`; the existing design branch stays separate.

## Audit

- Monthly, daily, weekly capture: actual runs failed installing Playwright 1.58.2
  on Ubuntu 26.04 selected by `ubuntu-latest`. Pin jobs to Ubuntu 24.04.
- Monthly: 22:00 KST capture ran before voting closed and could skip entirely if
  cron started after midnight. Run on the first at 09:17 KST, targeting the previous
  completed KST month. Explicit `TARGET_MONTH` always overrides this default.
- All scheduled jobs: explicit read-only token permissions, 20-minute deadlines;
  Node scripts use Node 24 and the Node 24 Actions runtime (checkout/setup-node v7).
- Capture delivery: Slack errors now fail the job/heartbeat. Missing optional
  webhook still skips delivery. Keep generated PNGs as 30-day Actions artifacts,
  including when a later storage or Slack operation fails.
- Lounge aggregation: recent runs passed, but query/upsert/delete errors were
  swallowed. Stop immediately, preventing a false success heartbeat or deletion
  after a failed read/write. Existing incremental aggregation policy is unchanged.
- Match reminder: recent runs passed. Validate required secrets, quote environment
  variables, bound the request; no automatic retry of this non-idempotent send.
- UI checks exist only on `codex/design-system`, not deployed `main`; pin that
  branch's runner too. Do not ship its unrelated app changes with this recovery.
- Add secret-free Automation checks on workflow/script changes: actual Linux
  browser launch/render, typecheck, strict automation lint, full tests, production build.

## October recovery

After the fix is on `main`, open GitHub → Actions → **Monthly Club Ranking Instagram
Story** → **Run workflow** → branch `main` → `target_month`: `2026-10`.

```sh
gh workflow run club-ranking-story.yml --ref main -f target_month=2026-10
```

Use a **new workflow run**, not **Re-run jobs** on an old failure (that uses the old
commit and unsupported runner). The script reads existing October votes through
`get_public_club_vote_totals`, loads `/ko/instagram/club-ranking?month=2026-10`, and
overwrites `instagram-stories/club-ranking/2026-10.png`. No vote reset or SQL change
is needed. Its existing Slack webhook receives the story; the Actions artifact is
also downloadable. With no votes, the job sends the existing empty-state notice
and produces no PNG. Empty input now means the **previous completed month**.

For daily/weekly backfills use their manual date/week inputs. Review target dates
in logs when cron is delayed; their existing defaults still use the actual run date.

## Verification and rollback

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, workflow syntax
validation, and Automation checks on GitHub Ubuntu 24.04. External production
uploads/Slack deliveries are tested only by an explicitly requested capture run.
Revert the recovery commit to roll back; no schema or stored vote changes occur.

The repository has no `.codex-harness/config.json`, verification runner, or installed
`codex-harness` command. Use the actual package checks directly; scaffold installation
is outside this incident fix.

## Review and local evidence

Infrastructure, security, code, developer experience, and QA review of the final diff:
no blocking defects in the recovery changes. External production captures are not
run as part of this audit (they upload images and send Slack messages).

- `actionlint`: passed for every deployed workflow.
- Full typecheck: passed.
- Full test suite: 31 files / 209 tests passed. Fixed two existing suites that
  depended on wall-clock time (past matches and immediate-start join fixtures).
- Production build: passed with non-production Supabase fixture values.
- Strict lint for all changed automation sources and new regression tests: passed.
- Full repository lint: **fails with 96 pre-existing errors / 57 warnings**;
  unrelated application/UI cleanup is intentionally excluded. No rules are weakened
  or suppressed. The new Automation checks job gates the automation sources strictly.
- GitHub Secrets names confirmed: both required Supabase credentials, site URLs,
  Slack webhook, and reminder cron secret are present (no values read).
