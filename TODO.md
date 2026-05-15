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

- [ ] **Task 1.1.1** - Design normalized JSON schema for bracket data
  - Schema should support: tournaments, rounds, bouts, participants (distilleries), voting dates, results
  - Support extensible metadata (notes, images, URLs)
  - Create `data/schema.json` documenting the format
  - Assignee: Data-focused developer

- [ ] **Task 1.1.2** - Write `scripts/markdown-to-csv.js`
  - Parse `/data/BRACKET.md` and convert to CSV format
  - Output to `/data/bracket-2026.csv` (for spreadsheet editing)
  - CSV columns: Round, Bout, Participant1, Participant2, Winner, VotingDateStart, VotingDateEnd
  - Include notes/metadata columns
  - Assignee: Data-focused developer

- [ ] **Task 1.1.3** - Write `scripts/csv-to-json.js`
  - Parse CSV and convert to normalized JSON schema from Task 1.1.1
  - Output to `/data/bracket-2026.json`
  - Make it idempotent (can re-run without issues)
  - Assignee: Data-focused developer

- [ ] **Task 1.1.4** - Create `scripts/build-data.sh`
  - Orchestrates: markdown → CSV → JSON pipeline
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

- [ ] **Task 1.2.3** - Add bracket interactivity to static site
  - Click a bout to see details (participants, voting dates, etc.)
  - Filter/search by distillery name
  - Show bout status (voting open/closed, results available)
  - Timeline view showing past/current/upcoming rounds
  - Assignee: Frontend developer

- [ ] **Task 1.2.4** - Add tournament year selection UI
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

### Phase 2.3: Discord Bot Integration (Depends on 2.1)

- [ ] **Task 2.3.1** - Create Discord bot project structure
  - Separate `discord-bot/` directory (or monorepo)
  - Node.js with discord.js library
  - Configuration: Discord token, API base URL
  - Assignee: Discord bot developer

- [ ] **Task 2.3.2** - Implement Discord commands
  - `/round` - Get current round and voting dates
  - `/bout <boutId>` - Get details on a specific bout
  - `/standings <bracketId>` - Get user's bracket score/progress
  - `/stats <year>` - Get tournament statistics
  - `/help` - List all commands
  - Assignee: Discord bot developer

- [ ] **Task 2.3.3** - Add real-time updates to Discord bot (Optional)
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

### Phase 3.2: Bracket Creation & Voting UI (Depends on 3.1.1)

- [ ] **Task 3.2.1** - Add "Create Bracket" flow
  - Button to start new bracket for selected tournament/year
  - Call `POST /api/brackets`
  - Redirect to bracket-picking view
  - Assignee: Frontend developer

- [ ] **Task 3.2.2** - Build interactive bracket picker
  - Display bracket rounds
  - User can click bouts to make picks (only within voting window)
  - Visual feedback for picks made vs. unpicked bouts
  - Call `PUT /api/brackets/:bracketId` to save picks
  - Assignee: Frontend developer

- [ ] **Task 3.2.3** - Add bracket leaderboard view
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

## Phase 5: Admin Interface & Advanced Features (Future)

- [ ] **Task 5.1** - Build admin dashboard for tournament organizers
  - Upload/edit bracket data (or UI for it)
  - Post bout winners
  - Manage voting dates
  - View all user brackets and scores
  - Assignee: Frontend developer + Backend developer

- [ ] **Task 5.2** - Implement real-time updates
  - WebSocket or Server-Sent Events (SSE) for live bout results
  - Notify users when results are posted
  - Update leaderboards in real-time
  - Assignee: Backend developer

---

## Implementation Notes

### Data Ownership
- `/data/` directory is the source of truth for tournament structure
- Users' bracket data stored separately (JSON file or database)
- Keep these concerns separate: tournament structure ≠ user predictions

### Parallel Development Strategy
- **Data team** (1 person): Handles Phase 1.1 data transformation
- **Frontend team** (1-2 people): Handles Phase 1.2 static site, then Phase 3 website UI
- **Backend team** (1-2 people): Handles Phase 2 API, Discord bot
- These workstreams can overlap significantly

### Technology Choices (Recommended)
- **Frontend**: Vanilla JS or lightweight framework (Vue/Svelte) if needed
- **Backend**: Node.js + Express (lightweight, team-familiar for JS devs)
- **Data storage**: JSON files initially (easy for non-coders), migrate to SQLite if complexity grows
- **Auth**: JWT tokens (stateless, simple)
- **Discord Bot**: discord.js library
- **Image generation**: Puppeteer (headless browser) or Sharp + Canvas

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

**Phase 1**: Non-technical users can edit BRACKET.md or CSV, and the website automatically updates to show the latest bracket structure.

**Phase 2**: Website and Discord bot can both query live tournament data via the API. Data is single-source-of-truth.

**Phase 3**: Users can create accounts, make bracket predictions, and compete on leaderboards.

**Phase 4**: Users can generate and share bracket images on social media.

**Phase 5**: Tournament organizers can manage everything from an admin panel without editing code.
