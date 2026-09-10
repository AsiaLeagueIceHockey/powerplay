# PWA startup performance baseline

Measured 2026-09-10 KST against `https://powerplay.kr/ko` using Chromium with a
new browser context per cold run, 150ms latency, 200,000B/s download,
93,750B/s upload, and a 4x CPU throttle. The planned command runs each mode five
times and reports the median.

| Metric | Baseline |
| --- | ---: |
| FCP (cold) | 3,304ms |
| LCP (cold) | 6,212ms |
| DOMContentLoaded (cold) | 3,709ms |
| Initial document (browser encoded) | 83,276B |
| Initial document (decoded) | 888,018B |
| Initial JS | 265,071B across 15 chunks |

Run `npm run perf:pwa` for an observational measurement, or
`npm run perf:pwa -- --assert` to enforce the Phase 5 budgets. The assertion
budgets are FCP ≤ 1,800ms, LCP ≤ 2,500ms, document encoded bytes ≤ 45,000B,
initial JavaScript ≤ 220,000B across no more than 12 requests, and warm TTFB ≤
300ms.

This baseline intentionally does not treat a service-worker cache as the primary
success path. Cold mode creates a fresh browser context for every run. Warm-PWA
mode uses one context for an initial navigation and then measures the second
navigation after waiting for service-worker readiness.
