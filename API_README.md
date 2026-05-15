# VAWT API & Discord Bot Implementation

This document describes the Rust-based REST API and Discord bot for the Virginia Whiskey Tournament (VAWT) application.

## Architecture Overview

The project uses a Rust workspace with four crates:

- **`common`** — Shared types (TournamentData, Bout, Participant, etc.)
- **`api`** — axum REST server serving tournament bracket data
- **`discord-bot`** — poise Discord bot with slash commands
- **`scripts/gen-bracket`** — BRACKET.md → JSON converter

All services read from JSON files in `/data/` (e.g., `bracket-2026.json`).

## Building

```bash
cargo build --workspace
cargo build --release --workspace
```

## Generating Tournament Data

Parse `data/BRACKET.md` and generate `data/bracket-2026.json`:

```bash
cargo run -p gen-bracket
```

Run the test suite to verify:

```bash
python3 scripts/test-bracket.py
```

Tests verify:
- 31 total bouts (16+8+4+2+1)
- Feeder structure (R2B1 feeds from R1B1,R1B2, etc.)
- Voting dates (weekly cadence from 2026-05-18)
- Veteran-owned flags (KO Distilling, Mean Spirits Distilling, Ironclad)
- Round structure (bouts per round correct)

## Running the API Server

### Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
# Edit .env if needed (DATA_DIR, API_PORT)
```

### Start Server

```bash
cargo run -p vawt-api
# or with environment variables:
API_PORT=3001 DATA_DIR=./data cargo run -p vawt-api
```

Server listens on `http://0.0.0.0:3001` by default.

### API Endpoints

| Method | Path | Returns |
|--------|------|---------|
| GET | `/health` | `{"status":"ok"}` |
| GET | `/api/tournaments` | `[2026]` — list of years |
| GET | `/api/tournaments/{year}` | Tournament metadata (name, startDate, boutCount) |
| GET | `/api/tournaments/{year}/bracket` | Full TournamentData (all bouts) |
| GET | `/api/tournaments/{year}/rounds` | Array of RoundSummary (rounds grouped with voting dates) |
| GET | `/api/tournaments/{year}/bouts/{id}` | Single Bout (e.g., `r1b1`, `r2b5`) |

All endpoints return JSON. 404 on not found. CORS enabled for `*`.

### Testing Endpoints

```bash
# Manual curl tests
curl http://localhost:3001/health
curl http://localhost:3001/api/tournaments
curl http://localhost:3001/api/tournaments/2026/bracket | python3 -m json.tool

# Automated test suite
bash scripts/test-api.sh
```

The test suite verifies:
- All endpoints respond correctly
- JSON structure is valid
- 404 errors for non-existent resources
- CORS headers present
- Feeder relationships preserved

## Running the Discord Bot

### Prerequisites

1. Create a Discord application at https://discord.com/developers/applications
2. Add a Bot user to the application
3. Copy the bot token

### Setup

```bash
# Edit .env with your bot token
DISCORD_TOKEN=your_token_here
DATA_DIR=./data
```

### Start Bot

```bash
cargo run -p vawt-discord-bot
# Log output shows: "Ready! Logged in as VAWTBot#..."
```

The bot registers slash commands globally (may take up to 1 hour for visibility; dev guild registration is recommended for testing).

### Slash Commands (Stubs)

- `/round` — Shows current round info (stub response)
- `/voting-dates` — Lists voting schedule (stub response)

Both commands read from the loaded tournament JSON and can be extended with real logic later.

## Data Format

### bracket-2026.json

```json
{
  "year": 2026,
  "name": "Virginia Whiskey Tournament 2026",
  "startDate": "2026-05-18",
  "bouts": [
    {
      "id": "r1b1",
      "round": 1,
      "bout": 1,
      "side": "left",
      "participants": [
        {
          "name": "Open Road",
          "flags": [],
          "notes": ""
        }
      ],
      "feeders": [],
      "winner": null,
      "votingDate": "2026-05-18"
    }
  ]
}
```

**Key fields:**
- `id`: `r{round}b{bout}` format (e.g., `r2b5`)
- `round`: 1–5
- `bout`: within round (1–16 for R1, 1–8 for R2, etc.)
- `side`: `"left"` if bout is odd, `"right"` if even
- `feeders`: List of preceding bout IDs that feed into this one (empty for R1)
- `winner`: `null` (populated when results are set)
- `voting_date`: ISO date string

## File Structure

```
vawt-website/
├── Cargo.toml                     # Workspace root
├── Cargo.lock
├── .env.example                   # Environment template
├── common/
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs
│       ├── types.rs               # TournamentData, Bout, etc.
│       └── error.rs
├── api/
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs                # Startup, load tournaments
│       ├── state.rs               # AppState with Arc<Vec<TournamentData>>
│       ├── router.rs              # axum router + CORS + tracing
│       └── handlers/
│           ├── mod.rs
│           ├── health.rs
│           ├── tournaments.rs     # list, get_tournament
│           ├── bracket.rs         # full bracket JSON
│           ├── rounds.rs          # grouped by round
│           └── bouts.rs           # single bout by ID
├── discord-bot/
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs                # poise framework setup
│       ├── data.rs                # load_tournament
│       └── commands/
│           ├── mod.rs
│           ├── round.rs           # /round slash command
│           └── voting_dates.rs    # /voting-dates slash command
├── scripts/
│   ├── gen-bracket/
│   │   ├── Cargo.toml
│   │   └── src/main.rs            # Parse BRACKET.md → JSON
│   ├── test-bracket.py            # Validate bracket-2026.json
│   └── test-api.sh                # Test API endpoints
└── data/
    ├── BRACKET.md                 # Source of truth (edited by non-coders)
    ├── TOURNAMENT_NOTES.md
    └── bracket-2026.json          # Generated (do not edit by hand)
```

## Development Notes

### Updating Tournament Data

1. Edit `/data/BRACKET.md` (round structure, participants)
2. Re-run the generator: `cargo run -p gen-bracket`
3. Verify: `python3 scripts/test-bracket.py`
4. API picks up new JSON at next startup

### Extending the API

Add new endpoints by:
1. Creating a handler in `api/src/handlers/{name}.rs`
2. Adding a route in `api/src/router.rs`
3. Testing with `bash scripts/test-api.sh` (or curl)

### Extending Discord Bot

Flesh out stub commands by reading `ctx.data().tournament.bouts` and computing dates/rounds as needed. The `/round` command can determine the current round by comparing today's date to voting dates.

## Testing Checklist

- [ ] `cargo build --workspace` compiles without errors
- [ ] `cargo run -p gen-bracket` produces `data/bracket-2026.json`
- [ ] `python3 scripts/test-bracket.py` passes all 12 tests
- [ ] `cargo run -p vawt-api` starts without errors, logs "listening on 0.0.0.0:3001"
- [ ] `bash scripts/test-api.sh` passes all endpoint tests
- [ ] `cargo run -p vawt-discord-bot` starts, logs "Ready!"
- [ ] `/round` and `/voting-dates` commands work in Discord

## Production Considerations

- **Database**: Phase 1 uses JSON files. Upgrade to a database (SQLite, PostgreSQL) for Phase 2 (user brackets, accounts).
- **Authentication**: Add JWT for protected endpoints (admin result submission).
- **Caching**: Use `tower-http` to add caching headers for static bracket data.
- **Validation**: Add input validation for admin endpoints (future).
- **Monitoring**: Use `tracing` logs in production with a log aggregation service.
- **Discord Bot Token**: Never commit `.env` with the real token; use GitHub secrets or environment-specific config.

---

Built with axum 0.8, poise 0.6, serde, tokio, chrono.
