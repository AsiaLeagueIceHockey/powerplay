# Use shared native UI primitives and recipes

## Amendment 2026-10-21: restyle toward a calm, single-accent product UI

- Status: accepted by user, 2026-10-21
- Supersedes: "preserve the current product identity" below. The layer architecture, behavior-preservation rules and admin/export isolation still stand.

The shared layer is now in place, so the next goal is the look itself: a calm, spacious UI in the spirit of Linear, Vercel and Stripe dashboards, with neutral grays, one brand accent, restrained radius and minimal shadow, in both OS light and dark.

- **Brand accent:** keep `#2563eb`. It is the only accent for primary actions, links, focus and selection in every section, including Lounge and Youth.
- **Section themes:** keep Lounge gold and Youth violet as section identities, but limit them to badges, icons and accent lines. They no longer recolor buttons, chips or focus rings. This needs a section accent token separate from `--pp-accent`.
- **Domain colors:** status, points, cheer, Lounge category and provider colors keep their meaning, scaled down to small marks.
- **Scope:** ordinary user UI only. Administrator screens stay excluded for this restyle, as do the SEO bot renderer and exported canvases.
- **Process:** change token values first and review them on one pilot route with before/after screenshots. Then fill the missing tokens and components (typography and spacing scales, modal behavior, PageHeader, EmptyState, PageContainer, section spacing). Apply to pages last. Concrete values and their status live in `docs/design-system.md`. The stage plan lives in `docs/design-system-restyle-plan.md`.
- **Rules location:** `docs/design-system.md` is the single rule source. `CLAUDE.md`, `AGENTS.md` and agent skills only reference it.

## Original decision

- Status: accepted by user, 2026-10-17 (visual-preservation goal superseded 2026-10-21)
- Baseline: `7b0e5c9`
- Scope: ordinary PowerPlay, Lounge and Youth user UI; one `codex/design-system` branch and Draft PR

Repeated controls currently choose colors, radius, spacing and states independently. We need consistency without changing the product identity or coupling votes, money, authorization and tracking to a UI framework.

Use scoped semantic CSS tokens, native React primitives and pure appearance recipes, followed by behavior-owning domain wrappers. Native primitives provide predictable form/ref/ARIA/event contracts for new UI. Recipes allow existing links, cards and domain controls to retain their DOM and event boundaries. Preserve the existing PowerPlay blue/navy, Lounge gold/category accents, Youth violet and provider/status/points semantics.

Rejected a recipes-only system because it repeats native accessibility and control contracts at each call site. Rejected an external UI suite because no new dependencies are authorized and its behavior/theme conventions would enlarge the visual and integration change. Rejected global native-element overrides because admin-only pages and image-export canvases share parts of the app tree and must retain their appearance.

Migration is explicit and reversible by stage commit. It includes ordinary controls around games, fortune graphics and export canvases, while preserving the artwork itself. Admin and SEO renderers are excluded. Route-group membership alone does not establish a theme boundary; outside-public routes and global notification/install UI require explicit scopes.

The development gallery uses fixed fixtures and no business providers. Source migration and runtime evidence are tracked separately, with exact baseline failure identities. Future variants must add an example, behavior verification and documentation together. Full dialog lifecycle and focus-engine replacement remain separate work.
