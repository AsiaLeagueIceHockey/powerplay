# Club-first home: local review evidence

Status: ready for UI review; launch awaits the user's review. Local production server is running at http://localhost:3000/ko (redirects to /ko/clubs).

## Result

- Navigation is Clubs / Rinks / Matches in both locales, including the legacy client tab rendering.
- Normal home/logo/bottom-home visits open the club directory. Matches remain available at /ko?tab=match and /en?tab=match. Existing date queries still render the match feed; rink-tab queries open the rink directory.
- All three tabs reuse the same compact navy club-finder banner. The larger club-only variant was removed after user review.
- Team cheering remains visible in a compact monthly-ranking disclosure below search/filters. Opening it reveals vote instructions, daily limits/monthly reset rules, and the existing Instagram destination. Club voting and ordering are unchanged.

## Changed files

- src/components/public-section-tabs.tsx: section order and explicit match destination.
- src/app/[locale]/(public)/page.tsx: default home destination with match/date compatibility.
- src/components/home-client.tsx: fallback tab order, finder placement, native ranking disclosure.
- src/components/find-club-banner.tsx: one shared compact banner with translated copy; removed the larger variant and its unused CTA text.
- src/app/[locale]/(public)/rinks/page.tsx: updated shared-banner invocation.
- src/components/my-match-list.tsx: preserve the Browse Matches empty-state destination.
- messages/ko.json and messages/en.json: matching finder/ranking text.
- tests/unit/home-navigation.test.tsx: 8 routing/navigation regression cases.
- .omx/plans/home-club-first.md: bounded implementation and verification plan.

Simplification: reused the existing finder component and translation catalog; used native details/summary for ranking help. No dependencies, schema changes, new route, or voting logic.

## Verified

- Production build: `npm run build` passed, including all 365 generated pages.
- TypeScript: `npm run typecheck` passed.
- ESLint over every changed TS/TSX file and the new test: passed.
- `git diff --check`: passed.
- Home navigation, i18n catalog, club voting, and club finder tests: 14/14 passed.
- Full test run: 182 passed, 7 failed. The same 7 failures reproduce from an untouched HEAD archive: six financial-flow cases and one superuser-match-filter case. Baseline output: /private/tmp/powerplay-home-review/baseline-tests.log. Current output: /private/tmp/powerplay-home-review/current-tests.log.
- Full lint: 97 errors / 59 warnings in existing unrelated code and generated public/sw.js. Changed files are clean. These remain release-check gaps.
- Independent read-only review: no actionable findings.

## Runtime evidence

Verified public directory initially signed out on 127.0.0.1, and the existing signed-in localhost session (header: 조엘) with the final production build.

- /ko and /en redirect to the correct locale's club directory.
- /ko/clubs and /en/clubs: primary finder, search/populated/no-results/clear, ranking disclosure open/close and its Instagram URL.
- Region filter apply/reset, rink filter opening/closing.
- Finder link opens /ko/find-club; question navigation reaches steps 1, 2 and 3, with disabled Next until a choice. Result submission and live voting were not performed.
- Actual Matches and Rinks tab clicks reach /ko?tab=match and /ko/rinks. Date-only /ko?date=2026-10-18 stays on Matches.
- 390×844 mobile and 1280×900 desktop reviewed. Document width equals viewport width in both. English finder text wraps cleanly on mobile.
- Final production browser console: no warnings/errors; no raw translation keys, missing-message errors or hydration errors. Server: no runtime errors, existing workspace-root startup warning only.
- During initial development, a previously loaded page had stale messages/markup after HMR. The final production build and fresh localhost navigation verified clean.
- Existing notification onboarding modal was dismissed during navigation checks; notification settings were not enabled.
- A supplementary 320px English check showed existing club-card overflow (document width 357px); the changed banner and ranking help fit. Dark-mode runtime was not changed/tested. These are outside the completed 390px review scope.

Final mobile screenshot: /Users/joelonsw/.codex/visualizations/2026/10/17/01a14773-7053-7a31-aa26-5f6ab0dd9752/powerplay-home-review/mobile-compact.jpg.

Launch gate: user review, then resolve or explicitly triage existing repository-wide lint/test failures before shipping. No commit, push, or deployment has been performed.


## User review revision: uniform finder banner

The user approved the monthly-ranking disclosure and requested the same finder-banner size as Matches/Rinks. Removed the large variant and its unused CTA translations, and reused the compact component in Clubs with the existing spacing wrapper. Follow-up source changes: find-club-banner.tsx, home-client.tsx, messages/ko.json, messages/en.json.

Rebuilt and restarted the local production server. Typecheck, changed-component lint, diff check, home-navigation and i18n tests (10/10), and production build passed. Browser measurements at 390×844: Clubs, Rinks, Matches, and English Clubs all have the same 358×40px finder banner and identical classes. Desktop 1280×900: 40px banner height and no document overflow. Ranking open/close still works; console has no errors/warnings. Existing repository-wide lint/test gaps above remain unchanged.
