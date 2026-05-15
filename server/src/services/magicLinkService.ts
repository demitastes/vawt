import { getDb } from '../db/client';
import config from '../config';
import { randomBytes, sha256 } from '../utils/crypto';
import { createSession } from './authService';
import { AppError } from '../middleware/errorHandler';

interface User {
  id: number;
  email: string;
  discord_id: string | null;
  discord_username: string | null;
  display_name: string | null;
  is_admin: number;
  created_at: string;
  updated_at: string;
}

/**
 * Generate a magic link token and insert it into the database.
 * Returns the raw token (to be sent in email), stores only the SHA-256 hash.
 *
 * @param email - Email address to generate token for
 * @returns Raw token string (to send in email)
 */
export function generateMagicLink(email: string): string {
  const db = getDb();

  // Generate 32 random bytes → base64url
  const rawToken = randomBytes(32);

  // Hash the raw token with SHA-256
  const tokenHash = sha256(rawToken);

  // Calculate expiry (15 minutes from now)
  const expiresAt = new Date(Date.now() + config.MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  // Insert into magic_link_tokens
  db.prepare(
    `INSERT INTO magic_link_tokens (token_hash, email, expires_at, created_at)
     VALUES (?, ?, ?, ?)`
  ).run(tokenHash, email, expiresAt, now);

  return rawToken;
}

/**
 * Verify a magic link token and create a user session.
 *
 * Steps:
 * 1. SHA-256 hash the raw token
 * 2. Look up by hash WHERE used_at IS NULL AND expires_at > now
 * 3. Mark used_at
 * 4. Look up or create user by email
 * 5. Call createSession() and return JWT
 *
 * @param rawToken - Raw token from magic link (from email)
 * @returns JWT token for authenticated session
 * @throws AppError if token is invalid, expired, or already used
 */
export async function verifyMagicLink(rawToken: string): Promise<string> {
  const db = getDb();

  // Hash the raw token
  const tokenHash = sha256(rawToken);
  const now = new Date().toISOString();

  // Look up token by hash
  const tokenRecord = db
    .prepare(
      `SELECT id, email FROM magic_link_tokens
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?`
    )
    .get(tokenHash, now) as { id: number; email: string } | undefined;

  if (!tokenRecord) {
    throw new AppError(401, 'INVALID_TOKEN', 'Magic link is invalid, expired, or already used');
  }

  // Mark token as used
  db.prepare('UPDATE magic_link_tokens SET used_at = ? WHERE id = ?').run(now, tokenRecord.id);

  // Look up user by email
  let user = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(tokenRecord.email) as User | undefined;

  // If user doesn't exist, create one
  if (!user) {
    db.prepare('INSERT INTO users (email, created_at, updated_at) VALUES (?, ?, ?)').run(
      tokenRecord.email,
      now,
      now
    );

    user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(tokenRecord.email) as User | undefined;

    if (!user) {
      throw new AppError(500, 'USER_CREATE_FAILED', 'Failed to create user');
    }
  }

  // Create session and return JWT
  const jwt = await createSession(user.id);
  return jwt;
}

/**
 * Send a magic link email to a user.
 * Uses Resend in production, Nodemailer + Ethereal in development.
 *
 * @param email - Recipient email address
 * @param token - Raw token to include in link
 */
export async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  const link = `${config.MAGIC_LINK_BASE_URL}/auth/verify?token=${token}`;

  if (config.NODE_ENV === 'production' && config.RESEND_API_KEY) {
    // Use Resend in production
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(config.RESEND_API_KEY);

      await resend.emails.send({
        from: config.EMAIL_FROM,
        to: email,
        subject: 'Your VAWT Magic Link',
        html: `
          <p>Click the link below to sign in to VAWT:</p>
          <p><a href="${link}">Sign In to VAWT</a></p>
          <p>This link expires in 15 minutes.</p>
          <p>If you didn't request this link, you can safely ignore this email.</p>
        `,
      });
    } catch (error) {
      console.error('Failed to send magic link email via Resend:', error);
      throw new AppError(500, 'EMAIL_SEND_FAILED', 'Failed to send magic link email');
    }
  } else {
    // Use Nodemailer + Ethereal in development
    try {
      const nodemailer = await import('nodemailer');

      // Create test account if in development
      const testAccount = await nodemailer.default.createTestAccount();
      const transporter = nodemailer.default.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const info = await transporter.sendMail({
        from: config.EMAIL_FROM,
        to: email,
        subject: 'Your VAWT Magic Link',
        html: `
          <p>Click the link below to sign in to VAWT:</p>
          <p><a href="${link}">Sign In to VAWT</a></p>
          <p>This link expires in 15 minutes.</p>
          <p>If you didn't request this link, you can safely ignore this email.</p>
        `,
      });

      // Log preview URL in development
      console.log('Magic link email sent. Preview URL:', nodemailer.default.getTestMessageUrl(info));
    } catch (error) {
      console.error('Failed to send magic link email via Nodemailer:', error);
      throw new AppError(500, 'EMAIL_SEND_FAILED', 'Failed to send magic link email');
    }
  }
}
