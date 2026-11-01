# Keep browser automation paired with a supported runner OS

On 2026-11-01, monthly, daily, and weekly capture runs failed before their scripts
started: `ubuntu-latest` selected Ubuntu 26.04, which installed Playwright 1.58.2
does not support. Pin Ubuntu 24.04 and test browser startup in a secret-free CI job.
Validate the installed Playwright version's platform map when changing runners;
current online docs may describe a newer Playwright than the lockfile.

GitHub schedules can start hours late. Monthly captures should run after the month
closes and derive the previous month in `Asia/Seoul`, with an explicit YYYY-MM
override for recovery. Rerunning a failed workflow uses its old revision; dispatch
a new run on the fixed branch to pick up runner changes.
