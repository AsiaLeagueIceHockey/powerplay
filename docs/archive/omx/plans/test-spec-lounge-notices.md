# Test Specification — Premium Lounge Notices

## Objective

Prove visibility, authorization, CRUD stability, subscription isolation, create-only push semantics, login return safety, localization, sharing, and regression-free production behavior.

## Unit tests

- Input validation: trim title/body; reject empty, title >120, body >10,000.
- Safe return-path sanitizer consumes the already-decoded framework value and performs no decoding; allow only `/{ko|en}/lounge/{singleSlug}` without query/fragment; reject residual `%`, locale homes, other routes, extra segments, absolute/protocol-relative paths, backslash, control characters, unsupported locale, and empty input.
- KST formatting around UTC/KST date boundaries.
- Canonical share URL drops search and hash.
- Fan-out helper deduplicates subscribers, excludes publisher, batches targets, and reports rejected deliveries.
- Fan-out helper proves batch size/concurrency never exceeds 25 and no action-level retry occurs.

## Server-action tests

Create `src/app/actions/__tests__/lounge-notices.test.ts` with mocked Supabase/push/cache:

- Unauthenticated, unrelated admin, expired owner, active owner, and superuser mutation matrix.
- Create returns inserted ID and calls push once per unique subscriber with dedicated URL and `{ skipEmail: true }`.
- Recipient RPC error, no recipients, missing device subscription, and rejected push still return persisted notice success.
- Update preserves ID and never pushes.
- Delete never pushes and revalidates list/detail paths.
- Subscribe upsert is idempotent and unsubscribe scopes both business and current user.
- Public detail rejects business-slug mismatch and hidden parent.
- Double-click retains one request UUID. Sequential retry and concurrent race with the same business/request UUID return one notice and start one fan-out; a new UUID creates a new notice.
- Model the accepted crash gap: a notice may persist with zero delivery attempts if execution stops after insert; retry returns the same notice and must not start a second attempt.
- Fulfilled `{ success:false, error:"No subscriptions" }`, other handled failure, thrown rejection, and successful multi-device returns are counted separately.

## Database/RLS verification

Use a disposable Supabase project if available; otherwise run and record a reviewed SQL checklist:

- Anonymous/authenticated SELECT for published-active versus unpublished, expired, and canceled parent businesses.
- Directly verify `is_visible_lounge_business` from anon, unrelated authenticated, owner, and superuser contexts; only parent state changes the boolean.
- Active owner CRUD; expired owner and unrelated admin denied; superuser allowed.
- Owner insert requires `created_by = auth.uid()`; business/creator reassignment on update is rejected by trigger.
- Immutability rejection also applies to superuser updates.
- Superuser mutation access does not make hidden/expired notices publicly readable.
- `WITH CHECK` prevents moving a notice to another business.
- Users cannot select/delete another user's subscription.
- Subscription insert fails for a hidden/inactive business.
- Subscriber RPC rejects anonymous/unrelated users, allows active owner/superuser, deduplicates, and excludes caller.
- Subscriber RPC returns no recipients for unpublished/expired parents even to a superuser caller.
- Policy definitions use fully qualified objects and do not recurse into the table being protected.
- Business/profile deletion cascades expected rows; notice updated-at trigger changes on update.
- Two concurrent inserts with the same business/request UUID leave one row.
- Direct insert with a null request UUID is rejected by the database.
- Direct null inserts are rejected for notice business/title/body/creator/request IDs and subscription business/user IDs.

## Component and route tests

- Admin no-business, empty, create, edit, loading/error, and delete-confirm states.
- Public zero-notice section stays visible.
- Notice cards and detail show KR/EN labels, KST dates, preserved line breaks, and accessible links/buttons.
- Subscription inactive/active/loading/error states and notification-guide launch when device push is absent.
- Native share success, AbortError, clipboard fallback, and failure feedback.
- Metadata contains localized notice/business title, canonical URL, and fallback image.

## E2E/manual matrix

- Anonymous KR and EN business/list/detail/share.
- Anonymous subscription through login/OAuth back to exact Lounge page.
- OAuth initiation and callback reject hostile or non-Lounge `next`; only the canonical localized business pathname remains valid.
- Exercise the actual login to provider-callback URL to final-redirect representation and prove the framework-decoded value is never decoded again.
- Active owner CRUD visible immediately; unrelated and expired admin denied.
- Active owner may manage an unpublished notice, but it is not public and sends no push; republishing sends no retroactive push.
- Two-user push: subscriber receives detail deep link; publisher and non-subscriber do not.
- Subscribe after an existing notice produces no retroactive push.
- iPhone installed PWA, Android/browser, and unregistered-device guidance.
- 375px mobile and desktop, light/dark, keyboard navigation, long Korean/English title/body.

## Observability

- Aggregate application logs are authoritative and include business ID, notice ID, intended/successful/no-subscription/rejected/handled-failure counts, devices sent, and elapsed time without tokens/profile data.
- Phase-boundary logs distinguish persisted, fan-out-started, and fan-out-completed; a missing later phase documents the accepted crash gap rather than claiming durable delivery.
- `notification_logs` is best effort; an RLS/logging failure cannot alter notice/fan-out results and is not reported as durable logging success.
- A >25-recipient mocked run records multiple sequential batches with at most 25 concurrent user sends.
- Capture SQL/RLS verification outcome separately from application tests.
- Rehearse forward rollback order: disable fan-out, remove application references, retain/export data, then use a separately approved schema-removal migration only if required.

## Required commands

1. `npx vitest src/app/actions/__tests__/lounge-notices.test.ts`
2. Relevant new utility/component tests.
3. `npm run lint`
4. `npm run typecheck`
5. `npm run test`
6. `npm run build`
7. Repeat all applicable commands after changed-files-only deslop.

## Exit criteria

- All acceptance criteria in `.omx/plans/prd-lounge-notices.md` are evidenced or explicitly marked as an external database/device check.
- No skipped or deleted regression tests.
- Zero known type, lint, test, build, authorization, or open-redirect errors.
- Architect approves before deslop and post-deslop verification is green.
