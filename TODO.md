# TODO.md - VAWT Implementation Tasks

Sequential task list with completion tracking and parallel development guidance.

## Status Key
- ✅ Complete
- 🔄 In progress
- 🚫 Blocked (waiting on other tasks)
- 🚀 Ready to start (can parallelize)
- `- [ ]` Not started
- `- [x]` Done

---

## PHASE 1: Foundation (Data + Static Site)

### Phase 1.1: Data Transformation & Tournament Data
*Blocker for all other work. Data pipelines working, distillery metadata in progress.*

- [x] ✅ Task 1: Design JSON schemas for bracket, distilleries, votes
- [x] ✅ Task 2: Create `/data/distilleries.json` with all distillery profiles (veteran-owned flags, bios, images)
- [x] ✅ Task 3: Write `scripts/gen-bracket` Rust binary to parse BRACKET.md → JSON
- [x] ✅ Task 4: Generate `/data/bracket-2026.json` with rounds, bouts, voting dates, participant IDs
- [x] ✅ Task 5: Write `scripts/test-bracket.py` to validate bracket structure (31 bouts, feeder logic, dates)
- [ ] 🚀 Task 6: Create CSV export for non-coder editing (`/data/bracket-2026.csv` from generated JSON)
- [ ] 🚀 Task 7: Add CSV import back to JSON for round-trip editing (CSV → JSON idempotent pipeline)

**Parallel work**: Tasks 1-5 complete. Tasks 6-7 optional (non-coders can edit JSON directly for now).

---

### Phase 1.2: Static Website
*Can start after Phase 1.1 data available. HTML skeleton exists, not yet consuming JSON.*

- [ ] 🚀 Task 8: Refactor `bracket.html` to load `/data/bracket-2026.json` dynamically
- [ ] 🚫 Task 9: Render bracket structure (rounds → bouts) with distillery names and images
- [ ] 🚫 Task 10: Add distillery profile modals (name, veteran-owned, founding date, awards, website link)
- [ ] 🚫 Task 11: Add bout detail view (click bout → show participants, voting dates, vote counts)
- [ ] 🚫 Task 12: Add search/filter by distillery name, round, or status
- [ ] 🚫 Task 13: Add year/tournament selector (load different `/data/bracket-*.json` files)
- [ ] 🚫 Task 14: Add "View Results" link in bout details (show active voting if round is live)

**Dependencies**: Task 4 (data) must be complete. Task 14 depends on Task 16 (voting system).
**Parallel work**: Tasks 8-14 can run in parallel once Task 4 done.

---

## PHASE 2: Backend API + Voting System

### Phase 2.1: API Infrastructure
*Blocker for 2.2, 2.3, 2.4. Basic API structure in place, needs endpoints.*

- [ ] 🔄 Task 15: Set up Rust/axum API server (`api/` Cargo project) with middleware (CORS, JSON, error handling)
- [ ] 🚫 Task 16: Implement read-only tournament endpoints (GET /tournaments/:year/bracket, /bouts, /rounds)
- [ ] 🚀 Task 17: Implement user auth endpoints (POST /users/register, /login with JWT)
- [ ] 🚫 Task 18: Implement bracket CRUD endpoints (POST/GET/PUT/DELETE /brackets/:bracketId)
- [ ] 🚫 Task 19: Add bracket validation (enforce voting windows, validate bout/pick IDs)
- [ ] 🚫 Task 20: Add bracket scoring logic (calculate score, GET /brackets/:bracketId/score)

**Dependencies**: Task 15 unblocks 16-20. Task 17 can start immediately.
**Parallel work**: Tasks 16, 18-20 can parallelize once Task 15 done.

---

### Phase 2.2: Voting System
*Depends on Phase 2.1. Feeds Phase 1.2 & 3.*

- [ ] 🚀 Task 21: Design vote data schema (boutId, participantId, source, voter_id, timestamp, source_id)
- [ ] 🚫 Task 22: Implement vote endpoints (POST /vote, GET /votes, GET /active-bout, GET /votes/results)
- [ ] 🚫 Task 23: Add vote storage (SQLite or in-memory JSON cache)
- [ ] 🚫 Task 24: Implement vote aggregation by source (website, discord, twitter, instagram, mastodon, bluesky, threads)
- [ ] 🚫 Task 25: Add historical vote import (admin endpoint to bulk import past voting data from CSV)

**Dependencies**: Task 21 can start anytime (design only). Task 15 unblocks 22-25.
**Parallel work**: Tasks 23-25 parallelize once Task 22 done.

---

### Phase 2.3: Discord Bot
*Depends on Phase 2.1 voting endpoints.*

- [ ] 🔄 Task 26: Set up Rust/poise Discord bot (`discord-bot/` Cargo project) with configuration
- [ ] 🚫 Task 27: Implement `/round` command (show current round + voting dates)
- [ ] 🚫 Task 28: Implement `/bout <boutId>` command (show participants + vote counts)
- [ ] 🚫 Task 29: Implement `/vote <boutId> <participant>` command
- [ ] 🚫 Task 30: Implement `/standings` and `/stats` commands
- [ ] 🚫 Task 31: Add real-time vote updates (polling or webhook to display live vote counts)

**Dependencies**: Task 26 (setup) is independent. Tasks 27-31 blocked by Task 22.
**Parallel work**: Tasks 27-31 can parallelize once Task 22 done.

---

## PHASE 3: Website User Interface + Voting

### Phase 3.1: Website Login/Voting Landing Page
*Depends on Phase 2.1.*

- [ ] 🚀 Task 32: Add login/register UI to website (forms, JWT token storage in localStorage)
- [ ] 🚫 Task 33: Build voting landing page (show active bout, participants, voting buttons)
- [ ] 🚫 Task 34: Display vote count + source breakdown on landing page (website, discord, twitter, etc.)
- [ ] 🚫 Task 35: Add "Create Bracket" button (authenticated users only, links to Task 40)

**Dependencies**: Task 32 depends on Task 17 (auth endpoints). Tasks 33-35 depend on Task 22 (voting endpoints).
**Parallel work**: Tasks 32-35 can parallelize once dependencies met.

---

### Phase 3.2: Interactive Bracket Picker
*Depends on Phase 2.1.*

- [ ] 🚫 Task 36: Build interactive bracket picker UI (show all rounds, click to pick winners)
- [ ] 🚫 Task 37: Add visual feedback (highlight picked/unpicked bouts, show voting window status)
- [ ] 🚫 Task 38: Save picks to API (PUT /brackets/:bracketId on each pick change)
- [ ] 🚫 Task 39: Show user's current bracket score on page
- [ ] 🚫 Task 40: Add "Your Brackets" page (list user's brackets, allow delete/view)
- [ ] 🚫 Task 41: Add leaderboard view (show all users' scores, sortable, highlight current user)

**Dependencies**: Task 36 depends on Task 9 (rendered bracket). Tasks 36-41 depend on Task 18 (bracket CRUD).
**Parallel work**: Tasks 36-41 can parallelize once bracket infrastructure done.

---

## PHASE 4: Social Sharing & Image Generation
*Lower priority. Defer until Phase 3 complete.*

- [ ] Task 42: Implement image generation for bouts (GET /api/share/bout/:boutId/image)
- [ ] Task 43: Support image formats (vertical/Instagram, square/post, horizontal/web)
- [ ] Task 44: Implement bracket image generation (GET /api/share/bracket/:bracketId/image)
- [ ] Task 45: Add share buttons to website (Twitter, Instagram, Facebook composers)

**Dependencies**: 42-44 on Task 16 (endpoints). Task 45 on Tasks 42, 44.
**Parallel work**: Image generation (42-44) can parallelize; share buttons (45) depend on image endpoints.

---

## PHASE 5: Admin & Advanced Features
*Lowest priority. Defer until Phases 1-3 complete.*

- [ ] Task 46: Build vote import pipeline (bulk CSV import from external sources)
- [ ] Task 47: Add vote reconciliation tools (admin endpoint to adjust/remove votes)
- [ ] Task 48: Build admin dashboard (web UI for managing bracket data, votes, results)
- [ ] Task 49: Implement real-time updates via WebSocket or SSE
- [ ] Task 50: Add bout result submission (admin endpoint to set winners, notify users)

**Dependencies**: 46-47 independent. Task 48 depends on 46-47. Task 49 depends on Task 22 (voting). Task 50 on Task 16.
**Parallel work**: Voting admin (46-47) independent from UI (48); real-time (49) depends on vote system.

---

## Critical Path (What Unblocks Everything)

**Task 4** ✅ (bracket data): Unblocks Tasks 8-14 (static site), 16, 23, 42-44

**Task 15** 🔄 (API server): Unblocks Tasks 16-20 (endpoints), 22-25 (voting), 27-31 (Discord)
- **HIGHEST PRIORITY** — this is the blocking issue

**Task 17** 🚀 (user auth): Unblocks Tasks 32, 35, 40-41

**Task 18** 🚫 (bracket CRUD): Unblocks Tasks 35-41 (interactive bracket)

**Task 22** 🚫 (voting endpoints): Unblocks Tasks 24, 27-31 (Discord), 33-34 (website voting)

---

## Next Priorities (In Order)

1. 🔄 Task 15: Complete API server setup (in progress)
2. 🚀 Task 16: Implement tournament endpoints (ready to start)
3. 🚀 Task 17: Implement user auth (ready to start)
4. 🚫 Task 18: Implement bracket CRUD (blocked by Task 17)
5. 🚀 Task 21: Design vote schema (ready to start)
6. 🚀 Task 22: Implement voting endpoints (ready to start after Task 15)
7. 🚀 Task 8: Refactor static site to use JSON (ready to start, Task 4 done)

---

## Suggested Parallel Work Allocation

**Backend Team (2 people)**
- Person A: Finish Task 15 + Task 17 (API setup + auth)
- Person B: Task 16-20 (endpoints), then Task 21-25 (voting), then Task 26-31 (Discord)

**Frontend Team (1-2 people)**
- Person A: Task 8-14 (static site) — start now, Task 4 done
- Person B: Task 32-41 (login, voting UI) — blocked by Task 22

---

## Success Criteria by Phase

**Phase 1 Complete**: Non-coders can edit `/data/bracket-2026.json`, website displays tournament bracket with distillery profiles.

**Phase 2 Complete**: Website and Discord bot query live data via REST API. Voting system operational. Vote results show source breakdown.

**Phase 3 Complete**: Users create accounts, make bracket picks, track scores. Leaderboard displays all users' rankings.

**Phase 4 Complete**: Users generate and share bracket images on social media.

**Phase 5 Complete**: Organizers manage voting data, reconcile votes, post results. Real-time updates visible to users.

---

Last Updated: May 15, 2026
