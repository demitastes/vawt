import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { AppError } from './errorHandler';
import config from '../config';

/**
 * Require service key authentication middleware.
 *
 * Validates X-Service-Key header against SERVICE_KEY from config.
 * Uses timingSafeEqual for constant-time comparison to prevent timing attacks.
 *
 * Returns 403 if key is missing or mismatched.
 */
export const requireServiceKey = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const serviceKey = req.headers['x-service-key'] as string | undefined;

    if (!serviceKey) {
      throw new AppError(
        403,
        'MISSING_SERVICE_KEY',
        'X-Service-Key header is required'
      );
    }

    // Use timingSafeEqual for constant-time comparison
    const providedBuffer = Buffer.from(serviceKey);
    const expectedBuffer = Buffer.from(config.SERVICE_KEY);

    // Lengths must match for timingSafeEqual
    if (providedBuffer.length !== expectedBuffer.length) {
      throw new AppError(
        403,
        'INVALID_SERVICE_KEY',
        'Service key is invalid'
      );
    }

    const isValid = timingSafeEqual(providedBuffer, expectedBuffer);

    if (!isValid) {
      throw new AppError(
        403,
        'INVALID_SERVICE_KEY',
        'Service key is invalid'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
