# TODO.md

## Distillery Profile Pages Plan

Future agents working on VAWT distillery profiles should start by reading [docs/distillery-profile-pages/SKILL.md](docs/distillery-profile-pages/SKILL.md). That file defines the required page format, source rules, UX expectations, product taxonomy, and placeholder style for unclear facts.

Initial static stubs have been generated under [distilleries/](distilleries/) with [distilleries/index.html](distilleries/index.html) as the profile index. Regenerate the current stubs with:

```bash
node scripts/generate-distillery-stubs.js
```

Use `node scripts/generate-distillery-stubs.js --dry-run` before regenerating if you want to confirm the expected count.

### Prioritized Next Steps

- [ ] Link the main bracket UI to [distilleries/index.html](distilleries/index.html) if it is not already visible enough for users.
- [ ] For each profile, find and add the company's official website. If the official site is unclear, leave `TODO: Ask user to confirm the official website for [distillery].`
- [ ] For each profile, find and add the main official Instagram profile. Prefer links discoverable from the official website. If it is not clear, leave `TODO: Ask user to confirm the preferred official Instagram account for [distillery].`
- [ ] Add basic biography fields from primary sources: location, founding/launch year if sourced, ownership/production notes if sourced, visitor experience if relevant, and source URLs.
- [ ] Add product portfolio taxonomy: main product type, all product categories, whiskey categories, and official product-page links where available.
- [ ] Write a concise Wikipedia-style summary paragraph for each profile, sourced to official pages and reputable secondary sources.
- [ ] Replace placeholder text with source-backed facts only. Do not infer product availability, production method, ownership, or active status without a source.
- [ ] Confirm ambiguous bracket entries with Doug before research-heavy edits: Sleepy Fox/J.H. Bards placement, abbreviated names such as Deep Creek and Creek Bottom, and entries that may be brands rather than stand-alone distilleries.
- [ ] Add a permanent profile-page verification test once the profile layout becomes part of the maintained user-facing surface.

### Distillery Research Order

Research and complete profiles in first-appearance order by voting window and bout:

| # | Voting window | Bout | Profile page | Bracket/source note |
|---:|---|---|---|---|
| 1 | May 30-Jun 5, 2026 | R1B1 | [Open Road](distilleries/open-road.html) |  |
| 2 | May 30-Jun 5, 2026 | R1B1 | [Brady's](distilleries/bradys.html) |  |
| 3 | May 30-Jun 5, 2026 | R1B1 | [Old House](distilleries/old-house.html) |  |
| 4 | May 30-Jun 5, 2026 | R1B1 | [Three Crosses](distilleries/three-crosses.html) |  |
| 5 | May 30-Jun 5, 2026 | R1B2 | [New Realm Brewing & Distilling](distilleries/new-realm-brewing-and-distilling.html) | Listed as New Realm in site data. |
| 6 | May 30-Jun 5, 2026 | R1B2 | [Lost Whiskey Co](distilleries/lost-whiskey-co.html) |  |
| 7 | May 30-Jun 5, 2026 | R1B2 | [Highlands Distilling Co](distilleries/highlands-distilling-co.html) | Listed as Highlands in site data. |
| 8 | May 30-Jun 5, 2026 | R1B2 | [Springfield Distillery](distilleries/springfield-distillery.html) | Listed as Springfield in site data. |
| 9 | Jun 6-Jun 12, 2026 | R1B3 | [KO Distilling](distilleries/ko-distilling.html) | Veteran-owned marker in `BRACKET.md`. |
| 10 | Jun 6-Jun 12, 2026 | R1B3 | [Mean Spirits Distilling](distilleries/mean-spirits-distilling.html) | Veteran-owned marker in `BRACKET.md`. |
| 11 | Jun 6-Jun 12, 2026 | R1B3 | [Reservoir Distillery](distilleries/reservoir-distillery.html) | Listed as Reservoir in site data. |
| 12 | Jun 6-Jun 12, 2026 | R1B4 | [Deep Creek](distilleries/deep-creek.html) | Confirm official entity/name. |
| 13 | Jun 6-Jun 12, 2026 | R1B4 | [Five Mile Mountain](distilleries/five-mile-mountain.html) |  |
| 14 | Jun 6-Jun 12, 2026 | R1B4 | [Ironclad](distilleries/ironclad.html) | Veteran-owned marker in `BRACKET.md`. |
| 15 | Jun 13-Jun 19, 2026 | R1B5 | [River Hill](distilleries/river-hill.html) |  |
| 16 | Jun 13-Jun 19, 2026 | R1B5 | [Cape Charles](distilleries/cape-charles.html) |  |
| 17 | Jun 13-Jun 19, 2026 | R1B5 | [Virginia Distillery Co.](distilleries/virginia-distillery-co.html) | Listed as Virginia Distillery Co in site data. |
| 18 | Jun 13-Jun 19, 2026 | R1B6 | [Silverback](distilleries/silverback.html) |  |
| 19 | Jun 13-Jun 19, 2026 | R1B6 | [River City](distilleries/river-city.html) |  |
| 20 | Jun 13-Jun 19, 2026 | R1B6 | [Spirit Lab Distilling](distilleries/spirit-lab-distilling.html) | Listed as Spirit Lab in site data. |
| 21 | Jun 20-Jun 26, 2026 | R1B7 | [Reverend Spirits](distilleries/reverend-spirits.html) |  |
| 22 | Jun 20-Jun 26, 2026 | R1B7 | [Bon Durant Brothers Distillery](distilleries/bon-durant-brothers-distillery.html) | Bracket note: moonshine and bourbon. |
| 23 | Jun 20-Jun 26, 2026 | R1B7 | [Twin Creeks Distillery](distilleries/twin-creeks-distillery.html) | Bracket note: moonshine and bourbon. |
| 24 | Jun 20-Jun 26, 2026 | R1B7 | [George Washington's Grist Mill Distillery](distilleries/george-washingtons-grist-mill-distillery.html) | Listed as GW's Grist Mill in site data. |
| 25 | Jun 20-Jun 26, 2026 | R1B8 | [Ragged Branch](distilleries/ragged-branch.html) |  |
| 26 | Jun 20-Jun 26, 2026 | R1B8 | [Devil's Backbone](distilleries/devils-backbone.html) |  |
| 27 | Jun 20-Jun 26, 2026 | R1B8 | [Tarnished Truth](distilleries/tarnished-truth.html) |  |
| 28 | Jun 20-Jun 26, 2026 | R1B8 | [Blue Sky](distilleries/blue-sky.html) | Bracket note: Triple Deuce, rum, flavored spirits. |
| 29 | Jun 27-Jul 3, 2026 | R1B9 | [Blue Shepherd Spirits](distilleries/blue-shepherd-spirits.html) | Bracket note: gin, bourbon, American single malt. |
| 30 | Jun 27-Jul 3, 2026 | R1B9 | [Caiseal (Vanguard)](distilleries/caiseal-vanguard.html) | Confirm relationship/name. |
| 31 | Jun 27-Jul 3, 2026 | R1B9 | [Bold Rock Distillery](distilleries/bold-rock-distillery.html) | Listed as Bold Rock in site data. |
| 32 | Jun 27-Jul 3, 2026 | R1B10 | [Three Wives Distillery Winchester](distilleries/three-wives-distillery-winchester.html) | Listed as Three Wives in site data. |
| 33 | Jun 27-Jul 3, 2026 | R1B10 | [Davis Valley Distillery](distilleries/davis-valley-distillery.html) | Listed as Davis Valley in site data. |
| 34 | Jun 27-Jul 3, 2026 | R1B10 | [Climax](distilleries/climax.html) | Bracket note: previously produced in association with Belmont Farm. |
| 35 | Jul 4-Jul 10, 2026 | R1B11 | [Filibuster Distillery](distilleries/filibuster-distillery.html) | Listed as Filibuster in site data. |
| 36 | Jul 4-Jul 10, 2026 | R1B11 | [A. Smith Bowman](distilleries/a-smith-bowman.html) |  |
| 37 | Jul 4-Jul 10, 2026 | R1B11 | [Mt Defiance Cidery & Distillery (Old Bolstead)](distilleries/mt-defiance-cidery-and-distillery-old-bolstead.html) | Listed as Mt Defiance in site data. |
| 38 | Jul 4-Jul 10, 2026 | R1B12 | [Catoctin Creek Distilling Co.](distilleries/catoctin-creek-distilling-co.html) | Listed as Catoctin Creek in site data. |
| 39 | Jul 4-Jul 10, 2026 | R1B12 | [Virginia Foothills Distillery](distilleries/virginia-foothills-distillery.html) | Listed as Virginia Foothills in site data. |
| 40 | Jul 4-Jul 10, 2026 | R1B12 | [Copper Fox](distilleries/copper-fox.html) |  |
| 41 | Jul 11-Jul 17, 2026 | R1B13 | [Appalachian Heritage Distillery](distilleries/appalachian-heritage-distillery.html) | Bracket note: moonshine. |
| 42 | Jul 11-Jul 17, 2026 | R1B13 | [Sandy River Distillery](distilleries/sandy-river-distillery.html) | Bracket note: aged craft bourbon and High Bridge rye. |
| 43 | Jul 11-Jul 17, 2026 | R1B13 | [Belmont Farm Distillery](distilleries/belmont-farm-distillery.html) | Listed as Belmont Farm in site data. |
| 44 | Jul 11-Jul 17, 2026 | R1B14 | [Creek Bottom](distilleries/creek-bottom.html) | Confirm official entity/name. |
| 45 | Jul 11-Jul 17, 2026 | R1B14 | [Cool Springs](distilleries/cool-springs.html) |  |
| 46 | Jul 11-Jul 17, 2026 | R1B14 | [Trial & Error](distilleries/trial-and-error.html) |  |
| 47 | Jul 11-Jul 17, 2026 | R1B14 | [J.H. Bards](distilleries/j-h-bards.html) | Bracket note says this entry may move to R1B16. |
| 48 | Jul 18-Jul 24, 2026 | R1B15 | [Murlarkey](distilleries/murlarkey.html) |  |
| 49 | Jul 18-Jul 24, 2026 | R1B15 | [Three Notches (Brewery & Distillery)](distilleries/three-notches-brewery-and-distillery.html) | Listed as Three Notches in site data. |
| 50 | Jul 18-Jul 24, 2026 | R1B15 | [Lincoln Ridge Distillery](distilleries/lincoln-ridge-distillery.html) | Listed as Lincoln Ridge in site data. |
| 51 | Jul 18-Jul 24, 2026 | R1B15 | [Hilltop Distillery](distilleries/hilltop-distillery.html) | Listed as Hilltop in site data. |
| 52 | Jul 18-Jul 24, 2026 | R1B16 | [Sleepy Fox](distilleries/sleepy-fox.html) | Bracket note says to double-check whether still in production. |
| 53 | Jul 18-Jul 24, 2026 | R1B16 | [Bell Isle](distilleries/bell-isle.html) |  |
| 54 | Jul 18-Jul 24, 2026 | R1B16 | [Franklin County Distillers](distilleries/franklin-county-distillers.html) | Bracket note references Franklin County as moonshine capital. |
| 55 | Jul 18-Jul 24, 2026 | R1B16 | [Axe Handle Distilling](distilleries/axe-handle-distilling.html) | Listed as Axe Handle in site data. |

### Clarifications To Ask Doug Before Full Research Pass

- Should profile URLs use full legal/common names, bracket display names, or short slugs when those differ?
- Should researched source facts be embedded directly in each static HTML page for now, or should we introduce a shared `data/distilleries-2026.json` file first?
- For brands with uncertain status or bracket placement, should agents preserve the current bracket list until Doug confirms, or should they propose swaps in a separate issue/TODO section?
- Should social links include only Instagram for now, or should official YouTube/X/Facebook links also be captured as secondary sources when available?

---

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
