# PowerPlay monitoring runbook

## Guardrails

- Use Better Stack Free only after confirming that PowerPlay qualifies under the current free-plan terms.
- Do not attach a payment method, paid responder, or AI SRE option. Enable the 80% quota alert.
- In Better Stack Frontend settings, enable only frontend errors and web vitals. Disable replay, console logs, website analytics, autocapture, and browser fingerprinting.
- The application is fail-open: omitting Better Stack variables disables monitoring without changing user flows.
- Never paste DSNs, telemetry tokens, heartbeat URLs, VAPID data, cookies, authorization headers, contact information, or push endpoints into Slack or an AI prompt.

## Deployment configuration

Set these Vercel Production and Preview variables:

| Variable | Purpose |
| --- | --- |
| `BETTER_STACK_SENTRY_DSN` | Server and Edge Sentry-compatible ingest DSN |
| `NEXT_PUBLIC_BETTER_STACK_SENTRY_DSN` | Browser fallback DSN when no RUM tag is installed |
| `NEXT_PUBLIC_BETTER_STACK_RUM_TOKEN` | Better Stack JavaScript-tag application token |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_URL`, `SENTRY_AUTH_TOKEN` | Source-map upload configuration |
| `MONITORING_ENABLED=true` | Explicit non-production monitoring opt-in |

Create five Better Stack heartbeats and add only their generated URLs as the matching GitHub Actions secrets:

`BETTER_STACK_HEARTBEAT_MATCH_REMINDER_URL`, `BETTER_STACK_HEARTBEAT_LOUNGE_AGGREGATION_URL`, `BETTER_STACK_HEARTBEAT_INSTAGRAM_DAILY_URL`, `BETTER_STACK_HEARTBEAT_WEEKLY_MATCHES_URL`, and `BETTER_STACK_HEARTBEAT_CLUB_RANKING_URL`.

Missing heartbeat secrets intentionally skip their pings so incomplete external setup does not fail scheduled jobs.

## Slack-to-AI handoff

```text
[PowerPlay 장애 조사]
- Better Stack 오류/incident URL:
- 발생 KST:
- environment / release SHA:
- route 또는 operation tag:
- first seen / last seen / count / affected users:
- Slack 원문:
- Better Stack AI prompt:
- 최근 배포 또는 재현 조건:

먼저 원인을 재현·진단하고, 관련 없는 코드는 바꾸지 말 것.
수정 후 typecheck/lint/test/build와 해당 domain 회귀 테스트를 실행할 것.
PWA/SW 관련이면 iOS 실기기 push gate 전에는 완료 처리하지 말 것.
```
