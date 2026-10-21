# PRD — Premium Lounge Notices

## Status and sources

- Status: Draft for consensus review
- Requirements source: `.omx/specs/deep-interview-lounge-notices.md`
- Context: `.omx/context/lounge-notices-20260809T011255Z.md`
- Delivery mode: Ralph, deliberate planning because the change includes schema, RLS, authentication return paths, and push fan-out

## Requirements summary

Add a durable public notice channel to every visible premium Lounge business:

- Active Lounge owners manage text notices in Admin > Lounge.
- Public Lounge pages show notices newest first and retain a visible empty section.
- Each notice has a stable localized URL: `/{locale}/lounge/{businessSlug}/notices/{noticeId}`.
- Signed-in users explicitly subscribe per Lounge business through `공지 알림받기` in the notice section.
- Creating a notice sends a best-effort push to current subscribers; edits and deletes do not notify.
- Drafts, scheduling, pinning, media, email, comments, analytics, pagination, and club-notice refactoring are out of scope.

## RALPLAN-DR summary

### Principles

1. Database authorization is authoritative; server actions add defense in depth.
2. Notice persistence succeeds independently from push delivery.
3. Lounge notice interest is separate from club membership and device push registration.
4. Notice visibility exactly inherits the parent Lounge business's published/active-membership contract.
5. Prefer a small reversible boundary over a generalized publishing platform.

### Decision drivers

1. Least-privilege ownership, membership, subscriber, and superuser security.
2. A clear public/detail/share and notice-only subscription experience.
3. Brownfield fit with current Lounge tabs, detail layout, sharing, and push infrastructure.

### Options

#### Option A — Dedicated Lounge notice domain (selected)

Add `lounge_notices`, `lounge_notice_subscriptions`, a scoped subscriber-ID RPC, a focused action module, and focused UI components.

- Pros: clear RLS and subscription semantics; independent evolution; avoids further growth in `src/app/actions/lounge.ts`; reversible.
- Cons: new migration, RPC, module, component set, and test mocks; synchronous best-effort fan-out adds create latency.

#### Option B — Polymorphic `club_posts`

Extend club posts with a Lounge parent and generalize authoring/subscription.

- Pros: nominal table/type reuse and a possible shared future publishing UI.
- Cons: couples unrelated authorization and subscription models; current club posts are globally readable and club memberships are notification recipients (`sql/v4_schema_clubs_v2.sql`, `src/app/actions/clubs.ts`); higher RLS regression risk; violates the explicit non-goal of club refactoring.

#### Rejected future option — Transactional outbox

An outbox would isolate delivery latency but needs a worker/queue lifecycle not present in this release. Reconsider only after measured subscriber volume demonstrates synchronous fan-out risk.

## Architecture and implementation plan

### 1. Add persistence and RLS

Create the next conflict-free migration after v60, tentatively `sql/v61_lounge_notices.sql`.

`lounge_notices`:

- UUID ID; `business_id`, `title`, `body`, `created_by`, and client-generated `request_id` are all explicitly `NOT NULL`; created/updated timestamps are `NOT NULL` with defaults; unique `(business_id, request_id)`.
- Trimmed non-empty checks and conservative server/DB limits (title 120, body 10,000).
- `(business_id, created_at desc, id desc)` index.
- Reuse the Lounge updated-at trigger helper from `sql/v33_lounge_memberships.sql`.
- Add `is_visible_lounge_business(target_business_id uuid)` returning boolean only. It is `SECURITY DEFINER`, uses fully qualified `public.*` objects and fixed `search_path`, checks parent `is_published` plus active owner membership, revokes PUBLIC, and grants execute only to `anon` and `authenticated`.
- Public SELECT uses `is_visible_lounge_business(business_id)` so anonymous and unrelated authenticated callers evaluate the same authoritative predicate without membership-table RLS interference.
- Owner SELECT requires the exact parent-owner/admin/active-membership predicate so owners can manage notices before their business is published; superusers have their separate SELECT through the ALL policy.
- Owner INSERT requires `created_by = auth.uid()` and an existing parent with `owner_user_id = auth.uid()`, `is_admin()`, and `has_active_lounge_membership(auth.uid())`.
- Owner UPDATE/DELETE `USING` repeats that exact parent-owner/admin/active-membership predicate. UPDATE `WITH CHECK` repeats it against the new row and requires `created_by = auth.uid()`.
- A before-update trigger rejects any change to `business_id` or `created_by`; neither is mutable even between two otherwise authorized rows.
- The immutability trigger applies to superusers too; changing parent or creator requires a new notice.
- A separate superuser ALL policy requires an existing `profiles` row for `auth.uid()` with `role = 'superuser'`. It bypasses owner/membership mutation checks but not the public visibility policy; hidden/expired notices remain non-public.
- Every policy query uses fully qualified `public.*` references and direct parent existence checks, avoiding self-referential notice/subscription policy recursion.

`lounge_notice_subscriptions`:

- `business_id` and `user_id` are explicitly `NOT NULL` FKs with cascade; timestamp is `NOT NULL` with default; unique/primary `(business_id, user_id)` plus business index.
- Users select/insert/delete only their own row.
- SELECT and DELETE require `user_id = auth.uid()`.
- INSERT `WITH CHECK` requires `user_id = auth.uid()` and `is_visible_lounge_business(business_id)`.
- No UPDATE policy exists.
- Subscribe uses plain INSERT. SQLSTATE `23505` from the unique key is treated as already subscribed; no UPDATE policy or upsert is required.
- No public, owner-wide, or cross-user read policy.

Add `get_lounge_notice_subscriber_ids(target_business_id uuid)`:

- `SECURITY DEFINER` with `SET search_path = public`.
- Reject `auth.uid() IS NULL` before every data read.
- Authorization requires either (a) the target parent is owned by the caller, the caller is admin-level, and the owner membership is active, or (b) the caller has a `profiles.role = 'superuser'` row.
- Recipient selection additionally requires `is_visible_lounge_business(target_business_id)`, so even superuser-created notices for hidden/expired businesses produce no push recipients.
- Returns distinct user IDs, excludes `auth.uid()`, and exposes no profile or device-token data.
- Use fully qualified `public.*` objects; revoke all from PUBLIC and grant execute only to authenticated.
- Continue using `get_user_push_tokens` through `sendPushNotification`; never introduce service-role runtime access.

### 2. Add focused domain actions

Create `src/app/actions/lounge-notices.ts` rather than enlarging `src/app/actions/lounge.ts`.

- Export `LoungeNotice` and stable result types.
- Public list/detail reads must select through visible parent data and reject business-slug mismatches.
- Managed list plus create/update/delete actions repeat owner, role, active-membership, and input validation before relying on RLS.
- Subscribe/unsubscribe is idempotent and always scopes both current user and business.
- Create requires a valid client-generated request UUID and obtains the notice ID before recipient lookup.
- On `(business_id, request_id)` conflict, fetch and return the existing authorized notice with `created: false`; only `created: true` initiates fan-out.
- Fan-out calls `sendPushNotification(userId, title, body, detailUrl, { skipEmail: true })` through sequential batches of 25 recipients, with at most 25 concurrent user-level sends.
- Add no action-level retry; retain only the existing per-device retry inside `sendPushNotification`. Await all batches so the runtime does not discard work, but never convert delivery failure into persistence failure.
- Inspect each fulfilled call's returned `{ success, sent, error }`; fulfilled `success: false` is not delivered. Track intended/successful users, devices sent, no-subscription, rejected, other handled failures, and elapsed milliseconds.
- Aggregate application logs are authoritative for this feature. Existing `notification_logs` insertion is best effort under current RLS and is not claimed as durable evidence.
- Client submission disables after first click and retains the same request UUID until success; a fresh form after success receives a new UUID.
- A subscriber lookup or individual delivery failure is logged without converting persisted notice success into failure.
- Update/delete never push.
- Revalidate localized admin, business, and notice-detail paths.

### 3. Add admin notice management

- Extend `getLoungeAdminPageData()` in `src/app/actions/lounge.ts` or load the managed notices in parallel from `src/app/[locale]/(admin)/admin/lounge/page.tsx`.
- Extend `src/components/lounge-admin-dashboard.tsx` with a localized `notices` tab after schedules.
- Add `src/components/lounge-notice-manager.tsx` with no-business/inactive empty states, create, inline or modal edit, newest-first list, and confirmed delete.
- Preserve notice ID and detail link during edits.
- Keep public copy in both message JSON files; admin-only Korean hardcoding is allowed, but the shared tab should remain KR/EN.

### 4. Add public discovery and subscription

- Load visible notices and current-user subscription state with the business detail data in `src/app/[locale]/(public)/lounge/[businessId]/page.tsx`.
- Extend `src/components/lounge-business-detail.tsx` with a notice section between business information and `전체 일정`.
- Retain the section at zero notices so users can subscribe in advance.
- Notice cards show title and KST date and link to the stable detail route.
- Add `src/components/lounge-notice-subscribe-button.tsx`; anonymous clicks use localized login with a validated same-site return path.
- Treat account subscription and current-device push readiness separately. Persist interest, show its active state, and use `useNotification()` to open the existing notification guide when the device is not registered.
- Active owners may manage notices for unpublished businesses, but hidden/expired parents are not public and never fan out. Superusers may mutate hidden rows but also get no recipients. Republishing/reactivation never sends retroactive notices.

### 5. Add notice detail, metadata, and sharing

- Add `src/app/[locale]/(public)/lounge/[businessId]/notices/[noticeId]/page.tsx`.
- Return not found for deleted notices, slug mismatch, unpublished businesses, or inactive membership.
- Render business identity/back link, title, KST publication date, line-preserved body, and share action.
- Generate localized metadata/OG using the business cover or existing `/og-new.png` fallback.
- Generalize `src/components/lounge-share-button.tsx` with notice props or add a small notice wrapper; native share first, clipboard fallback, canonical `origin + pathname` only.

### 6. Preserve safe localized login return paths

- The existing chain does not preserve `next`: the login page calls OAuth actions without it, actions hardcode `/ko/auth/callback`, and the callback trusts its `next` query. Replace that with one shared pure sanitizer used by OAuth initiation and callback final redirect.
- Accept only a canonical localized Lounge business pathname matching `/{ko|en}/lounge/{singleBusinessSlug}` with no query or fragment. Reject all other routes, extra segments, empty/malformed decoding, schemes, protocol-relative `//`, backslashes, control characters, and unsupported locale prefixes to `/{currentLocale}`.
- The sanitizer accepts the framework-decoded string returned by `URLSearchParams.get()` or Next search params and performs no additional decoding. Residual `%` encodings are rejected to prevent double-decoding ambiguity.
- The localized login page reads raw `next`, passes it with its route locale to both OAuth actions, and the server action sanitizes before embedding `next` into the provider callback URL.
- The callback sanitizes the returned raw `next` again before redirecting. No callback-supplied value is trusted merely because OAuth succeeded.
- Preserve the sanitized path through the provider callback URL; do not use client-controlled `next` directly as a redirect target.
- Add focused sanitizer tests because this is a shared authentication boundary.

### 7. Verify and polish

- Add focused action tests and pure utility tests before final UI cleanup.
- Run targeted tests, lint, typecheck, full tests, production build, and manual mobile/desktop flows.
- Obtain security/architecture review before deslop.
- Run changed-files-only `ai-slop-cleaner` in standard mode, then repeat all gates.

## Acceptance criteria

1. Anonymous users can read visible notice lists/details in KR and EN.
2. Guessed UUIDs for unpublished, expired, deleted, or slug-mismatched notices return not found.
3. An active owner and superuser can create/edit/delete; unrelated or expired admins cannot.
4. Create is immediately public, edit keeps the URL, and delete removes it.
5. Lists are newest first and all dates display in `Asia/Seoul`.
6. Native share and clipboard fallback use the canonical notice URL.
7. Anonymous subscribe returns to the originating localized Lounge page after login.
8. Signed-in subscribe/unsubscribe is idempotent and persists after refresh.
9. Cross-user subscription reads/deletes and unauthorized subscriber RPC calls fail.
10. Create fan-out deduplicates subscribers, excludes publisher, deep-links to the notice, and sets `skipEmail: true`.
11. Edits/deletes and retroactive subscription send no push.
12. Recipient lookup/missing device/push failure never rolls back a created notice and remains observable in logs.
13. Current-device push readiness is accurately guided without conflating it with account interest.
14. Responsive/dark/light UI, keyboard access, KR/EN copy, and existing Lounge visual language are preserved.
15. Targeted tests, lint, typecheck, full tests, and build pass; manual admin/public/subscription flows pass.
16. SQL policies and the subscriber RPC use the exact predicates above, immutable parent/creator fields, fully qualified objects, and no policy recursion.
17. OAuth initiation and callback both use the same sanitizer; unsafe `next` values always fall back locally.
18. Fan-out never exceeds 25 concurrent user sends, performs no action-level retry, and emits aggregate logs without sensitive data.
19. Retrying create with the same business/request UUID returns one notice and initiates fan-out at most once. A crash after insert but before fan-out may yield zero attempts; eliminating that accepted gap requires an outbox.
20. Unpublished/expired parents never fan out, and later republishing/reactivation does not notify retroactively.

## Deliberate pre-mortem

1. **Expired/private notice leak:** an application check passes but SQL is permissive. Mitigation: parent-existence RLS and database-policy review/tests for published, unpublished, active, expired, owner, unrelated, and anonymous roles.
2. **Duplicate posts after push timeout:** create appears failed although insert succeeded. Mitigation: business-scoped request UUID uniqueness, conflict-as-existing response, first-insert-only fan-out, and retry/race tests.
3. **False notification confidence:** account preference is active but current device is not registered. Mitigation: separate visual states and immediately expose the existing PWA/permission guide.
4. **Miscounted delivery:** a push resolves with `success:false` but all-settled calls it fulfilled. Mitigation: inspect returned fields and test no-subscription, handled failure, rejection, and multi-device success separately.
5. **Observability silently fails:** `notification_logs` RLS rejects a publisher-session insert. Mitigation: authoritative aggregate application logs and explicitly best-effort notification-log wording.
6. **Crash after insert before delivery:** request UUID prevents duplicate rows but cannot guarantee a notification attempt. Mitigation: log persisted/fan-out-started/fan-out-completed boundaries, accept at-most-once initiation for this release, and add an outbox only if durable delivery becomes required.

## Risks and mitigations

- No disposable database RLS test harness is present: review migration with security specialist and provide a reproducible SQL verification checklist; do not claim live DB application.
- Shared login return-path work risks open redirect: isolate and test a pure sanitizer; avoid OAuth changes if the current chain already supports a safe return.
- Duplicate create requests can make separate notices: disable the submitting client control and document that cross-request idempotency is a later hardening option.
- Large subscriber sets can slow create: bounded batches and best-effort semantics now; outbox only after measurement.
- Existing `get_user_push_tokens` is broadly executable by authenticated users: do not widen it; scope the new subscriber RPC tightly.
- The broad exported `sendPushNotification` and token RPC are accepted pre-existing risk outside this feature. This release adds no new raw caller surface and does not claim end-to-end least privilege; broad push hardening is a separate security project.
- Duplicate create retry risk is handled through request UUID idempotency rather than UI-only disabling.
- Existing unrelated `src/components/card-news-studio.tsx` edit: never modify or revert it.

## Rollback

- First disable fan-out, then deploy application code that stops reading/writing the feature while retaining its data.
- Retain or export notice/subscription rows by default. Schema removal requires an explicit retention decision and a new forward rollback migration that drops RPC/policies before tables.
- Do not execute ad-hoc destructive rollback SQL during release recovery.

## ADR

- Decision: dedicated Lounge tables, scoped subscriber RPC, focused action module, and Lounge-native UI.
- Drivers: least privilege, clear notice-only semantics, maintainability, reversibility.
- Alternatives: polymorphic club posts; owner-readable subscriptions; transactional outbox.
- Why chosen: preserves the established Lounge business/membership boundary and avoids club regression or unnecessary audience-data exposure.
- Consequences: one new migration and module; synchronous bounded best-effort delivery remains.
- Follow-ups: consider an outbox only from measured latency; generalize publishing only through a later product decision.

## Consensus review changelog

- Architect iteration 1 required exact RLS `USING/WITH CHECK` predicates and immutable ownership columns.
- The subscriber RPC now separates caller authorization from parent public-visibility eligibility.
- The auth return flow now has one sanitizer contract used at initiation and callback, with exact accepted/rejected path classes.
- Fan-out now has a batch size/concurrency limit of 25, no action-level retries, explicit aggregate logging, and documented duplicate-submit semantics.
- Architect iteration 2 added request UUID idempotency, success-aware delivery accounting, hidden-parent no-fan-out, conflict-as-success subscription idempotency, narrow Lounge-only login return, accepted pre-existing push trust risk, and forward non-destructive rollback order.
- Critic iteration 1 clarified framework-decoded OAuth input, the accepted crash-before-fan-out gap, explicit team roles/reasoning, both launch syntaxes, and a single verification owner.

## Available-agent-types roster and staffing

- Planning/review: `planner`, `architect`, `critic`, `security-reviewer`, `code-reviewer`.
- Implementation: `executor` for SQL/actions/UI; `designer` for visual refinement when needed.
- Evidence: `test-engineer`, `verifier`, `build-fixer`.
- Ralph guidance: one `executor` high owns sequential integration; one `security-reviewer` medium independently checks SQL/auth; one `test-engineer` medium reinforces tests; one `verifier` high owns final evidence.
- Team lane 1: `executor` high owns only `sql/v61_lounge_notices.sql` and SQL verification notes; `security-reviewer` medium reviews it after handoff.
- Team lane 2: `executor` high owns notice actions, request-id/auth sanitizer, push orchestration, and action/unit tests.
- Team lane 3: `executor` medium owns public/admin components, routes, metadata, sharing, and KR/EN messages; it consumes but does not edit lane 2 contracts.
- Integration owner: `team-executor` medium resolves shared page/dashboard props after lane handoff; no two lanes edit `lounge.ts` or the same route concurrently.
- Verification owner: `verifier` high runs targeted tests, lint, typecheck, full tests, build, diff review, and records external SQL/device gaps before shutdown; `build-fixer` high is used only after a failed gate.
- `$team` launch hint: `$team 3:executor "Implement .omx/plans/prd-lounge-notices.md using isolated SQL-security, actions-push-auth, and UI-route-i18n lanes; verifier owns final gates"`.
- CLI launch hint: `omx team 3:executor "Implement .omx/plans/prd-lounge-notices.md using isolated SQL-security, actions-push-auth, and UI-route-i18n lanes; verifier owns final gates"`.
- Team verification path: each executor proves targeted checks before handoff; the named `verifier` reads every repository gate and the manual checklist, and only the leader shuts down after zero pending/error items are reported.
