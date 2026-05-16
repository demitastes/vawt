# Discord Bot — VAWT

Rust/poise Discord bot for the Virginia Whiskey Tournament. Provides real-time tournament information and voting via slash commands.

## Commands

### Read-Only Commands

- **`/round`** — Show the current round, bout count, and voting date range
- **`/voting-dates`** — List all tournament rounds with their voting periods
- **`/bout <bout_id>`** — Show details for a specific bout (participants, voting date, winner status)
- **`/standings`** — Show tournament bracket status (completed vs pending bouts by round)
- **`/help`** — List all available commands with descriptions

### Voting Command

- **`/vote <bout_id> <distillery_id>`** — Cast a vote for a distillery in a bout via the API
  - Ephemeral response (visible only to the voter)
  - Handles success, already-voted, and error states
  - Requires `VAWT_API_BASE_URL` and `VAWT_SERVICE_KEY` to be configured

## Architecture

### Data Source
Tournament data is loaded from local JSON files (`bracket-2026.json`) at startup. Read-only commands use this in-memory data.

### API Integration
The `/vote` command calls the VAWT API:
- **Endpoint**: `POST /api/tournaments/:year/bouts/:boutId/vote`
- **Auth**: `X-Service-Key` header
- **Request body**: `{ distillery_id, discord_id, source: "discord", source_ref: "<timestamp>" }`
- **Responses**:
  - `200 OK` — Vote recorded
  - `409 Conflict` — User already voted in this bout
  - Other errors — Displayed to user

### Code Structure

```
src/
├── main.rs           # Bot setup, command registration, Data struct
├── data.rs           # Tournament JSON loader
├── api.rs            # HTTP client for voting endpoint
└── commands/
    ├── mod.rs        # Module exports
    ├── round.rs      # /round command (real data, was stub)
    ├── voting_dates.rs # /voting-dates command (real data, was stub)
    ├── bout.rs       # /bout command
    ├── standings.rs  # /standings command
    ├── help.rs       # /help command
    └── vote.rs       # /vote command with API integration
```

## Configuration

Set these environment variables:

```bash
# Required
DISCORD_TOKEN=<bot-token>                    # Discord bot token
DATA_DIR=data                                # Path to tournament data directory

# Optional (voting feature)
VAWT_API_BASE_URL=https://api.vawt.app      # API base URL for vote endpoint
VAWT_SERVICE_KEY=<secret-key>               # API authentication key
```

**Note**: If `VAWT_API_BASE_URL` or `VAWT_SERVICE_KEY` are not set, the bot starts normally but the `/vote` command displays "Voting is not configured on this bot instance."

## Building

```bash
cargo build -p vawt-discord-bot
```

## Running

```bash
DISCORD_TOKEN=<token> DATA_DIR=data cargo run -p vawt-discord-bot
```

Or with API voting enabled:

```bash
DISCORD_TOKEN=<token> \
  DATA_DIR=data \
  VAWT_API_BASE_URL=https://api.vawt.app \
  VAWT_SERVICE_KEY=<key> \
  cargo run -p vawt-discord-bot
```

## Implementation Notes

- **Framework**: poise 0.6 (Discord slash commands)
- **Runtime**: tokio async
- **HTTP Client**: reqwest with JSON support
- **Logging**: tracing + tracing-subscriber
- **Data**: Loads from `bracket-{year}.json` (currently hardcoded to 2026)

### Shared Data Structure

All commands access shared tournament data via `ctx.data()`:

```rust
pub struct Data {
    pub tournament: TournamentData,
    pub api: Option<api::ApiClient>,
}
```

- `tournament` — Loaded from JSON at startup
- `api` — Optional HTTP client (None if env vars missing)

### Error Handling

Commands use poise's standard error handling:
- Discord interaction timeouts trigger automatic ephemeral responses
- HTTP errors are caught and displayed to users with emoji indicators (✅, ⚠️, ❌)
- Missing bouts/invalid parameters show user-friendly error messages

## Future Enhancements

- **Task 2.3.6**: Real-time vote updates (polling or webhook) to display live vote counts
- Support for multiple tournament years (currently hardcoded to 2026)
- Bracket prediction tracking and scoring
- User-specific voting history

## Related Files

- `/ARCHITECTURE.md` — Full system design including API contracts
- `/TODO.md` — Project phase checklist (bot tasks marked as complete)
- `../data/bracket-2026.json` — Tournament data source
- `../server/` — Node.js backend API (future, replaces Rust API)
