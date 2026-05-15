import { SignJWT } from 'jose';
import { getDb } from '../db/client';
import config from '../config';
import { uuidv4 } from '../utils/crypto';

/**
 * Create a new session for a user.
 * Inserts a session row with a UUID primary key and returns a signed JWT.
 *
 * @param userId - User ID to create session for
 * @returns JWT token containing { sub: userId, sessionId }
 */
export async function createSession(userId: number): Promise<string> {
  const db = getDb();
  const sessionId = uuidv4();
  const now = new Date().toISOString();

  // Insert session row
  db.prepare(
    `INSERT INTO sessions (id, user_id, created_at, last_seen) VALUES (?, ?, ?, ?)`
  ).run(sessionId, userId, now, now);

  // Sign JWT with session ID
  const secret = new TextEncoder().encode(config.JWT_SECRET);
  const token = await new SignJWT({
    sub: userId.toString(),
    sessionId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(config.JWT_EXPIRY)
    .sign(secret);

  return token;
}

/**
 * Verify that a session is valid and not revoked.
 *
 * @param userId - User ID that owns the session
 * @param sessionId - Session ID to verify
 * @returns true if session exists and is not revoked, false otherwise
 */
export function verifySession(userId: number, sessionId: string): boolean {
  const db = getDb();

  const session = db
    .prepare('SELECT id, revoked_at FROM sessions WHERE id = ? AND user_id = ?')
    .get(sessionId, userId) as { id: string; revoked_at: string | null } | undefined;

  if (!session) {
    return false;
  }

  // Session is valid if it has not been revoked
  return session.revoked_at === null;
}

/**
 * Revoke a session by setting its revoked_at timestamp.
 *
 * @param sessionId - Session ID to revoke
 */
export function revokeSession(sessionId: string): void {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare('UPDATE sessions SET revoked_at = ? WHERE id = ?').run(now, sessionId);
}
