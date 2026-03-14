# Premium Showcase Hub

## Goal

Add a new bottom navigation tab between Home and Chat for premium promotional partners who pay a monthly subscription to expose their hockey-related business on PowerPlay.

This hub should support:

- public discovery for users
- admin-side publishing for subscribed partners
- superuser-side subscription contract management
- basic performance tracking (impressions, clicks)

## Naming Options

### Recommended

- `라운지` / `Lounge`
  - Covers lessons, training centers, tournaments, and brands without sounding ad-only
  - Feels premium and community-adjacent
  - Works for both public discovery and paid partner positioning

### Alternatives

- `클래스` / `Classes`
  - Strong for lessons only, weak for tournaments/brands
- `홍보` / `Promotions`
  - Accurate but feels too ad-like
- `비즈` / `Biz`
  - Short but less friendly for normal users

## Working Assumptions

- Internal feature name: `premium-showcase-hub`
- Public tab label: `라운지`
- New bottom nav order: `홈 > 라운지 > 채팅 > 마이페이지`
- Public route: `/${locale}/lounge`
- Admin route: `/${locale}/admin/lounge`
- First version uses manual subscription confirmation by SuperUser after bank transfer or external inquiry
- Partner posts drive users to external contact methods, not in-platform payment
- Categories start with:
  - hockey lessons
  - training / shooting centers
  - tournaments
  - brands / services

## Open Questions

- Admin role is reused, but only while the stored lounge subscription period is active.
- One subscribed account can publish exactly one representative business profile.
- V1 includes both business showcase cards and lesson/event schedule cards with calendar exposure.
- Supported v1 CTAs: phone, Kakao open chat, Instagram, website.
- Is exposure ranking curated manually, newest-first, or boosted by subscription tier?

## TODO

### Phase 1: Product Definition
- [x] Finalize public tab naming
- [x] Finalize partner subscription entitlement model
- [x] Finalize content model: showcase + schedule/event cards
- [x] Finalize supported CTA link types
- [x] Define v1 analytics scope (impression/click metrics + CTA breakdown + detail click tracking)

### Phase 2: Data Model
- [x] Design subscription tables for partner membership period and status
- [x] Design partner listing table and categories
- [x] Design optional partner events / schedule model if included in v1
- [x] Design analytics event storage
- [x] Create SQL migration plan with RLS

### Phase 3: Admin / SuperUser UX
- [x] Add admin partners entry page
- [x] Show marketing/paywall page for non-subscribers
- [x] Show expired-state renewal page for lapsed subscribers
- [x] Build partner publishing UI for active subscribers
- [x] Build superuser controls for subscription contract start/end management

### Phase 4: Public UX
- [x] Add new bottom navigation tab
- [x] Add home promotional banner entry
- [x] Build public partners discovery page
- [x] Build partner detail page / CTA routing
- [x] Track impressions and clicks

### Phase 5: Polish / TODOs
- [x] Reserve space for future premium extras
- [x] Add i18n keys (KR/EN)
- [x] Add verification plan
- [x] Commit in small checkpoints during implementation

## Current State

- SQL `v33_lounge_memberships.sql` is applied.
- SQL `v34_lounge_priority_and_sources.sql` is applied.
- Next SQL to apply: `v35_lounge_location_maps.sql`
- Public lounge supports:
  - listing page
  - business detail page
  - event list/calendar discovery
  - business category filtering
  - featured badges driven by display priority
  - CTA tracking for phone / Kakao / Instagram / website
  - `detail` click tracking from business cards and event cards
  - source attribution from bottom nav / home banner
  - source-preserving detail navigation
  - business region exposure in cards
  - event region exposure in cards
  - business detail map
  - event detail maps
- Admin lounge supports:
  - paywall / expired renewal state
  - one representative business editor
  - multiple lounge event creation, editing, and deletion
  - business / event display priority controls
  - summary metrics + CTA click breakdown + source attribution
  - recent daily trend and per-event performance blocks
  - source-level impressions/clicks/CTR breakdown
  - superuser manual membership contract entry
  - business/event Naver map URL parsing for location metadata

## Remaining Next Slice

- exposure ordering / featured ranking rules
- event editing UX
- richer analytics dashboard:
  - separate impression vs click source attribution
  - richer filters / longer history
- media optimization for remote lounge images
- location polish:
  - public map placement / density tuning
  - optional nearby filtering

## QA

- Manual QA checklist:
  - `.agent/implementation/lounge-qa-checklist.md`
