# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VAWT (Virginia Whiskey Tournament) is a web application for showcasing a single-elimination bracket tournament. The project is designed to be extensible for multiple years and tournament formats, with data stored in non-code files (markdown/JSON) so non-coders can easily update tournament information.

The full vision is in ROADMAP.md. Current phase: static website for bracket exploration.

## Architecture

The project is split into distinct subsystems that can be developed in parallel:

- **Static Website** (`bracket.html` + data): Initial phase. HTML file displaying bracket data from markdown files in `/data`.
- **Backend** (future): Node.js/API layer to handle user accounts, bracket creation, real-time updates. Will read/write tournament data.
- **Discord Bot** (future): Separate service querying the same data source about tournament progress and voting dates.
- **Data Layer** (`/data`): Single source of truth. Initially markdown (BRACKET.md, TOURNAMENT_NOTES.md), will transition to CSV and JSON formats as tool complexity grows.

## Current State

- `bracket.html`: Static HTML file with embedded CSS. Displays tournament bracket structure. Currently a skeleton; needs to be populated with data from `/data/BRACKET.md`.
- `/data/BRACKET.md`: Tournament bracket structure in markdown. Contains round definitions and bout matchups. Non-coders will edit this.
- `/data/TOURNAMENT_NOTES.md`: Metadata like new distilleries, annotations, notes about participants.

## Data Format Transition

As per ROADMAP: BRACKET.md → CSV export (for non-coders to edit in spreadsheets) → JSON (for programmatic access). The conversion should be scriptable so updates flow: Spreadsheet → CSV → JSON → Website/Bot.

## Common Development Tasks

### View the static bracket site locally
```bash
open bracket.html  # or serve via local HTTP server if needed for CORS
```

### Understanding the bracket structure
- Read `/data/BRACKET.md` for the bracket layout and bout matchups
- R#B# notation: R = Round, B = Bout (e.g., R1B1 = Round 1, Bout 1)

### Build the data transformation pipeline (future)
- Write a script to convert BRACKET.md → CSV format (for spreadsheet editing)
- Write a script to convert CSV → JSON format (for website/bot consumption)
- Store the JSON output in `/data/bracket.json` or similar

### Add features to the static site
- Modify `bracket.html` to parse and render `/data/BRACKET.md` (or future JSON)
- Consider using a templating approach or markdown parser library when complexity grows
- For now: keep it simple and vanilla JS if needed; avoid heavy frameworks until backend is required

### Future: Add a backend
- Will serve the JSON data and handle real-time updates
- Should provide REST endpoints for: getting bracket state, submitting bracket picks (user accounts phase), getting tournament stats
- Consider Node.js + Express or similar lightweight server

### Future: Add the Discord bot
- Will query the JSON data file or backend API for tournament state
- Commands: `/round` (current round), `/voting-dates`, `/standings`, `/who-advanced`
- Can be a separate Node.js package/repository initially

## Key Constraints & Decisions

1. **Data first**: The bracket data should remain easy to edit by non-coders. JSON/CSV formats are safer than database-only storage.
2. **Extensible structure**: Design the bracket format so it can handle different tournament formats (single-elimination, double-elimination, etc.) in the future without major refactors.
3. **Parallel development**: Website, backend, and Discord bot can be developed independently as long as they all read from the same `/data` source (or a shared data API).
4. **Phases**: Static site → Accounts & user bracket creation → Social sharing & image generation → Discord bot. Don't over-engineer early phases.

## TODO.md Update Policy

`TODO.md` is shared by multiple agents and should be edited with minimal churn.

- Only update task lines that directly reflect work you completed, started, or newly discovered.
- Do not rewrite dependency summaries, priority lists, or status analysis just to reflect your current local interpretation.
- Do not add redundant progress notes if the task checkbox or a short appended note already captures the change.
- Do not renumber unrelated tasks or reflow sections unless the user explicitly asks for a TODO structure cleanup.
- When a change needs documentation but would touch lines other agents may also edit, append a short dated note to the end of `TODO.md` instead.
- Periodically, a maintainer or coordinating agent will reconcile appended notes back into the main task list.
- Avoid global "ready", "blocked", or "unblocked" status markers in task lines. Each agent should inspect the current code and docs to decide what is actually unblocked.
- New tasks should use the local task namespace for their phase, such as `Task 1.2.3`, and should be inserted in implementation order inside the relevant phase.

## File Structure (Planned Growth)

```
vawt-website/
├── bracket.html              # Static site entry point
├── data/
│   ├── BRACKET.md           # Raw bracket data (edited by non-coders)
│   ├── TOURNAMENT_NOTES.md   # Tournament metadata
│   └── bracket.json         # Compiled normalized format (generated from CSV)
├── scripts/                  # Data transformation scripts
│   ├── markdown-to-csv.js
│   └── csv-to-json.js
└── server/                   # Backend (future phase)
    └── index.js             # Express app, serves bracket.json, handles API
```

## Testing

Currently minimal testing needed (static HTML). As the project grows:
- Unit tests for data transformation scripts (JS/Node)
- Integration tests for backend API endpoints
- E2E tests for the website (bracket exploration) and Discord bot commands

Run tests (once defined):
```bash
npm test
```
