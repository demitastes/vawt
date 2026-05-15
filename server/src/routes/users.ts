import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Users routes - placeholder for future implementation
 * Will handle:
 * - GET /api/users/me/tournaments/:year/active-bouts (shared with votes)
 * - GET /api/users/me/brackets
 * And other user profile endpoints
 */

router.all('*', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'User endpoints coming in a future phase',
  });
});

export default router;
