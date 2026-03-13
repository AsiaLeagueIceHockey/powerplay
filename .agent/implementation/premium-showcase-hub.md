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

- `파트너` / `Partners`
  - Broad enough for lessons, off-ice centers, tournaments, and brands
  - Feels premium and durable
  - Works as a business-facing paid membership zone

### Alternatives

- `클래스` / `Classes`
  - Strong for lessons only, weak for tournaments/brands
- `홍보` / `Promotions`
  - Accurate but feels too ad-like
- `비즈` / `Biz`
  - Short but less friendly for normal users

## Working Assumptions

- Internal feature name: `premium-showcase-hub`
- Tentative public tab label: `파트너`
- New bottom nav order: `홈 > 파트너 > 채팅 > 마이페이지`
- Public route: `/${locale}/partners`
- Admin route: `/${locale}/admin/partners`
- First version uses manual subscription confirmation by SuperUser after bank transfer or external inquiry
- Partner posts drive users to external contact methods, not in-platform payment
- Categories start with:
  - hockey lessons
  - training / shooting centers
  - tournaments
  - brands / services

## Open Questions

- Should paid partners also require global `admin` access, or do we need a separate role / entitlement?
- Is one partner account tied to one business listing, or can one subscriber publish multiple listings?
- Should lessons support date-based schedule cards in v1, or should v1 stay closer to a business showcase with optional event cards?
- What exact external CTAs should be supported in v1: phone, Kakao open chat, Instagram, website?
- Is exposure ranking curated manually, newest-first, or boosted by subscription tier?

## TODO

### Phase 1: Product Definition
- [ ] Finalize public tab naming
- [ ] Finalize partner subscription entitlement model
- [ ] Finalize content model: showcase page only vs showcase + schedule/event cards
- [ ] Finalize supported CTA link types
- [ ] Define v1 analytics scope (impression/click metrics)

### Phase 2: Data Model
- [ ] Design subscription tables for partner membership period and status
- [ ] Design partner listing table and categories
- [ ] Design optional partner events / schedule model if included in v1
- [ ] Design analytics event storage
- [ ] Create SQL migration plan with RLS

### Phase 3: Admin / SuperUser UX
- [ ] Add admin partners entry page
- [ ] Show marketing/paywall page for non-subscribers
- [ ] Show expired-state renewal page for lapsed subscribers
- [ ] Build partner publishing UI for active subscribers
- [ ] Build superuser controls for subscription contract start/end management

### Phase 4: Public UX
- [ ] Add new bottom navigation tab
- [ ] Add home promotional banner entry
- [ ] Build public partners discovery page
- [ ] Build partner detail page / CTA routing
- [ ] Track impressions and clicks

### Phase 5: Polish / TODOs
- [ ] Reserve space for future premium extras
- [ ] Add i18n keys (KR/EN)
- [ ] Add verification plan
- [ ] Commit in small checkpoints during implementation
