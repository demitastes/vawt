# ARCHITECTURE

This repo currently ships a single static bracket experience in `index.html`. The page is intentionally self-contained: HTML, CSS, and bracket behavior all live together so the site can be opened directly from disk while the project is still in the static phase.

## Core Shape

- `index.html` is the app shell and runtime.
- Tournament structure and voting windows are embedded in the page for now.
- The page renders a single-elimination bracket with a fixed 5-round flow.
- Desktop uses absolute-positioned bouts plus SVG connectors.
- Mobile switches to a stacked grid layout and disables connector rendering.

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
- Any change to bracket layout, selection flow, or winner styling should be validated with the existing test files rather than ad hoc checks.

## Future Direction

- The long-term path is still data-first: move bracket content out of inline page data and into normalized files the website, admin tools, and Discord bot can all share.
- Keep the current selection model compatible with future server-backed storage by preserving the `r{round}b{bout}` key format and the downstream-clearing behavior.
