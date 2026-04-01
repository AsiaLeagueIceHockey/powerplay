# PowerPlay Project Map

## Source of Truth

- Primary: `AGENTS.md`
- Current implementation: `src/`, `sql/`, `messages/`
- Historical/planning context: `README.md`

If a doc conflicts with code, trust code and update the doc before finishing.

## Runtime Stack

- Next.js 16.1.1 App Router
- React 19
- TypeScript strict mode
- Tailwind CSS v4
- `next-intl` with locale prefix `always`
- Supabase SSR/Auth/Postgres
- Serwist PWA + web push
- Naver Maps
- Vitest + Testing Library + Playwright scripts

## Route Layout

- `src/app/layout.tsx`: root metadata shell only
- `src/app/[locale]/layout.tsx`: locale validation, i18n provider, top loader, push provider, onboarding guard, install prompt, analytics, global metadata
- `src/app/[locale]/(public)/layout.tsx`: public header + bottom navigation
- `src/app/[locale]/(admin)/admin/layout.tsx`: admin shell, superuser-only nav sections
- `src/app/[locale]/onboarding/page.tsx`: isolated full-page onboarding outside `(public)`

## Main User Flows

- Home feed: `src/app/[locale]/(public)/page.tsx`
  - Uses `getCachedMatches`, `getCachedRinks`, `getCachedClubs`
  - Client filtering/rendering lives in `src/components/home-client.tsx`
- Match detail/apply: `src/app/[locale]/(public)/match/[id]/page.tsx`
  - Uses `getMatch`
  - Join/cancel/waitlist UI lives in `src/components/match-application.tsx`
- My page/profile: `src/app/[locale]/(public)/mypage/page.tsx`
- Points pages: `src/app/[locale]/(public)/mypage/points/**`
- Clubs: `src/app/[locale]/(public)/clubs/**`
- Chat: `src/app/[locale]/(public)/chat/page.tsx` and `src/app/[locale]/chat/[roomId]/page.tsx`

## Main Admin Flows

- Match CRUD + bulk creation: `src/app/actions/admin.ts`
- Admin match pages: `src/app/[locale]/(admin)/admin/matches/**`
- Club CRUD: `src/app/[locale]/(admin)/admin/clubs/**`
- Rink CRUD/approval: `src/app/[locale]/(admin)/admin/rinks/**`
- Superuser pages:
  - users/admins: `admins/**`
  - points: `points/page.tsx`
  - all matches: `all-matches/page.tsx`
  - audit logs: `audit-logs/page.tsx`
  - settings: `settings/page.tsx`

## Action Ownership

- `auth.ts`: sign-in/OAuth/profile update/onboarding/player card issuance
- `match.ts`: public match fetch, join, cancel, waitlist
- `admin.ts`: admin match/rink flows, bulk creation, admin detail/profile fetch
- `points.ts`: user point balance, history, pending-payment matches, charge requests, refund policy lookup
- `superuser.ts`: charge approval/rejection, global point/user/audit admin functions
- `clubs.ts`: club CRUD, memberships, notices, logo upload
- `chat.ts`: rooms/messages/read state
- `push.ts`: push subscription persistence and delivery
- `cache.ts`: optimized fetchers for home/rink/club lists

## Key Domain Rules

- `superuser` is above `admin`; all admin checks must include both.
- All user-facing public pages must be KR/EN translated.
- `pending_payment` is visible in detail/admin flows but should not inflate cached public participant counts.
- Match cancellation/refund logic must include rental fees when applicable.
- Profile deletion is soft-delete only.
- Push token fan-out relies on RPC `get_user_push_tokens` from `sql/v18_secure_push_rpc.sql`.
- Onboarding is globally enforced by `OnboardingGuard`.

## Data / SQL State

- SQL migrations live in `sql/v*.sql`
- Latest migration present: `sql/v32_rink_approval.sql`
- Feature-heavy migrations after v23:
  - v23 match type
  - v24-v25 rental
  - v26 team match
  - v27 profile details
  - v28 player card
  - v29 chat
  - v30 max guests
  - v31 duration
  - v32 rink approval

## Tests and Scripts

- Unit/integration-ish tests:
  - `src/app/actions/__tests__/financial-flows.test.ts`
  - `tests/unit/*.test.ts`
- Utility scripts:
  - `scripts/capture-instagram-story.ts`
  - `scripts/update-rinks.js`

## Known Drift to Remember

- `README.md` still includes older planning-era stack notes.
- `AGENTS.md` is more current, but always confirm against code when touching critical flows.
