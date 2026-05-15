import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getDb } from '../db/client';
import { AppError } from '../middleware/errorHandler';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import * as authService from '../services/authService';
import * as magicLinkService from '../services/magicLinkService';
import * as discordOAuthService from '../services/discordOAuthService';

const router = Router();

/**
 * Request magic link schema
 */
const requestMagicLinkSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * POST /api/auth/magic-link/request
 * Send a magic link email to the user.
 * Returns 200 regardless of whether the email exists (for security).
 */
router.post(
  '/magic-link/request',
  validateRequest('body', requestMagicLinkSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body as z.infer<typeof requestMagicLinkSchema>;

      // Generate magic link token
      const token = magicLinkService.generateMagicLink(email);

      // Send email
      try {
        await magicLinkService.sendMagicLinkEmail(email, token);
      } catch (error) {
        // Log error but don't fail the request
        console.error('Failed to send magic link email:', error);
        // Still return 200 to avoid revealing whether email exists
      }

      // Always return 200 to avoid revealing whether email exists
      res.json({
        message: 'If the email is registered, a magic link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/auth/magic-link/verify?token=<token>
 * Verify a magic link token and issue a JWT.
 */
router.get(
  '/magic-link/verify',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.query;

      if (typeof token !== 'string' || !token) {
        throw new AppError(400, 'MISSING_TOKEN', 'Magic link token is required');
      }

      // Verify magic link and get JWT
      const jwt = await magicLinkService.verifyMagicLink(token);

      res.json({
        token: jwt,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/auth/discord/authorize
 * Redirect to Discord OAuth authorization.
 * Optional query param: link=true to link Discord to existing account (requires auth)
 */
router.get(
  '/discord/authorize',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { link } = req.query;
      const isLinking = link === 'true';

      if (isLinking && !req.user) {
        throw new AppError(
          401,
          'NOT_AUTHENTICATED',
          'You must be logged in to link Discord account'
        );
      }

      // Generate state nonce
      let state = discordOAuthService.generateAuthUrl().state;

      // If linking, encode user ID in state for later verification
      if (isLinking && req.user) {
        const stateData = JSON.stringify({ pending_link_for_user_id: req.user.id });
        state = Buffer.from(stateData).toString('base64url');
      }

      const { url } = discordOAuthService.generateAuthUrl(state);

      // Return URL for frontend to handle redirect (not doing server-side redirect)
      res.json({
        authorize_url: url,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Linking state type
 */
interface LinkingState {
  pending_link_for_user_id?: number;
}

/**
 * GET /api/auth/discord/callback?code=<code>&state=<state>
 * Exchange Discord code for token, upsert user, create session, return JWT.
 */
router.get(
  '/discord/callback',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, state } = req.query;

      if (typeof code !== 'string' || !code) {
        throw new AppError(400, 'MISSING_CODE', 'Discord authorization code is required');
      }

      if (typeof state !== 'string' || !state) {
        throw new AppError(400, 'MISSING_STATE', 'State parameter is required');
      }

      // Decode state to check if this is a linking request
      let linkingState: LinkingState = {};
      try {
        const decodedState = Buffer.from(state, 'base64url').toString('utf-8');
        linkingState = JSON.parse(decodedState) as LinkingState;
      } catch {
        // State is not a JSON blob, it's just a nonce
        linkingState = {};
      }

      // Exchange code for access token
      const accessToken = await discordOAuthService.exchangeCode(code);

      // Fetch Discord user profile
      const discordUser = await discordOAuthService.fetchDiscordUser(accessToken);

      if (linkingState.pending_link_for_user_id) {
        // Linking flow: attach Discord to existing email user
        const userId = linkingState.pending_link_for_user_id;

        // Verify the user exists
        const db = getDb();
        const user = db
          .prepare('SELECT id FROM users WHERE id = ?')
          .get(userId) as { id: number } | undefined;

        if (!user) {
          throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
        }

        // Link Discord to this user
        discordOAuthService.linkDiscordToEmail(
          userId,
          discordUser.id,
          discordUser.username
        );

        // Create new session
        const jwt = await authService.createSession(userId);

        res.json({
          token: jwt,
          message: 'Discord account linked successfully',
        });
      } else {
        // Normal OAuth flow: upsert user and create session
        const user = discordOAuthService.upsertUser(discordUser);

        // Create session
        const jwt = await authService.createSession(user.id);

        res.json({
          token: jwt,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/discord/link
 * Initiate linking a Discord account to the current email-based user.
 * Returns authorization URL for frontend to redirect to.
 * This endpoint is deprecated in favor of GET /api/auth/discord/authorize?link=true
 */
router.post(
  '/discord/link',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'NOT_AUTHENTICATED', 'User not authenticated');
      }

      // Encode user ID in state
      const stateData = JSON.stringify({ pending_link_for_user_id: req.user.id });
      const state = Buffer.from(stateData).toString('base64url');

      const { url } = discordOAuthService.generateAuthUrl(state);

      res.json({
        authorize_url: url,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/logout
 * Revoke the current session.
 */
router.post(
  '/logout',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'NOT_AUTHENTICATED', 'User not authenticated');
      }

      // Extract session ID from JWT
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new AppError(401, 'MISSING_TOKEN', 'Authorization header is required');
      }

      const token = authHeader.slice(7);

      // Decode JWT to get session ID (without verifying signature)
      try {
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid JWT format');
        }

        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8')) as Record<
          string,
          unknown
        >;
        const sessionId = payload.sessionId as string | undefined;

        if (sessionId) {
          authService.revokeSession(sessionId);
        }
      } catch (error) {
        console.error('Failed to extract and revoke session:', error);
        // Continue anyway; the JWT will still expire
      }

      res.json({
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/auth/me
 * Return current user profile.
 */
router.get(
  '/me',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'NOT_AUTHENTICATED', 'User not authenticated');
      }

      // Fetch full user profile
      const db = getDb();
      const user = db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get(req.user.id) as any;

      if (!user) {
        throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
      }

      res.json({
        id: user.id,
        email: user.email,
        discord_id: user.discord_id,
        discord_username: user.discord_username,
        display_name: user.display_name,
        is_admin: user.is_admin === 1,
        created_at: user.created_at,
        updated_at: user.updated_at,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
