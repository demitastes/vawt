# TODO.md - Task Tracker

Implementation plan for VAWT (Virginia Whiskey Tournament) with sequential task numbering, completion status, and clear dependency chains for parallel development.

**Key**: 
- ✓ = Complete
- [ ] = Not started
- [~] = In progress

---

## PHASE 1: Foundation (Data + Static Site)

### Phase 1.1: Data Transformation & Tournament Data (Blocker for all)

**Status**: ~50% complete. Data pipelines working, distillery metadata in progress.

| Task | Status | Description | Assignee | Depends On |
|------|--------|-------------|----------|-----------|
| 1 | ✓ | Design JSON schemas for bracket, distilleries, votes | Backend | — |
| 2 | ✓ | Create `/data/distilleries.json` with all distillery profiles (veteran-owned flags, bios, images) | Data | — |
| 3 | ✓ | Write `scripts/gen-bracket` Rust binary to parse BRACKET.md → JSON | Backend | Task 1 |
| 4 | ✓ | Generate `/data/bracket-2026.json` with rounds, bouts, voting dates, participant IDs | Backend | Task 3 |
| 5 | ✓ | Write `scripts/test-bracket.py` to validate bracket structure (31 bouts, feeder logic, dates) | QA | Task 4 |
| 6 | [ ] | Create CSV export for non-coder editing (`/data/bracket-2026.csv` from generated JSON) | Backend | Task 4 |
| 7 | [ ] | Add CSV import back to JSON for round-trip editing (CSV → JSON idempotent pipeline) | Backend | Task 6 |

**Parallel work**: Tasks 1-5 are complete. Tasks 6-7 are optional optimizations (non-coders can edit JSON directly for now).

---

### Phase 1.2: Static Website (Can start after Phase 1.1 data is available)

**Status**: 10% complete. HTML skeleton exists, not yet consuming JSON.

| Task | Status | Description | Assignee | Depends On |
|------|--------|-------------|----------|-----------|
| 8 | [ ] | Refactor `bracket.html` to load `/data/bracket-2026.json` dynamically | Frontend | Task 4 |
| 9 | [ ] | Render bracket structure (rounds → bouts) with distillery names and images | Frontend | Task 8 |
| 10 | [ ] | Add distillery profile modals (name, veteran-owned, founding date, awards, website link) | Frontend | Task 2, 9 |
| 11 | [ ] | Add bout detail view (click bout → show participants, voting dates, vote counts) | Frontend | Task 9, Task 16 |
| 12 | [ ] | Add search/filter by distillery name, round, or status | Frontend | Task 9 |
| 13 | [ ] | Add year/tournament selector (load different `/data/bracket-*.json` files) | Frontend | Task 8 |
| 14 | [ ] | Add "View Results" link in bout details (show active voting if round is live) | Frontend | Task 11, Task 16 |

**Parallel work**: Tasks 8-14 can run in parallel once Task 4 is done. Task 14 depends on Task 16 (voting system).

---

## PHASE 2: Backend API + Voting System

### Phase 2.1: API Infrastructure (Blocker for 2.2, 2.3, 2.4)

**Status**: 30% complete. Basic API structure in place, needs endpoints.

| Task | Status | Description | Assignee | Depends On |
|------|--------|-------------|----------|-----------|
| 15 | [~] | Set up Rust/axum API server (`api/` Cargo project) with middleware (CORS, JSON, error handling) | Backend | — |
| 16 | [ ] | Implement read-only tournament endpoints (GET /tournaments/:year/bracket, /bouts, /rounds) | Backend | Task 15, Task 4 |
| 17 | [ ] | Implement user auth endpoints (POST /users/register, /login with JWT) | Backend | Task 15 |
| 18 | [ ] | Implement bracket CRUD endpoints (POST/GET/PUT/DELETE /brackets/:bracketId) | Backend | Task 15, Task 17 |
| 19 | [ ] | Add bracket validation (enforce voting windows, validate bout/pick IDs) | Backend | Task 18 |
| 20 | [ ] | Add bracket scoring logic (calculate score, GET /brackets/:bracketId/score) | Backend | Task 18 |

**Parallel work**: Task 15 unblocks 16-20. Task 17 can start immediately (doesn't depend on other tasks). Tasks 16, 18-20 can parallelize once 15 is done.

---

### Phase 2.2: Voting System (Depends on Phase 2.1, feeds Phase 1.2 & 3)

**Status**: 0% complete. Voting schema designed, endpoints not yet implemented.

| Task | Status | Description | Assignee | Depends On |
|------|--------|-------------|----------|-----------|
| 21 | [ ] | Design vote data schema (boutId, participantId, source, voter_id, timestamp, source_id) | Backend | Task 4 |
| 22 | [ ] | Implement vote endpoints (POST /vote, GET /votes, GET /active-bout, GET /votes/results) | Backend | Task 15, Task 21 |
| 23 | [ ] | Add vote storage (SQLite or in-memory JSON cache) | Backend | Task 22 |
| 24 | [ ] | Implement vote aggregation by source (website, discord, twitter, instagram, mastodon, bluesky, threads) | Backend | Task 23 |
| 25 | [ ] | Add historical vote import (admin endpoint to bulk import past voting data from CSV) | Backend | Task 23 |

**Parallel work**: Task 21 (design) can start anytime. Task 22 can run in parallel with other Phase 2.1 work. Tasks 23-25 parallelize once 22 is done.

---

### Phase 2.3: Discord Bot (Depends on Phase 2.1 voting endpoints)

**Status**: 5% complete. Project structure created, commands not yet implemented.

| Task | Status | Description | Assignee | Depends On |
|------|--------|-------------|----------|-----------|
| 26 | [~] | Set up Rust/poise Discord bot (`discord-bot/` Cargo project) with configuration | Discord Dev | — |
| 27 | [ ] | Implement `/round` command (show current round + voting dates) | Discord Dev | Task 16, Task 22 |
| 28 | [ ] | Implement `/bout <boutId>` command (show participants + vote counts) | Discord Dev | Task 16, Task 24 |
| 29 | [ ] | Implement `/vote <boutId> <participant>` command | Discord Dev | Task 22 |
| 30 | [ ] | Implement `/standings` and `/stats` commands | Discord Dev | Task 20 |
| 31 | [ ] | Add real-time vote updates (polling or webhook to display live vote counts) | Discord Dev | Task 24 |

**Parallel work**: Task 26 (setup) is independent. Tasks 27-31 can parallelize once voting endpoints (Task 22) are ready.

---

## PHASE 3: Website User Interface + Voting

### Phase 3.1: Website Login/Voting Landing Page (Depends on Phase 2.1)

**Status**: 0% complete.

| Task | Status | Description | Assignee | Depends On |
|------|--------|-------------|----------|-----------|
| 32 | [ ] | Add login/register UI to website (forms, JWT token storage in localStorage) | Frontend | Task 8, Task 17 |
| 33 | [ ] | Build voting landing page (show active bout, participants, voting buttons) | Frontend | Task 8, Task 14, Task 22 |
| 34 | [ ] | Display vote count + source breakdown on landing page (website, discord, twitter, etc.) | Frontend | Task 33, Task 24 |
| 35 | [ ] | Add "Create Bracket" button (authenticated users only, links to Task 40) | Frontend | Task 32, Task 18 |

**Parallel work**: Tasks 32-35 can parallelize once dependencies are met.

---

### Phase 3.2: Interactive Bracket Picker (Depends on Phase 2.1)

**Status**: 0% complete.

| Task | Status | Description | Assignee | Depends On |
|------|--------|-------------|----------|-----------|
| 36 | [ ] | Build interactive bracket picker UI (show all rounds, click to pick winners) | Frontend | Task 9, Task 32 |
| 37 | [ ] | Add visual feedback (highlight picked/unpicked bouts, show voting window status) | Frontend | Task 36 |
| 38 | [ ] | Save picks to API (PUT /brackets/:bracketId on each pick change) | Frontend | Task 36, Task 18 |
| 39 | [ ] | Show user's current bracket score on page | Frontend | Task 38, Task 20 |
| 40 | [ ] | Add "Your Brackets" page (list user's brackets, allow delete/view) | Frontend | Task 32, Task 18 |
| 41 | [ ] | Add leaderboard view (show all users' scores, sortable, highlight current user) | Frontend | Task 32, Task 20 |

**Parallel work**: Tasks 36-41 can parallelize once bracket infrastructure (Task 18) is complete.

---

## PHASE 4: Social Sharing & Image Generation

**Status**: 0% complete. Lower priority, defer until Phase 3 is done.

| Task | Status | Description | Assignee | Depends On |
|------|--------|-------------|----------|-----------|
| 42 | [ ] | Implement image generation for bouts (GET /api/share/bout/:boutId/image) | Backend | Task 16 |
| 43 | [ ] | Support image formats (vertical/Instagram, square/post, horizontal/web) | Backend | Task 42 |
| 44 | [ ] | Implement bracket image generation (GET /api/share/bracket/:bracketId/image) | Backend | Task 18, Task 42 |
| 45 | [ ] | Add share buttons to website (Twitter, Instagram, Facebook composers) | Frontend | Task 33, Task 42, Task 44 |

**Parallel work**: Image generation (42-44) can parallelize; share buttons (45) depend on image endpoints.

---

## PHASE 5: Admin & Advanced Features

**Status**: 0% complete. Lowest priority.

| Task | Status | Description | Assignee | Depends On |
|------|--------|-------------|----------|-----------|
| 46 | [ ] | Build vote import pipeline (bulk CSV import from external sources) | Backend | Task 23 |
| 47 | [ ] | Add vote reconciliation tools (admin endpoint to adjust/remove votes) | Backend | Task 46 |
| 48 | [ ] | Build admin dashboard (web UI for managing bracket data, votes, results) | Frontend | Task 32, Task 47 |
| 49 | [ ] | Implement real-time updates via WebSocket or SSE | Backend | Task 22 |
| 50 | [ ] | Add bout result submission (admin endpoint to set winners, notify users) | Backend | Task 16 |

**Parallel work**: Voting admin (46-47) independent from UI (48); real-time (49) depends on vote system.

---

## DEPENDENCY GRAPH (For Parallel Execution)

```
INDEPENDENT (No blockers):
├─ Task 1: Design schemas
├─ Task 2: Distillery metadata
├─ Task 8: Refactor HTML
├─ Task 15: API setup
├─ Task 17: User auth
├─ Task 26: Discord bot setup
├─ Task 21: Vote schema design
└─ Task 32: Login UI

BLOCKER CHAINS (Critical path):
├─ Phase 1: Tasks 1 → 3 → 4 → 5 (data pipeline complete)
│  ├─ Task 4 unblocks: 2 (distilleries), 6-7 (CSV), 8-14 (static site), 16, 23, 42-44
│  └─ Task 16 unblocks: 11, 22, 27-28, 33-34
│
├─ Phase 2: Task 15 → 18 → 20 (bracket CRUD + scoring)
│  └─ Task 18 unblocks: 35-41 (bracket UI)
│
├─ Phase 2: Task 15 → 22 (voting endpoints)
│  ├─ Task 22 unblocks: 24, 27, 29, 34, 49
│  └─ Task 24 unblocks: 28, 31, 34
│
└─ Phase 3: Task 32 + 18 → 36-41 (interactive bracket)
```

---

## CRITICAL DEPENDENCIES (What blocks what)

| Blocker | Blocks | Impact |
|---------|--------|--------|
| Task 4 (bracket data) | Tasks 8-14, 16, 23, 42-44 | Everything depends on generated JSON |
| Task 15 (API server) | Tasks 16-25, 27-31, 33-41 | Core backend; unblocks all API work |
| Task 17 (user auth) | Tasks 32, 35, 40-41 | Required for account features |
| Task 18 (bracket CRUD) | Tasks 19-20, 35-41 | Required for picking/scoring |
| Task 22 (vote endpoints) | Tasks 24, 27-31, 33-34, 49 | Required for voting features |

---

## SUGGESTED PARALLEL WORK ALLOCATION

### Backend Team (2 people)
1. **Person A**: Tasks 1-7 (data pipeline) + Task 15 (API setup) + Task 17 (auth)
2. **Person B**: Task 16 (tournament endpoints) + Task 18-20 (bracket CRUD) + Task 21-25 (voting)
   - Once Tasks 15-20 done, help Person A with Tasks 26-31 (Discord bot)

### Frontend Team (1-2 people)
1. **Person A**: Tasks 8-14 (static site) — can start once Task 4 done
2. **Person B**: Tasks 32-41 (voting UI + bracket picker) — can start once Tasks 17-18-22 done

### Timeline
- **Week 1**: Data pipeline (1-7), API setup (15), User auth (17)
- **Week 2**: Tournament endpoints (16), Bracket CRUD (18-20), Voting design (21)
- **Week 3**: Voting endpoints (22-25), Static site (8-14), Discord bot setup (26)
- **Week 4**: Discord commands (27-31), Website voting UI (32-34)
- **Week 5**: Interactive bracket (36-41), Real-time updates (49)

---

## Success Criteria by Phase

**Phase 1 Complete**: Non-coders can edit `/data/bracket-2026.json` (or CSV), website displays tournament bracket with distillery profiles.

**Phase 2 Complete**: Website and Discord bot query live data via REST API. Voting system operational (website votes, Discord votes, vote import). Vote results show source breakdown.

**Phase 3 Complete**: Users create accounts, make bracket picks, track scores. Leaderboard displays all users' rankings.

**Phase 4 Complete**: Users generate and share bracket images on social media.

**Phase 5 Complete**: Organizers manage voting data, reconcile votes, post results. Real-time updates visible to users.

---

## Task Status Summary

- **Complete (✓)**: 5 tasks (data pipeline)
- **In Progress ([~])**: 2 tasks (API setup, Discord bot structure)
- **Not Started ([ ])**: 43 tasks
- **Optional**: 2 tasks (CSV round-trip)

**Next Priorities** (in order):
1. Complete API server setup (Task 15)
2. Implement tournament endpoints (Task 16)
3. Implement user auth (Task 17)
4. Implement bracket CRUD (Task 18)
5. Start voting system (Task 22)
6. Refactor static site to use JSON (Task 8)

---

**Last Updated**: May 15, 2026
**Workflow**: Tasks renumbered sequentially (1-50); dependencies clarified; parallel workstreams identified.
