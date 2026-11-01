# Instagram export font consistency — 2026-11-01

## Scope

Restore consistent Korean/Latin typography in monthly, daily, and weekly story
exports. Preserve ranking data, layout, copy, and the ordinary application UI.
Bundle Pretendard with its license under the Instagram route layout. Capture must
fail instead of silently exporting system fallback fonts. Add a secret-free Linux
browser check that verifies the actual rendered glyph face and a missing-font case.

## Evidence

The previous CSS variable was named Pretendard but contained only OS font names.
Chromium on macOS selected `Apple SD Gothic Neo` and `.SF NS`, both non-custom;
the supplied Ubuntu result used a different fallback. Font readiness alone cannot
prove the intended font exists. After the change, Chromium reports the Korean and
Latin club-name glyphs as custom `Pretendard Variable` / `PretendardVariable-Black`.

## Verification

- Public anonymous routes: `/ko/instagram/club-ranking?month=2026-10`,
  `/ko/instagram/matches?date=2026-11-01`, and
  `/ko/instagram/weekly-matches?weekStart=2026-11-02&page=1`.
- Monthly empty state, Korean/English routes, and 390×844 viewport alongside the
  1080×1920 fixed export canvas. These are export canvases and intentionally keep
  their fixed size on narrow viewports.
- Check browser console/page errors, missing translations, and server errors;
  inspect the production screenshot before delivery.
- Run full tests, typecheck, production build, strict lint of changed files,
  `actionlint`, and Linux `scripts/check-story-fonts.ts` via Automation checks.
- Existing whole-repository lint debt remains outside this bounded fix (see the
  Actions recovery record); no rules are suppressed.

No production storage upload or Slack send is required for font verification.
After the app deployment includes the font, a new monthly dispatch for `2026-10`
regenerates the stored image. Existing PNGs do not change automatically.

## Observed local results

All six route/viewport cases above passed on the production build: canvas remains
1080×1920, Korean/Latin club-name glyphs use custom Pretendard Variable, and no page,
translation, or browser console errors appeared. The Vercel-only analytics script
was fulfilled with an empty script locally (its localhost URL otherwise returns
404); no application resources or data were stubbed. Server emitted only the
expected missing VAPID configuration warning because this isolated preview uses
public Supabase configuration, without push secrets.

Full test suite: 31 files / 209 tests passed. Typecheck, production build,
`actionlint`, and changed-file lint passed (one existing unused translation-variable
warning on the daily page). The browser smoke check passed both real custom-font
rendering and intentional missing-font rejection. Production monthly PNG was
visually inspected, including a close-up of the heading and first two club names.
