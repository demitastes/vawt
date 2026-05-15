# DECISIONS.md

Record of key architectural and organizational decisions for the VAWT project.

## Decision 1: Shared REST API Layer

**Date**: May 15, 2026  
**Status**: Accepted  
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

**Impact**: Phase 2 (Backend API) is a critical blocker for both Phase 1.2 (static website) and Phase 2.3 (Discord bot) if they want live data. However, Phase 1.2 can proceed with hardcoded/local JSON until Phase 2 API is ready.

---

## Decision 2: Data Ownership & Source of Truth

**Date**: May 15, 2026  
**Status**: Accepted  
**Rationale**: Keep tournament structure data separate from user predictions.

**Structure**:
- **`/data`**: Tournament structure (BRACKET.md, CSV exports, compiled JSON). Source of truth.
- **User bracket data**: Stored separately (JSON file or SQLite). Ephemeral, user-generated.

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
- **Phase 1.2 (Static Site)**: Parallelizes with Phase 2. Can use hardcoded data initially, then swap to API. 1-2 people
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

## Decision 5: Technology Stack

**Date**: May 15, 2026  
**Status**: Recommended (not binding)  
**Rationale**: Choose technologies that are familiar to team, require minimal setup, and scale with project complexity.

**Frontend**:
- Vanilla JavaScript or lightweight framework (Vue/Svelte) if complexity grows
- Hosted on: GitHub Pages (Phase 1) → Node server (Phase 2+)

**Backend**:
- Node.js + Express: lightweight, JavaScript, good for small-to-medium projects
- Authentication: JWT tokens (stateless, easy to scale, supports multiple clients)
- Data storage: JSON files initially (easy to edit, version control friendly) → SQLite when needed

**Discord Bot**:
- discord.js library: mature, well-documented, community support
- Deploy as separate process (can be on same or different server as website backend)

**Image Generation** (Phase 4):
- Puppeteer (headless Chromium): flexible, can render HTML to image
- Alternative: Sharp + Canvas library (lighter weight if Puppeteer is too heavy)

**Testing**:
- Unit tests: Jest or similar (once infrastructure is in place)
- Backend API: Jest + supertest
- Discord commands: Jest + mocked discord.js
- Frontend: Visual regression testing (no heavy framework yet)

**Rationale**:
- All JavaScript: team knowledge concentration, code reuse potential
- Minimal dependencies initially; add tooling as needed
- No premature optimization (file-based data is fine for <10k users)

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

## Decision 7: No Database Initially

**Date**: May 15, 2026  
**Status**: Accepted  
**Rationale**: Start with JSON files for user bracket data; migrate to database only when necessary.

**Why JSON files?**
- Zero setup required
- Easy to inspect (debugging, manual corrections)
- Easy to backup and restore
- Version-control friendly (smaller diffs)
- Sufficient for 100-1000 users

**Criteria for migration to database**:
- >5,000 concurrent users
- Need for sub-second query latency
- Complex analytics/reporting
- Multiple read replicas needed

**Until then**: Keep a simple `data/brackets.json` or `data/users.json` file, cache in memory, write-on-change.

---

## Decision 8: File Structure & Organization

**Date**: May 15, 2026  
**Status**: Accepted  
**Rationale**: Clear separation of concerns makes onboarding and collaboration easier.

**Root level**:
- `bracket.html` — Static site entry point (Phase 1.2)
- `AGENTS.md` — Agent instructions (development guidance)
- `CLAUDE.md` — Symlink to AGENTS.md (backwards compatibility)
- `TODO.md` — Task breakdown and phases
- `DECISIONS.md` — This file (rationale for key choices)

**`/data`**:
- `BRACKET.md` — Source of truth (markdown, edited by non-coders via CSV)
- `bracket-2026.csv` — Spreadsheet-friendly export (generated from BRACKET.md)
- `bracket-2026.json` — Normalized format (generated from CSV)
- `TOURNAMENT_NOTES.md` — Metadata and annotations
- `schema.json` — JSON schema documentation

**`/scripts`**:
- `markdown-to-csv.js` — BRACKET.md → CSV
- `csv-to-json.js` — CSV → JSON
- `build-data.sh` — Orchestrates the pipeline

**`/server`** (Phase 2+):
- `index.js` — Express app entry point
- `/api/` — Route handlers (tournaments, users, brackets)
- `/middleware/` — Auth, CORS, error handling
- `/models/` — Data access layer

**`/discord-bot`** (Phase 2.3):
- `index.js` — Bot entry point
- `/commands/` — Command handlers

**`/tests`** (Once infrastructure exists):
- Test files mirror source structure

---

## Decision 9: Admin Interface Approach

**Date**: May 15, 2026  
**Status**: Deferred to Phase 5  
**Rationale**: Admin panel is nice-to-have, not core to MVP.

**For Phase 1-3**: Admins manually edit BRACKET.md (or CSV export) and commit. Non-scalable but simple.

**Phase 5 plan**: Build web UI for admins to:
- Upload bracket data
- Post bout results
- Manage voting dates
- View all user brackets and scores

**Rationale for deferral**:
- MVP can work with manual data editing
- Gives time to stabilize API and user-facing features first
- Admin UI is lower priority than user experience

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

## Review & Adjustment Log

- **2026-05-15 (Initial)**: Initial decisions documented. All major phases and architectural choices captured.
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
