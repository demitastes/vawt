# VAWT Application Architecture Decisions

## Context

Settling frontend, backend, data, API, and deployment architectural decisions before implementation begins. The goal is a concrete, opinionated spec that any developer or agent can implement against without further architectural questions.

### Extensibility Note

This architecture uses "distillery" terminology but is intentionally generic and refactorable for future multi-organizer/multi-domain support. The bracket structure (rounds, bouts, contestants, voting) is completely domain-agnostic. To support a platform where Virginia Whiskey Tournament is one of many tournament organizers (e.g., NCAA brackets, Oscar predictions, sports tournaments), future refactoring would:
- Rename `distillery_id` → `contestant_id` / `participant_id` in database and APIs
- Rename `distilleries.json` → `participants.json` or `competitors.json`
- Move distillery-specific metadata (veteran-owned, primary_products) into flexible `metadata` JSON fields
- Add `tournament_organizer` or `organizer_id` field to support multiple independent tournaments
- Namespace data files by organizer: `/data/organizers/vawt-2026/bracket.json` instead of `/data/bracket-2026.json`

None of these refactorings require architectural changes — they're rename + schema refactoring. The core logic is already generic.

---

## Repo Structure

```
vawt-website/
├── package.json                        # frontend scripts and dependencies
├── vite.config.ts                      # Vite configuration
├── index.html                          # Vite entry point
├── src/                                # React + TypeScript application
├── public/
│   └── data/                           # frontend-served JSON copied from /data
├── data/
│   ├── BRACKET.md                      # source of truth for organizers
│   ├── distilleries.json               # distillery profiles (slug, veteran-owned, etc.)
│   └── bracket-2026.json               # per-year tournament file (rounds, bouts, results)
├── scripts/
│   ├── markdown-to-csv.js
│   ├── csv-to-json.js
│   └── build-data.sh
├── server/                             # Node/TypeScript API, Vercel-friendly deployment target
│   ├── package.json
│   ├── .env.example
│   ├── index.ts                        # entry: load config, init DB, start API handler/server
│   ├── app.ts                          # createApp() factory — testable without listen()
│   ├── config.ts                       # reads + validates all env vars via zod
│   ├── db/
│   │   ├── client.ts                   # database client singleton
│   │   ├── migrate.ts                  # runs numbered .sql files, tracks in _migrations
│   │   └── migrations/
│   │       └── 001_initial_schema.sql
│   ├── data/
│   │   └── loader.ts                   # loads JSON data into memory, fs.watch reload
│   ├── middleware/
│   │   ├── auth.ts                     # requireAuth / optionalAuth (JWT verify + session check)
│   │   ├── requireAdmin.ts             # checks users.is_admin = 1
│   │   ├── requireServiceKey.ts        # validates X-Service-Key for bot calls
│   │   ├── validate.ts                 # zod schema validation wrapper
│   │   └── errorHandler.ts             # central JSON error formatter
│   ├── routes/
│   │   ├── index.ts                    # mounts all routers under /api
│   │   ├── health.ts
│   │   ├── auth.ts
│   │   ├── tournaments.ts
│   │   ├── votes.ts
│   │   ├── brackets.ts
│   │   ├── users.ts
│   │   └── admin.ts
│   ├── services/
│   │   ├── authService.ts              # JWT sign/verify, session management
│   │   ├── magicLinkService.ts         # generate token, send email, verify
│   │   ├── discordOAuthService.ts      # OAuth2 code exchange, user upsert
│   │   ├── voteService.ts              # cast vote, dedup, tally, CSV import
│   │   ├── bracketService.ts           # picks validation, scoring
│   │   ├── scheduleService.ts          # schedule import, overrides, effective status
│   │   └── tournamentService.ts        # query JSON data, active-bout logic
│   └── utils/
│       ├── crypto.ts                   # timingSafeEqual, randomBytes helpers
│       └── csvParser.ts                # vote import CSV row parser
└── discord-bot/                        # Rust service is acceptable here only
    ├── Cargo.toml
    └── src/
        ├── main.rs                     # register commands, start gateway
        ├── commands/                   # /round, /bout, /vote, /bracket, /standings, /help
        └── api.rs                      # thin HTTP client to server API
```

**Key decisions:**
- Frontend is React + TypeScript + Vite at the repository root, replacing the single-file prototype as the product UI
- Deployment should assume Vercel unless a later decision changes it
- Backend should be the easiest thing to deploy and maintain on Vercel: Node/TypeScript API routes or a Vercel-compatible lightweight server, not Rust/axum
- Rust is reserved for the Discord bot, where a long-running service outside Vercel is reasonable
- Frontend source, `server/`, and `discord-bot/` should remain independently understandable; avoid monorepo tooling until it clearly pays for itself
- Bot calls the API over HTTP only — no shared code, only shared API contract and `SERVICE_KEY`
- If Express remains the local API implementation, keep an `app` factory split from deployment entrypoints so tests and Vercel handlers can reuse it

---

## Frontend Platform and UX

The production frontend should be a React + TypeScript + Vite application. It should remain data-driven: public tournament pages read normalized tournament JSON/API responses, while authenticated views add user-specific voting and bracket state.

**Public read-only site:**
- Anyone can browse tournament years, distilleries, bouts, vote totals, winners, and bracket state without logging in
- Public pages never expose write controls; unauthenticated users should see clear sign-in entry points only when a voting action would otherwise be available
- The bracket and bout detail views should work from API responses alone so the site can later support historical years and multiple organizers

**Authenticated voting UX:**
- Website voting requires login; no anonymous website votes
- Logged-in users should see a focused "active bouts" surface that lists only bouts currently available for them to vote on
- Active bout eligibility is computed by joining the current user's id against the `votes` table, using `(tournament_year, bout_id, user_id, source = 'website')`
- Bouts the user has already voted on should disappear from the primary active-voting list, while still being viewable in read-only result/detail screens
- Vote submissions should be idempotent from the user's perspective: duplicate website votes return a clear already-voted state instead of creating another row

**Non-technical admin UX:**
- Admin screens should optimize for organizers who are comfortable with spreadsheets and forms, not code
- Prefer guided forms, previews, validation summaries, and dry-run import feedback before committing changes
- Use familiar labels such as "Open voting", "Close voting", "Reopen voting", "Scheduled open", and "Scheduled close"; avoid exposing internal status names as the primary UI
- CSV/JSON upload remains a fallback and power-user path, not the only admin workflow
- Admin actions should show what will change, what will remain scheduled, and whether the public site or active-voting list is affected

---

## Database Schema (conceptual SQL)

File: `server/db/migrations/001_initial_schema.sql`

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id               INTEGER PRIMARY KEY,
  email            TEXT UNIQUE,
  discord_id       TEXT UNIQUE,
  discord_username TEXT,
  display_name     TEXT,
  is_admin         INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0,1)),
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_users_email      ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_discord_id ON users(discord_id) WHERE discord_id IS NOT NULL;

CREATE TABLE magic_link_tokens (
  id         INTEGER PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,   -- SHA-256 of raw token; raw token only travels in email
  email      TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at    TEXT,                   -- NULL = still valid; set on consume
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_magic_link_email   ON magic_link_tokens(email);
CREATE INDEX idx_magic_link_expires ON magic_link_tokens(expires_at);

CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,       -- UUID v4
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  revoked_at TEXT,                   -- NULL = active
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_seen  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

CREATE TABLE votes (
  id              INTEGER PRIMARY KEY,
  tournament_year INTEGER NOT NULL,
  bout_id         TEXT NOT NULL,       -- e.g. "R1B3"
  distillery_id   TEXT NOT NULL,       -- slug from distilleries.json
  source          TEXT NOT NULL,       -- 'website'|'discord'|'twitter'|'instagram'|'mastodon'|'bluesky'|'threads'|...
  source_ref      TEXT,                -- external dedup key (tweet ID, message snowflake, poll ID, etc.)
  count           INTEGER NOT NULL DEFAULT 1,  -- >1 for aggregate rows (e.g. Instagram poll totals)
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  discord_id      TEXT,                -- populated for bot votes even if no user row yet
  imported_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  voted_at        TEXT,                -- when external vote was cast; falls back to created_at
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  -- One website vote per user per bout
  UNIQUE (tournament_year, bout_id, user_id) WHERE user_id IS NOT NULL AND source = 'website',
  -- One vote per external reference per bout (covers discord, tweet IDs, etc.)
  UNIQUE (tournament_year, bout_id, source, source_ref) WHERE source_ref IS NOT NULL
);
CREATE INDEX idx_votes_bout       ON votes(tournament_year, bout_id);
CREATE INDEX idx_votes_user       ON votes(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_votes_discord_id ON votes(discord_id) WHERE discord_id IS NOT NULL;
CREATE INDEX idx_votes_source     ON votes(tournament_year, source);

CREATE TABLE bout_admin_overrides (
  id                INTEGER PRIMARY KEY,
  tournament_year   INTEGER NOT NULL,
  bout_id           TEXT NOT NULL,
  status_override   TEXT CHECK (status_override IN ('pending','voting_open','voting_closed','complete')),
  scheduled_opens   TEXT,
  scheduled_closes  TEXT,
  note              TEXT,
  changed_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  changed_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (tournament_year, bout_id)
);
CREATE INDEX idx_bout_overrides_bout ON bout_admin_overrides(tournament_year, bout_id);

CREATE TABLE bracket_predictions (
  id              INTEGER PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tournament_year INTEGER NOT NULL,
  picks           TEXT NOT NULL DEFAULT '{}',  -- JSON blob: {"R1B1": "distillery-slug", ...}
  score           INTEGER,                      -- NULL until scoring runs
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (user_id, tournament_year)
);
CREATE INDEX idx_predictions_year ON bracket_predictions(tournament_year);

CREATE TABLE _migrations (
  filename   TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
```

**Key decisions:**
- `source` is a free-form string — adding new platforms requires no schema migration
- `count` column supports aggregate import rows (a single Instagram poll = N votes in one row)
- `votes` uses partial unique indexes for two separate dedup rules without collision
- `picks` stored as JSON blob — avoids junction table; schema stays simple
- All datetimes are ISO-8601 UTC strings — sort/compare correctly, serialize to JSON natively
- `sessions` table enables real logout (JWT carries `session_id`; middleware checks it on each request)
- `users.email` and `users.discord_id` are both nullable — at least one must be set (enforced at app layer)
- `vote_counts` on the JSON file preserves organizer-tallied counts for pre-DB / historical data; `tournamentService.ts` merges JSON counts with DB `SUM(count)` at query time using `bout_id` as the join key
- `bout_admin_overrides` lets admins manually open, close, or reopen a bout without destroying schedule metadata. Runtime status is computed from manual override first, then scheduled dates, then JSON status.

---

## Data JSON Schemas

### `data/bracket-2026.json`

```json
{
  "year": 2026,
  "name": "Virginia Whiskey Tournament 2026",
  "status": "in_progress",
  "rounds": [
    {
      "round_number": 1,
      "label": "Round 1",
      "voting_opens": "2026-03-01T00:00:00Z",
      "voting_closes": "2026-03-15T23:59:59Z",
      "bouts": [
        {
          "bout_id": "R1B1",
          "status": "complete",
          "scheduled_voting_opens": "2026-03-01T00:00:00Z",
          "scheduled_voting_closes": "2026-03-15T23:59:59Z",
          "contestants": ["open-road", "bradys", "old-house", "3-crosses"],
          "winner": "open-road",
          "vote_counts": { "open-road": 142, "bradys": 98, "old-house": 67, "3-crosses": 44 },
          "notes": null
        }
      ]
    }
  ],
  "advancement_rules": {
    "R2B1": { "from": ["R1B1", "R1B3"] },
    "R2B2": { "from": ["R1B2", "R1B4"] },
    "R5B1": { "from": ["R4B1", "R4B2"] }
  }
}
```

- `contestants` is a plain array — naturally handles 3- or 4-entry bouts
- `vote_counts` in JSON = organizer-maintained external/historical tally; merged with live DB votes at query time
- `advancement_rules` is a flat map keyed by bout_id — easier to traverse than a nested tree
- `status` values: `pending` | `voting_open` | `voting_closed` | `complete`
- `scheduled_voting_opens` and `scheduled_voting_closes` preserve planned dates even when an admin manually opens, closes, or reopens the bout
- Organizers set `winner` and update `vote_counts` by editing this file directly

### `data/distilleries.json`

```json
{
  "version": 1,
  "distilleries": [
    {
      "id": "ko-distilling",
      "name": "KO Distilling",
      "veteran_owned": true,
      "founding_year": 2015,
      "location": { "city": "Manassas", "state": "VA", "region": "Northern Virginia" },
      "website": "https://kodistilling.com",
      "image_url": null,
      "primary_products": ["bourbon", "rye", "gin"],
      "awards": [],
      "notes": null,
      "active": true
    }
  ]
}
```

- `id` is a human-assigned slug, lowercase with hyphens — used as foreign key everywhere; never auto-generated
- `active: null` means unknown (as with Sleepy Fox); server can warn if a bracket references an `active: null` distillery
- `version` field at root lets `loader.ts` fail fast with a clear error on format mismatch

---

## API Endpoints

All routes under `/api`. All responses `Content-Type: application/json`.

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/magic-link/request` | none | Send magic link email |
| GET | `/api/auth/magic-link/verify?token=` | none | Verify token → issue JWT |
| GET | `/api/auth/discord/authorize` | none | Redirect to Discord OAuth2 |
| GET | `/api/auth/discord/callback` | none | Exchange code → upsert user → issue JWT |
| POST | `/api/auth/discord/link` | JWT | Link Discord to existing email account |
| POST | `/api/auth/logout` | JWT | Revoke session |
| GET | `/api/auth/me` | JWT | Current user profile |

### Tournament Data (read-only)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tournaments` | none | List available years |
| GET | `/api/tournaments/:year` | none | Full tournament + advancement rules |
| GET | `/api/tournaments/:year/bouts` | none | All bouts with status + vote counts |
| GET | `/api/tournaments/:year/bouts/:boutId` | none | Single bout: contestants, voting window, votes by source |
| GET | `/api/tournaments/:year/active` | none | Currently open-voting bout(s) |
| GET | `/api/distilleries` | none | Full distillery registry |
| GET | `/api/distilleries/:id` | none | Single distillery profile |

### Voting
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/tournaments/:year/bouts/:boutId/vote` | JWT or service key | Cast vote. Website requires JWT; bot sends `X-Service-Key` + `discord_id` in body |
| GET | `/api/tournaments/:year/bouts/:boutId/votes` | none | Vote counts by distillery + source breakdown |
| GET | `/api/tournaments/:year/votes` | none | Full vote results for year, grouped by bout |
| GET | `/api/users/me/tournaments/:year/active-bouts` | JWT | Open bouts the logged-in user has not already voted on |

### Bracket Predictions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/brackets` | JWT | Create prediction bracket for a year |
| GET | `/api/brackets/:id` | none | Bracket with picks + score |
| PUT | `/api/brackets/:id/picks` | JWT (owner) | Update picks (validates against open voting windows) |
| GET | `/api/brackets/:id/score` | none | Compute score against known results |
| GET | `/api/users/me/brackets` | JWT | Caller's brackets across all years |
| GET | `/api/tournaments/:year/leaderboard` | none | Top brackets ranked by score |

### Admin
All require `requireAdmin` middleware (users.is_admin = 1).

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/votes/import` | Bulk import votes from CSV upload |
| POST | `/api/admin/tournaments/:year/schedule/import` | Upload CSV/JSON schedule data; validate and preview before apply |
| PUT | `/api/admin/tournaments/:year/bouts/:boutId/schedule` | Update scheduled open/close dates for one bout |
| POST | `/api/admin/tournaments/:year/bouts/:boutId/open` | Manually open voting, preserving scheduled dates |
| POST | `/api/admin/tournaments/:year/bouts/:boutId/close` | Manually close voting, preserving scheduled dates |
| POST | `/api/admin/tournaments/:year/bouts/:boutId/reopen` | Reopen a closed bout, preserving scheduled dates |
| POST | `/api/admin/bouts/:boutId/result` | Set official bout winner |
| POST | `/api/admin/data/reload` | Force in-memory JSON data reload |
| GET | `/api/admin/votes` | List all votes with filters for audit |

Admin scheduling APIs must be admin-gated and should return both `effective_status` and schedule metadata. Manual status changes affect runtime availability immediately but do not overwrite `scheduled_voting_opens` or `scheduled_voting_closes`.

---

## Auth Flows

### Magic link — new user
1. `POST /api/auth/magic-link/request` with `{ email }`
2. Generate 32 random bytes → raw token (base64url). SHA-256 → `token_hash`. Insert `magic_link_tokens` row (expires 15 min). Same 200 response whether email exists or not.
3. Send email via Resend: link = `MAGIC_LINK_BASE_URL/auth/verify?token=<raw>`
4. `GET /api/auth/magic-link/verify?token=<raw>`: hash raw token, look up by `token_hash WHERE used_at IS NULL AND expires_at > now`
5. Mark `used_at`. Look up user by email — not found → INSERT new user
6. Create session row (UUID). Sign JWT `{ sub: user.id, session_id }`. Return JWT.

### Magic link — returning user
Same as above; step 5 finds existing user, skips INSERT.

### Discord OAuth — new user
1. `GET /api/auth/discord/authorize` → generate `state` nonce → redirect to Discord
2. Discord redirects to `/api/auth/discord/callback?code=&state=`
3. Verify `state`. Exchange `code` for Discord `access_token`. Fetch Discord user (`/users/@me`)
4. Look up `users WHERE discord_id = discord_user.id` — not found → INSERT
5. Create session, sign JWT, return.

### Discord OAuth — returning user
Same; step 4 finds existing user, updates `discord_username`.

### Discord bot API call
1. Bot has `VAWT_SERVICE_KEY` env var
2. `/vote` command received from Discord user (bot gets `discord_id` from the interaction)
3. Bot: `POST /api/tournaments/:year/bouts/:boutId/vote` with header `X-Service-Key: <key>` and body `{ distillery_id, discord_id, source: "discord", source_ref: "<message_snowflake>" }`
4. `requireServiceKey` middleware: `timingSafeEqual(key, SERVICE_KEY)`
5. `voteService.castVote()`: INSERT with partial unique index dedup. If `source_ref` already exists → 409
6. If Discord user has a linked `users` row, set `user_id`. Otherwise leave NULL.
7. Bot responds to user ephemerally.

### Link Discord to existing email account
1. Logged-in user (has JWT) → `GET /api/auth/discord/authorize?link=true`
2. Server encodes `{ pending_link_for_user_id: user.id }` in `state` nonce
3. Normal Discord OAuth flow. At callback: decode state, see `pending_link_for_user_id`
4. Check Discord ID not already claimed by another user → 409 if so
5. `UPDATE users SET discord_id = ?, discord_username = ? WHERE id = ?`
6. Re-sign JWT with updated profile, return.

---

## Technology Choices

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Frontend | React + TypeScript + Vite | Main product UI, strong typing for API data, fast local development, easy static deployment |
| Frontend hosting | Vercel | Likely deployment target; simple previews, static asset hosting, and API co-location if needed |
| Backend runtime | Node/TypeScript on Vercel-compatible APIs | Optimize for lowest deployment and maintenance friction on Vercel |
| Backend non-goal | Rust/axum | Do not choose Rust/axum for the web backend unless a later explicit decision changes the deployment target |
| Local SQL driver | `better-sqlite3` | Good local/prototype option while the API contract is validated; revisit for Vercel production persistence |
| JWT | `jose` | `jsonwebtoken` is unmaintained (2022); `jose` uses native Web Crypto, no OpenSSL binding issues |
| Validation | `zod` | Smaller than Joi, great error messages, TypeScript-native |
| CORS | `cors` (npm) | Standard; configure `CORS_ORIGIN` from env |
| Security headers | `helmet` | One call, sensible defaults |
| Rate limiting | `express-rate-limit` (in-memory) | No Redis needed for single-process server |
| Email | `resend` (prod), Nodemailer+Ethereal (dev) | Resend: generous free tier, simple API; Ethereal: zero-config local capture |
| Discord OAuth | Raw `fetch()` calls | Only 3 HTTP calls; Passport.js fights stateless JWT flow; ~60 lines of transparent code |
| Config | `dotenv` + `zod` in `config.ts` | Fails fast at startup if env vars missing; all modules import from `config.ts` not `process.env` |
| File watching | `fs.watch` (built-in) | Sufficient for a flat directory of JSON files; no need for `chokidar` |
| Discord bot | Rust service calling HTTP API | Rust is acceptable for the bot only; keep it isolated from frontend/backend deployment choices |

If Vercel production hosting makes persistent SQLite operationally awkward, revisit the storage adapter before implementation and choose the simplest Vercel-native managed data store. The API contract and schema concepts should remain stable even if the physical database changes.

---

## Environment Variables

### `server/.env`
```
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://vawt.app
DATABASE_PATH=/data/vawt.db
DATA_DIR=/app/data
JWT_SECRET=<node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))">
JWT_EXPIRY=30d
MAGIC_LINK_BASE_URL=https://vawt.app
MAGIC_LINK_EXPIRY_MINUTES=15
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@vawt.app
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_REDIRECT_URI=https://vawt.app/api/auth/discord/callback
SERVICE_KEY=<same random bytes pattern as JWT_SECRET>
INITIAL_ADMIN_EMAIL=organizer@example.com
```

### `discord-bot/.env`
```
DISCORD_BOT_TOKEN=...
DISCORD_APPLICATION_ID=...
DISCORD_GUILD_ID=...
VAWT_API_BASE_URL=https://vawt.app/api
VAWT_SERVICE_KEY=<same value as server SERVICE_KEY>
```

---

## Vote Import CSV Format

```
tournament_year, bout_id, distillery_id, source, source_ref, vote_count, voted_at, notes
```

| Column | Required | Notes |
|--------|----------|-------|
| `tournament_year` | yes | e.g. `2026` |
| `bout_id` | yes | e.g. `R1B3` — must match a bout in `bracket-<year>.json` |
| `distillery_id` | yes | slug from `distilleries.json` |
| `source` | yes | `twitter`, `instagram`, `mastodon`, `bluesky`, `threads`, etc. |
| `source_ref` | yes | Unique external ID (tweet ID, post URL, poll ID). Required for deduplication |
| `vote_count` | no | Default `1`. Set `>1` for aggregate poll rows (e.g. an Instagram story poll) |
| `voted_at` | no | ISO-8601. Falls back to import time if omitted |
| `notes` | no | Organizer freeform note, stored on the row |

**Deduplication:** `INSERT OR IGNORE` against the partial unique index on `(tournament_year, bout_id, source, source_ref)`. Re-importing the same CSV is fully safe. Response: `{ imported: N, skipped: M, errors: [...] }`. Validation errors skip the row but do not abort the batch.

**Aggregate rows:** A single Instagram story poll with 847 total votes = one row with `vote_count=847`. Vote totals computed as `SUM(count)` not `COUNT(*)`.

---

## Critical Implementation Files

1. `server/db/migrations/001_initial_schema.sql` — full schema above
2. `server/services/voteService.ts` — dedup logic, cast vote, CSV import, tally query
3. `server/data/loader.ts` — JSON data cache + fs.watch reload + `forceReload()`
4. `server/services/magicLinkService.ts` — token generation, email send, verify
5. `server/services/discordOAuthService.ts` — OAuth2 flow, user upsert, account linking
6. `server/middleware/auth.ts` — JWT verify + session row lookup
7. `server/middleware/requireServiceKey.ts` — timingSafeEqual check for bot calls
8. `server/services/scheduleService.ts` — schedule import, admin overrides, effective status
9. `data/bracket-2026.json` — organizer-maintained tournament file
10. `data/distilleries.json` — distillery registry with slugs and metadata

---

## Multi-Organizer Refactoring Path

When expanding to support multiple tournament organizers on the same platform, these are the refactoring points (no architectural changes needed):

### Database Schema Changes
- Rename column: `votes.distillery_id` → `votes.contestant_id`
- Rename column: `bracket_predictions.picks` JSON keys from `"distillery-slug"` → `"contestant-id"`
- Add column: `votes.tournament_id` (foreign key to a new `tournaments` table)
- Add column: `bracket_predictions.tournament_id`
- Add table: `tournaments` with `(id, organizer_id, year, name, status, ...)`
- Add table: `tournament_organizers` with `(id, slug, name, admin_user_id, ...)`

### API Endpoint Changes
- `/api/distilleries` → `/api/tournaments/:tournamentId/contestants`
- `/api/tournaments/:year/bouts` → `/api/organizers/:organizerId/tournaments/:year/bouts`
- Voting endpoint becomes: `POST /api/organizers/:organizerId/tournaments/:year/bouts/:boutId/vote`

### Data File Organization
Current (single organizer):
```
/data/bracket-2026.json
/data/distilleries.json
```

Future (multi-organizer):
```
/data/organizers/vawt/2026/bracket.json
/data/organizers/vawt/contestants.json
/data/organizers/ncaa/2026/bracket.json
/data/organizers/ncaa/contestants.json
```

### Participant Metadata Flexibility
Current (hardcoded distillery fields):
```json
{
  "id": "ko-distilling",
  "name": "KO Distilling",
  "veteran_owned": true,
  "founding_year": 2015,
  "primary_products": ["bourbon", "rye"],
  "awards": []
}
```

Future (flexible metadata):
```json
{
  "id": "ko-distilling",
  "name": "KO Distilling",
  "metadata": {
    "veteran_owned": true,
    "founding_year": 2015,
    "primary_products": ["bourbon", "rye"],
    "awards": []
  }
}
```

Or organizer-specific schemas:
```json
{
  "id": "alabama",
  "name": "University of Alabama",
  "metadata": {
    "conference": "SEC",
    "founded": 1831,
    "mascot": "Crimson Tide"
  }
}
```

### Key Point
The core bracket logic (rounds, bouts, advancement, voting, scoring) is **completely generic and requires zero changes**. Only naming and data organization change. The `contestants` array in the bracket JSON (line 199 of ARCHITECTURE.md) is already agnostic — it's just a list of IDs that map to contestant records.
