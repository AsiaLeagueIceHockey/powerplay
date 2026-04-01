# Club Card Ratio

## Goal
Add an option to toggle the club digital card aspect ratio between 9:16 (Story) and 4:5 (Post) with corresponding layout adjustments. Currently, it downloads as ~9:16 (5:8), but users need 4:5 for Instagram Posts where the logo and team name can fit horizontally.

## TODO

### Phase 1: [Foundation & State]
- [x] Define `ratio` state (`'story' | 'post'`) in `page.client.tsx`.

### Phase 2: [UI/Components]
- [x] Add a toggle UI in the header to switch between 'Story' (9:16) and 'Post' (4:5).
- [x] Add i18n keys for the ratio toggle labels in `ko.json` and `en.json`.

### Phase 3: [Layout Adjustment]
- [x] Adjust the card wrapper's `aspect-ratio` and `max-w` based on the selected ratio.
  - Story: `aspect-[5/8]` max-width 340px (as is).
  - Post: `aspect-[4/5]` max-width 380px or 400px.
- [x] Adjust the Main Visual Section (Logo + Team Name) layout:
  - 'story': Keep current vertical layout.
  - 'post': Use horizontal layout (Logo next to Name) to fit the wider aspect ratio.

### Phase 4: [Verification]
- [x] Ensure image download/sharing saves the card in the correct aspect ratio perfectly.
- [x] Build and test (`npm run build`).
