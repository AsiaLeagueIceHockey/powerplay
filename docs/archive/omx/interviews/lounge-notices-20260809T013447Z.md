# Deep Interview Transcript — Lounge Notices

## Metadata

- Profile: Standard
- Context: Brownfield
- Rounds: 4
- Final ambiguity: 11.75%
- Threshold: 20%
- Context snapshot: `.omx/context/lounge-notices-20260809T011255Z.md`

## Initial request

Add notices for premium Lounge businesses. Lounge owners should publish from Admin > Lounge; public users should see notices, open each notice on its own page, share a direct link, and opt into per-Lounge push notifications. Reuse existing PowerPlay UI patterns where suitable.

## Condensed transcript

### Round 1 — Public and subscription policy

**Question:** Should notices be public with explicit per-Lounge opt-in, automatically subscribed, or subscriber-gated?

**Answer:** Notices are public and shareable. Signed-in users explicitly opt in per Lounge. Use a short notification control and let Codex choose placement.

### Round 2 — Assumption pressure test

**Question:** Does the broad `알림받기` promise notices only, notices plus events, or all Lounge updates?

**Answer:** Notices only. Name it `공지 알림받기` and place it in the notices UI.

**Pressure finding:** A broad label would over-promise categories outside the feature. The narrower label and section placement make the contract accurate.

### Round 3 — First-release lifecycle and non-goals

**Question:** How rich should the authoring system be?

**Answer:** Create, edit, delete, and immediate publish. Exclude drafts, scheduling, pinning, images, and attachments.

### Round 4 — Decision boundaries

**Question:** May Codex decide UI placement, URL, sharing behavior, copy, schema, and RLS within the agreed behavior, returning only for material scope or visibility changes?

**Answer:** Yes.

## Final decisions

- Public text notices with dedicated detail URLs and direct sharing.
- Explicit account-level subscription per Lounge business.
- Push only for newly created notices; no push for events, business edits, notice edits, or deletes.
- Subscription control belongs in the public notices section and is labeled `공지 알림받기`.
- First release supports create/edit/delete/immediate publish only.
- Codex owns implementation details inside these boundaries.
