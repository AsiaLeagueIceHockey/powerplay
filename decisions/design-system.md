# Use shared native UI primitives and recipes

- Status: accepted by user, 2026-10-17
- Baseline: `7b0e5c9`
- Scope: ordinary PowerPlay, Lounge and Youth user UI; one `codex/design-system` branch and Draft PR

Repeated controls currently choose colors, radius, spacing and states independently. We need consistency without changing the product identity or coupling votes, money, authorization and tracking to a UI framework.

Use scoped semantic CSS tokens, native React primitives and pure appearance recipes, followed by behavior-owning domain wrappers. Native primitives provide predictable form/ref/ARIA/event contracts for new UI. Recipes allow existing links, cards and domain controls to retain their DOM and event boundaries. Preserve the existing PowerPlay blue/navy, Lounge gold/category accents, Youth violet and provider/status/points semantics.

Rejected a recipes-only system because it repeats native accessibility and control contracts at each call site. Rejected an external UI suite because no new dependencies are authorized and its behavior/theme conventions would enlarge the visual and integration change. Rejected global native-element overrides because admin-only pages and image-export canvases share parts of the app tree and must retain their appearance.

Migration is explicit and reversible by stage commit. It includes ordinary controls around games, fortune graphics and export canvases, while preserving the artwork itself. Admin and SEO renderers are excluded. Route-group membership alone does not establish a theme boundary; outside-public routes and global notification/install UI require explicit scopes.

The development gallery uses fixed fixtures and no business providers. Source migration and runtime evidence are tracked separately, with exact baseline failure identities. Future variants must add an example, behavior verification and documentation together. Full dialog lifecycle and focus-engine replacement remain separate work.
