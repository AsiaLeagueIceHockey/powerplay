# Environment Checklist

## Core Commands

- `npm run dev`
- `npm run lint`
- `npm run test`
- `npm run typecheck`
- `npm run build`

## Required Environment Variables

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Used by SSR/browser clients, middleware, sitemap, and most server actions.

### Optional but Needed for Specific Work

- `SUPABASE_SERVICE_ROLE_KEY`
  - used by scripts such as `scripts/capture-instagram-story.ts`
- `SITE_URL`
  - defaults to `https://powerplay.kr` in scripts
- `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`
  - required for client map rendering and map parsing helpers
- `NAVER_MAP_CLIENT_SECRET`
  - required for server-side Naver geocoding/parsing flows
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
  - required for push subscription in the browser
- `VAPID_PRIVATE_KEY`
  - required for push delivery on the server
- `VAPID_SUBJECT`
  - defaults to `mailto:admin@powerplay.kr`
- `NEXT_PUBLIC_GOOGLE_VERIFICATION`
- `NEXT_PUBLIC_NAVER_VERIFICATION`

## SQL Prerequisites Worth Remembering

- `sql/v18_secure_push_rpc.sql`: push token RPC
- `sql/v28_player_card.sql`: player card sequence + RPC
- `sql/v33_lounge_memberships.sql` through `sql/v39_lounge_business_category_other.sql`: lounge schema
- latest schema file in repo: `sql/v39_lounge_business_category_other.sql`

## Safe Startup Checklist

1. Confirm `.env.local` has the needed keys for the task.
2. Confirm target SQL migrations are already applied if the task depends on them.
3. Use `npm run lint`, `npm run typecheck`, and `npm run test` before claiming a task complete.
4. If changing public metadata, routing, or build-time assets, run `npm run build`.
