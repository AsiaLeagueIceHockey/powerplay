# PowerPlay design system

This is the canonical UI authoring and maintenance guide. Preserve the current product identity and domain behavior while using one shared vocabulary for ordinary user controls. The approved implementation and verification contracts live in `docs/archive/omx/plans/prd-design-system.md` and `docs/archive/omx/plans/test-spec-design-system.md`.

## Architecture and boundaries

Use three layers:

1. **Semantic tokens and scoped CSS** in `src/app/globals.css` define surfaces, text, borders, focus, accents, status, radius, spacing and typography. New rules apply through explicit public theme scopes and `pp-*` classes, never a blanket `button`, `input` or `div` selector.
2. **Native primitives and pure recipes** in `src/components/ui/` define repeated appearance and native accessibility contracts. Import components from `@/components/ui` and recipes from `@/components/ui/styles`.
3. **Domain wrappers** own votes, applications, sharing, payments, notification subscriptions, filter drafts, tracking and chat. They use primitives or recipes without moving their business behavior into the design system.

A recipe is useful when a domain wrapper must retain its existing DOM element or event boundary. A primitive is preferred for a new ordinary control. Do not add a polymorphic `asChild` abstraction, external UI suite or dependencies to solve a local styling problem.

The migration does not change server actions, authorization, data schemas, money calculations, refunds, chat read receipts or tracking. A visual test must not submit a real vote/application/payment or read a live chat room.

## Preserve these design decisions

| Role | Standard | Intentional preservation |
| --- | --- | --- |
| PowerPlay accent | Existing blue/navy | Do not recolor domain status, points or cheering as generic brand blue |
| Lounge accent | Existing ice gold (`#d4a017`, pale gold `#f3d27a`) | Preserve category-specific lesson blue, youth-club green, training teal, tournament rose, brand violet and service orange |
| Youth accent | Existing violet | Keep verified-parent and post state semantics |
| Surface/field radius | 12px | Existing circles, pills, avatars, hero/banner artwork have explicit purposes |
| Modal/sheet radius | 24px | Presentation changes do not replace dialog lifecycle |
| Spacing vocabulary | 4, 8, 12, 16, 20, 24, 32px | Keep useful density differences between a card, form and detail page |
| Control sizes | compact 36px, default 44px, large CTA 56px | Approved club actions remain 46px with 18px icons and one-line labels |
| Typography | Existing Pretendard and heading/body hierarchy | Do not uniformly enlarge or flatten all metadata |
| Interactive cards | Shared hover border, shadow and keyboard focus | Noninteractive panels do not imply clickability |
| Home discovery | Clubs → Rinks → Matches | Keep equally compact club-finder banners and monthly ranking disclosure |
| Theme preference | Existing OS light/dark preference | No new user theme setting or forced dark mode |
| Provider identity | Kakao yellow, Naver green, provider marks | Use provider variants; never redefine them as site accent |

Theme scopes must cover user routes outside `(public)`, including onboarding, chat rooms, fortune controls and the Lounge membership brochure. Global notification and install UI needs its own explicit scope because it is rendered in the locale layout. Administrator screens and export canvases must not inherit the new public appearance accidentally.

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
