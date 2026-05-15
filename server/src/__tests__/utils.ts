import Database from 'better-sqlite3';
import * as authService from '../services/authService';

/**
 * Create a fresh test database with schema
 */
export function createTestDb(): Database.Database {
  const db = new Database(':memory:');

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Run migrations
  const migrationSql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      discord_id TEXT UNIQUE,
      discord_username TEXT,
      display_name TEXT,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      last_seen TEXT NOT NULL,
      revoked_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tournament_year INTEGER NOT NULL,
      bout_id TEXT NOT NULL,
      distillery_id TEXT NOT NULL,
      vote_time TEXT NOT NULL,
      source TEXT NOT NULL,
      count INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, tournament_year, bout_id)
    );

    CREATE TABLE IF NOT EXISTS magic_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );
  `;

  for (const statement of migrationSql.split(';')) {
    if (statement.trim()) {
      db.exec(statement);
    }
  }

  return db;
}

/**
 * Create a test user
 */
export async function createTestUser(
  db: Database.Database,
  email: string = 'test@example.com',
  isAdmin: boolean = false
): Promise<number> {
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO users (email, display_name, is_admin, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(email, 'Test User', isAdmin ? 1 : 0, now, now);

  return result.lastInsertRowid as number;
}

/**
 * Create a test session for a user
 */
export async function createTestSession(
  db: Database.Database,
  userId: number
): Promise<string> {
  // Store the current db for the test
  const originalGetDb = require('../db/client').getDb;
  require('../db/client').getDb = () => db;

  try {
    const token = await authService.createSession(userId);
    return token;
  } finally {
    require('../db/client').getDb = originalGetDb;
  }
}

/**
 * Get a user by email
 */
export function getTestUserByEmail(
  db: Database.Database,
  email: string
): any {
  return db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email);
}

/**
 * Get a session by ID
 */
export function getTestSession(
  db: Database.Database,
  sessionId: string
): any {
  return db
    .prepare('SELECT * FROM sessions WHERE id = ?')
    .get(sessionId);
}
