# TODO.md - VAWT Implementation Tasks

Sequential task list with completion tracking and parallel development guidance.

## Status Key
- `- [ ]` Not done
- `- [x]` Done

## Hierarchy

- **Phase X**: A project milestone or capability gate. Completing a phase should unlock a meaningful slice of the product or unblock downstream project areas.
- **Phase X.Y**: A workstream inside that milestone. Workstreams in the same phase may often proceed in parallel once their own inputs are available.
- **Task X.Y.Z**: A concrete implementation step inside a workstream. New tasks should be inserted in implementation order within the relevant Phase X.Y section.

Avoid global "ready", "blocked", or "unblocked" labels in task lines. Agents should inspect the repo, docs, and current implementation to determine what can be worked on.

---

## PHASE 1: Foundation (Data + Frontend)

### Phase 1.0: Planning & Infrastructure Direction
*Planning direction for frontend, Vercel, and backend deployment.*

- [x] Task 1.0.1: Update TODO planning/status for accepted React + TypeScript + Vite + Vercel direction
- [x] Task 1.0.2: Classify Vercel link/install as infrastructure setup, not frontend feature work
- [x] Task 1.0.3: Commit planning docs update before starting frontend implementation
- [x] Task 1.0.4: Rewrite backend architecture plan away from Rust/axum toward a Vercel-maintainable backend

### Phase 1.1: Data Transformation & Tournament Data
*Blocker for all other work. Data pipelines working, distillery metadata in progress.*

- [x] Task 1.1.1: Design JSON schemas for bracket, distilleries, votes
- [x] Task 1.1.2: Create `/data/distilleries.json` with all distillery profiles (veteran-owned flags, bios, images)
- [x] Task 1.1.3: Write `scripts/gen-bracket` Rust binary to parse BRACKET.md to JSON
- [x] Task 1.1.4: Generate `/data/bracket-2026.json` with rounds, bouts, voting dates, participant IDs
- [x] Task 1.1.5: Write `scripts/test-bracket.py` to validate bracket structure (31 bouts, feeder logic, dates)
- [ ] Task 1.1.6: Create CSV export for non-coder editing (`/data/bracket-2026.csv` from generated JSON)
- [ ] Task 1.1.7: Add CSV import back to JSON for round-trip editing (CSV to JSON idempotent pipeline)

### Phase 1.2: React Frontend
*React + TypeScript + Vite frontend implementation.*

- [x] Task 1.2.1: Scaffold React + TypeScript + Vite frontend and migrate current static bracket entry point
- [x] Task 1.2.2: Render bracket structure (rounds to bouts) with distillery names and images
- [x] Task 1.2.3: Add distillery profile modals (name, veteran-owned, founding date, awards, website link)
- [x] Task 1.2.4: Add bout detail view (click bout to show participants, voting dates, vote counts)
- [x] Task 1.2.5: Add search/filter by distillery name, round, or status
- [x] Task 1.2.6: Add year/tournament selector (load different `/data/bracket-*.json` files)
- [x] Task 1.2.7: Add "View Results" link in bout details (show active voting if round is live)

---

## PHASE 2: Backend API + Voting System

### Phase 2.1: API Infrastructure
*Website backend is Node/Express + SQLite for Vercel compatibility. Rust/axum (`/api`) is parked; use as reference only. Discord bot stays in Rust.*

- [x] Task 2.1.1: Set up Rust/axum API server (`api/` Cargo project) — PARKED, use as reference for contract
- [x] Task 2.1.2: Implement read-only tournament endpoints — PARKED, migrating to Node
- [x] Task 2.1.3: Implement user auth endpoints — PARKED, migrating to Node
- [x] Task 2.1.4: Finalize Vercel-maintainable architecture (Node/Express + SQLite, schema, env vars) — DONE by ARCHITECTURE.md
- [ ] Task 2.1.5: Create Node/Express + SQLite backend (`/server` directory) with package.json, config, db setup
- [ ] Task 2.1.6: Implement database client, migrations system, and initial schema (001_initial_schema.sql)
- [ ] Task 2.1.7: Implement middleware (auth, validation, errorHandler, CORS, helmet, rate limiting)
- [ ] Task 2.1.8: Implement health and tournament read-only endpoints (GET /api/tournaments/*, /api/distilleries/*)
- [ ] Task 2.1.9: Implement auth endpoints (magic link, Discord OAuth, JWT, session management)
- [ ] Task 2.1.10: Implement bracket CRUD endpoints (POST/GET/PUT/DELETE /api/brackets/:bracketId)
- [ ] Task 2.1.11: Add bracket validation (enforce voting windows, validate bout/pick IDs)
- [ ] Task 2.1.12: Add bracket scoring logic (calculate score, GET /api/brackets/:bracketId/score)

### Phase 2.2: Voting System
*Authenticated voting and public result reads, implemented in Node/Express.*

- [x] Task 2.2.1: Design authenticated vote data schema (boutId, participantId, source, voter_id, timestamp, source_id)
- [ ] Task 2.2.2: Implement vote endpoints in Node (POST /api/tournaments/:year/bouts/:boutId/vote; GET /api/tournaments/:year/votes, /active, /results)
- [ ] Task 2.2.3: Add vote storage to SQLite schema (votes table with dedup logic, indexes)
- [ ] Task 2.2.4: Implement voteService in Node (cast vote, dedup, aggregation by source)
- [ ] Task 2.2.5: Add vote import service (admin endpoint to bulk import votes from CSV with validation)

### Phase 2.3: Discord Bot
*Rust/poise bot consumes the shared API.*

- [x] Task 2.3.1: Set up Rust/poise Discord bot (`discord-bot/` Cargo project) with configuration
- [x] Task 2.3.2: Implement `/round` command (show current round + voting dates)
- [x] Task 2.3.3: Implement `/bout <boutId>` command (show participants + vote counts)
- [x] Task 2.3.4: Implement `/vote <boutId> <participant>` command
- [x] Task 2.3.5: Implement `/standings` and `/stats` commands
- [ ] Task 2.3.6: Add real-time vote updates (polling or webhook to display live vote counts)

---

## PHASE 3: Website User Interface + Voting

### Phase 3.1: Website Login/Voting Landing Page
*Public read-only information with authenticated voting controls.*

- [x] Task 3.1.1: Add login/register UI to website (forms, JWT token storage in localStorage)
- [x] Task 3.1.2: Build voting landing page (public active bout view, authenticated voting buttons)
- [x] Task 3.1.3: Display public vote count + source breakdown on landing page (website, discord, twitter, etc.)
- [x] Task 3.1.4: Add "Create Bracket" button (authenticated users only, links to Task 3.2.5)

### Phase 3.2: Interactive Bracket Picker
*Authenticated user bracket creation, editing, scoring, and ranking.*

- [x] Task 3.2.1: Build interactive bracket picker UI (show all rounds, click to pick winners)
- [x] Task 3.2.2: Add visual feedback (highlight picked/unpicked bouts, show voting window status)
- [ ] Task 3.2.3: Save picks to API (PUT /brackets/:bracketId on each pick change)
- [ ] Task 3.2.4: Show user's current bracket score on page
- [ ] Task 3.2.5: Add "Your Brackets" page (list user's brackets, allow delete/view)
- [ ] Task 3.2.6: Add leaderboard view (show all users' scores, sortable, highlight current user)

---

## PHASE 4: Social Sharing & Image Generation
*Lower priority. Defer until Phase 3 complete.*

### Phase 4.1: Share Images

- [ ] Task 4.1.1: Implement image generation for bouts (GET /api/share/bout/:boutId/image)
- [ ] Task 4.1.2: Support image formats (vertical/Instagram, square/post, horizontal/web)
- [ ] Task 4.1.3: Implement bracket image generation (GET /api/share/bracket/:bracketId/image)
- [ ] Task 4.1.4: Add share buttons to website (Twitter, Instagram, Facebook composers)

---

## PHASE 5: Admin & Advanced Features

### Phase 5.1: Admin Voting Operations

- [ ] Task 5.1.1: Build vote import pipeline (bulk CSV import from external sources)
- [ ] Task 5.1.2: Add vote reconciliation tools (admin endpoint to adjust/remove votes)
- [ ] Task 5.1.3: Build admin dashboard (web UI for managing bracket data, votes, results)
- [ ] Task 5.1.4: Implement real-time updates via WebSocket or SSE
- [ ] Task 5.1.5: Add bout result submission (admin endpoint to set winners, notify users)

### Phase 5.2: Admin Scheduling & Imports

- [ ] Task 5.2.1: Build admin scheduling UI for rounds, bouts, voting windows, and publish status
- [ ] Task 5.2.2: Implement admin scheduling API for creating/updating voting windows and round status
- [ ] Task 5.2.3: Add admin import workflow for bracket/vote CSV uploads with validation preview
- [ ] Task 5.2.4: Add manual override tools for winners, vote totals, bout status, and schedule corrections

---

## Success Criteria by Phase

**Phase 1 Complete**: Non-coders can edit `/data/bracket-2026.json`, and the React + TypeScript + Vite frontend displays tournament bracket data on Vercel.

**Phase 2 Complete**: Website and Discord bot query live data via a Vercel-maintainable API. Read-only pages are public. Voting requires auth. Vote results show source breakdown.

**Phase 3 Complete**: Users create accounts, make bracket picks, track scores. Leaderboard displays all users' rankings.

**Phase 4 Complete**: Users generate and share bracket images on social media.

**Phase 5 Complete**: Organizers manage schedules, import data, reconcile votes, manually override results/status when needed, and post results. Real-time updates visible to users.

---

## Progress Notes

Append low-conflict progress notes here when a change should be recorded but editing the main task list would create avoidable merge conflicts. Periodically reconcile these notes into the relevant phase sections.

- 2026-05-15: TODO numbering changed from global task numbers to phase-local `Task X.Y.Z` identifiers. Volatile ready/blocked status markers were removed.
- 2026-05-15: Architectural decision made to park Rust/Axum backend and implement Node/Express + SQLite backend for Vercel compatibility. Phase 2.1 tasks renumbered to reflect Node implementation path. Rust `/api` directory now marked as reference/deprecated; new `/server` directory is the implementation target.
- 2026-05-15: Phase 3.1 frontend scaffolding completed with local mock auth, public active-bout voting UI, seeded vote/source breakdowns, and authenticated Create Bracket CTA. Phase 3.2.1-3.2.2 completed with localStorage-backed draft picks and bracket state styling; API persistence/scoring/list/leaderboard tasks remain open.

---

Last Updated: May 15, 2026
