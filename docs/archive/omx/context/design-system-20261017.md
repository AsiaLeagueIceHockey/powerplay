# Design system context

Task: implement the user-approved design-system plan for all ordinary consumer screens, one codex/design-system branch and PR.
Evidence: globals.css has only background/foreground/font tokens; no common UI directory. Seeds are club-detail-action-styles, lounge-theme, public tabs/banner/mypage rows. Approximately217 TSX files; public routes span locale public group plus onboarding/chatroom/fortune. Existing full lint and unit-test failures are unrelated baseline debt.
Constraints: preserve layout/brand/theme semantics and business behavior; no dependencies, schema or actions changes; no main mutation, no merge. Guard own public scopes so admin/export do not inherit a new visual system accidentally. Native forms and bilingual mobile actions must retain semantics.
Approved decisions: all ordinary user screens, regional accents maintained, one branch/PR, docs/gallery/automatic gates.
Open operational checks: safe runtime fixture coverage for protected routes; compare baseline failures by identity; standard primitive API finalized before consumer migrations.
