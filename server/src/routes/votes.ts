import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Votes routes - placeholder for future implementation
 * Will handle:
 * - POST /api/tournaments/:year/bouts/:boutId/vote
 * - GET /api/tournaments/:year/bouts/:boutId/votes
 * - GET /api/tournaments/:year/votes
 * - GET /api/users/me/tournaments/:year/active-bouts
 */

router.all('*', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Voting endpoints coming in a future phase',
  });
});

export default router;
