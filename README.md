# VAWT - Virginia Whiskey Tournament

A web application and Discord bot for showcasing and participating in a single-elimination bracket tournament. Designed to be extensible for multiple years and tournament formats.

## Project Status

- **Phase 1**: Data infrastructure and static website (in progress)
- **Phase 2**: Backend API and Discord bot (planned)
- **Phase 3**: User accounts and interactive bracket creation (planned)
- **Phase 4**: Social sharing with image generation (planned)
- **Phase 5**: Admin interface (planned)

## Documentation Guide

Start here to understand the project:

### Getting Started
- **[ROADMAP.md](ROADMAP.md)** — The original vision and requirements from the project creator
- **[AGENTS.md](AGENTS.md)** — Development guidance, architecture overview, and how to contribute (`CLAUDE.md` symlinks here)
- **[TODO.md](TODO.md)** — Detailed task breakdown organized by phase, with dependencies

### Architecture & Decisions
- **[DECISIONS.md](DECISIONS.md)** — Key architectural decisions and their rationale
  - Shared REST API layer for website and Discord bot
  - Data ownership model (/data = source of truth)
  - Phase-based implementation with parallel workstreams
  - Technology recommendations (Node.js/Express, SQLite, JWT)
  
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — Concrete technical specification for the backend
  - Exact file and directory structure
  - SQLite database schema
  - Route endpoints and middleware
  - Service layer organization
  - Discord bot structure

## File Structure

```
vawt-website/
├── bracket.html                 # Static website entry point
├── data/
│   ├── BRACKET.md              # Tournament bracket (source of truth for organizers)
│   ├── TOURNAMENT_NOTES.md      # Tournament metadata and annotations
│   ├── distilleries.json        # Distillery profiles (veteran-owned, etc.)
│   └── bracket-2026.json        # Compiled normalized tournament data (auto-generated)
├── scripts/
│   ├── markdown-to-csv.js       # Convert BRACKET.md → CSV
│   ├── csv-to-json.js           # Convert CSV → JSON
│   └── build-data.sh            # Orchestrates data transformation pipeline
├── server/                      # Backend API (Node.js/Express) — Phase 2+
├── discord-bot/                 # Discord bot (discord.js) — Phase 2.3+
├── ROADMAP.md                   # Original vision
├── AGENTS.md                    # Development guidance (and CLAUDE.md symlink)
├── TODO.md                      # Task breakdown by phase
├── DECISIONS.md                 # Architectural decision record
├── ARCHITECTURE.md              # Technical implementation spec
└── README.md                    # This file
```

## Quick Start

### View the static website locally
```bash
open bracket.html
# or serve via HTTP server if needed:
python3 -m http.server 8000  # then open http://localhost:8000/bracket.html
```

### Understand the data structure
1. Read `data/BRACKET.md` — the raw bracket structure
2. Run data transformation: `scripts/build-data.sh` (generates `data/bracket-2026.json`)
3. View the normalized JSON output

## Key Architectural Decisions

### 1. **Shared REST API**
Both the website and Discord bot consume the same REST API. This ensures:
- Single source of truth for tournament state
- Independent development of subsystems
- Clear contract between teams

### 2. **Data Ownership**
- `/data/` directory is the single source of truth for tournament structure
- User bracket data stored separately (database) — independent from tournament data
- Non-coders can edit tournament data via CSV without touching user predictions

### 3. **Parallel Development**
Five phases with clear dependencies allow multiple teams to work simultaneously:
- **Phase 1.1**: Data transformation scripts (blocker for everything)
- **Phase 1.2**: Static website (parallelizes with Phase 2)
- **Phase 2.1**: API infrastructure (blocker for Phases 2.2 and 2.3)
- **Phase 2.2 & 2.3**: User brackets and Discord bot (can parallelize)
- **Phases 3-5**: User features, social sharing, admin interface

### 4. **Technology Stack**
- **Frontend**: Vanilla JavaScript or lightweight framework (Vue/Svelte)
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT tokens + optional magic links / Discord OAuth
- **Discord Bot**: discord.js
- **Image Generation**: Puppeteer (Phase 4)

See [DECISIONS.md](DECISIONS.md) and [ARCHITECTURE.md](ARCHITECTURE.md) for full details.

## Development Workflow

### Running Tests
```bash
npm test  # (once test infrastructure is in place)
```

### Building Data
```bash
./scripts/build-data.sh
# This converts: BRACKET.md → CSV → JSON
```

### Backend Development
```bash
cd server
npm install
npm start
# API runs on http://localhost:3000
```

### Discord Bot Development
```bash
cd discord-bot
npm install
npm start
```

## Parallel Development Setup

**Data Team**: Focus on Phase 1.1
- Refine JSON schema
- Build and test transformation scripts
- Create CSV export for non-coders

**Frontend Team**: Focus on Phase 1.2
- Build static website (uses generated JSON)
- Can run locally without backend until Phase 2 API is ready

**Backend Team**: Focus on Phase 2.1 + 2.2
- Build REST API
- Implement user authentication and bracket management
- Parallel task: Discord bot (Phase 2.3)

## Voting & Tournament System

The system supports voting on bout outcomes:

- **Voting Dates**: Each round has start/end dates (defined in BRACKET.md)
- **User Picks**: Users create brackets and pick winners for future bouts
- **Vote Tallying**: Organizers can import vote CSV to set bout winners
- **Score Tracking**: Users' bracket scores calculated based on correct picks
- **Magic Links**: Email-based authentication for users
- **Discord OAuth**: Optional Discord login alternative

See [ARCHITECTURE.md](ARCHITECTURE.md) for database schema and API details.

## Non-Coder Data Editing

Tournament organizers (non-coders) update data via spreadsheet:

1. **Edit**: Open `data/bracket-2026.csv` in Excel or Google Sheets
2. **Save**: Export back as CSV
3. **Rebuild**: Run `./scripts/build-data.sh`
4. **Deploy**: Website and bot automatically use updated `bracket-2026.json`

No code changes or git commits required by non-coders.

## Contributing

1. Check [TODO.md](TODO.md) for available tasks
2. Read [AGENTS.md](AGENTS.md) for development guidance
3. Review [DECISIONS.md](DECISIONS.md) and [ARCHITECTURE.md](ARCHITECTURE.md) for context
4. Follow the phase structure to minimize blocking and enable parallel work

## Future Roadmap

- **Phase 1** (Now): Data infrastructure + static website
- **Phase 2** (Next): Backend API + user accounts + Discord bot
- **Phase 3**: Interactive bracket creation and leaderboards
- **Phase 4**: Social sharing with auto-generated images (vertical, square, horizontal)
- **Phase 5**: Admin dashboard for tournament organizers

See [ROADMAP.md](ROADMAP.md) for the full vision.

## Support

- Questions about architecture: See [DECISIONS.md](DECISIONS.md) and [ARCHITECTURE.md](ARCHITECTURE.md)
- Development guidance: See [AGENTS.md](AGENTS.md)
- Task breakdown: See [TODO.md](TODO.md)
- Original requirements: See [ROADMAP.md](ROADMAP.md)

---

**Created**: May 15, 2026  
**Last Updated**: May 15, 2026
