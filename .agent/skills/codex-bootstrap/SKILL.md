---
name: codex-bootstrap
description: Bootstrap guide for Codex working in the PowerPlay repo. Use this before implementing, debugging, reviewing, or planning so you load the current architecture, env requirements, verification commands, and feature-set update rules with minimal context.
---

# Codex Bootstrap

Use this as the first-stop skill for work in `powerplay`.

## Load Order

1. Read `AGENTS.md` for global rules and roadmap state.
2. Read `references/project-map.md` for the current code-based architecture.
3. Read `references/task-runbook.md` for the change set you are about to touch.
4. Read `references/env-checklist.md` when you need runtime setup, push, maps, SEO, or scripts.

## Mandatory Working Rules

- Treat `AGENTS.md` and the current `src/` + `sql/` tree as canonical.
- Treat `README.md` as partially historical unless it matches current code.
- For match-related changes, update the full set: user UI, admin UI, server actions, SQL/i18n, and cached fetchers.
- For money flows, add or update automated tests before finishing.
- For new database columns, search both fresh fetchers and cached fetchers before stopping.
- Keep all displayed times in `Asia/Seoul`; convert `datetime-local` KST input to UTC before storing.

## Common Task Entry Points

- Match/join/waitlist/payment flow: `src/app/actions/match.ts`
- Admin match/rink management: `src/app/actions/admin.ts`
- Points/refunds/user point pages: `src/app/actions/points.ts`, `src/app/actions/superuser.ts`
- Auth/profile/onboarding/player card: `src/app/actions/auth.ts`
- Clubs/chat/push: `src/app/actions/clubs.ts`, `src/app/actions/chat.ts`, `src/app/actions/push.ts`
- Cached home data: `src/app/actions/cache.ts`

## Verification Default

- `npm run lint`
- `npm run test`
- `npm run typecheck`

Use narrower Vitest runs only when a full run is unnecessary.
