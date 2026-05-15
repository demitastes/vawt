import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import { getDb } from '../db/client';
import { AppError } from './errorHandler';
import config from '../config';

/**
 * User information attached to req.user by auth middleware.
 */
export interface AuthUser {
  id: number;
  email: string | null;
  discord_id: string | null;
}

/**
 * Extend Express Request to include optional user.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Verify JWT token and check if session is revoked.
 *
 * @param token - The JWT token string
 * @returns User information from the token
 * @throws AppError if token is invalid or session is revoked
 */
async function verifyJWT(token: string): Promise<AuthUser> {
  try {
    const secret = new TextEncoder().encode(config.JWT_SECRET);
    const verified = await jose.jwtVerify(token, secret);

    const payload = verified.payload as Record<string, unknown>;
    const sessionId = payload.sessionId as string | undefined;

    if (!sessionId) {
      throw new AppError(401, 'INVALID_TOKEN', 'Token does not contain session ID');
    }

    // Check if session is revoked
    const db = getDb();
    const session = db
      .prepare('SELECT id, revoked_at FROM sessions WHERE id = ?')
      .get(sessionId) as { id: string; revoked_at: string | null } | undefined;

    if (!session) {
      throw new AppError(401, 'SESSION_NOT_FOUND', 'Session not found');
    }

    if (session.revoked_at !== null) {
      throw new AppError(401, 'SESSION_REVOKED', 'Session has been revoked');
    }

    // Extract user ID from 'sub' claim (standard JWT claim)
    const sub = payload.sub as string | undefined;
    if (!sub) {
      throw new AppError(401, 'INVALID_TOKEN', 'Token does not contain user ID');
    }

    const userId = parseInt(sub, 10);
    if (isNaN(userId)) {
      throw new AppError(401, 'INVALID_TOKEN', 'Token user ID is not a valid number');
    }

    const user = db
      .prepare('SELECT id, email, discord_id FROM users WHERE id = ?')
      .get(userId) as AuthUser | undefined;

    if (!user) {
      throw new AppError(401, 'USER_NOT_FOUND', 'User not found');
    }

    return user;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof jose.errors.JWTExpired) {
      throw new AppError(401, 'TOKEN_EXPIRED', 'Token has expired');
    }

    if (error instanceof jose.errors.JWTInvalid) {
      throw new AppError(401, 'INVALID_TOKEN', 'Token is invalid');
    }

    throw new AppError(401, 'INVALID_TOKEN', 'Failed to verify token');
  }
}

/**
 * Require authentication middleware.
 *
 * Verifies JWT from Authorization: Bearer <token> header.
 * Attaches user info to req.user.
 * Returns 401 if token is missing, invalid, or session is revoked.
 */
export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(
        401,
        'MISSING_TOKEN',
        'Authorization header with Bearer token is required'
      );
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    const user = await verifyJWT(token);
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware.
 *
 * Verifies JWT from Authorization: Bearer <token> header if present.
 * Attaches user info to req.user if token is valid.
 * Does not require token; req.user will be undefined if missing or invalid.
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth header provided; continue without user
      next();
      return;
    }

    const token = authHeader.slice(7);

    const user = await verifyJWT(token);
    req.user = user;

    next();
  } catch (error) {
    // Ignore auth errors in optional auth; continue without user
    if (error instanceof AppError && error.statusCode === 401) {
      next();
      return;
    }
    next(error);
  }
};
