# Task Runbook

## Default Change Set

When you change a feature, check whether it spans these layers:

1. SQL and RLS
2. Server actions
3. Public pages/components
4. Admin pages/components
5. `messages/ko.json` and `messages/en.json`
6. Cached fetchers in `src/app/actions/cache.ts`
7. Tests

Do not stop after updating only the obvious UI file.

## Match-Related Work

Always inspect:

- `src/app/actions/match.ts`
- `src/app/actions/admin.ts`
- `src/app/actions/cache.ts`
- `src/components/match-card.tsx`
- `src/components/match-application.tsx`
- `src/components/admin-match-card.tsx`
- `src/components/match-form.tsx`
- `src/components/match-edit-form.tsx`

Also check:

- match detail page
- home page cards/filters
- admin list/edit pages
- relevant SQL migration
- both locale message files

## Financial / Refund / Points Work

Mandatory:

- Update or add tests under `tests/` or `src/app/actions/__tests__/`
- Verify entry fee + rental fee flows together
- Check pending-payment promotion/cancel/refund branches
- Check superuser confirmation path in `src/app/actions/superuser.ts`

Primary files:

- `src/app/actions/points.ts`
- `src/app/actions/superuser.ts`
- `src/app/actions/match.ts`
- `src/app/actions/admin.ts`

## Profile / Onboarding Work

Primary files:

- `src/app/actions/auth.ts`
- `src/components/onboarding-form.tsx`
- `src/components/onboarding-guard.tsx`
- `src/components/profile-editor.tsx`
- `src/app/[locale]/onboarding/page.tsx`

Checks:

- new required fields must not break existing nullable rows
- onboarding redirect logic must still work on all locales
- player card issuance may depend on SQL RPC/sequence

## Push / PWA Work

Primary files:

- `src/app/actions/push.ts`
- `src/contexts/notification-context.tsx`
- `src/components/push-manager.tsx`
- `src/components/notification-guide-modal.tsx`
- `PUSH_NOTIFICATIONS.md`
- `sql/v18_secure_push_rpc.sql`

Checks:

- missing VAPID env handling
- iOS PWA-only behavior
- safe token access through RPC, not service role in app runtime

## Rink / Map Work

Primary files:

- `src/components/rink-map.tsx`
- `src/components/rink-explorer.tsx`
- `src/app/actions/rink.ts`
- `src/app/actions/admin.ts`
- `scripts/update-rinks.js`

Checks:

- approved-only public visibility
- address/lat/lng/rink_type consistency
- Naver geocoding env requirements

## Review Mode

When the user asks for a review:

- findings first
- order by severity
- include exact file references
- emphasize regressions, missing tests, cache mismatches, and role/RLS gaps

## Verification Ladder

Use the narrowest sufficient set:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run build` for routing/metadata/layout-sensitive or production-path changes

For targeted test work:

- `npx vitest tests/unit/file.test.ts`
- `npx vitest src/app/actions/__tests__/financial-flows.test.ts`
