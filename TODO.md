# TODO.md

Implementation plan for VAWT (Virginia Whiskey Tournament) website and Discord bot. Tasks are organized into phases with parallel workstreams where applicable.

## Shared API Layer Design

Both the website UI and Discord bot will consume a single REST API that serves tournament data. This API is the contract between teams and ensures they work with consistent data.

### Core API Endpoints

**Tournament Data (Read-Only)**
- `GET /api/tournaments` - List all tournaments (years)
- `GET /api/tournaments/:year` - Get tournament structure and metadata for a specific year
- `GET /api/tournaments/:year/bracket` - Get full bracket with all rounds and bouts
- `GET /api/tournaments/:year/bouts` - List all bouts for a tournament
- `GET /api/tournaments/:year/bouts/:boutId` - Get specific bout details (matchup, result, winner)
- `GET /api/tournaments/:year/rounds` - Get all rounds with voting dates and deadlines
- `GET /api/tournaments/:year/stats` - Get tournament statistics (past years)

**User Brackets (Requires Authentication)**
- `POST /api/users/register` - Create user account
- `POST /api/users/login` - Authenticate user
- `POST /api/brackets` - Create a new user bracket for a tournament
- `GET /api/brackets/:bracketId` - Get user's bracket with their picks
- `PUT /api/brackets/:bracketId` - Update user's picks for a bout (within voting window)
- `DELETE /api/brackets/:bracketId` - Delete user's bracket
- `GET /api/users/:userId/brackets` - List all brackets for a user

**Tournament Voting (Public)**
- `GET /api/tournaments/:year/bouts/:boutId/votes` - Get aggregate vote counts and sources (discord, twitter, instagram, website, etc.)
- `GET /api/tournaments/:year/active-bout` - Get the currently active bout for voting
- `POST /api/tournaments/:year/bouts/:boutId/vote` - Submit a vote for a bout (requires authentication, or anonymous depending on config)
- `GET /api/tournaments/:year/votes/results` - Get full voting results for all bouts with source breakdown

**Admin Operations (Future)**
- `POST /api/tournaments/:year/bouts/:boutId/result` - Set winner for a bout (admin only)
- `PUT /api/tournaments/:year/rounds/:roundId` - Update round metadata (admin only)
- `POST /api/tournaments` - Create new tournament (admin only)

**Social Sharing (Future)**
- `GET /api/share/bout/:boutId/image` - Generate image of a bout
- `GET /api/share/bracket/:bracketId/image` - Generate bracket image
- `GET /api/share/bout/:boutId/link` - Generate shareable link for a bout

---

## Phase 1: Foundation (Data + Static Site)

**Goal**: Build the data infrastructure and static website for bracket exploration. No user accounts or interactivity yet.

### Phase 1.1: Data Transformation (Parallel)
These tasks can start immediately and are blockers for all other phases.

- [ ] **Task 1.1.1** - Design normalized JSON schemas for bracket and distillery data
  - **Bracket schema**: tournaments, rounds, bouts, participant IDs (by distillery ID), voting dates, results
  - **Distillery schema**: id, name, veteran-owned (boolean), founding-date, location, products, awards, website, image-url
  - Both should support extensible metadata
  - Create `data/schema.json` documenting both formats
  - Assignee: Data-focused developer

- [ ] **Task 1.1.2** - Create distilleries metadata file
  - Create `/data/distilleries.csv` with columns: ID, Name, VeteranOwned (bool), FoundingDate, Location, Products, Awards, Website, ImageURL
  - Populate with all distilleries from BRACKET.md (KO Distilling, Ironclad, etc.)
  - Mark KO Distilling and Mean Spirits Distilling as veteran-owned
  - This file is the source for distillery profile information
  - Assignee: Data-focused developer

- [ ] **Task 1.1.3** - Write `scripts/markdown-to-csv.js`
  - Parse `/data/BRACKET.md` and convert to CSV format
  - Output to `/data/bracket-2026.csv` (for spreadsheet editing)
  - CSV columns: Round, Bout, DistilleryID1, DistilleryID2, Winner, VotingDateStart, VotingDateEnd
  - Use distillery IDs (from Task 1.1.2) instead of full names
  - Include notes/metadata columns
  - Assignee: Data-focused developer

- [ ] **Task 1.1.4** - Write `scripts/csv-to-json.js`
  - Parse bracket CSV and distilleries CSV, merge with schema, output JSON
  - Output to `/data/bracket-2026.json` (normalized bracket with bout IDs, round dates)
  - Output to `/data/distilleries-2026.json` (enriched with profile data)
  - Make it idempotent (can re-run without issues)
  - Assignee: Data-focused developer

- [ ] **Task 1.1.5** - Create `scripts/build-data.sh`
  - Orchestrates: markdown + distilleries → CSV → JSON pipeline
  - One command to rebuild all data from source
  - Add to `package.json` as `npm run build:data`

### Phase 1.2: Static Website (Parallel to 1.1)
Can start once Task 1.1.1 (JSON schema) is done. Uses generated JSON from Phase 1.1.

- [ ] **Task 1.2.1** - Set up minimal Node.js dev environment
  - Create `package.json` with dev dependencies (if needed for local server)
  - Scripts: `npm start` (serve bracket.html), `npm run build:data`
  - Assignee: Frontend developer

- [ ] **Task 1.2.2** - Refactor `bracket.html` to consume JSON data
  - Load `/data/bracket-2026.json` on page load
  - Render bracket structure dynamically (rounds → bouts → participants)
  - Styling should match existing color scheme (already in bracket.html)
  - Display: participant names, bout numbers, winners (if available)
  - Assignee: Frontend developer

- [ ] **Task 1.2.3** - Add distillery profile pages
  - Click a distillery name in any bout → open modal/page showing profile
  - Display: name, veteran-owned status, founding date, location, products, awards, website link
  - Load profile data from `/data/distilleries-2026.json`
  - Link back to bracket from profile (show all bouts featuring this distillery)
  - Assignee: Frontend developer

- [ ] **Task 1.2.4** - Add bracket interactivity to static site
  - Click a bout to see details (participants, voting dates, etc.)
  - Filter/search by distillery name
  - Show bout status (voting open/closed, results available)
  - Timeline view showing past/current/upcoming rounds
  - Assignee: Frontend developer

- [ ] **Task 1.2.5** - Add tournament year selection UI
  - Dropdown or tab to switch between years (read from `/data/bracket-*.json` files)
  - Load and display data for selected year
  - Assignee: Frontend developer

---

## Phase 2: Backend API + User Accounts (Parallel to Phase 1)

**Goal**: Build the REST API and user authentication system that both website and Discord bot will use.

### Phase 2.1: API Infrastructure (Blocker for 2.2, 2.3)

- [ ] **Task 2.1.1** - Set up Node.js/Express backend server
  - Create `server/` directory with `index.js` (Express app)
  - Set up port (3000 or configurable via env var)
  - Add middleware: CORS, JSON parsing, error handling
  - Add health check endpoint `GET /health`
  - Assignee: Backend developer

- [ ] **Task 2.1.2** - Implement read-only tournament data endpoints
  - Implement all endpoints under "Tournament Data (Read-Only)" from API design above
  - Load tournament data from `/data/bracket-*.json` files
  - Cache in-memory (no DB needed yet) and reload on file change
  - Assignee: Backend developer

- [ ] **Task 2.1.3** - Implement user authentication
  - User registration: `POST /api/users/register` (email, password)
  - User login: `POST /api/users/login` (returns JWT token)
  - Validate JWT on protected endpoints
  - Store users in a simple JSON file or SQLite db (pick one)
  - Assignee: Backend developer

### Phase 2.2: User Bracket Management (Depends on 2.1)

- [ ] **Task 2.2.1** - Implement user bracket CRUD endpoints
  - `POST /api/brackets` - Create bracket
  - `GET /api/brackets/:bracketId` - Get bracket with picks
  - `PUT /api/brackets/:bracketId` - Update picks (only within voting window)
  - `DELETE /api/brackets/:bracketId` - Delete bracket
  - Assignee: Backend developer

- [ ] **Task 2.2.2** - Add bracket validation
  - Enforce voting windows (picks only allowed between round start/end dates)
  - Validate bout IDs and pick validity
  - Return clear error messages
  - Assignee: Backend developer

- [ ] **Task 2.2.3** - Add bracket scoring logic
  - Calculate score based on correct picks
  - `GET /api/brackets/:bracketId/score` endpoint
  - Assignee: Backend developer

### Phase 2.4: Voting System (Depends on 2.1)

- [ ] **Task 2.4.1** - Design vote data schema
  - Vote storage: boutId, participantId, source (website, discord, twitter, instagram, mastodon, bluesky, threads), source_id (tweet ID, discord msg ID, etc.), voter_id (optional, null for anonymous), timestamp
  - Support flexible vote sources (new sources can be added without schema changes)
  - Historical votes: import bulk voting data from past years
  - Schema should track vote aggregates by source for transparency
  - Assignee: Backend developer

- [ ] **Task 2.4.2** - Implement vote endpoints
  - `POST /api/tournaments/:year/bouts/:boutId/vote` - Submit vote (website users, Discord bot, or anonymous)
  - `GET /api/tournaments/:year/bouts/:boutId/votes` - Get vote counts + breakdown by source
  - `GET /api/tournaments/:year/active-bout` - Get current active bout (for landing page and Discord bot)
  - `GET /api/tournaments/:year/votes/results` - Full results with source transparency
  - Assignee: Backend developer

- [ ] **Task 2.4.3** - Add vote storage
  - Store votes in SQLite or JSON (depending on scale)
  - Index by bout, source, timestamp for efficient queries
  - Support vote aggregation (count votes per participant per bout, break down by source)
  - Assignee: Backend developer

### Phase 2.5: Discord Bot Integration (Depends on 2.1)

- [ ] **Task 2.5.1** - Create Discord bot project structure
  - Separate `discord-bot/` directory (or monorepo)
  - Node.js with discord.js library
  - Configuration: Discord token, API base URL
  - Assignee: Discord bot developer

- [ ] **Task 2.5.2** - Implement Discord commands
  - `/round` - Get current round and voting dates
  - `/bout <boutId>` - Get details on a specific bout
  - `/standings <bracketId>` - Get user's bracket score/progress
  - `/stats <year>` - Get tournament statistics
  - `/help` - List all commands
  - Assignee: Discord bot developer

- [ ] **Task 2.5.3** - Add Discord voting
  - `/vote <boutId> <participant>` - Cast a vote for a bout from Discord
  - Integration with vote endpoints (Task 2.4.2)
  - Assignee: Discord bot developer

- [ ] **Task 2.5.4** - Add real-time updates to Discord bot (Optional)
  - Polling or webhook: when a bout result is posted, announce in Discord channel
  - Assignee: Discord bot developer

---

## Phase 3: Website User Interface + Bracket Creation

**Goal**: Add user accounts and bracket creation to the website. Users can make predictions and track their picks.

### Phase 3.1: Website Authentication UI (Depends on Phase 2.1)

- [ ] **Task 3.1.1** - Add login/register forms to website
  - Modal or separate login page
  - Call `POST /api/users/register` and `POST /api/users/login`
  - Store JWT token in localStorage
  - Assignee: Frontend developer

- [ ] **Task 3.1.2** - Add authentication state management to website
  - Track logged-in user state
  - Show "Login" button when not authenticated
  - Show "Logout" + "My Brackets" when authenticated
  - Assignee: Frontend developer

### Phase 3.2: Landing Page & Voting UI (Depends on 2.4)

- [ ] **Task 3.2.1** - Build voting landing page
  - Show current/active bout prominently
  - Display both participants with voting buttons
  - Show vote counts + source breakdown (website votes, Discord votes, Twitter votes, etc.)
  - Works on desktop and mobile
  - Anonymous voting allowed (no login required)
  - Redirect logged-in users to their bracket after voting
  - Assignee: Frontend developer

- [ ] **Task 3.2.2** - Add voting results view
  - Page/modal to see voting results for all bouts
  - Breakdown by source (Discord, Twitter, Instagram, Mastodon, Bluesky, Threads, Website)
  - Filter by round, sort by vote count
  - Show historical voting data if available
  - Assignee: Frontend developer

### Phase 3.3: Bracket Creation & Prediction UI (Depends on 3.1.1)

- [ ] **Task 3.3.1** - Add "Create Bracket" flow
  - Button to start new bracket for selected tournament/year
  - Call `POST /api/brackets`
  - Redirect to bracket-picking view
  - Assignee: Frontend developer

- [ ] **Task 3.3.2** - Build interactive bracket picker
  - Display bracket rounds
  - User can click bouts to make picks (only within voting window)
  - Visual feedback for picks made vs. unpicked bouts
  - Call `PUT /api/brackets/:bracketId` to save picks
  - Assignee: Frontend developer

- [ ] **Task 3.3.3** - Add bracket leaderboard view
  - Show all users' scores for a tournament
  - Highlight logged-in user
  - Sortable by score, name, date created
  - Assignee: Frontend developer

---

## Phase 4: Social Sharing & Image Generation (Future)

**Goal**: Allow users to share their brackets and specific bouts on social media with auto-generated images.

- [ ] **Task 4.1** - Implement image generation for bouts
  - `GET /api/share/bout/:boutId/image` returns image (PNG/JPG)
  - Formats: vertical (Instagram story), square (post), horizontal
  - Include: participant names, voting dates, results
  - Library: consider `puppeteer` or `sharp` + canvas
  - Assignee: Backend developer

- [ ] **Task 4.2** - Implement image generation for brackets
  - `GET /api/share/bracket/:bracketId/image` returns full bracket image
  - Formats: vertical, square (series of), horizontal
  - Assignee: Backend developer

- [ ] **Task 4.3** - Add share buttons to website
  - "Share Bout" → generates image + opens Twitter/Instagram composer
  - "Share Bracket" → generates image + link
  - Assignee: Frontend developer

---

## Phase 5: Admin Interface, Vote Import, & Real-Time Updates (Future)

- [ ] **Task 5.1** - Build vote import infrastructure
  - Admin endpoint: `POST /api/admin/votes/import` - bulk import votes from external sources
  - Support CSV format: boutId, participantId, source, count, timestamp
  - Flexible source field (discord, twitter, instagram, mastodon, bluesky, threads, etc.)
  - Idempotent: importing the same data twice doesn't create duplicates
  - Assignee: Backend developer

- [ ] **Task 5.2** - Implement historical voting data import
  - Load past years' voting data (if available)
  - Merge with current year's votes
  - Backfill `/data/votes-*.json` or database with historical data
  - Assignee: Backend developer

- [ ] **Task 5.3** - Build vote source tracking & reconciliation
  - Admin panel: view votes by source with timestamps
  - Manual vote adjustment if needed (e.g., remove spam, correct double-counted votes)
  - Export voting data for analysis
  - Assignee: Backend developer

- [ ] **Task 5.4** - Implement real-time updates
  - WebSocket or Server-Sent Events (SSE) for live bout results and vote counts
  - Notify users when new votes arrive
  - Update leaderboards and vote displays in real-time
  - Assignee: Backend developer

- [ ] **Task 5.5** - Build admin dashboard for tournament organizers (Optional)
  - Web UI for editing `/data/bracket-*.json` (bout winners, dates, participant swaps)
  - Vote import interface
  - Vote reconciliation/adjustment tools
  - Currently: organizers edit JSON files directly and submit votes via admin endpoint
  - This UI can be added later if workflow becomes cumbersome
  - Assignee: Frontend developer + Backend developer

---

## Implementation Notes

### Data Ownership & Organizer Workflow
- `/data/` directory is the source of truth for tournament structure and results
- Organizers edit JSON data files directly (fastest path: no UI needed initially)
- Users' bracket data stored separately (JSON file or database)
- Keep these concerns separate: tournament structure ≠ user predictions
- Admin UI can be added in Phase 5 if editing JSON becomes cumbersome

### Parallel Development Strategy
- **Data team** (1 person): Handles Phase 1.1 data transformation (distilleries, bracket schema)
- **Frontend team** (1-2 people): Handles Phase 1.2 static site, then Phase 3 voting/landing page and bracket UI
- **Backend team** (1-2 people): Handles Phase 2 API infrastructure, voting system (Phase 2.4), Discord bot (Phase 2.5), vote import (Phase 5)
- **Voting and API can proceed in parallel** with bracket infrastructure (Phase 2.1-2.3 unlocks voting)

### Technology Choices (Recommended)
- **Frontend**: Vanilla JS or lightweight framework (Vue/Svelte) if needed
- **Backend**: Node.js + Express (lightweight, team-familiar for JS devs)
- **Data storage**: JSON files for tournament data (easy for non-coders), SQLite for user/vote data (scales better than JSON)
- **Vote storage**: SQLite (or JSON initially, migrate to SQLite when vote volume grows)
- **Auth**: JWT tokens (stateless, simple)
- **Discord Bot**: discord.js library
- **Image generation**: Puppeteer (headless browser) or Sharp + Canvas
- **Real-time**: Server-Sent Events (SSE) for simplicity, or WebSocket if needed

### Testing Requirements
Once Phase 1.1 is complete:
- Unit tests for data transformation scripts (`npm test`)
- Backend: API endpoint tests (Phase 2.1 onwards)
- Frontend: Visual regression tests for bracket rendering (Phase 1.2)
- Discord bot: Command tests (Phase 2.3)

### Deployment Strategy
- **Phase 1**: Static site only, deploy to GitHub Pages or Netlify (no backend)
- **Phase 2 onwards**: Node.js backend needed. Deploy to Heroku, Fly.io, or similar
- **Discord bot**: Deploy as separate process (Heroku, EC2, or local with PM2)

---

## Success Criteria by Phase

**Phase 1**: Non-technical users can edit BRACKET.md or CSV, and the website automatically updates to show the latest bracket structure. Distillery profiles visible to viewers.

**Phase 2**: Website and Discord bot can both query live tournament data via the API. Voting system operational: votes can be cast from website, Discord, and imported from external sources. Vote results show source transparency.

**Phase 3**: Users can see active bouts and vote on the website (anonymous or logged-in). Voting results visible with source breakdown. Users can create accounts, make bracket predictions, and compete on leaderboards.

**Phase 4**: Users can generate and share bracket images on social media.

**Phase 5**: Voting data can be imported from multiple sources in bulk. Organizers can manage voting data and make adjustments. Real-time vote updates visible to users.
