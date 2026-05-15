import { Router } from 'express';
import healthRouter from './health';
import tournamentsRouter from './tournaments';
import distilleriesRouter from './distilleries';
import authRouter from './auth';
import votesRouter from './votes';
import bracketsRouter from './brackets';
import usersRouter from './users';
import adminRouter from './admin';

const router = Router();

/**
 * Mount all API route handlers under /api
 *
 * Route organization:
 * - /health: deployment health checks
 * - /tournaments: public tournament data (read-only)
 * - /distilleries: public distillery registry (read-only)
 * - /auth: authentication flows (magic link, Discord OAuth, etc.)
 * - /votes: voting and vote tallying (requires auth or service key)
 * - /brackets: bracket predictions (requires auth)
 * - /users: user profiles and preferences (requires auth)
 * - /admin: admin operations (requires auth + admin role)
 */

router.use('/health', healthRouter);
router.use('/tournaments', tournamentsRouter);
router.use('/distilleries', distilleriesRouter);
router.use('/auth', authRouter);
router.use('/votes', votesRouter);
router.use('/brackets', bracketsRouter);
router.use('/users', usersRouter);
router.use('/admin', adminRouter);

export default router;
