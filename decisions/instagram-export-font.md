# Bundle the Instagram export typeface

- Date: 2026-11-01
- Status: active
- Scope: `/[locale]/instagram/**` and its Playwright captures

Use self-hosted Pretendard Variable 1.3.9 through `next/font/local`, with its
SIL Open Font License retained in `public/fonts/pretendard/LICENSE`. Source:
https://github.com/orioncactus/pretendard/tree/v1.3.9/packages/pretendard/dist/web/variable/woff2

The old `--font-pretendard` variable contained only system fonts, without loading
Pretendard. GitHub Ubuntu and macOS selected different Korean fonts and weights.
`document.fonts.ready` also resolved when those OS fallbacks were used.

Scope the approximately 2 MB full Korean font to export pages rather than every
user page. Keep the existing design and requested weights. Use one variable file
instead of network-dependent CDN subsets or a runner-installed font. Preload the
bundled face and require it at capture time for all story weights. Verify actual
Korean/Latin glyph fonts through Chromium's CSS platform-font API on Linux CI.

Revert this change to roll back; no stored votes, ranking rules, or schema change.
