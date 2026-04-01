# Match Duration Feature

## Goal
Allow administrators to specify match duration (e.g. 90 minutes, 120 minutes, or a custom amount) during individual and bulk match creation. Null is default for existing matches. Users should see this duration in match lists and detail pages.

## Proposed Changes

### Database & Types
#### [NEW] sql/v31_add_match_duration.sql
- Add `duration_minutes` (INTEGER, nullable) to `matches` table.

#### [MODIFY] src/app/actions/match.ts
- Add `duration_minutes?: number | null;` to `Match` interface.
- Select `duration_minutes` in `getMatches` and `getMatch` API calls.

#### [MODIFY] src/app/actions/admin.ts
- Add `duration_minutes` to `BulkMatchInput` interface.
- Pass `duration_minutes` to Supabase insert/update payloads in `createMatch`, `updateMatch`, and `createBulkMatches`.

#### [MODIFY] src/lib/bulk-match-utils.ts
- Add `duration_minutes?: number | null;` to `SchedulePattern` and `GeneratedMatch` types.
- Update `buildGeneratedMatch` and pattern builders to pass this through.

---

### UI Components

#### [MODIFY] src/components/match-form.tsx
- Add a new "Match Duration" selector under Date/Time with options: `90 minutes`, `120 minutes`, and `Custom` (showing numeral input if Custom is selected).

#### [MODIFY] src/components/schedule-pattern-card.tsx
- Add the same "Match Duration" UI element as `match-form.tsx`. Include `duration_minutes` update handlers.

#### [MODIFY] src/components/match-card.tsx
- If `duration_minutes` exists, display it next to the time (e.g. `22:00 (120분)`). Keep it small so it doesn't break the UI.

#### [MODIFY] src/components/match-application.tsx
- Add a prominent display of the test duration alongside the match start time.

### Translations
#### [MODIFY] messages/ko.json & en.json
- Add string translations for "Match Duration", "90 mins", "120 mins", "Custom", etc.

### Tests
#### [MODIFY] tests/unit/bulk-match-utils.test.ts
- Add cases to verify `duration_minutes` gets correctly pipelined via `generateMatchDates`.

## Verification Plan
### Automated Tests
- Run `npm run test` tests for `bulk-match-utils`.

### Manual Verification
- Deploy the dev environment.
- Single creation: Create match -> ensure options work (90 mins, custom), verify matches in DB with the correct integer. 
- Bulk creation: Create patterns -> assure pattern carries the duration option correctly.
- Ensure the user list renders the duration beautifully without layout issues.
