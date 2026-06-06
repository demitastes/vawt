# ARCHITECTURE

This repo currently ships a single static bracket experience in `index.html`. The page is intentionally self-contained: HTML, CSS, and bracket behavior all live together so the site can be opened directly from disk while the project is still in the static phase.

## Core Shape

- `index.html` is the app shell and runtime.
- Tournament structure and voting windows are embedded in the page for now.
- The page renders a single-elimination bracket with a fixed 5-round flow.
- Desktop uses absolute-positioned bouts plus SVG connectors.
- Mobile switches to a stacked grid layout and disables connector rendering.

## Distillery Profiles

- Files in `distilleries/` are generated profile pages, not hand-authored pages.
- `scripts/generate-distillery-stubs.js` is the source generator for those profiles.
- The generator reads `data/distillery-data.json` for distillery metadata.
- It reads `data/tournament-data.json` for the distillery-to-bout participation list and supporting bout annotations.
- It reads `data/bout-data.json` for bout metadata such as dates, links, and organizer-defined winners.
- The generated profile pages include a bout table plus summary and source sections, and the profile index links to each generated page.

## Profile Bout Tables

- The profile page bout table starts with the distillery’s direct tournament entries from `tournament-data.json`.
- Each row shows the bout key, voting window, and any voting links for that bout.
- The generator then adds later-round rows when the distillery advances by winning a bout.
- Advanced rows are computed from organizer-defined winners in `bout-data.json`, so a profile can show both the original appearance and later brackets it has reached.
- The table should not use an "advances to" column; the current design keeps each bout as its own row.
- Active bouts receive the same active indicator treatment used in the bracket view.
- The row structure is intentionally explicit: indicator cell, bout key cell, dates cell, vote-label cell, and link cell all stay separate so one element’s height cannot distort another.
- When a row has no active indicator or no voting links, it still keeps matching placeholder cells so desktop and mobile rendering stay aligned.
- Placeholder cells should preserve width and vertical centering rather than collapsing to empty space; that keeps the row rhythm consistent when the UI switches between active and inactive states.
- Mobile layout should preserve the same cell ordering and centered alignment, even when the row becomes a wrapped or stacked flow, so the table still reads as one coherent record instead of a bundle of unrelated fragments.
- If a distillery name changes in `distillery-data.json`, the generator expects the canonical name used in `tournament-data.json` to match.

## Bracket State

- Current selections live in a `winners` map keyed as `r{round}b{bout}`.
- Selecting a bout winner clears downstream results so later rounds stay consistent.
- User selections are saved to `localStorage` under `vawt-2026-bracket-selections`.
- Saved selections are restored on load, but organizer-defined results are always re-applied first.

## Organizer Results

- Organizer-provided bout winners are stored in the bout data as `organizerWinner`, with `winner` and `result` accepted as fallback field names.
- These results are treated as fixed selections.
- Fixed selections are locked from user editing, rendered with distinct styling, and preserved by the reset button.
- The UI displays fixed selections with a trophy prefix so they are visually distinct from user picks.

## Rendering Pipeline

1. Load organizer winners from the bout data.
2. Apply organizer winners to the `winners` map.
3. Load any saved user selections from `localStorage`.
4. Render the bracket DOM.
5. On desktop, measure positions and draw connector paths.
6. On mobile, skip connector drawing and reset desktop-specific inline layout styles.

## Interaction Rules

- Clicking a competitor button selects that winner for the bout.
- Profile links must stop propagation so they never select winners.
- The reset button clears only user-entered selections and keeps organizer-defined winners intact.
- The champion display reads from the final bout winner if present, otherwise it shows a placeholder.

## Styling Contracts

- Active bouts use green accents.
- User-selected winners use the stronger winner background.
- Organizer-selected winners use a lighter background and a trophy prefix.
- Mobile styles must preserve the no-overlap layout and hide connectors.

## Testing Contracts

- `test_local_storage.mjs` verifies save, reload, reset, and organizer-winner preservation.
- `test_responsive_visual.js` verifies the desktop/mobile layout split, interactivity, and profile-link isolation.
- `test_distillery_profiles.js` verifies the generated profile pages, including the bout table rows and generated navigation links.
- Any change to bracket layout, selection flow, or winner styling should be validated with the existing test files rather than ad hoc checks.

## Future Direction

- The long-term path is still data-first: move bracket content out of inline page data and into normalized files the website, admin tools, and Discord bot can all share.
- Keep the current selection model compatible with future server-backed storage by preserving the `r{round}b{bout}` key format and the downstream-clearing behavior.
