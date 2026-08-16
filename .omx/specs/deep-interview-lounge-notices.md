# Execution Spec — Premium Lounge Notices

## Metadata

- Source: Deep Interview
- Profile: Standard
- Context type: Brownfield
- Interview rounds: 4
- Final ambiguity: 11.75%
- Target threshold: 20%
- Readiness: Ready for planning
- Context snapshot: `.omx/context/lounge-notices-20260809T011255Z.md`
- Transcript: `.omx/interviews/lounge-notices-20260809T013447Z.md`

## Clarity breakdown

| Dimension | Score | Resolution |
|---|---:|---|
| Intent | 90% | Give premium Lounge businesses a durable audience channel rather than a static listing only. |
| Desired outcome | 90% | Owner CRUD, public list/detail/share, explicit notice-only push subscription. |
| Scope | 90% | Notice CRUD with one optional image and immediate publication; rich publishing remains excluded. |
| Constraints | 85% | Existing membership/ownership, RLS, i18n, KST, push RPC, and design patterns apply. |
| Success criteria | 75% | Testable behavior is specified below; visual QA details remain for planning. |
| Brownfield context | 95% | Existing club notices, Lounge admin/detail/share, membership RLS, and push path were inspected. |

## Intent

Turn each paid Lounge business page into an ongoing communication channel. Owners can publish durable notices from the product they already manage, while users can return to, share, and optionally receive new notices without joining a club or exposing the notice behind authentication.

## Desired outcome

1. An active Lounge owner manages notices with text and an optional image inside Admin > Lounge.
2. A published Lounge page displays its notices newest first.
3. Every notice opens on a dedicated, shareable, localized detail page.
4. A signed-in user can explicitly subscribe or unsubscribe to notice pushes for that one Lounge business.
5. Creating a new visible notice sends a push deep link to current subscribers without making publication fail when an individual delivery fails.

## In scope

### Data and authorization

- Add a Lounge notice entity related to `lounge_businesses`, with title, body, creator, and created/updated timestamps.
- Add a per-user, per-business Lounge notice subscription with a uniqueness constraint and cascade cleanup.
- Public notice reads inherit the parent business visibility contract: the business must be published and its owner must have an active Lounge membership.
- Only the business owner with an active Lounge membership and superusers may create, edit, or delete its notices.
- Users may create/read/delete only their own subscription preference for a currently visible Lounge business.
- Subscriber fan-out must use least-privilege RLS or a narrowly scoped security-definer RPC; do not introduce application runtime service-role access.

### Admin experience

- Add a localized `공지사항` / `Notices` tab to `LoungeAdminDashboard` alongside the existing performance, business, and event tools.
- Show an empty state until the owner has a business profile.
- Support title, multiline body, and one optional image with immediate publication.
- Accept image files up to 5MB, compress them to a web-friendly format on the server, and show a preview before publication.
- Editing can retain, replace, or remove the image while preserving the notice ID and direct link.
- List existing notices newest first with edit and delete actions.
- Editing preserves the notice ID/direct link and updates `updated_at`.
- Deleting requires confirmation and makes the former public URL return not found.
- Creating, editing, or deleting is disabled/rejected when the Lounge membership is not active.

### Public experience

- Add a notice section after the business introduction/contact card and before `전체 일정` on the Lounge business detail page.
- The section remains visible when it has zero notices, so a user can subscribe before the first post.
- Place `공지 알림받기` / `Get notice alerts` in the notice-section header, visually distinct from contact CTAs.
- Show the active state clearly and allow one-action unsubscribe. Anonymous clicks redirect to localized login and preserve a return path.
- List notice cards newest first; cards show an image thumbnail when present, title, and KST publication date and link to the dedicated notice detail page.
- Dedicated route shape: `/{locale}/lounge/{businessSlug}/notices/{noticeId}`.
- Notice detail includes a back link, Lounge identity, title, KST publication date, attached image when present, body with preserved line breaks, and share action.
- Generate localized metadata/Open Graph values for the notice detail using the notice image first, then the business cover image or existing Lounge fallback.

### Sharing

- Share the canonical notice detail URL, never tracking/search parameters.
- Reuse the current Lounge Web Share API behavior with clipboard fallback and localized success/failure feedback.
- Shared title/text identifies both the notice and Lounge business.

### Subscription and push behavior

- Subscription is explicit opt-in and account-level per Lounge business.
- Label and contextual copy make clear that it covers notices only.
- Subscribing never sends old notices retroactively.
- Only creating a new notice triggers fan-out; edits and deletes do not.
- Exclude the publishing owner from fan-out even if subscribed.
- Push title identifies the Lounge business; body uses the notice title; URL deep-links to the dedicated notice detail.
- Use `sendPushNotification(..., { skipEmail: true })` because the agreed channel is push, not email.
- Individual missing device subscriptions or delivery failures are logged but do not roll back or report the successfully created notice as failed.
- Reuse the existing push/PWA enablement or guide flow so a subscribed account is not misleadingly told that the current device can receive pushes when permission/device registration is absent.
- If no persisted recipient locale exists, use the repository's Korean push fallback while keeping public pages fully KR/EN localized; adding locale-preference persistence is outside this release.

## Out of scope / non-goals

- Drafts or publish/unpublish controls per notice.
- Scheduled publication.
- Pinned/important notices.
- Multiple images, rich text, or non-image file attachments in notice content.
- Event or business-profile update notifications.
- Retroactive pushes for existing notices.
- Email delivery for Lounge notice subscriptions.
- Notice comments, reactions, view counts, subscriber counts, or notice analytics.
- Public notice search, global Lounge notice feed, pagination, or cross-business aggregation.
- Club notice refactoring or migration.
- Persisting a new user locale preference solely for push localization.

## Decision boundaries

Codex may decide without further confirmation:

- Component/file boundaries, naming, migration/RPC structure, indexes, cache invalidation, and focused tests.
- Exact card spacing, icons, empty-state copy, loading/error feedback, and responsive layout within established Lounge and PowerPlay visual patterns.
- Whether admin edit is inline or modal, provided all accepted operations remain clear and accessible.
- Share utility reuse/generalization and metadata implementation.
- Safe push failure handling and logging details.

User confirmation is required if a proposed change would:

- Restrict public notice visibility.
- Auto-subscribe users or broaden notification categories.
- Add a rich publishing feature listed as out of scope.
- Send email or another new channel.
- Change Lounge pricing/membership rules or club behavior.

## Testable acceptance criteria

1. A visitor can view a published Lounge's notice list and each notice detail without authentication in both `/ko` and `/en`.
2. An unpublished/expired Lounge's notices are not publicly readable even by guessing a notice UUID.
3. An active Lounge owner can create a non-empty title/body notice from Admin > Lounge and see it immediately on the public page.
4. The same owner can edit title/body without changing the notice URL.
5. The same owner can confirm deletion; the notice disappears from lists and its detail route returns not found.
6. An unrelated admin cannot mutate another Lounge's notices; a superuser can manage them according to existing superuser policy.
7. Notice lists are ordered newest first and dates render in `Asia/Seoul`.
8. Each notice card opens `/{locale}/lounge/{slug}/notices/{id}`.
9. Share uses the canonical notice URL through native share when supported and clipboard fallback otherwise.
10. Anonymous `공지 알림받기` redirects to the localized login flow with a return path.
11. A signed-in user can subscribe idempotently, see the active state after refresh, unsubscribe, and remain unsubscribed after refresh.
12. A user cannot create or delete another user's subscription row.
13. Creating a notice sends one fan-out attempt per unique subscribed user other than the publisher and deep-links to that notice.
14. Users who subscribed after publication receive no push for that older notice.
15. Editing or deleting a notice sends no push.
16. A push failure or missing device subscription does not undo the created notice and is observable in existing notification logging.
17. The notice subscription control accurately guides users whose current browser/PWA push permission is not enabled.
18. Public and admin UI remain responsive, localized, keyboard accessible, and consistent with existing Lounge styling.
19. Typecheck, lint, relevant tests, full test suite, and production build pass before completion; Lounge public/admin flows receive manual visual verification on mobile and desktop.
20. An owner can optionally upload one image of at most 5MB, preview it, and publish it with a notice; the server stores a compressed WebP version.
21. An existing notice image can be retained, replaced, or removed during editing without changing the notice URL.
22. Attached images appear in the public notice list and detail page, and the notice image is preferred for social sharing metadata.

## Assumptions exposed and resolved

- **Assumption:** `알림받기` would naturally mean notice-only alerts. **Resolution:** Rejected; label it `공지 알림받기` and place it inside the notice section.
- **Assumption:** Club membership can double as the Lounge subscription model. **Resolution:** Rejected; Lounge interest is an independent explicit subscription and must not imply club/team membership.
- **Assumption:** Premium means a rich CMS. **Resolution:** Rejected; this release adds one optional image for practical visual notices while drafts, rich text, galleries, and files remain outside the lightweight CRUD model.
- **Assumption:** Delivery success should gate notice publication. **Resolution:** Rejected; persistence is authoritative and individual push delivery is best-effort with logging.

## Pressure-pass finding

Round 1's proposed short label was revisited in Round 2. The follow-up exposed that users could reasonably expect event and business-update notifications. The contract was tightened to notice-only pushes, the label became `공지 알림받기`, and placement moved into the notice-section header.

## Brownfield evidence vs inference

### Evidence

- `club_posts` and `createClubNotice` provide a basic notice and push pattern, but club notification recipients are represented by club memberships.
- The public club page renders notices inline and does not offer dedicated notice routes.
- `LoungeAdminDashboard` is already tab-based and is the correct owner-facing extension point.
- `LoungeBusinessDetail` currently renders the business profile before the full schedule section, leaving a coherent notice-section insertion point.
- `LoungeShareButton` already implements native share and clipboard fallback.
- Lounge visibility and mutation already depend on active membership and business ownership through existing server actions and RLS.
- `sendPushNotification` sends email unless passed `{ skipEmail: true }`.

### Inference authorized by user

- A notice tab is preferable to embedding notice CRUD in the business form.
- A public notice section between business information and schedules provides high visibility without mixing notices with transactional contact buttons.
- Dedicated slug + notice-ID routes give stable share links without requiring editable notice slugs.
- Notice email delivery, analytics, and richer publishing would add scope without serving the clarified first-release outcome.

## Verification expectations

- Add focused authorization/RLS and server-action tests where the existing test harness permits.
- Mock push delivery to verify recipient selection, publisher exclusion, trigger conditions, `skipEmail`, and failure tolerance.
- Verify KR/EN content and KST dates.
- Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.
- Manually verify admin CRUD, anonymous/public detail and sharing, logged-in subscribe/unsubscribe, disabled push guidance, and mobile/desktop layout.
