# Lounge notices context snapshot

- Captured: 2026-08-09T01:12:55Z
- Task type: Brownfield feature definition
- Task statement: Add premium notice publishing to each Lounge business, with admin authoring, public notice detail pages, sharing, and opt-in push delivery.
- Desired outcome: Lounge owners can communicate durable updates from the existing Lounge admin, and users can discover, open, share, and subscribe to those updates from the public Lounge experience.
- Stated solution: Reuse established PowerPlay club-notice UI patterns where suitable, while giving Lounge notices dedicated pages and premium sharing/subscription UX.
- Probable intent hypothesis: Turn a Lounge listing from a static promotion profile into an ongoing audience channel that gives premium businesses more recurring value and gives users a reliable source of business updates.

## Known facts and evidence

- `src/app/actions/clubs.ts` stores club notices in `club_posts`; `createClubNotice` authorizes system or club admins and pushes to all other `club_memberships` users.
- `src/app/[locale]/(public)/clubs/[id]/page.tsx` renders club notices inline only; it has no dedicated notice route.
- `src/components/admin-club-notices.tsx` provides create/list UI but currently has no implemented delete/edit behavior.
- `src/app/actions/lounge.ts` owns Lounge admin/public reads, business/event mutations, membership checks, and existing push calls.
- `src/components/lounge-admin-dashboard.tsx` currently has Performance, Business, Events, and optional Featured tabs.
- `src/app/[locale]/(public)/lounge/[businessId]/page.tsx` resolves a public business by slug and renders `LoungeBusinessDetail`.
- `src/components/lounge-share-button.tsx` already implements Web Share API with clipboard fallback for the business detail page.
- Lounge public visibility is restricted by RLS to published businesses whose owner has an active Lounge membership (`sql/v33_lounge_memberships.sql`, with helper correction in `sql/v37_fix_lounge_public_membership_rls.sql`).
- The latest migration number in the repository is v60, so a new schema change should use the next available version after confirming no parallel migration conflict.
- The repository requires KR/EN support for public UI, KST display, role checks including superuser, and type/lint/test verification.

## Constraints

- Deep Interview is requirements-only: no production implementation during this mode.
- Preserve active Lounge membership and ownership boundaries in all notice authoring paths.
- Public UI must support Korean and English.
- Push delivery must use the existing safe `sendPushNotification` / token RPC path.
- Reuse existing PowerPlay and Lounge design primitives where suitable; the new notice detail/share experience should still feel premium.
- Existing unrelated worktree change in `src/components/card-news-studio.tsx` must remain untouched.

## Unknowns and open questions

- Whether notice content is public to everyone or gated to signed-in/subscribed users.
- Whether Lounge following is explicit opt-in, implicitly created by another action, or supports multiple notification levels.
- Exact notice lifecycle: create only, or edit/delete/draft/publish/pin/schedule/archive.
- Placement and ordering of notice list on the business detail page and Lounge landing page.
- Whether each notice should have SEO metadata, image/attachment support, view counts, or analytics.
- Push locale selection, failure semantics, email fallback, and whether owners receive self-notifications.
- Subscription UX behavior when browser push is disabled or unsupported.
- Expected admin and public acceptance criteria.

## Decision-boundary unknowns

- Product decisions Codex may make without confirmation versus decisions requiring approval.
- Explicit non-goals for the first release.
- Whether the first release should optimize for a minimal durable announcement channel or a richer publishing system.

## Likely codebase touchpoints

- `sql/v*.sql` for Lounge notices and per-business subscriptions with RLS/indexes.
- `src/app/actions/lounge.ts` for authenticated owner CRUD, public reads, subscription toggles, and push fan-out.
- `src/components/lounge-admin-dashboard.tsx` plus a Lounge notice manager component.
- `src/components/lounge-business-detail.tsx` for notice discovery and subscription control.
- New localized public notice detail route under `src/app/[locale]/(public)/lounge/[businessId]/...`.
- `src/components/lounge-share-button.tsx` or a generalized notice-share variant.
- `messages/ko.json` and `messages/en.json`.
- Focused tests for authorization, subscription semantics, and push fan-out.

## Interview decisions

### Round 1

- Notice pages are publicly readable and shareable by everyone.
- Push delivery is explicit opt-in for signed-in users, scoped per Lounge business, and applies only to notices published after subscription.
- User-facing control label: `알림받기` rather than `공지 알림받기`.
- Codex should select an appropriate placement based on the existing Lounge detail hierarchy.
- Placement evidence: the business hero currently reserves the upper-right corner for a small share icon, while the contact panel contains four transactional CTAs. A subscription control should be evaluated as a persistent relationship action rather than mixed blindly into contact methods.
- Unresolved assumption: whether `알림받기` promises only new notices or all future updates from that Lounge business.

### Round 2

- The subscription sends push notifications only for newly published notices, not events or business-profile changes.
- The public control label is `공지 알림받기`.
- The control belongs within the notices section UI, making its scope visible rather than presenting it as a business-wide hero action.
- Pressure-pass result: the broader `알림받기` label was rejected because it would imply update categories outside the requested feature.

### Round 3

- First-release notice lifecycle: create, edit, delete, and publish immediately.
- Explicit non-goals: drafts, scheduled publishing, pinned notices, images, and attachments.
- Simplifier result: keep the release focused on a durable text announcement channel; do not expand it into a content-management system.

### Round 4

- Codex may decide implementation details such as notice placement, card composition, detail URL, share fallback, push wording, empty states, schema, and RLS by following established PowerPlay/Lounge patterns.
- User confirmation is required only if implementation would change public visibility, notification scope, agreed feature scope, or another material product boundary.
- Decision-boundary gate is satisfied.
