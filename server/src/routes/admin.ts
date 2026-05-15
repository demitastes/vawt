import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Admin routes - placeholder for future implementation
 * Will handle:
 * - POST /api/admin/votes/import
 * - POST /api/admin/tournaments/:year/schedule/import
 * - PUT /api/admin/tournaments/:year/bouts/:boutId/schedule
 * - POST /api/admin/tournaments/:year/bouts/:boutId/open
 * - POST /api/admin/tournaments/:year/bouts/:boutId/close
 * - POST /api/admin/tournaments/:year/bouts/:boutId/reopen
 * - POST /api/admin/bouts/:boutId/result
 * - POST /api/admin/data/reload
 * - GET /api/admin/votes
 */

router.all('*', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Admin endpoints coming in a future phase',
  });
});

export default router;
