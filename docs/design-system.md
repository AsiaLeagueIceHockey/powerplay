# PowerPlay design system

This is the **single source of UI rules** for ordinary user UI. `CLAUDE.md`, `AGENTS.md` and agent skills point here instead of restating values; when they disagree, this file wins. The original implementation and verification contracts live in `docs/archive/omx/plans/prd-design-system.md` and `docs/archive/omx/plans/test-spec-design-system.md`; the 2026-10-21 visual direction below supersedes their "preserve the current look" goal (see `decisions/design-system.md`). The staged restyle plan is `docs/design-system-restyle-plan.md`.

## Rules at a glance

1. **Use the shared layer.** New ordinary controls use primitives from `@/components/ui`. Use a recipe from `@/components/ui/styles` only when a domain wrapper must keep its own element, event isolation or tracking.
2. **`className` is for layout only**: placement, width, flex/grid, visibility. Never set colors, font size, padding, radius, height or shadow on a shared control. Pick a documented option instead, or add a variant (rule 9).
3. **Colors come from `pp-*` tokens** (`bg-pp-surface`, `text-pp-muted`, `border-pp-border`, `bg-pp-accent` …). Raw Tailwind palette classes and hex values are allowed in ordinary UI only as a recorded exception in `scripts/ui-policy.json`.
4. **Do not pair a token with a `dark:` override** (for example `text-pp-text dark:text-white`). Tokens already resolve for dark mode.
5. **One brand accent, used only for what can be pressed.** Primary actions, links, focus rings and selected states use the brand accent. See "Palette and hierarchy rules" P1–P6. Lounge and Youth section colors currently appear only in badges, icons and accent lines; P5 proposes a per-page family instead.
6. **Status, category, points, cheer and provider colors are exceptions.** Use them only where their meaning is needed, as text or icons rather than large fills (P3, P4). Express hierarchy through type size, weight and gray level, not color (P7–P10).
7. **Icon + label actions never wrap on mobile.** Shared buttons are `nowrap`; wrap the label in `actionLabelClass` so it truncates. Buttons in one group share size. Club detail actions reuse `components/club-detail-action-styles.ts`.
8. **Clickable cards** apply `surfaceStyles({ interactive: true })` to the real link or button; hover and focus come from the recipe, never ad-hoc `hover:border-*` or `hover:shadow-*`. Static panels are not interactive.
9. **A new variant ships together with** its implementation, gallery fixture, behavior test and an update to this guide.
10. **Before reporting UI work as done**, run `npm run ui:check`, `npm run ui:test`, `npm run ui:visual` and `npm run typecheck`, then the PowerPlay UI final check.

Out of scope: administrator screens (`/admin`), the SEO bot renderer and exported image canvases (Instagram, card news, player/club cards, fortune/tamagotchi artwork). Ordinary controls *around* export canvases and artwork are in scope.

## Architecture and boundaries

Use three layers:

1. **Semantic tokens and scoped CSS** in `src/app/globals.css` define surfaces, text, borders, focus, accents, status, radius, spacing and typography. New rules apply through explicit public theme scopes and `pp-*` classes, never a blanket `button`, `input` or `div` selector.
2. **Native primitives and pure recipes** in `src/components/ui/` define repeated appearance and native accessibility contracts. Import components from `@/components/ui` and recipes from `@/components/ui/styles`.
3. **Domain wrappers** own votes, applications, sharing, payments, notification subscriptions, filter drafts, tracking and chat. They use primitives or recipes without moving their business behavior into the design system.

A recipe is useful when a domain wrapper must retain its existing DOM element or event boundary. A primitive is preferred for a new ordinary control. Do not add a polymorphic `asChild` abstraction, external UI suite or dependencies to solve a local styling problem.

The migration does not change server actions, authorization, data schemas, money calculations, refunds, chat read receipts or tracking. A visual test must not submit a real vote/application/payment or read a live chat room.

## Visual direction (amended 2026-10-21)

The UI should be calm and spacious, like the Linear, Vercel and Stripe dashboards: neutral gray surfaces, a single brand accent, restrained corner radius and minimal shadow. Domain meaning (status, points, cheer, categories, providers) stays intact.

The **Now** column is what the tokens implement today. The **Target** column is what the restyle stages in `docs/design-system-restyle-plan.md` deliver. Once a stage lands, update **Now** in the same change.

| Role | Target | Now |
| --- | --- | --- |
| Brand accent | `#2563eb` (hover `#1d4ed8`) for every section's primary actions, links, focus and selection | Done in tokens: `--pp-accent` is `#2563eb` in every scope. Components with hard-coded colors change in stage ③ |
| Section themes | Lounge ice gold `#d4a017` / `#f3d27a` and Youth violet `#7c3aed` exposed as a separate section accent, used only in badges, icons and accent lines | Done in tokens: `--pp-section-accent(-soft/-text)`, used by the `brand` badge. `lounge-theme.ts` hex classes remain until stage ③ |
| Neutrals | One gray family for background, surface, muted surface, border and text in light and dark | Zinc in both modes: light `#fafafa` / `#ffffff` / `#f4f4f5` / border `#e4e4e7` / text `#18181b` / muted `#71717a`. Dark cards use `--pp-card` `#222226` with border `#34343b`, one step above the `#18181b` page |
| Radius | Controls and cards 8px, segmented items 6px, modal and sheet 12px. Chips and badges stay pill-shaped so they read differently from buttons; avatars and circles stay full | Done in tokens (`--pp-radius-control/card` 8px, `--pp-radius-small` 6px, `--pp-radius-sheet` 12px, chips and badges pill). Hard-coded `rounded-*` classes change in stage ③ |
| Shadow | Resting cards have a border only; hover changes the border color. Overlays and popovers get one small shadow | Done in tokens (`--pp-shadow-card/hover` none, `--pp-shadow-overlay`). Hard-coded `shadow-*` classes change in stage ③ |
| Spacing | 4px-based scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64). More generous defaults for page padding, section gap and card padding | Scale defined up to 64px; Surface densities widened to 16/20/24/32. Page and section spacing tokens arrive in stage ② |
| Control sizes | Compact 36px, default 44px, large CTA 56px (touch targets). Club actions 46px with 18px icons and one-line labels | Same |
| Typography | Token scale caption 12, body 14, body-lg 16, heading 18, title 24, display 30, plus a micro step (11px) for dense metadata. Weights 400, 500, 600, 700 only | Four `pp-text-*` classes; ad-hoc sizes include `text-[10px]` and `text-[11px]`; weights 400–900 |
| Theme preference | OS light/dark only | Same |
| Category, status, points, cheer | Keep the hues, used for small marks only | Same hues, sometimes as large fills |
| Provider identity | Kakao yellow, Naver green and provider marks through provider button variants | Same |
| Home discovery | Clubs → Rinks → Matches, with equally compact club-finder banners and the monthly ranking disclosure | Same |

Theme scopes must cover user routes outside `(public)`, including onboarding, chat rooms, fortune controls and the Lounge membership brochure. Global notification and install UI needs its own explicit scope because it is rendered in the locale layout. Administrator screens and export canvases must not pick up the public appearance by accident.

## Palette and hierarchy rules (2026-10-22)

These rules make a screen read as one palette and express importance through type rather than color. They apply to every ordinary user screen. Where a rule conflicts with "Rules at a glance" or the Visual direction table, this section wins once its pending decisions are settled.

**Pending decisions:** the concrete palette values (candidates in `artifacts/ui/palette/`), cheer pink (keep or absorb into the brand family, rule P4) and the Lounge/Youth page-family proposal (rule P5). Until they are decided, the current tokens stay.

### Palette

- **P1. Four families per page.** A page uses at most four color families: white (background), gray (secondary text, borders, muted surfaces), near-black (body text) and one brand family. Each family can have several steps, but there is no fifth family except the exceptions in P3.
- **P2. Tone on tone.** The four families must look related.
  - The brand family has three lightness steps of one hue: **strong** (navy, for emphasized text and headers), **base** (blue `#2563eb`, for buttons and links) and **soft** (a pale tint, for selected-state backgrounds and brand badges).
  - Grays and near-black are cool grays tinted toward the brand hue, not pure neutrals.
- **P3. Exceptions are small and placed.**
  - **Error red** marks error states only, slightly desaturated so it sits in the palette.
  - **External brand colors** (Kakao yellow, Naver green) appear only where the provider's guideline requires them, such as the Kakao login button. Secondary provider actions (Kakao share, open chat) are neutral icon buttons.
  - **Success, warning and points** colors appear only as text or an icon where the meaning is needed, never as a large background.
- **P4. Cheer pink** is pending: either a separate cheer color limited by P3, or absorbed into the brand family.
- **P5. One family per page.** Pending proposal: Lounge and Youth pages replace the brand family with their own three-step family (gold or violet), so blue and gold never share a page. Grays stay shared.

### Hierarchy

- **P6. Blue means pressable.** The brand base color is used only for things that can be pressed: buttons, links and selected controls. Non-interactive text, numbers and decorations do not use it.
- **P7. One accent per card, one primary action per screen.** A card has at most one accent-colored element. A screen has one visually prominent primary action; other actions are secondary, ghost or text links.
- **P8. Hierarchy through type, not color.** Order is name > key facts > description > secondary actions. Express it with size, weight and gray level (near-black → gray).
- **P9. No chip or badge sprawl.** Prefer plain text for information. Use a filled chip or badge only for a state the user must notice, and only as the card's single accent (P7).
- **P10. Same meaning, same shape.** Each kind of marker has one style. For example, all rank markers share one style regardless of rank, and all tags share one style.

## Components and recipes

All controls preserve native form, event, ref and ARIA properties. Shared components use React 19 native `ref` props. `className` is for layout placement/width/visibility, not colors, font sizes, padding, radius or control height. Use a documented option for appearance; extend a primitive and its gallery/test/documentation together when a real new variant is needed.

| Export | Use and options |
| --- | --- |
| `Button`, `LinkButton` | `variant`, `size`, `fullWidth`; `Button` also accepts `loading`. Variants: primary, secondary, outline, ghost, danger, success, warning, cheer, points, kakao, naver. Sizes: compact, default, large, club. |
| `IconButton` | `label` supplies an accessible name; default ghost appearance. Use for an actual icon-only action. |
| `Input`, `Select`, `Textarea` | Native props plus `invalid` and `controlSize="compact" | "default"`. Keep file/hidden/checkbox/date/slider behavior explicit. |
| `Field` | Caller-owned `id`, `label`, optional `help`/`error`, and one control child. Connects label, help and error IDs, preserving existing `aria-describedby`. |
| `Surface` | `density="none" | "compact" | "default" | "roomy"`, optional `interactive`. Use a recipe on a real link/button when the whole card is actionable. |
| `Badge` | `tone="neutral" | "brand" | "success" | "warning" | "danger" | "info" | "cheer"`. Choose by meaning rather than decoration. |
| `FilterChip` | `selected` maps to pressed state; keep filter selection logic in the owner. |
| `SegmentedControl`, `SegmentedItem` | Labeled group with pressed-state buttons. Use for view switches; do not claim tab semantics without a real tabpanel relationship. |
| `ModalSurface`, `SheetSurface` | Required `titleId`; role/dialog title association and appearance only. The owner retains backdrop, open/close state, Escape/focus behavior and scroll locking. |

Matching pure recipes are `buttonStyles`, `fieldStyles`, `surfaceStyles`, `badgeStyles`, `filterChipStyles`, `segmentedItemStyles`, and `overlayStyles`. `uiClassNames` joins conditional class strings; it is not a conflicting-Tailwind resolver. Do not invent a `cn` utility or `Dialog` component that the repository does not provide.

```tsx
import { Button, Field, Input, LinkButton } from "@/components/ui";

// In an existing localized form; onSubmit and validation remain with its owner.
<Field id="player-name" label={t("name")} help={t("nameHelp")} error={nameError || undefined}>
  <Input name="full_name" autoComplete="name" required />
</Field>
<Button type="submit" loading={saving} fullWidth>{t("save")}</Button>
<LinkButton href="/clubs" variant="outline" size="compact">{t("clubs")}</LinkButton>
```

`Button` defaults to `type="button"`; always write `type="submit"` at submission sites. `loading` disables the control and sets `aria-busy`; the domain still owns its existing duplicate-submission guard. Internal `LinkButton` uses the existing locale-aware navigation. External provider actions keep their existing anchor/form behavior and use a recipe rather than routing through an internal link.

```tsx
import { buttonStyles, uiClassNames } from "@/components/ui/styles";

// Existing domain wrapper keeps authorization and click isolation.
<button
  type="button"
  onClick={handleVote}
  disabled={pending}
  className={uiClassNames(buttonStyles({ variant: "cheer", size: "club", fullWidth: true }), "min-w-0")}
>
  {t("cheer")}
</button>
```

Clickable cards keep their existing event-isolation behavior. Never nest a button inside another button or convert an actionable link into a `div` merely to use `Surface`. Native recipes preserve the correct element.

## Coverage, exceptions and evidence

`docs/design-system-routes.json` inventories every current page and global user shell/control, including routes outside `(public)`. Each row separates **source migration** from **runtime verification**. A migrated file is not automatically runtime-verified; unknown authenticated coverage stays pending.

- `ordinary`: the whole user presentation is in scope.
- `mixed`: ordinary controls are in scope, while a specifically named export canvas or game/fortune artwork is preserved.
- `excluded`: admin-only and SEO crawler pages. Their isolation must still be checked.

Only a real design reason can justify an intentional exception. Unfinished migration, unavailable credentials, failed tests and unverified states are not design exceptions. Record the exact element/file, semantic reason and relevant check in `scripts/ui-policy.json` and the coverage report. A hidden upload input is a control exception; an entire upload page is not.

## Local gallery and review

The development-only `/dev/design-system` route is independent of locale auth/onboarding layouts and business providers. It uses fixed fixtures, its own theme/locale controls and no DB/server-action calls. Only the exact gallery route bypasses locale middleware. A production build returns 404.

Review PowerPlay/Lounge/Youth × Korean/English × light/dark × mobile 390×844/desktop 1280×900. Include long names, empty lists, error/help text, loading/disabled controls, all sizes, selected chips and modal/sheet presentations. Gallery screenshots do not establish live-route behavior or authenticated coverage.

Existing Vitest DOM dependencies require Node **22.12 or newer**. The bundled local runtime is available at `~/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`; use an approved existing runtime rather than installing dependencies. The UI test/visual wrappers can select that runtime.

## Maintenance workflow

1. Use an existing primitive/recipe and domain theme before introducing a variant.
2. For a new variant, update its implementation, fixture gallery, meaningful behavior test and this guide in the same PR.
3. Classify newly added ordinary public UI in the policy inventory. Document narrow semantic exceptions with a reason.
4. Run `npm run ui:check`, `npm run ui:test`, `npm run ui:visual`, typecheck and build. Run relevant domain regression tests and inspect actual runtime routes through the PowerPlay UI final check.
5. Review translated copy, mobile wrapping, focus, native submission, console errors and admin/export isolation. Add before/after screenshots and route/state evidence to the PR.

`ui:check` uses TypeScript AST analysis for scoped standard-control policy plus ESLint on the listed migration files. It permits ordinary layout Tailwind utilities; it rejects bypasses and appearance overrides on shared controls. Static analysis is not proof of arbitrary dynamic classes, rendering or accessibility. Resolve unknown expressions through shared recipes or a narrow documented exception; do not silently treat them as verified.

`ui:test` verifies native control contracts, field association, selected states and behavior-preserving wrappers. `ui:visual` captures deterministic fixture presentations and checks viewport overflow. Keep separate real-route evidence for filters, ranking disclosure, onboarding, profile/parent states, application/payment UI and chat/tracking wrappers using safe mocked data.

## Baseline and completion

`docs/design-system-baseline.json` records source commit `7b0e5c9`: 189 tests, 182 passed, seven failed; source ESLint findings include 96 errors and 57 warnings. The ignored generated `public/sw.js` has separate findings and is excluded from the source-debt identity comparison because build output is not repository source. `src/app/sw.ts` remains in scope for normal lint.

Compare failed tests by relative file and full test name, and lint findings by relative file, rule, message and offending source text. Counts alone are insufficient; line/column positions may move. Resolve existing failures in touched code, reject new failures, and list unrelated unchanged debt honestly. Do not disable tests, weaken rule coverage or label failure states as visual exceptions.

Work on `codex/design-system` with stage commits and one evolving Draft PR. Do not push to `main`, merge automatically or release before user review. Completion requires source coverage, relevant tests, fixture/runtime evidence and explicit remaining authenticated verification gaps.
