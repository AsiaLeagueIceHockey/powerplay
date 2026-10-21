---
name: ui-component-pattern
description: Author or refactor ordinary PowerPlay, Lounge and Youth UI using the shared native design system while preserving existing behavior and brand semantics.
---

# Shared UI authoring

Read `docs/design-system.md`, the canonical guide, before changing ordinary user UI. Check `docs/design-system-routes.json` for source/runtime coverage and `scripts/ui-policy.json` for existing narrow exceptions. Preserve project-specific instructions in `AGENTS.md`.

## Choose the existing layer

- Use `@/components/ui` native primitives for new buttons, locale-aware link buttons, icon buttons, fields, surfaces, badges, chips, view switches and modal/sheet presentations.
- Use pure recipes from `@/components/ui/styles` when an existing domain control must retain its element, event isolation or tracking behavior.
- Keep authorization, votes, applications, payments, filter drafts, chat and provider behavior in domain components. No new UI dependencies or blanket element styling.
- Do not import nonexistent `@/lib/utils` / `cn` or assume a `Dialog` engine exists. The real conditional helper is `uiClassNames`; modal/sheet primitives are presentation-only.

## Author the UI

- Select documented variants/sizes/tones rather than redefining shared appearance in `className`; layout width, placement and visibility classes are allowed.
- Keep existing PowerPlay blue/navy, Lounge gold plus category accents, Youth violet, provider branding and status/points/cheer meaning.
- Use default 44px, compact 36px and large 56px controls. Existing club actions retain 46px height, 18px icons and one-line labels; reuse `club-detail-action-styles`.
- Write `type="submit"` explicitly for submissions; `Button` defaults to `type="button"`. Preserve ref, native props, form wiring, ARIA and events. Icon-only actions require `IconButton`'s `label`.
- Use `Field` with a stable `id`, label and optional help/error around one native/shared control. Preserve existing descriptions and validation logic.
- Preserve correct links/buttons and keyboard semantics. Use `surfaceStyles` on actionable links rather than making a generic container interactive.
- Keep i18n, OS light/dark and responsive behavior. Ordinary user copy describes user benefit.

```tsx
import { Button, Field, Input } from "@/components/ui";

<Field id="nickname" label={t("nickname")} error={error || undefined}>
  <Input name="nickname" autoComplete="nickname" required />
</Field>
<Button type="submit" loading={saving}>{t("save")}</Button>
```

## Verify and maintain

Update implementation, deterministic gallery example, meaningful regression test and canonical docs together when adding a variant. Add exact, justified semantic exceptions to policy; never except a whole page because runtime access is unavailable.

Run `npm run ui:check`, `npm run ui:test`, `npm run ui:visual`, typecheck, relevant tests and build. Existing DOM tests require Node >=22.12; use the existing bundled runtime if needed. Inspect actual routes with `powerplay-ui-final-check`, including translations, mobile wrapping, console errors and unaffected admin/export output. Never perform a real vote, application, payment or chat read while testing.

Record source migration and runtime evidence separately. Compare existing failures by their identities in `docs/design-system-baseline.json`, not by counts. Include before/after screenshots and honest authenticated coverage gaps in the PR.
