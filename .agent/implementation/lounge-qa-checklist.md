# Lounge QA Checklist

## Goal

Manual QA checklist for the `라운지 / Lounge` feature before preview review and feedback collection.

## Environment

- Branch: `feature/premium-showcase-hub`
- Required SQL:
  - [x] `sql/v33_lounge_memberships.sql`
  - [x] `sql/v34_lounge_priority_and_sources.sql`
  - [x] `sql/v35_lounge_location_maps.sql`
  - [x] `sql/v36_lounge_featured_businesses.sql`
  - [x] `sql/v37_fix_lounge_public_membership_rls.sql`
  - [x] `sql/v38_lounge_business_slugs.sql`
  - [x] `sql/v39_lounge_business_category_other.sql`
  - [x] `sql/v40_lounge_business_category_youth_club.sql`
- Key routes:
  - public lounge: `/{locale}/lounge`
  - public lounge detail: `/{locale}/lounge/{businessId}`
  - admin lounge: `/{locale}/admin/lounge`

## Test Accounts

- `superuser`
  - can register lounge membership periods
- `admin` with active lounge membership
  - can create one representative business
  - can create, edit, delete lounge events
- `admin` without active lounge membership
  - should see paywall / renewal state
- normal user
  - can browse lounge and click CTAs

## Seed Data Suggestion

- Business A
  - category: `lesson`
  - display priority: `20`
  - published: `true`
  - all CTA links filled
- Business B
  - category: `training_center`
  - display priority: `10`
  - published: `true`
- Business C
  - category: `brand`
  - display priority: `0`
  - published: `true`
- Events
  - at least 3 events under Business A
  - at least 2 events under Business B
  - one featured event with `display_priority > 0`
  - one unpublished event

## Public Flow

- [ ] Bottom nav shows `라운지` between `홈` and `채팅`
- [ ] Home banner carousel includes the lounge banner
- [ ] Clicking bottom-nav lounge enters `/ko/lounge?source=bottom-nav`
- [ ] Clicking banner lounge enters `/ko/lounge?source=home-banner`
- [ ] Lounge hero renders without layout break on mobile and desktop
- [ ] Business list renders published businesses only
- [ ] Higher `display_priority` business appears before lower-priority business
- [ ] Featured business shows `추천 파트너` badge
- [ ] Category filter chips work:
  - [ ] `전체`
  - [ ] `유소년 클럽`
  - [ ] `레슨`
  - [ ] `훈련장`
  - [ ] `대회`
  - [ ] `브랜드`
  - [ ] `치료/재활`
  - [ ] `기타`
- [ ] Empty-state message is correct when a category has no businesses
- [ ] Business card shows:
  - [ ] category badge
  - [ ] title / tagline
  - [ ] address when present
  - [ ] upcoming event count
  - [ ] CTA buttons
- [ ] Clicking `상세 페이지에서 일정과 소개 더 보기` moves to detail page
- [ ] Detail page keeps `source` query param
- [ ] Detail page shows:
  - [ ] cover image area
  - [ ] logo area
  - [ ] intro text
  - [ ] CTA buttons
  - [ ] quick schedule snapshot
  - [ ] full upcoming event list
  - [ ] related businesses section
- [ ] Event list view renders correctly
- [ ] Calendar view renders correctly
- [ ] Date filter limits events by selected date
- [ ] Featured event shows `추천 일정` badge
- [ ] Unpublished event does not appear publicly

## CTA Tracking Smoke Test

- [ ] From lounge list, click:
  - [ ] phone
  - [ ] Kakao
  - [ ] Instagram
  - [ ] website
- [ ] From lounge detail, click:
  - [ ] phone
  - [ ] Kakao
  - [ ] Instagram
  - [ ] website
- [ ] From event card, click:
  - [ ] business detail
  - [ ] Kakao
  - [ ] Instagram
  - [ ] website

## Admin Flow

- [ ] Admin without active membership sees paywall state
- [ ] Expired membership admin sees expired state copy
- [ ] Active membership admin sees dashboard instead of paywall
- [ ] Representative business form saves successfully
- [ ] Only one representative business is editable per subscribed admin
- [ ] Business `display_priority` save is reflected in public ordering
- [ ] Business `즉시 공개` off hides the business publicly
- [ ] Event create works
- [ ] Event edit works
- [ ] Event delete works
- [ ] Event `display_priority` save is reflected in public ordering
- [ ] Event `즉시 공개` off hides the event publicly

## SuperUser Flow

- [ ] Superuser can open `/ko/admin/lounge`
- [ ] Membership manager is visible only for superuser
- [ ] Superuser can assign a lounge membership to an admin
- [ ] Start/end period is stored correctly
- [ ] Newly activated admin immediately gets lounge admin access

## Analytics Check

- [ ] Admin metrics cards update after public browsing / CTA clicks
- [ ] CTA breakdown increases for clicked CTA types
- [ ] `상세 보기` click count increases after internal detail navigation
- [ ] Source attribution block shows `bottom-nav` when entering from bottom nav
- [ ] Source attribution block shows `home-banner` when entering from banner
- [ ] Source CTR is calculated as expected
- [ ] Recent 7-day trend block shows impression/click changes
- [ ] Event performance block shows top-performing events
- [ ] Featured or frequently clicked events rise in useful signal, even if ordering remains manual

## i18n / Locale Check

- [ ] Korean route `/ko/lounge` works
- [ ] English route `/en/lounge` works
- [ ] English route `/en/lounge/{businessId}` works
- [ ] English admin route `/en/admin/lounge` works
- [ ] No obvious Korean-only copy leaks on public EN pages

## Mobile Check

- [ ] Bottom nav remains usable on small screens
- [ ] Category chips scroll horizontally without breaking layout
- [ ] Cards do not overflow horizontally
- [ ] CTA buttons are still tappable
- [ ] Admin event form remains editable on mobile width

## Regression Check

- [ ] Existing bottom nav links still work:
  - [ ] home
  - [ ] chat
  - [ ] mypage
- [ ] Home banner carousel still rotates correctly
- [ ] Admin sidebar still links to lounge correctly
- [ ] No breakage in unrelated tests after lounge work

## Notes Template

Use this format while testing:

```md
### Issue
- route:
- account:
- expected:
- actual:
- repro steps:
- screenshot:

### Improvement
- route:
- suggestion:
- reason:
```
