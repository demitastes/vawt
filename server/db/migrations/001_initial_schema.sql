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
  token_hash TEXT NOT NULL UNIQUE,
  email      TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_magic_link_email   ON magic_link_tokens(email);
CREATE INDEX idx_magic_link_expires ON magic_link_tokens(expires_at);

CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_seen  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

CREATE TABLE votes (
  id              INTEGER PRIMARY KEY,
  tournament_year INTEGER NOT NULL,
  bout_id         TEXT NOT NULL,
  distillery_id   TEXT NOT NULL,
  source          TEXT NOT NULL,
  source_ref      TEXT,
  count           INTEGER NOT NULL DEFAULT 1,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  discord_id      TEXT,
  imported_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  voted_at        TEXT,
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX idx_votes_website_unique ON votes(tournament_year, bout_id, user_id) WHERE user_id IS NOT NULL AND source = 'website';
CREATE UNIQUE INDEX idx_votes_source_unique ON votes(tournament_year, bout_id, source, source_ref) WHERE source_ref IS NOT NULL;
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
  picks           TEXT NOT NULL DEFAULT '{}',
  score           INTEGER,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (user_id, tournament_year)
);
CREATE INDEX idx_predictions_year ON bracket_predictions(tournament_year);
