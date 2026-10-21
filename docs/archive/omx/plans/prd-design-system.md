# Approved design system implementation

Approved by user 2026-10-17. Work only on codex/design-system from origin/main; one Draft PR, no merge or main push.

Goal: preserve the current product appearance and behavior while standardizing all ordinary user-facing UI through scoped semantic tokens, shared native controls, style recipes and maintenance gates.

Scope: home/clubs/rinks/matches/finder/auth/onboarding/profile/mypage/points/chat/Lounge/Youth/legal/about and global user notifications/install controls. Include user routes outside the (public) group. Exclude admin, SEO bot renderers, exported image/Instagram canvases and game/fortune artwork; surrounding ordinary controls remain in scope.

Keep PowerPlay blue/navy, Lounge gold plus category accents, Youth violet, provider/status/cheer/points semantics, OS light/dark, current compact finder banners and ranking disclosure. No dependencies, schema/server action/auth/payment/data/tracking changes.

Structure: CSS semantic tokens; src/components/ui native primitives and recipes; domain wrappers keep business behavior. Card/field radius12, sheet24, intentional pill/circle/hero exceptions; spacing4/8/12/16/20/24/32; control sizes36/44/56 with existing club46 and icon18 contract preserved.

Controls forward native form/ref/event/ARIA props; internal links use locale-aware Link. Shared sheets/modals are presentation only; lifecycle and selection logic stay local. No speculative polymorphic wrapper or dialog engine. No global element style overrides, admin/export remain isolated.

Maintenance: docs/design-system.md canonical, existing AGENTS and UI skill point to it; independent dev-only /dev/design-system gallery (own html/body/providers, exact middleware carve-out, production404, fixtures/no DB); ui:check (scoped AST policy/lint), ui:test (behavior), ui:visual (local fixtures/screenshot matrix). Meaningful documented exceptions, not incomplete/unverified states.

Stages: baseline/regression locks; foundation/gallery; discovery/detail migration; account/application/chat migration; Lounge/Youth migration; final cleanup/review/verification. Each stage committed on same branch, local previews, one evolving Draft PR.

Cleanup plan: remove duplicated visual recipes and obsolete helpers; retain real domain boundaries; migrate one family at a time after behavior locks; no unrelated backend cleanup. Existing whole-repo failures tracked by identity; failures in touched code must be fixed, no disabled tests/checks.
