# DECISIONS.md

Record of key architectural and organizational decisions for the VAWT project.

## Decision 1: Shared REST API Layer

**Date**: May 15, 2026
**Status**: Accepted; updated May 15, 2026 by Decision 5
**Rationale**: Both the website UI and Discord bot need to query tournament data and manage user brackets. A shared REST API ensures:
- Single source of truth for tournament state
- Independent development of website and bot (no direct file coupling)
- Clear contract between subsystems
- Easier to add future consumers (mobile app, etc.)

**Details**:
- Tournament data endpoints: read-only access to bracket structure, rounds, bouts, statistics
- User bracket endpoints: authenticated access to create/update/delete user predictions
- Admin endpoints: future ability to post bout results and manage tournaments
- Organized by resource type (/api/tournaments, /api/brackets, /api/users)
- Backend implementation should be the easiest option to maintain on Vercel, using Vercel-compatible serverless/API patterns and managed persistence where needed.

**Impact**: Phase 2 (Backend API) is a critical blocker for Phase 1.2 frontend and Phase 2.3 Discord bot work if they want live data. However, Phase 1.2 can proceed with hardcoded/local JSON until Phase 2 API is ready.

---

## Decision 2: Data Ownership & Source of Truth

**Date**: May 15, 2026
**Status**: Accepted
**Rationale**: Keep tournament structure data separate from user predictions.

**Structure**:
- **`/data`**: Tournament structure (BRACKET.md, CSV exports, compiled JSON). Source of truth.
- **User bracket data**: Stored separately in Vercel-friendly persistent storage. Ephemeral, user-generated.

**Why separate?**
- Non-coders can edit `/data` with CSV spreadsheets without touching user data
- Tournament changes don't affect existing user brackets
- Clear schema separation makes both easier to reason about
- Can backup/restore tournament data independently

**Implication**: API must serve two data sources:
1. Tournament data from `/data/bracket-*.json` (loaded once, cached in memory)
2. User bracket data from persistent storage (queried per-user)

---

## Decision 3: Phase-Based Implementation with Parallel Workstreams

**Date**: May 15, 2026
**Status**: Accepted
**Rationale**: The project is too large for one person and too complex to build in strict waterfall order. Phases enable parallel work.

**Structure**:
- **Phase 1.1 (Data)**: Blocks everything; must be done first. 1 person, ~2-3 days
- **Phase 1.2 (React Frontend)**: Parallelizes with Phase 2. Can use generated local JSON initially, then swap to API. 1-2 people
- **Phase 2.1 (API)**: Blocks Phases 2.2 and 2.3. Critical path. 1-2 people, ~3-5 days
- **Phase 2.2 (User Brackets)**: Depends on 2.1; can proceed while Discord bot (2.3) is being built
- **Phase 2.3 (Discord Bot)**: Parallelizes with 2.2; just consumes API; straightforward implementation

**Organization**:
- Assign data work to a dedicated person (ensures quality of JSON schema)
- Assign frontend work to 1-2 people (independent from backend until API is ready)
- Assign backend work to 1-2 people (critical path, should prioritize API over polish)

**Risk**: If Phase 2.1 API is delayed, Phase 1.2 and 2.3 are blocked. Recommend front-loading API work.

---

## Decision 4: CSV as the Non-Coder Interface

**Date**: May 15, 2026
**Status**: Accepted
**Rationale**: Tournament organizers (non-coders) need an easy way to update bracket data.

**Flow**: BRACKET.md → CSV (export) → Spreadsheet (edited by non-coder) → CSV → JSON → Website/Bot

**Why CSV?**
- Familiar to non-technical users (Excel, Google Sheets)
- Easy to version control and review diffs
- Intermediate format that can be manually edited if needed
- Scriptable: CSV → JSON conversion can be automated

**Implication**:
- Script to extract BRACKET.md → CSV (task 1.1.2)
- Script to convert CSV → JSON (task 1.1.3)
- These scripts become critical infrastructure; document them well

---

## Decision 5: Technology Stack and Deployment

**Date**: May 15, 2026
**Status**: Accepted; supersedes earlier non-binding recommendations
**Rationale**: Choose technologies that are familiar, easy to host, and maintainable for the expected project size.

**Frontend**:
- React + TypeScript + Vite
- Hosted on Vercel
- Current docs that recommend vanilla JavaScript, Vue/Svelte, GitHub Pages, or a later Node-hosted frontend are superseded by this decision.

**Backend**:
- Use the easiest backend that is maintainable on Vercel.
- Prefer Vercel-native API routes/serverless functions and managed services over operating a separate long-running server.
- Rust is not a requirement for the website backend.
- Current docs that assume Node.js + Express as the backend default are updated by this decision.

**Discord Bot**:
- Rust is reserved for the Discord bot if Rust is used in this project.
- The bot remains a separate service from the Vercel-hosted website/backend.

**Image Generation** (Phase 4):
- Puppeteer (headless Chromium): flexible, can render HTML to image
- Alternative: Sharp + Canvas library (lighter weight if Puppeteer is too heavy)

**Testing**:
- Unit tests: Vitest or similar for frontend and TypeScript backend modules
- Backend API: framework-appropriate request tests once the Vercel backend shape is chosen
- Discord commands: Rust test harnesses/mocks where practical
- Frontend: component, interaction, and visual smoke tests once the app is scaffolded

**Rationale**:
- TypeScript across the frontend and Vercel backend keeps the app approachable and deployable.
- Minimal dependencies initially; add tooling as needed
- Avoid premature optimization, but do not choose local file writes for user data on Vercel.

---

## Decision 6: JSON Schema Design

**Date**: May 15, 2026
**Status**: In Progress (task 1.1.1)
**Rationale**: Define the normalized data structure before building conversion scripts.

**Schema must support**:
- Multiple tournaments (by year)
- Multiple rounds per tournament
- Multiple bouts per round
- Participants (distilleries) with metadata (name, region, ABV, URL, etc.)
- Voting dates and deadlines
- Bout results (winner) once available
- Extensible metadata (notes, images, etc.)

**Constraints**:
- Must be easy to generate from CSV
- Must be easy to consume from JavaScript/JSON
- Must support different tournament formats (single-elimination, double-elimination, etc.) in future

**Implications**:
- Schema should be version 1.0 from the start (easier to add fields than restructure)
- Document schema with examples (JSON Schema or TypeScript types)
- Make schema accessible to API team and website team

---

## Decision 7: No Local User Data Files on Vercel

**Date**: May 15, 2026
**Status**: Supersedes earlier "No Database Initially" decision
**Rationale**: The earlier plan to store user bracket data in JSON files is not compatible with a Vercel-maintained backend once authenticated voting and per-user state are required.

**Accepted direction**:
- Public tournament data may remain read-only static/generated data.
- Authenticated user votes, vote status, bracket picks, and admin overrides require persistent storage suitable for Vercel serverless deployments.
- Choose the simplest Vercel-friendly managed persistence option when implementation begins.

**Superseded guidance**:
- Do not use local JSON files such as `data/brackets.json` or `data/users.json` as the live write store for authenticated users or votes.
- Current docs that suggest file-based user storage are updated by this decision.

---

## Decision 8: File Structure & Organization

**Date**: May 15, 2026
**Status**: Accepted
**Rationale**: Clear separation of concerns makes onboarding and collaboration easier.

**Root level**:
- `index.html` — Vite frontend entry point
- `package.json` / `vite.config.ts` / `tsconfig.json` — React + TypeScript + Vite configuration
- `AGENTS.md` — Agent instructions (development guidance)
- `CLAUDE.md` — Symlink to AGENTS.md (backwards compatibility)
- `TODO.md` — Task breakdown and phases
- `DECISIONS.md` — This file (rationale for key choices)
- `src/` — React frontend source
- `public/data/` — frontend-served bracket JSON copied from `/data`

**`/data`**:
- `BRACKET.md` — Source of truth (markdown, edited by non-coders via CSV)
- `bracket-2026.csv` — Spreadsheet-friendly export (generated from BRACKET.md)
- `bracket-2026.json` — Normalized format (generated from CSV)
- `TOURNAMENT_NOTES.md` — Metadata and annotations
- `schema.json` — JSON schema documentation

**`/scripts`**:
- `sync-public-data.mjs` — Copy local tournament JSON into `public/data` for Vite
- `markdown-to-csv.js` — BRACKET.md → CSV
- `csv-to-json.js` — CSV → JSON
- `build-data.sh` — Orchestrates the pipeline

**Vercel backend** (Phase 2+):
- API route handlers for tournaments, users, brackets, votes, and admin operations
- Shared validation, auth, and persistence modules
- Exact directory shape to be chosen during the Vercel backend architecture rewrite

**`/discord-bot`** (Phase 2.3):
- Rust bot entry point
- `/commands/` — Command handlers

**`/tests`** (Once infrastructure exists):
- Test files mirror source structure

---

## Decision 9: Admin Interface Approach

**Date**: May 15, 2026
**Status**: Updated May 15, 2026
**Rationale**: Admin workflows are needed earlier than a full admin panel because tournament scheduling, imports, and corrections affect public state and voting windows.

**Accepted MVP admin direction**:
- Provide admin scheduling for active bouts and voting windows.
- Provide import support for bracket/tournament data.
- Provide manual override capability for results, bout status, and corrections.
- A polished full admin panel can still wait, but the backend/data model must support these admin operations.

**Updated guidance**:
- Current docs that say admins only edit `BRACKET.md` or CSV files through Phase 3 are superseded where scheduling, imports, or manual overrides are required.

**Phase 5 plan**: Build web UI for admins to:
- Upload bracket data
- Post bout results
- Manage voting dates
- View all user brackets and scores

**Rationale for deferral**:
- Gives time to stabilize API and user-facing features first
- A complete admin UI is lower priority than user experience, but admin capabilities must exist in the data/backend layer.

---

## Decision 10: Discord Bot as Optional Feature

**Date**: May 15, 2026
**Status**: Phase 2.3 — Can be parallelized but not required for MVP
**Rationale**: Website is the primary interface; Discord bot is convenience.

**Discord bot is valuable for**:
- Users who live in Discord
- Tournament admins posting updates
- Real-time notifications of bout results

**Can be built later** if website is more urgent. Just requires the API (Phase 2.1) to be ready.

---

## Decision 11: Authentication and Voting

**Date**: May 15, 2026
**Status**: Accepted
**Rationale**: Votes affect tournament outcomes and personalized UI, so voting must be tied to authenticated users.

**Accepted direction**:
- No anonymous votes.
- Users must authenticate before casting votes.
- Public tournament/bracket/bout data remains read-only and publicly accessible.
- Public readers can browse tournament state without signing in.
- Authenticated endpoints handle vote creation, vote updates if allowed by rules, user vote status, and personalized bracket state.

**Implication**:
- The data model must distinguish public read-only tournament state from private/authenticated user state.
- Frontend views should gracefully show public state to signed-out users and voting/personalization controls to signed-in users.

---

## Decision 12: Homepage Active-Bout Personalization

**Date**: May 15, 2026
**Status**: Accepted
**Rationale**: The homepage should immediately help a signed-in user understand what action is available right now.

**Accepted direction**:
- Homepage should highlight the current active bout.
- For authenticated users, the active-bout presentation should use that user's vote status.
- If the user has not voted, the homepage should make the active bout actionable.
- If the user has already voted, the homepage should reflect that status instead of prompting for another vote.
- Signed-out users may see the active bout publicly, but voting status and voting actions require authentication.

**Implication**:
- The backend needs an authenticated "my vote status for active bout" capability.
- The frontend should not infer vote status from public data alone.

---

## Review & Adjustment Log

- **2026-05-15**: Initial decisions documented. All major phases and architectural choices captured.
- **2026-05-15**: Accepted React + TypeScript + Vite on Vercel, Vercel-maintainable backend direction, Rust only for Discord bot, authenticated-only voting, public read-only tournament data, earlier admin scheduling/import/manual override capability, and homepage active-bout personalization by authenticated vote status.
- **2026-05-15**: Implemented the React + TypeScript + Vite frontend at the repository root. The app currently reads local bracket JSON from `public/data`, supports bracket browsing, search/filter controls, bout detail views, distillery profile fallbacks, local winner selection, and a year selector seeded with 2026.
- **2026-05-15 (Progress)**:
  - Decision 1 (Shared REST API): ✅ Confirmed. Axum/Rust API implemented with tournament endpoints.
  - Decision 5 (Technology Stack): ✅ Validated. Rust + axum for API, JWT for auth working well.
  - Decision 7 (No Database Initially): ✅ In progress. Using JSON for vote storage; in-memory user store for now.
  - Task 15-16 Complete: Read-only tournament API fully operational.
  - Task 17 Complete: User auth with JWT tokens, bcrypt password hashing implemented.
  - Task 21 Complete: Vote schema designed with hybrid real-time + cached aggregation approach.
  - Ready for Tasks 18 (Bracket CRUD) and 22 (Vote endpoints) in parallel.

---

## Related Documents

- **AGENTS.md**: Development guidance and architecture overview
- **TODO.md**: Detailed task breakdown organized by phase
- **ROADMAP.md**: Original vision and requirements from project creator
