# Generate monthly ranking stories after KST month-end

- Date: 2026-11-01
- Status: active
- Scope: Instagram automation; no voting or schema changes

Run once on the first day at 09:17 Asia/Seoul and default to the previous completed
KST month. Allow an explicit YYYY-MM for historical regeneration.

The old last-day 22:00 capture omitted the last two hours of voting. GitHub cron
can start hours late, so checking whether the actual run day is the last day also
silently skipped the result when execution crossed midnight. After-close capture
removes both issues and avoids four redundant monthly browser installations.

Pin all current runner jobs to Ubuntu 24.04 while Playwright remains at 1.58.2.
Avoid an emergency dependency upgrade: validate a newer Playwright against a
newer runner together in Automation checks before changing either.

Rollback by reverting the recovery commit. Stored votes remain untouched; manual
capture overwrites only the selected month's existing image.
