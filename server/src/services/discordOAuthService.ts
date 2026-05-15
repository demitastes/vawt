import { getDb } from '../db/client';
import config from '../config';
import { randomBytes } from '../utils/crypto';
import { AppError } from '../middleware/errorHandler';

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  email: string | null;
  avatar: string | null;
}

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface User {
  id: number;
  email: string | null;
  discord_id: string | null;
  discord_username: string | null;
  display_name: string | null;
  is_admin: number;
  created_at: string;
  updated_at: string;
}

/**
 * Generate Discord OAuth authorization URL.
 *
 * @param state - Optional state nonce for CSRF protection. Generated if not provided.
 * @returns Authorization URL to redirect the user to
 */
export function generateAuthUrl(state?: string): { url: string; state: string } {
  if (!config.DISCORD_CLIENT_ID) {
    throw new AppError(500, 'DISCORD_NOT_CONFIGURED', 'Discord OAuth not configured');
  }

  const generatedState = state || randomBytes(32);

  const params = new URLSearchParams({
    client_id: config.DISCORD_CLIENT_ID,
    redirect_uri: config.DISCORD_REDIRECT_URI || '',
    response_type: 'code',
    scope: 'identify email',
    state: generatedState,
  });

  const url = `https://discord.com/api/oauth2/authorize?${params.toString()}`;

  return { url, state: generatedState };
}

/**
 * Exchange Discord OAuth code for an access token.
 *
 * @param code - Authorization code from Discord callback
 * @returns Discord access token
 * @throws AppError if token exchange fails
 */
export async function exchangeCode(code: string): Promise<string> {
  if (!config.DISCORD_CLIENT_ID || !config.DISCORD_CLIENT_SECRET) {
    throw new AppError(500, 'DISCORD_NOT_CONFIGURED', 'Discord OAuth not configured');
  }

  const params = new URLSearchParams({
    client_id: config.DISCORD_CLIENT_ID,
    client_secret: config.DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.DISCORD_REDIRECT_URI || '',
  });

  try {
    const response = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AppError(401, 'OAUTH_EXCHANGE_FAILED', 'Failed to exchange code for token', {
        discord_error: error,
      });
    }

    const data = (await response.json()) as DiscordTokenResponse;
    return data.access_token;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, 'OAUTH_EXCHANGE_ERROR', 'Error during OAuth token exchange');
  }
}

/**
 * Fetch the authenticated Discord user's profile.
 *
 * @param accessToken - Discord OAuth access token
 * @returns Discord user information
 * @throws AppError if API call fails
 */
export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  try {
    const response = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new AppError(401, 'DISCORD_FETCH_FAILED', 'Failed to fetch Discord user profile');
    }

    const user = (await response.json()) as DiscordUser;
    return user;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, 'DISCORD_API_ERROR', 'Error fetching Discord user profile');
  }
}

/**
 * Look up or create a user by Discord ID.
 * If user exists, update discord_username.
 *
 * @param discordUser - Discord user profile from /users/@me
 * @returns User row
 */
export function upsertUser(discordUser: DiscordUser): User {
  const db = getDb();
  const now = new Date().toISOString();

  // Look up by discord_id
  let user = db
    .prepare('SELECT * FROM users WHERE discord_id = ?')
    .get(discordUser.id) as User | undefined;

  if (user) {
    // Update discord_username and updated_at
    db.prepare('UPDATE users SET discord_username = ?, updated_at = ? WHERE id = ?').run(
      discordUser.username,
      now,
      user.id
    );

    // Fetch updated user
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as User | undefined;
    if (!user) {
      throw new AppError(500, 'USER_UPDATE_FAILED', 'Failed to update user');
    }
  } else {
    // Create new user with discord_id and email (if provided by Discord)
    db.prepare(
      `INSERT INTO users (email, discord_id, discord_username, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(discordUser.email || null, discordUser.id, discordUser.username, now, now);

    user = db
      .prepare('SELECT * FROM users WHERE discord_id = ?')
      .get(discordUser.id) as User | undefined;

    if (!user) {
      throw new AppError(500, 'USER_CREATE_FAILED', 'Failed to create user');
    }
  }

  return user;
}

/**
 * Link a Discord account to an existing email-based user.
 * Used when a user with an email account wants to connect their Discord account.
 *
 * @param userId - User ID to link to
 * @param discordId - Discord user ID
 * @param discordUsername - Discord username
 * @throws AppError if Discord ID is already linked to another user
 */
export function linkDiscordToEmail(
  userId: number,
  discordId: string,
  discordUsername: string
): void {
  const db = getDb();
  const now = new Date().toISOString();

  // Check if discord_id is already linked to another user
  const existing = db
    .prepare('SELECT id FROM users WHERE discord_id = ? AND id != ?')
    .get(discordId, userId) as { id: number } | undefined;

  if (existing) {
    throw new AppError(
      409,
      'DISCORD_ALREADY_LINKED',
      'This Discord account is already linked to another user'
    );
  }

  // Update user with discord_id and discord_username
  db.prepare(
    'UPDATE users SET discord_id = ?, discord_username = ?, updated_at = ? WHERE id = ?'
  ).run(discordId, discordUsername, now, userId);
}
