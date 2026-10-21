# Club-first home review

Scope: reorder home sections to Clubs / Rinks / Matches and open Clubs on a normal home visit. Keep existing match/date links available via `?tab=match` and date queries; keep the existing directory URLs.

UI: reuse the navy FindClubBanner in the former ranking-banner position. Use exactly the same compact banner as the Rinks and Matches tabs, per the user review. Place the existing team-cheering message and voting rules in a compact, expandable monthly-ranking note between filters and club cards, retaining the Instagram destination and existing voting behavior.

Implementation: change the shared section navigation, home entry routing, client fallback order, and banner placement. Update the match empty-state link to keep its match-discovery intent. Use existing translations and add only the ranking help text needed in both catalogs. No schema, dependencies, or voting changes.

Verification: check home routing and tab destinations, legacy date queries, finder entry and questions, club search/no results/reset, ranking details open/close, region/rink filters, both locales, mobile/desktop/dark layouts, browser/server errors, lint, typecheck, unit tests, production build, and diff whitespace. Save screenshots and visual verdict.

Delivery: leave the local server and browser open for user review. Launch only after the user's review.
