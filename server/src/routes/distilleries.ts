import { Router, Request, Response, NextFunction } from 'express';
import { getDistilleries, getDistillery } from '../data/loader';

const router = Router();

class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * GET /distilleries
 * Get full distillery registry
 */
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const distilleries = getDistilleries();
    res.json({
      version: 1,
      distilleries,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /distilleries/:id
 * Get a single distillery by ID
 */
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const distillery = getDistillery(req.params.id);
    if (!distillery) {
      throw new AppError(
        404,
        'NOT_FOUND',
        `Distillery ${req.params.id} not found`
      );
    }
    res.json(distillery);
  } catch (error) {
    next(error);
  }
});

export default router;
