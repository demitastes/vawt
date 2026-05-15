import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Brackets routes - placeholder for future implementation
 * Will handle:
 * - POST /api/brackets
 * - GET /api/brackets/:id
 * - PUT /api/brackets/:id/picks
 * - GET /api/brackets/:id/score
 * - GET /api/users/me/brackets
 * - GET /api/tournaments/:year/leaderboard
 */

router.all('*', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Bracket prediction endpoints coming in a future phase',
  });
});

export default router;
