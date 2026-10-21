# Design system verification contract

- Before refactor: record full Vitest failures and ESLint findings by identity, capture existing public UI and identify relevant domain regression tests.
- Native primitives: button default/submit/form/name/value/ref/events, loading/disabled suppressing actions, icon-only accessible name, locale-aware links; label/help/error associations; selected/disabled controls; semantic surface/badge variants.
- Domain locks: home tab/date links, votes and child event isolation, draft filter selection/apply/reset, form submission, profile/parent states, rental/point calculations, chat/tracking wrappers (mocked, no production writes or read receipts).
- Scope: all ordinary user routes in inventory migrated or an intentional visual exception with rationale; no unverified work relabeled an exception.
- Gallery: PowerPlay/Lounge/Youth x ko/en x light/dark x390x844/1280x900; long labels, empty/error/loading/disabled. Production dev-gallery404; auth and locale middleware bypass only exact dev path.
- Policy checker fixtures: approved primitives/recipes and layout classes pass; primitive visual overrides, bypasses and undocumented raw colors fail; documented provider/canvas/hidden-input exceptions pass. Static checks complement runtime QA.
- Before each stage commit: typecheck, lint touched files, relevant tests, diffcheck, exact runtime screenshot/console checks. Build for routes/boundaries and before final push.
- Final: ui:check/ui:test/ui:visual/typecheck/build pass, full tests and lint compared to baseline by identity (not counts); no newly introduced failures. Real public routes checked separately with safe data. Admin/export isolation verified without uploading or invoking capture scripts.
- Independent architecture review and bounded cleanup pass, rerun checks after fixes; one PR with screenshots/coverage/gaps, no merge.
